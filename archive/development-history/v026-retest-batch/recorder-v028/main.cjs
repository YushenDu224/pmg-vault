// Separate recording process. Captures exactly one native window, never a display.
const { app, BrowserWindow, desktopCapturer, ipcMain, session } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'recording-v028');
const movie = path.join(output, 'pmg-app.webm');
const partial = movie + '.part';
const stopFlag = path.join(output, 'stop-recording.flag');
const reportFile = path.join(output, 'recording-metadata.json');
const targetName = 'PMG库 · 钞票档案';
const pageFile = path.join(__dirname, 'index.html');
const pageURL = pathToFileURL(pageFile).href;
app.setPath('userData', path.join(__dirname, 'runtime'));

let window;
let handle;
let polling;
let deadline;
let startupDeadline;
let stopping = false;
let finished = false;
let granted = false;
let chunkBytes = 0;
let writeQueue = Promise.resolve();
let reportOwned = false;
const report = {
  requestedSourceName: targetName,
  requestedAt: new Date().toISOString(),
  captureType: 'native-window-video',
  audio: false,
  maximumDurationSeconds: 120,
  events: []
};

async function saveReport() {
  await fs.writeFile(reportFile, JSON.stringify(report, null, 2) + '\n', { flag: reportOwned ? 'w' : 'wx' });
  reportOwned = true;
}

function trusted(event) {
  if (event.sender !== window?.webContents || event.senderFrame !== window.webContents.mainFrame ||
      event.senderFrame.url !== pageURL) throw Error('Unexpected recorder IPC sender');
}

async function fail(error) {
  if (finished) return;
  finished = true;
  clearInterval(polling);
  clearTimeout(deadline);
  clearTimeout(startupDeadline);
  report.status = 'failed';
  report.endedAt = new Date().toISOString();
  report.error = String(error.message || error);
  report.requiresUserAction = /NotAllowed|InvalidState|permission|gesture|focus|denied/i.test(report.error);
  report.guidance = report.requiresUserAction
    ? 'The normal capture API requires user action or permission. Stop and hand the system selection/permission prompt to the user. Do not use another API to evade it.'
    : 'Inspect the failure before retrying. No broader capture source was selected.';
  try { await writeQueue; } catch {}
  if (handle) { await handle.close().catch(() => {}); handle = null; }
  if (reportOwned) await saveReport();
  console.error(report.error);
  app.exit(1);
}

function requestStop(reason) {
  if (stopping || finished) return;
  stopping = true;
  report.stopReason = reason;
  report.stopRequestedAt = new Date().toISOString();
  window.webContents.send('recorder:stop');
  setTimeout(() => fail(Error('Recorder did not finalize after stop request')), 12000).unref();
}

async function start() {
  await fs.mkdir(output, { recursive: true });
  for (const file of [movie, partial, reportFile, stopFlag]) {
    try { await fs.access(file); throw Error('Recording output or stop flag already exists: ' + file); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  await saveReport();
  await app.whenReady();
  const captureSession = session.fromPartition('pmg-window-recorder-' + Date.now());
  window = new BrowserWindow({
    show: false,
    width: 480,
    height: 180,
    title: 'PMG isolated window recorder',
    webPreferences: {
      session: captureSession,
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      devTools: false
    }
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', event => event.preventDefault());
  captureSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] },
    (_, callback) => callback({ cancel: true }));
  captureSession.setPermissionCheckHandler((contents, permission) =>
    contents === window.webContents && permission === 'display-capture');
  captureSession.setPermissionRequestHandler((contents, permission, callback) =>
    callback(contents === window.webContents && permission === 'display-capture'));
  captureSession.setDisplayMediaRequestHandler(async (request, callback) => {
    try {
      if (granted || request.frame !== window.webContents.mainFrame || request.audioRequested || !request.videoRequested) {
        callback(null);
        return;
      }
      const sources = await desktopCapturer.getSources({ types: ['window'], thumbnailSize: { width: 0, height: 0 }, fetchWindowIcons: false });
      const matches = sources.filter(source => source.name === targetName && source.id.startsWith('window:'));
      report.matchedSourceCount = matches.length;
      if (matches.length !== 1) {
        throw Error('Expected exactly one matching PMG window, found ' + matches.length);
      }
      const selected = matches[0];
      report.source = { name: selected.name, id: selected.id };
      report.request = {
        videoRequested: request.videoRequested,
        audioRequested: request.audioRequested,
        userGesture: request.userGesture,
        securityOrigin: request.securityOrigin
      };
      granted = true;
      await saveReport();
      callback({ video: selected });
    } catch (error) {
      // A rejected or cancelled normal source request is never retried via legacy capture.
      if (!granted) { try { callback(null); } catch {} }
      await fail(error);
    }
  });

  ipcMain.handle('recorder:started', async (event, metadata) => {
    trusted(event);
    if (!granted || report.startedAt) throw Error('Invalid recorder start');
    if (metadata.audioTracks !== 0 || metadata.videoTracks !== 1) throw Error('Unexpected stream tracks');
    handle = await fs.open(partial, 'wx');
    report.startedAt = new Date().toISOString();
    report.status = 'recording';
    report.media = metadata;
    clearTimeout(startupDeadline);
    await saveReport();
    deadline = setTimeout(() => requestStop('120-second-limit'), 120000);
    polling = setInterval(async () => {
      try { await fs.access(stopFlag); requestStop('stop-recording.flag'); }
      catch (error) { if (error.code !== 'ENOENT') await fail(error); }
    }, 400);
    console.log('RECORDING_STARTED ' + report.startedAt + ' ' + targetName);
  });
  ipcMain.handle('recorder:chunk', async (event, bytes) => {
    trusted(event);
    if (!handle || finished || !(bytes instanceof Uint8Array)) throw Error('Invalid video chunk');
    const next = writeQueue.then(async () => {
      const buffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      let offset = 0;
      while (offset < buffer.length) {
        const result = await handle.write(buffer, offset, buffer.length - offset);
        offset += result.bytesWritten;
      }
      chunkBytes += buffer.length;
    });
    writeQueue = next;
    await next;
  });
  ipcMain.handle('recorder:finished', async event => {
    trusted(event);
    if (finished) return;
    await writeQueue;
    if (!handle || chunkBytes < 4) throw Error('Recorded stream is empty');
    await handle.sync();
    await handle.close();
    handle = null;
    await fs.rename(partial, movie);
    clearInterval(polling);
    clearTimeout(deadline);
    finished = true;
    report.status = 'complete';
    report.endedAt = new Date().toISOString();
    report.bytes = chunkBytes;
    report.output = movie;
    report.stopReason ??= 'stream-ended';
    await saveReport();
    console.log('RECORDING_COMPLETE ' + movie + ' ' + chunkBytes);
    setImmediate(() => app.quit());
  });
  ipcMain.handle('recorder:error', async (event, details) => {
    trusted(event);
    await fail(Error(String(details)));
  });
  window.webContents.on('render-process-gone', (_, details) => fail(Error('Recorder renderer stopped: ' + details.reason)));
  startupDeadline = setTimeout(() => fail(Error('Normal display-capture startup timed out. A user focus/permission action may be required.')), 20000);
  await window.loadFile(pageFile);
}

start().catch(fail);

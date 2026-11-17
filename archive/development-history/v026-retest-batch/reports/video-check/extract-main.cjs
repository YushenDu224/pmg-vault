// Offline decoder only: no screen/window capture, no connection to the PMG app.
const { app, BrowserWindow, ipcMain, session } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createHash } = require('node:crypto');
const output = __dirname;
const source = path.resolve(output, '../../recording/pmg-app.webm');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const reportPath = path.join(output, 'decode-report.json');
const frames = [];
let sourceBefore;
let window;
let finished = false;
app.setPath('userData', path.join(output, 'decoder-runtime'));
app.commandLine.appendSwitch('disable-background-networking');
app.commandLine.appendSwitch('disable-component-update');
const deadline = setTimeout(() => finish({ error: 'Offline decoder timed out' }, 1), 60000);
async function finish(metadata, code = 0) {
  if (finished) return;
  finished = true;
  clearTimeout(deadline);
  try {
    const sourceAfter = sha256(await fs.readFile(source));
    await fs.writeFile(reportPath, JSON.stringify({
      purpose: 'Offline inspection of an existing recording; not a new capture',
      source,
      sourceBytes: sourceBefore?.length,
      sourceSHA256Before: sourceBefore?.sha256,
      sourceSHA256After: sourceAfter,
      originalUnchanged: sourceBefore?.sha256 === sourceAfter,
      decodedAt: new Date().toISOString(),
      metadata,
      frames
    }, null, 2) + '\n', { flag: 'wx' });
    console.log(JSON.stringify({ code, reportPath, frames: frames.map(frame => frame.file), error: metadata.error }));
  } catch (error) { console.error(error.stack); code = 1; }
  window?.destroy();
  app.exit(code);
}
app.whenReady().then(async () => {
  try {
    await fs.access(reportPath).then(() => { throw Error('Refusing to overwrite existing decoder report'); }, () => {});
    const bytes = await fs.readFile(source);
    sourceBefore = { length: bytes.length, sha256: sha256(bytes) };
    const decoderSession = session.fromPartition('offline-video-check');
    decoderSession.webRequest.onBeforeRequest((details, callback) => {
      callback({ cancel: !/^(file|data|blob):/.test(details.url) });
    });
    window = new BrowserWindow({
      show: false,
      width: 640,
      height: 360,
      webPreferences: {
        preload: path.join(output, 'extract-preload.cjs'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        backgroundThrottling: false,
        session: decoderSession
      }
    });
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    const localPage = pathToFileURL(path.join(output, 'extract.html')).href;
    function validate(event) {
      if (event.sender !== window.webContents || event.senderFrame?.url !== localPage) throw Error('Unexpected decoder caller');
    }
    ipcMain.handle('offline:source', event => { validate(event); return pathToFileURL(source).href; });
    ipcMain.handle('offline:frame', async (event, frame) => {
      validate(event);
      if (![3, 40, 90].includes(frame.requestedTime) || frames.some(item => item.requestedTime === frame.requestedTime)) throw Error('Unexpected frame time');
      if (!frame.dataURL.startsWith('data:image/png;base64,') || frame.dataURL.length > 30_000_000) throw Error('Invalid frame payload');
      const file = path.join(output, `frame-${String(frame.requestedTime).padStart(3, '0')}s.png`);
      const bytes = Buffer.from(frame.dataURL.slice('data:image/png;base64,'.length), 'base64');
      await fs.writeFile(file, bytes, { flag: 'wx' });
      frames.push({ requestedTime: frame.requestedTime, decodedTime: frame.decodedTime, width: frame.width, height: frame.height, bytes: bytes.length, sha256: sha256(bytes), file });
      return true;
    });
    ipcMain.handle('offline:complete', async (event, metadata) => { validate(event); setImmediate(() => finish(metadata)); return true; });
    ipcMain.handle('offline:error', async (event, error) => { validate(event); setImmediate(() => finish({ error }, 1)); return true; });
    window.webContents.on('render-process-gone', (_, details) => finish({ error: 'Decoder renderer exited: ' + details.reason }, 1));
    await window.loadURL(localPage);
  } catch (error) { await finish({ error: error.stack }, 1); }
});

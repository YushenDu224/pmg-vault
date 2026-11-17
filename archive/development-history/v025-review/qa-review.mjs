import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const profile = await fs.mkdtemp(path.resolve('qa-profile-'));
const executable='C:/Users/John/Documents/ChatGPT/PMG查询记录套件/outputs/pmg-vault/versions/v019-windows-installer/node_modules/electron/dist/electron.exe';
const child = spawn(executable, [
  path.resolve('review-host.cjs'), '--remote-debugging-port=0', '--data-dir=' + profile
], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
let log = '';
child.stderr.setEncoding('utf8').on('data', chunk => { log += chunk; });
const waitFor = async (check, message) => {
  for (let i = 0; i < 100; i++) {
    const result = await check();
    if (result) return result;
    await delay(200);
  }
  throw new Error(message + '\n' + log.slice(-1500));
};
let socket;
try {
  const port = await waitFor(() => log.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/)?.[1], 'Debug endpoint did not start');
  const target = await waitFor(async () => {
    const pages = await fetch('http://127.0.0.1:' + port + '/json/list').then(response => response.json());
    return pages.find(page => page.url==='http://127.0.0.1:8876/');
  }, 'Preview page did not load');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let id = 0;
  async function call(method, params = {}) {
    const current = ++id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(method + ' timed out')), 5000);
      const onMessage = ({ data }) => {
        const message = JSON.parse(data);
        if (message.id !== current) return;
        clearTimeout(timer);
        socket.removeEventListener('message', onMessage);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result);
      };
      socket.addEventListener('message', onMessage);
      socket.send(JSON.stringify({ id: current, method, params }));
    });
  }
  async function evaluate(expression) {
    const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  }
  await call('Emulation.setDeviceMetricsOverride',{width:980,height:1200,deviceScaleFactor:1,mobile:false});
  await waitFor(()=>evaluate("document.querySelector('.desktop-image')?.naturalWidth>0"),'Review screenshot did not load');
  await evaluate("document.querySelector('[data-panel=android]').click()");
  await waitFor(()=>evaluate("[...document.querySelectorAll('iframe')].every(f=>f.contentDocument.querySelector('#query-form') && f.contentDocument.querySelector('#open-note img')?.naturalWidth>0)").catch(()=>false),'Android previews did not load');
  assert(await evaluate("!document.querySelector('#android').hidden && document.querySelector('#desktop').hidden"));
  await waitFor(()=>evaluate("[...document.querySelectorAll('iframe')].map(f=>f.contentDocument.documentElement.dataset.theme).join(',')==='light,dark'"),'Theme comparison did not apply');
  await delay(400);
  const screenshot=await call('Page.captureScreenshot',{format:'png'});
  await fs.writeFile('previews/android-compare.png',Buffer.from(screenshot.data,'base64'));
  await evaluate("document.querySelector('[data-route=query]').click()");
  await waitFor(()=>evaluate("[...document.querySelectorAll('iframe')].every(f=>!f.contentDocument.querySelector('#query-page').hidden)"),'Query route did not switch both frames');
  await evaluate("document.querySelector('[data-mode=system]').click()");
  await waitFor(()=>evaluate("[...document.querySelectorAll('iframe')].every(f=>f.contentDocument.documentElement.dataset.themeMode==='system')"),'System theme control did not reach both frames');
  await evaluate("document.querySelector('[data-mode=compare]').click();document.querySelector('[data-route=library]').click()");
  await evaluate("document.querySelector('[data-panel=scope]').click()");
  assert(await evaluate("!document.querySelector('#scope').hidden && document.querySelectorAll('#scope tbody tr').length===7"));
  console.log('PASS: preview portal, desktop image, both Android themes, route controls, system theme control and feature scope');
} finally {
  socket?.close();
  child.kill();
}



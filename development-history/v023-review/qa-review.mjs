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
    return pages.find(page => page.url==='http://127.0.0.1:8874/');
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
  await waitFor(()=>evaluate("document.querySelector('.desktop-image')?.naturalWidth>0"),'Review screenshot did not load');
  await evaluate("document.querySelector('[data-panel=android]').click()");
  await waitFor(()=>evaluate("document.querySelector('iframe').contentDocument.querySelector('#query-form')!==null").catch(()=>false),'Android preview did not load');
  assert(await evaluate("!document.querySelector('#android').hidden && document.querySelector('#desktop').hidden"));
  await evaluate("document.querySelector('[data-panel=scope]').click()");
  assert(await evaluate("!document.querySelector('#scope').hidden && document.querySelectorAll('#scope tbody tr').length===7"));
  console.log('PASS: preview portal, desktop image, Android frame and all feature scope rows');
} finally {
  socket?.close();
  child.kill();
}

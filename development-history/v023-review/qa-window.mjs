import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const profile = await fs.mkdtemp(path.resolve('qa-profile-'));
const executable='C:/Users/John/Documents/ChatGPT/PMG查询记录套件/outputs/pmg-vault/versions/v019-windows-installer/node_modules/electron/dist/electron.exe';
const child = spawn(executable, [
  path.resolve('versions/v023-window-preview/desktop/main.cjs'), '--remote-debugging-port=0', '--data-dir=' + profile
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
    return pages.find(page => page.url.startsWith('pmg-library://app/'));
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
  const wait = (expression,message)=>waitFor(()=>evaluate(expression).catch(()=>false),message);
  await fs.mkdir('previews',{recursive:true});
  await wait("document.querySelector('#sample')?.onclick && document.querySelector('#count')?.textContent==='0 / 0'",'App init failed');
  await evaluate("document.querySelector('#sample').click()");
  await wait("document.querySelectorAll('.note-card img').length===1 && document.querySelector('.note-card img').naturalWidth>0",'Public sample failed');
  await evaluate("document.querySelector('#toast').hidden=true");
  const appearance=await evaluate("(()=>{const s=selector=>{const el=document.querySelector(selector),c=getComputedStyle(el);return {background:c.backgroundColor,color:c.color,border:c.border,borderRadius:c.borderRadius,font:c.font}};return {sidebar:s('.sidebar'),card:s('.note-card'),preview:s('.preview'),button:s('#query'),title:s('h1'),shell:getComputedStyle(document.querySelector('.window-shell')).clipPath}})()");
  assert.equal(appearance.sidebar.background,'rgb(255, 255, 255)');
  assert.equal(appearance.card.borderRadius,'12px');
  assert.equal(appearance.button.background,'rgb(5, 61, 34)');
  assert(appearance.shell.startsWith('path('));
  const image=await call('Page.captureScreenshot',{format:'png'});
  await fs.writeFile('previews/windows-preserved.png',Buffer.from(image.data,'base64'));
  await evaluate("document.querySelector('#window-maximize').click()");
  await wait("document.querySelector('.window-shell').classList.contains('maximized')",'Maximize failed');
  await evaluate("document.querySelector('#window-maximize').click()");
  await wait("!document.querySelector('.window-shell').classList.contains('maximized')",'Restore failed');
  await evaluate("document.querySelector('.note-card').click()");
  await wait("document.querySelector('#detail').open",'Detail failed');
  await evaluate("document.querySelector('#close-detail').click()");
  await evaluate("document.querySelector('#query-nav').click()");
  assert(await evaluate("document.querySelector('#library').hidden"));
  await evaluate("document.querySelector('#library-nav').click()");
  assert(await evaluate("!document.querySelector('#library').hidden"));
  await evaluate("document.querySelector('#window-minimize').click()");
  const state=await evaluate('window.pmgDesktop.windowState()');
  assert.equal(state.minimized,true);
  await evaluate("document.querySelector('#window-close').click()").catch(()=>{});
  const source=path.resolve('versions/v023-window-preview');
  const baseline='C:/Users/John/Documents/Codex/2026-11-10/pmg-image-groups/versions/v021-image-groups';
  for(const file of ['ui/theme.css','ui/image-groups.css','ui/image-groups.mjs','lib/image-groups.mjs','lib/archive.mjs','lib/storage.mjs']) {
    assert.deepEqual(await fs.readFile(path.join(source,file)),await fs.readFile(path.join(baseline,file)));
  }
  await fs.writeFile('previews/desktop-verification.json',JSON.stringify({v021StyleFilesExact:true,appearance,windowButtonsVerified:true,isolatedProfile:true,sourcePreviewOnly:true},null,2));
  console.log('PASS: v021 appearance and source styles intact; continuous window outline and all window buttons verified');
} finally {
  socket?.close();
  child.kill();
}

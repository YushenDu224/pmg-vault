import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const profile = await fs.mkdtemp(path.resolve('qa-profile-'));
const executable = 'C:/Users/John/Documents/ChatGPT/PMG查询记录套件/outputs/pmg-vault/versions/v019-windows-installer/node_modules/electron/dist/electron.exe';
const child = spawn(executable, [
  path.resolve('qa-host.cjs'), '--remote-debugging-port=0', '--user-data-dir=' + profile
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
    return pages.find(page => page.url.startsWith('pmg-preview://app/'));
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
  const wait=(expression,message)=>waitFor(()=>evaluate(expression).catch(()=>false),message);
  await call('Emulation.setDeviceMetricsOverride',{width:400,height:890,deviceScaleFactor:3,mobile:true});
  await wait("document.querySelector('#open-note img')?.naturalWidth>0",'Library image missing');
  await fs.mkdir('screenshots',{recursive:true});
  async function screenshot(name){
    await delay(400);
    const result=await call('Page.captureScreenshot',{format:'png'});
    await fs.writeFile('screenshots/'+name+'.png',Buffer.from(result.data,'base64'));
  }
  const fits=()=>evaluate('document.documentElement.scrollWidth<=innerWidth');
  assert(await fits());
  await screenshot('android-library');
  await evaluate("document.querySelector('[data-page=query]').click()");
  assert(await fits());
  await screenshot('android-query');
  assert.equal(await evaluate("getComputedStyle(document.querySelector('#query-cert')).fontSize"),'16px');
  await evaluate("document.querySelector('#query-form').requestSubmit()");
  await wait("!document.querySelector('#capture-result').hidden",'Query demo result missing');
  await screenshot('android-query-result');
  await evaluate("document.querySelector('#open-query-note').click()");
  await wait("document.querySelector('#detail').open",'Detail did not open');
  assert(await evaluate("document.querySelector('#detail').scrollWidth<=innerWidth"));
  await screenshot('android-detail');
  await evaluate("document.querySelector('#new-group').click();const f=document.querySelector('#group-form');f.elements.name.value='My photos';f.elements.source.value='My camera';f.elements.url.value='https://example.com/photo';");
  const {root}=await call('DOM.getDocument');
  const {nodeId}=await call('DOM.querySelector',{nodeId:root.nodeId,selector:'#group-form [name=front]'});
  await call('DOM.setFileInputFiles',{nodeId,files:[path.resolve('assets/front.jpg')]});
  await wait("document.querySelector('[data-preview=front] img')?.naturalWidth>0",'Local image did not decode');
  await screenshot('android-upload');
  await evaluate("document.querySelector('#group-form').requestSubmit()");
  await wait("document.querySelector('#detail-panel').textContent.includes('My photos')",'New group missing');
  await evaluate("document.querySelector('#set-display').click()");
  assert(await evaluate("document.querySelector('#set-display').disabled"));
  await evaluate("document.querySelector('[data-tab=info]').click()");
  assert(await evaluate("document.querySelector('#detail-panel').textContent.includes('2020-10-13')"));
  await evaluate("document.querySelector('#close-detail').click();document.querySelector('[data-page=library]').click();document.querySelector('#search').value='no match';document.querySelector('#search').dispatchEvent(new Event('input'));");
  assert(await evaluate("document.querySelector('#library-count').textContent==='0 张藏品'"));
  await evaluate("document.querySelector('#search').value='8077301';document.querySelector('#search').dispatchEvent(new Event('input'));");
  assert(await evaluate("document.querySelector('#open-note')!==null"));
  await evaluate("document.querySelector('#open-note').click();document.querySelector('#delete-note').click();document.querySelector('[data-page=more]').click();document.querySelector('#trash-open').click();document.querySelector('#message-actions button').click();");
  assert(await evaluate("document.querySelector('#trash-summary').textContent.includes('暂无')"));
  await call('Emulation.setDeviceMetricsOverride',{width:360,height:800,deviceScaleFactor:1,mobile:true});
  assert(await fits());
  const report={viewport:{width:400,height:890},publicSampleOnly:true,queryDemo:true,localImagePicker:true,imageGroupSave:true,displayChoice:true,search:true,trashRestore:true,noHorizontalOverflow:[400,360],nativeAndroidApp:false};
  await fs.writeFile('screenshots/verification.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
} finally {
  socket?.close();
  child.kill();
}

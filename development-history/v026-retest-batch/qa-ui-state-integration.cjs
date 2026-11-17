const {app,BrowserWindow,ipcMain,protocol,session}=require('electron');
const fs=require('node:fs/promises'),path=require('node:path');
const source=path.join(__dirname,'versions/v028-state-sync');
app.setPath('userData',path.join(__dirname,'ui-fixture-'+Date.now()));
protocol.registerSchemesAsPrivileged([{scheme:'pmg-library',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true}}]);
app.whenReady().then(async()=>{
 const saved=JSON.parse(await fs.readFile(path.join(__dirname,'app-session-v027/collector-state.json'),'utf8'));
 const bytes=new Uint8Array(await fs.readFile(path.join(__dirname,'app-session-v027/inbox',saved.archiveId+'.pmgx')));
 const trace=[];let current={state:'idle',phase:'等待查询'},reads=0,finished=false;
 session.defaultSession.webRequest.onBeforeRequest({urls:['https://*/*','http://*/*']},(_,callback)=>callback({cancel:true}));
 protocol.handle('pmg-library',async request=>{const u=new URL(request.url);const name=u.pathname==='/'?'index.html':u.pathname.slice(1);const file=path.resolve(source,name);if(!file.startsWith(source+path.sep))return new Response('',{status:404});const types={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};try{return new Response(await fs.readFile(file),{headers:{'Content-Type':types[path.extname(file)]||'application/octet-stream'}});}catch{return new Response('',{status:404});}});
 const win=new BrowserWindow({show:false,width:1500,height:1000,webPreferences:{preload:path.join(source,'desktop/preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
 ipcMain.handle('pmg:window-state',()=>({maximized:false,minimized:false}));
 ipcMain.handle('pmg:migration',()=>null);
 ipcMain.handle('pmg:state',()=>{reads++;return current;});
 ipcMain.handle('pmg:archive',(_,id)=>{if(id!==saved.archiveId)throw Error('Unexpected fixture archive');return bytes;});
 ipcMain.handle('pmg:start',(_,input)=>{current={state:'loading',phase:'加载官网',query:input,updatedAt:new Date().toISOString()};setTimeout(()=>{current={...saved,updatedAt:new Date().toISOString()};},500);return current;});
 ipcMain.on('pmg:layout',()=>{});
 ipcMain.on('pmg:ui-state',(_,entry)=>trace.push(entry));
 ipcMain.on('pmg:ready',()=>win.webContents.send('pmg:query',saved.query));
 await win.loadURL('pmg-library://app/');
 const started=Date.now();
 const timer=setInterval(async()=>{
  if(finished)return;
  let ui={};try{ui=await win.webContents.executeJavaScript("({text:document.querySelector('#capture-state')?.textContent,badge:document.querySelector('#capture-result-badge')?.textContent,cards:document.querySelectorAll('.note-card').length,images:document.querySelectorAll('#capture-preview img').length})");}catch{}
  if((ui.badge==='已保存'&&ui.cards>=1&&ui.images===2)||Date.now()-started>12000){finished=true;clearInterval(timer);const report={pass:ui.badge==='已保存'&&ui.cards>=1&&ui.images===2,elapsedMs:Date.now()-started,pushStateEventsSent:0,stateReads:reads,networkRequestsAllowed:false,ui,trace};await fs.writeFile(path.join(__dirname,'reports/v028-offline-ui-integration.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));app.exit(report.pass?0:1);}
 },250);
}).catch(e=>{console.error(e.message);app.exit(1)});

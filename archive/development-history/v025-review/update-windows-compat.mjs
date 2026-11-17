import fs from 'node:fs/promises';
const root=process.cwd();
async function replace(file,before,after){let text=await fs.readFile(file,'utf8');if(!text.includes(before))throw Error('Missing edit point '+file+' '+before.slice(0,70));await fs.writeFile(file,text.replace(before,after));}
await replace('desktop/main.cjs',"const {createCaptureEngine}=require('./capture-engine.cjs');","const {createCaptureEngine}=require('./capture-engine.cjs');\nconst {configureOfficialContents,createBrowserDiagnostics}=require('./browser-compat.cjs');");
await replace('desktop/main.cjs',"view=new WebContentsView({webPreferences:{partition:'persist:pmg-collector',contextIsolation:true,nodeIntegration:false,sandbox:true}});", "view=new WebContentsView({webPreferences:{partition:'persist:pmg-collector',javascript:true,contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true,backgroundThrottling:false}});");
await replace('desktop/main.cjs',"view.webContents.setWindowOpenHandler(({url})=>{if(officialPage(url))view.webContents.loadURL(url);return {action:'deny'};});view.webContents.on('will-navigate',(event,url)=>{if(!officialPage(url))event.preventDefault();});view.webContents.session.setPermissionRequestHandler((_,__,callback)=>callback(false));", "configureOfficialContents(view.webContents,{partition:'persist:pmg-collector',parent:win});\n  view.webContents.session.setPermissionRequestHandler((_,__,callback)=>callback(false));\n  const diagnostics=createBrowserDiagnostics(view.webContents);");
await replace('desktop/main.cjs',"const handlers={'pmg:start'", "const handlers={'pmg:open-official':async()=>{const query=engine.getState().query;if(!query)throw Error('请先输入评级号码和评分');const {queryUrl}=await import(require('node:url').pathToFileURL(path.join(root,'lib/domain.mjs')));await shell.openExternal(queryUrl(query.site,query.cert,query.grade));return true;},'pmg:diagnostics':async()=>{const report=diagnostics.report();const selected=await dialog.showSaveDialog(win,{title:'保存浏览器诊断',defaultPath:'PMG-browser-diagnostics.json',filters:[{name:'JSON',extensions:['json']}]});if(selected.canceled)return {canceled:true};await fs.writeFile(selected.filePath,JSON.stringify(report,null,2));return {canceled:false};},'pmg:start'");
await replace('desktop/preload.cjs',"readMigration:()=>", "openOfficial:()=>ipcRenderer.invoke('pmg:open-official'),exportDiagnostics:()=>ipcRenderer.invoke('pmg:diagnostics'),\nreadMigration:()=>");
await replace('index.html','<div class="capture-tools-actions"><button id="capture-reload"','<div class="capture-tools-actions"><button id="capture-browser" hidden>系统浏览器对比</button><button id="capture-diagnostics" hidden>保存诊断</button><button id="capture-reload"');
await replace('ui/capture-workspace.mjs',"function setControls(){const saving=state.state==='saving';", "function setControls(){const saving=state.state==='saving';$('capture-browser').disabled=!active||saving;");
await replace('ui/capture-workspace.mjs',"if(bridge){bridge.onState", "if(bridge){$('capture-browser').hidden=false;$('capture-diagnostics').hidden=false;$('capture-browser').onclick=async()=>{try{await bridge.openOfficial();notify('已打开系统浏览器用于对比验证；其中的查询不会自动加入库。');}catch(error){notify(error.message);}};$('capture-diagnostics').onclick=async()=>{try{const result=await bridge.exportDiagnostics();if(!result.canceled)notify('已保存诊断，不包含 Cookie、令牌或完整网址。');}catch(error){notify(error.message);}};bridge.onState");
await replace('desktop/capture-engine.cjs',"const {officialPage:official}=require('./view-policy.cjs');", "const {officialPage:official}=require('./view-policy.cjs');const {captureFullPage}=require('./browser-compat.cjs');");
await replace('desktop/capture-engine.cjs',"let request=null,busy=false,done=false,stable='',ticks=0,sequence=0,state=", "let request=null,busy=false,inspecting=false,done=false,stable='',ticks=0,sequence=0,nextProbeAt=0,state=");
const engine=await fs.readFile('desktop/capture-engine.cjs','utf8');
const oldShot=engine.slice(engine.indexOf("try{if(!view.webContents.debugger.isAttached())"),engine.indexOf("try{const p=path.join(folder,'page.mhtml')"));
if(!oldShot)throw Error('Screenshot edit missing');
await replace('desktop/capture-engine.cjs',oldShot,"try{await add('captures/'+id+'/screenshot.png',await captureFullPage(view.webContents),{role:'screenshot',mediaType:'image/png'});}catch(e){const pic=await view.webContents.capturePage();await add('captures/'+id+'/viewport.png',pic.toPNG(),{role:'screenshot',mediaType:'image/png'});failures.push('整页截图失败，已保存可见区域截图');}\n");
const oldInspect=engine.slice(engine.indexOf('async function inspect(){'),engine.indexOf('async function start(input){'));
const newInspect=`// Challenge checks read only a small readiness probe; full HTML is collected after the page is ready.
const probeCode=\`(()=>{const text=(document.title+' '+(document.body?.innerText||'').slice(0,10000));return {challenge:!document.querySelector('dl')&&/just a moment|checking.{0,30}browser|verify you are human|cloudflare|challenge|验证|真人/i.test(text)};})()\`;
async function inspect(){
 if(!request||done||busy||inspecting||view.webContents.isLoading()||Date.now()<nextProbeAt)return;
 inspecting=true;const token=sequence;
 try{
  const u=view.webContents.getURL();if(!official(u))return;
  const probe=await view.webContents.executeJavaScript(probeCode);if(token!==sequence)return;
  if(probe.challenge){stable='';ticks=0;nextProbeAt=Date.now()+5000;await update({state:'needs-user',phase:'需要手动验证',message:'请在官网区域完成验证。程序会等待，不自动刷新或重置会话。'});return;}
  const snapshot=await view.webContents.executeJavaScript(snapshotCode);if(token!==sequence)return;
  const parsed=adapter.parsePMG(snapshot,request);
  if(parsed.state!=='matched'){stable='';ticks=0;if(parsed.state==='needs-user')nextProbeAt=Date.now()+5000;await update({state:parsed.state,phase:parsed.state==='needs-user'?'需要手动验证':parsed.state==='mismatch'?'信息不匹配':'等待详情',message:parsed.message||'请在官网区域完成必要验证，详情加载后将自动采集。'});return;}
  const signature=JSON.stringify([parsed.note,snapshot.images.map(x=>x.href)]);ticks=signature===stable?ticks+1:1;stable=signature;
  if(ticks>=2)await saveCapture(snapshot,parsed.note,token);
 }catch(e){if(token===sequence)await update({state:'loading',phase:'等待官网页面',message:e.message});}finally{inspecting=false;}
}
`;
await replace('desktop/capture-engine.cjs',oldInspect,newInspect);
await replace('desktop/capture-engine.cjs',"async function start(input){if(busy)","async function start(input,{forceReload=false}={}){if(busy)");
await replace('desktop/capture-engine.cjs',"const target=domain.queryUrl(input.site,input.cert,input.grade);request=", "const target=domain.queryUrl(input.site,input.cert,input.grade);if(!forceReload&&request&&!done&&state.state!=='failed'&&domain.queryUrl(request.site,request.cert,request.grade)===target)return state;nextProbeAt=0;request=");
await replace('desktop/capture-engine.cjs',"done=false;stable='';ticks=0;await inspect();", "done=false;stable='';ticks=0;nextProbeAt=0;await inspect();");
await replace('desktop/capture-engine.cjs',"if(request)return start(request);return state;", "if(request)return start(request,{forceReload:true});return state;");
await replace('desktop/view-policy.cjs',"u.protocol==='https:'&&['www.pmgnotes.cn'", "u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&['www.pmgnotes.cn'");
const pkg=JSON.parse(await fs.readFile('package.json','utf8'));pkg.version='0.18.1-preview.2';pkg.description='PMG库 · 浏览器兼容性与会话诊断预览';await fs.writeFile('package.json',JSON.stringify(pkg,null,2)+'\n');

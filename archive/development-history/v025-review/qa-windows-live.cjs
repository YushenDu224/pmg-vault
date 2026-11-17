const {app,BrowserWindow,webContents}=require('electron');
const fs=require('node:fs/promises'),path=require('node:path');
const source=path.join(__dirname,'versions/v025-browser-compat');
const data=process.argv.find(x=>x.startsWith('--data-dir='))?.slice(11);
let last='',finished=false,polling=false;
async function finish(reason,state={}){
 if(finished)return;finished=true;
 const official=webContents.getAllWebContents().find(c=>/^https:\/\/(www\.)?pmgnotes\.(com|cn)\//.test(c.getURL()));
 const main=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().startsWith('pmg-library://app'));
 const result={reason,state:state.state||null,phase:state.phase||null,imageCount:state.imageCount??null,captureStatus:state.captureStatus||null,debuggerAttached:official?.debugger.isAttached()??null,environment:official?require(path.join(source,'desktop/browser-compat.cjs')).browserEnvironment(official):null};
 if(state.archiveId){const {unpack}=await import(require('node:url').pathToFileURL(path.join(source,'lib/archive.mjs')));const record=await unpack(new Uint8Array(await fs.readFile(path.join(data,'inbox',state.archiveId+'.pmgx'))));result.cert=record.note.certificationNumber;result.resourceRoles=record.manifest.resources.map(x=>x.role);result.originals=record.manifest.resources.filter(x=>x.role==='original').map(x=>({bytes:x.bytes,width:x.width,height:x.height}));}
 if(main){try{result.ui=await main.webContents.executeJavaScript("({title:document.title,hasDiagnostics:typeof pmgDesktop.exportDiagnostics==='function',hasBrowserCompare:typeof pmgDesktop.openOfficial==='function',cards:document.querySelectorAll('.note-card').length})");await fs.mkdir(path.join(__dirname,'previews'),{recursive:true});await fs.writeFile(path.join(__dirname,'previews/windows-compat.png'),(await main.webContents.capturePage()).toPNG());}catch{result.uiCapture='unavailable';}}
 await fs.mkdir(path.join(__dirname,'diagnostics'),{recursive:true});await fs.writeFile(path.join(__dirname,'diagnostics/windows-runtime-qa.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 app.quit();
}
app.whenReady().then(()=>{setInterval(async()=>{if(finished||polling)return;polling=true;try{const state=JSON.parse(await fs.readFile(path.join(data,'collector-state.json'),'utf8'));if(state.state!==last){last=state.state;console.log('Windows state: '+last);}if(state.state==='saved'||state.state==='failed')await finish('terminal',state);}catch{}finally{polling=false;}},1000);setTimeout(async()=>{let state={};try{state=JSON.parse(await fs.readFile(path.join(data,'collector-state.json'),'utf8'));}catch{}await finish('timeout',state)},110000);});
require(path.join(source,'desktop/main.cjs'));

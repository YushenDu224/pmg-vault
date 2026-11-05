import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const address='http://127.0.0.1:8790';
const runtime=path.resolve(root,'../../user-data/runtime');
async function health(){try{const r=await fetch(address+'/api/health',{signal:AbortSignal.timeout(500)});if(!r.ok)return null;return await r.json();}catch{return null;}}
try{
  const existing=await health();
  if(existing&&existing.version!=='v009-collector')throw Error('Another PMG version is running on port 8790. Close its server before starting this version.');
  if(!existing){
    fs.mkdirSync(runtime,{recursive:true});
    const out=fs.openSync(path.join(runtime,'server.log'),'a'),err=fs.openSync(path.join(runtime,'server-error.log'),'a');
    const child=spawn(process.execPath,[path.join(root,'server.mjs')],{cwd:root,detached:true,windowsHide:true,stdio:['ignore',out,err],env:{...process.env,PORT:'8790'}});
    const started=await new Promise((resolve,reject)=>{child.once('spawn',resolve);child.once('error',reject);});
    child.unref();fs.closeSync(out);fs.closeSync(err);
    fs.writeFileSync(path.join(runtime,'server.pid'),String(child.pid));
  }
  let ready=false;
  for(let i=0;i<30;i++){
    const status=await health();
    if(status?.app==='pmg-library'&&status.version==='v009-collector'){ready=true;break;}
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  if(!ready)throw Error('PMG server did not become ready. See '+path.join(runtime,'server-error.log'));
  console.log('PMG library is ready: '+address);
  console.log('The local background service remains running after this launcher exits.');
  if(!process.argv.includes('--no-browser')){
    const opener=spawn('cmd.exe',['/c','start','',address],{detached:true,stdio:'ignore',windowsHide:true});
    opener.on('error',()=>console.log('Open this address in your browser: '+address));opener.unref();
  }
}catch(error){console.error(error.message);process.exitCode=1;}

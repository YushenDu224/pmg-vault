const {app,BrowserWindow,protocol}=require('electron');
const fs=require('node:fs/promises');
const path=require('node:path');
const root=path.join(__dirname,'android-preview');
const directory=process.argv.find(value=>value.startsWith('--data-dir='))?.slice(11);
if(directory)app.setPath('userData',path.join(directory,'profile'));
protocol.registerSchemesAsPrivileged([{scheme:'pmg-preview',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true}}]);
app.whenReady().then(async()=>{
 protocol.handle('pmg-preview',async request=>{
  try{
   const url=new URL(request.url);
   const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));
   if(!file.startsWith(root+path.sep))return new Response('',{status:404});
   const types={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.svg':'image/svg+xml'};
   return new Response(await fs.readFile(file),{headers:{'Content-Type':types[path.extname(file)]||'application/octet-stream'}});
  }catch{return new Response('',{status:404});}
 });
 const win=new BrowserWindow({show:true,width:420,height:940,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
 await win.loadURL('pmg-preview://app/');
});
app.on('window-all-closed',()=>app.quit());


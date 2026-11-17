const {app,BrowserWindow,protocol}=require('electron');
const fs=require('node:fs/promises');
const path=require('node:path');
app.setPath('userData',path.join(__dirname,'qa-profile'));
protocol.registerSchemesAsPrivileged([{scheme:'pmg-preview',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true}}]);
app.whenReady().then(async()=>{
  protocol.handle('pmg-preview',async request=>{
    const url=new URL(request.url);
    const filename=path.resolve(__dirname,'.'+(url.pathname==='/'?'/index.html':url.pathname));
    if(!filename.startsWith(__dirname+path.sep))return new Response('',{status:404});
    const types={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.svg':'image/svg+xml'};
    return new Response(await fs.readFile(filename),{headers:{'Content-Type':types[path.extname(filename)]||'application/octet-stream'}});
  });
  const window=new BrowserWindow({show:true,width:420,height:940,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
  await window.loadURL('pmg-preview://app/');
});
app.on('window-all-closed',()=>app.quit());

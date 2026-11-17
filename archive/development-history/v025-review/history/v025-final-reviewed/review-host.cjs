const {app,BrowserWindow}=require('electron');
const path=require('node:path');
const directory=process.argv.find(value=>value.startsWith('--data-dir='))?.slice(11);
if(directory)app.setPath('userData',path.join(directory,'profile'));
app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:true,width:1300,height:1050,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});
  await win.loadURL('http://127.0.0.1:8876/');
});
app.on('window-all-closed',()=>app.quit());




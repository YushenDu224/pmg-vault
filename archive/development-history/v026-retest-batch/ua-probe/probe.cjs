const {app,WebContentsView,session}=require('electron');
const fs=require('node:fs/promises');
const path=require('node:path');
app.setPath('userData',path.join(__dirname,'runtime-'+Date.now()));
app.whenReady().then(async()=>{
 const results=[];const blockedRequests=[];
 for(const [index,name] of ['PMG库','pmg-library'].entries()){
  app.setName(name);
  const partition='ua-offline-'+index+'-'+Date.now();
  const isolated=session.fromPartition(partition);
  isolated.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*']},(details,callback)=>{blockedRequests.push({host:new URL(details.url).hostname});callback({cancel:true});});
  const view=new WebContentsView({webPreferences:{partition,javascript:true,contextIsolation:true,nodeIntegration:false,sandbox:true}});
  const userAgent=view.webContents.getUserAgent();
  results.push({requestedName:name,actualName:app.getName(),version:app.getVersion(),userAgent,nonAscii:/[^\x00-\x7F]/.test(userAgent),nonAsciiCharacters:[...new Set([...userAgent].filter(c=>c.charCodeAt(0)>127))],url:view.webContents.getURL(),debuggerAttached:view.webContents.debugger.isAttached()});
  view.webContents.close();
 }
 const report={format:'pmg-offline-ua-test',createdAt:new Date().toISOString(),versions:{electron:process.versions.electron,chromium:process.versions.chrome},visibleWindowsCreated:0,websiteNavigations:0,blockedRequests,results};
 await fs.writeFile(path.join(__dirname,'result.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));app.quit();
}).catch(error=>{console.error(error.stack);app.exit(1);});

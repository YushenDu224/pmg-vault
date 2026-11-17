const {app,WebContentsView,session}=require('electron');
const fs=require('node:fs/promises'),path=require('node:path');
const sourceRoot=path.resolve(__dirname,'../../versions/v027-ascii-identity');
app.setPath('userData',path.join(__dirname,'runtime-'+Date.now()));
app.whenReady().then(async()=>{
 const source=await fs.readFile(path.join(sourceRoot,'desktop/main.cjs'),'utf8');
 const configuredName=source.match(/app\.setName\('([^']+)'\)/)?.[1];if(!configuredName)throw Error('Source app name unavailable');
 const pkg=JSON.parse(await fs.readFile(path.join(sourceRoot,'package.json'),'utf8'));
 if(pkg.version!==app.getVersion())throw Error('Version must match source');
 app.setName(configuredName);
 const partition='ua-source-config-'+Date.now(),isolated=session.fromPartition(partition),blockedRequests=[];
 isolated.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*']},(d,cb)=>{blockedRequests.push({host:new URL(d.url).hostname});cb({cancel:true});});
 const view=new WebContentsView({webPreferences:{partition,javascript:true,contextIsolation:true,nodeIntegration:false,sandbox:true}});
 const userAgent=view.webContents.getUserAgent();
 const report={format:'pmg-offline-source-config-ua-test',createdAt:new Date().toISOString(),sourceVersionDirectory:'v027-ascii-identity',configuredName,actualName:app.getName(),version:app.getVersion(),versions:{electron:process.versions.electron,chromium:process.versions.chrome},userAgent,nonAscii:/[^\x00-\x7F]/.test(userAgent),visibleWindowsCreated:0,websiteNavigations:0,blockedRequests,url:view.webContents.getURL(),debuggerAttached:view.webContents.debugger.isAttached()};
 await fs.writeFile(path.join(__dirname,'result.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));view.webContents.close();app.quit();
}).catch(e=>{console.error(e.stack);app.exit(1);});

const {app,BrowserWindow,WebContentsView}=require('electron');
const fs=require('node:fs/promises');
const path=require('node:path');
const root=__dirname;
app.setPath('userData',path.join(root,'live-probe-'+Date.now()));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
app.whenReady().then(async()=>{
 const events=[];
 const win=new BrowserWindow({width:1200,height:900,show:true,title:'PMG 官网加载检查',webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
 const view=new WebContentsView({webPreferences:{partition:'persist:pmg-collector-probe',sandbox:true,contextIsolation:true,nodeIntegration:false}});
 win.contentView.addChildView(view);view.setBounds({x:0,y:0,width:1200,height:850});
 const ses=view.webContents.session;
 const counts={};
 ses.webRequest.onCompleted(d=>{const host=new URL(d.url).hostname;const key=host+' '+d.statusCode+' '+d.resourceType;counts[key]=(counts[key]||0)+1;});
 ses.webRequest.onErrorOccurred(d=>{events.push({type:'network-error',host:new URL(d.url).hostname,error:d.error,resourceType:d.resourceType});});
 ses.setPermissionRequestHandler((_,permission,callback)=>{events.push({type:'permission-request',permission});callback(false);});
 view.webContents.setWindowOpenHandler(()=>{events.push({type:'window-open'});return{action:'deny'};});
 const report={createdAt:new Date().toISOString(),versions:{electron:process.versions.electron,chrome:process.versions.chrome},userAgent:view.webContents.getUserAgent(),debuggerAttached:view.webContents.debugger.isAttached(),note:'Navigation only, no challenge interaction, no UA or device overrides, no cookie values recorded.',sites:[]};
 for(const site of ['global']){
  const start=Date.now();const url='https://www.pmgnotes.'+(site==='global'?'com':'cn')+'/certlookup/8077301-001/67/';
  let loadError=null;
  await Promise.race([view.webContents.loadURL(url).catch(e=>{loadError=e.code||e.message.split(' ').slice(0,2).join(' ')}),sleep(20000)]);
  await sleep(7000);
  let state={};try{state=await view.webContents.executeJavaScript(`(()=>{const text=document.body?.innerText||'';return {title:document.title,fieldCount:document.querySelectorAll('dl dt').length,challenge:/cloudflare|verify you are human|验证您是真人|checking your browser|just a moment/i.test(text),rayId:(text.match(/Ray ID[:：]?\\s*([a-f0-9]{16,})/i)||[])[1]||null,errorCode:(text.match(/(?:error code|错误代码)[:：]?\\s*(\\d{3,6})/i)||[])[1]||null,challengeFrame:!!document.querySelector('iframe[src*="challenges.cloudflare.com"]')};})()`);}catch(e){state={inspectionError:e.code||'renderer unavailable'};}
  const entry={site,elapsedMs:Date.now()-start,loadError,...state};report.sites.push(entry);
  await fs.mkdir(path.join(root,'diagnostics'),{recursive:true});
  if(!view.webContents.isDestroyed()){const image=await view.webContents.capturePage();await fs.writeFile(path.join(root,'diagnostics',site+'-isolated-load.png'),image.toPNG());}
  console.log(JSON.stringify(entry));
 }
 report.networkSummary=counts;report.events=events;
 await fs.writeFile(path.join(root,'diagnostics','isolated-global-navigation.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({versions:report.versions,requests:Object.values(counts).reduce((n,v)=>n+v,0),errors:events.filter(x=>x.type==='network-error').length,debuggerAttached:view.webContents.debugger.isAttached()}));
 win.close();app.quit();
}).catch(error=>{console.error(error.message);app.exit(1);});


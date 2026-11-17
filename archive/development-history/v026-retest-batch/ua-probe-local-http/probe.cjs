const {app,WebContentsView,session}=require('electron');
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
app.setPath('userData',path.join(__dirname,'runtime-'+Date.now()));
app.whenReady().then(async()=>{
 const received=new Map();
 const server=http.createServer((request,response)=>{
  if(request.url.startsWith('/ua/')){
   const index=request.rawHeaders.findIndex(value=>value.toLowerCase()==='user-agent');
   const latin1=index<0?'':request.rawHeaders[index+1];
   const bytes=Buffer.from(latin1,'latin1');
   received.set(request.url,{httpVersion:request.httpVersion,requestArrived:true,userAgentLatin1:latin1,userAgentBytesHex:bytes.toString('hex'),userAgentUtf8:bytes.toString('utf8'),containsNonAsciiBytes:[...bytes].some(byte=>byte>127)});
  }
  response.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Connection':'close'});response.end('<!doctype html><meta charset="utf-8"><title>Local header test</title>Offline local test');
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const port=server.address().port,results=[],blockedExternalRequests=[];
 try{
  for(const [index,name] of ['PMG库','pmg-library'].entries()){
   app.setName(name);
   const partition='ua-local-http-'+index+'-'+Date.now(),isolated=session.fromPartition(partition);
   isolated.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*']},(details,callback)=>{const u=new URL(details.url);const local=u.protocol==='http:'&&u.hostname==='127.0.0.1'&&u.port===String(port);if(!local)blockedExternalRequests.push({host:u.hostname});callback({cancel:!local});});
   const view=new WebContentsView({webPreferences:{partition,javascript:true,contextIsolation:true,nodeIntegration:false,sandbox:true}});
   const getter=view.webContents.getUserAgent(),pathname='/ua/'+index;
   let timer,loadError=null;
   try{await Promise.race([view.webContents.loadURL('http://127.0.0.1:'+port+pathname),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Local navigation timeout')),5000);})]);}catch(error){loadError=error.code||error.message;}finally{clearTimeout(timer);}
   const header=received.get(pathname)||{requestArrived:false};
   results.push({requestedName:name,version:app.getVersion(),getterUserAgent:getter,getterNonAscii:/[^\x00-\x7F]/.test(getter),loadError,...header,getterEqualsUtf8Header:header.userAgentUtf8===getter,debuggerAttached:view.webContents.debugger.isAttached()});
   view.webContents.close();
  }
 }finally{await new Promise(resolve=>server.close(resolve));}
 const report={format:'pmg-local-http-ua-header-test',createdAt:new Date().toISOString(),versions:{electron:process.versions.electron,chromium:process.versions.chrome},visibleWindowsCreated:0,externalNavigations:0,blockedExternalRequests,transport:'HTTP/1.1 loopback only; Node rawHeaders Latin1 reconstructed to exact header bytes',results};
 await fs.writeFile(path.join(__dirname,'result.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));app.quit();
}).catch(error=>{console.error(error.stack);app.exit(1);});

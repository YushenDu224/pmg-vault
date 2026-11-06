const {app,BrowserWindow,WebContentsView,ipcMain,protocol,dialog}=require('electron');
const fs=require('node:fs/promises'),path=require('node:path');
const {officialPage,viewBounds,archiveId}=require('./view-policy.cjs');
const {APP_URL,trustedAppUrl,appResourcePath,dataDirectory}=require('./runtime-policy.cjs');
const {createCaptureEngine}=require('./capture-engine.cjs');
const root=path.resolve(__dirname,'..');
function arg(name,args=process.argv){return args.find(x=>x.startsWith('--'+name+'='))?.slice(name.length+3);}
const data=dataDirectory(app.getPath('appData'),arg('data-dir'));
app.setPath('userData',path.join(data,'profile'));app.setName('PMG库');
protocol.registerSchemesAsPrivileged([{scheme:'pmg-library',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true}}]);
let win,view,engine,layout=null,ready=false,pending;
const queryFrom=args=>arg('cert',args)?{cert:arg('cert',args),site:arg('site',args)||'cn',grade:arg('grade',args)||'67'}:null;
pending=queryFrom(process.argv);
function applyLayout(){if(!view||!win||win.isDestroyed())return;const [w,h]=win.getContentSize(),bounds=viewBounds(layout,w,h);if(bounds){view.setBounds(bounds);view.setVisible(true);}else view.setVisible(false);}
function trusted(event){if(!win||event.sender!==win.webContents||event.senderFrame!==win.webContents.mainFrame||!trustedAppUrl(event.senderFrame.url))throw Error('不允许的应用请求');}
function sendPending(){if(ready&&pending){const query=pending;pending=null;win.webContents.send('pmg:query',query);}}
if(!app.requestSingleInstanceLock()){app.quit();}else{
 app.on('second-instance',(_,args)=>{pending=queryFrom(args);if(win){if(win.isMinimized())win.restore();win.show();win.focus();sendPending();}});
 app.whenReady().then(async()=>{
  app.setAppUserModelId('io.github.yushendu224.pmgvault');await fs.mkdir(data,{recursive:true});
  const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.pmgx':'application/octet-stream'};
  protocol.handle('pmg-library',async request=>{const file=appResourcePath(request.url,root);if(!file||!['GET','HEAD'].includes(request.method))return new Response('Not found',{status:404});try{const bytes=await fs.readFile(file);return new Response(request.method==='HEAD'?null:bytes,{headers:{'Content-Type':mime[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-store'}});}catch{return new Response('Not found',{status:404});}});
  win=new BrowserWindow({width:1500,height:1000,minWidth:1000,minHeight:750,title:'PMG库 · v016 Windows 安装版',backgroundColor:'#f5f5f5',icon:path.join(root,'build/icon.ico'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  win.setMenuBarVisibility(false);win.webContents.on('page-title-updated',event=>event.preventDefault());
  view=new WebContentsView({webPreferences:{partition:'persist:pmg-collector',contextIsolation:true,nodeIntegration:false,sandbox:true}});win.contentView.addChildView(view);view.setVisible(false);
  view.webContents.setWindowOpenHandler(({url})=>{if(officialPage(url))view.webContents.loadURL(url);return {action:'deny'};});view.webContents.on('will-navigate',(event,url)=>{if(!officialPage(url))event.preventDefault();});view.webContents.session.setPermissionRequestHandler((_,__,callback)=>callback(false));
  win.webContents.setWindowOpenHandler(({url})=>url.startsWith('blob:pmg-library://app/')?{action:'allow',overrideBrowserWindowOptions:{webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}}}:{action:'deny'});
  win.webContents.on('will-navigate',(event,url)=>{if(!trustedAppUrl(url))event.preventDefault();});
  engine=await createCaptureEngine({view,data,root,onState:state=>{if(win&&!win.isDestroyed())win.webContents.send('pmg:state',state);}});
  const handlers={'pmg:start':(_,input)=>engine.start(input),'pmg:retry':()=>engine.retry(),'pmg:reload':()=>engine.reload(),'pmg:state':()=>engine.getState(),'pmg:migration':async()=>{const file=path.join(data,'migrations/v014-browser-library.zip');let stat;try{stat=await fs.stat(file);}catch(e){if(e.code==='ENOENT')return null;throw e;}return new Uint8Array(await fs.readFile(file));},'pmg:archive':async(_,id)=>{if(!archiveId(id))throw Error('非法档案编号');return new Uint8Array(await fs.readFile(path.join(data,'inbox',id+'.pmgx')));}};
  for(const [channel,handler] of Object.entries(handlers))ipcMain.handle(channel,(event,...args)=>{trusted(event);return handler(event,...args);});
  ipcMain.on('pmg:layout',(event,input)=>{trusted(event);layout=input;applyLayout();});ipcMain.on('pmg:ready',event=>{trusted(event);ready=true;sendPending();});
  win.on('resize',applyLayout);win.webContents.on('did-start-navigation',(_,__,inPlace,main)=>{if(main&&!inPlace){ready=false;layout=null;view.setVisible(false);}});
  await win.loadURL(APP_URL);const timer=setInterval(()=>engine.inspect().catch(()=>{}),1800);
  win.on('closed',()=>{clearInterval(timer);if(!view.webContents.isDestroyed())view.webContents.close();});
 }).catch(async error=>{await fs.mkdir(path.join(data,'runtime'),{recursive:true});await fs.appendFile(path.join(data,'runtime/desktop-error.log'),new Date().toISOString()+' '+error.stack+'\n');dialog.showErrorBox('PMG库无法启动',error.message);app.quit();});
 app.on('window-all-closed',()=>app.quit());
}

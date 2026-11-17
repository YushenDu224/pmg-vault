const {officialPage}=require('./view-policy.cjs');

// Main-frame policy is deliberately separate from normal subframe/network access.
function auxiliaryPage(input){
  if(input==='about:blank'||input==='about:srcdoc')return true;
  try{const u=new URL(input);return u.protocol==='https:'&&u.hostname==='challenges.cloudflare.com'&&!u.username&&!u.password&&(!u.port||u.port==='443');}catch{return false;}
}
const popupPage=input=>officialPage(input)||auxiliaryPage(input);

function configureOfficialContents(contents,{partition,parent,allowAuxiliary=false,onBlocked=()=>{}}={}){
  contents.setWindowOpenHandler(({url})=>popupPage(url)?{
    action:'allow',
    overrideBrowserWindowOptions:{parent,width:1040,height:850,autoHideMenuBar:true,webPreferences:{partition,javascript:true,contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true}}
  }:{action:'deny'});
  contents.on('will-navigate',(event,url)=>{if(!officialPage(url)&&!(allowAuxiliary&&auxiliaryPage(url))){event.preventDefault();onBlocked(url);}});
  contents.on('did-create-window',child=>configureOfficialContents(child.webContents,{partition,parent:child,allowAuxiliary:true,onBlocked}));
}

async function captureFullPage(contents){
  const debuggerSession=contents.debugger;
  let attachedHere=false;
  try{
    if(!debuggerSession.isAttached()){debuggerSession.attach('1.3');attachedHere=true;}
    const metrics=await debuggerSession.sendCommand('Page.getLayoutMetrics');
    const size=metrics.cssContentSize||metrics.contentSize;
    const result=await debuggerSession.sendCommand('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:Math.min(size.width,3000),height:Math.min(size.height,20000),scale:1}});
    return Buffer.from(result.data,'base64');
  }finally{
    // The attachment must not remain active for the next certificate/challenge.
    if(attachedHere&&debuggerSession.isAttached())debuggerSession.detach();
  }
}

function browserEnvironment(contents,versions=process.versions){
  const agent=contents.getUserAgent();
  return {electron:versions.electron||null,chromium:versions.chrome||null,userAgentFamily:/Electron\//.test(agent)?'Electron Chromium':/Edg\//.test(agent)?'Microsoft Edge':/Chrome\//.test(agent)?'Chromium':'Other',javascriptEnabled:contents.getLastWebPreferences?.().javascript!==false,persistentSession:contents.session?.isPersistent?.()===true};
}

function networkFact(details){
  let u;try{u=new URL(details.url);}catch{return null;}
  const host=u.hostname;
  if(!['www.pmgnotes.cn','www.pmgnotes.com','pmgnotes.cn','pmgnotes.com','challenges.cloudflare.com'].includes(host)&&!host.endsWith('.challenges.cloudflare.com')&&host!=='dnstest.dev'&&!host.endsWith('.dnstest.dev'))return null;
  const optionalPat=details.statusCode===401&&/\/pat\//.test(u.pathname);
  const optionalDns=(host.endsWith('.challenges.cloudflare.com')||host==='dnstest.dev'||host.endsWith('.dnstest.dev'))&&/ERR_NAME_NOT_RESOLVED/.test(details.error||'');
  const headers=details.responseHeaders||{};
  const ray=Object.entries(headers).find(([key])=>key.toLowerCase()==='cf-ray')?.[1];
  const candidate=Array.isArray(ray)?ray[0]:ray;
  const mitigated=Object.entries(headers).find(([key])=>key.toLowerCase()==='cf-mitigated')?.[1];
  return {host,resourceType:String(details.resourceType||'unknown').slice(0,32),status:Number.isInteger(details.statusCode)?details.statusCode:null,error:/^(?:net::)?ERR_[A-Z0-9_]{1,80}$/.test(details.error||'')?details.error:null,rayId:/^[a-f0-9]{16,32}(?:-[a-z0-9]{3,10})?$/i.test(candidate||'')?candidate:null,challengeResponse:(Array.isArray(mitigated)?mitigated[0]:mitigated)==='challenge',classification:optionalPat?'optional-pat-401':optionalDns?'optional-dns-probe':'network',fatal:false};
}

function createBrowserDiagnostics(contents,versions=process.versions){
  const facts=[];
  const record=details=>{const fact=networkFact(details);if(!fact)return;facts.push({...fact,at:new Date().toISOString()});if(facts.length>80)facts.shift();};
  const filter={urls:['https://*.pmgnotes.cn/*','https://*.pmgnotes.com/*','https://*.cloudflare.com/*','https://dnstest.dev/*','https://*.dnstest.dev/*']};
  contents.session.webRequest.onCompleted(filter,record);
  contents.session.webRequest.onErrorOccurred(filter,record);
  return {report:()=>({format:'pmg-browser-diagnostics',version:1,createdAt:new Date().toISOString(),environment:browserEnvironment(contents,versions),events:facts.map(fact=>({...fact})),notes:['Network facts do not establish the reason for a challenge rejection.','Cookies, tokens, request headers, complete URLs and page text are excluded.','Optional PAT 401 and wildcard DNS probes are not classified as fatal.']}),record};
}

module.exports={auxiliaryPage,popupPage,configureOfficialContents,captureFullPage,browserEnvironment,networkFact,createBrowserDiagnostics};

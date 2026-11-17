import {queryUrl,normalizeCertificate,fields,fieldText,isMissing,value} from '../lib/domain.mjs';
import {unpack,pack} from '../lib/archive.mjs';
import {createCaptureStateSync} from './capture-state.mjs';
const $=id=>document.getElementById(id),safe=value=>String(value??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function hideOfficialView(){window.pmgDesktop?.layout({visible:false});}
export function createCaptureWorkspace({accept,onOpen,notify,onNavigate}){
 const bridge=window.pmgDesktop;
 let expanded=false,active=false,queryActive=false,record=null,frame=0,resultUrls=[],importStatus=null;
 let state={state:'idle',phase:'等待查询'};
 function layout(){frame=0;if(!bridge)return;const r=$('official-viewport').getBoundingClientRect(),modal=document.querySelector('dialog[open]');bridge.layout({visible:expanded&&active&&!$('capture-workspace').hidden&&!modal&&!document.hidden,rect:{x:r.x,y:Math.max(32,r.y),width:r.width,height:Math.max(0,r.bottom-Math.max(32,r.y))}});}
 function scheduleLayout(){if(!frame)frame=requestAnimationFrame(layout);}
 function expand(value){expanded=value;$('capture-body').hidden=!value;$('capture-toggle').textContent=value?'收起查询与采集 ↑':'展开查询与采集 ↓';$('capture-toggle').setAttribute('aria-expanded',String(value));scheduleLayout();}
 function setControls(){
  const saving=state.state==='saving',importing=importStatus==='pending';
  $('capture-browser').disabled=!active||saving;
  $('banner-query-form').querySelector('button[type=submit]').disabled=saving||importing;
  $('capture-retry').disabled=!active||saving||importing;
  $('capture-retry').textContent=importStatus==='error'?'重试入库':'重新采集';
  $('capture-reload').disabled=!active||saving||importing;
 }
 function showProgress(){
  const fileSaved=state.state==='saved',complete=fileSaved&&importStatus==='confirmed';
  $('capture-result-badge').textContent=fileSaved?(importStatus==='pending'?'正在加入库':importStatus==='error'?'文件已存，入库未完成':state.captureStatus==='partial'?'部分保存':'已保存'):state.phase||'待查询';
  $('capture-progress').innerHTML=[['核对官网认证信息',fileSaved||state.state==='saving'],['保存原图和网页存档',fileSaved&&state.captureStatus!=='partial'],['加入库',complete&&Boolean(record)]].map(([label,done])=>'<li'+(done?' class="complete"':'')+'>'+label+(done?' · 已完成':'')+'</li>').join('');
 }
 function showResult(r){
  record=r;resultUrls.forEach(URL.revokeObjectURL);resultUrls=[];
  const files=new Map(r.files),seen=new Set(),images=r.manifest.resources.filter(x=>x.role==='original'&&!seen.has(x.sha256)&&seen.add(x.sha256));
  const previews=images.map(x=>{const url=URL.createObjectURL(new Blob([files.get(x.path)],{type:x.mediaType}));resultUrls.push(url);return '<figure><img src="'+url+'" alt="官网原图预览"><figcaption>'+x.width+' × '+x.height+' · 原图</figcaption></figure>';}).join('');
  $('capture-preview').className='capture-preview';
  $('capture-preview').innerHTML=(previews||'<div class="placeholder"><b>暂无官网原图</b>'+safe(r.note.name)+'</div>')+'<h3>'+safe(r.note.name)+'</h3><dl>'+fields.map(([key,label])=>'<div><dt>'+safe(label)+'</dt><dd'+(isMissing(value(r.note,key))?' class="not-applicable"':'')+'>'+safe(fieldText(r.note,key))+'</dd></div>').join('')+'</dl>';
  $('capture-open-record').hidden=false;$('capture-export-record').hidden=false;showProgress();scheduleLayout();
 }
 function applyState(next,meta){
  state=next;importStatus=meta.importStatus;
  $('capture-workspace').dataset.state=state.state;
  $('capture-state').textContent=state.state==='saved'&&importStatus==='pending'?'采集文件已保存 · 正在加入本地库…':state.state==='saved'&&importStatus==='error'?'采集文件已保存，加入库未完成：'+(meta.importError?.message||'请重试')+'。请点击“重试入库”。':(state.phase||'等待查询')+(state.message?' · '+state.message:'');
  setControls();showProgress();scheduleLayout();
 }
 const sync=createCaptureStateSync({
  readState:async()=>{if(bridge)return bridge.getState();const response=await fetch('/api/collector/state');if(!response.ok)throw Error('采集状态暂不可读');return response.json();},
  applyState,
  importSaved:async next=>{
   let bytes;
   if(bridge)bytes=await bridge.readArchive(next.archiveId);
   else{const response=await fetch('/api/collector/archive/'+next.archiveId);if(!response.ok)throw Error('采集档案暂不可读');bytes=await response.arrayBuffer();}
   const incoming=await unpack(bytes);let imported=false;
   try{imported=localStorage.getItem('pmg-imported-'+next.archiveId)==='yes';}catch{}
   if(!imported){await accept(bytes);try{localStorage.setItem('pmg-imported-'+next.archiveId,'yes');}catch{}}
   return incoming;
  },
  onImported:incoming=>{showResult(incoming);notify('已保存到库：'+incoming.note.certificationNumber);},
  onImportError:()=>{notify('采集文件已保存，但加入库未完成。可点击“重试入库”，无需重新验证官网。');},
  trace:entry=>bridge?.traceState?.(entry),
  visibility:()=>document.visibilityState,
  isActive:()=>queryActive&&!$('capture-workspace').hidden
 });
 function resetResult(){record=null;$('capture-preview').className='capture-preview-empty';$('capture-preview').textContent='正在等待本次查询结果…';$('capture-open-record').hidden=true;$('capture-export-record').hidden=true;}
 async function start(query){
  let generation;
  try{
   const cert=normalizeCertificate(query.cert),grade=String(query.grade),site=query.site,url=queryUrl(site,cert,grade);
   onNavigate();$('banner-cert').value=cert;$('banner-grade').value=grade;$('banner-site').value=site;expand(true);resetResult();
   $('capture-url').textContent=url;$('capture-url').title=url;active=Boolean(bridge);queryActive=true;
   generation=sync.begin({site,cert,grade});scheduleLayout();
   if(bridge){await sync.receive(await bridge.start({site,cert,grade}),{generation,source:'start-return'});}
   else{
    $('viewport-heading').textContent='请在一体化 PMG库中操作官网';$('viewport-caption').textContent='正在打开 PMG库主窗口，查询与采集会显示在同一绿色区域中。';
    const response=await fetch('/api/collector/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({site,cert,grade})}),result=await response.json();
    if(!response.ok)throw Error(result.error||'无法打开一体化窗口');$('capture-state').textContent=result.message;notify(result.message);
   }
  }catch(error){if(generation===undefined||sync.fail(error,generation))notify(error.message);}
 }
 $('banner-query-form').onsubmit=event=>{event.preventDefault();void start({site:$('banner-site').value,cert:$('banner-cert').value,grade:$('banner-grade').value});};
 $('capture-toggle').onclick=()=>expand(!expanded);
 $('capture-open-record').onclick=()=>{if(record){hideOfficialView();onOpen(record);}};
 $('capture-export-record').onclick=async()=>{if(!record)return;const bytes=await pack(record),url=URL.createObjectURL(new Blob([bytes],{type:'application/octet-stream'})),a=document.createElement('a');a.href=url;a.download=record.note.certificationNumber+'.pmgx';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);};
 for(const [id,method] of [['capture-retry','retry'],['capture-reload','reload']])$(id).onclick=async()=>{
  let generation;
  try{
   if(importStatus==='error'&&method==='retry'){await sync.retryImport();return;}
   if(!bridge){await start({site:$('banner-site').value,cert:$('banner-cert').value,grade:$('banner-grade').value});return;}
   const query=state.query||{site:$('banner-site').value,cert:$('banner-cert').value,grade:$('banner-grade').value};
   const previousArchive=state.archiveId;resetResult();queryActive=true;generation=sync.begin(query,{ignoreArchiveId:previousArchive||null});
   await sync.receive(await bridge[method](),{generation,source:'retry'});
  }catch(error){if(generation===undefined||sync.fail(error,generation))notify(error.message);}
 };
 new ResizeObserver(scheduleLayout).observe($('official-viewport'));
 new MutationObserver(scheduleLayout).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open','hidden']});
 window.addEventListener('resize',scheduleLayout);
 document.querySelector('.window-content').addEventListener('scroll',scheduleLayout,{passive:true});
 document.addEventListener('visibilitychange',scheduleLayout);
 window.addEventListener('beforeunload',()=>sync.dispose(),{once:true});
 sync.start();void sync.poll({force:true});
 if(bridge){
  $('capture-browser').hidden=false;$('capture-diagnostics').hidden=false;
  $('capture-browser').onclick=async()=>{try{await bridge.openOfficial();notify('已打开系统浏览器用于对比验证；其中的查询不会自动加入库。');}catch(error){notify(error.message);}};
  $('capture-diagnostics').onclick=async()=>{try{const result=await bridge.exportDiagnostics();if(!result.canceled)notify('已保存诊断，不包含 Cookie、令牌或完整网址。');}catch(error){notify(error.message);}};
  bridge.onState(next=>{void sync.receive(next,{source:'push'});});bridge.onQuery(query=>{void start(query);});bridge.ready();
 }
 return {expand,start};
}


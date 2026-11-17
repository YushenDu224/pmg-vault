const states=new Set(['idle','loading','needs-user','mismatch','not-found','saving','saved','failed']);
const queryKey=query=>query?[String(query.site||''),String(query.cert||'').replace(/\D/g,''),/^\d+$/.test(String(query.grade??''))?String(Number(query.grade)):String(query.grade??'')].join(':'):null;
const stamp=value=>typeof value==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)&&Number.isFinite(Date.parse(value))?Date.parse(value):null;

// IPC push, start responses and fallback reads share one ordering/import boundary.
export function createCaptureStateSync({readState,applyState,importSaved,onImported=()=>{},onImportError=()=>{},trace=()=>{},isActive=()=>false,visibility=()=> 'unknown',setTimer=setInterval,clearTimer=clearInterval,intervalMs=2000}){
 let epoch=0,expectedQuery=null,current=null,lastStamp=null,appliedKey='',disposed=false,localFailure=false,pollLease=null,timer=null,currentSource='ui',excludedArchive=null;
 const completed=new Map(),pending=new Map(),failures=new Map(),presented=new Set(),errorsPresented=new Set();
 function log(stage,next=current,source=currentSource){if(disposed)return;try{trace({stage,state:states.has(next?.state)?next.state:'idle',stamp:stamp(next?.updatedAt)!==null?next.updatedAt:null,visibility:visibility(),source});}catch{}}
 function status(next=current){const id=next?.archiveId;return {importStatus:next?.state!=='saved'?null:completed.has(id)?'confirmed':failures.has(id)?'error':'pending',importError:failures.get(id)||null};}
 function render(){
  if(disposed||!current)return;
  const meta=status();
  const key=JSON.stringify([epoch,current.state,current.updatedAt,current.archiveId,current.phase,current.message,meta.importStatus]);
  if(key===appliedKey)return;
  try{applyState(current,meta);appliedKey=key;log('applied');}catch{log('error');}
 }
 function isCurrent(generation,id){return !disposed&&generation===epoch&&current?.state==='saved'&&current.archiveId===id;}
 async function ensureImported(next,generation){
  const id=next.archiveId;if(!id||failures.has(id))return;
  if(!completed.has(id)&&!pending.has(id)){
   const operation=Promise.resolve().then(()=>importSaved(next)).then(record=>{completed.set(id,record);failures.delete(id);log('imported',next);return record;},error=>{failures.set(id,error);log('error',next);throw error;}).finally(()=>{if(pending.get(id)===operation)pending.delete(id);});
   pending.set(id,operation);
  }
  try{
   const record=completed.has(id)?completed.get(id):await pending.get(id);
   if(!isCurrent(generation,id))return;
   render();const key=generation+':'+id;
   if(!presented.has(key)){presented.add(key);try{onImported(record,next);}catch{log('error',next);}}
  }catch(error){
   if(!isCurrent(generation,id))return;
   render();const key=generation+':'+id;
   if(!errorsPresented.has(key)){errorsPresented.add(key);try{onImportError(error,next);}catch{log('error',next);}}
  }
 }
 function begin(query,{ignoreArchiveId=null}={}){
  epoch++;expectedQuery=queryKey(query);lastStamp=null;localFailure=false;appliedKey='';currentSource='ui';excludedArchive=ignoreArchiveId;
  current={state:'loading',phase:'正在载入官网',query:{site:query.site,cert:query.cert,grade:query.grade}};
  render();return epoch;
 }
 async function receive(next,{generation=epoch,source='push'}={}){
  log('received',next,source);
  if(disposed||generation!==epoch||!next||!states.has(next.state)){log('ignored',next,source);return false;}
  if(expectedQuery&&queryKey(next.query)!==expectedQuery){log('ignored',next,source);return false;}
  const nextStamp=stamp(next.updatedAt);
  if(next.updatedAt!=null&&nextStamp===null||lastStamp!==null&&(nextStamp===null||nextStamp<lastStamp)){log('ignored',next,source);return false;}
  // A saved archive is terminal for this deliberate UI query, even if an old
  // start response or push callback arrives with a newer wall-clock timestamp.
  if(next.state==='saved'&&next.archiveId&&next.archiveId===excludedArchive){log('ignored',next,source);return false;}
  if(current?.state==='saved'&&(next.state!=='saved'||next.archiveId!==current.archiveId)){log('ignored',next,source);return false;}
  current=next;lastStamp=nextStamp;currentSource=source;render();
  if(next.state==='saved'){
   if(!next.archiveId){log('error',next);try{onImportError(Error('采集文件已保存，但缺少档案编号'),next);}catch{}return false;}
   await ensureImported(next,generation);
  }
  return true;
 }
 function shouldPoll(){return !disposed&&!localFailure&&((isActive()&&current?.state!=='saved')||current?.state==='saved'&&!completed.has(current.archiveId)&&!failures.has(current.archiveId)||pending.size>0);}
 async function poll({force=false}={}){
  if(disposed||!force&&!shouldPoll()||pollLease?.epoch===epoch)return false;
  const lease={epoch};pollLease=lease;
  try{const next=await readState();return await receive(next,{generation:lease.epoch,source:force?'initial':'poll'});}catch{log('error',current,'poll');return false;}finally{if(pollLease===lease)pollLease=null;}
 }
 async function retryImport(){
  if(disposed||current?.state!=='saved')return false;
  const id=current.archiveId;if(!id)return false;
  failures.delete(id);errorsPresented.delete(epoch+':'+id);currentSource='retry';render();await ensureImported(current,epoch);return completed.has(id);
 }
 function fail(error,generation=epoch){
  if(disposed||generation!==epoch)return false;
  if(current?.state==='saved'){log('ignored',current,'start-return');return false;}
  localFailure=true;current={state:'failed',phase:'查询未开始',message:error?.message||'查询未开始',query:current?.query};render();log('error');return true;
 }
 function start(){if(timer===null&&!disposed)timer=setTimer(()=>{void poll();},intervalMs);}
 function dispose(){disposed=true;epoch++;if(timer!==null)clearTimer(timer);timer=null;}
 return {begin,receive,poll,retryImport,fail,start,dispose,getState:()=>current,getStatus:()=>status(),shouldPoll};
}

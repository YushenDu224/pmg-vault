const fs=require('node:fs/promises'),path=require('node:path');
const stages=new Set(['received','applied','ignored','imported','error']);
const states=new Set(['idle','loading','needs-user','mismatch','not-found','saving','saved','failed']);
const visibilities=new Set(['visible','hidden','prerender','unknown']);
const sources=new Set(['ui','push','start-return','poll','initial','retry','import']);
function sanitizeUiStateEvent(input){
 if(!input||!stages.has(input.stage)||!states.has(input.state))return null;
 const validStamp=typeof input.stamp==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(input.stamp)&&Number.isFinite(Date.parse(input.stamp));
 return {stage:input.stage,state:input.state,stamp:validStamp?input.stamp:null,visibility:visibilities.has(input.visibility)?input.visibility:'unknown',source:sources.has(input.source)?input.source:'ui'};
}
function createUiStateLog(data,{maxBytes=256*1024}={}){
 const directory=path.join(data,'runtime'),file=path.join(directory,'ui-state-events.jsonl'),previous=path.join(directory,'ui-state-events.previous.jsonl');
 let queued=Promise.resolve();
 function record(input){
  const safe=sanitizeUiStateEvent(input);if(!safe)return Promise.resolve(false);
  const line=JSON.stringify({at:new Date().toISOString(),...safe})+'\n';
  const operation=queued.then(async()=>{
   await fs.mkdir(directory,{recursive:true});
   const size=await fs.stat(file).then(stat=>stat.size,error=>{if(error.code==='ENOENT')return 0;throw error;});
   if(size+Buffer.byteLength(line)>maxBytes){if(size)await fs.copyFile(file,previous);await fs.writeFile(file,line);}else await fs.appendFile(file,line);
   return true;
  });
  queued=operation.catch(()=>{});return operation;
 }
 return {record,flush:()=>queued};
}
module.exports={sanitizeUiStateEvent,createUiStateLog};

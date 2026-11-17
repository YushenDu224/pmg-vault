import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCaptureStateSync} from '../ui/capture-state.mjs';
const query={site:'global',cert:'8077301-001',grade:67};
const state=(kind,seconds=1,id='archive-a',q=query)=>({state:kind,query:q,updatedAt:new Date(Date.UTC(2026,10,17,0,0,seconds)).toISOString(),...(kind==='saved'?{archiveId:id}:{}),phase:kind});
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
function fixture(options={}){
 const applied=[],imported=[],errors=[],traces=[];let timer;
 const sync=createCaptureStateSync({readState:async()=>state('loading'),applyState:(s,meta)=>applied.push({state:s.state,id:s.archiveId,status:meta.importStatus}),importSaved:async s=>{imported.push(s.archiveId);return {id:s.archiveId};},onImported:()=>{},onImportError:e=>errors.push(e.message),trace:e=>traces.push(e),isActive:()=>true,visibility:()=> 'visible',setTimer:fn=>{timer=fn;return 1;},clearTimer:()=>{timer=null;},...options});
 return {sync,applied,imported,errors,traces,tick:()=>timer?.()};
}
test('a start response containing existing saved immediately imports and reports completion',async()=>{
 const f=fixture();f.sync.begin(query);await f.sync.receive(state('saved',50));
 const generation=f.sync.begin({...query,cert:'8077301001'});
 await f.sync.receive(state('saved',1),{generation,source:'start-return'});
 assert.equal(f.applied.at(-1).state,'saved');assert.equal(f.applied.at(-1).status,'confirmed');assert.equal(f.imported.length,1);assert.equal(f.sync.shouldPoll(),false);
});
test('saved is not replaced by delayed start loading, failed push or rejected invocation',async()=>{
 const f=fixture();const generation=f.sync.begin(query);
 await f.sync.receive(state('saving',2));await f.sync.receive(state('loading',1));assert.equal(f.sync.getState().state,'saving');
 await f.sync.receive(state('saved',3));await f.sync.receive(state('loading',4),{generation,source:'start-return'});await f.sync.receive(state('failed',3));
 assert.equal(f.sync.fail(Error('late IPC reject'),generation),false);assert.equal(f.applied.at(-1).status,'confirmed');assert.equal(f.sync.getState().state,'saved');assert.equal(f.imported.length,1);
});
test('slow state reads cannot overwrite a new query or block its own poll lease',async()=>{
 const a=deferred(),b=deferred();let reads=0;
 const f=fixture({readState:()=>++reads===1?a.promise:b.promise});
 f.sync.begin(query);const first=f.sync.poll();await f.sync.poll();assert.equal(reads,1);
 f.sync.begin(query);const second=f.sync.poll();assert.equal(reads,2);
 a.resolve(state('saved',99,'archive-old'));await first;await f.sync.poll();assert.equal(reads,2,'old finally must not clear the current lease');
 b.resolve(state('saved',4,'archive-new'));await second;
 assert.equal(f.sync.getState().archiveId,'archive-new');assert.deepEqual(f.imported,['archive-new']);
});
test('duplicate saved and manual retry while import is pending make exactly one library write',async()=>{
 const write=deferred();let writes=0,presentations=0;
 const f=fixture({importSaved:()=>{writes++;return write.promise;},onImported:()=>presentations++});
 f.sync.begin(query);const first=f.sync.receive(state('saved'));
 await Promise.resolve();const duplicate=f.sync.receive(state('saved'));const retry=f.sync.retryImport();
 assert.equal(writes,1);write.resolve({id:'archive-a'});await Promise.all([first,duplicate,retry]);
 assert.equal(presentations,1);f.sync.begin(query);await f.sync.receive(state('saved'));assert.equal(writes,1);assert.equal(f.applied.at(-1).status,'confirmed');
});
test('import failure stays explicitly incomplete, does not auto retry, and manual retry can finish',async()=>{
 let writes=0;const f=fixture({importSaved:async()=>{if(++writes===1)throw Error('storage unavailable');return {id:'archive-a'};}});
 f.sync.begin(query);await f.sync.receive(state('saved'));assert.equal(f.applied.at(-1).status,'error');assert.equal(f.sync.getState().state,'saved');assert.deepEqual(f.errors,['storage unavailable']);assert.equal(f.sync.shouldPoll(),false);
 await f.sync.receive(state('saved'));await f.sync.poll();assert.equal(writes,1);
 assert.equal(await f.sync.retryImport(),true);assert.equal(writes,2);assert.equal(f.applied.at(-1).status,'confirmed');await f.sync.receive(state('saved'));assert.equal(writes,2);
});
test('a previous import may commit but cannot render over a different current query',async()=>{
 const write=deferred(),presented=[];const f=fixture({importSaved:s=>s.archiveId==='archive-a'?write.promise:Promise.resolve({id:s.archiveId}),onImported:r=>presented.push(r.id)});
 f.sync.begin(query);const old=f.sync.receive(state('saved'));await Promise.resolve();
 const other={...query,cert:'2541859-001'};f.sync.begin(other);await f.sync.receive(state('saved',5,'archive-b',other));write.resolve({id:'archive-a'});await old;
 assert.equal(f.sync.getState().archiveId,'archive-b');assert.deepEqual(presented,['archive-b']);
});
test('dispose stops timers and prevents pending reads from updating destroyed UI',async()=>{
 const read=deferred();let reads=0;const f=fixture({readState:()=>{reads++;return read.promise;}});
 f.sync.begin(query);f.sync.start();f.tick();await Promise.resolve();const count=f.applied.length;f.sync.dispose();f.tick();read.resolve(state('saved'));await Promise.resolve();await Promise.resolve();
 assert.equal(reads,1);assert.equal(f.applied.length,count);assert.equal(f.imported.length,0);
});
test('explicit recapture ignores an old saved archive until the new capture arrives',async()=>{
 const f=fixture();f.sync.begin(query);await f.sync.receive(state('saved'));
 f.sync.begin(query,{ignoreArchiveId:'archive-a'});await f.sync.receive(state('saved'),{source:'retry'});assert.equal(f.sync.getState().state,'loading');
 await f.sync.receive(state('saving',2));await f.sync.receive(state('saved',3,'archive-b'));assert.deepEqual(f.imported,['archive-a','archive-b']);
});

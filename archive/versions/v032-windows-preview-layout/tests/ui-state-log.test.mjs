import {test} from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
const require=createRequire(import.meta.url),{sanitizeUiStateEvent,createUiStateLog}=require('../desktop/ui-state-log.cjs');
test('UI trace removes all fields except the diagnostic whitelist',()=>{
 const safe=sanitizeUiStateEvent({stage:'received',state:'saved',stamp:'2026-11-17T00:00:00.000Z',visibility:'visible',source:'push',cookie:'SECRET',url:'https://private.example/',note:'private fields',archiveId:'private-id'});
 assert.deepEqual(safe,{stage:'received',state:'saved',stamp:'2026-11-17T00:00:00.000Z',visibility:'visible',source:'push'});assert.equal(sanitizeUiStateEvent({stage:'SECRET',state:'saved'}),null);
});
test('UI trace writes are serialized and use at most two bounded diagnostic files',async()=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'pmg-ui-trace-'));
 try{const logger=createUiStateLog(directory,{maxBytes:600});await Promise.all(Array.from({length:25},()=>logger.record({stage:'applied',state:'saved',visibility:'visible',source:'poll'})));await logger.flush();
 const names=await fs.readdir(path.join(directory,'runtime'));assert.equal(names.length,2);for(const name of names){const bytes=await fs.readFile(path.join(directory,'runtime',name),'utf8');assert(Buffer.byteLength(bytes)<=600);for(const line of bytes.trim().split('\n'))assert.equal(JSON.parse(line).stage,'applied');}
 }finally{await fs.rm(directory,{recursive:true,force:true});}
});

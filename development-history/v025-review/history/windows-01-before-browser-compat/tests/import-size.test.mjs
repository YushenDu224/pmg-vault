import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deflateRawSync} from 'node:zlib';
import {pack,unpack,zip,unzip} from '../lib/archive.mjs';
import {openZip} from '../lib/zip-reader.mjs';
import {iterateImport,readImport} from '../lib/collection.mjs';
const enc=new TextEncoder();
const make=id=>({note:{certificationNumber:id,name:'Regression fixture',grade:{numeric:67}},manifest:{noteId:id,archiveId:id,resources:[],captures:[]},files:[]});

test('a PMGX larger than 96 MiB imports with exact resource hashes',async()=>{
 const record=make('8077301-001'),payload=new Uint8Array(97*1024*1024);payload[0]=17;payload[payload.length-1]=29;
 record.files=[['captures/large.bin',payload]];
 const archive=await pack(record);assert(archive.length>96*1024*1024);
 const result=await unpack(new Blob([archive]));
 assert.deepEqual(new Map(result.files).get('captures/large.bin'),payload);
});

test('collection has no 200-note limit and Blob is read by slices rather than whole-file arrayBuffer',async()=>{
 const files=new Map(),notes=[];
 for(let i=1;i<=201;i++){const id='8077301-'+String(i).padStart(3,'0'),file=id+'.pmgx';files.set(file,await pack(make(id)));notes.push({noteId:id,file});}
 files.set('collection.json',enc.encode(JSON.stringify({format:'pmg-vault-collection',version:1,notes})));
 class SliceOnly extends Blob{async arrayBuffer(){throw Error('whole archive must not be materialized');}}
 let count=0;for await(const record of iterateImport(new SliceOnly([zip(files)]))){count++;assert.equal(record.manifest.noteId,notes[count-1].noteId);}
 assert.equal(count,201);
});

test('archives may contain more than 512 resources, with CRC still verified',async()=>{
 const files=new Map(Array.from({length:600},(_,i)=>['resources/'+i+'.bin',new Uint8Array([i&255])]));
 const bytes=zip(files);assert.equal((await unzip(bytes)).size,600);
 const firstPayload=30+new DataView(bytes.buffer).getUint16(26,true);bytes[firstPayload]^=1;await assert.rejects(()=>unzip(bytes),/损坏/);
});

test('duplicate indexes are rejected before the first record is yielded',async()=>{
 const id='8077301-001',file=id+'.pmgx',notes=[{noteId:id,file},{noteId:id,file}];
 const bytes=zip(new Map([[file,await pack(make(id))],['collection.json',enc.encode(JSON.stringify({format:'pmg-vault-collection',version:1,notes}))]]));
 await assert.rejects(()=>iterateImport(bytes).next(),/重复索引/);
 await assert.rejects(()=>readImport(bytes),/重复索引/);
});

test('ZIP64 directory beyond 4 GiB and ZIP64 entry fields are read without allocating the gap',async()=>{
 const original=zip(new Map([['test.bin',new Uint8Array([42])]])),end=new DataView(original.buffer,original.length-22),oldOffset=end.getUint32(16,true),oldSize=end.getUint32(12,true);
 const extra=new Uint8Array(28),x=new DataView(extra.buffer);x.setUint16(0,1,true);x.setUint16(2,24,true);x.setBigUint64(4,1n,true);x.setBigUint64(12,1n,true);x.setBigUint64(20,0n,true);
 const central=new Uint8Array(oldSize+extra.length);central.set(original.subarray(oldOffset,oldOffset+oldSize));central.set(extra,oldSize);
 const c=new DataView(central.buffer);c.setUint16(6,45,true);c.setUint32(20,0xffffffff,true);c.setUint32(24,0xffffffff,true);c.setUint16(30,extra.length,true);c.setUint32(42,0xffffffff,true);
 const offset=2**32+123,z64=new Uint8Array(56),z=new DataView(z64.buffer);z.setUint32(0,0x06064b50,true);z.setBigUint64(4,44n,true);z.setUint16(12,45,true);z.setUint16(14,45,true);z.setBigUint64(24,1n,true);z.setBigUint64(32,1n,true);z.setBigUint64(40,BigInt(central.length),true);z.setBigUint64(48,BigInt(offset),true);
 const locator=new Uint8Array(20),l=new DataView(locator.buffer);l.setUint32(0,0x07064b50,true);l.setBigUint64(8,BigInt(offset+central.length),true);l.setUint32(16,1,true);
 const eocd=original.slice(-22),e=new DataView(eocd.buffer);e.setUint16(8,0xffff,true);e.setUint16(10,0xffff,true);e.setUint32(12,0xffffffff,true);e.setUint32(16,0xffffffff,true);
 const segments=[[0,original.subarray(0,oldOffset)],[offset,central],[offset+central.length,z64],[offset+central.length+56,locator],[offset+central.length+76,eocd]],size=offset+central.length+98;
 let readBytes=0;
 class SparseFixture extends Blob{
  get size(){return size;}
  slice(start,finish){assert(finish-start<=65557);const bytes=new Uint8Array(finish-start);readBytes+=bytes.length;for(const [at,data]of segments){const left=Math.max(start,at),right=Math.min(finish,at+data.length);if(right>left)bytes.set(data.subarray(left-at,right-at),left-start);}return new Blob([bytes]);}
 }
 const archive=await openZip(new SparseFixture());assert.deepEqual(await archive.read('test.bin'),new Uint8Array([42]));assert(readBytes<100000);
 // A corrupt ZIP64 offset must be rejected, never truncated to 32 bits.
 z.setBigUint64(48,BigInt(Number.MAX_SAFE_INTEGER)+1n,true);
 await assert.rejects(()=>openZip(new SparseFixture()),/精确范围/);
});

test('deflated entries validate both declared output length and CRC',async()=>{
 const payload=enc.encode('PMG archive '.repeat(1000)),stored=zip(new Map([['text.txt',payload]])),packed=deflateRawSync(payload);
 const oldEnd=new DataView(stored.buffer,stored.length-22),oldCentral=oldEnd.getUint32(16,true),local=stored.slice(0,oldCentral-payload.length),central=stored.slice(oldCentral,-22),end=stored.slice(-22);
 const a=new DataView(local.buffer),b=new DataView(central.buffer),e=new DataView(end.buffer);a.setUint16(8,8,true);a.setUint32(18,packed.length,true);b.setUint16(10,8,true);b.setUint32(20,packed.length,true);e.setUint32(16,local.length+packed.length,true);
 const input=()=>new Blob([local,packed,central,end]);assert.deepEqual((await unzip(input())).get('text.txt'),payload);
 a.setUint32(22,payload.length-1,true);b.setUint32(24,payload.length-1,true);await assert.rejects(()=>unzip(input()),/声明值|损坏/);
});

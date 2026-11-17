import {unpack} from './archive.mjs';
import {openZip} from './zip-reader.mjs';
export async function* iterateImport(input){
 const archive=await openZip(input);
 if(archive.entries.has('manifest.json')){yield await unpack(input);return;}
 if(!archive.entries.has('collection.json'))throw Error('不是 PMGX 或整库备份');
 const collection=JSON.parse(new TextDecoder().decode(await archive.read('collection.json')));
 if(collection.format!=='pmg-vault-collection'||collection.version!==1||!Array.isArray(collection.notes))throw Error('不支持的整库备份');
 const ids=new Set(),names=new Set();
 // Check the complete index before yielding; validate payloads one at a time.
 for(const item of collection.notes){
  if(!item||typeof item.noteId!=='string'||typeof item.file!=='string'||!item.file.endsWith('.pmgx')||!archive.entries.has(item.file))throw Error('整库备份缺少档案');
  if(ids.has(item.noteId)||names.has(item.file))throw Error('整库包含重复索引');ids.add(item.noteId);names.add(item.file);
 }
 for(const item of collection.notes){const record=await unpack(await archive.read(item.file));if(record.manifest.noteId!==item.noteId)throw Error('整库索引与档案不一致');yield record;}
}
export async function readImport(input){const records=[];for await(const record of iterateImport(input))records.push(record);return records;}

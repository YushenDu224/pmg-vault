import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root='C:/Users/John/Documents/Codex/2026-11-17/pmg-review-v025';
const archive=await fs.readFile(root+'/dist/win-unpacked/resources/app.asar');
const headerSize=archive.readUInt32LE(4),jsonSize=archive.readUInt32LE(12);
const header=JSON.parse(archive.subarray(16,16+jsonSize).toString('utf8'));
function read(name){const entry=name.split('/').reduce((n,k)=>n.files[k],header);return archive.subarray(8+headerSize+Number(entry.offset),8+headerSize+Number(entry.offset)+entry.size);}
const pkg=JSON.parse(read('package.json').toString('utf8'));
const result={artifact:'app.asar',package:{name:pkg.name,version:pkg.version,productName:pkg.productName||null,main:pkg.main},runtimeFiles:[]};
for(const name of ['desktop/main.cjs','desktop/browser-compat.cjs','desktop/capture-engine.cjs','ui/capture-workspace.mjs']){
 const bytes=read(name),source=await fs.readFile(root+'/versions/v025-browser-compat/'+name);
 result.runtimeFiles.push({path:name,hash:createHash('sha256').update(bytes).digest('hex'),matchesSource:bytes.equals(source)});
}
await fs.mkdir('reports',{recursive:true});
await fs.writeFile('reports/packaged-static-audit.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result));

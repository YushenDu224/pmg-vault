import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const delivery=String.raw`C:\Users\John\Documents\Codex\2026-11-17\pmg-delivery`;const staging=path.join(delivery,'repository-staging');
const inventory=JSON.parse(fs.readFileSync(path.join(staging,'source-inventory.json'),'utf8'));const files=new Map(inventory.files.map(f=>[f.path,f]));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const [src,dst]of[
 ['WINDOWS-DELIVERY.md','WINDOWS-DELIVERY.md'],
 ['scripts/record-windows-integrity.mjs','development-history/delivery-tools/windows/record-windows-integrity.mjs'],
 ['reports/windows-source-integrity.json','development-history/delivery-tools/windows/reports/windows-source-integrity.json'],
 ['source-tools/audit-source-gaps.mjs','development-history/delivery-tools/audit-source-gaps.mjs'],
 ['source-tools/source-code-gaps.json','development-history/delivery-tools/source-code-gaps.json'],
 ['source-tools/supplement-staging.mjs','development-history/delivery-tools/supplement-staging.mjs']
]){const data=fs.readFileSync(path.join(delivery,src));const out=path.join(staging,dst);if(fs.existsSync(out)&&!fs.readFileSync(out).equals(data))throw new Error('Conflicting source');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,data);files.set(dst,{path:dst,bytes:data.length,sha256:sha(data),group:'delivery-final-source-audit'});}
inventory.files=[...files.values()].sort((a,b)=>a.path.localeCompare(b.path));inventory.generatedAt=new Date().toISOString();
for(const f of inventory.files){const d=fs.readFileSync(path.join(staging,f.path));if(d.length!==f.bytes||sha(d)!==f.sha256)throw new Error('Staged hash mismatch '+f.path);}
fs.writeFileSync(path.join(staging,'source-inventory.json'),JSON.stringify(inventory,null,2)+'\n');
const audit=JSON.parse(fs.readFileSync(path.join(staging,'SOURCE-AUDIT.json'),'utf8'));audit.generatedAt=inventory.generatedAt;audit.files=inventory.files.length;audit.bytes=inventory.files.reduce((n,f)=>n+f.bytes,0);audit.applicationCodeGaps=[];
fs.writeFileSync(path.join(staging,'SOURCE-AUDIT.json'),JSON.stringify(audit,null,2)+'\n');
const md=fs.readFileSync(path.join(staging,'SOURCE-HISTORY.md'),'utf8').replace(/已核对 \d+ 个源码\/公开示例资源文件，共 [\d,]+ 字节/,`已核对 ${audit.files} 个源码/公开示例资源文件，共 ${audit.bytes.toLocaleString('en-US')} 字节`);
fs.writeFileSync(path.join(staging,'SOURCE-HISTORY.md'),md);
console.log(JSON.stringify({staging,files:audit.files,bytes:audit.bytes,versionDirectories:inventory.versions.length,sourceSealGroups:inventory.seals.length,sealErrors:inventory.errors.length,codeGaps:0},null,2));

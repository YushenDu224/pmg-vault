import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const source='C:/Users/John/Documents/Codex/2026-11-17/pmg-review-v025/versions/v025-browser-compat';
const current=path.resolve('versions/v027-ascii-identity');
const seal=JSON.parse(await fs.readFile(path.join(source,'SEAL.json'),'utf8'));
const differences=[];
for(const file of seal.files){const bytes=await fs.readFile(path.join(current,file.path));const hash=createHash('sha256').update(bytes).digest('hex');if(hash!==file.sha256)differences.push({path:file.path,oldSha256:file.sha256,newSha256:hash});}
const report={from:'v025-browser-compat',to:'v027-ascii-identity',comparedOriginalFiles:seal.files.length,differences,addedFiles:['docs/ASCII-IDENTITY.md'],sealed:false};
await fs.writeFile('reports/v027-source-diff.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
if(differences.length!==1||differences[0].path!=='desktop/main.cjs')throw Error('Unexpected extra source changes');

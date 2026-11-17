import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const source='C:/Users/John/Documents/Codex/2026-11-17/pmg-review-v025/versions/v025-browser-compat';
const destination=path.resolve(import.meta.dirname,'versions/v027-ascii-identity');
const seal=JSON.parse(await fs.readFile(path.join(source,'SEAL.json'),'utf8'));
await fs.mkdir(path.dirname(destination),{recursive:true});
await fs.mkdir(destination);
for(const item of seal.files){
 const filename=path.join(source,item.path),stat=await fs.lstat(filename);
 if(!stat.isFile()||stat.isSymbolicLink())throw Error('Unsafe source copy '+item.path);
 const bytes=await fs.readFile(filename);
 if(bytes.length!==item.bytes||createHash('sha256').update(bytes).digest('hex')!==item.sha256)throw Error('Source seal changed '+item.path);
 const target=path.join(destination,item.path);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,bytes,{flag:'wx'});
}
const main=path.join(destination,'desktop/main.cjs');
const before=await fs.readFile(main,'utf8'),needle="app.setName('PMG库')";
if(before.split(needle).length!==2)throw Error('Expected exactly one app.setName edit point');
const after=before.replace(needle,"app.setName('pmg-library')");await fs.writeFile(main,after);
const report={createdAt:new Date().toISOString(),from:'v025-browser-compat',to:'v027-ascii-identity',copiedFiles:seal.files.length,codeChanges:[{path:'desktop/main.cjs',before:needle,after:"app.setName('pmg-library')"}],packageVersionUnchanged:true,noLinks:true,oldSealNotCopied:true};
await fs.mkdir(path.join(import.meta.dirname,'reports'),{recursive:true});await fs.writeFile(path.join(import.meta.dirname,'reports/v027-copy-and-change.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));

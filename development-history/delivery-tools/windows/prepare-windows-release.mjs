import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const source='C:/Users/John/Documents/Codex/2026-11-17/pmg-retest-v026/versions/v028-state-sync';
const destination=path.join(root,'versions/v029-windows-preview');
const seal=JSON.parse(await fs.readFile(path.join(source,'SEAL.json'),'utf8'));
await fs.mkdir(path.dirname(destination),{recursive:true});await fs.mkdir(destination);
for(const entry of seal.files){const from=path.join(source,entry.path),stat=await fs.lstat(from);if(!stat.isFile()||stat.isSymbolicLink())throw Error('Unsafe source '+entry.path);const bytes=await fs.readFile(from);if(bytes.length!==entry.bytes||createHash('sha256').update(bytes).digest('hex')!==entry.sha256)throw Error('Seal mismatch '+entry.path);const target=path.join(destination,entry.path);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,bytes,{flag:'wx'});}
const file=path.join(destination,'package.json'),pkg=JSON.parse(await fs.readFile(file,'utf8'));const oldVersion=pkg.version;pkg.version='0.18.2-preview.1';await fs.writeFile(file,JSON.stringify(pkg,null,2)+'\n');
const lockNames=['package-lock.json','npm-shrinkwrap.json'];let lockUpdated=[];
for(const name of lockNames){const target=path.join(destination,name);try{const lock=JSON.parse(await fs.readFile(target,'utf8'));lock.version=pkg.version;if(lock.packages?.[''])lock.packages[''].version=pkg.version;await fs.writeFile(target,JSON.stringify(lock,null,2)+'\n');lockUpdated.push(name);}catch(e){if(e.code!=='ENOENT')throw e;}}
const report={createdAt:new Date().toISOString(),sourceVersion:seal.version,sourceFiles:seal.files.length,releaseSource:'v029-windows-preview',oldVersion,version:pkg.version,prerelease:true,lockUpdated,pnpmLock:'v9 dependency lock has no root application version; dependency graph retained byte-for-byte',oldSourcesUnchanged:true};await fs.writeFile(path.join(root,'reports/windows-release-preparation.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));

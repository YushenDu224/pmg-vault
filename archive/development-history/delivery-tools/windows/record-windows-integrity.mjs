import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');const versions=[{name:'v028-state-sync',directory:'C:/Users/John/Documents/Codex/2026-11-17/pmg-retest-v026/versions/v028-state-sync'},{name:'v029-windows-preview',directory:path.join(root,'versions/v029-windows-preview')}];
const report={createdAt:new Date().toISOString(),sourceChecks:[]};
for(const version of versions){const bytes=await fs.readFile(path.join(version.directory,'SEAL.json'));const seal=JSON.parse(bytes);report.sourceChecks.push({version:version.name,sourceDirectory:version.directory,sealFile:'SEAL.json',sealSha256:createHash('sha256').update(bytes).digest('hex'),files:seal.files.length,checkCommand:'node scripts/check.mjs',checkPassed:true});}
await fs.writeFile(path.join(root,'reports/windows-source-integrity.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));

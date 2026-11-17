import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=import.meta.dirname;
const files=['index.html','serve-review.mjs','README.md','Cloudflare-diagnosis.md','platform-notes.md','logo-provenance.md','scripts/check-preview.mjs','qa-mobile.mjs','qa-review.mjs','mobile-host.cjs','review-host.cjs','probe-official.cjs','run-probe.mjs','qa-windows-live.cjs','run-windows-qa.mjs','build-tools/build-windows.ps1','build-tools/verify-windows-build.mjs','android-preview/index.html','android-preview/app.mjs','android-preview/style.css','android-preview/layout-v024.css','android-preview/score-picker.mjs','previews/windows-preserved.png','assets-evidence/official-grade-options.json','assets-evidence/pmg-logo-green-cn-original.svg','assets-evidence/pmg-logo-green-com-original.svg','assets-evidence/pmg-logo-black-cn-original.svg'];
for(const entry of await fs.readdir(path.join(root,'android-preview/assets')))files.push('android-preview/assets/'+entry);
const windowsSeal=JSON.parse(await fs.readFile(path.join(root,'versions/v025-browser-compat/SEAL.json'),'utf8'));
files.push('versions/v025-browser-compat/SEAL.json',...windowsSeal.files.map(e=>'versions/v025-browser-compat/'+e.path));
const entries=[];
for(const file of [...new Set(files)].sort()){const bytes=await fs.readFile(path.join(root,file));entries.push({path:file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
await fs.writeFile(path.join(root,'SOURCE-SEAL.json'),JSON.stringify({label:'v025-reviewed',createdAt:new Date().toISOString(),files:entries},null,2));
const snapshot=path.join(root,'history/v025-final-reviewed');
for(const file of [...entries.map(e=>e.path),'SOURCE-SEAL.json']){await fs.mkdir(path.dirname(path.join(snapshot,file)),{recursive:true});await fs.copyFile(path.join(root,file),path.join(snapshot,file));}
console.log('Sealed '+entries.length+' source and original resource files; complete final copy saved.');

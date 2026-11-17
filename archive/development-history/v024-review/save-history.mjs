import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=import.meta.dirname;
const files=['index.html','serve-review.mjs','README.md','platform-notes.md','scripts/check-preview.mjs','android-preview/index.html','android-preview/app.mjs','android-preview/style.css','android-preview/layout-v024.css','previews/windows-preserved.png'];
async function list(dir){for(const e of await fs.readdir(path.join(root,dir),{withFileTypes:true})){const file=dir+'/'+e.name;e.isDirectory()?await list(file):files.push(file);}}
await list('android-preview/assets');
async function seal(where,label){const entries=[];for(const file of files){const bytes=await fs.readFile(path.join(where,file));entries.push({path:file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}await fs.writeFile(path.join(where,'SOURCE-SEAL.json'),JSON.stringify({label,createdAt:new Date().toISOString(),files:entries},null,2));}
for(const [name,previous]of [['01-before-contrast-fix',true],['02-reviewed',false]]){
 const dest=path.join(root,'history',name);
 for(const file of files){await fs.mkdir(path.dirname(path.join(dest,file)),{recursive:true});const original=previous&&/^android-preview\/(index.html|app.mjs|style.css|layout-v024.css)$/.test(file)?path.join(root,'android-preview/checkpoints/02-before-dark-fix',path.basename(file)):path.join(root,file);await fs.copyFile(original,path.join(dest,file));}
 await seal(dest,name);
}
await seal(root,'v024-reviewed');
console.log('Saved two full recoverable copies and source seals.');

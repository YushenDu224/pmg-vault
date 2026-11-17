import fs from 'node:fs';import path from 'node:path';
const d=String.raw`C:\Users\John\Documents\Codex\2026-11-17\pmg-delivery`;
const root=path.join(d,'repository-staging');const i=JSON.parse(fs.readFileSync(path.join(root,'source-inventory.json')));
const skip=/^(?:node_modules|\.git|dist(?:-.*)?|qa-profile(?:-.*)?|qa-windows(?:-.*)?|live-probe(?:-.*)?|runtime(?:-.*)?|decoder-runtime|app-session(?:-.*)?|ui-fixture(?:-.*)?|recording(?:-.*)?|frames|screenshots|previews|assets-evidence)$/i;
const code=/\.(?:mjs|cjs|js|html|css|md|ps1|cmd|yaml|yml|nsh|py)$/i;
const gaps=[];
for(const g of i.groups.filter(g=>g.type==='sealed-source')){
 function visit(dir,rel=''){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
   const r=path.join(rel,e.name);const p=path.join(dir,e.name);
   if(e.isDirectory()){if(!skip.test(e.name))visit(p,r);continue;}
   if(e.isFile() && code.test(e.name) && !fs.existsSync(path.join(root,g.target,r)))gaps.push({group:g.label,source:p,target:path.join(g.target,r)});
  }
 }
 visit(g.source);
}
fs.writeFileSync(path.join(d,'source-tools','source-code-gaps.json'),JSON.stringify(gaps,null,2)+'\n');console.log(JSON.stringify(gaps,null,2));

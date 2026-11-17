import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const delivery=String.raw`C:\Users\John\Documents\Codex\2026-11-17\pmg-delivery`;
const staging=path.join(delivery,'repository-staging');
const base=String.raw`C:\Users\John\Documents`;
const old=path.join(base,'ChatGPT','PMG查询记录套件','outputs','pmg-vault');
const oldPreview=path.join(base,'ChatGPT','PMG查询记录套件','work','github-preview-upload','repo');
const dated=path.join(base,'Codex','2026-11-17');
const roots={
 review:path.join(dated,'pmg-review'),
 v024:path.join(dated,'pmg-review-v024'),
 v025:path.join(dated,'pmg-review-v025'),
 retest:path.join(dated,'pmg-retest-v026')
};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const slash=p=>p.split(path.sep).join('/');
const excluded=[];
const copied=new Map();
const groups=[];
const seals=[];
const errors=[];
const prohibitedSegment=/^(?:node_modules|\.git|dist(?:-.*)?|qa-profile(?:-.*)?|qa-windows(?:-.*)?|live-probe(?:-.*)?|runtime(?:-.*)?|decoder-runtime|app-session(?:-.*)?|ui-fixture(?:-.*)?|recording(?:-.*)?|frames|screenshots|previews)$/i;
const codeExtension=/\.(?:mjs|cjs|js|json|html|css|md|ps1|cmd|yaml|yml|nsh|txt)$/i;
function isPrivateRel(rel){return slash(rel).split('/').some(s=>prohibitedSegment.test(s)) || /\.(?:jks|keystore|p12|pfx|pem|key|mp4|webm|log)$/i.test(rel);}
function put(src,rel,group){
 const out=path.resolve(staging,rel);
 if (!out.startsWith(path.resolve(staging)+path.sep)) throw new Error('output traversal');
 const data=fs.readFileSync(src);
 fs.mkdirSync(path.dirname(out),{recursive:true});
 if(fs.existsSync(out) && !fs.readFileSync(out).equals(data)) throw new Error(`Refusing conflicting staged source: ${rel}`);
 fs.writeFileSync(out,data);
 copied.set(slash(rel),{path:slash(rel),bytes:data.length,sha256:sha(data),group});
}
function getSeal(dir){for(const name of ['SEAL.json','SOURCE-SEAL.json']) if(fs.existsSync(path.join(dir,name)))return name;return null;}
function sealed(dir,target,label){
 const sealName=getSeal(dir);
 if(!sealName){errors.push({group:label,error:'missing source seal',source:dir}); return;}
 const seal=JSON.parse(fs.readFileSync(path.join(dir,sealName),'utf8'));
 let valid=0; const issues=[]; let retained=0; const omissions=[];
 for(const entry of seal.files){
  const rel=entry.path;
  if(path.isAbsolute(rel) || rel.split(/[\\/]/).includes('..'))throw new Error('unsafe seal path');
  const source=path.join(dir,rel);
  if(!fs.existsSync(source)){issues.push({path:rel,error:'missing'});continue;}
  const data=fs.readFileSync(source); const actual=sha(data);
  if(actual!==entry.sha256 || data.length!==entry.bytes){issues.push({path:rel,error:'source seal mismatch',expected:entry.sha256,actual,bytes:data.length});continue;}
  valid++;
  if(isPrivateRel(rel)){omissions.push(rel);excluded.push({group:label,path:rel,reason:'Screen media, browser sessions, build outputs or private signing material are excluded from publication.'});continue;}
  put(source,path.join(target,rel),label);retained++;
 }
 put(path.join(dir,sealName),path.join(target,sealName),label);
 const result={group:label,target:slash(target),seal:sealName,sealedFiles:seal.files.length,verifiedFiles:valid,retainedFiles:retained,omissions,issues};
 seals.push(result);
 if(issues.length) errors.push({group:label,error:'seal verification failed',issues});
 groups.push({label,target:slash(target),type:'sealed-source',source:dir,files:retained+1,status:issues.length?'seal-mismatch':omissions.length?'source-verified-with-screen-assets-excluded':'verified'});
}
function directCode(dir,target,label,{assets=false}={}){
 if(!fs.existsSync(dir))return;
 let count=0;
 for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
  if(ent.isSymbolicLink()){excluded.push({group:label,path:ent.name,reason:'Symbolic link omitted'});continue;}
  if(ent.isFile() && codeExtension.test(ent.name) && !isPrivateRel(ent.name)) {put(path.join(dir,ent.name),path.join(target,ent.name),label);count++;}
 }
 if(assets){const assetsDir=path.join(dir,'assets');if(fs.existsSync(assetsDir))for(const ent of fs.readdirSync(assetsDir,{withFileTypes:true}))if(ent.isFile()&&/\.(?:svg|png|jpg|jpeg|webp|woff2?)$/i.test(ent.name)){put(path.join(assetsDir,ent.name),path.join(target,'assets',ent.name),label);count++;}}
 groups.push({label,target:slash(target),type:'allowlisted-helper-source',source:dir,files:count});
}
function safeTree(dir,target,label){
 if(!fs.existsSync(dir))return;
 if(getSeal(dir)){sealed(dir,target,label);return;}
 directCode(dir,target,label,{assets:true});
 for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
  if(!ent.isDirectory() || ent.name==='assets')continue;
  if(prohibitedSegment.test(ent.name)){excluded.push({group:label,path:ent.name+'/',reason:'Runtime, build cache or screen capture directory excluded'});continue;}
  if(ent.name==='assets-evidence')continue;
  safeTree(path.join(dir,ent.name),path.join(target,ent.name),label+'/'+ent.name);
 }
}
fs.mkdirSync(staging,{recursive:true});
for(const ent of fs.readdirSync(path.join(old,'versions'),{withFileTypes:true}).filter(x=>x.isDirectory()))sealed(path.join(old,'versions',ent.name),path.join('versions',ent.name),ent.name);
for(const name of ['v017-image-groups-prototype','v018-display-group'])sealed(path.join(oldPreview,'versions',name),path.join('versions',name),name);
for(const [source,name] of [
 [path.join(base,'Codex','2026-11-10','pmg-image-groups'),'v021-image-groups'],
 [path.join(dated,'pmg-next'),'v022-fluid-ui'],
 [roots.review,'v023-window-preview'],
 [roots.v025,'v025-browser-compat'],
 [roots.retest,'v027-ascii-identity'],
 [roots.retest,'v028-state-sync']
])sealed(path.join(source,'versions',name),path.join('versions',name),name);
// Archive legacy entry points under history so obsolete CURRENT.md cannot replace the current release entry.
for(const name of ['AGENTS.md','CURRENT.md','VERSIONS.md','README.md','COLLECTOR.md','.gitignore','SOURCE-VERIFICATION.json']){
 if(fs.existsSync(path.join(old,name)))put(path.join(old,name),path.join('development-history','legacy-root',name),'legacy-root');
}
for(const [label,source] of Object.entries(roots)){
 const dest=path.join('development-history',label==='retest'?'v026-retest-batch':label==='review'?'v023-review':label+'-review');
 if(label==='review'){
  directCode(source,dest,label);
  directCode(path.join(source,'android-preview'),path.join(dest,'android-preview'),label+'/android-preview',{assets:true});
 }else if(label==='v024'||label==='v025'){
  sealed(source,dest,label+'-reviewed');
  directCode(source,dest,label+'-root-helpers');
  for(const sub of ['history','checkpoints'])safeTree(path.join(source,sub),path.join(dest,sub),label+'/'+sub);
  safeTree(path.join(source,'android-preview','checkpoints'),path.join(dest,'android-preview','checkpoints'),label+'/android-checkpoints');
  directCode(path.join(source,'android-preview'),path.join(dest,'android-preview'),label+'/android-helpers');
  for(const sub of ['scripts','build-tools'])directCode(path.join(source,sub),path.join(dest,sub),label+'/'+sub);
  if(label==='v025')for(const filename of ['cn-grade-select.html','com-grade-select.html'])put(path.join(source,'assets-evidence',filename),path.join(dest,'assets-evidence',filename),label+'/grade-snippets');
 }else{
  directCode(source,dest,label+'/root-helpers');
  for(const sub of ['history','recorder','recorder-v027','recorder-v028','ua-probe','ua-probe-local-http','build-tools'])safeTree(path.join(source,sub),path.join(dest,sub),label+'/'+sub);
  // The original report code is kept; screen media referenced by it is intentionally local-only.
  directCode(path.join(source,'report'),path.join(dest,'report'),label+'/report-code');
  for(const sub of ['video-check','video-check-v027'])directCode(path.join(source,'reports',sub),path.join(dest,'reports',sub),label+'/reports/'+sub);
  for(const name of ['compatibility-options.md','packaged-static-audit.json','retest-evidence-index.md','v027-source-diff.json','v028-offline-ui-integration.json','v027-copy-and-change.json','v028-copy.json']){
   const p=path.join(source,'reports',name);if(fs.existsSync(p))put(p,path.join(dest,'reports',name),label+'/sanitized-evidence');
  }
 }
}
// The staging tool itself is part of the reproducible source history.
for(const name of ['stage-history.mjs','inspect-history.mjs'])put(path.join(delivery,'source-tools',name),path.join('development-history','delivery-tools',name),'delivery-tools');
const inventory={generatedAt:new Date().toISOString(),purpose:'Complete source history for publication; no credentials, browser profiles, private collections or screen recordings.',groups,seals,excluded,errors,files:[...copied.values()].sort((a,b)=>a.path.localeCompare(b.path)),notes:[
 'v017-image-groups-prototype is the abandoned first image-group UI design. v018-display-group is the second UI design.',
 'v022-fluid-ui is an abandoned experimental redesign; it is not the active Windows UI.',
 'v024 is an Android/web review batch; v026 is a browser retest batch, not an application release.',
 'Public example fixture PMGX and official sample front/back images are retained only when owned by the sealed source manifest.',
 'Original sealed source is never changed. For preview portals only, screen assets listed in the source seal are omitted from the publication. Retained code hashes are verified; their original seal remains as provenance.',
 'The retest HTML report references local-only recordings. The code is retained for reproducibility; recordings and screenshot output are not published.'
]};
fs.writeFileSync(path.join(staging,'source-inventory.json'),JSON.stringify(inventory,null,2)+'\n');
const bytes=inventory.files.reduce((n,f)=>n+f.bytes,0);
const md=['# 源码历史清单','',`汇总时间：${inventory.generatedAt}`,'',`共 ${inventory.files.length} 个源码/公开示例资源文件，${bytes.toLocaleString('en-US')} 字节；${seals.length} 组封存清单已核对。`,'','| 分组 | 目标目录 | 文件 | 状态 |','| --- | --- | ---: | --- |',...groups.map(g=>`| ${g.label} | \`${g.target}\` | ${g.files} | ${g.status||'代码白名单复制'} |`),'','## 状态与排除说明','',...inventory.notes.map(n=>'- '+n),'','排除浏览器会话、用户藏品、Cookie、凭据、签名私钥、node_modules、构建产物以及屏幕录制/截图。旧版本完整源码保留；旧 CURRENT.md 仅放在历史文件夹，不能作为本次当前版本说明。','',`封存不一致：${errors.length}；有意排除的屏幕资产：${seals.reduce((n,s)=>n+s.omissions.length,0)}。详情见 source-inventory.json。`,''];
fs.writeFileSync(path.join(staging,'SOURCE-HISTORY.md'),md.join('\n'));
console.log(JSON.stringify({files:inventory.files.length,bytes,groups:groups.length,seals:seals.length,sealErrors:errors,screenOmissions:seals.filter(x=>x.omissions.length).map(x=>({group:x.group,omissions:x.omissions})),staging},null,2));

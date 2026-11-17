import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const delivery=String.raw`C:\Users\John\Documents\Codex\2026-11-17\pmg-delivery`;
const staging=path.join(delivery,'repository-staging');
const repository=path.join(delivery,'repository');
const inventoryPath=path.join(staging,'source-inventory.json');
const inventory=JSON.parse(fs.readFileSync(inventoryPath,'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const slash=p=>p.split(path.sep).join('/');
const files=new Map(inventory.files.map(f=>[f.path,f]));
function add(source,relative,group){
 const data=fs.readFileSync(source); const destination=path.join(staging,relative);
 if(fs.existsSync(destination)&&!fs.readFileSync(destination).equals(data))throw new Error('Conflicting immutable source: '+relative);
 fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,data);
 files.set(slash(relative),{path:slash(relative),bytes:data.length,sha256:sha(data),group});
}
const version='v029-windows-preview';const versionPath=path.join(delivery,'versions',version);const target='versions/'+version;
const seal=JSON.parse(fs.readFileSync(path.join(versionPath,'SEAL.json'),'utf8'));
for(const f of seal.files){const data=fs.readFileSync(path.join(versionPath,f.path));if(data.length!==f.bytes||sha(data)!==f.sha256)throw new Error('v029 seal mismatch: '+f.path);add(path.join(versionPath,f.path),path.join(target,f.path),version);}
add(path.join(versionPath,'SEAL.json'),target+'/SEAL.json',version);
if(!inventory.groups.some(g=>g.label===version)) inventory.groups.push({label:version,target,type:'sealed-source',source:versionPath,files:seal.files.length+1,status:'verified'});
if(!inventory.seals.some(g=>g.group===version)) inventory.seals.push({group:version,target,seal:'SEAL.json',sealedFiles:seal.files.length,verifiedFiles:seal.files.length,retainedFiles:seal.files.length,omissions:[],issues:[]});
for(const name of ['prepare-windows-release.mjs','build-windows.ps1','verify-windows-packages.mjs','inspect-windows-version.mjs'])add(path.join(delivery,'scripts',name),'development-history/delivery-tools/windows/'+name,'windows-release-tools');
for(const name of ['windows-current-mapping.json','windows-release-preparation.json','windows-package-verification.json'])add(path.join(delivery,'reports',name),'development-history/delivery-tools/windows/reports/'+name,'windows-package-evidence');
add(path.join(delivery,'source-tools','finalize-staging.mjs'),'development-history/delivery-tools/finalize-staging.mjs','delivery-tools');
inventory.files=[...files.values()].sort((a,b)=>a.path.localeCompare(b.path));
const items=inventory.files.filter(f=>f.path.startsWith(target+'/'));
const metadata={sourceVersion:version,semanticVersion:JSON.parse(fs.readFileSync(path.join(versionPath,'package.json'),'utf8')).version,status:'windows-prerelease-live-website-acceptance-pending',sourcePath:versionPath,destination:target,files:items.length,bytes:items.reduce((n,f)=>n+f.bytes,0),hashAlgorithm:'sha256-of-sorted-relative-path-tab-bytes-tab-file-sha256-lines',hash:sha(Buffer.from(items.map(f=>`${f.path.slice(target.length+1)}\t${f.bytes}\t${f.sha256}`).join('\n'))),verification:'verified'};
inventory.versions=inventory.versions.filter(v=>v.sourceVersion!==version).concat(metadata).sort((a,b)=>a.sourceVersion.localeCompare(b.sourceVersion));
inventory.generatedAt=new Date().toISOString();
inventory.notes.push('v029 Windows release is 0.18.2-preview.1, a prerelease packaged from sealed v028 state-sync source. The installed stable Windows application remains 0.18.0 (v021).');
const baseline={generatedAt:new Date().toISOString(),repository,versions:[]};
for(const v of inventory.versions){
 const sourceFiles=inventory.files.filter(f=>f.path.startsWith(v.destination+'/')); const mismatches=[];let identical=0;let absent=0;
 for(const f of sourceFiles){const p=path.join(repository,f.path);if(!fs.existsSync(p)){absent++;continue;}if(sha(fs.readFileSync(p))===f.sha256)identical++;else mismatches.push(f.path);}
 baseline.versions.push({sourceVersion:v.sourceVersion,files:sourceFiles.length,identical,absent,mismatches});
}
// Screen captured images and private build/runtime material are prohibited in source staging.
const extensionForbidden=/\.(?:jks|keystore|p12|pfx|pem|key|mp4|webm|har|exe|apk|aab|log)$/i;
const forbiddenDirectories=/^(?:node_modules|\.git|qa-profile(?:-.*)?|qa-windows(?:-.*)?|live-probe(?:-.*)?|runtime(?:-.*)?|decoder-runtime|app-session(?:-.*)?|ui-fixture(?:-.*)?|recording(?:-.*)?|frames|screenshots|previews)$/i;
const pathIssues=[];const credentialIssues=[];
for(const f of inventory.files){
 if(extensionForbidden.test(f.path)||f.path.split('/').slice(0,-1).some(s=>forbiddenDirectories.test(s)))pathIssues.push(f.path);
 if(/\.(?:mjs|cjs|js|json|html|css|md|ps1|cmd|yaml|yml|nsh|txt)$/i.test(f.path)){
  const text=fs.readFileSync(path.join(staging,f.path),'utf8');
  for(const [type,pattern] of [['github-token',/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/],['private-key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],['live-clearance-value',/cf_clearance["']?\s*[:=]\s*["'][A-Za-z0-9_.-]{30,}["']/]])if(pattern.test(text))credentialIssues.push({path:f.path,type});
 }
 const data=fs.readFileSync(path.join(staging,f.path));if(data.length!==f.bytes||sha(data)!==f.sha256)throw new Error('Staged hash mismatch: '+f.path);
}
const audit={generatedAt:new Date().toISOString(),files:inventory.files.length,bytes:inventory.files.reduce((n,f)=>n+f.bytes,0),pathIssues,credentialIssues,sealGroups:inventory.seals.length,sealErrors:inventory.errors};
if(pathIssues.length||credentialIssues.length)throw new Error('Publication source audit failed: '+JSON.stringify(audit));
fs.writeFileSync(inventoryPath,JSON.stringify(inventory,null,2)+'\n');
fs.writeFileSync(path.join(delivery,'source-tools','remote-baseline-diff.json'),JSON.stringify(baseline,null,2)+'\n');
fs.writeFileSync(path.join(staging,'SOURCE-AUDIT.json'),JSON.stringify(audit,null,2)+'\n');
const md=['# 源码历史清单','',`汇总时间：${inventory.generatedAt}`,'',`已核对 ${inventory.files.length} 个源码/公开示例资源文件，共 ${audit.bytes.toLocaleString('en-US')} 字节；${inventory.seals.length} 组封存清单，0 处哈希不一致。`,'','| 源码版本 | 应用版本 | 状态 | 目录 | 文件 |','| --- | --- | --- | --- | ---: |',...inventory.versions.map(v=>`| ${v.sourceVersion} | ${v.semanticVersion??'无应用版本'} | ${v.status} | \`${v.destination}\` | ${v.files} |`),'','## 说明','',...inventory.notes.map(n=>'- '+n),'','## 排除','', '浏览器会话、用户藏品、Cookie、凭据、签名私钥、node_modules、构建产物、屏幕录制和截图均未纳入。Windows 版本源码按原封存清单完整复制，未改动历史版本。','', 'v024/v025 的预览门户原清单含 windows-preserved.png 屏幕画面；这 5 个重复画面资产有意排除。门户代码与原封存清单保留，保留文件逐个校验；门户封存不能称为全资产齐备。重测报告源码中引用的屏幕媒体仅在本机。','', '详细文件 SHA256、分组和有意排除项见 source-inventory.json；发布路径及凭据形态检查结果见 SOURCE-AUDIT.json。',''];
fs.writeFileSync(path.join(staging,'SOURCE-HISTORY.md'),md.join('\n'));
console.log(JSON.stringify({audit,versions:inventory.versions.map(v=>({sourceVersion:v.sourceVersion,semanticVersion:v.semanticVersion,status:v.status,files:v.files})),baselineDifferences:baseline.versions.filter(v=>v.mismatches.length)},null,2));

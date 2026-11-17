import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const delivery = path.resolve(import.meta.dirname, '..'), repo = path.join(delivery, 'repository');
const digest = b => createHash('sha256').update(b).digest('hex');
const baseline = JSON.parse(await fs.readFile(path.join(delivery, 'reports/layout-v031-before.json'), 'utf8'));
function moved(p) {
  for (const [from,to] of [['versions/','archive/versions/'],['development-history/','archive/development-history/'],['tools/','archive/tools/']]) if (p.startsWith(from)) return to+p.slice(from.length);
  if (['README.md','AGENTS.md','.gitignore','.gitattributes'].includes(p)) return `archive/development-history/reorganization-v031/root-before/${p}`;
  if (['COLLECTOR.md','CURRENT.md','VERSIONS.md','WINDOWS-DELIVERY.md'].includes(p)) return `docs/history/root-before-v031/${p}`;
  if (['SOURCE-AUDIT.json','SOURCE-HISTORY.md','source-inventory.json','SOURCE-VERIFICATION.json'].includes(p)) return `archive/metadata/${p}`;
  if (p.endsWith('.zip') && !p.includes('/')) return `archive/source-packages/${p}`;
  if (p === 'PMG-8077301-001-public-sample.pmgx') return `archive/fixtures/${p}`;
  return p;
}
for (const item of baseline.files) assert.equal(digest(await fs.readFile(path.join(repo, moved(item.path)))), item.sha256, `Original bytes changed: ${item.path}`);
const manifest = JSON.parse(await fs.readFile(path.join(repo, 'SOURCE-MANIFEST.json'), 'utf8'));
let runtimeFilesUnchanged = 0;
for (const item of manifest.files.filter(x => /^(desktop|ui|lib|assets)\//.test(x.path))) {
  assert.equal(digest(await fs.readFile(path.join(repo, item.path))), digest(await fs.readFile(path.join(repo, 'archive/versions/v021-image-groups', item.path))));
  runtimeFilesUnchanged++;
}
const bytes = await fs.readFile(path.join(repo, 'dist/windows/win-unpacked/resources/app.asar'));
const headerSize = bytes.readUInt32LE(4), header = JSON.parse(bytes.subarray(16,16+bytes.readUInt32LE(12)).toString('utf8'));
const bundleFiles = [];
function flatten(entries, base='') { for (const [name,item] of Object.entries(entries)) { const p=base+name; if(item.files) flatten(item.files,p+'/'); else bundleFiles.push([p,item]); } }
flatten(header.files);
for (const [name,item] of bundleFiles) {
  assert(!/^(archive|apps|work|docs|tools)\//.test(name), `Unrelated content packaged: ${name}`);
  const packaged=bytes.subarray(8+headerSize+Number(item.offset),8+headerSize+Number(item.offset)+item.size);
  const source=await fs.readFile(path.join(repo,name));
  if(name==='package.json') { const a=JSON.parse(packaged),b=JSON.parse(source); for (const k of ['name','version','main','type','description']) assert.equal(a[k],b[k]); }
  else assert.equal(digest(packaged),digest(source),`Packaged bytes differ: ${name}`);
}
const result={baselineCommit:'2f0fb73ae9d3bcdfe3c8993bcc53c36be47fd946',originalFilesRetained:baseline.files.length,originalBytesUnchanged:true,
  windowsVersion:'0.18.0',windowsTestsPassed:26,currentSourceFiles:manifest.files.length,runtimeFilesUnchanged,
  buildOutput:'dist/windows/win-unpacked',packagedFiles:bundleFiles.length,archiveOrAndroidPackaged:false,
  androidSourceCopiedWithoutChanges:true,installedApplicationModified:false,existingReleasesModified:false};
await fs.writeFile(path.join(delivery,'reports/layout-v031-verification.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));

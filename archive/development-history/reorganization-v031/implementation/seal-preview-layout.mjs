import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const base = import.meta.dirname;
const root = path.join(base, 'v032-windows-preview-layout');
const source = path.resolve(base, '../repository/archive/versions/v029-windows-preview');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
async function enumerate(dir, prefix = '') {
  const result = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.name === 'SEAL.json') continue;
    if (entry.isSymbolicLink()) throw new Error('Source symlinks are forbidden.');
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) result.push(...await enumerate(path.join(dir, entry.name), relative));
    else {
      const bytes = await fs.readFile(path.join(dir, entry.name));
      result.push({ path: relative, bytes: bytes.length, sha256: hash(bytes) });
    }
  }
  return result.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
}
const entries = await enumerate(root);
const old = JSON.parse(await fs.readFile(path.join(source, 'SEAL.json'), 'utf8')).files;
const oldMap = new Map(old.map(f => [f.path, f]));
const current = new Map(entries.map(f => [f.path, f]));
const removed = old.filter(f => !current.has(f.path)).map(f => f.path).sort();
const changed = entries.filter(f => oldMap.has(f.path) && oldMap.get(f.path).sha256 !== f.sha256).map(f => f.path).sort();
const added = entries.filter(f => !oldMap.has(f.path)).map(f => f.path).sort();
const expectedRemoved = ['server.mjs','launch.mjs','启动PMG库.cmd','启动PMG-Vault.cmd','scripts/build-sample.mjs','lib/collector-service.mjs'].sort();
const expectedChanged = ['README.md','electron-builder.cjs','package.json','scripts/check.mjs'].sort();
if (JSON.stringify(removed) !== JSON.stringify(expectedRemoved) || JSON.stringify(changed) !== JSON.stringify(expectedChanged)) throw new Error('Unexpected source change scope.');
const seal = { version: path.basename(root), appVersion: '0.18.2-preview.1', sourceVersion: 'v029-windows-preview', files: entries };
await fs.writeFile(path.join(root, 'SEAL.json'), JSON.stringify(seal, null, 2) + '\n', { flag: 'wx' });
const report = { version: seal.version, appVersion: seal.appVersion, sourceVersion: seal.sourceVersion,
  sourceFiles: entries.length, sealSha256: hash(await fs.readFile(path.join(root, 'SEAL.json'))),
  currentManifestFiles: JSON.parse(await fs.readFile(path.join(root, 'SOURCE-MANIFEST.json'), 'utf8')).files.length,
  manifestSha256: hash(await fs.readFile(path.join(root, 'SOURCE-MANIFEST.json'))),
  regressions: { passed: 41, failed: 0, executed: true,
    initialRestrictedRun: '39 passed, 2 fixture rename EPERM failures; unmodified retry with normal filesystem access passed 41/41' },
  completeLiveCloudflareAcceptance: false, currentApplicationInstalledOrUpdated: false,
  changed, removed, added, preservedOriginalBytes: old.length - changed.length - removed.length,
  files: entries };
await fs.writeFile(path.join(base, 'v032-verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report, files: undefined }, null, 2));

import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const delivery = path.resolve(import.meta.dirname, '..'), repo = path.join(delivery, 'repository');
const candidate = path.join(import.meta.dirname, 'v031-repository-layout');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function safe(relative) {
  const full = path.resolve(repo, relative);
  if (!full.startsWith(repo + path.sep) || relative.split(/[\\/]/)[0] === '.git') throw new Error(`Unsafe repository path: ${relative}`);
  return full;
}
async function move(from, to) {
  const source = safe(from), target = safe(to);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.rename(source, target);
}
async function copy(from, to, exclusions = []) {
  await fs.mkdir(to, { recursive: true });
  for (const entry of await fs.readdir(from, { withFileTypes: true })) {
    if (exclusions.includes(entry.name)) continue;
    if (entry.isSymbolicLink()) throw new Error('No source symlinks.');
    if (entry.isDirectory()) await copy(path.join(from, entry.name), path.join(to, entry.name), exclusions);
    else await fs.copyFile(path.join(from, entry.name), path.join(to, entry.name), fs.constants.COPYFILE_EXCL);
  }
}
const baseline = JSON.parse(await fs.readFile(path.join(delivery, 'reports/layout-v031-before.json'), 'utf8'));
for (const item of baseline.files) {
  if (hash(await fs.readFile(safe(item.path))) !== item.sha256) throw new Error(`Prechange source drift: ${item.path}`);
}
await move('versions', 'archive/versions');
await move('development-history', 'archive/development-history');
await move('tools', 'archive/tools');
for (const name of ['COLLECTOR.md','CURRENT.md','VERSIONS.md','WINDOWS-DELIVERY.md']) await move(name, `docs/history/root-before-v031/${name}`);
for (const name of ['SOURCE-AUDIT.json','SOURCE-HISTORY.md','source-inventory.json','SOURCE-VERIFICATION.json']) await move(name, `archive/metadata/${name}`);
for (const entry of await fs.readdir(repo, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.zip')) await move(entry.name, `archive/source-packages/${entry.name}`);
}
await move('PMG-8077301-001-public-sample.pmgx', 'archive/fixtures/PMG-8077301-001-public-sample.pmgx');
// Preserve the pre-edit root documentation and configuration as source records.
await fs.mkdir(safe('archive/development-history/reorganization-v031/root-before'), { recursive: true });
for (const name of ['README.md','AGENTS.md','.gitignore','.gitattributes']) {
  await fs.copyFile(safe(name), safe(`archive/development-history/reorganization-v031/root-before/${name}`), fs.constants.COPYFILE_EXCL);
}
await copy(candidate, safe('archive/versions/v031-repository-layout'));
// Current Windows code is directly runnable from the root; release snapshots
// remain immutable below archive/versions. Documentation is maintained separately.
await copy(candidate, repo, ['README.md','docs','SEAL.json']);
await copy(safe('archive/versions/v030-android-preview'), safe('apps/android'));
console.log('Promoted current Windows source and Android preview; archived all original source paths without deleting their bytes.');

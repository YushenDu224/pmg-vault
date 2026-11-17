import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const delivery = path.resolve(import.meta.dirname, '..');
const repo = path.join(delivery, 'repository');
const checkpoint = path.join(delivery, 'layout-checkpoints/v031-before-reorganization');
const candidate = path.join(delivery, 'reorganization-v031/v031-repository-layout');
async function copyTree(from, to) {
  await fs.mkdir(to, { recursive: true });
  for (const entry of await fs.readdir(from, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    if (entry.isSymbolicLink()) throw new Error('Source copies must not contain symlinks.');
    const source = path.join(from, entry.name), target = path.join(to, entry.name);
    if (entry.isDirectory()) await copyTree(source, target);
    else await fs.copyFile(source, target, fs.constants.COPYFILE_EXCL);
  }
}
await copyTree(repo, checkpoint);
await copyTree(path.join(repo, 'versions/v021-image-groups'), candidate);
// A new mutable candidate, after its sealed parent was verified.
await fs.unlink(path.join(candidate, 'SEAL.json'));
const baseline = [];
async function record(dir, rel = '') {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.posix.join(rel, entry.name);
    if (entry.isDirectory()) await record(path.join(dir, entry.name), p);
    else { const bytes = await fs.readFile(path.join(dir, entry.name)); baseline.push({ path: p, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }); }
  }
}
await record(checkpoint);
await fs.writeFile(path.join(delivery, 'reports/layout-v031-before.json'), JSON.stringify({ files: baseline }, null, 2));
console.log(JSON.stringify({ checkpoint, candidate, checkpointFiles: baseline.length }));

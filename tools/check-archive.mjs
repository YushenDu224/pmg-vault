import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root = path.resolve(import.meta.dirname, '..');
const versions = path.join(root, 'archive/versions');
const results = [];
for (const name of (await fs.readdir(versions)).sort()) {
  const directory = path.join(versions, name);
  if (!(await fs.stat(directory)).isDirectory()) continue;
  let sealName = 'SEAL.json';
  try { await fs.access(path.join(directory, sealName)); }
  catch (error) { if (error.code !== 'ENOENT') throw error; sealName = 'SOURCE-SEAL.json'; }
  const seal = JSON.parse(await fs.readFile(path.join(directory, sealName), 'utf8'));
  for (const item of seal.files) {
    const file = path.resolve(directory, item.path);
    if (!file.startsWith(directory + path.sep) || item.path.includes('..')) throw new Error(`Invalid seal path: ${name}`);
    if ((await fs.lstat(file)).isSymbolicLink()) throw new Error(`Unexpected link: ${name}/${item.path}`);
    const bytes = await fs.readFile(file);
    if (bytes.length !== item.bytes || createHash('sha256').update(bytes).digest('hex') !== item.sha256) throw new Error(`Archive differs: ${name}/${item.path}`);
  }
  results.push({ version: name, files: seal.files.length, verified: true });
}
// The active Android preview is an exact, independently located copy.
const android = JSON.parse(await fs.readFile(path.join(root, 'apps/android/SOURCE-SEAL.json'), 'utf8'));
for (const item of android.files) {
  const bytes = await fs.readFile(path.join(root, 'apps/android', item.path));
  if (bytes.length !== item.bytes || createHash('sha256').update(bytes).digest('hex') !== item.sha256) throw new Error(`Active Android differs: ${item.path}`);
}
console.log(JSON.stringify({ archivedVersions: results.length, files: results.reduce((sum, x) => sum + x.files, 0), activeAndroidFiles: android.files.length, verified: true }, null, 2));

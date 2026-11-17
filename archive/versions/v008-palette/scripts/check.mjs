import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
async function files(dir) {
  const result = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (['SEAL.json', 'node_modules'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    assert(!entry.isSymbolicLink(), 'Source copies cannot contain links');
    if (entry.isDirectory()) result.push(...await files(full));
    else result.push(full);
  }
  return result.sort();
}
const example = JSON.parse(await fs.readFile(path.join(root, 'examples/8077301-001.json'), 'utf8'));
assert.equal(example.note.certificationNumber, '8077301-001');
assert.equal(example.note.serialNumber, 'S51786112C');
assert.equal(example.note.grade.numeric, 67);
assert.equal(example.note.noteYear.raw, '1935A');
assert.notEqual(example.note.gradingDate.slice(0, 4), String(example.note.noteYear.start));
const entries = [];
for (const full of await files(root)) {
  const bytes = await fs.readFile(full);
  entries.push({ path: path.relative(root, full).split(path.sep).join('/'), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
const sealPath = path.join(root, 'SEAL.json');
if (process.argv.includes('--seal')) {
  await fs.writeFile(sealPath, JSON.stringify({ version: path.basename(root), files: entries }, null, 2) + '\n', { flag: 'wx' });
  console.log(`Sealed ${entries.length} files; existing seals are never overwritten.`);
} else {
  const seal = JSON.parse(await fs.readFile(sealPath, 'utf8'));
  assert.deepEqual(entries, seal.files, 'Sealed source changed or has missing/extra files');
  console.log(`PASS: verified sample and ${entries.length} sealed source files. Application features are not implemented yet.`);
}

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
// Scope the current Windows application explicitly. Repository history,
// Android, user data, Git metadata and build outputs are not current source.
const sourcePaths = ['assets','build','desktop','examples','lib','scripts','tests','ui',
  'electron-builder.cjs','index.html','package.json','pnpm-lock.yaml'];
async function files(relative) {
  const full = path.join(root, relative), entry = await fs.lstat(full);
  assert(!entry.isSymbolicLink(), 'Source copies cannot contain links');
  if (!entry.isDirectory()) return [relative.split(path.sep).join('/')];
  const output = [];
  for (const name of await fs.readdir(full)) output.push(...await files(path.join(relative, name)));
  return output;
}
const example = JSON.parse(await fs.readFile(path.join(root, 'examples/8077301-001.json'), 'utf8'));
assert.equal(example.note.certificationNumber, '8077301-001');
assert.equal(example.note.serialNumber, 'S51786112C');
assert.equal(example.note.grade.numeric, 67);
assert.equal(example.note.noteYear.raw, '1935A');
const entries = [];
for (const relative of (await Promise.all(sourcePaths.map(files))).flat().sort()) {
  const bytes = await fs.readFile(path.join(root, relative));
  entries.push({ path: relative, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
const manifest = path.join(root, 'SOURCE-MANIFEST.json');
if (process.argv.includes('--seal')) {
  await fs.writeFile(manifest, JSON.stringify({ schemaVersion: 1, scope: 'current-windows-source', sourcePaths, files: entries }, null, 2) + '\n', { flag: 'wx' });
  console.log(`Recorded ${entries.length} current Windows source files; existing manifests are never overwritten.`);
} else {
  const expected = JSON.parse(await fs.readFile(manifest, 'utf8'));
  assert.deepEqual(sourcePaths, expected.sourcePaths);
  assert.deepEqual(entries, expected.files, 'Current source differs from its manifest. Start a new working copy before editing.');
  console.log(`PASS: ${entries.length} current Windows source files and public sample. Archives, Android and outputs are outside this scope.`);
}

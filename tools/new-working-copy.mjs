import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const name = process.argv[2], android = process.argv.includes('--android');
if (!/^v\d{3,}-[a-z0-9-]+$/.test(name || '')) throw new Error('Usage: node tools/new-working-copy.mjs v032-description [--android]');
const target = path.resolve(root, 'work', name);
if (!target.startsWith(path.join(root, 'work') + path.sep)) throw new Error('Invalid working-copy location.');
try { await fs.access(target); throw new Error('Working copy already exists; choose a new version.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const source = android ? path.join(root, 'apps/android') : root;
const excluded = new Set(['.git','node_modules','.gradle','private','dist','local.properties','SEAL.json','SOURCE-SEAL.json','SOURCE-MANIFEST.json']);
async function copy(relative) {
  const from = path.join(source, relative), to = path.join(target, relative);
  const info = await fs.lstat(from);
  if (info.isSymbolicLink()) throw new Error('Source copies cannot contain links.');
  if (info.isDirectory()) {
    if (android && relative.replaceAll('\\','/') === 'app/build') return;
    await fs.mkdir(to, { recursive: true });
    for (const entry of await fs.readdir(from)) if (!excluded.has(entry)) await copy(path.join(relative, entry));
  } else { await fs.mkdir(path.dirname(to), { recursive: true }); await fs.copyFile(from, to, fs.constants.COPYFILE_EXCL); }
}
if (android) { for (const entry of await fs.readdir(source)) if (!excluded.has(entry)) await copy(entry); }
else {
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'SOURCE-MANIFEST.json'), 'utf8'));
  for (const rel of [...manifest.sourcePaths, 'README.md','CONTRIBUTING.md','AGENTS.md','.gitignore','.gitattributes','docs','tools']) await copy(rel);
}
console.log(`Created an independent ${android ? 'Android' : 'Windows'} source copy: ${target}`);
console.log('Edit and validate this copy; keep previous archives immutable. Seal the finished version before promoting it.');

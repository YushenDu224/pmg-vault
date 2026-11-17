import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root = path.resolve(import.meta.dirname, '..'), repo = path.join(root, 'repository');
const digest = b => createHash('sha256').update(b).digest('hex');
async function merge(source, destination) {
  for (const entry of await fs.readdir(source, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error(`No source symlinks: ${source}/${entry.name}`);
    const from = path.join(source, entry.name), to = path.join(destination, entry.name);
    if (entry.isDirectory()) { await fs.mkdir(to, { recursive: true }); await merge(from, to); }
    else {
      const bytes = await fs.readFile(from);
      let exists;
      try { exists = await fs.readFile(to); } catch (e) { if (e.code !== 'ENOENT') throw e; }
      if (exists && digest(bytes) !== digest(exists)) throw new Error(`Refusing to overwrite different historical source: ${to}`);
      if (!exists) { await fs.mkdir(path.dirname(to), { recursive: true }); await fs.writeFile(to, bytes, { flag: 'wx' }); }
    }
  }
}
await merge(path.join(root, 'repository-staging'), repo);
await merge(path.join(root, 'source-tools'), path.join(repo, 'tools/source-history-v001'));
await merge(path.join(root, 'publishing-tools-v001'), path.join(repo, 'tools/publishing-v001'));
await merge(path.join(root, 'release-notes-v001'), path.join(repo, 'docs/releases/2026-11-17'));
const backup = path.join(repo, 'development-history/published-v020-root');
await fs.mkdir(backup, { recursive: true });
for (const name of ['README.md', 'CURRENT.md', 'VERSIONS.md', 'SOURCE-VERIFICATION.json', '.gitignore', '.gitattributes']) {
  const to = path.join(backup, name); try { await fs.access(to); } catch { await fs.copyFile(path.join(repo, name), to, fs.constants.COPYFILE_EXCL); }
}
console.log('Merged audited source history additively; previous root documents copied before edits.');

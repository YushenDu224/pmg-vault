import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname, '..'), repo = path.join(root, 'repository');
await fs.mkdir(path.join(root, 'dist/source'), { recursive: true });
const bundles = [
  ['PMG-Library-0.18.0-source.zip', ['versions/v021-image-groups']],
  ['PMG-Library-0.18.2-preview.1-source.zip', ['versions/v029-windows-preview']],
  ['PMG-Library-Android-0.1.0-preview.1-source.zip', ['versions/v030-android-preview']],
  ['PMG-Library-All-Sources-2026-11-17.zip', []],
];
for (const [filename, paths] of bundles) {
  const output = path.join(root, 'dist/source', filename);
  const args = ['-C', repo, 'archive', '--format=zip', `--prefix=${filename.slice(0, -4)}/`, `--output=${output}`, 'HEAD', ...paths];
  const result = spawnSync('git', args, { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error(`Source packaging failed: ${filename}: ${result.stderr}`);
  console.log(JSON.stringify({ filename, bytes: (await fs.stat(output)).size }));
}

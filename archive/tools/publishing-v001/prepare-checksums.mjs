import fs from 'node:fs/promises';
import path from 'node:path';
import { sha256 } from './github-client.mjs';
const root = path.resolve(import.meta.dirname, '..');
const groups = [
  { version: '0.18.0', files: ['windows/PMG-Library-0.18.0-Setup-x64.exe', 'source/PMG-Library-0.18.0-source.zip', 'source/PMG-Library-All-Sources-2026-11-17.zip'] },
  { version: '0.18.2-preview.1', files: ['windows/PMG-Library-0.18.2-preview.1-Setup-x64.exe', 'source/PMG-Library-0.18.2-preview.1-source.zip'] },
  { version: 'Android-0.1.0-preview.1', files: ['android/PMG-Library-Android-0.1.0-preview.1.apk', 'source/PMG-Library-Android-0.1.0-preview.1-source.zip'] },
];
await fs.mkdir(path.join(root, 'dist/checksums'), { recursive: true });
const manifest = [];
for (const group of groups) {
  const entries = [];
  for (const file of group.files) {
    const absolute = path.join(root, 'dist', file);
    const entry = { file, name: path.basename(file), bytes: (await fs.stat(absolute)).size, sha256: await sha256(absolute) };
    manifest.push(entry); entries.push(`${entry.sha256}  ${entry.name}`);
  }
  await fs.writeFile(path.join(root, 'dist/checksums', `SHA256SUMS-${group.version}.txt`), `${entries.join('\n')}\n`);
}
await fs.writeFile(path.join(root, 'reports/asset-manifest.json'), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest, null, 2));

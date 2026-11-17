import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const root = path.resolve(import.meta.dirname, '..');
const source = path.join(root, 'versions/v025-browser-compat');
const dependencyPackage = 'C:/Users/John/Documents/ChatGPT/PMG查询记录套件/outputs/pmg-vault/versions/v019-windows-installer/node_modules/electron-builder/package.json';
const builderRequire = createRequire(await fs.realpath(dependencyPackage));
const asar = createRequire(builderRequire.resolve('app-builder-lib/package.json'))('@electron/asar');
const archive = path.join(root, 'dist/win-unpacked/resources/app.asar');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const runtime = [];
async function walk(directory) {
  for (const entry of await fs.readdir(path.join(source, directory), { withFileTypes: true })) {
    const relative = directory + '/' + entry.name;
    if (entry.isDirectory()) await walk(relative);
    else runtime.push(relative);
  }
}
for (const directory of ['ui', 'lib', 'desktop', 'assets']) await walk(directory);
runtime.push('index.html', 'build/icon.ico', 'examples/sample.pmgx');
const files = [];
for (const file of runtime.sort()) {
  const expected = await fs.readFile(path.join(source, file));
  const actual = asar.extractFile(archive, file);
  assert.equal(hash(actual), hash(expected), 'Bundled source differs: ' + file);
  files.push({ path: file, bytes: expected.length, sha256: hash(expected) });
}
const metadata = JSON.parse(asar.extractFile(archive, 'package.json'));
assert.equal(metadata.version, '0.18.1-preview.2');
assert.equal(metadata.main, 'desktop/main.cjs');
const installer = path.join(root, 'dist/PMG-Library-0.18.1-preview.2-Setup-x64.exe');
const bytes = await fs.readFile(installer);
const report = {
  version: metadata.version,
  sourceVersion: 'v025-browser-compat',
  electron: '45.2.2',
  installer,
  installerBytes: bytes.length,
  installerSHA256: hash(bytes),
  appAsarSHA256: hash(await fs.readFile(archive)),
  bundledSourceFilesVerified: files.length,
  files,
  nsis: { oneClick: false, allowToChangeInstallationDirectory: true },
  signed: false,
  installed: false,
  productionUserDataOpenedByBuild: false
};
await fs.writeFile(path.join(root, 'build-tools/windows-build-verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report, files: undefined }));

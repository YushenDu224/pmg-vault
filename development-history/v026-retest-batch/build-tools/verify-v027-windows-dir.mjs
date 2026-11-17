import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const root = path.resolve(import.meta.dirname, '..');
const source = path.join(root, 'versions/v027-ascii-identity');
const baseline = path.resolve(root, '../pmg-review-v025/versions/v025-browser-compat');
const dependencyPackage = 'C:/Users/John/Documents/ChatGPT/PMG查询记录套件/outputs/pmg-vault/versions/v019-windows-installer/node_modules/electron-builder/package.json';
const builderRequire = createRequire(await fs.realpath(dependencyPackage));
const asar = createRequire(builderRequire.resolve('app-builder-lib/package.json'))('@electron/asar');
const archive = path.join(root, 'dist/win-unpacked/resources/app.asar');
const executable = path.join(root, 'dist/win-unpacked/PMG库.exe');
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
  const previous = await fs.readFile(path.join(baseline, file));
  assert.equal(hash(actual), hash(expected), 'Bundled source differs: ' + file);
  if (file !== 'desktop/main.cjs') {
    assert.equal(hash(expected), hash(previous), 'Unexpected runtime change: ' + file);
  }
  files.push({ path: file, bytes: expected.length, sha256: hash(expected), baselineSHA256: hash(previous), differsFromV025: hash(expected) !== hash(previous) });
}
assert.equal(files.filter(file => file.differsFromV025).length, 1);
assert.equal(files.find(file => file.differsFromV025).path, 'desktop/main.cjs');
const currentMain = await fs.readFile(path.join(source, 'desktop/main.cjs'), 'utf8');
const previousMain = await fs.readFile(path.join(baseline, 'desktop/main.cjs'), 'utf8');
const changedLines = [];
const oldLines = previousMain.split(/\r?\n/);
const newLines = currentMain.split(/\r?\n/);
assert.equal(oldLines.length, newLines.length, 'Main line count changed');
for (let i = 0; i < oldLines.length; i++) {
  if (oldLines[i] !== newLines[i]) changedLines.push({ line: i + 1, before: oldLines[i], after: newLines[i] });
}
assert.equal(changedLines.length, 1, 'Expected one controlled source line difference');
assert.match(changedLines[0].after, /app\.setName\('pmg-library'\)/);
const metadata = JSON.parse(asar.extractFile(archive, 'package.json'));
assert.equal(metadata.version, '0.18.1-preview.2');
assert.equal(metadata.main, 'desktop/main.cjs');
// electron-builder removes scripts/devDependencies from packaged metadata.
// Check raw metadata against raw baseline and packaged bytes against packaged baseline.
const sourcePackage = await fs.readFile(path.join(source, 'package.json'));
const baselinePackage = await fs.readFile(path.join(baseline, 'package.json'));
assert.equal(hash(sourcePackage), hash(baselinePackage), 'Source package metadata changed');
const bundledPackage = asar.extractFile(archive, 'package.json');
const baselineArchive = path.resolve(root, '../pmg-review-v025/dist/win-unpacked/resources/app.asar');
assert.equal(hash(bundledPackage), hash(asar.extractFile(baselineArchive, 'package.json')), 'Packaged metadata differs from v025');
const listing = asar.listPackage(archive).map(file => file.replaceAll('\\', '/'));
const forbidden = listing.filter(file => /(^|\/)(userData|profile|runtime|recording|recording-v027|node_modules)(\/|$)/i.test(file));
assert.deepEqual(forbidden, [], 'Profile or private recording accidentally bundled');
const actualBundledFiles = listing.map(file => file.replace(/^\/+/, '')).filter(file => !asar.statFile(archive, file).files).sort();
assert.deepEqual(actualBundledFiles, [...runtime, 'package.json'].sort(), 'Unexpected packaged files');
const executableBytes = await fs.readFile(executable);
const report = {
  purpose: 'v027 single-factor ASCII internal app identity diagnostic control; not a new production release',
  version: metadata.version,
  sourceVersion: 'v027-ascii-identity',
  baselineVersion: 'v025-browser-compat',
  electron: '45.2.2',
  buildTarget: 'win dir x64',
  executable,
  executableBytes: executableBytes.length,
  executableSHA256: hash(executableBytes),
  appAsarSHA256: hash(await fs.readFile(archive)),
  bundledRuntimeFilesVerified: files.length,
  unchangedRuntimeFilesFromBaseline: files.filter(file => !file.differsFromV025).length,
  totalBundledFiles: actualBundledFiles.length,
  unchangedBundledFilesIncludingMetadata: files.filter(file => !file.differsFromV025).length + 1,
  metadata: { sourceSHA256: hash(sourcePackage), bundledSHA256: hash(bundledPackage), unchangedFromV025: true },
  changedLines,
  files,
  forbiddenBundledPaths: forbidden,
  installerGenerated: false,
  installed: false,
  appLaunchedByBuild: false,
  productionUserDataOpenedByBuild: false,
  signed: false
};
await fs.writeFile(path.join(root, 'build-tools/v027-windows-dir-verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report, files: undefined }));

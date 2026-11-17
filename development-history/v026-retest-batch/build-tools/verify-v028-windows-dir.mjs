import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const root = path.resolve(import.meta.dirname, '..');
const source = path.join(root, 'versions/v028-state-sync');
const baseline = path.join(root, 'versions/v027-ascii-identity');
const dependencyPackage = 'C:/Users/John/Documents/ChatGPT/PMG查询记录套件/outputs/pmg-vault/versions/v019-windows-installer/node_modules/electron-builder/package.json';
const builderRequire = createRequire(await fs.realpath(dependencyPackage));
const asar = createRequire(builderRequire.resolve('app-builder-lib/package.json'))('@electron/asar');
const archive = path.join(root, 'dist-v028/win-unpacked/resources/app.asar');
const executable = path.join(root, 'dist-v028/win-unpacked/PMG库.exe');
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
  let previous = null;
  try { previous = await fs.readFile(path.join(baseline, file)); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  assert.equal(hash(actual), hash(expected), 'Bundled source differs: ' + file);
  files.push({ path: file, bytes: expected.length, sha256: hash(expected), baselineSHA256: previous ? hash(previous) : null, change: previous ? (hash(expected) === hash(previous) ? 'unchanged' : 'modified') : 'added' });
}
for (const module of ['desktop/ui-state-log.cjs', 'ui/capture-state.mjs']) {
  assert.equal(files.find(file => file.path === module)?.change, 'added', 'New state synchronization module not verified: ' + module);
}
const metadata = JSON.parse(asar.extractFile(archive, 'package.json'));
assert.equal(metadata.version, '0.18.1-preview.2');
assert.equal(metadata.main, 'desktop/main.cjs');
// electron-builder removes scripts/devDependencies from packaged metadata.
// Check raw metadata against raw baseline and packaged bytes against packaged baseline.
const sourcePackage = await fs.readFile(path.join(source, 'package.json'));
const baselinePackage = await fs.readFile(path.join(baseline, 'package.json'));
assert.equal(hash(sourcePackage), hash(baselinePackage), 'Source package metadata changed');
const bundledPackage = asar.extractFile(archive, 'package.json');
const baselineArchive = path.join(root, 'dist/win-unpacked/resources/app.asar');
assert.equal(hash(bundledPackage), hash(asar.extractFile(baselineArchive, 'package.json')), 'Packaged metadata differs from v027');
const listing = asar.listPackage(archive).map(file => file.replaceAll('\\', '/'));
const forbidden = listing.filter(file => /(^|\/)(data|userData|profile|runtime|recording(?:-v\d+)?|node_modules)(\/|$)/i.test(file));
assert.deepEqual(forbidden, [], 'Profile or private recording accidentally bundled');
const actualBundledFiles = listing.map(file => file.replace(/^\/+/, '')).filter(file => !asar.statFile(archive, file).files).sort();
assert.deepEqual(actualBundledFiles, [...runtime, 'package.json'].sort(), 'Unexpected packaged files');
const executableBytes = await fs.readFile(executable);
const report = {
  purpose: 'v028 state synchronization diagnostic build; not a new production release',
  version: metadata.version,
  sourceVersion: 'v028-state-sync',
  baselineVersion: 'v027-ascii-identity',
  electron: '45.2.2',
  buildTarget: 'win dir x64',
  executable,
  executableBytes: executableBytes.length,
  executableSHA256: hash(executableBytes),
  appAsarSHA256: hash(await fs.readFile(archive)),
  bundledRuntimeFilesVerified: files.length,
  unchangedRuntimeFilesFromBaseline: files.filter(file => file.change === 'unchanged').length,
  totalBundledFiles: actualBundledFiles.length,
  unchangedBundledFilesIncludingMetadata: files.filter(file => file.change === 'unchanged').length + 1,
  metadata: { sourceSHA256: hash(sourcePackage), bundledSHA256: hash(bundledPackage), unchangedFromV027: true },
  changedFiles: files.filter(file => file.change !== 'unchanged'),
  files,
  forbiddenBundledPaths: forbidden,
  installerGenerated: false,
  installed: false,
  appLaunchedByBuild: false,
  productionUserDataOpenedByBuild: false,
  signed: false
};
await fs.writeFile(path.join(root, 'build-tools/v028-windows-dir-verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report, files: undefined }));

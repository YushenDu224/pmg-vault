import fs from 'node:fs/promises';
import path from 'node:path';
const candidate = path.join(import.meta.dirname, 'v031-repository-layout');
const pkgFile = path.join(candidate, 'package.json');
const pkg = JSON.parse(await fs.readFile(pkgFile, 'utf8'));
pkg.description = 'PMG库 · Windows 钞票档案与图片组管理';
await fs.writeFile(pkgFile, JSON.stringify(pkg, null, 2) + '\n');
const builderFile = path.join(candidate, 'electron-builder.cjs');
let builder = await fs.readFile(builderFile, 'utf8');
builder = builder.replace("const path=require('node:path'),fs=require('node:fs');const cached=path.resolve(__dirname,'../v016-separated-pages/node_modules/electron/dist');", "const path=require('node:path');");
builder = builder.replace("process.env.PMG_ELECTRON_DIST||(fs.existsSync(path.join(cached,'electron.exe'))?cached:path.dirname(require('electron')))", "process.env.PMG_ELECTRON_DIST||path.dirname(require('electron'))");
builder = builder.replace("path.resolve(__dirname,'../../dist')", "path.resolve(__dirname,'dist/windows')");
await fs.writeFile(builderFile, builder);
// These legacy launchers are complete in the immutable v021 archive. The
// supported current development entry is Electron (npm start).
for (const rel of ['server.mjs','launch.mjs','启动PMG库.cmd','启动PMG-Vault.cmd','scripts/build-sample.mjs','lib/collector-service.mjs']) {
  const file = path.resolve(candidate, rel);
  if (!file.startsWith(path.resolve(candidate) + path.sep)) throw new Error('Invalid candidate path.');
  await fs.unlink(file);
}

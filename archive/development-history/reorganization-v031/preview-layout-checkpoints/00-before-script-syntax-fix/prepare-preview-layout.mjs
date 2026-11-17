import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const taskRoot = import.meta.dirname;
const source = path.resolve(taskRoot, '../repository/archive/versions/v029-windows-preview');
const current = path.resolve(taskRoot, 'v031-repository-layout');
const target = path.join(taskRoot, 'v032-windows-preview-layout');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const originalSeal = JSON.parse(await fs.readFile(path.join(source, 'SEAL.json'), 'utf8'));
for (const entry of originalSeal.files) {
  const bytes = await fs.readFile(path.join(source, entry.path));
  if (bytes.length !== entry.bytes || hash(bytes) !== entry.sha256) throw new Error(`Original v029 seal mismatch: ${entry.path}`);
}
try { await fs.access(target); throw new Error('Target already exists; do not overwrite a working or sealed copy.'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
await fs.cp(source, target, { recursive: true, errorOnExist: true, force: false,
  filter: file => !['SEAL.json', 'node_modules'].includes(path.basename(file)) });
for (const relative of ['server.mjs', 'launch.mjs', '启动PMG库.cmd', '启动PMG-Vault.cmd', 'scripts/build-sample.mjs', 'lib/collector-service.mjs']) {
  await fs.unlink(path.join(target, relative));
}
await fs.copyFile(path.join(current, 'scripts/check.mjs'), path.join(target, 'scripts/check.mjs'));
const builderPath = path.join(target, 'electron-builder.cjs');
let builder = await fs.readFile(builderPath, 'utf8');
builder = builder.replace("const path=require('node:path'),fs=require('node:fs');const cached=path.resolve(__dirname,'../v016-separated-pages/node_modules/electron/dist');", "const path=require('node:path');");
builder = builder.replace("process.env.PMG_ELECTRON_DIST||(fs.existsSync(path.join(cached,'electron.exe'))?cached:path.dirname(require('electron')))", "process.env.PMG_ELECTRON_DIST||path.dirname(require('electron'))");
builder = builder.replace("path.resolve(__dirname,'../../dist')", "path.resolve(__dirname,'dist/windows')");
if (builder.includes('v016-separated-pages') || builder.includes("'../../dist'")) throw new Error('Legacy builder paths remain.');
await fs.writeFile(builderPath, builder);
const packagePath = path.join(target, 'package.json');
const pkg = JSON.parse(await fs.readFile(packagePath, 'utf8'));
if (pkg.version !== '0.18.2-preview.1') throw new Error('Unexpected preview application version.');
pkg.description = 'PMG库 · Windows 状态同步测试版 · 仓库根目录开发入口';
await fs.writeFile(packagePath, JSON.stringify(pkg, null, 2) + '\n');
await fs.writeFile(path.join(target, 'README.md'), `# PMG库 · Windows 测试分支

应用版本 **0.18.2-preview.1**，目录整理副本 **v032-windows-preview-layout**，来自完整封存的 v029。此代码用于 \\`codex/windows-preview\\` 分支的根目录开发入口；当前安装版仍是 Windows 0.18.0，见 [main](https://github.com/YushenDu224/pmg-vault)。

## 开发

安装 Node.js 22+ 与 pnpm，执行 \\`pnpm install --frozen-lockfile\\`，再执行 \\`pnpm test\\`、\\`pnpm check\\`。Electron 开发入口为 \\`pnpm start\\`。开发运行前请导出整库备份，并使用独立的 \\`--data-dir\\` 测试目录；它沿用 Windows 应用标识及资料库设计，不是默认隔离的正式产品。

Windows 构建为 \\`pnpm dist:win\\`，安装包写入当前项目的 \\`dist/windows\\`。可使用 \\`PMG_ELECTRON_DIST\\` 指定 Electron 45.2.2 运行时缓存。安装向导支持自选位置，源码归档与构建产物分别保存。

## 状态和限制

此版本包含窗口外壳、浏览器兼容性与采集反馈同步修正，保留原主题。41 项回归检查通过；此前离线真实界面的无推送同步与入库已通过。完整 Cloudflare 真人验证流程尚未完成验收，不能宣称官网验证问题已全部解决。此目录整理没有访问官网、安装软件或迁移个人资料。

本次只调整构建输出、源码校验范围与开发说明，并移除不再使用的旧网页启动器和仓库外样例重建工具。desktop、ui 和其他运行模型代码保持 v029 原字节；原 v029 全部源文件仍在历史归档，未修改。

原安装包下载：[Windows 0.18.2-preview.1](https://github.com/YushenDu224/pmg-vault/releases/tag/v0.18.2-preview.1)。该发布仍对应原发行源码，不因目录整理替换安装包。

本项目使用 OpenAI Codex 辅助开发；应用界面不显示 AI 声明。独立项目，与 PMG 无隶属关系。
`.replaceAll('\\`', '`'));
await fs.writeFile(path.join(target, 'docs/REPOSITORY-LAYOUT.md'), `# v032 Windows 测试分支入口整理

基线：v029-windows-preview，应用版本保持 0.18.2-preview.1。本次开始前验证原 SEAL 的全部 ${originalSeal.files.length} 个文件。

当前 Windows 源码使用与 v031 相同的显式校验白名单，范围由 SOURCE-MANIFEST.json 记录。完整副本的全部文件另由 SEAL.json 记录。历史归档、Android、Git 目录、依赖与构建输出不属于当前 Windows 源码范围。

移除六个遗留入口：server.mjs、launch.mjs、启动PMG库.cmd、启动PMG-Vault.cmd、scripts/build-sample.mjs、lib/collector-service.mjs。原版本归档仍完整保存这些文件。当前程序通过 Electron 自定义协议从本地资源启动，不依赖旧网页服务。

electron-builder.cjs 不再查找旧 v016 兄弟目录；构建输出为当前项目 dist/windows。保留应用 ID、资料路径、未签名安装策略与 NSIS 可自选安装位置设置。不修改 PMG 页面解析、验证码策略、采集状态、UI、图片、档案格式或用户数据。

对副本的后续修改必须先创建完整的新编号副本或修改前 checkpoint；已封存目录不修改。
`);
const result = { sourceVersion: 'v029-windows-preview', sourceSealFiles: originalSeal.files.length,
  targetVersion: path.basename(target), applicationVersion: pkg.version, sourceSealSha256: hash(await fs.readFile(path.join(source, 'SEAL.json'))),
  checkScriptMatchesV031: hash(await fs.readFile(path.join(target, 'scripts/check.mjs'))) === hash(await fs.readFile(path.join(current, 'scripts/check.mjs'))),
  removedLegacyFiles: ['server.mjs','launch.mjs','启动PMG库.cmd','启动PMG-Vault.cmd','scripts/build-sample.mjs','lib/collector-service.mjs'] };
await fs.writeFile(path.join(taskRoot, 'v032-preparation.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));

import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..'), repo = path.join(root, 'repository');
const inventory = JSON.parse(await fs.readFile(path.join(root, 'repository-staging/source-inventory.json'), 'utf8'));
const base = 'https://github.com/YushenDu224/pmg-vault';
const docs = {
 'README.md': `# PMG库

电脑当前安装版是 **Windows 0.18.0（v021）**。本次同时保存后续完整源码，提供 **Windows 0.18.2-preview.1（v029）** 测试安装包及 **Android 0.1.0-preview.1（v030）** 离线预览 APK。

| 下载 | 用途 | 状态 |
| --- | --- | --- |
| [Windows 0.18.0](${base}/releases/tag/v0.18.0) | 与当前电脑安装程序一致 | 保留已知官网验证限制 |
| [Windows 0.18.2-preview.1](${base}/releases/tag/v0.18.2-preview.1) | 新窗口与采集状态修正 | 测试版，完整官网人工验收待完成 |
| [Android 0.1.0-preview.1](${base}/releases/tag/android-v0.1.0-preview.1) | 双列界面、系统选图与图片组交互 | 可安装离线预览，尚非完整藏品应用 |

[当前版本与验收边界](CURRENT.md) · [全部版本](VERSIONS.md) · [源码历史与排除说明](SOURCE-HISTORY.md) · [Windows 双包核验](WINDOWS-DELIVERY.md)

Windows 安装向导可自选安装位置，自带运行环境。两个 Windows 包均未数字签名；预览版沿用资料库设计，安装前请导出整库备份。此次发布没有安装、覆盖现有程序或迁移私人资料。

Windows 功能包括独立的查询与采集、库、逐字段搜索筛选排序、回收站、原图及网页存档、PMGX/整库备份，并在 v021 接入自己上传的正反面图片组、来源/网址与展示组选择。内嵌官网在部分 Cloudflare 流程仍可能反复验证；最新测试不能解释为该问题已全部解决。

**安卓范围：** v030 将 v025 交互稿封装为独立 APK，保留双列自然高度目录、完整图片预览、深浅主题、系统选图、来源/网址、图片组切换与样例查询。实时官网自动采集、PMGX/整库导入导出尚未接入；上传组仅本次内存体验，设置 JSON 不是图片备份。尚未完成小米 15 实机验收。详见 [Android 源码说明](versions/v030-android-preview/README.md)。

## 源码与回档

每次修改保留完整目录副本和封存记录，版本目录是开发序号，不能直接当作应用版本号。v017 是新图片组 UI 第一版，已废除；v018 是第二版预览；v022 是已废除的整体现代化 UI 实验。v024 为 Android 网页评审批次，v026 为重测批次，均不是漏传的正式应用版本。

所有已存在的旧版本保留原字节。Android 各轮预览、修改前 checkpoints、构建与诊断脚本在 development-history。部分历史门户引用的屏幕画面仅留本机；保留代码和原封存清单，并在 SOURCE-HISTORY 标明缺少画面资产的边界。正式 Windows 版本源码按封存清单完整保存。

仓库不包含个人藏品、私人上传图、浏览器会话、Cookie、凭据、测试签名私钥、依赖缓存或录屏。大安装包与完整源码 ZIP 从 Releases 下载。复建请使用各版本锁文件和说明。

## AI 辅助开发

本项目使用 OpenAI Codex 辅助设计、编写与验证；应用界面不显示 AI 声明。独立项目，与 PMG 无隶属关系。
`,
 'CURRENT.md': `# 当前版本记录 · 2026-11-17

| 项目 | 应用版本 | 源码副本 | 核实状态 |
| --- | --- | --- | --- |
| 电脑实际安装并运行 | 0.18.0 | [v021-image-groups](versions/v021-image-groups) | 注册表、安装包与已安装 ASAR 一致 |
| 最新 Windows 发行测试包 | 0.18.2-preview.1 | [v029-windows-preview](versions/v029-windows-preview) | 41 项回归通过，运行文件核对通过；未安装 |
| Android 可安装离线预览 | 0.1.0-preview.1 | [v030-android-preview](versions/v030-android-preview) | APK 静态构建与签名检查，未做小米 15 实机验收 |

v025、v027、v028 为对照测试，内部 package 版本同为 0.18.1-preview.2，靠源码目录序号区分。v029 才单独提升为 0.18.2-preview.1。v022 的 0.19.0 是已废除设计实验的内部版本，不表示它比当前方向更适合使用。

Windows 0.18.0 包内 app.asar 与已安装程序的 SHA-256 均为 768f191ade91cb5f41fa3b30fd2dbcd877a4fd56d01b41083e7d8dc1eb1d1a3e。安装器校验值见 [发布核验](docs/verification/windows-package-verification.json)。

新 Windows 测试包保留原主题，只调整窗口外壳并包含浏览器兼容性和状态同步修正。41 项检查与离线真实 UI 同步通过，不代表官网真人验证全部通过。v028 最后一次真实网页复测未完成；打包没有替代该验收。预览版可能升级同一 Windows 程序，选择不同安装目录并不自动隔离用户资料。

Android 仍是界面和交互预览：实时采集与完整 PMGX 未接入，上传组未持久化，不能导入和替代 Windows 私人藏品库。手机屏幕适配按设计实现，真机表现待实测。

0.16.1/0.16.2 等旧发布、v016 界面基线、v017 已废除第一版及 v018 第二版预览均保留。原根文档见 development-history/published-v020-root。本次未修改当前安装程序或个人资料。
`,
 'VERSIONS.md': `# 版本目录

源码副本序号用于回档；应用版本以 package 或 Android versionName 为准。

| 完整源码目录 | 应用版本 | 状态 |
| --- | --- | --- |
${inventory.versions.map(v => `| [${v.sourceVersion}](${v.destination}) | ${v.semanticVersion} | ${v.status} |`).join('\n')}
| [v030-android-preview](versions/v030-android-preview) | 0.1.0-preview.1 | Android 可安装离线预览，未接入完整采集与 PMGX |

v017：新图片组 UI 设计第一版，**已废除**。v018：新功能 UI 第二版预览。v022：已废除的整体 UI 实验。v024 的各次 Android 网页评审与 v026 的重测、录制工具源码在 [development-history](development-history)，其批次编号不是应用发行号。

每个 Windows 版本完整保留原封存源码；公共 PMG 样例是开发验证资源。个人藏品和签名私钥不上传。历史门户因排除屏幕画面不能宣称所有原资产齐备，详见 [SOURCE-HISTORY](SOURCE-HISTORY.md)。
`,
};
for (const [name, text] of Object.entries(docs)) await fs.writeFile(path.join(repo, name), text);
// Root files are new publication metadata, not changes to any sealed version.
const gitignore = await fs.readFile(path.join(repo, '.gitignore'), 'utf8');
if (!gitignore.includes('# 2026-11 source publication')) await fs.appendFile(path.join(repo, '.gitignore'), `
# 2026-11 source publication
**/private/
**/.gradle/
**/local.properties
**/*.keystore
**/*.jks
**/*.p12
**/app-session*/
**/*profile*/
**/recording*/
**/decoder-runtime/
!versions/**/examples/sample.pmgx
!versions/**/build/
!versions/**/build/icon.ico
`);
console.log('Current version, download catalog and status boundaries written.');

# v027 单因素诊断对照构建

这是用于排查验证循环的诊断对照，**不是新正式发布版**。仅生成 Windows x64 解包目录；未生成安装包、未安装、未启动应用或录屏工具。

| 项目 | 内容 |
| --- | --- |
| 来源 | `versions/v027-ascii-identity` |
| 对照基线 | `pmg-review-v025/versions/v025-browser-compat` |
| 保留的软件包版本 | `0.18.1-preview.2` |
| Electron | 现有 `45.2.2` 分发文件 |
| 构建目标 | `--win dir --x64 --publish never` |
| 程序 | `dist/win-unpacked/PMG库.exe` |
| 程序大小 | 249,469,952 字节 |
| 程序 SHA-256 | `9510d1e9c2ba1125c87d024e405c069b8020bd27097e31f154a0638a66f56481` |
| app.asar SHA-256 | `deddb741de9778d49a80c092614b5624d13098244261d26c549eab2f11c9adf7` |
| 签名 | Windows Authenticode：NotSigned |

## 唯一运行代码差异

`desktop/main.cjs` 第 10 行：内部 `app.setName('PMG库')` 改为 `app.setName('pmg-library')`。

ASAR 内共 29 个文件：28 个运行资源文件和 1 个软件包元数据文件。运行资源中仅 main 不同，另外 27 个逐字节匹配 v025；软件包元数据也匹配 v025。因此除 main 外共 **28 个打包文件保持一致**。没有新增 UA 改写，没有打包 data/profile、录屏输出、录屏 runtime 或 node_modules。

`electron-builder` 会按正常打包流程移除软件包元数据中的开发依赖和脚本；校验器分别比较“源 package 与源基线”和“打包 package 与打包基线”，避免把正常元数据整理误报为代码差异。完整文件 SHA 和逐行差异见 `v027-windows-dir-verification.json`。

## 复现

1. 使用 PowerShell 运行 `build-v027-windows-dir.ps1`，读取现有 Electron 和 builder，不修改源配置。
2. 运行 `node verify-v027-windows-dir.mjs`，核实打包字节与源文件、v025 基线、唯一改动及打包白名单。

构建日志是 `v027-windows-dir-build.log`。构建和校验均在本次任务完成；应用通行、安装和私人资料库未在此构建步骤中测试。

## 独立录屏副本

原 `recorder` 的 6 个源码先完整复制到 `recorder-v027`，复制后逐文件哈希与原文件一致，再修改副本。修改前清单为 `recorder-v027-before-change.json`，修改后清单为 `recorder-v027-after-change.json`。

副本只调整 `main.cjs` 的输出目录、`start.ps1` 返回目录和 README 路径说明，输出至 `recording-v027/pmg-app.webm` 与 `recording-v027/recording-metadata.json`；停止标志改为 `recording-v027/stop-recording.flag`。原录像、原 runtime 和日志均未复制或覆盖。新副本的 main/preload/renderer 均通过 `node --check`；未启动副本。

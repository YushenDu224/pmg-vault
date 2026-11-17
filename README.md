# PMG库 · Windows 测试分支

**当前分支 `codex/windows-preview` 的根目录运行 Windows 0.18.2-preview.1，源自 v029，经 v032 整理入口。** 41 项回归通过，完整官网真人验证仍待验收。当前安装版与默认主线维持 0.18.0；[返回主线](https://github.com/YushenDu224/pmg-vault/tree/main)。下面的主线说明用于版本对照。

独立钞票档案工具：查询 PMG 中国站或全球站，保存认证信息、原图与网页存档，并在本地检索、筛选和管理图片组。

**默认分支 `main` 的 Windows 主入口为 0.18.0，来自 v021。** v031 是本次仓库目录整理批次，没有增加软件功能或升级应用版本。Android 仍为独立的离线预览。

| 下载 | 用途 |
| --- | --- |
| [Windows 0.18.0](https://github.com/YushenDu224/pmg-vault/releases/tag/v0.18.0) | 与此前核实的电脑安装版一致，可自选安装目录 |
| [Windows 0.18.2-preview.1](https://github.com/YushenDu224/pmg-vault/releases/tag/v0.18.2-preview.1) | 窗口与采集状态同步测试版，完整真人验证流程待验收 |
| [Android 0.1.0-preview.1](https://github.com/YushenDu224/pmg-vault/releases/tag/android-v0.1.0-preview.1) | 可安装的离线界面与图片组交互预览 |

[版本与已知限制](docs/status.md) · [目录与教程依据](docs/repository-layout.md) · [参与开发与回档](CONTRIBUTING.md) · [完整历史副本](archive/README.md)

## 开发 Windows 版

使用 Node.js 22 或更新版本及 pnpm，在仓库根目录运行：

```powershell
pnpm install --frozen-lockfile
npm start
```

Electron 固定为 **45.2.2**，依赖版本以现有锁文件为准。本次整理不升级框架。`npm start` 启动 Electron 应用；直接双击 HTML 无法提供桌面采集能力。

验证和打包：

```powershell
npm test
npm run check
node tools/check-archive.mjs
npm run dist:win
```

Windows 构建输出到 `dist/windows/`。安装图标资源已经保留；需要重新生成时再执行 `npm run icons`。本地检查、打包、实际安装和官网真人验证是不同的验收步骤，具体结果以对应报告为准。

## 从哪里开始

- `desktop/`：Electron 窗口与官网采集。
- `ui/`：库、查询和详情界面。
- `lib/`：档案格式、字段映射、存储及检索逻辑。
- `apps/android/`：Android 原生宿主及离线预览网页，见其 README。
- `docs/`：当前使用、开发与状态说明。
- `archive/`：已封存源码、废除方案、修改前副本与历史操作记录。

`package.json` 中的 `private: true` 用于防止误发布到 npm，与 GitHub 仓库是否公开无关。这个 GitHub 仓库可以公开浏览。

## 当前边界

Windows 内嵌官网在部分 Cloudflare 流程仍可能反复验证；新测试版尚未完成完整人工验证验收。Android 尚未接入实时采集及完整 PMGX/整库导入导出，上传图片组只保留在本次预览内存中，重载或退出后丢失，未做小米 15 真机验收。

个人藏品、浏览器会话、Cookie、凭据、Android 签名私钥和依赖缓存不进入仓库。下载包与校验清单在各版本 Releases 中。仓库整理不会自动安装软件或迁移个人资料。

## AI 辅助开发

本项目使用 OpenAI Codex 辅助设计、编写与验证；应用界面不显示 AI 声明。独立项目，与 PMG 无隶属关系。


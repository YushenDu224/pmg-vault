# PMG库 · Windows 测试分支

应用版本 **0.18.2-preview.1**，目录整理副本 **v032-windows-preview-layout**，来自完整封存的 v029。此代码用于 codex/windows-preview 分支的根目录开发入口；当前安装版仍是 Windows 0.18.0，见 [main](https://github.com/YushenDu224/pmg-vault)。

## 开发

安装 Node.js 22+ 与 pnpm，执行 pnpm install --frozen-lockfile，再执行 pnpm test、pnpm check。Electron 开发入口为 pnpm start。开发运行前请导出整库备份，并使用独立的 --data-dir 测试目录；它沿用 Windows 应用标识及资料库设计，不是默认隔离的正式产品。

Windows 构建为 pnpm dist:win，安装包写入当前项目的 dist/windows。可使用 PMG_ELECTRON_DIST 指定 Electron 45.2.2 运行时缓存。安装向导支持自选位置，源码归档与构建产物分别保存。

## 状态和限制

此版本包含窗口外壳、浏览器兼容性与采集反馈同步修正，保留原主题。41 项回归检查通过；此前离线真实界面的无推送同步与入库已通过。完整 Cloudflare 真人验证流程尚未完成验收，不能宣称官网验证问题已全部解决。此目录整理没有访问官网、安装软件或迁移个人资料。

本次只调整构建输出、源码校验范围与开发说明，并移除不再使用的旧网页启动器和仓库外样例重建工具。desktop、ui 和其他运行模型代码保持 v029 原字节；原 v029 全部源文件仍在历史归档，未修改。

原安装包下载：[Windows 0.18.2-preview.1](https://github.com/YushenDu224/pmg-vault/releases/tag/v0.18.2-preview.1)。该发布仍对应原发行源码，不因目录整理替换安装包。

本项目使用 OpenAI Codex 辅助开发；应用界面不显示 AI 声明。独立项目，与 PMG 无隶属关系。

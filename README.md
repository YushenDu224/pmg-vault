> 本分支为图片分组 UI 设计预览区；正式软件请使用 [main](https://github.com/YushenDu224/pmg-vault/tree/main) 或 [最新 Windows 安装包](https://github.com/YushenDu224/pmg-vault/releases/latest)。
> v017：新功能 UI 设计第一版（已废除）。v018：新功能 UI 设计第二版（预览）。

# PMG库

Windows 当前稳定版 **0.16.2（v020，沿用 v016 界面）**。取消文件导入大小、解压总量和整库张数的固定上限，按张读取 ZIP/ZIP64。实际容量取决于设备内存及磁盘。

[下载安装包与全部历史源码](https://github.com/YushenDu224/pmg-vault/releases) · [当前版本](CURRENT.md) · [完整版本目录](VERSIONS.md) · [导入改动](versions/v020-unlimited-import/docs/UNLIMITED-IMPORT.md)

安装时可以自选目录，安装后直接运行，无需另装 Node.js。个人藏品独立保存在用户数据目录；更新和卸载配置不会主动清空资料库。升级前请先导出整库备份。

侧边栏“查询与采集”打开独立的内嵌官网查询页；“库”提供搜索、筛选、排序、目录和详情。保留原图、详情文字、整页截图及网页存档，使用 PMGX 标准 ZIP 容器携带。

## 版本区分

- **0.16.2 / v020**：当前 Windows 稳定版，25 项测试通过；约 148 MiB 实际整库导入、重复导入去重和资源哈希验证通过。
- **0.16.1 / v019**：初始 Windows 安装版，可用于回档。
- **v016**：稳定界面与功能基线。
- **v017**：新功能 UI 设计第一版，**已废除，仅供回档**。
- **v018**：新功能 UI 设计第二版，**预览方案，尚未接入正式藏品库**。

v017/v018 保留在 [codex/image-groups-preview](https://github.com/YushenDu224/pmg-vault/tree/codex/image-groups-preview) 分支；完整 v001—v020 源码包也包含这两份设计，附状态说明。

## 开发与回档

完整源文件按版本目录保存，SEAL.json 记录文件字节数和 SHA-256。已封存版本不修改，继续开发前复制为新版本。开发环境 Node.js 22+、pnpm，详见 [Windows 构建说明](versions/v020-unlimited-import/README.md)。

个人藏品、自己上传的图片、浏览器会话、凭据、依赖缓存均不在仓库与发布包中。根目录公开 PMG 样例与版本内 examples/sample.pmgx 是同一个已核实的官网公开样例。

## AI 辅助开发

本项目使用 OpenAI Codex 辅助设计、编写与验证；应用界面不显示 AI 声明。独立项目，与 PMG 无隶属关系。

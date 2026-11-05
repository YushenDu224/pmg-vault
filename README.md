# PMG库 · 钞票查询与收藏档案

通过 PMG 中国站或全球站查询认证信息，保存原始图片、详情文字、网页截图与网页快照，供桌面、手机和网页端整理、检索与携带。

**当前版本：v005，已提供可运行的档案管理主体与官网风格查询栏。在线自动采集引擎尚未接入。**

> **AI 辅助开发 / AI-assisted development**
> 本项目使用 OpenAI Codex 等 AI 工具辅助设计、编写和验证。功能以实际验收为准；本项目独立开发，与 PMG 无隶属关系。

[下载当前完整源码与全部版本副本](PMG库-v005-source.zip) · [当前版本与启动说明](CURRENT.md)

Windows：解压源码后进入 `versions/v005-pmg-ui`，双击 `启动PMG-Vault.cmd`，或运行 `node server.mjs`。需要 Node.js 22+。

## 已确定的方案

- 日常管理：本地数据库保存字段和索引，原始资源按文件保存。
- 单张交换：`.pmgx` 使用标准 ZIP 容器，内部为 JSON、原图、截图和网页资源。
- 整库备份：普通 ZIP，附清单；可以不用本软件取回内部文件。
- 查询入口可切换 `pmgnotes.cn` / `pmgnotes.com`，分别适配，保留实际来源。
- 界面采用深绿与暖白配色，主题、布局和采集逻辑分离。
- 每一批代码修改必须先复制上一版本，在新版本副本中修改；旧版本封存，Git 历史作为补充。

## 首版资料（历史基线）

- [需求、架构与界面方案](versions/v001-foundation/docs/DESIGN.md)
- [PMGX 格式草案](versions/v001-foundation/docs/FORMAT.md)
- [回档流程](versions/v001-foundation/docs/ROLLBACK.md)
- [开发路线与验收](versions/v001-foundation/docs/ROADMAP.md)
- [已核实的真实字段样例](versions/v001-foundation/examples/8077301-001.json)

## 本地检查

需要 Node.js 22 或更新版本，无需安装依赖：

```sh
node versions/v001-foundation/scripts/check.mjs
```

本次检查只验证规格样例和封存文件完整性，不代表在线采集、UI 或跨端导入已经实现。

项目独立开发，与 PMG 无隶属或官方合作关系。仓库保存源码和规格；个人藏品、浏览器会话和官网网页档案默认不提交。

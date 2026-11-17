# 当前代码入口与边界

Windows 主线是应用 0.18.0，功能来自 v021；v031 只整理项目布局、源码检查和构建输出路径。当前运行入口为 package.json 的 desktop/main.cjs，经 Electron 私有协议加载 index.html。界面配色与应用功能代码保持原字节。

| 目录 | 职责 |
| --- | --- |
| desktop/ | 窗口、内嵌官网、人工验证等待、原图及网页采集与 IPC |
| ui/ | 库、查询、检索排序、图片组和详情展示 |
| lib/pmg-adapter.mjs | 官网原字段到共同模型的映射 |
| lib/domain.mjs | 字段定义、查询与排序 |
| lib/archive.mjs、lib/zip-reader.mjs | PMGX/ZIP 读写和完整性检查 |
| lib/collection.mjs、lib/storage.mjs | 整库导入导出、合并与本地持久化 |
| lib/image-groups.mjs | 来源信息、图片分组与展示组选择 |
| apps/android/ | Java/WebView 宿主与独立离线预览，当前不共享 Windows 实时采集 |

安装包与源码分开管理；Windows 个人资料仍在原用户数据目录，整理不会迁移资料。原图和原字段保留，重新采集新增历史，不覆盖原始档案。预览图与原图用途不同；官网 OBV/REV 文件名不直接等于实际正反方向。

当前 Windows SOURCE-MANIFEST.json 只覆盖应用源码、构建输入与公开开发样例。完整历史的 SEAL.json/SOURCE-SEAL.json 保存在 archive/versions，使用 tools/check-archive.mjs 只读检查。不要让 Git 数据、归档、Android 缓存或安装产物混入当前源码清单。

源解析与界面互不依赖，档案读写不依赖 UI 框架。官网验证、空白、超时不能记成不存在的证书。Android 尚无完整 PMGX 和实时采集；具体能力与验收边界见 [status](status.md)。初始 DESIGN、FORMAT 和 ROADMAP 保留在各历史版本中，不能把当时的待办文字当作当前完成状态。

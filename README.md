# PMG库 · 钞票查询与收藏档案

当前版本 v010：Windows 内嵌官网采集窗口、自动入库、官网绿白灰界面、检索筛选、升降序、PMGX 导入导出、软删除和恢复。

> AI 辅助开发 / AI-assisted development：本项目使用 OpenAI Codex 等 AI 工具辅助设计、编写和验证。功能以实际验收为准；项目独立开发，与 PMG 无隶属关系。

[下载源码与所有历史副本](PMG-library-v010-source.zip) · [当前版本](CURRENT.md) · [采集使用说明](COLLECTOR.md)

本机双击输出目录的“启动PMG库.cmd”。在其他电脑解压后进入 versions/v010-capture-fix，安装 Node.js 22+，运行 npm install、node node_modules/electron/install.js、node launch.mjs。源码包不捆绑 Electron 运行依赖。

中国站 8077301-001 / 67 已实测保存两张 3237×1740 官网原图、文字、整页截图、离线 HTML 和 MHTML。全球站有入口与适配测试，尚未完成在线验收。验证码需用户手动完成；网页改版可能需要更新适配器。尚无独立 exe 安装包和原生手机应用。

PMGX 使用标准 ZIP 容器，内部为 JSON 和资源，便于跨端解析及独立取回文件。界面、主题、采集适配器与档案格式分离。浏览器 IndexedDB 保存藏品；完成档案和官网会话保存在本机 user-data。源码及仓库排除个人藏品、浏览器会话和依赖。

每批代码修改先完整复制上一版本，旧版本封存。v009 是初次采集实现，v010 修复下载判定和重复实例问题。保留全部历史源代码副本。回滚前应导出藏品并备份 user-data。

验证：在当前版本目录运行 node --test tests/*.test.mjs（7 项通过）。scripts/check.mjs 检查源码封存完整性，其沿用的基础版本尾部提示不代表当前功能状态。

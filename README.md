# PMG库

当前推荐 v015：统一的桌面藏品管理与官网采集窗口。绿色“检验PMG评级”区展开官网、采集状态和完整结果；保留侧边栏入口。详情 11 项字段齐全，缺失项显示“不适用”，支持检索与升降序。

[当前版本](CURRENT.md) · [所有版本](VERSIONS.md) · [验收记录](versions/v015-inline-final/docs/INLINE-ACCEPTANCE.md)

初次运行：安装 Node.js 22+，进入 versions/v015-inline-final，执行 npm install、node node_modules/electron/install.js，然后双击启动脚本。已有本机安装已准备好依赖。

官网需要验证时由用户操作，完成后继续采集。原图、JSON、PNG、HTML 和 MHTML 使用标准 ZIP 容器 PMGX 保存。源码包不包含个人藏品、浏览器会话或 node_modules。

## AI 辅助开发
本项目使用 OpenAI Codex 辅助设计、编写与验证；功能以实际验收为准。独立项目，与 PMG 无隶属关系。应用界面不显示 AI 声明。


[下载 v015 完整源码与全部历史副本](PMG-library-v015-source.zip)

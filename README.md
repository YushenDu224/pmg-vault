> **当前正式使用版本：v016。** 本分支是新功能 UI 设计预览区，默认主分支仍为 [main](https://github.com/YushenDu224/pmg-vault/tree/main)。
>
> **v017：新功能 UI 设计第一版（已废除，仅供回档）。**
>
> **v018：新功能 UI 设计第二版（当前预览方案，尚未接入正式藏品库和 PMGX）。**

[预览版本与运行说明](TESTING.md) · [v017 已废除状态](prototype-status/v017.md) · [v018 第二版状态](prototype-status/v018.md)

---

# PMG库

当前推荐 **v016**。侧边栏“查询与采集”打开独立的内嵌官网采集页面；“库”打开搜索、筛选、排序与目录。两页切换不再叠在一起。卡片显示官网原始地区代码和年份（SWI / 2017），不展示币种占位。

[当前版本与验收范围](CURRENT.md) · [全部源码副本](VERSIONS.md) · [改动说明](versions/v016-separated-pages/docs/SEPARATE-PAGES.md)

运行：安装 Node.js 22+，进入 versions/v016-separated-pages，执行 npm install 和 node node_modules/electron/install.js，然后 node launch.mjs。已有本机安装双击原“启动PMG库.cmd”。

[下载 v016 源码及全部历史副本](PMG-library-v016-source.zip)。源码不包含个人藏品、浏览器会话或依赖目录。原图、JSON、PNG、HTML、MHTML 使用 PMGX 标准 ZIP 容器保存。

## AI 辅助开发
本项目使用 OpenAI Codex 辅助设计、编写与验证；功能以实际验收为准。独立项目，与 PMG 无隶属关系。应用界面不显示 AI 声明。

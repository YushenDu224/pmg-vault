# PMG库 v016 · 分离查询页与库

本版完整复制自 v015-inline-final。

- “查询与采集”独立显示官网查询栏、内嵌官网、采集状态和结果。
- “库”仅显示搜索、筛选、排序与目录；移除统计条。切换时回到页首，查询会话保留，库页隐藏官网原生视图。
- 卡片只显示官方来源地区代码与原始年份，例如 SWI / 2017、US / 1935A。保留原始数据，不将 SWI 改成 CH。
- 11 项详情、原图、网页存档、回收站和既有库保持兼容。

启动：安装 Node.js 22+，npm install，然后 node node_modules/electron/install.js，最后 node launch.mjs。已有本机安装使用根输出目录“启动PMG库.cmd”。

验证：npm test；node scripts/check.mjs。详见 docs/SEPARATE-PAGES.md。手机端仍为响应式档案浏览器，未做真机验收。

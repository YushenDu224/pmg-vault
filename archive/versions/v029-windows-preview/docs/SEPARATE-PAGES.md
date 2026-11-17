# v016 分离查询与库

来源：v015-inline-final，复制前已核实全部封存哈希。

导航控制集中于 ui/navigation.mjs。查询页与库页互斥；切到库先隐藏原生官网视图；不会关闭官网会话或清空查询。来自启动参数的查询通过 onNavigate 进入查询页。

移除统计 DOM 及其渲染引用。库页保留检索、筛选、升降序、卡片/表格、导入导出与回收站。库/目录命名更新。

cardOrigin 使用 countryRaw 优先、旧档案 countryCode 回退和 noteYear.raw；不展示币种，不推断国家或改写存档。地区缺失时显示“不适用”。

验收状态由根目录 CURRENT.md 和 SOURCE-VERIFICATION.json 记录；自动化测试覆盖互斥导航、原生视图隐藏回调、查询输入保留、SWI 解析/展示/检索和年份后缀保留。网页/桌面实测另记于发布报告。

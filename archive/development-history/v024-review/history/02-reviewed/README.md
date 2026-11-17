# PMG库 v024 界面评审预览

本版以 v023 窗口预览和 Android 第一版预览为基础复制，旧目录不修改。它是可交互的设计预览，尚不是 Android APK。

## 打开

在本目录运行 `node serve-review.mjs`，访问 http://127.0.0.1:8875/ 。浅色和深色并排，页面按钮会同时切换两份预览。单独访问 android-preview/index.html 可用 ?theme=system、?theme=light 或 ?theme=dark，支持 #library、#query、#more。

## 本版变化

Windows 复用 v023 的窗口预览，内容样式表与 v021 逐字节相同。原应用未被覆盖或升级。

Android 使用双列自然高度排版，原图不裁切、不反色，评分放在图片之外。当前仅使用一个已核实公开样例，4 张卡片用于演示不同封面和标题高度，并不是4张藏品。

底栏从原预览总高度 77px 调整为65.45px（减少15%），标签由12px变为15px，触摸高度约54.65px。系统安全区另加，不伪造固定安全区高度。

查询表单为真实文字与控件，沿用保存的官网字体栈、#053d22绿底、白输入和#d0d0cd灰按钮，增加中国/全球网站选择框。官网区域保留原色，应用自有结果区跟随深浅主题。

## 范围与验证

已在400×890逻辑视口、DPR3保存1200×2670截图，并检查360/400/480宽度无横向溢出。已验证系统主题信号模拟、文字对比度、网站选择、样例查询、真实本地选图、图片组保存及展示切换、检索、回收站恢复。报告位于 previews/verification.json。

检查命令为 `node qa-mobile.mjs` 和 `node qa-review.mjs`，需要本机已有Electron路径。QA只用公开样例和隔离的临时浏览器目录，不读私人资料库。截图在 previews/。

尚未制作APK，未进行小米15真机测试。查询采集为明确标记的样例演示；PMGX导入导出仍是入口说明；上传仅在本次预览内生效。Android原生外壳与完整功能接入在界面确认后进行。系统主题的原生实现依据详见 platform-notes.md。

## 回档

- 上一版完整预览：../pmg-review。
- Android初始修改前代码：android-preview/checkpoints/01-before-edit。
- 深色可读性修复前代码：android-preview/checkpoints/02-before-dark-fix。
- 门户和QA每批修改前副本：checkpoints/。
- history/01-before-contrast-fix 是以修复前4份源码和未变更资源重建的完整可运行副本。
- history/02-reviewed 是最终完整源码副本，均带 SOURCE-SEAL.json。

根目录 SOURCE-SEAL.json 覆盖展示所需源文件和原图资源，排除QA浏览器资料、截图及历史副本。运行 `node scripts/check-preview.mjs` 可核查封存内容；继续修改应先复制为新版本。服务端静态白名单不提供QA浏览器资料与备份目录。

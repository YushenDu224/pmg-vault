# PMG库 · 浏览器兼容性修正预览 v025

此副本来自封存的 v023-window-preview，保持原配色与窗口外轮廓。新增会话生命周期修正、验证等待、系统浏览器对比和隐私过滤的诊断导出。完整事实、验证和限制见 docs/BROWSER-COMPAT.md。

31 项回归测试通过。全球站重复验证本次没有复现；修正的是明确代码风险，不能宣称已让所有验证码通过。此处仅为源码预览，未升级已安装软件，也未生成新安装包。

以下保留基线说明。
# PMG库 · v021 原样式的窗口预览

此评审副本 v023-window-preview 按用户截图从封存的 v021 复制。仅新增窗口外壳样式、连续曲率外轮廓和最小化/最大化/关闭按钮，并调整滚动容器与官网子视图定位以配合外壳。ui/theme.css、ui/image-groups.css 和档案模型保持源文件字节一致。

当前交付为预览，先评审再决定正式安装版与 Android 原生工程。Windows 近似曲线使用两段对称三次贝塞尔，直线连接处曲率为零，中间曲率连续。参考 Apple RoundedRectangle(cornerRadius:style:) 的 .continuous 风格，半径 24 DIP 是本次设计选择，不是 Apple 指定的统一尺寸。

原生窗口操作在隔离资料库验证；26 项历史回归测试通过。公开样例截图位于评审目录 previews。网页评审入口由 serve-review.mjs 在本机 8874 端口提供。

Apple 参考 https://developer.apple.com/documentation/swiftui/roundedrectangle/init(cornerradius:style:) 与 https://developer.apple.com/documentation/swiftui/roundedcornerstyle/continuous 。

以下保留 v021 功能说明。

源码副本 v021-image-groups，从封存的 v020 完整复制，将 v18 图片分组设计接入藏品库与 PMGX 档案。

## 使用

运行输出目录中的 PMG-Library-0.18.0-Setup-x64.exe，选择安装范围和安装目录。安装后从桌面或开始菜单启动。安装包内含所需运行环境。

在库中打开藏品，点击“添加图片组”，选择正面或背面图片并填写可选的来源、网址和备注。每组至少一面，可编辑和替换已上传的图片。点击“设为展示组”后，详情和卡片使用同一组。背面单独成组时，卡片使用该组背面。

新增图片和展示选择随 PMGX 与整库 ZIP 保存。旧档案可以直接导入。合并同一藏品时保留本地展示选择，按更新时间合并图片组。官网原图和采集历史仍可查看。

用户数据位于 %APPDATA%/PMG库，与程序安装位置分离。旧开发版通过“导出整库”生成 ZIP，在安装版“导入档案”中导入；保留旧库和备份。卸载配置不自动删除数据。

## 重建

开发环境 Node.js 22+、pnpm。安装 pnpm-lock.yaml 锁定依赖，执行 node node_modules/electron/install.js 和 node scripts/make-icon.mjs；运行 npm run dist:win。构建配置可通过 PMG_ELECTRON_DIST 指定 Electron 45.2.2 目录。源码开发入口 npm start。详细架构见 docs/WINDOWS-INSTALLER.md。

本版取消导入文件、解压总量、整库张数的固定上限；使用 File/Blob 按张读取 ZIP/ZIP64，保留 CRC、SHA-256、路径和重复项验证。设备内存和磁盘容量仍构成实际限制。中途遇到损坏文件会保留已经导入的藏品，重试自动去重。详见 docs/UNLIMITED-IMPORT.md。

26 项自动化测试通过。Windows 打包程序在隔离资料库中通过旧档案导入、真实图片上传、编辑、展示组切换、重新加载和 PMGX 导出校验。安装向导由用户运行。安装包未签名。


# PMG库 Windows 0.18.2-preview.1

此版本是预发布测试版，从封存的 v028-state-sync（68个源文件）完整复制到 v029-windows-preview。安装包可选择安装位置，个人资料继续与程序目录分离；本次不会自动安装或覆盖当前软件。

当前电脑已安装0.18.0；本发布只更新package版本为0.18.2-preview.1并保留状态同步修正。内部ASCII标识、原配色、窗口和官网采集策略沿用v028。pnpm-lock.yaml v9没有应用版本顶层字段，依赖锁定内容保持原字节；若存在npm锁文件则准备脚本会同步其顶层及根包版本。

41项功能回归及无推送条件的真实UI离线集成曾通过。v028真实官网复测在上轮被用户Esc中止，不能称为全部Cloudflare人工验证通过；此前v027真实详情与档案确实已保存，但外层反馈滞留，v028针对该状态同步问题修正。当前打包不代替真机、安装升级、私人资料迁移或长期使用验收。

Windows安装包未签名。运行环境随安装包提供。安装位置可自选，卸载配置保留个人资料。本次发行构建脚本及SHA-256记录在pmg-delivery目录中；历史源版本完整保留。

以下保留继承说明与各批次事实。

# PMG库 · v028 状态同步修正对照

此副本修复应用自己的采集反馈与入库状态同步，保留原配色、窗口、ASCII内部标识及0.18.1-preview.2版本。41项回归通过，无推送条件的真实UI离线集成已完成。完整依据、改动与测试边界见 docs/STATE-SYNC.md；官网人工验证与实际打包运行仍由主任务复核。

以下为继承的历史说明。
# PMG库 · 浏览器兼容性修正预览 v025

此副本来自封存的 v023-window-preview，保持原配色与窗口外轮廓。新增会话生命周期修正、验证等待、系统浏览器对比和隐私过滤的诊断导出。完整事实、验证和限制见 docs/BROWSER-COMPAT.md。

31 项回归测试通过。独立网页视图两次自动到达全球站详情；实际源码程序观察约 110 秒停在需要手动验证，本次未点击验证码，因此无法确认或排除人工验证后的循环，不能宣称已解决唯一根因。已生成 PMG-Library-0.18.1-preview.2-Setup-x64.exe，28 个运行文件与源码一致；安装包未签名、尚未安装，未升级已安装软件。

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




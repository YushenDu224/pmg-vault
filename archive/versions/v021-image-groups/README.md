# PMG库 · Windows 图片分组新功能版 0.18.0

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

# v016 Windows 本地安装版 · 源码副本 v019

基线：核实封存的 v016-separated-pages。软件显示版本 0.16.1；不引入 v017/v018 UI 原型。

安装程序使用 NSIS 向导，oneClick=false、allowToChangeInstallationDirectory=true。支持选择安装目录，生成桌面及开始菜单快捷方式，支持 Windows 卸载入口。

应用直接使用打包资源与 pmg-library 标准安全协议启动，无需用户安装 Node.js，无本机 HTTP 服务、固定端口和独立服务进程。官网仍使用隔离的 WebContentsView，采集引擎及 PMGX 格式保持 v016 行为。

程序文件位于所选安装位置，藏品、官网会话和采集文件保存在 %APPDATA%/PMG库。卸载配置不清理个人数据。旧开发版资料库使用不同来源，迁移方式是从旧版“导出整库”，在安装版“导入档案”中选择 ZIP。原库保持原状。

安装包只包括应用资源和已核实公开样例，不包含开发者藏品、个人备份、浏览器会话及签名密钥。当前构建不使用商业代码签名证书，未声称已通过 Microsoft 发布者验证。

构建：Node.js 22+、pnpm，安装锁定依赖，node scripts/make-icon.mjs，然后 node node_modules/electron-builder/cli.js --config electron-builder.cjs --win nsis --x64 --publish never。electronDist 当前复用旁边 v016 的本机 Electron 45.2.2；其他机器可先安装相同版本并指定对应 electronDist。

验收记录另附于输出目录的 Windows 构建报告，区分代码测试、实际安装、重启数据与在线官网采集。

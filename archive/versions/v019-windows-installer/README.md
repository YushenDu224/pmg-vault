# PMG库 · Windows 本地安装版 0.16.1

源码副本 v019-windows-installer，完整复制核实封存的 v016 后制作。功能和界面以 v016 为准，未引入 v017/v018 UI 原型。

## 使用

运行输出目录中的 PMG-Library-0.16.1-Setup-x64.exe，选择仅为当前用户或所有用户安装，然后选择安装目录。安装后从桌面或开始菜单启动。用户不需要安装 Node.js 或运行本机网页服务。

用户数据位于 %APPDATA%/PMG库，与程序安装位置分离。旧开发版通过“导出整库”生成 ZIP，在安装版“导入档案”中导入；保留旧库和备份。卸载配置不自动删除数据。

## 重建

开发环境 Node.js 22+、pnpm。安装 pnpm-lock.yaml 锁定依赖，执行 node node_modules/electron/install.js 和 node scripts/make-icon.mjs；运行 npm run dist:win。构建配置可通过 PMG_ELECTRON_DIST 指定 Electron 45.2.2 目录。源码开发入口 npm start。详细架构见 docs/WINDOWS-INSTALLER.md。

19 项自动化测试通过。实际安装、重启持久化和官网采集的验收结果记录在输出目录的构建报告中。当前安装包未使用商业发布者签名。

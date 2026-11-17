# Windows 安装包交付

| 用途 | 版本 | 文件 |
|---|---|---|
| 与当前已安装程序一致 | 0.18.0 | dist/windows/PMG-Library-0.18.0-Setup-x64.exe |
| 新状态同步预发布测试版 | 0.18.2-preview.1 | dist/windows/PMG-Library-0.18.2-preview.1-Setup-x64.exe |

已安装版本通过卸载注册表和安装目录resources/app.asar双重核实为0.18.0。稳定安装器内部ASAR与当前安装ASAR完全同SHA-256；新预览安装器内部ASAR与新构建输出相同。预览运行文件共31个，除builder删除开发脚本/依赖后的package.json按运行元数据核对外，其余30个文件与封存源码逐字节相同。

两份安装包均为Windows x64 NSIS向导，可选择安装位置，卸载不删除个人资料。均未签名。本次只创建/复制安装包，没有运行安装器、升级当前应用或读取私人藏品。

预览沿用同一应用ID与个人资料路径，安装它可能升级现有程序；它不是默认独立并行产品。当前保持0.18.0已安装状态。v028真实官网复测因用户Esc中止，不能将41项回归及离线UI集成通过解释为所有人工验证均通过。

校验值：dist/windows/SHA256SUMS.txt。证据：reports/windows-current-mapping.json、windows-package-verification.json、windows-source-integrity.json。源码版本v029-windows-preview已封存68个文件，版本0.18.2-preview.1为预发布。

重建：scripts/build-windows.ps1，支持ElectronDist与BuilderCli参数，默认使用本机既有缓存；build只输出到dist/windows，不发布或安装。准备、版本检查、归档核对步骤均保留在scripts目录。Git仓库应保存源码和记录，大安装包通过发行资产分发。

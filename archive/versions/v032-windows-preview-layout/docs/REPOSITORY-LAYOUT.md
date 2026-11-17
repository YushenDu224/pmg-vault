# v032 Windows 测试分支入口整理

基线：v029-windows-preview，应用版本保持 0.18.2-preview.1。本次开始前验证原 SEAL 的全部 68 个文件。

当前 Windows 源码使用与 v031 相同的显式校验白名单，范围由 SOURCE-MANIFEST.json 记录。完整副本的全部文件另由 SEAL.json 记录。历史归档、Android、Git 目录、依赖与构建输出不属于当前 Windows 源码范围。

移除六个遗留入口：server.mjs、launch.mjs、启动PMG库.cmd、启动PMG-Vault.cmd、scripts/build-sample.mjs、lib/collector-service.mjs。原版本归档仍完整保存这些文件。当前程序通过 Electron 自定义协议从本地资源启动，不依赖旧网页服务。

electron-builder.cjs 不再查找旧 v016 兄弟目录；构建输出为当前项目 dist/windows。保留应用 ID、资料路径、未签名安装策略与 NSIS 可自选安装位置设置。不修改 PMG 页面解析、验证码策略、采集状态、UI、图片、档案格式或用户数据。

对副本的后续修改必须先创建完整的新编号副本或修改前 checkpoint；已封存目录不修改。

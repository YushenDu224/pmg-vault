# 当前版本记录 · 2026-11-17

| 项目 | 应用版本 | 源码副本 | 核实状态 |
| --- | --- | --- | --- |
| 电脑实际安装并运行 | 0.18.0 | [v021-image-groups](versions/v021-image-groups) | 注册表、安装包与已安装 ASAR 一致 |
| 最新 Windows 发行测试包 | 0.18.2-preview.1 | [v029-windows-preview](versions/v029-windows-preview) | 41 项回归通过，运行文件核对通过；未安装 |
| Android 可安装离线预览 | 0.1.0-preview.1 | [v030-android-preview](versions/v030-android-preview) | APK 静态构建与签名检查，未做小米 15 实机验收 |

v025、v027、v028 为对照测试，内部 package 版本同为 0.18.1-preview.2，靠源码目录序号区分。v029 才单独提升为 0.18.2-preview.1。v022 的 0.19.0 是已废除设计实验的内部版本，不表示它比当前方向更适合使用。

Windows 0.18.0 包内 app.asar 与已安装程序的 SHA-256 均为 768f191ade91cb5f41fa3b30fd2dbcd877a4fd56d01b41083e7d8dc1eb1d1a3e。安装器校验值见 [发布核验](docs/verification/windows-package-verification.json)。

新 Windows 测试包保留原主题，只调整窗口外壳并包含浏览器兼容性和状态同步修正。41 项检查与离线真实 UI 同步通过，不代表官网真人验证全部通过。v028 最后一次真实网页复测未完成；打包没有替代该验收。预览版可能升级同一 Windows 程序，选择不同安装目录并不自动隔离用户资料。

Android 仍是界面和交互预览：实时采集与完整 PMGX 未接入，上传组未持久化，不能导入和替代 Windows 私人藏品库。手机屏幕适配按设计实现，真机表现待实测。

0.16.1/0.16.2 等旧发布、v016 界面基线、v017 已废除第一版及 v018 第二版预览均保留。原根文档见 development-history/published-v020-root。本次未修改当前安装程序或个人资料。

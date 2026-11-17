# 完整历史归档

本目录保存本项目要求的完整源码副本、设计试验、修改前检查点和历史操作依据。日常 Windows 开发从仓库根目录开始，Android 预览从 `apps/android` 开始。

| 目录 | 内容 |
| --- | --- |
| [versions/](versions/) | 各批次完整封存源码及各自 seal |
| [development-history/](development-history/) | 网页评审、修改前 checkpoints、重测和旧构建/发布工具 |
| [source-packages/](source-packages/) | 早期已打包的源码 ZIP，作为历史附件保留 |
| [metadata/](metadata/) | 旧版清单、核验结果、路径和本次迁移依据 |

部分旧根目录说明也保存在 `docs/history`。历史文件内的原路径、版本名和当时的进度说明保持原样；它们不表示当前入口的目录或当前能力。

## 重要版本

- [v016-separated-pages](versions/v016-separated-pages/)：库与查询独立页面的基线。
- [v017-image-groups-prototype](versions/v017-image-groups-prototype/)：新功能 UI 第一版，**已废除**。
- [v018-display-group](versions/v018-display-group/)：新功能 UI 第二版预览。
- [v021-image-groups](versions/v021-image-groups/)：Windows 0.18.0，当前根目录功能来源。
- [v022-fluid-ui](versions/v022-fluid-ui/)：已废除的整体 UI 实验。
- [v029-windows-preview](versions/v029-windows-preview/)：Windows 0.18.2-preview.1 测试源。
- [v030-android-preview](versions/v030-android-preview/)：Android 0.1.0-preview.1 离线预览源。
- [v031-repository-layout](versions/v031-repository-layout/)：当前 Windows 0.18.0 根目录入口的整理副本。
- [v032-windows-preview-layout](versions/v032-windows-preview-layout/)：Windows 测试分支的根目录入口整理副本，仍为 0.18.2-preview.1。

v024 是网页评审批次、v026 是重测批次，其相关代码归入开发历史，不是遗漏了两个正式应用版本。v031 为此次主入口和目录整理批次，应用版本继续为 0.18.0。

## 校验与恢复

在仓库根目录运行：

```powershell
node tools/check-archive.mjs
```

每份完整应用源码保留原封存清单。文件被移动到归档不应改变字节；新的整理批次使用自己的新清单。不得在旧封存目录内直接修复、更新依赖或改写历史文档。

少数历史评审门户的原清单包含本机屏幕画面，这些画面以前发布时已被有意排除。相关门户保留代码和原清单作为来源依据，不能称为原资产全部齐备；其边界仍按历史清单说明保留。旧重测报告中的录像引用也只对应本机资料，录屏没有上传。

恢复开发时先检查目标副本，再复制成一个新递增批次；Git 标签、发布和完整副本同时保留。旧脚本可能依赖当时的工作目录和本机工具缓存，不应在未核对路径时作为当前构建入口。当前操作见 [开发规则](../CONTRIBUTING.md)。

## 公开范围

移入 `archive` 属于整理归档，**不会让公开文件变成私密文件**。仓库仍可公开浏览和下载历史源码。

个人藏品、自己上传的私人图像、浏览器配置、Cookie、凭据、签名私钥、构建缓存及屏幕录像不属于源码归档。它们不能通过添加归档目录的方式进入 Git。既有公开 PMG 开发样例是明确保留的测试资源。


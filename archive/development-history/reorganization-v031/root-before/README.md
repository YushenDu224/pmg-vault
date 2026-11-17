# PMG库

电脑当前安装版是 **Windows 0.18.0（v021）**。本次同时保存后续完整源码，提供 **Windows 0.18.2-preview.1（v029）** 测试安装包及 **Android 0.1.0-preview.1（v030）** 离线预览 APK。

| 下载 | 用途 | 状态 |
| --- | --- | --- |
| [Windows 0.18.0](https://github.com/YushenDu224/pmg-vault/releases/tag/v0.18.0) | 与当前电脑安装程序一致 | 保留已知官网验证限制 |
| [Windows 0.18.2-preview.1](https://github.com/YushenDu224/pmg-vault/releases/tag/v0.18.2-preview.1) | 新窗口与采集状态修正 | 测试版，完整官网人工验收待完成 |
| [Android 0.1.0-preview.1](https://github.com/YushenDu224/pmg-vault/releases/tag/android-v0.1.0-preview.1) | 双列界面、系统选图与图片组交互 | 可安装离线预览，尚非完整藏品应用 |

[当前版本与验收边界](CURRENT.md) · [全部版本](VERSIONS.md) · [源码历史与排除说明](SOURCE-HISTORY.md) · [Windows 双包核验](WINDOWS-DELIVERY.md)

Windows 安装向导可自选安装位置，自带运行环境。两个 Windows 包均未数字签名；预览版沿用资料库设计，安装前请导出整库备份。此次发布没有安装、覆盖现有程序或迁移私人资料。

Windows 功能包括独立的查询与采集、库、逐字段搜索筛选排序、回收站、原图及网页存档、PMGX/整库备份，并在 v021 接入自己上传的正反面图片组、来源/网址与展示组选择。内嵌官网在部分 Cloudflare 流程仍可能反复验证；最新测试不能解释为该问题已全部解决。

**安卓范围：** v030 将 v025 交互稿封装为独立 APK，保留双列自然高度目录、完整图片预览、深浅主题、系统选图、来源/网址、图片组切换与样例查询。实时官网自动采集、PMGX/整库导入导出尚未接入；上传组仅本次内存体验，设置 JSON 不是图片备份。尚未完成小米 15 实机验收。详见 [Android 源码说明](versions/v030-android-preview/README.md)。

## 源码与回档

每次修改保留完整目录副本和封存记录，版本目录是开发序号，不能直接当作应用版本号。v017 是新图片组 UI 第一版，已废除；v018 是第二版预览；v022 是已废除的整体现代化 UI 实验。v024 为 Android 网页评审批次，v026 为重测批次，均不是漏传的正式应用版本。

所有已存在的旧版本保留原字节。Android 各轮预览、修改前 checkpoints、构建与诊断脚本在 development-history。部分历史门户引用的屏幕画面仅留本机；保留代码和原封存清单，并在 SOURCE-HISTORY 标明缺少画面资产的边界。正式 Windows 版本源码按封存清单完整保存。

仓库不包含个人藏品、私人上传图、浏览器会话、Cookie、凭据、测试签名私钥、依赖缓存或录屏。大安装包与完整源码 ZIP 从 Releases 下载。复建请使用各版本锁文件和说明。

## AI 辅助开发

本项目使用 OpenAI Codex 辅助设计、编写与验证；应用界面不显示 AI 声明。独立项目，与 PMG 无隶属关系。

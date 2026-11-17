# 本次发布保留的工具代码

`source-history-v001` 为本机历史源码汇总、封存核验和白名单审计脚本；`publishing-v001` 为本次 GitHub 核对、源码 ZIP、校验清单和 Releases 上传脚本。它们是实际操作步骤的源码记录，保留原本机工作目录关系，不是应用运行依赖。

本次工作目录结构为 `pmg-delivery/repository`（Git checkout）、`pmg-delivery/repository-staging`（审计后的历史源副本）、`pmg-delivery/versions`（新构建源）、`pmg-delivery/dist`（本地安装包）以及与 `repository` 同级的 `publishing-tools-v001`、`source-tools`、`release-notes-v001` 和 `reports`。从这里复用脚本时需按该结构复制，或按自己的路径调整后建立新的步骤副本。脚本中的旧绝对路径仅是来源位置，未包含登录信息。

发布脚本从 Git Credential Manager 读取本机已有 GitHub 凭据，只在内存中用于固定的 GitHub API 地址；不打印、保存或在命令行中传递令牌。它们仅在显式运行并提供精确提交与发布计划后执行发布。仓库不提供凭据，也不会自动运行上传。

应用复建以各 `versions` 目录的 README、锁文件和构建说明为准。Windows 本次打包与核验脚本在 `development-history/delivery-tools`，Android 原生构建脚本在 `versions/v030-android-preview/scripts`。Android 测试密钥由本地脚本生成，不随源码分发。

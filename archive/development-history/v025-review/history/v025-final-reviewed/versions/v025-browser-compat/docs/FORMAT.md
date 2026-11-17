# PMGX 格式草案 0.1

状态：草案，首个读写器实现前冻结为正式 v1。本仓库尚无 PMGX 解析器。

PMGX 是带 `.pmgx` 后缀的标准 ZIP，无加密、无自创二进制编码。内部使用 UTF-8 JSON 和标准媒体文件。普通解压工具可以恢复资源。扩展名本身不代表格式有效，必须检查 manifest。

## 文件结构

```text
manifest.json
note.json
checksums.json
captures/<captureId>/source.json
captures/<captureId>/raw-fields.json
captures/<captureId>/screenshot.png
captures/<captureId>/page.mhtml
captures/<captureId>/offline/index.html
captures/<captureId>/offline/assets/...
images/originals/<sha256>.<extension>
images/preview.webp
```

manifest 必含 format=`pmgx`、formatVersion、archiveId、noteId、createdAt、updatedAt、notePath、captures、resources。时间为带偏移的 ISO 8601。资源清单包括相对路径、媒体类型、字节数、SHA256、来源 URL 和角色。checksums 覆盖所有 payload 文件，不包含自身与 manifest，避免循环哈希；manifest 的每条资源也包含校验值。

## note 模型

certificationNumber、name、catalogNumber、serialNumber、countryRaw、countryCode、grade.numeric、grade.designations、grade.display、gradingDate、noteYear.raw、noteYear.start、noteYear.end、denomination、currency、userTags。

缺失可选值使用 null，保留原始字段。`1935A` 保存在 noteYear.raw，可提取 1935 为 start/end，但不能丢失 A；无法明确提取时保持 null。每个采集保存自己的字段快照，note 仅是当前选择的投影。

## 采集与图片

capture 包含来源站点 cn/global、完整查询 URL、查询编号和评分、采集时间、采集器版本、状态、字段快照及资源引用。原始站点 URL 和最终 URL 分开保存。

图片保留 originalFilename、sourceSideLabel、visualSide（obverse/reverse/unknown）、sourceUrl、width、height、sha256 与原始字节。预览与原图是不同角色。方向修正不重写原始字节。

官网无图片：status=unavailable；下载错误：status=failed；未知：status=unknown。三者不可混为一谈。图片来源应读取 href 或页面实际的大图资源，不通过缩略图地址猜测原图。

## 兼容与写入

读取未知主版本时停止导入并提示升级，不能静默损坏数据。兼容小版本需保留未知字段及扩展数据。导出先写临时文件，检查 payload 和清单后原子替换；导入不执行归档内代码。

同一 noteId 的多个 PMGX 可合并采集历史；captureId 冲突时按内容校验后去重或提示。原始档案不原地迁移，迁移生成新副本。整库 ZIP 包含 PMGX 或等价无损资源与索引清单，不导出浏览器会话。

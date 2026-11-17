# PMG 官方 Logo 与评分选项核查

核查时间为 2026-11-17。本次直接读取中国站和全球站首页及其实际引用的样式、矢量资源。网页响应均为 HTTP 200，无需验证码操作。

## Logo 证据链

两站首页均使用 `<a class="ccg-header-logo" href="/">` 作为页首 Logo，由 CSS 背景图提供。首页引用的当前主样式地址相同。

- [中国站首页](https://www.pmgnotes.cn/)
- [全球站首页](https://www.pmgnotes.com/)
- [中国站主样式](https://www.pmgnotes.cn/cassette.axd/stylesheet/9afa39241eccf155788f9e7a816a28181b682bff/bundles/mvc/site-css)
- [全球站主样式](https://www.pmgnotes.com/cassette.axd/stylesheet/9afa39241eccf155788f9e7a816a28181b682bff/bundles/mvc/site-css)

主样式 `.ccg-header .ccg-header-logo` 实际引用的资源为绿色原始 SVG。

- [中国站绿色 Logo 原始 SVG](https://www.pmgnotes.cn/cassette.axd/file/resources/images/template/pmg-logo-green-ccf29b3893b456fa5480a5aa415e46810c9186b7.svg)
- [全球站绿色 Logo 原始 SVG](https://www.pmgnotes.com/cassette.axd/file/resources/images/template/pmg-logo-green-ccf29b3893b456fa5480a5aa415e46810c9186b7.svg)

两站下载结果均为 5,752 字节，SHA-256 均为 `7d74f0edc94dbeddfd45a96cece2f5f2d3eb7b02a77fce71b3aa5123989b650c`。当前 `android-preview/assets/pmg-logo.svg` 与 `versions/v025-browser-compat/assets/pmg-logo.svg` 已与两站原始下载结果逐字节相同。

SVG 的 `viewBox` 为 `0 0 147.84 34.08`，包含天平与 PMG 字样的四个路径。路径颜色为 `#215732`。文件中没有背景矩形、位图图层或白色填充。背景本来透明，页面上看到的白块来自应用的 CSS、图片元素背景或外层容器。原字节无需重绘或抠图。

下载的原字节保存在 `assets-evidence/pmg-logo-green-cn-original.svg` 和 `assets-evidence/pmg-logo-green-com-original.svg`。现有应用素材已经同字节，本次没有覆盖已有 `pmg-logo.svg`。

官网页脚还引用黑色透明版本，已将原字节保存为 `assets-evidence/pmg-logo-black-cn-original.svg`，5,609 字节，SHA-256 为 `b88331dab7b44c6c660fc560017bb87917e2f9a24d7f801f0732865a3d53c3bf`。本次查阅的首页及主样式未发现白色或反白的 PMG Logo 资源引用。

[官网黑色 Logo 原始 SVG](https://www.pmgnotes.cn/cassette.axd/file/resources/ccg-shared/images/logos/pmg-black-7ca610cba5f9d69121cd54ce48412d407860f2eb.svg)

## 评分下拉框的真实编码

两站首页评分下拉框均为 `<select name="grade" ng-model="$ctrl.grade" required>`，共有 32 个选项。数字选项的源 HTML 仅给出文本，未写显式 value。HTML 规则下其提交值等于文本。

| 顺序 | 中国站标签 | 全球站标签 | 实际 value |
| --- | --- | --- | --- |
| 1 | 空白 | 空白 | 空字符串 |
| 2 | 非数值 | Non-Numeric | `NonNumeric` |
| 3—31 | 数字 | 数字 | 见以下完整序列 |
| 32 | 不在表单内 | Not Listed | `NotListed` |

完整数字值按官网顺序为 `70, 69, 68, 67, 66, 65, 64, 63, 62, 61, 60, 58, 55, 53, 50, 45, 40, 35, 30, 25, 20, 15, 12, 10, 8, 6, 4, 2, 1`。

完整机器可读选项保存为 `assets-evidence/official-grade-options.json`。两个原始 select 片段分别为 `assets-evidence/cn-grade-select.html` 和 `assets-evidence/com-grade-select.html`。非数值编码为 `NonNumeric`，不在列表内编码为 `NotListed`，二者是不同的选择。本次只核实官网表单的真实编码，未提交非数值证书查询。

## 原始证据文件

`assets-evidence` 下还包含两站首页原始 HTML 以及主样式原始字节。当前已保存所有官方 Logo 的原始文件内容。后续若替换已有应用素材，应先复制到独立 `asset-backup` 目录。

深色应用品牌栏以 CSS 单色方式呈现同一矢量轮廓，提高深色背景上的辨识度；这不是声称找到官网白色版本。SVG 原始字节保持不变。官网白底内容和钞票原图不应用此颜色呈现规则。

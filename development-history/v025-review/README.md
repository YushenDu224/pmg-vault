# PMG库 v025 · 界面改进与浏览器兼容性测试版

上一版 v024 已校验封存并保留。本目录为新的独立源码副本，已安装程序、私人藏品和浏览器会话均未被覆盖。

## 直接使用

预览：http://127.0.0.1:8876/ 。关闭后可在本目录运行 `node serve-review.mjs`。

Windows 测试安装包：[PMG-Library-0.18.1-preview.2-Setup-x64.exe](dist/PMG-Library-0.18.1-preview.2-Setup-x64.exe)。支持自选安装位置，未签名，未代你安装。安装包与28份运行源码已逐项核对一致，报告在 build-tools/windows-build-verification.json。程序保留原有主题、图片组和档案功能，新增验证诊断工具及兼容修正。

## 安卓预览变化

- 删除库页“我的钞票档案 / 库 / 查询钞票”整栏，保留顶部品牌和底部查询入口。
- 使用官网原始透明 SVG，不重绘 Logo；深色品牌栏通过呈现样式使用浅色轮廓，原 SVG 字节保持不变。
- 评分支持手输和官网完整选项（29个数值、非数值、不在表单内）。输入聚焦或键盘出现时关闭选择列表；未在官网清单内的数值明确提示核对。
- 官网窗口外框包含地址栏，按屏幕视口宽高比展示；横竖屏跟随，键盘缩小时保留原比例。内容独立滚动，保留可读字号，不把桌面网页整体缩小。
- 延续双列完整图片、深浅主题、缩小15%的底栏和放大的标签。

当前安卓仍是交互预览，查询为已标记样例，图片组只在本次体验生效；尚不是APK。中国/全球实时采集、PMGX系统文件读写及小米15真机验收仍待后续原生接入。

## Windows验证循环

详见 [Cloudflare-diagnosis.md](Cloudflare-diagnosis.md) 和 versions/v025-browser-compat/docs/BROWSER-COMPAT.md。修正了截图后调试会话未释放、采集检查并发、重复提交重载、官方弹窗被强制移到主查询页等问题；保留持久会话与原浏览器标识，没有清Cookie、伪装指纹或自动解验证码。

本轮两种现场检查必须分开解读：普通独立浏览器视图访问全球站约13.2秒后返回10个详情字段；真正的PMG库修复程序在新测试会话里仍要求手动验证。未点击验证，不能确认人工操作后是否循环，也不能把本次补丁称为已彻底解决网站拒绝。

## 验证与回档

Android：`node qa-mobile.mjs`，通过完整评分清单、手输、列表/键盘互斥模拟、屏幕比例与旋转、透明Logo、360/400/480宽度、主题与图片组回归。报告 previews/verification.json。`node qa-review.mjs` 检查门户双主题与切页。

Windows：31项回归通过；实际启动显示诊断/系统浏览器入口可用，JavaScript与持久会话为true、调试连接未附着。安装步骤及人工验证未测。

旧版完整目录 ../pmg-review-v024 保留。Windows原完整59文件保存在 history/windows-01-before-browser-compat；Android每批修改前源码保存在 android-preview/checkpoints。最终源码清单在 SOURCE-SEAL.json，Windows源码清单在 versions/v025-browser-compat/SEAL.json。继续修改前应复制新版本。

诊断浏览器资料、私人数据、原始网络会话不在安装包或静态预览服务白名单内。官网素材证据见 logo-provenance.md。

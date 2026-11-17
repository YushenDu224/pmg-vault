# Windows 浏览器兼容性检查与修正

核查时间：2026-11-17。基线为已验证封存的 v023-window-preview，完整修改前副本位于评审目录 history/windows-01-before-browser-compat。未修改或覆盖已安装程序、私人资料库、Cookie 或浏览器会话。

## 结论与证据边界

本次没有复现用户描述的全球站反复验证。主任务的正常导航检查使用 Electron 45.2.2 / Chrome 156.0.8078.80，没有附加调试器、修改 UA、模拟设备或点击验证。全球站公开证书页面约 14.4 秒后出现 10 个详情字段；中国站一次访问返回 ERR_CONNECTION_CLOSED。原始诊断在评审目录 diagnostics/initial-navigation.json。这只能说明此次访问结果，不能证明所有网络、设备或既有会话均无问题。

Cloudflare 官方把嵌入式浏览器列为有限支持环境，并说明模拟设备、开发工具和浏览器环境不一致可能影响验证。反复验证也可能由网络问题或网站侧检测造成；生产验证不支持浏览器自动化框架解题。不得把看到 Cloudflare 脚本即视为程序阻拦，也不得把 PAT 的 401 或通配域名 DNS 探测失败单独视为验证失败。

- https://developers.cloudflare.com/cloudflare-challenges/reference/supported-browsers/
- https://developers.cloudflare.com/cloudflare-challenges/troubleshooting/challenge-solve-issues/
- https://developers.cloudflare.com/turnstile/get-started/mobile-implementation/

源码审计确认原程序已经使用持久会话、默认 JavaScript 和正常网页存储，没有每次查询清 Cookie、改 UA 或拦截 Cloudflare 网络域名。原 will-navigate 只限制主框架，不限制 Cloudflare 子框架。因此不能把“Cookie 被程序清空”或“Cloudflare 子框架被主域白名单拦截”当成已证实根因。

## 已修正的程序问题

1. 整页截图临时附加的调试会话在 finally 中脱离，失败路径也清理；不干扰别的调试会话。这避免上一张钞票截图后，调试器继续附在下一次验证页面上。该问题确实存在于旧代码，但尚未证实它是用户这次循环的唯一原因。
2. 慢速采集检查增加防重入锁，旧查询的异步结果不能修改新查询状态。
3. 挑战页面使用小型就绪检查并等待，每五秒只观察状态，不每 1.8 秒提取全部 HTML。不自动刷新、不自动点击，也不把验证页归为无证书。
4. 相同查询尚未完成时重复点击“确定”保留现有页面与会话；明确点击“重新载入”才重新加载。
5. 官方链接的 window.open 保留为独立、同持久会话的沙盒窗口，不再通过 loadURL 强制重载主查询页。主框架仍限制 PMG 官方来源，安全辅助弹窗可使用 about:blank、about:srcdoc 和 challenges.cloudflare.com；其他子框架继续由正常浏览器规则处理。未关闭网页安全检查。
6. 明确启用 JavaScript，保持 UA 原值及稳定会话，不伪装其他浏览器，不转移外部 Cookie。

## 可操作诊断

查询工作区新增“保存诊断”。导出内容仅包含 Electron / Chromium 版本、UA 族、持久会话与 JavaScript 状态、最多 80 条域名/资源类型/状态码/网络错误/Ray ID，以及响应是否标为挑战。不会导出 Cookie、认证头、完整网址、证书路径、查询参数、令牌、页面 HTML 或本机资料路径。诊断不等同于 Cloudflare 的拒绝原因。

新增“系统浏览器对比”打开当前查询的正式官网地址，供同网络下比较结果。系统浏览器与应用会话分开，不会复制认证信息，外部查询不会自动加入库。若只有内嵌视图失败，应结合错误码和 Ray ID 联系网站方，并优先检查浏览器环境兼容性；若两处都失败，应同时排查网络和网站侧结果。

## 验证

`node --test tests/*.test.mjs`：31 项通过，包含截图调试会话成功/失败清理、沙盒弹窗策略、诊断隐私过滤、PAT/DNS 非致命分类、挑战等待不刷新、重复提交不导航、检查防重入及全部历史档案回归。第一次在受限临时目录运行发生文件 rename 权限错误；同套测试在允许的本机隔离目录权限下通过，没有因此放宽产品代码的数据完整性规则。

代码语法检查通过。原 ui/theme.css 与 ui/image-groups.css 未修改。尚未生成安装包，本次源码不能称为已部署到用户已安装版本。小米 15 的原生 WebView 未在本 Windows 源码中实现。

# PMG 采集兼容性方案短评

核查日期：2026-11-17。本文是架构评估，未安装扩展、未改应用、未做 Android 真机验证。用户报告：同一个 PMG 官网 URL 在普通 Chrome 中人工点击一次后通过，当前 PMG库内嵌窗口人工点击后循环；这说明应优先排查浏览器环境差异，但不能据此确定唯一原因。

**建议顺序：先做一次低成本的独立窗口对照；若仍循环，Windows 长期方案优先验证“正常 Chrome + 用户点按采集扩展 + PMGX 回流”。WebView2 先做小范围验证，不直接整套迁移。Android 保留真实 WebView 采集原型，并把 Custom Tabs 定位为正常浏览的备用入口。** 下列建议均为工程判断，不是官网提供的通过保证。

Cloudflare 官方将嵌入式浏览器、修改较多的浏览器列为有限支持环境；完整浏览器与 WebView 的挑战表现可以不同。其文档也提醒扩展、设备模拟、浏览器覆盖设置可能干扰验证。[Cloudflare 浏览器支持范围](https://developers.cloudflare.com/cloudflare-challenges/reference/supported-browsers/)

## 方案比较

| 方案 | 可以改善什么 | 采集能力与主要限制 | 相对成本 / 建议 |
| --- | --- | --- | --- |
| Electron 同引擎的独立标准窗口 | 隔离当前内嵌布局、焦点、后台状态、采集轮询等因素；与原采集窗口使用同一持久化 partition，可保留应用内会话。 | 引擎和嵌入式环境仍然是 Electron，不能承诺解决挑战；该会话也不是系统 Chrome 会话。验证期间不执行采集脚本、不轮询页面、不附加调试器；人工通过后再点“采集”。 | 低。适合作为诊断和回退体验，持续循环就停止反复微调。 |
| Windows WebView2 Evergreen | 由 Microsoft 持续维护、自动更新 WebView2 Runtime，减少自行捆绑过旧内核的问题。 | WebView2 仍是嵌入式控件，不等于完整 Edge 浏览器，不能继承“普通浏览器能通过”的结论。需要重新接入导航、下载、会话、文本解析、截图和存档桥。 | 中至高。先验证同一 URL 的人工通行和完整采集，再决定是否替换。 |
| 系统 Chrome + 可选的点按采集扩展 | 使用用户已经验证可用的正常浏览环境；平时不注入，用户完成挑战后才点采集。 | 文字、原图、MHTML 与截图可组合实现；整页截图及大文件回流需额外工程处理。Chrome 是独立窗口，不能作为普通 iframe 嵌入 PMG库。扩展本身也可能改变兼容性，需要实测。 | 中。最值得优先做最小原型的 Windows 长期候选。源码、权限和安装方式须先给用户审阅并另行批准。 |
| Android 真实 WebView | 可以由应用控制页面与采集流程，保持应用内体验。 | 需要符合 Cloudflare 的 WebView 基线，但不保证 PMG 的整页挑战接受该环境；截图、原图下载、网页存档需 Android 原生实现并真机验证。 | 中至高。先做小米 15 实机验证，不以桌面模拟代替。 |
| Android Custom Tabs | 使用用户首选浏览器的引擎和会话，减少自管内核、Cookie 与权限的维护。 | 宿主应用不能任意读取页面内容。单靠 Custom Tabs 没有 DOM 解析、原图批量导出、整页截图、MHTML 采集接口，不能声称达到现有采集功能。 | 低成本浏览入口；完整采集回流成本高，通常需要网站配合或用户手动导出。 |

同 partition 的会话语义见 [Electron Session](https://www.electronjs.org/docs/latest/api/session)。WebView2 的 Evergreen 更新与独立 Runtime 边界见 [Microsoft 分发说明](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution)。Custom Tabs 的浏览器会话见 [Chrome 官方概述](https://developer.chrome.com/docs/android/custom-tabs)，宿主不能检查页面内容的边界见 [Android 官方 SSO 说明](https://developer.android.com/work/guide#sso)。

## Chrome 采集扩展：能力和权限边界

建议初版只在用户点击扩展按钮时工作：`activeTab` + `scripting` 读取当前 PMG 结果页，`pageCapture` 保存网页。不要申请永久 `<all_urls>`、Cookie、历史记录、代理或全网页后台监听权限。网页挑战期间不采集。[activeTab 临时授权](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab)

| 数据 | 可行接口 / 实现 | 应明确保留的限制 |
| --- | --- | --- |
| 详情文字和来源 | 点按后用 `scripting.executeScript` 读取结果 DOM；沿用现有字段映射，同时保留原始 label/value、URL、采集时间。 | 若访问受限、页面未通过验证、字段解析失败，应明确显示失败，不从验证页制造“结果”。 |
| 详情原图 | 从官网详情链接、原图资源地址取得实际图像字节；记录 URL、MIME、像素大小、长度和 SHA-256。 | MHTML 内的图片可能只是页面实际加载的预览，不能把它等同原图。跨域 CDN 需要逐域的可选 host permission；获权后的网络请求由扩展侧执行，内容脚本仍受页面跨域规则约束。下载失败则标为缺失，不用缩略图冒充。[跨域请求规则](https://developer.chrome.com/docs/extensions/develop/concepts/network-requests) |
| 网页存档 | `chrome.pageCapture.saveAsMHTML({tabId})` 得到单文件网页存档，原字节收入 PMGX。 | 需要 `pageCapture` 权限；MHTML 回看只能从文件系统、在主框架打开，不能直接当 iframe 预览。PMGX 应另存截图，并为应用内阅读提供经过处理的静态展示，或导出 MHTML 后打开。[pageCapture](https://developer.chrome.com/docs/extensions/reference/api/pageCapture) |
| 整页截图 | 最小权限版用 `tabs.captureVisibleTab`，完成验证后滚动并拼接、恢复原滚动位置；记录尺寸和覆盖范围。 | 此 API 每次只截当前活动页可见区域，限每秒 2 次；固定元素、懒加载、动画、无限滚动会导致拼接瑕疵。无法可靠完成就标注“部分截图”。[tabs 截图 API](https://developer.chrome.com/docs/extensions/reference/api/tabs#method-captureVisibleTab) |
| 自动回到 PMG库 | 第一阶段导出 PMGX，让用户选择导入；第二阶段可选 Native Messaging 自动送入应用的待确认收件区。 | 文件导出/手动导入不需要 Native Messaging。自动通信需要安装一个本机 host，并增加 `nativeMessaging` 权限；须单独审阅与批准。 |

若以后要求更可靠的一次性整页截图，可另评估 `chrome.debugger` / CDP 截图。该权限可以执行远超截图的操作，不属于最小权限初版；须另行披露、批准，并只在验证完成后短时使用，不能用于操作或规避挑战。[Chrome debugger 权限与能力](https://developer.chrome.com/docs/extensions/reference/api/debugger)

Native Messaging 的 host manifest 只允许固定扩展 ID，Windows 需注册 host 路径；通信双方验证消息来源、证书编号、内容类型、归档路径及哈希。官方单条消息上限：host → Chrome **1 MB**，Chrome → host **64 MiB**；原图和大存档应分块传输并校验，不把全部资产塞入一条 JSON。无需转移或导出浏览器 Cookie、密码、验证码。[Chrome Native Messaging 协议](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging)

## Android 的最低验证基线

真实 Android WebView 使用受维护的系统 WebView 提供程序；声明 `INTERNET`，启用 `WebSettings.setJavaScriptEnabled(true)` 与 `setDomStorageEnabled(true)`，保持标准 Web API、会话内一致的 User Agent 和设备特征。正常允许 `challenges.cloudflare.com`、`about:blank`、`about:srcdoc` 所需加载；不拦截或改写挑战资源，不在验证期间做 DOM 轮询、模拟设备或脚本点击。[Cloudflare 移动 WebView 要求](https://developers.cloudflare.com/turnstile/get-started/mobile-implementation/)，[Android WebView 配置](https://developer.android.com/develop/ui/views/layout/webapps/webview)

这是通用最低配置，不是“设置后 PMG 必通过”的证明，也不要求为了验证去全局放开文件访问、混合内容或改变 Cookie 策略。实际 PMG 页面使用的是站点控制的保护策略，仍需在小米 15 的真实系统 WebView 上验证。

Custom Tabs 可共享正常浏览器会话，但无法把此会话直接交给另一个 WebView。其 `postMessage` 是需要页面配合的消息通道：应用先通过自己控制的 origin 的 Digital Asset Links 关系验证，目标页面还要实际收发消息；这不是任意注入脚本或读取 PMG DOM 的接口。当前没有 PMG 配合证据，不能据此承诺自动采集。[Chrome 官方 postMessage 流程](https://developer.chrome.com/docs/android/post-message-twa)

## 进入实施前的最小验收

每个候选都先做同 URL、同机器/网络、人工完成验证的对照，记录是否循环、能否正常导航和再次打开。通过以后才验收：原图字节与像素、详情 label/value、整页截图覆盖、MHTML 可离线打开、PMGX 导入后分组和来源不丢失。浏览器通行测试、采集完整性测试、跨设备导入测试分别记录，避免把“打开成功”写成“完整功能已验证”。

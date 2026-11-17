# v024 平台与样式核查

核查日期为 2026-11-17。本文件记录静态源码比较和官方 Android 文档结论。小米 15 真机外观、系统主题切换及官网采集尚待实机验收。

## Windows v023 与 v021 比较

比较目录分别为 `C:/Users/John/Documents/Codex/2026-11-17/pmg-review/versions/v023-window-preview` 和 `C:/Users/John/Documents/Codex/2026-11-10/pmg-image-groups/versions/v021-image-groups`。

| 文件 | 结果 | SHA-256 |
| --- | --- | --- |
| `ui/theme.css` | 逐字节一致 | `91db9769bda6fd4f922fe48f233d2e65a63425bf6161b1562d03c1b3c8db6e57` |
| `ui/image-groups.css` | 逐字节一致 | `3bf9318bd3f98d7209f78dc66dbed5ff68380e436444e52788e58474f9fc18b7` |
| `ui/image-groups.mjs` | 逐字节一致 | `354eee8a50e225be3df8ddd35ea673a9dacf48a0a2e83bbc5e7e424f6ddd324d` |

剥离 v023 新增的窗口壳 DOM、窗口壳 CSS 链接和 JS 脚本链接后，`index.html` 与 v021 完全相同。原内容节点的文本、类名、ID、内联样式均相同。v023 的 `ui/app.mjs` 只把页面切换后的滚动复位目标从 `window` 改成 `.window-content`。`ui/capture-workspace.mjs` 改为监听该内容容器滚动，并将原生官网视图顶部限定在窗口内的 32px 拖动区之下。

结论是内容的配色、字体、按钮和图片分组样式表保持原字节，窗口壳改变了几何布局和滚动。`ui/window-shell.css` 的确有作用于外层和侧栏的覆盖规则。

- `html`、`body` 高度设为 100%，背景变为透明，`body` 的溢出隐藏。
- `.window-shell` 使用 `var(--paper)`，当前解析为 `#f5f5f5`，并裁切外轮廓。
- `.window-content` 高度为窗口减 32px，滚动由此容器承接。相同外部窗口尺寸下，内容可见高度减少 32px。
- `.window-content .sidebar` 从 `position:fixed` 改为 `position:absolute`，顶部为 32px，底部为 0。小于 700px 时设为 `position:static`。
- 窗口按钮单独用 `#333` 图标、`#e6e6e6` 悬停背景，关闭按钮悬停为 `#e3d4d4` 与 `#8a2222`。这些选择器都限定在 `.window-buttons` 内。

因此不能把静态一致性称为整屏像素完全一致。原内容 CSS 相同，桌面内容起始位置、可见高度、侧栏定位和滚动容器有所调整。该核查没有修改 v023 或 v021 源码。

## Android 系统主题跟随

小米 15 可以采用 Android 的公开主题机制作为实现基线。根据官方 Android 对系统夜间标志、DayNight 和 WebView 主题联动的说明，这条实现路径无需调用小米专有 API。关于 HyperOS 的具体表现属于依照 Android API 的工程推断，后续仍需真机确认。[Android 深色主题](https://developer.android.com/develop/ui/views/theming/darktheme)

原生外壳可继承 `Theme.AppCompat.DayNight`，并采用 `AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM)`。也可读取 `resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK`，用 `Configuration.UI_MODE_NIGHT_YES` 判断当前模式。若自行接管 `uiMode` 配置变更，应在 `onConfigurationChanged` 更新界面。默认 Activity 重建也可以应用新主题。[AppCompatDelegate](https://developer.android.com/reference/androidx/appcompat/app/AppCompatDelegate#MODE_NIGHT_FOLLOW_SYSTEM)、[Android 深色主题](https://developer.android.com/develop/ui/views/theming/darktheme)

对于自己维护的网页界面，用 `@media (prefers-color-scheme: dark)` 定义深色语义颜色，并声明 `<meta name="color-scheme" content="light dark">`。需要即时处理时监听 `window.matchMedia('(prefers-color-scheme: dark)').change`。WebView 的 `prefers-color-scheme` 根据外壳主题的 `isLightTheme` 解析，因此 Android 外壳也必须正确切换主题。单独修改网页 CSS 而外壳一直固定浅色，可能导致跟随信号一直为浅色。[WebView 深色主题](https://developer.android.com/develop/ui/views/layout/webapps/dark-theme)

`targetSdkVersion=35` 时，`setForceDark()` 已弃用且无效果。使用 API 33+ 的 `WebSettings.setAlgorithmicDarkeningAllowed(false)`，可避免算法改色，同时保留网页作者定义的深色 CSS。默认值本来就是 false。若兼容不同 WebView 提供者，可检查 `WebViewFeature.ALGORITHMIC_DARKENING`，再通过 `WebSettingsCompat.setAlgorithmicDarkeningAllowed(settings, false)` 调用。应用主题中也应关闭 app-level Force Dark，采用 `android:forceDarkAllowed=false`。官方说明若系统正向 WebView 应用 Force Dark，它可能忽略算法开关。[WebSettings](https://developer.android.com/reference/android/webkit/WebSettings#setAlgorithmicDarkeningAllowed(boolean))、[WebSettingsCompat](https://developer.android.com/reference/androidx/webkit/WebSettingsCompat#setAlgorithmicDarkeningAllowed(android.webkit.WebSettings,boolean))

建议对库页和官网采集视图分别设置主题边界。库页由应用自己的 CSS 变量切换背景、文字、边线与绿色强调色，图片继续使用原始像素。官网 WebView 由官网自身 CSS 决定外观，关闭算法暗化。应用 CSS 不应通过滤镜反色原图，图片容器也不应使用 `filter:invert()`。官方原图和网页截图保持原始颜色。

预览验收可模拟 light/dark 媒体查询，并检查容器、文字、选中状态和图片像素。实际小米 15 验收还应切换系统深色模式并重开应用，检查状态栏、手势导航区、相册选择器、官网区域与库内图片。

## 本地 PMG 官网快照的字体与表单颜色

来源是此前保存的官网样式 `C:/Users/John/Documents/ChatGPT/PMG查询记录套件/outputs/web-assets/27535aa1a63791ad.css`，属于 2026-11-05 保存的离线证据。本节说明该快照内容，未重新核实当前官网。该 CSS 的中文字符串存在保存编码显示问题，英文字体名称和颜色值可直接读出。

- 正文字体栈以 `Arial, Helvetica, Tahoma, Verdana` 开始，随后是 Microsoft JhengHei、Microsoft YaHei、STXihei 和 sans-serif。
- `h1,h2` 使用 `Georgia,"Times New Roman",PMingLiU,SimSun,serif` 等衬线字体。`.hp-verify-cert-title h2` 为白色、`2rem`、无外边距。
- `.hp-verify-cert` 背景为 `#053d22`，表单 label 为白色加粗。
- `input,select,textarea` 的全局规则为文字 `#333`、边框 `1px solid #c1c1c1`、圆角 `6px`。
- `.certlookup-form select` 明确指定白色背景，并用嵌入的灰色箭头 SVG。桌面首页的输入、选择框高度为 `56px`，输入宽 `167px`、选择框宽 `192px`。
- 官网普通按钮和 primary 按钮背景为 `#d0d0cd`、文字 `#000`、圆角 `4px`、阴影 `0 2px 0 #92928b`。

v021 查询条沿用了这些字体族和主色，但已经做过尺寸与边框的项目内适配。例如 v021 的表单框宽 170px、边框 `#999`、文字黑色，label 显式采用标题字体。若新表单需要更贴近已保存官网，应采用上述官网规则，再单独做移动端布局。

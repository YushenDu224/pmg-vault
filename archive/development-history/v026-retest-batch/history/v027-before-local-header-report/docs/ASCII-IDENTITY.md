# v027：ASCII 内部应用标识单因素验证

本测试副本从已封存并通过 check 的 v025-browser-compat 完整复制 62 个文件，未复制旧 SEAL、node_modules、链接或用户资料。复制与单行修改步骤保存在测试批次根目录 copy-v027.mjs 和 reports/v027-copy-and-change.json。v025 永不修改。

唯一运行代码变化为 desktop/main.cjs 内部 app.setName 从中文 PMG库 改成 ASCII pmg-library。package version 仍为 0.18.1-preview.2，以控制版本变量。用户可见窗口标题、产品名称、全部主题样式、透明/无边框窗口、子视图、权限、轮询、数据路径与会话逻辑均未修改。

## 已确认的事实

用户报告同网址在普通 Chrome 手动点击一次即可通过，而 PMG 内嵌在人工操作后循环。三张全窗口截图显示应用中的 Cloudflare 画面，但单靠橙色图标不能推断验证成功或失败，截图本身也没有标明点击时刻与操作者。

离线零导航 harness（本批次 ua-probe/result.json）在 Electron 45.2.2 / Chromium 156.0.8078.80 中确认：内部名称为 PMG库 时，真实 getUserAgent 包含 PMG库/0.18.1-preview.2，带非 ASCII 字符；内部名称为 pmg-library 时，对应产品项仅含 ASCII。实验没有创建可见窗口、访问网站、附加调试器或修改 User-Agent 字符串。

Electron 45.2.2 的默认 User-Agent 生成逻辑会将非 Electron 应用的名称和版本加入产品项。RFC 9110 的 User-Agent 产品名称及版本采用 token 语法，允许字符不含中文。因此这是一个明确的产品标识兼容性问题候选，但离线实验不能证明 Cloudflare 拒绝的因果，也没有检验网络上实际收到的原始头字节。

- Electron 45.2.2 原始实现：https://raw.githubusercontent.com/electron/electron/v45.2.2/shell/common/application_info.cc
- RFC 9110 User-Agent：https://www.rfc-editor.org/rfc/rfc9110.html#section-10.1.5
- RFC 9110 token：https://www.rfc-editor.org/rfc/rfc9110.html#section-5.6.2

本修正没有伪装成 Chrome 或隐藏 Electron；真实 Chromium/Electron 产品标记完整保留。没有复制系统 Chrome Cookie、移除风控或自动操作验证码。

## 验证边界

本批次另有 ua-probe/source-config，直接读取 v027 的配置名称与版本，在零导航 WebContentsView 中确认该配置产生的默认 UA。它仅验证配置到默认 UA 的映射，不等于打包程序人工验证已通过。

接下来只测试此单因素副本，由用户手动完成验证，记录导航、点击、详情或挑战返回的时间及错误/Ray ID。暂停采集、改变透明窗口、放开权限或改其他会话设置都不得混入本轮。当前未封存，等待主任务实际启动、真实头观察及人工操作结果后再决定下一步。

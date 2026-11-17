# 2026-11-17 复测记录（持续更新的证据索引）

本记录使用 Asia/Shanghai 展示日期。所有浏览器资料目录仅用于本次公开样例测试，未读取私人藏品或 Chrome Cookie。

## 已确认的对照

- 用户确认：原内嵌窗口手动点击验证后仍循环；正常 Chrome 同地址点击一次通过。
- v025 全窗口关键帧确实包含 Cloudflare 原生子视图。旧的父 WebContents 截图会遗漏此层，不能用父窗口白块判空页。
- 旧版 120 秒原生窗口录像已完成；3、40、90 秒采样均为 PMG库与安全验证页。点击时刻未逐帧确认，人工操作依据用户报告。
- 发现内部 app.setName('PMG库') 会进入真实 User-Agent。离线和本机HTTP验证均确认中文UTF-8字节进入请求头；RFC9110的产品token要求ASCII。v027仅改内部名为pmg-library，中文UI、真实Electron/Chromium信息及其余运行文件保持原样。此事实本身不证明Cloudflare拒绝因果。

## v027 结果不能只写“已通过”

- 背景归档完成于 2026-11-17 07:55:02（UTC 23:55:02）。PMGX哈希校验成功，10个原始字段，2张3237×1740原图，静态网页、整页截图、MHTML齐全，无资源失败。
- 视频40秒仍有Cloudflare，55秒真实8077301-001详情，70、100秒为官网邮件订阅窗（不是Cloudflare）。抽样不能排除其他时刻的情况。
- 四帧应用外层一直“加载官网/等待结果”，没反映保存成功，用户仍感到循环。需要修复前后台状态同步，再检查可见结果与入库。
- 用户回复新副本仍像原来自动循环，已保留此观察，不能用后台saved否定。

## 证据

- frames.json：首轮屏幕关键帧时间；frames/app-04-confirmed-loop.png 与 frames/v027-success.png 可能受到透明窗口被遮挡时的捕获限制，包含Codex画面，不能作为PMG状态证据，不应展示为查询成功截图。
- recording/pmg-app.webm：旧版完整窗口录像；reports/video-check/inspection.md：离线采样核查。
- recording-v027/pmg-app.webm：只修内部标识的窗口录像；reports/video-check-v027/inspection.md：采集前后采样。
- reports/v027-captured-page.png：归档中真实官网详情截图；reports/v027-success.json：资源与字段完整性。
- ua-probe/result.json、ua-probe-local-http/result.json：默认标识及实际本机请求头证据。
- build-tools/v027-windows-dir-verification.json：打包运行文件唯一差异核查。

## 当前下一步

创建独立v028源码副本，保留v027完整副本。仅修本机界面状态读取与回显，不改官网验证脚本、Cookie、网络或浏览器身份。加入受限阶段日志，以区别事件未收到、已收到未应用、归档入库失败和窗口未刷新。完成后重录并核对成功状态、入库卡片及原图资源。

# v028：采集结果与本地库状态同步

此副本由封存并校验通过的 v027-ascii-identity（63个文件）完整复制。复制脚本为测试批次根目录 copy-v028.mjs，复制记录为 reports/v028-copy.json。v025及v027封存源码均不修改。

## 依据与边界

v027录像在55秒显示真实官网详情，70/100秒为PMG自己的邮件订阅窗；对应后台档案已经保存成功，包含10条原始字段、2张原图与网页资源。但可见应用外层始终显示加载/等待。这证明本次存在用户可见的前后台反馈不一致，尚不能唯一确定是推送丢失、渲染节流或异步覆盖。官网订阅弹窗不等于再次Cloudflare验证，其他时间的人工循环报告仍需单独核对。

本批只修改应用自己的状态接收、入库反馈与日志；不修改官网验证、Cookie、UA、采集器、站点解析、窗口形状或颜色。内部标识继续为pmg-library，package版本仍0.18.1-preview.2作对照。

## 修改

- 父BrowserWindow也关闭backgroundThrottling，使官网原生子视图处于前景时应用自身可以继续处理和绘制状态。官网子视图原设置不变。
- push、start返回值及本机getState读取统一进入同一个UI同步模块。每次主动查询使用新的本地generation，状态按查询身份与updatedAt过滤迟到响应；同次查询的saved不会被迟到loading/failed或start调用异常倒退覆盖。
- 每两秒仅在查询活动或已保存但尚未确认入库时读取本机IPC状态，不访问官网。单次查询的读取不并发；慢旧请求不会堵住新查询或清空其轮询锁。确认入库后停止补偿读取，明确入库失败也停止自动重试，等待“重试入库”。
- 文件保存与库事务完成分别反馈。读取或入库失败显示“文件已存，入库未完成”，不会把只有PMGX落盘称为已加入库。手动重试使用已保存档案，不必重新验证官网。
- 同一archiveId的入库过程单飞，成功后才记为完成；重复push/poll不重复写入。旧查询的入库可以完成保存，但不会覆盖当前查询的可见结果。localStorage标记只在accept成功后写；标记自身失败不否定已提交的库事务。
- 诊断只回传白名单stage、state、stamp、visibility、source及主进程接收时间。没有档案ID、证书字段、页面、URL、Cookie或错误原文。日志位于独立资料目录runtime/ui-state-events.jsonl，单文件默认256KiB，最多另保留一个同上限前文件。

## 怎样读本轮日志

source区分push、start-return、poll、initial、retry与自身UI路径。stage received表示收到候选，applied表示已调用应用界面更新，ignored表示过期或查询不符，imported表示本地库事务已完成，error表示处理或入库发生问题。相同状态可去重，因此每个received不一定对应新的applied。

若push缺失但poll收到了saved并完成imported，说明补偿读取起效；若applied已出现但录像界面没变化，应继续查绘制/窗口归属；若saved已收到但后续error且没有imported，应先查本地档案读取或入库。日志不包含错误原文，具体失败反馈在应用界面呈现。不能用一条saved日志推断官网以后是否又挑战。

## 验证

41项测试全部通过：31项历史回归与10项行为/日志测试。新增测试覆盖existing saved直接作为start返回、迟到loading/failed/start异常、慢getState跨查询、轮询锁归属、导入单飞与去重、失败手动重试、旧导入不得覆写新查询、销毁清理、显式重新采集以及诊断隐私和体积上限。语法检查通过，原theme.css与image-groups.css字节保持一致。

主任务还完成了真实UI离线集成：使用当前index/module/preload与真实公开PMGX档案，刻意不发送pmg:state推送，后台状态在IPC约500ms后变为saved。仅凭两次getState，约2.35秒后外层显示已完整保存，库中出现1张卡片及2张预览，说明从读取状态到实际入库和可见反馈的闭环能够在无推送条件下完成。详见 reports/v028-offline-ui-integration.json。此测试没有官网网络请求，不代替正式网页和用户人工验证。

运行包、实际网页与录像复核由主任务另外记录；本源暂不封存，待实测后再记录结果与生成新SEAL。

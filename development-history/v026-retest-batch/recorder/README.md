# PMG 单窗口原生录像工具

此工具是独立 Electron 进程，只捕获名称精确为“PMG库 · 钞票档案”的一个原生窗口合成视频。枚举时只请求 window 类型，关闭缩略图和图标获取。同名结果不等于一个就拒绝开始，绝不回退到整个显示器。

本次用户已经明确授权录屏。工具使用正式 Electron `desktopCapturer.getSources` 和 `Session.setDisplayMediaRequestHandler` 指定这个窗口，再由自己的隔离渲染进程调用 `getDisplayMedia`、`MediaRecorder` 编码。该进程不打开 DevTools、不附加 CDP，也不读取或注入受测 PMG 应用 DOM。[Electron desktopCapturer](https://www.electronjs.org/docs/latest/api/desktop-capturer)、[Electron Session](https://www.electronjs.org/docs/latest/api/session#sessetdisplaymediarequesthandlerhandler-opts)

## 启动与停止

由主控运行 `recorder/start.ps1`，它返回独立录像进程 PID。它只使用现有 Electron 45.2.2 运行时。该脚本尚未执行，录像工具仅通过 JavaScript 静态语法检查。

开始成功会在 `recorder/stdout.log` 写入 `RECORDING_STARTED`。录制输出是 `recording/pmg-app.webm`，每秒一个数据块写入临时 `.part` 文件，结束后改为最终文件。`recording/recording-metadata.json` 记录请求窗口名、实际源名和 ID、开始结束时间、视频尺寸、音轨数量和停止原因。录像不含音频。

创建 `recording/stop-recording.flag` 即可停止。开始录制后最多运行 120 秒。已有输出、旧 stop flag 或已有 metadata 时拒绝启动，先由主控检查再使用新的记录目录，避免覆盖证据。

如果正常 API 因窗口焦点、用户手势、系统权限或系统来源选择要求而拒绝，工具记录错误并退出。此时应把需要的系统授权或选择交给用户，不能改用旧版捕获接口、伪造手势、调整安全开关或忽略系统提示。启动等待上限为 20 秒。当前未实机执行，不能宣称已经生成录像。

只有自己的本地隔离渲染页可调用固定的录像 IPC，网络请求被拒绝。`nodeIntegration` 关闭、`contextIsolation` 和 sandbox 开启。[Electron 安全指南](https://www.electronjs.org/docs/latest/tutorial/security)

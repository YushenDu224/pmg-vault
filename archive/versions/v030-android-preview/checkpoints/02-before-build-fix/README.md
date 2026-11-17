# PMG库 Android 离线预览 0.1.0-preview.1

这是可安装的界面与交互预览，基于已封存的 v025。它不是已完成的官网采集应用。

## 可体验

- 使用唯一公开证书 8077301-001 的四种排版样例，搜索、筛选及查看详情。
- 从系统文件选择器选择本机 JPG、PNG、WebP 正反面图片，填写来源名称、HTTPS/HTTP 来源记录、备注，编辑图片组并选择展示组。
- 跟随系统/浅色/深色；图片保持原色。真实状态栏、导航栏和键盘由 Android 管理。
- 样例查询与流程演示、样例回收站与恢复。
- 通过系统“另存为”导出界面设置 JSON，包含来源与图片组选择；不包含图片，不是藏品备份。

## 明确范围

上传图片和编辑内容仅保留在本次 WebView 内存中。退出、重载或进程被系统回收后会丢失，原始图片不会被修改。

官网实时查询、验证码处理、自动采集、网页快照、PMGX/整库 ZIP 导入导出、原图另存尚未接入。相关入口会明确说明，未伪造成功。中国/全球选项展示样例流程，不访问真实官网。APK 不声明联网或广泛存储权限；HTTPS 来源链接通过系统浏览器打开。

## 安装

最低 Android 8/API26，target35；建议使用更新过的 Android System WebView。安装 `PMG-Library-Android-0.1.0-preview.1.apk`，系统可能要求允许当前文件管理器安装应用。

包名 `io.github.yushendu224.pmglibrary.preview`，应用名“PMG库 · 预览”，与将来的正式版独立。使用项目专用测试证书签名，不是应用商店发行签名。未在小米15或其他真机安装测试。

## 源码与回档

- `source-ui/`：v025 原始网页源码及官方公开样例资产，字节保持原样。
- `checkpoints/01-original-web/`：原始网页修改前副本。
- `app/src/main/assets/web/`：Android 适配后的网页。
- `app/src/main/java/`：系统文件选择、主题、安全区、受限设置导出宿主。
- `private/`：本地项目测试密钥与密码；被 Git 排除，不能上传。

下一批修改先复制完整本版本到新版本；不要修改封存的 v025，也不要覆盖私人藏品。

## 构建与验证

`pwsh -File scripts/build.ps1` 使用已有 JDK17/Gradle8.9/SDK35/BuildTools34、离线缓存 AGP8.7.3。参数 `-ToolRoot` 可指定工具目录，`-StandardJavac` 使用 Gradle 常规 Java 编译。首次运行会为本项目生成独立测试密钥，不复制其他项目的密钥。

脚本保留直接 javac 兼容路径，用于本机既有 SDK JAR 权限问题；普通开发环境可用 Android Studio 与常规 Gradle。依赖版本固定，首次在新电脑构建需下载工具和 AGP 缓存。

签名、ZIP 对齐、包名/SDK、Android Lint 的实际结果见 `docs/verification/`。静态构建通过不代表系统选择器、键盘、安全区或真机交互已验收。

## 宿主边界

固定 HTTPS 资产域仅返回明确白名单中的打包文件，未知请求拒绝；没有 `addJavascriptInterface`。JSON 导出由固定自定义动作触发，原生仅调用固定的 `pmgExportSettingsJSON()`，校验结构后让用户选保存位置。没有任意文件路径/URL读取接口。系统选图返回后校验 content URI、MIME 和图片解码头。

# PMG库 · 仓库整理源码副本 v031

应用版本保持 Windows 0.18.0。本副本从已核验的 v021 完整复制后修改，仅整理开发入口和构建路径；界面、采集逻辑、档案读写与图片组功能沿用 v021。

运行：安装 pnpm-lock.yaml 锁定依赖，执行 npm start。npm test 运行 26 项回归；npm run check 按 SOURCE-MANIFEST.json 核对 39 个当前源码/样例文件，不递归扫描 Git、历史、Android 或构建产物。安装包输出目录改为本项目下 dist/windows；旧版目录缓存回退移除，仍支持 PMG_ELECTRON_DIST。

旧网页 server/launch 启动器、外部样例重建工具及其未使用的服务模块从当前入口撤出；全部原代码在 v021 封存副本保留。现成 examples/sample.pmgx 随源码提供。此副本 docs 中继承的初始规划属于历史基线，当前功能状态以仓库 docs/status.md 为准。

本次没有升级安装程序、改变资料目录或修改用户藏品。Cloudflare 兼容性修正仍在独立测试方向，不能把本次目录整理称为该问题修复。SEAL.json 覆盖此目录完整副本；SOURCE-MANIFEST.json 仅覆盖可同步到仓库根目录的 Windows 源文件。

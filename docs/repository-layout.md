# 仓库结构与开发方式

本次 v031 整理将当前源码入口与历史完整副本分开管理。Windows 主入口继续使用已经存在的 `desktop`、`ui`、`lib` 结构，保留 Electron 的相对导入关系；没有为了外观增加一层 `src`。

```text
pmg-vault/
├── README.md                   首页、下载与快速开始
├── CONTRIBUTING.md             开发、审阅与完整副本规则
├── AGENTS.md                   项目执行规则
├── package.json                当前 Windows 0.18.0
├── pnpm-lock.yaml              锁定依赖
├── electron-builder.cjs        Windows 构建设置
├── index.html                  Electron 加载的页面入口
├── desktop/                    桌面宿主和采集
├── ui/                         界面
├── lib/                        模型、档案、存储、解析
├── assets/                     程序资产
├── build/                      图标、NSIS 等安装资源源码
├── examples/                   已核实的公开开发样例
├── tests/                      当前功能测试
├── scripts/                    当前开发与构建脚本
├── apps/
│   └── android/                v030 Android 离线预览源码
├── docs/
│   ├── status.md               当前版本与能力边界
│   ├── repository-layout.md    本说明
│   └── history/                旧根文档及历史说明
├── tools/                      仓库检查与维护工具
│   └── check-archive.mjs       归档封存校验
└── archive/
    ├── README.md               归档入口
    ├── versions/               完整源码版本副本
    ├── development-history/    评审、修改前副本及旧工具
    ├── source-packages/         历史源码 ZIP
    └── metadata/               历史清单、核验和迁移依据
```

`build/` 保存打包需要的资源源码；`dist/windows`、`dist/android` 是本地生成的安装产物，不是源目录。依赖目录、Android 本地配置和签名私钥均不提交。

## 主线、测试线和版本

- `main`：当前 Windows 0.18.0，源于 v021；v031 只整理仓库和对应开发工具，没有升级软件功能。
- `apps/android`：来源 v030、应用版本 `0.1.0-preview.1`，仍为离线交互预览。
- `codex/windows-preview`：后续 Windows v029/`0.18.2-preview.1` 测试线，完整真人验证流程待验收。
- `archive/versions`：原完整版本目录继续保留。v017 为已废除的第一版图片组 UI，v018 为第二版预览，v022 为已废除的整体 UI 实验。

源码批次号和软件版本号是两套标识。v024 是网页评审批次，v026 是重测批次，不是遗漏的正式应用发行号。

## 路径变化与历史链接

旧根目录 `versions/` 移至 `archive/versions/`，`development-history/` 移至 `archive/development-history/`。历史源码 ZIP、旧版审计 JSON 和旧根文档分别归入归档或文档历史区。当前文档索引使用新路径。

封存副本内部保持原字节，移动目录不等于重写历史文件。原封存说明、测试工具或审计 JSON 可能仍包含当时的路径，这些内容作为历史依据保留；它们不能被当作本次整理后的当前文件清单。

已有标签和 Releases 不移动。旧标签所指向的目录结构仍可以浏览和下载；指向默认分支旧路径的外部链接可能失效，可切换到对应旧标签或按新归档路径查找。Git 提交历史继续保留目录移动前后的记录。

Windows 当前入口使用 `npm start`。历史网页启动器、静态服务器和样例构建脚本只在归档中保留，不作为新的快速开始步骤。

## 教程依据

以下是本次查阅的官方教程；据此选择适合本项目的组织方式，没有所有项目都必须采用的统一目录模板。

1. [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow)：通过独立分支、清晰提交和 PR 审阅管理改动。
2. [GitHub README 指南](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)：让访问者找到用途、开始方式和维护说明，根目录 README 可自动展示。
3. [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)：用标签固定发布节点，提供安装附件与发布说明。
4. [Pro Git：标签](https://git-scm.com/book/en/v2/Git-Basics-Tagging)：标记重要历史节点和软件发布。
5. [Pro Git：提交历史](https://git-scm.com/book/en/v2/Git-Basics-Viewing-the-Commit-History)：追踪和查找修改记录。

完整副本保留是本项目的额外回档约定；Git 的提交与标签同时使用。规则和操作顺序见 [CONTRIBUTING](../CONTRIBUTING.md)，归档检查使用 `node tools/check-archive.mjs`。


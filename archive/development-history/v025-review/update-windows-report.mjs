import fs from 'node:fs/promises';
async function replace(file,before,after){const text=await fs.readFile(file,'utf8');if(!text.includes(before))throw Error('Missing edit point '+file);await fs.writeFile(file,text.replace(before,after));}
await replace('docs/BROWSER-COMPAT.md','本次没有复现用户描述的全球站反复验证。主任务的正常导航检查使用 Electron 45.2.2 / Chrome 156.0.8078.80，没有附加调试器、修改 UA、模拟设备或点击验证。全球站公开证书页面约 14.4 秒后出现 10 个详情字段；中国站一次访问返回 ERR_CONNECTION_CLOSED。原始诊断在评审目录 diagnostics/initial-navigation.json。这只能说明此次访问结果，不能证明所有网络、设备或既有会话均无问题。',`本次取得了两类不同结果，必须分别解释。无法据此确认唯一根因，也不能宣称程序的全球查询或人工验证已经通过。

- 独立正常网页视图探测使用 Electron 45.2.2 / Chrome 156.0.8078.80，没有附加调试器、修改 UA、模拟设备或点击验证。第一次全球站公开证书页面约 14.4 秒后出现 10 个详情字段；中国站一次访问返回 ERR_CONNECTION_CLOSED，详见评审目录 diagnostics/initial-navigation.json。随后使用独立且唯一的会话再测全球站，约 13.2 秒自动经历 403、挑战加载、200，最终返回 10 个详情字段，详见 diagnostics/isolated-global-navigation.json。它表明该次独立网页视图能够自动到达详情，不等于完整应用已通过验证。
- 实际启动修改后的 Windows 源码程序，在隔离资料目录、无调试器、原始 UA 和真实桌面视口条件下，主界面正常启动，新诊断/系统浏览器按钮存在；JavaScript 已启用，持久会话为真，调试器未附加。程序在约 110 秒观察期间停留 needs-user（需要手动验证）。本次未点击验证码，因此既不能确认人工验证后是否仍循环，也不能证明人工验证已经解决。详见 diagnostics/windows-runtime-qa.json。

两种测试的会话、页面上下文与采集流程不同；本次观测尚不能将差异唯一归因于内嵌浏览器、程序设计、网络或网站检测。后续应由用户手动完成一次验证，再用“保存诊断”和“系统浏览器对比”记录同一网络下结果。`);
await replace('docs/BROWSER-COMPAT.md','代码语法检查通过。原 ui/theme.css 与 ui/image-groups.css 未修改。尚未生成安装包，本次源码不能称为已部署到用户已安装版本。小米 15 的原生 WebView 未在本 Windows 源码中实现。',`代码语法检查通过。原 ui/theme.css 与 ui/image-groups.css 未修改。实际源码启动检查结果如上，未执行验证码人工操作，未验证验证后的完整采集往返。

已生成 Windows x64 安装包 dist/PMG-Library-0.18.1-preview.2-Setup-x64.exe；打包后的 28 个运行文件与当前源码逐字节核对一致。安装包未签名、尚未安装，不能称为已升级用户已安装版本。小米 15 的原生 WebView 未在本 Windows 源码中实现。`);
await replace('README.md','31 项回归测试通过。全球站重复验证本次没有复现；修正的是明确代码风险，不能宣称已让所有验证码通过。此处仅为源码预览，未升级已安装软件，也未生成新安装包。','31 项回归测试通过。独立网页视图两次自动到达全球站详情；实际源码程序观察约 110 秒停在需要手动验证，本次未点击验证码，因此无法确认或排除人工验证后的循环，不能宣称已解决唯一根因。已生成 PMG-Library-0.18.1-preview.2-Setup-x64.exe，28 个运行文件与源码一致；安装包未签名、尚未安装，未升级已安装软件。');

import { request } from '../publishing-tools-v001/github-client.mjs';
import fs from 'node:fs/promises';
const report = new URL('../reports/layout-pr.json', import.meta.url);
const sha = '3617723d28caab9f79e0c822b6a5d26bc2c8294f';
if (process.argv.includes('--merge')) {
  const pr = JSON.parse(await fs.readFile(report, 'utf8'));
  const result = await request(`/pulls/${pr.number}/merge`, { method: 'PUT', json: { sha, merge_method: 'merge',
    commit_title: 'Merge repository organization and preserve all source snapshots',
    commit_message: 'Validated current Windows entry, Android source copies, immutable history, development docs and output boundaries.' } });
  if (!result.merged) throw new Error(result.message || 'Pull request was not merged.');
  await fs.writeFile(new URL('../reports/layout-merge.json', import.meta.url), JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ ...result, url: pr.url }));
} else {
  const pr = await request('/pulls', { method: 'POST', json: {
    base: 'main', head: 'codex/repository-layout', title: '整理仓库：当前代码作为根入口，完整旧版统一归档', draft: false,
    body: '当前仓库首页只有版本归档，开发者需要先定位源目录。此改动让 main 直接提供 Windows 0.18.0 的开发与构建入口，Android 离线预览位于 apps/android；所有旧版、修改前副本、历史工具和早期 ZIP 保留在 archive。\n\n保留原有应用配色、功能逻辑、用户资料位置、发布标签及安装包；未执行安装或资料迁移。v031/v032 是分别为主线和 Windows 测试线整理入口的完整新副本。后续 Windows 功能仍是测试版，尚未完成完整真人验证；Android 仍非全功能应用。\n\n验证：Windows 26 项回归通过，39 项当前源码完整性通过；30 份归档及 86 个 Android 源文件封存通过；迁移前 1847 个文件原字节全部保留；实际 Windows 目录打包成功，25 个运行文件核对通过且未包含归档或 Android；22 个主文档本地链接通过。预览副本 41 项回归通过。\n\n依据 GitHub Flow、README、Releases 与 Pro Git 官方教程，详见 docs/repository-layout.md。' } });
  const result = { number: pr.number, url: pr.html_url, head: pr.head.sha, base: pr.base.sha };
  if (result.head !== sha) throw new Error('Unexpected PR head.');
  await fs.writeFile(report, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
}

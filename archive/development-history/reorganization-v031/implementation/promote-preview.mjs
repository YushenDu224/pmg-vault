import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const repo = path.join(path.resolve(import.meta.dirname, '..'), 'repository');
const branch = execFileSync('git', ['-C', repo, 'branch', '--show-current'], { encoding: 'utf8' }).trim();
if (branch !== 'codex/windows-preview') throw new Error('Only the dedicated preview branch may be changed.');
const candidate = path.join(repo, 'archive/versions/v032-windows-preview-layout');
const manifest = JSON.parse(await fs.readFile(path.join(candidate, 'SOURCE-MANIFEST.json'), 'utf8'));
for (const item of manifest.files) {
  const from = path.resolve(candidate, item.path), to = path.resolve(repo, item.path);
  if (!from.startsWith(candidate + path.sep) || !to.startsWith(repo + path.sep)) throw new Error('Invalid source path.');
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.copyFile(from, to);
}
await fs.copyFile(path.join(candidate, 'SOURCE-MANIFEST.json'), path.join(repo, 'SOURCE-MANIFEST.json'));
const readme = path.join(repo, 'README.md');
const original = await fs.readFile(readme, 'utf8');
await fs.writeFile(readme, original.replace('# PMG库', '# PMG库 · Windows 测试分支\n\n**当前分支 `codex/windows-preview` 的根目录运行 Windows 0.18.2-preview.1，源自 v029，经 v032 整理入口。** 41 项回归通过，完整官网真人验证仍待验收。当前安装版与默认主线维持 0.18.0；[返回主线](https://github.com/YushenDu224/pmg-vault/tree/main)。下面的主线说明用于版本对照。'));
console.log('Dedicated Windows preview root now uses v032 / 0.18.2-preview.1; main is unchanged.');

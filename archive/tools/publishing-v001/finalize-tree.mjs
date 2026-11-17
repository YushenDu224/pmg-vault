import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname, '..'), repo = path.join(root, 'repository');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
async function copyFile(from, to) {
  const bytes = await fs.readFile(from); let existing;
  try { existing = await fs.readFile(to); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  if (existing && hash(existing) !== hash(bytes)) throw new Error(`Different destination exists: ${to}`);
  if (!existing) { await fs.mkdir(path.dirname(to), { recursive: true }); await fs.writeFile(to, bytes, { flag: 'wx' }); }
}
async function walk(directory, relative = '') {
  const output = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error(`Symlink excluded: ${directory}/${entry.name}`);
    const rel = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) output.push(...await walk(path.join(directory, entry.name), rel));
    else output.push(rel);
  }
  return output;
}
const android = path.join(root, 'versions/v030-android-preview');
const sealName = 'SOURCE-SEAL.json';
const seal = JSON.parse(await fs.readFile(path.join(android, sealName), 'utf8'));
const records = Array.isArray(seal.files) ? seal.files : Object.entries(seal.files).map(([p, x]) => ({ path: p, ...(typeof x === 'string' ? { sha256: x } : x) }));
const forbidden = /(^|\/)(private|\.gradle|\.git|node_modules|app-session[^/]*|[^/]*profile[^/]*|recording[^/]*)(\/|$)|\.(jks|keystore|p12)$|(^|\/)local\.properties$/i;
for (const item of records) {
  const rel = item.path;
  if (!rel || path.isAbsolute(rel) || rel.includes('..') || forbidden.test(rel)) throw new Error(`Invalid Android sealed path: ${rel}`);
  const bytes = await fs.readFile(path.join(android, rel));
  if (hash(bytes) !== item.sha256) throw new Error(`Android seal mismatch: ${rel}`);
  await copyFile(path.join(android, rel), path.join(repo, 'versions/v030-android-preview', rel));
}
await copyFile(path.join(android, sealName), path.join(repo, 'versions/v030-android-preview', sealName));
for (const name of await walk(path.join(root, 'publishing-tools-v001'))) await copyFile(path.join(root, 'publishing-tools-v001', name), path.join(repo, 'tools/publishing-v001', name));
for (const name of await walk(path.join(root, 'publishing-tools-checkpoints'))) await copyFile(path.join(root, 'publishing-tools-checkpoints', name), path.join(repo, 'tools/publishing-checkpoints', name));
await fs.mkdir(path.join(repo, 'docs/verification'), { recursive: true });
for (const name of ['windows-package-verification.json', 'windows-source-integrity.json']) await copyFile(path.join(root, 'reports', name), path.join(repo, 'docs/verification', name));
const all = (await walk(repo)).filter(p => !p.startsWith('.git/')).sort();
const pathIssues = all.filter(p => forbidden.test(p));
if (pathIssues.length) throw new Error(`Excluded private paths in publication: ${pathIssues.join(', ')}`);
const credentialShape = /(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/;
const secretIssues = [];
for (const rel of all.filter(p => /\.(md|json|html|xml|js|mjs|cjs|ps1|yml|yaml|properties|gradle|java|txt|css)$/.test(p))) {
  if (credentialShape.test(await fs.readFile(path.join(repo, rel), 'utf8'))) secretIssues.push(rel);
}
if (secretIssues.length) throw new Error(`Credential-shaped content found in: ${secretIssues.join(', ')}`);
const stage = spawnSync('git', ['-C', repo, 'add', '-A'], { encoding: 'utf8', windowsHide: true });
if (stage.status !== 0) throw new Error(stage.stderr);
// The audited history owns these public fixtures and installer source assets.
const review = JSON.parse(await fs.readFile(path.join(root, 'reports/repository-review-v001.json'), 'utf8'));
for (const rel of review.sourceFilesIgnoredByGit) {
  const result = spawnSync('git', ['-C', repo, 'add', '-f', '--', rel], { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error(result.stderr);
}
const tracked = spawnSync('git', ['-C', repo, 'ls-files', '-z'], { encoding: 'utf8', windowsHide: true });
if (tracked.status !== 0) throw new Error(tracked.stderr);
const indexed = new Set(tracked.stdout.split('\0').filter(Boolean));
const missing = all.filter(p => !indexed.has(p));
if (missing.length) throw new Error(`Source files missing from Git index: ${missing.join(', ')}`);
const manifest = { generatedAt: new Date().toISOString(), sourceFilesInIndex: indexed.size,
  completeApplicationDirectories: (await fs.readdir(path.join(repo, 'versions'), { withFileTypes: true })).filter(e => e.isDirectory()).length,
  installedWindows: '0.18.0', windowsPreview: '0.18.2-preview.1', androidPreview: '0.1.0-preview.1',
  androidSealedFiles: records.length, windowsHistoricalSealsVerified: 27,
  ignoredAuditedFilesIncluded: review.sourceFilesIgnoredByGit.length, pathIssues: [], credentialIssues: [], missingIndexedFiles: [],
  boundaries: { cloudflareFullLiveAcceptance: false, androidDeviceTested: false, androidFullFeatureParity: false },
};
await fs.writeFile(path.join(root, 'reports/publication-tree-verification.json'), JSON.stringify(manifest, null, 2));
await fs.writeFile(path.join(repo, 'docs/verification/publication-tree-verification.json'), JSON.stringify(manifest, null, 2));
const stageReport = spawnSync('git', ['-C', repo, 'add', '--', 'docs/verification/publication-tree-verification.json'], { encoding: 'utf8', windowsHide: true });
if (stageReport.status !== 0) throw new Error(stageReport.stderr);
console.log(JSON.stringify(manifest, null, 2));

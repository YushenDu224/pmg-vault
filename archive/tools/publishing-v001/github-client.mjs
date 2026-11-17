import { spawnSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

// The existing Git Credential Manager supplies authentication in memory only.
// Never print, persist, or put a token in a command-line argument.
let credential;
function authorization() {
  if (!credential) {
    const result = spawnSync('git', ['credential', 'fill'], {
      input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf8',
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never' },
      windowsHide: true,
    });
    if (result.status !== 0) throw new Error('Existing GitHub login is unavailable; no credentials were logged.');
    const entries = Object.fromEntries(result.stdout.trim().split(/\r?\n/).map(line => {
      const i = line.indexOf('='); return [line.slice(0, i), line.slice(i + 1)];
    }));
    if (!entries.password) throw new Error('GitHub credential helper returned no token.');
    credential = entries.password;
  }
  return `Bearer ${credential}`;
}

export const repository = 'YushenDu224/pmg-vault';
export async function request(urlOrPath, { method = 'GET', json, file } = {}) {
  const url = new URL(urlOrPath.startsWith('https://') ? urlOrPath : `https://api.github.com/repos/${repository}${urlOrPath}`);
  if (!['api.github.com', 'uploads.github.com'].includes(url.hostname) || url.protocol !== 'https:') throw new Error('Unexpected GitHub API destination.');
  const headers = {
    Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'pmg-library-release-tools', Authorization: authorization(),
  };
  let body;
  if (json !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(json); }
  if (file) { headers['Content-Type'] = 'application/octet-stream'; headers['Content-Length'] = String((await stat(file)).size); body = createReadStream(file); }
  const response = await fetch(url, { method, headers, body, ...(file ? { duplex: 'half' } : {}), redirect: 'error' });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(`GitHub ${method} ${url.pathname}: ${response.status} ${result.message || ''}`); error.status = response.status; throw error; }
  return result;
}

export async function sha256(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

export function releaseSummary(release) {
  return { id: release.id, tag: release.tag_name, name: release.name, url: release.html_url,
    target: release.target_commitish, draft: release.draft, prerelease: release.prerelease,
    assets: (release.assets || []).map(a => ({ id: a.id, name: a.name, size: a.size, digest: a.digest, state: a.state, url: a.browser_download_url })) };
}

export async function uploadAsset(release, file) {
  const name = path.basename(file), size = (await stat(file)).size, digest = `sha256:${await sha256(file)}`;
  const current = await request(`/releases/${release.id}/assets?per_page=100`);
  const existing = current.find(a => a.name === name);
  if (existing) {
    if (existing.size === size && existing.digest === digest && existing.state === 'uploaded') return existing;
    throw new Error(`Refusing to replace an existing different release asset: ${name}`);
  }
  const url = new URL(release.upload_url.replace(/\{.*\}$/, '')); url.searchParams.set('name', name);
  const asset = await request(url.href, { method: 'POST', file });
  if (asset.size !== size || (asset.digest && asset.digest !== digest)) throw new Error(`Uploaded asset verification failed: ${name}`);
  return asset;
}

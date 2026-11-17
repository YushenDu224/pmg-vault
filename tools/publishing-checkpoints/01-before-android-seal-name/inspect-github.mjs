import { request, releaseSummary } from './github-client.mjs';
import { writeFile } from 'node:fs/promises';
const repo = await request('');
const releases = await request('/releases?per_page=100');
const output = { repository: repo.full_name, private: repo.private, defaultBranch: repo.default_branch,
  permissions: repo.permissions, releases: releases.map(releaseSummary) };
await writeFile(new URL('../reports/remote-before.json', import.meta.url), JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

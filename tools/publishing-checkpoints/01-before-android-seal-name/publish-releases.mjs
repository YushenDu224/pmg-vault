import { readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { request, uploadAsset, releaseSummary, sha256 } from './github-client.mjs';

// Usage: node publishing-tools-v001/publish-releases.mjs release-plan.json
// A release remains a draft until all local assets have been verified remotely.
const planPath = path.resolve(process.argv[2] || 'release-plan.json');
const plan = JSON.parse(await readFile(planPath, 'utf8'));
if (!/^[0-9a-f]{40}$/.test(plan.commit)) throw new Error('Plan must identify an exact pushed commit.');
const output = { commit: plan.commit, releases: [] };
for (const item of plan.releases) {
  const assets = await Promise.all(item.assets.map(async file => ({ file: path.resolve(path.dirname(planPath), file),
    name: path.basename(file), size: (await stat(path.resolve(path.dirname(planPath), file))).size,
    sha256: await sha256(path.resolve(path.dirname(planPath), file)) })));
  let releases = await request('/releases?per_page=100');
  let release = releases.find(r => r.tag_name === item.tag);
  if (!release) {
    release = await request('/releases', { method: 'POST', json: { tag_name: item.tag,
      target_commitish: plan.commit, name: item.name,
      body: await readFile(path.resolve(path.dirname(planPath), item.notes), 'utf8'),
      draft: true, prerelease: item.prerelease, make_latest: 'false' } });
    console.log(JSON.stringify({ createdDraft: item.tag, id: release.id }));
  } else if (release.target_commitish !== plan.commit) {
    // Never repoint a previous release or silently replace historical artifacts.
    throw new Error(`Existing release ${item.tag} does not target this exact commit.`);
  }
  for (const asset of assets) {
    const remote = await uploadAsset(release, asset.file);
    console.log(JSON.stringify({ tag: item.tag, asset: remote.name, bytes: remote.size, digest: remote.digest }));
  }
  const remoteAssets = await request(`/releases/${release.id}/assets?per_page=100`);
  for (const asset of assets) {
    const remote = remoteAssets.find(a => a.name === asset.name);
    if (!remote || remote.state !== 'uploaded' || remote.size !== asset.size || remote.digest !== `sha256:${asset.sha256}`) {
      throw new Error(`Cannot publish: remote verification failed for ${item.tag}/${asset.name}`);
    }
  }
  if (release.draft) release = await request(`/releases/${release.id}`, { method: 'PATCH', json: {
    draft: false, prerelease: item.prerelease, make_latest: item.latest ? 'true' : 'false',
  } });
  const verified = await request(`/releases/${release.id}`);
  if (verified.draft || verified.prerelease !== item.prerelease) throw new Error('Release publication state mismatch.');
  output.releases.push(releaseSummary(verified));
  await writeFile(new URL('../reports/published-releases.json', import.meta.url), JSON.stringify(output, null, 2));
  console.log(JSON.stringify({ published: verified.html_url, prerelease: verified.prerelease, assets: verified.assets.length }));
}

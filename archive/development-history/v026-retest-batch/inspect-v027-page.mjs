import fs from 'node:fs/promises';
import path from 'node:path';
import {unpack} from './versions/v027-ascii-identity/lib/archive.mjs';
const state=JSON.parse(await fs.readFile('app-session-v027/collector-state.json','utf8'));
const record=await unpack(new Uint8Array(await fs.readFile('app-session-v027/inbox/'+state.archiveId+'.pmgx')));
const fileMap=new Map(record.files);
for(const r of record.manifest.resources.filter(r=>r.role==='screenshot')){await fs.writeFile('reports/v027-captured-page.png',fileMap.get(r.path));}
const offline=record.manifest.resources.find(r=>r.role==='offline');
const html=offline?Buffer.from(fileMap.get(offline.path)).toString('utf8'):'';
const result={state:state.state,updatedAt:state.updatedAt,archiveCapturedAt:record.manifest.captures[0].capturedAt,offlineHasCert:html.includes('8077301-001'),offlineHasBanknoteName:/Hawaii|Emergency Issue/i.test(html),offlineChallengeWords:/Just a moment|正在验证您是否是真人|正在进行安全验证/i.test(html)};
await fs.writeFile('reports/v027-state-vs-capture.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));

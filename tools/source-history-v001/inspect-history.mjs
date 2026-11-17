import fs from 'node:fs';
import path from 'node:path';
const bases = {
 old: String.raw`C:\Users\John\Documents\ChatGPT\PMG查询记录套件\outputs\pmg-vault`,
 preview: String.raw`C:\Users\John\Documents\ChatGPT\PMG查询记录套件\work\github-preview-upload\repo`,
 image: String.raw`C:\Users\John\Documents\Codex\2026-11-10\pmg-image-groups`,
 next: String.raw`C:\Users\John\Documents\Codex\2026-11-17\pmg-next`,
 review: String.raw`C:\Users\John\Documents\Codex\2026-11-17\pmg-review`,
 v024: String.raw`C:\Users\John\Documents\Codex\2026-11-17\pmg-review-v024`,
 v025: String.raw`C:\Users\John\Documents\Codex\2026-11-17\pmg-review-v025`,
 retest: String.raw`C:\Users\John\Documents\Codex\2026-11-17\pmg-retest-v026`
};
for (const [label,base] of Object.entries(bases)) {
 console.log(label, base);
 for(const child of fs.readdirSync(base, {withFileTypes:true})) if (child.isDirectory() && /^(versions|history|checkpoints|android-preview|assets-evidence|scripts|build-tools|recorder|ua-probe|report)/.test(child.name)) {
  const p=path.join(base,child.name);
  console.log(' ',child.name, fs.readdirSync(p).join(', '));
 }
}

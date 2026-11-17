# Project rules

- Read README.md, CONTRIBUTING.md, docs/status.md, docs/architecture.md and docs/repository-layout.md before implementation. Historical DESIGN/FORMAT/ROADMAP files are time-specific snapshots, not current implementation claims.
- main exposes the current Windows 0.18.0 source at the repository root. apps/android is a separately versioned offline preview. Unaccepted Windows features belong on codex/windows-preview or a separate feature branch.
- Before each code-change batch, including fixes, verify the current source and relevant immutable archive. Create a complete independent numbered working copy (tools/new-working-copy.mjs), edit and validate the new copy, then seal and retain it under archive/versions before synchronizing the active source. Never use hard links or edit a sealed archive.
- Keep historical versions in Git as complete source copies. Tags, commits and Releases supplement these copies; they do not replace the user's snapshot requirement. Do not nest copies of the whole archive into new versions.
- npm run check covers current Windows source only. node tools/check-archive.mjs verifies complete archived applications and the active Android preview. Keep source manifests separate from Git metadata, platform caches, outputs and private data.
- Keep user data and browser sessions separate from source. Never commit credentials, cookies, browser profiles, signing keys or private collections. Do not package archive, work or Android source into the Windows app.
- UI must not parse PMG HTML directly; adapters return a shared model. File readers must not depend on the UI framework.
- Preserve original image bytes and raw fields. Do not infer visual sides solely from OBV/REV filenames.
- Never present a challenge, transient failure or empty loading page as a nonexistent certificate or successful capture.
- Keep original captures immutable; updates create new capture entries. Data migrations must create backed-up copies.
- Mark planned functionality honestly. Android is not feature-complete, and passing local tests does not prove live Cloudflare or device acceptance.
- Use descriptive codex/ branches and review changes before merging. Never move existing release tags or replace historical assets with different bytes. Validate remote publication before claiming it is uploaded.

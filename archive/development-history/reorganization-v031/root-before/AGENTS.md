# Project rules

- Read the current version's DESIGN, FORMAT, ROLLBACK and ROADMAP before implementation.
- Never modify a sealed version. Copy the latest version to a new numbered directory before each code-change batch, including fixes. Verify its source seal before copying. Do not use hard links for source copies.
- Keep historical versions in Git as complete source copies. Do not replace copies with tags alone.
- Keep user data and browser sessions separate from source. Never commit credentials, cookies, browser profiles or private collections.
- UI must not parse PMG HTML directly; adapters return a shared model. File readers must not depend on the UI framework.
- Preserve original image bytes and raw fields. Do not infer visual sides solely from OBV/REV filenames.
- Never present a challenge, transient failure or empty loading page as a nonexistent certificate or successful capture.
- Keep original captures immutable; updates create new capture entries. Data migrations must create backed-up copies.
- Mark planned functionality honestly. Validate remote publication before claiming it is uploaded.

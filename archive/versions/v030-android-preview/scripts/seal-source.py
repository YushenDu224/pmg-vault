"""Produce an explicit source publishing allowlist. Private keys/caches are never traversed."""
import hashlib
import json
from pathlib import Path

project = Path(__file__).resolve().parent.parent
roots = ['app/src', 'app/build.gradle', 'build.gradle', 'settings.gradle', 'gradle.properties', '.gitignore',
         'README.md', 'docs', 'scripts', 'source-ui', 'checkpoints']
files = []
for name in roots:
    entry = project / name
    for file in sorted(entry.rglob('*') if entry.is_dir() else [entry]):
        if not file.is_file() or '__pycache__' in file.parts:
            continue
        relative = file.relative_to(project).as_posix()
        assert '/private/' not in '/' + relative and not file.name.endswith(('.jks', '.keystore'))
        contents = file.read_bytes()
        files.append({'path': relative, 'bytes': len(contents), 'sha256': hashlib.sha256(contents).hexdigest()})
manifest = {
    'schemaVersion': 1,
    'version': 'v030-android-preview',
    'appVersion': '0.1.0-preview.1',
    'description': 'Explicit public source allowlist; seal itself is published separately.',
    'excluded': ['private/**', '.gradle/**', 'app/build/**', 'build/**', 'local.properties', '**/*.jks', '**/*.keystore'],
    'files': sorted(files, key=lambda value: value['path']),
}
(project / 'SOURCE-SEAL.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Sealed {len(files)} public source files; private keys and caches excluded.')

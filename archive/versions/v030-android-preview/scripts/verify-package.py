"""Verify packaged web bytes, public source provenance, manifest report and lint results."""
import hashlib
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET
import zipfile

project = Path(__file__).resolve().parent.parent
apk = Path(sys.argv[1]) if len(sys.argv) > 1 else project.parents[1] / 'dist/android/PMG-Library-Android-0.1.0-preview.1.apk'
bundle = project / 'app/src/main/assets/web'
report = project / 'docs/verification'
expected = {p.relative_to(bundle).as_posix(): p.read_bytes() for p in bundle.rglob('*') if p.is_file()}
with zipfile.ZipFile(apk) as package:
    actual = {p[len('assets/web/'):]: package.read(p) for p in package.namelist() if p.startswith('assets/web/') and not p.endswith('/')}
    assert expected == actual, 'Packaged web content differs from source'
    assert 'classes.dex' in package.namelist(), 'Missing native application classes'
    assert not any(p.endswith(('.jks', '.keystore', '.properties')) and 'signing' in p.lower() for p in package.namelist())

original = project / 'source-ui'
checkpoint = project / 'checkpoints/01-original-web'
original_files = [p for p in original.rglob('*') if p.is_file()]
for file in original_files:
    assert file.read_bytes() == (checkpoint / file.relative_to(original)).read_bytes(), 'Original preview checkpoint changed'

badging = (report / 'aapt-badging.txt').read_text(encoding='utf-8-sig')
assert "name='io.github.yushendu224.pmglibrary.preview'" in badging
assert "versionName='0.1.0-preview.1'" in badging
assert "sdkVersion:'26'" in badging and "targetSdkVersion:'35'" in badging
assert 'uses-permission:' not in badging, 'Unexpected Android permission'
java = (project / 'app/src/main/java/io/github/yushendu224/pmglibrary/preview/MainActivity.java').read_text(encoding='utf-8')
assert not re.search(r'\.addJavascriptInterface\s*\(', java), 'Unexpected JavaScript interface'
html = (bundle / 'index.html').read_text(encoding='utf-8-sig')
assert 'class="status-space"' not in html, 'Fake system statusbar still exists'
assert '退出或重载后丢失' in html and 'PMGX' in html, 'Missing preview scope notice'
lint_issues = ET.parse(report / 'lint-results-release.xml').getroot().findall('issue')
errors = sum(issue.get('severity') in ('Error', 'Fatal') for issue in lint_issues)
warnings = sum(issue.get('severity') == 'Warning' for issue in lint_issues)
assert errors == 0, 'Android Lint has errors'
result = {
    'apk': apk.name,
    'bytes': apk.stat().st_size,
    'sha256': hashlib.sha256(apk.read_bytes()).hexdigest(),
    'packagedWebFiles': len(actual),
    'packagedWebBytesMatch': True,
    'originalPreviewFiles': len(original_files),
    'originalCheckpointMatches': True,
    'androidPermissions': [],
    'javascriptInterfacePresent': False,
    'fakeStatusBarRemoved': True,
    'previewScopeVisible': True,
    'lintErrors': errors,
    'lintWarnings': warnings,
    'lintWarningIds': [issue.get('id') for issue in lint_issues if issue.get('severity') == 'Warning'],
    'deviceInstalled': False,
    'deviceInteractionsTested': False,
}
(report / 'static-verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(result, ensure_ascii=False, indent=2))

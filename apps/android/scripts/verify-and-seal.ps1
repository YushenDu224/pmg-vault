param([string]$Apk = '')
$ErrorActionPreference = 'Stop'
$previewProject = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if (!$Apk) { $Apk = [IO.Path]::GetFullPath((Join-Path $previewProject '..\..\dist\android\PMG-Library-Android-0.1.0-preview.1.apk')) }
$webBundle = Join-Path $previewProject 'app\src\main\assets\web'
$report = Join-Path $previewProject 'docs\verification'
$package = [IO.Compression.ZipFile]::OpenRead($Apk)
try {
  $webFiles = @(Get-ChildItem -LiteralPath $webBundle -File -Recurse)
  $entries = @($package.Entries | Where-Object { $_.FullName.StartsWith('assets/web/') -and $_.Name })
  if ($webFiles.Count -ne $entries.Count) { throw 'APK web asset count differs' }
  foreach ($file in $webFiles) {
    $relative = [IO.Path]::GetRelativePath($webBundle, $file.FullName).Replace('\','/')
    $entry = $package.GetEntry('assets/web/' + $relative)
    if (!$entry) { throw "Missing APK asset: $relative" }
    $stream = $entry.Open(); $memory = [IO.MemoryStream]::new()
    try { $stream.CopyTo($memory); $digest = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($memory.ToArray())) }
    finally { $stream.Dispose(); $memory.Dispose() }
    if ($digest -ne (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash) { throw "APK asset differs: $relative" }
  }
  if (!$package.GetEntry('classes.dex')) { throw 'Missing native application classes' }
} finally { $package.Dispose() }
$original = Join-Path $previewProject 'source-ui'
$originalFiles = @(Get-ChildItem -LiteralPath $original -File -Recurse)
foreach ($file in $originalFiles) {
  $relative = [IO.Path]::GetRelativePath($original,$file.FullName)
  $checkpoint = Join-Path $previewProject "checkpoints\01-original-web\$relative"
  if ((Get-FileHash -LiteralPath $file.FullName).Hash -ne (Get-FileHash -LiteralPath $checkpoint).Hash) { throw 'Original checkpoint differs' }
}
$badging = Get-Content -LiteralPath (Join-Path $report 'aapt-badging.txt') -Raw
if (!$badging.Contains("name='io.github.yushendu224.pmglibrary.preview'") -or !$badging.Contains("versionName='0.1.0-preview.1'") -or !$badging.Contains("sdkVersion:'26'") -or !$badging.Contains("targetSdkVersion:'35'") -or $badging.Contains('uses-permission:')) { throw 'Unexpected package identity, SDK, or permissions' }
$nativeJava = Get-Content -LiteralPath (Join-Path $previewProject 'app\src\main\java\io\github\yushendu224\pmglibrary\preview\MainActivity.java') -Raw
if ($nativeJava -match '\.addJavascriptInterface\s*\(') { throw 'Unexpected JavaScript interface' }
$html = Get-Content -LiteralPath (Join-Path $webBundle 'index.html') -Raw
if ($html.Contains('class="status-space"') -or !$html.Contains('退出或重载后丢失') -or !$html.Contains('PMGX')) { throw 'Missing native preview scope or fake statusbar retained' }
[xml]$lint = Get-Content -LiteralPath (Join-Path $report 'lint-results-release.xml') -Raw
$errors = @($lint.issues.issue | Where-Object { $_.severity -in @('Error','Fatal') })
$warnings = @($lint.issues.issue | Where-Object { $_.severity -eq 'Warning' })
if ($errors.Count) { throw 'Lint errors found' }
$apkFile = Get-Item -LiteralPath $Apk
$static = [ordered]@{apk=$apkFile.Name;bytes=$apkFile.Length;sha256=(Get-FileHash -LiteralPath $Apk).Hash.ToLowerInvariant();packagedWebFiles=$entries.Count;packagedWebBytesMatch=$true;originalPreviewFiles=$originalFiles.Count;originalCheckpointMatches=$true;androidPermissions=@();javascriptInterfacePresent=$false;fakeStatusBarRemoved=$true;previewScopeVisible=$true;lintErrors=$errors.Count;lintWarnings=$warnings.Count;lintWarningIds=@($warnings | ForEach-Object {$_.id});deviceInstalled=$false;deviceInteractionsTested=$false}
$static | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $report 'static-verification.json') -Encoding utf8NoBOM

# Explicit publishing allowlist: never enumerate private, cache, or compiled-output directories.
$roots = @('app/src','app/build.gradle','build.gradle','settings.gradle','gradle.properties','.gitignore','README.md','docs','scripts','source-ui','checkpoints')
$sourceFiles = @()
foreach ($name in $roots) {
  $entry = Get-Item -LiteralPath (Join-Path $previewProject $name)
  $candidates = if ($entry.PSIsContainer) { Get-ChildItem -LiteralPath $entry.FullName -Recurse -File -Force } else { @($entry) }
  foreach ($file in $candidates) {
    $relative = [IO.Path]::GetRelativePath($previewProject,$file.FullName).Replace('\','/')
    if ($relative -match '(^|/)private/|\.(jks|keystore)$|(^|/)__pycache__/') { throw "Excluded file entered source allowlist: $relative" }
    $sourceFiles += [ordered]@{path=$relative;bytes=$file.Length;sha256=(Get-FileHash -LiteralPath $file.FullName).Hash.ToLowerInvariant()}
  }
}
$seal = [ordered]@{schemaVersion=1;version='v030-android-preview';appVersion='0.1.0-preview.1';description='Explicit public source allowlist; publish seal itself separately.';excluded=@('private/**','.gradle/**','app/build/**','build/**','local.properties','**/*.jks','**/*.keystore');files=@($sourceFiles | Sort-Object {$_.path})}
$seal | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $previewProject 'SOURCE-SEAL.json') -Encoding utf8NoBOM
$static | ConvertTo-Json -Depth 5
Write-Output "Sealed $($sourceFiles.Count) public source files. Private keys and caches excluded."

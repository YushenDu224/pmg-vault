param(
  [string]$ToolRoot = 'C:\Users\John\Documents\Codex\2026-10-10\ban\work\android-build',
  [string]$OutputDirectory = '',
  [switch]$StandardJavac
)
$ErrorActionPreference = 'Stop'
$previewProject = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$previewPrivate = Join-Path $previewProject 'private'
if (!$OutputDirectory) { $OutputDirectory = [IO.Path]::GetFullPath((Join-Path $previewProject '..\..\dist\android')) }
$env:JAVA_HOME = (Get-ChildItem (Join-Path $ToolRoot 'jdk') -Directory | Select-Object -First 1).FullName
$env:ANDROID_HOME = Join-Path $ToolRoot 'sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:ANDROID_USER_HOME = Join-Path $previewPrivate 'android-user'
$env:GRADLE_USER_HOME = Join-Path $ToolRoot 'gradle-cache'
$previewGradle = Join-Path $ToolRoot 'gradle\gradle-8.9\bin\gradle.bat'
$previewBuildTools = Join-Path $env:ANDROID_HOME 'build-tools\34.0.0'
New-Item -ItemType Directory -Force -Path $previewPrivate,$OutputDirectory,(Join-Path $previewProject 'docs\verification') | Out-Null
$sdkProperty = $env:ANDROID_HOME.Replace('\','/')
Set-Content -LiteralPath (Join-Path $previewProject 'local.properties') -Value "sdk.dir=$sdkProperty" -Encoding ascii

# A new project-only test key is generated locally. It is never copied from another app.
$signingFile = Join-Path $previewPrivate 'signing.properties'
$keyStore = Join-Path $previewPrivate 'pmg-android-preview.jks'
if (!(Test-Path -LiteralPath $signingFile)) {
  if (Test-Path -LiteralPath $keyStore) { throw 'Existing key has no signing properties; refusing to replace it.' }
  $randomBytes = New-Object byte[] 24
  [Security.Cryptography.RandomNumberGenerator]::Fill($randomBytes)
  $previewPassword = [Convert]::ToBase64String($randomBytes)
  $env:PMG_PREVIEW_KEY_PASSWORD = $previewPassword
  try {
    & (Join-Path $env:JAVA_HOME 'bin\keytool.exe') -genkeypair -keystore $keyStore -alias pmg-android-preview -keyalg RSA -keysize 3072 -validity 10000 -dname 'CN=PMG Android Preview Test, O=Independent Preview, C=CN' -storepass:env PMG_PREVIEW_KEY_PASSWORD -keypass:env PMG_PREVIEW_KEY_PASSWORD -noprompt
    if ($LASTEXITCODE -ne 0) { throw 'Project-specific key generation failed' }
    Set-Content -LiteralPath $signingFile -Encoding ascii -Value @('storeFile=private/pmg-android-preview.jks',"storePassword=$previewPassword",'keyAlias=pmg-android-preview',"keyPassword=$previewPassword")
  } finally { Remove-Item Env:PMG_PREVIEW_KEY_PASSWORD -ErrorAction SilentlyContinue; $previewPassword = $null }
}

$gradleArguments = @("-Duser.home=$(Join-Path $previewPrivate 'user-home')",'-p',$previewProject,'assembleRelease','lintRelease','--offline','--no-daemon','--console=plain')
if (!$StandardJavac) {
  # This host's Gradle classpath snapshot has previously denied SDK JAR access.
  # Direct javac uses the same SDK and produces only this project's own classes.
  $classes = Join-Path $previewProject 'app\build\intermediates\javac\release\compileReleaseJavaWithJavac\classes'
  New-Item -ItemType Directory -Force -Path $classes | Out-Null
  $sources = Get-ChildItem (Join-Path $previewProject 'app\src\main\java') -Recurse -Filter *.java | ForEach-Object { $_.FullName }
  & (Join-Path $env:JAVA_HOME 'bin\javac.exe') -encoding UTF-8 -source 17 -target 17 -classpath (Join-Path $env:ANDROID_HOME 'platforms\android-35\android.jar') -d $classes @sources
  if ($LASTEXITCODE -ne 0) { throw 'Java compile failed' }
  $gradleArguments += @('-x','compileReleaseJavaWithJavac')
}
& $previewGradle @gradleArguments
if ($LASTEXITCODE -ne 0) { throw 'Android package or lint failed' }

$apk = Join-Path $OutputDirectory 'PMG-Library-Android-0.1.0-preview.1.apk'
Copy-Item -LiteralPath (Join-Path $previewProject 'app\build\outputs\apk\release\app-release.apk') -Destination $apk -Force
$verification = Join-Path $previewProject 'docs\verification'
& (Join-Path $previewBuildTools 'apksigner.bat') verify --verbose --print-certs $apk | Tee-Object -FilePath (Join-Path $verification 'apksigner.txt')
if ($LASTEXITCODE -ne 0) { throw 'Signature verification failed' }
& (Join-Path $previewBuildTools 'zipalign.exe') -c -v 4 $apk | Tee-Object -FilePath (Join-Path $verification 'zipalign.txt')
if ($LASTEXITCODE -ne 0) { throw 'ZIP alignment verification failed' }
& (Join-Path $previewBuildTools 'aapt.exe') dump badging $apk | Tee-Object -FilePath (Join-Path $verification 'aapt-badging.txt')
if ($LASTEXITCODE -ne 0) { throw 'APK manifest verification failed' }
Copy-Item -LiteralPath (Join-Path $previewProject 'app\build\reports\lint-results-release.html') -Destination (Join-Path $verification 'lint-results-release.html') -Force
Copy-Item -LiteralPath (Join-Path $previewProject 'app\build\reports\lint-results-release.xml') -Destination (Join-Path $verification 'lint-results-release.xml') -Force
$hash = (Get-FileHash -LiteralPath $apk -Algorithm SHA256).Hash.ToLowerInvariant()
Set-Content -LiteralPath (Join-Path $OutputDirectory 'SHA256SUMS.txt') -Value "$hash  $([IO.Path]::GetFileName($apk))" -Encoding ascii
[ordered]@{package='io.github.yushendu224.pmglibrary.preview';version='0.1.0-preview.1';minSdk=26;targetSdk=35;apk=[IO.Path]::GetFileName($apk);sha256=$hash;signing='project-specific test key; private key excluded';signatureVerified=$true;alignmentVerified=$true;lint='passed; see included report';deviceInstalled=$false;deviceTested=$false} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $verification 'build-verification.json') -Encoding utf8
Write-Output "APK ready: $apk"

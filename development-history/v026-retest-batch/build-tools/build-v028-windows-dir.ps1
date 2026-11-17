$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
$taskSource = Join-Path $taskRoot 'versions\v028-state-sync'
$taskOutput = Join-Path $taskRoot 'dist-v028'
$taskDependencies = 'C:\Users\John\Documents\ChatGPT\PMG查询记录套件\outputs\pmg-vault\versions\v019-windows-installer\node_modules'
$taskBuilder = Join-Path $taskDependencies 'electron-builder\out\cli\cli.js'
$env:PMG_ELECTRON_DIST = Join-Path $taskDependencies 'electron\dist'
$env:NODE_PATH = $taskDependencies
$env:ELECTRON_RUN_AS_NODE = $null
$taskLog = Join-Path $PSScriptRoot 'v028-windows-dir-build.log'
if (-not (Test-Path -LiteralPath (Join-Path $env:PMG_ELECTRON_DIST 'electron.exe'))) {
  throw 'Required existing Electron distribution was not found.'
}
$taskMetadata = Get-Content -LiteralPath (Join-Path $taskSource 'package.json') -Raw | ConvertFrom-Json
if ($taskMetadata.version -ne '0.18.1-preview.2') {
  throw 'Diagnostic control must retain version 0.18.1-preview.2.'
}
if (Test-Path -LiteralPath (Join-Path $taskOutput 'win-unpacked\PMG库.exe')) {
  throw 'v028 output already contains an application; review it before rebuilding.'
}
Push-Location -LiteralPath $taskSource
try {
  & node $taskBuilder --projectDir $taskSource --config electron-builder.cjs --config.npmRebuild=false "--config.directories.output=$taskOutput" --win dir --x64 --publish never 2>&1 | Tee-Object -FilePath $taskLog
  if ($LASTEXITCODE -ne 0) { throw ('Diagnostic directory build failed with exit code ' + $LASTEXITCODE) }
} finally {
  Pop-Location
}

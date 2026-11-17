$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
$taskSource = Join-Path $taskRoot 'versions\v025-browser-compat'
$taskDependencies = 'C:\Users\John\Documents\ChatGPT\PMG查询记录套件\outputs\pmg-vault\versions\v019-windows-installer\node_modules'
$taskBuilder = Join-Path $taskDependencies 'electron-builder\out\cli\cli.js'
$env:PMG_ELECTRON_DIST = Join-Path $taskDependencies 'electron\dist'
$env:NODE_PATH = $taskDependencies
$env:ELECTRON_RUN_AS_NODE = $null
$taskLog = Join-Path $PSScriptRoot 'windows-build.log'
Push-Location -LiteralPath $taskSource
try {
  & node $taskBuilder --projectDir $taskSource --config electron-builder.cjs --config.npmRebuild=false --win nsis --x64 --publish never 2>&1 | Tee-Object -FilePath $taskLog
  if ($LASTEXITCODE -ne 0) { throw ('Windows build failed with exit code ' + $LASTEXITCODE) }
} finally {
  Pop-Location
}

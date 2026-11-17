param(
 [string]$ElectronDist='C:\Users\John\Documents\ChatGPT\PMG查询记录套件\outputs\pmg-vault\versions\v019-windows-installer\node_modules\electron\dist',
 [string]$BuilderCli='C:\Users\John\Documents\ChatGPT\PMG查询记录套件\outputs\pmg-vault\versions\v019-windows-installer\node_modules\electron-builder\cli.js'
)
$ErrorActionPreference='Stop'
$deliveryRoot=Split-Path -Parent $PSScriptRoot
$releaseSource=Join-Path $deliveryRoot 'versions\v029-windows-preview'
$outputDirectory=Join-Path $deliveryRoot 'dist\windows'
if(!(Test-Path -LiteralPath (Join-Path $ElectronDist 'electron.exe'))){throw 'Cached Electron runtime not found'}
if(!(Test-Path -LiteralPath $BuilderCli)){throw 'Cached builder CLI not found'}
$previousElectronDist=$env:PMG_ELECTRON_DIST
$previousSigningDiscovery=$env:CSC_IDENTITY_AUTO_DISCOVERY
Push-Location -LiteralPath $releaseSource
try {
 $env:PMG_ELECTRON_DIST=$ElectronDist
 $env:CSC_IDENTITY_AUTO_DISCOVERY='false'
 & node $BuilderCli --config electron-builder.cjs --win nsis --x64 --publish never "--config.directories.output=$outputDirectory" --config.npmRebuild=false
 if($LASTEXITCODE -ne 0){throw "Windows build failed with exit code $LASTEXITCODE"}
} finally {
 Pop-Location
 $env:PMG_ELECTRON_DIST=$previousElectronDist
 $env:CSC_IDENTITY_AUTO_DISCOVERY=$previousSigningDiscovery
}

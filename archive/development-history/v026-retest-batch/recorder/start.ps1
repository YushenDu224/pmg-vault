$ErrorActionPreference = 'Stop'
$env:ELECTRON_RUN_AS_NODE = $null
$recorderElectron = 'C:\Users\John\Documents\ChatGPT\PMG查询记录套件\outputs\pmg-vault\versions\v019-windows-installer\node_modules\electron\dist\electron.exe'
$recorderScript = Join-Path $PSScriptRoot 'main.cjs'
$recorderProcess = Start-Process -FilePath $recorderElectron -ArgumentList @(('"' + $recorderScript + '"')) -WindowStyle Hidden -RedirectStandardOutput (Join-Path $PSScriptRoot 'stdout.log') -RedirectStandardError (Join-Path $PSScriptRoot 'stderr.log') -PassThru
[pscustomobject]@{ ProcessId = $recorderProcess.Id; RecordingDirectory = (Join-Path (Split-Path $PSScriptRoot -Parent) 'recording') }

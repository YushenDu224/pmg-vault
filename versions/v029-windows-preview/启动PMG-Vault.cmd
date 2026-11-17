@echo off
cd /d "%~dp0"
where node >nul 2>nul
if %errorlevel% equ 0 (
  node launch.mjs
) else (
  if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
    "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" launch.mjs
  ) else (
    echo Please install Node.js 22 or newer, then run this launcher again.
    pause
    exit /b 1
  )
)
if errorlevel 1 pause

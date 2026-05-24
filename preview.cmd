@echo off
REM Double-click to preview the Gameday Mavericks site locally.
cd /d "%~dp0"

if not exist "_localpreview\index.html" (
  echo Building local preview from the live site...
  powershell -NoProfile -ExecutionPolicy Bypass -File "build-local.ps1"
)

echo Starting local server...
node serve.js
pause

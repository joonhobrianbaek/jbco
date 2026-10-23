@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Node.js 20 or later is required. Run node --version in PowerShell.
 pause
 exit /b 1
)
node scripts\run-cli-demo.mjs
pause

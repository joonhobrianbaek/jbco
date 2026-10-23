@echo off
setlocal
cd /d "%~dp0"
echo Retry the failed synthetic job only. Completed jobs will not run again.
node scripts\run-cli-demo.mjs --retry
pause

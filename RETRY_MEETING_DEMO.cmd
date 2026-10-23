@echo off
setlocal
cd /d "%~dp0"
echo Retry failed fictional meetings only. Completed jobs are preserved.
node scripts\run-meeting-demo.mjs --retry
pause

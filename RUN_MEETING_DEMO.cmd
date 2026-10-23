@echo off
setlocal
cd /d "%~dp0"
echo Run queued fictional meetings once. No background service or schedule.
node scripts\run-meeting-demo.mjs
pause

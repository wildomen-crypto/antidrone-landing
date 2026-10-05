@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
"%~dp0runtime\node.exe" "%~dp0launcher.cjs" --leads
pause

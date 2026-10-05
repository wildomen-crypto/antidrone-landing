@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
if not exist "runtime\node.exe" (
  echo Распакуйте архив полностью, затем откройте START.cmd из распакованной папки.
  pause
  exit /b 1
)
"%~dp0runtime\node.exe" "%~dp0launcher.cjs" %*
if errorlevel 1 pause

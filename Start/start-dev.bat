@echo off
if exist "%~dp0..\start-dev.ps1" (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\start-dev.ps1" %*
) else (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-dev.ps1" %*
)

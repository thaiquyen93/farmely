@echo off
if exist "%~dp0..\stop-dev.ps1" (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\stop-dev.ps1" %*
) else (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-dev.ps1" %*
)

@echo off
if exist "%~dp0..\status-dev.ps1" (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\status-dev.ps1" %*
) else (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0status-dev.ps1" %*
)

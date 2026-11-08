@echo off
title Khoi dong lai he thong Farmely
chcp 65001 >nul
color 0E

echo =======================================================================
echo                   KHOI DONG LAI HE THONG FARMELY
echo =======================================================================
echo.
echo [1/2] Dang tat cac services hien tai...
cd /d "%~dp0.."
if exist "%~dp0..\stop-dev.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\stop-dev.ps1"
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-dev.ps1"
)

timeout /t 2 /nobreak >nul

echo.
echo [2/2] Dang khoi dong lai he thong moi...
call "%~dp01-Click-Start-Local.bat"

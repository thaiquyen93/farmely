@echo off
title Dung he thong Farmely
chcp 65001 >nul
color 0C

echo =======================================================================
echo                     DUNG HE THONG FARMELY
echo =======================================================================
echo.
echo [*] Dang tat tat ca cac Backend Services va Frontend...
echo.

cd /d "%~dp0.."
if exist "%~dp0..\stop-dev.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\stop-dev.ps1"
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-dev.ps1"
)

echo.
echo =======================================================================
echo  [HOAN TAT] Tat ca cac tien trinh ung dung Farmely da duoc tat an toan.
echo =======================================================================
echo.
pause

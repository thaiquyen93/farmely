@echo off
title Khoi dong Farmely (Local Mode)
chcp 65001 >nul
color 0A

echo =======================================================================
echo                 HE THONG NONG NGHIEP THONG MINH FARMELY
echo =======================================================================
echo.
echo [1/3] Dang kiem tra PostgreSQL Database Service...
powershell -NoProfile -Command "if ((Get-Service -Name postgresql-x64-18 -ErrorAction SilentlyContinue).Status -ne 'Running') { Write-Host '    -> Dang bat service PostgreSQL...'; Start-Service postgresql-x64-18 -ErrorAction SilentlyContinue }"

echo.
echo [2/3] Dang khoi chay 10 Backend Services va Frontend...
echo       (Vui long cho khoang 15-30 giay de he thong khoi tao)
echo.

cd /d "%~dp0.."
if exist "%~dp0..\start-dev.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\start-dev.ps1"
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-dev.ps1"
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    color 0C
    echo [LOI] Co loi xay ra trong qua trinh khoi dong he thong!
    echo [!] Kiem tra cac file log loi tai thu muc: .run\
    echo.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Dang tu dong mo trinh duyet...
start http://localhost:3000

echo.
echo =======================================================================
echo  [THANH CONG] FARMELY DA SAN SANG SU DUNG!
echo.
echo   * Giao dien Web (Frontend):    http://localhost:3000
echo   * API Gateway:                  http://localhost:8080
echo   * Payment Swagger Docs:         http://localhost:8085/swagger-ui.html
echo   * Communication Swagger Docs:   http://localhost:8087/swagger-ui.html
echo.
echo   * De tat he thong: Double-click file Stop-Farmely.bat
echo =======================================================================
echo.
pause

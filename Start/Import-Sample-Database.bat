@echo off
title Nap Database mau cho Farmely
chcp 65001 >nul
color 0B

echo =======================================================================
echo              NAP DU LIEU MAU VAO DATABASE POSTGRESQL
echo =======================================================================
echo.
echo [*] Database target: localhost:5432 / farmely
echo [*] File SQL nguon:  Database\farmely_full_database.sql
echo.
set /p CONFIRM="Ban co muon nap lai toan bo schema va data khong? (Y/N): "
if /i "%CONFIRM%" NEQ "Y" (
    echo [Da huy thao tac]
    pause
    exit /b 0
)

echo.
echo [*] Dang kiem tra PostgreSQL service...
powershell -NoProfile -Command "if ((Get-Service -Name postgresql-x64-18 -ErrorAction SilentlyContinue).Status -ne 'Running') { Write-Host '    -> Dang bat service postgresql-x64-18...'; Start-Service postgresql-x64-18 -ErrorAction SilentlyContinue }"

set PSQL_CMD=
for /d %%D in ("C:\Program Files\PostgreSQL\*") do (
    if exist "%%D\bin\psql.exe" set "PSQL_CMD=%%D\bin\psql.exe"
)
if "%PSQL_CMD%"=="" set "PSQL_CMD=psql"

cd /d "%~dp0.."
if exist ".env" (
    for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
        if /i "%%A"=="DB_PASSWORD" set "PGPASSWORD=%%B"
        if /i "%%A"=="DB_PORT" set "DB_PORT=%%B"
        if /i "%%A"=="DB_USER" set "DB_USER=%%B"
        if /i "%%A"=="DB_NAME" set "DB_NAME=%%B"
    )
)
if "%PGPASSWORD%"=="" set "PGPASSWORD=postgres"
if "%DB_PORT%"=="" set "DB_PORT=5432"
if "%DB_USER%"=="" set "DB_USER=postgres"
if "%DB_NAME%"=="" set "DB_NAME=farmely"

echo [*] Su dung psql: %PSQL_CMD%
echo [*] Dang nap du lieu vao PostgreSQL (%DB_NAME% - port %DB_PORT%)...

if exist "%~dp0..\docs\database\farmely_full_database.sql" (
    "%PSQL_CMD%" -U %DB_USER% -p %DB_PORT% -d %DB_NAME% -f "%~dp0..\docs\database\farmely_full_database.sql"
) else if exist "%~dp0..\Database\farmely_full_database.sql" (
    "%PSQL_CMD%" -U %DB_USER% -p %DB_PORT% -d %DB_NAME% -f "%~dp0..\Database\farmely_full_database.sql"
) else (
    echo [LOI] Khong tim thay file SQL database!
    pause
    exit /b 1
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =======================================================================
    echo  [THANH CONG] Da nap xong toan bo 26 bang va du lieu mau vao database!
    echo =======================================================================
) else (
    echo.
    echo [!] Co loi xay ra trong qua trinh nap file SQL.
)

echo.
pause

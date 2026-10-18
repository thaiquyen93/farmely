$ErrorActionPreference = 'SilentlyContinue'

$projectRoot = if (Test-Path (Join-Path $PSScriptRoot 'backend')) {
    $PSScriptRoot
} elseif (Test-Path (Join-Path (Split-Path -Parent $PSScriptRoot) 'backend')) {
    Split-Path -Parent $PSScriptRoot
} else {
    $PSScriptRoot
}
$runtimeDir = Join-Path $projectRoot '.run'
$pidFile = Join-Path $runtimeDir 'processes.json'

Write-Host 'Dang dung toan bo cac tien trinh Farmely...' -ForegroundColor Yellow

# 1. Dung cac tien trinh duoc luu trong processes.json
if (Test-Path -LiteralPath $pidFile) {
    try {
        $parsedProcesses = Get-Content -LiteralPath $pidFile -Raw | ConvertFrom-Json
        $processes = if ($parsedProcesses.PSObject.Properties.Name -contains 'value') {
            @($parsedProcesses.value)
        } else {
            @($parsedProcesses)
        }
        foreach ($entry in $processes) {
            if ($entry.Pid) {
                $p = Get-Process -Id $entry.Pid -ErrorAction SilentlyContinue
                if ($p) {
                    & taskkill.exe /PID $entry.Pid /T /F | Out-Null
                    Write-Host "  -> Da dung $($entry.Name) (PID $($entry.Pid))." -ForegroundColor Gray
                }
            }
        }
    } catch {}
    Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
}

# 2. Giai phong them cac cong Farmely neu con tien trinh treo (3000, 8080-8089)
$ports = @(3000, 8080, 8081, 8082, 8083, 8084, 8085, 8086, 8087, 8088, 8089)
foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($conn in $conns) {
        if ($conn.OwningProcess -and $conn.OwningProcess -gt 0) {
            $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($proc -and ($proc.ProcessName -match 'java|node|python')) {
                & taskkill.exe /PID $conn.OwningProcess /T /F | Out-Null
                Write-Host "  -> Giai phong cong $port (PID $($conn.OwningProcess) - $($proc.ProcessName))." -ForegroundColor Gray
            }
        }
    }
}

Write-Host 'Tat ca cac tien trinh Farmely da duoc tat an toan. Database PostgreSQL van tiep tuc hoat dong.' -ForegroundColor Green

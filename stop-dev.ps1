$ErrorActionPreference = 'Stop'
$runtimeDir = Join-Path $PSScriptRoot '.run'
$pidFile = Join-Path $runtimeDir 'processes.json'

if (-not (Test-Path -LiteralPath $pidFile)) {
    Write-Host 'No Farmely process file found.'
    exit 0
}

$parsedProcesses = Get-Content -LiteralPath $pidFile -Raw | ConvertFrom-Json
$processes = if ($parsedProcesses.PSObject.Properties.Name -contains 'value') {
    @($parsedProcesses.value)
}
else {
    @($parsedProcesses)
}
foreach ($entry in $processes) {
    $process = Get-Process -Id $entry.Pid -ErrorAction SilentlyContinue
    if ($process) {
        & taskkill.exe /PID $entry.Pid /T /F | Out-Null
        Write-Host "Stopped $($entry.Name) (PID $($entry.Pid))."
    }
}

Remove-Item -LiteralPath $pidFile -Force
Write-Host 'Farmely application processes stopped. Local PostgreSQL database is still running.'

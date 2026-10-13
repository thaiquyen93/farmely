param([switch]$Rebuild)

$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$dockerCommand = Get-Command docker.exe -ErrorAction SilentlyContinue
if (-not $dockerCommand) { throw 'Không tìm thấy Docker CLI. Hãy cài Docker Desktop trước khi chạy Farmely.' }

function Test-DockerEngine {
    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = 'SilentlyContinue'
    & $dockerCommand.Source ps --format '{{.ID}}' 2>$null | Out-Null
    $ready = $LASTEXITCODE -eq 0
    $ErrorActionPreference = $previousPreference
    return $ready
}

if (-not (Test-DockerEngine)) {
    $dockerDesktop = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
    if (-not (Test-Path -LiteralPath $dockerDesktop)) { throw 'Docker Engine chưa chạy và không tìm thấy Docker Desktop.' }
    Start-Process -FilePath $dockerDesktop -WindowStyle Hidden
    for ($attempt = 0; $attempt -lt 24; $attempt++) {
        Start-Sleep -Seconds 5
        if (Test-DockerEngine) { break }
    }
    if (-not (Test-DockerEngine)) { throw 'Docker Desktop không sẵn sàng sau 120 giây.' }
}

Push-Location $projectRoot
try {
    $composeArgs = @('compose', 'up', '-d')
    if ($Rebuild) { $composeArgs += '--build' }
    & $dockerCommand.Source @composeArgs
    if ($LASTEXITCODE -ne 0) { throw 'Docker Compose startup failed.' }

    $requiredServices = @('postgres', 'identity-service', 'farm-service', 'knowledge-service', 'rental-service', 'payment-service', 'cultivation-service', 'communication-service', 'monitoring-service', 'ai-service', 'api-gateway', 'frontend')
    $missing = $requiredServices
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
        $running = @(& $dockerCommand.Source compose ps --services --filter status=running)
        $missing = @($requiredServices | Where-Object { $_ -notin $running })
        if ($missing.Count -eq 0) { break }
        Start-Sleep -Seconds 2
    }
    if ($missing.Count -gt 0) {
        & $dockerCommand.Source compose ps
        throw "Các container chưa sẵn sàng: $($missing -join ', ')"
    }

    Write-Host 'Farmely Docker stack is ready:' -ForegroundColor Green
    Write-Host '  Frontend:    http://localhost:3000'
    Write-Host '  API gateway: http://localhost:8080'
    Write-Host '  PostgreSQL:  localhost:5433'
}
finally { Pop-Location }

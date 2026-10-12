param(
    [switch]$Rebuild
)

$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$runtimeDir = Join-Path $projectRoot '.run'
$jdkCandidates = @(
    'C:\Program Files\Java\jdk-25',
    'C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot'
)
$jdkHome = $jdkCandidates | Where-Object { Test-Path (Join-Path $_ 'bin\java.exe') } | Select-Object -First 1

if (-not $jdkHome) {
    throw "JDK not found in: $($jdkCandidates -join ', ')"
}

$env:JAVA_HOME = $jdkHome
$env:Path = "$jdkHome\bin;$env:Path"

New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null

Push-Location $projectRoot
try {
    docker info --format '{{.ServerVersion}}' 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        $dockerDesktop = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
        if (-not (Test-Path -LiteralPath $dockerDesktop)) {
            throw 'Docker Desktop is not installed.'
        }

        Start-Process -FilePath $dockerDesktop -WindowStyle Hidden
        $dockerReady = $false
        for ($attempt = 0; $attempt -lt 24; $attempt++) {
            Start-Sleep -Seconds 5
            docker info --format '{{.ServerVersion}}' 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0) {
                $dockerReady = $true
                break
            }
        }

        if (-not $dockerReady) {
            throw 'Docker Desktop did not become ready within 2 minutes.'
        }
    }

    docker compose up -d

    $backendRoot = Join-Path $projectRoot 'backend'
    $requiredJars = @(
        'api-gateway\target\api-gateway-1.0.0-SNAPSHOT.jar',
        'identity-service\target\identity-service-1.0.0-SNAPSHOT.jar',
        'farm-service\target\farm-service-1.0.0-SNAPSHOT.jar',
        'knowledge-service\target\knowledge-service-1.0.0-SNAPSHOT.jar',
        'rental-service\target\rental-service-1.0.0-SNAPSHOT.jar',
        'payment-service\target\payment-service-1.0.0-SNAPSHOT.jar',
        'cultivation-service\target\cultivation-service-1.0.0-SNAPSHOT.jar',
        'communication-service\target\communication-service-1.0.0-SNAPSHOT.jar',
        'monitoring-service\target\monitoring-service-1.0.0-SNAPSHOT.jar',
        'ai-service\target\ai-service-1.0.0-SNAPSHOT.jar'
    )
    $missingJar = $requiredJars | Where-Object { -not (Test-Path -LiteralPath (Join-Path $backendRoot $_)) }

    if ($Rebuild -or $missingJar) {
        Push-Location $backendRoot
        try {
            $mvnCmd = if (Test-Path '.\mvnw.cmd') { '.\mvnw.cmd' } else { 'mvn' }
            & $mvnCmd package -DskipTests
            if ($LASTEXITCODE -ne 0) {
                throw 'Backend build failed.'
            }
        }
        finally {
            Pop-Location
        }
    }

    $frontendRoot = Join-Path $projectRoot 'frontend'
    if (-not (Test-Path -LiteralPath (Join-Path $frontendRoot 'node_modules'))) {
        Push-Location $frontendRoot
        try {
            & npm.cmd ci
            if ($LASTEXITCODE -ne 0) {
                throw 'Frontend dependency installation failed.'
            }
        }
        finally {
            Pop-Location
        }
    }

    $services = @(
        @{ Name = 'api-gateway'; Port = 8080; Jar = 'api-gateway\target\api-gateway-1.0.0-SNAPSHOT.jar' },
        @{ Name = 'identity-service'; Port = 8081; Jar = 'identity-service\target\identity-service-1.0.0-SNAPSHOT.jar' },
        @{ Name = 'farm-service'; Port = 8082; Jar = 'farm-service\target\farm-service-1.0.0-SNAPSHOT.jar' },
        @{ Name = 'knowledge-service'; Port = 8083; Jar = 'knowledge-service\target\knowledge-service-1.0.0-SNAPSHOT.jar' },
        @{ Name = 'rental-service'; Port = 8084; Jar = 'rental-service\target\rental-service-1.0.0-SNAPSHOT.jar' },
        @{ Name = 'payment-service'; Port = 8085; Jar = 'payment-service\target\payment-service-1.0.0-SNAPSHOT.jar' },
        @{ Name = 'cultivation-service'; Port = 8086; Jar = 'cultivation-service\target\cultivation-service-1.0.0-SNAPSHOT.jar' },
        @{ Name = 'communication-service'; Port = 8087; Jar = 'communication-service\target\communication-service-1.0.0-SNAPSHOT.jar' },
        @{ Name = 'monitoring-service'; Port = 8088; Jar = 'monitoring-service\target\monitoring-service-1.0.0-SNAPSHOT.jar' },
        @{ Name = 'ai-service'; Port = 8089; Jar = 'ai-service\target\ai-service-1.0.0-SNAPSHOT.jar' }
    )

    $pidData = @()
    $pidFile = Join-Path $runtimeDir 'processes.json'
    if (Test-Path -LiteralPath $pidFile) {
        $parsedProcesses = Get-Content -LiteralPath $pidFile -Raw | ConvertFrom-Json
        $savedProcesses = if ($parsedProcesses.PSObject.Properties.Name -contains 'value') {
            @($parsedProcesses.value)
        }
        else {
            @($parsedProcesses)
        }
        foreach ($savedProcess in $savedProcesses) {
            if (Get-Process -Id $savedProcess.Pid -ErrorAction SilentlyContinue) {
                $pidData += $savedProcess
            }
        }
    }

    foreach ($service in $services) {
        $existing = Get-NetTCPConnection -LocalPort $service.Port -State Listen -ErrorAction SilentlyContinue
        if ($existing) {
            Write-Host "$($service.Name) already listening on port $($service.Port)."
            continue
        }

        $stdout = Join-Path $runtimeDir "$($service.Name).out.log"
        $stderr = Join-Path $runtimeDir "$($service.Name).err.log"
        $jarPath = Join-Path $backendRoot $service.Jar
        $process = Start-Process -FilePath (Join-Path $jdkHome 'bin\java.exe') `
            -ArgumentList @('-jar', $jarPath) `
            -WorkingDirectory (Split-Path -Parent $jarPath) `
            -RedirectStandardOutput $stdout `
            -RedirectStandardError $stderr `
            -WindowStyle Hidden `
            -PassThru
        $pidData += [pscustomobject]@{ Name = $service.Name; Pid = $process.Id; Port = $service.Port }
    }

    $frontendPort = 3000
    $frontendExisting = Get-NetTCPConnection -LocalPort $frontendPort -State Listen -ErrorAction SilentlyContinue
    if ($frontendExisting) {
        Write-Host "frontend already listening on port $frontendPort."
    }
    else {
        $nodeExecutable = (Get-Command node.exe -ErrorAction Stop).Source
        $viteScript = Join-Path $frontendRoot 'node_modules\vite\bin\vite.js'
        $frontendProcess = Start-Process -FilePath $nodeExecutable `
            -ArgumentList @($viteScript, '--host', '127.0.0.1') `
            -WorkingDirectory $frontendRoot `
            -RedirectStandardOutput (Join-Path $runtimeDir 'frontend.out.log') `
            -RedirectStandardError (Join-Path $runtimeDir 'frontend.err.log') `
            -WindowStyle Hidden `
            -PassThru
        $pidData += [pscustomobject]@{ Name = 'frontend'; Pid = $frontendProcess.Id; Port = $frontendPort }
    }

    ConvertTo-Json -InputObject @($pidData) | Set-Content -LiteralPath $pidFile -Encoding UTF8

    $ports = @($services.Port) + $frontendPort
    foreach ($port in $ports) {
        $ready = $false
        for ($attempt = 0; $attempt -lt 30; $attempt++) {
            if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
                $ready = $true
                break
            }
            Start-Sleep -Seconds 1
        }
        if (-not $ready) {
            Write-Warning "Port $port did not become ready. Check logs in $runtimeDir."
        }
    }

    Write-Host ''
    Write-Host 'Farmely is ready:' -ForegroundColor Green
    Write-Host '  Frontend:      http://localhost:3000'
    Write-Host '  API gateway:   http://localhost:8080'
    Write-Host '  Payment API:   http://localhost:8085/swagger-ui.html'
    Write-Host '  Communication: http://localhost:8087/swagger-ui.html'
}
finally {
    Pop-Location
}

param(
    [switch]$Rebuild
)

$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$runtimeDir = Join-Path $projectRoot '.run'

# Tìm kiếm JDK 21 tự động trên hệ thống
$jdkDirs = Get-ChildItem 'C:\Program Files\Eclipse Adoptium' -Directory -Filter 'jdk-21*' -ErrorAction SilentlyContinue | Sort-Object Name -Descending
if ($jdkDirs -and $jdkDirs.Count -gt 0) {
    $jdkHome = $jdkDirs[0].FullName
} elseif ($env:JAVA_HOME -and (Test-Path -LiteralPath (Join-Path $env:JAVA_HOME 'bin\java.exe'))) {
    $jdkHome = $env:JAVA_HOME
} else {
    $jdkHome = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot'
}

if (-not (Test-Path -LiteralPath (Join-Path $jdkHome 'bin\java.exe'))) {
    throw "JDK 21 not found at $jdkHome"
}

$env:JAVA_HOME = $jdkHome
$env:Path = "$jdkHome\bin;$env:Path"

# Thiết lập biến môi trường chuẩn cho kết nối Database (Postgres container trên port 5433)
$env:DB_HOST = 'localhost'
$env:DB_PORT = '5433'
$env:DB_NAME = 'farmely'
$env:DB_USER = 'postgres'
$env:DB_USERNAME = 'postgres'
$env:DB_PASSWORD = '12345'
$env:DB_PASS = '12345'
$env:DB_URL = 'jdbc:postgresql://localhost:5433/farmely'

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
            $mvnwCmd = Join-Path $backendRoot 'mvnw.cmd'
            if (Test-Path -LiteralPath $mvnwCmd) {
                & $mvnwCmd package -DskipTests
            } else {
                & mvn package -DskipTests
            }
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
            & cmd.exe /c "npm install"
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
        $javaArgs = @(
            "-Dspring.datasource.url=jdbc:postgresql://localhost:5433/farmely",
            "-Dspring.datasource.username=postgres",
            "-Dspring.datasource.password=12345",
            "-Dspring.rabbitmq.host=localhost",
            "-Dspring.rabbitmq.port=5672",
            "-Dspring.rabbitmq.username=guest",
            "-Dspring.rabbitmq.password=guest",
            "-jar", $jarPath
        )
        $process = Start-Process -FilePath (Join-Path $jdkHome 'bin\java.exe') `
            -ArgumentList $javaArgs `
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
        for ($attempt = 0; $attempt -lt 90; $attempt++) {
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
    Write-Host '=====================================================' -ForegroundColor Green
    Write-Host ' Farmely Platform is up and running on DEV branch!' -ForegroundColor Green
    Write-Host '=====================================================' -ForegroundColor Green
    Write-Host '  Frontend UI:          http://localhost:3000' -ForegroundColor Cyan
    Write-Host '  API Gateway:          http://localhost:8080' -ForegroundColor Cyan
    Write-Host '  Identity Service:     http://localhost:8081'
    Write-Host '  Farm Service:         http://localhost:8082'
    Write-Host '  Knowledge Service:    http://localhost:8083'
    Write-Host '  Rental Service:       http://localhost:8084'
    Write-Host '  Payment Service:      http://localhost:8085'
    Write-Host '  Cultivation Service:  http://localhost:8086'
    Write-Host '  Communication Service:http://localhost:8087'
    Write-Host '  Monitoring Service:   http://localhost:8088'
    Write-Host '  AI Service:           http://localhost:8089'
    Write-Host '  PostgreSQL:           localhost:5433 (db: farmely)'
    Write-Host '=====================================================' -ForegroundColor Green
    Write-Host ''
    Write-Host 'Farmely stack is running in background. Use stop-dev.ps1 to stop.' -ForegroundColor Yellow
    while ($true) {
        Start-Sleep -Seconds 5
    }
}
finally {
    Pop-Location
}

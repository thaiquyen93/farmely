param(
    [switch]$Rebuild,
    [switch]$Supabase
)

$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$runtimeDir = Join-Path $projectRoot '.run'
$jdkHome = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot'

if (-not (Test-Path -LiteralPath (Join-Path $jdkHome 'bin\java.exe'))) {
    throw "JDK 21 not found at $jdkHome"
}

$env:JAVA_HOME = $jdkHome
$env:Path = "$jdkHome\bin;$env:Path"

New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null

if ($Supabase) {
    $supabaseEnvFile = Join-Path $projectRoot '.env.supabase.local'
    if (-not (Test-Path -LiteralPath $supabaseEnvFile)) {
        throw 'Missing .env.supabase.local. Copy .env.supabase.example and fill in the Supabase database connection values.'
    }

    foreach ($line in Get-Content -LiteralPath $supabaseEnvFile) {
        $trimmedLine = $line.Trim()
        if ([string]::IsNullOrWhiteSpace($trimmedLine) -or $trimmedLine.StartsWith('#')) {
            continue
        }

        $separator = $trimmedLine.IndexOf('=')
        if ($separator -lt 1) {
            continue
        }

        $name = $trimmedLine.Substring(0, $separator).Trim()
        $value = $trimmedLine.Substring($separator + 1).Trim().Trim('"').Trim("'")
        [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }

    foreach ($requiredVariable in @('DB_URL', 'DB_USERNAME', 'DB_PASSWORD')) {
        $requiredValue = [Environment]::GetEnvironmentVariable($requiredVariable, 'Process')
        if ([string]::IsNullOrWhiteSpace($requiredValue) -or $requiredValue -match 'YOUR[_-]') {
            throw "$requiredVariable is missing from .env.supabase.local."
        }
    }
}

Push-Location $projectRoot
try {
    $dockerCommand = $null
    $dockerVersion = $null
    $dockerReady = $false
    $localPostgres = $null
    if (-not $Supabase) {
        $dockerCommand = Get-Command docker.exe -ErrorAction SilentlyContinue
        if ($dockerCommand) {
            $dockerVersion = & $dockerCommand.Source info --format '{{.ServerVersion}}' 2>$null
            $dockerReady = $LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($dockerVersion)
        }
        $localPostgres = Get-NetTCPConnection -LocalPort 5432 -State Listen -ErrorAction SilentlyContinue
    }

    if (-not $Supabase -and -not $dockerReady -and -not $localPostgres) {
        if (-not $dockerCommand) {
            throw 'Không tìm thấy Docker CLI và PostgreSQL local chưa chạy.'
        }
        $dockerDesktop = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
        if (-not (Test-Path -LiteralPath $dockerDesktop)) {
            throw 'Không tìm thấy Docker Desktop hoặc PostgreSQL local.'
        }

        Start-Process -FilePath $dockerDesktop -WindowStyle Hidden
        for ($attempt = 0; $attempt -lt 24; $attempt++) {
            Start-Sleep -Seconds 5
            & $dockerCommand.Source info --format '{{.ServerVersion}}' 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0) {
                $dockerReady = $true
                break
            }
        }

        if (-not $dockerReady) {
            throw 'Docker Desktop không sẵn sàng và PostgreSQL local chưa chạy.'
        }
    }

    if ($Supabase) {
        Write-Host 'Using Supabase PostgreSQL.'
    }
    elseif ($dockerReady) {
        & $dockerCommand.Source compose up -d
        $env:DB_URL = 'jdbc:postgresql://localhost:5433/farmely'
        Write-Host 'Using Docker PostgreSQL on port 5433.'
    }
    else {
        $env:DB_URL = 'jdbc:postgresql://localhost:5432/farmely'
        Write-Host 'Using local PostgreSQL on port 5432.'
    }

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
            & .\mvnw.cmd package -DskipTests
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

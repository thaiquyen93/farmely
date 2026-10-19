param(
    [switch]$Rebuild
)

$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$runtimeDir = Join-Path $projectRoot '.run'
# ==============================================================================
# 1. NẠP CẤU HÌNH TẬP TRUNG TỪ FILE .env GỐC
# ==============================================================================
$envFile = Join-Path $projectRoot '.env'
$envExampleFile = Join-Path $projectRoot '.env.example'

if (-not (Test-Path -LiteralPath $envFile) -and (Test-Path -LiteralPath $envExampleFile)) {
    Copy-Item -LiteralPath $envExampleFile -Destination $envFile
    Write-Host 'Đã tự động tạo file .env từ .env.example' -ForegroundColor Yellow
}

if (Test-Path -LiteralPath $envFile) {
    Get-Content -LiteralPath $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
            $key, $val = $line -split '=', 2
            $key = $key.Trim()
            $val = $val.Trim().Trim('"').Trim("'")
            if ($key) {
                [System.Environment]::SetEnvironmentVariable($key, $val, 'Process')
            }
        }
    }
    Write-Host 'Đã nạp toàn bộ cấu hình từ file .env gốc.' -ForegroundColor Green
}

# ==============================================================================
# 2. TỰ ĐỘNG TÌM KIẾM JDK 21+ TRÊN MÁY
# ==============================================================================
$jdkHome = $null
if ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME 'bin\java.exe'))) {
    $jdkHome = $env:JAVA_HOME.TrimEnd('\')
}

if (-not $jdkHome) {
    $jdkCandidates = @(
        'C:\Users\Acer\.antigravity-ide\extensions\redhat.java-1.56.0-win32-x64\jre\21.0.12.1-win32-x86_64',
        'C:\Users\Acer\.vscode\extensions\redhat.java-1.56.0-win32-x64\jre\21.0.12.1-win32-x86_64',
        'C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot',
        'C:\Program Files\Java\jdk-25'
    )
    $jdkHome = $jdkCandidates | Where-Object { Test-Path (Join-Path $_ 'bin\java.exe') } | Select-Object -First 1
}

if (-not $jdkHome) {
    $javaCmd = Get-Command java.exe -ErrorAction SilentlyContinue
    if ($javaCmd) {
        $candidateHome = Split-Path -Parent (Split-Path -Parent $javaCmd.Source)
        if (Test-Path (Join-Path $candidateHome 'bin\java.exe')) {
            $jdkHome = $candidateHome
        }
    }
}

if (-not $jdkHome) {
    $jdkSearchRoots = @(
        'C:\Program Files\Eclipse Adoptium',
        'C:\Program Files\Java',
        'C:\Program Files\Microsoft',
        'C:\Program Files\Amazon Corretto',
        'C:\Program Files\Zulu',
        "$env:USERPROFILE\.jdks"
    )
    foreach ($root in $jdkSearchRoots) {
        if (Test-Path $root) {
            $found = Get-ChildItem -Path $root -Directory -ErrorAction SilentlyContinue |
                Where-Object { Test-Path (Join-Path $_.FullName 'bin\java.exe') } |
                Select-Object -First 1
            if ($found) {
                $jdkHome = $found.FullName
                break
            }
        }
    }
}

if (-not $jdkHome) {
    throw "Không tìm thấy JDK trên máy. Vui lòng cài đặt JDK 21+ hoặc thiết lập biến môi trường JAVA_HOME."
}

$env:JAVA_HOME = $jdkHome
$env:Path = "$jdkHome\bin;$env:Path"

New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null

Push-Location $projectRoot
try {
    # ==============================================================================
    # 3. KIỂM TRA DOCKER VÀ CƠ SỞ DỮ LIỆU POSTGRESQL
    # ==============================================================================
    function Test-DockerReady {
        param($cmdPath)
        try {
            $prevEap = $ErrorActionPreference
            $ErrorActionPreference = 'SilentlyContinue'
            $out = & $cmdPath info --format '{{.ServerVersion}}' 2>&1
            return ($LASTEXITCODE -eq 0 -and (-not [string]::IsNullOrWhiteSpace($out)) -and (-not ($out -match 'failed to connect|error|daemon is not running')))
        } catch {
            return $false
        } finally {
            $ErrorActionPreference = $prevEap
        }
    }

    $dockerCommand = Get-Command docker.exe -ErrorAction SilentlyContinue
    $dockerReady = if ($dockerCommand) { Test-DockerReady -cmdPath $dockerCommand.Source } else { $false }

    $configuredPort = if ($env:DB_PORT) { [int]$env:DB_PORT } else { 5433 }
    $localPostgresPort = $null
    if (Get-NetTCPConnection -LocalPort $configuredPort -State Listen -ErrorAction SilentlyContinue) {
        $localPostgresPort = $configuredPort
    } elseif (Get-NetTCPConnection -LocalPort 5433 -State Listen -ErrorAction SilentlyContinue) {
        $localPostgresPort = 5433
    } elseif (Get-NetTCPConnection -LocalPort 5432 -State Listen -ErrorAction SilentlyContinue) {
        $localPostgresPort = 5432
    }
    $localPostgres = ($null -ne $localPostgresPort)

    $dbHost = if ($env:DB_HOST) { $env:DB_HOST } else { 'localhost' }
    $dbName = if ($env:DB_NAME) { $env:DB_NAME } else { 'farmely' }
    $dbUser = if ($env:DB_USER) { $env:DB_USER } else { 'postgres' }
    $dbPassword = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } elseif ($env:DB_PASS) { $env:DB_PASS } else { '12345' }

    $useDockerDb = ($env:USE_DOCKER_DB -eq 'true' -or $env:USE_DOCKER_DB -eq '1')

    if ($localPostgres -and -not $useDockerDb) {
        $env:DB_PORT = "$localPostgresPort"
        $env:DB_URL = "jdbc:postgresql://${dbHost}:${localPostgresPort}/${dbName}"
        Write-Host "Sử dụng PostgreSQL LOCAL trên cổng $localPostgresPort (database: $dbName)." -ForegroundColor Green
    }
    elseif ($dockerReady) {
        & $dockerCommand.Source compose up -d postgres rabbitmq
        $env:DB_PORT = '5432'
        $env:DB_URL = "jdbc:postgresql://${dbHost}:5432/${dbName}"
        Write-Host "Sử dụng Docker PostgreSQL trên cổng 5432 (database: $dbName)." -ForegroundColor Cyan
    }
    elseif ($localPostgres) {
        $env:DB_PORT = "$localPostgresPort"
        $env:DB_URL = "jdbc:postgresql://${dbHost}:${localPostgresPort}/${dbName}"
        Write-Host "Sử dụng PostgreSQL LOCAL trên cổng $localPostgresPort (database: $dbName)." -ForegroundColor Green
    }
    else {
        # Chỉ khởi động Docker Desktop nếu cả local PostgreSQL và Docker daemon đều không có sẵn
        if ($dockerCommand) {
            $dockerDesktopCandidates = @(
                'C:\Program Files\Docker\Docker\Docker Desktop.exe',
                "$env:LOCALAPPDATA\Programs\DockerDesktop\Docker Desktop.exe"
            )
            $dockerDesktop = $dockerDesktopCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
            if ($dockerDesktop) {
                Write-Host 'Đang khởi động Docker Desktop để chạy database...' -ForegroundColor Yellow
                Start-Process -FilePath $dockerDesktop -WindowStyle Hidden
                for ($attempt = 0; $attempt -lt 24; $attempt++) {
                    Start-Sleep -Seconds 5
                    if (Test-DockerReady -cmdPath $dockerCommand.Source) {
                        $dockerReady = $true
                        break
                    }
                }
            }
        }

        if ($dockerReady) {
            & $dockerCommand.Source compose up -d postgres rabbitmq
            $env:DB_PORT = '5432'
            $env:DB_URL = "jdbc:postgresql://${dbHost}:5432/${dbName}"
            Write-Host "Sử dụng Docker PostgreSQL trên cổng 5432 (database: $dbName)." -ForegroundColor Cyan
        }
        else {
            throw 'Không tìm thấy PostgreSQL local (hãy bật PostgreSQL service) hoặc Docker để kết nối cơ sở dữ liệu.'
        }
    }

    $env:DB_HOST = $dbHost
    $env:DB_NAME = $dbName
    $env:DB_USER = $dbUser
    $env:DB_USERNAME = $dbUser
    $env:DB_PASS = $dbPassword
    $env:DB_PASSWORD = $dbPassword
    $env:PGHOST = $dbHost
    $env:PGPORT = "$($env:DB_PORT)"
    $env:PGDATABASE = $dbName
    $env:PGUSER = $dbUser
    $env:PGPASSWORD = $dbPassword

    # ==============================================================================
    # 4. ĐỒNG BỘ CẤU HÌNH CHO AI SERVICE (.env)
    # ==============================================================================
    $backendRoot = Join-Path $projectRoot 'backend'
    $aiEnvFile = Join-Path $backendRoot 'ai-service\.env'
    $aiDbUrl = "postgresql://${env:DB_USER}:${env:DB_PASSWORD}@${env:DB_HOST}:${env:DB_PORT}/${env:DB_NAME}"
    $aiPort = if ($env:PORT_AI_SERVICE) { $env:PORT_AI_SERVICE } elseif ($env:AI_PORT) { $env:AI_PORT } else { '8089' }
    $geminiKey = if ($env:GEMINI_API_KEY) { $env:GEMINI_API_KEY } else { '' }
    $llmModel = if ($env:LLM_MODEL) { $env:LLM_MODEL } else { 'gemini-3-flash-preview' }
    $embModel = if ($env:EMBEDDING_MODEL) { $env:EMBEDDING_MODEL } else { 'models/gemini-embedding-001' }

    @"
PORT=$aiPort
GEMINI_API_KEY=$geminiKey
LLM_MODEL=$llmModel
EMBEDDING_MODEL=$embModel
DATABASE_URL=$aiDbUrl
FALLBACK_SQLITE=True
TOP_K=3
SIMILARITY_THRESHOLD=0.10
"@ | Set-Content -LiteralPath $aiEnvFile -Encoding UTF8

    # ==============================================================================
    # 5. BUILD VÀ CHUẨN BỊ BACKEND & FRONTEND
    # ==============================================================================
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

    # ==============================================================================
    # 6. KHỞI CHẠY 10 MICROSERVICES VÀ FRONTEND
    # ==============================================================================
    $services = @(
        [pscustomobject]@{ Name = 'api-gateway'; Port = if ($env:PORT_API_GATEWAY) { [int]$env:PORT_API_GATEWAY } else { 8080 }; Jar = 'api-gateway\target\api-gateway-1.0.0-SNAPSHOT.jar' },
        [pscustomobject]@{ Name = 'identity-service'; Port = if ($env:PORT_IDENTITY_SERVICE) { [int]$env:PORT_IDENTITY_SERVICE } else { 8081 }; Jar = 'identity-service\target\identity-service-1.0.0-SNAPSHOT.jar' },
        [pscustomobject]@{ Name = 'farm-service'; Port = if ($env:PORT_FARM_SERVICE) { [int]$env:PORT_FARM_SERVICE } else { 8082 }; Jar = 'farm-service\target\farm-service-1.0.0-SNAPSHOT.jar' },
        [pscustomobject]@{ Name = 'knowledge-service'; Port = if ($env:PORT_KNOWLEDGE_SERVICE) { [int]$env:PORT_KNOWLEDGE_SERVICE } else { 8083 }; Jar = 'knowledge-service\target\knowledge-service-1.0.0-SNAPSHOT.jar' },
        [pscustomobject]@{ Name = 'rental-service'; Port = if ($env:PORT_RENTAL_SERVICE) { [int]$env:PORT_RENTAL_SERVICE } else { 8084 }; Jar = 'rental-service\target\rental-service-1.0.0-SNAPSHOT.jar' },
        [pscustomobject]@{ Name = 'payment-service'; Port = if ($env:PORT_PAYMENT_SERVICE) { [int]$env:PORT_PAYMENT_SERVICE } else { 8085 }; Jar = 'payment-service\target\payment-service-1.0.0-SNAPSHOT.jar' },
        [pscustomobject]@{ Name = 'cultivation-service'; Port = if ($env:PORT_CULTIVATION_SERVICE) { [int]$env:PORT_CULTIVATION_SERVICE } else { 8086 }; Jar = 'cultivation-service\target\cultivation-service-1.0.0-SNAPSHOT.jar' },
        [pscustomobject]@{ Name = 'communication-service'; Port = if ($env:PORT_COMMUNICATION_SERVICE) { [int]$env:PORT_COMMUNICATION_SERVICE } else { 8087 }; Jar = 'communication-service\target\communication-service-1.0.0-SNAPSHOT.jar' },
        [pscustomobject]@{ Name = 'monitoring-service'; Port = if ($env:PORT_MONITORING_SERVICE) { [int]$env:PORT_MONITORING_SERVICE } else { 8088 }; Jar = 'monitoring-service\target\monitoring-service-1.0.0-SNAPSHOT.jar' },
        [pscustomobject]@{ Name = 'ai-service'; Port = if ($env:PORT_AI_SERVICE) { [int]$env:PORT_AI_SERVICE } else { 8089 }; Jar = 'ai-service\target\ai-service-1.0.0-SNAPSHOT.jar' }
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

    $rmHost = if ($env:RABBITMQ_HOST) { $env:RABBITMQ_HOST } else { 'localhost' }
    $rmPort = if ($env:RABBITMQ_PORT) { $env:RABBITMQ_PORT } else { '5672' }
    $rmUser = if ($env:RABBITMQ_USER) { $env:RABBITMQ_USER } else { 'guest' }
    $rmPass = if ($env:RABBITMQ_PASSWORD) { $env:RABBITMQ_PASSWORD } else { 'guest' }

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
            "-Dspring.datasource.url=$env:DB_URL",
            "-Dspring.datasource.username=$env:DB_USER",
            "-Dspring.datasource.password=$env:DB_PASSWORD",
            "-Dspring.datasource.hikari.maximum-pool-size=5",
            "-Dspring.datasource.hikari.minimum-idle=1",
            "-DDB_URL=$env:DB_URL",
            "-DDB_HOST=$env:DB_HOST",
            "-DDB_PORT=$env:DB_PORT",
            "-DDB_NAME=$env:DB_NAME",
            "-DDB_USER=$env:DB_USER",
            "-DDB_PASS=$env:DB_PASSWORD",
            "-DDB_PASSWORD=$env:DB_PASSWORD",
            "-Dspring.rabbitmq.host=$rmHost",
            "-Dspring.rabbitmq.port=$rmPort",
            "-Dspring.rabbitmq.username=$rmUser",
            "-Dspring.rabbitmq.password=$rmPass",
            "-DVNP_TMN_CODE=$($env:VNP_TMN_CODE)",
            "-DVNP_HASH_SECRET=$($env:VNP_HASH_SECRET)",
            "-DVNP_PAY_URL=$($env:VNP_PAY_URL)",
            "-DVNP_RETURN_URL=$($env:VNP_RETURN_URL)",
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

    $frontendPort = if ($env:PORT_FRONTEND) { [int]$env:PORT_FRONTEND } else { 3000 }
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

    # ==============================================================================
    # 7. KIỂM TRA TRẠNG THÁI SẴN SÀNG CỦA CÁC CỔNG
    # ==============================================================================
    function Get-ServiceNameByPort {
        param([int]$targetPort)
        if ($targetPort -eq $frontendPort) { return 'frontend' }
        foreach ($s in $services) {
            if ($s.Port -eq $targetPort) {
                return $s.Name
            }
        }
        return "service-$targetPort"
    }

    $ports = @($services | ForEach-Object { $_.Port }) + $frontendPort
    $deadline = (Get-Date).AddSeconds(90)
    $pendingPorts = @($ports)
    Write-Host 'Đang đợi các dịch vụ khởi động...' -ForegroundColor Cyan
    while ($pendingPorts.Count -gt 0 -and (Get-Date) -lt $deadline) {
        $justReady = @($pendingPorts | Where-Object {
            Get-NetTCPConnection -LocalPort $_ -State Listen -ErrorAction SilentlyContinue
        })
        foreach ($p in $justReady) {
            $svcName = Get-ServiceNameByPort -targetPort $p
            Write-Host "  -> Cổng $p ($svcName) đã sẵn sàng!" -ForegroundColor Green
        }
        $pendingPorts = @($pendingPorts | Where-Object {
            -not (Get-NetTCPConnection -LocalPort $_ -State Listen -ErrorAction SilentlyContinue)
        })
        if ($pendingPorts.Count -gt 0) {
            Start-Sleep -Seconds 2
        }
    }
    foreach ($port in $pendingPorts) {
        $svcName = Get-ServiceNameByPort -targetPort $port
        Write-Warning "Cổng $port ($svcName) chưa phản hồi kịp sau 90s. Kiểm tra log tại: $runtimeDir."
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

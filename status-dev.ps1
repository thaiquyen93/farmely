$ErrorActionPreference = 'SilentlyContinue'

$services = @(
    [pscustomobject]@{ Port = 3000; Name = 'frontend'; Type = 'React Vite Dev Server'; Url = 'http://localhost:3000' },
    [pscustomobject]@{ Port = 8080; Name = 'api-gateway'; Type = 'Spring Cloud Gateway'; Url = 'http://localhost:8080' },
    [pscustomobject]@{ Port = 8081; Name = 'identity-service'; Type = 'Auth & Users Service'; Url = 'http://localhost:8081/swagger-ui.html' },
    [pscustomobject]@{ Port = 8082; Name = 'farm-service'; Type = 'Lands & Plots Service'; Url = 'http://localhost:8082/swagger-ui.html' },
    [pscustomobject]@{ Port = 8083; Name = 'knowledge-service'; Type = 'Crops & Knowledge Service'; Url = 'http://localhost:8083/swagger-ui.html' },
    [pscustomobject]@{ Port = 8084; Name = 'rental-service'; Type = 'Contracts & Booking Service'; Url = 'http://localhost:8084/swagger-ui.html' },
    [pscustomobject]@{ Port = 8085; Name = 'payment-service'; Type = 'VNPay & Payments Service'; Url = 'http://localhost:8085/swagger-ui.html' },
    [pscustomobject]@{ Port = 8086; Name = 'cultivation-service'; Type = 'Tasks & Farming Diary Service'; Url = 'http://localhost:8086/swagger-ui.html' },
    [pscustomobject]@{ Port = 8087; Name = 'communication-service'; Type = 'Chat & Support Service'; Url = 'http://localhost:8087/swagger-ui.html' },
    [pscustomobject]@{ Port = 8088; Name = 'monitoring-service'; Type = 'IoT & Sensors Service'; Url = 'http://localhost:8088/swagger-ui.html' },
    [pscustomobject]@{ Port = 8089; Name = 'ai-service'; Type = 'FastAPI Gemini RAG Service'; Url = 'http://localhost:8089/docs' }
)

Write-Host ''
Write-Host '========================================================================' -ForegroundColor Cyan
Write-Host '               FARMELY SYSTEM STATUS CHECK (11 SERVICES)' -ForegroundColor Cyan
Write-Host '========================================================================' -ForegroundColor Cyan

$onlineCount = 0
foreach ($s in $services) {
    $conn = Get-NetTCPConnection -LocalPort $s.Port -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        $onlineCount++
        Write-Host ('  [ONLINE]  Cổng {0,-4} : {1,-22} ({2})' -f $s.Port, $s.Name, $s.Type) -ForegroundColor Green
    } else {
        Write-Host ('  [OFFLINE] Cổng {0,-4} : {1,-22} (Chưa sẵn sàng)' -f $s.Port, $s.Name) -ForegroundColor Red
    }
}

Write-Host '------------------------------------------------------------------------' -ForegroundColor Cyan
if ($onlineCount -eq $services.Count) {
    Write-Host "  Tất cả $onlineCount/$($services.Count) dịch vụ đang HOẠT ĐỘNG BÌNH THƯỜNG!" -ForegroundColor Green
} else {
    Write-Host "  Hiện có $onlineCount/$($services.Count) dịch vụ đang hoạt động." -ForegroundColor Yellow
}
Write-Host '========================================================================' -ForegroundColor Cyan
Write-Host '  Truy cập Nền tảng Frontend : http://localhost:3000' -ForegroundColor White
Write-Host '  Truy cập API Gateway       : http://localhost:8080' -ForegroundColor White
Write-Host '========================================================================' -ForegroundColor Cyan
Write-Host ''

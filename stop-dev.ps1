$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    docker compose down
    if ($LASTEXITCODE -ne 0) { throw 'Không thể dừng Farmely Docker stack.' }
    Write-Host 'Đã dừng các container Farmely. Volume PostgreSQL vẫn được giữ nguyên.'
}
finally { Pop-Location }

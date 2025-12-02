# Fix PowerShell script encoding to UTF-8 with BOM
# Usage: powershell -ExecutionPolicy Bypass -File fix-ps1-encoding.ps1

$ErrorActionPreference = "Stop"

Write-Host "Fixing PowerShell script file encoding..." -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$files = @(
    "deploy-all.ps1",
    "backend\deploy.ps1",
    "frontend\deploy.ps1"
)

foreach ($file in $files) {
    $fullPath = Join-Path $scriptPath $file
    if (Test-Path $fullPath) {
        Write-Host "Processing: $file" -ForegroundColor Yellow
        try {
            $content = Get-Content $fullPath -Raw -Encoding UTF8
            $utf8WithBom = New-Object System.Text.UTF8Encoding $true
            [System.IO.File]::WriteAllText($fullPath, $content, $utf8WithBom)
            Write-Host "  [OK] Encoding fixed" -ForegroundColor Green
        } catch {
            Write-Host "  [ERROR] $_" -ForegroundColor Red
        }
    } else {
        Write-Host "  [SKIP] File not found: $file" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Encoding fix completed!" -ForegroundColor Green
Write-Host "You can now run .\deploy-all.ps1" -ForegroundColor Cyan

# 修复 PowerShell 脚本文件编码
# 将所有 .ps1 文件转换为 UTF-8 with BOM 编码

Write-Host "正在修复 PowerShell 脚本文件编码..." -ForegroundColor Cyan

$files = @(
    "deploy-all.ps1",
    "backend\deploy.ps1",
    "frontend\deploy.ps1"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "处理: $file" -ForegroundColor Yellow
        $content = Get-Content $file -Raw -Encoding UTF8
        [System.IO.File]::WriteAllText((Resolve-Path $file), $content, [System.Text.UTF8Encoding]::new($true))
        Write-Host "  ✓ 完成" -ForegroundColor Green
    } else {
        Write-Host "  ✗ 文件不存在: $file" -ForegroundColor Red
    }
}

Write-Host "`n编码修复完成！" -ForegroundColor Green


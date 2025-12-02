# Unity 日志分析系统 - 一键部署所有服务
# PowerShell 脚本

param(
    [switch]$SkipInstall,      # 跳过依赖安装
    [switch]$SkipBuild,         # 跳过构建
    [switch]$Production,        # 生产模式
    [switch]$Dev,               # 开发模式（不构建，直接启动开发服务器）
    [switch]$Preview            # 前端预览模式（构建后启动预览服务器）
)

# 设置控制台编码为 UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ErrorActionPreference = "Stop"

# 颜色输出函数
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success { Write-ColorOutput Green $args }
function Write-Error { Write-ColorOutput Red $args }
function Write-Info { Write-ColorOutput Cyan $args }
function Write-Warning { Write-ColorOutput Yellow $args }

# 获取脚本所在目录
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Info "========================================="
Write-Info "  Unity 日志分析系统 - 全栈部署"
Write-Info "========================================="
Write-Output ""

# 检查 Node.js
Write-Info "检查 Node.js 环境..."
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Success "✓ Node.js 版本: $nodeVersion"
    Write-Success "✓ npm 版本: $npmVersion"
} catch {
    Write-Error "✗ 未找到 Node.js，请先安装 Node.js (https://nodejs.org/)"
    exit 1
}
Write-Output ""

# 获取本机 IP（用于内网访问）
Write-Info "获取本机 IP 地址..."
try {
    $ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress
    if ($ipAddress) {
        Write-Success "✓ 本机 IP: $ipAddress"
    } else {
        Write-Warning "⚠ 无法自动获取 IP 地址"
        $ipAddress = "localhost"
    }
} catch {
    Write-Warning "⚠ 无法获取 IP 地址，使用 localhost"
    $ipAddress = "localhost"
}
Write-Output ""

# 部署后端
Write-Info "========================================="
Write-Info "  部署后端服务"
Write-Info "========================================="
Write-Output ""

$backendPath = Join-Path $ScriptDir "backend"
if (-not (Test-Path $backendPath)) {
    Write-Error "✗ 后端目录不存在: $backendPath"
    exit 1
}

Push-Location $backendPath

if ($Dev) {
    Write-Info "启动后端开发服务器..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run dev" -WindowStyle Normal
    Start-Sleep -Seconds 2
} else {
    $backendArgs = @()
    if ($SkipInstall) { $backendArgs += "-SkipInstall" }
    if ($SkipBuild) { $backendArgs += "-SkipBuild" }
    if ($Production) { $backendArgs += "-Production" }
    
    $allArgs = @("-NoExit", "-File", "deploy.ps1") + $backendArgs
    Start-Process powershell -ArgumentList $allArgs -WindowStyle Normal
    Start-Sleep -Seconds 3
}

Pop-Location

# 等待后端启动
Write-Info "等待后端服务启动..."
Start-Sleep -Seconds 5

# 部署前端
Write-Info "========================================="
Write-Info "  部署前端服务"
Write-Info "========================================="
Write-Output ""

$frontendPath = Join-Path $ScriptDir "frontend"
if (-not (Test-Path $frontendPath)) {
    Write-Error "✗ 前端目录不存在: $frontendPath"
    exit 1
}

# 检查前端 .env 文件
$envFile = Join-Path $frontendPath ".env"
if (-not (Test-Path $envFile)) {
    Write-Warning "⚠ 前端 .env 文件不存在，正在创建..."
    $apiUrl = "http://$ipAddress`:3000/api/v1"
    @"
VITE_API_BASE_URL=$apiUrl
"@ | Out-File -FilePath $envFile -Encoding UTF8
    Write-Success "✓ 已创建 .env 文件，API 地址: $apiUrl"
    Write-Output ""
}

Push-Location $frontendPath

if ($Dev) {
    Write-Info "启动前端开发服务器..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev" -WindowStyle Normal
    Start-Sleep -Seconds 2
} else {
    $frontendArgs = @()
    if ($SkipInstall) { $frontendArgs += "-SkipInstall" }
    if ($SkipBuild) { $frontendArgs += "-SkipBuild" }
    # 默认使用预览模式（构建后启动预览服务器）
    if ($Preview -or (-not $SkipBuild)) { $frontendArgs += "-Preview" }
    if ($Production) { $frontendArgs += "-Production" }
    
    $allArgs = @("-NoExit", "-File", "deploy.ps1") + $frontendArgs
    Start-Process powershell -ArgumentList $allArgs -WindowStyle Normal
    Start-Sleep -Seconds 2
}

Pop-Location

# 完成
Write-Output ""
Write-Info "========================================="
Write-Success "部署完成！"
Write-Info "========================================="
Write-Output ""
Write-Info "服务地址:"
Write-Output "  前端: http://localhost:5173"
Write-Output "  后端: http://localhost:3000"
if ($ipAddress -ne "localhost") {
    Write-Output ""
    Write-Info "内网访问:"
    Write-Output "  前端: http://$ipAddress`:5173"
    Write-Output "  后端: http://$ipAddress`:3000"
}
Write-Output ""
Write-Warning "提示: 服务已在新的 PowerShell 窗口中启动"
Write-Warning ("      关闭对应的窗口即可停止服务")
Write-Output ""


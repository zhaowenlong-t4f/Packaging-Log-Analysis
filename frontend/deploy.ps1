# Unity 日志分析系统 - 前端一键部署脚本
# PowerShell 部署脚本

param(
    [switch]$SkipInstall,      # 跳过依赖安装
    [switch]$SkipBuild,        # 跳过构建
    [switch]$Preview,           # 预览模式（构建后启动预览服务器）
    [switch]$Production        # 生产模式
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

# 检查是否在正确的目录
if (-not (Test-Path "package.json")) {
    Write-Error "错误: 请在 frontend 目录下运行此脚本"
    exit 1
}

Write-Info "========================================="
Write-Info "  Unity 日志分析系统 - 前端部署"
Write-Info "========================================="
Write-Output ""

# 检查 Node.js
Write-Info "[1/5] 检查 Node.js 环境..."
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

# 检查环境变量文件
Write-Info "[2/5] 检查环境配置..."
if (Test-Path ".env") {
    Write-Success "✓ 找到 .env 文件"
    $apiUrl = (Get-Content .env | Select-String "VITE_API_BASE_URL").ToString()
    if ($apiUrl) {
        Write-Info "  $apiUrl"
    }
} else {
    Write-Warning "⚠ 未找到 .env 文件，将使用默认配置"
    Write-Warning "  提示: 创建 .env 文件并设置 VITE_API_BASE_URL 以配置 API 地址"
}
Write-Output ""

# 检查 npm 依赖
if (-not $SkipInstall) {
    Write-Info "[3/5] 安装依赖包..."
    try {
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "npm install 失败"
        }
        Write-Success "✓ 依赖安装完成"
    } catch {
        Write-Error "✗ 依赖安装失败: $_"
        exit 1
    }
    Write-Output ""
} else {
    Write-Warning "[3/5] 跳过依赖安装"
    Write-Output ""
}

# 构建项目
if (-not $SkipBuild) {
    Write-Info "[4/5] 构建项目..."
    try {
        if ($Production) {
            $env:NODE_ENV = "production"
        }
        npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "构建失败"
        }
        Write-Success "✓ 项目构建完成"
    } catch {
        Write-Error "✗ 构建失败: $_"
        exit 1
    }
    Write-Output ""
} else {
    Write-Warning "[4/5] 跳过构建"
    Write-Output ""
}

# 检查构建输出
Write-Info "[5/5] 检查构建输出..."
if (-not (Test-Path "dist")) {
    Write-Error "✗ 构建输出目录不存在: dist"
    exit 1
}
$distFiles = (Get-ChildItem -Path "dist" -Recurse -File).Count
Write-Success "✓ 构建输出检查通过 (共 $distFiles 个文件)"
Write-Output ""

# 显示构建信息
$distSize = [math]::Round((Get-ChildItem -Path "dist" -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
Write-Info "构建信息:"
Write-Output "  输出目录: dist"
Write-Output "  总大小: $distSize MB"
Write-Output ""

# 启动服务
Write-Info "========================================="
Write-Success "部署完成！"
Write-Info "========================================="
Write-Output ""

if ($Preview) {
    Write-Info "启动预览服务器..."
    Write-Warning "提示: 按 Ctrl+C 停止服务"
    Write-Output ""
    npm run preview
} elseif (-not $SkipBuild) {
    Write-Success "构建完成！"
    Write-Info "提示:"
    Write-Output "  - 使用 'npm run preview' 启动预览服务器"
    Write-Output "  - 或使用 'npm run dev' 启动开发服务器"
    Write-Output "  - 或部署 dist 目录到 Web 服务器（如 Nginx）"
    Write-Output ""
} else {
    Write-Info "启动开发服务器..."
    Write-Warning "提示: 按 Ctrl+C 停止服务"
    Write-Output ""
    npm run dev
}


# Unity 日志分析系统 - 后端一键部署脚本
# PowerShell 部署脚本

param(
    [switch]$SkipInstall,      # 跳过依赖安装
    [switch]$SkipBuild,        # 跳过构建
    [switch]$SkipPrisma,       # 跳过 Prisma 生成
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
    Write-Error "错误: 请在 backend 目录下运行此脚本"
    exit 1
}

Write-Info "========================================="
Write-Info "  Unity 日志分析系统 - 后端部署"
Write-Info "========================================="
Write-Output ""

# 检查 Node.js
Write-Info "[1/6] 检查 Node.js 环境..."
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

# 检查 npm 依赖
if (-not $SkipInstall) {
    Write-Info "[2/6] 安装依赖包..."
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
    Write-Warning "[2/6] 跳过依赖安装"
    Write-Output ""
}

# Prisma 生成
if (-not $SkipPrisma) {
    Write-Info "[3/6] 生成 Prisma Client..."
    try {
        npm run prisma:generate
        if ($LASTEXITCODE -ne 0) {
            throw "Prisma 生成失败"
        }
        Write-Success "✓ Prisma Client 生成完成"
    } catch {
        Write-Error "✗ Prisma 生成失败: $_"
        exit 1
    }
    Write-Output ""
} else {
    Write-Warning "[3/6] 跳过 Prisma 生成"
    Write-Output ""
}

# 构建项目
if (-not $SkipBuild) {
    Write-Info "[4/6] 构建项目..."
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
    Write-Warning "[4/6] 跳过构建"
    Write-Output ""
}

# 检查构建输出
Write-Info "[5/6] 检查构建输出..."
if (-not (Test-Path "dist/server.js")) {
    Write-Error "✗ 构建输出文件不存在: dist/server.js"
    exit 1
}
Write-Success "✓ 构建输出检查通过"
Write-Output ""

# 显示环境信息
Write-Info "[6/6] 环境信息..."
$port = if ($env:PORT) { $env:PORT } else { "3000" }
$nodeEnv = if ($env:NODE_ENV) { $env:NODE_ENV } else { "development" }
$databaseUrl = if ($env:DATABASE_URL) { $env:DATABASE_URL } else { "file:./prisma/data/app.db" }
Write-Output "  端口: $port"
Write-Output "  环境: $nodeEnv"
Write-Output "  数据库: $databaseUrl"
Write-Output ""

# 启动服务
Write-Info "========================================="
Write-Success "部署完成！正在启动服务..."
Write-Info "========================================="
Write-Output ""

if ($Production) {
    Write-Info "启动生产模式服务..."
    npm start
} else {
    Write-Info "启动开发模式服务..."
    Write-Warning "提示: 按 Ctrl+C 停止服务"
    Write-Output ""
    npm run dev
}


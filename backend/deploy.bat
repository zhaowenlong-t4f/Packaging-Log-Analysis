@echo off
chcp 65001 >nul
REM Unity 日志分析系统 - 后端一键部署脚本（批处理版本）

cd /d "%~dp0"

echo =========================================
echo   Unity 日志分析系统 - 后端部署
echo =========================================
echo.

REM 检查 Node.js
echo [1/6] 检查 Node.js 环境...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js (https://nodejs.org/)
    pause
    exit /b 1
)

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] Node.js 未正确安装
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [成功] Node.js 版本: %NODE_VERSION%
echo [成功] npm 版本: %NPM_VERSION%
echo.

REM 安装依赖
echo [2/6] 安装依赖包...
call npm install
if %errorlevel% neq 0 (
    echo [错误] 依赖安装失败
    pause
    exit /b 1
)
echo [成功] 依赖安装完成
echo.

REM Prisma 生成
echo [3/6] 生成 Prisma Client...
call npm run prisma:generate
if %errorlevel% neq 0 (
    echo [错误] Prisma 生成失败
    pause
    exit /b 1
)
echo [成功] Prisma Client 生成完成
echo.

REM 构建项目
echo [4/6] 构建项目...
call npm run build
if %errorlevel% neq 0 (
    echo [错误] 构建失败
    pause
    exit /b 1
)
echo [成功] 项目构建完成
echo.

REM 检查构建输出
echo [5/6] 检查构建输出...
if not exist "dist\server.js" (
    echo [错误] 构建输出文件不存在: dist\server.js
    pause
    exit /b 1
)
echo [成功] 构建输出检查通过
echo.

REM 环境信息
echo [6/6] 环境信息...
if defined PORT (
    echo   端口: %PORT%
) else (
    echo   端口: 3000
)
if defined NODE_ENV (
    echo   环境: %NODE_ENV%
) else (
    echo   环境: development
)
echo.

REM 启动服务
echo =========================================
echo [成功] 部署完成！正在启动服务...
echo =========================================
echo.
echo 提示: 按 Ctrl+C 停止服务
echo.

call npm run dev

pause


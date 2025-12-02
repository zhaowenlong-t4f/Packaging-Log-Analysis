@echo off
chcp 65001 >nul
REM Unity 日志分析系统 - 前端一键部署脚本（批处理版本）

cd /d "%~dp0"

echo =========================================
echo   Unity 日志分析系统 - 前端部署
echo =========================================
echo.

REM 检查 Node.js
echo [1/5] 检查 Node.js 环境...
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

REM 检查环境变量文件
echo [2/5] 检查环境配置...
if exist ".env" (
    echo [成功] 找到 .env 文件
    findstr /C:"VITE_API_BASE_URL" .env >nul 2>&1
    if %errorlevel% equ 0 (
        for /f "tokens=*" %%i in ('findstr /C:"VITE_API_BASE_URL" .env') do echo   %%i
    )
) else (
    echo [警告] 未找到 .env 文件，将使用默认配置
    echo   提示: 创建 .env 文件并设置 VITE_API_BASE_URL 以配置 API 地址
)
echo.

REM 安装依赖
echo [3/5] 安装依赖包...
call npm install
if %errorlevel% neq 0 (
    echo [错误] 依赖安装失败
    pause
    exit /b 1
)
echo [成功] 依赖安装完成
echo.

REM 构建项目
echo [4/5] 构建项目...
call npm run build
if %errorlevel% neq 0 (
    echo [错误] 构建失败
    pause
    exit /b 1
)
echo [成功] 项目构建完成
echo.

REM 检查构建输出
echo [5/5] 检查构建输出...
if not exist "dist" (
    echo [错误] 构建输出目录不存在: dist
    pause
    exit /b 1
)
echo [成功] 构建输出检查通过
echo.

REM 启动服务
echo =========================================
echo [成功] 部署完成！
echo =========================================
echo.
echo 提示:
echo   - 使用 'npm run preview' 启动预览服务器
echo   - 或使用 'npm run dev' 启动开发服务器
echo   - 或部署 dist 目录到 Web 服务器（如 Nginx）
echo.

call npm run preview

pause


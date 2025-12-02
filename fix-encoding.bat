@echo off
chcp 65001 >nul
echo 正在修复 PowerShell 脚本文件编码...
echo.

powershell -ExecutionPolicy Bypass -File "fix-ps1-encoding.ps1"

pause


#!/bin/bash

echo "🚀 启动包装日志分析系统后端..."

# 检查 Node.js 版本
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 版本过低，需要 18+，当前版本: $(node -v)"
    exit 1
fi

echo "✅ Node.js 版本检查通过: $(node -v)"

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在 backend 目录下运行此脚本"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
if command -v pnpm &> /dev/null; then
    pnpm install
elif command -v yarn &> /dev/null; then
    yarn install
else
    npm install
fi

# 创建数据目录
echo "📁 创建数据目录..."
mkdir -p data/temp

# 生成 Prisma 客户端
echo "🗄️ 生成数据库客户端..."
npx prisma generate

# 运行数据库迁移
echo "🗃️ 初始化数据库..."
npx prisma migrate dev --name init

echo ""
echo "🎉 后端启动完成！"
echo ""
echo "开发模式启动命令:"
echo "  npm run dev"
echo ""
echo "生产模式启动命令:"
echo "  npm run build"
echo "  npm start"
echo ""
echo "API 文档: http://localhost:3000/api/v1"
echo "健康检查: http://localhost:3000/health"
echo "数据库管理: npm run prisma:studio"
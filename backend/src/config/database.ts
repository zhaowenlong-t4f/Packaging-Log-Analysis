import { PrismaClient } from '@prisma/client';

const isDev = (process.env['NODE_ENV'] || 'development') === 'development';

const prisma = new PrismaClient({
  log: isDev ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// 添加错误处理
prisma.$on('error', (e: any) => {
  console.error('Prisma错误:', e);
});

export default prisma;
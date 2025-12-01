import { PrismaClient } from '@prisma/client';

const isDev = (process.env['NODE_ENV'] || 'development') === 'development';

const prisma = new PrismaClient({
  log: isDev ? ['query', 'info'] : ['error'],
});

export default prisma;

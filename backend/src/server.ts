import 'dotenv/config';
import app from './app';
import { logger } from './utils/logger';

const PORT = parseInt(process.env['PORT'] || '3000', 10);

console.log('✅ 开始启动服务器...');
console.log(`PORT: ${PORT}`);
console.log(`NODE_ENV: ${process.env['NODE_ENV']}`);

const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env['NODE_ENV']}`);
  logger.info(`Database: ${process.env['DATABASE_URL']}`);
  console.log('✅ 服务器启动成功!');
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// 错误处理
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection:', { reason });
  process.exit(1);
});

export default server;
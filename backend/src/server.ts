/**
 * 服务器启动文件
 */

import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

const server = app.listen(env.port, '0.0.0.0', () => {
  console.log(`🚀 Server is running on http://0.0.0.0:${env.port}`);
  console.log(`📝 Environment: ${env.nodeEnv}`);
  console.log(`💾 Database: ${env.databaseUrl}`);
  console.log(`🌐 Access from network: http://<your-ip>:${env.port}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});


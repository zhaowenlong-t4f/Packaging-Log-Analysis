/**
 * Express 应用主文件
 */

import express, { Express } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { requestIdMiddleware } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

/**
 * 创建 Express 应用实例
 */
export function createApp(): Express {
  const app = express();

  // 请求追踪 ID 中间件（最先执行）
  app.use(requestIdMiddleware);

  // 基础中间件
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // 请求日志中间件
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(
        `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`
      );
    });
    next();
  });

  // 健康检查端点
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.nodeEnv,
    });
  });

  // 注册路由
  app.use(routes);

  // 404 处理
  app.use((_req, res) => {
    res.status(404).json({
      code: 404,
      message: 'Not Found',
      data: null,
      timestamp: new Date().toISOString(),
    });
  });

  // 全局错误处理（必须最后注册）
  app.use(errorHandler);

  return app;
}


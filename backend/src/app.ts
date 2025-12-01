import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { validateContentType } from './middleware/validateContentType';
import routes from './routes';

const app = express();

// 安全中间件
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env['NODE_ENV'] === 'production' ? ['your-frontend-domain.com'] : true,
  credentials: true
}));

// 压缩
app.use(compression());

// 请求日志
app.use(requestLogger);

// JSON 解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 内容类型验证
app.use(validateContentType);

// API 路由
app.use('/api/v1', routes);

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 处理
app.use('*', (_req, res) => {
  res.status(404).json({
    code: 404,
    message: 'API endpoint not found',
    data: null,
    timestamp: new Date().toISOString()
  });
});

// 错误处理
app.use(errorHandler);

export default app;
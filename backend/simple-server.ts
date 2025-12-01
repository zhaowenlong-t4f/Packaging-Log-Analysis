import 'dotenv/config';
import express from 'express';

const app = express();
const PORT = 3000;

// 简单的中间件测试
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/v1/rules', (req, res) => {
  res.json({ code: 0, message: 'success', data: { items: [] } });
});

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ 简单服务器启动在 http://127.0.0.1:${PORT}`);
  console.log(`PID: ${process.pid}`);
});

server.on('error', (err: any) => {
  console.error('❌ 服务器错误:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n关闭...');
  server.close(() => process.exit(0));
});

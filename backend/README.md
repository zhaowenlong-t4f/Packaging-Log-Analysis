# 包装日志分析系统 - 后端

基于 Node.js + Express + TypeScript + SQLite + Prisma 构建的轻量级日志分析后端系统。

## 技术栈

- **运行时**: Node.js 18+
- **框架**: Express.js
- **语言**: TypeScript
- **数据库**: SQLite + Prisma ORM
- **验证**: Zod
- **日志**: Pino
- **其他**: Multer（文件上传）、Axios（HTTP客户端）

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 初始化数据库

```bash
# 生成 Prisma 客户端
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# （可选）打开数据库管理界面
npm run prisma:studio
```

### 3. 启动开发服务器

```bash
# 开发模式（带热重载）
npm run dev

# 或构建后启动
npm run build
npm start
```

服务器将在 `http://localhost:3000` 启动。

## API 接口

### 基础信息

- **Base URL**: `http://localhost:3000/api/v1`
- **认证**: 当前版本暂无认证
- **响应格式**: 统一的 JSON 格式

### 日志分析接口

#### 分析日志
```http
POST /api/v1/logs/analyze
Content-Type: application/json

{
  "uploadType": "text|url|file",
  "content": "日志内容或URL或Base64编码",
  "fileName": "build.log",
  "metadata": {
    "projectName": "MyProject",
    "buildVersion": "1.0.0"
  }
}
```

#### 获取分析详情
```http
GET /api/v1/logs/{analysisId}/details?pageNo=1&pageSize=20
```

### 规则管理接口

#### 获取规则列表
```http
GET /api/v1/rules?pageNo=1&pageSize=20&searchKeyword=error
```

#### 创建规则
```http
POST /api/v1/rules
Content-Type: application/json

{
  "name": "编译错误",
  "regex": "error CS\\d{4}: (.*)",
  "keywords": ["error", "CS"],
  "severity": "ERROR",
  "weight": 80,
  "solution": "修复 C# 语法错误",
  "categories": ["compilation", "csharp"]
}
```

#### 更新规则
```http
PUT /api/v1/rules/{ruleId}
```

#### 删除规则
```http
DELETE /api/v1/rules/{ruleId}
```

## 核心特性

### 🚀 高性能分析
- **关键词初筛**: 快速过滤80-95%的无关行
- **正则匹配**: 精确错误识别
- **上下文提取**: 提供错误前后文信息

### 📊 智能聚合
- **错误去重**: 相同错误自动合并
- **统计分析**: 按严重程度、出现频率排序
- **版本控制**: 规则历史记录和回滚

### 🔧 灵活配置
- **多源支持**: URL下载、本地文件、直接文本
- **格式检测**: 自动字符编码转换
- **分页查询**: 大数据量的高效分页

## 项目结构

```
backend/
├── src/
│   ├── config/           # 数据库配置
│   ├── controllers/      # 请求处理器
│   ├── middleware/       # 中间件
│   ├── routes/          # 路由定义
│   ├── schemas/         # Zod验证schema
│   ├── services/        # 业务逻辑
│   ├── types/           # TypeScript类型
│   ├── utils/           # 工具函数
│   ├── app.ts           # Express应用
│   └── server.ts        # 服务器入口
├── prisma/
│   └── schema.prisma    # 数据库schema
├── package.json
├── tsconfig.json
└── .env
```

## 环境配置

创建 `.env` 文件：

```bash
# 应用配置
NODE_ENV=development
PORT=3000

# 数据库
DATABASE_URL="file:./data/app.db"

# 文件上传
MAX_LOG_SIZE=524288000
TEMP_DIR=./data/temp

# 日志
LOG_LEVEL=info
```

## 数据库设计

### 核心表结构

- **logs**: 日志文件记录
- **rules**: 匹配规则
- **errors**: 分析出的错误
- **error_occurrences**: 错误出现位置
- **rule_histories**: 规则历史版本

### 关系图

```
logs (1) ──── (N) errors (1) ──── (N) error_occurrences
rules (1) ──── (N) errors
rules (1) ──── (N) rule_histories
```

## 性能优化

1. **数据库索引**: 关键字段自动索引
2. **查询优化**: 使用 Prisma 的查询优化
3. **内存管理**: 大文件流式处理
4. **缓存策略**: 规则缓存（可扩展到 Redis）

## 部署

### 开发环境
```bash
npm run dev
```

### 生产环境
```bash
npm run build
npm start
```

### Docker 部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY prisma ./prisma
RUN npx prisma generate
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

## 测试

```bash
# 运行测试
npm test

# 带覆盖率
npm run test:coverage
```

## 监控和日志

- **应用日志**: 使用 Pino 结构化日志
- **错误追踪**: 全局错误处理中间件
- **性能监控**: 请求响应时间记录
- **健康检查**: `/health` 端点

## 扩展计划

- [ ] 用户认证和权限管理
- [ ] Redis 缓存层
- [ ] 分布式部署支持
- [ ] 实时日志流分析
- [ ] 机器学习错误分类
- [ ] 多语言规则支持

## 贡献

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系

项目维护者 - your-email@example.com

项目链接: [https://github.com/your-username/log-analysis-backend](https://github.com/your-username/log-analysis-backend)
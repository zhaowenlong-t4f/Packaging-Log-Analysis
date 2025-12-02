# Unity 日志分析系统 - 后端服务

## 项目概述

Unity 日志分析系统后端是一个高性能、高可靠的日志处理和规则匹配引擎，负责：
- 日志接收、解析、存储
- 智能错误识别和分类
- 规则库管理和版本控制
- RESTful API 提供

## 技术栈

- **运行时**: Node.js 18+ LTS
- **框架**: Express.js 4.18+
- **语言**: TypeScript 5.3+
- **数据库**: SQLite 3.40+ (通过 Prisma)
- **ORM**: Prisma 5.7+
- **验证**: Zod 3.22+
- **HTTP 客户端**: axios 1.6+

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=file:./data/app.db
MAX_LOG_SIZE=524288000
MAX_UPLOAD_SIZE=524288000
TEMP_DIR=./data/temp
LOG_LEVEL=info
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# 导入初始规则数据（可选）
npm run prisma:seed
```

### 4. 启动服务

**开发模式**（热重载）：
```bash
npm run dev
```

**生产模式**：
```bash
npm run build
npm start
```

服务将在 `http://localhost:3000` 启动。

## API 文档

### 基础配置

- **基础 URL**: `http://localhost:3000/api/v1`
- **响应格式**: 所有 API 返回统一的 JSON 格式

```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "timestamp": "2025-12-01T10:30:45.123Z",
  "traceId": "xxx"
}
```

### 日志分析接口

#### 1. 上传日志并分析

**端点**: `POST /api/v1/logs/analyze`

**请求体**:
```json
{
  "uploadType": "url|file|text",
  "content": "string (URL / Base64 / Text)",
  "fileName": "build.log",
  "metadata": {
    "projectName": "ProjectX",
    "buildVersion": "1.0.0",
    "platform": "Android"
  }
}
```

**响应**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "analysisId": "uuid-1234",
    "fileName": "build.log",
    "uploadTime": "2025-12-01T10:30:45Z",
    "analyzeTime": 1500,
    "totalLines": 5000,
    "errorCount": 12,
    "warningCount": 45,
    "errors": [...]
  }
}
```

#### 2. 获取分析结果详情

**端点**: `GET /api/v1/logs/{analysisId}/details`

**查询参数**:
- `pageNo`: 页码（默认: 1）
- `pageSize`: 每页数量（默认: 20）
- `sortBy`: 排序字段
- `sortOrder`: 排序方向（asc/desc）
- `searchKeyword`: 搜索关键词
- `severityFilter`: 严重程度筛选（逗号分隔）

### 规则管理接口

#### 1. 获取规则列表

**端点**: `GET /api/v1/rules`

**查询参数**:
- `pageNo`: 页码
- `pageSize`: 每页数量
- `sortBy`: 排序字段（updatedAt/createdAt/severity/weight）
- `sortOrder`: 排序方向
- `searchKeyword`: 搜索关键词
- `categoryFilter`: 分类筛选
- `severityFilter`: 严重程度筛选
- `enabled`: 是否启用

#### 2. 创建规则

**端点**: `POST /api/v1/rules`

**请求体**:
```json
{
  "name": "规则名称",
  "regex": "error.*",
  "keywords": ["error"],
  "solution": "解决方案（Markdown）",
  "severity": "ERROR",
  "weight": 50,
  "categories": ["compilation"]
}
```

#### 3. 更新规则

**端点**: `PUT /api/v1/rules/{id}`

#### 4. 删除规则

**端点**: `DELETE /api/v1/rules/{id}`

#### 5. 批量删除规则

**端点**: `POST /api/v1/rules/batch-delete`

**请求体**:
```json
{
  "ruleIds": ["id1", "id2", "id3"]
}
```

#### 6. 导出规则

**端点**: `GET /api/v1/rules/export?ruleIds=id1,id2,id3`

#### 7. 导入规则

**端点**: `POST /api/v1/rules/import`

**请求**: multipart/form-data
- `file`: JSON 文件
- `conflictStrategy`: overwrite|skip|merge（默认: skip）

#### 8. 获取规则版本历史

**端点**: `GET /api/v1/rules/{id}/history`

#### 9. 回滚规则

**端点**: `POST /api/v1/rules/{id}/rollback/{versionId}`

#### 10. 验证规则

**端点**: `POST /api/v1/rules/validate`

**请求体**:
```json
{
  "ruleIds": ["id1", "id2"],
  "uploadType": "text",
  "content": "日志内容",
  "fileName": "test.log"
}
```

## 项目结构

```
backend/
├── src/
│   ├── controllers/      # 控制器
│   ├── services/         # 业务逻辑
│   ├── routes/           # 路由定义
│   ├── middleware/       # 中间件
│   ├── utils/            # 工具函数
│   ├── types/            # 类型定义
│   ├── schemas/          # Zod 验证 Schema
│   ├── config/           # 配置文件
│   ├── app.ts            # Express 应用
│   └── server.ts         # 服务器启动
├── prisma/
│   ├── schema.prisma     # 数据库 Schema
│   └── seed.ts           # 种子数据
├── data/                  # 数据目录（SQLite 文件）
└── package.json
```

## 开发命令

```bash
# 开发模式（热重载）
npm run dev

# 构建
npm run build

# 启动生产服务
npm start

# Prisma 相关
npm run prisma:generate    # 生成 Prisma Client
npm run prisma:migrate     # 运行迁移
npm run prisma:studio      # 打开 Prisma Studio
npm run prisma:seed        # 导入种子数据

# 代码检查
npm run lint
npm run lint:fix

# 代码格式化
npm run format
```

## 数据库管理

### 查看数据库

使用 Prisma Studio：
```bash
npm run prisma:studio
```

### 备份数据库

```bash
cp ./data/app.db ./backups/app-$(date +%Y%m%d-%H%M%S).db
```

### 恢复数据库

```bash
cp ./backups/app-20251201-100000.db ./data/app.db
```

## 性能指标

- **API 响应时间**: P95 ≤ 200ms
- **日志解析速度**: ≤ 100MB/30s
- **吞吐量**: ≥ 100 req/s
- **系统可用性**: 99.9%

## 错误处理

所有错误都返回统一的格式：

```json
{
  "code": 422,
  "message": "Validation failed",
  "data": {
    "errors": [
      {
        "field": "regex",
        "message": "Invalid regex pattern"
      }
    ]
  },
  "timestamp": "2025-12-01T10:30:45.123Z",
  "traceId": "xxx"
}
```

## 一键部署

### 使用 PowerShell 脚本（推荐）

```powershell
# 完整部署（安装依赖 + 构建 + 启动）
.\deploy.ps1

# 跳过依赖安装
.\deploy.ps1 -SkipInstall

# 跳过构建（仅启动）
.\deploy.ps1 -SkipBuild

# 生产模式
.\deploy.ps1 -Production

# 组合使用
.\deploy.ps1 -SkipInstall -Production
```

### 使用批处理脚本

直接双击 `deploy.bat` 文件，或在命令行运行：

```cmd
deploy.bat
```

### 手动部署

如果脚本无法运行，可以手动执行以下步骤：

```bash
# 1. 安装依赖
npm install

# 2. 生成 Prisma Client
npm run prisma:generate

# 3. 构建项目
npm run build

# 4. 启动服务（开发模式）
npm run dev

# 或启动服务（生产模式）
npm start
```

## 部署

### Docker 部署

```bash
# 构建镜像
docker build -t unity-log-analysis-backend .

# 运行容器
docker run -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e DATABASE_URL=file:./data/app.db \
  unity-log-analysis-backend
```

### 环境变量

生产环境需要设置以下环境变量：

- `NODE_ENV=production`
- `PORT=3000`
- `DATABASE_URL=file:./data/app.db`
- `MAX_LOG_SIZE=524288000`
- `LOG_LEVEL=info`

## 许可证

MIT


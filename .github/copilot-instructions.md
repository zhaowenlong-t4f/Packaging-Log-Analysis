# Copilot 编码指南 - Packaging Log Analysis

## 项目概览

**Unity 日志分析系统**：一个前后端分离的日志诊断平台，帮助游戏开发者快速定位构建打包问题。

### 核心功能
1. **日志上传与分析**：支持 URL、文件、文本三种方式上传日志，自动分类和聚合错误
2. **规则库管理**：支持正则表达式规则的 CRUD、版本控制、导入导出

### 架构分层
- **前端**：React/Vue（待实现）- 负责UI交互、文件处理
- **后端**：Node.js + Express + TypeScript - 负责日志分析、规则引擎
- **数据库**：SQLite + Prisma ORM - 轻量级嵌入式方案，无需额外部署

---

## 关键架构决策

### 为什么选 SQLite + Prisma？
- **部署简化**：无需独立数据库服务，所有数据存储在单个文件
- **高效开发**：Prisma 自动生成类型安全的 TypeScript 代码
- **足够性能**：100+ req/s 吞吐量，API P95 响应时间 ≤200ms

### 三层架构（routes → services → prisma）
```
Express 路由 → 业务服务 → Prisma ORM
   (快速路由)    (业务逻辑)   (数据访问)
```

**与常见模式的差异**：
- ❌ 移除了 repositories 层（Prisma 直接用在 services）
- ❌ 移除了 entities 层（用 Prisma schema + 自动类型代替）
- ✅ 简化中间件（只保留错误处理、验证、文件上传）
- ✅ 用 Zod 替代 class-validator（更轻）

---

## 日志分析核心算法

### 匹配流程（关键！）
```
原始日志行
    ↓ [快速筛选]
保留上下文行 + 关键词初筛（keywords 数组）
    ↓ [精确匹配]  
正则表达式匹配（regex）
    ↓ [聚合]
错误去重 + 计数 + 排序
    ↓ [存储]
数据库持久化
```

### 关键约束
1. **关键词初筛先于正则匹配**：提高性能（大幅减少正则开销）
2. **保留上下文**：匹配时需存储日志行前后 N 行便于调试
3. **错误聚合**：相同 errorType 的错误合并，显示出现次数和首末行号

### 规则数据结构（log_rules.json）
```json
{
  "id": "uuid",
  "name": "规则名称",
  "regex": "error CS\\d{4}: (.*)",
  "keywords": ["error", "CS"],      // 关键词数组
  "solution": "**markdown** 格式的解决方案",
  "severity": "CRITICAL|ERROR|WARNING|INFO",
  "weight": 100,                     // 排序权重
  "createdAt": "2025-11-24 06:18:55"
}
```

---

## 开发快速参考

### 文件结构
```
src/
├── controllers/      # 请求入口（验证、调用服务）
├── services/         # 业务逻辑（日志解析、规则匹配、分析）
├── middleware/       # Express 中间件（错误、验证、文件上传）
├── utils/            # 工具函数（正则匹配、文件处理、日志解析）
├── prisma/           # Prisma schema（数据库定义）
├── routes/           # API 路由定义
├── types/            # TypeScript 类型定义
├── config/           # 常量和环境配置
└── app.ts / server.ts # 应用入口
```

### 关键服务
1. **LogService**：日志接收、解析、存储（uploadType: url|file|text）
2. **RuleService**：规则 CRUD、版本管理、验证
3. **AnalysisService**：核心匹配引擎（关键词筛选 → 正则匹配 → 聚合）
4. **FileService**：文件下载、上传处理、编码转换

### API 核心端点（详见 API_Integration_Standard.md）
```
POST   /api/v1/logs/analyze              # 上传并分析日志
GET    /api/v1/logs/{id}/details         # 获取分析结果
GET    /api/v1/rules                     # 获取规则列表
POST   /api/v1/rules                     # 创建规则
PUT    /api/v1/rules/{id}                # 更新规则
POST   /api/v1/rules/validate            # 测试规则是否匹配
```

---

## 编码约定

### TypeScript 类型规范
- 使用 Prisma 生成的类型（如 `PrismaClient` 的模型类型）
- 自定义类型放在 `types/` 下，以 `.types.ts` 结尾
- API 请求/响应用 Zod 做运行时验证（不用 DTO 装饰器）

### 错误处理
- **业务错误**：`throw new Error("描述错误的消息")`
- **中间件捕获**：errorHandler 自动转换为 HTTP 状态码和 JSON 响应
- **标准响应格式**（详见 API_Integration_Standard.md）：
  ```json
  {
    "code": 200,
    "data": {...},
    "message": "ok"
  }
  ```

### 正则表达式最佳实践
- 编译时就缓存 RegExp 对象（不要每次都 `new RegExp()`）
- 添加注释说明规则目的（例如：`// 匹配 C# 编译错误 CS1234`)
- 测试数据在 log_rules.json 中有真实示例

---

## 性能优化要点

1. **关键词筛选必须在正则前**：避免对所有行执行昂贵的正则操作
2. **SQLite 索引**：在 logId 和 errorType 字段添加索引
3. **流式处理大文件**：不要一次性加载 50MB 日志到内存
4. **正则缓存**：预编译常用正则，存储在服务类属性中

---

## 常见开发场景

### 添加新匹配规则
1. 编辑 `log_rules.json`，添加规则条目
2. 在 AnalysisService 中测试（写单测验证正则）
3. 验证关键词初筛是否有效（避免漏匹配或过度匹配）

### 修改日志分析流程
1. 编辑 `services/analysisService.ts` 的匹配算法
2. 保证关键词筛选在正则前（性能约束）
3. 验证错误聚合逻辑（相同错误应该被合并）

### 实现规则版本控制
- RuleService 每次修改都记录 diff 到 ruleHistory 表
- 支持通过 GET /rules/{id}/history 查看历史
- 支持 POST /rules/{id}/rollback/{versionId} 回滚

---

## 参考文档
- `Backend_Technical_Specification.md` - 后端架构、数据库设计、API 接口完整定义
- `Frontend_Technical_Specification.md` - 前端组件、API 调用规范
- `API_Integration_Standard.md` - HTTP 标准、请求/响应格式、状态码规范
- `Demand.md` - 完整的功能需求列表

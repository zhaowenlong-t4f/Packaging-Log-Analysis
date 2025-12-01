# Unity 日志分析系统 - 后端技术文档

## 目录
1. [产品概述](#产品概述)
2. [功能需求](#功能需求)
3. [技术栈](#技术栈)
4. [系统架构](#系统架构)
5. [数据库设计](#数据库设计)
6. [核心算法](#核心算法)
7. [API 接口定义](#api-接口定义)
8. [数据验证规范](#数据验证规范)
9. [错误处理机制](#错误处理机制)
10. [部署与扩展](#部署与扩展)

---

## 产品概述

### 产品定位
Unity 日志分析系统后端是一个高性能、高可靠的日志处理和规则匹配引擎，负责：
- 日志接收、解析、存储
- 智能错误识别和分类
- 规则库管理和版本控制
- RESTful API 提供

### 系统目标

| 目标 | 指标 | 备注 |
|------|------|------|
| 吞吐量 | ≥ 100 req/s | 单机部署 |
| 日志解析速度 | ≤ 100MB/30s | 标准配置 |
| API 响应时间 | P95 ≤ 200ms | 列表查询 |
| 系统可用性 | 99.9% | 月度 SLA |
| 数据一致性 | ACID | 关键操作 |

---

## 功能需求

### 需求分解

#### 模块一：日志接收与解析

**职责**：
- 接收来自前端的日志数据（URL/文件/文本）
- 日志格式检测和自适应解析
- 临时存储原始日志
- 初步预处理（去重、字符编码检测）

**关键特性**：
1. **多源日志支持**
   - HTTP(S) URL 下载（支持断点续传）
   - 本地文件上传（流式处理）
   - 直接文本输入（内存流）

2. **日志预处理**
   - 字符编码转换（UTF-8、GBK、ANSI 等）
   - 行分割和规范化
   - 去除重复连续行
   - 保留原始文本以便追踪

#### 模块二：日志匹配与分类

**职责**：
- 将日志行与规则库进行智能匹配
- 错误聚合和去重
- 生成分析报告
- 存储匹配结果

**匹配流程**（核心算法，详见第 6 节）：
```
原始日志行 → 关键词初筛 → 正则精确匹配 → 错误聚合 → 结果存储
  (快速)      (中等)      (精确)        (合并)     (持久化)
```

#### 模块三：规则库管理

**职责**：
- 规则的 CRUD 操作
- 规则版本控制（记录历史）
- 规则分类和标签管理
- 规则导入导出
- 规则有效性验证

**规则属性**（与 JSON 格式一致）：
- `id`: UUID 唯一标识
- `name`: 规则名称
- `regex`: 正则表达式（编译并缓存）
- `keywords`: 关键词数组（用于初筛）
- `solution`: 解决方案（Markdown）
- `severity`: 严重程度
- `weight`: 权重（0-100）
- `categories`: 分类标签
- `createdAt`、`updatedAt`: 时间戳
- `enabled`: 启用/禁用状态

**版本管理**：
- 每次规则修改都生成一个新版本
- 保存修改前后的 diff
- 支持查看和回滚历史版本
- 记录修改人和修改时间

#### 模块四：数据查询和统计

**职责**：
- 提供分页查询接口
- 支持多维度搜索和筛选
- 统计数据聚合
- 性能优化（索引、缓存）

---

## 技术栈

### 后端技术选择

| 范畴 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 运行时 | Node.js | ≥18 LTS | 异步 I/O，高性能 |
| 框架 | Express.js | ≥4.18 | 轻量灵活，极简 HTTP 服务器 |
| 语言 | TypeScript | ≥4.5 | 类型安全，便于维护 |
| 数据库 | SQLite | ≥3.40 | 轻量级嵌入式数据库，无需独立部署 |
| ORM | Prisma | ≥5.0 | 现代 ORM，简洁查询，自动迁移 |
| 日志 | console/pino | ≥8.0 | 轻量结构化日志 |
| 验证 | zod | ≥3.22 | 运行时模式验证，轻量级 |
| 文件处理 | multer | ≥1.4 | 文件上传中间件 |
| HTTP 客户端 | axios | ≥1.4 | URL 下载和外部 API 调用 |
| 测试 | Vitest + Supertest | 最新 | 轻量快速的单元和集成测试 |

### 开发环境要求

```
Node.js: 18.0+ LTS
npm/pnpm: 最新稳定版
SQLite: 3.40+ (无需单独安装，npm 包自带)
Docker: 最新版（可选，用于部署）
操作系统: Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+)
```

### 技术选择说明

**为什么选择 SQLite + Prisma？**
- **SQLite**：无需独立数据库服务器，文件型存储，部署更简单
- **Prisma**：现代轻量的 ORM，自动类型生成，迁移简洁明了
- **移除 Redis**：大多数场景下 SQLite 足以满足，减少部署复杂度
- **简化验证**：用 Zod 替代 class-validator，更轻更灵活
- **简化日志**：用 pino 或原生 console，够用即可

---

## 系统架构

### 整体架构图

```
┌────────────────────────────────────────────────────────────────┐
│                       前端应用 (React)                          │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTP(S)
                         ↓
    ┌────────────────────────────────────────────────────────┐
    │            Express.js API 服务器                        │
    ├────────────────────────────────────────────────────────┤
    │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
    │  │ 路由层       │  │ 中间件层     │  │ 控制器层    │  │
    │  │ (Express)    │  │ (简化验证等) │  │ (业务逻辑)  │  │
    │  └──────────────┘  └──────────────┘  └─────────────┘  │
    │                          ↓                              │
    │  ┌────────────────────────────────────────────────────┐│
    │  │          服务层 (Service)                          ││
    │  │  - LogService        - RuleService                ││
    │  │  - AnalysisService   - FileService               ││
    │  └────────────────────────────────────────────────────┘│
    │                          ↓                              │
    │  ┌────────────────────────────────────────────────────┐│
    │  │          数据访问层 (Prisma ORM)                  ││
    │  │  - logModel     - ruleModel                       ││
    │  │  - errorModel   - ruleHistoryModel               ││
    │  └────────────────────────────────────────────────────┘│
    │                          ↓                              │
    └────────────────────────┬─────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ↓                   ↓
    ┌─────────┐         ┌──────────┐
    │ SQLite  │         │File System
    │(业务数据)│ (临时日志)
    └─────────┘         └──────────┘
```

**架构特点**：
- **简洁**：去除 Redis 缓存层，SQLite 内置缓存足够
- **易部署**：所有数据存储都在一个文件中，随处可用
- **易维护**：中间件精简，没有繁重的配置
- **高效**：Prisma 自动生成类型安全的查询代码

### 项目文件结构

```
backend/src/
├── controllers/
│   ├── logController.ts
│   ├── ruleController.ts
│   └── errorController.ts
├── services/
│   ├── logService.ts
│   ├── ruleService.ts
│   ├── analysisService.ts
│   └── fileService.ts
├── middleware/
│   ├── errorHandler.ts
│   ├── validate.ts
│   └── fileUpload.ts
├── utils/
│   ├── logParser.ts
│   ├── regexMatcher.ts
│   ├── fileDownloader.ts
│   ├── logger.ts
│   └── formatters.ts
├── prisma/
│   └── schema.prisma          (Prisma 数据库 schema)
├── routes/
│   ├── logs.ts
│   ├── rules.ts
│   └── index.ts
├── types/
│   ├── log.types.ts
│   ├── rule.types.ts
│   └── api.types.ts
├── config/
│   ├── constants.ts
│   └── env.ts
├── app.ts
└── server.ts
```

**与原架构的差异**：
- 移除 repositories 层，Prisma 直接作为 ORM 在 services 中使用
- 移除 entities 层，用 Prisma schema 和自动生成的类型代替
- 简化 middleware，只保留必要的（错误处理、验证、文件上传）
- 移除 dto 复杂的装饰器验证，改用 Zod 简单方案
- 移除 migrations 文件夹，Prisma 管理迁移

---

## 数据库设计

### ER 图

```
┌──────────────────┐
│ logs             │
├──────────────────┤
│ id (PK)          │
│ fileName         │
│ uploadType       │
│ fileSize         │
│ totalLines       │
│ rawContent       │
│ createdAt        │
└────────┬─────────┘
         │ 1:N
         ↓
┌─────────────────────────────┐
│ errors                      │
├─────────────────────────────┤
│ id (PK)                     │
│ logId (FK)                  │
│ matchedRuleId (FK)          │
│ errorType                   │
│ severity                    │
│ title                       │
│ description                 │
│ occurrenceCount             │
│ firstOccurrenceLine         │
│ lastOccurrenceLine          │
│ createdAt                   │
└────────┬────────────────────┘
         │ 1:N
         ↓
┌──────────────────────────────┐
│ errorOccurrences            │
├──────────────────────────────┤
│ id (PK)                      │
│ errorId (FK)                 │
│ logId (FK)                   │
│ lineNumber                   │
│ rawLine                      │
│ contextBefore (JSON)         │
│ contextAfter (JSON)          │
│ sequence                     │
└──────────────────────────────┘

┌──────────────────────────────┐
│ rules                        │
├──────────────────────────────┤
│ id (PK)                      │
│ name                         │
│ regex                        │
│ keywords (JSON)              │
│ solution                     │
│ severity                     │
│ weight                       │
│ categories (JSON)            │
│ enabled                      │
│ version                      │
│ createdAt                    │
│ updatedAt                    │
└────────┬───────────────────┘
         │ 1:N
         ↓
┌──────────────────────────────┐
│ ruleHistories                │
├──────────────────────────────┤
│ id (PK)                      │
│ ruleId (FK)                  │
│ version                      │
│ name                         │
│ regex                        │
│ keywords (JSON)              │
│ solution                     │
│ severity                     │
│ weight                       │
│ categories (JSON)            │
│ changeLog                    │
│ changedAt                    │
└──────────────────────────────┘
```

### Prisma Schema 定义

```prisma
// prisma/schema.prisma

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// 日志表
model Log {
  id             String    @id @default(cuid())
  fileName       String
  uploadType     String    // 'url', 'file', 'text'
  fileSize       BigInt?
  totalLines     Int?
  rawContent     String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  
  errors         Error[]
  errorOccurrences ErrorOccurrence[]

  @@index([createdAt])
  @@index([fileName])
}

// 错误表
model Error {
  id                 String    @id @default(cuid())
  logId              String
  log                Log       @relation(fields: [logId], references: [id], onDelete: Cascade)
  
  matchedRuleId      String?
  matchedRule        Rule?     @relation(fields: [matchedRuleId], references: [id], onDelete: SetNull)
  
  errorType          String
  severity           String    // 'CRITICAL', 'ERROR', 'WARNING', 'INFO'
  title              String
  description        String?
  solution           String?
  
  occurrenceCount    Int       @default(1)
  firstOccurrenceLine Int?
  lastOccurrenceLine  Int?
  
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  
  occurrences        ErrorOccurrence[]

  @@index([logId])
  @@index([severity])
  @@index([matchedRuleId])
}

// 错误出现表
model ErrorOccurrence {
  id              String    @id @default(cuid())
  errorId         String
  error           Error     @relation(fields: [errorId], references: [id], onDelete: Cascade)
  
  logId           String
  log             Log       @relation(fields: [logId], references: [id], onDelete: Cascade)
  
  lineNumber      Int
  rawLine         String
  contextBefore   String?   // JSON 数组序列化为 string
  contextAfter    String?
  sequence        Int?
  
  createdAt       DateTime  @default(now())

  @@index([errorId])
  @@index([lineNumber])
}

// 规则表
model Rule {
  id              String    @id @default(cuid())
  name            String    @unique
  regex           String
  keywords        String    // JSON 数组序列化为 string
  solution        String?
  severity        String    @default("ERROR")
  weight          Int       @default(50)
  categories      String?   // JSON 数组序列化为 string
  enabled         Boolean   @default(true)
  version         Int       @default(1)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  errors          Error[]
  histories       RuleHistory[]

  @@index([enabled])
  @@index([severity])
  @@index([updatedAt])
}

// 规则历史表
model RuleHistory {
  id              String    @id @default(cuid())
  ruleId          String
  rule            Rule      @relation(fields: [ruleId], references: [id], onDelete: Cascade)
  
  version         Int
  name            String
  regex           String
  keywords        String    // JSON 数组序列化为 string
  solution        String?
  severity        String
  weight          Int
  categories      String?   // JSON 数组序列化为 string
  changeLog       String?
  
  changedAt       DateTime  @default(now())

  @@unique([ruleId, version])
  @@index([ruleId])
  @@index([changedAt])
}
```

### 配置说明

**SQLite 选择的优势**：
- 无需独立服务，文件型存储（`prisma.db`）
- 完整 ACID 支持，足以处理分析数据
- Prisma 自动处理迁移，非常简洁
- 开发、测试、部署都很方便

**JSON 字段处理**：
- SQLite 不原生支持 JSON 类型，存储为 TEXT
- 在应用层用 `JSON.stringify()` 和 `JSON.parse()` 处理
- Prisma 可配置自定义序列化器简化这一过程

**迁移**：
```bash
# 初始化 Prisma
npx prisma init

# 生成迁移
npx prisma migrate dev --name init

# 应用迁移
npx prisma migrate deploy

# 查看数据库
npx prisma studio
```


---

## 核心算法

### 日志匹配算法

#### 算法流程

```
输入: 原始日志行列表
输出: 错误列表（已聚合）

1. 预处理阶段
   - 字符编码检测和转换
   - 行末符号规范化
   - 去重和排序

2. 规则加载和编译
   - 从缓存加载已启用的规则
   - 编译 regex 并缓存
   - 构建关键词索引

3. 匹配阶段（核心）
   FOR each log line:
     FOR each rule:
       IF rule.enabled AND 关键词初筛成功(line, rule.keywords):
         IF regex.test(line):
           record_match(line, rule)
           
4. 聚合阶段
   - 按规则 ID 分组
   - 合并重复错误
   - 计算出现次数和行号范围

5. 排序阶段
   - 按严重程度排序（CRITICAL > ERROR > WARNING > INFO）
   - 按权重排序
   - 按出现次数排序

6. 输出
   - 返回排序后的错误列表
   - 缓存结果用于快速查询
```

#### 关键词初筛（优化）

目的：快速过滤不匹配的行，避免所有行都进行正则匹配

```typescript
function keywordFilter(line: string, keywords: string[]): boolean {
  // 将行和关键词都转为小写，提高匹配命中率
  const lowerLine = line.toLowerCase();
  
  // 如果没有关键词，则所有行都通过
  if (keywords.length === 0) return true;
  
  // 关键词任意一个出现在行中即通过
  // 这样既能快速过滤，又不会漏掉真正的匹配
  return keywords.some(keyword => 
    lowerLine.includes(keyword.toLowerCase())
  );
}
```

**性能考量**：
- 字符串搜索复杂度：O(n*m)，其中 n=行长度，m=关键词长度
- 大多数行会被快速过滤
- 预计关键词初筛可过滤 80-95% 的行

#### 正则表达式匹配

```typescript
function regexMatch(line: string, regex: RegExp): Match | null {
  try {
    const match = regex.exec(line);
    if (match) {
      return {
        fullMatch: match[0],
        groups: match.slice(1),
        matchedAt: match.index
      };
    }
    return null;
  } catch (error) {
    logger.error('Regex execution error', { regex: regex.source, line });
    return null;
  }
}
```

**注意事项**：
- 正则表达式在规则创建时验证一次
- 编译后的 RegExp 对象在内存中缓存
- 添加超时保护（避免灾难性回溯）
- 错误捕获和日志记录

#### 错误聚合（去重）

```typescript
interface ErrorGroup {
  ruleId: string;
  errorLine: string; // 标准化的错误行
  occurrences: OccurrenceRecord[];
}

function aggregateErrors(matches: Match[]): Error[] {
  // 按规则和错误内容聚合
  const errorMap = new Map<string, ErrorGroup>();
  
  for (const match of matches) {
    const key = `${match.ruleId}|${match.normalizedLine}`;
    
    if (!errorMap.has(key)) {
      errorMap.set(key, {
        ruleId: match.ruleId,
        errorLine: match.normalizedLine,
        occurrences: []
      });
    }
    
    const group = errorMap.get(key)!;
    group.occurrences.push({
      lineNumber: match.lineNumber,
      context: extractContext(matches, match.lineNumber)
    });
  }
  
  // 转换为错误列表并排序
  return Array.from(errorMap.values())
    .map(group => ({
      id: generateId(),
      ruleId: group.ruleId,
      count: group.occurrences.length,
      occurrences: group.occurrences,
      severity: rules[group.ruleId].severity,
      weight: rules[group.ruleId].weight
    }))
    .sort((a, b) => {
      // 按严重程度 > 权重 > 出现次数排序
      const severityOrder = { CRITICAL: 0, ERROR: 1, WARNING: 2, INFO: 3 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      if (a.weight !== b.weight) return b.weight - a.weight;
      return b.count - a.count;
    });
}
```

#### 上下文提取

```typescript
function extractContext(
  lines: string[],
  errorLineNumber: number,
  contextSize: number = 3
): ContextLines {
  const start = Math.max(0, errorLineNumber - contextSize);
  const end = Math.min(lines.length - 1, errorLineNumber + contextSize);
  
  return {
    before: lines.slice(start, errorLineNumber).map((line, idx) => ({
      lineNo: start + idx + 1,
      content: line,
      isMatch: false
    })),
    current: {
      lineNo: errorLineNumber + 1,
      content: lines[errorLineNumber],
      isMatch: true
    },
    after: lines.slice(errorLineNumber + 1, end + 1).map((line, idx) => ({
      lineNo: errorLineNumber + 2 + idx,
      content: line,
      isMatch: false
    }))
  };
}
```

---

## API 接口定义

### 基础配置

**基础 URL**: `http://backend-server:3000/api/v1`

**通用响应格式**：
```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "timestamp": "2025-11-28T10:30:45.123Z"
}
```

### 日志分析接口

#### 1. 上传日志并分析

**端点**: `POST /logs/analyze`

**请求体** (application/json):
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

**处理流程**（后端）：
```
1. 验证请求参数
2. 根据 uploadType 获取日志内容
   - url: 下载文件（支持大文件流）
   - file: Base64 解码
   - text: 直接使用
3. 字符编码检测和转换
4. 分行和预处理
5. 加载规则和编译 regex
6. 匹配日志行
7. 聚合错误
8. 存储到数据库
9. 返回分析结果
```

**响应体** (200 OK):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "analysisId": "uuid-1234",
    "fileName": "build.log",
    "uploadTime": "2025-11-28T10:30:45Z",
    "analyzeTime": 1500,
    "totalLines": 5000,
    "errorCount": 12,
    "warningCount": 45,
    "errors": [
      {
        "id": "error-1",
        "title": "C# 编译失败",
        "type": "COMPILE_ERROR",
        "severity": "CRITICAL",
        "count": 3,
        "weight": 100,
        "firstOccurrenceLine": 125,
        "lastOccurrenceLine": 1520,
        "description": "error CS0001: ...",
        "ruleId": "3"
      }
    ]
  }
}
```

**关键实现点**：
- 支持大文件流式处理（避免内存溢出）
- 文件大小限制：500MB
- 分批处理日志行（每 1000 行处理一次）
- 计算处理耗时
- 异步处理（可选，用流式处理）

**错误响应**：

| 状态码 | 场景 | 响应 |
|-------|------|------|
| 400 | 上传类型不合法 | `{ "code": 400, "message": "Invalid uploadType" }` |
| 413 | 文件过大 | `{ "code": 413, "message": "File size exceeds limit (max 500MB)" }` |
| 422 | 字符编码失败 | `{ "code": 422, "message": "Invalid file encoding" }` |
| 500 | 服务端错误 | `{ "code": 500, "message": "Internal server error" }` |

---

#### 2. 获取分析结果详情

**端点**: `GET /logs/{analysisId}/details`

**查询参数**：
```
pageNo=1&pageSize=20&sortBy=severity&sortOrder=desc&searchKeyword=&severityFilter=CRITICAL,ERROR
```

**响应体** (200 OK):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "analysisId": "uuid-1234",
    "pagination": {
      "pageNo": 1,
      "pageSize": 20,
      "total": 45,
      "totalPages": 3
    },
    "errors": [
      {
        "id": "error-1",
        "title": "C# 编译失败",
        "type": "COMPILE_ERROR",
        "severity": "CRITICAL",
        "count": 3,
        "weight": 100,
        "description": "error CS0001: ...",
        "solution": "**编译失败**\n\n修复 C# 语法错误...",
        "stackTrace": "at UnityEditor.Compilation...",
        "occurrences": [
          {
            "lineNumber": 125,
            "context": {
              "before": [
                { "lineNo": 123, "content": "...", "isMatch": false },
                { "lineNo": 124, "content": "...", "isMatch": false }
              ],
              "current": { "lineNo": 125, "content": "error line", "isMatch": true },
              "after": [
                { "lineNo": 126, "content": "...", "isMatch": false },
                { "lineNo": 127, "content": "...", "isMatch": false }
              ]
            }
          }
        ]
      }
    ]
  }
}
```

**实现要点**：
- 从数据库查询，使用内存缓存
- 支持分页（skip + take）
- 支持排序和筛选
- 全文搜索（题目、描述、关键词）

---

### 规则管理接口

#### 3. 获取规则列表

**端点**: `GET /rules`

**查询参数**：
```
pageNo=1
pageSize=20
sortBy=updatedAt|createdAt|severity|weight
sortOrder=desc|asc
searchKeyword=compile
categoryFilter=compilation,runtime
severityFilter=CRITICAL,ERROR
```

**响应体** (200 OK):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "pagination": {
      "pageNo": 1,
      "pageSize": 20,
      "total": 150,
      "totalPages": 8
    },
    "rules": [
      {
        "id": "3",
        "name": "C# 编译失败",
        "regex": "error CS\\d{4}: (.*)",
        "keywords": ["error", "CS"],
        "solution": "**编译失败**\n\n修复 C# 语法错误。\n...",
        "severity": "CRITICAL",
        "weight": 100,
        "categories": ["compilation", "c#"],
        "createdAt": "2025-11-24T06:18:55Z",
        "updatedAt": "2025-11-24T06:18:55Z",
        "usageCount": 245
      }
    ]
  }
}
```

---

#### 4. 创建新规则

**端点**: `POST /rules`

**请求体**:
```json
{
  "name": "新规则名称",
  "regex": "^error pattern.*",
  "keywords": ["error", "pattern"],
  "solution": "解决方案文本 (Markdown)",
  "severity": "ERROR",
  "weight": 50,
  "categories": ["compilation"]
}
```

**验证**（后端）：
```typescript
const ruleValidationRules = {
  name: {
    required: true,
    min: 2,
    max: 100,
    unique: true // 数据库唯一约束
  },
  regex: {
    required: true,
    validate: (value) => {
      try {
        new RegExp(value);
        return true;
      } catch {
        return false; // 正则表达式语法错误
      }
    }
  },
  keywords: {
    required: true,
    type: 'array',
    minLength: 1,
    maxLength: 50
  },
  severity: {
    required: true,
    enum: ['CRITICAL', 'ERROR', 'WARNING', 'INFO']
  },
  weight: {
    type: 'number',
    min: 0,
    max: 100
  },
  solution: {
    type: 'string',
    maxLength: 5000
  },
  categories: {
    type: 'array',
    maxLength: 10
  }
};
```

**响应体** (201 Created):
```json
{
  "code": 0,
  "message": "Rule created successfully",
  "data": {
    "id": "uuid-new",
    "name": "新规则名称",
    "regex": "^error pattern.*",
    "keywords": ["error", "pattern"],
    "solution": "解决方案文本 (Markdown)",
    "severity": "ERROR",
    "weight": 50,
    "categories": ["compilation"],
    "enabled": true,
    "versionNumber": 1,
    "createdAt": "2025-11-28T10:30:45Z",
    "updatedAt": "2025-11-28T10:30:45Z"
  }
}
```

**创建后操作**：
- 创建初始版本记录（rule_history）
- 清除规则缓存
- 日志记录

---

#### 5. 更新规则

**端点**: `PUT /rules/{ruleId}`

**请求体**（字段可选）:
```json
{
  "name": "更新后的规则名称",
  "weight": 80,
  "solution": "更新后的解决方案"
}
```

**业务逻辑**：
```
1. 查询现有规则
2. 验证更新字段
3. 版本递增 (version_number++)
4. 保存历史版本
5. 更新规则表
6. 清除缓存
7. 返回更新后的规则
```

**响应体** (200 OK):
```json
{
  "code": 0,
  "message": "Rule updated successfully",
  "data": { /* 更新后的规则对象 */ }
}
```

---

#### 6. 删除规则

**端点**: `DELETE /rules/{ruleId}`

**响应体** (204 No Content):
```
(无响应体)
```

或 (200 OK):
```json
{
  "code": 0,
  "message": "Rule deleted successfully",
  "data": null
}
```

---

#### 7. 批量删除规则

**端点**: `POST /rules/batch-delete`

**请求体**:
```json
{
  "ruleIds": ["id-1", "id-2", "id-3"]
}
```

**处理**：
- 使用数据库事务
- 错误时全部回滚
- 返回删除成功/失败的统计

**响应体** (200 OK):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "deleted": 3,
    "failed": 0
  }
}
```

---

#### 8. 导出规则

**端点**: `GET /rules/export`

**查询参数**:
```
ruleIds=id1,id2,id3 (可选，指定导出；不提供则全部)
format=json
```

**处理**：
```
1. 如果提供了 ruleIds，仅导出这些规则
2. 如果未提供，导出所有已启用的规则
3. 返回 JSON 数组
4. Content-Disposition: attachment 让浏览器下载
```

**响应**：
- Content-Type: `application/json; charset=utf-8`
- Content-Disposition: `attachment; filename="rules-export-20251128.json"`
- 响应体为 JSON 数组，每个元素为完整规则对象（包含所有字段）

---

#### 9. 导入规则

**端点**: `POST /rules/import`

**请求体** (multipart/form-data):
```
- file: (必填) JSON 文件
- conflictStrategy: "overwrite" | "skip" | "merge" (默认: skip)
```

**处理流程**：
```
1. 验证 JSON 文件格式
2. 遍历规则数组
3. 对每条规则：
   - 查询是否存在（按 name 或 id）
   - 根据 conflictStrategy 决定：
     * overwrite: 更新现有规则
     * skip: 跳过
     * merge: 合并（如关键词取并集）
   - 保存历史版本
4. 事务处理，保证一致性
5. 返回统计结果
```

**响应体** (200 OK):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "imported": 25,
    "updated": 5,
    "skipped": 3,
    "failed": 0,
    "errors": [
      {
        "ruleIndex": 10,
        "ruleName": "Invalid rule name",
        "error": "Validation failed: regex syntax error"
      }
    ]
  }
}
```

---

#### 10. 获取规则版本历史

**端点**: `GET /rules/{ruleId}/history`

**查询参数**:
```
pageNo=1
pageSize=10
```

**响应体** (200 OK):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "ruleId": "3",
    "pagination": {
      "pageNo": 1,
      "pageSize": 10,
      "total": 15,
      "totalPages": 2
    },
    "versions": [
      {
        "versionId": "v15",
        "ruleId": "3",
        "version": 15,
        "name": "C# 编译失败",
        "regex": "error CS\\d{4}: (.*)",
        "keywords": ["error", "CS"],
        "solution": "...",
        "severity": "CRITICAL",
        "weight": 100,
        "categories": ["compilation"],
        "changeLog": "Updated regex pattern",
        "changedBy": "user@example.com",
        "changedAt": "2025-11-28T10:30:45Z"
      }
    ]
  }
}
```

---

#### 11. 回滚规则到历史版本

**端点**: `POST /rules/{ruleId}/rollback/{versionId}`

**处理**：
```
1. 查询指定版本
2. 复制该版本到当前规则
3. 版本号递增
4. 保存当前版本到历史
5. 清除缓存
```

**响应体** (200 OK):
```json
{
  "code": 0,
  "message": "Rule rolled back successfully",
  "data": {
    "ruleId": "3",
    "currentVersion": 16,
    "rolledBackVersion": 14
  }
}
```

---

#### 12. 验证规则（测试匹配）

**端点**: `POST /rules/validate`

**请求体**:
```json
{
  "ruleIds": ["3", "1"],
  "uploadType": "text" | "url" | "file",
  "content": "日志内容或 URL 或 Base64",
  "fileName": "test.log"
}
```

**处理**：
```
1. 获取指定规则
2. 获取测试日志内容（同分析接口）
3. 对每条规则运行匹配算法
4. 返回匹配结果
```

**响应体** (200 OK):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "results": [
      {
        "ruleId": "3",
        "ruleName": "C# 编译失败",
        "matched": true,
        "matchCount": 2,
        "matches": [
          {
            "lineNumber": 125,
            "matchedText": "error CS0001: An object reference is required",
            "context": {
              "before": ["line 124"],
              "current": "line 125",
              "after": ["line 126"]
            }
          }
        ]
      },
      {
        "ruleId": "1",
        "ruleName": "Shader 编译错误",
        "matched": false,
        "matchCount": 0,
        "matches": []
      }
    ]
  }
}
```

---

#### 13. 批量更新规则分类

**端点**: `POST /rules/batch-update-category`

**请求体**:
```json
{
  "ruleIds": ["id-1", "id-2"],
  "addCategories": ["new-tag"],
  "removeCategories": ["old-tag"]
}
```

**处理**：
- 查询指定规则
- 更新 categories 字段（JSON 数组操作）
- 使用事务
- 更新 updated_at 时间戳
- 清除缓存

**响应体** (200 OK):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "updated": 2,
    "failed": 0
  }
}
```

---

## 数据验证规范

### 请求验证（后端 - 使用 Zod）

#### Schema 定义

```typescript
// src/schemas/rule.schemas.ts
import { z } from 'zod';

export const createRuleSchema = z.object({
  name: z.string()
    .min(2, '规则名称至少 2 个字符')
    .max(100, '规则名称最多 100 个字符'),
  
  regex: z.string()
    .min(1, '正则表达式不能为空')
    .refine((val) => {
      try {
        new RegExp(val);
        return true;
      } catch {
        return false;
      }
    }, '无效的正则表达式'),
  
  keywords: z.array(z.string())
    .min(1, '至少需要 1 个关键词')
    .max(50, '最多 50 个关键词'),
  
  severity: z.enum(['CRITICAL', 'ERROR', 'WARNING', 'INFO'])
    .default('ERROR'),
  
  weight: z.number()
    .int()
    .min(0, '权重最小为 0')
    .max(100, '权重最大为 100')
    .default(50),
  
  solution: z.string().max(5000, '解决方案最多 5000 字符').optional(),
  
  categories: z.array(z.string()).max(10, '最多 10 个分类').optional(),
});

export const updateRuleSchema = createRuleSchema.partial();

export type CreateRuleInput = z.infer<typeof createRuleSchema>;
export type UpdateRuleInput = z.infer<typeof updateRuleSchema>;
```

#### 中间件集成

```typescript
// src/middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(422).json({
          code: 422,
          message: 'Validation failed',
          data: {
            errors: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message
            }))
          }
        });
      }
      next(error);
    }
  };
}
```

#### 使用示例

```typescript
// src/routes/rules.ts
router.post('/rules', validate(createRuleSchema), ruleController.create);
router.put('/rules/:id', validate(updateRuleSchema), ruleController.update);
```

### 验证特点

- **轻量级**：Zod 库很小，无依赖
- **类型安全**：自动推导 TypeScript 类型
- **易于扩展**：自定义验证规则简洁明了
- **清晰错误**：错误信息详细可读

---

## 错误处理机制

### 统一错误响应格式

```typescript
// src/dto/response/ErrorResponse.ts
export interface ErrorResponse {
  code: number;
  message: string;
  data: any;
  timestamp: string;
  traceId?: string; // 用于追踪
}
```

### 全局错误处理中间件

```typescript
// src/middlewares/errorHandler.ts
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  const traceId = req.headers['x-request-id'] as string || generateId();
  
  logger.error('Unhandled error', {
    traceId,
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });

  if (error instanceof ValidationError) {
    return res.status(422).json({
      code: 422,
      message: 'Validation failed',
      data: { errors: formatValidationErrors(error) },
      timestamp: new Date().toISOString(),
      traceId
    });
  }

  if (error instanceof DatabaseError) {
    return res.status(500).json({
      code: 500,
      message: 'Database operation failed',
      data: null,
      timestamp: new Date().toISOString(),
      traceId
    });
  }

  // 默认错误
  res.status(500).json({
    code: 500,
    message: 'Internal server error',
    data: null,
    timestamp: new Date().toISOString(),
    traceId
  });
});
```

---

## 部署与扩展

### 部署架构（轻量级）

```
┌──────────────────────────────┐
│    Nginx 反向代理            │
│  (可选，用于 HTTPS/负载均衡)  │
└────────────┬─────────────────┘
             │
             ↓
      ┌─────────────┐
      │ Express 应用 │  (Node.js)
      │ + SQLite    │  (内置数据库)
      └─────────────┘
             │
        (本地文件)
             ↓
     ┌──────────────┐
     │ app.db       │  (SQLite 文件)
     │ (业务数据)    │
     └──────────────┘

     ┌──────────────┐
     │ /tmp 或其他   │
     │ (临时日志)    │
     └──────────────┘
```

**特点**：
- 单一可执行文件，无需额外服务
- SQLite 文件可备份、迁移、版本控制
- 生产环境可选 Nginx 做反向代理
- 资源占用最少

### 本地开发部署

```bash
# 1. 安装依赖
npm install

# 2. 初始化数据库
npx prisma migrate dev --name init

# 3. 启动开发服务器
npm run dev

# 访问 http://localhost:3000/api
```

### 生产部署（Docker）

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 生成 Prisma 客户端
COPY prisma ./prisma
RUN npx prisma generate

# 复制应用代码
COPY dist ./dist

# 创建数据库目录（SQLite 文件存储）
RUN mkdir -p /app/data

EXPOSE 3000

# 启动应用
CMD ["node", "dist/server.js"]
```

```yaml
# docker-compose.yml（简化版）
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: "file:./data/app.db"
      LOG_LEVEL: info
    volumes:
      - ./data:/app/data  # 持久化 SQLite 数据库
      - ./logs:/app/logs  # 持久化应用日志
    restart: unless-stopped
```

### 环境配置

```bash
# .env
NODE_ENV=production
DATABASE_URL=file:./data/app.db
PORT=3000
LOG_LEVEL=info
MAX_LOG_SIZE=524288000  # 500MB
MAX_UPLOAD_SIZE=524288000
TEMP_DIR=/app/data/temp
```

### 性能优化（轻量化）

#### 1. SQLite 查询优化

```typescript
// src/services/ruleService.ts
export async function getRuleList(params: QueryParams) {
  // 使用 Prisma 的查询优化
  return prisma.rule.findMany({
    where: {
      enabled: true,
      severity: params.severity
    },
    skip: (params.pageNo - 1) * params.pageSize,
    take: params.pageSize,
    orderBy: { updatedAt: 'desc' }
  });
}
```

#### 2. 简单内存缓存（无需 Redis）

```typescript
// src/utils/cache.ts
class SimpleCache {
  private cache = new Map<string, { data: any; expiry: number }>();

  set(key: string, value: any, ttlSeconds: number = 300) {
    this.cache.set(key, {
      data: value,
      expiry: Date.now() + ttlSeconds * 1000
    });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  clear() {
    this.cache.clear();
  }
}

export const cache = new SimpleCache();
```

#### 3. 流式处理大文件

```typescript
// src/services/logService.ts
import { createReadStream } from 'fs';

export async function processLargeLogFile(filePath: string) {
  const stream = createReadStream(filePath, { 
    encoding: 'utf8',
    highWaterMark: 64 * 1024  // 64KB 缓冲
  });

  for await (const chunk of stream) {
    const lines = chunk.split('\n');
    // 处理每一行
    await processLogLines(lines);
  }
}
```

### 数据备份与恢复

```bash
# 备份 SQLite 数据库
cp ./data/app.db ./backups/app-$(date +%Y%m%d-%H%M%S).db

# 从备份恢复
cp ./backups/app-20251201-100000.db ./data/app.db

# 或使用 SQLite 内置命令
sqlite3 ./data/app.db ".backup './backups/app.db'"
```

### 生产建议

1. **监控和日志**：使用 pino 记录结构化日志
2. **错误追踪**：集成 Sentry（可选）
3. **定期备份**：定时备份 SQLite 文件到安全存储
4. **容量规划**：监控 SQLite 文件大小，定期清理旧数据
5. **升级**：蓝绿部署或灰度更新，保持向下兼容

```typescript
// 大文件分析使用流式处理而不是队列
export async function analyzeLargeLog(filePath: string) {
  const stream = createReadStream(filePath, { 
    encoding: 'utf8',
    highWaterMark: 64 * 1024
  });

  let lineNumber = 0;
  const errors: Error[] = [];

  for await (const chunk of stream) {
    const lines = chunk.split('\n');
    for (const line of lines) {
      lineNumber++;
      const matched = matchLine(line);
      if (matched) errors.push(matched);
    }
  }

  return errors;
}
```

---

## 附录

### A. 简化环境配置

```bash
# .env.example
# 应用
NODE_ENV=development
PORT=3000

# 数据库
DATABASE_URL=file:./data/app.db

# 文件上传
MAX_LOG_SIZE=524288000  # 500MB
TEMP_DIR=./data/temp

# 日志
LOG_LEVEL=info
```

### B. 快速启动脚本

```bash
#!/bin/bash
# 安装依赖
npm install

# 初始化数据库
npx prisma migrate dev --name init

# 构建
npm run build

# 启动
npm start
```

### C. 关键目标指标

- **响应时间**: API P95 ≤ 200ms
- **吞吐量**: ≥ 100 req/s
- **错误率**: < 0.5%
- **可用性**: 99%+

---

**文档版本**: 2.0（简化版）  
**最后更新**: 2025-12-01  
**变更**: 从 PostgreSQL + Redis + TypeORM 改为 SQLite + Prisma 轻量级方案

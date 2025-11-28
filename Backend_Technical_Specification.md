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
| 框架 | Express.js | ≥4.18 | 轻量灵活，中间件丰富 |
| 语言 | TypeScript | ≥4.5 | 类型安全，便于维护 |
| 数据库 | PostgreSQL | ≥13 | 关系型，ACID 保证，JSON 支持 |
| ORM | TypeORM | ≥0.3 | 类型安全，迁移管理 |
| 缓存 | Redis | ≥6.0 | 高性能缓存，会话管理 |
| 日志 | Winston | ≥3.8 | 结构化日志，多 transport |
| 验证 | class-validator | ≥0.14 | DTO 验证，装饰器风格 |
| 任务队列 | Bull/Redis | ≥4.0 | 异步任务处理 |
| 文件处理 | multer | ≥1.4 | 文件上传中间件 |
| HTTP 客户端 | axios | ≥1.4 | URL 下载和外部 API 调用 |
| 测试 | Jest + Supertest | 最新 | 单元测试和集成测试 |

### 开发环境要求

```
Node.js: 18.0+ LTS
npm/pnpm: 最新稳定版
PostgreSQL: 13.0+
Redis: 6.0+
Docker: 最新版（可选，用于本地开发）
操作系统: Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+)
```

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
    │  │ (Express)    │  │ (Auth等)     │  │ (业务逻辑)  │  │
    │  └──────────────┘  └──────────────┘  └─────────────┘  │
    │                          ↓                              │
    │  ┌────────────────────────────────────────────────────┐│
    │  │          服务层 (Service)                          ││
    │  │  - LogService        - RuleService                ││
    │  │  - AnalysisService   - CacheService              ││
    │  └────────────────────────────────────────────────────┘│
    │                          ↓                              │
    │  ┌────────────────────────────────────────────────────┐│
    │  │          数据访问层 (Repository/DAO)              ││
    │  │  - LogRepository     - RuleRepository            ││
    │  │  - RuleHistoryRepo   - ErrorRepository           ││
    │  └────────────────────────────────────────────────────┘│
    │                          ↓                              │
    └────────────────────────┬─────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ↓                   ↓                   ↓
    ┌─────────┐         ┌─────────┐        ┌──────────┐
    │PostgreSQL           Redis          File System
    │ (业务数据)│ (缓存、会话) │ (临时日志)
    └─────────┘         └─────────┘        └──────────┘
```

### 项目文件结构

```
src/
├── controllers/
│   ├── logController.ts
│   ├── ruleController.ts
│   └── commonController.ts
├── services/
│   ├── logService.ts
│   ├── ruleService.ts
│   ├── analysisService.ts
│   ├── cacheService.ts
│   └── fileService.ts
├── repositories/
│   ├── logRepository.ts
│   ├── errorRepository.ts
│   ├── ruleRepository.ts
│   └── ruleHistoryRepository.ts
├── entities/
│   ├── Log.ts
│   ├── Error.ts
│   ├── Rule.ts
│   ├── RuleHistory.ts
│   └── ErrorOccurrence.ts
├── dto/
│   ├── request/
│   │   ├── AnalyzeLogRequest.ts
│   │   ├── CreateRuleRequest.ts
│   │   └── ValidateRuleRequest.ts
│   └── response/
│       ├── AnalyzeLogResponse.ts
│       ├── RuleListResponse.ts
│       └── CommonResponse.ts
├── middlewares/
│   ├── errorHandler.ts
│   ├── requestLogger.ts
│   ├── validation.ts
│   ├── authentication.ts
│   └── rateLimit.ts
├── utils/
│   ├── logParser.ts
│   ├── regexMatcher.ts
│   ├── fileDownloader.ts
│   ├── validators.ts
│   ├── formatters.ts
│   └── logger.ts
├── config/
│   ├── database.ts
│   ├── redis.ts
│   ├── constants.ts
│   └── env.ts
├── migrations/
│   ├── 001_create_tables.ts
│   ├── 002_add_indices.ts
│   └── 003_initial_rules.ts
├── routes/
│   ├── logRoutes.ts
│   ├── ruleRoutes.ts
│   └── index.ts
├── database/
│   ├── connection.ts
│   └── seeder.ts
├── app.ts
├── server.ts
└── index.ts
```

---

## 数据库设计

### ER 图

```
┌─────────────────┐
│ logs            │
├─────────────────┤
│ id (PK)         │
│ file_name       │
│ upload_type     │
│ file_size       │
│ total_lines     │
│ raw_content     │
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │ 1:N
         ↓
┌─────────────────────────────┐
│ errors                      │
├─────────────────────────────┤
│ id (PK)                     │
│ log_id (FK)                 │
│ matched_rule_id (FK)        │
│ error_type                  │
│ severity                    │
│ title                       │
│ description                 │
│ occurrence_count            │
│ first_occurrence_line       │
│ last_occurrence_line        │
│ created_at                  │
│ updated_at                  │
└────────┬────────────────────┘
         │ 1:N
         ↓
┌──────────────────────────────┐
│ error_occurrences           │
├──────────────────────────────┤
│ id (PK)                      │
│ error_id (FK)                │
│ log_id (FK)                  │
│ line_number                  │
│ raw_line                     │
│ context_before (JSON)        │
│ context_after (JSON)         │
│ sequence                     │
└──────────────────────────────┘

┌──────────────────────────────┐
│ rules                        │
├──────────────────────────────┤
│ id (PK, UUID)                │
│ name                         │
│ regex                        │
│ keywords (JSON array)        │
│ solution                     │
│ severity                     │
│ weight                       │
│ categories (JSON array)      │
│ enabled                      │
│ created_at                   │
│ updated_at                   │
│ version_number               │
└────────┬───────────────────┘
         │ 1:N
         ↓
┌──────────────────────────────┐
│ rule_history                 │
├──────────────────────────────┤
│ id (PK)                      │
│ rule_id (FK)                 │
│ version                      │
│ name                         │
│ regex                        │
│ keywords (JSON array)        │
│ solution                     │
│ severity                     │
│ weight                       │
│ categories (JSON array)      │
│ change_log                   │
│ changed_by                   │
│ changed_at                   │
└──────────────────────────────┘
```

### 表结构详细定义

#### 表 1: logs（日志表）

```sql
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(255) NOT NULL,
  upload_type VARCHAR(20) NOT NULL, -- 'url', 'file', 'text'
  file_size BIGINT,
  total_lines INTEGER,
  raw_content TEXT,
  metadata JSONB, -- 存储额外的上传元数据
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_logs_created_at ON logs(created_at DESC);
CREATE INDEX idx_logs_file_name ON logs(file_name);
```

**字段说明**：
- `id`: 日志唯一标识（UUID）
- `file_name`: 原始文件名
- `upload_type`: 上传方式（url|file|text）
- `file_size`: 文件大小（字节）
- `total_lines`: 日志总行数
- `raw_content`: 原始日志内容（TEXT，超大内容可独立存储）
- `metadata`: JSON 格式的元数据（项目名、版本号等）
- `created_at`, `updated_at`: 时间戳

#### 表 2: errors（错误表）

```sql
CREATE TABLE errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id UUID NOT NULL REFERENCES logs(id) ON DELETE CASCADE,
  matched_rule_id UUID REFERENCES rules(id) ON DELETE SET NULL,
  error_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL, -- 'CRITICAL', 'ERROR', 'WARNING', 'INFO'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  solution TEXT,
  occurrence_count INTEGER DEFAULT 1,
  first_occurrence_line INTEGER,
  last_occurrence_line INTEGER,
  weight INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_errors_log_id ON errors(log_id);
CREATE INDEX idx_errors_severity ON errors(severity);
CREATE INDEX idx_errors_rule_id ON errors(matched_rule_id);
CREATE INDEX idx_errors_created_at ON errors(created_at DESC);
```

**字段说明**：
- `log_id`: 关联的日志 ID
- `matched_rule_id`: 匹配的规则 ID
- `error_type`: 错误分类（编译错误、Git 错误等）
- `severity`: 严重程度
- `title`: 错误标题
- `description`: 错误详细描述
- `solution`: 解决方案（Markdown）
- `occurrence_count`: 该错误出现的次数（合并后）
- `first_occurrence_line`, `last_occurrence_line`: 首尾出现行号
- `weight`: 权重（用于排序）

#### 表 3: error_occurrences（错误出现次数表）

```sql
CREATE TABLE error_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_id UUID NOT NULL REFERENCES errors(id) ON DELETE CASCADE,
  log_id UUID NOT NULL REFERENCES logs(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  raw_line TEXT NOT NULL,
  context_before JSONB, -- ["line1", "line2", ...]
  context_after JSONB,
  sequence INTEGER, -- 出现序号
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_error_occurrences_error_id ON error_occurrences(error_id);
CREATE INDEX idx_error_occurrences_line_number ON error_occurrences(line_number);
```

**字段说明**：
- `error_id`: 关联的错误 ID
- `line_number`: 日志中的行号
- `raw_line`: 原始日志行
- `context_before`, `context_after`: 上下文行（JSON 数组）
- `sequence`: 该错误的第几次出现

#### 表 4: rules（规则表）

```sql
CREATE TABLE rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  regex TEXT NOT NULL,
  keywords JSONB NOT NULL, -- JSON array: ["keyword1", "keyword2", ...]
  solution TEXT,
  severity VARCHAR(20) NOT NULL DEFAULT 'ERROR',
  weight INTEGER NOT NULL DEFAULT 50,
  categories JSONB, -- JSON array: ["category1", "category2", ...]
  enabled BOOLEAN DEFAULT true,
  version_number INTEGER DEFAULT 1,
  usage_count INTEGER DEFAULT 0,
  last_match_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255)
);

CREATE INDEX idx_rules_enabled ON rules(enabled);
CREATE INDEX idx_rules_severity ON rules(severity);
CREATE INDEX idx_rules_keywords ON rules USING GIN(keywords);
CREATE INDEX idx_rules_updated_at ON rules(updated_at DESC);
```

**字段说明**：
- `id`: 规则唯一标识
- `name`: 规则名称（唯一）
- `regex`: 正则表达式
- `keywords`: 初筛关键词（JSON 数组）
- `solution`: 解决方案
- `severity`: 严重程度
- `weight`: 权重
- `categories`: 分类标签（JSON 数组）
- `enabled`: 是否启用
- `version_number`: 当前版本号
- `usage_count`: 使用计数
- `last_match_at`: 最后一次匹配时间

#### 表 5: rule_history（规则历史表）

```sql
CREATE TABLE rule_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES rules(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  regex TEXT NOT NULL,
  keywords JSONB NOT NULL,
  solution TEXT,
  severity VARCHAR(20) NOT NULL,
  weight INTEGER NOT NULL,
  categories JSONB,
  change_log TEXT,
  changed_by VARCHAR(255),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(rule_id, version)
);

CREATE INDEX idx_rule_history_rule_id ON rule_history(rule_id);
CREATE INDEX idx_rule_history_changed_at ON rule_history(changed_at DESC);
```

**字段说明**：
- `rule_id`: 关联的规则 ID
- `version`: 版本号
- `change_log`: 修改说明
- `changed_by`: 修改人
- `changed_at`: 修改时间
- 其他字段同 rules 表

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
- 异步处理（可选，用 Bull/Redis）

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
- 从数据库查询，使用 Redis 缓存
- 支持分页（limit + offset）
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

### 请求验证（后端）

#### DTO 验证（使用 class-validator）

```typescript
// src/dto/request/CreateRuleRequest.ts
import { IsString, IsArray, IsNumber, IsEnum, Min, Max, Matches } from 'class-validator';

export class CreateRuleRequest {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(1)
  regex: string; // 自定义验证器检查正则表达式有效性

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsString({ each: true })
  keywords: string[];

  @IsEnum(['CRITICAL', 'ERROR', 'WARNING', 'INFO'])
  severity: 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';

  @IsNumber()
  @Min(0)
  @Max(100)
  weight: number;

  @IsString()
  @MaxLength(5000)
  @IsOptional()
  solution?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  categories?: string[];
}
```

#### 自定义验证器

```typescript
// src/utils/validators.ts
export function validateRegex(regex: string): { valid: boolean; error?: string } {
  try {
    new RegExp(regex);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `Invalid regex: ${error.message}`
    };
  }
}

export async function validateRuleNameUnique(name: string, excludeId?: string) {
  const existingRule = await ruleRepository.findOne({
    where: { name },
    ...(excludeId && { where: { id: Not(excludeId) } })
  });
  return !existingRule;
}
```

### 错误验证响应

```json
{
  "code": 422,
  "message": "Validation failed",
  "data": {
    "errors": [
      {
        "field": "regex",
        "message": "Invalid regular expression syntax: unterminated character class"
      },
      {
        "field": "keywords",
        "message": "Keywords array cannot be empty"
      }
    ]
  }
}
```

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

### 部署架构

```
┌─────────────────────────────────────────┐
│         Nginx 反向代理                   │
│    (负载均衡、SSL/TLS)                  │
└────────────┬────────────────────────────┘
             │
      ┌──────┴──────┐
      ↓             ↓
   ┌─────┐       ┌─────┐
   │ API │       │ API │  (Express 实例)
   │  1  │       │  2  │  (水平扩展)
   └─────┘       └─────┘
      │             │
      └──────┬──────┘
             ↓
     ┌──────────────┐
     │ PostgreSQL   │  (主数据库)
     │ (Primary)    │
     └──────────────┘
             │
     (异步复制)
             ↓
     ┌──────────────┐
     │ PostgreSQL   │  (只读副本)
     │ (Replica)    │
     └──────────────┘

     ┌──────────────┐
     │ Redis 集群    │  (缓存和消息队列)
     │ (Cluster)    │
     └──────────────┘
```

### 容器化部署（Docker）

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://user:pass@postgres:5432/logdb
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: logdb
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

### 性能优化

#### 1. 数据库优化

```sql
-- 索引优化
CREATE INDEX idx_rules_enabled_severity ON rules(enabled, severity);
CREATE INDEX idx_errors_log_id_severity ON errors(log_id, severity);
CREATE INDEX idx_error_occurrences_error_id_line ON error_occurrences(error_id, line_number);

-- 查询优化（使用 EXPLAIN ANALYZE）
EXPLAIN ANALYZE
SELECT * FROM errors
WHERE log_id = 'xxx'
ORDER BY severity, weight DESC
LIMIT 20;
```

#### 2. 缓存策略

```typescript
// src/services/cacheService.ts
export class CacheService {
  private redis: Redis;

  async getRuleList(params: QueryParams): Promise<Rule[] | null> {
    const key = `rules:list:${JSON.stringify(params)}`;
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached);
    return null;
  }

  async setRuleList(params: QueryParams, rules: Rule[]): Promise<void> {
    const key = `rules:list:${JSON.stringify(params)}`;
    await this.redis.setex(key, 300, JSON.stringify(rules)); // 5 分钟过期
  }

  async invalidateRuleCache(): Promise<void> {
    const keys = await this.redis.keys('rules:*');
    if (keys.length > 0) await this.redis.del(...keys);
  }
}
```

#### 3. 异步任务处理

```typescript
// 大文件分析使用队列
import Bull from 'bull';

const analyzeQueue = new Bull('log-analysis', {
  redis: { host: '127.0.0.1', port: 6379 }
});

analyzeQueue.process(async (job) => {
  const { logId, content } = job.data;
  // 长时间的分析任务
  const result = await analyzeLog(content);
  return result;
});

// 在 API 中添加任务
app.post('/logs/analyze-async', async (req, res) => {
  const job = await analyzeQueue.add(req.body, {
    attempts: 3,
    backoff: 'exponential',
    delay: 1000
  });
  res.json({ jobId: job.id });
});
```

#### 4. 连接池管理

```typescript
// src/config/database.ts
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: false,
  entities: [Log, Error, Rule, RuleHistory],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
  poolSize: 10,        // 最大连接数
  maxQueryExecutionTime: 10000, // 查询超时
  cache: {
    type: 'redis',
    options: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379')
    }
  }
});
```

### 可扩展性设计

#### 1. 插件系统（规则匹配扩展）

```typescript
// 支持自定义匹配器
export interface IMatcher {
  match(line: string): Match[];
  getName(): string;
}

export class RegexMatcher implements IMatcher {
  constructor(private regex: RegExp) {}
  
  match(line: string): Match[] {
    const m = this.regex.exec(line);
    return m ? [{ matched: true, text: m[0] }] : [];
  }
  
  getName(): string {
    return 'regex';
  }
}

// 在服务中注册和使用
const matchers: IMatcher[] = [
  new RegexMatcher(rule.regex),
  new CustomPatternMatcher(rule.customPattern)
];
```

#### 2. 微服务架构（未来）

```
当前：单体应用
未来可拆分为：
- API 服务 (Express)
- 分析服务 (独立的 Node 工作进程)
- 规则服务 (独立服务)
- 缓存和消息队列 (Redis)

通过消息队列（RabbitMQ/Kafka）进行通信
```

---

## 附录

### A. 环境配置示例

```bash
# .env.example
# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/logdb
DB_HOST=localhost
DB_PORT=5432
DB_USER=user
DB_PASSWORD=password
DB_NAME=logdb

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 服务器
NODE_ENV=development
PORT=3000
API_VERSION=v1

# 文件上传
MAX_FILE_SIZE=524288000 # 500MB
UPLOAD_TEMP_DIR=/tmp/log-uploads

# 日志
LOG_LEVEL=info
LOG_FILE=/var/log/app.log

# 性能
DB_POOL_SIZE=10
DB_QUERY_TIMEOUT=10000
REGEX_TIMEOUT=1000
```

### B. 初始化脚本

```bash
# setup.sh
#!/bin/bash

# 安装依赖
npm install

# 创建数据库
createdb logdb

# 运行迁移
npm run typeorm migration:run

# 加载初始规则
npm run seed:rules

# 启动服务
npm start
```

### C. 监控指标

推荐监控的关键指标：
- API 响应时间（P50、P95、P99）
- 数据库查询耗时
- 缓存命中率
- 错误率
- 内存使用率
- CPU 使用率
- 磁盘 I/O

使用工具：Prometheus + Grafana，或云厂商的监控服务

---

**文档版本**: 1.0  
**最后更新**: 2025-11-28  
**维护者**: Backend Team

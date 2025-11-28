# Unity 日志分析系统 - API 对接规范

## 目录
1. [概述](#概述)
2. [HTTP 标准](#http-标准)
3. [请求和响应格式](#请求和响应格式)
4. [分页、排序、搜索规范](#分页排序搜索规范)
5. [错误处理标准](#错误处理标准)
6. [API 时序图](#api-时序图)
7. [集成检查清单](#集成检查清单)

---

## 概述

### 设计原则

本 API 遵循 RESTful 设计原则，确保前后端可以通过标准的 HTTP 协议进行通信。

**核心原则**：
- ✅ 资源导向：每个 URL 代表一个资源
- ✅ 标准 HTTP 方法：GET、POST、PUT、DELETE、PATCH
- ✅ 无状态通信：每个请求包含完整的必要信息
- ✅ 标准状态码：准确反映操作结果
- ✅ 统一的响应格式：所有 API 返回一致的数据结构

### 通信流程

```
前端              后端
  │                │
  ├─→ HTTP 请求   ─→│
  │   (含 Token)    │
  │   (含 RequestID)│
  │                │
  │   ┌────────────┤
  │   │ 验证 Token │
  │   │ 验证参数   │
  │   │ 业务处理   │
  │   └────────────┤
  │                │
  │← HTTP 响应  ←─│
  │   (标准格式)    │
```

---

## HTTP 标准

### HTTP 方法映射

| 方法 | 用途 | 幂等性 | 示例 |
|------|------|--------|------|
| GET | 读取资源 | ✅ 是 | `GET /api/v1/rules/3` |
| POST | 创建资源或执行操作 | ❌ 否 | `POST /api/v1/logs/analyze` |
| PUT | 完全替换资源 | ✅ 是 | `PUT /api/v1/rules/3` |
| DELETE | 删除资源 | ✅ 是 | `DELETE /api/v1/rules/3` |
| PATCH | 部分更新资源 | ❌ 否 | `PATCH /api/v1/rules/3` |

### URL 路由规范

**基础 URL**: `http://backend.example.com/api/v1`

**资源路由设计**：

```
日志相关：
  POST   /logs/analyze              - 上传日志并分析
  GET    /logs/{analysisId}/details - 获取分析结果详情
  GET    /logs/{analysisId}/error/{errorId} - 获取单个错误详情

规则相关：
  GET    /rules                     - 获取规则列表
  POST   /rules                     - 创建新规则
  GET    /rules/{ruleId}            - 获取单个规则
  PUT    /rules/{ruleId}            - 更新规则
  DELETE /rules/{ruleId}            - 删除规则
  POST   /rules/batch-delete        - 批量删除
  GET    /rules/export              - 导出规则
  POST   /rules/import              - 导入规则
  GET    /rules/{ruleId}/history    - 获取规则历史
  POST   /rules/{ruleId}/rollback/{versionId} - 回滚版本
  POST   /rules/validate            - 验证规则
  POST   /rules/batch-update-category - 批量更新分类
```

### HTTP 状态码规范

| 状态码 | 含义 | 场景 |
|-------|------|------|
| 200 | OK | 请求成功 |
| 201 | Created | 资源创建成功 |
| 204 | No Content | 请求成功但无响应体（如删除操作） |
| 400 | Bad Request | 请求参数不合法 |
| 401 | Unauthorized | 未认证或 Token 过期 |
| 403 | Forbidden | 无权限访问 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突（如规则名称重复） |
| 413 | Payload Too Large | 请求体过大 |
| 422 | Unprocessable Entity | 请求体格式正确但包含无效数据 |
| 429 | Too Many Requests | 请求过于频繁（限流） |
| 500 | Internal Server Error | 服务端错误 |
| 503 | Service Unavailable | 服务暂时不可用 |

---

## 请求和响应格式

### 通用请求头

所有请求都应包含以下头部：

```
Content-Type: application/json
Accept: application/json
Authorization: Bearer <JWT_TOKEN>  # 如果需要认证
X-Request-ID: <UUID>               # 用于追踪请求
```

**示例**：
```
GET /api/v1/rules?pageNo=1 HTTP/1.1
Host: backend.example.com
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
```

### 通用响应格式

所有成功和失败的响应都遵循统一格式：

```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "timestamp": "2025-11-28T10:30:45.123Z",
  "traceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**字段说明**：
- `code`: 业务状态码（0 表示成功，非 0 表示各类错误）
- `message`: 人类可读的消息
- `data`: 实际返回的数据（可为 null、对象或数组）
- `timestamp`: 服务器返回时间（ISO 8601 格式）
- `traceId`: 追踪 ID（用于追踪和排查问题）

### 成功响应示例

#### 返回单个对象

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "uuid-1234",
    "name": "C# 编译失败",
    "regex": "error CS\\d{4}: (.*)",
    "keywords": ["error", "CS"],
    "severity": "CRITICAL",
    "weight": 100
  },
  "timestamp": "2025-11-28T10:30:45.123Z"
}
```

#### 返回列表（含分页）

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
    "items": [
      { /* 第一项 */ },
      { /* 第二项 */ }
    ]
  },
  "timestamp": "2025-11-28T10:30:45.123Z"
}
```

### 失败响应示例

#### 参数验证失败 (422)

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
  },
  "timestamp": "2025-11-28T10:30:45.123Z",
  "traceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### 资源冲突 (409)

```json
{
  "code": 409,
  "message": "Conflict: rule name already exists",
  "data": {
    "conflictField": "name",
    "conflictValue": "C# 编译失败"
  },
  "timestamp": "2025-11-28T10:30:45.123Z"
}
```

#### 服务内部错误 (500)

```json
{
  "code": 500,
  "message": "Internal server error",
  "data": null,
  "timestamp": "2025-11-28T10:30:45.123Z",
  "traceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## 分页、排序、搜索规范

### 分页规范

所有返回列表的接口都支持分页。

**查询参数**：
```
pageNo=1        # 页号（从 1 开始，必填，默认 1）
pageSize=20     # 每页条数（必填，默认 20）
```

**响应分页信息**：
```json
{
  "pagination": {
    "pageNo": 1,
    "pageSize": 20,
    "total": 150,           # 总记录数
    "totalPages": 8,        # 总页数
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "items": []
}
```

**前端分页处理示例**（React）：
```typescript
const [pageNo, setPageNo] = useState(1);
const [pageSize, setPageSize] = useState(20);

const { data, loading } = useQuery(
  `/api/v1/rules?pageNo=${pageNo}&pageSize=${pageSize}`
);

const handlePageChange = (newPageNo: number) => {
  setPageNo(newPageNo);
};

const handlePageSizeChange = (newSize: number) => {
  setPageSize(newSize);
  setPageNo(1); // 改变每页数量时重置页号
};

return (
  <>
    <List dataSource={data.items} />
    <Pagination
      current={pageNo}
      pageSize={pageSize}
      total={data.pagination.total}
      onChange={handlePageChange}
      onShowSizeChange={handlePageSizeChange}
    />
  </>
);
```

### 排序规范

**查询参数**：
```
sortBy=field1,field2,...   # 排序字段（逗号分隔，可多字段排序）
sortOrder=asc|desc         # 排序顺序（默认 desc）
```

**常见排序字段**：

| 接口 | 可用排序字段 | 默认排序 |
|------|-----------|--------|
| GET /rules | updatedAt, createdAt, severity, weight | updatedAt desc |
| GET /logs | createdAt | createdAt desc |
| GET /errors | severity, count, lineNumber | severity, count desc |

**示例**：
```
GET /api/v1/rules?sortBy=severity,weight&sortOrder=desc

# 结果按严重程度降序，再按权重降序排列
```

**前端排序处理示例**：
```typescript
const [sortBy, setSortBy] = useState('updatedAt');
const [sortOrder, setSortOrder] = useState('desc');

const handleSort = (field: string) => {
  if (sortBy === field) {
    // 切换排序顺序
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  } else {
    setSortBy(field);
    setSortOrder('desc');
  }
};

const url = `/api/v1/rules?sortBy=${sortBy}&sortOrder=${sortOrder}`;
```

### 搜索规范

**查询参数**：
```
searchKeyword=keyword       # 搜索关键词（模糊搜索）
categoryFilter=cat1,cat2    # 分类筛选（逗号分隔）
severityFilter=CRITICAL,ERROR # 严重程度筛选
```

**搜索行为**：
- 跨多个字段的模糊匹配（如规则名称、关键词、描述）
- 不区分大小写
- 支持部分匹配

**示例**：
```
GET /api/v1/rules?searchKeyword=compile&categoryFilter=compilation,c%23&severityFilter=CRITICAL

# 搜索包含 "compile" 的规则，分类为 "compilation" 或 "c#"，且严重程度为 "CRITICAL"
```

**前端搜索处理示例**：
```typescript
const [searchKeyword, setSearchKeyword] = useState('');
const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
const [severityFilter, setSeverityFilter] = useState<string[]>([]);

const handleSearch = (keyword: string) => {
  setSearchKeyword(keyword);
  setPageNo(1); // 搜索时重置分页
};

const handleCategoryChange = (categories: string[]) => {
  setCategoryFilter(categories);
  setPageNo(1);
};

const url = `/api/v1/rules?searchKeyword=${searchKeyword}&categoryFilter=${categoryFilter.join(',')}&severityFilter=${severityFilter.join(',')}`;
```

---

## 错误处理标准

### 业务错误码表

| code | HTTP 状态码 | 错误原因 | 前端处理 |
|------|-----------|--------|--------|
| 0 | 200/201 | 成功 | 正常处理 |
| 400 | 400 | 请求参数不合法 | 显示错误信息，检查输入 |
| 401 | 401 | 未认证或 Token 过期 | 重定向到登录页 |
| 403 | 403 | 无权限访问 | 显示无权限提示 |
| 404 | 404 | 资源不存在 | 显示不存在提示，返回列表 |
| 409 | 409 | 资源冲突（如重名） | 提示冲突原因，让用户重新输入 |
| 413 | 413 | 文件/内容过大 | 提示大小限制，建议分割 |
| 422 | 422 | 数据验证失败 | 逐字段显示错误，聚焦首个错误字段 |
| 429 | 429 | 请求过于频繁 | 显示限流提示，建议用户等待 |
| 500 | 500 | 服务内部错误 | 显示通用错误信息，建议重试 |
| 503 | 503 | 服务暂时不可用 | 显示维护提示，建议稍后重试 |

### 前端统一错误处理

```typescript
// src/services/api/errorHandler.ts
export async function handleApiError(error: AxiosError) {
  const response = error.response;
  const data = response?.data as ApiResponse;

  switch (response?.status) {
    case 401:
      // Token 过期或无效
      logout();
      redirectTo('/login');
      message.error('登录已过期，请重新登录');
      break;

    case 403:
      message.error('您无权限访问此资源');
      break;

    case 404:
      message.error('请求的资源不存在');
      break;

    case 409:
      message.error(data?.message || '资源冲突');
      break;

    case 413:
      message.error('文件过大，请选择小于 500MB 的文件');
      break;

    case 422:
      // 验证错误，显示字段错误
      if (data?.data?.errors) {
        data.data.errors.forEach(err => {
          message.error(`${err.field}: ${err.message}`);
        });
      }
      break;

    case 429:
      message.warning('请求过于频繁，请稍后再试');
      break;

    case 500:
      message.error('服务内部错误，请稍后重试');
      break;

    case 503:
      message.error('服务暂时不可用，请稍后重试');
      break;

    default:
      if (error.request) {
        message.error('网络连接失败，请检查网络');
      } else {
        message.error('发生未知错误，请稍后重试');
      }
  }

  // 记录错误用于调试
  logger.error('API Error', {
    url: error.config?.url,
    method: error.config?.method,
    status: response?.status,
    code: data?.code,
    message: data?.message,
    traceId: data?.traceId
  });
}
```

### 后端错误日志记录

```typescript
// src/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'log-analysis-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

export function logError(error: Error, context: any = {}) {
  logger.error({
    message: error.message,
    stack: error.stack,
    ...context,
    timestamp: new Date().toISOString()
  });
}
```

---

## API 时序图

### 时序图 1：日志分析完整流程

```
前端                          后端                    数据库
 │                            │                        │
 ├─── POST /logs/analyze ────→│                        │
 │    (日志内容)               │                        │
 │                            ├─ 验证参数              │
 │                            ├─ 解析日志              │
 │                            ├─ 加载规则              │
 │                            ├─ 匹配日志              │
 │                            ├─ 聚合错误              │
 │                            ├─── INSERT logs ─────→ │
 │                            ├─── INSERT errors ───→ │
 │                            │←─ 返回结果 ────────── │
 │                            │                        │
 │←─ 200 OK (分析结果) ───────┤                        │
 │    (analysisId)             │                        │
 │                            │                        │
 │                            │                        │
 ├─── GET /logs/{id}/details ─→│                        │
 │    (pageNo=1)               │                        │
 │                            ├─── SELECT errors ───→ │
 │                            │←─ 返回错误列表 ────── │
 │←─ 200 OK (错误列表) ─────→ │                        │
 │                            │                        │
 │                            │                        │
 ├─ GET /logs/{id}/error/{id} ─→│                        │
 │                            ├─── SELECT * ────────→ │
 │                            │←─ 完整错误信息 ────── │
 │←─ 200 OK (错误详情) ──────→ │                        │
```

### 时序图 2：规则管理流程

```
前端                          后端                    数据库
 │                            │                        │
 ├─── POST /rules ───────────→│                        │
 │    (规则信息)               │                        │
 │                            ├─ 验证参数              │
 │                            ├─ 验证 Regex           │
 │                            ├─ 检查名称唯一性       │
 │                            ├─── INSERT rules ────→ │
 │                            ├─ INSERT rule_history →│
 │                            │←─ 返回规则ID ──────── │
 │←─ 201 Created ────────────→ │                        │
 │                            │                        │
 │                            │                        │
 ├─ GET /rules?pageNo=1 ─────→│                        │
 │                            ├─── SELECT * ────────→ │
 │                            │←─ 规则列表 ────────── │
 │←─ 200 OK (规则列表) ──────→ │                        │
 │                            │                        │
 │                            │                        │
 ├─ PUT /rules/{id} ─────────→│                        │
 │    (更新信息)               │                        │
 │                            ├─ 验证参数              │
 │                            ├─ 版本 +1              │
 │                            ├─ INSERT history ────→ │
 │                            ├─ UPDATE rules ──────→ │
 │                            │←─ 返回结果 ────────── │
 │←─ 200 OK ────────────────→ │                        │
```

---

## 集成检查清单

### 前端集成检查

- [ ] **HTTP 客户端配置**
  - [ ] axios 已初始化，基础 URL 正确
  - [ ] 请求拦截器添加 Authorization 和 X-Request-ID
  - [ ] 响应拦截器处理业务 code（非 HTTP 状态码）

- [ ] **认证**
  - [ ] 登录接口已对接
  - [ ] Token 存储在 localStorage/sessionStorage
  - [ ] Token 过期检测和刷新逻辑
  - [ ] 401 时自动重定向登录

- [ ] **日志分析模块**
  - [ ] 上传表单（URL/文件/文本）正常工作
  - [ ] 文件大小和字数限制提示正确
  - [ ] 上传进度条显示
  - [ ] 分析结果列表展示
  - [ ] 分页、搜索、筛选、排序功能正常
  - [ ] 点击错误项展示详情
  - [ ] 错误详情显示堆栈和上下文

- [ ] **规则管理模块**
  - [ ] 规则列表查询和展示
  - [ ] 新增规则表单（表单验证）
  - [ ] 编辑规则功能
  - [ ] 删除规则（单个和批量）
  - [ ] 导入/导出规则
  - [ ] 规则版本历史查看
  - [ ] 回滚功能
  - [ ] 规则验证测试

- [ ] **错误处理**
  - [ ] 所有 API 错误都有对应的提示
  - [ ] 表单验证错误逐字段显示
  - [ ] 网络错误自动重试
  - [ ] 加载状态、空状态、错误状态都有提示

### 后端集成检查

- [ ] **基础设施**
  - [ ] 数据库连接池已配置
  - [ ] Redis 缓存已连接
  - [ ] 日志系统已初始化
  - [ ] CORS 已正确配置
  - [ ] 限流中间件已启用

- [ ] **认证和授权**
  - [ ] JWT Token 签发和验证逻辑
  - [ ] 受保护端点检查 Authorization 头
  - [ ] Token 过期时间合理（如 24 小时）
  - [ ] 刷新 Token 逻辑（可选）

- [ ] **日志处理**
  - [ ] 日志接收端点正常
  - [ ] 支持三种上传方式（URL/文件/文本）
  - [ ] 大文件流式处理
  - [ ] 字符编码自动检测
  - [ ] 匹配算法性能达标（100MB/30s）

- [ ] **规则匹配**
  - [ ] 规则从缓存加载
  - [ ] 关键词初筛逻辑
  - [ ] 正则表达式匹配
  - [ ] 错误聚合和去重
  - [ ] 排序逻辑（严重程度 > 权重 > 出现次数）

- [ ] **数据持久化**
  - [ ] 所有表已创建，索引已添加
  - [ ] 数据库查询性能测试
  - [ ] 事务处理（关键操作）
  - [ ] 数据备份策略

- [ ] **API 接口**
  - [ ] 所有端点已实现并测试
  - [ ] 参数验证逻辑
  - [ ] 响应格式统一
  - [ ] 错误响应包含 code 和 message
  - [ ] 分页、排序、搜索功能

- [ ] **缓存**
  - [ ] 规则列表缓存
  - [ ] 分析结果缓存
  - [ ] 缓存失效策略

- [ ] **监控和日志**
  - [ ] 关键操作已记录日志
  - [ ] 错误已捕获和记录
  - [ ] 性能指标已采集（响应时间、错误率等）

### 集成测试步骤

#### 步骤 1：基础 API 测试

使用 Postman 或 curl 测试：

```bash
# 测试日志分析 API
curl -X POST http://localhost:3000/api/v1/logs/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "uploadType": "text",
    "content": "error CS0001: An object reference is required",
    "fileName": "test.log"
  }'

# 测试规则列表 API
curl -X GET "http://localhost:3000/api/v1/rules?pageNo=1&pageSize=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 步骤 2：前后端端到端测试

1. 前端打开日志分析页面
2. 上传一份测试日志
3. 验证结果显示正确
4. 前端打开规则管理页面
5. 列表正常加载
6. 新增规则并验证
7. 编辑和删除规则

#### 步骤 3：性能测试

- 上传 100MB+ 日志，验证处理时间
- 10 个并发请求，验证响应时间
- 使用 1000+ 条规则，验证匹配速度

#### 步骤 4：错误场景测试

| 场景 | 输入 | 预期结果 |
|------|------|--------|
| 文件过大 | 600MB 文件 | 413 + 错误信息 |
| 规则重名 | 已有名称 | 409 冲突提示 |
| 无效正则 | `[invalid(` | 422 验证失败 |
| Token 过期 | 旧 Token | 401 重定向登录 |
| 无权限 | 无管理员权限 | 403 禁止访问 |

---

## 附录

### 常见问题

**Q1: 如何处理大文件上传？**  
A: 前端使用 FormData + multipart/form-data；后端使用流式处理，逐行读取和处理。

**Q2: 如何确保数据一致性？**  
A: 关键操作（如导入规则、删除）使用数据库事务，确保原子性。

**Q3: 如何优化查询性能？**  
A: 添加适当索引、使用 Redis 缓存、分页加载、避免 N+1 查询问题。

**Q4: 如何处理 Token 刷新？**  
A: 发送刷新 Token 获取新的 Access Token；或在 401 时自动刷新。

---

**文档版本**: 1.0  
**最后更新**: 2025-11-28  
**维护者**: Dev Team

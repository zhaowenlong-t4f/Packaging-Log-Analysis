# Unity 日志分析系统 - 前端技术文档

## 目录
1. [产品概述](#产品概述)
2. [功能需求](#功能需求)
3. [技术栈](#技术栈)
4. [系统架构](#系统架构)
5. [API 接口规范](#api-接口规范)
6. [页面结构设计](#页面结构设计)
7. [UI/UX 规范](#uiux-规范)
8. [数据验证规范](#数据验证规范)
9. [错误处理机制](#错误处理机制)
10. [开发规范](#开发规范)

---

## 产品概述

### 产品定位
Unity 日志分析系统是一个面向游戏开发者和运维人员的日志诊断工具，通过智能日志解析、规则匹配和可视化展示，帮助快速定位和解决构建打包过程中的问题。

### 核心价值
- **快速定位问题**：日志自动分类和聚合，一眼看到关键错误
- **灵活规则管理**：用户可自定义错误匹配规则，支持正则表达式
- **知识沉淀**：规则库记录历史问题和解决方案，不断积累
- **降低人力成本**：减少手工查日志的时间，提高问题诊断效率

---

## 功能需求

### 模块一：日志上传与分析

#### 1.1 日志上传方式（三种）

**上传入口**：独立的上传页面/组件，支持三种方式切换

1. **URL 上传**（默认方式）
   - 用户输入或粘贴日志文件的 HTTP(S) URL
   - 后端负责下载，前端负责进度反馈
   - 支持大文件下载进度条展示

2. **本地文件上传**
   - 标准的文件选择器，支持拖拽上传
   - 支持 `.log`、`.txt`、`.zip` 等常见格式
   - 单个文件大小上限 500MB（可配置）
   - 显示文件名、大小、上传进度

3. **文本粘贴**
   - 提供大文本输入框，支持直接粘贴日志内容
   - 支持最大 50MB 文本（浏览器限制下的合理值）
   - 实时字符计数，超过限制提醒
   - 支持清空、示例加载等便捷操作

#### 1.2 日志分析结果展示

**主要特性**
- 错误自动分类和聚合
- 按严重程度排序（CRITICAL > ERROR > WARNING > INFO）
- 相同错误合并显示，计数统计
- 支持详细错误信息查看
- 支持全文搜索和筛选

**展示布局**
```
┌─────────────────────────────────────────────────────┐
│  日志分析页面                                         │
├──────────────────┬──────────────────────────────────┤
│ 左侧: 错误日志列表│ 右侧: 错误详细信息              │
│                  │                                  │
│ □ 错误1 (5次)   │  错误标题: ...                   │
│   严重程度: 高  │  错误类型: ...                   │
│                  │  出现次数: ...                   │
│ □ 错误2 (3次)   │  严重程度: ...                   │
│   严重程度: 中  │                                  │
│                  │  堆栈跟踪:                      │
│ (分页控制)      │   1 │ ...                       │
│                  │   2 │ ...                       │
└──────────────────┴──────────────────────────────────┘
```

### 模块二：错误匹配规则管理

#### 2.1 规则管理功能

1. **规则 CRUD 操作**
   - 创建新规则（弹窗表单）
   - 编辑已有规则
   - 删除规则（支持批量删除）
   - 查看规则列表

2. **规则属性**（与 JSON 格式对应）
   - `id`: 唯一标识（UUID）
   - `name`: 规则名称（必填）
   - `regex`: 正则表达式（必填）
   - `keywords`: 关键词数组（必填，用于初步筛选）
   - `solution`: 解决方案（Markdown 格式）
   - `severity`: 严重程度（CRITICAL/ERROR/WARNING/INFO）
   - `weight`: 权重（0-100，影响匹配排序）
   - `category`: 分类标签（支持多个）
   - `createdAt` / `updatedAt`: 时间戳

3. **规则导入导出**
   - 导出当前规则为 JSON 文件
   - 导入 JSON 文件（支持拖拽）
   - 导入时支持验证和冲突处理（覆盖/跳过/合并）

4. **规则版本管理**
   - 记录每次规则修改的历史
   - 支持查看历史版本
   - 支持回滚到历史版本

5. **规则验证测试**
   - 用户可选择一条或多条规则
   - 输入测试日志内容（支持 URL/本地文件/粘贴三种方式）
   - 显示规则匹配结果，帮助验证规则有效性

6. **规则分类管理**
   - 支持为规则添加分类标签
   - 按分类筛选和查看规则
   - 支持分类批量操作

#### 2.2 规则列表展示

**规则列表功能**
- 分页展示（每页 20 条）
- 搜索功能（按名称、关键词、分类）
- 排序功能（按创建时间、修改时间、严重程度、权重）
- 批量选择操作（删除、修改分类等）

---

## 技术栈

### 前端技术选择

| 范畴 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 框架 | React | ≥18.0 | 灵活强大，生态丰富 |
| 语言 | TypeScript | ≥4.5 | 类型安全，提高代码质量 |
| 状态管理 | Redux Toolkit | ≥1.9 | 简化状态管理，内置中间件 |
| HTTP 客户端 | axios | ≥1.4 | 便捷的请求拦截和超时控制 |
| UI 组件库 | Ant Design | ≥5.0 | 企业级 UI，中文支持好 |
| 路由 | React Router | ≥6.0 | 声明式路由，支持嵌套 |
| 表单管理 | React Hook Form + Yup | 最新 | 轻量、高性能 |
| 代码编辑器 | Monaco Editor / Highlight.js | 最新 | 代码高亮、行号显示、折叠 |
| 日期处理 | dayjs | ≥1.11 | 轻量级，替代 moment.js |
| 通知/提示 | message/notification(Ant Design) | 内置 | 系统内置的提示组件 |
| 构建工具 | Vite | ≥4.0 | 快速开发体验，快速构建 |
| 包管理 | pnpm | ≥8.0 | 高效包管理，减少磁盘占用 |

### 开发环境要求

```
Node.js: ≥18.0
npm/pnpm: 最新稳定版
浏览器: Chrome/Edge (最新两个版本)，Firefox 最新版
操作系统: Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+)
```

---

## 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     前端应用 (React)                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 日志分析页面  │  │ 规则管理页面  │  │ 规则验证页面  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         ▲                  ▲                  ▲              │
├────────┼──────────────────┼──────────────────┼──────────────┤
│        │                  │                  │              │
│  ┌─────▼────────────────────────────────────▼──┐           │
│  │      Redux 状态管理 (Slices)                  │           │
│  │  - logSlice  - ruleSlice  - uiSlice        │           │
│  └─────────────────────────────────────────────┘           │
│                          ▲                                  │
│  ┌─────────────────────────┴──────────────────┐           │
│  │    API 服务层 (Axios 拦截器)              │           │
│  │  - logService            - ruleService     │           │
│  │  - authService           - commonService   │           │
│  └─────────────────────────┬──────────────────┘           │
│                            │                               │
└────────────────────────────┼───────────────────────────────┘
                             │ HTTP(S)
                    RESTful API (Backend)
```

### 项目文件结构

```
frontend/src/
├── components/
│   ├── LogAnalysis/
│   │   ├── UploadArea.tsx
│   │   ├── ErrorList.tsx
│   │   ├── ErrorDetail.tsx
│   │   └── LogAnalysis.tsx
│   ├── RuleManagement/
│   │   ├── RuleList.tsx
│   │   ├── RuleForm.tsx
│   │   ├── RuleImportExport.tsx
│   │   ├── RuleHistory.tsx
│   │   ├── RuleValidator.tsx
│   │   └── RuleManagement.tsx
│   ├── Common/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── CodeViewer.tsx
│   │   └── PagePagination.tsx
│   └── Layout/
│       └── MainLayout.tsx
├── pages/
│   ├── LogAnalysisPage.tsx
│   ├── RuleManagementPage.tsx
│   └── NotFoundPage.tsx
├── services/
│   ├── api/
│   │   ├── client.ts          (axios 配置)
│   │   ├── logApi.ts
│   │   └── ruleApi.ts
│   ├── interceptors/
│   │   ├── requestInterceptor.ts
│   │   └── responseInterceptor.ts
│   └── utils/
│       ├── validators.ts
│       └── formatters.ts
├── store/
│   ├── index.ts
│   ├── slices/
│   │   ├── logSlice.ts
│   │   ├── ruleSlice.ts
│   │   └── uiSlice.ts
│   └── hooks.ts
├── types/
│   ├── log.types.ts
│   ├── rule.types.ts
│   ├── api.types.ts
│   └── common.types.ts
├── styles/
│   ├── global.css
│   ├── variables.css
│   └── themes/
├── config/
│   └── constants.ts
├── App.tsx
└── main.tsx
```

---

## API 接口规范

### 基础配置

**API 基础 URL**：`http://backend-server:3000/api/v1`

**请求头**：
```
Content-Type: application/json
Authorization: Bearer <JWT Token> (如适用)
X-Request-ID: <UUID> (用于追踪)
```

**响应格式标准**（所有接口统一）：
```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "timestamp": "2025-11-28T10:30:45Z"
}
```

- `code`: 0 表示成功，其他值表示错误
- `message`: 人类可读的消息
- `data`: 实际返回数据
- `timestamp`: 服务器时间戳

### 日志分析相关 API

#### 1. 上传日志并分析

**端点**: `POST /logs/analyze`

**请求体**：
```json
{
  "uploadType": "url" | "file" | "text",
  "content": "URL string | Base64 encoded file | Log text",
  "fileName": "build.log",
  "metadata": {
    "projectName": "ProjectX",
    "buildVersion": "1.0.0",
    "platform": "Android"
  }
}
```

**响应体**（200 OK）：
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

**请求参数说明**：
- `uploadType`: 上传类型
- `content`: 根据类型，可以是 URL、文件 Base64 或直接文本
- `fileName`: 原始文件名（用于记录）
- `metadata`: 可选的元数据，用于完整的日志追踪

**错误响应**（400/500）：
```json
{
  "code": 400,
  "message": "File size exceeds limit (max 500MB)",
  "data": null
}
```

---

#### 2. 获取分析结果详情

**端点**: `GET /logs/analyze/{analysisId}/details`

**查询参数**：
```
pageNo=1 (默认)
pageSize=20 (默认)
sortBy=severity|count|line (默认: severity)
sortOrder=desc|asc (默认: desc)
searchKeyword=error (可选，全文搜索)
severityFilter=CRITICAL,ERROR (可选，逗号分隔)
```

**响应体**（200 OK）：
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
              "before": ["line 123", "line 124"],
              "current": "line 125 - actual error line",
              "after": ["line 126", "line 127"]
            }
          },
          {
            "lineNumber": 1520,
            "context": { ... }
          }
        ]
      }
    ]
  }
}
```

---

#### 3. 获取单个错误详细信息

**端点**: `GET /logs/{analysisId}/error/{errorId}`

**响应体**（200 OK）：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "errorId": "error-1",
    "title": "C# 编译失败",
    "type": "COMPILE_ERROR",
    "severity": "CRITICAL",
    "count": 3,
    "matchedRuleId": "3",
    "description": "error CS0001: An object reference is required...",
    "solution": "**编译失败**\n\n修复 C# 语法错误。\n...",
    "occurrences": [
      {
        "sequence": 1,
        "lineNumber": 125,
        "rawLine": "   Debug.Log(obj.value);",
        "context": {
          "contextSize": 3,
          "lines": [
            { "lineNo": 123, "content": "...", "isMatch": false },
            { "lineNo": 124, "content": "...", "isMatch": false },
            { "lineNo": 125, "content": "error CS0001...", "isMatch": true },
            { "lineNo": 126, "content": "...", "isMatch": false },
            { "lineNo": 127, "content": "...", "isMatch": false }
          ]
        }
      }
    ]
  }
}
```

---

### 规则管理相关 API

#### 4. 获取规则列表

**端点**: `GET /rules`

**查询参数**：
```
pageNo=1 (默认)
pageSize=20 (默认)
sortBy=updatedAt|createdAt|severity|weight (默认: updatedAt)
sortOrder=desc|asc (默认: desc)
searchKeyword=compile (可选)
categoryFilter=compilation,runtime (可选，逗号分隔)
severityFilter=CRITICAL,ERROR (可选)
```

**响应体**（200 OK）：
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

#### 5. 创建新规则

**端点**: `POST /rules`

**请求体**：
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

**响应体**（201 Created）：
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
    "createdAt": "2025-11-28T10:30:45Z",
    "updatedAt": "2025-11-28T10:30:45Z"
  }
}
```

---

#### 6. 更新规则

**端点**: `PUT /rules/{ruleId}`

**请求体**（同创建，可选字段）：
```json
{
  "name": "更新后的规则名称",
  "weight": 80
}
```

**响应体**（200 OK）：同创建响应

---

#### 7. 删除规则

**端点**: `DELETE /rules/{ruleId}`

**响应体**（204 No Content）或（200 OK）：
```json
{
  "code": 0,
  "message": "Rule deleted successfully",
  "data": null
}
```

---

#### 8. 批量删除规则

**端点**: `POST /rules/batch-delete`

**请求体**：
```json
{
  "ruleIds": ["id-1", "id-2", "id-3"]
}
```

**响应体**（200 OK）：
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

#### 9. 导出规则

**端点**: `GET /rules/export`

**查询参数**：
```
ruleIds=id1,id2,id3 (可选，指定导出的规则；不提供则全部导出)
format=json (暂仅支持 json)
```

**响应**：
- Content-Type: `application/json`
- Content-Disposition: `attachment; filename="rules-export-20251128.json"`
- 响应体为 JSON 数组，每个元素为完整的规则对象

---

#### 10. 导入规则

**端点**: `POST /rules/import`

**请求体**（multipart/form-data）：
```
- file: (JSON 文件，包含规则数组)
- conflictStrategy: "overwrite" | "skip" | "merge" (默认: skip)
```

**响应体**（200 OK）：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "imported": 25,
    "updated": 5,
    "skipped": 3,
    "failed": 0,
    "errors": []
  }
}
```

---

#### 11. 获取规则版本历史

**端点**: `GET /rules/{ruleId}/history`

**查询参数**：
```
pageNo=1 (默认)
pageSize=10 (默认)
```

**响应体**（200 OK）：
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

#### 12. 回滚规则到历史版本

**端点**: `POST /rules/{ruleId}/rollback/{versionId}`

**响应体**（200 OK）：
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

#### 13. 验证规则（测试匹配）

**端点**: `POST /rules/validate`

**请求体**：
```json
{
  "ruleIds": ["3", "1"],
  "uploadType": "text" | "url" | "file",
  "content": "日志内容或 URL 或 Base64",
  "fileName": "test.log"
}
```

**响应体**（200 OK）：
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

#### 14. 批量更新规则分类

**端点**: `POST /rules/batch-update-category`

**请求体**：
```json
{
  "ruleIds": ["id-1", "id-2"],
  "addCategories": ["new-tag"],
  "removeCategories": ["old-tag"]
}
```

**响应体**（200 OK）：
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

### 通用错误响应

| HTTP 状态码 | code | message | 场景 |
|-----------|------|---------|------|
| 400 | 400 | Bad Request | 请求参数不合法 |
| 401 | 401 | Unauthorized | 未登录或 Token 过期 |
| 403 | 403 | Forbidden | 无权限访问 |
| 404 | 404 | Not Found | 资源不存在 |
| 413 | 413 | Payload Too Large | 文件/内容过大 |
| 422 | 422 | Unprocessable Entity | 数据验证失败 |
| 500 | 500 | Internal Server Error | 服务端错误 |
| 503 | 503 | Service Unavailable | 服务暂时不可用 |

**错误响应示例**：
```json
{
  "code": 422,
  "message": "Validation failed",
  "data": {
    "errors": [
      {
        "field": "regex",
        "message": "Invalid regular expression syntax"
      },
      {
        "field": "keywords",
        "message": "Keywords array cannot be empty"
      }
    ]
  },
  "timestamp": "2025-11-28T10:30:45Z"
}
```

---

## 页面结构设计

### 页面一：日志分析页面

**URL**: `/analysis`

**布局结构**：
```
┌─────────────────────────────────────────────────┐
│ 头部导航栏                                       │
├─────────────────────────────────────────────────┤
│                                                │
│  ┌────────────────┐  ┌──────────────────────┐ │
│  │ 日志上传区     │  │                      │ │
│  │ (3 种方式)     │  │   错误列表           │ │
│  │                │  │   (分类/搜索/分页)   │ │
│  │ - URL          │  │                      │ │
│  │ - 本地文件     │  │ □ 错误 1 (5)        │ │
│  │ - 粘贴文本     │  │ □ 错误 2 (3)        │ │
│  │                │  │ □ 错误 3 (1)        │ │
│  │ [分析按钮]     │  │                      │ │
│  │                │  │ 页码: 1/5            │ │
│  └────────────────┘  └──────────────────────┘ │
│                                                │
└─────────────────────────────────────────────────┘
```

**主要功能**：
1. **上传区域**
   - 选项卡切换（URL/文件/文本）
   - 拖拽上传支持
   - 文件大小/字数实时显示
   - 上传进度条

2. **错误列表**
   - 错误分类/聚合展示
   - 按严重程度色彩编码（红/橙/黄）
   - 搜索框（全文搜索）
   - 分类筛选、严重程度筛选
   - 分页控制
   - 点击行项展开详情

3. **交互流程**
   ```
   用户上传日志
        ↓
   上传进度显示
        ↓
   后端分析处理
        ↓
   返回分析结果
        ↓
   前端显示错误列表（按严重程度排序）
        ↓
   用户点击错误项
        ↓
   右侧显示详细信息
   ```

### 页面二：错误详情展示面板

**位置**：日志分析页面右侧（或独立侧滑窗口）

**展示内容**：
```
┌────────────────────────────────────┐
│ 错误详情                            │
├────────────────────────────────────┤
│ 错误标题: C# 编译失败               │
│ 错误类型: COMPILE_ERROR             │
│ 出现次数: 3                         │
│ 严重程度: 🔴 CRITICAL              │
│                                    │
│ 错误描述:                          │
│ error CS0001: An object            │
│ reference is required...           │
│                                    │
│ 解决方案:                          │
│ **编译失败**                        │
│                                    │
│ 修复 C# 语法错误。                  │
│ - 检查是否缺少分号                  │
│ - 验证命名空间引用                  │
│                                    │
│ 堆栈跟踪:                          │
│ ┌──────────────────────────────┐  │
│ │ 1 │ at UnityEditor.Build...  │  │
│ │ 2 │ at UnityEditor.Compil... │  │
│ │ 3 │ at UnityEditor.Scripting │  │
│ └──────────────────────────────┘  │
│                                    │
│ 出现位置: (点击查看/切换)            │
│ ▶ 位置 1 - 第 125 行                │
│ ▶ 位置 2 - 第 1520 行              │
│ ▶ 位置 3 - 第 2845 行              │
│                                    │
│ [导出] [复制] [标记处理中]          │
└────────────────────────────────────┘
```

**功能说明**：
- 切换错误出现的不同位置
- 查看上下文代码行
- 代码高亮显示，行号展示
- 导出错误详情
- 标记处理状态

### 页面三：规则管理页面

**URL**: `/rules`

**布局结构**：
```
┌──────────────────────────────────────────────────┐
│ 头部导航栏                                        │
├──────────────────────────────────────────────────┤
│ [+ 新增规则] [导入] [导出] [验证] [批量操作▼]    │
├──────────────────────────────────────────────────┤
│ 搜索: _____________ 分类: [下拉] 严重程度: [下拉]│
├──────────────────────────────────────────────────┤
│ □ │ 规则名称     │ 严重程度│ 权重│ 分类│ 操作   │
│───┼──────────────┼────────┼───┼────┼──────────│
│ □ │ C# 编译失败  │ CRITICAL│100│编译│编辑 删除│
│ □ │ Shader错误   │ ERROR  │ 80│图形│编辑 删除│
│ □ │ Git冲突      │ WARNING│ 50│构建│编辑 删除│
│   │              │        │   │    │       │
│ 页码: 1/8 (共 150 条)                          │
└──────────────────────────────────────────────────┘
```

**主要功能**：
1. **规则列表**
   - 分页展示（每页 20 条）
   - 多选框（批量操作）
   - 搜索、筛选、排序
   - 编辑、删除按钮

2. **新增/编辑规则**
   - 弹窗表单
   - 字段验证
   - 正则表达式测试按钮（内置 Regex Tester）

3. **导入/导出**
   - 导出按钮：导出选中或全部规则为 JSON
   - 导入按钮：选择或拖拽 JSON 文件导入
   - 冲突处理选项

4. **规则验证**
   - 打开验证对话框
   - 选择一条或多条规则
   - 输入测试日志（URL/文件/文本）
   - 显示匹配结果

5. **版本历史**
   - 规则列表中点击"历史"按钮
   - 显示历史版本列表
   - 支持查看每个版本的详细信息
   - 支持回滚到历史版本

### 页面四：规则验证页面

**URL**: `/rules/validate`

**布局结构**：
```
┌────────────────────────────────────────────────┐
│ 头部: 规则验证工具                              │
├────────────────────────────────────────────────┤
│ 左侧: 规则选择          │  右侧: 日志输入      │
├────────────────────────┼─────────────────────┤
│ 选择规则:              │  选择日志输入方式:   │
│ □ C# 编译失败          │  ○ URL             │
│ □ Shader 错误         │  ○ 本地文件        │
│ □ Git 冲突            │  ○ 粘贴文本        │
│                        │                     │
│ [全选] [反选]          │  ________________   │
│                        │  │              │  │
│ [验证]                 │  │  日志内容    │  │
│                        │  │  (可粘贴)    │  │
│                        │  │              │  │
│                        │  │______________|  │
├────────────────────────┼─────────────────────┤
│ 验证结果:                                     │
│ ✓ C# 编译失败      [匹配 2 处]               │
│   └─ 第 125 行: error CS0001...            │
│   └─ 第 1520 行: error CS0002...           │
│                                             │
│ ✗ Shader 错误       [未匹配]                 │
└────────────────────────────────────────────────┘
```

---

## UI/UX 规范

### 设计系统

#### 色彩方案

**主色系**：
- Primary Blue: `#1890FF`
- Primary Green (Success): `#52C41A`
- Primary Red (Error): `#FF4D4F`
- Primary Orange (Warning): `#FAAD14`
- Primary Gray (Info): `#8C8C8C`

**日志严重程度色彩**：
| 级别 | 色彩 | Hex Code | 用途 |
|------|------|----------|------|
| CRITICAL | 红色 | `#FF4D4F` | 致命错误 |
| ERROR | 橙红 | `#FF7A45` | 明显错误 |
| WARNING | 橙色 | `#FAAD14` | 警告 |
| INFO | 蓝色 | `#1890FF` | 信息 |

**背景色**：
- 浅灰背景: `#FAFAFA`
- 纯白: `#FFFFFF`
- 深灰: `#262626`

#### 字体排版

| 用途 | 字体大小 | 行高 | 字重 |
|------|---------|------|------|
| 大标题 | 28px | 1.35 | 600 |
| 标题 1 | 24px | 1.35 | 600 |
| 标题 2 | 20px | 1.5 | 600 |
| 标题 3 | 16px | 1.5 | 500 |
| 正文 | 14px | 1.5 | 400 |
| 小文本 | 12px | 1.5 | 400 |

#### 间距系统（基础单位 8px）

```
xs: 4px (0.5 unit)
sm: 8px (1 unit)
md: 16px (2 units)
lg: 24px (3 units)
xl: 32px (4 units)
xxl: 48px (6 units)
```

#### 圆角规范

```
sm: 2px (小组件边框)
md: 4px (按钮、卡片)
lg: 8px (模态框、大卡片)
```

#### 阴影规范

```
xs: 0 1px 2px rgba(0,0,0,0.03)
sm: 0 1px 2px rgba(0,0,0,0.06)
md: 0 4px 12px rgba(0,0,0,0.15)
lg: 0 9px 28px rgba(0,0,0,0.15)
```

### 交互规范

#### 按钮规范

**按钮类型**：
- **Primary**: 主要操作（新增、上传、保存）- 蓝色
- **Default**: 次要操作（取消、关闭）- 灰色
- **Danger**: 危险操作（删除、清空）- 红色
- **Text**: 文本操作（详情、预览、更多）- 蓝色文本

**按钮状态**：
- 正常
- Hover（背景色加深 10%）
- Active/Pressed（背景色加深 20%）
- Disabled（灰化，不可点击）
- Loading（显示加载动画）

#### 表单控件规范

**输入框**：
- 高度: 32px
- 边框: 1px solid `#D9D9D9`
- Focus: 蓝色边框 + 阴影
- Error: 红色边框

**下拉选择**：
- 同输入框规范
- 清除按钮（×）
- 搜索功能（可选）

**复选框/单选框**：
- 大小: 16px × 16px
- 默认灰色边框
- 选中后显示蓝色背景 + 白色勾号/点

#### 反馈提示规范

**Toast 消息**（右上角）：
- 自动关闭: 3s
- 支持类型: success, error, warning, info
- 最多同时显示: 3 条

**对话框**：
- 模态背景透明度: 45%
- 最大宽度: 600px
- 垂直位置: 屏幕中心（或顶部 1/3）

**加载状态**：
- Skeleton Loading（优先用于列表加载）
- 全屏 Spinner（用于页面加载）

### 无障碍设计

- 所有交互元素都可通过 Tab 键导航
- 支持键盘快捷键（如 Ctrl+S 保存）
- 充足的色彩对比度（WCAG AA 标准）
- 错误消息清晰且关联到表单字段
- 图标配合文本标签

---

## 数据验证规范

### 前端验证规则

#### 规则表单验证

```typescript
const ruleValidationRules = {
  name: [
    { required: true, message: '规则名称不能为空' },
    { min: 2, message: '规则名称至少 2 个字符' },
    { max: 100, message: '规则名称最多 100 个字符' }
  ],
  regex: [
    { required: true, message: '正则表达式不能为空' },
    { 
      pattern: /^.+$/, 
      message: '请输入有效的正则表达式',
      validateTrigger: 'onChange',
      validator: (rule, value) => {
        try {
          new RegExp(value);
          return Promise.resolve();
        } catch (e) {
          return Promise.reject('正则表达式语法错误: ' + e.message);
        }
      }
    }
  ],
  keywords: [
    { required: true, message: '至少添加一个关键词' },
    { 
      validator: (rule, value) => {
        if (Array.isArray(value) && value.length > 0) {
          return Promise.resolve();
        }
        return Promise.reject('关键词数组不能为空');
      }
    }
  ],
  severity: [
    { required: true, message: '必须选择严重程度' }
  ],
  weight: [
    { 
      type: 'number',
      min: 0,
      max: 100,
      message: '权重必须在 0-100 之间'
    }
  ],
  solution: [
    { max: 5000, message: '解决方案最多 5000 个字符' }
  ]
};
```

#### 日志上传验证

- **URL 上传**：验证 URL 格式（http:// 或 https://）
- **文件上传**：
  - 文件大小 ≤ 500MB
  - 文件格式白名单: `.log`, `.txt`, `.zip`, `.tar.gz`
  - MIME 类型验证
- **文本粘贴**：
  - 内容长度 ≤ 50MB
  - 非空检查

### 后端验证（双重验证）

前端验证仅为用户体验，后端必须进行完整验证。详见后端文档。

---

## 错误处理机制

### HTTP 错误处理流程

```
请求发出
  ↓
[请求拦截器] 添加 Token、Request ID
  ↓
后端处理
  ↓
[响应拦截器]
  ├─→ code === 0 ? 成功处理
  ├─→ code === 401 ? 跳转登录
  ├─→ code === 403 ? 显示无权限提示
  ├─→ 4xx ? 显示错误信息
  ├─→ 5xx ? 显示服务错误，建议重试
  └─→ 网络错误 ? 显示网络错误，自动重试
```

### 前端异常捕获

```typescript
// 全局错误边界
<ErrorBoundary>
  <App />
</ErrorBoundary>

// 异步操作错误处理
try {
  const result = await analyzeLog(logData);
  // 处理结果
} catch (error) {
  if (error.response?.status === 413) {
    message.error('文件过大，请选择小于 500MB 的文件');
  } else if (error.response?.status === 422) {
    // 显示验证错误
    showValidationErrors(error.response.data.errors);
  } else if (error.request) {
    // 请求发出但没有收到响应
    message.error('网络错误，请检查网络连接');
  } else {
    message.error('发生未知错误，请稍后重试');
  }
}
```

### 用户提示信息

| 场景 | 提示类型 | 内容示例 |
|------|---------|--------|
| 操作成功 | Success Toast | "规则已保存" |
| 操作失败 | Error Toast | "保存失败，请稍后重试" |
| 验证错误 | Form Inline Error | "请输入有效的正则表达式" |
| 网络错误 | Error Message | "网络连接失败，3 秒后自动重试..." |
| 确认操作 | Modal Dialog | "确认删除该规则吗？" |
| 长时间加载 | Skeleton/Spinner | 加载骨架屏 |

---

## 开发规范

### 代码规范

#### TypeScript 类型定义

```typescript
// src/types/rule.types.ts
export interface Rule {
  id: string;
  name: string;
  regex: string;
  keywords: string[];
  solution: string;
  severity: 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';
  weight: number;
  categories: string[];
  createdAt: string;
  updatedAt: string;
  usageCount?: number;
}

export interface RuleFormData extends Omit<Rule, 'id' | 'createdAt' | 'updatedAt'> {}

export interface RuleListResponse {
  pagination: Pagination;
  rules: Rule[];
}
```

#### 组件命名规范

- 功能组件：`PascalCase`（如 `RuleForm.tsx`）
- 自定义 Hook：`useXxxx`（如 `useRuleList.ts`）
- 工具函数：`camelCase`（如 `formatDate.ts`）

#### 文件导入导出

```typescript
// ✓ 推荐：具体导入
import { Rule } from '@/types/rule.types';
import { getRules } from '@/services/api/ruleApi';

// ✗ 避免：重新导出所有内容
export * from '@/services';
```

### Git 提交规范

**提交消息格式**：
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型**：
- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 文档更新
- `style`: 代码风格调整（不改变功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建、依赖更新等

**示例**：
```
feat(rules): add batch delete functionality

- Add checkbox multi-select to rule list
- Add batch delete button and confirm modal
- Update API integration

Closes #123
```

### 分支策略

```
main (生产分支)
├── develop (开发分支)
│   ├── feature/log-upload
│   ├── feature/rule-management
│   ├── fix/pagination-bug
│   └── hotfix/critical-issue
```

### 测试规范

**单元测试**（使用 Jest + React Testing Library）：
```typescript
// src/components/__tests__/RuleForm.test.tsx
describe('RuleForm Component', () => {
  it('should render form fields correctly', () => {
    render(<RuleForm />);
    expect(screen.getByLabelText('规则名称')).toBeInTheDocument();
  });

  it('should validate regex pattern on blur', async () => {
    render(<RuleForm />);
    const regexInput = screen.getByLabelText('正则表达式');
    fireEvent.change(regexInput, { target: { value: '[invalid(' } });
    fireEvent.blur(regexInput);
    
    await waitFor(() => {
      expect(screen.getByText(/正则表达式语法错误/)).toBeInTheDocument();
    });
  });
});
```

**测试覆盖率**：
- 语句覆盖: ≥ 80%
- 分支覆盖: ≥ 75%
- 函数覆盖: ≥ 80%

### 性能优化

1. **代码分割**：
   ```typescript
   const RuleManagement = lazy(() => import('@/pages/RuleManagementPage'));
   const LogAnalysis = lazy(() => import('@/pages/LogAnalysisPage'));
   ```

2. **列表虚拟化**（大列表）：
   ```typescript
   import { FixedSizeList } from 'react-window';
   
   <FixedSizeList
     height={600}
     itemCount={1000}
     itemSize={35}
     width="100%"
   >
     {({ index, style }) => (
       <div style={style}>{items[index].name}</div>
     )}
   </FixedSizeList>
   ```

3. **减少不必要的重新渲染**：
   ```typescript
   const ErrorListItem = memo(({ error, onClick }) => {
     return <div onClick={onClick}>{error.title}</div>;
   }, (prev, next) => prev.error.id === next.error.id);
   ```

4. **API 请求去重和缓存**：
   ```typescript
   // Redux Toolkit Query 用于缓存 API 响应
   const rules = useGetRulesQuery({ page: 1, size: 20 });
   ```

---

## 附录

### A. 常见问题

**Q1: 如何处理超大日志文件（>500MB）？**  
A: 前端限制单次上传 500MB，但后端可支持流式处理。对于超大文件，用户可：
- 分割日志文件后多次上传
- 使用服务器直接处理日志的方式（如 SFTP 上传）

**Q2: 规则导入时如何处理不兼容的旧版本规则？**  
A: 导入时提供三个冲突处理策略：
- `overwrite`：覆盖现有规则
- `skip`：跳过已存在的规则
- `merge`：智能合并（如关键词取并集）

**Q3: 如何在离线环境中使用？**  
A: 当前版本依赖后端 API，若需支持离线功能，可：
- 前端缓存最近的分析结果（IndexedDB）
- 提供本地规则库备份和恢复功能

### B. 相关资源

- [React 官方文档](https://react.dev)
- [Redux 官方文档](https://redux.js.org)
- [Ant Design 组件库](https://ant.design)
- [TypeScript 官方文档](https://www.typescriptlang.org)

---

**文档版本**: 1.0  
**最后更新**: 2025-11-28  
**维护者**: Development Team

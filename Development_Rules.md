# Unity 日志分析系统 - 开发规则文档

## 目录
1. [项目概述](#项目概述)
2. [代码规范](#代码规范)
3. [Git 工作流规范](#git-工作流规范)
4. [API 开发规范](#api-开发规范)
5. [数据库规范](#数据库规范)
6. [前端开发规范](#前端开发规范)
7. [测试规范](#测试规范)
8. [部署规范](#部署规范)
9. [文档规范](#文档规范)

---

## 项目概述

### 项目结构
```
Packaging Log Analysis/
├── backend/          # 后端服务（Node.js + Express + TypeScript）
├── frontend/         # 前端应用（React + TypeScript）
├── docs/             # 项目文档
└── scripts/          # 部署脚本
```

### 技术栈
- **后端**: Node.js 18+, Express.js, TypeScript, Prisma, SQLite
- **前端**: React 18+, TypeScript, Redux Toolkit, Ant Design, Vite
- **数据库**: SQLite (开发/生产)

---

## 代码规范

### 通用规范

#### 1. 命名规范

**变量和函数**：使用 `camelCase`
```typescript
// ✓ 正确
const userName = 'admin';
function getUserData() {}

// ✗ 错误
const user_name = 'admin';
function GetUserData() {}
```

**类和接口**：使用 `PascalCase`
```typescript
// ✓ 正确
class LogService {}
interface RuleData {}

// ✗ 错误
class logService {}
interface ruleData {}
```

**常量**：使用 `UPPER_SNAKE_CASE`
```typescript
// ✓ 正确
const MAX_FILE_SIZE = 524288000; // 500MB
const API_BASE_URL = 'http://localhost:3000';

// ✗ 错误
const maxFileSize = 524288000;
```

**文件名**：
- 组件文件：`PascalCase.tsx` (如 `RuleForm.tsx`)
- 工具文件：`camelCase.ts` (如 `formatDate.ts`)
- 类型文件：`camelCase.types.ts` (如 `rule.types.ts`)

#### 2. TypeScript 规范

**必须使用类型注解**：
```typescript
// ✓ 正确
function createRule(data: CreateRuleInput): Promise<Rule> {
  return ruleService.create(data);
}

// ✗ 错误
function createRule(data) {
  return ruleService.create(data);
}
```

**避免使用 `any`**：
```typescript
// ✓ 正确
function processData(data: unknown): string {
  if (typeof data === 'string') {
    return data;
  }
  return '';
}

// ✗ 错误
function processData(data: any): any {
  return data;
}
```

**使用接口而非类型别名（对象结构）**：
```typescript
// ✓ 正确
interface Rule {
  id: string;
  name: string;
}

// ✗ 错误（对象结构时）
type Rule = {
  id: string;
  name: string;
}
```

#### 3. 代码组织

**导入顺序**：
```typescript
// 1. 外部库
import React, { useState, useEffect } from 'react';
import { Button, Table } from 'antd';

// 2. 内部模块（按路径层级）
import { Rule } from '@/types/rule.types';
import { getRules } from '@/services/api/ruleApi';

// 3. 相对路径
import './RuleForm.css';
```

**文件结构**：
```typescript
// 1. 导入
import ...

// 2. 类型定义
interface Props {}

// 3. 常量
const DEFAULT_PAGE_SIZE = 20;

// 4. 组件/函数
export function Component() {}

// 5. 默认导出（如需要）
export default Component;
```

#### 4. 注释规范

**函数注释**（JSDoc 格式）：
```typescript
/**
 * 创建新规则
 * @param data - 规则数据
 * @returns 创建的规则对象
 * @throws {ValidationError} 当数据验证失败时
 */
async function createRule(data: CreateRuleInput): Promise<Rule> {
  // 实现
}
```

**复杂逻辑注释**：
```typescript
// 关键词初筛：快速过滤不匹配的行，避免所有行都进行正则匹配
// 预计可过滤 80-95% 的行，大幅提升性能
function keywordFilter(line: string, keywords: string[]): boolean {
  // 实现
}
```

---

## Git 工作流规范

### 分支策略

```
main (生产分支，受保护)
├── develop (开发分支)
│   ├── feature/log-upload        # 新功能
│   ├── feature/rule-management   # 新功能
│   ├── fix/pagination-bug         # Bug 修复
│   └── hotfix/critical-issue      # 紧急修复
```

**分支命名**：
- `feature/功能名称` - 新功能开发
- `fix/问题描述` - Bug 修复
- `hotfix/问题描述` - 紧急修复（从 main 分支创建）
- `refactor/重构内容` - 代码重构
- `docs/文档内容` - 文档更新

### 提交消息规范

**格式**：
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型**：
- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
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

```
fix(logs): resolve pagination issue when filtering

Fixed bug where pagination reset didn't work correctly
when applying severity filter.

Fixes #456
```

### 代码审查规范

**提交 PR 前检查清单**：
- [ ] 代码符合项目规范
- [ ] 所有测试通过
- [ ] 已更新相关文档
- [ ] 无控制台错误或警告
- [ ] 已进行自测
- [ ] 提交消息符合规范

**Review 要点**：
- 代码逻辑正确性
- 性能考虑
- 安全性
- 可维护性
- 测试覆盖

---

## API 开发规范

### 路由规范

**RESTful 设计**：
```
GET    /api/v1/rules           # 获取列表
GET    /api/v1/rules/:id       # 获取单个
POST   /api/v1/rules           # 创建
PUT    /api/v1/rules/:id       # 更新
DELETE /api/v1/rules/:id       # 删除
```

**非 RESTful 操作使用动词**：
```
POST   /api/v1/rules/validate        # 验证规则
POST   /api/v1/rules/batch-delete    # 批量删除
GET    /api/v1/rules/export          # 导出规则
```

### 响应格式规范

**统一响应结构**：
```typescript
interface ApiResponse<T> {
  code: number;        // 0 表示成功
  message: string;     // 人类可读消息
  data: T;            // 实际数据
  timestamp: string;   // ISO 8601 格式
  traceId?: string;    // 追踪 ID
}
```

**错误响应**：
```typescript
// 422 验证错误
{
  code: 422,
  message: "Validation failed",
  data: {
    errors: [
      { field: "regex", message: "Invalid regex syntax" }
    ]
  }
}

// 409 冲突
{
  code: 409,
  message: "Conflict: rule name already exists",
  data: { conflictField: "name" }
}
```

### 参数验证

**使用 Zod 进行验证**：
```typescript
import { z } from 'zod';

const createRuleSchema = z.object({
  name: z.string().min(2).max(100),
  regex: z.string().refine((val) => {
    try {
      new RegExp(val);
      return true;
    } catch {
      return false;
    }
  }, 'Invalid regex'),
  keywords: z.array(z.string()).min(1),
  severity: z.enum(['CRITICAL', 'ERROR', 'WARNING', 'INFO'])
});

// 在中间件中使用
router.post('/rules', validate(createRuleSchema), ruleController.create);
```

### 错误处理

**统一错误处理中间件**：
```typescript
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  const traceId = req.headers['x-request-id'] as string || generateId();
  
  logger.error('Unhandled error', {
    traceId,
    message: error.message,
    stack: error.stack,
    path: req.path
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

## 数据库规范

### Prisma Schema 规范

**模型命名**：使用 `PascalCase`，表名使用 `camelCase`
```prisma
model Rule {
  id        String   @id @default(cuid())
  name      String   @unique
  // ...
}

// 对应表名: rules
```

**字段命名**：
- 使用 `camelCase`
- 布尔字段使用 `is` 或 `has` 前缀（如 `isEnabled`）
- 时间字段使用 `At` 后缀（如 `createdAt`, `updatedAt`）

**关系定义**：
```prisma
model Error {
  logId        String
  log          Log     @relation(fields: [logId], references: [id], onDelete: Cascade)
  matchedRuleId String?
  matchedRule  Rule?   @relation(fields: [matchedRuleId], references: [id], onDelete: SetNull)
}
```

### 迁移规范

**迁移命名**：
```bash
# 功能相关
npx prisma migrate dev --name add_rule_categories

# 修复相关
npx prisma migrate dev --name fix_error_index
```

**迁移前检查**：
- [ ] 备份数据库
- [ ] 检查迁移脚本
- [ ] 测试迁移回滚

---

## 前端开发规范

### 组件规范

**函数组件优先**：
```typescript
// ✓ 正确
export function RuleList() {
  const [rules, setRules] = useState<Rule[]>([]);
  // ...
}

// ✗ 避免类组件（除非必要）
```

**Props 类型定义**：
```typescript
interface RuleListProps {
  pageNo: number;
  pageSize: number;
  onRuleSelect?: (rule: Rule) => void;
}

export function RuleList({ pageNo, pageSize, onRuleSelect }: RuleListProps) {
  // ...
}
```

**自定义 Hooks**：
```typescript
// 命名: use + 功能描述
export function useRuleList(params: RuleListParams) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // 获取数据
  }, [params]);
  
  return { rules, loading };
}
```

### 状态管理规范

**Redux Toolkit 使用**：
```typescript
// slice 定义
const ruleSlice = createSlice({
  name: 'rules',
  initialState: {
    rules: [],
    loading: false,
    error: null
  },
  reducers: {
    setRules: (state, action: PayloadAction<Rule[]>) => {
      state.rules = action.payload;
    }
  }
});
```

**选择器使用**：
```typescript
// 使用 reselect 创建记忆化选择器
const selectFilteredRules = createSelector(
  [selectRules, selectSearchKeyword],
  (rules, keyword) => {
    return rules.filter(rule => 
      rule.name.toLowerCase().includes(keyword.toLowerCase())
    );
  }
);
```

### 样式规范

**使用 CSS Modules 或 styled-components**：
```typescript
// CSS Modules
import styles from './RuleForm.module.css';

<div className={styles.formContainer}>

// styled-components
const FormContainer = styled.div`
  padding: 16px;
  background: #fff;
`;
```

**避免内联样式**（除非动态值）：
```typescript
// ✓ 正确（动态值）
<div style={{ width: `${progress}%` }}>

// ✗ 错误（静态值）
<div style={{ padding: '16px' }}>
```

---

## 测试规范

### 单元测试

**测试文件命名**：`*.test.ts` 或 `*.spec.ts`

**测试结构**：
```typescript
describe('RuleService', () => {
  describe('createRule', () => {
    it('should create a rule with valid data', async () => {
      // Arrange
      const ruleData: CreateRuleInput = {
        name: 'Test Rule',
        regex: 'error.*',
        keywords: ['error']
      };
      
      // Act
      const result = await ruleService.create(ruleData);
      
      // Assert
      expect(result).toHaveProperty('id');
      expect(result.name).toBe('Test Rule');
    });
    
    it('should throw error with invalid regex', async () => {
      // ...
    });
  });
});
```

**测试覆盖率要求**：
- 语句覆盖: ≥ 80%
- 分支覆盖: ≥ 75%
- 函数覆盖: ≥ 80%

### 集成测试

**API 端点测试**：
```typescript
describe('POST /api/v1/rules', () => {
  it('should create a rule', async () => {
    const response = await request(app)
      .post('/api/v1/rules')
      .send({
        name: 'Test Rule',
        regex: 'error.*',
        keywords: ['error']
      })
      .expect(201);
    
    expect(response.body.code).toBe(0);
    expect(response.body.data).toHaveProperty('id');
  });
});
```

### E2E 测试

**关键流程测试**：
- 日志上传和分析流程
- 规则创建和编辑流程
- 规则导入导出流程

---

## 部署规范

### 环境配置

**环境变量管理**：
```bash
# .env.example（提交到版本控制）
NODE_ENV=development
PORT=3000
DATABASE_URL=file:./data/app.db
MAX_LOG_SIZE=524288000

# .env（不提交，本地配置）
# 从 .env.example 复制并修改
```

**配置验证**：
```typescript
// 启动时验证必需的环境变量
const requiredEnvVars = ['DATABASE_URL', 'PORT'];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
```

### 构建规范

**后端构建**：
```bash
# 开发
npm run dev

# 构建
npm run build

# 生产
npm start
```

**前端构建**：
```bash
# 开发
npm run dev

# 构建
npm run build

# 预览构建结果
npm run preview
```

### 部署检查清单

**部署前**：
- [ ] 所有测试通过
- [ ] 环境变量已配置
- [ ] 数据库迁移已执行
- [ ] 日志配置正确
- [ ] 错误监控已配置

**部署后**：
- [ ] 健康检查通过
- [ ] API 端点可访问
- [ ] 数据库连接正常
- [ ] 日志正常输出

---

## 文档规范

### 代码文档

**API 文档**：使用 JSDoc 注释
```typescript
/**
 * 创建新规则
 * 
 * @route POST /api/v1/rules
 * @param {CreateRuleInput} body - 规则数据
 * @returns {Promise<ApiResponse<Rule>>} 创建的规则
 * @throws {ValidationError} 当数据验证失败时
 * @throws {ConflictError} 当规则名称已存在时
 */
```

### 变更日志

**CHANGELOG.md 格式**：
```markdown
## [1.2.0] - 2025-12-01

### Added
- 规则批量删除功能
- 规则分类管理

### Changed
- 优化日志匹配算法性能

### Fixed
- 修复分页重置问题
```

---

## 性能规范

### 后端性能

**目标指标**：
- API 响应时间: P95 ≤ 200ms
- 日志解析速度: ≤ 100MB/30s
- 吞吐量: ≥ 100 req/s

**优化策略**：
- 使用关键词初筛减少正则匹配
- 规则缓存（内存）
- 数据库查询优化（索引）
- 流式处理大文件

### 前端性能

**优化策略**：
- 代码分割（路由级别）
- 列表虚拟化（大列表）
- 图片懒加载
- API 请求去重和缓存

---

## 安全规范

### 数据验证

**前后端双重验证**：
- 前端验证：提升用户体验
- 后端验证：确保数据安全（必须）

### 敏感信息

**禁止提交到版本控制**：
- 环境变量文件（.env）
- API 密钥
- 数据库密码
- 私钥文件

### 输入清理

**防止注入攻击**：
- SQL 注入：使用 Prisma ORM（参数化查询）
- XSS 攻击：前端转义用户输入
- 正则表达式：验证和限制复杂度

---

## 问题处理流程

### Bug 报告

**Issue 模板**：
```markdown
## 问题描述
简要描述问题

## 复现步骤
1. ...
2. ...

## 预期行为
应该发生什么

## 实际行为
实际发生了什么

## 环境信息
- 浏览器/Node 版本
- 操作系统
- 相关配置
```

### 问题优先级

- **P0 - 紧急**：系统崩溃，无法使用
- **P1 - 高**：核心功能不可用
- **P2 - 中**：功能异常但不影响主要流程
- **P3 - 低**：优化建议或小问题

---

## 附录

### 工具推荐

**开发工具**：
- VS Code + 扩展（ESLint, Prettier, TypeScript）
- Postman / Insomnia（API 测试）
- Prisma Studio（数据库管理）

**代码质量**：
- ESLint（代码检查）
- Prettier（代码格式化）
- Husky（Git Hooks）

### 参考资源

- [TypeScript 官方文档](https://www.typescriptlang.org)
- [React 官方文档](https://react.dev)
- [Prisma 文档](https://www.prisma.io/docs)
- [Express.js 最佳实践](https://expressjs.com/en/advanced/best-practice-performance.html)

---

**文档版本**: 1.0  
**最后更新**: 2025-12-01  
**维护者**: Development Team


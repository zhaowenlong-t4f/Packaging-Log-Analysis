# 后端快速启动指南

## 一步启动应用

### 方式1: 使用CMD窗口 (推荐)
```batch
start cmd.exe /c "cd e:\GoogleAIStudio\Packaging\ Log\ Analysis\backend && npm run dev"
```

### 方式2: 使用PowerShell (新窗口)
```powershell
# 在新的PowerShell窗口运行
cd "e:\GoogleAIStudio\Packaging Log Analysis\backend"
npm run dev
```

### 方式3: 使用PM2 (生产推荐)
```bash
npm install -g pm2
pm2 start npm --name "log-analysis-backend" -- run dev
pm2 logs log-analysis-backend
```

---

## 验证服务器启动

启动后，服务器应在 `http://localhost:3000` 监听

### 测试端点
```bash
# 1. 健康检查
curl http://localhost:3000/health

# 2. 获取规则列表
curl http://localhost:3000/api/v1/rules

# 3. 创建规则
curl -X POST http://localhost:3000/api/v1/rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试规则",
    "regex": "error.*",
    "keywords": ["error"],
    "severity": "ERROR"
  }'
```

### 使用PowerShell测试
```powershell
# 健康检查
Invoke-WebRequest http://localhost:3000/health -UseBasicParsing | Select-Object -ExpandProperty Content

# 获取规则
Invoke-WebRequest http://localhost:3000/api/v1/rules -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json
```

---

## 项目结构速览

```
backend/
├── src/
│   ├── controllers/
│   │   ├── logController.ts         # 日志分析API (1个端点)
│   │   ├── ruleController.ts        # 规则管理API (12个端点) ✅ 已实现
│   ├── services/
│   │   ├── logService.ts            # 日志分析业务逻辑 ✅ 框架完成
│   │   ├── ruleService.ts           # 规则管理业务逻辑 ✅ 已实现
│   ├── utils/
│   │   ├── matcher.ts               # 核心匹配算法 ⚠️ 需完成
│   │   ├── logger.ts                # 日志记录
│   │   ├── errors.ts                # 错误处理
│   ├── middleware/
│   │   ├── errorHandler.ts          # 全局错误处理 ✅
│   │   ├── logger.ts                # 请求日志 ✅
│   │   ├── validate.ts              # 验证中间件 ✅
│   ├── routes/
│   │   ├── index.ts                 # 路由汇总
│   │   ├── logs.ts                  # 日志路由
│   │   ├── rules.ts                 # 规则路由
│   ├── config/
│   │   ├── database.ts              # Prisma配置 ✅
│   ├── app.ts                       # Express应用 ✅
│   └── server.ts                    # 启动入口 ✅
├── prisma/
│   └── schema.prisma                # 数据库定义 ✅
├── data/
│   └── app.db                       # SQLite数据库 ✅
└── package.json                     # 依赖配置
```

---

## API文档速览

### 规则管理API (12个端点)

| 方法 | 路由 | 功能 |
|------|------|------|
| GET | `/api/v1/rules` | 获取规则列表 |
| POST | `/api/v1/rules` | 创建规则 |
| PUT | `/api/v1/rules/{id}` | 更新规则 |
| DELETE | `/api/v1/rules/{id}` | 删除规则 |
| POST | `/api/v1/rules/batch-delete` | 批量删除 |
| GET | `/api/v1/rules/export` | 导出规则 |
| POST | `/api/v1/rules/import` | 导入规则 |
| GET | `/api/v1/rules/{id}/history` | 查看历史 |
| POST | `/api/v1/rules/{id}/rollback/{versionId}` | 回滚版本 |
| POST | `/api/v1/rules/validate` | 验证规则 |
| POST | `/api/v1/rules/batch-update-category` | 批量更新分类 |

### 日志分析API (待实现)

| 方法 | 路由 | 功能 |
|------|------|------|
| POST | `/api/v1/logs/analyze` | 上传并分析日志 |
| GET | `/api/v1/logs/{id}/details` | 获取分析结果 |

---

## 系统信息

- **Node.js 版本**: 18+
- **数据库**: SQLite3 (file: `./data/app.db`)
- **框架**: Express.js + TypeScript
- **ORM**: Prisma
- **验证**: Zod
- **日志**: Pino

---

## 常见问题

### Q: 如何停止服务器?
A: 按 `Ctrl+C`

### Q: 如何查看服务器日志?
A: 使用 `npm run dev` 启动时会在终端显示日志

### Q: 如何重置数据库?
A: 
```bash
rm data/app.db
npm run prisma:migrate
```

### Q: 端口3000已被占用?
A: 修改 `.env` 中的 `PORT` 值

---

## 下一步

1. ✅ 启动应用
2. ✅ 测试规则管理API
3. ⏳ 完成LogAnalyzer匹配算法
4. ⏳ 测试日志分析API
5. ⏳ 编写单元和集成测试
6. ⏳ 部署到生产环境

详见 `TEST_REPORT.md` 了解完整的诊断和改进计划。

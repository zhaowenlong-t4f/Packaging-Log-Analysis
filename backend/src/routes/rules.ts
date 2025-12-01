import express from 'express';
import multer from 'multer';
import {
  getRules,
  createRule,
  updateRule,
  deleteRule,
  batchDeleteRules,
  exportRules,
  importRules,
  getRuleHistory,
  rollbackRule,
  validateRules,
  batchUpdateCategories
} from '../controllers/ruleController';
import { validate } from '../middleware/validate';
import {
  createRuleSchema,
  updateRuleSchema,
  ruleListQuerySchema,
  batchDeleteRulesSchema,
  batchUpdateCategoriesSchema,
  validateRulesSchema
} from '../schemas';

const router = express.Router();

// 配置 multer 用于文件导入
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// 获取规则列表
router.get('/', validate(ruleListQuerySchema, 'query'), getRules);

// 创建规则
router.post('/', validate(createRuleSchema), createRule);

// 更新规则
router.put('/:ruleId', validate(updateRuleSchema), updateRule);

// 删除规则
router.delete('/:ruleId', deleteRule);

// 批量删除规则
router.post('/batch-delete', validate(batchDeleteRulesSchema), batchDeleteRules);

// 导出规则
router.get('/export', exportRules);

// 导入规则
router.post('/import', upload.single('file'), importRules);

// 获取规则历史
router.get('/:ruleId/history', getRuleHistory);

// 回滚规则
router.post('/:ruleId/rollback/:versionId', rollbackRule);

// 验证规则
router.post('/validate', validate(validateRulesSchema), validateRules);

// 批量更新分类
router.post('/batch-update-category', validate(batchUpdateCategoriesSchema), batchUpdateCategories);

export default router;
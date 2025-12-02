/**
 * 规则路由
 */

import { Router } from 'express';
import { z } from 'zod';
import {
  getRules,
  getRule,
  createRuleHandler,
  updateRuleHandler,
  deleteRuleHandler,
  batchDeleteRulesHandler,
  getRuleHistoryHandler,
  rollbackRuleHandler,
  batchUpdateCategoryHandler,
  exportRulesHandler,
  importRulesHandler,
  validateRulesHandler,
} from '../controllers/ruleController';
import { validateBody, validateQuery, validateParams } from '../middleware/validate';
import {
  createRuleSchema,
  updateRuleSchema,
  ruleQuerySchema,
  ruleIdSchema,
} from '../schemas/rule.schemas';
import { upload, fileUploadErrorHandler } from '../middleware/fileUpload';

const router = Router();

// 获取规则列表
router.get('/', validateQuery(ruleQuerySchema), getRules);

// 获取单个规则
router.get('/:id', validateParams(ruleIdSchema), getRule);

// 创建规则
router.post('/', validateBody(createRuleSchema), createRuleHandler);

// 更新规则
router.put('/:id', validateParams(ruleIdSchema), validateBody(updateRuleSchema), updateRuleHandler);

// 删除规则
router.delete('/:id', validateParams(ruleIdSchema), deleteRuleHandler);

// 批量删除规则
router.post('/batch-delete', validateBody(z.object({
  ruleIds: z.array(z.string()).min(1),
})), batchDeleteRulesHandler);

// 获取规则版本历史
router.get('/:id/history', validateParams(ruleIdSchema), validateQuery(z.object({
  pageNo: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
})), getRuleHistoryHandler);

// 回滚规则到指定版本
router.post('/:id/rollback/:versionId', validateParams(z.object({
  id: z.string().min(1),
  versionId: z.string().min(1),
})), rollbackRuleHandler);

// 批量更新分类
router.post('/batch-update-category', validateBody(z.object({
  ruleIds: z.array(z.string()).min(1),
  addCategories: z.array(z.string()).optional(),
  removeCategories: z.array(z.string()).optional(),
})), batchUpdateCategoryHandler);

// 导出规则
router.get('/export', exportRulesHandler);

// 导入规则
router.post('/import', upload.single('file'), fileUploadErrorHandler, importRulesHandler);

// 验证规则
router.post('/validate', validateBody(z.object({
  ruleIds: z.array(z.string()).min(1),
  uploadType: z.enum(['url', 'file', 'text']),
  content: z.string().min(1),
  fileName: z.string().min(1),
})), validateRulesHandler);

export default router;


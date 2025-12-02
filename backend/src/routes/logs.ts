/**
 * 日志路由
 */

import { Router } from 'express';
import { analyzeLog, getLogDetails } from '../controllers/logController';
import { validateBody, validateQuery, validateParams } from '../middleware/validate';
import { logUploadSchema, logDetailQuerySchema, analysisIdSchema } from '../schemas/log.schemas';

const router = Router();

// 上传日志并分析
router.post('/analyze', validateBody(logUploadSchema), analyzeLog);

// 获取分析结果详情
router.get('/:analysisId/details', validateParams(analysisIdSchema), validateQuery(logDetailQuerySchema), getLogDetails);

export default router;


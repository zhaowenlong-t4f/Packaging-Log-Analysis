/**
 * 路由聚合
 */

import { Router } from 'express';
import logsRouter from './logs';
import rulesRouter from './rules';
import { API_BASE_PATH } from '../config/constants';

const router = Router();

// 注册子路由
router.use(`${API_BASE_PATH}/logs`, logsRouter);
router.use(`${API_BASE_PATH}/rules`, rulesRouter);

export default router;


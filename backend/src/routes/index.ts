import express from 'express';
import logRoutes from './logs';
import ruleRoutes from './rules';

const router = express.Router();

// 日志分析路由
router.use('/logs', logRoutes);

// 规则管理路由
router.use('/rules', ruleRoutes);

export default router;
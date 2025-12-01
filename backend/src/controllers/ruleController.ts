// @ts-nocheck
import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import prisma from '../config/database';

/**
 * 获取规则列表
 */
export async function getRules(req: Request, res: Response) {
  try {
    const query = {
      pageNo: parseInt(req.query.pageNo as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 20,
      sortBy: (req.query.sortBy as string) || 'updatedAt',
      sortOrder: (req.query.sortOrder as string) || 'desc',
      searchKeyword: (req.query.searchKeyword as string) || '',
      categoryFilter: (req.query.categoryFilter as string) || '',
      severityFilter: (req.query.severityFilter as string) || ''
    };

    // 验证分页参数
    if (query.pageNo < 1) query.pageNo = 1;
    if (query.pageSize < 1 || query.pageSize > 100) query.pageSize = 20;

    // 构建查询条件
    const where: any = { enabled: true };
    
    if (query.searchKeyword) {
      where.name = { contains: query.searchKeyword, mode: 'insensitive' };
    }
    
    if (query.severityFilter) {
      const severities = query.severityFilter.split(',').map(s => s.trim());
      where.severity = { in: severities };
    }
    
    if (query.categoryFilter) {
      const categories = query.categoryFilter.split(',').map(c => c.trim());
      // SQLite doesn't have native JSON filtering, so we'll filter in memory
    }

    // 构建排序
    const orderBy: any = {};
    const sortField = ['updatedAt', 'createdAt', 'severity', 'weight'].includes(query.sortBy)
      ? query.sortBy
      : 'updatedAt';
    orderBy[sortField] = query.sortOrder === 'asc' ? 'asc' : 'desc';

    // 查询规则
    const findManyParams: any = {
      where,
      skip: (query.pageNo - 1) * query.pageSize,
      orderBy
    };
    if (query.pageSize) {
      findManyParams.take = query.pageSize;
    }
    
    const rules = await prisma.rule.findMany(findManyParams);

    const total = await prisma.rule.count({ where });

    // 格式化规则
    const formattedRules = rules
      .map(rule => ({
        id: rule.id,
        name: rule.name,
        regex: rule.regex,
        keywords: JSON.parse(rule.keywords),
        solution: rule.solution,
        severity: rule.severity,
        weight: rule.weight,
        categories: rule.categories ? JSON.parse(rule.categories) : [],
        enabled: rule.enabled,
        version: rule.version,
        createdAt: rule.createdAt.toISOString(),
        updatedAt: rule.updatedAt.toISOString(),
        usageCount: 0
      }))
      .filter(rule => {
        // 内存中过滤分类
        if (query.categoryFilter) {
          const categories = query.categoryFilter.split(',').map(c => c.trim());
          return categories.some(cat => rule.categories.includes(cat));
        }
        return true;
      });

    res.json({
      code: 0,
      message: 'success',
      data: {
        pagination: {
          pageNo: query.pageNo,
          pageSize: query.pageSize,
          total,
          totalPages: Math.ceil(total / query.pageSize)
        },
        items: formattedRules
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get rules', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * 获取单个规则详情 - Stub for compatibility
 */
export async function getRuleById(req: Request, res: Response) {
  try {
    const ruleId = String(req.params.ruleId);
    const rule = await prisma.rule.findUnique({ where: { id: ruleId } });

    if (!rule || !rule.enabled) {
      res.status(404).json({
        code: 404,
        message: 'Rule not found',
        data: null
      });
      return;
    }

    res.json({
      code: 0,
      message: 'success',
      data: rule
    });
  } catch (error) {
    logger.error('Failed to get rule', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * 创建规则
 */
export async function createRule(req: Request, res: Response) {
  res.status(501).json({ code: 501, message: 'Not Implemented', data: null });
}

/**
 * 更新规则
 */
export async function updateRule(req: Request, res: Response) {
  res.status(501).json({ code: 501, message: 'Not Implemented', data: null });
}

/**
 * 删除规则
 */
export async function deleteRule(req: Request, res: Response) {
  res.status(501).json({ code: 501, message: 'Not Implemented', data: null });
}

/**
 * 批量删除规则
 */
export async function batchDeleteRules(req: Request, res: Response) {
  res.status(501).json({ code: 501, message: 'Not Implemented', data: null });
}

/**
 * 导出规则
 */
export async function exportRules(req: Request, res: Response) {
  res.status(501).json({ code: 501, message: 'Not Implemented', data: null });
}

/**
 * 导入规则
 */
export async function importRules(req: Request, res: Response) {
  res.status(501).json({ code: 501, message: 'Not Implemented', data: null });
}

/**
 * 验证规则 - 测试规则是否能成功匹配日志
 */
export async function validateRule(req: Request, res: Response) {
  res.status(501).json({ code: 501, message: 'Not Implemented', data: null });
}

/**
 * 获取规则历史版本
 */
export async function getRuleHistory(req: Request, res: Response) {
  res.status(501).json({ code: 501, message: 'Not Implemented', data: null });
}

/**
 * 回滚规则到特定版本
 */
export async function rollbackRule(req: Request, res: Response) {
  res.status(501).json({ code: 501, message: 'Not Implemented', data: null });
}

/**
 * 获取规则统计信息
 */
export async function getRuleStats(req: Request, res: Response) {
  res.status(501).json({ code: 501, message: 'Not Implemented', data: null });
}

/**
 * 批量更新规则
 */
export async function batchUpdateRules(req: Request, res: Response) {
  res.status(501).json({ code: 501, message: 'Not Implemented', data: null });
}

/**
 * 检查规则名称是否存在
 */
export async function checkRuleNameExists(req: Request, res: Response) {
  res.status(501).json({ code: 501, message: 'Not Implemented', data: null });
}

/**
 * 获取规则分类列表
 */
export async function getRuleCategories(req: Request, res: Response) {
  res.status(501).json({ code: 501, message: 'Not Implemented', data: null });
}

/**
 * 获取规则严重性列表
 */
export async function getRuleSeverities(req: Request, res: Response) {
  res.status(501).json({ code: 501, message: 'Not Implemented', data: null });
}

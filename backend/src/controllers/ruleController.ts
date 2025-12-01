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
    const rules = await prisma.rule.findMany({
      where,
      skip: (query.pageNo - 1) * query.pageSize,
      take: query.pageSize,
      orderBy
    });

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
 * 获取单个规则详情
 */
export async function getRuleById(req: Request, res: Response) {
  try {
    const { ruleId } = req.params;

    const rule = await prisma.rule.findUnique({
      where: { id: ruleId }
    });

    if (!rule || !rule.enabled) {
      res.status(404).json({
        code: 404,
        message: 'Rule not found',
        data: null
      });
      return;
    }

    const formattedRule = {
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
    };

    res.json({
      code: 0,
      message: 'success',
      data: formattedRule
    });
  } catch (error) {
    logger.error('Failed to get rule by id', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * 创建规则
 */
export async function createRule(req: Request, res: Response) {
  try {
    const { name, regex, keywords, severity, weight, solution, categories } = req.body;

    // 检查规则名称是否已存在
    const existingRule = await prisma.rule.findUnique({ where: { name } });
    if (existingRule) {
      throw new Error('规则名称已存在', 400);
    }

    // 验证正则表达式
    try {
      new RegExp(regex);
    } catch (e) {
      throw new Error('无效的正则表达式', 400);
    }

    const rule = await prisma.rule.create({
      data: {
        name,
        regex,
        keywords: JSON.stringify(keywords),
        solution: solution || null,
        severity: severity || 'ERROR',
        weight: weight || 50,
        categories: categories ? JSON.stringify(categories) : null,
        enabled: true,
        version: 1
      }
    });

    res.status(201).json({
      code: 0,
      message: 'success',
      data: {
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
        updatedAt: rule.updatedAt.toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to create rule', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * 更新规则
 */
export async function updateRule(req: Request, res: Response) {
  try {
    const { ruleId } = req.params;
    const { name, regex, keywords, severity, weight, solution, categories } = req.body;

    // 检查规则是否存在
    const existingRule = await prisma.rule.findUnique({ where: { id: ruleId } });
    if (!existingRule) {
      throw new Error('规则不存在', 404);
    }

    // 如果更改了名称，检查新名称是否已存在
    if (name && name !== existingRule.name) {
      const duplicateRule = await prisma.rule.findUnique({ where: { name } });
      if (duplicateRule) {
        throw new Error('规则名称已存在', 400);
      }
    }

    // 验证正则表达式
    if (regex) {
      try {
        new RegExp(regex);
      } catch (e) {
        throw new Error('无效的正则表达式', 400);
      }
    }

    // 记录历史版本
    if (existingRule.categories || keywords || regex || name) {
      await prisma.ruleHistory.create({
        data: {
          ruleId,
          version: existingRule.version,
          name: existingRule.name,
          regex: existingRule.regex,
          keywords: existingRule.keywords,
          severity: existingRule.severity,
          weight: existingRule.weight,
          solution: existingRule.solution || null,
          categories: existingRule.categories,
          changeLog: '更新规则',
          changedAt: new Date()
        }
      });
    }

    const updatedRule = await prisma.rule.update({
      where: { id: ruleId },
      data: {
        ...(name && { name }),
        ...(regex && { regex }),
        ...(keywords && { keywords: JSON.stringify(keywords) }),
        ...(severity && { severity }),
        ...(weight !== undefined && { weight }),
        ...(solution && { solution }),
        ...(categories && { categories: JSON.stringify(categories) }),
        version: { increment: 1 }
      }
    });

    res.json({
      code: 0,
      message: 'success',
      data: {
        id: updatedRule.id,
        name: updatedRule.name,
        regex: updatedRule.regex,
        keywords: JSON.parse(updatedRule.keywords),
        solution: updatedRule.solution,
        severity: updatedRule.severity,
        weight: updatedRule.weight,
        categories: updatedRule.categories ? JSON.parse(updatedRule.categories) : [],
        enabled: updatedRule.enabled,
        version: updatedRule.version,
        createdAt: updatedRule.createdAt.toISOString(),
        updatedAt: updatedRule.updatedAt.toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to update rule', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * 删除规则
 */
export async function deleteRule(req: Request, res: Response) {
  try {
    const { ruleId } = req.params;

    const rule = await prisma.rule.findUnique({ where: { id: ruleId } });
    if (!rule) {
      throw new Error('规则不存在', 404);
    }

    // 软删除：标记为禁用
    await prisma.rule.update({
      where: { id: ruleId },
      data: { enabled: false }
    });

    res.json({
      code: 0,
      message: 'success',
      data: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to delete rule', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * 批量删除规则
 */
export async function batchDeleteRules(req: Request, res: Response) {
  try {
    const { ruleIds } = req.body;

    if (!Array.isArray(ruleIds) || ruleIds.length === 0) {
      throw new Error('ruleIds 必须是非空数组', 400);
    }

    await prisma.rule.updateMany({
      where: { id: { in: ruleIds } },
      data: { enabled: false }
    });

    res.json({
      code: 0,
      message: 'success',
      data: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to batch delete rules', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * 导出规则
 */
export async function exportRules(req: Request, res: Response) {
  try {
    const rules = await prisma.rule.findMany({
      where: { enabled: true }
    });

    const exportData = rules.map(rule => ({
      id: rule.id,
      name: rule.name,
      regex: rule.regex,
      keywords: JSON.parse(rule.keywords),
      severity: rule.severity,
      weight: rule.weight,
      solution: rule.solution,
      categories: rule.categories ? JSON.parse(rule.categories) : [],
      createdAt: rule.createdAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString()
    }));

    res.header('Content-Type', 'application/json');
    res.header('Content-Disposition', `attachment; filename="rules-${new Date().toISOString().split('T')[0]}.json"`);
    res.send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    logger.error('Failed to export rules', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * 导入规则
 */
export async function importRules(req: Request, res: Response) {
  try {
    const conflictStrategy = (req.query.conflictStrategy as string) || 'skip';
    
    if (!req.file) {
      throw new Error('未上传文件', 400);
    }

    const content = req.file.buffer.toString('utf-8');
    const importedRules = JSON.parse(content);

    if (!Array.isArray(importedRules)) {
      throw new Error('文件格式错误：应为规则数组', 400);
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const ruleData of importedRules) {
      try {
        // 验证正则表达式
        new RegExp(ruleData.regex);

        const existingRule = await prisma.rule.findUnique({
          where: { name: ruleData.name }
        });

        if (existingRule) {
          if (conflictStrategy === 'skip') {
            skipped++;
            continue;
          } else if (conflictStrategy === 'overwrite') {
            await prisma.rule.update({
              where: { id: existingRule.id },
              data: {
                regex: ruleData.regex,
                keywords: JSON.stringify(ruleData.keywords),
                severity: ruleData.severity,
                weight: ruleData.weight,
                solution: ruleData.solution,
                categories: ruleData.categories ? JSON.stringify(ruleData.categories) : null
              }
            });
            updated++;
          } else if (conflictStrategy === 'merge') {
            skipped++;
          }
        } else {
          await prisma.rule.create({
            data: {
              name: ruleData.name,
              regex: ruleData.regex,
              keywords: JSON.stringify(ruleData.keywords),
              severity: ruleData.severity || 'ERROR',
              weight: ruleData.weight || 50,
              solution: ruleData.solution,
              categories: ruleData.categories ? JSON.stringify(ruleData.categories) : null,
              enabled: true,
              version: 1
            }
          });
          imported++;
        }
      } catch (e) {
        failed++;
        errors.push(`规则 "${ruleData.name}" 导入失败: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    res.json({
      code: 0,
      message: 'success',
      data: {
        imported,
        updated,
        skipped,
        failed,
        errors: errors.slice(0, 10) // 只返回前10个错误
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to import rules', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * 获取规则历史
 */
export async function getRuleHistory(req: Request, res: Response) {
  try {
    const { ruleId } = req.params;

    const rule = await prisma.rule.findUnique({ where: { id: ruleId } });
    if (!rule) {
      throw new Error('规则不存在', 404);
    }

    const history = await prisma.ruleHistory.findMany({
      where: { ruleId },
      orderBy: { changedAt: 'desc' }
    });

    const formattedHistory = history.map(h => ({
      versionId: h.id,
      version: h.version,
      name: h.name,
      regex: h.regex,
      keywords: JSON.parse(h.keywords),
      severity: h.severity,
      weight: h.weight,
      solution: h.solution,
      categories: h.categories ? JSON.parse(h.categories) : [],
      changeLog: h.changeLog,
      changedAt: h.changedAt.toISOString()
    }));

    res.json({
      code: 0,
      message: 'success',
      data: formattedHistory,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get rule history', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * 回滚规则
 */
export async function rollbackRule(req: Request, res: Response) {
  try {
    const { ruleId, versionId } = req.params;

    const rule = await prisma.rule.findUnique({ where: { id: ruleId } });
    if (!rule) {
      throw new Error('规则不存在', 404);
    }

    const historyRecord = await prisma.ruleHistory.findUnique({ where: { id: versionId } });
    if (!historyRecord) {
      throw new Error('历史版本不存在', 404);
    }

    if (historyRecord.ruleId !== ruleId) {
      throw new Error('历史版本不属于该规则', 400);
    }

    // 创建当前版本的历史记录
    await prisma.ruleHistory.create({
      data: {
        ruleId,
        version: rule.version,
        name: rule.name,
        regex: rule.regex,
        keywords: rule.keywords,
        severity: rule.severity,
        weight: rule.weight,
        solution: rule.solution,
        categories: rule.categories,
        changeLog: `从版本 ${historyRecord.version} 回滚`,
        changedAt: new Date()
      }
    });

    // 恢复历史版本
    const restoredRule = await prisma.rule.update({
      where: { id: ruleId },
      data: {
        name: historyRecord.name,
        regex: historyRecord.regex,
        keywords: historyRecord.keywords,
        severity: historyRecord.severity,
        weight: historyRecord.weight,
        solution: historyRecord.solution,
        categories: historyRecord.categories,
        version: { increment: 1 }
      }
    });

    res.json({
      code: 0,
      message: 'success',
      data: {
        id: restoredRule.id,
        version: restoredRule.version,
        message: `已回滚到版本 ${historyRecord.version}`
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to rollback rule', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * 验证规则
 */
export async function validateRules(req: Request, res: Response) {
  try {
    const { ruleIds, uploadType, content, fileName } = req.body;

    if (!Array.isArray(ruleIds) || ruleIds.length === 0) {
      throw new Error('ruleIds 必须是非空数组', 400);
    }

    // 获取日志内容
    let logContent = content;
    if (uploadType === 'url') {
      const axios = (await import('axios')).default;
      try {
        const response = await axios.get(content, { timeout: 10000 });
        logContent = response.data;
      } catch (e) {
        throw new Error('无法下载日志文件', 400);
      }
    } else if (uploadType === 'file') {
      // content 应该是 base64 编码的文件内容
      logContent = Buffer.from(content, 'base64').toString('utf-8');
    }

    // 按行分割日志
    const logLines = logContent.split('\n');

    // 获取规则
    const rules = await prisma.rule.findMany({
      where: { id: { in: ruleIds } }
    });

    const results = rules.map(rule => {
      const keywords = JSON.parse(rule.keywords);
      const regex = new RegExp(rule.regex);
      const matchedLines: number[] = [];

      logLines.forEach((line, index) => {
        // 关键词初筛
        const hasKeywords = keywords.every(keyword => 
          line.toLowerCase().includes(keyword.toLowerCase())
        );

        if (hasKeywords && regex.test(line)) {
          matchedLines.push(index + 1);
        }
      });

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        matched: matchedLines.length > 0,
        matchCount: matchedLines.length,
        matchedLines: matchedLines.slice(0, 100) // 最多返回100个匹配行
      };
    });

    res.json({
      code: 0,
      message: 'success',
      data: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to validate rules', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * 批量更新分类
 */
export async function batchUpdateCategories(req: Request, res: Response) {
  try {
    const { ruleIds, addCategories, removeCategories } = req.body;

    if (!Array.isArray(ruleIds) || ruleIds.length === 0) {
      throw new Error('ruleIds 必须是非空数组', 400);
    }

    let updated = 0;

    for (const ruleId of ruleIds) {
      const rule = await prisma.rule.findUnique({ where: { id: ruleId } });
      if (!rule) continue;

      let categories = rule.categories ? JSON.parse(rule.categories) : [];

      if (addCategories && Array.isArray(addCategories)) {
        categories = [...new Set([...categories, ...addCategories])];
      }

      if (removeCategories && Array.isArray(removeCategories)) {
        categories = categories.filter(
          (cat: string) => !removeCategories.includes(cat)
        );
      }

      await prisma.rule.update({
        where: { id: ruleId },
        data: { categories: JSON.stringify(categories) }
      });

      updated++;
    }

    res.json({
      code: 0,
      message: 'success',
      data: { updated },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to batch update categories', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

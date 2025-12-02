/**
 * 规则控制器
 */

import { Request, Response, NextFunction } from 'express';
import {
  createRule,
  getRuleList,
  getRuleById,
  updateRule,
  deleteRule,
  batchDeleteRules,
  getRuleHistory,
  rollbackRule,
  batchUpdateCategory,
  exportRules,
  importRules,
} from '../services/ruleService';
import { sendSuccess, sendError } from '../utils/response';
import { RuleQueryParams, CreateRuleInput, ConflictStrategy } from '../types/rule.types';
import { NotFoundError } from '../middleware/errorHandler';
import { processLogFile } from '../services/fileService';
import { loadAndCompileRules, CompiledRule } from '../services/analysisService';

/**
 * 获取规则列表
 */
export async function getRules(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const params: RuleQueryParams = {
      pageNo: Number(req.query.pageNo) || 1,
      pageSize: Number(req.query.pageSize) || 20,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as any,
      searchKeyword: req.query.searchKeyword as string,
      categoryFilter: Array.isArray(req.query.categoryFilter)
        ? req.query.categoryFilter
        : req.query.categoryFilter
        ? [req.query.categoryFilter as string]
        : undefined,
      severityFilter: Array.isArray(req.query.severityFilter)
        ? (req.query.severityFilter as any)
        : req.query.severityFilter
        ? [req.query.severityFilter as any]
        : undefined,
      enabled: req.query.enabled !== undefined ? req.query.enabled === 'true' : undefined,
    };

    const result = await getRuleList(params);

    sendSuccess(res, {
      pagination: result.pagination,
      rules: result.rules,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取单个规则
 */
export async function getRule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const rule = await getRuleById(id);
    sendSuccess(res, rule);
  } catch (error) {
    next(error);
  }
}

/**
 * 创建规则
 */
export async function createRuleHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rule = await createRule(req.body);
    res.status(201);
    sendSuccess(res, rule, 'Rule created successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * 更新规则
 */
export async function updateRuleHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const rule = await updateRule(id, req.body);
    sendSuccess(res, rule, 'Rule updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * 删除规则
 */
export async function deleteRuleHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await deleteRule(id);
    sendSuccess(res, null, 'Rule deleted successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * 批量删除规则
 */
export async function batchDeleteRulesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { ruleIds } = req.body;
    if (!Array.isArray(ruleIds) || ruleIds.length === 0) {
      return sendError(res, 'ruleIds must be a non-empty array', 400);
    }

    const result = await batchDeleteRules(ruleIds);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * 获取规则版本历史
 */
export async function getRuleHistoryHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const pageNo = Number(req.query.pageNo) || 1;
    const pageSize = Number(req.query.pageSize) || 10;

    const result = await getRuleHistory(id, pageNo, pageSize);
    sendSuccess(res, {
      ruleId: id,
      pagination: result.pagination,
      versions: result.histories,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 回滚规则到指定版本
 */
export async function rollbackRuleHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id, versionId } = req.params;
    const version = Number(versionId);

    if (isNaN(version)) {
      return sendError(res, 'Invalid version ID', 400);
    }

    const rule = await rollbackRule(id, version);
    sendSuccess(res, {
      ruleId: id,
      currentVersion: rule.version,
      rolledBackVersion: version,
    }, 'Rule rolled back successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * 批量更新分类
 */
export async function batchUpdateCategoryHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { ruleIds, addCategories, removeCategories } = req.body;

    if (!Array.isArray(ruleIds) || ruleIds.length === 0) {
      return sendError(res, 'ruleIds must be a non-empty array', 400);
    }

    const result = await batchUpdateCategory(ruleIds, addCategories, removeCategories);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * 导出规则
 */
export async function exportRulesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ruleIds = req.query.ruleIds
      ? (req.query.ruleIds as string).split(',').filter(Boolean)
      : undefined;

    const rules = await exportRules(ruleIds);

    // 设置响应头，让浏览器下载文件
    const filename = `rules-export-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    sendSuccess(res, rules);
  } catch (error) {
    next(error);
  }
}

/**
 * 导入规则
 */
export async function importRulesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { conflictStrategy = 'skip' } = req.body;

    if (!req.file) {
      return sendError(res, 'No file uploaded', 400);
    }

    // 解析 JSON 文件
    const fileContent = req.file.buffer.toString('utf-8');
    let rules: CreateRuleInput[];
    try {
      rules = JSON.parse(fileContent);
      if (!Array.isArray(rules)) {
        return sendError(res, 'Invalid JSON format: expected an array', 400);
      }
    } catch (error) {
      return sendError(res, 'Invalid JSON file', 400);
    }

    const result = await importRules(rules, conflictStrategy as ConflictStrategy);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * 验证规则
 */
export async function validateRulesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { ruleIds, uploadType, content, fileName } = req.body;

    if (!Array.isArray(ruleIds) || ruleIds.length === 0) {
      return sendError(res, 'ruleIds must be a non-empty array', 400);
    }

    // 获取指定规则
    const allRules = await getRuleList({ pageNo: 1, pageSize: 1000 });
    const selectedRules = allRules.rules.filter((r) => ruleIds.includes(r.id));

    if (selectedRules.length === 0) {
      return sendError(res, 'No rules found', 404);
    }

    // 处理日志内容
    const { lines } = await processLogFile(uploadType, content);

    // 编译规则
    const allCompiledRules = await loadAndCompileRules();
    const selectedCompiledRules = allCompiledRules.filter((r) => ruleIds.includes(r.id));
    const rulesMap = new Map(selectedCompiledRules.map((r) => [r.id, r]));

    // 匹配日志
    const results = selectedRules.map((rule) => {
      const compiledRule: CompiledRule | undefined = rulesMap.get(rule.id);
      if (!compiledRule) {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          matched: false,
          matchCount: 0,
          matches: [],
        };
      }

      const matches: Array<{
        lineNumber: number;
        matchedText: string;
        context: {
          before: string[];
          current: string;
          after: string[];
        };
      }> = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = compiledRule.regex.exec(line);
        if (match) {
          const contextSize = 3;
          const start = Math.max(0, i - contextSize);
          const end = Math.min(lines.length - 1, i + contextSize);

          matches.push({
            lineNumber: i + 1,
            matchedText: match[0],
            context: {
              before: lines.slice(start, i),
              current: line,
              after: lines.slice(i + 1, end + 1),
            },
          });
        }
      }

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        matched: matches.length > 0,
        matchCount: matches.length,
        matches,
      };
    });

    sendSuccess(res, { results });
  } catch (error) {
    next(error);
  }
}


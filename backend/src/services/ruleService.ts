/**
 * 规则服务模块
 */

import { PrismaClient } from '@prisma/client';
import {
  Rule,
  CreateRuleInput,
  UpdateRuleInput,
  RuleQueryParams,
  RuleHistory,
  ConflictStrategy,
  RuleImportResult,
} from '../types/rule.types';
import { calculatePagination, safeJsonParse, safeJsonStringify } from '../utils/formatters';
import { logger } from '../utils/logger';
import { NotFoundError, ConflictError, ValidationError } from '../middleware/errorHandler';
import { validateRegex } from '../utils/validators';
import { cache } from '../utils/cache';
import { RULE_CACHE_TTL } from '../config/constants';
import { clearRuleCache } from './analysisService';

const prisma = new PrismaClient();

/**
 * 创建规则
 */
export async function createRule(input: CreateRuleInput): Promise<Rule> {
  // 验证正则表达式
  if (!validateRegex(input.regex)) {
    throw new ValidationError('Invalid regex pattern');
  }

  // 检查名称是否已存在
  const existing = await prisma.rule.findUnique({
    where: { name: input.name },
  });

  if (existing) {
    throw new ConflictError(`Rule with name "${input.name}" already exists`);
  }

  // 创建规则
  const rule = await prisma.rule.create({
    data: {
      name: input.name,
      regex: input.regex,
      keywords: safeJsonStringify(input.keywords),
      solution: input.solution || null,
      severity: input.severity,
      weight: input.weight ?? 50,
      categories: input.categories ? safeJsonStringify(input.categories) : null,
      enabled: true,
      version: 1,
    },
  });

  // 创建初始历史版本
  await prisma.ruleHistory.create({
    data: {
      ruleId: rule.id,
      version: 1,
      name: rule.name,
      regex: rule.regex,
      keywords: rule.keywords,
      solution: rule.solution,
      severity: rule.severity,
      weight: rule.weight,
      categories: rule.categories,
      changeLog: 'Initial version',
    },
  });

  // 清除缓存
  cache.delete('compiled_rules');
  clearRuleCache();

  logger.info('Rule created', { ruleId: rule.id, ruleName: rule.name });

  return formatRule(rule);
}

/**
 * 获取规则列表
 */
export async function getRuleList(params: RuleQueryParams): Promise<{
  rules: Rule[];
  pagination: ReturnType<typeof calculatePagination>;
}> {
  const { pageNo, pageSize, sortBy = 'updatedAt', sortOrder = 'desc', searchKeyword, categoryFilter, severityFilter, enabled } = params;

  // 构建查询条件
  const where: any = {};

  if (enabled !== undefined) {
    where.enabled = enabled;
  }

  if (severityFilter && severityFilter.length > 0) {
    where.severity = { in: severityFilter };
  }

  if (searchKeyword) {
    where.OR = [
      { name: { contains: searchKeyword } },
      { regex: { contains: searchKeyword } },
    ];
  }

  // 获取总数
  const total = await prisma.rule.count({ where });

  // 获取列表
  const rules = await prisma.rule.findMany({
    where,
    skip: (pageNo - 1) * pageSize,
    take: pageSize,
    orderBy: { [sortBy]: sortOrder },
  });

  // 过滤分类（需要在应用层处理，因为 categories 是 JSON 字符串）
  let filteredRules = rules.map(formatRule);

  if (categoryFilter && categoryFilter.length > 0) {
    filteredRules = filteredRules.filter((rule) => {
      if (!rule.categories || rule.categories.length === 0) {
        return false;
      }
      return categoryFilter.some((cat) => rule.categories!.includes(cat));
    });
  }

  return {
    rules: filteredRules,
    pagination: calculatePagination(pageNo, pageSize, total),
  };
}

/**
 * 获取单个规则
 */
export async function getRuleById(id: string): Promise<Rule> {
  const rule = await prisma.rule.findUnique({
    where: { id },
  });

  if (!rule) {
    throw new NotFoundError(`Rule with id "${id}" not found`);
  }

  return formatRule(rule);
}

/**
 * 更新规则
 */
export async function updateRule(id: string, input: UpdateRuleInput): Promise<Rule> {
  // 检查规则是否存在
  const existing = await prisma.rule.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new NotFoundError(`Rule with id "${id}" not found`);
  }

  // 如果更新了名称，检查是否冲突
  if (input.name && input.name !== existing.name) {
    const nameConflict = await prisma.rule.findUnique({
      where: { name: input.name },
    });

    if (nameConflict) {
      throw new ConflictError(`Rule with name "${input.name}" already exists`);
    }
  }

  // 如果更新了正则表达式，验证语法
  if (input.regex && !validateRegex(input.regex)) {
    throw new ValidationError('Invalid regex pattern');
  }

  // 准备更新数据
  const updateData: any = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.regex !== undefined) updateData.regex = input.regex;
  if (input.keywords !== undefined) updateData.keywords = safeJsonStringify(input.keywords);
  if (input.solution !== undefined) updateData.solution = input.solution || null;
  if (input.severity !== undefined) updateData.severity = input.severity;
  if (input.weight !== undefined) updateData.weight = input.weight;
  if (input.categories !== undefined) {
    updateData.categories = input.categories ? safeJsonStringify(input.categories) : null;
  }
  if (input.enabled !== undefined) updateData.enabled = input.enabled;

  // 如果有关键字段更新，增加版本号
  const hasVersionChange =
    input.regex !== undefined ||
    input.keywords !== undefined ||
    input.severity !== undefined;

  if (hasVersionChange) {
    updateData.version = existing.version + 1;
  }

  // 更新规则
  const updated = await prisma.$transaction(async (tx) => {
    const rule = await tx.rule.update({
      where: { id },
      data: updateData,
    });

    // 如果版本号增加，保存历史版本
    if (hasVersionChange) {
      await tx.ruleHistory.create({
        data: {
          ruleId: rule.id,
          version: existing.version,
          name: existing.name,
          regex: existing.regex,
          keywords: existing.keywords,
          solution: existing.solution,
          severity: existing.severity,
          weight: existing.weight,
          categories: existing.categories,
          changeLog: 'Rule updated',
        },
      });
    }

    return rule;
  });

  // 清除缓存
  cache.delete('compiled_rules');
  clearRuleCache();

  logger.info('Rule updated', { ruleId: id });

  return formatRule(updated);
}

/**
 * 删除规则
 */
export async function deleteRule(id: string): Promise<void> {
  const rule = await prisma.rule.findUnique({
    where: { id },
  });

  if (!rule) {
    throw new NotFoundError(`Rule with id "${id}" not found`);
  }

  await prisma.rule.delete({
    where: { id },
  });

  // 清除缓存
  cache.delete('compiled_rules');
  clearRuleCache();

  logger.info('Rule deleted', { ruleId: id });
}

/**
 * 批量删除规则
 */
export async function batchDeleteRules(ruleIds: string[]): Promise<{ deleted: number; failed: number }> {
  let deleted = 0;
  let failed = 0;

  for (const id of ruleIds) {
    try {
      await deleteRule(id);
      deleted++;
    } catch (error) {
      logger.error('Failed to delete rule', { ruleId: id, error });
      failed++;
    }
  }

  return { deleted, failed };
}

/**
 * 获取规则版本历史
 */
export async function getRuleHistory(
  ruleId: string,
  pageNo: number = 1,
  pageSize: number = 10
): Promise<{
  histories: RuleHistory[];
  pagination: ReturnType<typeof calculatePagination>;
}> {
  const total = await prisma.ruleHistory.count({
    where: { ruleId },
  });

  const histories = await prisma.ruleHistory.findMany({
    where: { ruleId },
    skip: (pageNo - 1) * pageSize,
    take: pageSize,
    orderBy: { version: 'desc' },
  });

  return {
    histories: histories.map(formatRuleHistory),
    pagination: calculatePagination(pageNo, pageSize, total),
  };
}

/**
 * 回滚规则到指定版本
 */
export async function rollbackRule(ruleId: string, version: number): Promise<Rule> {
  const history = await prisma.ruleHistory.findUnique({
    where: {
      ruleId_version: {
        ruleId,
        version,
      },
    },
  });

  if (!history) {
    throw new NotFoundError(`Rule history version ${version} not found`);
  }

  const current = await prisma.rule.findUnique({
    where: { id: ruleId },
  });

  if (!current) {
    throw new NotFoundError(`Rule with id "${ruleId}" not found`);
  }

  // 回滚规则
  const rolledBack = await prisma.$transaction(async (tx) => {
    // 保存当前版本到历史
    await tx.ruleHistory.create({
      data: {
        ruleId: current.id,
        version: current.version,
        name: current.name,
        regex: current.regex,
        keywords: current.keywords,
        solution: current.solution,
        severity: current.severity,
        weight: current.weight,
        categories: current.categories,
        changeLog: `Rolled back to version ${version}`,
      },
    });

    // 恢复历史版本
    const rule = await tx.rule.update({
      where: { id: ruleId },
      data: {
        name: history.name,
        regex: history.regex,
        keywords: history.keywords,
        solution: history.solution,
        severity: history.severity,
        weight: history.weight,
        categories: history.categories,
        version: current.version + 1,
      },
    });

    return rule;
  });

  // 清除缓存
  cache.delete('compiled_rules');
  clearRuleCache();

  logger.info('Rule rolled back', { ruleId, version });

  return formatRule(rolledBack);
}

/**
 * 批量更新分类
 */
export async function batchUpdateCategory(
  ruleIds: string[],
  addCategories?: string[],
  removeCategories?: string[]
): Promise<{ updated: number; failed: number }> {
  let updated = 0;
  let failed = 0;

  for (const id of ruleIds) {
    try {
      const rule = await getRuleById(id);
      const categories = new Set(rule.categories || []);

      if (addCategories) {
        addCategories.forEach((cat) => categories.add(cat));
      }

      if (removeCategories) {
        removeCategories.forEach((cat) => categories.delete(cat));
      }

      await updateRule(id, {
        categories: Array.from(categories),
      });

      updated++;
    } catch (error) {
      logger.error('Failed to update rule category', { ruleId: id, error });
      failed++;
    }
  }

  return { updated, failed };
}

/**
 * 导出规则
 */
export async function exportRules(ruleIds?: string[]): Promise<Rule[]> {
  const where = ruleIds
    ? { id: { in: ruleIds }, enabled: true }
    : { enabled: true };

  const rules = await prisma.rule.findMany({
    where,
  });

  return rules.map(formatRule);
}

/**
 * 导入规则
 */
export async function importRules(
  rules: CreateRuleInput[],
  conflictStrategy: ConflictStrategy = 'skip'
): Promise<RuleImportResult> {
  const result: RuleImportResult = {
    imported: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  for (let i = 0; i < rules.length; i++) {
    const ruleData = rules[i];

    try {
      // 验证正则表达式
      if (!validateRegex(ruleData.regex)) {
        result.failed++;
        result.errors.push({
          ruleIndex: i,
          ruleName: ruleData.name,
          error: 'Invalid regex pattern',
        });
        continue;
      }

      // 检查规则是否已存在
      const existing = await prisma.rule.findUnique({
        where: { name: ruleData.name },
      });

      if (existing) {
        if (conflictStrategy === 'skip') {
          result.skipped++;
          continue;
        } else if (conflictStrategy === 'overwrite') {
          await updateRule(existing.id, ruleData);
          result.updated++;
          continue;
        } else if (conflictStrategy === 'merge') {
          // 合并逻辑：合并关键词和分类
          const existingRule = formatRule(existing);
          const mergedKeywords = Array.from(
            new Set([...existingRule.keywords, ...ruleData.keywords])
          );
          const mergedCategories = Array.from(
            new Set([
              ...(existingRule.categories || []),
              ...(ruleData.categories || []),
            ])
          );

          await updateRule(existing.id, {
            ...ruleData,
            keywords: mergedKeywords,
            categories: mergedCategories,
          });
          result.updated++;
          continue;
        }
      }

      // 创建新规则
      await createRule(ruleData);
      result.imported++;
    } catch (error) {
      result.failed++;
      result.errors.push({
        ruleIndex: i,
        ruleName: ruleData.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return result;
}

/**
 * 格式化规则（从数据库格式转换为应用格式）
 */
function formatRule(rule: any): Rule {
  return {
    id: rule.id,
    name: rule.name,
    regex: rule.regex,
    keywords: safeJsonParse<string[]>(rule.keywords, []),
    solution: rule.solution || undefined,
    severity: rule.severity as any,
    weight: rule.weight,
    categories: rule.categories ? safeJsonParse<string[]>(rule.categories, []) : undefined,
    enabled: rule.enabled,
    version: rule.version,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  };
}

/**
 * 格式化规则历史
 */
function formatRuleHistory(history: any): RuleHistory {
  return {
    id: history.id,
    ruleId: history.ruleId,
    version: history.version,
    name: history.name,
    regex: history.regex,
    keywords: safeJsonParse<string[]>(history.keywords, []),
    solution: history.solution || undefined,
    severity: history.severity as any,
    weight: history.weight,
    categories: history.categories ? safeJsonParse<string[]>(history.categories, []) : undefined,
    changeLog: history.changeLog || undefined,
    changedAt: history.changedAt,
  };
}


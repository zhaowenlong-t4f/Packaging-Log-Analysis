/**
 * 日志分析服务
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { regexMatch, compileRegex } from '../utils/regexMatcher';
import { cache } from '../utils/cache';
import { RULE_CACHE_TTL, DEFAULT_CONTEXT_SIZE, SEVERITY_ORDER } from '../config/constants';
import { ContextLines, ContextLine } from '../types/log.types';
import { safeJsonParse } from '../utils/formatters';

const prisma = new PrismaClient();

export interface CompiledRule {
  id: string;
  name: string;
  regex: RegExp;
  keywords: string[];
  severity: string;
  weight: number;
  solution?: string;
  errorType: string;
}

interface MatchRecord {
  ruleId: string;
  lineNumber: number;
  rawLine: string;
  normalizedLine: string;
}

/**
 * 关键词初筛：快速过滤不匹配的行
 */
function keywordFilter(line: string, keywords: string[]): boolean {
  if (keywords.length === 0) {
    return true;
  }

  const lowerLine = line.toLowerCase();
  return keywords.some((keyword) => lowerLine.includes(keyword.toLowerCase()));
}

/**
 * 提取上下文行
 */
export function extractContext(
  lines: string[],
  errorLineNumber: number,
  contextSize: number = DEFAULT_CONTEXT_SIZE
): ContextLines {
  const start = Math.max(0, errorLineNumber - contextSize);
  const end = Math.min(lines.length - 1, errorLineNumber + contextSize);

  const before: ContextLine[] = lines
    .slice(start, errorLineNumber)
    .map((line, idx) => ({
      lineNo: start + idx + 1,
      content: line,
      isMatch: false,
    }));

  const current: ContextLine = {
    lineNo: errorLineNumber + 1,
    content: lines[errorLineNumber],
    isMatch: true,
  };

  const after: ContextLine[] = lines
    .slice(errorLineNumber + 1, end + 1)
    .map((line, idx) => ({
      lineNo: errorLineNumber + 2 + idx,
      content: line,
      isMatch: false,
    }));

  return { before, current, after };
}

/**
 * 加载并编译规则
 */
export async function loadAndCompileRules(): Promise<CompiledRule[]> {
  const cacheKey = 'compiled_rules';
  const cached = cache.get<CompiledRule[]>(cacheKey);
  if (cached) {
    return cached;
  }

  logger.info('Loading rules from database');

  const rules = await prisma.rule.findMany({
    where: { enabled: true },
  });

  const compiledRules = rules
    .map((rule) => {
      try {
        const keywords = safeJsonParse<string[]>(rule.keywords, []);
        const regex = compileRegex(rule.regex);

        return {
          id: rule.id,
          name: rule.name,
          regex,
          keywords,
          severity: rule.severity,
          weight: rule.weight,
          solution: rule.solution || undefined,
          errorType: rule.name, // 使用规则名称作为错误类型
        } as CompiledRule;
      } catch (error) {
        logger.error('Failed to compile rule', {
          ruleId: rule.id,
          ruleName: rule.name,
          error,
        });
        return null;
      }
    })
    .filter((rule): rule is CompiledRule => rule !== null);

  // 缓存编译后的规则
  cache.set(cacheKey, compiledRules, RULE_CACHE_TTL);

  logger.info('Rules loaded and compiled', { count: compiledRules.length });

  return compiledRules;
}

/**
 * 匹配日志行
 */
function matchLogLines(lines: string[], compiledRules: CompiledRule[]): MatchRecord[] {
  const matches: MatchRecord[] = [];

  logger.info('Starting log matching', {
    lineCount: lines.length,
    ruleCount: compiledRules.length,
  });

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];

    for (const rule of compiledRules) {
      // 关键词初筛
      if (!keywordFilter(line, rule.keywords)) {
        continue;
      }

      // 正则精确匹配
      const match = regexMatch(line, rule.regex);
      if (match) {
        matches.push({
          ruleId: rule.id,
          lineNumber: lineIndex,
          rawLine: line,
          normalizedLine: line.trim(),
        });
        // 一个规则匹配后，不再尝试其他规则（避免重复匹配）
        break;
      }
    }
  }

  logger.info('Log matching completed', { matchCount: matches.length });

  return matches;
}

/**
 * 聚合错误
 */
function aggregateErrors(
  matches: MatchRecord[],
  _compiledRules: Map<string, CompiledRule>
): Map<string, {
  ruleId: string;
  errorLine: string;
  occurrences: Array<{ lineNumber: number; rawLine: string }>;
}> {
  const errorMap = new Map<
    string,
    {
      ruleId: string;
      errorLine: string;
      occurrences: Array<{ lineNumber: number; rawLine: string }>;
    }
  >();

  for (const match of matches) {
    const key = `${match.ruleId}|${match.normalizedLine}`;

    if (!errorMap.has(key)) {
      errorMap.set(key, {
        ruleId: match.ruleId,
        errorLine: match.normalizedLine,
        occurrences: [],
      });
    }

    const group = errorMap.get(key)!;
    group.occurrences.push({
      lineNumber: match.lineNumber,
      rawLine: match.rawLine,
    });
  }

  return errorMap;
}

/**
 * 排序错误（按严重程度、权重、出现次数）
 */
function sortErrors<T extends { severity: string; occurrenceCount: number; ruleId: string }>(
  errors: T[],
  rulesMap: Map<string, CompiledRule>
): T[] {
  return errors.sort((a, b) => {
    const ruleA = rulesMap.get(a.ruleId);
    const ruleB = rulesMap.get(b.ruleId);
    const weightA = ruleA?.weight || 50;
    const weightB = ruleB?.weight || 50;

    // 1. 按严重程度排序
    const severityOrderA = SEVERITY_ORDER[a.severity] ?? 999;
    const severityOrderB = SEVERITY_ORDER[b.severity] ?? 999;
    if (severityOrderA !== severityOrderB) {
      return severityOrderA - severityOrderB;
    }

    // 2. 按权重排序
    if (weightA !== weightB) {
      return weightB - weightA;
    }

    // 3. 按出现次数排序
    return b.occurrenceCount - a.occurrenceCount;
  });
}

/**
 * 分析日志
 */
export async function analyzeLog(lines: string[]): Promise<{
  errors: Array<{
    ruleId: string;
    errorType: string;
    severity: string;
    title: string;
    description: string;
    solution?: string;
    occurrenceCount: number;
    firstOccurrenceLine: number;
    lastOccurrenceLine: number;
    occurrences: Array<{
      lineNumber: number;
      rawLine: string;
      context: ContextLines;
    }>;
  }>;
  errorCount: number;
  warningCount: number;
}> {
  const startTime = Date.now();

  // 1. 加载并编译规则
  const compiledRules = await loadAndCompileRules();
  const rulesMap = new Map(compiledRules.map((r) => [r.id, r]));

  // 2. 匹配日志行
  const matches = matchLogLines(lines, compiledRules);

  // 3. 聚合错误
  const errorMap = aggregateErrors(matches, rulesMap);

  // 4. 转换为错误列表
  const errors = Array.from(errorMap.values()).map((group) => {
    const rule = rulesMap.get(group.ruleId)!;
    const occurrences = group.occurrences.sort((a, b) => a.lineNumber - b.lineNumber);

    return {
      ruleId: group.ruleId,
      errorType: rule.errorType,
      severity: rule.severity,
      title: rule.name,
      description: group.errorLine,
      solution: rule.solution,
      occurrenceCount: occurrences.length,
      firstOccurrenceLine: occurrences[0].lineNumber,
      lastOccurrenceLine: occurrences[occurrences.length - 1].lineNumber,
      occurrences: occurrences.map((occ) => ({
        lineNumber: occ.lineNumber,
        rawLine: occ.rawLine,
        context: extractContext(lines, occ.lineNumber),
      })),
    };
  });

  // 5. 排序
  const sortedErrors = sortErrors(errors, rulesMap);

  // 6. 统计
  const criticalErrorCount = sortedErrors.filter((e) => e.severity === 'CRITICAL' || e.severity === 'ERROR').length;
  const warningCount = sortedErrors.filter((e) => e.severity === 'WARNING').length;

  const duration = Date.now() - startTime;
  logger.info('Log analysis completed', {
    duration,
    lineCount: lines.length,
    totalErrorCount: sortedErrors.length,
    errorCount: criticalErrorCount,
    warningCount,
  });

  return {
    errors: sortedErrors,
    errorCount: criticalErrorCount,
    warningCount,
  };
}

/**
 * 清除规则缓存
 */
export function clearRuleCache(): void {
  cache.delete('compiled_rules');
  logger.info('Rule cache cleared');
}


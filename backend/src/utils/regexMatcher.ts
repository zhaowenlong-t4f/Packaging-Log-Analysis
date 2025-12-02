/**
 * 正则表达式匹配工具
 */

import { logger } from './logger';

export interface MatchResult {
  fullMatch: string;
  groups: string[];
  matchedAt: number;
}

/**
 * 执行正则匹配
 */
export function regexMatch(line: string, regex: RegExp): MatchResult | null {
  try {
    const match = regex.exec(line);
    if (match) {
      return {
        fullMatch: match[0],
        groups: match.slice(1),
        matchedAt: match.index || 0,
      };
    }
    return null;
  } catch (error) {
    logger.error('Regex execution error', {
      regex: regex.source,
      line: line.substring(0, 100),
      error,
    });
    return null;
  }
}

/**
 * 编译正则表达式（带缓存）
 */
const regexCache = new Map<string, RegExp>();

export function compileRegex(pattern: string, flags: string = 'i'): RegExp {
  const cacheKey = `${pattern}:${flags}`;
  
  if (regexCache.has(cacheKey)) {
    return regexCache.get(cacheKey)!;
  }

  try {
    const regex = new RegExp(pattern, flags);
    regexCache.set(cacheKey, regex);
    return regex;
  } catch (error) {
    logger.error('Regex compilation error', { pattern, error });
    throw new Error(`Invalid regex pattern: ${pattern}`);
  }
}

/**
 * 清除正则缓存
 */
export function clearRegexCache(): void {
  regexCache.clear();
}


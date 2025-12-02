/**
 * 格式化工具函数
 */

import { PaginationResponse } from '../types/common.types';

/**
 * 计算分页信息
 */
export function calculatePagination(
  pageNo: number,
  pageSize: number,
  total: number
): PaginationResponse {
  return {
    pageNo,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * 格式化日期为 ISO 字符串
 */
export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    return new Date(date).toISOString();
  }
  return date.toISOString();
}

/**
 * 生成追踪 ID
 */
export function generateTraceId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 标准化字符串（去除首尾空格，转换为小写）
 */
export function normalizeString(str: string): string {
  return str.trim().toLowerCase();
}

/**
 * 安全解析 JSON
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * 安全序列化 JSON
 */
export function safeJsonStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return '{}';
  }
}


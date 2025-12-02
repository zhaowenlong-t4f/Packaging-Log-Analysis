/**
 * 应用常量配置
 */

// API 版本
export const API_VERSION = 'v1';
export const API_BASE_PATH = `/api/${API_VERSION}`;

// 分页默认值
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// 严重程度枚举
export const SEVERITY_LEVELS = ['CRITICAL', 'ERROR', 'WARNING', 'INFO'] as const;
export const SEVERITY_ORDER: Record<string, number> = {
  CRITICAL: 0,
  ERROR: 1,
  WARNING: 2,
  INFO: 3,
};

// 上下文行数
export const DEFAULT_CONTEXT_SIZE = 3;
export const MAX_CONTEXT_SIZE = 10;

// 规则缓存 TTL（秒）
export const RULE_CACHE_TTL = 300; // 5分钟

// 文件处理
export const CHUNK_SIZE = 64 * 1024; // 64KB
export const LINE_BATCH_SIZE = 1000; // 每批处理的行数

// 响应代码
export const RESPONSE_CODE = {
  SUCCESS: 0,
  VALIDATION_ERROR: 422,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const;


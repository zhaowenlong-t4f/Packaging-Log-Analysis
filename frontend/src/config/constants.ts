/**
 * 应用常量配置
 */

// API 基础 URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

// 文件大小限制
export const MAX_FILE_SIZE = 524288000; // 500MB
export const MAX_TEXT_SIZE = 52428800; // 50MB

// 分页默认值
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_PAGE_NO = 1;

// 严重程度选项
export const SEVERITY_OPTIONS = [
  { label: '致命', value: 'CRITICAL', color: '#ff4d4f' },
  { label: '错误', value: 'ERROR', color: '#ff7a45' },
  { label: '警告', value: 'WARNING', color: '#faad14' },
  { label: '信息', value: 'INFO', color: '#1890ff' },
];

// 严重程度顺序（用于排序）
export const SEVERITY_ORDER = {
  CRITICAL: 0,
  ERROR: 1,
  WARNING: 2,
  INFO: 3,
} as const;

// 上传类型
export const UPLOAD_TYPES = [
  { label: 'URL上传', value: 'url' },
  { label: '本地文件', value: 'file' },
  { label: '粘贴文本', value: 'text' },
] as const;

// 冲突处理策略
export const CONFLICT_STRATEGIES = [
  { label: '覆盖', value: 'overwrite' },
  { label: '跳过', value: 'skip' },
  { label: '合并', value: 'merge' },
];


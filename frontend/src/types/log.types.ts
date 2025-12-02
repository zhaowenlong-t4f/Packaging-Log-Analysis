/**
 * 日志相关类型定义
 */

import { PaginationParams, SortParams, SearchParams } from './common.types';

// 上传类型
export type UploadType = 'url' | 'file' | 'text';

// 日志上传请求
export interface LogUploadRequest {
  uploadType: UploadType;
  content: string; // URL / Base64 / Text
  fileName: string;
  metadata?: {
    projectName?: string;
    buildVersion?: string;
    platform?: string;
  };
}

// 日志分析结果
export interface LogAnalysisResult {
  analysisId: string;
  fileName: string;
  uploadTime: string;
  analyzeTime: number; // 毫秒
  totalLines: number;
  errorCount: number;
  warningCount: number;
  errors: ErrorSummary[];
}

// 错误摘要
export interface ErrorSummary {
  id: string;
  title: string;
  type: string;
  severity: string;
  count: number;
  weight: number;
  firstOccurrenceLine?: number;
  lastOccurrenceLine?: number;
  description?: string;
  ruleId?: string;
}

// 错误详情
export interface ErrorDetail extends ErrorSummary {
  solution?: string;
  stackTrace?: string;
  occurrences: ErrorOccurrenceDetail[];
}

// 错误出现详情
export interface ErrorOccurrenceDetail {
  lineNumber: number;
  context: ContextLines;
}

// 上下文行
export interface ContextLines {
  before: ContextLine[];
  current: ContextLine;
  after: ContextLine[];
}

// 上下文单行
export interface ContextLine {
  lineNo: number;
  content: string;
  isMatch: boolean;
}

// 日志查询参数
export interface LogDetailQueryParams extends PaginationParams, SortParams, SearchParams {
  analysisId: string;
  severityFilter?: string[];
}


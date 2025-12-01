import { UploadType, Severity, ContextLines } from './api.types';

// 日志分析请求
export interface AnalyzeLogRequest {
  uploadType: UploadType;
  content: string; // URL, Base64 或文本
  fileName: string;
  metadata?: {
    projectName?: string;
    buildVersion?: string;
    platform?: string;
  };
}

// 错误出现记录
export interface ErrorOccurrence {
  id: string;
  lineNumber: number;
  rawLine: string;
  context: ContextLines;
  sequence?: number;
}

// 错误详情
export interface ErrorDetail {
  id: string;
  title: string;
  type: string;
  severity: Severity;
  count: number;
  weight: number;
  description?: string;
  solution?: string;
  ruleId?: string;
  firstOccurrenceLine?: number;
  lastOccurrenceLine?: number;
  occurrences: ErrorOccurrence[];
}

// 日志分析结果
export interface AnalysisResult {
  analysisId: string;
  fileName: string;
  uploadTime: string;
  analyzeTime: number;
  totalLines: number;
  errorCount: number;
  warningCount: number;
  errors: ErrorDetail[];
}

// 日志详情查询参数
export interface LogDetailsQuery extends Record<string, any> {
  pageNo?: number;
  pageSize?: number;
  sortBy?: 'severity' | 'weight' | 'count' | 'firstOccurrenceLine';
  sortOrder?: 'asc' | 'desc';
  searchKeyword?: string;
  severityFilter?: Severity[];
}
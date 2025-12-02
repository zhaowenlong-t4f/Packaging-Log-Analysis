/**
 * 规则相关类型定义
 */

import { PaginationParams, SortParams, SearchParams } from './common.types';

// 严重程度
export type Severity = 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';

// 规则数据
export interface Rule {
  id: string;
  name: string;
  regex: string;
  keywords: string[];
  solution?: string;
  severity: Severity;
  weight: number;
  categories?: string[];
  enabled: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// 创建规则输入
export interface CreateRuleInput {
  name: string;
  regex: string;
  keywords: string[];
  solution?: string;
  severity: Severity;
  weight?: number;
  categories?: string[];
}

// 更新规则输入
export interface UpdateRuleInput {
  name?: string;
  regex?: string;
  keywords?: string[];
  solution?: string;
  severity?: Severity;
  weight?: number;
  categories?: string[];
  enabled?: boolean;
}

// 规则查询参数
export interface RuleQueryParams extends PaginationParams, SortParams, SearchParams {
  categoryFilter?: string[];
  severityFilter?: Severity[];
  enabled?: boolean;
}

// 规则历史
export interface RuleHistory {
  id: string;
  ruleId: string;
  version: number;
  name: string;
  regex: string;
  keywords: string[];
  solution?: string;
  severity: Severity;
  weight: number;
  categories?: string[];
  changeLog?: string;
  changedAt: Date;
}

// 规则验证请求
export interface RuleValidateRequest {
  ruleIds: string[];
  uploadType: 'url' | 'file' | 'text';
  content: string;
  fileName: string;
}

// 规则验证结果
export interface RuleValidateResult {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  matchCount: number;
  matches: RuleMatch[];
}

// 规则匹配结果
export interface RuleMatch {
  lineNumber: number;
  matchedText: string;
  context: {
    before: string[];
    current: string;
    after: string[];
  };
}

// 批量删除请求
export interface BatchDeleteRequest {
  ruleIds: string[];
}

// 批量更新分类请求
export interface BatchUpdateCategoryRequest {
  ruleIds: string[];
  addCategories?: string[];
  removeCategories?: string[];
}

// 规则导入冲突策略
export type ConflictStrategy = 'overwrite' | 'skip' | 'merge';

// 规则导入请求
export interface RuleImportRequest {
  conflictStrategy?: ConflictStrategy;
}

// 规则导入结果
export interface RuleImportResult {
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: Array<{
    ruleIndex: number;
    ruleName: string;
    error: string;
  }>;
}


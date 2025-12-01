import { Severity, QueryParams } from './api.types';

// 规则创建请求
export interface CreateRuleRequest {
  name: string;
  regex: string;
  keywords: string[];
  solution?: string;
  severity?: Severity;
  weight?: number;
  categories?: string[];
}

// 规则更新请求
export interface UpdateRuleRequest extends Partial<CreateRuleRequest> {}

// 规则响应
export interface RuleResponse {
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
  createdAt: string;
  updatedAt: string;
  usageCount?: number;
}

// 规则列表查询参数
export interface RuleListQuery extends QueryParams {
  categoryFilter?: string[];
  severityFilter?: Severity[];
}

// 规则历史记录
export interface RuleHistory {
  versionId: string;
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
  changedAt: string;
}

// 规则导入请求
export interface ImportRulesRequest {
  conflictStrategy: 'overwrite' | 'skip' | 'merge';
  rules: CreateRuleRequest[];
}

// 规则导入结果
export interface ImportResult {
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

// 规则验证请求
export interface ValidateRulesRequest {
  ruleIds: string[];
  uploadType: 'text' | 'url' | 'file';
  content: string;
  fileName: string;
}

// 规则验证结果
export interface ValidationResult {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  matchCount: number;
  matches: Array<{
    lineNumber: number;
    matchedText: string;
    context: {
      before: string[];
      current: string;
      after: string[];
    };
  }>;
}

// 批量更新分类请求
export interface BatchUpdateCategoriesRequest {
  ruleIds: string[];
  addCategories?: string[];
  removeCategories?: string[];
}

// 批量操作结果
export interface BatchOperationResult {
  updated: number;
  failed: number;
}
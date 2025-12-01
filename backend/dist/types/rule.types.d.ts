import { Severity, QueryParams } from './api.types';
export interface CreateRuleRequest {
    name: string;
    regex: string;
    keywords: string[];
    solution?: string;
    severity?: Severity;
    weight?: number;
    categories?: string[];
}
export interface UpdateRuleRequest extends Partial<CreateRuleRequest> {
}
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
export interface RuleListQuery extends QueryParams {
    categoryFilter?: string[];
    severityFilter?: Severity[];
}
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
export interface ImportRulesRequest {
    conflictStrategy: 'overwrite' | 'skip' | 'merge';
    rules: CreateRuleRequest[];
}
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
export interface ValidateRulesRequest {
    ruleIds: string[];
    uploadType: 'text' | 'url' | 'file';
    content: string;
    fileName: string;
}
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
export interface BatchUpdateCategoriesRequest {
    ruleIds: string[];
    addCategories?: string[];
    removeCategories?: string[];
}
export interface BatchOperationResult {
    updated: number;
    failed: number;
}
//# sourceMappingURL=rule.types.d.ts.map
import { UploadType, Severity, ContextLines } from './api.types';
export interface AnalyzeLogRequest {
    uploadType: UploadType;
    content: string;
    fileName: string;
    metadata?: {
        projectName?: string;
        buildVersion?: string;
        platform?: string;
    };
}
export interface ErrorOccurrence {
    id: string;
    lineNumber: number;
    rawLine: string;
    context: ContextLines;
    sequence?: number;
}
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
export interface LogDetailsQuery extends Record<string, any> {
    pageNo?: number;
    pageSize?: number;
    sortBy?: 'severity' | 'weight' | 'count' | 'firstOccurrenceLine';
    sortOrder?: 'asc' | 'desc';
    searchKeyword?: string;
    severityFilter?: Severity[];
}
//# sourceMappingURL=log.types.d.ts.map
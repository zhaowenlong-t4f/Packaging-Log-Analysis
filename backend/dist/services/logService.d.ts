import { AnalyzeLogRequest, AnalysisResult, LogDetailsQuery } from '../types/log.types';
export declare class LogService {
    private analyzer;
    constructor();
    analyzeLog(request: AnalyzeLogRequest): Promise<AnalysisResult>;
    getLogContent(request: AnalyzeLogRequest): Promise<string>;
    preprocessLogContent(rawContent: string): string[];
    saveAnalysisResult(request: AnalyzeLogRequest, lines: string[], errorGroups: any[]): Promise<string>;
    getAnalysisDetails(analysisId: string, query: LogDetailsQuery): Promise<{
        pagination: {
            pageNo: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
        errors: {
            id: any;
            errorType: any;
            severity: any;
            title: any;
        }[];
    }>;
}
//# sourceMappingURL=logService.d.ts.map
export declare class LogAnalyzer {
    private rules;
    addRule(rule: any): void;
    analyzeLog(lines: string[]): Promise<any[]>;
    getStats(): {
        totalErrors: number;
        criticalCount: number;
        errorCount: number;
        warningCount: number;
        infoCount: number;
        totalOccurrences: number;
    };
}
//# sourceMappingURL=matcher.d.ts.map
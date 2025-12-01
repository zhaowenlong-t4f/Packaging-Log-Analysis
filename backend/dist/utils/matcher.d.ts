export declare class LogAnalyzer {
    private rules;
    addRule(rule: any): void;
    analyzeLog(lines: string[]): Promise<{
        ruleId: string;
        ruleName: any;
        severity: any;
        weight: any;
        solution: any;
        occurrences: {
            lineNumber: number;
            matchedLine: string | undefined;
            matchedText: string | undefined;
            context: {
                before: (string | undefined)[];
                current: string | undefined;
                after: (string | undefined)[];
            };
        }[];
    }[]>;
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
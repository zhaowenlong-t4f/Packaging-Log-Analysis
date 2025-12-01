"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogAnalyzer = void 0;
class LogAnalyzer {
    constructor() {
        this.rules = new Map();
    }
    addRule(rule) {
        this.rules.set(rule.id, rule);
    }
    async analyzeLog(lines) {
        const errors = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            for (const [ruleId, rule] of this.rules) {
                if (rule.keywords.some((keyword) => line.includes(keyword))) {
                    try {
                        const regex = new RegExp(rule.regex);
                        if (regex.test(line)) {
                            errors.push({
                                ruleId,
                                ruleName: rule.name,
                                severity: rule.severity,
                                weight: rule.weight,
                                solution: rule.solution,
                                occurrences: [{
                                        lineNumber: i + 1,
                                        matchedLine: line,
                                        matchedText: line,
                                        context: {
                                            before: i > 0 ? [lines[i - 1]] : [],
                                            current: line,
                                            after: i < lines.length - 1 ? [lines[i + 1]] : []
                                        }
                                    }]
                            });
                        }
                    }
                    catch (error) {
                        console.warn(`Invalid regex for rule ${ruleId}:`, rule.regex);
                    }
                }
            }
        }
        return errors.sort((a, b) => {
            const severityOrder = { CRITICAL: 0, ERROR: 1, WARNING: 2, INFO: 3 };
            return severityOrder[a.severity] - severityOrder[b.severity];
        });
    }
    getStats() {
        return {
            totalErrors: 0,
            criticalCount: 0,
            errorCount: 0,
            warningCount: 0,
            infoCount: 0,
            totalOccurrences: 0
        };
    }
}
exports.LogAnalyzer = LogAnalyzer;
//# sourceMappingURL=matcher.js.map
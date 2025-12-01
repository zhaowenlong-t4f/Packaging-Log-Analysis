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
        const errorMap = new Map();
        const contextLines = 3;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line)
                continue;
            for (const [ruleId, rule] of this.rules) {
                const hasKeywords = rule.keywords && rule.keywords.length > 0
                    ? rule.keywords.every((keyword) => line.toLowerCase().includes(keyword.toLowerCase()))
                    : true;
                if (!hasKeywords)
                    continue;
                try {
                    const regex = new RegExp(rule.regex);
                    const match = regex.exec(line);
                    if (match) {
                        const errorKey = `${ruleId}:${rule.name}`;
                        if (errorMap.has(errorKey)) {
                            const existingError = errorMap.get(errorKey);
                            existingError.occurrences.push({
                                lineNumber: i + 1,
                                matchedLine: line,
                                matchedText: match[0],
                                context: {
                                    before: lines.slice(Math.max(0, i - contextLines), i),
                                    current: line,
                                    after: lines.slice(i + 1, Math.min(lines.length, i + contextLines + 1))
                                }
                            });
                            existingError.count = existingError.occurrences.length;
                            existingError.lastOccurrence = i + 1;
                        }
                        else {
                            errorMap.set(errorKey, {
                                ruleId,
                                ruleName: rule.name,
                                severity: rule.severity,
                                weight: rule.weight,
                                solution: rule.solution,
                                count: 1,
                                firstOccurrence: i + 1,
                                lastOccurrence: i + 1,
                                occurrences: [{
                                        lineNumber: i + 1,
                                        matchedLine: line,
                                        matchedText: match[0],
                                        context: {
                                            before: lines.slice(Math.max(0, i - contextLines), i),
                                            current: line,
                                            after: lines.slice(i + 1, Math.min(lines.length, i + contextLines + 1))
                                        }
                                    }]
                            });
                        }
                    }
                }
                catch (error) {
                    console.warn(`Invalid regex for rule ${ruleId}:`, rule.regex);
                }
            }
        }
        const errors = Array.from(errorMap.values());
        return errors.sort((a, b) => {
            const severityOrder = { CRITICAL: 0, ERROR: 1, WARNING: 2, INFO: 3 };
            const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
            if (severityDiff !== 0)
                return severityDiff;
            return (b.weight || 0) - (a.weight || 0);
        });
    }
    getStats() {
        let totalErrors = 0;
        let criticalCount = 0;
        let errorCount = 0;
        let warningCount = 0;
        let infoCount = 0;
        let totalOccurrences = 0;
        for (const [, rule] of this.rules) {
            const count = rule.count || 0;
            totalOccurrences += count;
            switch (rule.severity) {
                case 'CRITICAL':
                    criticalCount += count;
                    break;
                case 'ERROR':
                    errorCount += count;
                    break;
                case 'WARNING':
                    warningCount += count;
                    break;
                case 'INFO':
                    infoCount += count;
                    break;
            }
        }
        totalErrors = criticalCount + errorCount + warningCount + infoCount;
        return {
            totalErrors,
            criticalCount,
            errorCount,
            warningCount,
            infoCount,
            totalOccurrences
        };
    }
}
exports.LogAnalyzer = LogAnalyzer;
//# sourceMappingURL=matcher.js.map
// 日志分析核心算法
export class LogAnalyzer {
  private rules: Map<string, any> = new Map();

  addRule(rule: any) {
    this.rules.set(rule.id, rule);
  }

  async analyzeLog(lines: string[]) {
    const errorMap = new Map<string, any>();
    const contextLines = 3; // 上下文行数

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 遍历所有规则
      for (const [ruleId, rule] of this.rules) {
        // 关键词初筛（性能优化）
        const hasKeywords = rule.keywords && rule.keywords.length > 0
          ? rule.keywords.every((keyword: string) =>
              line.toLowerCase().includes(keyword.toLowerCase())
            )
          : true;

        if (!hasKeywords) continue;

        // 正则表达式匹配
        try {
          const regex = new RegExp(rule.regex);
          const match = regex.exec(line);
          
          if (match) {
            const errorKey = `${ruleId}:${rule.name}`;
            
            // 错误聚合：相同规则的多次匹配应合并
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
            } else {
              // 首次匹配该规则
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
        } catch (error) {
          console.warn(`Invalid regex for rule ${ruleId}:`, rule.regex);
        }
      }
    }

    // 转换为数组并排序
    const errors = Array.from(errorMap.values());
    return errors.sort((a, b) => {
      // 按严重程度排序，然后按权重排序
      const severityOrder = { CRITICAL: 0, ERROR: 1, WARNING: 2, INFO: 3 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
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
// 日志分析核心算法
export class LogAnalyzer {
  private rules: Map<string, any> = new Map();

  addRule(rule: any) {
    this.rules.set(rule.id, rule);
  }

  async analyzeLog(lines: string[]) {
    const errors = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 简单的关键词匹配（示例）
      for (const [ruleId, rule] of this.rules) {
        if (rule.keywords.some((keyword: string) => line.includes(keyword))) {
          // 简单的正则匹配
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
          } catch (error) {
            console.warn(`Invalid regex for rule ${ruleId}:`, rule.regex);
          }
        }
      }
    }

    // 按严重程度排序
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
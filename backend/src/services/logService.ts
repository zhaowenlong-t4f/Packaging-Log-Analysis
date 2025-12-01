import axios from 'axios';
import { LogAnalyzer, Rule } from '../utils/matcher';
import { AnalyzeLogRequest, AnalysisResult, LogDetailsQuery } from '../types/log.types';
import { logger } from '../utils/logger';
import prisma from '../config/database';

/**
 * 日志服务类
 */
export class LogService {
  private analyzer: LogAnalyzer;

  constructor() {
    this.analyzer = new LogAnalyzer();
  }

  /**
   * 分析日志
   */
  async analyzeLog(request: AnalyzeLogRequest): Promise<AnalysisResult> {
    try {
      // 1. 获取日志内容
      const rawContent = await this.getLogContent(request);

      // 2. 预处理
      const lines = this.preprocessLogContent(rawContent);

      // 3. 分析日志
      const errorGroups = await this.analyzer.analyzeLog(lines);

      // 4. 转换并存储结果
      const analysisId = await this.saveAnalysisResult(request, lines, errorGroups);

      // 5. 返回结果
      const stats = this.analyzer.getStats();

      return {
        analysisId,
        fileName: request.fileName,
        uploadTime: new Date().toISOString(),
        analyzeTime: 0,
        totalLines: lines.length,
        errorCount: errorGroups.length,
        warningCount: errorGroups.filter(e => e.severity === 'WARNING').length,
        errors: this.convertErrorGroupsToErrors(errorGroups)
      };
    } catch (error) {
      logger.error('Log analysis failed', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取分析详情
   */
  async getAnalysisDetails(analysisId: string, query: LogDetailsQuery) {
    // 实现获取详情逻辑
    return {
      pagination: {
        pageNo: query.pageNo,
        pageSize: query.pageSize,
        total: 0,
        totalPages: 0
      },
      errors: []
    };
  }
}

export const logService = new LogService();
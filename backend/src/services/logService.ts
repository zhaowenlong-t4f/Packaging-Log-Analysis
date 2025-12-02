/**
 * 日志服务模块
 */

import { PrismaClient } from '@prisma/client';
import { LogUploadRequest, LogQueryParams, LogDetailQueryParams } from '../types/log.types';
import { processLogFile, saveRawContent } from './fileService';
import { analyzeLog } from './analysisService';
import { calculatePagination, formatDate } from '../utils/formatters';
import { logger } from '../utils/logger';
import { NotFoundError } from '../middleware/errorHandler';
import { extractContext } from './analysisService';

const prisma = new PrismaClient();

/**
 * 上传并分析日志
 */
export async function uploadAndAnalyzeLog(request: LogUploadRequest): Promise<{
  analysisId: string;
  fileName: string;
  uploadTime: string;
  analyzeTime: number;
  totalLines: number;
  errorCount: number;
  warningCount: number;
  errors: Array<{
    id: string;
    title: string;
    type: string;
    severity: string;
    count: number;
    weight: number;
    firstOccurrenceLine?: number;
    lastOccurrenceLine?: number;
    description?: string;
    ruleId?: string;
  }>;
}> {
  const startTime = Date.now();

  logger.info('Starting log upload and analysis', {
    fileName: request.fileName,
    uploadType: request.uploadType,
  });

  // 1. 处理日志文件
  const { lines, fileSize } = await processLogFile(request.uploadType, request.content);

  // 2. 分析日志
  const analysisResult = await analyzeLog(lines);

  // 3. 保存原始内容（截断处理）
  const rawContent = saveRawContent(Buffer.from(lines.join('\n'), 'utf-8'));

  // 4. 保存到数据库
  const log = await prisma.log.create({
    data: {
      fileName: request.fileName,
      uploadType: request.uploadType,
      fileSize: BigInt(fileSize),
      totalLines: lines.length,
      rawContent,
    },
  });

  // 5. 保存错误和出现记录
  const errorRecords = [];
  for (const error of analysisResult.errors) {
    // 创建错误记录
    const errorRecord = await prisma.error.create({
      data: {
        logId: log.id,
        matchedRuleId: error.ruleId,
        errorType: error.errorType,
        severity: error.severity,
        title: error.title,
        description: error.description,
        solution: error.solution,
        occurrenceCount: error.occurrenceCount,
        firstOccurrenceLine: error.firstOccurrenceLine,
        lastOccurrenceLine: error.lastOccurrenceLine,
      },
    });

    // 创建错误出现记录
    for (const occurrence of error.occurrences) {
      await prisma.errorOccurrence.create({
        data: {
          errorId: errorRecord.id,
          logId: log.id,
          lineNumber: occurrence.lineNumber,
          rawLine: occurrence.rawLine,
          contextBefore: JSON.stringify(occurrence.context.before),
          contextAfter: JSON.stringify(occurrence.context.after),
          sequence: errorRecords.length,
        },
      });
    }

    errorRecords.push({
      id: errorRecord.id,
      title: error.title,
      type: error.errorType,
      severity: error.severity,
      count: error.occurrenceCount,
      weight: error.weight || 50,
      firstOccurrenceLine: error.firstOccurrenceLine,
      lastOccurrenceLine: error.lastOccurrenceLine,
      description: error.description,
      ruleId: error.ruleId,
    });
  }

  const analyzeTime = Date.now() - startTime;

  logger.info('Log analysis completed', {
    logId: log.id,
    analyzeTime,
    errorCount: analysisResult.errorCount,
    warningCount: analysisResult.warningCount,
  });

  return {
    analysisId: log.id,
    fileName: log.fileName,
    uploadTime: formatDate(log.createdAt),
    analyzeTime,
    totalLines: lines.length,
    errorCount: analysisResult.errorCount,
    warningCount: analysisResult.warningCount,
    errors: errorRecords,
  };
}

/**
 * 获取分析结果详情
 */
export async function getAnalysisDetails(params: LogDetailQueryParams & { analysisId: string }): Promise<{
  analysisId: string;
  pagination: ReturnType<typeof calculatePagination>;
  errors: Array<{
    id: string;
    title: string;
    type: string;
    severity: string;
    count: number;
    weight: number;
    description?: string;
    solution?: string;
    stackTrace?: string;
    occurrences: Array<{
      lineNumber: number;
      context: {
        before: Array<{ lineNo: number; content: string; isMatch: boolean }>;
        current: { lineNo: number; content: string; isMatch: boolean };
        after: Array<{ lineNo: number; content: string; isMatch: boolean }>;
      };
    }>;
  }>;
}> {
  const { analysisId, pageNo, pageSize, sortBy = 'severity', sortOrder = 'desc', searchKeyword, severityFilter } = params;

  // 检查日志是否存在
  const log = await prisma.log.findUnique({
    where: { id: analysisId },
  });

  if (!log) {
    throw new NotFoundError(`Log analysis with id "${analysisId}" not found`);
  }

  // 构建查询条件
  const where: any = {
    logId: analysisId,
  };

  if (severityFilter && severityFilter.length > 0) {
    where.severity = { in: severityFilter };
  }

  if (searchKeyword) {
    where.OR = [
      { title: { contains: searchKeyword } },
      { description: { contains: searchKeyword } },
    ];
  }

  // 获取总数
  const total = await prisma.error.count({ where });

  // 获取错误列表
  const errors = await prisma.error.findMany({
    where,
    skip: (pageNo - 1) * pageSize,
    take: pageSize,
    orderBy: { [sortBy]: sortOrder },
    include: {
      matchedRule: true,
    },
  });

  // 获取错误出现记录
  const errorDetails = await Promise.all(
    errors.map(async (error) => {
      const occurrences = await prisma.errorOccurrence.findMany({
        where: { errorId: error.id },
        orderBy: { lineNumber: 'asc' },
      });

      // 解析上下文
      const occurrenceDetails = occurrences.map((occ) => {
        const contextBefore = occ.contextBefore
          ? JSON.parse(occ.contextBefore)
          : [];
        const contextAfter = occ.contextAfter ? JSON.parse(occ.contextAfter) : [];

        return {
          lineNumber: occ.lineNumber,
          context: {
            before: contextBefore,
            current: {
              lineNo: occ.lineNumber,
              content: occ.rawLine,
              isMatch: true,
            },
            after: contextAfter,
          },
        };
      });

      return {
        id: error.id,
        title: error.title,
        type: error.errorType,
        severity: error.severity,
        count: error.occurrenceCount,
        weight: error.matchedRule?.weight || 50,
        description: error.description || undefined,
        solution: error.solution || error.matchedRule?.solution || undefined,
        stackTrace: error.description || undefined,
        occurrences: occurrenceDetails,
      };
    })
  );

  return {
    analysisId,
    pagination: calculatePagination(pageNo, pageSize, total),
    errors: errorDetails,
  };
}

/**
 * 获取日志统计信息
 */
export async function getLogStatistics(analysisId: string): Promise<{
  totalLines: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  criticalCount: number;
  severityDistribution: Array<{ severity: string; count: number }>;
}> {
  const log = await prisma.log.findUnique({
    where: { id: analysisId },
    include: {
      errors: true,
    },
  });

  if (!log) {
    throw new NotFoundError(`Log analysis with id "${analysisId}" not found`);
  }

  const severityCounts = {
    CRITICAL: 0,
    ERROR: 0,
    WARNING: 0,
    INFO: 0,
  };

  for (const error of log.errors) {
    const severity = error.severity as keyof typeof severityCounts;
    if (severity in severityCounts) {
      severityCounts[severity] += error.occurrenceCount;
    }
  }

  return {
    totalLines: log.totalLines || 0,
    errorCount: severityCounts.ERROR + severityCounts.CRITICAL,
    warningCount: severityCounts.WARNING,
    infoCount: severityCounts.INFO,
    criticalCount: severityCounts.CRITICAL,
    severityDistribution: Object.entries(severityCounts).map(([severity, count]) => ({
      severity,
      count,
    })),
  };
}


/**
 * 日志控制器
 */

import { Request, Response, NextFunction } from 'express';
import { uploadAndAnalyzeLog, getAnalysisDetails } from '../services/logService';
import { sendSuccess } from '../utils/response';
import { LogDetailQueryParams } from '../types/log.types';

/**
 * 上传日志并分析
 */
export async function analyzeLog(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await uploadAndAnalyzeLog(req.body);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * 获取分析结果详情
 */
export async function getLogDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { analysisId } = req.params;
    
    // 处理 severityFilter 参数（可能是数组、字符串或逗号分隔的字符串）
    let severityFilter: string[] | undefined;
    if (req.query.severityFilter) {
      if (Array.isArray(req.query.severityFilter)) {
        severityFilter = req.query.severityFilter as string[];
      } else {
        const filterValue = req.query.severityFilter as string;
        // 如果是逗号分隔的字符串，分割成数组
        severityFilter = filterValue.includes(',') 
          ? filterValue.split(',').filter(s => s.trim().length > 0)
          : [filterValue];
      }
    }
    
    const params: LogDetailQueryParams & { analysisId: string } = {
      analysisId,
      pageNo: Number(req.query.pageNo) || 1,
      pageSize: Number(req.query.pageSize) || 20,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as any,
      searchKeyword: req.query.searchKeyword as string,
      severityFilter,
    };

    const result = await getAnalysisDetails(params);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}


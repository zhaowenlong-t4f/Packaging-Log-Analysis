import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/api.types';
import { AnalysisResult } from '../types/log.types';
import { AnalyzeLogInput } from '../schemas';
import { logService } from '../services/logService';
import { logger } from '../utils/logger';

export async function analyzeLog(
  req: Request<{}, ApiResponse<AnalysisResult>, AnalyzeLogInput>,
  res: Response<ApiResponse<AnalysisResult>>,
  next: NextFunction
) {
  try {
    const { uploadType, content, fileName, metadata } = req.body;

    logger.info('Starting log analysis', { uploadType, fileName });

    const startTime = Date.now();
    const result = await logService.analyzeLog({
      uploadType,
      content,
      fileName,
      metadata
    });
    const analyzeTime = Date.now() - startTime;

    logger.info('Log analysis completed', {
      analysisId: result.analysisId,
      analyzeTime,
      totalLines: result.totalLines,
      errorCount: result.errorCount
    });

    const response: ApiResponse<AnalysisResult> = {
      code: 0,
      message: 'success',
      data: {
        ...result,
        analyzeTime
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    logger.error('Log analysis failed', { error: error instanceof Error ? error.message : String(error) });
    next(error);
  }
}

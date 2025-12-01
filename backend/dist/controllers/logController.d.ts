import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/api.types';
import { AnalysisResult } from '../types/log.types';
import { AnalyzeLogInput } from '../schemas';
export declare function analyzeLog(req: Request<{}, ApiResponse<AnalysisResult>, AnalyzeLogInput>, res: Response<ApiResponse<AnalysisResult>>, next: NextFunction): Promise<void>;
//# sourceMappingURL=logController.d.ts.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeLog = analyzeLog;
const logService_1 = require("../services/logService");
const logger_1 = require("../utils/logger");
async function analyzeLog(req, res, next) {
    try {
        const { uploadType, content, fileName, metadata } = req.body;
        logger_1.logger.info('Starting log analysis', { uploadType, fileName });
        const startTime = Date.now();
        const result = await logService_1.logService.analyzeLog({
            uploadType,
            content,
            fileName,
            metadata
        });
        const analyzeTime = Date.now() - startTime;
        logger_1.logger.info('Log analysis completed', {
            analysisId: result.analysisId,
            analyzeTime,
            totalLines: result.totalLines,
            errorCount: result.errorCount
        });
        const response = {
            code: 0,
            message: 'success',
            data: {
                ...result,
                analyzeTime
            },
            timestamp: new Date().toISOString()
        };
        res.json(response);
    }
    catch (error) {
        logger_1.logger.error('Log analysis failed', { error: error instanceof Error ? error.message : String(error) });
        next(error);
    }
}
//# sourceMappingURL=logController.js.map
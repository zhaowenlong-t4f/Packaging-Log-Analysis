"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logService = exports.LogService = void 0;
const logger_1 = require("../utils/logger");
const database_1 = __importDefault(require("../config/database"));
const matcher_1 = require("../utils/matcher");
class LogService {
    constructor() {
        this.analyzer = new matcher_1.LogAnalyzer();
    }
    async analyzeLog(request) {
        try {
            const rawContent = await this.getLogContent(request);
            const lines = this.preprocessLogContent(rawContent);
            const rules = await database_1.default.rule.findMany({ where: { enabled: true } });
            rules.forEach((rule) => {
                this.analyzer.addRule({
                    id: rule.id,
                    name: rule.name,
                    regex: rule.regex,
                    keywords: JSON.parse(rule.keywords),
                    severity: rule.severity,
                    weight: rule.weight,
                    solution: rule.solution
                });
            });
            const errorGroups = await this.analyzer.analyzeLog(lines);
            void errorGroups;
            return {
                analysisId: '',
                fileName: request.fileName,
                uploadTime: new Date().toISOString(),
                analyzeTime: 0,
                totalLines: lines.length,
                errorCount: 0,
                warningCount: 0,
                errors: []
            };
        }
        catch (error) {
            logger_1.logger.error('Log analysis failed', { error: error instanceof Error ? error.message : String(error) });
            throw error;
        }
    }
    async getLogContent(request) {
        try {
            if (request.uploadType === 'text') {
                return request.content;
            }
            else if (request.uploadType === 'url') {
                const axios = (await Promise.resolve().then(() => __importStar(require('axios')))).default;
                const response = await axios.get(request.content, { timeout: 30000 });
                return response.data;
            }
            else if (request.uploadType === 'file') {
                return Buffer.from(request.content, 'base64').toString('utf-8');
            }
            throw new Error('Invalid uploadType');
        }
        catch (error) {
            logger_1.logger.error('Failed to get log content', { error: error instanceof Error ? error.message : String(error) });
            throw error;
        }
    }
    preprocessLogContent(rawContent) {
        const lines = rawContent.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
        return lines;
    }
    async saveAnalysisResult(request, lines, _errorGroups) {
        try {
            const log = await database_1.default.log.create({
                data: {
                    fileName: request.fileName,
                    uploadType: request.uploadType,
                    fileSize: BigInt(request.content.length),
                    totalLines: lines.length,
                    rawContent: lines.slice(0, 100).join('\n')
                }
            });
            return log.id;
        }
        catch (error) {
            logger_1.logger.error('Failed to save analysis result', { error: error instanceof Error ? error.message : String(error) });
            throw error;
        }
    }
    async getAnalysisDetails(analysisId, query) {
        try {
            const pageNo = query.pageNo || 1;
            const pageSize = query.pageSize || 20;
            const errors = await database_1.default.error.findMany({
                where: { logId: analysisId },
                skip: (pageNo - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: 'desc' }
            });
            const total = await database_1.default.error.count({ where: { logId: analysisId } });
            return {
                pagination: {
                    pageNo,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize)
                },
                errors: errors.map((e) => ({
                    id: e.id,
                    errorType: e.errorType,
                    severity: e.severity,
                    title: e.title
                }))
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get analysis details', { error: error instanceof Error ? error.message : String(error) });
            throw error;
        }
    }
}
exports.LogService = LogService;
exports.logService = new LogService();
//# sourceMappingURL=logService.js.map
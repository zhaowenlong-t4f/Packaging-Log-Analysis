"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ruleService = exports.RuleService = void 0;
const logger_1 = require("../utils/logger");
const database_1 = __importDefault(require("../config/database"));
class RuleService {
    async getRules(query) {
        try {
            const pageNo = query.pageNo || 1;
            const pageSize = query.pageSize || 20;
            const rules = await database_1.default.rule.findMany({
                where: { enabled: true },
                skip: (pageNo - 1) * pageSize,
                take: pageSize,
                orderBy: { updatedAt: 'desc' }
            });
            const total = await database_1.default.rule.count({ where: { enabled: true } });
            const formattedRules = rules.map(rule => ({
                id: rule.id,
                name: rule.name,
                regex: rule.regex,
                keywords: JSON.parse(rule.keywords),
                solution: rule.solution || '',
                severity: rule.severity,
                weight: rule.weight,
                categories: rule.categories ? JSON.parse(rule.categories) : [],
                enabled: rule.enabled,
                version: rule.version,
                createdAt: rule.createdAt.toISOString(),
                updatedAt: rule.updatedAt.toISOString(),
                usageCount: 0
            }));
            return {
                code: 0,
                message: 'success',
                data: {
                    pagination: {
                        pageNo: pageNo,
                        pageSize: pageSize,
                        total,
                        totalPages: Math.ceil(total / pageSize)
                    },
                    items: formattedRules
                },
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get rules', { error: error instanceof Error ? error.message : String(error) });
            throw error;
        }
    }
    async createRule(request) {
        try {
            const rule = await database_1.default.rule.create({
                data: {
                    name: request.name,
                    regex: request.regex,
                    keywords: JSON.stringify(request.keywords),
                    solution: request.solution,
                    severity: request.severity || 'ERROR',
                    weight: request.weight || 50,
                    categories: request.categories ? JSON.stringify(request.categories) : null,
                    enabled: true,
                    version: 1
                }
            });
            return {
                id: rule.id,
                name: rule.name,
                regex: rule.regex,
                keywords: JSON.parse(rule.keywords),
                solution: rule.solution,
                severity: rule.severity,
                weight: rule.weight,
                categories: rule.categories ? JSON.parse(rule.categories) : [],
                enabled: rule.enabled,
                version: rule.version,
                createdAt: rule.createdAt.toISOString(),
                updatedAt: rule.updatedAt.toISOString(),
                usageCount: 0
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to create rule', { error: error instanceof Error ? error.message : String(error) });
            throw error;
        }
    }
    async updateRule(ruleId, request) {
        try {
            const rule = await database_1.default.rule.update({
                where: { id: ruleId },
                data: {
                    name: request.name,
                    regex: request.regex,
                    keywords: JSON.stringify(request.keywords),
                    solution: request.solution,
                    severity: request.severity,
                    weight: request.weight,
                    categories: request.categories ? JSON.stringify(request.categories) : null
                }
            });
            return {
                id: rule.id,
                name: rule.name,
                regex: rule.regex,
                keywords: JSON.parse(rule.keywords),
                solution: rule.solution,
                severity: rule.severity,
                weight: rule.weight,
                categories: rule.categories ? JSON.parse(rule.categories) : [],
                enabled: rule.enabled,
                version: rule.version,
                createdAt: rule.createdAt.toISOString(),
                updatedAt: rule.updatedAt.toISOString(),
                usageCount: 0
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to update rule', { ruleId, error: error instanceof Error ? error.message : String(error) });
            throw error;
        }
    }
    async deleteRule(ruleId) {
        try {
            await database_1.default.rule.delete({
                where: { id: ruleId }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete rule', { ruleId, error: error instanceof Error ? error.message : String(error) });
            throw error;
        }
    }
}
exports.RuleService = RuleService;
exports.ruleService = new RuleService();
//# sourceMappingURL=ruleService.js.map
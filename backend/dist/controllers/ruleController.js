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
exports.getRules = getRules;
exports.createRule = createRule;
exports.updateRule = updateRule;
exports.deleteRule = deleteRule;
exports.batchDeleteRules = batchDeleteRules;
exports.exportRules = exportRules;
exports.importRules = importRules;
exports.getRuleHistory = getRuleHistory;
exports.rollbackRule = rollbackRule;
exports.validateRules = validateRules;
exports.batchUpdateCategories = batchUpdateCategories;
const ruleService_1 = require("../services/ruleService");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const database_1 = __importDefault(require("../config/database"));
const ruleService = new ruleService_1.RuleService();
async function getRules(req, res) {
    try {
        const query = {
            pageNo: parseInt(req.query.pageNo) || 1,
            pageSize: parseInt(req.query.pageSize) || 20,
            sortBy: req.query.sortBy || 'updatedAt',
            sortOrder: req.query.sortOrder || 'desc',
            searchKeyword: req.query.searchKeyword || '',
            categoryFilter: req.query.categoryFilter || '',
            severityFilter: req.query.severityFilter || ''
        };
        if (query.pageNo < 1)
            query.pageNo = 1;
        if (query.pageSize < 1 || query.pageSize > 100)
            query.pageSize = 20;
        const where = { enabled: true };
        if (query.searchKeyword) {
            where.name = { contains: query.searchKeyword, mode: 'insensitive' };
        }
        if (query.severityFilter) {
            const severities = query.severityFilter.split(',').map(s => s.trim());
            where.severity = { in: severities };
        }
        if (query.categoryFilter) {
            const categories = query.categoryFilter.split(',').map(c => c.trim());
        }
        const orderBy = {};
        const sortField = ['updatedAt', 'createdAt', 'severity', 'weight'].includes(query.sortBy)
            ? query.sortBy
            : 'updatedAt';
        orderBy[sortField] = query.sortOrder === 'asc' ? 'asc' : 'desc';
        const rules = await database_1.default.rule.findMany({
            where,
            skip: (query.pageNo - 1) * query.pageSize,
            take: query.pageSize,
            orderBy
        });
        const total = await database_1.default.rule.count({ where });
        const formattedRules = rules
            .map(rule => ({
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
        }))
            .filter(rule => {
            if (query.categoryFilter) {
                const categories = query.categoryFilter.split(',').map(c => c.trim());
                return categories.some(cat => rule.categories.includes(cat));
            }
            return true;
        });
        res.json({
            code: 0,
            message: 'success',
            data: {
                pagination: {
                    pageNo: query.pageNo,
                    pageSize: query.pageSize,
                    total,
                    totalPages: Math.ceil(total / query.pageSize)
                },
                items: formattedRules
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get rules', { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}
async function createRule(req, res) {
    try {
        const { name, regex, keywords, severity, weight, solution, categories } = req.body;
        const existingRule = await database_1.default.rule.findUnique({ where: { name } });
        if (existingRule) {
            throw new errors_1.AppError('规则名称已存在', 400);
        }
        try {
            new RegExp(regex);
        }
        catch (e) {
            throw new errors_1.AppError('无效的正则表达式', 400);
        }
        const rule = await database_1.default.rule.create({
            data: {
                name,
                regex,
                keywords: JSON.stringify(keywords),
                solution: solution || null,
                severity: severity || 'ERROR',
                weight: weight || 50,
                categories: categories ? JSON.stringify(categories) : null,
                enabled: true,
                version: 1
            }
        });
        res.status(201).json({
            code: 0,
            message: 'success',
            data: {
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
                updatedAt: rule.updatedAt.toISOString()
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to create rule', { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}
async function updateRule(req, res) {
    try {
        const { ruleId } = req.params;
        const { name, regex, keywords, severity, weight, solution, categories } = req.body;
        const existingRule = await database_1.default.rule.findUnique({ where: { id: ruleId } });
        if (!existingRule) {
            throw new errors_1.AppError('规则不存在', 404);
        }
        if (name && name !== existingRule.name) {
            const duplicateRule = await database_1.default.rule.findUnique({ where: { name } });
            if (duplicateRule) {
                throw new errors_1.AppError('规则名称已存在', 400);
            }
        }
        if (regex) {
            try {
                new RegExp(regex);
            }
            catch (e) {
                throw new errors_1.AppError('无效的正则表达式', 400);
            }
        }
        if (existingRule.categories || keywords || regex || name) {
            await database_1.default.ruleHistory.create({
                data: {
                    ruleId,
                    version: existingRule.version,
                    name: existingRule.name,
                    regex: existingRule.regex,
                    keywords: existingRule.keywords,
                    severity: existingRule.severity,
                    weight: existingRule.weight,
                    solution: existingRule.solution || null,
                    categories: existingRule.categories,
                    changeLog: '更新规则',
                    changedAt: new Date()
                }
            });
        }
        const updatedRule = await database_1.default.rule.update({
            where: { id: ruleId },
            data: {
                ...(name && { name }),
                ...(regex && { regex }),
                ...(keywords && { keywords: JSON.stringify(keywords) }),
                ...(severity && { severity }),
                ...(weight !== undefined && { weight }),
                ...(solution && { solution }),
                ...(categories && { categories: JSON.stringify(categories) }),
                version: { increment: 1 }
            }
        });
        res.json({
            code: 0,
            message: 'success',
            data: {
                id: updatedRule.id,
                name: updatedRule.name,
                regex: updatedRule.regex,
                keywords: JSON.parse(updatedRule.keywords),
                solution: updatedRule.solution,
                severity: updatedRule.severity,
                weight: updatedRule.weight,
                categories: updatedRule.categories ? JSON.parse(updatedRule.categories) : [],
                enabled: updatedRule.enabled,
                version: updatedRule.version,
                createdAt: updatedRule.createdAt.toISOString(),
                updatedAt: updatedRule.updatedAt.toISOString()
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to update rule', { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}
async function deleteRule(req, res) {
    try {
        const { ruleId } = req.params;
        const rule = await database_1.default.rule.findUnique({ where: { id: ruleId } });
        if (!rule) {
            throw new errors_1.AppError('规则不存在', 404);
        }
        await database_1.default.rule.update({
            where: { id: ruleId },
            data: { enabled: false }
        });
        res.json({
            code: 0,
            message: 'success',
            data: null,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to delete rule', { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}
async function batchDeleteRules(req, res) {
    try {
        const { ruleIds } = req.body;
        if (!Array.isArray(ruleIds) || ruleIds.length === 0) {
            throw new errors_1.AppError('ruleIds 必须是非空数组', 400);
        }
        await database_1.default.rule.updateMany({
            where: { id: { in: ruleIds } },
            data: { enabled: false }
        });
        res.json({
            code: 0,
            message: 'success',
            data: null,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to batch delete rules', { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}
async function exportRules(req, res) {
    try {
        const rules = await database_1.default.rule.findMany({
            where: { enabled: true }
        });
        const exportData = rules.map(rule => ({
            id: rule.id,
            name: rule.name,
            regex: rule.regex,
            keywords: JSON.parse(rule.keywords),
            severity: rule.severity,
            weight: rule.weight,
            solution: rule.solution,
            categories: rule.categories ? JSON.parse(rule.categories) : [],
            createdAt: rule.createdAt.toISOString(),
            updatedAt: rule.updatedAt.toISOString()
        }));
        res.header('Content-Type', 'application/json');
        res.header('Content-Disposition', `attachment; filename="rules-${new Date().toISOString().split('T')[0]}.json"`);
        res.send(JSON.stringify(exportData, null, 2));
    }
    catch (error) {
        logger_1.logger.error('Failed to export rules', { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}
async function importRules(req, res) {
    try {
        const conflictStrategy = req.query.conflictStrategy || 'skip';
        if (!req.file) {
            throw new errors_1.AppError('未上传文件', 400);
        }
        const content = req.file.buffer.toString('utf-8');
        const importedRules = JSON.parse(content);
        if (!Array.isArray(importedRules)) {
            throw new errors_1.AppError('文件格式错误：应为规则数组', 400);
        }
        let imported = 0;
        let updated = 0;
        let skipped = 0;
        let failed = 0;
        const errors = [];
        for (const ruleData of importedRules) {
            try {
                new RegExp(ruleData.regex);
                const existingRule = await database_1.default.rule.findUnique({
                    where: { name: ruleData.name }
                });
                if (existingRule) {
                    if (conflictStrategy === 'skip') {
                        skipped++;
                        continue;
                    }
                    else if (conflictStrategy === 'overwrite') {
                        await database_1.default.rule.update({
                            where: { id: existingRule.id },
                            data: {
                                regex: ruleData.regex,
                                keywords: JSON.stringify(ruleData.keywords),
                                severity: ruleData.severity,
                                weight: ruleData.weight,
                                solution: ruleData.solution,
                                categories: ruleData.categories ? JSON.stringify(ruleData.categories) : null
                            }
                        });
                        updated++;
                    }
                    else if (conflictStrategy === 'merge') {
                        skipped++;
                    }
                }
                else {
                    await database_1.default.rule.create({
                        data: {
                            name: ruleData.name,
                            regex: ruleData.regex,
                            keywords: JSON.stringify(ruleData.keywords),
                            severity: ruleData.severity || 'ERROR',
                            weight: ruleData.weight || 50,
                            solution: ruleData.solution,
                            categories: ruleData.categories ? JSON.stringify(ruleData.categories) : null,
                            enabled: true,
                            version: 1
                        }
                    });
                    imported++;
                }
            }
            catch (e) {
                failed++;
                errors.push(`规则 "${ruleData.name}" 导入失败: ${e instanceof Error ? e.message : String(e)}`);
            }
        }
        res.json({
            code: 0,
            message: 'success',
            data: {
                imported,
                updated,
                skipped,
                failed,
                errors: errors.slice(0, 10)
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to import rules', { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}
async function getRuleHistory(req, res) {
    try {
        const { ruleId } = req.params;
        const rule = await database_1.default.rule.findUnique({ where: { id: ruleId } });
        if (!rule) {
            throw new errors_1.AppError('规则不存在', 404);
        }
        const history = await database_1.default.ruleHistory.findMany({
            where: { ruleId },
            orderBy: { changedAt: 'desc' }
        });
        const formattedHistory = history.map(h => ({
            versionId: h.id,
            version: h.version,
            name: h.name,
            regex: h.regex,
            keywords: JSON.parse(h.keywords),
            severity: h.severity,
            weight: h.weight,
            solution: h.solution,
            categories: h.categories ? JSON.parse(h.categories) : [],
            changeLog: h.changeLog,
            changedAt: h.changedAt.toISOString()
        }));
        res.json({
            code: 0,
            message: 'success',
            data: formattedHistory,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get rule history', { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}
async function rollbackRule(req, res) {
    try {
        const { ruleId, versionId } = req.params;
        const rule = await database_1.default.rule.findUnique({ where: { id: ruleId } });
        if (!rule) {
            throw new errors_1.AppError('规则不存在', 404);
        }
        const historyRecord = await database_1.default.ruleHistory.findUnique({ where: { id: versionId } });
        if (!historyRecord) {
            throw new errors_1.AppError('历史版本不存在', 404);
        }
        if (historyRecord.ruleId !== ruleId) {
            throw new errors_1.AppError('历史版本不属于该规则', 400);
        }
        await database_1.default.ruleHistory.create({
            data: {
                ruleId,
                version: rule.version,
                name: rule.name,
                regex: rule.regex,
                keywords: rule.keywords,
                severity: rule.severity,
                weight: rule.weight,
                solution: rule.solution,
                categories: rule.categories,
                changeLog: `从版本 ${historyRecord.version} 回滚`,
                changedAt: new Date()
            }
        });
        const restoredRule = await database_1.default.rule.update({
            where: { id: ruleId },
            data: {
                name: historyRecord.name,
                regex: historyRecord.regex,
                keywords: historyRecord.keywords,
                severity: historyRecord.severity,
                weight: historyRecord.weight,
                solution: historyRecord.solution,
                categories: historyRecord.categories,
                version: { increment: 1 }
            }
        });
        res.json({
            code: 0,
            message: 'success',
            data: {
                id: restoredRule.id,
                version: restoredRule.version,
                message: `已回滚到版本 ${historyRecord.version}`
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to rollback rule', { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}
async function validateRules(req, res) {
    try {
        const { ruleIds, uploadType, content, fileName } = req.body;
        if (!Array.isArray(ruleIds) || ruleIds.length === 0) {
            throw new errors_1.AppError('ruleIds 必须是非空数组', 400);
        }
        let logContent = content;
        if (uploadType === 'url') {
            const axios = (await Promise.resolve().then(() => __importStar(require('axios')))).default;
            try {
                const response = await axios.get(content, { timeout: 10000 });
                logContent = response.data;
            }
            catch (e) {
                throw new errors_1.AppError('无法下载日志文件', 400);
            }
        }
        else if (uploadType === 'file') {
            logContent = Buffer.from(content, 'base64').toString('utf-8');
        }
        const logLines = logContent.split('\n');
        const rules = await database_1.default.rule.findMany({
            where: { id: { in: ruleIds } }
        });
        const results = rules.map(rule => {
            const keywords = JSON.parse(rule.keywords);
            const regex = new RegExp(rule.regex);
            const matchedLines = [];
            logLines.forEach((line, index) => {
                const hasKeywords = keywords.every(keyword => line.toLowerCase().includes(keyword.toLowerCase()));
                if (hasKeywords && regex.test(line)) {
                    matchedLines.push(index + 1);
                }
            });
            return {
                ruleId: rule.id,
                ruleName: rule.name,
                matched: matchedLines.length > 0,
                matchCount: matchedLines.length,
                matchedLines: matchedLines.slice(0, 100)
            };
        });
        res.json({
            code: 0,
            message: 'success',
            data: results,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to validate rules', { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}
async function batchUpdateCategories(req, res) {
    try {
        const { ruleIds, addCategories, removeCategories } = req.body;
        if (!Array.isArray(ruleIds) || ruleIds.length === 0) {
            throw new errors_1.AppError('ruleIds 必须是非空数组', 400);
        }
        let updated = 0;
        for (const ruleId of ruleIds) {
            const rule = await database_1.default.rule.findUnique({ where: { id: ruleId } });
            if (!rule)
                continue;
            let categories = rule.categories ? JSON.parse(rule.categories) : [];
            if (addCategories && Array.isArray(addCategories)) {
                categories = [...new Set([...categories, ...addCategories])];
            }
            if (removeCategories && Array.isArray(removeCategories)) {
                categories = categories.filter((cat) => !removeCategories.includes(cat));
            }
            await database_1.default.rule.update({
                where: { id: ruleId },
                data: { categories: JSON.stringify(categories) }
            });
            updated++;
        }
        res.json({
            code: 0,
            message: 'success',
            data: { updated },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to batch update categories', { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}
//# sourceMappingURL=ruleController.js.map
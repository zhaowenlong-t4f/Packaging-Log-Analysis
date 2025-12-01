"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = getRules;
exports.getRuleById = getRuleById;
exports.createRule = createRule;
exports.updateRule = updateRule;
exports.deleteRule = deleteRule;
exports.batchDeleteRules = batchDeleteRules;
exports.exportRules = exportRules;
exports.importRules = importRules;
exports.validateRule = validateRule;
exports.getRuleHistory = getRuleHistory;
exports.rollbackRule = rollbackRule;
exports.getRuleStats = getRuleStats;
exports.batchUpdateRules = batchUpdateRules;
exports.checkRuleNameExists = checkRuleNameExists;
exports.getRuleCategories = getRuleCategories;
exports.getRuleSeverities = getRuleSeverities;
const logger_1 = require("../utils/logger");
const database_1 = __importDefault(require("../config/database"));
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
        const findManyParams = {
            where,
            skip: (query.pageNo - 1) * query.pageSize,
            orderBy
        };
        if (query.pageSize) {
            findManyParams.take = query.pageSize;
        }
        const rules = await database_1.default.rule.findMany(findManyParams);
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
async function getRuleById(req, res) {
    try {
        const ruleId = String(req.params.ruleId);
        const rule = await database_1.default.rule.findUnique({ where: { id: ruleId } });
        if (!rule || !rule.enabled) {
            res.status(404).json({
                code: 404,
                message: 'Rule not found',
                data: null
            });
            return;
        }
        res.json({
            code: 0,
            message: 'success',
            data: rule
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get rule', { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}
async function createRule(req, res) {
    res.status(501).json({ code: 501, message: 'Not Implemented', data: null });
}
async function updateRule(req, res) {
    res.status(501).json({ code: 501, message: 'Not Implemented', data: null });
}
async function deleteRule(req, res) {
    res.status(501).json({ code: 501, message: 'Not Implemented', data: null });
}
async function batchDeleteRules(req, res) {
    res.status(501).json({ code: 501, message: 'Not Implemented', data: null });
}
async function exportRules(req, res) {
    res.status(501).json({ code: 501, message: 'Not Implemented', data: null });
}
async function importRules(req, res) {
    res.status(501).json({ code: 501, message: 'Not Implemented', data: null });
}
async function validateRule(req, res) {
    res.status(501).json({ code: 501, message: 'Not Implemented', data: null });
}
async function getRuleHistory(req, res) {
    res.status(501).json({ code: 501, message: 'Not Implemented', data: null });
}
async function rollbackRule(req, res) {
    res.status(501).json({ code: 501, message: 'Not Implemented', data: null });
}
async function getRuleStats(req, res) {
    res.status(501).json({ code: 501, message: 'Not Implemented', data: null });
}
async function batchUpdateRules(req, res) {
    res.status(501).json({ code: 501, message: 'Not Implemented', data: null });
}
async function checkRuleNameExists(req, res) {
    res.status(501).json({ code: 501, message: 'Not Implemented', data: null });
}
async function getRuleCategories(req, res) {
    res.status(501).json({ code: 501, message: 'Not Implemented', data: null });
}
async function getRuleSeverities(req, res) {
    res.status(501).json({ code: 501, message: 'Not Implemented', data: null });
}
//# sourceMappingURL=ruleController.js.map
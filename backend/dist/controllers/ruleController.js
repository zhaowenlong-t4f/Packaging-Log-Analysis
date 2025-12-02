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
const schemas_1 = require("../schemas");
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
            where.name = { contains: query.searchKeyword };
        }
        if (query.severityFilter) {
            const severities = query.severityFilter.split(',').map(s => s.trim());
            where.severity = { in: severities };
        }
        const sortField = ['updatedAt', 'createdAt', 'severity', 'weight'].includes(query.sortBy)
            ? query.sortBy
            : 'updatedAt';
        const orderBy = {
            [sortField]: query.sortOrder === 'asc' ? 'asc' : 'desc'
        };
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
    try {
        const validated = schemas_1.createRuleSchema.parse(req.body);
        const rule = await database_1.default.rule.create({
            data: {
                name: validated.name,
                regex: validated.regex,
                keywords: JSON.stringify(validated.keywords),
                solution: validated.solution,
                severity: validated.severity || 'ERROR',
                weight: validated.weight || 50,
                categories: validated.categories ? JSON.stringify(validated.categories) : null,
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
        const ruleId = String(req.params.ruleId);
        const validated = schemas_1.updateRuleSchema.parse(req.body);
        const updateData = {};
        if (validated.name !== undefined)
            updateData.name = validated.name;
        if (validated.regex !== undefined)
            updateData.regex = validated.regex;
        if (validated.keywords !== undefined)
            updateData.keywords = JSON.stringify(validated.keywords);
        if (validated.solution !== undefined)
            updateData.solution = validated.solution;
        if (validated.severity !== undefined)
            updateData.severity = validated.severity;
        if (validated.weight !== undefined)
            updateData.weight = validated.weight;
        if (validated.categories !== undefined)
            updateData.categories = validated.categories ? JSON.stringify(validated.categories) : null;
        const rule = await database_1.default.rule.update({
            where: { id: ruleId },
            data: updateData
        });
        res.json({
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
        logger_1.logger.error('Failed to update rule', { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}
async function deleteRule(req, res) {
    try {
        const ruleId = String(req.params.ruleId);
        await database_1.default.rule.delete({ where: { id: ruleId } });
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
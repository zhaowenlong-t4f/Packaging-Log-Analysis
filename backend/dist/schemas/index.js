"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRulesSchema = exports.batchUpdateCategoriesSchema = exports.batchDeleteRulesSchema = exports.logDetailsQuerySchema = exports.ruleListQuerySchema = exports.updateRuleSchema = exports.createRuleSchema = exports.analyzeLogSchema = void 0;
const zod_1 = require("zod");
exports.analyzeLogSchema = zod_1.z.object({
    uploadType: zod_1.z.enum(['url', 'file', 'text']),
    content: zod_1.z.string().min(1, '内容不能为空'),
    fileName: zod_1.z.string().min(1, '文件名不能为空'),
    metadata: zod_1.z.object({
        projectName: zod_1.z.string().optional(),
        buildVersion: zod_1.z.string().optional(),
        platform: zod_1.z.string().optional()
    }).optional()
});
exports.createRuleSchema = zod_1.z.object({
    name: zod_1.z.string()
        .min(2, '规则名称至少 2 个字符')
        .max(100, '规则名称最多 100 个字符'),
    regex: zod_1.z.string()
        .min(1, '正则表达式不能为空')
        .refine((val) => {
        try {
            new RegExp(val);
            return true;
        }
        catch {
            return false;
        }
    }, '无效的正则表达式'),
    keywords: zod_1.z.array(zod_1.z.string())
        .min(1, '至少需要 1 个关键词')
        .max(50, '最多 50 个关键词'),
    severity: zod_1.z.enum(['CRITICAL', 'ERROR', 'WARNING', 'INFO']).default('ERROR'),
    weight: zod_1.z.number()
        .int()
        .min(0, '权重最小为 0')
        .max(100, '权重最大为 100')
        .default(50),
    solution: zod_1.z.string().max(5000, '解决方案最多 5000 字符').optional(),
    categories: zod_1.z.array(zod_1.z.string()).max(10, '最多 10 个分类').optional()
});
exports.updateRuleSchema = exports.createRuleSchema.partial();
exports.ruleListQuerySchema = zod_1.z.object({
    pageNo: zod_1.z.string().transform(Number).default('1'),
    pageSize: zod_1.z.string().transform(Number).default('20'),
    sortBy: zod_1.z.enum(['updatedAt', 'createdAt', 'severity', 'weight']).default('updatedAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
    searchKeyword: zod_1.z.string().optional(),
    categoryFilter: zod_1.z.string().optional().transform((val) => val ? val.split(',') : undefined),
    severityFilter: zod_1.z.string().optional().transform((val) => val ? val.split(',') : undefined)
});
exports.logDetailsQuerySchema = zod_1.z.object({
    pageNo: zod_1.z.string().transform(Number).default('1'),
    pageSize: zod_1.z.string().transform(Number).default('20'),
    sortBy: zod_1.z.enum(['severity', 'weight', 'count', 'firstOccurrenceLine']).default('severity'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
    searchKeyword: zod_1.z.string().optional(),
    severityFilter: zod_1.z.string().optional().transform((val) => val ? val.split(',') : undefined)
});
exports.batchDeleteRulesSchema = zod_1.z.object({
    ruleIds: zod_1.z.array(zod_1.z.string()).min(1, '至少需要 1 个规则 ID')
});
exports.batchUpdateCategoriesSchema = zod_1.z.object({
    ruleIds: zod_1.z.array(zod_1.z.string()).min(1, '至少需要 1 个规则 ID'),
    addCategories: zod_1.z.array(zod_1.z.string()).optional(),
    removeCategories: zod_1.z.array(zod_1.z.string()).optional()
}).refine((data) => data.addCategories || data.removeCategories, {
    message: '至少需要提供 addCategories 或 removeCategories 中的一个'
});
exports.validateRulesSchema = zod_1.z.object({
    ruleIds: zod_1.z.array(zod_1.z.string()).min(1, '至少需要 1 个规则 ID'),
    uploadType: zod_1.z.enum(['text', 'url', 'file']),
    content: zod_1.z.string().min(1, '内容不能为空'),
    fileName: zod_1.z.string().min(1, '文件名不能为空')
});
//# sourceMappingURL=index.js.map
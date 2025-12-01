import { z } from 'zod';

// 分析日志请求验证
export const analyzeLogSchema = z.object({
  uploadType: z.enum(['url', 'file', 'text']),
  content: z.string().min(1, '内容不能为空'),
  fileName: z.string().min(1, '文件名不能为空'),
  metadata: z.object({
    projectName: z.string().optional(),
    buildVersion: z.string().optional(),
    platform: z.string().optional()
  }).optional()
});

// 创建规则验证
export const createRuleSchema = z.object({
  name: z.string()
    .min(2, '规则名称至少 2 个字符')
    .max(100, '规则名称最多 100 个字符'),
  regex: z.string()
    .min(1, '正则表达式不能为空')
    .refine((val) => {
      try {
        new RegExp(val);
        return true;
      } catch {
        return false;
      }
    }, '无效的正则表达式'),
  keywords: z.array(z.string())
    .min(1, '至少需要 1 个关键词')
    .max(50, '最多 50 个关键词'),
  severity: z.enum(['CRITICAL', 'ERROR', 'WARNING', 'INFO']).default('ERROR'),
  weight: z.number()
    .int()
    .min(0, '权重最小为 0')
    .max(100, '权重最大为 100')
    .default(50),
  solution: z.string().max(5000, '解决方案最多 5000 字符').optional(),
  categories: z.array(z.string()).max(10, '最多 10 个分类').optional()
});

// 更新规则验证
export const updateRuleSchema = createRuleSchema.partial();

// 规则列表查询验证
export const ruleListQuerySchema = z.object({
  pageNo: z.string().transform(Number).default('1'),
  pageSize: z.string().transform(Number).default('20'),
  sortBy: z.enum(['updatedAt', 'createdAt', 'severity', 'weight']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  searchKeyword: z.string().optional(),
  categoryFilter: z.string().optional().transform((val) => val ? val.split(',') : undefined),
  severityFilter: z.string().optional().transform((val) => val ? val.split(',') as any : undefined)
});

// 日志详情查询验证
export const logDetailsQuerySchema = z.object({
  pageNo: z.string().transform(Number).default('1'),
  pageSize: z.string().transform(Number).default('20'),
  sortBy: z.enum(['severity', 'weight', 'count', 'firstOccurrenceLine']).default('severity'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  searchKeyword: z.string().optional(),
  severityFilter: z.string().optional().transform((val) => val ? val.split(',') as any : undefined)
});

// 批量删除规则验证
export const batchDeleteRulesSchema = z.object({
  ruleIds: z.array(z.string()).min(1, '至少需要 1 个规则 ID')
});

// 批量更新分类验证
export const batchUpdateCategoriesSchema = z.object({
  ruleIds: z.array(z.string()).min(1, '至少需要 1 个规则 ID'),
  addCategories: z.array(z.string()).optional(),
  removeCategories: z.array(z.string()).optional()
}).refine((data) => data.addCategories || data.removeCategories, {
  message: '至少需要提供 addCategories 或 removeCategories 中的一个'
});

// 验证规则请求验证
export const validateRulesSchema = z.object({
  ruleIds: z.array(z.string()).min(1, '至少需要 1 个规则 ID'),
  uploadType: z.enum(['text', 'url', 'file']),
  content: z.string().min(1, '内容不能为空'),
  fileName: z.string().min(1, '文件名不能为空')
});

export type AnalyzeLogInput = z.infer<typeof analyzeLogSchema>;
export type CreateRuleInput = z.infer<typeof createRuleSchema>;
export type UpdateRuleInput = z.infer<typeof updateRuleSchema>;
export type RuleListQueryInput = z.infer<typeof ruleListQuerySchema>;
export type LogDetailsQueryInput = z.infer<typeof logDetailsQuerySchema>;
export type BatchDeleteRulesInput = z.infer<typeof batchDeleteRulesSchema>;
export type BatchUpdateCategoriesInput = z.infer<typeof batchUpdateCategoriesSchema>;
export type ValidateRulesInput = z.infer<typeof validateRulesSchema>;
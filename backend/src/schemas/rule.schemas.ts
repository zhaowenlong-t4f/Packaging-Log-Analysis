/**
 * 规则相关的 Zod Schema
 */

import { z } from 'zod';

// 严重程度枚举
const severityEnum = z.enum(['CRITICAL', 'ERROR', 'WARNING', 'INFO']);

// 创建规则 Schema
export const createRuleSchema = z.object({
  name: z
    .string()
    .min(2, '规则名称至少 2 个字符')
    .max(100, '规则名称最多 100 个字符'),
  regex: z
    .string()
    .min(1, '正则表达式不能为空')
    .refine(
      (val) => {
        try {
          new RegExp(val);
          return true;
        } catch {
          return false;
        }
      },
      { message: '无效的正则表达式' }
    ),
  keywords: z
    .array(z.string())
    .min(1, '至少需要 1 个关键词')
    .max(50, '最多 50 个关键词'),
  solution: z.string().max(5000, '解决方案最多 5000 字符').optional(),
  severity: severityEnum.default('ERROR'),
  weight: z
    .number()
    .int()
    .min(0, '权重最小为 0')
    .max(100, '权重最大为 100')
    .default(50),
  categories: z.array(z.string()).max(10, '最多 10 个分类').optional(),
});

// 更新规则 Schema
export const updateRuleSchema = createRuleSchema.partial();

// 规则查询参数 Schema
export const ruleQuerySchema = z.object({
  pageNo: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['updatedAt', 'createdAt', 'severity', 'weight']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  searchKeyword: z.string().optional(),
  categoryFilter: z.string().optional().transform((val) => {
    if (!val) return undefined;
    return val.split(',').filter(Boolean);
  }),
  severityFilter: z.string().optional().transform((val) => {
    if (!val) return undefined;
    return val.split(',').filter(Boolean) as Array<'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO'>;
  }),
  enabled: z.coerce.boolean().optional(),
});

// 规则 ID 参数 Schema
export const ruleIdSchema = z.object({
  id: z.string().min(1),
});


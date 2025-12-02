/**
 * 日志相关的 Zod Schema
 */

import { z } from 'zod';

// 上传类型枚举
const uploadTypeEnum = z.enum(['url', 'file', 'text']);

// 日志上传 Schema
export const logUploadSchema = z.object({
  uploadType: uploadTypeEnum,
  content: z.string().min(1, '内容不能为空'),
  fileName: z.string().min(1, '文件名不能为空'),
  metadata: z
    .object({
      projectName: z.string().optional(),
      buildVersion: z.string().optional(),
      platform: z.string().optional(),
    })
    .optional(),
});

// 日志详情查询参数 Schema
export const logDetailQuerySchema = z.object({
  pageNo: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  searchKeyword: z.string().optional(),
  severityFilter: z.string().optional().transform((val) => {
    if (!val) return undefined;
    return val.split(',').filter(Boolean);
  }),
});

// 分析 ID 参数 Schema
export const analysisIdSchema = z.object({
  analysisId: z.string().min(1),
});


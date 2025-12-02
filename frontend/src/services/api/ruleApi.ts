/**
 * 规则管理 API
 */

import client from './client';
import { ApiResponse } from '@/types/api.types';
import {
  Rule,
  CreateRuleInput,
  UpdateRuleInput,
  RuleQueryParams,
  RuleHistory,
  RuleValidateRequest,
  RuleValidateResult,
  BatchDeleteRequest,
  BatchUpdateCategoryRequest,
  RuleImportResult,
  ConflictStrategy,
} from '@/types/rule.types';

/**
 * 获取规则列表
 */
export async function getRules(params: RuleQueryParams): Promise<{
  pagination: any;
  rules: Rule[];
}> {
  const response = await client.get<ApiResponse<{
    pagination: any;
    rules: Rule[];
  }>>('/rules', {
    params: {
      ...params,
      categoryFilter: params.categoryFilter?.join(','),
      severityFilter: params.severityFilter?.join(','),
    },
  });
  return response.data.data;
}

/**
 * 获取单个规则
 */
export async function getRule(id: string): Promise<Rule> {
  const response = await client.get<ApiResponse<Rule>>(`/rules/${id}`);
  return response.data.data;
}

/**
 * 创建规则
 */
export async function createRule(input: CreateRuleInput): Promise<Rule> {
  const response = await client.post<ApiResponse<Rule>>('/rules', input);
  return response.data.data;
}

/**
 * 更新规则
 */
export async function updateRule(id: string, input: UpdateRuleInput): Promise<Rule> {
  const response = await client.put<ApiResponse<Rule>>(`/rules/${id}`, input);
  return response.data.data;
}

/**
 * 删除规则
 */
export async function deleteRule(id: string): Promise<void> {
  await client.delete(`/rules/${id}`);
}

/**
 * 批量删除规则
 */
export async function batchDeleteRules(request: BatchDeleteRequest): Promise<{
  deleted: number;
  failed: number;
}> {
  const response = await client.post<ApiResponse<{ deleted: number; failed: number }>>(
    '/rules/batch-delete',
    request
  );
  return response.data.data;
}

/**
 * 获取规则版本历史
 */
export async function getRuleHistory(
  id: string,
  pageNo: number = 1,
  pageSize: number = 10
): Promise<{ pagination: any; versions: RuleHistory[] }> {
  const response = await client.get<ApiResponse<{ pagination: any; versions: RuleHistory[] }>>(
    `/rules/${id}/history`,
    {
      params: { pageNo, pageSize },
    }
  );
  return response.data.data;
}

/**
 * 回滚规则到指定版本
 */
export async function rollbackRule(id: string, versionId: number): Promise<Rule> {
  const response = await client.post<ApiResponse<Rule>>(`/rules/${id}/rollback/${versionId}`);
  return response.data.data;
}

/**
 * 验证规则
 */
export async function validateRules(request: RuleValidateRequest): Promise<{
  results: RuleValidateResult[];
}> {
  const response = await client.post<ApiResponse<{ results: RuleValidateResult[] }>>(
    '/rules/validate',
    request
  );
  return response.data.data;
}

/**
 * 批量更新分类
 */
export async function batchUpdateCategory(
  request: BatchUpdateCategoryRequest
): Promise<{ updated: number; failed: number }> {
  const response = await client.post<ApiResponse<{ updated: number; failed: number }>>(
    '/rules/batch-update-category',
    request
  );
  return response.data.data;
}

/**
 * 导出规则
 */
export async function exportRules(ruleIds?: string[]): Promise<Rule[]> {
  const response = await client.get<Blob>('/rules/export', {
    params: ruleIds ? { ruleIds: ruleIds.join(',') } : {},
    responseType: 'blob',
  });

  // 处理文件下载
  const blob = response.data;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `rules-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);

  // 返回规则数据
  const text = await blob.text();
  return JSON.parse(text);
}

/**
 * 导入规则
 */
export async function importRules(
  file: File,
  conflictStrategy: ConflictStrategy = 'skip'
): Promise<RuleImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('conflictStrategy', conflictStrategy);

  try {
    // 注意：不要手动设置 Content-Type，让浏览器自动设置 multipart/form-data 和 boundary
    const response = await client.post<ApiResponse<RuleImportResult>>('/rules/import', formData);
    return response.data.data;
  } catch (error: any) {
    // 提供更详细的错误信息
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error.message) {
      throw error;
    }
    throw new Error('导入失败，请检查文件格式');
  }
}


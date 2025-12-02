/**
 * 日志分析 API
 */

import client from './client';
import { ApiResponse, PaginatedResponse } from '@/types/api.types';
import {
  LogUploadRequest,
  LogAnalysisResult,
  ErrorDetail,
  LogDetailQueryParams,
} from '@/types/log.types';

/**
 * 上传日志并分析
 */
export async function analyzeLog(request: LogUploadRequest): Promise<LogAnalysisResult> {
  const response = await client.post<ApiResponse<LogAnalysisResult>>('/logs/analyze', request);
  return response.data.data;
}

/**
 * 获取分析结果详情
 */
export async function getLogDetails(
  params: LogDetailQueryParams
): Promise<PaginatedResponse<ErrorDetail>> {
  const { analysisId, ...queryParams } = params;
  const response = await client.get<ApiResponse<{
    analysisId: string;
    pagination: any;
    errors: ErrorDetail[];
  }>>(
    `/logs/${analysisId}/details`,
    {
      params: {
        ...queryParams,
        severityFilter: queryParams.severityFilter?.join(','),
      },
    }
  );
  // 转换后端返回的数据结构为前端期望的格式
  const backendData = response.data.data;
  return {
    ...response.data,
    data: {
      pagination: backendData.pagination,
      items: backendData.errors || [],
    },
  };
}

/**
 * 获取单个错误详情
 */
export async function getErrorDetail(
  analysisId: string,
  errorId: string
): Promise<ErrorDetail> {
  const response = await client.get<ApiResponse<ErrorDetail>>(
    `/logs/${analysisId}/error/${errorId}`
  );
  return response.data.data;
}


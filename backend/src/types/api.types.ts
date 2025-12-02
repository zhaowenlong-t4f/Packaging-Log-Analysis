/**
 * API 响应类型定义
 */

import { PaginationResponse } from './common.types';

// 统一 API 响应格式
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
  traceId?: string;
}

// 成功响应
export interface SuccessResponse<T> extends ApiResponse<T> {
  code: 0;
}

// 错误响应
export interface ErrorResponse extends ApiResponse<null> {
  code: number;
  message: string;
  data: null;
}

// 验证错误响应
export interface ValidationErrorResponse extends ApiResponse<{
  errors: Array<{
    field: string;
    message: string;
  }>;
}> {
  code: 422;
}

// 分页响应
export interface PaginatedResponse<T> extends ApiResponse<{
  pagination: PaginationResponse;
  items: T[];
}> {}


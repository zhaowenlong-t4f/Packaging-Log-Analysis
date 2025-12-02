/**
 * 统一响应格式化工具
 */

import { Response } from 'express';
import { ApiResponse, ErrorResponse, ValidationErrorResponse } from '../types/api.types';
import { generateTraceId } from './formatters';

/**
 * 成功响应
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = 'success',
  code: number = 0
): void {
  const traceId = (res.locals.traceId as string) || generateTraceId();
  const response: ApiResponse<T> = {
    code,
    message,
    data,
    timestamp: new Date().toISOString(),
    traceId,
  };
  res.json(response);
}

/**
 * 错误响应
 */
export function sendError(
  res: Response,
  message: string,
  code: number = 500,
  data: unknown = null
): void {
  const traceId = (res.locals.traceId as string) || generateTraceId();
  const response: ErrorResponse = {
    code,
    message,
    data,
    timestamp: new Date().toISOString(),
    traceId,
  };
  res.status(code >= 400 && code < 600 ? code : 500).json(response);
}

/**
 * 验证错误响应
 */
export function sendValidationError(
  res: Response,
  errors: Array<{ field: string; message: string }>
): void {
  const traceId = (res.locals.traceId as string) || generateTraceId();
  const response: ValidationErrorResponse = {
    code: 422,
    message: 'Validation failed',
    data: { errors },
    timestamp: new Date().toISOString(),
    traceId,
  };
  res.status(422).json(response);
}

/**
 * 未找到响应
 */
export function sendNotFound(res: Response, message: string = 'Resource not found'): void {
  sendError(res, message, 404);
}

/**
 * 冲突响应
 */
export function sendConflict(res: Response, message: string = 'Conflict'): void {
  sendError(res, message, 409);
}


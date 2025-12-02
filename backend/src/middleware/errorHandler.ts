/**
 * 全局错误处理中间件
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError, sendValidationError } from '../utils/response';
import { logger } from '../utils/logger';
import { generateTraceId } from '../utils/formatters';

/**
 * 自定义错误类
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: number = 500
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public errors?: Array<{ field: string; message: string }>) {
    super(message, 422, 422);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, 500, 500);
    this.name = 'DatabaseError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409, 409);
    this.name = 'ConflictError';
  }
}

/**
 * 全局错误处理中间件
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 生成或获取追踪 ID
  const traceId = (req.headers['x-request-id'] as string) || generateTraceId();
  res.locals.traceId = traceId;

  // 记录错误日志
  logger.error('Unhandled error', {
    traceId,
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Zod 验证错误
  if (error instanceof ZodError) {
    const errors = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return sendValidationError(res, errors);
  }

  // 自定义应用错误
  if (error instanceof AppError) {
    return sendError(res, error.message, error.statusCode, null);
  }

  // 默认错误
  sendError(res, 'Internal server error', 500, null);
}


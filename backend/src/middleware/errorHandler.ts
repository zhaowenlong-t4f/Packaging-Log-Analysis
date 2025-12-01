import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ValidationError } from '../utils/errors';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const traceId = req.headers['x-request-id'] as string || generateId();

  logger.error('Unhandled error', {
    traceId,
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });

  // 自定义错误
  if (error instanceof ValidationError) {
    return res.status(422).json({
      code: 422,
      message: 'Validation failed',
      data: { errors: error.errors },
      timestamp: new Date().toISOString(),
      traceId
    });
  }

  // Prisma 错误
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    if (prismaError.code === 'P2002') {
      return res.status(409).json({
        code: 409,
        message: 'Resource already exists',
        data: null,
        timestamp: new Date().toISOString(),
        traceId
      });
    }
  }

  // 默认服务器错误
  res.status(500).json({
    code: 500,
    message: 'Internal server error',
    data: null,
    timestamp: new Date().toISOString(),
    traceId
  });
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
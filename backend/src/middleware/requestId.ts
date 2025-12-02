/**
 * 请求追踪 ID 中间件
 */

import { Request, Response, NextFunction } from 'express';
import { generateTraceId } from '../utils/formatters';

/**
 * 为每个请求生成或使用追踪 ID
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const traceId = (req.headers['x-request-id'] as string) || generateTraceId();
  res.locals.traceId = traceId;
  res.setHeader('X-Request-ID', traceId);
  next();
}


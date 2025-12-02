/**
 * 文件上传中间件
 */

import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { env } from '../config/env';
import { sendError } from '../utils/response';

// 配置 multer 内存存储
const storage = multer.memoryStorage();

// 文件大小限制
const maxFileSize = env.maxUploadSize;

// 创建 multer 实例
export const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSize,
  },
  fileFilter: (_req, _file, cb) => {
    // 允许所有文件类型（日志文件可能是各种格式）
    cb(null, true);
  },
});

/**
 * 文件上传错误处理中间件
 */
export function fileUploadErrorHandler(
  error: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return sendError(
        res,
        `File size exceeds limit (max ${Math.round(maxFileSize / 1024 / 1024)}MB)`,
        413
      );
    }
    return sendError(res, `File upload error: ${error.message}`, 400);
  }
  next(error);
}


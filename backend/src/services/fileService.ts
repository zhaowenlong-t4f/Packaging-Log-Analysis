/**
 * 文件服务模块
 */

import { UploadType } from '../types/log.types';
import { downloadFileFromUrl } from '../utils/fileDownloader';
import { parseLogContent } from '../utils/logParser';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { validateBase64, validateUrl } from '../utils/validators';

/**
 * 从 Base64 字符串解码文件
 */
function decodeBase64File(base64String: string): Buffer {
  try {
    // 移除 data URL 前缀（如果存在）
    const base64Data = base64String.includes(',')
      ? base64String.split(',')[1]
      : base64String;

    return Buffer.from(base64Data, 'base64');
  } catch (error) {
    logger.error('Base64 decode error', { error });
    throw new Error('Invalid Base64 string');
  }
}

/**
 * 获取日志内容（根据上传类型）
 */
export async function getLogContent(
  uploadType: UploadType,
  content: string
): Promise<Buffer> {
  switch (uploadType) {
    case 'url': {
      if (!validateUrl(content)) {
        throw new Error('Invalid URL');
      }
      logger.info('Downloading log from URL', { url: content });
      return await downloadFileFromUrl(content);
    }

    case 'file': {
      if (!validateBase64(content)) {
        throw new Error('Invalid Base64 string');
      }
      logger.info('Decoding log from Base64');
      // 如果已经是纯 Base64（没有 data URL 前缀），直接使用
      // 如果有 data URL 前缀，decodeBase64File 会处理
      return decodeBase64File(content);
    }

    case 'text': {
      logger.info('Using log from text input');
      return Buffer.from(content, 'utf-8');
    }

    default:
      throw new Error(`Unsupported upload type: ${uploadType}`);
  }
}

/**
 * 处理日志文件
 */
export async function processLogFile(
  uploadType: UploadType,
  content: string
): Promise<{
  lines: string[];
  fileSize: number;
}> {
  // 1. 获取文件内容
  const buffer = await getLogContent(uploadType, content);

  // 2. 检查文件大小
  if (buffer.length > env.maxLogSize) {
    throw new Error(
      `File size exceeds limit (max ${Math.round(env.maxLogSize / 1024 / 1024)}MB)`
    );
  }

  // 3. 解析日志内容
  const lines = parseLogContent(buffer);

  logger.info('Log file processed', {
    uploadType,
    fileSize: buffer.length,
    lineCount: lines.length,
  });

  return {
    lines,
    fileSize: buffer.length,
  };
}

/**
 * 保存原始日志内容（用于后续查询）
 */
export function saveRawContent(buffer: Buffer): string {
  // 对于大文件，可以考虑只保存部分内容或压缩
  // 这里简化处理，直接转换为字符串
  // 注意：SQLite TEXT 字段有大小限制，可能需要截断
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (buffer.length > maxSize) {
    logger.warn('Log content too large, truncating', {
      originalSize: buffer.length,
      maxSize,
    });
    return buffer.toString('utf-8', 0, maxSize) + '\n... (truncated)';
  }
  return buffer.toString('utf-8');
}


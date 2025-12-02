/**
 * 日志解析工具
 */

import { logger } from './logger';

/**
 * 检测字符编码
 */
export function detectEncoding(buffer: Buffer): string {
  // 简单的编码检测逻辑
  // 实际项目中可以使用 jschardet 或类似库

  // 检查 UTF-8 BOM
  if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return 'utf-8';
  }

  // 检查 UTF-16 LE BOM
  if (buffer[0] === 0xff && buffer[1] === 0xfe) {
    return 'utf-16le';
  }

  // 检查 UTF-16 BE BOM
  if (buffer[0] === 0xfe && buffer[1] === 0xff) {
    return 'utf-16be';
  }

  // 尝试检测是否为 UTF-8
  try {
    const text = buffer.toString('utf-8');
    // 简单验证：检查是否包含无效的 UTF-8 序列
    if (Buffer.from(text, 'utf-8').equals(buffer)) {
      return 'utf-8';
    }
  } catch {
    // 不是 UTF-8
  }

  // 默认尝试 GBK（中文环境常见）
  return 'gbk';
}

/**
 * 转换字符编码
 */
export function convertEncoding(buffer: Buffer, fromEncoding: string, _toEncoding: string = 'utf-8'): string {
  try {
    // Node.js 原生支持的编码转换
    if (fromEncoding === 'utf-8' || fromEncoding === 'utf8') {
      return buffer.toString('utf-8');
    }

    // 对于其他编码，需要第三方库
    // 这里简化处理，假设已经是 UTF-8 或可以按 UTF-8 读取
    return buffer.toString('utf-8');
  } catch (error) {
    logger.warn('Encoding conversion failed', { fromEncoding, error });
    // 降级处理：尝试 UTF-8
    return buffer.toString('utf-8', 0, buffer.length);
  }
}

/**
 * 分割日志行
 */
export function splitLines(content: string): string[] {
  // 处理不同操作系统的换行符
  return content
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * 去除重复的连续行
 */
export function removeDuplicateLines(lines: string[]): string[] {
  const result: string[] = [];
  let lastLine: string | null = null;

  for (const line of lines) {
    if (line !== lastLine) {
      result.push(line);
      lastLine = line;
    }
  }

  return result;
}

/**
 * 规范化日志行
 */
export function normalizeLogLines(lines: string[]): string[] {
  return lines.map((line) => {
    // 移除控制字符（保留换行符和制表符）
    return line.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  });
}

/**
 * 解析日志内容
 */
export function parseLogContent(buffer: Buffer): string[] {
  // 1. 检测编码
  const encoding = detectEncoding(buffer);
  logger.debug('Detected encoding', { encoding });

  // 2. 转换编码
  const content = convertEncoding(buffer, encoding);
  logger.debug('Converted encoding', { length: content.length });

  // 3. 分割行
  let lines = splitLines(content);
  logger.debug('Split lines', { count: lines.length });

  // 4. 去除重复行
  lines = removeDuplicateLines(lines);
  logger.debug('Removed duplicates', { count: lines.length });

  // 5. 规范化
  lines = normalizeLogLines(lines);
  logger.debug('Normalized lines', { count: lines.length });

  return lines;
}


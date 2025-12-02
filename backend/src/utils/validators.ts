/**
 * 验证工具函数
 */

/**
 * 验证正则表达式语法
 */
export function validateRegex(regex: string): boolean {
  try {
    new RegExp(regex);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证 URL
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证 Base64 字符串
 * 支持两种格式：
 * 1. 完整的 data URL 格式：data:xxx;base64,xxx
 * 2. 纯 Base64 字符串
 */
export function validateBase64(str: string): boolean {
  if (!str || typeof str !== 'string') {
    return false;
  }
  
  // 如果是完整的 data URL 格式
  const dataUrlRegex = /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+)?;base64,(.+)$/;
  if (dataUrlRegex.test(str)) {
    return true;
  }
  
  // 如果是纯 Base64 字符串（移除可能的空白字符）
  const base64Content = str.trim();
  // Base64 字符集：A-Z, a-z, 0-9, +, /, = (用于填充)
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (base64Regex.test(base64Content) && base64Content.length > 0) {
    // 验证长度是 4 的倍数（Base64 编码要求）
    return base64Content.length % 4 === 0 || base64Content.length % 4 === 1; // 允许末尾有填充
  }
  
  return false;
}

/**
 * 验证文件大小
 */
export function validateFileSize(size: number, maxSize: number): boolean {
  return size <= maxSize;
}

/**
 * 验证分页参数
 */
export function validatePagination(pageNo: number, pageSize: number): boolean {
  return pageNo > 0 && pageSize > 0 && pageSize <= 100;
}


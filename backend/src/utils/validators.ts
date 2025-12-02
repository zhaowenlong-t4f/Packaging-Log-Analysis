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
 */
export function validateBase64(str: string): boolean {
  const base64Regex = /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+)?;base64,(.+)$/;
  return base64Regex.test(str);
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


/**
 * HTTP 文件下载工具
 */

import axios, { AxiosResponse } from 'axios';
import { Readable } from 'stream';
import { logger } from './logger';
import { env } from '../config/env';

/**
 * 从 URL 下载文件（流式处理）
 */
export async function downloadFileFromUrl(url: string): Promise<Buffer> {
  try {
    logger.info(`Downloading file from URL: ${url}`);

    const response: AxiosResponse<Readable> = await axios({
      method: 'GET',
      url,
      responseType: 'stream',
      timeout: 300000, // 5分钟超时
      maxContentLength: env.maxLogSize,
      maxBodyLength: env.maxLogSize,
    });

    // 将流转换为 Buffer
    const chunks: Buffer[] = [];
    let totalSize = 0;

    return new Promise((resolve, reject) => {
      response.data.on('data', (chunk: Buffer) => {
        totalSize += chunk.length;
        if (totalSize > env.maxLogSize) {
          reject(new Error(`File size exceeds limit (max ${Math.round(env.maxLogSize / 1024 / 1024)}MB)`));
          return;
        }
        chunks.push(chunk);
      });

      response.data.on('end', () => {
        const buffer = Buffer.concat(chunks);
        logger.info(`File downloaded successfully, size: ${buffer.length} bytes`);
        resolve(buffer);
      });

      response.data.on('error', (error: Error) => {
        logger.error('File download error', { error: error.message });
        reject(error);
      });
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error('HTTP download error', {
        url,
        status: error.response?.status,
        message: error.message,
      });
      throw new Error(`Failed to download file from URL: ${error.message}`);
    }
    throw error;
  }
}

/**
 * 验证 URL 是否可访问
 */
export async function validateUrl(url: string): Promise<boolean> {
  try {
    const response = await axios.head(url, { timeout: 10000 });
    return response.status === 200;
  } catch {
    return false;
  }
}


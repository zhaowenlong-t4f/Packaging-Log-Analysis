/**
 * Axios 客户端配置
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { API_BASE_URL } from '@/config/constants';
import { ApiResponse, ErrorResponse, ValidationErrorResponse } from '@/types/api.types';
// 简单的 UUID 生成函数
function generateRequestId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 创建 axios 实例
const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// 请求拦截器
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 添加 Request ID
    const requestId = generateRequestId();
    config.headers['X-Request-ID'] = requestId;

    // 如果有 token，添加到请求头
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 如果不是 FormData，设置默认的 Content-Type
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
    }
    // FormData 请求时，让浏览器自动设置 Content-Type 和 boundary

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
client.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse;

    // 检查业务状态码
    if (data.code !== 0) {
      // 业务错误
      handleBusinessError(data);
      return Promise.reject(new Error(data.message || '请求失败'));
    }

    return response;
  },
  (error: AxiosError<ErrorResponse | ValidationErrorResponse>) => {
    // HTTP 错误
    handleHttpError(error);
    return Promise.reject(error);
  }
);

/**
 * 处理业务错误
 */
function handleBusinessError(data: ApiResponse) {
  const { code, message: msg, data: errorData } = data;

  switch (code) {
    case 401:
      // 未认证，清除 token 并跳转登录
      localStorage.removeItem('token');
      window.location.href = '/login';
      message.error('登录已过期，请重新登录');
      break;

    case 403:
      message.error('您无权限访问此资源');
      break;

    case 404:
      message.error('请求的资源不存在');
      break;

    case 409:
      message.error(msg || '资源冲突');
      break;

    case 422:
      // 验证错误
      const validationError = errorData as ValidationErrorResponse['data'];
      if (validationError?.errors) {
        validationError.errors.forEach((err) => {
          message.error(`${err.field}: ${err.message}`);
        });
      } else {
        message.error(msg || '数据验证失败');
      }
      break;

    case 413:
      message.error('文件过大，请选择小于 500MB 的文件');
      break;

    case 429:
      message.warning('请求过于频繁，请稍后再试');
      break;

    case 500:
      message.error('服务内部错误，请稍后重试');
      break;

    case 503:
      message.error('服务暂时不可用，请稍后重试');
      break;

    default:
      message.error(msg || '请求失败');
  }
}

/**
 * 处理 HTTP 错误
 */
function handleHttpError(error: AxiosError<ErrorResponse | ValidationErrorResponse>) {
  if (!error.response) {
    // 网络错误
    message.error('网络连接失败，请检查网络');
    return;
  }

  const { status, data } = error.response;

  switch (status) {
    case 400:
      message.error(data?.message || '请求参数错误');
      break;

    case 401:
      localStorage.removeItem('token');
      window.location.href = '/login';
      message.error('登录已过期，请重新登录');
      break;

    case 403:
      message.error('您无权限访问此资源');
      break;

    case 404:
      message.error('请求的资源不存在');
      break;

    case 413:
      message.error('文件过大，请选择小于 500MB 的文件');
      break;

    case 422:
      const validationError = data as ValidationErrorResponse;
      if (validationError?.data?.errors) {
        validationError.data.errors.forEach((err) => {
          message.error(`${err.field}: ${err.message}`);
        });
      } else {
        message.error(data?.message || '数据验证失败');
      }
      break;

    case 429:
      message.warning('请求过于频繁，请稍后再试');
      break;

    case 500:
      message.error('服务内部错误，请稍后重试');
      break;

    case 503:
      message.error('服务暂时不可用，请稍后重试');
      break;

    default:
      message.error(data?.message || `请求失败 (${status})`);
  }
}

export default client;


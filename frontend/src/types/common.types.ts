/**
 * 通用类型定义
 */

// 分页参数
export interface PaginationParams {
  pageNo?: number;
  pageSize?: number;
}

// 分页响应
export interface PaginationResponse {
  pageNo: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

// 排序参数
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 搜索参数
export interface SearchParams {
  searchKeyword?: string;
}


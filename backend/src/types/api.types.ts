// API 响应类型
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
  traceId?: string;
}

// 分页响应
export interface PaginatedResponse<T> extends ApiResponse<{
  pagination: {
    pageNo: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  items: T[];
}> {}

// 错误响应
export interface ErrorResponse extends ApiResponse<null> {
  code: number;
  message: string;
}

// 上传类型
export type UploadType = 'url' | 'file' | 'text';

// 严重程度
export type Severity = 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';

// 排序方向
export type SortOrder = 'asc' | 'desc';

// 查询参数
export interface QueryParams {
  pageNo?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  searchKeyword?: string;
}

// 上下文行
export interface ContextLines {
  before: Array<{
    lineNo: number;
    content: string;
    isMatch: boolean;
  }>;
  current: {
    lineNo: number;
    content: string;
    isMatch: boolean;
  };
  after: Array<{
    lineNo: number;
    content: string;
    isMatch: boolean;
  }>;
}
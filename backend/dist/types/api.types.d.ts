export interface ApiResponse<T = any> {
    code: number;
    message: string;
    data: T;
    timestamp: string;
    traceId?: string;
}
export interface PaginatedResponse<T> extends ApiResponse<{
    pagination: {
        pageNo: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
    items: T[];
}> {
}
export interface ErrorResponse extends ApiResponse<null> {
    code: number;
    message: string;
}
export type UploadType = 'url' | 'file' | 'text';
export type Severity = 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';
export type SortOrder = 'asc' | 'desc';
export interface QueryParams {
    pageNo?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: SortOrder;
    searchKeyword?: string;
}
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
//# sourceMappingURL=api.types.d.ts.map
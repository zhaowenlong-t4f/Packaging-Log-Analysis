export declare class ValidationError extends Error {
    errors: Array<{
        field: string;
        message: string;
    }>;
    constructor(errors: Array<{
        field: string;
        message: string;
    }>);
}
export declare class DatabaseError extends Error {
    constructor(message: string);
}
export declare class AppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode?: number);
}
export declare class FileProcessingError extends Error {
    constructor(message: string);
}
export declare class NetworkError extends Error {
    constructor(message: string);
}
//# sourceMappingURL=errors.d.ts.map
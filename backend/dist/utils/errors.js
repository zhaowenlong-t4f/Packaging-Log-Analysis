"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkError = exports.FileProcessingError = exports.DatabaseError = exports.ValidationError = void 0;
class ValidationError extends Error {
    constructor(errors) {
        super('Validation failed');
        this.name = 'ValidationError';
        this.errors = errors;
    }
}
exports.ValidationError = ValidationError;
class DatabaseError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DatabaseError';
    }
}
exports.DatabaseError = DatabaseError;
class FileProcessingError extends Error {
    constructor(message) {
        super(message);
        this.name = 'FileProcessingError';
    }
}
exports.FileProcessingError = FileProcessingError;
class NetworkError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NetworkError';
    }
}
exports.NetworkError = NetworkError;
//# sourceMappingURL=errors.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
function errorHandler(error, req, res, _next) {
    const traceId = req.headers['x-request-id'] || generateId();
    logger_1.logger.error('Unhandled error', {
        traceId,
        message: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent'],
        ip: req.ip
    });
    if (error instanceof errors_1.ValidationError) {
        return res.status(422).json({
            code: 422,
            message: 'Validation failed',
            data: { errors: error.errors },
            timestamp: new Date().toISOString(),
            traceId
        });
    }
    if (error.name === 'PrismaClientKnownRequestError') {
        const prismaError = error;
        if (prismaError.code === 'P2002') {
            return res.status(409).json({
                code: 409,
                message: 'Resource already exists',
                data: null,
                timestamp: new Date().toISOString(),
                traceId
            });
        }
    }
    return res.status(500).json({
        code: 500,
        message: 'Internal server error',
        data: null,
        timestamp: new Date().toISOString(),
        traceId
    });
}
function generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
//# sourceMappingURL=errorHandler.js.map
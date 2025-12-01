"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateContentType = validateContentType;
function validateContentType(req, res, next) {
    const contentType = req.headers['content-type'];
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        if (!contentType) {
            return res.status(400).json({
                code: 400,
                message: 'Content-Type header is required',
                data: null,
                timestamp: new Date().toISOString()
            });
        }
        const allowedTypes = [
            'application/json',
            'multipart/form-data',
            'application/x-www-form-urlencoded'
        ];
        const isAllowed = allowedTypes.some(type => contentType.includes(type));
        if (!isAllowed) {
            return res.status(415).json({
                code: 415,
                message: 'Unsupported Media Type',
                data: null,
                timestamp: new Date().toISOString()
            });
        }
    }
    next();
}
//# sourceMappingURL=validateContentType.js.map
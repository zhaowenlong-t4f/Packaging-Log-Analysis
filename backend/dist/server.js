"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const logger_1 = require("./utils/logger");
const PORT = parseInt(process.env['PORT'] || '3000', 10);
console.log('✅ 开始启动服务器...');
console.log(`PORT: ${PORT}`);
console.log(`NODE_ENV: ${process.env['NODE_ENV']}`);
const server = app_1.default.listen(PORT, '0.0.0.0', () => {
    logger_1.logger.info(`Server running on port ${PORT}`);
    logger_1.logger.info(`Environment: ${process.env['NODE_ENV']}`);
    logger_1.logger.info(`Database: ${process.env['DATABASE_URL']}`);
    console.log('✅ 服务器启动成功!');
});
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        logger_1.logger.info('Process terminated');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
        logger_1.logger.info('Process terminated');
        process.exit(0);
    });
});
process.on('uncaughtException', (err) => {
    logger_1.logger.error('Uncaught Exception:', { error: err.message, stack: err.stack });
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    logger_1.logger.error('Unhandled Rejection:', { reason });
    process.exit(1);
});
exports.default = server;
//# sourceMappingURL=server.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const isDev = (process.env['NODE_ENV'] || 'development') === 'development';
const prisma = new client_1.PrismaClient({
    log: isDev ? ['query', 'info'] : ['error'],
});
exports.default = prisma;
//# sourceMappingURL=database.js.map
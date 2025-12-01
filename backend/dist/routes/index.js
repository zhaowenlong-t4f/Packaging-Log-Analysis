"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const logs_1 = __importDefault(require("./logs"));
const rules_1 = __importDefault(require("./rules"));
const router = express_1.default.Router();
router.use('/logs', logs_1.default);
router.use('/rules', rules_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map
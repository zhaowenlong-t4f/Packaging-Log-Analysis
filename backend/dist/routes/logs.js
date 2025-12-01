"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const logController_1 = require("../controllers/logController");
const validate_1 = require("../middleware/validate");
const schemas_1 = require("../schemas");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({
    limits: {
        fileSize: parseInt(process.env['MAX_LOG_SIZE'] || '524288000')
    },
    dest: process.env['TEMP_DIR'] || './data/temp'
});
router.post('/analyze', upload.single('file'), (0, validate_1.validate)(schemas_1.analyzeLogSchema), logController_1.analyzeLog);
exports.default = router;
//# sourceMappingURL=logs.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const ruleController_1 = require("../controllers/ruleController");
const validate_1 = require("../middleware/validate");
const schemas_1 = require("../schemas");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});
router.get('/', (0, validate_1.validate)(schemas_1.ruleListQuerySchema, 'query'), ruleController_1.getRules);
router.get('/:ruleId', ruleController_1.getRuleById);
router.post('/', (0, validate_1.validate)(schemas_1.createRuleSchema), ruleController_1.createRule);
router.put('/:ruleId', (0, validate_1.validate)(schemas_1.updateRuleSchema), ruleController_1.updateRule);
router.delete('/:ruleId', ruleController_1.deleteRule);
router.post('/batch-delete', (0, validate_1.validate)(schemas_1.batchDeleteRulesSchema), ruleController_1.batchDeleteRules);
router.get('/export', ruleController_1.exportRules);
router.post('/import', upload.single('file'), ruleController_1.importRules);
router.get('/:ruleId/history', ruleController_1.getRuleHistory);
router.post('/:ruleId/rollback/:versionId', ruleController_1.rollbackRule);
router.post('/validate', (0, validate_1.validate)(schemas_1.validateRulesSchema), ruleController_1.validateRule);
router.get('/stats', ruleController_1.getRuleStats);
exports.default = router;
//# sourceMappingURL=rules.js.map
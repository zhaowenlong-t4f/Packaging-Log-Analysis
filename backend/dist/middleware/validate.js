"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const zod_1 = require("zod");
const errors_1 = require("../utils/errors");
function validate(schema, source = 'body') {
    return (req, res, next) => {
        try {
            let dataToValidate;
            switch (source) {
                case 'body':
                    dataToValidate = req.body;
                    break;
                case 'query':
                    dataToValidate = req.query;
                    break;
                case 'params':
                    dataToValidate = req.params;
                    break;
                default:
                    dataToValidate = req.body;
            }
            const validated = schema.parse(dataToValidate);
            switch (source) {
                case 'body':
                    req.body = validated;
                    break;
                case 'query':
                    req.query = validated;
                    break;
                case 'params':
                    req.params = validated;
                    break;
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const validationErrors = error.errors.map(e => ({
                    field: e.path.join('.'),
                    message: e.message
                }));
                const validationError = new errors_1.ValidationError(validationErrors);
                next(validationError);
            }
            else {
                next(error);
            }
        }
    };
}
//# sourceMappingURL=validate.js.map
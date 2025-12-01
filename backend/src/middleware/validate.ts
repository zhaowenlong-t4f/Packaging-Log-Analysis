import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      let dataToValidate: any;

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

      // 将验证后的数据放回原位置
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
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }));

        const validationError = new ValidationError(validationErrors);
        next(validationError);
      } else {
        next(error);
      }
    }
  };
}

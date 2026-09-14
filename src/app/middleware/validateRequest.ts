import { NextFunction, Request, Response } from 'express';
import { AnyZodObject } from 'zod';
import { AppError } from '@utils/AppError';

const validateRequest = (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const first = result.error.issues[0];
        if (!first) throw new AppError(400, 'Validation failed'); 
        const field = first.path.join('.');
        throw new AppError(400, `Validation failed${field ? ` for "${field}"` : ''}: ${first.message}`);
      }
      req.body = result.data; // parsed + coerced values (e.g. numbers) replace the raw body
      next();
    } catch (err) {
      next(err);
    }
  };

export default validateRequest;
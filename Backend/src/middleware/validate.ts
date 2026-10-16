import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { ExpressionSyntaxError } from '../errors/CalculatorError';

/** Validates (and sanitizes) req.body against a Zod schema; invalid input becomes a Syntax Error. */
export const validateBody =
  (schema: ZodType) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      next(new ExpressionSyntaxError(parsed.error.issues[0]?.message ?? 'Invalid request body'));
      return;
    }
    req.body = parsed.data;
    next();
  };

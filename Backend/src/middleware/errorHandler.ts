import type { NextFunction, Request, Response } from 'express';
import { CalculatorError } from '../errors/CalculatorError';

/** Errors thrown by express.json() (malformed JSON, payload too large...) carry a 4xx status and a type. */
function isBodyParserError(err: unknown): err is { status: number; type: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    'status' in err &&
    typeof err.status === 'number' &&
    err.status >= 400 &&
    err.status < 500
  );
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof CalculatorError) {
    res.status(err.statusCode).json({ error: err.label, message: err.message });
    return;
  }

  if (isBodyParserError(err)) {
    res.status(400).json({ error: 'Syntax Error', message: 'Invalid JSON body' });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
}

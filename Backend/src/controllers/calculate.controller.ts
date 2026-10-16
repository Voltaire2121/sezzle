import type { Request, Response } from 'express';
import type { CalculateRequest } from '../schemas/calculate.schema';
import { calculate } from '../services/calculator';

export function calculateHandler(req: Request<unknown, unknown, CalculateRequest>, res: Response): void {
  const result = calculate(req.body.expression);
  res.status(200).json({ result });
}

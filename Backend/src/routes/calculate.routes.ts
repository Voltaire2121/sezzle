import { Router } from 'express';
import { calculateHandler } from '../controllers/calculate.controller';
import { validateBody } from '../middleware/validate';
import { calculateRequestSchema } from '../schemas/calculate.schema';

export const calculateRouter = Router();

calculateRouter.post('/calculate', validateBody(calculateRequestSchema), calculateHandler);

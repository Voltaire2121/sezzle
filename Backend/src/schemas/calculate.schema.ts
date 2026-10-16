import { z } from 'zod';

export const MAX_EXPRESSION_LENGTH = 100;

// Whitelist: digits, dot, + - * / (and the display symbols × ÷), ^ power, % percent, √ square root, spaces.
const ALLOWED_CHARACTERS = /^[0-9.+\-*/×÷^%√ ]+$/;

export const calculateRequestSchema = z.strictObject({
  expression: z
    .string()
    .trim()
    .min(1, 'Expression is empty')
    .max(MAX_EXPRESSION_LENGTH, `Expression exceeds ${MAX_EXPRESSION_LENGTH} characters`)
    .regex(ALLOWED_CHARACTERS, 'Expression contains invalid characters'),
});

export type CalculateRequest = z.infer<typeof calculateRequestSchema>;

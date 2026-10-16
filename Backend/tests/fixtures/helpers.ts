export type ErrorLabel = 'Syntax Error' | 'Math Error';

export type ExpressionCase = {
  id: number;
  input: string;
  expected: { result: number } | { error: ErrorLabel };
  /** Rule enforced only by the HTTP validation layer (Zod), not by calculate() itself. */
  apiOnly?: boolean;
};

export const ok = (id: number, input: string, result: number): ExpressionCase => ({ id, input, expected: { result } });

export const syntax = (id: number, input: string, apiOnly = false): ExpressionCase => ({
  id,
  input,
  expected: { error: 'Syntax Error' },
  ...(apiOnly && { apiOnly }),
});

export const math = (id: number, input: string): ExpressionCase => ({ id, input, expected: { error: 'Math Error' } });

export const sortById = (cases: ExpressionCase[]): ExpressionCase[] => [...cases].sort((a, b) => a.id - b.id);

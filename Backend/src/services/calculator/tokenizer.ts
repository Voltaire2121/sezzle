import { ExpressionSyntaxError } from '../../errors/CalculatorError';

export type Operator = '+' | '-' | '*' | '/' | '^' | '%' | '√';

/** `position` is 1-based, counted in characters of the original expression. */
export type Token =
  | { type: 'number'; value: number; position: number }
  | { type: 'operator'; value: Operator; position: number };

const DISPLAY_OPERATORS: Partial<Record<string, Operator>> = { '×': '*', '÷': '/' };
const OPERATORS = new Set<string>(['+', '-', '*', '/', '^', '%', '√']);
const NUMBER_CHAR = /[0-9.]/;
// Digits with at most one dot and at least one digit: "12", "1.5", ".5", "5."
const VALID_NUMBER = /^(\d+\.?\d*|\.\d+)$/;

/** Splits an expression into number and operator tokens. Grammar is checked later by the parser. */
export function tokenize(expression: string): Token[] {
  const chars = [...expression];
  const tokens: Token[] = [];
  let i = 0;

  while (i < chars.length) {
    const char = DISPLAY_OPERATORS[chars[i]] ?? chars[i];
    const position = i + 1;

    if (char === ' ') {
      i++;
      continue;
    }

    if (NUMBER_CHAR.test(char)) {
      let literal = '';
      while (i < chars.length && NUMBER_CHAR.test(chars[i])) literal += chars[i++];
      if (!VALID_NUMBER.test(literal)) {
        throw new ExpressionSyntaxError(`Malformed number "${literal}" at position ${position}`);
      }
      tokens.push({ type: 'number', value: Number(literal), position });
      continue;
    }

    if (OPERATORS.has(char)) {
      tokens.push({ type: 'operator', value: char as Operator, position });
      i++;
      continue;
    }

    throw new ExpressionSyntaxError(`Invalid character "${chars[i]}" at position ${position}`);
  }

  return tokens;
}

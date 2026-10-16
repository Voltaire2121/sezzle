/** Same limit the backend enforces. */
export const MAX_INPUT_LENGTH = 100;

const BINARY_OPERATORS = new Set(['+', '-', '×', '÷', '^']);
const TRAILING_OPERATORS = /[+\-×÷^]+$/;
const TRAILING_NUMBER = /[\d.]*$/;
/** Characters that start a brand-new expression when typed right after a result or an error. */
const STARTS_NEW_INPUT = /^[\d.√]$/;

const isBinaryOperator = (char: string | undefined) => char !== undefined && BINARY_OPERATORS.has(char);
const trailingNumber = (input: string) => TRAILING_NUMBER.exec(input)?.[0] ?? '';

function appendOperator(input: string, operator: string): string {
  if (input === '') return operator === '-' ? '-' : input; // only a leading minus can start an expression

  const last = input.at(-1);
  if (!isBinaryOperator(last)) return input + operator;

  // Allow a unary minus right after ×, ÷ or ^ ("4×-2"); any other second operator replaces the previous one(s).
  if (operator === '-' && last !== '-' && last !== '+') return input + operator;
  const withoutOperators = input.replace(TRAILING_OPERATORS, '');
  if (withoutOperators === '') return operator === '-' ? '-' : '';
  return withoutOperators + operator;
}

function appendToNumber(input: string, character: string): string {
  const currentNumber = trailingNumber(input);

  if (character === '.') {
    if (currentNumber.includes('.')) return input;
    return input + (currentNumber === '' ? '0.' : '.');
  }
  // A lone "0" is replaced by the next digit ("0" → "7", "4+0" → "4+7").
  if (currentNumber === '0') return input.slice(0, -1) + character;
  return input + character;
}

/**
 * Returns the new input after typing `character`.
 * `startsFresh` is true right after a result or an error: digits, "." and "√" start a new expression,
 * while operators keep building on the previous value.
 */
export function appendCharacter(input: string, character: string, startsFresh = false): string {
  const base = startsFresh && STARTS_NEW_INPUT.test(character) ? '' : input;

  let next: string;
  if (isBinaryOperator(character)) next = appendOperator(base, character);
  else if (/^[\d.]$/.test(character)) next = appendToNumber(base, character);
  else if (character === '%') next = base === '' || isBinaryOperator(base.at(-1)) ? base : base + character;
  else next = base + character;

  return next.length > MAX_INPUT_LENGTH ? input : next;
}

export function deleteLast(input: string): string {
  return input.slice(0, -1);
}

/** Flips the sign of the last number: "8" ↔ "-8", "4+8" ↔ "4+-8", "4-8" → "4--8". */
export function toggleSign(input: string): string {
  const number = trailingNumber(input);
  const prefix = input.slice(0, input.length - number.length);
  const isNegated = prefix.endsWith('-') && (prefix.length === 1 || isBinaryOperator(prefix.at(-2)));

  const next = isNegated ? prefix.slice(0, -1) + number : `${prefix}-${number}`;
  return next.length > MAX_INPUT_LENGTH ? input : next;
}

export type ErrorLabel = 'Syntax Error' | 'Math Error';

/** Base class for every error caused by the user's expression (always a 400). */
export abstract class CalculatorError extends Error {
  readonly statusCode = 400;
  abstract readonly label: ErrorLabel;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** The expression cannot be parsed: invalid characters, misplaced operators, malformed numbers... */
export class ExpressionSyntaxError extends CalculatorError {
  readonly label = 'Syntax Error';
}

/** The expression is well formed but has no valid numeric result (e.g. division by zero). */
export class MathError extends CalculatorError {
  readonly label = 'Math Error';
}

import { MathError } from '../../errors/CalculatorError';
import type { Node } from './parser';

const SIGNIFICANT_DIGITS = 12;

/** Removes floating point noise (0.1 + 0.2 → 0.3) and normalizes -0 to 0. */
function roundResult(value: number): number {
  const rounded = Number(value.toPrecision(SIGNIFICANT_DIGITS));
  return rounded === 0 ? 0 : rounded;
}

function ensureFinite(value: number): number {
  if (!Number.isFinite(value)) throw new MathError('Result is out of range');
  return value;
}

/** iPhone-style percent: a bare (optionally negated) percent on the right of + or −. */
const isPercentOperand = (node: Node): boolean =>
  node.type === 'percent' || (node.type === 'negate' && node.operand.type === 'percent');

function evaluateBinary(node: Extract<Node, { type: 'binary' }>): number {
  const left = evaluateNode(node.left);

  // 200+10% → 200 + 200×10% = 220 ; 200-10% → 180
  if ((node.operator === '+' || node.operator === '-') && isPercentOperand(node.right)) {
    const share = left * evaluateNode(node.right);
    return node.operator === '+' ? left + share : left - share;
  }

  const right = evaluateNode(node.right);
  switch (node.operator) {
    case '+':
      return left + right;
    case '-':
      return left - right;
    case '*':
      return left * right;
    case '/':
      if (right === 0) throw new MathError('Division by zero');
      return left / right;
    case '^':
      if (left === 0 && right < 0) throw new MathError('Division by zero');
      return left ** right;
  }
}

function evaluateNode(node: Node): number {
  switch (node.type) {
    case 'number':
      return node.value;
    case 'percent':
      return node.value / 100;
    case 'negate':
      return -evaluateNode(node.operand);
    case 'sqrt': {
      const operand = evaluateNode(node.operand);
      if (operand < 0) throw new MathError('Square root of a negative number');
      return Math.sqrt(operand);
    }
    case 'binary':
      return ensureFinite(evaluateBinary(node));
  }
}

/** Evaluates a parsed expression; every intermediate result must be finite. */
export function evaluate(node: Node): number {
  return roundResult(ensureFinite(evaluateNode(node)));
}

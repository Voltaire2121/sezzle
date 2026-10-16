import { MathError } from '../src/errors/CalculatorError';
import { evaluate } from '../src/services/calculator/evaluator';
import type { Node } from '../src/services/calculator/parser';

const num = (value: number): Node => ({ type: 'number', value });
const pct = (value: number): Node => ({ type: 'percent', value });
const neg = (operand: Node): Node => ({ type: 'negate', operand });
const sqrt = (operand: Node): Node => ({ type: 'sqrt', operand });
const bin = (operator: '+' | '-' | '*' | '/' | '^', left: Node, right: Node): Node => ({
  type: 'binary',
  operator,
  left,
  right,
});

describe('evaluate', () => {
  it('evaluates numbers, negation, square roots and powers', () => {
    expect(evaluate(num(42))).toBe(42);
    expect(evaluate(neg(num(3)))).toBe(-3);
    expect(evaluate(sqrt(num(9)))).toBe(3);
    expect(evaluate(bin('^', num(2), num(10)))).toBe(1024);
  });

  describe('percent', () => {
    it('is value / 100 on its own or with × and ÷', () => {
      expect(evaluate(pct(50))).toBe(0.5);
      expect(evaluate(bin('*', num(200), pct(10)))).toBe(20);
      expect(evaluate(bin('/', num(200), pct(10)))).toBe(2000);
    });

    it('is a percent of the left side after + and −', () => {
      expect(evaluate(bin('+', num(200), pct(10)))).toBe(220);
      expect(evaluate(bin('-', num(200), pct(10)))).toBe(180);
      expect(evaluate(bin('+', num(200), neg(pct(10))))).toBe(180);
    });

    it('is a plain value / 100 when it is on the left of + or −', () => {
      expect(evaluate(bin('+', pct(10), num(5)))).toBe(5.1);
    });
  });

  describe('Math Error', () => {
    it.each<[string, Node]>([
      ['division by zero', bin('/', num(8), num(0))],
      ['zero to a negative power', bin('^', num(0), num(-1))],
      ['square root of a negative', sqrt(num(-4))],
      ['overflow', bin('^', num(10), num(400))],
      ['overflow of an intermediate result', bin('-', bin('*', num(1e308), num(10)), num(1e308))],
    ])('is thrown for %s', (_label, node) => {
      expect(() => evaluate(node)).toThrow(MathError);
    });
  });

  it('rounds to 12 significant digits and normalizes -0 to 0', () => {
    expect(evaluate(bin('+', num(0.1), num(0.2)))).toBe(0.3);
    expect(evaluate(sqrt(num(2)))).toBe(1.41421356237);
    expect(Object.is(evaluate(neg(num(0))), 0)).toBe(true);
  });

  it('allows underflow to 0', () => {
    expect(evaluate(bin('^', num(10), num(-400)))).toBe(0);
  });
});

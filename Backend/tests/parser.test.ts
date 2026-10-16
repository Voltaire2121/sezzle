import { ExpressionSyntaxError } from '../src/errors/CalculatorError';
import { parse, type Node } from '../src/services/calculator/parser';
import { tokenize } from '../src/services/calculator/tokenizer';

const parseExpression = (expression: string) => parse(tokenize(expression));

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

describe('parse', () => {
  it.each<[string, Node]>([
    ['4', num(4)],
    ['50%', pct(50)],
    ['2+3*4', bin('+', num(2), bin('*', num(3), num(4)))],
    ['10-4-3', bin('-', bin('-', num(10), num(4)), num(3))],
    ['8/2*4', bin('*', bin('/', num(8), num(2)), num(4))],
    ['2^3^2', bin('^', num(2), bin('^', num(3), num(2)))],
    ['2*3^2', bin('*', num(2), bin('^', num(3), num(2)))],
    ['-2^2', neg(bin('^', num(2), num(2)))],
    ['2^-2', bin('^', num(2), neg(num(2)))],
    ['4*-2', bin('*', num(4), neg(num(2)))],
    ['√√16', sqrt(sqrt(num(16)))],
    ['√-4', sqrt(neg(num(4)))],
    ['√4^3', bin('^', sqrt(num(4)), num(3))],
    ['√16%', sqrt(pct(16))],
    ['200+-10%', bin('+', num(200), neg(pct(10)))],
  ])('parses "%s" with the expected precedence and associativity', (expression, ast) => {
    expect(parseExpression(expression)).toEqual(ast);
  });

  it.each([
    ['', /Expression is incomplete/],
    ['4+', /Expression is incomplete/],
    ['√', /Expression is incomplete/],
    ['4 4', /Unexpected "4" at position 3/],
    ['4++4', /Unexpected "\+" at position 3/],
    ['--4', /Unexpected "-" at position 2/],
    ['2√9', /Unexpected "√" at position 2/],
    ['50%%', /Unexpected "%" at position 4/],
    ['^2', /Unexpected "\^" at position 1/],
  ])('rejects "%s" with a position-aware message', (expression, message) => {
    expect(() => parseExpression(expression)).toThrow(ExpressionSyntaxError);
    expect(() => parseExpression(expression)).toThrow(message);
  });
});

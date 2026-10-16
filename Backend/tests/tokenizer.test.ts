import { ExpressionSyntaxError } from '../src/errors/CalculatorError';
import { tokenize } from '../src/services/calculator/tokenizer';

describe('tokenize', () => {
  it('splits an expression into number and operator tokens with 1-based positions', () => {
    expect(tokenize('12+3.5')).toEqual([
      { type: 'number', value: 12, position: 1 },
      { type: 'operator', value: '+', position: 3 },
      { type: 'number', value: 3.5, position: 4 },
    ]);
  });

  it('normalizes display operators × and ÷', () => {
    expect(tokenize('6×7÷2').filter((t) => t.type === 'operator').map((t) => t.value)).toEqual(['*', '/']);
  });

  it('recognizes ^, % and √', () => {
    expect(tokenize('√16^2%').map((t) => t.value)).toEqual(['√', 16, '^', 2, '%']);
  });

  it('keeps unary minus as an operator token (the parser decides its meaning)', () => {
    expect(tokenize('-4').map((t) => t.value)).toEqual(['-', 4]);
  });

  it('ignores spaces but keeps original positions', () => {
    expect(tokenize(' 4 - 8 ')).toEqual([
      { type: 'number', value: 4, position: 2 },
      { type: 'operator', value: '-', position: 4 },
      { type: 'number', value: 8, position: 6 },
    ]);
  });

  it('returns no tokens for an empty expression', () => {
    expect(tokenize('   ')).toEqual([]);
  });

  it.each([
    ['1.2.3', /Malformed number "1\.2\.3" at position 1/],
    ['4+.', /Malformed number "\." at position 3/],
    ['4+a', /Invalid character "a" at position 3/],
    ['(4)', /Invalid character "\(" at position 1/],
  ])('rejects "%s" with a descriptive message', (input, message) => {
    expect(() => tokenize(input)).toThrow(ExpressionSyntaxError);
    expect(() => tokenize(input)).toThrow(message);
  });
});

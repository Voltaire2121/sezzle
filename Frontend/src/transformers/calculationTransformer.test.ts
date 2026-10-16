import { strings } from '../strings/strings';
import { formatResult, toCalculationResult } from './calculationTransformer';

describe('formatResult', () => {
  it.each([
    [8, '8'],
    [0, '0'],
    [-8, '-8'],
    [2.5, '2.5'],
    [0.333333333333, '0.333333333333'],
    [1234567.5, '1,234,567.5'],
    [-1000000, '-1,000,000'],
    [1e21, '1e+21'],
    [1.5e-12, '1.5e-12'],
  ])('formats %s as "%s"', (value, expected) => {
    expect(formatResult(value)).toBe(expected);
  });
});

describe('toCalculationResult', () => {
  it('maps a successful response', () => {
    expect(toCalculationResult({ ok: true, result: 1234 })).toEqual({
      kind: 'success',
      value: 1234,
      display: '1,234',
    });
  });

  it.each([
    ['Syntax Error from the backend', { status: 400, error: 'Syntax Error' }, strings.errors.syntax],
    ['Math Error from the backend', { status: 400, error: 'Math Error' }, strings.errors.math],
    ['an unknown 400 label', { status: 400, error: 'Something else' }, strings.errors.generic],
    ['a server error', { status: 500, error: 'Internal Server Error' }, strings.errors.generic],
    ['a network failure', { status: 0, error: 'Network Error' }, strings.errors.network],
  ])('maps %s', (_label, failure, display) => {
    expect(toCalculationResult({ ok: false, ...failure })).toEqual({ kind: 'error', display });
  });
});

import { calculate } from '../src/services/calculator';
import { CalculatorError } from '../src/errors/CalculatorError';
import { advancedCases } from './fixtures/advancedExpressions';
import { allCases } from './fixtures/expressions';
import type { ExpressionCase } from './fixtures/helpers';

const idsFrom1To = (count: number) => Array.from({ length: count }, (_, i) => i + 1);

function expectCalculation({ input, expected }: ExpressionCase) {
  if ('result' in expected) {
    expect(calculate(input)).toBe(expected.result);
    return;
  }

  let thrown: unknown;
  try {
    calculate(input);
  } catch (err) {
    thrown = err;
  }
  expect(thrown).toBeInstanceOf(CalculatorError);
  expect((thrown as CalculatorError).label).toBe(expected.error);
}

describe('fixture integrity', () => {
  it('phase 1 contains cases 1..97 exactly once', () => {
    expect(allCases.map((c) => c.id)).toEqual(idsFrom1To(97));
  });

  it('advanced phase contains cases 1..100 exactly once', () => {
    expect(advancedCases.map((c) => c.id)).toEqual(idsFrom1To(100));
  });
});

describe('calculate() against the phase-1 expression fixtures', () => {
  it.each(allCases.filter((c) => !c.apiOnly))('#$id "$input"', expectCalculation);
});

describe('calculate() against the advanced expression fixtures', () => {
  it.each(advancedCases.filter((c) => !c.apiOnly))('#$id "$input"', expectCalculation);
});

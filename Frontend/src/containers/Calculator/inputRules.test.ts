import { appendCharacter, deleteLast, MAX_INPUT_LENGTH, toggleSign } from './inputRules';

describe('appendCharacter', () => {
  it.each([
    // [input, character, expected]
    ['', '4', '4'],
    ['4', '+', '4+'],
    ['4+', '4', '4+4'],
    // leading zeros
    ['0', '7', '7'],
    ['4+0', '7', '4+7'],
    ['10', '0', '100'],
    // decimal point
    ['', '.', '0.'],
    ['4+', '.', '4+0.'],
    ['1.5', '.', '1.5'],
    ['1.5+2', '.', '1.5+2.'],
    // operators
    ['', '+', ''],
    ['', '×', ''],
    ['', '-', '-'],
    ['4+', '×', '4×'],
    ['4×', '-', '4×-'],
    ['4÷', '-', '4÷-'],
    ['4^', '-', '4^-'],
    ['4+', '-', '4-'],
    ['4-', '-', '4-'],
    ['4×-', '+', '4+'],
    ['-', '+', ''],
    ['-', '-', '-'],
    // percent, square root and power
    ['50', '%', '50%'],
    ['', '%', ''],
    ['4+', '%', '4+'],
    ['', '√', '√'],
    ['2', '^', '2^'],
  ])('"%s" + "%s" → "%s"', (input, character, expected) => {
    expect(appendCharacter(input, character)).toBe(expected);
  });

  describe('right after a result or an error (startsFresh)', () => {
    it.each([
      ['8', '5', '5'],
      ['8', '.', '0.'],
      ['8', '√', '√'],
      ['8', '+', '8+'],
      ['8', '%', '8%'],
    ])('"%s" + "%s" → "%s"', (input, character, expected) => {
      expect(appendCharacter(input, character, true)).toBe(expected);
    });
  });

  it(`stops accepting characters at ${MAX_INPUT_LENGTH} characters`, () => {
    const full = '1'.repeat(MAX_INPUT_LENGTH);
    expect(appendCharacter(full, '2')).toBe(full);
  });
});

describe('deleteLast', () => {
  it.each([
    ['4+4', '4+'],
    ['4', ''],
    ['', ''],
  ])('"%s" → "%s"', (input, expected) => {
    expect(deleteLast(input)).toBe(expected);
  });
});

describe('toggleSign', () => {
  it.each([
    ['8', '-8'],
    ['-8', '8'],
    ['4+8', '4+-8'],
    ['4+-8', '4+8'],
    ['4-8', '4--8'],
    ['4--8', '4-8'],
    ['4×2.5', '4×-2.5'],
    ['', '-'],
    ['4+', '4+-'],
  ])('"%s" → "%s"', (input, expected) => {
    expect(toggleSign(input)).toBe(expected);
  });

  it(`does not grow past ${MAX_INPUT_LENGTH} characters`, () => {
    const full = '1'.repeat(MAX_INPUT_LENGTH);
    expect(toggleSign(full)).toBe(full);
  });
});

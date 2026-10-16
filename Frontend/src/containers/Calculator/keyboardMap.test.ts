import { getKeyFromKeyboard } from './keyboardMap';

describe('getKeyFromKeyboard', () => {
  it.each(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])('maps digit %s', (digit) => {
    expect(getKeyFromKeyboard(digit)).toMatchObject({ id: digit, action: 'append', character: digit });
  });

  it.each([
    ['.', 'decimal', '.'],
    ['+', 'add', '+'],
    ['-', 'subtract', '-'],
    ['*', 'multiply', '×'],
    ['/', 'divide', '÷'],
    ['^', 'power', '^'],
    ['%', 'percent', '%'],
    ['s', 'sqrt', '√'],
    ['S', 'sqrt', '√'],
  ])('maps "%s" to the %s key (inserts "%s")', (keyboardKey, id, character) => {
    expect(getKeyFromKeyboard(keyboardKey)).toMatchObject({ id, character, action: 'append' });
  });

  it.each([
    ['Enter', 'evaluate'],
    ['=', 'evaluate'],
    ['Backspace', 'delete'],
    ['Escape', 'clear'],
  ])('maps "%s" to the %s action', (keyboardKey, action) => {
    expect(getKeyFromKeyboard(keyboardKey)).toMatchObject({ action });
  });

  it.each(['a', 'x', 'Tab', ' ', 'constructor', 'ArrowUp'])('ignores "%s"', (keyboardKey) => {
    expect(getKeyFromKeyboard(keyboardKey)).toBeUndefined();
  });
});

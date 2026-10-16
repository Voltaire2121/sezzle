import type { KeypadKey } from '../../types/calculator';
import { keypadKeysById } from './keypadLayout';

/** KeyboardEvent.key → keypad key id. A Map avoids matching prototype keys such as "constructor". */
const KEYBOARD_TO_KEY_ID = new Map<string, string>([
  ...['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit): [string, string] => [digit, digit]),
  ['.', 'decimal'],
  ['+', 'add'],
  ['-', 'subtract'],
  ['*', 'multiply'],
  ['/', 'divide'],
  ['^', 'power'],
  ['%', 'percent'],
  ['s', 'sqrt'],
  ['S', 'sqrt'],
  ['Enter', 'equals'],
  ['=', 'equals'],
  ['Backspace', 'delete'],
  ['Escape', 'clear'],
]);

export function getKeyFromKeyboard(key: string): KeypadKey | undefined {
  const id = KEYBOARD_TO_KEY_ID.get(key);
  return id === undefined ? undefined : keypadKeysById.get(id);
}

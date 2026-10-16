import { BackspaceIcon } from '../../components/icons/icons';
import { strings } from '../../strings/strings';
import type { KeypadKey } from '../../types/calculator';

const digit = (value: string, extra: Partial<KeypadKey> = {}): KeypadKey => ({
  id: value,
  icon: value,
  character: value,
  action: 'append',
  variant: 'digit',
  ...extra,
});

/** Keys in grid order (4 columns). "=" spans two rows and "0" spans two columns. */
export const keypadLayout: KeypadKey[] = [
  { id: 'clear', icon: strings.keys.clear, character: '', action: 'clear', variant: 'function', ariaLabel: strings.keys.clearAriaLabel },
  { id: 'delete', icon: <BackspaceIcon />, character: '', action: 'delete', variant: 'function', ariaLabel: strings.keys.deleteAriaLabel },
  { id: 'percent', icon: '%', character: '%', action: 'append', variant: 'function', ariaLabel: strings.keys.percentAriaLabel },
  { id: 'divide', icon: '÷', character: '÷', action: 'append', variant: 'operator', ariaLabel: strings.keys.divideAriaLabel },

  { id: 'sqrt', icon: '√', character: '√', action: 'append', variant: 'function', ariaLabel: strings.keys.squareRootAriaLabel },
  {
    id: 'power',
    icon: (
      <span>
        x<sup className="text-base">y</sup>
      </span>
    ),
    character: '^',
    action: 'append',
    variant: 'function',
    ariaLabel: strings.keys.powerAriaLabel,
  },
  { id: 'toggleSign', icon: '±', character: '', action: 'toggleSign', variant: 'function', ariaLabel: strings.keys.toggleSignAriaLabel },
  { id: 'multiply', icon: '×', character: '×', action: 'append', variant: 'operator', ariaLabel: strings.keys.multiplyAriaLabel },

  digit('7'),
  digit('8'),
  digit('9'),
  { id: 'subtract', icon: '−', character: '-', action: 'append', variant: 'operator', ariaLabel: strings.keys.subtractAriaLabel },

  digit('4'),
  digit('5'),
  digit('6'),
  { id: 'add', icon: '+', character: '+', action: 'append', variant: 'operator', ariaLabel: strings.keys.addAriaLabel },

  digit('1'),
  digit('2'),
  digit('3'),
  { id: 'equals', icon: '=', character: '', action: 'evaluate', variant: 'operator', ariaLabel: strings.keys.equalsAriaLabel, tall: true },

  digit('0', { wide: true }),
  digit('.', { id: 'decimal', ariaLabel: strings.keys.decimalAriaLabel }),
];

export const keypadKeysById = new Map(keypadLayout.map((key) => [key.id, key]));

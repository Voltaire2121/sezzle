import type { ReactNode } from 'react';

/** UI-ready outcome of an evaluation, produced by the transformers layer. */
export type CalculationResult =
  | { kind: 'success'; value: number; display: string }
  | { kind: 'error'; display: string };

/** One evaluated expression: what the user typed and what the backend answered. */
export type HistoryEntry = {
  inputString: string;
  response: CalculationResult;
};

export type ButtonVariant = 'digit' | 'function' | 'operator';

export type KeyAction = 'append' | 'clear' | 'delete' | 'toggleSign' | 'evaluate';

export type KeypadKey = {
  id: string;
  /** What the button shows. */
  icon: ReactNode;
  /** What the button adds to the input string (for 'append' keys). */
  character: string;
  action: KeyAction;
  variant: ButtonVariant;
  ariaLabel?: string;
  wide?: boolean;
  tall?: boolean;
};

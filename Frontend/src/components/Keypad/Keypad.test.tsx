import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { keypadLayout } from '../../containers/Calculator/keypadLayout';
import type { KeypadKey } from '../../types/calculator';
import { Keypad } from './Keypad';

const keys: KeypadKey[] = [
  { id: '7', icon: '7', character: '7', action: 'append', variant: 'digit' },
  { id: 'add', icon: '+', character: '+', action: 'append', variant: 'operator', ariaLabel: 'Add' },
];

describe('Keypad', () => {
  it('renders one button per key', () => {
    render(<Keypad keys={keys} onKeyPress={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('renders the 22 keys of the calculator layout', () => {
    render(<Keypad keys={keypadLayout} onKeyPress={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(22);
  });

  it('passes the pressed key to onKeyPress', async () => {
    const onKeyPress = vi.fn();
    render(<Keypad keys={keys} onKeyPress={onKeyPress} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(onKeyPress).toHaveBeenCalledExactlyOnceWith(keys[1]);
  });

  it('disables every key when disabled', () => {
    render(<Keypad keys={keys} onKeyPress={vi.fn()} disabled />);
    screen.getAllByRole('button').forEach((button) => expect(button).toBeDisabled());
  });
});

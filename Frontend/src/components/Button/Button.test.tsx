import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders the icon and uses the character as accessible name by default', () => {
    render(<Button icon="7" character="7" onPress={vi.fn()} />);
    expect(screen.getByRole('button', { name: '7' })).toHaveTextContent('7');
  });

  it('renders a ReactNode icon and a custom aria-label', () => {
    render(<Button icon={<span data-testid="icon">−</span>} character="-" ariaLabel="Subtract" onPress={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Subtract' })).toContainElement(screen.getByTestId('icon'));
  });

  it('calls onPress with its character when clicked', async () => {
    const onPress = vi.fn();
    render(<Button icon="−" character="-" ariaLabel="Subtract" onPress={onPress} />);

    await userEvent.click(screen.getByRole('button', { name: 'Subtract' }));

    expect(onPress).toHaveBeenCalledExactlyOnceWith('-');
  });

  it.each([
    ['digit', 'bg-[#333333]'],
    ['function', 'bg-[#5c5c5f]'],
    ['operator', 'bg-[#ff9f0a]'],
  ] as const)('applies the %s variant colors', (variant, className) => {
    render(<Button icon="x" character="x" variant={variant} onPress={vi.fn()} />);
    expect(screen.getByRole('button')).toHaveClass(className);
  });

  it('spans two columns when wide and two rows when tall', () => {
    render(
      <>
        <Button icon="0" character="0" wide onPress={vi.fn()} />
        <Button icon="=" character="=" tall onPress={vi.fn()} />
      </>,
    );
    expect(screen.getByRole('button', { name: '0' })).toHaveClass('col-span-2');
    expect(screen.getByRole('button', { name: '=' })).toHaveClass('row-span-2');
  });

  it('does not call onPress when disabled', async () => {
    const onPress = vi.fn();
    render(<Button icon="7" character="7" disabled onPress={onPress} />);

    await userEvent.click(screen.getByRole('button', { name: '7' }));

    expect(screen.getByRole('button', { name: '7' })).toBeDisabled();
    expect(onPress).not.toHaveBeenCalled();
  });
});

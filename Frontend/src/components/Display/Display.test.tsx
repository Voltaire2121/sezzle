import { render, screen } from '@testing-library/react';
import { Display } from './Display';

describe('Display', () => {
  it('shows 0 when the value is empty', () => {
    render(<Display value="" />);
    expect(screen.getByRole('status', { name: 'Calculator display' })).toHaveTextContent(/^0$/);
  });

  it('shows the value', () => {
    render(<Display value="12×3" />);
    expect(screen.getByRole('status')).toHaveTextContent('12×3');
  });

  it('highlights errors', () => {
    render(<Display value="Math Error" isError />);
    expect(screen.getByRole('status')).toHaveTextContent('Math Error');
    expect(screen.getByRole('status')).toHaveClass('text-[#ff9f0a]');
  });

  it.each([
    ['1234567', 'text-7xl'],
    ['1234567890', 'text-5xl'],
    ['1234567890+12345', 'text-4xl'],
    ['1234567890+1234567890', 'text-2xl'],
  ])('shrinks the font for "%s"', (value, className) => {
    render(<Display value={value} />);
    expect(screen.getByRole('status')).toHaveClass(className);
  });
});

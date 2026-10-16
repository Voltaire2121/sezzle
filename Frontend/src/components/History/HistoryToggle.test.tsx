import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistoryToggle } from './HistoryToggle';

describe('HistoryToggle', () => {
  it('offers to show the history when closed', () => {
    render(<HistoryToggle isOpen={false} onToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Show history' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('offers to hide the history when open', () => {
    render(<HistoryToggle isOpen onToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Hide history' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('calls onToggle when clicked', async () => {
    const onToggle = vi.fn();
    render(<HistoryToggle isOpen={false} onToggle={onToggle} />);

    await userEvent.click(screen.getByRole('button'));

    expect(onToggle).toHaveBeenCalledOnce();
  });
});

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { HistoryEntry } from '../../types/calculator';
import { HistoryPanel } from './HistoryPanel';

const entries: HistoryEntry[] = [
  { inputString: '8/0', response: { kind: 'error', display: 'Math Error' } },
  { inputString: '1000*2', response: { kind: 'success', value: 2000, display: '2,000' } },
];

describe('HistoryPanel', () => {
  it('shows the empty state and a disabled Clear button when there is no history', () => {
    render(<HistoryPanel entries={[]} onSelectEntry={vi.fn()} onClear={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'History' })).toBeInTheDocument();
    expect(screen.getByText('No calculations yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear history' })).toBeDisabled();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('lists every entry with its expression and result', () => {
    render(<HistoryPanel entries={entries} onSelectEntry={vi.fn()} onClear={vi.fn()} />);

    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('8/0');
    expect(items[0]).toHaveTextContent('Math Error');
    expect(items[1]).toHaveTextContent('1000*2');
    expect(items[1]).toHaveTextContent('2,000');
    expect(screen.getByText('Tap a result to reuse it')).toBeInTheDocument();
  });

  it('calls onSelectEntry when a successful entry is clicked', async () => {
    const onSelectEntry = vi.fn();
    render(<HistoryPanel entries={entries} onSelectEntry={onSelectEntry} onClear={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /1000\*2/ }));

    expect(onSelectEntry).toHaveBeenCalledExactlyOnceWith(entries[1]);
  });

  it('does not allow selecting an entry that failed', async () => {
    const onSelectEntry = vi.fn();
    render(<HistoryPanel entries={entries} onSelectEntry={onSelectEntry} onClear={vi.fn()} />);

    const errorEntry = screen.getByRole('button', { name: /8\/0/ });
    await userEvent.click(errorEntry);

    expect(errorEntry).toBeDisabled();
    expect(onSelectEntry).not.toHaveBeenCalled();
  });

  it('calls onClear when Clear is clicked', async () => {
    const onClear = vi.fn();
    render(<HistoryPanel entries={entries} onSelectEntry={vi.fn()} onClear={onClear} />);

    await userEvent.click(screen.getByRole('button', { name: 'Clear history' }));

    expect(onClear).toHaveBeenCalledOnce();
  });
});

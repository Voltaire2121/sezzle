import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { calculateExpression, type ApiCalculateResponse } from '../../api/calculatorApi';
import { CalculatorContainer } from './CalculatorContainer';

vi.mock('../../api/calculatorApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/calculatorApi')>()),
  calculateExpression: vi.fn(),
}));

const calculateMock = vi.mocked(calculateExpression);

const display = () => screen.getByRole('status', { name: 'Calculator display' });
const historyList = () => within(screen.getByRole('region', { name: 'History' }));

function setup() {
  const user = userEvent.setup();
  const utils = render(<CalculatorContainer />);
  const press = async (...names: string[]) => {
    for (const name of names) await user.click(screen.getByRole('button', { name }));
  };
  return { user, press, ...utils };
}

describe('CalculatorContainer', () => {
  beforeEach(() => {
    calculateMock.mockReset();
  });

  it('starts with 0 and an empty history', () => {
    setup();
    expect(display()).toHaveTextContent(/^0$/);
    expect(historyList().getByText('No calculations yet')).toBeInTheDocument();
  });

  it('evaluates 4 + 4 = through the API and records it in the history', async () => {
    calculateMock.mockResolvedValue({ ok: true, result: 8 });
    const { press } = setup();

    await press('4', 'Add', '4');
    expect(display()).toHaveTextContent('4+4');

    await press('Equals');

    expect(calculateMock).toHaveBeenCalledExactlyOnceWith('4+4');
    await waitFor(() => expect(display()).toHaveTextContent(/^8$/));
    const item = historyList().getByRole('listitem');
    expect(item).toHaveTextContent('4+4');
    expect(item).toHaveTextContent('8');
  });

  it('shows the formatted result (digit grouping)', async () => {
    calculateMock.mockResolvedValue({ ok: true, result: 1000000 });
    const { press } = setup();

    await press('1', '0', '0', '0', 'Multiply', '1', '0', '0', '0', 'Equals');

    await waitFor(() => expect(display()).toHaveTextContent('1,000,000'));
  });

  it.each([
    [{ ok: false, status: 400, error: 'Syntax Error' }, 'Syntax Error'],
    [{ ok: false, status: 400, error: 'Math Error' }, 'Math Error'],
    [{ ok: false, status: 500, error: 'Internal Server Error' }, 'Error'],
    [{ ok: false, status: 0, error: 'Network Error' }, 'No connection'],
  ] satisfies [ApiCalculateResponse, string][])('shows "%s" errors as %s', async (apiResponse, label) => {
    calculateMock.mockResolvedValue(apiResponse);
    const { press } = setup();

    await press('8', 'Divide', '0', 'Equals');

    await waitFor(() => expect(display()).toHaveTextContent(label));
    expect(historyList().getByRole('listitem')).toHaveTextContent(`8÷0${label}`);
  });

  it('starts a new input when typing a digit after an error', async () => {
    calculateMock.mockResolvedValue({ ok: false, status: 400, error: 'Math Error' });
    const { press } = setup();

    await press('8', 'Divide', '0', 'Equals');
    await waitFor(() => expect(display()).toHaveTextContent('Math Error'));
    await press('5');

    expect(display()).toHaveTextContent(/^5$/);
  });

  it('starts a new input with a digit, or continues with an operator, after a result', async () => {
    calculateMock.mockResolvedValue({ ok: true, result: 8 });
    const { press } = setup();

    await press('4', 'Add', '4', 'Equals');
    await waitFor(() => expect(display()).toHaveTextContent(/^8$/));
    await press('Multiply', '2');
    expect(display()).toHaveTextContent('8×2');

    await press('Equals');
    await waitFor(() => expect(display()).toHaveTextContent(/^8$/));
    await press('3');
    expect(display()).toHaveTextContent(/^3$/);
  });

  it('ignores "=" when the input is empty or a result is already shown', async () => {
    calculateMock.mockResolvedValue({ ok: true, result: 8 });
    const { press } = setup();

    await press('Equals');
    expect(calculateMock).not.toHaveBeenCalled();

    await press('4', 'Add', '4', 'Equals');
    await waitFor(() => expect(display()).toHaveTextContent(/^8$/));
    await press('Equals');
    expect(calculateMock).toHaveBeenCalledOnce();
  });

  it('AC clears the input, ⌫ deletes the last character and ± toggles the sign', async () => {
    const { press } = setup();

    await press('1', '2', 'Add', '3');
    await press('Delete');
    expect(display()).toHaveTextContent('12+');

    await press('5', 'Toggle sign');
    expect(display()).toHaveTextContent('12+-5');
    await press('Toggle sign');
    expect(display()).toHaveTextContent('12+5');

    await press('All clear');
    expect(display()).toHaveTextContent(/^0$/);
  });

  it('clears an error with ⌫ and ±', async () => {
    calculateMock.mockResolvedValue({ ok: false, status: 400, error: 'Syntax Error' });
    const { press } = setup();

    await press('Square root', 'Equals');
    await waitFor(() => expect(display()).toHaveTextContent('Syntax Error'));
    await press('Delete');
    expect(display()).toHaveTextContent(/^0$/);

    await press('Square root', 'Equals');
    await waitFor(() => expect(display()).toHaveTextContent('Syntax Error'));
    await press('Toggle sign');
    expect(display()).toHaveTextContent(/^-$/);
  });

  it('disables the keypad while a request is running', async () => {
    let resolveRequest!: (value: ApiCalculateResponse) => void;
    calculateMock.mockReturnValue(new Promise((resolve) => (resolveRequest = resolve)));
    const { press } = setup();

    await press('4', 'Add', '4', 'Equals');

    expect(screen.getByRole('button', { name: 'Equals' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '7' })).toBeDisabled();

    resolveRequest({ ok: true, result: 8 });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Equals' })).toBeEnabled());
  });

  it('reuses a history result when it is clicked, and clears the history', async () => {
    calculateMock.mockResolvedValue({ ok: true, result: 8 });
    const { press, user } = setup();

    await press('4', 'Add', '4', 'Equals');
    await waitFor(() => expect(display()).toHaveTextContent(/^8$/));
    await press('All clear');

    await user.click(historyList().getByRole('button', { name: /4\+4/ }));
    expect(display()).toHaveTextContent(/^8$/);
    await press('Add', '1');
    expect(display()).toHaveTextContent('8+1');

    await press('Clear history');
    expect(historyList().getByText('No calculations yet')).toBeInTheDocument();
  });

  it('opens and closes the mobile history panel with the clock button', async () => {
    const { press } = setup();
    const panel = document.getElementById('history-panel');

    expect(panel).toHaveClass('hidden');
    await press('Show history');
    expect(screen.getByRole('button', { name: 'Hide history' })).toHaveAttribute('aria-expanded', 'true');
    expect(panel).not.toHaveClass('hidden');

    await press('Hide history');
    expect(panel).toHaveClass('hidden');
  });

  describe('keyboard input', () => {
    it('evaluates an expression typed on the keyboard with Enter', async () => {
      calculateMock.mockResolvedValue({ ok: true, result: 8 });
      const { user } = setup();

      await user.keyboard('4+4{Enter}');

      expect(calculateMock).toHaveBeenCalledExactlyOnceWith('4+4');
      await waitFor(() => expect(display()).toHaveTextContent(/^8$/));
    });

    it('maps * and / to × and ÷, ^ and % to themselves', async () => {
      const { user } = setup();
      await user.keyboard('6*2/3^2%');
      expect(display()).toHaveTextContent('6×2÷3^2%');
    });

    it('uses s and S for the square root', async () => {
      const { user } = setup();
      await user.keyboard('s9+S4');
      expect(display()).toHaveTextContent('√9+√4');
    });

    it('supports = to evaluate, Backspace to delete and Escape to clear', async () => {
      calculateMock.mockResolvedValue({ ok: true, result: 36 });
      const { user } = setup();

      await user.keyboard('12*35{Backspace}');
      expect(display()).toHaveTextContent('12×3');
      await user.keyboard('=');
      await waitFor(() => expect(display()).toHaveTextContent(/^36$/));

      await user.keyboard('7{Escape}');
      expect(display()).toHaveTextContent(/^0$/);
    });

    it('ignores unmapped keys and shortcuts with modifiers', async () => {
      const { user } = setup();

      await user.keyboard('1ax{Tab}');
      await user.keyboard('{Control>}2{/Control}{Meta>}3{/Meta}{Alt>}4{/Alt}');

      expect(display()).toHaveTextContent(/^1$/);
    });

    it('stops listening to the keyboard after unmounting', async () => {
      const removeSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = setup();

      unmount();

      expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      removeSpy.mockRestore();
    });
  });
});

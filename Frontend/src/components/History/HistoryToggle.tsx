import { strings } from '../../strings/strings';
import { ClockIcon } from '../icons/icons';

type HistoryToggleProps = {
  isOpen: boolean;
  onToggle: () => void;
};

export function HistoryToggle({ isOpen, onToggle }: HistoryToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls="history-panel"
      aria-label={isOpen ? strings.history.hide : strings.history.show}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors ${isOpen ? 'bg-[#ff9f0a]' : 'bg-[#1c1c1e] hover:bg-[#2c2c2e]'}`}
    >
      <ClockIcon className="h-4 w-4" />
    </button>
  );
}

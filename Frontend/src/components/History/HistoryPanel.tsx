import { strings } from '../../strings/strings';
import type { HistoryEntry } from '../../types/calculator';
import { ClockIcon } from '../icons/icons';
import { HistoryItem } from './HistoryItem';

type HistoryPanelProps = {
  entries: HistoryEntry[];
  onSelectEntry: (entry: HistoryEntry) => void;
  onClear: () => void;
};

export function HistoryPanel({ entries, onSelectEntry, onClear }: HistoryPanelProps) {
  return (
    <section
      aria-labelledby="history-title"
      className="flex h-full w-full flex-col rounded-3xl border border-neutral-800 bg-[#1c1c1e] p-4"
    >
      <header className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <h2 id="history-title" className="flex items-center gap-2 text-sm font-semibold text-white">
          <ClockIcon className="h-4 w-4 text-neutral-400" />
          {strings.history.title}
        </h2>
        <button
          type="button"
          onClick={onClear}
          disabled={entries.length === 0}
          aria-label={strings.history.clearAriaLabel}
          className="text-sm text-[#ff9f0a] hover:text-[#ffb340] disabled:opacity-40"
        >
          {strings.history.clear}
        </button>
      </header>

      {entries.length === 0 ? (
        <p className="mt-10 text-center text-sm text-neutral-500">{strings.history.empty}</p>
      ) : (
        <ul className="mt-2 flex-1 space-y-1 overflow-y-auto">
          {entries.map((entry, index) => (
            <HistoryItem
              key={`${entries.length - index}-${entry.inputString}`}
              inputString={entry.inputString}
              resultDisplay={entry.response.display}
              isError={entry.response.kind === 'error'}
              onSelect={() => onSelectEntry(entry)}
            />
          ))}
        </ul>
      )}

      <p className="mt-auto pt-3 text-center text-xs text-[#ff9f0a]/80">{strings.history.hint}</p>
    </section>
  );
}

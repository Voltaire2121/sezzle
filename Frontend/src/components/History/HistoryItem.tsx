type HistoryItemProps = {
  inputString: string;
  resultDisplay: string;
  isError: boolean;
  onSelect: () => void;
};

export function HistoryItem({ inputString, resultDisplay, isError, onSelect }: HistoryItemProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        disabled={isError}
        className="w-full rounded-xl px-3 py-2 text-right transition-colors enabled:hover:bg-white/5 disabled:cursor-default"
      >
        <span className="block break-all text-sm text-neutral-400">{inputString}</span>
        <span className={`block break-all text-xl ${isError ? 'text-[#ff9f0a]' : 'text-white'}`}>
          {resultDisplay}
        </span>
      </button>
    </li>
  );
}

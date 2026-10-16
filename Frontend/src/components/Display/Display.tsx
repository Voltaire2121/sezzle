import { strings } from '../../strings/strings';

type DisplayProps = {
  value: string;
  isError?: boolean;
};

/** Shrinks the font as the content grows, like the iPhone display. */
function sizeClassFor(length: number): string {
  if (length <= 7) return 'text-7xl';
  if (length <= 10) return 'text-5xl';
  if (length <= 16) return 'text-4xl';
  return 'text-2xl';
}

export function Display({ value, isError = false }: DisplayProps) {
  const content = value === '' ? strings.display.empty : value;

  return (
    <output
      role="status"
      aria-label={strings.display.ariaLabel}
      aria-live="polite"
      className={`block w-full break-all text-right font-light leading-tight tracking-tight ${sizeClassFor(content.length)} ${isError ? 'text-[#ff9f0a]' : 'text-white'}`}
    >
      {content}
    </output>
  );
}

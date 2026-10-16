import type { ReactNode } from 'react';
import type { ButtonVariant } from '../../types/calculator';

type ButtonProps = {
  /** What is drawn on the button. */
  icon: ReactNode;
  /** What the button hands back to its owner when pressed. */
  character: string;
  onPress: (character: string) => void;
  variant?: ButtonVariant;
  ariaLabel?: string;
  wide?: boolean;
  tall?: boolean;
  disabled?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  digit: 'bg-[#333333] text-white hover:bg-[#414141] active:bg-[#737373]',
  function: 'bg-[#5c5c5f] text-white hover:bg-[#6c6c70] active:bg-[#a5a5a5]',
  operator: 'bg-[#ff9f0a] text-white hover:bg-[#ffb340] active:bg-[#fcc78d]',
};

export function Button({
  icon,
  character,
  onPress,
  variant = 'digit',
  ariaLabel,
  wide = false,
  tall = false,
  disabled = false,
}: ButtonProps) {
  const shape = wide ? 'col-span-2 justify-start pl-[1.6em]' : tall ? 'row-span-2 justify-center' : 'aspect-square justify-center';

  return (
    <button
      type="button"
      aria-label={ariaLabel ?? character}
      disabled={disabled}
      onClick={() => onPress(character)}
      className={`flex select-none items-center rounded-full text-2xl font-normal transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60 sm:text-3xl ${shape} ${variantClasses[variant]}`}
    >
      {icon}
    </button>
  );
}

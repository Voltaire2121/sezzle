import type { KeypadKey } from '../../types/calculator';
import { Button } from '../Button/Button';

type KeypadProps = {
  keys: KeypadKey[];
  onKeyPress: (key: KeypadKey) => void;
  disabled?: boolean;
};

export function Keypad({ keys, onKeyPress, disabled = false }: KeypadProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {keys.map((key) => (
        <Button
          key={key.id}
          icon={key.icon}
          character={key.character}
          variant={key.variant}
          ariaLabel={key.ariaLabel}
          wide={key.wide}
          tall={key.tall}
          disabled={disabled}
          onPress={() => onKeyPress(key)}
        />
      ))}
    </div>
  );
}

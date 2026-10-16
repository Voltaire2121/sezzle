import { useEffect, useState } from "react";
import { calculateExpression } from "../../api/calculatorApi";
import { Display } from "../../components/Display/Display";
import { HistoryPanel } from "../../components/History/HistoryPanel";
import { HistoryToggle } from "../../components/History/HistoryToggle";
import { Keypad } from "../../components/Keypad/Keypad";
import { strings } from "../../strings/strings";
import { toCalculationResult } from "../../transformers/calculationTransformer";
import type { HistoryEntry, KeypadKey } from "../../types/calculator";
import { appendCharacter, deleteLast, toggleSign } from "./inputRules";
import { getKeyFromKeyboard } from "./keyboardMap";
import { keypadLayout } from "./keypadLayout";

export function CalculatorContainer() {
  const [inputString, setInputString] = useState("");
  const [stringHistory, setStringHistory] = useState<HistoryEntry[]>([]);
  const [errorDisplay, setErrorDisplay] = useState<string | null>(null);
  const [isResultShown, setIsResultShown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const displayValue =
    errorDisplay ??
    (isResultShown
      ? (stringHistory[0]?.response.display ?? inputString)
      : inputString);

  const updateInput = (next: string) => {
    setInputString(next);
    setErrorDisplay(null);
    setIsResultShown(false);
  };

  const evaluate = async () => {
    if (inputString === "" || isResultShown || isLoading) return;

    setIsLoading(true);
    const response = toCalculationResult(
      await calculateExpression(inputString),
    );
    setStringHistory((history) => [{ inputString, response }, ...history]);

    if (response.kind === "success") {
      setInputString(String(response.value));
      setErrorDisplay(null);
      setIsResultShown(true);
    } else {
      setInputString("");
      setErrorDisplay(response.display);
      setIsResultShown(false);
    }
    setIsLoading(false);
  };

  const handleKeyPress = (key: KeypadKey) => {
    if (isLoading) return;

    switch (key.action) {
      case "append": {
        const startsFresh = isResultShown || errorDisplay !== null;
        const base = errorDisplay === null ? inputString : "";
        updateInput(appendCharacter(base, key.character, startsFresh));
        break;
      }
      case "delete":
        updateInput(errorDisplay === null ? deleteLast(inputString) : "");
        break;
      case "toggleSign":
        updateInput(toggleSign(errorDisplay === null ? inputString : ""));
        break;
      case "clear":
        updateInput("");
        break;
      case "evaluate":
        void evaluate();
        break;
    }
  };

  const handleSelectEntry = (entry: HistoryEntry) => {
    if (entry.response.kind !== "success") return;
    updateInput(String(entry.response.value));
    setIsHistoryOpen(false);
  };

  // Keyboard support: the same keypad keys (and handler) as the on-screen buttons.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const key = getKeyFromKeyboard(event.key);
      if (!key) return;
      event.preventDefault();
      handleKeyPress(key);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [getKeyFromKeyboard, handleKeyPress]);

  return (
    <div className="relative flex h-full w-full justify-center gap-5 lg:h-auto">
      <section
        aria-label={strings.app.title}
        className="flex h-full w-full max-w-sm flex-col bg-black px-5 pb-6 pt-4 lg:h-auto lg:rounded-[2.5rem] lg:border lg:border-neutral-800 lg:shadow-2xl"
      >
        <div className="flex h-10 items-center lg:invisible">
          <HistoryToggle
            isOpen={isHistoryOpen}
            onToggle={() => setIsHistoryOpen((open) => !open)}
          />
        </div>
        <div className="flex min-h-20 flex-1 items-end px-2 pb-4 lg:min-h-40">
          <Display value={displayValue} isError={errorDisplay !== null} />
        </div>
        {/* On short phones the keypad (≈1.5× taller than wide) is narrowed so the whole page fits without scrolling. */}
        <div className="mx-auto w-full max-w-[calc((100dvh-10rem)/1.5)] lg:max-w-none">
          <Keypad
            keys={keypadLayout}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
        </div>
      </section>

      <div
        id="history-panel"
        className={`${isHistoryOpen ? "flex" : "hidden"} absolute inset-x-4 bottom-4 top-16 z-10 lg:static lg:flex lg:w-80`}
      >
        <HistoryPanel
          entries={stringHistory}
          onSelectEntry={handleSelectEntry}
          onClear={() => setStringHistory([])}
        />
      </div>
    </div>
  );
}

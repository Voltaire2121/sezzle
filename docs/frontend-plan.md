# Frontend plan: Sezzle calculator (React + TypeScript)

> This is the plan made with Claude Code (plan mode) and approved before any frontend code was written. It is kept word for word. Where the implementation differs from it, the Implementation notes at the end explain how. The conversation that produced it is in [conversation-log.md](conversation-log.md).

## Context
The backend is done: `POST http://localhost:3001/api/calculate`. It takes `{ expression }` and returns 200 `{ result }`, 400 `{ error: "Syntax Error" | "Math Error", message }` or 500 `{ error: "Internal Server Error" }`. CORS already allows `http://localhost:3000`.

We now build the frontend: one page that looks like the iPhone calculator, following the user's mockup (mobile and desktop). The work is organized in layers:

| Layer | Job |
|---|---|
| API | talks to the backend |
| Transformers | maps API responses to UI-ready data |
| UI: containers | hold the logic and state, using `useState` only |
| UI: dumb components | Tailwind and props only |

All UI text lives in one strings file, in **English** with a **dot** decimal separator. Tests cover the dumb components, the containers and the API calls.

Stack: **Vite + React 18 + TypeScript + Tailwind CSS v4 (`@tailwindcss/vite`) + Vitest + React Testing Library + user-event + jsdom**, with `@vitest/coverage-v8` for coverage. The dev server runs on **port 3000** (`strictPort`). There's no router, global store or icon library; the few icons are inline SVGs.

## UI (from the mockup)
- **Display**: right-aligned, large and thin. It shows `0` when the input is empty, and the font shrinks for long input. Errors show the label (`Syntax Error`, `Math Error`, `Error`).
- **Keypad**: 4 columns, round buttons.

  | Row | Buttons |
  |---|---|
  | 1 | `AC` `⌫` `%` `÷` |
  | 2 | `√` `xʸ` `±` `×` |
  | 3 | `7` `8` `9` `−` |
  | 4 | `4` `5` `6` `+` |
  | 5 | `1` `2` `3` and a tall `=` spanning rows 5–6 |
  | 6 | a wide `0`, then `.` |

  The colors are light gray for functions, dark gray for digits and orange for operators and `=`.
- **History**:
  - **Desktop (`lg+`)**: a side card next to the calculator, with the title "History", a "Clear" action and an empty state ("No calculations yet"). The footer reads "Tap a result to reuse it".
  - **Mobile**: a clock icon button in the top-left toggles the same panel as an overlay.

## Folder structure
```
Frontend/
├── index.html, vite.config.ts (port 3000, tailwind plugin, vitest config), tsconfig*.json
├── .env.example                 VITE_API_URL=http://localhost:3001
└── src/
    ├── main.tsx, App.tsx        App renders the single page
    ├── index.css                @import "tailwindcss"
    ├── config.ts                API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
    ├── strings/strings.ts       every UI string (labels, aria-labels, errors, history texts)
    ├── types/calculator.ts      CalculationResult, HistoryEntry, KeypadKey
    ├── api/
    │   └── calculatorApi.ts     calculateExpression(expression) → ApiCalculateResponse
    ├── transformers/
    │   └── calculationTransformer.ts   toCalculationResult(apiResponse), formatResult(number)
    ├── components/              DUMB (Tailwind + props only, no state, no fetch)
    │   ├── Button/Button.tsx    shared button: icon + character + onPress + variant + wide/tall
    │   ├── Display/Display.tsx
    │   ├── Keypad/Keypad.tsx    renders keypadLayout with <Button>
    │   ├── History/HistoryPanel.tsx, HistoryItem.tsx
    │   └── icons/               ClockIcon, BackspaceIcon (inline SVG)
    ├── containers/
    │   └── Calculator/
    │       ├── CalculatorContainer.tsx   all state + business logic
    │       ├── keypadLayout.ts           button config (icon, character, variant, action)
    │       └── inputRules.ts             pure helpers: append, deleteLast, toggleSign
    └── pages/
        └── CalculatorPage.tsx   page shell/layout, renders <CalculatorContainer />
```
Tests sit next to each file (`*.test.ts(x)`), with a shared `src/test/setup.ts` that loads jest-dom matchers.

## Layers in detail

### API layer: `api/calculatorApi.ts`
`calculateExpression(expression: string): Promise<ApiCalculateResponse>`
- It sends `fetch(`${API_BASE_URL}/api/calculate`, { method: 'POST', headers: JSON, body: { expression } })`.
- It returns raw backend data as a discriminated union:
  - `{ ok: true, result: number }`
  - `{ ok: false, status, error, message? }` for any 4xx/5xx
- If `fetch` itself rejects (network down), it returns `{ ok: false, status: 0, error: 'Network Error' }`, so callers never have to `try/catch`.

### Transformers layer: `transformers/calculationTransformer.ts`
- `toCalculationResult(res)` maps the raw API response to `CalculationResult`:
  - success → `{ kind: 'success', value, display: formatResult(value) }`
  - 400 → `{ kind: 'error', display: strings.errors.syntax | strings.errors.math }`, taken from the backend label
  - 500 or anything unknown → `strings.errors.generic` ("Error")
  - status 0 → `strings.errors.network` ("No connection")
- `formatResult(value)` uses en-US digit grouping (`1,000,000`) with up to 12 fraction digits, like the backend's 12-digit rounding. Very large or very small numbers use exponential notation.

### UI layer
**Shared `Button`** (dumb) has these props:
- `icon: ReactNode`: what's drawn on the button
- `character: string`: what gets passed back when it's pressed
- `onPress(character)`
- `variant: 'digit' | 'function' | 'operator'`
- optional `wide` / `tall` for the grid span
- `ariaLabel`
- `disabled`

The display icon and the character it inserts are separate on purpose. For example, minus shows `−` but sends ASCII `-`, and `xʸ` sends `^`.

**`keypadLayout.ts`**: each entry is `{ id, icon, character, variant, action }`. `action` is one of `'append' | 'clear' | 'delete' | 'toggleSign' | 'evaluate'`. Keypad stays dumb: it renders the config and calls `onKeyPress(key)`.

**`CalculatorContainer`** keeps its state in `useState` only:
- `inputString: string`
- `stringHistory: HistoryEntry[]`, where each entry is `{ inputString, response: CalculationResult }` (newest first)
- `errorDisplay: string | null`, `isResultShown: boolean`, `isLoading: boolean`, `isHistoryOpen: boolean` (mobile)

Behavior:
- **append** (`inputRules.appendCharacter`):
  - After a result or an error, a digit, `.` or `√` starts a new input, while an operator continues from the result.
  - A leading `0` is replaced by the digit typed.
  - A second operator replaces the previous one.
  - Input stops at 100 characters, the backend's limit.
- **delete**: removes the last character. **clear (AC)**: resets the input and the error.
- **toggleSign**: flips the sign of the last number (`4+8 ↔ 4+-8`, `8 ↔ -8`).
- **evaluate**: ignored when the input is empty or a request is running.
  1. Call the API, then the transformer.
  2. On success, `inputString = String(value)` and the result is shown.
  3. On error, `errorDisplay` shows the error label.
  4. Either way, add `{ inputString, response }` to `stringHistory`.
- **History**: tapping an entry with a successful result puts its value back into `inputString`. "Clear" empties `stringHistory`.

### Keyboard input
The user can operate the whole calculator from the keyboard. Key presses go through the **same** keypad entries and handlers as clicks, so there's a single code path.

**`containers/Calculator/keyboardMap.ts`** is a pure `getKeyFromKeyboard(key: string): KeypadKey | undefined` that maps keyboard keys to `keypadLayout` entries:

| Keyboard | Keypad key |
|---|---|
| `0`–`9`, `.` | digits, decimal |
| `+` `-` `*` `/` | `+` `−` `×` `÷` |
| `^` | `xʸ` |
| `%` | `%` |
| `s` / `S` | `√` |
| `Enter` / `=` | evaluate |
| `Backspace` | delete |
| `Escape` | AC |

`Enter`, `Backspace` and `Escape` aren't in your list. I added them so a keyboard user can evaluate, correct and clear without the mouse; I can drop them if you want typing limited to numbers and signs.

**In `CalculatorContainer`**, a `useEffect` registers a `keydown` listener on `window` and removes it on cleanup.
- Keys pressed with Ctrl, Meta or Alt are ignored, so shortcuts like Ctrl+C keep working.
- So are keys with no mapping.
- For mapped keys it calls `preventDefault()`, which stops `/` from opening Firefox quick-find and `Enter` from re-clicking a focused button, and then runs the same `handleKeyPress(key)` as a click.
- State stays `useState` only; `useEffect` just subscribes to the event.

`%`, `√` and `^` already insert their characters. Until the advanced backend phase, they return the backend's Syntax Error. That's expected, and the README will say so.

## Tests (Vitest + RTL)
- **API** (`calculatorApi.test.ts`, global `fetch` mocked with `vi.fn`):
  - sends the correct URL, method, headers and body
  - 200 → `{ok:true,result}`
  - 400 Syntax Error and 400 Math Error → `{ok:false,status:400,error}`
  - 500 → `{ok:false,status:500}`
  - a rejected fetch → `status 0`
- **Transformers**: every mapping branch, plus `formatResult` (integers, decimals, grouping, negatives, exponential).
- **Dumb components**:
  - **Button**: renders its icon, calls `onPress(character)`, applies the right classes for its variant, wide and tall, and can't be pressed when disabled.
  - **Display**: shows `0` when empty, shows the value and shows an error.
  - **Keypad**: renders all 20 keys and passes on the pressed key.
  - **HistoryPanel / HistoryItem**: empty state, a list of entries, clicking an entry, and Clear.
- **Container**: the `api` module is mocked, and tests drive the UI with user-event.
  - `4 + 4 =` shows `8`, and the history gets `4+4 → 8`.
  - A 400 Syntax Error or Math Error shows its label, and the next digit starts a new input.
  - A network failure shows "No connection".
  - AC, ⌫ and ± work as described.
  - An operator right after a result continues from the result.
  - Clicking a history entry reuses its value. Clear empties the history.
  - The mobile history toggle opens and closes the panel.
  - The `=` button is disabled while a request is running.
- **inputRules**: pure unit tests for each rule.
- **keyboardMap**: every mapped key (including both `s` and `S`), and unmapped keys (`a`, `x`, `Tab`) → `undefined`.
- **Container keyboard tests**:
  - typing `4+4{Enter}` shows `8`
  - `s9` shows `√9`
  - `*` and `/` insert `×` and `÷`
  - `{Backspace}` and `{Escape}` work
  - unmapped keys and Ctrl+key combinations change nothing
  - the listener is removed on unmount
- `npm run test:coverage` → `Frontend/coverage/`.

## Execution order
1. Save this plan as `docs/frontend-plan.md`, and add this prompt and its summary to `docs/conversation-log.md`.
2. Scaffold Vite React-TS in `Frontend/`, then add Tailwind v4, Vitest, RTL and coverage, and set port 3000.
3. Write strings, types, config, then the API layer and its tests, then the transformers and their tests.
4. Build the dumb components (Button, Display, Keypad, History, icons) and their tests.
5. Write inputRules, keyboardMap and the container (including the keyboard listener) and their tests, then the page and App.
6. Update the README with a Frontend section: setup, scripts, architecture, design decisions. Update the log as well.

## Verification
1. `cd Frontend && npm install && npm test` should be all green, and `npm run test:coverage` should produce the report. `npm run build` and `tsc` should finish with no errors.
2. Run the backend (`cd Backend && npm run dev`) and the frontend (`cd Frontend && npm run dev`), then open http://localhost:3000 in the browser:
   - `4+4=` → 8
   - `8÷0=` → Math Error
   - `2+3×4=` → 14
   - history fills up, and tapping an entry reuses its value
   - AC, ⌫ and ± work
   - keyboard only: type `12*3` then Enter → 36, and `s16` then Enter → `√16`, which gives Syntax Error until the advanced backend phase
3. Check the layout at desktop width (side history card) and at mobile width (clock toggle), and compare both with the mockup.

---

## Implementation notes
How the implementation differs from the plan, and what came out of it:
- **Versions.** The Vite template installed **React 19**, Vite 8 and TypeScript 6 (the plan said React 18). Nothing in the design depended on React 18.
- **The keypad has 22 keys, not 20.** That's 5 rows of 4 plus `0` and `.`. The first test run caught this miscount in the plan.
- **Extra dumb component: `HistoryToggle`.** This is the mobile clock button. Icons live in a single `components/icons/icons.tsx`.
- **The whole keypad is disabled while a request runs,** not only `=`. That way a key typed mid-request can't be overwritten by the result.
- **One `HistoryPanel` instance.** It renders as a side card at `lg+` and as an overlay on mobile, with responsive classes instead of two copies.
- **Error entries in the history can't be clicked.** Only results can be reused.
- **Layout fixes from checking the real UI in the browser:**
  - The desktop card height now follows its content. It was a fixed 640px, which overflowed on short windows.
  - The mobile keypad width is capped by the viewport height, so short phones don't scroll.
- **Result:** 146 tests passing across 11 files, 100% line coverage, and a clean `tsc -b` + `vite build` + `oxlint`.
- **Checked end to end** in Chrome against the real backend, using only the keyboard:

  | Typed | Shown |
  |---|---|
  | `2+3*4` Enter | `14` |
  | `8/0=` | `Math Error` |
  | `1234*1000` Enter | `1,234,000` |
  | `s16=` | `Syntax Error` (expected until the advanced backend phase) |

  The history filled up correctly, and the mobile layout and history overlay were checked at 390px wide.

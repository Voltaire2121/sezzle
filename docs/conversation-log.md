# Conversation log (AI prompts)

This is the log of my conversation with Claude Code (Opus 5.5) while I built this challenge. The challenge asks for the prompts used, so this file keeps every one of them.

---

## 1. Ground rules and backend planning

**Prompt (verbatim):**

> Ok this is a challenge I will start making today for a company called Sezzle, so before giving you the challenge text I will give you some basic rules I would like to follow from now on for this challenge so we can start planning together.
> We will create a Frontend, Backend application for this challenge so we need to divide the work into two folders, one called Backend, other called Frontend, the backen will be created using node.js together with Express.js, a single endpoint where we can receive a string, make some validations using Zod (never trust the Frontend entirely) and return a 200 with the answer, 400 for a bad user input (Syntax error) and 500 for server errors, we are going to try to make things simple... we will try to make our calculator wo look, feel and work as much as possible as the one inside an iPhone so we will receive strings with the operations and return Syntax error, Math error, or the answer. Leave the logic for defining the correct answer outside of this first plan since I want to create another plan just for that heavy logic, for now lets focus on creating a simple logic that if a 4+4 is received it can return 8, only focus (on the backend for now) on the 4 basic operations, dividing the strings into signs and numbers and give back the answer, even if the frontend should have all the rest of the operations included, lets just focus on the basic backend operations first and also focus on having a organized backend that can return simple operations with a simple answer.
> Please just make the plan for now for the backend, we can make another plan for the frontend.
> Please save all of our interactions in a separated file since our conversation is part of the evaluation criteria.
> This is the full exercise we will make.
> For the sake of simplicity, lets not add Docker in general, lets make a backend that can be run in a 3001 port and the frontend that can be run in a 3000 port. I would like to focus more on simplicity and clarity of the backend with the tools I usually use more.
>
> *(The full Sezzle challenge text was pasted below this. Summary: a full-stack calculator with a React (TypeScript preferred) frontend and a REST backend (Go preferred), covering the 4 basic operations plus optional exponentiation, square root and percentage. It needs input validation, edge cases such as division by zero, JSON responses, unit tests with coverage, a README with setup instructions, API examples and design decisions, and the prompts that were used. Docker is optional.)*

**Claude asked:**
- TypeScript or JavaScript? → **TypeScript**
- Jest or Vitest? → **Jest + Supertest**

**Claude's response:** a backend plan with this layout:
- `Backend/` and `Frontend/` folders.
- Express + TypeScript + Zod on port 3001.
- A single `POST /api/calculate` endpoint that takes `{ expression }`.
- Responses: 200 `{ result }`, 400 `{ error: "Syntax Error" | "Math Error" }`, 500 for unexpected errors. Math Error also returns 400, so the API keeps to the 200/400/500 set from the prompt.
- Layers: tokenizer → evaluator (two-pass precedence, no `eval`) → controller, with Zod validation middleware and a central error handler.

The advanced iPhone-style logic was left for a separate plan.

---

## 2. Test-driven list of expressions

**Prompt (verbatim):**

> Everything looks correct, however I would like to have a list of lets say 50 mathe strings that should be covered by our simple backend implementation right now (Before creating the backend implementation) so we can know almost for sure that the backend is working fine for different cases or scenarios with different calculation strings, this strings should contain syntax errors, math errors, leading minus, malformed numbers like 1.2.3+56, happy paths, things like 4+-8 and anything else you can think of... we can make it a 100 is required, add this to the plan to be created before the actual implementation so we can have a sort of test driven development, the backend will be ready when all the strings are returned with the right answer

**Claude's response:** 97 expression cases were added to the plan, plus API body cases. The groups are:
- happy paths
- precedence
- unary and leading minus
- decimals and float precision
- Math Errors
- Syntax Errors: operator misuse, malformed numbers, invalid characters, phase-2 operators and length limits

The cases lock in these rules:
- A single unary minus is allowed. Unary plus is not.
- `.5` and `5.` are valid numbers.
- Results are rounded to 12 significant digits, and `-0` becomes `0`.
- `% √ ^ ( )` give a Syntax Error until the advanced-logic plan.
- A Syntax Error takes priority over a Math Error.

The fixtures get written first (red), and the backend is done when all of them pass (green).

**Plan approved → implementation (Claude's summary of what was done):**
1. Wrote this log.
2. Scaffolded `Backend/`. TypeScript was pinned to 5.x because ts-jest does not support TS 7 yet.
3. Wrote `tests/fixtures/expressions.ts` (97 cases) and the table-driven unit and API suites, then ran them. Red: the suites could not find `src/`.
4. Implemented:
   - the error classes
   - the tokenizer (`{ numbers, operators }`)
   - the two-pass evaluator with 12-significant-digit rounding
   - the Zod schema and validation middleware
   - the central error handler
   - the controller, route, `createApp()` and the server
5. Green on the first full run. Added focused tokenizer, evaluator and 404 tests. Result: 217 tests passing, about 99% coverage.
6. Checked by hand against a running server on :3001 with curl. A test of `×` failed at first, but only because Git Bash on Windows did not send it as UTF-8. Sending it as a UTF-8 file returned `2+3×4 → 14`.
7. Wrote the root `README.md` with setup, the API contract, examples and design decisions.

---

## 3. Saving the backend plan for the evaluators

**Prompt (verbatim):**

> Please lets save the complete backend plan we just implemented as a separated file inside docs folder, so we can send it to the evaluators as well

**Claude's response:** Copied the approved plan word for word into [backend-plan.md](backend-plan.md). Added a short intro and an "Implementation notes" section at the end that records where the build differed from the plan (TS 5 pin, `jest.config.js`, `tsconfig.build.json`, the `{ numbers, operators }` tokenizer output, the 404 fallback, extra test suites) and the final result (217 tests, about 99% coverage).

---

## 4. Frontend planning

**Prompt (verbatim):**

> Ok is time to implement the Frontend, lets use for the Frontend Typescript once again, and a single page displaying the UI for the app similar to the UI of the iPhone, here I attach Mobile and desktop version in an image:
> We should use a architecture in layers, API layer that will communicate with the backend, transformers layer that will transform the responses from the layer and a UI layer where we could have container components having all the bussiness logic and dumb components only used to display the information, we should create a shared component called button that receives an icon and a character... an icon to be displayed in the button UI and a character to be added to the string whenever the button is pressed, we should have inside the internal state, using only useState an inputString and also a stringHistory sanving an array of objects, each object containing the inputString and the response from the backend so we can display the historical values, please save all the string inside a strings file for easy access and order, only one page shuld be displayed, state management should only have local state. please create tests for the dumb components and also for the containers and also for the API calls.
> Dumb components should use Tailwind since this is easier to maintain
>
> *(A mockup image was attached. It shows the mobile version: an iPhone-style dark keypad with AC, ⌫, %, ÷ / √, xʸ, ±, × / digits / a tall orange `=` / a wide `0` and `,`, plus a clock icon for history. The desktop version shows the same calculator next to a "Historial" side card with "Borrar", an empty state and "Toca un resultado para reutilizarlo".)*

**Claude asked:**
- The mockup is in Spanish, so which language? → **English, dot decimal**
- Which test runner? → **Vitest + React Testing Library**

**Claude's response:** a layered plan:
- API layer (`calculateExpression`, which never throws)
- transformers (API response → `CalculationResult`, number formatting)
- dumb Tailwind components (shared `Button` with `icon` + `character`, Display, Keypad, History panel)
- `CalculatorContainer` with only `useState`: `inputString`, `stringHistory: { inputString, response }[]` and UI flags
- a single page, with all strings in `strings/strings.ts`
- tests for the API, the transformers, the dumb components and the container

---

## 5. Keyboard input

**Prompt (verbatim):**

> on top of this, lets add keystrike implementation, where a user can type only by using numbers and thecorresponding signs +-*/^% and lets use the letter S for square root

**Claude's response:** added a "Keyboard input" section to the plan:
- A pure `keyboardMap.ts` maps keys to the same keypad entries the buttons use: digits, `.`, `+ - * / ^ %`, and `s`/`S` → `√`. Claude also proposed `Enter`/`=` to evaluate, `Backspace` to delete and `Escape` for AC.
- A `keydown` listener in the container ignores Ctrl/Meta/Alt combinations and calls the same handler as a click.
- New tests for keyboard input.

The plan was approved and saved as [frontend-plan.md](frontend-plan.md).

**Implementation (Claude's summary of what was done):**
1. Scaffolded Vite React-TS, added Tailwind v4, Vitest, React Testing Library, user-event, jsdom and v8 coverage. Port 3000.
2. Built the layers:
   - **Base**: `strings.ts`, `types`, `config`
   - **API**: `calculatorApi.ts` plus tests (fetch mocked)
   - **Transformers**: `calculationTransformer.ts` plus tests
3. Built the dumb Tailwind components (Button, Display, Keypad, HistoryPanel, HistoryItem, HistoryToggle, icons), each with tests.
4. Built the container side:
   - `keypadLayout`, `inputRules` (pure, tested) and `keyboardMap` (pure, tested)
   - `CalculatorContainer`, holding all state in `useState` and listening to the keyboard
   - the page and App
5. The first test run found a miscount in the plan: the keypad has 22 keys, not 20. After fixing it: 146 tests passing, 100% line coverage, and a clean build and lint.
6. Ran both servers and checked the app in Chrome using only the keyboard: `2+3*4` → 14, `8/0` → Math Error, `1234*1000` → 1,234,000, `s16` → Syntax Error (expected for now).
7. Two layout problems turned up in the browser and were fixed:
   - The fixed-height desktop card overflowed, so it now fits its content.
   - Short phones scrolled, so the keypad width is now capped by the viewport height.

   Mobile was checked at 390px wide, including the history overlay.
8. Updated the README (quick start, Frontend section, keyboard shortcuts, architecture, design decisions) and added implementation notes to `frontend-plan.md`.

---

## 6. Advanced backend logic (power, square root, percent)

**Prompt (verbatim):**

> Finally, I would like to create a plan to make the backend more robust and allow for all of the complex math operators, making the same approach as the first plan, lets create a set of 100 strings containing the new operators along with edge cases and syntax errors and math errors as well, this strings should be created before the logic lands, this could be around 100 lines as well.

**Claude asked:**
- How should `%` behave? → **iPhone style**: `200+10%` = 220, `200×10%` = 20
- Does `-2^2` give -4 or 4? → **Math convention, -4**
- Should the backend support parentheses? → **No**, they stay a Syntax Error
- Implicit multiplication (`2√9`)? → **Syntax Error**

**Claude's response:** a TDD plan:
- 100 new expression cases written before any logic:
  - 30 power
  - 20 square root
  - 17 percent
  - 5 combined
  - 12 Math Errors (√ of a negative, division by zero via `0^-1`, overflow such as `10^400`)
  - 16 Syntax Errors
- Phase-1 cases #90 (`√4`) and #91 (`2^3`) flip to real results.
- A new pipeline replaces the flat two-pass evaluator: a lexer, a recursive-descent parser that builds an AST (with position-aware error messages), and an AST evaluator.

  Precedence, from loosest to tightest: `+ −`, then `× ÷`, then unary minus, then `^` (right-associative), then `√`, then `%`.

The plan was approved and saved as [advanced-logic-plan.md](advanced-logic-plan.md).

**Implementation (Claude's summary of what was done):**
1. Wrote the fixtures first:
   - moved the shared helpers into `tests/fixtures/helpers.ts`
   - flipped phase-1 cases #90 and #91
   - added `tests/fixtures/advancedExpressions.ts` with the 100 cases
   - extended both table-driven suites (unit and API)
2. **Red:** 172 failing tests, exactly the new result and Math Error cases at both levels.
3. Implemented the new pipeline and widened the Zod whitelist to `^ % √`:
   - `tokenizer.ts`: a lexer with 1-based positions
   - `parser.ts` (new): recursive descent from tokens to an AST
   - `evaluator.ts`: an AST walker with the iPhone percent rule, √/division/overflow Math Errors and 12-digit rounding
4. **Green on the first run:** all 197 fixture cases pass at both levels. Then rewrote the tokenizer and evaluator unit tests and added `parser.test.ts`. Result: 448 backend tests, 100% line coverage, clean build. The frontend suite (146 tests) still passes unchanged.
5. Checked against the live backend with curl, and in Chrome using only the keyboard: `2^10` → 1,024, `√16` → 4, `200+10%` → 220, `10^400` → Math Error. Port 3000 was already in use by the user's own dev server, so the check used that instance.
6. Updated the README:
   - an operator precedence table, the percent rule and the Math Error list
   - new API examples
   - the new pipeline in the project structure
   - test counts
   - removed the "Syntax Error until the advanced phase" notes
   - links to all three plans

   Also added implementation notes to `advanced-logic-plan.md`.

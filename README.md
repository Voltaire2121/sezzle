# Sezzle Calculator

A full-stack calculator that aims to look, feel and behave like the iPhone calculator.

| Part | Stack | Port |
|---|---|---|
| [Backend/](Backend/) | Node.js 22 · Express 5 · TypeScript · Zod · Jest + Supertest | 3001 |
| [Frontend/](Frontend/) | React 19 · TypeScript · Vite · Tailwind CSS v4 · Vitest + React Testing Library | 3000 |

## Quick start
In two terminals (Node.js 22+):
```bash
cd Backend  && npm install && npm run dev   # http://localhost:3001
cd Frontend && npm install && npm run dev   # http://localhost:3000  ← open this
```

The AI prompts used during development are logged in [docs/conversation-log.md](docs/conversation-log.md). The approved implementation plans are in [docs/](docs/):
1. [backend-plan.md](docs/backend-plan.md): basic operators, written test-first
2. [frontend-plan.md](docs/frontend-plan.md): React UI and keyboard input
3. [advanced-logic-plan.md](docs/advanced-logic-plan.md): power, √ and percent, written test-first

---

## Backend

### Setup
Requires **Node.js 22+**.

```bash
cd Backend
npm install
npm run dev            # http://localhost:3001 (watch mode)
```

| Script | What it does |
|---|---|
| `npm run dev` | Starts the API with hot reload (tsx) |
| `npm run build` / `npm start` | Compiles to `dist/` and runs the compiled server |
| `npm test` | Runs all unit and API tests |
| `npm run test:coverage` | Runs tests and writes the report to `Backend/coverage/` (`index.html` inside `lcov-report/`) |

Optional configuration goes in `Backend/.env` (see `.env.example`). `PORT` defaults to `3001` and `CORS_ORIGIN` defaults to `http://localhost:3000`.

### API

#### `POST /api/calculate`
The frontend sends the whole expression the user typed. The backend validates it, evaluates it and returns either a result or an iPhone-style error label.

```bash
curl -X POST http://localhost:3001/api/calculate \
  -H "Content-Type: application/json" \
  -d '{"expression":"2+3*4"}'
```

| Case | Status | Body |
|---|---|---|
| Valid expression | 200 | `{ "result": 14 }` |
| Bad input or invalid expression | 400 | `{ "error": "Syntax Error", "message": "Malformed number \"1.2.3\"" }` |
| Valid expression without a numeric result | 400 | `{ "error": "Math Error", "message": "Division by zero" }` |
| Unexpected server failure | 500 | `{ "error": "Internal Server Error" }` |

More examples:

| `expression` | Response |
|---|---|
| `"4+4"` | 200 `{ "result": 8 }` |
| `"4+-8"` | 200 `{ "result": -4 }` |
| `"6×7"` | 200 `{ "result": 42 }` |
| `"0.1+0.2"` | 200 `{ "result": 0.3 }` |
| `"2^3^2"` | 200 `{ "result": 512 }` |
| `"√16+2^3"` | 200 `{ "result": 12 }` |
| `"200+10%"` | 200 `{ "result": 220 }` |
| `"8/0"` | 400 `{ "error": "Math Error", "message": "Division by zero" }` |
| `"√-4"` | 400 `{ "error": "Math Error", "message": "Square root of a negative number" }` |
| `"10^400"` | 400 `{ "error": "Math Error", "message": "Result is out of range" }` |
| `"4++4"` | 400 `{ "error": "Syntax Error", "message": "Unexpected \"+\" at position 3" }` |

#### `GET /api/health`
Returns 200 `{ "status": "ok" }`.

### Supported syntax
Operator precedence, from loosest to tightest:

| Level | Operators | Notes |
|---|---|---|
| 1 | `+` `-` | left to right |
| 2 | `*` `/` (also `×` `÷`) | left to right |
| 3 | unary `-` | one in a row, so `--4` is a Syntax Error. Looser than `^`: `-2^2 = -4` |
| 4 | `^` | right-associative: `2^3^2 = 512`. The exponent may be negative: `2^-2 = 0.25` |
| 5 | `√` (prefix) | `√4^3 = 8`, `√√16 = 2`, `√-4` → Math Error |
| 6 | `%` (postfix, one per number) | binds to the number: `√16% = √0.16 = 0.4` |

- **Percent works as on the iPhone.** `50% = 0.5`, and `200×10% = 20`. When a bare percent comes after `+` or `−`, it's a percent of the running left value: `200+10% = 220`, `100+50-10% = 135`. `%` is never modulo, so `50%5` is a Syntax Error.
- **Numbers**: `12`, `3.5`, `.5` and `5.` are valid. `1.2.3` and `1..2` are Syntax Errors.
- **Math Error** covers division by zero (including `0^-1` and `5÷0%`), the square root of a negative number, and any result that overflows (`10^400`). Results that underflow return `0`.
- **Syntax Error** always takes priority over Math Error, because the whole expression is parsed before it's evaluated (`√-4+` → Syntax Error).
- **Not supported**: parentheses and implicit multiplication (`2√9`). Both are Syntax Errors.
- **Spaces** are ignored. The maximum length is 100 characters.

### Project structure
```
Backend/src
├── server.ts                 # starts the HTTP server (port 3001)
├── app.ts                    # createApp(): middleware + routes, no listen() so tests can use it
├── routes/                   # POST /api/calculate
├── controllers/              # thin: validated body → service → JSON
├── schemas/                  # Zod request schema (type, length, character whitelist)
├── middleware/               # validateBody (Zod → 400) and the central errorHandler
├── errors/                   # CalculatorError → ExpressionSyntaxError | MathError
└── services/calculator/
    ├── tokenizer.ts          # string → tokens (numbers / operators with positions)
    ├── parser.ts             # tokens → AST (recursive descent, position-aware Syntax Errors)
    ├── evaluator.ts          # AST → number (percent rule, Math Errors, rounding)
    └── index.ts              # calculate(expression) = evaluate(parse(tokenize(expression)))
```

### Testing approach (test-driven)
The backend was built in two phases, and each phase started by writing its expected results before any logic:
- **Phase 1** wrote **97 expression cases** for the basic operators in [Backend/tests/fixtures/expressions.ts](Backend/tests/fixtures/expressions.ts). They cover happy paths, precedence, unary minus, decimals and float precision, Math Errors and many kinds of Syntax Error.
- **The advanced phase** wrote **100 more cases** in [Backend/tests/fixtures/advancedExpressions.ts](Backend/tests/fixtures/advancedExpressions.ts). They cover power, square root, iPhone-style percent and combined operators, plus overflow, √ of a negative and many misuse cases.

The same fixtures run twice:
- at unit level against `calculate()`
- through the real HTTP stack with Supertest

Other suites cover:
- the tokenizer, parser (AST shape, precedence, error positions) and evaluator internals
- request-body validation: missing or wrong-type fields, extra keys, malformed JSON
- the 500 path
- health and 404 routes

Each phase counted as done once every fixture passed. Current state: **448 tests passing, 100% statement and line coverage.**

### Design decisions
- **Node.js and Express instead of Go.** The challenge prefers Go, but I chose the stack I work with most. That let me focus on clarity, structure and test coverage within the 2–4 hour time box. TypeScript is shared with the frontend.
- **One endpoint that takes a string expression** instead of one endpoint per operation. The iPhone calculator evaluates whole expressions (`2+3×4 = 14`), so the API takes what the user typed and returns what the display should show.
- **Never trust the frontend.** Zod checks the body shape: a strict object with a string between 1 and 100 characters, and only whitelisted characters. Then the parser validates the grammar, so even a valid-looking string gets parsed defensively.
- **No `eval` or `Function`.** Evaluation runs through a small hand-written pipeline: a tokenizer, a recursive-descent parser that builds an AST, and an evaluator. Each stage is safe and can be tested on its own. Adding an operator means one grammar rule and one evaluator case. The grammar is documented in [parser.ts](Backend/src/services/calculator/parser.ts).
- **Parse everything, then evaluate.** Syntax Errors are reported with their position, before any math runs. During evaluation, every intermediate result must be finite, so an overflow becomes a Math Error instead of returning `Infinity`.
- **Only 200, 400 and 500 status codes.** Both Syntax Error and Math Error are client errors (400). The `error` label tells them apart, and the frontend can show it directly, as the iPhone display does. The 500 response never leaks internal details.
- **Rounding.** Results are rounded to 12 significant digits, which removes floating point noise (`0.1+0.2 → 0.3`). As a trade-off, very large results lose digits past the 12th. `-0` is normalized to `0`.
- **No Docker**, to keep setup simple: run the backend on 3001 and the frontend on 3000.

---

## Frontend

### Setup
```bash
cd Frontend
npm install
npm run dev            # http://localhost:3000 (expects the backend on :3001)
```

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server on port 3000 |
| `npm run build` / `npm run preview` | Type-checks, builds to `dist/` and serves the build on port 3000 |
| `npm test` | Runs all unit and component tests (Vitest + React Testing Library) |
| `npm run test:coverage` | Runs tests and writes the report to `Frontend/coverage/` |
| `npm run lint` | Lints with oxlint |

The backend URL can be changed with `VITE_API_URL` in `Frontend/.env` (see `.env.example`). It defaults to `http://localhost:3001`.

### Using the calculator
- **Mouse or touch**: the on-screen keypad works like the iPhone's (AC, ⌫, %, ÷, √, xʸ, ±, ×, −, +, =).
- **Keyboard**:

  | Keys | Action |
  |---|---|
  | `0`–`9`, `.` | digits and decimal point |
  | `+` `-` `*` `/` | the four operators |
  | `^` | power |
  | `%` | percent |
  | `S` | square root |
  | `Enter` or `=` | evaluate |
  | `Backspace` | delete |
  | `Escape` | AC |

- **History**: every evaluation goes into the history, newest first. Tap a result to reuse it, or use "Clear" to empty it. On desktop the history is a side card; on mobile the clock button opens it.

### Architecture (layers)
```
Frontend/src
├── api/calculatorApi.ts                  # API layer: POST /api/calculate, never throws (network failure → status 0)
├── transformers/calculationTransformer.ts # API response → CalculationResult { kind, value, display }, number formatting
├── containers/Calculator/                # business logic
│   ├── CalculatorContainer.tsx           # useState only: inputString, stringHistory, flags; keyboard listener
│   ├── inputRules.ts                     # pure input-editing rules (append, delete, ±)
│   ├── keypadLayout.tsx                  # keypad configuration (icon, character, action, variant)
│   └── keyboardMap.ts                    # keyboard key → keypad key
├── components/                           # dumb components: props + Tailwind only
│   ├── Button/  Display/  Keypad/  History/  icons/
├── pages/CalculatorPage.tsx              # the single page
├── strings/strings.ts                    # every UI string
└── types/calculator.ts
```

### Design decisions
- **Layers with one direction of data flow.** The flow is API → transformer → container → dumb components. Only the container knows about the API, and the dumb components only receive props, so each layer can be tested on its own.
- **A shared `Button`** gets an `icon` (what it shows) and a `character` (what it adds to the input). For example, minus shows `−` but sends `-`, and `xʸ` sends `^`.
- **The keypad is configuration.** `keypadLayout` describes all 22 keys, and both the mouse and the keyboard go through the same `handleKeyPress`, so there's a single code path for input.
- **Local state only (`useState`).** There's no context, reducer or store. `stringHistory` is an array of `{ inputString, response }`.
- **The frontend helps but the backend decides.**
  - Input rules keep the expression tidy: a second operator replaces the first, there's one decimal point per number, and input stops at 100 characters.
  - Validation and the actual math stay in the backend.
- **The API layer never throws.** Network failures come back as data, and the UI shows "No connection" instead of crashing.
- **Responsive layout.** On mobile, the calculator fills the screen and the keypad shrinks to fit short phones. At `lg` and up, the calculator becomes a card with the history card next to it.
- **Strings in English.** The mockup was in Spanish, but the evaluators read English. All strings live in `strings/strings.ts`, so translating would be simple.
- **Testing.** Tests use Vitest, which is native to Vite, with React Testing Library and user-event. Current state: **146 tests passing, 100% line coverage.**

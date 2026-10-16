# Backend plan: Sezzle calculator (phase 1, basic operations)

> This is the plan made with Claude Code (plan mode) and approved before any backend code was written. It is kept word for word. Where the implementation differs from it, the [Implementation notes](#implementation-notes) at the end explain how. The conversation that produced it is in [conversation-log.md](conversation-log.md).

## Context
Sezzle take-home: a full-stack calculator (React frontend + REST backend). The goal is to look, feel and work like the iPhone calculator. The frontend sends the whole expression as a string, and the backend validates it, evaluates it, and returns the result, `Syntax Error` or `Math Error`.

This plan covers only the **backend skeleton plus the 4 basic operations** (`+ - × ÷`). Advanced evaluation is left for a separate plan: precedence rules matching iOS, `%`, `√`, `^`, decimals edge cases and chaining. The frontend gets its own plan too. The work is deliberately simple. No Docker. Backend on port **3001**, frontend on **3000**.

Stack: Node.js + Express + TypeScript + Zod, tested with Jest + Supertest. The challenge prefers Go, so the README will say why we chose Node.

## Folder layout
```
Sezzle challenge/
├── Backend/
├── Frontend/                 (empty for now, next plan)
├── docs/conversation-log.md  (prompts/interactions log, required deliverable)
└── README.md                 (root, filled progressively)
```

## Step 0: Conversation log
Create `docs/conversation-log.md` first. It records every user prompt verbatim plus a short summary of each answer or decision. So far that covers:
- the first message and the pasted challenge
- the TypeScript and Jest choices
- this TDD request

Append to it on every later interaction.

## Execution order
0. Write the conversation log.
1. Scaffold `Backend/` and write the fixtures and table-driven tests (red).
2. Implement errors, tokenizer, evaluator, schema, middleware, routes and app/server.
3. Iterate until all tests are green.
4. Write the README and coverage report.

## Backend structure
```
Backend/
├── package.json          scripts: dev (tsx watch), build (tsc), start, test, test:coverage
├── tsconfig.json
├── jest.config.ts        ts-jest preset, coverage collected from src/
├── .env.example          PORT=3001, CORS_ORIGIN=http://localhost:3000
└── src/
    ├── server.ts                      reads PORT (default 3001), calls app.listen
    ├── app.ts                         createApp(): json, cors, routes, error handlers (no listen → testable)
    ├── routes/calculate.routes.ts     POST /api/calculate
    ├── controllers/calculate.controller.ts   thin: validated body → service → JSON
    ├── schemas/calculate.schema.ts    Zod schema
    ├── services/calculator/
    │   ├── tokenizer.ts               string → tokens (numbers, operators)
    │   ├── evaluator.ts               tokens → number (basic ops only for now)
    │   └── index.ts                   calculate(expression): number
    ├── middleware/
    │   ├── validate.ts                generic Zod body validator → 400
    │   └── errorHandler.ts            maps domain errors → 400/500 (see below)
    └── errors/CalculatorError.ts      SyntaxError / MathError classes
tests/ (or __tests__ next to files)
    tokenizer.test.ts, evaluator.test.ts, calculate.api.test.ts
```
Dependencies: `express`, `zod`, `cors`. Dev dependencies: `typescript`, `tsx`, `@types/*`, `jest`, `ts-jest`, `supertest`.

## API contract
`POST /api/calculate`
Request: `{ "expression": "4+4" }`

| Case | Status | Body |
|---|---|---|
| Success | 200 | `{ "result": 8 }` |
| Bad input or parse failure | 400 | `{ "error": "Syntax Error", "message": "..." }` |
| Division by zero / non-finite result | 400 | `{ "error": "Math Error", "message": "..." }` |
| Unexpected failure | 500 | `{ "error": "Internal Server Error" }` |

You asked for 200, 400 and 500 only, so Math Error also returns **400** and the `error` field tells the two cases apart. The frontend shows `error` as is, the way the iPhone display does.

Plus `GET /api/health` → `{ status: "ok" }` (handy for checks, trivial).

## Validation (Zod, never trust the frontend)
- `expression`: string, trimmed, length 1–100.
- Regex whitelist: digits, `.`, `+ - * / × ÷`, spaces. Anything else → 400 Syntax Error. The whitelist widens later when `% √ ^ ( )` get added.
- Body must be JSON and an object. Extra keys are rejected (`.strict()`).

## Evaluation logic (deliberately minimal, phase 1)
1. **Tokenizer**: walk the string, group digits and `.` into number tokens, and normalize `×→*` and `÷→/`. A leading `-` or one right after an operator is a unary minus (so `-3+2` and `4*-2` work). It throws `SyntaxError` on malformed numbers (`1.2.3`), doubled operators (`4++4`) or a trailing operator.
2. **Evaluator**: two passes over the tokens. `* /` first, then `+ -`. That gives standard precedence, which the iPhone also uses. No `eval()` or `Function()` anywhere. Division by zero or a non-finite result throws `MathError`.
3. Results are rounded to a safe precision to avoid `0.1+0.2=0.30000000000000004`. Exact display rules belong to the later logic plan.

## Error handling
- The `CalculatorError` base has subclasses `ExpressionSyntaxError` and `MathError`. Each carries `statusCode=400` and a `label`.
- `errorHandler` maps known errors → 400 + label. Malformed JSON (from `express.json`) → 400 Syntax Error. Anything else → 500, with details logged server-side and never leaked.

## Step 1: Test-first expression fixtures (TDD, before any implementation)
Before writing `src/`, scaffold `Backend/` (package.json, tsconfig, jest config) and create `Backend/tests/fixtures/expressions.ts`. Every case in the list below goes in as data, in the form `{ input, expected: { status, body } }`. Two table-driven suites consume it:
- `tests/calculator.cases.test.ts`: `it.each` over the fixtures against `calculate()` (unit level).
- `tests/calculate.api.cases.test.ts`: the same fixtures through Supertest `POST /api/calculate` (HTTP level, checks status + body).

Run them first and watch them all fail (red). Then implement until they pass (green). **Definition of done for the backend: all 97 cases + the API body cases pass.**

Rules these cases lock in (phase 1):
- A number is digits with at most one `.` and at least one digit (`.5` and `5.` are valid).
- Only **one** unary minus is allowed: at the start or right after an operator. Unary `+` is **not** allowed.
- Results are rounded to 12 significant digits, and `-0` is normalized to `0`.
- `%`, `√`, `^` and `( )` are **Syntax Error for now**. They flip to real results in the advanced-logic plan.
- Parsing happens before evaluation, so a malformed expression containing `/0` is a Syntax Error, not a Math Error.
- Max length is 100 characters after trim.

### Happy path → 200 `{ result }`
| # | input | result | | # | input | result |
|---|---|---|---|---|---|---|
| 1 | `4+4` | 8 | | 11 | ` 4 + 4 ` | 8 |
| 2 | `10-3` | 7 | | 12 | `4 × 4 ÷ 2` | 8 |
| 3 | `6*7` | 42 | | 13 | `1000000*1000000` | 1000000000000 |
| 4 | `8/2` | 4 | | 14 | `123456789*0` | 0 |
| 5 | `6×7` | 42 | | 15 | `7/7` | 1 |
| 6 | `8÷2` | 4 | | 16 | `0/5` | 0 |
| 7 | `0` | 0 | | 17 | `1-1` | 0 |
| 8 | `42` | 42 | | 18 | `5/2` | 2.5 |
| 9 | `3.5` | 3.5 | | 19 | `1-2` | -1 |
| 10 | `007+3` | 10 | | | | |

### Precedence and associativity → 200
| # | input | result |
|---|---|---|
| 20 | `2+3*4` | 14 |
| 21 | `10-2*3` | 4 |
| 22 | `8/2*4` | 16 |
| 23 | `100/10/2` | 5 |
| 24 | `2*3+4*5` | 26 |
| 25 | `10-4-3` | 3 |
| 26 | `1+2*3-4/2` | 5 |
| 27 | `2*3*4` | 24 |
| 28 | `20/4+3` | 8 |

### Leading and unary minus → 200
| # | input | result | | # | input | result |
|---|---|---|---|---|---|---|
| 29 | `-5` | -5 | | 36 | `-2*-3` | 6 |
| 30 | `-4+8` | 4 | | 37 | `-0` | 0 |
| 31 | `-5-5` | -10 | | 38 | `0*-1` | 0 |
| 32 | `4+-8` | -4 | | 39 | `-0.5+0.5` | 0 |
| 33 | `4--8` | 12 | | 40 | `4 - -8` | 12 |
| 34 | `4*-2` | -8 | | 41 | `-3.5*2` | -7 |
| 35 | `8/-2` | -4 | | | | |

### Decimals and float precision → 200
| # | input | result | | # | input | result |
|---|---|---|---|---|---|---|
| 42 | `0.1+0.2` | 0.3 | | 48 | `1.005*1000` | 1005 |
| 43 | `0.3-0.1` | 0.2 | | 49 | `.5+.5` | 1 |
| 44 | `0.1*3` | 0.3 | | 50 | `5.+1` | 6 |
| 45 | `1/3` | 0.333333333333 | | 51 | `2.5*4` | 10 |
| 46 | `2/3` | 0.666666666667 | | 52 | `1.5+1.5` | 3 |
| 47 | `10/3` | 3.33333333333 | | 53 | `1+1+…+1` (fifty 1s, 99 chars) | 50 |

### Math Error → 400 `{ error: "Math Error" }`
54 `8/0` · 55 `0/0` · 56 `8÷0` · 57 `1+2/0` · 58 `8/0.0` · 59 `8/-0` · 60 `5*3/0+1` · 61 `-8/0`

### Syntax Error → 400 `{ error: "Syntax Error" }`
- **Empty**: 62 `""` · 63 `"   "`
- **Operator misuse**: 64 `4++4` · 65 `4+` · 66 `*4` · 67 `/4` · 68 `+4` · 69 `4*/2` · 70 `4//2` · 71 `4**4` · 72 `--4` · 73 `4---8` · 74 `-` · 93 `4*+2` · 94 `4 + + 4` · 96 `4/-`
- **Malformed numbers**: 75 `4 4` · 76 `1.2.3+56` · 77 `1..2` · 78 `.` · 79 `-.` · 80 `4+.`
- **Invalid characters**: 81 `abc` · 82 `4+a` · 83 `1e5` · 84 `Infinity` · 85 `NaN` · 86 `4,5` · 87 `4+4=` · 95 `0x10`
- **Not supported yet (phase 2)**: 88 `(4+4)` · 89 `4%2` · 90 `√4` · 91 `2^3`
- **Limits and ordering**: 92 a 101-char string (`1+` ×50 + `1`) · 97 `8/0+` (Syntax wins over Math)

### API body cases (not expression strings), in `calculate.api.test.ts`
Each of these returns 400 Syntax Error:
- missing `expression`
- `expression` as a number (`44`)
- an extra key (`{expression:"4+4", foo:1}`)
- malformed JSON
- a non-object body (`[]`)

When the service is mocked to throw an unexpected error, the response is 500 `{ error: "Internal Server Error" }`.

## Tests (Jest + Supertest)
- Tokenizer: valid numbers and decimals, unary minus, invalid inputs.
- Evaluator: `4+4=8`, `10-3`, `6×7`, `8÷2`, precedence `2+3×4=14`, decimals, divide by zero → MathError.
- API: 200 happy path, 400 for invalid chars, empty or missing `expression` and malformed JSON, 400 Math Error, and a 500 path (mock the service to throw).
- `npm run test:coverage` → `coverage/` report (deliverable).

## README (Backend section)
Setup (`npm install`, `npm run dev`), port 3001, curl examples for each status, the error contract, and design decisions: why Node instead of Go, string-expression API to mimic iPhone, no `eval`, all errors return 400.

## Verification
1. `cd Backend && npm install && npm run dev` → server on :3001.
2. `curl -X POST localhost:3001/api/calculate -H "Content-Type: application/json" -d "{\"expression\":\"4+4\"}"` → `{"result":8}`.
3. `"4++"` → 400 Syntax Error, `"8/0"` → 400 Math Error, `"abc"` → 400.
4. `npm test` all green, and `npm run test:coverage` produces the report.

---

## Implementation notes
How the implementation differs from the plan, and what came out of it:
- **TypeScript is pinned to 5.x.** npm installed TypeScript 7, but ts-jest only supports TypeScript up to 6.
- **The Jest config is `jest.config.js`, not `.ts`.** A TypeScript config would also need ts-node.
- **There is an extra `tsconfig.build.json`.** It compiles only `src/` to `dist/`. The main `tsconfig.json` also type-checks `tests/`.
- **The tokenizer returns `{ numbers, operators }`.** It does this instead of a flat token list, so the "numbers and signs" split is explicit. The grammar invariant is `numbers.length === operators.length + 1`.
- **`server.ts` loads an optional `.env`** with Node's built-in `process.loadEnvFile()`, so there is no dotenv dependency.
- **There is a `404 { error: "Not Found" }` fallback** for unknown routes.
- **Test suites:**
  - `calculator.cases.test.ts` and `calculate.api.cases.test.ts` (the 97 fixtures)
  - `calculate.api.test.ts` (body validation, 500, 404, health)
  - `tokenizer.test.ts` and `evaluator.test.ts` (internals, including the overflow → Math Error branch, which no 100-character string can reach)
- **TDD cycle:** red, because the suites could not resolve `src/`. Then green on the first full run of the implementation.
- **Result:** 217 tests passing, about 99% statement coverage (`npm run test:coverage`). Every one of the 97 fixture expressions returns its expected answer.

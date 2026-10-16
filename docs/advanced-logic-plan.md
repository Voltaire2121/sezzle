# Advanced-logic plan: power, square root and percent in the backend (TDD)

> This is the plan made with Claude Code (plan mode) and approved before the advanced logic was written. It is kept word for word. Where the implementation differs from it, the Implementation notes at the end explain how. The conversation that produced it is in [conversation-log.md](conversation-log.md).

## Context
Phase 1 delivered a backend that evaluates `+ − × ÷`. Its tokenizer builds a flat `{ numbers, operators }` split, and a two-pass evaluator works over it. The frontend already sends `^`, `√` and `%`, but the backend rejects them as Syntax Error.

This phase makes the backend **robust and complete** for every operator on the keypad. We follow the same TDD approach as the first plan:
1. Write **100 new expression cases** first: new operators, edge cases, Math Errors and Syntax Errors. They should fail (red).
2. Replace the flat evaluator with a proper **tokenizer → parser (AST) → evaluator** pipeline until every case passes (green).

All 97 phase-1 cases must keep passing (regression). Only cases #90 and #91 flip to real results.

### Decisions (confirmed with the user)
| Topic | Rule |
|---|---|
| **Percent** | Works as on the iPhone. `50%` = 0.5. When the right operand of `+`/`−` is a bare (optionally negative) percent, it's a percent of the running left value: `200+10%` = 220, `100+50-10%` = 135. In any other position, `b%` = b/100: `200×10%` = 20. One `%` per number, and it binds to the number literal (`√16%` = √0.16). `%` is never modulo, so `50%5` is a Syntax Error. |
| **Power** | `^` binds tighter than `× ÷` and is **right-associative**: `2^3^2` = 512. The exponent may carry one unary minus: `2^-2` = 0.25. |
| **Unary minus vs `^`** | Math convention: `-2^2` = **-4** and `4×-2^2` = -16. Only one unary minus is allowed in a row (unchanged from phase 1). |
| **Square root** | Prefix `√` binds tighter than `^`: `√4^3` = (√4)³ = 8. Roots can be nested (`√√16` = 2), and the operand may carry a minus (`√-4` → Math Error). |
| **Parentheses** | **Not supported.** They stay a Syntax Error (#88 is unchanged). |
| **Implicit multiplication** | **Syntax Error**: `2√9`, `4√`. |
| **Math Error** | Raised for: √ of a negative, division by zero (including `0^-1` and `5÷0%`), and any non-finite intermediate or final result (overflow, e.g. `10^400`). Underflow to 0 is allowed. |
| **Error priority** | The whole expression is parsed before anything is evaluated, so a Syntax Error always wins over a Math Error (`√-4+` → Syntax Error). |
| **Rounding** | Unchanged: 12 significant digits, and `-0` → `0`. |

## Grammar (recursive descent, no parentheses)
```
expression := term (('+' | '-') term)*
term       := signed (('*' | '/') signed)*
signed     := '-' power | power            // one unary minus, looser than ^  (-2^2 = -4)
power      := root ('^' exponent)?         // right-associative via exponent
exponent   := '-' power | power            // 2^-2, 2^3^2
root       := '√' ('-')? root | percent     // √√16, √-4, √16%
percent    := NUMBER '%'?
```
The `×` and `÷` symbols are normalized to `*` and `/` by the tokenizer, as today.

## Files
- `Backend/src/services/calculator/tokenizer.ts`: **rewrite** as a lexer. It returns `Token[]` (`{ type: 'number', value, position } | { type: 'operator', value: '+'|'-'|'*'|'/'|'^'|'%'|'√', position }`). It still rejects invalid characters and malformed numbers (`1.2.3`), but grammar checks move to the parser.
- `Backend/src/services/calculator/parser.ts` (**new**): recursive-descent parser from tokens to an AST:
  ```ts
  type Node =
    | { type: 'number'; value }
    | { type: 'negate'; operand }
    | { type: 'sqrt'; operand }
    | { type: 'percent'; value }
    | { type: 'binary'; operator; left; right }
  ```
  It throws `ExpressionSyntaxError` with a position-aware message, such as `Unexpected "^" at position 3` or `Expression is incomplete`.
- `Backend/src/services/calculator/evaluator.ts`: **rewrite** as an AST walker.
  - `+`/`−` with a percent right operand (`percent`, or `negate(percent)`) computes `left × p/100`.
  - It checks √ of a negative, division by zero and non-finite values at every node, then applies the existing `roundResult`.
- `Backend/src/services/calculator/index.ts`: `calculate = evaluate(parse(tokenize(expr)))`. The public API is unchanged, so the controller and routes stay untouched.
- `Backend/src/schemas/calculate.schema.ts`: widen the whitelist to `^[0-9.+\-*/×÷^%√ ]+$`.
- `Backend/src/errors/CalculatorError.ts`: reused as is.

## Step 1: Test-first fixtures (before any logic lands)
1. Move the `ok`, `syntax` and `math` helpers and the `ExpressionCase` type from `tests/fixtures/expressions.ts` into `tests/fixtures/helpers.ts`, so both fixture files share them.
2. In `tests/fixtures/expressions.ts` (phase 1), flip **#90 `√4` → 2** and **#91 `2^3` → 8**. Everything else stays the same, including #88 `(4+4)` and #89 `4%2` as Syntax Errors.
3. Create **`tests/fixtures/advancedExpressions.ts`** with the 100 cases below (ids 1–100).
4. Extend `tests/calculator.cases.test.ts` and `tests/calculate.api.cases.test.ts` with an "advanced" `describe` that runs the new list at unit level and over HTTP. Add an integrity check that ids run 1..100.
5. Run the suites and watch them fail (red).

**Definition of done:** all 97 phase-1 cases + all 100 advanced cases pass at unit and API level, together with the rest of the suite.

### Power → 200
| # | input | result | | # | input | result |
|---|---|---|---|---|---|---|
| 1 | `2^3` | 8 | | 16 | `10^15` | 1000000000000000 |
| 2 | `2^10` | 1024 | | 17 | `0.5^2` | 0.25 |
| 3 | `5^0` | 1 | | 18 | `1.5^2` | 2.25 |
| 4 | `0^0` | 1 | | 19 | `-2^2` | -4 |
| 5 | `0^5` | 0 | | 20 | `4×-2^2` | -16 |
| 6 | `1^100` | 1 | | 21 | `2^-3^2` | 0.001953125 |
| 7 | `2^-1` | 0.5 | | 22 | `-2^3` | -8 |
| 8 | `2^-2` | 0.25 | | 23 | `10^-2` | 0.01 |
| 9 | `4^0.5` | 2 | | 24 | `27^0.5` | 5.19615242271 |
| 10 | `2^0.5` | 1.41421356237 | | 25 | `100^0.5×2` | 20 |
| 11 | `2^3^2` | 512 | | 26 | `2^2^2^2` | 65536 |
| 12 | `2^3×2` | 16 | | 27 | `9^0.5+16^0.5` | 7 |
| 13 | `2×3^2` | 18 | | 28 | `2^1023` | 8.98846567431e307 |
| 14 | `1+2^3` | 9 | | 29 | `10^-400` | 0 (underflow) |
| 15 | `2^3-1` | 7 | | 30 | `-3^2+10` | 1 |

### Square root → 200
| # | input | result | | # | input | result |
|---|---|---|---|---|---|---|
| 31 | `√4` | 2 | | 41 | `√4^3` | 8 |
| 32 | `√9` | 3 | | 42 | `2^√4` | 4 |
| 33 | `√2` | 1.41421356237 | | 43 | `√2×√2` | 2 |
| 34 | `√0` | 0 | | 44 | `√1000000` | 1000 |
| 35 | `√0.25` | 0.5 | | 45 | `√3` | 1.73205080757 |
| 36 | `√16+√9` | 7 | | 46 | `√9÷√9` | 1 |
| 37 | `√16×√4` | 8 | | 47 | `√ 9` | 3 |
| 38 | `√√16` | 2 | | 48 | `√16%` | 0.4 |
| 39 | `-√9` | -3 | | 49 | `√-0` | 0 |
| 40 | `10-√9` | 7 | | 50 | `4×-√9` | -12 |

### Percent (iPhone style) → 200
| # | input | result | | # | input | result |
|---|---|---|---|---|---|---|
| 51 | `50%` | 0.5 | | 60 | `-50%` | -0.5 |
| 52 | `100%` | 1 | | 61 | `200+-10%` | 180 |
| 53 | `0%` | 0 | | 62 | `12.5%` | 0.125 |
| 54 | `200+10%` | 220 | | 63 | `2^50%` | 1.41421356237 |
| 55 | `200-10%` | 180 | | 64 | `50%×50%` | 0.25 |
| 56 | `200×10%` | 20 | | 65 | `1+1%` | 1.01 |
| 57 | `200÷10%` | 2000 | | 66 | `200+10%×2` | 200.2 (not a bare percent) |
| 58 | `10%+5` | 5.1 | | 67 | `0.1%` | 0.001 |
| 59 | `100+50-10%` | 135 | | | | |

### Combined operators → 200
| # | input | result |
|---|---|---|
| 68 | `√16+2^3×10%` | 4.8 |
| 69 | `2^3+√16-50%` | 6 |
| 70 | `-√16^0.5` | -2 |
| 71 | `3×√4^2÷4` | 3 |
| 72 | `1-2^2×3` | -11 |

### Math Error → 400 `{ error: "Math Error" }`
- **Square root of a negative**: 73 `√-4` · 74 `√-0.01` · 80 `√-9+1` · 84 `√-√4`
- **Division by zero**: 75 `0^-1` · 81 `5÷0%` · 82 `0^-0.5`
- **Overflow**: 76 `10^400` · 77 `2^1024` · 78 `9^999` · 79 `-10^309` · 83 `10^308×10`

### Syntax Error → 400 `{ error: "Syntax Error" }`
- **Power misuse**: 85 `^2` · 86 `2^` · 87 `2^^3` · 100 `2^-`
- **Root misuse**: 88 `√` · 89 `4√` · 90 `2√9` (implicit ×) · 91 `√+4`
- **Percent misuse**: 92 `%` · 93 `50%%` · 94 `%50` · 95 `50%5` (not modulo)
- **Parentheses (not supported)**: 96 `(2+3)^2` · 97 `√(4)`
- **Syntax wins over Math**: 98 `√-4+`
- **More than one unary minus**: 99 `--2^2`

## Step 2: Implementation (after the red run)
1. Lexer (`tokenizer.ts`), then parser (`parser.ts`), then the AST evaluator (`evaluator.ts`). Wire them in `index.ts` and widen the Zod whitelist.
2. Rewrite the internal unit tests to match the new shapes:
   - `tokenizer.test.ts`: tokens and positions
   - **new** `parser.test.ts`: AST shape, precedence and associativity, error messages with positions
   - `evaluator.test.ts`: the percent rule, Math Error branches, rounding
3. Iterate until green. Then run `npm run test:coverage`, `npm run build` and `tsc --noEmit`.

## Step 3: Docs and frontend touch-ups
- **README**: update the "Supported syntax" section (operators, precedence table, percent rule, Math Error list), remove the "Syntax Error until the advanced phase" notes in the Backend and Frontend sections, and update the test counts.
- **Frontend tests**: no code change is needed, since the keypad already sends `^ √ %`. Re-run the frontend suite to confirm nothing depended on the old Syntax Error behaviour.
- **Docs**: save this plan as `docs/advanced-logic-plan.md` with implementation notes added at the end, and add this prompt and its summary to `docs/conversation-log.md`.

## Verification
1. `cd Backend && npm test`: all suites green, including 197 fixture cases at both unit and API level.
2. `npm run test:coverage`: coverage stays at about 99% or above.
3. Run both servers and use the browser on :3000:
   - keyboard `2^10` Enter → 1,024
   - `s16` Enter → 4
   - `200+10%` Enter → 220
   - `s` `-` `4` Enter (via ±) → Math Error
   - `10^400` Enter → Math Error
4. Check by hand with curl: `{"expression":"2^3^2"}` → `{"result":512}`.

---

## Implementation notes
How the implementation differs from the plan, and what came out of it:
- **TDD cycle.** Fixtures first: `helpers.ts` (shared), `advancedExpressions.ts` (100 cases), and the phase-1 flips #90 and #91.
  - **Red:** 172 failing tests, as expected. They were the 2 flipped phase-1 cases plus the 72 result cases and 12 Math Error cases, each run at unit and API level. The 16 new Syntax Error cases already passed, because the old backend rejected those characters.
  - **Green:** the new pipeline passed all 395 fixture tests (197 cases × 2 levels, plus the integrity checks) on its first run.
- **In the parser, `exponent` reuses `signed`.** The plan's grammar defines `exponent` and `signed` with the same body (`'-' power | power`), so a separate method wasn't needed.
- **The percent rule lives in the evaluator, not the parser.** The AST keeps `percent` nodes as they are, and the `+`/`−` case checks whether the right operand is a percent (or a negated one).
- **Error messages now carry 1-based positions,** for example `Unexpected "+" at position 3`, `Invalid character "a" at position 3` and `Malformed number "1.2.3" at position 1`.
- **Internal tests were rewritten** (`tokenizer.test.ts`, `evaluator.test.ts`), and `parser.test.ts` is new. It covers AST shape, precedence, associativity and error positions.
- **Result:** the backend has **448 tests passing**, with 100% statement and line coverage and 98.8% branch coverage. `tsc` and `npm run build` are clean. The frontend suite (146 tests) still passes with no changes.
- **Checked end to end:**

  | Where | Input | Result |
  |---|---|---|
  | curl | `2^3^2` | 512 |
  | curl | `200+10%` | 220 |
  | curl | `√-4` | Math Error |
  | curl | `10^400` | Math Error |
  | Chrome, keyboard only | `2^10` Enter | 1,024 |
  | Chrome, keyboard only | `s16` Enter | 4 |
  | Chrome, keyboard only | `200+10%` Enter | 220 |
  | Chrome, keyboard only | `10^400` Enter | Math Error |

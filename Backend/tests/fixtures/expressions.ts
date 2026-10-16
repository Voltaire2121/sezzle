/**
 * Source of truth for the phase-1 calculator behaviour (written before the implementation).
 * The backend is "done" when every case here passes both at unit level and through the HTTP API.
 */

import { math, ok, sortById, syntax, type ExpressionCase } from './helpers';

export type { ExpressionCase } from './helpers';

const fiftyOnes = Array(50).fill('1').join('+'); // 99 chars
const tooLong = `${'1+'.repeat(50)}1`; // 101 chars

export const happyPath: ExpressionCase[] = [
  ok(1, '4+4', 8),
  ok(2, '10-3', 7),
  ok(3, '6*7', 42),
  ok(4, '8/2', 4),
  ok(5, '6×7', 42),
  ok(6, '8÷2', 4),
  ok(7, '0', 0),
  ok(8, '42', 42),
  ok(9, '3.5', 3.5),
  ok(10, '007+3', 10),
  ok(11, ' 4 + 4 ', 8),
  ok(12, '4 × 4 ÷ 2', 8),
  ok(13, '1000000*1000000', 1000000000000),
  ok(14, '123456789*0', 0),
  ok(15, '7/7', 1),
  ok(16, '0/5', 0),
  ok(17, '1-1', 0),
  ok(18, '5/2', 2.5),
  ok(19, '1-2', -1),
];

export const precedence: ExpressionCase[] = [
  ok(20, '2+3*4', 14),
  ok(21, '10-2*3', 4),
  ok(22, '8/2*4', 16),
  ok(23, '100/10/2', 5),
  ok(24, '2*3+4*5', 26),
  ok(25, '10-4-3', 3),
  ok(26, '1+2*3-4/2', 5),
  ok(27, '2*3*4', 24),
  ok(28, '20/4+3', 8),
];

export const unaryMinus: ExpressionCase[] = [
  ok(29, '-5', -5),
  ok(30, '-4+8', 4),
  ok(31, '-5-5', -10),
  ok(32, '4+-8', -4),
  ok(33, '4--8', 12),
  ok(34, '4*-2', -8),
  ok(35, '8/-2', -4),
  ok(36, '-2*-3', 6),
  ok(37, '-0', 0),
  ok(38, '0*-1', 0),
  ok(39, '-0.5+0.5', 0),
  ok(40, '4 - -8', 12),
  ok(41, '-3.5*2', -7),
];

export const decimals: ExpressionCase[] = [
  ok(42, '0.1+0.2', 0.3),
  ok(43, '0.3-0.1', 0.2),
  ok(44, '0.1*3', 0.3),
  ok(45, '1/3', 0.333333333333),
  ok(46, '2/3', 0.666666666667),
  ok(47, '10/3', 3.33333333333),
  ok(48, '1.005*1000', 1005),
  ok(49, '.5+.5', 1),
  ok(50, '5.+1', 6),
  ok(51, '2.5*4', 10),
  ok(52, '1.5+1.5', 3),
  ok(53, fiftyOnes, 50),
];

/** Phase 1 expected Syntax Error for these; the advanced-logic phase made them real operations. */
export const nowSupported: ExpressionCase[] = [ok(90, '√4', 2), ok(91, '2^3', 8)];

export const mathErrors: ExpressionCase[] = [
  math(54, '8/0'),
  math(55, '0/0'),
  math(56, '8÷0'),
  math(57, '1+2/0'),
  math(58, '8/0.0'),
  math(59, '8/-0'),
  math(60, '5*3/0+1'),
  math(61, '-8/0'),
];

export const syntaxErrors: ExpressionCase[] = [
  // Empty
  syntax(62, ''),
  syntax(63, '   '),
  // Operator misuse
  syntax(64, '4++4'),
  syntax(65, '4+'),
  syntax(66, '*4'),
  syntax(67, '/4'),
  syntax(68, '+4'),
  syntax(69, '4*/2'),
  syntax(70, '4//2'),
  syntax(71, '4**4'),
  syntax(72, '--4'),
  syntax(73, '4---8'),
  syntax(74, '-'),
  syntax(93, '4*+2'),
  syntax(94, '4 + + 4'),
  syntax(96, '4/-'),
  // Malformed numbers
  syntax(75, '4 4'),
  syntax(76, '1.2.3+56'),
  syntax(77, '1..2'),
  syntax(78, '.'),
  syntax(79, '-.'),
  syntax(80, '4+.'),
  // Invalid characters
  syntax(81, 'abc'),
  syntax(82, '4+a'),
  syntax(83, '1e5'),
  syntax(84, 'Infinity'),
  syntax(85, 'NaN'),
  syntax(86, '4,5'),
  syntax(87, '4+4='),
  syntax(95, '0x10'),
  // Parentheses are not supported; % is percent, never modulo
  syntax(88, '(4+4)'),
  syntax(89, '4%2'),
  // Limits and ordering
  syntax(92, tooLong, true),
  syntax(97, '8/0+'),
];

export const allCases: ExpressionCase[] = sortById([
  ...happyPath,
  ...precedence,
  ...unaryMinus,
  ...decimals,
  ...mathErrors,
  ...syntaxErrors,
  ...nowSupported,
]);

/**
 * Source of truth for the advanced-logic phase (power, square root, percent), written before the implementation.
 * Precedence, loosest to tightest: + −, × ÷, unary minus, ^ (right-associative), √, %.
 * Percent is iPhone-style: a bare percent on the right of + or − is a percent of the running left value.
 */

import { math, ok, sortById, syntax, type ExpressionCase } from './helpers';

export const power: ExpressionCase[] = [
  ok(1, '2^3', 8),
  ok(2, '2^10', 1024),
  ok(3, '5^0', 1),
  ok(4, '0^0', 1),
  ok(5, '0^5', 0),
  ok(6, '1^100', 1),
  ok(7, '2^-1', 0.5),
  ok(8, '2^-2', 0.25),
  ok(9, '4^0.5', 2),
  ok(10, '2^0.5', 1.41421356237),
  ok(11, '2^3^2', 512),
  ok(12, '2^3×2', 16),
  ok(13, '2×3^2', 18),
  ok(14, '1+2^3', 9),
  ok(15, '2^3-1', 7),
  ok(16, '10^15', 1000000000000000),
  ok(17, '0.5^2', 0.25),
  ok(18, '1.5^2', 2.25),
  ok(19, '-2^2', -4),
  ok(20, '4×-2^2', -16),
  ok(21, '2^-3^2', 0.001953125),
  ok(22, '-2^3', -8),
  ok(23, '10^-2', 0.01),
  ok(24, '27^0.5', 5.19615242271),
  ok(25, '100^0.5×2', 20),
  ok(26, '2^2^2^2', 65536),
  ok(27, '9^0.5+16^0.5', 7),
  ok(28, '2^1023', 8.98846567431e307),
  ok(29, '10^-400', 0), // underflow is allowed
  ok(30, '-3^2+10', 1),
];

export const squareRoot: ExpressionCase[] = [
  ok(31, '√4', 2),
  ok(32, '√9', 3),
  ok(33, '√2', 1.41421356237),
  ok(34, '√0', 0),
  ok(35, '√0.25', 0.5),
  ok(36, '√16+√9', 7),
  ok(37, '√16×√4', 8),
  ok(38, '√√16', 2),
  ok(39, '-√9', -3),
  ok(40, '10-√9', 7),
  ok(41, '√4^3', 8),
  ok(42, '2^√4', 4),
  ok(43, '√2×√2', 2),
  ok(44, '√1000000', 1000),
  ok(45, '√3', 1.73205080757),
  ok(46, '√9÷√9', 1),
  ok(47, '√ 9', 3),
  ok(48, '√16%', 0.4),
  ok(49, '√-0', 0),
  ok(50, '4×-√9', -12),
];

export const percent: ExpressionCase[] = [
  ok(51, '50%', 0.5),
  ok(52, '100%', 1),
  ok(53, '0%', 0),
  ok(54, '200+10%', 220),
  ok(55, '200-10%', 180),
  ok(56, '200×10%', 20),
  ok(57, '200÷10%', 2000),
  ok(58, '10%+5', 5.1),
  ok(59, '100+50-10%', 135),
  ok(60, '-50%', -0.5),
  ok(61, '200+-10%', 180),
  ok(62, '12.5%', 0.125),
  ok(63, '2^50%', 1.41421356237),
  ok(64, '50%×50%', 0.25),
  ok(65, '1+1%', 1.01),
  ok(66, '200+10%×2', 200.2), // "10%×2" is not a bare percent
  ok(67, '0.1%', 0.001),
];

export const combined: ExpressionCase[] = [
  ok(68, '√16+2^3×10%', 4.8),
  ok(69, '2^3+√16-50%', 6),
  ok(70, '-√16^0.5', -2),
  ok(71, '3×√4^2÷4', 3),
  ok(72, '1-2^2×3', -11),
];

export const mathErrors: ExpressionCase[] = [
  // Square root of a negative
  math(73, '√-4'),
  math(74, '√-0.01'),
  math(80, '√-9+1'),
  math(84, '√-√4'),
  // Division by zero
  math(75, '0^-1'),
  math(81, '5÷0%'),
  math(82, '0^-0.5'),
  // Overflow
  math(76, '10^400'),
  math(77, '2^1024'),
  math(78, '9^999'),
  math(79, '-10^309'),
  math(83, '10^308×10'),
];

export const syntaxErrors: ExpressionCase[] = [
  // Power misuse
  syntax(85, '^2'),
  syntax(86, '2^'),
  syntax(87, '2^^3'),
  syntax(100, '2^-'),
  // Root misuse
  syntax(88, '√'),
  syntax(89, '4√'),
  syntax(90, '2√9'), // no implicit multiplication
  syntax(91, '√+4'),
  // Percent misuse
  syntax(92, '%'),
  syntax(93, '50%%'),
  syntax(94, '%50'),
  syntax(95, '50%5'), // percent, never modulo
  // Parentheses are not supported
  syntax(96, '(2+3)^2'),
  syntax(97, '√(4)'),
  // Syntax wins over Math
  syntax(98, '√-4+'),
  // Only one unary minus in a row
  syntax(99, '--2^2'),
];

export const advancedCases: ExpressionCase[] = sortById([
  ...power,
  ...squareRoot,
  ...percent,
  ...combined,
  ...mathErrors,
  ...syntaxErrors,
]);

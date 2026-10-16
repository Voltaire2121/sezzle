import { evaluate } from './evaluator';
import { parse } from './parser';
import { tokenize } from './tokenizer';

/** Tokenizes, parses and evaluates a calculator expression such as "4+4", "2^3×-2" or "200+10%". */
export function calculate(expression: string): number {
  return evaluate(parse(tokenize(expression)));
}

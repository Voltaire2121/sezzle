import { ExpressionSyntaxError } from '../../errors/CalculatorError';
import type { Operator, Token } from './tokenizer';

export type BinaryOperator = '+' | '-' | '*' | '/' | '^';

export type Node =
  | { type: 'number'; value: number }
  | { type: 'percent'; value: number }
  | { type: 'negate'; operand: Node }
  | { type: 'sqrt'; operand: Node }
  | { type: 'binary'; operator: BinaryOperator; left: Node; right: Node };

/**
 * Recursive-descent parser. Precedence, loosest to tightest:
 *
 *   expression := term (('+' | '-') term)*
 *   term       := signed (('*' | '/') signed)*
 *   signed     := '-' power | power          one unary minus, looser than ^  (-2^2 = -4)
 *   power      := root ('^' exponent)?       right-associative               (2^3^2 = 512)
 *   exponent   := '-' power | power
 *   root       := '√' ('-')? root | percent   √√16, √-4 (Math Error later), √16%
 *   percent    := NUMBER '%'?
 */
class Parser {
  private index = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): Node {
    const node = this.expression();
    const leftover = this.peek();
    if (leftover) throw this.unexpected(leftover);
    return node;
  }

  private expression(): Node {
    let node = this.term();
    while (this.peekIs('+') || this.peekIs('-')) {
      const operator = this.next().value as BinaryOperator;
      node = { type: 'binary', operator, left: node, right: this.term() };
    }
    return node;
  }

  private term(): Node {
    let node = this.signed();
    while (this.peekIs('*') || this.peekIs('/')) {
      const operator = this.next().value as BinaryOperator;
      node = { type: 'binary', operator, left: node, right: this.signed() };
    }
    return node;
  }

  private signed(): Node {
    if (this.peekIs('-')) {
      this.next();
      return { type: 'negate', operand: this.power() };
    }
    return this.power();
  }

  private power(): Node {
    const base = this.root();
    if (!this.peekIs('^')) return base;
    this.next();
    return { type: 'binary', operator: '^', left: base, right: this.signed() }; // exponent := '-' power | power
  }

  private root(): Node {
    if (!this.peekIs('√')) return this.percent();
    this.next();
    if (this.peekIs('-')) {
      this.next();
      return { type: 'sqrt', operand: { type: 'negate', operand: this.root() } };
    }
    return { type: 'sqrt', operand: this.root() };
  }

  private percent(): Node {
    const token = this.peek();
    if (!token) throw new ExpressionSyntaxError('Expression is incomplete');
    if (token.type !== 'number') throw this.unexpected(token);
    this.next();

    if (this.peekIs('%')) {
      this.next();
      return { type: 'percent', value: token.value };
    }
    return { type: 'number', value: token.value };
  }

  private peek(): Token | undefined {
    return this.tokens[this.index];
  }

  private peekIs(operator: Operator): boolean {
    const token = this.peek();
    return token?.type === 'operator' && token.value === operator;
  }

  private next(): Token {
    return this.tokens[this.index++];
  }

  private unexpected(token: Token): ExpressionSyntaxError {
    return new ExpressionSyntaxError(`Unexpected "${token.value}" at position ${token.position}`);
  }
}

export function parse(tokens: Token[]): Node {
  return new Parser(tokens).parse();
}

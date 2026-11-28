// As expressões das condições (um recorte de JavaScript): texto → árvore. Usado para conferir e para traduzir.

export type Expr =
  | { t: 'number' | 'text'; raw: string }
  | { t: 'constant'; value: 'true' | 'false' | 'null' | 'undefined' }
  | { t: 'id'; name: string }
  | { t: 'member'; object: Expr; name: string; optional: boolean }
  | { t: 'index'; object: Expr; index: Expr; optional: boolean }
  | { t: 'call'; callee: Expr; args: Expr[]; optional: boolean }
  | { t: 'unary'; op: string; arg: Expr }
  | { t: 'binary'; op: string; left: Expr; right: Expr }
  | { t: 'cond'; test: Expr; yes: Expr; no: Expr }
  | { t: 'array'; items: Expr[] };

export class ExprError extends Error {
  /** Posição no texto, a partir de 0. */
  readonly at: number;
  /** JavaScript que pode estar certo, mas fica fora do recorte conferido. */
  readonly unsupported: boolean;
  constructor(message: string, at: number, unsupported = false) {
    super(message);
    this.name = 'ExprError';
    this.at = at;
    this.unsupported = unsupported;
  }
}

type Token = { kind: 'number' | 'text' | 'name' | 'punct' | 'end'; value: string; at: number };

const PUNCT = ['===', '!==', '...', '**=', '&&=', '||=', '??=', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '**', '=>', '++', '--', '+=', '-=', '*=', '/=', '%=', '(', ')', '[', ']', '{', '}', '.', ',', '?', ':', ';', '+', '-', '*', '/', '%', '<', '>', '!', '=', '&', '|', '^', '~', '`'];
const NUMBER = /^(?:0[xX][\da-fA-F]+|(?:\d+(?:_\d+)*(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)/;
const NAME = /^[\p{L}_$][\p{L}\p{N}_$]*/u;

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const rest = source.slice(i);
    const space = /^\s+/.exec(rest);
    if (space) {
      i += space[0].length;
      continue;
    }
    const quote = rest[0]!;
    if (quote === '"' || quote === "'") {
      let j = 1;
      while (j < rest.length && rest[j] !== quote) j += rest[j] === '\\' ? 2 : 1;
      if (j >= rest.length) throw new ExprError('Falta fechar as aspas.', i);
      tokens.push({ kind: 'text', value: rest.slice(0, j + 1), at: i });
      i += j + 1;
      continue;
    }
    const number = NUMBER.exec(rest);
    const name = number ? null : NAME.exec(rest);
    const punct = number || name ? undefined : PUNCT.find((p) => rest.startsWith(p));
    const value = number?.[0] ?? name?.[0] ?? punct;
    if (!value) throw new ExprError(`Caractere inesperado: "${quote}".`, i);
    if (value === '`') throw new ExprError('Texto com crases não é conferido.', i, true);
    tokens.push({ kind: number ? 'number' : name ? 'name' : 'punct', value, at: i });
    i += value.length;
  }
  tokens.push({ kind: 'end', value: '', at: source.length });
  return tokens;
}

/** Quanto maior, mais forte a ligação. */
const BINARY: Record<string, number> = {
  '??': 1, '||': 1, '&&': 2, '|': 3, '^': 4, '&': 5, '==': 6, '!=': 6, '===': 6, '!==': 6,
  '<': 7, '>': 7, '<=': 7, '>=': 7, in: 7, instanceof: 7, '+': 9, '-': 9, '*': 10, '/': 10, '%': 10, '**': 11,
};
const UNSUPPORTED_WORDS = new Set(['new', 'function', 'await', 'async', 'class', 'delete', 'void', 'yield']);
const KEYWORDS = new Set('break case catch const continue debugger default do else enum export extends finally for if import return switch throw try var while with'.split(' '));
const ASSIGN = new Set(['=', '+=', '-=', '*=', '/=', '%=', '**=', '&&=', '||=', '??=', '++', '--']);
const MAX_DEPTH = 100;

export function parseExpr(source: string): Expr {
  const tokens = tokenize(source);
  let i = 0;
  let depth = 0;
  const peek = () => tokens[i]!;
  const take = () => tokens[i++]!;
  const is = (value: string) => peek().kind === 'punct' && peek().value === value;
  const eat = (value: string) => is(value) && !!take();
  const expect = (value: string) => {
    if (!eat(value)) fail(`Falta "${value}".`);
  };
  const fail = (message: string): never => {
    const { value, at, kind } = peek();
    if (ASSIGN.has(value)) throw new ExprError(value === '=' ? '"=" atribui um valor; para comparar use "===".' : `"${value}" altera o dado; a condição só lê.`, at);
    if (value === '=>' || value === '{' || value === '...') throw new ExprError('Funções e objetos escritos dentro da expressão não são conferidos.', at, true);
    if (value === ';') throw new ExprError('Aqui cabe uma só expressão, sem ";".', at);
    throw new ExprError(kind === 'end' ? `${message} A expressão está incompleta.` : message, at);
  };

  const expression = (): Expr => {
    if (++depth > MAX_DEPTH) fail('Expressão funda demais.');
    const test = binary(1);
    let result = test;
    if (eat('?')) {
      const yes = expression();
      expect(':');
      result = { t: 'cond', test, yes, no: expression() };
    }
    depth--;
    return result;
  };

  const binary = (min: number): Expr => {
    let left = unary();
    for (;;) {
      const { value, kind } = peek();
      const power = (kind === 'punct' || value === 'in' || value === 'instanceof') && Object.hasOwn(BINARY, value) ? BINARY[value]! : 0;
      if (power < min) return left;
      take();
      // ** liga da direita para a esquerda
      left = { t: 'binary', op: value, left, right: binary(value === '**' ? power : power + 1) };
    }
  };

  const unary = (): Expr => {
    const { value, kind } = peek();
    if ((kind === 'punct' && (value === '!' || value === '-' || value === '+' || value === '~')) || (kind === 'name' && value === 'typeof')) {
      take();
      if (++depth > MAX_DEPTH) fail('Expressão funda demais.');
      const arg = unary();
      depth--;
      return { t: 'unary', op: value, arg };
    }
    return postfix();
  };

  const list = (close: string): Expr[] => {
    const items: Expr[] = [];
    while (!eat(close)) {
      items.push(expression());
      if (!eat(',')) {
        expect(close);
        break;
      }
    }
    return items;
  };

  const member = (object: Expr, optional: boolean): Expr => {
    if (peek().kind !== 'name') fail('Falta o nome do campo depois do ponto.');
    return { t: 'member', object, name: take().value, optional };
  };

  const postfix = (): Expr => {
    let result = primary();
    for (;;) {
      if (eat('.')) result = member(result, false);
      else if (eat('?.')) {
        if (eat('(')) result = { t: 'call', callee: result, args: list(')'), optional: true };
        else if (eat('[')) {
          result = { t: 'index', object: result, index: expression(), optional: true };
          expect(']');
        } else result = member(result, true);
      } else if (eat('(')) result = { t: 'call', callee: result, args: list(')'), optional: false };
      else if (eat('[')) {
        result = { t: 'index', object: result, index: expression(), optional: false };
        expect(']');
      } else return result;
    }
  };

  const primary = (): Expr => {
    const token = peek();
    if (token.kind === 'number' || token.kind === 'text') {
      take();
      return { t: token.kind, raw: token.value };
    }
    if (token.kind === 'name') {
      if (UNSUPPORTED_WORDS.has(token.value)) throw new ExprError(`"${token.value}" não é conferido numa condição.`, token.at, true);
      if (token.value === 'in' || token.value === 'instanceof') fail('Falta um valor antes.');
      if (KEYWORDS.has(token.value)) fail(`"${token.value}" é uma palavra da linguagem, não um dado.`);
      take();
      if (token.value === 'true' || token.value === 'false' || token.value === 'null' || token.value === 'undefined') return { t: 'constant', value: token.value };
      return { t: 'id', name: token.value };
    }
    if (eat('(')) {
      if (is(')')) throw new ExprError('Parênteses vazios.', token.at, tokens[i + 1]?.value === '=>');
      const inner = expression();
      expect(')');
      return inner;
    }
    if (eat('[')) return { t: 'array', items: list(']') };
    return fail('Falta um valor.');
  };

  const result = expression();
  if (peek().kind !== 'end') fail(`Sobrou "${peek().value}" no fim.`);
  return result;
}

/** As filhas diretas de uma expressão. */
export function parts(e: Expr): Expr[] {
  switch (e.t) {
    case 'member': return [e.object];
    case 'index': return [e.object, e.index];
    case 'call': return [e.callee, ...e.args];
    case 'unary': return [e.arg];
    case 'binary': return [e.left, e.right];
    case 'cond': return [e.test, e.yes, e.no];
    case 'array': return e.items;
    default: return [];
  }
}

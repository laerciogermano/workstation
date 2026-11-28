// O modelo que se edita: uma árvore imutável de funções e blocos, todos com identidade.

export type BlockType = 'if' | 'else' | 'switch' | 'case' | 'for' | 'while' | 'do-while' | 'try' | 'catch';
export type SourceKind = 'file' | 'person' | 'ai' | 'machine' | 'object';

export interface Source {
  kind: SourceKind;
  name: string;
  /** Só em `file`: o arquivo como objeto. */
  asObject?: boolean;
}

export type Pattern = 'factory' | 'singleton';

/**
 * Tipos de dado do Flow. `abstract` é o dado ainda sem valor; `object` é a caixa chaveada,
 * `list` a posicional, e `function` a função usada como dado.
 */
export type DataType = 'abstract' | 'text' | 'number' | 'boolean' | 'null' | 'function' | 'object' | 'list';

export interface Datum {
  name: string;
  type: DataType;
  /** Texto sem aspas, número, `true`/`false` ou o nome da função. */
  value?: string;
  /** Campos de `object` e itens de `list` (nomeados pela posição). */
  fields?: Datum[];
}

export type DataSide = 'in' | 'out' | 'data';

export interface FnNode {
  id: string;
  type: 'fn';
  name: string;
  in: Datum[];
  out: Datum[];
  /** Declarados na função: `const idade = 30`. */
  data: Datum[];
  /** Ausente: herda o arquivo mais próximo acima. `null`: função abstrata. */
  source?: Source | null;
  parallel?: boolean;
  visibility?: 'public' | 'private';
  pattern?: Pattern;
  children: FlowNode[];
}

export interface BlockNode {
  id: string;
  type: BlockType;
  /** Condição (`if`, `while`), valor (`switch`, `case`) ou coleção (`for`). */
  expr?: string;
  /** Variável do `for`. */
  item?: string;
  parallel?: boolean;
  children: FlowNode[];
}

export type FlowNode = FnNode | BlockNode;

export const isFn = (node: FlowNode): node is FnNode => node.type === 'fn';

let counter = 0;
export const newId = (): string => `n${Date.now().toString(36)}${(++counter).toString(36)}`;

export function fn(name: string, props: Partial<Omit<FnNode, 'type' | 'name'>> = {}): FnNode {
  return { id: newId(), type: 'fn', name, in: [], out: [], data: [], children: [], ...props };
}

export function block(type: BlockType, props: Partial<Omit<BlockNode, 'type'>> = {}): BlockNode {
  return { id: newId(), type, children: [], ...props };
}

export const BLOCK_TYPES: readonly BlockType[] = ['if', 'else', 'switch', 'case', 'for', 'while', 'do-while', 'try', 'catch'];
export const DATA_TYPES: readonly DataType[] = ['abstract', 'text', 'number', 'boolean', 'null', 'function', 'object', 'list'];
export const SOURCE_KINDS: readonly SourceKind[] = ['file', 'person', 'ai', 'machine', 'object'];

export const PATTERNS: readonly Pattern[] = ['factory', 'singleton'];

export const hasFields = (type: DataType) => type === 'object' || type === 'list';

export interface Found {
  node: FlowNode;
  parent: FlowNode | null;
  /** Posição entre as irmãs. */
  index: number;
  /** Da raiz até o próprio nó. */
  path: FlowNode[];
}

export function find(root: FlowNode, id: string): Found | null {
  const stack: Found[] = [{ node: root, parent: null, index: 0, path: [root] }];
  while (stack.length) {
    const found = stack.pop()!;
    if (found.node.id === id) return found;
    found.node.children.forEach((node, index) => stack.push({ node, parent: found.node, index, path: [...found.path, node] }));
  }
  return null;
}

export function walk(root: FlowNode, visit: (node: FlowNode) => void): void {
  const stack = [root];
  while (stack.length) {
    const node = stack.pop()!;
    visit(node);
    for (let i = node.children.length - 1; i >= 0; i--) stack.push(node.children[i]!);
  }
}

/** Nomes de dados e de funções do fluxo, para sugerir ligações. */
export function names(root: FlowNode): { data: Datum[]; functions: string[] } {
  const data = new Map<string, Datum>();
  const functions = new Set<string>();
  const learn = (d: Datum) => {
    const known = data.get(d.name);
    if (!known || (known.type === 'abstract' && d.type !== 'abstract')) data.set(d.name, d);
  };
  walk(root, (node) => {
    if (isFn(node)) {
      functions.add(node.name);
      [...node.data, ...node.out, ...node.in].forEach(learn);
    } else if (node.type === 'for' && node.item) learn({ name: node.item, type: 'abstract' });
  });
  return { data: [...data.values()], functions: [...functions] };
}

/** Primeiro nome livre: `funcao`, `funcao2`, `funcao3`… */
export function freeName(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  let i = 2;
  while (used.has(`${base}${i}`)) i++;
  return `${base}${i}`;
}

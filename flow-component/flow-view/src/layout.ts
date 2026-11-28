// Árvore → linhas e passos. Cálculo puro (sem DOM), em uma passada e sem recursão.
//
// Regras do Flow (flow-oriented-programming.com):
//  - só a folha ocupa um passo; quem tem filhas cobre o tempo delas;
//  - irmãs sequenciais ocupam passos consecutivos; paralelas, o mesmo passo;
//  - o passo seguinte só começa quando todas as paralelas terminam;
//  - `else` vem depois do `if` e `catch` depois do `try` (como no editor FOP); com `elseParallel`, o `else` ocupa o passo do `if`;
//  - um bloco que abre um `else` ou `catch` começa um passo depois dele;
//  - os `case` de um `switch` ocupam o mesmo passo.
import type { BlockType, Data, DataLink, DataPoint, FlowBlock, FlowFunction, FlowLayout, FlowNode, LayoutOptions, Row, Source, StateItem } from './types.ts';

export const INDENT_LIMIT = 14;
const BLOCKS = new Set<string>(['if', 'else', 'switch', 'case', 'for', 'while', 'do-while', 'try', 'catch']);

export class FlowError extends Error {
  readonly path: string;
  constructor(message: string, path: string) {
    super(`${message} (em ${path})`);
    this.name = 'FlowError';
    this.path = path;
  }
}

type NamedData = { name: string; value?: string; fields?: NamedData[]; isFunction?: boolean };
type Pending = { row: Row; input?: NamedData; output?: NamedData; declared: NamedData[] };
type Frame = {
  items: FlowNode[];
  next: number;
  cursor: number;
  firstStart: number;
  prevStart: number;
  prevType: string | null;
  parent: number;
  parentType: string | null;
  path: string;
  node: object | null;
  /** arquivo herdado por quem não indica responsável */
  file: Source;
};

const MAX_FIELD_DEPTH = 8;

function dataList(list: unknown, path: string, depth = 0): NamedData[] {
  if (list === undefined) return [];
  if (!Array.isArray(list)) throw new FlowError('"in", "out" e "fields" precisam ser listas', path);
  if (depth > MAX_FIELD_DEPTH) throw new FlowError('objeto fundo demais (ou com ciclo)', path);
  return list.map((d: Data) => {
    const name = typeof d === 'string' ? d : d?.name;
    if (typeof name !== 'string' || !name) throw new FlowError('dado sem nome', path);
    if (typeof d === 'string') return { name };
    const fields = d.fields === undefined ? undefined : dataList(d.fields, path, depth + 1);
    // objeto não tem valor próprio: os valores são dos campos
    if (fields?.length) return { name, fields };
    return { name, value: d.value === undefined ? undefined : String(d.value), ...(d.function ? { isFunction: true } : {}) };
  });
}

const slug = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'function';

/** "Uma função tem, no máximo, uma entrada e uma saída": vários dados formam um objeto (input_x, output_x). */
function asOne(list: NamedData[], side: 'input' | 'output', fn: string): NamedData | undefined {
  return list.length > 1 ? { name: `${side}_${slug(fn)}`, fields: list } : list[0];
}

export const blockLabel = (type: BlockType, label = ''): string => {
  if (type === 'else') return 'else';
  if (type === 'try') return 'try';
  if (type === 'catch') return 'catch';
  if (type === 'case') return label ? `case ${label}` : 'case';
  if (type === 'do-while') return label ? `do-while (${label})` : 'do-while';
  return label ? `${type} (${label})` : type;
};

/** A variável de um `for (item of itens)`. */
export const loopVariable = (label = ''): string | undefined => label.match(/^\s*([\p{L}_$][\p{L}\p{N}_$]*)\s+(?:of|in)\s/u)?.[1];

export function layoutFlow(tree: FlowNode, options: LayoutOptions = {}): FlowLayout {
  const rows: Row[] = [];
  const pending: Pending[] = [];
  const loopVars: { name: string; since: number }[] = [];
  /** nós no caminho atual, para detectar ciclos */
  const open = new Set<object>();
  const rootSource: Source = { kind: 'file', name: (tree as FlowFunction)?.name ?? 'main' };
  let maxDepth = 0;
  let labelWidth = 0;
  let leafWidth = 0;

  const stack: Frame[] = [{ items: [tree], next: 0, cursor: 0, firstStart: 0, prevStart: 0, prevType: null, parent: -1, parentType: null, path: 'raiz', node: null, file: rootSource }];

  while (stack.length) {
    const frame = stack.at(-1)!;
    if (frame.next === frame.items.length) {
      stack.pop();
      if (frame.node) open.delete(frame.node);
      if (frame.parent >= 0) {
        const row = rows[frame.parent]!;
        row.end = Math.max(frame.cursor, row.start + 1);
        row.last = rows.length - 1;
        const above = stack.at(-1)!;
        above.cursor = Math.max(above.cursor, row.end);
      }
      continue;
    }

    const i = frame.next++;
    const node = frame.items[i]!;
    const path = frame.parent < 0 ? 'raiz' : `${frame.path}.children[${i}]`;
    if (!node || typeof node !== 'object') throw new FlowError('nó inválido', path);
    if (open.has(node)) throw new FlowError('a árvore tem um ciclo', path);
    const type = node.type ?? 'fn';
    if (type !== 'fn' && !BLOCKS.has(type)) throw new FlowError(`tipo desconhecido: "${String(type)}"`, path);
    if (type === 'fn' && (typeof (node as FlowFunction).name !== 'string' || !(node as FlowFunction).name)) throw new FlowError('função sem nome', path);
    if (node.children !== undefined && !Array.isArray(node.children)) throw new FlowError('"children" precisa ser uma lista', path);
    if (type === 'else' && frame.prevType !== 'if') throw new FlowError('"else" precisa vir logo depois de um "if"', path);
    if (type === 'catch' && frame.prevType !== 'try') throw new FlowError('"catch" precisa vir logo depois de um "try"', path);

    let start = frame.cursor;
    if (frame.parentType === 'switch' && i > 0) start = frame.firstStart;
    else if ((type === 'else' && options.elseParallel) || (node.parallel && frame.prevType !== null)) start = frame.prevStart;
    if (i === 0) frame.firstStart = start;

    const parent = frame.parent >= 0 ? rows[frame.parent]! : null;
    const depth = parent ? parent.depth + 1 : 0;
    const isFn = type === 'fn';
    const fn = node as FlowFunction;
    const source = !isFn || fn.source === null ? null : (fn.source ?? frame.file);
    const name = isFn ? fn.name : blockLabel(type as BlockType, (node as FlowBlock).label);
    const children = node.children ?? [];
    const row: Row = {
      index: rows.length, node, parent: frame.parent, last: rows.length, depth,
      nest: parent ? parent.nest + (parent.kind === 'fn' ? 0 : 1) : 0,
      kind: type, name, start, end: start + 1,
      composite: children.length > 0,
      abstract: isFn && fn.source === null,
      source,
    };
    const visibility = isFn && (fn.visibility === 'public' || fn.visibility === 'private') ? fn.visibility : undefined;
    const pattern = isFn && (fn.pattern === 'factory' || fn.pattern === 'singleton') ? fn.pattern : undefined;
    // largura da linha na coluna das funções, em caracteres: recuo, seta e marca, nome e o que vem depois dele
    const lead = isFn ? (children.length ? 6 : 3) : type === 'else' ? 17 : type === 'catch' ? 26 : 6;
    const after = (visibility ? 3 : 0) + (pattern ? pattern.length + 1 : 0) + (node.parallel ? 2 : 0);
    labelWidth = Math.max(labelWidth, Math.min(depth, INDENT_LIMIT) * 4 + lead + (type === 'else' || type === 'catch' ? 0 : name.length) + after);
    if (isFn && !children.length) leafWidth = Math.max(leafWidth, name.length);
    if (node.parallel) row.parallel = true;
    if (visibility) row.visibility = visibility;
    if (pattern) row.pattern = pattern;
    rows.push(row);
    maxDepth = Math.max(maxDepth, depth);

    if (isFn) pending.push({ row, input: asOne(dataList(fn.in, path), 'input', name), output: asOne(dataList(fn.out, path), 'output', name), declared: dataList(fn.data, path) });
    if (type === 'for') {
      const variable = loopVariable((node as FlowBlock).label);
      if (variable) loopVars.push({ name: variable, since: start });
    }

    frame.prevStart = start;
    frame.prevType = type;
    if (children.length) {
      open.add(node);
      const file = source?.kind === 'file' ? source : frame.file;
      const first = children[0]?.type ?? 'fn';
      const inside = (type === 'else' || type === 'catch') && first !== 'fn' ? start + 1 : start;
      stack.push({ items: children, next: 0, cursor: inside, firstStart: inside, prevStart: inside, prevType: null, parent: row.index, parentType: type, path, node, file });
    } else frame.cursor = Math.max(frame.cursor, start + 1);
  }

  const state = buildState(rows, pending, loopVars);
  return { rows, steps: rows[0]!.end, state, links: dataLinks(pending), maxDepth, labelWidth, leafWidth };
}

/** Ligações de dado entre passos vizinhos: a folha que produz um nome e a que o recebe no passo seguinte. */
function dataLinks(pending: Pending[]): DataLink[] {
  const names = (d: NamedData | undefined, into: string[] = []): string[] => {
    if (d) {
      into.push(d.name);
      d.fields?.forEach((f) => names(f, into));
    }
    return into;
  };
  /** quem produz cada nome em cada limite de passo, na ordem do fluxo */
  const made = new Map<string, number>();
  const links = new Map<string, DataLink>();
  for (const { row, input, output } of pending) {
    if (row.composite) continue;
    for (const name of names(input)) {
      const from = made.get(`${row.start} ${name}`);
      if (from === undefined) continue;
      const key = `${from} ${row.index}`;
      const link = links.get(key) ?? { from, to: row.index, names: [] };
      link.names.push(name);
      links.set(key, link);
    }
    for (const name of names(output)) made.set(`${row.end} ${name}`, row.index);
  }
  return [...links.values()];
}

/** O estado: funções disponíveis desde s0 e cada dado (objetos com os campos) a partir do passo em que passa a existir. */
function buildState(rows: Row[], pending: Pending[], loopVars: { name: string; since: number }[]): StateItem[] {
  const functions = new Map<string, StateItem>();
  for (const r of rows) {
    if (r.kind === 'fn' && !functions.has(r.name)) functions.set(r.name, { name: r.name, kind: 'function', level: 0, solid: !r.abstract, since: 0, catalog: true });
  }

  type Info = { since: number; solid: boolean; value?: string; fields?: NamedData[]; isFunction?: boolean; shared?: boolean };

  /** arquivos como objeto: cada um é uma caixa que guarda as funções e os dados declarados nele */
  const boxes = new Map<string, { functions: Map<string, StateItem>; data: Set<string> }>();
  for (const r of rows) if (r.source?.kind === 'file' && r.source.asObject) boxes.set(r.source.name, { functions: new Map(), data: new Set() });
  if (boxes.size) {
    // o arquivo de uma linha é o dela ou, se ela não é um arquivo, o da função acima
    const fileOf: (string | undefined)[] = [];
    for (const r of rows) fileOf[r.index] = r.source?.kind === 'file' ? r.source.name : fileOf[r.parent];
    for (const { row, declared } of pending) {
      const box = boxes.get(fileOf[row.index] ?? '');
      if (!box || !row.source) continue;
      const item = functions.get(row.name)!;
      box.functions.set(row.name, item);
      declared.forEach((d) => box.data.add(d.name));
    }
  }
  /** tudo que tem endereço conhecido, inclusive campos de objetos */
  const known = new Map<string, Info>();
  /** o que aparece como linha própria do estado */
  const own = new Map<string, Info>();

  const learn = (d: NamedData, since: number, solid: boolean) => {
    const info = known.get(d.name);
    if (!info) known.set(d.name, { since, solid, value: d.value, fields: d.fields });
    else {
      info.since = Math.min(info.since, since);
      info.solid ||= solid;
      info.value ??= d.value;
      info.fields ??= d.fields;
    }
    const result = known.get(d.name)!;
    if (d.isFunction) result.isFunction = true;
    return result;
  };
  const produce = (d: NamedData, since: number) => {
    learn(d, since, true);
    d.fields?.forEach((f) => produce(f, since));
  };

  for (const v of loopVars) own.set(v.name, learn({ name: v.name }, v.since, true));
  // um dado declarado existe desde o começo da função que o declara
  for (const { row, declared } of pending) {
    for (const d of declared) {
      const solidify = (x: NamedData) => {
        learn(x, row.start, x.value !== undefined || !!x.fields || (functions.get(x.name)?.solid ?? false));
        x.fields?.forEach(solidify);
      };
      solidify(d);
      own.set(d.name, known.get(d.name)!);
    }
  }
  // um dado produzido existe quando quem o produz termina
  for (const { row, output } of pending) {
    if (!output) continue;
    produce(output, row.end);
    own.set(output.name, known.get(output.name)!);
    if (row.pattern === 'singleton') known.get(output.name)!.shared = true;
  }

  /** objeto montado por quem consome: existe quando todos os campos existem; sem origem, o campo vem de fora (s0) */
  const gather = (d: NamedData): Info => {
    if (!d.fields) {
      const info = known.get(d.name);
      if (info) {
        info.value ??= d.value;
        info.solid ||= d.value !== undefined;
        return info;
      }
      return learn(d, 0, d.value !== undefined || (functions.get(d.name)?.solid ?? false));
    }
    const parts = d.fields.map(gather);
    const info = known.get(d.name);
    if (info) {
      info.fields ??= d.fields;
      return info;
    }
    return learn(d, Math.max(...parts.map((p) => p.since)), parts.every((p) => p.solid));
  };
  // o que ninguém produz vem de quem chama o fluxo, ou é montado com o que já existe
  for (const { input } of pending) {
    if (!input || (!input.fields && functions.has(input.name))) continue;
    const already = known.has(input.name);
    const info = gather(input);
    if (!already) own.set(input.name, info);
  }

  const lines = (name: string, info: Info, level: number, since: number, seen: Set<string>): StateItem[] => {
    const fields = seen.has(name) ? undefined : info.fields;
    const head: StateItem = { name, level, since, solid: info.solid, kind: fields ? 'object' : info.isFunction || functions.has(name) ? 'function' : 'data' };
    if (info.shared) head.shared = true;
    if (!fields) return [info.value === undefined ? head : { ...head, value: info.value }];
    const inside = new Set(seen).add(name);
    return [head, ...fields.flatMap((f) => {
      const field = known.get(f.name) ?? { since, solid: functions.get(f.name)?.solid ?? false };
      return lines(f.name, { ...field, value: f.value ?? field.value, fields: f.fields ?? field.fields }, level + 1, since, inside);
    })];
  };

  const point = (d: NamedData | undefined): DataPoint | undefined => {
    if (!d) return undefined;
    const info = known.get(d.name);
    const object = !!(d.fields ?? info?.fields);
    const fn = functions.get(d.name);
    const result: DataPoint = {
      name: d.name,
      kind: object ? 'object' : fn || info?.isFunction ? 'function' : 'data',
      solid: (fn && !object ? fn.solid : info?.solid) ?? d.value !== undefined,
    };
    if (info?.shared) result.shared = true;
    return result;
  };
  for (const p of pending) {
    p.row.in = point(p.input);
    p.row.out = point(p.output);
  }
  // funções primeiro; dados por passo (sort estável), cada objeto seguido dos campos
  const groups = [...own].sort((a, b) => a[1].since - b[1].since);
  // o que está guardado num arquivo-objeto aparece dentro da caixa dele, não solto no estado
  const inBox = new Set<string>();
  const boxed = new Set<string>();
  const files = [...boxes].flatMap(([file, box]) => {
    const head: StateItem = { name: file, kind: 'object', level: 0, solid: true, since: 0 };
    const inside = [...box.functions.values()].map((f) => {
      inBox.add(f.name);
      const { catalog: _, ...inside } = f; // dentro da caixa, a função é conteúdo dela
      return { ...inside, level: 1 };
    });
    const data = groups.filter(([name, info]) => box.data.has(name) && info.since === 0 && !boxed.has(name));
    return [head, ...inside, ...data.flatMap(([name, info]) => {
      boxed.add(name);
      return lines(name, info, 1, 0, new Set());
    })];
  });
  return [
    ...[...functions.values()].filter((f) => !inBox.has(f.name)),
    ...files,
    ...groups.filter(([name]) => !boxed.has(name)).flatMap(([name, info]) => lines(name, info, 0, info.since, new Set())),
  ];
}

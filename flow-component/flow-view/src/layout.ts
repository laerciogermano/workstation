// Árvore → linhas e passos. Cálculo puro (sem DOM), em uma passada e sem recursão.
//
// Regras do Flow (flow-oriented-programming.com):
//  - só a folha ocupa um passo; quem tem filhas cobre o tempo delas;
//  - irmãs sequenciais ocupam passos consecutivos; paralelas, o mesmo passo;
//  - o passo seguinte só começa quando todas as paralelas terminam;
//  - `else` ocupa o passo do `if`; os `case` de um `switch` ocupam o mesmo passo;
//  - `catch` vem depois do `try`.
import type { BlockType, Data, DataPoint, FlowBlock, FlowFunction, FlowLayout, FlowNode, Row, Source, StateItem } from './types.ts';

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
  if (type === 'else') return 'else · senão';
  if (type === 'try') return 'try';
  if (type === 'catch') return 'catch';
  if (type === 'case') return label ? `case ${label}` : 'case';
  if (type === 'do-while') return label ? `do-while (${label})` : 'do-while';
  return label ? `${type} (${label})` : type;
};

export function layoutFlow(tree: FlowNode): FlowLayout {
  const rows: Row[] = [];
  const pending: Pending[] = [];
  const loopVars: { name: string; since: number }[] = [];
  /** nós no caminho atual, para detectar ciclos */
  const open = new Set<object>();
  const rootSource: Source = { kind: 'file', name: (tree as FlowFunction)?.name ?? 'main' };
  let maxDepth = 0;
  let labelWidth = 0;

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
    else if (type === 'else' || (node.parallel && frame.prevType !== null)) start = frame.prevStart;
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
    rows.push(row);
    maxDepth = Math.max(maxDepth, depth);
    labelWidth = Math.max(labelWidth, Math.min(depth, INDENT_LIMIT) * 2 + name.length);

    if (isFn) pending.push({ row, input: asOne(dataList(fn.in, path), 'input', name), output: asOne(dataList(fn.out, path), 'output', name), declared: dataList(fn.data, path) });
    if (type === 'for') {
      const variable = (node as FlowBlock).label?.match(/^\s*([\p{L}_$][\p{L}\p{N}_$]*)\s+(?:of|in)\s/u)?.[1];
      if (variable) loopVars.push({ name: variable, since: start });
    }

    frame.prevStart = start;
    frame.prevType = type;
    if (children.length) {
      open.add(node);
      const file = source?.kind === 'file' ? source : frame.file;
      stack.push({ items: children, next: 0, cursor: start, firstStart: start, prevStart: start, prevType: null, parent: row.index, parentType: type, path, node, file });
    } else frame.cursor = Math.max(frame.cursor, start + 1);
  }

  const state = buildState(rows, pending, loopVars);
  return { rows, steps: rows[0]!.end, state, maxDepth, labelWidth };
}

/** O estado: funções disponíveis desde s0 e cada dado (objetos com os campos) a partir do passo em que passa a existir. */
function buildState(rows: Row[], pending: Pending[], loopVars: { name: string; since: number }[]): StateItem[] {
  const functions = new Map<string, StateItem>();
  for (const r of rows) {
    if (r.kind === 'fn' && !functions.has(r.name)) functions.set(r.name, { name: r.name, kind: 'function', level: 0, solid: !r.abstract, since: 0 });
  }

  type Info = { since: number; solid: boolean; value?: string; fields?: NamedData[]; isFunction?: boolean };
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
    return {
      name: d.name,
      kind: object ? 'object' : fn || info?.isFunction ? 'function' : 'data',
      solid: (fn && !object ? fn.solid : info?.solid) ?? d.value !== undefined,
    };
  };
  for (const p of pending) {
    p.row.in = point(p.input);
    p.row.out = point(p.output);
  }
  // funções primeiro; dados por passo (sort estável), cada objeto seguido dos campos
  const groups = [...own].sort((a, b) => a[1].since - b[1].since);
  return [...functions.values(), ...groups.flatMap(([name, info]) => lines(name, info, 0, info.since, new Set()))];
}

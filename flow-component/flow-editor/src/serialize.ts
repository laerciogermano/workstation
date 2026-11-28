// JSON ↔ modelo. A leitura aceita o que vier de fora, confere tudo e completa o que falta.
import { BLOCK_TYPES, DATA_TYPES, newId, SOURCE_KINDS } from './model.ts';
import type { BlockType, Datum, DataType, FlowNode, FnNode, SourceKind } from './model.ts';
import { checkData, EditError } from './ops.ts';

const MAX_DEPTH = 100;

/** As chaves saem sempre na mesma ordem, venha o nó de onde vier. */
const ORDER = ['id', 'type', 'name', 'value', 'expr', 'item', 'kind', 'source', 'visibility', 'parallel', 'in', 'out', 'data', 'fields', 'children'];
const ordered = (_key: string, value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => ORDER.indexOf(a) - ORDER.indexOf(b)))
    : value;

export const toJson = (tree: FnNode): string => JSON.stringify(tree, ordered, 2);

export function fromJson(text: string): FnNode {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    throw new EditError(`JSON inválido: ${(error as Error).message}`);
  }
  const ids = new Set<string>();
  const fail = (message: string, path: string): never => {
    throw new EditError(`${message} (em ${path})`);
  };
  const object = (v: unknown, path: string): Record<string, unknown> =>
    v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : fail('esperado um objeto', path);
  const list = (v: unknown, path: string): unknown[] => (v === undefined ? [] : Array.isArray(v) ? v : fail('esperada uma lista', path));
  const text_ = (v: unknown) => (typeof v === 'string' ? v : undefined);

  const datum = (v: unknown, path: string, depth: number): Datum => {
    if (depth > MAX_DEPTH) fail('dados fundos demais', path);
    if (typeof v === 'string') return { name: v, type: 'abstract' };
    const o = object(v, path);
    const type = (o.type ?? (o.fields ? 'object' : 'abstract')) as DataType;
    if (!DATA_TYPES.includes(type)) fail(`tipo de dado desconhecido: "${String(o.type)}"`, path);
    return {
      name: text_(o.name) ?? fail('dado sem nome', path),
      type,
      value: o.value === undefined ? undefined : String(o.value),
      fields: o.fields === undefined ? undefined : list(o.fields, path).map((f, i) => datum(f, `${path}.fields[${i}]`, depth + 1)),
    };
  };
  const data = (v: unknown, path: string) => checkData(list(v, path).map((d, i) => datum(d, `${path}[${i}]`, 0)));

  const node = (v: unknown, path: string, depth: number): FlowNode => {
    if (depth > MAX_DEPTH) fail('árvore funda demais', path);
    const o = object(v, path);
    let id = text_(o.id);
    if (!id || ids.has(id) || !/^[\w-]+$/.test(id)) id = newId();
    ids.add(id);
    const children = list(o.children, path).map((c, i) => node(c, `${path}.children[${i}]`, depth + 1));
    const type = (o.type ?? 'fn') as 'fn' | BlockType;
    children.forEach((c, i) => {
      const at = `${path}.children[${i}]`;
      if (c.type === 'else' && children[i - 1]?.type !== 'if') fail('"else" precisa vir logo depois de um "if"', at);
      if (c.type === 'catch' && children[i - 1]?.type !== 'try') fail('"catch" precisa vir logo depois de um "try"', at);
      if ((c.type === 'case') !== (type === 'switch')) fail('"case" só existe dentro de "switch", e o "switch" só tem "case"', at);
    });
    const parallel = o.parallel === true || undefined;
    if (type !== 'fn') {
      if (!BLOCK_TYPES.includes(type)) fail(`tipo desconhecido: "${String(type)}"`, path);
      return { id, type, expr: text_(o.expr) ?? text_(o.label), item: text_(o.item), parallel, children };
    }
    const result: FnNode = {
      id, type, parallel, children,
      name: text_(o.name)?.trim() || fail('função sem nome', path),
      in: data(o.in, `${path}.in`),
      out: data(o.out, `${path}.out`),
      data: data(o.data, `${path}.data`),
    };
    if (o.source === null) result.source = null;
    else if (o.source !== undefined) {
      const s = object(o.source, `${path}.source`);
      if (!SOURCE_KINDS.includes(s.kind as SourceKind)) fail('responsável desconhecido', path);
      result.source = { kind: s.kind as SourceKind, name: text_(s.name) || fail('responsável sem nome', path) };
    }
    if (o.visibility === 'public' || o.visibility === 'private') result.visibility = o.visibility;
    return result;
  };

  const tree = node(raw, 'raiz', 0);
  if (tree.type !== 'fn') throw new EditError('A raiz precisa ser uma função.');
  return tree;
}

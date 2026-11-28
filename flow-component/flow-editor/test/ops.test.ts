import { describe, expect, it } from 'vitest';
import { layoutFlow } from '@flow/view';
import { apply, check, createEditor, find, fn, fromJson, isFn, toJson, toView } from '../src/index.ts';
import type { BlockNode, Command, FnNode, FlowNode, InsertKind, Where } from '../src/index.ts';

const start = () => fn('main', { id: 'root' });
const run = (tree: FnNode, ...commands: ((selected: string) => Command)[]) =>
  commands.reduce((state, make) => apply(state.tree, make(state.selected)), { tree, selected: tree.id });
const shape = (node: FlowNode): string => {
  const name = isFn(node) ? node.name : node.type;
  const mark = node.parallel ? '|' : '';
  return node.children.length ? `${mark}${name}(${node.children.map(shape).join(' ')})` : `${mark}${name}`;
};
const add = (kind: InsertKind, where: Where) => (target: string): Command => ({ type: 'insert', target, where, kind });

describe('criar', () => {
  it('cria função filha, irmã e paralela', () => {
    const { tree } = run(start(), add('fn', 'inside'), add('fn', 'after'), add('fn', 'parallel'));
    expect(shape(tree)).toBe('main(funcao funcao2 |funcao3)');
    expect(layoutFlow(toView(tree)).steps).toBe(2);
  });
  it('não altera a árvore recebida', () => {
    const tree = start();
    apply(tree, { type: 'insert', target: 'root', where: 'inside', kind: 'fn' });
    expect(tree.children).toEqual([]);
  });
  it('“antes” e “depois” não partem um grupo de paralelas', () => {
    const base = run(start(), add('fn', 'inside'), add('fn', 'parallel')).tree;
    const [a, b] = base.children;
    expect(shape(apply(base, { type: 'insert', target: a!.id, where: 'after', kind: 'for' }).tree)).toBe('main(funcao |funcao2 for)');
    expect(shape(apply(base, { type: 'insert', target: b!.id, where: 'before', kind: 'for' }).tree)).toBe('main(for funcao |funcao2)');
  });
  it('cria todos os blocos, e o fluxo continua desenhável', () => {
    for (const kind of ['if', 'ifelse', 'switch', 'for', 'while', 'do-while', 'try'] as const) {
      const { tree, selected } = run(start(), add(kind, 'inside'));
      expect(find(tree, selected)).not.toBeNull();
      expect(() => layoutFlow(toView(tree))).not.toThrow();
    }
  });
  it('não põe nada entre o if e o else', () => {
    const base = run(start(), add('ifelse', 'inside')).tree;
    const [head, other] = base.children;
    expect(shape(apply(base, { type: 'insert', target: head!.id, where: 'after', kind: 'fn' }).tree)).toBe('main(if else funcao)');
    expect(shape(apply(base, { type: 'insert', target: other!.id, where: 'before', kind: 'fn' }).tree)).toBe('main(funcao if else)');
  });
  it('encadeia else if sem perder o senão', () => {
    const base = run(start(), add('ifelse', 'inside'));
    const other = base.tree.children[1]!;
    const filled = apply(base.tree, { type: 'insert', target: other.id, where: 'inside', kind: 'fn' }).tree;
    const once = apply(filled, { type: 'elseIf', target: base.selected }).tree;
    expect(shape(once)).toBe('main(if else(if else(funcao)))');
    const twice = apply(once, { type: 'elseIf', target: base.selected }).tree;
    expect(shape(twice)).toBe('main(if else(if else(if else(funcao))))');
  });
  it('adiciona case e catch só onde cabem', () => {
    const sw = run(start(), add('switch', 'inside'));
    expect(shape(apply(sw.tree, { type: 'case', target: sw.selected }).tree)).toBe('main(switch(case case case))');
    expect(check(sw.tree, { type: 'insert', target: sw.selected, where: 'inside', kind: 'fn' })).toMatch(/case/);
    const first = sw.tree.children[0]!.children[0]!;
    expect(check(sw.tree, { type: 'insert', target: first.id, where: 'after', kind: 'fn' })).toMatch(/case/);
    expect(check(sw.tree, { type: 'catch', target: sw.selected })).toMatch(/try/);
    const t = run(start(), add('try', 'inside'));
    expect(check(t.tree, { type: 'catch', target: t.selected })).toMatch(/já tem/);
  });
  it('a raiz não ganha irmãs nem sai', () => {
    expect(check(start(), { type: 'insert', target: 'root', where: 'after', kind: 'fn' })).toMatch(/raiz/);
    expect(check(start(), { type: 'remove', target: 'root' })).toMatch(/raiz/);
  });
});

describe('organizar', () => {
  const base = () => run(start(), add('fn', 'inside'), add('ifelse', 'after'), add('fn', 'after')).tree;
  it('remover o if leva o else; remover o else deixa o if', () => {
    const tree = base();
    expect(shape(apply(tree, { type: 'remove', target: tree.children[1]!.id }).tree)).toBe('main(funcao funcao2)');
    expect(shape(apply(tree, { type: 'remove', target: tree.children[2]!.id }).tree)).toBe('main(funcao if funcao2)');
  });
  it('mover leva a unidade inteira', () => {
    const tree = base();
    expect(shape(apply(tree, { type: 'move', target: tree.children[1]!.id, direction: 'up' }).tree)).toBe('main(if else funcao funcao2)');
    expect(shape(apply(tree, { type: 'move', target: tree.children[1]!.id, direction: 'down' }).tree)).toBe('main(funcao funcao2 if else)');
  });
  it('entra como filha e volta', () => {
    const tree = base();
    const inside = apply(tree, { type: 'move', target: tree.children[1]!.id, direction: 'in' });
    expect(shape(inside.tree)).toBe('main(funcao(if else) funcao2)');
    expect(shape(apply(inside.tree, { type: 'move', target: inside.selected, direction: 'out' }).tree)).toBe('main(funcao if else funcao2)');
  });
  it('sai de dentro de um case para depois do switch', () => {
    const sw = run(start(), add('switch', 'inside')).tree;
    const filled = apply(sw, { type: 'insert', target: sw.children[0]!.children[0]!.id, where: 'inside', kind: 'fn' });
    expect(shape(apply(filled.tree, { type: 'move', target: filled.selected, direction: 'out' }).tree)).toBe('main(switch(case case) funcao)');
  });
  it('envolve e desfaz', () => {
    const tree = base();
    for (const kind of ['if', 'switch', 'for', 'while', 'do-while', 'try', 'fn'] as const) {
      const wrapped = apply(tree, { type: 'wrap', target: tree.children[1]!.id, kind });
      expect(() => layoutFlow(toView(wrapped.tree))).not.toThrow();
      expect(wrapped.tree.children.length).toBeGreaterThanOrEqual(3);
    }
    const wrapped = apply(tree, { type: 'wrap', target: tree.children[0]!.id, kind: 'try' });
    expect(shape(wrapped.tree)).toBe('main(try(funcao) catch if else funcao2)');
    expect(shape(apply(wrapped.tree, { type: 'unwrap', target: wrapped.selected }).tree)).toBe(shape(tree));
  });
  it('duplica com identidades e nome novos', () => {
    const tree = base();
    const copy = apply(tree, { type: 'duplicate', target: tree.children[0]!.id });
    expect(shape(copy.tree)).toBe('main(funcao funcao3 if else funcao2)');
    expect(copy.selected).not.toBe(tree.children[0]!.id);
  });
});

describe('dados e propriedades', () => {
  it('entrada, saída e dado declarado aparecem no estado', () => {
    const { tree } = run(start(), add('fn', 'inside'),
      (target) => ({ type: 'setData', target, side: 'in', list: [{ name: 'valor', type: 'number', value: '21' }] }),
      (target) => ({ type: 'setData', target, side: 'out', list: [{ name: 'dobro', type: 'abstract' }] }),
      () => ({ type: 'setData', target: 'root', side: 'data', list: [{ name: 'nome', type: 'text', value: 'Ana' }, { name: 'aplicar', type: 'function' }] }));
    const state = layoutFlow(toView(tree)).state;
    expect(state.find((s) => s.name === 'valor')).toMatchObject({ value: '21', solid: true, since: 0 });
    expect(state.find((s) => s.name === 'nome')).toMatchObject({ value: '"Ana"', solid: true, since: 0 });
    expect(state.find((s) => s.name === 'aplicar')).toMatchObject({ kind: 'function' });
    expect(state.find((s) => s.name === 'dobro')).toMatchObject({ since: 1 });
  });
  it('recusa dado sem nome, repetido ou número que não é número', () => {
    const set = (list: Parameters<typeof check>[1] & { type: 'setData' }) => check(start(), list);
    const data = (...list: { name: string; type: 'number'; value?: string }[]) => set({ type: 'setData', target: 'root', side: 'in', list });
    expect(data({ name: ' ', type: 'number' })).toMatch(/nome/);
    expect(data({ name: 'a', type: 'number' }, { name: 'a', type: 'number' })).toMatch(/Já existe/);
    expect(data({ name: 'a', type: 'number', value: 'dez' })).toMatch(/número/);
  });
  it('troca o responsável, inclusive para abstrato e de volta ao herdado', () => {
    const machine = apply(start(), { type: 'update', target: 'root', patch: { source: { kind: 'machine', name: 'node' } } }).tree;
    expect(machine.source).toEqual({ kind: 'machine', name: 'node' });
    expect(apply(machine, { type: 'update', target: 'root', patch: { source: null } }).tree.source).toBeNull();
    expect('source' in apply(machine, { type: 'update', target: 'root', patch: { source: 'inherit' } }).tree).toBe(false);
  });
  it('a primeira irmã não pode ser paralela', () => {
    const { tree, selected } = run(start(), add('fn', 'inside'));
    expect(check(tree, { type: 'update', target: selected, patch: { parallel: true } })).toMatch(/paralela/);
  });
});

describe('histórico', () => {
  it('desfaz e refaz; comando recusado não entra', () => {
    const editor = createEditor(start());
    expect(editor.run({ type: 'insert', target: 'root', where: 'inside', kind: 'fn' }).ok).toBe(true);
    expect(editor.run({ type: 'remove', target: 'root' }).ok).toBe(false);
    editor.undo();
    expect(editor.state.tree.children).toEqual([]);
    expect(editor.state.selected).toBe('root');
    expect(editor.state.canUndo).toBe(false);
    editor.redo();
    expect(editor.state.tree.children).toHaveLength(1);
  });
});

describe('JSON', () => {
  it('vai e volta', () => {
    const { tree } = run(start(), add('ifelse', 'inside'), add('switch', 'after'));
    expect(toJson(fromJson(toJson(tree)))).toBe(toJson(tree));
  });
  it('aceita o formato curto do Flow View', () => {
    const tree = fromJson('{"name":"main","children":[{"name":"a","out":["x"]},{"type":"if","label":"x","children":[]}]}');
    expect((tree.children[0] as FnNode).out).toEqual([{ name: 'x', type: 'abstract' }]);
    expect((tree.children[1] as BlockNode).expr).toBe('x');
  });
  it('explica o que está errado', () => {
    expect(() => fromJson('{')).toThrow(/JSON inválido/);
    expect(() => fromJson('{"name":"m","children":[{"type":"else"}]}')).toThrow(/else/);
    expect(() => fromJson('{"name":"m","children":[{"type":"case"}]}')).toThrow(/case/);
    expect(() => fromJson('{"type":"if"}')).toThrow(/raiz/);
  });
});

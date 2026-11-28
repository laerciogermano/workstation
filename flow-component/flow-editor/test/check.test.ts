import { describe, expect, it } from 'vitest';
import { layoutFlow } from '@flow/view';
import { apply, block, diagnose, EXAMPLES, ExprError, fn, fromJson, parseExpr, toJson, toView } from '../src/index.ts';
import type { Datum, FlowNode, FnNode } from '../src/index.ts';

const bool: Datum = { name: 'ok', type: 'boolean', value: 'true' };
const flow = (children: FlowNode[], data: Datum[] = [bool]) => fn('main', { data, children });
const found = (tree: FnNode) => diagnose(tree).map((p) => `${p.level}: ${p.message}`);
const when = (expr: string, data?: Datum[]) => found(flow([block('if', { expr, children: [fn('a')] })], data));

describe('expressões', () => {
  it.each(['ok', '!ok', 'a.b?.c[0]', 'f(a, b)', 'a >= 1 && (b || !c)', 'x ?? 2', 'a ? b : c', '[1, 2]', '"a b" !== \'c\'', 'typeof a === "string"', '2 ** 3 ** 2', 'a in b', '1.5e3 + .5'])('aceita %s', (source) => {
    expect(() => parseExpr(source)).not.toThrow();
  });
  it.each(['', 'a &&', '(a', 'a b', 'a = 1', 'a++', '"a', 'a; b', ')', 'a..b', '#', 'in', '()', 'default', 'a && if'])('recusa “%s”', (source) => {
    expect(() => parseExpr(source)).toThrow(ExprError);
  });
  it.each(['itens.some(x => x)', '`oi`', 'new Date()', '{ a: 1 }', '() => 1'])('não confere “%s”, sem chamar de erro', (source) => {
    try {
      parseExpr(source);
      expect.unreachable();
    } catch (error) {
      expect((error as ExprError).unsupported).toBe(true);
    }
  });
  it('não estoura com texto fundo demais', () => expect(() => parseExpr('('.repeat(5000))).toThrow(ExprError));
});

describe('conferência', () => {
  it('os exemplos do FOP não têm erros nem avisos', () => {
    for (const e of EXAMPLES.flatMap((g) => g.examples)) expect(diagnose(e.tree()), e.key).toEqual([]);
  });
  it('condição certa não aponta nada', () => expect(when('ok')).toEqual([]));
  it('erro de sintaxe diz onde', () => expect(when('ok &&')[0]).toMatch(/^error: .*incompleta.*posição 6/));
  it('atribuição na condição', () => expect(when('ok = true')[0]).toContain('para comparar use "==="'));
  it('nome fora do estado', () => expect(when('outro')).toEqual(['warning: "outro" não está no estado neste ponto.']));
  it('campo que o objeto não tem', () => expect(when('p.idade > 1', [{ name: 'p', type: 'object', fields: [{ name: 'nome', type: 'text', value: 'a' }] }])).toContain('warning: "p" não tem o campo "idade".'));
  it('objeto como condição', () => expect(when('p', [{ name: 'p', type: 'object', fields: [] }])[0]).toContain('sempre verdadeira'));
  it('pede a variável antes do bloco', () => expect(when('ok && ok')).toEqual(['tip: No FOP, atribua a expressão a uma variável antes do bloco.']));
  it('a saída só vale depois de produzida', () => {
    const check = fn('verificar', { out: [{ name: 'pago', type: 'abstract' }] });
    const use = block('if', { expr: 'pago', children: [fn('a')] });
    expect(found(flow([check, use]))).toEqual([]);
    expect(found(flow([use, check]))[0]).toContain('"pago" não está no estado');
    expect(found(flow([check, { ...use, parallel: true }]))[0]).toContain('"pago" não está no estado');
  });
  it('do-while enxerga o que o corpo produz', () => {
    expect(found(flow([block('do-while', { expr: 'falta', children: [fn('t', { out: [{ name: 'falta', type: 'boolean', value: 'false' }] })] })]))).toEqual([]);
  });
  it('o item do for vale dentro dele', () => {
    const list: Datum = { name: 'itens', type: 'list', fields: [] };
    const inner = block('if', { expr: 'item', children: [fn('a')] });
    expect(found(flow([block('for', { item: 'item', expr: 'itens', children: [inner] })], [list]))).toEqual([]);
    expect(found(flow([block('for', { item: '1x', expr: 'ok', children: [fn('a')] })])).join(' ')).toMatch(/não serve de nome.*não é uma coleção/);
  });
  it('case repetido', () => {
    const tree = flow([block('switch', { expr: 'ok', children: [block('case', { expr: 'a' }), block('case', { expr: '"a"' })] })]);
    expect(found(tree)).toEqual(['error: Case repetido: "a".']);
  });
  it('padrão sem saída', () => expect(found(fn('main', { children: [fn('criar', { pattern: 'factory' })] }))[0]).toContain('adicione a saída'));
});

describe('arquivo como objeto, visibilidade e padrões', () => {
  const file = { kind: 'file', name: 'pedidos' } as const;
  const tree = () => fn('main', { children: [fn('ler', { source: { ...file }, data: [{ name: 'total', type: 'number', value: '2' }] }), fn('salvar', { source: { ...file } })] });
  it('marcar um vale para todos do mesmo arquivo, e a caixa guarda funções e dados', () => {
    const base = tree();
    const next = apply(base, { type: 'update', target: base.children[0]!.id, patch: { asObject: true } }).tree;
    expect((next.children[1] as FnNode).source!.asObject).toBe(true);
    const state = layoutFlow(toView(next)).state.map((s) => `${s.level} ${s.kind} ${s.name}`);
    expect(state).toEqual(['0 function main', '0 object pedidos', '1 function ler', '1 function salvar', '1 data total']);
    const off = apply(next, { type: 'update', target: next.children[1]!.id, patch: { asObject: false } }).tree;
    expect(JSON.stringify(off)).not.toContain('asObject');
  });
  it('quem muda para o arquivo-objeto entra na caixa', () => {
    const base = tree();
    base.children.push(fn('apagar'));
    const boxed = apply(base, { type: 'update', target: base.children[0]!.id, patch: { asObject: true } }).tree;
    const next = apply(boxed, { type: 'update', target: boxed.children[2]!.id, patch: { source: { ...file } } }).tree;
    expect((next.children[2] as FnNode).source!.asObject).toBe(true);
  });
  it('só arquivo vira objeto', () => {
    const base = tree();
    expect(() => apply(base, { type: 'update', target: base.id, patch: { asObject: true } })).toThrow('Só um responsável arquivo');
  });
  it('as marcas chegam ao desenho e passam pelo JSON', () => {
    const base = tree();
    const id = base.children[0]!.id;
    const next = apply(base, { type: 'update', target: id, patch: { visibility: 'private', pattern: 'singleton', asObject: true } }).tree;
    const withOut = apply(next, { type: 'setData', target: id, side: 'out', list: [{ name: 'config', type: 'abstract' }] }).tree;
    const layout = layoutFlow(toView(withOut));
    const row = layout.rows[1]!;
    expect([row.visibility, row.pattern, row.out!.shared]).toEqual(['private', 'singleton', true]);
    expect(layout.state.find((s) => s.name === 'config')!.shared).toBe(true);
    expect(toJson(fromJson(toJson(withOut)))).toBe(toJson(withOut));
  });
});

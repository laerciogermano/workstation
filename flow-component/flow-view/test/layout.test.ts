// As regras do Flow, com os exemplos do próprio flow-oriented-programming.com.
import { describe, expect, it } from 'vitest';
import { largeFlow, SAMPLES } from '../example/samples.js';
import { FlowError, layoutFlow, type FlowNode } from '../src/index.ts';

const steps = (tree: FlowNode) => layoutFlow(tree).rows.map((r) => `${r.name} ${r.start}-${r.end}`);
const sample = (k: keyof typeof SAMPLES) => SAMPLES[k].tree as FlowNode;
const f = (name: string, extra = {}) => ({ name, ...extra });

describe('passos', () => {
  it('irmãs sequenciais ocupam passos consecutivos e quem tem filhas cobre o tempo delas', () => {
    expect(steps(sample('estado'))).toEqual(['main 0-3', 'receber 0-1', 'cobrar 1-2', 'enviar 2-3']);
  });
  it('paralelas ocupam o mesmo passo', () => {
    expect(steps(sample('sequencial'))).toEqual(['main 0-3', 'ler 0-1', 'dobrar 1-2', 'triplicar 1-2', 'somar 2-3']);
  });
  it('o passo seguinte espera a paralela mais longa terminar', () => {
    const tree = f('main', { children: [f('longa', { children: [f('a'), f('b'), f('c')] }), f('curta', { parallel: true }), f('depois')] });
    expect(steps(tree)).toEqual(['main 0-4', 'longa 0-3', 'a 0-1', 'b 1-2', 'c 2-3', 'curta 0-1', 'depois 3-4']);
  });
  it('o else vem depois do if', () => {
    expect(steps(sample('ifElse'))).toEqual(['main 0-2', 'if (aprovada) 0-1', 'enviar 0-1', 'else 1-2', 'revisar 1-2']);
  });
  it('com elseParallel, if e else ocupam o mesmo passo', () => {
    const rows = layoutFlow(sample('ifElse'), { elseParallel: true }).rows.map((r) => `${r.name} ${r.start}-${r.end}`);
    expect(rows).toEqual(['main 0-1', 'if (aprovada) 0-1', 'enviar 0-1', 'else 0-1', 'revisar 0-1']);
  });
  it('um bloco que abre um else ou catch começa um passo depois dele', () => {
    const tree = f('main', { children: [{ type: 'try' as const, children: [f('a')] }, { type: 'catch' as const, children: [{ type: 'if' as const, label: 'ok', children: [f('b')] }] }] });
    expect(steps(tree)).toEqual(['main 0-3', 'try 0-1', 'a 0-1', 'catch 1-3', 'if (ok) 2-3', 'b 2-3']);
  });
  it('liga a saída de uma folha à entrada da folha do passo seguinte', () => {
    const layout = layoutFlow(f('main', { children: [f('ler', { out: ['x', 'y'] }), f('somar', { in: ['x', 'y'], out: ['z'] }), f('esperar'), f('usar', { in: ['z'] })] }));
    expect(layout.links).toEqual([{ from: 1, to: 2, names: ['x', 'y'] }]);
  });
  it('depois do if e else, o fluxo segue após o ramo mais longo', () => {
    const tree = f('main', { children: [{ type: 'if' as const, label: 'ok', children: [f('a')] }, { type: 'else' as const, children: [f('b'), f('c')] }, f('d')] });
    expect(steps(tree).at(-1)).toBe('d 3-4');
  });
  it('os cases de um switch ocupam o mesmo passo', () => {
    expect(steps(sample('switch'))).toEqual(['main 0-1', 'switch (meio) 0-1', 'case "pix" 0-1', 'pagarPix 0-1', 'case "cartao" 0-1', 'pagarCartao 0-1']);
  });
  it('blocos aninhados: o catch vem depois do try e o laço cobre os dois', () => {
    expect(steps(sample('blocos'))).toEqual(['main 0-2', 'for (item of itens) 0-2', 'try 0-1', 'enviar 0-1', 'catch 1-2', 'registrarFalha 1-2']);
  });
  it('árvore simples, só com nomes e filhos, vira um fluxo sequencial', () => {
    expect(steps({ name: 'Plano', children: [{ name: 'um' }, { name: 'dois' }] })).toEqual(['Plano 0-2', 'um 0-1', 'dois 1-2']);
    expect(steps({ name: 'só' })).toEqual(['só 0-1']);
  });
});

describe('dados e estado', () => {
  const at = (tree: FlowNode) => Object.fromEntries(layoutFlow(tree).state.map((s) => [s.name, [s.since, s.solid, s.value]]));

  it('cada dado existe a partir do passo em que a produtora termina', () => {
    expect(at(sample('sequencial'))).toEqual({
      main: [0, true, undefined], ler: [0, true, undefined], dobrar: [0, true, undefined], triplicar: [0, true, undefined], somar: [0, true, undefined],
      valor: [1, true, '21'], dobro: [2, true, '42'], triplo: [2, true, '63'], parcelas: [2, true, undefined], total: [3, true, '105'],
    });
  });
  it('objeto tem nome (cubo), aparece quando os campos existem e os lista como filhos', () => {
    const { rows, state } = layoutFlow(sample('sequencial'));
    expect(rows[4]!.in).toEqual({ name: 'parcelas', kind: 'object', solid: true });
    expect(rows[2]!.in).toEqual({ name: 'valor', kind: 'data', solid: true });
    const at = state.findIndex((s) => s.name === 'parcelas');
    expect(state.slice(at, at + 3).map((s) => [s.name, s.kind, s.level, s.since, s.value])).toEqual([
      ['parcelas', 'object', 0, 2, undefined], ['dobro', 'data', 1, 2, '42'], ['triplo', 'data', 1, 2, '63'],
    ]);
  });
  it('várias entradas ou saídas sem nome formam um objeto input_x ou output_x, nunca os nomes juntos', () => {
    const tree = f('main', { children: [f('criarCliente', { out: ['id', 'nome'] }), f('Enviar É-mail', { in: ['id', 'nome'] })] });
    const { rows, state } = layoutFlow(tree);
    expect(rows[1]!.out).toEqual({ name: 'output_criarcliente', kind: 'object', solid: true });
    expect(rows[2]!.in).toEqual({ name: 'input_enviar_e_mail', kind: 'object', solid: true });
    expect(state.filter((s) => s.kind !== 'function').map((s) => `${'  '.repeat(s.level)}${s.name}@${s.since}`)).toEqual([
      'output_criarcliente@1', '  id@1', '  nome@1', 'input_enviar_e_mail@1', '  id@1', '  nome@1',
    ]);
  });
  it('objeto produzido, com objeto dentro, consumido pelo nome', () => {
    const { rows, state } = layoutFlow(sample('objeto'));
    expect(rows[2]!.in).toEqual({ name: 'cliente', kind: 'object', solid: true });
    expect(state.filter((s) => s.kind !== 'function').map((s) => `${'  '.repeat(s.level)}${s.name}${s.value ? '=' + s.value : ''}`)).toEqual([
      'cliente', '  id=1', '  nome="Ana"', '  endereco', '    cidade="Campinas"', 'pontos=9',
    ]);
  });
  it('objeto com campos sem origem é abstrato e vem de quem chama', () => {
    const { rows, state } = layoutFlow(f('main', { children: [f('cobrar', { in: [{ name: 'pedido', fields: ['valor'] }] })] }));
    expect(rows[1]!.in).toEqual({ name: 'pedido', kind: 'object', solid: false });
    expect(state.find((s) => s.name === 'pedido')).toMatchObject({ since: 0, solid: false });
  });
  it('recusa objeto que contém a si mesmo', () => {
    const o: { name: string; fields: unknown[] } = { name: 'o', fields: [] };
    o.fields.push(o);
    expect(() => layoutFlow(f('m', { in: [o] }) as FlowNode)).toThrow(/fundo demais/);
  });
  it('dado que ninguém produz vem de quem chama: abstrato sem valor, sólido com valor', () => {
    expect(at(f('main', { children: [f('cobrar', { in: ['pedido'] })] })).pedido).toEqual([0, false, undefined]);
    expect(at(sample('abstrata')).nome).toEqual([0, true, '"Ana"']);
  });
  it('função abstrata é contorno; como entrada, é um círculo', () => {
    const [vender, hello] = layoutFlow(sample('abstrata')).rows;
    expect(vender!.in).toEqual({ name: 'hello', kind: 'function', solid: false });
    expect(hello).toMatchObject({ abstract: true, source: null });
    expect(vender).toMatchObject({ abstract: false, source: { kind: 'file', name: 'vendas' } });
  });
  it('a variável do laço existe desde o começo do bloco', () => {
    expect(at(f('main', { children: [f('a'), { type: 'for' as const, label: 'x of xs', children: [f('b', { in: ['x'] })] }] })).x).toEqual([1, true, undefined]);
  });
  it('quem não indica responsável herda o arquivo mais próximo acima, mesmo dentro de blocos', () => {
    const tree = f('empresa', { children: [f('vender', { source: { kind: 'file', name: 'vendas' }, children: [{ type: 'if' as const, label: 'ok', children: [f('cobrar')] }, f('ia', { source: { kind: 'ai', name: 'Claude' }, children: [f('resumir')] })] }), f('outra')] });
    expect(layoutFlow(tree).rows.filter((r) => r.kind === 'fn').map((r) => `${r.name}:${r.source!.name}`)).toEqual(['empresa:empresa', 'vender:vendas', 'cobrar:vendas', 'ia:Claude', 'resumir:vendas', 'outra:empresa']);
  });
  it('sem responsável indicado, a origem é o arquivo do fluxo', () => {
    expect(layoutFlow(sample('estado')).rows[1]!.source).toEqual({ kind: 'file', name: 'main' });
  });
  it('o estado vem ordenado: funções e depois dados por passo', () => {
    const { state } = layoutFlow(largeFlow(200) as FlowNode);
    const data = state.filter((s) => s.kind === 'data');
    expect(state.slice(-data.length)).toEqual(data);
    expect(data.map((d) => d.since)).toEqual(data.map((d) => d.since).sort((a, b) => a - b));
  });
});

describe('árvore inválida', () => {
  const cases: [string, unknown, RegExp][] = [
    ['sem nome', { children: [] }, /função sem nome \(em raiz\)/],
    ['tipo estranho', f('m', { children: [{ type: 'loop' }] }), /tipo desconhecido.*raiz\.children\[0\]/],
    ['else solto', f('m', { children: [{ type: 'else' }] }), /logo depois de um "if"/],
    ['catch solto', f('m', { children: [f('a'), { type: 'catch' }] }), /logo depois de um "try"/],
    ['filhos que não são lista', f('m', { children: {} }), /lista/],
    ['dado sem nome', f('m', { in: [''] }), /dado sem nome/],
  ];
  it.each(cases)('%s', (_name, tree, message) => {
    expect(() => layoutFlow(tree as FlowNode)).toThrow(FlowError);
    expect(() => layoutFlow(tree as FlowNode)).toThrow(message);
  });
  it('recusa ciclos, mas aceita o mesmo nó repetido em ramos diferentes', () => {
    const loop: { name: string; children: unknown[] } = { name: 'a', children: [] };
    loop.children.push(loop);
    expect(() => layoutFlow(loop as FlowNode)).toThrow(/ciclo/);
    const shared = f('mesmo');
    expect(layoutFlow(f('m', { children: [shared, shared] })).rows).toHaveLength(3);
  });
  it('não altera a árvore recebida', () => {
    const tree = SAMPLES.blocos.tree;
    const before = JSON.stringify(tree);
    layoutFlow(tree as FlowNode);
    expect(JSON.stringify(tree)).toBe(before);
  });
});

import { describe, expect, it } from 'vitest';
import { largeFlow, SAMPLES } from '../example/samples.js';
import { layoutFlow, metrics, renderSvg, visibleRows, type FlowNode, type Row } from '../src/index.ts';
import { positionOf } from '../src/collapse.ts';
import { HEAD, ROW } from '../src/render.ts';

const layout = layoutFlow(SAMPLES.blocos.tree);
const named = (...names: string[]) => (r: Row) => names.includes(r.name);
const names = (rows: readonly number[]) => rows.map((i) => layout.rows[i]!.name);
const texts = (svg: string) => [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);

describe('minimizar', () => {
  it('esconde a subárvore e mantém as irmãs', () => {
    const v = visibleRows(layout, named('try'));
    expect(names(v.rows)).toEqual(['main', 'for (item of itens)', 'try', 'catch', 'registrarFalha']);
    expect([...v.closed]).toEqual([2]);
    expect(names(visibleRows(layout, named('for (item of itens)', 'try')).rows)).toEqual(['main', 'for (item of itens)']);
  });
  it('folha marcada não conta como minimizada', () => {
    expect(visibleRows(layout, named('enviar')).closed.size).toBe(0);
  });
  it('acha a posição na tela', () => {
    expect([0, 2, 3, 4, 5, 6].map((i) => positionOf([0, 1, 2, 4, 5], i))).toEqual([0, 2, 3, 3, 4, 5]);
  });
  it('a linha minimizada continua no mesmo tempo, com a contagem do que esconde', () => {
    const v = visibleRows(layout, named('for (item of itens)'));
    const svg = renderSvg(layout, { visible: v, toggles: true });
    expect(texts(svg)).toContain('+4');
    expect(texts(svg)).not.toContain('enviar = 0');
    expect(svg).not.toContain('<title>try</title>');
    for (const s of ['s0', 's1', 's2']) expect(texts(svg)).toContain(s);
    expect(svg).toContain('aria-label="Expandir for (item of itens)"');
    expect(svg).toContain('aria-label="Minimizar main"');
    expect(metrics(layout, { visible: v }).height).toBe(metrics(layout).height - 4 * ROW);
    expect(metrics(layout, { visible: v }).width).toBe(metrics(layout).width);
  });
  it('sem as setas no SVG exportado', () => {
    expect(renderSvg(layout)).not.toContain('data-toggle');
  });
  it('desenha o trecho certo com milhares de linhas minimizadas', () => {
    const big = layoutFlow(largeFlow(20_000));
    const v = visibleRows(big, (r) => r.depth > 0);
    expect(v.rows).toHaveLength(1 + big.rows[0]!.node.children!.length);
    const position = Math.floor(v.rows.length / 2);
    const row = big.rows[v.rows[position]!]!;
    const view = { x: row.start * 160 - 200, y: position * ROW - 200, width: 1400, height: 800 };
    const svg = renderSvg(big, { view, visible: v, toggles: true });
    expect(texts(svg)).toContain(row.name);
    expect((svg.match(/<[a-z]/gi) ?? []).length).toBeLessThan(2500);
    expect(metrics(big, { visible: v }).height).toBeLessThan(HEAD + (v.rows.length + big.state.length) * ROW);
  });
  it('a árvore recebida fica ligada a cada linha', () => {
    const tree: FlowNode = { name: 'a', children: [{ id: 'x', name: 'b' }] };
    expect(layoutFlow(tree).rows[1]!.node).toBe(tree.children![0]);
  });
});

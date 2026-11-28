import { describe, expect, it } from 'vitest';
import { largeFlow, SAMPLES } from '../example/samples.js';
import { layoutFlow, metrics, renderSvg, type FlowNode } from '../src/index.ts';
import { availableAt, clip, HEAD, ROW, STEP } from '../src/render.ts';

const draw = (tree: FlowNode, options = {}) => renderSvg(layoutFlow(tree), { id: 't', ...options });
const count = (svg: string, tag: string) => svg.split(`<${tag}`).length - 1;
const texts = (svg: string) => [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);

describe('desenho', () => {
  it('mostra cabeçalho, passos, funções, dados e estado', () => {
    const found = texts(draw(SAMPLES.estado.tree as FlowNode));
    for (const t of ['SOURCE', 'FUNÇÃO', 's0', 's3', 'main', 'receber', 'cobrar', 'enviar', 'pedido', 'pagamento', 'envio']) expect(found).toContain(t);
    expect(found).not.toContain('s4');
  });
  it('ao lado do objeto vai só o nome; os campos ficam recuados abaixo dele no estado', () => {
    const svg = draw(SAMPLES.sequencial.tree as FlowNode);
    const found = texts(svg);
    expect(found).toContain('parcelas');
    expect(found.filter((t) => t!.includes(','))).toEqual([]);
    expect(found.filter((t) => t!.startsWith('parcelas'))).toEqual(['parcelas', 'parcelas', 'parcelas']); // entrada, s2 e s3
    const x = (label: string) => [...svg.matchAll(new RegExp(`<text x="([\\d.]+)" y="[\\d.]+">${label}</text>`, 'g'))].map((m) => Number(m[1]));
    expect(x('dobro = 42')[1]! - x('parcelas').at(-2)!).toBe(10);
  });
  it('barra preenchida para sólida e contorno para abstrata', () => {
    const svg = draw(SAMPLES.abstrata.tree as FlowNode);
    expect(svg).toMatch(/<rect class="fn-o"[^>]*rx="11"/);
    expect(texts(svg)).toContain('abstrato');
    expect(texts(svg)).toContain('nome = &quot;Ana&quot;');
  });
  it('blocos têm faixa, rótulo e marca na cor do tipo', () => {
    const svg = draw(SAMPLES.blocos.tree as FlowNode);
    for (const k of ['loop', 'try', 'catch']) expect(svg).toContain(`<g class="k-${k}">`);
    expect(texts(svg)).toContain('for (item of itens)');
  });
  it('o estado pode ser desligado', () => {
    const tree = SAMPLES.sequencial.tree as FlowNode;
    expect(texts(draw(tree))).toContain('valor = 21');
    expect(texts(draw(tree, { state: false }))).not.toContain('valor = 21');
    expect(metrics(layoutFlow(tree), { state: false }).height).toBeLessThan(metrics(layoutFlow(tree)).height);
  });
  it('escapa qualquer texto da árvore', () => {
    const svg = draw({ name: '<script>alert(1)</script>', children: [{ name: 'a"b&c', in: ['</text><x>'] }] });
    expect(svg).not.toContain('<script>');
    expect(svg).not.toContain('<x>');
    expect(svg).toContain('&lt;script&gt;');
    expect(svg).toContain('a&quot;b&amp;c');
  });
  it('corta textos longos com reticências, mantendo o nome completo na dica', () => {
    expect(clip('abcdefghij', 33)).toBe('abcd…');
    const long = 'umNomeDeFuncaoMuitoMuitoLongo';
    const svg = draw({ name: 'main', children: [{ name: long }] });
    expect(svg).toContain(`<title>${long}</title>`);
    expect(texts(svg).some((t) => t!.startsWith('umNome') && t!.endsWith('…'))).toBe(true);
  });
  it('tema claro troca as cores', () => {
    expect(draw({ name: 'm' }, { theme: 'light' })).toContain('var(--flow-bg,#ffffff)');
  });
});

describe('desempenho: só o que está à vista', () => {
  const layout = layoutFlow(largeFlow(20_000) as FlowNode);
  const m = metrics(layout);
  const view = (x: number, y: number) => ({ x, y, width: 1400, height: 800 });
  const elements = (svg: string) => (svg.match(/<[a-z]/gi) ?? []).length;

  it('o tamanho do desenho não cresce com o fluxo', () => {
    expect(layout.rows.length).toBeGreaterThan(20_000);
    const small = layoutFlow(largeFlow(100) as FlowNode);
    for (const [x, y] of [[0, 0], [m.width / 2, (HEAD + layout.rows.length * ROW) / 2], [m.width - 1400, m.height - 800]] as const) {
      const svg = renderSvg(layout, { view: view(x, y) });
      expect(elements(svg)).toBeLessThan(2500);
      expect(svg.length).toBeLessThan(300_000);
    }
    expect(elements(renderSvg(layout, { view: view(0, 0) }))).toBeLessThan(elements(renderSvg(small, { view: view(0, 0) })) * 1.5);
  });

  it('mostra as linhas e os passos da posição rolada, com cabeçalho e nomes fixos', () => {
    const row = layout.rows[10_000]!;
    const y = row.index * ROW - 300;
    const x = row.start * STEP - 200;
    const found = texts(renderSvg(layout, { view: view(x, y) }));
    expect(found).toContain(row.name);
    expect(found).toContain(`s${row.start}`);
    expect(found).toContain('SOURCE');
    expect(found).not.toContain('passo0');
  });

  it('o estado de um passo distante mostra só o trecho visível', () => {
    const k = layout.steps;
    expect(availableAt(layout.state, 0)).toBeLessThan(availableAt(layout.state, k));
    expect(availableAt(layout.state, k)).toBe(layout.state.length);
    const bottom = renderSvg(layout, { view: view((k - 3) * STEP, m.height - 800) });
    expect(elements(bottom)).toBeLessThan(2500);
    expect(texts(bottom).some((t) => t!.startsWith('dado'))).toBe(true);
  });

  it('calcula e desenha rápido', () => {
    const tree = largeFlow(50_000) as FlowNode;
    let began = performance.now();
    const big = layoutFlow(tree);
    expect(performance.now() - began).toBeLessThan(1500);
    began = performance.now();
    for (let i = 0; i < 50; i++) renderSvg(big, { view: view(i * 5000, i * 3000) });
    expect((performance.now() - began) / 50).toBeLessThan(25);
  });

  it('aguenta árvore muito funda sem estourar a pilha', () => {
    let tree: FlowNode = { name: 'folha' };
    for (let i = 0; i < 30_000; i++) tree = { name: `n${i}`, children: [tree] };
    const deep = layoutFlow(tree);
    expect(deep.rows).toHaveLength(30_001);
    expect(elements(renderSvg(deep, { view: view(0, 15_000 * ROW) }))).toBeLessThan(4000);
  });
});

import { describe, expect, it } from 'vitest';
import { largeFlow, SAMPLES } from '../example/samples.js';
import { layoutFlow, metrics, renderSvg, type FlowNode } from '../src/index.ts';
import { cameraWindow, clampCamera, fitCamera, MAX_ZOOM, MIN_ZOOM, zoomAt } from '../src/viewport.ts';

const content = { width: 4000, height: 3000 };
const screen = { width: 1000, height: 600 };

describe('zoom', () => {
  it('mantém parado o ponto sob o cursor', () => {
    const from = { x: 500, y: 400, zoom: 1 };
    const to = zoomAt(from, 2, 300, 200, content, screen);
    expect(to.x + 300 / to.zoom).toBeCloseTo(from.x + 300);
    expect(to.y + 200 / to.zoom).toBeCloseTo(from.y + 200);
  });
  it('respeita os limites de ampliação e não sai do desenho', () => {
    expect(zoomAt({ x: 0, y: 0, zoom: 1 }, 99, 0, 0, content, screen).zoom).toBe(MAX_ZOOM);
    expect(zoomAt({ x: 0, y: 0, zoom: 1 }, 0.001, 0, 0, content, screen).zoom).toBe(MIN_ZOOM);
    expect(clampCamera({ x: -50, y: 99_999, zoom: 1 }, content, screen)).toEqual({ x: 0, y: 2400, zoom: 1 });
    expect(clampCamera({ x: 300, y: 300, zoom: 0.1 }, content, screen)).toEqual({ x: 0, y: 0, zoom: 0.1 });
  });
  it('ajustar mostra tudo sem ampliar; em fluxo enorme para no mínimo', () => {
    expect(fitCamera(content, screen)).toEqual({ x: 0, y: 0, zoom: 0.2 });
    expect(fitCamera({ width: 300, height: 200 }, screen).zoom).toBe(1);
    expect(fitCamera({ width: 1e6, height: 1e6 }, screen).zoom).toBe(MIN_ZOOM);
  });
});

describe('visão de longe', () => {
  const texts = (svg: string) => (svg.match(/<text/g) ?? []).length;
  const elements = (svg: string) => (svg.match(/<[a-z]/gi) ?? []).length;

  it('mostra barras e blocos, sem textos, dados nem estado', () => {
    const svg = renderSvg(layoutFlow(SAMPLES.blocos.tree as FlowNode), { detail: 'low' });
    expect(svg).toContain('rx="11"');
    expect(svg).toContain('class="band"');
    expect(texts(svg)).toBeLessThanOrEqual(2); // só o ↻ das marcas de laço
    expect(svg).not.toContain('item = 1');
  });
  it('continua leve no zoom mínimo, mesmo com 20 mil funções', () => {
    const layout = layoutFlow(largeFlow(20_000) as FlowNode);
    const m = metrics(layout);
    const view = cameraWindow({ x: m.width / 3, y: m.height / 3, zoom: MIN_ZOOM }, { width: 1400, height: 800 });
    expect(elements(renderSvg(layout, { view, detail: 'low' }))).toBeLessThan(2500);
  });
});

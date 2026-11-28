import { describe, expect, it } from 'vitest';
import { largeFlow, SAMPLES } from '../example/samples.js';
import { layoutFlow, metrics, renderSvg, type FlowNode } from '../src/index.ts';
import { cameraWindow, fitCamera, MAX_ZOOM, MIN_ZOOM, zoomAt } from '../src/viewport.ts';

const screen = { width: 1000, height: 600 };

describe('zoom', () => {
  it('mantém parado o ponto sob o cursor', () => {
    const from = { x: 500, y: 400, zoom: 1 };
    const to = zoomAt(from, 2, 300, 200);
    expect(to.x + 300 / to.zoom).toBeCloseTo(from.x + 300);
    expect(to.y + 200 / to.zoom).toBeCloseTo(from.y + 200);
  });
  it('vai de 20% a 250%, em passos de 1%, sem prender o desenho', () => {
    expect(zoomAt({ x: 0, y: 0, zoom: 1 }, 99, 0, 0).zoom).toBe(MAX_ZOOM);
    expect(zoomAt({ x: 0, y: 0, zoom: 1 }, 0.001, 0, 0).zoom).toBe(MIN_ZOOM);
    expect(zoomAt({ x: 0, y: 0, zoom: 1 }, 1.23456, 0, 0).zoom).toBe(1.23);
    expect(zoomAt({ x: -300, y: 9999, zoom: 1 }, 1, 0, 0)).toEqual({ x: -300, y: 9999, zoom: 1 });
  });
  it('ajustar mostra tudo sem ampliar, centralizado e com 8 px no topo', () => {
    expect(fitCamera({ width: 4000, height: 2000 }, screen)).toEqual({ zoom: 0.25, x: -32, y: -8 / 0.25 });
    const small = fitCamera({ width: 300, height: 200 }, screen);
    expect(small).toEqual({ zoom: 1, x: -350, y: -8 });
    expect(fitCamera({ width: 1e6, height: 1e6 }, screen).zoom).toBe(MIN_ZOOM);
    // tela estreita: não encolhe até ficar ilegível
    expect(fitCamera({ width: 4000, height: 2000 }, { width: 600, height: 400 }).zoom).toBe(0.55);
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

import { describe, expect, it } from 'vitest';
import { fit, MAX_ZOOM, MIN_ZOOM, reveal, zoomAt } from '../src/features/viewport.ts';

const screen = { width: 1000, height: 800 };

describe('zoom da árvore', () => {
  it('mantém parado o ponto sob o cursor e respeita os limites', () => {
    const v = zoomAt({ x: 10, y: 20, k: 1 }, 1.5, 300, 200);
    expect((300 - v.x) / v.k).toBeCloseTo(290);
    expect((200 - v.y) / v.k).toBeCloseTo(180);
    expect(zoomAt(v, 100, 0, 0).k).toBe(MAX_ZOOM);
    expect(zoomAt(v, 0.00001, 0, 0).k).toBe(MIN_ZOOM);
  });

  it('ajustar mostra tudo centralizado, sem ampliar desenho pequeno', () => {
    const big = fit({ width: 2000, height: 16000 }, screen);
    expect(big.k).toBeCloseTo(0.05);
    expect(big.y).toBeCloseTo(0);
    expect(big.x).toBeCloseTo((1000 - 100) / 2);
    expect(fit({ width: 200, height: 100 }, screen)).toEqual({ k: 1, x: 400, y: 350 });
  });

  it('revela um nó fora da tela e não mexe quando ele já aparece', () => {
    const v = { x: 0, y: 0, k: 1 };
    expect(reveal(v, { x: 100, y: 100, width: 236, height: 56 }, screen)).toEqual(v);
    expect(reveal(v, { x: 100, y: 2000, width: 236, height: 56 }, screen)).toEqual({ x: 0, y: -1280, k: 1 });
    expect(reveal({ ...v, x: -500 }, { x: 100, y: 100, width: 236, height: 56 }, screen).x).toBe(-76);
  });
});

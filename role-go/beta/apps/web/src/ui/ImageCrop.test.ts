import { describe, expect, it } from 'vitest';

/** Espelha a lógica de tamanho rotacionado do ImageCrop (sem DOM). */
function rotatedSize(w: number, h: number, rot: number): { rw: number; rh: number } {
  return rot % 180 === 0 ? { rw: w, rh: h } : { rw: h, rh: w };
}

function clampOffset(ox: number, oy: number, dispW: number, dispH: number, frameW: number, frameH: number) {
  const maxX = Math.max(0, (dispW - frameW) / 2);
  const maxY = Math.max(0, (dispH - frameH) / 2);
  return { x: Math.min(maxX, Math.max(-maxX, ox)), y: Math.min(maxY, Math.max(-maxY, oy)) };
}

describe('ImageCrop geometry', () => {
  it('troca lados a 90° e 270°', () => {
    expect(rotatedSize(1000, 500, 0)).toEqual({ rw: 1000, rh: 500 });
    expect(rotatedSize(1000, 500, 90)).toEqual({ rw: 500, rh: 1000 });
    expect(rotatedSize(1000, 500, 180)).toEqual({ rw: 1000, rh: 500 });
    expect(rotatedSize(1000, 500, 270)).toEqual({ rw: 500, rh: 1000 });
  });

  it('impede pan além da moldura', () => {
    expect(clampOffset(999, 999, 400, 500, 200, 250)).toEqual({ x: 100, y: 125 });
    expect(clampOffset(-999, -999, 400, 500, 200, 250)).toEqual({ x: -100, y: -125 });
    expect(clampOffset(0, 0, 200, 250, 200, 250)).toEqual({ x: 0, y: 0 });
  });
});

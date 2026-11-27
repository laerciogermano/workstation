// Contas de zoom e deslocamento da árvore. A tela mostra o ponto p do desenho em p * k + (x, y).
export type View = { x: number; y: number; k: number };
export type Size = { width: number; height: number };
export type Rect = Size & { x: number; y: number };

export const MIN_ZOOM = 0.02;
export const MAX_ZOOM = 2;
export const STEP = 1.25;
const clamp = (k: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, k));

/** Aplica o fator mantendo parado o ponto da tela (px, py). */
export function zoomAt(v: View, factor: number, px: number, py: number): View {
  const k = clamp(v.k * factor);
  const r = k / v.k;
  return { k, x: px - (px - v.x) * r, y: py - (py - v.y) * r };
}

/** Desenho inteiro visível e centralizado, sem passar de 100%. */
export function fit(content: Size, screen: Size): View {
  const k = clamp(Math.min(1, screen.width / content.width, screen.height / content.height));
  return { k, x: (screen.width - content.width * k) / 2, y: (screen.height - content.height * k) / 2 };
}

/** Desloca só o necessário para o retângulo do desenho aparecer. */
export function reveal(v: View, rect: Rect, screen: Size, margin = 24): View {
  const axis = (offset: number, start: number, length: number, size: number) => {
    const from = start * v.k + offset;
    const to = (start + length) * v.k + offset;
    if (from < margin) return offset + (margin - from);
    if (to > size - margin) return offset - Math.min(to - (size - margin), from - margin);
    return offset;
  };
  return { k: v.k, x: axis(v.x, rect.x, rect.width, screen.width), y: axis(v.y, rect.y, rect.height, screen.height) };
}

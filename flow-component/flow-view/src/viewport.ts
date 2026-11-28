// Contas de zoom e deslocamento. `x` e `y` são o canto da janela no desenho; `zoom` é a ampliação.
export interface Camera { x: number; y: number; zoom: number }
export interface Size { width: number; height: number }

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 3;
export const ZOOM_STEP = 1.25;
/** Abaixo disto o texto não é legível: o desenho mostra só barras, blocos e guias. */
export const DETAIL_ZOOM = 0.4;

const limit = (v: number, max: number) => Math.min(Math.max(0, v), Math.max(0, max));

/** Não deixa a janela sair do desenho. */
export function clampCamera(c: Camera, content: Size, screen: Size): Camera {
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, c.zoom));
  return { zoom, x: limit(c.x, content.width - screen.width / zoom), y: limit(c.y, content.height - screen.height / zoom) };
}

/** Amplia mantendo parado o ponto da tela (sx, sy), até onde o desenho permitir. */
export function zoomAt(c: Camera, zoom: number, sx: number, sy: number, content: Size, screen: Size): Camera {
  const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
  return clampCamera({ zoom: next, x: c.x + sx / c.zoom - sx / next, y: c.y + sy / c.zoom - sy / next }, content, screen);
}

/** Desenho inteiro à vista, sem passar de 100%. Em fluxos enormes para no zoom mínimo, a partir do começo. */
export function fitCamera(content: Size, screen: Size): Camera {
  return clampCamera({ x: 0, y: 0, zoom: Math.min(1, screen.width / content.width, screen.height / content.height) }, content, screen);
}

export const cameraWindow = (c: Camera, screen: Size) => ({ x: c.x, y: c.y, width: screen.width / c.zoom, height: screen.height / c.zoom });

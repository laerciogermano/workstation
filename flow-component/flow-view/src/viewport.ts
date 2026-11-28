// Contas de zoom e deslocamento, como no editor FOP. `x` e `y` são o ponto do desenho no canto da janela (podem ser
// negativos: o desenho anda livre); `zoom` é a ampliação.
export interface Camera { x: number; y: number; zoom: number }
export interface Size { width: number; height: number }

export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 2.5;
export const ZOOM_STEP = 1.15;
/** Num fluxo grande, abaixo disto o desenho mostra só barras, blocos e marcas (o texto já não se lê). */
export const DETAIL_ZOOM = 0.4;
/** Folga em volta do desenho ajustado à tela. */
const GAP = 8;
/** Em tela estreita o ajuste não encolhe até ficar ilegível: arrasta-se o desenho. */
const NARROW = 640, NARROW_MIN = 0.55;

/** Ampliação válida, em passos de 1%. */
export const limitZoom = (zoom: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(zoom * 100) / 100));

/** Amplia mantendo parado o ponto da tela (sx, sy). */
export function zoomAt(c: Camera, zoom: number, sx: number, sy: number): Camera {
  const next = limitZoom(zoom);
  return { zoom: next, x: c.x + sx / c.zoom - sx / next, y: c.y + sy / c.zoom - sy / next };
}

/** Desenho inteiro à vista, sem passar de 100%: centralizado na largura e encostado no topo. */
export function fitCamera(content: Size, screen: Size): Camera {
  const floor = screen.width < NARROW ? NARROW_MIN : MIN_ZOOM;
  const zoom = limitZoom(Math.max(floor, Math.min(1, (screen.width - GAP * 2) / content.width, (screen.height - GAP * 2) / content.height)));
  const left = Math.max(GAP, (screen.width - content.width * zoom) / 2);
  return { zoom, x: -left / zoom, y: -GAP / zoom };
}

export const cameraWindow = (c: Camera, screen: Size) => ({ x: c.x, y: c.y, width: screen.width / c.zoom, height: screen.height / c.zoom });

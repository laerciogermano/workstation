// Liga o desenho a um elemento da página. Só leitura: navegar (zoom e deslocamento) e minimizar funções.
import { positionOf, visibleRows, type Visibility } from './collapse.ts';
import { layoutFlow } from './layout.ts';
import { describe, HEAD, LEAD, metrics, renderContent, ROW, STEP, type RenderOptions } from './render.ts';
import type { FlowLayout, FlowNode, Row } from './types.ts';
import { cameraWindow, clampCamera, DETAIL_ZOOM, fitCamera, MAX_ZOOM, MIN_ZOOM, zoomAt, ZOOM_STEP, type Camera } from './viewport.ts';

export interface MountOptions extends RenderOptions {
  /** Botões de zoom, minimizar tudo e expandir tudo no rodapé (padrão: sim). */
  controls?: boolean;
  /** Permite minimizar funções e blocos (padrão: sim). */
  collapsible?: boolean;
  /** Chamado ao clicar numa linha (`null` fora das linhas). Arrastar não conta como clique. */
  onSelect?: (row: Row | null) => void;
}

export interface FlowViewHandle {
  readonly layout: FlowLayout;
  readonly camera: Camera;
  /** Ampliação (1 = 100%), mantendo o centro da tela. */
  zoomTo(zoom: number): void;
  /** Desenho inteiro à vista. */
  fit(): void;
  /** Leva o canto da janela ao ponto (x, y) do desenho. */
  panTo(x: number, y: number): void;
  /** Índices das linhas à vista e das minimizadas. */
  readonly visible: Visibility;
  /** Minimiza ou expande a linha de índice `row`. */
  toggle(row: number): void;
  /** Minimiza todas as funções e blocos abaixo da raiz. */
  collapseAll(): void;
  expandAll(): void;
  /** Destaca a linha de índice `row` (`null` tira o destaque). */
  select(row: number | null): void;
  /** Rola o necessário para a linha aparecer, abrindo o que estiver minimizado acima dela. */
  reveal(row: number): void;
  /** Troca a árvore e redesenha, mantendo o zoom, a posição e o que estava minimizado. */
  update(tree: FlowNode, options?: RenderOptions): void;
  destroy(): void;
}

const SVG = 'http://www.w3.org/2000/svg';
/** Altura ocupada pelos botões no rodapé. */
const CONTROLS = 62;
const ICONS = {
  out: 'M5 12h14',
  in: 'M5 12h14M12 5v14',
  fit: 'M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2',
  collapseAll: 'm7 20 5-5 5 5M7 4l5 5 5-5',
  expandAll: 'm7 15 5 5 5-5M7 9l5-5 5 5',
};
let sequence = 0;

const controlStyles = (id: string, light: boolean) => {
  const [bg, line, text, hover] = light ? ['#ffffff', '#d9d5cd', '#1d1f24', '#f1eee8'] : ['#121212', '#333333', '#e8e8e8', '#222222'];
  const s = `[data-flow="${id}"] .fv-zoom`;
  return `${s}{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);display:flex;gap:2px;padding:4px;background:${bg};border:1px solid ${line};border-radius:10px;cursor:default}`
    + `${s} button{display:grid;place-items:center;min-width:32px;height:30px;padding:0 8px;border:0;border-radius:6px;background:none;color:${text};font:600 12px var(--flow-ui-font,"IBM Plex Sans",system-ui,sans-serif);font-variant-numeric:tabular-nums;cursor:pointer}`
    + `${s} button:hover{background:${hover}}${s} button:disabled{opacity:.4;cursor:default;background:none}${s} .fv-level{min-width:56px}`
    + `${s} i{width:1px;margin:5px 4px;background:${line}}`;
};

export function mountFlow(host: HTMLElement, tree: FlowNode, options: MountOptions = {}): FlowViewHandle {
  const doc = host.ownerDocument;
  const win = doc.defaultView!;
  let settings = { ...options, id: options.id ?? `flow-mount-${++sequence}` };
  let layout = layoutFlow(tree);
  const collapsible = options.collapsible !== false;
  /** o que está minimizado, pela identidade do nó (id ou o próprio objeto) */
  const shut = new Set<unknown>();
  const keyOf = (row: Row): unknown => row.node.id ?? row.node;
  let visible = visibleRows(layout, () => false);
  const measure = () => metrics(layout, { ...settings, visible });
  let content = measure();
  let camera: Camera = { x: 0, y: 0, zoom: 1 };

  const root = doc.createElement('div');
  root.dataset.flow = settings.id;
  root.style.cssText = 'width:100%;height:100%;overflow:hidden;position:relative;touch-action:none;cursor:grab;user-select:none';
  root.tabIndex = 0; // navegação pelo teclado
  const svg = doc.createElementNS(SVG, 'svg');
  svg.id = settings.id;
  svg.setAttribute('role', 'img');
  svg.style.display = 'block';
  root.append(svg);

  const screen = () => ({ width: root.clientWidth, height: root.clientHeight });

  // ---------- botões ----------
  let level: HTMLButtonElement | null = null;
  let zoomOut: HTMLButtonElement | null = null;
  let zoomIn: HTMLButtonElement | null = null;
  let allClosed: HTMLButtonElement | null = null;
  let allOpen: HTMLButtonElement | null = null;
  if (options.controls !== false) {
    const style = doc.createElement('style');
    style.textContent = controlStyles(settings.id, settings.theme === 'light');
    const bar = doc.createElement('div');
    bar.className = 'fv-zoom';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Zoom');
    const button = (label: string, icon: keyof typeof ICONS | null, action: () => void) => {
      const b = doc.createElement('button');
      b.type = 'button';
      b.title = label;
      b.setAttribute('aria-label', label);
      if (icon) b.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONS[icon]}"/></svg>`;
      b.addEventListener('click', action);
      bar.append(b);
      return b;
    };
    zoomOut = button('Diminuir zoom', 'out', () => zoomCenter(camera.zoom / ZOOM_STEP));
    level = button('Voltar a 100%', null, () => zoomCenter(1));
    level.className = 'fv-level';
    zoomIn = button('Aumentar zoom', 'in', () => zoomCenter(camera.zoom * ZOOM_STEP));
    button('Ajustar à tela', 'fit', () => set(fitCamera(content, screen())));
    if (collapsible) {
      bar.append(doc.createElement('i'));
      allClosed = button('Minimizar tudo', 'collapseAll', () => collapseAll());
      allOpen = button('Expandir tudo', 'expandAll', () => expandAll());
    }
    root.append(style, bar);
  }
  host.append(root);

  // ---------- desenho ----------
  let frame = 0;
  let drawn = '';
  function draw(force = false) {
    if (frame) win.cancelAnimationFrame(frame);
    frame = 0;
    const size = screen();
    camera = clampCamera(camera, content, size);
    const key = `${camera.x}|${camera.y}|${camera.zoom}|${size.width}|${size.height}`;
    if (!force && key === drawn) return;
    drawn = key;
    const view = cameraWindow(camera, size);
    svg.setAttribute('width', String(size.width));
    svg.setAttribute('height', String(size.height));
    svg.setAttribute('viewBox', `0 0 ${view.width || 1} ${view.height || 1}`);
    // o redesenho troca os elementos: devolve o foco à seta que o tinha
    const focused = (doc.activeElement as Element | null)?.closest?.('[data-toggle]');
    const refocus = focused && svg.contains(focused) ? focused.getAttribute('data-toggle') : null;
    svg.innerHTML = renderContent(layout, view, { ...settings, visible, toggles: collapsible, detail: camera.zoom < DETAIL_ZOOM ? 'low' : 'full' });
    if (refocus !== null) svg.querySelector<SVGElement>(`[data-toggle="${refocus}"]`)?.focus({ preventScroll: true });
    if (allClosed) {
      allClosed.disabled = !layout.rows.some((r) => r.index > 0 && r.composite && !shut.has(keyOf(r)));
      allOpen!.disabled = !visible.closed.size;
    }
    if (level) {
      level.textContent = `${Math.round(camera.zoom * 100)}%`;
      zoomOut!.disabled = camera.zoom <= MIN_ZOOM;
      zoomIn!.disabled = camera.zoom >= MAX_ZOOM;
    }
  }
  const schedule = () => void (frame ||= win.requestAnimationFrame(() => draw()));
  function set(next: Camera) {
    camera = clampCamera(next, content, screen());
    schedule();
  }
  const zoomCenter = (zoom: number) => set(zoomAt(camera, zoom, screen().width / 2, screen().height / 2, content, screen()));
  const move = (dx: number, dy: number) => set({ ...camera, x: camera.x + dx / camera.zoom, y: camera.y + dy / camera.zoom });

  // ---------- minimizar ----------
  /** Recalcula o que está à vista mantendo no mesmo lugar a linha que estava no topo (ou a minimizada acima dela). */
  function reshape() {
    const topPosition = Math.min(visible.rows.length - 1, Math.floor(camera.y / ROW));
    let anchor = visible.rows[topPosition] ?? 0;
    const offset = camera.y - topPosition * ROW;
    visible = visibleRows(layout, (r) => shut.has(keyOf(r)));
    while (anchor > 0 && visible.rows[positionOf(visible.rows, anchor)] !== anchor) anchor = layout.rows[anchor]!.parent;
    content = measure();
    camera = { ...camera, y: positionOf(visible.rows, anchor) * ROW + offset };
    draw(true);
  }
  function toggle(index: number) {
    const row = layout.rows[index];
    if (!row?.composite) return;
    if (!shut.delete(keyOf(row))) shut.add(keyOf(row));
    reshape();
  }
  function collapseAll() {
    for (const r of layout.rows) if (r.index > 0 && r.composite) shut.add(keyOf(r));
    reshape();
  }
  function expandAll() {
    shut.clear();
    reshape();
  }
  const toggleOf = (target: EventTarget | null) => (target as Element | null)?.closest?.('[data-toggle]')?.getAttribute('data-toggle');

  // ---------- navegação ----------
  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const box = root.getBoundingClientRect();
    const delta = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
    // a pinça no trackpad chega como roda com Ctrl e passos pequenos
    const factor = Math.exp(-delta * (e.ctrlKey ? 0.01 : 0.0015));
    set(zoomAt(camera, camera.zoom * factor, e.clientX - box.left, e.clientY - box.top, content, screen()));
  }
  let drag: { id: number; x: number; y: number } | null = null;
  /** onde o botão desceu, para separar clique de arrasto */
  let pressed: { x: number; y: number } | null = null;
  function onDown(e: PointerEvent) {
    if (e.button !== 0 || (e.target as Element).closest('.fv-zoom, [data-toggle]')) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    pressed = { x: e.clientX, y: e.clientY };
    root.setPointerCapture(e.pointerId);
    root.style.cursor = 'grabbing';
  }
  function onMove(e: PointerEvent) {
    if (drag?.id !== e.pointerId) return;
    move(drag.x - e.clientX, drag.y - e.clientY);
    drag = { id: drag.id, x: e.clientX, y: e.clientY };
  }
  function onUp() {
    drag = null;
    root.style.cursor = 'grab';
  }
  function onClick(e: MouseEvent) {
    const index = toggleOf(e.target);
    if (index != null) return toggle(Number(index));
    const from = pressed;
    pressed = null;
    if (!options.onSelect || !from || Math.hypot(e.clientX - from.x, e.clientY - from.y) > 4) return;
    const y = (e.clientY - root.getBoundingClientRect().top) / camera.zoom;
    if (y < HEAD) return;
    const row = visible.rows[Math.floor((y - HEAD + camera.y) / ROW)];
    options.onSelect(row === undefined ? null : layout.rows[row]!);
  }
  function select(row: number | null) {
    settings = { ...settings, selected: row };
    draw(true);
  }
  function reveal(index: number) {
    const row = layout.rows[index];
    if (!row) return;
    let opened = false;
    for (let p = row.parent; p >= 0; p = layout.rows[p]!.parent) opened = shut.delete(keyOf(layout.rows[p]!)) || opened;
    if (opened) reshape();
    const size = screen();
    const view = cameraWindow(camera, size);
    const top = positionOf(visible.rows, index) * ROW;
    let { x, y } = camera;
    // o cabeçalho e as colunas da esquerda ficam fixos por cima do desenho; os botões, no rodapé
    const foot = options.controls === false ? 0 : CONTROLS / camera.zoom;
    if (top < y) y = top;
    else if (top + ROW + HEAD + foot > y + view.height) y = top + ROW + HEAD + foot - view.height;
    // na horizontal basta o começo da linha (com o primeiro passo) estar à vista
    const from = LEAD + row.start * STEP, space = view.width - content.left;
    if (from < x || from + Math.min(STEP, space) > x + space) x = from - Math.max(0, Math.min(STEP / 2, (space - STEP) / 2));
    camera = clampCamera({ ...camera, x, y }, content, size);
    draw(true);
  }
  function onKey(e: KeyboardEvent) {
    if (e.metaKey || e.ctrlKey || e.altKey || (e.target as Element).closest('button')) return;
    const index = toggleOf(e.target);
    if (index != null && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      return toggle(Number(index));
    }
    const page = screen().height * 0.9;
    const action: Record<string, () => void> = {
      '+': () => zoomCenter(camera.zoom * ZOOM_STEP), '=': () => zoomCenter(camera.zoom * ZOOM_STEP),
      '-': () => zoomCenter(camera.zoom / ZOOM_STEP), '0': () => set(fitCamera(content, screen())),
      ArrowLeft: () => move(-80, 0), ArrowRight: () => move(80, 0), ArrowUp: () => move(0, -68), ArrowDown: () => move(0, 68),
      PageUp: () => move(0, -page), PageDown: () => move(0, page),
      Home: () => set({ ...camera, x: 0, y: 0 }), End: () => set({ ...camera, x: content.width, y: content.height }),
    };
    if (action[e.key]) {
      e.preventDefault();
      action[e.key]!();
    }
  }
  root.addEventListener('wheel', onWheel, { passive: false });
  root.addEventListener('pointerdown', onDown);
  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerup', onUp);
  root.addEventListener('pointercancel', onUp);
  root.addEventListener('keydown', onKey);
  root.addEventListener('click', onClick);

  const observer = new win.ResizeObserver(schedule);
  observer.observe(root);
  svg.setAttribute('aria-label', describe(layout));
  draw(true);

  return {
    get layout() {
      return layout;
    },
    get camera() {
      return { ...camera };
    },
    zoomTo: zoomCenter,
    fit: () => set(fitCamera(content, screen())),
    panTo: (x, y) => set({ ...camera, x, y }),
    get visible() {
      return visible;
    },
    toggle,
    collapseAll,
    expandAll,
    select,
    reveal,
    update(next, nextOptions) {
      layout = layoutFlow(next);
      settings = { ...settings, ...nextOptions, id: settings.id };
      visible = visibleRows(layout, (r) => shut.has(keyOf(r)));
      content = measure();
      svg.setAttribute('aria-label', describe(layout));
      draw(true);
    },
    destroy() {
      if (frame) win.cancelAnimationFrame(frame);
      observer.disconnect();
      root.remove();
    },
  };
}

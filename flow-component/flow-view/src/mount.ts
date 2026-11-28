// Liga o desenho a um elemento da página. Só leitura: navegar (zoom e deslocamento) e minimizar funções.
import { positionOf, visibleRows, type Visibility } from './collapse.ts';
import { layoutFlow } from './layout.ts';
import { describe, HEAD, metrics, renderContent, ROW, type RenderOptions } from './render.ts';
import type { FlowLayout, FlowNode, Row } from './types.ts';
import { cameraWindow, DETAIL_ZOOM, fitCamera, MAX_ZOOM, MIN_ZOOM, zoomAt, ZOOM_STEP, type Camera } from './viewport.ts';

export interface MountOptions extends RenderOptions {
  /** Botões de zoom, minimizar tudo e expandir tudo no rodapé (padrão: sim). */
  controls?: boolean;
  /** O `else` ocupa o mesmo passo do `if` (padrão: vem depois dele). */
  elseParallel?: boolean;
  /** Permite minimizar funções e blocos (padrão: sim). */
  collapsible?: boolean;
  /** Enquanto ninguém mexer no zoom ou na posição, o desenho se ajusta à tela. */
  autoFit?: boolean;
  /** Chamado a cada redesenho, para botões de fora acompanharem o zoom e o que está minimizado. */
  onDraw?: (state: DrawState) => void;
  /** Chamado ao clicar numa linha (`null` fora das linhas). Arrastar não conta como clique. */
  onSelect?: (row: Row | null) => void;
  /** O ponteiro entrou num alvo (linha da tabela, barra, dado…) ou saiu de todos (`null`). Serve para menus. */
  onHover?: (target: Target | null) => void;
  /** Clique num alvo do desenho (arrastar não conta). Vem depois de `onSelect`. */
  onActivate?: (target: Target) => void;
  /** Com `editable`: a alça de um bloco foi arrastada até o limite de passo `end`. */
  onResize?: (row: Row, end: number) => void;
}

/** O que está sob o ponteiro. `box` e `anchor` em coordenadas da janela do navegador. */
export interface Target {
  /** `row`: a linha na tabela; `bar`: barra ou faixa no plano; `name`, `source`; `data`: marca de entrada ou saída;
   *  `state`: dado listado num estado; `add`: o “+” de uma entrada ou saída que não existe. */
  type: 'row' | 'bar' | 'name' | 'source' | 'data' | 'state' | 'add';
  row?: Row;
  side?: 'in' | 'out';
  /** Em `state`: o dado (o do primeiro nível, se for um campo). */
  name?: string;
  box: DOMRect;
  /** O elemento do desenho (some no próximo redesenho). Ausente em `row`. */
  element?: Element;
}

export interface DrawState {
  zoom: number;
  /** Há algo aberto que dá para minimizar, ou algo minimizado para expandir. */
  canCollapse: boolean;
  canExpand: boolean;
}

export interface FlowViewHandle {
  readonly layout: FlowLayout;
  readonly camera: Camera;
  /** Ampliação (1 = 100%), mantendo o centro da tela. */
  zoomTo(zoom: number): void;
  /** Desenho inteiro à vista. */
  fit(): void;
  /** Leva o canto da janela ao ponto (x, y) do desenho. O desenho anda livre, sem limites. */
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
/** A partir de quantas linhas a visão de longe deixa de desenhar textos e estados. */
const LARGE = 500;
/** Até aqui (px) o botão que desceu ainda é um clique, não um arrasto. */
const CLICK = 4;
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
  let layout = layoutFlow(tree, options);
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
  const content_ = doc.createElementNS(SVG, 'g');
  if (options.editable) content_.setAttribute('class', 'editing');
  svg.append(content_);
  root.append(svg);

  const screen = () => ({ width: root.clientWidth, height: root.clientHeight });
  /** Ponto da tela (do navegador) em relação ao canto da janela. */
  const local = (e: { clientX: number; clientY: number }) => {
    const box = root.getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top };
  };
  let auto = !!options.autoFit;

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
    zoomOut = button('Zoom out (−)', 'out', () => zoomCenter(camera.zoom / ZOOM_STEP));
    level = button('Reset to 100%', null, () => zoomCenter(1));
    level.className = 'fv-level';
    zoomIn = button('Zoom in (+)', 'in', () => zoomCenter(camera.zoom * ZOOM_STEP));
    button('Fit to screen (0)', 'fit', () => fit());
    if (collapsible) {
      bar.append(doc.createElement('i'));
      allClosed = button('Collapse all', 'collapseAll', () => collapseAll());
      allOpen = button('Expand all', 'expandAll', () => expandAll());
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
    if (auto) camera = fitCamera(content, size);
    const key = `${camera.x}|${camera.y}|${camera.zoom}|${size.width}|${size.height}`;
    if (!force && key === drawn) return;
    // a vista andou: o que estava sob o ponteiro saiu do lugar
    if (key !== drawn) hover(null);
    drawn = key;
    const view = cameraWindow(camera, size);
    svg.setAttribute('width', String(size.width));
    svg.setAttribute('height', String(size.height));
    svg.setAttribute('viewBox', `0 0 ${view.width || 1} ${view.height || 1}`);
    // o redesenho troca os elementos: devolve o foco à seta que o tinha
    const focused = (doc.activeElement as Element | null)?.closest?.('[data-toggle]');
    const refocus = focused && svg.contains(focused) ? focused.getAttribute('data-toggle') : null;
    content_.innerHTML = renderContent(layout, view, { ...settings, visible, toggles: collapsible, detail: camera.zoom < DETAIL_ZOOM && layout.rows.length > LARGE ? 'low' : 'full' });
    if (refocus !== null) svg.querySelector<SVGElement>(`[data-toggle="${refocus}"]`)?.focus({ preventScroll: true });
    const canCollapse = (!!allClosed || !!options.onDraw) && layout.rows.some((r) => r.index > 0 && r.composite && !shut.has(keyOf(r)));
    if (allClosed) {
      allClosed.disabled = !canCollapse;
      allOpen!.disabled = !visible.closed.size;
    }
    options.onDraw?.({ zoom: camera.zoom, canCollapse, canExpand: !!visible.closed.size });
    if (level) {
      level.textContent = `${Math.round(camera.zoom * 100)}%`;
      zoomOut!.disabled = camera.zoom <= MIN_ZOOM;
      zoomIn!.disabled = camera.zoom >= MAX_ZOOM;
    }
  }
  const schedule = () => void (frame ||= win.requestAnimationFrame(() => draw()));
  /** Mexeu no zoom ou na posição: o ajuste automático para. */
  function set(next: Camera) {
    auto = false;
    camera = next;
    schedule();
  }
  /** Volta a ajustar à tela (e, com `autoFit`, a acompanhar). */
  function fit() {
    camera = fitCamera(content, screen());
    auto = !!options.autoFit;
    schedule();
  }
  const zoomCenter = (zoom: number) => set(zoomAt(camera, zoom, screen().width / 2, screen().height / 2));
  /** Desloca o desenho em pixels da tela. */
  const move = (dx: number, dy: number) => set({ ...camera, x: camera.x + dx / camera.zoom, y: camera.y + dy / camera.zoom });

  // ---------- minimizar ----------
  /** Recalcula o que está à vista. Rolado para dentro das linhas, mantém no lugar a que estava no topo (ou a minimizada acima dela). */
  function reshape() {
    const below = camera.y - content.top - HEAD;
    const topPosition = Math.min(visible.rows.length - 1, Math.floor(below / ROW));
    let anchor = visible.rows[topPosition] ?? 0;
    visible = visibleRows(layout, (r) => shut.has(keyOf(r)));
    content = measure();
    if (below > 0) {
      while (anchor > 0 && visible.rows[positionOf(visible.rows, anchor)] !== anchor) anchor = layout.rows[anchor]!.parent;
      camera = { ...camera, y: camera.y + (positionOf(visible.rows, anchor) - topPosition) * ROW };
    }
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
    auto = !!options.autoFit;
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
    const delta = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
    // a pinça no trackpad chega como roda com Ctrl e passos pequenos
    const factor = Math.exp(-delta * (e.ctrlKey ? 0.01 : 0.0022));
    const point = local(e);
    const next = zoomAt(camera, camera.zoom * factor, point.x, point.y);
    if (next.zoom !== camera.zoom) set(next);
  }
  /** dois dedos na tela: pinça, com o zoom no ponto médio */
  const touches = new Map<number, PointerEvent>();
  let pinch: { distance: number; zoom: number } | null = null;
  const spread = () => {
    const [a, b] = [...touches.values()];
    return Math.hypot(a!.clientX - b!.clientX, a!.clientY - b!.clientY) || 1;
  };
  /** arrasto em andamento: onde o botão desceu e a câmera daquele momento */
  let drag: { id: number; x: number; y: number; from: Camera; moved: boolean } | null = null;
  /** o último arrasto moveu o desenho: o clique que vem depois não seleciona */
  let dragged = false;
  function onDown(e: PointerEvent) {
    dragged = false;
    if (e.pointerType === 'touch') {
      touches.set(e.pointerId, e);
      if (touches.size === 2) {
        pinch = { distance: spread(), zoom: camera.zoom };
        drag = null;
        dragged = true;
        return;
      }
    }
    // botão esquerdo, ou o do meio em qualquer lugar
    const middle = e.button === 1;
    if (!middle && (e.button !== 0 || (e.target as Element).closest('.fv-zoom, [data-toggle]'))) return;
    if (middle) e.preventDefault();
    const grip = !middle && options.onResize ? (e.target as Element).closest('[data-t=resize]') : null;
    if (grip) return startResize(e, layout.rows[Number(grip.getAttribute('data-row'))]!);
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, from: camera, moved: middle };
    if (middle) root.setPointerCapture(e.pointerId);
  }
  /** Arrastar a alça: uma linha tracejada mostra o limite de passo onde o bloco passará a terminar. */
  function startResize(e: PointerEvent, row: Row) {
    e.preventDefault();
    dragged = true;
    root.setPointerCapture(e.pointerId);
    const guide = doc.createElement('div');
    guide.className = 'fv-guide';
    guide.style.cssText = 'position:absolute;top:0;bottom:0;width:0;border-left:2px dashed currentColor;pointer-events:none';
    root.append(guide);
    const zero = () => (content.left + content.lead - camera.x) * camera.zoom;
    let end = row.end;
    const follow = (ev: PointerEvent) => {
      const step = content.step * camera.zoom;
      end = Math.min(layout.steps, Math.max(row.start + 1, Math.round((local(ev).x - zero()) / step)));
      guide.style.left = `${zero() + end * step}px`;
    };
    follow(e);
    const finish = (ev: PointerEvent) => {
      root.removeEventListener('pointermove', follow);
      root.removeEventListener('pointerup', finish);
      root.removeEventListener('pointercancel', finish);
      guide.remove();
      if (ev.type === 'pointerup' && end !== row.end) options.onResize!(row, end);
    };
    root.addEventListener('pointermove', follow);
    root.addEventListener('pointerup', finish);
    root.addEventListener('pointercancel', finish);
  }

  // ---------- alvos do ponteiro ----------
  function targetAt(e: PointerEvent | MouseEvent): Target | null {
    const element = (e.target as Element).closest?.('[data-t]');
    if (element && root.contains(element)) {
      const type = element.getAttribute('data-t') as Target['type'] | 'resize';
      if (type === 'resize') return null;
      const index = element.getAttribute('data-row');
      const side = element.getAttribute('data-side') as Target['side'] | null;
      const name = element.getAttribute('data-name');
      return {
        type, element, box: element.getBoundingClientRect(),
        ...(index === null ? {} : { row: layout.rows[Number(index)]! }),
        ...(side ? { side } : {}), ...(name === null ? {} : { name }),
      };
    }
    return tableRow(e);
  }
  /** A linha da tabela sob o ponteiro. */
  function tableRow(e: { clientX: number; clientY: number }): Target | null {
    const row = rowAt(e);
    if (!row) return null;
    const box = root.getBoundingClientRect();
    const left = box.left - camera.x * camera.zoom;
    if (e.clientX < left || e.clientX > left + content.left * camera.zoom) return null;
    const top = box.top + (content.top + HEAD + positionOf(visible.rows, row.index) * ROW - camera.y) * camera.zoom;
    return { type: 'row', row, box: new win.DOMRect(left, top, content.left * camera.zoom, ROW * camera.zoom) };
  }
  /** A linha na altura do ponteiro, dentro do desenho. */
  function rowAt(e: { clientX: number; clientY: number }): Row | null {
    const point = local(e);
    const x = camera.x + point.x / camera.zoom, y = camera.y + point.y / camera.zoom - content.top - HEAD;
    const index = x >= 0 && x <= content.width && y >= 0 ? visible.rows[Math.floor(y / ROW)] : undefined;
    return index === undefined ? null : layout.rows[index]!;
  }
  let hovered = '';
  function hover(next: Target | null) {
    const key = next ? `${next.type} ${next.row?.index} ${next.side} ${next.name} ${Math.round(next.box.x)} ${Math.round(next.box.y)}` : '';
    if (key === hovered) return;
    hovered = key;
    options.onHover?.(next);
  }
  function onMove(e: PointerEvent) {
    if (touches.has(e.pointerId)) touches.set(e.pointerId, e);
    if (pinch && touches.size === 2) {
      const [a, b] = [...touches.values()];
      const point = local({ clientX: (a!.clientX + b!.clientX) / 2, clientY: (a!.clientY + b!.clientY) / 2 });
      return set(zoomAt(camera, (pinch.zoom * spread()) / pinch.distance, point.x, point.y));
    }
    if (drag?.id !== e.pointerId) {
      // na tabela, a linha inteira é um alvo só; no plano, vale o que está sob o ponteiro
      if (!drag && !e.buttons && options.onHover) hover(tableRow(e) ?? targetAt(e));
      return;
    }
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < CLICK) return;
    if (!dragged) root.setPointerCapture(e.pointerId);
    drag.moved = dragged = true;
    root.style.cursor = 'grabbing';
    set({ zoom: camera.zoom, x: drag.from.x - dx / camera.zoom, y: drag.from.y - dy / camera.zoom });
  }
  function onUp(e: PointerEvent) {
    touches.delete(e.pointerId);
    if (touches.size < 2) pinch = null;
    drag = null;
    root.style.cursor = 'grab';
  }
  /** sem a rolagem automática do botão do meio */
  const noAutoScroll = (e: MouseEvent) => void (e.button === 1 && e.preventDefault());
  function onClick(e: MouseEvent) {
    const index = toggleOf(e.target);
    if (index != null) return toggle(Number(index));
    if (dragged || (!options.onSelect && !options.onActivate)) return;
    // depois do clique (que pode abrir uma caixa), passar de novo pelo mesmo alvo avisa outra vez
    hovered = '';
    // o alvo é lido antes de selecionar, que redesenha
    const hit = options.onActivate ? targetAt(e) : null;
    const row = hit?.row ?? rowAt(e);
    if (!hit || hit.type !== 'state') options.onSelect?.(row);
    if (hit) options.onActivate!(hit);
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
    const view = cameraWindow(camera, screen());
    const top = content.top + HEAD + positionOf(visible.rows, index) * ROW;
    let { x, y } = camera;
    // os botões do rodapé ficam por cima do desenho
    const foot = options.controls === false ? 0 : CONTROLS / camera.zoom;
    if (top < y) y = top - ROW;
    else if (top + ROW + foot > y + view.height) y = top + ROW + foot - view.height;
    // na horizontal basta o começo da barra estar à vista
    const step = content.step;
    const from = content.left + content.lead + row.start * step;
    if (from < x || from + Math.min(step, view.width) > x + view.width) x = from - Math.max(0, (view.width - step) / 2);
    if (x === camera.x && y === camera.y) return;
    auto = false;
    camera = { ...camera, x, y };
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
      '-': () => zoomCenter(camera.zoom / ZOOM_STEP), '0': () => fit(),
      ArrowLeft: () => move(-80, 0), ArrowRight: () => move(80, 0), ArrowUp: () => move(0, -68), ArrowDown: () => move(0, 68),
      PageUp: () => move(0, -page), PageDown: () => move(0, page),
      Home: () => set({ ...camera, x: 0, y: 0 }),
      End: () => set({ ...camera, x: content.width - screen().width / camera.zoom, y: content.height - screen().height / camera.zoom }),
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
  root.addEventListener('mousedown', noAutoScroll);
  const leave = () => hover(null);
  root.addEventListener('pointerleave', leave);

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
    fit,
    panTo: (x, y) => set({ zoom: camera.zoom, x, y }),
    get visible() {
      return visible;
    },
    toggle,
    collapseAll,
    expandAll,
    select,
    reveal,
    update(next, nextOptions) {
      layout = layoutFlow(next, options);
      settings = { ...settings, ...nextOptions, id: settings.id };
      visible = visibleRows(layout, (r) => shut.has(keyOf(r)));
      content = measure();
      svg.setAttribute('aria-label', describe(layout));
      hovered = '';
      draw(true);
    },
    destroy() {
      if (frame) win.cancelAnimationFrame(frame);
      observer.disconnect();
      root.remove();
    },
  };
}

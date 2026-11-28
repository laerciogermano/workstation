// Desenha só o que cabe na janela: o custo depende do tamanho da tela, não do tamanho do fluxo.
// A forma (tabela, trilhos, passos, barras e estados) segue o editor FOP (`example/flow-novo.html`).
import { positionOf, type Visibility } from './collapse.ts';
import { INDENT_LIMIT, loopVariable } from './layout.ts';
import { styles, type Theme } from './theme.ts';
import type { DataPoint, FlowBlock, FlowFunction, FlowLayout, Row, Source, StateItem } from './types.ts';

export const ROW = 34, STEP = 160, HEAD = 52;
/** Altura das duas faixas do cartão: o arquivo e a função. */
export const CARD_HEAD = 68;
const PAD = 18, SOURCE_COL = PAD + 120, INDENT = 28;
/** Recuo entre barras de blocos que começam na mesma coluna, e quantas se empilham. */
const RAIL = 4, MAX_RAILS = 8;
/** Da tabela até `s0`, e depois do último passo (maior com o nome fora da barra). */
const LEAD = 132, TAIL = 160, TAIL_OUTSIDE = 240;
/** Passo com o nome fora da barra (a função vira um círculo) e o teto quando o nome vai dentro. */
const STEP_OUTSIDE = 100, STEP_MAX = 400;
/** Recuo da barra dentro das colunas: folha e função com filhas. */
const INSET = 40, SPAN_INSET = 21, BAR = 22;
/** Guias de blocos que vêm de cima da janela: as mais próximas (e a raiz). */
const MAX_OPEN_GUIDES = 32;
/** Do fim das linhas até os passos de baixo e até o primeiro estado. */
const FOOT_PILLS = 32, STATE_TOP = 66, FOOT = 28, LINE = 15;
/** Largura de um caractere monoespaçado em cada corpo de letra. */
const CHAR = 6.6, CHAR_12 = 7.2, CHAR_BAR = 5.8, CHAR_9 = 5.4, CHAR_UI = 6.2;

export interface Viewport { x: number; y: number; width: number; height: number }
export interface RenderOptions {
  theme?: Theme;
  /** Lista de estado abaixo de cada passo (padrão: sim). */
  state?: boolean;
  /** `all`: cada passo mostra tudo que já existe (padrão); `new`: só o que chega nele. */
  states?: 'all' | 'new';
  /** Lista também as funções do fluxo no estado (padrão: não, só os dados e os objetos). */
  stateFunctions?: boolean;
  /** Nome dentro da barra (padrão) ou ao lado, com a função como círculo. */
  names?: 'inside' | 'outside';
  /** Moldura com o arquivo e a função no topo. */
  card?: boolean;
  /** Distingue vários desenhos na mesma página. */
  id?: string;
  /** `low`: visão de longe, sem textos, dados nem estado (usada com zoom pequeno). */
  detail?: 'full' | 'low';
  /** Linhas à vista quando há funções minimizadas (veja `visibleRows`). Ausente = todas. */
  visible?: Visibility;
  /** Para quem edita por cima do desenho: marcas “+” de entrada e saída e a alça que muda o tamanho do bloco. */
  editable?: boolean;
  /** Mostra as setas de minimizar nas linhas com filhos. */
  toggles?: boolean;
  /** Índice da linha destacada. */
  selected?: number | null;
}

const catalogFree = new WeakMap<FlowLayout, StateItem[]>();
const outside = new WeakMap<Visibility, Map<StateItem[], StateItem[]>>();
const newest = new WeakMap<StateItem[], number>();

/** A lista de estado que vai para o desenho, na mesma ordem (por `since`). */
export function stateItems(layout: FlowLayout, options: RenderOptions = {}): StateItem[] {
  let items = layout.state;
  if (!options.stateFunctions) {
    let data = catalogFree.get(layout);
    if (!data) catalogFree.set(layout, (data = items.filter((s) => !s.catalog)));
    items = data;
  }
  const visible = options.visible;
  if (!visible?.closed.size) return items;
  let cache = outside.get(visible);
  if (!cache) outside.set(visible, (cache = new Map()));
  let shown = cache.get(items);
  if (!shown) cache.set(items, (shown = withoutInside(layout, visible, items)));
  return shown;
}

/**
 * Minimizar esconde também os estados de dentro: fica o que alguma linha à vista produz, recebe ou declara.
 * O que uma linha minimizada declara (e a variável do `for` minimizado) é de dentro dela.
 */
function withoutInside(layout: FlowLayout, visible: Visibility, items: StateItem[]): StateItem[] {
  const named = new Set<string>();
  for (const index of visible.rows) {
    const row = layout.rows[index]!;
    const open = !visible.closed.has(index);
    if (row.kind === 'fn') {
      named.add(row.name);
      if (row.in) named.add(row.in.name);
      if (row.out) named.add(row.out.name);
      if (row.source?.kind === 'file' && row.source.asObject) named.add(row.source.name);
      for (const list of [(row.node as FlowFunction).in, (row.node as FlowFunction).out, open ? (row.node as FlowFunction).data : undefined]) {
        for (const d of list ?? []) named.add(typeof d === 'string' ? d : d.name);
      }
    } else if (open && row.kind === 'for') {
      const variable = loopVariable((row.node as FlowBlock).label);
      if (variable) named.add(variable);
    }
  }
  // cada item do primeiro nível leva os campos junto
  let keep = false;
  return items.filter((item) => (item.level ? keep : (keep = named.has(item.name))));
}

/** Quantas linhas de estado tem o passo mais cheio. */
function stateDepth(items: StateItem[], mode: RenderOptions['states']): number {
  if (mode !== 'new') return items.length;
  let most = newest.get(items);
  if (most === undefined) {
    most = 0;
    for (let i = 0, from = 0; i < items.length; i++) {
      if (items[i]!.since !== items[from]!.since) from = i;
      most = Math.max(most, i - from + 1);
    }
    newest.set(items, most);
  }
  return most;
}

export function metrics(layout: FlowLayout, options: RenderOptions = {}) {
  const functionCol = Math.min(520, Math.max(220, Math.ceil(layout.labelWidth * CHAR_12) + 32));
  const left = SOURCE_COL + functionCol;
  const outside = options.names === 'outside';
  const step = outside ? STEP_OUTSIDE : Math.min(STEP_MAX, Math.max(STEP, Math.ceil(layout.leafWidth * CHAR_BAR) + 24 + INSET * 2));
  const top = options.card ? CARD_HEAD : 0;
  const rowsEnd = HEAD + (options.visible?.rows.length ?? layout.rows.length) * ROW;
  const stateHeight = options.state === false ? 0 : stateDepth(stateItems(layout, options), options.states) * LINE;
  return {
    left, functionCol, step, top, rowsEnd,
    /** Distância de `left` até `s0`. */
    lead: LEAD,
    width: left + LEAD + layout.steps * step + (outside ? TAIL_OUTSIDE : TAIL),
    height: top + rowsEnd + STATE_TOP + stateHeight + FOOT,
  };
}

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeXml = (s: string) => s.replace(/[&<>"']/g, (c) => ESCAPES[c]!).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

/** Corta o texto para caber na largura (fonte monoespaçada). */
export function clip(text: string, width: number, char = CHAR): string {
  const max = Math.max(1, Math.floor(width / char));
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

const n = (v: number) => Math.round(v * 10) / 10;
const text = (x: number, y: number, value: string, cls = '', anchor = '') =>
  `<text x="${n(x)}" y="${n(y)}"${cls ? ` class="${cls}"` : ''}${anchor ? ` text-anchor="${anchor}"` : ''}>${escapeXml(value)}</text>`;
const line = (x1: number, y1: number, x2: number, y2: number, cls = 'line') =>
  `<line class="${cls}" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}"/>`;
const circle = (x: number, y: number, r: number, cls: string) => `<circle class="${cls}" cx="${n(x)}" cy="${n(y)}" r="${r}"/>`;
const rect = (x: number, y: number, width: number, height: number, cls: string, rx = 0) =>
  `<rect class="${cls}" x="${n(x)}" y="${n(y)}" width="${n(Math.max(0, width))}" height="${n(Math.max(0, height))}"${rx ? ` rx="${rx}"` : ''}/>`;

/** Marca um trecho como alvo do ponteiro (veja `Target` em mount.ts). */
const target = (type: string, row: number, content: string, extra = '') => `<g data-t="${type}" data-row="${row}"${extra}>${content}</g>`;
/** Blocos cujo tamanho se muda arrastando a ponta da faixa. */
const RESIZABLE = new Set<Row['kind']>(['if', 'for', 'while', 'do-while', 'try']);

const kindClass = (kind: Row['kind']) =>
  kind === 'if' || kind === 'else' || kind === 'switch' || kind === 'case' ? 'if' : kind === 'try' ? 'try' : kind === 'catch' ? 'catch' : 'loop';

/** Marca do bloco; o `else` não tem. */
function mark(kind: Row['kind'], x: number, y: number): string {
  const path = (d: string) => `<path class="mark" d="${d}"/>`;
  const at = (a: number, b: number) => `${n(x + a)} ${n(y + b)}`;
  switch (kind) {
    case 'else': return '';
    case 'if': return path(`M${at(0, -7)}L${at(6.5, 5)}H${n(x - 6.5)}Z`);
    case 'switch': case 'case': return rect(x - 5, y - 5, 10, 10, 'mark', 1.5);
    case 'try': return path(`M${at(0, -7)}c1.8 0 3.5.9 4.6 2.1v4.2c0 2.8-2 4.4-4.6 5.4-2.6-1-4.6-2.6-4.6-5.4v-4.2c1.1-1.2 2.8-2.1 4.6-2.1z`);
    case 'catch': return `<path class="mark" style="fill:none" d="M${at(-5, -5)}l10 10M${at(5, -5)}l-10 10"/>`;
    default: return text(x, y + 0.5, '↻', 'mark-text', 'middle');
  }
}

function cube(x: number, y: number, size: number, cls: string): string {
  const h = size / 2;
  const at = (a: number, b: number) => `${n(x + a)},${n(y + b)}`;
  return `<polygon class="${cls}" points="${[at(0, -h), at(h, -h / 2), at(h, h / 2), at(0, h), at(-h, h / 2), at(-h, -h / 2)].join(' ')}"/>`
    + `<path class="cube-edge" d="M${at(-h, -h / 2)}L${at(0, 0)}L${at(h, -h / 2)}M${at(0, 0)}L${at(0, h)}"/>`;
}

/** Instância única: um segundo contorno em volta da marca. */
const ring = (x: number, y: number, size: number) => `<rect class="shared" x="${n(x - size / 2)}" y="${n(y - size / 2)}" width="${size}" height="${size}" rx="2"/>`;

function dataMark(d: DataPoint, x: number, y: number): string {
  if (d.shared) return ring(x, y, 15) + dataMark({ ...d, shared: false }, x, y);
  if (d.kind === 'function') return circle(x, y, 4.5, d.solid ? 'fn' : 'fn-o');
  const cls = d.solid ? 'data' : 'data-o';
  if (d.kind === 'object') return cube(x, y, 11, cls);
  return rect(x - 4, y - 4, 8, 8, cls);
}

/** Público: seta que sai da caixa. Privado: cadeado. */
function visibilityMark(visibility: NonNullable<Row['visibility']>, x: number, y: number): string {
  const path = visibility === 'public' ? 'M-1 -3h-3.500v7.500h7.500v-3.500M0.500 -4.500h4v4M4.500 -4.500l-5 5' : 'M-4 -0.500h8v5.500h-8zM-2.500 -0.500v-2a2.500 2.500 0 0 1 5 0v2';
  return `<g class="visibility" data-visibility="${visibility}" aria-label="${visibility}"><title>${visibility}</title><path class="src" d="${path}" transform="translate(${n(x)} ${n(y)})"/></g>`;
}

/** A forma do padrão sobre a barra: um cubo no fim (factory, constrói um objeto) ou um segundo contorno (singleton). */
function patternShape(r: Row, from: number, to: number, y: number): string {
  if (r.pattern === 'singleton') {
    return r.composite
      ? rect(from - 3, y - 6.5, to - from + 6, 17, 'double')
      : rect(from - 3, y - BAR / 2 - 3, to - from + 6, BAR + 6, 'double', BAR / 2 + 3);
  }
  return r.composite ? cube(to + 11, y + 1, 13, r.abstract ? 'fn-o' : 'fn') : cube(to - 11, y, 13, 'made');
}

/** Ícones do responsável (desenho 24 × 24, estilo Lucide). */
const ICONS = {
  file: ['M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4', 'M14 2v4a2 2 0 0 0 2 2h4', 'm5 12-3 3 3 3', 'm9 18 3-3-3-3'],
  person: ['M20 21a8 8 0 0 0-16 0', 'M17 8a5 5 0 1 1-10 0a5 5 0 1 1 10 0'],
  ai: ['M2 21a8 8 0 0 1 10.434-7.62', 'M15 8a5 5 0 1 1-10 0a5 5 0 1 1 10 0', 'M21 18a3 3 0 1 1-6 0a3 3 0 1 1 6 0', 'M18 14v1M18 21v1M22 18h-1M15 18h-1'],
  machine: ['m7.5 4.27 9 5.15', 'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z', 'm3.3 7 8.7 5 8.7-5', 'M12 22V12'],
  object: ['M12 2.5 20.5 7.5v9L12 21.5 3.5 16.5v-9z', 'M3.5 7.5 12 12.5l8.5-5', 'M12 12.5v9'],
  plus: ['M5 12h14', 'M12 5v14'],
} as const;

const icon = (name: keyof typeof ICONS, x: number, y: number, size = 10) =>
  `<g class="glyph" transform="translate(${n(x - size / 2)} ${n(y - size / 2)}) scale(${Math.round((size / 24) * 1000) / 1000})">${(ICONS[name] ?? []).map((d) => `<path d="${d}"/>`).join('')}</g>`;

function sourceIcon(source: Source | null, x: number, y: number): string {
  if (!source) return circle(x, y, 9, 'dashed') + icon('plus', x, y);
  // o arquivo como objeto é uma caixa: um cubo com o código dentro
  if (source.kind === 'file' && source.asObject) return `<g class="file-object">${cube(x, y, 20, 'box')}<path class="src" d="M-2 -2l-2 2l2 2M2 -2l2 2l-2 2" transform="translate(${n(x)} ${n(y)})"/></g>`;
  return circle(x, y, 9, 'ring') + icon(source.kind, x, y);
}

let sequence = 0;

/** Onde a barra de uma folha começa e termina. */
function leafBar(r: Row, x1: number, x2: number, outside: boolean): [number, number] {
  if (!outside) return [x1 + INSET, x2 - INSET];
  const center = (x1 + x2) / 2;
  return [center - BAR / 2, center + BAR / 2];
}

/** Conteúdo do SVG para a janela pedida. Nada fica fixo: tabela, cabeçalho, plano e estados andam juntos, como uma folha. */
export function renderContent(layout: FlowLayout, view: Viewport, options: RenderOptions = {}): string {
  const id = options.id ?? 'flow-view';
  const m = metrics(layout, options);
  const style = `<style>${styles(options.theme ?? 'dark', id)}</style>`;
  if (!options.card) return style + rect(0, 0, view.width, view.height, 'bg') + renderSheet(layout, view, options, m);

  const root = layout.rows[0]!;
  const file = root.source?.name ?? root.name;
  const half = CARD_HEAD / 2;
  const kind = root.abstract ? 'fn-o' : 'fn';
  // o cartão tem o tamanho do desenho; fora dele aparece o fundo da página
  const x = -view.x, y = -view.y;
  const { width, height } = m;
  const frame = `x="${n(x)}" y="${n(y)}" width="${n(width)}" height="${n(height)}" rx="8"`;
  return style
    + `<defs><clipPath id="${id}-card"><rect ${frame}/></clipPath></defs>`
    + `<g clip-path="url(#${id}-card)">${rect(x, y, width, height, 'bg')}`
    + renderSheet(layout, { ...view, y: view.y - CARD_HEAD }, options, m)
    + `<g class="card">${rect(x, y, width, half, 'card-file')}${rect(x, y + half, width, half, 'card-fn')}`
    + `${line(x, y + half, x + width, y + half, 'grid')}${line(x, y + CARD_HEAD, x + width, y + CARD_HEAD)}`
    + `${icon('file', x + 25, y + half / 2, 15)}${text(x + 44, y + half / 2, clip(file, width - 56, CHAR_12), 'card-title')}`
    + `${circle(x + 25, y + half * 1.5, 6, kind)}${text(x + 44, y + half * 1.5, clip(root.name, width - 56, CHAR_12), 'card-title')}</g></g>`
    + `<rect class="card-edge" ${frame}/>`;
}

/** A tabela, o plano e os estados. `view.y` conta a partir do cabeçalho das colunas. */
function renderSheet(layout: FlowLayout, view: Viewport, options: RenderOptions, m: ReturnType<typeof metrics>): string {
  const { rows, steps } = layout;
  const outside = options.names === 'outside';
  /** começo da tabela e divisória entre ela e o plano, já na janela */
  const tableAt = -view.x;
  const divider = tableAt + m.left;
  const X = (k: number) => divider + m.lead + k * m.step;
  const Y = (i: number) => HEAD + i * ROW - view.y;
  const right = view.width, bottom = view.height;
  const end = Math.min(right, m.width - view.x);
  const full = options.detail !== 'low';

  // o que está à vista, com uma folga de um passo e uma linha
  // `i` é a posição na tela; com linhas minimizadas ela difere do índice da linha
  const shown = options.visible?.rows;
  const closed = options.visible?.closed;
  const count = shown ? shown.length : rows.length;
  const at = (i: number) => rows[shown ? shown[i]! : i]!;
  const position = (index: number) => (shown ? positionOf(shown, index) : index);
  const firstRow = Math.max(0, Math.floor((view.y - HEAD) / ROW) - 1);
  const lastRow = Math.min(count - 1, Math.ceil((view.y + view.height - HEAD) / ROW));
  const firstStep = Math.max(0, Math.floor((view.x - m.left - m.lead) / m.step) - 1);
  const lastStep = Math.min(steps, Math.ceil((view.x + view.width - m.left - m.lead) / m.step) + 1);
  const seen = (from: number, to: number) => to >= firstStep && from <= lastStep;

  // posição na tela da linha destacada, se estiver à vista
  const picked = options.selected == null || !rows[options.selected] ? -1 : position(options.selected);
  const highlight = picked >= firstRow && picked <= lastRow && at(picked).index === options.selected ? picked : -1;
  const band = (from: number, width: number) => rect(from, Y(highlight), width, ROW, 'sel');

  const body: string[] = [];
  if (highlight >= 0) body.push(band(divider, end - divider));
  const rowsEnd = m.rowsEnd - view.y;
  const pillsAt = rowsEnd + FOOT_PILLS;
  for (let k = firstStep; k <= lastStep; k++) body.push(line(X(k), HEAD - 10 - view.y, X(k), pillsAt - 8, 'grid'));
  for (let i = firstRow; i <= lastRow; i++) body.push(line(divider, Y(i) + ROW, end, Y(i) + ROW));
  body.push(line(X(0), rowsEnd + 4, X(steps), rowsEnd + 4));
  const gridEnd = body.length;

  // sequência: a saída de uma folha liga-se à entrada da folha do passo seguinte
  if (full && count && lastRow >= firstRow) {
    const first = at(firstRow).index, last = at(lastRow).index;
    for (const link of layout.links) {
      if (link.to < first || link.from > last) continue;
      const a = rows[link.from]!, b = rows[link.to]!;
      if (!seen(a.start, b.end)) continue;
      const pa = position(a.index), pb = position(b.index);
      if (shown && (shown[pa] !== a.index || shown[pb] !== b.index)) continue;
      const from = leafBar(a, X(a.start), X(a.end), outside)[1], to = leafBar(b, X(b.start), X(b.end), outside)[0];
      body.push(`<path class="dep" d="M${n(from)} ${n(Y(pa) + ROW / 2)}H${n(X(a.end))}V${n(Y(pb) + ROW / 2)}H${n(to)}"><title>${escapeXml(link.names.join(', '))}</title></path>`);
    }
  }

  for (let i = firstRow; i <= lastRow; i++) {
    const r = at(i);
    const y = Y(i) + ROW / 2;
    if (!seen(r.start, r.end)) continue;
    const x1 = X(r.start), x2 = X(r.end);
    const [barFrom, barTo] = r.composite ? [x1 + SPAN_INSET, x2 - SPAN_INSET] : leafBar(r, x1, x2, outside);

    if (!full) {
      // de longe: uma forma por linha
      body.push(
        r.kind !== 'fn'
          ? `<g class="k-${kindClass(r.kind)}">${rect(x1 + 11, y - 8, x2 - x1 - 17, 16, 'band')}</g>`
          : r.composite
            ? rect(barFrom, y - 3, barTo - barFrom, 9, r.abstract ? 'fn-o' : 'fn')
            : rect(barFrom, y - BAR / 2, barTo - barFrom, BAR, r.abstract ? 'fn-o' : 'fn', BAR / 2),
      );
      continue;
    }

    if (r.kind !== 'fn') {
      const label = r.kind === 'catch' ? 'catch · if the try fails' : r.name;
      const from = x1 + (r.kind === 'else' ? 4 : 11);
      const width = Math.max(Math.min(label.length * CHAR_9 + 12, m.step * 2), x2 - 6 - from);
      const shape = rect(from, y - 8, width, 16, 'band', 2) + text(from + 6, y, clip(label, width - 10, CHAR_9));
      body.push(target('bar', r.index,
        `<g class="k-${kindClass(r.kind)}"><title>${escapeXml(label)}</title>${r.kind === 'else' ? `<g class="else">${shape}</g>` : shape}${mark(r.kind, x1, y)}</g>`,
      ));
      if (options.editable && RESIZABLE.has(r.kind)) {
        body.push(target('resize', r.index, `<title>Drag to grow or shrink the block</title>${rect(from + width - 7, y - 12, 16, 24, 'grip-hit')}${rect(from + width - 4, y - 8, 4, 16, 'grip', 1)}`, ' class="grip-g"'));
      }
      continue;
    }

    if (r.in) {
      body.push(line(x1 + 4, y, barFrom, y, 'wire'), target('data', r.index, dataMark(r.in, x1, y) + text(x1 - 16, y, clip(r.in.name, LEAD - 20, CHAR_9), 'dn', 'end'), ' data-side="in"'));
    }
    const outLabel = r.out ? clip(r.out.name, TAIL - 20, CHAR_9) : '';
    if (r.out) {
      body.push(line(barTo, y, x2 - 4, y, 'wire'), target('data', r.index, dataMark(r.out, x2, y) + text(x2 + 16, y, outLabel, 'dn'), ' data-side="out"'));
    }
    if (options.editable) {
      for (const [side, x, has] of [['in', x1, r.in], ['out', x2, r.out]] as const) {
        if (has) continue;
        const label = side === 'in' ? 'Add input' : 'Add output';
        body.push(target('add', r.index, `<title>${label}</title>${circle(x, y, 11, 'grip-hit')}${rect(x - 4, y - 4, 8, 8, 'ghost-box')}<path class="ghost-plus" d="M${n(x - 2)} ${n(y)}h4M${n(x)} ${n(y - 2)}v4"/>`, ` data-side="${side}" class="ghost"`));
      }
    }
    const title = `<title>${escapeXml(r.name)}</title>`;
    const cls = r.abstract ? 'fn-o' : 'fn';
    if (r.composite) {
      body.push(target('bar', r.index,
        `${title}<path class="${cls}" d="M${n(barFrom)} ${n(y - 3.5)}H${n(barTo)}V${n(y + 7.5)}L${n(barTo - 5)} ${n(y + 3.5)}H${n(barFrom + 5)}L${n(barFrom)} ${n(y + 7.5)}Z"/>`
        + (r.pattern ? patternShape(r, barFrom, barTo, y) : '')
        + target('name', r.index, text((barFrom + barTo) / 2, y - 10.5, clip(r.name, Math.max(60, barTo - barFrom), CHAR_BAR), 'label', 'middle')),
      ));
    } else {
      // com o nome fora, ele vem depois da saída, para não cair em cima dela
      const name = outside
        ? text(x2 + (r.out ? 16 + outLabel.length * CHAR_9 + 16 : 10), y, clip(r.name, 150, CHAR_BAR), 'label')
        : text((barFrom + barTo) / 2, y, clip(r.name, barTo - barFrom - (r.pattern === 'factory' ? 40 : 8), CHAR_BAR), r.abstract ? 'in-o' : 'on-fn', 'middle');
      body.push(target('bar', r.index,
        `${title}${rect(barFrom, y - BAR / 2, barTo - barFrom, BAR, cls, BAR / 2)}`
        + (r.pattern ? patternShape(r, barFrom, barTo, y) : '')
        + target('name', r.index, name),
      ));
    }
  }

  // passos de baixo
  if (full) for (let k = firstStep; k <= lastStep; k++) body.push(stepPill(X(k), pillsAt, k));

  // estados: em cada passo, tudo que já existe nele ou só o que chega
  if (full && options.state !== false) {
    const items = stateItems(layout, options);
    const top = rowsEnd + STATE_TOP;
    const firstLine = Math.max(0, Math.floor(-top / LINE) - 1);
    const lastLine = Math.ceil((bottom - top) / LINE);
    for (let k = firstStep; k <= lastStep; k++) {
      const start = options.states === 'new' ? availableAt(items, k - 1) : 0;
      const until = Math.min(availableAt(items, k), start + lastLine);
      // os campos pertencem ao item do primeiro nível acima deles
      let head = start + firstLine;
      while (head > 0 && items[head]?.level) head--;
      for (let j = start + firstLine; j < until; j++) {
        const item = items[j]!;
        if (!item.level) head = j;
        const indent = Math.min(item.level, 6) * 10;
        const x = X(k) + indent, y = top + (j - start) * LINE;
        // campos de objeto têm a marca menor, recuada sob o objeto
        const size = item.level ? 5 : 8;
        const mk = item.kind === 'function' ? circle(x, y, size / 2, item.solid ? 'fn' : 'fn-o')
          : item.kind === 'object' ? cube(x, y, size + 3, item.solid ? 'data' : 'data-o')
          : rect(x - size / 2, y - size / 2, size, size, item.solid ? 'data' : 'data-o');
        // objeto mostra só o nome; os valores ficam nos campos
        const label = item.value === undefined ? item.name : `${item.name} = ${item.value}`;
        body.push(`<g class="${item.since < k ? 'dim' : 'bold'}" data-t="state" data-name="${escapeXml(items[head]!.name)}">${item.shared ? ring(x, y, size + 5) : ''}${mk}${text(x + 10, y, clip(label, m.step - 18 - indent, CHAR_9))}</g>`);
      }
    }
  }

  // barras verticais de quem tem filhas (como no site do FOP): na coluna em que começa, das linhas de dentro até a última;
  // quem começa na mesma coluna fica 4 px à direita de quem o contém. Valem também os blocos abertos acima da janela.
  const rails: string[] = [];
  const open: Row[] = [];
  for (let p = firstRow < count ? at(firstRow).parent : -1; p >= 0; p = rows[p]!.parent) {
    open.push(rows[p]!);
    if (open.length === MAX_OPEN_GUIDES) {
      open.push(rows[0]!);
      break;
    }
  }
  for (let i = firstRow; i <= lastRow; i++) if (at(i).composite) open.push(at(i));
  for (const r of open) {
    if (closed?.has(r.index) || !seen(r.start, r.start)) continue;
    let stacked = 0;
    for (let p = r.parent; p >= 0 && stacked < MAX_RAILS && rows[p]!.start === r.start; p = rows[p]!.parent) stacked++;
    const x = X(r.start) + stacked * RAIL;
    const from = Math.max(Y(position(r.index)) + ROW, -ROW), to = Math.min(Y(position(r.last + 1)), bottom + ROW);
    if (to <= from) continue;
    const shape = line(x, from, x, to, 'rail');
    rails.push(r.kind === 'fn' ? shape : `<g class="k-${kindClass(r.kind)}">${shape}</g>`);
  }
  // as barras ficam sobre a grade e sob as marcas
  body.splice(gridEnd, 0, ...rails);

  // a tabela
  const side: string[] = [];
  for (let i = firstRow; i <= lastRow; i++) {
    const r = at(i);
    const y = Y(i) + ROW / 2;
    side.push(line(tableAt, Y(i) + ROW, divider, Y(i) + ROW));
    const x = tableAt + SOURCE_COL + Math.min(r.depth, INDENT_LIMIT) * INDENT;
    if (!full) {
      // só a marca, no recuo: a forma da árvore continua visível
      side.push(r.kind === 'fn' ? circle(x + 7, y, 6, r.abstract ? 'fn-o' : 'fn') : `<g class="k-${kindClass(r.kind)}">${mark(r.kind, x + 7, y)}</g>`);
      continue;
    }
    if (r.kind === 'fn') {
      const name = r.source?.name ?? 'abstract';
      side.push(target('source', r.index, rect(tableAt + PAD - 2, y - 12, SOURCE_COL - PAD - 4, 24, 'grip-hit') + sourceIcon(r.source, tableAt + PAD + 9, y) + text(tableAt + PAD + 24, y, clip(name, SOURCE_COL - PAD - 30, CHAR_UI), r.source ? 'source' : 'source abs')));
    }
    side.push(taskCell(r, x, y, divider, options));
  }
  if (highlight >= 0) side.push(band(tableAt, m.left), rect(tableAt, Y(highlight), 3, ROW, 'sel-mark'));
  side.push(line(divider, -view.y, divider, m.height - m.top - view.y, 'divider'));

  const header: string[] = [];
  if (full) {
    header.push(text(tableAt + PAD, HEAD - 14 - view.y, 'SOURCE', 'head'), text(tableAt + SOURCE_COL, HEAD - 14 - view.y, 'FUNCTION', 'head'));
    for (let k = firstStep; k <= lastStep; k++) header.push(stepPill(X(k), HEAD - 18 - view.y, k));
  }

  return body.join('') + side.join('') + header.join('');
}

/** A célula da função: seta, marca, nome (ou a instrução do bloco) e o que vem depois dele. */
function taskCell(r: Row, x: number, y: number, left: number, options: RenderOptions): string {
  const closed = !!options.visible?.closed.has(r.index);
  const hidden = closed ? `+${r.last - r.index}` : '';
  const toggle = options.toggles && r.composite;
  const out: string[] = [];
  if (toggle) out.push(chevron(r, x + 7, y, closed));
  let at = x + (toggle ? 18 : 0);
  const room = (marks = 0) => left - at - 12 - marks - (hidden ? hidden.length * CHAR + 8 : 0);

  if (r.kind !== 'fn') {
    const kind = kindClass(r.kind);
    const parts = [mark(r.kind, at + 7, y)];
    if (r.kind !== 'else') at += 20;
    let label = r.name;
    if (r.kind === 'else' || r.kind === 'catch') {
      const width = r.kind.length * CHAR_9 + 10;
      parts.push(rect(at, y - 7, width, 14, 'badge', 3), text(at + width / 2, y, r.kind, 'badge-text', 'middle'));
      at += width + 8;
      label = r.kind === 'else' ? 'otherwise' : 'if the try fails';
    }
    const shown = clip(label, room(), CHAR_12);
    parts.push(target('name', r.index, text(at, y, shown, 'block')));
    out.push(`<g class="k-${kind}"><title>${escapeXml(r.name)}</title>${parts.join('')}</g>`);
    at += shown.length * CHAR_12;
  } else {
    const tag = r.pattern ?? '';
    const marks = (r.visibility ? 18 : 0) + (tag ? tag.length * CHAR + 6 : 0) + (r.parallel ? 16 : 0);
    const dot = circle(at + 7, y, 6, r.abstract ? 'fn-o' : 'fn');
    at += 22;
    const shown = clip(r.name, room(marks), CHAR_12);
    out.push(`<g><title>${escapeXml(r.name)}</title>${dot}${target('name', r.index, text(at, y, shown, 'name'))}</g>`);
    at += shown.length * CHAR_12;
    if (r.parallel) {
      out.push(`<g aria-label="parallel"><title>Runs together with the previous one</title>${text(at + 8, y, '∥', 'par')}</g>`);
      at += 16;
    }
    if (r.visibility) {
      out.push(visibilityMark(r.visibility, at + 10, y));
      at += 18;
    }
    if (tag) {
      out.push(text(at + 6, y, tag, 'tag'));
      at += tag.length * CHAR + 6;
    }
  }
  if (hidden) out.push(text(at + 8, y, hidden, 'muted'));
  return out.join('');
}

/** Seta de minimizar: aponta para baixo quando aberta, para a direita quando minimizada. */
function chevron(r: Row, x: number, y: number, closed: boolean): string {
  const path = closed ? 'M-2 -4l4 4l-4 4' : 'M-4 -2l4 4l4 -4';
  return `<g class="toggle" data-toggle="${r.index}" role="button" tabindex="0" aria-expanded="${!closed}" aria-label="${closed ? 'Expand' : 'Collapse'} ${escapeXml(r.name)}">`
    + `<rect class="hit" x="${n(x - 8)}" y="${n(y - 12)}" width="16" height="24" rx="4"/><path class="src" d="${path}" transform="translate(${n(x)} ${n(y)})"/></g>`;
}

function stepPill(x: number, y: number, k: number): string {
  const label = `s${k}`;
  const w = Math.max(24, label.length * CHAR_9 + 10);
  return `${rect(x - w / 2, y - 8, w, 16, 'chip', 3)}${text(x, y, label, 'step', 'middle')}`;
}

/** Quantos itens do estado existem no passo k (a lista está ordenada por `since`). */
export function availableAt(state: FlowLayout['state'], k: number): number {
  let low = 0, high = state.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (state[mid]!.since <= k) low = mid + 1;
    else high = mid;
  }
  return low;
}

/** Documento SVG completo: para exportar, ou para usar sem navegador. Sem `view`, desenha o fluxo inteiro. */
export function renderSvg(layout: FlowLayout, options: RenderOptions & { view?: Viewport } = {}): string {
  const id = options.id ?? `flow-view-${++sequence}`;
  const m = metrics(layout, options);
  const view = options.view ?? { x: 0, y: 0, width: m.width, height: m.height };
  return `<svg xmlns="http://www.w3.org/2000/svg" id="${id}" width="${view.width}" height="${view.height}" role="img" aria-label="${escapeXml(describe(layout))}">`
    + `${renderContent(layout, view, { ...options, id })}</svg>`;
}

export const describe = (layout: FlowLayout) =>
  `Flow ${layout.rows[0]!.name}: ${layout.rows.filter((r) => r.kind === 'fn').length} functions in ${layout.steps} ${layout.steps === 1 ? 'step' : 'steps'}`;

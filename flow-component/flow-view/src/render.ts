// Desenha só o que cabe na janela: o custo depende do tamanho da tela, não do tamanho do fluxo.
import { positionOf, type Visibility } from './collapse.ts';
import { INDENT_LIMIT } from './layout.ts';
import { styles, type Theme } from './theme.ts';
import type { DataPoint, FlowLayout, Row, Source } from './types.ts';

export const ROW = 34, STEP = 160, HEAD = 52, SOURCE_COL = 108, LEAD = 140, TAIL = 140;
/** Guias de blocos que vêm de cima da janela: as mais próximas (e a raiz). */
const MAX_OPEN_GUIDES = 32;
const FOOT_TOP = 48, LINE = 15, CHAR = 6.6, INDENT = 14;

export interface Viewport { x: number; y: number; width: number; height: number }
export interface RenderOptions {
  theme?: Theme;
  /** Lista de estado abaixo de cada passo (padrão: sim). */
  state?: boolean;
  /** Distingue vários desenhos na mesma página. */
  id?: string;
  /** `low`: visão de longe, sem textos, dados nem estado (usada com zoom pequeno). */
  detail?: 'full' | 'low';
  /** Linhas à vista quando há funções minimizadas (veja `visibleRows`). Ausente = todas. */
  visible?: Visibility;
  /** Mostra as setas de minimizar nas linhas com filhos. */
  toggles?: boolean;
  /** Índice da linha destacada. */
  selected?: number | null;
}

export function metrics(layout: FlowLayout, options: RenderOptions = {}) {
  const functionCol = Math.min(420, Math.max(160, Math.ceil(layout.labelWidth * CHAR) + 48));
  const left = SOURCE_COL + functionCol;
  const rowsEnd = HEAD + (options.visible?.rows.length ?? layout.rows.length) * ROW;
  const stateHeight = options.state === false ? 0 : layout.state.length * LINE;
  return {
    left, functionCol, rowsEnd,
    width: left + LEAD + layout.steps * STEP + TAIL,
    height: rowsEnd + FOOT_TOP + stateHeight + 16,
  };
}

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeXml = (s: string) => s.replace(/[&<>"']/g, (c) => ESCAPES[c]!).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

/** Corta o texto para caber na largura (fonte monoespaçada). */
export function clip(text: string, width: number): string {
  const max = Math.max(1, Math.floor(width / CHAR));
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

const n = (v: number) => Math.round(v * 10) / 10;
const text = (x: number, y: number, value: string, cls = '', anchor = '') =>
  `<text x="${n(x)}" y="${n(y)}"${cls ? ` class="${cls}"` : ''}${anchor ? ` text-anchor="${anchor}"` : ''}>${escapeXml(value)}</text>`;
const line = (x1: number, y1: number, x2: number, y2: number, cls = 'line') =>
  `<line class="${cls}" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}"/>`;
const circle = (x: number, y: number, r: number, cls: string) => `<circle class="${cls}" cx="${n(x)}" cy="${n(y)}" r="${r}"/>`;

const kindClass = (kind: Row['kind']) =>
  kind === 'if' || kind === 'else' || kind === 'switch' || kind === 'case' ? 'if' : kind === 'try' ? 'try' : kind === 'catch' ? 'catch' : 'loop';

function mark(kind: Row['kind'], x: number, y: number): string {
  const poly = (points: number[][]) => `<polygon class="mark" points="${points.map(([a, b]) => `${n(x + a!)},${n(y + b!)}`).join(' ')}"/>`;
  switch (kind) {
    case 'if': case 'switch': case 'case': return poly([[0, -6], [6, 5], [-6, 5]]);
    case 'else': return poly([[0, 6], [6, -5], [-6, -5]]);
    case 'try': return poly([[-5, -6], [5, -6], [5, 1], [0, 6], [-5, 1]]);
    case 'catch': return `<path class="mark" fill="none" d="M${n(x - 5)} ${n(y - 5)}l10 10M${n(x + 5)} ${n(y - 5)}l-10 10"/>`;
    default: return `<circle class="mark" cx="${n(x)}" cy="${n(y)}" r="6"/>${text(x, y + 0.5, '↻', '', 'middle')}`;
  }
}

function cube(x: number, y: number, size: number, cls: string): string {
  const h = size / 2;
  const at = (a: number, b: number) => `${n(x + a)},${n(y + b)}`;
  return `<polygon class="${cls}" points="${[at(0, -h), at(h, -h / 2), at(h, h / 2), at(0, h), at(-h, h / 2), at(-h, -h / 2)].join(' ')}"/>`
    + `<path class="cube-edge" d="M${at(-h, -h / 2)}L${at(0, 0)}L${at(h, -h / 2)}M${at(0, 0)}L${at(0, h)}"/>`;
}

function dataMark(d: DataPoint, x: number, y: number): string {
  if (d.kind === 'function') return circle(x, y, 4.5, d.solid ? 'fn' : 'fn-o');
  const cls = d.solid ? 'data' : 'data-o';
  if (d.kind === 'object') return cube(x, y, 11, cls);
  return `<rect class="${cls}" x="${n(x - 4.5)}" y="${n(y - 4.5)}" width="9" height="9"/>`;
}

function sourceIcon(source: Source | null, x: number, y: number): string {
  const ring = circle(x, y, 9, source ? 'src' : 'src dashed');
  const d = (path: string) => `<path class="src" d="${path}" transform="translate(${n(x)} ${n(y)})"/>`;
  if (!source) return ring + d('M-4 0h8M0 -4v8');
  const glyph = {
    file: 'M-3.5 -5h4.500l2.500 2.5v7.500h-7zM-1.500 0l-1 1.500l1 1.500M1.500 0l1 1.500l-1 1.500',
    person: 'M0 -5a2.2 2.2 0 1 0 0.01 0M-4.500 5c0-6 9-6 9 0',
    ai: 'M0 -5.500L1.500 -1.500L5.500 0L1.500 1.500L0 5.500L-1.500 1.500L-5.500 0L-1.500 -1.500z',
    machine: 'M-4 -4h8v8h-8zM-1.500 -1.500h3v3h-3z',
    object: 'M0 -5l4.500 2.500v5l-4.500 2.500l-4.500 -2.500v-5zM-4.500 -2.500l4.500 2.500l4.500 -2.500M0 0v5',
  }[source.kind] ?? '';
  return ring + d(glyph);
}

let sequence = 0;

/** Conteúdo do SVG para a janela pedida, em coordenadas da tela (cabeçalho e colunas ficam fixos). */
export function renderContent(layout: FlowLayout, view: Viewport, options: RenderOptions = {}): string {
  const { rows, state, steps } = layout;
  const m = metrics(layout, options);
  const id = options.id ?? 'flow-view';
  const X = (k: number) => m.left + LEAD + k * STEP - view.x;
  const Y = (i: number) => HEAD + i * ROW - view.y;
  const right = view.width, bottom = view.height;
  const full = options.detail !== 'low';

  // o que está à vista, com uma folga de um passo e uma linha
  // `i` é a posição na tela; com linhas minimizadas ela difere do índice da linha
  const shown = options.visible?.rows;
  const closed = options.visible?.closed;
  const count = shown ? shown.length : rows.length;
  const at = (i: number) => rows[shown ? shown[i]! : i]!;
  const position = (index: number) => (shown ? positionOf(shown, index) : index);
  const firstRow = Math.max(0, Math.floor(view.y / ROW) - 1);
  const lastRow = Math.min(count - 1, Math.ceil((view.y + view.height - HEAD) / ROW));
  const firstStep = Math.max(0, Math.floor((view.x - LEAD) / STEP) - 1);
  const lastStep = Math.min(steps, Math.ceil((view.x + view.width - m.left - LEAD) / STEP) + 1);
  const seen = (from: number, to: number) => to >= firstStep && from <= lastStep;

  // posição na tela da linha destacada, se estiver à vista
  const picked = options.selected == null || !rows[options.selected] ? -1 : position(options.selected);
  const highlight = picked >= firstRow && picked <= lastRow && at(picked).index === options.selected ? picked : -1;
  const band = (from: number, width: number) => `<rect class="sel" x="${n(from)}" y="${n(Y(highlight))}" width="${n(Math.max(0, width))}" height="${ROW}"/>`;

  const body: string[] = [];
  if (highlight >= 0) body.push(band(m.left, Math.min(right, m.width - view.x) - m.left));
  const bottomPills = m.rowsEnd - view.y + 22;
  for (let k = firstStep; k <= lastStep; k++) body.push(line(X(k), HEAD - view.y, X(k), bottomPills));
  for (let i = firstRow; i <= lastRow; i++) body.push(line(0, Y(i) + ROW, Math.min(right, m.width - view.x), Y(i) + ROW));

  // guias: valem para as linhas visíveis e para os blocos abertos acima da primeira
  const guides: Row[] = [];
  for (let p = firstRow < count ? at(firstRow).parent : -1; p >= 0; p = rows[p]!.parent) {
    guides.push(rows[p]!);
    if (guides.length === MAX_OPEN_GUIDES) {
      guides.push(rows[0]!);
      break;
    }
  }
  for (let i = firstRow; i <= lastRow; i++) if (at(i).composite) guides.push(at(i));
  for (const r of guides) {
    if (!r.composite || closed?.has(r.index) || !seen(r.start, r.start)) continue;
    const x = X(r.start) + Math.min(r.nest + (r.kind === 'fn' ? 0 : 1), 8) * 4;
    const y1 = Math.max(Y(position(r.index)) + ROW, HEAD);
    const y2 = Math.min(Y(position(r.last + 1)), bottom);
    if (y2 > y1) body.push(r.kind === 'fn' ? line(x, y1, x, y2, 'fn-l') : `<g class="k-${kindClass(r.kind)}">${line(x, y1, x, y2, 'guide')}</g>`);
  }

  for (let i = firstRow; i <= lastRow; i++) {
    const r = at(i);
    const y = Y(i) + ROW / 2;
    if (!seen(r.start, r.end)) continue;
    const x1 = X(r.start), x2 = X(r.end);

    if (!full) {
      // de longe: uma forma por linha
      body.push(
        r.kind !== 'fn'
          ? `<g class="k-${kindClass(r.kind)}"><rect class="band" x="${n(x1 + 11)}" y="${n(y - 8)}" width="${n(x2 - x1 - 17)}" height="16"/></g>`
          : r.composite
            ? `<rect class="${r.abstract ? 'fn-o' : 'fn'}" x="${n(x1 + 21)}" y="${n(y - 3)}" width="${n(x2 - x1 - 42)}" height="9"/>`
            : `<rect class="${r.abstract ? 'fn-o' : 'fn'}" x="${n(x1 + 32)}" y="${n(y - 11)}" width="${n(x2 - x1 - 64)}" height="22" rx="11"/>`,
      );
      continue;
    }

    if (r.kind !== 'fn') {
      const from = x1 + 11, to = x2 - 6;
      const labelAt = Math.max(from + 6, Math.min(m.left + 6, to - 40));
      body.push(
        `<g class="k-${kindClass(r.kind)}"><title>${escapeXml(r.name)}</title><rect class="band" x="${n(from)}" y="${n(y - 8)}" width="${n(to - from)}" height="16"/>`
        + `${text(labelAt, y, clip(r.name, to - labelAt - 4))}${mark(r.kind, x1, y)}</g>`,
      );
      continue;
    }

    const barFrom = r.composite ? x1 + 21 : x1 + 32;
    const barTo = r.composite ? x2 - 21 : x2 - 32;
    if (r.in) {
      body.push(line(x1, y, barFrom, y, 'wire'), dataMark(r.in, x1, y), text(x1 - 11, y, clip(r.in.name, LEAD - 16), '', 'end'));
    }
    if (r.out) {
      body.push(line(barTo, y, x2, y, 'wire'), dataMark(r.out, x2, y), text(x2 + 11, y, clip(r.out.name, TAIL - 16)));
    }
    const title = `<title>${escapeXml(r.name)}</title>`;
    if (r.composite) {
      const cls = r.abstract ? 'fn-o' : 'fn';
      // o nome fica na parte visível da barra
      const visibleFrom = Math.max(barFrom, m.left), visibleTo = Math.min(barTo, right);
      body.push(
        `<g>${title}<rect class="${cls}" x="${n(barFrom)}" y="${n(y - 2)}" width="${n(barTo - barFrom)}" height="7"/>`
        + `<path class="${cls}" d="M${n(barFrom)} ${n(y + 5)}v5l5 -5zM${n(barTo)} ${n(y + 5)}v5l-5 -5z"/>`
        + `${visibleTo > visibleFrom ? text((visibleFrom + visibleTo) / 2, y - 10, clip(r.name, Math.max(60, visibleTo - visibleFrom)), '', 'middle') : ''}</g>`,
      );
    } else {
      body.push(
        `<g>${title}<rect class="${r.abstract ? 'fn-o' : 'fn'}" x="${n(barFrom)}" y="${n(y - 11)}" width="${n(barTo - barFrom)}" height="22" rx="11"/>`
        + `${text((barFrom + barTo) / 2, y, clip(r.name, barTo - barFrom - 8), r.abstract ? 'in-o' : 'on-fn', 'middle')}</g>`,
      );
    }
  }

  // passos de baixo
  if (full) for (let k = firstStep; k <= lastStep; k++) body.push(stepPill(X(k), bottomPills + 8, k));

  // estado de cada passo: o começo da lista até o que já existe naquele passo
  if (full && options.state !== false) {
    const top = m.rowsEnd + FOOT_TOP - view.y;
    const firstLine = Math.max(0, Math.floor((HEAD - top) / LINE));
    const lastLine = Math.ceil((bottom - top) / LINE);
    for (let k = firstStep; k <= lastStep; k++) {
      const until = Math.min(availableAt(state, k), lastLine);
      for (let j = firstLine; j < until; j++) {
        const item = state[j]!;
        const indent = Math.min(item.level, 6) * 10;
        const x = X(k) + indent, y = top + j * LINE;
        // campos de objeto têm a marca menor, recuada sob o objeto
        const size = item.level ? 7 : 9;
        const mk = item.kind === 'function' ? circle(x, y, size / 2, item.solid ? 'fn' : 'fn-o')
          : item.kind === 'object' ? cube(x, y, size + 2, item.solid ? 'data' : 'data-o')
          : `<rect class="${item.solid ? 'data' : 'data-o'}" x="${n(x - size / 2)}" y="${n(y - size / 2)}" width="${size}" height="${size}"/>`;
        // objeto mostra só o nome; os valores ficam nos campos
        const label = item.value === undefined ? item.name : `${item.name} = ${item.value}`;
        body.push(`<g class="${item.since < k ? 'dim' : 'bold'}">${mk}${text(x + 10, y, clip(label, STEP - 18 - indent))}</g>`);
      }
    }
  }

  // colunas fixas à esquerda
  const side: string[] = [`<rect class="bg" x="0" y="${HEAD}" width="${m.left}" height="${n(Math.max(0, Math.min(bottom, m.rowsEnd - view.y) - HEAD))}"/>`];
  for (let i = firstRow; i <= lastRow; i++) {
    const r = at(i);
    const y = Y(i) + ROW / 2;
    side.push(line(0, Y(i) + ROW, m.left, Y(i) + ROW));
    if (!full) {
      // só a marca, no recuo: a forma da árvore continua visível
      const x = SOURCE_COL + 18 + Math.min(r.depth, INDENT_LIMIT) * INDENT;
      side.push(r.kind === 'fn' ? circle(x, y, 6, r.abstract ? 'fn-o' : 'fn') : `<g class="k-${kindClass(r.kind)}">${mark(r.kind, x, y)}</g>`);
      continue;
    }
    if (r.kind === 'fn') {
      const name = r.source?.name ?? 'abstrato';
      side.push(sourceIcon(r.source, 22, y), text(38, y, clip(name, SOURCE_COL - 44), r.source ? '' : 'abs'));
    }
    const x = SOURCE_COL + 18 + Math.min(r.depth, INDENT_LIMIT) * INDENT;
    const glyph = r.kind === 'fn' ? circle(x, y, 4.5, r.abstract ? 'fn-o' : 'fn') : `<g class="k-${kindClass(r.kind)}">${mark(r.kind, x, y)}</g>`;
    const isClosed = !!closed?.has(r.index);
    const hidden = isClosed ? `+${r.last - r.index}` : '';
    const room = m.left - x - 18 - (hidden ? hidden.length * CHAR + 8 : 0);
    const label = clip(r.name, room);
    side.push(`<g><title>${escapeXml(r.name)}</title>${glyph}${text(x + 12, y, label)}</g>`);
    if (hidden) side.push(text(x + 20 + label.length * CHAR, y, hidden, 'muted'));
    if (options.toggles && r.composite) side.push(chevron(r, x - 13, y, isClosed));
  }
  if (highlight >= 0 && Y(highlight) + ROW > HEAD) side.push(`<g clip-path="url(#${id}-side)">${band(0, m.left)}<rect class="sel-mark" x="0" y="${n(Y(highlight))}" width="3" height="${ROW}"/></g>`);
  side.push(line(SOURCE_COL, HEAD, SOURCE_COL, m.rowsEnd - view.y), line(m.left, HEAD, m.left, m.rowsEnd - view.y));

  const header = [`<rect class="bg" x="0" y="0" width="${n(right)}" height="${HEAD}"/>`];
  const pills: string[] = [];
  if (full) for (let k = firstStep; k <= lastStep; k++) pills.push(stepPill(X(k), HEAD - 22, k));
  header.push(
    `<g clip-path="url(#${id}-head)">${pills.join('')}</g>`,
    full ? text(16, HEAD - 14, 'SOURCE', 'head') + text(SOURCE_COL + 18, HEAD - 14, 'FUNÇÃO', 'head') : '',
    line(m.left, 12, m.left, HEAD), line(0, HEAD, Math.min(right, m.width - view.x), HEAD),
  );

  return `<style>${styles(options.theme ?? 'dark', id)}</style>`
    + `<defs><clipPath id="${id}-body"><rect x="${m.left}" y="${HEAD}" width="${n(Math.max(0, right - m.left))}" height="${n(Math.max(0, bottom - HEAD))}"/></clipPath>`
    + `<clipPath id="${id}-side"><rect x="0" y="${HEAD}" width="${m.left}" height="${n(Math.max(0, bottom - HEAD))}"/></clipPath>`
    + `<clipPath id="${id}-head"><rect x="${m.left}" y="0" width="${n(Math.max(0, right - m.left))}" height="${HEAD}"/></clipPath></defs>`
    + `<rect class="bg" x="0" y="0" width="${n(right)}" height="${n(bottom)}"/>`
    // as linhas horizontais cruzam as colunas fixas; o resto do corpo fica recortado à direita delas
    + `<g clip-path="url(#${id}-body)">${body.join('')}</g>`
    + side.join('') + header.join('');
}

/** Seta de minimizar: aponta para baixo quando aberta, para a direita quando minimizada. */
function chevron(r: Row, x: number, y: number, closed: boolean): string {
  const path = closed ? 'M-2 -4l4 4l-4 4' : 'M-4 -2l4 4l4 -4';
  return `<g class="toggle" data-toggle="${r.index}" role="button" tabindex="0" aria-expanded="${!closed}" aria-label="${closed ? 'Expandir' : 'Minimizar'} ${escapeXml(r.name)}">`
    + `<rect class="hit" x="${n(x - 8)}" y="${n(y - 12)}" width="16" height="24" rx="4"/><path class="src" d="${path}" transform="translate(${n(x)} ${n(y)})"/></g>`;
}

function stepPill(x: number, y: number, k: number): string {
  const label = `s${k}`;
  const w = Math.max(24, label.length * CHAR + 10);
  return `<rect class="pill" x="${n(x - w / 2)}" y="${n(y - 8)}" width="${n(w)}" height="16" rx="3"/>${text(x, y, label, 'step', 'middle')}`;
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
  `Fluxo ${layout.rows[0]!.name}: ${layout.rows.filter((r) => r.kind === 'fn').length} funções em ${layout.steps} ${layout.steps === 1 ? 'passo' : 'passos'}`;

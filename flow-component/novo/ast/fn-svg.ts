/**
 * Lib: AST de funções → SVG do plano Flow.
 * Entrada: Fn (árvore com kids; lote 1 = só `t:"fn"`, sem if/for/try).
 * Saída: string SVG (plano s0…sN + barras).
 *
 * Refs: layout.ts · view.ts (renderPlan) · flow-language/editor (fsvg).
 */
import { layout, type Row, type Scene } from "../layout";
import type { Fn, Node } from "../model";

export const G = { RH: 34, HEAD: 52, OX: 120, W: 160, INS: 40, BH: 22, IND: 14, GAP: 16, WS: 100 } as const;

export interface FnSvgOpts {
  /** Nome dentro da barra (padrão true). */
  txtIn?: boolean;
  /** Id selecionado (classe sel). */
  sel?: string | null;
  /** Ids com filhos fechados. */
  closed?: ReadonlySet<string>;
  /** Largura mínima da coluna. */
  minW?: number;
}

export interface FnSvgResult {
  svg: string;
  scene: Scene;
  width: number;
  height: number;
}

const esc = (s: unknown): string => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const tw = (t: string, px = 6.1): number => Math.ceil(t.length * px);
const rowY = (i: number): number => G.HEAD + i * G.RH;
const planGutter = (sc: Pick<Scene, "maxDepth">): number => (sc.maxDepth + 1) * G.IND;

/** Só funções: descarta blocos da cena (lote 1). */
function fnRows(sc: Scene): Row[] {
  return sc.rows.filter(r => r.kind === "fn");
}

/** Folga do texto na barra (igual view.ts). */
const PAD = 12;

function colW(sc: Scene, opts: FnSvgOpts): number {
  const leaves = fnRows(sc).filter(r => r.leaf);
  const txt = opts.txtIn !== false;
  const fromTitle = txt && leaves.length
    ? Math.max(...leaves.map(l => tw((l.node as Fn).title, 6.2) + 2 * PAD + 2 * G.INS))
    : G.WS;
  return Math.max(opts.minW ?? 0, txt ? Math.max(G.W, fromTitle) : G.WS);
}

function assertFnsOnly(n: Node): void {
  if (n.t !== "fn") throw new Error(`fn-svg: esperado t:"fn", recebeu t:"${(n as { t: string }).t}"`);
  for (const k of n.kids) assertFnsOnly(k);
}

/**
 * Converte AST de função (raiz + kids só `fn`) em SVG do plano.
 */
export function renderFnSvg(flow: Fn, opts: FnSvgOpts = {}): FnSvgResult {
  assertFnsOnly(flow);
  const scene = layout(flow, { closed: opts.closed });
  const rows = fnRows(scene);
  const cw = colW(scene, opts);
  const gutter = planGutter(scene);
  const colX = (s: number): number => gutter + G.OX + s * cw;
  const W = colX(scene.nSteps) + 160;
  const H = rowY(rows.length) + 80;
  const ym = (i: number): number => rowY(i) + G.RH / 2;
  const txtIn = opts.txtIn !== false;
  const sel = opts.sel ?? null;

  const out: string[] = [];
  const bands: string[] = [];
  const over: string[] = [];

  const CHIP = 8;
  const top = G.HEAD - 18;
  const bot = rowY(rows.length) + 32;
  const chip = (s: number, y: number): string =>
    `<g class="chip"><rect x="${colX(s) - 12}" y="${y - CHIP}" width="24" height="16" rx="3"/><text x="${colX(s)}" y="${y + 3.5}" text-anchor="middle">s${s}</text></g>`;

  for (let s = 0; s <= scene.nSteps; s++) {
    out.push(`<line class="vg" x1="${colX(s)}" y1="${top + CHIP}" x2="${colX(s)}" y2="${bot - CHIP}"/>`);
    out.push(chip(s, top), chip(s, bot));
  }
  rows.forEach((_, i) => out.push(`<line class="hg" x1="${gutter}" y1="${rowY(i + 1)}" x2="${W}" y2="${rowY(i + 1)}"/>`));
  out.push(`<line class="axis" x1="${colX(0)}" y1="${rowY(rows.length) + 4}" x2="${colX(scene.nSteps)}" y2="${rowY(rows.length) + 4}"/>`);

  const rail = (depth: number, y0: number, h: number): void => {
    if (depth < 0 || h <= 0) return;
    bands.push(`<line class="bande co" x1="${depth * G.IND + 0.5}" y1="${y0}" x2="${depth * G.IND + 0.5}" y2="${y0 + h}"/>`);
  };

  // índice na lista filtrada = posição visual
  const byId = new Map(rows.map((r, i) => [r.id, i]));

  rows.forEach((r, i) => {
    if (r.leaf) rail(r.depth, rowY(i), G.RH);
    else if (r.last > 0) {
      // last é índice na Scene completa; aproximar span visual pelos filhos fn
      const childIs = rows.map((x, j) => (x.id !== r.id && scene.span.get(x.id) && x.depth > r.depth ? j : -1)).filter(j => j > i);
      const lastVis = childIs.length ? Math.max(...childIs) : i;
      if (lastVis > i) rail(r.depth, rowY(i + 1), (lastVis - i) * G.RH);
    }
  });

  /**
   * Sólida (conc) = preenchida. Toda função de 1ª ordem (depth 0) é sólida — mora no arquivo.
   * Filha: composição ou com agent = sólida; sem agent = vazia (nag) / abstrata.
   */
  const kindOf = (f: Fn, depth: number): "conc" | "abs" | "nag" => {
    if (depth === 0) return "conc";
    if (f.kids.length) return "conc";
    if (!f.agent) return "nag";
    return "conc";
  };

  const ioMarks = (f: Fn, r: Row, i: number, x1: number, x2: number): void => {
    const mark = (x: number, list: readonly string[], side: "in" | "out"): string => {
      if (!list.length) return "";
      const cube = list.length !== 1;
      const tip = list.join(", ");
      return cube
        ? `<g class="dm" data-id="${esc(f.id)}" data-side="${side}"><path class="cube" transform="translate(${x - 5} ${ym(i) - 5.5})" d="M5 .5 L9.5 3 L9.5 8 L5 10.5 L.5 8 L.5 3 Z M.5 3 L5 5.5 L9.5 3 M5 5.5 V10.5"/><title>${esc(tip)}</title></g>`
        : `<g class="dm" data-id="${esc(f.id)}" data-side="${side}"><rect class="dot" x="${x - 4}" y="${ym(i) - 4}" width="8" height="8"/><title>${esc(tip)}</title></g>`;
    };
    if (f.ins.length) {
      over.push(`<line class="dlk" x1="${colX(r.s) + 4}" y1="${ym(i)}" x2="${x1}" y2="${ym(i)}"/>`);
      over.push(mark(colX(r.s), f.ins, "in"));
      over.push(`<text class="dn in" x="${colX(r.s) - G.GAP}" y="${ym(i) + 3.5}" text-anchor="end">${esc(f.ins.length > 1 ? f.ins.join(",") : f.ins[0]!)}</text>`);
    }
    if (f.outs.length) {
      over.push(`<line class="dlk" x1="${x2}" y1="${ym(i)}" x2="${colX(r.e + 1) - 4}" y2="${ym(i)}"/>`);
      over.push(mark(colX(r.e + 1), f.outs, "out"));
      over.push(`<text class="dn out" x="${colX(r.e + 1) + G.GAP}" y="${ym(i) + 3.5}" text-anchor="start">${esc(f.outs.length > 1 ? f.outs.join(",") : f.outs[0]!)}</text>`);
    }
  };

  rows.forEach((r, i) => {
    const f = r.node as Fn;
    const selC = sel === f.id ? " sel" : "";
    if (!r.leaf) {
      const inset = 21;
      const x1 = colX(r.s) + inset;
      const x2 = colX(r.e + 1) - inset;
      over.push(`<g data-id="${esc(f.id)}"><path class="sum${selC}" d="M${x1} ${ym(i) - 3.5}H${x2}V${ym(i) + 7.5}L${x2 - 5} ${ym(i) + 3.5}H${x1 + 5}L${x1} ${ym(i) + 7.5}Z"/><title>${esc(f.title)} · composition</title></g>`);
      ioMarks(f, r, i, x1, x2);
      if (i === 0) over.push(`<text class="lbl" x="${(x1 + x2) / 2}" y="${ym(i) - 22}" text-anchor="middle">${esc(f.title)}</text>`);
      else over.push(`<text class="lbl" x="${colX(r.e + 1) + 10}" y="${ym(i) + 3.5}">${esc(f.title)}</text>`);
      return;
    }
    const k = kindOf(f, r.depth);
    const hasText = txtIn && f.title.trim() !== "";
    const cx = (colX(r.s) + colX(r.e + 1)) / 2;
    const x1 = hasText ? colX(r.s) + G.INS : cx - G.BH / 2;
    const x2 = hasText ? colX(r.e + 1) - G.INS : cx + G.BH / 2;
    over.push(`<g data-id="${esc(f.id)}"><rect class="fn ${k}${selC}" x="${x1}" y="${ym(i) - G.BH / 2}" width="${x2 - x1}" height="${G.BH}" rx="${G.BH / 2}"/>${hasText ? `<text class="fbt ${k}" x="${(x1 + x2) / 2}" y="${ym(i) + 3.5}" text-anchor="middle">${esc(f.title)}</text>` : ""}<title>${esc(f.title)}</title></g>`);
    ioMarks(f, r, i, x1, x2);
    if (!hasText) over.push(`<text class="lbl" x="${colX(r.e + 1) + 10}" y="${ym(i) + 3.5}">${esc(f.title)}</text>`);
    if (f.par) over.push(`<text class="par" x="${x2 + 6}" y="${ym(i) + 3.5}">∥</text>`);
    void byId;
  });

  const style = `<style>
.vg,.hg,.axis{stroke:#e7e3db;stroke-width:1}
.chip rect{fill:#f4f1ea;stroke:#e7e3db}
.chip text{font:600 9px ui-monospace,Menlo,monospace;fill:#14120f}
.bande.co{stroke:#2563eb;stroke-width:2}
.fn{fill:#2563eb}.fn.abs{fill:#dbeafe;stroke:#2563eb;stroke-width:1.5}.fn.nag{fill:transparent;stroke:#2563eb;stroke-width:1.5}
.fn.sel,.sum.sel{stroke:#14120f;stroke-width:2.5}
.fbt{font:600 10px ui-monospace,Menlo,monospace;fill:#fff}.fbt.abs,.fbt.nag{fill:#2563eb}
.sum{fill:#2563eb}
.lbl,.dn{font:500 10px ui-monospace,Menlo,monospace;fill:#14120f}
.dlk{stroke:#9a9a9a;stroke-width:1}
.dot{fill:#dc2626;stroke:#dc2626}.cube{fill:#dc2626;stroke:#14120f;stroke-width:.6}
.par{font:600 11px ui-monospace,Menlo,monospace;fill:#44423d}
</style>`;

  const svg = `<svg class="plan fn-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Plano ${esc(flow.title)}">${style}<g class="bands">${bands.join("")}</g>${out.join("")}${over.join("")}</svg>`;
  return { svg, scene, width: W, height: H };
}

/** Atalho: só a string SVG. */
export const fnAstToSvg = (flow: Fn, opts?: FnSvgOpts): string => renderFnSvg(flow, opts).svg;

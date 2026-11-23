/**
 * Lib: AST de funções → SVG do plano Flow.
 * Entrada: Fn (árvore com kids: funções e blocos if/else, for, try/catch).
 * Saída: string SVG (plano s0…sN + barras).
 *
 * Refs: layout.ts · view.ts (renderPlan) · flow-language/editor (fsvg).
 */
import { layout, type Row, type Scene } from "../layout";
import { flowFile, type Fn, type Node } from "../model";
import { statesByStep, stateRows, stateLabel, dataText, objectPairs, STATE_ROW, type StateItem } from "../view";

export const G = { RH: 34, HEAD: 52, OX: 120, W: 160, INS: 40, BH: 22, IND: 14, GAP: 16, WS: 100 } as const;

export interface FnSvgOpts {
  /** Nome dentro da barra (padrão true). */
  txtIn?: boolean;
  /** Id selecionado (classe sel). */
  sel?: string | null;
  /** Ids com filhos fechados. */
  closed?: ReadonlySet<string>;
  /** else no mesmo passo do if (ramos paralelos). */
  elseParallel?: boolean;
  /** Funções existentes como círculos nos estados (padrão true). */
  fnStates?: boolean;
  /** Não desenha a função raiz (main): só as funções dentro dela (padrão false). */
  hideRoot?: boolean;
  /** Idioma dos textos do desenho (padrão pt). */
  lang?: "pt" | "en";
  /** Escreve o responsável (máquina, pessoa, IA…) acima da barra (padrão false). */
  agentLabels?: boolean;
  /** Tabela à esquerda, como no Flow IDE: coluna Source (responsável) e coluna Função (padrão false). */
  table?: boolean;
  /** Mostra o sinal ∥ ao lado de função paralela (padrão false: o paralelismo já é mostrado pelo passo). */
  parMark?: boolean;
  /** Linhas da grade (verticais entre passos, horizontais entre linhas e eixo) (padrão true). */
  grid?: boolean;
  /** Barras coloridas de profundidade na borda esquerda (padrão false). */
  rails?: boolean;
  /** Chips s0…sN no topo e embaixo (padrão true). */
  chips?: boolean;
  /** Estados embaixo dos passos (padrão true). */
  states?: boolean;
  /** Cada estado repete os dados já disponíveis (padrão true); false = só os que chegam no passo. */
  allData?: boolean;
  /** Círculo (ícone de função) dentro da barra; padrão false. */
  fnIcon?: boolean;
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

/** Linhas visíveis: funções + blocos (if/else, for, try/catch). */
function fnRows(sc: Scene): Row[] {
  return sc.rows;
}

/** Folga do texto na barra (igual view.ts). */
const PAD = 12;

function colW(sc: Scene, opts: FnSvgOpts): number {
  const leaves = fnRows(sc).filter(r => r.leaf && r.kind === "fn");
  const txt = opts.txtIn !== false;
  const fromTitle = txt && leaves.length
    ? Math.max(...leaves.map(l => tw((l.node as Fn).title, 6.2) + 2 * PAD + 2 * G.INS))
    : G.WS;
  return Math.max(opts.minW ?? 0, txt ? Math.max(G.W, fromTitle) : G.WS);
}

const KINDS = new Set(["fn", "if", "for", "try", "switch"]);
function assertKnown(n: Node): void {
  if (!KINDS.has(n.t)) throw new Error(`fn-svg: nó desconhecido t:"${(n as { t: string }).t}"`);
  for (const k of n.kids) assertKnown(k);
  if (n.t === "if") for (const k of n.elseKids) assertKnown(k);
  if (n.t === "try") for (const k of n.catchKids) assertKnown(k);
}

const blockCls = (n: Exclude<Node, Fn>): string =>
  n.t === "if" ? "if" : n.t === "for" ? "lp" : n.t === "switch" ? "sw" : "tr";

const blockText = (n: Exclude<Node, Fn>): string => {
  if (n.t === "if") return `if (${n.test})`;
  if (n.t === "switch") return `switch (${n.expr})`;
  if (n.t === "for") {
    if (n.loop === "while") return `while (${n.coll})`;
    if (n.loop === "do-while") return `do-while (${n.coll})`;
    return `for (${n.v} of ${n.coll})`;
  }
  return `try · catch ↓ ${n.catchKids[0]?.t === "fn" ? n.catchKids[0].title : "handler"}`;
};

/**
 * Converte AST de função (raiz + kids só `fn`) em SVG do plano.
 */
export function renderFnSvg(flow: Fn, opts: FnSvgOpts = {}): FnSvgResult {
  assertKnown(flow);
  const L = opts.lang === "en"
    ? { machine: "machine", ai: "AI", person: "person", abstract: "abstract", source: "SOURCE", func: "FUNCTION", catchTxt: "catch · if the try fails", elseTxt: "else · otherwise", sol: "solid", abs: "abstract", eternal: "function (eternal)" }
    : { machine: "máquina", ai: "IA", person: "pessoa", abstract: "abstrato", source: "SOURCE", func: "FUNÇÃO", catchTxt: "catch · se o try falhar", elseTxt: "else · senão", sol: "sólida", abs: "abstrata", eternal: "função (eterna)" };
  const scene = layout(flow, { ...(opts.closed ? { closed: opts.closed } : {}), ...(opts.elseParallel ? { elseParallel: true } : {}) });
  // hideRoot: a função raiz (main) não é desenhada nem entra nos estados; só as funções dentro dela
  const hide = opts.hideRoot === true && flow.kids.length > 0;
  const off = hide ? 1 : 0;
  const rows = fnRows(scene).slice(off);
  const cw = colW(scene, opts);
  const gutter = planGutter(scene);
  // tabela Source | Função: a largura segue o conteúdo (só cresce se precisar)
  const rootFile = flowFile(flow).replace(/\.[^.]+$/, "");
  const SRC: Record<string, { name: string; cls: string }> = {
    maquina: { name: L.machine, cls: "maq" }, ia: { name: L.ai, cls: "ia" }, pessoa: { name: L.person, cls: "pes" },
  };
  const source = (f: Fn, depth: number, leaf: boolean): { name: string; cls: string } => {
    if (depth === 0 || !leaf) return { name: rootFile, cls: "arq" };
    if (!f.agent) return { name: L.abstract, cls: "abs" };
    if (f.agent === "arquivo") return { name: rootFile, cls: "arq" };
    if (f.agent.startsWith("obj:")) return { name: f.agent.slice(4), cls: "obj" };
    return SRC[f.agent] ?? { name: f.agent, cls: "maq" };
  };
  const labelOf = (r: Row): string => r.kind !== "fn" ? (r.kind === "catch" ? "catch" : r.kind === "else" ? "else" : blockText(r.node as Exclude<Node, Fn>)) : (r.node as Fn).title;
  const srcW = opts.table ? Math.max(40, ...rows.filter(r => r.kind === "fn").map(r => tw(source(r.node as Fn, r.depth, r.leaf).name, 6.1) + 34)) : 0;
  const funcX = opts.table ? srcW + 6 : 0;
  const funcW = opts.table ? Math.max(40, ...rows.map(r => r.depth * 12 + tw(labelOf(r), 6.1))) : 0;
  const TW = opts.table ? Math.ceil(funcX + funcW + 16) : 0;
  const colX = (s: number): number => TW + gutter + G.OX + s * cw;
  const W = colX(scene.nSteps) + 160;
  // estados novos por passo; depois acumulam (os antigos ficam esmaecidos), como no editor
  const base = opts.states !== false ? statesByStep(scene, false) : new Map<number, StateItem[]>();
  // valor literal de array (`[1, 2]`) vira caixa posicional também quando vem de uma entrada
  for (const list of base.values()) list.forEach((it, n) => {
    const v = it.value?.trim();
    if (!it.cube && v && v.startsWith("[") && v.endsWith("]") && it.owner) list[n] = { ...localItem(it.name, v, it.owner), side: it.side ?? "in", ...(it.old ? { old: true } : {}) };
  });
  // variável local: arg de uma função que não é entrada (ex.: `const ola = "Olá, "` dentro de saudar) existe antes das entradas iniciadas
  if (opts.states !== false) for (const r of rows) {
    if (r.kind !== "fn") continue;
    const f = r.node as Fn;
    const list = base.get(r.s) ?? [];
    // todas as locais da função entram juntas, na ordem em que foram declaradas
    const locals = Object.entries(f.args ?? {})
      .filter(([k, v]) => !f.ins.includes(k) && !f.outs.includes(k) && v.trim() && !list.some(x => x.name === k))
      .map(([k, v]) => localItem(k, v.trim(), f.id));
    if (!locals.length) continue;
    const at = list.findIndex(x => x.side === "in");   // depois do que chega por saída, antes das entradas iniciadas
    list.splice(at < 0 ? list.length : at, 0, ...locals);
    base.set(r.s, list);
  }
  // valor de uma saída: arg com o nome da saída (ex.: saudacao = "Olá, Ana")
  for (const r of rows) {
    if (r.kind !== "fn") continue;
    const f = r.node as Fn;
    for (const o of f.outs) {
      const v = f.args?.[o]?.trim();
      const list = base.get(r.e + 1), at = v && list ? list.findIndex(x => x.name === o) : -1;
      if (!v || !list || at < 0) continue;
      // saída com valor objeto `{}` ou array `[]` vira caixa (cubo) com os campos
      if (/^[{[]/.test(v)) list[at] = { ...localItem(o, v, f.id), side: "out" };
      else list[at]!.value = v;
    }
  }
  const states = new Map<number, StateItem[]>();
  if (opts.allData === false) base.forEach((v, k) => states.set(k, v));
  else {
    let acc: StateItem[] = [];
    for (let c = 0; c <= scene.nSteps; c++) {
      const fresh = base.get(c) ?? [], names = new Set(fresh.map(x => x.name));
      acc = [...acc.filter(x => !names.has(x.name)).map(x => ({ ...x, old: true })), ...fresh];
      if (acc.length) states.set(c, acc);
    }
  }
  /**
   * Sólida (conc) = preenchida. Toda função de 1ª ordem (depth 0) é sólida — mora no arquivo.
   * Filha: composição ou com agent = sólida; sem agent = vazia (nag) / abstrata.
   */
  const kindOf = (f: Fn, depth: number): "conc" | "abs" | "nag" => {
    if (depth === 0) return "conc";
    if (f.kids.length) return "conc";
    if (!f.agent) return "nag";
    return f.agent === "ia" || f.agent === "pessoa" ? "abs" : "conc";
  };

  // funções existentes (eternas): círculos no estado, em todos os passos
  const fnKinds = new Map<string, "conc" | "abs" | "nag">();
  if (opts.states !== false && opts.fnStates !== false) {
    for (const r of rows) if (r.kind === "fn") {
      const f = r.node as Fn, k = kindOf(f, r.depth);
      if (!fnKinds.has(f.title) || k === "conc") fnKinds.set(f.title, k);
    }
  }
  const fnNames = [...fnKinds.keys()];
  const stateCols: number[] = fnNames.length ? Array.from({ length: scene.nSteps + 1 }, (_, c) => c) : [...states.keys()];
  const maxSt = Math.max(0, ...stateCols.map(c => fnNames.length + stateRows(states.get(c) ?? [])));
  const H = maxSt > 0 ? rowY(rows.length) + 66 + maxSt * STATE_ROW + 28 : rowY(rows.length) + 80;
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
    if (opts.grid !== false) out.push(`<line class="vg" x1="${colX(s)}" y1="${top + CHIP}" x2="${colX(s)}" y2="${bot - CHIP}"/>`);
    if (opts.chips !== false) out.push(chip(s, top), chip(s, bot));
  }
  if (opts.grid !== false) rows.forEach((_, i) => out.push(`<line class="hg" x1="${opts.table ? 0 : gutter}" y1="${rowY(i + 1)}" x2="${W}" y2="${rowY(i + 1)}"/>`));
  // a última linha horizontal da grade já fecha o plano: sem eixo extra (ficava uma segunda listra 4px abaixo)

  // tabela Source | Função (responsável de cada função), alinhada às linhas do plano
  if (opts.table) {
    out.push(`<text class="th" x="12" y="${top + 3}">${L.source}</text><text class="th" x="${funcX}" y="${top + 3}">${L.func}</text>`);
    rows.forEach((r, i) => {
      const y = ym(i);
      if (r.kind !== "fn") {
        const n = r.node as Exclude<Node, Fn>;
        const txt = r.kind === "catch" ? "catch" : r.kind === "else" ? "else" : blockText(n);
        out.push(`<text class="tb mut" x="${funcX + r.depth * 12}" y="${y + 3.5}">${esc(txt)}</text>`);
        return;
      }
      const f = r.node as Fn, src = source(f, r.depth, r.leaf);
      out.push(`<circle class="so ${src.cls}" cx="18" cy="${y}" r="4.5"/><text class="tb" x="30" y="${y + 3.5}">${esc(src.name)}</text>`);
      out.push(`<text class="tb" x="${funcX + r.depth * 12}" y="${y + 3.5}">${esc(f.title)}</text>`);
    });
    out.push(`<line class="vg" x1="${funcX - 4}" y1="${top + CHIP}" x2="${funcX - 4}" y2="${rowY(rows.length)}"/>`);
  }

  // estados embaixo de cada coluna: quadrado (ou cubo) + nome do dado disponível ali
  for (const col of stateCols) {
    const items = states.get(col) ?? [];
    let row = 0;
    for (const nm of fnNames) {
      const y = bot + 34 + row++ * STATE_ROW;
      out.push(`<g class="stt fnst${col > stateCols[0]! ? " old" : ""}"><circle class="sfn${fnKinds.get(nm) === "conc" ? "" : " a"}" cx="${colX(col)}" cy="${y}" r="4.5"/><text class="dn st" x="${colX(col) + 9}" y="${y + 3.2}">${esc(dataText([nm], 26))}</text><title>${esc(nm)} · ${L.eternal} · ${fnKinds.get(nm) === "conc" ? L.sol : L.abs}</title></g>`);
    }
    for (const it of items) {
      const y = bot + 34 + row++ * STATE_ROW;
      // função usada como dado (valor começa com `function`): continua sendo função, então é círculo
      const isFn = !it.cube && /^function\b/.test(it.value ?? "");
      out.push(`<g class="stt${it.old ? " old" : ""}">${isFn
        ? `<circle class="sfn" cx="${colX(col)}" cy="${y}" r="4.5"/>`
        : it.cube
        ? `<path class="scube" transform="translate(${colX(col) - 4.5} ${y - 5.5})" d="M5 .5 L9.5 3 L9.5 8 L5 10.5 L.5 8 L.5 3 Z M.5 3 L5 5.5 L9.5 3 M5 5.5 V10.5"/>`
        : `<rect class="sdot${it.abs ? " a" : ""}" x="${colX(col) - 4}" y="${y - 4}" width="8" height="8"/>`}<text class="dn st" x="${colX(col) + 9}" y="${y + 3.2}">${esc(it.cube || isFn ? dataText([it.name], 26) : stateLabel(it.name, it.value, 26))}</text><title>${esc(it.value ?? it.fields.join(", "))}</title></g>`);
      if (it.cube) for (const fld of it.fields) {
        const fy = bot + 34 + row++ * STATE_ROW, fv = it.fieldValues?.[fld];
        out.push(`<g class="stt sub${it.old ? " old" : ""}"><rect class="sdot sm" x="${colX(col) + 8}" y="${fy - 2.5}" width="5" height="5"/><text class="dn st" x="${colX(col) + 18}" y="${fy + 3.2}">${esc(stateLabel(fld, fv, 24))}</text><title>${esc(fv != null ? `${fld} = ${fv}` : fld)}</title></g>`);
      }
    }
  }

  const rail = (depth: number, y0: number, h: number, cls = "co"): void => {
    if (opts.rails !== true || depth < 0 || h <= 0) return;
    bands.push(`<line class="bande ${cls}" x1="${depth * G.IND + 0.5}" y1="${y0}" x2="${depth * G.IND + 0.5}" y2="${y0 + h}"/>`);
  };

  // índice na lista filtrada = posição visual
  const byId = new Map(rows.map((r, i) => [r.id, i]));

  rows.forEach((r, i) => {
    const cls = r.kind === "catch" ? "ca" : r.kind === "else" ? "el" : r.kind === "block" ? blockCls(r.node as Exclude<Node, Fn>) : "co";
    if (r.leaf) rail(r.depth, rowY(i), G.RH, cls);
    else if (r.last - off > i) rail(r.depth, rowY(i + 1), (r.last - off - i) * G.RH, cls);
  });

  const ioMarks = (f: Fn, r: Row, i: number, x1: number, x2: number): void => {
    const mark = (x: number, list: readonly string[], side: "in" | "out"): string => {
      if (!list.length) return "";
      const cube = list.length !== 1 || /^\s*\{/.test(f.args?.[list[0]!] ?? "");
      const tip = list.join(", ");
      // função passada como dado continua sendo função: ícone redondo
      if (!cube && /^function\b/.test(f.args?.[list[0]!] ?? "")) return `<g class="dm" data-id="${esc(f.id)}" data-side="${side}"><circle class="dotf" cx="${x}" cy="${ym(i)}" r="4.5"/><title>${esc(tip)}</title></g>`;
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
    if (r.kind !== "fn") {
      const n = r.node as Exclude<Node, Fn>;
      const cls = r.kind === "catch" ? "ca" : r.kind === "else" ? "el" : blockCls(n);
      const txt = r.kind === "catch" ? L.catchTxt : r.kind === "else" ? L.elseTxt : blockText(n);
      const cx = colX(r.s), cy = ym(i), px = cx + 11;
      const w = Math.max(tw(txt) + 12, colX(r.e + 1) - px - 6);
      if (cls === "if") over.push(`<path class="fif" d="M${cx} ${cy - 7} L${cx + 6.5} ${cy + 5} H${cx - 6.5} Z"/>`);
      if (cls === "el") over.push(`<path class="fel" d="M${cx} ${cy + 7} L${cx + 6.5} ${cy - 5} H${cx - 6.5} Z"/>`);
      if (cls === "lp") over.push(`<text class="flp" x="${cx}" y="${cy + 3.5}" text-anchor="middle">↻</text>`);
      if (cls === "sw") over.push(`<rect class="fsw" x="${cx - 5}" y="${cy - 5}" width="10" height="10" rx="1.5"/>`);
      if (cls === "tr") over.push(`<path class="ftr" d="M${cx} ${cy - 7}c1.8 0 3.5.9 4.6 2.1v4.2c0 2.8-2 4.4-4.6 5.4-2.6-1-4.6-2.6-4.6-5.4V${cy - 4.9}C${cx - 3.5} ${cy - 6.1} ${cx - 1.8} ${cy - 7} ${cx} ${cy - 7}z"/>`);
      if (cls === "ca") over.push(`<path class="fca" d="M${cx - 5} ${cy - 5} L${cx + 5} ${cy + 5} M${cx + 5} ${cy - 5} L${cx - 5} ${cy + 5}"/>`);
      // else lado a lado com o if (mesmo passo): a etiqueta ocupa toda a largura do if
      const brow = r.kind === "else" ? rows.find(x => x.kind === "block" && x.node === r.node && x.s === r.s) : undefined;
      let px2 = px, wPill = w;
      if (brow) {
        const ifLeft = colX(brow.s) + 11;
        const ifRight = ifLeft + Math.max(tw(blockText(brow.node as Exclude<Node, Fn>)) + 12, colX(brow.e + 1) - ifLeft - 6);
        px2 = ifLeft; wPill = Math.max(w, ifRight - ifLeft);
      }
      over.push(`<g class="pill ${cls}"><rect x="${px2}" y="${cy - 8}" width="${wPill}" height="16"/><text x="${px2 + 6}" y="${cy + 3.5}">${esc(txt)}</text><title>${esc(txt)}</title></g>`);
      return;
    }
    const f = r.node as Fn;
    const selC = sel === f.id ? " sel" : "";
    if (!r.leaf) {
      const inset = 21;
      const x1 = colX(r.s) + inset;
      const x2 = colX(r.e + 1) - inset;
      over.push(`<g data-id="${esc(f.id)}"><path class="sum${selC}" d="M${x1} ${ym(i) - 3.5}H${x2}V${ym(i) + 7.5}L${x2 - 5} ${ym(i) + 3.5}H${x1 + 5}L${x1} ${ym(i) + 7.5}Z"/><title>${esc(f.title)} · composition</title></g>`);
      ioMarks(f, r, i, x1, x2);
      // funções pai (composição): nome em cima, no mesmo padrão da 1ª ordem
      over.push(`<text class="lbl" x="${(x1 + x2) / 2}" y="${ym(i) - 10}" text-anchor="middle">${esc(f.title)}</text>`);
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
    if (hasText && opts.fnIcon) over.push(`<circle class="fic" cx="${x1 + 11}" cy="${ym(i)}" r="4"/>`);
    if (opts.agentLabels === true && f.agent && f.agent !== "arquivo") over.push(`<text class="ag" x="${x1}" y="${ym(i) - G.BH / 2 - 3}" >${esc(f.agent)}</text>`);
    if (opts.parMark === true && f.par) over.push(`<text class="par" x="${x2 + 6}" y="${ym(i) + 3.5}">∥</text>`);
    void byId;
  });

  const style = `<style>
.vg,.hg,.axis{stroke:var(--line,#e7e3db);stroke-width:1}
.chip rect{fill:var(--paper-2,#f4f1ea);stroke:var(--line,#e7e3db)}
.chip text{font:600 9px ui-monospace,Menlo,monospace;fill:var(--ink,#14120f)}
.bande.co{stroke:var(--fn,#dc2626);stroke-width:2}
.fn{fill:var(--fn,#dc2626)}.fn.abs,.fn.nag{fill:transparent;stroke:var(--fn,#dc2626);stroke-width:1.5}
.fn.sel,.sum.sel{stroke:var(--ink,#14120f);stroke-width:2.5}
.fbt{font:600 10px ui-monospace,Menlo,monospace;fill:#fff}.fbt.abs,.fbt.nag{fill:#fff}
.sum{fill:var(--fn,#dc2626)}
.lbl,.dn{font:500 10px ui-monospace,Menlo,monospace;fill:var(--ink,#14120f)}
.dlk{stroke:#9a9a9a;stroke-width:1}
.dm,.fif,.fel,.fsw,.ftr,.fca,.flp{filter:drop-shadow(1.25px 0 0 #000) drop-shadow(-1.25px 0 0 #000) drop-shadow(0 1.25px 0 #000) drop-shadow(0 -1.25px 0 #000) drop-shadow(1px 1px 0 #000) drop-shadow(-1px -1px 0 #000) drop-shadow(1px -1px 0 #000) drop-shadow(-1px 1px 0 #000)}
.dot{fill:var(--dado,#2563eb);stroke:var(--dado,#2563eb)}.cube{fill:var(--dado,#2563eb);stroke:var(--ink,#14120f);stroke-width:.6}
.bande.if,.bande.el,.bande.sw{stroke:#d97706;stroke-width:2}.bande.lp{stroke:#7c3aed;stroke-width:2}.bande.tr{stroke:#16a34a;stroke-width:2}.bande.ca{stroke:#dc2626;stroke-width:2}
.fif,.fel{fill:var(--paper,#fff);stroke:#d97706;stroke-width:1.5}.fsw{fill:var(--paper,#fff);stroke:#d97706;stroke-width:1.5}.fca{fill:none;stroke:#dc2626;stroke-width:1.6;stroke-linecap:round}.flp{fill:#7c3aed;font:700 11px ui-monospace,Menlo,monospace}.ftr{fill:var(--paper,#fff);stroke:#16a34a;stroke-width:1.4}
.pill text{font:600 9px ui-monospace,Menlo,monospace}
.pill.if rect{fill:color-mix(in srgb,#d97706 20%,var(--paper,#fff))}.pill.if text{fill:#d97706}.pill.el rect{fill:color-mix(in srgb,#d97706 12%,var(--paper,#fff))}.pill.el text{fill:#d97706}
.pill.sw rect{fill:color-mix(in srgb,#d97706 20%,var(--paper,#fff))}.pill.sw text{fill:#d97706}
.pill.lp rect{fill:color-mix(in srgb,#8b5cf6 20%,var(--paper,#fff))}.pill.lp text{fill:#8b5cf6}.pill.tr rect{fill:color-mix(in srgb,#22c55e 20%,var(--paper,#fff))}.pill.tr text{fill:#22c55e}.pill.ca rect{fill:color-mix(in srgb,#ef4444 20%,var(--paper,#fff))}.pill.ca text{fill:#ef4444}
.ag{font:600 8px ui-monospace,Menlo,monospace;fill:#9a9a9a;text-transform:uppercase;letter-spacing:.04em}
.dotf{fill:var(--fn,#dc2626);stroke:var(--fn,#dc2626);stroke-width:1.5}
.sfn,.sdot,.scube{filter:drop-shadow(1.25px 0 0 #000) drop-shadow(-1.25px 0 0 #000) drop-shadow(0 1.25px 0 #000) drop-shadow(0 -1.25px 0 #000) drop-shadow(1px 1px 0 #000) drop-shadow(-1px -1px 0 #000) drop-shadow(1px -1px 0 #000) drop-shadow(-1px 1px 0 #000)}
.sfn{fill:var(--fn,#dc2626);stroke:var(--fn,#dc2626);stroke-width:1.5}.sfn.a{fill:var(--paper,#fff)}
.sdot{fill:var(--dado,#2563eb);stroke:var(--dado,#2563eb);stroke-width:1.3}.sdot.a{fill:var(--paper,#fff)}.scube{fill:var(--dado,#2563eb);stroke:var(--paper,#fff);stroke-width:.9;stroke-linejoin:round}.stt{opacity:1}.stt.old{opacity:.58}.dn.st{fill:var(--body,#44423d)}.stt:not(.old) .dn.st{fill:var(--ink,#14120f);font-weight:600}
.fic{fill:#fff;opacity:.9;pointer-events:none}
.th{font:700 8px ui-monospace,Menlo,monospace;letter-spacing:.08em;fill:var(--body,#44423d)}.tb{font:500 10px ui-monospace,Menlo,monospace;fill:var(--ink,#14120f)}.tb.mut{fill:var(--body,#44423d)}
.so{stroke-width:1.5}.so.arq{fill:var(--body,#44423d);stroke:var(--body,#44423d)}.so.maq{fill:#22c55e;stroke:#22c55e}.so.obj{fill:#f59e0b;stroke:#f59e0b}.so.ia{fill:var(--paper,#fff);stroke:#a855f7}.so.pes{fill:var(--paper,#fff);stroke:#3b82f6}.so.abs{fill:var(--paper,#fff);stroke:var(--body,#44423d);stroke-dasharray:2 2}
.par{font:600 11px ui-monospace,Menlo,monospace;fill:var(--body,#44423d)}
</style>`;

  const svg = `<svg class="plan fn-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Plano ${esc(flow.title)}">${style}<g class="bands">${bands.join("")}</g>${out.join("")}${over.join("")}</svg>`;
  return { svg, scene, width: W, height: H };
}

/** Variável local (arg que não é entrada nem saída): objeto `{}` e array `[]` viram caixa (cubo) com os campos. */
function localItem(name: string, value: string, owner: string): StateItem {
  const pairs = objectPairs(value);
  if (pairs) {
    const fieldValues = Object.fromEntries(pairs.filter(p => p.value != null).map(p => [p.name, p.value!]));
    return { name, cube: true, fields: pairs.map(p => p.name), value, fieldValues, owner, side: "in" };
  }
  if (value.startsWith("[") && value.endsWith("]")) {
    const parts: string[] = []; let depth = 0, cur = "";
    for (const ch of value.slice(1, -1)) {
      if ("{[(".includes(ch)) depth++; else if ("}])".includes(ch)) depth--;
      if (ch === "," && depth === 0) { parts.push(cur); cur = ""; } else cur += ch;
    }
    parts.push(cur);
    const vals = parts.map(x => x.trim()).filter(Boolean);
    return { name, cube: true, fields: vals.map((_, i) => `[${i}]`), value, fieldValues: Object.fromEntries(vals.map((v, i) => [`[${i}]`, v])), owner, side: "in" };
  }
  return { name, cube: false, fields: [name], value, owner, side: "in" };
}

/** Atalho: só a string SVG. */
export const fnAstToSvg = (flow: Fn, opts?: FnSvgOpts): string => renderFnSvg(flow, opts).svg;

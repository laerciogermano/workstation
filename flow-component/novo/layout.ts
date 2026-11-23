import { altKids, type Block, type Fn, type Node } from "./model";

/**
 * Cena do Flow: transforma a árvore em LINHAS (tabela) e PASSOS (colunas do plano) — pura, sem DOM.
 *  - cada função folha ocupa um passo; funções em paralelo dividem o mesmo passo;
 *  - blocos e funções compostas cobrem os passos dos filhos;
 *  - catch (try) e else (if) compartilham a mesma regra: sequência logo após o último elemento do bloco;
 *    filho folha no mesmo passo do cabeçalho; bloco aninhado no passo seguinte (no else paralelo, no mesmo passo);
 *    o que vem depois do bloco só começa quando o ramo alternativo termina. Não entram em `leaves`.
 */
export type RowKind = "fn" | "block" | "catch" | "else";
export interface Span { s: number; e: number }
export interface Row {
  kind: RowKind; id: string; node: Node; depth: number; s: number; e: number;
  /** Última linha coberta (blocos e compostas). */
  last: number;
  leaf: boolean; closed: boolean;
}
export interface Scene { rows: Row[]; nSteps: number; span: Map<string, Span>; maxDepth: number; leaves: Row[] }

export interface LayoutOpts { closed?: ReadonlySet<string>; /** else começa no mesmo passo do if (ramos lado a lado), em vez de depois dele. */ elseParallel?: boolean }

export function layout(flow: Fn, opts: LayoutOpts = {}): Scene {
  const closed = opts.closed ?? new Set<string>();
  const rows: Row[] = [], span = new Map<string, Span>(), leaves: Row[] = [];
  let maxDepth = 0;

  const place = (list: readonly Node[], depth: number, start: number, emit: boolean, inAlt: boolean): number => {
    let step = start, prev: Span | null = null;
    const push = (r: Omit<Row, "last">): Row => { const row: Row = { ...r, last: 0 }; if (emit) { rows.push(row); maxDepth = Math.max(maxDepth, r.depth); } return row; };
    /** catch e else: começam no passo `after`. Folha no mesmo passo; bloco aninhado no passo seguinte — salvo else paralelo. */
    const placeAlt = (b: Block, alt: readonly Node[], after: number, emitAlt: boolean, blockClosed: boolean, parallel = false): number => {
      const kind = b.t === "try" ? "catch" : "else", altKey = `${b.id}:${kind}`, altClosed = closed.has(altKey);
      const first = alt[0], childStart = first && first.t !== "fn" && !parallel ? after + 1 : after;
      if (blockClosed) return place(alt, depth + 1, childStart, false, true);
      const crow = push({ kind, id: b.id, node: b, depth, s: after, e: after, leaf: false, closed: altClosed });
      const cend = place(alt, depth + 1, childStart, emitAlt && !altClosed, true);
      if (emitAlt) { crow.s = after; crow.e = Math.max(after, cend - 1); span.set(altKey, { s: crow.s, e: crow.e }); crow.last = rows.length - 1; }
      return cend;
    };
    for (const n of list) {
      if (n.t === "fn") {
        const hasKids = n.kids.length > 0, isClosed = hasKids && closed.has(n.id);
        if (!hasKids) {
          const s = n.par && prev ? prev.s : step, sp: Span = { s, e: s };
          step = Math.max(step, s + 1); prev = sp; if (emit) span.set(n.id, sp);
          const row = push({ kind: "fn", id: n.id, node: n, depth, s, e: s, leaf: true, closed: false });
          if (emit) { row.last = rows.length - 1; if (!inAlt) leaves.push(row); }
        } else {
          const s0 = n.par && prev ? prev.s : step;   // uma composição também pode rodar junto da anterior
          const row = push({ kind: "fn", id: n.id, node: n, depth, s: s0, e: s0, leaf: false, closed: isClosed });
          const idx = rows.length - 1, next = place(n.kids, depth + 1, s0, emit && !isClosed, inAlt);
          const sp: Span = { s: s0, e: Math.max(s0, next - 1) }; prev = sp; if (emit) { span.set(n.id, sp); row.s = sp.s; row.e = sp.e; row.last = rows.length - 1; void idx; }
          step = Math.max(step, next);
        }
      } else {
        prev = null; const b: Block = n;
        const alt = altKids(b), canClose = b.kids.length > 0 || !!(alt && alt.length), isClosed = canClose && closed.has(b.id);
        const row = push({ kind: "block", id: b.id, node: b, depth, s: step, e: step, leaf: !canClose, closed: isClosed });
        // fechado: filhos (e catch/else) somem da tabela, mas o passo/span permanece
        const next = place(b.kids, depth + 1, step, emit && !isClosed, inAlt), sp: Span = { s: step, e: Math.max(step, next - 1) };
        if (emit) { span.set(b.id, sp); row.s = sp.s; row.e = sp.e; }
        let end = next;
        const elsePar = !!(opts.elseParallel && b.t === "if");
        if (alt && alt.length) end = Math.max(end, placeAlt(b, alt, elsePar ? step : next, emit, isClosed, elsePar));
        if (emit) row.last = rows.length - 1;
        step = Math.max(step, end);
      }
    }
    return step;
  };

  const rootRow: Row = { kind: "fn", id: flow.id, node: flow, depth: 0, s: 0, e: 0, last: 0, leaf: flow.kids.length === 0, closed: closed.has(flow.id) && flow.kids.length > 0 };
  rows.push(rootRow);
  let n = 1;
  if (flow.kids.length === 0) {
    span.set(flow.id, { s: 0, e: 0 });
    rootRow.last = rows.length - 1; leaves.push(rootRow);
  } else {
    n = Math.max(1, place(flow.kids, 1, 0, !rootRow.closed, false));
    span.set(flow.id, { s: 0, e: n - 1 }); rootRow.e = n - 1; rootRow.last = rows.length - 1;
  }
  return { rows, nSteps: n, span, maxDepth, leaves };
}

/** Pares (A → B) ligados por sequência: B começa no passo seguinte ao fim de A, na ordem do fluxo. */
export function links(scene: Scene): [Row, Row][] {
  const out: [Row, Row][] = [];
  scene.leaves.forEach((b, i) => { for (const a of scene.leaves.slice(0, i)) if (a.e === b.s - 1) out.push([a, b]); });
  return out;
}

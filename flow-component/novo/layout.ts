import { altKids, type Block, type Fn, type Node } from "./model";

/**
 * Cena do Flow: transforma a árvore em LINHAS (tabela) e PASSOS (colunas do plano) — pura, sem DOM.
 *  - cada função folha ocupa um passo; funções em paralelo dividem o mesmo passo;
 *  - blocos e funções compostas cobrem os passos dos filhos;
 *  - o catch fica em paralelo à última célula do try e o que vem depois só começa após os dois.
 */
export type RowKind = "fn" | "io" | "block" | "catch" | "else";
export interface Span { s: number; e: number }
export interface Row {
  kind: RowKind; id: string; node: Node; depth: number; s: number; e: number;
  /** Última linha coberta (blocos e compostas). */
  last: number;
  leaf: boolean; closed: boolean;
  /** Número do passo, entradas e saídas (linhas "io"). */
  ins?: string[]; outs?: string[];
}
export interface Scene { rows: Row[]; nSteps: number; span: Map<string, Span>; maxDepth: number; leaves: Row[] }

export interface LayoutOpts { closed?: ReadonlySet<string> }

export function layout(flow: Fn, opts: LayoutOpts = {}): Scene {
  const closed = opts.closed ?? new Set<string>();
  const rows: Row[] = [], span = new Map<string, Span>(), leaves: Row[] = [];
  let maxDepth = 0;

  const place = (list: readonly Node[], depth: number, start: number, emit: boolean, inCatch: boolean): number => {
    let step = start, prev: Span | null = null;
    const push = (r: Omit<Row, "last">): Row => { const row: Row = { ...r, last: 0 }; if (emit) { rows.push(row); maxDepth = Math.max(maxDepth, r.depth); } return row; };
    for (const n of list) {
      if (n.t === "fn") {
        const hasKids = n.kids.length > 0, isClosed = hasKids && closed.has(n.id);
        if (!hasKids) {
          const s = n.par && prev ? prev.s : step, sp: Span = { s, e: s };
          step = Math.max(step, s + 1); prev = sp; if (emit) span.set(n.id, sp);
          const row = push({ kind: "fn", id: n.id, node: n, depth, s, e: s, leaf: true, closed: false });
          if (emit) { row.last = rows.length - 1; if (!inCatch) leaves.push(row); }
          if (n.ins.length || n.outs.length) { const io = push({ kind: "io", id: n.id, node: n, depth, s, e: s, leaf: false, closed: false, ins: n.ins, outs: n.outs }); if (emit) { io.last = rows.length - 1; row.last = rows.length - 1; } }
        } else {
          const row = push({ kind: "fn", id: n.id, node: n, depth, s: step, e: step, leaf: false, closed: isClosed });
          const idx = rows.length - 1, next = place(n.kids, depth + 1, step, emit && !isClosed, inCatch);
          const sp: Span = { s: step, e: Math.max(step, next - 1) }; prev = null; if (emit) { span.set(n.id, sp); row.s = sp.s; row.e = sp.e; row.last = rows.length - 1; void idx; }
          step = Math.max(step, next);
        }
      } else {
        prev = null; const b: Block = n;
        const row = push({ kind: "block", id: b.id, node: b, depth, s: step, e: step, leaf: false, closed: false });
        const next = place(b.kids, depth + 1, step, emit, inCatch), sp: Span = { s: step, e: Math.max(step, next - 1) };
        if (emit) { span.set(b.id, sp); row.s = sp.s; row.e = sp.e; }
        let end = next;
        const alt = altKids(b);
        if (alt && alt.length) {
          // catch (do try) e else (do if): lista alternativa em paralelo à última célula do bloco, terminando junto com ela
          const kind = b.t === "try" ? "catch" : "else", count = place(alt, depth + 1, 0, false, true), cs = Math.max(step, next - count);
          const crow = push({ kind, id: b.id, node: b, depth, s: cs, e: cs, leaf: false, closed: false });
          const cend = place(alt, depth + 1, cs, emit, true);
          if (emit) { crow.s = cs; crow.e = Math.max(cs, cend - 1); span.set(`${b.id}:${kind}`, { s: crow.s, e: crow.e }); crow.last = rows.length - 1; }
          end = Math.max(next, cend);
        }
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
    if (flow.ins.length || flow.outs.length) rows.push({ kind: "io", id: flow.id, node: flow, depth: 0, s: 0, e: 0, last: 1, leaf: false, closed: false, ins: flow.ins, outs: flow.outs });
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

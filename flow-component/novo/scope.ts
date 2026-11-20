import { locate, type Project } from "./model";
import type { Row, Scene } from "./layout";

/**
 * Arrastar a alça da etiqueta de um bloco: quantos itens (os do bloco + os irmãos seguintes) ficam dentro
 * quando o ponteiro está sobre o passo `step`? Sempre pelo menos 1.
 */
export function countForStep(p: Project, scene: Scene, blockId: string, step: number): number {
  const l = locate(p, blockId); if (!l || l.node.t === "fn") return 1;
  const items = [...l.node.kids, ...l.list.slice(l.index + 1)];
  let n = 0;
  for (const it of items) { const sp = scene.span.get(it.id); if (sp && sp.e > step) break; n++; }
  return Math.min(items.length, Math.max(1, n));
}

/**
 * Arrastar a alça pra baixo: com o ponteiro sobre a linha `rowIdx`, quantos itens (os do bloco + os irmãos seguintes) ficam dentro?
 * Conta os itens cuja primeira linha já foi alcançada; sempre pelo menos 1. `lastRow` é a última linha do item que fecha o bloco (para a guia).
 */
export function countForRow(p: Project, scene: Scene, blockId: string, rowIdx: number): { count: number; lastRow: number } {
  const l = locate(p, blockId); if (!l || l.node.t === "fn") return { count: 1, lastRow: rowIdx };
  const items = [...l.node.kids, ...l.list.slice(l.index + 1)], first = (id: string): number => scene.rows.findIndex((r: Row) => r.id === id && (r.kind === "fn" || r.kind === "block"));
  let n = 0, lastRow = first(items[0]?.id ?? "");
  for (const it of items) { const f = first(it.id); if (f === -1 || f > rowIdx) break; n++; lastRow = scene.rows[f]!.last; }
  n = Math.min(items.length, Math.max(1, n)); if (n === 1) { const f = first(items[0]?.id ?? ""); lastRow = f === -1 ? rowIdx : scene.rows[f]!.last; }
  return { count: n, lastRow };
}

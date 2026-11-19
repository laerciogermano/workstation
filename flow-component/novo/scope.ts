import { locate, type Project } from "./model";
import type { Scene } from "./layout";

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

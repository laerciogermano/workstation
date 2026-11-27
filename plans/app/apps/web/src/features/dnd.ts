// Onde o cartão arrastado cairia: no terço de cima ou de baixo de outro, vira irmão; no meio, vira filho.
import type { TreeNode } from '@plans/domain';
import { GY, W, type Box } from './layout.ts';

export type Drop = { kind: 'before' | 'after' | 'child'; over: string; parent: string | null; before: string | null };
type Visible = { node: TreeNode; parent: string | null };

export function dropTarget(pos: Map<string, Box>, order: Visible[], point: { x: number; y: number }, moving: Set<string>): Drop | null {
  for (const { node, parent } of order) {
    const id = node.activity.id;
    const box = pos.get(id)!;
    // o próprio cartão e os descendentes não são destino
    if (moving.has(id)) continue;
    if (point.x < box.x || point.x > box.x + W || point.y < box.y - GY / 2 || point.y > box.y + box.h + GY / 2) continue;
    const where = (point.y - box.y) / box.h;
    if (where < 0.25) return { kind: 'before', over: id, parent, before: id };
    if (where <= 0.75) return { kind: 'child', over: id, parent: id, before: null };
    const siblings = order.filter((o) => o.parent === parent).map((o) => o.node.activity.id);
    const next = siblings.slice(siblings.indexOf(id) + 1).find((s) => !moving.has(s));
    return { kind: 'after', over: id, parent, before: next ?? null };
  }
  return null;
}

/** Velocidade de deslocamento quando o ponteiro chega perto da borda da tela (px por quadro). */
export function edgeSpeed(at: number, size: number, band = 48, max = 18): number {
  if (at < 0 || at > size) return 0;
  if (at < band) return Math.ceil(((band - at) / band) * max);
  if (at > size - band) return -Math.ceil(((at - (size - band)) / band) * max);
  return 0;
}

// Posição dos cartões: colunas por nível, cada um com a altura do próprio título, sem sobreposição.
import type { TreeNode } from '@plans/domain';

export const W = 236, H = 56, GX = 52, GY = 18, P = 28;
export const NEW = 'novo';
export type Box = { x: number; y: number; h: number };

export function layout(roots: TreeNode[], creating: string | null, collapsed: Set<string>, heightOf: (n: TreeNode) => number) {
  const pos = new Map<string, Box>();
  const order: { node: TreeNode; parent: string | null }[] = [];
  let y = P;
  const center = (id: string) => pos.get(id)!.y + pos.get(id)!.h / 2;

  const place = (n: TreeNode, parent: string | null) => {
    const id = n.activity.id;
    order.push({ node: n, parent });
    const start = y;
    const mark = order.length;
    const h = heightOf(n);
    const x = P + n.depth * (W + GX);
    const below = (collapsed.has(id) ? [] : n.children).map((c) => (place(c, id), c.activity.id));
    if (creating === id) {
      pos.set(NEW, { x: x + W + GX, y, h: H });
      below.push(NEW);
      y += H + GY;
    }
    if (!below.length) {
      pos.set(id, { x, y, h });
      y += h + GY;
      return;
    }
    let top = (center(below[0]!) + center(below.at(-1)!)) / 2 - h / 2;
    // pai mais alto que o espaço dos filhos: empurra os filhos para baixo em vez de invadir o irmão de cima
    if (top < start) {
      const shift = start - top;
      for (const moved of [...order.slice(mark).map((o) => o.node.activity.id), ...(creating ? [NEW] : [])]) {
        const box = pos.get(moved);
        if (box && box.y >= start) box.y += shift;
      }
      y += shift;
      top = start;
    }
    pos.set(id, { x, y: top, h });
    y = Math.max(y, top + h + GY);
  };

  roots.forEach((r) => (place(r, null), (y += 10)));
  if (creating === 'root') {
    pos.set(NEW, { x: P, y, h: H });
    y += H + GY;
  }
  const width = Math.max(0, ...[...pos.values()].map((p) => p.x + W)) + P;
  return { pos, order, width, height: y + P };
}

export const edge = (a: Box, b: Box) => `M${a.x + W} ${a.y + a.h / 2} H${a.x + W + GX / 2} V${b.y + b.h / 2} H${b.x}`;

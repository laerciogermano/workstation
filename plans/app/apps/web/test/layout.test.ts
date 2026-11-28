import { buildTree, type Activity } from '@plans/domain';
import { describe, expect, it } from 'vitest';
import { layout, NEW, ROOT } from '../src/features/layout.ts';

const act = (id: string, parent: string | null, n: number): Activity => ({ id, title: id, parent, assignee: null, createdAt: String(n).padStart(4, '0'), description: '', extra: {} });

/** árvore pseudoaleatória, sempre a mesma */
function sample(size: number) {
  let seed = 7;
  const rnd = (m: number) => (seed = (seed * 48271) % 2147483647) % m;
  return Array.from({ length: size }, (_, i) => act(`n${i}`, i && rnd(5) ? `n${rnd(i)}` : null, i));
}

function overlaps(pos: Map<string, { x: number; y: number; h: number }>) {
  const boxes = [...pos];
  return boxes.flatMap(([a, p], i) => boxes.slice(i + 1).filter(([, q]) => p.x === q.x && p.y < q.y + q.h && q.y < p.y + p.h).map(([b]) => `${a}×${b}`));
}

describe('posição dos cartões', () => {
  it('não sobrepõe cartões de alturas diferentes, nem com um pai mais alto que os filhos', () => {
    const tree = buildTree(sample(250));
    for (const creating of [null, 'n3', 'root']) {
      const { pos, height } = layout(tree, creating, new Set(['n5']), (n) => 56 + ((Number(n.activity.id.slice(1)) * 37) % 9) * 40);
      expect(overlaps(pos)).toEqual([]);
      expect(Math.max(...[...pos.values()].map((p) => p.y + p.h))).toBeLessThanOrEqual(height);
      expect(Math.min(...[...pos.values()].map((p) => p.y))).toBeGreaterThanOrEqual(28);
    }
  });

  it('mantém o pai centralizado nos filhos', () => {
    const tree = buildTree([act('p', null, 0), act('a', 'p', 1), act('b', 'p', 2)]);
    const { pos } = layout(tree, null, new Set(), (n) => (n.activity.id === 'p' ? 200 : 56));
    const mid = (id: string) => pos.get(id)!.y + pos.get(id)!.h / 2;
    expect(mid('p')).toBe((mid('a') + mid('b')) / 2);
    expect(pos.has(NEW)).toBe(false);
  });

  it('põe a raiz do projeto no topo, antes das atividades sem pai', () => {
    const tree = buildTree([act('a', null, 0), act('b', null, 1)]);
    const { pos } = layout(tree, null, new Set(), () => 56);
    expect(pos.get(ROOT)!.x).toBeLessThan(pos.get('a')!.x);
    expect(pos.get(ROOT)!.y).toBe(pos.get('a')!.y);
    // criando na raiz, o campo novo é mais um filho dela
    const next = layout(tree, 'root', new Set(), () => 56).pos;
    expect(next.get(NEW)!.x).toBe(next.get('a')!.x);
    expect(next.get(NEW)!.y).toBeGreaterThan(next.get('b')!.y);
    expect(layout([], null, new Set(), () => 56).pos.has(ROOT)).toBe(false);
  });
});

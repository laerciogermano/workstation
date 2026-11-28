import { buildTree, type Activity } from '@plans/domain';
import { describe, expect, it } from 'vitest';
import { dropTarget, edgeSpeed } from '../src/features/dnd.ts';
import { layout, ROOT } from '../src/features/layout.ts';

const act = (id: string, parent: string | null, n: number): Activity => ({ id, title: id, parent, assignee: null, createdAt: new Date(n * 1000).toISOString(), description: '', extra: {} });
const tree = buildTree([act('r', null, 1), act('a', 'r', 2), act('b', 'r', 3), act('c', 'r', 4), act('a1', 'a', 5)]);
const { pos, order } = layout(tree, null, new Set(), () => 80);
const at = (id: string, fraction: number, moving: string[]) => {
  const b = pos.get(id)!;
  return dropTarget(pos, order, { x: b.x + 10, y: b.y + b.h * fraction }, new Set(moving));
};

describe('arrastar e soltar', () => {
  it('em cima, embaixo ou no meio de um cartão', () => {
    expect(at('b', 0.1, ['c'])).toEqual({ kind: 'before', over: 'b', parent: 'r', before: 'b' });
    expect(at('b', 0.5, ['c'])).toEqual({ kind: 'child', over: 'b', parent: 'b', before: null });
    expect(at('a', 0.9, ['b'])).toEqual({ kind: 'after', over: 'a', parent: 'r', before: 'c' });
    expect(at('c', 0.9, ['a'])).toMatchObject({ before: null });
    expect(at('r', 0.1, ['b'])).toMatchObject({ parent: null, before: 'r' });
  });
  it('em cima da raiz do projeto, vai para o primeiro nível', () => {
    expect(at(ROOT, 0.5, ['a1'])).toEqual({ kind: 'child', over: ROOT, parent: null, before: null });
  });
  it('não aceita o próprio cartão, descendentes nem o vazio', () => {
    expect(at('a', 0.5, ['a', 'a1'])).toBeNull();
    expect(at('a1', 0.5, ['a', 'a1'])).toBeNull();
    expect(dropTarget(pos, order, { x: -500, y: -500 }, new Set())).toBeNull();
  });
  it('desloca a tela perto das bordas, só por dentro', () => {
    expect(edgeSpeed(400, 800)).toBe(0);
    expect(edgeSpeed(0, 800)).toBe(18);
    expect(edgeSpeed(800, 800)).toBe(-18);
    expect(edgeSpeed(-20, 800)).toBe(0);
  });
});

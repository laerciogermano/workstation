import { buildTree, type Activity, type Status, type TreeNode } from '@plans/domain';
import { describe, expect, it } from 'vitest';
import { dropTarget } from '../src/features/dnd.ts';
import { filterTree, isFiltering, matches, NO_FILTERS, type Filters } from '../src/features/filters.ts';
import { layout } from '../src/features/layout.ts';

const act = (id: string, parent: string | null, n: number, status?: Status, assignee: string | null = null): Activity => ({
  id, title: id, parent, assignee, createdAt: new Date(n * 1000).toISOString(), ...(status ? { status } : {}), description: '', extra: {},
});
// r(doing) → a → a1(done), a2 ; r → b(done, eu) ; s
const activities = [
  act('r', null, 1, 'doing'), act('a', 'r', 2), act('a1', 'a', 3, 'done'), act('a2', 'a', 4), act('b', 'r', 5, 'done', 'eu'), act('s', null, 6),
];
const tree = buildTree(activities);
const only = (...statuses: Status[]): Filters => ({ ...NO_FILTERS, statuses });
const draw = (nodes: TreeNode[]): string => nodes.map((n) => n.activity.id + (n.children.length ? `(${draw(n.children)})` : '')).join(' ');
const shown = (filters: Filters, keep?: string) => draw(filterTree(tree, filters, keep));

describe('filtro por status', () => {
  it('sem status no arquivo conta como To do', () => {
    expect(isFiltering(only('todo'))).toBe(true);
    expect(activities.filter((a) => matches(a, only('todo'))).map((a) => a.id)).toEqual(['a', 'a2', 's']);
  });

  it('vale qualquer um dos status escolhidos e soma com o responsável', () => {
    expect(activities.filter((a) => matches(a, only('doing', 'done'))).map((a) => a.id)).toEqual(['r', 'a1', 'b']);
    expect(activities.filter((a) => matches(a, { statuses: ['done'], assignees: ['eu'] })).map((a) => a.id)).toEqual(['b']);
  });

  it('na árvore, mantém os pais de quem casa, na mesma ordem e no mesmo nível', () => {
    expect(shown(only('done'))).toBe('r(a(a1) b)');
    expect(shown(only('todo'))).toBe('r(a(a2)) s');
    // pai que casa sem filho que case aparece sozinho
    expect(shown(only('doing'))).toBe('r');
    expect(filterTree(tree, only('done'))[0]!.children[0]!.children[0]!.depth).toBe(2);
  });

  it('sem filtro devolve a própria árvore; sem resultado, nada', () => {
    expect(filterTree(tree, NO_FILTERS)).toBe(tree);
    expect(shown({ statuses: ['doing'], assignees: ['eu'] })).toBe('');
    // filtrar não altera a árvore original
    expect(draw(tree)).toBe('r(a(a1 a2) b) s');
  });

  it('mantém o cartão selecionado e os pais dele, mesmo sem casar', () => {
    expect(shown(only('done'), 's')).toBe('r(a(a1) b) s');
    expect(shown(only('doing'), 'a2')).toBe('r(a(a2))');
  });

  it('soltar depois de um cartão põe logo depois dele, antes de um irmão escondido', () => {
    const { pos, order } = layout(filterTree(tree, only('done')), null, new Set(), () => 80);
    const box = pos.get('a1')!;
    const siblingsOf = () => ['a1', 'a2'];
    expect(dropTarget(pos, order, { x: box.x + 10, y: box.y + box.h * 0.9 }, new Set(['b']), siblingsOf)).toEqual({ kind: 'after', over: 'a1', parent: 'a', before: 'a2' });
  });
});

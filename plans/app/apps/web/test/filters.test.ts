import type { Activity, Assignee } from '@plans/domain';
import { describe, expect, it } from 'vitest';
import { assigneeOptions, isFiltering, matches, NO_FILTERS, toggled, UNASSIGNED } from '../src/features/filters.ts';

const activity = (assignee: string | null): Activity => ({ id: assignee ?? 'ninguem', title: 't', parent: null, assignee, createdAt: '2026-11-28T00:00:00.000Z', description: '', extra: {} });
const all = ['eu', 'claude', 'terminal', null, 'antigo'].map(activity);
const shown = (assignees: string[]) => all.filter((a) => matches(a, { ...NO_FILTERS, assignees })).map((a) => a.assignee);

const catalog: Assignee[] = [
  { id: 'eu', name: 'Eu', type: 'person' },
  { id: 'claude', name: 'Claude', type: 'ai' },
  { id: 'terminal', name: 'Terminal', type: 'machine' },
];

describe('filtro por responsável', () => {
  it('sem nada escolhido mostra tudo', () => {
    expect(isFiltering(NO_FILTERS)).toBe(false);
    expect(shown([])).toEqual(['eu', 'claude', 'terminal', null, 'antigo']);
  });

  it('mostra só os escolhidos, inclusive vários, sem responsável e id fora do catálogo', () => {
    expect(isFiltering({ ...NO_FILTERS, assignees: [UNASSIGNED] })).toBe(true);
    expect(shown(['claude'])).toEqual(['claude']);
    expect(shown(['eu', 'terminal'])).toEqual(['eu', 'terminal']);
    expect(shown([UNASSIGNED])).toEqual([null]);
    expect(shown(['antigo'])).toEqual(['antigo']);
    expect(shown(['ninguem-tem'])).toEqual([]);
  });

  it('marca e desmarca', () => {
    expect(toggled(['eu'], 'claude')).toEqual(['eu', 'claude']);
    expect(toggled(['eu', 'claude'], 'eu')).toEqual(['claude']);
  });

  it('oferece o catálogo, os ids desconhecidos e “sem responsável”', () => {
    expect(assigneeOptions(catalog, all, []).map((o) => [o.key, o.type])).toEqual([
      ['eu', 'person'], ['claude', 'ai'], ['terminal', 'machine'], ['antigo', 'unknown'], [UNASSIGNED, 'none'],
    ]);
  });

  it('mantém o que está escolhido mesmo depois de sumir do catálogo e das atividades', () => {
    expect(assigneeOptions(catalog, [], ['saiu', 'eu', UNASSIGNED]).map((o) => o.key)).toEqual(['eu', 'claude', 'terminal', 'saiu', UNASSIGNED]);
  });
});

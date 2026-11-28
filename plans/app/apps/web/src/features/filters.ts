// Filtro das atividades: estado e predicado puros, sem React nem armazenamento. Só muda o que a tela mostra.
//
// Para um critério novo: 1) um campo em `Filters` (lista ou texto; vazio = não filtra), 2) o valor vazio em
// `NO_FILTERS`, 3) uma linha em `CRITERIA` e 4) o controle em `FilterBar.tsx`, gravando com `setFilters`.
import type { Activity, Assignee, Status, TreeNode } from '@plans/domain';

/** Chave de “sem responsável”: um id de verdade tem pelo menos um caractere. */
export const UNASSIGNED = '';

export type Filters = {
  /** ids de responsável escolhidos (ou `UNASSIGNED`) */
  assignees: string[];
  /** status escolhidos; atividade sem status conta como To do */
  statuses: Status[];
};

export const NO_FILTERS: Filters = { assignees: [], statuses: [] };

/** Dentro de um critério vale qualquer um dos escolhidos (ou); entre critérios, todos (e). */
const CRITERIA: ((a: Activity, f: Filters) => boolean)[] = [
  (a, f) => !f.assignees.length || f.assignees.includes(a.assignee ?? UNASSIGNED),
  (a, f) => !f.statuses.length || f.statuses.includes(a.status ?? 'todo'),
];

export const matches = (a: Activity, filters: Filters) => CRITERIA.every((criterion) => criterion(a, filters));

/** Há algum critério escolhido? */
export const isFiltering = (filters: Filters) => Object.values(filters).some((value) => value.length > 0);

/**
 * A árvore só com o que casa e, para continuar legível, os pais até a raiz. `keep` (o cartão selecionado)
 * também fica, para não sumir da tela quem acabou de ser criado ou mudado.
 */
export function filterTree(nodes: TreeNode[], filters: Filters, keep: string | null = null): TreeNode[] {
  if (!isFiltering(filters)) return nodes;
  return nodes.flatMap((n) => {
    const children = filterTree(n.children, filters, keep);
    return children.length || n.activity.id === keep || matches(n.activity, filters) ? [{ ...n, children }] : [];
  });
}

/** Marca ou desmarca um valor da lista de um critério. */
export const toggled = <T>(list: T[], value: T): T[] => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

export type AssigneeOption = { key: string; name: string; type: Assignee['type'] | 'none' | 'unknown' };

/**
 * O que dá para escolher: cada um de `assignees.json`, os ids fora do catálogo que estejam em uma
 * atividade ou já escolhidos (para sempre dar para desmarcar) e, no fim, “sem responsável”.
 */
export function assigneeOptions(assignees: Assignee[], activities: Activity[], selected: string[]): AssigneeOption[] {
  const known = new Set([UNASSIGNED, ...assignees.map((a) => a.id)]);
  const unknown = new Set([...activities.map((a) => a.assignee ?? UNASSIGNED), ...selected].filter((id) => !known.has(id)));
  return [
    ...assignees.map((a) => ({ key: a.id, name: a.name, type: a.type })),
    ...[...unknown].sort().map((id) => ({ key: id, name: `${id} (?)`, type: 'unknown' as const })),
    { key: UNASSIGNED, name: 'Sem responsável', type: 'none' as const },
  ];
}

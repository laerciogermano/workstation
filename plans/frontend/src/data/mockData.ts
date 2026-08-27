export type ResponsibleType = 'pessoa' | 'ia' | 'maquina';

export type AiStatus = 'pendente' | 'em execução' | 'concluída' | 'falhou' | 'cancelada';

export type Responsible = {
  id: string;
  name: string;
  type: ResponsibleType;
  inUse: boolean;
};

export type WorkUnit = {
  id: string;
  title: string;
  context?: string;
  responsibleId?: string;
  parentId?: string;
  columnId: string;
  laneId: string;
  archived: boolean;
  aiStatus?: AiStatus;
  start?: string;
  end?: string;
  planId: string;
  outputs?: { name: string; ref: string }[];
  machineCode?: string;
};

export type Column = { id: string; name: string; order: number; execution: boolean };
export type Lane = { id: string; name: string; order: number };
export type Plan = { id: string; name: string; isDefault?: boolean };
export type Dependency = { fromId: string; toId: string; kind: 'sequential' | 'parallel' };

export const catalog: Responsible[] = [
  { id: 'p1', name: 'Ana Silva', type: 'pessoa', inUse: true },
  { id: 'p2', name: 'Bruno Costa', type: 'pessoa', inUse: false },
  { id: 'a1', name: 'Research Agent', type: 'ia', inUse: true },
  { id: 'a2', name: 'Code Agent', type: 'ia', inUse: true },
  { id: 'm1', name: 'Node Runner', type: 'maquina', inUse: true },
  { id: 'm2', name: 'File Worker', type: 'maquina', inUse: false },
];

export const columns: Column[] = [
  { id: 'c1', name: 'Backlog', order: 1, execution: false },
  { id: 'c2', name: 'Em progresso', order: 2, execution: false },
  { id: 'c3', name: 'Execução IA', order: 3, execution: true },
  { id: 'c4', name: 'Concluído', order: 4, execution: false },
];

export const lanes: Lane[] = [
  { id: 'l1', name: 'Produto', order: 1 },
  { id: 'l2', name: 'Engenharia', order: 2 },
];

export const plans: Plan[] = [
  { id: 'plan-default', name: 'Plano padrão', isDefault: true },
  { id: 'plan-onboarding', name: 'Onboarding cliente' },
];

export const units: WorkUnit[] = [
  {
    id: 'u1',
    title: 'Comprar fone de ouvido',
    context: 'Uso diário, cancelamento de ruído, até R$ 500',
    responsibleId: 'p1',
    columnId: 'c1',
    laneId: 'l1',
    archived: false,
    planId: 'plan-default',
    start: '2026-08-26',
    end: '2026-08-28',
  },
  {
    id: 'u2',
    title: 'Definir orçamento',
    parentId: 'u1',
    responsibleId: 'p1',
    columnId: 'c2',
    laneId: 'l1',
    archived: false,
    planId: 'plan-default',
    start: '2026-08-26',
    end: '2026-08-26',
  },
  {
    id: 'u3',
    title: 'Comparar modelos',
    parentId: 'u1',
    responsibleId: 'a1',
    columnId: 'c3',
    laneId: 'l1',
    archived: false,
    aiStatus: 'em execução',
    planId: 'plan-default',
    start: '2026-08-27',
    end: '2026-08-28',
    outputs: [{ name: 'comparativo', ref: 'out/u3-comparativo.json' }],
  },
  {
    id: 'u4',
    title: 'Exportar fluxo onboarding',
    responsibleId: 'a2',
    columnId: 'c2',
    laneId: 'l2',
    archived: false,
    aiStatus: 'falhou',
    planId: 'plan-onboarding',
    start: '2026-08-25',
    end: '2026-08-29',
  },
  {
    id: 'u5',
    title: 'Gerar artefatos HTTP',
    responsibleId: 'm1',
    columnId: 'c2',
    laneId: 'l2',
    archived: false,
    planId: 'plan-onboarding',
    start: '2026-08-28',
    end: '2026-08-30',
    machineCode: `import http from 'http';\n\nexport async function run(ctx) {\n  const res = await http.get(ctx.url);\n  return { status: res.status };\n}`,
    outputs: [{ name: 'status', ref: 'out/u5-status.json' }],
  },
  {
    id: 'u6',
    title: 'Arquivo antigo — pesquisa mercado',
    columnId: 'c4',
    laneId: 'l1',
    archived: true,
    planId: 'plan-default',
  },
  {
    id: 'u7',
    title: 'Sem datas no Gantt',
    responsibleId: 'p2',
    columnId: 'c1',
    laneId: 'l2',
    archived: false,
    planId: 'plan-default',
  },
  ...deepChainUnits(22),
];

/** Cadeia linear de N níveis (raiz + N−1 filhos) para demonstrar drill-down profundo no Explorar. */
function deepChainUnits(levels: number): WorkUnit[] {
  const chain: WorkUnit[] = [];
  for (let i = 1; i <= levels; i++) {
    const id = `deep-${i}`;
    chain.push({
      id,
      title: i === 1 ? `Cadeia profunda (${levels} níveis)` : `Nível ${i} / ${levels}`,
      parentId: i === 1 ? undefined : `deep-${i - 1}`,
      columnId: 'c1',
      laneId: 'l2',
      archived: false,
      planId: 'plan-default',
      responsibleId: i === levels ? 'p1' : undefined,
    });
  }
  return chain;
}

export const dependencies: Dependency[] = [
  { fromId: 'u2', toId: 'u3', kind: 'sequential' },
  { fromId: 'u4', toId: 'u5', kind: 'parallel' },
];

export function responsibleById(id?: string) {
  return catalog.find((r) => r.id === id);
}

export function unitById(id: string) {
  return units.find((u) => u.id === id);
}

export function childrenOf(id: string) {
  return units.filter((u) => u.parentId === id && !u.archived);
}

export function roots() {
  return units.filter((u) => !u.parentId);
}

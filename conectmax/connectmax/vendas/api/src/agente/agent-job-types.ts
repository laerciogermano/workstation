/**
 * Tipos de trabalho do loop do agente (prioridade crescente = mais urgente).
 * AC-01 ler_mensagens → verificar_conexoes → AC-02 enviar_prospeccao →
 * AC-03 conectar → AC-04 extrair_leads
 */
export const AGENT_JOB_TYPES = [
  'ler_mensagens',
  'verificar_conexoes',
  'enviar_prospeccao',
  'conectar',
  'extrair_leads',
] as const;

export type AgentJobType = (typeof AGENT_JOB_TYPES)[number];

/** Menor número = maior prioridade. */
export const AGENT_JOB_PRIORITY: Record<AgentJobType, number> = {
  ler_mensagens: 1,
  verificar_conexoes: 2,
  enviar_prospeccao: 3,
  conectar: 4,
  extrair_leads: 5,
};

export const AGENT_JOB_STATUSES = [
  'pending',
  'claimed',
  'done',
  'failed',
  'cancelled',
] as const;

export type AgentJobStatus = (typeof AGENT_JOB_STATUSES)[number];

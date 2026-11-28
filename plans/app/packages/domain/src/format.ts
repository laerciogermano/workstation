// Formato dos arquivos do projeto: um Markdown por atividade (cabeçalho YAML + descrição).
import { parse as parseYaml, stringify as toYaml } from 'yaml';
import { z } from 'zod';

export const SCHEMA_VERSION = 1;
export const TITLE_MAX = 200;
export const DESCRIPTION_MAX = 100_000;

export const titleSchema = z
  .string()
  .trim()
  .min(1, 'Informe o título')
  .max(TITLE_MAX, `Título com no máximo ${TITLE_MAX} caracteres`)
  .refine((t) => !/[\r\n]/.test(t), 'Título em uma linha só');

export const STATUSES = ['todo', 'doing', 'done'] as const;
export type Status = (typeof STATUSES)[number];
export const STATUS_LABEL: Record<Status, string> = { todo: 'To do', doing: 'Doing', done: 'Done' };

/** Escala de prioridade: quanto maior, mais urgente. */
export const PRIORITIES = [1, 2, 3, 4, 5] as const;
export type Priority = (typeof PRIORITIES)[number];
export const PRIORITY_LABEL: Record<Priority, string> = { 1: 'Muito baixa', 2: 'Baixa', 3: 'Média', 4: 'Alta', 5: 'Urgente' };

const headerSchema = z.looseObject({
  id: z.uuid(),
  title: z.string().min(1).max(TITLE_MAX),
  parent: z.uuid().nullable().default(null),
  assignee: z.string().min(1).max(64).nullable().default(null),
  createdAt: z.string().min(1),
  /** ausente = todo */
  status: z.enum(STATUSES).optional(),
  /** ausente = sem prioridade */
  priority: z.literal(PRIORITIES).optional(),
  /** dia combinado para a entrega (AAAA-MM-DD, sem hora nem fuso); ausente = sem data */
  dueDate: z.iso.date('Use uma data no formato AAAA-MM-DD').optional(),
  /** ids das etiquetas de labels.json; ausente = nenhuma */
  labels: z.array(z.string().min(1).max(64)).optional(),
  /** posição entre os irmãos; ausente = ordem de criação */
  order: z.number().finite().optional(),
});

export type Activity = {
  id: string;
  title: string;
  parent: string | null;
  assignee: string | null;
  createdAt: string;
  status?: Status;
  priority?: Priority;
  dueDate?: string;
  labels?: string[];
  order?: number;
  description: string;
  /**
   * Cópia do system prompt gravada no arquivo (snapshot).
   * Ausente = arquivo antigo com referência `/system-prompt.md` ou sem bloco.
   */
  systemPromptText?: string;
  /** chaves do cabeçalho que não conhecemos: preservadas na regravação */
  extra: Record<string, unknown>;
};

/** Instruções padrão do projeto, na raiz da pasta. */
export const SYSTEM_PROMPT_FILE = 'system-prompt.md';
/** Caminho antigo no bloco SYSTEM PROMPT (ainda aceito na leitura). */
const LEGACY_PROMPT_REF = `/${SYSTEM_PROMPT_FILE}`;
/** Bloco no topo do arquivo: título + texto (ou referência legada de uma linha). */
const PROMPT_BLOCK = /^SYSTEM PROMPT[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n/;

/** True se o bloco ainda é só o caminho `/system-prompt.md` (ou outro path de uma linha). */
export function isLegacySystemPromptRef(block: string): boolean {
  const t = block.replace(/\r\n/g, '\n').replace(/^\n+|\n+$/g, '');
  return t === LEGACY_PROMPT_REF || /^\/[\w./-]+$/.test(t);
}

/** Prefixo `SYSTEM PROMPT` + texto colado (sem referência de arquivo). */
export function systemPromptPrefix(text: string): string {
  const body = text.replace(/\r\n/g, '\n').replace(/\n$/, '');
  if (/(^|\n)---[ \t]*(\n|$)/.test(body)) {
    throw new Error('O system prompt não pode conter uma linha só com ---.');
  }
  return body ? `SYSTEM PROMPT\n${body}\n\n` : 'SYSTEM PROMPT\n\n';
}

export function parseActivity(text: string): Activity {
  let raw = text.replace(/^\uFEFF/, '');
  let systemPromptText: string | undefined;
  const prompt = raw.match(PROMPT_BLOCK);
  if (prompt) {
    const block = prompt[1]!.replace(/\r\n/g, '\n');
    if (!isLegacySystemPromptRef(block)) systemPromptText = block.replace(/\n$/, '');
    raw = `---\n${raw.slice(prompt[0].length)}`;
  }
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!m) throw new Error('Cabeçalho entre "---" não encontrado.');
  // schema "core": só tipos básicos (datas continuam texto, sem tipos personalizados)
  const header = headerSchema.safeParse(parseYaml(m[1]!, { schema: 'core' }));
  if (!header.success) {
    throw new Error(header.error.issues.map((i) => `${i.path.join('.') || 'cabeçalho'}: ${i.message}`).join('; '));
  }
  const { id, title, parent, assignee, createdAt, status, priority, dueDate, labels, order, ...extra } = header.data;
  const description = m[2]!.replace(/\r\n/g, '\n').replace(/\n$/, '');
  return {
    id, title, parent, assignee, createdAt,
    ...(status === undefined ? {} : { status }),
    ...(priority === undefined ? {} : { priority }),
    ...(dueDate === undefined ? {} : { dueDate }),
    ...(labels?.length ? { labels } : {}),
    ...(order === undefined ? {} : { order }),
    description,
    ...(systemPromptText === undefined ? {} : { systemPromptText }),
    extra,
  };
}

/**
 * Grava a atividade com o system prompt colado no topo.
 * `fallbackPrompt` preenche quando o cartão ainda não tem snapshot (arquivo legado).
 */
export function serializeActivity(a: Activity, fallbackPrompt = ''): string {
  const { id, title, parent, assignee, createdAt, status, priority, dueDate, labels, order, description, systemPromptText, extra } = a;
  const header = toYaml(
    { id, title, parent, assignee, ...(status === undefined ? {} : { status }), ...(priority === undefined ? {} : { priority }), ...(dueDate === undefined ? {} : { dueDate }), ...(labels?.length ? { labels } : {}), createdAt, ...(order === undefined ? {} : { order }), ...extra },
    { schema: 'core', lineWidth: 0 },
  );
  const body = description.replace(/\r\n/g, '\n');
  const prompt = systemPromptText !== undefined ? systemPromptText : fallbackPrompt;
  return `${systemPromptPrefix(prompt)}---\n${header}---\n${body ? body + '\n' : ''}`;
}

export const projectSchema = z.looseObject({
  schemaVersion: z.number().int().min(1),
  id: z.uuid(),
  name: z.string().min(1).max(200),
});
export type Project = z.infer<typeof projectSchema>;

export const assigneeSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  type: z.enum(['person', 'ai', 'machine']),
});
export type Assignee = z.infer<typeof assigneeSchema>;
export const assigneesSchema = z.object({ version: z.literal(1), items: z.array(assigneeSchema) });

export const DEFAULT_ASSIGNEES: Assignee[] = [
  { id: 'eu', name: 'Eu', type: 'person' },
  { id: 'claude', name: 'Claude', type: 'ai' },
  { id: 'gemini', name: 'Gemini', type: 'ai' },
  { id: 'terminal', name: 'Terminal', type: 'machine' },
];

export const uiSchema = z.object({ selected: z.string().nullable().default(null), collapsed: z.array(z.string()).default([]), theme: z.string().optional(), panel: z.boolean().default(true), descriptionMode: z.enum(['read', 'edit', 'split']).default('read'), view: z.enum(['tree', 'kanban']).default('tree'), systemPromptMode: z.enum(['read', 'edit', 'split']).default('read') });
export type UiState = z.infer<typeof uiSchema>;

export const runRecordSchema = z.object({
  runId: z.uuid(),
  nodeId: z.string().nullable().default(null),
  program: z.string().optional(),
  args: z.array(z.string()).optional(),
  script: z.string().optional(),
  shell: z.string().optional(),
  cwd: z.string().optional(),
  status: z.enum(['waiting', 'pending', 'running', 'ok', 'failed', 'cancelled', 'timeout', 'rejected', 'lost']),
  code: z.number().int().nullable().default(null),
  error: z.string().optional(),
  allowCommand: z.string().optional(),
  truncated: z.boolean().default(false),
  startedAt: z.string(),
  endedAt: z.string().nullable().default(null),
});
export type RunRecord = z.infer<typeof runRecordSchema>;
export const isOpenRun = (r: RunRecord) => r.status === 'waiting' || r.status === 'pending' || r.status === 'running';

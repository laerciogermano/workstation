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

const headerSchema = z.looseObject({
  id: z.uuid(),
  title: z.string().min(1).max(TITLE_MAX),
  parent: z.uuid().nullable().default(null),
  assignee: z.string().min(1).max(64).nullable().default(null),
  createdAt: z.string().min(1),
  /** ausente = todo */
  status: z.enum(STATUSES).optional(),
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
  order?: number;
  description: string;
  /** chaves do cabeçalho que não conhecemos: preservadas na regravação */
  extra: Record<string, unknown>;
};

export function parseActivity(text: string): Activity {
  const m = text.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!m) throw new Error('Cabeçalho entre "---" não encontrado.');
  // schema "core": só tipos básicos (datas continuam texto, sem tipos personalizados)
  const header = headerSchema.safeParse(parseYaml(m[1]!, { schema: 'core' }));
  if (!header.success) {
    throw new Error(header.error.issues.map((i) => `${i.path.join('.') || 'cabeçalho'}: ${i.message}`).join('; '));
  }
  const { id, title, parent, assignee, createdAt, status, order, ...extra } = header.data;
  const description = m[2]!.replace(/\r\n/g, '\n').replace(/\n$/, '');
  return { id, title, parent, assignee, createdAt, ...(status === undefined ? {} : { status }), ...(order === undefined ? {} : { order }), description, extra };
}

export function serializeActivity(a: Activity): string {
  const { id, title, parent, assignee, createdAt, status, order, description, extra } = a;
  const header = toYaml(
    { id, title, parent, assignee, ...(status === undefined ? {} : { status }), createdAt, ...(order === undefined ? {} : { order }), ...extra },
    { schema: 'core', lineWidth: 0 },
  );
  const body = description.replace(/\r\n/g, '\n');
  return `---\n${header}---\n${body ? body + '\n' : ''}`;
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
  { id: 'terminal', name: 'Terminal', type: 'machine' },
];

export const uiSchema = z.object({ selected: z.string().nullable().default(null), collapsed: z.array(z.string()).default([]), theme: z.string().optional(), panel: z.boolean().default(true) });
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

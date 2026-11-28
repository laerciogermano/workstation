// Leitura e gravação do projeto na pasta. É o único lugar que toca nos arquivos do Plans.
import {
  assigneesSchema, DEFAULT_ASSIGNEES, DESCRIPTION_MAX, parseActivity, projectSchema, runRecordSchema, SCHEMA_VERSION,
  planMove, serializeActivity, SYSTEM_PROMPT_FILE, subtreeLeavesFirst, titleSchema, uiSchema,
  type Activity, type Assignee, type Project, type RunRecord, type Status, type UiState,
} from '@plans/domain';
import type { DirLike } from './types.ts';

export type StoredActivity = Activity & { rev: string };
export type Problem = { file: string; message: string };
export type Patch = { title?: string; assignee?: string | null; description?: string; status?: Status };
/** Instruções padrão de todas as atividades. Sem arquivo, o texto é vazio. */
export type SystemPrompt = { text: string; rev: string };
export type Snapshot = { activities: StoredActivity[]; assignees: Assignee[]; systemPrompt: SystemPrompt; problems: Problem[] };

export class ConflictError extends Error {
  constructor() {
    super('O arquivo mudou fora desta tela. Recarregue e tente de novo.');
  }
}
export class HasChildrenError extends Error {
  readonly count: number;
  constructor(count: number) {
    super('O nó tem filhos.');
    this.count = count;
  }
}

const isNotFound = (e: unknown) => (e as { name?: string })?.name === 'NotFoundError';

export async function hashText(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest).subarray(0, 16), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function readText(dir: DirLike, name: string): Promise<string | null> {
  try {
    return await (await (await dir.getFileHandle(name)).getFile()).text();
  } catch (e) {
    if (isNotFound(e)) return null;
    throw e;
  }
}

/** A mudança só aparece no arquivo quando o fechamento termina. */
async function writeText(dir: DirLike, name: string, text: string): Promise<void> {
  const w = await (await dir.getFileHandle(name, { create: true })).createWritable();
  try {
    await w.write(text);
    await w.close();
  } catch (e) {
    await w.abort().catch(() => {});
    throw e;
  }
}

async function readSystemPrompt(root: DirLike): Promise<SystemPrompt> {
  const raw = (await readText(root, SYSTEM_PROMPT_FILE)) ?? '';
  return { text: raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\n$/, ''), rev: await hashText(raw) };
}

const json = (v: unknown) => JSON.stringify(v, null, 2) + '\n';

/** Uma gravação por vez, entre abas (Web Locks) ou, sem elas, nesta aba. */
let chain: Promise<unknown> = Promise.resolve();
function exclusive<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const locks = (globalThis.navigator as Navigator | undefined)?.locks;
  if (locks) return locks.request(name, fn) as Promise<T>;
  const next = chain.then(fn, fn);
  chain = next.catch(() => {});
  return next;
}

export async function inspectFolder(root: DirLike): Promise<{ state: 'ready'; project: Project } | { state: 'new'; empty: boolean } | { state: 'invalid'; message: string }> {
  let text: string | null = null;
  try {
    text = await readText(await root.getDirectoryHandle('.plans'), 'project.json');
  } catch (e) {
    if (!isNotFound(e)) throw e;
  }
  if (text === null) {
    let empty = true;
    for await (const [name] of root.entries()) {
      if (!name.startsWith('.')) {
        empty = false;
        break;
      }
    }
    return { state: 'new', empty };
  }
  try {
    return { state: 'ready', project: projectSchema.parse(JSON.parse(text)) };
  } catch {
    return { state: 'invalid', message: '.plans/project.json está inválido. Nada foi alterado.' };
  }
}

export async function initFolder(root: DirLike): Promise<Project> {
  const meta = await root.getDirectoryHandle('.plans', { create: true });
  const project: Project = { schemaVersion: SCHEMA_VERSION, id: crypto.randomUUID(), name: root.name || 'Projeto' };
  await root.getDirectoryHandle('activities', { create: true });
  const runs = await root.getDirectoryHandle('runs', { create: true });
  // arquivos de ignorar dentro das próprias pastas: o .gitignore da pessoa não é tocado
  await writeText(meta, '.gitignore', 'ui.json\n');
  await writeText(runs, '.gitignore', '*\n');
  if ((await readText(root, 'assignees.json')) === null) {
    await writeText(root, 'assignees.json', json({ version: 1, items: DEFAULT_ASSIGNEES }));
  }
  // vazio até a pessoa escrever: a referência de cada atividade já aponta para um arquivo que existe
  if ((await readText(root, SYSTEM_PROMPT_FILE)) === null) await writeText(root, SYSTEM_PROMPT_FILE, '');
  await writeText(meta, 'project.json', json(project)); // por último: marca a pasta como projeto
  return project;
}

export class ProjectStore {
  readonly root: DirLike;
  readonly project: Project;
  readonly readOnly: boolean;

  constructor(root: DirLike, project: Project) {
    this.root = root;
    this.project = project;
    this.readOnly = project.schemaVersion > SCHEMA_VERSION;
  }

  private mutate<T>(fn: () => Promise<T>): Promise<T> {
    if (this.readOnly) return Promise.reject(new Error('Projeto criado por uma versão mais nova: somente leitura.'));
    return exclusive(`plans:${this.project.id}`, fn);
  }

  private activitiesDir() {
    return this.root.getDirectoryHandle('activities', { create: !this.readOnly });
  }

  async load(): Promise<Snapshot> {
    const activities: StoredActivity[] = [];
    const problems: Problem[] = [];
    let dir: DirLike | null = null;
    try {
      dir = await this.activitiesDir();
    } catch (e) {
      if (!isNotFound(e)) throw e;
    }
    if (dir) {
      for await (const [name, handle] of dir.entries()) {
        if (handle.kind !== 'file' || !name.endsWith('.md') || name.startsWith('.')) continue;
        try {
          const text = await (await handle.getFile()).text();
          const a = parseActivity(text);
          // cópia de conflito ("<id> (1).md") nunca é resolvida sozinha
          if (name !== `${a.id}.md`) throw new Error(`O nome do arquivo precisa ser ${a.id}.md`);
          activities.push({ ...a, rev: await hashText(text) });
        } catch (e) {
          problems.push({ file: `activities/${name}`, message: (e as Error).message });
        }
      }
    }
    let assignees: Assignee[] = [];
    const raw = await readText(this.root, 'assignees.json');
    if (raw !== null) {
      try {
        assignees = assigneesSchema.parse(JSON.parse(raw)).items;
      } catch {
        problems.push({ file: 'assignees.json', message: 'Formato inválido; nenhum responsável carregado.' });
      }
    }
    problems.sort((a, b) => a.file.localeCompare(b.file));
    return { activities, assignees, systemPrompt: await readSystemPrompt(this.root), problems };
  }

  updateSystemPrompt(rev: string, text: string): Promise<SystemPrompt> {
    return this.mutate(async () => {
      if (text.length > DESCRIPTION_MAX) throw new Error('System prompt grande demais (máximo de 100 mil caracteres).');
      if ((await readSystemPrompt(this.root)).rev !== rev) throw new ConflictError();
      const body = text.replace(/\r\n/g, '\n');
      await writeText(this.root, SYSTEM_PROMPT_FILE, body ? body + '\n' : '');
      return readSystemPrompt(this.root);
    });
  }

  private async read(dir: DirLike, id: string, rev: string): Promise<{ activity: Activity; text: string }> {
    const text = await readText(dir, `${id}.md`);
    if (text === null || (await hashText(text)) !== rev) throw new ConflictError();
    return { activity: parseActivity(text), text };
  }

  create(parent: string | null, title: string): Promise<StoredActivity> {
    return this.mutate(async () => {
      const dir = await this.activitiesDir();
      if (parent && (await readText(dir, `${parent}.md`)) === null) throw new ConflictError();
      const activity: Activity = {
        id: crypto.randomUUID(), title: titleSchema.parse(title), parent, assignee: null,
        createdAt: new Date().toISOString(), description: '', extra: {},
      };
      const text = serializeActivity(activity);
      await writeText(dir, `${activity.id}.md`, text);
      return { ...activity, rev: await hashText(text) };
    });
  }

  update(id: string, rev: string, patch: Patch): Promise<StoredActivity> {
    return this.mutate(async () => {
      if (patch.description !== undefined && patch.description.length > DESCRIPTION_MAX) {
        throw new Error('Descrição grande demais (máximo de 100 mil caracteres).');
      }
      const dir = await this.activitiesDir();
      const { activity } = await this.read(dir, id, rev);
      const next = { ...activity, ...patch };
      if (patch.title !== undefined) next.title = titleSchema.parse(patch.title);
      const text = serializeActivity(next);
      await writeText(dir, `${id}.md`, text);
      return { ...parseActivity(text), rev: await hashText(text) };
    });
  }

  /** Muda o pai e/ou a posição. `before` é o irmão que vem depois (null = no fim). */
  move(id: string, rev: string, parent: string | null, before: string | null): Promise<void> {
    return this.mutate(async () => {
      const dir = await this.activitiesDir();
      await this.read(dir, id, rev);
      for (const { id: target, ...patch } of planMove((await this.load()).activities, id, parent, before)) {
        const text = await readText(dir, `${target}.md`);
        if (text === null) throw new ConflictError();
        await writeText(dir, `${target}.md`, serializeActivity({ ...parseActivity(text), ...patch }));
      }
    });
  }

  remove(id: string, rev: string, includeChildren: boolean): Promise<string[]> {
    return this.mutate(async () => {
      const dir = await this.activitiesDir();
      await this.read(dir, id, rev);
      const subtree = subtreeLeavesFirst((await this.load()).activities, id);
      if (subtree.length > 1 && !includeChildren) throw new HasChildrenError(subtree.length - 1);

      // primeiro copia tudo para a lixeira; só então apaga, das folhas para o nó
      const meta = await this.root.getDirectoryHandle('.plans', { create: true });
      const trash = await meta.getDirectoryHandle('trash', { create: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const bin = await trash.getDirectoryHandle(`${stamp}-${id.slice(0, 8)}`, { create: true });
      for (const a of subtree) await writeText(bin, `${a.id}.md`, (await readText(dir, `${a.id}.md`)) ?? serializeActivity(a));
      await writeText(bin, 'manifest.json', json({ removedAt: new Date().toISOString(), root: id, ids: subtree.map((a) => a.id) }));
      for (const a of subtree) await dir.removeEntry(`${a.id}.md`);
      return subtree.map((a) => a.id);
    });
  }

  async loadUi(): Promise<UiState> {
    try {
      const text = await readText(await this.root.getDirectoryHandle('.plans'), 'ui.json');
      return uiSchema.parse(JSON.parse(text ?? '{}'));
    } catch {
      return uiSchema.parse({});
    }
  }

  async saveUi(ui: UiState): Promise<void> {
    if (this.readOnly) return;
    await this.mutate(async () => writeText(await this.root.getDirectoryHandle('.plans', { create: true }), 'ui.json', json(ui)));
  }

  private runsDir() {
    return this.root.getDirectoryHandle('runs', { create: !this.readOnly });
  }

  async saveRun(record: RunRecord, log: string): Promise<void> {
    await this.mutate(async () => {
      const dir = await this.runsDir();
      await writeText(dir, `${record.runId}.log`, log);
      await writeText(dir, `${record.runId}.json`, json(record));
    });
  }

  async loadRuns(): Promise<RunRecord[]> {
    const out: RunRecord[] = [];
    try {
      for await (const [name, handle] of (await this.root.getDirectoryHandle('runs')).entries()) {
        if (handle.kind !== 'file' || !name.endsWith('.json')) continue;
        try {
          out.push(runRecordSchema.parse(JSON.parse(await (await handle.getFile()).text())));
        } catch {
          // registro ilegível: ignora na lista, mantém o arquivo
        }
      }
    } catch (e) {
      if (!isNotFound(e)) throw e;
    }
    return out.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  async readLog(runId: string): Promise<string> {
    try {
      return (await readText(await this.root.getDirectoryHandle('runs'), `${runId}.log`)) ?? '';
    } catch (e) {
      if (isNotFound(e)) return '';
      throw e;
    }
  }
}

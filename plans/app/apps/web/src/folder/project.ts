// Leitura e gravação do projeto na pasta. É o único lugar que toca nos arquivos do Plans.
import {
  assigneesSchema, DEFAULT_ASSIGNEES, DESCRIPTION_MAX, parseActivity, projectSchema, runRecordSchema, SCHEMA_VERSION,
  orderKey, planMove, serializeActivity, SYSTEM_PROMPT_FILE, subtreeLeavesFirst, titleSchema, uiSchema,
  ATTACHMENTS_DIR, COMMENT_MAX, COMMENTS_DIR, parseComment, safeFileName, serializeComment, SIDES,
  labelNameSchema, labelSchema, LABELS_FILE, labelsSchema, newLabelId, sameLabelName,
  type Activity, type Assignee, type Comment, type Label, type LabelColor, type Priority, type Project, type RunRecord, type Side, type Status, type UiState,
} from '@plans/domain';
import type { DirLike } from './types.ts';

export type StoredActivity = Activity & { rev: string };
export type Problem = { file: string; message: string };
export type Patch = { title?: string; createdAt?: string; assignee?: string | null; description?: string; status?: Status; /** presente e `undefined` = tirar a prioridade */ priority?: Priority | undefined; /** presente e `undefined` = tirar a data de entrega */ dueDate?: string | undefined; labels?: string[] };
/** Instruções padrão de todas as atividades. Sem arquivo, o texto é vazio. */
export type SystemPrompt = { text: string; rev: string };
export type Snapshot = { activities: StoredActivity[]; assignees: Assignee[]; labels: Label[]; systemPrompt: SystemPrompt; problems: Problem[] };
export type Attachment = { name: string; size: number };
export type StoredComment = Comment & { file: string };
/** O que acompanha uma atividade além da descrição: lido só quando ela é aberta. */
export type ActivityFiles = { input: Attachment[]; output: Attachment[]; comments: StoredComment[] };

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
async function writeFile(dir: DirLike, name: string, data: string | Blob): Promise<void> {
  const w = await (await dir.getFileHandle(name, { create: true })).createWritable();
  try {
    await w.write(data);
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

/** Catálogo de etiquetas. Sem arquivo, vazio; com formato inválido, falha (nunca é sobrescrito). */
async function readLabels(root: DirLike): Promise<Label[]> {
  const raw = await readText(root, LABELS_FILE);
  if (raw === null) return [];
  try {
    return labelsSchema.parse(JSON.parse(raw)).items;
  } catch {
    throw new Error(`${LABELS_FILE} está com formato inválido. Nada foi alterado.`);
  }
}

/** Nome limpo e ainda não usado por outra etiqueta. */
function freeLabelName(labels: Label[], name: string, own?: string): string {
  const parsed = labelNameSchema.safeParse(name);
  if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
  if (labels.some((l) => l.id !== own && sameLabelName(l.name, parsed.data))) throw new Error(`Já existe a etiqueta “${parsed.data}”.`);
  return parsed.data;
}

/** Subpasta pelo caminho, ou null se algum trecho não existe. */
async function findDir(dir: DirLike, ...path: string[]): Promise<DirLike | null> {
  try {
    for (const name of path) dir = await dir.getDirectoryHandle(name);
    return dir;
  } catch (e) {
    if (isNotFound(e)) return null;
    throw e;
  }
}

async function makeDir(dir: DirLike, ...path: string[]): Promise<DirLike> {
  for (const name of path) dir = await dir.getDirectoryHandle(name, { create: true });
  return dir;
}

/** Arquivos visíveis da pasta (ignora ocultos e os temporários de gravação do navegador). */
async function listFiles(dir: DirLike | null) {
  const out: { name: string; file: Blob & { readonly lastModified?: number } }[] = [];
  if (!dir) return out;
  for await (const [name, handle] of dir.entries()) {
    if (handle.kind === 'file' && !name.startsWith('.') && !name.endsWith('.crswap')) out.push({ name, file: await handle.getFile() });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { numeric: true }));
}

async function copyDir(from: DirLike, to: DirLike): Promise<void> {
  for await (const [name, handle] of from.entries()) {
    if (handle.kind === 'file') await writeFile(to, name, await handle.getFile());
    else await copyDir(handle, await makeDir(to, name));
  }
}

async function sameBytes(a: Blob, b: Blob): Promise<boolean> {
  if (a.size !== b.size) return false;
  const [x, y] = [new Uint8Array(await a.arrayBuffer()), new Uint8Array(await b.arrayBuffer())];
  return x.every((v, i) => v === y[i]);
}

/** "foto.png", "foto (2).png"…: um anexo novo nunca sobrescreve outro. */
async function freeName(dir: DirLike, name: string): Promise<string> {
  const dot = name.lastIndexOf('.');
  const [stem, ext] = dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, ''];
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? name : `${stem} (${n})${ext}`;
    try {
      await dir.getFileHandle(candidate); // no disco do macOS e do Windows, maiúsculas não diferenciam
    } catch (e) {
      if (isNotFound(e)) return candidate;
      if ((e as Error).name !== 'TypeMismatchError') throw e; // pasta com o mesmo nome: tenta o próximo
    }
  }
}

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
  await writeFile(meta, '.gitignore', 'ui.json\n');
  await writeFile(runs, '.gitignore', '*\n');
  if ((await readText(root, 'assignees.json')) === null) {
    await writeFile(root, 'assignees.json', json({ version: 1, items: DEFAULT_ASSIGNEES }));
  }
  // vazio até a pessoa escrever: a referência de cada atividade já aponta para um arquivo que existe
  if ((await readText(root, SYSTEM_PROMPT_FILE)) === null) await writeFile(root, SYSTEM_PROMPT_FILE, '');
  await writeFile(meta, 'project.json', json(project)); // por último: marca a pasta como projeto
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
    let labels: Label[] = [];
    try {
      labels = await readLabels(this.root);
    } catch (e) {
      problems.push({ file: LABELS_FILE, message: (e as Error).message });
    }
    problems.sort((a, b) => a.file.localeCompare(b.file));
    return { activities, assignees, labels, systemPrompt: await readSystemPrompt(this.root), problems };
  }

  private writeLabels(items: Label[]): Promise<void> {
    return writeFile(this.root, LABELS_FILE, json({ version: 1, items }));
  }

  addLabel(name: string, color: LabelColor): Promise<Label> {
    return this.mutate(async () => {
      const labels = await readLabels(this.root);
      const free = freeLabelName(labels, name);
      const label = labelSchema.parse({ id: newLabelId(free, labels.map((l) => l.id)), name: free, color });
      await this.writeLabels([...labels, label]);
      return label;
    });
  }

  /** Renomeia ou troca a cor. O id fica, então nenhum cartão muda. */
  updateLabel(id: string, patch: { name?: string; color?: LabelColor }): Promise<void> {
    return this.mutate(async () => {
      const labels = await readLabels(this.root);
      const current = labels.find((l) => l.id === id);
      if (!current) throw new ConflictError();
      const next = labelSchema.parse({ ...current, ...patch, ...(patch.name === undefined ? {} : { name: freeLabelName(labels, patch.name, id) }) });
      await this.writeLabels(labels.map((l) => (l.id === id ? next : l)));
    });
  }

  /** Tira a etiqueta do catálogo e dos cartões que a usam; o que muda é copiado antes para a lixeira. */
  removeLabel(id: string): Promise<void> {
    return this.mutate(async () => {
      const labels = await readLabels(this.root);
      if (!labels.some((l) => l.id === id)) return; // já removida fora daqui
      const dir = await this.activitiesDir();
      const used = (await this.load()).activities.filter((a) => a.labels?.includes(id));
      const bin = await this.trashBin(`etiqueta-${id.slice(0, 20)}`);
      await writeFile(bin, LABELS_FILE, (await readText(this.root, LABELS_FILE))!);
      for (const a of used) {
        const text = await readText(dir, `${a.id}.md`);
        if (text === null) continue;
        await writeFile(await makeDir(bin, 'activities'), `${a.id}.md`, text);
        const activity = parseActivity(text);
        const next = { ...activity, labels: activity.labels?.filter((l) => l !== id) ?? [] };
        await writeFile(dir, `${a.id}.md`, serializeActivity(await this.withPromptSnapshot(next)));
      }
      await this.writeLabels(labels.filter((l) => l.id !== id)); // por último: se algo falhar, dá para repetir
    });
  }

  updateSystemPrompt(rev: string, text: string): Promise<SystemPrompt> {
    return this.mutate(async () => {
      if (text.length > DESCRIPTION_MAX) throw new Error('System prompt grande demais (máximo de 100 mil caracteres).');
      if ((await readSystemPrompt(this.root)).rev !== rev) throw new ConflictError();
      const body = text.replace(/\r\n/g, '\n');
      await writeFile(this.root, SYSTEM_PROMPT_FILE, body ? body + '\n' : '');
      return readSystemPrompt(this.root);
    });
  }

  private async read(dir: DirLike, id: string, rev: string): Promise<{ activity: Activity; text: string }> {
    const text = await readText(dir, `${id}.md`);
    if (text === null || (await hashText(text)) !== rev) throw new ConflictError();
    return { activity: parseActivity(text), text };
  }

  /** Garante snapshot do system prompt no cartão: preserva o que já estava; legado recebe o atual. */
  private async withPromptSnapshot(activity: Activity): Promise<Activity> {
    if (activity.systemPromptText !== undefined) return activity;
    return { ...activity, systemPromptText: (await readSystemPrompt(this.root)).text };
  }

  create(parent: string | null, title: string): Promise<StoredActivity> {
    return this.mutate(async () => {
      const dir = await this.activitiesDir();
      if (parent && (await readText(dir, `${parent}.md`)) === null) throw new ConflictError();
      const activity: Activity = {
        id: crypto.randomUUID(), title: titleSchema.parse(title), parent, assignee: null,
        createdAt: new Date().toISOString(), description: '',
        systemPromptText: (await readSystemPrompt(this.root)).text, extra: {},
      };
      const text = serializeActivity(activity);
      await writeFile(dir, `${activity.id}.md`, text);
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
      const next = await this.withPromptSnapshot({ ...activity, ...patch });
      // sem `order`, a data de criação dá a posição entre os irmãos: mudar a data não pode mover o cartão
      if (patch.createdAt !== undefined && next.order === undefined) next.order = orderKey(activity);
      if (patch.title !== undefined) next.title = titleSchema.parse(patch.title);
      const text = serializeActivity(next);
      // relido antes de gravar: um valor inválido não pode estragar o arquivo
      const saved = parseActivity(text);
      await writeFile(dir, `${id}.md`, text);
      return { ...saved, rev: await hashText(text) };
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
        await writeFile(dir, `${target}.md`, serializeActivity(await this.withPromptSnapshot({ ...parseActivity(text), ...patch })));
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
      const bin = await this.trashBin(id.slice(0, 8));
      const extras: { parent: DirLike; id: string }[] = [];
      for (const a of subtree) {
        await writeFile(bin, `${a.id}.md`, (await readText(dir, `${a.id}.md`)) ?? serializeActivity(a));
        for (const folder of [ATTACHMENTS_DIR, COMMENTS_DIR]) {
          const parent = await findDir(this.root, folder);
          const own = parent && (await findDir(parent, a.id));
          if (!parent || !own) continue;
          await copyDir(own, await makeDir(bin, folder, a.id));
          extras.push({ parent, id: a.id });
        }
      }
      await writeFile(bin, 'manifest.json', json({ removedAt: new Date().toISOString(), root: id, ids: subtree.map((a) => a.id) }));
      for (const a of subtree) await dir.removeEntry(`${a.id}.md`);
      for (const extra of extras) await extra.parent.removeEntry(extra.id, { recursive: true });
      return subtree.map((a) => a.id);
    });
  }

  private async trashBin(label: string): Promise<DirLike> {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    return makeDir(this.root, '.plans', 'trash', `${stamp}-${label}`);
  }

  /** Move um arquivo para a lixeira, repetindo lá o caminho que ele tinha no projeto. */
  private async discard(path: string[], name: string): Promise<void> {
    const dir = await findDir(this.root, ...path);
    if (!dir) return;
    let file: Blob;
    try {
      file = await (await dir.getFileHandle(name)).getFile();
    } catch (e) {
      if (isNotFound(e)) return; // já removido fora daqui
      throw e;
    }
    await writeFile(await makeDir(await this.trashBin(path[1]!.slice(0, 8)), ...path), name, file);
    await dir.removeEntry(name);
  }

  private async requireActivity(id: string): Promise<void> {
    if ((await readText(await this.activitiesDir(), `${id}.md`)) === null) throw new ConflictError();
  }

  async loadFiles(id: string): Promise<ActivityFiles> {
    const [input, output] = await Promise.all(
      SIDES.map(async (side) => (await listFiles(await findDir(this.root, ATTACHMENTS_DIR, id, side))).map(({ name, file }) => ({ name, size: file.size }))),
    );
    const comments: StoredComment[] = [];
    for (const { name, file } of await listFiles(await findDir(this.root, COMMENTS_DIR, id))) {
      if (!name.toLowerCase().endsWith('.md')) continue;
      comments.push({ ...parseComment(await file.text(), new Date(file.lastModified ?? 0).toISOString()), file: name });
    }
    comments.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.file.localeCompare(b.file));
    return { input: input!, output: output!, comments };
  }

  /** Copia o arquivo para a pasta da atividade e devolve o nome com que ficou. */
  addAttachment(id: string, side: Side, name: string, data: Blob): Promise<string> {
    return this.mutate(async () => {
      await this.requireActivity(id);
      const dir = await makeDir(this.root, ATTACHMENTS_DIR, id, side);
      const target = await freeName(dir, safeFileName(name));
      try {
        await writeFile(dir, target, data);
      } catch (e) {
        await dir.removeEntry(target).catch(() => {}); // não deixa um arquivo vazio para trás
        throw e;
      }
      return target;
    });
  }

  async readAttachment(id: string, side: Side, name: string): Promise<Blob> {
    const dir = await findDir(this.root, ATTACHMENTS_DIR, id, side);
    if (!dir) throw new ConflictError();
    try {
      return await (await dir.getFileHandle(name)).getFile();
    } catch (e) {
      if (isNotFound(e)) throw new ConflictError();
      throw e;
    }
  }

  /** Grava por cima de um anexo, só se ele ainda for o que foi lido; a versão anterior vai para a lixeira. */
  saveAttachment(id: string, side: Side, name: string, previous: Blob, data: Blob): Promise<void> {
    return this.mutate(async () => {
      await this.requireActivity(id);
      const current = await this.readAttachment(id, side, name);
      if (!(await sameBytes(current, previous))) throw new ConflictError();
      await writeFile(await makeDir(await this.trashBin(id.slice(0, 8)), ATTACHMENTS_DIR, id, side), name, current);
      await writeFile(await makeDir(this.root, ATTACHMENTS_DIR, id, side), name, data);
    });
  }

  removeAttachment(id: string, side: Side, name: string): Promise<void> {
    return this.mutate(() => this.discard([ATTACHMENTS_DIR, id, side], name));
  }

  addComment(id: string, author: string | null, text: string): Promise<void> {
    return this.mutate(async () => {
      const body = text.trim();
      if (!body) throw new Error('Escreva o comentário.');
      if (body.length > COMMENT_MAX) throw new Error('Comentário grande demais (máximo de 100 mil caracteres).');
      await this.requireActivity(id);
      const createdAt = new Date().toISOString();
      const name = `${createdAt.replace(/[:.]/g, '-')}-${crypto.randomUUID().slice(0, 8)}.md`;
      await writeFile(await makeDir(this.root, COMMENTS_DIR, id), name, serializeComment({ author, createdAt, text: body }));
    });
  }

  removeComment(id: string, file: string): Promise<void> {
    return this.mutate(() => this.discard([COMMENTS_DIR, id], file));
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
    await this.mutate(async () => writeFile(await this.root.getDirectoryHandle('.plans', { create: true }), 'ui.json', json(ui)));
  }

  private runsDir() {
    return this.root.getDirectoryHandle('runs', { create: !this.readOnly });
  }

  async saveRun(record: RunRecord, log: string): Promise<void> {
    await this.mutate(async () => {
      const dir = await this.runsDir();
      await writeFile(dir, `${record.runId}.log`, log);
      await writeFile(dir, `${record.runId}.json`, json(record));
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

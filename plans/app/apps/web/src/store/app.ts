// Estado da tela em memória (useSyncExternalStore). A verdade está sempre nos arquivos.
import { useSyncExternalStore } from 'react';
import { buildTree, type LabelColor, type Side, type Status, type TreeNode, type UiState } from '@plans/domain';
import { decodePairingCode, encodePairingCode, newSecret, type Command } from '@plans/protocol';
import { buildCardContext } from '../ai/context.ts';
import { aiReady, generateDescription } from '../ai/describe.ts';
import { createHubLink, type HubLink, type LinkState } from '../connection/hub.ts';
import { matches, NO_FILTERS, type Filters } from '../features/filters.ts';
import { askPermission, demoFolder, demoName, hasPermission, kv, pickFolder, supportsFolders } from '../folder/handles.ts';
import { ConflictError, HasChildrenError, initFolder, inspectFolder, ProjectStore, type Patch, type Snapshot } from '../folder/project.ts';
import type { DirLike } from '../folder/types.ts';
import { createRunner, type Runner, type RunView } from '../runs/runner.ts';
import { applyTheme, isTheme, paintedTheme, type ThemeId } from '../ui/themes.ts';

export const HUB_URL: string =
  import.meta.env.VITE_HUB_URL ?? (import.meta.env.DEV ? 'ws://localhost:4780/ws' : `wss://${location.host}/ws`);

export type Pairing = { code: string; path: string };
export type State = {
  phase: 'loading' | 'unsupported' | 'welcome' | 'permission' | 'confirm-init' | 'open';
  folderName: string;
  folderEmpty: boolean;
  readOnly: boolean;
  snapshot: Snapshot;
  tree: TreeNode[];
  selected: string | null;
  /** o cartão selecionado está aberto em tela cheia */
  opened: boolean;
  /** nós minimizados: os filhos ficam escondidos */
  collapsed: string[];
  theme: ThemeId;
  /** painel lateral (configurações do projeto e comandos) aberto */
  panel: boolean;
  descriptionMode: UiState['descriptionMode'];
  systemPromptMode: UiState['systemPromptMode'];
  /** visão na área principal */
  view: UiState['view'];
  /** filtro das atividades; fica só na memória: reabrir a página mostra tudo */
  filters: Filters;
  /** nó sendo criado: pai ou 'root' */
  creating: string | null;
  removing: { id: string; count: number } | null;
  /** cartões cuja descrição a IA está escrevendo */
  describing: string[];
  runs: RunView[];
  link: LinkState;
  pairing: Pairing | null;
  pairingOpen: boolean;
  error: string | null;
};

const empty: Snapshot = { activities: [], assignees: [], labels: [], systemPrompt: { text: '', rev: '' }, problems: [] };
let state: State = {
  phase: 'loading', folderName: '', folderEmpty: true, readOnly: false, snapshot: empty, tree: [], selected: null, opened: false, collapsed: [], theme: paintedTheme(), panel: true, descriptionMode: 'read', systemPromptMode: 'read', view: 'tree', filters: NO_FILTERS,
  creating: null, removing: null, describing: [], runs: [], link: { state: 'unpaired' }, pairing: null, pairingOpen: false, error: null,
};
const listeners = new Set<() => void>();
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};
export const useApp = () =>
  useSyncExternalStore((l) => (listeners.add(l), () => void listeners.delete(l)), () => state);

let handle: FileSystemDirectoryHandle | null = null;
let store: ProjectStore | null = null;
let runner: Runner | null = null;
let link: HubLink | null = null;
let channel: BroadcastChannel | null = null;
let stopWatching = () => {};

export function fail(e: unknown) {
  console.error(e);
  set({ error: e instanceof Error ? e.message : String(e) });
}
export const dismissError = () => set({ error: null });

const asDir = (h: FileSystemDirectoryHandle) => h as unknown as DirLike;

export async function boot() {
  applyTheme(state.theme);
  try {
    if (demoName !== null) return await openFolder(await demoFolder(demoName));
    if (!supportsFolders) return set({ phase: 'unsupported' });
    const saved = await kv.get<FileSystemDirectoryHandle>('folder');
    if (!saved) return set({ phase: 'welcome' });
    handle = saved;
    if (!(await hasPermission(saved))) return set({ phase: 'permission', folderName: saved.name });
    await openFolder(saved);
  } catch (e) {
    set({ phase: 'welcome' });
    fail(e);
  }
}

export async function chooseFolder() {
  try {
    await openFolder(await pickFolder());
  } catch (e) {
    if ((e as Error).name !== 'AbortError') fail(e);
  }
}

export async function reopen() {
  try {
    if (handle && (await askPermission(handle))) await openFolder(handle);
  } catch (e) {
    fail(e);
  }
}

async function openFolder(h: FileSystemDirectoryHandle) {
  close();
  handle = h;
  const found = await inspectFolder(asDir(h));
  if (found.state === 'invalid') {
    set({ phase: 'welcome' });
    return fail(new Error(found.message));
  }
  if (found.state === 'new') return set({ phase: 'confirm-init', folderName: h.name, folderEmpty: found.empty });
  if (demoName === null) await kv.set('folder', h);
  store = new ProjectStore(asDir(h), found.project);
  const ui = await store.loadUi();
  runner = createRunner({ store, send: (m) => link?.send(m) ?? false, onChange: (runs) => set({ runs }), onError: fail });
  // projeto sem tema salvo mantém o que já está na tela
  const theme = isTheme(ui.theme) ? ui.theme : state.theme;
  applyTheme(theme);
  set({ phase: 'open', folderName: found.project.name, readOnly: store.readOnly, opened: false, selected: ui.selected, collapsed: ui.collapsed, theme, panel: ui.panel, descriptionMode: ui.descriptionMode, systemPromptMode: ui.systemPromptMode, view: ui.view, filters: NO_FILTERS, error: null });
  await refresh();
  await runner.reload();
  watch(h, found.project.id);
  const pairing = (await kv.get<Pairing>(`pairing:${found.project.id}`)) ?? null;
  set({ pairing });
  connect();
}

export async function confirmInit() {
  try {
    if (!handle) return;
    await initFolder(asDir(handle));
    await openFolder(handle);
  } catch (e) {
    fail(e);
  }
}

function close() {
  [...describingJobs.keys()].forEach(cancelDescribe);
  stopWatching();
  stopWatching = () => {};
  link?.stop();
  runner?.dispose();
  channel?.close();
  link = null;
  runner = null;
  store = null;
  channel = null;
}

export async function closeFolder() {
  close();
  await kv.del('folder');
  if (demoName !== null) location.search = '';
  set({ phase: 'welcome', snapshot: empty, tree: [], runs: [], selected: null, opened: false, collapsed: [], pairing: null, pairingOpen: false, link: { state: 'unpaired' }, filters: NO_FILTERS });
}

let refreshing: Promise<void> | null = null;
let again = false;
/** Relê a pasta. Pedidos durante uma leitura geram só mais uma. */
export function refresh(): Promise<void> {
  if (refreshing) {
    again = true;
    return refreshing;
  }
  refreshing = (async () => {
    do {
      again = false;
      const current = store;
      if (!current) return;
      const snapshot = await current.load();
      if (current !== store) return;
      const exists = snapshot.activities.some((a) => a.id === state.selected);
      set({ snapshot, tree: buildTree(snapshot.activities), selected: exists ? state.selected : null, opened: exists && state.opened });
    } while (again);
  })()
    .catch(fail)
    .finally(() => (refreshing = null));
  return refreshing;
}

type Observer = { observe: (h: unknown, o: object) => Promise<void>; disconnect: () => void };

function watch(h: FileSystemDirectoryHandle, projectId: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const soon = () => {
    clearTimeout(timer);
    timer = setTimeout(() => void refresh().then(() => runner?.reload()), 250);
  };
  channel = new BroadcastChannel(`plans:${projectId}`);
  channel.onmessage = soon;
  const onVisible = () => document.visibilityState === 'visible' && soon();
  window.addEventListener('focus', soon);
  document.addEventListener('visibilitychange', onVisible);
  // experimental: quando existe, edições externas aparecem sem trocar de janela
  const Observe = (window as unknown as { FileSystemObserver?: new (cb: (records: { relativePathComponents: string[] }[]) => void) => Observer }).FileSystemObserver;
  let observer: Observer | null = null;
  if (Observe) {
    observer = new Observe((records) => {
      // gravações das execuções e do estado da tela não mudam a árvore
      if (records.some((r) => !['runs', '.plans'].includes(r.relativePathComponents[0] ?? ''))) soon();
    });
    observer.observe(h, { recursive: true }).catch((e) => console.warn('sem observação de arquivos', e));
  }
  stopWatching = () => {
    clearTimeout(timer);
    window.removeEventListener('focus', soon);
    document.removeEventListener('visibilitychange', onVisible);
    observer?.disconnect();
  };
}

async function changed() {
  await refresh();
  channel?.postMessage('changed');
}

const saveUi = () => void store?.saveUi({ selected: state.selected, collapsed: state.collapsed, theme: state.theme, panel: state.panel, descriptionMode: state.descriptionMode, systemPromptMode: state.systemPromptMode, view: state.view }).catch(fail);

export function chooseView(view: UiState['view']) {
  set({ view, creating: null });
  saveUi();
}

/** Muda um ou mais critérios; os demais continuam. Se o cartão selecionado ficar de fora, a seleção sai. */
export function setFilters(patch: Partial<Filters>) {
  const filters = { ...state.filters, ...patch };
  const selected = state.snapshot.activities.find((a) => a.id === state.selected);
  const hidden = !!selected && !matches(selected, filters);
  set({ filters, creating: null, ...(hidden ? { selected: null, opened: false } : {}) });
  if (hidden) saveUi();
}
export const clearFilters = () => set({ filters: NO_FILTERS });

export function setSystemPromptMode(systemPromptMode: UiState['systemPromptMode']) {
  set({ systemPromptMode });
  saveUi();
}

/** Configurações do projeto: o painel sem atividade selecionada. */
export function openSettings() {
  set({ selected: null, opened: false, creating: null, panel: true });
  saveUi();
}

export function togglePanel() {
  set({ panel: !state.panel });
  saveUi();
}

export function chooseTheme(theme: ThemeId) {
  applyTheme(theme);
  set({ theme });
  saveUi();
}

/** Só destaca o cartão (teclado, cartão recém-criado ou movido). */
export function select(id: string | null) {
  set({ selected: id, opened: false, creating: null });
  saveUi();
}

/** Abre o cartão em tela cheia. */
export function openCard(id: string) {
  set({ selected: id, opened: true, creating: null });
  saveUi();
}
/** Volta à árvore ou ao Kanban; o cartão continua selecionado. */
export const closeCard = () => set({ opened: false });
/** Minimiza ou expande o ramo. `hidden` são os descendentes: se o selecionado sumir, a seleção sobe. */
export function toggleCollapse(id: string, hidden: string[]) {
  const closing = !state.collapsed.includes(id);
  const exists = new Set(state.snapshot.activities.map((a) => a.id));
  const collapsed = (closing ? [...state.collapsed, id] : state.collapsed.filter((c) => c !== id)).filter((c) => exists.has(c));
  const selected = closing && state.selected && hidden.includes(state.selected) ? id : state.selected;
  set({ collapsed, selected, creating: null });
  saveUi();
}
/** Minimiza todos os níveis de uma vez; a seleção sobe para a raiz que continua à vista. */
export function minimizeAll() {
  const all: string[] = [];
  let selected = state.selected;
  const walk = (n: TreeNode, root: string) => {
    if (n.children.length) all.push(n.activity.id);
    if (n.activity.id === state.selected) selected = root;
    n.children.forEach((c) => walk(c, root));
  };
  state.tree.forEach((r) => walk(r, r.activity.id));
  set({ collapsed: all, selected, creating: null });
  saveUi();
}
export function expandAll() {
  set({ collapsed: [], creating: null });
  saveUi();
}
export function startCreate(parent: string | null) {
  // criar filho num nó minimizado abre o ramo
  if (parent && state.collapsed.includes(parent)) toggleCollapse(parent, []);
  set({ creating: parent ?? 'root' });
}
export const cancelCreate = () => set({ creating: null });

export async function createNode(parent: string | null, title: string) {
  try {
    const node = await store!.create(parent, title);
    set({ creating: null });
    const ai = await aiReady().catch(() => false);
    await changed();
    // antes de selecionar: o painel já abre esperando o texto
    if (ai) void autoDescribe(node.id);
    select(node.id);
  } catch (e) {
    fail(e);
    await refresh();
  }
}

export async function askRemove(id: string) {
  const node = state.snapshot.activities.find((a) => a.id === id);
  if (!node || state.readOnly) return;
  try {
    await store!.remove(id, node.rev, false);
    await changed();
  } catch (e) {
    if (e instanceof HasChildrenError) return set({ removing: { id, count: e.count } });
    fail(e);
    await refresh();
  }
}
export const cancelRemove = () => set({ removing: null });
export async function confirmRemove() {
  const node = state.snapshot.activities.find((a) => a.id === state.removing?.id);
  set({ removing: null });
  if (!node) return;
  try {
    await store!.remove(node.id, node.rev, true);
    await changed();
  } catch (e) {
    fail(e);
    await refresh();
  }
}

/** Uma alteração por vez: a seguinte já enxerga a revisão que a anterior gravou. */
let writing: Promise<unknown> = Promise.resolve();
function queued<T>(fn: () => Promise<T>): Promise<T> {
  const next = writing.then(fn);
  writing = next.catch(() => {});
  return next;
}

/** Devolve a nova revisão, ou 'conflict'. */
export const updateNode = (id: string, rev: string, patch: Patch) => queued(() => writeNode(id, rev, patch));

/** Devolve a nova revisão, ou 'conflict'. */
export const updateSystemPrompt = (rev: string, text: string) =>
  queued(async (): Promise<string | 'conflict' | null> => {
    try {
      const next = await store!.updateSystemPrompt(rev, text);
      await changed();
      return next.rev;
    } catch (e) {
      await refresh();
      if (e instanceof ConflictError) return 'conflict';
      fail(e);
      return null;
    }
  });

/** Muda um campo a partir da versão que estiver na tela quando chegar a vez. */
async function writeCurrent(id: string, patch: Patch, conflictMessage: string) {
  const node = state.snapshot.activities.find((a) => a.id === id);
  if (node && !state.readOnly && (await writeNode(id, node.rev, patch)) === 'conflict') fail(new Error(conflictMessage));
}
export const setStatus = (id: string, status: Status) => queued(() => writeCurrent(id, { status }, 'O arquivo mudou fora desta tela. Escolha o status de novo.'));

async function writeNode(id: string, rev: string, patch: Patch): Promise<string | 'conflict' | null> {
  try {
    const node = await store!.update(id, rev, patch);
    await changed();
    return node.rev;
  } catch (e) {
    await refresh();
    if (e instanceof ConflictError) return 'conflict';
    fail(e);
    return null;
  }
}

/** `from` é o título quando a edição começou: se mudou fora daqui, não sobrescreve. */
export function renameNode(id: string, from: string, title: string) {
  const next = title.trim();
  if (!next || next === from) return Promise.resolve();
  const message = 'O arquivo mudou fora desta tela. Renomeie de novo.';
  return queued(async () => {
    const node = state.snapshot.activities.find((a) => a.id === id);
    if (node && node.title !== from) return fail(new Error(message));
    await writeCurrent(id, { title: next }, message);
  });
}

/** Arrastar e soltar: novo pai e posição. */
export async function moveNode(id: string, parent: string | null, before: string | null) {
  const node = state.snapshot.activities.find((a) => a.id === id);
  if (!node || state.readOnly) return;
  try {
    await store!.move(id, node.rev, parent, before);
    // soltar dentro de um nó minimizado abre o ramo, para o resultado aparecer
    if (parent && state.collapsed.includes(parent)) toggleCollapse(parent, []);
    await changed();
    select(id);
  } catch (e) {
    fail(e);
    await refresh();
  }
}

// ---------- etiquetas ----------
/** Marca ou desmarca a partir do que o cartão tiver quando chegar a vez. */
export const toggleLabel = (id: string, rev: string, labelId: string) =>
  queued(() => {
    const own = state.snapshot.activities.find((a) => a.id === id)?.labels ?? [];
    return writeNode(id, rev, { labels: own.includes(labelId) ? own.filter((l) => l !== labelId) : [...own, labelId] });
  });
// na mesma fila dos cartões: remover uma etiqueta regrava os arquivos que a usam
export const addLabel = (name: string, color: LabelColor) => queued(() => saveFiles((s) => s.addLabel(name, color)));
export const updateLabel = (id: string, patch: { name?: string; color?: LabelColor }) => queued(() => saveFiles((s) => s.updateLabel(id, patch)));
export const removeLabel = (id: string) => queued(() => saveFiles((s) => s.removeLabel(id)));

// ---------- anexos e comentários ----------
export const loadFiles = (id: string) => store!.loadFiles(id);
export const readAttachment = (id: string, side: Side, name: string) => store!.readAttachment(id, side, name);

/** Grava, mostra a falha se houver e relê a pasta. Devolve se deu certo. */
async function saveFiles(write: (s: ProjectStore) => Promise<unknown>): Promise<boolean> {
  try {
    await write(store!);
    return true;
  } catch (e) {
    fail(e);
    return false;
  } finally {
    await changed();
  }
}
export const addAttachments = (id: string, side: Side, files: File[]) =>
  saveFiles(async (s) => {
    for (const file of files) await s.addAttachment(id, side, file.name, file);
  });
export const removeAttachment = (id: string, side: Side, name: string) => saveFiles((s) => s.removeAttachment(id, side, name));
// o editor de planilha mostra as falhas dentro da própria janela: por isso elas sobem
export const saveAttachment = (id: string, side: Side, name: string, previous: Blob, data: Blob) =>
  store!.saveAttachment(id, side, name, previous, data).finally(changed);
/** Anexo novo (nunca sobrescreve); devolve o nome com que ficou. */
export const addAttachmentCopy = (id: string, side: Side, name: string, data: Blob) => store!.addAttachment(id, side, name, data).finally(changed);
export const addComment = (id: string, text: string) =>
  // quem escreve na tela é a primeira pessoa do catálogo
  saveFiles((s) => s.addComment(id, state.snapshot.assignees.find((a) => a.type === 'person')?.id ?? null, text));
export const removeComment = (id: string, file: string) => saveFiles((s) => s.removeComment(id, file));

/** Tudo o que o cartão sabe, para regenerar a descrição: espera o que está sendo salvo e relê a pasta. */
export async function loadCardContext(id: string) {
  await writing;
  await refresh();
  const current = store!;
  const files = await current.loadFiles(id);
  return buildCardContext(state.snapshot, id, files, (side, name, owner) => current.readAttachment(owner, side, name), (parent) => current.loadFiles(parent));
}
/** Troca a descrição só se ela ainda for `from`, o texto que a IA leu. Devolve se trocou. */
export const replaceDescription = (id: string, from: string, description: string) =>
  queued(async () => {
    const node = state.snapshot.activities.find((a) => a.id === id);
    if (!node || state.readOnly || node.description !== from) return false;
    const result = await writeNode(id, node.rev, { description });
    return result !== null && result !== 'conflict';
  });

// ---------- descrição automática ----------
const describingJobs = new Map<string, AbortController>();
const showDescribing = () => set({ describing: [...describingJobs.keys()] });

/** Cartão recém-criado: a IA escreve a descrição a partir do título e do contexto. Só preenche se continuar vazia. */
async function autoDescribe(id: string) {
  const job = new AbortController();
  describingJobs.set(id, job);
  showDescribing();
  try {
    const context = await loadCardContext(id);
    if (context.description.trim() || job.signal.aborted) return;
    const text = await generateDescription(context, job.signal);
    if (!job.signal.aborted) await replaceDescription(id, context.description, text);
  } catch (e) {
    // cartão removido ou pasta trocada no meio do caminho: não há o que avisar
    if (!job.signal.aborted && state.snapshot.activities.some((a) => a.id === id)) fail(new Error(`Descrição automática: ${(e as Error).message}`));
  } finally {
    if (describingJobs.get(id) === job) cancelDescribe(id);
  }
}
/** Para de esperar a IA: a descrição fica como está. */
export function cancelDescribe(id: string) {
  describingJobs.get(id)?.abort();
  if (describingJobs.delete(id)) showDescribing();
}

// ---------- client ----------
function connect() {
  link?.stop();
  link = null;
  if (!store || !state.pairing) return set({ link: { state: 'unpaired' } });
  link = createHubLink({
    url: HUB_URL,
    secret: decodePairingCode(state.pairing.code),
    projectId: store.project.id,
    onState: (s) => {
      set({ link: s });
      if (s.state === 'ready') void runner?.onReady();
    },
    onMessage: (m) => runner?.onMessage(m),
  });
}

export async function openPairing(open: boolean) {
  set({ pairingOpen: open });
  if (open && !state.pairing) await newPairing();
}
export async function newPairing() {
  if (!store) return;
  const pairing = { code: encodePairingCode(newSecret()), path: state.pairing?.path ?? '' };
  await kv.set(`pairing:${store.project.id}`, pairing);
  set({ pairing });
  connect();
}
export async function setPairingPath(path: string) {
  if (!store || !state.pairing) return;
  const pairing = { ...state.pairing, path };
  set({ pairing });
  await kv.set(`pairing:${store.project.id}`, pairing);
}

export const runCommand = (nodeId: string | null, command: Command) => runner?.start(nodeId, command).catch(fail);
export const cancelRun = (runId: string) => runner?.cancel(runId);

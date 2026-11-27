// Estado da tela em memória (useSyncExternalStore). A verdade está sempre nos arquivos.
import { useSyncExternalStore } from 'react';
import { buildTree, type TreeNode } from '@plans/domain';
import { decodePairingCode, encodePairingCode, newSecret, type Command } from '@plans/protocol';
import { createHubLink, type HubLink, type LinkState } from '../connection/hub.ts';
import { askPermission, demoFolder, demoName, hasPermission, kv, pickFolder, supportsFolders } from '../folder/handles.ts';
import { ConflictError, HasChildrenError, initFolder, inspectFolder, ProjectStore, type Snapshot } from '../folder/project.ts';
import type { DirLike } from '../folder/types.ts';
import { createRunner, type Runner, type RunView } from '../runs/runner.ts';

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
  /** nó sendo criado: pai ou 'root' */
  creating: string | null;
  removing: { id: string; count: number } | null;
  runs: RunView[];
  link: LinkState;
  pairing: Pairing | null;
  pairingOpen: boolean;
  error: string | null;
};

const empty: Snapshot = { activities: [], assignees: [], problems: [] };
let state: State = {
  phase: 'loading', folderName: '', folderEmpty: true, readOnly: false, snapshot: empty, tree: [], selected: null,
  creating: null, removing: null, runs: [], link: { state: 'unpaired' }, pairing: null, pairingOpen: false, error: null,
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
  set({ phase: 'open', folderName: found.project.name, readOnly: store.readOnly, selected: ui.selected, error: null });
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
  set({ phase: 'welcome', snapshot: empty, tree: [], runs: [], selected: null, pairing: null, pairingOpen: false, link: { state: 'unpaired' } });
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
      set({ snapshot, tree: buildTree(snapshot.activities), selected: exists ? state.selected : null });
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

export function select(id: string | null) {
  set({ selected: id, creating: null });
  store?.saveUi({ selected: id }).catch(fail);
}
export const startCreate = (parent: string | null) => set({ creating: parent ?? 'root' });
export const cancelCreate = () => set({ creating: null });

export async function createNode(parent: string | null, title: string) {
  try {
    const node = await store!.create(parent, title);
    set({ creating: null });
    await changed();
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

/** Devolve a nova revisão, ou 'conflict'. */
export async function updateNode(id: string, rev: string, patch: { assignee?: string | null; description?: string }): Promise<string | 'conflict' | null> {
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

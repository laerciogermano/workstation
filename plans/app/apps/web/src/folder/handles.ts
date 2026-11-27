// O navegador guarda só o atalho da pasta e a chave de pareamento (IndexedDB). Nenhum dado do projeto.
const DB = 'plans';
const STORE = 'kv';

function request<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(STORE);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction(STORE, mode);
      const r = fn(tx.objectStore(STORE));
      tx.oncomplete = () => (db.close(), resolve(r.result));
      tx.onabort = tx.onerror = () => (db.close(), reject(tx.error));
    };
  });
}

export const kv = {
  get: <T>(key: string) => request<T | undefined>('readonly', (s) => s.get(key)),
  set: (key: string, value: unknown) => request('readwrite', (s) => s.put(value, key)),
  del: (key: string) => request('readwrite', (s) => s.delete(key)),
};

type PermissionedHandle = FileSystemDirectoryHandle & {
  queryPermission?: (o: { mode: 'readwrite' }) => Promise<PermissionState>;
  requestPermission?: (o: { mode: 'readwrite' }) => Promise<PermissionState>;
};

export const demoName = new URLSearchParams(location.search).get('demo');
export const supportsFolders = 'showDirectoryPicker' in window;

export async function pickFolder(): Promise<FileSystemDirectoryHandle> {
  const picker = (window as unknown as { showDirectoryPicker: (o: object) => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker;
  return picker({ id: 'plans', mode: 'readwrite' });
}

/** Pasta de demonstração no armazenamento privado do navegador (?demo): para experimentar e testar. */
export async function demoFolder(name: string): Promise<FileSystemDirectoryHandle> {
  const base = await navigator.storage.getDirectory();
  return base.getDirectoryHandle(`demo-${name || 'projeto'}`, { create: true });
}

export const hasPermission = async (h: PermissionedHandle) => !h.queryPermission || (await h.queryPermission({ mode: 'readwrite' })) === 'granted';
/** Precisa ser chamado a partir de um clique. */
export const askPermission = async (h: PermissionedHandle) => !h.requestPermission || (await h.requestPermission({ mode: 'readwrite' })) === 'granted';

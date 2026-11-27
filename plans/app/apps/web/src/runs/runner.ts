// Execuções: pede ao client, junta a saída em ordem e grava em runs/. Uma aba é "dona" de cada execução.
import { isOpenRun, type RunRecord } from '@plans/domain';
import type { Command, Message, MessageOf } from '@plans/protocol';
import type { ProjectStore } from '../folder/project.ts';

export type Chunk = { stream: 'stdout' | 'stderr'; data: string };
export type RunView = { record: RunRecord; output: Chunk[] };

type Owned = { record: RunRecord; output: Chunk[]; next: number; asked: boolean; release: () => void; timer?: ReturnType<typeof setTimeout> };

export type RunnerOptions = {
  store: Pick<ProjectStore, 'saveRun' | 'loadRuns' | 'readLog' | 'readOnly'>;
  send: (m: Message) => boolean;
  onChange: (runs: RunView[]) => void;
  onError?: (e: unknown) => void;
  /** Garante um dono por execução entre abas. Devolve null se outra aba já é dona. */
  claim?: (runId: string) => Promise<(() => void) | null>;
  flushMs?: number;
};

export async function claimWithWebLocks(runId: string): Promise<(() => void) | null> {
  if (!navigator.locks) return () => {};
  return new Promise((resolve) => {
    void navigator.locks.request(`plans-run:${runId}`, { ifAvailable: true }, (lock) => {
      if (!lock) return resolve(null);
      return new Promise<void>((done) => resolve(done));
    });
  });
}

export function createRunner({ store, send, onChange, onError = console.error, claim = claimWithWebLocks, flushMs = 1000 }: RunnerOptions) {
  const owned = new Map<string, Owned>();
  let saved: RunView[] = [];
  /** execuções abertas no disco quando pedimos a lista: só elas podem ser dadas como perdidas */
  let listing: Set<string> | null = null;
  let queue: Promise<unknown> = Promise.resolve();

  const emit = () => {
    const byId = new Map(saved.map((r) => [r.record.runId, r]));
    for (const o of owned.values()) byId.set(o.record.runId, { record: { ...o.record }, output: [...o.output] });
    onChange([...byId.values()].sort((a, b) => b.record.startedAt.localeCompare(a.record.startedAt)));
  };
  const logOf = (o: Owned) => o.output.map((c) => c.data).join('');
  const persist = (record: RunRecord, log: string) => (store.readOnly ? Promise.resolve() : store.saveRun(record, log));

  async function reload() {
    const records = await store.loadRuns();
    saved = await Promise.all(
      records.slice(0, 30).map(async (record) => ({ record, output: [{ stream: 'stdout' as const, data: await store.readLog(record.runId) }] })),
    );
    emit();
  }

  function schedule(o: Owned) {
    o.timer ??= setTimeout(() => {
      o.timer = undefined;
      if (owned.has(o.record.runId)) serial(() => persist(o.record, logOf(o)));
    }, flushMs);
  }

  /** Gravações e tratamento de mensagens em fila, para manter a ordem. */
  function serial<T>(fn: () => Promise<T>): Promise<T | void> {
    const next = queue.then(fn).catch(onError);
    queue = next;
    return next;
  }

  async function finish(o: Owned, patch: Partial<RunRecord>) {
    clearTimeout(o.timer);
    Object.assign(o.record, patch, { endedAt: new Date().toISOString() });
    await persist(o.record, logOf(o));
    // só confirma depois de gravado: se a gravação falhar, o client guarda e reenvia
    send({ type: 'exec.ack', runId: o.record.runId });
    owned.delete(o.record.runId);
    saved = [{ record: o.record, output: o.output }, ...saved.filter((r) => r.record.runId !== o.record.runId)];
    o.release();
    emit();
  }

  function resume(o: Owned) {
    if (o.asked) return;
    o.asked = true;
    send({ type: 'exec.resume', runId: o.record.runId, fromChunk: o.next });
  }

  async function onRuns({ runs }: MessageOf<'exec.runs'>) {
    if (!listing) return; // a lista foi pedida por outra aba
    const before = listing;
    listing = null;
    const disk = new Map((await store.loadRuns()).map((r) => [r.runId, r]));
    for (const info of runs) {
      const mine = owned.get(info.runId);
      if (mine) {
        mine.asked = false;
        resume(mine);
        continue;
      }
      const record = disk.get(info.runId);
      if (record && !isOpenRun(record)) {
        send({ type: 'exec.ack', runId: info.runId });
        continue;
      }
      const release = await claim(info.runId);
      if (!release) continue;
      const { status: _, ...rest } = info;
      const o: Owned = {
        record: record ?? { ...rest, nodeId: info.nodeId ?? null, status: 'running', code: null, truncated: false, endedAt: null },
        output: [], next: 0, asked: false, release,
      };
      owned.set(info.runId, o);
      resume(o);
    }
    const listed = new Set(runs.map((r) => r.runId));
    for (const id of before) {
      if (listed.has(id)) continue;
      const o = owned.get(id);
      if (o) {
        await finish(o, { status: 'lost' });
        continue;
      }
      const record = disk.get(id);
      const release = record && isOpenRun(record) ? await claim(id) : null;
      if (!record || !release) continue;
      await persist({ ...record, status: 'lost', endedAt: new Date().toISOString() }, await store.readLog(id));
      release();
    }
    await reload();
  }

  async function handle(m: Message) {
    if (m.type === 'exec.runs') return onRuns(m);
    if (!('runId' in m)) return;
    const o = owned.get(m.runId);
    if (!o) return;
    switch (m.type) {
      case 'exec.pending':
        o.record.status = 'waiting';
        break;
      case 'exec.started':
        o.record.status = 'running';
        break;
      case 'exec.output':
        if (m.n < o.next) return;
        if (m.n > o.next) return resume(o);
        o.output.push({ stream: m.stream, data: m.data });
        o.next++;
        o.asked = false;
        o.record.status = 'running';
        break;
      case 'exec.exit': {
        if (o.next < m.chunks) {
          o.asked = false;
          return resume(o);
        }
        const status = m.reason === 'exit' ? (m.code === 0 ? 'ok' : 'failed') : m.reason === 'error' ? 'failed' : m.reason;
        return finish(o, { status, code: m.code >= 0 ? m.code : null, truncated: m.truncated, error: m.error });
      }
      case 'exec.rejected':
        return finish(o, { status: 'rejected', error: m.reason, allowCommand: m.allowCommand });
      default:
        return;
    }
    schedule(o);
    emit();
  }

  return {
    reload: () => serial(reload),
    onMessage: (m: Message) => void serial(() => handle(m)),
    /** Chamado quando o client fica pronto. */
    onReady: () =>
      serial(async () => {
        const open = (await store.loadRuns()).filter(isOpenRun).map((r) => r.runId);
        listing = new Set([...open, ...owned.keys()]);
        send({ type: 'exec.list' });
      }),
    async start(nodeId: string | null, command: Command): Promise<void> {
      const runId = crypto.randomUUID();
      const release = (await claim(runId)) ?? (() => {});
      const record: RunRecord = { ...command, runId, nodeId, status: 'pending', code: null, truncated: false, startedAt: new Date().toISOString(), endedAt: null };
      owned.set(runId, { record, output: [], next: 0, asked: false, release });
      await serial(() => persist(record, ''));
      if (!send({ type: 'exec.start', runId, nodeId: nodeId ?? undefined, ...command })) {
        const o = owned.get(runId)!;
        await serial(() => finish(o, { status: 'rejected', error: 'Client desconectado.' }));
      }
      emit();
    },
    cancel: (runId: string) => void send({ type: 'exec.cancel', runId }),
    /** Aguarda a fila (testes). */
    idle: () => queue,
    dispose() {
      for (const o of owned.values()) {
        clearTimeout(o.timer);
        o.release();
      }
      owned.clear();
    },
  };
}
export type Runner = ReturnType<typeof createRunner>;

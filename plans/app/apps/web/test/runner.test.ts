import type { Message } from '@plans/protocol';
import { describe, expect, it } from 'vitest';
import { initFolder, ProjectStore } from '../src/folder/project.ts';
import { createRunner, type RunView } from '../src/runs/runner.ts';
import { MemDir } from './memory.ts';

async function setup() {
  const root = new MemDir();
  const store = new ProjectStore(root, await initFolder(root));
  const sent: Message[] = [];
  let runs: RunView[] = [];
  const make = () =>
    createRunner({ store, send: (m) => (sent.push(m), true), onChange: (r) => (runs = r), claim: async () => () => {}, flushMs: 1 });
  const runner = make();
  const last = () => sent.at(-1)!;
  return { store, runner, make, sent, last, view: () => runs };
}
const out = (runId: string, n: number, data: string): Message => ({ type: 'exec.output', runId, n, stream: 'stdout', data });
const exit = (runId: string, chunks: number, code = 0): Message => ({ type: 'exec.exit', runId, reason: 'exit', code, chunks, durationMs: 1, truncated: false });

describe('execuções', () => {
  it('junta a saída em ordem, pede o que faltou e só confirma depois de gravar', async () => {
    const t = await setup();
    await t.runner.start('no-1', { program: 'echo', args: ['oi'] });
    const { runId } = t.last() as { runId: string; type: string };
    t.runner.onMessage(out(runId, 0, 'a'));
    t.runner.onMessage(out(runId, 2, 'c')); // faltou o 1
    await t.runner.idle();
    expect(t.last()).toEqual({ type: 'exec.resume', runId, fromChunk: 1 });
    t.runner.onMessage(out(runId, 1, 'b'));
    t.runner.onMessage(out(runId, 2, 'c'));
    t.runner.onMessage(out(runId, 2, 'c')); // repetido
    t.runner.onMessage(exit(runId, 3));
    await t.runner.idle();
    expect(t.last()).toEqual({ type: 'exec.ack', runId });
    expect(await t.store.readLog(runId)).toBe('abc');
    expect((await t.store.loadRuns())[0]).toMatchObject({ status: 'ok', code: 0, nodeId: 'no-1' });
  });

  it('recupera numa aba nova o que ficou aberto e marca como perdido o que o client não conhece', async () => {
    const t = await setup();
    await t.runner.start(null, { program: 'a' });
    const kept = (t.last() as { runId: string }).runId;
    await t.runner.start(null, { program: 'b' });
    const gone = (t.last() as { runId: string }).runId;
    t.runner.dispose();

    const next = t.make();
    await next.onReady();
    expect(t.last()).toEqual({ type: 'exec.list' });
    next.onMessage({ type: 'exec.runs', runs: [{ runId: kept, status: 'done', startedAt: new Date().toISOString(), program: 'a' }] });
    await next.idle();
    expect(t.sent).toContainEqual({ type: 'exec.resume', runId: kept, fromChunk: 0 });
    next.onMessage(out(kept, 0, 'saída'));
    next.onMessage(exit(kept, 1, 2));
    await next.idle();
    const records = Object.fromEntries((await t.store.loadRuns()).map((r) => [r.runId, r.status]));
    expect(records).toEqual({ [kept]: 'failed', [gone]: 'lost' });
    expect(await t.store.readLog(kept)).toBe('saída');
  });

  it('registra a recusa com o comando para liberar', async () => {
    const t = await setup();
    await t.runner.start(null, { program: 'rm', args: ['x'] });
    const { runId } = t.last() as { runId: string; type: string };
    t.runner.onMessage({ type: 'exec.rejected', runId, reason: 'não liberado', allowCommand: 'plans-client allow -- rm x' });
    await t.runner.idle();
    expect((await t.store.loadRuns())[0]).toMatchObject({ status: 'rejected', allowCommand: 'plans-client allow -- rm x' });
    expect(t.view()[0]!.record.status).toBe('rejected');
  });
});

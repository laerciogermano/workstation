// "plans-client run" num terminal de verdade (via expect): perguntar uma vez, sempre e negar.
import { spawn, execFileSync, type ChildProcess } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { WebSocket } from 'ws';
import { createHub } from '../apps/hub/src/hub.ts';
import { createHubLink, type LinkState } from '../apps/web/src/connection/hub.ts';
import { encodePairingCode, newSecret, type Message } from '../packages/protocol/src/index.ts';

const root = path.resolve(import.meta.dirname, '..');
const bin = path.join(root, 'bin/plans-client');
const work = mkdtempSync(path.join(tmpdir(), 'plans-tty-'));
const env = { ...process.env, PLANS_CONFIG_DIR: path.join(work, 'config') };
const projectId = crypto.randomUUID();
mkdirSync(path.join(work, 'p/.plans'), { recursive: true });
writeFileSync(path.join(work, 'p/.plans/project.json'), JSON.stringify({ schemaVersion: 1, id: projectId, name: 'tty' }));

const origin = 'http://localhost:5280';
const hub = createHub({ allowedOrigins: [origin] });
const url = `ws://127.0.0.1:${await hub.listen(0, '127.0.0.1')}/ws`;
const secret = newSecret();
execFileSync(bin, ['pair', encodePairingCode(secret), '--dir', path.join(work, 'p'), '--hub', url], { env });

const inbox: Message[] = [];
let state: LinkState = { state: 'connecting' };
const link = createHubLink({
  url, secret, projectId, onState: (s) => (state = s), onMessage: (m) => inbox.push(m),
  createSocket: (u) => new WebSocket(u, { origin }) as unknown as globalThis.WebSocket,
});

let client: ChildProcess | undefined;
let log = '';
try {
  client = spawn('expect', ['-c', `
    set timeout 30
    spawn ${bin} run
    foreach answer {u s n} {
      expect "negar (padr"
      send "$answer\\r"
    }
    expect eof
  `], { env, detached: true });
  client.stdout!.on('data', (d) => (log += d));
  const until = async (fn: () => boolean, what: string) => {
    for (let i = 0; i < 600 && !fn(); i++) await new Promise((r) => setTimeout(r, 25));
    assert.ok(fn(), what);
  };
  await until(() => state.state === 'ready', 'client conectado');

  const ask = async (word: string) => {
    const runId = crypto.randomUUID();
    inbox.length = 0;
    link.send({ type: 'exec.start', runId, program: 'echo', args: [word] });
    await until(() => inbox.some((m) => m.type === 'exec.exit' || m.type === 'exec.rejected'), `resposta para ${word}`);
    return inbox.map((m) => m.type);
  };
  assert.deepEqual(await ask('uma'), ['exec.pending', 'exec.started', 'exec.output', 'exec.exit']);
  console.log('✓ "uma vez" executa');
  assert.ok((await ask('uma')).includes('exec.pending'), '"uma vez" não pode liberar');
  console.log('✓ a próxima pergunta de novo; "sempre" executa');
  assert.deepEqual(await ask('uma'), ['exec.started', 'exec.output', 'exec.exit']);
  console.log('✓ depois de "sempre" não pergunta mais');
  assert.deepEqual(await ask('outra'), ['exec.pending', 'exec.rejected']);
  console.log('✓ "negar" recusa');
} catch (e) {
  console.error(e, '\n--- terminal ---\n' + log);
  process.exitCode = 1;
} finally {
  link.stop();
  if (client?.pid) try { process.kill(-client.pid, 'SIGKILL'); } catch { /* já saiu */ }
  await hub.close();
  rmSync(work, { recursive: true, force: true });
}

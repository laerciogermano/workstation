#!/usr/bin/env node
/**
 * agent-worker — pull uniforme (servidor ou gestor).
 *
 * Single (1 AVD):
 *   AGENT_ID=<agentes.id uuid> AGENT_API_KEY=… SERIAL=127.0.0.1:5560 npm start
 *   (path ainda aceita nome legado; enroll devolve agentId=uuid)
 *
 * Host supervisor (N slots, rodízio de AVDs):
 *   MODE=host HOST_KEY=localhost AGENT_API_KEY=… npm run start:host
 *
 *   DRY=1 · ONCE=1 · ALLOW_STUB=1 · SKIP_DOCKER=1 · IDLE_BEFORE_SLEEP=2
 */
import { execFileSync } from 'node:child_process';
import { hostname, totalmem } from 'node:os';
import { createApiClient } from './api.mjs';
import { runAgentCycle } from './agent-cycle.mjs';

function hostRamGb() {
  const fromEnv = Number(process.env.HOST_RAM_GB);
  if (Number.isFinite(fromEnv) && fromEnv >= 1) return Math.floor(fromEnv);
  return Math.max(1, Math.round(totalmem() / 1024 ** 3));
}

/** Disco total do volume raiz (GB). Override: HOST_DISK_GB. */
function hostDiskGb() {
  const fromEnv = Number(process.env.HOST_DISK_GB);
  if (Number.isFinite(fromEnv) && fromEnv >= 1) return Math.floor(fromEnv);
  try {
    const out = execFileSync('df', ['-k', '/'], {
      encoding: 'utf8',
      timeout: 5_000,
    });
    const line = out.trim().split('\n')[1];
    if (!line) return undefined;
    const parts = line.split(/\s+/);
    const kb = Number(parts[1]);
    if (!Number.isFinite(kb) || kb < 1) return undefined;
    return Math.max(1, Math.round(kb / 1024 / 1024));
  } catch {
    return undefined;
  }
}

const MODE = (process.env.MODE || 'single').toLowerCase();

if (MODE === 'host') {
  const { runSupervisor } = await import('./supervisor.mjs');
  await runSupervisor();
  process.exit(0);
}

const API_URL = (process.env.API_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
);
const AGENT_ID_ENV = process.env.AGENT_ID || 'agent-d';
/** agentId canônico (uuid) após enroll; até lá usa o env. */
let AGENT_ID = AGENT_ID_ENV;
const API_KEY = process.env.AGENT_API_KEY || '';
const DRY = process.env.DRY === '1';
const ONCE = process.env.ONCE === '1';
const SLEEP_MS = Number(process.env.SLEEP_MS || 15_000);
const HEARTBEAT_MS = Number(process.env.HEARTBEAT_MS || 60_000);
const WORKER_VERSION = process.env.WORKER_VERSION || '0.1.0';
const HOST_INSTANCE_ID =
  process.env.HOST_INSTANCE_ID || `${hostname()}:${process.pid}`;
const SERIAL = process.env.SERIAL || process.env.ADB_SERIAL || '';
const CONTAINER =
  process.env.CONTAINER_NAME ||
  process.env.AVD_CONTAINER ||
  '';
const ADB_PORT = process.env.ADB_PORT ? Number(process.env.ADB_PORT) : undefined;
const HOST_KIND = (process.env.HOST_KIND || 'localhost').toLowerCase();
const HOST_NOME = process.env.HOST_NOME || process.env.HOST_KEY || '';

const api = createApiClient({ apiUrl: API_URL, apiKey: API_KEY });

async function enroll() {
  try {
    const body = {
      hostInstanceId: HOST_INSTANCE_ID,
      workerVersion: WORKER_VERSION,
      hostKind: ['server', 'gestor', 'localhost'].includes(HOST_KIND)
        ? HOST_KIND
        : 'localhost',
      localhost: HOST_KIND === 'localhost',
      status: 'ativo',
    };
    if (SERIAL) body.serial = SERIAL;
    if (CONTAINER) body.containerName = CONTAINER;
    if (Number.isFinite(ADB_PORT) && ADB_PORT > 0) body.adbPort = ADB_PORT;
    if (HOST_NOME) body.hostNome = HOST_NOME;
    body.ramGb = hostRamGb();
    const diskGb = hostDiskGb();
    if (diskGb) body.diskGb = diskGb;
    const res = await api.enroll(AGENT_ID_ENV, body);
    if (res?.agentId) AGENT_ID = res.agentId;
    console.log(
      `[${AGENT_ID}] enroll created=${res.created ? 1 : 0} needsLinkedin=${res.needsLinkedin ? 1 : 0} online=${res.online ? 1 : 0}`,
    );
    if (res.apiKey) {
      console.warn(
        `[${AGENT_ID}] API key scoped (salve uma vez; depois use como AGENT_API_KEY):\n${res.apiKey}`,
      );
    }
    if (res.needsLinkedin) {
      console.warn(
        `[${AGENT_ID}] falta LinkedIn — complete no painel /agentes`,
      );
    }
    return res;
  } catch (e) {
    console.error(`[${AGENT_ID}] enroll:`, e.message || e);
    return null;
  }
}

async function heartbeat() {
  try {
    await api.heartbeat(AGENT_ID, {
      hostInstanceId: HOST_INSTANCE_ID,
      workerVersion: WORKER_VERSION,
    });
  } catch (e) {
    console.error(`[${AGENT_ID}] heartbeat:`, e.message || e);
  }
}

async function main() {
  if (!API_KEY) {
    console.warn(
      '[agent-worker] AGENT_API_KEY vazio — use chave do agente ou AGENT_API_KEY global',
    );
  }
  console.log(
    `agent-worker API=${API_URL} AGENT=${AGENT_ID_ENV} DRY=${DRY ? 1 : 0} SERIAL=${SERIAL || '(env)'}`,
  );
  await enroll();
  console.log(`agent-worker agentId canônico=${AGENT_ID}`);
  const hb = setInterval(heartbeat, HEARTBEAT_MS);

  try {
    for (;;) {
      try {
        await runAgentCycle(api, {
          agentId: AGENT_ID,
          serial: SERIAL,
          apiUrl: API_URL,
          apiKey: API_KEY,
          dry: DRY,
        });
      } catch (e) {
        console.error(`[${AGENT_ID}] erro:`, e.message || e);
      }
      if (ONCE) break;
      await new Promise((r) => setTimeout(r, SLEEP_MS));
    }
  } finally {
    clearInterval(hb);
  }
}

main();

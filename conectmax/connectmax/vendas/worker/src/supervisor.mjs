/**
 * Supervisor de host: máx. N slots; troca AVD assim que o agente esgota a fila.
 *
 *   MODE=host HOST_KEY=localhost AGENT_API_KEY=… npm run start:host
 *
 * Após cada claim/complete (ou idle):
 *   - se ainda há pending no agente → próximo claim na hora (drena a fila)
 *   - se pending=0 e há candidatosWake → sleep + wake do próximo na hora
 *   - se ninguém pra acordar → libera o loop do slot; SLEEP_MS só entre turnos ociosos
 *
 * Env: HOST_KEY, MAX_SLOTS, SKIP_DOCKER, DRY, ONCE, SLEEP_MS,
 *      MAX_JOBS_PER_SLOT (default 20 — teto de claims seguidos no mesmo AVD por turno)
 */
import { hostname } from 'node:os';
import { createApiClient } from './api.mjs';
import { runAgentCycle } from './agent-cycle.mjs';
import { dockerStart, dockerStop } from './docker-local.mjs';

const API_URL = (process.env.API_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
);
const API_KEY = process.env.AGENT_API_KEY || '';
const HOST_KEY = process.env.HOST_KEY || 'localhost';
const DRY = process.env.DRY === '1';
const ONCE = process.env.ONCE === '1';
const SLEEP_MS = Number(process.env.SLEEP_MS || 15_000);
const MAX_JOBS_PER_SLOT = Number(process.env.MAX_JOBS_PER_SLOT || 20);
const WORKER_VERSION = process.env.WORKER_VERSION || '0.1.0-host';
const HOST_INSTANCE_ID =
  process.env.HOST_INSTANCE_ID || `host:${hostname()}:${process.pid}`;

const api = createApiClient({ apiUrl: API_URL, apiKey: API_KEY });

/** Serializa wake/sleep entre slots paralelos. */
let rotateLock = Promise.resolve();
function withRotateLock(fn) {
  const run = rotateLock.then(fn, fn);
  rotateLock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function wakeAgent(a) {
  console.log(
    `[host] wake ${a.agentId} (${a.containerName}) pending=${a.pendingJobs}`,
  );
  await dockerStart(a.containerName);
  await api.setDeviceStatus(a.agentId, 'ativo');
}

async function sleepAgent(a) {
  console.log(`[host] sleep ${a.agentId} (${a.containerName})`);
  await dockerStop(a.containerName);
  await api.setDeviceStatus(a.agentId, 'dormindo');
}

async function fetchHost() {
  const data = await api.slots(HOST_KEY);
  const host =
    data.hosts.find((h) => h.hostKey === HOST_KEY) || data.hosts[0];
  if (!host) {
    throw new Error(`nenhum host em slots p/ HOST_KEY=${HOST_KEY}`);
  }
  const maxSlots = Number(process.env.MAX_SLOTS) || data.maxAtivos || 4;
  return { host, maxSlots };
}

async function fillSlots(host, maxSlots) {
  let livres = Math.max(0, maxSlots - host.agentesAtivos.length);
  for (const next of host.candidatosWake) {
    if (livres <= 0) break;
    try {
      await wakeAgent(next);
      livres -= 1;
    } catch (e) {
      console.error(`[host] wake fail ${next.agentId}:`, e.message || e);
    }
  }
}

async function heartbeat(agentId) {
  try {
    await api.heartbeat(agentId, {
      hostInstanceId: HOST_INSTANCE_ID,
      workerVersion: WORKER_VERSION,
    });
  } catch (e) {
    console.error(`[${agentId}] heartbeat:`, e.message || e);
  }
}

/**
 * Após esvaziar a fila do agente atual: cede o slot ao melhor candidatoWake.
 * @returns {Promise<object|null>} novo agente no slot, ou null se não trocou
 */
async function rotateAfterEmpty(currentAgentId) {
  return withRotateLock(async () => {
    const { host } = await fetchHost();
    const me = host.agentesAtivos.find((a) => a.agentId === currentAgentId);
    if (!me) return null;
    if (me.pendingJobs > 0) return me;

    const next = host.candidatosWake[0];
    if (!next) return null;
    if (next.agentId === currentAgentId) return me;

    await sleepAgent(me);
    await wakeAgent(next);
    console.log(`[host] slot ${currentAgentId} → ${next.agentId} (on empty)`);
    return next;
  });
}

/**
 * Um slot: drena jobs do AVD; ao esvaziar, troca na hora se houver candidato.
 */
async function runSlot(initial) {
  let current = initial;
  let jobs = 0;

  while (jobs < MAX_JOBS_PER_SLOT) {
    await heartbeat(current.agentId);

    let worked = false;
    try {
      worked = await runAgentCycle(api, {
        agentId: current.agentId,
        serial: current.serial,
        apiUrl: API_URL,
        apiKey: API_KEY,
        dry: DRY,
      });
    } catch (e) {
      console.error(`[${current.agentId}] ciclo:`, e.message || e);
    }
    jobs += 1;

    const { host } = await fetchHost();
    const me = host.agentesAtivos.find((a) => a.agentId === current.agentId);

    if (me && me.pendingJobs > 0) {
      current = me;
      continue;
    }

    // Sem pending (ou sumiu dos ativos): tenta ceder o slot na hora
    const swapped = await rotateAfterEmpty(current.agentId);
    if (swapped && swapped.agentId !== current.agentId) {
      current = swapped;
      jobs = 0;
      continue;
    }

    // Idle sem candidato — encerra este slot neste turno
    if (!worked) {
      console.log(`[${current.agentId}] slot idle sem wake — pausa turno`);
    }
    break;
  }
}

async function turn() {
  let { host, maxSlots } = await fetchHost();
  await fillSlots(host, maxSlots);
  ({ host, maxSlots } = await fetchHost());

  console.log(
    `[host] ${host.hostKey} ativos=${host.ativos}/${maxSlots} wake=${host.candidatosWake.length} sleepCand=${host.candidatosSleep.length}`,
  );

  if (!host.agentesAtivos.length) {
    return;
  }

  await Promise.all(host.agentesAtivos.map((a) => runSlot(a)));
}

export async function runSupervisor() {
  if (!API_KEY) {
    console.warn(
      '[host] AGENT_API_KEY vazio — use chave global (service) no supervisor',
    );
  }
  console.log(
    `agent-supervisor API=${API_URL} HOST_KEY=${HOST_KEY} DRY=${DRY ? 1 : 0} rotate=on-empty MAX_JOBS_PER_SLOT=${MAX_JOBS_PER_SLOT}`,
  );

  for (;;) {
    try {
      await turn();
    } catch (e) {
      console.error('[host] erro:', e.message || e);
    }
    if (ONCE) break;
    await new Promise((r) => setTimeout(r, SLEEP_MS));
  }
}

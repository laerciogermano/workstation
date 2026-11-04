#!/usr/bin/env node
/**
 * agent-worker — pull uniforme (servidor ou gestor).
 *
 * Single (1 AVD):
 *   AGENT_ID=<agentes.id uuid> AGENT_API_KEY=… SERIAL=127.0.0.1:5560 npm start
 *   (path ainda aceita nome legado; enroll devolve agentId=uuid)
 *
 * Single (Chrome CDP):
 *   WORKER_RUNTIME=cdp AGENT_ID=… AGENT_API_KEY=… CDP_ID=daniela-hoffmann npm start
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
import { isCdpRuntime } from './handlers/index.mjs';
import { createLogger, fmtDuration } from './log.mjs';

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
const CDP_ID = String(process.env.CDP_ID || '').trim();
const CDP_URL = String(process.env.CDP_URL || '').trim();
const CDP = isCdpRuntime();
const CONTAINER =
  process.env.CONTAINER_NAME ||
  process.env.AVD_CONTAINER ||
  '';
const ADB_PORT = process.env.ADB_PORT ? Number(process.env.ADB_PORT) : undefined;
const HOST_KIND = (process.env.HOST_KIND || 'localhost').toLowerCase();
const HOST_NOME = process.env.HOST_NOME || process.env.HOST_KEY || '';

const api = createApiClient({ apiUrl: API_URL, apiKey: API_KEY });
let log = createLogger(AGENT_ID_ENV);

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
    else if (CDP && CDP_ID) body.serial = `cdp:${CDP_ID}`;
    if (CONTAINER) body.containerName = CONTAINER;
    else if (CDP && CDP_ID) body.containerName = `cdp-${CDP_ID}`;
    if (Number.isFinite(ADB_PORT) && ADB_PORT > 0) body.adbPort = ADB_PORT;
    if (HOST_NOME) body.hostNome = HOST_NOME;
    body.ramGb = hostRamGb();
    const diskGb = hostDiskGb();
    if (diskGb) body.diskGb = diskGb;
    log.info('cadastrando/atualizando agente na API (enroll)…');
    const res = await api.enroll(AGENT_ID_ENV, body);
    if (res?.agentId) AGENT_ID = res.agentId;
    log = createLogger(AGENT_ID);
    const created = res.created ? 'conta nova' : 'já existia';
    const li = res.needsLinkedin
      ? 'faltam dados LinkedIn no painel'
      : 'LinkedIn ok';
    const on = res.online ? 'online' : 'offline';
    log.info(`enroll OK (${created}) · ${li} · ${on}`);
    if (res.apiKey) {
      log.warn(
        `API key do agente (salve uma vez; depois use como AGENT_API_KEY):\n${res.apiKey}`,
      );
    }
    if (res.needsLinkedin) {
      log.warn('complete o LinkedIn em /agentes antes de rodar jobs de verdade');
    }
    return res;
  } catch (e) {
    log.error(`enroll falhou: ${e.message || e}`);
    return null;
  }
}

async function heartbeat() {
  try {
    await api.heartbeat(AGENT_ID, {
      hostInstanceId: HOST_INSTANCE_ID,
      workerVersion: WORKER_VERSION,
    });
    log.debug(
      `heartbeat OK (próximo em ${fmtDuration(HEARTBEAT_MS)}; diz à API que estou vivo)`,
    );
  } catch (e) {
    log.error(`heartbeat falhou: ${e.message || e}`);
  }
}

/** Job em andamento — fail no SIGTERM/SIGINT para não deixar claimed órfão. */
let currentJobId = null;
let shuttingDown = false;

async function failCurrentJob(reason) {
  if (!currentJobId) return;
  const id = currentJobId;
  currentJobId = null;
  try {
    await api.fail(AGENT_ID, id, reason);
    log.warn(`job ${id} marcado como falha no encerramento: ${reason}`);
  } catch (e) {
    log.error(`não consegui falhar job ${id} no shutdown: ${e.message || e}`);
  }
}

async function main() {
  if (!API_KEY) {
    log.warn(
      'AGENT_API_KEY vazio — use a chave do agente ou a AGENT_API_KEY global',
    );
  }
  const runtimeLabel = CDP
    ? `Chrome CDP · perfil=${CDP_ID || '-'} · ${CDP_URL || '(sem CDP_URL)'}`
    : `AVD · serial=${SERIAL || '(env)'}`;
  log.info('——— worker iniciado ———');
  log.info(`API ${API_URL}`);
  log.info(`agente ${AGENT_ID_ENV} · ${runtimeLabel}`);
  log.info(
    `DRY=${DRY ? 'sim' : 'não'} · ONCE=${ONCE ? 'sim' : 'não'} · pausa ociosa ${fmtDuration(SLEEP_MS)} · heartbeat ${fmtDuration(HEARTBEAT_MS)}`,
  );
  await enroll();
  if (AGENT_ID !== AGENT_ID_ENV) {
    log.info(`id canônico na API: ${AGENT_ID}`);
  }
  const hb = setInterval(heartbeat, HEARTBEAT_MS);
  // primeiro heartbeat logo após enroll
  void heartbeat();

  const onSignal = async (sig) => {
    if (shuttingDown) return;
    shuttingDown = true;
    log.warn(`recebi ${sig} — encerrando com segurança…`);
    clearInterval(hb);
    await failCurrentJob(`worker ${sig} — job interrompido`);
    process.exit(0);
  };
  process.on('SIGTERM', () => void onSignal('SIGTERM'));
  process.on('SIGINT', () => void onSignal('SIGINT'));

  let cycle = 0;
  try {
    for (;;) {
      if (shuttingDown) break;
      cycle += 1;
      try {
        const didWork = await runAgentCycle(api, {
          agentId: AGENT_ID,
          serial: SERIAL,
          cdpId: CDP_ID,
          cdpUrl: CDP_URL,
          apiUrl: API_URL,
          apiKey: API_KEY,
          dry: DRY,
          runtime: CDP ? 'cdp' : 'avd',
          cycle,
          log,
          shouldStop: () => shuttingDown,
          onClaimed: (id) => {
            currentJobId = id;
          },
          onSettled: () => {
            currentJobId = null;
          },
        });
        if (!ONCE && !shuttingDown) {
          log.info(
            didWork
              ? `ciclo #${cycle} ok — pausa ${fmtDuration(SLEEP_MS)} e volto a puxar fila`
              : `sem job — pausa ${fmtDuration(SLEEP_MS)} e consulto a fila de novo`,
          );
        }
      } catch (e) {
        currentJobId = null;
        log.error(`erro no ciclo #${cycle}: ${e.message || e}`);
        if (!ONCE && !shuttingDown) {
          log.info(`pausa ${fmtDuration(SLEEP_MS)} antes de tentar de novo`);
        }
      }
      if (ONCE || shuttingDown) break;
      await new Promise((r) => setTimeout(r, SLEEP_MS));
    }
  } finally {
    clearInterval(hb);
    log.info('——— worker parado ———');
  }
}

main();

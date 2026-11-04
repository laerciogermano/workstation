/**
 * Guarda o último IP de egress do host. Worker só claima/executa quando o IP
 * atual for diferente do último — se igual, fica em espera (poll), sem fail.
 *
 * Estado compartilhado entre workers (AVD/CDP) no mesmo Mac.
 *
 * Env:
 *   LAST_EGRESS_IP_FILE — path (default ~/.connectmax/last-egress-ip)
 *   EGRESS_IP_TIMELINE_FILE — JSONL (default ~/.connectmax/egress-ip-timeline.jsonl)
 *   SKIP_EGRESS_IP_GUARD=1 — desliga a guarda
 *   EGRESS_IP_URL — default https://api.ipify.org
 *   EGRESS_IP_POLL_MS — intervalo do poll enquanto espera mudar (default 10000)
 */
import {
  appendFileSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

const DEFAULT_FILE = join(homedir(), '.connectmax', 'last-egress-ip');
const DEFAULT_TIMELINE = join(homedir(), '.connectmax', 'egress-ip-timeline.jsonl');
const DEFAULT_URL = 'https://api.ipify.org';
const LOCK_WAIT_MS = 30_000;
const LOCK_POLL_MS = 50;

export function egressIpFilePath() {
  const fromEnv = String(process.env.LAST_EGRESS_IP_FILE || '').trim();
  return fromEnv || DEFAULT_FILE;
}

export function egressIpTimelinePath() {
  const fromEnv = String(process.env.EGRESS_IP_TIMELINE_FILE || '').trim();
  return fromEnv || DEFAULT_TIMELINE;
}

export function egressIpPollMs() {
  const n = Number(process.env.EGRESS_IP_POLL_MS || 10_000);
  return Number.isFinite(n) && n >= 1000 ? n : 10_000;
}

export function isEgressIpGuardEnabled() {
  if (process.env.SKIP_EGRESS_IP_GUARD === '1') return false;
  if (process.env.DRY === '1') return false;
  return true;
}

export function readLastEgressIp(filePath = egressIpFilePath()) {
  try {
    if (!existsSync(filePath)) return null;
    const raw = readFileSync(filePath, 'utf8').trim();
    return raw || null;
  } catch {
    return null;
  }
}

export function writeLastEgressIp(ip, filePath = egressIpFilePath()) {
  const dir = dirname(filePath);
  mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, `${String(ip).trim()}\n`, 'utf8');
}

export function clearLastEgressIp(filePath = egressIpFilePath()) {
  try {
    if (existsSync(filePath)) unlinkSync(filePath);
  } catch {
    /* ignore */
  }
}

export async function fetchCurrentEgressIp(
  url = process.env.EGRESS_IP_URL || DEFAULT_URL,
) {
  const res = await fetch(String(url), {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`egress IP → HTTP ${res.status}`);
  }
  const ip = (await res.text()).trim();
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip) && !ip.includes(':')) {
    throw new Error(`egress IP inválido: ${JSON.stringify(ip.slice(0, 80))}`);
  }
  return ip;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function withFileLock(filePath, fn) {
  const lockPath = `${filePath}.lock`;
  mkdirSync(dirname(filePath), { recursive: true });
  const start = Date.now();
  for (;;) {
    let fd;
    try {
      fd = openSync(lockPath, 'wx');
    } catch (e) {
      if (e && e.code === 'EEXIST') {
        if (Date.now() - start > LOCK_WAIT_MS) {
          throw new Error(`timeout lock egress IP (${lockPath})`);
        }
        await sleep(LOCK_POLL_MS);
        continue;
      }
      throw e;
    }
    try {
      return await fn();
    } finally {
      try {
        closeSync(fd);
      } catch {
        /* ignore */
      }
      try {
        unlinkSync(lockPath);
      } catch {
        /* ignore */
      }
    }
  }
}

/**
 * @returns {{ ready: boolean, ip: string, previous: string|null }}
 */
export async function peekEgressIpStatus(opts = {}) {
  const filePath = opts.filePath || egressIpFilePath();
  const fetchIp = opts.fetchIp || fetchCurrentEgressIp;
  const ip = String(await fetchIp()).trim();
  if (!ip) throw new Error('egress IP vazio');
  const previous = readLastEgressIp(filePath);
  const ready = !previous || previous !== ip;
  return { ready, ip, previous };
}

/**
 * Poll até o IP atual ser diferente do último (ou não haver último).
 * Não grava o arquivo — só libera o worker para claimar.
 *
 * Log: cada consulta (antes + depois). EGRESS_IP_LOG_EVERY>1 só reduz o “ainda igual”
 * (default 1 = loga todas).
 *
 * @param {{ filePath?: string, fetchIp?: Function, pollMs?: number, shouldStop?: () => boolean, onWait?: (s: object) => void, logTag?: string, log?: { info: Function, warn: Function, debug: Function } }} opts
 */
export async function waitUntilEgressIpReady(opts = {}) {
  const filePath = opts.filePath || egressIpFilePath();
  const fetchIp = opts.fetchIp || fetchCurrentEgressIp;
  const pollMs = opts.pollMs || egressIpPollMs();
  const shouldStop = opts.shouldStop || (() => false);
  const logEvery = Math.max(
    1,
    Number(process.env.EGRESS_IP_LOG_EVERY || 1) || 1,
  );
  const ipUrl = String(process.env.EGRESS_IP_URL || DEFAULT_URL);
  const startedAt = Date.now();
  let attempt = 0;

  const say = (level, msg) => {
    if (opts.log?.[level]) {
      opts.log[level](msg);
      return;
    }
    const tag = opts.logTag || 'egress';
    const line = `[${tag}] ${msg}`;
    if (level === 'warn') console.warn(line);
    else console.log(line);
  };

  for (;;) {
    if (shouldStop()) {
      const err = new Error('espera de IP cancelada (shutdown)');
      err.code = 'EGRESS_IP_WAIT_CANCELLED';
      throw err;
    }
    attempt += 1;
    const elapsedSec = Math.round((Date.now() - startedAt) / 1000);
    say(
      'info',
      `consultando IP público #${attempt} → ${ipUrl} (já esperei ${elapsedSec}s)…`,
    );
    const t0 = Date.now();
    let status;
    try {
      status = await peekEgressIpStatus({ filePath, fetchIp });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const ms = Date.now() - t0;
      if (opts.onWait) {
        opts.onWait({ ready: false, error: msg });
      } else {
        say(
          'warn',
          `consulta IP #${attempt} falhou em ${ms}ms (${msg}) — nova em ${Math.round(pollMs / 1000)}s`,
        );
      }
      await sleep(pollMs);
      continue;
    }
    const ms = Date.now() - t0;
    if (status.ready) {
      const waited = Date.now() - startedAt;
      if (opts.onWait) opts.onWait({ ...status, ready: true });
      else {
        say(
          'info',
          status.previous
            ? `IP mudou: ${status.previous} → ${status.ip} (consulta ${ms}ms, esperei ${Math.round(waited / 1000)}s) — liberado pra pegar job`
            : `IP público ${status.ip} (consulta ${ms}ms${status.previous ? '' : ', primeiro nesta máquina'}) — liberado pra pegar job`,
        );
      }
      return status;
    }
    if (opts.onWait) {
      opts.onWait({ ...status, ready: false, attempt, elapsedSec });
    } else if (attempt === 1 || attempt % logEvery === 0) {
      say(
        'info',
        `IP ainda igual ao último job — atual=${status.ip} último=${status.previous} (consulta ${ms}ms) · #${attempt} · ${elapsedSec}s · próxima em ${Math.round(pollMs / 1000)}s`,
      );
    }
    await sleep(pollMs);
  }
}

/**
 * Append na timeline JSONL (uma linha por operação).
 * @param {{ ip: string, at?: string, agentId?: string, jobId?: string, jobType?: string, previous?: string|null, runtime?: string }} entry
 */
export function appendEgressIpTimeline(entry, timelinePath = egressIpTimelinePath()) {
  const at = entry.at || new Date().toISOString();
  const row = {
    at,
    ip: String(entry.ip || '').trim(),
    previous: entry.previous ?? null,
    agentId: entry.agentId || null,
    jobId: entry.jobId || null,
    jobType: entry.jobType || null,
    runtime: entry.runtime || null,
  };
  mkdirSync(dirname(timelinePath), { recursive: true });
  appendFileSync(timelinePath, `${JSON.stringify(row)}\n`, 'utf8');
  return row;
}

/**
 * Após claimar um job: grava o IP atual como último (sob lock) + timeline.
 * Se outro processo já gravou o mesmo IP, retorna committed=false (caller deve esperar de novo).
 */
export async function commitEgressIp(ip, opts = {}) {
  const filePath = opts.filePath || egressIpFilePath();
  const timelinePath = opts.timelinePath || egressIpTimelinePath();
  const current = String(ip).trim();
  return withFileLock(filePath, () => {
    const previous = readLastEgressIp(filePath);
    if (previous && previous === current) {
      return { committed: false, ip: current, previous };
    }
    writeLastEgressIp(current, filePath);
    const timeline = appendEgressIpTimeline(
      {
        ip: current,
        previous,
        agentId: opts.agentId,
        jobId: opts.jobId,
        jobType: opts.jobType,
        runtime: opts.runtime,
      },
      timelinePath,
    );
    return { committed: true, ip: current, previous, timeline };
  });
}

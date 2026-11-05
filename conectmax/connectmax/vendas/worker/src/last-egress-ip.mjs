/**
 * Guarda a lista de IPs de egress já usados no host. Antes de claimar/executar,
 * se o IP atual já estiver na lista → aborta (não claima / falha o job).
 * Se for novo → executa e acrescenta na lista + timeline.
 *
 * Estado compartilhado entre workers (AVD/CDP) no mesmo Mac.
 *
 * Env:
 *   USED_EGRESS_IPS_FILE — lista (default ~/.connectmax/used-egress-ips), 1 IP/linha
 *   LAST_EGRESS_IP_FILE — legado (lido só na migração; default ~/.connectmax/last-egress-ip)
 *   EGRESS_IP_TIMELINE_FILE — JSONL (default ~/.connectmax/egress-ip-timeline.jsonl)
 *   SKIP_EGRESS_IP_GUARD=1 — desliga a guarda
 *   EGRESS_IP_URL — default https://api.ipify.org
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

const DEFAULT_USED = join(homedir(), '.connectmax', 'used-egress-ips');
const DEFAULT_LAST = join(homedir(), '.connectmax', 'last-egress-ip');
const DEFAULT_TIMELINE = join(homedir(), '.connectmax', 'egress-ip-timeline.jsonl');
const DEFAULT_URL = 'https://api.ipify.org';
const LOCK_WAIT_MS = 30_000;
const LOCK_POLL_MS = 50;

export function usedEgressIpsFilePath() {
  const fromEnv = String(process.env.USED_EGRESS_IPS_FILE || '').trim();
  return fromEnv || DEFAULT_USED;
}

/** @deprecated use usedEgressIpsFilePath — mantido p/ migração / envs antigos */
export function egressIpFilePath() {
  const fromEnv = String(process.env.LAST_EGRESS_IP_FILE || '').trim();
  return fromEnv || DEFAULT_LAST;
}

export function egressIpTimelinePath() {
  const fromEnv = String(process.env.EGRESS_IP_TIMELINE_FILE || '').trim();
  return fromEnv || DEFAULT_TIMELINE;
}

export function isEgressIpGuardEnabled() {
  if (process.env.SKIP_EGRESS_IP_GUARD === '1') return false;
  if (process.env.DRY === '1') return false;
  return true;
}

function isIpLike(s) {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(s) || s.includes(':');
}

function parseIpLines(raw) {
  const out = [];
  const seen = new Set();
  for (const line of String(raw || '').split(/\r?\n/)) {
    const ip = line.trim();
    if (!ip || ip.startsWith('#')) continue;
    if (!isIpLike(ip)) continue;
    if (seen.has(ip)) continue;
    seen.add(ip);
    out.push(ip);
  }
  return out;
}

function ipsFromTimeline(timelinePath) {
  const out = [];
  const seen = new Set();
  try {
    if (!existsSync(timelinePath)) return out;
    const raw = readFileSync(timelinePath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim();
      if (!t) continue;
      try {
        const row = JSON.parse(t);
        const ip = String(row?.ip || '').trim();
        if (!ip || !isIpLike(ip) || seen.has(ip)) continue;
        seen.add(ip);
        out.push(ip);
      } catch {
        /* ignore linha inválida */
      }
    }
  } catch {
    /* ignore */
  }
  return out;
}

/**
 * Lista de IPs já usados (ordem estável). Migra legado last-egress-ip + timeline
 * para used-egress-ips na primeira leitura se a lista ainda não existir.
 */
export function readUsedEgressIps(opts = {}) {
  const usedPath = opts.usedPath || usedEgressIpsFilePath();
  const lastPath = opts.lastPath || egressIpFilePath();
  const timelinePath = opts.timelinePath || egressIpTimelinePath();
  const seen = new Set();
  const list = [];

  const add = (ip) => {
    const v = String(ip || '').trim();
    if (!v || !isIpLike(v) || seen.has(v)) return;
    seen.add(v);
    list.push(v);
  };

  try {
    if (existsSync(usedPath)) {
      for (const ip of parseIpLines(readFileSync(usedPath, 'utf8'))) add(ip);
    }
  } catch {
    /* ignore */
  }

  // Migração: legado single-file + IPs da timeline
  try {
    if (existsSync(lastPath)) {
      const last = readFileSync(lastPath, 'utf8').trim();
      if (last) add(last);
    }
  } catch {
    /* ignore */
  }
  for (const ip of ipsFromTimeline(timelinePath)) add(ip);

  if (list.length && !existsSync(usedPath)) {
    writeUsedEgressIps(list, usedPath);
  }

  return list;
}

export function writeUsedEgressIps(ips, filePath = usedEgressIpsFilePath()) {
  const dir = dirname(filePath);
  mkdirSync(dir, { recursive: true });
  const unique = [];
  const seen = new Set();
  for (const raw of ips) {
    const ip = String(raw || '').trim();
    if (!ip || !isIpLike(ip) || seen.has(ip)) continue;
    seen.add(ip);
    unique.push(ip);
  }
  writeFileSync(filePath, unique.length ? `${unique.join('\n')}\n` : '', 'utf8');
  return unique;
}

export function clearUsedEgressIps(opts = {}) {
  const usedPath = opts.usedPath || usedEgressIpsFilePath();
  const lastPath = opts.lastPath || egressIpFilePath();
  for (const p of [usedPath, lastPath]) {
    try {
      if (existsSync(p)) unlinkSync(p);
    } catch {
      /* ignore */
    }
  }
}

/** @deprecated alias — limpa lista (e legado) */
export function clearLastEgressIp(filePath) {
  if (filePath) {
    try {
      if (existsSync(filePath)) unlinkSync(filePath);
    } catch {
      /* ignore */
    }
    return;
  }
  clearUsedEgressIps();
}

/** @deprecated lê só o último da lista (compat) */
export function readLastEgressIp(filePath) {
  if (filePath) {
    try {
      if (!existsSync(filePath)) return null;
      const raw = readFileSync(filePath, 'utf8').trim();
      return raw || null;
    } catch {
      return null;
    }
  }
  const list = readUsedEgressIps();
  return list.length ? list[list.length - 1] : null;
}

/** @deprecated grava como append na lista */
export function writeLastEgressIp(ip, filePath = usedEgressIpsFilePath()) {
  const list = readUsedEgressIps({ usedPath: filePath });
  const current = String(ip).trim();
  if (current && !list.includes(current)) list.push(current);
  writeUsedEgressIps(list, filePath);
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
  if (!isIpLike(ip)) {
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
 * @returns {{ ready: boolean, ip: string, used: string[] }}
 */
export async function peekEgressIpStatus(opts = {}) {
  const usedPath = opts.usedPath || opts.filePath || usedEgressIpsFilePath();
  const fetchIp = opts.fetchIp || fetchCurrentEgressIp;
  const ip = String(await fetchIp()).trim();
  if (!ip) throw new Error('egress IP vazio');
  const used = readUsedEgressIps({
    usedPath,
    lastPath: opts.lastPath,
    timelinePath: opts.timelinePath,
  });
  const ready = !used.includes(ip);
  return { ready, ip, used, previous: used.length ? used[used.length - 1] : null };
}

/**
 * Consulta o IP atual **uma vez**. Se já foi usado → ready=false (caller aborta).
 * Não grava e não faz poll.
 *
 * @param {{ usedPath?: string, filePath?: string, fetchIp?: Function, logTag?: string, log?: { info: Function, warn: Function, debug: Function } }} opts
 */
export async function checkEgressIpOnce(opts = {}) {
  const usedPath = opts.usedPath || opts.filePath || usedEgressIpsFilePath();
  const fetchIp = opts.fetchIp || fetchCurrentEgressIp;
  const ipUrl = String(process.env.EGRESS_IP_URL || DEFAULT_URL);

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

  say('info', `consultando IP público → ${ipUrl}…`);
  const t0 = Date.now();
  const status = await peekEgressIpStatus({ usedPath, fetchIp, ...opts });
  const ms = Date.now() - t0;
  if (status.ready) {
    say(
      'info',
      status.used.length
        ? `IP ${status.ip} ainda não usado (consulta ${ms}ms; ${status.used.length} na lista) — liberado`
        : `IP público ${status.ip} (consulta ${ms}ms, primeiro nesta máquina) — liberado`,
    );
  } else {
    say(
      'warn',
      `IP ${status.ip} já foi usado anteriormente (consulta ${ms}ms; lista=${status.used.length}) — abortar`,
    );
  }
  return status;
}

/**
 * @deprecated use checkEgressIpOnce — não faz mais poll; uma consulta e retorna.
 */
export async function waitUntilEgressIpReady(opts = {}) {
  return checkEgressIpOnce(opts);
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
 * Após claimar: se IP já está na lista → committed=false.
 * Se novo → append na lista + timeline.
 */
export async function commitEgressIp(ip, opts = {}) {
  const usedPath = opts.usedPath || opts.filePath || usedEgressIpsFilePath();
  const timelinePath = opts.timelinePath || egressIpTimelinePath();
  const current = String(ip).trim();
  return withFileLock(usedPath, () => {
    const used = readUsedEgressIps({
      usedPath,
      lastPath: opts.lastPath || egressIpFilePath(),
      timelinePath,
    });
    const previous = used.length ? used[used.length - 1] : null;
    if (used.includes(current)) {
      return { committed: false, ip: current, previous, used };
    }
    const next = [...used, current];
    writeUsedEgressIps(next, usedPath);
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
    return { committed: true, ip: current, previous, used: next, timeline };
  });
}

/**
 * Guarda o último IP de egress do host e bloqueia nova execução se for igual.
 * Estado compartilhado entre workers (AVD/CDP) no mesmo Mac.
 *
 * Env:
 *   LAST_EGRESS_IP_FILE — path do arquivo (default ~/.connectmax/last-egress-ip)
 *   SKIP_EGRESS_IP_GUARD=1 — desliga a guarda
 *   EGRESS_IP_URL — override do endpoint (default https://api.ipify.org)
 */
import {
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
const DEFAULT_URL = 'https://api.ipify.org';
const LOCK_WAIT_MS = 30_000;
const LOCK_POLL_MS = 50;

export function egressIpFilePath() {
  const fromEnv = String(process.env.LAST_EGRESS_IP_FILE || '').trim();
  return fromEnv || DEFAULT_FILE;
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

export async function fetchCurrentEgressIp(url = process.env.EGRESS_IP_URL || DEFAULT_URL) {
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
 * Obtém IP atual; se igual ao último gravado, lança erro.
 * Se diferente (ou sem último), grava o atual e retorna { ip, previous }.
 */
export async function assertEgressIpChanged(opts = {}) {
  const filePath = opts.filePath || egressIpFilePath();
  const fetchIp = opts.fetchIp || fetchCurrentEgressIp;

  const current = String(await fetchIp()).trim();
  if (!current) throw new Error('egress IP vazio');

  return withFileLock(filePath, () => {
    const previous = readLastEgressIp(filePath);
    if (previous && previous === current) {
      const err = new Error(`falha: IP igual ao último IP (${current})`);
      err.code = 'EGRESS_IP_SAME_AS_LAST';
      err.ip = current;
      err.previous = previous;
      throw err;
    }
    writeLastEgressIp(current, filePath);
    return { ip: current, previous };
  });
}

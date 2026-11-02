/**
 * Contrato CRUD de CDPs (persistência JSON + start/stop + connect).
 * Interface só via lib — sem UI HTML.
 */
import { execFileSync, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import {
  dirname,
  isAbsolute,
  join,
  resolve,
} from 'node:path';
import { fileURLToPath } from 'node:url';
import { connect } from './session.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(__dir, '..');
const DATA_DIR = join(PKG_ROOT, 'data');
const STORE_PATH = join(DATA_DIR, 'cdps.json');
const WORKS_ROOT = resolve(PKG_ROOT, '../../../..'); // works/
const SCREEN_ROBOT = resolve(PKG_ROOT, '../../..'); // screen-robot/

/** @type {Map<string, import('node:child_process').ChildProcess>} */
const children = new Map();

function ensureStore() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(STORE_PATH)) {
    writeFileSync(STORE_PATH, JSON.stringify({ cdps: [] }, null, 2));
  }
}

function loadDb() {
  ensureStore();
  return JSON.parse(readFileSync(STORE_PATH, 'utf8'));
}

function saveDb(db) {
  ensureStore();
  writeFileSync(STORE_PATH, JSON.stringify(db, null, 2));
}

export function expandHome(p) {
  if (!p) return p;
  if (p.startsWith('~/')) return resolve(homedir(), p.slice(2));
  return p;
}

export function resolveStartScript(startScript) {
  if (!startScript) return null;
  if (isAbsolute(startScript) && existsSync(startScript)) return startScript;
  const candidates = [
    resolve(WORKS_ROOT, startScript),
    resolve(SCREEN_ROBOT, startScript),
    resolve(PKG_ROOT, '..', startScript.replace(/^.*chrome-cdp\//, '')),
  ];
  return candidates.find((c) => existsSync(c)) || null;
}

export function isPortListening(port) {
  try {
    return (
      execFileSync('lsof', [`-iTCP:${port}`, '-sTCP:LISTEN', '-P', '-n'], {
        encoding: 'utf8',
      }).trim().length > 0
    );
  } catch {
    return false;
  }
}

function matchKey(row, key) {
  if (row.id === key) return true;
  if (String(row.port) === String(key)) return true;
  if (row.name && row.name.toLowerCase() === String(key).toLowerCase()) return true;
  return false;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * @typedef {object} CdpRecord
 * @property {string} id
 * @property {string} name
 * @property {string} userDataDir
 * @property {number} port
 * @property {string} startScript
 * @property {string} [platform]
 * @property {string} [defaultUrl]
 * @property {string} [obs]
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/** @returns {CdpRecord[]} */
export function listCdps() {
  return loadDb().cdps.slice();
}

/** @param {string|number} key id | port | name */
export function getCdp(key) {
  return listCdps().find((c) => matchKey(c, key)) || null;
}

/**
 * @param {object} input
 * @returns {CdpRecord}
 */
export function createCdp(input) {
  const db = loadDb();
  const row = {
    id: randomUUID(),
    name: String(input.name || '').trim(),
    userDataDir: String(input.userDataDir || '').trim(),
    port: Number(input.port),
    startScript: String(input.startScript || '').trim(),
    platform: String(input.platform || '').trim(),
    defaultUrl: String(input.defaultUrl || '').trim(),
    obs: String(input.obs || '').trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (!row.name) throw new Error('name obrigatório');
  if (!Number.isFinite(row.port) || row.port < 1) throw new Error('port inválida');
  if (db.cdps.some((c) => c.port === row.port)) {
    throw new Error(`porta ${row.port} já cadastrada`);
  }
  db.cdps.push(row);
  saveDb(db);
  return row;
}

export function updateCdp(id, patch) {
  const db = loadDb();
  const i = db.cdps.findIndex((c) => matchKey(c, id));
  if (i < 0) throw new Error(`cdp não encontrado: ${id}`);
  const cur = db.cdps[i];
  const next = {
    ...cur,
    ...patch,
    id: cur.id,
    port: patch.port != null ? Number(patch.port) : cur.port,
    updatedAt: new Date().toISOString(),
  };
  if (db.cdps.some((c) => c.id !== cur.id && c.port === next.port)) {
    throw new Error(`porta ${next.port} já cadastrada`);
  }
  db.cdps[i] = next;
  saveDb(db);
  return next;
}

/** @returns {boolean} */
export function removeCdp(id) {
  const db = loadDb();
  const before = db.cdps.length;
  db.cdps = db.cdps.filter((c) => !matchKey(c, id));
  if (db.cdps.length === before) return false;
  saveDb(db);
  return true;
}

export function replaceAllCdps(cdps) {
  saveDb({ cdps });
}

/**
 * @returns {Promise<{ id: string, name: string, port: number, status: 'up'|'down', cdpUrl: string, version: object|null, startScriptResolved: string|null, userDataDirExpanded: string }>}
 */
export async function statusCdp(id) {
  const row = getCdp(id);
  if (!row) throw new Error(`cdp não encontrado: ${id}`);
  const up = isPortListening(row.port);
  let version = null;
  if (up) {
    try {
      const res = await fetch(`http://127.0.0.1:${row.port}/json/version`, {
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) version = await res.json();
    } catch {
      /* ignore */
    }
  }
  return {
    id: row.id,
    name: row.name,
    port: row.port,
    status: up ? 'up' : 'down',
    cdpUrl: `http://127.0.0.1:${row.port}`,
    version,
    startScriptResolved: resolveStartScript(row.startScript),
    userDataDirExpanded: expandHome(row.userDataDir),
  };
}

export async function startCdp(id, { url } = {}) {
  const row = getCdp(id);
  if (!row) throw new Error(`cdp não encontrado: ${id}`);
  const st = await statusCdp(row.id);
  if (st.status === 'up') return { ...st, already: true };
  const script = resolveStartScript(row.startScript);
  if (!script) throw new Error(`startScript não encontrado: ${row.startScript}`);
  const args = [];
  const openUrl = url || row.defaultUrl;
  if (openUrl) args.push(openUrl);
  const child = spawn(script, args, {
    detached: true,
    stdio: 'ignore',
    env: process.env,
  });
  child.unref();
  children.set(row.id, child);
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    if (isPortListening(row.port)) break;
  }
  const next = await statusCdp(row.id);
  if (next.status !== 'up') throw new Error(`Chrome não abriu a porta ${row.port}`);
  return { ...next, already: false };
}

export async function stopCdp(id) {
  const row = getCdp(id);
  if (!row) throw new Error(`cdp não encontrado: ${id}`);
  const child = children.get(row.id);
  if (child && !child.killed) {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      try {
        child.kill('SIGTERM');
      } catch {
        /* ignore */
      }
    }
    children.delete(row.id);
  }
  try {
    const pids = execFileSync('lsof', [`-tiTCP:${row.port}`, '-sTCP:LISTEN'], {
      encoding: 'utf8',
    })
      .trim()
      .split('\n')
      .filter(Boolean);
    for (const pid of pids) {
      try {
        process.kill(Number(pid), 'SIGTERM');
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* nada na porta */
  }
  await sleep(400);
  return statusCdp(row.id);
}

/** Abre HumanCdpSession no CDP cadastrado (sobe se necessário). */
export async function connectCdp(id, connectOpts = {}) {
  const row = getCdp(id);
  if (!row) throw new Error(`cdp não encontrado: ${id}`);
  let st = await statusCdp(row.id);
  if (st.status !== 'up') {
    st = await startCdp(row.id, { url: connectOpts.url || row.defaultUrl });
  }
  return connect({
    cdpUrl: st.cdpUrl,
    url: connectOpts.url,
    urlIncludes: connectOpts.urlIncludes,
    newTab: connectOpts.newTab,
    chromeApp: connectOpts.chromeApp,
  });
}

export function storePath() {
  return STORE_PATH;
}

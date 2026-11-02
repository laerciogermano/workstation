/**
 * CRUD de CDPs só no disco:
 * - perfil: ~/chrome-profiles/<id>/
 * - meta:   ~/chrome-profiles/<id>/.human-cdp.json
 * - porta em execução: processo Chrome com --user-data-dir + --remote-debugging-port
 *
 * Sem start-*.sh, sem JSON central, sem fallbacks.
 */
import { execFileSync, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  applyFingerprint,
  chromeArgsFromFingerprint,
  normalizeFingerprint,
} from './fingerprint.mjs';
import { connect } from './session.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(__dir, '..');
const PROFILES_DIR = join(homedir(), 'chrome-profiles');
const META_FILE = '.human-cdp.json';
const CHROME_BIN =
  process.env.CHROME_BIN ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/** @type {Map<string, import('node:child_process').ChildProcess>} */
const children = new Map();
/** @type {Map<string, import('node:child_process').ChildProcess>} */
const keepers = new Map();

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function keeperPidPath(id) {
  return join(profilePath(id), '.fingerprint-keeper.pid');
}

function stopFingerprintKeeper(id) {
  const child = keepers.get(id);
  if (child && !child.killed) {
    try {
      child.kill('SIGTERM');
    } catch {
      /* ignore */
    }
  }
  keepers.delete(id);
  const pidFile = keeperPidPath(id);
  if (existsSync(pidFile)) {
    try {
      const pid = Number(readFileSync(pidFile, 'utf8').trim());
      if (pid) process.kill(pid, 'SIGTERM');
    } catch {
      /* ignore */
    }
    try {
      rmSync(pidFile);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Processo detached: browser WS + auto-attach em todas as abas; reaplica em F5.
 * Só sobe se meta.fingerprint existir e a porta estiver up.
 * @param {string} id
 * @param {{ restart?: boolean }} [opts] restart=true mata keeper antigo e sobe de novo
 */
export function ensureFingerprintKeeper(id, opts = {}) {
  const row = getCdp(id);
  if (!row) return null;
  const meta = readMeta(row.id);
  const fp = normalizeFingerprint(meta?.fingerprint);
  if (!fp) {
    stopFingerprintKeeper(row.id);
    return null;
  }
  if (row.port == null || !isPortListening(row.port)) return null;

  if (opts.restart) {
    stopFingerprintKeeper(row.id);
  } else {
    const existing = keepers.get(row.id);
    if (existing && !existing.killed) return existing;

    // pid residual de sessão anterior
    const pidFile = keeperPidPath(row.id);
    if (existsSync(pidFile)) {
      try {
        const pid = Number(readFileSync(pidFile, 'utf8').trim());
        if (pid) {
          try {
            process.kill(pid, 0);
            // já vive — registra placeholder só com pid (sem handle)
            return { pid, already: true };
          } catch {
            /* morto */
          }
        }
      } catch {
        /* ignore */
      }
    }
  }

  const script = join(__dir, 'fingerprint-keeper.mjs');
  const child = spawn(process.execPath, [script, row.id], {
    detached: true,
    stdio: 'ignore',
    env: process.env,
  });
  child.unref();
  keepers.set(row.id, child);
  return child;
}

export function profilesDir() {
  return PROFILES_DIR;
}

export function expandHome(p) {
  if (!p) return p;
  if (p.startsWith('~/')) return resolve(homedir(), p.slice(2));
  return p;
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

function slugify(name) {
  return (
    String(name || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `cdp-${randomUUID().slice(0, 8)}`
  );
}

function profilePath(id) {
  return join(PROFILES_DIR, id);
}

function metaPath(id) {
  return join(profilePath(id), META_FILE);
}

function readMeta(id) {
  const p = metaPath(id);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    throw new Error(`meta inválida: ${p}`);
  }
}

function writeMeta(id, meta) {
  mkdirSync(profilePath(id), { recursive: true });
  writeFileSync(metaPath(id), JSON.stringify(meta, null, 2) + '\n');
}

function listProfileIds() {
  if (!existsSync(PROFILES_DIR)) return [];
  return readdirSync(PROFILES_DIR).filter((name) => {
    try {
      return statSync(join(PROFILES_DIR, name)).isDirectory();
    } catch {
      return false;
    }
  });
}

/** slug -> port a partir de processos Chrome no ar */
function runningPortsByProfile() {
  /** @type {Map<string, number>} */
  const map = new Map();
  let out = '';
  try {
    out = execFileSync('ps', ['-ax', '-o', 'command='], { encoding: 'utf8' });
  } catch {
    return map;
  }
  for (const line of out.split('\n')) {
    if (!/Chrome|Chromium/i.test(line)) continue;
    if (!/--remote-debugging-port=/.test(line)) continue;
    if (!/--user-data-dir=/.test(line)) continue;
    const portM = line.match(/--remote-debugging-port=(\d+)/);
    const dirM = line.match(/--user-data-dir=(\S+)/);
    if (!portM || !dirM) continue;
    let dir = dirM[1].replace(/^"|"$/g, '');
    dir = expandHome(dir.replace(/^\$HOME/, '~'));
    const slug = dir.split('/').filter(Boolean).pop();
    if (slug) map.set(slug, Number(portM[1]));
  }
  return map;
}

function matchKey(row, key) {
  if (row.id === key) return true;
  if (row.port != null && String(row.port) === String(key)) return true;
  if (row.name && row.name.toLowerCase() === String(key).toLowerCase()) return true;
  return false;
}

/**
 * @returns {object[]}
 */
export function listCdps() {
  const running = runningPortsByProfile();
  const rows = [];
  for (const id of listProfileIds()) {
    const meta = readMeta(id);
    const runPort = running.get(id);
    const metaPort = meta?.port != null ? Number(meta.port) : null;
    // porta: só processo em execução; meta.port é preferência para start, não inventa “up”
    const port = runPort ?? null;
    rows.push({
      id,
      name: meta?.name || id,
      port,
      preferredPort: Number.isFinite(metaPort) ? metaPort : null,
      status: port != null ? 'up' : 'down',
      cdpUrl: port != null ? `http://127.0.0.1:${port}` : null,
      userDataDir: `~/chrome-profiles/${id}`,
      userDataDirExpanded: profilePath(id),
      profileExists: true,
      hasMeta: Boolean(meta),
      defaultUrl: meta?.defaultUrl || '',
      obs: meta?.obs || '',
      fingerprint: normalizeFingerprint(meta?.fingerprint),
      createdAt: meta?.createdAt || null,
      updatedAt: meta?.updatedAt || null,
    });
  }
  return rows.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'up' ? -1 : 1;
    const pa = a.port ?? a.preferredPort ?? 9e9;
    const pb = b.port ?? b.preferredPort ?? 9e9;
    if (pa !== pb) return pa - pb;
    return a.id.localeCompare(b.id);
  });
}

export function getCdp(key) {
  return listCdps().find((c) => matchKey(c, key)) || null;
}

/**
 * Cria ~/chrome-profiles/<id>/ + .human-cdp.json
 */
export function createCdp(input) {
  const name = String(input.name || '').trim();
  const port = Number(input.port);
  if (!name) throw new Error('name obrigatório');
  if (!Number.isFinite(port) || port < 1) throw new Error('port inválida');

  const id = String(input.id || slugify(name)).trim();
  if (existsSync(metaPath(id))) {
    throw new Error(`cdp já existe no disco: ${id}`);
  }
  if (
    listCdps().some(
      (c) => c.port === port || c.preferredPort === port,
    )
  ) {
    throw new Error(`porta ${port} já em uso`);
  }

  const now = new Date().toISOString();
  const fingerprint = normalizeFingerprint(input.fingerprint);
  writeMeta(id, {
    id,
    name,
    port,
    defaultUrl: String(input.defaultUrl || '').trim(),
    obs: String(input.obs || '').trim(),
    ...(fingerprint ? { fingerprint } : {}),
    createdAt: now,
    updatedAt: now,
  });
  return getCdp(id);
}

export function updateCdp(id, patch) {
  const cur = getCdp(id);
  if (!cur) throw new Error(`cdp não encontrado: ${id}`);
  const prev = readMeta(cur.id);
  if (!prev) throw new Error(`meta ausente: ${cur.id}`);
  const next = {
    ...prev,
    ...patch,
    id: cur.id,
    port: patch.port != null ? Number(patch.port) : prev.port,
    updatedAt: new Date().toISOString(),
  };
  if ('fingerprint' in patch) {
    const fingerprint = normalizeFingerprint(patch.fingerprint);
    if (fingerprint) next.fingerprint = fingerprint;
    else delete next.fingerprint;
  }
  if (
    listCdps().some(
      (c) =>
        c.id !== cur.id &&
        (c.port === next.port || c.preferredPort === next.port),
    )
  ) {
    throw new Error(`porta ${next.port} já em uso`);
  }
  writeMeta(cur.id, next);
  if ('fingerprint' in patch) {
    stopFingerprintKeeper(cur.id);
    ensureFingerprintKeeper(cur.id);
  }
  return getCdp(cur.id);
}

/**
 * Remove .human-cdp.json. Com deleteProfile: true apaga a pasta do perfil.
 * Default não apaga o user-data-dir.
 */
export function removeCdp(id, { deleteProfile = false } = {}) {
  const cur = getCdp(id);
  if (!cur) return false;
  const meta = metaPath(cur.id);
  if (existsSync(meta)) rmSync(meta);
  if (deleteProfile === true) {
    rmSync(profilePath(cur.id), { recursive: true, force: true });
  }
  return true;
}

export async function statusCdp(id) {
  const row = getCdp(id);
  if (!row) throw new Error(`cdp não encontrado: ${id}`);
  const up = row.port != null && isPortListening(row.port);
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
    ...row,
    status: up ? 'up' : 'down',
    cdpUrl: row.port != null ? `http://127.0.0.1:${row.port}` : null,
    version,
  };
}

export async function startCdp(id, { url } = {}) {
  const row = getCdp(id);
  if (!row) throw new Error(`cdp não encontrado: ${id}`);
  const port = row.port ?? row.preferredPort;
  if (port == null) throw new Error(`porta ausente na meta de ${row.id}`);
  const st = await statusCdp(row.id);
  if (st.status === 'up') {
    ensureFingerprintKeeper(row.id);
    return { ...st, already: true };
  }

  if (!existsSync(CHROME_BIN)) {
    throw new Error(`Chrome não encontrado: ${CHROME_BIN}`);
  }
  mkdirSync(row.userDataDirExpanded, { recursive: true });
  const meta = readMeta(row.id);
  const fp = normalizeFingerprint(meta?.fingerprint);
  const args = [
    `--user-data-dir=${row.userDataDirExpanded}`,
    '--remote-debugging-address=127.0.0.1',
    `--remote-debugging-port=${port}`,
    '--remote-allow-origins=*',
    '--no-first-run',
    '--no-default-browser-check',
    ...chromeArgsFromFingerprint(fp),
  ];
  const openUrl = url || row.defaultUrl;
  if (openUrl) args.push(openUrl);

  const child = spawn(CHROME_BIN, args, {
    detached: true,
    stdio: 'ignore',
    env: process.env,
  });
  child.unref();
  children.set(row.id, child);

  for (let i = 0; i < 40; i++) {
    await sleep(250);
    if (isPortListening(port)) break;
  }
  const next = await statusCdp(row.id);
  if (next.status !== 'up') {
    throw new Error(`Chrome não abriu a porta ${port}`);
  }
  ensureFingerprintKeeper(row.id);
  // aplica uma vez já na página inicial (keeper também sobe)
  if (fp) {
    try {
      const session = await connect({
        cdpUrl: next.cdpUrl,
        chromeApp: 'Google Chrome',
      });
      session._fingerprint = fp;
      await applyFingerprint(session, fp);
      session.close();
    } catch {
      /* keeper cobre o retry */
    }
  }
  return { ...next, already: false };
}

export async function stopCdp(id) {
  const row = getCdp(id);
  if (!row) throw new Error(`cdp não encontrado: ${id}`);
  stopFingerprintKeeper(row.id);
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
  if (row.port != null) {
    try {
      const pids = execFileSync(
        'lsof',
        [`-tiTCP:${row.port}`, '-sTCP:LISTEN'],
        { encoding: 'utf8' },
      )
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
      /* nada */
    }
  }
  await sleep(400);
  return statusCdp(row.id);
}

export async function connectCdp(id, connectOpts = {}) {
  const row = getCdp(id);
  if (!row) throw new Error(`cdp não encontrado: ${id}`);
  let st = await statusCdp(row.id);
  if (st.status !== 'up') {
    st = await startCdp(row.id, { url: connectOpts.url || row.defaultUrl });
  }
  if (!st.cdpUrl) throw new Error(`sem cdpUrl para ${row.id}`);
  ensureFingerprintKeeper(row.id);
  const session = await connect({
    cdpUrl: st.cdpUrl,
    url: connectOpts.url,
    urlIncludes: connectOpts.urlIncludes,
    newTab: connectOpts.newTab,
    chromeApp: connectOpts.chromeApp,
    debug: connectOpts.debug,
  });
  const fp =
    normalizeFingerprint(connectOpts.fingerprint) ||
    normalizeFingerprint(row.fingerprint) ||
    normalizeFingerprint(readMeta(row.id)?.fingerprint);
  if (fp) {
    session._fingerprint = fp;
    await applyFingerprint(session, fp);
  }
  return session;
}

// compat exports
export function storePath() {
  return PROFILES_DIR;
}

export function scriptsDir() {
  return PROFILES_DIR;
}

export function resolveStartScript() {
  return null;
}

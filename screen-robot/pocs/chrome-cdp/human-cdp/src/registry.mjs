/**
 * CRUD de CDPs no disco — lê/escreve `start-*.sh` + `~/chrome-profiles/*`.
 * Sem JSON / sem CSV.
 */
import { execFileSync, spawn } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { connect } from './session.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(__dir, '..');
const CHROME_CDP_DIR = resolve(PKG_ROOT, '..'); // pocs/chrome-cdp
const PROFILES_DIR = join(homedir(), 'chrome-profiles');

/** @type {Map<string, import('node:child_process').ChildProcess>} */
const children = new Map();

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function expandHome(p) {
  if (!p) return p;
  if (p.startsWith('~/')) return resolve(homedir(), p.slice(2));
  if (p.includes('$HOME/')) return p.replace(/\$HOME\//g, `${homedir()}/`);
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
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'cdp';
}

/** @param {string} scriptPath */
function parseStartScript(scriptPath) {
  const text = readFileSync(scriptPath, 'utf8');
  // só Chrome CDP neste contrato (Firefox fica de fora)
  if (!/Google Chrome|chrome/i.test(text) && !/--user-data-dir=/.test(text)) {
    return null;
  }
  if (/Firefox|firefox-profiles/i.test(text) && !/--user-data-dir=/.test(text)) {
    return null;
  }
  const portM = text.match(/--remote-debugging-port=(\d+)/);
  const dirM = text.match(/--user-data-dir="([^"]+)"|--user-data-dir=(\S+)/);
  if (!portM || !dirM) return null;

  const port = Number(portM[1]);
  let userDataDir = (dirM[1] || dirM[2] || '').trim();
  userDataDir = userDataDir
    .replace(/\$HOME/g, '~')
    .replace(/^"\s*|\s*"$/g, '');
  if (userDataDir.startsWith('$HOME/')) {
    userDataDir = `~/${userDataDir.slice(6)}`;
  }

  const base = scriptPath.split('/').pop() || '';
  const id = base.replace(/^start-/, '').replace(/\.sh$/, '');

  let name = id;
  let platform = '';
  const comment = text.match(/^#\s*Chrome isolado:\s*(.+)$/m);
  if (comment) {
    let rest = comment[1]
      .replace(/\(CDP\s*:\d+\)/i, '')
      .trim();
    const parts = rest.split(/\s*\/\s*/);
    if (parts.length >= 2) {
      name = parts[0].trim();
      platform = parts.slice(1).join(' / ').replace(/\s*\(.*$/, '').trim();
    } else {
      name = rest.replace(/\s*\(.*$/, '').trim() || id;
    }
  }

  const relScript = `screen-robot/pocs/chrome-cdp/${base}`;
  return {
    id,
    name,
    port,
    platform,
    userDataDir,
    userDataDirExpanded: expandHome(userDataDir),
    startScript: relScript,
    startScriptPath: scriptPath,
    profileExists: existsSync(expandHome(userDataDir)),
    browser: 'chrome',
  };
}

function scriptPathForId(id) {
  return join(CHROME_CDP_DIR, `start-${id}.sh`);
}

function renderStartScript({ name, platform, port, profileSlug }) {
  const label = platform
    ? `Chrome isolado: ${name} / ${platform} (CDP :${port})`
    : `Chrome isolado: ${name} (CDP :${port})`;
  return `#!/usr/bin/env bash
# ${label}
exec "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \\
  --user-data-dir="$HOME/chrome-profiles/${profileSlug}" \\
  --remote-debugging-address=127.0.0.1 \\
  --remote-debugging-port=${port} \\
  --remote-allow-origins='*' \\
  --no-first-run \\
  --no-default-browser-check \\
  "$@"
`;
}

function matchKey(row, key) {
  if (row.id === key) return true;
  if (String(row.port) === String(key)) return true;
  if (row.name && row.name.toLowerCase() === String(key).toLowerCase()) return true;
  return false;
}

/**
 * Lista CDPs a partir dos `start-*.sh` no disco.
 * @returns {object[]}
 */
export function listCdps() {
  if (!existsSync(CHROME_CDP_DIR)) return [];
  const files = readdirSync(CHROME_CDP_DIR)
    .filter((f) => /^start-.*\.sh$/.test(f) && !f.includes('firefox'))
    .map((f) => join(CHROME_CDP_DIR, f));
  const rows = [];
  for (const file of files) {
    try {
      const row = parseStartScript(file);
      if (row) rows.push(row);
    } catch {
      /* script inválido */
    }
  }
  return rows.sort((a, b) => a.port - b.port);
}

/** @param {string|number} key id | port | name */
export function getCdp(key) {
  return listCdps().find((c) => matchKey(c, key)) || null;
}

export function resolveStartScript(startScriptOrId) {
  if (!startScriptOrId) return null;
  const byId = scriptPathForId(String(startScriptOrId));
  if (existsSync(byId)) return byId;
  const row = getCdp(startScriptOrId);
  if (row?.startScriptPath) return row.startScriptPath;
  return null;
}

/**
 * Cria `start-{id}.sh` + pasta do perfil no disco.
 * @param {{ name: string, port: number, id?: string, platform?: string, userDataDir?: string }} input
 */
export function createCdp(input) {
  const name = String(input.name || '').trim();
  const port = Number(input.port);
  if (!name) throw new Error('name obrigatório');
  if (!Number.isFinite(port) || port < 1) throw new Error('port inválida');
  if (listCdps().some((c) => c.port === port)) {
    throw new Error(`porta ${port} já existe no disco`);
  }

  const id = String(input.id || slugify(name)).trim();
  const path = scriptPathForId(id);
  if (existsSync(path)) throw new Error(`script já existe: ${path}`);

  let profileSlug = id;
  if (input.userDataDir) {
    const exp = expandHome(input.userDataDir);
    const m = exp.match(/chrome-profiles\/([^/]+)\/?$/);
    if (m) profileSlug = m[1];
  }

  const body = renderStartScript({
    name,
    platform: String(input.platform || '').trim(),
    port,
    profileSlug,
  });
  writeFileSync(path, body, { mode: 0o755 });
  chmodSync(path, 0o755);

  const profileDir = join(PROFILES_DIR, profileSlug);
  mkdirSync(profileDir, { recursive: true });

  const row = getCdp(id);
  if (!row) throw new Error('falha ao re-ler script criado');
  return row;
}

/**
 * Reescreve o start script no disco.
 */
export function updateCdp(id, patch) {
  const cur = getCdp(id);
  if (!cur) throw new Error(`cdp não encontrado: ${id}`);
  const name = patch.name != null ? String(patch.name).trim() : cur.name;
  const platform =
    patch.platform != null ? String(patch.platform).trim() : cur.platform;
  const port = patch.port != null ? Number(patch.port) : cur.port;
  if (listCdps().some((c) => c.id !== cur.id && c.port === port)) {
    throw new Error(`porta ${port} já existe`);
  }
  const profileSlug =
    cur.userDataDirExpanded?.split('/').filter(Boolean).pop() || cur.id;
  const body = renderStartScript({ name, platform, port, profileSlug });
  writeFileSync(cur.startScriptPath, body, { mode: 0o755 });
  chmodSync(cur.startScriptPath, 0o755);
  return getCdp(cur.id);
}

/**
 * Remove só o `start-*.sh` do id pedido.
 * Nunca apaga perfil em `~/chrome-profiles` a menos que `deleteProfile: true`
 * (default false). Não use em CDPs de lab sem necessidade.
 * @returns {boolean}
 */
export function removeCdp(id, { deleteProfile = false } = {}) {
  const row = getCdp(id);
  if (!row) return false;
  unlinkSync(row.startScriptPath);
  if (
    deleteProfile === true &&
    row.userDataDirExpanded &&
    existsSync(row.userDataDirExpanded)
  ) {
    execFileSync('rm', ['-rf', row.userDataDirExpanded]);
  }
  return true;
}

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
    ...row,
    status: up ? 'up' : 'down',
    cdpUrl: `http://127.0.0.1:${row.port}`,
    version,
    startScriptResolved: row.startScriptPath,
  };
}

export async function startCdp(id, { url } = {}) {
  const row = getCdp(id);
  if (!row) throw new Error(`cdp não encontrado: ${id}`);
  const st = await statusCdp(row.id);
  if (st.status === 'up') return { ...st, already: true };
  const script = row.startScriptPath;
  if (!existsSync(script)) throw new Error(`script ausente: ${script}`);
  const args = [];
  if (url) args.push(url);
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
    /* nada */
  }
  await sleep(400);
  return statusCdp(row.id);
}

export async function connectCdp(id, connectOpts = {}) {
  const row = getCdp(id);
  if (!row) throw new Error(`cdp não encontrado: ${id}`);
  let st = await statusCdp(row.id);
  if (st.status !== 'up') {
    st = await startCdp(row.id, { url: connectOpts.url });
  }
  return connect({
    cdpUrl: st.cdpUrl,
    url: connectOpts.url,
    urlIncludes: connectOpts.urlIncludes,
    newTab: connectOpts.newTab,
    chromeApp: connectOpts.chromeApp,
  });
}

/** Diretório canônico dos scripts (fonte no disco). */
export function scriptsDir() {
  return CHROME_CDP_DIR;
}

export function profilesDir() {
  return PROFILES_DIR;
}

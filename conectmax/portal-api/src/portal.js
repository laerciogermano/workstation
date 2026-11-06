import { homedir } from 'node:os';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseFaturasHtml } from './parse-faturas.js';

const BASE = 'https://franqueado.conectmax.com';
const CONFIG_DIR = join(homedir(), '.config/conectmax-franqueado');
const CREDS_PATH = join(CONFIG_DIR, 'credentials.env');
const COOKIE_PATH = join(CONFIG_DIR, 'cookies.txt');

/** @type {{ user: string, pass: string } | null} */
let cachedCreds = null;

async function loadCreds() {
  if (cachedCreds) return cachedCreds;
  const text = await readFile(CREDS_PATH, 'latin1');
  const map = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    map[k] = v;
  }
  const user = map.CONECTMAX_FRANQUEADO_USER;
  const pass = map.CONECTMAX_FRANQUEADO_PASS;
  if (!user || !pass) {
    throw new Error(`faltando USER/PASS em ${CREDS_PATH}`);
  }
  cachedCreds = { user, pass };
  return cachedCreds;
}

function pickCookie(res) {
  const fromGetSet = res.headers.getSetCookie?.() ?? [];
  const headers = fromGetSet.length
    ? fromGetSet
    : [res.headers.get('set-cookie')].filter(Boolean);
  const parts = [];
  for (const h of headers) {
    const nv = String(h).split(';')[0]?.trim();
    if (nv) parts.push(nv);
  }
  return parts.length ? parts.join('; ') : null;
}

async function saveCookie(cookie) {
  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(COOKIE_PATH, `# portal-api Cookie header\n${cookie}\n`, {
    mode: 0o600,
  });
}

/** Aceita Cookie header cru ou jar Netscape (curl -c). */
async function readSavedCookie() {
  try {
    const text = await readFile(COOKIE_PATH, 'utf8');
    const pairs = [];
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      if (line.includes('\t')) {
        const cols = line.split('\t');
        if (cols.length >= 7) pairs.push(`${cols[5]}=${cols[6]}`);
        continue;
      }
      if (line.includes('=')) return line;
    }
    return pairs.length ? pairs.join('; ') : null;
  } catch {
    return null;
  }
}

export async function login() {
  const { user, pass } = await loadCreds();
  const body = new URLSearchParams({ usuario: user, senha: pass });
  const res = await fetch(`${BASE}/franqueado/ajax/login.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    redirect: 'manual',
  });
  const text = await res.text();
  const cookie = pickCookie(res);
  if (!cookie || !/location/i.test(text)) {
    throw new Error(`login falhou: ${text.slice(0, 200)}`);
  }
  await saveCookie(cookie);
  return cookie;
}

async function ensureCookie() {
  const saved = await readSavedCookie();
  if (saved && !saved.includes('\t')) {
    // raw Cookie header from this API
    return saved;
  }
  return login();
}

/**
 * @param {{ dataInicial?: string, dataFinal?: string, forceLogin?: boolean }} opts
 */
export async function fetchContasAReceber(opts = {}) {
  const dataInicial = opts.dataInicial || '01/01/2025';
  const dataFinal = opts.dataFinal || '31/12/2026';
  let cookie = opts.forceLogin ? await login() : await ensureCookie();

  const url = new URL(`${BASE}/franqueado/`);
  url.searchParams.set('page', 'contasareceber');
  url.searchParams.set('data_inicial', dataInicial);
  url.searchParams.set('data_final', dataFinal);

  async function readHtml(res) {
    // Portal responde ISO-8859-1; text() UTF-8 corrompe "nº" e quebra o parse.
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.toString('latin1');
  }

  let res = await fetch(url, {
    headers: { Cookie: cookie },
    redirect: 'follow',
  });
  let html = await readHtml(res);

  if (/name=["']usuario["']/i.test(html) || (/login\.php/i.test(html) && /senha/i.test(html))) {
    cookie = await login();
    res = await fetch(url, {
      headers: { Cookie: cookie },
      redirect: 'follow',
    });
    html = await readHtml(res);
  }

  if (/name=["']usuario["']/i.test(html)) {
    throw new Error('sessão inválida após re-login');
  }

  return {
    dataInicial,
    dataFinal,
    html,
    faturas: parseFaturasHtml(html),
  };
}

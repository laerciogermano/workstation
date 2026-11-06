import { homedir } from 'node:os';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { isLoginPage, maxCurrentPage } from './html-utils.js';

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

async function ensureCookie(forceLogin = false) {
  if (forceLogin) return login();
  const saved = await readSavedCookie();
  if (saved) return saved;
  return login();
}

async function readHtml(res) {
  const buf = Buffer.from(await res.arrayBuffer());
  return buf.toString('latin1');
}

/**
 * @param {string} page
 * @param {Record<string, string|number|undefined|null>} query
 * @param {{ forceLogin?: boolean }} [opts]
 */
export async function fetchPageHtml(page, query = {}, opts = {}) {
  let cookie = await ensureCookie(opts.forceLogin);
  const url = new URL(`${BASE}/franqueado/`);
  url.searchParams.set('page', page);
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '') continue;
    url.searchParams.set(k, String(v));
  }

  let res = await fetch(url, { headers: { Cookie: cookie }, redirect: 'follow' });
  let html = await readHtml(res);

  if (isLoginPage(html)) {
    cookie = await login();
    res = await fetch(url, { headers: { Cookie: cookie }, redirect: 'follow' });
    html = await readHtml(res);
  }
  if (isLoginPage(html)) throw new Error('sessão inválida após re-login');
  return { html, cookie, url: url.toString() };
}

/**
 * Busca 1 página ou todas (`all`).
 * @param {string} page
 * @param {Record<string, string|number|undefined|null>} query
 * @param {{ forceLogin?: boolean, all?: boolean, currentPage?: number }} [opts]
 */
export async function fetchPageHtmlPaginated(page, query = {}, opts = {}) {
  const q = { ...query };
  if (opts.currentPage) q.current_page = opts.currentPage;
  const first = await fetchPageHtml(page, q, opts);
  if (!opts.all) return { pages: [first.html], ...first };

  const last = maxCurrentPage(first.html);
  const pages = [first.html];
  for (let p = 2; p <= last; p++) {
    const next = await fetchPageHtml(page, { ...query, current_page: p }, {
      forceLogin: false,
    });
    pages.push(next.html);
  }
  return { pages, html: pages.join('\n'), cookie: first.cookie };
}

/**
 * @param {string} pathRel ex: /franqueado/ajax/faturamento/relatorio_excel.php
 * @param {Record<string, string|number|undefined|null>} query
 */
export async function fetchAjax(pathRel, query = {}, opts = {}) {
  let cookie = await ensureCookie(opts.forceLogin);
  const method = (opts.method || 'GET').toUpperCase();
  const url = new URL(pathRel.startsWith('http') ? pathRel : `${BASE}${pathRel}`);
  /** @type {RequestInit} */
  const init = { headers: { Cookie: cookie }, redirect: 'follow', method };
  if (method === 'GET') {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === '') continue;
      url.searchParams.set(k, String(v));
    }
  } else {
    const body = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === '') continue;
      body.set(k, String(v));
    }
    init.headers = {
      Cookie: cookie,
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    init.body = body;
  }
  let res = await fetch(url, init);
  let body = await readHtml(res);
  if (isLoginPage(body)) {
    cookie = await login();
    init.headers = {
      ...(init.headers || {}),
      Cookie: cookie,
    };
    res = await fetch(url, init);
    body = await readHtml(res);
  }
  return { body, cookie, url: url.toString(), contentType: res.headers.get('content-type') };
}

/** @deprecated use fetchPageHtml — mantido p/ compat */
export async function fetchContasAReceber(opts = {}) {
  const dataInicial = opts.dataInicial || '01/01/2025';
  const dataFinal = opts.dataFinal || '31/12/2026';
  const { html } = await fetchPageHtml(
    'contasareceber',
    { data_inicial: dataInicial, data_final: dataFinal },
    opts,
  );
  const { parseFaturasHtml } = await import('./parse-faturas.js');
  return { dataInicial, dataFinal, html, faturas: parseFaturasHtml(html) };
}

export { BASE };

#!/usr/bin/env node
/**
 * Extrair leads LinkedIn via CDP (web) — espelho de login-extract-profiles (AVD).
 *
 * Fluxo:
 *   1. Abre /search/results/people/?keywords=QUERY (já na aba People)
 *   2. Lê cards da lista (nome, headline, local, ação, /in/…)
 *   3. Por card elegível (Connect|Pending|Message): abre perfil → header + URL
 *   4. Skip se match na base / URL já 1:1; senão salva JSON (+ POST API se configurada)
 *   5. Volta à busca, scroll até -n ou fim da lista / "LinkedIn Member"
 *
 * Uso:
 *   CDP_URL=http://127.0.0.1:9224 node linkedin-extract-leads-cdp.mjs
 *   CDP_URL=… node linkedin-extract-leads-cdp.mjs -n 5 --query "comprador"
 *   PROFILES_API_URL=http://localhost:3000 AGENT_ID=… AGENT_API_KEY=… \\
 *     CDP_URL=… node linkedin-extract-leads-cdp.mjs -n 5 --query "tech recruiter"
 *
 * Saída: screenshots/linkedin-extract-leads-cdp/<stamp>/profiles.json
 * Cliques: Input.dispatchMouseEvent. Regra: se aparecer Pular/Skip, clica.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '../..');
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9224';
const PROFILES_API_URL = (process.env.PROFILES_API_URL || '').replace(/\/$/, '');
const AGENT_API_KEY = (process.env.AGENT_API_KEY || '').trim();
const AGENT_ID = (process.env.AGENT_ID || '').trim();
const SCROLL_STABLE_NEEDED = Number(process.env.EXTRACT_SCROLL_STABLE || 4);
const PEOPLE_ACTIONS = new Set(['Connect', 'Pending', 'Message']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function arg(...flags) {
  let found = '';
  const argv = process.argv;
  for (let i = 0; i < argv.length; i++) {
    for (const flag of flags) {
      if (argv[i] === flag && argv[i + 1] && !String(argv[i + 1]).startsWith('-')) {
        found = argv[i + 1];
      } else if (String(argv[i]).startsWith(flag + '=')) {
        found = argv[i].slice(flag.length + 1);
      }
    }
  }
  return found;
}

function parseArgs() {
  let maxProfiles = 5;
  let query = 'comprador';
  const n = arg('--max-profiles', '--limit', '-n');
  if (n) {
    const v = Number(n);
    if (Number.isFinite(v) && v >= 1) maxProfiles = Math.min(500, Math.floor(v));
  }
  const q = arg('--query', '--q', '--search');
  if (q) query = String(q).trim().slice(0, 200) || query;
  return { maxProfiles, query };
}

function apiHeaders(extra = {}) {
  return {
    'content-type': 'application/json',
    ...(AGENT_API_KEY ? { 'x-api-key': AGENT_API_KEY } : {}),
    ...extra,
  };
}

function searchQueryFromCard({ title, current }) {
  const pick = (t) =>
    String(t || '')
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[^A-Za-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(/\s+/)[0] || '';
  return pick(title) || pick(String(current || '').split(/\s+(?:at|@)\s+/i)[0]) || null;
}

function peopleSearchUrl(query) {
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
}

function normalizeProfileUrl(href) {
  try {
    const u = new URL(href, 'https://www.linkedin.com');
    if (!/\/in\//i.test(u.pathname)) return null;
    const m = u.pathname.match(/\/in\/([^/?#]+)/i);
    if (!m) return null;
    const slug = decodeURIComponent(m[1]).replace(/\/+$/, '');
    if (!slug || /^(me|edit|detail)$/i.test(slug)) return null;
    return `https://www.linkedin.com/in/${slug}/`;
  } catch {
    return null;
  }
}

function connectionStatusFromInviteStatus(inviteStatus) {
  const s = String(inviteStatus || '').toLowerCase().trim();
  if (s === 'pending') return 1;
  if (s === 'connected') return 2;
  if (s === 'connect') return 0;
  return null;
}

async function json(path) {
  const r = await fetch(`${CDP}${path}`);
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json();
}

function session(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const ready = new Promise((ok, err) => {
    ws.addEventListener('open', ok);
    ws.addEventListener('error', err);
  });
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id == null || !pending.has(msg.id)) return;
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
  });
  async function send(method, params = {}) {
    await ready;
    const i = ++id;
    return new Promise((resolve, reject) => {
      pending.set(i, { resolve, reject });
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  }
  return { send, close: () => ws.close(), ready };
}

function profileRow(profile) {
  const f = profile.fields || {};
  const h = profile.header || {};
  const title = f.title || h.headline || null;
  const current = f.current || h.company || null;
  return {
    name: h.name || f.name || profile.name || null,
    title,
    searchQuery: searchQueryFromCard({ title, current }),
    level: h.connectionDegree || f.level || null,
    connection: f.connection || profile.action || null,
    city: h.location || f.city || null,
    mutualConnections: h.mutualConnections || f.mutualConnections || null,
    current,
    past: f.past || null,
    profileUrl: profile.profileUrl || null,
    headline: h.headline || null,
    company: h.company || null,
    connections: h.connections || null,
    inviteStatus: h.inviteStatus || null,
    canConnect: h.canConnect ?? null,
    canMessage: h.canMessage ?? null,
    extractedAt: profile.extractedAt || null,
    round: profile.round ?? null,
  };
}

async function matchConnectionInBase(card) {
  if (!PROFILES_API_URL) return { matched: false };
  const params = new URLSearchParams();
  params.set('name', String(card.name || '').trim());
  if (card.title) params.set('title', String(card.title));
  if (card.city) params.set('city', String(card.city));
  if (card.current) params.set('current', String(card.current));
  const url = `${PROFILES_API_URL}/client-connections-linkedin/match?${params}`;
  try {
    const res = await fetch(url, { headers: apiHeaders() });
    if (!res.ok) return { matched: false };
    const body = await res.json();
    return {
      matched: Boolean(body?.matched),
      matchScore: body?.matchScore,
      clienteNome: body?.clienteNome ?? null,
      profileId: body?.profileId ?? null,
      source: body?.source ?? null,
    };
  } catch (e) {
    console.log(`   ⚠ match falhou — segue: ${e.message || e}`);
    return { matched: false };
  }
}

async function profileUrlAlreadyInBase(rawUrl) {
  if (!PROFILES_API_URL || !rawUrl) return { exists: false };
  const params = new URLSearchParams({ url: String(rawUrl) });
  const url = `${PROFILES_API_URL}/profile-details/by-url?${params}`;
  try {
    const res = await fetch(url, { headers: apiHeaders() });
    if (!res.ok) return { exists: false };
    const body = await res.json();
    return {
      exists: Boolean(body?.exists),
      profileId: body?.profileId ?? null,
      profileUrl: body?.profileUrl ?? null,
    };
  } catch (e) {
    console.log(`   ⚠ by-url falhou — trata como novo: ${e.message || e}`);
    return { exists: false };
  }
}

async function reportExtractFails(viewportFails) {
  if (!PROFILES_API_URL || !viewportFails) return;
  try {
    const res = await fetch(`${PROFILES_API_URL}/extract/fails`, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ viewportFails, fails: viewportFails }),
    });
    if (!res.ok) console.log(`   ⚠ POST extract/fails → ${res.status}`);
  } catch (e) {
    console.log(`   ⚠ extract/fails: ${e.message || e}`);
  }
}

async function postProfileToApi(profile) {
  if (!PROFILES_API_URL) return null;
  const res = await fetch(`${PROFILES_API_URL}/profiles`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(profileRow(profile)),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`POST /profiles → ${res.status}${body ? `: ${body.slice(0, 200)}` : ''}`);
  }
  return res.json().catch(() => null);
}

async function postProfileDetailToApi(profile, profileId) {
  if (!PROFILES_API_URL || !profileId) return null;
  const h = profile.header || {};
  const res = await fetch(`${PROFILES_API_URL}/profile-details`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({
      profileId,
      name: h.name || profile.name || null,
      headline: h.headline || null,
      company: h.company || null,
      location: h.location || null,
      connections: h.connections || null,
      mutualConnections: h.mutualConnections || null,
      canConnect: h.canConnect ?? null,
      canMessage: h.canMessage ?? null,
      inviteStatus: h.inviteStatus || null,
      profileUrl: profile.profileUrl || null,
      connectionDegree: h.connectionDegree || null,
      extractedAt: profile.extractedAt || null,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `POST /profile-details → ${res.status}${body ? `: ${body.slice(0, 200)}` : ''}`,
    );
  }
  return res.json().catch(() => null);
}

async function syncConnection(profile) {
  if (!PROFILES_API_URL || !profile.profileUrl) {
    return { notified: false, reason: 'sem API/url' };
  }
  const status = connectionStatusFromInviteStatus(
    profile.header?.inviteStatus || profile.inviteStatus,
  );
  if (status == null) return { notified: false, reason: 'inviteStatus ausente' };
  if (status === 0 && !AGENT_ID) {
    return { notified: false, reason: 'connect sem AGENT_ID — só perfil' };
  }
  const res = await fetch(`${PROFILES_API_URL}/client-connections-linkedin`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({
      profileUrl: profile.profileUrl,
      agentId: AGENT_ID || 'default',
      status,
      peerName: profile.header?.name || profile.name || null,
      steps: ['linkedin-extract-leads-cdp'],
      ...(status === 1 ? { invitedAt: new Date().toISOString() } : {}),
      ...(status === 2 ? { connectedAt: new Date().toISOString() } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `POST client-connections-linkedin → ${res.status}${body ? `: ${body.slice(0, 200)}` : ''}`,
    );
  }
  return { notified: true, status };
}

async function main() {
  const { maxProfiles, query } = parseArgs();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = resolve(ROOT, 'screenshots', 'linkedin-extract-leads-cdp', stamp);
  mkdirSync(outDir, { recursive: true });

  console.log({
    CDP,
    query,
    maxProfiles,
    outDir,
    api: PROFILES_API_URL || null,
    agentId: AGENT_ID || null,
  });

  const pages = await json('/json/list');
  const page =
    pages.find((t) => t.type === 'page' && /linkedin\.com/.test(t.url || '') && !/login|chrome:\/\//.test(t.url || '')) ||
    pages.find((t) => t.type === 'page' && !String(t.url || '').startsWith('chrome://'));
  if (!page?.webSocketDebuggerUrl) throw new Error(`sem pagina LinkedIn em ${CDP}`);

  const s = session(page.webSocketDebuggerUrl);
  await s.ready;
  await s.send('Page.enable');
  await s.send('Runtime.enable');
  await s.send('Page.bringToFront');

  const evalv = async (expression) => {
    const r = await s.send('Runtime.evaluate', {
      returnByValue: true,
      awaitPromise: true,
      expression,
    });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result?.value;
  };

  const clickXY = async (x, y) => {
    await s.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x,
      y,
      button: 'left',
      clickCount: 1,
    });
    await s.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x,
      y,
      button: 'left',
      clickCount: 1,
    });
  };

  const clickSkipIfAny = async () => {
    const sk = await evalv(`(() => {
      const hits = [...document.querySelectorAll('button,a,[role=button]')].map((e) => {
        if (!e.getClientRects().length) return null;
        const t = (e.innerText || e.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim();
        if (!/^pular$|^skip$/i.test(t)) return null;
        const b = e.getBoundingClientRect();
        if (b.width < 2 || b.height < 2) return null;
        return { text: t, x: b.x + b.width / 2, y: b.y + b.height / 2, area: b.width * b.height };
      }).filter(Boolean);
      if (!hits.length) return null;
      hits.sort((a, b) => b.y - a.y || b.area - a.area);
      return hits[0];
    })()`);
    if (!sk) return false;
    console.log('   click', sk.text);
    await clickXY(sk.x, sk.y);
    await sleep(1000);
    return true;
  };

  const waitPeopleResults = async (timeoutMs = 20_000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < timeoutMs) {
      await clickSkipIfAny();
      const st = await evalv(`(() => {
        const url = location.href;
        const body = (document.body?.innerText || '').slice(0, 400);
        const cards = document.querySelectorAll(
          'li.reusable-search__result-container, div.entity-result, ul[role=list] > li',
        ).length;
        const links = [...document.querySelectorAll('a[href*="/in/"]')].length;
        const member = /linkedin\\s*member|membro\\s+do\\s+linkedin/i.test(body);
        return { url, cards, links, member, ready: cards > 0 || links > 2 };
      })()`);
      if (st?.ready || st?.member) return st;
      await sleep(800);
    }
    throw new Error('timeout aguardando resultados People');
  };

  /** Cards visíveis na busca People. */
  const listCards = () =>
    evalv(`(() => {
      const normUrl = (href) => {
        try {
          const u = new URL(href, location.origin);
          const m = u.pathname.match(/\\/in\\/([^/?#]+)/i);
          if (!m) return null;
          const slug = decodeURIComponent(m[1]).replace(/\\/+$/, '');
          if (!slug || /^(me|edit|detail)$/i.test(slug)) return null;
          return 'https://www.linkedin.com/in/' + slug + '/';
        } catch { return null; }
      };
      const parseAction = (raw) => {
        const t = String(raw || '').replace(/\\s+/g, ' ').trim();
        if (/\\bpending\\b|pendente/i.test(t)) return 'Pending';
        if (/\\bconnect\\b|conectar|convidar/i.test(t)) return 'Connect';
        if (/\\bmessage\\b|mensagem/i.test(t)) return 'Message';
        if (/\\bfollow\\b|seguir/i.test(t)) return 'Follow';
        return null;
      };
      const roots = [
        ...document.querySelectorAll('li.reusable-search__result-container'),
        ...document.querySelectorAll('div.entity-result'),
        ...document.querySelectorAll('ul[role=list] > li'),
      ];
      const seen = new Set();
      const out = [];
      const bodyLimit = /linkedin\\s*member|membro\\s+do\\s+linkedin/i.test(
        document.body?.innerText || '',
      );

      for (const root of roots) {
        const a = root.querySelector('a[href*="/in/"]');
        if (!a || !a.getClientRects().length) continue;
        const profileUrl = normUrl(a.href);
        if (!profileUrl || seen.has(profileUrl)) continue;
        const nameEl =
          root.querySelector('.entity-result__title-text a span[aria-hidden="true"]') ||
          root.querySelector('.entity-result__title-text a') ||
          root.querySelector('span[aria-hidden="true"]') ||
          a;
        let name = (nameEl.innerText || a.innerText || '')
          .replace(/\\s+/g, ' ')
          .replace(/·.*$/, '')
          .replace(/Verified|Verificado/gi, '')
          .trim();
        if (!name || name.length < 3) continue;
        if (/^linkedin\\s*member$/i.test(name) || /^membro\\s+do\\s+linkedin$/i.test(name)) {
          return { memberLimit: true, cards: out };
        }
        const title =
          (root.querySelector('.entity-result__primary-subtitle')?.innerText ||
            root.querySelector('.entity-result__summary')?.innerText ||
            '')
            .replace(/\\s+/g, ' ')
            .trim() || null;
        const city =
          (root.querySelector('.entity-result__secondary-subtitle')?.innerText || '')
            .replace(/\\s+/g, ' ')
            .trim() || null;
        const btn = [...root.querySelectorAll('button, a[role=button], div[role=button]')].find(
          (b) => parseAction(b.innerText || b.getAttribute('aria-label') || ''),
        );
        const action = parseAction(btn?.innerText || btn?.getAttribute('aria-label') || '') || null;
        const degree =
          (root.innerText.match(/\\b(\\d+(?:st|nd|rd|th))\\b/i) || [])[1] || null;
        const b = a.getBoundingClientRect();
        seen.add(profileUrl);
        out.push({
          key: profileUrl,
          name,
          title,
          city,
          current: title,
          level: degree,
          action,
          profileUrl,
          x: b.x + b.width / 2,
          y: b.y + b.height / 2,
        });
      }
      return { memberLimit: bodyLimit && out.length === 0, cards: out };
    })()`);

  const extractProfileHeader = () =>
    evalv(`(() => {
      const normUrl = (href) => {
        try {
          const u = new URL(href || location.href, location.origin);
          const m = u.pathname.match(/\\/in\\/([^/?#]+)/i);
          if (!m) return null;
          const slug = decodeURIComponent(m[1]).replace(/\\/+$/, '');
          if (!slug || /^(me|edit|detail)$/i.test(slug)) return null;
          return 'https://www.linkedin.com/in/' + slug + '/';
        } catch { return null; }
      };
      const h1 = document.querySelector('h1');
      const name = (h1?.innerText || '').replace(/\\s+/g, ' ').trim() || null;
      const top = document.querySelector('main section') || document.querySelector('main') || document.body;
      const lines = (top?.innerText || '')
        .split('\\n')
        .map((t) => t.replace(/\\s+/g, ' ').trim())
        .filter(Boolean);
      let headline = null;
      let location = null;
      let company = null;
      let connections = null;
      let mutualConnections = null;
      let connectionDegree = null;
      for (const line of lines.slice(0, 40)) {
        if (!headline && name && line !== name && line.length > 8 && line.length < 180 &&
            !/^(connect|pending|message|seguir|follow|more|abrir|open)/i.test(line) &&
            !/\\d+\\s*(connections|conex)/i.test(line) &&
            !/contato|contact/i.test(line)) {
          headline = line;
          continue;
        }
        if (!location && /brasil|brazil|,\\s*[A-Z]{2}\\b|remote|remoto|são paulo|sao paulo|rio de/i.test(line) && line.length < 80) {
          location = line;
        }
        const cm = line.match(/(\\d[\\d.,]*)\\s*(connections|conex[oõ]es)/i);
        if (cm) connections = cm[0];
        if (/mutual|em comum/i.test(line)) mutualConnections = line;
        const deg = line.match(/\\b(\\d+(?:st|nd|rd|th))\\b/i);
        if (deg) connectionDegree = deg[1];
      }
      if (headline) {
        const at = headline.split(/\\s+(?:at|@|na|no|em)\\s+/i);
        if (at.length > 1) company = at[at.length - 1].trim();
      }
      const btnTexts = [...document.querySelectorAll('button, a[role=button]')].map(
        (b) => (b.innerText || b.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim(),
      );
      let inviteStatus = null;
      let canConnect = false;
      let canMessage = false;
      for (const t of btnTexts) {
        if (/\\bpending\\b|pendente|invitation sent|convite enviado/i.test(t)) inviteStatus = 'pending';
        else if (/^connect$|^conectar$|convidar para|invite/i.test(t) && !inviteStatus) {
          inviteStatus = 'connect';
          canConnect = true;
        } else if (/^message$|^mensagem$|enviar mensagem/i.test(t)) {
          canMessage = true;
          if (!inviteStatus) inviteStatus = 'connected';
        }
      }
      return {
        profileUrl: normUrl(location.href),
        header: {
          name,
          headline,
          company,
          location,
          connections,
          mutualConnections,
          connectionDegree,
          canConnect,
          canMessage,
          inviteStatus,
        },
      };
    })()`);

  const goBackToSearch = async (searchUrl) => {
    const cur = await evalv('location.href');
    if (/\/search\/results\/people/i.test(cur || '')) return;
    await s.send('Page.navigate', { url: searchUrl });
    await sleep(2500);
    await waitPeopleResults(15_000);
  };

  const scrollResults = async () => {
    await evalv(`(() => {
      window.scrollBy(0, Math.max(480, Math.floor(window.innerHeight * 0.85)));
      const ul = document.querySelector('ul.reusable-search__entity-result-list, div.search-results-container');
      if (ul) ul.scrollBy?.(0, 480);
      return true;
    })()`);
    await sleep(1200);
  };

  // --- 1) Busca People ---
  const searchUrl = peopleSearchUrl(query);
  console.log('1) Navegar People…', searchUrl);
  await s.send('Page.navigate', { url: searchUrl });
  await sleep(2800);
  await waitPeopleResults();

  /** @type {object[]} */
  const saved = [];
  /** @type {object[]} */
  const rows = [];
  const seen = new Set();
  let contentStable = 0;
  let prevFp = null;
  let round = 0;

  const writeProfiles = () => {
    const path = join(outDir, 'profiles.json');
    writeFileSync(path, JSON.stringify(rows, null, 2), 'utf8');
    return path;
  };
  writeProfiles();

  console.log(`2) Extrair até ${maxProfiles}…`);
  while (saved.length < maxProfiles && round < 500) {
    round += 1;
    console.log(`${round}) lista… (${saved.length}/${maxProfiles})`);
    await clickSkipIfAny();
    const listed = await listCards();
    if (listed?.memberLimit) {
      console.log('   fim: LinkedIn Member na lista — encerrando');
      break;
    }
    const cards = Array.isArray(listed?.cards) ? listed.cards : [];
    writeFileSync(
      join(outDir, `list-round-${String(round).padStart(3, '0')}.json`),
      JSON.stringify(cards, null, 2),
      'utf8',
    );
    const fresh = cards.filter((c) => c?.key && !seen.has(c.key));
    console.log(`   novos: ${fresh.length}${fresh.length ? ` — ${fresh.map((c) => c.name).join(' | ')}` : ''}`);

    let viewportFails = 0;
    /** @type {object|null} */
    let chosen = null;
    for (const c of fresh) {
      seen.add(c.key);
      if (!PEOPLE_ACTIONS.has(c.action)) {
        console.log(`   skip (action=${c.action || '-'}): ${c.name}`);
        continue;
      }
      const match = await matchConnectionInBase(c);
      if (match.matched) {
        viewportFails += 1;
        console.log(
          `   skip (já na base score=${Number(match.matchScore || 0).toFixed(3)}): ${c.name}${match.clienteNome ? ` ≈ ${match.clienteNome}` : ''}`,
        );
        continue;
      }
      chosen = c;
      break;
    }
    if (viewportFails) await reportExtractFails(viewportFails);

    const fp = cards.map((c) => c.key).join('|');
    if (!chosen) {
      if (prevFp != null && fp === prevFp) {
        contentStable += 1;
        console.log(`   scroll? lista igual (${contentStable}/${SCROLL_STABLE_NEEDED})`);
      } else {
        contentStable = 0;
        prevFp = fp;
      }
      if (contentStable >= SCROLL_STABLE_NEEDED) {
        console.log('   fim: scroll não avança — encerrando');
        break;
      }
      console.log('   nenhum elegível — scroll…');
      await scrollResults();
      continue;
    }

    const p = chosen;
    const index = saved.length + 1;
    console.log(`   → abrir "${p.name}" ${p.profileUrl}`);
    await s.send('Page.navigate', { url: p.profileUrl });
    await sleep(2800);
    await clickSkipIfAny();

    let pageData = { header: {}, profileUrl: null };
    try {
      pageData = (await extractProfileHeader()) || pageData;
      if (!pageData.profileUrl) pageData.profileUrl = normalizeProfileUrl(p.profileUrl);
      writeFileSync(
        join(outDir, `profile-${String(index).padStart(3, '0')}-page.json`),
        JSON.stringify(pageData, null, 2),
        'utf8',
      );
    } catch (e) {
      console.error(`   ⚠ extrair perfil falhou: ${e.message || e}`);
    }

    if (!pageData.profileUrl) {
      console.log(`   skip save (sem profileUrl): ${p.name}`);
      await goBackToSearch(searchUrl);
      contentStable = 0;
      prevFp = null;
      continue;
    }

    const urlHit = await profileUrlAlreadyInBase(pageData.profileUrl);
    if (urlHit.exists) {
      console.log(
        `   skip save (URL já na base): ${pageData.profileUrl} → profileId=${urlHit.profileId || '-'}`,
      );
      try {
        const sync = await syncConnection({
          profileUrl: pageData.profileUrl,
          header: pageData.header,
          name: pageData.header?.name || p.name,
        });
        if (sync.notified) console.log(`   → conexão status=${sync.status}`);
      } catch (e) {
        console.error(`   ⚠ sync conexão: ${e.message || e}`);
      }
      await goBackToSearch(searchUrl);
      contentStable = 0;
      prevFp = null;
      continue;
    }

    const profile = {
      index,
      name: pageData.header?.name || p.name,
      action: p.action,
      fields: {
        name: p.name,
        title: p.title,
        city: p.city,
        current: p.current,
        level: p.level,
        connection: p.action,
      },
      header: pageData.header || {},
      profileUrl: pageData.profileUrl,
      extractedAt: new Date().toISOString(),
      round,
    };
    saved.push(profile);
    rows.push(profileRow(profile));
    const path = writeProfiles();
    console.log(`   → ${path} (${rows.length})`);
    console.log(JSON.stringify(profileRow(profile), null, 2));

    if (PROFILES_API_URL) {
      try {
        const savedApi = await postProfileToApi(profile);
        const profileId = savedApi?.id || null;
        console.log(`   → POST /profiles${profileId ? ` id=${profileId}` : ''}`);
        if (profileId) {
          try {
            await postProfileDetailToApi(profile, profileId);
            console.log('   → POST /profile-details');
          } catch (e) {
            console.error(`   ⚠ profile-details: ${e.message || e}`);
          }
        }
        try {
          const sync = await syncConnection(profile);
          if (sync.notified) {
            console.log(`   → conexão status=${sync.status}`);
          } else {
            console.log(`   → conexão skip (${sync.reason || 'n/a'})`);
          }
        } catch (e) {
          console.error(`   ⚠ conexão: ${e.message || e}`);
        }
      } catch (e) {
        console.error(`   ⚠ POST API: ${e.message || e}`);
      }
    }

    await goBackToSearch(searchUrl);
    contentStable = 0;
    prevFp = null;
  }

  writeProfiles();
  console.log(`OK — ${saved.length} perfis`);
  console.log(`profiles.json: ${join(outDir, 'profiles.json')}`);
  s.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

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
        const body = (document.body?.innerText || '').slice(0, 500);
        const links = [...document.querySelectorAll('a[href*="/in/"]')].length;
        const member = /linkedin\\s*member|membro\\s+do\\s+linkedin/i.test(body);
        const hasPeople =
          /\\bpessoas\\b|\\bpeople\\b/i.test(body) &&
          /conectar|connect|pendente|pending|mensagem|message/i.test(body);
        return { url: location.href, links, member, ready: links >= 2 || hasPeople };
      })()`);
      if (st?.ready || st?.member) return st;
      await sleep(800);
    }
    throw new Error('timeout aguardando resultados People');
  };

  /**
   * Cards da busca People (UI nova LI: classes ofuscadas).
   * Fonte: a[href*="/in/"] com texto longo "Nome • grau Title Local Conectar".
   */
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
        if (/pending|pendente|invitation sent|convite enviado/i.test(t)) return 'Pending';
        if (/\\bmessage\\b|mensagem|enviar mensagem/i.test(t)) return 'Message';
        if (/connect|conectar|convidar/i.test(t)) return 'Connect';
        if (/follow|seguir/i.test(t)) return 'Follow';
        return null;
      };
      const bodyText = document.body?.innerText || '';
      if (/linkedin\\s*member|membro\\s+do\\s+linkedin/i.test(bodyText)) {
        const onlyMember = ![...document.querySelectorAll('a[href*="/in/"]')].some((a) => {
          const t = (a.innerText || '').replace(/\\s+/g, ' ').trim();
          return t.length > 3 && !/linkedin\\s*member|membro\\s+do\\s+linkedin/i.test(t);
        });
        if (onlyMember) return { memberLimit: true, cards: [] };
      }

      const byUrl = new Map();
      for (const a of document.querySelectorAll('a[href*="/in/"]')) {
        if (!a.getClientRects().length) continue;
        const profileUrl = normUrl(a.href);
        if (!profileUrl) continue;
        const text = (a.innerText || '').replace(/\\s+/g, ' ').trim();
        if (!text) continue;
        const prev = byUrl.get(profileUrl) || { texts: [], el: a };
        prev.texts.push(text);
        // Preferir o link com texto mais longo (card completo).
        if (text.length >= (prev.texts[0]?.length || 0)) prev.el = a;
        byUrl.set(profileUrl, prev);
      }

      const out = [];
      for (const [profileUrl, pack] of byUrl) {
        const texts = pack.texts.sort((x, y) => y.length - x.length);
        const long = texts[0] || '';
        const short = texts.find((t) => t.length < 80 && !/[•·]/.test(t)) || '';
        if (/^linkedin\\s*member$/i.test(short || long) || /^membro\\s+do\\s+linkedin$/i.test(short || long)) {
          return { memberLimit: true, cards: out };
        }
        // Só cards de resultado (têm ação ou grau no texto).
        const action =
          parseAction(long) ||
          (() => {
            // Botão/ancora Convidar próximo ao card.
            const invite = [...document.querySelectorAll('a[href*="search-custom-invite"], a[aria-label*="conectar" i], a[aria-label*="connect" i], a[aria-label*="Convidar" i]')]
              .find((el) => {
                const al = el.getAttribute('aria-label') || '';
                const href = el.getAttribute('href') || '';
                const slug = profileUrl.match(/\\/in\\/([^/]+)/)?.[1];
                return (slug && href.includes(slug)) || (short && al.includes(short.split(' ')[0]));
              });
            return parseAction(invite?.getAttribute('aria-label') || invite?.innerText || '');
          })();
        if (!action && !/[•·]\\s*\\d|\\d+(?:st|nd|rd|th)|\\dº/i.test(long)) continue;

        let name = (short || long.split(/[•·]/)[0] || '')
          .replace(/Verified|Verificado/gi, '')
          .replace(/\\s+/g, ' ')
          .trim();
        if (!name || name.length < 3 || name.length > 80) continue;

        const degree =
          (long.match(/[•·]\\s*(\\d+(?:st|nd|rd|th)|\\dº(?:\\s*e\\s*\\+)?)/i) || [])[1] ||
          (long.match(/\\b(\\d+(?:st|nd|rd|th))\\b/i) || [])[1] ||
          null;

        // Título + cidade: entre grau e ação (sem RegExp do nome — acentos/escaping).
        let mid = long;
        const cut = long.indexOf('•') >= 0 ? long.indexOf('•') : long.indexOf('·');
        if (cut >= 0) mid = long.slice(cut + 1);
        mid = mid
          .replace(/^\\s*\\d+(?:st|nd|rd|th|º)(?:\\s*e\\s*\\+)?\\s*/i, '')
          .replace(/\\s+(Conectar|Connect|Pendente|Pending|Mensagem|Message|Seguir|Follow)\\b.*$/i, '')
          .replace(/\\s+Anterior:.*$/i, '')
          .trim();

        let city = null;
        let title = mid || null;
        const loc = mid.match(/(.+?)\\s+([A-ZÀ-Ü][^,]*,\\s*(?:Brasil|Brazil|[A-Z]{2}).*)$/i);
        if (loc) {
          title = loc[1].trim() || null;
          city = loc[2].trim() || null;
        } else {
          const br = mid.match(/(.+?)\\s+((?:São Paulo|Rio de Janeiro|Belo Horizonte|Curitiba|Goiânia|Campinas|Macaé|Cotia|Jales|Valinhos)(?:,.*)?)$/i);
          if (br) {
            title = br[1].trim() || null;
            city = br[2].trim() || null;
          }
        }

        const b = pack.el.getBoundingClientRect();
        out.push({
          key: profileUrl,
          name,
          title,
          city,
          current: title,
          level: degree,
          action: action || null,
          profileUrl,
          x: b.x + b.width / 2,
          y: b.y + b.height / 2,
        });
      }
      // Ordem visual (topo → baixo).
      out.sort((a, b) => (a.y || 0) - (b.y || 0));
      return { memberLimit: false, cards: out };
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
      const top = document.querySelector('main') || document.body;
      const lines = (top?.innerText || '')
        .split('\\n')
        .map((t) => t.replace(/\\s+/g, ' ').trim())
        .filter(Boolean);
      // UI nova: nome costuma ser a 1ª linha do main (h1 pode não existir).
      const h1 = (document.querySelector('h1')?.innerText || '').replace(/\\s+/g, ' ').trim();
      let name = h1 || null;
      if (!name) {
        name = lines.find((l) =>
          l.length >= 3 &&
          l.length <= 80 &&
          !/^(sobre|about|atividade|experience|educa|conectar|connect|mensagem|message)/i.test(l) &&
          !/brasil|brazil|conex/i.test(l),
        ) || null;
      }
      let headline = null;
      let location = null;
      let company = null;
      let connections = null;
      let mutualConnections = null;
      let connectionDegree = null;
      const nameIdx = name ? lines.findIndex((l) => l === name) : -1;
      const after = nameIdx >= 0 ? lines.slice(nameIdx + 1, nameIdx + 12) : lines.slice(0, 12);
      for (const line of after) {
        if (!headline && line !== name && line.length >= 2 && line.length < 180 &&
            line !== '·' &&
            !/^(connect|conectar|pending|pendente|message|mensagem|enviar mensagem|seguir|follow|mais|more|dados de contato|contact info)/i.test(line) &&
            !/\\d+\\s*(connections|conex)/i.test(line) &&
            !/contato|contact info/i.test(line) &&
            !/^(universidade|university|faculdade)/i.test(line)) {
          // Local antes do headline? (raro) — se parece cidade, guarda e segue.
          if (/brasil|brazil|remote|remoto|são paulo|rio de janeiro|goiânia/i.test(line) && line.length < 90) {
            if (!location) location = line;
            continue;
          }
          headline = line;
          continue;
        }
        if (!location && /brasil|brazil|,\\s*[A-Z]{2}\\b|remote|remoto|são paulo|sao paulo|rio de|goiânia/i.test(line) && line.length < 90) {
          location = line;
        }
        if (/^mais de\\s+\\d+|\\d[\\d.,]*\\s*(connections|conex)/i.test(line) ||
            (connections == null && /conex[oõ]es|connections/i.test(line) && /\\d/.test(line))) {
          connections = line;
        }
        if (/mutual|em comum/i.test(line)) mutualConnections = line;
        const deg = line.match(/\\b(\\d+(?:st|nd|rd|th)|\\dº(?:\\s*e\\s*\\+)?)\\b/i);
        if (deg) connectionDegree = deg[1];
      }
      // "mais de 500" + "conexões" em linhas separadas
      if (!connections) {
        for (let i = 0; i < lines.length - 1; i++) {
          if (/^mais de\\s+\\d+|^\d[\\d.,]*$/.test(lines[i]) && /^conex/i.test(lines[i + 1])) {
            connections = lines[i] + ' ' + lines[i + 1];
            break;
          }
        }
      }
      if (headline) {
        const at = headline.split(/\\s+(?:at|@|na|no|em)\\s+/i);
        if (at.length > 1) company = at[at.length - 1].trim();
      }
      const btnTexts = [...document.querySelectorAll('button, a, [role=button]')].map(
        (b) => (b.innerText || b.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim(),
      );
      let inviteStatus = null;
      let canConnect = false;
      let canMessage = false;
      for (const t of btnTexts) {
        if (/pending|pendente|invitation sent|convite enviado/i.test(t)) {
          inviteStatus = 'pending';
        } else if (/^(connect|conectar)$/i.test(t) || /convidar .+ conectar/i.test(t)) {
          if (!inviteStatus || inviteStatus === 'connected') inviteStatus = 'connect';
          canConnect = true;
        } else if (/^(message|mensagem)$/i.test(t) || /enviar mensagem/i.test(t)) {
          canMessage = true;
          // Message no perfil não implica connected se ainda há Connect.
        }
      }
      if (canMessage && !canConnect && !inviteStatus) inviteStatus = 'connected';
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

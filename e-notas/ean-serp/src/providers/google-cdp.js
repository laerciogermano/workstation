/**
 * Google SERP via Chrome CDP (opcional).
 * Extrai links orgânicos e EANs de href/título — mesmo padrão do google-imagens do app.
 * human-cdp é carregado sob demanda; sem o módulo (ex.: Contabo) SI5 continua ok.
 */
import { extractEansFromText, normalizeEan, scoreDescricao } from '../normalize.js';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function cdpBase() {
  return String(process.env.CDP_URL || 'http://127.0.0.1:9223').replace(/\/$/, '');
}

async function loadHumanCdp() {
  try {
    return await import('../../../../screen-robot/pocs/chrome-cdp/human-cdp/src/cdp.mjs');
  } catch {
    return null;
  }
}

const EXTRACT_JS = `(() => {
  const out = [];
  const seen = new Set();
  const push = (url, title) => {
    if (!url || !/^https?:\\/\\//i.test(url)) return;
    if (/google\\.|gstatic\\.|youtube\\.com|webcache/i.test(url)) return;
    const key = url.split('#')[0];
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ url: key, title: (title || '').trim() });
  };
  for (const a of document.querySelectorAll('a')) {
    const href = a.href || '';
    if (!href.includes('http')) continue;
    let dest = href;
    try {
      const u = new URL(href);
      if (u.hostname.includes('google.') && u.pathname === '/url') {
        dest = u.searchParams.get('q') || u.searchParams.get('url') || href;
      }
    } catch (_) {}
    const title = (a.innerText || a.textContent || '').replace(/\\s+/g, ' ').slice(0, 200);
    push(dest, title);
  }
  return out;
})()`;

export async function cdpAvailable() {
  const human = await loadHumanCdp();
  if (!human) return false;
  try {
    await human.getJson(cdpBase(), '/json/version');
    return true;
  } catch {
    return false;
  }
}

export async function searchGoogleCdpEan(descricaoNorm) {
  const q = String(descricaoNorm || '').trim();
  if (!q) return [];
  const human = await loadHumanCdp();
  if (!human) {
    throw Object.assign(new Error('human-cdp indisponível neste host'), { status: 503 });
  }
  const { createCdpSession, getJson, openPage } = human;
  const base = cdpBase();
  try {
    await getJson(base, '/json/version');
  } catch {
    throw Object.assign(
      new Error(`Chrome CDP indisponível em ${base}`),
      { status: 503 },
    );
  }

  const searchUrl =
    `https://www.google.com/search?q=${encodeURIComponent(`EAN ${q}`)}` +
    `&hl=pt-BR&gl=br&num=20`;

  const target = await openPage(base, searchUrl);
  const ws = target.webSocketDebuggerUrl;
  if (!ws) throw Object.assign(new Error('aba CDP sem WebSocket'), { status: 502 });
  const session = createCdpSession(ws);
  await session.ready;

  try {
    await session.send('Page.enable');
    await session.send('Runtime.enable');
    await sleep(2200);
    const evaled = await session.send('Runtime.evaluate', {
      expression: EXTRACT_JS,
      returnByValue: true,
    });
    const links = Array.isArray(evaled?.result?.value) ? evaled.result.value : [];
    const map = new Map();

    for (const link of links) {
      const blob = `${link.url || ''} ${link.title || ''}`;
      for (const raw of extractEansFromText(blob)) {
        const ean = normalizeEan(raw);
        if (!ean) continue;
        const score = link.title ? scoreDescricao(q, link.title) : 0.5;
        const prev = map.get(ean);
        if (prev && prev.score >= score) continue;
        map.set(ean, {
          ean,
          nome_canonico: link.title || null,
          image_url: null,
          url: link.url || null,
          fonte: 'google-cdp',
          score: Math.max(score, 0.45),
        });
      }
    }
    return [...map.values()].sort((a, b) => b.score - a.score);
  } finally {
    try {
      const browserVer = await getJson(base, '/json/version');
      const browser = createCdpSession(browserVer.webSocketDebuggerUrl);
      await browser.ready;
      const tid = target.id || target.targetId;
      if (tid) await browser.send('Target.closeTarget', { targetId: tid }).catch(() => {});
      browser.close();
    } catch {
      /* ignore */
    }
    session.close();
  }
}

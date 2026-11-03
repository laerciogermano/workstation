/**
 * Extrair leads LinkedIn via People search (CDP / web).
 * Só lista: lê cada card (HTML/texto visível) — **não** abre o perfil.
 * Paginação: ~10 por página; se `n > 10`, segue para `page=2`, `page=3`, …
 *
 * @param {{
 *   page?: object,
 *   cdpUrl?: string,
 *   cdpId?: string,
 *   query?: string,
 *   n?: number,
 *   maxProfiles?: number,
 *   outDir?: string|null,
 *   notifyApi?: boolean,
 *   agentId?: string,
 *   closePage?: boolean,
 * }} opts
 * @returns {Promise<{ ok: boolean, query: string, count: number, profiles: object[], steps: string[], truncated?: boolean }>}
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  normalizeLinkedInProfileUrl,
  resolveAgentId,
} from "../linkedin-connect.js";
import { shot, sleep } from "./linkedin-dom.js";
import { withLinkedInPage } from "./session.js";

/** Resultados típicos por página da People search. */
const PAGE_SIZE = Number(process.env.EXTRACT_PAGE_SIZE || 10);
const MAX_SEARCH_PAGES = Number(process.env.EXTRACT_MAX_PAGES || 50);

function peopleSearchUrl(query, pageNum = 1) {
  const u = new URL("https://www.linkedin.com/search/results/people/");
  u.searchParams.set("keywords", query);
  if (pageNum > 1) u.searchParams.set("page", String(pageNum));
  return u.toString();
}

function apiBase() {
  return (
    process.env.PROFILES_API_URL ||
    process.env.INVITES_API_URL ||
    "http://127.0.0.1:3000"
  ).replace(/\/$/, "");
}

/**
 * Cards da People search — tudo que o HTML do item expõe (sem abrir /in/).
 * Usa `awaitPromise` no CDP (fetch da foto no browser).
 */
async function scrapeSearchCards(page) {
  const expression = `(async () => {
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
    const clean = (s) => String(s || '').replace(/\\s+/g, ' ').trim();

    const bodyText = document.body?.innerText || '';
    if (/linkedin\\s*member|membro\\s+do\\s+linkedin/i.test(bodyText)) {
      const onlyMember = ![...document.querySelectorAll('a[href*="/in/"]')].some((a) => {
        const t = clean(a.innerText);
        return t.length > 3 && !/linkedin\\s*member|membro\\s+do\\s+linkedin/i.test(t);
      });
      if (onlyMember) return { memberLimit: true, cards: [] };
    }

    const byUrl = new Map();
    for (const a of document.querySelectorAll('a[href*="/in/"]')) {
      if (!a.getClientRects().length) continue;
      const profileUrl = normUrl(a.href);
      if (!profileUrl) continue;
      const text = clean(a.innerText);
      if (!text) continue;
      const prev = byUrl.get(profileUrl) || { texts: [], el: a };
      prev.texts.push(text);
      if (text.length >= (prev.texts[0]?.length || 0)) prev.el = a;
      byUrl.set(profileUrl, prev);
    }

    const toDataUrl = async (src) => {
      if (!src || src.startsWith('data:')) return src || null;
      try {
        const res = await fetch(src, { credentials: 'include' });
        if (!res.ok) return null;
        const buf = await res.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let bin = '';
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
          bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
        }
        const mime = res.headers.get('content-type') || 'image/jpeg';
        return 'data:' + mime + ';base64,' + btoa(bin);
      } catch {
        return null;
      }
    };

    const out = [];
    for (const [profileUrl, pack] of byUrl) {
      const texts = pack.texts.sort((x, y) => y.length - x.length);
      const long = texts[0] || '';
      const short =
        texts.find((t) => t.length < 80 && !/[•·]/.test(t)) || '';
      if (
        /^linkedin\\s*member$/i.test(short || long) ||
        /^membro\\s+do\\s+linkedin$/i.test(short || long)
      ) {
        return { memberLimit: true, cards: out };
      }

      let card = pack.el.closest('li') ||
        pack.el.closest('[data-chameleon-result-urn]') ||
        pack.el.parentElement;
      for (let i = 0; i < 6 && card; i++) {
        const t = card.innerText || '';
        if (
          /Conectar|Connect|Pendente|Pending|Mensagem|Message|Seguir|Follow/i.test(t) &&
          t.length > 40
        ) break;
        card = card.parentElement;
      }
      const cardText = clean(card?.innerText || long);

      const action =
        parseAction(cardText) ||
        parseAction(long) ||
        (() => {
          const btn = [...(card?.querySelectorAll('button, a, [role=button]') || [])]
            .map((el) => el.getAttribute('aria-label') || el.innerText || '')
            .find((t) => parseAction(t));
          return parseAction(btn || '');
        })();
      if (!action && !/[•·]\\s*\\d|\\d+(?:st|nd|rd|th)|\\dº/i.test(long + cardText)) continue;

      let name = clean(short || long.split(/[•·]/)[0] || '')
        .replace(/Verified|Verificado/gi, '')
        .trim();
      if (!name || name.length < 3) {
        name = clean((cardText.split(/[•·]/)[0] || '')).slice(0, 80);
      }
      if (!name || name.length < 3 || name.length > 80) continue;

      const degree =
        (cardText.match(/[•·]\\s*(\\d+(?:st|nd|rd|th)|\\dº(?:\\s*e\\s*\\+)?)/i) || [])[1] ||
        (cardText.match(/\\b(\\d+(?:st|nd|rd|th))\\b/i) || [])[1] ||
        null;

      const atualM = cardText.match(/\\bAtual:\\s*(.+?)(?=\\s+Anterior:|$)/i);
      const pastM = cardText.match(/\\bAnterior:\\s*(.+?)(?=\\s+Atual:|$)/i);
      const current = atualM ? clean(atualM[1]) : null;
      const past = pastM ? clean(pastM[1]) : null;

      const mutualM = cardText.match(
        /((?:\\d+[\\d.,]*\\+?\\s*)?(?:conexões? em comum|mutual connections?|em comum)[^]*?)(?=\\s+Atual:|\\s+Anterior:|$)/i,
      );
      const mutualConnections = mutualM ? clean(mutualM[1]).slice(0, 200) : null;

      let mid = cardText;
      const cut = Math.max(cardText.indexOf('•'), cardText.indexOf('·'));
      if (cut >= 0) mid = cardText.slice(cut + 1);
      mid = mid
        .replace(/^\\s*\\d+(?:st|nd|rd|th|º)(?:\\s*e\\s*\\+)?\\s*/i, '')
        .replace(/\\s+(Conectar|Connect|Pendente|Pending|Mensagem|Message|Enviar mensagem|Seguir|Follow)\\b.*$/i, '')
        .replace(/\\s+Atual:.*$/i, '')
        .replace(/\\s+Anterior:.*$/i, '')
        .trim();

      let city = null;
      let title = mid || null;
      const loc = mid.match(
        /(.+?)\\s+([A-ZÀ-Ü][^,]*,\\s*(?:Brasil|Brazil|[A-ZÀ-Ü][^,]*)(?:,\\s*Brasil|,\\s*Brazil)?.*)$/i,
      );
      if (loc) {
        title = clean(loc[1]) || null;
        city = clean(loc[2]) || null;
      } else {
        const br = mid.match(
          /(.+?)\\s+((?:São Paulo|Rio de Janeiro|Belo Horizonte|Curitiba|Goiânia|Campinas|Macaé|Cotia|Jales|Valinhos|Recife|Fortaleza|Salvador|Brasília|Porto Alegre)(?:,.*)?)$/i,
        );
        if (br) {
          title = clean(br[1]) || null;
          city = clean(br[2]) || null;
        }
      }

      const img =
        [...(card?.querySelectorAll('img') || [])].find((i) => {
          const src = i.currentSrc || i.src || '';
          const alt = clean(i.alt);
          return (
            /profile-displayphoto|media\\.licdn\\.com/i.test(src) ||
            (alt && name && alt.toLowerCase().includes(name.split(' ')[0].toLowerCase()))
          );
        }) || card?.querySelector('img');
      const photoUrl = img ? (img.currentSrc || img.src || null) : null;
      const photoBase64 = photoUrl ? await toDataUrl(photoUrl) : null;

      const b = (card || pack.el).getBoundingClientRect();
      out.push({
        key: profileUrl,
        name,
        title,
        city,
        current: current || title || null,
        past,
        level: degree,
        action: action || null,
        mutualConnections,
        summary: cardText.slice(0, 500) || null,
        photoUrl,
        photoBase64,
        profileUrl,
        x: b.x + b.width / 2,
        y: b.y + b.height / 2,
      });
    }
    out.sort((a, b) => (a.y || 0) - (b.y || 0));
    return { memberLimit: false, cards: out };
  })()`;

  const listed = await page.evaluate(expression, { awaitPromise: true });
  if (!listed || typeof listed !== "object") {
    return { memberLimit: false, cards: [] };
  }
  if (!Array.isArray(listed.cards)) {
    return { memberLimit: Boolean(listed.memberLimit), cards: [] };
  }
  return listed;
}

function inviteStatusFromAction(action) {
  const a = String(action || "").toLowerCase();
  if (/pending|pendente/.test(a)) return "pending";
  if (/message|mensagem/.test(a)) return "connected";
  if (/connect|conectar|convidar/.test(a)) return "connect";
  return null;
}

async function postProfile(profile, agentId) {
  const base = apiBase();
  if (!base) return { notified: false, reason: "sem API" };
  const headers = { "content-type": "application/json" };
  const key = String(process.env.AGENT_API_KEY || "").trim();
  if (key) headers["x-api-key"] = key;
  // CreateProfileDto: agentId + profileUrl no mesmo POST → API reserva conexão.
  const body = {
    name: profile.name,
    title: profile.title || null,
    searchQuery: profile.query || profile.searchQuery || null,
    level: profile.level || null,
    connection: profile.action || profile.connection || null,
    city: profile.city || profile.location || null,
    mutualConnections: profile.mutualConnections || null,
    current: profile.current || null,
    past: profile.past || null,
    photoBase64: profile.photoBase64 || null,
    round: profile.round ?? null,
    extractedAt: profile.extractedAt || new Date().toISOString(),
    profileUrl: profile.profileUrl || null,
    agentId: agentId || resolveAgentId() || null,
  };
  const res = await fetch(`${base}/profiles`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    return { notified: false, error: `${res.status} ${text.slice(0, 120)}` };
  }
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { notified: true, data };
}

/**
 * @param {object} opts
 */
export async function extractLeads(opts = {}) {
  const query = String(opts.query || opts.q || "comprador").trim() || "comprador";
  const n = Math.max(
    1,
    Math.floor(Number(opts.n ?? opts.maxProfiles) || 5),
  );
  const notifyApi = opts.notifyApi !== false;
  const agentId = opts.agentId || resolveAgentId();
  const steps = [];
  const maxPages = Math.min(
    MAX_SEARCH_PAGES,
    Math.max(1, Math.ceil(n / Math.max(1, PAGE_SIZE)) + 2),
  );

  return withLinkedInPage(opts, async (page) => {
    /** @type {object[]} */
    const profiles = [];
    const seen = new Set();
    let searchPage = 1;
    let round = 0;

    while (profiles.length < n && searchPage <= maxPages) {
      const searchUrl = peopleSearchUrl(query, searchPage);
      await page.goto(searchUrl);
      steps.push(`search:${query}:page=${searchPage}`);
      await sleep(searchPage === 1 ? 4_000 : 3_000);
      await shot(page, opts.outDir, `${String(searchPage).padStart(2, "0")}-page.png`);

      // Garante que os ~10 cards da página carregaram (scroll leve no fim).
      await page.scroll({ dy: 400, steps: 8 });
      await sleep(800);

      round++;
      const listed = await scrapeSearchCards(page);
      if (listed.memberLimit) {
        steps.push("member_limit");
        break;
      }
      const cards = listed.cards;
      steps.push(`list-page:${searchPage}:cards=${cards.length}`);
      if (opts.outDir) {
        mkdirSync(opts.outDir, { recursive: true });
        writeFileSync(
          join(
            opts.outDir,
            `list-page-${String(searchPage).padStart(3, "0")}.json`,
          ),
          JSON.stringify(
            cards.map((c) => ({
              ...c,
              photoBase64: c.photoBase64
                ? `[base64 ${c.photoBase64.length} chars]`
                : null,
            })),
            null,
            2,
          ),
        );
      }

      let addedOnPage = 0;
      for (const card of cards) {
        if (profiles.length >= n) break;
        const url = normalizeLinkedInProfileUrl(card.profileUrl);
        if (!url || seen.has(url)) continue;
        seen.add(url);
        addedOnPage++;

        const inviteStatus = inviteStatusFromAction(card.action);
        const profile = {
          name: card.name,
          title: card.title || null,
          city: card.city || null,
          location: card.city || null,
          current: card.current || card.title || null,
          past: card.past || null,
          level: card.level || null,
          action: card.action || null,
          connection: card.action || null,
          mutualConnections: card.mutualConnections || null,
          summary: card.summary || null,
          photoUrl: card.photoUrl || null,
          photoBase64: card.photoBase64 || null,
          profileUrl: url,
          inviteStatus,
          canConnect: inviteStatus === "connect",
          canMessage: inviteStatus === "connected",
          query,
          searchQuery: query,
          searchPage,
          round,
          extractedAt: new Date().toISOString(),
          source: "search_card",
        };
        profiles.push(profile);
        steps.push(`card:${profiles.length}:p${searchPage}:${profile.name}`);

        if (opts.outDir) {
          writeFileSync(
            join(
              opts.outDir,
              `profile-${String(profiles.length).padStart(3, "0")}-card.json`,
            ),
            JSON.stringify(
              {
                ...profile,
                photoBase64: profile.photoBase64
                  ? `[base64 ${profile.photoBase64.length} chars]`
                  : null,
              },
              null,
              2,
            ),
          );
        }

        if (notifyApi) {
          try {
            const posted = await postProfile(profile, agentId);
            steps.push(
              posted.notified
                ? "api:profiles:ok"
                : `api:profiles:skip:${posted.reason || posted.error}`,
            );
          } catch (e) {
            steps.push(`api:fail:${String(e?.message || e).slice(0, 80)}`);
          }
        }
      }

      if (profiles.length >= n) break;
      // Página vazia / sem cards novos → fim dos resultados.
      if (cards.length === 0 || addedOnPage === 0) {
        steps.push(`page_end:${searchPage}`);
        break;
      }
      searchPage += 1;
    }

    if (opts.outDir) {
      mkdirSync(opts.outDir, { recursive: true });
      writeFileSync(
        join(opts.outDir, "profiles.json"),
        JSON.stringify(
          {
            query,
            count: profiles.length,
            pages: searchPage,
            profiles: profiles.map((p) => ({
              ...p,
              photoBase64: p.photoBase64
                ? `[base64 ${p.photoBase64.length} chars]`
                : null,
            })),
          },
          null,
          2,
        ),
      );
    }
    await shot(page, opts.outDir, "99-done.png");

    return {
      ok: profiles.length > 0,
      query,
      n,
      count: profiles.length,
      pagesUsed: Math.min(searchPage, maxPages),
      profiles,
      steps,
      truncated: profiles.length < n,
    };
  });
}

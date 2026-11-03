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
 * Avatar: `photoBox` no DOM; Node captura JPEG via CDP → `photoBase64` (fetch/canvas CORS falham).
 */
async function scrapeSearchCards(page) {
  const expression = `(() => {
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

    // fetch/canvas da CDN LinkedIn falham (CORS / canvas tainted).
    // Devolve photoBox p/ o Node capturar via Page.captureScreenshot.
    const findPhotoImg = (startEl, name, profileUrl) => {
      const firstName = clean(name).split(/\\s+/)[0]?.toLowerCase() || '';
      let el = startEl;
      let best = null;
      for (let depth = 0; depth < 12 && el; depth++) {
        const photos = [...(el.querySelectorAll?.('img') || [])].filter((i) => {
          const src = i.currentSrc || i.src || '';
          return (
            /profile-displayphoto|media\\.licdn\\.com/i.test(src) &&
            i.getClientRects().length
          );
        });
        const links = [...(el.querySelectorAll?.('a[href*=\"/in/\"]') || [])];
        const hasSelf = links.some((a) => normUrl(a.href) === profileUrl);
        if (photos.length === 1 && hasSelf) {
          return photos[0];
        }
        for (const img of photos) {
          const alt = clean(img.alt).toLowerCase();
          const score =
            firstName && alt.includes(firstName) ? 100 - depth : 10 - depth;
          if (!best || score > best.score) best = { img, score };
        }
        el = el.parentElement;
      }
      return best?.img || null;
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
        findPhotoImg(card || pack.el, name, profileUrl) ||
        findPhotoImg(pack.el, name, profileUrl);
      const photoUrl = img ? img.currentSrc || img.src || null : null;
      let photoBox = null;
      if (img) {
        try {
          img.scrollIntoView({ block: "nearest", inline: "nearest" });
        } catch {
          /* ignore */
        }
        const r = img.getBoundingClientRect();
        if (r.width >= 8 && r.height >= 8) {
          photoBox = {
            x: Math.max(0, r.x),
            y: Math.max(0, r.y),
            width: Math.min(r.width, Math.max(0, innerWidth - Math.max(0, r.x))),
            height: Math.min(
              r.height,
              Math.max(0, innerHeight - Math.max(0, r.y)),
            ),
          };
          if (photoBox.width < 8 || photoBox.height < 8) photoBox = null;
        }
      }

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
        photoBox,
        photoBase64: null,
        profileUrl,
        x: b.x + b.width / 2,
        y: b.y + b.height / 2,
      });
    }
    out.sort((a, b) => (a.y || 0) - (b.y || 0));
    return { memberLimit: false, cards: out };
  })()`;

  const listed = await page.evaluate(expression);
  if (!listed || typeof listed !== "object") {
    return { memberLimit: false, cards: [] };
  }
  if (!Array.isArray(listed.cards)) {
    return { memberLimit: Boolean(listed.memberLimit), cards: [] };
  }
  // CORS bloqueia fetch/canvas da CDN — clip CDP → data URL JPEG em photoBase64.
  // Sempre re-resolve o box na hora (coords do scrape ficam stale após scroll).
  for (const card of listed.cards) {
    let box = await resolveAvatarBox(page, card.profileUrl, card.name);
    if (!box) {
      await sleep(200);
      box = await resolveAvatarBox(page, card.profileUrl, card.name);
    }
    card.photoBox = box || null;
    if (box?.photoUrl) card.photoUrl = box.photoUrl;
    if (box) await sleep(150);
    card.photoBase64 = await captureAvatarBase64(page, box);
  }
  return listed;
}

/**
 * Re-localiza o avatar no DOM (scrollIntoView center) e devolve box CSS atual.
 * @param {object} page
 * @param {string} profileUrl
 * @param {string} [name]
 */
async function resolveAvatarBox(page, profileUrl, name) {
  if (!page?.evaluate || !profileUrl) return null;
  try {
    return await page.evaluate(`(() => {
      const wantSlug = (() => {
        try {
          const m = new URL(${JSON.stringify(String(profileUrl))}).pathname.match(/\\/in\\/([^/?#]+)/i);
          return m ? decodeURIComponent(m[1]).replace(/\\/+$/, '').toLowerCase() : '';
        } catch { return ''; }
      })();
      const firstName = ${JSON.stringify(String(name || "").split(/\\s+/)[0] || "")}.toLowerCase();
      if (!wantSlug) return null;
      const slugOf = (href) => {
        try {
          const m = new URL(href, location.origin).pathname.match(/\\/in\\/([^/?#]+)/i);
          return m ? decodeURIComponent(m[1]).replace(/\\/+$/, '').toLowerCase() : null;
        } catch { return null; }
      };
      const anchors = [...document.querySelectorAll('a[href*="/in/"]')].filter(
        (a) => slugOf(a.href) === wantSlug && a.getClientRects().length,
      );
      if (!anchors.length) return null;
      let best = null;
      for (const a of anchors) {
        let el = a;
        for (let depth = 0; depth < 12 && el; depth++) {
          const photos = [...(el.querySelectorAll?.('img') || [])].filter((i) => {
            const src = i.currentSrc || i.src || '';
            return /profile-displayphoto|media\\.licdn\\.com/i.test(src) && i.getClientRects().length;
          });
          const hasSelf = [...(el.querySelectorAll?.('a[href*="/in/"]') || [])].some(
            (x) => slugOf(x.href) === wantSlug,
          );
          let img = null;
          if (photos.length === 1 && hasSelf) img = photos[0];
          else if (firstName) {
            img = photos.find((i) => (i.alt || '').toLowerCase().includes(firstName)) || null;
          } else if (photos.length === 1) {
            img = photos[0];
          }
          if (img) {
            try { img.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch {}
            const r = img.getBoundingClientRect();
            // Exige avatar 100% na viewport — senão o clip CDP (y<0→0) pega outro pedaço da tela.
            if (
              r.width >= 8 &&
              r.height >= 8 &&
              r.x >= 0 &&
              r.y >= 0 &&
              r.right <= innerWidth + 1 &&
              r.bottom <= innerHeight + 1
            ) {
              best = {
                x: r.x,
                y: r.y,
                width: r.width,
                height: r.height,
                photoUrl: img.currentSrc || img.src || null,
              };
              if (photos.length === 1 && hasSelf) return best;
            }
          }
          el = el.parentElement;
        }
      }
      return best && best.width >= 8 && best.height >= 8 ? best : null;
    })()`);
  } catch {
    return null;
  }
}

/**
 * Screenshot do retângulo do avatar (CSS px) → data URL JPEG (`photoBase64`).
 * @param {object} page
 * @param {{ x: number, y: number, width: number, height: number }|null|undefined} box
 */
async function captureAvatarBase64(page, box) {
  if (!page?.send || !box) return null;
  const x = Number(box.x);
  const y = Number(box.y);
  const width = Number(box.width);
  const height = Number(box.height);
  if (
    ![x, y, width, height].every((n) => Number.isFinite(n)) ||
    width < 8 ||
    height < 8
  ) {
    return null;
  }
  try {
    const res = await page.send("Page.captureScreenshot", {
      format: "jpeg",
      quality: 85,
      fromSurface: true,
      clip: { x, y, width, height, scale: 1 },
    });
    if (!res?.data) return null;
    return `data:image/jpeg;base64,${res.data}`;
  } catch {
    return null;
  }
}

/**
 * Message no card ≠ conexão se o grau for 2º/3º (Open Profile / InMail).
 * Só 1º + Message → connected; Message sem 1º explícito → connect (candidato).
 */
function inviteStatusFromAction(action, level) {
  const a = String(action || "").toLowerCase();
  const deg = String(level || "").toLowerCase();
  const isFirst = /(?:^|[^0-9])1(?:st|º)|primeiro/i.test(deg);
  const isDistant = /(?:2(?:nd|º)?|3(?:rd|º)?|\+)/i.test(deg);
  if (/pending|pendente/.test(a)) return "pending";
  if (/message|mensagem/.test(a)) {
    if (isFirst && !isDistant) return "connected";
    return "connect";
  }
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
    // Canônico (connect|pending|connected) — raw "Message" em 3º virava conectado na API.
    connection:
      profile.inviteStatus || profile.connection || profile.action || null,
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

        const inviteStatus = inviteStatusFromAction(card.action, card.level);
        const profile = {
          name: card.name,
          title: card.title || null,
          city: card.city || null,
          location: card.city || null,
          current: card.current || card.title || null,
          past: card.past || null,
          level: card.level || null,
          action: card.action || null,
          connection: inviteStatus || card.action || null,
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

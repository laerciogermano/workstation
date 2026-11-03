/**
 * Helpers DOM LinkedIn web (human-cdp: find → trajetória → click).
 * Leitura via evaluate; manipulação só page.click / clickAt / type / fill / scroll.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {object} page HumanCdpSession
 * @param {string|null|undefined} outDir
 * @param {string} name
 */
export async function shot(page, outDir, name) {
  if (!outDir || !page) return;
  mkdirSync(outDir, { recursive: true });
  try {
    const b64 = await page.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
    });
    if (b64?.data) {
      writeFileSync(join(outDir, name), Buffer.from(b64.data, "base64"));
    }
  } catch {
    /* ignore */
  }
}

/**
 * Hit-testável por texto / aria-label.
 * @param {object} page
 * @param {string[]} texts
 * @param {{ exact?: boolean, includeDisabled?: boolean, menuOnly?: boolean, primaryOnly?: boolean }} [opts]
 * @returns {Promise<{ cx: number, cy: number, text: string }|null>}
 */
export async function findByTexts(page, texts, opts = {}) {
  const want = (Array.isArray(texts) ? texts : [texts])
    .map((t) => String(t || "").trim())
    .filter(Boolean);
  if (!want.length) return null;
  return page.evaluate(`(() => {
    const want = ${JSON.stringify(want)}.map((t) => t.toLowerCase());
    const exact = ${JSON.stringify(!!opts.exact)};
    const includeDisabled = ${JSON.stringify(!!opts.includeDisabled)};
    const menuOnly = ${JSON.stringify(!!opts.menuOnly)};
    const primaryOnly = ${JSON.stringify(!!opts.primaryOnly)};
    // primaryOnly: botão Connect do hero OU <a> invite do perfil atual (não cards laterais)
    const nodes = menuOnly
      ? [...document.querySelectorAll('[role="menuitem"], .artdeco-dropdown__item')]
      : primaryOnly
        ? [...document.querySelectorAll(
            'button, [role="button"], a[href*="custom-invite"], a[href*="vanityName="]',
          )]
        : [...document.querySelectorAll(
            'button, a, [role="button"], [role="link"], [role="menuitem"], .artdeco-dropdown__item',
          )];
    const vanityRaw = (location.pathname.match(/\\/in\\/([^/]+)/) || [])[1] || '';
    let vanity = vanityRaw;
    try { vanity = decodeURIComponent(vanityRaw); } catch { /* keep raw */ }
    const score = (t) => {
      const s = String(t || '').replace(/\\s+/g, ' ').trim().toLowerCase();
      if (!s) return -1;
      for (let i = 0; i < want.length; i++) {
        const w = want[i];
        if (exact) {
          if (s === w) return i;
          continue;
        }
        if (s === w) return i;
        if (s.startsWith(w + ' ') || s.startsWith(w + ',') || s.startsWith(w + '·')) return i;
        if (new RegExp('\\\\b' + w.replace(/[.*+?^$\${}()|[\\]\\\\]/g, '\\\\$&') + '\\\\b').test(s)) return i;
      }
      return -1;
    };
    /** @type {{ cx: number, cy: number, text: string, rank: number }[]} */
    const hits = [];
    for (const el of nodes) {
      if (!includeDisabled && el.disabled) continue;
      const aria = el.getAttribute('aria-label') || '';
      const label = el.innerText || el.textContent || '';
      // Preferir texto curto do botão; aria longo só se texto vazio / exact fail
      const rawTxt = label.replace(/\\s+/g, ' ').trim();
      const rawAria = aria.replace(/\\s+/g, ' ').trim();
      const raw = rawTxt || rawAria;
      let rank = score(rawTxt);
      if (rank < 0) rank = score(rawAria);
      if (rank < 0) continue;
      // primaryOnly: Connect do hero — ignorar cards laterais / outros vanity
      if (primaryOnly) {
        if (el.closest && el.closest('[data-view-name="profile-card"], aside, .scaffold-layout__aside')) continue;
        if (el.tagName === 'A') {
          const href = el.getAttribute('href') || '';
          if (vanity && href.includes('vanityName=')) {
            const ok =
              href.includes('vanityName=' + vanity) ||
              href.includes('vanityName=' + encodeURIComponent(vanity)) ||
              href.includes('vanityName=' + vanityRaw);
            if (!ok) continue;
          }
        }
      }
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
      // nav topo (Mais da global nav) — primary/menu profile ficam mais abaixo
      if (primaryOnly && r.y < 72) continue;
      hits.push({
        cx: r.x + r.width / 2,
        cy: r.y + r.height / 2,
        text: (rawTxt || rawAria).slice(0, 80),
        rank,
      });
    }
    hits.sort((a, b) => a.rank - b.rank || a.cy - b.cy);
    return hits[0] ? { cx: hits[0].cx, cy: hits[0].cy, text: hits[0].text } : null;
  })()`);
}

/**
 * @param {object} page
 * @param {string[]} texts
 * @param {{ exact?: boolean, menuOnly?: boolean, primaryOnly?: boolean, steps?: string[] }} [opts]
 */
export async function clickByTexts(page, texts, opts = {}) {
  const hit = await findByTexts(page, texts, opts);
  if (!hit) return null;
  await page.clickAt(hit.cx, hit.cy);
  opts.steps?.push(`click:${hit.text}@${Math.round(hit.cx)},${Math.round(hit.cy)}`);
  return hit;
}

/** Mais/More do perfil (não o da nav global). */
export async function findProfileMore(page) {
  return page.evaluate(`(() => {
    const els = [...document.querySelectorAll('button, [role=button]')].filter((el) => {
      const aria = (el.getAttribute('aria-label') || '').trim();
      const txt = (el.innerText || '').replace(/\\s+/g, ' ').trim();
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return false;
      if (r.y < 80) return false; // nav global
      return (
        /^(more|mais)$/i.test(aria) ||
        /^(more|mais)$/i.test(txt) ||
        /more actions|mais ações/i.test(aria + ' ' + txt)
      );
    });
    const ranked = els
      .map((el) => {
        const r = el.getBoundingClientRect();
        return {
          cx: r.x + r.width / 2,
          cy: r.y + r.height / 2,
          y: r.y,
          text: (el.getAttribute('aria-label') || el.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 40),
        };
      })
      .sort((a, b) => a.y - b.y);
    return ranked[0] || null;
  })()`);
}

/**
 * Conectar/Connect do menu overflow do perfil atual (vanity da URL).
 * Ignora cards laterais / outros vanityName.
 */
export async function findMenuConnect(page) {
  return page.evaluate(`(() => {
    const vanityRaw = (location.pathname.match(/\\/in\\/([^/]+)/) || [])[1] || '';
    let vanity = vanityRaw;
    try { vanity = decodeURIComponent(vanityRaw); } catch { /* keep */ }
    const items = [...document.querySelectorAll('a[role=menuitem], [role=menuitem]')];
    /** @type {{ cx: number, cy: number, text: string, href: string }[]} */
    const hits = [];
    for (const el of items) {
      const txt = (el.innerText || '').replace(/\\s+/g, ' ').trim();
      const aria = (el.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim();
      const href = el.getAttribute('href') || '';
      if (!/^(connect|conectar)$/i.test(txt) && !/^(connect|conectar)$/i.test(aria)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
      const vanityOk =
        !vanity ||
        href.includes('vanityName=' + vanity) ||
        href.includes('vanityName=' + encodeURIComponent(vanity)) ||
        href.includes('vanityName=' + vanityRaw) ||
        href.includes('/in/' + vanity) ||
        href.includes('/in/' + vanityRaw);
      if (vanity && href.includes('vanityName=') && !vanityOk) continue;
      hits.push({
        cx: r.x + r.width / 2,
        cy: r.y + r.height / 2,
        text: (txt || aria).slice(0, 80),
        href: href.slice(0, 160),
        vanityOk: vanityOk || !href.includes('vanityName='),
      });
    }
    hits.sort((a, b) => Number(b.vanityOk) - Number(a.vanityOk) || a.cy - b.cy);
    const best = hits[0];
    return best
      ? { cx: best.cx, cy: best.cy, text: best.text, href: best.href }
      : null;
  })()`);
}

/** Fecha o menu a11y "Pular para…" se estiver aberto (atrapalha coords). */
export async function dismissA11ySkipMenu(page, steps) {
  const hit = await page.evaluate(`(() => {
    const el = [...document.querySelectorAll('button')].find((b) =>
      /fechar menu pular/i.test(b.getAttribute('aria-label') || ''),
    );
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return null;
    return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
  })()`);
  if (!hit) return false;
  await page.clickAt(hit.cx, hit.cy);
  steps?.push(`a11y-skip-close@${Math.round(hit.cx)},${Math.round(hit.cy)}`);
  await sleep(300);
  return true;
}

/**
 * Abre Mais e clica o menuitem Conectar do perfil (human-cdp).
 * Pré-posiciona o cursor perto do menu para o trajeto pós-abertura ser curto
 * (trajeto longo fecha o dropdown antes do press).
 */
export async function clickProfileMenuConnect(page, steps) {
  await dismissA11ySkipMenu(page, steps);

  const more = await findProfileMore(page);
  if (!more) return { ok: false, error: "Mais do perfil não encontrado" };

  // Menu costuma abrir acima/ao lado do Mais — aproxima o ponteiro antes
  if (typeof page._moveTo === "function") {
    await page._moveTo(more.cx + 90, more.cy - 140);
    await sleep(80);
  }

  await page.clickAt(more.cx, more.cy);
  steps?.push(`more:${more.text}@${Math.round(more.cx)},${Math.round(more.cy)}`);
  await sleep(700);

  let menuHit = await findMenuConnect(page);
  for (let i = 0; i < 6 && !menuHit; i++) {
    await sleep(300);
    menuHit = await findMenuConnect(page);
  }
  if (!menuHit) return { ok: false, error: "Conectar no menu não apareceu" };

  // Re-aproxima na coluna do item (ainda dentro do overlay) e clica já perto
  if (typeof page._moveTo === "function") {
    await page._moveTo(menuHit.cx, menuHit.cy + Math.sign(more.cy - menuHit.cy) * 24);
    await sleep(50);
  }

  await page.clickAt(menuHit.cx, menuHit.cy);
  steps?.push(
    `menu-connect:${menuHit.text}@${Math.round(menuHit.cx)},${Math.round(menuHit.cy)}`,
  );
  return { ok: true, more, menuHit };
}

/**
 * Enviar sem nota — LinkedIn coloca o modal em open shadow root;
 * document.querySelector não acha; percorre shadow e devolve o centro.
 */
export async function findSkipInvite(page) {
  return page.evaluate(`(() => {
    const want = /^(enviar sem nota|send without a note)$/i;
    const visit = (root) => {
      for (const el of root.querySelectorAll('button, [role="button"]')) {
        const aria = (el.getAttribute('aria-label') || '').trim();
        const txt = (el.innerText || '').replace(/\\s+/g, ' ').trim();
        if (!want.test(aria) && !want.test(txt)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        if (r.bottom < 0 || r.top > innerHeight) continue;
        return { cx: r.x + r.width / 2, cy: r.y + r.height / 2, text: aria || txt };
      }
      for (const el of root.querySelectorAll('*')) {
        if (el.shadowRoot) {
          const hit = visit(el.shadowRoot);
          if (hit) return hit;
        }
      }
      return null;
    };
    return visit(document);
  })()`);
}

/** Clique humano no Enviar sem nota (coords via shadow → page.clickAt). */
export async function clickSkipInvite(page, steps) {
  const hit = await findSkipInvite(page);
  if (!hit) return null;
  await page.clickAt(hit.cx, hit.cy);
  steps?.push(`skip:${hit.text}@${Math.round(hit.cx)},${Math.round(hit.cy)}`);
  return hit;
}

/** Snapshot de sinais da página (perfil / modal / 404). */
export async function profileSignals(page) {
  return page.evaluate(`(() => {
    const body = (document.body?.innerText || '').replace(/\\s+/g, ' ').trim();
    const lower = body.toLowerCase();
    const pageMissing =
      /this page doesn.?t exist/i.test(body) ||
      /please check your url/i.test(body) ||
      /essa página não existe/i.test(body) ||
      /página não encontrada/i.test(body);
    const pending =
      /\\binvitation sent\\b/i.test(body) ||
      /\\bconvite enviado\\b/i.test(body) ||
      !!document.querySelector('button[aria-label*="Pending" i], button[aria-label*="Pendente" i]');
    const hasPendingBtn = [...document.querySelectorAll('button, [role=button]')].some((el) => {
      const t = ((el.getAttribute('aria-label') || '') + ' ' + (el.innerText || '')).trim();
      return /^pending\\b/i.test(t) || /^pendente\\b/i.test(t) || /\\bpending\\b.+(withdraw|retirar)/i.test(t);
    });
    const labelOf = (el) => {
      const aria = (el.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim();
      const txt = (el.innerText || '').replace(/\\s+/g, ' ').trim();
      return { aria, txt, both: (aria + ' ' + txt).replace(/\\s+/g, ' ').trim() };
    };
    // Connect do hero: button OU <a> invite do vanity atual — NÃO cards laterais
    const vanityRaw = (location.pathname.match(/\\/in\\/([^/]+)/) || [])[1] || '';
    let vanity = vanityRaw;
    try { vanity = decodeURIComponent(vanityRaw); } catch { /* keep */ }
    const hasConnect = [...document.querySelectorAll(
      'button, [role=button], a[href*="custom-invite"], a[href*="vanityName="]',
    )].some((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || r.y < 72) return false;
      if (el.closest('aside, .scaffold-layout__aside, [data-view-name="profile-card"]')) return false;
      const { aria, txt, both } = labelOf(el);
      if (/\\bconnections?\\b/i.test(both) && !/invite.+to connect/i.test(both)) return false;
      if (el.tagName === 'A') {
        const href = el.getAttribute('href') || '';
        if (vanity && href.includes('vanityName=')) {
          const ok =
            href.includes('vanityName=' + vanity) ||
            href.includes('vanityName=' + encodeURIComponent(vanity)) ||
            href.includes('vanityName=' + vanityRaw);
          if (!ok) return false;
        }
      }
      return (
        /^(connect|conectar)$/i.test(txt) ||
        /^(connect|conectar)$/i.test(aria) ||
        /invite .+ to connect/i.test(aria) ||
        /convidar .+ (para se conectar|a conectar)/i.test(aria)
      );
    });
    // Connect já visível no dropdown Mais
    const hasMenuConnect = [...document.querySelectorAll('[role=menuitem], .artdeco-dropdown__item')].some((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return false;
      const { txt, aria } = labelOf(el);
      return /^(connect|conectar)$/i.test(txt) || /invite .+ to connect|convidar .+ conectar/i.test(aria);
    });
    const hasMessage = [...document.querySelectorAll('button, [role=button]')].some((el) => {
      const r = el.getBoundingClientRect();
      if (r.y < 72 || r.width < 2) return false;
      const { aria, txt, both } = labelOf(el);
      return (
        /^(message|mensagem|send a message|enviar mensagem)$/i.test(txt) ||
        /^(message|mensagem)\\b/i.test(aria) ||
        /^(message|mensagem)\\b/i.test(both)
      );
    });
    const hasFollow = [...document.querySelectorAll('button, [role=button]')].some((el) => {
      const r = el.getBoundingClientRect();
      if (r.y < 72 || r.width < 2) return false;
      const { aria, txt } = labelOf(el);
      return /^(follow|seguir)$/i.test(txt) || /^(follow|seguir)\\b/i.test(aria);
    });
    // Enviar sem nota costuma estar em open shadow root
    const hasSkip = (() => {
      const want = /^(enviar sem nota|send without a note|skip without note|skip|pular)$/i;
      const visit = (root) => {
        for (const el of root.querySelectorAll('button, [role=button]')) {
          const aria = (el.getAttribute('aria-label') || '').trim();
          const txt = (el.innerText || '').replace(/\\s+/g, ' ').trim();
          if (/pular para/i.test(aria + ' ' + txt)) continue;
          if (!want.test(aria) && !want.test(txt)) continue;
          const r = el.getBoundingClientRect();
          if (r.width > 2 && r.height > 2) return true;
        }
        for (const el of root.querySelectorAll('*')) {
          if (el.shadowRoot && visit(el.shadowRoot)) return true;
        }
        return false;
      };
      return visit(document);
    })();
    const hasMore = [...document.querySelectorAll('button, [role=button]')].some((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || r.y < 80) return false;
      const { aria, txt, both } = labelOf(el);
      return (
        /^(more|mais)$/i.test(aria) ||
        /^(more|mais)$/i.test(txt) ||
        /more actions/i.test(both) ||
        /mais ações/i.test(both)
      );
    });
    return {
      href: location.href,
      pageMissing,
      pending: pending || hasPendingBtn,
      hasConnect,
      hasMenuConnect,
      hasMessage,
      hasFollow,
      hasSkip,
      hasMore,
      bodySlice: body.slice(0, 400),
    };
  })()`);
}

/**
 * Clica no primeiro seletor disponível (com trajetória via page.click).
 * @param {object} page
 * @param {string[]} selectors
 * @param {string[]} [steps]
 */
export async function clickFirstSelector(page, selectors, steps) {
  for (const sel of selectors) {
    const box = await page.boundingBox(sel).catch(() => null);
    if (!box) continue;
    await page.click(sel);
    steps?.push(`click:${sel}`);
    return sel;
  }
  return null;
}

/** Texto exato no composer LinkedIn messaging (só human-cdp fill). */
export async function fillMessageComposer(page, text, steps) {
  const selectors = [
    'div.msg-form__contenteditable',
    '.msg-form__contenteditable[contenteditable="true"]',
    'div[role="textbox"][contenteditable="true"]',
    '.msg-form .msg-form__msg-content-container--scrollable div[contenteditable="true"]',
  ];
  for (const sel of selectors) {
    const box = await page.boundingBox(sel).catch(() => null);
    if (!box) continue;
    await page.fill(sel, text);
    steps?.push(`composer:${sel}`);
    return true;
  }
  return false;
}

export async function clickSendMessage(page, steps) {
  const sel =
    (await clickFirstSelector(
      page,
      [
        'button.msg-form__send-button:not([disabled])',
        'button.msg-form__send-button',
        'button[type="submit"].msg-form__send-btn',
      ],
      steps,
    )) ||
    (await clickByTexts(page, ["Send", "Enviar"], { exact: true, steps }));
  return Boolean(sel);
}

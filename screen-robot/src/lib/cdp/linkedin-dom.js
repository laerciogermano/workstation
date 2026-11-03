/**
 * Helpers DOM LinkedIn web (human-cdp: find → trajetória → click).
 * Sem el.click() / dispatchEvent de mouse solto.
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
 * Hit-testável por texto / aria-label (botão, link, role=button).
 * @param {object} page
 * @param {string[]} texts
 * @param {{ exact?: boolean, includeDisabled?: boolean }} [opts]
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
    const nodes = [
      ...document.querySelectorAll('button, a, [role="button"], [role="link"]'),
    ];
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
      const raw = (aria || label).replace(/\\s+/g, ' ').trim();
      const rank = score(raw);
      if (rank < 0) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
      hits.push({
        cx: r.x + r.width / 2,
        cy: r.y + r.height / 2,
        text: raw.slice(0, 80),
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
 * @param {{ exact?: boolean, steps?: string[] }} [opts]
 */
export async function clickByTexts(page, texts, opts = {}) {
  const hit = await findByTexts(page, texts, opts);
  if (!hit) return null;
  await page.clickAt(hit.cx, hit.cy);
  opts.steps?.push(`click:${hit.text}@${Math.round(hit.cx)},${Math.round(hit.cy)}`);
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
    const hasConnect = [...document.querySelectorAll('button, [role=button]')].some((el) => {
      const t = ((el.getAttribute('aria-label') || '') + ' ' + (el.innerText || '')).replace(/\\s+/g, ' ').trim();
      if (/\\bconnections?\\b/i.test(t) && !/invite.+to connect/i.test(t)) return false;
      return /^connect$/i.test(t) || /^conectar$/i.test(t) || /invite .+ to connect/i.test(t) || /convidar .+ a conectar/i.test(t);
    });
    const hasMessage = [...document.querySelectorAll('button, [role=button], a')].some((el) => {
      const t = ((el.getAttribute('aria-label') || '') + ' ' + (el.innerText || '')).replace(/\\s+/g, ' ').trim();
      return /^(message|mensagem|send a message|enviar mensagem)$/i.test(t) || /^message\\b/i.test(t) || /^mensagem\\b/i.test(t);
    });
    const hasFollow = [...document.querySelectorAll('button, [role=button]')].some((el) => {
      const t = ((el.getAttribute('aria-label') || '') + ' ' + (el.innerText || '')).replace(/\\s+/g, ' ').trim();
      return /^follow$/i.test(t) || /^seguir$/i.test(t);
    });
    const hasSkip = [...document.querySelectorAll('button, [role=button]')].some((el) => {
      const t = ((el.getAttribute('aria-label') || '') + ' ' + (el.innerText || '')).replace(/\\s+/g, ' ').trim();
      return /^(skip|pular)$/i.test(t) || /^skip without note$/i.test(t);
    });
    const hasMore = [...document.querySelectorAll('button, [role=button]')].some((el) => {
      const t = ((el.getAttribute('aria-label') || '') + ' ' + (el.innerText || '')).replace(/\\s+/g, ' ').trim();
      return /^(more|mais)$/i.test(t) || /more actions/i.test(t) || /mais ações/i.test(t);
    });
    return {
      href: location.href,
      pageMissing,
      pending: pending || hasPendingBtn,
      hasConnect,
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

/** Texto exato no composer LinkedIn messaging. */
export async function fillMessageComposer(page, text, steps) {
  const selectors = [
    'div.msg-form__contenteditable',
    '.msg-form__contenteditable[contenteditable="true"]',
    'div[role="textbox"][contenteditable="true"]',
    '.msg-form formmsg-form__msg-content-container--scrollable div[contenteditable="true"]',
  ];
  let used = null;
  for (const sel of selectors) {
    const box = await page.boundingBox(sel).catch(() => null);
    if (box) {
      used = sel;
      break;
    }
  }
  if (!used) {
    // fallback: qualquer contenteditable visível no rodapé
    const hit = await page.evaluate(`(() => {
      const els = [...document.querySelectorAll('[contenteditable="true"]')];
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (r.width > 40 && r.height > 20 && r.top > innerHeight * 0.4) {
          el.setAttribute('data-sr-composer', '1');
          return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
        }
      }
      return null;
    })()`);
    if (!hit) return false;
    await page.clickAt(hit.cx, hit.cy);
    used = '[data-sr-composer="1"]';
  } else {
    await page.click(used);
  }
  steps?.push(`composer:${used}`);
  await sleep(200);
  // limpa e insere texto exato (Input.insertText via type char-a-char é lento; paste via insertText lote)
  await page.evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(used)}) || document.querySelector('[data-sr-composer="1"]');
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    sel.removeAllRanges();
    sel.addRange(range);
  })()`);
  await page.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Backspace",
    code: "Backspace",
    windowsVirtualKeyCode: 8,
  });
  await page.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Backspace",
    code: "Backspace",
    windowsVirtualKeyCode: 8,
  });
  await sleep(60);
  // type humano (ritmo) — mensagem completa
  await page.type(used, text, { clickFirst: false, clear: false });
  return true;
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

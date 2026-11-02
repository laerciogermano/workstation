import { execFileSync } from 'node:child_process';
import {
  createCdpSession,
  getJson,
  openPage,
  pickPage,
} from './cdp.mjs';
import {
  enableDebugOverlayExpression,
  moveDebugOverlayExpression,
} from './debug-overlay.mjs';
import { applyFingerprint } from './fingerprint.mjs';
import {
  clickGapMs,
  keyGapMs,
  moveAlong,
  pathToTarget,
  pressRelease,
  rand,
  randInt,
  sleep,
} from './human.mjs';
import {
  captureScreenshot,
  findOcrWord,
  ocrFromSession,
} from './ocr.mjs';

/**
 * Última posição do ponteiro por CDP (porta/url) — sobrevive a reconnect.
 * @type {Map<string, { x: number, y: number }>}
 */
const cursorByCdp = new Map();

function cursorKey(cdpUrl) {
  return String(cdpUrl || 'default').replace(/\/$/, '');
}

/**
 * @typedef {object} ConnectOptions
 * @property {string} [cdpUrl]
 * @property {string} [urlIncludes] filtra aba existente
 * @property {string} [url] se setado, abre/navega
 * @property {boolean} [newTab]
 * @property {boolean} [debug] painel de diagnóstico do bot-lab junto ao mouse
 * @property {string} [chromeApp] nome AppleScript (default "Google Chrome")
 */

function activateApp(name) {
  try {
    execFileSync('osascript', ['-e', `tell application "${name}" to activate`], {
      stdio: 'ignore',
    });
  } catch {
    /* ignore */
  }
}

export class HumanCdpSession {
  /**
   * @param {Awaited<ReturnType<typeof createCdpSession>>} cdp
   * @param {object} opts
   */
  constructor(cdp, opts) {
    this._cdp = cdp;
    this.cdpUrl = opts.cdpUrl;
    /** @deprecated sempre true — toda interação chama foco */
    this.focused = true;
    this.debug = !!opts.debug;
    this.chromeApp = opts.chromeApp || 'Google Chrome';
    const saved = cursorByCdp.get(cursorKey(opts.cdpUrl));
    this._cursor = saved ? { ...saved } : { x: 40, y: 40 };
    this._lastFocusAt = 0;
  }

  /** Atualiza cursor interno + mapa persistente (sempre a última posição despachada). */
  _setCursor(x, y) {
    this._cursor = { x, y };
    cursorByCdp.set(cursorKey(this.cdpUrl), { x, y });
  }

  /** Injeta/reativa mouse virtual + painel fixo à direita (no-op se debug=false). */
  async enableDebugOverlay() {
    if (!this.debug) return null;
    return this.evaluate(enableDebugOverlayExpression());
  }

  async _followDebugCursor(x, y) {
    if (!this.debug) return;
    try {
      await this.evaluate(moveDebugOverlayExpression(x, y));
    } catch {
      /* página trocou / ainda sem inject */
    }
  }

  send(method, params) {
    return this._cdp.send(method, params);
  }

  async evaluate(expression, { awaitPromise = false } = {}) {
    const { result } = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise,
    });
    if (result?.subtype === 'error') {
      throw new Error(result.description || 'Runtime.evaluate error');
    }
    return result?.value;
  }

  /** true se a página tem foco real (aba visível + document.hasFocus). */
  async isPageFocused() {
    try {
      return !!(await this.evaluate(
        `document.hasFocus() && document.visibilityState === 'visible' && !document.hidden`,
      ));
    } catch {
      return false;
    }
  }

  /**
   * Garante foco antes de qualquer operação:
   * 1) se já focado → segue
   * 2) senão bringToFront + activate até hasFocus === true
   * @param {{ settleMs?: number, force?: boolean, require?: boolean, attempts?: number }} [opts]
   * @returns {Promise<boolean>}
   */
  async ensureFocus({
    settleMs = 200,
    force = false,
    require = true,
    attempts = 5,
  } = {}) {
    if (!force) {
      const already = await this.isPageFocused();
      if (already) {
        this._lastFocusAt = Date.now();
        return true;
      }
    }

    for (let i = 0; i < attempts; i++) {
      try {
        await this.send('Page.bringToFront');
      } catch {
        /* target pode estar trocando */
      }
      activateApp(this.chromeApp);
      await sleep(settleMs);
      const ok = await this.isPageFocused();
      if (ok) {
        this._lastFocusAt = Date.now();
        return true;
      }
      // último recurso: emulação de foco CDP (alguns hosts)
      if (i >= attempts - 2) {
        try {
          await this.send('Emulation.setFocusEmulationEnabled', { enabled: true });
        } catch {
          /* ignore */
        }
        await sleep(80);
        if (await this.isPageFocused()) {
          this._lastFocusAt = Date.now();
          return true;
        }
      }
    }

    if (require) {
      throw new Error('operação bloqueada: página sem foco (hasFocus=false)');
    }
    return false;
  }

  async bringToFront() {
    await this.ensureFocus({ settleMs: 200, force: true, require: true });
  }

  /**
   * Screenshot da viewport (PNG Buffer).
   * @param {{ format?: 'png'|'jpeg', quality?: number, clip?: object }} [opts]
   */
  async screenshot(opts = {}) {
    return captureScreenshot(this, opts);
  }

  /**
   * OCR da viewport: screenshot CDP + engine (macos-vision|rapidocr|tesseract).
   * @param {{ engine?: string, lang?: string, path?: string, keepFile?: boolean, clip?: object }} [opts]
   * @returns {Promise<{ engine: string, text: string, words: object[], imagePath: string|null }>}
   */
  async ocr(opts = {}) {
    await this.ensureFocus({ require: false }).catch(() => {});
    return ocrFromSession(this, opts);
  }

  /**
   * Localiza texto via OCR e devolve centro (para clickAt).
   * @param {string} query
   * @param {{ engine?: string, lang?: string }} [opts]
   */
  async findByOcr(query, opts = {}) {
    const { words } = await this.ocr(opts);
    return findOcrWord(words, query);
  }

  /**
   * OCR → arrasta e clica no texto encontrado.
   * @param {string} query
   * @param {{ engine?: string, lang?: string, clicks?: number }} [opts]
   */
  async clickOcr(query, opts = {}) {
    const hit = await this.findByOcr(query, opts);
    if (!hit) throw new Error(`OCR não encontrou: ${query}`);
    return this.clickAt(hit.cx, hit.cy, { clicks: opts.clicks ?? 1 });
  }

  async goto(url, { waitUntil = 'complete', timeoutMs = 20000 } = {}) {
    await this.ensureFocus({ force: true });
    await this.send('Page.enable');
    await this.send('Page.navigate', { url });
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const ready = await this.evaluate('document.readyState');
      if (waitUntil === 'interactive' && (ready === 'interactive' || ready === 'complete')) {
        break;
      }
      if (ready === 'complete') break;
      await sleep(150);
    }
    await this.ensureFocus({ settleMs: 150, force: true });
    if (this._fingerprint) {
      await applyFingerprint(this, this._fingerprint);
    }
    // bot-lab: viewport CDP maior que a janela escondia o trilho de comportamento
    if (/127\.0\.0\.1:8766|localhost:8766/.test(String(url))) {
      try {
        await this.send('Emulation.clearDeviceMetricsOverride');
      } catch {
        /* ignore */
      }
    }
    await this.enableDebugOverlay();
  }

  async waitFor(selector, { timeoutMs = 15000, visible = true } = {}) {
    await this.ensureFocus({ settleMs: 100 });
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const box = await this.boundingBox(selector);
      if (box && (!visible || (box.width > 1 && box.height > 1))) return box;
      await sleep(120);
    }
    throw new Error(`waitFor timeout: ${selector}`);
  }

  async boundingBox(selector) {
    return this.evaluate(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      el.scrollIntoView({ block: 'center', inline: 'center' });
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return null;
      return {
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        cx: r.x + r.width / 2,
        cy: r.y + r.height / 2,
      };
    })()`);
  }

  /**
   * Centro (com jitter) de um seletor após scrollIntoView — ponto para onde arrastar.
   * @returns {Promise<{ x: number, y: number, box: object }>}
   */
  async _pointOf(selector, { jitter = 2 } = {}) {
    await this.waitFor(selector);
    const box = await this.boundingBox(selector);
    if (!box) throw new Error(`sem box: ${selector}`);
    return {
      x: box.cx + rand(-jitter, jitter),
      y: box.cy + rand(-jitter, jitter),
      box,
    };
  }

  /**
   * Arrasta o ponteiro continuamente de `_cursor` até (x,y).
   * Sempre multi-ponto — nunca teleporta, mesmo perto do alvo.
   * @returns {{ x: number, y: number }}
   */
  async _moveTo(x, y, { steps, minSteps = 10 } = {}) {
    await this.ensureFocus({ require: true });
    const pts = pathToTarget(this._cursor, { x, y }, { steps, minSteps });
    const last = await moveAlong(this.send.bind(this), pts);
    this._setCursor(last.x, last.y);
    await this._followDebugCursor(last.x, last.y);
    return last;
  }

  /**
   * Clique em coordenadas: foco garantido → arrasta até (x,y) → press.
   * Não pressiona se hasFocus for false.
   * @param {number} x
   * @param {number} y
   * @param {{ clicks?: number, delayMs?: number }} [opts]
   */
  async clickAt(x, y, { clicks = 1, delayMs } = {}) {
    await this.ensureFocus({ force: false, require: true });
    await this._moveTo(x, y);
    await sleep(randInt(40, 120));
    await this.ensureFocus({ require: true });
    for (let i = 0; i < clicks; i++) {
      await this.ensureFocus({ require: true });
      const ox = this._cursor.x + rand(-1.2, 1.2);
      const oy = this._cursor.y + rand(-1.2, 1.2);
      await this._moveTo(ox, oy, { minSteps: 6 });
      await this.ensureFocus({ require: true });
      await pressRelease(this.send.bind(this), this._cursor.x, this._cursor.y);
      await this._followDebugCursor(this._cursor.x, this._cursor.y);
      if (i < clicks - 1) {
        await sleep(delayMs ?? clickGapMs());
      }
    }
  }

  /**
   * Clique humano: foco true → arrasta até o alvo → press/release.
   * @param {string} selector
   * @param {{ clicks?: number, delayMs?: number }} [opts]
   */
  async click(selector, { clicks = 1, delayMs } = {}) {
    await this.ensureFocus({ require: true });
    const { x, y } = await this._pointOf(selector, { jitter: 3 });
    await this.ensureFocus({ require: true });
    return this.clickAt(x, y, { clicks, delayMs });
  }

  /**
   * Hover humano: arrasta até o elemento (sem press).
   * @param {string} selector
   */
  async hover(selector) {
    await this.ensureFocus({ force: true });
    const { x, y } = await this._pointOf(selector, { jitter: 2 });
    await this.ensureFocus({ settleMs: 80, force: true });
    await this._moveTo(x, y);
  }

  /**
   * Digita com ritmo humano. Sempre posiciona o ponteiro no campo antes
   * (`click` ou `hover` — ambos com trajetória).
   */
  async type(selector, text, { clickFirst = true, clear = false } = {}) {
    await this.ensureFocus({ force: true });
    if (clickFirst) await this.click(selector);
    else await this.hover(selector);
    await this.ensureFocus({ settleMs: 100, force: true });
    if (clear) {
      await this.evaluate(`(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return;
        el.focus();
        if (typeof el.select === 'function') el.select();
        else if (window.getSelection && el.childNodes?.length) {
          const range = document.createRange();
          range.selectNodeContents(el);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      })()`);
      await sleep(40);
      await this.send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key: 'Backspace',
        code: 'Backspace',
        windowsVirtualKeyCode: 8,
      });
      await this.send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: 'Backspace',
        code: 'Backspace',
        windowsVirtualKeyCode: 8,
      });
      await sleep(60);
      await this.evaluate(`(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return;
        const proto = Object.getPrototypeOf(el);
        const desc = Object.getOwnPropertyDescriptor(proto, 'value')
          || Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
        if (desc?.set) desc.set.call(el, '');
        else el.value = '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      })()`);
      await sleep(40);
    }
    for (const ch of String(text)) {
      await this.ensureFocus({ settleMs: 0 });
      await this.send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key: ch,
        code: ch.length === 1 && /[a-zA-Z]/.test(ch) ? `Key${ch.toUpperCase()}` : undefined,
        windowsVirtualKeyCode: ch.length === 1 ? ch.toUpperCase().charCodeAt(0) : undefined,
      });
      await this.send('Input.insertText', { text: ch });
      await this.send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: ch,
        code: ch.length === 1 && /[a-zA-Z]/.test(ch) ? `Key${ch.toUpperCase()}` : undefined,
        windowsVirtualKeyCode: ch.length === 1 ? ch.toUpperCase().charCodeAt(0) : undefined,
      });
      await sleep(keyGapMs());
    }
  }

  async fill(selector, text) {
    return this.type(selector, text, { clickFirst: true, clear: true });
  }

  /**
   * Wheel humano. Antes: arrasta até `selector` (se dado) ou centro da viewport.
   * Wheel sempre na posição atual do cursor (nunca teleporta o ponteiro).
   * @param {{ dy?: number, steps?: number, selector?: string }} [opts]
   */
  async scroll({ dy = 400, steps = 12, selector } = {}) {
    await this.ensureFocus({ force: true });
    if (selector) {
      await this.hover(selector);
    } else {
      const mid = await this.evaluate(`({ x: Math.round(innerWidth / 2), y: Math.round(innerHeight / 2) })`);
      await this._moveTo(mid.x + rand(-20, 20), mid.y + rand(-20, 20));
    }
    await sleep(randInt(40, 90));
    for (let i = 0; i < steps; i++) {
      await this.ensureFocus({ settleMs: 0 });
      await this.send('Input.dispatchMouseEvent', {
        type: 'mouseWheel',
        x: this._cursor.x,
        y: this._cursor.y,
        deltaX: 0,
        deltaY: dy / steps,
      });
      await sleep(randInt(20, 45));
    }
  }

  /**
   * Drag humano: arrasta até origem → press → trajetória até destino → release.
   * @param {string} fromSelector
   * @param {{ dx?: number, dy?: number, toSelector?: string, steps?: number }} opts
   */
  async drag(fromSelector, { dx = 160, dy = 0, toSelector, steps } = {}) {
    await this.ensureFocus({ force: true });
    const fromPt = await this._pointOf(fromSelector, { jitter: 2 });
    let toX = fromPt.box.cx + dx;
    let toY = fromPt.box.cy + dy;
    if (toSelector) {
      const toPt = await this._pointOf(toSelector, { jitter: 2 });
      toX = toPt.x;
      toY = toPt.y;
    }
    await this.ensureFocus({ settleMs: 100, force: true });
    await this._moveTo(fromPt.x, fromPt.y);
    await this.ensureFocus({ settleMs: 50, force: true });
    const pressX = this._cursor.x;
    const pressY = this._cursor.y;
    await this.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: pressX,
      y: pressY,
      button: 'left',
      buttons: 1,
      clickCount: 1,
    });
    const pts = pathToTarget(
      { x: pressX, y: pressY },
      { x: toX, y: toY },
      { steps: steps ?? 20, minSteps: 12 },
    );
    const last = await moveAlong(this.send.bind(this), pts, { stepMs: [16, 26] });
    await this.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: last.x,
      y: last.y,
      button: 'left',
      buttons: 0,
      clickCount: 1,
    });
    this._setCursor(last.x, last.y);
    await this._followDebugCursor(last.x, last.y);
  }

  /**
   * Select humano: arrasta+clique no `<select>`; tenta clicar na option;
   * se não achar hit-testável, seta value (fallback) com ponteiro já no controle.
   */
  async select(selector, value) {
    await this.ensureFocus({ force: true });
    await this.click(selector);
    await this.ensureFocus({ settleMs: 100, force: true });
    const optSel = await this.evaluate(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      const opt = [...el.options].find((o) => o.value === ${JSON.stringify(value)} || o.text === ${JSON.stringify(value)});
      if (!opt) return null;
      if (!opt.id) opt.setAttribute('data-human-cdp-opt', '1');
      const r = opt.getBoundingClientRect();
      if (r.width > 2 && r.height > 2) {
        return opt.id ? '#' + opt.id : '[data-human-cdp-opt="1"]';
      }
      return null;
    })()`);
    if (optSel) {
      try {
        await this.click(optSel);
        return value;
      } catch {
        /* fallback abaixo */
      }
    }
    await this.evaluate(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) throw new Error('select missing');
      el.value = ${JSON.stringify(value)};
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return el.value;
    })()`);
  }

  close() {
    this._cdp.close();
  }
}

/**
 * @param {ConnectOptions} opts
 * @returns {Promise<HumanCdpSession>}
 */
export async function connect(opts = {}) {
  const cdpUrl = opts.cdpUrl || process.env.CDP_URL || 'http://127.0.0.1:9230';
  let page;
  if (opts.newTab && opts.url) {
    page = await openPage(cdpUrl, opts.url);
  } else {
    page = await pickPage(cdpUrl, { urlIncludes: opts.urlIncludes });
  }
  const cdp = createCdpSession(page.webSocketDebuggerUrl);
  await cdp.ready;
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  const session = new HumanCdpSession(cdp, {
    cdpUrl,
    chromeApp: opts.chromeApp,
    debug: opts.debug,
  });
  if (opts.url && !opts.newTab) {
    await session.goto(opts.url);
  } else {
    await session.ensureFocus({ force: true });
    await session.enableDebugOverlay();
  }
  await getJson(cdpUrl, '/json/version');
  return session;
}

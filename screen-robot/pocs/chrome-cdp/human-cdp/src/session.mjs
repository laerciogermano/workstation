import { execFileSync } from 'node:child_process';
import {
  createCdpSession,
  getJson,
  openPage,
  pickPage,
} from './cdp.mjs';
import {
  clickGapMs,
  keyGapMs,
  moveAlong,
  pressRelease,
  rand,
  randInt,
  sleep,
  trajectoryPoints,
} from './human.mjs';

/**
 * @typedef {object} ConnectOptions
 * @property {string} [cdpUrl]
 * @property {string} [urlIncludes] filtra aba existente
 * @property {string} [url] se setado, abre/navega
 * @property {boolean} [newTab]
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
    this.chromeApp = opts.chromeApp || 'Google Chrome';
    this._cursor = { x: 40, y: 40 };
    this._lastFocusAt = 0;
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

  /**
   * Obriga foco da aba + app Chrome. Toda interação pública chama isto.
   * @param {{ settleMs?: number, force?: boolean }} [opts]
   */
  async ensureFocus({ settleMs = 280, force = false } = {}) {
    const now = Date.now();
    // evita storm de osascript em type() char-a-char; force=true sempre aplica
    if (!force && now - this._lastFocusAt < 120) {
      await this.send('Page.bringToFront');
      return;
    }
    await this.send('Page.bringToFront');
    try {
      await this.send('Emulation.setFocusEmulationEnabled', { enabled: true });
    } catch {
      /* Chrome antigo / sem suporte */
    }
    activateApp(this.chromeApp);
    await sleep(settleMs);
    this._lastFocusAt = Date.now();
  }

  async bringToFront() {
    await this.ensureFocus({ settleMs: 200, force: true });
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

  async _moveTo(x, y, { steps } = {}) {
    await this.ensureFocus({ settleMs: 80 });
    const dist = Math.hypot(x - this._cursor.x, y - this._cursor.y);
    const n = steps ?? Math.max(18, Math.min(40, Math.round(dist / 12)));
    const pts = trajectoryPoints(this._cursor, { x, y }, { steps: n });
    await moveAlong(this.send.bind(this), pts);
    this._cursor = { x, y };
  }

  /**
   * Clique humano: foco + trajetória + press/release CDP (isTrusted).
   * @param {string} selector
   * @param {{ clicks?: number, delayMs?: number }} [opts]
   */
  async click(selector, { clicks = 1, delayMs } = {}) {
    await this.ensureFocus({ force: true });
    const box = await this.waitFor(selector);
    await this.ensureFocus({ settleMs: 120, force: true });
    const jitterX = rand(-3, 3);
    const jitterY = rand(-3, 3);
    const x = box.cx + jitterX;
    const y = box.cy + jitterY;
    await this._moveTo(x, y);
    await sleep(randInt(40, 120));
    await this.ensureFocus({ settleMs: 60, force: true });
    for (let i = 0; i < clicks; i++) {
      const ox = x + rand(-2, 2);
      const oy = y + rand(-2, 2);
      await pressRelease(this.send.bind(this), ox, oy);
      this._cursor = { x: ox, y: oy };
      if (i < clicks - 1) {
        await this.ensureFocus({ settleMs: 40 });
        await sleep(delayMs ?? clickGapMs());
      }
    }
  }

  async hover(selector) {
    await this.ensureFocus({ force: true });
    const box = await this.waitFor(selector);
    await this.ensureFocus({ settleMs: 80, force: true });
    await this._moveTo(box.cx + rand(-2, 2), box.cy + rand(-2, 2));
  }

  /**
   * Digita caractere a caractere via Input.insertText (ritmo humano).
   * Foca o campo com click humano antes.
   */
  async type(selector, text, { clickFirst = true, clear = false } = {}) {
    await this.ensureFocus({ force: true });
    if (clickFirst) await this.click(selector);
    else await this.hover(selector);
    await this.ensureFocus({ settleMs: 100, force: true });
    if (clear) {
      await this.send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key: 'a',
        code: 'KeyA',
        modifiers: 2,
        windowsVirtualKeyCode: 65,
      });
      await this.send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: 'a',
        code: 'KeyA',
        modifiers: 2,
        windowsVirtualKeyCode: 65,
      });
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
    }
    for (const ch of String(text)) {
      await this.ensureFocus({ settleMs: 0 });
      await this.send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        text: ch,
        unmodifiedText: ch,
        key: ch,
      });
      await this.send('Input.insertText', { text: ch });
      await this.send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: ch,
      });
      await sleep(keyGapMs());
    }
  }

  async fill(selector, text) {
    return this.type(selector, text, { clickFirst: true, clear: true });
  }

  async scroll({ dy = 400, steps = 12 } = {}) {
    await this.ensureFocus({ force: true });
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
   * Drag humano: foco + move + press + trajetória + release.
   * @param {string} fromSelector
   * @param {{ dx?: number, dy?: number, toSelector?: string }} opts
   */
  async drag(fromSelector, { dx = 160, dy = 0, toSelector, steps = 20 } = {}) {
    await this.ensureFocus({ force: true });
    const from = await this.waitFor(fromSelector);
    let toX = from.cx + dx;
    let toY = from.cy + dy;
    if (toSelector) {
      const to = await this.waitFor(toSelector);
      toX = to.cx;
      toY = to.cy;
    }
    await this.ensureFocus({ settleMs: 100, force: true });
    await this._moveTo(from.cx, from.cy);
    await this.ensureFocus({ settleMs: 50, force: true });
    await this.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: from.cx,
      y: from.cy,
      button: 'left',
      buttons: 1,
      clickCount: 1,
    });
    const pts = trajectoryPoints(
      { x: from.cx, y: from.cy },
      { x: toX, y: toY },
      { steps },
    );
    await moveAlong(this.send.bind(this), pts, { stepMs: [12, 22] });
    await this.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: toX,
      y: toY,
      button: 'left',
      buttons: 0,
      clickCount: 1,
    });
    this._cursor = { x: toX, y: toY };
  }

  async select(selector, value) {
    await this.ensureFocus({ force: true });
    await this.click(selector);
    await this.ensureFocus({ settleMs: 80, force: true });
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
  });
  if (opts.url && !opts.newTab) {
    await session.goto(opts.url);
  } else {
    await session.ensureFocus({ force: true });
  }
  await getJson(cdpUrl, '/json/version');
  return session;
}

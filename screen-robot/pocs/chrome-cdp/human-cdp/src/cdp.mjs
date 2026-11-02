/**
 * Sessão WebSocket CDP mínima (sem deps).
 */

export function createCdpSession(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let nextId = 0;
  const pending = new Map();
  /** @type {Map<string, Set<(params: object) => void>>} */
  const listeners = new Map();

  const ready = new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });

  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id != null && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
      return;
    }
    if (msg.method) {
      const set = listeners.get(msg.method);
      if (set) {
        for (const fn of set) {
          try {
            // 2º arg = mensagem crua (sessionId no flatten Target.setAutoAttach)
            fn(msg.params || {}, msg);
          } catch {
            /* ignore */
          }
        }
      }
    }
  });

  /**
   * @param {string} method
   * @param {object} [params]
   * @param {{ sessionId?: string }} [opts]
   */
  async function send(method, params = {}, opts = {}) {
    await ready;
    const id = ++nextId;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      const payload = { id, method, params };
      if (opts.sessionId) payload.sessionId = opts.sessionId;
      ws.send(JSON.stringify(payload));
    });
  }

  function on(method, handler) {
    if (!listeners.has(method)) listeners.set(method, new Set());
    listeners.get(method).add(handler);
    return () => listeners.get(method)?.delete(handler);
  }

  function close() {
    try {
      ws.close();
    } catch {
      /* ignore */
    }
  }

  return { send, close, ready, on, ws };
}

export async function getJson(cdpBase, path) {
  const res = await fetch(`${cdpBase.replace(/\/$/, '')}${path}`);
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return res.json();
}

export async function pickPage(cdpBase, { urlIncludes } = {}) {
  const targets = await getJson(cdpBase, '/json/list');
  const pages = targets.filter((t) => t.type === 'page');
  if (urlIncludes) {
    const hit = pages.find((t) => String(t.url || '').includes(urlIncludes));
    if (hit?.webSocketDebuggerUrl) return hit;
  }
  const page =
    pages.find((t) => !String(t.url || '').startsWith('chrome://')) || pages[0];
  if (!page?.webSocketDebuggerUrl) {
    throw new Error(`Nenhuma página em ${cdpBase}`);
  }
  return page;
}

/**
 * Abre aba sem elevar o Chrome no SO.
 * Usa Target.createTarget({ background: true }) — evita /json/new (roubava foco).
 */
export async function openPage(cdpBase, url) {
  const version = await getJson(cdpBase, '/json/version');
  const browserWs = version?.webSocketDebuggerUrl;
  if (!browserWs) throw new Error('sem browser WS em /json/version');

  const browser = createCdpSession(browserWs);
  await browser.ready;
  let targetId;
  try {
    const created = await browser.send('Target.createTarget', {
      url: url || 'about:blank',
      background: true,
    });
    targetId = created?.targetId;
  } finally {
    browser.close();
  }
  if (!targetId) throw new Error('Target.createTarget sem targetId');

  for (let i = 0; i < 50; i++) {
    const list = await getJson(cdpBase, '/json/list');
    const page = (list || []).find(
      (t) =>
        t.type === 'page' &&
        (t.id === targetId || t.targetId === targetId) &&
        t.webSocketDebuggerUrl,
    );
    if (page) return page;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`aba ${targetId} não apareceu em /json/list`);
}

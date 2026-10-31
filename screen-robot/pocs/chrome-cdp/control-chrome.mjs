#!/usr/bin/env node
/**
 * Conecta num Chrome já aberto com --remote-debugging-port=9222
 * e executa um comando simples (titulo + goto opcional).
 *
 * Uso:
 *   node control-chrome.mjs
 *   node control-chrome.mjs --url https://example.com
 *   CDP_URL=http://127.0.0.1:9222 node control-chrome.mjs
 */

const CDP_BASE = process.env.CDP_URL || 'http://127.0.0.1:9222';
const DEFAULT_URL = 'https://bot.sannysoft.com/';
const args = process.argv.slice(2);
const urlIdx = args.indexOf('--url');
const targetUrl = urlIdx >= 0 ? args[urlIdx + 1] : DEFAULT_URL;

async function getJson(path) {
  const res = await fetch(`${CDP_BASE}${path}`);
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return res.json();
}

function cdpSession(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let nextId = 0;
  const pending = new Map();

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
    }
  });

  async function send(method, params = {}) {
    await ready;
    const id = ++nextId;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  function close() {
    try {
      ws.close();
    } catch {
      /* ignore */
    }
  }

  return { send, close, ready };
}

async function main() {
  const version = await getJson('/json/version');
  console.log('Browser:', version.Browser);
  console.log('UA:', version['User-Agent']);

  const targets = await getJson('/json/list');
  const page =
    targets.find((t) => t.type === 'page' && !String(t.url || '').startsWith('chrome://')) ||
    targets.find((t) => t.type === 'page');

  if (!page?.webSocketDebuggerUrl) {
    console.error('Nenhuma página encontrada em', CDP_BASE);
    console.error(
      'Suba o Chrome com --remote-debugging-port=9222 antes.',
    );
    process.exit(1);
  }

  console.log('Target:', page.title || '(sem título)');
  console.log('URL:', page.url);

  const session = cdpSession(page.webSocketDebuggerUrl);
  await session.ready;
  await session.send('Page.enable');
  await session.send('Runtime.enable');

  console.log('Navigating →', targetUrl);
  await session.send('Page.navigate', { url: targetUrl });
  await new Promise((r) => setTimeout(r, 2500));

  const evalRes = await session.send('Runtime.evaluate', {
    returnByValue: true,
    expression: `({
      title: document.title,
      href: location.href,
      webdriver: navigator.webdriver,
      ua: navigator.userAgent
    })`,
  });

  console.log('Resultado:', evalRes.result.value);
  session.close();
}

main().catch((err) => {
  console.error('Falha:', err.message || err);
  process.exit(1);
});

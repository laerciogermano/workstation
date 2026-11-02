/**
 * Mantém fingerprint em TODAS as abas do CDP enquanto o Chrome estiver up.
 * Conecta no browser WS + Target.setAutoAttach (flatten) — F5/nova aba não
 * perdem o override quando o connectCdp fecha a sessão.
 *
 * Uso: node src/fingerprint-keeper.mjs <cdp-id>
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createCdpSession, getJson } from './cdp.mjs';
import { enableDebugOverlayExpression } from './debug-overlay.mjs';
import { applyFingerprint, normalizeFingerprint } from './fingerprint.mjs';

const id = process.argv[2];
if (!id) {
  console.error('uso: node src/fingerprint-keeper.mjs <cdp-id>');
  process.exit(2);
}

const profileDir = join(homedir(), 'chrome-profiles', id);
const metaPath = join(profileDir, '.human-cdp.json');
const pidPath = join(profileDir, '.fingerprint-keeper.pid');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function readMeta() {
  if (!existsSync(metaPath)) return null;
  try {
    return JSON.parse(readFileSync(metaPath, 'utf8'));
  } catch {
    return null;
  }
}

function portOf() {
  const meta = readMeta();
  return meta?.port ?? meta?.preferredPort ?? null;
}

function loadFp() {
  return normalizeFingerprint(readMeta()?.fingerprint);
}

function loadDebug() {
  return !!readMeta()?.debug;
}

mkdirSync(profileDir, { recursive: true });
writeFileSync(pidPath, String(process.pid));

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

/**
 * Sessão lógica num target page (via flatten + sessionId no browser WS).
 */
function pageSession(browser, sessionId) {
  return {
    send(method, params = {}) {
      return browser.send(method, params, { sessionId });
    },
  };
}

async function attachBrowser(fp) {
  const port = portOf();
  if (port == null) throw new Error('sem porta');
  const cdpBase = `http://127.0.0.1:${port}`;
  const version = await getJson(cdpBase, '/json/version');
  const browserWs = version?.webSocketDebuggerUrl;
  if (!browserWs) throw new Error('sem browser WS');

  const browser = createCdpSession(browserWs);
  await browser.ready;

  /** @type {Map<string, { appliedScript: boolean, debugScript: boolean, timer: NodeJS.Timeout|null }>} */
  const pages = new Map();

  const injectDebug = async (session, st) => {
    if (!loadDebug()) return;
    const source = enableDebugOverlayExpression(loadFp() || fp || null, { id });
    try {
      // fingerprint no overlay pode mudar — re-registra script com FP atual
      await session.send('Page.addScriptToEvaluateOnNewDocument', { source });
      st.debugScript = true;
      await session.send('Runtime.evaluate', {
        expression: source,
        returnByValue: true,
      });
    } catch {
      /* ignore */
    }
  };

  const schedule = (sessionId, { withNewDocumentScript = false } = {}) => {
    const st = pages.get(sessionId);
    if (!st) return;
    if (st.timer) clearTimeout(st.timer);
    st.timer = setTimeout(async () => {
      const session = pageSession(browser, sessionId);
      try {
        const next = loadFp() || fp;
        const needScript = withNewDocumentScript || !st.appliedScript;
        // Sempre aplica spoof de câmera (OBS → FaceTime); fingerprint se houver.
        await applyFingerprint(session, next || null, {
          onNewDocument: needScript,
        });
        if (needScript) st.appliedScript = true;
        await injectDebug(session, st);
      } catch {
        /* target sumiu */
        pages.delete(sessionId);
      }
    }, 0);
  };

  const onAttached = async (params) => {
    const sessionId = params?.sessionId;
    const type = params?.targetInfo?.type;
    if (!sessionId || type !== 'page') return;
    if (pages.has(sessionId)) return;
    pages.set(sessionId, { appliedScript: false, debugScript: false, timer: null });
    try {
      await browser.send('Page.enable', {}, { sessionId });
      await browser.send('Runtime.enable', {}, { sessionId });
      // foco lógico padrão em toda aba (hasFocus/visibility sem depender do SO)
      await browser.send(
        'Emulation.setFocusEmulationEnabled',
        { enabled: true },
        { sessionId },
      );
    } catch {
      pages.delete(sessionId);
      return;
    }
    schedule(sessionId, { withNewDocumentScript: true });
  };

  browser.on('Target.attachedToTarget', onAttached);
  browser.on('Target.detachedFromTarget', (params) => {
    const sessionId = params?.sessionId;
    if (!sessionId) return;
    const st = pages.get(sessionId);
    if (st?.timer) clearTimeout(st.timer);
    pages.delete(sessionId);
  });
  browser.on('Page.frameNavigated', (params, msg) => {
    const sessionId = msg?.sessionId;
    if (!sessionId || !pages.has(sessionId)) return;
    if (params?.frame?.parentId) return;
    // overrides de Network/Emulation costumam sobreviver ao F5 se a sessão
    // do keeper segue aberta; reaplica na hora + patch Runtime.evaluate
    schedule(sessionId, { withNewDocumentScript: false });
  });
  browser.on('Page.loadEventFired', (_params, msg) => {
    const sessionId = msg?.sessionId;
    if (!sessionId || !pages.has(sessionId)) return;
    schedule(sessionId, { withNewDocumentScript: false });
  });

  await browser.send('Target.setDiscoverTargets', { discover: true });
  await browser.send('Target.setAutoAttach', {
    autoAttach: true,
    waitForDebuggerOnStart: false,
    flatten: true,
  });

  // targets já abertos: setAutoAttach costuma anexar; reforço via attachToTarget
  try {
    const { targetInfos } = await browser.send('Target.getTargets', {});
    for (const t of targetInfos || []) {
      if (t.type !== 'page') continue;
      try {
        await browser.send('Target.attachToTarget', {
          targetId: t.targetId,
          flatten: true,
        });
      } catch {
        /* já anexado */
      }
    }
  } catch {
    /* ignore */
  }

  await new Promise((resolve) => {
    browser.ws.addEventListener('close', resolve);
    browser.ws.addEventListener('error', resolve);
  });
  for (const st of pages.values()) {
    if (st.timer) clearTimeout(st.timer);
  }
  pages.clear();
  browser.close();
}

async function main() {
  console.log(`[fingerprint-keeper] ${id} pid=${process.pid} multi-target`);
  while (true) {
    const fp = loadFp();
    const debug = loadDebug();
    // sobe mesmo sem fingerprint se meta.debug (overlay em todas as abas)
    if (!fp && !debug) {
      await sleep(2000);
      continue;
    }
    const port = portOf();
    if (port == null) {
      await sleep(1500);
      continue;
    }
    try {
      await attachBrowser(fp);
    } catch {
      // porta down / sem browser WS — espera e tenta de novo
    }
    await sleep(800);
  }
}

main();

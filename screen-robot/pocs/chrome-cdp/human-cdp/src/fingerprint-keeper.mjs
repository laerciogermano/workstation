/**
 * Mantém fingerprint aplicado no CDP enquanto o Chrome estiver up.
 * Reaplica em frameNavigated / load — F5 e navegações não perdem o override.
 *
 * Uso: node src/fingerprint-keeper.mjs <cdp-id>
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createCdpSession, pickPage } from './cdp.mjs';
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

mkdirSync(profileDir, { recursive: true });
writeFileSync(pidPath, String(process.pid));

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

async function attachOnce(fp) {
  const port = portOf();
  if (port == null) throw new Error('sem porta');
  const cdpBase = `http://127.0.0.1:${port}`;
  const page = await pickPage(cdpBase);
  const session = createCdpSession(page.webSocketDebuggerUrl);
  await session.ready;
  await session.send('Page.enable', {});
  await session.send('Runtime.enable', {});
  await applyFingerprint(session, fp);

  let timer = null;
  const reapply = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      const next = loadFp() || fp;
      try {
        await applyFingerprint(session, next);
      } catch {
        /* target sumiu — loop externo reconecta */
      }
    }, 120);
  };

  session.on('Page.frameNavigated', (params) => {
    if (params?.frame?.parentId) return; // só main frame
    reapply();
  });
  session.on('Page.loadEventFired', reapply);
  session.on('Page.navigatedWithinDocument', reapply);

  await new Promise((resolve) => {
    session.ws.addEventListener('close', resolve);
    session.ws.addEventListener('error', resolve);
  });
  session.close();
}

async function main() {
  console.log(`[fingerprint-keeper] ${id} pid=${process.pid}`);
  while (true) {
    const fp = loadFp();
    if (!fp) {
      await sleep(2000);
      continue;
    }
    const port = portOf();
    if (port == null) {
      await sleep(1500);
      continue;
    }
    try {
      await attachOnce(fp);
    } catch (err) {
      // porta down / sem página — espera e tenta de novo
    }
    await sleep(800);
  }
}

main();

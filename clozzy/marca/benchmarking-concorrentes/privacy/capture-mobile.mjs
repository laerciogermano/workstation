/**
 * Privacy — captura mobile: 1 print por página, sem repetidos (hash + URL canônica).
 * Uso: node capture-mobile.mjs
 */
import { createHash } from 'crypto';
import { writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { connectCdp, sleep } from '../../../../screen-robot/pocs/chrome-cdp/human-cdp/src/index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'prints', 'mobile');
const USER = 'benchmarking@brsupply.email';
const PASS = 'Pr!vacyBench26';

const MOBILE = {
  width: 390,
  height: 844,
  deviceScaleFactor: 3,
  mobile: true,
  screenWidth: 390,
  screenHeight: 844,
};

/** Uma captura por rota/estado visual distinto — sem passos intermediários. */
const PAGES = [
  { name: '01-login', url: 'https://privacy.com.br/auth?route=sign-in', phase: 'public' },
  { name: '02-signup', url: 'https://privacy.com.br/auth?route=sign-up', phase: 'public', after: 'signupAssinante' },
  { name: '03-signup-creator', url: 'https://privacy.com.br/auth?route=sign-up', phase: 'public', after: 'signupCreator', allowSameUrl: true },
  { name: '04-help', url: 'https://privacy.com.br/help/pt', phase: 'public' },
  { name: '05-termos', url: 'https://privacy.com.br/termos', phase: 'public' },
  { name: '06-como-funciona', url: 'https://privacy.com.br/howitworks', phase: 'public' },
  { name: '07-blog-features', url: 'https://blog.privacy.com.br/guia-de-funcionalidades-da-privacy-que-todo-creator-precisa-conhecer/', phase: 'public' },
  // logado — bottom “Em alta” = destaques (não duplicar)
  { name: '10-destaques', url: 'https://privacy.com.br/topcreators?tab=destaques', phase: 'logged' },
  { name: '11-top-creators', url: 'https://privacy.com.br/topcreators?tab=top-creators', phase: 'logged', altNav: ['Top Creators'], allowSameUrl: true },
  { name: '12-feed', url: 'https://privacy.com.br/', phase: 'logged', altNav: ['Feed'] },
  { name: '15-search', url: 'https://privacy.com.br/search', phase: 'logged', altNav: ['Busca'] },
  { name: '16-chat', url: 'https://privacy.com.br/chat', phase: 'logged', altNav: ['Chat'] },
  { name: '17-notifications', url: 'https://privacy.com.br/creator-hub', phase: 'logged', altNav: ['Notifications', 'Notificações'] },
  { name: '18-wallet', url: 'https://privacy.com.br/topcreators', phase: 'logged', altNav: ['Recarregar'], allowSameUrl: true },
  { name: '19-settings', url: 'https://privacy.com.br/settings', phase: 'logged' },
  { name: '20-user-menu', url: 'https://privacy.com.br/topcreators', phase: 'logged', altNav: ['User menu'], allowSameUrl: true },
];

const seenHash = new Map();
const seenCanon = new Map();
const manifest = [];

function canonUrl(href) {
  try {
    const u = new URL(href);
    u.hash = '';
    // normaliza query order
    return `${u.origin}${u.pathname}${u.search}`.replace(/\/$/, '') || u.origin;
  } catch {
    return href;
  }
}

async function emulateMobile(page) {
  await page.send('Emulation.setDeviceMetricsOverride', MOBILE);
  await page.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await page.send('Network.setUserAgentOverride', {
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    platform: 'iPhone',
  });
}

async function info(page) {
  return page.evaluate(`({
    href: location.href,
    title: document.title,
    w: innerWidth,
    h: innerHeight
  })`);
}

async function focusBackend(page, backendId) {
  const { model } = await page.send('DOM.getBoxModel', { backendNodeId: backendId });
  const [x1, y1, , , x3, y3] = model.content;
  const cx = Math.round((x1 + x3) / 2);
  const cy = Math.round((y1 + y3) / 2);
  await page.clickAt(cx, cy);
  return { cx, cy };
}

async function typeText(page, text) {
  for (const ch of text) {
    await page.send('Input.insertText', { text: ch });
    await sleep(28 + Math.random() * 40);
  }
}

async function dismissNoise(page) {
  for (const label of ['Fechar', 'Agora não', 'Pular', 'Entendi', 'Continuar']) {
    try {
      const hit = await page.findByOcr(label);
      if (hit) {
        await page.clickAt(hit.cx, hit.cy);
        await sleep(300);
      }
    } catch {}
  }
}

async function axButtons(page) {
  await page.send('Accessibility.enable').catch(() => {});
  const ax = await page.send('Accessibility.getFullAXTree');
  return (ax.nodes || [])
    .filter((n) => (n.role?.value || '') === 'button')
    .map((n) => ({ name: n.name?.value || '', backend: n.backendDOMNodeId }));
}

async function axTextboxes(page) {
  await page.send('Accessibility.enable').catch(() => {});
  const ax = await page.send('Accessibility.getFullAXTree');
  return (ax.nodes || []).filter((n) => (n.role?.value || '') === 'textbox');
}

async function clickAxName(page, exactName) {
  const btns = await axButtons(page);
  const b = btns.find((x) => x.name === exactName);
  if (!b?.backend) throw new Error(`AX button missing: ${exactName}`);
  await focusBackend(page, b.backend);
}

async function goto(page, url) {
  await emulateMobile(page);
  await page.goto(url, { waitUntil: 'complete', timeoutMs: 35000 });
  await sleep(1400);
  await dismissNoise(page);
}

async function shot(page, name, { allowSameUrl = false } = {}) {
  await emulateMobile(page);
  await sleep(250);
  await dismissNoise(page);
  const meta = await info(page);
  const canon = canonUrl(meta.href);
  const buf = await page.screenshot();
  const hash = createHash('sha256').update(buf).digest('hex').slice(0, 16);

  if (seenHash.has(hash)) {
    console.log(`SKIP hash-dup ${name} == ${seenHash.get(hash)} | ${canon}`);
    return { ok: false, reason: 'hash-dup', meta, canon, other: seenHash.get(hash) };
  }
  if (!allowSameUrl && seenCanon.has(canon)) {
    console.log(`SKIP url-dup ${name} == ${seenCanon.get(canon)} | ${canon}`);
    return { ok: false, reason: 'url-dup', meta, canon, other: seenCanon.get(canon) };
  }

  seenHash.set(hash, name);
  if (!seenCanon.has(canon)) seenCanon.set(canon, name);
  writeFileSync(join(OUT, `${name}.png`), buf);
  console.log(`OK ${name} | ${meta.w}x${meta.h} | ${canon}`);
  return { ok: true, meta, canon, hash };
}

async function signupAssinante(page) {
  // default já é assinante
  await sleep(400);
}

async function signupCreator(page) {
  try {
    await page.clickOcr('Seja creator');
  } catch {
    const btns = await axButtons(page);
    const b = btns.find((x) => /creator/i.test(x.name));
    if (b?.backend) await focusBackend(page, b.backend);
  }
  await sleep(900);
}

async function logout(page) {
  // limpa sessão pra capturar telas públicas limpas
  await page.evaluate(`(() => {
    try { localStorage.clear(); sessionStorage.clear(); } catch {}
  })`);
  const cookies = await page.send('Network.getAllCookies');
  const privacy = (cookies.cookies || []).filter((c) => /privacy/i.test(c.domain));
  if (privacy.length) {
    await page.send('Network.deleteCookies', { name: privacy[0].name, domain: privacy[0].domain }).catch(() => {});
    for (const c of privacy) {
      await page.send('Network.deleteCookies', { name: c.name, domain: c.domain, path: c.path }).catch(() => {});
    }
  }
  await goto(page, 'https://privacy.com.br/auth?route=sign-in');
  console.log('logout →', await page.evaluate('location.href'));
}

async function login(page) {
  await goto(page, 'https://privacy.com.br/auth?route=sign-in');
  const href = await page.evaluate('location.href');
  if (/topcreators|timeline|feed|wallet|chat/i.test(href) && !/auth\?route=sign-in/i.test(href)) {
    console.log('already logged', href);
    return;
  }
  const boxes = await axTextboxes(page);
  if (boxes.length < 2) throw new Error('login textboxes não achados');
  await focusBackend(page, boxes[0].backendDOMNodeId);
  await sleep(150);
  await page.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    modifiers: 4,
    key: 'a',
    code: 'KeyA',
    windowsVirtualKeyCode: 65,
  });
  await page.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    modifiers: 4,
    key: 'a',
    code: 'KeyA',
    windowsVirtualKeyCode: 65,
  });
  await typeText(page, USER);
  await focusBackend(page, boxes[1].backendDOMNodeId);
  await sleep(150);
  await typeText(page, PASS);
  await clickAxName(page, 'Entrar');
  await sleep(4500);
  console.log('logged →', await page.evaluate('location.href'));
}

async function tryAltUrls(page, entry) {
  const urls = [entry.url, ...(entry.altUrls || [])];
  for (const url of urls) {
    await goto(page, url);
    const meta = await info(page);
    const c = canonUrl(meta.href);
    // se caiu no auth, falhou
    if (/auth\?route=sign-in/i.test(c)) continue;
    // se URL mudou para algo útil ≠ só topcreators genérico quando pedimos outra coisa
    return meta;
  }
  return info(page);
}

async function tryBottomNav(page, labels) {
  if (!labels?.length) return false;
  for (const label of labels) {
    try {
      // botão AX primeiro
      const btns = await axButtons(page);
      const b = btns.find((x) => x.name === label || x.name.includes(label));
      if (b?.backend) {
        await focusBackend(page, b.backend);
        await sleep(1500);
        return true;
      }
    } catch {}
    try {
      await page.clickOcr(label);
      await sleep(1500);
      return true;
    } catch {}
  }
  return false;
}

async function captureOne(page, entry) {
  if (entry.phase === 'public') {
    await goto(page, entry.url);
    if (entry.after === 'signupAssinante') await signupAssinante(page);
    if (entry.after === 'signupCreator') await signupCreator(page);
    return shot(page, entry.name, { allowSameUrl: !!entry.allowSameUrl });
  }

  await tryAltUrls(page, entry);
  let r = await shot(page, entry.name, { allowSameUrl: !!entry.allowSameUrl });
  if (r.ok) return r;

  // se url/hash dup — tenta nav UI
  if (entry.altNav) {
    console.log(`  retry UI ${entry.name}…`);
    const ok = await tryBottomNav(page, entry.altNav);
    if (ok) {
      r = await shot(page, entry.name, { allowSameUrl: true });
      if (r.ok) return r;
    }
  }

  // feed: clicar ícone esquerda da bottom nav via OCR genérico
  if (entry.name === '13-feed') {
    try {
      const ocr = await page.ocr();
      // bottom nav ~ y>750
      const candidates = (ocr.words || []).filter((w) => (w.bounds?.y ?? w.cy ?? 0) > 720);
      console.log(
        '  bottom words',
        candidates.map((w) => w.text).join(','),
      );
    } catch {}
  }

  return r;
}

function cleanOldPngs() {
  mkdirSync(OUT, { recursive: true });
  for (const f of readdirSync(OUT)) {
    if (f.endsWith('.png') && !f.startsWith('_')) unlinkSync(join(OUT, f));
  }
}

async function main() {
  cleanOldPngs();
  const page = await connectCdp('benchmarking', { keepBrowser: true });
  await emulateMobile(page);

  console.log('\n=== LOGOUT ===');
  await logout(page);

  console.log('\n=== PUBLIC ===');
  for (const p of PAGES.filter((x) => x.phase === 'public')) {
    const r = await captureOne(page, p);
    manifest.push({ name: p.name, ok: r.ok, reason: r.reason, other: r.other, href: r.meta?.href, canon: r.canon });
  }

  console.log('\n=== LOGIN ===');
  await login(page);

  console.log('\n=== LOGGED ===');
  for (const p of PAGES.filter((x) => x.phase === 'logged')) {
    const r = await captureOne(page, p);
    manifest.push({ name: p.name, ok: r.ok, reason: r.reason, other: r.other, href: r.meta?.href, canon: r.canon });
  }

  // descobrir rotas reais da bottom nav / menu se faltou algo
  console.log('\n=== DISCOVER LINKS ===');
  await goto(page, 'https://privacy.com.br/topcreators');
  await sleep(1000);
  const links = await page.evaluate(`[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).filter(Boolean).slice(0,80)`);
  // shadow pierce via AX names
  const btns = await axButtons(page);
  writeFileSync(
    join(OUT, '_discover.json'),
    JSON.stringify({ links, buttons: btns.map((b) => b.name) }, null, 2),
  );

  writeFileSync(join(OUT, '_manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('\nSaved:', [...seenHash.values()].join(', '));
  console.log('Skipped:', manifest.filter((m) => !m.ok).map((m) => `${m.name}(${m.reason}->${m.other})`).join(', '));
  page.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Recaptura desktop: chat / notifications / wallet (estavam iguais ao Explore).
 * Uso: node capture-desktop-fix3.mjs
 */
import { createHash } from 'crypto';
import { writeFileSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { connectCdp, sleep } from '../../../../screen-robot/pocs/chrome-cdp/human-cdp/src/index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'prints', 'desktop');
const USER = 'benchmarking@brsupply.email';
const PASS = 'Pr!vacyBench26';

const DESKTOP = {
  width: 1440,
  height: 900,
  deviceScaleFactor: 2,
  mobile: false,
  screenWidth: 1440,
  screenHeight: 900,
};

function sha(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function existingHashes(excludeNames = []) {
  const map = new Map();
  for (const f of readdirSync(OUT)) {
    if (!f.endsWith('.png') || f.startsWith('_')) continue;
    if (excludeNames.includes(f)) continue;
    const buf = readFileSync(join(OUT, f));
    map.set(sha(buf), f);
  }
  return map;
}

async function emulateDesktop(page) {
  await page.send('Emulation.clearDeviceMetricsOverride').catch(() => {});
  await page.send('Emulation.setDeviceMetricsOverride', DESKTOP);
  await page.send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await page.send('Network.setUserAgentOverride', {
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36',
    platform: 'MacIntel',
  });
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

async function clickAxName(page, exactName) {
  const btns = await axButtons(page);
  const b = btns.find((x) => x.name === exactName);
  if (!b?.backend) throw new Error(`AX button missing: ${exactName}`);
  await focusBackend(page, b.backend);
}

async function goto(page, url) {
  await emulateDesktop(page);
  await page.goto(url, { waitUntil: 'complete', timeoutMs: 35000 });
  await sleep(1600);
  await dismissNoise(page);
}

async function login(page) {
  await goto(page, 'https://privacy.com.br/auth?route=sign-in');
  const href = await page.evaluate('location.href');
  if (/topcreators|timeline|feed|wallet|chat|creator-hub/i.test(href) && !/auth\?route=sign-in/i.test(href)) {
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

async function clickLabels(page, labels) {
  for (const label of labels) {
    try {
      const btns = await axButtons(page);
      const b = btns.find((x) => x.name === label || (x.name && x.name.includes(label)));
      if (b?.backend) {
        await focusBackend(page, b.backend);
        await sleep(1600);
        return true;
      }
    } catch {}
    try {
      await page.clickOcr(label);
      await sleep(1600);
      return true;
    } catch {}
  }
  return false;
}

async function shot(page, name, hashes) {
  await emulateDesktop(page);
  await sleep(400);
  await dismissNoise(page);
  const href = await page.evaluate('location.href');
  const buf = await page.screenshot();
  const hash = sha(buf);
  if (hashes.has(hash)) {
    throw new Error(`${name} ainda hash-dup de ${hashes.get(hash)} | ${href}`);
  }
  writeFileSync(join(OUT, name), buf);
  hashes.set(hash, name);
  console.log(`OK ${name} | ${href} | ${hash.slice(0, 12)}`);
  return { href, hash };
}

async function main() {
  const targets = ['30-chat.png', '31-wallet.png', '36-messages.png', '37-notifications.png'];
  const hashes = existingHashes(targets);
  const page = await connectCdp('benchmarking', { keepBrowser: true });
  await emulateDesktop(page);

  console.log('=== LOGIN ===');
  await login(page);
  await dismissNoise(page);

  console.log('=== CHAT ===');
  await goto(page, 'https://privacy.com.br/chat');
  // mesma tela → 30-chat e 36-messages (HTML usa os dois nomes)
  const chat = await shot(page, '30-chat.png', hashes);
  writeFileSync(join(OUT, '36-messages.png'), readFileSync(join(OUT, '30-chat.png')));
  hashes.set(chat.hash, '36-messages.png');
  console.log('OK 36-messages.png (cópia canônica do chat)');

  console.log('=== NOTIFICATIONS ===');
  await goto(page, 'https://privacy.com.br/creator-hub');
  await clickLabels(page, ['Notificações', 'Notifications']);
  await shot(page, '37-notifications.png', hashes);

  console.log('=== WALLET ===');
  await goto(page, 'https://privacy.com.br/topcreators');
  const ok = await clickLabels(page, ['Recarregar', 'carteira', 'Carteira']);
  if (!ok) {
    // tenta menu usuário
    await clickLabels(page, ['User menu', 'Perfil', 'BE']);
    await clickLabels(page, ['Recarregar', 'Carteira', 'carteira']);
  }
  await sleep(800);
  await shot(page, '31-wallet.png', hashes);

  page.close();
  console.log('done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

// No Chrome instalado: monta os exemplos, confere o desenho e mede o fluxo grande.
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { serve } from '../scripts/serve.mjs';

const server = await serve(5291);
const base = 'http://127.0.0.1:5291/example/';
const shots = new URL('../test-results/', import.meta.url).pathname;
mkdirSync(shots, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const step = (s) => console.log('✓', s);

try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 640 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const texts = () => page.locator('main svg text').allTextContents();

  const expected = { estado: ['receber', 'envio'], sequencial: ['triplicar', 'total = 105', 'parcelas'], objeto: ['cliente', 'endereco', 'id = 1'], ifElse: ['if (aprovada)', 'else · senão'], switch: ['case "pix"'], blocos: ['for (item of itens)', 'try', 'catch'], abstrata: ['abstrato', 'hello'], responsaveis: ['Claude', 'carrinho'] };
  for (const [ex, words] of Object.entries(expected)) {
    await page.goto(`${base}?ex=${ex}`);
    await page.locator('main svg text').first().waitFor();
    const found = await texts();
    for (const w of words) assert.ok(found.includes(w), `${ex}: falta "${w}" em ${found}`);
    await page.screenshot({ path: `${shots}${ex}.png` });
  }
  step('os oito exemplos aparecem desenhados');

  const reais = { checkout: ['finalizarCompra', 'cobrarCartao', 'confirmacao'], campanha: ['incluirPixel'], orcamento: ['cotarImportado'], login: ['compararSenha'], pipeline: ['implantarProducao'], atendimento: ['classificarIntencao'], comando: ['conferirPolitica'], sistema: ['empresa'] };
  for (const [ex, words] of Object.entries(reais)) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${base}?ex=${ex}`);
    await page.locator('main svg text').first().waitFor();
    const found = await page.locator('main svg title, main svg text').allTextContents();
    for (const w of words) assert.ok(found.includes(w), `${ex}: falta "${w}"`);
    await page.screenshot({ path: `${shots}real-${ex}.png` });
  }
  await page.setViewportSize({ width: 1100, height: 640 });
  step('os casos reais aparecem desenhados');

  // geometria real: paralelas no mesmo x, sequenciais lado a lado
  await page.goto(`${base}?ex=sequencial`);
  const pill = (name) => page.evaluate((name) => {
    const title = [...document.querySelectorAll('main svg title')].find((t) => t.textContent === name && t.parentElement.querySelector(':scope > rect[rx="11"]'));
    const { x, y } = title.parentElement.querySelector(':scope > rect[rx="11"]').getBoundingClientRect();
    return { x, y };
  }, name);
  const [ler, dobrar, triplicar, somar] = await Promise.all(['ler', 'dobrar', 'triplicar', 'somar'].map(pill));
  assert.equal(dobrar.x, triplicar.x);
  assert.equal(dobrar.x - ler.x, 160);
  assert.equal(somar.x - dobrar.x, 160);
  assert.ok(ler.y < dobrar.y && dobrar.y < triplicar.y);
  step('posições conferem: paralelas alinhadas, sequenciais um passo à direita');

  await page.goto(`${base}?ex=blocos&tema=claro`);
  assert.equal(await page.locator('main svg .bg').first().evaluate((el) => getComputedStyle(el).fill), 'rgb(255, 255, 255)');
  await page.screenshot({ path: `${shots}claro.png` });
  step('tema claro');

  await page.goto(`${base}?ex=checkout`);
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    const loaded = [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, ''));
    const family = (q) => getComputedStyle(document.querySelector(q)).fontFamily;
    return { loaded: [...new Set(loaded)], diagram: family('main svg text'), page: family('nav'), button: family('.fv-level') };
  });
  assert.deepEqual(fonts.loaded.sort(), ['IBM Plex Mono', 'IBM Plex Sans']);
  assert.match(fonts.diagram, /^"IBM Plex Mono"/);
  assert.match(fonts.page, /^"IBM Plex Sans"/);
  assert.match(fonts.button, /^"IBM Plex Sans"/);
  assert.deepEqual(await page.evaluate(() => performance.getEntriesByType('resource').map((r) => new URL(r.name).host).filter((h) => h !== location.host)), []);
  await page.screenshot({ path: `${shots}fonte.png` });
  step('fontes IBM Plex carregadas do próprio pacote');

  // ----- zoom e deslocamento -----
  await page.goto(`${base}?ex=sequencial`);
  const level = page.getByRole('button', { name: 'Voltar a 100%' });
  const frame = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const click = async (name) => { await page.getByRole('button', { name }).click(); await frame(); };
  const width = async () => (await pill('dobrar')) && page.evaluate(() => [...document.querySelectorAll('main svg title')].find((t) => t.textContent === 'dobrar' && t.parentElement.querySelector(':scope > rect[rx="11"]')).parentElement.querySelector(':scope > rect[rx="11"]').getBoundingClientRect().width);
  assert.equal(await level.innerText(), '100%');
  const normal = await width();
  await click('Aumentar zoom');
  assert.equal(await level.innerText(), '125%');
  assert.ok(Math.abs((await width()) - normal * 1.25) < 1);
  await click('Diminuir zoom'); await click('Diminuir zoom');
  assert.equal(await level.innerText(), '80%');
  await level.click(); await frame();
  assert.equal(await level.innerText(), '100%');
  const area = await page.locator('main > div').boundingBox();
  await page.mouse.move(area.x + 700, area.y + 200);
  await page.mouse.wheel(0, -500); await frame();
  assert.ok(Number((await level.innerText()).replace('%', '')) > 150);
  const before = await pill('somar');
  await page.mouse.move(area.x + 700, area.y + 300); await page.mouse.down();
  await page.mouse.move(area.x + 600, area.y + 260, { steps: 4 }); await page.mouse.up(); await frame();
  const after = await pill('somar');
  assert.ok(Math.abs(before.x - after.x - 100) < 1.5 && Math.abs(before.y - after.y - 40) < 1.5, `arrastar move: ${JSON.stringify({ before, after })}`);
  await page.screenshot({ path: `${shots}zoom.png` });
  await click('Ajustar à tela');
  assert.equal(await level.innerText(), '100%');
  await page.locator('main > div').focus();
  await page.keyboard.press('+'); await frame();
  assert.equal(await level.innerText(), '125%');
  await page.keyboard.press('-'); await frame();
  assert.equal(await level.innerText(), '100%');
  step('zoom por botões, roda (no cursor) e teclado; arrastar move');

  // ----- minimizar -----
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${base}?ex=pipeline`);
  const names = () => page.evaluate(() => window.view.visible.rows.map((i) => window.view.layout.rows[i].name));
  const left = () => page.locator('main > div > svg > g title').allTextContents();
  const total = (await names()).length;
  const pills = () => page.locator('main svg text.step').allTextContents();
  const stepsBefore = await pills();
  const where = () => page.getByRole('button', { name: /(Minimizar|Expandir) if \(tudo passou\)/ }).boundingBox();
  const spot = await where();
  await page.getByRole('button', { name: 'Minimizar if (tudo passou)' }).click();
  assert.ok(!(await names()).includes('compilar') && (await names()).includes('else · senão'));
  assert.ok(!(await left()).includes('compilar'));
  assert.equal((await where()).y, spot.y, 'a linha clicada não pode sair do lugar');
  assert.deepEqual(await pills(), stepsBefore, 'os passos não mudam');
  await page.screenshot({ path: `${shots}minimizado.png` });
  await page.getByRole('button', { name: 'Expandir if (tudo passou)' }).focus();
  await page.keyboard.press('Enter');
  assert.equal((await names()).length, total);
  await page.keyboard.press('Enter');
  assert.ok((await names()).length < total, 'o foco continua na seta depois de redesenhar');
  await page.getByRole('button', { name: 'Expandir tudo' }).click();
  assert.equal((await names()).length, total);
  assert.ok(await page.getByRole('button', { name: 'Expandir tudo' }).isDisabled());
  await page.getByRole('button', { name: 'Minimizar tudo' }).click();
  assert.deepEqual(await names(), ['publicar', 'baixarCodigo', 'instalar', 'lint', 'conferirTipos', 'testar', 'if (tudo passou)', 'else · senão']);
  assert.ok(await page.getByRole('button', { name: 'Minimizar tudo' }).isDisabled());
  await page.screenshot({ path: `${shots}tudo-minimizado.png` });
  await page.getByRole('button', { name: 'Expandir if (tudo passou)' }).click();
  assert.ok((await names()).includes('switch (ambiente)') && !(await names()).includes('aprovarDeploy'), 'o nível de baixo continua minimizado');
  await page.evaluate(() => window.view.update(window.view.layout.rows[0].node));
  assert.ok(!(await names()).includes('aprovarDeploy'), 'trocar a árvore mantém o que estava minimizado');
  step('minimizar um a um (clique e teclado), minimizar tudo e expandir tudo');
  await page.setViewportSize({ width: 1100, height: 640 });

  await page.goto(`${base}?ex=grande&n=20000`);
  await page.locator('main svg text').first().waitFor();
  const mounted = await page.evaluate(() => window.mountedIn);
  const nodes = () => page.locator('main > div > svg *').count();
  assert.ok(mounted < 1500, `montagem lenta: ${mounted} ms`);
  assert.ok((await nodes()) < 2500);
  const head = await page.locator('main svg text', { hasText: 'SOURCE' }).boundingBox();
  const result = await page.evaluate(async () => {
    const svg = document.querySelector('main > div > svg');
    const next = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const row = window.view.layout.rows[12000];
    const measure = async (zoom) => {
      window.view.zoomTo(zoom);
      const times = [];
      let most = 0;
      for (let i = 1; i <= 30; i++) {
        window.view.panTo((row.start * 160 * i) / 30, (row.index * 34 * i) / 30);
        const began = performance.now();
        await next();
        times.push(performance.now() - began);
        most = Math.max(most, svg.querySelectorAll('*').length);
      }
      times.sort((a, b) => a - b);
      return { median: times[15], worst: times.at(-1), most };
    };
    const far = await measure(0.1);
    const mid = await measure(0.4);
    const near = await measure(1);
    window.view.panTo(row.start * 160 - 100, row.index * 34 - 100);
    await next();
    return { name: row.name, found: [...svg.querySelectorAll('text')].some((t) => t.textContent === row.name), far, mid, near };
  });
  assert.ok(result.found, `a linha ${result.name} deveria estar à vista`);
  for (const [name, r] of Object.entries({ '10%': result.far, '40%': result.mid, '100%': result.near })) {
    assert.ok(r.most < 4000, `${name}: elementos demais: ${r.most}`);
    assert.ok(r.median < 50, `${name}: lento: ${r.median} ms por dois quadros`);
    console.log(`  20 mil funções a ${name}: ${r.median.toFixed(1)} ms (mediana de 2 quadros), pior ${r.worst.toFixed(1)} ms · até ${r.most} elementos`);
  }
  assert.equal((await page.locator('main svg text', { hasText: 'SOURCE' }).boundingBox()).y, head.y);
  await page.screenshot({ path: `${shots}grande.png` });
  await click('Ajustar à tela');
  assert.equal(await level.innerText(), '10%');
  assert.ok(await page.getByRole('button', { name: 'Diminuir zoom' }).isDisabled());
  await page.screenshot({ path: `${shots}grande-longe.png` });
  console.log(`  montagem ${Math.round(mounted)} ms`);
  const times = await page.evaluate(() => {
    const t = (fn) => { const a = performance.now(); fn(); return performance.now() - a; };
    return { close: t(() => window.view.collapseAll()), rows: window.view.visible.rows.length, open: t(() => window.view.expandAll()) };
  });
  assert.ok(times.close < 500 && times.open < 500 && times.rows < 3000, JSON.stringify(times));
  console.log(`  minimizar tudo ${times.close.toFixed(0)} ms · expandir tudo ${times.open.toFixed(0)} ms`);
  step('fluxo grande: navega em qualquer zoom com cabeçalho fixo e DOM pequeno');

  await page.setViewportSize({ width: 600, height: 400 });
  await page.waitForFunction(() => Number(document.querySelector('main > div > svg').getAttribute('width')) <= 600);
  await page.evaluate(() => window.view.update({ name: 'outro', children: [{ name: 'novo' }] }));
  assert.equal(await page.evaluate(() => window.view.camera.zoom), 0.1, 'trocar a árvore mantém o zoom');
  await page.evaluate(async () => { window.view.zoomTo(1); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); });
  assert.ok((await texts()).includes('novo'));
  await page.evaluate(() => window.view.destroy());
  assert.equal(await page.locator('main > *').count(), 0);
  step('acompanha o tamanho da tela, atualiza a árvore e desmonta sem deixar restos');

  assert.deepEqual(errors, []);
  console.log('\nTudo passou.');
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
}

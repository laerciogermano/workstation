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

  const expected = { estado: ['receber', 'envio'], sequencial: ['triplicar', 'total = 105', 'parcelas'], objeto: ['cliente', 'endereco', 'id = 1'], ifElse: ['if (aprovada)', 'else', 'otherwise'], switch: ['case "pix"'], blocos: ['for (item of itens)', 'try', 'catch'], abstrata: ['abstract', 'hello'], responsaveis: ['Claude', 'carrinho'] };
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
  /** 100%, com o canto do desenho no canto da janela */
  const actual = () => page.evaluate(async () => {
    window.view.zoomTo(1);
    window.view.panTo(0, 0);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
  await actual();
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
    return { loaded: [...new Set(loaded)], diagram: family('main svg text'), page: family('.topbar .ttl'), button: family('#zv') };
  });
  assert.deepEqual(fonts.loaded.sort(), ['IBM Plex Mono', 'IBM Plex Sans']);
  assert.match(fonts.diagram, /^"IBM Plex Mono"/);
  assert.match(fonts.page, /^"IBM Plex Sans"/);
  assert.match(fonts.button, /^"IBM Plex Sans"/);
  assert.deepEqual(await page.evaluate(() => performance.getEntriesByType('resource').map((r) => new URL(r.name).host).filter((h) => h !== location.host)), []);
  await page.screenshot({ path: `${shots}fonte.png` });
  step('fontes IBM Plex carregadas do próprio pacote');

  // ----- zoom e deslocamento, como no editor FOP -----
  await page.goto(`${base}?ex=sequencial`);
  const level = page.locator('#zv');
  const frame = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const click = async (name) => { await page.getByRole('button', { name, exact: true }).click(); await frame(); };
  const box = (query, word) => page.evaluate(([query, word]) => {
    const found = [...document.querySelectorAll(query)].find((e) => e.textContent === word);
    const { x, y, width } = found.getBoundingClientRect();
    return { x, y, width };
  }, [query, word]);
  const percent = async () => Number((await level.innerText()).replace('%', ''));
  await frame();
  const fitted = await percent();
  assert.ok(fitted >= 20 && fitted <= 100, `ajuste automático: ${fitted}%`);
  const fixed = ['SOURCE', 'FUNCTION', 's0', 'dobrar'];
  const spots = async () => Promise.all(fixed.map((word) => box('main svg text', word)));
  await actual();
  assert.equal(await level.innerText(), '100%');
  const normal = await box('main svg text', 'SOURCE');
  await click('Zoom in');
  assert.equal(await level.innerText(), '115%');
  assert.ok(Math.abs((await box('main svg text', 'SOURCE')).width - normal.width * 1.15) < 1, 'o cabeçalho amplia junto');
  await click('Zoom out'); await click('Zoom out');
  assert.equal(await level.innerText(), '87%');
  await actual();
  const area = await page.locator('main > div').boundingBox();
  await page.mouse.move(area.x + 700, area.y + 200);
  await page.mouse.wheel(0, -500); await frame();
  assert.equal(await level.innerText(), '250%');
  await actual();
  // clicar e puxar: tudo vem junto, inclusive a tabela e o cabeçalho, para qualquer lado e começando em qualquer lugar
  for (const [from, by] of [[[700, 300], [-100, -40]], [[700, 300], [260, 180]], [[90, 40], [50, 30]]]) {
    await actual();
    const before = await spots();
    await page.mouse.move(area.x + from[0], area.y + from[1]); await page.mouse.down();
    await page.mouse.move(area.x + from[0] + by[0], area.y + from[1] + by[1], { steps: 4 }); await page.mouse.up(); await frame();
    (await spots()).forEach((after, i) => assert.ok(Math.abs(after.x - before[i].x - by[0]) < 1.5 && Math.abs(after.y - before[i].y - by[1]) < 1.5, `${fixed[i]} não acompanhou o arrasto: ${JSON.stringify({ before: before[i], after, by })}`));
  }
  await actual();
  const bar = await box('main svg text.on-fn', 'ler');
  await page.mouse.move(bar.x + 5, bar.y + 3); await page.mouse.down();
  await page.mouse.move(bar.x - 55, bar.y + 3, { steps: 3 }); await page.mouse.up(); await frame();
  assert.ok(Math.abs((await box('main svg text.on-fn', 'ler')).x - bar.x + 60) < 1.5, 'arrastar sobre uma barra também move');
  assert.equal(await page.locator('main svg rect.sel').count(), 0, 'arrastar não seleciona');
  await page.screenshot({ path: `${shots}zoom.png` });
  await click('Fit to screen');
  assert.equal(await percent(), fitted);
  await page.keyboard.press('+'); await frame();
  assert.ok((await percent()) > fitted);
  await page.keyboard.press('0'); await frame();
  assert.equal(await percent(), fitted);
  await page.locator('main > div').focus();
  await page.keyboard.press('-'); await frame();
  assert.ok((await percent()) < fitted);
  step('zoom e arrasto como no editor FOP: nada fica fixo');

  // ----- minimizar -----
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${base}?ex=pipeline`);
  const names = () => page.evaluate(() => window.view.visible.rows.map((i) => window.view.layout.rows[i].name));
  const left = () => page.locator('main > div > svg > g title').allTextContents();
  await actual();
  const total = (await names()).length;
  const pills = () => page.locator('main svg text.step').allTextContents();
  const stepsBefore = await pills();
  const where = () => page.getByRole('button', { name: /(Collapse|Expand) if \(tudo passou\)/ }).boundingBox();
  const spot = await where();
  await page.getByRole('button', { name: 'Collapse if (tudo passou)' }).click();
  assert.ok(!(await names()).includes('compilar') && (await names()).includes('else'));
  assert.ok(!(await left()).includes('compilar'));
  assert.equal((await where()).y, spot.y, 'a linha clicada não pode sair do lugar');
  assert.deepEqual(await pills(), stepsBefore, 'os passos não mudam');
  await page.screenshot({ path: `${shots}minimizado.png` });
  await page.getByRole('button', { name: 'Expand if (tudo passou)' }).focus();
  await page.keyboard.press('Enter');
  assert.equal((await names()).length, total);
  await page.keyboard.press('Enter');
  assert.ok((await names()).length < total, 'o foco continua na seta depois de redesenhar');
  await page.getByRole('button', { name: 'Expand all', exact: true }).click();
  assert.equal((await names()).length, total);
  assert.ok(await page.getByRole('button', { name: 'Expand all', exact: true }).isDisabled());
  await page.getByRole('button', { name: 'Collapse all', exact: true }).click();
  assert.deepEqual(await names(), ['publicar', 'baixarCodigo', 'instalar', 'lint', 'conferirTipos', 'testar', 'if (tudo passou)', 'else']);
  assert.ok(await page.getByRole('button', { name: 'Collapse all', exact: true }).isDisabled());
  await page.screenshot({ path: `${shots}tudo-minimizado.png` });
  await page.getByRole('button', { name: 'Expand if (tudo passou)' }).click();
  assert.ok((await names()).includes('switch (ambiente)') && !(await names()).includes('aprovarDeploy'), 'o nível de baixo continua minimizado');
  await page.evaluate(() => window.view.update(window.view.layout.rows[0].node));
  assert.ok(!(await names()).includes('aprovarDeploy'), 'trocar a árvore mantém o que estava minimizado');
  step('minimizar um a um (clique e teclado), minimizar tudo e expandir tudo');
  await page.setViewportSize({ width: 1100, height: 640 });

  // ----- a página: Explorer, barra de ferramentas e tema -----
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${base}?ex=checkout`);
  await frame();
  assert.deepEqual(await page.locator('.ex-sec span:nth-child(2)').allTextContents(), ['Real cases', 'Concepts', 'Stress test']);
  assert.equal(await page.locator('.ex-fn').count(), 14);
  await page.locator('.ex-fn', { hasText: 'cobrarCartao' }).click(); await frame();
  assert.equal(await page.locator('.ex-fn.sel').innerText(), 'cobrarCartao');
  assert.equal(await page.locator('main svg rect.sel-mark').count(), 1);
  await page.locator('.ex-file[aria-current]').click();
  assert.equal(await page.locator('.ex-fn').count(), 0);
  await page.locator('.ex-file[aria-current]').click();
  const columns = async () => page.locator('main svg text.step').first().evaluate(() => {
    const x = [...document.querySelectorAll('main svg text.step')].map((t) => Number(t.getAttribute('x')));
    return x[1] - x[0];
  });
  const inside = await columns();
  await click('Name inside the bar');
  assert.ok((await columns()) < inside, 'com o nome fora, o passo encolhe');
  assert.equal(await page.locator('main svg rect[rx="11"][width="22"]').count() > 0, true);
  const stateTexts = () => page.locator('main svg g.bold text, main svg g.dim text').count();
  const all = await stateTexts();
  await click('Show all available data in the states');
  assert.ok((await stateTexts()) < all);
  await page.reload(); await frame();
  assert.equal(await page.locator('#names').getAttribute('aria-pressed'), 'false', 'a preferência continua depois de recarregar');
  await click('Reset the view');
  assert.equal(await page.locator('#names').getAttribute('aria-pressed'), 'true');
  await page.keyboard.press('Control+b');
  assert.ok(!(await page.locator('.explorer').isVisible()));
  await click('Explorer');
  assert.ok(await page.locator('.explorer').isVisible());
  await page.locator('#exSplitter').focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(Math.round((await page.locator('.explorer').boundingBox()).width), 256);
  await click('Reset the view');
  await click('Light theme');
  assert.match(page.url(), /tema=claro/);
  assert.equal(await page.locator('main svg .bg').first().evaluate((el) => getComputedStyle(el).fill), 'rgb(255, 255, 255)');
  await page.screenshot({ path: `${shots}pagina-clara.png` });
  await click('Dark theme');
  await page.screenshot({ path: `${shots}pagina.png` });
  step('Explorer, nome na barra, estados, preferências, divisória e tema');
  {
  // ----- edição por cima do desenho -----
  await page.goto(`${base}?ex=checkout`);
  await frame();
  const wait = () => page.waitForTimeout(200);
  const drawn = () => page.locator('main svg text').allTextContents();
  const rowNames = () => page.evaluate(() => window.view.layout.rows.map((r) => r.name));
  const node = (name) => page.evaluate((name) => JSON.stringify(window.view.layout.rows.find((r) => r.name === name)?.node), name).then((j) => j && JSON.parse(j));
  const menu = page.locator('.bar-tools');
  const choose = async (title) => { await menu.getByRole('button', { name: title, exact: true }).click(); await frame(); };
  const cell = (name) => page.locator('main svg [data-t=name] text.name', { hasText: new RegExp(`^${name}$`) });
  const barOf = (name) => page.locator('main svg [data-t=name] text.on-fn', { hasText: new RegExp(`^${name}$`) });
  const overRow = async (name) => {
    await page.mouse.move(5, 5); await wait();
    const box = await cell(name).boundingBox();
    await page.mouse.move(box.x + 3, box.y + box.height / 2); await wait();
  };
  const save = async () => { await page.locator('.dlg button[type=submit]').click(); await frame(); };
  await page.evaluate(() => { window.view.zoomTo(0.8); window.view.panTo(0, 0); }); await frame();
  const total = (await rowNames()).length;

  await overRow('calcularFrete');
  assert.ok(await menu.isVisible(), 'o menu aparece ao passar o mouse na linha');
  await choose('Add child (inside this function)');
  assert.ok((await rowNames()).includes('newFunction'));
  await click('Undo');
  assert.equal((await rowNames()).length, total);
  await click('Redo');
  assert.equal((await rowNames()).length, total + 1);
  await page.keyboard.press('Control+z'); await frame();
  assert.equal((await rowNames()).length, total);
  await page.mouse.move(5, 5); await page.waitForTimeout(400);
  assert.equal(await menu.count(), 0, 'o menu some quando o ponteiro sai');
  step('menu na linha: adicionar, desfazer e refazer');

  await page.evaluate(() => window.view.panTo(0, 0)); await frame();
  await barOf('receberCarrinho').hover(); await wait();
  assert.ok(await menu.getByRole('button', { name: 'Remove', exact: true }).isVisible(), 'o menu aparece sobre a barra');
  await choose('Remove');
  assert.ok(!(await rowNames()).includes('receberCarrinho'));
  await click('Undo');
  step('menu sobre a barra: remover');

  // clicar no dado abre a caixa; trocar o valor muda o estado
  await page.evaluate(() => window.view.reveal(window.view.layout.rows.findIndex((r) => r.name === 'calcularFrete'))); await frame();
  const dataOf = (name, side) => page.evaluate(([name, side]) => window.view.layout.rows.findIndex((r) => r.name === name), [name, side]).then((i) => page.locator(`main svg [data-t=data][data-row="${i}"][data-side=${side}]`));
  await (await dataOf('calcularFrete', 'out')).click();
  assert.equal(await page.locator('.dlg label').innerText(), 'Output data of calcularFrete');
  await page.getByLabel('Value', { exact: true }).fill('abc'); await save();
  assert.match(await page.locator('.dlg .error').innerText(), /not a number/);
  await page.getByLabel('Value', { exact: true }).fill('30'); await save();
  assert.equal(await page.locator('.dlg').count(), 0);
  assert.ok((await drawn()).includes('frete = 30'));
  step('clicar no dado altera o valor, e o inválido é explicado');

  // trocar o nome onde o dado nasce troca todos os usos
  await (await dataOf('calcularFrete', 'out')).click();
  await page.getByLabel('Data name', { exact: true }).fill('entrega'); await save();
  assert.deepEqual((await node('montarPedido')).in[0].fields.map((f) => f.name ?? f), ['reserva', 'entrega', 'impostos', 'desconto']);
  // pelo estado, abre a origem
  await page.locator('main svg g[data-t=state][data-name=entrega]').first().click();
  assert.equal(await page.locator('.dlg label').innerText(), 'Output data of calcularFrete');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.dlg').count(), 0);
  await page.locator('main svg g[data-t=state][data-name=entrega]').first().hover(); await wait();
  assert.ok(await menu.getByRole('button', { name: 'Edit the data' }).isVisible());
  step('renomear o dado na origem leva os usos; o estado abre e edita');

  // objeto: campos com filhos
  await (await dataOf('calcularFrete', 'in')).click();
  await page.locator('.dlg [data-k=type]').first().selectOption('object');
  await page.locator('.dlg .argkids .addkid').click();
  await page.locator('.dlg .argkids [data-k=type]').selectOption('text');
  await page.locator('.dlg .argkids [data-k=value]').fill('Ana');
  await save();
  assert.equal((await node('calcularFrete')).in[0].fields.length, 1);
  await click('Undo');
  step('objeto: adiciona campo com tipo e valor');

  // nome no lugar
  await page.evaluate(() => { window.view.zoomTo(1); window.view.panTo(0, 0); }); await frame();
  await cell('reservarEstoque').click();
  await page.locator('.inline-edit').fill('segurarEstoque'); await page.keyboard.press('Enter'); await frame();
  assert.ok((await rowNames()).includes('segurarEstoque'));
  step('clicar no nome renomeia no lugar');

  // condição do bloco, responsável e entrada nova
  await page.locator('main svg [data-t=name] text.block', { hasText: 'if (pagamento.aprovado)' }).click();
  await page.getByLabel('Condition', { exact: true }).fill('pagamento.ok'); await save();
  assert.ok((await rowNames()).includes('if (pagamento.ok)'));
  await page.locator('main svg [data-t=source]').nth(1).click();
  await page.getByLabel('Kind', { exact: true }).selectOption('person'); await page.getByLabel('Name', { exact: true }).fill('Ana'); await save();
  assert.ok((await drawn()).includes('Ana'));
  await page.evaluate(() => { window.view.zoomTo(0.8); window.view.panTo(0, 0); }); await frame();
  const first = await page.evaluate(() => window.view.layout.rows.findIndex((r) => r.name === 'receberCarrinho'));
  const ghost = page.locator(`main svg [data-t=add][data-row="${first}"][data-side=in]`);
  await ghost.click({ force: true });
  await page.getByLabel('Data name', { exact: true }).fill('sessao'); await save();
  assert.equal((await node('Ana') ?? await node('receberCarrinho')).in[0], 'sessao');
  step('condição do bloco, responsável e entrada pelo “+”');

  // alça: arrastar a ponta do try puxa as irmãs para dentro (e o catch continua depois)
  await page.goto(`${base}?ex=estado`);
  await click('Reset the view').catch(() => {});
  await page.evaluate(() => {
    const id = window.editor.state.tree.children[0].id;
    window.editor.load({ ...window.editor.state.tree, children: window.editor.state.tree.children.map((c, i) => (i ? c : { id: 'bloco', type: 'try', children: [c] })) });
  });
  await frame(); await page.evaluate(() => { window.view.zoomTo(1); window.view.panTo(0, 0); }); await frame();
  const grip = await page.locator('main svg [data-t=resize] rect.grip').boundingBox();
  const stepWidth = await page.locator('main svg text.step').first().evaluate(() => { const x = [...document.querySelectorAll('main svg text.step')].map((t) => t.getBoundingClientRect().x); return x[1] - x[0]; });
  const inside = () => page.evaluate(() => window.editor.state.tree.children[0].children.map((c) => c.name));
  await page.mouse.move(grip.x + 2, grip.y + 8); await page.mouse.down();
  await page.mouse.move(grip.x + 2 + stepWidth * 2, grip.y + 8, { steps: 6 }); await page.mouse.up(); await frame();
  assert.deepEqual(await inside(), ['receber', 'cobrar', 'enviar']);
  const again = await page.locator('main svg [data-t=resize] rect.grip').boundingBox();
  await page.mouse.move(again.x + 2, again.y + 8); await page.mouse.down();
  await page.mouse.move(again.x + 2 - stepWidth * 2, again.y + 8, { steps: 6 }); await page.mouse.up(); await frame();
  assert.deepEqual(await inside(), ['receber']);
  step('arrastar a alça aumenta e diminui o bloco');

  // as mudanças ficam; restaurar pergunta antes
  await page.reload(); await frame();
  assert.equal((await rowNames()).includes('try'), true, 'a mudança continua depois de recarregar');
  page.once('dialog', (d) => d.dismiss());
  await click('Reset the view');
  assert.equal((await rowNames()).includes('try'), true);
  page.once('dialog', (d) => d.accept());
  await click('Reset the view');
  assert.equal((await rowNames()).includes('try'), false);
  await page.reload(); await frame();
  assert.equal((await rowNames()).includes('try'), false);
  step('mudanças salvas no navegador; restaurar o exemplo pede confirmação');

  // minimizar esconde os estados de dentro
  await page.goto(`${base}?ex=campanha`); await frame();
  await page.evaluate(() => { window.view.zoomTo(0.8); window.view.panTo(0, 0); }); await frame();
  assert.ok((await drawn()).includes('mensagemRastreada'));
  const steps = await page.locator('main svg text.step').allTextContents();
  await page.getByRole('button', { name: 'Collapse for (destinatario of destinatarios)' }).click(); await frame();
  assert.ok(!(await drawn()).includes('mensagemRastreada'));
  assert.deepEqual(await page.locator('main svg text.step').allTextContents(), steps);
  step('minimizar uma barra esconde os estados de dentro dela');
  }

  await page.setViewportSize({ width: 600, height: 800 });
  await frame();
  assert.ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= 600, 'sem rolagem lateral em tela estreita');
  await page.screenshot({ path: `${shots}estreita.png` });
  step('tela estreita empilha Explorer e fluxo');
  await page.setViewportSize({ width: 1100, height: 640 });

  await page.goto(`${base}?ex=grande&n=20000`);
  await page.locator('main svg text').first().waitFor();
  const mounted = await page.evaluate(() => window.mountedIn);
  const nodes = () => page.locator('main > div > svg *').count();
  assert.ok(mounted < 1500, `montagem lenta: ${mounted} ms`);
  assert.ok((await nodes()) < 2500);
  await actual();
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
        window.view.panTo((row.start * 162 * i) / 30, (row.index * 34 * i) / 30);
        const began = performance.now();
        await next();
        times.push(performance.now() - began);
        most = Math.max(most, svg.querySelectorAll('*').length);
      }
      times.sort((a, b) => a - b);
      return { median: times[15], worst: times.at(-1), most };
    };
    const far = await measure(0.2);
    const mid = await measure(0.4);
    const near = await measure(1);
    window.view.panTo(0, row.index * 34 - 100);
    await next();
    return { name: row.name, found: [...svg.querySelectorAll('text')].some((t) => t.textContent === row.name), far, mid, near };
  });
  assert.ok(result.found, `a linha ${result.name} deveria estar à vista`);
  for (const [name, r] of Object.entries({ '20%': result.far, '40%': result.mid, '100%': result.near })) {
    assert.ok(r.most < 4000, `${name}: elementos demais: ${r.most}`);
    assert.ok(r.median < 50, `${name}: lento: ${r.median} ms por dois quadros`);
    console.log(`  20 mil funções a ${name}: ${r.median.toFixed(1)} ms (mediana de 2 quadros), pior ${r.worst.toFixed(1)} ms · até ${r.most} elementos`);
  }
  assert.ok(head);
  await page.screenshot({ path: `${shots}grande.png` });
  await click('Fit to screen');
  assert.equal(await level.innerText(), '20%');
  assert.ok(await page.getByRole('button', { name: 'Zoom out', exact: true }).isDisabled());
  await page.screenshot({ path: `${shots}grande-longe.png` });
  console.log(`  montagem ${Math.round(mounted)} ms`);
  const times = await page.evaluate(() => {
    const t = (fn) => { const a = performance.now(); fn(); return performance.now() - a; };
    return { close: t(() => window.view.collapseAll()), rows: window.view.visible.rows.length, open: t(() => window.view.expandAll()) };
  });
  assert.ok(times.close < 500 && times.open < 500 && times.rows < 3000, JSON.stringify(times));
  console.log(`  minimizar tudo ${times.close.toFixed(0)} ms · expandir tudo ${times.open.toFixed(0)} ms`);
  step('fluxo grande: navega em qualquer zoom com o DOM pequeno');

  await page.setViewportSize({ width: 600, height: 400 });
  await page.waitForFunction(() => Number(document.querySelector('main > div > svg').getAttribute('width')) <= 600);
  await page.evaluate(() => window.view.update({ name: 'outro', children: [{ name: 'novo' }] }));
  const zoom = await page.evaluate(() => window.view.camera.zoom);
  assert.ok(zoom >= 0.55 && zoom <= 1, `trocar a árvore reajusta à tela, sem ficar ilegível: ${zoom}`);
  await actual();
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

// No Chrome instalado: monta um fluxo do zero pelos botões, como uma pessoa faria, e abre todos os exemplos.
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { serve } from '../scripts/serve.mjs';

const server = await serve(5296);
const url = 'http://127.0.0.1:5296/app/';
const shots = new URL('../test-results/', import.meta.url).pathname;
mkdirSync(shots, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const step = (s) => console.log('✓', s);

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url);
  await page.locator('.canvas svg text').first().waitFor();

  const drawn = () => page.locator('.canvas svg text').allTextContents();
  const code = () => page.locator('pre').textContent();
  const has = async (...words) => {
    await page.waitForTimeout(60);
    const found = await drawn();
    for (const w of words) assert.ok(found.includes(w), `falta "${w}" no desenho: ${found}`);
  };
  const field = (key) => page.locator(`[data-key="${key}"]`);
  const fill = async (key, value) => {
    await field(key).fill(value);
    await field(key).press('Enter');
  };
  const where = (label) => page.locator('.segmented button', { hasText: label }).click();
  const insert = (kind) => page.locator(`button[data-act=insert][data-kind="${kind}"]`).click();
  const act = (name) => page.locator(`aside button[data-act="${name}"]`).first().click();
  /** clica na linha do desenho que tem este rótulo, na coluna das funções */
  const pick = async (label) => {
    const box = await page.locator('.canvas svg g > title', { hasText: label }).last().evaluate((t) => {
      const r = t.parentElement.querySelector('text, :scope > rect').getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    await page.mouse.click(box.x, box.y);
  };
  const crumb = () => page.locator('.crumbs button[aria-current]').textContent();

  await page.locator('[data-top=new]').click();
  assert.equal(await crumb(), 'main');
  await insert('fn');
  await fill('prop:name', 'receber');
  await has('receber');
  step('cria função e renomeia');

  await page.locator('[data-section=out] button', { hasText: '+ saída' }).click();
  await fill('out:0:name', 'pedido');
  await field('out:0:type').selectOption('number');
  await fill('out:0:value', '42');
  await has('pedido = 42');
  step('adiciona saída com tipo e valor');

  await insert('fn');
  await fill('prop:name', 'cobrar');
  await page.locator('[data-section=in] button', { hasText: '+ entrada' }).click();
  await fill('in:0:name', 'pedido');
  await page.locator('[data-section=in] button', { hasText: '+ entrada' }).click();
  await fill('in:1:name', 'cliente');
  await field('in:1:type').selectOption('object');
  await page.locator('[data-section=in] button', { hasText: '+ campo' }).click();
  await fill('in:1.0:name', 'nome');
  await fill('in:1.0:value', 'Ana');
  await has('input_cobrar', 'cliente', 'nome = "Ana"');
  step('adiciona entradas, com objeto e campo');

  // digitar e clicar em outro botão, sem confirmar: o valor vale e o clique também
  await field('prop:name').fill('cobrarPix');
  await insert('ifelse');
  await has('cobrarPix', 'if (condicao)', 'else', 'otherwise');
  step('clicar num botão confirma o campo e executa o clique');

  await act('declare');
  await has('condicao = true');
  await where('Dentro');
  await insert('fn');
  await fill('prop:name', 'enviar');
  await has('enviar');
  step('seleção: if/else, condição declarada e função dentro');

  await pick('if (condicao)');
  assert.equal(await crumb(), 'if (condicao)');
  await act('elseIf');
  await has('if (outraCondicao)');
  step('clique no desenho seleciona; else if');

  await pick('receber');
  await page.locator('.crumbs button', { hasText: 'main' }).click();
  await where('Dentro');
  await insert('switch');
  await fill('prop:expr', 'meio');
  await act('declare');
  await act('case');
  await where('Dentro');
  await insert('fn');
  await has('switch (meio)', 'case a', 'case b', 'case valor');
  step('switch com cases');

  for (const kind of ['for', 'while', 'do-while', 'try']) {
    await page.locator('.crumbs button', { hasText: 'main' }).click();
    await insert(kind);
    await where('Dentro');
    await insert('fn');
  }
  await has('for (item of itens)', 'while (pendente)', 'do-while (pendente)', 'try', 'catch');
  step('for, while, do-while e try/catch');

  await page.locator('.crumbs button', { hasText: 'main' }).click();
  await where('Dentro');
  await insert('fn');
  await fill('prop:name', 'aprovar');
  await field('prop:source').selectOption('person');
  await fill('prop:sourceName', 'Ana');
  await insert('fn');
  await where('Paralelo');
  await insert('fn');
  await fill('prop:name', 'avisar');
  await field('prop:source').selectOption('abstract');
  assert.ok(await field('prop:parallel').isChecked());
  await has('Ana', 'abstract', 'avisar');
  assert.match(await code(), /await Ana\.aprovar\(\)/);
  assert.match(await code(), /Promise\.all/);
  step('responsáveis, função abstrata e paralela; código acompanha');
  await page.screenshot({ path: `${shots}montado.png` });

  await act('remove');
  assert.ok(!(await drawn()).includes('avisar'));
  await page.locator('[data-top=undo]').click();
  await has('avisar');
  await page.locator('.canvas > div').focus();
  await page.keyboard.press('Delete');
  assert.ok(!(await drawn()).includes('avisar'));
  await page.keyboard.press('Meta+z');
  await has('avisar');
  step('remover, desfazer e atalhos');

  // o desenho só tem o que está à vista: volta ao topo antes de clicar
  await page.locator('.crumbs button', { hasText: 'main' }).click();
  await pick('receber');
  await page.locator('select[data-wrap]').selectOption('try');
  await has('receber');
  assert.equal(await crumb(), 'try');
  await act('unwrap');
  step('envolver e desfazer bloco');

  const before = await code();
  await page.reload();
  await page.locator('.canvas svg text').first().waitFor();
  assert.equal((await code()).replace(/\s/g, ''), before.replace(/\s/g, ''));
  step('o fluxo continua depois de recarregar');

  await page.locator('[data-tab=json]').click();
  await page.locator('textarea').fill('{"name":"main","children":[{"name":"viaJson"}]}');
  await page.locator('[data-top=apply]').click();
  await has('viaJson');
  await page.locator('textarea').fill('{"name":"m","children":[{"type":"else"}]}');
  await page.locator('[data-top=apply]').click();
  assert.match(await page.locator('.toast').textContent(), /else/);
  await page.locator('[data-tab=code]').click();
  step('JSON: aplica o válido e explica o inválido');

  const keys = await page.locator('[data-examples] option').evaluateAll((o) => o.map((x) => x.value).filter(Boolean));
  assert.ok(keys.length >= 45);
  for (const key of keys) {
    await page.locator('[data-examples]').selectOption(key);
    await page.locator('.canvas svg text').first().waitFor();
    assert.ok((await code()).includes('function'), key);
    if (['todosDados', 'seAninhado', 'abstrata'].includes(key)) {
      await page.waitForTimeout(80);
      await page.screenshot({ path: `${shots}${key}.png` });
    }
  }
  step(`os ${keys.length} exemplos abrem`);

  // visibilidade, padrões e arquivo como objeto, pelo painel
  await page.locator('[data-top=new]').click();
  await insert('fn');
  await fill('prop:name', 'carregar');
  await field('prop:visibility').selectOption('public');
  await field('prop:pattern').selectOption('singleton');
  assert.match(await page.locator('aside .note.warning').textContent(), /adicione a saída/);
  await page.locator('[data-section=out] button', { hasText: '+ saída' }).click();
  await fill('out:0:name', 'config');
  assert.equal(await page.locator('aside .note').count(), 0);
  await insert('fn');
  await fill('prop:name', 'criar');
  await field('prop:visibility').selectOption('private');
  await field('prop:pattern').selectOption('factory');
  await page.locator('[data-section=out] button', { hasText: '+ saída' }).click();
  await fill('out:0:name', 'cliente');
  await field('out:0:type').selectOption('object');
  await field('prop:source').selectOption('file');
  await fill('prop:sourceName', 'clientes');
  await field('prop:asObject').check();
  await has('singleton', 'factory', 'clientes');
  const svg = page.locator('.canvas svg');
  assert.equal(await svg.locator('[data-visibility=public]').count(), 1);
  assert.equal(await svg.locator('[data-visibility=private]').count(), 1);
  assert.ok((await svg.locator('.file-object').count()) >= 1);
  assert.ok((await svg.locator('.double').count()) >= 1);
  assert.ok((await svg.locator('.shared').count()) >= 1);
  await page.waitForTimeout(80);
  await page.screenshot({ path: `${shots}formas.png` });
  step('público, privado, singleton, factory e arquivo como objeto no desenho');

  await page.locator('.crumbs button', { hasText: 'main' }).click();
  await where('Dentro');
  await insert('if');
  await fill('prop:expr', 'config &&');
  assert.match(await page.locator('aside .note.error').textContent(), /incompleta/);
  await fill('prop:expr', 'sumiu');
  assert.match(await page.locator('aside .warn').textContent(), /sumiu/);
  assert.equal(await page.locator('aside .note').count(), 0);
  await page.locator('.crumbs button', { hasText: 'main' }).click();
  assert.equal(await page.locator('[data-tab=problems]').textContent(), 'Problemas (1)');
  await page.locator('[data-tab=problems]').click();
  await page.screenshot({ path: `${shots}problemas.png` });
  await page.locator('.problem', { hasText: 'sumiu' }).click();
  assert.equal(await crumb(), 'if (sumiu)');
  await act('declare');
  assert.equal(await page.locator('[data-tab=problems]').textContent(), 'Problemas');
  step('condições conferidas, no painel e na lista de problemas');

  await page.locator('[data-tab=code]').click();
  const language = page.locator('[data-language]');
  await language.selectOption('py');
  assert.match(await code(), /async def main\(\):/);
  await language.selectOption('ts');
  assert.match(await code(), /const sumiu: boolean = true;/);
  await page.reload();
  await page.locator('.canvas svg text').first().waitFor();
  assert.equal(await language.inputValue(), 'ts');
  await language.selectOption('py');
  await page.screenshot({ path: `${shots}python.png` });
  await language.selectOption('js');
  step('código em JavaScript, TypeScript e Python');

  for (const key of ['fileObjeto', 'padFactory', 'padSingleton', 'privada']) {
    await page.locator('[data-examples]').selectOption(key);
    await page.waitForTimeout(100);
    await page.screenshot({ path: `${shots}${key}.png` });
  }

  await page.locator('[data-top=theme]').click();
  assert.equal(await page.locator('.canvas svg .bg').first().evaluate((el) => getComputedStyle(el).fill), 'rgb(255, 255, 255)');
  await page.locator('[data-examples]').selectOption('sequencial');
  await pick('somar');
  await page.waitForTimeout(80);
  assert.equal(await page.locator('.toast').textContent(), '');
  await page.screenshot({ path: `${shots}claro.png` });
  step('tema claro');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  await page.locator('.crumbs button', { hasText: 'main' }).click();
  await page.locator('[data-top=undo]').click();
  await page.locator('[data-top=redo]').click();
  await pick('somar');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'rolagem horizontal no celular');
  await page.screenshot({ path: `${shots}celular.png`, fullPage: true });
  step('tela de celular sem rolagem lateral');

  assert.deepEqual(errors, []);
  step('sem erros no console');
} finally {
  await browser.close();
  server.close();
}

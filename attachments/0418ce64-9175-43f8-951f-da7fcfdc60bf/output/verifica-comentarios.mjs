import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import path from 'node:path';
const require = createRequire('/Users/laerciogermano/Documents/works/plans/app/package.json');
const { chromium } = require('playwright-core');
const out = process.argv[2];
const URL_ = 'http://localhost:5280/?demo=comentarios';
const step = (s) => console.log('OK', s);
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const tree = (rel = '') => page.evaluate(async (rel) => {
    let dir = await (await navigator.storage.getDirectory()).getDirectoryHandle('demo-comentarios');
    for (const p of rel.split('/').filter(Boolean)) { try { dir = await dir.getDirectoryHandle(p); } catch { return []; } }
    const all = [];
    const walk = async (d, prefix) => { for await (const [n, h] of d.entries()) { if (h.kind === 'file') all.push({ path: prefix + n, text: await (await h.getFile()).text() }); else await walk(h, prefix + n + '/'); } };
    await walk(dir, '');
    return all.sort((a, b) => a.path.localeCompare(b.path));
  }, rel);

  await page.goto(URL_);
  await page.getByRole('button', { name: 'Criar projeto aqui' }).click();
  await page.getByRole('button', { name: 'Nova atividade', exact: true }).click();
  await page.getByLabel('Título da atividade').fill('Revisar proposta');
  await page.keyboard.press('Enter');
  const node = page.getByRole('treeitem', { name: 'Revisar proposta', exact: true });
  await node.click();
  const card = page.getByRole('region', { name: 'Atividade selecionada' });
  await card.waitFor();
  const saida = page.getByRole('region', { name: 'Output', exact: true });
  const campo = saida.getByLabel('Novo comentário');
  const botao = saida.getByRole('button', { name: 'Comentar' });
  const lista = saida.getByRole('list', { name: 'Comentários' });
  await saida.getByText('Nenhum comentário.').waitFor();
  assert.ok(await botao.isDisabled());
  await campo.fill('   \n  ');
  assert.ok(await botao.isDisabled());
  await campo.press('Meta+Enter');
  const [activity] = await tree('activities');
  const id = activity.path.replace('.md', '');
  assert.equal((await tree(`comments/${id}`)).length, 0);
  step('estado vazio; botão desativado sem texto ou só com espaços; nada gravado');

  await campo.fill('Primeira observação com **negrito**.\n\n- item um\n- item dois');
  await botao.click();
  await lista.locator('strong', { hasText: 'negrito' }).waitFor();
  assert.equal(await lista.getByRole('listitem').filter({ has: page.locator('header') }).count(), 1);
  assert.equal(await campo.inputValue(), '');
  let files = await tree(`comments/${id}`);
  assert.equal(files.length, 1);
  assert.match(files[0].text, /^---\nauthor: eu\ncreatedAt: \d{4}-\d\d-\d\dT[\d:.]+Z\n---\nPrimeira observação/);
  const header = lista.locator('li:has(> header)').first().locator('header');
  assert.equal(await header.locator('b').innerText(), 'Eu');
  assert.match(await header.locator('time').innerText(), /^\d\d\/\d\d\/\d{4},? \d\d:\d\d$|^\d\d\/\d\d\/\d\d,? \d\d:\d\d$/);
  console.log('   data exibida:', await header.locator('time').innerText());
  step('comentar pelo botão: arquivo gravado, autor, data e Markdown na lista, campo limpo');

  await campo.fill('Segunda, pelo teclado');
  await campo.press('Meta+Enter');
  await campo.press('Meta+Enter');
  await lista.getByText('Segunda, pelo teclado').waitFor();
  await campo.fill('Terceira, com Ctrl');
  await campo.press('Control+Enter');
  await lista.getByText('Terceira, com Ctrl').waitFor();
  files = await tree(`comments/${id}`);
  assert.equal(files.length, 3);
  const ordem = await lista.locator('li:has(> header)').allInnerTexts();
  assert.ok(ordem[0].includes('Primeira') && ordem[1].includes('Segunda') && ordem[2].includes('Terceira'));
  step('Cmd+Enter e Ctrl+Enter salvam, sem duplicar; ordem do mais antigo ao mais novo');

  assert.equal((await tree('activities'))[0].text, activity.text);
  step('o arquivo da atividade (descrição) não muda ao comentar');

  await campo.fill('rascunho ainda não enviado');
  await page.keyboard.press('Escape');
  await card.waitFor({ state: 'detached' });
  await node.click();
  assert.equal(await campo.inputValue(), 'rascunho ainda não enviado');
  await campo.fill('');
  step('rascunho continua depois de fechar (Esc) e reabrir');

  await page.reload();
  await node.click();
  await lista.getByText('Terceira, com Ctrl').waitFor();
  assert.equal(await lista.locator('li:has(> header)').count(), 3);
  step('comentários continuam depois de recarregar a página');

  const estilo = await lista.evaluate((ul) => {
    const h = getComputedStyle(ul.querySelector(':scope > li > header'));
    const li = getComputedStyle(ul.querySelector('.md li'));
    const titulo = getComputedStyle(document.querySelector('.node-panel > header'));
    return { cabecalhoComentario: [h.position, h.borderBottomWidth, h.paddingTop], itemMarkdown: [li.display, li.listStyleType, li.paddingTop], cabecalhoCartao: [titulo.position, titulo.borderBottomWidth] };
  });
  console.log('   estilos:', JSON.stringify(estilo));
  // rola até o 2º comentário encostar no topo: o título do cartão tem de continuar por cima
  await page.setViewportSize({ width: 1440, height: 500 });
  await lista.locator(':scope > li > header').first().evaluate((el) => { let s = el.parentElement; while (s && !(s.scrollHeight > s.clientHeight && /auto|scroll/.test(getComputedStyle(s).overflowY))) s = s.parentElement; s.scrollTop += el.getBoundingClientRect().top + 40; });
  await page.screenshot({ path: path.join(out, 'rolagem.png') });
  const noTopo = await page.evaluate(() => document.elementFromPoint(700, 30)?.closest('header')?.textContent ?? '');
  console.log('   no topo da tela depois de rolar:', JSON.stringify(noTopo));
  await page.setViewportSize({ width: 1440, height: 1100 });
  assert.deepEqual(estilo.cabecalhoComentario, ['static', '0px', '0px']);
  assert.deepEqual(estilo.itemMarkdown.slice(0, 2), ['list-item', 'disc']);
  assert.equal(estilo.cabecalhoCartao[0], 'sticky');
  assert.ok(noTopo.includes('Revisar proposta') && noTopo.includes('Fechar'), 'o título do cartão fica no topo');
  step('cabeçalho do comentário não cobre o do cartão; listas Markdown com marcador');
  await page.evaluate(async (id) => {
    let dir = await (await navigator.storage.getDirectory()).getDirectoryHandle('demo-comentarios');
    for (const p of ['comments', id]) dir = await dir.getDirectoryHandle(p);
    const w = await (await dir.getFileHandle('agente.md', { create: true })).createWritable(); await w.write('---\nauthor: claude\ncreatedAt: 2030-01-01T10:00:00Z\n---\nResposta do agente https://exemplo.invalid/' + 'x'.repeat(200) + '\n'); await w.close();
    window.dispatchEvent(new Event('focus'));
  }, id);
  await lista.getByText('Resposta do agente').waitFor();
  assert.match(await lista.locator(':scope > li > header').last().innerText(), /Claude/);
  step('resposta gravada por fora (agente) aparece sozinha, com autor');
  await saida.screenshot({ path: path.join(out, 'comentarios-output.png') });
  await page.screenshot({ path: path.join(out, 'comentarios-cartao.png') });

  await lista.locator('li:has(> header)').nth(1).getByRole('button', { name: 'Remover comentário de Eu' }).click();
  await lista.getByText('Segunda, pelo teclado').waitFor({ state: 'detached' });
  assert.equal((await tree(`comments/${id}`)).length, 3);
  const lixo = await tree('.plans/trash');
  assert.equal(lixo.length, 1);
  assert.match(lixo[0].path, new RegExp(`/comments/${id}/.+\\.md$`));
  assert.match(lixo[0].text, /Segunda, pelo teclado/);
  console.log('   lixeira: .plans/trash/' + lixo[0].path);
  step('remover leva o arquivo para a lixeira');

  await page.setViewportSize({ width: 420, height: 900 });
  await campo.scrollIntoViewIfNeeded();
  const sizes = await saida.evaluate((el) => ({ scroll: el.scrollWidth, client: el.clientWidth }));
  console.log('   largura 420px, Output scroll/client:', sizes.scroll, sizes.client);
  await page.screenshot({ path: path.join(out, 'comentarios-estreito.png') });
  assert.deepEqual(errors, []);
  step('sem erros no console');
} finally {
  await browser.close();
}

// Ponta a ponta no Chrome instalado: hub + front + client de verdade.
// A pasta do front é a de demonstração (OPFS), porque o seletor de pasta não é automatizável.
import { spawn, execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright-core';

const root = path.resolve(import.meta.dirname, '..');
const HUB = 4791, WEB = 5291;
const work = mkdtempSync(path.join(tmpdir(), 'plans-e2e-'));
const project = path.join(work, 'projeto');
const env = { ...process.env, PLANS_CONFIG_DIR: path.join(work, 'config') };
const bin = path.join(root, 'bin/plans-client');
const procs = [];
const logs = {};
function start(name, cmd, args, extra = {}) {
  const p = spawn(cmd, args, { cwd: root, env: { ...env, ...extra }, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
  logs[name] = '';
  p.stdout.on('data', (d) => (logs[name] += d));
  p.stderr.on('data', (d) => (logs[name] += d));
  procs.push(p);
  return p;
}
const stop = (p) => { try { process.kill(-p.pid, 'SIGTERM'); } catch {} };
async function until(fn, what, ms = 15000) {
  const end = Date.now() + ms;
  for (;;) {
    if (await fn().catch(() => false)) return;
    if (Date.now() > end) throw new Error('tempo esgotado: ' + what);
    await new Promise((r) => setTimeout(r, 100));
  }
}
const client = (...args) => execFileSync(bin, args, { env, encoding: 'utf8' });
const step = (s) => console.log('✓', s);

let browser;
try {
  start('hub', 'npx', ['tsx', 'apps/hub/src/server.ts'], { PORT: String(HUB), ALLOWED_ORIGINS: `http://localhost:${WEB}` });
  start('web', 'npx', ['vite', 'apps/web', '--config', 'apps/web/vite.config.ts', '--port', String(WEB)], { VITE_HUB_URL: `ws://localhost:${HUB}/ws` });
  await until(async () => (await fetch(`http://localhost:${WEB}/`)).ok && (await fetch(`http://127.0.0.1:${HUB}/health`)).ok, 'servidores');

  browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  /** lê um arquivo (ou lista uma pasta) da pasta de demonstração */
  const fsRead = (rel) => page.evaluate(async (rel) => {
    let dir = await (await navigator.storage.getDirectory()).getDirectoryHandle('demo-e2e');
    const parts = rel.split('/').filter(Boolean);
    for (const [i, part] of parts.entries()) {
      try { dir = await dir.getDirectoryHandle(part); }
      catch { if (i !== parts.length - 1) return null; try { return await (await (await dir.getFileHandle(part)).getFile()).text(); } catch { return null; } }
    }
    const names = []; for await (const [n] of dir.entries()) names.push(n); return names.sort();
  }, rel);
  const node = (name) => page.getByRole('treeitem', { name, exact: true });
  const fileOf = async (title) => {
    for (const f of await fsRead('activities')) { const text = await fsRead('activities/' + f); if (text.includes(`title: ${title}\n`)) return { f, text }; }
    return null;
  };

  await page.goto(`http://localhost:${WEB}/?demo=e2e`);
  await page.getByRole('button', { name: 'Criar projeto aqui' }).click();
  await page.getByRole('button', { name: 'Nova atividade', exact: true }).waitFor();
  await page.screenshot({ path: path.join(root, 'test-results-vazio.png') });
  await page.getByRole('button', { name: 'Nova atividade', exact: true }).click();
  await page.getByLabel('Título da atividade').fill('Comprar celular');
  await page.keyboard.press('Enter');
  await node('Comprar celular').waitFor();
  assert.equal(await page.getByRole('button', { name: 'Nova atividade', exact: true }).count(), 0);
  await node('Comprar celular').press('Enter');
  await page.getByLabel('Título da atividade').fill('Definir orçamento');
  await page.keyboard.press('Enter');
  await node('Definir orçamento').waitFor();
  await node('Definir orçamento').press('Enter');
  await page.getByLabel('Título da atividade').fill('Pesquisar preços');
  await page.keyboard.press('Enter');
  await node('Pesquisar preços').waitFor();
  assert.equal(await node('Pesquisar preços').getAttribute('aria-level'), '3');
  assert.equal(await page.getByRole('button', { name: 'Trocar pasta' }).evaluate((el) => getComputedStyle(el).position), 'static');
  step('F01 cria nó raiz e filhos, pelo botão e pelo teclado');

  const raiz = page.getByRole('group', { name: 'root', exact: true });
  await raiz.getByRole('button', { name: 'Nova atividade no root' }).click();
  await page.getByLabel('Título da atividade').fill('Outra raiz');
  await page.keyboard.press('Enter');
  await node('Outra raiz').waitFor();
  assert.equal(await node('Outra raiz').getAttribute('aria-level'), '1');
  assert.match((await fileOf('Outra raiz')).text, /^parent: null$/m);
  assert.ok((await raiz.boundingBox()).x < (await node('Outra raiz').boundingBox()).x, 'o root fica antes dos filhos');
  // apaga o arquivo direto, para não deixar nada na lixeira conferida mais adiante
  const { f: outra } = await fileOf('Outra raiz');
  await page.evaluate(async (f) => {
    const dir = await (await (await navigator.storage.getDirectory()).getDirectoryHandle('demo-e2e')).getDirectoryHandle('activities');
    await dir.removeEntry(f);
    window.dispatchEvent(new Event('focus'));
  }, outra);
  await node('Outra raiz').waitFor({ state: 'detached' });
  step('o + do root cria atividades no primeiro nível');

  await node('Definir orçamento').click();
  await page.getByLabel('Responsável').selectOption('claude');
  await page.getByLabel('Descrição', { exact: true }).fill('Até R$ 3.000\nsegunda linha');
  await page.getByLabel('Comando', { exact: true }).focus();
  await page.getByText('Salvo no arquivo').waitFor();
  await until(async () => { const x = await fileOf('Definir orçamento'); return x.text.includes('assignee: claude') && x.text.endsWith('---\nAté R$ 3.000\nsegunda linha\n'); }, 'arquivo com responsável e descrição');
  step('F03 e F04 gravados no .md');

  const marcado = (nome) => page.getByRole('radio', { name: nome, exact: true }).getAttribute('aria-checked');
  assert.equal(await marcado('To do'), 'true', 'sem status no arquivo vale To do');
  await page.getByRole('radio', { name: 'Doing' }).click();
  await until(async () => (await fileOf('Definir orçamento')).text.includes('status: doing'), 'status gravado pelo painel');
  await page.getByRole('button', { name: 'Status de Definir orçamento: Doing' }).click();
  await page.getByRole('button', { name: 'Status de Definir orçamento: Done' }).waitFor();
  await until(async () => (await fileOf('Definir orçamento')).text.includes('status: done'), 'status gravado pelo cartão');
  await until(async () => (await marcado('Done')) === 'true', 'painel acompanha o cartão');
  await page.getByLabel('Descrição', { exact: true }).fill('Até R$ 3.000\nsegunda linha\nterceira');
  await page.getByRole('button', { name: 'Status de Definir orçamento: Done' }).click();
  await until(async () => { const x = (await fileOf('Definir orçamento')).text; return x.includes('status: todo') && x.endsWith('terceira\n'); }, 'mudar o status com texto em edição salva os dois');
  assert.equal(await page.getByText('O arquivo mudou fora desta tela').count(), 0);
  await page.getByLabel('Descrição', { exact: true }).fill('Até R$ 3.000\nsegunda linha');
  await page.getByRole('radio', { name: 'Doing' }).click();
  await until(async () => { const x = (await fileOf('Definir orçamento')).text; return x.includes('status: doing') && x.endsWith('segunda linha\n'); }, 'volta');
  step('status To do, Doing e Done pelo painel e pelo cartão');

  await page.reload();
  await node('Definir orçamento').waitFor();
  const leitura = page.getByRole('document', { name: 'Descrição formatada' });
  await leitura.getByText('segunda linha').waitFor();
  await page.getByRole('radiogroup', { name: 'Modo da descrição' }).getByRole('radio', { name: 'Editar' }).click();
  assert.equal(await page.getByLabel('Descrição', { exact: true }).inputValue(), 'Até R$ 3.000\nsegunda linha');
  assert.equal(await page.getByLabel('Responsável').inputValue(), 'claude');
  assert.equal(await page.getByRole('radio', { name: 'Doing' }).getAttribute('aria-checked'), 'true');
  step('tudo volta dos arquivos depois de recarregar');

  const edited = await fileOf('Pesquisar preços');
  await page.evaluate(async ({ f, text }) => {
    const dir = await (await (await navigator.storage.getDirectory()).getDirectoryHandle('demo-e2e')).getDirectoryHandle('activities');
    const w = await (await dir.getFileHandle(f)).createWritable(); await w.write(text.replace('Pesquisar preços', 'Editado fora')); await w.close();
    window.dispatchEvent(new Event('focus'));
  }, edited);
  await node('Editado fora').waitFor();
  step('edição externa do arquivo aparece na tela');

  const field = page.getByLabel('Renomear atividade');
  const cursor = (locator) => locator.evaluate((el) => getComputedStyle(el).cursor);
  const titulo = node('Definir orçamento').getByText('Definir orçamento');
  assert.equal(await cursor(titulo), 'pointer', 'passar sobre o título não mostra cursor de texto');
  await titulo.click();
  assert.equal(await field.count(), 0, 'um clique só seleciona');
  await titulo.dblclick();
  assert.equal(await cursor(field), 'text');
  await field.press('Escape');
  await node('Definir orçamento').getByText('Definir orçamento').dblclick();
  assert.equal(await field.inputValue(), 'Definir orçamento');
  await field.press('End');
  await field.press('Backspace');
  assert.equal(await page.getByRole('treeitem').count(), 3, 'apagar texto não pode remover o nó');
  await field.fill('Orçamento fechado');
  await field.press('Enter');
  await node('Orçamento fechado').waitFor();
  await until(async () => !!(await fileOf('Orçamento fechado'))?.text.includes('assignee: claude'), 'título novo no mesmo arquivo');
  assert.equal(await page.getByRole('heading', { name: 'Orçamento fechado' }).count(), 1);
  await node('Orçamento fechado').press('F2');
  await field.fill('descartado');
  await field.press('Escape');
  await node('Orçamento fechado').waitFor();
  await node('Orçamento fechado').getByText('Orçamento fechado').dblclick();
  await field.fill('Definir orçamento');
  await page.getByLabel('Comando', { exact: true }).focus();
  await node('Definir orçamento').waitFor();
  await until(async () => !!(await fileOf('Definir orçamento')), 'sair do campo salva');
  step('renomear com dois cliques no título (Enter e sair salvam, Esc cancela, F2)');

  const longo = 'calcular custo de cada agente por máquina e por celular e a capacidade de operações, funis e etc para identificarmos a viabilidade do projeto';
  const inteiro = (nome) => node(nome).evaluate((el) => { const b = el.querySelector('b'), c = el.getBoundingClientRect(), t = b.getBoundingClientRect();
    return b.scrollWidth <= b.clientWidth && t.top >= c.top && el.querySelector('.meta').getBoundingClientRect().bottom <= c.bottom + 0.5; });
  await node('Definir orçamento').press('F2');
  await field.fill(longo);
  await field.press('Enter');
  await node(longo).waitFor();
  const alto = await node(longo).boundingBox();
  assert.ok(alto.height > 100, 'o cartão cresce com o título');
  assert.ok(await inteiro(longo), 'título inteiro dentro do cartão');
  const semSobrepor = await page.getByRole('treeitem').evaluateAll((els) => { const r = els.map((e) => e.getBoundingClientRect());
    return r.every((a, i) => r.every((b, j) => i >= j || a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top)); });
  assert.ok(semSobrepor, 'cartões não se sobrepõem');
  await node(longo).press('F2');
  await field.fill('Definir orçamento');
  await field.press('Enter');
  await node('Definir orçamento').waitFor();
  step('título longo aparece inteiro, o cartão cresce e nada se sobrepõe');

  await node('Definir orçamento').click();
  const parado = await node('Comprar celular').boundingBox();
  await page.getByRole('button', { name: 'Minimizar Comprar celular' }).click();
  await node('Definir orçamento').waitFor({ state: 'detached' });
  assert.equal(await node('Editado fora').count(), 0);
  assert.equal(await node('Comprar celular').getAttribute('aria-expanded'), 'false');
  assert.equal(await node('Comprar celular').getAttribute('aria-selected'), 'true', 'a seleção sobe para o nó minimizado');
  const badges = await page.getByRole('button', { name: 'Expandir Comprar celular (2 ocultas)' }).locator('span').evaluateAll((els) => els.map((el) => [el.className, Number(el.textContent)]));
  assert.ok(badges.every(([status]) => /^status-(todo|doing|done)$/.test(status)), 'um badge por status');
  assert.equal(badges.reduce((total, [, count]) => total + count, 0), 2);
  const depois = await node('Comprar celular').boundingBox();
  assert.ok(Math.abs(depois.y - parado.y) < 2 && Math.abs(depois.x - parado.x) < 2, 'o nó clicado não pode pular');
  await until(async () => JSON.parse(await fsRead('.plans/ui.json')).collapsed.length === 1, 'minimizado gravado em ui.json');
  await page.reload();
  await node('Comprar celular').waitFor();
  assert.equal(await node('Definir orçamento').count(), 0);
  await node('Comprar celular').press('ArrowRight');
  await node('Definir orçamento').waitFor();
  await node('Comprar celular').press('ArrowLeft');
  await node('Definir orçamento').waitFor({ state: 'detached' });
  await node('Comprar celular').press('Enter');
  await node('Definir orçamento').waitFor();
  await page.keyboard.press('Escape');
  step('minimizar e expandir, pelo botão e pelo teclado, lembrado no arquivo');

  await node('Definir orçamento').click();
  await page.getByRole('button', { name: 'Minimizar tudo' }).click();
  await node('Definir orçamento').waitFor({ state: 'detached' });
  assert.equal(await page.getByRole('treeitem').count(), 1);
  assert.equal(await node('Comprar celular').getAttribute('aria-selected'), 'true');
  assert.ok(await page.getByRole('button', { name: 'Minimizar tudo' }).isDisabled());
  await until(async () => JSON.parse(await fsRead('.plans/ui.json')).collapsed.length === 2, 'todos os níveis gravados');
  await node('Comprar celular').press('ArrowRight');
  await node('Definir orçamento').waitFor();
  assert.equal(await node('Editado fora').count(), 0, 'o nível de baixo continua minimizado');
  await page.getByRole('button', { name: 'Expandir tudo' }).click();
  await node('Editado fora').waitFor();
  assert.ok(await page.getByRole('button', { name: 'Expandir tudo' }).isDisabled());
  step('minimizar tudo e expandir tudo');

  // ----- client -----
  await page.getByRole('button', { name: 'Parear client' }).click();
  const command = await page.getByLabel('Comando de pareamento').innerText();
  const code = command.match(/plans1_[\w-]+/)[0];
  assert.ok(command.includes(`--hub ws://localhost:${HUB}/ws`));
  const meta = JSON.parse(await fsRead('.plans/project.json'));
  mkdirSync(path.join(project, '.plans'), { recursive: true });
  writeFileSync(path.join(project, '.plans/project.json'), JSON.stringify(meta));
  client('pair', code, '--dir', project, '--hub', `ws://localhost:${HUB}/ws`);
  let agent = start('client', bin, ['run', '--no-prompt']);
  await page.getByRole('dialog').getByText(/Client conectado · macOS|Client conectado/).waitFor();
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  step('pareamento e conexão cifrada pelo hub');

  const runs = page.getByRole('region', { name: 'Comandos' });
  const run = async (line) => { await page.getByLabel('Comando', { exact: true }).fill(line); await page.getByRole('button', { name: 'Executar' }).click(); };
  await run('echo "olá mundo"');
  await runs.getByText('recusado', { exact: true }).waitFor();
  assert.match(await runs.locator('pre.copy').innerText(), /allow -- echo 'olá mundo'$/);
  step('comando não liberado é recusado, com a linha para liberar');

  client('allow', '--', 'echo', 'olá mundo');
  await run('echo "olá mundo"');
  await runs.getByText('concluído', { exact: true }).waitFor();
  assert.match(await runs.locator('pre.output').first().innerText(), /olá mundo/);
  await until(async () => { const names = await fsRead('runs'); const records = await Promise.all(names.filter((n) => n.endsWith('.json')).map(async (n) => JSON.parse(await fsRead('runs/' + n)))); const ok = records.find((r) => r.status === 'ok'); return ok && ok.code === 0 && (await fsRead(`runs/${ok.runId}.log`)) === 'olá mundo\n'; }, 'registro em runs/');
  step('comando liberado roda e fica registrado em runs/');

  client('allow', '--', 'sleep', '30');
  await run('sleep 30');
  await runs.getByRole('button', { name: 'Cancelar' }).click();
  await runs.getByText('cancelado', { exact: true }).waitFor();
  step('cancelamento');

  const script = 'echo comeco; sleep 3; echo fim';
  client('allow', '--shell', 'sh', '--script', script);
  await page.getByLabel(/usar shell/).check();
  await run(script);
  await runs.getByText('comeco').first().waitFor();
  await page.reload();
  await node('Definir orçamento').waitFor();
  await until(async () => /comeco\s+fim/.test(await runs.locator('pre.output').first().innerText()), 'saída completa depois de recarregar', 20000);
  await runs.getByText('concluído', { exact: true }).first().waitFor();
  step('recarregar a página no meio da execução não perde a saída');

  stop(agent);
  await page.getByRole('button', { name: /Aguardando o client/ }).waitFor();
  agent = start('client', bin, ['run', '--no-prompt']);
  await page.getByRole('button', { name: /Client conectado/ }).waitFor();
  step('client reinicia e a tela reconecta sozinha');

  await node('Comprar celular').click();
  const tool = page.getByRole('button', { name: 'Remover Comprar celular' });
  await page.mouse.move(600, 700);
  assert.equal(await tool.isVisible(), false, 'sem o mouse em cima, o cartão selecionado e focado não mostra + e ×');
  await node('Comprar celular').hover();
  assert.equal(await tool.isVisible(), true);
  await page.mouse.move(600, 700);
  step('+ e × do cartão aparecem só com o mouse em cima');

  await page.screenshot({ path: path.join(root, 'test-results-tela.png') });

  const selected = page.locator('[role="treeitem"][aria-selected="true"]');
  const area = await page.getByRole('region', { name: 'Árvore de execução' }).boundingBox();
  const vazio = [area.x + area.width - 80, area.y + area.height - 160];
  await node('Comprar celular').click();
  await page.mouse.move(...vazio);
  await page.mouse.down();
  await page.mouse.move(vazio[0] - 60, vazio[1] + 20, { steps: 4 });
  await page.mouse.up();
  assert.equal(await selected.count(), 1, 'arrastar o fundo mantém a seleção');
  await page.getByLabel('Descrição', { exact: true }).fill('escrita antes de clicar fora');
  await page.mouse.click(...vazio);
  assert.equal(await selected.count(), 0);
  await page.getByText('Selecione uma atividade').waitFor();
  await until(async () => (await fileOf('Comprar celular')).text.includes('escrita antes de clicar fora'), 'a descrição é salva ao clicar fora');
  await node('Comprar celular').click();
  assert.equal(await selected.count(), 1);
  assert.equal(await page.getByLabel('Descrição', { exact: true }).inputValue(), 'escrita antes de clicar fora');
  await page.getByRole('button', { name: 'Ajustar à tela' }).click();
  await page.getByRole('button', { name: /^Zoom \d+%/ }).click();
  assert.equal(await selected.count(), 1, 'usar os controles não tira a seleção');
  step('clicar fora tira a seleção; arrastar e usar os controles mantêm');

  const level = page.getByRole('button', { name: /^Zoom \d+%/ });
  const box = () => node('Comprar celular').boundingBox();
  await page.getByRole('button', { name: 'Aumentar zoom' }).click();
  assert.equal(await level.innerText(), '125%');
  await page.getByRole('button', { name: 'Diminuir zoom' }).click();
  await page.getByRole('button', { name: 'Diminuir zoom' }).click();
  assert.equal(await level.innerText(), '80%');
  assert.ok(Math.abs((await box()).width - 236 * 0.8) < 2);
  await level.click();
  assert.equal(await level.innerText(), '100%');
  const canvas = await page.getByRole('region', { name: 'Árvore de execução' }).boundingBox();
  const before = await box();
  await page.mouse.move(before.x + 20, before.y + 20);
  await page.mouse.wheel(0, 400);
  await until(async () => (await box()).width < before.width * 0.7, 'zoom pela roda');
  assert.ok(Math.abs((await box()).x + 20 * ((await box()).width / before.width) - (before.x + 20)) < 2, 'o ponto sob o cursor não pode andar');
  const at = await box();
  await page.mouse.move(canvas.x + canvas.width - 60, canvas.y + canvas.height - 120);
  await page.mouse.down();
  await page.mouse.move(canvas.x + canvas.width - 160, canvas.y + canvas.height - 70, { steps: 5 });
  await page.mouse.up();
  const moved = await box();
  assert.ok(Math.abs(moved.x - (at.x - 100)) < 2 && Math.abs(moved.y - (at.y + 50)) < 2, 'arrastar o fundo move a árvore');
  step('zoom pelos botões e pela roda; arrastar o fundo move');

  // árvore grande: ajustar mostra tudo e o teclado leva a tela até o nó
  await page.evaluate(async () => {
    const dir = await (await (await navigator.storage.getDirectory()).getDirectoryHandle('demo-e2e')).getDirectoryHandle('activities');
    for (let i = 0; i < 80; i++) {
      const id = `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`;
      const w = await (await dir.getFileHandle(`${id}.md`, { create: true })).createWritable();
      await w.write(`---\nid: ${id}\ntitle: Extra ${i}\nparent: null\nassignee: null\ncreatedAt: 2027-01-01T00:${String(i % 60).padStart(2, '0')}:${String(Math.floor(i / 60)).padStart(2, '0')}Z\n---\n`);
      await w.close();
    }
    window.dispatchEvent(new Event('focus'));
  });
  await node('Extra 79').waitFor();
  await page.getByRole('button', { name: 'Ajustar' }).click();
  await page.screenshot({ path: path.join(root, 'test-results-zoom.png') });
  const inside = async (name) => { const b = await node(name).boundingBox(); return b.y >= canvas.y - 1 && b.y + b.height <= canvas.y + canvas.height + 1; };
  assert.ok(await inside('Comprar celular') && await inside('Extra 79') && await inside('Extra 59'));
  await node('Comprar celular').click();
  await level.click();
  // o foco ficou no botão de zoom: volta para o nó antes de navegar
  await node('Comprar celular').evaluate((el) => el.focus({ preventScroll: true }));
  for (let i = 0; i < 30; i++) await page.keyboard.press('ArrowDown');
  await until(async () => inside(await page.evaluate(() => document.activeElement.getAttribute('aria-label'))), 'teclado revela o nó');
  step('ajustar à tela mostra a árvore inteira; setas levam a tela até o nó');
  await page.evaluate(async () => {
    const dir = await (await (await navigator.storage.getDirectory()).getDirectoryHandle('demo-e2e')).getDirectoryHandle('activities');
    for (let i = 0; i < 80; i++) await dir.removeEntry(`00000000-0000-4000-8000-${String(i).padStart(12, '0')}.md`);
    window.dispatchEvent(new Event('focus'));
  });
  await node('Extra 0').waitFor({ state: 'detached' });
  await page.getByRole('button', { name: 'Ajustar' }).click();

  await node('Comprar celular').click();
  await node('Comprar celular').press('Delete');
  await page.getByRole('dialog').getByRole('button', { name: 'Remover 3 atividades' }).click();
  await until(async () => (await fsRead('activities')).length === 0, 'arquivos removidos');
  await page.getByRole('button', { name: 'Nova atividade', exact: true }).waitFor();
  const trash = await fsRead('.plans/trash');
  assert.equal(trash.length, 1);
  assert.equal((await fsRead('.plans/trash/' + trash[0])).length, 4);
  step('F02 remove a subárvore com confirmação e guarda na lixeira');

  await page.getByRole('button', { name: 'Nova atividade', exact: true }).click();
  await page.getByLabel('Título da atividade').fill('Raiz');
  await page.keyboard.press('Enter');
  for (const nome of ['Um', 'Dois', 'Três']) {
    await node('Raiz').press('Enter');
    await page.getByLabel('Título da atividade').fill(nome);
    await page.keyboard.press('Enter');
    await node(nome).waitFor();
  }
  await page.getByRole('button', { name: 'Ajustar à tela' }).click();
  /** leva o cartão até uma altura (fração) de outro e, se pedido, solta */
  const drag = async (from, to, fraction, { drop = true } = {}) => {
    const a = await node(from).boundingBox();
    await page.mouse.move(a.x + 40, a.y + a.height / 2);
    await page.mouse.down();
    const b = await node(to).boundingBox();
    await page.mouse.move(b.x + 60, b.y + b.height * fraction, { steps: 8 });
    if (drop) await page.mouse.up();
  };
  /** forma da árvore lida dos arquivos: filhos em ordem */
  const shape = async () => {
    const list = await Promise.all((await fsRead('activities')).map(async (f) => {
      const text = await fsRead('activities/' + f);
      const get = (k) => text.match(new RegExp(`^${k}: (.*)$`, 'm'))?.[1];
      return { id: get('id'), title: get('title'), parent: get('parent'), key: Number(get('order') ?? Date.parse(get('createdAt'))) };
    }));
    const walk = (p) => list.filter((n) => n.parent === p).sort((x, y) => x.key - y.key).map((n) => { const k = walk(n.id); return n.title + (k ? `(${k})` : ''); }).join(' ');
    return walk('null');
  };
  const becomes = (expected) => until(async () => (await shape()) === expected, `árvore ${expected}`, 6000).catch(async (err) => { throw new Error(`${err.message}; está ${await shape()}`); });
  await becomes('Raiz(Um Dois Três)');

  await drag('Três', 'Um', 0.1);
  await becomes('Raiz(Três Um Dois)');
  await until(async () => (await node('Três').boundingBox()).y < (await node('Um').boundingBox()).y, 'tela reordenada');
  await drag('Três', 'Dois', 0.92);
  await becomes('Raiz(Um Dois Três)');
  step('arrastar reordena os cartões (antes e depois de outro)');

  await drag('Um', 'Dois', 0.5, { drop: false });
  assert.match(await node('Dois').getAttribute('class'), /drop-child/);
  await page.mouse.up();
  await becomes('Raiz(Dois(Um) Três)');
  await page.getByRole('button', { name: 'Minimizar Dois' }).click();
  await drag('Três', 'Dois', 0.5);
  await becomes('Raiz(Dois(Um Três))');
  await node('Três').waitFor();
  step('soltar no meio de um cartão o torna filho, abrindo o ramo minimizado');

  await drag('Raiz', 'Um', 0.5);
  await drag('Dois', 'Dois', 0.5);
  await drag('Três', 'Raiz', 0.5, { drop: false });
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 300));
  await becomes('Raiz(Dois(Um Três))');
  step('não move para dentro de si mesmo; Esc cancela');

  await drag('Um', 'Raiz', 0.1);
  await becomes('Um Raiz(Dois(Três))');
  await node('Três').click();
  assert.equal(await node('Três').getAttribute('aria-selected'), 'true', 'clicar continua selecionando');
  await page.reload();
  await node('Três').waitFor();
  await becomes('Um Raiz(Dois(Três))');
  assert.ok((await node('Um').boundingBox()).y < (await node('Raiz').boundingBox()).y);
  step('arrastar até o nível das raízes; tudo continua depois de recarregar');

  const comandos = page.getByRole('region', { name: 'Comandos' });
  const largura = async () => (await page.getByRole('region', { name: 'Árvore de execução' }).boundingBox()).width;
  assert.equal(await node('Um').evaluate((el) => getComputedStyle(el).borderTopWidth), '0px', 'cartão sem borda');
  await node('Três').click();
  // confere num cartão não selecionado: o anel de seleção é desenhado com box-shadow
  assert.notEqual(await node('Um').evaluate((el) => getComputedStyle(el).boxShadow), 'none', 'cartão com sombra');
  const estreita = await largura();
  await page.getByLabel('Descrição', { exact: true }).fill('guardada ao minimizar');
  await page.getByRole('button', { name: 'Minimizar painel' }).click();
  assert.equal(await comandos.isVisible(), false);
  assert.ok((await largura()) - estreita > 430, 'a árvore ocupa o lugar do painel');
  await until(async () => (await fileOf('Três')).text.includes('guardada ao minimizar'), 'texto salvo ao minimizar');
  await until(async () => JSON.parse(await fsRead('.plans/ui.json')).panel === false, 'painel minimizado em ui.json');
  await page.reload();
  await node('Três').waitFor();
  assert.equal(await comandos.isVisible(), false);
  await node('Um').click();
  assert.equal(await comandos.isVisible(), false, 'selecionar não reabre o painel');
  await page.getByRole('button', { name: 'Mostrar painel' }).click();
  await comandos.waitFor();
  assert.equal(await page.getByRole('heading', { name: 'Um' }).count(), 1);
  step('painel lateral minimiza e volta, lembrado no arquivo');

  const css = (selector, prop) => page.locator(selector).first().evaluate((el, prop) => getComputedStyle(el)[prop], prop);
  assert.equal(await page.getByRole('group', { name: 'Tema' }).getByRole('button').count(), 9);
  await page.getByRole('button', { name: 'Tema Preto' }).click();
  assert.equal(await css('.viewport', 'backgroundColor'), 'rgb(0, 0, 0)');
  assert.equal(await css('body', 'backgroundColor'), 'rgb(14, 14, 14)');
  assert.equal(await page.getByRole('button', { name: 'Tema Preto' }).getAttribute('aria-pressed'), 'true');
  await until(async () => JSON.parse(await fsRead('.plans/ui.json')).theme === 'preto', 'tema gravado em ui.json');
  await page.reload();
  await node('Três').waitFor();
  assert.equal(await css('body', 'backgroundColor'), 'rgb(14, 14, 14)');
  await node('Três').click();
  await page.screenshot({ path: path.join(root, 'test-results-preto.png') });
  await page.getByRole('button', { name: /^Client|Aguardando o client/ }).click();
  assert.equal(await css('.dialog', 'backgroundColor'), 'rgb(14, 14, 14)');
  await page.screenshot({ path: path.join(root, 'test-results-preto-dialogo.png') });
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await page.getByRole('button', { name: 'Tema Papel' }).click();
  assert.equal(await css('body', 'backgroundColor'), 'rgb(255, 255, 255)');
  step('bolinhas de tema no topo; o preto fica salvo no arquivo');

  // ----- descrição em Markdown -----
  await node('Dois').click();
  const campo = page.getByLabel('Descrição', { exact: true });
  const modo = (nome) => page.getByRole('radio', { name: nome, exact: true }).first();
  const doc = page.getByRole('document', { name: 'Descrição formatada' });
  await modo('Editar').click();
  const fonte = ['## Passos', '', '- [x] cotar', '- [ ] comprar', '', '| item | preço |', '|---|---|', '| fone | 500 |', '',
    'Veja o [site](https://exemplo.com) e o [arquivo](../docs/x.md).', '', '![foto](https://exemplo.com/f.png)', '',
    '<img src=x onerror="window.invadido=1"><script>window.invadido=2</script>', '', '[ruim](javascript:window.invadido=3)'].join('\n');
  await campo.fill(fonte);
  await modo('Ler').click();
  await doc.getByRole('heading', { name: 'Passos' }).waitFor();
  assert.equal(await page.locator('.node-panel .md-read').count(), 1, 'uma caixa de leitura só');
  assert.equal(await doc.getByRole('checkbox').count(), 2);
  assert.equal(await doc.getByRole('cell', { name: '500' }).count(), 1);
  const site = doc.getByRole('link', { name: 'site' });
  assert.equal(await site.getAttribute('target'), '_blank');
  assert.equal(await site.getAttribute('rel'), 'noopener noreferrer');
  assert.equal(await doc.getByRole('link', { name: 'arquivo' }).count(), 0, 'link relativo não sai do app');
  assert.equal(await doc.locator('img, script').count(), 0, 'sem HTML nem imagem de fora');
  assert.equal(await doc.locator('a[href^="javascript"]').count(), 0);
  assert.equal(await page.evaluate(() => window.invadido), undefined);
  await until(async () => (await fileOf('Dois')).text.endsWith(fonte + '\n'), 'o Markdown vai para o arquivo como foi escrito');
  await until(async () => JSON.parse(await fsRead('.plans/ui.json')).descriptionMode === 'read', 'modo lembrado');
  await page.screenshot({ path: path.join(root, 'test-results-md-ler.png') });
  step('descrição lida como README, sem HTML, imagens de fora nem links que saem do app');

  await doc.dblclick();
  await campo.waitFor();
  await campo.fill('negrito aqui');
  await campo.selectText();
  await page.getByRole('button', { name: 'Negrito' }).click();
  await until(async () => (await campo.inputValue()) === '**negrito aqui**', 'barra de ferramentas');
  await page.getByLabel('Comando', { exact: true }).focus();
  await until(async () => (await fileOf('Dois')).text.endsWith('**negrito aqui**\n'), 'salvo ao sair do editor');
  assert.equal(await page.getByText('O arquivo mudou fora desta tela').count(), 0);
  await campo.fill('salvo pelo atalho');
  await campo.press('Meta+s');
  await until(async () => (await fileOf('Dois')).text.endsWith('salvo pelo atalho\n'), 'atalho salva');
  await modo('Dividido').click();
  await campo.fill('# Ao vivo');
  await page.locator('.side .wmde-markdown').getByRole('heading', { name: 'Ao vivo' }).waitFor();
  step('editar com barra de ferramentas, salvar e ver ao vivo no modo dividido');

  await page.getByRole('button', { name: 'Abrir descrição em tela cheia' }).click();
  const janela = page.getByRole('dialog');
  await janela.getByLabel('Descrição', { exact: true }).fill('# Em tela cheia\n\ntexto longo');
  await janela.getByRole('heading', { name: 'Em tela cheia' }).last().waitFor();
  await page.screenshot({ path: path.join(root, 'test-results-md-cheia.png') });
  await janela.getByRole('button', { name: 'Fechar', exact: true }).click();
  await until(async () => (await fileOf('Dois')).text.endsWith('texto longo\n'), 'salvo ao fechar a janela');
  await page.getByRole('button', { name: 'Tema Preto' }).click();
  assert.equal(await page.locator('.node-panel .md').getAttribute('data-color-mode'), 'dark');
  await modo('Ler').click();
  await page.screenshot({ path: path.join(root, 'test-results-md-preto.png') });
  await page.getByRole('button', { name: 'Tema Papel' }).click();
  step('tela cheia e tema escuro');

  // ----- Kanban -----
  await page.getByRole('radio', { name: 'Kanban' }).click();
  const quadro = page.getByRole('region', { name: 'Kanban' });
  const coluna = (nome) => quadro.getByRole('region', { name: nome, exact: true });
  const todos = [];
  for (const f of await fsRead('activities')) {
    const text = await fsRead('activities/' + f);
    todos.push({ id: text.match(/^id: (.+)$/m)[1], parent: text.match(/^parent: (.+)$/m)[1] });
  }
  const folhas = todos.filter((a) => !todos.some((b) => b.parent === a.id)).length;
  assert.ok(folhas < todos.length, 'o cenário tem pais e folhas');
  assert.equal(await quadro.getByRole('listitem').count(), folhas, 'só as folhas viram cartão');
  const cartao = coluna('To do').getByRole('listitem').first();
  const titulo1 = await cartao.getByRole('button').first().innerText();
  await cartao.dragTo(coluna('Doing'));
  await coluna('Doing').getByRole('button', { name: titulo1, exact: true }).waitFor();
  await until(async () => (await fileOf(titulo1)).text.includes('status: doing'), 'arrastar grava o status');
  await coluna('Doing').getByRole('button', { name: titulo1, exact: true }).click();
  await page.getByRole('heading', { name: titulo1, exact: true }).waitFor();
  await page.getByRole('button', { name: `Status de ${titulo1}: Doing` }).click();
  await coluna('Done').getByRole('button', { name: titulo1, exact: true }).waitFor();
  await until(async () => JSON.parse(await fsRead('.plans/ui.json')).view === 'kanban', 'visão gravada em ui.json');
  await page.screenshot({ path: path.join(root, 'test-results-kanban.png') });
  await page.reload();
  await coluna('Done').getByRole('button', { name: titulo1, exact: true }).waitFor();
  await page.getByRole('radio', { name: 'Árvore' }).click();
  await node(titulo1).waitFor();
  step('Kanban lista só as folhas; arrastar muda o status e a visão fica salva');

  // ----- system prompt -----
  await page.getByRole('button', { name: 'Minimizar painel' }).click();
  await page.getByRole('button', { name: 'Configurações do projeto' }).click();
  await page.getByRole('heading', { name: 'Configurações do projeto' }).waitFor();
  const modoPrompt = (nome) => page.getByRole('radiogroup', { name: 'Modo do system prompt' }).getByRole('radio', { name: nome, exact: true });
  const prompt = page.getByLabel('System prompt', { exact: true });
  const promptLido = page.getByRole('document', { name: 'System prompt formatado' });
  await promptLido.getByText('Sem system prompt.').waitFor();
  await modoPrompt('Editar').click();
  await prompt.fill('## Sempre\n\nResponda em português.');
  // trocar de atividade com o texto em edição não perde nada
  await node('Um').click();
  await until(async () => (await fsRead('system-prompt.md')) === '## Sempre\n\nResponda em português.\n', 'system prompt gravado');
  assert.equal(await prompt.inputValue(), '## Sempre\n\nResponda em português.', 'aparece na atividade');
  await prompt.fill('## Sempre\n\nSeja breve.');
  await node('Dois').click();
  await modoPrompt('Ler').click();
  await promptLido.getByText('Seja breve.').waitFor();
  await until(async () => (await fsRead('system-prompt.md')).endsWith('Seja breve.\n'), 'editado a partir da atividade');
  assert.ok(!(await fileOf('Dois')).text.includes('Seja breve'), 'não é copiado para a atividade');
  await page.screenshot({ path: path.join(root, 'test-results-system-prompt.png') });
  await page.reload();
  await promptLido.getByText('Seja breve.').waitFor();
  assert.equal(await page.getByText('O arquivo mudou fora desta tela').count(), 0);
  for (const f of await fsRead('activities')) {
    assert.ok((await fsRead('activities/' + f)).startsWith('SYSTEM PROMPT\n/system-prompt.md\n\n---\n'), f);
  }
  step('system prompt configurado no root, lido e editado em cada atividade');

  assert.deepEqual(errors, []);
  console.log('\nTudo passou.');
} catch (e) {
  console.error(e);
  for (const [k, v] of Object.entries(logs)) console.error(`--- ${k} ---\n${v.slice(-2000)}`);
  process.exitCode = 1;
} finally {
  await browser?.close();
  procs.forEach(stop);
  rmSync(work, { recursive: true, force: true });
}

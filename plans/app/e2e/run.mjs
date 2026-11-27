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
  await page.getByRole('button', { name: '+ Atividade' }).click();
  await page.getByLabel('Título da atividade').fill('Comprar celular');
  await page.keyboard.press('Enter');
  await node('Comprar celular').waitFor();
  await node('Comprar celular').press('Enter');
  await page.getByLabel('Título da atividade').fill('Definir orçamento');
  await page.keyboard.press('Enter');
  await node('Definir orçamento').waitFor();
  await node('Definir orçamento').press('Enter');
  await page.getByLabel('Título da atividade').fill('Pesquisar preços');
  await page.keyboard.press('Enter');
  await node('Pesquisar preços').waitFor();
  assert.equal(await node('Pesquisar preços').getAttribute('aria-level'), '3');
  step('F01 cria nó raiz e filhos, pelo botão e pelo teclado');

  await node('Definir orçamento').click();
  await page.getByLabel('Responsável').selectOption('claude');
  await page.getByLabel('Descrição').fill('Até R$ 3.000\nsegunda linha');
  await page.getByLabel('Comando', { exact: true }).focus();
  await page.getByText('Salvo no arquivo').waitFor();
  await until(async () => { const x = await fileOf('Definir orçamento'); return x.text.includes('assignee: claude') && x.text.endsWith('---\nAté R$ 3.000\nsegunda linha\n'); }, 'arquivo com responsável e descrição');
  step('F03 e F04 gravados no .md');

  await page.reload();
  await node('Definir orçamento').waitFor();
  assert.equal(await page.getByLabel('Descrição').inputValue(), 'Até R$ 3.000\nsegunda linha');
  assert.equal(await page.getByLabel('Responsável').inputValue(), 'claude');
  step('tudo volta dos arquivos depois de recarregar');

  const edited = await fileOf('Pesquisar preços');
  await page.evaluate(async ({ f, text }) => {
    const dir = await (await (await navigator.storage.getDirectory()).getDirectoryHandle('demo-e2e')).getDirectoryHandle('activities');
    const w = await (await dir.getFileHandle(f)).createWritable(); await w.write(text.replace('Pesquisar preços', 'Editado fora')); await w.close();
    window.dispatchEvent(new Event('focus'));
  }, edited);
  await node('Editado fora').waitFor();
  step('edição externa do arquivo aparece na tela');

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

  await page.screenshot({ path: path.join(root, 'test-results-tela.png') });

  await node('Comprar celular').click();
  await node('Comprar celular').press('Delete');
  await page.getByRole('dialog').getByRole('button', { name: 'Remover 3 atividades' }).click();
  await until(async () => (await fsRead('activities')).length === 0, 'arquivos removidos');
  const trash = await fsRead('.plans/trash');
  assert.equal(trash.length, 1);
  assert.equal((await fsRead('.plans/trash/' + trash[0])).length, 4);
  step('F02 remove a subárvore com confirmação e guarda na lixeira');

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

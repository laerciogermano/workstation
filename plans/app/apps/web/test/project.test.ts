import { describe, expect, it } from 'vitest';
import { ConflictError, HasChildrenError, initFolder, inspectFolder, ProjectStore } from '../src/folder/project.ts';
import { MemDir, MemFile } from './memory.ts';

async function setup() {
  const root = new MemDir('meu-projeto');
  const store = new ProjectStore(root, await initFolder(root));
  const activities = await root.getDirectoryHandle('activities');
  return { root, store, activities };
}

describe('pasta', () => {
  it('reconhece pasta nova, cria a estrutura e não toca no .gitignore da pessoa', async () => {
    const root = new MemDir();
    const mine = await root.getFileHandle('.gitignore', { create: true });
    mine.text = 'node_modules\n';
    expect(await inspectFolder(root)).toEqual({ state: 'new', empty: true });
    const project = await initFolder(root);
    expect(await inspectFolder(root)).toEqual({ state: 'ready', project });
    expect(mine.text).toBe('node_modules\n');
    expect((await new ProjectStore(root, project).load()).assignees).toHaveLength(3);
  });

  it('não sobrescreve um project.json inválido', async () => {
    const root = new MemDir();
    const meta = await root.getDirectoryHandle('.plans', { create: true });
    (await meta.getFileHandle('project.json', { create: true })).text = '{';
    expect((await inspectFolder(root)).state).toBe('invalid');
  });
});

describe('EP-01', () => {
  it('F01, F03 e F04 gravam no arquivo da atividade', async () => {
    const { store, activities } = await setup();
    const a = await store.create(null, '  Comprar celular ');
    const b = await store.create(a.id, 'Definir orçamento');
    const c = await store.update(b.id, b.rev, { assignee: 'claude' });
    await store.update(c.id, c.rev, { description: 'Até R$ 3.000' });
    const text = (await activities.getFileHandle(`${b.id}.md`)).text;
    expect(text).toContain('assignee: claude');
    expect(text).toContain(`parent: ${a.id}`);
    expect(text.endsWith('---\nAté R$ 3.000\n')).toBe(true);
    expect((await store.load()).activities.map((x) => x.title).sort()).toEqual(['Comprar celular', 'Definir orçamento']);
    await expect(store.create(null, '  ')).rejects.toThrow();
  });

  it('renomeia sem trocar o arquivo e recusa título vazio', async () => {
    const { store, activities } = await setup();
    const a = await store.create(null, 'antigo');
    const b = await store.update(a.id, a.rev, { title: '  novo nome  ' });
    expect(b.title).toBe('novo nome');
    expect((await activities.getFileHandle(`${a.id}.md`)).text).toContain('title: novo nome');
    await expect(store.update(a.id, b.rev, { title: '   ' })).rejects.toThrow();
  });

  it('recusa gravar por cima de uma edição externa', async () => {
    const { store, activities } = await setup();
    const a = await store.create(null, 'x');
    const file = await activities.getFileHandle(`${a.id}.md`);
    file.text += 'editado fora\n';
    await expect(store.update(a.id, a.rev, { description: 'minha' })).rejects.toThrow(ConflictError);
    await expect(store.remove(a.id, a.rev, true)).rejects.toThrow(ConflictError);
    expect(file.text).toContain('editado fora');
  });

  it('F02 pede confirmação, guarda na lixeira e apaga das folhas para o nó', async () => {
    const { root, store, activities } = await setup();
    const a = await store.create(null, 'a');
    const b = await store.create(a.id, 'b');
    const c = await store.create(b.id, 'c');
    const other = await store.create(null, 'fica');
    await expect(store.remove(a.id, a.rev, false)).rejects.toMatchObject({ count: 2 });
    await expect(store.remove(a.id, a.rev, false)).rejects.toThrow(HasChildrenError);
    expect(await store.remove(a.id, a.rev, true)).toEqual([c.id, b.id, a.id]);
    expect(activities.removed).toEqual([`${c.id}.md`, `${b.id}.md`, `${a.id}.md`]);
    expect((await store.load()).activities.map((x) => x.id)).toEqual([other.id]);
    const trash = await (await root.getDirectoryHandle('.plans')).getDirectoryHandle('trash');
    const bin = [...trash.items.values()][0] as MemDir;
    expect([...bin.items.keys()].sort()).toEqual([`${a.id}.md`, `${b.id}.md`, `${c.id}.md`, 'manifest.json'].sort());
  });

  it('arquivo inválido ou com nome trocado vira problema e fica intacto', async () => {
    const { store, activities } = await setup();
    const a = await store.create(null, 'a');
    const good = await activities.getFileHandle(`${a.id}.md`);
    const copy = (await activities.getFileHandle(`${a.id} (1).md`, { create: true })) as MemFile;
    copy.text = good.text;
    (await activities.getFileHandle('lixo.md', { create: true })).text = 'sem cabeçalho';
    const snap = await store.load();
    expect(snap.activities).toHaveLength(1);
    expect(snap.problems.map((p) => p.file)).toHaveLength(2);
    expect(copy.text).toBe(good.text);
  });

  it('versão mais nova abre somente leitura', async () => {
    const { root, store } = await setup();
    const newer = new ProjectStore(root, { ...store.project, schemaVersion: 2 });
    await expect(newer.create(null, 'x')).rejects.toThrow(/somente leitura/);
  });
});

describe('system prompt', () => {
  it('começa vazio, é salvo em system-prompt.md e não vai para as atividades', async () => {
    const { root, store } = await setup();
    const a = await store.create(null, 'Um');
    const before = (await store.load()).systemPrompt;
    expect(before.text).toBe('');
    const saved = await store.updateSystemPrompt(before.rev, '# Regras\r\n\r\nResponda em português.');
    expect((await root.getFileHandle('system-prompt.md')).text).toBe('# Regras\n\nResponda em português.\n');
    expect((await store.load()).systemPrompt).toEqual(saved);
    expect((await store.load()).activities[0]!.rev).toBe(a.rev);
    expect((await store.updateSystemPrompt(saved.rev, '')).text).toBe('');
  });

  it('não sobrescreve o que mudou fora da tela nem aceita texto grande demais', async () => {
    const { root, store } = await setup();
    const { rev } = (await store.load()).systemPrompt;
    const file = await root.getFileHandle('system-prompt.md', { create: true });
    file.text = 'escrito no editor\n';
    await expect(store.updateSystemPrompt(rev, 'outro')).rejects.toBeInstanceOf(ConflictError);
    expect(file.text).toBe('escrito no editor\n');
    const now = (await store.load()).systemPrompt;
    await expect(store.updateSystemPrompt(now.rev, 'a'.repeat(100_001))).rejects.toThrow('grande demais');
  });
});

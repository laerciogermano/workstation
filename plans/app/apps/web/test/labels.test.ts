import { labelsOf, newLabelId, parseActivity, sameLabelName } from '@plans/domain';
import { describe, expect, it } from 'vitest';
import { ConflictError, initFolder, ProjectStore } from '../src/folder/project.ts';
import { MemDir } from './memory.ts';

async function setup() {
  const root = new MemDir('meu-projeto');
  const store = new ProjectStore(root, await initFolder(root));
  const activities = await root.getDirectoryHandle('activities');
  const catalog = async () => (await root.getFileHandle('labels.json')).text;
  return { root, store, activities, catalog };
}

describe('etiquetas', () => {
  it('gera um id legível e sem repetir; nomes iguais ignoram acento e caixa', () => {
    expect(newLabelId('Revisão do cliente!', [])).toBe('revisao-do-cliente');
    expect(newLabelId('Bug', ['bug', 'bug-2'])).toBe('bug-3');
    expect(newLabelId('🔥', [])).toBe('etiqueta');
    expect(sameLabelName(' Revisão', 'revisao')).toBe(true);
  });

  it('cria, renomeia e troca a cor em labels.json, sem mudar o id', async () => {
    const { store } = await setup();
    expect((await store.load()).labels).toEqual([]);
    const bug = await store.addLabel('  Bug ', 'red');
    expect(bug).toEqual({ id: 'bug', name: 'Bug', color: 'red' });
    await expect(store.addLabel('bug', 'blue')).rejects.toThrow('Já existe');
    await expect(store.addLabel('   ', 'blue')).rejects.toThrow('Informe o nome');
    await store.updateLabel('bug', { name: 'Defeito' });
    await store.updateLabel('bug', { color: 'orange' });
    expect((await store.load()).labels).toEqual([{ id: 'bug', name: 'Defeito', color: 'orange' }]);
    await expect(store.updateLabel('sumiu', { name: 'x' })).rejects.toThrow(ConflictError);
  });

  it('marca e desmarca no cartão; sem etiqueta, o campo sai do arquivo', async () => {
    const { store, activities } = await setup();
    const a = await store.create(null, 'x');
    const file = await activities.getFileHandle(`${a.id}.md`);
    const b = await store.update(a.id, a.rev, { labels: ['bug', 'ideia'] });
    expect(parseActivity(file.text).labels).toEqual(['bug', 'ideia']);
    const c = await store.update(b.id, b.rev, { status: 'doing' });
    expect(c.labels).toEqual(['bug', 'ideia']);
    await store.update(c.id, c.rev, { labels: [] });
    expect(file.text).not.toContain('labels');
  });

  it('remover tira do catálogo e dos cartões, com cópia na lixeira', async () => {
    const { root, store, activities, catalog } = await setup();
    await store.addLabel('Bug', 'red');
    await store.addLabel('Ideia', 'blue');
    const a = await store.create(null, 'com as duas');
    await store.update(a.id, a.rev, { labels: ['bug', 'ideia'], description: 'fica' });
    const other = await store.create(null, 'sem etiqueta');
    const untouched = (await activities.getFileHandle(`${other.id}.md`)).text;

    await store.removeLabel('bug');
    const after = await store.load();
    expect(after.labels.map((l) => l.id)).toEqual(['ideia']);
    expect(after.activities.find((x) => x.id === a.id)).toMatchObject({ labels: ['ideia'], description: 'fica' });
    expect((await activities.getFileHandle(`${other.id}.md`)).text).toBe(untouched);
    const trash = await (await root.getDirectoryHandle('.plans')).getDirectoryHandle('trash');
    const [bin] = [...trash.items.keys()];
    const saved = await trash.getDirectoryHandle(bin!);
    expect((await saved.getFileHandle('labels.json')).text).toContain('"bug"');
    expect((await (await saved.getDirectoryHandle('activities')).getFileHandle(`${a.id}.md`)).text).toContain('- bug');
    const before = await catalog();
    await store.removeLabel('bug'); // de novo: nada a fazer
    expect(await catalog()).toBe(before);
  });

  it('labels.json inválido vira aviso e não é sobrescrito', async () => {
    const { root, store, catalog } = await setup();
    (await root.getFileHandle('labels.json', { create: true })).text = '{';
    const snapshot = await store.load();
    expect(snapshot.labels).toEqual([]);
    expect(snapshot.problems.map((p) => p.file)).toEqual(['labels.json']);
    await expect(store.addLabel('Bug', 'red')).rejects.toThrow('formato inválido');
    expect(await catalog()).toBe('{');
  });

  it('o cartão mostra na ordem do catálogo e ignora id desconhecido', () => {
    const catalog = [{ id: 'a', name: 'A', color: 'red' as const }, { id: 'b', name: 'B', color: 'blue' as const }];
    expect(labelsOf(['b', 'fantasma', 'a'], catalog).map((l) => l.id)).toEqual(['a', 'b']);
    expect(labelsOf(undefined, catalog)).toEqual([]);
  });
});

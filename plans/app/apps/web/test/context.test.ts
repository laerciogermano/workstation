import { describe, expect, it } from 'vitest';
import { attachmentText, buildCardContext, contextToPrompt, PART_LIMIT, PROMPT_LIMIT } from '../src/ai/context.ts';
import { initFolder, ProjectStore } from '../src/folder/project.ts';
import { MemDir } from './memory.ts';

async function setup() {
  const dir = new MemDir();
  const store = new ProjectStore(dir, await initFolder(dir));
  const root = await store.create(null, 'Plans');
  const parent = await store.create(root.id, 'IA');
  await store.update(parent.id, parent.rev, { description: 'Recursos com IA' });
  const card = await store.create(parent.id, 'Regenerar descrição');
  await store.update(card.id, card.rev, { description: 'Texto antigo', status: 'doing', priority: 5 });
  await store.create(parent.id, 'Chave de API');
  await store.create(card.id, 'Botão');
  await store.updateSystemPrompt((await store.load()).systemPrompt.rev, 'Responda em português');
  await store.addComment(card.id, 'eu', 'Usar até os pais');
  await store.addAttachment(card.id, 'input', 'notas.md', new Blob(['# Notas']));
  await store.addAttachment(card.id, 'output', 'logo.png', new Blob(['png']));
  await store.addComment(parent.id, 'eu', 'Vale para toda a IA');
  await store.addAttachment(parent.id, 'input', 'estudo.txt', new Blob(['Comparativo de modelos']));
  return { store, card };
}
const contextOf = async ({ store, card }: Awaited<ReturnType<typeof setup>>) =>
  buildCardContext(await store.load(), card.id, await store.loadFiles(card.id), (side, name, owner) => store.readAttachment(owner, side, name), (id) => store.loadFiles(id));

describe('contexto do cartão', () => {
  it('junta pais, filhos, irmãs, system prompt, comentários e o texto dos anexos', async () => {
    const context = await contextOf(await setup());
    expect(context).toEqual({
      title: 'Regenerar descrição',
      description: 'Texto antigo',
      status: 'Doing',
      priority: 'Urgente',
      ancestors: [
        { title: 'Plans', description: '' },
        {
          title: 'IA', description: 'Recursos com IA',
          comments: [{ author: 'eu', text: 'Vale para toda a IA' }],
          attachments: [{ side: 'input', name: 'estudo.txt', text: 'Comparativo de modelos' }],
        },
      ],
      children: [{ title: 'Botão', status: 'To do' }],
      siblings: ['Chave de API'],
      systemPrompt: 'Responda em português',
      comments: [{ author: 'eu', text: 'Usar até os pais' }],
      attachments: [{ side: 'input', name: 'notas.md', text: '# Notas' }, { side: 'output', name: 'logo.png' }],
    });
    const prompt = contextToPrompt(context);
    for (const piece of ['Prioridade: Urgente', 'Texto antigo', 'Recursos com IA', 'Botão (To do)', 'eu: Usar até os pais', '[input] notas.md\n# Notas', '[output] logo.png', 'Chave de API', 'Responda em português', 'eu: Vale para toda a IA', '[input] estudo.txt\nComparativo de modelos']) {
      expect(prompt).toContain(piece);
    }
  });

  it('corta trechos longos e o conjunto, mantendo o título e a descrição', async () => {
    const context = await contextOf(await setup());
    const long = 'x'.repeat(PART_LIMIT * 2);
    const prompt = contextToPrompt({ ...context, comments: Array.from({ length: 20 }, () => ({ author: null, text: long })) });
    expect(prompt.length).toBeLessThanOrEqual(PROMPT_LIMIT + 20);
    expect(prompt).toContain('Título: Regenerar descrição');
    expect(prompt).toContain('Texto antigo');
    expect(prompt).toContain('[…cortado]');
    expect(prompt).not.toContain(long);
  });

  it('anexo binário, de mídia ou corrompido entra só pelo nome', async () => {
    expect(await attachmentText('a.bin', new Blob(['\u0000\u0001']))).toBeUndefined();
    expect(await attachmentText('a.pdf', new Blob(['%PDF']))).toBeUndefined();
    expect(await attachmentText('a.xlsx', new Blob(['não é zip']))).toBeUndefined();
    expect(await attachmentText('a.csv', new Blob(['a;b']))).toBe('a;b');
  });

  it('não entra em laço com pais em ciclo e falha se a atividade sumiu', async () => {
    const s = await setup();
    const snapshot = await s.store.load();
    const cyclic = { ...snapshot, activities: snapshot.activities.map((a) => (a.title === 'Plans' ? { ...a, parent: s.card.id } : a)) };
    const files = await s.store.loadFiles(s.card.id);
    const read = () => Promise.reject(new Error('sumiu'));
    const context = await buildCardContext(cyclic, s.card.id, files, read);
    expect(context.ancestors.map((a) => a.title)).toEqual(['Plans', 'IA']);
    expect(context.attachments.every((a) => a.text === undefined)).toBe(true);
    await expect(buildCardContext(snapshot, crypto.randomUUID(), files, read)).rejects.toThrow(/não existe/);
  });
});

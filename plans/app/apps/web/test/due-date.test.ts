import { parseActivity, serializeActivity } from '@plans/domain';
import { describe, expect, it } from 'vitest';
import { buildCardContext, contextToPrompt } from '../src/ai/context.ts';
import { dueLabel, dueState } from '../src/features/DueDate.tsx';
import { initFolder, ProjectStore } from '../src/folder/project.ts';
import { MemDir } from './memory.ts';

async function setup() {
  const root = new MemDir('meu-projeto');
  const store = new ProjectStore(root, await initFolder(root));
  const activities = await root.getDirectoryHandle('activities');
  const card = await store.create(null, 'Comprar celular');
  const text = async () => (await activities.getFileHandle(`${card.id}.md`)).text;
  return { store, card, text };
}

describe('data de entrega', () => {
  it('grava no cabeçalho, mantém ao mudar outro campo e tira', async () => {
    const { store, card, text } = await setup();
    expect(await text()).not.toContain('dueDate');

    const dated = await store.update(card.id, card.rev, { dueDate: '2026-12-05' });
    expect(dated.dueDate).toBe('2026-12-05');
    expect(await text()).toContain('\ndueDate: 2026-12-05\n');

    const moved = await store.update(card.id, dated.rev, { status: 'doing' });
    expect((await store.load()).activities[0]!.dueDate).toBe('2026-12-05');

    const cleared = await store.update(card.id, moved.rev, { dueDate: undefined });
    expect(cleared.dueDate).toBeUndefined();
    expect(await text()).not.toContain('dueDate');
  });

  it('lê a data escrita à mão e recusa o que não é um dia', async () => {
    const { store, card, text } = await setup();
    await store.update(card.id, card.rev, { dueDate: '2028-02-29' });
    const saved = await text();
    expect(parseActivity(saved).dueDate).toBe('2028-02-29');
    expect(parseActivity(serializeActivity(parseActivity(saved)))).toEqual(parseActivity(saved));
    for (const bad of ['2026-02-29', '2026-13-01', '05/12/2026', '2026-12-05T10:00:00Z', 'amanhã']) {
      expect(() => parseActivity(saved.replace('2028-02-29', bad))).toThrow(/dueDate/);
    }
    await expect(store.update(card.id, (await store.load()).activities[0]!.rev, { dueDate: '2026-02-30' })).rejects.toThrow(/dueDate/);
    expect(await text()).toBe(saved);
  });

  it('entra no contexto enviado à IA', async () => {
    const { store, card } = await setup();
    await store.update(card.id, card.rev, { dueDate: '2026-12-05' });
    const context = await buildCardContext(await store.load(), card.id, { input: [], output: [], comments: [] }, async () => new Blob());
    expect(contextToPrompt(context)).toContain('Data de entrega: 2026-12-05');
  });

  it('diz se está atrasada, é hoje, está por vir ou já foi entregue', () => {
    const today = '2026-11-28';
    expect(dueState('2026-11-27', today, false)).toBe('late');
    expect(dueState('2026-11-28', today, false)).toBe('today');
    expect(dueState('2027-01-01', today, false)).toBe('ahead');
    expect(dueState('2026-11-27', today, true)).toBe('done');
    expect(dueLabel('2026-12-05', today)).toBe('05/12');
    expect(dueLabel('2027-01-01', today)).toBe('01/01/2027');
  });
});

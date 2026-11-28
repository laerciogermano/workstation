import { buildTree, localDay, withLocalDay } from '@plans/domain';
import { describe, expect, it } from 'vitest';
import { initFolder, ProjectStore } from '../src/folder/project.ts';
import { MemDir } from './memory.ts';

describe('data de criação', () => {
  it('mostra o dia local e troca o dia mantendo a hora', () => {
    const iso = new Date(2026, 10, 28, 23, 30, 15, 96).toISOString();
    expect(localDay(iso)).toBe('2026-11-28');
    expect(withLocalDay(iso, '2026-01-05')).toBe(new Date(2026, 0, 5, 23, 30, 15, 96).toISOString());
    // só o dia, escrito à mão: não volta um dia em fuso negativo
    expect(localDay('2026-11-28')).toBe('2026-11-28');
    expect(localDay(withLocalDay('2026-11-28', '2026-03-01')!)).toBe('2026-03-01');
  });

  it('recusa dia que não existe e aceita corrigir data ilegível', () => {
    expect(localDay('ontem')).toBeUndefined();
    expect(withLocalDay('2026-11-28T10:00:00Z', '2026-02-30')).toBeUndefined();
    expect(withLocalDay('2026-11-28T10:00:00Z', '')).toBeUndefined();
    expect(localDay(withLocalDay('ontem', '2026-11-28')!)).toBe('2026-11-28');
  });

  it('grava a data nova sem mudar a posição do cartão entre os irmãos', async () => {
    const root = new MemDir();
    const store = new ProjectStore(root, await initFolder(root));
    const first = await store.create(null, 'primeiro');
    await new Promise((r) => setTimeout(r, 5));
    await store.create(null, 'segundo');
    const createdAt = withLocalDay(first.createdAt, '2030-01-01')!;
    const changed = await store.update(first.id, first.rev, { createdAt });
    expect(changed.createdAt).toBe(createdAt);
    expect(changed.order).toBe(Date.parse(first.createdAt));
    expect(buildTree((await store.load()).activities).map((n) => n.activity.title)).toEqual(['primeiro', 'segundo']);
  });
});

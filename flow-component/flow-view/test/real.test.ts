import { describe, expect, it } from 'vitest';
import { REAL } from '../example/real.js';
import { layoutFlow, renderSvg } from '../src/index.ts';

const cases = Object.entries(REAL);

describe('casos reais', () => {
  it.each(cases.filter(([k]) => k !== 'sistema'))('%s: todo dado existe antes de ser usado e nada fica sem origem', (_key, { tree }) => {
    const { rows, state } = layoutFlow(tree);
    // o mesmo nome pode reaparecer como campo de um objeto montado depois: vale a primeira vez que existe
    const items = new Map<string, (typeof state)[number]>();
    for (const s of state) if (!items.has(s.name) || s.since < items.get(s.name)!.since) items.set(s.name, s);
    for (const r of rows) {
      if (!r.in) continue;
      const item = items.get(r.in.name);
      expect(item, `${r.name} usa ${r.in.name}`).toBeDefined();
      expect(item!.since, `${r.name} usa ${r.in.name} antes de existir`).toBeLessThanOrEqual(r.start);
    }
    // todo dado tem endereço: produzido no fluxo, com valor ou variável de laço
    expect(state.filter((s) => s.kind !== 'function' && s.level === 0 && !s.solid).map((s) => s.name)).toEqual([]);
  });

  it.each(cases)('%s: desenha, sem nomes juntados ao lado das barras', (_key, { tree }) => {
    const layout = layoutFlow(tree);
    expect(layout.rows.length).toBeGreaterThan(10);
    expect(layout.rows.flatMap((r) => [r.in?.name, r.out?.name]).filter((n) => n?.includes(','))).toEqual([]);
    expect(renderSvg(layout)).toContain('</svg>');
  });

  it('o sistema completo junta todos os casos', () => {
    const total = cases.filter(([k]) => k !== 'sistema').reduce((sum, [, c]) => sum + layoutFlow(c.tree).rows.length, 0);
    expect(layoutFlow(REAL.sistema.tree).rows).toHaveLength(total + 1);
  });
});

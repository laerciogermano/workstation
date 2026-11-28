import { describe, expect, it } from 'vitest';
import { layoutFlow, renderSvg } from '../src/index.ts';

const tree = { name: 'main', children: [{ name: 'ler' }, { name: 'somar' }] };

describe('linha destacada', () => {
  it('desenha o destaque só quando pedido', () => {
    const layout = layoutFlow(tree);
    expect(renderSvg(layout)).not.toContain('class="sel"');
    expect(renderSvg(layout, { selected: 2 })).toContain('class="sel-mark"');
    expect(renderSvg(layout, { selected: 99 })).not.toContain('class="sel"');
  });
  it('linha escondida por uma minimizada não é destacada', () => {
    const layout = layoutFlow(tree);
    expect(renderSvg(layout, { selected: 2, visible: { rows: [0], closed: new Set([0]) } })).not.toContain('class="sel"');
  });
});

describe('dado declarado', () => {
  it('entra no estado quando a função começa, sem barra de entrada ou saída', () => {
    const layout = layoutFlow({ name: 'main', children: [{ name: 'antes' }, { name: 'depois', data: [{ name: 'idade', value: 30 }] }] });
    expect(layout.state.find((s) => s.name === 'idade')).toMatchObject({ since: 1, solid: true, value: '30' });
    expect(layout.rows[2]!.in).toBeUndefined();
  });
  it('função como dado aparece como círculo', () => {
    const layout = layoutFlow({ name: 'main', data: [{ name: 'acao', function: true }] });
    expect(layout.state.find((s) => s.name === 'acao')).toMatchObject({ kind: 'function' });
  });
});

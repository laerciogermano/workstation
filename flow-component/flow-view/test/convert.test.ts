// A página edita os exemplos no formato do Flow Editor: a conversão não pode mudar o desenho.
import { describe, expect, it } from 'vitest';
import { fromJson } from '../../flow-editor/src/serialize.ts';
import { toView } from '../../flow-editor/src/view-tree.ts';
import { editable } from '../example/convert.js';
import { REAL } from '../example/real.js';
import { SAMPLES } from '../example/samples.js';
import { layoutFlow, type FlowNode } from '../src/index.ts';

const drawn = (tree: FlowNode) => {
  const { rows, state, links } = layoutFlow(tree);
  return {
    rows: rows.map((r) => [r.name, r.start, r.end, r.abstract, r.source?.name, r.in?.name, r.in?.solid, r.out?.name, r.out?.solid]),
    // o texto passa a aparecer entre aspas, como no editor
    state: state.map((s) => [s.name, s.kind, s.level, s.since, s.solid, s.value?.replaceAll('"', '')]),
    links,
  };
};

describe('exemplos no editor', () => {
  for (const [key, sample] of Object.entries({ ...REAL, ...SAMPLES })) {
    it(`${key} desenha igual depois de convertido`, () => {
      const converted = toView(fromJson(JSON.stringify(editable(sample.tree)))) as FlowNode;
      expect(drawn(converted)).toEqual(drawn(sample.tree));
    });
  }
});

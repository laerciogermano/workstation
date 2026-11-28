// Os exemplos do FOP e sequências aleatórias de comandos: sempre desenháveis, com código válido.
import { describe, expect, it } from 'vitest';
import { layoutFlow } from '@flow/view';
import { apply, EditError, EXAMPLES, fn, fromJson, generateCode, toJson, toView, walk } from '../src/index.ts';
import type { Command, FlowNode, FnNode } from '../src/index.ts';

/** Confere a sintaxe do módulo gerado (sem executar). */
const parses = (code: string) => {
  const body = code.replace(/^import .*$/gm, '').replace(/^export /gm, '');
  // várias seções de arquivo podem repetir nomes: confere uma de cada vez
  for (const section of body.split(/^\/\/ [\w$-]+\.\w+$/m)) {
    try {
      new Function(`"use strict"; ${section}`);
    } catch (error) {
      throw new Error(`${(error as Error).message}\n${code}`);
    }
  }
};

describe('exemplos do FOP', () => {
  const all = EXAMPLES.flatMap((g) => g.examples);
  it('cobre as seções do site', () => {
    expect(EXAMPLES.map((g) => g.title)).toEqual(['Funções', 'Estados e tipos de dado', 'Seleção', 'Repetição', 'try / catch', 'Blocos', 'Sólidos e abstratos', 'Folhas e use cases', 'Responsáveis', 'Arquivos e visibilidade', 'Práticas, padrões e OOP']);
    expect(all.length).toBeGreaterThanOrEqual(45);
    expect(new Set(all.map((e) => e.key)).size).toBe(all.length);
  });
  for (const example of all) {
    it(`${example.key}: desenha, gera código e passa pelo JSON`, () => {
      const tree = example.tree();
      expect(() => layoutFlow(toView(tree))).not.toThrow();
      parses(generateCode(tree));
      expect(toJson(fromJson(toJson(tree)))).toBe(toJson(tree));
    });
  }
});

describe('código gerado', () => {
  const code = (key: string) => generateCode(EXAMPLES.flatMap((g) => g.examples).find((e) => e.key === key)!.tree());
  it('paralelas viram Promise.all', () => expect(code('paralela')).toContain('const [dobro, triplo] = await Promise.all(['));
  it('o valor existe antes da chamada', () => expect(code('numero')).toMatch(/const valor = 21;\n\s+const dobro = await dobrar\(valor\);/));
  it('if e else', () => expect(code('seSenao')).toMatch(/if \(aprovada\) \{\n\s+await enviar\(\);\n\s+\} else \{/));
  it('else if', () => expect(code('seAninhado')).toContain('} else if (recuperacao) {'));
  it('laços e try', () => {
    expect(code('repFor')).toContain('for (const item of itens) {');
    expect(code('repDoWhile')).toContain('} while (pendente);');
    expect(code('repDoWhile')).toContain('pendente = await tentar();');
    expect(code('tryCatch')).toContain('} catch (error) {');
  });
  it('responsável de fora vira o dono da chamada', () => expect(code('responsavel')).toContain('await carrinho.adicionar();'));
  it('responsável com filhas continua definido', () => {
    const tree = fn('main', { children: [fn('aprovar', { source: { kind: 'person', name: 'Ana' }, children: [fn('revisar')] })] });
    expect(generateCode(tree)).toContain('await revisar();');
  });
  it('outro arquivo é importado', () => {
    expect(code('fileOutro')).toContain('import { pagar } from "./pagamento";');
    expect(code('fileOutro')).toContain('export async function pagar() {');
  });
  it('paralelas começam juntas', () => expect(code('paralela')).not.toMatch(/Promise\.all\(\[\n\s+await/));
  it('o objeto usa as variáveis que já existem', () => expect(code('sequencial')).toContain('const parcelas = { dobro, triplo };'));
  for (const key of ['main', 'sequencial', 'funcaoDado', 'seAninhado', 'switchEx', 'repDoWhile', 'tryFor', 'padSingleton', 'estadoCaixa']) {
    it(`o código de “${key}” executa`, async () => {
      const run = new Function(`${code(key)}; return main();`) as () => Promise<void>;
      await expect(run()).resolves.toBeUndefined();
    });
  }
});

describe('comandos ao acaso', () => {
  it('nunca produzem um fluxo inválido', () => {
    let seed = 7;
    const random = (n: number) => ((seed = (seed * 48271) % 2147483647), seed % n);
    const pick = <T>(list: readonly T[]) => list[random(list.length)]!;
    for (let round = 0; round < 120; round++) {
      let tree: FnNode = fn('main');
      for (let i = 0; i < 60; i++) {
        const nodes: FlowNode[] = [];
        walk(tree, (n) => nodes.push(n));
        const target = pick(nodes).id;
        const command: Command = pick<() => Command>([
          () => ({ type: 'insert', target, where: pick(['inside', 'before', 'after', 'parallel'] as const), kind: pick(['fn', 'fn', 'if', 'ifelse', 'switch', 'for', 'while', 'do-while', 'try'] as const) }),
          () => ({ type: pick(['else', 'elseIf', 'case', 'catch'] as const), target }),
          () => ({ type: pick(['remove', 'unwrap', 'duplicate'] as const), target }),
          () => ({ type: 'move', target, direction: pick(['up', 'down', 'in', 'out'] as const) }),
          () => ({ type: 'wrap', target, kind: pick(['fn', 'if', 'switch', 'for', 'while', 'do-while', 'try'] as const) }),
          () => ({ type: 'update', target, patch: pick([{ parallel: true }, { source: null }, { source: { kind: 'person' as const, name: 'Ana Maria' } }, { expr: 'x' }]) }),
          () => ({ type: 'setData', target, side: pick(['in', 'out', 'data'] as const), list: pick([[], [{ name: 'a', type: 'number' as const, value: '1' }], [{ name: 'a', type: 'abstract' as const }, { name: 'b', type: 'text' as const, value: 'x' }]]) }),
        ])();
        try {
          tree = apply(tree, command).tree;
        } catch (error) {
          if (!(error instanceof EditError)) throw error;
        }
        if (nodes.length > 40) break;
      }
      expect(() => layoutFlow(toView(tree))).not.toThrow();
      expect(() => fromJson(toJson(tree))).not.toThrow();
      parses(generateCode(tree));
    }
  });
});

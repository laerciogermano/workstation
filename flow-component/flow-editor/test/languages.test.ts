// TypeScript conferido pelo compilador e Python pelo próprio interpretador.
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { apply, block, EditError, EXAMPLES, fn, generateCode, walk } from '../src/index.ts';
import type { Command, FlowNode, FnNode } from '../src/index.ts';
import { toPython } from '../src/code-python.ts';

const all = EXAMPLES.flatMap((g) => g.examples);
const example = (key: string) => all.find((e) => e.key === key)!.tree();

/** Compila vários módulos de uma vez; cada `// arquivo.ts` é um arquivo. */
function typeErrors(sources: Record<string, string>): string[] {
  const files = new Map<string, string>();
  for (const [name, code] of Object.entries(sources)) {
    const pieces = code.split(/^\/\/ ([\w$-]+\.ts)$/m);
    if (pieces.length === 1) files.set(`/${name}/main.ts`, `${code}\nexport {};\n`);
    else for (let i = 1; i < pieces.length; i += 2) files.set(`/${name}/${pieces[i]}`, `${pieces[i + 1]}\nexport {};\n`);
  }
  const options: ts.CompilerOptions = { strict: true, noEmit: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, types: [] };
  const host = ts.createCompilerHost(options);
  const { fileExists, readFile, getSourceFile } = host;
  host.fileExists = (f) => files.has(f) || fileExists(f);
  host.readFile = (f) => files.get(f) ?? readFile(f);
  host.getSourceFile = (f, version, ...rest) => (files.has(f) ? ts.createSourceFile(f, files.get(f)!, version) : getSourceFile(f, version, ...rest));
  host.directoryExists = undefined;
  const program = ts.createProgram([...files.keys()], options, host);
  return ts.getPreEmitDiagnostics(program).map((d) => `${d.file?.fileName}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`);
}

/** Roda um script em Python com os códigos na entrada. */
const python = (script: string, input: unknown) => execFileSync('python3', ['-I', '-c', script], { input: JSON.stringify(input), encoding: 'utf8' });
const COMPILE = `
import json, re, sys
for name, code in json.load(sys.stdin).items():
    # cada "# arquivo.py" é um módulo
    for part in re.split(r"(?m)^# [\\w$-]+\\.py$", code):
        try:
            compile(part, name, "exec")
        except SyntaxError as error:
            print(name, error, part, sep="\\n")
`;

describe('TypeScript', () => {
  it('todos os exemplos compilam no modo estrito', () => {
    expect(typeErrors(Object.fromEntries(all.map((e) => [e.key, generateCode(e.tree(), 'ts')])))).toEqual([]);
  }, 60_000);
  it('anota tipos de entrada, saída e dado', () => {
    const code = generateCode(example('todosDados'), 'ts');
    expect(code).toContain('const numero: number = 42;');
    expect(code).toContain('const pessoa: { nome: string; idade: number } =');
    expect(code).toContain('const lista: number[] = [1, 2, 3];');
  });
  it('declara o que vem de fora', () => expect(generateCode(example('responsavel'), 'ts')).toContain('declare const carrinho: any;'));
  it('os arquivos saem como .ts', () => expect(generateCode(example('fileOutro'), 'ts')).toContain('// pagamento.ts'));
});

describe('Python', () => {
  it('todos os exemplos compilam', () => {
    expect(python(COMPILE, Object.fromEntries(all.map((e) => [e.key, generateCode(e.tree(), 'py')])))).toBe('');
  });
  const runnable = ['main', 'sequencial', 'funcaoDado', 'se', 'seSenao', 'seAninhado', 'switchEx', 'repFor', 'repDoWhile', 'padSingleton', 'estadoCaixa'];
  it('os exemplos completos executam', () => {
    const run = `
import asyncio, json, sys
for name, code in json.load(sys.stdin).items():
    scope = {}
    try:
        exec(code, scope)
        asyncio.run(scope["main"]())
    except Exception as error:
        print(name, repr(error), code, sep="\\n")
`;
    expect(python(run, Object.fromEntries(runnable.map((k) => [k, generateCode(example(k), 'py')])))).toBe('');
  });
  it('paralelas, laços e seleção', () => {
    expect(generateCode(example('paralela'), 'py')).toContain('dobro, triplo = await asyncio.gather(');
    expect(generateCode(example('seAninhado'), 'py')).toContain('elif recuperacao:');
    expect(generateCode(example('repDoWhile'), 'py')).toContain('if not (pendente):');
    expect(generateCode(example('switchEx'), 'py')).toContain('elif meio == "cartao":');
    expect(generateCode(example('tryCatch'), 'py')).toContain('except Exception as error:');
  });
  it('bloco em paralelo altera o dado de fora', () => {
    const tree = fn('main', {
      data: [{ name: 'ok', type: 'boolean', value: 'true' }],
      out: [{ name: 'x', type: 'abstract' }],
      children: [fn('a'), block('if', { expr: 'ok', parallel: true, children: [fn('b', { out: [{ name: 'x', type: 'number', value: '5' }] })] })],
    });
    const code = generateCode(tree, 'py');
    expect(code).toContain('nonlocal x');
    expect(python(`import asyncio, json, sys\nscope = {}\nexec(json.load(sys.stdin), scope)\nprint(asyncio.run(scope["main"]()))`, code).trim()).toBe('5');
  });
  const translations: [string, string][] = [
    ['a && !b || c', 'a and not b or c'],
    ['!(a && b)', 'not (a and b)'],
    ['(a || b) && c', '(a or b) and c'],
    ['idade >= 18', 'idade >= 18'],
    ['pessoa.nome === "Ana"', 'pessoa["nome"] == "Ana"'],
    ['itens.length > 0', 'len(itens) > 0'],
    ['nome.includes("a")', '"a" in nome'],
    ['!nome.includes("a")', 'not "a" in nome'],
    ['a !== null', 'a != None'],
    ['(a === b) === c', '(a == b) == c'],
    ['ok ? 1 : 2', '1 if ok else 2'],
    ['a - (b - c)', 'a - (b - c)'],
    ['x ?? 0', 'x if x is not None else 0'],
  ];
  it.each(translations)('traduz %s', (from, to) => expect(toPython(from)).toBe(to));
  it('o que não tem tradução fica anotado', () => {
    const tree = fn('main', { children: [block('if', { expr: 'itens.some(x => x)', children: [fn('a')] })] });
    const code = generateCode(tree, 'py');
    expect(code).toContain('# a conferir: itens.some(x => x)');
    expect(python(COMPILE, { tree: code })).toBe('');
  });
});

describe('fluxos ao acaso', () => {
  it('geram sintaxe válida nas duas linguagens', () => {
    let seed = 11;
    const random = (n: number) => ((seed = (seed * 48271) % 2147483647), seed % n);
    const pick = <T>(list: readonly T[]) => list[random(list.length)]!;
    const python_: Record<string, string> = {};
    for (let round = 0; round < 80; round++) {
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
          () => ({ type: 'update', target, patch: pick([{ parallel: true }, { source: null }, { source: { kind: 'person' as const, name: 'Ana Maria' } }, { source: { kind: 'file' as const, name: 'outro' } }, { expr: 'x' }, { expr: 'a ===' }, { expr: 'default' }, { visibility: 'public' as const }, { pattern: 'factory' as const }]) }),
          () => ({ type: 'setData', target, side: pick(['in', 'out', 'data'] as const), list: pick([[], [{ name: 'a', type: 'number' as const, value: '1' }], [{ name: 'None', type: 'abstract' as const }, { name: 'b c', type: 'text' as const, value: 'x\ny' }]]) }),
        ])();
        try {
          tree = apply(tree, command).tree;
        } catch (error) {
          if (!(error instanceof EditError)) throw error;
        }
        if (nodes.length > 40) break;
      }
      python_[`rodada${round}`] = generateCode(tree, 'py');
      const output = ts.transpileModule(generateCode(tree, 'ts'), { reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2022 } });
      // várias seções de arquivo juntas repetem nomes: aqui vale só a sintaxe
      expect(output.diagnostics!.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n')), generateCode(tree, 'ts')).toEqual([]);
    }
    expect(python(COMPILE, python_)).toBe('');
  }, 60_000);
});

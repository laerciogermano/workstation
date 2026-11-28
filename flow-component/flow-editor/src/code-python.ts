// Fluxo → Python. Mesma leitura do JavaScript (code.ts), com o que a linguagem pede:
// definições antes das chamadas, objetos como dicionários e as condições traduzidas.
import { assignments, callees, external, identifier as jsIdentifier, steps } from './code.ts';
import { ExprError, parseExpr, type Expr } from './expr.ts';
import { isFn, walk } from './model.ts';
import type { BlockNode, Datum, FlowNode, FnNode } from './model.ts';

const RESERVED = new Set('False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case print len str int float bool list dict set asyncio'.split(' '));

export function pyIdentifier(name: string): string {
  const clean = jsIdentifier(name).replace(/\$/g, '_');
  // o que só é reservado em JavaScript volta ao nome original
  const original = clean.startsWith('_') && !name.trim().startsWith('_') && /^\p{L}/u.test(clean.slice(1)) ? clean.slice(1) : clean;
  return RESERVED.has(original) ? `${original}_` : original;
}

class Untranslatable extends Error {}

/** Quanto maior, mais forte a ligação em Python. */
const POWER: Record<string, number> = { or: 2, and: 3, '|': 6, '^': 7, '&': 8, '==': 5, '!=': 5, '<': 5, '>': 5, '<=': 5, '>=': 5, in: 5, '+': 9, '-': 9, '*': 10, '/': 10, '%': 10, '**': 12 };
const OPERATORS: Record<string, string> = { '||': 'or', '&&': 'and', '===': '==', '!==': '!=' };
const ATOM = 20;
const NOT = 4;

function emit(e: Expr): [string, number] {
  const at = (x: Expr, min: number) => {
    const [code, power] = emit(x);
    return power < min ? `(${code})` : code;
  };
  switch (e.t) {
    case 'number': return [e.raw, ATOM];
    case 'text': return [e.raw, ATOM];
    case 'constant': return [{ true: 'True', false: 'False', null: 'None', undefined: 'None' }[e.value], ATOM];
    case 'id': return [e.name === 'NaN' ? 'float("nan")' : e.name === 'Infinity' ? 'float("inf")' : pyIdentifier(e.name), ATOM];
    case 'member':
      if (e.name === 'length') return [`len(${at(e.object, 0)})`, ATOM];
      return [`${at(e.object, ATOM)}[${JSON.stringify(e.name)}]`, ATOM];
    case 'index': return [`${at(e.object, ATOM)}[${at(e.index, 0)}]`, ATOM];
    case 'call': {
      const args = e.args.map((a) => at(a, 0));
      if (e.callee.t === 'member') {
        const { object, name } = e.callee;
        if (name === 'includes' && args.length === 1) return [`${at(e.args[0]!, 6)} in ${at(object, 6)}`, 5];
        if (name === 'startsWith' && args.length === 1) return [`${at(object, ATOM)}.startswith(${args[0]})`, ATOM];
        if (name === 'endsWith' && args.length === 1) return [`${at(object, ATOM)}.endswith(${args[0]})`, ATOM];
        // outros métodos são de JavaScript: não há equivalente certo
        throw new Untranslatable();
      }
      if (e.callee.t === 'id') {
        const built = { Number: 'float', String: 'str', Boolean: 'bool', parseInt: 'int', parseFloat: 'float' }[e.callee.name];
        if (built) return [`${built}(${args.join(', ')})`, ATOM];
      }
      return [`${at(e.callee, ATOM)}(${args.join(', ')})`, ATOM];
    }
    case 'unary':
      if (e.op === '!') return [`not ${at(e.arg, NOT)}`, NOT];
      if (e.op === 'typeof') throw new Untranslatable();
      return [`${e.op}${at(e.arg, 11)}`, 11];
    case 'binary': {
      if (e.op === '??') {
        const left = at(e.left, 6);
        return [`${left} if ${left} is not None else ${at(e.right, 1)}`, 1];
      }
      if (e.op === 'instanceof') throw new Untranslatable();
      const op = OPERATORS[e.op] ?? e.op;
      const power = POWER[op]!;
      // comparações em Python se encadeiam: uma dentro da outra vai entre parênteses
      const left = power === 5 ? power + 1 : power;
      return [`${at(e.left, left)} ${op} ${at(e.right, power + 1)}`, power];
    }
    case 'cond': return [`${at(e.yes, 2)} if ${at(e.test, 2)} else ${at(e.no, 1)}`, 1];
    case 'array': return [`[${e.items.map((x) => at(x, 0)).join(', ')}]`, ATOM];
  }
}

/** A expressão em Python; `null` quando não há tradução segura. */
export function toPython(source: string): string | null {
  try {
    return emit(parseExpr(source))[0];
  } catch (error) {
    if (error instanceof ExprError || error instanceof Untranslatable) return null;
    throw error;
  }
}

function literal(d: Datum, known: ReadonlySet<string>): string | undefined {
  switch (d.type) {
    case 'abstract': return undefined;
    case 'null': return 'None';
    case 'text': return d.value === undefined ? undefined : JSON.stringify(d.value);
    case 'number': {
      if (!d.value?.trim()) return undefined;
      const n = Number(d.value);
      return Number.isNaN(n) ? 'float("nan")' : Number.isFinite(n) ? String(n) : `float("${n < 0 ? '-' : ''}inf")`;
    }
    case 'boolean': return d.value ? (d.value === 'true' ? 'True' : 'False') : undefined;
    case 'function': return pyIdentifier(d.value || d.name);
    case 'list': return `[${(d.fields ?? []).map((f) => literal(f, known) ?? 'None').join(', ')}]`;
    case 'object': return `{${(d.fields ?? []).map((f) => `${JSON.stringify(f.name)}: ${known.has(pyIdentifier(f.name)) ? pyIdentifier(f.name) : (literal(f, known) ?? 'None')}`).join(', ')}}`;
  }
}

const pad = (lines: string[]) => lines.map((l) => (l ? `    ${l}` : l));
const body = (lines: string[]) => pad(lines.some((l) => l.trim() && !l.trim().startsWith('#')) ? lines : [...lines, 'pass']);
const tuple = (list: Datum[]) => list.map((d) => pyIdentifier(d.name)).join(', ');
const moduleName = (file: string) => pyIdentifier(file.replace(/\.(py|[cm]?[jt]s)$/, ''));

interface Scope {
  names: Set<string>;
  file: string;
}

export function generatePython(root: FnNode): string {
  const rootFile = root.source?.kind === 'file' ? root.source.name : root.name;
  const files = new Map<string, Map<string, string[]>>();
  const imports = new Map<string, Map<string, Set<string>>>();
  let gathers = false;
  let branches = 0;

  const declare = (node: FnNode, outerFile: string): string[] => {
    const scope: Scope = { names: new Set(), file: node.source?.kind === 'file' ? node.source.name : outerFile };
    node.in.forEach((d) => scope.names.add(pyIdentifier(d.name)));
    const definitions: string[] = [];
    const lines: string[] = [];

    // definições antes das chamadas
    const done = new Set(node.in.map((d) => pyIdentifier(d.name)));
    const called = callees(node);
    const passed = called.flatMap((child) => child.in.filter((d) => d.type === 'function').flatMap((d) => callees(child).filter((f) => f.name === d.name)));
    for (const child of [...called, ...passed]) {
      const name = pyIdentifier(child.name);
      if (done.has(name) || external(child)) continue;
      done.add(name);
      if (child.source === null) {
        definitions.push(`# ${name}: camada abstrata, preenchida por quem chama`, '');
        continue;
      }
      if (child.source?.kind === 'file' && child.source.name !== scope.file) {
        const file = child.source.name;
        const here = imports.get(scope.file) ?? new Map<string, Set<string>>();
        imports.set(scope.file, here.set(file, (here.get(file) ?? new Set<string>()).add(name)));
        if (file !== rootFile) {
          const defs = files.get(file) ?? new Map<string, string[]>();
          files.set(file, defs);
          if (!defs.has(name)) {
            defs.set(name, []);
            defs.set(name, declare(child, file));
          }
          continue;
        }
      }
      definitions.push(...declare(child, scope.file), '');
    }

    // o que muda mais de uma vez, ou nasce dentro de um bloco, existe desde o começo
    const assigned = new Map([...assignments(node)].map(([name, use]) => [pyIdentifier(name), use]));
    const declared = new Map(node.data.map((d) => [pyIdentifier(d.name), d]));
    for (const [name, use] of assigned) {
      if (scope.names.has(name) || (!use.inBlock && use.times === 1)) continue;
      const d = declared.get(name);
      lines.push(`${name} = ${(d && literal(d, scope.names)) ?? 'None'}`);
      scope.names.add(name);
    }
    for (const d of node.data) {
      const name = pyIdentifier(d.name);
      if (scope.names.has(name)) continue;
      const value = literal(d, scope.names);
      lines.push(value === undefined ? `${name} = None  # dado abstrato` : `${name} = ${value}`);
      scope.names.add(name);
    }

    lines.push(...statements(node.children, scope));

    if (node.out.length) {
      for (const d of node.out) {
        const name = pyIdentifier(d.name);
        if (scope.names.has(name)) continue;
        const value = literal(d, scope.names);
        lines.push(value === undefined ? `${name} = None  # a definir` : `${name} = ${value}`);
        scope.names.add(name);
      }
      lines.push(`return ${tuple(node.out)}`);
    }

    const notes = [
      ...(node.pattern ? [`# padrão: ${node.pattern === 'factory' ? 'factory (cria e devolve o objeto)' : 'singleton (instância única e compartilhada)'}`] : []),
      // em Python, o privado é só convenção
      ...(node.visibility ? [`# ${node.visibility === 'public' ? 'pública' : 'privada'}`] : []),
    ];
    return [...notes, `async def ${pyIdentifier(node.name)}(${tuple(node.in)}):`, ...body([...definitions, ...lines])];
  };

  const call = (node: FnNode, scope: Scope): { expr: string; lines: string[] } => {
    const lines: string[] = [];
    for (const d of node.in) {
      const name = pyIdentifier(d.name);
      const value = literal(d, scope.names);
      if (scope.names.has(name) || value === undefined || (d.type === 'function' && value === name)) continue;
      lines.push(`${name} = ${value}`);
      scope.names.add(name);
    }
    const target = external(node) ? `${pyIdentifier(node.source.name)}.${pyIdentifier(node.name)}` : pyIdentifier(node.name);
    return { expr: `${target}(${tuple(node.in)})`, lines };
  };

  const statements = (list: FlowNode[], scope: Scope): string[] =>
    steps(list).flatMap((group) => (group.length === 1 ? single(group[0]!, scope) : parallel(group, scope)));

  const single = (unit: FlowNode[], scope: Scope): string[] => {
    const head = unit[0]!;
    if (!isFn(head)) return blockLines(head, unit[1] as BlockNode | undefined, scope);
    const { expr, lines } = call(head, scope);
    head.out.forEach((d) => scope.names.add(pyIdentifier(d.name)));
    return [...lines, head.out.length ? `${tuple(head.out)} = await ${expr}` : `await ${expr}`];
  };

  const parallel = (group: FlowNode[][], scope: Scope): string[] => {
    gathers = true;
    const before: string[] = [];
    const results: string[] = [];
    const calls: string[] = [];
    const outs: Datum[] = [];
    for (const unit of group) {
      const head = unit[0]!;
      if (isFn(head)) {
        const { expr, lines } = call(head, scope);
        before.push(...lines);
        calls.push(expr);
        results.push(head.out.length > 1 ? `(${tuple(head.out)})` : tuple(head.out));
        outs.push(...head.out);
      } else {
        // um bloco em paralelo vira uma função local; o que ele atribui é o de fora
        const name = `ramo_${++branches}`;
        const written = new Set<string>();
        const collect = (nodes: FlowNode[]) => nodes.forEach((n) => (isFn(n) ? n.out.forEach((d) => written.add(pyIdentifier(d.name))) : collect(n.children)));
        collect(unit);
        const shared = [...written].filter((n) => scope.names.has(n));
        before.push(`async def ${name}():`, ...body([...(shared.length ? [`nonlocal ${shared.join(', ')}`] : []), ...blockLines(head, unit[1] as BlockNode | undefined, { ...scope, names: new Set(scope.names) })]));
        calls.push(`${name}()`);
        results.push('');
      }
    }
    while (results.length && !results.at(-1)) results.pop();
    outs.forEach((d) => scope.names.add(pyIdentifier(d.name)));
    // os resultados vêm em lista: quem não devolve nada ocupa o lugar com `_`
    const targets = results.length ? [...results, ...Array<string>(calls.length - results.length).fill('')].map((r) => r || '_') : [];
    const open = `${targets.length ? `${targets.join(', ')} = ` : ''}await asyncio.gather(`;
    return [...before, open, ...pad(calls.map((c) => `${c},`)), ')'];
  };

  /** A condição pronta; sem tradução segura, fica `padrão` com o original anotado. */
  const condition = (source: string | undefined, empty: string): { code: string; note: string[] } => {
    const text = source?.trim();
    if (!text) return { code: empty, note: [] };
    const code = toPython(text);
    return code === null ? { code: empty, note: [`# a conferir: ${text.replace(/\s+/g, ' ')}`] } : { code, note: [] };
  };

  const caseValue = (value: string) => {
    if (value === 'true') return 'True';
    if (value === 'false') return 'False';
    if (value === 'null') return 'None';
    return /^(-?\d+(\.\d+)?|".*"|'.*')$/.test(value) ? value : JSON.stringify(value);
  };

  const blockLines = (node: BlockNode, tail: BlockNode | undefined, scope: Scope): string[] => {
    const copy = (): Scope => ({ ...scope, names: new Set(scope.names) });
    const inner = (n: BlockNode) => body(statements(n.children, copy()));
    switch (node.type) {
      case 'if': {
        const { code, note } = condition(node.expr, 'True');
        const lines = [...note, `if ${code}:`, ...inner(node)];
        if (!tail) return lines;
        const rest = statements(tail.children, copy());
        // um if sozinho no senão vira `elif`
        if (tail.children[0]?.type === 'if' && steps(tail.children).length === 1 && steps(tail.children)[0]!.length === 1 && rest[0]?.startsWith('if ')) return [...lines, `el${rest[0]}`, ...rest.slice(1)];
        return [...lines, 'else:', ...body(rest)];
      }
      case 'switch': {
        const { code, note } = condition(node.expr, 'None');
        const cases = node.children as BlockNode[];
        const valueOf = (c: BlockNode) => c.expr?.trim() || 'default';
        const lines: string[] = [...note];
        const others = cases.filter((c) => valueOf(c) !== 'default');
        others.forEach((c, i) => lines.push(`${i ? 'elif' : 'if'} ${code} == ${caseValue(valueOf(c))}:`, ...inner(c)));
        const fallback = cases.find((c) => valueOf(c) === 'default');
        if (fallback) {
          if (others.length) lines.push('else:', ...inner(fallback));
          else lines.push(...statements(fallback.children, copy()));
        }
        return lines;
      }
      case 'for': {
        const item = pyIdentifier(node.item || 'item');
        const { code, note } = condition(node.expr, '[]');
        return [...note, `for ${item} in ${code}:`, ...body(statements(node.children, { ...scope, names: new Set(scope.names).add(item) }))];
      }
      case 'while': {
        const { code, note } = condition(node.expr, 'True');
        return [...note, `while ${code}:`, ...inner(node)];
      }
      case 'do-while': {
        const { code, note } = condition(node.expr, 'True');
        return ['while True:', ...pad([...statements(node.children, copy()), ...note, `if not (${code}):`, '    break'])];
      }
      case 'try': return ['try:', ...inner(node), 'except Exception as error:', ...(tail ? inner(tail) : ['    raise'])];
      case 'else': return ['# else sem if', ...statements(node.children, copy())];
      case 'catch': return ['# catch sem try', ...statements(node.children, copy())];
      case 'case': return ['# case sem switch', ...statements(node.children, copy())];
    }
  };

  const main = declare(root, rootFile);
  const importLines = (file: string) => [...(imports.get(file) ?? [])].map(([from, names]) => `from ${moduleName(from)} import ${[...names].join(', ')}`);

  const objects = new Set<string>();
  walk(root, (n) => {
    if (isFn(n) && external(n)) objects.add(`${pyIdentifier(n.source.name)} (${n.source.kind})`);
  });
  const top = [...(objects.size ? [`# responsáveis de fora: ${[...objects].join(', ')}`] : []), ...(gathers ? ['import asyncio'] : []), ...importLines(rootFile)];

  const sections = [[...(files.size ? [`# ${moduleName(rootFile)}.py`] : []), ...top, ...(top.length ? ['', ''] : []), ...main]];
  for (const [file, defs] of files) {
    const own = [...defs.values()].flat();
    const head = [...(own.some((l) => l.includes('asyncio.gather(')) ? ['import asyncio'] : []), ...importLines(file)];
    sections.push(['', `# ${moduleName(file)}.py`, ...head, ...(head.length ? ['', ''] : []), ...[...defs.values()].flatMap((d, i) => (i ? ['', '', ...d] : d))]);
  }
  return `${sections.flat().join('\n')}\n`;
}

// Fluxo → JavaScript, no estilo dos exemplos do flow-oriented-programming.com:
// chamadas primeiro e definições depois, entrada e saída sempre em variável.
import { isFn, walk } from './model.ts';
import type { BlockNode, Datum, FlowNode, FnNode, Source } from './model.ts';
import { unitAt } from './ops.ts';

const RESERVED = new Set('await break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof let new null return super switch this throw true try typeof var void while with yield static'.split(' '));

export function identifier(name: string): string {
  const clean = name.trim().replace(/[^\p{L}\p{N}_$]+/gu, '_').replace(/^_+|_+$/g, '') || '_';
  return /^\p{N}/u.test(clean) || RESERVED.has(clean) ? `_${clean}` : clean;
}

const key = (name: string) => (/^[\p{L}_$][\p{L}\p{N}_$]*$/u.test(name) ? name : JSON.stringify(name));

/** O dado escrito em JavaScript. Um campo que já é variável entra pelo nome: `{ dobro, triplo }`. */
export function literal(d: Datum, known: ReadonlySet<string> = new Set()): string | undefined {
  switch (d.type) {
    case 'abstract': return undefined;
    case 'null': return 'null';
    case 'text': return d.value === undefined ? undefined : JSON.stringify(d.value);
    case 'number': return d.value?.trim() ? String(Number(d.value)) : undefined;
    case 'boolean': return d.value ? String(d.value === 'true') : undefined;
    case 'function': return identifier(d.value || d.name);
    case 'list': return `[${(d.fields ?? []).map((f) => literal(f, known) ?? 'undefined').join(', ')}]`;
    case 'object': {
      const fields = (d.fields ?? []).map((f) => (known.has(f.name) && identifier(f.name) === f.name ? f.name : `${key(f.name)}: ${literal(f, known) ?? 'undefined'}`));
      return fields.length ? `{ ${fields.join(', ')} }` : '{}';
    }
  }
}

const pad = (lines: string[]) => lines.map((l) => (l ? `  ${l}` : l));

/** Várias entradas (ou saídas) formam um objeto. */
const pattern = (list: Datum[]) => (list.length > 1 ? `{ ${list.map((d) => identifier(d.name)).join(', ')} }` : list.length ? identifier(list[0]!.name) : '');

interface Scope {
  /** Nomes já declarados nesta função. */
  names: Set<string>;
  /** Arquivo em que o código está. */
  file: string;
}

/** Onde cada nome recebe valor dentro de uma função (sem entrar nas filhas dela). */
function assignments(owner: FnNode): Map<string, { times: number; inBlock: boolean }> {
  const result = new Map<string, { times: number; inBlock: boolean }>();
  const add = (name: string, inBlock: boolean) => {
    const entry = result.get(name) ?? { times: 0, inBlock: false };
    entry.times++;
    entry.inBlock ||= inBlock;
    result.set(name, entry);
  };
  const visit = (list: FlowNode[], inBlock: boolean) => {
    for (const node of list) {
      if (isFn(node)) node.out.forEach((d) => add(identifier(d.name), inBlock));
      else visit(node.children, true);
    }
  };
  owner.data.forEach((d) => add(identifier(d.name), false));
  visit(owner.children, false);
  return result;
}

/** Funções chamadas direto por esta (através dos blocos). */
function callees(owner: FnNode): FnNode[] {
  const result: FnNode[] = [];
  const visit = (list: FlowNode[]) => list.forEach((n) => (isFn(n) ? result.push(n) : visit(n.children)));
  visit(owner.children);
  return result;
}

/** Executada fora do código: folha com responsável que não é arquivo. Com filhas, é composição e é definida aqui. */
const external = (node: FnNode): node is FnNode & { source: Source } => !!node.source && node.source.kind !== 'file' && !node.children.length;

export function generateCode(root: FnNode): string {
  const rootFile = root.source?.kind === 'file' ? root.source.name : root.name;
  /** funções que moram em outro arquivo, por arquivo */
  const files = new Map<string, Map<string, string[]>>();
  const imports = new Map<string, Map<string, Set<string>>>();

  const declare = (node: FnNode, outerFile: string, exported: boolean): string[] => {
    // cada função declara os próprios nomes: nada vem das variáveis de cima
    const scope: Scope = { names: new Set(), file: node.source?.kind === 'file' ? node.source.name : outerFile };
    node.in.forEach((d) => scope.names.add(identifier(d.name)));
    const assigned = assignments(node);
    const body: string[] = [];

    // o que muda mais de uma vez, ou nasce dentro de um bloco, é declarado no topo com `let`
    const declared = new Map(node.data.map((d) => [identifier(d.name), d]));
    for (const [name, use] of assigned) {
      if (scope.names.has(name) || (!use.inBlock && use.times === 1)) continue;
      const value = declared.has(name) ? literal(declared.get(name)!, scope.names) : undefined;
      body.push(value === undefined ? `let ${name};` : `let ${name} = ${value};`);
      scope.names.add(name);
    }
    for (const d of node.data) {
      const name = identifier(d.name);
      if (scope.names.has(name)) continue;
      const value = literal(d, scope.names);
      body.push(value === undefined ? `let ${name}; // dado abstrato` : `const ${name} = ${value};`);
      scope.names.add(name);
    }

    body.push(...statements(node.children, scope));

    if (node.out.length) {
      for (const d of node.out) {
        const name = identifier(d.name);
        if (scope.names.has(name)) continue;
        const value = literal(d, scope.names);
        body.push(value === undefined ? `const ${name} = undefined; // a definir` : `const ${name} = ${value};`);
        scope.names.add(name);
      }
      body.push(`return ${pattern(node.out)};`);
    }

    // definições depois das chamadas
    // uma função recebida como entrada não é definida aqui; uma passada adiante como dado é definida onde é passada
    const done = new Set(node.in.map((d) => identifier(d.name)));
    const called = callees(node);
    const passed = called.flatMap((child) => child.in.filter((d) => d.type === 'function').flatMap((d) => callees(child).filter((f) => f.name === d.name)));
    for (const child of [...called, ...passed]) {
      const name = identifier(child.name);
      if (done.has(name) || external(child)) continue;
      done.add(name);
      if (child.source === null) {
        if (!scope.names.has(name)) body.push('', `// ${name}: camada abstrata, preenchida por quem chama`);
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
            defs.set(name, declare(child, file, true));
          }
          continue;
        }
      }
      body.push('', ...declare(child, scope.file, false));
    }

    const header = `${exported || node.visibility === 'public' ? 'export ' : ''}async function ${identifier(node.name)}(${pattern(node.in)}) {`;
    return [header, ...pad(body), '}'];
  };

  const call = (node: FnNode, scope: Scope): { expr: string; lines: string[] } => {
    const lines: string[] = [];
    // um valor que só aparece na entrada precisa existir antes da chamada
    for (const d of node.in) {
      const name = identifier(d.name);
      const value = literal(d, scope.names);
      if (scope.names.has(name) || value === undefined || (d.type === 'function' && value === name)) continue;
      lines.push(`const ${name} = ${value};`);
      scope.names.add(name);
    }
    const target = external(node) ? `${identifier(node.source.name)}.${identifier(node.name)}` : identifier(node.name);
    return { expr: `${target}(${pattern(node.in)})`, lines };
  };

  /** `const x = …` na primeira vez; atribuição quando o nome já existe. */
  const assign = (out: Datum[], expr: string, scope: Scope): string => {
    if (!out.length) return `${expr};`;
    const fresh = out.filter((d) => !scope.names.has(identifier(d.name)));
    fresh.forEach((d) => scope.names.add(identifier(d.name)));
    const target = pattern(out);
    if (fresh.length === out.length) return `const ${target} = ${expr};`;
    const lines = fresh.map((d) => `let ${identifier(d.name)};\n`).join('');
    return `${lines}${out.length > 1 ? `(${target} = ${expr});` : `${target} = ${expr};`}`;
  };

  const statements = (list: FlowNode[], scope: Scope): string[] => {
    // grupos: cada unidade, com as paralelas juntas
    const groups: FlowNode[][][] = [];
    for (let i = 0; i < list.length; ) {
      const { from, to } = unitAt(list, i);
      const unit = list.slice(from, to);
      if (unit[0]!.parallel && groups.length) groups.at(-1)!.push(unit);
      else groups.push([unit]);
      i = to;
    }
    return groups.flatMap((group) => (group.length === 1 ? single(group[0]!, scope) : parallel(group, scope)));
  };

  const single = (unit: FlowNode[], scope: Scope): string[] => {
    const head = unit[0]!;
    if (isFn(head)) {
      const { expr, lines } = call(head, scope);
      return [...lines, ...assign(head.out, `await ${expr}`, scope).split('\n')];
    }
    return blockLines(head, unit[1] as BlockNode | undefined, scope);
  };

  const parallel = (group: FlowNode[][], scope: Scope): string[] => {
    const before: string[] = [];
    const results: string[] = [];
    const calls: string[][] = [];
    const outs: Datum[] = [];
    for (const unit of group) {
      const head = unit[0]!;
      if (isFn(head)) {
        const { expr, lines } = call(head, scope);
        before.push(...lines);
        calls.push([expr]);
        results.push(pattern(head.out));
        outs.push(...head.out);
      } else {
        calls.push(['(async () => {', ...pad(blockLines(head, unit[1] as BlockNode | undefined, { ...scope, names: new Set(scope.names) })), '})()']);
        results.push('');
      }
    }
    while (results.length && !results.at(-1)) results.pop();
    const all = calls.flatMap((c) => c.map((l, i) => (i === c.length - 1 ? `${l},` : l)));
    let open = 'await Promise.all([';
    if (results.length) {
      const fresh = outs.filter((d) => !scope.names.has(identifier(d.name)));
      fresh.forEach((d) => scope.names.add(identifier(d.name)));
      if (fresh.length === outs.length) open = `const [${results.join(', ')}] = ${open}`;
      else {
        before.push(...fresh.map((d) => `let ${identifier(d.name)};`));
        // o `;` protege contra a linha anterior sem ponto e vírgula
        open = `;[${results.join(', ')}] = ${open}`;
      }
    }
    return [...before, open, ...pad(all), ']);'];
  };

  const caseValue = (value: string) => (/^(-?\d+(\.\d+)?|true|false|null|".*"|'.*')$/.test(value) ? value : JSON.stringify(value));

  const blockLines = (node: BlockNode, tail: BlockNode | undefined, scope: Scope): string[] => {
    const inner = (n: BlockNode) => pad(statements(n.children, { ...scope, names: new Set(scope.names) }));
    const expr = node.expr?.trim() || 'true';
    switch (node.type) {
      case 'if': {
        const lines = [`if (${expr}) {`, ...inner(node)];
        if (!tail) return [...lines, '}'];
        const rest = statements(tail.children, { ...scope, names: new Set(scope.names) });
        // um if sozinho no senão vira `else if`
        if (tail.children[0]?.type === 'if' && unitAt(tail.children, 0).to === tail.children.length && rest[0]?.startsWith('if (')) return [...lines, `} else ${rest[0]}`, ...rest.slice(1)];
        return [...lines, '} else {', ...pad(rest), '}'];
      }
      case 'else': return ['{ // else sem if', ...inner(node), '}'];
      case 'switch': return [
        `switch (${expr}) {`,
        ...pad(node.children.flatMap((c) => {
          const value = (c as BlockNode).expr?.trim() || 'default';
          return [value === 'default' ? 'default: {' : `case ${caseValue(value)}: {`, ...inner(c as BlockNode), '  break;', '}'];
        })),
        '}',
      ];
      case 'case': return ['{', ...inner(node), '}'];
      case 'for': return [`for (const ${identifier(node.item || 'item')} of ${node.expr?.trim() || '[]'}) {`, ...pad(statements(node.children, { ...scope, names: new Set(scope.names).add(identifier(node.item || 'item')) })), '}'];
      case 'while': return [`while (${expr}) {`, ...inner(node), '}'];
      case 'do-while': return ['do {', ...inner(node), `} while (${expr});`];
      case 'try': return ['try {', ...inner(node), '} catch (error) {', ...(tail ? inner(tail) : ['  throw error;']), '}'];
      case 'catch': return ['{ // catch sem try', ...inner(node), '}'];
    }
  };

  const main = declare(root, rootFile, root.visibility === 'public');
  const importLines = (file: string) => [...(imports.get(file) ?? [])].map(([from, names]) => `import { ${[...names].join(', ')} } from ${JSON.stringify(`./${from.replace(/\.[cm]?[jt]s$/, '')}`)};`);
  const fileName = (name: string) => (/\.\w+$/.test(name) ? name : `${name}.js`);

  // o cabeçalho diz quem executa de fora do código
  const objects = new Set<string>();
  walk(root, (n) => {
    if (isFn(n) && external(n)) objects.add(`${identifier(n.source.name)} (${n.source.kind})`);
  });
  const header = objects.size ? [`// responsáveis de fora: ${[...objects].join(', ')}`] : [];

  const sections = [[...header, ...importLines(rootFile), ...(header.length || imports.has(rootFile) ? [''] : []), ...main]];
  for (const [file, defs] of files) sections.push(['', `// ${fileName(file)}`, ...importLines(file), ...[...defs.values()].flatMap((d, i) => (i ? ['', ...d] : d))]);
  if (files.size) sections[0]!.unshift(`// ${fileName(rootFile)}`);
  return `${sections.flat().join('\n')}\n`;
}

// Os comandos de edição. Puro: recebe uma árvore, devolve outra; nunca altera a que recebeu.
// Garante o que o Flow exige: `else` logo depois do `if`, `catch` depois do `try`, `case` só dentro de `switch`.
import { block, find, fn, freeName, isFn, names, newId, walk } from './model.ts';
import type { BlockNode, BlockType, DataSide, Datum, FlowNode, FnNode, Source } from './model.ts';

export type InsertKind = 'fn' | 'if' | 'ifelse' | 'switch' | 'for' | 'while' | 'do-while' | 'try';
export type WrapKind = 'fn' | 'if' | 'switch' | 'for' | 'while' | 'do-while' | 'try';
export type Where = 'inside' | 'before' | 'after' | 'parallel';

export interface Patch {
  name?: string;
  expr?: string;
  item?: string;
  /** `'inherit'` volta ao arquivo de cima. */
  source?: Source | null | 'inherit';
  parallel?: boolean;
  visibility?: 'public' | 'private' | null;
}

export type Command =
  | { type: 'insert'; target: string; where: Where; kind: InsertKind }
  | { type: 'else' | 'elseIf' | 'case' | 'catch'; target: string }
  | { type: 'update'; target: string; patch: Patch }
  | { type: 'setData'; target: string; side: DataSide; list: Datum[] }
  | { type: 'remove' | 'unwrap' | 'duplicate'; target: string }
  | { type: 'move'; target: string; direction: 'up' | 'down' | 'in' | 'out' }
  | { type: 'wrap'; target: string; kind: WrapKind };

export interface Applied {
  tree: FnNode;
  /** O que passa a estar selecionado. */
  selected: string;
}

export class EditError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EditError';
  }
}

const fail = (message: string): never => {
  throw new EditError(message);
};

/** Quem só existe ao lado de outro: o `else` do `if`, o `catch` do `try`. */
const follows = (node: FlowNode | undefined, head: FlowNode | undefined) =>
  (node?.type === 'else' && head?.type === 'if') || (node?.type === 'catch' && head?.type === 'try');

/** A unidade que anda junta: `if` + `else`, `try` + `catch`. */
export function unitAt(list: readonly FlowNode[], index: number): { from: number; to: number } {
  let from = index;
  if (from > 0 && follows(list[from], list[from - 1])) from--;
  const to = follows(list[from + 1], list[from]) ? from + 2 : from + 1;
  return { from, to };
}

function units(list: readonly FlowNode[]): FlowNode[][] {
  const result: FlowNode[][] = [];
  for (let i = 0; i < list.length; ) {
    const { to } = unitAt(list, i);
    result.push(list.slice(i, to));
    i = to;
  }
  return result;
}

function createBlock(kind: BlockType): BlockNode {
  const defaults: Partial<Record<BlockType, Partial<BlockNode>>> = {
    if: { expr: 'condicao' },
    switch: { expr: 'opcao' },
    case: { expr: 'valor' },
    for: { item: 'item', expr: 'itens' },
    while: { expr: 'pendente' },
    'do-while': { expr: 'pendente' },
  };
  const node = block(kind, defaults[kind]);
  if (kind === 'switch') node.children = [block('case', { expr: 'a' }), block('case', { expr: 'b' })];
  return node;
}

function create(kind: InsertKind, tree: FlowNode): FlowNode[] {
  if (kind === 'fn') return [fn(freeName('funcao', names(tree).functions))];
  if (kind === 'ifelse') return [createBlock('if'), createBlock('else')];
  if (kind === 'try') return [createBlock('try'), createBlock('catch')];
  return [createBlock(kind)];
}

/** Cópia com identidades novas. */
export function clone<T extends FlowNode>(node: T): T {
  const copy = structuredClone(node);
  walk(copy, (n) => (n.id = newId()));
  return copy;
}

/** Paralelo só existe entre irmãs: a primeira, o `else`, o `catch` e os `case` não levam a marca. */
function normalize(root: FlowNode): void {
  walk(root, (node) => {
    node.children.forEach((child, i) => {
      if (i === 0 || child.type === 'else' || child.type === 'catch' || child.type === 'case') delete child.parallel;
    });
  });
}

export function apply(source: FnNode, command: Command): Applied {
  const tree = structuredClone(source);
  const found = find(tree, command.target) ?? fail('O item selecionado não existe mais.');
  const { node, parent } = found;
  const siblings = parent?.children ?? [];
  let selected = node.id;
  const needParent = (what: string): FlowNode => parent ?? fail(`A função raiz não pode ${what}.`);

  switch (command.type) {
    case 'insert': {
      const { where, kind } = command;
      if (where === 'inside') {
        if (node.type === 'switch') fail('Dentro do switch só entram cases: use “+ case”.');
        const added = create(kind, tree);
        node.children.push(...added);
        selected = added[0]!.id;
        break;
      }
      const holder = needParent('ter irmãs');
      if (holder.type === 'switch') fail('Entre os cases só entram cases: use “+ case”, ou insira dentro de um case.');
      let { from, to } = unitAt(siblings, found.index);
      // “antes” e “depois” são o passo anterior e o seguinte: valem para o grupo de paralelas inteiro
      if (where !== 'parallel') {
        while (siblings[from]!.parallel && from > 0) from = unitAt(siblings, from - 1).from;
        while (siblings[to]?.parallel) to = unitAt(siblings, to).to;
      }
      const added = create(kind, tree);
      if (where === 'parallel') added[0]!.parallel = true;
      siblings.splice(where === 'before' ? from : to, 0, ...added);
      selected = added[0]!.id;
      break;
    }

    case 'else':
    case 'elseIf': {
      if (node.type !== 'if' && node.type !== 'else') fail('“else” só se liga a um if.');
      const holder = needParent('ter else');
      const at = node.type === 'else' ? found.index - 1 : found.index;
      let other = follows(holder.children[at + 1], holder.children[at]) ? (holder.children[at + 1] as BlockNode) : null;
      if (command.type === 'else') {
        if (other) fail('Este if já tem else.');
        other = block('else');
        holder.children.splice(at + 1, 0, other);
        selected = other.id;
        break;
      }
      if (!other) {
        other = block('else');
        holder.children.splice(at + 1, 0, other);
      }
      // desce até o fim da cadeia “else if”
      while (other.children.at(-1)?.type === 'else') other = other.children.at(-1) as BlockNode;
      const chained = block('if', { expr: freeName('outraCondicao', names(tree).data.map((d) => d.name)) });
      // o que já estava no senão continua sendo o último caminho
      if (other.children.at(-1)?.type === 'if') other.children.push(block('else', { children: [chained] }));
      else other.children = other.children.length ? [chained, block('else', { children: other.children })] : [chained];
      selected = chained.id;
      break;
    }

    case 'case': {
      const target = node.type === 'switch' ? node : node.type === 'case' && parent?.type === 'switch' ? parent : fail('“case” só entra em um switch.');
      const added = block('case', { expr: freeName('valor', target.children.map((c) => (c as BlockNode).expr ?? '')) });
      target.children.splice(node.type === 'case' ? found.index + 1 : target.children.length, 0, added);
      selected = added.id;
      break;
    }

    case 'catch': {
      if (node.type !== 'try') fail('“catch” só se liga a um try.');
      const holder = needParent('ter catch');
      if (follows(holder.children[found.index + 1], node)) fail('Este try já tem catch.');
      const added = block('catch');
      holder.children.splice(found.index + 1, 0, added);
      selected = added.id;
      break;
    }

    case 'update': {
      const { patch } = command;
      if (isFn(node)) {
        if (patch.name !== undefined) {
          const name = patch.name.trim() || fail('A função precisa de um nome.');
          node.name = name;
        }
        if (patch.source === 'inherit') delete node.source;
        else if (patch.source !== undefined) {
          if (patch.source && !patch.source.name.trim()) fail('O responsável precisa de um nome.');
          node.source = patch.source && { kind: patch.source.kind, name: patch.source.name.trim() };
        }
        if (patch.visibility === null) delete node.visibility;
        else if (patch.visibility) node.visibility = patch.visibility;
      } else {
        if (patch.expr !== undefined) node.expr = patch.expr.trim();
        if (patch.item !== undefined) node.item = patch.item.trim();
      }
      if (patch.parallel !== undefined) {
        if (patch.parallel) {
          if (!parent || found.index === 0 || parent.type === 'switch' || node.type === 'else' || node.type === 'catch') fail('Só uma irmã que vem depois de outra pode ser paralela.');
          node.parallel = true;
        } else delete node.parallel;
      }
      break;
    }

    case 'setData': {
      if (!isFn(node)) fail('Só funções têm dados.');
      (node as FnNode)[command.side] = structuredClone(checkData(command.list));
      break;
    }

    case 'remove': {
      const holder = needParent('ser removida');
      const own = unitAt(siblings, found.index);
      // tirar o else (ou o catch) não leva o if junto
      const from = node.type === 'else' || node.type === 'catch' ? found.index : own.from;
      const to = node.type === 'else' || node.type === 'catch' ? found.index + 1 : own.to;
      if (siblings[from]!.parallel === undefined && siblings[to]?.parallel) delete siblings[to]!.parallel;
      siblings.splice(from, to - from);
      selected = (siblings[Math.min(from, siblings.length - 1)] ?? holder).id;
      break;
    }

    case 'duplicate': {
      needParent('ser duplicada');
      if (node.type === 'else' || node.type === 'catch') fail('Duplique o bloco inteiro, pelo if ou pelo try.');
      const { from, to } = unitAt(siblings, found.index);
      const copies = siblings.slice(from, to).map(clone);
      const first = copies[0]!;
      if (isFn(first)) first.name = freeName(first.name, names(tree).functions);
      siblings.splice(to, 0, ...copies);
      selected = first.id;
      break;
    }

    case 'move': {
      const holder = needParent('mudar de lugar');
      if (node.type === 'else' || node.type === 'catch') fail('O else e o catch andam junto com o if e o try.');
      if (node.type === 'case' && (command.direction === 'in' || command.direction === 'out')) fail('Um case não sai do switch.');
      const groups = units(siblings);
      const at = groups.findIndex((g) => g[0]!.id === node.id);
      const group = groups[at]!;
      const rebuild = () => holder.children.splice(0, holder.children.length, ...groups.flat());
      if (command.direction === 'up' || command.direction === 'down') {
        const to = at + (command.direction === 'up' ? -1 : 1);
        if (to < 0 || to >= groups.length) fail(command.direction === 'up' ? 'Já é a primeira.' : 'Já é a última.');
        // a marca de paralelo é do lugar, não do item
        const marks = groups.map((g) => g[0]!.parallel);
        [groups[at], groups[to]] = [groups[to]!, groups[at]!];
        groups.forEach((g, i) => (marks[i] ? (g[0]!.parallel = true) : delete g[0]!.parallel));
        rebuild();
      } else if (command.direction === 'in') {
        const before = groups[at - 1] ?? fail('Para entrar é preciso ter uma irmã antes.');
        const into = before.at(-1)!;
        if (into.type === 'switch') fail('Dentro do switch só entram cases.');
        groups.splice(at, 1);
        rebuild();
        delete group[0]!.parallel;
        into.children.push(...group);
      } else {
        // de dentro de um case sai do switch inteiro
        const skip = found.path.at(-3)?.type === 'switch' ? 1 : 0;
        const above = found.path.at(-3 - skip) ?? fail('Já está no primeiro nível.');
        const leaving = found.path.at(-2 - skip)!;
        groups.splice(at, 1);
        rebuild();
        delete group[0]!.parallel;
        const index = above.children.findIndex((c) => c.id === leaving.id);
        above.children.splice(unitAt(above.children, index).to, 0, ...group);
      }
      break;
    }

    case 'wrap': {
      needParent('ser envolvida');
      if (node.type === 'else' || node.type === 'catch' || node.type === 'case') fail('Este item não pode ser envolvido sozinho.');
      const { from, to } = unitAt(siblings, found.index);
      const inside = siblings.slice(from, to);
      const outer = create(command.kind, tree);
      const head = outer[0]!;
      if (inside[0]!.parallel) head.parallel = true;
      delete inside[0]!.parallel;
      if (head.type === 'switch') head.children[0]!.children = inside;
      else head.children = inside;
      siblings.splice(from, to - from, ...outer);
      selected = head.id;
      break;
    }

    case 'unwrap': {
      needParent('ser desfeita');
      if (!node.children.length && isFn(node)) fail('Esta função não tem filhas.');
      if (node.type === 'case') fail('Desfaça o switch inteiro.');
      const whole = node.type === 'else' || node.type === 'catch' ? { from: found.index, to: found.index + 1 } : unitAt(siblings, found.index);
      const inside = siblings.slice(whole.from, whole.to).flatMap((n) => (n.type === 'switch' ? n.children.flatMap((c) => c.children) : n.children));
      siblings.splice(whole.from, whole.to - whole.from, ...inside);
      selected = (inside[0] ?? siblings[Math.min(whole.from, siblings.length - 1)] ?? parent!).id;
      break;
    }
  }

  normalize(tree);
  return { tree, selected };
}

const MAX_FIELD_DEPTH = 6;

export function checkData(list: Datum[], depth = 0): Datum[] {
  if (depth > MAX_FIELD_DEPTH) fail('Objeto fundo demais.');
  const seen = new Set<string>();
  return list.map((d) => {
    const name = d.name.trim();
    if (!name) fail('O dado precisa de um nome.');
    if (seen.has(name)) fail(`Já existe um dado “${name}” aqui: no mesmo contexto os endereços não se repetem.`);
    seen.add(name);
    const clean: Datum = { name, type: d.type };
    if (d.type === 'object' || d.type === 'list') clean.fields = checkData(d.fields ?? [], depth + 1);
    else if (d.type !== 'abstract' && d.type !== 'null' && d.value !== undefined) {
      if (d.type === 'number' && d.value.trim() !== '' && !Number.isFinite(Number(d.value))) fail(`“${d.value}” não é um número.`);
      clean.value = d.value;
    }
    return clean;
  });
}

/** Diz se o comando é possível, sem aplicar. */
export function check(tree: FnNode, command: Command): string | null {
  try {
    apply(tree, command);
    return null;
  } catch (error) {
    if (error instanceof EditError) return error.message;
    throw error;
  }
}

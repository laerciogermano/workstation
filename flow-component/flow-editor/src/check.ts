// Conferência do fluxo: expressões dos blocos (sintaxe, nomes no estado, tipos) e uso dos padrões.
// Não bloqueia a edição: só aponta, com o nó de cada problema.
import { ExprError, parseExpr, parts, type Expr } from './expr.ts';
import { hasFields, isFn, walk } from './model.ts';
import type { BlockNode, Datum, FlowNode, FnNode } from './model.ts';

export type Level = 'error' | 'warning' | 'tip';

export interface Problem {
  /** O nó em que está. */
  id: string;
  level: Level;
  message: string;
}

/** Nomes que a linguagem já oferece. */
const GLOBALS = new Set(['Array', 'Boolean', 'Date', 'Infinity', 'JSON', 'Math', 'NaN', 'Number', 'Object', 'String', 'RegExp', 'Set', 'Map', 'isNaN', 'isFinite', 'parseInt', 'parseFloat', 'console']);
/** O que existe num ponto do fluxo: o nome e, quando se sabe, o dado. */
type Scope = Map<string, Datum>;

const ITEM = /^[\p{L}_$][\p{L}\p{N}_$]*$/u;

/** Funções filhas de uma função, através dos blocos. */
function childFunctions(list: FlowNode[]): FnNode[] {
  return list.flatMap((n) => (isFn(n) ? [n] : childFunctions(n.children)));
}

/** O que os passos de um trecho produzem (sem entrar nas funções). */
const produced = (list: FlowNode[]): Datum[] => list.flatMap((n) => (isFn(n) ? n.out : produced(n.children)));

/** Um dado abstrato não apaga o que já se sabe sobre o nome. */
function learn(scope: Scope, d: Datum) {
  const known = scope.get(d.name);
  if (!known || d.type !== 'abstract') scope.set(d.name, d);
}

export function diagnose(root: FnNode): Problem[] {
  const problems: Problem[] = [];
  const report = (node: FlowNode, level: Level, message: string) => problems.push({ id: node.id, level, message });

  const references = (node: BlockNode, e: Expr, scope: Scope) => {
    const unknown = new Set<string>();
    const visit = (x: Expr) => {
      if (x.t === 'id' && !scope.has(x.name) && !GLOBALS.has(x.name)) unknown.add(x.name);
      if (x.t === 'member' && x.object.t === 'id') {
        const d = scope.get(x.object.name);
        if (d?.type === 'object' && d.fields?.length && !d.fields.some((f) => f.name === x.name)) report(node, 'warning', `"${d.name}" não tem o campo "${x.name}".`);
      }
      parts(x).forEach(visit);
    };
    visit(e);
    for (const name of unknown) report(node, 'warning', `"${name}" não está no estado neste ponto.`);
  };

  const expression = (node: BlockNode, scope: Scope) => {
    const source = node.expr?.trim() ?? '';
    const collection = node.type === 'for';
    if (!source) return report(node, 'warning', collection ? 'Sem coleção: o laço não repete.' : node.type === 'switch' ? 'Sem dado para avaliar.' : 'Sem condição: o código usa "true".');
    let tree: Expr;
    try {
      tree = parseExpr(source);
    } catch (error) {
      if (!(error instanceof ExprError)) throw error;
      return report(node, error.unsupported ? 'tip' : 'error', error.unsupported ? error.message : `${error.message} (posição ${error.at + 1})`);
    }
    references(node, tree, scope);
    const d = tree.t === 'id' ? scope.get(tree.name) : undefined;
    if (d && collection && (d.type === 'number' || d.type === 'boolean' || d.type === 'null')) report(node, 'warning', `"${d.name}" não é uma coleção.`);
    if (d && !collection && node.type !== 'switch') {
      if (hasFields(d.type) || d.type === 'function') report(node, 'warning', `"${d.name}" é ${d.type === 'function' ? 'uma função' : 'um objeto'}: a condição é sempre verdadeira.`);
      if (d.type === 'null') report(node, 'warning', `"${d.name}" é nulo: a condição é sempre falsa.`);
    }
    const simple = tree.t === 'id' || tree.t === 'constant' || (tree.t === 'unary' && tree.op === '!' && tree.arg.t === 'id');
    if (!simple) report(node, 'tip', 'No FOP, atribua a expressão a uma variável antes do bloco.');
  };

  const cases = (node: BlockNode) => {
    const seen = new Set<string>();
    for (const child of node.children as BlockNode[]) {
      const value = child.expr?.trim() ?? '';
      const key = value.replace(/^(["'])(.*)\1$/, '$2');
      if (!value) report(child, 'warning', 'Case sem valor: vira "default".');
      if (seen.has(key || 'default')) report(child, 'error', `Case repetido: "${key || 'default'}".`);
      seen.add(key || 'default');
    }
  };

  /** Confere uma lista de irmãs; `scope` termina com tudo o que elas produzem. */
  const statements = (list: FlowNode[], scope: Scope) => {
    // quem é paralela não enxerga o que as do mesmo passo produzem
    let before: Scope = new Map(scope);
    for (const node of list) {
      if (!node.parallel && node.type !== 'else') before = new Map(scope);
      if (isFn(node)) {
        node.out.forEach((d) => learn(scope, d));
        continue;
      }
      const local: Scope = new Map(before);
      if (node.type === 'for') {
        const item = node.item?.trim() ?? '';
        if (!ITEM.test(item)) report(node, 'error', item ? `"${item}" não serve de nome para o item.` : 'O laço precisa de um nome para o item.');
        expression(node, before);
        if (item) local.set(item, { name: item, type: 'abstract' });
      } else if (node.type === 'if' || node.type === 'while' || node.type === 'switch') expression(node, before);
      if (node.type === 'switch') cases(node);
      statements(node.children, local);
      // a condição do do-while é lida depois do corpo
      if (node.type === 'do-while') expression(node, local);
      produced(node.children).forEach((d) => learn(scope, d));
    }
  };

  walk(root, (node) => {
    if (!isFn(node)) return;
    const scope: Scope = new Map();
    for (const f of childFunctions(node.children)) scope.set(f.name, { name: f.name, type: 'function' });
    scope.set(node.name, { name: node.name, type: 'function' });
    [...node.in, ...node.data].forEach((d) => learn(scope, d));
    statements(node.children, scope);

    if (node.pattern) {
      const out = node.out;
      if (!out.length) report(node, 'warning', node.pattern === 'factory' ? 'Uma factory devolve o objeto que cria: adicione a saída.' : 'Um singleton entrega a instância única: adicione a saída.');
      else if (node.pattern === 'factory' && out.length === 1 && !hasFields(out[0]!.type) && out[0]!.type !== 'abstract') report(node, 'warning', 'Uma factory devolve um objeto.');
    }
  });

  // na ordem do desenho
  const order = new Map<string, number>();
  walk(root, (n) => order.set(n.id, order.size));
  return problems.sort((a, b) => order.get(a.id)! - order.get(b.id)!);
}

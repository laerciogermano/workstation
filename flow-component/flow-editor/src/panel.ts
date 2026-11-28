// O HTML do painel de edição: só texto, a partir do estado. Os eventos são tratados em ui.ts.
import { DATA_TYPES, find, hasFields, isFn, names, SOURCE_KINDS } from './model.ts';
import type { BlockNode, DataSide, Datum, FlowNode, FnNode } from './model.ts';
import { unitAt, type Command, type InsertKind, type Where } from './ops.ts';
import { titleOf } from './view-tree.ts';

export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const e = escapeHtml;

export const TYPE_NAMES: Record<string, string> = {
  abstract: 'abstrato (sem valor)', text: 'texto', number: 'número', boolean: 'booleano', null: 'nulo', function: 'função', object: 'objeto chaveado', list: 'objeto posicional',
};
const SOURCE_NAMES: Record<string, string> = { file: 'arquivo', person: 'pessoa', ai: 'IA', machine: 'máquina / lib', object: 'objeto' };
const KIND_NAMES: Record<string, string> = { fn: 'Função', if: 'if', else: 'else', switch: 'switch', case: 'case', for: 'for', while: 'while', 'do-while': 'do-while', try: 'try', catch: 'catch' };
export const INSERTS: [InsertKind, string][] = [['fn', 'Função'], ['if', 'if'], ['ifelse', 'if / else'], ['switch', 'switch'], ['for', 'for'], ['while', 'while'], ['do-while', 'do-while'], ['try', 'try / catch']];
export const WHERE: [Where, string][] = [['inside', 'Dentro'], ['before', 'Antes'], ['after', 'Depois'], ['parallel', 'Paralelo']];

const option = (value: string, label: string, current: string) => `<option value="${e(value)}"${value === current ? ' selected' : ''}>${e(label)}</option>`;
const select = (attrs: string, options: [string, string][], current: string) => `<select ${attrs} data-value="${e(current)}">${options.map(([v, l]) => option(v, l, current)).join('')}</select>`;
const input = (attrs: string, value: string) => `<input ${attrs} value="${e(value)}" autocomplete="off" spellcheck="false">`;
const button = (attrs: string, label: string, why: string | null = null) =>
  `<button type="button" ${attrs}${why ? ` disabled title="${e(why)}"` : ''}>${label}</button>`;
const section = (title: string, body: string, hint = '') => `<section><h3>${title}</h3>${hint ? `<p class="hint">${hint}</p>` : ''}${body}</section>`;

export interface PanelContext {
  tree: FnNode;
  selected: string;
  where: Where;
  prefix: string;
  why: (command: Command) => string | null;
}

function valueField(d: Datum, attrs: string, functions: string): string {
  if (d.type === 'abstract' || d.type === 'null' || hasFields(d.type)) return '';
  if (d.type === 'boolean') return select(`${attrs} aria-label="Valor"`, [['', '—'], ['true', 'true'], ['false', 'false']], d.value ?? '');
  const extra = d.type === 'number' ? 'inputmode="decimal" placeholder="valor"' : d.type === 'function' ? `list="${functions}" placeholder="qual função"` : 'placeholder="valor"';
  return input(`${attrs} ${extra} aria-label="Valor"`, d.value ?? '');
}

function dataRows(list: Datum[], side: DataSide, path: number[], parent: Datum | null, ctx: PanelContext): string {
  return list.map((d, i) => {
    const at = [...path, i].join('.');
    const attrs = (field: string) => `data-side="${side}" data-path="${at}" data-field="${field}" data-target="${e(ctx.selected)}" data-key="${side}:${at}:${field}"`;
    const positional = parent?.type === 'list';
    return `<div class="datum">
      <div class="row">
        ${positional ? `<span class="index">[${i}]</span>` : input(`${attrs('name')} list="${ctx.prefix}-data" placeholder="nome" aria-label="Nome do dado"`, d.name)}
        ${select(`${attrs('type')} aria-label="Tipo"`, DATA_TYPES.map((t) => [t, TYPE_NAMES[t]!]), d.type)}
        ${button(`data-act="data-remove" data-side="${side}" data-path="${at}" data-target="${e(ctx.selected)}" class="icon" aria-label="Remover dado" title="Remover dado"`, '×')}
      </div>
      ${valueField(d, attrs('value'), `${ctx.prefix}-functions`)}
      ${hasFields(d.type) ? `<div class="fields">${dataRows(d.fields ?? [], side, [...path, i], d, ctx)}${button(`data-act="data-add" data-side="${side}" data-path="${at}" data-target="${e(ctx.selected)}" class="link"`, d.type === 'list' ? '+ item' : '+ campo')}</div>` : ''}
    </div>`;
  }).join('');
}

function dataSection(node: FnNode, side: DataSide, title: string, hint: string, ctx: PanelContext): string {
  const list = node[side];
  return `<section data-section="${side}"><h3>${title}</h3>
    ${list.length ? dataRows(list, side, [], null, ctx) : `<p class="hint">${hint}</p>`}
    ${list.length > 1 && side !== 'data' ? `<p class="hint">Uma função tem no máximo uma ${side === 'in' ? 'entrada' : 'saída'}: estes dados formam o objeto <code>${side === 'in' ? 'input' : 'output'}_…</code></p>` : ''}
    ${button(`data-act="data-add" data-side="${side}" data-path="" data-target="${e(ctx.selected)}" class="link"`, side === 'in' ? '+ entrada' : side === 'out' ? '+ saída' : '+ dado')}
  </section>`;
}

/** O nome de variável usado por um bloco, quando é um identificador simples. */
export const variableOf = (node: BlockNode): string | null => {
  if (node.type === 'case' || node.type === 'else' || node.type === 'try' || node.type === 'catch') return null;
  const name = node.expr?.trim() ?? '';
  return /^[\p{L}_$][\p{L}\p{N}_$]*$/u.test(name) && !['true', 'false', 'null'].includes(name) ? name : null;
};

function properties(node: FlowNode, parent: FlowNode | null, index: number, ctx: PanelContext): string {
  const attrs = (field: string) => `data-prop="${field}" data-target="${e(node.id)}" data-key="prop:${field}"`;
  const parallel = !parent || node.type === 'else' || node.type === 'catch' || node.type === 'case' ? '' :
    `<label class="check"><input type="checkbox" ${attrs('parallel')}${node.parallel ? ' checked' : ''}${index === 0 ? ' disabled' : ''}> Paralela à anterior (mesmo passo)</label>`;
  if (isFn(node)) {
    const source = node.source === undefined ? 'inherit' : node.source === null ? 'abstract' : node.source.kind;
    return section('Função', `
      <label>Nome ${input(`${attrs('name')} list="${ctx.prefix}-functions"`, node.name)}</label>
      <label>Responsável ${select(attrs('source'), [['inherit', 'herdado (arquivo de cima)'], ...SOURCE_KINDS.map((k): [string, string] => [k, SOURCE_NAMES[k]!]), ['abstract', 'abstrato (camada)']], source)}</label>
      ${node.source ? `<label>Nome do responsável ${input(attrs('sourceName'), node.source.name)}</label>` : ''}
      <label>Visibilidade ${select(attrs('visibility'), [['', 'padrão'], ['public', 'pública (export)'], ['private', 'privada']], node.visibility ?? '')}</label>
      ${parallel}`);
  }
  const known = names(ctx.tree);
  const variable = variableOf(node);
  const declared = !variable || known.data.some((d) => d.name === variable) || known.functions.includes(variable);
  const label = { if: 'Condição', switch: 'Dado avaliado', case: 'Valor (ou default)', for: 'Coleção', while: 'Condição', 'do-while': 'Condição', else: '', try: '', catch: '' }[node.type];
  return section(`Bloco ${KIND_NAMES[node.type]}`, `
    ${node.type === 'for' ? `<label>Item ${input(attrs('item'), node.item ?? '')}</label>` : ''}
    ${label ? `<label>${label} ${input(`${attrs('expr')} list="${ctx.prefix}-data"`, node.expr ?? '')}</label>` : '<p class="hint">Este bloco não tem condição.</p>'}
    ${declared ? '' : `<div class="warn"><span><code>${e(variable!)}</code> ainda não está no estado.</span> ${button(`data-act="declare" data-target="${e(node.id)}"`, 'Declarar')}</div>`}
    ${parallel}`);
}

function insertion(node: FlowNode, parent: FlowNode | null, ctx: PanelContext): string {
  const target = ctx.selected;
  const extras: [string, Command, string][] = [];
  if (node.type === 'if' || node.type === 'else') {
    const hasElse = node.type === 'else' || (parent ? unitAt(parent.children, parent.children.indexOf(node)).to - parent.children.indexOf(node) > 1 : false);
    if (!hasElse) extras.push(['+ else', { type: 'else', target }, 'else']);
    extras.push(['+ else if', { type: 'elseIf', target }, 'elseIf']);
  }
  if (node.type === 'switch' || node.type === 'case') extras.push(['+ case', { type: 'case', target }, 'case']);
  if (node.type === 'try' && !ctx.why({ type: 'catch', target })) extras.push(['+ catch', { type: 'catch', target }, 'catch']);

  const allowed = WHERE.map(([where]) => ({ where, ok: !ctx.why({ type: 'insert', target, where, kind: 'fn' }) }));
  const where = allowed.find((a) => a.where === ctx.where)?.ok ? ctx.where : (allowed.find((a) => a.ok)?.where ?? ctx.where);

  return section('Adicionar', `
    ${extras.length ? `<div class="grid">${extras.map(([label, , act]) => button(`data-act="${act}" data-target="${e(target)}" class="primary"`, label)).join('')}</div>` : ''}
    <div class="segmented" role="radiogroup" aria-label="Onde inserir">${WHERE.map(([w, label]) =>
      button(`data-act="where" data-where="${w}" role="radio" aria-checked="${w === where}"`, label, allowed.find((a) => a.where === w)!.ok ? null : (ctx.why({ type: 'insert', target, where: w, kind: 'fn' }) ?? 'Indisponível'))).join('')}</div>
    <div class="grid">${INSERTS.map(([kind, label]) => button(`data-act="insert" data-kind="${kind}" data-where="${where}" data-target="${e(target)}"`, label, ctx.why({ type: 'insert', target, where, kind }))).join('')}</div>`);
}

function organize(node: FlowNode, ctx: PanelContext): string {
  const target = ctx.selected;
  const act = (label: string, name: string, command: Command, extra = '') => button(`data-act="${name}" data-target="${e(target)}" aria-label="${e(extra || label)}" title="${e(extra || label)}"`, label, ctx.why(command));
  const wraps: [string, string][] = [['', 'Envolver em…'], ['if', 'if'], ['switch', 'switch'], ['for', 'for'], ['while', 'while'], ['do-while', 'do-while'], ['try', 'try / catch'], ['fn', 'uma função (use case)']];
  const canWrap = !ctx.why({ type: 'wrap', target, kind: 'if' });
  return section('Organizar', `
    <div class="grid four">
      ${act('↑', 'up', { type: 'move', target, direction: 'up' }, 'Mover para cima')}
      ${act('↓', 'down', { type: 'move', target, direction: 'down' }, 'Mover para baixo')}
      ${act('→', 'in', { type: 'move', target, direction: 'in' }, 'Virar filha da anterior')}
      ${act('←', 'out', { type: 'move', target, direction: 'out' }, 'Subir um nível')}
    </div>
    ${select(`data-wrap data-target="${e(target)}" data-key="wrap" aria-label="Envolver em"${canWrap ? '' : ' disabled'}`, wraps, '')}
    <div class="grid">
      ${act('Duplicar', 'duplicate', { type: 'duplicate', target })}
      ${act(isFn(node) ? 'Soltar filhas' : 'Desfazer bloco', 'unwrap', { type: 'unwrap', target }, isFn(node) ? 'Remove a função e mantém as filhas' : 'Remove o bloco e mantém o que está dentro')}
      ${button(`data-act="remove" data-target="${e(target)}" class="danger"`, 'Remover', ctx.why({ type: 'remove', target }))}
    </div>`);
}

export function renderPanel(ctx: PanelContext): string {
  const { node, parent, index, path } = find(ctx.tree, ctx.selected)!;
  const known = names(ctx.tree);
  return `
    <nav class="crumbs" aria-label="Caminho">${path.map((n, i) => button(`data-act="select" data-target="${e(n.id)}"${i === path.length - 1 ? ' aria-current="true"' : ''}`, e(titleOf(n)))).join('<span>›</span>')}</nav>
    ${properties(node, parent, index, ctx)}
    ${isFn(node)
      ? dataSection(node, 'in', 'Entrada', 'Sem entrada.', ctx) + dataSection(node, 'out', 'Saída', 'Sem saída.', ctx) + dataSection(node, 'data', 'Dados declarados', 'Variáveis criadas dentro desta função.', ctx)
      : ''}
    ${insertion(node, parent, ctx)}
    ${organize(node, ctx)}
    <datalist id="${ctx.prefix}-data">${known.data.map((d) => `<option value="${e(d.name)}">`).join('')}</datalist>
    <datalist id="${ctx.prefix}-functions">${known.functions.map((n) => `<option value="${e(n)}">`).join('')}</datalist>`;
}

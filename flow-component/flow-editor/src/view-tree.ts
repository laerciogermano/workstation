// Modelo editável → árvore de entrada do Flow View. As identidades são preservadas.
import { blockLabel } from '@flow/view';
import type { Data, FlowNode as ViewNode } from '@flow/view';
import { isFn } from './model.ts';
import type { BlockNode, Datum, FlowNode } from './model.ts';

/** O valor como aparece no estado: texto entre aspas, `null` por extenso. */
export function valueText(d: Datum): string | undefined {
  if (d.type === 'null') return 'null';
  if (d.type === 'abstract' || d.value === undefined || d.value === '') return d.type === 'text' && d.value === '' ? '""' : undefined;
  return d.type === 'text' ? JSON.stringify(d.value) : d.value;
}

export function viewData(d: Datum): Data {
  if (d.type === 'object' || d.type === 'list') {
    // caixa vazia continua sendo um dado com valor
    if (!d.fields?.length) return { name: d.name, value: d.type === 'list' ? '[]' : '{}' };
    return { name: d.name, fields: d.fields.map(viewData) };
  }
  // a função como dado aparece pelo nome (um círculo), quando o nome é o dela
  if (d.type === 'function') return { name: d.name, function: true, value: d.value && d.value !== d.name ? d.value : undefined };
  const value = valueText(d);
  return value === undefined ? d.name : { name: d.name, value };
}

export const labelOf = (node: BlockNode): string => (node.type === 'for' ? [node.item, node.expr].filter(Boolean).join(' of ') : (node.expr ?? ''));

export const titleOf = (node: FlowNode): string => (isFn(node) ? node.name : blockLabel(node.type, labelOf(node)));

export function toView(node: FlowNode): ViewNode {
  const children = node.children.map(toView);
  if (!isFn(node)) return { id: node.id, type: node.type, label: labelOf(node) || undefined, parallel: node.parallel, children };
  return {
    id: node.id,
    name: node.name,
    in: node.in.map(viewData),
    out: node.out.map(viewData),
    data: node.data.map(viewData),
    source: node.source,
    parallel: node.parallel,
    children,
  };
}

/** O exemplo no formato do editor: cada valor ganha o tipo dele, e o `for` separa a variável da coleção. */
export function editable(node) {
  const datum = (d) => {
    if (typeof d === 'string') return d;
    if (d.fields) return { ...d, fields: d.fields.map(datum) };
    if (d.function) return { name: d.name, type: 'function', value: d.value ?? d.name };
    if (d.value === undefined) return { name: d.name };
    if (d.value === null) return { name: d.name, type: 'null' };
    if (typeof d.value !== 'string') return { name: d.name, type: typeof d.value, value: d.value };
    return { name: d.name, type: 'text', value: d.value.replace(/^"(.*)"$/s, '$1') };
  };
  const out = { ...node, children: node.children?.map(editable) };
  for (const side of ['in', 'out', 'data']) if (node[side]) out[side] = node[side].map(datum);
  const loop = node.type === 'for' && node.label?.match(/^(\S+)\s+(?:of|in)\s+(.+)$/);
  if (loop) Object.assign(out, { item: loop[1], expr: loop[2], label: undefined });
  return out;
}

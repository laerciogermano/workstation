// Atualiza o DOM no lugar, para o foco e o clique em andamento não se perderem a cada mudança.

export function morph(target: Element, html: string): void {
  const next = target.ownerDocument.createElement('template');
  next.innerHTML = html;
  children(target, next.content);
}

function children(from: Node, to: Node): void {
  const wanted = [...to.childNodes];
  wanted.forEach((node, i) => {
    const old = from.childNodes[i];
    if (!old) from.appendChild(node);
    else if (!same(old, node)) from.replaceChild(node, old);
    else patch(old, node);
  });
  while (from.childNodes.length > wanted.length) from.lastChild!.remove();
}

const key = (node: Node) => (node as Element).getAttribute?.('data-key') ?? null;
const same = (a: Node, b: Node) => a.nodeName === b.nodeName && key(a) === key(b) && (a as HTMLInputElement).type === (b as HTMLInputElement).type;

function patch(old: Node, next: Node): void {
  if (old.nodeType !== 1) {
    if (old.nodeValue !== next.nodeValue) old.nodeValue = next.nodeValue;
    return;
  }
  const a = old as Element, b = next as Element;
  const target = a.getAttribute('data-target');
  for (const { name } of [...a.attributes]) if (!b.hasAttribute(name)) a.removeAttribute(name);
  for (const { name, value } of [...b.attributes]) if (a.getAttribute(name) !== value) a.setAttribute(name, value);
  if (a.nodeName === 'INPUT') {
    const input = a as HTMLInputElement;
    const fresh = b as HTMLInputElement;
    input.checked = fresh.hasAttribute('checked');
    // não apaga o que está sendo digitado, a não ser que o campo passe a ser de outro item
    if (input.type !== 'checkbox' && (input.ownerDocument.activeElement !== input || target !== b.getAttribute('data-target'))) input.value = fresh.getAttribute('value') ?? '';
    return;
  }
  children(a, b);
  if (a.nodeName === 'SELECT') (a as HTMLSelectElement).value = a.getAttribute('data-value') ?? '';
}

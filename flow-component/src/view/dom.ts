/** Mini-helpers de DOM/SVG (sem framework): `h("div", {class:"x"}, filhos)`. */
export type Child = Node | string | number | null | undefined | false | readonly Child[];
export type Props = Record<string, unknown>;
const SVG = "http://www.w3.org/2000/svg";

function apply(el: Element, props: Props | null): void {
  if (!props) return;
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    else if (k === "style" && typeof v === "object") Object.assign((el as HTMLElement).style, v);
    else if (k === "value" || k === "checked") (el as unknown as Record<string, unknown>)[k] = v;
    else el.setAttribute(k === "className" ? "class" : k, v === true ? "" : String(v));
  }
}
function append(el: Element, kids: readonly Child[]): void {
  for (const c of kids) {
    if (c == null || c === false) continue;
    if (Array.isArray(c)) append(el, c as readonly Child[]);
    else el.append(c instanceof Node ? c : String(c));
  }
}
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props?: Props | null, ...kids: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag); apply(el, props ?? null); append(el, kids); return el;
}
export function sv(tag: string, props?: Props | null, ...kids: Child[]): SVGElement {
  const el = document.createElementNS(SVG, tag); apply(el, props ?? null); append(el, kids); return el;
}

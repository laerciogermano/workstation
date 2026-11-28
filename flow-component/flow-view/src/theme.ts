// Cores do site do FOP; troque pelas variáveis CSS --flow-* no elemento hospedeiro.
export type Theme = 'dark' | 'light';

const PALETTE: Record<Theme, Record<string, string>> = {
  dark: { bg: '#050505', text: '#e8e8e8', muted: '#8a8a8a', line: '#232323', pill: '#121212', fn: '#f07167', 'on-fn': '#ffffff', data: '#5b8cff', if: '#e0b84f', loop: '#4fc3b4', try: '#2fb35a', catch: '#e5484d' },
  light: { bg: '#ffffff', text: '#1d1f24', muted: '#6b717c', line: '#e4e2dd', pill: '#f4f2ee', fn: '#e05248', 'on-fn': '#ffffff', data: '#2f66e0', if: '#9a7410', loop: '#0f7a6e', try: '#1c7d3f', catch: '#c0272d' },
};

export function styles(theme: Theme, id: string): string {
  const p = PALETTE[theme];
  const v = (k: string) => `var(--flow-${k},${p[k]})`;
  const s = `#${id}`;
  const rules = [
    `{font-family:var(--flow-font,"IBM Plex Mono",ui-monospace,Menlo,monospace);display:block}`,
    ` .bg{fill:${v('bg')}}`, ` text{fill:${v('text')};font-size:11px;font-weight:500;dominant-baseline:central}`,
    ` .muted{fill:${v('muted')}}`, ` .head{font-size:9px;font-weight:700;letter-spacing:.06em;fill:${v('muted')}}`,
    ` .line{stroke:${v('line')};stroke-width:1;fill:none}`, ` .wire{stroke:${v('muted')};stroke-width:1;fill:none}`,
    ` .pill{fill:${v('pill')};stroke:${v('line')}}`, ` .step{font-size:10px;font-weight:700}`,
    ` .fn{fill:${v('fn')}}`, ` .fn-o{fill:${v('bg')};stroke:${v('fn')};stroke-width:1.5}`, ` .fn-l{stroke:${v('fn')};stroke-width:1;fill:none}`,
    ` text.on-fn{fill:${v('on-fn')};font-weight:600}`, ` text.in-o{font-weight:600}`,
    ` .data{fill:${v('data')};stroke:${v('data')}}`, ` .data-o{fill:${v('bg')};stroke:${v('data')};stroke-width:1.5}`,
    ` .cube-edge{stroke:${v('bg')};stroke-width:1;fill:none}`,
    ` .src{fill:none;stroke:${v('muted')};stroke-width:1.2}`, ` .dashed{stroke-dasharray:3 2}`, ` text.abs{fill:${v('muted')};font-style:italic}`,
    ` .dim{opacity:.35}`, ` .bold{font-weight:700}`,
    ` .sel{fill:${v('text')};opacity:.1;pointer-events:none}`, ` .sel-mark{fill:${v('fn')}}`,
    ` .toggle{cursor:pointer;outline:none}`, ` .toggle .hit{fill:transparent}`, ` .toggle:hover .hit,.toggle:focus-visible .hit{fill:${v('line')}}`, ` .toggle:focus-visible .hit{stroke:${v('fn')}}`,
    ...(['if', 'loop', 'try', 'catch'] as const).flatMap((k) => [
      ` .k-${k} .band{fill:${v(k)};opacity:.16}`, ` .k-${k} text{fill:${v(k)};font-weight:600}`,
      ` .k-${k} .mark{fill:${v('bg')};stroke:${v(k)};stroke-width:1.5}`, ` .k-${k} .guide{stroke:${v(k)};stroke-width:1;opacity:.7}`,
    ]),
  ];
  return rules.map((r) => s + r).join('');
}

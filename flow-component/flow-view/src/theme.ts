// Cores do site do FOP; troque pelas variáveis CSS --flow-* no elemento hospedeiro.
export type Theme = 'dark' | 'light';

const PALETTE: Record<Theme, Record<string, string>> = {
  dark: { bg: '#0b0b0b', text: '#f2f2f2', body: '#c4c4c4', muted: '#8a8a8a', line: '#262626', 'line-2': '#3a3a3a', pill: '#121212', wash: '#1c1c1c', fn: '#f07167', 'on-fn': '#ffffff', data: '#5b8cff', if: '#e0b84f', loop: '#4fc3b4', try: '#2fb35a', catch: '#e5484d', wire: '#8a8a8a' },
  light: { bg: '#ffffff', text: '#1d1f24', body: '#454a54', muted: '#6b717c', line: '#e4e2dd', 'line-2': '#cfccc4', pill: '#f7f5f1', wash: '#efece6', fn: '#e05248', 'on-fn': '#ffffff', data: '#2f66e0', if: '#9a7410', loop: '#0f7a6e', try: '#1c7d3f', catch: '#c0272d', wire: '#8b919b' },
};

export function styles(theme: Theme, id: string): string {
  const p = PALETTE[theme];
  const v = (k: string) => `var(--flow-${k},${p[k]})`;
  const s = `#${id}`;
  const ui = 'var(--flow-ui-font,"IBM Plex Sans",system-ui,sans-serif)';
  const rules = [
    `{font-family:var(--flow-font,"IBM Plex Mono",ui-monospace,Menlo,monospace);display:block}`,
    ` .bg{fill:${v('bg')}}`, ` text{fill:${v('text')};font-size:11px;font-weight:500;dominant-baseline:central}`,
    ` .muted{fill:${v('muted')}}`,
    // tabela
    ` text.head{font-family:${ui};font-size:10px;font-weight:600;letter-spacing:.06em;fill:${v('muted')}}`,
    ` text.source{font-family:${ui};font-size:11px;fill:${v('body')}}`, ` text.name{font-size:12px;font-weight:400}`, ` text.block{font-size:12px;font-weight:600}`,
    ` text.abs{fill:${v('muted')};font-style:italic}`, ` text.par{font-size:12px;font-weight:700;fill:${v('muted')}}`, ` text.tag{fill:${v('muted')};font-size:9px;font-style:italic}`,
    ` .src{fill:none;stroke:${v('muted')};stroke-width:1.2}`, ` .ring{fill:${v('bg')};stroke:${v('text')};stroke-width:1.5}`, ` .dashed{stroke:${v('line-2')};stroke-dasharray:3 2;fill:none}`,
    ` .glyph{fill:none;stroke:${v('text')};stroke-width:2;stroke-linecap:round;stroke-linejoin:round}`, ` .dashed+.glyph{stroke:${v('muted')}}`,
    ` .divider{stroke:${v('line-2')};stroke-width:1}`, ` .rail{stroke:${v('fn')};stroke-width:2;stroke-opacity:.45}`,
    // plano
    ` .line{stroke:${v('line')};stroke-width:1;fill:none}`, ` .grid{stroke:${v('line-2')};stroke-width:1;fill:none}`,
    ` .wire{stroke:${v('wire')};stroke-width:1.2;fill:none}`, ` .dep{stroke:${v('wire')};stroke-width:1.2;fill:none}`,
    ` .chip{fill:${v('wash')};stroke:${v('muted')};stroke-opacity:.7;stroke-width:1.3}`, ` text.step{font-size:9px;font-weight:600}`,
    ` .fn{fill:${v('fn')}}`, ` .fn-o{fill:${v('bg')};stroke:${v('fn')};stroke-width:1.5}`,
    ` text.on-fn{font-size:9.5px;font-weight:600;fill:${v('on-fn')}}`, ` text.in-o{font-size:9.5px;font-weight:600;fill:${v('fn')}}`, ` text.label{font-size:9.5px;font-weight:600}`,
    ` .data{fill:${v('data')};stroke:${v('data')};stroke-width:1.3}`, ` .data-o{fill:${v('bg')};stroke:${v('data')};stroke-width:1.3}`,
    ` .cube-edge{stroke:${v('bg')};stroke-width:.9;fill:none;stroke-linejoin:round}`, ` .data-o+.cube-edge{stroke:${v('data')}}`,
    ` text.dn{font-size:9px;fill:${v('muted')}}`,
    ` .shared{fill:none;stroke:${v('data')};stroke-width:1.2}`, ` .double{fill:none;stroke:${v('fn')};stroke-width:1.2}`,
    ` .made{fill:${v('bg')};stroke:${v('bg')}}`, ` .made+.cube-edge{stroke:${v('fn')}}`,
    ` .box{fill:${v('pill')};stroke:${v('muted')}}`, ` .box+.cube-edge{stroke:none}`,
    // estado: o que chega no passo em destaque, o anterior apagado
    ` .bold text{font-size:9px;font-weight:600}`, ` .dim{opacity:.38}`, ` .dim text{font-size:9px;fill:${v('muted')}}`,
    // cartão
    ` .card-file{fill:${v('wash')}}`, ` .card-fn{fill:${v('pill')}}`, ` .card-edge{fill:none;stroke:${v('line-2')};stroke-width:1}`, ` text.card-title{font-size:12px;font-weight:700}`,
    ` .sel{fill:${v('text')};opacity:.07;pointer-events:none}`, ` .sel-mark{fill:${v('fn')}}`,
    // edição: alvos do ponteiro, “+” de entrada e saída e a alça do bloco aparecem ao passar o mouse
    ` .grip-hit{fill:transparent}`, ` .grip{fill:${v('text')};opacity:0}`, ` .grip-g{cursor:col-resize}`, ` .grip-g:hover .grip{opacity:.45}`,
    ` .ghost{cursor:pointer;opacity:0}`, ` .ghost:hover{opacity:.9}`, ` .ghost-box{fill:${v('bg')};stroke:${v('data')};stroke-width:1.2}`, ` .ghost-plus{stroke:${v('data')};stroke-width:1.2;fill:none}`,
    ` .editing [data-t=name]{cursor:text}`, ` .editing [data-t=data],.editing [data-t=state],.editing [data-t=source],.editing [data-t=bar]{cursor:pointer}`,
    ` .editing [data-t=name]:hover text{text-decoration:underline}`,
    ` .toggle{cursor:pointer;outline:none}`, ` .toggle .hit{fill:transparent}`, ` .toggle:hover .hit,.toggle:focus-visible .hit{fill:${v('line')}}`, ` .toggle:focus-visible .hit{stroke:${v('fn')}}`,
    ...(['if', 'loop', 'try', 'catch'] as const).flatMap((k) => [
      ` .k-${k} .band{fill:${v(k)};opacity:.17}`, ` .k-${k} text{fill:${v(k)}}`, ` .k-${k} .band+text{font-size:9px;font-weight:600}`,
      ` .k-${k} .mark{fill:${v('bg')};stroke:${v(k)};stroke-width:1.5;stroke-linecap:round}`, ` .k-${k} text.mark-text{font-size:11px;font-weight:700;stroke:none;fill:${v(k)}}`,
      ` .k-${k} .badge{fill:none;stroke:${v(k)};stroke-width:1}`, ` .k-${k} text.badge-text{font-size:9px;font-weight:700}`,
      ` .k-${k} .rail{stroke:${v(k)}}`,
    ]),
    // nas linhas da tabela só o `catch` colore o texto
    ...(['if', 'loop', 'try'] as const).map((k) => ` .k-${k} text.block{fill:${v('text')}}`),
    ` .k-if .else .band{opacity:.12}`,
  ];
  // numa lista de seletores, cada um precisa do id (senão vaza para a página)
  return rules.map((r) => s + r.replace(/^([^{]*)\{/, (_, list: string) => `${list.replaceAll(',', `,${s} `)}{`)).join('');
}

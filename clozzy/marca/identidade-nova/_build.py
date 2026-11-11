#!/usr/bin/env python3
"""Clozzy 2028 — manual de identidade visual (A4 paisagem) → HTML + PDF + exports PNG.
Rodar: python3 _build.py"""
import base64, os, subprocess, tempfile
from pathlib import Path

import _logos

HERE = Path(__file__).resolve().parent
LOGOS = HERE / "logos"
EXPORT = HERE / "export"
OUT_HTML = HERE / "identidade-visual-clozzy-2028.html"
OUT_PDF = HERE / "identidade-visual-clozzy-2028.pdf"
ASIS = HERE.parent / "identidade-atual"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

_logos.build()


def uri(path: Path) -> str:
    mime = {".svg": "image/svg+xml", ".png": "image/png", ".ttf": "font/ttf"}[path.suffix]
    return f"data:{mime};base64,{base64.b64encode(path.read_bytes()).decode()}"


def L(name, h=None, w=None, cls="", style=""):
    st = (f"height:{h}px;" if h else "") + (f"width:{w}px;" if w else "") + style
    return f'<img src="{uri(LOGOS / (name + ".svg"))}" class="{cls}" style="{st}" alt="">'


def asis(name, h=None):
    p = ASIS / "logos" / name
    return f'<img src="{uri(p)}" style="height:{h}px" alt="">' if p.exists() else ""


def foot(n):
    return (f'<div class="foot"><span>Clozzy 2028 · identidade visual · v1 · nov/2026</span>'
            f'<span>{n:02d}</span></div>')


FONTS = f"""
@font-face{{font-family:Gabarito;src:url({uri(HERE / 'fonts/Gabarito-Variable.ttf')}) format('truetype');font-weight:400 900}}
@font-face{{font-family:Figtree;src:url({uri(HERE / 'fonts/Figtree-Variable.ttf')}) format('truetype');font-weight:300 900}}
"""

CSS = FONTS + (HERE / "tokens.css").read_text() + """
@page{size:297mm 210mm;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--cz-font-body);background:#2a1f24;color:var(--cz-ink);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:297mm;height:210mm;padding:14mm 16mm 15mm;position:relative;overflow:hidden;page-break-after:always;display:flex;flex-direction:column;gap:12px;background:var(--cz-cream);margin:0 auto 8mm}
@media print{.page{margin:0}}
.pink{background:var(--cz-pink);color:var(--cz-ink)}
.ink{background:var(--cz-ink);color:var(--cz-cream)}
.eyebrow{font:700 10.5px/1 var(--cz-font-body);letter-spacing:.12em;text-transform:uppercase;color:var(--cz-muted)}
.ink .eyebrow{color:#b9a7af}.pink .eyebrow{color:var(--cz-ink)}
h1{font:900 96px/.92 var(--cz-font-display);letter-spacing:-.04em}
h2{font:800 34px/1.02 var(--cz-font-display);letter-spacing:-.03em;max-width:880px}
h2 em{font-style:normal;color:var(--cz-pink-deep)}
.ink h2 em{color:var(--cz-pink-glow)}
h3{font:800 17px/1.15 var(--cz-font-display);letter-spacing:-.01em;margin-bottom:6px}
p,li{font-size:12px;line-height:1.5}
.lead{font-size:14px;line-height:1.5;max-width:760px;color:var(--cz-ink-2)}
.ink .lead{color:#d9c9cf}
.muted{color:var(--cz-muted)}
.small{font-size:10px;line-height:1.45;color:var(--cz-muted)}
.ink .small{color:#b9a7af}
.foot{position:absolute;left:16mm;right:16mm;bottom:7mm;display:flex;justify-content:space-between;font-size:9px;color:var(--cz-muted);letter-spacing:.02em}
.ink .foot{color:#8f7c85}.pink .foot{color:var(--cz-ink)}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.card{background:var(--cz-surface);border:1px solid var(--cz-line);border-radius:var(--cz-radius-md);padding:14px 16px}
.ink .card{background:#1a1015;border-color:#33232b}
.tile{border-radius:var(--cz-radius-md);display:flex;align-items:center;justify-content:center;position:relative}
.tile .cap{position:absolute;left:12px;bottom:9px;font-size:9px;font-weight:600;letter-spacing:.04em}
code{font-family:var(--cz-font-mono);font-size:9.5px;background:var(--cz-pink-soft);color:var(--cz-ink);border-radius:4px;padding:1px 5px}
.ink code{background:#33232b;color:#fff6f0}
table{border-collapse:collapse;width:100%;font-size:11px}
th{font-size:9.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--cz-muted);text-align:left;padding:6px 8px;border-bottom:1.5px solid var(--cz-ink)}
td{padding:7px 8px;border-bottom:1px solid var(--cz-line);vertical-align:top;line-height:1.4}
.flex{display:flex;gap:16px;align-items:center}
.grow{flex:1}
.pill{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:5px 11px;font:700 11px/1 var(--cz-font-body)}
.btn{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:12px 22px;font:800 14px/1 var(--cz-font-display);letter-spacing:-.005em}
.btn-primary{background:var(--cz-pink-deep);color:#fff}
.btn-ghost{border:1.5px solid var(--cz-ink);color:var(--cz-ink)}
.do,.dont{font-size:11px;line-height:1.45;padding-left:18px;position:relative;margin:4px 0}
.do:before{content:"✓";position:absolute;left:0;color:var(--cz-access);font-weight:800}
.dont:before{content:"✕";position:absolute;left:0;color:var(--cz-danger);font-weight:800}
.num{font:900 13px/1 var(--cz-font-display);color:var(--cz-pink-deep)}
.x{position:relative}
.x:after{content:"";position:absolute;inset:6px;background:linear-gradient(to top right,transparent calc(50% - 1px),var(--cz-danger) calc(50% - 1px),var(--cz-danger) calc(50% + 1px),transparent calc(50% + 1px));opacity:.85;border-radius:10px}
"""

pages = []

# ------------------------------------------------------------------ 01 capa
pages.append(f"""
<section class="page pink" style="justify-content:space-between">
  <div class="flex" style="justify-content:space-between"><span class="eyebrow">Manual de identidade visual · v1</span><span class="eyebrow">Clozzy 2028</span></div>
  <div>{L('lockup-horizontal-on-pink', h=150)}</div>
  <div class="flex" style="justify-content:space-between;align-items:flex-end">
    <p style="font:800 30px/1.05 var(--cz-font-display);letter-spacing:-.03em;max-width:620px">O exclusivo de quem você segue.<br>Comprado em um toque, aberto na hora.</p>
    <p class="small" style="color:var(--cz-ink);text-align:right">Novembro 2026<br>Substitui o kit as-is (A · B · C)</p>
  </div>
</section>""")

# ------------------------------------------------------------------ 02 sumário + o que muda
pages.append(f"""
<section class="page">
  <span class="eyebrow">00 · Antes → depois</span>
  <h2>Hoje o Clozzy tem <em>três marcas</em>. A partir de agora, uma.</h2>
  <div class="g3" style="margin-top:6px">
    <div class="card"><h3>A · App (código)</h3>{asis('legacy-mark-geometric-pink.svg', 40)}<p class="small" style="margin-top:8px">Círculo #FF0065 + glifo geométrico. Montserrat. Só no performer.</p></div>
    <div class="card"><h3>B · Site</h3>{asis('mark-star-purple.svg', 40)}<p class="small" style="margin-top:8px">Círculo roxo #7651E9 + estrela. Inter/Roboto. Roxo cai no cluster SaaS/concorrência.</p></div>
    <div class="card"><h3>C · Board Figma</h3><svg viewBox="0 0 100 100" width="40"><circle cx="50" cy="50" r="50" fill="#FF0065"/><polygon points="{_logos.star_points(R=26, ratio=.42)}" fill="#fff"/></svg><p class="small" style="margin-top:8px">Estrela magenta no círculo · “meuclozzy”. Mais próxima do que o público já reconhece.</p></div>
  </div>
  <div class="card" style="display:grid;grid-template-columns:auto 1fr;gap:26px;align-items:center;margin-top:4px">
    {L('lockup-horizontal', h=70)}
    <div>
      <h3>Clozzy 2028 · “Círculo próximo”</h3>
      <p>Fica o que tem valor de reconhecimento: <b>o magenta #FF0065</b>, <b>a estrela</b> (Close Friends) e o <b>nome em caixa baixa</b>. Sai o roxo, o glifo geométrico e a mistura de 3 fontes. O círculo fechado vira um <b>C aberto</b> — e a ponta da estrela aponta para a abertura.</p>
    </div>
  </div>
  <table style="margin-top:4px">
    <tr><th>Eixo</th><th>As-is</th><th>2028</th></tr>
    <tr><td>Símbolo</td><td>3 marks (geométrico, estrela roxa, estrela magenta)</td><td>1 símbolo: C aberto + estrela · 1 cor · 16px</td></tr>
    <tr><td>Cor</td><td>#FF0065 / #FE2C55 / #FE2C78 / #7651E9</td><td>Pink Clozzy #FF0065 + Pink Deep #E0005A (AA) · ink e cream quentes</td></tr>
    <tr><td>Tipo</td><td>Montserrat · Proxima Nova · Inter/Roboto</td><td>Gabarito (display/wordmark) + Figtree (UI e texto)</td></tr>
    <tr><td>Nome</td><td>clozzy · meuclozzy</td><td><b>clozzy</b> é a marca; “meu clozzy” vira só a área do criador</td></tr>
    <tr><td>Promessa</td><td>Close Friends pago no Instagram</td><td>Vitrine → compra → acesso, sem depender de uma rede só</td></tr>
  </table>
  {foot(2)}
</section>""")

# ------------------------------------------------------------------ 03 essência
pages.append(f"""
<section class="page">
  <span class="eyebrow">01 · Essência</span>
  <h2>O exclusivo é <em>produto de vitrine</em>, não favor na DM.</h2>
  <div class="g2" style="flex:1">
    <div style="display:flex;flex-direction:column;gap:12px">
      <div class="card"><h3>O que é</h3><p>Site onde influencers vendem conteúdo exclusivo direto para fãs — e onde o fã compra, acessa e acompanha tudo num só lugar.</p></div>
      <div class="card"><h3>Para quem</h3><p><b>Criador</b> que já tem audiência e quer monetizar sem gambiarra · <b>Fã</b> que quer pagar e saber exatamente o que levou · <b>Operação</b> que precisa de controle.</p></div>
      <div class="card"><h3>Posicionamento</h3><p style="font:800 16px/1.3 var(--cz-font-display)">Para criadores brasileiros, o Clozzy é a vitrine do exclusivo: o fã vê o que compra, paga no Pix e abre na hora.</p></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px">
      <div class="card"><h3>Personalidade</h3>
        <table><tr><th>Traço</th><th>Vira na marca</th></tr>
        <tr><td><b>Próximo</b></td><td>Círculo, estrela, caixa baixa, cream quente</td></tr>
        <tr><td><b>Direto</b></td><td>Preço e acesso sempre visíveis; CTA em verbo</td></tr>
        <tr><td><b>Confiante</b></td><td>Magenta saturado, display pesado, sem gradiente</td></tr>
        <tr><td><b>Discreto</b></td><td>Preview que não entrega; nunca imagem explícita na marca</td></tr>
        </table></div>
      <div class="card"><h3>Eixos 2026 (máx. 2)</h3>
        <p><b>Ativos:</b> família responsiva (lockup → símbolo → glyph 16px) · motion L1 de assinatura (“abrir o círculo”).</p>
        <p style="margin-top:4px"><b>Evitados:</b> roxo-sobre-preto do mercado adulto, gradiente SaaS, glow neon, 3D, mascote.</p>
        <p class="small" style="margin-top:6px">Por quê: o benchmarking mostra o mercado em dark + ciano/rosa/roxo. O Clozzy se separa sendo <b>claro, quente e com um rosa só</b>.</p></div>
    </div>
  </div>
  {foot(3)}
</section>""")

# ------------------------------------------------------------------ 04 símbolo / construção
pages.append(f"""
<section class="page">
  <span class="eyebrow">02 · Símbolo</span>
  <h2>Círculo próximo: <em>a estrela aponta para fora</em>.</h2>
  <div style="display:grid;grid-template-columns:330px 1fr;gap:28px;flex:1;align-items:center">
    <div class="tile" style="background:#fff;border:1px solid var(--cz-line);height:330px"><div style="position:relative;width:280px;height:280px">
      <svg viewBox="0 0 100 100" width="280" height="280" style="position:absolute;inset:0;z-index:2;overflow:visible">
        <g fill="none" stroke="#14090F" stroke-opacity=".35" stroke-width=".3" stroke-dasharray="1.2 1.2">
          <circle cx="50" cy="50" r="45"/><circle cx="50" cy="50" r="29"/><circle cx="50" cy="50" r="20.5"/>
          <line x1="0" y1="50" x2="100" y2="50"/><line x1="50" y1="0" x2="50" y2="100"/>
          <line x1="50" y1="50" x2="{50 + 55 * 0.951:.2f}" y2="{50 - 55 * 0.309:.2f}" stroke="#E0005A" stroke-dasharray="none" stroke-width=".5"/>
        </g>
      </svg>
      {L('mark-pink', w=280, style='position:absolute;inset:0;opacity:.9')}
    </div></div>
    <div style="display:flex;flex-direction:column;gap:12px">
      <p class="lead">O <b>C</b> de clozzy é também o círculo de “close friends”: quem está dentro. A abertura fica no eixo exato da ponta superior-direita da estrela — o exclusivo sai do círculo direto para o fã. Uma ideia, uma cor, uma silhueta.</p>
      <table>
        <tr><th>Medida (grid 100)</th><th>Valor</th><th>Por quê</th></tr>
        <tr><td>Anel externo / interno</td><td>45 / 29</td><td>Espessura 16 = mesma massa do traço do wordmark</td></tr>
        <tr><td>Abertura</td><td>54° centrada em −18°</td><td>Alinha com a ponta da estrela (linha rosa)</td></tr>
        <tr><td>Estrela</td><td>R 20,5 · razão 0,48 · cantos r 2,5</td><td>Herdada do Figma 289, mais cheia e arredondada</td></tr>
        <tr><td>Terminais</td><td>redondos</td><td>Conversa com os terminais da Gabarito</td></tr>
      </table>
      <div class="flex" style="gap:22px;margin-top:4px">
        {L('mark-pink', h=64)}{L('mark-ink', h=64)}
        <div class="tile" style="background:var(--cz-pink);width:64px;height:64px;border-radius:12px">{L('mark-white', h=46)}</div>
        <div class="tile" style="background:var(--cz-ink);width:64px;height:64px;border-radius:12px">{L('mark-pink', h=46)}</div>
        <span class="small">Glyph 16–32px: anel 20, abertura 60°, estrela 21 (correção óptica) → <code>glyph-*.svg</code></span>
      </div>
    </div>
  </div>
  {foot(4)}
</section>""")

# ------------------------------------------------------------------ 05 direções exploradas
def dir_a():
    star = _logos.star_points()
    return (f'<svg viewBox="0 0 100 100" width="110"><circle cx="50" cy="50" r="46" fill="#FF0065"/>'
            f'<polygon points="{star}" fill="#fff" stroke="#fff" stroke-width="5" stroke-linejoin="round" transform="translate(0 1) scale(1.25) translate(-10 -10)"/></svg>')


pages.append(f"""
<section class="page">
  <span class="eyebrow">03 · Direções exploradas</span>
  <h2>Três caminhos. <em>B</em> é o recomendado.</h2>
  <div class="g3" style="flex:1">
    <div class="card" style="display:flex;flex-direction:column;gap:10px">
      <span class="num">A · Evolução</span>
      <div class="tile" style="height:260px;background:var(--cz-cream)">{dir_a()}</div>
      <h3>Estrela no disco</h3>
      <p>Só refina o board Figma: disco magenta, estrela arredondada.</p>
      <p class="small">+ zero ruptura · − é o ícone de Close Friends do Instagram; não é nosso, e prende a marca a uma rede.</p>
    </div>
    <div class="card" style="display:flex;flex-direction:column;gap:10px;border:2px solid var(--cz-pink-deep)">
      <span class="num">B · Círculo próximo ✓</span>
      <div class="tile" style="height:260px;background:var(--cz-cream)">{L('mark-pink', h=110)}</div>
      <h3>C aberto + estrela</h3>
      <p>C de clozzy e círculo de quem está perto. A ponta da estrela aponta para a abertura.</p>
      <p class="small">+ mantém estrela e magenta (reconhecimento) · + silhueta própria · + funciona 1 cor / 16px.</p>
    </div>
    <div class="card" style="display:flex;flex-direction:column;gap:10px">
      <span class="num">C · Wordmark-led</span>
      <div class="tile" style="height:260px;background:var(--cz-cream);font:900 52px/1 var(--cz-font-display);letter-spacing:-.04em">clo<span style="color:#FF0065">zz</span>y</div>
      <h3>O “zz” como marca</h3>
      <p>Sem símbolo; o duplo z em magenta carrega tudo.</p>
      <p class="small">+ muito limpo · − sem ícone forte para app/avatar; joga fora a estrela que o público já conhece.</p>
    </div>
  </div>
  <p class="small">Checkpoint de logo (método 04-logos): se outra direção for escolhida, o resto do sistema (cor, tipo, voz, motion) segue igual. Só mudam os SVGs em <code>logos/</code>.</p>
  {foot(5)}
</section>""")

# ------------------------------------------------------------------ 06 logo system
pages.append(f"""
<section class="page">
  <span class="eyebrow">04 · Família de logo</span>
  <h2>Uma família, <em>do header ao favicon</em>.</h2>
  <div style="display:grid;grid-template-columns:1.5fr 1fr;grid-template-rows:1fr 1fr;gap:12px;flex:1">
    <div class="tile" style="background:#fff;border:1px solid var(--cz-line)">{L('lockup-horizontal', h=92)}<span class="cap">lockup-horizontal · header, site, docs</span></div>
    <div class="tile" style="background:#fff;border:1px solid var(--cz-line)">{L('lockup-stacked', h=140)}<span class="cap">lockup-stacked · espaços quadrados</span></div>
    <div class="tile" style="background:var(--cz-ink)">{L('lockup-horizontal-reversed', h=72)}<span class="cap" style="color:#b9a7af">lockup-horizontal-reversed · dark</span></div>
    <div class="g2" style="gap:12px">
      <div class="tile" style="background:var(--cz-pink)">{L('lockup-horizontal-on-pink', h=34)}<span class="cap">on-pink</span></div>
      <div class="tile" style="background:#fff;border:1px solid var(--cz-line)">{L('lockup-mono-ink', h=34)}<span class="cap">mono ink · 1 cor</span></div>
    </div>
  </div>
  <div class="flex" style="gap:26px;align-items:flex-end">
    <div style="text-align:center">{L('app-icon-pink', h=72)}<p class="small">app icon</p></div>
    <div style="text-align:center">{L('app-icon-ink', h=72)}<p class="small">app (dark)</p></div>
    <div style="text-align:center">{L('avatar-social', h=72)}<p class="small">avatar social</p></div>
    <div style="text-align:center">{L('favicon', h=32)}<p class="small">32</p></div>
    <div style="text-align:center">{L('favicon', h=16)}<p class="small">16</p></div>
    <p class="small grow">Masters SVG sem gradiente, sem sombra. Wordmark em Gabarito 800 convertida em curvas, tracking −18/1000. PNGs de app/favicon em <code>export/</code>.</p>
  </div>
  {foot(6)}
</section>""")

# ------------------------------------------------------------------ 07 clear space, mínimo, não fazer
pages.append(f"""
<section class="page">
  <span class="eyebrow">05 · Respiro, mínimo e usos proibidos</span>
  <h2>Deixe o círculo <em>respirar</em>.</h2>
  <div style="display:grid;grid-template-columns:1.1fr 1fr;gap:20px">
    <div class="card" style="display:flex;flex-direction:column;align-items:center;gap:10px">
      <div style="position:relative;padding:34px;border:1px dashed #E0005A;border-radius:6px;background:repeating-linear-gradient(45deg,#fff,#fff 6px,#fff0f5 6px,#fff0f5 12px)">
        <div style="background:#fff">{L('lockup-horizontal', h=68)}</div>
      </div>
      <p class="small">Respiro mínimo = <b>½ do diâmetro do símbolo</b> em todos os lados.</p>
    </div>
    <div class="card">
      <h3>Tamanho mínimo</h3>
      <table><tr><th>Peça</th><th>Digital</th><th>Impresso</th></tr>
      <tr><td>Lockup horizontal</td><td>88 px de largura</td><td>22 mm</td></tr>
      <tr><td>Lockup empilhado</td><td>56 px de largura</td><td>14 mm</td></tr>
      <tr><td>Símbolo</td><td>20 px</td><td>6 mm</td></tr>
      <tr><td>Glyph (abaixo de 20 px)</td><td>16 px</td><td>—</td></tr></table>
      <h3 style="margin-top:12px">Fundos permitidos</h3>
      <p>Cream · branco · ink · Pink Clozzy (símbolo branco) · foto com placa sólida.</p>
    </div>
  </div>
  <div class="g4" style="grid-auto-rows:150px">
    <div class="tile x card" style="height:auto">{L('lockup-horizontal', h=40, style='transform:scaleX(1.35) scaleY(.8)')}<span class="cap">1 · esticar</span></div>
    <div class="tile x card">{L('lockup-horizontal', h=36, style='filter:hue-rotate(-75deg)')}<span class="cap">2 · roxo / outra cor</span></div>
    <div class="tile x card">{L('lockup-horizontal', h=36, style='filter:drop-shadow(0 0 8px #ff0065) drop-shadow(0 0 14px #ff0065)')}<span class="cap">3 · glow, sombra, gradiente</span></div>
    <div class="tile x card" style="background:linear-gradient(120deg,#ff7aa8,#7a2b52,#ffc6a5)">{L('lockup-horizontal', h=36)}<span class="cap" style="color:#fff">4 · fundo agitado sem placa</span></div>
  </div>
  <p class="small">Também não: girar o símbolo (a abertura tem lugar fixo) · fechar o C · trocar a estrela por coração/chama · usar “meuclozzy” como logo.</p>
  {foot(7)}
</section>""")

# ------------------------------------------------------------------ 08 cor
def sw(bg, fg, name, hexv, use, border=False):
    b = "border:1px solid var(--cz-line);" if border else ""
    return (f'<div style="background:{bg};color:{fg};border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;justify-content:space-between;{b}">'
            f'<b style="font:800 15px/1.1 var(--cz-font-display)">{name}</b>'
            f'<span style="font-size:10px;line-height:1.45;opacity:.9">{hexv}<br>{use}</span></div>')


pages.append(f"""
<section class="page">
  <span class="eyebrow">06 · Cor</span>
  <h2>Um rosa só, <em>bem usado</em>. Neutros quentes em volta.</h2>
  <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;grid-template-rows:160px 130px;gap:10px">
    <div style="grid-row:span 2;background:var(--cz-pink);border-radius:14px;padding:16px;display:flex;flex-direction:column;justify-content:space-between">
      <b style="font:900 30px/1 var(--cz-font-display);letter-spacing:-.03em">Pink Clozzy</b>
      <span style="font-size:11px;line-height:1.5">#FF0065 · RGB 255 0 101<br>Símbolo, splash, grandes áreas. Texto em <b>ink</b> por cima (5,1:1).<br>Branco por cima só ≥ 24px bold (3,9:1).</span>
    </div>
    {sw('#E0005A', '#fff', 'Pink Deep', '#E0005A', 'Botão + texto branco 4,9:1 · link sobre cream 4,6:1')}
    {sw('#14090F', '#FFF6F0', 'Ink', '#14090F', 'Texto · fundo dark (18:1)')}
    {sw('#FFF6F0', '#14090F', 'Cream', '#FFF6F0', 'Fundo padrão (paper)', True)}
    {sw('#FFD9E7', '#14090F', 'Pink Soft', '#FFD9E7', 'Chip / seleção · texto ink')}
    {sw('#0B7A59', '#fff', 'Acesso', '#0B7A59 · fill #1CCE98', '“Liberado”, sucesso (5,3:1)')}
    {sw('#FFD84D', '#14090F', 'Drop', '#FFD84D', 'Só badge “novo drop”')}
  </div>
  <div class="g2">
    <div class="card">
      <h3>Proporção</h3>
      <div style="display:flex;height:22px;border-radius:999px;overflow:hidden;margin:6px 0 8px">
        <div style="flex:60;background:#FFF6F0;border:1px solid var(--cz-line)"></div><div style="flex:22;background:#14090F"></div><div style="flex:12;background:#FF0065"></div><div style="flex:4;background:#0B7A59"></div><div style="flex:2;background:#FFD84D"></div>
      </div>
      <p class="small">60 cream/branco · 22 ink · 12 pink · 4 acesso · 2 drop. O rosa marca a ação e a marca — nunca vira fundo de tela inteira dentro do produto (só splash e social).</p>
      <p class="small" style="margin-top:6px"><b>Fora da paleta:</b> roxo #7651E9 do site antigo · rosas #FE2C55/#FE2C78/#FF116F (unificados em #FF0065).</p>
    </div>
    <div class="card ink" style="background:#0B0609;color:#FFF6F0;border:none">
      <h3>Dark mode</h3>
      <p class="small" style="color:#b9a7af">Fundo #0B0609 · surface #1A1015 · texto #FFF6F0 (18,9:1) · apoio #B9A7AF (8,8:1) · link #FF5C9D (7:1) · botão Pink Clozzy com texto ink (5,1:1).</p>
      <div class="flex" style="margin-top:10px;gap:10px">
        <span class="btn" style="background:#FF0065;color:#14090F">Comprar · R$ 29,90</span>
        <span style="color:#FF5C9D;font-weight:700;font-size:13px">Ver preview</span>
        <span class="pill" style="background:#1CCE98;color:#14090F">✓ Liberado</span>
      </div>
    </div>
  </div>
  {foot(8)}
</section>""")

# ------------------------------------------------------------------ 09 tipografia
pages.append(f"""
<section class="page">
  <span class="eyebrow">07 · Tipografia</span>
  <h2>Gabarito fala alto. <em>Figtree</em> explica.</h2>
  <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:22px;flex:1">
    <div class="card" style="display:flex;flex-direction:column;justify-content:space-between">
      <div><span class="eyebrow">Display · Gabarito 700–900</span>
      <p style="font:900 112px/.92 var(--cz-font-display);letter-spacing:-.045em;margin-top:10px">Seu close,<br><span style="color:var(--cz-pink-deep)">seu preço.</span></p></div>
      <p style="font:800 22px/1.2 var(--cz-font-display);letter-spacing:-.02em">Aa Bb Cc Ç Ã É 0123456789 R$ ★</p>
      <p class="small">Geométrica e arredondada — herda a familiaridade da Montserrat que o app já usa, mas com terminais mais cheios e personalidade própria. Usada no wordmark, títulos, preços e botões. OFL · Google Fonts.</p>
    </div>
    <div class="card" style="display:flex;flex-direction:column;gap:8px">
      <span class="eyebrow">Texto e UI · Figtree 400–700</span>
      <p style="font-size:15px;line-height:1.5">Pack com 24 fotos e 3 vídeos gravados nos bastidores. O acesso fica na sua biblioteca para sempre, mesmo se a assinatura acabar.</p>
      <table style="margin-top:4px">
        <tr><th>Nível</th><th>Fonte</th><th>Tam./alt.</th></tr>
        <tr><td style="font:900 20px/1 var(--cz-font-display)">Display</td><td>Gabarito 900</td><td>64 / 1,02 · −3%</td></tr>
        <tr><td style="font:800 17px/1 var(--cz-font-display)">H1</td><td>Gabarito 800</td><td>44 / 1,05</td></tr>
        <tr><td style="font:800 15px/1 var(--cz-font-display)">H2</td><td>Gabarito 800</td><td>32 / 1,1</td></tr>
        <tr><td style="font:700 13px/1 var(--cz-font-display)">H3 · preço</td><td>Gabarito 700</td><td>22 / 1,2</td></tr>
        <tr><td>Body</td><td>Figtree 400</td><td>16 / 1,5</td></tr>
        <tr><td style="font-weight:600">Small · label</td><td>Figtree 600</td><td>14 / 1,45</td></tr>
        <tr><td style="font-size:11px">Caption</td><td>Figtree 500</td><td>12 / 1,4</td></tr>
      </table>
      <p class="small">Nunca: Inter/Roboto/Proxima como voz da marca · display em caixa alta corrida (exceto eyebrow em Figtree 700, +12%).</p>
    </div>
  </div>
  {foot(9)}
</section>""")

# ------------------------------------------------------------------ 10 voz
pages.append(f"""
<section class="page">
  <span class="eyebrow">08 · Voz</span>
  <h2>Fala como criador, <em>não como fintech</em>.</h2>
  <div class="g3" style="margin-bottom:6px">
    <div class="card"><h3>Próximo</h3><p>Você/seu. Frases curtas. Fala de gente, não de “usuários”.</p></div>
    <div class="card"><h3>Direto</h3><p>Preço, o que vem e até quando. Sem letra miúda, sem “consulte condições”.</p></div>
    <div class="card"><h3>Discreto</h3><p>Desejo sem vulgaridade. “Exclusivo”, “bastidores”, “só pra quem assina”.</p></div>
  </div>
  <div class="g2" style="align-items:start">
    <div class="card">
      <h3>Escalas</h3>
      <table>
        <tr><td style="width:90px">Formal</td><td><div style="height:6px;background:var(--cz-line);border-radius:9px;position:relative"><i style="position:absolute;left:72%;top:-4px;width:14px;height:14px;border-radius:50%;background:var(--cz-pink)"></i></div></td><td style="width:70px;text-align:right">Casual</td></tr>
        <tr><td>Sério</td><td><div style="height:6px;background:var(--cz-line);border-radius:9px;position:relative"><i style="position:absolute;left:55%;top:-4px;width:14px;height:14px;border-radius:50%;background:var(--cz-pink)"></i></div></td><td style="text-align:right">Brincalhão</td></tr>
        <tr><td>Técnico</td><td><div style="height:6px;background:var(--cz-line);border-radius:9px;position:relative"><i style="position:absolute;left:82%;top:-4px;width:14px;height:14px;border-radius:50%;background:var(--cz-pink)"></i></div></td><td style="text-align:right">Humano</td></tr>
      </table>
      <p class="do">“Seu pack tá no ar. Já pode mandar o link.”</p>
      <p class="do">“Pago no Pix. Liberado na sua biblioteca.”</p>
      <p class="do">“Você só paga se vender.” (mantido do site atual)</p>
      <p class="dont">“Plataforma de conteúdo adulto” · “+18 hot”</p>
      <p class="dont">“Monetize seu engajamento com soluções”</p>
      <p class="dont">Emoji de fogo/berinjela como identidade</p>
    </div>
    <div class="card" style="display:flex;flex-direction:column;gap:10px">
      <h3>Antes → depois</h3>
      <div><p class="small">Site atual</p><p style="text-decoration:line-through;color:var(--cz-muted)">Compartilhe o link do seu Close Friends e ganhe dinheiro com assinaturas dentro das suas redes sociais</p></div>
      <div><p class="small">Clozzy 2028</p><p style="font:800 22px/1.15 var(--cz-font-display);letter-spacing:-.02em">Seu exclusivo tem preço.<br>Monte a vitrine e mande o link.</p></div>
      <div><p class="small">CTA</p><div class="flex" style="gap:10px"><span class="btn btn-primary">Criar minha vitrine</span><span class="btn btn-ghost">Ver como funciona</span></div></div>
      <p class="small">Glossário fixo: exclusivo · oferta · pack · drop · biblioteca · canal (ver visão do produto).</p>
    </div>
  </div>
  {foot(10)}
</section>""")

# ------------------------------------------------------------------ 11 imagery + UI strip
STAR_SVG = '<svg viewBox="0 0 24 24" width="14" height="14"><polygon points="12,2.5 14.6,9 21.5,9.3 16.1,13.6 18,20.3 12,16.4 6,20.3 7.9,13.6 2.5,9.3 9.4,9" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>'
LOCK_SVG = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="3"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>'

pages.append(f"""
<section class="page">
  <span class="eyebrow">09 · Imagem, ícones e UI</span>
  <h2>Mostra o criador. <em>Guarda o exclusivo.</em></h2>
  <div style="display:grid;grid-template-columns:1fr 1.25fr;gap:20px;align-items:start">
    <div style="display:flex;flex-direction:column;gap:12px">
      <div class="card"><h3>Fotografia</h3>
        <p class="do">Criadores reais, luz natural ou de quarto, olhar para a câmera, enquadramento de rosto/meio-corpo.</p>
        <p class="do">Preview bloqueado = <b>placa cream ou pink soft + cadeado</b>, nunca blur pesado sobre nudez.</p>
        <p class="dont">Conteúdo explícito em peça de marca, stock genérico, render 3D, fotorrealismo gerado por IA.</p></div>
      <div class="card"><h3>Ícones</h3>
        <p>Traço 2px · cantos 2px · grid 24 · terminais redondos (conversam com o símbolo). Preenchido só para estado ativo. Estrela preenchida = exclusivo.</p>
        <div class="flex" style="gap:14px;margin-top:8px;color:var(--cz-ink)">{LOCK_SVG}
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l-1 13H7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><path d="M10 9.5l5 2.5-5 2.5z"/></svg>
          <span style="color:var(--cz-pink-deep)">{STAR_SVG.replace('14','22')}</span>
        </div></div>
    </div>
    <div class="card" style="background:#fff;display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start">
      <div style="border:1px solid var(--cz-line);border-radius:18px;overflow:hidden">
        <div style="height:150px;background:var(--cz-pink-soft);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:var(--cz-ink);position:relative">
          {LOCK_SVG}<span style="font-size:11px;font-weight:600">24 fotos · 3 vídeos</span>
          <span class="pill" style="position:absolute;top:10px;left:10px;background:#FFD84D;color:#14090F">Novo drop</span>
        </div>
        <div style="padding:12px">
          <p class="small" style="font-weight:600">@marina</p>
          <p style="font:800 16px/1.15 var(--cz-font-display)">Bastidores do verão</p>
          <div class="flex" style="justify-content:space-between;margin-top:10px"><span style="font:800 18px/1 var(--cz-font-display)">R$ 29,90</span><span class="btn btn-primary" style="padding:9px 14px;font-size:12px">Comprar</span></div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <span class="small" style="font-weight:700">1 · Vitrine → 2 · Compra → 3 · Acesso</span>
        <div style="border:1px solid var(--cz-line);border-radius:14px;padding:12px">
          <p class="small">Pix copiado</p><p style="font:800 15px/1.2 var(--cz-font-display)">Aguardando pagamento…</p>
          <div style="height:6px;border-radius:9px;background:var(--cz-line);margin-top:8px"><div style="width:62%;height:100%;border-radius:9px;background:var(--cz-pink)"></div></div>
        </div>
        <div style="border:1px solid var(--cz-line);border-radius:14px;padding:12px">
          <span class="pill" style="background:#1CCE98;color:#14090F">✓ Acesso liberado</span>
          <p style="font:800 15px/1.2 var(--cz-font-display);margin-top:8px">Bastidores do verão</p>
          <p class="small" style="color:var(--cz-access);font-weight:700">Na sua biblioteca · sem prazo</p>
        </div>
        <div class="flex" style="gap:8px"><span class="pill" style="background:var(--cz-pink-soft);color:#14090F">{STAR_SVG} Exclusivo</span><span class="pill" style="border:1.5px solid var(--cz-ink)">Assinatura</span></div>
        <p class="small">Raios: botão pill · card 18 · chip pill. Sem sombra decorativa; separação por borda #ECDCD8.</p>
      </div>
    </div>
  </div>
  {foot(11)}
</section>""")

# ------------------------------------------------------------------ 12 aplicações
pages.append(f"""
<section class="page">
  <span class="eyebrow">10 · Aplicações</span>
  <h2>Site, app, social. <em>Mesmo círculo.</em></h2>
  <div style="display:grid;grid-template-columns:1.55fr .75fr .75fr;gap:14px;flex:1">
    <div style="border-radius:16px;overflow:hidden;border:1px solid var(--cz-line);background:#fff;display:flex;flex-direction:column">
      <div style="background:#efe4e0;padding:8px 12px;display:flex;align-items:center;gap:8px">
        <i style="width:9px;height:9px;border-radius:50%;background:#d9c6c0"></i><i style="width:9px;height:9px;border-radius:50%;background:#d9c6c0"></i>
        <div style="background:#fff;border-radius:8px 8px 0 0;padding:5px 10px;display:flex;gap:6px;align-items:center;font-size:10px">{L('favicon', h=14)} Clozzy — vitrine do exclusivo</div>
      </div>
      <div style="padding:14px 22px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--cz-line)">{L('lockup-horizontal', h=30)}<div class="flex" style="gap:14px;font-size:12px;font-weight:600">Para criadores <span class="btn btn-ghost" style="padding:8px 14px;font-size:12px">Entrar</span></div></div>
      <div style="flex:1;background:var(--cz-cream);padding:26px 22px;display:flex;flex-direction:column;justify-content:center;gap:12px">
        <p style="font:900 40px/1 var(--cz-font-display);letter-spacing:-.035em">Seu exclusivo tem preço.<br><span style="color:var(--cz-pink-deep)">Monte a vitrine.</span></p>
        <p class="muted" style="font-size:13px">Pack, assinatura ou drop. O fã paga no Pix e abre na hora.</p>
        <div class="flex" style="gap:10px"><span class="btn btn-primary">Criar minha vitrine</span><span class="small">Você só paga se vender</span></div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:14px">
      <div style="flex:1;border-radius:22px;background:var(--cz-pink);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px">
        {L('mark-white', h=70)}<span style="font:900 24px/1 var(--cz-font-display);letter-spacing:-.03em;color:#14090F">clozzy</span>
        <span class="small" style="color:#14090F">splash do app</span>
      </div>
      <div style="background:#fff;border:1px solid var(--cz-line);border-radius:16px;padding:12px;display:grid;grid-template-columns:repeat(4,1fr);gap:10px;justify-items:center">
        <i style="width:38px;height:38px;border-radius:9px;background:#e9dfdc"></i>{L('app-icon-pink', h=38)}<i style="width:38px;height:38px;border-radius:9px;background:#e9dfdc"></i><i style="width:38px;height:38px;border-radius:9px;background:#e9dfdc"></i>
      </div>
    </div>
    <div style="border-radius:22px;background:var(--cz-ink);color:#FFF6F0;padding:18px 16px;display:flex;flex-direction:column;justify-content:space-between">
      <div class="flex" style="gap:8px">{L('avatar-social', h=28)}<span style="font-size:11px;font-weight:700">marina · story</span></div>
      <p style="font:900 30px/1 var(--cz-font-display);letter-spacing:-.03em">Saiu drop novo no meu <span style="color:#FF5C9D">clozzy</span>.</p>
      <div style="background:#FFF6F0;color:#14090F;border-radius:999px;padding:9px 12px;display:flex;gap:8px;align-items:center;font:800 12px/1 var(--cz-font-display)">{L('glyph-pink', h=16)} clozzy.com/marina</div>
    </div>
  </div>
  {foot(12)}
</section>""")

# ------------------------------------------------------------------ 13 motion + IA
pages.append(f"""
<section class="page">
  <span class="eyebrow">11 · Motion e regras de IA</span>
  <h2>Assinatura: <em>abrir o círculo</em>.</h2>
  <div class="g2" style="align-items:start">
    <div class="card" style="display:flex;flex-direction:column;gap:10px">
      <div class="flex" style="gap:18px">
        <div style="text-align:center"><svg viewBox="0 0 100 100" width="58"><circle cx="50" cy="50" r="37" fill="none" stroke="#FF0065" stroke-width="16"/><polygon points="{_logos.star_points()}" fill="#FF0065" stroke="#FF0065" stroke-width="5" stroke-linejoin="round" transform="translate(50 50) scale(.9) translate(-50 -50)"/></svg><p class="small">0 ms · fechado</p></div>
        <div style="text-align:center">{L('mark-pink', h=58, style='transform:rotate(-25deg)')}<p class="small">280 ms</p></div>
        <div style="text-align:center">{L('mark-pink', h=58)}<p class="small">520 ms</p></div>
        <p class="small grow">Anel gira 25° até a abertura parar no lugar; a estrela entra em 0,9 → 1 com <code>--cz-ease-pop</code>. Usada em splash, confirmação de compra e “acesso liberado”. Só uma vez por tela.</p>
      </div>
      <table>
        <tr><th>Token</th><th>Valor</th><th>Uso</th></tr>
        <tr><td><code>--cz-dur-fast</code></td><td>160 ms</td><td>hover, toggle</td></tr>
        <tr><td><code>--cz-dur-default</code></td><td>240 ms</td><td>sheet, card, página</td></tr>
        <tr><td><code>--cz-dur-signature</code></td><td>520 ms</td><td>abrir o círculo</td></tr>
        <tr><td><code>--cz-ease-standard</code></td><td>(.2,0,0,1)</td><td>tudo que não é assinatura</td></tr>
      </table>
      <p class="small"><b>Reduced-motion:</b> todas as durações vão a 0; a assinatura vira fade de 1 quadro. Estado nunca é comunicado só por movimento (o badge “liberado” tem texto + ícone).</p>
      <p class="small"><b>Nunca:</b> girar o logo em loop, pulsar, bounce no wordmark, trocar a cor no meio da animação.</p>
    </div>
    <div class="card">
      <h3>Conteúdo gerado por IA</h3>
      <table>
        <tr><th>Pode sem revisão</th><th>Precisa de humano</th></tr>
        <tr><td>Rascunho de copy na voz deste manual</td><td>Logo, lockup, símbolo novo ou variação</td></tr>
        <tr><td>Layout interno usando só <code>tokens.css</code></td><td>Campanha, anúncio, peça externa</td></tr>
        <tr><td>Ícones no sistema 2px/24</td><td>Qualquer imagem de pessoa</td></tr>
        <tr><td>Traduções e variações de CTA</td><td>Qualquer peça que mostre preview de conteúdo</td></tr>
      </table>
      <p class="dont" style="margin-top:10px">Imagem de pessoa fotorrealista gerada por IA em material de marca (alinha com Fansly/LoyalFans; evita risco de consentimento).</p>
      <p class="dont">Prompt com: roxo-índigo SaaS, orbs, glow neon, 3D plástico, chrome.</p>
      <p class="do">Conteúdo de criador feito com IA: permitido no produto com selo “feito com IA” — regra de produto, decidir no card de políticas.</p>
    </div>
  </div>
  {foot(13)}
</section>""")

# ------------------------------------------------------------------ 14 arquivos
pages.append(f"""
<section class="page ink">
  <span class="eyebrow">12 · Arquivos e próximos passos</span>
  <h2>Tudo em <em>clozzy/marca/identidade-nova/</em>.</h2>
  <div class="g2" style="flex:1">
    <div class="card">
      <table style="color:#FFF6F0">
        <tr><th style="color:#b9a7af;border-color:#FFF6F0">Arquivo</th><th style="color:#b9a7af;border-color:#FFF6F0">O quê</th></tr>
        <tr><td><code>BRAND.md</code></td><td>One-pager para humanos e IA</td></tr>
        <tr><td><code>tokens.css</code></td><td>Cor, tipo, raio, motion, light/dark</td></tr>
        <tr><td><code>motion-guidelines.md</code></td><td>Assinatura + reduced-motion</td></tr>
        <tr><td><code>logos/*.svg</code></td><td>20 masters (mark, glyph, lockups, app, favicon)</td></tr>
        <tr><td><code>export/*.png</code></td><td>App icons 1024/512/192/180 · favicon 32/16 · avatar</td></tr>
        <tr><td><code>fonts/</code></td><td>Gabarito + Figtree (OFL)</td></tr>
        <tr><td><code>_logos.py · _build.py</code></td><td>Regenerar SVG, PNG, HTML e PDF</td></tr>
      </table>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px">
      <div class="card"><h3>Próximos passos</h3>
        <p>1. Aprovar direção B (ou trocar no checkpoint).</p>
        <p>2. Design system de UI (card futuro) a partir de <code>tokens.css</code>.</p>
        <p>3. Migrar performer/front: #FF0065 fica; Montserrat → Gabarito/Figtree; trocar SVGs.</p>
        <p>4. Site: tirar o roxo #7651E9; aplicar hero e CTA deste manual.</p>
        <p>5. Lottie da assinatura (L1) a partir do SVG master.</p></div>
      <div style="margin-top:auto">{L('lockup-horizontal-reversed', h=54)}</div>
    </div>
  </div>
  {foot(14)}
</section>""")

html = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Clozzy 2028 — identidade visual</title><style>{CSS}</style></head><body>{''.join(pages)}</body></html>"""
OUT_HTML.write_text(html)
print("html", OUT_HTML)


def chrome(*args):
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", *args],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


with tempfile.TemporaryDirectory() as td:
    out = os.path.join(td, "out.pdf")
    chrome("--no-pdf-header-footer", f"--print-to-pdf={out}", OUT_HTML.as_uri())
    Path(out).replace(OUT_PDF)
print("pdf", OUT_PDF)

# ---- exports PNG (fundo transparente)
EXPORT.mkdir(exist_ok=True)
for name, sizes in {"app-icon-pink": [1024, 512, 192, 180], "favicon": [32, 16],
                    "avatar-social": [800], "mark-pink": [512], "lockup-horizontal": [1200]}.items():
    for s in sizes:
        src = LOGOS / f"{name}.svg"
        with tempfile.TemporaryDirectory() as td:
            page = Path(td) / "p.html"
            page.write_text(f'<html><body style="margin:0;background:transparent"><img src="{uri(src)}" '
                            f'style="display:block;width:{s}px"></body></html>')
            if name == "lockup-horizontal":
                import re
                vb = re.search(r'viewBox="([^"]+)"', src.read_text()).group(1).split()
                h = round(s * float(vb[3]) / float(vb[2]))
            else:
                h = s
            dst = EXPORT / f"{name}-{s}.png"
            chrome("--default-background-color=00000000", f"--window-size={s},{h}",
                   f"--screenshot={dst}", page.as_uri())
print("export", sorted(p.name for p in EXPORT.iterdir()))

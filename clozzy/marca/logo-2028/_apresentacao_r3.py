#!/usr/bin/env python3
"""Clozzy 2028 — apresentação rodada 3 (8 conceitos + 8 paletas + matriz). Rodar: python3 _apresentacao_r3.py"""
import base64, os, subprocess, tempfile
from pathlib import Path

import _conceitos as R2
import _rodada3 as R3

HERE = Path(__file__).resolve().parent
NOVA = HERE.parent / "identidade-nova"
OUT_HTML = HERE / "apresentacao-logos-clozzy-2028-r3.html"
OUT_PDF = HERE / "apresentacao-logos-clozzy-2028-r3.pdf"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

R2.build()
R3.build()
PAL = R3.PALETTES


def b64(data: bytes, mime):
    return f"data:{mime};base64,{base64.b64encode(data).decode()}"


def svgimg(svg_text, h=None, w=None, style=""):
    st = (f"height:{h}px;" if h else "") + (f"width:{w}px;" if w else "") + style
    return f'<img src="{b64(svg_text.encode(), "image/svg+xml")}" style="{st}" alt="">'


def F(name, **kw):
    return svgimg((R2.OUT / f"{name}.svg").read_text(), **kw)


# símbolos como função cor → corpo SVG (grid 256)
SYM = {s: (lambda c, g=fn(): R3.body(g, c)) for s, *_r, fn in R3.CONCEPTS3}
for s, *_r, fn in R2.CONCEPTS:
    SYM[s] = fn


def mark(slug, color, h):
    return svgimg(R2.svg(SYM[slug](color)), h=h)


def app(slug, pal, h):
    P = PAL[pal]
    return svgimg(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" rx="58" fill="{P["tile"]}"/>'
                  f'<g transform="translate(40 40) scale(.6875)">{SYM[slug](P["on"])}</g></svg>', h=h)


FONTS = (f"@font-face{{font-family:Gabarito;src:url({b64((NOVA / 'fonts/Gabarito-Variable.ttf').read_bytes(), 'font/ttf')});font-weight:400 900}}"
         f"@font-face{{font-family:Figtree;src:url({b64((NOVA / 'fonts/Figtree-Variable.ttf').read_bytes(), 'font/ttf')});font-weight:300 900}}")
CSS = FONTS + """
@page{size:297mm 210mm;margin:0}*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Figtree,system-ui;color:#14090F;background:#2a1f24;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:297mm;height:210mm;padding:13mm 15mm 14mm;position:relative;overflow:hidden;page-break-after:always;background:#FFF6F0;display:flex;flex-direction:column;gap:12px;margin:0 auto 8mm}
@media print{.page{margin:0}}
.eyebrow{font:700 10px/1 Figtree;letter-spacing:.12em;text-transform:uppercase;color:#6B5A62}
h1{font:900 60px/.95 Gabarito;letter-spacing:-.04em}h2{font:800 30px/1.05 Gabarito;letter-spacing:-.03em}h2 em{font-style:normal;color:#E0005A}
h3{font:800 19px/1.1 Gabarito;letter-spacing:-.02em}
p,td{font-size:11.5px;line-height:1.45}.small{font-size:9.5px;line-height:1.4;color:#6B5A62}
.card{background:#fff;border:1px solid #ECDCD8;border-radius:16px;padding:14px}
.tile{border-radius:12px;display:flex;align-items:center;justify-content:center}
.foot{position:absolute;left:15mm;right:15mm;bottom:6mm;display:flex;justify-content:space-between;font-size:9px;color:#6B5A62}
.tag{display:inline-block;font:800 10px/1 Gabarito;padding:4px 8px;border-radius:999px;background:#FFD9E7;vertical-align:middle}
table{border-collapse:collapse}td,th{padding:5px 6px;text-align:center}
th{font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:#6B5A62;font-weight:700}
"""


def foot(n):
    return f'<div class="foot"><span>Clozzy 2028 · logos · rodada 3 · cor · nov/2026</span><span>{n:02d}</span></div>'


NOTES = {
    "r3-i-pulseira": ("Fala de VIP, lista, “tá dentro” · forma inédita na categoria", "Lê como anel/crachá; pode lembrar assento sanitário; fraca em 16 px", (4, 4, 2, 4, 2)),
    "r3-j-chave": ("Acesso literal mas com twist (estrela = cabeça da chave)", "Some em 16 px; chave pode parecer “varinha mágica”", (4, 4, 2, 4, 3)),
    "r3-k-estrela-aberta": ("Estrela + c numa forma só · fortíssima em 16 px · mantém equity", "Estrela com letra dentro é um tipo comum de selo; o c precisa de refino óptico", (4, 4, 5, 4, 5)),
    "r3-l-abraco": ("Close + cozy num gesto · muito própria · ótima para motion (braços fecham)", "Pode lembrar ícone de “transmitindo/rádio” (•)", (5, 4, 4, 4, 4)),
    "r3-m-liberado": ("Diz “acesso liberado” na linguagem de UI", "Interruptor é ícone genérico de configurações", (4, 2, 4, 4, 3)),
    "r3-n-drop": ("Novidade, unboxing, drop", "Caixa de presente é comum (e-commerce); estrela pequena em 16 px", (3, 2, 3, 4, 3)),
    "r3-o-ingresso-zz": ("Junta as duas melhores da rodada 2: produto (ingresso) + nome (zz)", "Sem estrela; o zz vazado precisa de refino em 16 px", (5, 4, 4, 5, 3)),
    "r3-p-o-estrela": ("Wordmark carrega o símbolo; ícone = o “o” do nome", "O ícone isolado volta a parecer o Close Friends/estrela no círculo", (4, 3, 4, 4, 5)),
}
REC = {"r3-l-abraco", "r3-k-estrela-aberta", "r3-o-ingresso-zz"}

pages = []
# capa
cover = "".join(f'<div style="display:flex;flex-direction:column;align-items:center;gap:6px">{app(s, pal, 92)}'
                f'<span class="small">{PAL[pal]["name"]}</span></div>' for s, _n, _k, pal, *_ in R3.CONCEPTS3)
pages.append(f"""<section class="page" style="justify-content:space-between">
<span class="eyebrow">Clozzy 2028 · logos · rodada 3</span>
<div style="display:grid;grid-template-columns:repeat(8,1fr);gap:10px">{cover}</div>
<div><h1>Mais 8 símbolos.<br><span style="color:#E0005A">8 paletas.</span></h1>
<p style="font-size:14px;margin-top:10px;max-width:700px">Rodada 3 do método 04-logos: novos conceitos (pulseira, chave, estrela aberta, abraço, liberado, drop, ingresso zz, o-estrela) e exploração de cor além do magenta, com contraste e risco de categoria.</p></div>
{foot(1)}</section>""")

# paletas
sw = ""
for key, P in PAL.items():
    sw += f"""<div class="card" style="padding:10px;display:flex;flex-direction:column;gap:8px">
<div style="display:flex;gap:8px;align-items:center">{app("r3-l-abraco", key, 76)}{app("d-ingresso", key, 76)}
<div style="display:flex;flex-direction:column;gap:3px">
<span style="display:flex;gap:4px">{''.join(f'<i style="width:18px;height:18px;border-radius:5px;background:{c};border:1px solid #ECDCD8;display:inline-block"></i>' for c in dict.fromkeys([P['tile'], P['on'], P['main']]))}</span>
<span class="small">{P['tile']} · {P['on']}</span></div></div>
<h3 style="font-size:15px">{P['name']}</h3><p class="small">{P['note']}</p></div>"""
pages.append(f"""<section class="page"><span class="eyebrow">01 · Exploração de cor</span>
<h2>Além do magenta: <em>8 direções de cor</em>.</h2>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">{sw}</div>
<p class="small">Evitado de propósito: roxo/índigo (cluster SaaS e do site antigo), neon sobre preto (cluster adulto), gradientes. Azul (Cobalto) e verde (Close Verde) entram com risco anotado: OnlyFans é azul, Privacy é verde.</p>
{foot(2)}</section>""")

# conceitos 2 por página
LET = "IJKLMNOP"
for k in range(0, 8, 2):
    blocks = ""
    for i in (k, k + 1):
        slug, name, kind, pal, idea, _fn = R3.CONCEPTS3[i]
        P = PAL[pal]
        pro, risk, sc = NOTES[slug]
        tag = ' <span class="tag">shortlist</span>' if slug in REC else ""
        lock = (F("r3-p-o-estrela-wordmark-color", h=34) if slug == "r3-p-o-estrela" else F(f"{slug}-lockup-color", h=34))
        blocks += f"""<div class="card" style="display:grid;grid-template-columns:190px 1fr;gap:16px;flex:1">
<div class="tile" style="background:{P['tile']}">{mark(slug, P['on'], 140)}</div>
<div style="display:flex;flex-direction:column;gap:8px">
<div><span class="eyebrow">{LET[i]} · {kind} · cor: {P['name']}</span><h3 style="margin-top:4px">{name}{tag}</h3></div>
<p style="font-size:13px"><b>{idea}</b></p>
<p class="small"><b style="color:#0B7A59">+</b> {pro}<br><b style="color:#C4162A">−</b> {risk}</p>
<div style="display:flex;gap:10px;align-items:center;margin-top:auto">
{app(slug, pal, 52)}{app(slug, 'pink', 52)}
<div class="tile" style="background:#fff;border:1px solid #ECDCD8;width:52px;height:52px;flex-direction:column;gap:3px">{F(slug, h=16)}<span style="font-size:7px;color:#6B5A62">16px</span></div>
<div style="background:#fff;border:1px solid #ECDCD8;border-radius:12px;padding:8px 12px;height:52px;display:flex;align-items:center">{lock}</div>
<div style="margin-left:auto;text-align:right"><span style="font:900 22px/1 Gabarito">{sum(sc)}</span><span class="small">/25</span></div>
</div></div></div>"""
    pages.append(f"""<section class="page"><span class="eyebrow">{2 + k // 2:02d} · Conceitos {LET[k]}–{LET[k + 1]}</span>
<div style="display:flex;flex-direction:column;gap:12px;flex:1">{blocks}</div>{foot(3 + k // 2)}</section>""")

# matriz símbolo × cor (shortlist das rodadas 2 e 3)
SHORT = [("b-circulo", "Círculo próximo (atual)"), ("d-ingresso", "Ingresso (r2)"), ("j-costura", "Costura zz (r2)"),
         ("r3-k-estrela-aberta", "Estrela aberta"), ("r3-l-abraco", "Abraço"), ("r3-o-ingresso-zz", "Ingresso zz")]
head = "".join(f"<th>{PAL[p]['name']}</th>" for p in PAL)
rows = "".join(f"<tr><td style='text-align:left;font:800 12px Gabarito;white-space:nowrap'>{n}</td>"
               + "".join(f"<td>{app(s, p, 50)}</td>" for p in PAL) + "</tr>" for s, n in SHORT)
pages.append(f"""<section class="page"><span class="eyebrow">07 · Matriz símbolo × cor</span>
<h2>Shortlist das rodadas 2 e 3 <em>em todas as cores</em>.</h2>
<div class="card" style="padding:8px 10px"><table style="width:100%"><tr><th></th>{head}</tr>{rows}</table></div>
<p class="small">Use para escolher símbolo e cor separadamente: a forma tem que funcionar em qualquer coluna; a cor muda o tom (Pink = continuidade · Batom = premium · Laranja = energia · Cereja/Cacau = sensual e quente · Cobalto/Verde = fora da curva, com risco de concorrente).</p>
{foot(7)}</section>""")

# recomendação
pages.append(f"""<section class="page"><span class="eyebrow">08 · Recomendação</span>
<h2>Três finalistas de forma, <em>três apostas de cor</em>.</h2>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;align-items:start">
<div class="card" style="display:flex;flex-direction:column;gap:10px"><div style="display:flex;gap:8px">{app('r3-l-abraco', 'pink', 76)}{app('r3-l-abraco', 'laranja', 76)}{app('r3-l-abraco', 'cereja', 76)}</div>
<h3>L · Abraço <span class="tag">favorito</span></h3><p>A ideia mais própria da rodada: “close + cozy” num gesto, com a estrela no centro. Silhueta única em 16 px e animação natural (os braços se fecham = acesso liberado).</p></div>
<div class="card" style="display:flex;flex-direction:column;gap:10px"><div style="display:flex;gap:8px">{app('r3-k-estrela-aberta', 'pink', 76)}{app('r3-k-estrela-aberta', 'batom', 76)}{app('r3-k-estrela-aberta', 'manteiga', 76)}</div>
<h3>K · Estrela aberta</h3><p>A mais forte em tamanho pequeno e a que mais preserva o que o público conhece (estrela) — agora com o c dentro. Caminho de evolução mais seguro.</p></div>
<div class="card" style="display:flex;flex-direction:column;gap:10px"><div style="display:flex;gap:8px">{app('r3-o-ingresso-zz', 'pink', 76)}{app('r3-o-ingresso-zz', 'cobalto', 76)}{app('r3-o-ingresso-zz', 'cacau', 76)}</div>
<h3>O · Ingresso zz</h3><p>Une produto (ingresso = compra + acesso) e nome (zz). A mais “marca de varejo”; perde a estrela.</p></div>
</div>
<div class="card" style="background:#14090F;color:#FFF6F0;border:none"><p><b>Cor:</b> manter <b>Pink Clozzy</b> como principal (equity + contraste já validado) e testar <b>Laranja Drop</b> ou <b>Cereja</b> como alternativa se a ideia for se afastar do rosa da concorrência. Cobalto e Verde ficam como aposta, com o risco de lembrar OnlyFans e Privacy.</p></div>
{foot(8)}</section>""")

OUT_HTML.write_text(f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy 2028 — logos rodada 3</title><style>{CSS}</style></head><body>{"".join(pages)}</body></html>')
with tempfile.TemporaryDirectory() as td:
    out = os.path.join(td, "o.pdf")
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer", f"--print-to-pdf={out}", OUT_HTML.as_uri()],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    Path(out).replace(OUT_PDF)
print("ok")

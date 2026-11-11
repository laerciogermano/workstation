#!/usr/bin/env python3
"""Clozzy 2028 — apresentação da rodada 2 de logos (HTML + PDF A4 paisagem). Rodar: python3 _apresentacao.py"""
import base64, os, subprocess, tempfile
from pathlib import Path

import _conceitos as C

HERE = Path(__file__).resolve().parent
NOVA = HERE.parent / "identidade-nova"
OUT_HTML = HERE / "apresentacao-logos-clozzy-2028.html"
OUT_PDF = HERE / "apresentacao-logos-clozzy-2028.pdf"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

C.build()


def uri(p: Path):
    mime = {".svg": "image/svg+xml", ".ttf": "font/ttf", ".png": "image/png"}[p.suffix]
    return f"data:{mime};base64,{base64.b64encode(p.read_bytes()).decode()}"


def I(name, h=None, w=None, style=""):
    st = (f"height:{h}px;" if h else "") + (f"width:{w}px;" if w else "") + style
    return f'<img src="{uri(C.OUT / (name + ".svg"))}" style="{st}" alt="">'


# notas: ideia, por que funciona, risco honesto, scores (ideia, distinção, 16px, relevância, equity)
NOTES = {
    "b-circulo": ("Mantém tudo que o público já reconhece e dá um gesto novo à estrela.",
                  "Herda magenta + estrela do Figma 289 · o C dá a inicial · já está no kit da identidade nova",
                  "Lembra ícone de “recarregar”/power em tamanho pequeno.", (4, 4, 4, 4, 5)),
    "d-ingresso": ("Compra e acesso numa forma só: o ticket que você compra e que te deixa entrar.",
                   "Fala do fluxo vitrine → compra → acesso · lê em 16px · funciona como botão, selo e app icon",
                   "Ingresso é comum em apps de eventos; precisa do magenta e do wordmark para ser “Clozzy”.", (4, 3, 5, 5, 3)),
    "e-etiqueta": ("Etiqueta de preço com a estrela como furo: o exclusivo é produto, tem preço.",
                   "Princípio nº 1 da visão (“exclusivo é produto”) · diagonal dá movimento",
                   "Perto do ícone genérico de “tag” das UIs; em 16px vira um losango.", (4, 4, 3, 5, 3)),
    "f-bastidores": ("A cortina se abre e a estrela aparece: o conteúdo por trás.",
                     "Narrativa forte (“por trás das cortinas” está no README) · silhueta própria na categoria",
                     "Lê como “A”/“M”; “abrir a cortina” pode soar como striptease.", (4, 4, 3, 4, 2)),
    "g-cometa": ("O c é o rastro; a estrela na ponta é o drop chegando.",
                 "Usa a inicial · sugere movimento/novidade",
                 "Lê como ícone de “recarregar” — falha no teste de leitura. Não recomendo.", (3, 2, 3, 3, 4)),
    "h-entre-nos": ("Dois círculos (criador e fã); o exclusivo mora na interseção.",
                    "Ideia de relação/proximidade bem clara",
                    "Venn/alianças: perto de Mastercard e de motivos “V Balls”; estrela some em 16px.", (4, 2, 2, 4, 2)),
    "i-vitrine": ("Janela de loja em arco com a estrela em exposição.",
                  "Literal ao conceito de vitrine · contorno funciona em 1 cor",
                  "Lê como porta, caixa de correio ou lápide; pouco distinto.", (3, 3, 3, 4, 2)),
    "j-costura": ("Os dois z de clozzy dividem as barras: um só traço, um ponto de costura.",
                  "Sai do nome (o traço mais único de “clozzy”) · forte em 16px · vira padrão gráfico",
                  "“zz” também é “dormindo” (Zzz); sem a estrela, perde o reconhecimento atual.", (4, 4, 5, 3, 4)),
}
CRIT = ["Ideia", "Distinção", "16 px", "Relevância", "Equity"]
LET = "ABCDEFGH"

FONTS = (f"@font-face{{font-family:Gabarito;src:url({uri(NOVA / 'fonts/Gabarito-Variable.ttf')});font-weight:400 900}}"
         f"@font-face{{font-family:Figtree;src:url({uri(NOVA / 'fonts/Figtree-Variable.ttf')});font-weight:300 900}}")

CSS = FONTS + """
@page{size:297mm 210mm;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Figtree,system-ui,sans-serif;color:#14090F;background:#2a1f24;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:297mm;height:210mm;padding:13mm 15mm 14mm;position:relative;overflow:hidden;page-break-after:always;background:#FFF6F0;display:flex;flex-direction:column;gap:12px;margin:0 auto 8mm}
@media print{.page{margin:0}}
.pink{background:#FF0065}
.eyebrow{font:700 10px/1 Figtree;letter-spacing:.12em;text-transform:uppercase;color:#6B5A62}
.pink .eyebrow{color:#14090F}
h1{font:900 64px/.95 Gabarito;letter-spacing:-.04em}
h2{font:800 30px/1.05 Gabarito;letter-spacing:-.03em}
h2 em{font-style:normal;color:#E0005A}
h3{font:800 20px/1.1 Gabarito;letter-spacing:-.02em}
p,li,td{font-size:11.5px;line-height:1.45}
.small{font-size:9.5px;line-height:1.4;color:#6B5A62}
.card{background:#fff;border:1px solid #ECDCD8;border-radius:16px;padding:14px}
.foot{position:absolute;left:15mm;right:15mm;bottom:6mm;display:flex;justify-content:space-between;font-size:9px;color:#6B5A62}
.pink .foot{color:#14090F}
table{border-collapse:collapse;width:100%}
th{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:#6B5A62;text-align:left;padding:6px;border-bottom:1.5px solid #14090F}
td{padding:6px;border-bottom:1px solid #ECDCD8;vertical-align:middle}
.tag{display:inline-block;font:800 10px/1 Gabarito;padding:4px 8px;border-radius:999px;background:#FFD9E7}
.rec{background:#14090F;color:#FFF6F0}
.row{display:grid;grid-template-columns:200px 1fr;gap:16px}
.ctx{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.tile{border-radius:12px;display:flex;align-items:center;justify-content:center}
.dots{white-space:nowrap}.dots i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#ECDCD8;margin-right:2px}
.dots i.on{background:#FF0065}
"""


def foot(n):
    return f'<div class="foot"><span>Clozzy 2028 · logos · rodada 2 · nov/2026</span><span>{n:02d}</span></div>'


def dots(v):
    return '<span class="dots">' + "".join(f'<i class="{"on" if k < v else ""}"></i>' for k in range(5)) + "</span>"


pages = []
pages.append(f"""<section class="page pink" style="justify-content:space-between">
<span class="eyebrow">Clozzy 2028 · logos · rodada 2</span>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:22px;justify-items:center">
{''.join(I(s + '-white', h=120) for s, *_ in C.CONCEPTS)}</div>
<div><h1>8 caminhos<br>para o símbolo.</h1>
<p style="font-size:14px;margin-top:10px;max-width:640px">Método <b>04-logos</b>: brief → clichês → word map → longlist → 8 construídos em SVG → testes (16 px, 1 cor, leitura) → checkpoint. Paleta e tipo vêm da <b>identidade nova</b>.</p></div>
{foot(1)}</section>""")

pages.append(f"""<section class="page">
<span class="eyebrow">01 · Brief, clichês e word map</span>
<h2>Identificar, <em>não explicar</em>.</h2>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;align-items:start">
<div class="card"><h3>Brief</h3>
<p><b>Nome:</b> clozzy (caixa baixa)<br><b>O quê:</b> vitrine onde influencers vendem exclusivo e o fã compra e acessa<br><b>Para quem:</b> criadores BR + fãs<br><b>Adjetivos:</b> próximo · direto · confiante · discreto<br><b>Promessa:</b> comprou, abriu<br><b>Onde:</b> favicon, app icon, avatar IG/TikTok, header, link na bio<br><b>Cor:</b> Pink #FF0065 (equity) · ink · cream<br><b>Proibido:</b> roxo, glow, 3D</p></div>
<div class="card"><h3>Clichês da categoria (evitar)</h3>
<p>Cadeado · buraco de fechadura (OnlyFans) · coração · chama (já usada nos boards antigos) · lábios · olho/espiar · coroa · diamante · play · monograma “F” · dark + ciano/rosa/roxo neon.</p>
<h3 style="margin-top:12px">Saturados 2026 (LogoLounge)</h3>
<p>V Balls · Echo Arcs · Faders/aperture IA · Tri-Link “conexão”. O F (Entre nós) chega perto de V Balls/Venn: sinalizado.</p></div>
<div class="card"><h3>Word map</h3>
<p><b>clozzy</b> = <i>close</i> + <i>cozy</i> → círculo, perto, lista, abraço<br>
<b>exclusivo</b> → bastidores, cortina, VIP, ingresso, drop<br>
<b>vitrine</b> → janela, etiqueta, preço, produto<br>
<b>acesso</b> → abrir, entrar, liberar<br>
<b>fã</b> → estrela (fã de uma estrela) · Close Friends ★</p>
<p class="small" style="margin-top:8px">Interseções circuladas: <b>estrela + abrir</b> (A, D) · <b>estrela + produto</b> (B, C, G) · <b>o nome</b> (E, H) · <b>relação</b> (F).</p></div>
</div>{foot(2)}</section>""")


def concept_block(i, slug, name, kind, idea):
    why, pro, risk, sc = NOTES[slug][0], NOTES[slug][1], NOTES[slug][2], NOTES[slug][3]
    total = sum(sc)
    rec = ' <span class="tag">recomendado</span>' if slug == "d-ingresso" else (' <span class="tag" style="background:#ECDCD8">base atual</span>' if slug == "b-circulo" else "")
    return f"""<div class="card" style="display:grid;grid-template-columns:190px 1fr;gap:16px;flex:1">
<div class="tile" style="background:#FFF6F0">{I(slug + '-color', h=150)}</div>
<div style="display:flex;flex-direction:column;gap:8px">
<div><span class="eyebrow">{LET[i]} · {kind}</span><h3 style="margin-top:4px">{name}{rec}</h3></div>
<p style="font-size:13px"><b>{idea}</b></p>
<p class="small"><b style="color:#0B7A59">+</b> {pro}<br><b style="color:#C4162A">−</b> {risk}</p>
<div class="ctx" style="margin-top:auto">
{I(slug + '-app', h=52)}
<div class="tile" style="background:#14090F;width:52px;height:52px">{I(slug + '-color', h=34)}</div>
<div class="tile" style="background:#fff;border:1px solid #ECDCD8;width:52px;height:52px;flex-direction:column;gap:3px">{I(slug, h=16)}<span style="font-size:7px;color:#6B5A62">16px</span></div>
<div style="background:#fff;border:1px solid #ECDCD8;border-radius:12px;padding:8px 12px;height:52px;display:flex;align-items:center">{I(slug + '-lockup-color', h=34)}</div>
<div style="margin-left:auto;text-align:right"><span style="font:900 22px/1 Gabarito">{total}</span><span class="small">/25</span></div>
</div></div></div>"""


for k in range(0, 8, 2):
    blocks = "".join(concept_block(i, *C.CONCEPTS[i][:4]) for i in (k, k + 1))
    pages.append(f"""<section class="page"><span class="eyebrow">{2 + k // 2:02d} · Conceitos {LET[k]}–{LET[k + 1]}</span>
<div style="display:flex;flex-direction:column;gap:12px;flex:1">{blocks}</div>{foot(3 + k // 2)}</section>""")

rows = ""
for i, (slug, name, kind, *_r) in enumerate(C.CONCEPTS):
    sc = NOTES[slug][3]
    rows += (f"<tr><td>{I(slug + '-color', h=28)}</td><td><b>{LET[i]} · {name}</b><br><span class='small'>{kind}</span></td>"
             + "".join(f"<td>{dots(v)}</td>" for v in sc) + f"<td style='font:900 16px Gabarito'>{sum(sc)}</td></tr>")

pages.append(f"""<section class="page">
<span class="eyebrow">07 · Comparativo e recomendação</span>
<h2>Shortlist: <em>Ingresso</em>, Costura zz e o Círculo atual.</h2>
<div style="display:grid;grid-template-columns:1.35fr 1fr;gap:14px;flex:1">
<div class="card"><table><tr><th></th><th>Conceito</th>{''.join(f'<th>{c}</th>' for c in CRIT)}<th>Σ</th></tr>{rows}</table>
<p class="small" style="margin-top:8px">Notas de 1 a 5, minhas, para orientar. Equity = quanto aproveita do que o público já reconhece (magenta, estrela, nome).</p></div>
<div style="display:flex;flex-direction:column;gap:12px">
<div class="card rec"><span class="eyebrow" style="color:#B9A7AF">Recomendação</span>
<h3 style="margin:6px 0">B · Ingresso</h3>
<p>Entre os novos, é o que melhor diz o produto (vitrine → compra → <b>acesso</b>), passa em 16 px e funciona como app icon, selo de “acesso liberado” e botão. Mantém a estrela e o magenta.</p>
<p class="small" style="color:#B9A7AF;margin-top:6px">Risco: ingresso é comum em apps de eventos. Mitigação: estrela + magenta + wordmark Gabarito sempre juntos no lockup.</p></div>
<div class="card"><h3>Alternativas fortes</h3>
<p><b>H · Costura zz</b>: a mais própria (sai do nome); ótima como padrão gráfico mesmo se outro símbolo vencer.<br>
<b>A · Círculo próximo</b>: o caminho seguro, já aplicado no kit.</p>
<p class="small" style="margin-top:6px">Descartar: E (lê “recarregar”), F (Venn/Mastercard), G (porta/lápide).</p></div>
<div class="flex" style="display:flex;gap:10px;align-items:center">{I('d-ingresso-lockup-color', h=46)}</div>
</div></div>{foot(7)}</section>""")

pages.append(f"""<section class="page pink" style="justify-content:space-between">
<span class="eyebrow">08 · Checkpoint</span>
<div><h1 style="font-size:52px">Qual direção segue<br>para o kit completo?</h1>
<p style="font-size:14px;margin-top:12px;max-width:700px">Kit (só depois da escolha): refino óptico + corte de 16 px · versões cor/mono/reversa · lockups horizontal e empilhado · favicon, app icon e web icons · atualização do manual <b>identidade-nova</b> (páginas de símbolo, família e aplicações).</p></div>
<div style="display:flex;gap:18px">{I('d-ingresso-white', h=80)}{I('j-costura-white', h=80)}{I('b-circulo-white', h=80)}</div>
{foot(8)}</section>""")

OUT_HTML.write_text(f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy 2028 — logos rodada 2</title>'
                    f'<style>{CSS}</style></head><body>{"".join(pages)}</body></html>')
with tempfile.TemporaryDirectory() as td:
    out = os.path.join(td, "o.pdf")
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer", f"--print-to-pdf={out}",
                    OUT_HTML.as_uri()], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    Path(out).replace(OUT_PDF)
print("ok", OUT_HTML.name, OUT_PDF.name)

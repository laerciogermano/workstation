#!/usr/bin/env python3
"""RolêGo — documento de identidade visual FINAL v2 (A4 paisagem, HTML self-contained → PDF).
Base: manual v5 (../identidade-v5-gomosa: logo gomosa, roxo + ciano, fotos de festa), executado sem gravar a saída.
Roxo e ciano são as cores principais. Melancia #FF4D6A é a terceira cor: só texto ou detalhe, nunca fundo.
Camada de dia em _dia.py e _paginas.py. Rodar: python3 _build.py (--no-pdf só gera o HTML)"""
import os, sys

OUT = os.path.dirname(os.path.abspath(__file__))
V5 = os.path.normpath(os.path.join(OUT, "..", "identidade-v5-gomosa"))
sys.path.insert(0, V5)
from _common import *  # noqa: E402,F403  (HERE = pasta do v5: SVGs gomosos e fotos)

NOME = "identidade-visual-final-v2-rolego"
OUT_HTML = os.path.join(OUT, NOME + ".html")
OUT_PDF = os.path.join(OUT, NOME + ".pdf")
FOOT = "RolêGo · identidade visual final · v2 · nov/2026"

# ---------------------------------------------------------------- páginas do v5
_marca = "# ---------------------------------------------------------------- numeração e sumário"
_src = open(os.path.join(V5, "_build.py")).read()
assert _marca in _src
NS = {"__name__": "v5", "__file__": os.path.join(V5, "_build.py")}
exec(_src.split(_marca)[0], NS)
V = {t: h for t, h in NS["pages"] if t and t != "__TOC__"}
icon = NS["icon"]


def I(f, h=None, w=None, cls="", style=""):
    return img(f, h=h, w=w, cls=cls, style=style)


def F(name, w=900):
    return foto(name, w)


def FS(name, w=900):
    return foto(os.path.normpath(os.path.join(OUT, "..", "fotos-sunset", name + ".jpg")), w)


def AV(*names):
    return "".join(f'<i style="background-image:url({F(n, 80)})"></i>' for n in names)


def phone(inner, w=200, h=410, bg="#000", style=""):
    return f'<div class="um-phone" style="width:{w}px;height:{h}px;{style}"><div class="um-scr" style="background:{bg}">{inner}</div></div>'


def P(cls, title, lead, body):
    return (f'<section class="page {cls}"><div class="eyebrow">@@E@@ · {title.split(" · ")[0].split(":")[0]}</div><h2>{title}</h2><p class="um-lead">{lead}</p>{body}'
            f'<div class="foot"><span>{FOOT}</span><span>@@N@@</span></div></section>')


for _f in ("_dia.py", "_paginas.py"):
    exec(compile(open(os.path.join(OUT, _f)).read(), _f, "exec"))


# ---------------------------------------------------------------- ajustes nas páginas do v5
def sub(titulo, old, new):
    """Troca um trecho de uma página do v5; falha alto se o v5 mudar e o trecho sumir."""
    assert old in V[titulo], f"{titulo}: trecho não encontrado: {old[:70]}"
    V[titulo] = V[titulo].replace(old, new, 1)


def page_class(titulo, cls):
    sub(titulo, '<section class="page ', f'<section class="page {cls} ')


sub("Essência", '</div><div class="ess-r">', '<div class="kv"><span>Cores</span><p><b>Roxo</b> e <b>ciano</b> são as principais, de dia e de noite, com preto e branco. A <b>melancia</b> é a terceira cor: só texto ou detalhe.</p></div></div><div class="ess-r">')
page_class("Logo · sistema", "l4")

# usos incorretos: os dois erros com a terceira cor
page_class("Usos incorretos", "w5")
_go_mel = recolor("v4-lockup-purple.svg", {"#00E5E5": MEL})
_ciano_claro = recolor("v4-lockup-purple.svg", {"#FFFFFF": INK})
_errados = (f'<div class="wt"><div class="wtv" style="background:#fff"><img src="{_ciano_claro}" style="height:60px">{NS["x_mark"]()}</div><b>Ciano no branco</b></div>'
            f'<div class="wt"><div class="wtv purple"><img src="{_go_mel}" style="height:60px">{NS["x_mark"]()}</div><b>Melancia no logo</b></div>')
sub("Usos incorretos", '</div><p class="note" style="margin-top:4px">', _errados + '</div><p class="note" style="margin-top:4px">')

# cores principais: melancia entra como terceira cor (amostra em preto com um ponto, para não sugerir fundo)
T = "Cores principais"
page_class(T, "c10")
sub(T, "Roxo é superfície. Ciano é o Go.", "Roxo é superfície. Ciano é o Go. Melancia é detalhe.")
_bar = V[T].index('<div class="bar">'); _fim = V[T].index('</div>', _bar)
_seg = lambda f, bg, fg, t: f'<i style="flex:{f};background:{bg};color:{fg}">{t}</i>'
V[T] = (V[T][:_bar] + '<div class="bar">' + _seg(45, PURPLE, "#fff", "45 roxo") + _seg(30, "#000", "#fff", "30 preto") + _seg(15, "#F4F4F8", INK, "15 claro")
        + _seg(7, CY, INK, "7") + '<i style="flex:3;padding:0;background:#FF4D6A"></i>' + V[T][_fim:])
sub(T, '<p class="note">Degradê só nesses dois.', '<p class="note">Melancia até 3%, nunca como fundo. Degradê só nesses dois.')
_p = V[T].split('<div class="sw">')
assert len(_p) == 10
_mel_sw = (f'<div class="swc" style="background:#000;color:{MEL};position:relative"><i style="position:absolute;right:8px;top:8px;width:16px;height:16px;border-radius:50%;background:{MEL}"></i><b>Melancia</b></div>'
           '<code>#FF4D6A</code><span>RGB 255 77 106</span><p>3ª cor: só texto e detalhe, nunca fundo</p></div>')
_p.insert(5, _mel_sw)
V[T] = '<div class="sw">'.join(_p)

sub("Cores de apoio e contraste", '<div class="foot">', '<p class="note" style="margin-top:auto;margin-bottom:6px"><b>Magenta não é melancia.</b> #FF1F7A é código de categoria (social). A melancia #FF4D6A é a terceira cor da marca e tem página própria, com a tabela de contraste.</p><div class="foot">')
sub("Fotografia e ícones", "A galera, de noite, em movimento", "De noite: a galera em movimento")
sub("Fotografia · quem aparece", "Se a foto puxa pra verde, amarelo ou laranja, não entra.", "De noite, foto que puxa pra verde, amarelo ou laranja não entra (de dia, ver Rolês de dia).")
sub("Acessibilidade e IA", "<li>Ciano no roxo só em título grande e no Go.</li>", "<li>Ciano no roxo só em título grande e no Go.</li><li>Texto melancia só no preto ou em foto escurecida; no branco, só título grande; nunca no roxo.</li>")
sub("Acessibilidade e IA", "<li>Foto com degradê atrás do logo</li>", "<li>Foto com degradê, véu ou bloco atrás do logo</li><li>Melancia só em detalhe, nunca no fundo</li>")

# ---------------------------------------------------------------- ordem, numeração e sumário
v5 = lambda t, nome=None: (nome or t, V[t])
novo = lambda t, fn: (t, fn())
CAPITULOS = [
    ("Fundamentos", [v5("Essência"), novo("Assinatura: noite e dia", pg_assinatura), v5("Logo · sistema"), v5("Construção e área de proteção"), v5("Usos incorretos"), v5("Slogan"),
                     v5("Cores principais"), novo("Terceira cor · melancia", pg_cor_dia), v5("Cores de apoio e contraste"), v5("Tipografia"), v5("Elementos gráficos"),
                     novo("Dia e noite", pg_dia_noite)]),
    ("Linguagem", [v5("Fotografia e ícones"), v5("Fotografia · quem aparece"), v5("Fotografia · tratamento"), novo("Rolês de dia · ícones e fotos", pg_role_dia), v5("Voz e tom"), v5("Motion")]),
    ("Produto", [v5("Interface"), v5("App"), novo("App · rolês de dia", pg_app_dia)]),
    ("Redes sociais", [v5("Feed · templates"), v5("Feed · posts com foto"), v5("Stories"), v5("Stories · com foto"), novo("Feed e stories · de dia", pg_redes_dia),
                       v5("Redes · perfil, anúncio e WhatsApp")]),
    ("Mundo físico", [v5("Look do rolê · roupas"), v5("Merch · vestir"), v5("Merch · levar"), v5("Na festa"), v5("No rolê · evento"), novo("Rolê de dia · merch e praia", pg_fisico_dia),
                      v5("Campanha · foto + marca"), v5("Rua · mídia exterior"), v5("Institucional")]),
    ("Regras", [v5("Acessibilidade e IA")]),
]
_usadas = {h for _, itens in CAPITULOS for _, h in itens}
_fora = [t for t, h in V.items() if h not in _usadas]
assert not _fora, f"páginas do v5 fora da ordem: {_fora}"

n, toc, corpo = 3, [], []
for cap, itens in CAPITULOS:
    toc.append(f"<h4>{cap}</h4>")
    for t, h in itens:
        toc.append(f'<div class="ti"><span>{n:02d}</span><b>{t}</b></div>')
        corpo.append(h)
        n += 1
corte = [i for i, x in enumerate(toc) if x in ("<h4>Linguagem</h4>", "<h4>Redes sociais</h4>")]
cols = "".join(f"<div>{''.join(toc[a:b])}</div>" for a, b in zip([0] + corte, corte + [len(toc)]))
sumario = (f'<section class="page light"><div class="eyebrow">@@E@@ · Sumário</div><h2>O que tem aqui</h2><div class="toc3">{cols}</div>'
           f'<div class="files" style="margin-bottom:8px;padding:8px 16px"><p><code>{NOME}.pdf</code> este documento · <code>BRAND.md</code> guia de uma página · <code>tokens.css</code> cores, tipo, raio e motion · '
           f'<code>logo/</code> masters SVG</p></div><div class="foot"><span>{FOOT}</span><span>@@N@@</span></div></section>')

_contra = NS["pages"][-1][1].replace("@@N@@", str(n))
paginas = [cover(), sumario] + corpo + [_contra]
body = "".join(h.replace("@@N@@", str(i)).replace("@@E@@", f"{i:02d}") for i, h in enumerate(paginas, 1))
# o número no topo das páginas herdadas já foi trocado no exec do v5; o rodapé ainda diz "v5"
body = body.replace("RolêGo · identidade visual v5 · nov/2026", FOOT)
assert "@@" not in body

USOS_CSS = NS["USOS_CSS"]
for ph_ in ("foto-multidao-1.jpg", "foto-multidao-2.jpg"):
    body = body.replace(f"url({ph_})", f"url({uri(ph_)})")
    USOS_CSS = USOS_CSS.replace(f"url({ph_})", f"url({uri(ph_)})")
CSS = (open(os.path.join(V5, "_manual.css")).read() + NS["FESTA_CSS"] + DD_CSS + FINAL_CSS).replace("PURPLE", PURPLE)
html = f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>RolêGo — identidade visual final v2</title><style>{FONT}{USOS_CSS}{CSS}</style></head><body>{body}</body></html>'
open(OUT_HTML, "w").write(html)
print("html ok", len(paginas), "págs", f"{len(html) / 1e6:.1f} MB")
if "--no-pdf" not in sys.argv:
    pdf(OUT_HTML, OUT_PDF)
    print("pdf ok")

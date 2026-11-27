#!/usr/bin/env python3
"""RolêGo — documento de identidade visual v6 (A4 paisagem, HTML self-contained → PDF).
Cores de ../cores-escolhidas/: roxo #6D34CC e ciano #68E2E3 principais; rosa #EA3D7A só em texto ou detalhe.
Estrutura e peças do manual v5 (executado sem gravar a saída, com a paleta trocada em _cores.py) mais as
páginas próprias em _dia.py e _paginas.py. Também gera logo/, posts/ e stories/ nas cores novas.
Rodar: python3 _build.py   (--no-posts reaproveita os PNGs; --no-pdf só gera o HTML)"""
import glob, os, sys

OUT = os.path.dirname(os.path.abspath(__file__))
V5 = os.path.normpath(os.path.join(OUT, "..", "identidade-v5-gomosa"))
sys.path.insert(0, V5)
sys.path.insert(0, OUT)
import _common  # noqa: E402
from _cores import ROXO, CIANO, ROSA, paleta, svg, patch  # noqa: E402
patch(_common, OUT)
from _common import *  # noqa: E402,F403  (HERE = pasta do v5: SVGs gomosos e fotos)

NOME = "identidade-visual-rolego-v6"
OUT_HTML = os.path.join(OUT, NOME + ".html")
OUT_PDF = os.path.join(OUT, NOME + ".pdf")
FOOT = "RolêGo · identidade visual v6 · nov/2026"

# ---------------------------------------------------------------- masters SVG, posts e stories nas cores novas
for f in glob.glob(os.path.join(V5, "v4-*.svg")):
    destino = os.path.join(OUT, "logo", os.path.basename(f).replace("v4-", "rolego-").replace("-purple", "-roxo"))
    open(destino, "w").write(svg(open(f).read()))

if "--no-posts" not in sys.argv:
    PS = {"__name__": "posts_v6", "__file__": os.path.join(V5, "_posts.py")}
    exec(open(os.path.join(V5, "_posts.py")).read(), PS)
    PS["CSS"] = paleta(PS["CSS"])
    for grupo in ("POSTS", "STORIES"):
        PS[grupo] = {k: paleta(v) for k, v in PS[grupo].items()}
    PS["HERE"] = OUT
    PS["build"]()

# demo de motion (pin drop) nas cores novas
_motion = open(os.path.join(V5, "_motion.py")).read()
_alvo = 'open(os.path.join(HERE, "motion", "logo-reveal.html"), "w").write(html)'
assert _alvo in _motion
exec(_motion.replace(_alvo, f'open({os.path.join(OUT, "motion", "logo-reveal.html")!r}, "w").write(__paleta(html))'),
     {"__name__": "motion_v6", "__file__": os.path.join(V5, "_motion.py"), "__paleta": paleta})

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


# ---------------------------------------------------------------- páginas de cor (novas)
def pg_cores():
    def card(flex, bg, fg, nome, hexa, rgb, papel, extra=""):
        return (f'<div style="flex:{flex};background:{bg};color:{fg};border-radius:20px;padding:20px 22px;display:flex;flex-direction:column;justify-content:flex-end;position:relative">{extra}'
                f'<div style="font-size:34px;font-weight:800;font-style:italic;letter-spacing:-.03em;line-height:1">{nome}</div>'
                f'<div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;margin-top:6px">{hexa} · RGB {rgb}</div>'
                f'<div style="font-size:10.5px;line-height:1.45;margin-top:6px;max-width:300px">{papel}</div></div>')
    chip = f'<div style="position:absolute;left:22px;top:22px;width:64px;height:64px;border-radius:18px;background:{ROSA}"></div>'
    tres = (card(1.5, ROXO, "#fff", "Roxo", "#6D34CC", "109 52 204", "<b>Principal.</b> Superfície de capa, post, merch e festa; botão; ícone do app; texto de destaque no claro.")
            + card(1.15, CIANO, INK, "Ciano", "#68E2E3", "104 226 227", "<b>Principal.</b> O Go no roxo e no preto, a palavra em destaque, tags, links e foco.")
            + card(1, "#000", "#fff", f'<span style="color:{ROSA}">Rosa</span>', "#EA3D7A", "234 61 122", "<b>Terceira.</b> Só texto ou detalhe: uma palavra, um ícone, um ponto. Nunca fundo.", chip))
    neu = [("Preto", "#000000", "fundo do app"), ("Tinta", "#05070F", "texto no claro"), ("Superfície", "#0F0F13", "card no preto"), ("Fio", "#1E1E25", "borda no preto"), ("Cinza", "#9CA3AF", "apoio no preto"),
           ("Grafite", "#5B6070", "apoio no claro"), ("Fio claro", "#DCDDE5", "borda no claro"), ("Névoa", "#F4F4F8", "fundo claro"), ("Branco", "#FFFFFF", "marca e texto")]
    nn = "".join(f'<div><i style="display:block;height:40px;border-radius:10px;background:{h};box-shadow:inset 0 0 0 1px #DCDDE5"></i><b style="display:block;font-size:10px;margin-top:5px">{n}</b>'
                 f'<code>{h}</code><span style="display:block;font-size:8.5px;color:#5B6070;margin-top:3px">{u}</span></div>' for n, h, u in neu)
    seg = lambda f, bg, fg, t: f'<div style="flex:{f};background:{bg};color:{fg};font-size:9px;font-weight:700;display:flex;align-items:center;padding-left:8px;white-space:nowrap">{t}</div>'
    prop = (seg(45, ROXO, "#fff", "45 roxo") + seg(30, "#000", "#fff", "30 preto") + seg(15, "#fff", INK, "15 claro") + seg(7, CIANO, INK, "7 ciano") + seg(3, ROSA, INK, ""))
    return P("light", "Cores da marca: roxo, ciano e rosa", "Três cores, sempre chapadas, sem degradê entre elas. Roxo e ciano carregam a marca; o rosa é a terceira cor, só em detalhe. Preto, branco e cinzas são o apoio.",
             f'<div style="display:flex;gap:14px;height:250px;margin-top:4px">{tres}</div>'
             f'<div><div class="sub" style="margin-top:6px">Neutros de apoio</div><div style="display:grid;grid-template-columns:repeat(9,1fr);gap:10px">{nn}</div></div>'
             f'<div><div class="sub" style="margin-top:6px">Proporção num feed ou numa peça</div><div class="um-prop" style="height:32px">{prop}</div><p class="note">A fatia fina no fim é o rosa: até 3%.</p></div>')


def pg_contraste():
    pares = [("#FFFFFF", ROXO, "Branco no roxo"), (CIANO, ROXO, "Ciano no roxo"), ("#FFFFFF", "#000000", "Branco no preto"), (CIANO, "#000000", "Ciano no preto"),
             ("#9CA3AF", "#000000", "Cinza no preto"), (ROSA, "#000000", "Rosa no preto"), (INK, CIANO, "Tinta no ciano"), (ROXO, "#FFFFFF", "Roxo no branco"),
             (INK, "#F4F4F8", "Tinta na névoa"), ("#5B6070", "#F4F4F8", "Grafite na névoa"), (ROSA, "#FFFFFF", "Rosa no branco"), (ROSA, ROXO, "Rosa no roxo"),
             (ROSA, CIANO, "Rosa no ciano"), (CIANO, "#FFFFFF", "Ciano no branco")]
    linhas = ""
    for fg, bg, nome in pares:
        r = contrast(fg, bg)
        cls, uso = (("ok", "AAA · qualquer texto") if r >= 7 else ("ok", "AA · qualquer texto") if r >= 4.5 else
                    ("mid", "Só título grande (≥ 24 px)") if r >= 3 else ("no", "Não usar para texto"))
        linhas += (f'<tr><td><span class="pv" style="color:{fg};background:{bg}">Aa</span></td><td>{nome}</td><td><code>{fg} / {bg}</code></td>'
                   f'<td><b>{r:.1f}:1</b></td><td><span class="vd {cls}">{uso}</span></td></tr>')
    cats = [("Social", ROSA, "chat", "chat, ranking, match"), ("Alerta", CIANO, "pin", "avisos, links, mapa"),
            ("Segurança", CIANO, "segurança", "modo segurança, localização"), ("VIP", "#FFFFFF", "vip", "gamificação, Wallet")]
    cc = "".join(f'<div style="background:#000;border-radius:14px;padding:14px;color:#fff">{icon(k, 30, c)}<div style="font-size:15px;font-weight:800;font-style:italic;margin-top:8px">{n}</div>'
                 f'<div style="font-size:9.5px;color:#9CA3AF;margin-top:3px">{d}</div></div>' for n, c, k, d in cats)
    return P("light", "Contraste e categorias", "Os pares aprovados, calculados pela WCAG, e como separar as categorias do app usando só as cores da marca: o ícone e o nome fazem a diferença, a cor só acompanha.",
             f'<div class="apo" style="margin-top:4px"><div><div class="sub">Categorias · sempre no preto, com ícone e nome</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">{cc}</div></div>'
             f'<table class="ct"><tr><th></th><th>Par</th><th>Hex</th><th>Contraste</th><th>Uso</th></tr>{linhas}</table></div>')


# ---------------------------------------------------------------- ajustes nas páginas do v5
def sub(titulo, old, new):
    """Troca um trecho de uma página do v5; falha alto se o v5 mudar e o trecho sumir."""
    assert old in V[titulo], f"{titulo}: trecho não encontrado: {old[:70]}"
    V[titulo] = V[titulo].replace(old, new)


def page_class(titulo, cls):
    V[titulo] = V[titulo].replace('<section class="page ', f'<section class="page {cls} ', 1)


sub("Essência", "modo segurança em verde", "modo segurança sempre visível")
sub("Essência", '</div><div class="ess-r">', '<div class="kv"><span>Cores</span><p><b>Roxo</b> e <b>ciano</b> são as principais, com preto e branco. O <b>rosa</b> é a terceira cor: só texto ou detalhe.</p></div></div><div class="ess-r">')
page_class("Logo · sistema", "l4")
sub("Logo · sistema", "Go ciano → azul, nenhuma letra roxa.", "Go ciano, nenhuma letra roxa.")
sub("Logo · sistema", "v4-stacked-{purple,dark,light}.svg", "rolego-stacked-{roxo,dark,light}.svg")
V["Logo · sistema"] = V["Logo · sistema"].replace("v4-lockup-purple", "rolego-lockup-roxo").replace("<code>v4-", "<code>rolego-")

page_class("Usos incorretos", "w5")
sub("Usos incorretos", "Foto sem placa ou degradê", "Foto sem placa ou fade")
sub("Usos incorretos", "usar o degradê do Go em Rolê, colocar o lockup sobre ciano,", "colocar o lockup sobre ciano ou rosa,")
_go_rosa = recolor("v4-lockup-purple.svg", {"#00E5E5": ROSA})
_errados = (f'<div class="wt"><div class="wtv purple"><img src="{_go_rosa}" style="height:60px">{NS["x_mark"]()}</div><b>Rosa no logo</b></div>'
            f'<div class="wt"><div class="wtv" style="background:linear-gradient(135deg,{ROXO},{CIANO})">{I("v4-lockup-white.svg", h=60)}{NS["x_mark"]()}</div><b>Degradê entre as cores</b></div>')
sub("Usos incorretos", '</div><p class="note" style="margin-top:4px">', _errados + '</div><p class="note" style="margin-top:4px">')

sub("Fotografia e ícones", "A galera, de noite, em movimento", "De noite: a galera em movimento")
sub("Fotografia e ícones", "Degradê roxo", "Fade roxo")
sub("Fotografia e ícones", "luz neon roxa, azul, ciano e rosa", "luz roxa, ciano e rosa")
sub("Fotografia e ícones", "foto clara atrás do logo sem degradê", "foto clara atrás do logo sem fade")
sub("Fotografia e ícones", "luz verde, amarela ou laranja dominando", "luz verde, amarela ou laranja dominando à noite (de dia, ver Rolês de dia)")
T = "Fotografia · quem aparece"
sub(T, "neon roxo, azul, ciano e um toque de rosa", "roxo, ciano e um toque de rosa")
sub(T, "Se a foto puxa pra verde, amarelo ou laranja, não entra.", "De noite, foto que puxa pra verde, amarelo ou laranja não entra (de dia, ver Rolês de dia).")
sub(T, "Rosa + azul", "Luz mista")
T = "Fotografia · tratamento"
sub(T, "Quando a luz já é roxa/azul", "Quando a luz já é roxa ou ciano")
sub(T, "Degradê roxo", "Fade roxo")
sub(T, "em cima do degradê.", "em cima do fade.")
sub(T, "Degradê do roxo da marca (#9E19E9 → #452EFF) de baixo pra cima", "Fade do roxo #6D34CC, do transparente ao cheio, de baixo pra cima")
sub(T, "rosto sempre fora do degradê.", "rosto sempre fora do fade.")

_ui = V["Interface"]
_a, _z = _ui.index("<pre>") + 5, _ui.index("</pre>")
V["Interface"] = (_ui[:_a] + "--rg-roxo: #6D34CC;   --rg-ciano: #68E2E3;\n--rg-rosa: #EA3D7A;   /* só texto ou detalhe */\n--rg-black: #000;     --rg-surface: #0F0F13;\n"
                  "--rg-ink: #05070F;    --rg-mist: #F4F4F8;\n--rg-radius-card: 16px; --rg-radius-sheet: 28px;\n--rg-font: \"Poppins\", system-ui, sans-serif;" + _ui[_z:])
sub("Interface", "Botão primário é roxo (substitui o ciano → violeta do manual v1).", "Botão primário é roxo chapado.")
sub("Feed · templates", "Foto sempre com degradê roxo ou fade pro preto.", "Foto sempre com fade roxo ou preto.")
sub("Feed · templates", "(ex.: verde = segurança)", "(ex.: ciano = segurança)")
sub("Feed · posts com foto", "texto embaixo, no degradê.", "texto embaixo, no fade.")
sub("Redes · perfil, anúncio e WhatsApp", "foto + degradê", "foto + fade")
sub("Feed · templates", "(gerado por <code>_posts.py</code>)", "(gerado pelo <code>_build.py</code>)")
sub("Merch · vestir", "Degradê só em sublimação ou DTF.", "Cores sempre chapadas.")
sub("Look do rolê · roupas", "Degradê só em sublimação.", "Cores sempre chapadas.")
sub("Acessibilidade e IA", "<li>Ciano no roxo só em título grande e no Go.</li>", "<li>Ciano no roxo passa (4,5:1) em título e destaque; texto corrido no roxo é branco.</li><li>Texto rosa só no preto ou em foto escurecida; no branco, só título grande; nunca no roxo ou no ciano.</li>")
sub("Acessibilidade e IA", "<li>Foto com degradê atrás do logo</li>", "<li>Foto com fade, véu ou bloco atrás do logo</li><li>Rosa só em detalhe, nunca no fundo</li>")

# ---------------------------------------------------------------- ordem, numeração e sumário
usadas = set()


def v5(t, nome=None):
    usadas.add(t)
    return (nome or t, V[t])


novo = lambda t, fn: (t, fn())
CAPITULOS = [
    ("Fundamentos", [v5("Essência"), novo("Assinatura: noite e dia", pg_assinatura), v5("Logo · sistema"), v5("Construção e área de proteção"), v5("Usos incorretos"), v5("Slogan"),
                     novo("Cores da marca", pg_cores), novo("Terceira cor · rosa", pg_cor_dia), novo("Contraste e categorias", pg_contraste), v5("Tipografia"), v5("Elementos gráficos"),
                     novo("Dia e noite", pg_dia_noite)]),
    ("Linguagem", [v5("Fotografia e ícones"), v5("Fotografia · quem aparece"), v5("Fotografia · tratamento"), novo("Rolês de dia · ícones e fotos", pg_role_dia), v5("Voz e tom"), v5("Motion")]),
    ("Produto", [v5("Interface"), v5("App"), novo("App · rolês de dia", pg_app_dia)]),
    ("Redes sociais", [v5("Feed · templates"), v5("Feed · posts com foto"), v5("Stories"), v5("Stories · com foto"), novo("Feed e stories · de dia", pg_redes_dia),
                       v5("Redes · perfil, anúncio e WhatsApp")]),
    ("Mundo físico", [v5("Look do rolê · roupas"), v5("Merch · vestir"), v5("Merch · levar"), v5("Na festa"), v5("No rolê · evento"), novo("Rolê de dia · merch e praia", pg_fisico_dia),
                      v5("Campanha · foto + marca"), v5("Rua · mídia exterior"), v5("Institucional")]),
    ("Regras", [v5("Acessibilidade e IA")]),
]
_fora = set(V) - usadas - {"Cores principais", "Cores de apoio e contraste"}  # essas duas foram refeitas
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
           f'<code>logo/</code> masters SVG · <code>posts/</code> e <code>stories/</code> PNGs</p></div><div class="foot"><span>{FOOT}</span><span>@@N@@</span></div></section>')

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
html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>RolêGo — identidade visual v6</title>'
        f'<style>{FONT}{paleta(USOS_CSS + CSS)}</style></head><body>{paleta(body)}</body></html>')
open(OUT_HTML, "w").write(html)
print("html ok", len(paginas), "págs", f"{len(html) / 1e6:.1f} MB")
if "--no-pdf" not in sys.argv:
    pdf(OUT_HTML, OUT_PDF)
    print("pdf ok")

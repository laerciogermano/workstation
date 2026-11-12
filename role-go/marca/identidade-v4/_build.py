#!/usr/bin/env python3
"""Manual de identidade visual RolêGo v4 (A4 paisagem, HTML self-contained → PDF).
Estrutura do core (core/definir-projeto-moderno/05-identidade-visual): essência, logo system,
clear space, mínimos, usos incorretos, cor + pares AA, tipo, elementos, imagery, voz, motion,
UI, aplicações, acessibilidade, AI rules. Reaproveita as págs. de aplicação de ../logo-v4/_usos.py.
Rodar: python3 _posts.py && python3 _build.py"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import *

OUT_HTML = os.path.join(HERE, "identidade-visual-rolego-v4.html")
OUT_PDF = os.path.join(HERE, "identidade-visual-rolego-v4.pdf")
pages = []  # (titulo do sumário ou None, html)


def I(f, h=None, w=None, cls=""):
    return img(f, h=h, w=w, cls=cls)


def foot(_=None):
    return '<div class="foot"><span>RolêGo · identidade visual v4 · nov/2026</span><span>@@N@@</span></div>'


def page(title, cls, eyebrow, h2, body, toc=True):
    head = f'<div class="eyebrow">@@E@@ · {eyebrow}</div><h2>{h2}</h2>' if h2 else ""
    pages.append((title if toc else None, f'<section class="page {cls}">{head}{body}{foot()}</section>'))


def x_mark():
    return '<span class="xm">✕</span>'


# ---------------------------------------------------------------- 1 capa
pages.append((None, f"""<section class="page purple cover" style="background-image:url({go_pattern(opacity=.07)}),{PURPLE};background-size:180px,cover">
<div class="eyebrow">Identidade visual · v4 · novembro 2026</div>
<div style="margin-top:70px">{I('v4-lockup-purple.svg', h=190)}</div>
<div class="slo" style="font-size:64px;margin:6px 0 0 34px">Viva o <b>rolê.</b></div>
<p class="lead" style="margin-top:auto">Manual de marca: essência, logo, cor, tipografia, voz, motion e aplicações — feed, story, app, camisetas, canecas, eventos, rua e papelaria.</p>
{foot()}</section>"""))

# ---------------------------------------------------------------- 2 sumário (preenchido no fim)
pages.append(("__TOC__", ""))

# ---------------------------------------------------------------- 3 essência
pers = [("Descolada", "não forçada", "Itálico ExtraBold, frases curtas, gíria na medida certa."),
        ("Na hora", "não apressada", "Roxo vibrante, motion rápido: o pin cai e assenta em 400 ms."),
        ("Junto", "não sozinho", "“Go” é o “bora”. Match de grupo, texto no plural: a galera."),
        ("Segura", "não careta", "Contraste alto, modo segurança em verde, nada escondido.")]
page("Essência", "light", "Essência", "Os rolês da sua cidade, <b>num swipe.</b>", f"""
<div class="ess"><div class="ess-l">
<div class="kv"><span>O que é</span><p>App que junta festas, bares, shows e eventos privados por perto, mostra quem vai e deixa o grupo decidir junto — do match ao ingresso.</p></div>
<div class="kv"><span>Para quem</span><p>Gente de 18 a 35 que sai em grupo, quem acabou de chegar numa cidade e quem organiza o rolê (bares, casas, anfitriões).</p></div>
<div class="kv"><span>Problema</span><p>Decidir onde sair leva mais tempo que o rolê: Instagram, Google, grupo do zap e ninguém decide.</p></div>
<div class="kv"><span>Assinaturas</span><p><b class="asg">Viva o rolê.</b> — slogan<br><b class="asg">Os rolês da sua cidade, num swipe.</b> — promessa<br><b class="asg">Chega de sofrer para decidir onde sair.</b> — linha de apoio</p></div>
</div><div class="ess-r">{''.join(f'<div class="per"><b>{a}</b><i>{b}</i><p>{c}</p></div>' for a, b, c in pers)}
<div class="per wide purple"><b style="color:#fff">O nome</b><p style="color:rgba(255,255,255,.85)">“Rolê” é o programa; “Go” é o bora — e no desenho vira um G com um pin de mapa. Por isso as duas partes têm sempre cores diferentes: uma é o que, a outra é o onde.</p></div></div></div>""")

# ---------------------------------------------------------------- 4 logo system
tiles = [("purple", "v4-lockup-purple.svg", 60, "Lockup no roxo · principal", "Capas, header do site, peças de marca. Rolê branco + Go ciano.", "v4-lockup-purple.svg"),
         ("dark", "v4-lockup-dark.svg", 60, "Lockup no preto", "App, peças noturnas. Go ciano → azul, nenhuma letra roxa.", "v4-lockup-dark.svg"),
         ("lite", "v4-lockup-light.svg", 60, "Lockup no claro", "Documentos, e-mail, papelaria clara. Go no roxo.", "v4-lockup-light.svg"),
         ("purple", "v4-stacked-purple.svg", 120, "Empilhado", "Splash, ecobag, espaços quadrados e verticais.", "v4-stacked-{purple,dark,light}.svg"),
         ("dark", "v4-go-dark.svg", 100, "Símbolo Go", "Avatar, estampa, marcador no mapa — quando o nome já aparece por perto.", "v4-go-{white,dark,light,ink}.svg"),
         ("lite", "v4-icon-app.svg", 100, "Ícone de app", "Loja, home do celular, avatar. Roxo + Go branco.", "v4-icon-{app,avatar,fav}[-dark].svg"),
         ("dark", "v4-lockup-white.svg", 44, "Uma cor · branco", "Silk 1 cor, gravação, carimbo. Única exceção à regra das duas cores.", "v4-lockup-white.svg"),
         ("lite", "v4-lockup-ink.svg", 44, "Uma cor · preto", "Fax, nota fiscal, impressão P&B.", "v4-lockup-ink.svg")]
lg = "".join(f'<div class="lt"><div class="ltv {c}">{I(f, h=h, cls="ic" if "icon" in f else "")}</div><b>{t}</b><p>{d}</p><code>{fn}</code></div>' for c, f, h, t, d, fn in tiles)
page("Logo · sistema", "mist", "Logo · sistema", "Rolê numa cor, Go em outra — <b>sempre</b>", f'<div class="lgrid">{lg}</div>')

# ---------------------------------------------------------------- 5 construção, área de proteção, mínimos
H = 150; s = H / 256
bx, by, bw, bh, xu = 24 * s, 14 * s, 941 * s, 218 * s, 98 * s
cs = f"""<div class="clr" style="width:{bw + 2 * xu:.0f}px;height:{bh + 2 * xu:.0f}px">
<img src="{uri('v4-lockup-light.svg')}" style="position:absolute;height:{H}px;left:{xu - bx:.1f}px;top:{xu - by:.1f}px">
<div class="clr-in" style="left:{xu:.1f}px;top:{xu:.1f}px;width:{bw:.1f}px;height:{bh:.1f}px"></div>
{''.join(f'<div class="xu" style="width:{xu:.1f}px;height:{xu:.1f}px;{p}">x</div>' for p in ('left:0;top:0', 'right:0;top:0', 'left:0;bottom:0', 'right:0;bottom:0'))}</div>"""
G = 230; g = G / 256
lab = [(60, 150, "G", "o G de Go, no mesmo itálico do Rolê"), (148, 110, "canal", "a boca do G continua até o furo do pin"), (186, 110, "furo", "o lugar do rolê no mapa"), (168, 180, "ponta", "desce um pouco abaixo da linha de base")]
anat = f"""<div class="anat" style="width:{G}px;height:{G}px">{I('v4-go-light.svg', h=G)}
{''.join(f'<span class="dot" style="left:{x * g:.0f}px;top:{y * g:.0f}px">{i + 1}</span>' for i, (x, y, a, b) in enumerate(lab))}</div>
<div class="leg">{''.join(f'<div><span class="dn">{i + 1}</span><b>{a}</b> {b}</div>' for i, (x, y, a, b) in enumerate(lab))}</div>"""
mins = f"""<div class="mins">
<div><div class="mv">{I('v4-lockup-light.svg', h=34)}</div><b>Lockup</b><span>mín. 96 px de largura · 25 mm</span></div>
<div><div class="mv">{I('v4-stacked-light.svg', h=60)}</div><b>Empilhado</b><span>mín. 64 px · 18 mm</span></div>
<div><div class="mv">{I('v4-go-light.svg', h=22)}{I('v4-go-light.svg', h=32)}</div><b>Símbolo</b><span>mín. 16 px · 6 mm</span></div>
<div><div class="mv">{I('v4-icon-fav.svg', h=16)}{I('v4-icon-fav.svg', h=24)}{I('v4-icon-fav.svg', h=32)}</div><b>Favicon</b><span>16 · 24 · 32 px</span></div></div>"""
page("Construção e área de proteção", "light", "Construção, área de proteção e mínimos", "Um G e um pin numa peça só", f"""
<div class="cons"><div><div class="sub">Área de proteção — x = metade da altura do R</div>{cs}
<p class="note">Nada entra na área tracejada: texto, borda de peça, outro logo. Em peças pequenas, use o símbolo em vez de apertar o lockup.</p>{mins}</div>
<div><div class="sub">Anatomia do símbolo</div>{anat}<p class="note">A ponta do pin fica logo abaixo da linha de base e o topo do anel alinha com a altura do G. Não redesenhar, não trocar por um pin de ícone genérico.</p></div></div>""")

# ---------------------------------------------------------------- 6 usos incorretos
STRETCH = data(svg_text("v4-lockup-purple.svg").replace("<svg ", '<svg preserveAspectRatio="none" ', 1), "svg")
no_acc = data(re.sub(r"M496\.67 58\.00L[^Z]+Z", "", svg_text("v4-lockup-purple.svg")), "svg")
wrong = [("purple", f'<img src="{STRETCH}" style="width:270px;height:38px">', "Esticar ou achatar"),
         ("purple", I("v4-lockup-white.svg", h=60), "Rolê e Go na mesma cor"),
         ("dark", f'<img src="{recolor("v4-lockup-dark.svg", {"#FFFFFF": "#9E19E9"})}" style="height:60px">', "Letras roxas no preto"),
         ("purple", '<span class="fake">Rolê<b>Go</b></span>', "Escrever “Go” em texto"),
         ("purple", f'<img src="{no_acc}" style="height:60px">', "Tirar o acento de Rolê"),
         ("dark", f'<img src="{uri("v4-lockup-dark.svg")}" style="height:60px;filter:drop-shadow(0 0 10px #00E5E5) drop-shadow(0 0 22px #9E19E9)">', "Glow, sombra ou contorno"),
         ("photo", f'<img src="{uri("v4-lockup-light.svg")}" style="height:60px;position:relative">', "Foto sem placa ou degradê"),
         ("purple", f'<span class="fake serif">Rolê</span>{I("v4-go-white.svg", h=48)}', "Trocar a fonte ou recompor")]
PHS = 'style="background:url(' + uri("foto-multidao-2.jpg") + ') center/cover"'
wg = "".join(f'<div class="wt"><div class="wtv {c}" {PHS if c == "photo" else ""}>{v}{x_mark()}</div><b>{t}</b></div>' for c, v, t in wrong)
page("Usos incorretos", "mist", "Usos incorretos", "O que não fazer com a marca", f'<div class="wgrid">{wg}</div><p class="note" style="margin-top:4px">Também não: girar, mudar o itálico, usar o degradê do Go em Rolê, colocar o lockup sobre ciano, ou animar o logo em loop.</p>')

# ---------------------------------------------------------------- 7–12 das págs. v4 (slogan + aplicações) — carregadas abaixo
USOS_SRC = open(os.path.join(V4, "_usos.py")).read()
usos_pages = []
env = {"I": I, "foot": foot, "pages": usos_pages}
exec(USOS_SRC, env)
USOS_CSS = env["USOS_CSS"]
U = {t: html for t, html in zip(["slogan", "redes", "app", "role", "rua", "inst"], usos_pages)}


def reuse(key, title):
    h = U[key]
    h = re.sub(r'<div class="eyebrow">\d+ · ', '<div class="eyebrow">@@E@@ · ', h)
    h = h.replace("rolego.app", "rolego.com.br").replace("avatar L8 + destaques", "avatar + destaques")
    pages.append((title, h))


reuse("slogan", "Slogan")

# ---------------------------------------------------------------- cores principais
main = [("Violeta", "#9E19E9", "158 25 233", "Início do degradê roxo", "#fff"), ("Roxo", "#6539CB", "101 57 203", "Meio do degradê · roxo de texto no claro · tecido", "#fff"),
        ("Anil", "#452EFF", "69 46 255", "Fim do degradê roxo", "#fff"), ("Ciano Go", "#00E5E5", "0 229 229", "Go no roxo e no preto · palavra de destaque · tags", "#000"),
        ("Azul Go", "#3B82F6", "59 130 246", "Fim do degradê do Go no preto", "#fff"), ("Preto", "#000000", "0 0 0", "Fundo do app e das peças noturnas", "#fff"),
        ("Tinta", "#05070F", "5 7 15", "Texto e Rolê no claro", "#fff"), ("Névoa", "#F4F4F8", "244 244 248", "Fundo claro", "#05070F"),
        ("Branco", "#FFFFFF", "255 255 255", "Marca e texto no roxo e no preto", "#05070F")]
sw = "".join(f'<div class="sw"><div class="swc" style="background:{h};color:{t}{";box-shadow:inset 0 0 0 1px #DCDDE5" if h in ("#FFFFFF", "#F4F4F8") else ""}"><b>{n}</b></div><code>{h}</code><span>RGB {r}</span><p>{u}</p></div>' for n, h, r, u, t in main)
neu = [("Cinza", "#9CA3AF", "texto secundário no preto"), ("Grafite", "#5B6070", "texto secundário no claro"), ("Superfície", "#0F0F13", "card e campo no preto"), ("Fio", "#1E1E25", "borda no preto"), ("Fio claro", "#DCDDE5", "borda no claro")]
nn = "".join(f'<div class="nt2"><i style="background:{h}"></i><div><b>{n}</b> <code>{h}</code><span>{u}</span></div></div>' for n, h, u in neu)
page("Cores principais", "light", "Cor · principal", "Roxo é superfície. Ciano é o Go.", f"""
<div class="grads"><div class="gd" style="background:{PURPLE}"><b>Superfície roxa</b><span>135° · #9E19E9 → #6539CB → #452EFF</span><em>fundo, ícone, botão, peças</em></div>
<div class="gd" style="background:#000"><b style="color:#00E5E5">Go no preto</b><span>#00E5E5 → #3B82F6</span><em>só no símbolo Go sobre o preto</em></div>
<div class="prop"><div class="sub">Proporção num feed / numa peça</div><div class="bar"><i style="flex:45;background:{PURPLE}">45 roxo</i><i style="flex:30;background:#000">30 preto</i><i style="flex:15;background:#F4F4F8;color:#05070F">15 claro</i><i style="flex:10;background:#00E5E5;color:#000">10</i></div>
<p class="note">Degradê só nesses dois. Nunca degradê em texto corrido, nem roxo como cor de letra sobre o preto.</p></div></div>
<div class="swg">{sw}</div><div class="neu">{nn}</div>""")

# ---------------------------------------------------------------- apoio + contraste
cat = [("Magenta", MAGENTA, "Social · chat · ranking"), ("Verde", GREEN, "Modo segurança · localização ao vivo"), ("Amarelo", YELLOW, "Gamificação · VIP · Wallet"), ("Ciano", CYAN, "Alertas · links · destaque")]
cc = "".join(f'<div class="cat"><i style="background:{h}"></i><div class="catc"><span class="cb" style="background:{h}"></span><b style="color:{h}">{n}</b><code>{h}</code><p>{u}</p></div></div>' for n, h, u in cat)
pairs = [("#FFFFFF", "#9E19E9", "Branco no violeta"), ("#FFFFFF", "#6539CB", "Branco no roxo"), ("#FFFFFF", "#452EFF", "Branco no anil"),
         ("#00E5E5", "#6539CB", "Ciano no roxo"), ("#00E5E5", "#9E19E9", "Ciano no violeta"), ("#FFFFFF", "#000000", "Branco no preto"),
         ("#00E5E5", "#000000", "Ciano no preto"), ("#9CA3AF", "#000000", "Cinza no preto"), ("#00FF00", "#000000", "Verde no preto"),
         ("#FF1F7A", "#000000", "Magenta no preto"), ("#FFCC00", "#000000", "Amarelo no preto"), ("#000000", "#00E5E5", "Preto na tag ciano"),
         ("#05070F", "#F4F4F8", "Tinta na névoa"), ("#6539CB", "#FFFFFF", "Roxo no branco"), ("#5B6070", "#F4F4F8", "Grafite na névoa"),
         ("#00E5E5", "#FFFFFF", "Ciano no branco")]


def verdict(r):
    if r >= 7: return "ok", "AAA · qualquer texto"
    if r >= 4.5: return "ok", "AA · qualquer texto"
    if r >= 3: return "mid", "Só título ≥ 24 px ou bold ≥ 19 px"
    return "no", "Não usar para texto"


rows = "".join(f'<tr><td><span class="pv" style="background:{b};color:{a}">Aa</span></td><td>{n}</td><td><code>{a} / {b}</code></td><td><b>{contrast(a, b):.1f}:1</b></td><td><span class="vd {verdict(contrast(a, b))[0]}">{verdict(contrast(a, b))[1]}</span></td></tr>' for a, b, n in pairs)
page("Cores de apoio e contraste", "light", "Cor · apoio e contraste", "Neon só como código de categoria", f"""
<div class="apo"><div><div class="cats">{cc}</div><p class="note">As cores de apoio aparecem em ícone, tag, barra lateral de card e gráfico — sempre no preto, sempre pequenas. Nunca no logo, nunca como fundo de peça, nunca duas na mesma tela de marca.</p>
<p class="note"><b>Ciano no roxo</b> é a cor do Go e da palavra de destaque: funciona porque aparece grande. Texto pequeno no roxo é sempre branco.</p></div>
<table class="ct"><tr><th></th><th>Par</th><th>Hex</th><th>Contraste</th><th>Uso (WCAG 2.2)</th></tr>{rows}</table></div>""")

# ---------------------------------------------------------------- tipografia
scale = [("Display", "72 / .95", "ExtraBold 800 itálico · −3,5%", "Viva o <b>rolê.</b>", 54), ("H1", "48 / 1.0", "ExtraBold 800 itálico · −3%", "Sexta tem <b>rolê.</b>", 40),
         ("H2", "32 / 1.05", "ExtraBold 800 itálico · −2%", "5 rolês pra sexta", 30), ("H3", "22 / 1.2", "Bold 700", "Samba no Largo", 22),
         ("Corpo", "16 / 1.5", "Regular 400", "Largo da Batata · gratuito · a 600 m de você", 16), ("Pequeno", "14 / 1.45", "Regular 400", "32 pessoas vão · 3 amigos seus", 14),
         ("Tag", "12 / 1.2", "ExtraBold 800 · caixa alta · +8%", '<span class="tg">SEX · 21h</span>', 12)]
sc = "".join(f'<tr><td><b>{n}</b><span>{m}</span></td><td class="ty" style="font-size:{px}px;{"font-weight:800;font-style:italic;letter-spacing:-.03em;line-height:1" if n in ("Display", "H1", "H2") else "font-weight:700" if n == "H3" else ""}">{e}</td><td>{w}</td></tr>' for n, m, w, e, px in scale)
wts = "".join(f'<div><span style="font-weight:{w};{"font-style:italic" if i else ""}">Rolê</span><em>{n}</em></div>' for w, i, n in [(400, 0, "Regular 400"), (500, 0, "Medium 500"), (600, 0, "SemiBold 600"), (700, 0, "Bold 700"), (800, 0, "ExtraBold 800"), (800, 1, "ExtraBold itálico")])
page("Tipografia", "light", "Tipografia", "Uma fonte só: Poppins", f"""
<div class="typ"><div class="tyl"><div class="aa">Aa<b>Gg</b></div><div class="wts">{wts}</div>
<ul class="rl"><li>Títulos sempre em ExtraBold itálico, com espaçamento negativo.</li><li>Uma palavra por título na cor do Go (ciano no roxo/preto, roxo no claro).</li>
<li>Caixa alta só em tag e rótulo curto — nunca em frase.</li><li>Sem segunda fonte. Fallback: <code>system-ui, sans-serif</code>.</li><li>O lockup é desenho, não texto: nunca digitar “RolêGo” em Poppins no lugar do logo.</li></ul></div>
<table class="scl">{sc}</table></div>""")

# ---------------------------------------------------------------- elementos gráficos
el = f"""<div class="elg">
<div class="el"><div class="elv purple" style="overflow:hidden">{I('v4-go-white.svg', h=330, cls="sgx")}<span class="elt">Sexta<br>tem <b>rolê.</b></span></div><b>Supergrafismo Go</b><p>Símbolo gigante, cortado na borda, 8–12% de opacidade. Um por peça.</p></div>
<div class="el"><div class="elv" style="background:url({go_pattern(opacity=.16)}) 0 0/90px,{PURPLE}"></div><b>Padrão Go · roxo</b><p>Grade deslocada, 10–16%. Fundo de story, capinha, papel de presente.</p></div>
<div class="el"><div class="elv dark" style="background:url({go_pattern(CYAN, .18)}) 0 0/90px,#000"></div><b>Padrão Go · preto</b><p>Mesmo padrão em ciano 15–20%. Backdrop, ingresso, embalagem.</p></div>
<div class="el"><div class="elv dark tags"><span class="tg c">SEX · 21h</span><span class="tg g">MODO SEGURANÇA</span><span class="chp on">Samba</span><span class="chp">Balada</span><span class="chp">Bar</span><span class="tg y">VIP</span></div><b>Tags e chips</b><p>Pill, caixa alta curta. Chip ativo em roxo sólido, inativo só com fio.</p></div>
<div class="el"><div class="elv map2"><div class="mkr2" style="left:32%;top:40%">{I('v4-go-dark.svg', h=34)}</div><div class="mkr2" style="left:72%;top:30%">{I('v4-go-dark.svg', h=28)}</div><div class="mkr2 big" style="left:55%;top:66%"><i>{I('v4-go-white.svg', h=28)}</i></div></div><b>Go como marcador</b><p>No mapa, o símbolo é o pin. Selecionado: placa roxa com Go branco.</p></div>
<div class="el"><div class="elv lite rad"><i style="border-radius:8px">8</i><i style="border-radius:16px">16</i><i style="border-radius:28px">28</i><i style="border-radius:99px">pill</i></div><b>Raios</b><p>8 tag de card · 16 card · 28 tela/sheet · pill em botão e chip. Nada de canto reto.</p></div></div>"""
page("Elementos gráficos", "mist", "Elementos gráficos", "O Go faz o resto do trabalho", el)

# ---------------------------------------------------------------- fotografia + ícones
ICONS = {"pin": ("#00E5E5", '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z"/><circle cx="12" cy="10" r="2.3"/>'),
         "agenda": ("#FFFFFF", '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>'),
         "ingresso": ("#FFCC00", '<path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2.5a2.5 2.5 0 0 0 0 5V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2.5a2.5 2.5 0 0 0 0-5z"/><path d="M14 5v14" stroke-dasharray="2 2.2"/>'),
         "chat": ("#FF1F7A", '<path d="M5 18.5V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H8.5z"/><path d="M9 9.5h6M9 12.5h4"/>'),
         "segurança": ("#00FF00", '<path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6z"/><path d="M8.8 12l2.2 2.2 4.2-4.4"/>'),
         "vip": ("#FFCC00", '<path d="M4 17l-1-9 5 4 4-7 4 7 5-4-1 9z"/><path d="M5 20h14"/>'),
         "música": ("#FFFFFF", '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>'),
         "bar": ("#FFFFFF", '<path d="M5 4h14l-7 8z"/><path d="M12 12v7M8 20h8"/>'),
         "galera": ("#FF1F7A", '<circle cx="9" cy="9" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="8" r="2.4"/><path d="M15.5 13.6A4.5 4.5 0 0 1 21 18"/>'),
         "mapa": ("#00E5E5", '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>')}


def icon(k, size=34, color=None):
    c, p = ICONS[k]
    return f'<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="{color or c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{p}</svg>'


ph = uri("foto-multidao-1.jpg")
treat = [("Original", ""), ("Degradê roxo", '<div class="ov"></div>'), ("Fade pro preto", '<div class="ov2"></div>')]
tr = "".join(f'<div><div class="trt" style="background:url({ph}) center 30%/cover">{o}<div class="trl">{I("v4-lockup-purple.svg", h=22) if o else ""}</div></div><b>{t}</b></div>' for t, o in treat)
ic = "".join(f'<div class="icn"><i>{icon(k)}</i><span>{k}</span></div>' for k in ICONS)
page("Fotografia e ícones", "light", "Fotografia e ícones", "Gente de verdade, de noite, em movimento", f"""
<div class="foto"><div><div class="trs">{tr}</div>
<div class="dd"><div><b class="ok">Sim</b><p>Gente real, de costas ou em movimento · luz de palco, de rua, de bar · noite e fim de tarde · grão e desfoque de movimento · grupos, não modelos sozinhos.</p></div>
<div><b class="no">Não</b><p>Banco de imagem posado · rosto gerado por IA · foto clara atrás do logo sem degradê · filtro colorido fora da paleta · bebida como protagonista.</p></div></div></div>
<div><div class="sub">Ícones · grade 24 px, traço 2 px, pontas redondas</div><div class="icg">{ic}</div>
<p class="note">Outline sempre; preenchido só no estado ativo da tab bar. Cor do ícone = cor da categoria (ver Cor · apoio). Fora do app, ícones em branco.</p></div></div>""")

# ---------------------------------------------------------------- voz
sl = [("formal", "casual", 82), ("sério", "brincalhão", 64), ("técnico", "humano", 90), ("hype", "pé no chão", 58)]
sli = "".join(f'<div class="sld"><span>{a}</span><div><i style="left:{p}%"></i></div><span>{b}</span></div>' for a, b, p in sl)
ba = [("Confira os eventos imperdíveis da sua região!", "Tem rolê perto de você. Bora?"), ("Erro: falha ao carregar eventos.", "Deu ruim aqui. Puxa pra baixo que a gente tenta de novo."),
      ("Sua compra foi realizada com sucesso.", "Ingresso garantido. Agora é só ir."), ("Ative a localização para uma melhor experiência.", "Liga a localização pra gente achar os rolês perto de você.")]
bb = "".join(f'<div class="ba"><s>{a}</s><span>→</span><b>{b}</b></div>' for a, b in ba)
page("Voz e tom", "light", "Voz e tom", "Fala como a amiga que sempre sabe onde é o rolê", f"""
<div class="voz"><div><div class="adj"><div><b>Descolada,</b> não forçada</div><div><b>Direta,</b> não seca</div><div><b>Parceira,</b> não babá</div></div>{sli}
<div class="voc"><div><b class="ok">Fala</b><p>rolê · bora · deu match · tá rolando · a galera · colar · volta segura</p></div><div><b class="no">Evita</b><p>imperdível · experiência única · balada top · meme que envelhece · CAIXA ALTA GRITANDO · mais de 1 emoji</p></div></div></div>
<div><div class="sub">Antes → depois</div>{bb}
<p class="note">Segurança, pagamento e erro são sérios: menos gíria, mais clareza — o tom continua próximo, nunca piadista.</p></div></div>""")

# ---------------------------------------------------------------- motion
role_u, go_u = split_lockup()
LH = 36; ls = LH / 256
hx, hy = 883 * ls, 108 * ls


def frame(role_css, go_css, ping=""):
    return (f'<div class="fr purple"><div class="frs" style="height:{LH}px;width:{989 * ls:.0f}px">'
            f'<img src="{role_u}" style="height:{LH}px;{role_css}"><img src="{go_u}" style="height:{LH}px;{go_css}">{ping}</div></div>')


ping = f'<span class="ping" style="left:{hx:.0f}px;top:{hy:.0f}px"></span>'
frames = [(frame("opacity:.0", "opacity:0"), "0 ms", "fundo roxo"),
          (frame("opacity:.55;transform:translateX(-14px)", "opacity:0"), "0–220 ms", "Rolê entra da esquerda"),
          (frame("", "transform:translateY(-18px);opacity:.6"), "120–400 ms", "o Go cai de cima"),
          (frame("", "", ping), "400–600 ms", "assenta sem quicar · ping no furo"),
          (frame("", ""), "600 ms", "end frame = lockup estático")]
fr = "".join(f'<div><div class="frw">{f}</div><b>{t}</b><span>{d}</span></div>' for f, t, d in frames)
tok = [("--dur-instant", "100 ms", "press, toggle"), ("--dur-fast", "140 ms", "hover, chip"), ("--dur-default", "220 ms", "swipe de card, sheet"), ("--dur-slow", "400 ms", "match, entrada de tela"), ("--dur-logo", "600 ms", "pin drop do logo"),
       ("--ease-standard", "cubic-bezier(.2,0,0,1)", "padrão"), ("--ease-emphasized", "cubic-bezier(.16,1,.3,1)", "entradas, pin drop"), ("--ease-exit", "cubic-bezier(.7,0,.84,0)", "saídas")]
tt = "".join(f"<tr><td><code>{a}</code></td><td>{b}</td><td>{c}</td></tr>" for a, b, c in tok)
page("Motion", "light", "Motion", "Movimento-assinatura: <b>o pin cai</b>", f"""
<div class="frg">{fr}</div>
<div class="mo"><table class="ct">{tt}</table>
<div><div class="sub">Na interface</div><ul class="rl"><li><b>Swipe:</b> card segue o dedo; solto, sai em 220 ms com <code>ease-exit</code>.</li><li><b>Match:</b> o Go cai no card (400 ms) + ping ciano, uma vez.</li><li><b>Botão:</b> escala .97 no toque, 100 ms.</li></ul>
<div class="sub" style="margin-top:8px">Reduced motion</div><p class="note">Com <code>prefers-reduced-motion</code>, mostra o end frame direto; o ping vira troca de cor. Motion nunca é o único sinal de estado.</p></div>
<div><div class="sub">Logo nunca</div><ul class="rl"><li>girar, quicar ou esticar o Go</li><li>loop infinito ou glow pulsando</li><li>piscar mais de 3× por segundo</li><li>animar a cada scroll</li></ul><p class="note">Demo: <code>motion/logo-reveal.html</code></p></div></div>""")

# ---------------------------------------------------------------- UI
ui = f"""<div class="uig"><div class="uip dark">
<div class="sub" style="color:#9CA3AF">No preto (app)</div>
<div class="brow"><span class="b1">Bora pro rolê</span><span class="b2">Ver no mapa</span><span class="b3">Agora não</span></div>
<div class="brow"><span class="chp on">Hoje</span><span class="chp">Sexta</span><span class="chp">Grátis</span><span class="chp">Até 2 km</span></div>
<div class="evc2"><div class="evp" style="background:url({uri('foto-multidao-2.jpg')}) center 30%/cover"><span class="tg c">HOJE · 22h</span></div><div class="evb"><b>Baile da Laje</b><span>Vila Madalena · R$ 40 · 1,2 km</span><div class="ppl"><i></i><i></i><i></i> 48 vão</div></div></div>
<div class="catcard"><i style="background:#00FF00"></i>{icon('segurança', 26)}<div><b>Modo segurança ativo</b><span>Ana e Léo veem sua localização até 3h</span></div></div>
<div class="inp">{icon('pin', 18, '#9CA3AF')}<span>Buscar rolê, bar ou bairro</span></div>
<div class="tabbar"><span class="on">{I('v4-go-dark.svg', h=22)}Rolês</span><span>{icon('mapa', 20, '#9CA3AF')}Mapa</span><span>{icon('ingresso', 20, '#9CA3AF')}Ingressos</span><span>{icon('galera', 20, '#9CA3AF')}Galera</span></div></div>
<div class="uip lite"><div class="sub">No claro (site, painel do parceiro)</div>
<div class="brow"><span class="b1">Cadastrar meu bar</span><span class="b2l">Falar com a gente</span></div>
<div class="brow"><span class="chp onl">Ativos</span><span class="chp l">Rascunhos</span><span class="chp l">Encerrados</span></div>
<div class="kpi"><div><span>Vão hoje</span><b>312</b></div><div><span>Matches</span><b>48</b></div><div><span>Check-ins</span><b>127</b></div></div>
<div class="tk"><div class="sub">Tokens</div><pre>--rg-purple: linear-gradient(135deg,#9E19E9,#6539CB,#452EFF);
--rg-cyan: #00E5E5;  --rg-black: #000;  --rg-surface: #0F0F13;
--rg-ink: #05070F;   --rg-mist: #F4F4F8; --rg-line: #1E1E25;
--rg-radius-card: 16px; --rg-radius-sheet: 28px;
--rg-font: "Poppins", system-ui, sans-serif;</pre><p class="note">Arquivo completo: <code>tokens.css</code>. Botão primário é roxo (substitui o ciano → violeta do manual v1).</p></div></div></div>"""
page("Interface", "mist", "Interface", "Botões, chips e cards", ui)

# ---------------------------------------------------------------- posts
pn = [("01-sexta-tem-role", "Frase curta · roxo"), ("02-evento-foto", "Evento · foto"), ("03-top5-semana", "Lista · top 5"), ("04-enquete", "Enquete"), ("05-frase", "Frase · preto"),
      ("06-feature-match", "Feature do app"), ("07-seguranca", "Categoria · segurança"), ("08-parceiro", "Parceiro · claro"), ("09-contagem", "Contagem")]
pg = "".join(f'<div class="pst"><img src="{uri("posts/" + n + ".png")}"><span>{t}</span></div>' for n, t in pn)
page("Feed · templates", "light", "Redes · feed", "Nove templates de post 1080 × 1080", f"""
<div class="psg"><div class="pgrid">{pg}</div><div><div class="sub">Regras do feed</div><ul class="rl">
<li>Margem de 84 px (em 1080). Logo ou símbolo sempre num canto.</li><li>Uma ideia por post; título com no máx. 6 palavras.</li><li>Alternar roxo · preto · foto pra o grid respirar.</li>
<li>Foto sempre com degradê roxo ou fade pro preto.</li><li>Cor de categoria só no post daquele assunto (ex.: verde = segurança).</li><li>Fundo claro só pra parceiro e institucional.</li></ul>
<p class="note">PNGs em <code>posts/</code>; HTML editável em <code>_src/</code> (gerado por <code>_posts.py</code>).</p></div></div>""")

st = [("01-slogan", "Slogan · foto"), ("02-evento-enquete", "Evento + enquete"), ("03-checklist", "Checklist do rolê")]
sg = "".join(f'<div class="sto"><img src="{uri("stories/" + n + ".png")}"><span>{t}</span></div>' for n, t in st)
page("Stories", "light", "Redes · stories", "Stories 1080 × 1920", f"""
<div class="stg">{sg}<div><div class="sub">Zonas seguras</div>
<div class="safe"><div class="sz t">250 px · barra e avatar</div><div class="sz m">área útil</div><div class="sz b">340 px · resposta e link</div></div>
<ul class="rl"><li>Título grande no terço do meio.</li><li>Sticker de enquete em branco, levemente girado (−3°).</li><li>Lockup centralizado embaixo, acima da zona do link.</li><li>Sequência de 3 a 5 stories, uma cor dominante cada.</li></ul></div></div>""")

reuse("redes", "Redes · perfil, anúncio e WhatsApp")
reuse("app", "App")

# ---------------------------------------------------------------- merch: vestir
TEE = "M60 10 L20 30 L0 80 L35 92 L40 70 L40 205 L160 205 L160 70 L165 92 L200 80 L180 30 L140 10 C130 30 70 30 60 10Z"


def tee(fill, inner, back=False, stroke=""):
    neck = '<path d="M60 10 C70 26 130 26 140 10" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="3"/>' if not back else '<path d="M62 10 C80 16 120 16 138 10" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="3"/>'
    return f'<div class="tee2"><svg viewBox="0 0 200 210"><path d="{TEE}" fill="{fill}" {stroke}/>{neck}</svg><div class="tpr">{inner}</div></div>'


HOOD = "M72 22 C72 2 148 2 148 22 L192 42 L216 168 L192 176 L174 98 L174 236 L46 236 L46 98 L28 176 L4 168 L28 42 Z"
hood = f"""<div class="tee2"><svg viewBox="0 0 220 240"><path d="{HOOD}" fill="#0A0A0E"/><path d="M80 22 C84 56 136 56 140 22" fill="none" stroke="#25252E" stroke-width="4"/>
<path d="M70 168 H150 L160 214 H60 Z" fill="none" stroke="#25252E" stroke-width="3"/><path d="M104 46 v26 M116 46 v26" stroke="#3A3A45" stroke-width="2"/></svg>
<div class="tpr" style="top:82px">{I('v4-lockup-dark.svg', h=26)}</div></div>"""
cap = f"""<div class="tee2"><svg viewBox="0 0 220 170"><defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9E19E9"/><stop offset=".5" stop-color="#6539CB"/><stop offset="1" stop-color="#452EFF"/></linearGradient></defs>
<path d="M30 118 C30 34 170 34 170 118 Z" fill="#6539CB"/><path d="M100 56 C97 80 97 100 100 118 M66 64 C58 84 56 100 57 118 M134 64 C142 84 144 100 143 118" stroke="#5631B0" stroke-width="2" fill="none"/>
<circle cx="100" cy="55" r="5" fill="#5631B0"/><path d="M24 116 C70 108 170 108 210 136 C170 146 60 140 24 126 Z" fill="#4E2AA8"/></svg>
<div class="tpr" style="top:58px;left:-6px">{I('v4-go-white.svg', h=44)}</div></div>"""
vest = [(tee("#0A0A0E", '<span class="slo tslo">Viva o<br><b>rolê.</b></span>' + I('v4-go-dark.svg', h=26)), "Camiseta preta · frente", "Slogan no peito, símbolo embaixo. Silk branco + ciano."),
        (tee("#0A0A0E", f'<div style="overflow:hidden;width:84px;height:88px;position:relative">{I("v4-go-dark.svg", h=150, cls="bk")}</div><span class="tb">rolego.com.br</span>', back=True), "Camiseta preta · costas", "Go gigante cortado + endereço."),
        (tee("#6539CB", I('v4-lockup-purple.svg', h=30)), "Camiseta roxa", "Tecido roxo (#6539CB, pedir prova) + lockup Rolê branco / Go ciano."),
        (tee("#F6F6F9", f'<div style="width:100%;display:flex;justify-content:flex-end;padding-right:30px">{I("v4-go-light.svg", h=24)}</div>', stroke='stroke="#DCDDE5" stroke-width="1.5"'), "Camiseta branca", "Símbolo roxo no peito esquerdo, 7 cm."),
        (hood, "Moletom preto", "Lockup no peito, 18 cm. Bordado ou silk."),
        (cap, "Boné roxo", "Go branco bordado na frente, 6 cm de altura.")]
vv = "".join(f'<div class="mi"><div class="miv">{v}</div><b>{t}</b><p>{d}</p></div>' for v, t, d in vest)
page("Merch · vestir", "mist", "Merch · vestir", "Camisetas, moletom e boné", f"""<div class="mgrid">{vv}</div>
<p class="note" style="margin-top:2px"><b>Produção:</b> silk e bordado com no máximo 2 cores — branco + ciano (ou a versão de uma cor). Degradê só em sublimação ou DTF. Peito: 9–12 cm de largura · costas: até 30 cm. Conferir cor com prova física: tecido escurece o ciano.</p>""")

# ---------------------------------------------------------------- merch: levar
def mug(bg, inner, handle, extra=""):
    return f'<div class="mug"><div class="mgb" style="background:{bg};{extra}">{inner}<i class="shine"></i></div><div class="mgh" style="border-color:{handle}"></div></div>'


bottle = f'<div class="btl"><div class="btc"></div><div class="btb">{I("v4-go-dark.svg", h=40)}<span class="vt2">{slogan("xs")}</span></div></div>'
case = f'<div class="case" style="background:url({go_pattern(opacity=.18)}) 0 0/70px,{PURPLE}"><div class="cam"><i></i><i></i></div><div class="cl2">{I("v4-lockup-purple.svg", h=22)}</div></div>'
opener = f'<div class="opn"><div class="ring"></div>{I("v4-go-ink.svg", h=110, cls="metal")}</div>'
btns = f'<div class="bts"><i class="purple">{I("v4-go-white.svg", h=34)}</i><i class="dark">{slogan("xs")}</i><i class="wh">{I("v4-go-light.svg", h=34)}</i></div>'
note = f'<div class="nb"><div class="nbc">{I("v4-go-dark.svg", h=46)}</div><div class="nbe"></div></div>'
lev = [(mug("#FFFFFF", I('v4-lockup-light.svg', h=22), "#E6E6EE", "box-shadow:inset 0 0 0 1px #DCDDE5"), "Caneca branca", "Lockup no claro. Sublimação."),
       (mug("#0A0A0E", I('v4-go-dark.svg', h=36) + slogan("xs"), "#0A0A0E"), "Caneca preta", "Símbolo + slogan. Gravação ou sublimação."),
       (mug(PURPLE, '<span class="mq">Segunda é pra<br>contar do <b>rolê.</b></span>', "#452EFF"), "Caneca roxa", "Frase da marca + Go no verso."),
       (bottle, "Garrafa térmica", "Preta, símbolo e slogan na vertical."),
       (case, "Capinha de celular", "Padrão Go no roxo + lockup."),
       (opener, "Chaveiro-abridor", "Corte a laser no desenho do Go, inox."),
       (btns, "Bottons 38 mm", "Roxo, preto e branco — kit de 3."),
       (note, "Caderno A5", "Capa preta, Go em hot stamping ciano.")]
lv = "".join(f'<div class="mi"><div class="miv">{v}</div><b>{t}</b><p>{d}</p></div>' for v, t, d in lev)
page("Merch · levar", "mist", "Merch · levar", "Canecas, garrafa, capinha e brindes", f'<div class="mgrid g4">{lv}</div>')

reuse("role", "No rolê · evento")
reuse("rua", "Rua · mídia exterior")
reuse("inst", "Institucional")

# ---------------------------------------------------------------- acessibilidade + IA
page("Acessibilidade e IA", "light", "Acessibilidade e conteúdo com IA", "Regras que valem pra todo mundo", f"""
<div class="aig"><div><div class="sub">Acessibilidade</div><ul class="rl">
<li>Texto corrido ≥ 4,5:1 (AA). No roxo, texto pequeno é sempre branco.</li><li>Ciano no roxo só em título grande e no Go.</li>
<li>Estado nunca só por cor ou só por motion: ícone + texto junto.</li><li>Foco visível: anel ciano de 2 px no preto, roxo no claro.</li>
<li>Nada piscando mais de 3× por segundo. <code>prefers-reduced-motion</code> respeitado.</li><li>Alvo de toque ≥ 44 px. Alt text em todo post (“Post RolêGo: …”).</li></ul></div>
<div><div class="sub">Conteúdo gerado com IA</div><table class="ct"><tr><th>Pode sem revisão</th><th>Precisa de revisão humana</th></tr>
<tr><td>Rascunho de legenda na voz da marca</td><td>Logo, lockup ou símbolo novo</td></tr><tr><td>Post a partir dos templates deste manual</td><td>Campanha paga, outdoor, mídia externa</td></tr>
<tr><td>Variação de texto em botão e push</td><td>Qualquer imagem com pessoas</td></tr><tr><td>Tradução de tela</td><td>Texto de segurança, pagamento e termos</td></tr></table>
<p class="note"><b>Proibido em prompt de imagem:</b> rostos de pessoas reais, glow neon no logo, roxo→índigo genérico de SaaS, orb 3D, plástico brilhante, texto gerado dentro da imagem.</p></div>
<div><div class="sub">Checklist antes de publicar</div><ul class="chk">
<li>Rolê e Go em cores diferentes</li><li>Acento no Rolê, Go como símbolo</li><li>Nenhuma letra roxa no preto</li><li>Área de proteção respeitada</li>
<li>Uma palavra em destaque, no máx.</li><li>Poppins, título em itálico</li><li>Contraste AA no texto</li><li>Foto com degradê atrás do logo</li></ul></div></div>""")

# ---------------------------------------------------------------- contracapa
pages.append((None, f"""<section class="page purple cover" style="background-image:url({go_pattern(opacity=.07)}),{PURPLE};background-size:180px,cover;align-items:center;justify-content:center;text-align:center">
{I('v4-stacked-purple.svg', h=250)}<div class="slo" style="font-size:44px;margin-top:20px">Viva o <b>rolê.</b></div>
<p class="lead" style="margin-top:24px;text-align:center">rolego.com.br · @rolego</p>{foot()}</section>"""))

# ---------------------------------------------------------------- numeração e sumário
toc = [(i + 1, t) for i, (t, _) in enumerate(pages) if t and t != "__TOC__"]
half = (len(toc) + 1) // 2
col = lambda items: "".join(f'<div class="ti"><span>{n:02d}</span><b>{t}</b></div>' for n, t in items)
toc_html = f"""<section class="page light"><div class="eyebrow">@@E@@ · Sumário</div><h2>O que tem aqui</h2>
<div class="toc"><div>{col(toc[:half])}</div><div>{col(toc[half:])}</div></div>
<div class="files"><div class="sub">Arquivos do kit</div><p><code>identidade-visual-rolego-v4.pdf</code> este manual · <code>BRAND.md</code> guia de uma página · <code>tokens.css</code> cores, tipo, raio e motion ·
<code>motion-guidelines.md</code> + <code>motion/logo-reveal.html</code> · <code>posts/</code> e <code>stories/</code> PNGs · <code>../logo-v4/*.svg</code> masters do logo</p></div>{foot()}</section>"""
pages = [(t, toc_html if t == "__TOC__" else h) for t, h in pages]

out = []
for n, (_, h) in enumerate(pages, 1):
    out.append(h.replace("@@N@@", str(n)).replace("@@E@@", f"{n:02d}"))
body = "".join(out)
body = body.replace("url(foto-multidao-1.jpg)", f"url({uri('foto-multidao-1.jpg')})").replace("url(foto-multidao-2.jpg)", f"url({uri('foto-multidao-2.jpg')})")

CSS = open(os.path.join(HERE, "_manual.css")).read().replace("PURPLE", PURPLE)
USOS_CSS = USOS_CSS.replace("url(foto-multidao-1.jpg)", f"url({uri('foto-multidao-1.jpg')})").replace("url(foto-multidao-2.jpg)", f"url({uri('foto-multidao-2.jpg')})")
html = f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>RolêGo — identidade visual v4</title><style>{FONT}{USOS_CSS}{CSS}</style></head><body>{body}</body></html>'
open(OUT_HTML, "w").write(html)
print("html ok", len(pages), "págs", f"{len(html) / 1e6:.1f} MB")
if "--no-pdf" not in sys.argv:
    pdf(OUT_HTML, OUT_PDF)
    print("pdf ok")

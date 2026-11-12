#!/usr/bin/env python3
"""Clozzy — documento “Letreiro + lockup” (rodada 11 v2: símbolo sempre separado da palavra).
Estrutura de sistema do manual RolêGo v4 (logo system, construção, usos incorretos, cores, utilizações) aplicada ao símbolo da
rodada 10 (logo-c-canto-v2). Rodar: python3 _letreiro.py && python3 _build.py → letreiro-clozzy.{html,pdf}"""
import base64, importlib.util, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
MARCA = HERE.parent
sys.path.insert(0, str(HERE))
import _letreiro as T  # noqa: E402

K = T.K
sys.path.insert(0, str(MARCA / "referencias-apps"))
_spec = importlib.util.spec_from_file_location("ra_build_letreiro", MARCA / "referencias-apps" / "_build.py")
RA = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(RA)

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT_HTML = HERE / "letreiro-clozzy.html"
OUT_PDF = HERE / "letreiro-clozzy.pdf"
PINK, DEEP, PURPLE, INK, CREAM, WHITE = T.PINK, T.DEEP, T.PURPLE, T.INK, T.CREAM, T.WHITE
PH = RA.PH
SYM = K.make([16, 22], 10, [22, 28], 16)          # símbolo da rodada 10 (d1)
LT = {s[0]: s for s in T.LETREIROS}
SM = {s[0]: s for s in T.SIMBOLOS}
MAIN = "k2-equilibrado"                            # recomendado
FUN = {fz[0]: fz for fz in T.FUNDOS}


def sv(s):
    return "data:image/svg+xml;base64," + base64.b64encode(s.encode()).decode()


def img(src, w=None, h=None, style=""):
    sz = (f"width:{w}px;" if w else "") + (f"height:{h}px;" if h else "")
    return f'<img src="{src}" style="{sz}display:block;{style}">'


def word(slug, fundo="cream", h=40, style=""):
    _f, _n, _bg, wc, sc, st = FUN[fundo]
    if slug in LT:
        w = LT[slug][3](wc, sc)
    else:
        w = SM[slug][3](wc, sc, st)
    return img(sv(w.svg(h=h)), h=h, style=style)


def logo(fundo="cream", h=40, style=""):
    return word(MAIN, fundo, h, style)


def sym(rc=DEEP, sc=None, size=60, small=False, style=""):
    return img(sv(K.svg100(SYM(rc, sc, small))), size, size, style)


def app(bg, rc, sc=None, size=80, small=False):
    return img(sv(K.app(SYM(rc, sc, small), bg)), size, size)


def stacked(fundo="cream", h=120):
    return word("k6-empilhado", fundo, h)


RA.wordlogo = lambda kind="x", h=22, dark=False: logo("preto" if dark else "cream", h)
RA.mark = lambda kind="x", size=28, dark=False: sym(PINK if dark else DEEP, size=size)


def foot(n):
    return f'<div class="foot"><span>Clozzy · letreiro e lockup · rodada 11 v2 · nov 2026</span><span>{n:02d}</span></div>'


EXTRA = f"""
h1 em,h2 em{{font-style:normal;color:{DEEP}}} .ink h1 em,.ink h2 em{{color:{PINK}}} .pink h1 em,.pink h2 em{{color:{INK}}}
.page.pink{{background:{PINK};color:{WHITE}}} .pink .kicker{{color:{INK}}} .pink .lead{{color:rgba(255,255,255,.88)}} .pink .foot{{color:rgba(255,255,255,.7)}}
.box{{background:{WHITE};border-radius:18px;padding:14px 16px}} .white .box{{background:{CREAM}}} .ink .box{{background:rgba(255,255,255,.06)}}
.box h4{{font:800 14px Gabarito;margin-bottom:5px}} .box p,.box li{{font-size:11px;line-height:1.5}} .box li{{margin-left:15px}}
.cols{{display:grid;gap:14px}}
.g4{{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:10px}} .g3{{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:10px}}
.card .pl{{border-radius:16px;height:118px;display:grid;place-items:center;border:1px solid rgba(20,9,15,.07)}}
.card b{{display:block;font:800 13.5px Gabarito;margin-top:7px}} .card small{{display:block;font-size:10px;line-height:1.38;color:rgba(20,9,15,.66);margin-top:2px}}
.ink .card small{{color:rgba(255,255,255,.65)}}
.card code{{display:inline-block;margin-top:5px;font:600 8.5px ui-monospace,Menlo;background:rgba(124,72,196,.1);color:{PURPLE};padding:2px 6px;border-radius:5px}}
.card.on .pl{{outline:3px solid {DEEP};outline-offset:2px}} .num{{font:800 10px Figtree;letter-spacing:.12em;color:{DEEP}}}
.tag{{font:800 9.5px Figtree;letter-spacing:.12em;text-transform:uppercase}}
.mock{{border-radius:18px;overflow:hidden;position:relative}}
.cap2{{font-size:10px;margin-top:6px;line-height:1.35}} .cap2 b{{font:800 12px Gabarito;display:block}}
.x{{position:relative}} .x:after{{content:"";position:absolute;right:8px;top:8px;width:20px;height:20px;border-radius:50%;background:{DEEP};
  background-image:linear-gradient(45deg,transparent 45%,#fff 45%,#fff 55%,transparent 55%),linear-gradient(-45deg,transparent 45%,#fff 45%,#fff 55%,transparent 55%)}}
.chip{{display:inline-block;font:700 10.5px Figtree;padding:5px 11px;border-radius:99px;border:1.5px solid currentColor;margin:0 5px 5px 0}}
"""


# ------------------------------------------------------------------ páginas
def p_cover():
    return f"""<section class="page pink" style="display:flex;flex-direction:column;justify-content:space-between">
<div class="kicker" style="color:{WHITE};opacity:.9">Clozzy 2028 · Logo · Rodada 11 · v2</div>
<div>{logo("rosa", 150)}
<h1 style="margin-top:34px;font-size:52px">Letreiro e <em>lockup.</em></h1>
<p class="lead" style="margin-top:12px;max-width:640px">O símbolo da rodada 10 fica sempre separado da palavra, ao lado ou acima, e nunca vira letra. Sete letreiros, seis lockups, um sistema completo e utilizações, do ícone à parede de evento.</p></div>
<div style="display:flex;gap:14px;align-items:flex-end">{app(INK, PINK, size=64)}{app(WHITE, DEEP, size=64)}{app(PURPLE, WHITE, PINK, size=64)}{sym(WHITE, INK, 64)}</div>{foot(1)}</section>"""


def p_origem(n):
    return f"""<section class="page cream"><div class="kicker">{n:02d} · De onde vem</div><h2>Três fontes, <em>uma regra cada</em></h2>
<div class="cols" style="grid-template-columns:repeat(3,1fr);margin-top:14px">
<div class="box"><div style="display:grid;place-items:center;height:150px">{sym(DEEP, size=130)}</div><h4>Rodada 10 · C no canto</h4>
<p>C de pontas inteiras, traço 9, tracejado no canto superior esquerdo com traços de 16° e 22° e vão de 10°, estrela R 18. É o símbolo usado aqui, sem redesenho.</p></div>
<div class="box"><div style="display:grid;place-items:center;height:150px;background:linear-gradient(135deg,#9E19E9,#452EFF);border-radius:12px;color:#fff;font:italic 800 38px Gabarito">Rolê<span style="color:#00E5E5">Go</span></div><h4>RolêGo v4 · o que vem de lá</h4>
<ul><li>Nome e símbolo nunca na mesma cor (exceto as versões de uma cor).</li><li>A cor é superfície e a marca vai em branco.</li><li>Família: lockup, empilhado, símbolo, ícone, uma cor.</li><li><b>O que não vem</b>: o símbolo virar letra. No Clozzy, o símbolo e a palavra ficam sempre separados.</li></ul></div>
<div class="box"><h4>Pesquisa 2026 + core/04 e 05</h4>
<ul><li><b>Wordmark como sistema</b>: lockup → letreiro → símbolo → ícone, que se adapta ao espaço.</li>
<li><b>Tipografia expressiva</b>: contador preenchido, ligadura e itálico como movimento parado (LogoLounge 2026).</li>
<li><b>Ligado à metáfora do produto</b>: a estrela do Close Friends aparece no letreiro (no o ou como expoente), sem mexer no símbolo.</li>
<li><b>Fundamentos</b>: 16 px, uma cor, silhueta própria.</li></ul>
<p style="margin-top:8px"><b>Eixos ativos:</b> família responsiva + tipografia expressiva.<br><b>Evitados:</b> degradê roxo SaaS, glow neon, 3D brilhante, microtexto.</p></div></div>
<p class="lead" style="margin-top:14px">Palavras-chave do Clozzy: <b>stories, close friends, estrela, privado</b>. Em toda variação, o tracejado lembra o story carregando e a estrela marca o exclusivo.</p>{foot(n)}</section>"""


def p_letreiros(n):
    cards = ""
    for i, (slug, name, idea, _fn) in enumerate(T.LETREIROS):
        cards += (f'<div class="card"><div class="pl" style="background:{WHITE}">{word(slug, "cream", 46)}</div>'
                  f'<div class="num" style="margin-top:7px">{i + 1:02d}</div><b>{name}</b><small>{idea}</small></div>')
    return f"""<section class="page cream"><div class="kicker">{n:02d} · Letreiros</div><h2>Sete jeitos de <em>escrever clozzy</em></h2>
<p class="lead">Todos em Gabarito, a fonte da marca, com as letras desenhadas em curva. A ideia de cada um fica numa letra só.</p>
<div class="g4">{cards}</div>{foot(n)}</section>"""


def p_letreiros_cor(n):
    rows = ""
    for slug, name, *_ in T.LETREIROS:
        cells = "".join(f'<div style="background:{FUN[fz][2]};border-radius:10px;height:54px;display:grid;place-items:center;{"border:1px solid rgba(20,9,15,.08);" if fz in ("branco", "cream") else ""}">{word(slug, fz, 26)}</div>'
                        for fz in ("rosa", "preto", "cream", "roxo"))
        small = "".join(word(slug, "cream", px) for px in (22, 16, 12))
        rows += (f'<div style="display:grid;grid-template-columns:120px repeat(4,1fr) 160px;gap:8px;align-items:center">'
                 f'<b style="font:800 12px Gabarito">{name}</b>{cells}<div style="display:flex;gap:8px;align-items:center">{small}</div></div>')
    return f"""<section class="page white"><div class="kicker">{n:02d} · Letreiros em cor e no pequeno</div><h2>Rosa, preto, cream, roxo <em>e 12 px</em></h2>
<div style="display:grid;gap:7px;margin-top:10px">{rows}</div>
<p class="lead" style="margin-top:8px">No pequeno, a estrela do o e a estrela expoente somem antes das letras: abaixo de 20 px, use o letreiro base. O zz ligado e o clo · zzy continuam legíveis.</p>{foot(n)}</section>"""


def p_familia(n):
    weights = ""
    for wg in (400, 500, 600, 700, 800, 900):
        w = T.Word(wg, track=-18 if wg >= 700 else -10).text("clozzy", INK)
        weights += f'<div style="text-align:center">{img(sv(w.svg(h=34)), h=34)}<small style="font-size:9.5px">{wg}</small></div>'
    steps = [("Lockup", logo("cream", 40), "≥ 96 px"), ("Letreiro", word("l1-base", "cream", 34), "≥ 64 px"),
             ("Símbolo", sym(DEEP, size=48), "≥ 24 px"), ("Corte 16", sym(DEEP, size=24, small=True), "16 px"), ("Ícone", app(PINK, WHITE, size=52), "app / avatar")]
    st = "".join(f'<div class="box" style="display:flex;flex-direction:column;align-items:center;justify-content:space-between;height:150px">'
                 f'<div style="flex:1;display:grid;place-items:center">{el}</div><b style="font:800 13px Gabarito">{t}</b><small style="font-size:10px">{m}</small></div>'
                 for t, el, m in steps)
    return f"""<section class="page cream"><div class="kicker">{n:02d} · Família responsiva</div><h2>Do outdoor ao favicon, <em>a mesma marca</em></h2>
<p class="lead">Tendência 2026 que serve ao Clozzy: a marca encolhe por etapas em vez de ser só reduzida. Cada etapa tira um elemento: primeiro a palavra, depois o detalhe do canto.</p>
<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-top:12px">{st}</div>
<div class="box" style="margin-top:14px"><h4>Peso do letreiro por tamanho</h4><div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:8px">{weights}</div>
<p style="margin-top:8px">800 é o padrão (app, ícones, até 16 px). 500–600 só em tamanho grande (capa, outdoor, parede), onde o 800 pesa demais. 400 e 900 ficam fora.</p></div>{foot(n)}</section>"""


def p_simbolos(n):
    cards = ""
    for i, (slug, name, idea, _fn) in enumerate(T.SIMBOLOS):
        on = " on" if slug == MAIN else ""
        rec = ' · <span style="color:#E0005A">recomendada</span>' if slug == MAIN else ""
        cards += (f'<div class="card{on}"><div class="pl" style="background:{WHITE};height:104px">{word(slug, "cream", 50)}</div>'
                  f'<div style="display:flex;gap:6px;margin-top:6px">'
                  + "".join(f'<div style="flex:1;background:{FUN[fz][2]};border-radius:8px;height:36px;display:grid;place-items:center">{word(slug, fz, 18)}</div>' for fz in ("rosa", "preto", "roxo"))
                  + f'</div><div class="num" style="margin-top:7px">{i + 1:02d}{rec}</div><b>{name}</b><small>{idea}</small></div>')
    return f"""<section class="page cream"><div class="kicker">{n:02d} · Lockups</div><h2>Símbolo ao lado, <em>nunca dentro</em></h2>
<div class="g3" style="gap:12px 16px">{cards}</div>{foot(n)}</section>"""


def p_peso(n):
    cells = ""
    for slug, rec in (("k1-compacto", False), ("k2-equilibrado", True), ("k3-simbolo-grande", False)):
        name, idea = SM[slug][1], SM[slug][2]
        sm = "".join(word(slug, "cream", px) for px in (30, 20, 14))
        ol = f"outline:3px solid {DEEP};" if rec else ""
        cells += (f'<div class="box" style="{ol}"><div style="height:150px;display:grid;place-items:center">{word(slug, "cream", 70)}</div>'
                  f'<div style="display:flex;gap:14px;align-items:flex-end;justify-content:center">{sm}</div>'
                  f'<div style="display:flex;gap:8px;margin-top:10px">' + "".join(f'<div style="flex:1;background:{FUN[fz][2]};border-radius:8px;height:44px;display:grid;place-items:center">{word(slug, fz, 22)}</div>' for fz in ("rosa", "preto")) +
                  f'</div><h4 style="margin-top:10px">{name}{" · recomendado" if rec else ""}</h4><p>{idea}</p></div>')
    return f"""<section class="page white"><div class="kicker">{n:02d} · De perto</div><h2>Quanto de símbolo <em>ao lado da palavra?</em></h2>
<div class="cols" style="grid-template-columns:repeat(3,1fr);margin-top:12px">{cells}</div>
<p class="lead" style="margin-top:12px">O símbolo é o da rodada 10 sem mudança: traço 9, traços do canto de 16° e 22°, estrela R 18. Só muda o tamanho dele em relação à palavra. Abaixo de 24 px, o lockup dá lugar ao símbolo sozinho.</p>{foot(n)}</section>"""


def p_sistema(n):
    cards = [
        (PINK, logo("rosa", 44), "Lockup no rosa · principal", "Capas, header, peças de marca. Palavra branca, símbolo ink.", "k2-equilibrado-rosa.svg"),
        (INK, logo("preto", 44), "Lockup no preto", "App, vídeo, noite. Palavra branca, símbolo rosa. Sem letra roxa no preto.", "k2-equilibrado-preto.svg"),
        (CREAM, logo("cream", 44), "Lockup no claro", "Documentos, e-mail, papelaria. Palavra ink, símbolo Pink Deep.", "k2-equilibrado-cream.svg"),
        (PURPLE, stacked("roxo", 104), "Empilhado", "Splash, ecobag, espaços quadrados. Símbolo grande em cima.", "k6-empilhado-roxo.svg"),
        (INK, sym(PINK, size=90), "Símbolo", "Avatar, estampa, marca d'água, quando o nome já está por perto.", "rodada 10 · d1"),
        (WHITE, app(PINK, WHITE, size=90), "Ícone de app", "Loja, home, favicon. Tile rosa com o símbolo branco.", "app-rosa"),
        (PINK, logo("mono-branco", 44), "Uma cor · branco", "Silk de 1 cor, gravação. É a única exceção à regra das duas cores.", "k2-equilibrado-mono-branco.svg"),
        (WHITE, logo("mono-ink", 44), "Uma cor · ink", "Impressão P&B, carimbo, nota.", "k2-equilibrado-mono-ink.svg"),
    ]
    html = "".join(f'<div class="card"><div class="pl" style="background:{bg};height:130px">{el}</div><b>{t}</b><small>{d}</small><code>{c}</code></div>'
                   for bg, el, t, d, c in cards)
    return f"""<section class="page white"><div class="kicker">{n:02d} · Logo · sistema</div><h2>Palavra numa cor, símbolo em outra, <em>sempre</em></h2>
<div class="g4" style="gap:14px">{html}</div>{foot(n)}</section>"""


def p_construcao(n):
    big = logo("cream", 150)
    anat = sym(DEEP, size=210)
    mins = [("Lockup", logo("cream", 26), "mín. 96 px · 25 mm"), ("Empilhado", stacked("cream", 60), "mín. 64 px · 18 mm"),
            ("Símbolo", f'<div style="display:flex;gap:10px;align-items:center">{sym(DEEP, size=24)}{sym(DEEP, size=16, small=True)}</div>', "mín. 16 px · 6 mm"),
            ("Favicon", f'<div style="display:flex;gap:8px;align-items:center">{app(PINK, WHITE, size=16, small=True)}{app(PINK, WHITE, size=24, small=True)}{app(PINK, WHITE, size=32)}</div>', "16 · 24 · 32 px")]
    mh = "".join(f'<div class="box" style="display:flex;flex-direction:column;justify-content:space-between;height:120px;border:1px solid rgba(20,9,15,.07)"><div>{el}</div><div><h4>{t}</h4><p>{m}</p></div></div>' for t, el, m in mins)
    return f"""<section class="page cream"><div class="kicker">{n:02d} · Construção, área de proteção e mínimos</div><h2>Símbolo e palavra, <em>cada um no seu lugar</em></h2>
<div style="display:grid;grid-template-columns:1.55fr 1fr;gap:20px;margin-top:8px">
<div><div class="tag" style="color:rgba(20,9,15,.6)">Área de proteção: x = metade da altura do l</div>
<div style="position:relative;margin-top:8px;background:{WHITE};border:1.5px dashed {DEEP};border-radius:6px;padding:46px 54px;display:grid;place-items:center">
{"".join(f'<span style="position:absolute;{p};width:42px;height:42px;background:rgba(224,0,90,.08);display:grid;place-items:center;font:800 12px Figtree;color:{DEEP}">x</span>' for p in ("left:0;top:0", "right:0;top:0", "left:0;bottom:0", "right:0;bottom:0"))}{big}</div>
<p class="lead" style="font-size:11px;margin-top:6px">Nada entra na área tracejada: texto, borda de peça, outro logo. Em peça pequena, use o símbolo em vez de apertar o lockup.</p>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:8px">{mh}</div></div>
<div><div class="tag" style="color:rgba(20,9,15,.6)">Anatomia do lockup</div>
<div class="box" style="margin-top:8px;display:grid;place-items:center;height:250px;background-image:linear-gradient(rgba(20,9,15,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(20,9,15,.05) 1px,transparent 1px);background-size:21px 21px">{anat}</div>
<div class="box" style="margin-top:10px"><ul>
<li><b>Anel</b>: 1,4× a altura do l, centrado entre a linha de base e o topo do l.</li><li><b>Vão</b>: 0,35 l entre o anel e o c. O c da palavra é sempre a letra da fonte.</li>
<li><b>Canto</b>: traços de 16° e 22°, vão de 10°. Em 16 px, 22° e 28° com vão de 16°.</li><li><b>Estrela</b>: R 18, a do símbolo da rodada 10, sem mudança.</li>
<li><b>Palavra</b>: Gabarito 800, aperto −18.</li></ul></div></div></div>{foot(n)}</section>"""


def p_incorretos(n):
    def bad(inner, bg, t):
        return f'<div class="card"><div class="pl x" style="background:{bg};height:110px">{inner}</div><small style="margin-top:6px;color:rgba(20,9,15,.8)">{t}</small></div>'
    lw = SM[MAIN][3](WHITE, WHITE, WHITE)
    same = img(sv(SM[MAIN][3](INK, INK, INK).svg(h=40)), h=40)
    roxo_preto = img(sv(SM[MAIN][3](PURPLE, PINK, PINK).svg(h=40)), h=40)
    items = [
        (img(sv(lw.svg(h=40)), h=40, style="transform:scaleX(1.35)"), PINK, "Esticar, achatar, girar."),
        (logo("cream", 40, "filter:drop-shadow(0 0 8px #FF0065) drop-shadow(0 0 16px #FF0065)"), INK, "Glow, sombra, contorno, neon."),
        (same, CREAM, "Palavra e símbolo na mesma cor em peça colorida (fora da versão uma cor)."),
        (roxo_preto, INK, "Letra roxa no preto: contraste 3,3:1. Roxo é superfície."),
        (img(sv(T.Word(800).piece(SYM(DEEP), T.ASC + 40, bottom=14, lsb=0, rsb=30).text("lozzy", INK).svg(h=40)), h=40), CREAM, "Fundir o símbolo com o c da palavra. O símbolo nunca vira letra."),
        (logo("cream", 40, "opacity:.5"), "linear-gradient(135deg,#9E19E9,#452EFF)", "Degradê roxo de app SaaS atrás da marca."),
        (img(sv(T.Word(800).text("cl", INK).piece(SYM(DEEP), T.XH + 90, bottom=36, lsb=10, rsb=14).text("zzy", INK).svg(h=40)), h=40), CREAM, "Trocar o o (ou qualquer letra) pelo símbolo."),
        (f'<div style="position:relative;width:100%;height:100%;display:grid;place-items:center;background:url({PH[2]}) center/cover">{logo("cream", 36)}</div>', WHITE, "Logo direto na foto, sem placa ou fade."),
    ]
    return f"""<section class="page white"><div class="kicker">{n:02d} · Usos incorretos</div><h2>O que <em>não fazer</em> com a marca</h2>
<div class="g4" style="gap:14px">{"".join(bad(*i) for i in items)}</div>{foot(n)}</section>"""


def p_cores(n):
    tiles = ""
    for fz, name, bg, wc, sc, st in T.FUNDOS:
        border = "border:1px solid rgba(20,9,15,.08);" if bg in (WHITE, CREAM) else ""
        light = bg in (PINK, PURPLE, INK)
        tiles += (f'<div class="card"><div class="pl" style="background:{bg};{border}height:96px">{logo(fz, 36)}</div><b>{name}</b>'
                  f'<small>palavra {wc} · símbolo {sc}{" · estrela " + st if st != sc else ""}</small></div>')
    sw = "".join(f'<div style="flex:{fl};background:{c};height:54px;border-radius:8px;display:flex;align-items:flex-end;padding:6px 8px;font:700 9.5px Figtree;color:{tc};{"border:1px solid rgba(20,9,15,.08);" if c in (WHITE, CREAM) else ""}">{t}<br>{c}</div>'
                 for c, t, fl, tc in ((PINK, "Rosa · superfície", 40, WHITE), (INK, "Ink", 25, WHITE), (CREAM, "Cream", 15, INK), (PURPLE, "Roxo", 10, WHITE), (DEEP, "Deep", 6, WHITE), (WHITE, "Branco", 4, INK)))
    return f"""<section class="page cream"><div class="kicker">{n:02d} · Cor</div><h2>Rosa é superfície, <em>a marca vai em branco</em></h2>
<div style="display:flex;gap:6px;margin-top:8px">{sw}</div>
<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:12px">{tiles}</div>
<p class="lead" style="margin-top:8px">Só as seis cores da marca. Proporção aproximada: 40 rosa, 25 ink, 15 cream, 10 roxo. Branco no rosa e ink no rosa servem para título grande; para texto corrido, ink no cream (17:1) ou branco no ink.</p>{foot(n)}</section>"""


def p_combina(n):
    pairs = [("Título de campanha", "l4-estrela-expoente", "Estrela expoente: “clozzy✦” ao fim de uma frase, no lugar do ponto."),
             ("Assinatura em vídeo", "l6-italico", "Itálico de 9° no fim de vídeos e reels, com o símbolo entrando separado logo antes."),
             ("Merch e estampa", "l2-estrela-no-o", "Estrela no o: grande no peito ou no boné, sem o símbolo."),
             ("Selo de criador", "l5-clo-zzy", "clo · zzy em duas cores para “parceiro clozzy”, “close clozzy”.")]
    rows = "".join(f'<div class="box" style="display:grid;grid-template-columns:1fr 1.3fr;gap:16px;align-items:center"><div style="display:grid;place-items:center;height:96px;background:{CREAM};border-radius:12px">{word(s, "cream", 44)}</div>'
                   f'<div><h4>{t}</h4><p>{d}</p></div></div>' for t, s, d in pairs)
    return f"""<section class="page white"><div class="kicker">{n:02d} · Letreiros que combinam</div><h2>Um lockup principal, <em>quatro letreiros de apoio</em></h2>
<div style="display:grid;grid-template-columns:330px 1fr;gap:18px;margin-top:12px">
<div class="mock" style="background:{PINK};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:20px">{logo("rosa", 64)}<span class="tag" style="color:#fff">principal</span>
<div style="display:flex;gap:10px">{app(INK, PINK, size=54)}{app(WHITE, DEEP, size=54)}{app(PURPLE, WHITE, PINK, size=54)}</div></div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">{rows}</div></div>
<p class="lead" style="margin-top:12px">O principal é o lockup equilibrado. Os letreiros de apoio nunca aparecem na mesma peça que ele: cada um tem o seu lugar. Itálico e leve 500 ficam para tipografia de campanha, não para logo.</p>{foot(n)}</section>"""


def phone(bg, inner):
    return f'<div class="phone"><div class="scr" style="background:{bg}">{inner}</div></div>'


def p_app(n):
    splash = phone(PINK, f'<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px">{logo("rosa", 54)}'
                         f'<div style="font-size:11px;color:#fff;opacity:.85">Seu close, seu preço.</div></div>')
    tiles = "".join(f'<span style="display:flex;flex-direction:column;align-items:center;gap:4px;font-size:8.5px;color:#fff"><i style="width:46px;height:46px;border-radius:12px;background:rgba(255,255,255,.16);display:block"></i>app</span>' for _ in range(6))
    home = phone("#3a2a36", f'<img src="{PH[1]}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.55">'
                            f'<div style="position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:18px 8px;padding:60px 14px">{tiles}'
                            f'<span style="display:flex;flex-direction:column;align-items:center;gap:4px;font-size:8.5px;color:#fff">{app(PINK, WHITE, size=46)}Clozzy</span></div>'
                            f'<div style="position:absolute;left:10px;right:10px;top:260px;background:rgba(255,255,255,.9);border-radius:18px;padding:10px 12px;display:flex;gap:10px;align-items:center">'
                            f'{app(PINK, WHITE, size=34)}<div style="font-size:10.5px;line-height:1.35"><b>Clozzy</b> · agora<br>A Nina postou 3 stories no Close ✦</div></div>')
    return f"""<section class="page cream"><div class="kicker">{n:02d} · Utilizações · app</div><h2>Ícone, splash e <em>header</em></h2>
<div class="phones"><div class="pw">{home}<div class="cap"><b>Ícone + notificação</b><small>Tile rosa, símbolo branco.</small></div></div>
<div class="pw">{splash}<div class="cap"><b>Splash</b><small>Superfície rosa e lockup branco com o símbolo ink. O tracejado gira uma volta e para (520 ms).</small></div></div>
<div class="pw">{RA.s_home("x")}<div class="cap"><b>Header do app</b><small>Lockup no claro com 24 px de altura.</small></div></div></div>{foot(n)}</section>"""


def p_redes(n):
    grid = "".join(f'<div style="aspect-ratio:1;background:{bg};display:grid;place-items:center;overflow:hidden">{inner}</div>' for bg, inner in (
        (PINK, logo("rosa", 14)), (INK, f'<div style="font:800 14px/1.05 Gabarito;color:#fff;text-align:center;padding:6px">Seu close,<br><span style="color:{PINK}">seu preço.</span></div>'),
        (CREAM, word("l2-estrela-no-o", "cream", 18)), (PURPLE, sym(WHITE, PINK, 56)), (INK, word("l4-estrela-expoente", "preto", 18)), (PINK, sym(WHITE, INK, 56))))
    hl = "".join(f'<div style="text-align:center"><div style="width:52px;height:52px;border-radius:50%;background:{bg};display:grid;place-items:center;box-shadow:0 0 0 2px #fff,0 0 0 3.5px rgba(20,9,15,.15)">{sym(rc, sc, 32)}</div><div style="font-size:9px;margin-top:4px">{t}</div></div>'
                 for bg, rc, sc, t in ((PINK, WHITE, INK, "Close"), (PURPLE, WHITE, PINK, "Drops"), (INK, PINK, PINK, "Como funciona"), (CREAM, DEEP, DEEP, "Pix")))
    profile = phone(WHITE, f'{RA.status()}<div style="padding:6px 14px;font:800 14px Figtree">clozzy ✓</div>'
                           f'<div style="display:flex;align-items:center;gap:14px;padding:6px 14px"><div style="width:74px;height:74px;border-radius:50%;background:{PINK};display:grid;place-items:center">{sym(WHITE, INK, 50)}</div>'
                           f'<div style="display:flex;gap:12px;font-size:10px;text-align:center"><div><b style="font-size:13px">312</b><br>posts</div><div><b style="font-size:13px">48 mil</b><br>seguidores</div><div><b style="font-size:13px">12</b><br>seguindo</div></div></div>'
                           f'<div style="padding:4px 14px;font-size:10.5px;line-height:1.4"><b>Clozzy</b><br>Seu close, seu preço. ✦<br><span style="color:{DEEP};font-weight:700">clozzy.com</span></div>'
                           f'<div style="display:flex;gap:12px;padding:10px 14px">{hl}</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px">{grid}</div>')
    story = phone(INK, f'<img src="{PH[3]}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.5">'
                       f'<div style="position:absolute;inset:auto 0 0 0;height:60%;background:linear-gradient(transparent,{INK})"></div>'
                       f'<div style="position:absolute;left:0;right:0;bottom:60px;display:flex;flex-direction:column;align-items:center;gap:12px">'
                       f'<div style="font:800 28px/1.02 Gabarito;color:#fff;text-align:center">Meu Close<br>abriu<span style="color:{PINK}">✦</span></div>'
                       f'<span style="background:{PINK};color:#fff;font:800 12px Figtree;padding:10px 16px;border-radius:99px">clozzy.com/nina</span>{logo("preto", 18)}</div>')
    post = (f'<div class="mock" style="background:{PINK};height:262px;display:flex;flex-direction:column;justify-content:space-between;padding:20px">'
            f'<div style="font:800 36px/.98 Gabarito;color:#fff">Seu close,<br><span style="color:{INK}">seu preço.</span></div>{logo("rosa", 28)}</div>'
            f'<div class="cap"><b>Post 1080 × 1080</b><small>Título branco e uma palavra em ink. Lockup no pé.</small></div>'
            f'<div class="mock" style="background:{INK};height:150px;margin-top:12px;display:grid;place-items:center">{word("l4-estrela-expoente", "preto", 40)}</div>'
            f'<div class="cap"><b>Capa de destaque / reels</b><small>Letreiro com estrela expoente.</small></div>')
    return f"""<section class="page white"><div class="kicker">{n:02d} · Utilizações · redes</div><h2>Perfil, story e <em>post</em></h2>
<div class="phones"><div class="pw">{profile}<div class="cap"><b>Perfil</b><small>Avatar rosa com o símbolo; destaques nas cores da marca.</small></div></div>
<div class="pw">{story}<div class="cap"><b>Story do criador</b><small>Foto com fade para o ink; a estrela rosa entra no lugar do ponto.</small></div></div>
<div class="pw">{post}</div></div>{foot(n)}</section>"""


def p_letreiro_fisico(n):
    wall = (f'<div class="mock" style="height:250px;background:linear-gradient(#efe6e2,#e3d8d3);display:flex;flex-direction:column;align-items:center;justify-content:center">'
            f'<div style="filter:drop-shadow(5px 7px 0 rgba(20,9,15,.13));margin-bottom:70px">{logo("cream", 64)}</div>'
            f'<div style="position:absolute;bottom:0;left:0;right:0;height:40px;background:#cbbdb6"></div>'
            f'<div style="position:absolute;bottom:40px;left:30px;width:90px;height:38px;background:{INK};border-radius:6px 6px 0 0"></div></div>'
            f'<div class="cap2"><b>Letras-caixa na parede do escritório</b>Acrílico rosa Deep e ink com 3 cm de recuo. A sombra vem da luz da sala, não de efeito.</div>')
    backdrop = (f'<div class="mock" style="height:250px;background:{PINK};display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:62px;place-items:center;gap:0">'
                + "".join(logo("rosa", 19) if (i % 2 == 0) else sym(WHITE, INK, 40) for i in range(16))
                + '</div><div class="cap2"><b>Backdrop de evento · Clozzy Creators Day</b>Lockup e símbolo alternados em xadrez.</div>')
    neon = (f'<div class="mock" style="height:250px;background:{INK};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px">'
            f'{logo("preto", 66)}<span class="tag" style="color:rgba(255,255,255,.6)">fita de LED sem difusor de glow</span></div>'
            f'<div class="cap2"><b>Letreiro de LED no camarim / estúdio</b>Símbolo em fita rosa e letras brancas. Linha nítida, sem halo.</div>')
    out = (f'<div class="mock" style="height:190px;background:url({PH[5]}) center/cover"><div style="position:absolute;inset:0;background:linear-gradient(90deg,{INK} 45%,transparent)"></div>'
           f'<div style="position:absolute;left:22px;top:24px;font:800 34px/1 Gabarito;color:#fff">Seu close,<br><span style="color:{PINK}">seu preço.</span></div>'
           f'<div style="position:absolute;left:22px;bottom:20px">{logo("preto", 30)}</div></div><div class="cap2"><b>Outdoor 9 × 3</b>Foto com fade para o ink; lockup no canto inferior esquerdo.</div>')
    mupi = (f'<div style="display:flex;gap:14px"><div class="mock" style="width:120px;height:190px;background:{PINK};display:flex;flex-direction:column;justify-content:space-between;padding:12px">'
            f'<div style="font:800 19px/1 Gabarito;color:#fff">Entrou no<br><span style="color:{INK}">Close</span></div>{sym(WHITE, INK, 70)}{logo("rosa", 15)}</div>'
            f'<div class="mock" style="width:120px;height:190px;background:{PURPLE};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px">{stacked("roxo", 76)}</div></div>'
            f'<div class="cap2"><b>Mupi e lambe</b>Rosa com símbolo; roxo com o empilhado.</div>')
    return f"""<section class="page cream"><div class="kicker">{n:02d} · Letreiro no mundo</div><h2>Parede, evento, estúdio <em>e rua</em></h2>
<div class="cols" style="grid-template-columns:repeat(3,1fr);margin-top:10px"><div>{wall}</div><div>{backdrop}</div><div>{neon}</div></div>
<div class="cols" style="grid-template-columns:1.6fr 1fr;margin-top:12px"><div>{out}</div><div>{mupi}</div></div>{foot(n)}</section>"""


def tee(color, inner, w=150):
    path = "M30 10 L50 4 Q60 14 70 4 L90 10 L110 30 L96 42 L88 36 L88 120 L32 120 L32 36 L24 42 L10 30 Z"
    return (f'<svg viewBox="0 0 120 124" width="{w}"><path d="{path}" fill="{color}" stroke="rgba(20,9,15,.12)" stroke-width=".8"/>'
            f'<foreignObject x="36" y="34" width="48" height="40"><div xmlns="http://www.w3.org/1999/xhtml" style="display:flex;justify-content:center">{inner}</div></foreignObject></svg>')


def p_merch(n):
    cap = (f'<svg viewBox="0 0 140 90" width="150"><path d="M15 66 Q18 18 70 14 Q122 18 125 66 Z" fill="{PINK}"/><path d="M8 66 L132 66 Q140 74 120 78 L20 78 Q0 74 8 66Z" fill="#d1004f"/>'
           f'<foreignObject x="50" y="34" width="40" height="24"><div xmlns="http://www.w3.org/1999/xhtml">{sym(WHITE, INK, 22, style="margin:auto")}</div></foreignObject></svg>')
    bag = (f'<div class="mock" style="width:150px;height:170px;background:{CREAM};border:1px solid rgba(20,9,15,.1);display:grid;place-items:center;margin-top:20px;overflow:visible">'
           f'<div style="position:absolute;top:-22px;left:40px;width:70px;height:40px;border:5px solid #d9cfc9;border-bottom:0;border-radius:40px 40px 0 0"></div>{word("l2-estrela-no-o", "cream", 30)}</div>')
    mug = (f'<div style="display:flex;align-items:center"><div class="mock" style="width:96px;height:112px;background:{INK};border-radius:8px 8px 14px 14px;display:grid;place-items:center">{sym(PINK, size=56)}</div>'
           f'<div style="width:28px;height:52px;border:9px solid {INK};border-left:0;border-radius:0 26px 26px 0"></div></div>')
    stickers = "".join(f'<div style="width:{s}px;height:{s}px;border-radius:50%;background:{bg};display:grid;place-items:center;box-shadow:0 5px 12px rgba(20,9,15,.15)">{el}</div>'
                       for s, bg, el in ((92, PINK, sym(WHITE, INK, 60)), (92, INK, sym(WHITE, PINK, 60)), (92, PURPLE, sym(PINK, size=60))))
    pill = (f'<div style="background:{WHITE};border-radius:99px;padding:12px 22px;box-shadow:0 5px 12px rgba(20,9,15,.12);display:inline-block">{word("l4-estrela-expoente", "cream", 30)}</div>')
    return f"""<section class="page white"><div class="kicker">{n:02d} · Merch</div><h2>Camiseta, boné, caneca, <em>ecobag e adesivos</em></h2>
<div class="cols" style="grid-template-columns:repeat(3,1fr);margin-top:10px">
<div class="box" style="display:flex;justify-content:space-around;align-items:center;height:210px">{tee(INK, word("l2-estrela-no-o", "preto", 14))}{tee(PINK, sym(WHITE, INK, 30))}</div>
<div class="box" style="display:flex;justify-content:space-around;align-items:center;height:210px">{cap}{mug}</div>
<div class="box" style="display:flex;justify-content:center;align-items:center;height:210px">{bag}</div>
<div class="box" style="grid-column:1/3;display:flex;gap:18px;align-items:center;justify-content:center;height:150px">{stickers}{pill}</div>
<div class="box"><h4>Regras de merch</h4><ul><li>Estampa grande: símbolo ou letreiro “estrela no o”, nunca os dois.</li><li>Silk de 1 cor: branco ou ink.</li><li>Tecido rosa: símbolo branco com estrela ink.</li><li>Bordado: símbolo de no mínimo 25 mm, com o corte de 16 px.</li></ul></div>
</div>{foot(n)}</section>"""


def p_motion(n):
    frames = []
    for i, (pat, gap, label) in enumerate((([0, 0, 0, 0], 12, "0 ms · 4 pontos"), ([0, 8, 0, 14], 11, "120 ms · ponto → traço"), ([10, 16], 11, "260 ms"), ([16, 22], 10, "420 ms · repouso"))):
        inner = "".join(K.seg(DEEP, 9, a, b) for a, b in K.c_with(pat, 228, gap, 9)) + K.star(DEEP)
        frames.append(f'<div class="box" style="text-align:center">{img(sv(K.svg100(inner)), 120, style="margin:auto")}<small style="font-size:10px">{label}</small></div>')
    return f"""<section class="page cream"><div class="kicker">{n:02d} · Movimento</div><h2>O story <em>termina de carregar</em></h2>
<p class="lead">Movimento-assinatura: o canto começa em pontos e cresce até os dois traços (16° e 22°), como o anel de story enchendo. Depois a palavra “clozzy” entra deslizando 8 px ao lado. Total 520 ms, ease-out. Com <i>reduced motion</i>, aparece direto o quadro final.</p>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:14px">{"".join(frames)}</div>
<div class="box" style="margin-top:14px;display:flex;gap:30px;align-items:center;justify-content:center">{logo("cream", 60, "opacity:.25")}<span style="font:800 20px Gabarito;color:{DEEP}">→</span>{logo("cream", 60)}</div>{foot(n)}</section>"""


def p_decisao(n):
    return f"""<section class="page ink" style="display:grid;grid-template-columns:1.05fr 1fr;align-items:center;gap:30px">
<div><div class="kicker">{n:02d} · Decisão</div><h2 style="font-size:38px">Recomendo o <em>lockup equilibrado</em> com quatro letreiros de apoio</h2>
<ul class="lead" style="margin:14px 0 0 18px"><li><b>Principal</b>: o símbolo da rodada 10, sem mudança, ao lado de “clozzy” (anel 1,4× o l). Palavra e símbolo sempre separados e em cores diferentes.</li>
<li><b>Apoio</b>: estrela expoente (campanha), itálico (vídeo), estrela no o (merch), clo · zzy (selos).</li>
<li><b>Superfície</b>: rosa com a marca branca e o símbolo ink; no preto, palavra branca e símbolo rosa.</li>
<li><b>Checklist anti-slop (core/05)</b>: silhueta própria ✓ · uma cor ✓ · 16 px ✓ · sem degradê SaaS nem glow ✓ · pares AA ✓ · motion com reduced motion ✓.</li>
<li>Para escolher: tamanho do símbolo no lockup (pág. 6), quais letreiros de apoio ficam e se a superfície principal é rosa ou ink. Depois disso: kit completo (BRAND.md, tokens, posts).</li></ul></div>
<div style="display:flex;flex-direction:column;gap:16px;align-items:center">
<div class="mock" style="background:{PINK};width:100%;height:150px;display:grid;place-items:center">{logo("rosa", 64)}</div>
<div class="mock" style="background:{INK};width:100%;height:110px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.15)">{logo("preto", 52)}</div>
<div style="display:flex;gap:14px">{app(PINK, WHITE, size=70)}{app(WHITE, DEEP, size=70)}{app(CREAM, INK, PINK, size=70)}{app(PURPLE, WHITE, PINK, size=70)}</div></div>
{foot(n)}</section>"""


def build():
    fns = [p_origem, p_letreiros, p_letreiros_cor, p_simbolos, p_peso, p_sistema, p_construcao, p_incorretos, p_cores, p_familia,
           p_combina, p_app, p_redes, p_letreiro_fisico, p_merch, p_motion, p_decisao]
    pages = [p_cover()] + [fn(i + 2) for i, fn in enumerate(fns)]
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy — Letreiro e lockup</title>'
            f'<style>{RA.css()}{EXTRA}</style></head><body>{"".join(pages)}</body></html>')
    OUT_HTML.write_text(html)
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer", f"--print-to-pdf={OUT_PDF}", OUT_HTML.as_uri()],
                   check=True, capture_output=True)
    return len(pages)


if __name__ == "__main__":
    print("pages", build())

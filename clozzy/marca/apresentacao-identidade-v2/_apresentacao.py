#!/usr/bin/env python3
"""Clozzy — manual de identidade visual v2.0 (apresentação 1600×900, HTML + PDF).

Mesma estrutura da v1 (../apresentacao-identidade/), só cor e tom:
- sem degradês, sem creme/tints, sem páginas ou textos de "não fazer";
- cada página é um tema chapado: rosa, preto, roxo ou branco;
- copy mais íntima e sedutora (nunca explícita), sempre nas mesmas cores principais.
Nome em Gabarito 650. Rodar: python3 _apresentacao.py
"""
import importlib.util
import random
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
MARCA = HERE.parent


def _carregar(nome, caminho):
    spec = importlib.util.spec_from_file_location(nome, caminho)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[nome] = mod
    spec.loader.exec_module(mod)
    return mod


F = _carregar("fontes_teste", MARCA / "identidade-oficial-fontes" / "_fontes.py")
M, B = F.M, F.B
PESO = 650
F.usar(F.GABARITO, PESO)
B.NOME_FONTE = f"Gabarito {PESO}"
B.FONTS = "../identidade-nova/fonts"

PINK, DEEP, PURPLE, INK, WHITE = M.PINK, M.DEEP, M.PURPLE, M.INK, M.WHITE
lg, lg1, sym = B.lg, B.lg1, B.sym
LINE = "rgba(20,9,15,.2)"
TEMA = {INK: "preto", PINK: "rosa", PURPLE: "roxo", WHITE: "branco"}
# slug da versão do logo para cada tema
LOGO = {"preto": "preto", "rosa": "rosa", "roxo": "roxo", "branco": "branco"}
# botão por tema: (fundo, texto)
BTN = {"preto": (PINK, WHITE), "rosa": (WHITE, DEEP), "roxo": (WHITE, PURPLE), "branco": (DEEP, WHITE)}
# símbolo por tema: (anel, estrela)
SIM = {"preto": (PINK, WHITE), "rosa": (WHITE, WHITE), "roxo": (WHITE, WHITE), "branco": (DEEP, DEEP)}
FG = {"preto": WHITE, "rosa": WHITE, "roxo": WHITE, "branco": INK}
BG = {"preto": INK, "rosa": PINK, "roxo": PURPLE, "branco": WHITE}


# ------------------------------------------------------------------ base
def page(title, num, body, bg=WHITE, fg=INK, pad=""):
    t = TEMA[bg]
    head = f'<div class="hd"><span>{title}</span><span>{num:02d}</span></div>' if title else ""
    foot = '<div class="ft">clozzy · manual de identidade visual · v2.0</div>' if title else ""
    return f'<section class="t-{t}" style="background:{bg};color:{fg};{pad}">{head}{body}{foot}</section>'


B.page = page


def cap(t):
    return f'<div class="lb">{t}</div>'


def abs_fill(inner, extra=""):
    return f'<div style="position:absolute;inset:0;{extra}">{inner}</div>'


def btn(txt, bg=WHITE, fg=DEEP, size=20, pad="13px 26px"):
    return (f'<span style="display:inline-block;background:{bg};color:{fg};font:800 {size}px Gabarito;padding:{pad};'
            f'border-radius:999px;white-space:nowrap">{txt}</span>')


def btn_t(tema, txt, size=20, pad="13px 26px"):
    bg, fg = BTN[tema]
    return btn(txt, bg, fg, size, pad)


def chip(txt, bg=PINK, fg=WHITE, size=13, border=None):
    bd = f"border:1.5px solid {border};" if border else ""
    return (f'<span style="display:inline-block;background:{bg};color:{fg};{bd}font:700 {size}px Figtree;padding:4px 11px;'
            f'border-radius:999px;white-space:nowrap">{txt}</span>')


def simbolo(tema, size):
    rc, sc = SIM[tema]
    return sym(rc, sc, size)


def cmyk(c):
    r, g, b = (int(c.lstrip("#")[i:i + 2], 16) / 255 for i in (0, 2, 4))
    k = 1 - max(r, g, b)
    if k >= 1:
        return "0 0 0 100"
    return " ".join(str(round(100 * v)) for v in ((1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k))


def rule_cols(items, size=19, cores=None):
    cores = cores or ["currentColor"] * len(items)
    return ('<div style="display:flex;gap:40px">' + "".join(
        f'<div style="flex:1;border-top:4px solid {c};padding-top:12px"><b style="font:800 {size + 5}px Gabarito">{a}</b>'
        f'<div style="font:500 {size}px/1.4 Figtree;margin-top:5px;opacity:.88">{b}</div></div>' for (a, b), c in zip(items, cores)) + '</div>')


def spec_rows(rows, lw=170):
    return "".join(f'<div style="padding:13px 0;border-top:1px solid var(--ln);display:flex;gap:24px">'
                   f'<b style="font:800 20px Gabarito;width:{lw}px;flex:none">{a}</b><span style="font:500 21px/1.35 Figtree;flex:1">{b}</span></div>' for a, b in rows)


# ------------------------------------------------------------------ páginas
def p_capa(n):
    col = lambda w, bg, inner: f'<div style="width:{w}%;background:{bg};display:flex;align-items:center;justify-content:center;position:relative">{inner}</div>'
    rosa = (f'<div style="width:52%;background:{PINK};padding:0 100px 96px;display:flex;flex-direction:column;justify-content:center;gap:56px;color:{WHITE}">'
            f'{lg("horizontal", "rosa", 130)}'
            f'<div style="font:900 96px/.95 Gabarito;letter-spacing:-.04em">Manual de<br>identidade visual</div>'
            f'<div style="font:500 30px Figtree">Chega mais perto.</div></div>')
    corpo = (f'<div style="position:absolute;inset:0;display:flex">{rosa}'
             + col(24, INK, simbolo("preto", 250)).replace("justify-content:center;position", "justify-content:center;padding-bottom:96px;position")
             + col(24, PURPLE, simbolo("roxo", 250)).replace("justify-content:center;position", "justify-content:center;padding-bottom:96px;position")
             + f'</div><div style="position:absolute;left:0;right:0;bottom:0;height:96px;background:{WHITE};color:{INK};display:flex;align-items:center;justify-content:space-between;'
               f'padding:0 100px;font:700 22px Figtree;letter-spacing:.1em;text-transform:uppercase"><span>Versão 2.0</span><span>Novembro de 2026</span></div>')
    return page("", n, corpo, PINK, WHITE)


def p_sumario(n, secoes):
    itens = "".join(
        f'<div style="display:flex;align-items:baseline;gap:26px;padding:20px 0;border-top:1px solid var(--ln)">'
        f'<span style="font:900 30px Gabarito;width:56px">{i + 1:02d}</span>'
        f'<span style="font:900 54px/1 Gabarito;letter-spacing:-.03em;flex:1">{nm}</span>'
        f'<span style="font:700 22px Figtree">{pg:02d}</span></div>' for i, (nm, pg) in enumerate(secoes))
    return page("Índice", n, f'<div style="display:flex;gap:120px;height:100%;align-items:center">'
                f'<div style="flex:.9;font:900 170px/.9 Gabarito;letter-spacing:-.05em">Índice</div>'
                f'<div style="flex:1.2">{itens}</div></div>', PURPLE, WHITE)


def p_essencia(n):
    fatos = [("O que é", "Site onde criadores vendem conteúdo exclusivo direto para os fãs. O fã compra, acessa e acompanha num só lugar."),
             ("Para quem", "Criador: vitrine e venda. Fã: compra e biblioteca."),
             ("Origem", "O anel de story com estrela, o close friends."),
             ("Promessa", "Seu close, seu preço. Só quem entra, vê. Pago no Pix, liberado na hora.")]
    linhas = "".join(f'<div style="padding:15px 0;border-top:1px solid var(--ln)"><b style="font:800 20px Gabarito;color:{PINK}">{a}</b>'
                     f'<div style="font:500 22px/1.35 Figtree;margin-top:4px">{b}</div></div>' for a, b in fatos)
    return page("Essência", n, f'<div style="display:flex;gap:80px;align-items:center;height:100%">'
                f'<div style="flex:1.5"><div style="font:900 214px/.84 Gabarito;letter-spacing:-.05em">close<br><span style="color:{PINK}">friends.</span></div>'
                f'<div style="font:500 34px/1.25 Figtree;margin-top:40px;max-width:720px">o círculo de quem você segue de perto, agora com preço.</div></div>'
                f'<div style="flex:1">{linhas}</div></div>', INK, WHITE)


def p_posicionamento(n):
    aud = [("Criador", "Mostre só pra quem paga. Você só paga se vender.", INK), ("Fã", "Chegue mais perto. Tudo liberado numa biblioteca só.", PURPLE)]
    tracos = [("Íntimo", "Fala baixo, perto do ouvido."), ("Sedutor", "Sugere, não entrega tudo."),
              ("Confiante", "Cobra sem pedir desculpa."), ("Discreto", "O que é do close fica no close.")]
    return page("Posicionamento", n, f'<div style="display:flex;gap:24px;height:470px">'
                f'<div style="flex:1.25;border-radius:28px;background:{PINK};color:{WHITE};padding:48px;display:flex;flex-direction:column;justify-content:space-between;position:relative">'
                f'<div style="position:absolute;right:40px;top:40px">{simbolo("rosa", 120)}</div>'
                f'<div style="font:700 20px Figtree;letter-spacing:.1em;text-transform:uppercase">Promessa</div>'
                f'<div style="font:900 104px/.92 Gabarito;letter-spacing:-.04em">Seu close,<br>seu preço.</div>'
                f'<div style="font:500 26px Figtree">Pago no Pix. Liberado na hora.</div></div>'
                f'<div style="flex:1;display:flex;flex-direction:column;gap:24px">'
                + "".join(f'<div style="flex:1;border-radius:28px;background:{bg};color:{WHITE};padding:34px 38px;display:flex;flex-direction:column;justify-content:space-between">'
                          f'<div style="font:900 52px Gabarito;letter-spacing:-.03em">{a}</div><div style="font:500 24px/1.35 Figtree;max-width:560px">{b}</div></div>'
                          for a, b, bg in aud) + '</div></div>'
                f'<div style="font:700 18px Figtree;letter-spacing:.1em;text-transform:uppercase;margin:34px 0 10px;opacity:.7">Personalidade</div>'
                + rule_cols(tracos, 23, [PINK, INK, PURPLE, INK]))


def p_logo(n):
    return page("Logo oficial", n, f'<div style="height:100%;display:flex;flex-direction:column;justify-content:space-between">'
                f'<h1>Lockup equilibrado</h1>'
                f'<div style="display:flex;justify-content:center;padding:10px 0">{lg("horizontal", "rosa", 240)}</div>'
                + rule_cols((
                    ("Símbolo", "Anel de story com a linha partida no canto superior esquerdo e a estrela de cinco pontas no centro."),
                    ("Palavra", f"clozzy em Gabarito {PESO}, caixa baixa. Sempre ao lado do símbolo ou embaixo; nunca fundida ao c."),
                    ("Relação", "Anel com 1,4× a altura do l, vão de 0,35 l, centrado nas letras. Símbolo e palavra pesam parecido.")), 20)
                + '</div>', PINK, WHITE)


def p_familia(n):
    def c(inner, label, bg, w=None, h=330):
        return f'<div style="{"width:%dpx" % w if w else "flex:1"}">{B.box(inner, bg, h)}{cap(label)}</div>'
    return page("Família", n, '<h1>Quatro formatos e o ícone</h1><div style="display:flex;gap:22px;align-items:flex-start">'
                + c(lg("horizontal", "branco", 78), "Horizontal · principal", WHITE, w=560)
                + c(lg("empilhado", "preto", 200), "Empilhado · espaço quadrado", INK)
                + c(B.sym_v("branco", 170), "Símbolo · avatar e selo", WHITE)
                + c(lg("palavra", "preto", 60), "Palavra · texto corrido", INK)
                + '</div><div style="display:flex;gap:48px;align-items:flex-end;margin-top:36px">'
                + "".join(f'<div style="text-align:center"><div style="width:{w}px;height:{w}px;border-radius:{w * .2237:.0f}px;overflow:hidden">{M.tile_svg(sv, w, radius=0)}</div>{cap(l)}</div>'
                          for sv, w, l in (("preto", 170, "App 1024"), ("branco", 84, "72"), ("preto", 52, "48")))
                + '<div style="flex:1;font:500 22px/1.45 Figtree;max-width:760px">Use o horizontal sempre que couber. O símbolo sozinho só onde a marca já foi apresentada: perfil, app e favicon. '
                  'O ícone ocupa 62% do quadrado.</div></div>', PURPLE, WHITE)


def p_versoes(n):
    notas = {"preto": "palavra branca · anel rosa · estrela branca", "rosa": "tudo branco", "roxo": "tudo branco", "branco": "palavra ink · anel e estrela Pink Deep"}
    ordem = ["rosa", "preto", "branco", "roxo"]
    cards = []
    for sv in ordem:
        _s, nm, b, *_r = M.V[sv]
        inner = f'<div style="display:flex;gap:64px;align-items:center">{lg("horizontal", sv, 70)}{lg("empilhado", sv, 148)}</div>'
        borda = "box-shadow:inset 0 0 0 2px rgba(255,255,255,.55);" if sv == "preto" else ""
        cards.append(f'<div style="width:698px">{B.box(inner, b, 300, extra=borda)}'
                     f'<div class="lb" style="font-size:17px"><b style="font:800 21px Gabarito">{nm}</b> · {notas[sv]} · fundo {b.upper()}</div></div>')
    return page("As quatro versões", n, f'<h1>Rosa, preto, branco e roxo</h1><div style="display:flex;flex-wrap:wrap;gap:22px 24px">{"".join(cards)}</div>', INK, WHITE)


def tema_bloco(t, titulo, w=340, h=570):
    bg, fg = BG[t], FG[t]
    ac = {"preto": PINK, "branco": DEEP}.get(t, WHITE)
    palavra, resto = titulo
    chip_html = {"preto": chip("Liberado", PINK, WHITE), "rosa": chip("Liberado", WHITE, DEEP), "roxo": chip("Liberado", WHITE, PURPLE), "branco": chip("Liberado", INK, WHITE)}[t]
    tok = {"preto": ("#14090F", "branco", "rosa", "rosa"), "rosa": ("#FF0065", "branco", "branco", "branco"),
           "roxo": ("#7C48C4", "branco", "branco", "branco"), "branco": ("#FFFFFF", "ink", "Pink Deep", "Pink Deep")}[t]
    linhas = "".join(f'<div style="display:flex;justify-content:space-between;font:600 15px Figtree;padding:5px 0;border-top:1px solid {"rgba(20,9,15,.2)" if t == "branco" else "rgba(255,255,255,.4)"}"><span style="opacity:.8">{a}</span><b>{v}</b></div>'
                     for a, v in zip(("Fundo", "Texto", "Destaque", "Botão"), tok))
    return (f'<div style="width:{w}px;height:{h}px;border-radius:26px;background:{bg};color:{fg};padding:28px;display:flex;flex-direction:column;justify-content:space-between;'
            f'{"border:2px solid " + INK + ";" if t == "branco" else ""}">'
            f'{lg("horizontal", LOGO[t], 38)}'
            f'<div><div style="font:900 62px/.94 Gabarito;letter-spacing:-.04em">{palavra}<br><span style="color:{ac if t in ("preto", "branco") else fg}">{resto}</span></div>'
            f'<div style="display:flex;gap:10px;align-items:center;margin-top:20px">{btn_t(t, "Entrar", 18, "11px 24px")}{chip_html}</div></div>'
            f'<div>{linhas}</div></div>')


def p_temas(n):
    blocos = "".join(tema_bloco(t, ("Chega mais", "perto.")) for t in ("rosa", "preto", "roxo", "branco"))
    return page("Temas", n, f'<h1>Quatro temas</h1><div style="display:flex;justify-content:space-between">{blocos}</div>', WHITE, INK)


def p_respiro(n):
    mins = [(lg("horizontal", "rosa", 28), "Horizontal", "96 px de largura · 25 mm"),
            (lg("empilhado", "rosa", 64), "Empilhado", "64 px de altura · 18 mm"),
            (B.sym_v("rosa", 24), "Símbolo", "24 px · 6 mm"),
            (B.sym_v("rosa", 16, True), "Corte pequeno", "16 a 32 px: espessura 13, traços 22° e 28°")]
    clear = (f'<div style="display:inline-block;padding:75px;outline:2px dashed {WHITE};outline-offset:-2px">'
             f'<div style="background:{WHITE}">{lg("horizontal", "branco", 150)}</div></div>')
    return page("Respiro e mínimos", n, '<div style="display:flex;gap:80px;align-items:flex-start"><div style="flex:1.2"><h1>Respiro</h1>'
                '<p class="lead">Livre em volta do logo: <b>x = ½ do diâmetro do anel</b>. Nenhum texto, borda ou foto entra nessa faixa.</p>'
                f'<div style="margin-top:34px">{clear}</div></div>'
                '<div style="flex:1"><h1>Mínimos</h1>'
                + "".join(f'<div style="display:flex;align-items:center;gap:24px;padding:16px 0;border-top:1px solid var(--ln)">'
                          f'<div style="width:190px;display:flex;align-items:center">{v}</div><div style="font:500 20px/1.35 Figtree"><b style="font-weight:800">{a}</b><br>{b}</div></div>' for v, a, b in mins)
                + '</div></div>', PINK, WHITE)


def cr(a, b):
    return B.cr(a, b)


def p_pares(n):
    pares = [("Branco sobre rosa", PINK, WHITE, "título a partir de 24 px, peso 800"), ("Branco sobre preto", INK, WHITE, "texto e título"),
             ("Branco sobre roxo", PURPLE, WHITE, "texto e título"), ("Preto sobre branco", WHITE, INK, "texto e título"),
             ("Rosa sobre preto", INK, PINK, "símbolo, destaque e título"), ("Pink Deep sobre branco", WHITE, DEEP, "botão, link e texto de destaque")]
    tiles = "".join(
        f'<div style="width:460px;height:270px;border-radius:24px;background:{bg};color:{fg};padding:26px 30px;display:flex;flex-direction:column;justify-content:space-between;'
        f'{"border:2px solid " + INK + ";" if bg == WHITE else ""}">'
        f'<div style="font:900 120px/.9 Gabarito;letter-spacing:-.04em">Aa</div>'
        f'<div><b style="font:800 24px Gabarito">{nm}</b><div style="font:600 17px Figtree;margin-top:3px">contraste {cr(bg, fg)} · {uso}</div></div></div>' for nm, bg, fg, uso in pares)
    return page("Pares de cor", n, f'<h1>Cores que andam juntas</h1><div style="display:flex;flex-wrap:wrap;gap:20px">{tiles}</div>', WHITE, INK)


def p_paleta(n):
    prin = [("Rosa", PINK, "O desejo: símbolo, botão, destaque e título grande em branco"),
            ("Preto", INK, "A noite: fundo, texto, capa de vídeo e merch"),
            ("Roxo", PURPLE, "O mistério: campanhas, selos, cartões de destaque"),
            ("Branco", WHITE, "O respiro: logo sobre cor, cartões, leitura")]
    big = "".join(
        f'<div style="flex:1"><div style="height:290px;border-radius:22px;background:{c};{"box-shadow:inset 0 0 0 2px rgba(255,255,255,.6);" if c == INK else ""}padding:20px 22px;'
        f'display:flex;flex-direction:column;justify-content:flex-end;color:{INK if c == WHITE else WHITE}">'
        f'<b style="font:900 40px Gabarito;letter-spacing:-.02em">{nm}</b>'
        f'<div style="font:600 16px/1.5 Figtree">{c.upper()}<br>RGB {B.rgb(c)}<br>CMYK ≈ {cmyk(c)}</div></div>'
        f'<div class="lb">{u}</div></div>' for nm, c, u in prin)
    prop = [(PINK, 25, "Rosa", WHITE), (INK, 40, "Preto", WHITE), (PURPLE, 15, "Roxo", WHITE), (WHITE, 20, "Branco", INK)]
    barra = "".join(f'<div style="flex:{p};background:{c};color:{t};padding:16px 18px;font:800 20px Gabarito;{"box-shadow:inset 0 0 0 2px rgba(255,255,255,.6);" if c == INK else ""}">{nm} {p}%</div>'
                    for c, p, nm, t in prop)
    return page("Paleta", n, f'<h1>Quatro cores</h1><div style="display:flex;gap:20px">{big}</div>'
                f'<div style="font:700 15px Figtree;letter-spacing:.1em;text-transform:uppercase;opacity:.7;margin:26px 0 10px">Proporção de uso</div>'
                f'<div style="display:flex;border-radius:14px;overflow:hidden">{barra}</div>'
                f'<div style="display:flex;gap:18px;align-items:center;margin-top:24px"><div style="width:120px;height:56px;border-radius:12px;background:{DEEP}"></div>'
                f'<div style="font:500 19px/1.4 Figtree"><b style="font:800 20px Gabarito">Pink Deep {DEEP}</b> · o rosa em fundo branco: botão, link e texto de destaque.</div></div>', INK, WHITE)


def poster(t, w=340, h=560):
    bg, fg = BG[t], FG[t]
    ac = PINK if t == "preto" else (DEEP if t == "branco" else fg)
    nome = {"preto": "Preto", "rosa": "Rosa", "roxo": "Roxo", "branco": "Branco"}[t]
    return (f'<div style="width:{w}px"><div style="height:{h}px;background:{bg};color:{fg};border-radius:22px;padding:28px;display:flex;flex-direction:column;justify-content:space-between;'
            f'{"border:2px solid " + INK + ";" if t == "branco" else ""}">'
            f'<div style="display:flex;justify-content:space-between;align-items:flex-start">{lg("horizontal", LOGO[t], 34)}</div>'
            f'<div>{simbolo(t, 120)}<div style="font:900 64px/.96 Gabarito;letter-spacing:-.04em;margin-top:24px">Chega mais<br><span style="color:{ac}">perto.</span></div>'
            f'<div style="font:500 20px/1.35 Figtree;margin-top:12px">Seu close, seu preço.</div>'
            f'<div style="margin-top:20px">{btn_t(t, "Entrar no close")}</div></div></div>{cap(nome)}</div>')


def p_pecas(n):
    return page("Cor nas peças", n, '<h1>Um tema por peça</h1><div style="display:flex;justify-content:space-between">'
                + "".join(poster(t) for t in ("rosa", "preto", "roxo", "branco")) + '</div>', WHITE, INK)


def p_tipografia(n):
    return page("Tipografia", n, '<div style="display:flex;gap:70px;height:100%;align-items:stretch">'
                f'<div style="flex:1.15;background:{INK};border-radius:24px;padding:46px;display:flex;flex-direction:column;justify-content:center;color:{WHITE}">'
                f'<div style="font:900 150px/.92 Gabarito;letter-spacing:-.04em">Seu close,</div>'
                f'<div style="font:900 150px/.92 Gabarito;letter-spacing:-.04em;color:{PINK}">seu preço.</div>'
                f'<div style="font:300 34px/1.2 Figtree;margin-top:26px">Pago no Pix<br>liberado na hora</div></div>'
                '<div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:34px">'
                f'<div><div style="font:900 120px/1 Gabarito;letter-spacing:-.03em">Aa</div><b style="font:800 28px Gabarito">Gabarito 700–900</b>'
                f'<div style="font:500 20px/1.4 Figtree;margin-top:4px">Títulos, preços e botões. Aperto −3% nos títulos. Nome clozzy: Gabarito {PESO}.</div></div>'
                f'<div><div style="font:500 120px/1 Figtree">Aa</div><b style="font:800 28px Gabarito">Figtree 400–700</b>'
                f'<div style="font:500 20px/1.4 Figtree;margin-top:4px">Texto, legenda e interface. Subtítulo em peso 300–400.</div></div>'
                f'<div style="font:500 20px/1.5 Figtree;border-top:1px solid var(--ln);padding-top:14px">Escala 64 · 44 · 32 · 22 · 16 · 14 · 12. Título branco sobre o rosa a partir de 24 px em peso 800.</div></div></div>', PINK, WHITE)


def p_hierarquia(n):
    esc = [("Display", "Gabarito 900 · 96 / 92% · −4%", '<span style="font:900 96px/.95 Gabarito;letter-spacing:-.04em">Seu close</span>'),
           ("Título", "Gabarito 800 · 56 / 100% · −3%", '<span style="font:800 56px/1 Gabarito;letter-spacing:-.03em">Pack verão liberado</span>'),
           ("Subtítulo", "Figtree 500 · 28 / 130%", '<span style="font:500 28px/1.3 Figtree">Chega mais perto, na sua biblioteca</span>'),
           ("Corpo", "Figtree 400 · 20 / 150%", '<span style="font:400 20px/1.5 Figtree">Você só paga se vender. Sem mensalidade, sem surpresa.</span>'),
           ("Legenda", "Figtree 500 · 14 / 135%", '<span style="font:500 14px/1.35 Figtree;opacity:.7">Liberado em 12 nov · válido para sempre</span>')]
    linhas = "".join(f'<div style="display:flex;align-items:baseline;gap:24px;padding:12px 0;border-top:1px solid var(--ln)">'
                     f'<div style="width:190px;flex:none"><b style="font:800 20px Gabarito">{a}</b><div style="font:500 14px/1.3 Figtree;opacity:.7;margin-top:2px">{b}</div></div>'
                     f'<div style="flex:1;white-space:nowrap">{c}</div></div>' for a, b, c in esc)
    comp = (f'<div style="width:420px;flex:none;border-radius:26px;background:{INK};color:{WHITE};padding:30px;display:flex;flex-direction:column;gap:20px">'
            f'<div style="font:700 15px Figtree;letter-spacing:.1em;text-transform:uppercase;opacity:.7">Componentes</div>'
            f'<div style="display:flex;gap:12px;align-items:center">{btn("Comprar no Pix", PINK, WHITE)}'
            f'<span style="font:800 20px Gabarito;border:2px solid {WHITE};padding:11px 24px;border-radius:999px">Ver oferta</span></div>'
            f'<div style="display:flex;gap:10px">{chip("Liberado", PINK, WHITE)}{chip("Novo drop", WHITE, INK)}{chip("Pack", INK, WHITE, border=WHITE)}</div>'
            f'<div><span style="font:900 64px Gabarito;letter-spacing:-.03em">R$ 29</span><span style="font:500 18px Figtree;margin-left:8px;opacity:.75">no Pix</span></div>'
            f'<div style="border:1.5px solid rgba(255,255,255,.5);border-radius:14px;padding:14px 16px;font:500 17px Figtree;opacity:.8">Cole o link do seu close</div></div>')
    return page("Hierarquia", n, f'<h1>Escala e componentes</h1><div style="display:flex;gap:50px;align-items:flex-start"><div style="flex:1">{linhas}</div>{comp}</div>'
                f'<div style="font:500 18px/1.45 Figtree;margin-top:22px;opacity:.85;max-width:1100px">Escala 96 · 56 · 28 · 20 · 14. Botão rosa com texto branco no preto; Pink Deep com texto branco no branco; branco no rosa e no roxo.</div>', WHITE, INK)


def p_voz(n):
    site = ["Chega mais perto.", "Pago no Pix. Liberado na hora.", "Tá na sua biblioteca.", "Só quem entra, vê."]
    redes = ["Entra pro meu close.", "O resto fica entre a gente.", "Seu pack tá no ar. Já pode mandar o link.", "Você só paga se vender."]
    bolha = lambda t, bg, c: (f'<div style="background:{bg};color:{c};border-radius:24px;padding:18px 26px;font:600 29px/1.25 Figtree;margin-bottom:16px;display:table;max-width:100%">{t}</div>')
    col = lambda t, itens, bg, c: (f'<div style="flex:1"><b style="font:900 40px Gabarito;display:block;margin-bottom:16px">{t}</b>' + "".join(bolha(i, bg, c) for i in itens) + '</div>')
    gloss = "".join(f'<span style="display:inline-block;margin-right:10px">{chip(g, PURPLE, WHITE, 20)}</span>' for g in ("exclusivo", "oferta", "pack", "drop", "biblioteca", "canal"))
    return page("Voz", n, '<h1>Íntimo, direto, sem exagero</h1><div style="display:flex;gap:70px">'
                + col("No site e no app", site, PINK, WHITE) + col("Nas redes", redes, WHITE, INK) + '</div>'
                f'<div style="margin-top:20px;font:700 19px Figtree">Glossário fixo&nbsp;&nbsp;{gloss}</div>', INK, WHITE)


def p_divisor(n):
    return page("", n, abs_fill(
        f'<div style="display:flex;height:100%"><div style="flex:1;padding:0 100px;display:flex;flex-direction:column;justify-content:center">'
        f'<div style="font:900 40px Gabarito">06</div>'
        f'<div style="font:900 215px/.9 Gabarito;letter-spacing:-.05em;margin:16px 0 36px">Aplicações</div>'
        f'<div style="font:700 26px Figtree;letter-spacing:.06em">Banners · Anúncios · Feed · Stories · Web e app · Impressos</div></div>'
        f'<div style="width:330px;background:{INK};display:flex;align-items:center;justify-content:center">{simbolo("preto", 220)}</div></div>'), PINK, WHITE)


# ---- banners e anúncios
def banner(w, h, t, titulo, sub, btn_txt, size=64):
    bg, fg = BG[t], FG[t]
    ac = PINK if t == "preto" else (DEEP if t == "branco" else fg)
    pad = int(h * .12)
    return (f'<div style="width:{w}px;height:{h}px;background:{bg};color:{fg};border-radius:22px;position:relative;overflow:hidden;{"border:2px solid " + INK + ";" if t == "branco" else ""}">'
            f'<div style="position:absolute;right:{pad + 10}px;top:50%;margin-top:-{int(h * .24)}px">{simbolo(t, int(h * .48))}</div>'
            f'<div style="position:absolute;inset:0;padding:{pad}px {int(h * .16)}px;display:flex;flex-direction:column;justify-content:space-between">'
            f'{lg("horizontal", LOGO[t], max(26, int(h * .15)))}'
            f'<div><div style="font:900 {size}px/.96 Gabarito;letter-spacing:-.04em">{titulo}</div>'
            + (f'<div style="font:500 {max(15, size // 3)}px Figtree;margin-top:8px">{sub}</div>' if sub else '')
            + (f'<div style="margin-top:{int(h * .06)}px">{btn_t(t, btn_txt, max(15, int(h * .075)), f"{int(h * .045)}px {int(h * .1)}px")}</div>' if btn_txt else '')
            + '</div></div></div>')


def p_banners(n):
    hero = banner(1420, 290, "rosa", "Chega mais <span style=\"white-space:nowrap\">perto.</span>", "Seu close, seu preço. Pago no Pix. Liberado na hora.", "Entrar no close", size=70)
    b2 = banner(700, 250, "preto", "Só quem<br>entra, vê.", "", "Ver como funciona", size=44)
    b3 = banner(700, 250, "roxo", "O resto fica<br>entre a gente.", "", "Criar meu close", size=44)
    return page("Banners de campanha", n, f'<h1>Banners de campanha</h1>{hero}{cap("Hero · 1420 × 290 · Rosa")}'
                f'<div style="display:flex;gap:20px;margin-top:10px"><div>{b2}{cap("Preto · 700 × 250")}</div><div>{b3}{cap("Roxo · 700 × 250")}</div></div>', WHITE, INK)


def zoom(inner, z, w, h):
    return f'<div style="width:{int(w * z)}px;height:{int(h * z)}px;position:relative"><div style="zoom:{z};width:{w}px;height:{h}px">{inner}</div></div>'


def ad(w, h, t, logo_h, titulo, tsz, btn_txt, bsz=14, bpad="9px 18px", horiz=False, sub=None, big_sym=0, r=8):
    bg, fg = BG[t], FG[t]
    logo = lg("horizontal", LOGO[t], logo_h)
    b = btn_t(t, btn_txt, bsz, bpad)
    if horiz:
        corpo = (f'<div style="position:absolute;inset:0;padding:0 {int(h * .22)}px;display:flex;align-items:center;justify-content:space-between;gap:16px">'
                 f'{logo}<div style="font:900 {tsz}px/1 Gabarito;letter-spacing:-.03em;white-space:nowrap">{titulo}</div>{b}</div>')
    else:
        s = f'<div style="position:absolute;right:{int(w * .09)}px;top:{int(w * .09)}px">{simbolo(t, big_sym)}</div>' if big_sym else ""
        corpo = (f'{s}<div style="position:absolute;inset:0;padding:{int(w * .09)}px;display:flex;flex-direction:column;justify-content:space-between">'
                 f'{logo}<div><div style="font:900 {tsz}px/.97 Gabarito;letter-spacing:-.04em">{titulo}</div>'
                 + (f'<div style="font:500 14px Figtree;margin-top:8px">{sub}</div>' if sub else '')
                 + f'<div style="margin-top:14px">{b}</div></div></div>')
    return f'<div style="width:{w}px;height:{h}px;background:{bg};color:{fg};position:relative;overflow:hidden;border-radius:{r}px">{corpo}</div>'


def p_anuncios(n):
    lead = ad(728, 90, "rosa", 30, "Seu close, seu preço.", 26, "Entrar", 15, "9px 20px", horiz=True)
    mpu = ad(300, 250, "roxo", 26, "Só quem<br>entra, vê.", 40, "Ver como funciona", 14, "9px 18px", big_sym=60)
    half = ad(300, 600, "rosa", 30, "Chega mais<br>perto.", 48, "Entrar no close", 18, "12px 24px", sub="Seu close, seu preço.", big_sym=170)
    mob = ad(320, 50, "rosa", 20, "Seu close, seu preço.", 13, "Entrar", 12, "6px 14px", horiz=True, r=6)
    email = ad(600, 160, "branco", 30, "Seu pack tá no ar.", 30, "Ver oferta", 16, "10px 22px", horiz=True, r=10)
    return page("Anúncios e e-mail", n, '<div style="display:flex;gap:136px;align-items:flex-start"><div style="width:984px">'
                '<h1>Formatos de mídia</h1>'
                f'{zoom(lead, 1.35, 728, 90)}{cap("Leaderboard · 728 × 90")}'
                f'<div style="display:flex;gap:34px;margin-top:18px;align-items:flex-start"><div>{zoom(mpu, 1.2, 300, 250)}{cap("Retângulo médio · 300 × 250")}</div>'
                f'<div><div>{zoom(mob, 1.5, 320, 50)}{cap("Mobile · 320 × 50")}</div><div style="margin-top:14px">{zoom(email, .8, 600, 160)}{cap("Cabeçalho de e-mail · 600 × 160")}</div></div></div></div>'
                f'<div style="padding-top:72px">{half}{cap("Meia página · 300 × 600")}</div></div>', INK, WHITE)


# ---- redes
def post(inner, t, size=300):
    bg = BG[t]
    return (f'<div style="width:{size}px;height:{size}px;background:{bg};border-radius:10px;position:relative;overflow:hidden;'
            f'{"border:2px solid " + INK + ";" if t == "branco" else ""}">{inner}</div>')


def post_txt(t, titulo, tam=50, deco=0):
    d = f'<div style="position:absolute;right:-50px;bottom:-40px">{simbolo(t, deco)}</div>' if deco else ""
    return (d + f'<div style="position:absolute;inset:0;padding:26px;display:flex;flex-direction:column;justify-content:space-between;color:{FG[t]}">'
            f'<div style="font:900 {tam}px/.96 Gabarito;letter-spacing:-.04em">{titulo}</div><div>{lg("horizontal", LOGO[t], 24)}</div></div>')


def p_feed(n):
    p1 = post(post_txt("rosa", "Chega mais<br>perto."), "rosa")
    p2 = post(post_txt("preto", "Só quem<br>entra, vê.", deco=160), "preto")
    p3 = post(post_txt("roxo", "Pago no Pix.<br>Liberado<br>na hora.", 46), "roxo")
    p4 = post(post_txt("branco", "Entra pro<br>meu close.", deco=160), "branco")
    p5 = post(post_txt("rosa", "O resto fica<br>entre a gente.", 46), "rosa")
    p6 = post(f'<div style="position:absolute;inset:0;padding:26px;display:flex;flex-direction:column;justify-content:space-between;color:{WHITE}">'
              f'<div style="height:130px;border-radius:14px;background:{PURPLE};display:flex;align-items:center;justify-content:center">{icone(LOCK, 44, WHITE, 2.4)}</div>'
              f'<div><div style="font:800 24px Gabarito">Pack verão</div>'
              f'<div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px"><span style="font:900 44px Gabarito;letter-spacing:-.03em">R$ 29</span>{chip("Liberado")}</div></div></div>', "preto")
    regras = [("Fundo", "Um tema por post: rosa, preto, roxo ou branco."), ("Título", "Gabarito 900, até 3 linhas, aperto −4%."),
              ("Logo", "Horizontal, canto inferior esquerdo, ≈ 30% da largura."), ("Símbolo", "Cortado no canto, na cor do tema."),
              ("Cadência", "Alterne claro e escuro para o grid respirar.")]
    return page("Feed", n, '<div style="display:flex;gap:50px"><div><h1>Feed</h1>'
                f'<div style="display:grid;grid-template-columns:repeat(3,300px);gap:18px">{p1}{p2}{p3}{p4}{p5}{p6}</div></div>'
                f'<div style="flex:1;padding-top:96px">{spec_rows(regras, 120)}</div></div>', WHITE, INK)


def story(inner, t, w=300, h=533):
    return (f'<div style="width:{w}px;height:{h}px;background:{BG[t]};color:{FG[t]};border-radius:26px;position:relative;overflow:hidden;'
            f'{"border:2px solid " + INK + ";" if t == "branco" else ""}">{inner}</div>')


def p_stories(n):
    s1 = story(f'<div style="position:absolute;right:-40px;top:90px">{simbolo("rosa", 170)}</div>' + abs_fill(
        f'<div style="padding:28px 24px;height:100%;display:flex;flex-direction:column;justify-content:space-between">{lg("horizontal", "rosa", 28)}'
        f'<div><div style="font:900 60px/.95 Gabarito;letter-spacing:-.04em">Chega<br>mais<br>perto.</div><div style="margin-top:18px">{btn_t("rosa", "Entrar no close", 17, "11px 22px")}</div></div></div>'), "rosa")
    check = f'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
    s2 = story(abs_fill(
        f'<div style="padding:28px 24px;height:100%;display:flex;flex-direction:column;justify-content:space-between">{lg("horizontal", "branco", 28)}'
        f'<div><div style="width:48px;height:48px;border-radius:50%;background:{DEEP};display:flex;align-items:center;justify-content:center;margin-bottom:16px">{check}</div>'
        f'<div style="font:900 64px/.95 Gabarito;letter-spacing:-.04em">Liberado.</div><div style="font:500 19px Figtree;margin-top:8px">Tá na sua biblioteca.</div></div></div>'), "branco")
    s3 = story(f'<div style="position:absolute;right:-40px;top:100px">{simbolo("roxo", 200)}</div>' + abs_fill(
        f'<div style="padding:28px 24px;height:100%;display:flex;flex-direction:column;justify-content:space-between">{lg("horizontal", "roxo", 28)}'
        f'<div><div style="font:900 56px/.95 Gabarito;letter-spacing:-.04em">Só quem<br>entra, vê.</div>'
        f'<div style="margin-top:18px;display:inline-block;border:2px solid {WHITE};border-radius:12px;padding:9px 16px;font:700 16px Figtree">Link na bio</div></div></div>'), "roxo")
    capa1 = banner(420, 140, "rosa", "Seu close, seu preço.", "", None, size=30)
    capa2 = banner(420, 105, "branco", "Pago no Pix. Liberado na hora.", "", None, size=20)
    av = "".join(f'<div style="text-align:center"><div style="width:96px;height:96px;border-radius:50%;overflow:hidden;{"box-shadow:inset 0 0 0 2px #fff;" if s == "preto" else ""}">{M.tile_svg(s, 96, radius=0, scale=.58)}</div>{cap(s.capitalize())}</div>'
                 for s in ("rosa", "preto", "roxo", "branco"))
    return page("Stories e capas", n, '<div style="display:flex;gap:56px">'
                f'<div><h1>Stories · 9:16</h1><div style="display:flex;gap:22px">{s1}{s2}{s3}</div>{cap("Rosa · Branco · Roxo · 1080 × 1920")}</div>'
                f'<div style="flex:1"><h1>Capas e perfil</h1>{capa1}{cap("Capa 3:1 · X, YouTube · 1500 × 500")}'
                f'<div style="margin-top:8px">{capa2}{cap("Capa 4:1 · LinkedIn · 1584 × 396")}</div>'
                f'<div style="display:flex;gap:26px;margin-top:14px">{av}</div></div></div>', INK, WHITE)


# ---- produto
def phone(inner, w=300, h=620, bg=WHITE):
    return (f'<div style="width:{w}px;height:{h}px;border-radius:40px;background:{bg};border:8px solid {INK};box-shadow:0 0 0 2px rgba(255,255,255,.6);position:relative;overflow:hidden;flex:none">'
            f'<div style="position:absolute;left:50%;top:9px;width:78px;height:20px;margin-left:-39px;border-radius:12px;background:{INK};z-index:5"></div>{inner}</div>')


def icone(d, size=22, cor="currentColor", sw=2.2):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{cor}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{d}</svg>')


LOCK = '<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'
PLAY = '<path d="M8 5.5v13l11-6.5z"/>'
HOME = '<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>'
LIB = '<rect x="4" y="4" width="6" height="16" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="14" width="7" height="6" rx="1.5"/>'
USER = '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/>'


def qr(size=150, seed=7):
    rnd = random.Random(seed)
    N, c = 25, size / 25
    cel = ""
    for y in range(N):
        for x in range(N):
            if (x < 8 and y < 8) or (x > N - 9 and y < 8) or (x < 8 and y > N - 9):
                continue
            if rnd.random() < .5:
                cel += f'<rect x="{x * c:.2f}" y="{y * c:.2f}" width="{c + .3:.2f}" height="{c + .3:.2f}"/>'
    for ox, oy in ((0, 0), (N - 7, 0), (0, N - 7)):
        cel += (f'<rect x="{ox * c:.2f}" y="{oy * c:.2f}" width="{7 * c:.2f}" height="{7 * c:.2f}"/>'
                f'<rect x="{(ox + 1) * c:.2f}" y="{(oy + 1) * c:.2f}" width="{5 * c:.2f}" height="{5 * c:.2f}" fill="#fff"/>'
                f'<rect x="{(ox + 2) * c:.2f}" y="{(oy + 2) * c:.2f}" width="{3 * c:.2f}" height="{3 * c:.2f}"/>')
    return f'<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" fill="{INK}">{cel}</svg>'


def tabbar(ativo, dark=True):
    cor = lambda i: PINK if i == ativo else ("rgba(255,255,255,.65)" if dark else "rgba(20,9,15,.55)")
    its = "".join(f'<div style="color:{cor(i)}">{icone(d, 24)}</div>' for i, d in enumerate((HOME, LIB, USER)))
    return (f'<div style="position:absolute;left:0;right:0;bottom:0;height:64px;display:flex;justify-content:space-around;align-items:center;'
            f'background:{INK};border-top:1px solid rgba(255,255,255,.25)">{its}</div>')


def tela_splash():
    return phone(abs_fill(f'<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;color:{WHITE}">'
                          f'{lg("empilhado", "preto", 150)}<div style="font:500 15px Figtree">Chega mais perto.</div></div>'), bg=INK)


def tela_criador():
    def pack(titulo, preco, cor):
        return (f'<div style="flex:1"><div style="height:118px;border-radius:14px;background:{cor};display:flex;align-items:center;justify-content:center">{icone(LOCK, 30, WHITE, 2.4)}</div>'
                f'<div style="font:800 14px Gabarito;margin-top:7px">{titulo}</div><div style="font:700 13px Figtree;color:{PINK}">{preco}</div></div>')
    return phone(
        f'<div style="height:150px;background:{PINK};position:relative;overflow:hidden"><div style="position:absolute;right:-30px;top:30px">{simbolo("rosa", 150)}</div></div>'
        f'<div style="padding:0 18px;margin-top:-44px;position:relative;color:{WHITE}">'
        f'<div style="width:92px;height:92px;border-radius:50%;background:{PINK};padding:3px"><div style="width:100%;height:100%;border-radius:50%;background:{INK};padding:3px">'
        f'<div style="width:100%;height:100%;border-radius:50%;background:{PURPLE};display:flex;align-items:center;justify-content:center;font:900 34px Gabarito;color:{WHITE}">M</div></div></div>'
        f'<div style="font:900 26px/1.1 Gabarito;letter-spacing:-.03em;margin-top:10px">Marina Alves</div>'
        f'<div style="font:500 13px Figtree;opacity:.75;margin-top:3px">@marinaalves · 12,4 mil no close</div>'
        f'<div style="margin-top:14px">{btn("Entrar no close", PINK, WHITE, 16, "10px 20px")}</div>'
        f'<div style="display:flex;gap:12px;margin-top:20px">{pack("Pack verão", "R$ 29", PURPLE)}{pack("Drop 07", "R$ 19", PINK)}</div></div>'
        + tabbar(0), bg=INK)


def tela_pix():
    return phone(
        f'<div style="padding:46px 22px 0;text-align:center">'
        f'<div style="font:600 14px Figtree;opacity:.7">Pack verão · Marina Alves</div>'
        f'<div style="font:900 56px Gabarito;letter-spacing:-.04em;margin:6px 0 18px">R$ 29,00</div>'
        f'<div style="display:inline-block;padding:14px;border-radius:18px;border:2px solid {INK}">{qr(150)}</div>'
        f'<div style="margin-top:20px">{btn("Copiar código Pix", DEEP, WHITE, 17, "13px 28px")}</div>'
        f'<div style="font:500 14px/1.4 Figtree;opacity:.75;margin-top:16px">Pago no Pix.<br>Liberado na hora.</div></div>')


def tela_biblioteca():
    def item(t, sub, cor, estado):
        return (f'<div style="display:flex;gap:12px;align-items:center;padding:11px 0;border-top:1px solid rgba(255,255,255,.25)">'
                f'<div style="width:58px;height:58px;border-radius:12px;background:{cor};flex:none;display:flex;align-items:center;justify-content:center">{icone(PLAY, 22, WHITE)}</div>'
                f'<div style="flex:1"><div style="font:800 16px Gabarito;color:#fff">{t}</div><div style="font:500 12px Figtree;color:rgba(255,255,255,.75);margin:2px 0 5px">{sub}</div>{estado}</div></div>')
    return phone(
        f'<div style="padding:46px 20px 0;color:#fff"><div style="font:900 30px Gabarito;letter-spacing:-.03em;margin-bottom:12px">Sua biblioteca</div>'
        + item("Pack verão", "Marina Alves · 24 itens", PINK, chip("Liberado", WHITE, INK, 11))
        + item("Drop 07", "Marina Alves · 8 itens", PURPLE, chip("Liberado", WHITE, INK, 11))
        + item("Bastidores", "Caio Lima · 12 itens", PINK, chip("Novo", PINK, WHITE, 11, WHITE))
        + item("Pack noite", "Caio Lima · 6 itens", PURPLE, chip("Liberado", WHITE, INK, 11))
        + '</div>' + tabbar(1), bg=INK)


def p_produto(n):
    tels = [(tela_splash(), "Splash · Preto"), (tela_criador(), "Página do criador"), (tela_pix(), "Pagamento no Pix"), (tela_biblioteca(), "Biblioteca do fã")]
    return page("Produto", n, '<h1 style="margin-bottom:12px">App e produto</h1><div style="display:flex;justify-content:space-between">'
                + "".join(f'<div>{t}{cap(c)}</div>' for t, c in tels) + '</div>', PURPLE, WHITE, pad="padding-top:80px")


def p_identidade_digital(n):
    cel = '<div style="width:52px;height:52px;border-radius:13px;background:rgba(255,255,255,.22)"></div>'
    home = phone(abs_fill(
        f'<div style="padding:60px 20px 0;display:grid;grid-template-columns:repeat(4,52px);gap:20px 14px;justify-content:center;color:#fff">'
        f'{cel * 8}'
        f'<div style="text-align:center"><div style="width:52px;height:52px;border-radius:13px;overflow:hidden">{M.tile_svg("rosa", 52, radius=0)}</div>'
        f'<div style="font:600 10px Figtree;margin-top:4px">clozzy</div></div>{cel * 11}</div>'
        f'<div style="position:absolute;left:14px;right:14px;bottom:14px;height:76px;border-radius:28px;background:rgba(255,255,255,.22)"></div>'), w=300, h=620, bg=INK)
    fav = M.tile_svg("rosa", 16, radius=4, scale=.74, small=True)
    nav = (f'<div style="display:flex;align-items:center;justify-content:space-between;padding:0 36px;height:72px">{lg("horizontal", "preto", 30)}'
           f'<div style="display:flex;gap:14px;align-items:center"><span style="font:700 16px Figtree">Entrar</span>{btn("Criar meu close", PINK, WHITE, 15, "10px 20px")}</div></div>')
    hero = (f'<div style="display:flex;padding:34px 36px;gap:30px;align-items:center"><div style="flex:1">'
            f'<div style="font:900 72px/.94 Gabarito;letter-spacing:-.045em">Chega mais<br><span style="color:{PINK}">perto.</span></div>'
            f'<div style="font:500 20px Figtree;margin:16px 0 22px;opacity:.85">Seu close, seu preço. Só quem entra, vê.</div>{btn("Criar meu close", PINK, WHITE, 19)}</div>'
            f'<div style="width:330px;height:270px;border-radius:24px;background:{PURPLE};position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center">'
            f'<div style="position:absolute;right:-50px;top:-40px">{simbolo("roxo", 230)}</div>'
            f'<div style="background:{INK};color:{WHITE};border-radius:18px;padding:18px 20px;width:230px;position:relative;margin-top:60px">'
            f'<div style="display:flex;justify-content:space-between;align-items:center"><div style="font:800 18px Gabarito">Pack verão</div>{icone(LOCK, 20, WHITE)}</div><div style="font:500 13px Figtree;opacity:.75">Marina Alves</div>'
            f'<div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px"><span style="font:900 32px Gabarito;letter-spacing:-.03em">R$ 29</span>{chip("Pix")}</div></div></div></div>')
    browser = (f'<div style="width:900px;border-radius:16px;overflow:hidden;background:{INK};color:{WHITE};box-shadow:0 0 0 2px rgba(255,255,255,.6)">'
               f'<div style="background:#2a1a22;height:42px;display:flex;align-items:flex-end;padding:0 14px;gap:10px">'
               f'<div style="background:{INK};border-radius:10px 10px 0 0;padding:8px 14px;display:flex;align-items:center;gap:8px;font:600 13px Figtree">{fav}clozzy</div></div>'
               f'<div style="display:flex;gap:8px;padding:8px 14px;border-bottom:1px solid rgba(255,255,255,.25)"><div style="flex:1;border:1px solid rgba(255,255,255,.35);border-radius:99px;padding:6px 14px;font:500 13px Figtree;opacity:.8">clozzy.com/marina</div></div>'
               f'{nav}{hero}</div>')
    tamanhos = "".join(f'<div style="text-align:center"><div style="height:80px;display:flex;align-items:flex-end;justify-content:center">{v}</div>{cap(l)}</div>' for v, l in (
        (M.tile_svg("preto", 16, radius=4, scale=.74, small=True), "Favicon 16"), (M.tile_svg("preto", 32, radius=8, scale=.74, small=True), "Favicon 32"),
        (f'<div style="width:72px;height:72px;border-radius:16px;overflow:hidden">{M.tile_svg("branco", 72, radius=0)}</div>', "Ícone 72"),
        (f'<div style="width:80px;height:80px;border-radius:50%;overflow:hidden">{M.tile_svg("preto", 80, radius=0, scale=.58)}</div>', "Perfil")))
    return page("Ícone e web", n, f'<div style="display:flex;gap:56px;align-items:flex-start"><div>{home}{cap("Ícone na tela inicial · quadrado sem cantos, símbolo a 62%")}</div>'
                f'<div><h1 style="margin-bottom:14px">Web, favicon e perfil</h1>{browser}'
                f'<div style="display:flex;gap:44px;align-items:flex-end;margin-top:16px">{tamanhos}</div></div></div>', PINK, WHITE, pad="padding-top:84px")


def tee(cor, logo, w=300):
    return (f'<div style="position:relative;width:{w}px;height:{w}px"><svg viewBox="0 0 300 300" width="{w}" height="{w}">'
            f'<path d="M105 18 L18 62 L46 126 L78 110 L78 282 L222 282 L222 110 L254 126 L282 62 L195 18 C186 46 114 46 105 18 Z" fill="{cor}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/></svg>'
            f'<div style="position:absolute;left:0;right:0;top:92px;display:flex;justify-content:center">{logo}</div></div>')


def bag(cor, logo, w=300):
    return (f'<div style="position:relative;width:{w}px;height:{int(w * 1.1)}px"><svg viewBox="0 0 300 330" width="{w}" height="{int(w * 1.1)}">'
            f'<path d="M100 96 V60 a50 50 0 0 1 100 0 V96" fill="none" stroke="{cor}" stroke-width="14" stroke-linecap="round"/>'
            f'<path d="M40 90 H260 L274 316 H26 Z" fill="{cor}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/></svg>'
            f'<div style="position:absolute;left:0;right:0;top:140px;display:flex;justify-content:center">{logo}</div></div>')


def p_impressos(n):
    cartao_f = (f'<div style="width:290px;height:180px;border-radius:12px;background:{PINK};position:relative;overflow:hidden">'
                f'<div style="position:absolute;right:-40px;bottom:-50px">{simbolo("rosa", 190)}</div>'
                f'<div style="position:absolute;left:24px;top:22px">{lg("horizontal", "rosa", 30)}</div></div>')
    cartao_v = (f'<div style="width:290px;height:180px;border-radius:12px;background:{WHITE};color:{INK};padding:22px 24px;display:flex;flex-direction:column;justify-content:space-between">'
                f'<div><div style="font:900 24px Gabarito;letter-spacing:-.03em">Marina Alves</div><div style="font:500 13px Figtree;opacity:.7">Criadora · @marinaalves</div></div>'
                f'<div style="display:flex;justify-content:space-between;align-items:flex-end"><div style="font:500 12px/1.5 Figtree">clozzy.com/marina<br>marina@clozzy.com</div>{sym(DEEP, DEEP, 38)}</div></div>')
    adesivos = ('<div style="display:flex;flex-wrap:wrap;gap:22px;justify-content:center;padding:0 24px">'
                + "".join(f'<div style="width:{d}px;height:{d}px;border-radius:50%;background:{b};display:flex;align-items:center;justify-content:center;border:4px solid {INK}">{sym(rc, sc, int(d * .62))}</div>'
                          for d, b, rc, sc in ((170, PINK, WHITE, WHITE), (130, INK, PINK, WHITE), (130, PURPLE, WHITE, WHITE), (100, WHITE, DEEP, DEEP))) + '</div>')
    painel = lambda inner, bg, label, border=False: (
        f'<div style="width:340px"><div style="height:500px;border-radius:24px;background:{bg};display:flex;align-items:center;justify-content:center;{"border:2px solid " + INK + ";" if border else ""}">{inner}</div>{cap(label)}</div>')
    return page("Impressos e brindes", n, '<h1 style="margin-bottom:14px">Papelaria e merch</h1><div style="display:flex;justify-content:space-between">'
                + painel(f'<div style="position:relative;width:290px;height:330px"><div style="position:absolute;left:0;top:0">{cartao_f}</div><div style="position:absolute;left:0;top:150px">{cartao_v}</div></div>', INK, "Cartão · frente rosa, verso branco · 85 × 55 mm")
                + painel(tee(WHITE, lg("empilhado", "branco", 84)), PINK, "Camiseta branca · logo empilhado")
                + painel(adesivos, WHITE, "Adesivos · símbolo, sempre com a estrela", True)
                + painel(bag(WHITE, lg("empilhado", "branco", 84), 280), PURPLE, "Ecobag branca · logo empilhado") + '</div>', WHITE, INK)


def p_kit(n):
    files = [("svg/", "logo horizontal, empilhado, palavra e símbolo nas 4 versões (com e sem placa), em uma cor, corte pequeno, app-icon e favicon · 53 arquivos"),
             ("manual-identidade-clozzy-v2.0.pdf · .html", "este documento"),
             ("../identidade-nova/fonts/", "Gabarito (nome 650, títulos 700–900) e Figtree (texto, 300–700) · OFL"),
             ("_apresentacao.py", "gerador do manual e dos SVGs com o nome em Gabarito 650"),
             ("../identidade-oficial/", "regras de cor, símbolo e lockup que este manual segue")]
    fmt = [("SVG", "formato de entrega: vetor, sem perda"), ("PDF", "impressão e apresentação"), ("PNG", "exportar do SVG, com fundo transparente")]
    return page("Kit", n, '<div style="display:flex;gap:80px"><div style="flex:1.4"><h1>Arquivos</h1>' + "".join(
        f'<div style="display:flex;gap:26px;padding:16px 0;border-top:1px solid var(--ln)"><b style="width:330px;flex:none;font:800 21px Gabarito">{a}</b><span style="font:500 20px/1.35 Figtree">{b}</span></div>' for a, b in files)
        + '</div><div style="flex:1"><h1>Formatos</h1>' + "".join(
        f'<div style="display:flex;gap:22px;padding:16px 0;border-top:1px solid var(--ln);align-items:baseline"><b style="font:900 34px Gabarito;width:90px">{a}</b><span style="font:500 20px/1.35 Figtree">{b}</span></div>' for a, b in fmt)
        + '</div></div>', PURPLE, WHITE)


def p_contracapa(n):
    faixa = (f'<div style="position:absolute;left:0;right:0;bottom:0;height:26px;display:flex"><div style="flex:1;background:{PINK}"></div>'
             f'<div style="flex:1;background:{WHITE}"></div><div style="flex:1;background:{PURPLE}"></div></div>')
    return page("", n, abs_fill(
        f'<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px">{lg("empilhado", "preto", 280)}'
        f'<div style="font:500 30px Figtree;letter-spacing:.02em">Seu close, seu preço.</div></div>') + faixa, INK, WHITE)


# ------------------------------------------------------------------ montagem
ORDEM = [
    ("Essência", [p_essencia, p_posicionamento]),
    ("Logo", [p_logo, B.p_construcao, p_familia, p_versoes, p_temas, p_respiro, p_pares]),
    ("Cor", [p_paleta, p_pecas]),
    ("Tipografia", [p_tipografia, p_hierarquia]),
    ("Voz", [p_voz]),
    ("Aplicações", [p_divisor, p_banners, p_anuncios, p_feed, p_stories, p_identidade_digital, p_produto, p_impressos]),
    ("Kit", [p_kit]),
]

CSS = """@page{size:1600px 900px;margin:0}
*{box-sizing:border-box}body{margin:0;background:#888;font-family:Figtree}
section{position:relative;width:1600px;height:900px;padding:90px 90px 60px;overflow:hidden;page-break-after:always;margin:0 auto 20px}
.t-branco{--ln:rgba(20,9,15,.25)}.t-preto,.t-rosa,.t-roxo{--ln:rgba(255,255,255,.4)}
.hd{position:absolute;left:90px;right:90px;top:34px;display:flex;justify-content:space-between;font:700 15px Figtree;letter-spacing:.1em;text-transform:uppercase;opacity:.7}
.ft{position:absolute;left:90px;bottom:24px;font:500 13px Figtree;opacity:.6}
h1{font:900 50px/1.05 Gabarito;letter-spacing:-.03em;margin:0 0 20px}
.lead{font:500 22px/1.45 Figtree;margin:0;max-width:1100px}
.lb{font:500 15px/1.35 Figtree;margin-top:9px;opacity:.78}
svg{overflow:visible}
@media print{body{background:none}section{margin:0}}"""


def build(out_dir=HERE, nome="manual-identidade-clozzy-v2.0"):
    secoes, pg = [], 3
    for nm, fns in ORDEM:
        secoes.append((nm, pg))
        pg += len(fns)
    pages = [p_capa(1), p_sumario(2, secoes)]
    n = 3
    for _nm, fns in ORDEM:
        for fn in fns:
            pages.append(fn(n))
            n += 1
    pages.append(p_contracapa(n))
    css = (f'@font-face{{font-family:Gabarito;src:url("{B.FONTS}/Gabarito-Variable.ttf");font-weight:400 900}}'
           f'@font-face{{font-family:Figtree;src:url("{B.FONTS}/Figtree-Variable.ttf");font-weight:300 900}}' + CSS)
    html = (f'<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy — manual de identidade visual v2.0</title>'
            f'<style>{css}</style></head><body>{"".join(pages)}</body></html>')
    out = Path(out_dir) / f"{nome}.html"
    out.write_text(html)
    subprocess.run([B.CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files", "--force-device-scale-factor=1",
                    f"--print-to-pdf={Path(out_dir) / (nome + '.pdf')}", "--no-pdf-header-footer", "--virtual-time-budget=4000", out.as_uri()],
                   check=True, capture_output=True)
    return len(pages)


if __name__ == "__main__":
    print("svg", M.build(HERE / "svg"))
    print("págs.", build())

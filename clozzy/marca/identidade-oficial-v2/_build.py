#!/usr/bin/env python3
"""Clozzy — documento de identidade visual oficial (HTML + PDF). Rodar: python3 _marca.py && python3 _build.py"""
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import _marca as M  # noqa: E402

K, f = M.K, M.f
PINK, DEEP, PURPLE, INK, CREAM, WHITE = M.PINK, M.DEEP, M.PURPLE, M.INK, M.CREAM, M.WHITE
LAV, SOFT, MUTED = M.LAVANDA, M.ROSA_SUAVE, M.MUTED
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
FONTS = "../identidade-nova/fonts"           # relativo ao HTML gerado
NOME_FONTE = "Gabarito 800"                  # fonte e peso do nome clozzy (as outras variantes trocam isto)
OUT_DIR = HERE                               # pasta de saída do HTML/PDF
OUT_NAME = "identidade-clozzy-oficial-v2"       # nome base do HTML/PDF
DOC_TITULO = "Clozzy — identidade visual v2 (arco mais grosso)"
LINE = "rgba(20,9,15,.14)"
LINE_W = "rgba(255,255,255,.28)"


# ------------------------------------------------------------------ helpers
def lg(kind, slug, h):
    return M.versao_svg(kind, slug, h=h)


def lg1(kind, wc, rc, sc, h):
    return M.logo_svg(kind, wc, rc, sc, h=h)


def sym(rc, sc, size, small=False, extra=""):
    return f'<svg viewBox="5 5 90 90" width="{size}" height="{size}" style="display:block;{extra}">{M.SYM(rc, sc, small)}</svg>'


def sym_v(slug, size, small=False):
    _s, _n, _b, _wc, rc, sc = M.V[slug]
    return sym(rc, sc, size, small)


def page(title, num, body, bg=WHITE, fg=INK, pad=""):
    head = f'<div class="hd"><span>{title}</span><span>{num:02d}</span></div>' if title else ""
    return f'<section style="background:{bg};color:{fg};{pad}">{head}{body}<div class="ft">clozzy · identidade visual</div></section>'


def box(inner, bg, h, w=None, border=False, extra=""):
    ws = f"width:{w}px;" if w else "flex:1;"
    bd = "border:1px solid rgba(20,9,15,.14);" if border else ""
    return (f'<div style="{ws}height:{h}px;background:{bg};{bd}border-radius:20px;display:flex;align-items:center;'
            f'justify-content:center;position:relative;overflow:hidden;{extra}">{inner}</div>')


def cap(t, color=None):
    c = f"color:{color};" if color else ""
    return f'<div class="lb" style="{c}">{t}</div>'


def tag(ok, on_dark=False):
    c = "#0B7A59" if ok else "#C4162A"
    return (f'<div style="position:absolute;top:10px;right:12px;width:30px;height:30px;border-radius:50%;background:{c};color:#fff;'
            f'font:900 18px/30px Gabarito;text-align:center;box-shadow:0 0 0 3px {"#fff" if not on_dark else "#14090F"}">{"✓" if ok else "✕"}</div>')


def spec(rows, w=None, lw=None, left=False):
    ws = f"width:{w}px;" if w else ""
    ls = f"width:{lw}px;flex:none;" if lw else ""
    ta = "left" if left else "right"
    return "".join(f'<div style="{ws}display:flex;justify-content:space-between;gap:24px;padding:11px 0;border-top:1px solid {LINE};'
                   f'font:500 20px/1.3 Figtree"><b style="font-weight:800;{ls}">{a}</b><span style="text-align:{ta};flex:1">{b}</span></div>' for a, b in rows)


def hex_label(c):
    return c.upper()


def rgb(c):
    c = c.lstrip("#")
    return ", ".join(str(int(c[i:i + 2], 16)) for i in (0, 2, 4))


def cr(a, b):
    return f"{M.contrast(a, b):.1f}:1".replace(".", ",")


# ------------------------------------------------------------------ páginas
def p_capa():
    return page("", 0, f'<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:64px">'
                f'{lg("horizontal", "preto", 190)}'
                f'<div style="font:600 24px Figtree;color:rgba(255,255,255,.75);letter-spacing:.14em">IDENTIDADE VISUAL · 2026-11-11</div></div>', "#000000", WHITE)  # capa em preto puro (o resto usa o ink #14090F)


def p_essencia(n):
    fatos = [("O que é", "Site onde criadores vendem conteúdo exclusivo direto para os fãs. O fã compra, acessa e acompanha num só lugar."),
             ("Para quem", "Criador: vitrine e venda. Fã: compra e biblioteca."),
             ("Palavra-chave", "Close friends. O anel de story com estrela é a origem do símbolo."),
             ("Personalidade", "Próximo · direto · confiante · discreto."),
             ("Promessa", "Seu close, seu preço. Pago no Pix, liberado na hora.")]
    return page("Essência", n, f'<div style="display:flex;gap:90px;align-items:center;height:100%">'
                f'<div style="flex:1.15"><div style="font:900 170px/.92 Gabarito;letter-spacing:-.04em">close<br><span style="color:{DEEP}">friends</span></div>'
                f'<div style="font:500 30px/1.3 Figtree;margin-top:34px;max-width:620px">o círculo de quem você segue de perto, agora com preço.</div></div>'
                f'<div style="flex:1">{spec(fatos, lw=170, left=True)}</div></div>')


def p_logo(n):
    return page("Logo oficial", n, f'<div style="height:100%;display:flex;flex-direction:column;justify-content:space-between">'
                f'<h1>Lockup equilibrado</h1>'
                f'<div style="display:flex;justify-content:center;padding:10px 0">{lg("horizontal", "branco", 210)}</div>'
                f'<div style="display:flex;gap:50px">'
                + "".join(f'<div style="flex:1;border-top:3px solid {INK};padding-top:14px"><b style="font:800 26px Gabarito">{a}</b>'
                          f'<div style="font:500 20px/1.4 Figtree;margin-top:6px;opacity:.85">{b}</div></div>' for a, b in (
                    ("Símbolo", "Anel de story com a linha partida no canto superior esquerdo (dois traços, 16° e 22°) e a estrela de cinco pontas no centro."),
                    ("Palavra", f"clozzy em {NOME_FONTE}, caixa baixa, aperto −18. Sempre ao lado do símbolo ou embaixo dele; nunca fundida ao c."),
                    ("Relação", "Anel com 1,4× a altura do l, vão de 0,35 l, centrado nas letras. Símbolo e palavra pesam parecido.")))
                + '</div></div>')


def construcao():
    spans = K.c_with([16, 22], 228, M.RING_GAP, M.RING_W)
    g = "".join(f'<line x1="{i}" y1="0" x2="{i}" y2="100" stroke="rgba(20,9,15,.08)" stroke-width=".25"/>'
                f'<line x1="0" y1="{i}" x2="100" y2="{i}" stroke="rgba(20,9,15,.08)" stroke-width=".25"/>' for i in range(0, 101, 5))
    guias = "".join(f'<circle cx="50" cy="50" r="{r}" fill="none" stroke="{PURPLE}" stroke-width=".3" stroke-dasharray="1 1"/>' for r in (45, 45 - M.RING_W, 18))
    for a, b in spans[1:-1]:
        for ang in (a, b):
            x0, y0 = K.P(ang, 30)
            x1, y1 = K.P(ang, 49)
            guias += f'<line x1="{f(x0)}" y1="{f(y0)}" x2="{f(x1)}" y2="{f(y1)}" stroke="{PURPLE}" stroke-width=".3"/>'
    return (f'<svg viewBox="-2 -2 104 104" width="560" height="560">{g}<g opacity=".92">{M.SYM(DEEP, DEEP)}</g>{guias}</svg>')


def p_construcao(n):
    rows = [("Grid", "100 × 100 · anel externo r 45"), ("Espessura", f"{f(M.RING_W).replace('.', ',')} (cerca de 1/8 do diâmetro; era 9)"),
            ("Linha cheia", "C com as duas pontas inteiras e terminal redondo"),
            ("Quebra", f"canto superior esquerdo (228°): traços de 16° e 22°, vãos de {M.RING_GAP}°"),
            ("Estrela", "R 18 · razão 0,48 · cantos redondos"),
            ("Corte pequeno", f"≤ 32 px: espessura {f(M.RING_WS).replace('.', ',')}, traços de 22° e 28°, vãos de 16°"),
            ("Lockup", f"anel 1,4× o l · vão 0,35 l · {NOME_FONTE}")]
    return page("Construção", n, f'<div style="display:flex;gap:80px;align-items:center;height:100%">{construcao()}'
                f'<div style="flex:1"><h1>O símbolo</h1><p class="lead" style="margin-bottom:18px">Um story que ainda está carregando: a linha cheia é o que já se vê e os dois traços são o que abre no close.</p>{spec(rows)}</div></div>')


def p_familia(n):
    c = lambda inner, label, w=None, bg=CREAM, h=260: f'<div style="{"width:%dpx" % w if w else "flex:1"}">{box(inner, bg, h)}{cap(label)}</div>'
    return page("Família", n, '<h1>Quatro formatos e o ícone</h1><div style="display:flex;gap:22px;align-items:flex-start">'
                + c(lg("horizontal", "branco", 64), "Horizontal · principal", w=520)
                + c(lg("empilhado", "branco", 170), "Empilhado · espaço quadrado")
                + c(sym_v("branco", 150), "Símbolo · avatar e selo")
                + c(lg("palavra", "branco", 52), "Palavra · texto corrido")
                + '</div><div style="display:flex;gap:46px;align-items:flex-end;margin-top:34px">'
                + "".join(f'<div style="text-align:center"><div style="width:{w}px;height:{w}px;border-radius:{w * .2237:.0f}px;overflow:hidden">{M.tile_svg(s, w, radius=0)}</div>{cap(l)}</div>'
                          for s, w, l in (("rosa", 150, "App 1024"), ("rosa", 72, "72"), ("rosa", 48, "48")))
                + f'<div style="flex:1;font:500 21px/1.45 Figtree;max-width:760px">Use o horizontal sempre que couber. O símbolo sozinho só onde a marca já foi apresentada: perfil, app e favicon. '
                  f'O ícone ocupa 62% do quadrado.</div></div>')


def p_versoes(n):
    notas = {"preto": "palavra branca · anel rosa · estrela branca", "rosa": "tudo branco", "roxo": "tudo branco", "branco": "palavra ink · anel e estrela Pink Deep"}
    cards = []
    for s, nm, b, wc, rc, sc in M.VERSOES:
        border = s == "branco"
        inner = f'<div style="display:flex;gap:56px;align-items:center">{lg("horizontal", s, 62)}{lg("empilhado", s, 128)}</div>'
        lab_c = "rgba(20,9,15,.7)"
        cards.append(f'<div style="width:698px">{box(inner, b, 262, border=border)}'
                     f'<div class="lb" style="color:{lab_c}"><b style="font:800 20px Gabarito;color:{INK}">{nm}</b> · {notas[s]} · fundo {b.upper() if s != "branco" else "#FFFFFF"}</div></div>')
    return page("As quatro versões", n, f'<h1>Preto, branco, roxo e rosa</h1><div style="display:flex;flex-wrap:wrap;gap:22px 24px">{"".join(cards)}</div>')


def p_regra_rosa(n):
    def tile(inner, bg, ok, label, border=False):
        return (f'<div style="width:360px">{box(inner, bg, 300, border=border)}{tag(ok, bg == INK)}</div>')
    ok_tile = lambda inner, bg, ok, label, border=False: (
        f'<div style="width:360px;position:relative"><div style="position:relative">{box(inner, bg, 300, border=border)}{tag(ok, bg == INK)}</div>{cap(label)}</div>')
    tiles = [
        ok_tile(lg("empilhado", "preto", 200), INK, True, "No preto: anel rosa, estrela branca, palavra branca"),
        ok_tile(lg1("empilhado", WHITE, PINK, PINK, 200), INK, False, "Rosa no preto com a estrela rosa"),
        ok_tile(lg1("empilhado", INK, INK, INK, 200), PINK, False, "Preto sobre o rosa"),
        ok_tile(lg1("empilhado", WHITE, PINK, PINK, 200), PURPLE, False, "Rosa sobre o roxo"),
    ]
    regras = [("Círculo rosa", "só no preto, e sempre com a estrela branca."),
              ("Rosa", "fundo rosa leva o logo todo branco. Nada preto em cima."),
              ("Roxo", "fundo roxo leva o logo todo branco. Nada rosa em cima, e roxo não vai sobre o rosa."),
              ("Contraste", f"rosa sobre roxo: {cr(PINK, PURPLE)}; preto sobre roxo: {cr(INK, PURPLE)}; branco sobre rosa só em tamanho de título ({cr(WHITE, PINK)}).")]
    return page("Regra de cor", n, f'<h1>Quando o círculo é rosa, a estrela é branca e o fundo é preto</h1>'
                f'<div style="display:flex;gap:24px;margin-top:6px">{"".join(tiles)}</div>'
                f'<div style="display:flex;gap:40px;margin-top:30px">'
                + "".join(f'<div style="flex:1;border-top:3px solid {INK};padding-top:12px"><b style="font:800 22px Gabarito">{a}</b>'
                          f'<div style="font:500 18px/1.4 Figtree;margin-top:5px;opacity:.85">{b}</div></div>' for a, b in regras) + '</div>')


def p_matriz(n):
    fundos = [("preto", "Preto", INK), ("branco", "Branco", WHITE), ("roxo", "Roxo", PURPLE), ("rosa", "Rosa", PINK)]
    # linha: nome, (palavra, anel, estrela); célula: fundo -> (ok, motivo)
    linhas = [
        ("Preto", (INK, INK, INK), {"preto": (False, "some"), "branco": (True, ""), "roxo": (False, f"contraste {cr(INK, PURPLE)}"), "rosa": (False, "regra")}),
        ("Branco", (WHITE, WHITE, WHITE), {"preto": (True, ""), "branco": (False, "some"), "roxo": (True, ""), "rosa": (True, "só título grande")}),
        ("Roxo", (PURPLE, PURPLE, PURPLE), {"preto": (False, f"contraste {cr(PURPLE, INK)}"), "branco": (True, ""), "roxo": (False, "some"), "rosa": (False, "regra")}),
        ("Rosa", (DEEP, DEEP, DEEP), {"preto": (False, "estrela branca"), "branco": (True, ""), "roxo": (False, "regra"), "rosa": (False, "some")}),
        ("Rosa + estrela branca", (WHITE, PINK, WHITE), {"preto": (True, "versão preta"), "branco": (False, "estrela some"), "roxo": (False, "regra"), "rosa": (False, "some")}),
    ]
    cw, ch = 300, 104
    head = f'<div style="display:flex;gap:10px;margin-left:210px;margin-bottom:8px">' + "".join(
        f'<div style="width:{cw}px;font:800 20px Gabarito">{nm} <span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:{c};vertical-align:-1px;border:1px solid rgba(20,9,15,.3)"></span></div>' for _s, nm, c in fundos) + '</div>'
    rows = ""
    for nm, (wc, rc, sc), cel in linhas:
        cells = ""
        for s, _n2, bg in fundos:
            ok, why = cel[s]
            if why == "some" and (bg.upper() in (rc.upper(), wc.upper()) or (nm == "Rosa" and s == "rosa")):
                inner = f'<span style="font:600 16px Figtree;color:{"#fff" if bg != WHITE else INK};opacity:.5">mesma cor</span>'
                cells += f'<div style="width:{cw}px">{box(inner, bg, ch, w=cw, border=bg == WHITE)}</div>'
                continue
            inner = lg1("horizontal", wc, rc, sc, 40)
            cells += (f'<div style="width:{cw}px;position:relative">{box(inner, bg, ch, w=cw, border=bg == WHITE)}{tag(ok, bg == INK)}'
                      + (f'<div style="position:absolute;left:12px;bottom:8px;font:600 12px Figtree;color:{"#fff" if bg != WHITE else MUTED};opacity:.85">{why}</div>' if why and why != "some" else "") + '</div>')
        rows += (f'<div style="display:flex;gap:10px;align-items:center;margin-bottom:8px"><div style="width:200px;font:800 19px/1.15 Gabarito">Logo {nm.lower() if nm == "Rosa + estrela branca" else nm.lower()}</div>{cells}</div>')
    return page("Combinações", n, f'<h1 style="margin-bottom:14px">Logo × fundo</h1>{head}{rows}', pad="padding-top:84px")


def p_paleta(n):
    prin = [("Rosa", PINK, "Símbolo, fundos de splash e social, títulos grandes em branco"),
            ("Preto", INK, "Texto, fundo escuro, capas de vídeo e merch"),
            ("Roxo", PURPLE, "Superfície de apoio: campanhas, selos, cartões de destaque"),
            ("Branco", WHITE, "Respiro, logo sobre cor, cartões")]
    apoio = [("Pink Deep", DEEP, "Rosa em fundo claro, botão, link"), ("Cream", CREAM, "Fundo padrão de leitura"),
             ("Rosa suave", SOFT, "Chip e seleção · texto ink"), ("Lavanda", LAV, "Chip e seleção do roxo · texto ink"),
             ("Muted", MUTED, "Texto de apoio")]
    big = "".join(f'<div style="width:372px"><div style="height:290px;border-radius:20px;background:{c};{"border:1px solid rgba(20,9,15,.14);" if c == WHITE else ""}padding:18px;display:flex;flex-direction:column;justify-content:flex-end;color:{INK if c == WHITE else WHITE}">'
                  f'<b style="font:900 34px Gabarito">{nm}</b><span style="font:600 17px Figtree;opacity:.9">{c.upper()} · RGB {rgb(c)}</span></div>'
                  f'<div class="lb" style="color:rgba(20,9,15,.75)">{u}</div></div>' for nm, c, u in prin)
    small = "".join(f'<div style="flex:1"><div style="height:130px;border-radius:16px;background:{c};border:1px solid rgba(20,9,15,.14);padding:12px;display:flex;align-items:flex-end;color:{INK if lum_(c) else WHITE}">'
                    f'<b style="font:800 18px Gabarito">{nm}</b></div><div class="lb" style="margin-top:6px"><b>{c.upper()}</b><br>{u}</div></div>' for nm, c, u in apoio)
    return page("Paleta", n, f'<h1>Quatro cores, cinco de apoio</h1><div style="display:flex;gap:20px">{big}</div>'
                f'<div style="display:flex;gap:16px;margin-top:22px">{small}</div>'
                f'<div style="font:500 17px/1.45 Figtree;margin-top:18px;max-width:1300px;opacity:.85">Rosa (matiz 337°) e roxo (266°) são vizinhos na roda de cores; a progressão rosa → violeta é análoga, por isso casam. '
                f'Ficam em superfícies separadas: lado a lado vibram ({cr(PINK, PURPLE)} de contraste). Referência: pares rosa/violeta e tons do violeta em '
                f'mycolourtaste.com/colors/violet e zaps.design/colors/magenta.</div>')


def lum_(c):
    return M.lum(c) > 0.45


def poster(s, w=372, h=560):
    _s, nm, b, wc, rc, sc = M.V[s]
    apoio = {"preto": "rgba(255,255,255,.78)", "rosa": WHITE, "roxo": LAV, "branco": MUTED}[s]
    tit = INK if s == "branco" else WHITE
    btn_bg, btn_c = {"preto": (WHITE, INK), "rosa": (WHITE, DEEP), "roxo": (WHITE, PURPLE), "branco": (DEEP, WHITE)}[s]
    return (f'<div style="width:{w}px"><div style="height:{h}px;background:{b};border-radius:22px;padding:30px;display:flex;flex-direction:column;justify-content:space-between;'
            f'{"border:1px solid rgba(20,9,15,.14);" if s == "branco" else ""}">'
            f'{lg("horizontal", s, 34)}'
            f'<div><div style="font:900 64px/.98 Gabarito;letter-spacing:-.035em;color:{tit}">Seu close,<br>seu preço.</div>'
            f'<div style="font:400 20px/1.35 Figtree;color:{apoio};margin-top:14px">Pago no Pix. Liberado na hora.</div>'
            f'<div style="display:inline-block;margin-top:20px;background:{btn_bg};color:{btn_c};font:800 20px Gabarito;padding:13px 26px;border-radius:999px">Entrar no close</div></div></div>'
            f'{cap(nm + " · título " + ("ink" if s == "branco" else "branco") + " · botão " + ("Pink Deep" if s == "branco" else "branco"))}</div>')


def p_superficies(n):
    return page("Cor nas peças", n, f'<h1>Texto, apoio e botão em cada superfície</h1><div style="display:flex;gap:20px">'
                + "".join(poster(s) for s in ("preto", "rosa", "roxo", "branco")) + '</div>')


def p_tipografia(n):
    return page("Tipografia", n, f'<div style="display:flex;gap:70px;height:100%;align-items:stretch">'
                f'<div style="flex:1.15;background:{INK};border-radius:24px;padding:46px;display:flex;flex-direction:column;justify-content:center;color:{WHITE}">'
                f'<div style="font:900 150px/.92 Gabarito;letter-spacing:-.04em">Seu close,</div>'
                f'<div style="font:900 150px/.92 Gabarito;letter-spacing:-.04em">seu preço.</div>'
                f'<div style="font:300 34px/1.2 Figtree;margin-top:26px;color:rgba(255,255,255,.85)">Pago no Pix<br>liberado na hora</div></div>'
                f'<div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:34px">'
                f'<div><div style="font:900 120px/1 Gabarito;letter-spacing:-.03em">Aa</div><b style="font:800 28px Gabarito">Gabarito 700–900</b>'
                f'<div style="font:500 20px/1.4 Figtree;margin-top:4px">Títulos, preços e botões. Aperto −3% nos títulos. Nome clozzy: {NOME_FONTE}.</div></div>'
                f'<div><div style="font:500 120px/1 Figtree">Aa</div><b style="font:800 28px Gabarito">Figtree 400–700</b>'
                f'<div style="font:500 20px/1.4 Figtree;margin-top:4px">Texto, legenda e interface. Subtítulo em peso 300–400.</div></div>'
                f'<div style="font:500 20px/1.5 Figtree;border-top:1px solid {LINE};padding-top:14px">Escala 64 · 44 · 32 · 22 · 16 · 14 · 12. Título branco sobre o rosa só a partir de 24 px em peso 800.</div></div></div>')


def clear_space(x):
    return (f'<div style="display:inline-block;padding:{x}px;outline:2px dashed {PURPLE};outline-offset:-2px;'
            f'background:repeating-linear-gradient(45deg,rgba(124,72,196,.08) 0 6px,transparent 6px 12px)"><div style="background:{WHITE}">{lg("horizontal", "branco", 150)}</div></div>')


def p_respiro(n):
    mins = [(lg("horizontal", "branco", 28), "Horizontal", "96 px de largura · 25 mm"),
            (lg("empilhado", "branco", 64), "Empilhado", "64 px de altura · 18 mm"),
            (sym_v("branco", 24), "Símbolo", "24 px · 6 mm"),
            (sym_v("branco", 16, True), "Corte pequeno", f"16 a 32 px: espessura {f(M.RING_WS).replace('.', ',')}, traços 22° e 28°")]
    return page("Respiro e mínimos", n, '<div style="display:flex;gap:80px;align-items:flex-start"><div style="flex:1.2"><h1>Respiro</h1>'
                '<p class="lead">Livre em volta do logo: <b>x = ½ do diâmetro do anel</b>. Nenhum texto, borda ou foto entra nessa faixa.</p>'
                f'<div style="margin-top:34px">{clear_space(75)}</div></div>'
                '<div style="flex:1"><h1>Mínimos</h1>'
                + "".join(f'<div style="display:flex;align-items:center;gap:24px;padding:16px 0;border-top:1px solid {LINE}">'
                          f'<div style="width:190px;display:flex;align-items:center">{v}</div><div style="font:500 20px/1.35 Figtree"><b style="font-weight:800">{a}</b><br>{b}</div></div>' for v, a, b in mins)
                + '</div></div>')


def p_errados(n):
    def w(inner, label, bg=WHITE, border=True):
        return (f'<div style="width:335px"><div style="position:relative">{box(inner, bg, 250, border=border and bg == WHITE)}{tag(False, bg == INK)}</div>{cap(label)}</div>')
    grad = (f'<svg viewBox="5 5 90 90" width="110" height="110"><defs><linearGradient id="gz"><stop offset="0" stop-color="{PURPLE}"/><stop offset="1" stop-color="#FFA000"/></linearGradient>'
            f'<filter id="gs"><feDropShadow dx="2" dy="3" stdDeviation="2.5" flood-color="#000" flood-opacity=".5"/></filter></defs><g filter="url(#gs)">{M.SYM("url(#gz)", "url(#gz)")}</g></svg>')
    fused = (f'<div style="display:flex;align-items:center">{sym(DEEP, DEEP, 74)}<span style="font:800 80px Gabarito;color:{INK};letter-spacing:-.02em;margin-left:-4px">lozzy</span></div>')
    tiles = [
        w(f'<div style="transform:scaleX(1.35)">{lg("horizontal", "branco", 52)}</div>', "Esticar ou achatar"),
        w(sym(DEEP, DEEP, 110, extra="transform:scaleX(-1) rotate(70deg)"), "Girar ou espelhar o símbolo"),
        w(fused, "Fundir o C com a palavra"),
        w(f'<div style="display:flex;align-items:center;gap:16px">{sym(DEEP, DEEP, 74)}<span style="font:700 64px Georgia;color:{INK}">clozzy</span></div>', "Trocar a fonte"),
        w(lg1("empilhado", WHITE, PINK, PINK, 130), "Estrela rosa no preto", INK),
        w(lg1("empilhado", INK, INK, INK, 130), "Preto sobre o rosa", PINK),
        w(lg1("empilhado", WHITE, PINK, PINK, 130), "Rosa sobre o roxo", PURPLE),
        w(grad, "Gradiente, sombra ou brilho"),
    ]
    return page("Usos incorretos", n, f'<h1>Não fazer</h1><div style="display:flex;flex-wrap:wrap;gap:22px 20px">{"".join(tiles)}</div>')


def phone(inner, bg, w=270, h=640):
    return (f'<div style="width:{w}px;height:{h}px;border-radius:38px;background:{bg};border:8px solid #1d1217;box-shadow:0 0 0 2px rgba(20,9,15,.2);'
            f'position:relative;overflow:hidden">{inner}</div>')


def p_apps(n):
    icons = "".join(f'<div style="text-align:center"><div style="width:170px;height:170px;border-radius:38px;overflow:hidden;{"border:1px solid rgba(20,9,15,.2);" if s == "branco" else ""}">{M.tile_svg(s, 170, radius=0)}</div>{cap(nm)}</div>'
                    for s, nm in (("preto", "Preto"), ("rosa", "Rosa"), ("roxo", "Roxo"), ("branco", "Branco")))
    splash = phone(f'<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px">'
                   f'{lg("empilhado", "preto", 150)}<div style="font:400 16px Figtree;color:rgba(255,255,255,.75)">Seu close, seu preço.</div></div>', INK)
    story = phone(f'<div style="position:absolute;inset:0;padding:34px 26px;display:flex;flex-direction:column;justify-content:space-between">'
                  f'{lg("horizontal", "rosa", 26)}<div><div style="font:900 52px/.98 Gabarito;letter-spacing:-.03em;color:{WHITE}">Liberado.</div>'
                  f'<div style="font:500 17px Figtree;color:{WHITE};margin-top:8px">Tá na sua biblioteca.</div></div></div>', PINK)
    avatars = "".join(f'<div style="text-align:center"><div style="width:110px;height:110px;border-radius:50%;overflow:hidden">{M.tile_svg(s, 110, radius=0, scale=0.58)}</div>{cap(s.capitalize())}</div>'
                      for s in ("rosa", "preto", "roxo"))
    return page("Aplicações", n, f'<div style="display:flex;gap:60px;align-items:flex-start">'
                f'<div style="flex:1"><h1>Ícone, perfil e telas</h1><div style="display:flex;gap:22px;flex-wrap:wrap">{icons}</div>'
                f'<div style="display:flex;gap:34px;margin-top:34px;align-items:flex-end">{avatars}'
                f'<div style="font:500 19px/1.45 Figtree;max-width:360px">Perfil: símbolo a 58% do quadrado, para sobrar folga quando a rede corta em círculo. Ícone de app: 62%, quadrado sem cantos.</div></div></div>'
                f'<div style="display:flex;gap:26px">{"".join(f"<div>{p}{cap(c)}</div>" for p, c in ((splash, "Splash · preto"), (story, "Story · rosa")))}</div></div>')


def p_voz(n):
    faz = ["Seu pack tá no ar. Já pode mandar o link.", "Pago no Pix. Liberado na sua biblioteca.", "Você só paga se vender.", "Seu close, seu preço.", "Entra pro meu close."]
    nao = ["Plataforma de conteúdo adulto", "Monetize seu engajamento com soluções", "Emoji de fogo ou berinjela como identidade", "Compartilhe o link do seu Close Friends e ganhe com assinaturas"]
    col = lambda t, items, c: (f'<div style="flex:1"><b style="font:900 36px Gabarito;color:{c}">{t}</b>' + "".join(
        f'<div style="font:500 24px/1.3 Figtree;padding:14px 0;border-top:1px solid {LINE}">{i}</div>' for i in items) + '</div>')
    return page("Voz", n, f'<h1>Casual, humano, direto</h1><div style="display:flex;gap:80px;margin-top:10px">{col("Fala assim", faz, "#0B7A59")}{col("Não fala assim", nao, "#C4162A")}</div>'
                f'<div style="font:500 20px/1.4 Figtree;margin-top:34px;opacity:.85">Glossário fixo: exclusivo · oferta · pack · drop · biblioteca · canal.</div>')


def p_arquivos(n):
    files = [("svg/", "logo horizontal, empilhado, palavra e símbolo nas 4 versões (com e sem placa), em uma cor, corte pequeno, app-icon, favicon"),
             ("identidade-clozzy-oficial.pdf · .html", "este documento"),
             ("_marca.py", "regras de cor e exportação dos SVGs"), ("_build.py", "gerador do documento"),
             ("../identidade-nova/fonts/", "Gabarito e Figtree (OFL)"),
             ("../logo-letreiro-v2/", "origem do lockup equilibrado e do símbolo da rodada 10")]
    return page("Arquivos", n, '<h1>Kit</h1>' + "".join(
        f'<div style="display:flex;gap:30px;padding:18px 0;border-top:1px solid {LINE}"><b style="width:420px;font:800 24px Gabarito">{a}</b><span style="font:500 21px/1.35 Figtree">{b}</span></div>' for a, b in files))


def build():
    pages = [p_capa()]
    n = iter(range(1, 99))
    for fn in (p_essencia, p_logo, p_construcao, p_familia, p_versoes, p_regra_rosa, p_matriz, p_paleta, p_superficies,
               p_tipografia, p_respiro, p_errados, p_apps, p_voz, p_arquivos):
        pages.append(fn(next(n) + 1))
    css = (f'@font-face{{font-family:Gabarito;src:url("{FONTS}/Gabarito-Variable.ttf");font-weight:400 900}}'
           f'@font-face{{font-family:Figtree;src:url("{FONTS}/Figtree-Variable.ttf");font-weight:300 900}}'
           """@page{size:1600px 900px;margin:0}
*{box-sizing:border-box}body{margin:0;background:#888;font-family:Figtree}
section{position:relative;width:1600px;height:900px;padding:90px 90px 60px;overflow:hidden;page-break-after:always;margin:0 auto 20px}
.hd{position:absolute;left:90px;right:90px;top:34px;display:flex;justify-content:space-between;font:600 15px Figtree;letter-spacing:.1em;text-transform:uppercase;opacity:.55}
.ft{position:absolute;left:90px;bottom:24px;font:500 13px Figtree;opacity:.45}
h1{font:900 50px/1.05 Gabarito;letter-spacing:-.03em;margin:0 0 20px}
.lead{font:500 22px/1.45 Figtree;margin:0;max-width:1100px;opacity:.85}
.lb{font:500 15px/1.35 Figtree;margin-top:9px;color:rgba(20,9,15,.62)}
svg{overflow:visible}
@media print{body{background:none}section{margin:0}}""")
    html = f'<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>{DOC_TITULO}</title><style>{css}</style></head><body>{"".join(pages)}</body></html>'
    out = OUT_DIR / f"{OUT_NAME}.html"
    out.write_text(html)
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files", "--force-device-scale-factor=1",
                    f"--print-to-pdf={OUT_DIR / (OUT_NAME + '.pdf')}", "--no-pdf-header-footer", "--virtual-time-budget=4000", out.as_uri()],
                   check=True, capture_output=True)
    return len(pages)


if __name__ == "__main__":
    print("svg", M.build())
    print("págs.", build())

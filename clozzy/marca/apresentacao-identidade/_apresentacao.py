#!/usr/bin/env python3
"""Clozzy — manual de identidade visual (apresentação 1600×900, HTML + PDF).

Base: identidade-oficial (regras de cor, símbolo, lockup) com o nome em Gabarito 650 (gabarito do teste de fontes).
Reaproveita páginas e helpers de ../identidade-oficial/_build.py (monkeypatch de `page`) e acrescenta degradês,
banners e aplicações. Rodar: python3 _apresentacao.py
"""
import importlib.util
import random
import shutil
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
F.usar(F.GABARITO, PESO)              # nome clozzy em Gabarito 650 (haste ≈ 85% do 800)
B.NOME_FONTE = f"Gabarito {PESO}"
B.FONTS = "../identidade-nova/fonts"

PINK, DEEP, PURPLE, INK, CREAM, WHITE = M.PINK, M.DEEP, M.PURPLE, M.INK, M.CREAM, M.WHITE
LAV, SOFT, MUTED = M.LAVANDA, M.ROSA_SUAVE, M.MUTED
LINE = "rgba(20,9,15,.14)"
LINE_W = "rgba(255,255,255,.28)"
VERDE, VERMELHO = "#0B7A59", "#C4162A"
lg, lg1, sym = B.lg, B.lg1, B.sym

# degradês: sempre em FUNDO, nunca no logo, no símbolo ou no texto
POP = f"linear-gradient(135deg,{PINK} 0%,{PURPLE} 100%)"
AURORA = (f"radial-gradient(70% 90% at 0% 105%,{PINK} 0%,rgba(255,0,101,0) 68%),"
          f"radial-gradient(70% 90% at 102% -5%,{PURPLE} 0%,rgba(124,72,196,0) 68%),{INK}")
NEVOA = f"linear-gradient(135deg,{SOFT} 0%,{LAV} 100%)"
FANTASMA = "rgba(255,255,255,.17)"


# ------------------------------------------------------------------ base visual
def page(title, num, body, bg=WHITE, fg=INK, pad=""):
    head = f'<div class="hd"><span>{title}</span><span>{num:02d}</span></div>' if title else ""
    foot = '<div class="ft">clozzy · manual de identidade visual</div>' if title else ""
    return f'<section style="background:{bg};color:{fg};{pad}">{head}{body}{foot}</section>'


B.page = page


def cap(t, color=None):
    c = f"color:{color};" if color else ""
    return f'<div class="lb" style="{c}">{t}</div>'


def fantasma(size, right, bottom, cor=FANTASMA, estrela=None):
    return f'<div style="position:absolute;right:{right}px;bottom:{bottom}px">{sym(cor, estrela or cor, size)}</div>'


def abs_fill(inner, extra=""):
    return f'<div style="position:absolute;inset:0;{extra}">{inner}</div>'


def btn(txt, bg=WHITE, fg=DEEP, size=20, pad="13px 26px"):
    return (f'<span style="display:inline-block;background:{bg};color:{fg};font:800 {size}px Gabarito;padding:{pad};'
            f'border-radius:999px;white-space:nowrap">{txt}</span>')


def chip(txt, bg=LAV, fg=INK, size=13):
    return (f'<span style="display:inline-block;background:{bg};color:{fg};font:700 {size}px Figtree;padding:4px 10px;'
            f'border-radius:999px;white-space:nowrap">{txt}</span>')


def cmyk(c):
    r, g, b = (int(c.lstrip("#")[i:i + 2], 16) / 255 for i in (0, 2, 4))
    k = 1 - max(r, g, b)
    if k >= 1:
        return "0 0 0 100"
    return " ".join(str(round(100 * v)) for v in ((1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k))


def rule_cols(items, size=19, top=INK):
    return ('<div style="display:flex;gap:40px">' + "".join(
        f'<div style="flex:1;border-top:3px solid {top};padding-top:12px"><b style="font:800 {size + 5}px Gabarito">{a}</b>'
        f'<div style="font:500 {size}px/1.4 Figtree;margin-top:5px;opacity:.85">{b}</div></div>' for a, b in items) + '</div>')


# ------------------------------------------------------------------ páginas
def p_capa(n):
    return page("", n, fantasma(1050, -250, -330) + abs_fill(
        f'<div style="padding:0 120px;height:100%;display:flex;flex-direction:column;justify-content:center;gap:70px">'
        f'{lg("horizontal", "rosa", 150)}'
        f'<div style="font:900 104px/.95 Gabarito;letter-spacing:-.04em">Manual de<br>identidade visual</div></div>')
        + '<div style="position:absolute;left:120px;right:120px;bottom:64px;display:flex;justify-content:space-between;'
          'font:600 22px Figtree;letter-spacing:.1em;text-transform:uppercase"><span>Versão 1.0</span><span>Novembro de 2026</span></div>',
        POP, WHITE)


def p_sumario(n, secoes):
    itens = "".join(
        f'<div style="display:flex;align-items:baseline;gap:26px;padding:20px 0;border-top:1px solid {LINE_W}">'
        f'<span style="font:900 30px Gabarito;color:{PINK};width:56px">{i + 1:02d}</span>'
        f'<span style="font:900 54px/1 Gabarito;letter-spacing:-.03em;flex:1">{nm}</span>'
        f'<span style="font:600 22px Figtree;opacity:.6">{pg:02d}</span></div>' for i, (nm, pg) in enumerate(secoes))
    return page("Índice", n, f'<div style="display:flex;gap:120px;height:100%;align-items:center">'
                f'<div style="flex:.9;font:900 170px/.9 Gabarito;letter-spacing:-.05em">Índice</div>'
                f'<div style="flex:1.2">{itens}</div></div>', INK, WHITE)


def p_essencia(n):
    fatos = [("O que é", "Site onde criadores vendem conteúdo exclusivo direto para os fãs. O fã compra, acessa e acompanha num só lugar."),
             ("Para quem", "Criador: vitrine e venda. Fã: compra e biblioteca."),
             ("Origem", "O anel de story com estrela, o close friends."),
             ("Promessa", "Seu close, seu preço. Pago no Pix, liberado na hora.")]
    linhas = "".join(f'<div style="padding:15px 0;border-top:1px solid {LINE_W}"><b style="font:800 20px Gabarito;color:{SOFT}">{a}</b>'
                     f'<div style="font:500 21px/1.35 Figtree;margin-top:4px">{b}</div></div>' for a, b in fatos)
    return page("Essência", n, f'<div style="display:flex;gap:80px;align-items:center;height:100%">'
                f'<div style="flex:1.5"><div style="font:900 214px/.84 Gabarito;letter-spacing:-.05em">close<br>friends.</div>'
                f'<div style="font:500 34px/1.25 Figtree;margin-top:40px;max-width:720px">o círculo de quem você segue de perto, agora com preço.</div></div>'
                f'<div style="flex:1">{linhas}</div></div>', AURORA, WHITE)


def p_posicionamento(n):
    aud = [("Criador", "Vitrine e venda do conteúdo exclusivo. Você só paga se vender."),
           ("Fã", "Compra, acessa e acompanha tudo numa biblioteca só.")]
    tracos = [("Próximo", "Fala como amigo, não como plataforma."), ("Direto", "Preço e prazo na primeira linha."),
              ("Confiante", "Cobra sem pedir desculpa."), ("Discreto", "Sem apelação: o close é de quem entra.")]
    return page("Posicionamento", n, f'<div style="display:flex;gap:24px;height:470px">'
                f'<div style="flex:1.25;border-radius:28px;background:{POP};color:{WHITE};padding:48px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden">'
                f'{fantasma(560, -150, -190)}'
                f'<div style="font:600 20px Figtree;letter-spacing:.1em;text-transform:uppercase">Promessa</div>'
                f'<div style="font:900 104px/.92 Gabarito;letter-spacing:-.04em;position:relative">Seu close,<br>seu preço.</div>'
                f'<div style="font:500 26px Figtree;position:relative">Pago no Pix. Liberado na hora.</div></div>'
                f'<div style="flex:1;display:flex;flex-direction:column;gap:24px">'
                + "".join(f'<div style="flex:1;border-radius:28px;background:{bg};padding:34px 38px;display:flex;flex-direction:column;justify-content:space-between">'
                          f'<div style="font:900 52px Gabarito;letter-spacing:-.03em">{a}</div><div style="font:500 24px/1.35 Figtree;max-width:560px">{b}</div></div>'
                          for (a, b), bg in zip(aud, (SOFT, LAV))) + '</div></div>'
                f'<div style="font:600 18px Figtree;letter-spacing:.1em;text-transform:uppercase;margin:34px 0 10px;opacity:.6">Personalidade</div>'
                + rule_cols(tracos, 23))


def p_logo(n):
    return page("Logo oficial", n, f'<div style="height:100%;display:flex;flex-direction:column;gap:30px">'
                f'<div style="flex:1;border-radius:28px;background:{CREAM};border:1px solid {LINE};display:flex;align-items:center;justify-content:center;position:relative">'
                f'<div style="position:absolute;left:34px;top:28px;font:900 40px Gabarito;letter-spacing:-.03em">Lockup equilibrado</div>'
                f'{lg("horizontal", "branco", 220)}</div>'
                + rule_cols((
                    ("Símbolo", "Anel de story com a linha partida no canto superior esquerdo e a estrela de cinco pontas no centro."),
                    ("Palavra", f"clozzy em Gabarito {PESO}, caixa baixa. Sempre ao lado do símbolo ou embaixo; nunca fundida ao c."),
                    ("Relação", "Anel com 1,4× a altura do l, vão de 0,35 l, centrado nas letras. Símbolo e palavra pesam parecido.")), 20)
                + '</div>')


def p_familia(n):
    def c(inner, label, w=None, bg=CREAM, h=330):
        return f'<div style="{"width:%dpx" % w if w else "flex:1"}">{B.box(inner, bg, h)}{cap(label)}</div>'
    return page("Família", n, '<h1>Quatro formatos e o ícone</h1><div style="display:flex;gap:22px;align-items:flex-start">'
                + c(lg("horizontal", "branco", 78), "Horizontal · principal", w=560)
                + c(lg("empilhado", "branco", 200), "Empilhado · espaço quadrado")
                + c(B.sym_v("branco", 170), "Símbolo · avatar e selo")
                + c(lg("palavra", "branco", 60), "Palavra · texto corrido")
                + '</div><div style="display:flex;gap:48px;align-items:flex-end;margin-top:36px">'
                + "".join(f'<div style="text-align:center"><div style="width:{w}px;height:{w}px;border-radius:{w * .2237:.0f}px;overflow:hidden">{M.tile_svg(sv, w, radius=0)}</div>{cap(l)}</div>'
                          for sv, w, l in (("rosa", 170, "App 1024"), ("rosa", 84, "72"), ("rosa", 52, "48")))
                + f'<div style="flex:1;font:500 22px/1.45 Figtree;max-width:760px">Use o horizontal sempre que couber. O símbolo sozinho só onde a marca já foi apresentada: perfil, app e favicon. '
                  f'O ícone ocupa 62% do quadrado.</div></div>')


def p_versoes(n):
    notas = {"preto": "palavra branca · anel rosa · estrela branca", "rosa": "tudo branco", "roxo": "tudo branco", "branco": "palavra ink · anel e estrela Pink Deep"}
    cards = []
    for sv, nm, b, wc, rc, sc in M.VERSOES:
        inner = f'<div style="display:flex;gap:64px;align-items:center">{lg("horizontal", sv, 70)}{lg("empilhado", sv, 148)}</div>'
        cards.append(f'<div style="width:698px">{B.box(inner, b, 300, border=sv == "branco")}'
                     f'<div class="lb" style="font-size:17px"><b style="font:800 21px Gabarito;color:{INK}">{nm}</b> · {notas[sv]} · fundo {b.upper() if sv != "branco" else "#FFFFFF"}</div></div>')
    return page("As quatro versões", n, f'<h1>Preto, branco, roxo e rosa</h1><div style="display:flex;flex-wrap:wrap;gap:22px 24px">{"".join(cards)}</div>')


def p_regra(n):
    def t(inner, bg, ok, label):
        return (f'<div style="width:340px;position:relative"><div style="position:relative">{B.box(inner, bg, 360)}{B.tag(ok, bg == INK)}</div>{cap(label)}</div>')
    tiles = [t(lg("empilhado", "preto", 220), INK, True, "No preto: anel rosa, estrela branca, palavra branca"),
             t(lg1("empilhado", WHITE, PINK, PINK, 220), INK, False, "Rosa no preto com a estrela rosa"),
             t(lg1("empilhado", INK, INK, INK, 220), PINK, False, "Preto sobre o rosa"),
             t(lg1("empilhado", WHITE, PINK, PINK, 220), PURPLE, False, "Rosa sobre o roxo")]
    regras = [("Círculo rosa", "só no preto, e sempre com a estrela branca."),
              ("Rosa", "fundo rosa leva o logo todo branco. Nada preto em cima."),
              ("Roxo", "fundo roxo leva o logo todo branco. Nada rosa em cima, e roxo não vai sobre o rosa."),
              ("Contraste", f"rosa sobre roxo: {B.cr(PINK, PURPLE)}; preto sobre roxo: {B.cr(INK, PURPLE)}; branco sobre rosa só em tamanho de título ({B.cr(WHITE, PINK)}).")]
    return page("Regra de cor", n, '<h1>Quando o círculo é rosa, a estrela é branca e o fundo é preto</h1>'
                f'<div style="display:flex;gap:20px">{"".join(tiles)}</div><div style="margin-top:26px">{rule_cols(regras, 19)}</div>')


def p_voz(n):
    faz = ["Seu pack tá no ar. Já pode mandar o link.", "Pago no Pix. Liberado na sua biblioteca.", "Você só paga se vender.", "Seu close, seu preço.", "Entra pro meu close."]
    nao = ["Plataforma de conteúdo adulto", "Monetize seu engajamento com soluções", "Emoji de fogo ou berinjela como identidade", "Compartilhe o link do seu Close Friends e ganhe com assinaturas"]
    bolha = lambda t, bg, c=INK, strike=False: (f'<div style="background:{bg};color:{c};border-radius:22px;padding:18px 26px;font:600 29px/1.25 Figtree;margin-bottom:16px;'
                                                 f'display:table;max-width:100%;{"text-decoration:line-through;text-decoration-thickness:2px;opacity:.75" if strike else ""}">{t}</div>')
    col = lambda t, itens, cor, fn: (f'<div style="flex:1"><b style="font:900 40px Gabarito;color:{cor};display:block;margin-bottom:16px">{t}</b>' + "".join(fn(i) for i in itens) + '</div>')
    gloss = "".join(f'<span style="display:inline-block;margin-right:10px">{chip(g, SOFT, INK, 20)}</span>' for g in ("exclusivo", "oferta", "pack", "drop", "biblioteca", "canal"))
    return page("Voz", n, '<h1>Casual, humano, direto</h1><div style="display:flex;gap:70px">'
                + col("Fala assim", faz, VERDE, lambda i: bolha(i, POP, WHITE))
                + col("Não fala assim", nao, VERMELHO, lambda i: bolha(i, LAV, INK, True)) + '</div>'
                f'<div style="margin-top:20px;font:700 19px Figtree">Glossário fixo&nbsp;&nbsp;{gloss}</div>')


def p_paleta(n):
    prin = [("Rosa", PINK, "Símbolo, fundos de splash e social, títulos grandes em branco"),
            ("Preto", INK, "Texto, fundo escuro, capas de vídeo e merch"),
            ("Roxo", PURPLE, "Superfície de apoio: campanhas, selos, cartões de destaque"),
            ("Branco", WHITE, "Respiro, logo sobre cor, cartões")]
    apoio = [("Pink Deep", DEEP, "Rosa em fundo claro, botão, link"), ("Cream", CREAM, "Fundo padrão de leitura"),
             ("Rosa suave", SOFT, "Chip e seleção"), ("Lavanda", LAV, "Chip e seleção do roxo"), ("Muted", MUTED, "Texto de apoio")]
    big = "".join(
        f'<div style="flex:1"><div style="height:262px;border-radius:22px;background:{c};{"border:1px solid " + LINE + ";" if c == WHITE else ""}padding:20px 22px;'
        f'display:flex;flex-direction:column;justify-content:flex-end;color:{INK if c == WHITE else WHITE}">'
        f'<b style="font:900 38px Gabarito;letter-spacing:-.02em">{nm}</b>'
        f'<div style="font:600 16px/1.5 Figtree;opacity:.92">{c.upper()}<br>RGB {B.rgb(c)}<br>CMYK ≈ {cmyk(c)}</div></div>'
        f'<div class="lb">{u}</div></div>' for nm, c, u in prin)
    prop = [(INK, 38, "Preto", WHITE), (WHITE, 28, "Branco", INK), (PINK, 20, "Rosa", WHITE), (PURPLE, 9, "Roxo", WHITE), (SOFT, 5, "Apoio", INK)]
    barra = "".join(f'<div style="flex:{p};background:{c};color:{t};padding:14px 16px;font:800 18px Gabarito;{"border:1px solid " + LINE + ";" if c == WHITE else ""}">{nm} {p}%</div>'
                    for c, p, nm, t in prop)
    small = "".join(
        f'<div style="flex:1"><div style="height:74px;border-radius:14px;background:{c};border:1px solid {LINE};padding:10px 12px;display:flex;align-items:flex-end;'
        f'color:{INK if M.lum(c) > .45 else WHITE}"><b style="font:800 17px Gabarito">{nm}</b></div>'
        f'<div class="lb" style="margin-top:5px"><b>{c.upper()}</b> · {u}</div></div>' for nm, c, u in apoio)
    return page("Paleta", n, f'<h1>Quatro cores, cinco de apoio</h1><div style="display:flex;gap:20px">{big}</div>'
                f'<div style="font:600 15px Figtree;letter-spacing:.1em;text-transform:uppercase;opacity:.6;margin:20px 0 8px">Proporção de uso</div>'
                f'<div style="display:flex;border-radius:14px;overflow:hidden">{barra}</div>'
                f'<div style="display:flex;gap:16px;margin-top:18px">{small}</div>')


def card_degrade(nome, spec, bg, logo, dark_text=False):
    c = INK if dark_text else WHITE
    return (f'<div style="flex:1;height:440px;border-radius:26px;background:{bg};color:{c};padding:30px 32px;display:flex;flex-direction:column;justify-content:space-between;'
            f'position:relative;overflow:hidden;{"border:1px solid " + LINE + ";" if dark_text else ""}">'
            f'<div style="font:900 56px/1 Gabarito;letter-spacing:-.03em">{nome}</div>'
            f'<div style="display:flex;justify-content:center">{logo}</div>'
            f'<div style="font:600 16px/1.45 Figtree;opacity:.9">{spec}</div></div>')


def p_degrade(n):
    return page("Degradê", n, '<h1>Rosa e roxo, só no fundo</h1><div style="display:flex;gap:20px">'
                + card_degrade("Pop", "135° · rosa #FF0065 0% → roxo #7C48C4 100%<br>Campanha, capa, banner, story", POP, lg("horizontal", "rosa", 60))
                + card_degrade("Aurora", "Rosa no canto inferior esquerdo, roxo no superior direito, base preto #14090F<br>Hero, splash, tela escura", AURORA, lg("horizontal", "rosa", 60))
                + card_degrade("Névoa", "135° · rosa suave #FFD9E7 → lavanda #EBE3FA<br>Fundo de leitura, cartão, e-mail", NEVOA, lg("horizontal", "branco", 60), True)
                + '</div><div style="margin-top:26px">'
                + rule_cols((("Logo todo branco", "Sobre Pop e Aurora, só a versão rosa ou roxa (tudo branco). Sobre a Névoa, a versão branco."),
                             ("Só no fundo", "Nunca no logo, no símbolo, no texto ou na borda. O degradê é superfície."),
                             ("Texto", "Branco, título a partir de 24 px em peso 800 (3,9:1 no rosa, 5,2:1 no roxo)."),
                             ("Um por peça", "Sem sobrepor outro rosa ou roxo chapado. Sentido sempre rosa → roxo.")), 19) + '</div>')


def p_hierarquia(n):
    esc = [("Display", "Gabarito 900 · 96 / 92% · −4%", '<span style="font:900 96px/.95 Gabarito;letter-spacing:-.04em">Seu close</span>'),
           ("Título", "Gabarito 800 · 56 / 100% · −3%", '<span style="font:800 56px/1 Gabarito;letter-spacing:-.03em">Pack verão liberado</span>'),
           ("Subtítulo", "Figtree 500 · 28 / 130%", '<span style="font:500 28px/1.3 Figtree">Pago no Pix, na sua biblioteca</span>'),
           ("Corpo", "Figtree 400 · 20 / 150%", '<span style="font:400 20px/1.5 Figtree">Você só paga se vender. Sem mensalidade, sem surpresa.</span>'),
           ("Legenda", "Figtree 500 · 14 / 135%", '<span style="font:500 14px/1.35 Figtree;color:' + MUTED + '">Liberado em 12 nov · válido para sempre</span>')]
    linhas = "".join(f'<div style="display:flex;align-items:baseline;gap:24px;padding:12px 0;border-top:1px solid {LINE}">'
                     f'<div style="width:190px;flex:none"><b style="font:800 20px Gabarito">{a}</b><div style="font:500 14px/1.3 Figtree;opacity:.65;margin-top:2px">{b}</div></div>'
                     f'<div style="flex:1;white-space:nowrap">{c}</div></div>' for a, b, c in esc)
    comp = (f'<div style="width:420px;flex:none;border-radius:26px;background:{CREAM};border:1px solid {LINE};padding:30px;display:flex;flex-direction:column;gap:20px">'
            f'<div style="font:600 15px Figtree;letter-spacing:.1em;text-transform:uppercase;opacity:.6">Componentes</div>'
            f'<div style="display:flex;gap:12px;align-items:center">{btn("Comprar no Pix", DEEP, WHITE)}'
            f'<span style="font:800 20px Gabarito;border:2px solid {INK};padding:11px 24px;border-radius:999px">Ver oferta</span></div>'
            f'<div style="display:flex;gap:10px">{chip("Liberado", LAV)}{chip("Novo drop", SOFT)}{chip("Pack", "#fff")}</div>'
            f'<div><span style="font:900 64px Gabarito;letter-spacing:-.03em">R$ 29</span><span style="font:500 18px Figtree;color:{MUTED};margin-left:8px">no Pix</span></div>'
            f'<div style="border:1.5px solid {LINE};background:#fff;border-radius:14px;padding:14px 16px;font:500 17px Figtree;color:{MUTED}">Cole o link do seu close</div></div>')
    return page("Hierarquia", n, f'<h1>Escala e componentes</h1><div style="display:flex;gap:50px;align-items:flex-start"><div style="flex:1">{linhas}</div>{comp}</div>'
                f'<div style="font:500 18px/1.45 Figtree;margin-top:22px;opacity:.85;max-width:1100px">Escala 96 · 56 · 28 · 20 · 14. Botão em Pink Deep com texto branco sobre claro; branco com texto Pink Deep sobre rosa e degradê.</div>')


def p_divisor(n):
    return page("", n, fantasma(1000, -240, -300) + abs_fill(
        f'<div style="padding:0 120px;height:100%;display:flex;flex-direction:column;justify-content:center">'
        f'<div style="font:900 40px Gabarito">06</div>'
        f'<div style="font:900 250px/.9 Gabarito;letter-spacing:-.05em;margin:16px 0 36px">Aplicações</div>'
        f'<div style="font:600 26px Figtree;letter-spacing:.06em">Banners · Anúncios · Feed · Stories · Web e app · Impressos</div></div>'),
        POP, WHITE)


# ---- banners e anúncios
def banner(w, h, bg, logo, titulo, sub, btn_html, fg=WHITE, size=64, deco=True, deco_cor=FANTASMA, border=False):
    d = fantasma(int(h * 1.9), -int(h * .35), -int(h * .55), deco_cor) if deco else ""
    return (f'<div style="width:{w}px;height:{h}px;background:{bg};color:{fg};border-radius:22px;position:relative;overflow:hidden;'
            f'{"border:1px solid " + LINE + ";" if border else ""}">{d}'
            f'<div style="position:absolute;inset:0;padding:{int(h * .13)}px {int(h * .16)}px;display:flex;flex-direction:column;justify-content:space-between">'
            f'<div>{logo}</div><div style="display:flex;align-items:flex-end;justify-content:space-between;gap:20px">'
            f'<div><div style="font:900 {size}px/.96 Gabarito;letter-spacing:-.035em">{titulo}</div>'
            + (f'<div style="font:500 {max(14, size // 3)}px Figtree;margin-top:8px;opacity:.92">{sub}</div>' if sub else '') +
            f'</div><div>{btn_html}</div></div></div></div>')


def p_banners(n):
    hero = banner(1420, 290, POP, lg("horizontal", "rosa", 44), "Seu close, seu preço.", "Pago no Pix. Liberado na hora.", btn("Entrar no close", WHITE, DEEP, 24, "16px 34px"), size=84)
    b2 = banner(700, 250, AURORA, lg("horizontal", "rosa", 36), "Pago no Pix.<br>Liberado na hora.", "", btn("Ver como funciona", WHITE, DEEP, 18), size=46, deco_cor="rgba(255,255,255,.1)")
    b3 = banner(700, 250, NEVOA, lg("horizontal", "branco", 36), "Você só paga<br>se vender.", "", btn("Criar meu close", DEEP, WHITE, 18), fg=INK, size=46, deco_cor="rgba(124,72,196,.12)", border=True)
    return page("Banners de campanha", n, f'<h1>Banners de campanha</h1>{hero}{cap("Hero · 1420 × 290 · Pop")}'
                f'<div style="display:flex;gap:20px;margin-top:10px"><div>{b2}{cap("Aurora · 700 × 250")}</div><div>{b3}{cap("Névoa · 700 × 250")}</div></div>')


def zoom(inner, z, w, h):
    return f'<div style="width:{int(w * z)}px;height:{int(h * z)}px;position:relative"><div style="zoom:{z};width:{w}px;height:{h}px">{inner}</div></div>'


def ad(w, h, bg, logo_h, titulo, tsz, btn_html, fg=WHITE, horiz=False, sub=None, deco=True, deco_cor=FANTASMA, logo_slug="rosa", r=8):
    d = fantasma(int(max(w, h) * .9), -int(w * .2), -int(h * .25), deco_cor) if deco else ""
    logo = lg("horizontal", logo_slug, logo_h)
    if horiz:
        corpo = (f'<div style="position:absolute;inset:0;padding:0 {int(h * .22)}px;display:flex;align-items:center;justify-content:space-between;gap:16px">'
                 f'{logo}<div style="font:900 {tsz}px/1 Gabarito;letter-spacing:-.03em;white-space:nowrap">{titulo}</div>{btn_html}</div>')
    else:
        corpo = (f'<div style="position:absolute;inset:0;padding:{int(w * .09)}px;display:flex;flex-direction:column;justify-content:space-between">'
                 f'{logo}<div><div style="font:900 {tsz}px/.97 Gabarito;letter-spacing:-.035em">{titulo}</div>'
                 + (f'<div style="font:500 14px Figtree;margin-top:8px;opacity:.9">{sub}</div>' if sub else '')
                 + f'<div style="margin-top:14px">{btn_html}</div></div></div>')
    return f'<div style="width:{w}px;height:{h}px;background:{bg};color:{fg};position:relative;overflow:hidden;border-radius:{r}px">{d}{corpo}</div>'


def p_anuncios(n):
    lead = ad(728, 90, POP, 30, "Seu close, seu preço.", 26, btn("Entrar", WHITE, DEEP, 15, "9px 20px"), horiz=True, deco_cor="rgba(255,255,255,.12)")
    mpu = ad(300, 250, AURORA, 26, "Pago no Pix.<br>Liberado na hora.", 32, btn("Ver como funciona", WHITE, DEEP, 14, "9px 18px"), deco_cor="rgba(255,255,255,.1)")
    half = ad(300, 600, POP, 30, "Seu close,<br>seu preço.", 48, btn("Entrar no close", WHITE, DEEP, 18, "12px 24px"), sub="Pago no Pix. Liberado na hora.", deco_cor="rgba(255,255,255,.16)")
    mob = ad(320, 50, PINK, 20, "Seu close, seu preço.", 13, btn("Entrar", WHITE, DEEP, 12, "6px 14px"), horiz=True, deco=False, r=6)
    email = ad(600, 160, NEVOA, 30, "Seu pack tá no ar.", 30, btn("Ver oferta", DEEP, WHITE, 16, "10px 22px"), fg=INK, horiz=True, deco=False, logo_slug="branco", r=10)
    return page("Anúncios e e-mail", n, '<div style="display:flex;gap:136px;align-items:flex-start"><div style="width:984px">'
                '<h1>Formatos de mídia</h1>'
                f'{zoom(lead, 1.35, 728, 90)}{cap("Leaderboard · 728 × 90")}'
                f'<div style="display:flex;gap:34px;margin-top:18px;align-items:flex-start"><div>{zoom(mpu, 1.2, 300, 250)}{cap("Retângulo médio · 300 × 250")}</div>'
                f'<div><div>{zoom(mob, 1.5, 320, 50)}{cap("Mobile · 320 × 50")}</div><div style="margin-top:14px">{zoom(email, .8, 600, 160)}{cap("Cabeçalho de e-mail · 600 × 160")}</div></div></div></div>'
                f'<div style="padding-top:72px">{half}{cap("Meia página · 300 × 600")}</div></div>')


# ---- redes
def post(inner, bg, border=False, size=300):
    return (f'<div style="width:{size}px;height:{size}px;background:{bg};border-radius:10px;position:relative;overflow:hidden;'
            f'{"border:1px solid " + LINE + ";" if border else ""}">{inner}</div>')


def post_txt(titulo, logo, fg=WHITE, tam=50, deco=None, extra=""):
    return ((deco or "") + f'<div style="position:absolute;inset:0;padding:26px;display:flex;flex-direction:column;justify-content:space-between;color:{fg}">'
            f'<div style="font:900 {tam}px/.96 Gabarito;letter-spacing:-.04em">{titulo}</div>{extra}<div>{logo}</div></div>')


def p_feed(n):
    p1 = post(post_txt("Seu close,<br>seu preço.", lg("horizontal", "rosa", 24), deco=fantasma(300, -90, -110)), POP)
    p2 = post(post_txt("Você só<br>paga se<br>vender.", lg("horizontal", "preto", 24), deco=fantasma(200, -70, -50, PINK, WHITE)), INK)
    p3 = post(post_txt("Pago no Pix.<br>Liberado<br>na hora.", lg("horizontal", "rosa", 24), tam=46), PINK)
    p4 = post(post_txt("Entra pro<br>meu close.", lg("horizontal", "branco", 24), fg=INK, tam=50), LAV)
    p5 = post(post_txt("Seu pack<br>tá no ar.", lg("horizontal", "rosa", 24), deco=fantasma(300, -90, -110, "rgba(255,255,255,.1)")), AURORA)
    p6 = post(f'<div style="position:absolute;inset:0;padding:26px;display:flex;flex-direction:column;justify-content:space-between">'
              f'<div style="height:130px;border-radius:14px;background:{POP};position:relative;overflow:hidden">{fantasma(170, -40, -50)}</div>'
              f'<div><div style="font:800 24px Gabarito">Pack verão</div>'
              f'<div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px"><span style="font:900 44px Gabarito;letter-spacing:-.03em">R$ 29</span>{chip("Liberado")}</div></div></div>', WHITE, True)
    regras = [("Fundo", "Um por post: Pop, preto, rosa, lavanda, Aurora ou branco."), ("Título", "Gabarito 900, até 3 linhas, aperto −4%."),
              ("Logo", "Horizontal, canto inferior esquerdo, ≈ 30% da largura."), ("Cor", "Mesmas regras do logo: nada rosa sobre roxo, nada preto sobre rosa."),
              ("Cadência", "Alterne claro e escuro para o grid respirar.")]
    return page("Feed", n, '<div style="display:flex;gap:50px"><div><h1>Feed</h1>'
                f'<div style="display:grid;grid-template-columns:repeat(3,300px);gap:18px">{p1}{p2}{p3}{p4}{p5}{p6}</div></div>'
                f'<div style="flex:1;padding-top:96px">{B.spec(regras, left=True, lw=120)}</div></div>')


def story(inner, bg, w=300, h=533, border=False):
    return (f'<div style="width:{w}px;height:{h}px;background:{bg};border-radius:26px;position:relative;overflow:hidden;'
            f'{"border:1px solid " + LINE + ";" if border else ""}">{inner}</div>')


def p_stories(n):
    s1 = story(fantasma(520, -170, -190) + abs_fill(
        f'<div style="padding:28px 24px;height:100%;display:flex;flex-direction:column;justify-content:space-between">{lg("horizontal", "rosa", 28)}'
        f'<div><div style="font:900 56px/.95 Gabarito;letter-spacing:-.04em">Seu close,<br>seu preço.</div><div style="margin-top:18px">{btn("Entrar no close", WHITE, DEEP, 17, "11px 22px")}</div></div></div>'), POP)
    check = f'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
    s2 = story(abs_fill(
        f'<div style="padding:28px 24px;height:100%;display:flex;flex-direction:column;justify-content:space-between;color:{WHITE}">{lg("horizontal", "preto", 28)}'
        f'<div><div style="width:46px;height:46px;border-radius:50%;background:{VERDE};display:flex;align-items:center;justify-content:center;margin-bottom:16px">{check}</div>'
        f'<div style="font:900 62px/.95 Gabarito;letter-spacing:-.04em">Liberado.</div><div style="font:500 19px Figtree;margin-top:8px;opacity:.9">Tá na sua biblioteca.</div></div></div>'), INK)
    s3 = story(abs_fill(
        f'<div style="padding:28px 24px;height:100%;display:flex;flex-direction:column;justify-content:space-between;color:{WHITE}">{lg("horizontal", "rosa", 28)}'
        f'<div><div style="font:900 56px/.95 Gabarito;letter-spacing:-.04em">Entra pro<br>meu close.</div>'
        f'<div style="margin-top:18px;display:inline-block;background:rgba(255,255,255,.2);border:1.5px solid rgba(255,255,255,.7);border-radius:12px;padding:9px 16px;font:700 16px Figtree">Link na bio</div></div></div>'), AURORA)
    capa1 = banner(420, 140, POP, lg("horizontal", "rosa", 30), "Seu close, seu preço.", "", "", size=34, deco=True)
    capa2 = banner(420, 105, AURORA, lg("horizontal", "rosa", 26), "Pago no Pix. Liberado na hora.", "", "", size=22, deco=True, deco_cor="rgba(255,255,255,.1)")
    av = "".join(f'<div style="text-align:center"><div style="width:96px;height:96px;border-radius:50%;overflow:hidden;{"border:1px solid " + LINE + ";" if s == "branco" else ""}">{M.tile_svg(s, 96, radius=0, scale=.58)}</div>{cap(s.capitalize())}</div>'
                 for s in ("rosa", "preto", "roxo", "branco"))
    return page("Stories e capas", n, '<div style="display:flex;gap:56px">'
                f'<div><h1>Stories · 9:16</h1><div style="display:flex;gap:22px">{s1}{s2}{s3}</div>{cap("Pop · Preto · Aurora · 1080 × 1920")}</div>'
                f'<div style="flex:1"><h1>Capas e perfil</h1>{capa1}{cap("Capa 3:1 · X, YouTube · 1500 × 500")}'
                f'<div style="margin-top:8px">{capa2}{cap("Capa 4:1 · LinkedIn · 1584 × 396")}</div>'
                f'<div style="display:flex;gap:26px;margin-top:14px">{av}</div></div></div>')


# ---- produto
def phone(inner, w=300, h=620, bg=WHITE):
    return (f'<div style="width:{w}px;height:{h}px;border-radius:40px;background:{bg};border:8px solid #1d1217;box-shadow:0 0 0 2px rgba(20,9,15,.18);position:relative;overflow:hidden;flex:none">'
            f'<div style="position:absolute;left:50%;top:9px;width:78px;height:20px;margin-left:-39px;border-radius:12px;background:#1d1217;z-index:5"></div>{inner}</div>')


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
            em_find = (x < 8 and y < 8) or (x > N - 9 and y < 8) or (x < 8 and y > N - 9)
            if em_find:
                continue
            if rnd.random() < .5:
                cel += f'<rect x="{x * c:.2f}" y="{y * c:.2f}" width="{c + .3:.2f}" height="{c + .3:.2f}"/>'
    for ox, oy in ((0, 0), (N - 7, 0), (0, N - 7)):
        cel += (f'<rect x="{ox * c:.2f}" y="{oy * c:.2f}" width="{7 * c:.2f}" height="{7 * c:.2f}"/>'
                f'<rect x="{(ox + 1) * c:.2f}" y="{(oy + 1) * c:.2f}" width="{5 * c:.2f}" height="{5 * c:.2f}" fill="#fff"/>'
                f'<rect x="{(ox + 2) * c:.2f}" y="{(oy + 2) * c:.2f}" width="{3 * c:.2f}" height="{3 * c:.2f}"/>')
    return f'<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" fill="{INK}">{cel}</svg>'


def tabbar(ativo, dark=False):
    cor = lambda i: (PINK if dark else DEEP) if i == ativo else ("rgba(255,255,255,.55)" if dark else MUTED)
    its = "".join(f'<div style="color:{cor(i)}">{icone(d, 24)}</div>' for i, d in enumerate((HOME, LIB, USER)))
    return (f'<div style="position:absolute;left:0;right:0;bottom:0;height:64px;display:flex;justify-content:space-around;align-items:center;'
            f'background:{"#1d1217" if dark else "#fff"};border-top:1px solid {"rgba(255,255,255,.12)" if dark else LINE}">{its}</div>')


def tela_splash():
    return phone(abs_fill(f'<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px">'
                          f'{lg("empilhado", "preto", 150)}<div style="font:500 15px Figtree;color:rgba(255,255,255,.8)">Seu close, seu preço.</div></div>'), bg=AURORA)


def tela_criador():
    def pack(titulo, preco, grad):
        return (f'<div style="flex:1"><div style="height:118px;border-radius:14px;background:{grad};position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#fff">'
                f'<div style="background:rgba(20,9,15,.35);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center">{icone(LOCK, 18, "#fff")}</div></div>'
                f'<div style="font:800 14px Gabarito;margin-top:7px">{titulo}</div><div style="font:600 13px Figtree;color:{DEEP}">{preco}</div></div>')
    return phone(
        f'<div style="height:150px;background:{POP};position:relative;overflow:hidden">{fantasma(220, -50, -80)}</div>'
        f'<div style="padding:0 18px;margin-top:-44px;position:relative">'
        f'<div style="width:92px;height:92px;border-radius:50%;background:{POP};padding:3px"><div style="width:100%;height:100%;border-radius:50%;background:#fff;padding:3px">'
        f'<div style="width:100%;height:100%;border-radius:50%;background:{SOFT};display:flex;align-items:center;justify-content:center;font:900 34px Gabarito;color:{DEEP}">M</div></div></div>'
        f'<div style="font:900 26px/1.1 Gabarito;letter-spacing:-.03em;margin-top:10px">Marina Alves</div>'
        f'<div style="font:500 13px Figtree;color:{MUTED};margin-top:3px">@marinaalves · 12,4 mil no close</div>'
        f'<div style="margin-top:14px">{btn("Ver ofertas", DEEP, WHITE, 16, "10px 20px")}</div>'
        f'<div style="display:flex;gap:12px;margin-top:20px">{pack("Pack verão", "R$ 29", NEVOA)}{pack("Drop 07", "R$ 19", AURORA)}</div></div>'
        + tabbar(0), bg=CREAM)


def tela_pix():
    return phone(
        f'<div style="padding:46px 22px 0;text-align:center">'
        f'<div style="font:600 14px Figtree;color:{MUTED}">Pack verão · Marina Alves</div>'
        f'<div style="font:900 56px Gabarito;letter-spacing:-.04em;margin:6px 0 18px">R$ 29,00</div>'
        f'<div style="display:inline-block;padding:14px;border-radius:18px;border:1.5px solid {LINE}">{qr(150)}</div>'
        f'<div style="margin-top:20px">{btn("Copiar código Pix", DEEP, WHITE, 17, "13px 28px")}</div>'
        f'<div style="font:500 14px/1.4 Figtree;color:{MUTED};margin-top:16px">Pago no Pix.<br>Liberado na hora.</div></div>')


def tela_biblioteca():
    def item(t, sub, grad, estado):
        return (f'<div style="display:flex;gap:12px;align-items:center;padding:11px 0;border-top:1px solid rgba(255,255,255,.12)">'
                f'<div style="width:58px;height:58px;border-radius:12px;background:{grad};flex:none;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center">{icone(PLAY, 22, "#fff")}</div>'
                f'<div style="flex:1"><div style="font:800 16px Gabarito;color:#fff">{t}</div><div style="font:500 12px Figtree;color:rgba(255,255,255,.65);margin:2px 0 5px">{sub}</div>{estado}</div></div>')
    return phone(
        f'<div style="padding:46px 20px 0;color:#fff"><div style="font:900 30px Gabarito;letter-spacing:-.03em;margin-bottom:12px">Sua biblioteca</div>'
        + item("Pack verão", "Marina Alves · 24 itens", POP, chip("Liberado", LAV, INK, 11))
        + item("Drop 07", "Marina Alves · 8 itens", PURPLE, chip("Liberado", LAV, INK, 11))
        + item("Bastidores", "Caio Lima · 12 itens", PINK, chip("Novo", SOFT, INK, 11))
        + item("Pack noite", "Caio Lima · 6 itens", "#3a2630", chip("Liberado", LAV, INK, 11))
        + '</div>' + tabbar(1, True), bg=INK)


def p_produto(n):
    tels = [(tela_splash(), "Splash · Aurora"), (tela_criador(), "Página do criador"), (tela_pix(), "Pagamento no Pix"), (tela_biblioteca(), "Biblioteca do fã")]
    return page("Produto", n, '<h1 style="margin-bottom:12px">App e produto</h1><div style="display:flex;justify-content:space-between">'
                + "".join(f'<div>{t}{cap(c)}</div>' for t, c in tels) + '</div>', pad="padding-top:80px")


def p_identidade_digital(n):
    cel = '<div style="width:52px;height:52px;border-radius:13px;background:rgba(255,255,255,.2)"></div>'
    home = phone(abs_fill(
        f'<div style="padding:60px 20px 0;display:grid;grid-template-columns:repeat(4,52px);gap:20px 14px;justify-content:center;color:#fff">'
        f'{cel * 8}'
        f'<div style="text-align:center"><div style="width:52px;height:52px;border-radius:13px;overflow:hidden">{M.tile_svg("rosa", 52, radius=0)}</div>'
        f'<div style="font:600 10px Figtree;margin-top:4px">clozzy</div></div>{cel * 11}</div>'
        f'<div style="position:absolute;left:14px;right:14px;bottom:14px;height:76px;border-radius:28px;background:rgba(255,255,255,.2)"></div>'), w=300, h=620, bg=AURORA)
    fav = M.tile_svg("rosa", 16, radius=4, scale=.74, small=True)
    nav = (f'<div style="display:flex;align-items:center;justify-content:space-between;padding:0 36px;height:72px">{lg("horizontal", "branco", 30)}'
           f'<div style="display:flex;gap:14px;align-items:center"><span style="font:700 16px Figtree">Entrar</span>{btn("Criar meu close", DEEP, WHITE, 15, "10px 20px")}</div></div>')
    hero = (f'<div style="display:flex;padding:34px 36px;gap:30px;align-items:center"><div style="flex:1">'
            f'<div style="font:900 72px/.94 Gabarito;letter-spacing:-.045em">Seu close,<br>seu preço.</div>'
            f'<div style="font:500 20px Figtree;margin:16px 0 22px;color:{MUTED}">Pago no Pix. Liberado na hora.</div>{btn("Criar meu close", DEEP, WHITE, 19)}</div>'
            f'<div style="width:330px;height:270px;border-radius:24px;background:{POP};position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center">{fantasma(300, -70, -90)}'
            f'<div style="background:#fff;color:{INK};border-radius:18px;padding:18px 20px;width:230px;position:relative">'
            f'<div style="font:800 18px Gabarito">Pack verão</div><div style="font:500 13px Figtree;color:{MUTED}">Marina Alves</div>'
            f'<div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px"><span style="font:900 32px Gabarito;letter-spacing:-.03em">R$ 29</span>{chip("Pix")}</div></div></div></div>')
    browser = (f'<div style="width:900px;border-radius:16px;overflow:hidden;border:1px solid {LINE};background:{CREAM};box-shadow:0 18px 40px -22px rgba(20,9,15,.35)">'
               f'<div style="background:#ece6e1;height:42px;display:flex;align-items:flex-end;padding:0 14px;gap:10px">'
               f'<div style="background:{CREAM};border-radius:10px 10px 0 0;padding:8px 14px;display:flex;align-items:center;gap:8px;font:600 13px Figtree">{fav}clozzy</div></div>'
               f'<div style="display:flex;gap:8px;padding:8px 14px;background:{CREAM};border-bottom:1px solid {LINE}"><div style="flex:1;background:#fff;border-radius:99px;padding:6px 14px;font:500 13px Figtree;color:{MUTED}">clozzy.com/marina</div></div>'
               f'{nav}{hero}</div>')
    tamanhos = "".join(f'<div style="text-align:center"><div style="height:80px;display:flex;align-items:flex-end;justify-content:center">{v}</div>{cap(l)}</div>' for v, l in (
        (M.tile_svg("rosa", 16, radius=4, scale=.74, small=True), "Favicon 16"), (M.tile_svg("rosa", 32, radius=8, scale=.74, small=True), "Favicon 32"),
        (f'<div style="width:72px;height:72px;border-radius:16px;overflow:hidden">{M.tile_svg("rosa", 72, radius=0)}</div>', "Ícone 72"),
        (f'<div style="width:80px;height:80px;border-radius:50%;overflow:hidden">{M.tile_svg("preto", 80, radius=0, scale=.58)}</div>', "Perfil")))
    return page("Ícone e web", n, f'<div style="display:flex;gap:56px;align-items:flex-start"><div>{home}{cap("Ícone na tela inicial · quadrado sem cantos, símbolo a 62%")}</div>'
                f'<div><h1 style="margin-bottom:14px">Web, favicon e perfil</h1>{browser}'
                f'<div style="display:flex;gap:44px;align-items:flex-end;margin-top:16px">{tamanhos}</div></div></div>', pad="padding-top:84px")


def tee(cor, logo, w=300):
    return (f'<div style="position:relative;width:{w}px;height:{w}px"><svg viewBox="0 0 300 300" width="{w}" height="{w}">'
            f'<path d="M105 18 L18 62 L46 126 L78 110 L78 282 L222 282 L222 110 L254 126 L282 62 L195 18 C186 46 114 46 105 18 Z" fill="{cor}" stroke="rgba(20,9,15,.25)" stroke-width="1.5" stroke-linejoin="round"/></svg>'
            f'<div style="position:absolute;left:0;right:0;top:92px;display:flex;justify-content:center">{logo}</div></div>')


def bag(cor, logo, w=300):
    return (f'<div style="position:relative;width:{w}px;height:{int(w * 1.1)}px"><svg viewBox="0 0 300 330" width="{w}" height="{int(w * 1.1)}">'
            f'<path d="M100 96 V60 a50 50 0 0 1 100 0 V96" fill="none" stroke="{cor}" stroke-width="14" stroke-linecap="round"/>'
            f'<path d="M40 90 H260 L274 316 H26 Z" fill="{cor}" stroke="rgba(20,9,15,.25)" stroke-width="1.5" stroke-linejoin="round"/></svg>'
            f'<div style="position:absolute;left:0;right:0;top:140px;display:flex;justify-content:center">{logo}</div></div>')


def p_impressos(n):
    cartao_f = (f'<div style="width:290px;height:180px;border-radius:12px;background:{POP};position:relative;overflow:hidden;box-shadow:0 14px 26px -16px rgba(20,9,15,.5)">{fantasma(250, -60, -80)}'
                f'<div style="position:absolute;left:24px;top:22px">{lg("horizontal", "rosa", 30)}</div></div>')
    cartao_v = (f'<div style="width:290px;height:180px;border-radius:12px;background:#fff;padding:22px 24px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 14px 26px -16px rgba(20,9,15,.5)">'
                f'<div><div style="font:900 24px Gabarito;letter-spacing:-.03em">Marina Alves</div><div style="font:500 13px Figtree;color:{MUTED}">Criadora · @marinaalves</div></div>'
                f'<div style="display:flex;justify-content:space-between;align-items:flex-end"><div style="font:500 12px/1.5 Figtree">clozzy.com/marina<br>marina@clozzy.com</div>{sym(DEEP, DEEP, 38)}</div></div>')
    adesivos = (f'<div style="display:flex;flex-wrap:wrap;gap:22px;justify-content:center;padding:0 24px">'
                + "".join(f'<div style="width:{d}px;height:{d}px;border-radius:50%;background:{b};display:flex;align-items:center;justify-content:center;border:4px solid #fff;box-shadow:0 8px 16px -8px rgba(0,0,0,.5)">{sym(rc, sc, int(d * .62))}</div>'
                          for d, b, rc, sc in ((170, POP, WHITE, WHITE), (130, PINK, WHITE, WHITE), (130, WHITE, DEEP, DEEP), (100, PURPLE, WHITE, WHITE))) + '</div>')
    painel = lambda inner, bg, label, border=False: (
        f'<div style="width:340px"><div style="height:500px;border-radius:24px;background:{bg};display:flex;align-items:center;justify-content:center;{"border:1px solid " + LINE + ";" if border else ""}">{inner}</div>{cap(label)}</div>')
    return page("Impressos e brindes", n, '<h1 style="margin-bottom:14px">Papelaria e merch</h1><div style="display:flex;justify-content:space-between">'
                + painel(f'<div style="position:relative;width:290px;height:330px"><div style="position:absolute;left:0;top:0">{cartao_f}</div><div style="position:absolute;left:0;top:150px">{cartao_v}</div></div>', LAV, "Cartão · frente Pop, verso branco · 85 × 55 mm")
                + painel(tee(INK, lg("empilhado", "preto", 84)), SOFT, "Camiseta preta · logo empilhado")
                + painel(bag(PINK, lg("empilhado", "rosa", 84), 280), CREAM, "Ecobag rosa · logo todo branco", True)
                + painel(adesivos, INK, "Adesivos · símbolo, sempre com a estrela") + '</div>')


def p_kit(n):
    files = [("svg/", "logo horizontal, empilhado, palavra e símbolo nas 4 versões (com e sem placa), em uma cor, corte pequeno, app-icon e favicon · 53 arquivos"),
             ("manual-identidade-clozzy.pdf · .html", "este documento"),
             ("../identidade-nova/fonts/", "Gabarito (nome 650, títulos 700–900) e Figtree (texto, 300–700) · OFL"),
             ("_apresentacao.py", "gerador do manual e dos SVGs com o nome em Gabarito 650"),
             ("../identidade-oficial/", "regras de cor, símbolo e lockup que este manual segue")]
    fmt = [("SVG", "formato de entrega: vetor, sem perda"), ("PDF", "impressão e apresentação"), ("PNG", "exportar do SVG, com fundo transparente")]
    return page("Kit", n, '<div style="display:flex;gap:80px"><div style="flex:1.4"><h1>Arquivos</h1>' + "".join(
        f'<div style="display:flex;gap:26px;padding:16px 0;border-top:1px solid {LINE}"><b style="width:330px;flex:none;font:800 21px Gabarito">{a}</b><span style="font:500 20px/1.35 Figtree">{b}</span></div>' for a, b in files)
        + f'</div><div style="flex:1"><h1>Formatos</h1>' + "".join(
        f'<div style="display:flex;gap:22px;padding:16px 0;border-top:1px solid {LINE};align-items:baseline"><b style="font:900 34px Gabarito;width:90px;color:{DEEP}">{a}</b><span style="font:500 20px/1.35 Figtree">{b}</span></div>' for a, b in fmt)
        + '</div></div>' + '<div style="display:flex;gap:20px;margin-top:40px">' + "".join(
        f'<div style="flex:1">{B.box(lg("horizontal", sv, 44), b, 150, border=sv == "branco")}</div>' for sv, _nm, b, *_r in M.VERSOES) + '</div>')


def p_contracapa(n):
    return page("", n, fantasma(1100, -300, -380) + abs_fill(
        f'<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px">{lg("empilhado", "rosa", 280)}'
        f'<div style="font:500 30px Figtree;letter-spacing:.02em">Seu close, seu preço.</div></div>'), POP, WHITE)


# ------------------------------------------------------------------ montagem
ORDEM = [
    ("Essência", [p_essencia, p_posicionamento]),
    ("Logo", [p_logo, B.p_construcao, p_familia, p_versoes, p_regra, B.p_respiro, B.p_errados]),
    ("Cor", [p_paleta, p_degrade]),
    ("Tipografia", [B.p_tipografia, p_hierarquia]),
    ("Voz", [p_voz]),
    ("Aplicações", [p_divisor, p_banners, p_anuncios, p_feed, p_stories, p_identidade_digital, p_produto, p_impressos]),
    ("Kit", [p_kit]),
]

CSS = """@page{size:1600px 900px;margin:0}
*{box-sizing:border-box}body{margin:0;background:#888;font-family:Figtree}
section{position:relative;width:1600px;height:900px;padding:90px 90px 60px;overflow:hidden;page-break-after:always;margin:0 auto 20px}
.hd{position:absolute;left:90px;right:90px;top:34px;display:flex;justify-content:space-between;font:600 15px Figtree;letter-spacing:.1em;text-transform:uppercase;opacity:.55}
.ft{position:absolute;left:90px;bottom:24px;font:500 13px Figtree;opacity:.45}
h1{font:900 50px/1.05 Gabarito;letter-spacing:-.03em;margin:0 0 20px}
.lead{font:500 22px/1.45 Figtree;margin:0;max-width:1100px;opacity:.85}
.lb{font:500 15px/1.35 Figtree;margin-top:9px;color:rgba(20,9,15,.62)}
svg{overflow:visible}
@media print{body{background:none}section{margin:0}}"""


def build(out_dir=HERE, nome="manual-identidade-clozzy"):
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
    html = (f'<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy — manual de identidade visual</title>'
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

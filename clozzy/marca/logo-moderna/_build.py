#!/usr/bin/env python3
"""Clozzy — rodada 14 “moderna”: página (HTML + PDF) com os 10 conceitos, o grupo de lente e os testes.
Rodar: python3 _moderna.py && python3 _build.py"""
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import _moderna as M  # noqa: E402

f = M.f
PINK, DEEP, PURPLE, INK, CREAM, WHITE = M.PINK, M.DEEP, M.PURPLE, M.INK, M.CREAM, M.WHITE
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
FONTS_DIR = "../logo-final-v3/fonts"
REFS = HERE.parent / "refs"

FONTS = f"""@font-face{{font-family:Gabarito;src:url("{FONTS_DIR}/Gabarito-Variable.ttf");font-weight:400 900}}
@font-face{{font-family:Figtree;src:url("{FONTS_DIR}/Figtree-Variable.ttf");font-weight:300 900}}"""


def sym(slug, fundo="preto", size=200, small=False):
    return M.sym_svg(slug, fundo, size, small=small)


def img(src, w=None, h=None, style=""):
    s = (f"width:{w}px;" if w else "") + (f"height:{h}px;" if h else "")
    return f'<img src="{src}" style="{s}display:block;{style}">'


def data_svg(svg_text):
    return "data:image/svg+xml;utf8," + svg_text.replace("\n", "").replace("#", "%23").replace('"', "'")


def page(title, num, body, bg=WHITE, fg=INK):
    head = (f'<div class="hd" style="color:{fg}"><span>{title}</span><span>{num:02d}</span></div>' if title else "")
    return f'<section style="background:{bg};color:{fg}">{head}{body}</section>'


def conceito_card(slug, nome, w=300, h=300, bg=INK, fundo="preto", size=200, nota=True):
    ideia = M.IDEIA[slug]
    return (f'<div style="width:{w}px">'
            f'<div style="background:{bg};height:{h}px;border-radius:22px;display:flex;align-items:center;justify-content:center">'
            f'{sym(slug, fundo, size)}</div>'
            f'<div style="font:800 24px Gabarito;margin-top:14px">{nome}</div>'
            + (f'<div style="font:500 16px/1.35 Figtree;opacity:.7;margin-top:6px">{ideia}</div>' if nota else "")
            + "</div>")


def escala(slug):
    cells = "".join(f'<div style="text-align:center">{sym(slug, "preto", s, small=s <= 32)}'
                    f'<div class="lb" style="color:rgba(255,255,255,.55)">{s}</div></div>' for s in (64, 32, 24, 16))
    return (f'<div style="background:{INK};border-radius:18px;padding:18px 22px;display:flex;gap:22px;align-items:flex-end">{cells}</div>')


def diagrama():
    """Construção do diafragma: grid, raio da abertura, 5 lâminas e as fendas."""
    g = "".join(f'<line x1="{i}" y1="0" x2="{i}" y2="100" stroke="rgba(20,9,15,.08)" stroke-width=".25"/>'
                f'<line x1="0" y1="{i}" x2="100" y2="{i}" stroke="rgba(20,9,15,.08)" stroke-width=".25"/>'
                for i in range(0, 101, 5))
    guias = (f'<circle cx="50" cy="50" r="43" fill="none" stroke="{PURPLE}" stroke-width=".3" stroke-dasharray="1 1"/>'
             f'<circle cx="50" cy="50" r="21.5" fill="none" stroke="{PURPLE}" stroke-width=".3" stroke-dasharray="1 1"/>'
             f'<circle cx="50" cy="50" r="9.7" fill="none" stroke="{PURPLE}" stroke-width=".3" stroke-dasharray="1 1"/>'
             + M.seams(PURPLE, 5, 48.0, 0.3, rot=-90.0))
    return (f'<svg viewBox="-2 -2 104 104" width="500" height="500">{g}'
            f'<g opacity=".92">{M.ln1_diafragma(DEEP)}</g>{guias}</svg>')


def build():
    pages = []
    n = iter(range(1, 99))
    S = "svg/"
    hero = M.HERO
    hero_nome = M.NOME[hero]

    # 01 capa
    pages.append(page("", 0, f'<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:90px">'
                      f'{sym(hero, "preto", 300)}'
                      f'<div><div style="font:900 86px/1 Gabarito;letter-spacing:-.03em;color:{WHITE}">Logo moderna</div>'
                      f'<div style="font:800 40px/1.1 Gabarito;color:{PINK};margin-top:14px">close friends · lente</div>'
                      f'<div style="font:600 22px Figtree;color:rgba(255,255,255,.65);letter-spacing:.1em;margin-top:26px">RODADA 14 · 10 CONCEITOS · 2026-11-11</div></div></div>', INK, WHITE))

    # 02 leitura das refs
    refs = [("Captura de Tela 2026-11-11 às 16.00.16.png", "16.00 · o selo verde de Close Friends: círculo cheio e estrela branca"),
            ("Captura de Tela 2026-11-11 às 15.59.02.png", "15.59 · as três preferidas: Disco, Crescente e Giro"),
            ("Captura de Tela 2026-11-11 às 15.01.35.png", "15.01 · anel grosso com tracejado só na abertura")]
    rimg = "".join(f'<div style="flex:1"><div style="height:250px;background:{CREAM};border-radius:20px;display:flex;align-items:center;'
                   f'justify-content:center;overflow:hidden"><img src="{(REFS / a).as_uri()}" style="max-height:220px;max-width:92%"></div>'
                   f'<div class="lb">{b}</div></div>' for a, b in refs)
    linhas = [("Palavra-chave", "close friends: o símbolo tem que dizer “grupo fechado”, não “app de vídeo”"),
              ("O que sai", "moldura em volta de tudo, traço fino, elemento sobrando no centro"),
              ("O que entra", "forma mais cheia, recorte de adesivo (vazado em vez de linha), squircle e menos peças"),
              ("A lente", "a abertura de 5 lâminas de um diafragma é uma estrela de 5 pontas: a câmera e o selo no mesmo desenho"),
              ("O que fica", "a estrela, o rosa e o anel de story — nada é jogado fora")]
    bl = "".join(f'<div style="display:flex;gap:22px;padding:13px 0;border-top:1px solid rgba(20,9,15,.12)">'
                 f'<b style="width:170px;font:800 22px Gabarito">{a}</b><span style="font:500 21px/1.35 Figtree">{b}</span></div>' for a, b in linhas)
    pages.append(page("De onde vem", next(n), f'<h1>A marca já era close friends. Faltava dizer com menos peças.</h1>'
                      f'<div class="row" style="gap:24px">{rimg}</div><div style="margin-top:28px">{bl}</div>'))

    # 03–05 grupos
    for grupo, desc, vs in M.GRUPOS:
        cards = "".join(conceito_card(s, nm, w=1380 // len(vs) - 24, h=300 if len(vs) < 4 else 280,
                                      size=200 if len(vs) < 4 else 180) for s, nm, _fn in vs)
        pages.append(page(f"Conceitos · {grupo.lower()}", next(n),
                          f'<h1>{grupo}</h1><p class="lead">{desc}</p>'
                          f'<div class="row" style="gap:24px;margin-top:26px;align-items:flex-start">{cards}</div>'))

    # 06 construção da lente
    espec = [("Grid", "100 × 100, lâminas até r 43"), ("Abertura", "estrela de r 21,5, vale 45%"),
             ("Lâminas", "5, cantos macios (contorno 2,0 com junção redonda)"), ("Fendas", "vão de 3,6 no raio da abertura"),
             ("Giro", "ponta da estrela para cima (−90°); o obturador usa −68° para parecer meio fechado"),
             ("Corte pequeno", "≤ 32 px: vão 4,6 e abertura 23 — a fenda não some")]
    sp = "".join(f'<div style="display:flex;justify-content:space-between;gap:20px;padding:11px 0;border-top:1px solid rgba(20,9,15,.12);'
                 f'font:500 20px Figtree"><b>{a}</b><span style="text-align:right">{b}</span></div>' for a, b in espec)
    pages.append(page("Lente · construção", next(n),
                      f'<div class="row" style="gap:70px;align-items:center;height:100%">{diagrama()}'
                      f'<div style="flex:1"><h1>O diafragma</h1>'
                      f'<p class="lead">Cinco lâminas em volta de um furo: o furo é a estrela. Nada é desenhado “em cima” do símbolo — '
                      f'a estrela aparece porque as lâminas param nela, e some quando a lente fecha.</p>{sp}'
                      f'<div class="row" style="gap:18px;margin-top:26px">{escala("ln1-diafragma")}{escala(hero)}</div></div></div>'))

    # 07 teste pequeno
    cells = "".join(f'<div style="width:250px"><div style="font:800 20px Gabarito;margin-bottom:10px">{M.NOME[s]}</div>{escala(s)}</div>'
                    for s, _nm, _fn in M.CONCEITOS)
    pages.append(page("Teste pequeno", next(n), '<h1>16, 24, 32 e 64 px</h1>'
                      '<p class="lead">O que não lê em 24 px não entra. Nos conceitos com tracejado ou lâmina, o corte pequeno fecha a forma: '
                      'menos traços, vão maior e, na lente no anel, a estrela cheia de volta.</p>'
                      f'<div class="row" style="gap:20px;flex-wrap:wrap;margin-top:24px">{cells}</div>'))

    # 08 cor no conceito recomendado
    combos = "".join(f'<div style="width:244px"><div style="background:{b};height:190px;border-radius:20px;display:flex;align-items:center;'
                     f'justify-content:center;{"border:1px solid rgba(20,9,15,.12)" if b in (WHITE, CREAM) else ""}">{sym(hero, s, 130)}</div>'
                     f'<div class="lb">{nm}</div></div>' for s, nm, b, _rc, _sc in M.FUNDOS)
    pages.append(page("Cor", next(n), f'<h1>{hero_nome} nos oito fundos</h1>'
                      '<p class="lead">As regras da v3 continuam: no preto o anel é rosa e a estrela branca; no rosa, no Deep e no roxo tudo branco; '
                      'no claro, Pink Deep. Nada preto sobre o rosa, e rosa e roxo nunca um sobre o outro.</p>'
                      f'<div class="row" style="gap:20px;flex-wrap:wrap;margin-top:24px">{combos}</div>'))

    # 09 lockups e app
    lk = "".join(f'<div style="flex:1"><div style="background:{b};border-radius:20px;height:{h}px;display:flex;align-items:center;'
                 f'justify-content:center;{"border:1px solid rgba(20,9,15,.12)" if b in (WHITE, CREAM) else ""}">'
                 f'{img(S + name, h=hh)}</div><div class="lb">{lab}</div></div>'
                 for name, b, h, hh, lab in ((f"{hero}-horizontal-preto.svg", INK, 190, 86, "Horizontal · preto"),
                                             (f"{hero}-horizontal-cream.svg", CREAM, 190, 86, "Horizontal · cream"),
                                             (f"{hero}-empilhado-rosa.svg", PINK, 190, 150, "Empilhado · rosa")))
    tiles = "".join(f'<div style="text-align:center">{img(S + f"{hero}-app.svg", w=w)}<div class="lb">{lab}</div></div>'
                    for w, lab in ((150, "App 1024"), (72, "72"), (48, "48")))
    pages.append(page("Lockup e app", next(n), f'<h1>Palavra sempre separada</h1>'
                      f'<div class="row" style="gap:22px;align-items:flex-start">{lk}</div>'
                      f'<div class="row" style="gap:50px;align-items:flex-end;margin-top:34px">{tiles}'
                      f'<div style="flex:1;font:500 21px/1.4 Figtree;opacity:.8">O símbolo nunca encosta no <b>c</b> de clozzy. '
                      f'No ícone de app ele ocupa 62% do quadrado; na foto de perfil, 58%, porque a rede corta em círculo.</div></div>'))

    # 10 recomendação
    rec = [(hero, "Para seguir", "Mantém o anel de story já aprovado e troca a estrela cheia pela abertura da lente: é a evolução sem recomeçar."),
           ("ln1-diafragma", "Para app e avatar", "Forma cheia, lê em 16 px e vira ícone sem moldura. O mais atual dos dez."),
           ("cf2-duo", "Para campanha", "Dois discos sobrepostos dizem “close friends” sem nenhum texto.")]
    cards = "".join(f'<div style="flex:1"><div style="background:{INK};height:270px;border-radius:22px;display:flex;align-items:center;'
                    f'justify-content:center">{sym(s, "preto", 190)}</div>'
                    f'<div style="font:800 26px Gabarito;margin-top:14px">{M.NOME[s]} · {lab}</div>'
                    f'<div style="font:500 17px/1.4 Figtree;opacity:.75;margin-top:6px">{why}</div></div>' for s, lab, why in rec)
    pages.append(page("Recomendação", next(n), '<h1>Três que valem virar kit</h1>'
                      f'<div class="row" style="gap:26px;align-items:flex-start">{cards}</div>'
                      '<p class="lead" style="margin-top:30px">Escolhido um, o próximo passo é o kit completo: manual, lockups nos oito fundos, '
                      'PNGs, peças de rede e favicon — no mesmo molde do <b>logo-final-v3</b>.</p>'))

    css = FONTS + """
@page{size:1600px 900px;margin:0}
*{box-sizing:border-box}body{margin:0;background:#888}
section{position:relative;width:1600px;height:900px;padding:90px 90px 60px;overflow:hidden;page-break-after:always;margin:0 auto 20px}
.hd{position:absolute;left:90px;right:90px;top:34px;display:flex;justify-content:space-between;font:600 15px Figtree;letter-spacing:.1em;text-transform:uppercase;opacity:.55}
h1{font:900 52px/1.05 Gabarito;letter-spacing:-.03em;margin:0 0 20px}
.lead{font:500 22px/1.45 Figtree;margin:0;max-width:1150px;opacity:.85}
.row{display:flex}.lb{font:500 15px/1.35 Figtree;margin-top:10px;color:rgba(20,9,15,.6)}
@media print{body{background:none}section{margin:0}}"""
    html = (f'<!DOCTYPE html><html><head><meta charset="utf-8"><title>Clozzy — logo moderna (close friends · lente)</title>'
            f'<style>{css}</style></head><body>{"".join(pages)}</body></html>')
    out = HERE / "logo-moderna-clozzy.html"
    out.write_text(html)
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
                    "--force-device-scale-factor=1", f"--print-to-pdf={HERE / 'logo-moderna-clozzy.pdf'}",
                    "--no-pdf-header-footer", "--virtual-time-budget=4000", out.as_uri()], check=True, capture_output=True)
    return len(pages)


if __name__ == "__main__":
    print("svg", M.build())
    print("página", build(), "págs.")

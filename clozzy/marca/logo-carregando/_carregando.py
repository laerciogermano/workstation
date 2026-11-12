#!/usr/bin/env python3
"""Clozzy — rodada 14: o símbolo “05 · Carregando” da rodada 13 (logo-stories) virando marca.
Anel de story carregando: traços que crescem dando a volta (2→30°) até virar linha cheia, estrela da final v3 no meio.
Aqui: corte pequeno, 12 variações de cor, lockups (palavra Gabarito 800 sempre AO LADO/EMBAIXO, nunca fundida),
ícones de app, versão animada e elemento gráfico (o tracejado crescente).
Rodar: python3 _carregando.py → svg/"""
import math, shutil, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
MARCA = HERE.parent
sys.path.insert(0, str(MARCA / "logo-stories"))
sys.path.insert(0, str(MARCA / "identidade-nova"))
import _stories as S  # noqa: E402
import _logos as LG  # noqa: E402

OUT = HERE / "svg"
PINK, DEEP, PURPLE, INK, CREAM, WHITE = S.PINK, S.DEEP, S.PURPLE, S.INK, S.CREAM, S.WHITE
f, arc, star = S.f, S.arc, S.star

# ---------- geometria (igual ao s05 da rodada 13) ---------------------------------------------------
W, RM, GAP, LENS = 8.0, 41.0, 9.0, [2, 4, 7, 11, 16, 22, 30]
W_SM, LENS_SM, GAP_SM = 11.0, [8, 18, 34], 14.0     # corte pequeno (≤ 32 px): 3 traços, anel mais grosso
STAR_FIT = 22.0


def ring(dash_c, line_c, small=False):
    w, lens, gap = (W_SM, LENS_SM, GAP_SM) if small else (W, LENS, GAP)
    rm = 45 - w / 2 if small else RM
    cap = math.degrees(w / rm)
    a, out = -90.0 + gap / 2, []
    for L in lens:
        out.append(arc(dash_c, w, rm, a, a + L + cap))
        a += L + cap + gap
    out.append(arc(line_c, w, rm, a, 270 - gap / 2))
    return "".join(out)


_uid = [0]


def mark(v, small=False, spin=False):
    """Miolo SVG (grid 100) para a variação de cor `v`. spin=True: o anel gira (CSS .spin / SMIL na exportação)."""
    dash_c, line_c, star_c = v["dash"], v["line"], v["star"]
    defs = ""
    if v.get("grad"):
        _uid[0] += 1
        gid = f"cg{_uid[0]}"
        g0, g1 = v["grad"]
        defs = (f'<defs><linearGradient id="{gid}" x1="1" y1="0" x2="0" y2=".3">'
                f'<stop offset="0" stop-color="{g0}"/><stop offset="1" stop-color="{g1}"/></linearGradient></defs>')
        dash_c = line_c = f"url(#{gid})"
    cls = ' class="ring"' if spin else ""
    return f'{defs}<g{cls}>{ring(dash_c, line_c, small)}</g>' + star(star_c, STAR_FIT if not small else 23.5)


# ---------- cores -----------------------------------------------------------------------------------
# slug, nome, fundo, traços, linha, estrela, palavra, nota
_V = [
    ("preto", "Preto · principal", INK, PINK, PINK, WHITE, WHITE, "A versão principal: anel rosa, estrela e palavra brancas."),
    ("preto-bicolor", "Preto · bicolor", INK, WHITE, PINK, WHITE, WHITE, "Os traços chegam brancos e viram a linha rosa: o story “acendendo”."),
    ("preto-degrade", "Preto · degradê", INK, None, None, WHITE, WHITE, "Deep nos traços pequenos até Rosa na linha. Só no digital."),
    ("rosa", "Rosa · tudo branco", PINK, WHITE, WHITE, WHITE, WHITE, "No rosa, tudo branco."),
    ("deep", "Pink Deep · tudo branco", DEEP, WHITE, WHITE, WHITE, WHITE, "Mais sóbrio que o rosa. Bom para impressos."),
    ("roxo", "Roxo · tudo branco", PURPLE, WHITE, WHITE, WHITE, WHITE, "Roxo com marca branca. Nunca rosa sobre roxo."),
    ("cream", "Cream", CREAM, DEEP, DEEP, DEEP, INK, "Fundo claro quente: símbolo Deep, palavra ink."),
    ("branco", "Branco", WHITE, DEEP, DEEP, DEEP, INK, "Fundo branco: símbolo Deep, palavra ink."),
    ("branco-pink", "Branco · rosa vivo", WHITE, PINK, PINK, PINK, INK, "Rosa #FF0065 para telas, onde ele brilha mais que o Deep."),
    ("cream-estrela-ink", "Cream · estrela ink", CREAM, DEEP, DEEP, INK, INK, "Anel Deep e estrela ink: a estrela pesa mais que o anel."),
    ("mono-ink", "Uma cor · ink", WHITE, INK, INK, INK, INK, "Carimbo, fax, gravação: uma cor só, escura."),
    ("mono-branco", "Uma cor · branco", INK, WHITE, WHITE, WHITE, WHITE, "Vazado em branco, para fotos e fundos escuros."),
]
VARS = [dict(slug=a, name=b, bg=c, dash=d, line=e, star=g, word=h, note=i,
             grad=(DEEP, PINK) if a == "preto-degrade" else None) for a, b, c, d, e, g, h, i in _V]
V = {v["slug"]: v for v in VARS}


# ---------- palavra + lockups ------------------------------------------------------------------------
WD, WW, LH, XH, YD = LG.wordmark_paths()      # unidades de fonte (1000), linha de base em y = 0


def lockup_body(v, vertical=False, spin=False):
    """Devolve (miolo, largura, altura). Símbolo = 90 de diâmetro. Horizontal: anel = 1,4 × altura do l, vão 0,35 l.
    Empilhado: palavra com a altura do l = 0,5 do anel, embaixo, centralizada."""
    if not vertical:
        lh = 90 / 1.4
        s = lh / LH
        x0 = 90 + 0.35 * lh
        base = 45 + lh / 2
        w = x0 + WW * s
        word = f'<path transform="translate({f(x0)} {f(base)}) scale({s:.5f})" d="{WD}" fill="{v["word"]}"/>'
        return f'<g transform="translate(-5 -5)">{mark(v, spin=spin)}</g>{word}', w, 90
    lh = 90 * 0.42
    s = lh / LH
    ww = WW * s
    base = 90 + 0.3 * lh + lh
    w = max(90, ww)
    word = f'<path transform="translate({f((w - ww) / 2)} {f(base)}) scale({s:.5f})" d="{WD}" fill="{v["word"]}"/>'
    return (f'<g transform="translate({f((w - 90) / 2 - 5)} -5)">{mark(v, spin=spin)}</g>{word}',
            w, base - YD * s)


def svg_wrap(inner, w, h, bg=None, pad=0, size_w=None, extra=""):
    v0x, v0y, vw, vh = -pad, -pad, w + 2 * pad, h + 2 * pad
    rect = f'<rect x="{f(v0x)}" y="{f(v0y)}" width="{f(vw)}" height="{f(vh)}" fill="{bg}"/>' if bg else ""
    sw = size_w or vw * 4
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(v0x)} {f(v0y)} {f(vw)} {f(vh)}" width="{f(sw)}" '
            f'height="{f(sw * vh / vw)}"><title>Clozzy</title>{extra}{rect}{inner}</svg>\n')


def sym_svg(v, small=False, bg=False, size=256, pad=6, spin=False):
    inner = f'<g transform="translate(-5 -5)">{mark(v, small, spin)}</g>'
    return svg_wrap(inner, 90, 90, v["bg"] if bg else None, pad, size)


def tile_svg(v, size=1024, radius=22.37, scale=0.62):
    o = 50 - 50 * scale
    rx = f' rx="{radius}"' if radius else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="{size}" height="{size}">'
            f'<title>Clozzy</title><rect width="100" height="100"{rx} fill="{v["bg"]}"/>'
            f'<g transform="translate({f(o)} {f(o)}) scale({f(scale)})">{mark(v)}</g></svg>\n')


def animated_svg(v, size=512, dur=2.4):
    """Versão animada (SMIL): o anel gira, a estrela fica parada — o loader do app."""
    m = mark(v, spin=True).replace(
        '<g class="ring">',
        f'<g><animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" '
        f'dur="{dur}s" repeatCount="indefinite"/>', 1)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="{size}" height="{size}">'
            f'<title>Clozzy carregando</title><rect width="100" height="100" fill="{v["bg"]}"/>{m}</svg>\n')


def pattern_row(c, y=0, h=8, gap=6, lens=(2, 5, 10, 18, 30, 48), tail=120):
    """Elemento gráfico: o tracejado crescente em linha reta (divisor, faixa, estampa)."""
    out, x = [], 0.0
    for L in list(lens) + [tail]:
        ww = L + h
        out.append(f'<rect x="{f(x)}" y="{f(y)}" width="{f(ww)}" height="{h}" rx="{f(h / 2)}" fill="{c}"/>')
        x += ww + gap
    return "".join(out), x - gap


def build():
    shutil.rmtree(OUT, ignore_errors=True)
    OUT.mkdir()
    n = 0
    for v in VARS:
        s = v["slug"]
        (OUT / f"simbolo-{s}.svg").write_text(sym_svg(v, bg=True))
        (OUT / f"simbolo-pequeno-{s}.svg").write_text(sym_svg(v, small=True, bg=True, size=64))
        for vert, name in ((False, "horizontal"), (True, "empilhado")):
            inner, w, h = lockup_body(v, vert)
            (OUT / f"logo-{name}-{s}.svg").write_text(svg_wrap(inner, w, h, v["bg"], pad=14, size_w=1200))
            n += 1
        n += 2
    for s in ("rosa", "preto", "roxo", "deep", "cream"):
        (OUT / f"app-icon-{s}.svg").write_text(tile_svg(V[s]))
        (OUT / f"animado-{s}.svg").write_text(animated_svg(V[s]))
        n += 2
    # transparentes (sem fundo) para usar em cima de fotos
    for s in ("preto", "branco", "mono-branco"):
        (OUT / f"simbolo-{s}-transparente.svg").write_text(sym_svg(V[s]))
        n += 1
    return n


if __name__ == "__main__":
    print("ok", build(), "svgs")

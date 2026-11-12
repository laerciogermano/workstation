#!/usr/bin/env python3
"""Clozzy — identidade “Estrela macia”.

Símbolo = anel do logo-carregando (rodada 14) + a Estrela macia da rodada 15 (logo-glifos, g01) no lugar da estrela
central, um pouco menor que ela: inscrita no círculo de raio 20 (o carregando usa 22).
Duas formas: ÍCONE (só a estrela) e SÍMBOLO (estrela + anel). Seis variações de anel, sempre no estilo do arco do
carregando. Cores: só rosa #FF0065, Pink Deep #E0005A, roxo #7C48C4, preto #000 e branco #fff — sem creme, sem ink.
Regras: no preto, anel rosa + estrela branca; no rosa/Deep/roxo tudo branco; no branco, Pink Deep; nada preto no
rosa; rosa e roxo nunca um sobre o outro; palavra Gabarito 800 sempre separada do símbolo.

Rodar: python3 _marca.py → svg/ ; depois python3 _build.py → HTML + PDF."""
import math, shutil, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
MARCA = HERE.parent
sys.path.insert(0, str(MARCA / "logo-carregando"))
import _carregando as C  # noqa: E402

S, LG, f, arc = C.S, C.LG, C.f, C.arc
PINK, DEEP, PURPLE = "#FF0065", "#E0005A", "#7C48C4"
BLACK, WHITE = "#000000", "#FFFFFF"

# ---------- Estrela macia (g01 da rodada 15) ----------------------------------------------------------
# No glifo: polígono R 40, vale 0,55, giro −8°, contorno 15 com junta redonda (= 0,375 R), centro 3 abaixo (= 0,075 R).
RATIO, ROT, STROKE_K, DROP_K = 0.55, -8.0, 15 / 40, 3 / 40
REACH = 1 + STROKE_K / 2            # alcance das pontas com o canto redondo = R · REACH
STAR_FIT = 20.0                     # dentro do anel (carregando: 22); “diminua só um pouco” (2026-11-11)
STAR_FIT_SM = 21.6                  # corte pequeno (carregando: 23,5)
ICON_FIT = 40.5                     # ícone, só a estrela (era 44)


def P(a, r, cx=50, cy=50):
    t = math.radians(a)
    return cx + r * math.cos(t), cy + r * math.sin(t)


# Ponto da câmera: um pontinho no vão entre a ponta de cima e a da direita, como a lente/flash do celular.
DOT_A, DOT_RK, DOT_SK = -60.0, 1.30, 0.14        # ângulo, distância do centro (× R), raio do ponto (× R)


def macia(c, fit=STAR_FIT, cx=50, cy=50, dot=True):
    """Estrela macia inscrita num círculo de raio `fit` centrado em (cx, cy), com o ponto da câmera."""
    R = fit / REACH
    cy = cy + DROP_K * R
    pts = " ".join(f"{f(x)},{f(y)}" for x, y in
                   (P(-90 + ROT + k * 36, R if k % 2 == 0 else R * RATIO, cx, cy) for k in range(10)))
    out = (f'<polygon points="{pts}" fill="{c}" stroke="{c}" stroke-width="{f(STROKE_K * R)}" '
           f'stroke-linejoin="round"/>')
    if dot:
        dx, dy = P(DOT_A, DOT_RK * R, cx, cy)
        out += f'<circle cx="{f(dx)}" cy="{f(dy)}" r="{f(DOT_SK * R)}" fill="{c}"/>'
    return out


# ---------- anéis (estilo do arco do carregando) --------------------------------------------------------
W, RM, GAP, LENS = C.W, C.RM, C.GAP, C.LENS          # 8 · 41 · 9° · 2→30°


def _dashes(dash_c, line_c, w, rm, lens, gap, start=-90.0, end=270.0):
    cap = math.degrees(w / rm)
    a, out = start + gap / 2, []
    for L in lens:
        out.append(arc(dash_c, w, rm, a, a + L + cap))
        a += L + cap + gap
    out.append(arc(line_c, w, rm, a, end - gap / 2))
    return "".join(out)


def r_carregando(d, l):
    """01 · o anel do logo-carregando: 7 traços que crescem (2→30°) e fecham em linha cheia."""
    return _dashes(d, l, W, RM, LENS, GAP)


def r_tres(d, l):
    """02 · só 3 traços (o corte pequeno do carregando, aqui no tamanho grande): mais calmo."""
    return _dashes(d, l, W, RM, [6, 14, 28], 11)


def r_aberto(d, l):
    """03 · arco cheio com uma abertura no topo: o story quase completo, sem traços."""
    return arc(l, W, RM, -90 + 20, 270 - 20)


def r_cheio(d, l):
    """04 · anel inteiro: o story visto, o close fechado."""
    return arc(l, W, RM, 0, 360)


def r_segmentos(d, l):
    """05 · cinco segmentos iguais: os stories do dia."""
    out, n, g = [], 5, 12
    for k in range(n):
        a = -90 + k * 360 / n + g / 2
        out.append(arc(l, W, RM, a, a + 360 / n - g))
    return "".join(out)


def r_grosso(d, l):
    """06 · o carregando com anel mais grosso (11) e 5 traços: mais peso para ícone e avatar."""
    return _dashes(d, l, 11, 45 - 11 / 2, [3, 8, 15, 24, 36], 11)


RINGS = [  # slug, nome, nota, fn
    ("carregando", "Carregando", "O anel do logo-carregando como está: 7 traços crescendo até a linha.", r_carregando),
    ("tres-tracos", "Três traços", "Três traços longos e a linha. Mais calmo, lê bem pequeno.", r_tres),
    ("aberto", "Arco aberto", "Linha cheia com uma abertura no topo. O story quase completo.", r_aberto),
    ("cheio", "Anel cheio", "O círculo inteiro: o close fechado, o story visto.", r_cheio),
    ("segmentos", "Segmentos", "Cinco partes iguais: os stories do dia.", r_segmentos),
    ("grosso", "Carregando grosso", "Anel 11 e cinco traços: mais peso em ícone e avatar.", r_grosso),
]
RING = {r[0]: r for r in RINGS}
MAIN_RING = "carregando"


def ring_small(d, l):
    return _dashes(d, l, C.W_SM, 45 - C.W_SM / 2, C.LENS_SM, C.GAP_SM)


# ---------- cores ---------------------------------------------------------------------------------------
# slug, nome, fundo, traços, linha, estrela, palavra, estrela do ícone (só estrela), nota
_V = [
    ("preto", "Preto · principal", BLACK, PINK, PINK, WHITE, WHITE, PINK, "Anel rosa, estrela e palavra brancas. Ícone sozinho em rosa."),
    ("preto-bicolor", "Preto · bicolor", BLACK, WHITE, PINK, WHITE, WHITE, WHITE, "Os traços chegam brancos e acendem na linha rosa."),
    ("branco", "Branco", WHITE, DEEP, DEEP, DEEP, BLACK, DEEP, "No claro, tudo Pink Deep e a palavra preta."),
    ("rosa", "Rosa · tudo branco", PINK, WHITE, WHITE, WHITE, WHITE, WHITE, "No rosa, tudo branco. Nada preto."),
    ("deep", "Pink Deep · tudo branco", DEEP, WHITE, WHITE, WHITE, WHITE, WHITE, "Mais sóbrio que o rosa; bom para impresso."),
    ("roxo", "Roxo · tudo branco", PURPLE, WHITE, WHITE, WHITE, WHITE, WHITE, "No roxo, tudo branco. Nunca rosa sobre roxo."),
    ("mono-preto", "Uma cor · preto", WHITE, BLACK, BLACK, BLACK, BLACK, BLACK, "Carimbo, gravação, fax."),
    ("mono-branco", "Uma cor · branco", BLACK, WHITE, WHITE, WHITE, WHITE, WHITE, "Vazado branco sobre foto ou preto."),
]
VARS = [dict(slug=a, name=b, bg=c, dash=d, line=e, star=g, word=h, icon=i, note=j) for a, b, c, d, e, g, h, i, j in _V]
V = {v["slug"]: v for v in VARS}


def mark(v, ring=MAIN_RING, small=False):
    """Símbolo: anel + estrela macia (grid 100). ring=None → só a estrela (ícone), maior para ocupar o grid."""
    if ring is None:
        return macia(v["icon"], fit=ICON_FIT)
    if small:
        return ring_small(v["dash"], v["line"]) + macia(v["star"], STAR_FIT_SM)
    return RING[ring][3](v["dash"], v["line"]) + macia(v["star"], STAR_FIT)


# ---------- palavra + lockups (mesma régua do carregando) ------------------------------------------------
WD, WW, LH, XH, YD = C.WD, C.WW, C.LH, C.XH, C.YD


def lockup_body(v, ring=MAIN_RING, vertical=False):
    inner = mark(v, ring)
    if not vertical:
        lh = 90 / 1.4
        s = lh / LH
        x0 = 90 + 0.35 * lh
        base = 45 + lh / 2
        word = f'<path transform="translate({f(x0)} {f(base)}) scale({s:.5f})" d="{WD}" fill="{v["word"]}"/>'
        return f'<g transform="translate(-5 -5)">{inner}</g>{word}', x0 + WW * s, 90
    lh = 90 * 0.42
    s = lh / LH
    ww = WW * s
    base = 90 + 0.3 * lh + lh
    w = max(90, ww)
    word = f'<path transform="translate({f((w - ww) / 2)} {f(base)}) scale({s:.5f})" d="{WD}" fill="{v["word"]}"/>'
    return f'<g transform="translate({f((w - 90) / 2 - 5)} -5)">{inner}</g>{word}', w, base - YD * s


def svg_wrap(inner, w, h, bg=None, pad=0, size_w=None):
    v0x, v0y, vw, vh = -pad, -pad, w + 2 * pad, h + 2 * pad
    rect = f'<rect x="{f(v0x)}" y="{f(v0y)}" width="{f(vw)}" height="{f(vh)}" fill="{bg}"/>' if bg else ""
    sw = size_w or vw * 4
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(v0x)} {f(v0y)} {f(vw)} {f(vh)}" width="{f(sw)}" '
            f'height="{f(sw * vh / vw)}"><title>Clozzy</title>{rect}{inner}</svg>\n')


def sym_svg(v, ring=MAIN_RING, small=False, bg=False, size=256, pad=6):
    inner = f'<g transform="translate(-5 -5)">{mark(v, ring, small)}</g>'
    return svg_wrap(inner, 90, 90, v["bg"] if bg else None, pad, size)


def lockup_svg(v, ring=MAIN_RING, vertical=False, bg=True, pad=18):
    inner, w, h = lockup_body(v, ring, vertical)
    return svg_wrap(inner, w, h, v["bg"] if bg else None, pad)


def tile_svg(v, ring=MAIN_RING, size=1024, radius=22.37, scale=None):
    scale = scale or (0.62 if ring else 0.6)
    o = 50 - 50 * scale
    rx = f' rx="{radius}"' if radius else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="{size}" height="{size}">'
            f'<title>Clozzy</title><rect width="100" height="100"{rx} fill="{v["bg"]}"/>'
            f'<g transform="translate({f(o)} {f(o)}) scale({f(scale)})">{mark(v, ring)}</g></svg>\n')


def animated_svg(v, size=512, dur=2.4):
    """Loader: o anel gira, a estrela macia fica parada."""
    ring = RING[MAIN_RING][3](v["dash"], v["line"])
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="{size}" height="{size}">'
            f'<title>Clozzy carregando</title><rect width="100" height="100" fill="{v["bg"]}"/>'
            f'<g><animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" '
            f'dur="{dur}s" repeatCount="indefinite"/>{ring}</g>{macia(v["star"], STAR_FIT)}</svg>\n')


OUT = HERE / "svg"


def build():
    shutil.rmtree(OUT, ignore_errors=True)
    OUT.mkdir()
    n = 0
    for v in VARS:
        s = v["slug"]
        (OUT / f"icone-{s}.svg").write_text(sym_svg(v, None, bg=True))
        (OUT / f"simbolo-{s}.svg").write_text(sym_svg(v, bg=True))
        (OUT / f"simbolo-pequeno-{s}.svg").write_text(sym_svg(v, small=True, bg=True))
        for kind, ring in (("com-anel", MAIN_RING), ("sem-anel", None)):
            (OUT / f"logo-horizontal-{kind}-{s}.svg").write_text(lockup_svg(v, ring))
            (OUT / f"logo-empilhado-{kind}-{s}.svg").write_text(lockup_svg(v, ring, vertical=True))
        n += 7
    for v in (V["preto"], V["branco"]):
        for slug, *_ in RINGS:
            (OUT / f"anel-{slug}-{v['slug']}.svg").write_text(sym_svg(v, slug, bg=True))
            n += 1
    for s in ("rosa", "preto", "roxo", "deep", "branco"):
        for kind, ring in (("com-anel", MAIN_RING), ("sem-anel", None)):
            (OUT / f"app-icon-{kind}-{s}.svg").write_text(tile_svg(V[s], ring))
            n += 1
        (OUT / f"loader-{s}.svg").write_text(animated_svg(V[s]))
        n += 1
    # transparentes, para uso solto
    (OUT / "icone.svg").write_text(sym_svg(V["preto"], None))
    (OUT / "simbolo.svg").write_text(sym_svg(V["branco"]))
    return n + 2


if __name__ == "__main__":
    print("ok", build(), "svgs")

#!/usr/bin/env python3
"""Clozzy 2028 — logos rodada 3: 8 conceitos novos (geometria booleana com shapely) + exploração de cor.
Rodar: python3 _rodada3.py   (gera conceitos/r3-*.svg)"""
import math, sys
from pathlib import Path

from shapely.geometry import Polygon, Point, box
from shapely.ops import unary_union
from shapely import affinity

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "identidade-nova"))
import _logos  # noqa: E402
import _conceitos as R2  # noqa: E402

OUT = HERE / "conceitos"
INK, CREAM, WHITE = "#14090F", "#FFF6F0", "#FFFFFF"

# ------------------------------------------------------------------ paletas (símbolo, fundo do ícone, símbolo no ícone, nome, nota)
PALETTES = {
    "pink":    dict(name="Pink Clozzy", main="#FF0065", tile="#FF0065", on="#FFFFFF", alt="#14090F",
                    note="Equity atual. Ink sobre ele 5,1:1."),
    "batom":   dict(name="Batom", main="#E5132D", tile="#E5132D", on="#FFF6F0", alt="#14090F",
                    note="Vermelho quente, mais adulto e “premium”. Cream sobre ele 4,4:1 (ok p/ símbolo e texto grande)."),
    "laranja": dict(name="Laranja Drop", main="#FF5A1F", tile="#FF5A1F", on="#14090F", alt="#14090F",
                    note="Energia de novidade; ninguém da categoria usa. Ink sobre ele 6,3:1."),
    "verde":   dict(name="Close Verde", main="#00A36C", tile="#00A36C", on="#FFFFFF", alt="#0B2A1F",
                    note="Ecoa a estrela verde do Close Friends e o #1CCE98 do site. Branco 3,3:1 (só símbolo/texto grande). Risco: Privacy é verde."),
    "cobalto": dict(name="Cobalto + Manteiga", main="#2B3BFF", tile="#2B3BFF", on="#FFD84D", alt="#FFD84D",
                    note="Manteiga sobre cobalto 4,8:1; fora do cluster rosa/roxo. Risco: azul lembra OnlyFans."),
    "cereja":  dict(name="Cereja", main="#8C0A35", tile="#8C0A35", on="#FFC2D6", alt="#FFC2D6",
                    note="Vinho + rosa claro: sensual sem neon. Rosa claro sobre vinho 6,3:1."),
    "manteiga": dict(name="Manteiga", main="#14090F", tile="#FFD84D", on="#14090F", alt="#14090F",
                     note="Amarelo de fundo, símbolo ink. Muito legível (14:1); mais “app de varejo”."),
    "cacau":   dict(name="Cacau + Pêssego", main="#3B1F17", tile="#3B1F17", on="#FFB38A", alt="#FFB38A",
                    note="Quente, “cozy” literal. Pêssego sobre cacau 8,7:1. Menos vibrante em feed."),
}


# ------------------------------------------------------------------ geometria
def star_poly(cx, cy, R, ratio=0.48, rot=-90, round_r=None):
    pts = [R2.P(rot + k * 36, R if k % 2 == 0 else R * ratio, cx, cy) for k in range(10)]
    poly = Polygon(pts)
    r = R * 0.1 if round_r is None else round_r
    return poly.buffer(-r, join_style=2).buffer(r, resolution=12) if r else poly


def rrect(x0, y0, x1, y1, r):
    return box(x0 + r, y0 + r, x1 - r, y1 - r).buffer(r, resolution=16)


def ellipse(cx, cy, rx, ry):
    return affinity.scale(Point(cx, cy).buffer(1, resolution=64), rx, ry)


def arc_band(cx, cy, Rm, w, a0, a1, caps=True, n=96):
    pts_o, pts_i = [], []
    for i in range(n + 1):
        a = a0 + (a1 - a0) * i / n
        pts_o.append(R2.P(a, Rm + w / 2, cx, cy))
        pts_i.append(R2.P(a, Rm - w / 2, cx, cy))
    g = Polygon(pts_o + pts_i[::-1])
    if caps:
        g = unary_union([g, Point(*R2.P(a0, Rm, cx, cy)).buffer(w / 2, resolution=16),
                         Point(*R2.P(a1, Rm, cx, cy)).buffer(w / 2, resolution=16)])
    return g


def to_path(geom):
    polys = getattr(geom, "geoms", [geom])
    d = ""
    for p in polys:
        for ring in [p.exterior, *p.interiors]:
            cs = list(ring.coords)[:-1]
            d += "M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in cs) + "Z"
    return d


def body(geom, c):
    return f'<path fill-rule="evenodd" d="{to_path(geom)}" fill="{c}"/>'


# ------------------------------------------------------------------ conceitos
def g_pulseira():
    """Pulseira VIP: a pulseira de quem está na lista."""
    band = ellipse(128, 118, 106, 64).difference(ellipse(128, 118, 82, 42))
    tab = rrect(70, 146, 186, 214, 20)
    return unary_union([band, tab]).difference(star_poly(128, 182, 27))


def g_chave():
    """Chave-estrela: a estrela é a cabeça da chave — acesso."""
    head = star_poly(92, 96, 74).difference(Point(92, 98).buffer(15))
    shaft = rrect(-14, -15, 128, 15, 9)
    teeth = unary_union([rrect(88, 0, 108, 40, 5), rrect(58, 0, 76, 32, 5)])
    key = affinity.translate(affinity.rotate(unary_union([shaft, teeth]), 45, origin=(0, 0)), 120, 124)
    return unary_union([head, key])


def g_mordida():
    """Estrela aberta: um C vazado no coração da estrela."""
    s = star_poly(128, 136, 120, ratio=0.5, round_r=12)
    c = arc_band(128, 140, 22, 18, 45, 315, caps=True)
    return s.difference(c)


def g_abraco():
    """Abraço: ( ★ ) — dois braços em volta da estrela; cozy + close."""
    left = arc_band(128, 128, 96, 30, 125, 235)
    right = arc_band(128, 128, 96, 30, -55, 55)
    return unary_union([left, right, star_poly(128, 128, 50)])


def g_liberado():
    """Liberado: o interruptor ligado — a estrela é o botão."""
    pill = rrect(18, 72, 238, 184, 56)
    knob = Point(182, 128).buffer(44, resolution=32)
    return unary_union([pill.difference(knob), star_poly(182, 129, 30)])


def g_drop():
    """Drop: a caixa abre e a estrela salta."""
    lid = rrect(34, 104, 222, 138, 9)
    base = rrect(48, 146, 208, 228, 12)
    return unary_union([lid, base, star_poly(128, 58, 40)])


def zz_geom(x0=26, x1=230, y0=58, y1=198, w=34, k=50):
    xm = (x0 + x1) / 2
    parts = [rrect(x0, y0, x1, y0 + w, 7), rrect(x0, y1 - w, x1, y1, 7),
             Polygon([(xm - k, y0 + w - 1), (xm, y0 + w - 1), (x0 + k, y1 - w + 1), (x0, y1 - w + 1)]),
             Polygon([(x1 - k, y0 + w - 1), (x1, y0 + w - 1), (xm + k, y1 - w + 1), (xm, y1 - w + 1)])]
    return unary_union(parts)


def g_ingresso_zz():
    """Ingresso zz: o ticket com o zz vazado — produto + nome."""
    t = rrect(18, 58, 238, 198, 22)
    t = t.difference(Point(18, 128).buffer(24)).difference(Point(238, 128).buffer(24))
    zz = affinity.scale(zz_geom(), 0.5, 0.5, origin=(128, 128))
    return t.difference(zz)


def g_o_estrela():
    """o-estrela: o “o” de clozzy vira a estrela dentro do anel (wordmark-led)."""
    ring = Point(128, 128).buffer(108, resolution=64).difference(Point(128, 128).buffer(76, resolution=64))
    return unary_union([ring, star_poly(128, 131, 52)])


CONCEPTS3 = [
    ("r3-i-pulseira", "Pulseira VIP", "Pictorial", "verde",
     "A pulseira de quem está na lista: entrou, tá dentro.", g_pulseira),
    ("r3-j-chave", "Chave-estrela", "Pictorial", "cobalto",
     "A cabeça da chave é a estrela: o exclusivo abre com ela.", g_chave),
    ("r3-k-estrela-aberta", "Estrela aberta", "Abstract / lettermark", "batom",
     "Um c vazado no coração da estrela — clozzy dentro do favorito.", g_mordida),
    ("r3-l-abraco", "Abraço", "Abstract", "laranja",
     "( ★ ) — dois braços em volta da estrela: close + cozy.", g_abraco),
    ("r3-m-liberado", "Liberado", "Pictorial", "cereja",
     "O interruptor ligado: a estrela é o botão de acesso.", g_liberado),
    ("r3-n-drop", "Drop", "Pictorial", "manteiga",
     "A caixa abre e a estrela salta: chegou drop novo.", g_drop),
    ("r3-o-ingresso-zz", "Ingresso zz", "Combination", "pink",
     "Ticket com o zz vazado: une Ingresso (B) e Costura (H).", g_ingresso_zz),
    ("r3-p-o-estrela", "o-estrela", "Wordmark-led", "cacau",
     "O “o” de clozzy vira anel com estrela: o nome carrega o símbolo.", g_o_estrela),
]


# ------------------------------------------------------------------ wordmark com o-estrela
def wordmark_o_estrela(color):
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    font = _logos.load_font()
    gs, cmap, hmtx = font.getGlyphSet(), font.getBestCmap(), font["hmtx"]
    s = 1000 / font["head"].unitsPerEm
    _, _, asc, xh, _ = _logos.wordmark_paths()
    x, out = 0.0, ""
    for ch in "clozzy":
        g = cmap[ord(ch)]
        adv = hmtx[g][0] * s
        if ch == "o":
            r = xh * 0.56
            cx, cy = x + adv / 2, asc - xh / 2
            geom = affinity.scale(g_o_estrela(), r / 108, r / 108, origin=(128, 128))
            geom = affinity.translate(geom, cx - 128, cy - 128)
            out += body(geom, color)
        else:
            pen = SVGPathPen(gs)
            gs[g].draw(TransformPen(pen, (s, 0, 0, -s, x, asc)))
            out += f'<path d="{pen.getCommands()}" fill="{color}"/>'
        x += adv + _logos.TRACK
    return out, x - _logos.TRACK, asc + 190


def build():
    for slug, name, kind, pal, idea, fn in CONCEPTS3:
        g = fn()
        P = PALETTES[pal]
        (OUT / f"{slug}.svg").write_text(R2.svg(body(g, INK), title=f"Clozzy — {name}"))
        (OUT / f"{slug}-color.svg").write_text(R2.svg(body(g, P["main"]), title=f"Clozzy — {name}"))
        (OUT / f"{slug}-white.svg").write_text(R2.svg(body(g, WHITE), title=f"Clozzy — {name}"))
        fnc = (lambda c, g=g: body(g, c))
        (OUT / f"{slug}-lockup-color.svg").write_text(R2.lockup(fnc, P["main"], P["main"] if pal in ("cacau", "manteiga") else INK))
    # wordmark especial
    wm, w, h = wordmark_o_estrela(INK)
    (OUT / "r3-p-o-estrela-wordmark.svg").write_text(R2.svg(wm, w, h, title="clozzy"))
    wm2, *_ = wordmark_o_estrela(PALETTES["cacau"]["main"])
    (OUT / "r3-p-o-estrela-wordmark-color.svg").write_text(R2.svg(wm2, w, h, title="clozzy"))


def app_icon(geom_or_fn, pal):
    P = PALETTES[pal]
    g = geom_or_fn
    inner = body(g, P["on"]) if not callable(g) else g(P["on"])
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" rx="58" fill="{P["tile"]}"/>'
            f'<g transform="translate(40 40) scale(.6875)">{inner}</g></svg>')


if __name__ == "__main__":
    build()
    print("ok", len(CONCEPTS3))

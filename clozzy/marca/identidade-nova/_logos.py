#!/usr/bin/env python3
"""Clozzy 2028 — gera masters SVG (símbolo “Círculo próximo” + wordmark Gabarito 800 em paths).
Rodar: python3 _logos.py  (chamado também por _build.py)"""
import math
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

HERE = Path(__file__).resolve().parent
OUT = HERE / "logos"
OUT.mkdir(exist_ok=True)

PINK = "#FF0065"
INK = "#14090F"
WHITE = "#FFFFFF"
CREAM = "#FFF6F0"

# ---------------------------------------------------------------- símbolo
# Grid 100×100. Anel: raio médio 37, espessura 16 (externo 45 / interno 29).
# Abertura de 54° centrada em −18° (ponta superior-direita da estrela):
# a ponta da estrela aponta para fora do círculo — o exclusivo sai direto pro fã.
CX = CY = 50.0
RM, W = 37.0, 16.0
GAP_C, GAP_HALF = -18.0, 27.0
STAR_R, STAR_RATIO, STAR_ROUND = 20.5, 0.48, 5.0


def _p(a_deg, r, cx=CX, cy=CY):
    a = math.radians(a_deg)
    return cx + r * math.cos(a), cy + r * math.sin(a)


def f(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def ring_path():
    a1 = GAP_C + GAP_HALF          # início (após a abertura), sentido horário
    a2 = GAP_C - GAP_HALF + 360    # fim (antes da abertura)
    ro, ri, cap = RM + W / 2, RM - W / 2, W / 2
    o1, o2 = _p(a1, ro), _p(a2, ro)
    i1, i2 = _p(a1, ri), _p(a2, ri)
    return (
        f"M{f(o1[0])} {f(o1[1])}"
        f"A{f(ro)} {f(ro)} 0 1 1 {f(o2[0])} {f(o2[1])}"
        f"A{f(cap)} {f(cap)} 0 0 1 {f(i2[0])} {f(i2[1])}"
        f"A{f(ri)} {f(ri)} 0 1 0 {f(i1[0])} {f(i1[1])}"
        f"A{f(cap)} {f(cap)} 0 0 1 {f(o1[0])} {f(o1[1])}Z"
    )


def star_points(cx=CX, cy=CY, R=STAR_R, ratio=STAR_RATIO):
    pts = []
    for k in range(10):
        a = -90 + k * 36
        r = R if k % 2 == 0 else R * ratio
        pts.append(_p(a, r, cx, cy))
    return " ".join(f"{f(x)},{f(y)}" for x, y in pts)


def mark_inner(color, star_color=None):
    """Grupo do símbolo no grid 0..100 (sem <svg>)."""
    sc = star_color or color
    return (
        f'<path d="{ring_path()}" fill="{color}"/>'
        f'<polygon points="{star_points()}" fill="{sc}" stroke="{sc}" '
        f'stroke-width="{STAR_ROUND}" stroke-linejoin="round"/>'
    )


def svg(w, h, body, vb=None, title="Clozzy"):
    vb = vb or f"0 0 {f(w)} {f(h)}"
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{f(w)}" height="{f(h)}" '
            f'role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n')


# ---------------------------------------------------------------- wordmark
def load_font():
    tt = TTFont(HERE / "fonts" / "Gabarito-Variable.ttf")
    return instantiateVariableFont(tt, {"wght": 800})


TRACK = -18  # unidades/1000 — aperto óptico do display


def wordmark_paths(text="clozzy"):
    font = load_font()
    upm = font["head"].unitsPerEm
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    hmtx = font["hmtx"]
    s = 1000 / upm
    x = 0.0
    out = []
    for ch in text:
        g = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        tp = TransformPen(pen, (s, 0, 0, -s, x, 0))
        gs[g].draw(tp)
        out.append(pen.getCommands())
        x += hmtx[g][0] * s + TRACK
    width = x - TRACK
    os2 = font["OS/2"]
    asc = max(gs[cmap[ord("l")]]._glyph.yMax if hasattr(gs[cmap[ord("l")]], "_glyph") else 0, 0)
    # alturas reais via bounds
    from fontTools.pens.boundsPen import BoundsPen
    def bounds(c):
        bp = BoundsPen(gs); gs[cmap[ord(c)]].draw(bp); return bp.bounds
    l_b, x_b, y_b = bounds("l"), bounds("x"), bounds("y")
    return " ".join(out), width, l_b[3] * s, x_b[3] * s, y_b[1] * s


def build():
    d, ww, asc, xh, desc = wordmark_paths()
    # wordmark baseline em y = asc (topo do l = 0); desc é negativo
    top, bot = 0.0, asc - desc
    files = {}

    def word(color, ox=0, oy=0, sc=1):
        return (f'<g transform="translate({f(ox)} {f(oy + asc * sc)}) scale({sc})">'
                f'<path d="{d}" fill="{color}"/></g>')

    # -- símbolo
    for name, c, sc in [("mark-pink", PINK, None), ("mark-ink", INK, None), ("mark-white", WHITE, None)]:
        files[name] = svg(100, 100, mark_inner(c, sc), title="Clozzy — símbolo")
    # glyph 16–32px: anel mais grosso, abertura maior, estrela maior (correção óptica)
    global RM, W, GAP_HALF, STAR_R, STAR_ROUND
    saved = RM, W, GAP_HALF, STAR_R, STAR_ROUND
    RM, W, GAP_HALF, STAR_R, STAR_ROUND = 36, 20, 30, 21, 7
    files["glyph-pink"] = svg(100, 100, mark_inner(PINK), title="Clozzy — glyph 16px")
    files["glyph-ink"] = svg(100, 100, mark_inner(INK), title="Clozzy — glyph 16px")
    glyph_inner_white = mark_inner(WHITE)
    RM, W, GAP_HALF, STAR_R, STAR_ROUND = saved

    # -- app icon (squircle 1024 grid em 100) + favicon
    def app(bg, fg):
        return (f'<rect width="100" height="100" rx="23" fill="{bg}"/>'
                f'<g transform="translate(19 19) scale(.62)">{mark_inner(fg)}</g>')
    files["app-icon-pink"] = svg(100, 100, app(PINK, WHITE), title="Clozzy — app icon")
    files["app-icon-ink"] = svg(100, 100, app(INK, PINK), title="Clozzy — app icon dark")
    files["app-icon-cream"] = svg(100, 100, app(CREAM, PINK), title="Clozzy — app icon claro")
    files["favicon"] = svg(32, 32, f'<rect width="32" height="32" rx="8" fill="{PINK}"/>'
                           f'<g transform="translate(4 4) scale(.24)">{glyph_inner_white}</g>',
                           title="Clozzy — favicon")
    files["avatar-social"] = svg(100, 100, f'<circle cx="50" cy="50" r="50" fill="{PINK}"/>'
                                 f'<g transform="translate(22 22) scale(.56)">{mark_inner(WHITE)}</g>',
                                 title="Clozzy — avatar social")

    # -- wordmark só
    for name, c in [("wordmark-ink", INK), ("wordmark-white", WHITE), ("wordmark-pink", PINK)]:
        files[name] = svg(ww, bot, word(c), title="clozzy")

    # -- lockup horizontal: símbolo com diâmetro = 1.3 × altura do “l”, centrado na x-height+asc
    m = asc * 1.3
    gap = asc * 0.28
    my = (asc - m) / 2 + asc * 0.02
    W_ = m + gap + ww
    H_ = bot
    def lock_h(mc, wc, star=None):
        return (f'<g transform="translate(0 {f(my)}) scale({f(m / 100)})">{mark_inner(mc, star)}</g>'
                + word(wc, ox=m + gap))
    vb = f"0 {f(min(0, my))} {f(W_)} {f(H_ - min(0, my))}"
    for name, mc, wc in [("lockup-horizontal", PINK, INK), ("lockup-horizontal-white", WHITE, WHITE),
                         ("lockup-horizontal-reversed", PINK, WHITE), ("lockup-mono-ink", INK, INK),
                         ("lockup-horizontal-on-pink", WHITE, WHITE)]:
        files[name] = svg(W_, H_ - min(0, my), lock_h(mc, wc), vb=vb, title="clozzy")

    # -- lockup empilhado
    ms = ww * 0.42
    sg = asc * 0.42
    SW, SH = ww, ms + sg + bot
    def lock_s(mc, wc):
        return (f'<g transform="translate({f((ww - ms) / 2)} 0) scale({f(ms / 100)})">{mark_inner(mc)}</g>'
                + word(wc, oy=ms + sg))
    files["lockup-stacked"] = svg(SW, SH, lock_s(PINK, INK), title="clozzy")
    files["lockup-stacked-white"] = svg(SW, SH, lock_s(WHITE, WHITE), title="clozzy")

    for k, v in files.items():
        (OUT / f"{k}.svg").write_text(v)
    return {"ww": ww, "asc": asc, "xh": xh, "desc": desc, "files": sorted(files)}


if __name__ == "__main__":
    info = build()
    print(info)

#!/usr/bin/env python3
"""Gera os SVGs dos conceitos de logo RoleGo v2 (conceitos/).

Glifos: Poppins 800 Italic (fontTools) convertidos em curvas; formas próprias (pin, ping, play)
desenhadas em unidades da fonte (y para cima, linha de base 0) e inclinadas 10° como o itálico.
Uso: python3 role-go/marca/logo-v2/_build_conceitos.py
"""
import math, os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(HERE, "../../beta/apps/web/dist/assets/poppins-latin-800-italic-C1L4USJS.woff")
OUT = os.path.join(HERE, "conceitos")
os.makedirs(OUT, exist_ok=True)

font = TTFont(FONT)
GS = font.getGlyphSet()
CMAP = font.getBestCmap()
TAN = math.tan(math.radians(10))
TRACK = -20  # -0.02em, como no manual v1

INK, WHITE, DARK = "#05070F", "#FFFFFF", "#04050B"
VIOLET, CYAN = "#8749FF", "#00E5E5"


# ---------- desenho ----------
class Shape:
    """Uma forma = função que desenha num pen (unidades da fonte, y para cima)."""
    def __init__(self, draw, skew=True, dx=0.0):
        self.draw, self.skew, self.dx = draw, skew, dx

    def to_pen(self, pen):
        t = (1, 0, TAN if self.skew else 0, 1, self.dx, 0)
        self.draw(TransformPen(pen, t))


def glyph(ch, dx=0.0):
    g = CMAP[ord(ch)]
    return Shape(lambda pen, g=g: GS[g].draw(pen), skew=False, dx=dx), GS[g].width


def arc(pen, cx, cy, r, a0, a1, start=True):
    """Arco de círculo de a0 a a1 (graus; anti-horário com y para cima) em cúbicas <= 90°."""
    n = max(1, math.ceil(abs(a1 - a0) / 90))
    step = (a1 - a0) / n
    k = 4 / 3 * math.tan(math.radians(step) / 4)
    pt = lambda a: (cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a)))
    if start:
        pen.moveTo(pt(a0))
    for i in range(n):
        s, e = a0 + i * step, a0 + (i + 1) * step
        (x0, y0), (x3, y3) = pt(s), pt(e)
        rs, re = math.radians(s), math.radians(e)
        c1 = (x0 - k * r * math.sin(rs), y0 + k * r * math.cos(rs))
        c2 = (x3 + k * r * math.sin(re), y3 - k * r * math.cos(re))
        pen.curveTo(c1, c2, (x3, y3))


def circle(pen, cx, cy, r, ccw=True):
    arc(pen, cx, cy, r, 0, 360 if ccw else -360)
    pen.closePath()


def pin_outer(pen, cx, cy, R, tip_y):
    d = cy - tip_y
    th = math.degrees(math.acos(R / d))
    a_right, a_left = -90 + th, -90 - th + 360
    arc(pen, cx, cy, R, a_right, a_left)
    pen.lineTo((cx, tip_y))
    pen.closePath()


# Medidas do "o" da Poppins 800 Italic (desinclinado): centro y 280, externo r 288, miolo r 119
O_CY, O_R, O_r = 280.5, 288, 119
# Pin no wordmark: topo da cabeça na altura do G (712 + overshoot), ponta pouco abaixo da base (feedback 08/11)
PIN_CY = 715 - O_R
PIN_TIP = PIN_CY - 510


def pin_o(cx, tip_y=PIN_TIP, dot_r=56, hole=True):
    def draw(pen):
        pin_outer(pen, cx, PIN_CY, O_R, tip_y)
        if hole:
            circle(pen, cx, PIN_CY, O_r, ccw=False)          # miolo (furo)
            if dot_r:
                circle(pen, cx, PIN_CY, dot_r, ccw=True)    # ping no centro
    return Shape(draw)


def play_pin(cx, cy=430, R=330, tip_y=-260, tri=150):
    def draw(pen):
        pin_outer(pen, cx, cy, R, tip_y)
        # triângulo "play" vazado, centro óptico deslocado para a direita
        ox = cx + tri * 0.18
        pts = [(ox - tri * 0.5, cy + tri * 0.866), (ox - tri * 0.5, cy - tri * 0.866), (ox + tri, cy)]
        pen.moveTo(pts[0]); pen.lineTo(pts[1]); pen.lineTo(pts[2]); pen.closePath()
    return Shape(draw)


def dot(cx, cy, r):
    return Shape(lambda pen: circle(pen, cx, cy, r))


# ---------- composição ----------
def wordmark(pin=False, x=0.0):
    """Retorna lista de (shape, papel) e largura. papel: 'role' | 'go' | 'ping'."""
    parts, cur = [], x
    for i, ch in enumerate("RoleGo"):
        role = "role" if i < 4 else "go"
        if pin and i == 5:
            cur += 70  # respiro: o terminal do G avança à direita na altura das maiúsculas
            cx = cur + 317.5 - O_CY * TAN  # centro do "o" desinclinado
            parts.append((pin_o(cx, dot_r=0), "go"))
            cur += 636
        else:
            s, w = glyph(ch, cur)
            parts.append((s, role))
            cur += w + TRACK
    return parts, cur


def bounds(parts):
    bp = BoundsPen(None)
    for s, _ in parts:
        s.to_pen(bp)
    return bp.bounds


def path_d(shape, scale, tx, ty):
    sp = SVGPathPen(None, ntos=lambda v: ("%.2f" % v).rstrip("0").rstrip("."))
    shape.to_pen(TransformPen(sp, (scale, 0, 0, -scale, tx, ty)))
    return sp.getCommands()


def write_svg(name, parts, colors, box=None, pad=24, title="RoleGo", out=None):
    x0, y0, x1, y1 = bounds(parts)
    w, h = x1 - x0, y1 - y0
    if box == "square":
        S = 256
        scale = (S - 2 * pad) / max(w, h)
        tx = (S - w * scale) / 2 - x0 * scale
        ty = (S - h * scale) / 2 + y1 * scale - 4  # centro óptico um pouco acima
        vw, vh = S, S
    else:
        scale = (256 - 2 * pad) / h
        vw, vh = w * scale + 2 * pad, 256
        tx, ty = pad - x0 * scale, pad + y1 * scale
    groups = {}
    for s, role in parts:
        groups.setdefault(colors[role], []).append(path_d(s, scale, tx, ty))
    body = "".join(
        f'<path fill="{c}" fill-rule="evenodd" d="{" ".join(ds)}"/>' for c, ds in groups.items()
    )
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vw:.0f} {vh:.0f}" '
           f'role="img" aria-label="{title}"><title>{title}</title>{body}</svg>')
    with open(os.path.join(out or OUT, name), "w") as fh:
        fh.write(svg)


PALETTES = {
    "":       {"role": INK,   "go": INK,    "ping": INK,    "alt": INK},
    "-white": {"role": WHITE, "go": WHITE,  "ping": WHITE,  "alt": WHITE},
    # sobre preto (principal): ciano no "Go"/pin, ping branco — sem roxo no preto (feedback 08/11)
    "-color": {"role": WHITE, "go": CYAN,   "ping": WHITE,  "alt": WHITE},
    "-light": {"role": INK,   "go": VIOLET, "ping": VIOLET, "alt": INK},   # violeta só sobre fundo claro
}

GAP = 150  # espaço símbolo ↔ wordmark nos lockups


def concept_a():
    sym = [(pin_o(317.5 - O_CY * TAN, dot_r=0), "go")]  # pin sem o ponto (feedback 08/11)
    lock, _ = wordmark(pin=True)
    return sym, lock


def concept_b():
    s, w = glyph("R")
    sym = [(s, "role"), (dot(w + 40, 640, 95), "go")]
    x = w + 40 + 95 + GAP
    wm, _ = wordmark(x=x)
    return sym, sym + wm


def concept_c():
    sym = [(play_pin(330), "go")]
    wm, _ = wordmark(x=330 + 330 + GAP)
    return sym, sym + wm


def main():
    for key, fn in (("a", concept_a), ("b", concept_b), ("c", concept_c)):
        sym, lock = fn()
        for suf, pal in PALETTES.items():
            write_svg(f"{key}-symbol{suf}.svg", sym, pal, box="square")
            write_svg(f"{key}-lockup{suf}.svg", lock, pal)
    # small-size cut do A: pin sem o ping (o furo carrega a ideia em 16 px)
    write_svg("a-symbol-16.svg", [(pin_o(317.5 - O_CY * TAN, dot_r=0), "go")], PALETTES[""], box="square", pad=10)
    print("ok:", sorted(os.listdir(OUT)))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Clozzy 2028 — rodada 2 de logos (método core/definir-projeto-moderno/04-logos).
Gera símbolos + lockups em preto (grid 256) e versões em cor. Rodar: python3 _conceitos.py"""
import math, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "identidade-nova"))
import _logos  # noqa: E402  (wordmark Gabarito 800 + símbolo B)

OUT = HERE / "conceitos"
OUT.mkdir(exist_ok=True)
INK, PINK, WHITE, CREAM = "#14090F", "#FF0065", "#FFFFFF", "#FFF6F0"


def f(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def P(a, r, cx=128, cy=128):
    t = math.radians(a)
    return cx + r * math.cos(t), cy + r * math.sin(t)


def rounded_poly(pts, r):
    """Polígono com cantos arredondados (quadráticas) — path fechado."""
    n = len(pts)
    out = []
    for i in range(n):
        p0, p1, p2 = pts[i - 1], pts[i], pts[(i + 1) % n]
        def toward(a, b, d):
            dx, dy = b[0] - a[0], b[1] - a[1]
            L = math.hypot(dx, dy)
            d = min(d, L / 2.2)
            return a[0] + dx / L * d, a[1] + dy / L * d
        a = toward(p1, p0, r)
        b = toward(p1, p2, r)
        out.append((a, p1, b))
    d = f"M{f(out[0][0][0])} {f(out[0][0][1])}"
    for i, (a, c, b) in enumerate(out):
        if i:
            d += f"L{f(a[0])} {f(a[1])}"
        d += f"Q{f(c[0])} {f(c[1])} {f(b[0])} {f(b[1])}"
    return d + "Z"


def star(cx, cy, R, ratio=0.48, r=None, rot=-90):
    pts = [P(rot + k * 36, R if k % 2 == 0 else R * ratio, cx, cy) for k in range(10)]
    return rounded_poly(pts, R * 0.13 if r is None else r)


def rotate_pts(pts, ang, cx=128, cy=128):
    t = math.radians(ang)
    c, s = math.cos(t), math.sin(t)
    return [(cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c) for x, y in pts]


def svg(body, w=256, h=256, title="Clozzy"):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {f(w)} {f(h)}" width="{f(w)}" height="{f(h)}">'
            f'<title>{title}</title>{body}</svg>\n')


# =============================================================== conceitos
# Cada função devolve o corpo SVG (grid 256) usando `c` como cor.

def c_circulo(c):
    """B (rodada 1) — referência: C aberto + estrela."""
    return f'<g transform="scale(2.56)">{_logos.mark_inner(c)}</g>'


def c_ingresso(c):
    """Ingresso: comprou, entrou. Ticket com picotes laterais e estrela vazada."""
    t = ("M50 62H206A22 22 0 0 1 228 84V104A24 24 0 0 0 228 152V172A22 22 0 0 1 206 194"
         "H50A22 22 0 0 1 28 172V152A24 24 0 0 0 28 104V84A22 22 0 0 1 50 62Z")
    return f'<path fill-rule="evenodd" d="{t}{star(128, 131, 50, r=6)}" fill="{c}"/>'


def c_etiqueta(c):
    """Etiqueta: o exclusivo é produto — o furo da etiqueta é a estrela."""
    body = [(20, 128), (82, 58), (236, 58), (236, 198), (82, 198)]
    body = rotate_pts(body, -45)
    # recentra (bbox) e escala .9
    xs, ys = [p[0] for p in body], [p[1] for p in body]
    ox, oy = 128 - (min(xs) + max(xs)) / 2, 128 - (min(ys) + max(ys)) / 2
    s = 0.92
    body = [(128 + (x + ox - 128) * s, 128 + (y + oy - 128) * s) for x, y in body]
    hole_c = rotate_pts([(104, 128)], -45)[0]
    hx, hy = 128 + (hole_c[0] + ox - 128) * s, 128 + (hole_c[1] + oy - 128) * s
    return f'<path fill-rule="evenodd" d="{rounded_poly(body, 16)}{star(hx, hy, 40, r=5)}" fill="{c}"/>'


def c_bastidores(c):
    """Bastidores: a cortina abre e a estrela aparece."""
    left = "M28 28H104C104 96 88 160 52 228H28Z"
    right = "M228 28H152C152 96 168 160 204 228H228Z"
    return (f'<path d="{left}" fill="{c}"/><path d="{right}" fill="{c}"/>'
            f'<path d="{star(128, 150, 42, r=5)}" fill="{c}"/>')


def c_cometa(c):
    """Cometa: o c de clozzy é o rastro; a estrela é o drop chegando."""
    cx, cy, Rm = 120, 136, 78
    a0, a1 = 40, 320          # do terminal inferior (40°) ao superior (320° = −40°), passando pela esquerda
    w0, w1 = 14, 40
    n = 64
    outer, inner = [], []
    for i in range(n + 1):
        t = i / n
        a = a0 + (a1 - a0) * t
        w = w0 + (w1 - w0) * (t ** 0.8)
        outer.append(P(a, Rm + w / 2, cx, cy))
        inner.append(P(a, Rm - w / 2, cx, cy))
    pts = outer + inner[::-1]
    d = "M" + "L".join(f"{f(x)} {f(y)}" for x, y in pts) + "Z"
    # terminal inferior redondo
    tx, ty = P(a0, Rm, cx, cy)
    cap = f'<circle cx="{f(tx)}" cy="{f(ty)}" r="{f(w0 / 2)}" fill="{c}"/>'
    sx, sy = P(a1, Rm, cx, cy)
    return f'<path d="{d}" fill="{c}"/>{cap}<path d="{star(sx, sy, 46, r=6, rot=-90 + 14)}" fill="{c}"/>'


def c_entre_nos(c):
    """Entre nós: criador e fã — o exclusivo é o que fica na interseção."""
    r, ri, dx = 80, 60, 30
    h = math.sqrt(r * r - dx * dx)
    ring = lambda cx: (f"M{f(cx - r)} 128A{r} {r} 0 1 0 {f(cx + r)} 128A{r} {r} 0 1 0 {f(cx - r)} 128Z"
                       f"M{f(cx - ri)} 128A{ri} {ri} 0 1 1 {f(cx + ri)} 128A{ri} {ri} 0 1 1 {f(cx - ri)} 128Z")
    lens = (f"M128 {f(128 - h)}A{r} {r} 0 0 1 128 {f(128 + h)}A{r} {r} 0 0 1 128 {f(128 - h)}Z")
    return (f'<path fill-rule="evenodd" d="{ring(128 - dx)}" fill="{c}"/>'
            f'<path fill-rule="evenodd" d="{ring(128 + dx)}" fill="{c}"/>'
            f'<path fill-rule="evenodd" d="{lens}{star(128, 131, 33, r=4)}" fill="{c}"/>')


def c_vitrine(c):
    """Vitrine: uma janela em arco com a estrela em exposição."""
    o = "M48 222V118A80 80 0 0 1 208 118V222Z"
    i = "M72 198V118A56 56 0 0 1 184 118V198Z"
    return (f'<path fill-rule="evenodd" d="{o}{i}" fill="{c}"/>'
            f'<path d="{star(128, 130, 38, r=5)}" fill="{c}"/>')


def c_zz(c):
    """Costura zz: dois z que dividem as barras — um só ponto de costura."""
    y0, y1, w, k = 58, 198, 34, 50     # topo, base, espessura, largura horizontal da diagonal
    x0, xm, x1 = 26, 128, 230
    top = rounded_poly([(x0, y0), (x1, y0), (x1, y0 + w), (x0, y0 + w)], 7)
    bot = rounded_poly([(x0, y1 - w), (x1, y1 - w), (x1, y1), (x0, y1)], 7)
    d1 = rounded_poly([(xm - k, y0 + w - 1), (xm, y0 + w - 1), (x0 + k, y1 - w + 1), (x0, y1 - w + 1)], 2)
    d2 = rounded_poly([(x1 - k, y0 + w - 1), (x1, y0 + w - 1), (xm + k, y1 - w + 1), (xm, y1 - w + 1)], 2)
    return "".join(f'<path d="{d}" fill="{c}"/>' for d in (top, bot, d1, d2))


def _poly_from(d):
    """Converte path só com M/H/V/L/Z em lista de pontos."""
    import re
    toks = re.findall(r"[MHVLZ]|-?\d+(?:\.\d+)?", d)
    pts, x, y, i = [], 0.0, 0.0, 0
    while i < len(toks):
        t = toks[i]
        if t in "ML":
            x, y = float(toks[i + 1]), float(toks[i + 2]); i += 3
        elif t == "H":
            x = float(toks[i + 1]); i += 2
        elif t == "V":
            y = float(toks[i + 1]); i += 2
        else:
            i += 1; continue
        pts.append((x, y))
    return pts


CONCEPTS = [
    # slug, nome, tipo, ideia (1 frase), função
    ("b-circulo", "Círculo próximo", "Combination · referência rodada 1",
     "O C aberto de clozzy guarda a estrela; a ponta dela aponta para a saída.", c_circulo),
    ("d-ingresso", "Ingresso", "Pictorial",
     "O exclusivo vira ingresso: comprou, entrou.", c_ingresso),
    ("e-etiqueta", "Etiqueta", "Pictorial",
     "Exclusivo é produto: o furo da etiqueta de preço é uma estrela.", c_etiqueta),
    ("f-bastidores", "Bastidores", "Abstract",
     "A cortina se abre e a estrela aparece — o conteúdo por trás.", c_bastidores),
    ("g-cometa", "Cometa", "Lettermark",
     "O c é o rastro de um cometa; a estrela na ponta é o drop chegando.", c_cometa),
    ("h-entre-nos", "Entre nós", "Abstract",
     "Dois círculos (criador e fã); o exclusivo mora na interseção.", c_entre_nos),
    ("i-vitrine", "Vitrine", "Pictorial",
     "Uma janela de loja em arco com a estrela em exposição.", c_vitrine),
    ("j-costura", "Costura zz", "Lettermark",
     "Os dois z de clozzy viram um ponto de costura: a ligação.", c_zz),
]


_WM = None


def lockup(fn, mc, wc):
    global _WM
    if _WM is None:
        _WM = _logos.wordmark_paths()
    d, ww, asc, xh, desc = _WM
    H = 256
    sc = (H * 0.52) / asc            # altura do “l” = 52% do símbolo
    gap = H * 0.16
    y = (H - asc * sc) / 2 + H * 0.03
    word = (f'<g transform="translate({f(H + gap)} {f(y + asc * sc)}) scale({f(sc)})">'
            f'<path d="{d}" fill="{wc}"/></g>')
    return svg(fn(mc) + word, H + gap + ww * sc, H)


def build():
    for slug, name, *_rest, fn in CONCEPTS:
        (OUT / f"{slug}.svg").write_text(svg(fn(INK), title=f"Clozzy — {name}"))
        (OUT / f"{slug}-color.svg").write_text(svg(fn(PINK), title=f"Clozzy — {name}"))
        (OUT / f"{slug}-white.svg").write_text(svg(fn(WHITE), title=f"Clozzy — {name}"))
        (OUT / f"{slug}-lockup.svg").write_text(lockup(fn, INK, INK))
        (OUT / f"{slug}-lockup-color.svg").write_text(lockup(fn, PINK, INK))
        app = (f'<rect width="256" height="256" rx="58" fill="{PINK}"/>'
               f'<g transform="translate(40 40) scale(.6875)">{fn(WHITE)}</g>')
        (OUT / f"{slug}-app.svg").write_text(svg(app, title=f"Clozzy — {name} app"))
    return CONCEPTS


if __name__ == "__main__":
    build()
    print("ok", len(CONCEPTS))

#!/usr/bin/env python3
"""Clozzy — rodada 6: o C do Círculo próximo com a PONTA em pontos gradativos (do menor ao maior até virar a linha do C).
Parte da rodada 5 (marca/logo-circulo-tracejado: E · Story espelhado e A–D). Estrela original do Círculo próximo
(R 20,5 · miolo 0,48 · canto 5, grid 100), anel fino (traço 10), Pink Deep. Rodar: python3 _gradativo.py → svg/"""
import math, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "identidade-nova"))
sys.path.insert(0, str(HERE.parent / "logo-2028"))
import _logos as LG  # noqa: E402
import _conceitos as R2  # noqa: E402

PINK, DEEP, PURPLE, INK, CREAM, WHITE = "#FF0065", "#E0005A", "#7C48C4", "#14090F", "#FFF6F0", "#FFFFFF"
OUT = HERE / "svg"
OUT.mkdir(exist_ok=True)
OUTER = 45.0                      # raio externo (igual ao Círculo próximo)
W_MAIN, W_SMALL = 10.0, 14.0


def f(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def P(a, r):
    t = math.radians(a)
    return 50 + r * math.cos(t), 50 + r * math.sin(t)


def star(c):
    return (f'<polygon points="{LG.star_points()}" fill="{c}" stroke="{c}" '
            f'stroke-width="{LG.STAR_ROUND}" stroke-linejoin="round"/>')


def line(c, w, a0, a1):
    """Arco de linha (ângulos do EIXO, ponta redonda), sentido horário de a0 a a1."""
    rm = OUTER - w / 2
    if a1 < a0:
        a0, a1 = a1, a0
    span = a1 - a0
    if span >= 359.9:
        return f'<circle cx="50" cy="50" r="{f(rm)}" fill="none" stroke="{c}" stroke-width="{f(w)}"/>'
    (x0, y0), (x1, y1) = P(a0, rm), P(a1, rm)
    return (f'<path d="M{f(x0)} {f(y0)}A{f(rm)} {f(rm)} 0 {1 if span > 180 else 0} 1 {f(x1)} {f(y1)}" fill="none" '
            f'stroke="{c}" stroke-width="{f(w)}" stroke-linecap="round"/>')


def dot(c, w, a, r):
    x, y = P(a, OUTER - w / 2)
    return f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r)}" fill="{c}"/>'


def gradient(c, w, tip, direction, n, r0, gap, ease=1.15):
    """Pontos do menor (na ponta `tip`) ao maior, andando em `direction` (+1 horário, −1 anti-horário).
    Devolve (svg, ângulo do eixo onde a linha cheia começa). `gap` = espaço visível entre pontos (unidades do grid)."""
    rm = OUTER - w / 2
    rmax = w / 2
    radii = [r0 + (rmax - r0) * ((i + 1) / (n + 1)) ** ease for i in range(n)]
    out, a, prev = "", tip, None
    for r in radii:
        if prev is not None:
            a += direction * math.degrees((prev + gap + r) / rm)
        else:
            a += direction * math.degrees(r / rm)        # a borda do 1º ponto fica na ponta
        out += dot(c, w, a, r)
        prev = r
    start = a + direction * math.degrees((prev + gap * 1.1 + rmax) / rm)
    return out, start


def dashes_grow(c, w, tip, direction, lengths, gap):
    """Da ponta para dentro: ponto(s) e traços que alongam (graus visíveis; ≤ 2·cap vira ponto cheio)."""
    rm = OUTER - w / 2
    cap = math.degrees((w / 2) / rm)
    g = math.degrees(gap / rm)
    out, pos = "", tip
    for L in lengths:
        if L <= 2 * cap:
            out += dot(c, w, pos + direction * cap, w / 2)
            pos += direction * 2 * cap
        else:
            a0, a1 = pos + direction * cap, pos + direction * (L - cap)
            out += line(c, w, *sorted((a0, a1)))
            pos += direction * L
        pos += direction * g
    return out, pos + direction * cap


# ------------------------------------------------------------------ o C
# Abertura do Círculo próximo: 54° centrada em −18°. Ponta de baixo visível em −3,4°; ponta de cima em 327,4° (= −32,6°).
C_LOW, C_TOP = -3.4, 327.4


def c_shape(rc, w, n, r0, gap, tip="top", ease=1.25, open_extra=0.0):
    """C cheio com a ponta virando pontos gradativos (o menor na ponta). Discreto: só o trecho final."""
    rm = OUTER - w / 2
    cap = math.degrees((w / 2) / rm)
    low, top = C_LOW + open_extra, C_TOP - open_extra
    if tip == "top":
        pts, start = gradient(rc, w, top, -1, n, r0, gap, ease)
        return pts + line(rc, w, low + cap, start)
    pts, start = gradient(rc, w, low, +1, n, r0, gap, ease)
    return pts + line(rc, w, start, top - cap)


def mk(n, r0, gap, n_s, r0_s, tip="top", ease=1.25, open_extra=0.0):
    def fn(rc=DEEP, sc=DEEP, small=False):
        w = W_SMALL if small else W_MAIN
        body = c_shape(rc, w, n_s if small else n, r0_s if small else r0, (2.8 if small else gap), tip, ease, open_extra)
        return body + star(sc)
    return fn


def c_tracos(rc=DEEP, sc=DEEP, small=False):
    """Ponto pequeno → ponto médio → traço curto → traço médio → C cheio (cresce em tamanho e depois em comprimento)."""
    w = W_SMALL if small else W_MAIN
    rm = OUTER - w / 2
    cap = math.degrees((w / 2) / rm)
    pts, st = gradient(rc, w, C_TOP, -1, 1 if small else 2, 2.4 if small else 1.6, 2.6 if small else 2.2, 1.0)
    d, start = dashes_grow(rc, w, st - (-1) * cap + (-1) * 0, -1, [20] if small else [16, 26], 2.6 if small else 2.2)
    return pts + d + line(rc, w, C_LOW + cap, start) + star(sc)


CONCEPTS = [
    ("c1-gradativo", "C gradativo", "O C do Círculo próximo; só a ponta de cima vira 4 pontos que crescem até a linha. Discreto: ~1/6 do C.",
     mk(4, 1.5, 2.2, 2, 2.6)),
    ("c2-sutil", "C gradativo sutil", "Só 3 pontos colados na ponta: o mais discreto. De longe é um C; de perto, um story.",
     mk(3, 2.0, 2.2, 2, 3.0)),
    ("c3-mais", "C gradativo, 5 pontos", "Cinco pontos, a transição um pouco mais longa (~1/4 do C), ainda depois da metade.",
     mk(5, 1.1, 2.0, 3, 2.2)),
    ("c4-baixo", "Ponta de baixo", "O gradativo na ponta de baixo: a linha nasce dos pontos e fecha cheia em cima.",
     mk(4, 1.5, 2.2, 2, 2.6, tip="bottom")),
    ("c5-tracos", "Ponto → traço", "Em vez de pontos que crescem, um ponto e traços que alongam até virar o C.",
     c_tracos),
    ("c6-aberto", "C mais aberto", "Abertura maior (+12° de cada lado) para ler ainda mais como C, com os 4 pontos gradativos.",
     mk(4, 1.5, 2.2, 2, 2.6, open_extra=12)),
]

# usos: (slug, nome, fundo, anel, estrela, palavra)
USES = [
    ("deep", "Pink Deep", WHITE, DEEP, DEEP, INK), ("pink", "Rosa", WHITE, PINK, PINK, INK),
    ("preto", "Preto", WHITE, INK, INK, INK), ("roxo", "Roxo", WHITE, PURPLE, PURPLE, INK),
    ("rosa-estrela-roxa", "Rosa + estrela roxa", WHITE, PINK, PURPLE, INK), ("roxo-estrela-rosa", "Roxo + estrela rosa", WHITE, PURPLE, PINK, INK),
    ("preto-estrela-rosa", "Preto + estrela rosa", WHITE, INK, PINK, INK), ("rosa-estrela-preta", "Rosa + estrela preta", WHITE, PINK, INK, INK),
    ("branco-no-rosa", "Branco no rosa", PINK, WHITE, WHITE, WHITE), ("branco-no-roxo", "Branco no roxo", PURPLE, WHITE, WHITE, WHITE),
    ("branco-no-preto", "Branco no preto", INK, WHITE, WHITE, WHITE), ("rosa-no-preto", "Rosa no preto", INK, PINK, PINK, WHITE),
    ("rosa-estrela-branca-no-preto", "Rosa + estrela branca no preto", INK, PINK, WHITE, WHITE),
    ("branco-estrela-rosa-no-preto", "Branco + estrela rosa no preto", INK, WHITE, PINK, WHITE),
    ("preto-no-rosa", "Preto no rosa", PINK, INK, INK, INK), ("branco-estrela-preta-no-rosa", "Branco + estrela preta no rosa", PINK, WHITE, INK, INK),
]


THEMES = {
    "color": (DEEP, DEEP), "pink": (PINK, PINK), "roxo": (DEEP, PURPLE), "ink-star": (DEEP, INK),
    "dark": (PINK, PINK), "tile": (WHITE, WHITE), "mono": (INK, INK),
}


def svg100(inner, size=256, title="Clozzy"):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="{size}" height="{size}">'
            f'<title>{title}</title>{inner}</svg>\n')


def app(inner, bg):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="256" height="256">'
            f'<rect width="100" height="100" rx="22.6" fill="{bg}"/><g transform="translate(17 17) scale(.66)">{inner}</g></svg>\n')


def lockup(inner, word):
    return R2.lockup(lambda _c: f'<g transform="scale(2.56)">{inner}</g>', None, word)


def build():
    import shutil
    shutil.rmtree(OUT, ignore_errors=True); OUT.mkdir()
    for slug, name, _idea, fn in CONCEPTS:
        for t, (rc, sc) in THEMES.items():
            (OUT / f"{slug}-{t}.svg").write_text(svg100(fn(rc, sc), title=f"Clozzy — {name}"))
        (OUT / f"{slug}-16.svg").write_text(svg100(fn(DEEP, DEEP, True), title=f"Clozzy — {name} 16px"))
        (OUT / f"{slug}-16-dark.svg").write_text(svg100(fn(PINK, PINK, True)))
        (OUT / f"{slug}-app-deep.svg").write_text(app(fn(WHITE, WHITE), DEEP))
        (OUT / f"{slug}-app-ink.svg").write_text(app(fn(PINK, PINK), INK))
        (OUT / f"{slug}-lockup.svg").write_text(lockup(fn(), INK))
        (OUT / f"{slug}-lockup-dark.svg").write_text(lockup(fn(PINK, PINK), WHITE))
        (OUT / f"{slug}-lockup-ink-star.svg").write_text(lockup(fn(DEEP, INK), INK))
        for u, _n, bg, rc, sc, wc in USES:
            (OUT / f"{slug}-uso-{u}.svg").write_text(svg100(fn(rc, sc)))
            (OUT / f"{slug}-uso-{u}-lockup.svg").write_text(lockup(fn(rc, sc), wc))
            (OUT / f"{slug}-uso-{u}-16.svg").write_text(svg100(fn(rc, sc, True)))
        for bgn, bg, rc in (("rosa", PINK, WHITE), ("roxo", PURPLE, WHITE), ("preto", INK, PINK), ("branco", WHITE, DEEP)):
            (OUT / f"{slug}-app-{bgn}.svg").write_text(app(fn(rc, rc), bg))


if __name__ == "__main__":
    build()
    print("ok", len(CONCEPTS))

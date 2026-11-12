#!/usr/bin/env python3
"""Clozzy — rodada 8: variações do “2 · Traços sutis” (rodada 7) com VÃOS MAIORES. Base da rodada 7: o C do Círculo próximo com a ponta em TRAÇOS GRADATIVOS de MESMA espessura:
. - -- --- -------- (um ponto, depois traços cada vez mais longos, até virar a linha do C).
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


GAP = 3.0          # vão visível entre traços (unidades do grid 100), igual em todos


def c_tracos_shape(rc, w, lengths, tip="top", gap=GAP, open_extra=0.0, gaps=None):
    """C cheio; a ponta vira  .  -  --  ---  (comprimentos visíveis em graus; ≤ 2·cap = ponto). Espessura constante."""
    rm = OUTER - w / 2
    cap = math.degrees((w / 2) / rm)
    low, top = C_LOW + open_extra, C_TOP - open_extra
    d = -1 if tip == "top" else +1
    out, pos = "", (top if tip == "top" else low)
    for i, L in enumerate(lengths):
        if L <= 2 * cap:
            out += dot(rc, w, pos + d * cap, w / 2)
            L = 2 * cap
        else:
            out += line(rc, w, *sorted((pos + d * cap, pos + d * (L - cap))))
        g = (gaps[i] if gaps else gap)
        pos += d * (L + math.degrees(g / rm))
    start = pos + d * cap
    if tip == "top":
        return out + line(rc, w, low + cap, start)
    return out + line(rc, w, start, top - cap)


def mk(lengths, small_lengths, gap=5.0, tip="top", open_extra=0.0, gaps=None, small_gaps=None):
    def fn(rc=DEEP, sc=DEEP, small=False):
        w = W_SMALL if small else W_MAIN
        body = c_tracos_shape(rc, w, small_lengths if small else lengths, tip, gap * (1.15 if small else 1),
                              open_extra, small_gaps if small else gaps)
        return body + star(sc)
    return fn


# Base (r7 · 2 · Traços sutis): ponto + 20° + 30°, vão 3. Aqui o vão sobe para 5–7.
CONCEPTS = [
    ("s1-vao-5", "Sutil · vão 5", "O “2 · Traços sutis” com o vão de 3 para 5: ponto, traço, traço maior, C. Ainda junto, mas cada traço respira.",
     mk([0, 20, 30], [0, 28], 5.0)),
    ("s2-vao-6", "Sutil · vão 6", "Vão 6: os traços ficam claramente separados, sem parecer solto.",
     mk([0, 20, 30], [0, 28], 6.0)),
    ("s3-vao-7", "Sutil · vão 7", "Vão 7: o mais arejado. O ponto fica bem destacado na ponta.",
     mk([0, 20, 30], [0, 28], 7.0)),
    ("s4-longos", "Traços mais longos", "Vão 5 com traços de 24° e 36°: mais traço, menos vão, ritmo mais lento.",
     mk([0, 24, 36], [0, 30], 5.0)),
    ("s5-curtos", "Traços mais curtos", "Vão 5 com traços de 17° e 25°: mais compacto, quase só na pontinha.",
     mk([0, 17, 25], [0, 24], 5.0)),
    ("s6-vao-abre", "Vão que abre na ponta", "Vãos diferentes: 7 entre o ponto e o 1º traço, 5 depois. O ponto “se solta” do C.",
     mk([0, 20, 30], [0, 28], 5.0, gaps=[7.0, 5.0, 5.0], small_gaps=[7.0, 5.5])),
    ("s7-aberto", "C mais aberto", "Vão 5 e abertura do C 8° maior de cada lado: lê ainda mais como C.",
     mk([0, 20, 30], [0, 28], 5.0, open_extra=8)),
    ("s8-baixo", "Ponta de baixo", "A mesma progressão (vão 5) na ponta de baixo do C.",
     mk([0, 20, 30], [0, 28], 5.0, tip="bottom")),
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

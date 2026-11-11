#!/usr/bin/env python3
"""Clozzy — Círculo próximo tracejado (rodada 5).
Base: marca/refs/…13.25.20.png (Círculo próximo). Mantém a ESTRELA idêntica (R 20,5 · miolo 0,48 · canto 5, grid 100);
o C fica mais fino e parte da ponta vira tracejado de story. Só rosa/roxo/ink/cream/branco.
Rodar: python3 _circulo.py → svg/"""
import math, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent.parent / "identidade-nova"))
sys.path.insert(0, str(HERE.parent.parent / "logo-2028"))
import _logos as LG  # noqa: E402
import _conceitos as R2  # noqa: E402

PINK, DEEP, PURPLE, INK, CREAM, WHITE = "#FF0065", "#E0005A", "#7C48C4", "#14090F", "#FFF6F0", "#FFFFFF"
OUT = HERE / "svg"
OUT.mkdir(exist_ok=True)

OUTER = LG.RM + LG.W / 2          # 45 — mesmo diâmetro externo do original
VIS = (-3.4, 327.4)               # extensão visível do C original (com as pontas redondas)
W_MAIN, W_SMALL = 10, 14          # original = 16


def f(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def P(a, r):
    t = math.radians(a)
    return 50 + r * math.cos(t), 50 + r * math.sin(t)


def star(c):
    """Estrela idêntica à do Círculo próximo."""
    return (f'<polygon points="{LG.star_points()}" fill="{c}" stroke="{c}" '
            f'stroke-width="{LG.STAR_ROUND}" stroke-linejoin="round"/>')


def seg(c, w, a, b):
    """Trecho VISÍVEL de a até b (graus, horário), ponta redonda; vira ponto se for curto demais."""
    rm = OUTER - w / 2
    cap = math.degrees((w / 2) / rm)
    if b - a <= 2 * cap + 0.5:
        x, y = P((a + b) / 2, rm)
        return f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(w / 2)}" fill="{c}"/>'
    a0, a1 = a + cap, b - cap
    (x0, y0), (x1, y1) = P(a0, rm), P(a1, rm)
    large = 1 if (a1 - a0) > 180 else 0
    return (f'<path d="M{f(x0)} {f(y0)}A{f(rm)} {f(rm)} 0 {large} 1 {f(x1)} {f(y1)}" fill="none" stroke="{c}" '
            f'stroke-width="{f(w)}" stroke-linecap="round"/>')


# trechos visíveis (graus). 0° = direita, 90° = baixo. O C vai de −3° (ponta de baixo) a 327° (ponta de cima).
VARIANTS = {
    "e-espelhado": dict(
        name="Story espelhado", idea="O modelo do print 13.43 espelhado: arco cheio à esquerda e traços subindo pela direita até o topo, com a estrela original.",
        main=[(-96, -80), (-64, -38), (-22, 4), (20, 46), (62, 250)],
        small=[(-100, -86), (-70, -26), (-6, 38), (60, 250)]),
    "f-espelhado-variado": dict(
        name="Espelhado, traços variados", idea="Mesmo desenho, mas os traços da direita mudam de tamanho: curto, longo, ponto, longo.",
        main=[(-96, -84), (-70, -36), (-22, -12), (2, 46), (62, 250)],
        small=[(-100, -86), (-70, -26), (-6, 38), (60, 250)]),
    "a-ponta": dict(
        name="Só na ponta", idea="Cheio até perto da ponta de cima; ali o C quebra em traços de tamanhos diferentes (longo, curto, médio).",
        main=[(-3.4, 224), (236, 268), (280, 292), (304, 327.4)],
        small=[(-3.4, 236), (252, 286), (302, 327.4)]),
    "b-meio": dict(
        name="Do meio pra ponta", idea="Da metade do C até a ponta, traços variados que vão rareando, como o anel do “novo story”.",
        main=[(-3.4, 150), (162, 196), (207, 219), (231, 262), (274, 284), (296, 327.4)],
        small=[(-3.4, 160), (178, 226), (244, 276), (294, 327.4)]),
    "c-meio-largo": dict(
        name="Do meio, traços largos", idea="Também do meio pra ponta, mas com poucos traços grandes e um curtinho, mais perto do print 7.",
        main=[(-3.4, 170), (184, 232), (246, 262), (276, 327.4)],
        small=[(-3.4, 176), (194, 250), (270, 327.4)]),
    "d-ponta-curta": dict(
        name="Ponta picotada", idea="Só a pontinha: um traço curto, um médio e o terminal curto, quase um picote.",
        main=[(-3.4, 236), (248, 262), (274, 300), (312, 327.4)],
        small=[(-3.4, 246), (264, 292), (310, 327.4)]),
}


def body(v, ring_c=DEEP, star_c=DEEP, small=False, w=None):
    V = VARIANTS[v]
    w = w or (W_SMALL if small else W_MAIN)
    return "".join(seg(ring_c, w, a, b) for a, b in V["small" if small else "main"]) + star(star_c)


def original(c=PINK):
    return LG.mark_inner(c, c)


THEMES = {   # Pink Deep é a cor principal (pedido); Pink Clozzy e roxo como alternativas
    "color": (DEEP, DEEP), "pink": (PINK, PINK), "roxo": (DEEP, PURPLE), "dark": (DEEP, DEEP), "dark-pink": (PINK, PINK),
    "tile": (WHITE, WHITE), "mono": (INK, INK),
    "ink-star": (DEEP, INK), "ink-star-pink": (PINK, INK),   # igual ao print 13.43: anel rosa, estrela ink
}


def svg100(inner, size=256, title="Clozzy"):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="{size}" height="{size}">'
            f'<title>{title}</title>{inner}</svg>\n')


def app(inner_fn, bg):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="256" height="256">'
            f'<rect width="100" height="100" rx="22.6" fill="{bg}"/><g transform="translate(17 17) scale(.66)">{inner_fn}</g></svg>\n')


def lockup(inner, word):
    return R2.lockup(lambda _c: f'<g transform="scale(2.56)">{inner}</g>', None, word)


def build():
    for v, V in VARIANTS.items():
        for t, (rc, sc) in THEMES.items():
            (OUT / f"{v}-{t}.svg").write_text(svg100(body(v, rc, sc), title=f"Clozzy — {V['name']}"))
        (OUT / f"{v}-16.svg").write_text(svg100(body(v, small=True), title=f"Clozzy — {V['name']} 16px"))
        (OUT / f"{v}-16-dark.svg").write_text(svg100(body(v, DEEP, DEEP, small=True)))
        (OUT / f"{v}-app-deep.svg").write_text(app(body(v, WHITE, WHITE), DEEP))
        (OUT / f"{v}-app-ink.svg").write_text(app(body(v, DEEP, DEEP), INK))
        (OUT / f"{v}-app-cream.svg").write_text(app(body(v, DEEP, INK), CREAM))
        (OUT / f"{v}-lockup.svg").write_text(lockup(body(v), INK))
        (OUT / f"{v}-lockup-dark.svg").write_text(lockup(body(v), WHITE))
        (OUT / f"{v}-lockup-roxo.svg").write_text(lockup(body(v, DEEP, PURPLE), INK))
        (OUT / f"{v}-lockup-pink.svg").write_text(lockup(body(v, PINK, PINK), INK))
        (OUT / f"{v}-lockup-ink-star.svg").write_text(lockup(body(v, DEEP, INK), INK))
    (OUT / "original-color.svg").write_text(svg100(original(), title="Clozzy — Círculo próximo (original)"))


if __name__ == "__main__":
    build()
    print("ok", len(VARIANTS))

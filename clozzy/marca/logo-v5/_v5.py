#!/usr/bin/env python3
"""Clozzy — v5: o círculo vira C e a ponta de cima vira tracejado de comprimento gradativo.
Espessura constante do começo ao fim; o que cresce é o comprimento:  ·  –  ––  ———— (C cheio).
Base: rodada 5a “Só na ponta” (../logo-circulo-tracejado). Paleta: preto, rosa, branco, roxo.
Rodar: python3 _v5.py → svg/"""
import math, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "identidade-nova"))
sys.path.insert(0, str(HERE.parent / "logo-2028"))
import _logos as LG  # noqa: E402
import _conceitos as R2  # noqa: E402

# paleta da v5: quatro cores
INK, PINK, WHITE, PURPLE = "#14090F", "#FF0065", "#FFFFFF", "#7C48C4"
DEEP = "#E0005A"      # rosa escuro — só para traço fino sobre branco (contraste)
CREAM = "#FFF6F0"     # papel do documento, não entra na marca

OUT = HERE / "svg"
OUT.mkdir(exist_ok=True)

OUTER = 45.0                 # raio externo (igual ao Círculo próximo)
W_MAIN, W_SMALL = 10.0, 14.0
C_LOW, C_TOP = -3.4, 327.4   # abertura de 54° centrada em −18°; pontas visíveis do C
GAP = 3.5                    # vão entre traços, em unidades de arco do grid 100
RATIO = 1.7                  # razão da progressão: cada traço é 1,7× o anterior


def f(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def P(a, r):
    t = math.radians(a)
    return 50 + r * math.cos(t), 50 + r * math.sin(t)


def star(c):
    return (f'<polygon points="{LG.star_points()}" fill="{c}" stroke="{c}" '
            f'stroke-width="{LG.STAR_ROUND}" stroke-linejoin="round"/>')


def line(c, w, a0, a1):
    """Arco entre dois ângulos de eixo, ponta redonda, sentido horário."""
    rm = OUTER - w / 2
    a0, a1 = sorted((a0, a1))
    (x0, y0), (x1, y1) = P(a0, rm), P(a1, rm)
    return (f'<path d="M{f(x0)} {f(y0)}A{f(rm)} {f(rm)} 0 {1 if a1 - a0 > 180 else 0} 1 {f(x1)} {f(y1)}" '
            f'fill="none" stroke="{c}" stroke-width="{f(w)}" stroke-linecap="round"/>')


def dot(c, w, a):
    x, y = P(a, OUTER - w / 2)
    return f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(w / 2)}" fill="{c}"/>'


def steps(w, n, ratio=RATIO):
    """Comprimentos do tracejado, em unidades de arco: o 1º é um ponto (= w) e cada um é `ratio`× o anterior."""
    return [w * ratio ** i for i in range(n)]


def c_v5(rc, w, lengths, tip="top", gaps=None, gap=GAP, open_extra=0.0):
    """C cheio com a ponta em traços de comprimento gradativo (unidades de arco). Espessura sempre w."""
    rm = OUTER - w / 2
    cap = math.degrees((w / 2) / rm)
    deg = lambda u: math.degrees(u / rm)  # noqa: E731
    low, top = C_LOW + open_extra, C_TOP - open_extra
    d = -1 if tip == "top" else 1
    out, pos = "", (top if tip == "top" else low)
    for i, Lu in enumerate(lengths):
        L = deg(max(Lu, w))
        out += dot(rc, w, pos + d * cap) if max(Lu, w) <= w * 1.001 else \
            line(rc, w, pos + d * cap, pos + d * (L - cap))
        pos += d * (L + deg(gaps[i] if gaps else gap))
    start = pos + d * cap
    return out + (line(rc, w, low + cap, start) if tip == "top" else line(rc, w, start, top - cap))


def mk(n, tip="top", ratio=RATIO, gaps=None, gap=GAP, open_extra=0.0, n_small=2):
    def fn(rc=PINK, sc=PINK, small=False):
        w = W_SMALL if small else W_MAIN
        ls = steps(w, n_small if small else n, ratio)
        return c_v5(rc, w, ls, tip, None if small else gaps, gap * (1.2 if small else 1), open_extra) + star(sc)
    return fn


# ---------------------------------------------------------------- possibilidades
CONCEPTS = [
    ("v5a-gradativo", "Ponta gradativa", "Um ponto, um traço, um traço maior — e emenda na linha do C. Razão 1,7 e a mesma espessura em tudo.",
     mk(3)),
    ("v5b-sutil", "Só o ponto", "Ponto e um traço antes da linha: o mínimo para ler o tracejado sem perder o círculo.",
     mk(2)),
    ("v5c-quatro", "Quatro passos", "Ponto e três traços: a progressão fica explícita, ocupando pouco mais de um terço do C.",
     mk(4, n_small=2)),
    ("v5d-razao-alta", "Salto maior", "Mesma ideia com razão 2,2: o traço final é bem mais longo que o anterior, o crescimento é mais dramático.",
     mk(3, ratio=2.2)),
    ("v5e-vaos", "Vãos que fecham", "Os traços crescem e os vãos encolhem (5,0 → 2,2): a ponta parece se juntar até virar linha.",
     mk(3, gaps=[5.0, 3.4, 2.2])),
    ("v5f-baixo", "Ponta de baixo", "A progressão na ponta de baixo: a linha nasce do ponto, sobe e fecha cheia em cima.",
     mk(3, tip="bottom")),
]
C = {c[0]: c for c in CONCEPTS}
MAIN = "v5a-gradativo"

# usos: (slug, nome, fundo, anel, estrela, palavra do lockup)
USES = [
    ("rosa", "Rosa", WHITE, PINK, PINK, INK),
    ("preto", "Preto", WHITE, INK, INK, INK),
    ("roxo", "Roxo", WHITE, PURPLE, PURPLE, INK),
    ("rosa-deep", "Rosa escuro", WHITE, DEEP, DEEP, INK),
    ("rosa-estrela-preta", "Rosa + estrela preta", WHITE, PINK, INK, INK),
    ("rosa-estrela-roxa", "Rosa + estrela roxa", WHITE, PINK, PURPLE, INK),
    ("preto-estrela-rosa", "Preto + estrela rosa", WHITE, INK, PINK, INK),
    ("roxo-estrela-rosa", "Roxo + estrela rosa", WHITE, PURPLE, PINK, INK),
    ("branco-no-preto", "Branco no preto", INK, WHITE, WHITE, WHITE),
    ("rosa-no-preto", "Rosa no preto", INK, PINK, PINK, WHITE),
    ("branco-estrela-rosa-no-preto", "Branco + estrela rosa no preto", INK, WHITE, PINK, WHITE),
    ("rosa-estrela-branca-no-preto", "Rosa + estrela branca no preto", INK, PINK, WHITE, WHITE),
    ("branco-no-rosa", "Branco no rosa", PINK, WHITE, WHITE, WHITE),
    ("preto-no-rosa", "Preto no rosa", PINK, INK, INK, INK),
    ("branco-no-roxo", "Branco no roxo", PURPLE, WHITE, WHITE, WHITE),
    ("rosa-no-roxo", "Rosa no roxo", PURPLE, PINK, WHITE, WHITE),
]

THEMES = {"rosa": (PINK, PINK), "preto": (INK, INK), "roxo": (PURPLE, PURPLE),
          "deep": (DEEP, DEEP), "estrela-preta": (PINK, INK), "branco": (WHITE, WHITE)}


def svg100(inner, size=256, title="Clozzy"):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="{size}" height="{size}">'
            f'<title>{title}</title>{inner}</svg>\n')


def app(inner, bg):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="256" height="256">'
            f'<rect width="100" height="100" rx="22.6" fill="{bg}"/>'
            f'<g transform="translate(17 17) scale(.66)">{inner}</g></svg>\n')


def lockup(inner, word):
    return R2.lockup(lambda _c: f'<g transform="scale(2.56)">{inner}</g>', None, word)


def build():
    import shutil
    shutil.rmtree(OUT, ignore_errors=True)
    OUT.mkdir()
    for slug, name, _idea, fn in CONCEPTS:
        for t, (rc, sc) in THEMES.items():
            (OUT / f"{slug}-{t}.svg").write_text(svg100(fn(rc, sc), title=f"Clozzy — {name}"))
        (OUT / f"{slug}-16.svg").write_text(svg100(fn(DEEP, DEEP, True), title=f"Clozzy — {name} 16px"))
        (OUT / f"{slug}-16-dark.svg").write_text(svg100(fn(PINK, PINK, True)))
        for bgn, bg, rc in (("rosa", PINK, WHITE), ("roxo", PURPLE, WHITE), ("preto", INK, PINK), ("branco", WHITE, PINK)):
            (OUT / f"{slug}-app-{bgn}.svg").write_text(app(fn(rc, rc), bg))
        for u, _n, _bg, rc, sc, wc in USES:
            (OUT / f"{slug}-uso-{u}.svg").write_text(svg100(fn(rc, sc)))
            (OUT / f"{slug}-uso-{u}-lockup.svg").write_text(lockup(fn(rc, sc), wc))
            (OUT / f"{slug}-uso-{u}-16.svg").write_text(svg100(fn(rc, sc, True)))


if __name__ == "__main__":
    build()
    print("ok", len(CONCEPTS), "conceitos")

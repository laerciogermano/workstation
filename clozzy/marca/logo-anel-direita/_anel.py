#!/usr/bin/env python3
"""Clozzy — anel com os traços à direita (rodada 12).
Base: o desenho do print refs/…14.03.10.png (traço 8 da rodada 5 “story espelhado”) e o tile
refs/…14.31.06.png, que estava com os traços à esquerda e aqui entra espelhado para a direita.
Linha cheia abraçando a esquerda, traços soltos subindo pela direita, estrela original dentro.
Rodar: python3 _anel.py → svg/"""
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

OUTER = 45.0          # raio externo (mesmo diâmetro do Círculo próximo)
W = 8.0               # espessura do print 14.03.10
STAR_R = 20.5         # estrela original


def f(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def P(a, r):
    t = math.radians(a)
    return 50 + r * math.cos(t), 50 + r * math.sin(t)


def seg(c, w, a, b):
    """Trecho visível de a até b (graus, horário), ponta redonda; vira ponto se for curto demais."""
    rm = OUTER - w / 2
    cap = math.degrees((w / 2) / rm)
    if b - a <= 2 * cap + 0.5:
        x, y = P((a + b) / 2, rm)
        return f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(w / 2)}" fill="{c}"/>'
    (x0, y0), (x1, y1) = P(a + cap, rm), P(b - cap, rm)
    return (f'<path d="M{f(x0)} {f(y0)}A{f(rm)} {f(rm)} 0 {1 if b - a > 180 else 0} 1 {f(x1)} {f(y1)}" '
            f'fill="none" stroke="{c}" stroke-width="{f(w)}" stroke-linecap="round"/>')


def star(c, R=STAR_R):
    k = R / LG.STAR_R
    return (f'<polygon points="{LG.star_points(R=R)}" fill="{c}" stroke="{c}" '
            f'stroke-width="{f(LG.STAR_ROUND * k)}" stroke-linejoin="round"/>')


def ring(c, w, parts):
    return "".join(seg(c, w, a, b) for a, b in parts)


def make(parts, parts_small, w=W, R=STAR_R, w_small=None):
    def fn(rc=DEEP, sc=None, small=False):
        sc = sc or rc
        if small:
            return ring(rc, w_small or w + 4, parts_small) + star(sc, R)
        return ring(rc, w, parts) + star(sc, R)
    return fn


A0, A1 = -96.0, 46.0   # setor tracejado: do topo, pela direita, até a curva de baixo


def even(n, duty=0.66, a0=A0, a1=A1):
    """n traços iguais entre a0 e a1 + a linha cheia fechando pela esquerda, com o mesmo vão nas junções."""
    p = (a1 - a0) / (n * duty + (n - 1) * (1 - duty))
    d, g = p * duty, p * (1 - duty)
    parts = [(a0 + i * p, a0 + i * p + d) for i in range(n)]
    return parts + [(a1 + g, a0 + 360 - g)]


# Traços à direita: do topo (−96° ≈ 264°) descendo pela direita até embaixo (46°).
# A linha cheia fecha o resto pela esquerda. Nenhum traço encosta no outro.
VARIANTS = [
    ("a-print", "Como no print", "O desenho do print: traço 8 e quatro traços de tamanhos diferentes descendo pela direita, com a linha cheia abraçando a esquerda.",
     make([(-96, -80), (-64, -38), (-22, 4), (20, 46), (62, 250)],
          [(-100, -86), (-70, -26), (-6, 38), (60, 250)], w=8)),
    ("b-tres", "Três traços", "Menos partes e cada uma mais longa: o anel lê como um C com três pedaços soltos.",
     make(even(3, 0.72), even(2, 0.7), w=8)),
    ("c-cinco", "Cinco traços", "Cinco traços iguais: o ritmo mais próximo de um story carregando.",
     make(even(5, 0.66), even(3, 0.68), w=8)),
    ("d-seis", "Seis traços finos", "Traço 7 com seis partes — o mais picotado que ainda não vira pontilhado.",
     make(even(6, 0.62), even(3, 0.66), w=7, w_small=11)),
    ("e-iguais", "Quatro iguais", "O mesmo número de traços do print, mas todos do mesmo tamanho e vão.",
     make(even(4, 0.7), even(2, 0.7), w=8)),
    ("f-crescente", "Crescendo na descida", "Os traços alongam do topo para baixo (curto, médio, longo, longo): a quebra tem direção.",
     make([(-96, -86), (-74, -52), (-40, 0), (12, 46), (62, 250)],
          [(-100, -88), (-74, -24), (-8, 40), (60, 250)], w=8)),
    ("g-grosso", "Traço 10", "A mesma geometria do print com o anel mais grosso — segura melhor longe e no pequeno.",
     make([(-96, -80), (-64, -38), (-22, 4), (20, 46), (62, 250)],
          [(-100, -86), (-70, -26), (-6, 38), (60, 250)], w=10, R=19.5, w_small=13)),
    ("h-meia-volta", "Metade exata", "O tracejado ocupa a metade direita inteira (de −90° a 90°), como no anel do print 14.54.44.",
     make(even(5, 0.68, -90, 90), even(3, 0.7, -90, 90), w=8)),
]
V = {v[0]: v for v in VARIANTS}
MAIN = "a-print"

THEMES = {"deep": (DEEP, DEEP), "rosa": (PINK, PINK), "branco": (WHITE, WHITE),
          "ink": (INK, INK), "roxo": (PURPLE, PURPLE), "rosa-estrela-branca": (PINK, WHITE)}


def svg100(inner, size=256, title="Clozzy"):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="{size}" height="{size}">'
            f'<title>{title}</title>{inner}</svg>\n')


def app(inner, bg):
    """Tile de app: símbolo a 66% dentro do quadrado de cantos 22,6 (igual às rodadas anteriores)."""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="256" height="256">'
            f'<rect width="100" height="100" rx="22.6" fill="{bg}"/>'
            f'<g transform="translate(17 17) scale(.66)">{inner}</g></svg>\n')


def lockup(inner, word):
    return R2.lockup(lambda _c: f'<g transform="scale(2.56)">{inner}</g>', None, word)


def build():
    import shutil
    shutil.rmtree(OUT, ignore_errors=True)
    OUT.mkdir()
    for slug, name, _idea, fn in VARIANTS:
        for t, (rc, sc) in THEMES.items():
            (OUT / f"{slug}-{t}.svg").write_text(svg100(fn(rc, sc), title=f"Clozzy — {name}"))
        (OUT / f"{slug}-16.svg").write_text(svg100(fn(DEEP, DEEP, True), title=f"Clozzy — {name} 16px"))
        (OUT / f"{slug}-16-branco.svg").write_text(svg100(fn(WHITE, WHITE, True)))
        # tiles: o do print 14.31.06, agora com os traços à direita
        (OUT / f"{slug}-app-rosa.svg").write_text(app(fn(WHITE, WHITE), PINK))
        (OUT / f"{slug}-app-preto.svg").write_text(app(fn(PINK, WHITE), INK))
        (OUT / f"{slug}-app-roxo.svg").write_text(app(fn(WHITE, WHITE), PURPLE))
        (OUT / f"{slug}-app-branco.svg").write_text(app(fn(DEEP, DEEP), WHITE))
        (OUT / f"{slug}-lockup.svg").write_text(lockup(fn(DEEP, DEEP), INK))
        (OUT / f"{slug}-lockup-preto.svg").write_text(lockup(fn(PINK, WHITE), WHITE))


if __name__ == "__main__":
    build()
    print("ok", len(VARIANTS), "variações")

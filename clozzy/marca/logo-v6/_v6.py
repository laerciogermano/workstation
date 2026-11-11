#!/usr/bin/env python3
"""Clozzy — v6: o C com as duas pontas inteiras e a quebra tracejada no canto superior esquerdo.
Vãos maiores que o traço, para o tracejado continuar visível em 16–20 px.
Base: marca/refs (Círculo próximo + anel de story) e a v5 (../logo-v5). Paleta: preto, rosa, branco, roxo.
Rodar: python3 _v6.py → svg/"""
import math, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "identidade-nova"))
sys.path.insert(0, str(HERE.parent / "logo-2028"))
import _logos as LG  # noqa: E402
import _conceitos as R2  # noqa: E402

INK, PINK, WHITE, PURPLE = "#14090F", "#FF0065", "#FFFFFF", "#7C48C4"
DEEP = "#E0005A"      # rosa escuro — traço fino sobre branco
CREAM = "#FFF6F0"     # papel do documento

OUT = HERE / "svg"
OUT.mkdir(exist_ok=True)

OUTER = 45.0                 # raio externo (igual ao Círculo próximo)
W_MAIN, W_SMALL = 10.0, 12.0
C_LOW, C_TOP = -3.4, 327.4   # pontas visíveis do C (abertura de 54° centrada em −18°)
CORNER = 225.0               # canto superior esquerdo: entre 180° (esquerda) e 270° (topo)
# Nenhuma parte se repete: cada traço e cada vão tem a sua medida (unidades de arco).
DASHES = [9.0, 19.0, 13.0]           # traços, do lado esquerdo para o topo
GAPS = [6.0, 8.0, 6.5, 7.5]          # vãos: borda, entre traços, borda
DASHES_S = [12.0, 21.0]              # corte de 16–20 px
GAPS_S = [8.0, 10.5, 9.0]


def f(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def P(a, r):
    t = math.radians(a)
    return 50 + r * math.cos(t), 50 + r * math.sin(t)


def star(c):
    return (f'<polygon points="{LG.star_points()}" fill="{c}" stroke="{c}" '
            f'stroke-width="{LG.STAR_ROUND}" stroke-linejoin="round"/>')


def line(c, w, a0, a1):
    """Arco entre dois ângulos de eixo, pontas redondas, sentido horário."""
    rm = OUTER - w / 2
    a0, a1 = sorted((a0, a1))
    if a1 - a0 < 1e-6:
        x, y = P(a0, rm)
        return f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(w / 2)}" fill="{c}"/>'
    (x0, y0), (x1, y1) = P(a0, rm), P(a1, rm)
    return (f'<path d="M{f(x0)} {f(y0)}A{f(rm)} {f(rm)} 0 {1 if a1 - a0 > 180 else 0} 1 {f(x1)} {f(y1)}" '
            f'fill="none" stroke="{c}" stroke-width="{f(w)}" stroke-linecap="round"/>')


def c_v6(rc, w, dashes=None, gaps=None, center=CORNER, open_extra=0.0):
    """C com as duas pontas inteiras; o tracejado fica só no trecho centrado em `center`.
    `dashes` e `gaps` são listas de comprimentos visíveis (unidades de arco) — todas as partes diferentes.
    `gaps` tem um item a mais que `dashes`: entra também entre o arco cheio e o primeiro/último traço."""
    rm = OUTER - w / 2
    cap = math.degrees((w / 2) / rm)
    deg = lambda u: math.degrees(u / rm)  # noqa: E731
    low, top = C_LOW + open_extra, C_TOP - open_extra
    ds = list(dashes or DASHES)
    gs = list(gaps or GAPS)
    if len(gs) != len(ds) + 1:
        gs = (gs * (len(ds) + 1))[:len(ds) + 1]
    total = sum(ds) + sum(gs)
    start = center - deg(total) / 2
    out = line(rc, w, low + cap, start - cap)
    pos = start + deg(gs[0])
    for d, g in zip(ds, gs[1:]):
        out += line(rc, w, pos + cap, pos + deg(d) - cap)
        pos += deg(d) + deg(g)
    return out + line(rc, w, start + deg(total) + cap, top - cap)


def mk(dashes=None, gaps=None, center=CORNER, open_extra=0.0, dashes_s=None, gaps_s=None):
    def fn(rc=PINK, sc=PINK, small=False):
        if small:
            body = c_v6(rc, W_SMALL, dashes_s or DASHES_S, gaps_s or GAPS_S, center, open_extra)
        else:
            body = c_v6(rc, W_MAIN, dashes, gaps, center, open_extra)
        return body + star(sc)
    return fn


# ---------------------------------------------------------------- possibilidades
# Regra da v6: nenhum traço repete o tamanho de outro, e os vãos também variam.
CONCEPTS = [
    ("v6a-canto", "Quebra no canto", "Traços de 9, 19 e 13 e vãos de 6 a 8 no canto superior esquerdo. Nenhuma parte repete a outra; as duas pontas do C ficam inteiras.",
     mk()),
    ("v6b-dois", "Dois traços", "Só duas interrupções, uma curta e uma longa: a versão mais discreta.",
     mk([11.0, 21.0], [6.5, 8.0, 7.0])),
    ("v6c-quatro", "Quatro traços", "Quatro medidas diferentes: o canto fica mais picotado e lembra mais o anel de story.",
     mk([7.0, 15.0, 10.0, 19.0], [6.0, 7.5, 6.5, 8.0, 7.0])),
    ("v6d-vao-largo", "Vão largo", "Mesmos três traços com vãos de 8,5 a 10,5: a que melhor se segura em 16 px, mas abre mais o desenho.",
     mk(None, [8.5, 10.5, 9.0, 10.0], gaps_s=[10.0, 12.5, 11.0])),
    ("v6e-crescente", "Crescendo para o topo", "Os traços alongam na subida (8 · 14 · 22): a quebra tem direção, sem virar a progressão da v5.",
     mk([8.0, 14.0, 22.0], [6.0, 7.5, 6.5, 8.0])),
    ("v6f-mais-alto", "Mais perto do topo", "O mesmo trecho deslocado para 248°: a quebra fica entre o canto e a ponta de cima.",
     mk(center=248.0)),
]
C = {c[0]: c for c in CONCEPTS}
MAIN = "v6a-canto"

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

#!/usr/bin/env python3
"""Clozzy — rodada 9: C com as DUAS PONTAS INTEIRAS e um tracejado discreto no CANTO SUPERIOR ESQUERDO.
Estrela original do Círculo próximo (grid 100). Traço fino (9; os prints 14.03/14.05 mostram que o fino agrada).
Vãos um pouco maiores para o tracejado continuar visível em tamanho pequeno.
Refs: marca/refs (Círculo próximo 13.25.20, story 13.25.58/13.26.05, finos 14.03–14.15, lockups 14.14.29).
Rodar: python3 _canto.py → svg/"""
import math, shutil, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
MARCA = HERE.parent
sys.path.insert(0, str(MARCA / "identidade-nova"))
sys.path.insert(0, str(MARCA / "logo-2028"))
import _logos as LG  # noqa: E402
import _conceitos as R2  # noqa: E402

PINK, DEEP, PURPLE, INK, CREAM, WHITE = "#FF0065", "#E0005A", "#7C48C4", "#14090F", "#FFF6F0", "#FFFFFF"
OUT = HERE / "svg"
OUTER = 45.0
W_MAIN, W_SMALL = 9.0, 13.0
LOW, TOP = -3.4, 327.4          # pontas do C (visíveis): baixo-direita e cima-direita; abertura de 54° em −18°


def f(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def P(a, r):
    t = math.radians(a)
    return 50 + r * math.cos(t), 50 + r * math.sin(t)


def star(c):
    return (f'<polygon points="{LG.star_points()}" fill="{c}" stroke="{c}" '
            f'stroke-width="{LG.STAR_ROUND}" stroke-linejoin="round"/>')


def seg(c, w, a, b):
    """Trecho VISÍVEL de a até b (graus, horário), ponta redonda; curto demais vira ponto."""
    rm = OUTER - w / 2
    cap = math.degrees((w / 2) / rm)
    if b - a <= 2 * cap + 0.3:
        x, y = P((a + b) / 2, rm)
        return f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(w / 2)}" fill="{c}"/>'
    a0, a1 = a + cap, b - cap
    (x0, y0), (x1, y1) = P(a0, rm), P(a1, rm)
    return (f'<path d="M{f(x0)} {f(y0)}A{f(rm)} {f(rm)} 0 {1 if a1 - a0 > 180 else 0} 1 {f(x1)} {f(y1)}" fill="none" '
            f'stroke="{c}" stroke-width="{f(w)}" stroke-linecap="round"/>')


def c_with(pattern, center=228, gap=10, w=W_MAIN):
    """C cheio de LOW a TOP; no canto superior esquerdo (centro `center`°) entra `pattern` = comprimentos visíveis
    dos traços (0 = ponto) separados por vãos visíveis de `gap`°. Devolve lista de trechos visíveis."""
    rm = OUTER - w / 2
    dot = 2 * math.degrees((w / 2) / rm)
    lens = [dot if L == 0 else L for L in pattern]
    total = sum(lens) + gap * (len(lens) + 1)
    a = center - total / 2
    spans = [(LOW, a)]
    a += gap
    for L in lens:
        spans.append((a, a + L))
        a += L + gap
    spans.append((a, TOP))
    return spans


def make(pattern, gap, s_pattern, s_gap, center=228, w=W_MAIN, ws=W_SMALL):
    def fn(rc=DEEP, sc=None, small=False):
        sc = sc or rc
        if small:
            spans, ww = c_with(s_pattern, center, s_gap, ws), ws
        else:
            spans, ww = c_with(pattern, center, gap, w), w
        return "".join(seg(rc, ww, a, b) for a, b in spans) + star(sc)
    return fn


CONCEPTS = [
    # slug, nome, ideia, fn
    ("k1-dois-tracos", "Dois traços", "Pontas inteiras; no canto superior esquerdo o C se abre em dois traços curtos com vãos de 10°. Discreto, e ainda visível em 16 px.",
     make([18, 18], 10, [26], 20)),
    ("k2-um-traco", "Um traço", "O mínimo: um único traço solto no canto, com um vão de cada lado. Em tamanho pequeno vira só dois cortes.",
     make([24], 11, [28], 20)),
    ("k3-pontilhado", "Três pontos", "Três pontos no canto em vez de traços: o “…” de quem está digitando ou postando.",
     make([0, 0, 0], 9, [0, 0], 16)),
    ("k4-gradativo", "Ponto → traço", "Do ponto para o traço, no sentido horário (· –– ), e o C volta inteiro até a ponta.",
     make([0, 22], 10, [0, 26], 18)),
    ("k5-tres-tracos", "Três traços", "Três traços curtos: o canto lê mais como story, mas ainda longe das pontas.",
     make([16, 16, 16], 9, [22, 22], 16)),
    ("k6-vao-largo", "Vãos largos", "Dois traços com vãos de 14°: o mais legível em favicon e avatar pequeno.",
     make([18, 18], 14, [24], 24)),
]

USES = [   # slug, nome, fundo, anel, estrela, palavra
    ("deep", "Pink Deep", WHITE, DEEP, DEEP, INK), ("pink", "Rosa", WHITE, PINK, PINK, INK),
    ("preto", "Preto", WHITE, INK, INK, INK), ("roxo", "Roxo", WHITE, PURPLE, PURPLE, INK),
    ("rosa-estrela-roxa", "Rosa + estrela roxa", WHITE, PINK, PURPLE, INK), ("roxo-estrela-rosa", "Roxo + estrela rosa", WHITE, PURPLE, PINK, INK),
    ("preto-estrela-rosa", "Preto + estrela rosa", WHITE, INK, PINK, INK), ("rosa-estrela-preta", "Rosa + estrela preta", WHITE, PINK, INK, INK),
    ("branco-no-rosa", "Branco no rosa", PINK, WHITE, WHITE, WHITE), ("branco-no-roxo", "Branco no roxo", PURPLE, WHITE, WHITE, WHITE),
    ("branco-no-preto", "Branco no preto", INK, WHITE, WHITE, WHITE), ("rosa-no-preto", "Rosa no preto", INK, PINK, PINK, WHITE),
    ("rosa-no-roxo", "Rosa no roxo", PURPLE, PINK, PINK, WHITE), ("roxo-no-rosa", "Roxo no rosa", PINK, PURPLE, PURPLE, WHITE),
    ("branco-estrela-rosa-no-roxo", "Branco + estrela rosa no roxo", PURPLE, WHITE, PINK, WHITE),
    ("rosa-estrela-branca-no-preto", "Rosa + estrela branca no preto", INK, PINK, WHITE, WHITE),
    # pedido: círculo branco, estrela rosa, fundo preto — e outras
    ("branco-estrela-rosa-no-preto", "Branco + estrela rosa no preto", INK, WHITE, PINK, WHITE),
    ("branco-estrela-roxa-no-preto", "Branco + estrela roxa no preto", INK, WHITE, PURPLE, WHITE),
    ("roxo-estrela-rosa-no-preto", "Roxo + estrela rosa no preto", INK, PURPLE, PINK, WHITE),
    ("rosa-estrela-roxa-no-preto", "Rosa + estrela roxa no preto", INK, PINK, PURPLE, WHITE),
    ("rosa-estrela-branca-no-roxo", "Rosa + estrela branca no roxo", PURPLE, PINK, WHITE, WHITE),
    ("branco-estrela-preta-no-rosa", "Branco + estrela preta no rosa", PINK, WHITE, INK, WHITE),
    ("preto-estrela-branca-no-rosa", "Preto + estrela branca no rosa", PINK, INK, WHITE, INK),
    ("preto-estrela-rosa-no-cream", "Preto + estrela rosa no cream", CREAM, INK, PINK, INK),
]


def svg100(inner, size=256, title="Clozzy"):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="{size}" height="{size}">'
            f'<title>{title}</title>{inner}</svg>\n')


def app(inner, bg):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="256" height="256">'
            f'<rect width="100" height="100" rx="22.6" fill="{bg}"/><g transform="translate(17 17) scale(.66)">{inner}</g></svg>\n')


_WM = None


def lockup(inner, word, vertical=False):
    global _WM
    if _WM is None:
        _WM = LG.wordmark_paths()
    d, ww, asc, xh, desc = _WM
    if vertical:
        W = 150
        k = W / ww
        h = (asc - desc) * k
        body = (f'<g transform="translate({f((W - 100) / 2)} 0)">{inner}</g>'
                f'<g transform="translate(0 {f(114 + asc * k)}) scale({f(k)})"><path d="{d}" fill="{word}"/></g>')
        return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {f(W)} {f(114 + h)}" width="{f(W)}" height="{f(114 + h)}">{body}</svg>\n'
    sc = 52 / asc
    y = (100 - asc * sc) / 2 + 3
    body = f'{inner}<g transform="translate(116 {f(y + asc * sc)}) scale({f(sc)})"><path d="{d}" fill="{word}"/></g>'
    Wt = 116 + ww * sc
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {f(Wt)} 100" width="{f(Wt)}" height="100">{body}</svg>\n'


def build():
    shutil.rmtree(OUT, ignore_errors=True)
    OUT.mkdir()
    for slug, name, _idea, fn in CONCEPTS:
        (OUT / f"{slug}-color.svg").write_text(svg100(fn(), title=f"Clozzy — {name}"))
        (OUT / f"{slug}-dark.svg").write_text(svg100(fn(PINK)))
        (OUT / f"{slug}-16.svg").write_text(svg100(fn(DEEP, small=True)))
        (OUT / f"{slug}-16-dark.svg").write_text(svg100(fn(PINK, small=True)))
        for bgn, bg, rc, sc in (("rosa", PINK, WHITE, WHITE), ("roxo", PURPLE, WHITE, WHITE), ("preto", INK, PINK, PINK), ("branco", WHITE, DEEP, DEEP),
                                ("roxo-rosa", PURPLE, PINK, PINK), ("rosa-roxo", PINK, PURPLE, PURPLE),
                                ("preto-branco-rosa", INK, WHITE, PINK), ("preto-branco-roxo", INK, WHITE, PURPLE),
                                ("roxo-branco-rosa", PURPLE, WHITE, PINK), ("rosa-branco-preto", PINK, WHITE, INK),
                                ("cream-rosa-roxo", CREAM, PINK, PURPLE), ("preto-rosa-branco", INK, PINK, WHITE)):
            (OUT / f"{slug}-app-{bgn}.svg").write_text(app(fn(rc, sc), bg))
            (OUT / f"{slug}-app-{bgn}-16.svg").write_text(app(fn(rc, sc, small=True), bg))
        for u, _n, bg, rc, sc, wc in USES:
            (OUT / f"{slug}-uso-{u}.svg").write_text(svg100(fn(rc, sc)))
            (OUT / f"{slug}-uso-{u}-16.svg").write_text(svg100(fn(rc, sc, True)))
            (OUT / f"{slug}-uso-{u}-lockup.svg").write_text(lockup(fn(rc, sc), wc))
            (OUT / f"{slug}-uso-{u}-vertical.svg").write_text(lockup(fn(rc, sc), wc, True))


if __name__ == "__main__":
    build()
    print("ok", len(CONCEPTS), len(list(OUT.iterdir())), "svgs")

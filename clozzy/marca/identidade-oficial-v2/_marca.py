#!/usr/bin/env python3
"""Clozzy — identidade oficial v2: igual à identidade-oficial, com o ARCO MAIS GROSSO (9 → 11,5) para combinar com o Gabarito 800.
Logo = lockup EQUILIBRADO do logo-letreiro-v2 (símbolo da rodada 10 + Gabarito 800).
Aqui só entram as REGRAS DE COR do pedido de 2026-11-11 e a exportação dos SVGs.

Quatro versões de cor (superfície → palavra · anel · estrela):
  preto  INK     → branco · ROSA   · branco   (exceção: círculo rosa só com estrela branca)
  rosa   PINK    → branco · branco · branco   (nada preto no rosa)
  roxo   ROXO    → branco · branco · branco   (nada rosa no roxo)
  branco BRANCO  → ink    · Pink Deep · Pink Deep

Rodar: python3 _marca.py → svg/
"""
import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
MARCA = HERE.parent
sys.path.insert(0, str(MARCA / "logo-letreiro-v2"))
import _letreiro as T  # noqa: E402

K, LG = T.K, T.LG
f = K.f
PINK, DEEP, PURPLE, INK, CREAM, WHITE = T.PINK, T.DEEP, T.PURPLE, T.INK, T.CREAM, T.WHITE
LAVANDA, ROSA_SUAVE, MUTED = "#EBE3FA", "#FFD9E7", "#6B5A62"
# v2: arco mais grosso. Antes (identidade-oficial): espessura 9, vão 10°, corte pequeno 13. Depois: 11,5 / 11° / 15,5.
RING_W, RING_GAP, RING_WS = 11.5, 11, 15.5
SYM = K.make([16, 22], RING_GAP, [22, 28], 16, w=RING_W, ws=RING_WS)   # rodada 10 · d1 com o arco mais grosso
T.SYM = SYM                       # os lockups do letreiro v2 passam a usar este símbolo
HORIZ = T.LOCKUPS[1][3]           # k2-equilibrado: anel 1,4× o l, vão 0,35 l
STACK = T.K_empilhado             # k6
WORD = T.W_base

# slug, nome, fundo, palavra, anel, estrela
VERSOES = [
    ("preto", "Preto", INK, WHITE, PINK, WHITE),
    ("rosa", "Rosa", PINK, WHITE, WHITE, WHITE),
    ("roxo", "Roxo", PURPLE, WHITE, WHITE, WHITE),
    ("branco", "Branco", WHITE, INK, DEEP, DEEP),
]
V = {v[0]: v for v in VERSOES}

# uma cor só: slug, nome, cor do logo, fundos onde vale
UMA_COR = [
    ("ink", "Preto", INK, ("branco", "cream")),
    ("branco", "Branco", WHITE, ("preto", "rosa", "roxo")),
    ("roxo", "Roxo", PURPLE, ("branco", "cream")),
    ("rosa", "Rosa", DEEP, ("branco", "cream")),
]


def lum(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    c = [x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def contrast(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def sym_inner(rc, sc, small=False):
    return SYM(rc, sc, small)


def sym_svg(rc, sc, size=256, small=False, bg=None, pad=0.0, title="Clozzy"):
    v0, vw = 5 - pad, 90 + 2 * pad
    bgr = f'<rect x="{f(v0)}" y="{f(v0)}" width="{f(vw)}" height="{f(vw)}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(v0)} {f(v0)} {f(vw)} {f(vw)}" '
            f'width="{size}" height="{size}"><title>{title}</title>{bgr}{SYM(rc, sc, small)}</svg>\n')


def logo_svg(kind, wc, rc, sc, h=None, pad=0.0, bg=None):
    """kind: horizontal | empilhado | palavra | simbolo."""
    if kind == "simbolo":
        return sym_svg(rc, sc, size=h or 256, pad=pad / 10 if pad else 0, bg=bg)
    if kind == "palavra":
        w = WORD(wc)
    elif kind == "horizontal":
        w = HORIZ(wc, rc, sc)
    else:
        w = STACK(wc, rc, sc)
    return w.svg(pad=pad, h=h, bg=bg, title="Clozzy")


def versao_svg(kind, slug, h=None, pad=0.0, bg=False):
    _s, _n, b, wc, rc, sc = V[slug]
    return logo_svg(kind, wc, rc, sc, h=h, pad=pad, bg=b if bg else None)


def tile_svg(slug, size=1024, radius=22.37, scale=0.62, small=False):
    """Ícone de app: quadrado cheio (a loja aplica a máscara; `radius` só para prévia), símbolo a 62%."""
    _s, _n, b, wc, rc, sc = V[slug]
    o = 50 - 50 * scale
    rx = f' rx="{radius}"' if radius else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="{size}" height="{size}">'
            f'<title>Clozzy</title><rect width="100" height="100"{rx} fill="{b}"/>'
            f'<g transform="translate({f(o)} {f(o)}) scale({f(scale)})">{SYM(rc, sc, small)}</g></svg>\n')


def build(out=None):
    out = Path(out) if out else HERE / "svg"
    shutil.rmtree(out, ignore_errors=True)
    out.mkdir(parents=True)
    n = 0
    for slug, _nm, b, wc, rc, sc in VERSOES:
        for kind in ("horizontal", "empilhado", "palavra", "simbolo"):
            (out / f"logo-{kind}-{slug}.svg").write_text(versao_svg(kind, slug))
            (out / f"logo-{kind}-{slug}-placa.svg").write_text(versao_svg(kind, slug, pad=200 if kind != "simbolo" else 20, bg=True))
            n += 2
        (out / f"simbolo-pequeno-{slug}.svg").write_text(sym_svg(rc, sc, small=True))
        (out / f"app-icon-{slug}.svg").write_text(tile_svg(slug))
        n += 2
    for slug, _nm, c, _onde in UMA_COR:
        for kind in ("horizontal", "empilhado", "simbolo"):
            (out / f"logo-{kind}-1cor-{slug}.svg").write_text(logo_svg(kind, c, c, c))
            n += 1
    (out / "favicon.svg").write_text(tile_svg("rosa", 32, radius=8, scale=0.74, small=True))
    return n + 1


if __name__ == "__main__":
    print("ok", build(), "svgs")

#!/usr/bin/env python3
"""Clozzy — Identidade visual v2: masters do logo.
Símbolo = rodada 8 · “1 · Sutil · vão 5” (marca/logo-tracos-sutis): C do Círculo próximo + estrela original,
ponta  ·  –  ––  → C, espessura constante 10 (grid 100), vão 5. Wordmark Gabarito 800 (identidade-nova/_logos.py).
Rodar: python3 _marca.py → logos/*.svg"""
import importlib.util, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
MARCA = HERE.parent
sys.path.insert(0, str(MARCA / "identidade-nova"))
sys.path.insert(0, str(MARCA / "logo-2028"))
sys.path.insert(0, str(MARCA / "logo-tracos-sutis"))
import _logos  # noqa: E402
import _sutis as S  # noqa: E402

OUT = HERE / "logos"
PINK, DEEP, PURPLE, INK, CREAM, WHITE = S.PINK, S.DEEP, S.PURPLE, S.INK, S.CREAM, S.WHITE
SYM = {c[0]: c for c in S.CONCEPTS}["s1-vao-5"][3]     # fn(ring, star, small)


def f(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def symbol(rc=DEEP, sc=None, small=False):
    return SYM(rc, sc or rc, small)


def svg(inner, w, h, vb=None, title="Clozzy"):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb or f"0 0 {f(w)} {f(h)}"}" width="{f(w)}" height="{f(h)}" '
            f'role="img" aria-label="Clozzy"><title>{title}</title>{inner}</svg>\n')


_WM = None


def wm():
    global _WM
    if _WM is None:
        _WM = _logos.wordmark_paths()
    return _WM


def lockup_h(rc=DEEP, sc=None, word=INK):
    """Horizontal: símbolo 100, altura do “l” = 52% do símbolo, respiro 16."""
    d, ww, asc, xh, desc = wm()
    sc_w = 52 / asc
    gap = 16
    y = (100 - asc * sc_w) / 2 + 3
    inner = (f'{symbol(rc, sc)}<g transform="translate({f(100 + gap)} {f(y + asc * sc_w)}) scale({f(sc_w)})">'
             f'<path d="{d}" fill="{word}"/></g>')
    return svg(inner, 100 + gap + ww * sc_w, 100)


def lockup_v(rc=DEEP, sc=None, word=INK):
    """Empilhado: símbolo 100 centrado sobre o wordmark (largura 150)."""
    d, ww, asc, xh, desc = wm()
    W = 150
    k = W / ww
    gap = 14
    h_word = (asc - desc) * k
    inner = (f'<g transform="translate({f((W - 100) / 2)} 0)">{symbol(rc, sc)}</g>'
             f'<g transform="translate(0 {f(100 + gap + asc * k)}) scale({f(k)})"><path d="{d}" fill="{word}"/></g>')
    return svg(inner, W, 100 + gap + h_word)


def wordmark(word=INK):
    d, ww, asc, xh, desc = wm()
    return svg(f'<g transform="translate(0 {f(asc)})"><path d="{d}" fill="{word}"/></g>', ww, asc - desc)


def app_icon(bg, rc, sc=None):
    return svg(f'<rect width="100" height="100" rx="22.6" fill="{bg}"/><g transform="translate(17 17) scale(.66)">{symbol(rc, sc)}</g>', 100, 100)


def avatar(bg=DEEP, rc=WHITE):
    return svg(f'<circle cx="50" cy="50" r="50" fill="{bg}"/><g transform="translate(20 20) scale(.6)">{symbol(rc)}</g>', 100, 100)


VARIANTS = {   # nome: (anel, estrela, palavra, fundo de uso)
    "deep": (DEEP, DEEP, INK, WHITE), "pink": (PINK, PINK, INK, WHITE), "ink": (INK, INK, INK, WHITE),
    "roxo": (PURPLE, PURPLE, INK, WHITE), "rosa-estrela-roxa": (PINK, PURPLE, INK, WHITE),
    "branco": (WHITE, WHITE, WHITE, INK), "pink-no-ink": (PINK, PINK, WHITE, INK),
    "pink-estrela-branca": (PINK, WHITE, WHITE, INK),
}


def build():
    OUT.mkdir(exist_ok=True)
    for name, (rc, sc, word, _bg) in VARIANTS.items():
        (OUT / f"simbolo-{name}.svg").write_text(svg(symbol(rc, sc), 100, 100))
        (OUT / f"lockup-horizontal-{name}.svg").write_text(lockup_h(rc, sc, word))
        (OUT / f"lockup-vertical-{name}.svg").write_text(lockup_v(rc, sc, word))
    for name, (rc, sc) in {"deep": (DEEP, DEEP), "pink": (PINK, PINK), "ink": (INK, INK), "branco": (WHITE, WHITE)}.items():
        (OUT / f"simbolo-16-{name}.svg").write_text(svg(symbol(rc, sc, True), 100, 100))
    for name, c in {"ink": INK, "branco": WHITE, "deep": DEEP}.items():
        (OUT / f"wordmark-{name}.svg").write_text(wordmark(c))
    for name, (bg, rc) in {"rosa": (PINK, WHITE), "deep": (DEEP, WHITE), "roxo": (PURPLE, WHITE), "ink": (INK, PINK), "branco": (WHITE, DEEP)}.items():
        (OUT / f"app-icon-{name}.svg").write_text(app_icon(bg, rc))
    (OUT / "favicon.svg").write_text(svg(symbol(DEEP, DEEP, True), 100, 100))
    (OUT / "avatar-social.svg").write_text(avatar())
    (OUT / "avatar-social-ink.svg").write_text(avatar(INK, PINK))
    return sorted(p.name for p in OUT.iterdir())


if __name__ == "__main__":
    print(len(build()), "svgs")

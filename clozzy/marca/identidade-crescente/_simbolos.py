#!/usr/bin/env python3
"""Clozzy — identidade visual “Crescente” (rodada 15).
Duas versões do símbolo, mesma estrela da logo final v3 no meio:
- CRESCENTE (principal): do topo, no sentido horário, 7 traços que crescem (2° → 30°) até virar linha cheia
  — o anel do story carregando (vem da rodada 14, `logo-carregando/`).
- GIRO (secundária): o mesmo crescimento repetido 3× em volta do anel (ponto · traço · linha, a cada 120°),
  simetria de rotação — lê como algo girando. Para motion, loader, estampas e peças de energia.
Palavra Gabarito 800 sempre AO LADO ou EMBAIXO, nunca fundida. Cores: só a paleta Clozzy + regras de combinação.
Rodar: python3 _simbolos.py → svg/"""
import math, shutil, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "logo-carregando"))
import _carregando as C  # noqa: E402

OUT = HERE / "svg"
PINK, DEEP, PURPLE, INK, CREAM, WHITE = C.PINK, C.DEEP, C.PURPLE, C.INK, C.CREAM, C.WHITE
f, arc, star = C.f, C.arc, C.star
VARS, V = C.VARS, C.V

# ---------- GIRO --------------------------------------------------------------------------------------
G_W, G_RM, G_LENS, G_GAP = 8.0, 41.0, [2, 7], 8.5
G_W_SM, G_LENS_SM, G_GAP_SM = 11.0, [8], 13.0


def giro_ring(c, small=False):
    w, lens, gap = (G_W_SM, G_LENS_SM, G_GAP_SM) if small else (G_W, G_LENS, G_GAP)
    rm = 45 - w / 2 if small else G_RM
    cap = math.degrees(w / rm)
    out = []
    for k in range(3):
        s = -90 + k * 120
        a = s + gap / 2
        for L in lens:
            out.append(arc(c, w, rm, a, a + L + cap))
            a += L + cap + gap
        out.append(arc(c, w, rm, a, s + 120 - gap / 2))
    return "".join(out)


def mark(kind, v, small=False, spin=False):
    v = V[v] if isinstance(v, str) else v
    if kind == "crescente":
        return C.mark(v, small, spin)
    cls = ' class="ring"' if spin else ""
    ring_c = v["line"] or PINK
    if v.get("grad"):
        ring_c = PINK
    if v["slug"] == "preto-bicolor":
        ring_c = PINK
    return f'<g{cls}>{giro_ring(ring_c, small)}</g>' + star(v["star"], C.STAR_FIT if not small else 23.5)


# ---------- assinaturas ------------------------------------------------------------------------------
WD, WW, LH, YD = C.WD, C.WW, C.LH, C.YD


def lockup(kind, v, vertical=False, spin=False):
    """(miolo, w, h). Horizontal: anel = 1,4 × altura do l, vão 0,35 l. Empilhado: l = 0,42 do anel."""
    v = V[v] if isinstance(v, str) else v
    m = mark(kind, v, spin=spin)
    if not vertical:
        lh = 90 / 1.4
        s = lh / LH
        x0 = 90 + 0.35 * lh
        word = f'<path transform="translate({f(x0)} {f(45 + lh / 2)}) scale({s:.5f})" d="{WD}" fill="{v["word"]}"/>'
        return f'<g transform="translate(-5 -5)">{m}</g>{word}', x0 + WW * s, 90
    lh = 90 * 0.42
    s = lh / LH
    ww = WW * s
    base = 90 + 0.3 * lh + lh
    w = max(90, ww)
    word = f'<path transform="translate({f((w - ww) / 2)} {f(base)}) scale({s:.5f})" d="{WD}" fill="{v["word"]}"/>'
    return f'<g transform="translate({f((w - 90) / 2 - 5)} -5)">{m}</g>{word}', w, base - YD * s


def svg_sym(kind, v, size=256, bg=True, pad=6, small=False):
    v = V[v] if isinstance(v, str) else v
    inner = f'<g transform="translate(-5 -5)">{mark(kind, v, small)}</g>'
    return C.svg_wrap(inner, 90, 90, v["bg"] if bg else None, pad, size)


def svg_lockup(kind, v, vertical=False, size_w=1200, bg=True):
    v = V[v] if isinstance(v, str) else v
    inner, w, h = lockup(kind, v, vertical)
    return C.svg_wrap(inner, w, h, v["bg"] if bg else None, 14, size_w)


def svg_tile(kind, v, size=1024, radius=22.37, scale=0.62):
    v = V[v] if isinstance(v, str) else v
    o = 50 - 50 * scale
    rx = f' rx="{radius}"' if radius else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="{size}" height="{size}">'
            f'<title>Clozzy</title><rect width="100" height="100"{rx} fill="{v["bg"]}"/>'
            f'<g transform="translate({f(o)} {f(o)}) scale({f(scale)})">{mark(kind, v)}</g></svg>\n')


def svg_animated(kind, v, size=512, dur=2.4):
    v = V[v] if isinstance(v, str) else v
    m = mark(kind, v, spin=True).replace(
        '<g class="ring">', f'<g><animateTransform attributeName="transform" type="rotate" from="0 50 50" '
                            f'to="360 50 50" dur="{dur}s" repeatCount="indefinite"/>', 1)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="{size}" height="{size}">'
            f'<title>Clozzy</title><rect width="100" height="100" fill="{v["bg"]}"/>{m}</svg>\n')


MAIN_COLORS = ["preto", "rosa", "deep", "roxo", "cream", "branco", "mono-ink", "mono-branco"]


def build():
    shutil.rmtree(OUT, ignore_errors=True)
    n = 0
    for kind in ("crescente", "giro"):
        d = OUT / kind
        d.mkdir(parents=True)
        cols = [v["slug"] for v in VARS] if kind == "crescente" else MAIN_COLORS
        for s in cols:
            (d / f"{kind}-simbolo-{s}.svg").write_text(svg_sym(kind, s))
            (d / f"{kind}-simbolo-pequeno-{s}.svg").write_text(svg_sym(kind, s, 64, small=True))
            (d / f"{kind}-horizontal-{s}.svg").write_text(svg_lockup(kind, s))
            (d / f"{kind}-empilhado-{s}.svg").write_text(svg_lockup(kind, s, True, 800))
            n += 4
        for s in ("preto", "branco", "mono-branco"):
            (d / f"{kind}-simbolo-{s}-transparente.svg").write_text(svg_sym(kind, s, bg=False))
            n += 1
        for s in ("rosa", "preto", "roxo"):
            (d / f"{kind}-app-icon-{s}.svg").write_text(svg_tile(kind, s))
            (d / f"{kind}-animado-{s}.svg").write_text(svg_animated(kind, s))
            n += 2
    return n


if __name__ == "__main__":
    print("ok", build(), "svgs")

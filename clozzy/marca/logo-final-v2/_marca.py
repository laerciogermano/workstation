#!/usr/bin/env python3
"""Clozzy — LOGO FINAL (compilado das rodadas 1–11).

O que entra de cada rodada:
- forma: o C do v7 (c1-c-120): linha cheia em 240° e 3 traços só na abertura da direita (prints 14.03.10 e 14.31.06 invertido)
- traços com cantos arredondados (v4), poucos e longos para não virarem bolinhas
- anel grosso: 9,5 no grid 100 (≈ 24/256, a direção do “anel de story tracejado e grosso”)
- estrela original do Círculo próximo, inscrita no círculo central r 21 (v2: pontas tocam a borda, R ≈ 18,7)
- palavra Gabarito 800, aperto −18, SEMPRE separada do símbolo (lockup k2 e empilhado k6)
- corte pequeno (≤ 32 px): anel 13, 2 traços, estrela um pouco maior
- regras de cor: no preto arco rosa + estrela branca + palavra branca; no rosa/Deep/roxo tudo branco;
  no claro palavra ink + símbolo Pink Deep; nada preto no rosa; rosa e roxo nunca um sobre o outro.

Rodar: python3 _marca.py → svg/ ; depois python3 _build.py → png/, social/, manual."""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
MARCA = HERE.parent
sys.path.insert(0, str(MARCA / "logo-letreiro-v7"))
import _simbolo as SB  # noqa: E402
import _letreiro as T  # noqa: E402

K = T.K
f = K.f
PINK, DEEP, PURPLE, INK, CREAM, WHITE = T.PINK, T.DEEP, T.PURPLE, T.INK, T.CREAM, T.WHITE

RING, DASHES, OPEN, DUTY = 9.5, 3, 120.0, 0.72
# v2: a estrela cabe EXATAMENTE no círculo central (r 21): as 5 pontas, já com o canto redondo, tocam a borda e nunca passam.
# O canto redondo é um contorno de espessura STAR_ROUND·R/20,5, que avança meia espessura além do vértice:
# alcance = R · (1 + STAR_ROUND / (2 · 20,5)) → R = CIRCULO / esse fator.
CIRCULO = 21.0
STAR = CIRCULO / (1 + SB.LG.STAR_ROUND / (2 * SB.LG.STAR_R))


def _make():
    def fn(rc=DEEP, sc=None, small=False):
        sc = sc or rc
        w, n = (13, 2) if small else (RING, DASHES)
        return SB.ring_c(rc, w, n, OPEN, DUTY) + SB.star(sc, STAR)   # mesma estrela no corte pequeno: nunca sai do círculo
    return fn


SYM = _make()
T.SYM = SYM            # os lockups do v7 passam a usar o símbolo final

OUT = HERE / "svg"

LOCKUP_H = T.LOCKUPS[1][3]     # k2-equilibrado: anel 1,4× o l, vão 0,35 l
LOCKUP_V = T.LOCKUPS[5][3]     # k6-empilhado
WORD = T.W_base

# slug, nome, fundo, palavra, anel, estrela
FUNDOS = [
    ("preto", "Preto · principal", INK, WHITE, PINK, WHITE),
    ("rosa", "Rosa · tudo branco", PINK, WHITE, WHITE, WHITE),
    ("deep", "Pink Deep · tudo branco", DEEP, WHITE, WHITE, WHITE),
    ("roxo", "Roxo · tudo branco", PURPLE, WHITE, WHITE, WHITE),
    ("cream", "Cream", CREAM, INK, DEEP, DEEP),
    ("branco", "Branco", WHITE, INK, DEEP, DEEP),
    ("mono-branco", "Uma cor · branco", INK, WHITE, WHITE, WHITE),
    ("mono-ink", "Uma cor · ink", WHITE, INK, INK, INK),
]
FUNDO = {x[0]: x for x in FUNDOS}


def sym_svg(rc, sc, size=256, small=False, bg=None, pad=0.0, title="Clozzy"):
    """Símbolo no grid 100 (anel 5..95). `pad` em unidades do grid em volta do anel."""
    v0, vw = 5 - pad, 90 + 2 * pad
    bgr = f'<rect x="{f(v0)}" y="{f(v0)}" width="{f(vw)}" height="{f(vw)}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(v0)} {f(v0)} {f(vw)} {f(vw)}" width="{size}" height="{size}">'
            f'<title>{title}</title>{bgr}{SYM(rc, sc, small)}</svg>\n')


def tile_svg(bg, rc, sc, size=1024, radius=22.37, scale=0.62, small=False):
    """Ícone de app: quadrado (iOS aplica a máscara; `radius` só para prévia) com o símbolo a 62% — dentro da área segura."""
    s = scale
    o = 50 - 50 * s
    rx = f' rx="{radius}"' if radius else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="{size}" height="{size}">'
            f'<title>Clozzy</title><rect width="100" height="100"{rx} fill="{bg}"/>'
            f'<g transform="translate({f(o)} {f(o)}) scale({f(s)})">{SYM(rc, sc, small)}</g></svg>\n')


def avatar_svg(bg, rc, sc, size=1080):
    """Foto de perfil: quadrado cheio (as redes cortam em círculo); símbolo a 58% fica dentro do círculo com folga."""
    return tile_svg(bg, rc, sc, size, radius=0, scale=0.58)


def lockup_svg(kind, fundo, pad=0.0, bg=False, h=None):
    _s, n, b, wc, rc, sc = FUNDO[fundo]
    fn = LOCKUP_H if kind == "horizontal" else LOCKUP_V
    if kind == "palavra":
        return WORD(wc).svg(pad=pad, bg=b if bg else None, h=h, title="Clozzy")
    return fn(wc, rc, sc).svg(pad=pad, bg=b if bg else None, h=h, title="Clozzy")


def build():
    import shutil
    shutil.rmtree(OUT, ignore_errors=True)
    OUT.mkdir()
    n = 0
    for s, _n, b, wc, rc, sc in FUNDOS:
        (OUT / f"simbolo-{s}.svg").write_text(sym_svg(rc, sc))
        (OUT / f"simbolo-pequeno-{s}.svg").write_text(sym_svg(rc, sc, small=True))
        for kind in ("horizontal", "empilhado", "palavra"):
            (OUT / f"logo-{kind}-{s}.svg").write_text(lockup_svg(kind, s))
            n += 1
        n += 2
    # ícones e avatares (fundo de cor + marca)
    for s in ("rosa", "preto", "roxo", "deep"):
        _s, _n, b, wc, rc, sc = FUNDO[s]
        (OUT / f"app-icon-{s}.svg").write_text(tile_svg(b, rc, sc))
        (OUT / f"avatar-{s}.svg").write_text(avatar_svg(b, rc, sc))
        n += 2
    b, rc, sc = PINK, WHITE, WHITE
    (OUT / "favicon.svg").write_text(tile_svg(b, rc, sc, 32, radius=20, scale=0.72, small=True))
    return n + 1


if __name__ == "__main__":
    print("ok", build(), "svgs")

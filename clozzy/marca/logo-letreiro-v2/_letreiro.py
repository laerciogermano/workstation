#!/usr/bin/env python3
"""Clozzy — rodada 11 v2: LETREIRO + LOCKUP com o símbolo SEMPRE SEPARADO da palavra.
Regra do usuário (2026-11-11): nunca misturar o C do símbolo com o “c” de clozzy. A v1 (../logo-letreiro/) fundia os dois e foi rejeitada.
Símbolo = rodada 10 (logo-c-canto-v2, d1) sem alteração. Do RolêGo v4 ficam: cores separadas para palavra e símbolo, superfície
de cor com marca branca, família lockup → empilhado → símbolo → ícone.
Rodar: python3 _letreiro.py → svg/"""
import math, shutil, sys
from functools import lru_cache
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

HERE = Path(__file__).resolve().parent
MARCA = HERE.parent
sys.path.insert(0, str(MARCA / "logo-c-canto-v2"))
sys.path.insert(0, str(MARCA / "identidade-nova"))
sys.path.insert(0, str(MARCA / "logo-2028"))
import _canto as K  # noqa: E402
import _logos as LG  # noqa: E402

PINK, DEEP, PURPLE, INK, CREAM, WHITE = K.PINK, K.DEEP, K.PURPLE, K.INK, K.CREAM, K.WHITE
FONT = MARCA / "identidade-nova" / "fonts" / "Gabarito-Variable.ttf"
OUT = HERE / "svg"
f = K.f


# ------------------------------------------------------------------ símbolo (grid 100, anel externo 45)
def symbol(rc=DEEP, sc=None, w=9.0, star_r=18.0, pattern=(16, 22), gap=10, star=True):
    """Símbolo da rodada 10 com traço `w` e estrela `star_r` ajustáveis (para casar com o peso das letras)."""
    sc = sc or rc
    body = "".join(K.seg(rc, w, a, b) for a, b in K.c_with(list(pattern), 228, gap, w))
    if star:
        k = star_r / LG.STAR_R
        body += (f'<polygon points="{LG.star_points(R=star_r)}" fill="{sc}" stroke="{sc}" '
                 f'stroke-width="{f(LG.STAR_ROUND * k)}" stroke-linejoin="round"/>')
    return body


def star_at(cx, cy, R, c):
    pts = LG.star_points(cx=cx, cy=cy, R=R)
    return (f'<polygon points="{pts}" fill="{c}" stroke="{c}" stroke-width="{f(LG.STAR_ROUND * R / LG.STAR_R)}" '
            f'stroke-linejoin="round"/>')


# ------------------------------------------------------------------ fonte
@lru_cache(None)
def font(wght):
    return instantiateVariableFont(TTFont(FONT), {"wght": wght})


@lru_cache(None)
def glyph(ch, wght):
    """(path y-para-baixo em unidades 1000, avanço, bounds y-para-baixo)."""
    ft = font(wght)
    gs, cm = ft.getGlyphSet(), ft.getBestCmap()
    g = cm[ord(ch)]
    pen = SVGPathPen(gs)
    gs[g].draw(TransformPen(pen, (1, 0, 0, -1, 0, 0)))
    bp = BoundsPen(gs)
    gs[g].draw(bp)
    x0, y0, x1, y1 = bp.bounds
    return pen.getCommands(), ft["hmtx"][g][0], (x0, -y1, x1, -y0)


ASC, XH = 681.0, 489.0   # altura do l e da letra x (iguais em todos os pesos)


def stem(wght):
    x0, _, x1, _ = glyph("l", wght)[2]
    return x1 - x0


# ------------------------------------------------------------------ montagem
class Word:
    """Monta uma linha: letras (com cor própria) e peças livres. Unidades da fonte; linha de base em y = 0."""

    def __init__(self, wght=800, track=-18, skew=0):
        self.wght, self.track, self.skew = wght, track, skew
        self.x, self.parts, self.box = 0.0, [], [1e9, 1e9, -1e9, -1e9]

    def _grow(self, x0, y0, x1, y1):
        b = self.box
        b[0], b[1], b[2], b[3] = min(b[0], x0), min(b[1], y0), max(b[2], x1), max(b[3], y1)

    def letter(self, ch, color, kern=0, extra=""):
        d, adv, (x0, y0, x1, y1) = glyph(ch, self.wght)
        self.x += kern
        sk = f" skewX({-self.skew})" if self.skew else ""
        self.parts.append(f'<g transform="translate({f(self.x)} 0){sk}"><path d="{d}" fill="{color}"/>{extra}</g>')
        lean = math.tan(math.radians(self.skew)) * (-y0) if self.skew else 0
        self._grow(self.x + x0, y0, self.x + x1 + lean, y1)
        self.x += adv + self.track
        return self

    def text(self, s, color, **kw):
        for ch in s:
            self.letter(ch, color, **kw)
        return self

    def piece(self, inner, D, color_unused=None, bottom=12, lsb=10, rsb=10, grid_box=(5, 95)):
        """Coloca um desenho do grid 100 (anel 5..95) com diâmetro D, base em y = bottom (overshoot)."""
        s = D / (grid_box[1] - grid_box[0])
        self.x += lsb
        tx, ty = self.x - grid_box[0] * s, bottom - grid_box[1] * s
        self.parts.append(f'<g transform="translate({f(tx)} {f(ty)}) scale({f(s)})">{inner}</g>')
        self._grow(self.x, bottom - D, self.x + D, bottom)
        self.x += D + rsb + self.track
        return self

    def raw(self, svg, box):
        self.parts.append(svg)
        self._grow(*box)
        return self

    def svg(self, pad=0.0, h=None, bg=None, title="Clozzy"):
        x0, y0, x1, y1 = self.box
        w, hh = x1 - x0 + 2 * pad, y1 - y0 + 2 * pad
        vb = f"{f(x0 - pad)} {f(y0 - pad)} {f(w)} {f(hh)}"
        H = h or 100
        W = H * w / hh
        bgr = f'<rect x="{f(x0 - pad)}" y="{f(y0 - pad)}" width="{f(w)}" height="{f(hh)}" fill="{bg}"/>' if bg else ""
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{f(W)}" height="{f(H)}">'
                f'<title>{title}</title>{bgr}{"".join(self.parts)}</svg>\n')


# ------------------------------------------------------------------ LETREIROS (só tipografia)
def counter_star(color, wght=800):
    """Estrela dentro do contador da letra o (contador preenchido — tendência LogoLounge 2026)."""
    x0, y0, x1, y1 = glyph("o", wght)[2]
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2 + 6
    R = {800: 128, 700: 136, 600: 142}.get(wght, 128)
    k = R / LG.STAR_R
    pts = LG.star_points(cx=cx, cy=cy, R=R)
    return (f'<polygon points="{pts}" fill="{color}" stroke="{color}" stroke-width="{f(LG.STAR_ROUND * k)}" '
            f'stroke-linejoin="round"/>')


def W_base(wc=INK, ac=None, wght=800):
    return Word(wght).text("clozzy", wc)


def W_estrela_o(wc=INK, ac=DEEP, wght=800):
    w = Word(wght).text("cl", wc)
    w.letter("o", wc, extra=counter_star(ac, wght))
    return w.text("zzy", wc)


def W_zz(wc=INK, ac=DEEP, wght=800):
    """zz em ligadura: o segundo z encosta no primeiro e as diagonais viram uma faixa só."""
    w = Word(wght).text("clo", wc)
    w.letter("z", wc)
    w.letter("z", ac, kern=-96)
    return w.letter("y", wc, kern=-10)


def W_italico(wc=INK, ac=None, wght=800):
    return Word(wght, track=-24, skew=9).text("clozzy", wc)


def W_leve(wc=INK, ac=None, wght=500):
    return Word(wght, track=-10).text("clozzy", wc)


def W_clo_zzy(wc=INK, ac=DEEP, wght=800):
    return Word(wght).text("clo", wc).text("zzy", ac)


def W_estrela_y(wc=INK, ac=DEEP, wght=800):
    """Estrela de expoente depois do y — o “✦” do Close Friends."""
    w = Word(wght).text("clozzy", wc)
    R = 92
    cx, cy = w.x + 70, -ASC + R * 0.95
    return w.raw(star_at(cx, cy, R, ac), (cx - R, cy - R, cx + R, cy + R))


LETREIROS = [   # slug, nome, ideia, fn
    ("l1-base", "Base", "Gabarito 800, aperto −18. Ponto de partida: firme, arredondada, legível em 16 px.", W_base),
    ("l2-estrela-no-o", "Estrela no o", "O contador do o recebe a estrela do símbolo. Uma letra só carrega a ideia; o resto fica quieto.", W_estrela_o),
    ("l3-zz-ligado", "zz ligado", "Os dois z encostam e viram uma faixa contínua: “close” + “cozy”, o par que se aproxima.", W_zz),
    ("l4-estrela-expoente", "Estrela expoente", "clozzy✦: a estrela sobe como expoente, como o selo do Close Friends.", W_estrela_y),
    ("l5-clo-zzy", "clo · zzy", "Duas cores: “clo” (close) e “zzy”. Como Rolê/Go no RolêGo, as duas partes nunca na mesma cor.", W_clo_zzy),
    ("l6-italico", "Itálico 9°", "Inclinação de 9°: movimento estático, a marca “indo” para o fã. Para campanha e motion.", W_italico),
    ("l7-leve", "Leve 500", "Mesmo desenho em peso 500, para tamanhos grandes (outdoor, capa). Família responsiva: 800 no pequeno, 500 no grande.", W_leve),
]


# ------------------------------------------------------------------ LOCKUPS (símbolo sempre separado da palavra)
SYM = K.make([16, 22], 10, [22, 28], 16)     # rodada 10 · d1, sem alteração


def lockup(word_fn, scale, gap):
    """Símbolo à esquerda, palavra à direita. `scale` = diâmetro do anel / altura do l; centrado na altura do l.
    `gap` = espaço entre anel e palavra, em fração da altura do l."""
    def fn(wc=INK, sc=DEEP, star=None, wght=800):
        D = ASC * scale
        bottom = (D - ASC) / 2 + 8
        w = Word(wght)
        w.piece(SYM(sc, star or sc), D, bottom=bottom, lsb=0, rsb=ASC * gap)
        return word_fn(w, wc, sc)
    return fn


def _base(w, wc, sc):
    return w.text("clozzy", wc)


def _leve(w, wc, sc):
    w.wght, w.track = 500, -10
    return w.text("clozzy", wc)


def _italico(w, wc, sc):
    w.skew, w.track = 9, -24
    return w.text("clozzy", wc)


def _clo_zzy(w, wc, sc):
    return w.text("clo", wc).text("zzy", sc)


def K_empilhado(wc=INK, sc=DEEP, star=None, wght=800):
    w = Word(wght).text("clozzy", wc)
    x0, y0, x1, y1 = w.box
    D = (x1 - x0) * 0.46
    s = D / 90
    top = y0 - D - ASC * 0.3
    w.raw(f'<g transform="translate({f(x0 + (x1 - x0 - D) / 2 - 5 * s)} {f(top - 5 * s)}) scale({f(s)})">{SYM(sc, star or sc)}</g>',
          (x0, top, x1, y1))
    return w


LOCKUPS = [   # slug, nome, ideia, fn
    ("k1-compacto", "Compacto", "Anel do tamanho do l, vão de 0,3 l. O mais discreto: o símbolo acompanha a palavra.", lockup(_base, 1.0, 0.3)),
    ("k2-equilibrado", "Equilibrado", "Anel 1,4× a altura do l, centrado nas letras, vão de 0,35 l. O símbolo e a palavra pesam parecido.", lockup(_base, 1.4, 0.35)),
    ("k3-simbolo-grande", "Símbolo grande", "Anel 1,75× (a proporção da rodada 10). O símbolo manda e a palavra assina.", lockup(_base, 1.75, 0.4)),
    ("k4-leve", "Com letreiro leve", "Equilibrado com a palavra em peso 500: mais editorial, para capa e tamanho grande.", lockup(_leve, 1.4, 0.35)),
    ("k5-clo-zzy", "Com clo · zzy", "Equilibrado com “zzy” na cor do símbolo: o símbolo e o fim da palavra se respondem.", lockup(_clo_zzy, 1.4, 0.35)),
    ("k6-empilhado", "Empilhado", "Símbolo em cima, palavra embaixo, centrados. Para splash, ecobag e espaço quadrado.", K_empilhado),
]
SIMBOLOS = LOCKUPS   # compatibilidade com _build.py


# fundos — regra “palavra numa cor, símbolo em outra” (versões de uma cor são a exceção)
FUNDOS = [   # slug, nome, fundo, palavra, símbolo, estrela
    ("rosa", "Rosa · principal", PINK, WHITE, INK, INK),
    ("preto", "Preto", INK, WHITE, PINK, PINK),
    ("cream", "Cream", CREAM, INK, DEEP, DEEP),
    ("roxo", "Roxo", PURPLE, WHITE, PINK, PINK),
    ("preto-branco-rosa", "Preto · anel branco + estrela rosa", INK, WHITE, WHITE, PINK),
    ("roxo-branco-rosa", "Roxo · anel branco + estrela rosa", PURPLE, WHITE, WHITE, PINK),
    ("branco", "Branco", WHITE, INK, DEEP, DEEP),
    ("mono-branco", "Uma cor · branco", PINK, WHITE, WHITE, WHITE),
    ("mono-ink", "Uma cor · ink", WHITE, INK, INK, INK),
]


def build():
    shutil.rmtree(OUT, ignore_errors=True)
    OUT.mkdir()
    n = 0
    for slug, _n, _i, fn in LETREIROS:
        for fs, _fn, bg, wc, sc, st in FUNDOS:
            (OUT / f"{slug}-{fs}.svg").write_text(fn(wc, sc).svg(title=f"Clozzy — {_n}"))
            (OUT / f"{slug}-{fs}-placa.svg").write_text(fn(wc, sc).svg(pad=200, bg=bg))
            n += 2
    for slug, _n, _i, fn in SIMBOLOS:
        for fs, _fn, bg, wc, sc, st in FUNDOS:
            (OUT / f"{slug}-{fs}.svg").write_text(fn(wc, sc, st).svg(title=f"Clozzy — {_n}"))
            (OUT / f"{slug}-{fs}-placa.svg").write_text(fn(wc, sc, st).svg(pad=200, bg=bg))
            n += 2
    return n


if __name__ == "__main__":
    print("ok", build(), "svgs")

#!/usr/bin/env python3
"""Clozzy — rodada 11: LETREIRO + SÍMBOLO NA PALAVRA.
Parte do símbolo da rodada 10 (logo-c-canto-v2, “1 · um pouco maior em cima”: C de pontas inteiras, traços 16°/22° no canto
superior esquerdo, estrela R 18) e aplica a lógica do RolêGo v4 (role-go/marca/identidade-v4): o símbolo vira LETRA do nome,
palavra e símbolo em cores separadas, superfície de cor com a marca branca.
Letreiros em Gabarito (fonte da marca), variações de peso, itálico, contador da letra o preenchido, ligadura zz e c do canto.
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


def symbol_c(rc, sc, w, star=False, star_r=17.5):
    """C do canto em peso de letra: tracejado deslocado para o lado esquerdo (centro 205°), para o arco de cima ficar longo
    e os traços não lerem como “olhos” de um rosto sorrindo."""
    sc = sc or rc
    body = "".join(K.seg(rc, w, a, b) for a, b in K.c_with([24, 32], 202, 14, w))
    if star:
        body += star_at(50, 50, star_r, sc)
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


def c_canto(color, wght=800, star=False, sc=None):
    """c geométrico na altura x, com o tracejado do canto e traço do peso da letra."""
    D = XH + 26
    st = stem(wght) * 0.5          # ~ a espessura das curvas do o (o l é mais largo que a curva)
    w = st / (D / 90)
    return symbol_c(color, sc, w, star), D


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


def W_c_canto(wc=INK, ac=None, wght=800):
    inner, D = c_canto(ac or wc, wght)
    return Word(wght).piece(inner, D, bottom=13, lsb=0, rsb=14).text("lozzy", wc)


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
    ("l3-c-do-canto", "c do canto", "O c da palavra é o C do símbolo sem a estrela: pontas inteiras e o tracejado no canto, no peso das letras.", W_c_canto),
    ("l4-zz-ligado", "zz ligado", "Os dois z encostam e viram uma faixa contínua: “close” + “cozy”, o par que se aproxima.", W_zz),
    ("l5-estrela-expoente", "Estrela expoente", "clozzy✦: a estrela sobe como expoente, como o selo do Close Friends.", W_estrela_y),
    ("l6-clo-zzy", "clo · zzy", "Duas cores: “clo” (close) e “zzy”. Como Rolê/Go no RolêGo, as duas partes nunca na mesma cor.", W_clo_zzy),
    ("l7-italico", "Itálico 9°", "Inclinação de 9°: movimento estático, a marca “indo” para o fã. Para campanha e motion.", W_italico),
    ("l8-leve", "Leve 500", "Mesmo desenho em peso 500, para tamanhos grandes (outdoor, capa). Família responsiva: 800 no pequeno, 500 no grande.", W_leve),
]


# ------------------------------------------------------------------ SÍMBOLO NA PALAVRA (lógica RolêGo v4)
def S_c_simbolo(wc=INK, sc=DEEP, star=None, wght=800):
    """O C do símbolo é a primeira letra, na altura das ascendentes; traço engrossado para conversar com as letras."""
    D = ASC + 40
    st = stem(wght) * 0.62
    inner = symbol(sc, star or sc, w=st / (D / 90), star_r=19)
    return Word(wght).piece(inner, D, bottom=14, lsb=0, rsb=26).text("lozzy", wc)


def S_c_simbolo_fino(wc=INK, sc=DEEP, star=None, wght=800):
    """Mesma ideia com o traço fino original (9) — mais delicado, contraste com a letra."""
    D = ASC + 40
    inner = symbol(sc, star or sc, w=11, star_r=19)
    return Word(wght).piece(inner, D, bottom=14, lsb=0, rsb=30).text("lozzy", wc)


def S_o_simbolo(wc=INK, sc=DEEP, star=None, wght=800):
    """O símbolo ocupa o lugar do o, na altura x."""
    D = XH + 90
    st = stem(wght) * 0.46
    inner = symbol(sc, star or sc, w=st / (D / 90), star_r=18.5, pattern=(24, 32), gap=15)
    return Word(wght).text("cl", wc).piece(inner, D, bottom=36, lsb=10, rsb=14).text("zzy", wc)


def S_c_italico(wc=INK, sc=DEEP, star=None, wght=800):
    D = ASC + 40
    st = stem(wght) * 0.62
    inner = symbol(sc, star or sc, w=st / (D / 90), star_r=19)
    return Word(wght, track=-24, skew=9).piece(inner, D, bottom=14, lsb=0, rsb=10).text("lozzy", wc)


def S_c_canto_expoente(wc=INK, sc=DEEP, star=None, wght=800):
    inner, D = c_canto(sc, wght)
    w = Word(wght).piece(inner, D, bottom=13, lsb=0, rsb=14).text("lozzy", wc)
    R = 92
    cx, cy = w.x + 70, -ASC + R * 0.95
    return w.raw(star_at(cx, cy, R, star or sc), (cx - R, cy - R, cx + R, cy + R))


def S_lockup(wc=INK, sc=DEEP, star=None, wght=800):
    """Lockup clássico (símbolo ao lado), referência da rodada 10."""
    D = ASC * 1.32
    return Word(wght).piece(K.make([16, 22], 10, [22, 28], 16)(sc, star or sc), D, bottom=60, lsb=0, rsb=150).text("clozzy", wc)


SIMBOLOS = [
    ("s1-c-simbolo", "C-símbolo", "O símbolo é a letra C: “[C✦]lozzy”. Como o Go no RolêGo, o símbolo faz parte do nome e nunca é digitado. Traço engrossado para conversar com as letras.", S_c_simbolo),
    ("s2-c-simbolo-fino", "C-símbolo fino", "A mesma ideia com o traço fino que você preferiu. Mais delicada; o símbolo se destaca da palavra pelo contraste de peso.", S_c_simbolo_fino),
    ("s3-o-simbolo", "o-símbolo", "O símbolo entra no lugar do o, na altura x: “cl[o✦]zzy”. Fica no centro da palavra, como um story no meio do feed.", S_o_simbolo),
    ("s4-c-italico", "C-símbolo itálico", "Palavra inclinada 9° saindo do C reto: o símbolo fica parado e a palavra anda.", S_c_italico),
    ("s5-canto-expoente", "c do canto + ✦", "O c tracejado sem estrela abre a palavra e a estrela vai para o fim, como expoente.", S_c_canto_expoente),
    ("s6-lockup", "Lockup lado a lado", "O lockup da rodada 10 (símbolo + palavra separados), para comparar.", S_lockup),
]

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

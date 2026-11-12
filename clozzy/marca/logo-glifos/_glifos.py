#!/usr/bin/env python3
"""Clozzy — rodada 15: glifos sólidos “no caminho do Tinder”.

O que se pega do Tinder (o jeito, não a forma): UMA forma cheia, sem contorno, com curvas fluidas e uma ponta
viva; lê de longe, funciona sozinha no ícone (tile rosa + glifo branco) e não precisa da palavra.
O que é da Clozzy: estrela (close friends), story, câmera/lente, vídeo, conteúdo exclusivo.
Não usamos chama nem nada que lembre o símbolo do Tinder.

Regras de cor de sempre: chapado, sem degradê. No preto glifo rosa e recortes BRANCOS (vazar mostraria
preto dentro do rosa); no rosa/roxo tudo branco (os recortes vazam a cor do fundo); no claro Pink Deep vazado.
Palavra Gabarito 800 sempre separada do símbolo (lockups do logo final v3).

Rodar: python3 _glifos.py → svg/ ; depois python3 _build.py → HTML + PDF."""
import math, shutil, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
MARCA = HERE.parent
sys.path.insert(0, str(MARCA / "logo-final-v3"))
import _marca as M  # noqa: E402

SB, T, f = M.SB, M.T, M.f
LG = SB.LG
PINK, DEEP, PURPLE, INK, CREAM, WHITE = M.PINK, M.DEEP, M.PURPLE, M.INK, M.CREAM, M.WHITE
RATIO = LG.STAR_RATIO          # 0,48 — a estrela original


def P(a, r, cx=50, cy=50):
    t = math.radians(a)
    return cx + r * math.cos(t), cy + r * math.sin(t)


def star_pts(R, cx=50, cy=50, ratio=RATIO, rot=0.0):
    pts = [P(-90 + rot + k * 36, R if k % 2 == 0 else R * ratio, cx, cy) for k in range(10)]
    return " ".join(f"{f(x)},{f(y)}" for x, y in pts)


def star(c, R, cx=50, cy=50, rot=0.0, ratio=RATIO, round_k=None):
    """Estrela original (canto redondo = contorno STAR_ROUND·R/20,5)."""
    sw = (LG.STAR_ROUND if round_k is None else round_k) * R / LG.STAR_R
    return (f'<polygon points="{star_pts(R, cx, cy, ratio, rot)}" fill="{c}" stroke="{c}" '
            f'stroke-width="{f(sw)}" stroke-linejoin="round"/>')


def soft_star_path(R, cx=50, cy=50, ratio=0.56, tip=0.0, valley=0.0, rot=0.0):
    """Estrela de lados CURVOS: entre cada ponta e cada vale, uma curva quadrática.
    `valley` > 0 incha os lados (estrela gorda/adesivo); < 0 cava (brilho)."""
    out = []
    n = 10
    pts = [(P(-90 + rot + k * 36, R if k % 2 == 0 else R * ratio, cx, cy), k % 2 == 0) for k in range(n)]
    # cada ponta: arredonda com um pequeno trecho; cada lado: Q com controle deslocado para fora/dentro
    def lerp(a, b, t):
        return a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t
    segs = []
    for k in range(n):
        (p, is_tip), (q, _) = pts[k], pts[(k + 1) % n]
        segs.append((p, q, is_tip))
    # começa no meio do primeiro lado
    first = lerp(segs[0][0], segs[0][1], 0.5)
    out.append(f"M{f(first[0])} {f(first[1])}")
    for k in range(n):
        p, q, _ = segs[k]
        p2, q2, _ = segs[(k + 1) % n]
        a = lerp(p, q, 0.5)
        b = lerp(p2, q2, 0.5)
        v = q                                  # vértice entre os dois lados
        is_tip = (k + 1) % 2 == 0
        if is_tip:
            # ponta: curva passando perto do vértice (tip = quanto arredonda)
            c1 = lerp(a, v, 1 - tip)
            c2 = lerp(b, v, 1 - tip)
            out.append(f"L{f(c1[0])} {f(c1[1])}Q{f(v[0])} {f(v[1])} {f(c2[0])} {f(c2[1])}L{f(b[0])} {f(b[1])}")
        else:
            # vale: controle empurrado para fora (valley>0) ou para dentro do centro
            dx, dy = v[0] - cx, v[1] - cy
            ctrl = (v[0] + dx * valley, v[1] + dy * valley)
            out.append(f"Q{f(ctrl[0])} {f(ctrl[1])} {f(b[0])} {f(b[1])}")
    return "".join(out) + "Z"


# ------------------------------------------------------------------ glifos
# cada glifo: fn(c, ac) → miolo SVG no grid 100 (forma entre ~5 e ~95).
# c = cor do glifo; ac = cor dos recortes. ac=None → recorte de verdade (máscara, vaza o fundo).
_MID = [0]


def cut(c, ac, shape, holes):
    """`shape` = elementos cheios (sem fill, recebem c). `holes` = lista de fn(cor) → elemento."""
    if ac:
        return shape.replace("FILL", c) + "".join(h(ac) for h in holes)
    _MID[0] += 1
    mid = f"cz-g{_MID[0]}"
    return (f'<mask id="{mid}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="120">'
            f'<rect x="-10" y="-10" width="120" height="120" fill="#fff"/>{"".join(h("#000") for h in holes)}</mask>'
            f'<g mask="url(#{mid})">{shape.replace("FILL", c)}</g>')


def g_estrela_macia(c, ac=None):
    """Estrela gorda, pontas bem redondas, cara de adesivo. Sem nada dentro: a mais Tinder de todas."""
    R = 47
    return (f'<polygon points="{star_pts(R - 7, 50, 53, 0.55, rot=-8)}" fill="{c}" stroke="{c}" stroke-width="15" '
            f'stroke-linejoin="round"/>')


def g_brilho(c, ac=None):
    """Estrela de lados cavados, pontas finas e vivas: um brilho de close friends."""
    d = soft_star_path(46, 50, 53, ratio=0.36, tip=0.14, valley=-0.35)
    return f'<path d="{d}" fill="{c}" stroke="{c}" stroke-width="2.4" stroke-linejoin="round"/>'


def g_lente(c, ac=None):
    """Disco cheio = lente; estrela vazada no meio e um reflexo no canto. Câmera + close friends."""
    holes = [lambda k: star(k, 21, 50, 51.5),
             lambda k: f'<circle cx="72.5" cy="27.5" r="5.2" fill="{k}"/>']
    return cut(c, ac, '<circle cx="50" cy="50" r="45" fill="FILL"/>', holes)


def g_diafragma(c, ac=None):
    """Lente com 5 lâminas de obturador; a abertura do meio é a estrela."""
    R = 18
    holes = [lambda k: star(k, R, 50, 51.5, round_k=3.4)]
    for i in range(5):
        a = -90 + i * 72
        (x0, y0) = P(a, R, 50, 51.5)
        (x1, y1) = P(a + 62, 46, 50, 50)
        holes.append(lambda k, x0=x0, y0=y0, x1=x1, y1=y1:
                     f'<line x1="{f(x0)}" y1="{f(y0)}" x2="{f(x1)}" y2="{f(y1)}" stroke="{k}" stroke-width="3.6" '
                     f'stroke-linecap="round"/>')
    if ac:
        _MID[0] += 1
        cid = f"cz-c{_MID[0]}"
        return (f'<clipPath id="{cid}"><circle cx="50" cy="50" r="45"/></clipPath><circle cx="50" cy="50" r="45" fill="{c}"/>'
                f'<g clip-path="url(#{cid})">{"".join(h(ac) for h in holes)}</g>')
    return cut(c, ac, '<circle cx="50" cy="50" r="45" fill="FILL"/>', holes)


def g_camera(c, ac=None):
    """Corpo de câmera em squircle, lente redonda vazada com a estrela dentro e o flash."""
    body = ('<path d="M24 26h10l5-8h22l5 8h10a14 14 0 0 1 14 14v34a14 14 0 0 1-14 14H24a14 14 0 0 1-14-14V40'
            'a14 14 0 0 1 14-14Z" fill="FILL" stroke="FILL" stroke-width="2" stroke-linejoin="round"/>')
    if ac:
        holes = [lambda k: f'<circle cx="50" cy="57" r="22" fill="{k}"/>',
                 lambda k: star(c, 12.5, 50, 58.2),
                 lambda k: f'<circle cx="77" cy="40" r="3.6" fill="{k}"/>']
        return body.replace("FILL", c) + "".join(h(ac) for h in holes)
    # vazado: anel da lente vaza, estrela fica na cor do glifo
    holes = [lambda k: f'<circle cx="50" cy="57" r="22" fill="{k}"/>',
             lambda k: f'<circle cx="77" cy="40" r="3.6" fill="{k}"/>']
    return cut(c, None, body, holes) + star(c, 12.5, 50, 58.2)


def g_play(c, ac=None):
    """Play arredondado (vídeo) com a estrela vazada perto do centro de massa."""
    tri = '<path d="M30 14 L84 46 Q91 50 84 54 L30 86 Q19 92 19 80 V20 Q19 8 30 14Z" fill="FILL"/>'
    holes = [lambda k: star(k, 15.5, 44, 51.5)]
    return cut(c, ac, tri, holes)


def g_story(c, ac=None):
    """Card de story 9:16 com as barrinhas de progresso no topo e a estrela no meio."""
    card = '<rect x="20" y="5" width="60" height="90" rx="15" fill="FILL"/>'
    holes = [lambda k: f'<rect x="29" y="14" width="18" height="4" rx="2" fill="{k}"/>',
             lambda k: f'<rect x="53" y="14" width="18" height="4" rx="2" fill="{k}" opacity="1"/>',
             lambda k: star(k, 17, 50, 53)]
    return cut(c, ac, card, holes)


def g_bolha(c, ac=None):
    """Balão de resposta ao story (DM) com rabinho embaixo à esquerda; estrela vazada."""
    shape = ('<path d="M50 6a43 42 0 1 1 -24.5 76.4L12 90.5q-4 2-3.3-2.4l3.4-15.6A43 42 0 0 1 50 6Z" '
             'fill="FILL" stroke="FILL" stroke-width="1.5" stroke-linejoin="round"/>')
    holes = [lambda k: star(k, 20, 51, 49.5)]
    return cut(c, ac, shape, holes)


def g_fechadura(c, ac=None):
    """Exclusivo: fechadura cuja cabeça é a estrela. Disco cheio, buraco em estrela + haste."""
    holes = [lambda k: star(k, 19, 50, 41),
             lambda k: f'<path d="M46.5 50 L53.5 50 L57 74 Q58 78 54 78 H46 Q42 78 43 74 Z" fill="{k}" '
                       f'stroke="{k}" stroke-width="2" stroke-linejoin="round"/>']
    return cut(c, ac, '<circle cx="50" cy="50" r="45" fill="FILL"/>', holes)


def g_cadeado(c, ac=None):
    """Cadeado de conteúdo exclusivo: alça em tracejado de story, corpo cheio com a estrela."""
    w = 9.5
    body = '<rect x="15" y="42" width="70" height="52" rx="16" fill="FILL"/>'
    holes = [lambda k: star(k, 15, 50, 68.5)]
    # alça: semicírculo r 22 em cima do corpo, com o lado direito em dois traços (o “story”)
    rr = 22
    def arc(a0, a1):
        (x0, y0), (x1, y1) = P(a0, rr, 50, 40), P(a1, rr, 50, 40)
        return (f'<path d="M{f(x0)} {f(y0)}A{rr} {rr} 0 0 1 {f(x1)} {f(y1)}" fill="none" stroke="{c}" '
                f'stroke-width="{w}" stroke-linecap="round"/>')
    lx = 50 - rr
    shackle = (f'<path d="M{f(lx)} 46V40" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round"/>'
               + arc(180, 282) + arc(322, 360)
               + f'<path d="M{f(50 + rr)} 40V46" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round"/>')
    return shackle + cut(c, ac, body, holes)


def g_cometa(c, ac=None):
    """Estrela em movimento: uma cauda fluida sai da estrela (vídeo, ao vivo, story passando)."""
    tail = ('<path d="M10 90 C24 70 34 60 52 52 L60 64 C42 70 30 78 10 90Z" fill="FILL" '
            'stroke="FILL" stroke-width="2" stroke-linejoin="round"/>')
    return tail.replace("FILL", c) + star(c, 30, 62, 40, rot=12, round_k=6.4)


def g_espiar(c, ac=None):
    """Olhar: amêndoa (olho) com a íris em estrela vazada. Espiar o que é só para o close."""
    eye = ('<path d="M4 50 Q50 0 96 50 Q50 100 4 50Z" fill="FILL" stroke="FILL" stroke-width="6" '
           'stroke-linejoin="round"/>')
    holes = [lambda k: f'<circle cx="50" cy="50" r="22" fill="{k}"/>']
    if ac:
        return eye.replace("FILL", c) + holes[0](ac) + star(c, 13.5, 50, 51.3)
    return cut(c, None, eye, holes) + star(c, 13.5, 50, 51.3)


def g_gota(c, ac=None):
    """Pin/gota: o “onde está o close”. Forma de gota com a ponta para baixo, estrela vazada."""
    shape = ('<path d="M50 96 C40 84 12 62 12 42 A38 38 0 0 1 88 42 C88 62 60 84 50 96Z" fill="FILL" '
             'stroke="FILL" stroke-width="2" stroke-linejoin="round"/>')
    holes = [lambda k: star(k, 20, 50, 43)]
    return cut(c, ac, shape, holes)


GLIFOS = [   # slug, nome, ideia, fn
    ("g01-estrela-macia", "Estrela macia", "A estrela de close friends gorda, de pontas bem redondas, cara de adesivo. Uma forma só, sem nada dentro — o jeito Tinder de ser um símbolo.", g_estrela_macia),
    ("g02-brilho", "Brilho", "Estrela de lados cavados e pontas vivas, um brilho. Mais sensual e afiada que a macia.", g_brilho),
    ("g03-lente", "Lente", "Disco cheio = lente da câmera, estrela vazada no meio e um reflexo no canto.", g_lente),
    ("g04-diafragma", "Diafragma", "Cinco lâminas de obturador; a abertura no meio é a estrela. Câmera + close em uma peça.", g_diafragma),
    ("g05-camera", "Câmera", "Corpo de câmera arredondado, lente vazada com a estrela dentro e o flash.", g_camera),
    ("g06-play", "Play", "Play de vídeo bem redondo com a estrela vazada no centro de massa.", g_play),
    ("g07-story", "Card de story", "O card 9:16 com as barrinhas de progresso no topo e a estrela no meio.", g_story),
    ("g08-bolha", "Bolha", "Balão de resposta ao story (DM) com o rabinho; estrela vazada. Conversa íntima.", g_bolha),
    ("g09-fechadura", "Fechadura", "Conteúdo exclusivo: a cabeça da fechadura é a estrela. Espiar pelo buraco.", g_fechadura),
    ("g10-cadeado", "Cadeado", "Cadeado com a alça em tracejado de story e a estrela no corpo: o close desbloqueado.", g_cadeado),
    ("g11-cometa", "Cometa", "A estrela em movimento com uma cauda fluida: vídeo, ao vivo, o story passando.", g_cometa),
    ("g12-espiar", "Olhar", "Um olho em amêndoa com a íris em estrela. O olhar de quem está no close.", g_espiar),
    ("g13-gota", "Pin", "Gota/pin com a estrela vazada: “o seu lugar no close”. Lê bem pequeno.", g_gota),
]
G = {g[0]: g for g in GLIFOS}
MAIN = ["g01-estrela-macia", "g04-diafragma", "g06-play"]

# slug, fundo, palavra, glifo, recorte (None = vazado)
FUNDOS = [
    ("preto", INK, WHITE, PINK, WHITE),
    ("rosa", PINK, WHITE, WHITE, None),
    ("roxo", PURPLE, WHITE, WHITE, None),
    ("branco", WHITE, INK, DEEP, None),
    ("cream", CREAM, INK, DEEP, None),
]
FUNDO = {x[0]: x for x in FUNDOS}


def sym_svg(fn, c, ac, bg=None, size=256, pad=None):
    pad = (8.0 if bg else 0.0) if pad is None else pad
    v0, vw = 5 - pad, 90 + 2 * pad
    bgr = f'<rect x="{f(v0)}" y="{f(v0)}" width="{f(vw)}" height="{f(vw)}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(v0)} {f(v0)} {f(vw)} {f(vw)}" width="{size}" height="{size}">'
            f'<title>Clozzy</title>{bgr}{fn(c, ac)}</svg>\n')


def tile_svg(fn, bg, c, ac, size=1024, scale=0.6):
    o = 50 - 50 * scale
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="{size}" height="{size}">'
            f'<title>Clozzy</title><rect width="100" height="100" rx="22.37" fill="{bg}"/>'
            f'<g transform="translate({f(o)} {f(o)}) scale({f(scale)})">{fn(c, ac)}</g></svg>\n')


def lockup_svg(fn, fundo, kind="horizontal"):
    _s, b, wc, c, ac = FUNDO[fundo]
    T.SYM = lambda r, s=None, small=False: fn(r, ac)     # os lockups do v7 chamam T.SYM(anel, estrela)
    L = M.LOCKUP_H if kind == "horizontal" else M.LOCKUP_V
    return L(wc, c, c).svg(pad=70, bg=b, title="Clozzy")


OUT = HERE / "svg"


def build():
    shutil.rmtree(OUT, ignore_errors=True)
    OUT.mkdir()
    n = 0
    for slug, _nm, _i, fn in GLIFOS:
        for fs, b, wc, c, ac in FUNDOS:
            (OUT / f"{slug}-{fs}.svg").write_text(sym_svg(fn, c, ac, b))
            (OUT / f"{slug}-lockup-{fs}.svg").write_text(lockup_svg(fn, fs))
            n += 2
        for fs in ("preto", "branco"):
            (OUT / f"{slug}-empilhado-{fs}.svg").write_text(lockup_svg(fn, fs, "empilhado"))
            n += 1
        for fs in ("rosa", "preto", "roxo"):
            _s, b, wc, c, ac = FUNDO[fs]
            (OUT / f"{slug}-app-{fs}.svg").write_text(tile_svg(fn, b, c, ac))
            n += 1
        (OUT / f"{slug}.svg").write_text(sym_svg(fn, DEEP, None))
        n += 1
    return n


if __name__ == "__main__":
    print("ok", build(), "svgs")

#!/usr/bin/env python3
"""Clozzy — rodada 14 “moderna”: evolução do logo final v3 em cima de refs/, com close friends como
palavra-chave e um grupo de variações de LENTE (diafragma, obturador, reflexo).

Leitura das refs: o selo verde de Close Friends do Instagram (refs 16.00.16 / 16.00.35) é a origem do
círculo + estrela; os prints 14.03/15.01 deram o anel grosso com tracejado só na abertura; o 15.59 mostrou
que Disco, Crescente e Giro foram as variações preferidas. A lente entra porque o produto é foto e vídeo:
a abertura de 5 lâminas de um diafragma já é uma estrela de 5 pontas — o mesmo signo, agora vindo da câmera.

Grid 100, anel externo r = 45, igual às rodadas anteriores. Rodar: python3 _moderna.py → svg/
"""
import itertools
import math
import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
MARCA = HERE.parent
sys.path.insert(0, str(MARCA / "logo-letreiro-v7"))
sys.path.insert(0, str(MARCA / "logo-c-canto-v2"))
sys.path.insert(0, str(MARCA / "identidade-nova"))
import _simbolo as SB  # noqa: E402
import _canto as K  # noqa: E402
import _logos as LG  # noqa: E402

f = K.f
P = K.P
OUTER = SB.OUTER
PINK, DEEP, PURPLE, INK, CREAM, WHITE = K.PINK, K.DEEP, K.PURPLE, K.INK, K.CREAM, K.WHITE


# ------------------------------------------------------------------ peças base
def star(c, R=19.0, cx=50.0, cy=50.0, rot=0.0):
    pts = LG.star_points(cx=cx, cy=cy, R=R)
    g = f' transform="rotate({f(rot)} {f(cx)} {f(cy)})"' if rot else ""
    return (f'<polygon points="{pts}"{g} fill="{c}" stroke="{c}" '
            f'stroke-width="{f(LG.STAR_ROUND * R / LG.STAR_R)}" stroke-linejoin="round"/>')


def disk(c, r=45.0, cx=50.0, cy=50.0):
    return f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}" fill="{c}"/>'


def crescent(c, r, cx, cy, hr, hx, hy):
    """Crescente: disco (cx,cy,r) menos o disco (hx,hy,hr). Sem máscara — funciona em qualquer fundo."""
    d = math.hypot(hx - cx, hy - cy)
    if d >= r + hr or d + r <= hr:
        return disk(c, r, cx, cy) if d >= r + hr else ""
    if d + hr <= r:     # furo inteiro dentro: anel excêntrico (dois subcaminhos, evenodd)
        return (f'<path d="M{f(cx - r)} {f(cy)}A{f(r)} {f(r)} 0 1 0 {f(cx + r)} {f(cy)}'
                f'A{f(r)} {f(r)} 0 1 0 {f(cx - r)} {f(cy)}Z'
                f'M{f(hx - hr)} {f(hy)}A{f(hr)} {f(hr)} 0 1 0 {f(hx + hr)} {f(hy)}'
                f'A{f(hr)} {f(hr)} 0 1 0 {f(hx - hr)} {f(hy)}Z" fill="{c}" fill-rule="evenodd"/>')
    a = (d * d + r * r - hr * hr) / (2 * d)
    h = math.sqrt(max(r * r - a * a, 0.0))
    ux, uy = (hx - cx) / d, (hy - cy) / d
    px, py = cx + a * ux, cy + a * uy
    x0, y0 = px + h * -uy, py + h * ux
    x1, y1 = px - h * -uy, py - h * ux
    return (f'<path d="M{f(x0)} {f(y0)}A{f(r)} {f(r)} 0 1 1 {f(x1)} {f(y1)}'
            f'A{f(hr)} {f(hr)} 0 0 0 {f(x0)} {f(y0)}Z" fill="{c}"/>')


def squircle(c, k=0.58, r=45.0, cx=50.0, cy=50.0):
    """Super-elipse (squircle de app) por 4 cúbicas. k = “cheio”: 0,55 ≈ iOS, 1 = círculo."""
    o = r * k
    return (f'<path d="M{f(cx)} {f(cy - r)}C{f(cx + o)} {f(cy - r)} {f(cx + r)} {f(cy - o)} {f(cx + r)} {f(cy)}'
            f'C{f(cx + r)} {f(cy + o)} {f(cx + o)} {f(cy + r)} {f(cx)} {f(cy + r)}'
            f'C{f(cx - o)} {f(cy + r)} {f(cx - r)} {f(cy + o)} {f(cx - r)} {f(cy)}'
            f'C{f(cx - r)} {f(cy - o)} {f(cx - o)} {f(cy - r)} {f(cx)} {f(cy - r)}Z" fill="{c}"/>')


# ------------------------------------------------------------------ lente (diafragma)
def blades(c, n=5, R=43.0, Rs=24.0, ratio=0.46, rot=-90.0, seam=3.0, round_r=1.6, star_hole=True):
    """Diafragma de lente: `n` lâminas em volta de uma abertura.

    `star_hole`: a abertura é a estrela de 5 pontas (a lâmina tem a aresta interna em V).
    Sem `star_hole` a abertura é o polígono regular (obturador meio fechado).
    O desenho é construído menor e contornado com `round_r` (linejoin round) → cantos macios,
    mesma técnica dos traços da v4. `seam` é o vão entre lâminas no raio da abertura.
    """
    step = 360.0 / n
    rr = round_r
    rim = R - rr                      # o contorno cresce rr para fora
    ro = Rs + rr                      # ponta da abertura (o contorno come rr para dentro)
    ri = Rs * ratio + rr
    gap_rim = math.degrees((seam / 2 + rr) / rim)
    gap_tip = math.degrees((seam / 2 + rr) / max(ro, 1e-6))
    out = []
    for k in range(n):
        a0 = rot + k * step
        a1 = a0 + step
        pa = P(a0 + gap_tip, ro)
        pb = P(a1 - gap_tip, ro)
        q = P(a0 + step / 2, ri)
        ra = P(a0 + gap_rim, rim)
        rb = P(a1 - gap_rim, rim)
        inner = f"L{f(q[0])} {f(q[1])}" if star_hole else ""
        out.append(f'<path d="M{f(pa[0])} {f(pa[1])}{inner}L{f(pb[0])} {f(pb[1])}L{f(rb[0])} {f(rb[1])}'
                   f'A{f(rim)} {f(rim)} 0 0 0 {f(ra[0])} {f(ra[1])}Z" fill="{c}" stroke="{c}" '
                   f'stroke-width="{f(2 * rr)}" stroke-linejoin="round"/>')
    return "".join(out)


_uid = itertools.count()


def knock(shape, hole):
    """Recorta `hole(cor)` de `shape` por máscara — o furo mostra o fundo, qualquer que seja ele."""
    i = next(_uid)
    return (f'<mask id="k{i}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="120">'
            f'<rect x="-10" y="-10" width="120" height="120" fill="#fff"/>{hole("#000")}</mask>'
            f'<g mask="url(#k{i})">{shape}</g>')


def seams(c, n=5, r=46.0, w=2.6, rot=-90.0, r0=0.0):
    """Fendas radiais (as junções das lâminas da lente)."""
    out = []
    for k in range(n):
        a = rot + k * 360.0 / n
        x0, y0 = P(a, r0)
        x1, y1 = P(a, r)
        out.append(f'<line x1="{f(x0)}" y1="{f(y0)}" x2="{f(x1)}" y2="{f(y1)}" stroke="{c}" '
                   f'stroke-width="{f(w)}" stroke-linecap="round"/>')
    return "".join(out)


# ------------------------------------------------------------------ conceitos
# A · CLOSE FRIENDS — o selo verde do Instagram (refs 16.00) relido em rosa
def cf1_trio(rc=PINK, sc=None, small=False):
    """Anel partido em três arcos de tamanhos diferentes: o close friends é um grupo, não uma pessoa."""
    sc = sc or rc
    w = 14.0 if small else 11.0
    arcs = [(150, 100, 70), (160, 120, 0)][1 if small else 0]
    a = -104.0
    out = []
    for L in arcs:
        if L:
            out.append(K.seg(rc, w, a, a + L))
            a += L + 14.0
    return "".join(out) + star(sc, 20.0 if small else 18.5)


def cf2_duo(rc=PINK, sc=None, small=False):
    """Dois discos sobrepostos com vão de adesivo: você e quem entrou no seu close."""
    sc = sc or rc
    rf, cx, cy = 30.0, 42.0, 56.0
    back = crescent(rc, 30.0, 64.0, 38.0, rf + (4.5 if not small else 5.5), cx, cy)
    front = knock(disk(rc, rf, cx, cy), lambda c: star(c, 19.0 if small else 17.0, cx, cy))
    return back + front


def cf3_disco(rc=PINK, sc=None, small=False):
    """O 07 Disco sem moldura: disco cheio, estrela vazada e um traço de anel chegando pela direita."""
    sc = sc or rc
    r = 35.0
    d = knock(disk(rc, r), lambda c: star(c, 23.0 if small else 21.0))
    dash = K.seg(rc, 8.0 if small else 7.0, -34, 34) if small else (K.seg(rc, 7.0, -46, -8) + K.seg(rc, 7.0, 8, 46))
    return d + dash


# B · LENTE — a abertura de 5 lâminas já é a estrela de 5 pontas
def ln1_diafragma(rc=PINK, sc=None, small=False):
    """Diafragma: cinco lâminas em volta de uma abertura em estrela. A lente da câmera e o selo do close."""
    sc = sc or rc
    if small:
        return blades(rc, R=44.0, Rs=23.0, ratio=0.47, seam=4.6, round_r=2.4)
    return blades(rc, R=43.0, Rs=21.5, ratio=0.45, seam=3.6, round_r=2.0)


def ln2_lente_no_anel(rc=PINK, sc=None, small=False):
    """A lente dentro do anel de story do v3: mantém o sistema atual e troca a estrela cheia pela abertura."""
    sc = sc or rc
    if small:   # corte pequeno: a lente fecha e volta a ser a estrela cheia
        return SB.ring_c(rc, 13.0, 2, 120.0, 0.7) + star(sc, 17.0)
    return SB.ring_c(rc, 9.5, 3, 120.0, 0.72) + blades(rc, R=29.0, Rs=16.0, ratio=0.46, seam=2.8, round_r=1.5)


def ln3_obturador(rc=PINK, sc=None, small=False):
    """Obturador meio girado: abertura em pentágono com a estrela como ponto de luz no centro."""
    sc = sc or rc
    if small:
        return blades(rc, R=44.0, Rs=22.0, rot=-68.0, seam=4.4, round_r=2.4, star_hole=False) + star(sc, 10.5, rot=14)
    return blades(rc, R=43.0, Rs=21.0, rot=-68.0, seam=3.6, round_r=2.0, star_hole=False) + star(sc, 10.0, rot=14)


def ln4_reflexo(rc=PINK, sc=None, small=False):
    """Lente cheia com reflexo: disco, estrela e um brilho em crescente na borda de cima."""
    sc = sc or rc
    r = 42.0
    t = 5.5 if small else 4.5
    R = 21.0 if small else 19.5
    def partes(c):
        return crescent(c, r - 3.0, 50, 50, r - 3.0 - t, 52.4, 52.8) + star(c, R)
    if sc == rc:            # versão de uma cor: o reflexo e a estrela viram vazados
        return knock(disk(rc, r), partes)
    return disk(rc, r) + partes(sc)


# C · EVOLUÇÃO DIRETA — o v3 só um passo adiante
def ev1_estrela_fenda(rc=PINK, sc=None, small=False):
    """O símbolo final v3 com uma fenda de obturador cortando a estrela: um corte só, nada mais."""
    sc = sc or rc
    if small:
        return SB.ring_c(rc, 13.0, 2, 120.0, 0.7) + star(sc, 20.0)
    fenda = f'<line x1="22" y1="63" x2="78" y2="37" stroke="#000" stroke-width="2.6" stroke-linecap="round"/>'
    return SB.ring_c(rc, 9.5, 3, 120.0, 0.72) + knock(star(sc, 19.0), lambda c: fenda.replace("#000", c))


def ev2_squircle(rc=PINK, sc=None, small=False):
    """Squircle de app com a estrela vazada e um recorte no canto onde encosta o avatar do amigo."""
    sc = sc or rc
    def holes(c):
        return star(c, 23.0 if small else 21.0, 46, 54) + f'<circle cx="88" cy="16" r="{20 if small else 22}" fill="{c}"/>'
    return knock(squircle(rc, 0.86, 43.0, 46, 54), holes)


def ev3_giro(rc=PINK, sc=None, small=False):
    """O 06 Giro mais limpo: dois arcos longos desencontrados, o anel parado no meio da volta."""
    sc = sc or rc
    w = 13.0 if small else 10.5
    return K.seg(rc, w, 112, 320) + K.seg(rc, w, -28, 86) + star(sc, 20.0 if small else 18.5)


GRUPOS = [
    ("Close friends", "O selo verde do Close Friends (refs 16.00) relido em rosa: círculo, estrela e gente por perto.", [
        ("cf1-trio", "Trio", cf1_trio),
        ("cf2-duo", "Duo", cf2_duo),
        ("cf3-disco", "Disco", cf3_disco),
    ]),
    ("Lente", "A abertura de cinco lâminas de um diafragma já é uma estrela de cinco pontas — o mesmo signo vindo da câmera.", [
        ("ln1-diafragma", "Diafragma", ln1_diafragma),
        ("ln2-lente-no-anel", "Lente no anel", ln2_lente_no_anel),
        ("ln3-obturador", "Obturador", ln3_obturador),
        ("ln4-reflexo", "Reflexo", ln4_reflexo),
    ]),
    ("Evolução direta", "O símbolo do logo final v3 um passo adiante, sem perder o anel de story já construído.", [
        ("ev1-estrela-fenda", "Estrela fenda", ev1_estrela_fenda),
        ("ev2-squircle", "Squircle", ev2_squircle),
        ("ev3-giro", "Giro", ev3_giro),
    ]),
]
CONCEITOS = [(s, n, fn) for _g, _d, vs in GRUPOS for s, n, fn in vs]
FN = {s: fn for s, _n, fn in CONCEITOS}
NOME = {s: n for s, n, _fn in CONCEITOS}
IDEIA = {s: (fn.__doc__ or "").strip() for s, _n, fn in CONCEITOS}
HERO = "ln2-lente-no-anel"

# slug, nome, fundo, anel/lente, estrela
FUNDOS = [
    ("preto", "Preto · principal", INK, PINK, WHITE),
    ("rosa", "Rosa · tudo branco", PINK, WHITE, WHITE),
    ("deep", "Pink Deep", DEEP, WHITE, WHITE),
    ("roxo", "Roxo", PURPLE, WHITE, WHITE),
    ("cream", "Cream", CREAM, DEEP, DEEP),
    ("branco", "Branco", WHITE, DEEP, DEEP),
    ("mono-branco", "Uma cor · branco", INK, WHITE, WHITE),
    ("mono-ink", "Uma cor · ink", WHITE, INK, INK),
]
FUNDO = {x[0]: x for x in FUNDOS}


# ------------------------------------------------------------------ saída
def svg(body, size=256, pad=0.0, bg=None, title="Clozzy"):
    v0, vw = 5 - pad, 90 + 2 * pad
    bgr = f'<rect x="{f(v0)}" y="{f(v0)}" width="{f(vw)}" height="{f(vw)}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(v0)} {f(v0)} {f(vw)} {f(vw)}" '
            f'width="{size}" height="{size}"><title>{title}</title>{bgr}{body}</svg>\n')


def sym_svg(slug, fundo="preto", size=256, small=False, bg=False):
    _s, _n, b, rc, sc = FUNDO[fundo]
    return svg(FN[slug](rc, sc, small), size, bg=b if bg else None)


def tile_svg(slug, fundo="rosa", size=1024, radius=22.37, scale=0.62, small=False):
    _s, _n, b, rc, sc = FUNDO[fundo]
    o = 50 - 50 * scale
    rx = f' rx="{radius}"' if radius else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="{size}" height="{size}">'
            f'<title>Clozzy</title><rect width="100" height="100"{rx} fill="{b}"/>'
            f'<g transform="translate({f(o)} {f(o)}) scale({f(scale)})">{FN[slug](rc, sc, small)}</g></svg>\n')


def lockup_svg(slug, fundo="preto", kind="horizontal", bg=False):
    """Usa os lockups do letreiro v7 trocando o símbolo pelo conceito (símbolo sempre separado da palavra)."""
    import _letreiro as T
    _s, _n, b, rc, sc = FUNDO[fundo]
    wc = WHITE if fundo in ("preto", "rosa", "deep", "roxo", "mono-branco") else INK
    T.SYM = lambda c=DEEP, s=None, small=False: FN[slug](c, s or c, small)
    fn = T.K_empilhado if kind == "empilhado" else T.LOCKUPS[1][3]
    return fn(wc, rc, sc).svg(pad=4, bg=b if bg else None, title="Clozzy")


def build():
    OUT = HERE / "svg"
    shutil.rmtree(OUT, ignore_errors=True)
    OUT.mkdir(parents=True)
    n = 0
    for slug, _nome, _fn in CONCEITOS:
        for fundo in ("preto", "rosa", "cream", "mono-ink"):
            (OUT / f"{slug}-{fundo}.svg").write_text(sym_svg(slug, fundo))
            n += 1
        (OUT / f"{slug}-pequeno.svg").write_text(sym_svg(slug, "preto", small=True))
        (OUT / f"{slug}-app.svg").write_text(tile_svg(slug))
        (OUT / f"{slug}-lockup.svg").write_text(lockup_svg(slug))
        n += 3
    for kind in ("horizontal", "empilhado"):
        for fundo in ("preto", "rosa", "cream"):
            (OUT / f"{HERO}-{kind}-{fundo}.svg").write_text(lockup_svg(HERO, fundo, kind))
            n += 1
    (OUT / f"{HERO}-favicon.svg").write_text(tile_svg(HERO, "rosa", 32, radius=8, scale=0.74, small=True))
    return n + 1


if __name__ == "__main__":
    print("ok", build(), "svgs")

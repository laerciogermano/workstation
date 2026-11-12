#!/usr/bin/env python3
"""Clozzy — rodada 13: variações possíveis do logo, a partir do LOGO FINAL v3.

O que fica fixo (DNA das rodadas 1–12): anel de story grosso (9,5 no grid 100), forma de C com a linha cheia
à esquerda e o tracejado na abertura da direita, traços de cantos arredondados, estrela original inscrita no
círculo central, palavra Gabarito 800 sempre SEPARADA do símbolo, e as regras de cor da marca.
O que muda em cada variação: número e ritmo dos traços, posição da abertura, contorno (círculo ou squircle),
preenchimento (disco), estrela (cheia, em linha, escapando) e cor dos traços.

Rodar: python3 _variacoes.py → svg/ ; depois python3 _build.py → HTML + PDF."""
import math, shutil, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
MARCA = HERE.parent
sys.path.insert(0, str(MARCA / "logo-final-v3"))
import _marca as M  # noqa: E402

SB, T, K, f = M.SB, M.T, M.K, M.f
LG = SB.LG
PINK, DEEP, PURPLE, INK, CREAM, WHITE = M.PINK, M.DEEP, M.PURPLE, M.INK, M.CREAM, M.WHITE
W = M.RING            # 9,5
STAR = M.STAR         # ≈ 16,9 (inscrita no círculo r 19)
OUTER = SB.OUTER      # 45
RM = OUTER - W / 2


def P(a, r):
    t = math.radians(a)
    return 50 + r * math.cos(t), 50 + r * math.sin(t)


def star(c, R=STAR, cx=50, cy=50):
    return SB.star(c, R, cx, cy)


def c_ring(c, line, dashes, w=W):
    """`line` = (a, b) da linha cheia em graus (horário, 0 = direita); `dashes` = [(a, b), ...]."""
    return SB.seg(c, w, *line) + "".join(SB.dash(c, w, a, b) for a, b in dashes)


def even(span, n, duty, center=0.0):
    """n traços iguais numa abertura de `span` graus centrada em `center`; devolve (linha, traços)."""
    a0, a1 = center - span / 2, center + span / 2
    period = span / (n + (1 - duty))
    d, g = period * duty, period * (1 - duty)
    ds, a = [], a0 + g
    for _ in range(n):
        ds.append((a, a + d))
        a += d + g
    return (a1 + g, 360 + a0 - g), ds


def weighted(span, weights, gap, center=0.0):
    """Traços com comprimentos proporcionais a `weights` (do topo para baixo), vãos iguais de `gap` graus."""
    a0 = center - span / 2
    unit = (span - gap * (len(weights) + 1)) / sum(weights)
    ds, a = [], a0 + gap
    for k in weights:
        ds.append((a, a + k * unit))
        a += k * unit + gap
    return (center + span / 2 + gap, 360 + a0 - gap), ds


# ------------------------------------------------------------------ variações
# cada fn(rc, sc=None, bg=None, dc=None) → miolo SVG no grid 100. rc = anel, sc = estrela, bg = fundo (para vazados),
# dc = cor dos traços (só a v11 usa uma segunda cor).

def v_even(span, n, duty, center=0.0):
    def fn(rc, sc=None, bg=None, dc=None):
        line, ds = even(span, n, duty, center)
        return SB.seg(rc, W, *line) + "".join(SB.dash(dc or rc, W, a, b) for a, b in ds) + star(sc or rc)
    return fn


def v_crescente(rc, sc=None, bg=None, dc=None):
    line, ds = weighted(140, (1, 1.6, 2.6), 9)
    return c_ring(rc, line, ds) + star(sc or rc)


def v_um_traco(rc, sc=None, bg=None, dc=None):
    return c_ring(rc, (58, 302), [(-34, 34)]) + star(sc or rc)


_MASK = [0]


def v_disco(rc, sc=None, bg=None, dc=None):
    """Print 15.01.35: anel mais leve em volta de um disco cheio, estrela vazada (recorte de verdade, com máscara)."""
    _MASK[0] += 1
    mid = f"cz-m{_MASK[0]}"
    w = 7.0
    line, ds = even(170, 6, 0.6)
    rd = OUTER - w - 4.5
    sr = STAR * rd / 31
    ring = "".join([SB.seg(rc, w, *line)] + [SB.dash(rc, w, a, b) for a, b in ds])
    st = (f'<polygon points="{LG.star_points(R=sr)}" fill="#000" stroke="#000" '
          f'stroke-width="{f(LG.STAR_ROUND * sr / LG.STAR_R)}" stroke-linejoin="round"/>')
    if sc and sc != rc:   # no preto: disco rosa + estrela BRANCA (vazar mostraria preto no rosa)
        return ring + f'<circle cx="50" cy="50" r="{f(rd)}" fill="{rc}"/>' + star(sc, sr)
    return (f'<mask id="{mid}" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">'
            f'<rect width="100" height="100" fill="#fff"/>{st}</mask>'
            f'{ring}<circle cx="50" cy="50" r="{f(rd)}" fill="{rc}" mask="url(#{mid})"/>')


def v_giro(rc, sc=None, bg=None, dc=None):
    """Abertura girada para o canto de cima à direita (−45°): o anel parece estar carregando."""
    return v_even(110, 3, 0.7, center=-45)(rc, sc, bg, dc)


def v_faisca(rc, sc=None, bg=None, dc=None):
    """O primeiro traço vira uma estrela pequena: o close “escapa” do anel. A estrela grande continua no centro."""
    line, ds = even(120, 3, 0.72)
    (fx, fy) = P((ds[0][0] + ds[0][1]) / 2 - 2, RM)
    return (SB.seg(rc, W, *line) + "".join(SB.dash(rc, W, a, b) for a, b in ds[1:])
            + star(sc or rc, R=8.2, cx=fx, cy=fy) + star(sc or rc))


def _squircle_path(inset, r):
    """Quadrado de cantos redondos começando no meio do lado de cima, sentido horário."""
    a, b = inset, 100 - inset
    return (f"M50 {f(a)}H{f(b - r)}A{f(r)} {f(r)} 0 0 1 {f(b)} {f(a + r)}V{f(b - r)}"
            f"A{f(r)} {f(r)} 0 0 1 {f(b - r)} {f(b)}H{f(a + r)}A{f(r)} {f(r)} 0 0 1 {f(a)} {f(b - r)}"
            f"V{f(a + r)}A{f(r)} {f(r)} 0 0 1 {f(a + r)} {f(a)}Z")


def v_squircle(rc, sc=None, bg=None, dc=None):
    """Destaque do Instagram / ícone: o mesmo C em squircle. Tracejado no lado direito."""
    inset, r = 5 + W / 2, 24.0
    side = 100 - 2 * inset
    per = 4 * (side - 2 * r) + 2 * math.pi * r
    d = _squircle_path(inset, r)
    cap = (W / 2) / per * 100            # meia espessura em unidades de pathLength 100

    def piece(s, e):                    # trecho visível de s até e (fração 0..100, pode passar de 100)
        ln = e - s - 2 * cap
        return (f'<path d="{d}" pathLength="100" fill="none" stroke="{rc}" stroke-width="{f(W)}" stroke-linecap="round" '
                f'stroke-dasharray="{f(ln)} {f(100 - ln)}" stroke-dashoffset="{f(-(s + cap))}"/>')
    # a abertura vai de 12 a 38 (o lado direito inteiro está entre 12,5 e 37,5)
    g, n = 3.6, 2
    dl = (26 - g * (n + 1)) / n
    out = [piece(12 + 26 + g, 112 - g)]
    s = 12 + g
    for _ in range(n):
        out.append(piece(s, s + dl))
        s += dl + g
    return "".join(out) + star(sc or rc)


def v_estrela_linha(rc, sc=None, bg=None, dc=None):
    """Estrela em linha, na mesma família do anel (monoline). Um pouco maior para o miolo respirar."""
    R, sw = 15.6, 5.2
    return (M.SB.ring_c(rc, W, 3, M.OPEN, M.DUTY)
            + f'<polygon points="{LG.star_points(R=R)}" fill="none" stroke="{sc or rc}" stroke-width="{f(sw)}" '
              f'stroke-linejoin="round"/>')


def v_raios(rc, sc=None, bg=None, dc=None):
    """Abertura em raios curtos (brilho / ao vivo) em vez de traços de arco."""
    line = (68, 292)
    out = [SB.seg(rc, W, *line)]
    for a in (-48, -24, 0, 24, 48):
        (x0, y0), (x1, y1) = P(a, OUTER - W + 1.6), P(a, OUTER - 1.6)
        out.append(f'<line x1="{f(x0)}" y1="{f(y0)}" x2="{f(x1)}" y2="{f(y1)}" stroke="{dc or rc}" '
                   f'stroke-width="{f(W * 0.62)}" stroke-linecap="round"/>')
    return "".join(out) + star(sc or rc)


def v_final(rc, sc=None, bg=None, dc=None):
    return M.SYM(rc, sc or rc)


def v_duas_cores(rc, sc=None, bg=None, dc=None):
    """Mesma forma da final com os traços numa segunda cor: no preto traços brancos (cor da estrela);
    no claro traços roxos ao lado da linha Pink Deep (lado a lado, nunca um sobre o outro); no rosa/roxo tudo branco."""
    if not dc:
        dc = sc if sc and sc != rc else (PURPLE if rc == DEEP else rc)
    return v_even(M.OPEN, 3, M.DUTY)(rc, sc, bg, dc)


VARIANTS = [   # slug, nome, ideia, fn
    ("v01-final", "Final v3 (referência)", "O logo de hoje: C de 240°, 3 traços à direita, anel 9,5, estrela inscrita em r 19.", v_final),
    ("v02-dois-tracos", "Dois traços", "C mais fechado (270°) e 2 traços longos. O mais calmo e o que melhor aguenta 16 px.", v_even(90, 2, 0.7)),
    ("v03-quatro-tracos", "Quatro traços", "Abertura de 150° com 4 traços: mais cara de story carregando.", v_even(150, 4, 0.7)),
    ("v04-crescente", "Crescente", "Os 3 traços alongam do topo para baixo (1 · 1,6 · 2,6) até virar a linha.", v_crescente),
    ("v05-um-traco", "Um traço", "Só um traço longo solto na abertura. O mais mínimo — o tracejado vira um “piscar”.", v_um_traco),
    ("v06-giro", "Giro", "A abertura sobe para o canto de cima à direita (−45°), como um anel girando.", v_giro),
    ("v07-disco", "Disco", "Do print 15.01.35: anel mais leve, disco cheio e a estrela vazada no meio. Funciona como botão e selo.", v_disco),
    ("v08-squircle", "Squircle", "O mesmo C em quadrado de cantos redondos — conversa com ícone de app e destaque.", v_squircle),
    ("v09-estrela-linha", "Estrela em linha", "Estrela vazada em traço, mesma família do anel. Mais leve e editorial.", v_estrela_linha),
    ("v10-faisca", "Faísca", "O primeiro traço vira uma estrela pequena: o close escapando do anel, com a estrela grande no centro.", v_faisca),
    ("v11-raios", "Raios", "A abertura em 5 raios curtos em vez de arcos: brilho, “ao vivo”.", v_raios),
    ("v12-duas-cores", "Duas cores", "Forma da final com os traços numa segunda cor: brancos no preto, roxos no claro.", v_duas_cores),
]
V = {v[0]: v for v in VARIANTS}
MAIN = ["v02-dois-tracos", "v07-disco", "v08-squircle"]

# slug, nome, fundo, palavra, anel, estrela  (regras: nada preto no rosa; rosa e roxo nunca um sobre o outro;
# no preto arco rosa + estrela branca; no rosa/Deep/roxo tudo branco; no claro símbolo Pink Deep + palavra ink)
FUNDOS = [
    ("preto", INK, WHITE, PINK, WHITE),
    ("rosa", PINK, WHITE, WHITE, WHITE),
    ("roxo", PURPLE, WHITE, WHITE, WHITE),
    ("cream", CREAM, INK, DEEP, DEEP),
    ("branco", WHITE, INK, DEEP, DEEP),
]
FUNDO = {x[0]: x for x in FUNDOS}


def sym_svg(fn, rc, sc, bg=None, size=256, pad=None):
    pad = (8.0 if bg else 0.0) if pad is None else pad
    v0, vw = 5 - pad, 90 + 2 * pad
    bgr = f'<rect x="{f(v0)}" y="{f(v0)}" width="{f(vw)}" height="{f(vw)}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(v0)} {f(v0)} {f(vw)} {f(vw)}" width="{size}" height="{size}">'
            f'<title>Clozzy</title>{bgr}{fn(rc, sc, bg)}</svg>\n')


def tile_svg(fn, bg, rc, sc, size=1024, scale=0.62):
    o = 50 - 50 * scale
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="{size}" height="{size}">'
            f'<title>Clozzy</title><rect width="100" height="100" rx="22.37" fill="{bg}"/>'
            f'<g transform="translate({f(o)} {f(o)}) scale({f(scale)})">{fn(rc, sc, bg)}</g></svg>\n')


def lockup_svg(fn, fundo, kind="horizontal", bg=True):
    _s, b, wc, rc, sc = FUNDO[fundo]
    T.SYM = lambda r, s=None, small=False: fn(r, s, b)    # os lockups do v7 usam T.SYM na hora de montar
    L = M.LOCKUP_H if kind == "horizontal" else M.LOCKUP_V
    return L(wc, rc, sc).svg(pad=24, bg=b if bg else None, title="Clozzy")


OUT = HERE / "svg"


def build():
    shutil.rmtree(OUT, ignore_errors=True)
    OUT.mkdir()
    n = 0
    for slug, _nm, _i, fn in VARIANTS:
        for fs, b, wc, rc, sc in FUNDOS:
            (OUT / f"{slug}-{fs}.svg").write_text(sym_svg(fn, rc, sc, b))
            (OUT / f"{slug}-lockup-{fs}.svg").write_text(lockup_svg(fn, fs))
            n += 2
        for fs in ("preto", "branco"):
            (OUT / f"{slug}-empilhado-{fs}.svg").write_text(lockup_svg(fn, fs, "empilhado"))
            n += 1
        for fs in ("rosa", "preto", "roxo"):
            _s, b, wc, rc, sc = FUNDO[fs]
            (OUT / f"{slug}-app-{fs}.svg").write_text(tile_svg(fn, b, rc, sc))
            n += 1
        # transparente (Pink Deep) para uso solto
        (OUT / f"{slug}.svg").write_text(sym_svg(fn, DEEP, DEEP))
        n += 1
    return n


if __name__ == "__main__":
    print("ok", build(), "svgs")

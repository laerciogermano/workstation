#!/usr/bin/env python3
"""Clozzy — símbolo da v3: anel no estilo do print refs/“Captura de Tela 2026-11-11 às 14.54.44” (anel de story “novo”):
metade esquerda em linha cheia, metade direita em traços curtos e iguais (do topo, pela direita, até embaixo), anel fino.
Dentro, a estrela original do Círculo próximo. Grid 100, anel externo r = 45."""
import math, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
MARCA = HERE.parent
sys.path.insert(0, str(MARCA / "logo-c-canto-v2"))
sys.path.insert(0, str(MARCA / "identidade-nova"))
sys.path.insert(0, str(MARCA / "logo-2028"))
import _canto as K  # noqa: E402
import _logos as LG  # noqa: E402

f = K.f
OUTER = 45.0
TOP, BOTTOM = 270.0, 90.0     # graus SVG (0 = direita, 90 = baixo, horário)


def seg(c, w, a, b):
    return K.seg(c, w, a, b)


ROUND = 0.42   # raio do canto = 42% da espessura (1.0 seria meia-lua inteira; 0 seria ponta reta)


def dash(c, w, a, b, k=None):
    """v4: traço com CANTOS ARREDONDADOS (bordas mais suaves), mesmo comprimento e espessura da v3.
    Setor de anel encolhido de r e contornado com traço 2r + linejoin round → cantos de raio r."""
    r = w * (ROUND if k is None else k)
    ro, ri = OUTER - r, OUTER - w + r
    rm = OUTER - w / 2
    d = math.degrees(r / rm)
    a0, a1 = a + d, b - d
    (x0, y0), (x1, y1) = K.P(a0, ro), K.P(a1, ro)
    (x2, y2), (x3, y3) = K.P(a1, ri), K.P(a0, ri)
    path = (f"M{f(x0)} {f(y0)}A{f(ro)} {f(ro)} 0 0 1 {f(x1)} {f(y1)}L{f(x2)} {f(y2)}"
            f"A{f(ri)} {f(ri)} 0 0 0 {f(x3)} {f(y3)}Z")
    return f'<path d="{path}" fill="{c}" stroke="{c}" stroke-width="{f(2 * r)}" stroke-linejoin="round"/>'


def dash_reto(c, w, a, b):
    """v3: ponta reta (como no print)."""
    rm = OUTER - w / 2
    (x0, y0), (x1, y1) = K.P(a, rm), K.P(b, rm)
    return (f'<path d="M{f(x0)} {f(y0)}A{f(rm)} {f(rm)} 0 0 1 {f(x1)} {f(y1)}" fill="none" stroke="{c}" '
            f'stroke-width="{f(w)}" stroke-linecap="butt"/>')


def star(c, R=19.0, cx=50, cy=50):
    k = R / LG.STAR_R
    return (f'<polygon points="{LG.star_points(cx=cx, cy=cy, R=R)}" fill="{c}" stroke="{c}" '
            f'stroke-width="{f(LG.STAR_ROUND * k)}" stroke-linejoin="round"/>')


def ring(c, w, n, duty=0.56, start=TOP + 2, end=BOTTOM + 360 - 2):
    """Linha cheia de BOTTOM a TOP pela esquerda; n traços iguais de TOP a BOTTOM pela direita.
    `duty` = fração visível de cada período (o vão das junções é igual ao vão entre traços)."""
    span = end - start
    period = span / (n + (1 - duty))          # n traços e n+1 vãos: n*P*duty + (n+1)*P*(1-duty) = span
    d, g = period * duty, period * (1 - duty)
    out = []
    # linha cheia: do fim do último vão (perto de baixo) até o começo do primeiro vão (perto do topo), pela esquerda
    out.append(seg(c, w, (end - 360) + g, start - g))
    a = start + g
    for _ in range(n):
        out.append(dash(c, w, a, a + d))
        a += d + g
    return "".join(out)


def make(w, n, R=19.0, duty=0.56, sw=None, sn=None, disk=False):
    """fn(rc, sc, small) no mesmo formato de _canto.make. `disk`: disco cheio dentro (como o print), estrela recortada em sc."""
    def fn(rc=K.DEEP, sc=None, small=False):
        sc = sc or rc
        ww, nn = (sw or w * 1.6, sn or max(4, n // 2)) if small else (w, n)
        body = ring(rc, ww, nn, duty)
        if disk:
            r = OUTER - ww - (6 if not small else 5)
            body += f'<circle cx="50" cy="50" r="{f(r)}" fill="{rc}"/>' + star(K.PINK if rc == K.WHITE else (sc if sc != rc else K.WHITE), R * r / 33)
        else:
            body += star(sc, R if not small else min(R * 1.05, OUTER - ww - 9))
        return body
    return fn


STAR_R = 23.0   # v6: meio-termo — v4 = 19 (centro aberto demais), v5 = 27 (estrela grande demais)

VARIANTS = [   # slug, nome, ideia, fn
    ("t1-print", "Como no print", "Anel fino (traço 5) com 11 traços curtos de cantos arredondados na metade direita, como no print. Estrela R 23.", make(5, 11, R=STAR_R, duty=0.62, sw=8, sn=6)),
    ("t2-mais-tracos", "Mais traços", "Traço 4 com 15 traços: o picotado mais fino, o mais delicado.", make(4, 15, R=STAR_R, duty=0.6, sw=7, sn=7)),
    ("t3-menos-tracos", "Menos traços", "Traço 7 com 8 traços mais longos: aguenta melhor no pequeno.", make(7, 8, R=STAR_R - 1, duty=0.64, sw=9, sn=5)),
    ("t4-disco", "Com disco", "Anel tracejado em volta de um disco cheio com a estrela branca dentro, como o botão do print.", make(4.5, 13, R=19, duty=0.6, sw=7, sn=6, disk=True)),
]
FN = {v[0]: v[3] for v in VARIANTS}
MAIN_SYM = "t1-print"
SYM = FN[MAIN_SYM]

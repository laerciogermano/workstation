#!/usr/bin/env python3
"""Estudos da estrutura do “Go” (go/): G da Poppins 800 Itálico + pin desenhados como um conjunto.

Medidas do G (unidades da fonte): traço ≈170 · barra 261–402 · terminal superior corta em 473 ·
abertura do G entre 402 e 473 (eixo 437,5) · altura das maiúsculas 712.
E1 grade comum · E2 encaixe · E3 ligadura · E4 mesma caixa · E5 canal
"""
import json, os
import pathops
import _build_conceitos as B
from _build_conceitos import Shape, glyph, write_svg, bounds, TAN, O_R
from _build_variacoes import pin, P, S

OUT = os.path.join(B.HERE, "go")
os.makedirs(OUT, exist_ok=True)

STROKE = 170            # traço do G = anel do pin
AXIS = (402 + 473) / 2  # eixo da abertura do G
CAP = 712
G, GW = glyph("G")


def pin_axis(cx, R=O_R, cy=AXIS, hole=None, tip_len=None):
    hole = R - STROKE if hole is None else hole
    tip = (0, -(tip_len if tip_len is not None else 510 / 288 * R))
    return pin(cx, cy=cy, R=R, hole=hole, tip=tip)


def grow(cx, gap, R=O_R, cy=AXIS, tip_len=None):
    """Silhueta do pin com respiro 'gap' (escala em torno do centro: tangentes andam 'gap')."""
    k = (R + gap) / R
    tl = (tip_len if tip_len is not None else 510 / 288 * R) * k
    return P(pin(cx, cy=cy, R=R + gap, hole=0, tip=(0, -tl)))


def union(*shapes):
    r = P(shapes[0])
    for s in shapes[1:]:
        r = pathops.op(r, P(s), pathops.PathOp.UNION)
    return S(r)


def minus(a, b_path):
    return S(pathops.op(P(a), b_path, pathops.PathOp.DIFFERENCE))


E = {}

# E1 — grade comum: furo do pin no eixo da abertura do G, anel = traço do G, mesmo respiro das letras
cx1 = GW + B.TRACK + 70 + 317.5 - AXIS * TAN
E["e1"] = dict(nome="grade comum", parts=[(G, "go"), (pin_axis(cx1), "go")],
               ideia="Pin e G na mesma grade: o furo do pin fica no eixo da abertura do G e o anel tem o traço do G (170).",
               risco="Refino invisível para leigos; continua sendo letra + pin lado a lado")

# E2 — encaixe: o pin entra na boca do G; o G é recortado com respiro constante de 40
cx2 = cx1 - 175
E["e2"] = dict(nome="encaixe", parts=[(minus(G, grow(cx2, 42)), "go"), (pin_axis(cx2), "go")],
               ideia="O pin entra na abertura do G e o G abre espaço para ele, com respiro constante: os dois se abraçam.",
               risco="O respiro de 42 fecha abaixo de 24 px; precisa de corte pequeno sem encaixe")

# E3 — ligadura: a barra do G atravessa até o anel do pin — uma peça só
cx3 = cx1 - 150
E["e3"] = dict(nome="ligadura", parts=[(union(G, pin_axis(cx3)), "go")],
               ideia="A barra do G encosta no anel do pin e vira uma peça só: o G entrega o pin.",
               risco="Pode ler como “G” com um enfeite; o pin perde independência na animação")

# E4 — mesma caixa: pin com a altura exata do G (topo 712, ponta na linha de base)
R4 = CAP / (1 + 510 / 288)
cy4 = CAP - R4
cx4 = GW + B.TRACK + 70 + R4 - cy4 * TAN + 40
E["e4"] = dict(nome="mesma caixa", parts=[(G, "go"), (pin_axis(cx4, R=R4, cy=cy4), "go")],
               ideia="O pin tem exatamente a altura do G: topo nas maiúsculas, ponta na linha de base.",
               risco="Cabeça menor que um “o”; o furo (r 87) aperta em 32 px")

# E5 — canal: a boca do G (402–473) continua reta por dentro do anel do pin até o furo
def channel(x0, x1, y0=402, y1=473):
    def draw(pen):
        pen.moveTo((x0, y0)); pen.lineTo((x1, y0)); pen.lineTo((x1, y1)); pen.lineTo((x0, y1)); pen.closePath()
    return Shape(draw)


cx5 = cx2
pin5 = S(pathops.op(P(pin_axis(cx5)), P(channel(cx5 - 600, cx5)), pathops.PathOp.DIFFERENCE))
E["e5"] = dict(nome="canal", parts=[(minus(G, grow(cx5, 42)), "go"), (pin5, "go")],
               ideia="A boca do G continua reta por dentro do pin até o furo: uma rota só que atravessa o G e chega no pin.",
               risco="O pin fica aberto de um lado (lê como “C” com ponta); o canal de 71 some em 16 px")


def wordmark_with(go_parts, go_x):
    role, cur = [], 0.0
    for ch in "Role":
        s, w = glyph(ch, cur)
        role.append((s, "role"))
        cur += w + B.TRACK
    shift = cur
    moved = [(Shape(lambda pen, s=s: s.to_pen(pen), skew=False, dx=shift), r) for s, r in go_parts]
    return role + moved


def guides_svg(key, parts, W=760, H=520, pad=60):
    """SVG de construção: forma preta + linhas de grade e medidas (só para a apresentação)."""
    x0, y0, x1, y1 = bounds(parts)
    y0, y1 = min(y0, -120), max(y1, 760)
    s = min((W - 2 * pad) / (x1 - x0), (H - 2 * pad) / (y1 - y0))
    tx = pad - x0 * s + ((W - 2 * pad) - (x1 - x0) * s) / 2
    ty = pad + y1 * s
    Y = lambda y: -y * s + ty
    body = "".join(f'<path fill="#05070F" fill-rule="evenodd" d="{B.path_d(sh, s, tx, ty)}"/>' for sh, _ in parts)
    lines = [(0, "base 0"), (402, "barra 402"), (AXIS, "eixo 437"), (473, "terminal 473"), (CAP, "maiúsculas 712")]
    g = ""
    for y, lab in lines:
        c = "#FF1F7A" if "eixo" in lab else "#8749FF"
        dash = "" if "eixo" in lab else ' stroke-dasharray="6 5"'
        dy = 16 if "barra" in lab else -5
        tx_, anc = (12, "start") if "eixo" in lab else (W - 12, "end")
        g += (f'<line x1="10" x2="{W-10}" y1="{Y(y):.1f}" y2="{Y(y):.1f}" stroke="{c}" stroke-width="1.4"{dash}/>'
              f'<text x="{tx_}" y="{Y(y)+(dy if "eixo" not in lab else -5):.1f}" text-anchor="{anc}" font-family="Poppins,sans-serif" font-size="13" font-weight="600" fill="{c}">{lab}</text>')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}"><rect width="{W}" height="{H}" fill="#fff"/>'
           f'{body}<g opacity=".9">{g}</g></svg>')
    open(os.path.join(OUT, f"{key}-construcao.svg"), "w").write(svg)


def main():
    meta = {}
    for k, v in E.items():
        parts = v["parts"]
        for suf, pal in B.PALETTES.items():
            write_svg(f"{k}-go{suf}.svg", parts, pal, box="square", out=OUT)
            write_svg(f"{k}-lockup{suf}.svg", wordmark_with(parts, 0), pal, out=OUT)
        guides_svg(k, parts)
        meta[k] = {x: v[x] for x in ("nome", "ideia", "risco")}
    json.dump(meta, open(os.path.join(OUT, "meta.json"), "w"), ensure_ascii=False, indent=1)
    print("ok", len(os.listdir(OUT)))


if __name__ == "__main__":
    main()

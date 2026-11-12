#!/usr/bin/env python3
"""Variações do E5 “canal” (canal/) — escolhido como primeiro em 08/11/2026.

Regra comum: a boca do G (402–473) continua como canal até o furo do pin; anel = traço do G (170).
C1 canal (base) · C2 canal fino · C3 furo largo · C4 ligadura · C5 à distância ·
C6 ponta na base · C7 ícone bloco · C8 pin-canal
Rodar depois de _build_go.py.
"""
import json, os
import pathops
import _build_conceitos as B
import _build_go as GO
from _build_conceitos import Shape, write_svg, bounds
from _build_variacoes import P, S, rrect
from _build_go import G, AXIS, STROKE, pin_axis, grow, channel, minus, union, wordmark_with, cx1, cx2

OUT = os.path.join(B.HERE, "canal")
os.makedirs(OUT, exist_ok=True)


def cut(pin_shape, cx, y0=402, y1=473, reach=600):
    """Abre o canal no pin: do lado esquerdo até o centro do furo."""
    return S(pathops.op(P(pin_shape), P(channel(cx - reach, cx, y0, y1)), pathops.PathOp.DIFFERENCE))


def e5_parts(cx=cx2, gap=42, hole=None, tip_len=None, y0=402, y1=473):
    p = cut(pin_axis(cx, hole=hole, tip_len=tip_len), cx, y0, y1)
    return [(minus(G, grow(cx, gap, tip_len=tip_len)), "go"), (p, "go")]


V = {}

V["c1"] = dict(nome="canal", parts=e5_parts(),
               ideia="O E5 como foi aprovado: a boca do G atravessa o anel e chega no furo.",
               risco="Base da família; abaixo de 24 px usar o C8 sem canal ou o E1")

# C2 — canal fino: 40 no eixo; o pin fecha mais e lê mais como pin de mapa
V["c2"] = dict(nome="canal fino", parts=e5_parts(y0=AXIS - 20, y1=AXIS + 20),
               ideia="O canal afina para 40, centrado no eixo: o pin quase fecha e lê mais como pin de mapa.",
               risco="Perde a continuidade exata com a boca do G (71); some em 32 px")

# C3 — furo largo: furo r140 (anel 148), lê mais como o “o” do nome
V["c3"] = dict(nome="furo largo", parts=e5_parts(hole=140),
               ideia="Furo maior (r140): a cabeça lê mais como o “o” do RoleGo e o canal desemboca num espaço maior.",
               risco="Anel (148) mais fino que o traço do G (170); pin fica mais leve que o G")

# C4 — ligadura: G inteiro + pin com canal fundidos; a barra do G vira a parte de baixo do anel
V["c4"] = dict(nome="ligadura", parts=[(union(G, cut(pin_axis(cx2), cx2)), "go")],
               ideia="Sem respiro: o G e o pin viram uma peça só; a barra e o terminal do G continuam como as bordas do canal.",
               risco="Uma peça só, mais pesada; o pin perde independência na animação")

# C5 — à distância: G intacto, pin com canal na posição do E1 (a rota aponta para a boca do G)
V["c5"] = dict(nome="à distância", parts=[(G, "go"), (cut(pin_axis(cx1), cx1), "go")],
               ideia="O G fica intacto e o pin se afasta; o canal aponta para a boca do G como se a rota tivesse acabado de sair dela.",
               risco="Mais largo; o canal sozinho pode ler como “C” com ponta")

# C6 — ponta na base: ponta curta que toca a linha de base, Go mais compacto
V["c6"] = dict(nome="ponta na base", parts=e5_parts(tip_len=420),
               ideia="A ponta do pin para na linha de base: o Go fica do tamanho das letras e o lockup alinha embaixo.",
               risco="Pin mais gordo e curto, menos agulha; perde um pouco do “aqui”")

# C7 — ícone bloco: o C1 vazado num bloco ciano (ícone de app)
c1 = V["c1"]["parts"]
x0, y0, x1, y1 = bounds(c1)
w, h = x1 - x0, y1 - y0
side = w * 1.36
mx, my = (x0 + x1) / 2 - 12, (y0 + y1) / 2
blk = rrect(mx - side / 2, my - side / 2, mx + side / 2, my + side / 2, side * 0.23)
r = P(blk)
for s, _ in c1:
    r = pathops.op(r, P(s), pathops.PathOp.DIFFERENCE)
V["c7"] = dict(nome="ícone bloco", parts=[(S(r), "go")],
               ideia="O Go do canal vazado num bloco ciano: ícone de app e avatar (@rolego).",
               risco="Go é largo (2:1); no quadrado ocupa a metade da altura")

# C8 — pin-canal: só o pin com o canal (símbolo solto)
cx8 = 0.0
pin8 = cut(pin_axis(cx8), cx8)
V["c8"] = dict(nome="pin-canal", parts=[(pin8, "go")],
               ideia="Só o pin com o canal: o símbolo solto para mapa, loading e favicon de 32 px.",
               risco="Sem o G vira um “C” com ponta; precisa do wordmark por perto para fazer sentido")

def lockup(k, parts):
    """C1–C6: Go do canal no lugar do “Go” do nome. C7/C8: símbolo ao lado do wordmark."""
    if k not in ("c7", "c8"):
        return wordmark_with(parts, 0)
    from fontTools.pens.transformPen import TransformPen
    from _build_conceitos import wordmark
    bx0, by0, bx1, by1 = bounds(parts)
    k_ = 900 / (by1 - by0) if k == "c7" else 1.0  # bloco com ~1,25× a altura das maiúsculas
    sym = [(Shape(lambda pen, sh=sh: sh.to_pen(TransformPen(pen, (k_, 0, 0, k_, -bx0 * k_, 356 - (by0 + by1) / 2 * k_))),
                  skew=False), r) for sh, r in parts]
    wm, _ = wordmark(x=(bx1 - bx0) * k_ + 150)
    return sym + wm


def main():
    GO.OUT = OUT  # guides_svg grava aqui
    meta = {}
    for k, v in V.items():
        parts = v["parts"]
        for suf, pal in B.PALETTES.items():
            write_svg(f"{k}-go{suf}.svg", parts, pal, box="square", out=OUT)
            write_svg(f"{k}-lockup{suf}.svg", lockup(k, parts), pal, out=OUT)
        GO.guides_svg(k, parts)
        meta[k] = {x: v[x] for x in ("nome", "ideia", "risco")}
    json.dump(meta, open(os.path.join(OUT, "meta.json"), "w"), ensure_ascii=False, indent=1)
    print("ok", len(os.listdir(OUT)))


if __name__ == "__main__":
    main()

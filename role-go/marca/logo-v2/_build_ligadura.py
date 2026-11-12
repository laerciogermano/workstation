#!/usr/bin/env python3
"""Família “ligadura” (ligadura/) — a partir de C4 ligadura + C6 ponta na base (preferidos em 08/11/2026).

Regra comum: G e pin numa peça só; a barra e o terminal do G viram as bordas do canal até o furo;
ponta do pin na linha de base (tip 420 → ponta em y 17, a base com overshoot).
L1 ligadura na base · L2 furo largo · L3 encaixe raso · L4 encaixe fundo · L5 canal fino ·
L6 fechado (corte pequeno) · L7 ícone bloco · L8 ícone redondo
Também gera ícones opacos para os mockups (icon-*.svg) e o lockup empilhado.
Rodar depois de _build_canal.py.
"""
import json, os
import pathops
import _build_conceitos as B
import _build_go as GO
from _build_conceitos import Shape, write_svg, bounds, path_d, INK, CYAN, WHITE, VIOLET, DARK
from _build_variacoes import P, S, rrect
from _build_go import G, AXIS, pin_axis, union, wordmark_with, cx2
from _build_canal import cut

OUT = os.path.join(B.HERE, "ligadura")
os.makedirs(OUT, exist_ok=True)
TIP = 420  # ponta na base (C6)


def lig(cx=cx2, hole=None, y0=402, y1=473, channel=True, tip_len=TIP):
    p = pin_axis(cx, hole=hole, tip_len=tip_len)
    if channel:
        p = cut(p, cx, y0, y1)
    return [(union(G, p), "go")]


def boxed(parts, shape="block"):
    """Go vazado num bloco (rrect) ou num círculo."""
    x0, y0, x1, y1 = bounds(parts)
    w = x1 - x0
    side = w * (1.36 if shape == "block" else 1.5)
    mx, my = (x0 + x1) / 2 - 12, (y0 + y1) / 2 + 10
    r = side * (0.23 if shape == "block" else 0.5)
    r_ = P(rrect(mx - side / 2, my - side / 2, mx + side / 2, my + side / 2, r))
    for s, _ in parts:
        r_ = pathops.op(r_, P(s), pathops.PathOp.DIFFERENCE)
    return [(S(r_), "go")]


V = {}
V["l1"] = dict(nome="ligadura na base", parts=lig(),
               ideia="C4 + C6: G e pin numa peça só, com a ponta na linha de base. O Go fica do tamanho das letras.",
               risco="Peça única e pesada; abaixo de 24 px usar o L6 (sem canal)")
V["l2"] = dict(nome="furo largo", parts=lig(hole=140),
               ideia="O furo cresce (r140): a cabeça do pin lê mais como o “o” do nome e o canal desemboca num espaço maior.",
               risco="Anel mais fino (148) que o traço do G (170)")
V["l3"] = dict(nome="encaixe raso", parts=lig(cx=cx2 + 80),
               ideia="O pin entra menos no G: a cabeça aparece inteira e a ligação fica só na barra e no terminal.",
               risco="Mais largo; a barra que liga as duas formas fica comprida")
V["l4"] = dict(nome="encaixe fundo", parts=lig(cx=cx2 - 60),
               ideia="O pin entra mais no G: monograma compacto, quase quadrado, bom para ícone.",
               risco="O G perde parte da curva da direita; lê menos como “G” isolado")
V["l5"] = dict(nome="canal fino", parts=lig(y0=AXIS - 20, y1=AXIS + 20),
               ideia="Canal de 40 no eixo: G e pin ficam mais fechados e o pin lê mais como pin de mapa.",
               risco="Perde a continuidade exata com a boca do G (71)")
V["l6"] = dict(nome="fechado", parts=lig(channel=False),
               ideia="Sem canal: o corte para 16–24 px (favicon, notificação, marcador pequeno).",
               risco="Uso só em tamanho pequeno; em grande perde a ideia da rota")
V["l7"] = dict(nome="ícone bloco", parts=boxed(V["l1"]["parts"]),
               ideia="O L1 vazado num bloco: ícone de app, com o Go ocupando a largura útil.",
               risco="Go largo (2:1) ocupa metade da altura do bloco")
V["l8"] = dict(nome="ícone redondo", parts=boxed(V["l1"]["parts"], "circle"),
               ideia="O L1 vazado num círculo: avatar de rede social, selo e adesivo.",
               risco="No círculo o Go fica menor; precisa da versão L6 em 32 px")


def lockup(k, parts):
    if k not in ("l7", "l8"):
        return wordmark_with(parts, 0)
    from fontTools.pens.transformPen import TransformPen
    from _build_conceitos import wordmark
    bx0, by0, bx1, by1 = bounds(parts)
    k_ = 900 / (by1 - by0)
    sym = [(Shape(lambda pen, sh=sh: sh.to_pen(TransformPen(pen, (k_, 0, 0, k_, -bx0 * k_, 356 - (by0 + by1) / 2 * k_))),
                  skew=False), r) for sh, r in parts]
    wm, _ = wordmark(x=(bx1 - bx0) * k_ + 150)
    return sym + wm


def icon_svg(name, parts, bg, fg, rx=0.23, fill=0.72, size=256):
    """Ícone opaco (fundo + Go) para mockups e lojas de app."""
    x0, y0, x1, y1 = bounds(parts)
    s = size * fill / (x1 - x0)
    tx = (size - (x1 - x0) * s) / 2 - x0 * s
    ty = (size - (y1 - y0) * s) / 2 + y1 * s - size * 0.01
    d = " ".join(path_d(p, s, tx, ty) for p, _ in parts)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" role="img" aria-label="RoleGo"><title>RoleGo</title>'
           f'<rect width="{size}" height="{size}" rx="{size * rx:.1f}" fill="{bg}"/>'
           f'<path fill="{fg}" fill-rule="evenodd" d="{d}"/></svg>')
    open(os.path.join(OUT, name), "w").write(svg)


def stacked(name, parts, colors, gap=150):
    """Lockup empilhado: Go em cima, RoleGo embaixo, centralizados."""
    from fontTools.pens.transformPen import TransformPen
    from _build_conceitos import wordmark
    wm, wmw = wordmark()
    sx0, sy0, sx1, sy1 = bounds(parts)
    wx0, wy0, wx1, wy1 = bounds(wm)
    k = 1.6
    dx = (wx0 + wx1) / 2 - (sx0 + sx1) / 2 * k
    dy = wy1 + gap - sy0 * k
    sym = [(Shape(lambda pen, sh=sh: sh.to_pen(TransformPen(pen, (k, 0, 0, k, dx, dy))), skew=False), r) for sh, r in parts]
    write_svg(name, sym + wm, colors, out=OUT)


def main():
    GO.OUT = OUT
    meta = {}
    for k, v in V.items():
        parts = v["parts"]
        for suf, pal in B.PALETTES.items():
            write_svg(f"{k}-go{suf}.svg", parts, pal, box="square", out=OUT)
            write_svg(f"{k}-lockup{suf}.svg", lockup(k, parts), pal, out=OUT)
        GO.guides_svg(k, parts)
        meta[k] = {x: v[x] for x in ("nome", "ideia", "risco")}
    json.dump(meta, open(os.path.join(OUT, "meta.json"), "w"), ensure_ascii=False, indent=1)
    L1, L6 = V["l1"]["parts"], V["l6"]["parts"]
    icon_svg("icon-app.svg", L1, CYAN, INK)               # ícone de app: bloco ciano, Go preto
    icon_svg("icon-app-dark.svg", L1, DARK, CYAN)         # variante escura
    icon_svg("icon-avatar.svg", L1, CYAN, INK, rx=0.5, fill=0.62)
    icon_svg("icon-fav.svg", L6, CYAN, INK, rx=0.22, fill=0.84)  # favicon: L6 fechado, quase sangrando
    for suf, pal in B.PALETTES.items():
        stacked(f"l1-stacked{suf}.svg", L1, pal)
    print("ok", len(os.listdir(OUT)))


if __name__ == "__main__":
    main()

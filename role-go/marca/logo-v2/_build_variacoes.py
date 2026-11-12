#!/usr/bin/env python3
"""Variações V1–V8 (variacoes/) a partir dos conceitos A/B/C. Usa skia-pathops para recortes e respiros."""
import json, math, os
import pathops
from fontTools.pens.transformPen import TransformPen
import _build_conceitos as B
from _build_conceitos import Shape, arc, circle, glyph, wordmark, write_svg, bounds, PALETTES, TAN, O_R, O_r, PIN_CY

OUT = os.path.join(B.HERE, "variacoes")
os.makedirs(OUT, exist_ok=True)
GAP = 150


# ---------- primitivas ----------
def pin_general(pen, cx, cy, R, tx, ty):
    """Pin: círculo (cx,cy,R) + tangentes até a ponta (tx,ty)."""
    d = math.hypot(tx - cx, ty - cy)
    phi = math.degrees(math.atan2(ty - cy, tx - cx))
    a = math.degrees(math.acos(R / d))
    arc(pen, cx, cy, R, phi + a, phi - a + 360)
    pen.lineTo((tx, ty))
    pen.closePath()


def pin(cx, cy=PIN_CY, R=O_R, hole=O_r, dot=0, tip=None, skew=True):
    """Pin com furo (sem ponto desde 08/11). tip=(dx,dy) relativo ao centro; padrão = reto para baixo, 510/288·R."""
    tdx, tdy = tip if tip else (0, -510 / 288 * R)
    def draw(pen):
        pin_general(pen, cx, cy, R, cx + tdx, cy + tdy)
        if hole:
            circle(pen, cx, cy, hole, ccw=False)
            if dot:
                circle(pen, cx, cy, dot, ccw=True)
    return Shape(draw, skew=skew)


def silhouette(cx, cy=PIN_CY, R=O_R, tip=None, skew=True):
    return pin(cx, cy, R, hole=0, tip=tip, skew=skew)


def rrect(x0, y0, x1, y1, r, notch=0):
    """Retângulo arredondado (anti-horário); notch>0 = recortes de ingresso nas laterais."""
    def draw(pen):
        my = (y0 + y1) / 2
        pen.moveTo((x0 + r, y0))
        pen.lineTo((x1 - r, y0)); arc(pen, x1 - r, y0 + r, r, -90, 0, start=False)
        if notch:
            pen.lineTo((x1, my - notch)); arc(pen, x1, my, notch, -90, -270, start=False)
        pen.lineTo((x1, y1 - r)); arc(pen, x1 - r, y1 - r, r, 0, 90, start=False)
        pen.lineTo((x0 + r, y1)); arc(pen, x0 + r, y1 - r, r, 90, 180, start=False)
        if notch:
            pen.lineTo((x0, my + notch)); arc(pen, x0, my, notch, 90, -90, start=False)
        pen.lineTo((x0, y0 + r)); arc(pen, x0 + r, y0 + r, r, 180, 270, start=False)
        pen.closePath()
    return Shape(draw, skew=False)


def ellipse_ring(cx, cy, rx, ry, t):
    def draw(pen):
        for r, ccw in ((1.0, True), (None, False)):
            if ccw:
                circle(TransformPen(pen, (rx, 0, 0, ry, cx, cy)), 0, 0, 1, ccw=True)
            else:
                circle(TransformPen(pen, (rx - t, 0, 0, ry - t, cx, cy)), 0, 0, 1, ccw=False)
    return Shape(draw, skew=False)


def P(shape):
    p = pathops.Path()
    shape.to_pen(p.getPen())
    return p


def S(path):
    return Shape(lambda pen, p=path: p.draw(pen), skew=False)


def minus(a, *bs):
    r = P(a)
    for b in bs:
        r = pathops.op(r, P(b) if isinstance(b, Shape) else b, pathops.PathOp.DIFFERENCE)
    return S(r)


def expanded_pin(cx, gap, cy=PIN_CY, R=O_R):
    """Silhueta do pin com respiro exato: escala em volta do centro (tangentes sobem 'gap' também)."""
    k = (R + gap) / R
    return P(silhouette(cx, cy, R + gap, tip=(0, -510 / 288 * R * k)))


def lockup_with_wordmark(sym, pin_word=False):
    x1 = bounds(sym)[2]
    wm, _ = wordmark(x=x1 + GAP, pin=pin_word)
    return sym + wm


# ---------- variações ----------
cxA = 0.0  # centro x (desinclinado) dos pins avulsos
V = {}

# V1 — pin aberto: furo maior (corte que aguenta 16 px)
sym = [(pin(cxA, hole=150, dot=0), "go")]
V["v1"] = dict(nome="pin aberto", base="A", sym=sym, lock=lockup_with_wordmark(sym),
               ideia="O pin do A com furo maior: a forma mais simples, que aguenta 16 px.",
               risco="Sozinho é o pin padrão de mapa; a ligação com o “o” só aparece no wordmark")

# V2 — R pin: o ping do B vira um mini pin
R, w = glyph("R")
mini = pin(w + 150, cy=560, R=125, hole=52, dot=0)
sym = [(R, "role"), (mini, "go")]
V["v2"] = dict(nome="R pin", base="A + B", sym=sym, lock=lockup_with_wordmark(sym),
               ideia="O R do ícone aprovado com o pin no lugar do ponto: monograma + localização.",
               risco="Dois elementos pequenos lado a lado; em 16 px o mini pin vira ponto")

# V3 — match: dois pins no mesmo rolê (o grupo), com respiro entre eles
front = pin(cxA, hole=O_r)
back_s = pin(cxA + 330, cy=PIN_CY + 120, hole=O_r, dot=0)
back = minus(back_s, expanded_pin(cxA, 45))
sym = [(back, "alt"), (front, "go")]
V["v3"] = dict(nome="match", base="A", sym=sym, lock=lockup_with_wordmark(sym),
               ideia="Dois pins sobrepostos: o match do grupo, todo mundo no mesmo rolê.",
               risco="Mais detalhe que o A; o pin de trás perde o furo em 16 px")

# V4 — pin no bloco: ícone de app (bloco ciano, pin vazado)
blk = rrect(-500, -100, 500, 900, 230)
p_in = pin(-400 * TAN, cy=498, R=255, hole=105)  # centro óptico do pin no centro do bloco
sym = [(minus(blk, p_in), "go")]
V["v4"] = dict(nome="pin no bloco", base="A", sym=sym, lock=lockup_with_wordmark(sym),
               ideia="Ícone de app: o pin do A vazado num bloco ciano.",
               risco="É uma aplicação do A (ícone de app), não uma marca nova")

# V5 — Go: o G e o pin, monograma do “vai”
G, gw = glyph("G")
pgo = pin(gw + B.TRACK + 70 + 317.5 - B.O_CY * TAN)
sym = [(G, "go"), (pgo, "go")]
lockA, _ = wordmark(pin=True)
V["v5"] = dict(nome="Go", base="A", sym=sym, lock=lockA,
               ideia="As duas letras do “Go” sozinhas: o G e o pin, o “bora” do RoleGo.",
               risco="Símbolo largo (2:1); no ícone quadrado o pin fica pequeno")

# V6 — pin pousado: o pin chegando no lugar (anel no chão)
pp = pin(cxA)
tip_x = cxA + (PIN_CY - 510) * TAN
ring = ellipse_ring(tip_x, PIN_CY - 510 + 10, 260, 78, 46)
ring_cut = minus(ring, expanded_pin(cxA, 40))
sym = [(pp, "go"), (ring_cut, "alt")]
V["v6"] = dict(nome="pin pousado", base="A + C", sym=sym, lock=lockup_with_wordmark(sym),
               ideia="O pin pousa num anel no chão: chegou no rolê.",
               risco="O anel lembra “alvo” ou sombra; some em 16 px (usar V1 no favicon)")

# V7 — pin balão: a ponta vai para a esquerda, como balão de chat
pb = pin(cxA, tip=(-290, -460))
sym = [(pb, "go")]
V["v7"] = dict(nome="pin balão", base="A", sym=sym, lock=lockup_with_wordmark(sym),
               ideia="A ponta do pin vira a ponta de um balão: lugar + conversa, o lado social do app.",
               risco="Pode ler só como balão de chat; perde a leitura de localização")

# V8 — ingresso: o pin vazado num ingresso
tk = rrect(-560, -40, 560, 760, 90, notch=95)
p_tk = pin(-360 * TAN, cy=443, R=215, hole=88)
sym = [(minus(tk, p_tk), "go")]
V["v8"] = dict(nome="ingresso", base="A + emblema", sym=sym, lock=lockup_with_wordmark(sym),
               ideia="Um ingresso com o pin vazado: o rolê e a entrada no mesmo selo.",
               risco="Ingresso é clichê de eventos; selo pesa ao lado do wordmark")


def main():
    meta = {}
    for k, v in V.items():
        for suf, pal in PALETTES.items():
            write_svg(f"{k}-symbol{suf}.svg", v["sym"], pal, box="square", out=OUT)
            write_svg(f"{k}-lockup{suf}.svg", v["lock"], pal, out=OUT)
        meta[k] = {x: v[x] for x in ("nome", "base", "ideia", "risco")}
    json.dump(meta, open(os.path.join(OUT, "meta.json"), "w"), ensure_ascii=False, indent=1)
    print("ok", len(os.listdir(OUT)))


if __name__ == "__main__":
    main()

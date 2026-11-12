#!/usr/bin/env python3
"""Clozzy — rodada 13: logos bem parecidos com STORIES.
Linguagem de stories: anel em volta do avatar (com o respiro entre anel e foto), anel segmentado
(vários stories), anel “visto” (traço fino), selo “+” de novo story, anel carregando, barras de
progresso do topo, card 9:16 e pilha de stories. Estrela = a da logo final v3 (5 pontas, canto redondo).
Cores só da paleta Clozzy e regras de combinação (nada preto no rosa, rosa e roxo nunca um sobre o outro,
no preto anel rosa + estrela branca, no rosa/roxo/deep tudo branco).
Rodar: python3 _stories.py → svg/"""
import math, shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "svg"

PINK, DEEP, PURPLE, INK, CREAM, WHITE = "#FF0065", "#E0005A", "#7C48C4", "#14090F", "#FFF6F0", "#FFFFFF"
STAR_R0, STAR_RATIO, STAR_ROUND = 20.5, 0.48, 5.0       # estrela original do Círculo próximo
REACH = 1 + STAR_ROUND / (2 * STAR_R0)                  # alcance com o canto redondo = R · REACH


def f(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def P(a, r, cx=50, cy=50):
    t = math.radians(a)
    return cx + r * math.cos(t), cy + r * math.sin(t)


def star(c, fit, cx=50, cy=50):
    """Estrela inscrita num círculo de raio `fit` (as pontas, com o canto redondo, tocam a borda)."""
    R = fit / REACH
    pts = " ".join(f"{f(x)},{f(y)}" for x, y in
                   (P(-90 + k * 36, R if k % 2 == 0 else R * STAR_RATIO, cx, cy) for k in range(10)))
    return (f'<polygon points="{pts}" fill="{c}" stroke="{c}" stroke-width="{f(STAR_ROUND * R / STAR_R0)}" '
            f'stroke-linejoin="round"/>')


def arc(c, w, rm, a, b, cap="round"):
    """Arco no raio médio `rm` de a até b (graus, 0 = direita, horário). Ponta redonda descontada do ângulo."""
    if b - a >= 359.9:
        return f'<circle cx="50" cy="50" r="{f(rm)}" fill="none" stroke="{c}" stroke-width="{f(w)}"/>'
    d = math.degrees((w / 2) / rm) if cap == "round" else 0
    a, b = a + d, b - d
    if b <= a:
        x, y = P((a + b) / 2, rm)
        return f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(w / 2)}" fill="{c}"/>'
    (x0, y0), (x1, y1) = P(a, rm), P(b, rm)
    return (f'<path d="M{f(x0)} {f(y0)}A{f(rm)} {f(rm)} 0 {1 if b - a > 180 else 0} 1 {f(x1)} {f(y1)}" '
            f'fill="none" stroke="{c}" stroke-width="{f(w)}" stroke-linecap="{cap}"/>')


def segments(c, w, n, gap, rm=None, start=-90, widths=None):
    """n segmentos iguais com vão `gap` (graus), começando no topo — o anel de quem tem vários stories."""
    rm = rm or 45 - w / 2
    per = 360 / n
    out = []
    for i in range(n):
        ww = widths[i] if widths else w
        out.append(arc(c, ww, 45 - w / 2, start + i * per + gap / 2, start + (i + 1) * per - gap / 2))
    return "".join(out)


# ---------- cores por fundo -------------------------------------------------------------------------
# slug, nome, fundo, marca (anel/forma), estrela solta, estrela sobre forma cheia (recorte)
FUNDOS = [
    ("preto", "Preto · principal", INK, PINK, WHITE, WHITE),
    ("rosa", "Rosa · tudo branco", PINK, WHITE, WHITE, PINK),
    ("roxo", "Roxo · tudo branco", PURPLE, WHITE, WHITE, PURPLE),
    ("deep", "Pink Deep · tudo branco", DEEP, WHITE, WHITE, DEEP),
    ("cream", "Cream", CREAM, DEEP, DEEP, CREAM),
    ("branco", "Branco", WHITE, DEEP, DEEP, WHITE),
]
FUNDO = {x[0]: x for x in FUNDOS}


# ---------- os conceitos ----------------------------------------------------------------------------
# cada fn(m, s, k, bg) devolve o miolo SVG no grid 100: m = cor da marca, s = estrela solta,
# k = estrela recortada sobre forma cheia, bg = fundo (para halos de selo).
RING_W, RING_GAP = 7.0, 4.5          # anel do avatar e o respiro entre anel e foto
DISK = 45 - RING_W - RING_GAP        # raio do “avatar”


def c_avatar(m, s, k, bg):
    return arc(m, RING_W, 45 - RING_W / 2, 0, 360) + f'<circle cx="50" cy="50" r="{f(DISK)}" fill="{m}"/>' + star(k, DISK * 0.56)


def c_segmentos(m, s, k, bg):
    return segments(m, RING_W, 5, 13) + f'<circle cx="50" cy="50" r="{f(DISK)}" fill="{m}"/>' + star(k, DISK * 0.56)


def c_visto(m, s, k, bg):
    # 3 stories novos (traço grosso) + 2 já vistos (traço fino, no mesmo raio externo)
    out, per, gap = [], 72, 13
    for i in range(5):
        w = RING_W if i < 3 else 2.6
        out.append(arc(m, w, 45 - w / 2, -90 + i * per + gap / 2, -90 + (i + 1) * per - gap / 2))
    return "".join(out) + f'<circle cx="50" cy="50" r="{f(DISK)}" fill="{m}"/>' + star(k, DISK * 0.56)


def c_novo(m, s, k, bg):
    bx, by, br = P(45, 33)[0], P(45, 33)[1], 12.5
    plus = (f'<path d="M{f(bx - 5.5)} {f(by)}H{f(bx + 5.5)}M{f(bx)} {f(by - 5.5)}V{f(by + 5.5)}" '
            f'stroke="{k}" stroke-width="3.4" stroke-linecap="round"/>')
    return (arc(m, RING_W, 45 - RING_W / 2, 0, 360) + f'<circle cx="50" cy="50" r="{f(DISK)}" fill="{m}"/>'
            + star(k, DISK * 0.56)
            + f'<circle cx="{f(bx)}" cy="{f(by)}" r="{f(br + 3.2)}" fill="{bg}"/>'
            + f'<circle cx="{f(bx)}" cy="{f(by)}" r="{f(br)}" fill="{m}"/>' + plus)


def c_carregando(m, s, k, bg):
    # story carregando: traços que crescem dando a volta até virar linha cheia; estrela solta no meio
    w, rm = 8.0, 41.0
    lens = [2, 4, 7, 11, 16, 22, 30]
    gap, a, out = 9.0, -90.0 + 4.5, []
    for L in lens:
        out.append(arc(m, w, rm, a, a + L + math.degrees(w / rm)))
        a += L + math.degrees(w / rm) + gap
    out.append(arc(m, w, rm, a, 270 - 4.5))
    return "".join(out) + star(s, 22)


def c_progresso(m, s, k, bg):
    # o timer do story: 3/4 já passou (traço grosso), o resto é trilho fino
    return (arc(m, 2.6, 45 - 2.6 / 2 - 2.2, 180, 270, cap="round") + arc(m, 9.0, 40.5, -90, 180)
            + star(s, 22))


def _bars(c, y, x0, x1, n, h, gap, fill_upto, track_h=None, track_c=None):
    """Barras do topo do story: as `fill_upto` primeiras cheias, a seguinte pela metade, o resto só trilho."""
    out, w = [], (x1 - x0 - gap * (n - 1)) / n
    for i in range(n):
        x = x0 + i * (w + gap)
        if i < fill_upto:
            out.append(f'<rect x="{f(x)}" y="{f(y - h / 2)}" width="{f(w)}" height="{f(h)}" rx="{f(h / 2)}" fill="{c}"/>')
        else:
            th = track_h or h * 0.45
            out.append(f'<rect x="{f(x)}" y="{f(y - th / 2)}" width="{f(w)}" height="{f(th)}" rx="{f(th / 2)}" fill="{track_c or c}"/>')
            if i == fill_upto:
                out.append(f'<rect x="{f(x)}" y="{f(y - h / 2)}" width="{f(w * 0.5)}" height="{f(h)}" rx="{f(h / 2)}" fill="{c}"/>')
    return "".join(out)


CARD = (24, 5, 52, 90, 12)    # x, y, w, h, raio — proporção 9:16 aproximada (52 × 90 ≈ 0,58)


def c_card(m, s, k, bg):
    x, y, w, h, r = CARD
    sw = 6
    frame = (f'<rect x="{f(x + sw / 2)}" y="{f(y + sw / 2)}" width="{f(w - sw)}" height="{f(h - sw)}" '
             f'rx="{f(r - sw / 2)}" fill="none" stroke="{m}" stroke-width="{sw}"/>')
    return frame + _bars(m, y + 15, x + 11, x + w - 11, 3, 3.2, 2.6, 1) + star(s, 15, 50, 55)


def c_card_cheio(m, s, k, bg):
    x, y, w, h, r = CARD
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{m}"/>'
            + _bars(k, y + 10, x + 8, x + w - 8, 3, 3.2, 2.6, 1) + star(k, 16, 50, 54))


def c_pilha(m, s, k, bg):
    # dois stories: o de trás em contorno inclinado, o da frente cheio com a estrela
    bw, bh, br = 46, 78, 11
    back = (f'<g transform="rotate(-12 50 50)"><rect x="{f(50 - bw / 2 - 11)}" y="{f(50 - bh / 2 + 2)}" width="{bw}" '
            f'height="{bh}" rx="{br}" fill="none" stroke="{m}" stroke-width="5"/></g>')
    fx, fy = 50 - bw / 2 + 9, 50 - bh / 2 + 4
    front_halo = (f'<rect x="{f(fx - 3.5)}" y="{f(fy - 3.5)}" width="{f(bw + 7)}" height="{f(bh + 7)}" '
                  f'rx="{f(br + 3.5)}" fill="{bg}"/>')
    front = f'<rect x="{f(fx)}" y="{f(fy)}" width="{bw}" height="{bh}" rx="{br}" fill="{m}"/>'
    cx, cy = fx + bw / 2, fy + bh / 2 + 3
    return (back + front_halo + front + _bars(k, fy + 9, fx + 7, fx + bw - 7, 2, 3, 2.6, 1)
            + star(k, 14, cx, cy))


def c_degrade(m, s, k, bg, uid="g"):
    # anel em degradê de uma família só (Deep → Rosa), como o anel colorido do story; vira branco no rosa/roxo
    if m == WHITE:
        return c_avatar(m, s, k, bg)
    a, b = (DEEP, PINK)
    grad = (f'<defs><linearGradient id="{uid}" x1="0" y1="1" x2="1" y2="0">'
            f'<stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient></defs>')
    return (grad + arc(f"url(#{uid})", RING_W, 45 - RING_W / 2, 0, 360)
            + f'<circle cx="50" cy="50" r="{f(DISK)}" fill="url(#{uid})"/>' + star(k, DISK * 0.56))


CONCEPTS = [   # slug, nome, ideia, fn
    ("s01-avatar", "Anel de story", "O anel cheio em volta da “foto”, com o respiro entre os dois — o story novo, sem tirar nem pôr. A foto é a estrela.", c_avatar),
    ("s02-segmentos", "Vários stories", "O anel partido em 5, como quando a pessoa postou vários. Lê como story até em 16 px.", c_segmentos),
    ("s03-visto", "Novos + vistos", "3 partes grossas (novos) e 2 finas (já vistos): a mesma lógica do app, com uma cor só.", c_visto),
    ("s04-novo", "Novo story (+)", "O avatar com o selo “+” de adicionar story, como no print do anel “novo”.", c_novo),
    ("s05-carregando", "Carregando", "Traços que crescem dando a volta até virar linha: o anel do story abrindo. Herda os traços das rodadas 6–8.", c_carregando),
    ("s06-progresso", "Timer do story", "3/4 do anel já passou (grosso), o resto é trilho fino — o tempo do story correndo.", c_progresso),
    ("s07-card", "Tela de story", "Card 9:16 em contorno com as barras de progresso no topo (1 cheia, 1 pela metade) e a estrela.", c_card),
    ("s08-card-cheio", "Story cheio", "O mesmo card em bloco, barras e estrela recortadas. Vira ícone de app sozinho.", c_card_cheio),
    ("s09-pilha", "Pilha de stories", "Um story na frente, outro atrás inclinado: a sequência que você passa com o dedo.", c_pilha),
    ("s10-degrade", "Anel degradê", "O anel colorido do story, mas só Deep → Rosa (família única). No rosa e no roxo vira branco.", c_degrade),
]
FN = {c[0]: c[3] for c in CONCEPTS}
RECOMMENDED = ["s02-segmentos", "s04-novo", "s08-card-cheio"]


def body(slug, fundo, uid=None):
    _s, _n, bg, m, s, k = FUNDO[fundo]
    fn = FN[slug]
    if fn is c_degrade:
        return c_degrade(m, s, k, bg, uid or f"g-{slug}-{fundo}")
    return fn(m, s, k, bg)


def sym_svg(slug, fundo, size=256, bg=True, pad=6):
    b = FUNDO[fundo][2]
    v0, vw = 5 - pad, 90 + 2 * pad
    rect = f'<rect x="{f(v0)}" y="{f(v0)}" width="{f(vw)}" height="{f(vw)}" fill="{b}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(v0)} {f(v0)} {f(vw)} {f(vw)}" width="{size}" '
            f'height="{size}"><title>Clozzy</title>{rect}{body(slug, fundo)}</svg>\n')


def tile_svg(slug, fundo, size=1024, radius=22.37, scale=0.62):
    b = FUNDO[fundo][2]
    o = 50 - 50 * scale
    rx = f' rx="{radius}"' if radius else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="{size}" height="{size}">'
            f'<title>Clozzy</title><rect width="100" height="100"{rx} fill="{b}"/>'
            f'<g transform="translate({f(o)} {f(o)}) scale({f(scale)})">{body(slug, fundo, f"t-{slug}-{fundo}")}</g></svg>\n')


def build():
    shutil.rmtree(OUT, ignore_errors=True)
    OUT.mkdir()
    n = 0
    for slug, *_ in CONCEPTS:
        for fundo, *_ in FUNDOS:
            (OUT / f"{slug}-{fundo}.svg").write_text(sym_svg(slug, fundo))
            n += 1
        for fundo in ("rosa", "preto", "roxo"):
            (OUT / f"{slug}-app-{fundo}.svg").write_text(tile_svg(slug, fundo))
            n += 1
    return n


if __name__ == "__main__":
    print("ok", build(), "svgs")

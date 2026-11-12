#!/usr/bin/env python3
"""Capa de Eternos Mutáveis (6x9 pol., 1600x2400 px).
Conceito: o círculo de ouro (o Eterno, o Uno) atravessado por um fio de luz (o Verbo) que desce da centelha;
no centro, um cubo de arame ciano (o sólido, o objeto, a substância de Aristóteles) se desfaz em pó dourado
à direita (o mutável vira abstrato); embaixo do horizonte, o reflexo (assim em cima como embaixo).
Paleta da identidade da obra (assets/README.md): índigo/preto noturno, dourado antigo, toque de ciano.
Gera capa.html (SVG inline + fontes); _render.js tira capa.png / capa.pdf."""
import math, os, random

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1600, 2400
CX, CY = 800, 1090
GOLD, GOLD2, CYAN = "#D9B26A", "#F3DDA0", "#5FD3E0"
rnd = random.Random(7)


def lerp(a, b, t):
    return a + (b - a) * t


def mix(c1, c2, t):
    a = [int(c1[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(c2[i:i + 2], 16) for i in (1, 3, 5)]
    return "#" + "".join(f"{round(lerp(x, y, t)):02X}" for x, y in zip(a, b))


def stars():
    out = []
    for _ in range(420):
        x, y = rnd.uniform(0, W), rnd.uniform(0, 1640)
        r = rnd.choice([0.8, 1, 1, 1.2, 1.6, 2.2])
        o = rnd.uniform(.15, .8) * (1 - y / 2200)
        c = rnd.choice(["#FFFFFF", "#FFFFFF", GOLD2, "#BFD9FF"])
        out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r}" fill="{c}" opacity="{o:.2f}"/>')
    return "".join(out)


def flower(r=150):
    """Semente da vida: 7 círculos — geometria sagrada, discreta."""
    cs = [(CX, CY)] + [(CX + r * math.cos(a), CY + r * math.sin(a)) for a in [i * math.pi / 3 for i in range(6)]]
    return "".join(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}"/>' for x, y in cs)


def cube(s=250, ry=math.radians(32), rx=math.radians(22)):
    """Cubo de arame em perspectiva leve; da esquerda (sólido) para a direita ele se desfaz em pó que sobe e doura."""
    def P(x, y, z):
        x, z = x * math.cos(ry) - z * math.sin(ry), x * math.sin(ry) + z * math.cos(ry)
        y, z = y * math.cos(rx) - z * math.sin(rx), y * math.sin(rx) + z * math.cos(rx)
        f = 3.2 / (3.2 + z)
        return (CX + x * s * f, CY + 10 - y * s * f)
    V = {k: P(*k) for k in [(a, b, c) for a in (-.5, .5) for b in (-.5, .5) for c in (-.5, .5)]}
    edges = [(a, b) for a in V for b in V if a < b and sum(i != j for i, j in zip(a, b)) == 1]
    xs = [p[0] for p in V.values()]; x0, x1 = min(xs), max(xs)
    lines, dust = [], []
    for a, b in edges:
        (ax, ay), (bx, by) = V[a], V[b]
        n = 90
        seg = []
        for i in range(n + 1):
            x, y = lerp(ax, bx, i / n), lerp(ay, by, i / n)
            k = (x - x0) / (x1 - x0)               # 0 = borda esquerda (sólido) → 1 = direita (pó)
            solid = k < .42 or (k < .7 and rnd.random() > (k - .42) / .28)
            if solid:
                seg.append((x, y)); continue
            if len(seg) > 1:
                lines.append(seg)
            seg = []
            d = max(0, (k - .42) / .58)
            for _ in range(2):
                dx, dy = rnd.gauss(70, 45) * d, -rnd.gauss(120, 70) * d
                col = mix(CYAN, GOLD2, min(1, d * 1.3))
                dust.append(f'<circle cx="{x + dx:.1f}" cy="{y + dy:.1f}" r="{rnd.uniform(1, 2.6) * (1 - d * .4):.2f}" fill="{col}" opacity="{max(.15, 1 - d * .75):.2f}"/>')
        if len(seg) > 1:
            lines.append(seg)
    for _ in range(170):
        t = rnd.random()
        x = x1 + 10 + t * 230 + rnd.gauss(0, 35)
        y = CY - 40 - t * 340 + rnd.gauss(0, 60)
        dust.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rnd.uniform(.6, 1.8):.2f}" fill="{GOLD2}" opacity="{(1 - t) * .75:.2f}"/>')
    pl = "".join(f'<polyline points="{" ".join(f"{x:.1f},{y:.1f}" for x, y in sg)}"/>' for sg in lines)
    return pl, "".join(dust)


def emblem():
    lines, dust = cube()
    R = 400
    return f"""
  <g fill="none" stroke="{GOLD}" stroke-width="1.4" opacity=".16">{flower()}</g>
  <circle cx="{CX}" cy="{CY}" r="{R + 60}" fill="url(#halo)"/>
  <circle cx="{CX}" cy="{CY}" r="{R}" fill="none" stroke="url(#ring)" stroke-width="3"/>
  <circle cx="{CX}" cy="{CY}" r="{R - 16}" fill="none" stroke="{GOLD}" stroke-width="1" opacity=".35"/>
  <rect x="{CX - 1.5}" y="{CY - R - 95}" width="3" height="{2 * R + 185}" fill="url(#thread)" filter="url(#glow)"/>
  <circle cx="{CX}" cy="{CY - R - 95}" r="60" fill="url(#spark)"/>
  <circle cx="{CX}" cy="{CY - R - 95}" r="5" fill="#FFF8E6"/>
  <g fill="none" stroke="{CYAN}" stroke-width="2.4" stroke-linecap="round" opacity=".95" filter="url(#glowc)">{lines}</g>
  <g>{dust}</g>"""


def svg():
    em = emblem()
    HZ = 1640
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
<defs>
  <radialGradient id="sky" cx="50%" cy="44%" r="75%"><stop offset="0" stop-color="#1B1748"/><stop offset=".45" stop-color="#0C0A26"/><stop offset="1" stop-color="#030309"/></radialGradient>
  <radialGradient id="halo"><stop offset="0" stop-color="{GOLD}" stop-opacity=".13"/><stop offset=".7" stop-color="{GOLD}" stop-opacity=".03"/><stop offset="1" stop-color="{GOLD}" stop-opacity="0"/></radialGradient>
  <radialGradient id="spark"><stop offset="0" stop-color="#FFF4D6" stop-opacity=".95"/><stop offset=".25" stop-color="{GOLD2}" stop-opacity=".45"/><stop offset="1" stop-color="{GOLD}" stop-opacity="0"/></radialGradient>
  <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{GOLD2}"/><stop offset=".5" stop-color="{GOLD}"/><stop offset="1" stop-color="#8A6A32"/></linearGradient>
  <linearGradient id="thread" gradientUnits="userSpaceOnUse" x1="{CX}" y1="{CY - 495}" x2="{CX}" y2="{CY + 490}"><stop offset="0" stop-color="#FFF4D6"/><stop offset=".6" stop-color="{GOLD}"/><stop offset="1" stop-color="{GOLD}" stop-opacity="0"/></linearGradient>
  <linearGradient id="title" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{GOLD2}"/><stop offset="1" stop-color="{GOLD}"/></linearGradient>
  <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <mask id="mfade"><rect x="0" y="{HZ}" width="{W}" height="{H - HZ}" fill="url(#fade)"/></mask>
  <filter id="glow" x="-800%" y="-5%" width="1700%" height="110%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="glowc" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="{W}" height="{H}" fill="url(#sky)"/>
<g>{stars()}</g>
<g id="em">{em}</g>
<line x1="180" y1="{HZ}" x2="{W - 180}" y2="{HZ}" stroke="{GOLD}" stroke-width="1" opacity=".45"/>
<g mask="url(#mfade)"><use href="#em" transform="translate(0 {2 * HZ}) scale(1 -1)"/></g>
<text x="{CX}" y="300" text-anchor="middle" class="t">ETERNOS</text>
<text x="{CX}" y="452" text-anchor="middle" class="t">MUTÁVEIS</text>
<text x="{CX}" y="2010" text-anchor="middle" class="s">Uma alfabetização espiritual para quem</text>
<text x="{CX}" y="2066" text-anchor="middle" class="s">ainda está preso no mundo da matéria</text>
<line x1="{CX - 40}" y1="2150" x2="{CX + 40}" y2="2150" stroke="{GOLD}" stroke-width="1.5" opacity=".7"/>
<text x="{CX}" y="2250" text-anchor="middle" class="a">LAÉRCIO GERMANO</text>
</svg>"""


CSS = f"""@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,400&family=Cormorant+SC:wght@500&display=swap');
html,body{{margin:0;background:#030309}}svg{{display:block;width:100%;height:auto}}
.t{{font-family:'Cormorant SC','Cormorant Garamond',serif;font-weight:500;font-size:150px;letter-spacing:22px;fill:url(#title)}}
.s{{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:44px;fill:#CDBF9E;letter-spacing:.5px}}
.a{{font-family:'Cormorant SC','Cormorant Garamond',serif;font-size:46px;letter-spacing:14px;fill:{GOLD2}}}"""

html = f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Eternos Mutáveis — capa</title><style>@page{{size:6in 9in;margin:0}}{CSS}</style></head><body>{svg()}</body></html>'
open(os.path.join(HERE, "capa.html"), "w").write(html)
print("ok")

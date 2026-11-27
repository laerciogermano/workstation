"""Cenário e objetos do tema “pôr do sol neon”, desenhados do zero em SVG/HTML (referência de clima:
../../image copy.png). Nada de lá é reaproveitado: sem logos, personagens, mascote ou foto."""
import base64, io, math, os, random, re, sys

OUT = os.path.dirname(os.path.abspath(__file__))
MARCA = os.path.normpath(os.path.join(OUT, ".."))
sys.path.insert(0, os.path.join(MARCA, "identidade-v5-gomosa"))
from _common import svg_text  # noqa: E402
from PIL import Image  # noqa: E402

NOITE, UVA, ROXO, MAGENTA, ROSA = "#14062B", "#4A1273", "#B01B8C", "#E0127F", "#FF3D9A"
CORAL, LARANJA, SOL, CIANO, VERDE = "#FF5C7A", "#FF7A45", "#FFC857", "#68E2E3", "#0C2B22"
GO_D = svg_text("v4-go-white.svg").split(' d="')[1].split('"')[0]
_n = [0]


def uid(p):
    _n[0] += 1
    return f"{p}{_n[0]}"


def dados(raw, mime):
    return f"data:{mime};base64," + base64.b64encode(raw).decode()


def lg(gid, stops, x1=0, y1=0, x2=0, y2=1, user=False):
    u = ' gradientUnits="userSpaceOnUse"' if user else ""
    s = "".join(f'<stop offset="{o}" stop-color="{c}" stop-opacity="{a}"/>' for o, c, a in [(t + (1,))[:3] for t in stops])
    return f'<linearGradient id="{gid}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"{u}>{s}</linearGradient>'


def rg(gid, cor, a=1.0):
    return f'<radialGradient id="{gid}"><stop offset="0" stop-color="{cor}" stop-opacity="{a}"/><stop offset="1" stop-color="{cor}" stop-opacity="0"/></radialGradient>'


# ---------------------------------------------------------------- vegetação
def _bez(p0, c, p1, t):
    return tuple((1 - t) ** 2 * p0[i] + 2 * (1 - t) * t * c[i] + t * t * p1[i] for i in (0, 1))


def _tan(p0, c, p1, t):
    d = [2 * (1 - t) * (c[i] - p0[i]) + 2 * t * (p1[i] - c[i]) for i in (0, 1)]
    n = math.hypot(*d) or 1
    return d[0] / n, d[1] / n


def folha(rng, p0, c, p1, larg=.27, n=30):
    """Uma fronde: nervura curva + folíolos finos dos dois lados."""
    L = math.dist(p0, p1) * 1.08
    d = [f"M{p0[0]:.1f} {p0[1]:.1f}Q{c[0]:.1f} {c[1]:.1f} {p1[0]:.1f} {p1[1]:.1f}Q{c[0]:.1f} {c[1] + L * .035:.1f} {p0[0]:.1f} {p0[1] + L * .02:.1f}Z"]
    for i in range(n):
        t = .05 + i * .93 / n
        P, T = _bez(p0, c, p1, t), _tan(p0, c, p1, t)
        comp = L * larg * max(.12, math.sin(math.pi * min(t * .9 + .06, 1))) ** .7 * rng.uniform(.85, 1.1)
        base = L * .019
        for lado in (-1, 1):
            a = math.atan2(T[1], T[0]) + lado * math.radians(62 - 30 * t + rng.uniform(-6, 6))
            tip = (P[0] + math.cos(a) * comp, P[1] + math.sin(a) * comp + comp * .34)
            meio = (P[0] + math.cos(a) * comp * .55 + T[0] * base, P[1] + math.sin(a) * comp * .55 + comp * .08)
            d.append(f"M{P[0] - T[0] * base:.1f} {P[1] - T[1] * base:.1f}Q{meio[0]:.1f} {meio[1]:.1f} {tip[0]:.1f} {tip[1]:.1f}L{P[0] + T[0] * base:.1f} {P[1] + T[1] * base:.1f}Z")
    return "".join(d)


def palmeira(rng, bx, by, h, lean, cor="#14041F", aro=ROSA, u=1.0):
    topo, ctrl = (bx + lean, by - h), (bx + lean * .08, by - h * .55)
    esq, dire, aneis = [], [], []
    for i in range(21):
        t = i / 20
        P, T = _bez((bx, by), ctrl, topo, t), _tan((bx, by), ctrl, topo, t)
        w = h * (.030 * (1 - t) + .012)
        nx, ny = -T[1], T[0]
        esq.append((P[0] + nx * w / 2, P[1] + ny * w / 2))
        dire.append((P[0] - nx * w / 2, P[1] - ny * w / 2))
        if 0 < i < 20:
            aneis.append(f"M{esq[-1][0]:.1f} {esq[-1][1]:.1f}L{dire[-1][0]:.1f} {dire[-1][1] + h * .006:.1f}")
    tronco = "M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in esq + dire[::-1]) + "Z"
    copa = ""
    for ang in (-172, -146, -118, -92, -66, -40, -14, 12, 166, 196, 40):
        a = math.radians(ang + rng.uniform(-8, 8))
        L = h * .40 * rng.uniform(.82, 1.12)
        fim = (topo[0] + math.cos(a) * L, topo[1] + math.sin(a) * L * .55 + L * rng.uniform(.22, .42))
        c = (topo[0] + math.cos(a) * L * .55, topo[1] + math.sin(a) * L * .72 - L * .17)
        copa += folha(rng, topo, c, fim, .26, 24)
    forma = f'<path d="{tronco}"/><path d="{copa}"/><circle cx="{topo[0]:.1f}" cy="{topo[1] + h * .012:.1f}" r="{h * .022:.1f}"/>'
    return (f'<g fill="{aro}" opacity=".55" transform="translate({-3 * u:.1f} {-2.5 * u:.1f})">{forma}</g><g fill="{cor}">{forma}</g>'
            f'<path d="{"".join(aneis)}" stroke="{aro}" stroke-opacity=".28" stroke-width="{1.6 * u:.1f}" fill="none"/>')


# ---------------------------------------------------------------- cenário
def cena(W, H, seed=3, hz=.62, mesa=None, noite=False, helic=(.12, .24), roda=(.84, 1.0), sol=.46, palmas=True, folhas=True, letreiros=True, skyline=1.0):
    """Pôr do sol com cidade, roda-gigante, água, palmeiras e (opcional) mesa de madeira. Medidas em fração de W/H."""
    rng = random.Random(seed)
    u = math.sqrt(W * H) / 1080
    hz_y = H * hz
    mesa_y = H * mesa if mesa else None
    fundo = mesa_y or H
    i = uid("c")
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" style="display:block">']
    ceu = ([(0, "#07021A"), (.42, "#1E0A4F"), (.72, "#6A1485"), (.9, "#C21E8A"), (1, "#FF5C8A")] if noite else
           [(0, NOITE), (.26, UVA), (.52, ROXO), (.72, "#F0407A"), (.88, LARANJA), (1, SOL)])
    o.append(f'<defs>{lg(i + "ceu", ceu, 0, 0, 0, hz_y, True)}{lg(i + "agua", [(0, "#B02B7E"), (.22, "#5A1466"), (1, "#12042A")], 0, hz_y, 0, fundo, True)}'
             f'{rg(i + "sol", "#FFE08A", .95 if not noite else .35)}{rg(i + "rosa", ROSA, .55)}{rg(i + "lar", LARANJA, .55)}'
             f'<filter id="{i}b" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="{14 * u:.1f}"/></filter>'
             f'<filter id="{i}g" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="{5 * u:.1f}"/></filter></defs>')
    o.append(f'<rect width="{W}" height="{hz_y + 2}" fill="url(#{i}ceu)"/>')
    # nuvens
    for k in range(26):
        y = rng.uniform(.08, .94) * hz_y
        cor = rng.choice(["#FF4FA0", "#7B1E9C", "#2A0B58"] if y < hz_y * .55 else ["#FFB26B", "#FF5C8A", "#8E1E9C"])
        o.append(f'<ellipse cx="{rng.uniform(-.1, 1.1) * W:.0f}" cy="{y:.0f}" rx="{rng.uniform(70, 270) * u:.0f}" ry="{rng.uniform(6, 22) * u:.0f}" fill="{cor}" opacity="{rng.uniform(.25, .6):.2f}" filter="url(#{i}b)"/>')
    if noite:
        for k in range(110):
            o.append(f'<circle cx="{rng.random() * W:.0f}" cy="{rng.random() * hz_y * .55:.0f}" r="{rng.uniform(.6, 1.9) * u:.1f}" fill="#fff" opacity="{rng.uniform(.25, .9):.2f}"/>')
    sx = W * sol
    o.append(f'<ellipse cx="{sx:.0f}" cy="{hz_y - 40 * u:.0f}" rx="{430 * u:.0f}" ry="{250 * u:.0f}" fill="url(#{i}sol)"/>')
    if not noite:
        o.append(f'<circle cx="{sx:.0f}" cy="{hz_y - 60 * u:.0f}" r="{86 * u:.0f}" fill="#FFE7A0" opacity=".92"/>')
    if helic:
        x, y = W * helic[0], H * helic[1]
        o.append(f'<g transform="translate({x:.0f} {y:.0f}) scale({.86 * u:.2f}) rotate(-6)" fill="#14041F"><ellipse rx="48" ry="23"/><path d="M-36-8L-126-13V-3L-34 13Z"/><path d="M-130-36L-108-10L-124-2Z"/>'
                 f'<circle cx="-126" cy="-15" r="19" fill="none" stroke="#14041F" stroke-opacity=".55" stroke-width="3"/><rect x="-4" y="-36" width="8" height="16"/><ellipse cx="4" cy="-37" rx="128" ry="3.4"/>'
                 f'<path d="M-24 20L-30 36M20 20L28 36M-46 37H42Q52 37 56 30" stroke="#14041F" stroke-width="5" fill="none"/><path d="M12-14Q40-12 45 2L14 4Z" fill="{CORAL}" opacity=".55"/></g>')
    # cidade: duas camadas
    def predios(alt_min, alt_max, larg_min, larg_max, cor, janelas, op=1):
        x = -10.0
        while x < W:
            w = rng.uniform(larg_min, larg_max) * u
            perto = 1 - .55 * math.exp(-((x + w / 2 - sx) / (190 * u)) ** 2)  # abre espaço para o sol
            h = rng.uniform(alt_min, alt_max) * H * perto * skyline
            o.append(f'<rect x="{x:.0f}" y="{hz_y - h:.0f}" width="{w:.0f}" height="{h + 2:.0f}" fill="{cor}" opacity="{op}"/>')
            if rng.random() < .35:
                o.append(f'<path d="M{x + w * .3:.0f} {hz_y - h:.0f}h{w * .4:.0f}v{-14 * u:.0f}h{-w * .17:.0f}v{-22 * u:.0f}h{-3 * u:.0f}v{22 * u:.0f}h{-w * .2:.0f}Z" fill="{cor}" opacity="{op}"/>')
            if janelas:
                yy = hz_y - h + 8 * u
                while yy < hz_y - 6 * u:
                    xx = x + 5 * u
                    while xx < x + w - 6 * u:
                        if rng.random() < .3:
                            o.append(f'<rect x="{xx:.0f}" y="{yy:.0f}" width="{4 * u:.1f}" height="{5 * u:.1f}" fill="{rng.choice(["#FFD27A", "#FF8FC4", "#8FF6F2", "#FFD27A"])}" opacity="{rng.uniform(.45, .95):.2f}"/>')
                        xx += 9 * u
                    yy += 11 * u
            x += w + rng.uniform(-6, 9) * u
    predios(.05, .20, 26, 62, "#8E2488", False, .72)
    if roda:
        rx, r = W * roda[0], 118 * u * roda[1]
        ry = hz_y - r * 1.12
        raios, luzes = "", ""
        for k in range(18):
            a = math.tau * k / 18
            ex, ey = rx + math.cos(a) * r, ry + math.sin(a) * r
            raios += f"M{rx:.0f} {ry:.0f}L{ex:.0f} {ey:.0f}"
            luzes += f'<circle cx="{ex:.0f}" cy="{ey:.0f}" r="{6.5 * u:.1f}" fill="{["#FFD36B", "#8FF6F2", "#FF5FB0"][k % 3]}"/>'
        aro = (f'<g fill="none" stroke="#FF8AD2"><circle cx="{rx:.0f}" cy="{ry:.0f}" r="{r:.0f}" stroke-width="{4 * u:.1f}"/><circle cx="{rx:.0f}" cy="{ry:.0f}" r="{r * .8:.0f}" stroke-width="{2 * u:.1f}"/>'
               f'<path d="{raios}" stroke-width="{1.4 * u:.1f}"/></g><path d="M{rx:.0f} {ry:.0f}L{rx - r * .55:.0f} {hz_y:.0f}M{rx:.0f} {ry:.0f}L{rx + r * .55:.0f} {hz_y:.0f}" stroke="#2B0A47" stroke-width="{6 * u:.1f}"/>')
        o.append(f'<g filter="url(#{i}g)">{aro}{luzes}</g>{aro}{luzes}<circle cx="{rx:.0f}" cy="{ry:.0f}" r="{9 * u:.0f}" fill="#FFE08A"/>')
    predios(.03, .15, 34, 80, "#2E0B4C", True)
    # água e reflexos
    o.append(f'<rect y="{hz_y:.0f}" width="{W}" height="{fundo - hz_y + 2:.0f}" fill="url(#{i}agua)"/>')
    for k in range(int(330 * W / 1080)):
        t = rng.random() ** 1.25
        y = hz_y + 4 * u + t * max(8, fundo - hz_y - 8 * u)
        sob_sol = rng.random() < .45
        x = rng.gauss(sx, 90 * u * (1 + t)) if sob_sol else rng.random() * W
        cor = rng.choice(["#FFE08A", "#FFB26B", "#FF8A5C"] if sob_sol else ["#FF5FB0", "#B34BE0", "#8FF6F2", "#FF8A5C"])
        w = rng.uniform(8, 66) * u * (.35 + t)
        o.append(f'<rect x="{x - w / 2:.0f}" y="{y:.0f}" width="{w:.0f}" height="{(1.4 + 3.2 * t) * u:.1f}" rx="{2 * u:.1f}" fill="{cor}" opacity="{rng.uniform(.18, .7):.2f}"/>')
    o.append(f'<rect y="{hz_y - 2 * u:.0f}" width="{W}" height="{4 * u:.0f}" fill="#FF8AC4" opacity=".75"/>')
    if letreiros:
        for fx, txt, cor, tam in ((.05, "BAR", ROSA, 30), (.17, "SAMBA", CIANO, 24), (.70, "AÇAÍ", SOL, 25), (.90, "BAILE", ROSA, 28)):
            x, y = W * fx, hz_y - 15 * u
            larg = len(txt) * tam * .78 * u + 18 * u
            o.append(f'<rect x="{x:.0f}" y="{y - tam * u:.0f}" width="{larg:.0f}" height="{(tam + 12) * u:.0f}" rx="{6 * u:.0f}" fill="#1A0630" stroke="{cor}" stroke-width="{2.5 * u:.1f}"/>'
                     f'<g font-family="Changa One" font-size="{tam * u:.0f}" text-anchor="middle"><text x="{x + larg / 2:.0f}" y="{y + 2 * u:.0f}" fill="{cor}" filter="url(#{i}g)">{txt}</text><text x="{x + larg / 2:.0f}" y="{y + 2 * u:.0f}" fill="{cor}">{txt}</text></g>')
    if palmas:
        base = hz_y + 90 * u
        for fx, fh, lean in ((.045, .50, .045), (.135, .31, -.012), (.965, .55, -.06), (.885, .27, .02)):
            o.append(palmeira(rng, W * fx, base, min(H * fh, H * .56), W * lean, u=u))
    # mesa de madeira em perspectiva
    if mesa_y:
        o.append(f'<defs>{lg(i + "mad", [(0, "#8A2A55"), (.18, "#5A1838"), (.6, "#2E0A22"), (1, "#14040F")], 0, mesa_y, 0, H, True)}</defs>')
        o.append(f'<rect y="{mesa_y:.0f}" width="{W}" height="{H - mesa_y:.0f}" fill="url(#{i}mad)"/>')
        vx, vy = W * .5, mesa_y - (H - mesa_y) * 1.5
        topo_x = lambda xb: vx + (xb - vx) * (mesa_y - vy) / (H - vy)
        passo = 205 * u
        for k in range(-8, 18):
            xb = k * passo + rng.uniform(-12, 12) * u
            o.append(f'<path d="M{topo_x(xb):.0f} {mesa_y:.0f}L{xb:.0f} {H}" stroke="#10030C" stroke-width="{4.5 * u:.1f}"/><path d="M{topo_x(xb) + 3 * u:.0f} {mesa_y:.0f}L{xb + 8 * u:.0f} {H}" stroke="#FF7AA8" stroke-opacity=".22" stroke-width="{1.6 * u:.1f}"/>')
        for k in range(int(520 * W / 1080)):
            xb, t0 = rng.uniform(-W * .5, W * 1.5), rng.random()
            t1 = min(1, t0 + rng.uniform(.05, .28))
            xa, xz = topo_x(xb) + (xb - topo_x(xb)) * t0, topo_x(xb) + (xb - topo_x(xb)) * t1
            ya, yz = mesa_y + (H - mesa_y) * t0, mesa_y + (H - mesa_y) * t1
            o.append(f'<path d="M{xa:.0f} {ya:.0f}Q{(xa + xz) / 2 + rng.uniform(-9, 9) * u:.0f} {(ya + yz) / 2:.0f} {xz:.0f} {yz:.0f}" fill="none" stroke="{rng.choice(["#FF9AB8", "#10030C", "#FFB26B"])}" stroke-opacity="{rng.uniform(.07, .28):.2f}" stroke-width="{rng.uniform(.8, 2.6) * u:.1f}"/>')
        for fx, g, rx, ry in ((sol, "lar", 190, 90), (.82, "rosa", 230, 120), (.1, "rosa", 200, 100)):
            o.append(f'<ellipse cx="{W * fx:.0f}" cy="{mesa_y + 46 * u:.0f}" rx="{rx * u:.0f}" ry="{ry * u:.0f}" fill="url(#{i}{g})"/>')
        o.append(f'<rect y="{mesa_y - 2 * u:.0f}" width="{W}" height="{4.5 * u:.1f}" fill="#FF7AB8"/>')
    if folhas:
        L = 360 * u
        verdes = ""
        for p0, c, p1 in (((-60 * u, H + 40 * u), (L * .05, H - L * .85), (L * .78, H - L * .52)), ((-40 * u, H - 10 * u), (L * .25, H - L * .48), (L * .92, H - L * .1)),
                          ((-50 * u, H), (-L * .02, H - L * 1.05), (L * .3, H - L * 1.02)), ((W + 60 * u, H + 30 * u), (W - L * .05, H - L * .62), (W - L * .66, H - L * .3))):
            verdes += folha(rng, p0, c, p1, .24, 22)
        o.append(f'<path d="{verdes}" fill="{ROSA}" opacity=".6" transform="translate({2.5 * u:.1f} {-3 * u:.1f})"/><path d="{verdes}" fill="{VERDE}"/>')
    o.append("</svg>")
    return "".join(o)


# ---------------------------------------------------------------- faixa de título em pincel
def faixa(w, l1, destaque="", resto="", seed=5, giro=-4, lw1=820, lw2=820, antes=""):
    """Título do tema: mancha preta de pincel com borda neon; 1ª linha branca, 2ª com a palavra-chave em rosa."""
    rng = random.Random(seed)
    i = uid("f")
    duas = bool(destaque or resto)
    alt = 456 if duas else 300
    topo, base = 52, alt - 48
    cima = [(x, topo + rng.uniform(-16, 16) - (x - 500) * .008) for x in range(70, 940, 24)]
    baixo = [(x, base + rng.uniform(-17, 17)) for x in range(930, 60, -24)]
    dirp = [(940 + rng.uniform(-8, 55) * (k % 2), topo + (base - topo) * k / 9) for k in range(1, 9)]
    esqp = [(60 - rng.uniform(-8, 52) * (k % 2), base - (base - topo) * k / 9) for k in range(1, 9)]
    pts = "M" + "L".join(f"{x:.0f} {y:.0f}" for x, y in cima + dirp + baixo + esqp) + "Z"
    cerdas = ""
    for k in range(70):
        lado = rng.choice((0, 1))
        y = rng.uniform(topo - 8, base + 8)
        x0 = rng.uniform(70, 150) if lado == 0 else rng.uniform(850, 930)
        dx = -rng.uniform(50, 135) if lado == 0 else rng.uniform(50, 135)
        cerdas += f'<path d="M{x0:.0f} {y:.0f}l{dx:.0f} {rng.uniform(-14, 8):.0f}" stroke-width="{rng.uniform(2, 9):.1f}"/>'
    sujeira = "".join(f'<circle cx="{rng.uniform(60, 940):.0f}" cy="{rng.uniform(30, alt - 20):.0f}" r="{rng.uniform(.5, 2.1):.1f}"/>' for _ in range(430))
    sujeira += "".join(f'<path d="M{rng.uniform(80, 900):.0f} {rng.uniform(60, alt - 50):.0f}l{rng.uniform(14, 60):.0f} {rng.uniform(-9, 2):.0f}" stroke="#000" stroke-width="{rng.uniform(.8, 2):.1f}"/>' for _ in range(95))
    forma = lambda cor: f'<path d="{pts}" fill="{cor}"/><g stroke="{cor}" stroke-linecap="round" fill="none">{cerdas}</g>'
    tam1 = 215 if duas else 190
    y1 = 228 if duas else 218
    linha2 = ""
    if duas:
        grande = 158 if (antes or resto) else 170
        a = f'<tspan font-size="108" fill="#fff">{antes} </tspan>' if antes else ""
        r = f'<tspan font-size="108" fill="#fff"> {resto}</tspan>' if resto else ""
        linha2 = (f'<text x="500" y="394" text-anchor="middle" textLength="{lw2}" lengthAdjust="spacingAndGlyphs">'
                  f'{a}<tspan font-size="{grande}" fill="url(#{i}r)" stroke="#fff" stroke-width="7" paint-order="stroke">{destaque}</tspan>{r}</text>')
    return (f'<svg viewBox="0 0 1000 {alt}" width="{w}" height="{w * alt / 1000:.0f}" style="display:block;overflow:visible"><defs>{lg(i + "r", [(0, "#FFD3EE"), (.45, "#FF4FC0"), (1, "#C80F9A")])}'
            f'<mask id="{i}m" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="{alt}"><rect width="1000" height="{alt}" fill="#fff"/><g fill="#000">{sujeira}</g></mask>'
            f'<filter id="{i}g" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="9"/></filter></defs>'
            f'<g transform="rotate({giro} 500 {alt / 2})"><g transform="translate(0 13)" filter="url(#{i}g)">{forma(ROSA)}</g><g transform="translate(-4 9)">{forma(MAGENTA)}</g>{forma("#07020D")}'
            f'<g font-family="Changa One" font-style="italic" mask="url(#{i}m)"><text x="500" y="{y1}" text-anchor="middle" font-size="{tam1}" fill="#fff" textLength="{lw1}" lengthAdjust="spacingAndGlyphs">{l1}</text>{linha2}</g></g></svg>')


# ---------------------------------------------------------------- objetos
_nums = [float(n) for n in re.findall(r"-?\d+(?:\.\d+)?", GO_D)]
GX0, GX1, GY0, GY1 = min(_nums[0::2]), max(_nums[0::2]), min(_nums[1::2]), max(_nums[1::2])


def boneco(w):
    """O Go como peça colecionável sobre um pedestal."""
    i = uid("b")
    esc = 340 / (GX1 - GX0)
    tx, ty = 200 - (GX0 + GX1) / 2 * esc - 12, 338 - GY1 * esc
    lados = "".join(f'<path d="{GO_D}" fill-rule="evenodd" fill="{"#7A0A5E" if k > 12 else "#A50E78"}" transform="translate({tx + k * 1.15:.1f} {ty - k * .5:.1f}) scale({esc:.3f})"/>' for k in range(26, 0, -1))
    frente = f'transform="translate({tx:.1f} {ty:.1f}) scale({esc:.3f})"'
    return (f'<svg viewBox="0 0 400 470" width="{w}" height="{w * 470 / 400:.0f}" style="display:block;overflow:visible"><defs>{lg(i + "f", [(0, "#FF9BE0"), (.4, ROSA), (1, "#B8107E")], 0, 0, .35, 1)}'
            f'{lg(i + "p", [(0, "#060508"), (.28, "#33303F"), (.5, "#14121B"), (1, "#040306")], 0, 0, 1, 0)}{lg(i + "l", [(0, "#fff", .75), (.42, "#fff", .08), (.43, "#fff", 0)])}{rg(i + "s", "#000", .75)}</defs>'
            f'<ellipse cx="200" cy="436" rx="225" ry="38" fill="url(#{i}s)"/>'
            f'<path d="M22 350V402A178 44 0 0 0 378 402V350Z" fill="url(#{i}p)"/><ellipse cx="200" cy="350" rx="178" ry="42" fill="#1A1722" stroke="#4A4458" stroke-width="2"/>'
            f'<path d="M22 400A178 44 0 0 0 378 400" fill="none" stroke="{ROSA}" stroke-opacity=".65" stroke-width="2.5"/><ellipse cx="196" cy="346" rx="126" ry="17" fill="#000" opacity=".55"/>'
            f'<text x="200" y="418" text-anchor="middle" font-family="Damion" font-size="52" fill="#fff">Viva o rolê</text><text x="226" y="440" text-anchor="middle" font-family="Damion" font-size="24" fill="{ROSA}">@rolego</text>'
            f'{lados}<path d="{GO_D}" fill-rule="evenodd" fill="url(#{i}f)" stroke="#FFD0EE" stroke-width="{2 / esc:.2f}" {frente}/><path d="{GO_D}" fill-rule="evenodd" fill="url(#{i}l)" {frente}/></svg>')


def oculos(w, giro=-4):
    i = uid("o")
    lente = "M18 30Q70 6 138 24Q152 30 146 62Q132 128 76 128Q22 122 12 66Q8 40 18 30Z"
    return (f'<svg viewBox="0 0 340 160" width="{w}" height="{w * 160 / 340:.0f}" style="display:block;overflow:visible;transform:rotate({giro}deg)"><defs>{lg(i + "l", [(0, "#2A0745"), (.45, "#C0147E"), (.75, "#FF4F8F"), (1, "#FFB15E")], 0, 0, .5, 1)}{rg(i + "s", "#000", .65)}</defs>'
            f'<ellipse cx="170" cy="134" rx="190" ry="22" fill="url(#{i}s)"/><path d="M20 38Q60 -8 190 14M322 38Q290 -2 175 12" fill="none" stroke="#B9822E" stroke-width="6" stroke-linecap="round"/>'
            f'<g stroke="#F2C76A" stroke-width="6"><path d="{lente}" fill="url(#{i}l)"/><path d="{lente}" fill="url(#{i}l)" transform="translate(340 0) scale(-1 1)"/></g>'
            f'<path d="M140 34Q170 18 200 34M132 22Q170 4 208 22" fill="none" stroke="#F2C76A" stroke-width="6"/>'
            f'<path d="M34 42Q60 30 88 34L46 92ZM232 38Q254 30 276 36L238 86Z" fill="#fff" opacity=".28"/></svg>')


def taca(w):
    i = uid("t")
    return (f'<svg viewBox="0 0 220 340" width="{w}" height="{w * 340 / 220:.0f}" style="display:block;overflow:visible"><defs>{lg(i + "q", [(0, "#FFC857"), (.5, "#FF5C7A"), (1, "#C80F9A")])}{rg(i + "s", "#000", .65)}{rg(i + "h", ROSA, .5)}</defs>'
            f'<ellipse cx="110" cy="316" rx="96" ry="22" fill="url(#{i}s)"/><ellipse cx="110" cy="110" rx="140" ry="110" fill="url(#{i}h)"/>'
            f'<path d="M138 120L196 6" stroke="{CIANO}" stroke-width="9" stroke-linecap="round"/><path d="M40 82H180L110 160Z" fill="url(#{i}q)"/>'
            f'<path d="M16 54H204L113 164V292Q150 296 176 306Q110 326 44 306Q70 296 107 292V164Z" fill="#fff" fill-opacity=".14" stroke="#fff" stroke-opacity=".78" stroke-width="3.5" stroke-linejoin="round"/>'
            f'<ellipse cx="110" cy="54" rx="94" ry="9" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3"/><path d="M34 66L96 142" stroke="#fff" stroke-opacity=".65" stroke-width="5" stroke-linecap="round"/>'
            f'<g transform="translate(46 50)"><circle r="34" fill="#D6E905"/><circle r="26" fill="#F4FF9A"/><path d="M0-25V25M-25 0H25M-18-18L18 18M18-18L-18 18" stroke="#BBD100" stroke-width="3"/></g></svg>')


# ---------------------------------------------------------------- logo, fotos, caixa, celular
def logo(h, claro=False):
    """Lockup gomoso: branco + Go ciano no escuro; tinta + Go magenta na barra branca da caixa."""
    s = svg_text("v4-lockup-white.svg").split('fill="#FFFFFF"')
    a, b = ("#05070F", MAGENTA) if claro else ("#FFFFFF", CIANO)
    svg = s[0] + 'fill="' + a + '"' + s[1] + 'fill="' + b + '"' + s[2]
    return f'<img src="{dados(svg.encode(), "image/svg+xml")}" style="height:{h}px;display:block">'


_fotos = {}


def foto(nome, w=700, pasta="fotos-festa"):
    k = (nome, w, pasta)
    if k not in _fotos:
        im = Image.open(os.path.join(MARCA, pasta, nome + ".jpg")).convert("RGB")
        if im.width > w:
            im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        b = io.BytesIO()
        im.save(b, "JPEG", quality=86, optimize=True)
        _fotos[k] = dados(b.getvalue(), "image/jpeg")
    return _fotos[k]


def caixa(w, giro=13):
    """A “edição” do rolê: caixa em pé com mosaico das fotos da galera."""
    h = round(w * 1.27)
    k = w / 460
    tiles = [("neon-hexagono-roxo", "1/3", "1/3", "center 25%"), ("galera-brinde-azul", "3/5", "1/2", "center"), ("sorriso-neon", "5/7", "1/3", "55% center"),
             ("show-de-costas", "3/5", "2/3", "30% center"), ("oculos-coracao", "1/3", "3/6", "center 20%"), ("roda-gigante-ciano", "5/7", "3/5", "center 20%"),
             ("amigas-por-do-sol", "3/5", "4/6", "60% center"), ("parede-luzes-roxo", "5/7", "5/6", "center 30%")]
    mos = "".join(f'<i style="grid-column:{c};grid-row:{r};background:url({foto(n, 500)}) {p}/cover;border:{2 * k:.1f}px solid #14041F;border-radius:{5 * k:.0f}px"></i>' for n, c, r, p in tiles)
    selo = (f'<div style="position:absolute;left:50%;top:54%;transform:translate(-50%,-50%) rotate(-5deg);text-align:center;filter:drop-shadow(0 {5 * k:.0f}px {8 * k:.0f}px rgba(0,0,0,.7))">'
            f'<svg viewBox="0 0 256 256" width="{170 * k:.0f}" height="{170 * k:.0f}" style="display:block;margin:0 auto {-48 * k:.0f}px"><path fill="{ROSA}" stroke="#fff" stroke-width="12" paint-order="stroke" fill-rule="evenodd" d="{GO_D}"/></svg>'
            f'<div style="font:{66 * k:.0f}px/1 Damion,cursive;color:#fff;-webkit-text-stroke:{9 * k:.0f}px #14041F;paint-order:stroke fill;white-space:nowrap">Viva o rolê</div></div>')
    baixar = f'<svg viewBox="0 0 24 24" width="{26 * k:.0f}" height="{26 * k:.0f}" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v11M7 10l5 5 5-5M5 20h14"/></svg>'
    return (f'<div style="width:{w}px;height:{h}px;position:relative;transform:perspective({3.4 * w:.0f}px) rotateY({giro}deg);transform-origin:50% 100%">'
            f'<div style="position:absolute;left:{-20 * k:.0f}px;top:{9 * k:.0f}px;bottom:{4 * k:.0f}px;width:{22 * k:.0f}px;background:linear-gradient(90deg,#3A0640,{MAGENTA});border-radius:{7 * k:.0f}px 0 0 {7 * k:.0f}px"></div>'
            f'<div style="position:absolute;inset:0;padding:{7 * k:.0f}px;border-radius:{14 * k:.0f}px;background:linear-gradient(150deg,#FF9BE0,{MAGENTA} 40%,{LARANJA});box-shadow:0 {26 * k:.0f}px {44 * k:.0f}px rgba(0,0,0,.55),0 0 {38 * k:.0f}px rgba(255,61,154,.6)">'
            f'<div style="height:100%;display:flex;flex-direction:column;border-radius:{9 * k:.0f}px;overflow:hidden;background:#14041F">'
            f'<div style="height:{68 * k:.0f}px;background:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 {22 * k:.0f}px">{logo(round(34 * k), True)}<span style="font:800 {14 * k:.0f}px Poppins;color:#05070F;letter-spacing:.12em">APP</span></div>'
            f'<div style="height:{46 * k:.0f}px;background:#1B1147;display:flex;align-items:center;justify-content:center;gap:{14 * k:.0f}px;font:800 {19 * k:.0f}px Poppins;color:#fff;letter-spacing:.04em">INGRESSO DIGITAL {baixar}</div>'
            f'<div style="text-align:center;font:600 {14 * k:.0f}px/{34 * k:.0f}px Poppins;letter-spacing:.55em;color:#F3C6E8">EDIÇÃO SEXTA</div>'
            f'<div style="flex:1;margin:0 {16 * k:.0f}px;display:grid;grid-template-columns:repeat(6,1fr);grid-template-rows:repeat(5,1fr);gap:{4 * k:.0f}px;position:relative;min-height:0">{mos}</div>'
            f'<div style="height:{38 * k:.0f}px;display:flex;align-items:center;justify-content:center;font:600 {13 * k:.0f}px Poppins;color:#fff;letter-spacing:.2em">ROLEGO.COM.BR</div></div></div>{selo}</div>')


TIPOS = """@import url('https://fonts.googleapis.com/css2?family=Changa+One:ital@0;1&family=Damion&family=Poppins:ital,wght@0,400;0,500;0,600;0,700;0,800;1,700;1,800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}body{font-family:Poppins,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;-webkit-font-smoothing:antialiased}
.ab{position:absolute}.ab>svg{display:block}
.ch{display:inline-block;font-family:'Changa One',sans-serif;font-style:italic;line-height:1;white-space:nowrap;text-transform:uppercase}
.tag{display:inline-block;font-family:'Changa One',sans-serif;font-style:italic;text-transform:uppercase;line-height:1;border-radius:10px;transform:skewX(-8deg);white-space:nowrap}
.btn{display:inline-block;font-family:'Changa One',sans-serif;font-style:italic;text-transform:uppercase;line-height:1;border-radius:99px;white-space:nowrap;background:linear-gradient(180deg,#FF6BC4,#E0127F);color:#fff;border:4px solid #fff;box-shadow:0 0 28px rgba(255,61,154,.85),0 10px 22px rgba(0,0,0,.4)}
"""

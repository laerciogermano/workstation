#!/usr/bin/env python3
"""RolêGo · logo híbrida: o "ROLÊ" em pincel das combinações de cores + o Go (símbolo gomoso) da logo atual.
Os dois desenhos são os originais, só combinados: role.svg de ../estilo-viva-o-role/lettering e
v4-go-white.svg de ../identidade-v5-gomosa.
Saídas: svg/ (cada opção em 3 fundos), possibilidades-rolego-pincel-go.pdf e .html.
Rodar: python3 -B _build.py"""
import math, os, random, re, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
MARCA = os.path.dirname(AQUI)
sys.path.insert(0, os.path.join(MARCA, "identidade-v5-gomosa"))
from _common import pdf, shoot, svg_text  # noqa: E402

NOME = "possibilidades-rolego-pincel-go"
AZUL, ROXO, VIOLETA, AMARELO = "#68E2E3", "#6D34CC", "#AB05EA", "#D6E905"
NOITE, PRETO, BRANCO, NEVOA, OURO = "#160A33", "#000000", "#FFFFFF", "#F3F1FA", "#FFD60A"

_role_svg = open(os.path.join(MARCA, "estilo-viva-o-role", "lettering", "role.svg")).read()
ROLE, RISCO = re.findall(r' d="([^"]+)"', _role_svg)
GO = re.search(r' d="([^"]+)"', svg_text("v4-go-white.svg")).group(1)
INCL = 13.0  # inclinação do lettering, em graus


# ---------------------------------------------------------------- geometria
def pontos(d):
    n = [float(v) for v in re.findall(r"-?\d+(?:\.\d+)?", d)]
    return list(zip(n[0::2], n[1::2]))


class Peca:
    """Um path girado, escalado (pela largura w ou altura h) e com o canto da caixa em (x, y)."""

    def __init__(self, d, w=None, h=None, rot=0.0):
        self.d, self.rot = d, rot
        c, s = math.cos(math.radians(rot)), math.sin(math.radians(rot))
        p = [(x * c - y * s, x * s + y * c) for x, y in pontos(d)]
        self.bx0, self.by0 = min(a for a, _ in p), min(b for _, b in p)
        bw, bh = max(a for a, _ in p) - self.bx0, max(b for _, b in p) - self.by0
        self.k = w / bw if w else h / bh
        self.w, self.h = bw * self.k, bh * self.k
        self.x = self.y = 0.0

    def em(self, x, y):
        self.x, self.y = x, y
        return self

    def centro(self, cx, cy):
        return self.em(cx - self.w / 2, cy - self.h / 2)

    @property
    def x1(self):
        return self.x + self.w

    @property
    def y1(self):
        return self.y + self.h

    def tf(self):
        return (f"translate({self.x - self.bx0 * self.k:.2f} {self.y - self.by0 * self.k:.2f}) "
                f"scale({self.k:.5f}) rotate({self.rot})")

    def svg(self, fill, extra="", borda=0):
        """borda: largura do contorno em unidades da composição."""
        if borda:
            extra += f' stroke="{fill}" stroke-width="{borda / self.k:.2f}" stroke-linejoin="round"'
        return f'<path transform="{self.tf()}" d="{self.d}" fill="{fill}" fill-rule="evenodd" {extra}/>'


def rolê(w, rot=0.0):
    return Peca(ROLE, w=w, rot=rot)


def go(w=None, h=None, rot=0.0, d=GO):
    return Peca(d, w=w, h=h, rot=rot)


def risco(w, rot=0.0):
    return Peca(RISCO, w=w, rot=rot)


# ---------------------------------------------------------------- o Go pincelado (mesmo desenho, borda de pincel)
def pincelar(d, semente=7):
    r = random.Random(semente)
    saida = ""
    for sub in d.split("M")[1:]:
        p = pontos(sub)
        p.append(p[0])
        q = []
        for (ax, ay), (bx, by) in zip(p, p[1:]):
            n = max(1, int(math.hypot(bx - ax, by - ay) / 1.3))
            q += [(ax + (bx - ax) * i / n, ay + (by - ay) * i / n) for i in range(n)]
        fases = [r.uniform(0, 6.3) for _ in range(3)]
        out = []
        for i, (x, y) in enumerate(q):
            ax, ay = q[i - 3]
            bx, by = q[(i + 3) % len(q)]
            tx, ty = bx - ax, by - ay
            m = math.hypot(tx, ty) or 1
            des = .75 * math.sin(i * .11 + fases[0]) + .45 * math.sin(i * .37 + fases[1]) + r.uniform(-.55, .55)
            if r.random() < .018:  # farpa do pincel seco
                des += r.choice((-1, 1)) * r.uniform(1.4, 2.8)
            out.append(f"{x - ty / m * des:.2f} {y + tx / m * des:.2f}")
        saida += "M" + "L".join(out) + "Z"
    return saida


GO_PINCEL = pincelar(GO)
# riscos de cerda seca, em coordenadas do Go (256 × 256): (x, y, comprimento, espessura)
CERDAS = [(30, 139, 30, 1.7), (36, 150, 22, 1.1), (44, 84, 27, 1.3), (96, 172, 34, 1.5), (172, 82, 30, 1.2),
          (181, 160, 36, 1.8), (196, 150, 24, 1.0), (62, 178, 20, 1.0), (205, 104, 20, 1.3)]


# ---------------------------------------------------------------- composição
_n = [0]


def uid(p):
    _n[0] += 1
    return f"{p}{_n[0]}"


def grad_risco(gid, cores):
    stops = "".join(f'<stop offset="{i / (len(cores) - 1):.2f}" stop-color="{c}"/>' for i, c in enumerate(cores))
    return f'<linearGradient id="{gid}" gradientUnits="userSpaceOnUse" x1="362" y1="0" x2="668" y2="0">{stops}</linearGradient>'


def traco(pc, t):
    gid = uid("r")
    return f"<defs>{grad_risco(gid, t['risco'])}</defs>" + pc.svg(f"url(#{gid})")


def vazado(baixo, cima, folga):
    """Desenha `baixo` com um respiro transparente em volta de `cima`."""
    mid = uid("m")
    return (f'<mask id="{mid}" maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000">'
            f'<rect x="-2000" y="-2000" width="6000" height="6000" fill="#fff"/>{cima.svg("#000", borda=folga)}</mask>'
            f'<g mask="url(#{mid})">{baixo}</g>')


def caixa(pecas, folga=0):
    return (min(p.x for p in pecas) - folga, min(p.y for p in pecas) - folga,
            max(p.x1 for p in pecas) + folga, max(p.y1 for p in pecas) + folga)


# Cada opção recebe o tema e devolve (corpo SVG, caixa).
def o01(t):
    r = rolê(600).em(0, 0)
    g = go(w=250, rot=-INCL)
    g.em(r.x1 + 6, r.y + 18)
    return r.svg(t["role"]) + g.svg(t["go"]), caixa([r, g])


def o02(t):
    r = rolê(600).em(0, 0)
    g = go(w=245)
    g.em(r.x1 + 4, r.h * .76 - g.h)
    return r.svg(t["role"]) + g.svg(t["go"]), caixa([r, g])


def o03(t):
    r = rolê(600, INCL).em(0, 0)
    g = go(h=r.h * .76)
    g.em(r.x1 + 12, r.h * .93 - g.h)
    return r.svg(t["role"]) + g.svg(t["go"]), caixa([r, g])


def o04(t):
    r = rolê(600).em(0, 0)
    g = go(w=255, rot=-INCL)
    g.em(r.w - g.w + 62, r.h - g.h * .62)
    return vazado(r.svg(t["role"]), g, 20) + g.svg(t["go"]), caixa([r, g])


def o05(t):
    r = rolê(600, INCL).em(0, 0)
    g = go(w=330)
    g.centro(r.w / 2, r.h + 18 + g.h / 2)
    return r.svg(t["role"]) + g.svg(t["go"]), caixa([r, g])


def o06(t):
    g = go(w=440, rot=-INCL).em(80, 0)
    r = rolê(600).em(0, g.h * .80)
    return g.svg(t["go"]) + r.svg(t["role"]), caixa([r, g])


def o07(t):
    r = rolê(600).em(0, 0)
    s = risco(420).em(165, r.h - 62)
    g = go(w=250, rot=-INCL)
    g.em(s.x1 + 2, s.y - g.h * .46)
    return r.svg(t["role"]) + traco(s, t) + g.svg(t["go"]), caixa([r, s, g])


def o08(t):
    r = rolê(600).em(0, 0)
    g = go(w=250, rot=-INCL)
    g.em(r.x1 + 6, r.y + 18)
    s = risco(690, 0).em(150, r.h - 112)
    return r.svg(t["role"]) + g.svg(t["go"]) + traco(s, t), caixa([r, g, s])


def o09(t):
    r = rolê(600).em(0, 0)
    g = go(w=300)
    g.em(r.x1 - 62, r.h * .40)
    return vazado(r.svg(t["role"]), g, 22) + g.svg(t["go"]), caixa([r, g])


def o10(t):
    g = go(w=700, rot=-INCL).em(0, 0)
    r = rolê(590)
    r.centro(g.w * .50, g.h * .56)
    return vazado(g.svg(t["go"]), r, 30) + r.svg(t["role"]), caixa([r, g])


def o11(t):
    g = go(w=620).em(0, 150)
    r = rolê(350)
    r.em(-40, 0)
    return vazado(g.svg(t["go"]), r, 24) + r.svg(t["role"]), caixa([r, g])


def o12(t):
    r = rolê(600).em(0, 0)
    g = go(w=270, rot=-INCL, d=GO_PINCEL)
    g.em(r.x1 + 6, r.y + 14)
    mid = uid("c")
    cerdas = "".join(f'<path d="M{x} {y}q{c * .5} {-e * 1.6} {c} {-c * .06}q{-c * .5} {-e * .2} {-c} {c * .06 + e}Z" fill="#000"/>'
                     for x, y, c, e in CERDAS)
    mascara = (f'<mask id="{mid}" maskUnits="userSpaceOnUse" x="0" y="0" width="256" height="256">'
               f'<rect width="256" height="256" fill="#fff"/>{cerdas}</mask>')
    return r.svg(t["role"]) + mascara + g.svg(t["go"], f'mask="url(#{mid})"'), caixa([r, g])


def o13(t):
    r = rolê(600, INCL).em(0, 0)
    alt, larg = r.h * .86, r.h * 1.42
    cx, cy = r.x1 + 22, r.h * .93 - alt
    g = go(w=larg * .70)
    g.centro(cx + larg / 2, cy + alt / 2)
    capsula = f'<rect x="{cx:.1f}" y="{cy:.1f}" width="{larg:.1f}" height="{alt:.1f}" rx="{alt / 2:.1f}" fill="{t["selo"]}"/>'
    return r.svg(t["role"]) + capsula + g.svg(t["no_selo"]), (0, 0, cx + larg, r.h)


def o14(t):
    r = rolê(600).em(0, 0)
    g = go(w=260, rot=-INCL)
    g.em(r.x1 + 4, r.y + 20)
    o = 15
    sr = Peca(ROLE, w=600).em(o, o)
    sg = Peca(GO, w=260, rot=-INCL).em(g.x + o, g.y + o)
    return (sr.svg(t["sombra"]) + sg.svg(t["sombra"]) + r.svg(t["role"]) + g.svg(t["go"])), caixa([r, g, sr, sg])


def o15(t):
    r = rolê(560).centro(500, 405)
    g = go(w=310, rot=-INCL).centro(545, 690)
    disco = f'<circle cx="500" cy="500" r="470" fill="{t["selo"]}"/><circle cx="500" cy="500" r="432" fill="none" stroke="{t["no_selo"]}" stroke-width="9"/>'
    return disco + r.svg(t["no_selo_role"]) + g.svg(t["no_selo"]), (30, 30, 970, 970)


def o16(t):
    r = rolê(500, INCL).centro(330, 160)
    g = go(w=270).centro(820, 160)
    blocos = (f'<path d="M60 0H640V320H60Q0 320 0 260V60Q0 0 60 0Z" fill="{t["bloco"]}"/>'
              f'<path d="M640 0H940Q1000 0 1000 60V260Q1000 320 940 320H640Z" fill="{t["selo"]}"/>')
    return blocos + r.svg(t["no_bloco"]) + g.svg(t["no_selo"]), (0, 0, 1000, 320)


def o17(t):
    r = rolê(600).em(0, 100)
    cx, cy, raio = r.x1 + 142, 128, 118
    g = go(w=166, rot=-INCL).centro(cx, cy)
    mid = uid("m")
    mascara = (f'<mask id="{mid}" maskUnits="userSpaceOnUse" x="-100" y="-100" width="1200" height="800">'
               f'<rect x="-100" y="-100" width="1200" height="800" fill="#fff"/><circle cx="{cx}" cy="{cy}" r="{raio + 18}" fill="#000"/></mask>')
    balao = (f'<path d="M{cx - 108} {cy + 55}L{cx - 122} {cy + 138}L{cx - 40} {cy + 114}Z" fill="{t["selo"]}"/>'
             f'<circle cx="{cx}" cy="{cy}" r="{raio}" fill="{t["selo"]}"/>')
    return (mascara + f'<g mask="url(#{mid})">{r.svg(t["role"])}</g>' + balao + g.svg(t["no_selo"])), (0, cy - raio, cx + raio, r.y1)


def o18(t):
    r = rolê(600).em(0, 0)
    g = go(w=285, rot=-INCL)
    g.em(r.x1 + 6, r.y + 8)
    cid = uid("k")
    clip = f'<clipPath id="{cid}" clipPathUnits="userSpaceOnUse"><path d="{GO}" clip-rule="evenodd"/></clipPath>'
    contorno = g.svg("none", f'stroke="{t["go"]}" stroke-width="15" clip-path="url(#{cid})"')
    return r.svg(t["role"]) + clip + contorno, caixa([r, g])


OPCOES = [
    ("lado-inclinado", "Lado a lado no embalo", "O Go gira junto com o pincel e segue a mesma subida.", o01),
    ("lado-reto", "Lado a lado, Go em pé", "Pincel solto, Go firme: o contraste é a graça.", o02),
    ("nivelado", "Tudo na linha", "O pincel endireitado. A leitura mais clara na horizontal.", o03),
    ("encaixe", "Encaixe no Ê", "O Go ocupa o vão que a subida do pincel deixa embaixo.", o04),
    ("empilhado", "Rolê em cima, Go embaixo", "Bloco centralizado para espaço quadrado.", o05),
    ("go-em-cima", "Go em cima", "O Go abre a assinatura e o pincel segura a base.", o06),
    ("fim-do-traco", "O traço leva ao Go", "O risco degradê sai do Rolê e termina no Go.", o07),
    ("traco-junto", "Um traço pros dois", "Lado a lado, com o risco amarrando o conjunto.", o08),
    ("colado", "Colado", "O Go entra na frente do Ê com um respiro em volta.", o09),
    ("go-fundo", "Go gigante atrás", "O Rolê atravessa o símbolo. Mais pôster que assinatura.", o10),
    ("go-grande", "Go protagonista", "Pincel pequeno no ombro de um Go grande.", o11),
    ("go-pincelado", "Go pincelado", "Mesmo desenho do Go, com a borda seca do pincel.", o12),
    ("capsula", "Go em cápsula", "O Go vira botão, na mesma altura das letras.", o13),
    ("adesivo", "Adesivo", "Sombra deslocada nos dois, jeito de sticker.", o14),
    ("selo", "Selo", "Redondo para avatar, adesivo, copo e camiseta.", o15),
    ("blocos", "Dois blocos", "Cada parte na sua cor de fundo.", o16),
    ("balao", "Balão do Go", "O Go chega como notificação em cima do Ê.", o17),
    ("contorno", "Go vazado", "Pincel cheio e Go em linha: menos peso à direita.", o18),
]

TEMAS = {
    "roxo": dict(fundo=f"linear-gradient(150deg,{VIOLETA},{ROXO})", role=AMARELO, go=AZUL, risco=[AZUL, "#B9F6F2", BRANCO],
                 selo=NOITE, no_selo=AZUL, no_selo_role=AMARELO, bloco=NOITE, no_bloco=AMARELO, sombra=NOITE),
    "preto": dict(fundo=PRETO, role=AMARELO, go=AZUL, risco=[AZUL, "#6A86EC", ROXO, VIOLETA],
                  selo=ROXO, no_selo=AZUL, no_selo_role=AMARELO, bloco="#2A1458", no_bloco=AMARELO, sombra=ROXO),
    "claro": dict(fundo=NEVOA, role=ROXO, go=NOITE, risco=[AZUL, "#6A86EC", ROXO, VIOLETA],
                  selo=ROXO, no_selo=AZUL, no_selo_role=AMARELO, bloco=NOITE, no_bloco=AMARELO, sombra=AZUL),
}
# no bloco duplo, o segundo bloco é a cor de ação
TEMAS_BLOCO = {"roxo": dict(selo=AZUL, no_selo=NOITE), "preto": dict(selo=AZUL, no_selo=NOITE), "claro": dict(selo=ROXO, no_selo=BRANCO)}

# cores tiradas de ../estilo-viva-o-role/combinacoes (e go-variacoes): nome, fundo, fundo 2, pincel, Go, destaque escuro
COMBOS = [
    ("01 · Atual", "#AB05EA", "#6D34CC", "#D6E905", "#68E2E3"),
    ("13 · Azul vivo e ouro", "#8A2BE2", "#5B2BD9", "#FFD60A", "#3DD6FF"),
    ("10 · Uva e amarelo", "#7B1977", "#3D1567", "#FFD60A", "#68E2E3"),
    ("05 · Branco e ciano", "#AB05EA", "#6D34CC", "#68E2E3", "#FFFFFF"),
    ("27 · Go ouro", "#8A2BE2", "#5B2BD9", "#FFFFFF", "#FFD60A"),
    ("26 · Go rosa", "#AB05EA", "#6D34CC", "#D6E905", "#FF9BD5"),
    ("14 · Azul royal", "#5B2BD9", "#1D46C9", "#D6E905", "#68E2E3"),
    ("Preto e ouro", "#000000", "#000000", "#FFD60A", "#3DD6FF"),
]


def logo(i, tema, extra=None, largura=None, altura=None):
    """SVG da opção i (1..18) no tema. Com largura e altura, encaixa nessa caixa (px)."""
    t = dict(TEMAS[tema])
    if i == 16:
        t.update(TEMAS_BLOCO[tema])
    t.update(extra or {})
    corpo, (x0, y0, x1, y1) = OPCOES[i - 1][3](t)
    pad = 6
    x0, y0, w, h = x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad
    k = min(largura / w, altura / h) if largura else 1
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0:.1f} {y0:.1f} {w:.1f} {h:.1f}" '
            f'width="{w * k:.1f}" height="{h * k:.1f}" role="img" aria-label="RolêGo">{corpo}</svg>')


# ---------------------------------------------------------------- documento
CSS = """@import url('https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@1,90,900&family=Poppins:wght@400;500;600;700&display=swap');
@page{size:297mm 210mm;margin:0}*{box-sizing:border-box;margin:0;padding:0}body{font-family:Poppins,sans-serif;background:#555;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:297mm;height:210mm;padding:22px 36px 28px;position:relative;overflow:hidden;page-break-after:always;background:#fff;color:#111}
header{display:flex;justify-content:space-between;align-items:center;gap:20px;height:34px}h2{font:italic 900 24px/1 Archivo,sans-serif;font-stretch:90%;text-transform:uppercase}
header p{font-size:10.5px;color:#555}u{text-decoration:none;background:#111;color:#fff;border-radius:7px;padding:1px 8px 2px;margin-right:8px;display:inline-block}
.foot{position:absolute;left:36px;right:36px;bottom:10px;display:flex;justify-content:space-between;font-size:8.5px;color:#888}
.t{display:flex;align-items:center;justify-content:center;position:relative;border-radius:12px;overflow:hidden}svg{display:block}
.grade{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(6,104px);gap:6px 12px;margin-top:10px}
.grade .t b{position:absolute;left:8px;top:7px;font-size:9px;border-radius:5px;padding:0 5px;background:rgba(255,255,255,.92);color:#111}
.op{margin-top:10px}.op h3{font-size:12.5px;display:flex;align-items:center;margin-bottom:6px;gap:2px}.op h3 u{font-size:10.5px}.op h3 span{font:400 9.5px Poppins;color:#666;margin-left:10px}
.tres{display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:10px}.tres .t{height:316px}
.cores{display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(2,330px);gap:12px;margin-top:12px}.cores .t{flex-direction:column;justify-content:space-between;padding:12px 8px}.cores small{color:#fff;font-size:9px;font-weight:600}
.min{display:grid;grid-template-columns:150px repeat(3,1fr);gap:7px 12px;margin-top:12px;align-items:center}.min .t{height:96px;gap:18px}.min p{font-size:10px;font-weight:600}.min p span{display:block;font-weight:400;color:#777;font-size:8.5px}"""


def pag(n, titulo, sub, corpo):
    return (f'<section class="page"><header><h2>{titulo}</h2><p>{sub}</p></header>{corpo}'
            f'<div class="foot"><span>RolêGo · logo pincel + Go · possibilidades</span><span>{n}</span></div></section>')


def caixa_logo(i, tema, w, h, extra_html=""):
    return f'<div class="t" style="background:{TEMAS[tema]["fundo"]}">{logo(i, tema, largura=w, altura=h)}{extra_html}</div>'


def geral(n, tema, titulo, sub):
    cel = "".join(caixa_logo(i, tema, 270, 82 if i not in (15,) else 90, f"<b>{i:02d}</b>") for i in range(1, len(OPCOES) + 1))
    return pag(n, titulo, sub, f'<div class="grade">{cel}</div>')


def detalhe(n, a):
    blocos = ""
    for i in (a, a + 1):
        _, nome, ideia, _ = OPCOES[i - 1]
        blocos += (f'<div class="op"><h3><u>{i:02d}</u>{nome}<span>{ideia}</span></h3><div class="tres">'
                   f'{caixa_logo(i, "roxo", 380, 260)}{caixa_logo(i, "preto", 250, 230)}{caixa_logo(i, "claro", 250, 230)}</div></div>')
    return pag(n, f"Opções {a:02d} e {a + 1:02d}", "Roxo, preto e claro.", blocos)


def cores(n):
    cel = ""
    for nome, f1, f2, pincel, cor_go in COMBOS:
        ex = dict(role=pincel, go=cor_go, risco=[cor_go, cor_go])
        cel += (f'<div class="t" style="background:linear-gradient(160deg,{f1},{f2})"><small>{nome}</small>'
                f'{logo(3, "roxo", ex, 232, 80)}{logo(4, "roxo", ex, 210, 120)}{logo(5, "roxo", ex, 170, 112)}<span></span></div>')
    return pag(n, "Nas cores das combinações", "Opções 03, 04 e 05 em paletas do combinacoes-de-cores (números iguais aos de lá).", f'<div class="cores">{cel}</div>')


def reduzidas(n, quais):
    linhas = ""
    for i in quais:
        linhas += f'<p>{i:02d}<span>{OPCOES[i - 1][1]}</span></p>'
        for tema in ("roxo", "preto", "claro"):
            linhas += (f'<div class="t" style="background:{TEMAS[tema]["fundo"]}">{logo(i, tema, largura=118, altura=64)}'
                       f'{logo(i, tema, largura=70, altura=34)}{logo(i, tema, largura=40, altura=20)}</div>')
    return pag(n, "Em tamanho pequeno", "118, 70 e 40 px de largura máxima: o que aguenta topo de app e rodapé de post.", f'<div class="min">{linhas}</div>')


def documento():
    pags = [geral(1, "roxo", "18 possibilidades", "O ROLÊ em pincel das combinações + o Go da logo."),
            geral(2, "preto", "No preto", "As mesmas 18, na mesma ordem."),
            geral(3, "claro", "No claro", "Amarelo e azul somem no claro: aqui entram roxo e noite.")]
    for a in range(1, len(OPCOES), 2):
        pags.append(detalhe(len(pags) + 1, a))
    pags.append(cores(len(pags) + 1))
    pags.append(reduzidas(len(pags) + 1, [1, 3, 4, 5, 13, 15]))
    html = f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>RolêGo — pincel + Go</title><style>{CSS}</style></head><body>{"".join(pags)}</body></html>'
    out = os.path.join(AQUI, NOME + ".html")
    open(out, "w").write(html)
    pdf(out, os.path.join(AQUI, NOME + ".pdf"))
    print("ok", len(pags), "págs")


def exportar():
    pasta = os.path.join(AQUI, "svg")
    os.makedirs(pasta, exist_ok=True)
    for i, (slug, *_) in enumerate(OPCOES, 1):
        for tema in TEMAS:
            open(os.path.join(pasta, f"{i:02d}-{slug}-{tema}.svg"), "w").write(logo(i, tema))


if __name__ == "__main__":
    exportar()
    documento()
    if "--prova" in sys.argv:  # PNG de cada página, para conferência
        destino = sys.argv[sys.argv.index("--prova") + 1]
        html = open(os.path.join(AQUI, NOME + ".html")).read()
        cab, corpo = html.split("<body>")
        for j, s in enumerate(re.findall(r"<section.*?</section>", corpo, re.S), 1):
            h = os.path.join(destino, f"p{j:02d}.html")
            open(h, "w").write(cab + "<body>" + s + "</body></html>")
            shoot(h, os.path.join(destino, f"p{j:02d}.png"), 1123, 794)

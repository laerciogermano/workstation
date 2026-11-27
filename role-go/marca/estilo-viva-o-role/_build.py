#!/usr/bin/env python3
"""RolêGo · identidade visual no estilo "Viva o rolê", versão 2: AZUL + ROXO + AMARELO.
O azul é a cor da ação (botões, badges, dados e detalhes), o roxo é a superfície e o amarelo é o pincel.
Gera lettering/*.svg, posts/, stories/, o HTML e o PDF (A4 paisagem). Precisa de Pillow e do Chrome.
Rodar: python3 _build.py        (a versão 1 está em v1/)"""
import base64, io, os, sys

OUT = os.path.dirname(os.path.abspath(__file__))
MARCA = os.path.normpath(os.path.join(OUT, ".."))
sys.path.insert(0, os.path.join(MARCA, "identidade-v5-gomosa"))
sys.path.insert(0, os.path.join(OUT, "lettering"))
from _common import contrast, pdf, shoot, svg_text  # noqa: E402
from _tracos import ROLE_D, VIVA_D  # noqa: E402
from PIL import Image, ImageCms, ImageOps  # noqa: E402

NOME = "amostra-estilo-viva-o-role"
AZUL, ROXO, AMARELO = "#68E2E3", "#6D34CC", "#D6E905"
VIOLETA, NOITE, PRETO, BRANCO, NEVOA = "#AB05EA", "#160A33", "#000000", "#FFFFFF", "#F3F1FA"
SUP = f"linear-gradient(150deg,{VIOLETA} 0%,{ROXO} 100%)"          # superfície roxa
RISCO = f"linear-gradient(90deg,{AZUL},#6A86EC 40%,{ROXO} 70%,{VIOLETA})"
# luz das fotos: noite → roxo → azul
FOTO = [(0, "#03020C"), (60, "#190B49"), (115, "#5A28B4"), (165, "#7160E4"), (215, AZUL), (255, "#EFFFFF")]


def dados(raw, mime):
    return f"data:{mime};base64," + base64.b64encode(raw).decode()


# ---------------------------------------------------------------- lettering
_g = [0]


def _risco(gid):
    stops = "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in ((0, AZUL), (.4, "#6A86EC"), (.7, ROXO), (1, VIOLETA)))
    return (f'<defs><linearGradient id="{gid}" gradientUnits="userSpaceOnUse" x1="362" y1="0" x2="668" y2="0">{stops}</linearGradient></defs>'
            f'<path fill="url(#{gid})" d="M362 693C430 662 540 628 664 598C672 598 670 605 660 608C562 640 468 674 380 706C366 711 352 701 362 693Z"/>')


def letras(w, viva=BRANCO, pincel=AMARELO, com_viva=True, com_risco=True):
    """“VIVA O ROLÊ” vetorial. com_viva=False deixa só o ROLÊ em pincel."""
    _g[0] += 1
    x0, y0, x1, y1 = (96, 308, 680, 716) if com_viva else (96, 390, 680, 716)
    corpo = f'<path fill="{viva}" fill-rule="evenodd" d="{VIVA_D}"/>' if com_viva else ""
    corpo += f'<path fill="{pincel}" fill-rule="evenodd" d="{ROLE_D}"/>' + (_risco(f"r{_g[0]}") if com_risco else "")
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} {y0} {x1 - x0} {y1 - y0}" width="{w}" height="{w * (y1 - y0) / (x1 - x0):.0f}" style="display:block">{corpo}</svg>')


def traco(w):
    _g[0] += 1
    return f'<svg viewBox="354 592 322 124" width="{w}" height="{w * 124 / 322:.0f}" style="display:block">{_risco(f"t{_g[0]}")}</svg>'


def arco(w=110, cor=AZUL, esp=2.4):
    return f'<svg viewBox="0 0 100 70" width="{w}" style="position:absolute;right:0;top:0"><path d="M6 0C40 8 76 28 100 62" fill="none" stroke="{cor}" stroke-width="{esp}" stroke-linecap="round"/></svg>'


# ---------------------------------------------------------------- logo
def _svg(s, estilo):
    return f'<img src="{dados(s.encode(), "image/svg+xml")}" style="{estilo}">'


def logo(h, role=BRANCO, go_=AZUL):
    p = svg_text("v4-lockup-white.svg").split('fill="#FFFFFF"')
    return _svg(p[0] + f'fill="{role}"' + p[1] + f'fill="{go_}"' + p[2], f"height:{h}px;display:block")


def go(cor, h, extra=""):
    return _svg(svg_text("v4-go-white.svg").replace('fill="#FFFFFF"', f'fill="{cor}"'), f"height:{h}px;display:block;{extra}")


# ---------------------------------------------------------------- ícones
_IC = {"pin": '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
       "cal": '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
       "heart": '<path d="M12 20S3.5 15 3.5 9.2A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8.500 2.2C20.5 15 12 20 12 20Z"/>',
       "x": '<path d="M6 6l12 12M18 6 6 18"/>', "check": '<path d="m4.500 12.500 5 5 10-11"/>',
       "star": '<path d="m12 3.500 2.600 5.400 5.900.800-4.300 4.100 1.100 5.800L12 16.800l-5.300 2.800 1.100-5.800-4.300-4.100 5.900-.800Z"/>',
       "search": '<circle cx="11" cy="11" r="6.500"/><path d="m16 16 4.500 4.500"/>',
       "bell": '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.500 2h-15ZM10 21h4"/>',
       "arrow": '<path d="M4 12h15M13 6l6 6-6 6"/>', "user": '<circle cx="12" cy="8" r="4"/><path d="M4.500 20c1.500-4 4.300-5.500 7.500-5.500s6 1.500 7.500 5.500"/>',
       "ticket": '<path d="M3.500 8V6h17v2a4 4 0 0 0 0 8v2h-17v-2a4 4 0 0 0 0-8Z"/>'}


def ic(nome, tam, cor="currentColor", cheio=False, esp=2.2):
    return (f'<svg viewBox="0 0 24 24" width="{tam}" height="{tam}" fill="{cor if cheio else "none"}" stroke="{cor}" stroke-width="{esp}" '
            f'stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;display:inline-block;vertical-align:middle">{_IC[nome]}</svg>')


# ---------------------------------------------------------------- fotos (mapa de degradê)
_P3 = Image.open(os.path.join(MARCA, "criativos", "img", "multidao-2.png")).info.get("icc_profile")
_fc = {}


def _lut(stops):
    t = []
    for canal in range(3):
        for x in range(256):
            for (a, ca), (b, cb) in zip(stops, stops[1:]):
                if a <= x <= b:
                    va, vb = int(ca[1 + 2 * canal:3 + 2 * canal], 16), int(cb[1 + 2 * canal:3 + 2 * canal], 16)
                    t.append(round(va + (vb - va) * (x - a) / (b - a)))
                    break
    return t


def foto(nome, w=900):
    """nome = arquivo em fotos-festa/ (sem .jpg) ou 'multidao-1' / 'multidao-2' (recortes de logo-v4)."""
    if (nome, w) not in _fc:
        recorte = nome.startswith("multidao-")
        caminho = f"logo-v4/foto-{nome}.jpg" if recorte else f"fotos-festa/{nome}.jpg"
        im = Image.open(os.path.join(MARCA, caminho)).convert("RGB")
        if recorte and _P3:
            im = ImageCms.profileToProfile(im, ImageCms.ImageCmsProfile(io.BytesIO(_P3)), ImageCms.createProfile("sRGB"), outputMode="RGB")
        if im.width != w and (im.width > w or recorte):
            im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        g = ImageOps.autocontrast(im.convert("L"), cutoff=1)
        t = _lut(FOTO)
        im = Image.merge("RGB", [g.point(t[i * 256:(i + 1) * 256]) for i in range(3)])
        b = io.BytesIO()
        im.save(b, "JPEG", quality=82, optimize=True)
        _fc[(nome, w)] = dados(b.getvalue(), "image/jpeg")
    return _fc[(nome, w)]


def facho(op=.45):
    return f'<div class="ft" style="inset:0;mix-blend-mode:screen;background:radial-gradient(ellipse 46% 34% at 0% 26%,rgba(104,226,227,{op}),rgba(104,226,227,0) 100%)"></div>'


# ---------------------------------------------------------------- componentes (tamanhos em px da peça; s = escala)
def tit(texto, tam, cor=BRANCO):
    return f'<span class="tt" style="font-size:{tam}px;color:{cor}">{texto}</span>'


def pinc(texto, tam, cor=AMARELO):
    return f'<span class="pn" style="color:{cor};font-size:{tam}px">{texto}</span>'


def az(t):
    return f'<span style="color:{AZUL}">{t}</span>'


BTN = {"azul": (AZUL, NOITE, AZUL), "roxo": (ROXO, BRANCO, ROXO), "contorno": ("transparent", AZUL, AZUL),
       "amarelo": (AMARELO, NOITE, AMARELO), "branco": (BRANCO, NOITE, BRANCO)}


def btn(t, tipo="azul", s=1.0, icone=None, bloco=False, extra=""):
    bg, fg, bd = BTN[tipo]
    i = ic(icone, round(15 * s), fg) if icone else ""
    larg = "display:flex;width:100%;" if bloco else "display:inline-flex;"
    return (f'<span class="bt" style="{larg}background:{bg};color:{fg};border:{max(1, 1.8 * s):.1f}px solid {bd};font-size:{12 * s:.1f}px;'
            f'padding:{9 * s:.1f}px {22 * s:.1f}px;gap:{7 * s:.1f}px;{extra}">{t}{i}</span>')


def badge(t, tipo="azul", s=1.0, icone=None):
    bg, fg, bd = {"azul": (AZUL, NOITE, AZUL), "linha": ("rgba(0,0,0,.35)", AZUL, AZUL), "amarelo": (AMARELO, NOITE, AMARELO),
                  "roxo": (ROXO, BRANCO, ROXO), "noite": (NOITE, AZUL, NOITE), "branco": (BRANCO, NOITE, BRANCO),
                  "violeta": (VIOLETA, BRANCO, VIOLETA)}[tipo]
    i = ic(icone, round(11 * s), fg) if icone else ""
    return (f'<span class="bd" style="background:{bg};color:{fg};border:{max(1, 1.2 * s):.1f}px solid {bd};font-size:{9.5 * s:.1f}px;'
            f'padding:{3.5 * s:.1f}px {10 * s:.1f}px;gap:{5 * s:.1f}px">{i}{t}</span>')


def avs(tam=22, borda=PRETO):
    return "".join(f'<i style="display:inline-block;width:{tam}px;height:{tam}px;border-radius:50%;margin-right:-{tam * .28:.0f}px;background:{c};border:{max(1.5, tam * .09):.1f}px solid {borda}"></i>'
                   for c in (AMARELO, AZUL, VIOLETA))


def redondo(icone, tipo, d):
    bg, fg, bd = BTN[tipo]
    return (f'<span style="width:{d}px;height:{d}px;border-radius:50%;background:{bg};border:{max(1.5, d * .045):.1f}px solid {bd};display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">'
            f'{ic(icone, round(d * .46), fg, cheio=icone in ("heart", "star"), esp=2.4)}</span>')


# ---------------------------------------------------------------- posts, stories e páginas
for parte in ("_posts.py", "_paginas.py"):
    exec(compile(open(os.path.join(OUT, parte)).read(), parte, "exec"))

if "--sem-posts" not in sys.argv:
    gerar_posts()

for nome, kw in (("viva-o-role", {}), ("role", {"com_viva": False})):
    open(os.path.join(OUT, "lettering", f"{nome}.svg"), "w").write(letras(900, **kw))

paginas = [fn(n) for n, fn in enumerate(PAGINAS, 1)]
html = f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>RolêGo — identidade visual · Viva o rolê (azul, roxo e amarelo)</title><style>{CSS}</style></head><body>{"".join(paginas)}</body></html>'
out_html = os.path.join(OUT, NOME + ".html")
open(out_html, "w").write(html)
pdf(out_html, os.path.join(OUT, NOME + ".pdf"))
print("ok", len(paginas), "págs")

"""Cores, desenhos e fotos da mistura entre ../image.png (posts em degradê violeta → anil, Poppins itálico,
ciano, G gigante, tags e pílulas) e ../estilo-viva-o-role (pincel lima, risco, arcos, multidão, caixa alta)."""
import base64, io, os, sys

OUT = os.path.dirname(os.path.abspath(__file__))
MARCA = os.path.normpath(os.path.join(OUT, ".."))
sys.path.insert(0, os.path.join(MARCA, "identidade-v5-gomosa"))
sys.path.insert(0, os.path.join(MARCA, "estilo-viva-o-role", "lettering"))
from _common import pdf, shoot, svg_text  # noqa: E402,F401
from _tracos import ROLE_D, VIVA_D  # noqa: E402
from PIL import Image, ImageCms, ImageOps  # noqa: E402

LIMA, CIANO, ANIL, ROXO, VIOLETA = "#D6E905", "#68E2E3", "#452EFF", "#6D34CC", "#9E19E9"
MAGENTA, ROSA, PESSEGO = "#F60CED", "#CB4C7B", "#FA9B56"
ESPECTRO = [PESSEGO, ROSA, MAGENTA, VIOLETA, ROXO, ANIL, CIANO, LIMA]
# nome, hex, de onde vem, papel
CORES = [("Lima", LIMA, "Viva o rolê", "pincel, chip e número"), ("Ciano", CIANO, "posts + escolhidas", "destaque, tag e Go"), ("Anil", ANIL, "posts", "fim do degradê"),
         ("Roxo", ROXO, "escolhidas", "meio do degradê"), ("Violeta", VIOLETA, "posts", "início do degradê"), ("Magenta", MAGENTA, "Viva o rolê", "luz, arco e botão"),
         ("Rosa", ROSA, "escolhidas", "risco e detalhe"), ("Pêssego", PESSEGO, "Viva o rolê", "começo do risco"), ("Preto", "#000000", "os dois", "fundo"), ("Branco", "#FFFFFF", "os dois", "título")]

DEG = f"linear-gradient(145deg,{VIOLETA} 0%,{ROXO} 48%,{ANIL} 100%)"
# superfície da mistura: degradê dos posts + luz magenta e ciano do palco
SUP = (f"radial-gradient(ellipse 75% 55% at 105% 102%,{MAGENTA} 0%,rgba(246,12,237,0) 100%),"
       f"radial-gradient(ellipse 60% 42% at 102% -2%,rgba(104,226,227,.6),rgba(104,226,227,0) 100%),{DEG}")
BOTAO = f"linear-gradient(90deg,{MAGENTA},{VIOLETA} 45%,{ANIL})"
FAIXA = f"linear-gradient(90deg,{','.join(ESPECTRO)})"

GO_D = svg_text("v4-go-white.svg").split(' d="')[1].split('"')[0]
_n = [0]


def novo_id(p):
    _n[0] += 1
    return f"{p}{_n[0]}"


def dados(raw, mime):
    return f"data:{mime};base64," + base64.b64encode(raw).decode()


def degrade(gid, cores, x1, y1, x2, y2):
    st = "".join(f'<stop offset="{i / (len(cores) - 1):.3f}" stop-color="{c}"/>' for i, c in enumerate(cores))
    return f'<linearGradient id="{gid}" gradientUnits="userSpaceOnUse" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">{st}</linearGradient>'


def _risco(cores):
    g = novo_id("r")
    return (f'<defs>{degrade(g, cores, 362, 0, 668, 0)}</defs>'
            f'<path fill="url(#{g})" d="M362 693C430 662 540 628 664 598C672 598 670 605 660 608C562 640 468 674 380 706C366 711 352 701 362 693Z"/>')


def risco(w, cores=ESPECTRO):
    return f'<svg viewBox="354 592 322 124" width="{w}" height="{w * 124 / 322:.0f}" style="display:block">{_risco(cores)}</svg>'


def lettering(w, pincel=LIMA, viva="#FFFFFF", com_viva=True, com_risco=True):
    """VIVA O ROLÊ vetorial. pincel aceita uma cor ou uma lista (degradê)."""
    x0, y0, x1, y1 = (96, 308, 680, 716) if com_viva else (96, 390, 680, 716)
    corpo = f'<path fill="{viva}" fill-rule="evenodd" d="{VIVA_D}"/>' if com_viva else ""
    if isinstance(pincel, (list, tuple)):
        g = novo_id("p")
        corpo += f'<defs>{degrade(g, pincel, 110, 700, 668, 400)}</defs>'
        pincel = f"url(#{g})"
    corpo += f'<path fill="{pincel}" fill-rule="evenodd" d="{ROLE_D}"/>' + (_risco(ESPECTRO) if com_risco else "")
    return f'<svg viewBox="{x0} {y0} {x1 - x0} {y1 - y0}" width="{w}" height="{w * (y1 - y0) / (x1 - x0):.0f}" style="display:block">{corpo}</svg>'


def go(h, cor="#FFFFFF", extra=""):
    """Símbolo Go; cor pode ser uma lista (degradê)."""
    defs = ""
    if isinstance(cor, (list, tuple)):
        g = novo_id("g")
        defs, cor = f"<defs>{degrade(g, cor, 20, 200, 236, 40)}</defs>", f"url(#{g})"
    return f'<svg viewBox="0 0 256 256" width="{h}" height="{h}" style="display:block;{extra}">{defs}<path fill="{cor}" fill-rule="evenodd" d="{GO_D}"/></svg>'


def go_foto(h, foto_uri, extra="", contorno=CIANO):
    """O Go como janela: a foto da festa dentro do símbolo."""
    c = novo_id("c")
    return (f'<svg viewBox="0 0 256 256" width="{h}" height="{h}" style="display:block;{extra}"><defs><clipPath id="{c}"><path clip-rule="evenodd" d="{GO_D}"/></clipPath></defs>'
            f'<image href="{foto_uri}" x="0" y="0" width="256" height="256" preserveAspectRatio="xMidYMid slice" clip-path="url(#{c})"/>'
            f'<path fill="none" stroke="{contorno}" stroke-width="1" d="{GO_D}"/></svg>')


def logo(h):
    p = svg_text("v4-lockup-white.svg").split('fill="#FFFFFF"')  # Rolê branco + Go ciano
    s = p[0] + 'fill="#FFFFFF"' + p[1] + f'fill="{CIANO}"' + p[2]
    return f'<img src="{dados(s.encode(), "image/svg+xml")}" style="height:{h}px;display:block">'


def arcos(w, canto="dir"):
    """Três arcos de canto: o arco da arte, triplicado."""
    esp = "" if canto == "dir" else "transform:scaleX(-1);"
    pos = "right:0;" if canto == "dir" else "left:0;"
    a = "".join(f'<path d="M{x} 0C{x + (100 - x) * .42:.0f} {y * .18:.0f} {x + (100 - x) * .8:.0f} {y * .55:.0f} 100 {y}" fill="none" stroke="{c}" stroke-width="2" stroke-linecap="round"/>'
                for x, y, c in ((8, 84, LIMA), (30, 62, CIANO), (52, 40, MAGENTA)))
    return f'<svg viewBox="0 0 100 90" width="{w}" style="position:absolute;top:0;{pos}{esp}">{a}</svg>'


# ---------------------------------------------------------------- fotos
_P3 = Image.open(os.path.join(MARCA, "criativos", "img", "multidao-2.png")).info.get("icc_profile")
MAPA = [(0, "#04000B"), (55, "#1A0B55"), (105, ANIL), (150, VIOLETA), (200, MAGENTA), (232, "#FF9BE9"), (255, "#EFFFFF")]


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


def foto(caminho, w=900, fade=None):
    """fade=(eixo, de, ate): transparência assada na imagem, 0 em `de` e 100% em `ate` (frações do eixo "x" ou "y").
    Máscara CSS deixa uma costura no PDF do Chrome."""
    # fotos de festa recebem o mapa de luz da mistura; os recortes da multidão ficam nas cores originais da arte
    im = Image.open(os.path.join(MARCA, caminho)).convert("RGB")
    recorte = caminho.startswith("logo-v4/")
    if recorte and _P3:
        im = ImageCms.profileToProfile(im, ImageCms.ImageCmsProfile(io.BytesIO(_P3)), ImageCms.createProfile("sRGB"), outputMode="RGB")
    if im.width != w and (im.width > w or recorte):
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    if not recorte:
        g = ImageOps.autocontrast(im.convert("L"), cutoff=1)
        t = _lut(MAPA)
        im = Image.merge("RGB", [g.point(t[i * 256:(i + 1) * 256]) for i in range(3)])
    b = io.BytesIO()
    if fade:
        eixo, de, ate = fade
        n = im.width if eixo == "x" else im.height
        linha = Image.new("L", (n, 1))
        linha.putdata([round(255 * max(0, min(1, (i / (n - 1) - de) / (ate - de)))) for i in range(n)])
        alfa = linha.resize(im.size) if eixo == "x" else linha.transpose(Image.ROTATE_270).resize(im.size)
        im.putalpha(alfa)
        im.save(b, "PNG", optimize=True)
        return dados(b.getvalue(), "image/png")
    im.save(b, "JPEG", quality=84, optimize=True)
    return dados(b.getvalue(), "image/jpeg")


def multidao(n=2, w=1400, fade=None):
    return foto(f"logo-v4/foto-multidao-{n}.jpg", w, fade)


def festa(nome, w=900):
    return foto(f"fotos-festa/{nome}.jpg", w)


def facho(op=.55, cor="104,226,227", em="0% 22%"):
    return f'<div class="ab" style="inset:0;mix-blend-mode:screen;background:radial-gradient(ellipse 48% 34% at {em},rgba({cor},{op}),rgba({cor},0) 100%)"></div>'


def galera(h, n=2, op=1):
    """Multidão subindo do rodapé de uma superfície em degradê."""
    return f'<div class="ab" style="left:0;right:0;bottom:0;height:{h}px;opacity:{op};background:url({multidao(n, 1000, ("y", 0, .55))}) center top/cover"></div>'


# ---------------------------------------------------------------- texto
def pp(t, tam, cor="#FFFFFF", lh=.95):
    return f'<span class="pp" style="font-size:{tam}px;color:{cor};line-height:{lh}">{t}</span>'


def pn(t, tam, cor=LIMA):
    return f'<span class="pn" style="font-size:{tam}px;color:{cor}">{t}</span>'


def kk(t, tam, bg=CIANO, fg="#000"):
    """Chip em caixa alta condensada."""
    return f'<span class="kk" style="font-size:{tam}px;background:{bg};color:{fg};padding:{tam * .32:.0f}px {tam * .85:.0f}px">{t}</span>'


def pill(t, tam, bg=BOTAO, fg="#FFFFFF"):
    return f'<span class="pill" style="font-size:{tam}px;background:{bg};color:{fg};padding:{tam * .55:.0f}px {tam * 1.35:.0f}px">{t}</span>'


def cor(t, c):
    return f'<span style="color:{c}">{t}</span>'


def avatares(d, borda="#000"):
    return "".join(f'<i style="display:inline-block;width:{d}px;height:{d}px;border-radius:50%;background:{c};border:{max(2, d // 11)}px solid {borda};margin-right:-{d // 3}px"></i>'
                   for c in (LIMA, CIANO, ANIL, MAGENTA, PESSEGO))


TIPOS = """@import url('https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@1,90,900&family=Permanent+Marker&family=Poppins:ital,wght@0,400;0,500;0,600;0,700;0,800;1,700;1,800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}body{font-family:Poppins,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;-webkit-font-smoothing:antialiased}
.ab{position:absolute}
.pp{display:inline-block;font-weight:800;font-style:italic;letter-spacing:-.035em;white-space:nowrap}
.pn{display:inline-block;font-family:'Permanent Marker',cursive;line-height:1;transform:rotate(-6deg) skewX(-10deg);white-space:nowrap}
.kk{display:inline-block;font-family:Archivo,sans-serif;font-weight:900;font-style:italic;font-stretch:90%;text-transform:uppercase;letter-spacing:.03em;line-height:1;border-radius:99px;white-space:nowrap}
.pill{display:inline-block;border-radius:99px;font-weight:800;font-style:italic;line-height:1.1;white-space:nowrap}
"""

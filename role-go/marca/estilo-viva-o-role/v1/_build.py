#!/usr/bin/env python3
"""RolêGo · AMOSTRA do estilo "Viva o rolê" (../../image.png) sobre a identidade final v2.
Uma paleta só, unindo as cores da imagem (lima, magenta, violeta, pêssego) com as de ../cores-escolhidas
(ciano, roxo, rosa). Gera lettering/*.svg, o HTML e o PDF (A4 paisagem). Precisa de Pillow e do Chrome.
Rodar: python3 _build.py"""
import base64, io, os, sys

OUT = os.path.dirname(os.path.abspath(__file__))
MARCA = os.path.normpath(os.path.join(OUT, "..", ".."))
sys.path.insert(0, os.path.join(MARCA, "identidade-v5-gomosa"))
sys.path.insert(0, os.path.join(OUT, "lettering"))
from _common import pdf, shoot, svg_text, uri  # noqa: E402
from _tracos import ROLE_D, VIVA_D  # noqa: E402
from PIL import Image, ImageCms, ImageOps  # noqa: E402

NOME = "amostra-estilo-viva-o-role"
LIMA, CIANO, ROXO, ROSA = "#D6E905", "#68E2E3", "#6D34CC", "#CB4C7B"
MAGENTA, VIOLETA, PESSEGO = "#F60CED", "#AB05EA", "#FA9B56"
M = dict(pincel=LIMA, detalhe=CIANO, risco=(PESSEGO, ROSA, MAGENTA, VIOLETA, ROXO),
         botao=f"linear-gradient(90deg,{VIOLETA},{ROXO})", botao_txt="#FFFFFF",
         foto=[(0, "#04000B"), (65, "#220A4E"), (125, ROXO), (170, VIOLETA), (215, "#F63BE4"), (255, "#FFE0F8")])
# nome, hex, origem, papel
CORES = [("Lima", LIMA, "imagem", "o pincel: “Rolê” e a palavra da peça"), ("Ciano", CIANO, "escolhidas", "Go do logo, arco, data e contagem"),
         ("Roxo", ROXO, "escolhidas", "botão e luz das fotos"), ("Violeta", VIOLETA, "imagem", "botão e luz das fotos"),
         ("Magenta", MAGENTA, "imagem", "luz das fotos e risco"), ("Rosa", ROSA, "escolhidas", "só no risco"), ("Pêssego", PESSEGO, "imagem", "só no início do risco"),
         ("Preto", "#000000", "base", "fundo"), ("Branco", "#FFFFFF", "base", "título e texto")]


def dados(raw, mime):
    return f"data:{mime};base64," + base64.b64encode(raw).decode()


# ---------------------------------------------------------------- lettering
def risco(v, gid):
    n = len(v["risco"]) - 1
    stops = "".join(f'<stop offset="{i / n:.2f}" stop-color="{c}"/>' for i, c in enumerate(v["risco"]))
    return (f'<defs><linearGradient id="{gid}" gradientUnits="userSpaceOnUse" x1="362" y1="0" x2="668" y2="0">{stops}</linearGradient></defs>'
            f'<path fill="url(#{gid})" d="M362 693C430 662 540 628 664 598C672 598 670 605 660 608C562 640 468 674 380 706C366 711 352 701 362 693Z"/>')


_g = [0]


def letras(v, w, viva="#FFFFFF", com_viva=True, com_risco=True):
    """“VIVA O ROLÊ” vetorial. com_viva=False deixa só o ROLÊ em pincel."""
    _g[0] += 1
    x0, y0, x1, y1 = (96, 308, 680, 716) if com_viva else (96, 390, 680, 716)
    corpo = f'<path fill="{viva}" fill-rule="evenodd" d="{VIVA_D}"/>' if com_viva else ""
    corpo += f'<path fill="{v["pincel"]}" fill-rule="evenodd" d="{ROLE_D}"/>' + (risco(v, f"r{_g[0]}") if com_risco else "")
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} {y0} {x1 - x0} {y1 - y0}" width="{w}" height="{w * (y1 - y0) / (x1 - x0):.0f}" style="display:block">{corpo}</svg>')


def arco(v, w=110):
    return f'<svg viewBox="0 0 100 70" width="{w}" style="position:absolute;right:0;top:0"><path d="M6 0C40 8 76 28 100 62" fill="none" stroke="{v["detalhe"]}" stroke-width="2.4" stroke-linecap="round"/></svg>'


def logo(v, h):
    partes = svg_text("v4-lockup-white.svg").split('fill="#FFFFFF"')  # Rolê branco + Go ciano
    svg = partes[0] + 'fill="#FFFFFF"' + partes[1] + f'fill="{CIANO}"' + partes[2]
    return f'<img src="{dados(svg.encode(), "image/svg+xml")}" style="height:{h}px;display:block">'


# ---------------------------------------------------------------- fotos (mapa de degradê = luz de palco do estilo)
_P3 = Image.open(os.path.join(MARCA, "criativos", "img", "multidao-2.png")).info.get("icc_profile")


def lut(stops):
    t = []
    for canal in range(3):
        for x in range(256):
            for (a, ca), (b, cb) in zip(stops, stops[1:]):
                if a <= x <= b:
                    va, vb = int(ca[1 + 2 * canal:3 + 2 * canal], 16), int(cb[1 + 2 * canal:3 + 2 * canal], 16)
                    t.append(round(va + (vb - va) * (x - a) / (b - a)))
                    break
    return t


def foto(v, caminho, w=900):
    im = Image.open(os.path.join(MARCA, caminho)).convert("RGB")
    recorte = caminho.startswith("logo-v4/")  # recortes da arte original: pixels em Display P3
    if recorte and _P3:
        im = ImageCms.profileToProfile(im, ImageCms.ImageCmsProfile(io.BytesIO(_P3)), ImageCms.createProfile("sRGB"), outputMode="RGB")
    if im.width != w and (im.width > w or recorte):
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    g = ImageOps.autocontrast(im.convert("L"), cutoff=1)
    im = Image.merge("RGB", [g.point(lut(v["foto"])[i * 256:(i + 1) * 256]) for i in range(3)])
    b = io.BytesIO()
    im.save(b, "JPEG", quality=84, optimize=True)
    return dados(b.getvalue(), "image/jpeg")


def multidao(v, n=2, w=1400):
    return foto(v, f"logo-v4/foto-multidao-{n}.jpg", w)


def facho(op=.5):
    """Feixe de luz ciano vindo da esquerda, como na arte original."""
    return f'<div class="ft" style="inset:0;mix-blend-mode:screen;background:radial-gradient(ellipse 46% 34% at 0% 26%,rgba(104,226,227,{op}),rgba(104,226,227,0) 100%)"></div>'


def ci(t):
    return f'<span style="color:{CIANO}">{t}</span>'


def pinc(v, texto, tam):
    return f'<span class="pn" style="color:{v["pincel"]};font-size:{tam}px">{texto}</span>'


def tit(texto, tam):
    return f'<span class="tt" style="font-size:{tam}px">{texto}</span>'


def traco(v, w):
    _g[0] += 1
    return f'<svg viewBox="354 592 322 124" width="{w}" height="{w * 124 / 322:.0f}" style="display:block">{risco(v, f"t{_g[0]}")}</svg>'


def pill(v, t):
    return f'<span class="pill" style="background:{v["botao"]};color:{v["botao_txt"]}">{t}</span>'


def rodape(n, extra=""):
    return f'<div class="foot"><span>RolêGo · amostra do estilo “Viva o rolê” · {extra}</span><span>{n}</span></div>'


# ---------------------------------------------------------------- páginas
def capa(v, n):
    return (f'<section class="page" style="padding:0">'
            f'<div class="ft" style="left:0;right:0;top:0;height:600px;background-image:url({multidao(v)});background-size:cover;background-position:center top"></div>{facho()}'
            f'<div class="ft" style="inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 34%,rgba(0,0,0,.82) 62%,#000 76%)"></div>{arco(v, 190)}'
            f'<div style="position:absolute;left:56px;top:44px">{logo(v, 38)}</div>'
            f'<div style="position:absolute;left:50%;bottom:62px;transform:translateX(-50%)">{letras(v, 700)}</div>'
            f'{rodape(n, "capa")}</section>')


def pecas(v, n):
    quad = (f'<div class="pc" style="width:392px;height:392px"><div class="ft" style="left:0;right:0;top:0;height:300px;background:url({multidao(v, 2, 1000)}) center top/cover"></div>{facho()}'
            f'<div class="ft" style="inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 30%,#000 74%)"></div>{arco(v, 90)}'
            f'<div style="position:absolute;left:26px;bottom:18px">{letras(v, 340)}</div></div>')
    evento = (f'<div class="pc" style="width:340px;height:425px;background:url({foto(v, "fotos-festa/neon-hexagono-roxo.jpg", 700)}) center top/cover">'
              f'<div class="ft" style="inset:0;background:linear-gradient(180deg,rgba(0,0,0,.15) 20%,rgba(0,0,0,.9) 66%,#000)"></div>{arco(v, 80)}'
              f'<div style="position:absolute;left:20px;top:18px">{logo(v, 20)}</div>'
              f'<div style="position:absolute;left:22px;right:16px;bottom:20px">{tit("SEXTA TEM", 46)}<div style="margin:-2px 0 -4px 4px">{pinc(v, "SAMBA", 86)}</div>'
              f'<div style="margin:-6px 0 6px 64px">{traco(v, 170)}</div><div class="inf">Largo da Batata · {ci("21h")} · grátis · 600 m</div>'
              f'<div style="margin-top:10px">{pill(v, "Bora? " + ci("32 vão"))}</div></div></div>')
    story = (f'<div class="pc" style="width:240px;height:427px;background:url({foto(v, "fotos-festa/mao-pra-cima.jpg", 700)}) center/cover">'
             f'<div class="ft" style="inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,0) 30%,rgba(0,0,0,.92) 70%,#000)"></div>'
             f'<div style="position:absolute;left:16px;top:16px">{logo(v, 16)}</div>'
             f'<div style="position:absolute;left:16px;right:12px;bottom:70px;transform:rotate(-5deg)">{tit("QUAL O SEU", 34)}<div style="margin-top:6px">{letras(v, 206, com_viva=False)}</div></div>'
             f'<div style="position:absolute;left:16px;right:16px;bottom:20px;text-align:center">{pill(v, "Ver rolês perto de mim")}</div></div>')
    banner = (f'<div class="pc" style="width:660px;height:196px"><div class="ft" style="inset:0;background:url({multidao(v, 1, 1400)}) center/cover"></div>'
              f'<div class="ft" style="inset:0;background:linear-gradient(90deg,#000 8%,rgba(0,0,0,.55) 48%,rgba(0,0,0,.05))"></div>'
              f'<div style="position:absolute;left:24px;top:14px">{letras(v, 224)}</div>'
              f'<div style="position:absolute;right:22px;bottom:18px;display:flex;gap:14px;align-items:center">{logo(v, 24)}{pill(v, "Baixar o app")}</div></div>')
    ingresso = (f'<div class="pc" style="width:340px;height:196px;background:#000;box-shadow:inset 0 0 0 1px #26262E">'
                f'<div class="ft" style="left:0;top:0;bottom:0;width:128px;background:url({foto(v, "fotos-festa/show-de-costas.jpg", 700)}) 30% center/cover"></div>'
                f'<div class="ft" style="left:60px;top:0;bottom:0;width:70px;background:linear-gradient(90deg,rgba(0,0,0,0),#000)"></div>'
                f'<div style="position:absolute;left:142px;top:16px;right:12px">{logo(v, 15)}<div style="margin-top:14px">{tit("BAILE DA", 30)}<div style="margin-top:-6px">{pinc(v, "LAJE", 52)}</div></div>'
                f'<div class="inf" style="font-size:9px;margin-top:6px">{ci("SÁB 28/11 · 23h")} · Vila Madalena</div><div style="margin-top:6px">{pill(v, "R$ 40 · 1 entrada")}</div></div></div>')
    cap = lambda box, t: f'<div>{box}<div class="cap">{t}</div></div>'
    return (f'<section class="page"><div class="eyebrow">Amostra</div><h2>Peças no estilo</h2>'
            f'<div style="display:flex;gap:15px;align-items:flex-start">{cap(quad, "Peça-mãe · feed 1:1")}{cap(evento, "Evento · feed 4:5")}{cap(story, "Story 9:16")}</div>'
            f'<div style="display:flex;gap:15px;margin-top:2px">{cap(banner, "Banner de site e telão")}{cap(ingresso, "Ingresso")}</div>{rodape(n, "peças")}</section>')


def elementos(n):
    sw = "".join(f'<div><i style="background:{h}"></i><b>{nm}</b><code>{h}</code><em>{o}</em><span>{u}</span></div>' for nm, h, o, u in CORES)
    seg = lambda f, bg, fg, t: f'<div style="flex:{f};background:{bg};color:{fg}">{t}</div>'
    prop = (seg(52, "#000", "#fff", "52 preto") + seg(28, f"linear-gradient(90deg,{ROXO},{VIOLETA},{MAGENTA})", "#fff", "28 luz: roxo, violeta, magenta")
            + seg(11, "#fff", "#000", "11 branco") + seg(6, LIMA, "#000", "6 lima") + seg(2.4, CIANO, "#000", "") + seg(.6, f"linear-gradient(90deg,{PESSEGO},{ROSA})", "#000", ""))
    tipos = [(tit("VIVA O", 40), "Título", "Archivo 900 itálico, caixa alta, levemente girado"), (pinc(M, "ROLÊ · LAJE", 34), "Pincel", "“Rolê” é o desenho vetorial; outras palavras em Permanent Marker. Uma por peça, em lima"),
             (f'<span style="font-size:15px">Largo da Batata · {ci("21h")}</span>', "Texto", "Poppins, como na v2; o dado que importa em ciano")]
    tp = "".join(f'<div class="tp"><div class="ex">{e}</div><b>{a}</b><span>{b}</span></div>' for e, a, b in tipos)
    regras = [("Dois destaques, cada um no seu lugar", "lima é o pincel; ciano é o logo, o arco e o dado."), ("Degradê", "no risco, no botão, na superfície roxa e na luz das fotos."),
              ("Rosa e pêssego", "só no começo do risco, nunca em fundo."), ("Foto", "multidão, mãos pra cima, silhueta e fumaça, com um feixe ciano."), ("Logo", "a gomosa: Rolê branco + Go ciano.")]
    rg = "".join(f"<li><b>{a}:</b> {b}</li>" for a, b in regras)
    fts = "".join(f'<div style="background-image:url({u})">{facho(.45)}</div>' for u in (multidao(M, 2, 600), foto(M, "fotos-festa/show-de-costas.jpg", 600)))
    return (f'<section class="page"><div class="eyebrow">Elementos</div><h2>Uma paleta só, com as cores dos dois</h2>'
            f'<div class="sw">{sw}</div><div><div class="sub" style="margin:2px 0 5px">Proporção numa peça</div><div class="prop">{prop}</div></div>'
            f'<div style="display:grid;grid-template-columns:360px 1fr;gap:16px"><div class="col"><div class="lt">{letras(M, 300)}</div></div><div class="fts">{fts}</div></div>'
            f'<div style="display:grid;grid-template-columns:1.5fr 1fr;gap:22px"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">{tp}</div><ul>{rg}</ul></div>{rodape(n, "elementos")}</section>')


CSS = """@import url('https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@1,90,900&family=Permanent+Marker&family=Poppins:ital,wght@0,400;0,600;0,700;0,800;1,700;1,800&display=swap');
@page{size:297mm 210mm;margin:0}*{box-sizing:border-box;margin:0;padding:0}body{font-family:Poppins,sans-serif;background:#222;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:297mm;height:210mm;padding:30px 42px;position:relative;overflow:hidden;page-break-after:always;display:flex;flex-direction:column;gap:10px;background:#09090C;color:#fff}
.eyebrow{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#9CA3AF}h2{font:italic 900 28px/1 Archivo,sans-serif;font-stretch:90%;text-transform:uppercase}
.foot{position:absolute;left:42px;right:42px;bottom:14px;display:flex;justify-content:space-between;font-size:8.5px;color:#7C8090;z-index:5}
.ft{position:absolute}.pc{position:relative;overflow:hidden;border-radius:16px;background-color:#000;flex-shrink:0}
.cap{font-size:9px;color:#9CA3AF;margin-top:4px}
.tt{display:inline-block;font-family:Archivo,sans-serif;font-style:italic;font-weight:900;font-stretch:90%;line-height:.95;text-transform:uppercase;letter-spacing:-.01em;white-space:nowrap}
.pn{display:inline-block;font-family:'Permanent Marker',cursive;line-height:1;transform:rotate(-7deg) skewX(-10deg);white-space:nowrap}
.inf{font-size:10.5px;font-weight:600;color:#E4E4EA}
.pill{display:inline-block;border-radius:99px;padding:7px 16px;font-size:10px;font-weight:800;font-style:italic;white-space:nowrap}
.col{background:#000;border-radius:16px;padding:12px 16px;display:flex;align-items:center;justify-content:center}.sub{font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#9CA3AF}
.lt{display:flex;justify-content:center}
.sw{display:grid;grid-template-columns:repeat(9,1fr);gap:8px}.sw em{display:block;font-size:7px;font-style:normal;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#C9CDD6;margin:2px 0 1px}.sw i{display:block;height:64px;border-radius:8px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}.sw b{display:block;font-size:9px;margin-top:3px}.sw code{display:block;font:8px ui-monospace,Menlo,monospace;color:#9CA3AF}.sw span{display:block;font-size:7.5px;color:#7C8090;line-height:1.25}
.fts{display:grid;grid-template-columns:1fr 1fr;gap:8px}.prop{display:flex;height:30px;border-radius:8px;overflow:hidden;box-shadow:inset 0 0 0 1px #26262E}.prop div{display:flex;align-items:center;padding-left:8px;font-size:9px;font-weight:700;white-space:nowrap}.prop div:empty{padding:0}
.fts div{position:relative;overflow:hidden;min-height:190px;border-radius:10px;background-size:cover;background-position:center}
.tp{background:#000;border-radius:12px;padding:10px 12px}.tp .ex{height:58px;display:flex;align-items:center}.tp b{display:block;font-size:10.5px}.tp>span{display:block;font-size:9px;color:#9CA3AF;line-height:1.4}
.page.claro{background:#F4F4F8;color:#05070F}.claro .eyebrow{color:#5B6070}
.pg{display:grid;grid-template-columns:repeat(3,304px);gap:8px 20px;justify-content:center}.pg img{display:block;width:304px;height:304px;border-radius:14px}.pg span{display:block;font-size:9px;font-weight:700;color:#5B6070;letter-spacing:.05em;text-transform:uppercase;margin-top:5px}
ul{list-style:none;display:flex;flex-direction:column;gap:5px;font-size:9.8px;line-height:1.4;color:#C9CDD6}ul b{color:#fff}"""

exec(compile(open(os.path.join(OUT, "_posts.py")).read(), "_posts.py", "exec"))
gerar_posts()

# lettering como arquivos
for nome, kw in (("viva-o-role", {}), ("role", {"com_viva": False})):
    open(os.path.join(OUT, "lettering", f"{nome}.svg"), "w").write(letras(M, 900, **kw))

paginas = [capa(M, 1), pecas(M, 2), elementos(3), pg_posts(4)]
html = f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>RolêGo — amostra do estilo Viva o rolê</title><style>{CSS}</style></head><body>{"".join(paginas)}</body></html>'
out_html = os.path.join(OUT, NOME + ".html")
open(out_html, "w").write(html)
pdf(out_html, os.path.join(OUT, NOME + ".pdf"))
print("ok", len(paginas), "págs")

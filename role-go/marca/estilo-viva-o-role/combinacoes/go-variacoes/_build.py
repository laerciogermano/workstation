#!/usr/bin/env python3
"""RolêGo · mais variações: o "Go" em 24 cores e acabamentos (G01–G24) e 16 combinações completas (25–40)
em que o Go tem cor própria. O desenho da logo não muda. Reaproveita ../_build.py (paletas) e ../../_posts.py.
Saídas: go/ e combos/ (PNG 1080 × 1080), variacoes-do-go.pdf e .html.
Rodar: python3 -B _build.py [--so-pdf]"""
import base64, importlib.util, io, os, re, shutil, sys
from concurrent.futures import ThreadPoolExecutor

AQUI = os.path.dirname(os.path.abspath(__file__))
_s = importlib.util.spec_from_file_location("combos", os.path.join(AQUI, "..", "_build.py"))
C = importlib.util.module_from_spec(_s)
_s.loader.exec_module(C)
from _common import contrast, pdf, shoot, svg_text  # noqa: E402  (caminho incluído por ../_build.py)
from PIL import Image  # noqa: E402

NOME = "variacoes-do-go"
NOITE = "#160A33"
FONTES = os.path.join(AQUI, "_src")

# ---------------------------------------------------------------- o Go
cor = lambda a: ("cor", [a])
grad = lambda *a: ("grad", list(a))
GOS = [  # código, nome, (acabamento, cores)
    ("azul", "Azul (atual)", cor("#68E2E3")), ("azul-vivo", "Azul vivo", cor("#3DD6FF")), ("ciano", "Ciano v2", cor("#00E5E5")),
    ("limao", "Amarelo limão", cor("#D6E905")), ("ouro", "Amarelo ouro", cor("#FFD60A")), ("rosa-claro", "Rosa claro", cor("#FF9BD5")),
    ("rosa-choque", "Rosa choque", cor("#EA3D7A")), ("magenta", "Magenta", cor("#F60CED")), ("coral", "Coral", cor("#FF8A7A")),
    ("pessego", "Pêssego", cor("#FA9B56")), ("menta", "Menta", cor("#6CF2B0")), ("lilas", "Lilás", cor("#CDBBFF")),
    ("grad-azul-violeta", "Degradê azul → violeta", grad("#68E2E3", "#6A86EC", "#C24BFF")),
    ("grad-azul-menta", "Degradê azul → menta", grad("#3DD6FF", "#6CF2B0")),
    ("grad-limao-azul", "Degradê limão → azul", grad("#D6E905", "#68E2E3")),
    ("grad-ouro-coral", "Degradê ouro → coral", grad("#FFD60A", "#FF6F61")),
    ("grad-rosa-ouro", "Degradê rosa → ouro", grad("#FF5FB7", "#FFD60A")),
    ("grad-por-do-sol", "Degradê pôr do sol", grad("#F60CED", "#FF4D6A", "#FA9B56", "#FFD60A")),
    ("duas-cores", "Duas cores", ("duas", ["#68E2E3", "#D6E905"])),
    ("contorno", "Contorno azul", ("contorno", ["#68E2E3"])),
    ("adesivo", "Adesivo com sombra", ("adesivo", ["#D6E905", "#68E2E3"])),
    ("capsula-azul", "Cápsula azul", ("capsula", ["#68E2E3", NOITE])),
    ("capsula-amarela", "Cápsula amarela", ("capsula", ["#D6E905", NOITE])),
    ("neon", "Brilho neon", ("neon", ["#8CFBFF", "#00E5E5"])),
]
GO = {g[0]: g for g in GOS}


def paths(arq):
    return re.findall(r' d="([^"]+)"', svg_text(arq))


def caixa(d):
    """Caixa aproximada do path (inclui pontos de controle)."""
    xs, ys, cmd, nums = [], [], None, []
    for tk in re.findall(r"[A-Za-z]|-?\d+(?:\.\d+)?", d) + ["Z"]:
        if tk.isalpha():
            if cmd == "H":
                xs += nums
            elif cmd == "V":
                ys += nums
            else:
                xs += nums[0::2]
                ys += nums[1::2]
            cmd, nums = tk, []
        else:
            nums.append(float(tk))
    return min(xs), min(ys), max(xs), max(ys)


def desenho(d, spec):
    """Elementos SVG do Go conforme o acabamento. Devolve (defs, corpo, caixa ocupada)."""
    tipo, c = spec
    x0, y0, x1, y1 = caixa(d)
    w, h = x1 - x0, y1 - y0
    p = lambda fill, extra="": f'<path d="{d}" fill="{fill}" fill-rule="evenodd" {extra}/>'
    if tipo == "cor":
        return "", p(c[0]), (x0, y0, x1, y1)
    if tipo in ("grad", "duas"):
        if tipo == "grad":
            st = "".join(f'<stop offset="{i / (len(c) - 1):.3f}" stop-color="{k}"/>' for i, k in enumerate(c))
        else:
            st = f'<stop offset=".53" stop-color="{c[0]}"/><stop offset=".53" stop-color="{c[1]}"/>'
        return f'<linearGradient id="g" gradientUnits="userSpaceOnUse" x1="{x0}" y1="0" x2="{x1}" y2="0">{st}</linearGradient>', p("url(#g)"), (x0, y0, x1, y1)
    if tipo == "contorno":
        # o traço fica por dentro do desenho (recorte pelo próprio path)
        esp = h * .15
        return f'<clipPath id="k"><path d="{d}" clip-rule="evenodd"/></clipPath>', p("none", f'stroke="{c[0]}" stroke-width="{esp:.1f}" clip-path="url(#k)"'), (x0, y0, x1, y1)
    if tipo == "adesivo":
        o = h * .085
        return "", f'<g transform="translate({o:.1f} {o:.1f})">{p(c[1])}</g>{p(c[0])}', (x0, y0, x1 + o, y1 + o)
    if tipo == "capsula":
        mx, my = h * .2, h * .22
        r = (h + 2 * my) / 2
        ret = f'<rect x="{x0 - mx * .55:.1f}" y="{y0 - my:.1f}" width="{w + mx * 1.55:.1f}" height="{h + 2 * my:.1f}" rx="{r:.1f}" fill="{c[0]}"/>'
        miolo = f'<g transform="translate({mx * .22:.1f} 0) translate({x0 + w / 2:.1f} {y0 + h / 2:.1f}) scale(.88) translate({-x0 - w / 2:.1f} {-y0 - h / 2:.1f})">{p(c[1])}</g>'
        return "", ret + miolo, (x0 - mx * .55, y0 - my, x0 + w + mx, y1 + my)
    # neon
    s = h * .07
    defs = f'<filter id="n" x="-40%" y="-60%" width="180%" height="220%"><feGaussianBlur stdDeviation="{s:.1f}"/></filter>'
    return defs, p(c[1], 'filter="url(#n)"') + p(c[1], 'filter="url(#n)"') + p(c[0]), (x0 - 2.5 * s, y0 - 2.5 * s, x1 + 2.5 * s, y1 + 2.5 * s)


def _img(svg, estilo):
    return f'<img src="data:image/svg+xml;base64,{base64.b64encode(svg.encode()).decode()}" style="{estilo}">'


def logo_go(h, role, spec):
    """Lockup com a letra na mesma altura da logo original; o Go pode ocupar mais espaço (cápsula, sombra, brilho)."""
    rolê, d = paths("v4-lockup-white.svg")
    defs, corpo, (bx0, by0, bx1, by1) = desenho(d, spec)
    vx0, vy0, vx1, vy1 = min(0, bx0), min(0, by0), max(989, bx1), max(256, by1)
    vw, vh = vx1 - vx0, vy1 - vy0
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vx0:.1f} {vy0:.1f} {vw:.1f} {vh:.1f}" width="{vw:.0f}" height="{vh:.0f}">'
           f'<defs>{defs}</defs><path d="{rolê}" fill="{role}" fill-rule="evenodd"/>{corpo}</svg>')
    k = h / 256
    return _img(svg, f"width:{vw * k:.1f}px;height:{vh * k:.1f}px;display:block;margin:{vy0 * k:.1f}px 0 {(256 - vy1) * k:.1f}px {vx0 * k:.1f}px")


def simbolo(h, spec, extra=""):
    d = paths("v4-go-white.svg")[0]
    defs, corpo, (bx0, by0, bx1, by1) = desenho(d, spec)
    vx0, vy0, vx1, vy1 = min(0, bx0), min(0, by0), max(256, bx1), max(256, by1)
    vw, vh = vx1 - vx0, vy1 - vy0
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vx0:.1f} {vy0:.1f} {vw:.1f} {vh:.1f}" width="{vw:.0f}" height="{vh:.0f}"><defs>{defs}</defs>{corpo}</svg>'
    return _img(svg, f"width:{vw * h / 256:.1f}px;height:{vh * h / 256:.1f}px;display:block;{extra}")


# ---------------------------------------------------------------- combinações com Go próprio
# slug, nome, ideia, botão, fundo, fundo 2, pincel, Go
NOVAS = [
    ("go-limao", "Go no amarelo", "O trio atual, com o Go na cor do pincel.", "#68E2E3", "#6D34CC", "#AB05EA", "#D6E905", "limao"),
    ("go-rosa", "Go rosa", "Entra o rosa só na logo.", "#68E2E3", "#6D34CC", "#AB05EA", "#D6E905", "rosa-claro"),
    ("ouro-total", "Azul vivo, Go ouro", "A 13 com a logo puxando pro ouro.", "#3DD6FF", "#5B2BD9", "#8A2BE2", "#FFD60A", "ouro"),
    ("ouro-lilas", "Azul vivo, Go lilás", "A 13 com a logo mais discreta.", "#3DD6FF", "#5B2BD9", "#8A2BE2", "#FFD60A", "lilas"),
    ("botao-ouro", "Botão ouro, Go ouro", "Ouro no botão e na logo; azul no pincel.", "#FFD60A", "#5B2BD9", "#8A2BE2", "#68E2E3", "ouro"),
    ("uva-rosa", "Uva, rosa e ouro", "Botão rosa, pincel azul, Go ouro.", "#FF7AC3", "#3D1567", "#7437E0", "#68E2E3", "ouro"),
    ("meia-noite", "Meia-noite", "Azul fechado com Go rosa.", "#FFD60A", "#17246E", "#3B2FB0", "#5FE0FF", "rosa-claro"),
    ("menta", "Roxo e menta", "Menta no botão e no Go, ouro no pincel.", "#6CF2B0", "#5B2BD9", "#3B1E8F", "#FFD60A", "menta"),
    ("coral", "Índigo e coral", "O coral aparece só no Go.", "#5FE0FF", "#3730A3", "#6D28D9", "#FFD60A", "coral"),
    ("magenta", "Go magenta", "Fundo escuro para o magenta aparecer.", "#68E2E3", "#2E1065", "#5B21B6", "#D6E905", "magenta"),
    ("vinho", "Vinho e ouro", "Quente, com a logo em azul.", "#FFD60A", "#7B1245", "#4A1070", "#FF9BD5", "azul"),
    ("royal-ouro", "Royal e ouro", "Fundo azul, botão e Go ouro.", "#FFD60A", "#1D46C9", "#5B2BD9", "#8EE8FF", "ouro"),
    ("grad-rosa-ouro", "Go rosa → ouro", "Logo em degradê quente.", "#68E2E3", "#4B1D95", "#7E22CE", "#FFD60A", "grad-rosa-ouro"),
    ("grad-limao-azul", "Go limão → azul", "A logo junta as duas cores de destaque.", "#68E2E3", "#6D34CC", "#AB05EA", "#D6E905", "grad-limao-azul"),
    ("capsula", "Go em cápsula", "A logo vira quase um botão.", "#3DD6FF", "#5B2BD9", "#8A2BE2", "#D6E905", "capsula-amarela"),
    ("adesivo", "Go adesivo", "Sombra deslocada, jeito de sticker.", "#68E2E3", "#6D34CC", "#AB05EA", "#D6E905", "adesivo"),
]
BASE_ATUAL = C.COMBOS[0]  # paleta 01, usada para isolar a troca do Go


def ambiente(c, go_slug):
    ns = C.ambiente(c[:7])
    spec = GO[go_slug][2]
    botao, branco, simb = ns["AZUL"], ns["BRANCO"], ns["go"]
    ns["logo"] = lambda h, role=branco, go_=None: logo_go(h, role, spec)
    # o símbolo na cor de ação é o Go da marca; branco e roxo são marca-d'água e ficam como estão
    ns["go"] = lambda c_, h, extra="": simbolo(h, spec, extra) if c_ == botao else simb(c_, h, extra)
    return ns


def pasta_go(i, g):
    return os.path.join(AQUI, "go", f"G{i:02d}-{g[0]}")


def pasta_combo(i, c):
    return os.path.join(AQUI, "combos", f"{i:02d}-{c[0]}")


GO_POSTS = [("02-evento-foto", "Evento"), ("06-feature-match", "Feature")]


def gerar():
    os.makedirs(FONTES, exist_ok=True)
    tarefas = []

    def lote(ns, pasta, quais, prefixo):
        os.makedirs(pasta, exist_ok=True)
        for nome, _, fn in ns["POSTS"][:6]:
            if nome in quais:
                h = os.path.join(FONTES, f"{prefixo}-{nome}.html")
                open(h, "w").write(f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>{ns["PCSS"]}</style></head><body>{fn()}</body></html>')
                tarefas.append((h, os.path.join(pasta, nome + ".png")))

    for i, g in enumerate(GOS, 1):
        lote(ambiente(BASE_ATUAL, g[0]), pasta_go(i, g), [n for n, _ in GO_POSTS], f"G{i:02d}")
    for i, c in enumerate(NOVAS, 25):
        lote(ambiente(c, c[7]), pasta_combo(i, c), [n for n, _ in C.POSTS], f"{i:02d}")
        print("html", i, c[1], flush=True)
    with ThreadPoolExecutor(5) as ex:
        list(ex.map(lambda t: shoot(t[0], t[1], 1080, 1080), tarefas))
    shutil.rmtree(FONTES)
    print("ok", len(tarefas), "posts")


# ---------------------------------------------------------------- documento
def img(pasta, nome, w):
    im = Image.open(os.path.join(pasta, nome + ".png")).convert("RGB").resize((w, w), Image.LANCZOS)
    b = io.BytesIO()
    im.save(b, "JPEG", quality=86, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()


SUP = "linear-gradient(150deg,#AB05EA,#6D34CC)"


def rodape(n):
    return f'<div class="foot"><span>RolêGo · variações do Go e novas combinações · estilo “Viva o rolê”</span><span>{n}</span></div>'


def pag(n, titulo, sub, corpo, selo=""):
    s = f"<s>{selo}</s>" if selo else ""
    return f'<section class="page"><header><h2>{titulo}</h2><p>{s}{sub}</p></header>{corpo}{rodape(n)}</section>'


def todos_logos(n):
    cel = "".join(f'<div class="lg"><div><span style="background:#000">{logo_go(27, "#FFFFFF", g[2])}</span><span style="background:{SUP}">{logo_go(27, "#FFFFFF", g[2])}</span></div>'
                  f'<p><b>G{i:02d}</b> {g[1]}</p></div>' for i, g in enumerate(GOS, 1))
    return pag(n, "O Go: 24 versões", "No preto e no roxo. 01–12 cor chapada, 13–18 degradê, 19–24 acabamento.", f'<div class="logos">{cel}</div>')


def todos_icones(n):
    def icone(g):
        return f'<span style="background:#000">{simbolo(76, g[2])}</span><span style="background:{SUP}">{simbolo(76, g[2])}</span>'
    cel = "".join(f'<div class="ic"><div>{icone(g)}</div><p><b>G{i:02d}</b> {g[1]}</p></div>' for i, g in enumerate(GOS, 1))
    return pag(n, "O Go no ícone do app", "Como cada versão se comporta pequena, que é onde o Go aparece sozinho.", f'<div class="icones">{cel}</div>')


def detalhe_go(n, grupo):
    linhas = ""
    for i, g in grupo:
        sp = g[2]
        claro = logo_go(30, NOITE, sp)
        fundos = (("#000", logo_go(30, "#FFFFFF", sp), "preto"), (SUP, logo_go(30, "#FFFFFF", sp), "roxo"), ("#FFFFFF", claro, "claro"))
        lg = "".join(f'<div><span style="background:{bg}">{x}</span><small>{t}</small></div>' for bg, x, t in fundos)
        ap = f'<div class="app"><span style="background:#000">{simbolo(54, sp)}</span><span style="background:{SUP}">{simbolo(54, sp)}</span></div>'
        ps = "".join(f'<img src="{img(pasta_go(i, g), nome, 440)}">' for nome, _ in GO_POSTS)
        cods = " → ".join(sp[1])
        linhas += f'<div class="linha"><h3><u>G{i:02d}</u> {g[1]} <code>{cods}</code></h3><div class="itens">{lg}{ap}{ps}</div></div>'
    a, z = grupo[0][0], grupo[-1][0]
    return pag(n, f"Go {a:02d} a {z:02d}", "Cores da peça fixas na paleta atual; só o Go muda. No claro, cores claras perdem força.", linhas)


def comparativo(n, nome, titulo, sub):
    cel = "".join(f'<div class="cel"><img src="{img(pasta_combo(i, c), nome, 340)}"><div><b>{i:02d}</b><span>{c[1]}</span></div></div>' for i, c in enumerate(NOVAS, 25))
    return pag(n, titulo, sub, f'<div class="grade">{cel}</div>')


def combo(n, i, c):
    k = C.cores(c[:7])
    g = GO[c[7]]
    go_css = g[2][1][0] if len(g[2][1]) == 1 or g[2][0] in ("capsula", "neon") else f"linear-gradient(90deg,{','.join(g[2][1])})"
    itens = (("Botão", k["botao"], k["botao"]), ("Fundo", k["fundo"], k["fundo"]), ("Degradê", k["fundo2"], k["fundo2"]),
             ("Pincel", k["pincel"], k["pincel"]), (f"Go · {g[1].lower()}", go_css, " → ".join(g[2][1])), ("Texto escuro", k["noite"], k["noite"]))
    sw = "".join(f'<div class="sw"><i style="background:{bg}"></i><span><b>{t}</b><code>{h}</code></span></div>' for t, bg, h in itens)
    ps = "".join(f'<div><img src="{img(pasta_combo(i, c), nome, 640)}"><span>{t}</span></div>' for nome, t in C.POSTS)
    return pag(n, f"<u>{i:02d}</u>{c[1]}", c[2], f'<div class="sws">{sw}</div><div class="pg">{ps}</div>', "Go com cor própria")


CSS = """@import url('https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@1,90,900&family=Poppins:wght@400;500;600;700&display=swap');
@page{size:297mm 210mm;margin:0}*{box-sizing:border-box;margin:0;padding:0}body{font-family:Poppins,sans-serif;background:#555;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:297mm;height:210mm;padding:22px 38px 26px;position:relative;overflow:hidden;page-break-after:always;background:#F4F4F6;color:#111}
header{display:flex;justify-content:space-between;align-items:center;gap:20px;height:34px}h2{font:italic 900 24px/1 Archivo,sans-serif;font-stretch:90%;text-transform:uppercase}u{text-decoration:none;background:#111;color:#fff;border-radius:7px;padding:1px 8px 2px;margin-right:8px;display:inline-block}
header p{font-size:10.5px;color:#555}header s{text-decoration:none;font-weight:700;font-size:9px;border:1.5px solid #111;border-radius:99px;padding:1px 9px;margin-right:10px;color:#111}
.foot{position:absolute;left:38px;right:38px;bottom:9px;display:flex;justify-content:space-between;font-size:8.5px;color:#888}
.logos{display:grid;grid-template-columns:repeat(4,1fr);gap:7px 14px;margin-top:12px}.lg>div{display:grid;grid-template-columns:1fr 1fr;height:89px;border-radius:11px;overflow:hidden}.lg span,.ic span,.itens span{display:flex;align-items:center;justify-content:center}.lg p,.ic p{font-size:9px;margin-top:3px}
.icones{display:grid;grid-template-columns:repeat(6,1fr);gap:7px 18px;margin-top:9px}.ic>div{display:flex;flex-direction:column;gap:5px;align-items:center}.ic span{width:60px;height:60px;border-radius:15px}.ic span img{zoom:.66}.ic p{text-align:center;line-height:1.35;min-height:25px}.ic p b{display:block}
.linha{margin-top:11px}.linha h3{font-size:12px;display:flex;align-items:center;margin-bottom:5px}.linha h3 code{margin-left:auto;font:8.5px ui-monospace,Menlo,monospace;color:#666}.linha h3 u{font-size:10px}
.itens{display:flex;gap:9px;align-items:flex-start;justify-content:space-between}.itens>div>span{width:168px;height:192px;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.08)}.itens small{display:none}.itens .app{display:flex;flex-direction:column;gap:8px}.itens .app span{width:92px;height:92px;border-radius:22px}.itens>img{width:192px;height:192px;border-radius:12px}
.grade{display:grid;grid-template-columns:repeat(4,150px);justify-content:center;gap:6px 40px;margin-top:8px}.cel img{display:block;width:150px;height:150px;border-radius:9px}.cel>div{width:150px;display:flex;gap:5px;margin-top:3px;font-size:8px}.cel b{font-size:9px}.cel span{white-space:nowrap;overflow:hidden}
.sws{display:flex;align-items:center;gap:18px;height:36px;margin:6px 0 10px}.sw{display:flex;align-items:center;gap:7px}.sw i{display:block;width:30px;height:30px;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(0,0,0,.18)}.sw b{display:block;font-size:8.5px}.sw code{display:block;font:8px ui-monospace,Menlo,monospace;color:#555}
.pg{display:grid;grid-template-columns:repeat(3,306px);gap:8px 20px;justify-content:center}.pg img{display:block;width:306px;height:306px;border-radius:14px}.pg span{display:block;font-size:8px;font-weight:600;color:#666;text-transform:uppercase;letter-spacing:.05em;margin-top:2px}"""


def documento():
    pags = [todos_logos(1), todos_icones(2)]
    num = list(enumerate(GOS, 1))
    for j in range(0, len(num), 3):
        pags.append(detalhe_go(len(pags) + 1, num[j:j + 3]))
    for nome, titulo, sub in (("01-sexta-tem-role", "Combinações 25–40 · fundo colorido", "Aqui o Go tem cor própria, separada da cor do botão."),
                              ("02-evento-foto", "Combinações 25–40 · com foto", "Como a logo e o botão convivem sobre a foto.")):
        pags.append(comparativo(len(pags) + 1, nome, titulo, sub))
    for i, c in enumerate(NOVAS, 25):
        pags.append(combo(len(pags) + 1, i, c))
    html = f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>RolêGo — variações do Go</title><style>{CSS}</style></head><body>{"".join(pags)}</body></html>'
    out = os.path.join(AQUI, NOME + ".html")
    open(out, "w").write(html)
    pdf(out, os.path.join(AQUI, NOME + ".pdf"))
    print("ok", len(pags), "págs")


if __name__ == "__main__":
    if "--so-pdf" not in sys.argv:
        gerar()
    documento()

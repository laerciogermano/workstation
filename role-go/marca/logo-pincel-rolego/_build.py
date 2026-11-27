#!/usr/bin/env python3
"""RolêGo · logo toda em pincel, sem o símbolo Go antigo: variações da palavra completa.
Letras em _letras.py. Precisa de shapely, Pillow e do Chrome.
Saídas: svg/, posts/, rolego-pincel-completo.pdf e .html.
Rodar: python3 -B _build.py [--so-pdf]"""
import base64, importlib.util, io, os, re, shutil, sys
from concurrent.futures import ThreadPoolExecutor
from shapely import affinity
from shapely.geometry import Polygon
from shapely.ops import unary_union

AQUI = os.path.dirname(os.path.abspath(__file__))
MARCA = os.path.dirname(AQUI)
sys.path.insert(0, AQUI)
sys.path.insert(0, os.path.join(MARCA, "identidade-v5-gomosa"))
import _letras as L  # noqa: E402
from _common import pdf, shoot  # noqa: E402
from PIL import Image  # noqa: E402

NOME = "rolego-pincel-completo"
AZUL, ROXO, VIOLETA, AMARELO = "#68E2E3", "#6D34CC", "#AB05EA", "#D6E905"
NOITE, PRETO, BRANCO, NEVOA = "#160A33", "#000000", "#FFFFFF", "#F3F1FA"
INCL = 10.0


# ---------------------------------------------------------------- geometria
def giro(g, a):
    return affinity.rotate(g, a, origin=(0, 0))


def escala(g, k):
    return affinity.scale(g, k, k, origin=(0, 0))


def mover(g, dx, dy):
    return affinity.translate(g, dx, dy)


def centrar(g, cx, cy):
    b = g.bounds
    return mover(g, cx - (b[0] + b[2]) / 2, cy - (b[1] + b[3]) / 2)


def largura(g, w):
    return escala(g, w / (g.bounds[2] - g.bounds[0]))


RISCO = Polygon(L._aneis(L.RISCO_D)[0]).buffer(0)


def risco_sob(palavra, x0, x1, giro_=4.0, folga=14):
    """O traço degradê, esticado de x0 a x1 e encostado por baixo da palavra."""
    r = largura(giro(RISCO, giro_), x1 - x0)
    r = mover(r, x0 - r.bounds[0], palavra.bounds[1] - r.bounds[1])
    while r.distance(palavra) < folga or r.centroid.y < palavra.centroid.y:
        r = mover(r, 0, 2)
    return r


# ---------------------------------------------------------------- desenho
_n = [0]


def P(g, fill, extra=""):
    return f'<path d="{L.d(g)}" fill="{fill}" fill-rule="evenodd" {extra}/>'


def cheio(g, fill):
    """Silhueta sem os miolos (para contorno e sombra)."""
    partes = getattr(g, "geoms", [g])
    return P(unary_union([Polygon(p.exterior) for p in partes]), fill)


def TR(g, cores):
    _n[0] += 1
    i = f"r{_n[0]}"
    x0, _, x1, _ = g.bounds
    st = "".join(f'<stop offset="{j / (len(cores) - 1):.2f}" stop-color="{c}"/>' for j, c in enumerate(cores))
    return f'<linearGradient id="{i}" gradientUnits="userSpaceOnUse" x1="{x0:.0f}" y1="0" x2="{x1:.0f}" y2="0">{st}</linearGradient>' + P(g, f"url(#{i})")


def lim(*g):
    return unary_union(list(g)).bounds


# Cada variação recebe o tema e devolve (corpo SVG, caixa).
def v_principal(t):
    return P(L.ROLE, t["a"]) + P(L.GO, t["b"]), lim(L.ROLE, L.GO)


def v_uma_cor(t):
    return P(L.ROLE, t["a"]) + P(L.GO, t["a"]), lim(L.ROLE, L.GO)


def v_risco(t):
    r = risco_sob(L.ROLE.union(L.GO), 380, 975)
    return P(L.ROLE, t["a"]) + P(L.GO, t["a"]) + TR(r, t["risco"]), lim(L.ROLE, L.GO, r)


def v_risco_go(t):
    r = risco_sob(L.GO, 665, 985, giro_=2, folga=12)
    return P(L.ROLE, t["a"]) + P(L.GO, t["b"]) + TR(r, [t["b"], t["b"]]), lim(L.ROLE, L.GO, r)


def v_nivelado(t):
    a, b = giro(L.ROLE, 6.5), giro(L.GO, 6.5)
    return P(a, t["a"]) + P(b, t["b"]), lim(a, b)


def v_go_maior(t):
    a = L.ROLE
    b = L._kern(escala(L.GO, 1.28), a, 1030, 470, 9)
    return P(a, t["a"]) + P(b, t["b"]), lim(a, b)


def _pilha(larg_go=1.0, sobe=0):
    a = largura(giro(L.ROLE, INCL), 600)
    a = mover(a, -a.bounds[0], -a.bounds[1])
    b = largura(giro(L.GO, INCL), 600 * larg_go)
    b = centrar(b, 300, a.bounds[3] + (b.bounds[3] - b.bounds[1]) / 2 + 14 - sobe)
    return a, b


def v_pilha(t):
    a, b = _pilha(.66)
    return P(a, t["a"]) + P(b, t["b"]), lim(a, b)


def v_pilha_larga(t):
    a = largura(L.ROLE, 600)
    a = mover(a, -a.bounds[0], -a.bounds[1])
    b = largura(L.GO, 390)
    b = mover(b, a.bounds[2] - b.bounds[2] + 70, a.bounds[3] - b.bounds[1] - 130)
    while b.distance(a) < 14:
        b = mover(b, 0, 2)
    return P(a, t["a"]) + P(b, t["b"]), lim(a, b)


def v_contorno(t):
    todo = L.ROLE.union(L.GO)
    fora, meio = todo.buffer(27), todo.buffer(15)
    return cheio(fora, t["borda2"]) + cheio(meio, t["borda"]) + P(L.ROLE, t["na_borda_a"]) + P(L.GO, t["na_borda_b"]), fora.bounds


def v_sombra(t):
    s = mover(L.ROLE.union(L.GO), 15, 15)
    return P(s, t["sombra"]) + P(L.ROLE, t["a"]) + P(L.GO, t["b"]), lim(s, L.ROLE, L.GO)


def v_selo(t):
    a = centrar(largura(giro(L.ROLE, INCL), 690), 500, 385)
    b = centrar(largura(giro(L.GO, INCL), 450), 515, 680)
    disco = (f'<circle cx="500" cy="500" r="470" fill="{t["selo"]}"/>'
             f'<circle cx="500" cy="500" r="438" fill="none" stroke="{t["na_borda_b"]}" stroke-width="9"/>')
    return disco + P(a, t["na_borda_a"]) + P(b, t["na_borda_b"]), (30, 30, 970, 970)


def v_blocos(t):
    a = centrar(largura(giro(L.ROLE, INCL), 560), 355, 175)
    b = centrar(largura(giro(L.GO, INCL), 285), 855, 175)
    caixas = (f'<path d="M60 0H690V350H60Q0 350 0 290V60Q0 0 60 0Z" fill="{t["selo"]}"/>'
              f'<path d="M690 0H960Q1020 0 1020 60V290Q1020 350 960 350H690Z" fill="{t["bloco2"]}"/>')
    return caixas + P(a, t["na_borda_a"]) + P(b, t["no_bloco2"]), (0, 0, 1020, 350)


OPCOES = [
    ("principal", "Principal", "A palavra inteira na subida do pincel, Go em outra cor.", v_principal),
    ("uma-cor", "Uma cor só", "Para carimbo, bordado, vinil e foto.", v_uma_cor),
    ("traco", "Com o traço", "O risco degradê embaixo, como nos posts.", v_risco),
    ("traco-no-go", "Traço no Go", "O risco marca só o Go e puxa o olho pro fim.", v_risco_go),
    ("nivelada", "Nivelada", "Endireitada, para topo de app e site.", v_nivelado),
    ("go-maior", "Go maior", "O Go cresce e vira o destaque.", v_go_maior),
    ("empilhada", "Empilhada", "Rolê em cima, Go centralizado.", v_pilha),
    ("escada", "Escada", "O Go desce e acompanha a subida do pincel.", v_pilha_larga),
    ("contorno", "Adesivo", "Contorno duplo, solta de qualquer foto.", v_contorno),
    ("sombra", "Sombra", "Sombra deslocada, jeito de cartaz.", v_sombra),
    ("selo", "Selo", "Redondo para avatar, copo e camiseta.", v_selo),
    ("blocos", "Dois blocos", "Cada parte na sua cor de fundo.", v_blocos),
]

TEMAS = {
    "roxo": dict(fundo=f"linear-gradient(150deg,{VIOLETA},{ROXO})", a=AMARELO, b=AZUL, risco=[AZUL, "#B9F6F2", BRANCO],
                 borda=NOITE, borda2=BRANCO, na_borda_a=AMARELO, na_borda_b=AZUL, sombra=NOITE, selo=NOITE, bloco2=AZUL, no_bloco2=NOITE),
    "preto": dict(fundo=PRETO, a=AMARELO, b=AZUL, risco=[AZUL, "#6A86EC", ROXO, VIOLETA],
                  borda=ROXO, borda2=BRANCO, na_borda_a=AMARELO, na_borda_b=AZUL, sombra=ROXO, selo=ROXO, bloco2=AZUL, no_bloco2=NOITE),
    "claro": dict(fundo=NEVOA, a=ROXO, b=NOITE, risco=[AZUL, "#6A86EC", ROXO, VIOLETA],
                  borda=ROXO, borda2=NOITE, na_borda_a=AMARELO, na_borda_b=AZUL, sombra=AZUL, selo=ROXO, bloco2=NOITE, no_bloco2=AZUL),
}


def svg(corpo, caixa, w=None, h=None, pad=6):
    x0, y0, x1, y1 = caixa
    x0, y0, vw, vh = x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad
    k = min(w / vw, h / vh) if w else 1
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0:.1f} {y0:.1f} {vw:.1f} {vh:.1f}" '
            f'width="{vw * k:.1f}" height="{vh * k:.1f}" role="img" aria-label="RolêGo">{corpo}</svg>')


def logo(i, tema, w=None, h=None, extra=None):
    t = {**TEMAS[tema], **(extra or {})}
    return svg(*OPCOES[i - 1][3](t), w, h)


def icone(qual, fundo, cor, tam):
    g = giro(L.GO, INCL) if qual == "go" else giro(unary_union([L.R]), INCL)
    g = centrar(largura(g, 780 if qual == "go" else 600), 500, 500)
    corpo = f'<rect width="1000" height="1000" rx="230" fill="{fundo}"/>' + P(g, cor)
    return svg(corpo, (0, 0, 1000, 1000), tam, tam, 0)


ICONES = [("go", ROXO, AMARELO), ("go", PRETO, AZUL), ("go", AMARELO, NOITE), ("go", AZUL, NOITE),
          ("r", ROXO, AMARELO), ("r", PRETO, AZUL), ("r", AMARELO, NOITE), ("r", NEVOA, ROXO)]
COMBOS = [
    ("01 · Atual", "#AB05EA", "#6D34CC", "#D6E905", "#68E2E3"),
    ("13 · Azul vivo e ouro", "#8A2BE2", "#5B2BD9", "#FFD60A", "#3DD6FF"),
    ("10 · Uva e amarelo", "#7B1977", "#3D1567", "#FFD60A", "#68E2E3"),
    ("05 · Branco e ciano", "#AB05EA", "#6D34CC", "#FFFFFF", "#68E2E3"),
    ("27 · Go ouro", "#8A2BE2", "#5B2BD9", "#FFFFFF", "#FFD60A"),
    ("26 · Go rosa", "#AB05EA", "#6D34CC", "#D6E905", "#FF9BD5"),
    ("14 · Azul royal", "#5B2BD9", "#1D46C9", "#D6E905", "#FFFFFF"),
    ("Preto e ouro", "#000000", "#000000", "#FFD60A", "#3DD6FF"),
]


# ---------------------------------------------------------------- posts (mesmos de ../estilo-viva-o-role, logo nova)
def _uri(s):
    return "data:image/svg+xml;base64," + base64.b64encode(s.encode()).decode()


def posts():
    spec = importlib.util.spec_from_file_location("combos", os.path.join(MARCA, "estilo-viva-o-role", "combinacoes", "_build.py"))
    C = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(C)
    ns = C.ambiente(C.COMBOS[0][:7])

    def lg(h, role=BRANCO, go_=AZUL):
        s = svg(P(L.ROLE, role) + P(L.GO, go_ or AZUL), lim(L.ROLE, L.GO), pad=0)
        return f'<img src="{_uri(s)}" style="width:{h * 3.9:.0f}px;display:block">'

    def so_go(cor, h, extra=""):
        # ocupa o mesmo quadrado do símbolo antigo, para o layout não mudar
        g = giro(L.GO, INCL)
        g = centrar(largura(g, 232), 128, 128)
        s = svg(P(g, cor), (0, 0, 256, 256), pad=0)
        return f'<img src="{_uri(s)}" style="height:{h}px;width:{h}px;display:block;{extra}">'

    ns["logo"], ns["go"] = lg, so_go
    fontes, saida = os.path.join(AQUI, "_src"), os.path.join(AQUI, "posts")
    os.makedirs(fontes, exist_ok=True)
    os.makedirs(saida, exist_ok=True)
    tarefas = []
    for nome, _, fn in ns["POSTS"][:6]:
        h = os.path.join(fontes, nome + ".html")
        open(h, "w").write(f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>{ns["PCSS"]}</style></head><body>{fn()}</body></html>')
        tarefas.append((h, os.path.join(saida, nome + ".png")))
    with ThreadPoolExecutor(5) as ex:
        list(ex.map(lambda t: shoot(t[0], t[1], 1080, 1080), tarefas))
    shutil.rmtree(fontes)


def jpg(nome, w=700):
    im = Image.open(os.path.join(AQUI, "posts", nome)).convert("RGB").resize((w, w), Image.LANCZOS)
    b = io.BytesIO()
    im.save(b, "JPEG", quality=86, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()


# ---------------------------------------------------------------- documento
CSS = """@import url('https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@1,90,900&family=Poppins:wght@400;500;600;700&display=swap');
@page{size:297mm 210mm;margin:0}*{box-sizing:border-box;margin:0;padding:0}body{font-family:Poppins,sans-serif;background:#555;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:297mm;height:210mm;padding:22px 36px 28px;position:relative;overflow:hidden;page-break-after:always;background:#fff;color:#111}
header{display:flex;justify-content:space-between;align-items:center;gap:20px;height:34px}h2{font:italic 900 24px/1 Archivo,sans-serif;font-stretch:90%;text-transform:uppercase}
header p{font-size:10.5px;color:#555}u{text-decoration:none;background:#111;color:#fff;border-radius:7px;padding:1px 8px 2px;margin-right:8px;display:inline-block}
.foot{position:absolute;left:36px;right:36px;bottom:10px;display:flex;justify-content:space-between;font-size:8.5px;color:#888}
.t{display:flex;align-items:center;justify-content:center;position:relative;border-radius:12px;overflow:hidden}svg{display:block}
.capa{display:grid;grid-template-rows:440px 230px;gap:10px;margin-top:12px}.capa>div:last-child{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.grade{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(4,160px);gap:8px 12px;margin-top:10px}
.grade .t b{position:absolute;left:8px;top:7px;font-size:9px;border-radius:5px;padding:0 5px;background:rgba(255,255,255,.92);color:#111}
.op{margin-top:10px}.op h3{font-size:12.5px;display:flex;align-items:center;margin-bottom:6px;gap:2px}.op h3 u{font-size:10.5px}.op h3 span{font:400 9.5px Poppins;color:#666;margin-left:10px}
.tres{display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:10px}.tres .t{height:316px}
.cores{display:grid;grid-template-columns:repeat(2,1fr);grid-template-rows:repeat(4,163px);gap:10px 12px;margin-top:12px}.cores small{position:absolute;left:12px;top:8px;color:#fff;font-size:9px;font-weight:600}
.icones{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;margin-top:26px;justify-items:center}.icones svg:first-child{filter:drop-shadow(0 0 1px rgba(0,0,0,.25))}
.pq{display:flex;flex-direction:column;gap:12px;margin-top:14px}.pq .t{height:190px;gap:52px}
.posts{display:grid;grid-template-columns:repeat(3,316px);gap:12px 16px;justify-content:center;margin-top:16px}.posts img{width:316px;height:316px;display:block;border-radius:14px}"""


def pag(n, titulo, sub, corpo):
    return (f'<section class="page"><header><h2>{titulo}</h2><p>{sub}</p></header>{corpo}'
            f'<div class="foot"><span>RolêGo · logo toda em pincel</span><span>{n}</span></div></section>')


def t_(tema, conteudo, fundo=None):
    return f'<div class="t" style="background:{fundo or TEMAS[tema]["fundo"]}">{conteudo}</div>'


def documento():
    pags = [pag(1, "RolêGo inteiro em pincel", "Sem o símbolo antigo: a palavra toda no mesmo traço.",
                f'<div class="capa">{t_("roxo", logo(1, "roxo", 820, 340))}<div>{t_("preto", logo(1, "preto", 400, 160))}{t_("claro", logo(1, "claro", 400, 160))}</div></div>')]
    cel = "".join(t_(tm, logo(i, tm, 290, 138) + f"<b>{i:02d}</b>") for i in range(1, 13) for tm in ["preto" if (i - 1) % 2 else "roxo"])
    pags.append(pag(2, "12 variações", "A mesma palavra em composições e acabamentos diferentes.", f'<div class="grade">{cel}</div>'))
    for a in range(1, 13, 2):
        blocos = ""
        for i in (a, a + 1):
            _, nome, ideia, _ = OPCOES[i - 1]
            blocos += (f'<div class="op"><h3><u>{i:02d}</u>{nome}<span>{ideia}</span></h3><div class="tres">'
                       f'{t_("roxo", logo(i, "roxo", 380, 270))}{t_("preto", logo(i, "preto", 250, 240))}{t_("claro", logo(i, "claro", 250, 240))}</div></div>')
        pags.append(pag(len(pags) + 1, f"Variações {a:02d} e {a + 1:02d}", "Roxo, preto e claro.", blocos))
    cel = "".join(f'<div class="t" style="background:linear-gradient(160deg,{f1},{f2})"><small>{nome}</small>{logo(1, "roxo", 330, 125, dict(a=a, b=b))}</div>'
                  for nome, f1, f2, a, b in COMBOS)
    pags.append(pag(len(pags) + 1, "Nas cores das combinações", "A principal em paletas do combinacoes-de-cores (números iguais aos de lá).", f'<div class="cores">{cel}</div>'))
    cel = "".join(icone(q, f, c, 205) for q, f, c in ICONES)
    pags.append(pag(len(pags) + 1, "Ícone do app", "O Go em pincel; embaixo, a alternativa só com o R.", f'<div class="icones">{cel}</div>'))
    linhas = "".join(t_(tm, "".join(logo(i, tm, w, w) for i, w in ((1, 330), (1, 190), (1, 100), (5, 100), (1, 60)))) for tm in ("roxo", "preto", "claro"))
    pags.append(pag(len(pags) + 1, "Em tamanho pequeno", "Principal em 330, 190, 100 e 60 px; a nivelada em 100 px.", f'<div class="pq">{linhas}</div>'))
    cel = "".join(f'<img src="{jpg(f)}">' for f in sorted(os.listdir(os.path.join(AQUI, "posts"))) if f.endswith(".png"))
    pags.append(pag(len(pags) + 1, "Nos posts", "Os seis posts do estilo, com a logo nova no lugar da antiga.", f'<div class="posts">{cel}</div>'))
    html = f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>RolêGo — logo em pincel</title><style>{CSS}</style></head><body>{"".join(pags)}</body></html>'
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
    for q, f, c in ICONES:
        nome = f"icone-{q}-{f[1:]}-{c[1:]}.svg".lower()
        open(os.path.join(pasta, nome), "w").write(icone(q, f, c, 1024))


if __name__ == "__main__":
    if "--so-pdf" not in sys.argv:
        exportar()
        posts()
    documento()
    if "--prova" in sys.argv:
        destino = sys.argv[sys.argv.index("--prova") + 1]
        os.makedirs(destino, exist_ok=True)
        cab, corpo = open(os.path.join(AQUI, NOME + ".html")).read().split("<body>")
        for j, s in enumerate(re.findall(r"<section.*?</section>", corpo, re.S), 1):
            h = os.path.join(destino, f"p{j:02d}.html")
            open(h, "w").write(cab + "<body>" + s + "</body></html>")
            shoot(h, os.path.join(destino, f"p{j:02d}.png"), 1123, 794)

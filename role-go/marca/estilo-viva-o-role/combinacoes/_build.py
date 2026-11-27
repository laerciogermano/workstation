#!/usr/bin/env python3
"""RolêGo · simulações de cor sobre os 6 posts do estilo "Viva o rolê" (modelo: ../image copy.png).
Mesmo layout e mesmo texto de ../_posts.py; muda só a paleta. A troca é feita no código-fonte dos
geradores (uma passada só), então ../ continua intocado.
Saídas: <nn-nome>/*.png (1080 × 1080), combinacoes-de-cores.pdf e .html.
Rodar: python3 _build.py [--so-pdf]"""
import base64, io, os, re, sys
from concurrent.futures import ThreadPoolExecutor

AQUI = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(AQUI)
FONTES = os.path.join(AQUI, "_src")
NOME = "combinacoes-de-cores"
sys.path.insert(0, os.path.join(BASE, "..", "identidade-v5-gomosa"))
from _common import contrast, pdf, shoot  # noqa: E402
from PIL import Image  # noqa: E402

# slug, nome, ideia, botão, fundo, fundo 2 (degradê), pincel
# USADAS: só cores que já estão nos documentos da marca (cores escolhidas, v2, amostra v1 e mistura sunset)
USADAS = [
    ("atual", "Azul, roxo e amarelo (atual)", "A base de comparação.", "#68E2E3", "#6D34CC", "#AB05EA", "#D6E905"),
    ("botao-amarelo", "Botão amarelo", "As mesmas cores, trocando os papéis: amarelo no botão, azul no pincel.", "#D6E905", "#6D34CC", "#AB05EA", "#68E2E3"),
    ("identidade-v2", "Identidade final v2", "Roxo e ciano da identidade final v2, com o amarelo.", "#00E5E5", "#6539CB", "#9E19E9", "#D6E905"),
    ("roxo-eletrico", "Roxo elétrico", "O roxo azulado da v2 como fundo.", "#00E5E5", "#452EFF", "#9E19E9", "#D6E905"),
    ("branco-ciano", "Botão branco", "Branco no botão, azul no pincel. A mais limpa.", "#FFFFFF", "#6D34CC", "#AB05EA", "#68E2E3"),
    ("rosa-claro", "Rosa claro no pincel", "Azul no botão e o rosa claro da mistura sunset.", "#68E2E3", "#6D34CC", "#7B1977", "#FF9BD5"),
    ("rosa-escolhido", "Rosa das cores escolhidas", "O rosa vira fundo, com roxo no degradê.", "#68E2E3", "#CB4C7B", "#6D34CC", "#D6E905"),
    ("pessego", "Pêssego no botão", "O pêssego da amostra sobre roxo.", "#FA9B56", "#6D34CC", "#AB05EA", "#D6E905"),
    ("melancia", "Melancia no botão", "A melancia só no botão, com pincel azul.", "#FF4D6A", "#452EFF", "#6539CB", "#68E2E3"),
    ("uva-amarelo", "Uva e amarelo", "Fundo escuro, botão amarelo ouro.", "#FBC60B", "#3D1567", "#7437E0", "#68E2E3"),
    ("ameixa-magenta", "Ameixa e magenta", "Quente, com rosa claro no pincel.", "#FBC60B", "#7B1977", "#EA118F", "#FF9BD5"),
    ("sunset", "Pôr do sol", "Laranja no botão, céu de ameixa e uva.", "#F67746", "#7B1977", "#3D1567", "#FBC60B"),
]
NOVAS = [
    ("azul-vivo-ouro", "Azul vivo e ouro", "Mesmo trio, azul mais azul e amarelo mais quente.", "#3DD6FF", "#5B2BD9", "#8A2BE2", "#FFD60A"),
    ("azul-royal", "Azul royal", "O fundo vira azul; o roxo fica no degradê.", "#6FE7FF", "#2B3FD6", "#6D2BE0", "#FFE14D"),
    ("ceu-limao", "Céu e limão", "Fundo azul fechado, tudo claro por cima.", "#8EE8FF", "#0B5CAD", "#27389E", "#E4FF3C"),
    ("marinho-turquesa", "Marinho e turquesa", "Fria, com limão no pincel.", "#3FE6D4", "#1E3A8A", "#3B2A8F", "#C6F432"),
    ("royal-rosa", "Royal e rosa", "Botão rosa sobre azul.", "#FF8FCB", "#1D46C9", "#4B32C3", "#FFE14D"),
    ("rosa-chiclete", "Rosa chiclete", "Botão rosa sobre roxo.", "#FF7AC3", "#6D34CC", "#AB05EA", "#D6E905"),
    ("framboesa", "Framboesa", "Fundo rosa escuro puxando pro roxo.", "#68E2E3", "#B5127C", "#7A14C4", "#FFE45C"),
    ("coral-ciano", "Coral e ciano", "Botão coral, pincel azul.", "#FF8A7A", "#4C1D95", "#7E22CE", "#7FF0F2"),
    ("lilas-sol", "Lilás e sol", "Quase só roxo, com o amarelo.", "#CDBBFF", "#4B1D95", "#6D28D9", "#FDE047"),
    ("menta-creme", "Menta e creme", "Mais suave, menos neon.", "#6CF2B0", "#5A2FC2", "#3B1E8F", "#FFF0B0"),
    ("verde-neon", "Verde neon", "A mais elétrica.", "#3DF5A0", "#6A1FD0", "#A21CAF", "#F2FF4D"),
    ("petroleo-rosa", "Petróleo e rosa", "Sem roxo no fundo.", "#D6E905", "#0F6E6A", "#14546E", "#FF9FD2"),
]
COMBOS = USADAS + NOVAS
FINALISTAS = [  # (número, motivo)
    (13, "<b>Minha primeira escolha.</b> Continua sendo azul, roxo e amarelo, com o azul mais vivo e o amarelo mais quente, que se destacam bem no roxo. Pede dois códigos novos de azul e amarelo e um ajuste no roxo."),
    (1, "<b>A opção segura.</b> Já está no documento de identidade, com boa leitura e nada para refazer. O amarelo puxa para o limão."),
    (10, "<b>A alternativa mais diferente,</b> só com cores já usadas. Botão e pincel têm o maior contraste dos três no fundo uva. Em troca, as fotos ficam amareladas e o roxo escurece."),
]


def rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def mix(a, b, p):
    return "#" + "".join(f"{round(x + (y - x) * p):02X}" for x, y in zip(rgb(a), rgb(b)))


def trio(h):
    return ",".join(map(str, rgb(h)))


def cores(c):
    slug, _, _, a, b, b2, d = c
    noite = "#160A33" if slug == "atual" else mix(b, "#000000", .74)
    return dict(botao=a, fundo=b, fundo2=b2, pincel=d, noite=noite)


def ambiente(c):
    """Executa os helpers e os posts de ../ com a paleta da combinação."""
    k = cores(c)
    a, b, b2, d, n = k["botao"], k["fundo"], k["fundo2"], k["pincel"], k["noite"]
    troca = {}
    if c[0] != "atual":
        troca = {"#68E2E3": a, "#6D34CC": b, "#AB05EA": b2, "#D6E905": d, "#160A33": n,
                 "#6A86EC": mix(a, b, .5), "#B7AED6": mix(b, "#FFFFFF", .68),
                 "104,226,227": trio(a), "109,52,204": trio(b), "22,10,51": trio(n), "171,5,234": trio(b2),
                 # luz das fotos: noite → fundo → botão
                 "#03020C": mix(b, "#000000", .95), "#190B49": mix(b, "#000000", .64), "#5A28B4": mix(b, "#000000", .1),
                 "#7160E4": mix(b, a, .45), "#EFFFFF": mix(a, "#FFFFFF", .88)}
    pat = re.compile("|".join(map(re.escape, troca))) if troca else None
    ns = {"__file__": os.path.join(BASE, "_build.py"), "__name__": "combo"}
    base = open(os.path.join(BASE, "_build.py")).read().split("# ---------------------------------------------------------------- posts, stories")[0]
    for nome, src in (("_build.py", base), ("_posts.py", open(os.path.join(BASE, "_posts.py")).read())):
        if pat:
            src = pat.sub(lambda m: troca[m.group(0)], src)
        exec(compile(src, nome, "exec"), ns)
    return ns


def pasta(i, c):
    return os.path.join(AQUI, f"{i:02d}-{c[0]}")


def gerar():
    os.makedirs(FONTES, exist_ok=True)
    tarefas = []
    for i, c in enumerate(COMBOS, 1):
        ns = ambiente(c)
        os.makedirs(pasta(i, c), exist_ok=True)
        for nome, _, fn in ns["POSTS"][:6]:
            h = os.path.join(FONTES, f"{i:02d}-{nome}.html")
            open(h, "w").write(f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>{ns["PCSS"]}</style></head><body>{fn()}</body></html>')
            tarefas.append((h, os.path.join(pasta(i, c), f"{nome}.png")))
        print("html", i, c[1], flush=True)
    with ThreadPoolExecutor(5) as ex:
        list(ex.map(lambda t: shoot(t[0], t[1], 1080, 1080), tarefas))
    print("ok", len(tarefas), "posts")


# ---------------------------------------------------------------- documento
POSTS = [("01-sexta-tem-role", "Frase curta"), ("02-evento-foto", "Evento · foto"), ("03-top5-semana", "Lista · top 5"),
         ("04-enquete", "Enquete"), ("05-frase", "Frase · preto"), ("06-feature-match", "Feature do app")]


def img(i, c, nome, w):
    im = Image.open(os.path.join(pasta(i, c), nome + ".png")).convert("RGB").resize((w, w), Image.LANCZOS)
    b = io.BytesIO()
    im.save(b, "JPEG", quality=86, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()


def bolas(c):
    k = cores(c)
    return "".join(f'<i style="background:{k[x]}"></i>' for x in ("botao", "fundo", "fundo2", "pincel"))


def rodape(n):
    return f'<div class="foot"><span>RolêGo · simulações de cor · estilo “Viva o rolê”</span><span>{n}</span></div>'


def comparativo(n, lote, inicio, nome, titulo, sub):
    cel = "".join(f'<div class="cel"><img src="{img(i, c, nome, 460)}"><div><b>{i:02d}</b><span>{c[1]}</span><em>{bolas(c)}</em></div></div>'
                  for i, c in enumerate(lote, inicio))
    return (f'<section class="page"><header><h2>{titulo}</h2><p>{sub}</p></header><div class="grade">{cel}</div>{rodape(n)}</section>')


def finalistas(n):
    col = "".join(f'<div><div class="ft"><b>{i:02d}</b> {COMBOS[i - 1][1]}<em>{bolas(COMBOS[i - 1])}</em></div>'
                  f'<img src="{img(i, COMBOS[i - 1], POSTS[0][0], 520)}"><img src="{img(i, COMBOS[i - 1], POSTS[1][0], 520)}"><p>{m}</p></div>' for i, m in FINALISTAS)
    return (f'<section class="page"><header><h2>Minha indicação</h2><p>Três finalistas para decidir lado a lado. É uma opinião: vale testar com o público.</p></header>'
            f'<div class="fin">{col}</div>{rodape(n)}</section>')


def numero(v):
    return f"{v:.1f}".replace(".", ",")


def pagina(n, i, c):
    k = cores(c)
    sw = "".join(f'<div class="sw"><i style="background:{k[x]}"></i><span><b>{t}</b><code>{k[x]}</code></span></div>'
                 for x, t in (("botao", "Botão"), ("fundo", "Fundo"), ("fundo2", "Degradê"), ("pincel", "Pincel"), ("noite", "Texto escuro")))
    leit = (("texto no botão", contrast(k["botao"], k["noite"])), ("pincel no fundo", contrast(k["pincel"], k["fundo"])),
            ("botão no fundo", contrast(k["botao"], k["fundo"])))
    lt = " · ".join(f'{t} <b>{numero(v)}</b>' for t, v in leit)
    cel = "".join(f'<div><img src="{img(i, c, nome, 640)}"><span>{t}</span></div>' for nome, t in POSTS)
    grupo = "Cores já usadas" if i <= len(USADAS) else "Cores novas"
    return (f'<section class="page"><header><h2><u>{i:02d}</u>{c[1]}</h2><p><s>{grupo}</s>{c[2]}</p></header>'
            f'<div class="linha">{sw}<div class="leit">Contraste com a cor principal do fundo (quanto maior, mais legível)<br>{lt}</div></div><div class="pg">{cel}</div>{rodape(n)}</section>')


CSS = """@import url('https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@1,90,900&family=Poppins:wght@400;500;600;700&display=swap');
@page{size:297mm 210mm;margin:0}*{box-sizing:border-box;margin:0;padding:0}body{font-family:Poppins,sans-serif;background:#555;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:297mm;height:210mm;padding:22px 38px 26px;position:relative;overflow:hidden;page-break-after:always;background:#F4F4F6;color:#111}
header{display:flex;justify-content:space-between;align-items:center;gap:20px;height:34px}h2{font:italic 900 24px/1 Archivo,sans-serif;font-stretch:90%;text-transform:uppercase}h2 u{text-decoration:none;background:#111;color:#fff;border-radius:8px;padding:1px 9px 3px;margin-right:10px;display:inline-block}
header p{font-size:10.5px;color:#555}
.foot{position:absolute;left:38px;right:38px;bottom:9px;display:flex;justify-content:space-between;font-size:8.5px;color:#888}
.grade{display:grid;grid-template-columns:repeat(4,1fr);gap:8px 22px;margin-top:8px;padding:0 70px}.cel img{display:block;width:100%;aspect-ratio:1;border-radius:9px}.cel>div{display:flex;align-items:center;gap:5px;margin-top:3px;font-size:8px}.cel b{font-size:9px}.cel span{flex:1;white-space:nowrap;overflow:hidden}.cel em{display:flex;gap:2px}.cel em i,.sw i{display:block;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(0,0,0,.18)}.cel em i{width:9px;height:9px}
.linha{display:flex;align-items:center;gap:18px;height:36px;margin:6px 0 10px}.sw{display:flex;align-items:center;gap:7px}.sw i{width:30px;height:30px}.sw b{display:block;font-size:8.5px}.sw code{display:block;font:8px ui-monospace,Menlo,monospace;color:#555}.leit{margin-left:auto;font-size:8.5px;color:#555;text-align:right;line-height:1.6}.leit b{color:#111}
.pg{display:grid;grid-template-columns:repeat(3,306px);gap:8px 20px;justify-content:center}.pg img{display:block;width:306px;height:306px;border-radius:14px}.pg span{display:block;font-size:8px;font-weight:600;color:#666;text-transform:uppercase;letter-spacing:.05em;margin-top:2px}"""

# comparativos (4 × 3) e finalistas
CSS += (".grade{display:grid;grid-template-columns:repeat(4,204px);justify-content:center;gap:9px 30px;margin-top:10px}.cel img{display:block;width:204px;height:204px;border-radius:11px}"
        ".cel>div{width:204px;display:flex;align-items:center;gap:6px;margin-top:3px;font-size:8.5px}.cel b{font-size:10px}.cel span{flex:1;white-space:nowrap;overflow:hidden}.cel em,.fin em{display:flex;gap:2px;margin-left:auto}.cel em i,.fin em i{width:10px;height:10px}"
        "header s{text-decoration:none;font-weight:700;font-size:9px;border:1.5px solid #111;border-radius:99px;padding:1px 9px;margin-right:10px;color:#111}"
        ".fin{display:grid;grid-template-columns:repeat(3,290px);justify-content:center;gap:34px;margin-top:10px}.fin .ft{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:600;margin-bottom:6px}"
        ".fin img{display:block;width:290px;height:290px;border-radius:13px;margin-bottom:8px}.fin p{font-size:9.5px;line-height:1.45;color:#333}")


def documento():
    paginas = []
    for lote, inicio, grupo in ((USADAS, 1, "Cores já usadas"), (NOVAS, len(USADAS) + 1, "Cores novas")):
        for nome, titulo, sub_ in (("01-sexta-tem-role", f"{grupo} · fundo colorido", "O mesmo post em 12 combinações. Anote os números que mais agradam."),
                                   ("02-evento-foto", f"{grupo} · com foto", "Como cada paleta trata a foto, o botão e o selo.")):
            paginas.append(comparativo(len(paginas) + 1, lote, inicio, nome, titulo, sub_))
    for i, c in enumerate(COMBOS, 1):
        paginas.append(pagina(len(paginas) + 1, i, c))
    if FINALISTAS:
        paginas.append(finalistas(len(paginas) + 1))
    html = f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>RolêGo — simulações de cor</title><style>{CSS}</style></head><body>{"".join(paginas)}</body></html>'
    out = os.path.join(AQUI, NOME + ".html")
    open(out, "w").write(html)
    pdf(out, os.path.join(AQUI, NOME + ".pdf"))
    print("ok", len(paginas), "págs")


if __name__ == "__main__":
    if "--so-pdf" not in sys.argv:
        gerar()
    documento()

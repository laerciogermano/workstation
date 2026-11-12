#!/usr/bin/env python3
"""Clozzy — documento de identidade visual “Estrela macia”.
Rodar: python3 _marca.py && python3 _build.py → identidade-estrela-macia.html + .pdf
Páginas só em preto #000 e branco #fff (nunca creme, nunca ink)."""
import base64, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import _marca as M  # noqa: E402

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
FONTS = HERE.parent / "logo-final-v3" / "fonts"
OUT_HTML = HERE / "identidade-estrela-macia.html"
OUT_PDF = HERE / "identidade-estrela-macia.pdf"
PINK, DEEP, PURPLE, BLACK, WHITE = M.PINK, M.DEEP, M.PURPLE, M.BLACK, M.WHITE
V, f = M.V, M.f
TOTAL = 11


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(Path(p).read_bytes()).decode()


def svg(inner, vb, w, h=None, style=""):
    h = h or w
    return f'<svg viewBox="{vb}" width="{f(w)}" height="{f(h)}" style="{style}">{inner}</svg>'


def sym(v, px, ring=M.MAIN_RING, small=False, spin=False):
    v = V[v] if isinstance(v, str) else v
    inner = M.mark(v, ring, small)
    if spin and ring:
        ringpart = M.RING[ring][3](v["dash"], v["line"])
        inner = f'<g class="ring">{ringpart}</g>{M.macia(v["star"], M.STAR_FIT)}'
    return svg(inner, "5 5 90 90", px)


def lock(v, h, ring=M.MAIN_RING, vertical=False):
    v = V[v] if isinstance(v, str) else v
    inner, w, hh = M.lockup_body(v, ring, vertical)
    return svg(inner, f"0 0 {f(w)} {f(hh)}", h * w / hh, h)


def tile(v, px, ring=M.MAIN_RING, radius=22.37):
    v = V[v] if isinstance(v, str) else v
    s = 0.62 if ring else 0.6
    o = 50 - 50 * s
    edge = ' stroke="#333" stroke-width="1"' if v["bg"] == BLACK else ""
    return svg(f'<rect x=".5" y=".5" width="99" height="99" rx="{radius}" fill="{v["bg"]}"{edge}/>'
               f'<g transform="translate({f(o)} {f(o)}) scale({f(s)})">{M.mark(v, ring)}</g>', "0 0 100 100", px)


def box(v, inner, w, h, extra=""):
    v = V[v] if isinstance(v, str) else v
    bd = "border:1px solid #E6E6E6;" if v["bg"] == WHITE else ""
    return f'<div class="box" style="background:{v["bg"]};width:{w}px;height:{h}px;{bd}{extra}">{inner}</div>'


def foot(n):
    return (f'<div class="foot"><span>Clozzy · identidade “Estrela macia” · nov 2026</span>'
            f'<span>{n:02d} / {TOTAL:02d}</span></div>')


def page(n, title, lead, body, dark=False):
    return (f'<section class="pg{" dark" if dark else ""}"><h2>{title}</h2><p class="lead">{lead}</p>{body}{foot(n)}</section>')


CSS = f"""
@font-face{{font-family:Gabarito;src:url({b64(FONTS / 'Gabarito-Variable.ttf', 'font/ttf')});font-weight:400 900}}
@font-face{{font-family:Figtree;src:url({b64(FONTS / 'Figtree-Variable.ttf', 'font/ttf')});font-weight:300 900}}
@page{{size:297mm 210mm;margin:0}}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:Figtree;color:{BLACK};background:#D9D9D9}}
svg{{display:block;flex-shrink:0}}
.ring{{transform-origin:50px 50px;animation:spin 2.4s linear infinite}}
@keyframes spin{{to{{transform:rotate(360deg)}}}}
@media print{{.ring{{animation:none}}}}
@media (prefers-reduced-motion:reduce){{.ring{{animation:none}}}}
.pg{{width:297mm;height:210mm;padding:14mm 16mm 13mm;position:relative;overflow:hidden;background:{WHITE};page-break-after:always;margin:0 auto 10px}}
@media print{{.pg{{margin:0}}}}
.pg.dark{{background:{BLACK};color:{WHITE}}}
h1{{font:900 64px/.95 Gabarito;letter-spacing:-.035em}}
h2{{font:900 30px/1.02 Gabarito;letter-spacing:-.03em}}
h3{{font:800 13px Gabarito}}
.lead{{font-size:12px;line-height:1.5;max-width:700px;margin-top:7px;opacity:.72}}
.foot{{position:absolute;left:16mm;right:16mm;bottom:7mm;display:flex;justify-content:space-between;font:600 9px Figtree;opacity:.45}}
.lbl{{font:700 10px Figtree;opacity:.6;margin-bottom:6px}}
.cap{{font:600 9.5px/1.35 Figtree;opacity:.62;margin-top:6px;text-align:center}}
.cap b{{display:block;font:800 11px Gabarito;opacity:1}}
.flex{{display:flex;gap:18px;align-items:flex-start}}
.box{{border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0}}
.n{{width:22px;height:22px;border-radius:50%;background:{PINK};color:#fff;font:800 11px/22px Gabarito;text-align:center;flex-shrink:0}}
.step{{display:flex;gap:10px;align-items:center;margin-top:9px;font-size:11px;line-height:1.4;max-width:360px}}
.grid{{display:grid;gap:10px}}
.nm{{font:800 10.5px Gabarito;margin-top:6px}}
.nt{{font-size:8.6px;line-height:1.35;opacity:.6;margin-top:2px}}
.bad{{position:relative}}
.bad::after{{content:"";position:absolute;inset:0;border-radius:14px;background:linear-gradient(to top right,transparent 48.5%,{PINK} 49%,{PINK} 51%,transparent 51.5%)}}
.ph{{border-radius:22px;overflow:hidden;position:relative;flex-shrink:0}}
.btn{{display:flex;align-items:center;justify-content:center;border-radius:999px;font:800 10px Gabarito;height:26px}}
"""


# ------------------------------------------------------------------------------------------------ páginas
def p01():
    return (f'<section class="pg dark"><div style="display:flex;justify-content:space-between;height:100%">'
            f'<div style="display:flex;flex-direction:column;justify-content:space-between;padding-bottom:16mm">'
            f'<div><h1>Estrela<br>macia</h1>'
            f'<p class="lead" style="max-width:430px;margin-top:16px">A estrela de close friends, gorda e de pontas '
            f'redondas, com um ponto de câmera em cima à direita. Sozinha, ela é o ícone; dentro do anel de story '
            f'carregando, é o símbolo da Clozzy. Preto e branco de verdade, rosa e roxo chapados.</p></div>'
            f'<div style="display:flex;gap:26px;align-items:center">{lock("preto", 58)}{lock("preto", 58, None)}</div></div>'
            f'<div style="display:flex;align-items:center;padding-right:4mm">{sym("preto", 380, spin=True)}</div>'
            f'</div>{foot(1)}</section>')


def p02():
    steps = "".join(f'<div class="step"><div class="n">{i}</div><div>{t}</div></div>' for i, t in enumerate([
        "A Estrela macia da rodada 15 (glifo 01): estrela de 5 pontas com o vale em 55% do raio e contorno de 37,5% "
        "do raio com junta redonda. Por isso as pontas ficam gordas e macias.",
        "Levemente inclinada (−8°), para ter movimento e não parecer um ícone de “favoritos”.",
        "O ponto da câmera: um círculo de 14% do raio, no vão entre a ponta de cima e a da direita (−60°), a 1,3 raio do centro: solto, com respiro da estrela. "
        "É o buraquinho da lente do celular: a estrela vira câmera sem desenhar uma câmera.",
        f"Dentro do anel, a estrela cabe num círculo de raio {f(M.STAR_FIT)} no grid de 100, um pouco menor que a "
        f"estrela central do logo-carregando (22): sobra mais respiro entre a estrela, o ponto e o anel.",
        f"Anel do carregando sem mudança: raio médio {f(M.RM)}, espessura {f(M.W)}, 7 traços de 2° a 30° e a linha cheia.",
    ], 1))
    sizes = "".join(f'<div style="text-align:center">{sym("branco", px, small=px <= 32)}<div class="cap">{px} px</div></div>'
                    for px in (96, 64, 48, 32, 24, 16))
    isizes = "".join(f'<div style="text-align:center">{sym("branco", px, None)}<div class="cap">{px} px</div></div>'
                     for px in (96, 64, 48, 32, 24, 16))
    return page(2, "A estrela", "O que muda em relação ao logo-carregando é a estrela, um pouco menor que a central de lá. O anel fica igual.",
                f'<div class="flex" style="margin-top:14px;gap:30px">'
                f'<div style="display:grid;gap:12px">{box("branco", sym("branco", 210, None), 250, 250)}'
                f'{box("branco", sym("branco", 210), 250, 250)}</div>'
                f'<div>{steps}<div class="lbl" style="margin-top:20px">Ícone em escala</div>'
                f'<div style="display:flex;gap:20px;align-items:flex-end">{isizes}</div>'
                f'<div class="lbl" style="margin-top:16px">Símbolo em escala · em 32 px e menos entra o corte pequeno (3 traços)</div>'
                f'<div style="display:flex;gap:20px;align-items:flex-end">{sizes}</div></div></div>')


def p03():
    def col(title, txt, ring):
        return (f'<div style="flex:1"><h3 style="font-size:18px">{title}</h3><p class="lead" style="margin-top:4px">{txt}</p>'
                f'<div style="display:flex;gap:12px;margin-top:14px">'
                + "".join(box(s, sym(s, 118, ring), 148, 148) for s in ("preto", "rosa", "branco"))
                + '</div><div style="display:flex;gap:12px;margin-top:12px">'
                + "".join(box(s, sym(s, 118, ring), 148, 148) for s in ("roxo", "deep", "mono-branco"))
                + '</div></div>')
    return page(3, "Ícone e símbolo", "Duas formas da mesma marca. Use uma de cada vez: nunca as duas lado a lado.",
                f'<div class="flex" style="margin-top:16px;gap:30px">'
                f'{col("Ícone · só a estrela", "Para onde o espaço é pequeno ou a marca precisa ser rápida: ícone de app, favicon, botão, marca d’água, selo de conteúdo do close.", None)}'
                f'{col("Símbolo · estrela com anel", "Para onde a marca se apresenta: abertura do app, loader, avatar das redes, assinatura e papelaria. O anel é o story carregando.", M.MAIN_RING)}'
                f'</div>')


def p04():
    cells = ""
    for slug, nm, nt, _fn in M.RINGS:
        cells += (f'<div><div style="display:flex;gap:8px">{box("preto", sym("preto", 118, slug), 140, 140)}'
                  f'{box("branco", sym("branco", 118, slug), 140, 140)}</div>'
                  f'<div class="nm">{nm}{" · principal" if slug == M.MAIN_RING else ""}</div><div class="nt">{nt}</div></div>')
    return page(4, "Seis anéis", "Variações do círculo em volta, todas no estilo do arco do carregando: mesmo raio, pontas "
                "redondas e a estrela macia no mesmo tamanho.",
                f'<div class="grid" style="grid-template-columns:repeat(3,1fr);gap:16px 22px;margin-top:14px">{cells}</div>')


def p05():
    cells = ""
    for v in M.VARS:
        cells += (f'<div><div style="display:flex;gap:8px">{box(v, sym(v, 92, None), 118, 118)}{box(v, sym(v, 92), 118, 118)}</div>'
                  f'<div class="nm">{v["name"]}</div><div class="nt">{v["note"]}</div></div>')
    return page(5, "Cores", "Só rosa #FF0065, Pink Deep #E0005A, roxo #7C48C4, preto #000 e branco #fff. No preto, anel rosa e "
                "estrela branca; no rosa, no Deep e no roxo, tudo branco; no branco, Pink Deep. Nada preto sobre o rosa e "
                "nunca rosa sobre roxo.",
                f'<div class="grid" style="grid-template-columns:repeat(4,1fr);gap:18px 18px;margin-top:16px">{cells}</div>')


def p06():
    rows = ""
    for s in ("preto", "branco", "rosa", "roxo"):
        rows += (f'<div style="display:flex;gap:12px;margin-top:10px">'
                 f'{box(s, lock(s, 52), 300, 100)}{box(s, lock(s, 52, None), 300, 100)}'
                 f'{box(s, lock(s, 82, vertical=True), 130, 100)}{box(s, lock(s, 82, None, True), 130, 100)}</div>')
    return page(6, "Com a palavra", "Gabarito 800, sempre ao lado ou embaixo do símbolo, nunca fundida com o c. "
                "Horizontal: o símbolo tem 1,4× a altura do l e fica a 0,35 l da palavra.",
                f'<div style="display:flex;gap:12px;margin-top:14px" class="lbl"><span style="width:300px">Horizontal · com anel</span>'
                f'<span style="width:300px">Horizontal · só a estrela</span><span style="width:130px">Empilhado · anel</span>'
                f'<span style="width:130px">Empilhado · estrela</span></div>{rows}', dark=False)


def p07():
    tiles = ""
    for s in ("rosa", "preto", "roxo", "deep", "branco"):
        tiles += (f'<div style="text-align:center"><div style="display:flex;gap:10px">{tile(s, 120, None)}{tile(s, 120)}</div>'
                  f'<div class="cap">{V[s]["name"].split(" · ")[0]}</div></div>')
    fav = "".join(f'<div style="text-align:center">{tile("rosa", px, None, radius=20)}<div class="cap">{px}</div></div>'
                  for px in (64, 48, 32, 24, 16))
    return page(7, "Ícone de app", "No ícone de app vale a forma simples: a estrela sozinha, branca no rosa. "
                "O símbolo com anel fica para a tela de abertura e o loader. Símbolo a 60–62% do quadrado.",
                f'<div style="display:grid;grid-template-columns:repeat(3,auto);gap:22px 30px;margin-top:16px;justify-content:start">{tiles}</div>'
                f'<div class="lbl" style="margin-top:22px">Favicon e tamanhos pequenos · só a estrela</div>'
                f'<div style="display:flex;gap:22px;align-items:flex-end">{fav}</div>', dark=True)


THEMES = [  # id, nome, fundo da tela, superfície, variação do símbolo, botão (fundo, texto), destaque
    ("preto-rosa", "Preto + rosa", BLACK, "#141414", "preto", (DEEP, WHITE), PINK),
    ("preto-roxo", "Preto + roxo", BLACK, "#141414", "preto", (PURPLE, WHITE), "#B08BE6"),
    ("branco-rosa", "Branco + rosa", WHITE, "#F2F2F2", "branco", (DEEP, WHITE), DEEP),
    ("branco-roxo", "Branco + roxo", WHITE, "#F2F2F2", "branco", (PURPLE, WHITE), PURPLE),
    ("rosa", "Rosa total", PINK, DEEP, "rosa", (WHITE, DEEP), WHITE),
    ("roxo", "Roxo total", PURPLE, "#8C5ECB", "roxo", (WHITE, PURPLE), WHITE),
]


def phone(th, kind):
    _id, nm, bg, sf, vs, (bb, bt), ac = th
    v = V[vs]
    tx = BLACK if bg == WHITE else WHITE
    bd = "border:1px solid #E6E6E6;" if bg == WHITE else ("border:1px solid #333;" if bg == BLACK else "")
    if kind == "abertura":
        inner = (f'<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px">'
                 f'{sym(v, 92)}{lock(v, 22, None)}</div>')
    else:
        stories = "".join(f'<div style="width:30px;height:30px;border-radius:50%;border:2px {"dashed" if k % 2 == 0 else "solid"} {ac};'
                          f'padding:2px"><div style="width:100%;height:100%;border-radius:50%;background:{sf}"></div></div>'
                          for k in range(4))
        inner = (f'<div style="padding:22px 12px 0;display:flex;align-items:center;justify-content:space-between">'
                 f'{lock(v, 17, None)}<div style="width:20px;height:20px;border-radius:50%;background:{sf}"></div></div>'
                 f'<div style="display:flex;gap:7px;padding:12px 12px 0">{stories}</div>'
                 f'<div style="margin:12px 12px 0;height:96px;border-radius:12px;background:{sf};display:flex;align-items:center;justify-content:center">'
                 f'{svg(M.macia(ac, 30), "5 5 90 90", 40)}</div>'
                 f'<div style="margin:10px 12px 0;height:8px;width:60%;border-radius:4px;background:{sf}"></div>'
                 f'<div style="margin:6px 12px 0;height:8px;width:40%;border-radius:4px;background:{sf}"></div>'
                 f'<div class="btn" style="margin:14px 12px 0;background:{bb};color:{bt}">Entrar no close</div>')
    return (f'<div class="ph" style="width:132px;height:270px;background:{bg};color:{tx};{bd}">{inner}</div>')


def p08():
    cols = ""
    for th in THEMES:
        _id, nm, bg, sf, vs, (bb, bt), ac = th
        cols += (f'<div style="display:flex;flex-direction:column;align-items:center;gap:8px">'
                 f'<div style="display:flex;gap:6px">{phone(th, "abertura")}</div>'
                 f'<div style="display:flex;gap:6px">{phone(th, "inicio")}</div>'
                 f'<div class="nm" style="color:#fff">{nm}</div></div>')
    return page(8, "Nos seis temas do app", "Os mesmos temas do protótipo mobile (docs/prototipo-mobile). Em cima, a "
                "abertura com o símbolo; embaixo, o topo do Início com a marca só da estrela. A cor da marca segue a "
                "regra do fundo: no preto, rosa e branco; no branco, Pink Deep; no rosa e no roxo, tudo branco.",
                f'<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-top:12px;zoom:.86">{cols}</div>',
                dark=True)


def p09():
    cells = ""
    for th in THEMES:
        _id, nm, bg, sf, vs, (bb, bt), ac = th
        v = V[vs]
        tx = BLACK if bg == WHITE else WHITE
        bd = "border:1px solid #E6E6E6;" if bg == WHITE else ""
        app = "rosa" if vs == "branco" else vs
        cells += (f'<div style="background:{bg};color:{tx};border-radius:18px;padding:18px;{bd}">'
                  f'<div style="font:800 13px Gabarito;margin-bottom:12px">{nm}</div>{lock(v, 46)}'
                  f'<div style="display:flex;gap:12px;margin-top:16px;align-items:center">'
                  f'<div style="border-radius:14px;{"box-shadow:0 0 0 1.5px rgba(255,255,255,.55);" if V[app]["bg"] == bg else ""}">{tile(app, 62, None)}</div>'
                  f'<div style="width:62px;height:62px;border-radius:50%;background:{sf};display:flex;align-items:center;justify-content:center">{sym(v, 50)}</div>'
                  f'<div class="btn" style="background:{bb};color:{bt};padding:0 18px;height:34px;font-size:12px">Assinar</div></div></div>')
    return page(9, "Kit por tema", "Logo horizontal, ícone de app, avatar das redes e o botão principal, cada um sobre o fundo "
                "do seu tema. No tema branco o ícone de app continua rosa: na tela inicial do celular, a marca é o rosa.",
                f'<div class="grid" style="grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px">{cells}</div>')


def p10():
    pink_on = V["rosa"]
    bads = [
        (box({"bg": PINK}, svg(M.mark(dict(pink_on, dash=BLACK, line=BLACK, star=BLACK)), "5 5 90 90", 80), 110, 110), "Preto sobre o rosa"),
        (box({"bg": PURPLE}, svg(M.mark(dict(pink_on, dash=PINK, line=PINK, star=PINK)), "5 5 90 90", 80), 110, 110), "Rosa sobre o roxo"),
        (box({"bg": "#FFF6F0"}, svg(M.mark(V["branco"]), "5 5 90 90", 80), 110, 110), "Fundo creme"),
        (box({"bg": "#14090F"}, svg(M.mark(V["preto"]), "5 5 90 90", 80), 110, 110), "Quase-preto no lugar do preto"),
        (box({"bg": WHITE}, svg(f'<g transform="translate(50 50) scale(1.35 .8) translate(-50 -50)">{M.mark(V["branco"])}</g>', "5 5 90 90", 80), 110, 110), "Distorcer"),
        (box({"bg": WHITE}, svg(M.RING["carregando"][3](DEEP, DEEP) + M.macia(DEEP, 34), "5 5 90 90", 80), 110, 110), f"Estrela maior que o círculo de {f(M.STAR_FIT)}"),
        (box({"bg": WHITE}, svg(M.RING["carregando"][3](DEEP, DEEP) + M.macia(DEEP, M.STAR_FIT, dot=False), "5 5 90 90", 80), 110, 110), "Tirar o ponto da câmera"),
        (box({"bg": BLACK}, svg(M.mark(V["preto"]) + M.RING["cheio"][3](PINK, PINK), "5 5 90 90", 80), 110, 110), "Somar anéis"),
    ]
    bad = "".join(f'<div><div class="bad">{b}</div><div class="cap">{t}</div></div>' for b, t in bads)
    space = (f'<div style="position:relative;width:200px;height:200px;border:1px dashed {PINK};display:flex;align-items:center;'
             f'justify-content:center;border-radius:6px">{sym("branco", 130)}</div>')
    return page(10, "Regras de uso", "Respiro mínimo de 1/4 do símbolo em volta. Mínimos: símbolo com anel 32 px (abaixo "
                "disso, corte pequeno), ícone só da estrela 16 px. Não juntar a estrela ao c da palavra.",
                f'<div class="flex" style="margin-top:14px;gap:30px"><div><div class="lbl">Respiro</div>{space}</div>'
                f'<div><div class="lbl">Não fazer</div><div class="grid" style="grid-template-columns:repeat(4,110px);gap:12px 16px">{bad}</div></div></div>')


def p11():
    def frame(a):
        inner = f'<g transform="rotate({a} 50 50)">{M.RING[M.MAIN_RING][3](PINK, PINK)}</g>{M.macia(WHITE, M.STAR_FIT)}'
        return f'<div style="text-align:center">{box("preto", svg(inner, "5 5 90 90", 86), 110, 110)}<div class="cap">{a}°</div></div>'
    frames = "".join(frame(a) for a in (0, 60, 120, 180, 240, 300))
    files = [("svg/icone-{fundo}.svg", "Ícone (só a estrela) com fundo"), ("svg/simbolo-{fundo}.svg", "Símbolo com o anel carregando"),
             ("svg/simbolo-pequeno-{fundo}.svg", "Corte pequeno (≤ 32 px)"), ("svg/logo-horizontal-{com|sem}-anel-{fundo}.svg", "Lockups horizontais"),
             ("svg/logo-empilhado-{com|sem}-anel-{fundo}.svg", "Lockups empilhados"), ("svg/anel-{anel}-{preto|branco}.svg", "Os seis anéis"),
             ("svg/app-icon-{com|sem}-anel-{fundo}.svg", "Ícones de app 1024"), ("svg/loader-{fundo}.svg", "Loader animado (SMIL)"),
             ("_marca.py · _build.py", "Geradores: geometria e documento")]
    fl = "".join(f'<div style="display:flex;gap:12px;font-size:10.5px;padding:5px 0;border-bottom:1px solid #2A2A2A">'
                 f'<code style="width:300px;color:{PINK}">{a}</code><span style="opacity:.8">{b}</span></div>' for a, b in files)
    return page(11, "Loader e arquivos", "O anel gira em 2,4 s e a estrela fica parada: é o carregando do app. Com "
                "movimento reduzido, o anel fica parado.",
                f'<div style="display:flex;gap:12px;margin-top:14px">{frames}</div><div style="margin-top:20px">{fl}</div>',
                dark=True)


def build():
    pages = [p01(), p02(), p03(), p04(), p05(), p06(), p07(), p08(), p09(), p10(), p11()]
    assert len(pages) == TOTAL
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy · identidade Estrela macia</title>'
            f'<style>{CSS}</style></head><body>{"".join(pages)}</body></html>')
    OUT_HTML.write_text(html)
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer",
                    f"--print-to-pdf={OUT_PDF}", OUT_HTML.as_uri()], check=True, capture_output=True)
    print("pages", len(pages))


if __name__ == "__main__":
    build()

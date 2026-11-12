#!/usr/bin/env python3
"""Clozzy — identidade Estrela macia + VERDE CLOSE (estudo de variações).

Entra uma cor nova: o verde do selo de close friends (print em ../refs/Captura de Tela 2026-11-11 às 16.00.35.png),
medido em #69C353. Como ele tem quase a mesma luminância do Pink Deep (2,2:1 entre os dois) e não aguenta texto
branco (2,2:1), nasce junto um Verde Deep #13803A para superfície com texto branco (5,0:1) — a mesma lógica do Pink Deep.

Cinco variações para testar:
  A  Verde no lugar do roxo   · Pink Deep + verde (o lado da criadora vira verde) · roxo sai
  B  Estrela verde            · paleta atual; o verde é só do close (estrela, anel, selo, desfoque)
  C  Verde protagonista       · o verde vira a cor da marca; Pink Deep só no botão de compra · roxo sai
  D  Close friends puro       · só verde, preto e branco · rosa e roxo saem
  E  Quatro cores             · rosa = fã/compra · roxo = criadora · verde = close

Cada variação: paleta + marca nas superfícies + regras, e uma página de postagens (feed, story, conteúdo do close,
convite de criadora, capa tipográfica, tela do app). No fim, comparação lado a lado e recomendação.
Rodar: python3 _build.py → identidade-verde-close.html + .pdf + svg/ (marcas de cada variação)"""
import importlib.util, re, subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
MARCA = HERE.parent

_spec = importlib.util.spec_from_file_location("manual_v2", MARCA / "uso-da-marca-estrela-macia-v2" / "_build.py")
V2 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(V2)
V1, M, IB = V2.V1, V2.M, V2.IB

PINK, PURPLE, BLACK, WHITE = V2.DEEP, V2.PURPLE, V2.BLACK, V2.WHITE
VERDE, VDEEP = "#69C353", "#13803A"           # verde do print · verde para superfície com texto branco
G1, G2, G3, G4, L1, L2, L3 = V1.G1, V1.G2, V1.G3, V1.G4, V1.L1, V1.L2, V1.L3
TEMAS = V1.TEMAS
foto, btn, phone, ring_av = V2.foto, V2.btn, V2.phone, V2.ring_av
sym, lock, tile, svg, box = V2.sym, V2.lock, V2.tile, V2.svg, V2.box
REF = MARCA / "refs" / "Captura de Tela 2026-11-11 às 16.00.35.png"
OUT_HTML = HERE / "identidade-verde-close.html"
OUT_PDF = HERE / "identidade-verde-close.pdf"
SVG_DIR = HERE / "svg"

# TEMAS extras (mesmos papéis do manual) para as superfícies verdes
TEMAS["verde"] = dict(nome="Verde close", sup=VERDE, sup2="rgba(0,0,0,.12)", linha="rgba(0,0,0,.25)", titulo=BLACK, texto=BLACK,
                      apoio="rgba(0,0,0,.7)", destaque=BLACK, botao=BLACK, botao_txt=WHITE, cta=BLACK, cta_txt=WHITE, chip="rgba(0,0,0,.14)",
                      marca="x", uso="")
TEMAS["vdeep"] = dict(nome="Verde Deep", sup=VDEEP, sup2="#1E8F47", linha="#3FA463", titulo=WHITE, texto=WHITE, apoio="#D9F0E0",
                      destaque=WHITE, botao=WHITE, botao_txt=VDEEP, cta=WHITE, cta_txt=VDEEP, chip="#2A9550", marca="x", uso="")


def _lum(h):
    h = h.lstrip("#")
    v = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    v = [x / 12.92 if x <= .03928 else ((x + .055) / 1.055) ** 2.4 for x in v]
    return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]


def ratio(a, b):
    la, lb = _lum(a), _lum(b)
    return (max(la, lb) + .05) / (min(la, lb) + .05)


def mk(bg, ring, star, word, icon=None, line=None):
    """variante de marca: fundo, anel, estrela, palavra, ícone sozinho"""
    return dict(slug="", name="", bg=bg, dash=ring, line=line or ring, star=star, word=word, icon=icon or star, note="")


# ================================================================ as cinco variações
VARS = [
    dict(cod="A", nome="Verde no lugar do roxo", ideia="Pink Deep continua a cor da marca; o verde assume tudo que era do roxo: o lado da criadora, convites e o painel. O verde do print entra como brilho no preto; o Verde Deep é a superfície com texto branco.",
         cores=[("Pink Deep", PINK, "marca, compra, destaque"), ("Verde close", VERDE, "estrela do close, brilho no preto"), ("Verde Deep", VDEEP, "superfície da criadora"),
                ("Preto", BLACK, "fundo principal"), ("Branco", WHITE, "fundo claro")],
         marcas=[("No preto", mk(BLACK, PINK, WHITE, WHITE, PINK)), ("No branco", mk(WHITE, PINK, PINK, BLACK)), ("No Pink Deep", mk(PINK, WHITE, WHITE, WHITE)),
                 ("No Verde Deep", mk(VDEEP, WHITE, WHITE, WHITE)), ("No verde close", mk(VERDE, BLACK, BLACK, BLACK)), ("Close no preto", mk(BLACK, VERDE, WHITE, WHITE, VERDE))],
         fa=dict(base="preto", destaque=PINK, cta=PINK, cta_txt=WHITE), close=VERDE, cri="vdeep", capa="rosa",
         regras=["Pink Deep e verde nunca um sobre o outro: mesma luminância, a borda vibra.", "No verde close, tudo preto (branco não lê: 2,2:1).",
                 "No Verde Deep, tudo branco, como no Pink Deep.", "O roxo sai da paleta."]),
    dict(cod="B", nome="Estrela verde", ideia="A paleta atual fica. O verde vira uma peça só: a estrela do close. Aparece no selo, no anel de quem tem close ativo e no conteúdo trancado — exatamente onde o Instagram usa o verde.",
         cores=[("Pink Deep", PINK, "marca, compra"), ("Roxo", PURPLE, "lado da criadora"), ("Verde close", VERDE, "só a estrela do close"),
                ("Preto", BLACK, "fundo principal"), ("Branco", WHITE, "fundo claro")],
         marcas=[("No preto", mk(BLACK, PINK, WHITE, WHITE, PINK)), ("Preto · estrela verde", mk(BLACK, PINK, VERDE, WHITE, VERDE)), ("No branco", mk(WHITE, PINK, PINK, BLACK)),
                 ("No Pink Deep", mk(PINK, WHITE, WHITE, WHITE)), ("No roxo", mk(PURPLE, WHITE, WHITE, WHITE)), ("Selo do close", mk(VERDE, BLACK, WHITE, BLACK, WHITE))],
         fa=dict(base="preto", destaque=PINK, cta=PINK, cta_txt=WHITE), close=VERDE, cri="roxo", capa="rosa",
         regras=["Verde só na estrela do close: selo, anel ativo, trancado. Nunca em fundo de tela.", "Estrela verde dentro do anel rosa só no preto.",
                 "Verde nunca encosta no roxo nem no Pink Deep.", "Logo principal continua o do manual."]),
    dict(cod="C", nome="Verde protagonista", ideia="O verde vira a cor da marca: anel verde e estrela branca no preto, como o close friends. O Pink Deep fica num lugar só, o botão de compra, para a receita continuar quente.",
         cores=[("Verde close", VERDE, "marca, anel, destaque"), ("Verde Deep", VDEEP, "superfície, texto verde no branco"), ("Pink Deep", PINK, "só o botão de compra"),
                ("Preto", BLACK, "fundo principal"), ("Branco", WHITE, "fundo claro")],
         marcas=[("No preto", mk(BLACK, VERDE, WHITE, WHITE, VERDE)), ("No branco", mk(WHITE, VDEEP, VDEEP, BLACK)), ("No verde close", mk(VERDE, BLACK, BLACK, BLACK)),
                 ("No Verde Deep", mk(VDEEP, WHITE, WHITE, WHITE)), ("Preto bicolor", mk(BLACK, WHITE, VERDE, WHITE, VERDE, VERDE)), ("Uma cor", mk(BLACK, WHITE, WHITE, WHITE))],
         fa=dict(base="preto", destaque=VERDE, cta=PINK, cta_txt=WHITE), close=VERDE, cri="vdeep", capa="verde",
         regras=["No branco, o verde vira Verde Deep (o close não lê no branco: 2,2:1).", "Pink Deep só no botão de compra, sempre sobre preto ou branco.",
                 "No verde close, marca e texto pretos.", "O roxo sai da paleta."]),
    dict(cod="D", nome="Close friends puro", ideia="Só verde, preto e branco. A leitura mais direta do close friends: a lista verde dos amigos próximos. Some o rosa e o roxo; a marca fica mais simples e mais parecida com o selo.",
         cores=[("Verde close", VERDE, "marca, compra, destaque"), ("Verde Deep", VDEEP, "texto e botão no branco"),
                ("Preto", BLACK, "fundo principal"), ("Branco", WHITE, "fundo claro")],
         marcas=[("No preto", mk(BLACK, VERDE, WHITE, WHITE, VERDE)), ("No preto · tudo verde", mk(BLACK, VERDE, VERDE, WHITE, VERDE)), ("No branco", mk(WHITE, VDEEP, VDEEP, BLACK)),
                 ("No verde close", mk(VERDE, WHITE, WHITE, BLACK, WHITE)), ("No Verde Deep", mk(VDEEP, WHITE, WHITE, WHITE)), ("Uma cor", mk(WHITE, BLACK, BLACK, BLACK))],
         fa=dict(base="preto", destaque=VERDE, cta=VERDE, cta_txt=BLACK), close=VERDE, cri="vdeep", capa="verde",
         regras=["Botão de compra verde com texto preto (9,5:1).", "No verde close, estrela branca como o selo; palavra e texto pretos.",
                 "Rosa e roxo saem da paleta.", "Risco: fica perto demais do Instagram; a estrela macia e o anel seguram a diferença."]),
    dict(cod="E", nome="Quatro cores", ideia="Cada cor tem um papel: Pink Deep é a fã e a compra, roxo é a criadora, verde é o close (o conteúdo exclusivo). A marca principal não muda; o sistema ganha uma cor de significado.",
         cores=[("Pink Deep", PINK, "fã, compra"), ("Roxo", PURPLE, "criadora"), ("Verde close", VERDE, "close: exclusivo, trancado, ativo"), ("Verde Deep", VDEEP, "superfície do close"),
                ("Preto", BLACK, "fundo"), ("Branco", WHITE, "fundo claro")],
         marcas=[("No preto", mk(BLACK, PINK, WHITE, WHITE, PINK)), ("No branco", mk(WHITE, PINK, PINK, BLACK)), ("No Pink Deep", mk(PINK, WHITE, WHITE, WHITE)),
                 ("No roxo", mk(PURPLE, WHITE, WHITE, WHITE)), ("No Verde Deep", mk(VDEEP, WHITE, WHITE, WHITE)), ("Close no preto", mk(BLACK, VERDE, WHITE, WHITE, VERDE))],
         fa=dict(base="preto", destaque=PINK, cta=PINK, cta_txt=WHITE), close=VERDE, cri="roxo", capa="vdeep",
         regras=["Uma cor de papel por peça além de preto e branco (no máximo duas).", "Rosa, roxo e verde nunca um sobre o outro.",
                 "Verde é sempre o close: se não é exclusivo, não é verde.", "Risco: três cores fortes viram carnaval; exige disciplina."]),
]

for i, v in enumerate(VARS):                  # registra as marcas para logo_app / lock por nome
    for j, (_n, m) in enumerate(v["marcas"]):
        m["slug"] = f"{v['cod'].lower()}{j}"
        M.V[m["slug"]] = m


def tema_fa(v):
    T = dict(TEMAS[v["fa"]["base"]])
    T.update(destaque=v["fa"]["destaque"], cta=v["fa"]["cta"], cta_txt=v["fa"]["cta_txt"], marca=v["marcas"][0][1]["slug"])
    return T


def tema_cri(v):
    T = dict(TEMAS[v["cri"]])
    branca = mk(T["sup"], WHITE, WHITE, WHITE)
    branca["slug"] = f"{v['cod'].lower()}-cri"
    M.V[branca["slug"]] = branca
    T["marca"] = branca["slug"]
    return T


# ================================================================ peças
def selo(cor, fg, label="CLOSE", fs=8):
    return (f'<span style="display:inline-flex;align-items:center;gap:3px;height:{fs * 1.9}px;padding:0 {fs * .75}px;border-radius:999px;background:{cor};'
            f'color:{fg};font:800 {fs}px Figtree;letter-spacing:.02em">{svg(M.macia(fg, 40, dot=False), "5 5 90 90", fs * 1.1)}{label}</span>')


def tk(text, bg, fg, fs=13):
    return (f'<span style="display:inline-block;font:800 {fs}px/1.12 Gabarito;letter-spacing:-.02em;padding:.16em .5em;border-radius:.32em;'
            f'white-space:nowrap;background:{bg};color:{fg}">{text}</span>')


def tkl(lines, fs=13, gap=3):
    return f'<div style="display:flex;flex-direction:column;align-items:flex-start;gap:{gap}px">' + "".join(tk(t, b, c, fs) for t, b, c in lines) + '</div>'


def pill_marca(h=10):
    return f'<span style="display:inline-flex;align-items:center;background:#000;border-radius:999px;padding:4px 7px">{lock("mono-branco", h, None)}</span>'


def fg_on(c):
    return BLACK if c == VERDE else WHITE


def bt(label, bg, fg, h=22, fs=8.5):
    return f'<span class="bt" style="height:{h}px;font-size:{fs}px;background:{bg};color:{fg};padding:0 12px">{label}</span>'


def ring_close(name, px, cor):
    return (f'<div style="width:{px}px;height:{px}px;border-radius:50%;border:2px dashed {cor};padding:2px;flex-shrink:0">'
            f'<div class="ft f-{name}" style="width:100%;height:100%;border-radius:50%;background-size:260%;background-position:50% 20%"></div></div>')


W1, H45, H916 = 150, 188, 266


def post_feed(v):
    cta = v["fa"]["cta"]
    return (f'<div style="position:relative">{foto("ringlight-sorriso", W1, H45, 12, "50% 25%")}<div style="position:absolute;left:8px;top:8px">{pill_marca()}</div>'
            f'<div style="position:absolute;left:8px;bottom:10px">{tkl([("Seu close,", BLACK, WHITE), ("seu preço.", cta, fg_on(cta))], 14, 3)}</div></div>')


def post_story(v):
    c, cta = v["close"], v["fa"]["cta"]
    return (f'<div style="position:relative">{foto("espelho-casaco", W1, H916, 12, "50% 25%")}'
            f'<div style="position:absolute;top:8px;left:8px;right:8px;display:flex;gap:3px">' + "".join(f'<i style="flex:1;height:2.5px;border-radius:2px;background:#fff;opacity:{1 if k < 2 else .4}"></i>' for k in range(4)) + '</div>'
            f'<div style="position:absolute;left:8px;top:18px;display:flex;align-items:center;gap:5px">{ring_close("espelho-casaco", 22, c)}<b style="font:800 8px Gabarito;color:#fff">mel.rocha</b>{selo(c, fg_on(c), "CLOSE", 6.5)}</div>'
            f'<div style="position:absolute;left:8px;bottom:44px">{tkl([("look do dia", WHITE, BLACK), ("no close da Mel", BLACK, WHITE)], 12, 3)}</div>'
            f'<div style="position:absolute;left:8px;bottom:12px">{bt("Entrar no close", cta, fg_on(cta))}</div></div>')


def post_trancado(v):
    c = v["close"]
    lk = (f'<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:3">'
          f'<span style="width:44px;height:44px;border-radius:50%;background:{c};display:flex;align-items:center;justify-content:center">{svg(M.macia(WHITE, 40), "5 5 90 90", 26)}</span></div>')
    return (f'<div style="position:relative">{foto("make-mesa", W1, H916, 12, None, True)}{lk}'
            f'<div style="position:absolute;left:0;right:0;bottom:16px;text-align:center;z-index:3">{tk("Só pro close.", c, fg_on(c), 14)}</div></div>')


def post_convite(v):
    T = TEMAS[v["cri"]]
    return (f'<div style="width:{W1}px;height:{H916}px;border-radius:12px;overflow:hidden;background:{T["sup"]}">{foto("vlog-tripe", W1, 158, 0)}'
            f'<div style="padding:10px"><div class="d" style="font-size:17px;color:{T["titulo"]}">Abra o<br>seu close.</div>'
            f'<div style="font:600 7.5px/1.4 Figtree;color:{T["apoio"]};margin-top:4px">você define o preço, recebe no Pix</div>'
            f'<div style="margin-top:8px">{bt("Quero vender", T["botao"], T["botao_txt"])}</div></div></div>')


def post_capa(v):
    T = TEMAS[v["capa"]]
    m = next((m for n, m in v["marcas"] if m["bg"] == T["sup"]), mk(T["sup"], WHITE, WHITE, WHITE))
    return (f'<div style="width:{W1}px;height:{H45}px;border-radius:12px;background:{T["sup"]};padding:12px;display:flex;flex-direction:column;justify-content:space-between">'
            f'{sym(m, 46)}<div class="d" style="font-size:22px;color:{T["titulo"]}">Seu close,<br>seu preço.</div>'
            f'<div style="font:700 7.5px Figtree;color:{T["apoio"]}">link na bio</div></div>')


_TAB = V1.tabbar


def _tab(T, on=0, cri=False):
    T2 = dict(T, destaque=T.get("tab", T["destaque"]))
    return _TAB(T2, on, cri)


V1.tabbar = _tab
V1.selo = lambda T, label="CLOSE": selo(T["destaque"], fg_on(T["destaque"]), label, 8)


def post_app(v, w=150, h=306):
    T = tema_fa(v)
    T.update(tab=T["destaque"], destaque=v["close"])
    return phone(V1.s_inicio(T), T, w, h)


def anuncio(v):
    T = TEMAS[v["capa"]]
    return (f'<div style="width:300px;height:157px;border-radius:12px;overflow:hidden;display:flex;background:{T["sup"]}">{foto("amigas-selfie", 140, 157, 0, "50% 30%")}'
            f'<div style="padding:12px;display:flex;flex-direction:column;justify-content:space-between">{lock(next((m for n, m in v["marcas"] if m["bg"] == T["sup"]), mk(T["sup"], WHITE, WHITE, WHITE)), 14, None)}'
            f'<div class="d" style="font-size:18px;color:{T["titulo"]}">Close friends<br>que pagam.</div>'
            f'<div>{bt("Criar meu close", T["botao"], T["botao_txt"])}</div></div></div>')


def destaques(v):
    cores = [c for _n, c, _u in v["cores"] if c not in (BLACK, WHITE)] + [WHITE]
    nomes = ["close", "packs", "lives", "bastidor", "faq"]
    out = ""
    for i, n in enumerate(nomes):
        c = cores[i % len(cores)]
        out += (f'<div style="text-align:center"><span style="width:44px;height:44px;border-radius:50%;border:1.5px solid {G3};padding:2px;display:inline-block">'
                f'<span style="width:100%;height:100%;border-radius:50%;background:{c};display:flex;align-items:center;justify-content:center">{svg(M.macia(fg_on(c) if c != WHITE else BLACK, 40), "5 5 90 90", 20)}</span></span>'
                f'<div style="font:600 7.5px Figtree;color:#fff;margin-top:3px">{n}</div></div>')
    return f'<div style="width:290px;border-radius:12px;background:#000;padding:12px 14px;display:flex;justify-content:space-between">{out}</div>'


def push(v):
    m = v["marcas"][1][1] if v["cod"] == "B" else v["marcas"][0][1]
    return (f'<div style="width:290px;border-radius:14px;background:{L1};padding:9px 11px;display:flex;gap:9px;align-items:center;margin-top:8px">{tile(m, 30, None)}'
            f'<div style="flex:1"><div style="display:flex;justify-content:space-between;font:700 8.5px Figtree"><b>Clozzy</b><span style="color:{L3}">agora</span></div>'
            f'<div style="font:500 9px Figtree;margin-top:1px">a Lara postou no close 💗</div></div></div>')


def selo_close_grande(v):
    c = v["close"]
    return (f'<div style="width:{W1}px;height:157px;border-radius:12px;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px">'
            f'<span style="width:74px;height:74px;border-radius:50%;background:{c};display:flex;align-items:center;justify-content:center">{svg(M.macia(WHITE, 40), "5 5 90 90", 44)}</span>'
            f'{selo(c, fg_on(c), "CLOSE ATIVO", 8)}</div>')


# ================================================================ páginas
page = V1.page
SEC = [""]


def foot(n, t):
    dark = TEMAS[t]["sup"] != WHITE
    return (f'<div class="foot" style="color:{WHITE if dark else BLACK}"><span>Clozzy · identidade + verde close · estudo de variações · {SEC[0]}</span>'
            f'<span>{n:02d}</span></div>')


V1.foot = foot


def swatches(cores, dark=True, h=56):
    fg = "#fff" if dark else "#000"
    return ('<div style="display:flex;gap:8px">' + "".join(
        f'<div style="width:92px"><div style="height:{h}px;border-radius:10px;background:{c};border:1px solid {G3 if dark else L2}"></div>'
        f'<div style="font:800 10.5px Gabarito;color:{fg};margin-top:5px">{n}</div><div class="num" style="font:700 8.5px Figtree;color:{G4 if dark else L3}">{c}</div>'
        f'<div style="font:500 8px/1.3 Figtree;color:{G4 if dark else L3};margin-top:1px">{u}</div></div>' for n, c, u in cores) + '</div>')


def p_capa():
    SEC[0] = "capa"
    strip = "".join(f'<div style="text-align:center">{tile(v["marcas"][0][1] if v["cod"] not in "B" else v["marcas"][1][1], 74)}'
                    f'<div style="font:800 11px Gabarito;color:#fff;margin-top:6px">{v["cod"]}</div><div style="font:600 8.5px Figtree;color:{G4};max-width:90px">{v["nome"]}</div></div>' for v in VARS)
    body = (f'<div style="display:flex;flex-direction:column;justify-content:space-between;height:100%">'
            f'<div style="display:flex;justify-content:space-between;align-items:flex-start"><div><div class="lbl" style="color:{VERDE};opacity:1">estudo · nov 2026</div>'
            f'<h1 style="color:#fff">Estrela macia<br>+ verde close</h1><p class="lead" style="color:{G4};max-width:420px;margin-top:14px">'
            f'Uma cor nova, o verde do selo de close friends, testada em cinco variações de paleta, com marca, regras e postagens de exemplo em cada uma.</p></div>'
            f'<span style="width:150px;height:150px;border-radius:50%;background:{VERDE};display:flex;align-items:center;justify-content:center">{svg(M.macia(WHITE, 40), "5 5 90 90", 90)}</span></div>'
            f'<div style="display:flex;gap:22px;padding-bottom:12mm">{strip}</div></div>')
    page(None, body, "preto")


def p_referencia():
    SEC[0] = "referência"
    ref = V1.b64(REF, "image/png")
    pares = [("Branco no verde close", WHITE, VERDE), ("Preto no verde close", BLACK, VERDE), ("Branco no Verde Deep", WHITE, VDEEP),
             ("Verde close no preto", VERDE, BLACK), ("Verde Deep no branco", VDEEP, WHITE), ("Verde close × Pink Deep", VERDE, PINK)]
    def nota(r):
        return "AA" if r >= 4.5 else ("só grande" if r >= 3 else "não usar p/ texto")
    tab = "".join(f'<tr><td><span style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:20px;border-radius:5px;background:{b};color:{a};font:900 11px Gabarito;'
                  f'margin-right:8px;vertical-align:middle;border:1px solid {L2}">Aa</span>{n}</td><td class="num"><b>{ratio(a, b):.1f}:1</b></td><td>{nota(ratio(a, b))}</td></tr>' for n, a, b in pares)
    vibra = (f'<div style="display:flex;border-radius:12px;overflow:hidden;width:260px;height:70px"><i style="flex:1;background:{PINK}"></i><i style="flex:1;background:{VERDE}"></i></div>'
             f'<div class="cap">Encostados, Pink Deep e verde vibram: mesma luminância, cores opostas.</div>'
             f'<div style="display:flex;border-radius:12px;overflow:hidden;width:260px;height:70px;margin-top:10px"><i style="flex:1;background:{PINK}"></i><i style="flex:.22;background:#000"></i><i style="flex:1;background:{VERDE}"></i></div>'
             f'<div class="cap">Com preto ou branco entre eles, convivem.</div>')
    page("A referência", f'<div class="row" style="margin-top:14px;gap:34px"><div><div class="lbl">Print do selo de close friends</div>'
         f'<img src="{ref}" style="width:150px;border-radius:14px;display:block"><div class="cap">refs/Captura de Tela 2026-11-11 às 16.00.35.png</div>'
         f'<div style="display:flex;gap:10px;margin-top:14px">' + "".join(
             f'<div><div style="width:70px;height:70px;border-radius:12px;background:{c}"></div><div style="font:800 10px Gabarito;margin-top:4px">{n}</div><div class="cap num" style="margin-top:0">{c}</div></div>'
             for n, c in (("Verde close", VERDE), ("Verde Deep", VDEEP))) + '</div></div>'
         f'<div style="flex:1"><div class="lbl">Contraste (WCAG 2)</div><table>{tab}</table>'
         f'<div style="font:500 10.5px/1.6 Figtree;color:{L3};margin-top:12px">O verde do print é claro: texto branco em cima não lê. Por isso ele vem com um par, o <b>Verde Deep</b>, '
         f'escuro o bastante para texto branco e para aparecer no fundo branco. É a mesma dupla que o rosa já tem (o rosa claro saiu, ficou o Pink Deep).</div></div>'
         f'<div><div class="lbl">Verde × Pink Deep</div>{vibra}</div></div>', "branco",
         "O verde medido no print é #69C353. Antes de testar combinações, o que ele aguenta e o que não aguenta.")


def p_panorama():
    SEC[0] = "panorama"
    cols = ""
    for v in VARS:
        faixa = "".join(f'<i style="flex:1;background:{c}"></i>' for _n, c, _u in v["cores"])  # gap preto entre as cores
        m0 = v["marcas"][1][1] if v["cod"] == "B" else v["marcas"][0][1]
        cols += (f'<div><div class="d" style="font-size:40px;color:{VERDE if v["cod"] in "CD" else PINK}">{v["cod"]}</div><h3 style="color:#fff;font-size:14px;margin-top:4px">{v["nome"]}</h3>'
                 f'<div style="display:flex;gap:3px;height:16px;margin-top:10px">{faixa.replace("<i ", "<i class=fx ")}</div>'
                 f'<div style="margin-top:12px">{box(m0, sym(m0, 90), 168, 120, "border:1px solid #333")}</div>'
                 f'<div style="margin-top:8px">{box(m0, lock(m0, 22), 168, 46, "border:1px solid #333")}</div>'
                 f'<p style="font:500 9.5px/1.5 Figtree;color:#E6E6E6;margin-top:10px">{v["ideia"]}</p></div>')
    page("As cinco variações", f'<div class="grid" style="grid-template-columns:repeat(5,1fr);gap:18px;margin-top:12px">{cols}</div>', "preto",
         "Da mais conservadora (B, só a estrela verde) à mais radical (D, sem rosa). A pediu: o verde no lugar do roxo.")


def p_var(v):
    SEC[0] = f"variação {v['cod']}"
    marcas = "".join(f'<div>{box(m, sym(m, 70), 108, 96, "border:1px solid #333" if m["bg"] == BLACK else "")}<div class="cap" style="color:#E6E6E6">{n}</div></div>' for n, m in v["marcas"])
    locks = "".join(box(m, lock(m, 24), 220, 56, "border:1px solid #333" if m["bg"] == BLACK else "") for _n, m in v["marcas"][:4])
    tiles = "".join(tile(m, 54, None) for _n, m in v["marcas"][:5] if m["bg"] != WHITE)
    regras = "".join(f'<div style="display:flex;gap:8px;padding:5px 0;border-bottom:1px solid {G3};font:500 10px/1.45 Figtree;color:#E6E6E6">'
                     f'<span class="ok" style="background:{v["close"]};color:#000;flex-shrink:0">!</span>{r}</div>' for r in v["regras"])
    page(f'{v["cod"]} · {v["nome"]}', f'<div class="row" style="margin-top:10px;gap:28px"><div style="flex:1.5">'
         f'<div class="lbl" style="color:#fff">Paleta</div>{swatches(v["cores"])}'
         f'<div class="lbl" style="color:#fff;margin-top:14px">Símbolo nas superfícies</div><div style="display:grid;grid-template-columns:repeat(6,108px);gap:8px">{marcas}</div></div>'
         f'<div style="flex:1"><div class="lbl" style="color:#fff">Logo</div><div class="grid" style="grid-template-columns:1fr;gap:6px">{locks}</div>'
         f'<div class="lbl" style="color:#fff;margin-top:12px">Ícone de app</div><div style="display:flex;gap:8px">{tiles}</div>'
         f'<div class="lbl" style="color:#fff;margin-top:12px">Regras</div>{regras}</div></div>',
         "preto", v["ideia"])


def p_posts(v):
    pecas = [(post_feed(v), "Feed 4:5 · foto + legenda"), (post_capa(v), "Capa tipográfica"), (post_story(v), "Story · close ativo"),
             (post_trancado(v), "Conteúdo do close"), (post_convite(v), "Convite de criadora"), (post_app(v), "App · início")]
    cells = "".join(f'<div>{x}<div class="cap">{t}</div></div>' for x, t in pecas)
    row2 = (f'<div>{anuncio(v)}<div class="cap">Anúncio 1,91:1</div></div>'
            f'<div>{destaques(v)}{push(v)}<div class="cap">Destaques do perfil · notificação</div></div>'
            f'<div>{selo_close_grande(v)}<div class="cap">Selo do close</div></div>')
    page(f'{v["cod"]} · postagens', f'<div style="display:flex;gap:12px;margin-top:10px;align-items:flex-start">{cells}</div>'
         f'<div style="display:flex;gap:18px;margin-top:10px;align-items:flex-start">{row2}</div>', "branco",
         f'As mesmas dez peças em todas as variações, para comparar. Aqui: {v["nome"].lower()}.')


def p_comparar():
    SEC[0] = "comparação"
    linha1 = "".join(f'<div><div class="d" style="font-size:22px;margin-bottom:6px">{v["cod"]}</div>{post_story(v)}</div>' for v in VARS)
    page("Lado a lado · story do close", f'<div style="display:flex;gap:14px;margin-top:12px">{linha1}</div>'
         f'<div style="font:500 10.5px/1.6 Figtree;color:{L3};margin-top:14px;max-width:820px">A foto e a legenda são as mesmas; muda o anel do avatar, o selo e o botão. '
         f'Em A, B e E o botão continua Pink Deep e só o close é verde: a peça ganha o sinal de “amigos próximos” sem perder a cara da Clozzy.</div>', "branco",
         "A peça que mais muda com o verde.")


def p_comparar_app():
    phones = "".join(f'<div style="text-align:center">{post_app(v)}<div class="cap" style="color:#fff">{v["cod"]} · {v["nome"]}</div></div>' for v in VARS)
    icons = "".join(f'<div style="text-align:center">{tile(v["marcas"][1][1] if v["cod"] == "B" else v["marcas"][0][1], 64, None)}<div class="cap" style="color:#fff">{v["cod"]}</div></div>' for v in VARS)
    page("Lado a lado · app e ícone", f'<div style="display:flex;gap:12px;margin-top:12px">{phones}</div>'
         f'<div style="display:flex;gap:18px;margin-top:14px">{icons}</div>', "preto", "Tela inicial da fã e ícone na tela do celular.")


def p_recomendacao():
    SEC[0] = "recomendação"
    itens = [("B · Estrela verde", "Mais segura. Muda pouco, mas o verde cai exatamente no gesto que todo mundo já conhece (close friends). Não exige refazer o manual, só o selo, o anel ativo e o trancado.", PINK),
             ("A · Verde no lugar do roxo", "A que você pediu. Funciona se o verde ficar com a criadora: o app ganha dois lados bem distintos. Exige separar rosa e verde com preto ou branco em toda peça.", VDEEP),
             ("E · Quatro cores", "A mais rica em significado, a mais difícil de manter. Boa se o produto tiver muitos estados (fã, criadora, close).", PURPLE),
             ("C e D · Verde como marca", "Mais diferentes do que existe hoje. D fica perto demais do Instagram; C perde o rosa, que é o que a marca tem de mais reconhecível.", G3)]
    cards = "".join(f'<div style="border-top:3px solid {c};padding-top:12px"><h3 style="color:#fff;font-size:16px">{t}</h3><p style="font:500 11px/1.6 Figtree;color:#E6E6E6;margin-top:8px">{d}</p></div>' for t, d, c in itens)
    page("Leitura e próximos passos", f'<div class="grid" style="grid-template-columns:repeat(4,1fr);gap:22px;margin-top:20px">{cards}</div>'
         f'<div style="font:500 11px/1.6 Figtree;color:{G4};margin-top:30px;max-width:760px">Para decidir: escolha uma variação (ou uma mistura, por exemplo A com a estrela verde de B) e eu atualizo a identidade, '
         f'o manual de uso e o design system (tokens com --cz-verde e --cz-verde-deep).</div>', "preto",
         "Minha leitura das cinco. A decisão é sua.")


# ================================================================ svg avulsos
def write_svgs():
    SVG_DIR.mkdir(exist_ok=True)
    for f_ in SVG_DIR.glob("*.svg"):
        f_.unlink()
    for v in VARS:
        for n, m in v["marcas"]:
            slug = re.sub(r"[^a-z0-9]+", "-", n.lower().replace("ú", "u").replace("ç", "c").replace("í", "i").replace("á", "a")).strip("-")
            (SVG_DIR / f"{v['cod'].lower()}-simbolo-{slug}.svg").write_text(M.sym_svg(m, bg=True))
            (SVG_DIR / f"{v['cod'].lower()}-logo-{slug}.svg").write_text(M.lockup_svg(m))


def build():
    p_capa()
    p_referencia()
    p_panorama()
    for v in VARS:
        p_var(v)
        p_posts(v)
    p_comparar()
    p_comparar_app()
    p_recomendacao()
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy · identidade + verde close</title>'
            f'<style>{V1.CSS}{V2.PHOTO_CSS}.fx{{border-radius:4px;border:1px solid #2A2A2A}}</style></head><body>{"".join(V1.PAGES)}</body></html>')
    assert "#ff0065" not in html.lower()
    OUT_HTML.write_text(html)
    write_svgs()
    subprocess.run([V1.CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer", "--virtual-time-budget=6000",
                    f"--print-to-pdf={OUT_PDF}", OUT_HTML.as_uri()], check=True, capture_output=True)
    print("pages", len(V1.PAGES))


if __name__ == "__main__":
    build()

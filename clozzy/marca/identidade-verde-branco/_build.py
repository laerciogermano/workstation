#!/usr/bin/env python3
"""Clozzy — identidade Estrela macia · verde close, branco no verde, sem o ponto.

Parte de ../identidade-verde-detalhe (paleta de hoje + um tom só de verde, #69C353, em detalhes do close) com duas mudanças:
  1. No verde, tudo BRANCO em cima (estrela, texto do selo, check) — nada preto sobre o verde.
  2. SEM o ponto da câmera: em todas as marcas fica só a estrela macia e o arco em volta.
Contraste: branco no verde é 2,2:1 (abaixo do AA). Por isso o texto branco no verde fica restrito a rótulos curtos
em peso 800+ (selo, tag), nunca frase.
Rodar: python3 _build.py → identidade-verde-branco.html + .pdf + svg/"""
import importlib.util, subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
MARCA = HERE.parent

_spec = importlib.util.spec_from_file_location("estudo_verde", MARCA / "identidade-verde-close" / "_build.py")
G = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(G)
V1, V2, M = G.V1, G.V2, G.M
PINK, PURPLE, BLACK, WHITE, VERDE = G.PINK, G.PURPLE, G.BLACK, G.WHITE, G.VERDE
G1, G2, G3, G4, L1, L2, L3 = G.G1, G.G2, G.G3, G.G4, G.L1, G.L2, G.L3
TEMAS, mk, ratio = G.TEMAS, G.mk, G.ratio
sym, lock, tile, svg, box, foto, phone = G.sym, G.lock, G.tile, G.svg, G.box, G.foto, G.phone
tk, tkl, bt, selo, ring_close, pill_marca = G.tk, G.tkl, G.bt, G.selo, G.ring_close, G.pill_marca
OUT_HTML = HERE / "identidade-verde-branco.html"
OUT_PDF = HERE / "identidade-verde-branco.pdf"
SVG_DIR = HERE / "svg"
REF = MARCA / "refs" / "Captura de Tela 2026-11-11 às 16.00.35.png"

# ---------------------------------------------------------------- nesta versão não existe mais o ponto da câmera
_macia = M.macia


def macia(c, fit=M.STAR_FIT, cx=50, cy=50, dot=True):
    return _macia(c, fit, cx, cy, dot=False)


M.macia = macia
_fg = G.fg_on
G.fg_on = lambda c: WHITE if c == VERDE else _fg(c)       # no verde, tudo branco


MARCAS = [("No preto", mk(BLACK, PINK, WHITE, WHITE, PINK)), ("No branco", mk(WHITE, PINK, PINK, BLACK)), ("No Pink Deep", mk(PINK, WHITE, WHITE, WHITE)),
          ("No roxo", mk(PURPLE, WHITE, WHITE, WHITE)), ("No verde · tudo branco", mk(VERDE, WHITE, WHITE, WHITE)),
          ("Close no preto · anel verde", mk(BLACK, VERDE, WHITE, WHITE, VERDE))]
for j, (_n, m) in enumerate(MARCAS):
    m["slug"] = f"vd{j}"
    M.V[m["slug"]] = m

V = dict(cod="V", nome="Verde em detalhe", ideia="", marcas=MARCAS,
         cores=[("Pink Deep", PINK, ""), ("Roxo", PURPLE, ""), ("Verde close", VERDE, ""), ("Preto", BLACK, ""), ("Branco", WHITE, "")],
         fa=dict(base="preto", destaque=PINK, cta=PINK, cta_txt=WHITE), close=VERDE, cri="roxo", capa="rosa", regras=[])
ATUAL = dict(V, close=PINK, nome="Hoje")          # para o antes/depois
G.VARS = [V]

SEC = G.SEC
page = V1.page


def foot(n, t):
    dark = TEMAS[t]["sup"] != WHITE
    return (f'<div class="foot" style="color:{WHITE if dark else BLACK}"><span>Clozzy · Estrela macia · verde close, branco no verde, sem ponto · {SEC[0]}</span>'
            f'<span>{n:02d}</span></div>')


V1.foot = foot


def estrela_verde(px=44, star=None):
    """o detalhe-mãe: círculo verde com a estrela macia branca (como o selo do close friends)"""
    return (f'<span style="width:{px}px;height:{px}px;border-radius:50%;background:{VERDE};display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">'
            f'{svg(M.macia(star or WHITE, 40), "5 5 90 90", px * .58)}</span>')


def selo_pilula(label="CLOSE", fs=8):
    """selo para fundo colorido (rosa, roxo) ou foto: pílula preta com a estrela verde"""
    return (f'<span style="display:inline-flex;align-items:center;gap:4px;height:{fs * 2}px;padding:0 {fs * .8}px 0 {fs * .3}px;border-radius:999px;background:#000;'
            f'color:#fff;font:800 {fs}px Figtree;letter-spacing:.02em;white-space:nowrap">{estrela_verde(fs * 1.5)}{label}</span>')


def blur_foto(name, w, h, r=12, pos=None):
    """foto do close desfocada, sem a estrela padrão (a estrela verde vai por cima)"""
    return foto(name, w, h, r, pos).replace('class="ft f-', 'class="ft blur f-', 1)


def check_verde(px=18):
    return (f'<span style="width:{px}px;height:{px}px;border-radius:50%;background:{VERDE};display:inline-flex;align-items:center;justify-content:center;'
            f'color:#fff;font:900 {px * .6}px Gabarito">✓</span>')


# ================================================================ páginas
def p_capa():
    SEC[0] = "capa"
    dets = (f'<div style="display:flex;gap:16px;align-items:center">{selo(VERDE, WHITE, "CLOSE", 10)}{ring_close("ringlight-rosa", 46, VERDE)}{estrela_verde(40)}'
            f'{check_verde(26)}<i style="width:12px;height:12px;border-radius:50%;background:{VERDE}"></i>{selo_pilula("DO CLOSE", 9)}</div>')
    body = (f'<div style="display:flex;flex-direction:column;justify-content:space-between;height:100%">'
            f'<div style="display:flex;justify-content:space-between;align-items:flex-start"><div><div class="lbl" style="color:{VERDE};opacity:1">identidade · nov 2026</div>'
            f'<h1 style="color:#fff">Estrela macia<br>+ verde close</h1><p class="lead" style="color:{G4};max-width:430px;margin-top:14px">'
            f'A paleta de hoje inteira (Pink Deep, roxo, preto e branco) e um tom de verde só, o do close friends, nos detalhes do close. '
            f'No verde, tudo branco. E a estrela fica sem o ponto: só a estrela e o arco.</p><div style="margin-top:26px">{dets}</div></div>'
            f'<div>{sym(MARCAS[0][1], 210)}</div></div>'
            f'<div style="display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:12mm">{lock(MARCAS[0][1], 56)}'
            f'<div style="display:flex;gap:10px">{tile(MARCAS[2][1], 70, None)}{tile(MARCAS[0][1], 70)}{tile(MARCAS[3][1], 70, None)}{tile(MARCAS[4][1], 70, None)}</div></div></div>')
    page(None, body, "preto")


def p_paleta():
    SEC[0] = "paleta"
    cores = [("Pink Deep", PINK, "marca, compra, destaque"), ("Roxo", PURPLE, "lado da criadora"), ("Preto", BLACK, "fundo principal"),
             ("Branco", WHITE, "fundo claro"), ("Verde close", VERDE, "só detalhe: o que é do close")]
    sw = "".join(f'<div><div style="height:{110 if c != VERDE else 110}px;border-radius:14px;background:{c};border:1px solid {L2}"></div>'
                 f'<div style="font:800 13px Gabarito;margin-top:6px">{n}</div><div class="num" style="font:700 9.5px Figtree;color:{L3}">{c}</div>'
                 f'<div style="font:500 9px Figtree;color:{L3}">{u}</div></div>' for n, c, u in cores)
    prop = (f'<div style="display:flex;gap:3px;height:28px;width:620px">'
            f'<i style="flex:55;background:{BLACK};border-radius:6px"></i><i style="flex:12;background:{PINK};border-radius:6px"></i>'
            f'<i style="flex:25;background:{WHITE};border:1px solid {L2};border-radius:6px"></i><i style="flex:6;background:{PURPLE};border-radius:6px"></i>'
            f'<i style="flex:2.5;background:{BLACK};border-radius:6px"></i><i style="flex:2;background:{VERDE};border-radius:6px"></i></div>'
            f'<div class="cap">Preto 55 · Pink Deep 12 · branco 25 · roxo 6 · verde 2 (sempre com preto ou branco em volta)</div>')
    pares = [("Branco no verde", WHITE, VERDE, "estrela e rótulo curto em 800+, nunca frase"), ("Preto no verde", BLACK, VERDE, "não usar nesta versão"),
             ("Verde no preto", VERDE, BLACK, "detalhe no preto: ótimo"), ("Verde no branco", VERDE, WHITE, "detalhe no branco: só forma cheia"),
             ("Verde × Pink Deep", VERDE, PINK, "vibram: nunca encostar"), ("Verde × roxo", VERDE, PURPLE, "só com preto entre eles")]
    tab = "".join(f'<tr><td><span style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:20px;border-radius:5px;background:{b};color:{a};font:900 11px Gabarito;'
                  f'margin-right:8px;vertical-align:middle;border:1px solid {L2}">Aa</span>{n}</td><td class="num"><b>{ratio(a, b):.1f}:1</b></td><td style="color:{L3}">{u}</td></tr>' for n, a, b, u in pares)
    page("Paleta: as quatro de hoje + um detalhe", f'<div class="grid" style="grid-template-columns:repeat(5,1fr);gap:14px;margin-top:12px">{sw}</div>'
         f'<div class="row" style="margin-top:18px;gap:34px"><div>{prop}<div style="font:500 10.5px/1.6 Figtree;color:{L3};margin-top:14px;max-width:620px">'
         f'Um tom de verde só, o do print (#69C353). Sem Verde Deep e sem outros verdes. Ele não vira fundo, botão nem texto: '
         f'é o sinal de “isso é do close”, no mesmo lugar em que o Instagram usa o verde.</div></div><div style="flex:1"><table>{tab}</table></div></div>',
         "branco", "Nada muda no que já existe. O verde entra como quinto elemento, pequeno, com um significado só.")


def p_marca():
    SEC[0] = "marca"
    cells = "".join(f'<div>{box(m, sym(m, 92), 140, 130, "border:1px solid #333" if m["bg"] == BLACK else "")}<div class="cap" style="color:#E6E6E6">{n}</div></div>' for n, m in MARCAS)
    locks = "".join(box(m, lock(m, 28), 290, 62, "border:1px solid #333" if m["bg"] == BLACK else "") for m in (MARCAS[0][1], MARCAS[1][1], MARCAS[4][1]))
    antes = (f'<div style="width:150px;height:150px;border-radius:16px;background:#000;border:1px solid #333;display:flex;align-items:center;justify-content:center">'
             f'{svg(_macia(PINK, M.ICON_FIT), "5 5 90 90", 120)}</div>')
    agora = (f'<div style="width:150px;height:150px;border-radius:16px;background:#000;border:1px solid #333;display:flex;align-items:center;justify-content:center">'
             f'{svg(M.macia(PINK, M.ICON_FIT), "5 5 90 90", 120)}</div>')
    tiles = "".join(tile(m, 58, None) for _n, m in MARCAS[:5]) + tile(MARCAS[5][1], 58)
    page("A marca", f'<div class="grid" style="grid-template-columns:repeat(6,140px);gap:12px;margin-top:12px">{cells}</div>'
         f'<div class="row" style="margin-top:16px;gap:26px"><div style="display:grid;gap:8px">{locks}</div>'
         f'<div><div class="lbl" style="color:#fff">Antes · agora</div><div style="display:flex;gap:10px">{antes}{agora}</div>'
         f'<div class="cap" style="color:{G4}">O ponto da câmera sai de todas as versões.</div></div>'
         f'<div style="flex:1"><div class="lbl" style="color:#fff">Ícones de app</div><div style="display:flex;gap:8px;flex-wrap:wrap">{tiles}</div>'
         f'<div style="font:500 10.5px/1.6 Figtree;color:#E6E6E6;margin-top:12px">Só a estrela macia e o arco do carregando. No verde, como no rosa e no roxo, '
         f'<b>tudo branco</b>. A marca no verde é para selo, ícone e peça do close; a marca principal continua a do preto.</div></div></div>', "preto",
         "Estrela e arco, sem o ponto, em todas as superfícies. No verde, tudo branco.")


def p_detalhes():
    SEC[0] = "detalhes"
    K = TEMAS["preto"]
    av = (f'<div><div style="display:flex;gap:10px;align-items:center">{ring_close("ringlight-rosa", 52, VERDE)}{ring_close("make-sorriso", 52, PINK)}</div>'
          f'<div class="cap" style="color:{G4}">verde = close ativo · rosa = story comum</div></div>')
    chat = (f'<div style="width:220px;background:{G1};border:1px solid {G3};border-radius:14px;padding:10px">'
            f'<div style="display:flex;align-items:center;gap:6px;font:800 10px Gabarito;color:#fff">{ring_close("selfie-perto", 24, VERDE)}Lara{selo(VERDE, WHITE, "DO CLOSE", 6.5)}</div>'
            f'<div style="background:{G2};color:#fff;border-radius:12px 12px 12px 4px;padding:7px 10px;font:500 9.5px Figtree;margin-top:8px;display:inline-block">bastidor de hoje 💗</div></div>')
    toast = (f'<div style="display:flex;align-items:center;gap:9px;background:#000;border:1px solid {G3};color:#fff;border-radius:14px;padding:10px 14px;font:700 11px Figtree;width:230px">'
             f'{check_verde(20)}tá dentro! liberado na hora</div>')
    trancado = (f'<div style="position:relative">{blur_foto("make-ringlight", 110, 140, 12)}<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:3">{estrela_verde(40)}</div></div>')
    vazio = f'<span style="width:18px;height:18px;border-radius:50%;border:1.5px solid {G4}"></span>'
    lista = (f'<div style="width:230px;background:{G1};border:1px solid {G3};border-radius:14px;padding:4px 12px">' + "".join(
        f'<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid {G3};font:700 10px Figtree;color:#fff">{ring_close(n, 24, VERDE if on else G3)}<span style="flex:1">{t}</span>'
        f'{estrela_verde(18) if on else vazio}</div>'
        for n, t, on in (("selfie-perto", "Lara Mendes", True), ("neon-selfie", "Duda Prado", True), ("selfie-sueter", "Nina Sol", False))) + '</div>')
    novidade = (f'<div style="display:flex;gap:16px;align-items:center"><span style="position:relative;display:inline-block">'
                f'<span style="position:relative;display:inline-flex;width:44px;height:44px;border-radius:14px;background:{G2};align-items:center;justify-content:center">{svg(M.macia(WHITE, 40), "5 5 90 90", 22)}'
                f'<i style="position:absolute;right:6px;top:6px;width:9px;height:9px;border-radius:50%;background:{VERDE};border:2px solid {G2}"></i></span></span>'
                f'<span style="font:600 9.5px/1.4 Figtree;color:{G4}">marcador verde = post novo<br>no close (contador continua rosa)</span></div>')
    stickers = (f'<div style="display:flex;gap:8px;align-items:center">{selo_pilula("CLOSE FRIENDS", 10)}'
                f'<span style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:#fff;color:#000;font:900 13px Gabarito;transform:rotate(-3deg)">{estrela_verde(18)}só pro close</span></div>')
    itens = [("Selo do close", f'<div style="display:flex;gap:8px;align-items:center;zoom:1.5">{selo(VERDE, WHITE, "CLOSE", 8)}{selo_pilula("CLOSE", 8)}</div>', "verde com texto branco · em cor ou foto: pílula preta"),
             ("Anel de close ativo", av, "tracejado verde em volta do avatar"), ("Estrela do trancado", trancado, "desfoque + estrela verde (antes: círculo preto)"),
             ("Confirmação", toast, "check verde no “tá dentro”"), ("Lista do close", lista, "quem está no seu close"), ("Tag no chat", chat, "mensagem que veio do close"),
             ("Marcador de novidade", novidade, "aviso discreto"), ("Sticker", stickers, "story e vídeo: até um por tela")]
    cells = "".join(f'<div style="background:#000;border:1px solid {G3};border-radius:16px;padding:12px"><div class="lbl" style="color:#fff">{t}</div>'
                    f'<div style="min-height:70px;display:flex;align-items:center">{x}</div><div class="cap" style="color:{G4}">{u}</div></div>' for t, x, u in itens)
    page("Onde o verde entra", f'<div class="grid" style="grid-template-columns:repeat(4,1fr);gap:10px;margin-top:10px">{cells}</div>', "preto",
         "Oito detalhes, um significado: “isso é do close”. Se não é do close, não é verde.")


def p_app():
    SEC[0] = "app"
    T = G.tema_fa(V)
    T.update(tab=PINK, destaque=VERDE)
    inicio = phone(V1.s_inicio(T), T, 168, 344)
    Tr = dict(TEMAS["roxo"], marca="roxo")
    painel = phone(V1.s_painel(Tr), Tr, 168, 344)
    aprov = phone(V1.s_aprovado(), TEMAS["rosa"], 168, 344)
    cells = "".join(f'<div style="text-align:center">{x}<div class="cap" style="color:#fff">{t}</div></div>' for x, t in (
        (inicio, "Início · anel e selo verdes"), (painel, "Painel da criadora · roxo, sem verde"), (aprov, "Aprovado · momento rosa, sem verde")))
    page("No app", f'<div class="row" style="margin-top:12px;gap:16px">{cells}'
         f'<div style="flex:1;font:500 10.5px/1.6 Figtree;color:#E6E6E6">O verde aparece nas telas da fã, no que é do close: anel, selo, estrela do trancado e check. '
         f'Nas telas de cor cheia (painel roxo, aprovado em Pink Deep) ele fica de fora, ou entra só dentro de uma pílula preta.</div></div>', "preto",
         "Telas do protótipo com o verde só nos detalhes do close.")


def p_posts():
    SEC[0] = "postagens"
    G.p_posts(V)
    V1.PAGES[-1] = V1.PAGES[-1].replace("V · postagens", "Postagens").replace("Aqui: verde em detalhe.", "Rosa, roxo, preto e branco como hoje; o verde só no que é do close.")


def p_posts2():
    SEC[0] = "postagens"
    W, H = 168, 298
    a = (f'<div style="position:relative">{foto("neon-selfie", W, H, 14, "50% 25%")}<div style="position:absolute;left:8px;top:10px;display:flex;align-items:center;gap:5px">'
         f'{ring_close("neon-selfie", 24, VERDE)}<b style="font:800 8px Gabarito;color:#fff">duda.prado</b></div>'
         f'<div style="position:absolute;right:8px;top:10px">{selo_pilula("CLOSE FRIENDS", 7)}</div>'
         f'<div style="position:absolute;left:8px;bottom:14px">{tkl([("bastidor do", WHITE, BLACK), ("ensaio de hoje", BLACK, WHITE)], 13, 3)}</div></div>')
    b = (f'<div style="width:{W}px;height:{H}px;border-radius:14px;background:{PURPLE};padding:14px;display:flex;flex-direction:column;justify-content:space-between">'
         f'<div style="display:flex;justify-content:space-between;align-items:center">{lock("roxo", 13, None)}{selo_pilula("NOVO", 7)}</div>'
         f'<div class="d" style="font-size:24px;color:#fff">Caiu pack<br>novo no<br>meu close.</div>{bt("Ver o pack", WHITE, PURPLE, 26, 10)}</div>')
    c = (f'<div style="width:{W}px;height:{H}px;border-radius:14px;background:#000;border:1px solid {L2};padding:14px;display:flex;flex-direction:column;justify-content:space-between">'
         f'{sym(MARCAS[5][1], 54)}<div class="d" style="font-size:24px;color:#fff">Só pra quem<br>tá no <span style="color:{PINK}">close.</span></div>'
         f'<div style="display:flex;align-items:center;gap:6px;font:700 9px Figtree;color:{G4}">{estrela_verde(16)}link na bio</div></div>')
    d = (f'<div style="width:{W}px;height:{H}px;border-radius:14px;background:{PINK};padding:14px;display:flex;flex-direction:column;justify-content:space-between">'
         f'<div style="display:flex;justify-content:space-between;align-items:center">{lock("rosa", 13, None)}{selo_pilula("CLOSE", 7)}</div>'
         f'<div class="d" style="font-size:24px;color:#fff">Drop hoje<br>às 20h.</div><div style="font:700 9px Figtree;color:#fff">quem tá no close vê primeiro</div></div>')
    grid = "".join(f'<div style="position:relative">' + (blur_foto(n, 54, 54, 4, "50% 25%") + f'<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:3">{estrela_verde(18)}</div>' if lk else foto(n, 54, 54, 4, "50% 25%")) + '</div>'
                   for n, lk in (("ringlight-sorriso", False), ("make-mesa", True), ("selfie-chapeu", False), ("danca-tripe", True), ("amigas-cafe", False), ("make-paleta", True),
                                 ("espelho-casaco", False), ("vlog-tripe", True), ("tela-celular", False)))
    e = (f'<div style="width:{W}px;height:{H}px;border-radius:14px;background:#fff;border:1px solid {L2};padding:10px">'
         f'<div style="display:flex;align-items:center;gap:8px">{ring_close("ringlight-sorriso", 40, VERDE)}<div><b style="font:800 11px Gabarito">Lara Mendes</b>'
         f'<div style="font:600 8px Figtree;color:{L3}">3,2 mil no close</div></div></div>'
         f'<div style="margin:8px 0">{bt("Entrar no close · R$ 19,90", PINK, WHITE, 24, 8.5)}</div>'
         f'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:3px">{grid}</div></div>')
    cells = "".join(f'<div>{x}<div class="cap">{t}</div></div>' for x, t in (
        (a, "Story · close friends (selo em pílula)"), (b, "Story da criadora · roxo + pílula"), (c, "Post no preto · marca do close"),
        (d, "Story Pink Deep · pílula preta"), (e, "Perfil · grade com o trancado verde")))
    page("Mais postagens", f'<div style="display:flex;gap:14px;margin-top:12px">{cells}</div>'
         f'<div style="font:500 10.5px/1.6 Figtree;color:{L3};margin-top:16px;max-width:820px">Em fundo rosa ou roxo o verde nunca aparece solto: vai dentro da pílula preta. '
         f'No preto, no branco e na grade do perfil ele aparece direto, sempre pequeno.</div>', "branco",
         "Peças de rede social com o verde nos detalhes, inclusive sobre o rosa e o roxo.")


def p_nao():
    SEC[0] = "regras"
    def bad(inner, t):
        return f'<div><div class="bad" style="border-radius:14px">{inner}</div><div class="cap">{t}</div></div>'
    S = 130
    cx = lambda bg, inner, extra="": f'<div style="width:{S}px;height:{S}px;border-radius:14px;background:{bg};display:flex;align-items:center;justify-content:center;{extra}">{inner}</div>'
    itens = [bad(cx(VERDE, f'<div class="d" style="font-size:18px;color:#fff;text-align:center">Seu close,<br>seu preço.</div>'), "Verde como fundo de peça"),
             bad(cx(WHITE, f'<span class="bt" style="height:30px;padding:0 14px;background:{VERDE};color:#fff;font-size:11px">Entrar no close</span>', f"border:1px solid {L2}"), "Botão de compra verde"),
             bad(cx(PINK, estrela_verde(56)), "Verde solto no rosa"),
             bad(cx(PURPLE, selo(VERDE, WHITE, "CLOSE", 10)), "Verde solto no roxo"),
             bad(cx(BLACK, f'<span style="font:800 12px Figtree;color:{VERDE}">texto em verde</span>'), "Texto verde"),
             bad(cx(BLACK, f'<span style="width:56px;height:56px;border-radius:50%;background:#13803A;display:flex;align-items:center;justify-content:center">{svg(M.macia(WHITE, 40), "5 5 90 90", 30)}</span>'), "Outro tom de verde"),
             bad(cx(BLACK, svg(_macia(WHITE, M.ICON_FIT), "5 5 90 90", 80)), "Estrela com o ponto"),
             bad(cx(WHITE, f'<span style="display:inline-flex;align-items:center;gap:3px;padding:3px 8px;border-radius:999px;background:{VERDE};color:#000;font:800 11px Figtree">CLOSE</span>', f"border:1px solid {L2}"), "Preto em cima do verde")]
    regras = ["Verde = close. Se não é do close, não é verde.", "Só um tom: #69C353.", "Pequeno: até ~2% da peça.", "Sobre preto, branco ou foto; em rosa e roxo, só dentro de pílula preta.",
              "No verde, tudo branco: estrela, check e rótulo curto em 800+ (nunca frase: 2,2:1).", "Nunca botão de compra, fundo de peça ou texto verde.", "A estrela não tem mais o ponto da câmera."]
    rg = "".join(f'<div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid {L2};font:500 10.5px/1.45 Figtree"><span class="ok" style="background:{VERDE};color:#fff;flex-shrink:0">✓</span>{r}</div>' for r in regras)
    page("Regras e não fazer", f'<div class="row" style="margin-top:12px;gap:30px"><div class="grid" style="grid-template-columns:repeat(4,{S}px);gap:14px 16px">{"".join(itens)}</div>'
         f'<div style="flex:1">{rg}</div></div>', "branco", "O verde só funciona se continuar pequeno e com um significado só.")


def p_antes_depois():
    SEC[0] = "antes e depois"
    linha = lambda v, t: (f'<div><div class="lbl" style="color:#fff">{t}</div><div style="display:flex;gap:12px">{G.post_story(v)}{G.post_trancado(v) if v is V else _trancado_hoje()}{G.post_app(v)}</div></div>')
    page("Antes e depois", f'<div class="row" style="margin-top:12px;gap:40px">{linha(ATUAL, "Hoje · close em Pink Deep")}{linha(V, "Com o verde em detalhe")}</div>'
         f'<div style="font:500 10.5px/1.6 Figtree;color:#E6E6E6;margin-top:16px;max-width:860px">Mesmas peças. Hoje o rosa faz dois papéis (marca e close) e o anel do close se confunde com a compra. '
         f'Com o verde, o rosa fica só com a marca e a compra, e o close ganha um sinal próprio, que o público já reconhece do Instagram.</div>', "preto",
         "O que muda na prática: o close ganha cor própria; o resto continua igual.")


def _trancado_hoje():
    return (f'<div style="position:relative">{foto("make-mesa", G.W1, G.H916, 12, None, True)}'
            f'<div style="position:absolute;left:0;right:0;bottom:16px;text-align:center;z-index:3">{tk("Só pro close.", PINK, WHITE, 14)}</div></div>')


# trancado com a estrela verde (o detalhe) e legenda em Pink Deep (a marca)
def post_trancado(v):
    lk = f'<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:3">{estrela_verde(44)}</div>'
    return (f'<div style="position:relative">{blur_foto("make-mesa", G.W1, G.H916, 12)}{lk}'
            f'<div style="position:absolute;left:0;right:0;bottom:16px;text-align:center;z-index:3">{tk("Só pro close.", PINK, WHITE, 14)}</div></div>')


G.post_trancado = post_trancado


def write_svgs():
    SVG_DIR.mkdir(exist_ok=True)
    for f_ in SVG_DIR.glob("*.svg"):
        f_.unlink()
    nomes = ["preto", "branco", "pink-deep", "roxo", "verde", "close-preto"]
    for slug, (_n, m) in zip(nomes, MARCAS):
        (SVG_DIR / f"simbolo-{slug}.svg").write_text(M.sym_svg(m, bg=True))
        (SVG_DIR / f"icone-{slug}.svg").write_text(M.sym_svg(m, ring=None, bg=True))
        (SVG_DIR / f"logo-{slug}.svg").write_text(M.lockup_svg(m))
        (SVG_DIR / f"app-{slug}.svg").write_text(M.tile_svg(m, ring=None))
    est = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="256" height="256"><title>Clozzy · estrela do close</title>'
           f'<circle cx="50" cy="50" r="50" fill="{VERDE}"/><g transform="translate(21 21) scale(.58)">{M.macia(WHITE, 40)}</g></svg>\n')
    (SVG_DIR / "estrela-do-close.svg").write_text(est)


def build():
    V1.PAGES.clear()
    p_capa()
    p_paleta()
    p_marca()
    p_detalhes()
    p_app()
    p_posts()
    p_posts2()
    p_antes_depois()
    p_nao()
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy · Estrela macia + verde close</title>'
            f'<style>{V1.CSS}{V2.PHOTO_CSS}</style></head><body>{"".join(V1.PAGES)}</body></html>')
    low = html.lower()
    assert "#ff0065" not in low
    OUT_HTML.write_text(html)
    write_svgs()
    subprocess.run([V1.CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer", "--virtual-time-budget=6000",
                    f"--print-to-pdf={OUT_PDF}", OUT_HTML.as_uri()], check=True, capture_output=True)
    print("pages", len(V1.PAGES))


if __name__ == "__main__":
    build()

#!/usr/bin/env python3
"""Clozzy — identidade Estrela macia · verde close, branco no verde, sem o ponto, SEM ROSA NO PRETO.
Parte de ../identidade-verde-branco. Mudança: no preto não entra nada rosa (anel, estrela, texto, botão, aba ativa).
Nesta versão (rosa em detalhe no preto): o Pink Deep volta ao preto SÓ como detalhe, como o verde — o arco (inteiro,
numa cor só), ponto de não lida, ao vivo, curtida. Nunca a estrela, texto, botão ou forma grande rosa no preto.
O arco tem sempre UMA cor: nunca traços de cores diferentes.

Parte de ../identidade-verde-detalhe (paleta de hoje + um tom só de verde, #69C353, em detalhes do close) com duas mudanças:
  1. No verde, tudo BRANCO em cima (estrela, texto do selo, check) — nada preto sobre o verde.
  2. SEM o ponto da câmera: em todas as marcas fica só a estrela macia e o arco em volta.
Contraste: branco no verde é 2,2:1 (abaixo do AA). Por isso o texto branco no verde fica restrito a rótulos curtos
em peso 800+ (selo, tag), nunca frase.
Rodar: python3 _build.py → identidade-verde-rosa-detalhe-ponto.html + .pdf + svg/"""
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
OUT_HTML = HERE / "identidade-verde-rosa-detalhe-ponto.html"
OUT_PDF = HERE / "identidade-verde-rosa-detalhe-ponto.pdf"
SVG_DIR = HERE / "svg"
REF = MARCA / "refs" / "Captura de Tela 2026-11-11 às 16.00.35.png"

# ---------------------------------------------------------------- nesta versão não existe mais o ponto da câmera
_macia = M.macia


def macia(c, fit=M.STAR_FIT, cx=50, cy=50, dot=True):
    # ponto da câmera em toda estrela sozinha; dentro do arco (STAR_FIT / STAR_FIT_SM) fica sem
    return _macia(c, fit, cx, cy, dot=fit not in (M.STAR_FIT, getattr(M, 'STAR_FIT_SM', None)))


M.macia = macia
_fg = G.fg_on
G.fg_on = lambda c: WHITE if c == VERDE else (BLACK if c == WHITE else _fg(c))   # no verde, tudo branco · no branco, texto preto

# ---------------------------------------------------------------- arco em duas cores: existe só para o “não fazer”
import math as _math
_dashes0 = M._dashes
TIP = "tip:" + PINK          # cor de traço especial: "tip:<cor>" → os N primeiros traços nessa cor, o resto na cor da linha
N_TIP = 3


def _dashes(dash_c, line_c, w, rm, lens, gap, start=-90.0, end=270.0):
    if not (isinstance(dash_c, str) and dash_c.startswith("tip:")):
        return _dashes0(dash_c, line_c, w, rm, lens, gap, start, end)
    tip = dash_c[4:]
    cap = _math.degrees(w / rm)
    a, out = start + gap / 2, []
    for k, L in enumerate(lens):
        out.append(M.arc(tip if k < N_TIP else line_c, w, rm, a, a + L + cap))
        a += L + cap + gap
    out.append(M.arc(line_c, w, rm, a, end - gap / 2))
    return "".join(out)


M._dashes = _dashes

# no preto: destaque e compra brancos (texto preto no botão); rosa só no arco (inteiro) e em pontos
TEMAS["preto"].update(destaque=WHITE, cta=WHITE, cta_txt=BLACK)
for _k in ("preto",):
    if _k in M.V:
        M.V[_k].update(dash=PINK, line=PINK, star=WHITE, word=WHITE, icon=WHITE)
ANEL_ROSA_NO_PRETO = mk(BLACK, TIP, WHITE, WHITE, WHITE, WHITE)   # só para o “não fazer”: arco em duas cores
TUDO_BRANCO = mk(BLACK, WHITE, WHITE, WHITE)
ROXO_PRETO = mk(BLACK, PURPLE, WHITE, WHITE, WHITE)   # lado da criadora no preto: arco roxo inteiro, estrela branca
ROXO_PRETO["slug"] = "roxo-no-preto"
M.V["roxo-no-preto"] = ROXO_PRETO
TUDO_BRANCO["slug"] = "antes-branco"
M.V["antes-branco"] = TUDO_BRANCO
ANEL_ROSA_NO_PRETO["slug"] = "nao-rosa-preto"
M.V["nao-rosa-preto"] = ANEL_ROSA_NO_PRETO


MARCAS = [("No preto · arco rosa", mk(BLACK, PINK, WHITE, WHITE, WHITE)), ("No branco", mk(WHITE, PINK, PINK, BLACK)), ("No Pink Deep", mk(PINK, WHITE, WHITE, WHITE)),
          ("No roxo", mk(PURPLE, WHITE, WHITE, WHITE)), ("No verde · tudo branco", mk(VERDE, WHITE, WHITE, WHITE)),
          ("Close no preto · anel verde", mk(BLACK, VERDE, WHITE, WHITE, VERDE))]
for j, (_n, m) in enumerate(MARCAS):
    m["slug"] = f"vd{j}"
    M.V[m["slug"]] = m

V = dict(cod="V", nome="Verde em detalhe", ideia="", marcas=MARCAS,
         cores=[("Pink Deep", PINK, ""), ("Roxo", PURPLE, ""), ("Verde close", VERDE, ""), ("Preto", BLACK, ""), ("Branco", WHITE, "")],
         fa=dict(base="preto", destaque=WHITE, cta=WHITE, cta_txt=BLACK), close=VERDE, cri="roxo", capa="rosa", regras=[])
ATUAL = dict(V, close=PINK, nome="Hoje")          # para o antes/depois
G.VARS = [V]

SEC = G.SEC
page = V1.page


def foot(n, t):
    dark = TEMAS[t]["sup"] != WHITE
    return (f'<div class="foot" style="color:{WHITE if dark else BLACK}"><span>Clozzy · Estrela macia · verde close, rosa em detalhe no preto · {SEC[0]}</span>'
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
def _capa_icones(px=54):
    """capa: só os ícones sem arco (estrela), nos temas de fundo colorido/branco"""
    temas = [("branco", MARCAS[1][1]), ("pink deep", MARCAS[2][1]), ("roxo", MARCAS[3][1]), ("verde", MARCAS[4][1])]
    lb = f"font:600 7px Figtree;color:{G4};letter-spacing:.02em"
    return ('<div style="display:flex;gap:10px">' + "".join(
        f'<div style="text-align:center">{tile(m, px, None)}<div style="{lb};margin-top:5px">{n}</div></div>' for n, m in temas) + '</div>')


def p_capa():
    SEC[0] = "capa"
    dets = (f'<div style="display:flex;gap:16px;align-items:center">{selo(VERDE, WHITE, "CLOSE", 10)}{ring_close("ringlight-rosa", 46, VERDE)}{estrela_verde(40)}'
            f'{check_verde(26)}<i style="width:12px;height:12px;border-radius:50%;background:{VERDE}"></i>{selo_pilula("DO CLOSE", 9)}</div>')
    rosa = (f'<div style="position:absolute;top:0;right:0;bottom:0;width:41%;background:{PINK};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px">'
            f'{sym(MARCAS[2][1], 240)}{lock(MARCAS[2][1], 50, None)}'
            f'<div style="font:800 11px Figtree;color:#fff;letter-spacing:.04em">PINK DEEP · A COR DA MARCA</div></div>')
    body = (f'{rosa}<div style="position:relative;display:flex;flex-direction:column;justify-content:space-between;height:100%;width:54%">'
            f'<div><div class="lbl" style="color:{VERDE};opacity:1">identidade · nov 2026</div>'
            f'<h1 style="color:#fff">Estrela macia<br>+ verde close</h1><p class="lead" style="color:{G4};max-width:430px;margin-top:14px">'
            f'A paleta de hoje inteira (Pink Deep, roxo, preto e branco) e um tom de verde só, o do close friends, nos detalhes do close. '
            f'No verde, tudo branco. No preto, o rosa entra só em detalhe, como o verde: o arco é rosa e a estrela, branca. O ponto da câmera volta só na estrela sozinha.</p>'
            f'<div style="margin-top:26px">{dets}</div></div>'
            f'<div style="display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:12mm">{lock(MARCAS[0][1], 40)}{_capa_icones()}</div></div>')
    page(None, body, "preto")


def p_paleta():
    SEC[0] = "paleta"
    cores = [("Pink Deep", PINK, "marca e compra; no preto, só detalhe"), ("Roxo", PURPLE, "lado da criadora"), ("Preto", BLACK, "fundo principal"),
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
             ("Roxo no preto", PURPLE, BLACK, "criadora: arco e forma, nunca texto"), ("Pink Deep no preto", PINK, BLACK, "só detalhe: arco, ponto, badge"), ("Verde × Pink Deep", VERDE, PINK, "vibram: nunca encostar"), ("Verde × roxo", VERDE, PURPLE, "só com preto entre eles")]
    tab = "".join(f'<tr><td><span style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:20px;border-radius:5px;background:{b};color:{a};font:900 11px Gabarito;'
                  f'margin-right:8px;vertical-align:middle;border:1px solid {L2}">Aa</span>{n}</td><td class="num"><b>{ratio(a, b):.1f}:1</b></td><td style="color:{L3}">{u}</td></tr>' for n, a, b, u in pares)
    page("Paleta: as quatro de hoje + um detalhe", f'<div class="grid" style="grid-template-columns:repeat(5,1fr);gap:14px;margin-top:12px">{sw}</div>'
         f'<div class="row" style="margin-top:18px;gap:34px"><div>{prop}<div style="font:500 10.5px/1.6 Figtree;color:{L3};margin-top:14px;max-width:620px">'
         f'Um tom de verde só, o do print (#69C353). Sem Verde Deep e sem outros verdes. Ele não vira fundo, botão nem texto: '
         f'é o sinal de “isso é do close”, no mesmo lugar em que o Instagram usa o verde. No preto, o Pink Deep vira detalhe, como o verde: o arco, ponto de não lida, ao vivo. Botão e destaque no preto ficam brancos.</div></div><div style="flex:1"><table>{tab}</table></div></div>',
         "branco", "Nada muda no que já existe. O verde entra como quinto elemento, pequeno, com um significado só.")


def p_marca():
    SEC[0] = "marca"
    cells = "".join(f'<div>{box(m, sym(m, 92), 140, 130, "border:1px solid #333" if m["bg"] == BLACK else "")}<div class="cap">{n}</div></div>' for n, m in MARCAS)
    locks = "".join(box(m, lock(m, 28), 290, 62, "border:1px solid #333" if m["bg"] == BLACK else "") for m in (MARCAS[0][1], MARCAS[1][1], MARCAS[4][1]))
    antes = box(TUDO_BRANCO, sym(TUDO_BRANCO, 110), 150, 150, "border:1px solid #333")
    agora = box(MARCAS[0][1], sym(MARCAS[0][1], 110), 150, 150, "border:1px solid #333")
    tiles = "".join(tile(m, 58, None) for _n, m in MARCAS[:5]) + tile(MARCAS[5][1], 58)
    page("A marca", f'<div class="grid" style="grid-template-columns:repeat(6,140px);gap:12px;margin-top:12px">{cells}</div>'
         f'<div class="row" style="margin-top:16px;gap:26px"><div style="display:grid;gap:8px">{locks}</div>'
         f'<div><div class="lbl">Antes · agora</div><div style="display:flex;gap:10px">{antes}{agora}</div>'
         f'<div class="cap">Tudo branco no preto ficava sem vida:<br>agora o arco é rosa, a estrela branca.<br>Com o arco, sem ponto; sozinha, com ponto.</div></div>'
         f'<div style="flex:1"><div class="lbl">Ícones de app</div><div style="display:flex;gap:8px;flex-wrap:wrap">{tiles}</div>'
         f'<div style="font:500 10.5px/1.6 Figtree;color:{L3};margin-top:12px">Só a estrela macia e o arco do carregando. No verde, no rosa e no roxo, '
         f'<b>tudo branco</b>. No preto, o arco inteiro rosa e a estrela branca. O arco tem sempre uma cor só. A marca principal continua a do preto.</div></div></div>', "branco",
         "Estrela e arco sem o ponto; a estrela sozinha (ícone) com o ponto. No preto, arco rosa e estrela branca.")


def p_detalhes():
    SEC[0] = "detalhes"
    K = TEMAS["preto"]
    av = (f'<div><div style="display:flex;gap:10px;align-items:center">{ring_close("ringlight-rosa", 52, VERDE)}{ring_close("make-sorriso", 52, G4)}</div>'
          f'<div class="cap" style="color:{G4}">verde = close ativo · cinza = story comum</div></div>')
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
                f'<span style="font:600 9.5px/1.4 Figtree;color:{G4}">marcador verde = post novo<br>no close (não lida: ponto rosa)</span></div>')
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


def p_rosa_no_preto():
    SEC[0] = "rosa no preto"
    big = f'<div style="width:220px;height:220px;border-radius:18px;border:1px solid {G3};display:flex;align-items:center;justify-content:center">{sym(MARCAS[0][1], 170)}</div>'
    lockp = f'<div style="width:220px;height:58px;border-radius:12px;border:1px solid {G3};margin-top:10px;display:flex;align-items:center;justify-content:center">{lock(MARCAS[0][1], 26)}</div>'
    badge = (f'<span style="position:relative;display:inline-flex;width:44px;height:44px;border-radius:14px;background:{G2};align-items:center;justify-content:center;'
             f'font:700 9px Figtree;color:#fff">chat<i style="position:absolute;right:5px;top:5px;width:9px;height:9px;border-radius:50%;background:{PINK}"></i></span>')
    live = (f'<span style="display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 10px;border-radius:999px;background:{G2};color:#fff;font:800 9px Figtree">'
            f'<i style="width:7px;height:7px;border-radius:50%;background:{PINK}"></i>AO VIVO</span>')
    curt = (f'<span style="display:inline-flex;align-items:center;gap:6px;font:700 11px Figtree;color:#fff">'
            f'<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.5 3 5 6.4 5c2 0 3.6 1.2 4.6 2.7C12 6.2 13.6 5 15.6 5 19 5 21.1 8.5 19.6 11.8 17.5 16.4 12 21 12 21z" fill="{PINK}"/></svg>2,4 mil</span>')
    prog = (f'<div style="width:150px;display:flex;gap:3px">' + "".join(f'<i style="flex:1;height:3px;border-radius:2px;background:{PINK if k == 1 else ("#fff" if k < 1 else G3)}"></i>' for k in range(4)) + '</div>')
    itens = [("Ponto de não lida", badge, "chat, notificação"), ("Ao vivo", live, "o ponto, não a pílula"), ("Curtida", curt, "coração rosa, número branco"),
             ("Story em andamento", prog, "só o traço que está tocando")]
    cells = "".join(f'<div style="border:1px solid {G3};border-radius:14px;padding:12px"><div class="lbl" style="color:#fff">{t}</div>'
                    f'<div style="min-height:56px;display:flex;align-items:center">{x}</div><div class="cap" style="color:{G4}">{u}</div></div>' for t, x, u in itens)
    page("Onde o rosa entra no preto", f'<div class="row" style="margin-top:12px;gap:28px;align-items:flex-start"><div>{big}{lockp}'
         f'<div class="cap" style="color:{G4}">o arco: rosa inteiro, numa cor só</div></div>'
         f'<div style="flex:1"><div class="grid" style="grid-template-columns:repeat(2,1fr);gap:10px">{cells}</div>'
         f'<div style="font:500 10.5px/1.6 Figtree;color:#E6E6E6;margin-top:14px">No preto, o Pink Deep é tratado como o verde: detalhe pequeno, até uns 2% da peça. '
         f'Ele pinta o arco (inteiro, numa cor só) e marca o que está vivo (não lida, ao vivo, curtida, story tocando). '
         f'<b>Nunca</b> a estrela, texto, botão ou qualquer forma grande rosa em cima do preto.</div></div></div>', "preto",
         "A exceção: rosa no preto só em detalhe, como o verde.")


def p_roxo_no_preto():
    SEC[0] = "roxo no preto"
    m = ROXO_PRETO
    big = f'<div style="width:200px;height:200px;border-radius:18px;border:1px solid {G3};display:flex;align-items:center;justify-content:center">{sym(m, 150)}</div>'
    lockp = f'<div style="width:200px;height:54px;border-radius:12px;border:1px solid {G3};margin-top:10px;display:flex;align-items:center;justify-content:center">{lock(m, 24)}</div>'
    # painel da criadora no escuro
    Tp = dict(TEMAS["preto"], destaque=PURPLE, tab=WHITE, marca=m["slug"])
    painel = phone(V1.s_painel(Tp), Tp, 150, 306)
    # story da criadora no preto
    story = (f'<div style="width:150px;height:266px;border-radius:12px;background:#000;border:1px solid {G3};padding:12px;display:flex;flex-direction:column;justify-content:space-between">'
             f'{sym(m, 46)}<div class="d" style="font-size:21px;color:#fff">Abri meu<br>close.</div>'
             f'<div style="font:600 7.5px/1.4 Figtree;color:{G4}">você define o preço, recebe no Pix</div>{bt("Quero vender", WHITE, BLACK, 24, 9)}</div>')
    # perfil: anel roxo = criadora
    perfil = (f'<div style="width:150px;height:266px;border-radius:12px;background:#000;border:1px solid {G3};padding:12px">'
              f'<div style="display:flex;justify-content:center;margin-top:8px"><div style="width:76px;height:76px;border-radius:50%;padding:4px;position:relative">'
              f'<svg viewBox="5 5 90 90" width="76" height="76" style="position:absolute;inset:0">{M.RING[M.MAIN_RING][3](PURPLE, PURPLE)}</svg>'
              f'<div class="ft f-vlog-tripe" style="position:absolute;inset:11px;border-radius:50%;background-size:260%;background-position:50% 20%"></div></div></div>'
              f'<div style="text-align:center;font:900 12px Gabarito;color:#fff;margin-top:8px">Nina Sol</div>'
              f'<div style="text-align:center;font:600 7.5px Figtree;color:{G4}">criadora · 1,8 mil no close</div>'
              f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:12px">'
              + "".join(f'<div style="padding:7px;border-radius:10px;background:{G1};border:1px solid {G3}"><div style="font:600 7px Figtree;color:{G4}">{a}</div>'
                        f'<div class="d num" style="font-size:13px;color:#fff">{b}</div></div>' for a, b in (("Este mês", "R$ 3,1 mil"), ("Posts", "214")))
              + f'</div><div style="margin-top:12px">{bt("Editar perfil", WHITE, BLACK, 24, 9)}</div></div>')
    # ícone do app da criadora + push
    icones = (f'<div style="width:290px;border-radius:14px;background:#000;border:1px solid {G3};padding:14px;display:flex;gap:18px;align-items:center">'
              f'<div style="text-align:center">{tile(m, 56)}<div style="font:600 7.5px Figtree;color:#fff;margin-top:4px">Clozzy Studio</div></div>'
              f'<div style="text-align:center">{tile(MARCAS[0][1], 56)}<div style="font:600 7.5px Figtree;color:#fff;margin-top:4px">Clozzy</div></div>'
              f'<div style="font:500 8.5px/1.45 Figtree;color:{G4};flex:1">app da criadora: arco roxo · app da fã: arco rosa</div></div>')
    push = (f'<div style="width:290px;border-radius:14px;background:{G1};border:1px solid {G3};padding:9px 11px;display:flex;gap:9px;align-items:center;margin-top:10px">{tile(m, 30)}'
            f'<div style="flex:1"><div style="display:flex;justify-content:space-between;font:700 8.5px Figtree;color:#fff"><b>Clozzy Studio</b><span style="color:{G4}">agora</span></div>'
            f'<div style="font:500 9px Figtree;margin-top:1px;color:#E6E6E6">+ R$ 19,90 · nova assinatura no seu close</div></div></div>')
    carregando = (f'<div style="width:290px;height:96px;border-radius:14px;background:#000;border:1px solid {G3};margin-top:10px;display:flex;align-items:center;justify-content:center;gap:14px">'
                  f'{sym(m, 54)}<span style="font:600 9px Figtree;color:{G4}">enviando seu pack…</span></div>')
    cells = "".join(f'<div>{x}<div class="cap" style="color:{G4}">{t}</div></div>' for x, t in (
        (painel, "Painel da criadora · modo escuro"), (story, "Story · convite de criadora"), (perfil, "Perfil · anel roxo da criadora")))
    page("Roxo no preto: o lado da criadora", f'<div class="row" style="margin-top:12px;gap:22px;align-items:flex-start"><div>{big}{lockp}'
         f'<div class="cap" style="color:{G4}">arco roxo inteiro, estrela e palavra brancas</div></div>{cells}'
         f'<div>{icones}{push}{carregando}<div class="cap" style="color:{G4}">ícone, notificação e carregando do app da criadora</div></div></div>'
         f'<div style="font:500 10.5px/1.6 Figtree;color:#E6E6E6;margin-top:14px;max-width:900px">O roxo já é a cor da criadora. No preto, ele entra do mesmo jeito que o rosa: '
         f'no arco inteiro (uma cor só), com estrela e palavra brancas. Rosa = fã e compra · roxo = criadora. '
         f'Na capa aparece só pequeno (o ícone da criadora); a marca principal continua com o arco rosa. Roxo no preto é só forma (arco, barra, anel), nunca texto, e nunca junto com rosa na mesma marca.</div>', "preto",
         "Aplicações com o arco roxo no preto, para as peças da criadora.")


def p_app():
    SEC[0] = "app"
    T = G.tema_fa(V)
    T.update(tab=WHITE, destaque=VERDE)
    inicio = phone(V1.s_inicio(T), T, 168, 344)
    Tr = dict(TEMAS["roxo"], marca="roxo")
    painel = phone(V1.s_painel(Tr), Tr, 168, 344)
    aprov = phone(V1.s_aprovado(), TEMAS["rosa"], 168, 344)
    cells = "".join(f'<div style="text-align:center">{x}<div class="cap" style="color:#fff">{t}</div></div>' for x, t in (
        (inicio, "Início · verde no close, sem rosa"), (painel, "Painel da criadora · roxo, sem verde"), (aprov, "Aprovado · momento rosa, sem verde")))
    page("No app", f'<div class="row" style="margin-top:12px;gap:16px">{cells}'
         f'<div style="flex:1;font:500 10.5px/1.6 Figtree;color:#E6E6E6">O verde aparece nas telas da fã, no que é do close: anel, selo, estrela do trancado e check. '
         f'Nas telas de cor cheia (painel roxo, aprovado em Pink Deep) ele fica de fora, ou entra só dentro de uma pílula preta. '
         f'Na tela preta o rosa é só detalhe: arco do logo e ponto de não lida no chat. Aba ativa e botão de compra brancos.</div></div>', "preto",
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
         f'{sym(MARCAS[5][1], 54)}<div class="d" style="font-size:24px;color:#fff">Só pra quem<br>tá no close.</div>'
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
         f'No preto, no branco e na grade do perfil ele aparece direto, sempre pequeno. No preto, o texto é branco, nunca rosa; o rosa fica no arco.</div>', "branco",
         "Peças de rede social com o verde nos detalhes, inclusive sobre o rosa e o roxo.")


def p_nao():
    SEC[0] = "regras"
    def bad(inner, t):
        return f'<div><div class="bad" style="border-radius:14px">{inner}</div><div class="cap">{t}</div></div>'
    S = 100
    cx = lambda bg, inner, extra="": f'<div style="width:{S}px;height:{S}px;border-radius:14px;background:{bg};display:flex;align-items:center;justify-content:center;{extra}">{inner}</div>'
    itens = [bad(cx(VERDE, f'<div class="d" style="font-size:18px;color:#fff;text-align:center">Seu close,<br>seu preço.</div>'), "Verde como fundo de peça"),
             bad(cx(WHITE, f'<span class="bt" style="height:30px;padding:0 14px;background:{VERDE};color:#fff;font-size:11px">Entrar no close</span>', f"border:1px solid {L2}"), "Botão de compra verde"),
             bad(cx(PINK, estrela_verde(56)), "Verde solto no rosa"),
             bad(cx(PURPLE, selo(VERDE, WHITE, "CLOSE", 10)), "Verde solto no roxo"),
             bad(cx(BLACK, f'<span style="font:800 12px Figtree;color:{VERDE}">texto em verde</span>'), "Texto verde"),
             bad(cx(BLACK, f'<span style="width:56px;height:56px;border-radius:50%;background:#13803A;display:flex;align-items:center;justify-content:center">{svg(M.macia(WHITE, 40), "5 5 90 90", 30)}</span>'), "Outro tom de verde"),
             bad(cx(BLACK, svg(M.RING[M.MAIN_RING][3](WHITE, WHITE) + _macia(WHITE, M.STAR_FIT, dot=True), "5 5 90 90", 80)), "Ponto com o arco"),
             bad(cx(WHITE, f'<span style="display:inline-flex;align-items:center;gap:3px;padding:3px 8px;border-radius:999px;background:{VERDE};color:#000;font:800 11px Figtree">CLOSE</span>', f"border:1px solid {L2}"), "Preto em cima do verde"),
             bad(cx(BLACK, sym(ANEL_ROSA_NO_PRETO, 80)), "Arco em duas cores"),
             bad(cx(BLACK, f'<span class="bt" style="height:30px;padding:0 14px;background:{PINK};color:#fff;font-size:11px">Entrar no close</span>'), "Botão rosa no preto"),
             bad(cx(BLACK, svg(M.macia(PINK, M.ICON_FIT), "5 5 90 90", 64)), "Estrela rosa no preto"),
             bad(cx(BLACK, f'<span class="d" style="font-size:20px;color:{PINK}">close.</span>'), "Texto rosa no preto")]
    regras = ["Verde = close. Se não é do close, não é verde.", "Só um tom: #69C353.", "Pequeno: até ~2% da peça.", "Sobre preto, branco ou foto; em rosa e roxo, só dentro de pílula preta.",
              "No verde, tudo branco: estrela, check e rótulo curto em 800+ (nunca frase: 2,2:1).", "Nunca botão de compra, fundo de peça ou texto verde.", "No preto, rosa só em detalhe (como o verde): arco, ponto, badge. Nunca estrela, texto, botão ou forma grande.", "O arco tem sempre uma cor só, inteiro.", "Arco roxo no preto: só nas peças da criadora, pequeno na capa, nunca como marca principal.", "Ponto da câmera só na estrela sozinha (ícone); com o arco, nunca."]
    rg = "".join(f'<div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid {L2};font:500 10.5px/1.45 Figtree"><span class="ok" style="background:{VERDE};color:#fff;flex-shrink:0">✓</span>{r}</div>' for r in regras)
    page("Regras e não fazer", f'<div class="row" style="margin-top:12px;gap:30px"><div class="grid" style="grid-template-columns:repeat(6,{S}px);gap:12px 12px">{"".join(itens)}</div>'
         f'<div style="flex:1">{rg}</div></div>', "branco", "Verde e rosa no preto só funcionam pequenos. Nada grande rosa em cima do preto.")


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


def destaques(v):
    itens = [("close", VERDE, WHITE), ("packs", PINK, WHITE), ("lives", PURPLE, WHITE), ("bastidor", WHITE, PINK), ("faq", PINK, WHITE)]   # só combinações homologadas
    out = "".join(f'<div style="text-align:center"><span style="width:44px;height:44px;border-radius:50%;border:1.5px solid {G3};padding:2px;display:inline-block">'
                  f'<span style="width:100%;height:100%;border-radius:50%;background:{c};display:flex;align-items:center;justify-content:center">{svg(M.macia(f, 40), "5 5 90 90", 20)}</span></span>'
                  f'<div style="font:600 7.5px Figtree;color:#fff;margin-top:3px">{n}</div></div>' for n, c, f in itens)
    return f'<div style="width:290px;border-radius:12px;background:#000;padding:12px 14px;display:flex;justify-content:space-between">{out}</div>'


G.destaques = destaques


def push(v):
    """notificação: ícone do app em Pink Deep com a estrela branca"""
    return (f'<div style="width:290px;border-radius:14px;background:{L1};padding:9px 11px;display:flex;gap:9px;align-items:center;margin-top:8px">{tile(MARCAS[2][1], 30, None)}'
            f'<div style="flex:1"><div style="display:flex;justify-content:space-between;font:700 8.5px Figtree"><b>Clozzy</b><span style="color:{L3}">agora</span></div>'
            f'<div style="font:500 9px Figtree;margin-top:1px">a Lara postou no close 💗</div></div></div>')


G.push = push

_tab0 = V1.tabbar


def _tab_rosa(T, on=0, cri=False):
    html = _tab0(T, on, cri)
    if T["sup"] == BLACK and not cri:
        dot = f'<i style="position:absolute;left:calc(70% + 3px);top:6px;width:6px;height:6px;border-radius:50%;background:{PINK}"></i>'
        html = html[:-6] + dot + "</div>"
    return html


V1.tabbar = _tab_rosa


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
    (SVG_DIR / "simbolo-roxo-no-preto.svg").write_text(M.sym_svg(ROXO_PRETO, bg=True))
    (SVG_DIR / "logo-roxo-no-preto.svg").write_text(M.lockup_svg(ROXO_PRETO))
    (SVG_DIR / "app-roxo-no-preto.svg").write_text(M.tile_svg(ROXO_PRETO))
    est = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="256" height="256"><title>Clozzy · estrela do close</title>'
           f'<circle cx="50" cy="50" r="50" fill="{VERDE}"/><g transform="translate(21 21) scale(.58)">{M.macia(WHITE, 40)}</g></svg>\n')
    (SVG_DIR / "estrela-do-close.svg").write_text(est)



def build():
    V1.PAGES.clear()
    p_capa()
    p_paleta()
    p_marca()
    p_detalhes()
    p_rosa_no_preto()
    p_roxo_no_preto()
    p_app()
    p_posts()
    p_posts2()
    p_antes_depois()
    p_nao()
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy · Estrela macia + verde close · rosa em detalhe no preto</title>'
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

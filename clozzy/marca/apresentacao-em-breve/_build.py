#!/usr/bin/env python3
"""Clozzy — apresentação “O Clozzy chega em breve”.

Usa a identidade de ../identidade-verde-letras-redondas (Pink Deep, roxo, preto, branco + verde só no close; no preto, arco rosa
e estrela branca; arco roxo = criadora; ponto da câmera só na estrela sozinha; “clozzy” com cantos arredondados).
Rodar: python3 _build.py → apresentacao-em-breve.html + .pdf"""
import importlib.util, subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
MARCA = HERE.parent
_spec = importlib.util.spec_from_file_location("ident", MARCA / "identidade-verde-letras-redondas" / "_build.py")
B = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(B)

V1, V2, M, G = B.V1, B.V2, B.M, B.G
PINK, PURPLE, BLACK, WHITE, VERDE = B.PINK, B.PURPLE, B.BLACK, B.WHITE, B.VERDE
G1, G2, G3, G4, L1, L2, L3 = B.G1, B.G2, B.G3, B.G4, B.L1, B.L2, B.L3
sym, lock, tile, svg, foto, phone, tk, tkl, bt = B.sym, B.lock, B.tile, B.svg, B.foto, B.phone, B.tk, B.tkl, B.bt
MARCAS, ROXO = B.MARCAS, B.ROXO_PRETO
PRETO, BRANCO, ROSA, NO_ROXO, NO_VERDE = (MARCAS[i][1] for i in range(5))
# na apresentação, no preto o arco é ROSA (estrela e palavra brancas), como na identidade
PRETO.update(dash=PINK, line=PINK)
M.V["preto"].update(dash=PINK, line=PINK)
ARCO_VERDE = B.mk(BLACK, VERDE, WHITE, WHITE, WHITE)   # só no slide “Por que agora”
ARCO_VERDE["slug"] = "apres-verde"
M.V["apres-verde"] = ARCO_VERDE
ARCO_PRETO = B.mk(WHITE, BLACK, PINK, BLACK, PINK)   # capa alternativa: arco preto no branco
ARCO_PRETO["slug"] = "apres-arco-preto"
M.V["apres-arco-preto"] = ARCO_PRETO
OUT_HTML = HERE / "apresentacao-em-breve.html"
OUT_PDF = HERE / "apresentacao-em-breve.pdf"
SEC = [""]
TXT = "font:500 12px/1.6 Figtree"


def foot(n, t):
    dark = V1.TEMAS[t]["sup"] != WHITE
    return (f'<div class="foot" style="color:{WHITE if dark else BLACK}"><span>Clozzy · em breve · {SEC[0]}</span><span>{n:02d}</span></div>')


V1.foot = foot
page = V1.page


# ---------------------------------------------------------------- barra de abas com ícones de verdade (antes eram quadrados vazios)
_ICO = {
    "Início": '<path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z"/>',
    "Explorar": '<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>',
    "Biblioteca": '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
    "Chat": '<path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5z" transform="translate(.5 0)"/>',
    "Eu": '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
    "Painel": '<path d="M5 20V12M10 20V6M15 20v-9M20 20V4" transform="translate(-.5 0)"/>',
    "Conteúdo": '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9.5" cy="9.5" r="1.6"/><path d="m4.5 17 4.5-4.5 3.5 3.5 2.5-2.5 4.5 4.5"/>',
    "Perfil": '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
}


def tabbar(T, on=0, cri=False):
    dest = T.get("tab", T["destaque"])
    items = ["Painel", "Conteúdo", "+", "Chat", "Perfil"] if cri else ["Início", "Explorar", "Biblioteca", "Chat", "Eu"]
    out = ""
    for i, t in enumerate(items):
        if t == "+":
            out += (f'<span style="flex:1;display:flex;justify-content:center"><span style="width:28px;height:22px;border-radius:8px;'
                    f'background:{T["cta"] if T["sup"] != PINK else WHITE};color:{T["cta_txt"]};display:flex;align-items:center;justify-content:center;'
                    f'font:800 14px/1 Gabarito">+</span></span>')
            continue
        c = dest if i == on else T["apoio"]
        dot = (f'<i style="position:absolute;top:-1px;right:-2px;width:5px;height:5px;border-radius:50%;background:{PINK}"></i>'
               if t == "Chat" and T["sup"] == BLACK and not cri else "")
        out += (f'<span style="flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:2px;font:700 6px/1 Figtree;letter-spacing:-.1px;white-space:nowrap;color:{c}">'
                f'<span style="position:relative;display:block;width:13px;height:13px"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" '
                f'stroke="{c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:block">{_ICO[t]}</svg>{dot}</span>{t}</span>')
    return (f'<div style="position:absolute;left:0;right:0;bottom:0;height:42px;background:{T["sup"]};border-top:1px solid {T["linha"]};z-index:5;'
            f'display:flex;align-items:center;padding:0 4px 6px">{out}</div>')


V1.tabbar = tabbar
_s_inicio, _s_painel = V1.s_inicio, V1.s_painel
# feed: foto um pouco menor para a faixa “Close da Duda” não ficar escondida atrás da barra de abas
V1.s_inicio = lambda T: _s_inicio(T).replace("height:150px", "height:118px", 1).replace('">Close da Duda<', ';white-space:nowrap">Close da Duda<', 1).replace("padding:0 16px;\">Assinar", "padding:0 10px;white-space:nowrap;flex-shrink:0\">Assinar", 1).replace("align-items:center;margin:8px 10px;padding:7px 9px", "align-items:center;gap:8px;margin:8px;padding:6px 6px 6px 10px", 1).replace("font-size:8px;background:#FFFFFF;color:#000000;padding:0 10px", "font-size:7.5px;background:#FFFFFF;color:#000000;padding:0 10px", 1)
# painel: valores em uma linha só (“R$ 2.140” quebrava)
V1.s_painel = lambda T: _s_painel(T).replace('class="d num" style="font-size:14px;', 'class="d num" style="font-size:13px;white-space:nowrap;')
PW, PH = 176, 360   # tamanho para o qual as telas foram desenhadas (em 168px elas transbordavam e entortavam)


def icones(px=54, lab=True):
    """os ícones da identidade (estrela com ponto) nas quatro cores"""
    temas = [("branco", BRANCO), ("pink deep", ROSA), ("roxo", NO_ROXO), ("verde", NO_VERDE)]
    return ('<div style="display:flex;gap:10px">' + "".join(
        f'<div style="text-align:center">{tile(m, px, None)}' + (f'<div style="font:600 7px Figtree;color:{G4};margin-top:5px">{n}</div>' if lab else "") + '</div>'
        for n, m in temas) + '</div>')


def dets_close():
    """os detalhes verdes do close, como na capa da identidade"""
    return (f'<div style="display:flex;gap:14px;align-items:center">{B.selo(VERDE, WHITE, "CLOSE", 10)}{B.ring_close("ringlight-rosa", 44, VERDE)}'
            f'{B.estrela_verde(38)}{B.check_verde(24)}{B.selo_pilula("DO CLOSE", 9)}</div>')


def bola(txt, bg, fg, px=34):
    return (f'<span style="width:{px}px;height:{px}px;border-radius:50%;background:{bg};color:{fg};display:inline-flex;align-items:center;justify-content:center;'
            f'font:900 {px * .48}px Gabarito;flex-shrink:0">{txt}</span>')


def big(txt, c="#fff", fs=88):
    return f'<div class="d" style="font-size:{fs}px;color:{c}">{txt}</div>'


# ================================================================ 01 capa
def p_capa():
    """capa: painel branco, estrela e arco rosa, nome preto"""
    SEC[0] = "capa"
    rosa = (f'<div style="position:absolute;top:0;right:0;bottom:0;width:41%;background:{WHITE};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px">'
            f'{sym(BRANCO, 230)}{lock(BRANCO, 46, None)}</div>')
    body = (f'{rosa}<div style="position:relative;display:flex;flex-direction:column;justify-content:space-between;height:100%;width:54%">'
            f'<div><div class="lbl" style="color:#fff;opacity:.7">apresentação · nov 2026</div>'
            f'{big("O Clozzy<br>chega em<br>breve.", "#fff", 96)}'
            f'<p class="lead" style="color:{G4};max-width:440px;margin-top:20px">A primeira plataforma de close friends pago chega em breve com marca nova, '
            f'app novo e uma certeza: quem cria decide o preço do próprio close.</p><div style="margin-top:24px">{dets_close()}</div></div>'
            f'<div style="display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:12mm">{lock(PRETO, 40)}{icones()}</div></div>')
    page(None, body, "preto")




def p_capa_alt():
    """capa alternativa: igual à capa, mas com o arco (círculo) preto; estrela rosa, nome preto"""
    SEC[0] = "capa alternativa"
    rosa = (f'<div style="position:absolute;top:0;right:0;bottom:0;width:41%;background:{WHITE};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px">'
            f'{sym(ARCO_PRETO, 230)}{lock(BRANCO, 46, None)}</div>')
    body = (f'{rosa}<div style="position:relative;display:flex;flex-direction:column;justify-content:space-between;height:100%;width:54%">'
            f'<div><div class="lbl" style="color:#fff;opacity:.7">apresentação · nov 2026</div>'
            f'{big("O Clozzy<br>chega em<br>breve.", "#fff", 96)}'
            f'<p class="lead" style="color:{G4};max-width:440px;margin-top:20px">A primeira plataforma de close friends pago chega em breve com marca nova, '
            f'app novo e uma certeza: quem cria decide o preço do próprio close.</p><div style="margin-top:24px">{dets_close()}</div></div>'
            f'<div style="display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:12mm">{lock(PRETO, 40)}{icones()}</div></div>')
    page(None, body, "preto")




# ================================================================ 02 fomos os primeiros
def p_primeiros():
    SEC[0] = "a história"
    fotos = (f'<div style="display:flex;gap:10px">{foto("ringlight-sorriso", 190, 300, 18, "50% 30%")}'
             f'<div style="display:flex;flex-direction:column;gap:10px">{foto("amigas-selfie", 190, 145, 18, "50% 30%")}{foto("vlog-tripe", 190, 145, 18, "50% 30%")}</div></div>')
    body = (f'<div class="row" style="gap:46px;margin-top:20px;align-items:center"><div style="flex:1">'
            f'<div class="lbl" style="color:{PINK};opacity:1">antes de todo mundo</div>'
            f'{big("Fomos os<br>primeiros.", BLACK, 78)}'
            f'<p style="{TXT};color:{L3};max-width:470px;margin-top:20px">Quando ninguém falava em cobrar pelo close friends, o Clozzy já estava lá: '
            f'a primeira plataforma a deixar a criadora transformar o close em renda. A ideia pegou. O mercado cresceu. '
            f'Em breve, o Clozzy chega com marca nova e app novo.</p>'
            f'<div style="display:flex;gap:10px;margin-top:22px">{tk("o primeiro", PINK, WHITE, 16)}{tk("o original", BLACK, WHITE, 16)}{tk("em breve", PURPLE, WHITE, 16)}</div><div style="margin-top:26px">{icones(48, False)}</div></div>'
            f'{fotos}</div>')
    page(None, body, "branco")


# ================================================================ 03 por que agora
def p_agora():
    SEC[0] = "por que agora"
    itens = [("Criar virou profissão", "Hoje quem cria conteúdo vive disso. O close é onde fica o conteúdo mais próximo, e ele merece ser pago."),
             ("O público já entende", "Todo mundo sabe o que é o close friends. Não precisa explicar: só abrir a porta."),
             ("Exclusivo virou normal", "Pagar pelo conteúdo exclusivo de quem você acompanha já faz parte do dia a dia. Ninguém mais estranha."),
             ("Quem começou, chega", "Fomos os primeiros a abrir esse caminho. Em breve chegamos com marca nova, app novo e prontos para o que vem.")]
    est = [(PINK, "#fff", "rgba(255,255,255,.88)", svg(M.macia(WHITE, 40), "5 5 90 90", 34)), (PURPLE, "#fff", "#EBE3FA", svg(M.macia(WHITE, 40), "5 5 90 90", 34)),
           (WHITE, BLACK, L3, B.estrela_verde(38)), (G1, "#fff", G4, sym(PRETO, 40))]
    cells = "".join(f'<div style="background:{bg};border:1px solid {G3 if bg == G1 else bg};border-radius:18px;padding:22px;min-height:230px;display:flex;flex-direction:column;justify-content:space-between">'
                    f'<div style="display:flex;justify-content:space-between;align-items:flex-start"><div class="d num" style="font-size:34px;color:{ti}">{i + 1:02d}</div>{ic}</div>'
                    f'<div><div class="d" style="font-size:20px;color:{ti}">{t}</div>'
                    f'<div style="{TXT};font-size:11px;color:{tx};margin-top:8px">{u}</div></div></div>' for i, ((t, u), (bg, ti, tx, ic)) in enumerate(zip(itens, est)))
    page("Por que agora", f'<div class="grid" style="grid-template-columns:repeat(4,1fr);gap:14px;margin-top:48px">{cells}</div>'
         f'<div style="margin-top:56px;display:flex;align-items:center;gap:22px">{sym(ARCO_VERDE, 96)}'
         f'<div class="d" style="font-size:30px;color:#fff">O close sempre foi da criadora.<br>Agora ele também paga as contas.</div></div>', "preto",
         "O mercado chegou onde o Clozzy começou.")


# ================================================================ 04 a nova marca
def p_marca():
    SEC[0] = "a nova marca"
    partes = [("A estrela macia", f'<div style="width:180px;height:180px;border-radius:20px;background:{PINK};display:flex;align-items:center;justify-content:center">{tile(ROSA, 148, None)}</div>',
               "Os amigos próximos, o favorito. Pontas redondas, com o ponto da câmera quando aparece sozinha."),
              ("O arco", f'<div style="width:180px;height:180px;border-radius:20px;background:#000;display:flex;align-items:center;justify-content:center">{sym(PRETO, 142)}</div>',
               "O story carregando: traços que crescem e fecham o círculo. No preto, ele é o detalhe rosa."),
              ("A palavra", f'<div style="width:380px;height:180px;border-radius:20px;background:#fff;border:1px solid {L2};display:flex;align-items:center;justify-content:center">{lock(BRANCO, 58)}</div>',
               "“clozzy” com os cantos arredondados, conversando com a estrela e o arco.")]
    cells = "".join(f'<div>{x}<div class="d" style="font-size:16px;margin-top:12px">{t}</div><div style="{TXT};font-size:10.5px;color:{L3};max-width:300px;margin-top:4px">{u}</div></div>' for t, x, u in partes)
    cores = [("Pink Deep", PINK, "a marca"), ("Roxo", PURPLE, "a criadora"), ("Preto", BLACK, "o fundo"), ("Branco", WHITE, "o respiro"), ("Verde", VERDE, "só o close")]
    sw = "".join(f'<div style="display:flex;align-items:center;gap:8px"><i style="width:26px;height:26px;border-radius:8px;background:{c};border:1px solid {L2}"></i>'
                 f'<div><div style="font:800 11px Gabarito">{n}</div><div style="font:600 9px Figtree;color:{L3}">{u}</div></div></div>' for n, c, u in cores)
    # todos os ícones: com arco (todas as superfícies) e só a estrela (com o ponto)
    T = lambda m, ring=True, px=52: (f'<span style="display:inline-block;border-radius:{px * .2237:.1f}px;{"box-shadow:0 0 0 1px " + L2 if m["bg"] == WHITE else ""}">'
                                     + (tile(m, px) if ring else tile(m, px, None)) + '</span>')
    com = [("preto", PRETO), ("criadora", ROXO), ("close", MARCAS[5][1]), ("branco", BRANCO), ("pink deep", ROSA), ("roxo", NO_ROXO), ("verde", NO_VERDE)]
    so = [("branco", BRANCO), ("pink deep", ROSA), ("roxo", NO_ROXO), ("verde", NO_VERDE)]
    lb = f"font:600 8px Figtree;color:{L3}"
    linha = lambda t, itens, ring: (f'<div style="display:flex;align-items:center;gap:12px"><span style="{lb};width:62px">{t}</span>'
                                    + "".join(f'<div style="text-align:center">{T(m, ring)}<div style="{lb};margin-top:4px">{n}</div></div>' for n, m in itens) + '</div>')
    icons = f'<div style="display:flex;flex-direction:column;gap:12px">{linha("com arco", com, True)}{linha("só estrela", so, False)}</div>'
    page("Uma marca nova", f'<div style="display:flex;gap:26px;margin-top:22px">{cells}</div>'
         f'<div style="display:flex;gap:40px;margin-top:22px;padding-top:16px;border-top:1px solid {L2};align-items:flex-start">{icons}'
         f'<div style="display:flex;flex-direction:column;gap:12px">{sw}</div></div>', "branco",
         "A estrela, o arco e a palavra: tudo redondo, próximo e fácil de reconhecer.")


# ================================================================ 05 como funciona
def p_como():
    SEC[0] = "como funciona"
    T = G.tema_fa(B.V)
    T.update(tab=WHITE, destaque=VERDE)
    inicio = phone(V1.s_inicio(T), T, PW, PH)
    aprov = phone(V1.s_aprovado(), V1.TEMAS["rosa"], PW, PH)
    passos = [("A criadora abre o close", "define o preço e o que entra"), ("A fã assina", "paga no Pix, sem cartão e sem cadastro longo"),
              ("Entrou na hora", "o conteúdo libera sozinho"), ("A criadora recebe", "e acompanha tudo no painel")]
    lst = "".join(f'<div style="display:flex;gap:14px;align-items:center;padding:12px 0;border-bottom:1px solid {G3}">'
                  f'{bola(i + 1, *[(PURPLE, WHITE), (PINK, WHITE), (VERDE, WHITE), (WHITE, BLACK)][i])}'
                  f'<div><div class="d" style="font-size:17px;color:#fff">{t}</div><div style="font:500 10.5px Figtree;color:{G4};margin-top:3px">{u}</div></div></div>'
                  for i, (t, u) in enumerate(passos))
    page("Simples como entrar num close friends", f'<div class="row" style="margin-top:16px;gap:40px;align-items:center"><div style="width:380px">{lst}</div>'
         f'<div style="display:flex;gap:16px">{inicio}{aprov}</div></div>', "preto", "Quatro passos. Nenhum deles complicado.")


# ================================================================ 06 para criadoras
def p_criadoras():
    SEC[0] = "para criadoras"
    Tp = dict(V1.TEMAS["preto"], destaque=PURPLE, tab=WHITE, marca=ROXO["slug"])
    painel = phone(V1.s_painel(Tp), Tp, PW, PH)
    Tr = dict(V1.TEMAS["roxo"], marca="roxo")
    painel_roxo = phone(V1.s_painel(Tr), Tr, PW, PH)
    ben = ["Você define o preço do seu close", "Recebe no Pix", "Vê quem assinou e quanto entrou", "Seu conteúdo, suas regras"]
    lst = "".join(f'<div style="display:flex;gap:10px;align-items:center;padding:8px 0;font:700 13px Figtree;color:#fff">'
                  f'{svg(M.macia(WHITE, 40), "5 5 90 90", 16)}{t}</div>' for t in ben)
    page(None, f'<div class="row" style="gap:40px;height:100%;align-items:center"><div style="flex:1">'
         f'<div class="lbl" style="color:#fff;opacity:.8">para criadoras</div>{big("Seu close,<br>seu preço.", "#fff", 72)}'
         f'<div style="margin-top:22px">{lst}</div><div style="margin-top:22px">{bt("Quero abrir meu close", WHITE, PURPLE, 34, 12)}</div></div>'
         f'<div style="display:flex;gap:16px">{painel_roxo}{painel}</div></div>', "roxo")


# ================================================================ 07 para fãs
def p_fas():
    SEC[0] = "para fãs"
    W, H = 168, 298
    a = (f'<div style="position:relative">{foto("espelho-casaco", W, H, 16, "50% 25%")}'
         f'<div style="position:absolute;left:10px;top:12px;display:flex;align-items:center;gap:5px">{B.ring_close("espelho-casaco", 26, VERDE)}'
         f'<b style="font:800 9px Gabarito;color:#fff">mel.rocha</b>{B.selo_pilula("CLOSE", 7)}</div>'
         f'<div style="position:absolute;left:10px;bottom:14px">{tkl([("look do dia", WHITE, BLACK), ("no close da Mel", BLACK, WHITE)], 13, 3)}</div></div>')
    b = (f'<div style="position:relative">{B.blur_foto("make-mesa", W, H, 16)}<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:3">{B.estrela_verde(48)}</div>'
         f'<div style="position:absolute;left:0;right:0;bottom:16px;text-align:center;z-index:3">{tk("Só pro close.", PINK, WHITE, 14)}</div></div>')
    c = (f'<div style="position:relative">{foto("amigas-cafe", W, H, 16, "50% 30%")}'
         f'<div style="position:absolute;left:10px;bottom:14px">{tkl([("o bastidor", WHITE, BLACK), ("que não vai pro feed", PINK, WHITE)], 13, 3)}</div></div>')
    page(None, f'<div class="row" style="gap:40px;height:100%;align-items:center"><div style="flex:1">'
         f'<div class="lbl" style="color:{PINK};opacity:1">para fãs</div>{big("Mais perto de<br>quem você<br>acompanha.", BLACK, 64)}'
         f'<p style="{TXT};color:{L3};max-width:380px;margin-top:18px">O bastidor, o dia a dia, o conteúdo que não vai pro feed. '
         f'Assina no Pix e entra no close na hora. O verde avisa: isso é do close.</p><div style="margin-top:16px">{dets_close()}</div>'
         f'<div style="margin-top:20px">{bt("Entrar no close", PINK, WHITE, 34, 12)}</div></div>'
         f'<div style="display:flex;gap:14px">{a}<div style="width:{W}px">{b}</div>{c}</div></div>', "branco")


# ================================================================ 08 nas redes
def p_redes():
    SEC[0] = "nas redes"
    W, H = 168, 298
    um = (f'<div style="width:{W}px;height:{H}px;border-radius:16px;background:#000;border:1px solid {G3};padding:16px;display:flex;flex-direction:column;justify-content:space-between">'
          f'{sym(PRETO, 58)}<div class="d" style="font-size:30px;color:#fff">Em breve.</div><div style="font:700 9px Figtree;color:{G4}">clozzy.com.br</div></div>')
    dois = (f'<div style="width:{W}px;height:{H}px;border-radius:16px;background:{PINK};padding:16px;display:flex;flex-direction:column;justify-content:space-between">'
            f'{lock(ROSA, 16, None)}<div class="d" style="font-size:26px;color:#fff">O primeiro.<br>O original.<br>Em breve.</div>'
            f'{bt("Saiba mais", WHITE, PINK, 26, 10)}</div>')
    tres = (f'<div style="position:relative">{foto("neon-selfie", W, H, 16, "50% 25%")}<div style="position:absolute;left:10px;top:12px">{B.pill_marca(11)}</div>'
            f'<div style="position:absolute;left:10px;bottom:14px">{tkl([("o clozzy", WHITE, BLACK), ("chega em breve", PINK, WHITE)], 15, 3)}</div></div>')
    quatro = (f'<div style="width:{W}px;height:{H}px;border-radius:16px;background:{PURPLE};padding:16px;display:flex;flex-direction:column;justify-content:space-between">'
              f'{lock(NO_ROXO, 16, None)}<div class="d" style="font-size:26px;color:#fff">Seu close<br>vai virar<br>renda.</div>'
              f'{bt("Abrir meu close", WHITE, PURPLE, 26, 10)}</div>')
    cinco = (f'<div style="width:{W}px;height:{H}px;border-radius:16px;background:#fff;border:1px solid {L2};padding:16px;display:flex;flex-direction:column;justify-content:space-between">'
             f'{sym(BRANCO, 58)}<div class="d" style="font-size:24px;color:{BLACK}">Saudade<br>de quem<br>chegou<br>primeiro?</div><div style="font:700 9px Figtree;color:{L3}">link na bio</div></div>')
    cells = "".join(f'<div>{x}<div class="cap">{t}</div></div>' for x, t in (
        (um, "Teaser no preto"), (dois, "Story Pink Deep"), (tres, "Story com foto"), (quatro, "Convite para criadoras"), (cinco, "Post no branco")))
    page("O lançamento nas redes", f'<div style="display:flex;gap:14px;margin-top:16px">{cells}</div>', "branco",
         "Peças de lançamento: curtas, diretas, com a marca nova.")


# ================================================================ 09 fechamento
def p_fim():
    SEC[0] = "fim"
    rosa = (f'<div style="position:absolute;top:0;left:0;bottom:0;width:41%;background:{PINK};display:flex;align-items:center;justify-content:center">{sym(ROSA, 250)}</div>')
    body = (f'{rosa}<div style="position:relative;margin-left:46%;display:flex;flex-direction:column;justify-content:center;height:100%">'
            f'{big("Fomos os<br>primeiros.<br>Chegando<br>em breve.", "#fff", 72)}'
            f'<p class="lead" style="color:{G4};max-width:420px;margin-top:20px">Seu close, seu preço. Em breve.</p>'
            f'<div style="margin-top:28px;display:flex;gap:30px;align-items:center">{lock(PRETO, 40)}{icones(46, False)}</div></div>')
    page(None, body, "preto")


def build():
    V1.PAGES.clear()
    for fn in (p_capa, p_capa_alt, p_primeiros, p_agora, p_marca, p_como, p_criadoras, p_fas, p_redes, p_fim):
        fn()
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy · em breve</title>'
            f'<style>{V1.CSS}{V2.PHOTO_CSS}</style></head><body>{"".join(V1.PAGES)}</body></html>')
    OUT_HTML.write_text(html)
    subprocess.run([V1.CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer", "--virtual-time-budget=6000",
                    f"--print-to-pdf={OUT_PDF}", OUT_HTML.as_uri()], check=True, capture_output=True)
    print("pages", len(V1.PAGES))


if __name__ == "__main__":
    build()

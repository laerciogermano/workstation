#!/usr/bin/env python3
"""Clozzy — IDENTIDADE VISUAL FINAL (v1.0).

Base visual: ../identidade-verde-letras-redondas (Estrela macia, arco, "clozzy" de cantos redondos, Pink Deep,
roxo, preto, branco e verde close em detalhe). A geometria e as regras de cor vêm de lá, sem mudança.
O que esta versão fecha: o posicionamento do documento de visão (../../README.md): três apps em um, encontro como
pretexto, close como motor, capa sem cara de loja. Voz, peças públicas, telas por app e tokens nascem disso.

Rodar: python3 _build.py → identidade-clozzy-final.html + .pdf + svg/ + tokens.css + tokens.json"""
import base64, importlib.util, io, json, re, subprocess
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter
from shapely.geometry import Polygon

HERE = Path(__file__).resolve().parent
MARCA = HERE.parent

_spec = importlib.util.spec_from_file_location("letras_redondas", MARCA / "identidade-verde-letras-redondas" / "_build.py")
L = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(L)
G, V1, V2, M = L.G, L.V1, L.V2, L.M
PINK, PURPLE, BLACK, WHITE, VERDE = L.PINK, L.PURPLE, L.BLACK, L.WHITE, L.VERDE
G1, G2, G3, G4, L1, L2, L3 = L.G1, L.G2, L.G3, L.G4, L.L1, L.L2, L.L3
TEMAS, mk, ratio = L.TEMAS, L.mk, L.ratio
sym, lock, tile, svg, box, foto, phone = L.sym, L.lock, L.tile, L.svg, L.box, L.foto, L.phone
tk, tkl, bt, selo, ring_close = L.tk, L.tkl, L.bt, L.selo, L.ring_close
estrela_verde, selo_pilula, check_verde = L.estrela_verde, L.selo_pilula, L.check_verde
page = V1.page

OUT_HTML = HERE / "identidade-clozzy-final.html"
OUT_PDF = HERE / "identidade-clozzy-final.pdf"
SVG_DIR = HERE / "svg"

# as cinco marcas homologadas (verde só como selo/ícone do close, nunca como fundo de logo)
M_PRETO, M_BRANCO, M_DEEP, M_ROXO, M_VERDE, M_CLOSE = (m for _n, m in L.MARCAS)
M_CRI = L.ROXO_PRETO

SEC = [""]


def foot(n, t):
    dark = TEMAS[t]["sup"] != WHITE
    return (f'<div class="foot" style="color:{WHITE if dark else BLACK}"><span>Clozzy · identidade visual final · {SEC[0]}</span>'
            f'<span>{n:02d}</span></div>')


V1.foot = foot


def sec(nome):
    SEC[0] = nome


# ================================================================ desfoque real (o backdrop-filter não sai no PDF)
BORRADAS = {}


def blur_foto(name, w, h, r=12, pos=None):
    """mídia trancada: a foto já entra borrada e escurecida, não dá para adivinhar o conteúdo"""
    if name not in BORRADAS:
        im = Image.open(V2.FOTOS / f"{name}.jpg").convert("RGB")
        im.thumbnail((360, 360))
        im = ImageEnhance.Brightness(im.filter(ImageFilter.GaussianBlur(14))).enhance(.6)
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=80)
        BORRADAS[name] = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
    return foto("trancada-" + name, w, h, r, pos or "50% 30%")


# ================================================================ blocos
def txt(s, dark=False, w=None, mt=0, fs=11):
    c = "#E6E6E6" if dark else "#1A1A1A"
    ww = f"max-width:{w}px;" if w else ""
    return f'<div style="font:500 {fs}px/1.6 Figtree;color:{c};{ww}margin-top:{mt}px">{s}</div>'


def card(inner, dark=False, extra=""):
    bg = G1 if dark else L1
    return f'<div style="background:{bg};border-radius:16px;padding:16px;{extra}">{inner}</div>'


def titulo_card(t, dark=False, fs=15):
    return f'<div style="font:900 {fs}px/1.15 Gabarito;letter-spacing:-.02em;color:{"#fff" if dark else "#000"}">{t}</div>'


def lista(itens, dark=False, cor=None, fs=10.5):
    linha = G3 if dark else L2
    fg = "#E6E6E6" if dark else "#1A1A1A"
    cor = cor or (WHITE if dark else BLACK)
    return "".join(f'<div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid {linha};font:500 {fs}px/1.45 Figtree;color:{fg}">'
                   f'<i style="width:6px;height:6px;border-radius:50%;background:{cor};flex-shrink:0;margin-top:5px"></i><span>{x}</span></div>' for x in itens)


def tabela(cab, linhas, dark=False, fs=10.5):
    h = "".join(f"<th>{c}</th>" for c in cab)
    b = "".join("<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>" for r in linhas)
    return f'<table style="font-size:{fs}px;color:{"#E6E6E6" if dark else "#1A1A1A"}"><tr>{h}</tr>{b}</table>'


def cap(s, dark=False):
    return f'<div class="cap" style="color:{G4 if dark else L3};opacity:1">{s}</div>'


def fig(inner, legenda, dark=False):
    return f'<div>{inner}{cap(legenda, dark)}</div>'


# ================================================================ telas
T_PRETO = dict(TEMAS["preto"], destaque=WHITE, cta=WHITE, cta_txt=BLACK, marca=M_PRETO["slug"])
PW, PH = 176, 364


def topo(extra=""):
    return (f'<div style="padding:4px 12px 0;display:flex;justify-content:space-between;align-items:center">{lock(M_PRETO, 15, None)}'
            f'{extra or f"<i style=width:18px;height:18px;border-radius:50%;background:{G2}></i>"}</div>')


def tabbar(on):
    html = V1.tabbar(dict(T_PRETO, tab=WHITE), on)
    return html


def s_abertura():
    return (f'<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px">'
            f'{sym(M_PRETO, 96)}{lock(M_PRETO, 22, None)}</div>'
            f'<div style="position:absolute;bottom:24px;left:0;right:0;text-align:center;font:700 10px Gabarito;color:#fff">Chega mais perto.</div>')


def s_rede():
    st = "".join(f'<div style="text-align:center;font:600 7px Figtree;color:{G4}">{ring_close(n, 36, c)}<div style="margin-top:3px">{t}</div></div>'
                 for n, t, c in (("selfie-chapeu", "Bia", G4), ("amigas-cafe", "Rafa", G4), ("make-sorriso", "Mel", VERDE)))
    return (f'{topo()}<div style="display:flex;gap:9px;padding:9px 12px 0">{st}</div>'
            f'<div style="padding:9px 12px 6px;font:900 12px Gabarito;color:#fff">Gente que você ainda não conhece</div>'
            f'<div style="position:relative;margin:0 8px">{foto("compras-selfie", 148, 176, 14, "50% 25%")}'
            f'<div style="position:absolute;left:8px;right:8px;bottom:8px;background:#000;border-radius:12px;padding:8px;display:grid;gap:2px"><div style="font:900 12px Gabarito;color:#fff">Duda, 21</div>'
            f'<div style="font:600 7.5px Figtree;color:{G4};margin-bottom:5px">dança, café e make</div>{bt("Puxar assunto", WHITE, BLACK, 22, 9)}</div></div>{tabbar(1)}')


def s_chat():
    bol = lambda t, eu: (f'<div style="display:flex;justify-content:{"flex-end" if eu else "flex-start"};margin-top:6px"><span style="max-width:118px;padding:7px 10px;font:500 9px/1.35 Figtree;'
                         f'background:{WHITE if eu else G2};color:{BLACK if eu else WHITE};border-radius:{"12px 12px 4px 12px" if eu else "12px 12px 12px 4px"}">{t}</span></div>')
    act = "".join(f'<span style="height:20px;padding:0 8px;border-radius:999px;background:{G2};font:700 7.5px Figtree;color:#fff;display:inline-flex;align-items:center">{t}</span>' for t in ("Foto", "Vídeo"))
    return (f'<div style="display:flex;align-items:center;gap:7px;padding:5px 10px 8px;border-bottom:1px solid {G3}">{ring_close("compras-selfie", 28, G4)}'
            f'<b style="font:900 10px Gabarito;color:#fff;flex:1">Duda</b>{act}</div>'
            f'<div style="padding:4px 10px">{bol("oi, vi que você também dança", True)}{bol("danço! de onde você surgiu? 👀", False)}{bol("tô conhecendo gente nova", True)}'
            f'<div style="margin-top:6px">{foto("danca-janela", 96, 84, 12, "50% 30%")}</div></div>'
            f'<div style="position:absolute;left:10px;right:10px;bottom:12px;height:30px;border-radius:999px;background:{G1};border:1px solid {G3};display:flex;align-items:center;padding:0 12px;font:500 9px Figtree;color:{G4}">mensagem</div>')


def s_match():
    return (f'<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:16px">'
            f'<div style="display:flex">{ring_close("selfie-chapeu", 62, WHITE)}<div style="margin-left:-8px">{ring_close("compras-selfie", 62, WHITE)}</div></div>'
            f'<div class="d" style="font-size:24px;color:#fff;margin-top:16px">Vocês se<br>curtiram.</div>'
            f'<div style="font:600 9px Figtree;color:#fff;margin-top:7px">Agora é com vocês.</div></div>'
            f'<div style="position:absolute;left:12px;right:12px;bottom:14px;display:grid">{bt("Mandar mensagem", WHITE, PINK, 30, 10)}</div>')


def s_perfil_publico():
    grid = "".join('<div style="position:relative">' + (blur_foto(n, 52, 44, 0, "50% 25%") + f'<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:3">{estrela_verde(18)}</div>'
                   if lk else foto(n, 52, 44, 0, "50% 25%")) + '</div>' for n, lk in
                   (("ringlight-sorriso", False), ("selfie-perto", False), ("make-mesa", True), ("amigas-selfie", False), ("danca-tripe", True), ("vlog-tripe", True)))
    return (f'{foto("ringlight-rosa", 164, 50, 0, "50% 30%")}<div style="padding:0 12px;margin-top:-22px;position:relative"><div style="width:50px;height:50px;border-radius:50%;background:#000;display:flex;align-items:center;justify-content:center">{ring_close("ringlight-sorriso", 46, VERDE)}</div>'
            f'<div style="font:900 13px Gabarito;color:#fff;margin-top:5px">Lara Mendes</div>'
            f'<div style="font:600 8px Figtree;color:{G4}">conversa boa e bastidor</div>'
            f'<div style="display:flex;gap:6px;margin-top:8px">{bt("Seguir", WHITE, BLACK, 24, 9)}{bt("Mensagem", G2, WHITE, 24, 9)}</div></div>'
            f'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin-top:9px">{grid}</div>'
            f'<div style="position:absolute;left:10px;right:10px;bottom:12px;height:30px;border-radius:999px;border:1.5px solid {G3};display:flex;align-items:center;justify-content:center;gap:6px;font:800 10px Gabarito;color:#fff">{estrela_verde(16)}Entrar no close</div>')


def s_folha_close():
    itens = "".join(f'<div style="display:flex;gap:7px;align-items:center;font:600 8.5px Figtree;color:#fff;margin-top:7px">{check_verde(13)}{t}</div>'
                    for t in ("o que está trancado", "drops antes de todo mundo", "chat do close"))
    return (f'{blur_foto("make-mesa", 164, 120, 0)}'
            f'<div style="position:absolute;left:0;right:0;bottom:0;height:252px;background:{G1};border-radius:20px 20px 0 0;padding:14px 12px">'
            f'<div style="display:flex;align-items:center;gap:7px">{estrela_verde(24)}<b style="font:900 13px Gabarito;color:#fff">Close da Lara</b></div>{itens}'
            f'<div class="d num" style="font-size:26px;color:#fff;margin-top:14px">R$ 19,90<span style="font:700 9px Figtree;color:{G4}"> /mês</span></div>'
            f'<div style="font:500 7.5px Figtree;color:{G4};margin-top:3px">cancela quando quiser</div>'
            f'<div style="position:absolute;left:12px;right:12px;bottom:14px;display:grid">{bt("Pagar no Pix", WHITE, BLACK, 30, 10)}</div></div>')


def s_biblioteca():
    linhas = "".join(f'<div style="display:flex;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid {G3}">{foto(n, 36, 36, 9, "50% 25%")}'
                     f'<div style="flex:1"><div style="font:800 9px Gabarito;color:#fff">{t}</div><div style="font:600 7px Figtree;color:{G4}">{u}</div></div>{x}</div>'
                     for n, t, u, x in (("ringlight-sorriso", "Close da Lara", "ativo até 27/12", selo(VERDE, WHITE, "CLOSE", 6.5)),
                                        ("make-paleta", "Pack bastidor", "seu pra sempre", check_verde(14)),
                                        ("danca-tripe", "Ensaio de sexta", "seu pra sempre", check_verde(14))))
    return f'{topo()}<div style="padding:12px 12px 4px;font:900 15px Gabarito;color:#fff">Biblioteca</div><div style="padding:0 12px">{linhas}</div>{tabbar(2)}'


def tela(inner, T=None, w=PW, h=PH):
    return phone(inner, T or T_PRETO, w, h)


# ================================================================ páginas
def p_capa():
    sec("capa")
    rosa = (f'<div style="position:absolute;top:0;right:0;bottom:0;width:42%;background:{PINK};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px">'
            f'{sym(M_DEEP, 260)}{lock(M_DEEP, 58, None)}</div>')
    ic = "".join(tile(m, 46, None) for m in (M_BRANCO, M_DEEP, M_ROXO))
    body = (f'{rosa}<div style="position:relative;display:flex;flex-direction:column;justify-content:space-between;height:100%;width:52%">'
            f'<div style="font:700 10px Figtree;color:{G4}">identidade visual · versão final 1.0 · novembro de 2026</div>'
            f'<div><h1 style="color:#fff;font-size:86px">Chega<br>mais perto.</h1>'
            f'<p class="lead" style="color:#E6E6E6;max-width:420px;margin-top:18px;font-size:14px">O Clozzy é a rede social para conhecer gente nova. '
            f'Três apps em um: rede, flerte e close.</p></div>'
            f'<div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:10mm">{lock(M_PRETO, 40)}<div style="display:flex;gap:10px">{ic}</div></div></div>')
    page(None, body, "preto")


def p_essencia():
    sec("essência")
    cols = (("Pretexto", "Conhecer gente", "O que aparece na capa: perfis, presença e descoberta de quem você ainda não conhece. Criadores e pessoas comuns no mesmo lugar."),
            ("Motor", "Close privado", "O que sustenta o negócio, e só aparece dentro da relação: close, pack, Pix, liberação e biblioteca."),
            ("Objetivo", "A rede padrão", "Ser a rede social padrão onde criadores e pessoas comuns se conhecem, com venda discreta no privado."))
    blocos = "".join(card(f'<div class="lbl">{a}</div>{titulo_card(b, fs=22)}{txt(c, mt=8)}', extra="flex:1") for a, b, c in cols)
    pers = (("Próximo", "fala como gente, chama pra perto", "não soa como empresa nem como loja"),
            ("Discreto", "o exclusivo fica no privado", "não grita preço, pack nem “conteúdo”"),
            ("Íntimo", "sugere o que só quem entra vê", "nunca sensual explícito na marca"),
            ("Claro", "no privado, diz o preço e o que libera", "sem letra miúda nem urgência falsa"))
    tab = tabela(("A marca é", "Como aparece", "O que ela não faz"), [(f'<b style="font:900 13px Gabarito">{a}</b>', b, c) for a, b, c in pers], fs=11)
    page("O que a marca precisa dizer", f'<div style="display:flex;gap:14px;margin-top:20px">{blocos}</div><div style="margin-top:28px">{tab}</div>'
         f'{txt("Em uma frase: <b>o Clozzy aproxima desconhecidos; o que é exclusivo fica entre quem entrou.</b>", mt=24, fs=14)}', "branco",
         "Tirado do documento de visão: três apps em um, encontro social como pretexto, venda de exclusivo como motor.")


def p_tres_apps():
    sec("três apps")
    apps = (("Rede social", "desconhecidos, perfil, presença", tela(s_rede()), "Preto e branco, arco rosa no logo. Story comum é cinza. Sem preço."),
            ("Relacionamento", "mensagem, foto, videochamada", tela(s_chat()), "Conversa em preto e branco. Nada de vender na primeira tela."),
            ("O momento", "quando os dois se curtem", tela(s_match(), TEMAS["rosa"]), "Tela cheia Pink Deep, tudo branco. O rosa grande é para momentos."),
            ("Close", "exclusivo, trancado, liberado", tela(s_folha_close()), "Verde marca o que é do close. Aqui o preço aparece, claro."))
    cells = "".join(f'<div style="width:{PW + 30}px">{titulo_card(a, True, 17)}<div style="font:600 9.5px Figtree;color:{G4};margin:2px 0 10px">{b}</div>{c}'
                    f'<div style="font:500 10px/1.5 Figtree;color:#E6E6E6;margin-top:10px;max-width:{PW}px">{d}</div></div>' for a, b, c, d in apps)
    page("Três apps, uma marca", f'<div style="display:flex;gap:30px;margin-top:18px;zoom:1.08">{cells}</div>', "preto",
         "Uma conta, um ícone, um logo. As áreas não ganham logo nem cor nova: mudam o que aparece e quanto cada cor aparece.")


def p_discricao():
    sec("capa × privado")
    sim, nao = check_verde(16), f'<span style="font:900 13px Gabarito;color:{L3}">–</span>'
    linhas = [("Loja de app, home do site, anúncio, post da marca", nao, nao, nao, "conhecer gente, perfil, conversa"),
              ("Descoberta e feed", nao, "só anel de quem já é do seu close", nao, "pessoas, presença, puxar assunto"),
              ("Perfil público", nao, "selo, anel, trancado", "“Entrar no close”", "prévia suficiente, resto trancado"),
              ("Chat e folha do close", sim, sim, sim, "oferta, preço, Pix, o que libera"),
              ("Biblioteca", sim, sim, sim, "o que é seu e até quando"),
              ("Convite e área de criadora", sim, nao, "“Abrir meu close”", "preço, recebimento, painel (roxo)")]
    tab = tabela(("Onde", "Preço e Pix", "Verde", "Chamada de close", "O assunto"), [(f"<b>{a}</b>", b, c, d, e) for a, b, c, d, e in linhas], fs=11)
    telas = (f'<div style="display:flex;gap:26px;margin-top:22px;align-items:flex-start">'
             f'{fig(tela(s_perfil_publico(), w=164, h=340), "Perfil público: sem preço")}{fig(tela(s_folha_close(), w=164, h=340), "Um toque depois: preço claro")}'
             f'<div style="flex:1;padding-top:8px">{titulo_card("A regra da discrição", fs=20)}'
             f'{lista(["A capa vende o encontro, nunca o conteúdo.", "O preço aparece quando a pessoa pede para ver o close.", "A prévia pública não entrega o que está trancado.", "Notificação na tela bloqueada não cita preço nem mostra mídia.", "Nada de grade de packs como primeira tela."], cor=PINK, fs=11)}</div></div>')
    page("Capa discreta, privado claro", f'<div style="margin-top:12px">{tab}</div>{telas}', "branco",
         "A mesma marca em dois volumes. Quanto mais perto, mais ela fala de dinheiro.")


def p_marca():
    sec("a marca")
    grande = lambda inner, bg=BLACK: f'<div style="width:236px;height:236px;border-radius:20px;background:{bg};display:flex;align-items:center;justify-content:center">{inner}</div>'
    palavra = f'<div style="width:300px;height:236px;border-radius:20px;background:{L1};display:flex;align-items:center;justify-content:center">{palavra_svg(M_BRANCO, False).replace("<svg ", "<svg style=width:230px;height:auto ", 1)}</div>'
    est = grande(svg(M.macia(WHITE, M.ICON_FIT), "5 5 90 90", 180), PINK)
    tres = (f'<div style="display:flex;gap:20px;margin-top:18px">'
            f'<div style="width:236px">{est}<div style="margin-top:10px">{titulo_card("A estrela macia")}{txt("Vale em 55% do raio, contorno redondo de 37,5%, giro −8°. É o ícone. O ponto de câmera (14% do raio, a −60°) só existe quando ela está sozinha.")}</div></div>'
            f'<div style="width:236px">{grande(sym(M_PRETO, 190))}<div style="margin-top:10px">{titulo_card("O símbolo")}{txt("A estrela dentro do arco do story carregando: raio 41, espessura 8, traços que crescem de 2° a 30° e fecham em linha. Sempre uma cor só.")}</div></div>'
            f'<div style="width:300px">{palavra}<div style="margin-top:10px">{titulo_card("A palavra")}{txt("“clozzy” em caixa baixa, Gabarito 800 com cantos arredondados, desenhada em curvas. Fica ao lado do símbolo, separada. O C do arco nunca vira a letra c.")}</div></div></div>')
    locks = (f'<div style="display:flex;gap:14px;margin-top:22px;align-items:stretch">'
             f'{fig(box(M_PRETO, lock(M_PRETO, 40), 320, 110), "Horizontal · assinatura principal")}'
             f'{fig(box(M_PRETO, lock(M_PRETO, 66, M.MAIN_RING, True), 190, 110), "Empilhada · espaço quadrado")}'
             f'{fig(box(M_DEEP, lock(M_DEEP, 30, None), 220, 110), "Estrela + palavra · cabeçalho do app e rodapés")}'
             f'{fig(box(M_DEEP, sym(M_DEEP, 80, None), 120, 110), "Só o ícone · app e favicon")}</div>')
    page("A marca", tres + locks, "branco", "Três peças redondas. Nome: o Clozzy, no masculino.")


def p_versoes():
    sec("versões")
    linhas = (("Preto · principal", M_PRETO, "arco rosa; estrela e palavra brancas"), ("Branco", M_BRANCO, "arco e estrela Pink Deep; palavra preta"),
              ("Pink Deep", M_DEEP, "tudo branco"), ("Roxo · criadora", M_ROXO, "tudo branco"), ("Preto · criadora", M_CRI, "arco roxo; estrela e palavra brancas"),
              ("Preto · close", M_CLOSE, "arco verde; só para o que é do close"))
    rows = "".join(
        f'<div style="display:grid;grid-template-columns:150px 250px 110px 110px 1fr;gap:12px;align-items:center;margin-top:9px">'
        f'<div style="font:900 12.5px Gabarito">{n}</div>{box(m, lock(m, 28), 250, 78)}{box(m, sym(m, 60), 110, 78)}'
        f'{box(m, sym(m, 56, None), 110, 78)}<div style="font:500 10.5px/1.5 Figtree;color:{L3}">{u}</div></div>' for n, m, u in linhas)
    page("Versões por fundo", f'<div style="margin-top:14px">{rows}</div>', "branco",
         "Escolha pelo fundo. Sobre foto, use a versão do preto dentro de uma pílula ou placa preta.")


def p_protecao():
    sec("proteção e tamanhos")
    area = (f'<div style="position:relative;width:520px;height:230px;border-radius:18px;background:{L1};display:flex;align-items:center;justify-content:center">'
            f'<div style="border:1.5px dashed {PINK};padding:30px;border-radius:6px"><div style="border:1px solid {L2};background:#fff">{lock(M_BRANCO, 64)}</div></div></div>')
    tam = "".join(f'<div style="text-align:center">{x}<div class="cap" style="color:{G4}">{t}</div></div>' for x, t in (
        (sym(M_PRETO, 96), "símbolo · 96 px"), (sym(M_PRETO, 48), "48 px"), (sym(M_PRETO, 32, M.MAIN_RING, True), "32 px · corte pequeno"),
        (sym(M_PRETO, 24, M.MAIN_RING, True), "24 px · mínimo"), (tile(M_DEEP, 32, None), "ícone · 32"), (tile(M_DEEP, 16, None), "favicon · 16"),
        (lock(M_PRETO, 24), "logo · 24 px de altura"), (lock(M_PRETO, 18), "18 px · mínimo")))
    icones = "".join(fig(f'<div style="border-radius:22px;{"box-shadow:0 0 0 1px " + L2 if m is M_BRANCO else ""}">{tile(m, 92, None)}</div>', n) for n, m in (("Pink Deep · lojas", M_DEEP), ("Preto", M_PRETO), ("Branco", M_BRANCO), ("Criadora", M_CRI), ("Close", M_VERDE)))
    page("Proteção, tamanhos e ícone", f'<div style="display:flex;gap:28px;margin-top:14px">{area}<div style="flex:1">'
         f'{titulo_card("Área de proteção", fs=18)}{txt("Em volta da assinatura sobra pelo menos <b>¼ da altura do símbolo</b>. Nada entra nessa faixa.", mt=6)}'
         f'{lista(["Até 32 px o símbolo usa o corte pequeno (3 traços, arco 11).", "Abaixo de 24 px, só a estrela.", "Impresso: símbolo a partir de 8 mm; logo a partir de 6 mm de altura."], cor=PINK)}</div></div>'
         f'<div style="display:flex;gap:30px;align-items:flex-end;margin-top:20px;background:#000;border-radius:18px;padding:22px 26px">{tam}</div>'
         f'<div style="display:flex;gap:22px;margin-top:18px">{icones}</div>', "branco")


def p_cores():
    sec("cor")
    cores = (("Pink Deep", PINK, "224 0 90", "A marca. Compra no claro, momentos, arco no preto."), ("Preto", BLACK, "0 0 0", "Fundo principal do app e das peças."),
             ("Branco", WHITE, "255 255 255", "Fundo claro, texto e botão no preto."), ("Roxo", PURPLE, "124 72 196", "Criadora: convite, painel, Studio."),
             ("Verde close", VERDE, "105 195 83", "Só o que é do close, em detalhe."))
    sw = "".join(f'<div><div style="height:150px;border-radius:16px;background:{c};{"border:1px solid " + L2 if c == WHITE else ""}"></div>'
                 f'<div style="font:900 15px Gabarito;margin-top:8px">{n}</div><div class="num" style="font:700 10px Figtree">{c} · RGB {r}</div>'
                 f'<div style="font:500 10px/1.45 Figtree;color:{L3};margin-top:3px">{u}</div></div>' for n, c, r, u in cores)
    neu = "".join(f'<div style="flex:1"><div style="height:44px;border-radius:10px;background:{c};{"border:1px solid " + L2 if c in (L1, L2) else ""}"></div><div class="num" style="font:700 9px Figtree;margin-top:4px">{c}</div><div style="font:500 8.5px Figtree;color:{L3}">{u}</div></div>'
                  for c, u in ((G1, "cartão no preto"), (G2, "chip no preto"), (G3, "linha no preto"), (G4, "apoio no preto"), (L1, "cartão no branco"), (L2, "linha no branco"), (L3, "apoio no branco")))
    prop = "".join(f'<i style="flex:{p};background:{c};border-radius:6px;{"border:1px solid " + L2 if c == WHITE else ""}"></i>' for p, c in ((55, BLACK), (25, WHITE), (12, PINK), (6, PURPLE), (2, VERDE)))
    page("Cinco cores, um papel cada", f'<div class="grid" style="grid-template-columns:repeat(5,1fr);gap:14px;margin-top:16px">{sw}</div>'
         f'<div class="lbl" style="margin-top:22px">Neutros · só cinza puro, sem quase-preto azulado nem creme</div><div style="display:flex;gap:10px">{neu}</div>'
         f'<div class="lbl" style="margin-top:22px">Proporção numa peça ou numa sequência de peças</div><div style="display:flex;gap:3px;height:30px">{prop}</div>'
         f'{cap("preto 55 · branco 25 · Pink Deep 12 · roxo 6 · verde 2")}', "branco", "Tudo chapado: sem degradê, brilho ou sombra. Um rosa só e um verde só.")


def p_pares():
    sec("pares de cor")
    def par(bg, inner, nome, ok=True):
        c = f'<div style="width:150px;height:104px;border-radius:14px;background:{bg};{"border:1px solid " + L2 if bg == WHITE else ""};display:flex;align-items:center;justify-content:center">{inner}</div>'
        risco = "bad claro" if bg == PINK else "bad"
        riscado = f'<div class="{risco}" style="width:150px">{c}</div>'
        return f'<div>{c if ok else riscado}{cap(nome)}</div>'
    T = lambda c, s="Aa": f'<span class="d" style="font-size:34px;color:{c}">{s}</span>'
    ok = [par(BLACK, T(WHITE), "branco no preto"), par(WHITE, T(BLACK), "preto no branco"), par(WHITE, T(PINK), "Pink Deep no branco"),
          par(PINK, T(WHITE), "branco no Pink Deep"), par(PURPLE, T(WHITE), "branco no roxo"), par(BLACK, sym(M_PRETO, 70), "arco rosa no preto")]
    no = [par(PINK, T(BLACK), "preto no rosa", False), par(BLACK, T(PINK), "texto rosa no preto", False), par(PINK, T(PURPLE), "roxo no rosa", False),
          par(PURPLE, T(PINK), "rosa no roxo", False), par(BLACK, T(PURPLE), "texto roxo no preto", False), par(VERDE, T(BLACK), "preto no verde", False)]
    medidos = [("branco / preto", WHITE, BLACK), ("branco / Pink Deep", WHITE, PINK), ("branco / roxo", WHITE, PURPLE), ("Pink Deep / preto", PINK, BLACK),
               ("apoio #8C8C8C / preto", G4, BLACK), ("apoio #666666 / branco", L3, WHITE), ("branco / verde", WHITE, VERDE)]
    def uso(r):
        return "texto livre" if r >= 4.5 else ("só texto grande ou forma" if r >= 3 else "só estrela, check e rótulo 800+")
    tab = tabela(("Par", "Contraste", "Uso"), [(n, f'<b class="num">{ratio(a, b):.1f}:1</b>', uso(ratio(a, b))) for n, a, b in medidos], fs=10)
    page("O que pode e o que não pode", f'<div class="lbl" style="margin-top:14px">Pode</div><div style="display:flex;gap:14px">{"".join(ok)}</div>'
         f'<div class="lbl" style="margin-top:12px">Não pode</div><div style="display:flex;gap:14px">{"".join(no)}</div>'
         f'<div style="display:flex;gap:30px;margin-top:16px"><div style="width:520px">{tab}</div><div style="flex:1">'
         f'{lista(["Rosa e roxo nunca um sobre o outro. Separe com preto ou branco.", "Nada preto sobre o rosa.", "No preto, o rosa é detalhe (até ~2%): arco, não lida, ao vivo, curtida, story tocando. O botão é branco.", "No claro, o botão é Pink Deep.", "Branco no verde fica em 2,2:1: nunca em frase."], cor=PINK, fs=10.5)}</div></div>', "branco")


def p_tipo():
    sec("tipografia")
    disp = (f'<div style="flex:1"><div class="lbl" style="color:#fff">Gabarito · títulos, preços, botões</div>'
            f'<div style="font:900 104px/.95 Gabarito;letter-spacing:-.04em;color:#fff">Aa</div>'
            f'<div style="font:900 40px/1 Gabarito;letter-spacing:-.035em;color:#fff;margin-top:8px">Chega mais perto.</div>'
            f'<div style="font:800 18px Gabarito;color:#fff;margin-top:10px">800 · 900 — abcdefghijklmnopqrstuvwxyz 0123456789</div></div>')
    corpo = (f'<div style="flex:1"><div class="lbl" style="color:#fff">Figtree · texto e interface</div>'
             f'<div style="font:600 104px/.95 Figtree;color:#fff">Aa</div>'
             f'<div style="font:400 15px/1.55 Figtree;color:#E6E6E6;margin-top:10px;max-width:420px">Conheça gente nova, converse sem pressa e, se quiser, chegue mais perto. O que é do close fica no close.</div>'
             f'<div style="font:700 15px Figtree;color:#fff;margin-top:10px">400 · 600 · 700 — R$ 19,90 · ativo até 27/12</div></div>')
    esc = [("Display", "Gabarito 900", "40 / 64", "−0,04 em"), ("Título 1", "Gabarito 900", "28 / 44", "−0,03 em"), ("Título 2", "Gabarito 800", "20 / 28", "−0,02 em"),
           ("Título 3", "Gabarito 800", "16 / 18", "−0,01 em"), ("Corpo", "Figtree 400", "15 / 17", "0"), ("Apoio", "Figtree 600", "13 / 14", "0"),
           ("Rótulo", "Figtree 700", "11 / 12", "0"), ("Botão", "Gabarito 800", "15 / 16", "−0,01 em"), ("Preço", "Gabarito 900", "22 / 28", "algarismos tabulares")]
    tab = tabela(("Estilo", "Fonte", "App / web (px)", "Espaçamento"), esc, True, 10.5)
    page("Tipografia", f'<div style="display:flex;gap:40px;margin-top:14px">{disp}{corpo}</div><div style="margin-top:22px">{tab}</div>', "preto",
         "Duas famílias abertas (licença OFL). Caixa baixa só no nome; títulos em caixa normal.")


def p_elementos():
    sec("elementos")
    raios = "".join(fig(f'<div style="width:70px;height:70px;border-radius:{r}px;background:{L1};border:1.5px solid {BLACK}"></div>', f"{n} · {r}" if r < 99 else n)
                    for n, r in (("xs", 6), ("sm", 10), ("md", 14), ("lg", 18), ("xl", 24), ("pílula", 999)))
    bts = (f'<div style="display:flex;gap:10px;flex-wrap:wrap">'
           f'<div style="background:#000;border-radius:14px;padding:16px;display:flex;gap:8px">{bt("Puxar assunto", WHITE, BLACK, 36, 12)}{bt("Mensagem", G2, WHITE, 36, 12)}</div>'
           f'<div style="background:{L1};border-radius:14px;padding:16px">{bt("Pagar no Pix", PINK, WHITE, 36, 12)}</div>'
           f'<div style="background:{PINK};border-radius:14px;padding:16px">{bt("Mandar mensagem", WHITE, PINK, 36, 12)}</div>'
           f'<div style="background:{PURPLE};border-radius:14px;padding:16px">{bt("Abrir meu close", WHITE, PURPLE, 36, 12)}</div></div>')
    sinais = (f'<div style="display:flex;gap:18px;align-items:center;background:#000;border-radius:14px;padding:16px">'
              f'{ring_close("selfie-chapeu", 52, G4)}{ring_close("make-sorriso", 52, VERDE)}{selo(VERDE, WHITE, "CLOSE", 10)}{estrela_verde(36)}{check_verde(24)}'
              f'<i style="width:11px;height:11px;border-radius:50%;background:{PINK}"></i></div>'
              f'{cap("story comum (cinza) · close ativo (verde) · selo · trancado · liberado · não lida (rosa)")}')
    blocos = (f'<div style="display:flex;gap:30px;margin-top:14px"><div style="width:540px"><div class="lbl">Cantos</div><div style="display:flex;gap:14px">{raios}</div>'
              f'<div class="lbl" style="margin-top:18px">Botões: um principal por tela, sempre em pílula</div>{bts}'
              f'<div class="lbl" style="margin-top:18px">Sinais</div>{sinais}</div>'
              f'<div style="flex:1">{titulo_card("Como se constrói", fs=18)}'
              + lista(["Superfícies chapadas; separação por cinza ou linha de 1 px, sem sombra.", "Espaço em base 4: 4, 8, 12, 16, 24, 32, 48, 64.",
                       "Controles de 32, 44 e 52 px. Toque mínimo 44 px.", "Ícones de linha 1,8 px na grade 24, pontas redondas.",
                       "Texto sobre foto vai em bloco sólido (preto, branco ou Pink Deep).", "Emoji só na voz de pessoa, nunca no logo, botão ou título.", "Um destaque de cor por peça."], cor=PINK, fs=11)
              + "</div></div>")
    page("Elementos", blocos, "branco")


def p_movimento():
    sec("movimento")
    tab = tabela(("Token", "Valor", "Uso"), [("rápido", "120 ms", "toque, curtida, troca de aba"), ("base", "200 ms", "entrada de cartão, aviso"),
                                              ("lento", "320 ms", "folha do close, tela de momento"), ("curva padrão", "cubic-bezier(.2,0,0,1)", "o que entra"),
                                              ("curva de saída", "cubic-bezier(.4,0,1,1)", "o que sai")], True, 11)
    regras = lista(["O logo não se mexe: o arco não gira e os traços não mudam de tamanho.", "Liberou: o desfoque sai e o check verde entra, uma vez.",
                    "Curtida e “vocês se curtiram” escalam de 96% a 100%, sem confete.", "Carregando de conteúdo: bloco cinza no lugar, sem spinner de marca.",
                    "Com movimento reduzido no sistema, tudo vira troca de opacidade ou corte seco.", "Nada pisca para apressar compra."], True, PINK, 11)
    trancado = (f'<div style="position:relative">{blur_foto("make-mesa", 170, 230, 16)}'
                f'<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">{estrela_verde(52)}</div></div>')
    liberado = f'<div style="position:relative">{foto("make-mesa", 170, 230, 16)}<div style="position:absolute;right:10px;bottom:10px">{check_verde(34)}</div></div>'
    page("Movimento", f'<div style="display:flex;gap:36px;margin-top:18px"><div style="width:520px">{tab}</div><div style="flex:1">{regras}</div></div>'
         f'<div style="display:flex;gap:18px;margin-top:34px;align-items:flex-start">'
         f'{fig(trancado, "1 · trancado", True)}{fig(liberado, "2 · liberado (200 ms)", True)}{fig(foto("make-mesa", 170, 230, 16), "3 · seu", True)}</div>', "preto", "Curto e discreto. O movimento confirma, não chama atenção.")


def p_foto():
    sec("pessoas e foto")
    fotos = "".join(foto(n, 150, 190, 14, "50% 25%") for n in ("compras-selfie", "amigas-cafe", "danca-janela", "make-sorriso", "amigas-video", "selfie-chapeu"))
    sim = ["Gente de verdade, em momento comum: selfie, café, dança, make, amigos.", "Luz natural ou ring light; enquadramento de celular.",
           "Rosto e expressão no centro; a pessoa olha, ri, conversa.", "Na descoberta, criador e pessoa comum com o mesmo tratamento.", "Criadoras de 18 a 22 anos, vibe TikTok."]
    nao = ["<b>Ninguém com menos de 18 anos</b>, nem aparência de menor.", "Nada sensual na peça de marca: pele, lingerie, boca, pose.",
           "Foto de banco posada de escritório.", "Mídia trancada que dá para adivinhar através do desfoque.", "Pessoa real sem autorização de imagem em peça publicada."]
    page("Pessoas e foto", f'<div style="display:flex;gap:11px;margin-top:14px">{fotos}</div>'
         f'<div style="display:flex;gap:34px;margin-top:22px"><div style="flex:1">{titulo_card("Mostrar", fs=17)}{lista(sim, cor=PINK, fs=11)}</div>'
         f'<div style="flex:1">{titulo_card("Não mostrar", fs=17)}{lista(nao, cor=BLACK, fs=11)}</div></div>'
         f'{txt("As fotos deste manual são do banco Pexels, <b>sem autorização de imagem para o Clozzy: uso interno apenas</b>. Falta no banco: homens e pessoas comuns, que a visão inclui na rede e no flerte.", mt=16)}', "branco")


def p_voz():
    sec("voz")
    onde = (("Capa", "convite", ["Chega mais perto.", "Gente que você ainda não conhece.", "Puxa assunto."], BLACK),
            ("Flerte", "leve", ["Vocês se curtiram.", "Agora é com vocês.", "Manda um oi."], PINK),
            ("Close", "íntimo e claro", ["Só quem entra, vê.", "Pago no Pix. Liberado na hora.", "Tá na sua biblioteca."], G2),
            ("Criadora", "direto", ["Seu close, seu preço.", "Abriu, recebeu no Pix.", "Você decide quem entra."], PURPLE))
    cols = "".join(f'<div style="flex:1;border-radius:16px;background:{bg};{"border:1px solid " + G3 if bg == BLACK else ""};padding:16px;color:#fff;min-height:190px">'
                   f'<div style="font:700 10px Figtree">{a} · {b}</div>' + "".join(f'<div style="font:900 21px/1.08 Gabarito;letter-spacing:-.02em;margin-top:16px">{x}</div>' for x in c) + '</div>' for a, b, c, bg in onde)
    pares = [("Chega mais perto.", "Assine conteúdos exclusivos."), ("Puxa assunto.", "Dê match agora!"), ("Entrar no close", "Comprar pack"),
             ("Só quem entra, vê.", "Veja o que ela esconde 🔥"), ("Cancela quando quiser.", "Últimas vagas, corre!"), ("Você está no close.", "Pagamento processado com sucesso.")]
    tab = tabela(("Escreva", "Em vez de"), [(f"<b>{a}</b>", f'<span style="color:{L3}">{b}</span>') for a, b in pares], fs=10.5)
    page("Voz: quatro momentos, a mesma pessoa", f'<div style="display:flex;gap:12px;margin-top:14px">{cols}</div>'
         f'<div style="display:flex;gap:30px;margin-top:20px"><div style="width:520px">{tab}</div><div style="flex:1">'
         + lista(["“O Clozzy”, sempre no masculino.", "Fala com “você”, em frases curtas.", "Palavras do produto: close, pack, liberado, biblioteca, desconhecidos, privado.",
                  "Fora: “+18”, “hot”, “monetize”, “plataforma adulta”, fogo e berinjela.", "Na volta ao mercado: “chega em breve”, nunca “estamos de volta”."], cor=PINK, fs=11)
         + "</div></div>", "branco")


def p_telas():
    sec("produto")
    T_cri = dict(TEMAS["preto"], destaque=PURPLE, tab=WHITE, marca=M_CRI["slug"])
    telas = ((tela(s_abertura()), "Abertura"), (tela(s_perfil_publico()), "Perfil público"), (tela(V1.s_aprovado(), TEMAS["rosa"]), "Liberado"),
             (tela(s_biblioteca()), "Biblioteca"), (tela(V1.s_painel(T_cri), T_cri), "Criadora · roxo no preto"))
    cells = "".join(fig(x, t, True) for x, t in telas)
    page("No produto", f'<div style="display:flex;gap:18px;margin-top:16px">{cells}</div>'
         f'{txt("O app nasce no preto. Botão e aba ativa brancos, arco rosa no logo. Pink Deep em tela cheia só nos momentos (curtiram, liberado). Roxo identifica a criadora; verde, o close. Os temas claros e alternativos do protótipo seguem os mesmos papéis.", True, 940, 24, 12)}', "preto")


def p_close():
    sec("verde close")
    K = (("Selo", f'<div style="zoom:1.6;display:flex;gap:6px">{selo(VERDE, WHITE, "CLOSE", 8)}{selo_pilula("CLOSE", 8)}</div>', "no preto e branco direto; em cor ou foto, pílula preta"),
         ("Anel ativo", f'<div style="display:flex;gap:10px">{ring_close("ringlight-rosa", 62, VERDE)}{ring_close("make-sorriso", 62, G4)}</div>', "verde: close · cinza: story comum"),
         ("Trancado", f'<div style="position:relative">{blur_foto("make-ringlight", 120, 130, 12)}<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:3">{estrela_verde(46)}</div></div>', "desfoque forte + estrela verde"),
         ("Liberado", f'<div style="display:flex;align-items:center;gap:9px;border:1px solid {G3};color:#fff;border-radius:14px;padding:12px 14px;font:700 11px Figtree">{check_verde(22)}tá dentro! liberado na hora</div>', "check verde na confirmação"),
         ("Marca do close", sym(M_CLOSE, 96), "arco verde no preto, estrela branca"),
         ("Estrela do close", estrela_verde(92), "o único verde com forma cheia grande, como selo"))
    cells = "".join(f'<div style="border:1px solid {G3};border-radius:16px;padding:14px"><div class="lbl" style="color:#fff">{t}</div>'
                    f'<div style="height:140px;display:flex;align-items:center;justify-content:center">{x}</div>{cap(u, True)}</div>' for t, x, u in K)
    page("Verde: isso é do close", f'<div class="grid" style="grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px">{cells}</div>'
         f'{txt("Um tom só, #69C353, pequeno (~2% da peça). Nunca fundo de peça, botão ou texto. Se não é do close, não é verde.", True, 900, 18, 12)}', "preto")


def pecas_publicas():
    W, H = 188, 334
    a = (f'<div style="position:relative">{foto("amigas-cafe", W, H, 16, "50% 30%")}<div style="position:absolute;left:10px;top:12px">{L.pill_marca(11)}</div>'
         f'<div style="position:absolute;left:10px;bottom:18px">{tkl([("gente nova,", WHITE, BLACK), ("conversa boa", BLACK, WHITE)], 18, 4)}</div></div>')
    b = (f'<div style="width:{W}px;height:{H}px;border-radius:16px;background:{PINK};padding:16px;display:flex;flex-direction:column;justify-content:space-between">'
         f'{sym(M_DEEP, 62)}<div class="d" style="font-size:34px;color:#fff">Chega<br>mais<br>perto.</div>{lock(M_DEEP, 18, None)}</div>')
    c = (f'<div style="width:{W}px;height:{H}px;border-radius:16px;background:#000;border:1px solid {L2};padding:16px;display:flex;flex-direction:column;justify-content:space-between">'
         f'{lock(M_PRETO, 20)}<div class="d" style="font-size:28px;color:#fff">Você ainda<br>não conhece<br>essa gente.</div>{bt("Criar conta", WHITE, BLACK, 32, 11)}</div>')
    d = (f'<div style="width:{W}px;height:{H}px;border-radius:16px;overflow:hidden;background:#fff;border:1px solid {L2}">{foto("compras-selfie", W, 214, 0, "50% 25%")}'
         f'<div style="padding:12px 14px"><div class="d" style="font-size:19px">Puxa<br>assunto.</div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px">{lock(M_BRANCO, 15)}{bt("Entrar", PINK, WHITE, 24, 9)}</div></div></div>')
    return a, b, c, d


def p_publico():
    sec("peças públicas")
    a, b, c, d = pecas_publicas()
    cells = "".join(fig(x, t) for x, t in ((a, "Story · foto"), (b, "Capa tipográfica"), (c, "Anúncio no preto"), (d, "Post no claro")))
    push = (f'<div style="width:300px;border-radius:16px;background:{L1};padding:11px 13px;display:flex;gap:10px;align-items:center">{tile(M_DEEP, 34, None)}'
            f'<div style="flex:1"><div style="display:flex;justify-content:space-between;font:700 9.5px Figtree"><b>Clozzy</b><span style="color:{L3}">agora</span></div>'
            f'<div style="font:500 10px Figtree;margin-top:2px">tem recado novo pra você 👀</div></div></div>')
    page("Peças públicas: o encontro", f'<div style="display:flex;gap:16px;margin-top:14px">{cells}<div style="width:170px">'
         f'{lista(["Sem preço, Pix, pack ou “close” na capa.", "Sem verde: ele só existe dentro da relação.", "Pessoas primeiro, marca em seguida."], cor=PINK)}</div></div>'
         f'<div style="display:flex;gap:30px;align-items:center;margin-top:24px">{fig(push, "Notificação · discreta, sem valor nem mídia")}'
         f'{fig(box(M_BRANCO, lock(M_BRANCO, 26), 220, 70), "Assinatura no claro")}</div>', "branco", "Loja de app, anúncio, redes e home do site.")


def p_privado():
    sec("peças do close e da criadora")
    W, H = 168, 300
    a = (f'<div style="position:relative">{foto("neon-selfie", W, H, 16, "50% 25%")}<div style="position:absolute;left:9px;top:11px;display:flex;align-items:center;gap:5px">'
         f'{ring_close("neon-selfie", 26, VERDE)}<b style="font:800 9px Gabarito;color:#fff">duda</b>{selo(VERDE, WHITE, "CLOSE", 7)}</div>'
         f'<div style="position:absolute;left:9px;bottom:16px">{tkl([("bastidor do", WHITE, BLACK), ("ensaio de hoje", BLACK, WHITE)], 14, 3)}</div></div>')
    b = (f'<div style="position:relative">{blur_foto("make-mesa", W, H, 16)}<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:3">{estrela_verde(50)}</div>'
         f'<div style="position:absolute;left:0;right:0;bottom:18px;text-align:center;z-index:3">{tk("Só quem entra, vê.", PINK, WHITE, 14)}</div></div>')
    c = (f'<div style="width:{W}px;height:{H}px;border-radius:16px;background:{PURPLE};padding:15px;display:flex;flex-direction:column;justify-content:space-between">'
         f'{lock(M_ROXO, 15, None)}<div class="d" style="font-size:27px;color:#fff">Seu close,<br>seu preço.</div>'
         f'<div><div style="font:600 9px/1.4 Figtree;color:#fff;margin-bottom:9px">você define o valor e recebe no Pix</div>{bt("Abrir meu close", WHITE, PURPLE, 28, 10)}</div></div>')
    d = (f'<div style="width:{W}px;height:{H}px;border-radius:16px;background:#000;border:1px solid {G3};padding:15px;display:flex;flex-direction:column;justify-content:space-between">'
         f'{sym(M_CRI, 56)}<div class="d" style="font-size:27px;color:#fff">Abri meu<br>close.</div><div style="font:700 9px Figtree;color:{G4}">link na bio</div></div>')
    cells = "".join(fig(x, t, True) for x, t in ((a, "Story de quem é do close"), (b, "Conteúdo trancado"), (c, "Convite de criadora"), (d, "Criadora no preto")))
    push = (f'<div style="width:190px;border-radius:16px;background:{G1};border:1px solid {G3};padding:12px">'
            f'<div style="display:flex;gap:9px;align-items:center">{tile(M_CRI, 32)}<b style="font:800 10px Gabarito;color:#fff">Clozzy Studio</b></div>'
            f'<div style="font:500 10px/1.45 Figtree;color:#E6E6E6;margin-top:8px">+ R$ 19,90 · nova assinatura no seu close</div></div>')
    page("Peças do close e da criadora", f'<div style="display:flex;gap:16px;margin-top:14px">{cells}{fig(push, "Aviso do Studio (dentro do app)", True)}</div>'
         f'{txt("Estas peças falam com quem já está perto ou com quem quer vender. O convite de criadora vai por canal dirigido (link, convite, Studio), não pela home. Roxo é a criadora; verde é o close; os dois não se encostam.", True, 920, 22, 12)}', "preto")


def p_site():
    sec("site")
    nav = "".join(f'<span style="font:700 10px Figtree;color:#fff">{t}</span>' for t in ("Descobrir", "Segurança", "Entrar"))
    fotos = "".join(foto(n, 150, h, 18, "50% 25%") for n, h in (("compras-selfie", 330), ("amigas-selfie", 280), ("danca-janela", 330)))
    desk = (f'<div style="width:740px;border-radius:16px;overflow:hidden;background:#000;border:1px solid {L2}">'
            f'<div style="height:24px;background:{L2};display:flex;align-items:center;gap:5px;padding:0 12px"><i style="width:8px;height:8px;border-radius:50%;background:#B5B5B5"></i><i style="width:8px;height:8px;border-radius:50%;background:#B5B5B5"></i><span style="font:600 9px Figtree;margin-left:14px">clozzy.com.br</span></div>'
            f'<div style="display:flex;justify-content:space-between;align-items:center;padding:16px 26px">{lock(M_PRETO, 24)}<div style="display:flex;gap:20px">{nav}</div></div>'
            f'<div style="display:flex;gap:26px;padding:10px 26px 30px;align-items:center"><div style="width:220px"><div class="d" style="font-size:46px;color:#fff">Chega<br>mais<br>perto.</div>'
            f'<div style="font:500 11px/1.55 Figtree;color:#E6E6E6;margin:14px 0 18px">A rede para conhecer gente que ainda não é do seu círculo. Conversa, foto e vídeo, no seu tempo.</div>{bt("Criar minha conta", WHITE, BLACK, 36, 12)}'
            f'<div style="font:600 9px Figtree;color:{G4};margin-top:10px">só para maiores de 18 anos</div></div><div style="display:flex;gap:12px">{fotos}</div></div></div>')
    mob = phone(f'{topo()}<div style="padding:10px 12px 0">{foto("compras-selfie", 140, 150, 16, "50% 25%")}<div class="d" style="font-size:25px;color:#fff;margin-top:12px">Chega mais<br>perto.</div>'
                f'<div style="font:500 8.5px/1.5 Figtree;color:#E6E6E6;margin:7px 0 12px">Conheça gente nova.</div></div>'
                f'<div style="position:absolute;left:12px;right:12px;bottom:14px;display:grid">{bt("Criar minha conta", WHITE, BLACK, 30, 10)}</div>', T_PRETO, 176, 364)
    page("Site: a capa", f'<div style="display:flex;gap:26px;margin-top:16px;align-items:flex-start">{desk}{mob}</div>'
         f'{txt("A home não mostra preço, pack nem vitrine. Páginas institucionais, conta e ajuda podem usar o tema branco.", mt=18)}', "branco")


def p_lancamento():
    sec("lançamento")
    W, H = 188, 334
    def st(bg, m, t, rod, borda=False):
        return (f'<div style="width:{W}px;height:{H}px;border-radius:16px;background:{bg};{"border:1px solid " + L2 if borda else ""};padding:16px;display:flex;flex-direction:column;justify-content:space-between">'
                f'{sym(m, 62)}<div class="d" style="font-size:30px;color:{BLACK if bg == WHITE else WHITE}">{t}</div>{rod}</div>')
    rod = lambda m: lock(m, 18, None)
    pecas = ((st(BLACK, M_PRETO, "Em<br>breve.", rod(M_PRETO), True), "Teaser"), (st(PINK, M_DEEP, "O Clozzy<br>chega<br>em breve.", rod(M_DEEP)), "Anúncio"),
             (st(WHITE, M_BRANCO, "Fomos<br>os<br>primeiros.", rod(M_BRANCO), True), "História"), (st(PURPLE, M_ROXO, "Seu close<br>vai virar<br>renda.", rod(M_ROXO)), "Só para criadoras"))
    page("Campanha “chega em breve”", f'<div style="display:flex;gap:18px;margin-top:16px;zoom:1.2">{"".join(fig(x, t) for x, t in pecas)}</div>'
         f'{txt("Tom confiante e para a frente. Não diz que parou nem que voltou, não explica a pausa e não vende o Pix como novidade.", mt=22, fs=12)}', "branco")


def p_nao():
    sec("não fazer")
    S = 104
    cx = lambda bg, inner: f'<div style="width:{S}px;height:{S}px;border-radius:14px;background:{bg};{"border:1px solid " + L2 if bg == WHITE else ""};display:flex;align-items:center;justify-content:center">{inner}</div>'
    d = lambda c, s, fs=16: f'<span class="d" style="font-size:{fs}px;color:{c};text-align:center">{s}</span>'
    ponto = svg(M.RING[M.MAIN_RING][3](WHITE, WHITE) + L._macia(WHITE, M.STAR_FIT, dot=True), "5 5 90 90", 80)
    itens = [(cx(BLACK, ponto), "Ponto dentro do arco"), (cx(BLACK, sym(L.ANEL_ROSA_NO_PRETO, 80)), "Arco em duas cores"),
             (cx(BLACK, svg(M.macia(PINK, M.ICON_FIT), "5 5 90 90", 64)), "Estrela rosa no preto"), (cx(BLACK, bt("Entrar", PINK, WHITE, 28, 11)), "Botão rosa no preto"),
             (cx(PINK, d(BLACK, "clozzy", 24)), "Preto no rosa"), (cx(PURPLE, sym(mk(PURPLE, PINK, PINK, PINK), 76)), "Rosa no roxo"),
             (cx(VERDE, d(WHITE, "Chega<br>mais perto.")), "Verde de fundo"), (cx(WHITE, bt("Assinar", VERDE, WHITE, 28, 11)), "Botão verde"),
             (cx(WHITE, f'<div style="display:flex;align-items:center">{sym(M_BRANCO, 38)}{d(BLACK, "lozzy", 22)}</div>'), "C do símbolo na palavra"),
             (cx("linear-gradient(135deg,#E0005A,#7C48C4)", sym(M_DEEP, 70)), "Degradê"),
             (cx(BLACK, d(WHITE, "Packs a<br>partir de<br>R$ 9", 17)), "Preço na capa"), (cx(WHITE, '<span style="font:900 28px Gabarito">🔥 +18</span>'), "Apelo explícito")]
    cells = "".join(f'<div><div class="bad{" claro" if t == "Preto no rosa" else ""}" style="border-radius:14px">{x}</div>{cap(t)}</div>' for x, t in itens)
    page("Não fazer", f'<div class="grid" style="grid-template-columns:repeat(6,{S}px);gap:22px 52px;margin-top:20px">{cells}</div>'
         f'<div style="display:flex;gap:34px;margin-top:30px"><div style="flex:1">'
         + lista(["Não distorcer, inclinar, contornar ou sombrear a marca.", "Não escrever “Clozzy” com outra fonte no lugar do logo.", "Não usar “meuclozzy” como logo."], cor=PINK, fs=11)
         + '</div><div style="flex:1">' + lista(["Não animar o arco.", "Não criar logo ou cor própria para cada app.", "Não usar o rosa antigo, creme, lavanda ou quase-preto de versões anteriores."], cor=PINK, fs=11) + "</div></div>", "branco")


def p_fecho():
    sec("fecho")
    dec = [("Símbolo", "Estrela macia + arco (a linhagem C + anel vira histórico)"), ("Ponto de câmera", "só na estrela sozinha"), ("Preto", "#000000"),
           ("Rosa", "um só: Pink Deep #E0005A"), ("Creme e lavanda", "fora"), ("Verde #69C353", "cor de significado: o close, em detalhe e no selo/ícone; sem logo sobre verde"),
           ("Nome", "letras redondas sobre Gabarito 800"), ("Degradê", "proibido"), ("No preto", "arco rosa (marca) ou roxo (criadora), estrela branca"), ("Frase de capa", "“Chega mais perto.”")]
    tab = tabela(("Questão", "Decisão"), [(f"<b>{a}</b>", b) for a, b in dec], fs=11)
    chk = ["A peça é pública? Então sem preço, pack, Pix ou verde.", "O fundo define a versão do logo.", "Só um destaque de cor além de preto e branco.",
           "Rosa e roxo separados; nada preto no rosa.", "Verde só no que é do close.", "Pessoas adultas, nada sensual, com autorização de imagem.", "Texto no masculino: “o Clozzy”."]
    page("Decisões e conferência", f'<div style="display:flex;gap:36px;margin-top:14px"><div style="width:560px">{tab}</div><div style="flex:1">{titulo_card("Antes de publicar", fs=18)}'
         f'{lista(chk, cor=PINK, fs=11)}<div style="margin-top:24px">{box(M_PRETO, lock(M_PRETO, 40), 340, 110)}</div></div></div>'
         f'{txt("Arquivos: <b>svg/</b> (marca) · <b>tokens.css</b> e <b>tokens.json</b> · <b>BRAND.md</b> (resumo para pessoas e IA). Registro: marca nominativa CLOZZY, pedido INPI 945932294.", mt=22)}', "branco",
         "Os dez pontos que estavam em aberto entre as versões anteriores, fechados.")


CSS_EXTRA = f".bad.claro::after{{background:linear-gradient(to top right,transparent 48.5%,{WHITE} 49%,{WHITE} 51%,transparent 51.5%)}}"
PAGINAS = [p_capa, p_essencia, p_tres_apps, p_discricao, p_marca, p_versoes, p_protecao, p_cores, p_pares, p_close, p_tipo, p_elementos,
           p_movimento, p_foto, p_voz, p_telas, p_publico, p_privado, p_site, p_lancamento, p_nao, p_fecho]


# ================================================================ arquivos
def write_svgs():
    SVG_DIR.mkdir(exist_ok=True)
    for f_ in SVG_DIR.glob("*.svg"):
        f_.unlink()
    temas = (("preto", M_PRETO), ("branco", M_BRANCO), ("pink-deep", M_DEEP), ("roxo", M_ROXO), ("criadora-no-preto", M_CRI),
             ("uma-cor-preta", M.V["mono-preto"]), ("uma-cor-branca", M.V["mono-branco"]))
    for slug, m in temas:
        for suf, bg in (("", True), ("-transparente", False)):
            (SVG_DIR / f"logo-horizontal-{slug}{suf}.svg").write_text(M.lockup_svg(m, bg=bg))
            (SVG_DIR / f"logo-empilhado-{slug}{suf}.svg").write_text(M.lockup_svg(m, vertical=True, bg=bg))
            (SVG_DIR / f"palavra-{slug}{suf}.svg").write_text(palavra_svg(m, bg))
            (SVG_DIR / f"logo-estrela-{slug}{suf}.svg").write_text(M.lockup_svg(m, ring=None, bg=bg))
            (SVG_DIR / f"simbolo-{slug}{suf}.svg").write_text(M.sym_svg(m, bg=bg))
        (SVG_DIR / f"simbolo-pequeno-{slug}.svg").write_text(M.sym_svg(m, small=True, bg=True))
        (SVG_DIR / f"icone-{slug}.svg").write_text(M.sym_svg(m, ring=None, bg=True))
    for slug, m in (("pink-deep", M_DEEP), ("preto", M_PRETO), ("branco", M_BRANCO)):
        (SVG_DIR / f"app-icon-{slug}.svg").write_text(M.tile_svg(m, ring=None))
    (SVG_DIR / "app-icon-criadora.svg").write_text(M.tile_svg(M_CRI))
    (SVG_DIR / "app-icon-close.svg").write_text(M.tile_svg(M_VERDE, ring=None))
    (SVG_DIR / "favicon.svg").write_text(M.tile_svg(M_DEEP, ring=None, size=64))
    (SVG_DIR / "close-simbolo-preto.svg").write_text(M.sym_svg(M_CLOSE, bg=True))
    (SVG_DIR / "close-estrela.svg").write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="256" height="256"><title>Clozzy · estrela do close</title>'
        f'<circle cx="50" cy="50" r="50" fill="{VERDE}"/><g transform="translate(21 21) scale(.58)">{M.macia(WHITE, 40)}</g></svg>\n')
    for f_ in SVG_DIR.glob("*.svg"):
        f_.write_text(expandir_estrela(f_.read_text()))


def palavra_svg(m, bg):
    s = 100 / M.LH
    w, h = M.WW * s, 100 - M.YD * s
    inner = f'<path transform="translate(0 100) scale({s:.5f})" d="{M.WD}" fill="{m["word"]}"/>'
    return M.svg_wrap(inner, w, h, m["bg"] if bg else None, 18)


def expandir_estrela(svg_txt):
    """masters: a estrela sai como contorno preenchido (polígono + traço falha em alguns programas)"""
    def troca(g):
        pts = [tuple(map(float, par.split(","))) for par in g.group(1).split()]
        forma = Polygon(pts).buffer(float(g.group(3)) / 2, join_style=1, quad_segs=24)
        d = "M" + "L".join(f"{x:.3f} {y:.3f}" for x, y in list(forma.exterior.coords)[:-1]) + "Z"
        return f'<path d="{d}" fill="{g.group(2)}"/>'
    return re.sub(r'<polygon points="([^"]+)" fill="([^"]+)" stroke="[^"]+" stroke-width="([^"]+)" stroke-linejoin="round"/>', troca, svg_txt)


PRIM = {"pink-deep": PINK, "roxo": PURPLE, "verde-close": VERDE, "preto": BLACK, "branco": WHITE,
        "cinza-1": G1, "cinza-2": G2, "cinza-3": G3, "cinza-4": G4, "claro-1": L1, "claro-2": L2, "claro-3": L3}
PAPEIS = ("superficie", "superficie-2", "linha", "titulo", "texto", "apoio", "destaque", "botao", "botao-texto", "compra", "compra-texto", "chip", "arco", "close")
TEMA_TOK = {  # no preto o rosa é só o arco/detalhe e o botão é branco; no rosa e no roxo tudo branco, sem verde
    "preto": (BLACK, G1, G3, WHITE, "#E6E6E6", G4, WHITE, WHITE, BLACK, WHITE, BLACK, G2, PINK, VERDE),
    "branco": (WHITE, L1, L2, BLACK, "#1A1A1A", L3, PINK, PINK, WHITE, PINK, WHITE, L1, PINK, VERDE),
    "rosa": (PINK, "rgba(255,255,255,.16)", "rgba(255,255,255,.32)", WHITE, WHITE, "rgba(255,255,255,.86)", WHITE, WHITE, PINK, WHITE, PINK, "rgba(255,255,255,.2)", WHITE, WHITE),
    "roxo": (PURPLE, "#8C5ECB", "#A37FD6", WHITE, WHITE, "#EBE3FA", WHITE, WHITE, PURPLE, WHITE, PURPLE, "#9165CD", WHITE, WHITE),
    "criadora": (BLACK, G1, G3, WHITE, "#E6E6E6", G4, WHITE, WHITE, BLACK, WHITE, BLACK, G2, PURPLE, VERDE),
}
TIPO = {"display": (900, 40, 64, 0.92, "display", "-0.04em"), "titulo-1": (900, 28, 44, 1.02, "display", "-0.03em"),
        "titulo-2": (800, 20, 28, 1.08, "display", "-0.02em"), "titulo-3": (800, 16, 18, 1.15, "display", "-0.01em"),
        "corpo": (400, 15, 17, 1.5, "texto", "0"), "corpo-forte": (700, 15, 17, 1.5, "texto", "0"), "apoio": (600, 13, 14, 1.4, "texto", "0"),
        "rotulo": (700, 11, 12, 1.2, "texto", "0"), "botao": (800, 15, 16, 1, "display", "-0.01em"), "preco": (900, 22, 28, 1, "display", "-0.02em")}
ESP = (4, 8, 12, 16, 24, 32, 48, 64)
RAIO = {"xs": 6, "sm": 10, "md": 14, "lg": 18, "xl": 24, "pilula": 999}
CONTROLE = {"p": 32, "m": 44, "g": 52}
DUR = {"rapido": 120, "base": 200, "lento": 320}
CURVA = {"padrao": "cubic-bezier(.2,0,0,1)", "saida": "cubic-bezier(.4,0,1,1)"}


def write_tokens():
    css = ["/* Clozzy · identidade final 1.0 · gerado por _build.py — não editar à mão */", ":root{"]
    css += [f"  --cz-{k}:{v};" for k, v in PRIM.items()]
    css += ["  --cz-fonte-display:Gabarito,system-ui,sans-serif;", "  --cz-fonte-texto:Figtree,system-ui,sans-serif;"]
    for k, (w, app, _web, lh, fam, tr) in TIPO.items():
        css += [f"  --cz-tipo-{k}:{w} {app}px/{lh} var(--cz-fonte-{fam});", f"  --cz-tracking-{k}:{tr};"]
    css += [f"  --cz-esp-{i}:{v}px;" for i, v in enumerate(ESP, 1)]
    css += [f"  --cz-raio-{k}:{v}px;" for k, v in RAIO.items()]
    css += [f"  --cz-controle-{k}:{v}px;" for k, v in CONTROLE.items()]
    css += [f"  --cz-dur-{k}:{v}ms;" for k, v in DUR.items()]
    css += [f"  --cz-curva-{k}:{v};" for k, v in CURVA.items()]
    css += ["  --cz-veu:rgba(0,0,0,.6);", "}"]
    for t, vals in TEMA_TOK.items():
        sel = ':root,[data-tema="preto"]' if t == "preto" else f'[data-tema="{t}"]'
        css.append(sel + "{" + ";".join(f"--{p}:{v}" for p, v in zip(PAPEIS, vals)) + "}")
    css.append("@media (min-width:768px){:root{" + ";".join(f"--cz-tipo-{k}:{w} {web}px/{lh} var(--cz-fonte-{fam})" for k, (w, _a, web, lh, fam, _t) in TIPO.items()) + "}}")
    css.append("@media (prefers-reduced-motion:reduce){:root{--cz-dur-rapido:0ms;--cz-dur-base:0ms;--cz-dur-lento:0ms}}")
    (HERE / "tokens.css").write_text("\n".join(css) + "\n")
    data = dict(marca="Clozzy", versao="1.0", cor=PRIM, temas={t: dict(zip(PAPEIS, v)) for t, v in TEMA_TOK.items()},
                fonte=dict(display="Gabarito", texto="Figtree"),
                tipo={k: dict(peso=w, app=a, web=wb, altura=lh, familia=fam, tracking=tr) for k, (w, a, wb, lh, fam, tr) in TIPO.items()},
                espaco=list(ESP), raio=RAIO, controle=CONTROLE, duracao_ms=DUR, curva=CURVA)
    (HERE / "tokens.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def build():
    V1.PAGES.clear()
    for p in PAGINAS:
        p()
    base_css = re.sub(r"\.f-[\w-]+\{[^}]*\}", "", V1.CSS)           # só as fotos do banco atual
    corpo = "".join(V1.PAGES)
    usadas = set(re.findall(r"\bf-([\w-]+)", corpo))
    fotos = "".join(r for r in re.findall(r"\.f-[\w-]+\{[^}]*\}", V2.PHOTO_CSS) if r[3:r.index("{")] in usadas)
    fotos += "".join(f".f-trancada-{n}{{background-image:url({u})}}" for n, u in BORRADAS.items())
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy · identidade visual final</title>'
            f'<style>{base_css}{CSS_EXTRA}{fotos}</style></head><body>{corpo}</body></html>')
    assert "#ff0065" not in html.lower()
    OUT_HTML.write_text(html)
    write_svgs()
    write_tokens()
    subprocess.run([V1.CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer", "--virtual-time-budget=8000",
                    f"--print-to-pdf={OUT_PDF}", OUT_HTML.as_uri()], check=True, capture_output=True)
    print("pages", len(V1.PAGES), "svgs", len(list(SVG_DIR.glob("*.svg"))))


if __name__ == "__main__":
    build()

#!/usr/bin/env python3
"""Clozzy — manual de uso da marca · Estrela macia · v2.

O que muda do v1 (../uso-da-marca-estrela-macia):
- estrutura em 7 capítulos, com abertura de capítulo e sumário por capítulo;
- muito mais utilizações: TikTok (vídeo, capas, perfil), kit da criadora, link na bio, convite/QR, onboarding da criadora,
  stickers, legendas, evento/pop-up;
- fotos no tom TikTok: criadoras de 18–22 anos com ring light, selfie, dancinha, make e amigas (../fotos-criadoras,
  banco Pexels). Nada sensual: o lado exclusivo da Clozzy fica no ar, não na foto;
- UM rosa só: Pink Deep #E0005A. O #FF0065 sai da paleta. Paleta = Pink Deep, roxo, preto #000, branco e cinzas neutros.

Reaproveita as peças do v1 (telas, celular, navegador, story) trocando a cor e as fotos.
Rodar: python3 _build.py → manual-uso-estrela-macia-v2.html + .pdf + tokens.css + tokens.json"""
import base64, importlib.util, json, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
MARCA = HERE.parent
FOTOS = MARCA / "fotos-criadoras"

_spec = importlib.util.spec_from_file_location("manual_v1", MARCA / "uso-da-marca-estrela-macia" / "_build.py")
V1 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(V1)
M, IB = V1.M, V1.IB

# ---------------------------------------------------------------- um rosa só: Pink Deep
OLD_PINK = "#FF0065"
DEEP, PURPLE, BLACK, WHITE = M.DEEP, M.PURPLE, M.BLACK, M.WHITE
PINK = DEEP


def _swap(x):
    return DEEP if isinstance(x, str) and x.upper() == OLD_PINK else x


for v in M.VARS:                         # variações de cor da marca
    for k in list(v):
        v[k] = _swap(v[k])
M.PINK = V1.PINK = IB.PINK = DEEP
IB.THEMES[:] = [tuple(_swap(x) if not isinstance(x, tuple) else tuple(_swap(y) for y in x) for x in t) for t in IB.THEMES]
IB.THEMES[4] = ("rosa", "Pink Deep total", DEEP, "rgba(255,255,255,.16)", "rosa", (WHITE, DEEP), WHITE)
V1.APP_THEMES = IB.THEMES
V1.TEMAS["rosa"].update(nome="Pink Deep", sup=DEEP, sup2="rgba(255,255,255,.16)", linha="rgba(255,255,255,.32)",
                        chip="rgba(255,255,255,.2)", apoio="rgba(255,255,255,.86)",
                        uso="Momento de cor: compra aprovada, lançamento, convite. Tudo branco por cima.")
for t in V1.TEMAS.values():
    for k in list(t):
        t[k] = _swap(t[k])
V1.CSS = V1.CSS.replace(OLD_PINK, DEEP)
import re  # noqa: E402
V1.CSS = re.sub(r"\.f-(cetim|costas|homem|labios)\{[^}]*\}", "", V1.CSS)   # tira as fotos sensuais do v1

# ---------------------------------------------------------------- fotos novas (e apelidos para as telas do v1)
ALIAS = {"costas": "ringlight-rosa", "labios": "selfie-perto", "cetim": "neon-selfie", "homem": "amigas-selfie"}


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(Path(p).read_bytes()).decode()


PHOTO_CSS = "".join(f'.f-{p.stem}{{background-image:url({b64(p, "image/jpeg")})}}' for p in sorted(FOTOS.glob("*.jpg")))
PHOTO_CSS += "".join(f'.f-{a}{{background-image:url({b64(FOTOS / (b + ".jpg"), "image/jpeg")})}}' for a, b in ALIAS.items())

V1.PAGES.clear()
OUT_HTML = HERE / "manual-uso-estrela-macia-v2.html"
OUT_PDF = HERE / "manual-uso-estrela-macia-v2.pdf"
TEMAS = V1.TEMAS
G1, G2, G3, G4, L1, L2, L3 = V1.G1, V1.G2, V1.G3, V1.G4, V1.L1, V1.L2, V1.L3
foto, btn, chip, selo, logo_app, phone, tabbar, ring_av, story, browser = (
    V1.foto, V1.btn, V1.chip, V1.selo, V1.logo_app, V1.phone, V1.tabbar, V1.ring_av, V1.story, V1.browser)
sym, lock, tile, svg, box, V, f = V1.sym, V1.lock, V1.tile, V1.svg, IB.box, M.V, M.f
CHAPTER = [""]


def foot(n, t):
    dark = TEMAS[t]["sup"] != WHITE
    return (f'<div class="foot" style="color:{WHITE if dark else BLACK}"><span>Clozzy · manual de uso da marca v2 · {CHAPTER[0]}</span>'
            f'<span>{n:02d}</span></div>')


V1.foot = foot
page = V1.page

CHAPTERS = [  # nº, título, superfície da abertura, frase, páginas
    (1, "Fundamentos", "preto", "Marca, cor, tipo e os elementos que montam tudo o resto."),
    (2, "Linguagem", "rosa", "Como a Clozzy aparece em foto, como fala e como escreve."),
    (3, "Produto", "preto", "O app, o perfil da criadora e o que sai dele."),
    (4, "Redes sociais", "roxo", "TikTok, Reels, stories, feed e o kit que a criadora usa."),
    (5, "Site e marketing", "branco", "Landing, anúncios, e-mail e convites."),
    (6, "Mundo físico", "rosa", "Impressos, brindes e evento."),
    (7, "Regras", "preto", "O que não fazer e o checklist antes de publicar."),
]
TOC = {}


def divider(num):
    n, title, t, phrase = CHAPTERS[num - 1]
    CHAPTER[0] = f"{n:02d} {title}"
    T = TEMAS[t]
    pics = {1: ("ringlight-sorriso", "selfie-chapeu"), 2: ("neon-selfie", "amigas-selfie"), 3: ("tela-celular", "vlog-tripe"),
            4: ("danca-tripe", "ringlight-neon"), 5: ("compras-selfie", "amigas-cafe"), 6: ("amigas-video", "espelho-casaco"),
            7: ("make-sorriso", "selfie-perto")}[num]
    mark = "preto" if t == "preto" else ("branco" if t == "branco" else t)
    body = (f'<div style="display:flex;justify-content:space-between;height:100%">'
            f'<div style="display:flex;flex-direction:column;justify-content:space-between;padding-bottom:14mm">'
            f'<div class="d num" style="font-size:150px;color:{T["destaque"] if t != "preto" else DEEP}">{n:02d}</div>'
            f'<div><h1 style="color:{T["titulo"]}">{title}</h1><p class="lead" style="color:{T["apoio"] if t != "branco" else L3};font-size:14px;max-width:380px">{phrase}</p>'
            f'<div style="margin-top:22px;font:600 11px/1.9 Figtree;color:{T["titulo"]}">' + "<br>".join(TOC.get(num, [])) + '</div></div></div>'
            f'<div style="display:flex;gap:14px;align-items:center">{foto(pics[0], 210, 420, 22, "50% 30%")}'
            f'<div style="display:flex;flex-direction:column;gap:14px">{foto(pics[1], 200, 250, 22, "50% 30%")}'
            f'{box(V[mark], sym(V[mark], 120, None if num % 2 else M.MAIN_RING), 200, 156)}</div></div></div>')
    page(None, body, t)


# ================================================================ capítulo 1 · fundamentos
def p_capa():
    CHAPTER[0] = "capa"
    T = TEMAS["preto"]
    pics = [("ringlight-sorriso", 200, 300), ("neon-selfie", 200, 300), ("danca-janela", 200, 300)]
    body = (f'<div style="display:flex;flex-direction:column;justify-content:space-between;height:100%">'
            f'<div style="display:flex;justify-content:space-between;align-items:flex-start">'
            f'<div><h1 style="color:#fff">Manual de<br>uso da marca</h1><p class="lead" style="color:{G4};max-width:380px;margin-top:14px">'
            f'Versão 2: mais estruturada, com muito mais utilizações e o tom de quem cria conteúdo hoje. Um rosa só, o Pink Deep.</p></div>'
            f'<div style="display:flex;gap:12px">' + "".join(foto(a, w, h, 20, "50% 30%") for a, w, h in pics) + '</div></div>'
            f'<div style="display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:12mm">{lock("preto", 60)}'
            f'<div style="display:flex;gap:10px">{tile("rosa", 74, None)}{tile("preto", 74)}{tile("roxo", 74, None)}</div></div></div>')
    page(None, body, "preto")


def p_estrutura():
    CHAPTER[0] = "estrutura"
    cards = ""
    for n, title, t, phrase in CHAPTERS:
        T = TEMAS[t]
        bd = "border:1px solid #E6E6E6;" if t == "branco" else ""
        items = "".join(f'<div style="font:600 9.5px/1.7 Figtree;color:{T["titulo"]};opacity:.9">{x}</div>' for x in TOC.get(n, []))
        cards += (f'<div style="background:{T["sup"]};{bd}border-radius:16px;padding:14px;min-height:200px">'
                  f'<div class="d num" style="font-size:34px;color:{T["destaque"] if t != "preto" else DEEP}">{n:02d}</div>'
                  f'<h3 style="color:{T["titulo"]};font-size:16px;margin:2px 0 8px">{title}</h3>{items}</div>')
    page("Como o manual está organizado", f'<div class="grid" style="grid-template-columns:repeat(4,1fr);gap:12px;margin-top:16px">{cards}'
         f'<div style="border-radius:16px;padding:14px;background:{L1}"><h3 style="font-size:16px">Como usar</h3>'
         f'<div style="font:500 10.5px/1.6 Figtree;color:{L3};margin-top:8px">Fundamentos é a régua. Os outros capítulos são exemplos prontos: copie a estrutura, troque a foto e o texto.'
         f' Toda peça passa pelo checklist do capítulo 7.</div></div></div>', "branco", "Sete capítulos, da régua às peças. Os números ao lado de cada item são as páginas.")


def p_cores():
    sw = [("Pink Deep", DEEP, "224 0 90", "O rosa da marca, o único. Botão de compra, destaque, momento de cor."),
          ("Roxo", PURPLE, "124 72 196", "O lado da criadora. Nunca encosta no Pink Deep."),
          ("Preto", BLACK, "0 0 0", "Preto de verdade. Fundo do app, das capas e dos vídeos."),
          ("Branco", WHITE, "255 255 255", "Branco de verdade. Site, conta, e-mail e cards claros.")]
    cards = "".join(f'<div><div style="height:170px;border-radius:16px;background:{c};{"border:1px solid #E6E6E6;" if c == WHITE else ""}"></div>'
                    f'<h3 style="margin-top:8px;font-size:16px">{n}</h3><div class="num" style="font:700 10px Figtree;margin-top:2px">{c.upper()} · RGB {r}</div>'
                    f'<div class="cap" style="margin-top:3px">{t}</div></div>' for n, c, r, t in sw)
    greys = "".join(f'<div style="text-align:center"><div style="width:60px;height:34px;border-radius:8px;background:{c};border:1px solid #E6E6E6"></div>'
                    f'<div class="cap num">{c}</div></div>' for c in (G1, G2, G3, G4, L1, L2, L3))
    prop = (f'<div style="display:flex;height:26px;border-radius:8px;overflow:hidden;border:1px solid #E6E6E6;width:500px">'
            f'<i style="flex:50;background:{BLACK}"></i><i style="flex:28;background:{WHITE}"></i><i style="flex:15;background:{DEEP}"></i>'
            f'<i style="flex:7;background:{PURPLE}"></i></div><div class="cap">Preto 50 · branco 28 · Pink Deep 15 · roxo 7</div>')
    page("Cores", f'<div class="grid" style="grid-template-columns:repeat(4,1fr);gap:16px;margin-top:16px">{cards}</div>'
         f'<div class="row" style="margin-top:22px;gap:40px"><div><div class="lbl">Proporção numa peça típica</div>{prop}</div>'
         f'<div><div class="lbl">Cinzas neutros (só superfície, linha e apoio)</div><div style="display:flex;gap:8px">{greys}</div></div></div>',
         "branco", "Quatro cores e cinzas neutros. Um rosa só: o Pink Deep #E0005A. Sem creme, sem quase-preto, sem degradê.")


def p_combinacoes():
    ok = [("preto", "Preto: anel Pink Deep, estrela branca"), ("branco", "Branco: tudo Pink Deep, palavra preta"),
          ("rosa", "Pink Deep: tudo branco"), ("roxo", "Roxo: tudo branco"), ("preto-bicolor", "Preto bicolor: traços brancos"),
          ("mono-preto", "Uma cor: preto")]
    oks = "".join(f'<div>{box(V[s], sym(V[s], 88), 112, 112)}<div class="cap">{t}</div></div>' for s, t in ok)
    pares = [(BLACK, DEEP, "ok"), (BLACK, PURPLE, "ok"), (WHITE, DEEP, "ok"), (WHITE, PURPLE, "ok"), (DEEP, WHITE, "ok"), (PURPLE, WHITE, "ok"),
             (DEEP, BLACK, "não"), (PURPLE, DEEP, "não"), (DEEP, PURPLE, "não")]
    pp = "".join(f'<div style="text-align:center"><div style="width:62px;height:62px;border-radius:12px;background:{a};display:flex;align-items:center;justify-content:center;'
                 f'{"border:1px solid #E6E6E6;" if a == WHITE else ""}"><b class="d" style="font-size:22px;color:{b}">Aa</b></div>'
                 f'<div class="cap" style="color:{DEEP if s == "não" else L3};font-weight:800">{s}</div></div>' for a, b, s in pares)
    page("Combinações", f'<div class="grid" style="grid-template-columns:repeat(6,112px);gap:14px;margin-top:16px">{oks}</div>'
         f'<div class="lbl" style="margin-top:22px">Fundo × texto</div><div style="display:flex;gap:12px">{pp}</div>'
         f'<div style="font-size:11.5px;line-height:1.7;margin-top:14px;max-width:700px">Nada preto sobre o Pink Deep. Pink Deep e roxo nunca um sobre o outro: '
         f'sempre preto ou branco entre eles. Em foto, a marca vai branca ou Pink Deep, sobre a área mais calma da imagem.</div>',
         "branco", "As combinações aprovadas. Em dúvida: preto com Pink Deep e branco.")


def sticker(txt, bg, fg, rot=0, fs=12, icon=True):
    ic = svg(M.macia(fg, 40, dot=False), "5 5 90 90", fs) if icon else ""
    return (f'<span style="display:inline-flex;align-items:center;gap:5px;padding:{fs * .45}px {fs * .8}px;border-radius:999px;background:{bg};color:{fg};'
            f'font:900 {fs}px Gabarito;letter-spacing:-.01em;transform:rotate({rot}deg);white-space:nowrap;{"border:1.5px solid #E6E6E6;" if bg == WHITE else ""}">{ic}{txt}</span>')


def p_stickers():
    st = [("novo drop", DEEP, WHITE, -4), ("só pro close", BLACK, WHITE, 3), ("link na bio", WHITE, BLACK, -2), ("ao vivo", DEEP, WHITE, 2),
          ("bastidor", PURPLE, WHITE, -3), ("hoje 20h", BLACK, WHITE, 4), ("me acha no close", WHITE, DEEP, -1), ("rotina", PURPLE, WHITE, 2)]
    grid = "".join(f'<div style="display:flex;align-items:center;justify-content:center;height:70px">{sticker(t, b, c, r, 15)}</div>' for t, b, c, r in st)
    icons = [("Close", "star"), ("Pack", "pack"), ("Pix", "pix"), ("Chat", "chat"), ("Ao vivo", "live"), ("Biblioteca", "lib")]
    paths = {"pack": '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2"/>',
             "pix": '<path d="M12 3l4 4-4 4-4-4zM12 13l4 4-4 4-4-4zM3 12l4-4 4 4-4 4zM13 12l4-4 4 4-4 4z"/>',
             "chat": '<path d="M4 18.5V6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v8a2.5 2.5 0 01-2.5 2.5H8z"/>',
             "live": '<circle cx="12" cy="12" r="3"/><path d="M6.5 6.5a8 8 0 000 11M17.5 6.5a8 8 0 010 11"/>',
             "lib": '<rect x="4" y="4" width="6" height="16" rx="1.5"/><rect x="12" y="4" width="4" height="16" rx="1.2"/>'}
    ics = ""
    for n, k in icons:
        inner = (svg(M.macia(WHITE, 40), "5 5 90 90", 26) if k == "star" else
                 f'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{paths[k]}</svg>')
        ics += f'<div style="text-align:center"><div style="width:54px;height:54px;border-radius:16px;background:{G2};display:flex;align-items:center;justify-content:center">{inner}</div><div class="cap" style="color:#fff">{n}</div></div>'
    page("Stickers e ícones", f'<div class="row" style="margin-top:16px;gap:30px"><div style="flex:1.3"><div class="lbl" style="color:#fff">Stickers (vídeo, story, capa)</div>'
         f'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:16px;border-radius:16px;border:1px solid #333">{grid}</div>'
         f'<div class="cap" style="color:{G4}">Pílula com a estrela sem ponto, Gabarito 900, levemente torta (−4° a 4°). Até dois por tela.</div></div>'
         f'<div style="flex:1"><div class="lbl" style="color:#fff">Ícones do produto</div><div style="display:flex;gap:12px;flex-wrap:wrap">{ics}</div>'
         f'<div class="cap" style="color:{G4};margin-top:10px">Traço 2 com pontas redondas, cantos macios. O “close” é sempre a estrela da marca.</div></div></div>',
         "preto", "A linguagem que conversa com TikTok e stories sem virar bagunça.")


# ================================================================ capítulo 2 · linguagem
def p_foto():
    grid = [("ringlight-sorriso", "Ring light, sorrindo"), ("neon-selfie", "Selfie no neon"), ("danca-janela", "Dancinha"),
            ("make-paleta", "Make com amiga"), ("amigas-selfie", "Amigas"), ("espelho-casaco", "Espelho"),
            ("vlog-tripe", "Gravando"), ("selfie-chapeu", "Rua, luz do dia")]
    cells = "".join(f'<div>{foto(n, 116, 150, 14, "50% 30%")}<div class="cap" style="color:#fff">{t}</div></div>' for n, t in grid)
    page("Fotografia: direção", f'<div style="display:grid;grid-template-columns:repeat(8,116px);gap:8px;margin-top:14px">{cells}</div>'
         f'<div class="row" style="margin-top:18px;gap:24px">'
         + "".join(f'<div style="flex:1"><h3 style="color:#fff">{a}</h3><div style="font:500 10.5px/1.6 Figtree;color:#E6E6E6;margin-top:4px">{b}</div></div>' for a, b in (
             ("Quem", "Criadoras de 18 a 22 anos, diferentes estilos, cabelos e tons de pele. Gente real, de quarto, rua e café."),
             ("O que", "O processo de criar: ring light, celular no tripé, dancinha, make, espelho, rir com as amigas."),
             ("Luz", "Luz do dia ou ring light, com um toque de LED rosa ou roxo quando der. Nada escuro, nada de sombra dramática."),
             ("Nunca", "Pose sensual, lingerie, close de pele ou boca, cama como cenário principal. O exclusivo fica no ar, não na foto."))) + '</div>',
         "preto", "A Clozzy é feita por quem cria. A foto mostra a criadora no meio do processo: leve, divertida, bonita, sem apelação.")


def p_foto_marca():
    a = (f'<div style="position:relative">{foto("ringlight-rosa", 220, 390, 18, "45% 30%")}'
         f'<div style="position:absolute;left:12px;top:12px">{lock("mono-branco", 14, None)}</div>'
         f'<div style="position:absolute;left:12px;bottom:60px">{sticker("novo drop", DEEP, WHITE, -4, 13)}</div>'
         f'<div class="d" style="position:absolute;left:12px;bottom:18px;font-size:22px;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.35)">gravei o<br>bastidor todo</div></div>')
    safe = (f'<div style="position:relative">{foto("danca-tripe", 220, 390, 18, "60% 30%")}'
            f'<div style="position:absolute;left:0;right:0;top:0;height:60px;background:rgba(224,0,90,.35)"></div>'
            f'<div style="position:absolute;left:0;right:0;bottom:0;height:80px;background:rgba(224,0,90,.35)"></div>'
            f'<div style="position:absolute;right:0;top:60px;bottom:80px;width:44px;background:rgba(124,72,196,.35)"></div>'
            f'<div style="position:absolute;left:10px;top:20px;font:800 9px Figtree;color:#fff">interface do app</div>'
            f'<div style="position:absolute;right:4px;top:180px;font:800 8px Figtree;color:#fff;writing-mode:vertical-rl">botões</div></div>')
    blur = f'<div style="position:relative">{foto("neon-selfie", 220, 390, 18, "50% 30%", True)}</div>'
    page("Fotografia: com a marca", f'<div class="row" style="margin-top:14px;gap:16px">'
         f'<div>{a}<div class="cap" style="color:#fff">Marca branca no topo, sticker e texto no terço de baixo</div></div>'
         f'<div>{safe}<div class="cap" style="color:#fff">Área segura 9:16: nada importante nas faixas</div></div>'
         f'<div>{blur}<div class="cap" style="color:#fff">Conteúdo do close na vitrine: desfoque + estrela</div></div>'
         f'<div style="max-width:250px;font-size:11.5px;line-height:1.7;color:#E6E6E6">A foto vem primeiro. A marca entra pequena, branca, no canto de cima. '
         f'Texto em Gabarito curto, com sombra leve se a foto for clara. O que é só do close aparece desfocado com a estrela, nunca com tarja.</div></div>',
         "preto", "Como a marca, o texto e os stickers entram na foto.")


def p_voz():
    pairs = [("Seu close, seu preço.", "Assinatura da marca."), ("Me acha no close.", "Chamada da criadora para os seguidores."),
             ("Entrar no close", "Botão de assinar."), ("Pago no Pix. Liberado na hora.", "Confirmação de compra."),
             ("O que não cabe no feed.", "O que é o conteúdo exclusivo, sem dizer demais."), ("Abrir meu close", "Virar criadora.")]
    do = "".join(f'<div style="padding:9px 0;border-bottom:1px solid {L2}"><div class="d" style="font-size:21px">{a}</div>'
                 f'<div class="cap" style="margin-top:2px">{b}</div></div>' for a, b in pairs)
    dd = [("Falar como amiga: curto, leve, com gíria do dia a dia.", "Desbloqueie conteúdos premium exclusivos agora!"),
          ("“Bastidor, rotina, o que vem antes do post.”", "Conteúdo adulto, sensual, +18 em destaque."),
          ("Close, criadora, fã, pack, drop.", "Usuário, cliente, produto digital."),
          ("Um emoji por frase, no máximo.", "CAPS, excesso de emoji, palavrão.")]
    rows = "".join(f'<tr><td><span class="ok" style="background:{DEEP};color:#fff">✓</span>{a}</td><td style="color:{L3}"><span class="ok" style="background:{L2};color:{BLACK}">✕</span>{b}</td></tr>' for a, b in dd)
    page("Voz", f'<div class="row" style="margin-top:12px;gap:36px"><div style="flex:1">{do}</div>'
         f'<div style="flex:1.2"><div class="lbl">Como falar</div><table>{rows}</table>'
         f'<div style="font:500 11px/1.6 Figtree;color:{L3};margin-top:16px">A Clozzy é exclusiva, não explícita. A gente fala de proximidade, bastidor e de quem chegou primeiro, '
         f'e deixa o resto para dentro do close. O aviso de 18+ fica onde a lei pede: cadastro, termos e porta de entrada do app.</div></div></div>',
         "branco", "Jovem, próxima e segura. A Clozzy fala como a amiga que cria conteúdo, não como um site de assinatura.")


def p_legendas():
    T = TEMAS["branco"]
    caps = [("Pra quem pediu o tutorial completo: tá no close 🤍", "#rotina #make #bastidor"),
            ("Gravei o dia inteiro, o resto só no close. Link na bio.", "#vlog #diadecriadora"),
            ("Drop novo hoje 20h. Quem chega primeiro vê primeiro ✨", "#novodrop #closefriends")]
    cc = "".join(f'<div style="padding:12px;border-radius:14px;background:{L1};margin-bottom:8px"><div style="font:600 12px/1.5 Figtree">{a}</div>'
                 f'<div style="font:600 10.5px Figtree;color:{DEEP};margin-top:4px">{b}</div></div>' for a, b in caps)
    micro = [("Botão de assinar", "Entrar no close"), ("Pack", "Pegar o pack"), ("Pagamento ok", "Você está no close."), ("Vazio na biblioteca", "Nada aqui ainda. Bora achar alguém?"),
             ("Erro de pagamento", "O Pix não veio. Tenta de novo?"), ("Convite", "Me acha no close"), ("Push de post", "Lara postou no close"), ("Vencendo", "Seu close da Nina vence em 2 dias")]
    mm = "".join(f'<tr><td style="color:{L3}">{a}</td><td style="font-weight:800">{b}</td></tr>' for a, b in micro)
    page("Legendas e microcopy", f'<div class="row" style="margin-top:14px;gap:30px"><div style="flex:1"><div class="lbl">Legendas de post e vídeo</div>{cc}'
         f'<div class="cap">Até duas linhas, chamada no fim (“link na bio”, “tá no close”), 2 ou 3 hashtags de assunto, nunca de conteúdo adulto.</div></div>'
         f'<div style="flex:1"><div class="lbl">Microcopy do app</div><table>{mm}</table></div></div>', "branco",
         "O mesmo jeito de falar nas legendas da criadora e nos textos do app.")


# ================================================================ capítulo 3 · produto
def s_criadora_on(step):
    T = TEMAS["roxo"]
    if step == 0:
        return (f'<div style="padding:30px 14px 0">{sym(V["roxo"], 56)}<div class="d" style="font-size:24px;color:#fff;margin-top:14px">Abra o<br>seu close.</div>'
                f'<div style="font:500 9px/1.5 Figtree;color:#EBE3FA;margin-top:8px">Assinatura, packs e mensagens. Você define o preço e recebe no Pix.</div>'
                + "".join(f'<div style="display:flex;gap:8px;align-items:center;margin-top:10px;font:700 9px Figtree;color:#fff"><b style="width:20px;height:20px;border-radius:50%;background:#8C5ECB;display:flex;align-items:center;justify-content:center">{i}</b>{t}</div>'
                          for i, t in ((1, "Seus dados"), (2, "Selfie de verificação"), (3, "Chave Pix"))) + '</div>'
                f'<div style="position:absolute;left:10px;right:10px;bottom:12px">{btn(T, "Começar", "botao", 28, 10, 144)}</div>')
    if step == 1:
        return (f'<div class="ft f-selfie-perto" style="position:absolute;inset:0;background-size:cover;background-position:50% 30%"></div>'
                f'<div style="position:absolute;top:70px;left:50%;transform:translateX(-50%);width:110px;height:140px;border-radius:50%;border:2.5px dashed #fff"></div>'
                f'<div style="position:absolute;left:0;right:0;bottom:16px;text-align:center"><div style="font:800 9px Figtree;color:#fff">Rosto no círculo</div>'
                f'<div style="width:44px;height:44px;border-radius:50%;border:3px solid #fff;margin:8px auto 0"></div></div>')
    return (f'<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:14px">'
            f'{sym(V["roxo"], 70)}<div class="d" style="font-size:20px;color:#fff;margin-top:12px">Seu close<br>tá no ar.</div>'
            f'<div style="font:500 9px Figtree;color:#EBE3FA;margin-top:6px">Agora é só chamar a galera.</div></div>'
            f'<div style="position:absolute;left:10px;right:10px;bottom:12px">{btn(T, "Compartilhar link", "botao", 28, 10, 144)}</div>')


def p_onboarding():
    T = TEMAS["roxo"]
    cells = "".join(f'<div style="text-align:center">{phone(s_criadora_on(i), T)}<div class="cap" style="color:#fff">{t}</div></div>'
                    for i, t in ((0, "Abrir o close"), (1, "Selfie de verificação"), (2, "Pronto")))
    cells += f'<div style="text-align:center">{phone(V1.s_painel(TEMAS["preto"]), TEMAS["preto"])}<div class="cap" style="color:#fff">Painel da criadora</div></div>'
    page("App: virar criadora", f'<div class="row" style="margin-top:14px;gap:16px">{cells}</div>', "roxo",
         "O lado da criadora é roxo: abrir o close, verificar e começar a vender. O painel volta para o preto do app.")


def bio_page(T, w=180, h=370):
    links = [("Meu close", "R$ 19,90/mês", True), ("Pack: rotina de make", "R$ 24,90", False), ("TikTok", "@laramendes", False), ("Instagram", "@laramendes", False)]
    ll = "".join(f'<div style="margin:6px 12px 0;padding:9px 10px;border-radius:12px;background:{T["cta"] if p else T["sup2"]};color:{T["cta_txt"] if p else T["titulo"]};'
                 f'display:flex;justify-content:space-between;font:800 8.5px Gabarito"><span>{a}</span><span class="num" style="opacity:.85">{b}</span></div>' for a, b, p in links)
    inner = (f'<div style="text-align:center;padding:14px 12px 0">{ring_av(T, "ringlight-sorriso", 64)}'
             f'<div style="font:900 13px Gabarito;color:{T["titulo"]};margin-top:6px">Lara Mendes</div>'
             f'<div style="font:600 8px Figtree;color:{T["apoio"]}">rotina, make e bastidor · 3,2 mil no close</div></div>{ll}'
             f'<div style="position:absolute;bottom:12px;left:0;right:0;display:flex;justify-content:center">{logo_app(T, 11)}</div>')
    return phone(inner, T, w, h)


def p_link_bio():
    page("Perfil da criadora e link na bio", f'<div class="row" style="margin-top:14px;gap:16px">'
         f'<div style="text-align:center">{phone(V1.s_perfil(TEMAS["preto"]), TEMAS["preto"])}<div class="cap">Perfil no app</div></div>'
         f'<div style="text-align:center">{bio_page(TEMAS["preto"])}<div class="cap">Link na bio · preto</div></div>'
         f'<div style="text-align:center">{bio_page(TEMAS["branco"])}<div class="cap">Link na bio · branco</div></div>'
         f'<div style="max-width:250px;font-size:11.5px;line-height:1.7;color:{L3}">A página que a criadora põe na bio do TikTok e do Instagram: foto com o anel do close, '
         f'uma linha sobre ela, o close em destaque (Pink Deep) e os outros links abaixo. A marca Clozzy assina no rodapé, pequena.</div></div>',
         "branco", "clozzy.com.br/laramendes: a vitrine pública de cada criadora.")


def invite_card(T, w=230, h=300, name="ringlight-sorriso"):
    q = "".join(f'<i style="background:{BLACK if (i * 5 + i // 7) % 3 else "transparent"}"></i>' for i in range(49))
    return (f'<div style="width:{w}px;height:{h}px;border-radius:20px;background:{T["sup"]};padding:14px;position:relative;{"border:1px solid #E6E6E6;" if T["sup"] == WHITE else ("border:1px solid #333;" if T["sup"] == BLACK else "")}">'
            f'{logo_app(T, 13)}<div style="display:flex;gap:10px;align-items:center;margin-top:14px">{ring_av(T, name, 46)}'
            f'<div><div style="font:900 13px Gabarito;color:{T["titulo"]}">Lara Mendes</div><div style="font:600 8.5px Figtree;color:{T["apoio"]}">@laramendes</div></div></div>'
            f'<div class="d" style="font-size:22px;color:{T["titulo"]};margin-top:12px">Me acha<br>no close.</div>'
            f'<div style="position:absolute;left:14px;right:14px;bottom:14px;display:flex;justify-content:space-between;align-items:flex-end">'
            f'<div style="font:700 8.5px/1.4 Figtree;color:{T["apoio"]}">clozzy.com.br/<br><b style="color:{T["titulo"]}">laramendes</b></div>'
            f'<div style="width:62px;height:62px;background:#fff;border-radius:8px;padding:5px;display:grid;grid-template-columns:repeat(7,1fr)">{q}</div></div></div>')


def p_convite():
    page("Compartilhar o perfil", f'<div class="row" style="margin-top:14px;gap:14px">{invite_card(TEMAS["preto"])}{invite_card(TEMAS["rosa"], name="neon-selfie")}'
         f'{invite_card(TEMAS["roxo"], name="selfie-chapeu")}{invite_card(TEMAS["branco"], name="espelho-casaco")}</div>'
         f'<p class="lead" style="color:{G4}">O cartão que o app gera quando a criadora toca em “compartilhar”: foto com o anel, @, “Me acha no close.”, link e QR. '
         f'Sai em 1:1 e 9:16, nas quatro superfícies.</p>', "preto", "O convite que a criadora manda para os seguidores.")


# ================================================================ capítulo 4 · redes sociais
def tt_frame(photo, pos, inner, w=170, h=302):
    ui = (f'<div style="position:absolute;right:8px;bottom:70px;display:flex;flex-direction:column;gap:12px;align-items:center;z-index:3">'
          + "".join(f'<div style="width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,.85)"></div>' for _ in range(3)) + '</div>'
          f'<div style="position:absolute;left:8px;bottom:10px;right:40px;font:700 8px/1.4 Figtree;color:#fff;z-index:3">@laramendes<br><span style="font-weight:500">gravei o bastidor todo · link na bio</span></div>')
    return (f'<div style="position:relative;width:{w}px;height:{h}px;border-radius:14px;overflow:hidden;flex-shrink:0">'
            f'{foto(photo, w, h, 0, pos)}{inner}{ui}</div>')


def p_tiktok_video():
    a = tt_frame("ringlight-neon", "50% 30%", f'<div style="position:absolute;left:10px;top:36px;z-index:2">{sticker("rotina de criadora", WHITE, BLACK, -3, 12)}</div>')
    b = tt_frame("make-ringlight", "55% 30%", f'<div style="position:absolute;left:10px;right:10px;top:120px;z-index:2;text-align:center">'
                 f'<span style="background:#fff;color:#000;font:900 13px/1.5 Gabarito;padding:2px 6px;box-decoration-break:clone;-webkit-box-decoration-break:clone">o resto do tutorial<br>tá no close</span></div>')
    c = (f'<div style="position:relative;width:170px;height:302px;border-radius:14px;overflow:hidden;background:{BLACK};border:1px solid #333">'
         f'<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10px">'
         f'{sym(V["preto"], 76)}<div class="d" style="font-size:20px;color:#fff">Me acha<br>no close.</div>{sticker("link na bio", DEEP, WHITE, -3, 11)}</div></div>')
    d = tt_frame("danca-janela", "50% 30%", f'<div style="position:absolute;left:10px;top:36px;z-index:2">{sticker("novo drop hoje 20h", DEEP, WHITE, 3, 11)}</div>')
    cells = "".join(f'<div>{x}<div class="cap" style="color:#fff">{t}</div></div>' for x, t in (
        (a, "Abertura: sticker com o assunto"), (b, "Meio: legenda em caixa branca"), (d, "Chamada de drop"), (c, "Final (2 s): símbolo + chamada")))
    page("TikTok e Reels: vídeo", f'<div class="row" style="margin-top:14px;gap:14px">{cells}<div style="max-width:200px;font-size:11px;line-height:1.7;color:#E6E6E6">'
         f'Os primeiros 2 s são da criadora, sem marca grande. A marca aparece pequena no canto ou só no cartão final, que pode virar template no CapCut. '
         f'Legenda em caixa branca com texto preto (padrão do app), sticker no máximo um por cena.</div></div>', "preto",
         "Vídeo vertical da criadora com a linguagem da marca, sem parecer anúncio.")


def p_tiktok_perfil():
    T = TEMAS["preto"]
    covers = [("ringlight-sorriso", "rotina"), ("make-paleta", "make"), ("danca-tripe", "dancinha"), ("neon-selfie", "drop"),
              ("espelho-ruiva", "look"), ("amigas-cafe", "amigas"), ("vlog-tripe", "bastidor"), ("selfie-sueter", "q&a"), ("tripe-arara", "setup")]
    grid = "".join(f'<div style="position:relative">{foto(n, 58, 78, 0, "50% 30%")}<span style="position:absolute;left:3px;bottom:3px;font:900 8px Gabarito;color:#fff;'
                   f'background:{DEEP if i % 3 == 0 else BLACK};padding:1px 4px;border-radius:3px">{t}</span></div>' for i, (n, t) in enumerate(covers))
    prof = (f'<div style="padding:10px 12px;text-align:center">{ring_av(T, "ringlight-sorriso", 56)}<div style="font:900 11px Gabarito;color:#fff;margin-top:4px">@laramendes</div>'
            f'<div style="display:flex;justify-content:center;gap:14px;margin-top:6px;font:700 7.5px Figtree;color:#E6E6E6">'
            + "".join(f'<div><b class="num" style="display:block;font:900 10px Gabarito;color:#fff">{a}</b>{b}</div>' for a, b in (("312", "seguindo"), ("184 mil", "seguidores"), ("2,1 mi", "curtidas")))
            + f'</div><div style="font:500 8px/1.4 Figtree;color:#E6E6E6;margin-top:6px">rotina, make e bastidor ✨<br>o resto tá no close ↓</div>'
            f'<div style="margin-top:6px;display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;background:{G2};font:700 8px Figtree;color:#fff">'
            f'{svg(M.macia(DEEP, 40), "5 5 90 90", 10)}clozzy.com.br/laramendes</div></div>'
            f'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px">{grid}</div>')
    capas = "".join(f'<div style="text-align:center">{foto(n, 96, 170, 10, "50% 30%")}<div class="cap" style="color:#fff">{t}</div></div>' for n, t in (("make-sorriso", "Capa com palavra"), ("selfie-perto", "Capa limpa")))
    page("TikTok: perfil e capas", f'<div class="row" style="margin-top:14px;gap:26px">{phone(prof, T, 196, 400)}'
         f'<div><div class="lbl" style="color:#fff">Capas da grade: uma palavra em Gabarito, etiqueta preta ou Pink Deep</div><div style="display:flex;gap:12px">{capas}</div>'
         f'<p class="lead" style="color:{G4};max-width:360px;margin-top:16px">A criadora não precisa usar a marca no perfil dela: o que liga ao close é o link com a estrela na bio '
         f'e a etiqueta nas capas. Uma grade organizada por assunto ajuda o fã a achar o que procura.</p></div></div>', "preto",
         "O perfil da criadora com a Clozzy só na bio e nas capas.")


def p_stories():
    bars = lambda: ('<div style="position:absolute;top:8px;left:8px;right:8px;display:flex;gap:3px;z-index:3">'
                    + "".join(f'<i style="flex:1;height:2.5px;border-radius:2px;background:#fff;opacity:{1 if k < 2 else .35}"></i>' for k in range(4)) + '</div>')
    a = story(f'{foto("selfie-perto", 150, 266, 0, "50% 30%")}{bars()}<div style="position:absolute;left:10px;top:18px;z-index:3">{lock("mono-branco", 11, None)}</div>'
              f'<div style="position:absolute;left:10px;bottom:50px;z-index:3">{sticker("bom dia, close", WHITE, BLACK, -3, 11)}</div>'
              f'<div style="position:absolute;left:10px;right:10px;bottom:14px;z-index:3">{btn(TEMAS["preto"], "Ver no close", "cta", 24, 9, 130)}</div>', BLACK)
    b = story(f'{foto("neon-selfie", 150, 266, 0, "50% 30%", True)}{bars()}<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;z-index:3">'
              f'{sym(V["preto"], 66)}<div class="d" style="font-size:17px;color:#fff;margin-top:10px">Só pro<br>close.</div></div>', BLACK)
    c = story(f'{bars()}<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:12px">'
              f'<div class="d num" style="font-size:31px;color:#fff">03:12:40</div><div style="font:700 9px Figtree;color:#fff">pro drop de hoje</div>'
              f'<div style="margin-top:12px">{sticker("me avisa", WHITE, DEEP, -2, 11)}</div></div>', DEEP)
    d = story(f'{foto("amigas-selfie", 150, 266, 0, "50% 30%")}{bars()}<div style="position:absolute;left:10px;right:10px;bottom:16px;z-index:3;padding:10px;border-radius:12px;background:#fff">'
              f'<div style="font:900 11px Gabarito;color:#000">o que vocês querem no próximo pack?</div>'
              + "".join(f'<div style="margin-top:5px;padding:5px 8px;border-radius:8px;background:{L1};font:700 8.5px Figtree;color:#000">{o}</div>' for o in ("rotina de make", "arrume-se comigo"))
              + '</div>', BLACK)
    e = story(f'{bars()}<div style="position:absolute;left:12px;top:22px">{lock("roxo", 11, None)}</div><div style="position:absolute;left:12px;right:12px;bottom:22px">'
              f'<div class="d" style="font-size:21px;color:#fff">Cria conteúdo?<br>Abre o seu close.</div><div style="margin-top:10px">{btn(TEMAS["roxo"], "Quero vender", "botao", 24, 9, 126)}</div></div>', PURPLE)
    cells = "".join(f'<div>{x}<div class="cap" style="color:#fff">{t}</div></div>' for x, t in zip((a, b, c, d, e),
                    ("Bom dia + chamada", "Teaser do close", "Contagem do drop", "Enquete", "Convite para criadora")))
    page("Stories", f'<div class="row" style="margin-top:14px;gap:14px">{cells}</div>', "preto",
         "Cinco modelos que a criadora usa toda semana. 9:16, área segura em cima e embaixo, um sticker por tela.")


def post(kind, w, h):
    if kind == "frase":
        return (f'<div style="width:{w}px;height:{h}px;border-radius:10px;background:{BLACK};border:1px solid #333;padding:14px;position:relative">{lock("preto", 12, None)}'
                f'<div class="d" style="position:absolute;left:14px;bottom:18px;font-size:{w * .15}px;color:#fff">O que não<br>cabe no <span style="color:{DEEP}">feed.</span></div></div>')
    if kind == "drop":
        return (f'<div style="position:relative">{foto("ringlight-sorriso", w, h, 10, "50% 30%")}<div style="position:absolute;left:12px;top:12px">{lock("mono-branco", 12, None)}</div>'
                f'<div style="position:absolute;left:12px;bottom:14px">{sticker("novo drop", DEEP, WHITE, -4, w * .07)}</div></div>')
    if kind == "rosa":
        return (f'<div style="width:{w}px;height:{h}px;border-radius:10px;background:{DEEP};display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center">'
                f'{sym(V["rosa"], w * .34, None)}<div class="d" style="font-size:{w * .11}px;color:#fff;margin-top:10px">Pago no Pix.<br>Liberado na hora.</div></div>')
    if kind == "roxo":
        return (f'<div style="width:{w}px;height:{h}px;border-radius:10px;background:{PURPLE};padding:14px;position:relative">{lock("roxo", 12, None)}'
                f'<div class="d" style="position:absolute;left:14px;bottom:46px;font-size:{w * .13}px;color:#fff">Cria conteúdo?<br>Abre o seu close.</div>'
                f'<div style="position:absolute;left:14px;bottom:14px">{btn(TEMAS["roxo"], "Link na bio", "botao", 20, 8)}</div></div>')
    if kind == "amigas":
        return (f'<div style="position:relative">{foto("amigas-cafe", w, h, 10, "50% 30%")}<div class="d" style="position:absolute;left:12px;bottom:14px;font-size:{w * .12}px;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.4)">close<br>de amigas</div></div>')
    if kind == "quote":
        return (f'<div style="width:{w}px;height:{h}px;border-radius:10px;background:#fff;border:1px solid #E6E6E6;padding:14px;position:relative">'
                f'<div style="display:flex;gap:8px;align-items:center">{ring_av(TEMAS["branco"], "selfie-chapeu", 32)}<div style="font:800 9px Gabarito">@biarocha</div></div>'
                f'<div class="d" style="font-size:{w * .1}px;color:#000;margin-top:14px">“Paguei minha viagem com o meu close.”</div>'
                f'<div style="position:absolute;left:14px;bottom:14px">{lock("branco", 11, None)}</div></div>')
    return (f'<div style="width:{w}px;height:{h}px;border-radius:10px;background:#fff;border:1px solid #E6E6E6;padding:14px;position:relative">{lock("branco", 12, None)}'
            f'<div class="d num" style="position:absolute;left:14px;bottom:36px;font-size:{w * .2}px;color:{DEEP}">12 mil</div>'
            f'<div style="position:absolute;left:14px;bottom:18px;font:700 {w * .045}px Figtree">criadoras abriram o close</div></div>')


def p_posts():
    items = [("drop", "Drop com foto"), ("frase", "Frase · preto"), ("rosa", "Momento Pink Deep"), ("amigas", "Foto + título"),
             ("roxo", "Convite criadora"), ("quote", "Depoimento"), ("num", "Número · branco")]
    cells = "".join(f'<div>{post(k, 136, 170)}<div class="cap" style="color:#fff">{t}</div></div>' for k, t in items)
    grid = "".join(f'<div style="aspect-ratio:1">{post(k, 92, 92)}</div>' for k in ("drop", "frase", "amigas", "rosa", "quote", "drop", "frase", "roxo", "amigas"))
    page("Posts do feed", f'<div class="grid" style="grid-template-columns:repeat(7,136px);gap:9px;margin-top:14px">{cells}</div>'
         f'<div class="row" style="margin-top:14px;gap:20px"><div><div class="lbl" style="color:#fff">Grade da @clozzy: foto, preto, cor</div>'
         f'<div style="display:grid;grid-template-columns:repeat(3,92px);gap:3px">{grid}</div></div>'
         f'<div style="max-width:360px;font-size:11.5px;line-height:1.7;color:#E6E6E6;margin-top:18px">Ritmo da grade: a cada três posts, uma foto de criadora, um preto com frase e um de cor '
         f'(Pink Deep ou roxo, nunca os dois lado a lado). A marca fica pequena no canto. Depoimentos e números de criadoras dão prova social sem mostrar conteúdo.</div></div>',
         "preto", "Sete tipos de post para a conta da Clozzy.")


def p_kit():
    tpls = [
        (f'<div style="position:relative">{foto("ringlight-rosa", 150, 266, 14, "45% 30%")}<div style="position:absolute;left:10px;bottom:16px">{sticker("me acha no close", WHITE, DEEP, -3, 11)}</div></div>', "Story: me acha no close"),
        (story(f'<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">'
               f'<div style="font:700 9px Figtree;color:#fff">drop em</div><div class="d num" style="font-size:40px;color:#fff">2 dias</div>'
               f'<div style="margin-top:10px">{sticker("me avisa", WHITE, DEEP, -2, 11)}</div></div>', DEEP), "Contagem do drop"),
        (story(f'{foto("make-paleta", 150, 266, 0, "50% 30%")}<div style="position:absolute;left:10px;right:10px;bottom:14px;padding:10px;border-radius:12px;background:#000">'
               f'<div style="font:900 11px Gabarito;color:#fff">Pack: rotina de make</div><div class="num" style="font:800 10px Gabarito;color:{DEEP}">R$ 24,90</div>'
               f'<div style="margin-top:6px">{btn(TEMAS["preto"], "Pegar o pack", "cta", 20, 8, 108)}</div></div>', BLACK), "Lançamento de pack"),
        (story(f'<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:12px">'
               f'<div class="d num" style="font-size:40px;color:#fff">1.000</div><div style="font:700 9px Figtree;color:#fff">pessoas no meu close 🤍</div>'
               f'<div style="margin-top:10px">{sym(V["roxo"], 50)}</div></div>', PURPLE), "Marco de assinantes"),
        (invite_card(TEMAS["preto"], 200, 266, "selfie-sueter"), "Convite com QR"),
    ]
    cells = "".join(f'<div>{x}<div class="cap" style="color:#fff">{t}</div></div>' for x, t in tpls)
    page("Kit da criadora", f'<div class="row" style="margin-top:14px;gap:14px;align-items:flex-start">{cells}</div>'
         f'<p class="lead" style="color:{G4}">Templates que o app entrega prontos (e no CapCut/Canva): a criadora troca a foto e o texto. A marca Clozzy aparece só no sticker, '
         f'na estrela ou no convite. A peça é dela.</p>', "preto", "O que a criadora usa para chamar os seguidores para o close.")


# ================================================================ capítulo 5 · site e marketing
def p_landing():
    T = TEMAS["preto"]
    hero = (f'<div style="background:{BLACK};padding:14px 22px 0;height:250px;position:relative;overflow:hidden">'
            f'<div style="display:flex;justify-content:space-between;align-items:center">{logo_app(T, 16)}'
            f'<div style="display:flex;gap:14px;align-items:center;font:600 9px Figtree;color:#E6E6E6"><span>Explorar</span><span>Para criadoras</span>{btn(T, "Entrar", "botao", 22, 9)}</div></div>'
            f'<div style="display:flex;justify-content:space-between;margin-top:22px"><div>'
            f'<div class="d" style="font-size:44px;color:#fff">O que não cabe<br>no <span style="color:{DEEP}">feed.</span></div>'
            f'<div style="font:500 11px/1.5 Figtree;color:{G4};margin-top:10px;max-width:290px">Bastidor, rotina e o que vem antes do post das criadoras que você segue. Pago no Pix, liberado na hora.</div>'
            f'<div style="display:flex;gap:8px;margin-top:14px">{btn(T, "Explorar criadoras", "cta", 30, 11)}{btn(T, "Sou criadora", "sec", 30, 11)}</div></div>'
            f'<div style="display:flex;gap:8px;margin-right:6px">{foto("ringlight-sorriso", 110, 200, 14, "50% 30%")}{foto("neon-selfie", 110, 200, 14, "50% 30%")}{foto("danca-janela", 110, 200, 14, "50% 30%")}</div></div></div>')
    cards = "".join(f'<div style="flex:1">{foto(n, 120, 120, 12, "50% 30%")}<div style="font:800 10px Gabarito;margin-top:5px">{t}</div><div class="num" style="font:800 9px Gabarito;color:{DEEP}">a partir de {p}</div></div>'
                    for n, t, p in (("selfie-chapeu", "Bia Rocha", "R$ 4,90"), ("make-sorriso", "Nina Alves", "R$ 6,90"), ("espelho-ruiva", "Duda Prado", "R$ 7,90"),
                                    ("selfie-sueter", "Mel Santos", "R$ 5,90"), ("ringlight-rosa", "Lara Mendes", "R$ 9,90"), ("make-mesa", "Theo Vidal", "R$ 4,90")))
    mid = f'<div style="background:#fff;padding:16px 22px"><div class="d" style="font-size:18px">Em alta essa semana</div><div style="display:flex;gap:10px;margin-top:10px">{cards}</div></div>'
    cri = (f'<div style="background:{PURPLE};padding:14px 22px;display:flex;justify-content:space-between;align-items:center">'
           f'<div class="d" style="font-size:20px;color:#fff">Cria conteúdo? Abre o seu close.</div>{btn(TEMAS["roxo"], "Quero vender", "botao", 26, 10)}</div>')
    page("Landing no desktop", f'<div style="margin-top:12px">{browser(hero + mid + cri, 860, 470, "#fff")}</div>', "branco",
         "Hero no preto com três criadoras, vitrine no branco, chamada para criadora no roxo.")


def p_landing_mobile():
    T, W, R = TEMAS["preto"], TEMAS["branco"], TEMAS["roxo"]
    a = (f'<div style="padding:8px 12px;display:flex;justify-content:space-between;align-items:center">{logo_app(T, 13)}{btn(T, "Entrar", "botao", 18, 8)}</div>'
         f'{foto("ringlight-sorriso", 164, 170, 0, "50% 30%")}<div style="padding:10px 12px"><div class="d" style="font-size:22px;color:#fff">O que não cabe<br>no <span style="color:{DEEP}">feed.</span></div>'
         f'<div style="margin-top:10px">{btn(T, "Explorar criadoras", "cta", 26, 10, 140)}</div></div>')
    b = (f'<div style="padding:12px"><div class="d" style="font-size:18px;color:{BLACK}">Em alta</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px">'
         + "".join(f'<div>{foto(n, 68, 86, 10, "50% 30%")}<div style="font:800 8px Gabarito;margin-top:3px;color:{BLACK}">{t}</div><div class="num" style="font:800 8px Gabarito;color:{DEEP}">{v}</div></div>'
                   for n, t, v in (("selfie-chapeu", "Bia Rocha", "R$ 4,90"), ("make-sorriso", "Nina Alves", "R$ 6,90"), ("espelho-ruiva", "Duda Prado", "R$ 7,90"), ("selfie-sueter", "Mel Santos", "R$ 5,90")))
         + '</div></div>')
    c = (f'<div style="padding:30px 14px;text-align:center">{sym(V["roxo"], 80)}<div class="d" style="font-size:22px;color:#fff;margin-top:14px">Cria conteúdo?<br>Abre o seu close.</div>'
         f'<div style="margin-top:14px">{btn(R, "Quero vender", "botao", 26, 10, 140)}</div></div>')
    page("Landing no celular", f'<div class="row" style="margin-top:14px;gap:20px">{phone(a, T, 180, 380)}{phone(b, W, 180, 380)}{phone(c, R, 180, 380)}'
         f'<div style="max-width:250px;font-size:11.5px;line-height:1.7;color:{L3}">A mesma página em três telas: promessa no preto, vitrine no branco, criadora no roxo. '
         f'É a página que abre quando alguém toca no link da bio de uma criadora sem conta na Clozzy.</div></div>', "branco")


def ad(kind, w, h):
    if kind == "fa":
        return (f'<div style="position:relative">{foto("neon-selfie", w, h, 10, "50% 30%")}<div style="position:absolute;left:12px;top:12px">{lock("mono-branco", 12, None)}</div>'
                f'<div style="position:absolute;left:12px;right:12px;bottom:12px"><div class="d" style="font-size:{min(w, h) * .11}px;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.4)">O bastidor de quem<br>você já segue.</div>'
                f'<div style="margin-top:8px">{btn(TEMAS["preto"], "Entrar no close", "cta", 24, 9)}</div></div></div>')
    if kind == "cri":
        return (f'<div style="position:relative">{foto("tripe-arara", w, h, 10, "60% 30%")}<div style="position:absolute;inset:auto 0 0 0;height:46%;background:{PURPLE};border-radius:0 0 10px 10px;padding:12px">'
                f'<div class="d" style="font-size:{w * .085}px;color:#fff">Seu conteúdo. Seu preço.</div><div style="margin-top:8px">{btn(TEMAS["roxo"], "Abrir meu close", "botao", 22, 9)}</div></div></div>')
    return (f'<div style="width:{w}px;height:{h}px;border-radius:10px;background:{DEEP};display:flex;align-items:center;gap:14px;padding:14px">'
            f'{sym(V["rosa"], h * .6, None)}<div><div class="d" style="font-size:{h * .19}px;color:#fff">Pago no Pix.<br>Liberado na hora.</div>'
            f'<div style="margin-top:6px">{btn(TEMAS["rosa"], "Baixar o app", "botao", 20, 8)}</div></div></div>')


def p_anuncios():
    page("Anúncios", f'<div class="row" style="margin-top:14px;gap:14px;align-items:flex-end">'
         f'<div>{ad("fa", 190, 338)}<div class="cap">Story 9:16 · fã</div></div><div>{ad("fa", 210, 262)}<div class="cap">Feed 4:5 · fã</div></div>'
         f'<div>{ad("cri", 210, 262)}<div class="cap">Feed 4:5 · criadora</div></div>'
         f'<div style="display:flex;flex-direction:column;gap:10px"><div>{ad("rosa", 300, 100)}<div class="cap">Banner 3:1 · remarketing</div></div>'
         f'<div>{ad("rosa", 300, 76)}<div class="cap">Banner 4:1 · display</div></div></div></div>', "branco",
         "Fã: criadora + botão Pink Deep. Criadora: foto do setup + faixa roxa. Remarketing: Pink Deep com o ícone. Sem promessa de conteúdo adulto.")


def p_email():
    W = TEMAS["branco"]
    mail = (f'<div style="width:300px;border-radius:12px;overflow:hidden;border:1px solid #E6E6E6;background:#fff">'
            f'<div style="background:{BLACK};padding:12px 16px">{lock("preto", 13, None)}</div>{foto("ringlight-sorriso", 300, 110, 0, "50% 25%")}'
            f'<div style="padding:16px"><div class="d" style="font-size:22px">Lara postou<br>no <span style="color:{DEEP}">close.</span></div>'
            f'<div style="font:500 10px/1.55 Figtree;color:{L3};margin-top:6px">6 fotos e 1 vídeo novos: a rotina de make completa.</div>'
            f'<div style="margin-top:12px">{btn(W, "Ver agora", "cta", 30, 11)}</div></div>'
            f'<div style="padding:10px 16px;border-top:1px solid #E6E6E6;font:500 8px Figtree;color:{L3}">Clozzy · Termos · Privacidade · Ajuda · descadastrar</div></div>')
    bv = (f'<div style="width:300px;border-radius:12px;overflow:hidden;border:1px solid #E6E6E6;background:#fff">'
          f'<div style="background:{PURPLE};padding:16px">{lock("roxo", 13, None)}<div class="d" style="font-size:22px;color:#fff;margin-top:14px">Bem-vinda,<br>criadora.</div></div>'
          f'<div style="padding:16px;font:500 10px/1.6 Figtree;color:{BLACK}">' + "".join(f'<div style="display:flex;gap:8px;margin-bottom:6px"><b style="color:{PURPLE}">{i}</b>{t}</div>' for i, t in (
              (1, "Coloque seu link na bio"), (2, "Poste o story “me acha no close”"), (3, "Lance seu primeiro pack"))) + '</div></div>')
    page("E-mail", f'<div class="row" style="margin-top:14px;gap:26px">{mail}{bv}<div style="max-width:250px;font-size:11.5px;line-height:1.7;color:{L3}">'
         f'Fã: faixa preta com a marca, foto da criadora, título com Pink Deep, um botão. Criadora: faixa roxa e passo a passo. Assunto curto: “Lara postou no close”.</div></div>',
         "branco", "Um assunto por e-mail. Transacional e de novidade no branco.")


# ================================================================ capítulo 6 · mundo físico
def p_impressos():
    V1.p_impressos()
    V1.PAGES[-1] = (V1.PAGES[-1].replace("No impresso, Pink Deep rende melhor que o rosa. Tecido escuro: estrela branca ou rosa. Tecido rosa: tudo branco.",
                                         "Um rosa só também no impresso: Pink Deep. Tecido escuro: estrela branca ou Pink Deep. Tecido Pink Deep: tudo branco.")
                    .replace("Camiseta rosa, estrela branca", "Camiseta Pink Deep, estrela branca"))


def p_evento():
    T = TEMAS["preto"]
    backdrop = "".join(f'<div style="display:flex;align-items:center;justify-content:center">{lock(V["preto"], 16, None) if (i % 2 == 0) else svg(M.macia(DEEP, 40), "5 5 90 90", 22)}</div>' for i in range(24))
    wall = (f'<div style="width:420px;height:250px;border-radius:12px;background:{BLACK};display:grid;grid-template-columns:repeat(6,1fr);grid-template-rows:repeat(4,1fr);padding:10px">{backdrop}</div>')
    ring = (f'<div style="width:200px;height:250px;border-radius:12px;background:{DEEP};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px">'
            f'<div style="width:150px;height:150px;border-radius:50%;border:10px solid #fff;display:flex;align-items:center;justify-content:center">{svg(M.macia(WHITE, 40), "5 5 90 90", 60)}</div>'
            f'<div class="d" style="font-size:16px;color:#fff">grava aqui</div></div>')
    badge = (f'<div style="width:130px;height:190px;border-radius:12px;background:#fff;border:1px solid #E6E6E6;overflow:hidden">'
             f'<div style="height:60px;background:{PURPLE};display:flex;align-items:center;justify-content:center">{lock("roxo", 13, None)}</div>'
             f'<div style="padding:10px;text-align:center;color:#000"><div style="margin:0 auto;width:54px">{ring_av(TEMAS["branco"], "selfie-chapeu", 54)}</div>'
             f'<div style="font:900 12px Gabarito;margin-top:6px">Bia Rocha</div><div style="font:700 8px Figtree;color:{PURPLE}">CRIADORA</div></div></div>')
    page("Evento e pop-up", f'<div class="row" style="margin-top:14px;gap:14px"><div>{wall}<div class="cap" style="color:#fff">Backdrop para foto</div></div>'
         f'<div>{ring}<div class="cap" style="color:#fff">Cantinho de gravação (ring light gigante)</div></div><div>{badge}<div class="cap" style="color:#fff">Crachá de criadora</div></div></div>'
         f'<p class="lead" style="color:{G4}">Encontro de criadoras: backdrop preto com marca e estrela alternadas, ring light Pink Deep para vídeo e crachá roxo para quem cria.</p>',
         "preto", "Quando a Clozzy encontra as criadoras ao vivo.")


def p_erros():
    V1.p_erros()
    # um erro a mais, específico do tom: foto sensual na vitrine
    extra = (f'<div style="position:absolute;left:16mm;bottom:22mm;display:flex;gap:16px;align-items:center">'
             f'<div class="bad" style="border-radius:14px"><div style="width:104px;height:104px;border-radius:14px;background:{L1};display:flex;align-items:center;justify-content:center;'
             f'font:800 10px/1.3 Figtree;color:{L3};text-align:center">foto<br>apelativa</div></div>'
             f'<div style="max-width:420px;font:500 11px/1.6 Figtree;color:{L3}"><b style="color:{BLACK}">Foto sensual na vitrine.</b> Pose, lingerie ou close de pele '
             f'não aparecem em nenhuma peça pública. O desfoque é para o que é do close, não para esconder foto apelativa.</div></div>')
    V1.PAGES[-1] = V1.PAGES[-1].replace('<div class="foot"', extra + '<div class="foot"', 1)


def p_checklist():
    chk = ["Fundo preto #000 ou branco #fff de verdade (sem creme, sem quase-preto)", "Um rosa só: Pink Deep #E0005A", "Nada preto sobre Pink Deep; Pink Deep e roxo nunca um sobre o outro",
           "Ícone OU símbolo, nunca os dois", "Respiro de ¼ do símbolo e tamanho mínimo", "Palavra separada do símbolo", "Foto de criadora no processo, nada sensual",
           "Texto curto, voz de amiga; exclusivo, não explícito", "Até um sticker por tela", "Conteúdo do close desfocado com a estrela"]
    li = "".join(f'<div style="display:flex;gap:10px;padding:7px 0;border-bottom:1px solid #2A2A2A;font-size:11px"><span class="ok" style="background:{DEEP};color:#fff">✓</span>{t}</div>' for t in chk)
    files = [("tokens.css · tokens.json", "Cores por superfície"), ("../identidade-estrela-macia/svg/", "Ícones, símbolos, logos, app icons, loaders"),
             ("../fotos-criadoras/", "Fotos de banco (Pexels) · só uso interno"), ("../../docs/prototipo-mobile/", "Protótipo do app"), ("_build.py", "Gerador deste manual")]
    fl = "".join(f'<div style="display:flex;gap:12px;font-size:10.5px;padding:6px 0;border-bottom:1px solid #2A2A2A"><code style="width:220px;color:{DEEP}">{a}</code><span style="color:#E6E6E6">{b}</span></div>' for a, b in files)
    page("Checklist e arquivos", f'<div class="row" style="margin-top:14px;gap:34px"><div style="flex:1">{li}</div><div style="flex:1">{fl}'
         f'<div style="margin-top:30px">{lock("preto", 48)}</div></div></div>', "preto", "Antes de publicar qualquer peça.")


# ================================================================ montagem
PLAN = [  # (capítulo, título no sumário, função)
    (1, "A marca", V1.p_marca), (1, "Proteção e tamanhos", V1.p_protecao), (1, "Cores", p_cores), (1, "Quatro superfícies", V1.p_superficies),
    (1, "Combinações", p_combinacoes), (1, "Tipografia", V1.p_tipo), (1, "Elementos gráficos", V1.p_elementos), (1, "Stickers e ícones", p_stickers),
    (2, "Fotografia: direção", p_foto), (2, "Fotografia: com a marca", p_foto_marca), (2, "Voz", p_voz), (2, "Legendas e microcopy", p_legendas),
    (3, "App: telas", V1.p_app), (3, "App: seis temas", V1.p_app_temas), (3, "App: virar criadora", p_onboarding), (3, "Perfil e link na bio", p_link_bio),
    (3, "Compartilhar o perfil", p_convite), (3, "Ícone e notificações", V1.p_homescreen),
    (4, "TikTok e Reels: vídeo", p_tiktok_video), (4, "TikTok: perfil e capas", p_tiktok_perfil), (4, "Stories", p_stories), (4, "Posts do feed", p_posts),
    (4, "Carrossel", V1.p_carrossel), (4, "Instagram: perfil e destaques", V1.p_perfil), (4, "Kit da criadora", p_kit),
    (5, "Landing no desktop", p_landing), (5, "Landing no celular", p_landing_mobile), (5, "Anúncios", p_anuncios), (5, "E-mail", p_email),
    (6, "Impressos e brindes", p_impressos), (6, "Evento e pop-up", p_evento),
    (7, "Não fazer", p_erros), (7, "Checklist e arquivos", p_checklist),
]


def build():
    # numeração: capa 1, estrutura 2, depois abertura de capítulo + páginas
    n, cur = 3, 0
    for ch, title, _fn in PLAN:
        if ch != cur:
            n += 1
            cur = ch
        TOC.setdefault(ch, []).append(f'<span class="num" style="opacity:.6">{n:02d}</span>&nbsp;&nbsp;{title}')
        n += 1
    p_capa()
    p_estrutura()
    cur = 0
    for ch, _t, fn in PLAN:
        if ch != cur:
            divider(ch)
            cur = ch
        fn()
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy · manual de uso da marca v2</title>'
            f'<style>{V1.CSS}{PHOTO_CSS}</style></head><body>{"".join(V1.PAGES)}</body></html>')
    assert OLD_PINK.lower() not in html.lower(), "sobrou o rosa #FF0065"
    OUT_HTML.write_text(html)
    V1.HERE = HERE
    V1.tokens()
    subprocess.run([V1.CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer", "--virtual-time-budget=6000",
                    f"--print-to-pdf={OUT_PDF}", OUT_HTML.as_uri()], check=True, capture_output=True)
    print("pages", len(V1.PAGES))


if __name__ == "__main__":
    build()

#!/usr/bin/env python3
"""Clozzy — manual de uso da marca “Estrela macia” · edição criadoras.

Mesma marca, cores e tokens do manual v1 (../uso-da-marca-estrela-macia). O que muda aqui:
  · estrutura em 9 partes, com faixa de navegação em toda página e sumário com número de página;
  · muito mais aplicações (vídeo vertical, lives, link na bio, onboarding de criadora, kit de parceria, OOH, eventos…);
  · fotos: criadoras de conteúdo de 18 a 22 anos, claras e do dia a dia (nada sensual). Geradas por IA, em fotos/.
As páginas que não mudaram vêm do build v1 (importado como OB); as demais são deste arquivo.
Rodar: python3 _build.py → manual-uso-estrela-macia-criadoras.html + .pdf   (CHECK=1 lista elementos estourando a página)"""
import base64, importlib.util, os, re, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
MARCA = HERE.parent
V1 = MARCA / "uso-da-marca-estrela-macia"

_spec = importlib.util.spec_from_file_location("ob", V1 / "_build.py")
OB = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(OB)

M, IB = OB.M, OB.IB
PINK, DEEP, PURPLE, BLACK, WHITE = OB.PINK, OB.DEEP, OB.PURPLE, OB.BLACK, OB.WHITE
G1, G2, G3, G4, L1, L2, L3 = OB.G1, OB.G2, OB.G3, OB.G4, OB.L1, OB.L2, OB.L3
V, f = OB.V, OB.f
sym, lock, tile, svg, box = OB.sym, OB.lock, OB.tile, OB.svg, IB.box
TEMAS, btn, chip, selo, logo_app = OB.TEMAS, OB.btn, OB.chip, OB.selo, OB.logo_app
phone, tabbar = OB.phone, OB.tabbar
FOTOS = HERE / "fotos"
OUT_HTML = HERE / "manual-uso-estrela-macia-criadoras.html"
OUT_PDF = HERE / "manual-uso-estrela-macia-criadoras.pdf"

PARTS = [("01", "A marca"), ("02", "Cor e tipografia"), ("03", "Imagem e voz"), ("04", "App"), ("05", "Web"),
         ("06", "Redes sociais"), ("07", "Mídia e parcerias"), ("08", "Físico e eventos"), ("09", "Regras")]
PAGES = []          # dicts: part, title, rtitle, body, t, lead
NO_ZOOM = {"Sumário"}
CUR = {"part": "01"}

# fotos novas; nomes antigos do v1 apontam para elas (as telas reaproveitadas continuam funcionando)
ALIAS = {"costas": "selfie", "labios": "espelho", "cetim": "cama", "homem": "dupla"}
ROSTO = {"selfie": "50% 18%", "espelho": "50% 14%", "cama": "50% 22%", "dupla": "50% 25%", "cafe": "40% 25%",
         "setup": "40% 28%", "solpor": "50% 38%"}


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(Path(p).read_bytes()).decode()


def foto(name, w, h, r=14, pos=None, locked=False, extra=""):
    name = ALIAS.get(name, name)
    pos = ROSTO.get(name, "50% 30%") if pos in (None, "50% 30%", "50% 35%", "50% 40%", "50% 50%") else pos
    lk = (f'<div class="lk"><span>{svg(M.macia(WHITE, 40), "5 5 90 90", 22)}</span></div>' if locked else "")
    return (f'<div class="ft f-{name}{" blur" if locked else ""}" style="width:{w}px;height:{h}px;border-radius:{r}px;'
            f'background-position:{pos};{extra}">{lk}</div>')


OB.foto = foto


def tk(text, bg=BLACK, fg=WHITE, fs=13, extra=""):
    """Legenda estilo TikTok: texto sobre bloco sólido (nunca solto sobre a foto)."""
    return f'<span class="tk" style="background:{bg};color:{fg};font-size:{fs}px;{extra}">{text}</span>'


def tkl(lines, fs=13, gap=3):
    """Várias linhas, cada uma no seu bloco. lines = [(texto, bg, fg)]"""
    return (f'<div style="display:flex;flex-direction:column;align-items:flex-start;gap:{gap}px">'
            + "".join(tk(t, bg, fg, fs) for t, bg, fg in lines) + '</div>')


def pill(inner, bg=BLACK, pad="4px 8px"):
    return f'<span style="display:inline-flex;align-items:center;background:{bg};border-radius:999px;padding:{pad}">{inner}</span>'


def stamp(h=12, bg=BLACK, kind="mono-branco"):
    """Marca sobre foto: sempre dentro de uma pílula sólida."""
    return pill(lock(kind, h, None), bg)


# ------------------------------------------------------------------------------------------------ página
def footer(n, t):
    dark = TEMAS[t]["sup"] != WHITE
    return (f'<div class="foot" style="color:{WHITE if dark else BLACK}"><span>Clozzy · manual de uso da marca · Estrela macia · edição criadoras · nov 2026</span>'
            f'<span>{n:02d}</span></div>')


def navstrip(part, t):
    dark = TEMAS[t]["sup"] != WHITE
    cor = WHITE if dark else BLACK
    cb, ct = (PINK, WHITE) if dark else (DEEP, WHITE)
    nome = dict(PARTS)[part]
    segs = "".join(f'<i style="width:22px;height:4px;border-radius:2px;background:{cb if k == part else (G3 if dark else L2)}"></i>' for k, _ in PARTS)
    return (f'<div class="nav" style="color:{cor}"><span style="display:flex;align-items:center;gap:7px">'
            f'<b style="background:{cb};color:{ct};font:800 9.5px Gabarito;padding:2px 7px;border-radius:999px">{part}</b>'
            f'<span style="font:700 10px Figtree;opacity:.75">{nome}</span></span><span style="display:flex;gap:3px">{segs}</span></div>')


ZOOMS = {}          # nº da página → zoom automático do corpo (medido numa primeira passada; só cresce, até 1,35)


def render(spec, n):
    part, title, body, t, lead = spec["part"], spec["rtitle"], spec["body"], spec["t"], spec["lead"]
    T = TEMAS[t]
    ld = f'<p class="lead" style="color:{T["apoio"] if t != "branco" else L3}">{lead}</p>' if lead else ""
    h = f'<h2 style="color:{T["titulo"]}">{title}</h2>' if title else ""
    nav = navstrip(part, t) if title else ""
    if title:
        z = ZOOMS.get(n, 1)
        body = f'<div class="bz" style="{f"zoom:{z};" if z > 1 else ""}">{body}</div>'
    return (f'<section class="pg" style="background:{T["sup"]};color:{T["texto"]}">{nav}{h}{ld}{body}{footer(n, t)}</section>')


def spec(part, title, body, t, lead):
    return dict(part=part, title=title or "Capa", rtitle=title, body=body, t=t, lead=lead)


def page(title, body, t="branco", lead=None, part=None):
    part = part or CUR["part"]
    PAGES.append(spec(part, title, body, t, lead))
    return len(PAGES)


OB.page = lambda title, body, t="branco", lead=None: page(title, body, t, lead)


def parte(codigo, *fns):
    CUR["part"] = codigo
    for fn in fns:
        fn()


# ------------------------------------------------------------------------------------------------ CSS
_CSS_V1 = re.sub(r"\.f-\w+\{background-image:url\(data:image/jpeg;base64,[A-Za-z0-9+/=]+\)\}", "", OB.CSS)
_fotos_css = "".join(
    f'.f-{p.stem}' + "".join(f',.f-{a}' for a, b in ALIAS.items() if b == p.stem)
    + f'{{background-image:url({b64(p, "image/jpeg")})}}' for p in sorted(FOTOS.glob("*.jpg")))
CSS = _CSS_V1 + _fotos_css + f"""
.nav{{position:absolute;top:6.5mm;left:16mm;right:16mm;display:flex;justify-content:space-between;align-items:center}}
.tk{{display:inline-block;font-family:Gabarito;font-weight:800;line-height:1.12;letter-spacing:-.02em;padding:.16em .5em;border-radius:.32em;white-space:nowrap}}
.chv{{display:inline-block;font:700 10px Figtree;padding:3px 9px;border-radius:999px;margin:0 4px 5px 0}}
h2{{margin-top:2px}}
"""


# ------------------------------------------------------------------------------------------------ capa e sumário
def p_capa():
    versao = pill('<b style="font:800 10px Gabarito;color:#fff">edição criadoras · nov 2026</b>', PINK, "3px 10px")
    body = (f'<div style="display:flex;justify-content:space-between;height:100%">'
            f'<div style="display:flex;flex-direction:column;justify-content:space-between;padding-bottom:14mm">'
            f'<div><div style="margin-bottom:14px">{versao}</div>'
            f'<h1 style="color:#fff">Manual de<br>uso da marca</h1>'
            f'<p class="lead" style="color:{G4};max-width:430px;margin-top:16px">Estrela macia em tudo que a Clozzy faz: app, web, redes, '
            f'vídeo, parcerias com criadoras, eventos e o que a gente imprime. Nove partes, mais de quarenta aplicações.</p></div>'
            f'{lock("preto", 56)}</div>'
            f'<div style="display:flex;align-items:center;gap:14px">'
            f'<div style="position:relative">{foto("selfie", 235, 430, 22)}'
            f'<div style="position:absolute;left:12px;top:12px">{stamp(13)}</div>'
            f'<div style="position:absolute;left:12px;bottom:16px">{tkl([("Seu close,", BLACK, WHITE), ("seu preço.", PINK, WHITE)], 22, 4)}</div></div>'
            f'<div style="display:flex;flex-direction:column;gap:14px">'
            f'<div class="box" style="width:200px;height:200px;background:{PINK}">{sym("rosa", 150, None)}</div>'
            f'<div class="box" style="width:200px;height:216px;background:{PURPLE}">{sym("roxo", 150)}</div></div></div></div>')
    page(None, body, "preto", part="01")


def p_sumario_build():
    cards = ""
    for cod, nome in PARTS:
        itens = [(i + 1, p["title"]) for i, p in enumerate(PAGES) if p and p["part"] == cod and p["title"] != "Capa" and i > 1]
        li = "".join(f'<div style="display:flex;justify-content:space-between;gap:8px;padding:3px 0;border-bottom:1px solid {L2};font:600 10.5px Figtree">'
                     f'<span>{t}</span><span class="num" style="color:{DEEP}">{n:02d}</span></div>' for n, t in itens)
        cards += (f'<div><div style="display:flex;align-items:baseline;gap:8px"><span class="d" style="font-size:34px;color:{DEEP}">{cod}</span>'
                  f'<h3 style="font-size:17px">{nome}</h3></div><div style="margin-top:6px">{li}</div></div>')
    body = f'<div class="grid" style="grid-template-columns:repeat(3,1fr);gap:22px 34px;margin-top:18px">{cards}</div>'
    PAGES[1] = spec("01", "Sumário", body, "branco", None)


# ------------------------------------------------------------------------------------------------ 03 · imagem e voz
FOTO_USOS = [("selfie", "Selfie", "Capa de app e anúncio vertical"), ("espelho", "Espelho", "Post de feed, “look do dia”"),
             ("cama", "Reação", "Stories e teaser desfocado"), ("dupla", "Dupla", "Reels, trend, convite"),
             ("cafe", "Rolê", "Carrossel e e-mail"), ("setup", "Setup", "Convite para criadora (roxo)"),
             ("solpor", "Pôr do sol", "Momento rosa, campanha")]


def p_foto_direcao():
    cards = "".join(f'<div>{foto(n, 133, 250, 14)}<div class="cap" style="color:#E6E6E6"><b style="color:#fff">{t}</b>{u}</div></div>'
                    for n, t, u in FOTO_USOS)
    cols = [("Quem aparece", "Criadoras e influenciadoras de 18 a 22 anos, todas maiores de idade e verificadas. Gente de verdade: tipos de cabelo, pele e estilo variados, sorrindo, rindo, em movimento. Rosto sempre visível."),
            ("Onde e com quê", "O quarto delas com LED rosa e lilás, anel de luz, tripé, espelho, café, rooftop no fim de tarde. Celular na mão sempre que der: é o que conta que ali tem criadora."),
            ("Luz e cor", "Clara, de dia ou de anel. Rosa e lilás aparecem no cenário (LED, roupa, drink), não como filtro por cima. Foto com cara de conteúdo feito no celular, não de ensaio."),
            ("Fica de fora", "Pose de ensaio, recorte de corpo sem rosto, lingerie, nudez ou sugestão, luz baixa dramática, banco de imagem. Se a foto precisa de legenda maliciosa para funcionar, não serve.")]
    txt = "".join(f'<div><h3 style="color:#fff;font-size:13px">{a}</h3><p style="font:500 11.5px/1.55 Figtree;color:#E6E6E6;margin-top:5px">{b}</p></div>' for a, b in cols)
    page("Direção de foto", f'<div class="row" style="margin-top:14px;gap:10px">{cards}</div>'
         f'<div class="grid" style="grid-template-columns:repeat(4,1fr);gap:24px;margin-top:26px">{txt}</div>', "preto",
         "Criadoras de conteúdo de 18 a 22 anos, no ambiente delas. Claro, colorido, divertido, com cara de vídeo de TikTok.", part="03")


def p_foto_marca():
    W, H = 188, 360
    a = (f'<div style="position:relative">{foto("selfie", W, H, 16)}<div style="position:absolute;left:10px;top:10px">{stamp(11)}</div>'
         f'<div style="position:absolute;left:10px;bottom:14px">{tkl([("Seu close,", BLACK, WHITE), ("seu preço.", PINK, WHITE)], 20, 4)}</div></div>')
    b = (f'<div style="position:relative">{foto("espelho", W, H, 16)}<div style="position:absolute;right:10px;top:10px">{selo(TEMAS["preto"], "CLOSE")}</div>'
         f'<div style="position:absolute;left:10px;bottom:48px">{tkl([("look do dia", WHITE, BLACK), ("no close da Mel", BLACK, WHITE)], 15, 4)}</div>'
         f'<div style="position:absolute;left:10px;bottom:12px">{btn(TEMAS["preto"], "Entrar no close", "cta", 24, 9)}</div></div>')
    c = (f'<div style="position:relative">{foto("dupla", W, H, 16)}<div style="position:absolute;left:10px;top:10px">{stamp(11)}</div>'
         f'<div style="position:absolute;left:10px;bottom:48px">{tk("a trend da semana", WHITE, BLACK, 16)}</div>'
         f'<div style="position:absolute;left:10px;bottom:12px">{btn(TEMAS["preto"], "Ver o vídeo", "botao", 24, 9)}</div></div>')
    d = (f'<div style="position:relative">{foto("cama", W, H, 16, None, True)}<div style="position:absolute;left:0;right:0;bottom:16px;text-align:center;z-index:3">'
         f'{tk("Só pro close.", PINK, WHITE, 18)}</div></div>')
    e = (f'<div style="width:{W}px;height:{H}px;border-radius:16px;overflow:hidden;background:{PURPLE}">{foto("setup", W, 226, 0)}'
         f'<div style="padding:12px 12px"><div class="d" style="font-size:20px;color:#fff">Abra o<br>seu close.</div>'
         f'<div style="margin-top:10px">{btn(TEMAS["roxo"], "Quero vender", "botao", 24, 9)}</div></div></div>')
    cells = "".join(f'<div>{x}<div class="cap" style="color:#E6E6E6">{t}</div></div>' for x, t in
                    ((a, "Selo + legenda em bloco"), (b, "Selo do close + botão"), (c, "Legenda branca, botão branco"), (d, "Pago: desfoque + estrela"), (e, "Foto em cima, bloco roxo embaixo")))
    regras = ["Texto sobre foto sempre em bloco sólido: preto, branco, rosa ou roxo. Nunca solto sobre a imagem.",
              "A marca vai em pílula preta ou branca, no canto de cima. Não vale marca solta sobre rosto, cabelo ou cenário cheio.",
              "Preto no bloco de texto vale; rosa só com texto branco; roxo só com branco.",
              "Sem degradê, sem filtro colorido e sem escurecer a foto para o texto aparecer."]
    rg = "".join(f'<div style="display:flex;gap:8px;font:500 10.5px/1.45 Figtree;color:#E6E6E6"><span class="ok" style="background:{PINK};color:#fff;flex-shrink:0">✓</span>{r}</div>' for r in regras)
    page("Foto com a marca", f'<div class="row" style="margin-top:12px;gap:14px">{cells}</div>'
         f'<div class="grid" style="grid-template-columns:repeat(2,1fr);gap:8px 30px;margin-top:14px">{rg}</div>', "preto",
         "Foto clara, texto em bloco sólido (como legenda de TikTok) e a marca em pílula. Dá leitura em qualquer foto, sem escurecer.", part="03")


def p_foto_tratamento():
    S = 180
    base = lambda **k: foto("cafe", S, 240, 14, "40% 25%", **k)
    ok = [(base(), "Original, luz clara"), (foto("solpor", S, 240, 14), "Cor vem do cenário"), (foto("setup", S, 240, 14, "40% 28%"), "Rosto e celular à vista")]
    bad = [(f'<div style="position:relative">{base()}<div style="position:absolute;inset:0;border-radius:14px;background:rgba(255,0,101,.45)"></div></div>', "Filtro de cor por cima"),
           (f'<div style="position:relative">{base()}<div style="position:absolute;inset:0;border-radius:14px;background:linear-gradient(to top,#000 5%,transparent 70%)"></div></div>', "Degradê para escurecer"),
           (f'<div style="position:relative">{foto("espelho", S, 240, 14, "50% 62%")}</div>', "Recorte de corpo, sem rosto"),
           (f'<div style="position:relative">{base()}<div class="d" style="position:absolute;left:10px;bottom:14px;font-size:20px;color:#fff">Seu close,<br>seu preço.</div></div>', "Texto solto na foto"),
           (f'<div style="position:relative">{foto("cama", S, 240, 14, None, False)}<div style="position:absolute;left:0;right:0;top:96px;height:40px;background:#000"></div></div>', "Tarja preta no pago")]
    o = "".join(f'<div>{x}<div class="cap" style="color:#E6E6E6"><b style="color:#fff">✓ {t}</b></div></div>' for x, t in ok)
    b = "".join(f'<div><div class="bad">{x}</div><div class="cap" style="color:#E6E6E6"><b style="color:#fff">✕ {t}</b></div></div>' for x, t in bad)
    page("Tratamento da foto", f'<div class="lbl" style="color:#fff;margin-top:14px">Pode</div><div class="row" style="gap:12px">{o}'
         f'<div style="max-width:300px;font:500 11px/1.6 Figtree;color:#E6E6E6;margin-left:12px">Recorte 4:5 ou 9:16 com o rosto no terço de cima. Ajuste só brilho e contraste, no máximo. '
         f'Conteúdo pago aparece desfocado, com a estrela no meio, nunca tarjado.</div></div>'
         f'<div class="lbl" style="color:#fff;margin-top:18px">Não pode</div><div class="row" style="gap:12px">{b}</div>', "preto",
         "A foto já é bonita e colorida. O tratamento só enquadra, não maquia.", part="03")


def p_voz_tom():
    eixos = [("Jovem", "sem ser infantil", "tá dentro! pago no Pix, liberado na hora", "Prezado cliente, seu pagamento foi processado"),
             ("Direta", "sem ser seca", "bora abrir o seu close?", "Clique aqui para iniciar o procedimento"),
             ("Divertida", "sem forçar gíria", "caiu pack novo da Lara", "mano, tá ON FIRE 🔥🔥🔥 vem pro close"),
             ("Segura", "sem prometer o que não dá", "você define o preço, recebe no Pix", "ganhe milhões postando fotos")]
    rows = "".join(f'<div style="padding:15px 0;border-bottom:1px solid {L2}"><div style="display:flex;align-items:baseline;gap:10px"><span class="d" style="font-size:32px">{a}</span>'
                   f'<span style="font:600 12px Figtree;color:{L3}">{b}</span></div>'
                   f'<div style="display:flex;gap:10px;margin-top:8px;font:500 12.5px Figtree"><span style="flex:1"><span class="ok" style="background:{DEEP};color:#fff">✓</span>{c}</span>'
                   f'<span style="flex:1;color:{L3}"><span class="ok" style="background:{L2};color:{BLACK}">✕</span>{d}</span></div></div>' for a, b, c, d in eixos)
    cm = lambda foto_n, user, txt: (f'<div style="display:flex;gap:8px;align-items:flex-start;padding:12px 0">{foto(foto_n, 36, 36, 18, "50% 18%", extra="background-size:230%")}'
                                    f'<div><b style="font:800 11.5px Gabarito">{user}</b><div style="font:500 12.5px/1.4 Figtree;margin-top:2px">{txt}</div></div></div>')
    caps = (f'<div class="lbl">Legendas e comentários no tom certo</div>'
            f'<div style="padding:4px 14px;border-radius:14px;background:{L1}">'
            + cm("selfie", "@laramendes", "pov: você achou o close da sua criadora favorita 💗")
            + cm("espelho", "@melzinha", "novidade no meu close hoje, link na bio")
            + cm("cama", "@duda.prado", "gente, o pix caiu na hora. amei ✨")
            + cm("dupla", "@clozzy", "bem-vinda ao close, Lara! 💗") + '</div>')
    page("Tom de voz", f'<div class="row" style="margin-top:12px;gap:34px"><div style="flex:1.35">{rows}</div><div style="flex:1">{caps}'
         f'<div style="font:500 12px/1.6 Figtree;color:{L3};margin-top:18px">Escrevemos como a criadora fala com a turma dela: frase curta, minúscula quando a rede pede, no máximo um emoji de coração, estrela ou brilho.</div></div></div>',
         "branco", "A Clozzy fala como uma amiga que também cria: jovem, direta, divertida e segura.", part="03")


def p_voz_texto():
    tb = [("Botão", "Entrar no close"), ("Botão de criadora", "Abrir meu close"), ("Push", "a Lara postou no close 💗"),
          ("Confirmação", "tá dentro! pago no Pix, liberado na hora"), ("Erro de pagamento", "ops, o Pix não passou. tenta de novo?"),
          ("Tela vazia", "ainda sem close por aqui. bora explorar?"), ("Bio", "seu close, seu preço. pago no Pix, liberado na hora."),
          ("Convite por DM", "oi, Lara! amei seus vídeos. quer abrir seu close na Clozzy? você define o preço 💗")]
    rows = "".join(f'<tr><td style="width:150px;color:{G4};padding:13px 8px">{a}</td><td style="font-weight:700;color:#fff;font-size:13.5px">{b}</td></tr>' for a, b in tb)
    usar = ["close", "criadora", "pack", "bora", "tá dentro", "caiu", "novidade", "link na bio", "seu preço", "Pix"]
    evitar = ["sexy", "hot", "nudes", "privê", "proibidão", "assinante", "usuário", "conteúdo adulto", "emoji de fogo/pêssego", "CAPS"]
    ch = lambda lst, ok: "".join(f'<span class="chv" style="background:{PINK if ok else G2};color:#fff">{x}</span>' for x in lst)
    emo = lambda lst, ok: "".join(f'<span style="font-size:30px;margin-right:12px;{"" if ok else "opacity:.45"}">{x}</span>' for x in lst)
    page("Palavras e microtextos", f'<div class="row" style="margin-top:12px;gap:34px"><div style="flex:1.5"><table style="color:#E6E6E6;font-size:12px">{rows}</table></div>'
         f'<div style="flex:1"><div class="lbl" style="color:#fff">Palavras da casa</div>{ch(usar, True)}'
         f'<div class="lbl" style="color:#fff;margin-top:16px">Palavras que ficam de fora</div>{ch(evitar, False)}'
         f'<div style="font:500 10.5px/1.6 Figtree;color:{G4};margin-top:14px">A marca nunca diz que é conteúdo adulto nem insinua. Quem quer o exclusivo sabe o que é “close”; quem não sabe lê como rede social de criadoras.</div>'
         f'<div class="lbl" style="color:#fff;margin-top:22px">Emojis da casa</div><div>{emo(["💗", "✨", "🌸", "🎀", "⭐"], True)}</div>'
         f'<div class="lbl" style="color:#fff;margin-top:14px">Emojis que ficam de fora</div><div>{emo(["🔥", "🍑", "🍆", "🔞", "😈"], False)}</div></div></div>',
         "preto", "O que escrever em cada lugar, com as palavras da casa e as que ficam de fora.", part="03")


# ------------------------------------------------------------------------------------------------ peças com foto (texto em bloco)
def post_foto(name, w, h, linhas, pos=None, r=10, marca=True):
    fs = w * .095
    out = f'<div style="position:relative">{foto(name, w, h, r, pos)}'
    if marca:
        out += f'<div style="position:absolute;left:10px;top:10px">{stamp(11 if w < 200 else 13)}</div>'
    return out + f'<div style="position:absolute;left:10px;bottom:12px">{tkl(linhas, fs, 3)}</div></div>'


def post_lock(w, h, r=10):
    return (f'<div style="position:relative">{foto("cama", w, h, r, None, True)}<div style="position:absolute;left:0;right:0;bottom:14px;text-align:center;z-index:3">'
            f'{tk("Só pro close.", PINK, WHITE, w * .1)}</div></div>')


def story(inner, bg, w=150, h=266, extra=""):
    return f'<div style="width:{w}px;height:{h}px;border-radius:14px;overflow:hidden;position:relative;background:{bg};flex-shrink:0;{extra}">{inner}</div>'


def sbars(c="#fff", n=4):
    return (f'<div style="position:absolute;top:8px;left:8px;right:8px;display:flex;gap:3px;z-index:4">'
            + "".join(f'<i style="flex:1;height:2.5px;border-radius:2px;background:{c};opacity:{1 if k < 2 else .4}"></i>' for k in range(n)) + '</div>')


def sticker(inner, w=None, bg=WHITE, fg=BLACK, r=10, pad="6px 10px", extra=""):
    ww = f"width:{w}px;" if w else ""
    return f'<div style="{ww}background:{bg};color:{fg};border-radius:{r}px;padding:{pad};{extra}">{inner}</div>'


def p_posts():
    A = lambda k: OB.post(k, 158, 198)
    cells = [(A("frase"), "Frase · preto"), (post_foto("selfie", 158, 198, [("bastidor", WHITE, BLACK), ("de quinta", PINK, WHITE)]), "Foto + legenda em bloco"),
             (A("rosa"), "Momento rosa"), (A("roxo"), "Criadora · roxo"), (post_lock(158, 198), "Teaser desfocado"), (A("num"), "Número · branco")]
    top = "".join(f'<div>{x}<div class="cap" style="color:#fff">{t}</div></div>' for x, t in cells)
    row2 = [(post_foto("cafe", 200, 250, [("rolê de sábado", WHITE, BLACK), ("com a Duda", BLACK, WHITE)]), "4:5 · foto, legenda branca"),
            (post_foto("espelho", 200, 250, [("look do dia", BLACK, WHITE), ("no close da Mel", PINK, WHITE)], "50% 20%"), "4:5 · foto, legenda preta e rosa"),
            (post_foto("solpor", 200, 250, [("pôr do sol", WHITE, BLACK), ("e pack novo", PURPLE, WHITE)]), "4:5 · foto, roxo no segundo bloco")]
    r2 = "".join(f'<div>{x}<div class="cap" style="color:#fff">{t}</div></div>' for x, t in row2)
    page("Posts do feed", f'<div class="grid" style="grid-template-columns:repeat(6,158px);gap:10px;margin-top:12px">{top}</div>'
         f'<div class="row" style="margin-top:14px;gap:12px">{r2}<div style="max-width:300px;font:500 11.5px/1.6 Figtree;color:#E6E6E6">Feed em ritmo: foto, cor, foto, número. '
         f'Marca pequena no canto de cima, título curto em até dois blocos. Em foto, texto sempre em bloco sólido; em fundo de cor, texto direto.</div></div>',
         "preto", "Seis tipos de post e três variações com foto. Alterne para o feed não virar um bloco de uma cor só.", part="06")


def p_carrossel():
    W = 150
    base = lambda inner, bg=BLACK, ex="border:1px solid #333;": f'<div style="width:{W}px;height:190px;border-radius:10px;background:{bg};padding:12px;position:relative;overflow:hidden;{ex}">{inner}</div>'
    capa = (f'<div style="position:relative">{foto("cafe", W, 190, 10, "40% 25%")}<div style="position:absolute;left:10px;top:10px">{stamp(10)}</div>'
            f'<div style="position:absolute;left:10px;bottom:12px">{tkl([("como entrar", WHITE, BLACK), ("no close", PINK, WHITE)], 15, 3)}</div></div>')
    passos = [base(f'<div class="d num" style="font-size:40px;color:{PINK}">{i}</div><div class="d" style="font-size:17px;color:#fff;margin-top:8px">{t}</div>'
                   f'<div style="font:500 9px/1.45 Figtree;color:{G4};margin-top:6px">{d}</div>')
              for i, t, d in ((1, "Escolha quem você quer de perto", "Prévia liberada e preço na vitrine."), (2, "Pague no Pix", "QR Code ou copia e cola."), (3, "Entre no close", "Tudo fica na sua biblioteca."))]
    fim = base(f'<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center">{sym("rosa", 60)}<div class="d" style="font-size:18px;color:#fff;margin-top:10px">Seu close,<br>seu preço.</div>'
               f'<div style="margin-top:10px">{btn(TEMAS["rosa"], "Link na bio", "botao", 20, 8)}</div></div>', PINK, "")
    strip1 = "".join([capa] + passos + [fim])
    diario = [("cafe", "40% 25%", [("sábado", WHITE, BLACK)]), ("espelho", "50% 20%", [("look", BLACK, WHITE)]), ("dupla", "50% 25%", [("trend", PINK, WHITE)]),
              ("setup", "40% 28%", [("edição", PURPLE, WHITE)]), ("solpor", "50% 38%", [("fim de tarde", WHITE, BLACK)])]
    strip2 = "".join(f'<div style="position:relative">{foto(n, W, 190, 10, pos)}<div style="position:absolute;left:10px;bottom:12px">{tkl(l, 14, 3)}</div></div>' for n, pos, l in diario)
    dots = lambda: '<div style="display:flex;gap:6px;margin-top:6px">' + "".join(f'<div style="width:{W}px;height:4px;border-radius:2px;background:{PINK if i == 0 else G3}"></div>' for i in range(5)) + '</div>'
    page("Carrossel", f'<div class="lbl" style="color:#fff;margin-top:12px">Educativo: capa com foto, um passo por card, fechamento rosa</div><div style="display:flex;gap:6px">{strip1}</div>{dots()}'
         f'<div class="lbl" style="color:#fff;margin-top:22px">Diário da criadora: uma foto por card, uma palavra em bloco</div><div style="display:flex;gap:6px">{strip2}</div>{dots()}',
         "preto", "Dois carrosséis de cinco cards. O número em rosa e o fechamento rosa com o símbolo amarram os dois.", part="06")


def p_stories():
    a = story(f'{foto("selfie", 150, 266, 0)}{sbars()}<div style="position:absolute;left:10px;top:18px;z-index:4">{stamp(10)}</div>'
              f'<div style="position:absolute;left:10px;bottom:52px">{tkl([("saiu pack", WHITE, BLACK), ("novo.", PINK, WHITE)], 20, 3)}</div>'
              f'<div style="position:absolute;left:10px;bottom:14px">{btn(TEMAS["preto"], "Ver pack", "cta", 24, 9, 130)}</div>', BLACK)
    b = story(f'{foto("cama", 150, 266, 0, None, True)}{sbars()}<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;z-index:3">'
              f'{sym("preto", 64)}<div style="margin-top:10px">{tk("Só pro close.", PINK, WHITE, 17)}</div></div>', BLACK)
    c = story(f'{sbars()}<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:12px">'
              f'{sym("rosa", 70, None)}<div class="d" style="font-size:20px;color:#fff;margin-top:12px">Você está<br>no close.</div>'
              f'<div style="font:600 8.5px Figtree;color:#fff;margin-top:6px">Pago no Pix. Liberado na hora.</div></div>', PINK)
    d = story(f'{foto("setup", 150, 128, 0)}{sbars()}<div style="position:absolute;left:12px;top:18px;z-index:4">{stamp(10)}</div>'
              f'<div style="position:absolute;left:12px;right:12px;top:140px"><div class="d" style="font-size:22px;color:#fff">Abra o seu<br>close.</div>'
              f'<div style="font:500 8.5px/1.4 Figtree;color:#EBE3FA;margin-top:6px">Você define o preço, recebe no Pix.</div>'
              f'<div style="margin-top:10px">{btn(TEMAS["roxo"], "Quero vender", "botao", 24, 9, 126)}</div></div>', PURPLE)
    poll = sticker('<div class="d" style="font-size:12px;text-align:center">qual trend<br>vem agora?</div>'
                   f'<div style="margin-top:6px;display:grid;gap:4px"><div style="background:{DEEP};color:#fff;border-radius:6px;padding:4px 7px;font:800 8.5px Figtree">dancinha · 62%</div>'
                   f'<div style="background:{L1};border-radius:6px;padding:4px 7px;font:800 8.5px Figtree">GRWM · 38%</div></div>', 118, extra="box-shadow:0 2px 0 rgba(0,0,0,.15)")
    e = story(f'{foto("dupla", 150, 266, 0)}{sbars()}<div style="position:absolute;left:10px;top:18px;z-index:4">{stamp(10)}</div>'
              f'<div style="position:absolute;left:16px;bottom:22px">{poll}</div>', BLACK)
    cd = sticker(f'<div style="font:700 8px Figtree;text-align:center">live hoje</div><div class="d num" style="font-size:22px;text-align:center;color:{DEEP}">20:00</div>'
                 f'<div style="display:flex;gap:3px;margin-top:3px;justify-content:center">' + "".join(f'<b class="num" style="background:{L1};border-radius:5px;padding:2px 5px;font:800 9px Gabarito">{x}</b>' for x in ("02", "14", "37")) + '</div>', 110)
    fz = story(f'{foto("solpor", 150, 266, 0)}{sbars()}<div style="position:absolute;left:10px;top:18px;z-index:4">{stamp(10)}</div>'
               f'<div style="position:absolute;left:10px;bottom:100px">{tk("live com a Lara", WHITE, BLACK, 14)}</div>'
               f'<div style="position:absolute;left:20px;bottom:14px">{cd}</div>', BLACK)
    cap = ["Lançamento · foto", "Teaser do close", "Compra aprovada", "Convite para criadora", "Enquete (figurinha)", "Contagem para live"]
    cells = "".join(f'<div>{x}<div class="cap" style="color:#fff">{t}</div></div>' for x, t in zip((a, b, c, d, e, fz), cap))
    page("Stories", f'<div class="row" style="margin-top:14px;gap:12px">{cells}</div>'
         f'<div class="row" style="margin-top:16px;gap:30px;font:500 11px/1.6 Figtree;color:#E6E6E6"><div style="max-width:440px"><b style="color:#fff;font:800 12px Gabarito">Área segura</b><br>9:16, com 250 px livres em cima e embaixo (interface da rede). Marca pequena no topo, texto e botão no terço de baixo.</div>'
         f'<div style="max-width:440px"><b style="color:#fff;font:800 12px Gabarito">Figurinhas</b><br>Enquete, contagem e menção usam a figurinha nativa da rede, em branco. A marca não redesenha as figurinhas da plataforma.</div></div>',
         "preto", "Seis stories prontos: lançamento, teaser, compra, convite, interação e contagem.", part="06")


def ad_foto(w, h, nome, linhas, pos=None, cta="Entrar no close"):
    return (f'<div style="position:relative">{foto(nome, w, h, 10, pos)}<div style="position:absolute;left:12px;top:12px">{stamp(11)}</div>'
            f'<div style="position:absolute;left:12px;bottom:46px">{tkl(linhas, min(w, h) * .075, 3)}</div>'
            f'<div style="position:absolute;left:12px;bottom:12px">{btn(TEMAS["preto"], cta, "cta", 24, 9)}</div></div>')


def p_anuncios():
    s9 = ad_foto(200, 356, "selfie", [("o exclusivo de", WHITE, BLACK), ("quem você segue", PINK, WHITE)])
    f45 = ad_foto(214, 268, "dupla", [("a trend", WHITE, BLACK), ("tá no close", BLACK, WHITE)])
    f11 = (f'<div style="width:214px;height:214px;border-radius:10px;background:{PURPLE};overflow:hidden;position:relative">{foto("setup", 214, 112, 0)}'
           f'<div style="position:absolute;left:12px;top:12px">{stamp(11)}</div><div style="padding:10px 12px"><div class="d" style="font-size:19px;color:#fff">Seu conteúdo.<br>Seu preço.</div>'
           f'<div style="margin-top:8px">{btn(TEMAS["roxo"], "Abrir meu close", "botao", 22, 9)}</div></div></div>')
    b31 = OB.ad("rosa", 300, 100)
    b41 = (f'<div style="width:300px;height:76px;border-radius:10px;background:{BLACK};display:flex;align-items:center;gap:12px;padding:8px;border:1px solid #D0D0D0">'
           f'{foto("selfie", 60, 60, 8)}<div class="d" style="font-size:15px;color:#fff;flex:1">Seu close,<br><span style="color:{PINK}">seu preço.</span></div>{btn(TEMAS["preto"], "Baixar", "cta", 22, 9)}</div>')
    page("Anúncios", f'<div class="row" style="margin-top:14px;gap:14px;align-items:flex-end">'
         f'<div>{s9}<div class="cap">Story / Reels 9:16 · fã</div></div><div>{f45}<div class="cap">Feed 4:5 · fã</div></div>'
         f'<div>{f11}<div class="cap">Feed 1:1 · criadora</div></div>'
         f'<div style="display:flex;flex-direction:column;gap:10px"><div>{b31}<div class="cap">Banner 3:1 · remarketing</div></div><div>{b41}<div class="cap">Banner 4:1 · display</div></div></div></div>',
         "branco", "Fã: foto clara, texto em bloco, botão Pink Deep. Criadora: roxo com botão branco. Remarketing: rosa com o ícone.", part="07")


# ------------------------------------------------------------------------------------------------ 04 · app
def p_onboarding():
    R, B, P = TEMAS["roxo"], TEMAS["branco"], TEMAS["rosa"]
    s1 = (f'<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:18px">{sym("roxo", 92)}'
          f'<div class="d" style="font-size:28px;color:#fff;margin-top:18px">Abra o<br>seu close.</div><div style="font:500 10px/1.45 Figtree;color:#EBE3FA;margin-top:8px">Você define o preço e recebe no Pix.</div></div>'
          f'<div style="position:absolute;left:12px;right:12px;bottom:16px;text-align:center">{btn(R, "Começar", "botao", 32, 12, 176)}<div style="font:700 9px Figtree;color:#fff;margin-top:9px">Já tenho conta</div></div>')
    campo = lambda a, b: (f'<div style="margin-top:8px"><div style="font:700 8px Figtree;color:{L3}">{a}</div><div style="margin-top:3px;border:1.5px solid {L2};border-radius:10px;padding:8px 10px;font:700 10px Figtree;color:{BLACK}">{b}</div></div>')
    ch = "".join(chip(B, t, on) for t, on in (("dança", True), ("moda", False), ("lifestyle", True), ("humor", False), ("beleza", False)))
    s2 = (f'<div style="padding:8px 14px"><div class="d" style="font-size:22px;color:{BLACK}">Conta aí.</div>'
          f'<div style="display:flex;justify-content:center;margin:10px 0 2px">{OB.ring_av(B, "selfie", 64)}</div>'
          f'{campo("Nome", "Lara Mendes")}{campo("@usuário", "@laramendes")}'
          f'<div style="font:700 8px Figtree;color:{L3};margin-top:10px">O que você cria?</div><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;zoom:.85">{ch}</div></div>'
          f'<div style="position:absolute;left:12px;right:12px;bottom:16px">{btn(B, "Continuar", "cta", 32, 12, 176)}</div>')
    pr = "".join(chip(B, t, on) for t, on in (("R$ 9,90", False), ("R$ 19,90", True), ("R$ 29,90", False)))
    s3 = (f'<div style="padding:8px 14px"><div class="d" style="font-size:22px;color:{BLACK}">Seu preço.</div>'
          f'<div style="font:500 10px/1.45 Figtree;color:{L3};margin-top:4px">Quanto vale entrar no seu close por mês?</div>'
          f'<div class="d num" style="font-size:44px;color:{DEEP};margin-top:26px;text-align:center">R$ 19,90</div><div style="text-align:center;font:600 9px Figtree;color:{L3}">por mês</div>'
          f'<div style="display:flex;gap:4px;justify-content:center;margin-top:18px;zoom:.85">{pr}</div>'
          f'<div style="margin-top:22px;padding:10px;border-radius:12px;background:{L1};font:600 9.5px/1.45 Figtree;color:{BLACK}">Você recebe no Pix. Pode mudar o preço quando quiser.</div></div>'
          f'<div style="position:absolute;left:12px;right:12px;bottom:16px">{btn(B, "Abrir meu close", "cta", 32, 12, 176)}</div>')
    stars = "".join(f'<div style="position:absolute;left:{x}px;top:{y}px;opacity:.9">{svg(M.macia(WHITE, 40, dot=False), "5 5 90 90", sz)}</div>' for x, y, sz in ((18, 44, 16), (150, 70, 22), (30, 300, 20), (156, 280, 14), (90, 40, 10)))
    s4 = (f'{stars}<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:18px">'
          f'<div style="width:60px;height:60px;border-radius:50%;overflow:hidden;border:3px solid #fff">{foto("cama", 60, 60, 30, "50% 22%", extra="background-size:300%")}</div>'
          f'<div class="d" style="font-size:26px;color:#fff;margin-top:14px">Primeira<br>assinatura!</div>'
          f'<div style="font:600 10px/1.45 Figtree;color:#fff;margin-top:8px">A Duda entrou no seu close.<br><b class="num" style="font:900 14px Gabarito">+ R$ 19,90</b></div></div>'
          f'<div style="position:absolute;left:12px;right:12px;bottom:16px">{btn(P, "Ver meu painel", "botao", 32, 12, 176)}</div>')
    ph = "".join(f'<div style="text-align:center">{phone(x, T, 200, 410)}<div class="cap" style="color:#fff">{t}</div></div>' for x, T, t in
                 ((s1, R, "1 · Convite · roxo"), (s2, B, "2 · Perfil"), (s3, B, "3 · Preço"), (s4, P, "4 · Primeira venda · rosa")))
    page("Onboarding da criadora", f'<div class="row" style="margin-top:12px;gap:18px">{ph}<div style="max-width:150px;font:500 10.5px/1.6 Figtree;color:#E6E6E6">'
         f'Roxo abre, branco coleta dados, rosa comemora. Três perguntas, nenhuma a mais. O momento rosa é a primeira venda.</div></div>', "preto",
         "Do convite à primeira venda em quatro telas. A criadora entra pelo roxo e sai no rosa.", part="04")


def p_componentes():
    W, K = TEMAS["branco"], TEMAS["preto"]
    sec = lambda t, inner: f'<div><div class="lbl">{t}</div>{inner}</div>'
    botoes = (f'<div style="display:flex;gap:6px;flex-wrap:wrap">{btn(W, "Entrar no close", "cta", 34, 12)}{btn(W, "Ver mais", "sec", 34, 12)}'
              f'{btn(W, "Indisponível", "botao", 34, 12, None, f"background:{L2};color:{L3};")}{btn(W, "Pequeno", "cta", 24, 10)}</div>')
    chips = f'<div style="display:flex;gap:5px;flex-wrap:wrap">' + "".join(chip(W, t, on) for t, on in (("tudo", True), ("dança", False), ("moda", False), ("humor", False))) + '</div>'
    selos = (f'<div style="display:flex;gap:6px;flex-wrap:wrap;zoom:1.4">{selo(W, "CLOSE")}{selo(K, "NOVO")}'
             f'<span class="selo" style="background:{PINK};color:#fff">AO VIVO</span><span class="selo" style="background:{PURPLE};color:#fff">CRIADORA</span><span class="selo" style="background:{BLACK};color:#fff">18+</span></div>')
    campos = (f'<div style="display:grid;gap:8px"><div style="border:1.5px solid {L2};border-radius:12px;padding:9px 12px;font:600 11px Figtree;color:{L3}">@usuário</div>'
              f'<div style="border:2px solid {DEEP};border-radius:12px;padding:9px 12px;font:700 11px Figtree;color:{BLACK}">@laramendes<span style="color:{DEEP}">|</span></div>'
              f'<div style="border:2px solid {BLACK};border-radius:12px;padding:9px 12px;font:600 11px Figtree;color:{BLACK};display:flex;justify-content:space-between">Esse @ já existe<b style="font-family:Gabarito">!</b></div></div>')
    tog = lambda on: (f'<span style="display:inline-block;width:38px;height:22px;border-radius:11px;background:{DEEP if on else L2};position:relative"><i style="position:absolute;top:3px;{"right" if on else "left"}:3px;width:16px;height:16px;border-radius:50%;background:#fff"></i></span>')
    controles = (f'<div style="display:flex;gap:14px;align-items:center">{tog(True)}{tog(False)}'
                 f'<span class="ok" style="background:{DEEP};color:#fff;width:20px;height:20px;border-radius:6px;margin:0">✓</span>'
                 f'<span style="width:20px;height:20px;border-radius:6px;border:2px solid {L2}"></span>'
                 f'<span style="width:20px;height:20px;border-radius:50%;border:5px solid {DEEP}"></span></div>'
                 f'<div style="display:flex;gap:16px;margin-top:12px;font:800 12px Gabarito;border-bottom:1px solid {L2}">'
                 f'<span style="padding-bottom:6px;border-bottom:3px solid {DEEP}">Fotos</span><span style="color:{L3}">Vídeos</span><span style="color:{L3}">Packs</span><span style="color:{L3}">Lives</span></div>')
    avs = (f'<div style="display:flex;gap:10px;align-items:center">{OB.ring_av(W, "selfie", 46, True)}{OB.ring_av(W, "espelho", 46, False)}'
           f'<div style="position:relative">{OB.ring_av(W, "dupla", 46, True)}<b style="position:absolute;right:-4px;top:-4px;background:{DEEP};color:#fff;border-radius:999px;font:800 9px Gabarito;padding:1px 6px">3</b></div>'
           f'<div style="font:600 9px/1.4 Figtree;color:{L3}">tracejado = close ativo<br>sólido = perfil normal</div></div>')
    toast = lambda msg, bg, fg, ic: (f'<div style="display:flex;align-items:center;gap:9px;background:{bg};color:{fg};border-radius:14px;padding:10px 14px;font:700 11px Figtree"><span style="width:20px;height:20px;border-radius:50%;background:{ic};color:#fff;display:flex;align-items:center;justify-content:center;font:900 11px Gabarito">{"✓" if ic == DEEP else "!"}</span>{msg}</div>')
    toasts = f'<div style="display:grid;gap:7px">{toast("tá dentro! liberado na hora", BLACK, "#fff", DEEP)}{toast("ops, o Pix não passou. tenta de novo?", L1, BLACK, BLACK)}</div>'
    card = (f'<div style="width:150px;border-radius:14px;background:{G1};overflow:hidden;border:1px solid {G3}">{foto("selfie", 150, 150, 0)}'
            f'<div style="padding:9px 10px"><div style="display:flex;align-items:center;gap:5px"><b style="font:800 11px Gabarito;color:#fff">Lara Mendes</b>{selo(K)}</div>'
            f'<div style="font:600 8.5px Figtree;color:{G4};margin-top:2px">@laramendes · 3,2 mil no close</div>'
            f'<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px"><b class="num" style="font:900 12px Gabarito;color:{PINK}">R$ 19,90</b>{btn(K, "Entrar", "cta", 22, 9)}</div></div></div>')
    vazio = (f'<div style="width:190px;border-radius:14px;background:{G1};border:1px solid {G3};padding:16px;text-align:center">{sym("preto", 52)}'
             f'<div class="d" style="font-size:16px;color:#fff;margin-top:10px">Ainda sem close<br>por aqui.</div><div style="font:500 9px Figtree;color:{G4};margin-top:4px">bora explorar?</div>'
             f'<div style="margin-top:10px">{btn(K, "Explorar", "cta", 24, 10)}</div></div>')
    esq = (f'<div style="flex:1.25;display:grid;gap:16px">{sec("Botões", botoes)}{sec("Chips", chips)}{sec("Selos", selos)}{sec("Campos: normal, foco, erro", campos)}</div>'
           f'<div style="flex:1.05;display:grid;gap:16px;align-content:start">{sec("Controles e abas", controles)}{sec("Avatares", avs)}{sec("Avisos", toasts)}</div>')
    dir_ = (f'<div style="background:{BLACK};border-radius:18px;padding:16px;display:flex;gap:14px;flex:1.3"><div><div class="lbl" style="color:#fff">Card de criadora</div>{card}</div>'
            f'<div><div class="lbl" style="color:#fff">Tela vazia</div>{vazio}</div></div>')
    page("Componentes", f'<div class="row" style="margin-top:14px;gap:26px">{esq}{dir_}</div>', "branco",
         "Os blocos do app e da web. Rosa só em destaque pontual; erro sem outra cor: preto, ponto de exclamação e frase amigável.", part="04")


# ------------------------------------------------------------------------------------------------ 05 · web
def qr(px=100, n=21, fg=BLACK, bg=WHITE):
    c = px / n
    r = ""
    for y in range(n):
        for x in range(n):
            blocos = [(0, 0), (n - 7, 0), (0, n - 7)]
            on = None
            for bx0, by0 in blocos:
                if bx0 <= x < bx0 + 7 and by0 <= y < by0 + 7:
                    bx, by = x - bx0, y - by0
                    on = bx in (0, 6) or by in (0, 6) or (2 <= bx <= 4 and 2 <= by <= 4)
            if on is None:
                if (x < 8 and y < 8) or (x >= n - 8 and y < 8) or (x < 8 and y >= n - 8):
                    on = False
                else:
                    on = (x * 37 + y * 57 + x * y * 13 + (x ^ y) * 5) % 7 < 3
            if on:
                r += f'<rect x="{f(x * c)}" y="{f(y * c)}" width="{f(c + .2)}" height="{f(c + .2)}"/>'
    return f'<svg viewBox="0 0 {px} {px}" width="{px}" height="{px}" style="background:{bg}" fill="{fg}">{r}</svg>'


def s_linkbio(T, nome, ff, handle, bio, links, cards):
    av = OB.ring_av(T, ff, 64)
    ln = ""
    for i, (t, sub) in enumerate(links):
        if i == 0:
            ln += f'<div style="margin-top:8px">{btn(T, t, "cta", 38, 11.5, 194)}</div>'
        else:
            ln += (f'<div style="margin-top:7px;width:194px;height:34px;border-radius:12px;background:{T["sup2"]};display:flex;justify-content:space-between;align-items:center;padding:0 12px;'
                   f'font:800 10.5px Gabarito;color:{T["titulo"]}"><span>{t}</span><span style="color:{T["apoio"]};font:600 9px Figtree">{sub}</span></div>')
    th = "".join(f'<div>{foto(n, 60, 66, 10, p, lk)}</div>' for n, p, lk in cards)
    return (f'<div style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:10px 12px">{av}'
            f'<div style="display:flex;align-items:center;gap:5px;margin-top:8px"><b class="d" style="font-size:19px;color:{T["titulo"]}">{nome}</b></div>'
            f'<div style="font:600 9px Figtree;color:{T["apoio"]};margin-top:2px">{handle}</div>'
            f'<div style="font:500 9.5px/1.45 Figtree;color:{T["texto"]};margin-top:7px;max-width:190px">{bio}</div>'
            f'<div style="margin-top:6px">{selo(T)}</div>{ln}'
            f'<div style="display:flex;gap:7px;margin-top:12px">{th}</div></div>')


def p_linkbio():
    K, W, R = TEMAS["preto"], TEMAS["branco"], TEMAS["roxo"]
    a = s_linkbio(K, "Lara Mendes", "selfie", "@laramendes · 3,2 mil no close", "dança, rotina e bastidor. o exclusivo é aqui 💗",
                  [("Entrar no close · R$ 19,90", ""), ("Pack novo", "R$ 7,90"), ("Live de sexta", "20h")],
                  [("selfie", "50% 18%", False), ("cafe", "40% 25%", False), ("cama", "50% 22%", True)])
    b = s_linkbio(W, "Mel Ito", "cafe", "@melito · 1,8 mil no close", "moda, café e look do dia. bora?",
                  [("Entrar no close · R$ 14,90", ""), ("Look da semana", "grátis"), ("Parcerias", "e-mail")],
                  [("espelho", "50% 14%", False), ("solpor", "50% 38%", False), ("cama", "50% 22%", True)])
    c = s_linkbio(R, "Duda Prado", "setup", "@duda.prado · 940 no close", "edito vídeo, dou dica de CapCut e abro o bastidor.",
                  [("Entrar no close · R$ 9,90", ""), ("Pack de presets", "R$ 12,90"), ("Dica da semana", "novo")],
                  [("setup", "40% 28%", False), ("dupla", "50% 25%", False), ("cama", "50% 22%", True)])
    ph = "".join(f'<div style="text-align:center">{phone(x, T, 232, 468)}<div class="cap" style="color:#fff">{t}</div></div>' for x, T, t in
                 ((a, K, "Preto · padrão"), (b, W, "Branco · criadora que prefere claro"), (c, R, "Roxo · criadora de bastidor")))
    page("Link na bio", f'<div class="row" style="margin-top:12px;gap:18px">{ph}<div style="max-width:200px;font:500 11px/1.6 Figtree;color:#E6E6E6">'
         f'A página clozzy.com.br/@usuário é o que a criadora põe na bio do TikTok e do Instagram. O primeiro botão é sempre o close. '
         f'A criadora escolhe o tema (preto, branco ou roxo); rosa é só do botão de compra.</div></div>', "preto",
         "A vitrine da criadora, em três temas. É a peça que mais aparece para quem ainda não conhece a Clozzy.", part="05")


def p_perfil_web():
    K = TEMAS["preto"]
    th = "".join(f'<div>{foto(n, 176, 230, 12, p, lk)}</div>' for n, p, lk in (("selfie", "50% 18%", False), ("cafe", "40% 25%", False), ("cama", "50% 22%", True), ("dupla", "50% 25%", False), ("solpor", "50% 38%", True)))
    inner = (f'<div style="background:{BLACK};height:540px;position:relative;overflow:hidden">'
             f'<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 22px">{logo_app(K, 15)}<div style="display:flex;gap:14px;align-items:center;font:600 9px Figtree;color:#E6E6E6"><span>Explorar</span><span>Para criadoras</span>{btn(K, "Entrar", "botao", 22, 9)}</div></div>'
             f'{foto("solpor", 1000, 110, 0, "50% 4%")}'
             f'<div style="display:flex;gap:16px;padding:0 24px;margin-top:-30px;align-items:flex-end">{OB.ring_av(K, "selfie", 84)}'
             f'<div style="flex:1;padding-bottom:4px"><div style="display:flex;align-items:center;gap:7px"><b class="d" style="font-size:24px;color:#fff">Lara Mendes</b>{selo(K)}</div>'
             f'<div style="font:600 10px Figtree;color:{G4};margin-top:2px">@laramendes · 48,2 mil seguidores · 3,2 mil no close</div></div>'
             f'<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:14px;border:1.5px solid {PINK}"><div><div style="font:800 9px Gabarito;color:#fff">Close da Lara</div>'
             f'<b class="num" style="font:900 15px Gabarito;color:{PINK}">R$ 19,90/mês</b></div>{btn(K, "Entrar no close", "cta", 30, 11)}</div></div>'
             f'<div style="display:flex;gap:18px;padding:16px 24px 8px;font:800 12px Gabarito;color:{G4}"><span style="color:#fff;border-bottom:3px solid {PINK};padding-bottom:5px">Fotos</span><span>Vídeos</span><span>Packs</span><span>Lives</span></div>'
             f'<div style="display:flex;gap:10px;padding:0 24px">{th}</div></div>')
    page("Perfil da criadora na web", f'<div style="margin-top:12px">{OB.browser(inner, 1000, 560, BLACK)}</div>', "branco",
         "O perfil público: capa e foto da criadora, preço do close à vista, abas de conteúdo e prévia desfocada do que é pago.", part="05")


def p_preview():
    og = (f'<div style="width:580px;height:305px;border-radius:12px;overflow:hidden;display:flex;border:1px solid {L2}">{foto("selfie", 260, 305, 0)}'
          f'<div style="flex:1;background:{BLACK};padding:20px;position:relative"><div>{lock("preto", 20, None)}</div>'
          f'<div class="d" style="font-size:34px;color:#fff;margin-top:26px">Close da<br><span style="color:{PINK}">Lara Mendes</span></div>'
          f'<div style="font:600 12px Figtree;color:{G4};margin-top:8px">3,2 mil já estão no close</div>'
          f'<div style="position:absolute;left:20px;bottom:20px">{btn(TEMAS["preto"], "R$ 19,90 por mês", "cta", 32, 12)}</div></div></div>')
    wa = (f'<div style="width:300px;padding:8px;border-radius:14px;background:{L1}"><div style="border-radius:10px;overflow:hidden;background:#fff;border:1px solid {L2}">{foto("selfie", 284, 130, 0, "50% 20%")}'
          f'<div style="padding:8px 10px"><div style="font:800 11px Gabarito">Close da Lara · Clozzy</div><div style="font:500 9.5px/1.4 Figtree;color:{L3}">3,2 mil já estão no close. Pago no Pix, liberado na hora.</div>'
          f'<div style="font:600 8.5px Figtree;color:{L3};margin-top:3px">clozzy.com.br</div></div></div><div style="font:500 10.5px Figtree;margin:7px 4px 2px">clozzy.com.br/@laramendes</div></div>')
    tab = (f'<div style="display:flex;align-items:center;gap:7px;width:260px;height:30px;background:{L1};border-radius:10px 10px 0 0;padding:0 11px;font:700 10px Figtree">{tile("rosa", 16, None, 4)}Close da Lara · Clozzy<span style="margin-left:auto;color:{L3}">×</span></div>'
           f'<div style="width:260px;height:12px;background:{L1}"></div>')
    fav = "".join(f'<div style="text-align:center">{tile(v, px, None, 22)}<div class="cap num">{px} px</div></div>' for v, px in (("rosa", 16), ("rosa", 32), ("rosa", 48), ("rosa", 96)))
    qrc = (f'<div style="width:170px;padding:14px;border-radius:16px;background:{PINK};text-align:center;flex-shrink:0"><div style="background:#fff;border-radius:10px;padding:10px;display:inline-block;position:relative">{qr(112)}'
           f'<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:30px;height:30px;border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center">{sym("branco", 24, None)}</div></div>'
           f'<div class="d" style="font-size:15px;color:#fff;margin-top:9px">me acha<br>no close.</div></div>')
    page("Prévia de link, aba e QR", f'<div class="row" style="margin-top:14px;gap:36px"><div><div class="lbl">Imagem de compartilhamento (1200×630)</div>{og}'
         f'<div class="row" style="gap:40px;margin-top:20px"><div><div class="lbl">Aba do navegador</div>{tab}</div><div><div class="lbl">Favicon</div><div style="display:flex;gap:14px;align-items:flex-end">{fav}</div></div></div></div>'
         f'<div><div class="lbl">Prévia no WhatsApp e Direct</div>{wa}<div class="lbl" style="margin-top:20px">QR do perfil</div><div class="row" style="gap:14px">{qrc}'
         f'<div style="font:500 10.5px/1.55 Figtree;color:{L3};max-width:130px">QR preto sobre branco, estrela no centro, moldura rosa. Nunca QR rosa.</div></div></div></div>',
         "branco", "O que aparece quando alguém compartilha o link da criadora: foto dela, preço e a marca em segundo plano.", part="05")


# ------------------------------------------------------------------------------------------------ 06 · redes (vídeo, grade, live, figurinhas, capas)
def frame(inner, w=178, h=316, bg=BLACK, r=14, extra=""):
    return f'<div style="width:{w}px;height:{h}px;border-radius:{r}px;overflow:hidden;position:relative;background:{bg};flex-shrink:0;{extra}">{inner}</div>'


def p_video():
    ui = lambda: (f'<div style="position:absolute;right:7px;bottom:78px;display:flex;flex-direction:column;gap:11px;z-index:4">'
                  + "".join(f'<i style="width:18px;height:18px;border-radius:50%;background:rgba(255,255,255,.9)"></i>' for _ in range(4)) + '</div>')
    a = frame(f'{foto("dupla", 178, 316, 0)}{ui()}<div style="position:absolute;left:10px;top:78px">{tkl([("pov: você achou", WHITE, BLACK), ("o close da", WHITE, BLACK), ("sua criadora", PINK, WHITE), ("favorita", PINK, WHITE)], 17, 3)}</div>')
    low = (f'<div style="position:absolute;left:10px;right:36px;bottom:30px;background:#fff;border-radius:14px;padding:8px 9px;display:flex;align-items:center;gap:8px;color:{BLACK}">'
           f'{OB.ring_av(TEMAS["branco"], "selfie", 36)}<div><b style="font:800 11px Gabarito">Lara Mendes</b><div style="font:600 8px Figtree;color:{L3}">criadora · 3,2 mil no close</div></div></div>')
    b = frame(f'{foto("selfie", 178, 316, 0)}{ui()}<div style="position:absolute;left:10px;top:14px">{stamp(10)}</div>{low}')
    steps = "".join(f'<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">{tk(str(i), PINK, WHITE, 15)}{tk(t, WHITE, BLACK, 15)}</div>' for i, t in ((1, "escolhe"), (2, "paga no Pix"), (3, "tá dentro")))
    c = frame(f'{foto("solpor", 178, 316, 0)}{ui()}<div style="position:absolute;left:10px;top:100px">{steps}</div>')
    d = frame(f'<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">{sym("rosa", 84, None)}'
              f'<div class="d" style="font-size:25px;color:#fff;margin-top:14px">Seu close,<br>seu preço.</div><div style="margin-top:14px">{tk("link na bio ↑", WHITE, BLACK, 14)}</div></div>', bg=PINK)
    seg = lambda c, t: f'<div style="position:absolute;left:0;right:0;{c};background:rgba(224,0,90,.35);color:#fff;font:800 9px Figtree;display:flex;align-items:center;justify-content:center">{t}</div>'
    e = frame(f'{seg("top:0;height:38px", "barra da rede")}{seg("bottom:0;height:70px", "legenda e som")}'
              f'<div style="position:absolute;right:0;top:38px;bottom:70px;width:34px;background:rgba(224,0,90,.35);color:#fff;font:800 9px Figtree;display:flex;align-items:center;justify-content:center"><span style="writing-mode:vertical-rl">botões</span></div>'
              f'<div style="position:absolute;left:8px;right:42px;top:46px;bottom:78px;border:1.5px dashed {PINK};border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font:800 11px Gabarito;text-align:center">área do<br>conteúdo</div>', bg=G1, extra="border:1px solid #333;")
    cells = [(a, "0–2 s · gancho"), (b, "2–8 s · a criadora"), (c, "8–13 s · como funciona"), (d, "13–15 s · fecho rosa"), (e, "Área segura")]
    fr = "".join(f'<div>{x}<div class="cap" style="color:#fff">{t}</div></div>' for x, t in cells)
    tl = "".join(f'<div style="flex:{w};background:{bg};color:{fg};padding:7px 10px;font:800 10px Gabarito;white-space:nowrap">{t}</div>' for w, bg, fg, t in
                 ((2, PINK, WHITE, "gancho"), (6, WHITE, BLACK, "criadora"), (5, PURPLE, WHITE, "como funciona"), (2, BLACK, WHITE, "fecho")))
    page("Vídeo vertical", f'<div class="row" style="margin-top:12px;gap:12px">{fr}</div>'
         f'<div style="display:flex;margin-top:14px;width:938px;border-radius:8px;overflow:hidden;border:1px solid #333">{tl}</div>'
         f'<div style="font:500 11px/1.6 Figtree;color:#E6E6E6;margin-top:10px;max-width:938px">TikTok, Reels e Shorts em 9:16, de 15 a 20 s. Os dois primeiros segundos são da criadora, com legenda em bloco; a marca só aparece em pílula pequena e no fecho. '
         f'Texto fora das faixas da rede: 140 px no topo, 250 px embaixo, 120 px do lado direito.</div>', "preto",
         "Roteiro de 15 segundos em cinco quadros: gancho, apresentação, passo a passo, fecho e a área segura.", part="06")


def p_grade():
    K = TEMAS["preto"]
    def cel(kind, w=74, h=98):
        if kind[0] == "f":
            _, n, tx, bg, fg = kind
            return f'<div style="position:relative">{foto(n, w, h, 0)}<div style="position:absolute;left:5px;bottom:6px">{tk(tx, bg, fg, 9)}</div></div>'
        _, bg, big, small, fg = kind
        return (f'<div style="width:{w}px;height:{h}px;background:{bg};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:{fg};{"border:1px solid #2A2A2A;" if bg == BLACK else ""}">'
                f'<div class="d" style="font-size:20px">{big}</div><div style="font:700 7.5px Figtree;margin-top:3px">{small}</div></div>')
    kinds = [("f", "selfie", "bastidor", WHITE, BLACK), ("c", PINK, "3.214", "no close da Lara", WHITE), ("f", "cafe", "sábado", PINK, WHITE),
             ("c", PURPLE, "dica", "edição em 3 passos", WHITE), ("f", "dupla", "trend", WHITE, BLACK), ("c", BLACK, "#12", "Pack novo", WHITE),
             ("f", "setup", "edição", PURPLE, WHITE), ("c", PINK, "tá dentro", "pago no Pix", WHITE), ("f", "espelho", "look do dia", BLACK, WHITE)]
    grid = "".join(cel(k) for k in kinds)
    prof = (f'<div style="padding:6px 12px"><div style="display:flex;align-items:center;gap:10px">{OB.ring_av(K, "selfie", 46)}<div><b class="d" style="font-size:14px;color:#fff">Lara Mendes</b>'
            f'<div style="font:600 8px Figtree;color:{G4}">48,2 mil seguidores</div></div></div></div>'
            f'<div style="display:grid;grid-template-columns:repeat(3,74px);gap:2px;justify-content:center;margin-top:6px">{grid}</div>')
    cov = lambda inner, bg=BLACK, ex="": f'<div style="width:140px;height:186px;border-radius:12px;overflow:hidden;position:relative;background:{bg};{ex}">{inner}</div>'
    c1 = cov(f'{foto("cafe", 140, 186, 0, "40% 25%")}<div style="position:absolute;left:8px;top:8px">{tk("#12", PINK, WHITE, 12)}</div><div style="position:absolute;left:8px;bottom:10px">{tkl([("rolê de", WHITE, BLACK), ("sábado", WHITE, BLACK)], 15, 3)}</div>')
    c2 = cov(f'<div style="padding:12px"><div class="d" style="font-size:54px;color:#fff;margin-top:34px">3.214</div><div class="d" style="font-size:15px;color:#fff;margin-top:6px">no close<br>da Lara</div></div><div style="position:absolute;left:12px;bottom:12px">{sym("rosa", 28, None)}</div>', PINK)
    c3 = cov(f'<div style="padding:12px"><div style="font:800 10px Gabarito;color:#EBE3FA">dica da Duda</div><div class="d" style="font-size:22px;color:#fff;margin-top:8px">3 passos<br>pra editar<br>no celular</div></div><div style="position:absolute;left:12px;bottom:12px">{sym("roxo", 28, None)}</div>', PURPLE)
    c4 = cov(f'<div style="padding:12px"><div style="font:800 10px Gabarito;color:{DEEP}">perguntas</div><div class="d" style="font-size:22px;color:{BLACK};margin-top:8px">como<br>entrar<br>no close?</div></div><div style="position:absolute;left:12px;bottom:12px">{sym("branco", 28, None)}</div>', WHITE, "border:1px solid #E6E6E6;")
    rg = ["Três em quatro posts com foto da criadora; um em quatro de cor sólida.", "Cor sólida só rosa, roxo, preto ou branco; nunca duas iguais lado a lado.",
          "O título vai em bloco (foto) ou direto (cor), em até 3 linhas.", "O número da série (#12) em bloco rosa, sempre no canto de cima."]
    rl = "".join(f'<div style="display:flex;gap:8px;font:500 10.5px/1.45 Figtree;color:#E6E6E6;margin-top:6px"><span class="ok" style="background:{PINK};color:#fff;flex-shrink:0">✓</span>{r}</div>' for r in rg)
    page("Grade e capas de Reels", f'<div class="row" style="margin-top:12px;gap:34px">{phone(prof, K, 244, 470)}<div>'
         f'<div class="lbl" style="color:#fff">Quatro capas padrão (3:4 → recorte 1:1 no grid)</div><div class="row" style="gap:12px">{c1}{c2}{c3}{c4}</div>'
         f'<div style="max-width:600px;margin-top:14px">{rl}</div></div></div>', "preto",
         "A grade do perfil intercala foto e cor. As capas seguem quatro modelos para o perfil ler como um todo.", part="06")


def p_live():
    K = TEMAS["preto"]
    com = "".join(f'<div style="margin-top:4px">{tk("<b>" + u + "</b> " + t, bg, fg, 9)}</div>' for u, t, bg, fg in
                  (("mel", "chegueiiii 💗", WHITE, BLACK), ("duda", "esse look!!", BLACK, WHITE), ("ana", "pix caiu, tô dentro ✨", PINK, WHITE), ("bia", "amei a live", WHITE, BLACK)))
    a = frame(f'{foto("setup", 220, 390, 0, "40% 28%")}<div style="position:absolute;left:10px;top:12px;display:flex;align-items:center;gap:6px">{OB.ring_av(K, "selfie", 34)}'
              f'<b style="background:#fff;color:{BLACK};border-radius:999px;padding:3px 8px;font:800 9px Gabarito">Lara</b>'
              f'<span class="selo" style="background:{PINK};color:#fff;height:18px;font-size:9px">AO VIVO</span></div>'
              f'<div style="position:absolute;right:10px;top:16px">{tk("1,2 mil", BLACK, WHITE, 10)}</div>'
              f'<div style="position:absolute;left:10px;bottom:56px">{com}</div>'
              f'<div style="position:absolute;left:10px;right:10px;bottom:12px">{btn(K, "Entrar no close · R$ 19,90", "cta", 32, 11, 200)}</div>', w=220, h=390)
    b = frame(f'<div style="padding:20px 16px;text-align:center"><div style="font:800 11px Gabarito;color:#fff">live hoje</div><div class="d num" style="font-size:64px;color:#fff;margin-top:6px">20:00</div>'
              f'<div style="display:flex;justify-content:center;margin:18px 0 12px">{foto("selfie", 110, 110, 55, "50% 20%", extra="border:3px solid #fff")}</div>'
              f'<div class="d" style="font-size:20px;color:#fff">com a Lara<br>Mendes</div></div>'
              f'<div style="position:absolute;left:12px;right:12px;bottom:14px">{btn(TEMAS["rosa"], "Avisar quando começar", "botao", 32, 11, 196)}</div>', w=220, h=390, bg=PINK)
    st = lambda n, t: f'<div style="flex:1;background:{G2};border-radius:12px;padding:10px"><b class="d num" style="font-size:22px;color:#fff">{n}</b><div style="font:600 8.5px Figtree;color:{G4};margin-top:2px">{t}</div></div>'
    c = frame(f'<div style="padding:22px 14px;text-align:center">{sym("preto", 70)}<div class="d" style="font-size:24px;color:#fff;margin-top:14px">A live<br>acabou.</div>'
              f'<div style="font:500 10px Figtree;color:{G4};margin-top:6px">e o replay já está no close.</div>'
              f'<div style="display:flex;gap:8px;margin-top:18px">{st("1,2 mil", "assistiram")}{st("87", "closes novos")}</div></div>'
              f'<div style="position:absolute;left:12px;right:12px;bottom:14px">{btn(K, "Ver replay", "cta", 32, 11, 196)}</div>', w=220, h=390, extra="border:1px solid #333;")
    cells = "".join(f'<div>{x}<div class="cap" style="color:#fff">{t}</div></div>' for x, t in ((b, "Antes · convite rosa"), (a, "Durante · tela da live"), (c, "Depois · resumo e replay")))
    page("Lives", f'<div class="row" style="margin-top:14px;gap:16px">{cells}<div style="max-width:260px;font:500 11px/1.6 Figtree;color:#E6E6E6">'
         f'Comentários e contador em bloco sólido, nunca soltos sobre o vídeo. O selo AO VIVO é o único rosa da tela; o botão de entrar fica fixo embaixo. '
         f'No fim, o símbolo no preto e o replay.</div></div>', "preto",
         "A live da criadora em três momentos: convite, transmissão e resumo.", part="06")


def p_figurinhas():
    def st(kind):
        if kind == "novo":
            return f'<div style="position:relative;width:84px;height:84px;display:flex;align-items:center;justify-content:center">{svg(M.macia(PINK, 40, dot=False), "5 5 90 90", 84)}<b class="d" style="position:absolute;font-size:16px;color:#fff">NOVO</b></div>'
        if kind == "close":
            return tk("✓ no close", WHITE, BLACK, 17)
        if kind == "bio":
            return tk("link na bio ↑", PINK, WHITE, 17)
        if kind == "pix":
            return tk("pago no Pix ✓", BLACK, WHITE, 17)
        if kind == "preco":
            return f'<div style="background:#fff;color:{BLACK};border-radius:10px;padding:8px 14px;position:relative;font:900 22px Gabarito;letter-spacing:-.03em"><span class="num" style="color:{DEEP}">R$ 19,90</span><i style="position:absolute;left:-5px;top:50%;margin-top:-5px;width:10px;height:10px;border-radius:50%;background:{G1}"></i></div>'
        if kind == "live":
            return f'<span class="selo" style="background:{PINK};color:#fff;height:26px;font-size:13px;padding:0 12px"><i style="width:8px;height:8px;border-radius:50%;background:#fff;display:inline-block;margin-right:5px"></i>AO VIVO</span>'
        if kind == "dentro":
            return tk("tá dentro!", PINK, WHITE, 22)
        if kind == "ring":
            return f'<div style="position:relative;width:84px;height:84px">{svg(M.RING["carregando"][3](WHITE, WHITE), "5 5 90 90", 84)}<div class="d" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:20px;color:#fff">24h</div></div>'
        if kind == "verif":
            return f'<div style="display:flex;align-items:center;gap:7px;background:#fff;border-radius:999px;padding:5px 12px 5px 6px;font:800 11px Gabarito;color:{BLACK}">{sym("branco", 24, None)}criadora verificada</div>'
        if kind == "mencao":
            return tk("@laramendes", PURPLE, WHITE, 18)
        if kind == "cont":
            return f'<div style="background:#fff;border-radius:12px;padding:8px 14px;text-align:center;color:{BLACK}"><b class="d num" style="font-size:24px;color:{DEEP}">3,2 mil</b><div style="font:700 9px Figtree">no close da Lara</div></div>'
        if kind == "acha":
            return f'<div style="display:flex;align-items:center;gap:8px">{tk("me acha no close", WHITE, BLACK, 15)}<span style="font:900 22px Gabarito;color:#fff">↗</span></div>'
        return tk("18+", BLACK, WHITE, 18, "border:1.5px solid #fff;")
    fundos = {"novo": WHITE, "close": PINK, "bio": G1, "pix": PURPLE, "preco": G1, "live": G1, "dentro": G1, "ring": PURPLE, "verif": G1, "mencao": WHITE, "cont": G1, "acha": PINK}
    tiles = "".join(f'<div style="height:112px;border-radius:14px;background:{bg};display:flex;align-items:center;justify-content:center;{"border:1px solid #333;" if bg == G1 else ""}">{st(k)}</div>'
                    for k, bg in fundos.items())
    page("Figurinhas e selos", f'<div class="grid" style="grid-template-columns:repeat(4,1fr);gap:12px;margin-top:14px">{tiles}</div>'
         f'<div style="font:500 11px/1.6 Figtree;color:#E6E6E6;margin-top:14px;max-width:760px">Vão em stories, vídeo e live como figurinha de imagem (PNG com fundo transparente, 512 px). Sempre em bloco sólido; uma ou duas por tela. '
         f'No GIF, só o bloco anima (entra com um pulo curto); a estrela gira uma vez no “NOVO”.</div>', "preto",
         "Doze figurinhas prontas para a criadora e para o social da Clozzy.", part="06")


def p_capas():
    x = (f'<div style="width:600px;height:200px;border-radius:12px;overflow:hidden;display:flex;border:1px solid {L2}">{foto("selfie", 150, 200, 0, "50% 18%")}{foto("cafe", 150, 200, 0, "40% 25%")}'
         f'<div style="flex:1;background:{BLACK};padding:16px;position:relative"><div>{lock("preto", 15, None)}</div><div class="d" style="font-size:26px;color:#fff;margin-top:22px">Seu close,<br><span style="color:{PINK}">seu preço.</span></div></div></div>')
    yt = (f'<div style="width:600px;height:100px;border-radius:12px;overflow:hidden;background:{PINK};display:flex;align-items:center;justify-content:center;gap:16px">{sym("rosa", 64, None)}'
          f'<div class="d" style="font-size:28px;color:#fff">Seu close, seu preço.</div></div>')
    th1 = (f'<div style="position:relative">{foto("dupla", 300, 169, 12, "50% 28%")}<div style="position:absolute;left:12px;top:12px">{stamp(11)}</div>'
           f'<div style="position:absolute;left:12px;bottom:14px">{tkl([("tutorial", WHITE, BLACK), ("passo a passo", PINK, WHITE)], 20, 3)}</div></div>')
    th2 = (f'<div style="width:300px;height:169px;border-radius:12px;background:{PURPLE};padding:14px;position:relative"><div>{lock("roxo", 12, None)}</div>'
           f'<div class="d" style="font-size:30px;color:#fff;margin-top:20px">Abra o<br>seu close.</div><div style="position:absolute;right:12px;bottom:12px;width:70px;height:70px;border-radius:50%;overflow:hidden;border:3px solid #fff">{foto("setup", 70, 70, 35, "40% 25%", extra="background-size:300%")}</div></div>')
    wa = (f'<div style="width:96px;height:96px;border-radius:50%;overflow:hidden">{tile("rosa", 96, None, 0)}</div>')
    page("Capas e banners", f'<div class="row" style="margin-top:14px;gap:30px"><div><div class="lbl">X · cabeçalho 3:1</div>{x}<div class="lbl" style="margin-top:18px">YouTube · banner (zona central 6:1)</div>{yt}'
         f'<div class="lbl" style="margin-top:18px">Capas de vídeo 16:9</div><div class="row" style="gap:12px">{th1}{th2}</div></div>'
         f'<div><div class="lbl">Foto de perfil</div><div style="display:flex;gap:12px">{wa}<div style="width:96px;height:96px;border-radius:50%;overflow:hidden">{tile("preto", 96, M.MAIN_RING, 0)}</div></div>'
         f'<div class="cap" style="max-width:210px">Corte em círculo; a marca a 60% da largura. Rosa para a conta principal, preto com anel para campanhas.</div></div></div>',
         "branco", "Cabeçalhos, banners e capas de vídeo. Foto da criadora ou cor sólida; a frase da marca em uma linha.", part="06")


# ------------------------------------------------------------------------------------------------ 07 · mídia e parcerias
def p_convite():
    W = TEMAS["branco"]
    bub = lambda txt, me=False: (f'<div style="display:flex;justify-content:{"flex-end" if me else "flex-start"};margin-top:6px"><div style="max-width:158px;padding:8px 10px;border-radius:14px;'
                                 f'background:{DEEP if me else L1};color:{"#fff" if me else BLACK};font:500 9.5px/1.4 Figtree">{txt}</div></div>')
    chat = (f'<div style="display:flex;align-items:center;gap:8px;padding:6px 12px;border-bottom:1px solid {L2}">{tile("rosa", 28, None, 14)}<div><b style="font:800 11px Gabarito">clozzy</b><div style="font:600 8px Figtree;color:{L3}">conta verificada</div></div></div>'
            f'<div style="padding:4px 12px">{bub("oi, Lara! vimos seus vídeos e amamos 💗")}{bub("você já pensou em abrir seu close na Clozzy? você define o preço e recebe no Pix.")}{bub("como funciona?", True)}'
            f'{bub("é só entrar pelo link, escolher o preço e postar. o convite vale por 7 dias:")}'
            f'<div style="margin-top:6px;width:170px;border-radius:12px;overflow:hidden;border:1px solid {L2}">{foto("setup", 170, 86, 0)}<div style="padding:7px 9px;background:#fff"><b style="font:800 10px Gabarito">Abra o seu close</b><div style="font:500 8.5px Figtree;color:{L3}">clozzy.com.br/entrar/lara</div></div></div></div>'
            f'<div style="position:absolute;left:10px;right:10px;bottom:12px;border:1.5px solid {L2};border-radius:999px;padding:7px 12px;font:500 9px Figtree;color:{L3}">Mensagem…</div>')
    card = (f'<div style="width:330px;height:330px;border-radius:16px;overflow:hidden;background:{PURPLE};position:relative">{foto("setup", 330, 190, 0, "40% 28%")}'
            f'<div style="position:absolute;left:12px;top:12px">{stamp(12)}</div><div style="padding:14px 16px"><div class="d" style="font-size:28px;color:#fff">Lara, seu close<br>tá esperando.</div>'
            f'<div style="margin-top:12px">{btn(TEMAS["roxo"], "Abrir meu close", "botao", 30, 11)}</div></div></div>')
    link = (f'<div style="width:240px;padding:16px;border-radius:16px;border:1.5px solid {L2};text-align:center"><div style="font:800 12px Gabarito">Convite da Lara</div>'
            f'<div style="margin:10px auto;background:#fff;border:1px solid {L2};border-radius:10px;padding:8px;display:inline-block">{qr(110)}</div>'
            f'<div class="num" style="font:800 12px Gabarito;color:{DEEP}">clozzy.com.br/entrar/lara</div><div style="font:500 9.5px Figtree;color:{L3};margin-top:4px">vale por 7 dias · uso único</div></div>')
    page("Convite para criadoras", f'<div class="row" style="margin-top:12px;gap:30px">{phone(chat, W, 232, 470)}<div><div class="lbl">Card de convite 1:1</div>{card}</div>'
         f'<div><div class="lbl">Link e QR do convite</div>{link}<div style="font:500 10.5px/1.55 Figtree;color:{L3};margin-top:12px;max-width:240px">Mesma mensagem por DM, WhatsApp e e-mail. Tom de amiga, sem pressão e sem promessa de ganho.</div></div></div>',
         "branco", "Como a Clozzy chama uma criadora: mensagem, card e link com QR.", part="07")


def p_midiakit():
    stat = lambda n, t: f'<div style="flex:1;text-align:center"><b class="d num" style="font-size:20px;color:{DEEP}">{n}</b><div style="font:600 8px Figtree;color:{L3}">{t}</div></div>'
    a4 = (f'<div style="width:300px;height:424px;background:#fff;border:1px solid {L2};border-radius:6px;overflow:hidden;position:relative;box-shadow:0 2px 0 rgba(0,0,0,.05)">'
          f'<div style="position:relative">{foto("selfie", 300, 130, 0, "50% 20%")}<div style="position:absolute;left:12px;top:12px">{stamp(11)}</div></div>'
          f'<div style="padding:10px 16px"><div class="d" style="font-size:26px;color:{BLACK}">Lara Mendes</div><div style="font:600 10px Figtree;color:{L3}">@laramendes · dança, rotina e bastidor</div>'
          f'<div style="display:flex;margin-top:12px;padding:8px 0;border-top:1px solid {L2};border-bottom:1px solid {L2}">{stat("48,2 mil", "seguidores")}{stat("3,2 mil", "no close")}{stat("7,4%", "engajamento")}</div>'
          f'<table style="margin-top:8px;font-size:10px"><tr><td>Close mensal</td><td class="num" style="text-align:right;font-weight:800">R$ 19,90</td></tr><tr><td>Pack avulso</td><td class="num" style="text-align:right;font-weight:800">R$ 7,90</td></tr>'
          f'</table></div>'
          f'<div style="position:absolute;left:16px;right:16px;bottom:14px;display:flex;justify-content:space-between;align-items:flex-end">{lock("branco", 16, None)}<div style="padding:4px;border:1px solid {L2};border-radius:6px">{qr(46)}</div></div></div>')
    res = (f'<div style="width:300px;height:300px;border-radius:16px;background:{BLACK};padding:18px;position:relative">{lock("preto", 14, None)}'
           f'<div style="font:600 10px Figtree;color:{G4};margin-top:22px">Novembro · Lara Mendes</div><div class="d num" style="font-size:52px;color:#fff;margin-top:4px">R$ 4.812</div>'
           f'<div style="font:600 10px Figtree;color:{G4}">3.214 pessoas no close</div>'
           f'<div style="display:flex;align-items:flex-end;gap:5px;height:60px;margin-top:18px">' + "".join(f'<i style="flex:1;height:{h}%;border-radius:3px 3px 0 0;background:{PINK if k == 6 else G3}"></i>' for k, h in enumerate((30, 45, 38, 60, 52, 80, 100))) + '</div></div>')
    selos_ = (f'<div style="display:flex;gap:14px;align-items:center">{tile("rosa", 74, None)}<div style="display:flex;align-items:center;gap:7px;background:{BLACK};border-radius:999px;padding:6px 14px 6px 8px;font:800 12px Gabarito;color:#fff">{sym("preto", 28, None)}criadora verificada</div></div>')
    page("Mídia kit e resultado da criadora", f'<div class="row" style="margin-top:12px;gap:30px">{a4}<div><div class="lbl">Cartão de resultado do mês (1:1, para stories)</div>{res}</div>'
         f'<div><div class="lbl">Selo para a bio</div>{selos_}<div style="font:500 10.5px/1.6 Figtree;color:{L3};margin-top:14px;max-width:260px">Mídia kit em A4 retrato, gerado pelo app com os números da própria criadora. O cartão de resultado só mostra o que ela autorizar.</div></div></div>',
         "branco", "O que a criadora leva para marcas e para os seguidores: mídia kit, resultado do mês e selo.", part="07")


def p_kit():
    def tl_(inner, bg, cap, h=200):
        return (f'<div><div style="height:{h}px;border-radius:16px;background:{bg};display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;{"border:1px solid #333;" if bg == BLACK else ""}">{inner}</div>'
                f'<div class="cap" style="color:#E6E6E6">{cap}</div></div>')
    caixa = (f'<div style="width:190px;height:130px;background:{PINK};border-radius:8px;position:relative;box-shadow:8px 8px 0 {DEEP}"><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">{sym("rosa", 84, None)}</div>'
             f'<div style="position:absolute;left:0;right:0;bottom:-18px;text-align:center;font:800 10px Gabarito;color:#fff"></div></div>')
    carta = (f'<div style="width:150px;height:180px;background:#fff;border-radius:6px;padding:14px;transform:rotate(-4deg);box-shadow:0 3px 0 rgba(0,0,0,.2)">{sym("branco", 22, None)}'
             f'<div class="d" style="font-size:22px;color:{BLACK};margin-top:12px">bem-vinda<br>ao close,<br><span style="color:{DEEP}">Lara.</span></div><div style="font:500 8px/1.4 Figtree;color:{L3};margin-top:10px">Seu kit chegou. Grava, posta e marca a gente 💗</div></div>')
    ads = f'<div style="width:190px;height:150px;background:#fff;border-radius:10px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:12px">' + "".join(f'<div style="border-radius:50%;background:{bg};display:flex;align-items:center;justify-content:center;aspect-ratio:1">{sym(v, 30, None)}</div>' for bg, v in ((PINK, "rosa"), (BLACK, "preto"), (PURPLE, "roxo"), (DEEP, "deep"), (WHITE, "branco"), (PINK, "rosa"))) + '</div>'
    ring = (f'<div style="width:130px;height:130px;border-radius:50%;border:14px solid #fff;display:flex;align-items:center;justify-content:center">{sym("roxo", 38, None)}</div>'
            f'<div style="position:absolute;bottom:0;left:50%;width:6px;height:40px;background:#fff;margin-left:-3px"></div>')
    pulseira = ("".join(f'<span style="width:22px;height:22px;border-radius:50%;background:{c};display:inline-block;margin:2px">{""}</span>' for c in (PINK, WHITE, PURPLE, WHITE, PINK, WHITE, PURPLE, WHITE, PINK))
                + f'<span style="display:inline-block;margin:0 2px;vertical-align:-6px">{svg(M.macia(PINK, 40), "5 5 90 90", 30)}</span>')
    cartao = (f'<div style="width:170px;height:106px;border-radius:10px;background:{BLACK};padding:12px;position:relative;border:1px solid #333">{lock("preto", 14, None)}'
              f'<div style="position:absolute;right:12px;bottom:12px;background:#fff;padding:4px;border-radius:6px">{qr(40)}</div><div style="font:700 8px/1.4 Figtree;color:#fff;position:absolute;left:12px;bottom:12px">seu link<br>de criadora</div></div>')
    cells = (tl_(caixa, G2, "Caixa rosa com o símbolo, fecho com fita preta") + tl_(carta, PURPLE, "Carta de boas-vindas, Gabarito 900") + tl_(ads, G1, "Cartela de adesivos redondos")
             + tl_(ring, PINK, "Ring light de bolso com a estrela") + tl_(f'<div style="text-align:center;padding:0 10px">{pulseira}</div>', G2, "Pulseira de contas, estrela rosa") + tl_(cartao, PURPLE, "Cartão com QR do perfil"))
    page("Kit de boas-vindas da criadora", f'<div class="grid" style="grid-template-columns:repeat(3,1fr);gap:14px;margin-top:14px">{cells}</div>'
         f'<div style="font:500 11px/1.6 Figtree;color:#E6E6E6;margin-top:8px;max-width:800px">Enviado na primeira venda. Sem papel de seda branco nem fita colorida: caixa rosa, carta no branco e itens nas cores da marca. A criadora é convidada a filmar a abertura, e o kit foi pensado para isso.</div>',
         "preto", "O kit que a criadora recebe e abre em vídeo. Peça de parceria e de divulgação ao mesmo tempo.", part="07")


def p_slides():
    def sl(inner, bg, ex=""):
        return f'<div style="width:316px;height:178px;border-radius:10px;overflow:hidden;position:relative;background:{bg};{ex}">{inner}</div>'
    s1 = sl(f'<div style="padding:18px"><div>{lock("preto", 14, None)}</div><div class="d" style="font-size:34px;color:#fff;margin-top:34px">Seu close,<br><span style="color:{PINK}">seu preço.</span></div></div>', BLACK)
    s2 = sl(f'<div style="padding:18px"><div style="font:800 11px Gabarito;color:#fff">Criadoras ativas</div><div class="d num" style="font-size:68px;color:#fff;margin-top:14px">12 mil</div></div><div style="position:absolute;right:16px;bottom:14px">{sym("rosa", 44, None)}</div>', PINK)
    s3 = sl(f'<div style="display:flex;height:100%"><div style="flex:1;padding:18px"><div style="font:800 10px Gabarito;color:{DEEP}">case</div><div class="d" style="font-size:22px;color:{BLACK};margin-top:8px">Lara abriu o close<br>em outubro.</div>'
            f'<div class="d num" style="font-size:34px;color:{DEEP};margin-top:14px">R$ 4.812</div><div style="font:600 9px Figtree;color:{L3}">no primeiro mês</div></div>{foto("selfie", 120, 178, 0, "50% 20%")}</div>', WHITE, f"border:1px solid {L2};")
    s4 = sl(f'<div style="padding:18px"><div style="font:800 11px Gabarito;color:#EBE3FA">Para criadoras</div><div class="d" style="font-size:26px;color:#fff;margin-top:10px">Abra o seu<br>close em<br>3 passos.</div></div><div style="position:absolute;right:14px;bottom:14px">{sym("roxo", 56)}</div>', PURPLE)
    st_ = lambda n, t: f'<div style="flex:1;border-radius:10px;background:{G2};padding:10px"><b class="d num" style="font-size:22px;color:{PINK}">{n}</b><div style="font:700 10px Gabarito;color:#fff;margin-top:4px">{t}</div></div>'
    s5 = sl(f'<div style="padding:18px"><div class="d" style="font-size:20px;color:#fff">Como funciona</div><div style="display:flex;gap:8px;margin-top:16px">{st_(1, "Escolhe")}{st_(2, "Paga no Pix")}{st_(3, "Tá dentro")}</div></div>', BLACK)
    s6 = sl(f'<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">{sym("branco", 54, None)}<div class="d" style="font-size:22px;color:{BLACK};margin-top:10px">Obrigada.</div><div style="font:600 10px Figtree;color:{L3};margin-top:3px">parcerias@clozzy.com.br</div></div>', WHITE, f"border:1px solid {L2};")
    cells = "".join(f'<div>{x}<div class="cap">{t}</div></div>' for x, t in ((s1, "Capa · preto"), (s2, "Número · rosa"), (s3, "Case · branco com foto"), (s4, "Para criadoras · roxo"), (s5, "Passo a passo · preto"), (s6, "Fecho · branco")))
    page("Apresentações", f'<div class="grid" style="grid-template-columns:repeat(3,316px);gap:14px 18px;margin-top:14px">{cells}</div>', "branco",
         "Slides 16:9 para parceiros, marcas e imprensa. Uma cor por slide; foto só no case.", part="07")


# ------------------------------------------------------------------------------------------------ 08 · físico e eventos
def p_brindes():
    def it(inner, bg, cap):
        return (f'<div><div style="height:176px;border-radius:14px;background:{bg};display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;{"border:1px solid #E6E6E6;" if bg == WHITE else ""}">{inner}</div><div class="cap">{cap}</div></div>')
    ring = (f'<div style="width:112px;height:112px;border-radius:50%;border:12px solid #fff;display:flex;align-items:center;justify-content:center">{sym("rosa", 34, None)}</div>'
            f'<div style="position:absolute;bottom:0;left:50%;width:8px;height:36px;background:#fff;margin-left:-4px"></div>')
    case = (f'<div style="width:84px;height:156px;border-radius:18px;background:{PINK};position:relative;display:flex;align-items:center;justify-content:center;box-shadow:5px 5px 0 {DEEP}">{sym("rosa", 54, None)}'
            f'<div style="position:absolute;left:8px;top:8px;width:30px;height:30px;border-radius:9px;background:{BLACK}"></div></div>')
    copo = (f'<div style="position:relative;width:76px;height:150px"><div style="position:absolute;left:0;right:0;top:12px;bottom:0;background:{PINK};border-radius:6px 6px 14px 14px;display:flex;align-items:center;justify-content:center">{sym("rosa", 44, None)}</div>'
            f'<div style="position:absolute;left:-2px;right:-2px;top:0;height:16px;background:#fff;border-radius:6px"></div><div style="position:absolute;left:46px;top:-26px;width:7px;height:48px;background:{BLACK};transform:rotate(12deg)"></div></div>')
    hood = (f'<svg viewBox="0 0 200 190" width="190" height="180"><path d="M60 14 L36 24 L4 60 L20 118 L44 108 L44 184 L156 184 L156 108 L180 118 L196 60 L164 24 L140 14 Q100 40 60 14Z" fill="{BLACK}"/>'
            f'<path d="M72 18 Q100 50 128 18 Q116 2 100 2 Q84 2 72 18Z" fill="#222"/><g transform="translate(76 88) scale(.48)">{M.mark(V["preto"], M.MAIN_RING)}</g></svg>')
    bone = (f'<svg viewBox="0 0 200 130" width="190" height="124"><path d="M20 90 Q20 20 100 18 Q180 20 180 90 Z" fill="{PURPLE}"/><path d="M12 90 H196 Q196 110 160 112 H60 Q16 112 12 90Z" fill="#5E34A0"/>'
            f'<g transform="translate(76 34) scale(.5)">{M.mark(V["roxo"], None)}</g></svg>')
    mouse = (f'<div style="width:190px;height:116px;border-radius:12px;background:{BLACK};display:flex;align-items:center;justify-content:center;gap:12px;box-shadow:4px 4px 0 {PINK}">{sym("preto", 70)}{lock("preto", 22, None)}</div>')
    cells = (it(ring, PINK, "Ring light de mesa") + it(case, WHITE, "Capinha de celular") + it(copo, PURPLE, "Copo com canudo")
             + it(hood, PINK, "Moletom preto") + it(bone, WHITE, "Boné roxo") + it(mouse, G2, "Mousepad"))
    page("Brindes de criadora", f'<div class="grid" style="grid-template-columns:repeat(3,1fr);gap:14px;margin-top:14px">{cells}</div>', "branco",
         "Itens que a criadora usa na rotina de gravar. A estrela sozinha basta; no tecido escuro, branca ou rosa.", part="08")


def p_evento():
    wall = (f'<div style="width:470px;height:250px;border-radius:12px;background:{PINK};position:relative;overflow:hidden;display:grid;grid-template-columns:repeat(8,1fr);align-content:space-around;padding:6px">'
            + "".join(f'<div style="display:flex;justify-content:center">{svg(M.macia(WHITE if (i + i // 8) % 3 == 0 else DEEP, 34), "5 5 90 90", 30)}</div>' for i in range(40))
            + f'<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:{BLACK};border-radius:14px;padding:16px 24px">{lock("preto", 40)}</div></div>')
    badge = lambda bg, fg, role, name, tema: (f'<div style="width:128px;height:190px;border-radius:12px;background:{bg};position:relative;text-align:center;color:{fg};{"border:1px solid #D0D0D0;" if bg == WHITE else ("border:1px solid #444;" if bg == BLACK else "")}">'
                                              f'<div style="width:36px;height:8px;border-radius:4px;background:{G1 if bg != BLACK else "#333"};margin:8px auto 0"></div><div style="margin-top:14px">{sym(tema, 54, None)}</div>'
                                              f'<div class="d" style="font-size:19px;margin-top:10px">{name}</div><div style="font:800 9px Figtree;margin-top:2px">{role}</div>'
                                              f'<div style="position:absolute;left:0;right:0;bottom:10px;font:600 7.5px Figtree;opacity:.8">clozzy · close day 2026</div></div>')
    bds = badge(PURPLE, WHITE, "CRIADORA", "Lara", "roxo") + badge(BLACK, WHITE, "CONVIDADA", "Mel", "preto") + badge(WHITE, BLACK, "EQUIPE", "Ana", "branco")
    totem = (f'<div style="width:96px;height:300px;border-radius:12px;background:{BLACK};padding:10px;text-align:center;border:1px solid #333">{sym("preto", 66)}'
             f'<div class="d" style="font-size:15px;color:#fff;margin-top:10px">grava<br>aqui.</div><div style="background:#fff;border-radius:8px;padding:5px;margin-top:14px;display:inline-block">{qr(58)}</div>'
             f'<div style="font:700 8px/1.3 Figtree;color:{G4};margin-top:8px">escaneia e entra no close</div></div>')
    neon = (f'<div style="width:230px;height:84px;border:3px solid #fff;border-radius:14px;display:flex;align-items:center;justify-content:center;background:{BLACK}"><div class="d" style="font-size:30px;color:#fff">seu close.</div></div>'
            f'<div class="cap" style="color:#E6E6E6;margin-top:8px">Letreiro: contorno branco, texto Gabarito 900. Sem neon colorido.</div>')
    pulseira = (f'<div style="width:240px;height:34px;border-radius:6px;background:{PINK};display:flex;align-items:center;justify-content:space-around;padding:0 10px">{sym("rosa", 22, None)}<b class="d" style="font-size:13px;color:#fff">close day</b>{sym("rosa", 22, None)}</div>')
    page("Evento e pop-up", f'<div class="row" style="margin-top:14px;gap:22px"><div><div class="lbl" style="color:#fff">Parede de fotos</div>{wall}'
         f'<div class="cap" style="color:#E6E6E6">Rosa com estrelas em branco e Pink Deep, selo preto no centro. Criadora filma na frente.</div>'
         f'<div class="lbl" style="color:#fff;margin-top:18px">Pulseira</div>{pulseira}</div>'
         f'<div><div class="lbl" style="color:#fff">Credenciais</div><div class="row" style="gap:10px">{bds}</div><div style="margin-top:20px">{neon}</div></div>'
         f'<div><div class="lbl" style="color:#fff">Totem</div>{totem}</div></div>', "preto",
         "Close Day: o evento de criadoras. Parede para foto, credenciais por papel, totem com QR e pulseira.", part="08")


def p_ooh():
    pole = lambda w: f'<div style="width:{w}px;height:34px;background:#999;margin:0 auto"></div>'
    outdoor = (f'<div style="width:560px;background:#111;padding:8px;border-radius:6px"><div style="width:544px;height:181px;display:flex;overflow:hidden;background:{PINK}">{foto("solpor", 181, 181, 0, "50% 38%")}'
               f'<div style="flex:1;padding:16px;position:relative;background:{PINK}"><div>{lock("rosa", 17, None)}</div><div class="d" style="font-size:36px;color:#fff;margin-top:24px">Seu close,<br>seu preço.</div>'
               f'<div style="position:absolute;right:14px;bottom:14px">{tk("baixe o app", WHITE, BLACK, 13)}</div></div></div></div>{pole(14)}')
    ponto = (f'<div style="width:150px;padding:6px;background:#111;border-radius:6px"><div style="width:138px;height:210px;position:relative;overflow:hidden">{foto("selfie", 138, 210, 0)}'
             f'<div style="position:absolute;left:8px;top:8px">{stamp(9)}</div><div style="position:absolute;left:8px;bottom:10px">{tkl([("o exclusivo de", WHITE, BLACK), ("quem você segue", PINK, WHITE)], 11, 3)}</div></div></div>{pole(8)}')
    bus = (f'<div style="width:560px;height:96px;border-radius:12px;background:{BLACK};position:relative;overflow:hidden;display:flex;align-items:center;padding:0 22px;gap:18px;border:1px solid #D0D0D0">{sym("preto", 62)}'
           f'<div class="d" style="font-size:30px;color:#fff;flex:1">Seu close, <span style="color:{PINK}">seu preço.</span></div>{tk("clozzy.com.br", PINK, WHITE, 14)}'
           f'<div style="position:absolute;left:30px;right:30px;bottom:-10px;height:26px;display:flex;gap:30px">' + "".join(f'<i style="width:46px;height:30px;background:#cfd8e0;border-radius:4px"></i>' for _ in range(7)) + '</div></div>'
           f'<div style="display:flex;gap:70px;margin:2px 0 0 60px"><i style="width:34px;height:34px;border-radius:50%;background:#222;display:block"></i><i style="width:34px;height:34px;border-radius:50%;background:#222;display:block"></i></div>')
    lambe = "".join(f'<div style="width:{w}px;height:{h}px;background:{bg};padding:8px;position:relative;border:1px solid rgba(0,0,0,.08)">{inner}</div>' for w, h, bg, inner in (
        (100, 140, BLACK, f'{sym("preto", 30)}<div class="d" style="font-size:19px;color:#fff;margin-top:12px">Só pro<br><span style="color:{PINK}">close.</span></div>'),
        (100, 140, PINK, f'<div style="display:flex;justify-content:center;margin-top:20px">{sym("rosa", 58, None)}</div><div class="d" style="font-size:15px;color:#fff;margin-top:12px;text-align:center">Pago no Pix.<br>Liberado<br>na hora.</div>'),
        (100, 140, PURPLE, f'<div class="d" style="font-size:19px;color:#fff;margin-top:6px">Abra o<br>seu close.</div><div style="position:absolute;left:8px;bottom:8px">{sym("roxo", 30, None)}</div>')))
    page("Mídia exterior", f'<div style="background:{L1};border-radius:16px;padding:20px 24px;margin-top:12px;display:flex;gap:30px;align-items:flex-start"><div><div class="lbl">Empena / outdoor 3:1</div>{outdoor}'
         f'<div class="lbl" style="margin-top:16px">Busdoor</div>{bus}</div><div><div class="lbl">Ponto de ônibus 4:6</div>{ponto}</div>'
         f'<div><div class="lbl">Lambe-lambe</div><div style="display:flex;flex-direction:column;gap:6px">{lambe}</div></div></div>', "branco",
         "Rua e transporte: foto da criadora e frase em bloco no outdoor e no ponto; só cor e símbolo no busdoor e no lambe.", part="07")


def p_checklist():
    grupos = [("Marca e cor", ["Fundo preto #000 ou branco #fff de verdade (nunca creme, nunca quase-preto)", "Só rosa, Pink Deep, roxo, preto, branco e cinzas neutros",
                               "Nada preto sobre rosa; rosa e roxo nunca um sobre o outro", "Ícone OU símbolo, nunca os dois; respiro de ¼ e tamanho mínimo",
                               "Palavra separada do símbolo; botão de compra em Pink Deep"]),
              ("Foto", ["Criadora de 18 a 22 anos, maior de idade e verificada, rosto à vista", "Luz clara, cor do cenário; sem filtro, sem degradê, sem escurecer",
                        "Texto sobre foto em bloco sólido; marca em pílula no canto de cima", "Conteúdo pago desfocado com a estrela, nunca tarjado"]),
              ("Voz", ["Frase curta, como a criadora fala; minúscula quando a rede pede", "Palavras da casa (close, pack, bora, tá dentro); nada de “sexy”, “nudes”, “privê”",
                       "No máximo um emoji da casa (💗 ✨ 🌸 🎀 ⭐)", "Nenhuma promessa de ganho"])]
    col = lambda t, itens: (f'<div><h3 style="color:#fff;font-size:14px;margin-bottom:6px">{t}</h3>' + "".join(
        f'<div style="display:flex;gap:9px;padding:6px 0;border-bottom:1px solid #2A2A2A;font:500 10.5px/1.4 Figtree;color:#E6E6E6"><span class="ok" style="background:{PINK};color:#fff;flex-shrink:0">✓</span>{i}</div>' for i in itens) + '</div>')
    files = [("../uso-da-marca-estrela-macia/tokens.css", "Variáveis por superfície (preto, branco, rosa, roxo)"), ("../uso-da-marca-estrela-macia/tokens.json", "Os mesmos papéis em JSON"),
             ("../identidade-estrela-macia/svg/", "Ícones, símbolos, lockups, app icons e loaders"), ("fotos/", "Sete fotos de criadoras (geradas por IA, 760 px)"),
             ("_build.py", "Gerador deste manual (reaproveita o do v1)")]
    fl = "".join(f'<div style="display:flex;gap:12px;font-size:10px;padding:5px 0;border-bottom:1px solid #2A2A2A"><code style="width:250px;color:{PINK}">{a}</code><span style="color:#E6E6E6">{b}</span></div>' for a, b in files)
    page("Checklist e arquivos", f'<div class="grid" style="grid-template-columns:repeat(3,1fr);gap:26px;margin-top:14px">' + "".join(col(t, i) for t, i in grupos) + '</div>'
         f'<div class="row" style="margin-top:26px;gap:40px;align-items:flex-end"><div style="flex:1">{fl}</div><div>{lock("preto", 48)}</div></div>', "preto", "Antes de publicar qualquer peça.", part="09")


# ------------------------------------------------------------------------------------------------ montagem
def build():
    p_capa()
    PAGES.append(None)       # sumário entra no fim, com os números reais
    parte("01", OB.p_marca, OB.p_protecao)
    parte("02", OB.p_cores, OB.p_superficies, OB.p_combinacoes, OB.p_tipo, OB.p_elementos)
    parte("03", p_foto_direcao, p_foto_marca, p_foto_tratamento, p_voz_tom, p_voz_texto)
    parte("04", OB.p_app, p_onboarding, OB.p_app_temas, p_componentes, OB.p_homescreen)
    parte("05", OB.p_landing, OB.p_landing_mobile, p_perfil_web, p_linkbio, p_preview)
    parte("06", p_posts, p_carrossel, p_stories, p_video, p_grade, p_live, p_figurinhas, p_capas, OB.p_perfil)
    parte("07", p_anuncios, OB.p_email, p_convite, p_midiakit, p_kit, p_ooh, p_slides)
    parte("08", OB.p_impressos, p_brindes, p_evento)
    parte("09", OB.p_erros, p_checklist)
    p_sumario_build()
    def doc(extra=""):
        return (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy · manual de uso da marca · Estrela macia · edição criadoras</title>'
                f'<style>{CSS}</style></head><body>{"".join(render(p, i + 1) for i, p in enumerate(PAGES))}{extra}</body></html>')

    def dump(extra):
        tmp = Path("/tmp/clozzy-criadoras-check.html")
        tmp.write_text(doc(extra))
        r = subprocess.run([OB.CHROME, "--headless", "--disable-gpu", "--dump-dom", "--virtual-time-budget=5000", tmp.as_uri()], capture_output=True, text=True)
        m = re.search(r'<pre id="ov">(.*?)</pre>', r.stdout, re.S)
        return m.group(1) if m else ""

    medir = ("<script>addEventListener('load',()=>{const out=[];document.querySelectorAll('.pg').forEach(pg=>{const w=pg.querySelector('.bz');if(!w){out.push('0 0 0 0');return}"
             "const pr=pg.getBoundingClientRect(),wr=w.getBoundingClientRect();let mr=wr.left,mb=wr.top;"
             "w.querySelectorAll('*').forEach(e=>{const b=e.getBoundingClientRect();if(!b.width&&!b.height)return;const c=getComputedStyle(e);if(e.children.length&&c.backgroundColor=='rgba(0, 0, 0, 0)'&&c.backgroundImage=='none'&&!parseFloat(c.borderTopWidth)&&!parseFloat(c.borderBottomWidth))return;mr=Math.max(mr,b.right);mb=Math.max(mb,b.bottom)});"
             "out.push([mr-wr.left,mb-wr.top,pr.right-60.5-wr.left,pr.bottom-62-wr.top].join(' '))});"
             "const p=document.createElement('pre');p.id='ov';p.textContent=out.join('\\n');document.body.appendChild(p)})</script>")
    ZOOMS.clear()
    for i, ln in enumerate(dump(medir).splitlines()):
        cw, ch, aw, ah = map(float, ln.split())
        if cw > 0 and ch > 0:
            z = min(aw / cw, ah / ch, 1.35) * .98
            if z > 1.06 and PAGES[i]["title"] not in NO_ZOOM:
                ZOOMS[i + 1] = int(z * 100) / 100
    OUT_HTML.write_text(doc())
    if os.environ.get("CHECK"):
        estoura = ("<script>addEventListener('load',()=>{const out=[];document.querySelectorAll('.pg').forEach((pg,i)=>{const r=pg.getBoundingClientRect();let hit=0;"
                   "pg.querySelectorAll('*').forEach(e=>{if(hit||e.closest('.foot,.nav'))return;const b=e.getBoundingClientRect();if(!b.width)return;"
                   "if(b.right>r.right-45||b.bottom>r.bottom-45){hit=1;out.push('p'+(i+1)+' '+e.tagName+' dir='+Math.round(b.right-r.right)+' baixo='+Math.round(b.bottom-r.bottom)+' '+(e.textContent||'').slice(0,24))}})});"
                   "const p=document.createElement('pre');p.id='ov';p.textContent=out.join('\\n');document.body.appendChild(p)})</script>")
        print(dump(estoura) or "sem estouro")
        print("zoom:", ZOOMS)
    subprocess.run([OB.CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer", "--virtual-time-budget=5000",
                    f"--print-to-pdf={OUT_PDF}", OUT_HTML.as_uri()], check=True, capture_output=True)
    print("pages", len(PAGES))


if __name__ == "__main__":
    build()

#!/usr/bin/env python3
"""Clozzy — design system · Estrela macia.

Junta o manual v2 (../uso-da-marca-estrela-macia-v2: um rosa só, Pink Deep #E0005A, fotos de criadoras) e a edição
criadoras (../uso-da-marca-estrela-macia-criadoras: componentes, texto em bloco sobre foto, voz e microtextos) num
documento de design system: tokens (cor, tipo, espaço, raio, borda, controle, movimento), componentes com estados,
padrões de tela, conteúdo e regras.

Uma fonte só: os dicionários de tokens abaixo geram as páginas E os arquivos tokens.css / tokens.json.
Rodar: python3 _build.py → design-system-clozzy.html + .pdf + tokens.css + tokens.json
       CHECK=1 python3 _build.py  → também lista elementos que estouram a página"""
import importlib.util, json, os, re, subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
MARCA = HERE.parent

_spec = importlib.util.spec_from_file_location("manual_v2", MARCA / "uso-da-marca-estrela-macia-v2" / "_build.py")
V2 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(V2)          # carrega o v1 e troca o rosa por Pink Deep
V1, M, IB = V2.V1, V2.M, V2.IB

DEEP, PURPLE, BLACK, WHITE = V2.DEEP, V2.PURPLE, V2.BLACK, V2.WHITE
PINK = DEEP                            # um rosa só
G1, G2, G3, G4, L1, L2, L3 = V1.G1, V1.G2, V1.G3, V1.G4, V1.L1, V1.L2, V1.L3
TEMAS, ORDER = V1.TEMAS, V1.ORDER
foto, btn, chip, selo, logo_app, phone, tabbar, ring_av = V2.foto, V2.btn, V2.chip, V2.selo, V2.logo_app, V2.phone, V2.tabbar, V2.ring_av
sym, lock, tile, svg, box = V2.sym, V2.lock, V2.tile, V2.svg, V2.box

OUT_HTML = HERE / "design-system-clozzy.html"
OUT_PDF = HERE / "design-system-clozzy.pdf"

# ================================================================ tokens (fonte única)
PRIMITIVAS = [  # token, nome, valor, uso
    ("pink-deep", "Pink Deep", DEEP, "A cor da marca. Compra, destaque, momento de cor."),
    ("roxo", "Roxo", PURPLE, "O lado da criadora: painel, convite, abrir o close."),
    ("preto", "Preto", BLACK, "Preto de verdade. Fundo principal do app."),
    ("branco", "Branco", WHITE, "Branco de verdade. Conta, ajuda, e-mail, site."),
]
CINZAS = [("cinza-1", G1, "superfície 2 no preto"), ("cinza-2", G2, "chip no preto"), ("cinza-3", G3, "linha no preto"),
          ("cinza-4", G4, "texto de apoio no preto"), ("claro-1", L1, "superfície 2 no branco"), ("claro-2", L2, "linha no branco"),
          ("claro-3", L3, "texto de apoio no branco")]
PAPEIS = [  # chave no TEMAS, token, descrição
    ("sup", "superficie", "Fundo da tela ou peça"), ("sup2", "superficie-2", "Card, campo, folha por cima do fundo"),
    ("linha", "linha", "Divisor, borda de campo, contorno"), ("titulo", "titulo", "Títulos e números grandes"),
    ("texto", "texto", "Texto corrido"), ("apoio", "apoio", "Legenda, data, rótulo"), ("destaque", "destaque", "Aba ativa, anel do close, link"),
    ("botao", "botao", "Botão primário"), ("botao_txt", "botao-texto", "Texto do botão primário"),
    ("cta", "compra", "Botão de compra (Entrar no close, Pix)"), ("cta_txt", "compra-texto", "Texto do botão de compra"),
    ("chip", "chip", "Chip, filtro, tag"),
]
TIPO = [  # token, família, peso, app px, web px, entrelinha, tracking (em), uso, exemplo
    ("display", "Gabarito", 900, 40, 64, .92, -.04, "Capa, abertura, hero da landing", "Seu close."),
    ("titulo-1", "Gabarito", 900, 28, 44, 1.02, -.03, "Título de tela e de seção", "Entrar no close"),
    ("titulo-2", "Gabarito", 800, 20, 28, 1.08, -.02, "Título de card e de modal", "Pack Noite de estreia"),
    ("titulo-3", "Gabarito", 800, 16, 18, 1.15, -.01, "Nome da criadora, item de lista", "Lara Mendes"),
    ("corpo", "Figtree", 400, 15, 17, 1.5, 0, "Texto corrido", "Tudo do perfil enquanto o close estiver ativo."),
    ("corpo-forte", "Figtree", 700, 15, 17, 1.5, 0, "Ênfase dentro do texto", "pago no Pix, liberado na hora"),
    ("apoio", "Figtree", 600, 13, 14, 1.4, 0, "Legenda, data, metadados", "há 12 min · 3,2 mil no close"),
    ("rotulo", "Figtree", 700, 11, 12, 1.2, 0, "Rótulo de campo, aba da tabbar", "Seu @"),
    ("botao", "Gabarito", 800, 15, 16, 1, -.01, "Texto de botão", "Entrar no close"),
    ("preco", "Gabarito", 900, 22, 28, 1, -.02, "Preço e saldo (sempre tabular)", "R$ 19,90"),
]
ESPACO = [("1", 2), ("2", 4), ("3", 6), ("4", 8), ("5", 12), ("6", 16), ("7", 24), ("8", 32), ("9", 48), ("10", 64)]
RAIO = [("xs", 6, "checkbox, amostra"), ("sm", 10, "campo pequeno, sticker"), ("md", 14, "card, foto, aviso"),
        ("lg", 18, "folha, painel, modal"), ("xl", 24, "capa de vídeo, ícone grande"), ("pilula", 999, "botão, chip, selo, avatar")]
BORDA = [("fina", 1, "divisor, card no preto"), ("padrao", 1.5, "campo, botão secundário"), ("foco", 2, "campo em foco, anel do avatar")]
CONTROLE = [("p", 32, "chip, botão pequeno"), ("m", 44, "botão e campo padrão (alvo de toque mínimo)"), ("g", 52, "botão de compra em tela cheia")]
MOVIMENTO = [("rapido", "120ms", "toque, troca de toggle, hover"), ("base", "200ms", "abrir aviso, trocar de aba"),
             ("lento", "320ms", "folha subindo, modal, tela nova"), ("carregando", "1200ms", "volta do anel carregando (loop)")]
CURVAS = [("padrao", "cubic-bezier(.2,0,0,1)", "entra e assenta"), ("saida", "cubic-bezier(.4,0,1,1)", "sai acelerando")]
SUP_NOMES = {"preto": "Preto", "branco": "Branco", "rosa": "Pink Deep", "roxo": "Roxo"}


def tokens_files():
    root = ";".join(f"--cz-{t}:{v}" for t, _n, v, _u in PRIMITIVAS) + ";\n  " + ";".join(f"--cz-{t}:{v}" for t, v, _u in CINZAS)
    root += ";\n  --cz-fonte-display:Gabarito,system-ui,sans-serif;--cz-fonte-texto:Figtree,system-ui,sans-serif;\n  "
    root += ";".join(f"--cz-tipo-{t}:{w} {a}px/{lh} {'var(--cz-fonte-display)' if fam == 'Gabarito' else 'var(--cz-fonte-texto)'}"
                     for t, fam, w, a, _wb, lh, _tr, _u, _e in TIPO) + ";\n  "
    root += ";".join(f"--cz-tracking-{t}:{tr}em" for t, _f, _w, _a, _wb, _lh, tr, _u, _e in TIPO if tr) + ";\n  "
    root += ";".join(f"--cz-esp-{k}:{v}px" for k, v in ESPACO) + ";\n  "
    root += ";".join(f"--cz-raio-{k}:{v}px" for k, v, _u in RAIO) + ";\n  "
    root += ";".join(f"--cz-borda-{k}:{v}px" for k, v, _u in BORDA) + ";\n  "
    root += ";".join(f"--cz-controle-{k}:{v}px" for k, v, _u in CONTROLE) + ";\n  "
    root += ";".join(f"--cz-dur-{k}:{v}" for k, v, _u in MOVIMENTO) + ";\n  "
    root += ";".join(f"--cz-curva-{k}:{v}" for k, v, _u in CURVAS) + ";\n  --cz-veu:rgba(0,0,0,.6)"
    css = ("/* Clozzy · design system · Estrela macia · gerado por _build.py — não editar à mão */\n"
           "/* Web: tamanhos de tipo maiores em telas ≥ 768px (media query no fim). */\n:root{" + root + "}\n")
    for t in ORDER:
        css += f'[data-tema="{t}"]{{' + ";".join(f"--{tk}:{TEMAS[t][k]}" for k, tk, _d in PAPEIS) + "}\n"
    css += ("@media (min-width:768px){:root{" + ";".join(
        f"--cz-tipo-{t}:{w} {wb}px/{lh} {'var(--cz-fonte-display)' if fam == 'Gabarito' else 'var(--cz-fonte-texto)'}"
        for t, fam, w, _a, wb, lh, _tr, _u, _e in TIPO) + "}}\n")
    (HERE / "tokens.css").write_text(css)
    data = {
        "cor": {t: v for t, _n, v, _u in PRIMITIVAS} | {t: v for t, v, _u in CINZAS},
        "superficies": {t: {tk: TEMAS[t][k] for k, tk, _d in PAPEIS} for t in ORDER},
        "fonte": {"display": "Gabarito", "texto": "Figtree"},
        "tipo": {t: {"familia": fam, "peso": w, "app": a, "web": wb, "entrelinha": lh, "tracking": tr, "uso": u}
                 for t, fam, w, a, wb, lh, tr, u, _e in TIPO},
        "espaco": {k: v for k, v in ESPACO}, "raio": {k: v for k, v, _u in RAIO}, "borda": {k: v for k, v, _u in BORDA},
        "controle": {k: v for k, v, _u in CONTROLE}, "duracao": {k: v for k, v, _u in MOVIMENTO},
        "curva": {k: v for k, v, _u in CURVAS}, "veu": "rgba(0,0,0,.6)",
    }
    (HERE / "tokens.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


# ================================================================ contraste (WCAG 2)
def _rgb(c, under=None):
    if isinstance(c, tuple):
        return c
    c = c.strip()
    if c.startswith("rgba"):
        r, g, b, a = [float(x) for x in re.findall(r"[\d.]+", c)]
        br, bg_, bb = _rgb(under)
        return (r * a + br * (1 - a), g * a + bg_ * (1 - a), b * a + bb * (1 - a))
    c = c.lstrip("#")
    return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))


def _lum(rgb):
    def ch(v):
        v /= 255
        return v / 12.92 if v <= .03928 else ((v + .055) / 1.055) ** 2.4
    r, g, b = (ch(x) for x in rgb)
    return .2126 * r + .7152 * g + .0722 * b


def ratio(fg, bg, base=None):
    b = _rgb(bg, base)
    a = _rgb(fg, b)
    la, lb = _lum(a), _lum(b)
    return (max(la, lb) + .05) / (min(la, lb) + .05)


# ================================================================ página
SECAO = [""]


def foot(n, t):
    dark = TEMAS[t]["sup"] != WHITE
    return (f'<div class="foot" style="color:{WHITE if dark else BLACK}"><span>Clozzy · design system · Estrela macia · {SECAO[0]}</span>'
            f'<span>{n:02d}</span></div>')


V1.foot = foot
page = V1.page
PAGES = V1.PAGES


def tag(txt, dark=False):
    return f'<code style="white-space:nowrap;font:700 9.5px ui-monospace,Menlo,monospace;color:{PINK if dark else DEEP}">{txt}</code>'


def spec_list(items, dark=False):
    c, ln = ("#E6E6E6", G3) if dark else ("#1A1A1A", L2)
    return "<div>" + "".join(f'<div style="display:flex;gap:10px;padding:5px 0;border-bottom:1px solid {ln};font:500 10px/1.4 Figtree;color:{c}">'
                   f'<span style="width:150px;flex-shrink:0">{tag(a, dark)}</span><span>{b}</span></div>' for a, b in items) + "</div>"


def flex(inner, gap=10, align="flex-start"):
    return f'<div style="display:flex;gap:{gap}px;align-items:{align}">{inner}</div>'


def sec(t, inner, dark=False):
    return f'<div><div class="lbl" style="{"color:#fff" if dark else ""}">{t}</div>{inner}</div>'


# ================================================================ abertura
def p_capa():
    SECAO[0] = "capa"
    pics = [("ringlight-sorriso", 190, 300), ("neon-selfie", 190, 300), ("danca-janela", 190, 300)]
    mini = (f'<div style="display:flex;gap:8px;align-items:center">{btn(TEMAS["preto"], "Entrar no close", "cta", 34, 12)}'
            f'{btn(TEMAS["preto"], "Ver perfil", "sec", 34, 12)}{chip(TEMAS["preto"], "dança", True)}{chip(TEMAS["preto"], "make")}{selo(TEMAS["preto"])}</div>')
    body = (f'<div style="display:flex;flex-direction:column;justify-content:space-between;height:100%">'
            f'<div style="display:flex;justify-content:space-between;align-items:flex-start">'
            f'<div><div class="lbl" style="color:{PINK};opacity:1">Estrela macia · v1.0 · nov 2026</div><h1 style="color:#fff">Design<br>system</h1>'
            f'<p class="lead" style="color:{G4};max-width:360px;margin-top:14px">Tokens, componentes e padrões para construir o app, a web e as peças da Clozzy '
            f'com a mesma cara. Um rosa só, o Pink Deep.</p><div style="margin-top:22px">{mini}</div></div>'
            f'<div style="display:flex;gap:12px">' + "".join(foto(a, w, h, 20, "50% 30%") for a, w, h in pics) + '</div></div>'
            f'<div style="display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:12mm">{lock("preto", 56)}'
            f'<div style="display:flex;gap:10px">{tile("rosa", 70, None)}{tile("preto", 70)}{tile("roxo", 70, None)}</div></div></div>')
    page(None, body, "preto")


ESTRUTURA = [  # seção, páginas (preenchido em build)
    ("Base", "Como ler, princípios"), ("Tokens", "Cor, contraste, tipografia, espaço, layout, movimento"),
    ("Marca e ícones", "A marca dentro do produto e o traço dos ícones"),
    ("Componentes", "Botões, chips, campos, avatares, cards, avisos, navegação, sobre foto"),
    ("Padrões", "Telas do app, temas, conteúdo e microtextos"), ("Regras", "Não fazer, tokens em código, checklist"),
]
TOC = []


def p_como_ler():
    SECAO[0] = "base"
    camadas = [("1", "Primitivas", "As cores, fontes e medidas cruas.", "--cz-pink-deep · --cz-esp-6"),
               ("2", "Papéis por superfície", "O que cada cor faz em cada fundo. O componente usa o papel, nunca a cor crua.", "--compra · --apoio"),
               ("3", "Componentes", "Botão, chip, campo, card. Montados só com papéis e medidas.", "botão de compra · chip ativo"),
               ("4", "Padrões", "Telas e peças inteiras. Montadas só com componentes.", "perfil · Pix · story")]
    cam = "".join(f'<div style="display:flex;gap:14px;padding:12px 0;border-bottom:1px solid {L2}"><span class="d num" style="font-size:34px;color:{DEEP};width:30px">{n}</span>'
                  f'<div><h3 style="font-size:15px">{t}</h3><div style="font:500 11px/1.5 Figtree;color:{L3};margin-top:3px">{d}</div>'
                  f'<div style="margin-top:4px">{tag(e)}</div></div></div>' for n, t, d, e in camadas)
    toc = "".join(f'<div style="display:flex;gap:10px;padding:5px 0;border-bottom:1px solid {L2};font:600 10.5px Figtree">'
                  f'<span class="num" style="color:{L3};width:22px">{n:02d}</span><span style="flex:1">{t}</span><span style="color:{L3}">{s}</span></div>' for n, t, s in TOC)
    page("Como ler este documento", f'<div class="row" style="margin-top:12px;gap:34px"><div style="flex:1">{cam}'
         f'<div style="font:500 10.5px/1.6 Figtree;color:{L3};margin-top:14px">A fonte de verdade é <b>tokens.css</b> / <b>tokens.json</b>, gerados pelo mesmo script deste PDF. '
         f'Se um valor daqui e do código discordarem, vale o arquivo de tokens.</div></div>'
         f'<div style="flex:1"><div class="lbl">Sumário</div>{toc}</div></div>', "branco",
         "Quatro camadas. Cada uma só usa a de baixo: assim trocar uma cor ou uma medida muda tudo junto.")


def p_principios():
    pr = [("Preto de verdade", "Fundo #000 e #fff, sem creme e sem quase-preto. Profundidade vem da superfície 2 e da linha, não de sombra."),
          ("Um rosa só", "Pink Deep #E0005A é o rosa da marca em qualquer fundo. Roxo é da criadora. Mais nenhuma cor, nem para status."),
          ("A superfície decide", "O componente pede um papel (compra, apoio, destaque) e a superfície entrega a cor. Nada de cor fixa no componente."),
          ("Foto clara, texto em bloco", "A foto da criadora não é escurecida nem filtrada. Texto por cima vai num bloco sólido; a marca, numa pílula."),
          ("Exclusivo, não explícito", "O close é o que fica no ar. Conteúdo pago aparece desfocado com a estrela; a voz é de amiga, nunca insinuação.")]
    cards = "".join(f'<div style="border-top:2px solid #fff;padding-top:12px"><span class="d num" style="font-size:30px;color:#fff">{i + 1:02d}</span>'
                    f'<h3 style="color:#fff;font-size:17px;margin-top:10px">{t}</h3><p style="font:500 11.5px/1.55 Figtree;color:rgba(255,255,255,.9);margin-top:8px">{d}</p></div>'
                    for i, (t, d) in enumerate(pr))
    page("Princípios", f'<div class="grid" style="grid-template-columns:repeat(5,1fr);gap:22px;margin-top:40px">{cards}</div>'
         f'<div style="position:absolute;right:16mm;bottom:20mm">{sym("rosa", 120)}</div>', "rosa",
         "Cinco decisões que explicam todas as outras. Quando o design system não cobrir um caso, decida por elas.")


# ================================================================ tokens
def p_cor_primitivas():
    SECAO[0] = "tokens"
    cards = "".join(f'<div><div style="height:150px;border-radius:14px;background:{v};{"border:1px solid #E6E6E6;" if v == WHITE else ""}"></div>'
                    f'<h3 style="margin-top:8px;font-size:15px">{n}</h3><div style="margin-top:3px">{tag("--cz-" + t)}</div>'
                    f'<div class="num" style="font:700 10px Figtree;margin-top:2px">{v} · RGB {" ".join(str(x) for x in _rgb(v))}</div>'
                    f'<div class="cap" style="margin-top:3px">{u}</div></div>' for t, n, v, u in PRIMITIVAS)
    greys = "".join(f'<div><div style="height:40px;border-radius:8px;background:{v};border:1px solid #E6E6E6"></div>'
                    f'<div style="margin-top:4px">{tag("--cz-" + t)}</div><div class="cap num" style="margin-top:1px">{v} · {u}</div></div>' for t, v, u in CINZAS)
    prop = (f'<div style="display:flex;height:22px;border-radius:8px;overflow:hidden;border:1px solid #E6E6E6;width:400px">'
            f'<i style="flex:60;background:{BLACK}"></i><i style="flex:10;background:{DEEP}"></i><i style="flex:25;background:{WHITE}"></i><i style="flex:5;background:{PURPLE}"></i></div>'
            f'<div class="cap">Numa tela típica: preto 60 · Pink Deep 10 · branco 25 · roxo 5 (Pink Deep e roxo nunca encostam)</div>')
    page("Cor · primitivas", f'<div class="grid" style="grid-template-columns:repeat(4,1fr);gap:16px;margin-top:14px">{cards}</div>'
         f'<div class="lbl" style="margin-top:18px">Cinzas neutros (só superfície 2, linha, chip e apoio; nunca azulados nem quentes)</div>'
         f'<div class="grid" style="grid-template-columns:repeat(7,1fr);gap:10px">{greys}</div>'
         f'<div style="margin-top:14px">{prop}</div>', "branco",
         "Quatro cores e sete cinzas. O rosa antigo saiu da paleta: não existe token para ele. Sem degradê, sem creme, sem cor de status.")


def p_cor_papeis():
    head = "<tr><th>Papel · token</th>" + "".join(f'<th>{SUP_NOMES[t]} · {tag(f"data-tema={t}", True)}</th>' for t in ORDER) + "</tr>"
    rows = "".join(f'<tr><td><b style="color:#fff">{tag("--" + tk, True)}</b><div style="font:500 8.5px Figtree;color:{G4};margin-top:1px">{d}</div></td>' + "".join(
        f'<td><i class="sw" style="background:{TEMAS[t][k]}"></i><span class="num" style="font-size:9px">{TEMAS[t][k]}</span></td>' for t in ORDER) + "</tr>"
        for k, tk, d in PAPEIS)
    page("Cor · papéis por superfície", f'<table style="color:#E6E6E6;margin-top:10px;font-size:10px">{head}{rows}</table>'
         f'<div class="cap" style="color:{G4};margin-top:10px">' + " · ".join(f'<b style="display:inline;color:#fff">{SUP_NOMES[t]}</b> {TEMAS[t]["uso"]}' for t in ORDER) + '</div>',
         "preto", "Cada superfície traz o mesmo conjunto de papéis. Troque o data-tema do contêiner e o componente se ajusta sozinho.")


def p_contraste():
    pares = [("Título", "titulo", "sup"), ("Texto", "texto", "sup"), ("Apoio", "apoio", "sup"), ("Destaque", "destaque", "sup"),
             ("Botão", "botao_txt", "botao"), ("Compra", "cta_txt", "cta"), ("Texto no card", "texto", "sup2")]
    head = "<tr><th>Par</th>" + "".join(f'<th>{SUP_NOMES[t]}</th>' for t in ORDER) + "</tr>"

    def cell(t, fg, bg):
        T = TEMAS[t]
        r = ratio(T[fg], T[bg], T["sup"])
        v, c = ("AAA", BLACK) if r >= 7 else (("AA", BLACK) if r >= 4.5 else (("AA grande", L3) if r >= 3 else ("não usar", DEEP)))
        bgc = _rgb(T[bg], T["sup"]) if T[bg].startswith("rgba") else T[bg]
        bgc = f"rgb{tuple(round(x) for x in bgc)}" if isinstance(bgc, tuple) else bgc
        return (f'<td><span style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:20px;border-radius:5px;background:{bgc};'
                f'color:{T[fg]};font:900 11px Gabarito;margin-right:7px;vertical-align:middle;{"border:1px solid #E6E6E6;" if bgc == WHITE else ""}">Aa</span>'
                f'<b class="num">{r:.1f}:1</b> <span style="font:700 9px Figtree;color:{c}">{v}</span></td>')
    rows = "".join(f'<tr><td style="font-weight:700">{n}</td>' + "".join(cell(t, fg, bg) for t in ORDER) + "</tr>" for n, fg, bg in pares)
    regras = [("AA", "≥ 4,5:1 · liberado para qualquer tamanho"),
              ("AA grande", "3 a 4,5:1 · só texto ≥ 18 px (ou ≥ 14 px em 700+). No Pink Deep, apoio e texto no card ficam grandes; texto pequeno vai em --texto"),
              ("Pink Deep no preto", f"{ratio(DEEP, BLACK):.1f}:1. Serve para destaque, anel e números grandes; texto corrido no preto é sempre branco ou cinza."),
              ("Branco no Pink Deep", f"{ratio(WHITE, DEEP):.1f}:1. Texto pequeno liberado; mesmo assim, títulos em 900."),
              ("Foco", "anel de 2 px na cor de destaque da superfície, afastado 2 px do componente."),
              ("Nunca só a cor", "estado ativo, erro e seleção sempre com forma ou texto junto (sublinhado, ícone, frase).")]
    page("Cor · contraste", f'<div class="row" style="margin-top:12px;gap:30px"><div style="flex:1.6"><table>{head}{rows}</table>'
         f'<div class="cap">Razão de contraste WCAG 2, calculada pelo gerador a partir dos tokens. Papéis translúcidos são medidos já compostos sobre a superfície.</div></div>'
         f'<div style="flex:1">{spec_list(regras)}</div></div>', "branco",
         "Os pares que o design system permite, medidos. Se um par não está aqui, ele não existe.")


def p_tipo():
    rows = ""
    for t, fam, w, a, wb, lh, tr, u, e in TIPO:
        cor = DEEP if t == "preco" else BLACK
        rows += (f'<div style="display:flex;gap:16px;align-items:baseline;padding:4px 0;border-bottom:1px solid {L2}">'
                 f'<div style="width:150px;flex-shrink:0">{tag("--cz-tipo-" + t)}<div style="font:600 8.5px/1.35 Figtree;color:{L3};margin-top:2px">{fam} {w} · {a}/{wb} px<br>{u}</div></div>'
                 f'<div class="num" style="font:{w} {min(a, 26) if t != "display" else 34}px/{lh} {fam};letter-spacing:{tr}em;color:{cor};white-space:nowrap;overflow:hidden">{e}</div></div>')
    page("Tipografia", f'<div class="row" style="margin-top:8px;gap:30px"><div style="flex:1.7">{rows}</div>'
         f'<div style="flex:1"><div class="d" style="font-size:100px;color:{BLACK}">Aa</div><div class="cap">Gabarito · títulos, preços, botões e a palavra clozzy</div>'
         f'<div style="font:400 56px/1 Figtree;margin-top:14px">Aa</div><div class="cap">Figtree · texto, apoio, rótulos</div>'
         + spec_list([("app / web", "primeiro número é o app (e celular), o segundo vale a partir de 768 px"),
                      ("caixa", "normal sempre; nada de tudo maiúsculo, nem letra espaçada"),
                      ("números", "preço, saldo e contagem com font-variant-numeric: tabular-nums"),
                      ("mínimo", "11 px no app; 13 px para texto que a pessoa precisa ler")])
         + '</div></div>', "branco", "Duas famílias e dez estilos. Gabarito fala alto; Figtree explica.")


def p_espaco():
    bars = "".join(f'<div style="display:flex;align-items:center;gap:10px;height:21px"><span style="width:84px">{tag("--cz-esp-" + k)}</span>'
                   f'<i style="display:block;width:{v * 3}px;height:12px;border-radius:3px;background:{DEEP}"></i><span class="num" style="font:700 9.5px Figtree;color:{L3}">{v}</span></div>' for k, v in ESPACO)
    raios = "".join(f'<div style="text-align:center"><div style="width:74px;height:74px;border-radius:{min(v, 37)}px;background:{L1};border:1.5px solid {BLACK}"></div>'
                    f'<div style="margin-top:5px">{tag("--cz-raio-" + k)}</div><div class="cap" style="margin-top:1px">{v if v < 999 else "∞"} · {u}</div></div>' for k, v, u in RAIO)
    bordas = "".join(f'<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><span style="width:130px">{tag("--cz-borda-" + k)}</span>'
                     f'<i style="display:block;width:120px;height:0;border-top:{v}px solid {BLACK}"></i><span class="cap" style="margin:0">{v} px · {u}</span></div>' for k, v, u in BORDA)
    ctrl = "".join(f'<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><span style="width:130px">{tag("--cz-controle-" + k)}</span>'
                   f'<span class="bt" style="height:{v * .7}px;padding:0 {v * .4}px;background:{DEEP};color:#fff;font-size:{v * .26}px">{v} px</span><span class="cap" style="margin:0">{u}</span></div>' for k, v, u in CONTROLE)
    page("Espaço, raio, borda e altura", f'<div class="row" style="margin-top:12px;gap:34px"><div style="flex:.9"><div class="lbl">Espaço · base 4 (com 2 e 6 para ajuste fino)</div>{bars}'
         f'<div class="cap" style="margin-top:8px">Dentro do componente: 4–12. Entre componentes: 12–24. Entre seções: 32–64.</div></div>'
         f'<div style="flex:1.3"><div class="lbl">Raio</div><div style="display:flex;gap:22px">{raios}</div>'
         f'<div class="row" style="gap:30px;margin-top:20px"><div><div class="lbl">Borda</div>{bordas}</div><div><div class="lbl">Altura de controle (mostrada a 70%)</div>{ctrl}</div></div></div></div>',
         "branco", "Medidas que se repetem. Tudo arredondado e macio como a estrela; nada de canto vivo.")


def p_layout():
    def cols(n, w, h, m, g, c):
        cw = (w - 2 * m - (n - 1) * g) / n
        return (f'<div style="position:relative;width:{w}px;height:{h}px;border-radius:12px;border:1px solid {G3};background:{G1}">'
                + "".join(f'<i style="position:absolute;top:0;bottom:0;left:{m + i * (cw + g)}px;width:{cw}px;background:{c};opacity:.22"></i>' for i in range(n)) + '</div>')
    app = cols(4, 150, 300, 8, 6, PINK)
    web = cols(12, 420, 236, 16, 8, PINK)
    vid = (f'<div style="position:relative;width:150px;height:266px;border-radius:14px;overflow:hidden">{foto("danca-tripe", 150, 266, 14)}'
           f'<i style="position:absolute;left:0;right:0;top:0;height:14%;background:rgba(224,0,90,.55)"></i>'
           f'<i style="position:absolute;left:0;right:0;bottom:0;height:20%;background:rgba(224,0,90,.55)"></i>'
           f'<i style="position:absolute;right:0;top:14%;bottom:20%;width:16%;background:rgba(255,255,255,.6)"></i>'
           f'<span style="position:absolute;left:8px;top:40%;font:800 9px Gabarito;color:#fff;background:#000;padding:2px 6px;border-radius:5px">área livre</span></div>')
    page("Grid e layout", f'<div class="row" style="margin-top:14px;gap:30px">'
         f'<div>{sec("App · 4 colunas", app, True)}<div class="cap" style="color:{G4}">360–430 px · margem 16 · gutter 12</div></div>'
         f'<div>{sec("Web · 12 colunas", web, True)}<div class="cap" style="color:{G4}">máx. 1200 px · margem 32 · gutter 24 · no celular vira o grid do app</div>'
         + spec_list([("tabbar", "56 px + área segura do aparelho"), ("topo do app", "52 px, marca à esquerda (ícone + palavra)"),
                      ("folha", "sobe de baixo, raio lg só nos cantos de cima"), ("leitura", "texto corrido com no máximo 64 caracteres por linha")], True)
         + f'</div><div>{sec("Vídeo 9:16 · área segura", vid, True)}<div class="cap" style="color:{G4};max-width:160px">Rosa: interface da rede (14% em cima, 20% embaixo). Branco: botões laterais. Marca e texto ficam na área livre.</div></div></div>',
         "preto", "Margens e colunas fixas para o app, a web e o vídeo vertical.")


def p_profundidade_movimento():
    T = TEMAS["preto"]
    niveis = [("0 · superfície", T["sup"], "fundo"), ("1 · superfície 2", T["sup2"], "card, campo"),
              ("2 · superfície 2 + linha", T["sup2"], "folha, menu"), ("véu", "rgba(0,0,0,.6)", "atrás de modal e folha")]
    stack = "".join(f'<div style="position:absolute;left:{i * 30}px;top:{i * 46}px;width:200px;height:110px;border-radius:14px;background:{c};'
                    f'border:1px solid {G3 if i in (0, 2) else "transparent"};padding:10px;font:700 9px Figtree;color:#fff">{n}<div style="color:{G4};font-weight:500">{u}</div></div>'
                    for i, (n, c, u) in enumerate(niveis[:3]))
    curva = lambda p: (f'<svg viewBox="0 0 100 100" width="90" height="90"><rect width="100" height="100" rx="10" fill="{G1}"/>'
                       f'<path d="M10 90 C {p}, 90 10" fill="none" stroke="{PINK}" stroke-width="3" stroke-linecap="round"/></svg>')
    curvas = "".join(f'<div>{curva(p)}<div style="margin-top:4px">{tag("--cz-curva-" + k, True)}</div><div class="cap" style="color:{G4};margin-top:1px">{u}</div></div>'
                     for (k, _v, u), p in zip(CURVAS, ("26 90, 10 10", "50 90, 90 90")))
    loader = IB.box("preto", svg(M.RING["carregando"][3](PINK, PINK), "5 5 90 90", 110), 140, 140, "border:1px solid #333")
    page("Profundidade e movimento", f'<div class="row" style="margin-top:14px;gap:34px">'
         f'<div style="flex:1"><div class="lbl" style="color:#fff">Níveis (sem sombra)</div><div style="position:relative;height:210px">{stack}</div>'
         + spec_list([("--superficie-2", "sobe um nível"), ("--linha", "separa quando dois níveis iguais encostam"), ("--cz-veu", "preto 60% atrás de modal; nunca em cima de foto")], True)
         + f'</div><div style="flex:1">{sec("Durações", spec_list([("--cz-dur-" + k, f"{v} · {u}") for k, v, u in MOVIMENTO], True), True)}'
         f'<div class="row" style="gap:16px;margin-top:14px">{curvas}</div></div>'
         f'<div style="flex:.7"><div class="lbl" style="color:#fff">Anel carregando</div>{loader}<div class="cap" style="color:{G4};max-width:170px">O único loader. Gira em --cz-dur-carregando, linear. '
         f'Com “reduzir movimento” ativo, fica parado e pulsa a opacidade.</div></div></div>',
         "preto", "Profundidade vem de superfície e linha, não de sombra. Movimento é curto e macio, nunca quica.")


# ================================================================ marca e ícones
def p_marca_produto():
    SECAO[0] = "marca e ícones"
    W = TEMAS["branco"]
    usos = [(IB.box("preto", logo_app(TEMAS["preto"], 22), 220, 70, "border:1px solid #333"), "Topo do app · ícone + palavra, 22 px de altura"),
            (IB.box("preto", sym("preto", 80), 220, 120, "border:1px solid #333"), "Abertura e loader · símbolo"),
            (IB.box("branco", lock("branco", 26, None), 220, 70), "Topo da web e e-mail · ícone + palavra"),
            (IB.box("preto", f'<div style="display:flex;align-items:center;gap:8px">{tile("preto", 52, None)}{tile("rosa", 52, None)}{tile("roxo", 52, None)}</div>', 220, 90, "border:1px solid #333"), "Ícone de app · o ícone, nunca o símbolo")]
    us = "".join(f'<div>{b}<div class="cap" style="color:#E6E6E6">{t}</div></div>' for b, t in usos)
    mins = "".join(f'<div style="text-align:center">{x}<div class="cap" style="color:#E6E6E6">{t}</div></div>' for x, t in (
        (sym("preto", 16, None), "Ícone 16"), (sym("preto", 32, small=True), "Símbolo 32 · corte pequeno"),
        (lock("preto", 20, None), "Ícone + palavra 20"), (lock("preto", 28), "Símbolo + palavra 28")))
    page("A marca no produto", f'<div class="grid" style="grid-template-columns:repeat(4,1fr);gap:14px;margin-top:14px">{us}</div>'
         f'<div class="row" style="margin-top:22px;gap:40px"><div><div class="lbl" style="color:#fff">Tamanhos mínimos (px)</div><div style="display:flex;gap:26px;align-items:flex-end">{mins}</div></div>'
         f'<div style="flex:1">' + spec_list([("um por tela", "ícone OU símbolo, nunca os dois na mesma tela"), ("respiro", "¼ do símbolo em volta, sem nada dentro"),
                                               ("cor", "a marca segue a superfície: variante preto, branco, rosa ou roxo"),
                                               ("sobre foto", "sempre dentro de pílula sólida (ver Sobre foto)"), ("palavra", "nunca fundida com o símbolo; a estrela não substitui o c")], True)
         + '</div></div>', "preto", "Onde a marca entra no app e na web, e em que forma.")


ICONES = {"inicio": '<path d="M4 11l8-7 8 7v8.5a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 19.5z"/>',
          "explorar": '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
          "pack": '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2"/>',
          "pix": '<path d="M12 3l4 4-4 4-4-4zM12 13l4 4-4 4-4-4zM3 12l4-4 4 4-4 4zM13 12l4-4 4 4-4 4z"/>',
          "chat": '<path d="M4 18.5V6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v8a2.5 2.5 0 01-2.5 2.5H8z"/>',
          "ao-vivo": '<circle cx="12" cy="12" r="3"/><path d="M6.5 6.5a8 8 0 000 11M17.5 6.5a8 8 0 010 11"/>',
          "biblioteca": '<rect x="4" y="4" width="6" height="16" rx="1.5"/><rect x="12" y="4" width="4" height="16" rx="1.2"/>',
          "perfil": '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20a7.5 7.5 0 0115 0"/>',
          "mais": '<path d="M12 5v14M5 12h14"/>', "fechar": '<path d="M6 6l12 12M18 6L6 18"/>',
          "voltar": '<path d="M15 5l-7 7 7 7"/>', "config": '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>'}


def ico(k, px=24, c="#fff", sw=2):
    if k == "close":
        return svg(M.macia(c, 40), "5 5 90 90", px)
    return (f'<svg viewBox="0 0 24 24" width="{px}" height="{px}" fill="none" stroke="{c}" stroke-width="{sw}" stroke-linecap="round" '
            f'stroke-linejoin="round">{ICONES[k]}</svg>')


def p_icones():
    lista = ["close"] + list(ICONES)
    grid = "".join(f'<div style="text-align:center"><div style="width:64px;height:64px;border-radius:16px;background:{L1};display:flex;align-items:center;justify-content:center">'
                   f'{ico(k, 26, BLACK)}</div><div style="margin-top:5px">{tag(k)}</div></div>' for k in lista)
    anat = (f'<div style="position:relative;width:180px;height:180px;border-radius:14px;background:{L1};'
            f'background-image:linear-gradient({L2} 1px,transparent 1px),linear-gradient(90deg,{L2} 1px,transparent 1px);background-size:7.5px 7.5px">'
            f'<div style="position:absolute;inset:15px;border:1px dashed {DEEP};border-radius:6px"></div>'
            f'<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">{ico("pack", 180, BLACK, 2)}</div></div>')
    tam = "".join(f'<div style="text-align:center">{ico("chat", px, BLACK)}<div class="cap">{px}</div></div>' for px in (16, 20, 24, 32))
    page("Ícones", f'<div class="row" style="margin-top:14px;gap:34px"><div style="flex:1.3"><div class="grid" style="grid-template-columns:repeat(7,1fr);gap:14px 8px">{grid}</div></div>'
         f'<div style="flex:1"><div class="row" style="gap:20px"><div>{sec("Grade 24 · margem 2", anat)}</div>'
         f'<div><div class="lbl">Tamanhos</div><div style="display:flex;gap:14px;align-items:flex-end">{tam}</div></div></div>'
         + spec_list([("traço", "2 px a 24 (escala junto), pontas e cantos redondos"), ("forma", "contorno; preenchido só no item ativo da tabbar"),
                      ("cor", "--titulo, --apoio ou --destaque da superfície"), ("close", "é sempre a estrela da marca, nunca um cadeado"),
                      ("toque", "área mínima de 44 × 44 em volta do ícone")])
         + '</div></div>', "branco", "Traço macio, mesma família da estrela. Treze ícones cobrem o app; novos seguem a mesma grade.")


# ================================================================ componentes
def p_botoes():
    SECAO[0] = "componentes"
    linhas = [("Compra", "cta", "Entrar no close"), ("Primário", "botao", "Continuar"), ("Secundário", "sec", "Ver perfil")]
    mat = ""
    for t in ORDER:
        T = TEMAS[t]
        bd = "border:1px solid #E6E6E6;" if t == "branco" else ""
        cel = "".join(f'<div style="height:44px;display:flex;align-items:center">{btn(T, lab, k, 34, 12)}</div>' for _n, k, lab in linhas)
        dis = btn(T, "Indisponível", "botao", 34, 12, None, f"background:{T['chip']};color:{T['apoio']};")
        mat += (f'<div style="background:{T["sup"]};{bd}border-radius:14px;padding:12px 14px"><div style="font:700 9px Figtree;color:{T["apoio"]};margin-bottom:4px">{SUP_NOMES[t]}</div>'
                f'{cel}<div style="height:44px;display:flex;align-items:center">{dis}</div></div>')
    nomes = "".join(f'<div style="height:44px;display:flex;align-items:center;font:800 11px Gabarito">{n}</div>' for n, _k, _l in linhas) + \
        '<div style="height:44px;display:flex;align-items:center;font:800 11px Gabarito">Desabilitado</div>'
    T = TEMAS["branco"]
    estados = "".join(f'<div style="text-align:center">{x}<div class="cap">{n}</div></div>' for x, n in (
        (btn(T, "Entrar no close", "cta", 34, 12), "normal"),
        (btn(T, "Entrar no close", "cta", 34, 12, None, "filter:brightness(.88);"), "pressionado −12% brilho"),
        (btn(T, "Entrar no close", "cta", 34, 12, None, f"box-shadow:0 0 0 2px #fff,0 0 0 4px {DEEP};"), "foco"),
        (btn(T, f'<span style="display:inline-block;width:14px;height:14px;border-radius:50%;border:2px solid #fff;border-right-color:transparent"></span>', "cta", 34, 12, 128), "carregando")))
    tam = "".join(f'<div style="text-align:center">{btn(T, "Entrar", "cta", h * .7, fs)}<div class="cap">{h}</div></div>' for h, fs in ((32, 10), (44, 12), (52, 14)))
    page("Botões", f'<div class="row" style="margin-top:12px;gap:14px"><div style="padding-top:31px;width:76px">{nomes}</div>'
         f'<div class="grid" style="grid-template-columns:repeat(4,1fr);gap:10px;flex:1">{mat}</div></div>'
         f'<div class="row" style="margin-top:16px;gap:34px"><div>{sec("Estados", flex(estados, 14))}</div>'
         f'<div>{sec("Alturas (a 70%)", flex(tam, 12, "flex-end"))}</div>'
         f'</div><div style="margin-top:16px">' + spec_list([("--compra", "um por tela: a ação que gera receita"), ("--cz-raio-pilula", "sempre pílula; texto Gabarito 800, verbo + coisa"),
                                               ("--cz-controle-m", "44 de altura, 16–24 de respiro lateral"), ("desabilitado", "--chip de fundo e --apoio no texto; nunca opacidade sobre o botão")]) + '</div>',
         "branco", "Três tipos e o desabilitado, nas quatro superfícies. O botão pede o papel; a superfície dá a cor.")


def sticker(txt, bg, fg, rot=0, fs=12):
    return V2.sticker(txt, bg, fg, rot, fs)


def p_chips_selos():
    T, W = TEMAS["preto"], TEMAS["branco"]
    chips = lambda TT: '<div style="display:flex;gap:6px;flex-wrap:wrap">' + "".join(chip(TT, t, on) for t, on in (("tudo", True), ("dança", False), ("make", False), ("vlog", False))) + '</div>'
    selos = (f'<div style="display:flex;gap:7px;flex-wrap:wrap;zoom:1.5">{selo(T, "CLOSE")}{selo(W, "NOVO")}'
             f'<span class="selo" style="background:{DEEP};color:#fff">AO VIVO</span><span class="selo" style="background:{PURPLE};color:#fff">CRIADORA</span>'
             f'<span class="selo" style="background:#fff;color:#000">18+</span></div>')
    cont = (f'<div style="display:flex;gap:10px;align-items:center"><b style="background:{DEEP};color:#fff;border-radius:999px;font:800 10px Gabarito;padding:2px 7px">3</b>'
            f'<b style="background:{DEEP};color:#fff;border-radius:999px;font:800 10px Gabarito;padding:2px 7px">99+</b>'
            f'<i style="width:8px;height:8px;border-radius:50%;background:{DEEP}"></i><span class="cap" style="color:{G4};margin:0">contador e ponto de novidade</span></div>')
    st = [("novo drop", DEEP, WHITE, -4), ("só pro close", BLACK, WHITE, 3), ("link na bio", WHITE, BLACK, -2), ("hoje 20h", PURPLE, WHITE, 2)]
    sts = "".join(f'<div style="display:flex;align-items:center;justify-content:center;height:56px">{sticker(t, b, c, r, 14)}</div>' for t, b, c, r in st)
    esq = (f'<div style="flex:1;display:grid;gap:16px">{sec("Chips no preto · filtro", chips(T), True)}'
           f'<div style="background:#fff;border-radius:14px;padding:12px"><div style="color:#000">{sec("Chips no branco", chips(W))}</div></div>'
           f'{sec("Selos", selos, True)}{sec("Contador", cont, True)}</div>')
    dir_ = (f'<div style="flex:1"><div class="lbl" style="color:#fff">Stickers (vídeo, story, capa)</div>'
            f'<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;padding:12px;border-radius:16px;background:{G1};border:1px solid #333">{sts}</div>'
            + spec_list([("chip", f"altura {CONTROLE[0][1]} no app · Figtree 700 · ativo = --titulo com texto --superficie"),
                         ("selo", "Figtree 800 em caixa alta curta (até 8 letras) · estrela sem ponto à esquerda"),
                         ("sticker", "só em vídeo e story · Gabarito 900 · torto −4° a 4° · até dois por tela"),
                         ("cores", "selo e sticker em preto, branco, Pink Deep ou roxo; nunca rosa encostando no roxo")], True) + '</div>')
    page("Chips, selos e stickers", f'<div class="row" style="margin-top:14px;gap:34px">{esq}{dir_}</div>', "preto",
         "Peças pequenas de marcação. Chip filtra, selo informa, sticker é só para vídeo e story.")


def p_campos():
    W = TEMAS["branco"]
    campo = lambda lab, val, bd, cor, extra="", hint="", hc=L3: (
        f'<div><div style="font:700 10px Figtree;margin-bottom:4px">{lab}</div><div style="height:38px;border:{bd};border-radius:12px;padding:0 12px;display:flex;align-items:center;'
        f'justify-content:space-between;font:600 12px Figtree;color:{cor};{extra}">{val}</div>'
        + (f'<div style="font:600 9.5px Figtree;color:{hc};margin-top:4px">{hint}</div>' if hint else "") + '</div>')
    campos = (f'<div class="grid" style="grid-template-columns:1fr 1fr;gap:14px">'
              + campo("Seu @", "@usuário", f"1.5px solid {L2}", L3, hint="normal · placeholder em --apoio")
              + campo("Seu @", f'@laramendes<span style="color:{DEEP}">|</span>', f"2px solid {DEEP}", BLACK, hint="foco · borda 2 em --destaque")
              + campo("Seu @", '@lara<b style="font:900 13px Gabarito">!</b>', f"2px solid {BLACK}", BLACK, hint="esse @ já existe. tenta outro?", hc=BLACK)
              + campo("Seu @", "@laramendes", "1.5px solid transparent", L3, f"background:{L1};", "desabilitado · --superficie-2 sem borda")
              + campo("Preço do close", '<span class="num" style="font:900 15px Gabarito">R$ 19,90</span><span style="color:' + L3 + '">/mês</span>', f"1.5px solid {L2}", BLACK, hint="número tabular")
              + campo("Buscar", f'<span style="display:flex;align-items:center;gap:8px">{ico("explorar", 16, L3)}criadora, @ ou assunto</span>', "1.5px solid transparent", L3, f"background:{L1};border-radius:999px;")
              + '</div>')
    tog = lambda on: (f'<span style="display:inline-block;width:38px;height:22px;border-radius:11px;background:{DEEP if on else L2};position:relative">'
                      f'<i style="position:absolute;top:3px;{"right" if on else "left"}:3px;width:16px;height:16px;border-radius:50%;background:#fff"></i></span>')
    CHK_ON = f'<span class="ok" style="background:{DEEP};color:#fff;width:20px;height:20px;border-radius:6px;margin:0">✓</span>'
    CHK_OFF = f'<span style="width:20px;height:20px;border-radius:6px;border:2px solid {L2}"></span>'
    RAD_ON = f'<span style="width:20px;height:20px;border-radius:50%;border:6px solid {DEEP}"></span>'
    RAD_OFF = f'<span style="width:20px;height:20px;border-radius:50%;border:2px solid {L2}"></span>'
    item = lambda x, t: f'<div style="display:flex;align-items:center;gap:10px;font:600 11px Figtree">{x}{t}</div>'
    controles = (f'<div class="grid" style="gap:9px">{item(tog(True), "Avisar quando postar")}{item(tog(False), "Mostrar no perfil")}'
                 f'{item(CHK_ON, "Li e aceito os termos")}'
                 f'{item(CHK_OFF, "Receber novidades por e-mail")}'
                 f'{item(RAD_ON, "Mensal · R$ 19,90")}'
                 f'{item(RAD_OFF, "Anual · R$ 189,90")}</div>')
    abas = (f'<div style="display:flex;gap:18px;font:800 12px Gabarito;border-bottom:1px solid {L2}">'
            f'<span style="padding-bottom:7px;border-bottom:3px solid {DEEP}">Fotos</span><span style="color:{L3}">Vídeos</span><span style="color:{L3}">Packs</span><span style="color:{L3}">Lives</span></div>'
            f'<div style="display:inline-flex;margin-top:14px;background:{L1};border-radius:999px;padding:3px;font:800 11px Gabarito">'
            f'<span style="background:#fff;border-radius:999px;padding:6px 14px;border:1px solid {L2}">Fã</span><span style="padding:6px 14px;color:{L3}">Criadora</span></div>')
    page("Campos e controles", f'<div class="row" style="margin-top:14px;gap:34px"><div style="flex:1.4">{sec("Campos · normal, foco, erro, desabilitado", campos)}</div>'
         f'<div style="flex:1;display:grid;gap:20px;align-content:start">{sec("Toggle, checkbox, rádio", controles)}{sec("Abas e seletor", abas)}'
         + spec_list([("erro", "sem vermelho: borda 2 em --titulo, “!” e frase amigável"), ("rótulo", "sempre visível em cima, nunca só placeholder"),
                      ("altura", "44 no app (desenho a 86%)")]) + '</div></div>',
         "branco", "Formulários sem cor de status. Foco é Pink Deep; erro é preto, com ponto de exclamação e frase que ajuda.")


def p_avatares_cards():
    K = TEMAS["preto"]
    avs = (f'<div style="display:flex;gap:14px;align-items:center">{ring_av(K, "ringlight-rosa", 56, True)}{ring_av(K, "make-sorriso", 56, False)}'
           f'<div style="position:relative">{ring_av(K, "neon-selfie", 56, True)}<b style="position:absolute;right:-4px;top:-4px;background:{DEEP};color:#fff;border-radius:999px;font:800 9px Gabarito;padding:1px 6px">3</b></div>'
           f'{ring_av(K, "selfie-perto", 34, True)}{ring_av(K, "selfie-sueter", 24, False)}</div>'
           f'<div class="cap" style="color:{G4}">tracejado = close ativo · sólido = perfil normal · 56 / 34 / 24</div>')
    card = (f'<div style="width:160px;border-radius:14px;background:{G1};overflow:hidden;border:1px solid {G3}">{foto("ringlight-sorriso", 160, 160, 0, "50% 25%")}'
            f'<div style="padding:9px 10px"><div style="display:flex;align-items:center;gap:5px"><b style="font:800 11px Gabarito;color:#fff">Lara Mendes</b>{selo(K)}</div>'
            f'<div style="font:600 8.5px Figtree;color:{G4};margin-top:2px">@laramendes · 3,2 mil no close</div>'
            f'<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px"><b class="num" style="font:900 12px Gabarito;color:{PINK}">R$ 19,90</b>{btn(K, "Entrar", "cta", 22, 9)}</div></div></div>')
    trancado = (f'<div style="position:relative">{foto("make-ringlight", 120, 160, 14, None, True)}'
                f'<div style="position:absolute;left:8px;bottom:8px;z-index:3">{selo(K, "CLOSE")}</div></div>')
    aberto = f'<div style="position:relative">{foto("make-paleta", 120, 160, 14)}<div style="position:absolute;left:8px;bottom:8px">{selo(TEMAS["branco"], "NOVO")}</div></div>'
    pack = (f'<div style="width:160px;border-radius:14px;background:{PURPLE};padding:10px;color:#fff">'
            f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">' + "".join(foto(n, 68, 60, 8, None, True) for n in ("vlog-tripe", "tripe-arara", "espelho-ruiva", "selfie-sueter")) + '</div>'
            f'<b style="display:block;font:800 12px Gabarito;margin-top:8px">Pack bastidor</b><div style="font:600 8.5px Figtree;opacity:.85">12 fotos · 2 vídeos</div>'
            f'<div style="margin-top:8px">{btn(TEMAS["roxo"], "Pegar o pack · R$ 29,90", "cta", 22, 8.5)}</div></div>')
    page("Avatares e cards", f'<div class="row" style="margin-top:14px;gap:28px"><div style="flex:1;display:grid;gap:18px;align-content:start">{sec("Avatar", avs, True)}'
         + spec_list([("conteúdo do close", "desfoque 10 px + estrela branca no meio; nunca tarja, nunca cadeado"),
                      ("--cz-raio-md", "card e miniatura; foto sem filtro, rosto no terço de cima"),
                      ("--superficie-2", "fundo do card no preto, com --linha"), ("pack", "card de criadora pode ir no roxo (lado da criadora)")], True)
         + f'</div><div style="display:flex;gap:12px">{sec("Card de criadora", card, True)}<div>{sec("Miniatura · do close / aberta", flex(trancado + aberto, 8), True)}</div>'
         f'{sec("Card de pack", pack, True)}</div></div>', "preto",
         "O anel do avatar diz se a criadora tem close ativo. O conteúdo pago aparece, mas desfocado com a estrela.")


def p_feedback():
    K, W = TEMAS["preto"], TEMAS["branco"]
    toast = lambda msg, bg, fg, ic, sym_="✓": (f'<div style="display:flex;align-items:center;gap:9px;background:{bg};color:{fg};border-radius:14px;padding:10px 14px;font:700 11px Figtree;border:1px solid {L2 if bg == WHITE else G3}">'
                                               f'<span style="width:20px;height:20px;border-radius:50%;background:{ic};color:#fff;display:flex;align-items:center;justify-content:center;font:900 11px Gabarito">{sym_}</span>{msg}</div>')
    toasts = (f'<div style="display:grid;gap:8px">{toast("tá dentro! liberado na hora", BLACK, "#fff", DEEP)}{toast("ops, o Pix não passou. tenta de novo?", WHITE, BLACK, BLACK, "!")}'
              f'{toast("link copiado", G1, "#fff", G3)}</div>')
    vazio = (f'<div style="width:200px;border-radius:14px;background:{G1};border:1px solid {G3};padding:16px;text-align:center">{sym("preto", 52)}'
             f'<div class="d" style="font-size:16px;color:#fff;margin-top:10px">Ainda sem close<br>por aqui.</div><div style="font:500 9px Figtree;color:{G4};margin-top:4px">bora explorar?</div>'
             f'<div style="margin-top:10px">{btn(K, "Explorar", "cta", 24, 10)}</div></div>')
    folha = (f'<div style="width:210px;height:250px;border-radius:14px;overflow:hidden;position:relative;background:rgba(0,0,0,.6)">{foto("amigas-cafe", 210, 250, 0, None, False, "position:absolute;inset:0;opacity:.35")}'
             f'<div style="position:absolute;left:0;right:0;bottom:0;background:#fff;border-radius:18px 18px 0 0;padding:12px 14px">'
             f'<i style="display:block;width:34px;height:4px;border-radius:2px;background:{L2};margin:0 auto 10px"></i>'
             f'<div class="d" style="font-size:16px;color:#000">Entrar no close da Lara</div><div style="font:500 9.5px/1.4 Figtree;color:{L3};margin-top:4px">Tudo do perfil enquanto o close estiver ativo. Cancela quando quiser.</div>'
             f'<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px"><b class="num" style="font:900 16px Gabarito;color:{DEEP}">R$ 19,90</b>{btn(W, "Pagar no Pix", "cta", 28, 10)}</div></div></div>')
    aprovado = (f'<div style="width:150px;height:250px;border-radius:14px;background:{DEEP};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#fff">'
                f'{sym("rosa", 64)}<div class="d" style="font-size:18px;text-align:center">Você está<br>no close.</div>{btn(TEMAS["rosa"], "Ver agora", "cta", 24, 10)}</div>')
    skel = (f'<div style="width:150px;border-radius:14px;background:{G1};border:1px solid {G3};padding:10px"><div style="height:90px;border-radius:10px;background:{G2}"></div>'
            f'<div style="height:9px;width:70%;border-radius:5px;background:{G2};margin-top:9px"></div><div style="height:7px;width:45%;border-radius:4px;background:{G2};margin-top:6px"></div></div>')
    page("Avisos, estados e folhas", f'<div class="row" style="margin-top:14px;gap:20px"><div style="flex:1;display:grid;gap:16px;align-content:start">{sec("Aviso (toast)", toasts, True)}'
         f'{sec("Carregando conteúdo", skel, True)}</div>{sec("Tela vazia", vazio, True)}{sec("Folha de compra", folha, True)}{sec("Momento Pink Deep", aprovado, True)}</div>'
         f'<div style="margin-top:14px">' + spec_list([("sucesso", "ponto Pink Deep + frase da casa; some em 3 s"), ("erro", "fundo branco, “!” preto, frase que diz o que fazer; fica até a pessoa fechar"),
                                                        ("tela inteira Pink Deep", "uma vez por fluxo: pagamento aprovado, close aberto, lançamento")], True) + '</div>',
         "preto", "Sem verde, sem vermelho, sem amarelo. O que muda é a forma, o fundo e a frase.")


def p_navegacao():
    K = TEMAS["preto"]
    fa = f'<div style="position:relative;width:260px;height:52px;border-radius:12px;overflow:hidden;border:1px solid {G3}">{tabbar(K, 0)}</div>'
    cr = f'<div style="position:relative;width:260px;height:52px;border-radius:12px;overflow:hidden;border:1px solid {G3}">{tabbar(TEMAS["roxo"], 0, True)}</div>'
    topo = (f'<div style="width:260px;height:52px;border-radius:12px;background:#000;border:1px solid {G3};display:flex;align-items:center;justify-content:space-between;padding:0 14px">'
            f'{logo_app(K, 16)}<span style="display:flex;gap:12px">{ico("explorar", 18)}{ico("chat", 18)}</span></div>')
    topo2 = (f'<div style="width:260px;height:52px;border-radius:12px;background:#fff;display:flex;align-items:center;gap:12px;padding:0 14px">'
             f'{ico("voltar", 18, BLACK)}<b style="font:800 14px Gabarito;flex:1;color:#000">Pagamento</b>{ico("fechar", 18, BLACK)}</div>')
    telas = (f'<div style="display:flex;gap:12px">{phone(V1.s_inicio(K), K, 160, 330)}{phone(V1.s_painel(TEMAS["roxo"]), TEMAS["roxo"], 160, 330)}</div>')
    page("Navegação", f'<div class="row" style="margin-top:14px;gap:34px"><div style="display:grid;gap:14px;align-content:start">'
         f'{sec("Tabbar da fã · 5 itens", fa, True)}{sec("Tabbar da criadora · roxo, + no meio", cr, True)}{sec("Topo principal", topo, True)}{sec("Topo de fluxo", topo2, True)}</div>'
         f'<div>{telas}</div><div style="flex:1">' + spec_list([("item ativo", "--destaque + ícone preenchido + rótulo"), ("rótulos", "sempre visíveis, Figtree 700 11"),
                                                                 ("lado da criadora", "mesmo app, superfície roxa: a pessoa sabe onde está"),
                                                                 ("topo de fluxo", "voltar à esquerda, fechar à direita, sem marca"), ("tabbar some", "em folha, player e chat aberto")], True) + '</div></div>',
         "preto", "Duas tabbars para dois lados do mesmo app. A cor da superfície diz se você está como fã ou como criadora.")


def tk(text, bg=BLACK, fg=WHITE, fs=13):
    return (f'<span style="display:inline-block;font:800 {fs}px/1.12 Gabarito;letter-spacing:-.02em;padding:.16em .5em;border-radius:.32em;'
            f'white-space:nowrap;background:{bg};color:{fg}">{text}</span>')


def tkl(lines, fs=13, gap=3):
    return f'<div style="display:flex;flex-direction:column;align-items:flex-start;gap:{gap}px">' + "".join(tk(t, b, c, fs) for t, b, c in lines) + '</div>'


def stamp(h=11, bg=BLACK, kind="mono-branco"):
    return f'<span style="display:inline-flex;align-items:center;background:{bg};border-radius:999px;padding:4px 8px">{lock(kind, h, None)}</span>'


def p_sobre_foto():
    W, H = 168, 300
    a = (f'<div style="position:relative">{foto("ringlight-rosa", W, H, 16)}<div style="position:absolute;left:10px;top:10px">{stamp()}</div>'
         f'<div style="position:absolute;left:10px;bottom:14px">{tkl([("Seu close,", BLACK, WHITE), ("seu preço.", DEEP, WHITE)], 18, 4)}</div></div>')
    b = (f'<div style="position:relative">{foto("espelho-casaco", W, H, 16)}<div style="position:absolute;right:10px;top:10px">{selo(TEMAS["preto"], "CLOSE")}</div>'
         f'<div style="position:absolute;left:10px;bottom:46px">{tkl([("look do dia", WHITE, BLACK), ("no close da Mel", BLACK, WHITE)], 14, 4)}</div>'
         f'<div style="position:absolute;left:10px;bottom:12px">{btn(TEMAS["preto"], "Entrar no close", "cta", 24, 9)}</div></div>')
    c = (f'<div style="position:relative">{foto("make-mesa", W, H, 16, None, True)}<div style="position:absolute;left:0;right:0;bottom:16px;text-align:center;z-index:3">'
         f'{tk("Só pro close.", DEEP, WHITE, 16)}</div></div>')
    d = (f'<div style="width:{W}px;height:{H}px;border-radius:16px;overflow:hidden;background:{PURPLE}">{foto("vlog-tripe", W, 186, 0)}'
         f'<div style="padding:12px"><div class="d" style="font-size:18px;color:#fff">Abra o<br>seu close.</div><div style="margin-top:8px">{btn(TEMAS["roxo"], "Quero vender", "botao", 24, 9)}</div></div></div>')
    cells = "".join(f'<div>{x}<div class="cap" style="color:#E6E6E6">{t}</div></div>' for x, t in
                    ((a, "Marca em pílula + legenda em bloco"), (b, "Selo + legenda + compra"), (c, "Do close: desfoque + estrela"), (d, "Foto em cima, bloco sólido embaixo")))
    page("Sobre foto", f'<div class="row" style="margin-top:12px;gap:22px"><div style="display:flex;gap:12px">{cells}</div>'
         f'<div style="flex:1">' + spec_list([("legenda em bloco", "Gabarito 800, cada linha no seu bloco, raio .32em, preto/branco/Pink Deep/roxo"),
                                               ("pílula da marca", "ícone + palavra em mono-branco dentro de pílula preta (ou mono-preto na branca), canto de cima"),
                                               ("botão", "o mesmo do preto; fica embaixo, alinhado à legenda"),
                                               ("desfoque", "10 px, estrela branca 22 px em círculo preto 45%"),
                                               ("nunca", "texto solto, degradê, filtro de cor, escurecer a foto, tarja")], True) + '</div></div>',
         "preto", "Três componentes resolvem qualquer foto: legenda em bloco, pílula da marca e o desfoque do close.")


# ================================================================ padrões e conteúdo
def p_microcopy():
    SECAO[0] = "padrões"
    tb = [("Botão de compra", "Entrar no close"), ("Botão da criadora", "Abrir meu close"), ("Pack", "Pegar o pack"),
          ("Pagamento ok", "tá dentro! pago no Pix, liberado na hora"), ("Erro de pagamento", "ops, o Pix não passou. tenta de novo?"),
          ("Tela vazia", "ainda sem close por aqui. bora explorar?"), ("Push de post", "a Lara postou no close 💗"),
          ("Vencendo", "seu close da Nina vence em 2 dias"), ("Campo com erro", "esse @ já existe. tenta outro?"), ("Convite", "me acha no close")]
    rows = "".join(f'<tr><td style="width:140px;color:{L3}">{a}</td><td style="font-weight:800;font-size:11.5px">{b}</td></tr>' for a, b in tb)
    usar = ["close", "criadora", "pack", "bora", "tá dentro", "caiu", "novidade", "link na bio", "seu preço", "Pix"]
    evitar = ["sexy", "hot", "nudes", "privê", "assinante", "usuário", "conteúdo adulto", "CAPS"]
    ch = lambda lst, ok: "".join(f'<span style="display:inline-block;font:700 10px Figtree;padding:3px 9px;border-radius:999px;margin:0 4px 5px 0;'
                                 f'background:{DEEP if ok else L1};color:{"#fff" if ok else L3}">{x}</span>' for x in lst)
    page("Conteúdo e microtextos", f'<div class="row" style="margin-top:12px;gap:34px"><div style="flex:1.4"><table>{rows}</table></div>'
         f'<div style="flex:1"><div class="lbl">Palavras da casa</div>{ch(usar, True)}<div class="lbl" style="margin-top:12px">Ficam de fora</div>{ch(evitar, False)}'
         + spec_list([("botão", "verbo + coisa, até 3 palavras"), ("aviso", "minúscula, uma frase, diz o que fazer"), ("emoji", "no máximo um: 💗 ✨ 🌸 🎀 ⭐; nunca 🔥 🍑 🔞"),
                      ("números", "R$ 19,90 · 3,2 mil · há 12 min"), ("tom", "jovem, direta, divertida, segura; nunca promete ganho")])
         + '</div></div>', "branco", "A interface fala como a criadora fala com a turma dela. Os textos de cada componente já vêm prontos.")


# ================================================================ regras
def p_codigo():
    SECAO[0] = "regras"
    code = (".card {{\n  background: var(--superficie-2);\n  border: var(--cz-borda-fina) solid var(--linha);\n  border-radius: var(--cz-raio-md);\n"
            "  padding: var(--cz-esp-6);\n  color: var(--texto);\n}}\n.card h3 {{ font: var(--cz-tipo-titulo-3); color: var(--titulo); }}\n"
            ".comprar {{\n  height: var(--cz-controle-m);\n  border-radius: var(--cz-raio-pilula);\n  background: var(--compra);\n  color: var(--compra-texto);\n"
            "  font: var(--cz-tipo-botao);\n  transition: filter var(--cz-dur-rapido) var(--cz-curva-padrao);\n}}").format()
    html = '&lt;main data-tema="preto"&gt; … &lt;section data-tema="rosa"&gt;aprovado&lt;/section&gt; &lt;/main&gt;'
    pre = lambda s: f'<pre style="font:500 9.5px/1.55 ui-monospace,Menlo,monospace;color:#E6E6E6;background:{G1};border:1px solid {G3};border-radius:14px;padding:12px 14px;white-space:pre-wrap">{s}</pre>'
    files = [("tokens.css", "Variáveis: primitivas em :root, papéis por [data-tema], tipo maior a partir de 768 px"),
             ("tokens.json", "Os mesmos tokens para Figma, app nativo e scripts"),
             ("../identidade-estrela-macia/svg/", "Ícone, símbolo, lockups, app icons, loader"),
             ("../fotos-criadoras/", "Fotos de banco (Pexels) · só uso interno, sem autorização de imagem"),
             ("../uso-da-marca-estrela-macia-v2/", "Manual de uso da marca (peças e aplicações)"),
             ("_build.py", "Gera este PDF e os tokens a partir da mesma fonte")]
    fl = "".join(f'<div style="display:flex;gap:12px;font-size:10px;padding:5px 0;border-bottom:1px solid {G3}"><code style="width:220px;color:{PINK};flex-shrink:0">{a}</code><span style="color:#E6E6E6">{b}</span></div>' for a, b in files)
    page("Tokens em código", f'<div class="row" style="margin-top:12px;gap:28px"><div style="flex:1">{sec("Componente usando só tokens", pre(code), True)}'
         f'<div style="margin-top:10px">{sec("Tema por contêiner", pre(html), True)}</div></div>'
         f'<div style="flex:1">{sec("Arquivos", fl, True)}<div style="margin-top:14px">'
         + spec_list([("nome", "--cz-* para primitivas e medidas; papel sem prefixo (--compra)"), ("proibido", "hex solto em componente; criar cor nova; sombra"),
                      ("mudou um token?", "muda no _build.py e roda de novo: PDF, CSS e JSON saem juntos")], True) + '</div></div></div>',
         "preto", "Como usar no código. Componente nunca escreve um hex: pede o papel ou a medida.")


def p_checklist():
    grupos = [("Cor e marca", ["Fundo #000 ou #fff de verdade", "Um rosa só: Pink Deep #E0005A", "Nada preto sobre Pink Deep; Pink Deep e roxo nunca um sobre o outro",
                               "Componente usa papel, não hex", "Ícone OU símbolo por tela; palavra separada"]),
              ("Componentes", ["Um botão de compra por tela", "Alvo de toque ≥ 44", "Erro sem vermelho: forma + frase", "Estado nunca só pela cor",
                               "Par de cor está na tabela de contraste"]),
              ("Foto e texto", ["Criadora maior de idade, verificada, rosto à vista, nada sensual", "Texto sobre foto em bloco; marca em pílula",
                                "Do close: desfoque + estrela", "Voz da casa, no máximo um emoji"])]
    col = lambda t, itens: (f'<div><h3 style="color:#fff;font-size:14px;margin-bottom:6px">{t}</h3>' + "".join(
        f'<div style="display:flex;gap:9px;padding:6px 0;border-bottom:1px solid {G3};font:500 10.5px/1.4 Figtree;color:#E6E6E6"><span class="ok" style="background:{DEEP};color:#fff;flex-shrink:0">✓</span>{i}</div>' for i in itens) + '</div>')
    page("Checklist", f'<div class="grid" style="grid-template-columns:repeat(3,1fr);gap:26px;margin-top:14px">' + "".join(col(t, i) for t, i in grupos) + '</div>'
         f'<div style="position:absolute;right:16mm;bottom:20mm">{lock("preto", 48)}</div>', "preto", "Antes de entregar uma tela ou uma peça.")


def reused(fn, secao):
    def run():
        SECAO[0] = secao
        fn()
    return run


# ================================================================ montagem
PLAN = [  # (seção, título no sumário, função)
    ("base", "Como ler este documento", p_como_ler), ("base", "Princípios", p_principios),
    ("tokens", "Cor · primitivas", p_cor_primitivas), ("tokens", "Cor · papéis por superfície", p_cor_papeis), ("tokens", "Cor · contraste", p_contraste),
    ("tokens", "Tipografia", p_tipo), ("tokens", "Espaço, raio, borda e altura", p_espaco), ("tokens", "Grid e layout", p_layout),
    ("tokens", "Profundidade e movimento", p_profundidade_movimento),
    ("marca e ícones", "A marca no produto", p_marca_produto), ("marca e ícones", "Combinações da marca", reused(V2.p_combinacoes, "marca e ícones")),
    ("marca e ícones", "Ícones", p_icones),
    ("componentes", "Botões", p_botoes), ("componentes", "Chips, selos e stickers", p_chips_selos), ("componentes", "Campos e controles", p_campos),
    ("componentes", "Avatares e cards", p_avatares_cards), ("componentes", "Avisos, estados e folhas", p_feedback),
    ("componentes", "Navegação", p_navegacao), ("componentes", "Sobre foto", p_sobre_foto),
    ("padrões", "App · telas", reused(V1.p_app, "padrões")), ("padrões", "App · seis temas", reused(V1.p_app_temas, "padrões")),
    ("padrões", "Conteúdo e microtextos", p_microcopy),
    ("regras", "Não fazer", reused(V2.p_erros, "regras")), ("regras", "Tokens em código", p_codigo), ("regras", "Checklist", p_checklist),
]

CHECK_JS = """<script>addEventListener('load',()=>{const out=[];document.querySelectorAll('.pg').forEach((pg,i)=>{const r=pg.getBoundingClientRect();
pg.querySelectorAll('*').forEach(el=>{if(el.closest('.foot'))return;const b=el.getBoundingClientRect();if(b.width&&(b.right>r.right-30||b.bottom>r.bottom-28))
out.push((i+1)+': '+el.tagName+'.'+el.className+' '+Math.round(b.right-r.right)+','+Math.round(b.bottom-r.bottom))});});
document.title='CHECK '+JSON.stringify(out.slice(0,60));});</script>"""


def build():
    TOC.clear()
    for i, (s, t, _fn) in enumerate(PLAN):
        TOC.append((i + 2, t, s))
    p_capa()
    for _s, _t, fn in PLAN:
        fn()
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy · design system · Estrela macia</title>'
            f'<style>{V1.CSS}{V2.PHOTO_CSS}</style></head><body>{"".join(PAGES)}</body></html>')
    i = html.lower().find("#ff0065")
    assert i < 0, "sobrou o rosa #FF0065: " + html[max(0, i - 300):i + 40]
    OUT_HTML.write_text(html)
    tokens_files()
    assert "#ff0065" not in (HERE / "tokens.css").read_text().lower()
    subprocess.run([V1.CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer", "--virtual-time-budget=6000",
                    f"--print-to-pdf={OUT_PDF}", OUT_HTML.as_uri()], check=True, capture_output=True)
    if os.environ.get("CHECK"):
        tmp = HERE / "_check.html"
        tmp.write_text(html.replace("</body>", CHECK_JS + "</body>"))
        r = subprocess.run([V1.CHROME, "--headless", "--disable-gpu", "--virtual-time-budget=6000", "--dump-dom", tmp.as_uri()],
                           capture_output=True, text=True)
        tmp.unlink()
        m = re.search(r"<title>(CHECK[^<]*)</title>", r.stdout)
        print(m.group(1) if m else "check: sem resultado")
    print("pages", len(PAGES))


if __name__ == "__main__":
    build()

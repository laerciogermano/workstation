#!/usr/bin/env python3
"""Clozzy — manual da identidade visual “Crescente” (26 págs., no formato do manual do RolêGo v4).
Rodar: python3 _simbolos.py && python3 _build.py → identidade-visual-clozzy.html/.pdf, posts/, stories/, png/"""
import shutil, subprocess, sys, tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import _pecas as P  # noqa: E402
import _simbolos as S  # noqa: E402

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT_HTML = HERE / "identidade-visual-clozzy.html"
OUT_PDF = HERE / "identidade-visual-clozzy.pdf"
PINK, DEEP, PURPLE, INK, CREAM, WHITE = P.PINK, P.DEEP, P.PURPLE, P.INK, P.CREAM, P.WHITE
V, f = P.V, P.f
sym, lock, faixa, slogan, icon, btn, tile, photo = P.sym, P.lock, P.faixa, P.slogan, P.icon, P.btn, P.tile, P.photo
MIST = "#F6EEEA"
TOTAL = 26

CSS = P.FONT_CSS + f"""
@page{{size:297mm 210mm;margin:0}}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:Figtree;background:#2a2026;-webkit-print-color-adjust:exact;print-color-adjust:exact;color:{INK}}}
.page{{width:297mm;height:210mm;padding:13mm 16mm 14mm;position:relative;overflow:hidden;page-break-after:always;
  display:flex;flex-direction:column;gap:10px;background:{CREAM};margin:0 auto 12px}}
@media print{{.page{{margin:0}}}}
.dark{{background:{INK};color:{WHITE}}} .pink{{background:{PINK};color:{WHITE}}} .mist{{background:{MIST}}}
.eyebrow{{font:700 11px Figtree;letter-spacing:.09em;text-transform:uppercase;color:rgba(20,9,15,.5)}}
.dark .eyebrow,.pink .eyebrow{{color:rgba(255,255,255,.6)}}
h2{{font:800 italic 27px/1.04 Gabarito;letter-spacing:-.03em}} h2 b{{color:{DEEP};font-weight:800}} .dark h2 b{{color:{PINK}}}
.lead{{font-size:12px;line-height:1.5;max-width:700px;opacity:.72}}
.foot{{position:absolute;left:16mm;right:16mm;bottom:6mm;display:flex;justify-content:space-between;font:500 9px Figtree;opacity:.5}}
.sub{{font:700 10px Figtree;text-transform:uppercase;letter-spacing:.07em;opacity:.55;margin-bottom:7px}}
.lab{{font:800 12.5px Gabarito;margin-top:8px}} .note{{font-size:9.6px;line-height:1.42;opacity:.65;margin-top:3px}}
code{{font:9px ui-monospace,Menlo,monospace;background:rgba(224,0,90,.08);color:{DEEP};border-radius:4px;padding:1px 5px;display:inline-block;margin-top:6px}}
.dark code{{background:rgba(255,255,255,.08);color:{PINK}}}
.tl{{border-radius:16px;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative}}
.bd{{border:1px solid rgba(20,9,15,.08)}}
.grid{{display:grid;gap:14px}}
.row{{display:flex;gap:14px;align-items:flex-start}}
.spin .ring{{transform-origin:50px 50px;animation:spin 2.4s linear infinite}}
@keyframes spin{{to{{transform:rotate(360deg)}}}}
@media print{{.spin .ring{{animation:none}}}}
.rl{{list-style:none;display:flex;flex-direction:column;gap:6px;font-size:10.5px;line-height:1.45}}
.rl li{{padding-left:15px;position:relative}}
.rl li:before{{content:"";position:absolute;left:0;top:5px;width:8px;height:4px;border-radius:2px;background:{PINK}}}
.ok{{color:#12A15E;font-weight:800}} .no{{color:{DEEP};font-weight:800}}
.card{{background:{WHITE};border-radius:16px;padding:14px;border:1px solid rgba(20,9,15,.07)}}
.dark .card{{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.08)}}
"""


def foot(n, dark=False):
    return f'<div class="foot"><span>Clozzy · identidade visual “Crescente” · nov/2026</span><span>{n}</span></div>'


def page(n, eyebrow, title, body, cls="", lead=""):
    ld = f'<p class="lead">{lead}</p>' if lead else ""
    return (f'<section class="page {cls}"><div class="eyebrow">{n:02d} · {eyebrow}</div><h2>{title}</h2>{ld}{body}'
            f'{foot(n)}</section>')


def T(bg, inner, h, w=None, extra=""):
    bd = " bd" if bg in (WHITE, CREAM) else ""
    ww = f"width:{w}px;" if w else ""
    return f'<div class="tl{bd}" style="background:{bg};height:{h}px;{ww}{extra}">{inner}</div>'


def item(tl, lab, note, code=""):
    c = f"<code>{code}</code>" if code else ""
    return f'<div>{tl}<div class="lab">{lab}</div><div class="note">{note}</div>{c}</div>'


# ======================================================================================================
def p01():
    pat = "".join(f'<div style="position:absolute;left:{x}px;top:{y}px;opacity:.13">{sym("rosa", s, k)}</div>'
                  for x, y, s, k in ((640, -120, 520, "crescente"), (920, 330, 360, "giro"), (430, 470, 260, "giro"), (-60, 560, 200, "crescente")))
    return (f'<section class="page pink" style="padding:0">{pat}'
            f'<div style="position:absolute;left:16mm;top:13mm" class="eyebrow">Identidade visual · versão Crescente · novembro 2026</div>'
            f'<div style="position:absolute;left:16mm;top:52mm">{lock("rosa", 120)}</div>'
            f'<div style="position:absolute;left:16mm;top:104mm">{slogan(54, WHITE, WHITE)}</div>'
            f'<div style="position:absolute;left:16mm;top:122mm">{faixa(WHITE, 9, 1.25)}</div>'
            f'<div style="position:absolute;left:16mm;bottom:16mm;font-size:11px;line-height:1.5;max-width:520px;opacity:.85">'
            f'Manual de marca: essência, símbolo nas versões Crescente e Giro, slogan, cores, tipografia, elementos, motion, '
            f'interface e aplicações (feed, stories, perfil, app, xícara, adesivos, camisetas, papelaria e rua).</div>'
            f'{foot(1)}</section>')


TOC = ["Essência", "Logo · sistema", "Crescente e Giro", "Construção e mínimos", "Usos incorretos", "Slogan",
       "Cores principais", "Combinações e contraste", "Tipografia", "Elementos gráficos", "Fotografia e ícones",
       "Voz e tom", "Motion", "Interface", "Feed · templates", "Stories", "Perfil e destaques", "App",
       "Xícara, canecas e copos", "Adesivos", "Vestir", "Papelaria", "Rua e eventos", "Acessibilidade"]


def p02():
    items = "".join(f'<div style="display:flex;gap:16px;align-items:baseline;border-top:1px solid rgba(20,9,15,.1);padding:6.5px 0">'
                    f'<span style="font:800 italic 12px Gabarito;color:{DEEP};width:24px">{i + 3:02d}</span>'
                    f'<b style="font:700 13.5px Figtree">{t}</b></div>' for i, t in enumerate(TOC))
    files = ("<b>svg/crescente/</b> e <b>svg/giro/</b>: símbolo, corte pequeno, horizontal, empilhado, transparente, ícone de app e animado · "
             "<b>posts/</b>: 9 posts de 1080 · <b>stories/</b>: 4 stories de 1080×1920 · <b>png/</b>: páginas deste manual · "
             "<b>BRAND.md</b>: regras em texto")
    return page(2, "Sumário", "O que tem <b>aqui</b>",
                f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 40px;margin-top:6px">{items}</div>'
                f'<div class="card" style="margin-top:auto;font-size:10px;line-height:1.8;opacity:.85"><div class="sub">Arquivos do kit</div>{files}</div>')


def p03():
    cards = "".join(f'<div class="card"><div style="font:800 italic 17px Gabarito">{a}</div>'
                    f'<div style="font:700 9px Figtree;color:{DEEP};text-transform:uppercase;letter-spacing:.08em;margin-top:2px">{b}</div>'
                    f'<div class="note" style="font-size:10px">{c}</div></div>'
                    for a, b, c in (("Próxima", "não distante", "Fala como amiga de quem cria: perto, de igual para igual."),
                                    ("Exclusiva", "não elitista", "O valor está no acesso, não no preço. Close é escolha."),
                                    ("Segura", "não fria", "Pagamento, privacidade e controle sem cara de banco."),
                                    ("Viva", "não barulhenta", "Movimento do story: algo sempre carregando, chegando, novo.")))
    return page(3, "Essência", "O conteúdo do <b>close</b> agora tem preço",
                f'<div style="display:grid;grid-template-columns:1.05fr 1fr;gap:28px;margin-top:6px">'
                f'<div style="font-size:11.5px;line-height:1.6"><div class="sub">O que é</div>'
                f'Clozzy é a plataforma onde creators vendem conteúdo exclusivo: fotos, vídeos e stories que só os assinantes '
                f'veem, com pagamento por Pix todo mês. É o “close friends” que vira renda.'
                f'<div class="sub" style="margin-top:14px">Para quem</div>Creators, influenciadores e artistas de 18 a 35 anos que já '
                f'postam stories todo dia e querem cobrar pelo que é mais pessoal, sem mudar a forma de postar.'
                f'<div class="sub" style="margin-top:14px">Promessa</div><b>Só pra quem é close.</b> Quem assina entra no círculo; '
                f'quem não assina vê o cadeado.'
                f'<div class="sub" style="margin-top:14px">Por que “Crescente”</div>O símbolo é o anel do story carregando: traços que '
                f'crescem até virar linha cheia. É o conteúdo chegando, e também o creator crescendo.</div>'
                f'<div><div class="grid" style="grid-template-columns:1fr 1fr">{cards}</div>'
                f'<div class="card" style="background:{INK};color:{WHITE};margin-top:14px;display:flex;gap:16px;align-items:center">'
                f'{sym("preto", 70)}<div><div style="font:800 italic 16px Gabarito">O nome</div><div class="note" style="opacity:.75">'
                f'Clozzy vem de <i>close</i>: o círculo próximo. A palavra fica sempre separada do símbolo, ao lado ou embaixo.</div></div></div></div></div>')


def p04():
    k = "crescente"
    its = [
        item(T(INK, lock("preto", 46), 132), "Horizontal no preto · principal", "App, redes, peças noturnas. Anel rosa, estrela e palavra brancas.", "crescente-horizontal-preto.svg"),
        item(T(PINK, lock("rosa", 46), 132), "Horizontal no rosa · superfície", "Capas, campanhas, merch. No rosa, tudo branco.", "crescente-horizontal-rosa.svg"),
        item(T(WHITE, lock("branco", 46), 132), "Horizontal no claro", "Documentos, e-mail, papelaria. Símbolo Deep, palavra ink.", "crescente-horizontal-branco.svg"),
        item(T(PURPLE, lock("roxo", 92, vertical=True), 132), "Empilhado", "Splash, ecobag, espaços quadrados e verticais.", "crescente-empilhado-*.svg"),
        item(T(INK, sym("preto", 84), 132), "Símbolo Crescente", "Avatar, ícone, selo. Quando o nome já aparece por perto.", "crescente-simbolo-*.svg"),
        item(T(WHITE, tile("rosa", 92), 132), "Ícone de app", "Rosa com símbolo branco. Alternativos: preto e roxo.", "crescente-app-icon-*.svg"),
        item(T(INK, lock("mono-branco", 40), 132), "Uma cor · branco", "Silk de 1 cor, gravação, sobre foto.", "crescente-horizontal-mono-branco.svg"),
        item(T(WHITE, lock("mono-ink", 40), 132), "Uma cor · ink", "Fax, nota fiscal, carimbo, impressão P&B.", "crescente-horizontal-mono-ink.svg"),
    ]
    return page(4, "Logo · sistema", "Um anel que cresce, uma estrela — <b>sempre</b>",
                f'<div class="grid" style="grid-template-columns:repeat(4,1fr);gap:16px 14px">{"".join(its)}</div>')


def p05():
    def col(kind, v, name, tag, txt, uses):
        return (f'<div class="card" style="padding:16px"><div class="row" style="gap:12px">'
                f'{T(INK, sym("preto", 120, kind, spin=True), 170, 170)}{T(PINK, sym("rosa", 120, kind), 170, 170)}{T(WHITE, sym("branco", 120, kind), 170, 170)}</div>'
                f'<div style="display:flex;gap:10px;align-items:baseline;margin-top:12px"><div style="font:800 italic 22px Gabarito">{name}</div>'
                f'<span style="font:800 9px Figtree;letter-spacing:.08em;background:{tag[0]};color:{tag[1]};border-radius:99px;padding:3px 9px">{tag[2]}</span></div>'
                f'<div class="note" style="font-size:10.5px">{txt}</div><ul class="rl" style="margin-top:8px">{uses}</ul></div>')
    a = col("crescente", "preto", "Crescente", (PINK, WHITE, "PRINCIPAL"),
            "Do topo, no sentido horário, 7 traços que crescem (2° → 30°) e viram linha cheia. É o story carregando: algo novo chegando.",
            "<li>Assinaturas, ícone de app, avatar, documentos</li><li>Toda vez que a marca aparece sozinha</li><li>Em dúvida, use a Crescente</li>")
    b = col("giro", "preto", "Giro", (INK, WHITE, "SECUNDÁRIA"),
            "O mesmo crescimento (ponto · traço · linha) repetido 3× em volta do anel, com simetria de rotação. Lê como algo girando.",
            "<li>Motion, loader e telas de espera</li><li>Estampas, padrões e brindes de energia</li><li>Nunca no lugar da Crescente na assinatura oficial</li>")
    return page(5, "Duas versões", "<b>Crescente</b> assina. Giro dá movimento.",
                f'<div class="grid" style="grid-template-columns:1fr 1fr;gap:18px">{a}{b}</div>')


def p06():
    grid = "".join(f'<line x1="{x}" y1="0" x2="{x}" y2="100" stroke="rgba(224,0,90,.12)" stroke-width=".3"/>'
                   f'<line x1="0" y1="{x}" x2="100" y2="{x}" stroke="rgba(224,0,90,.12)" stroke-width=".3"/>' for x in range(0, 101, 10))
    cons = (f'<svg viewBox="0 0 100 100" width="260" height="260">{grid}'
            f'<circle cx="50" cy="50" r="22" fill="none" stroke="{PURPLE}" stroke-width=".4" stroke-dasharray="1.5 1"/>'
            f'<circle cx="50" cy="50" r="41" fill="none" stroke="{PURPLE}" stroke-width=".4" stroke-dasharray="1.5 1"/>'
            f'{S.mark("crescente", "branco")}</svg>')
    inner, w, h = S.lockup("crescente", V["branco"])
    x = 90 / 4
    prot = (f'<svg viewBox="{f(-x)} {f(-x)} {f(w + 2 * x)} {f(h + 2 * x)}" width="420">'
            f'<rect x="{f(-x)}" y="{f(-x)}" width="{f(w + 2 * x)}" height="{f(h + 2 * x)}" fill="rgba(224,0,90,.06)" stroke="{DEEP}" stroke-width=".6" stroke-dasharray="2 1.5"/>'
            f'<rect x="0" y="0" width="{f(w)}" height="{f(h)}" fill="{WHITE}"/>{inner}'
            + "".join(f'<rect x="{f(a)}" y="{f(b)}" width="{f(x)}" height="{f(x)}" fill="none" stroke="{PURPLE}" stroke-width=".5"/>'
                      f'<text x="{f(a + x / 2)}" y="{f(b + x / 2 + 3)}" font-size="8" text-anchor="middle" fill="{PURPLE}" font-family="Figtree" font-weight="700">x</text>'
                      for a, b in ((-x, -x), (w, h)))
            + '</svg>')
    mins = "".join(f'<div style="text-align:center"><div style="height:64px;display:flex;align-items:flex-end;justify-content:center">{el}</div>'
                   f'<div class="lab" style="font-size:11px">{a}</div><div class="note">{b}</div></div>'
                   for el, a, b in ((lock("branco", 24), "Horizontal", "96 px · 25 mm"), (lock("branco", 58, vertical=True), "Empilhado", "64 px · 18 mm"),
                                    (sym("branco", 32), "Símbolo", "24 px · 6 mm"), (sym("branco", 20), "Corte pequeno", "16–32 px · 3 traços")))
    return page(6, "Construção, área de proteção e mínimos", "Grid de 100, <b>x = ¼</b> do anel",
                f'<div class="row" style="gap:26px"><div class="card">{cons}<div class="note" style="max-width:260px">Anel raio médio 41, espessura 8. '
                f'Traços de 2°, 4°, 7°, 11°, 16°, 22° e 30° com vão fixo de 9°. Estrela inscrita no círculo r 22.</div></div>'
                f'<div style="flex:1"><div class="card"><div class="sub">Área de proteção</div>{prot}<div class="note">Nada entra a menos de x (¼ do diâmetro do anel) '
                f'em volta da assinatura.</div></div><div class="card" style="margin-top:14px"><div class="sub">Tamanhos mínimos</div>'
                f'<div class="grid" style="grid-template-columns:repeat(4,1fr)">{mins}</div></div></div></div>')


def p07():
    def bad(inner, bg, t):
        return (f'<div>{T(bg, inner, 122, extra="position:relative")}<div class="lab" style="font-size:11px"><span class="no">✕</span> {t}</div></div>')
    m = lambda v, **k: f'<svg viewBox="5 5 90 90" width="80" height="80" style="{k.get("st", "")}">{S.mark("crescente", v)}</svg>'
    its = [
        bad(m(dict(V["rosa"], dash=INK, line=INK, star=INK)), PINK, "Preto sobre rosa"),
        bad(m(dict(V["roxo"], dash=PINK, line=PINK, star=PINK)), PURPLE, "Rosa sobre roxo"),
        bad(m(dict(V["preto"], dash=WHITE, line=WHITE, star=PINK)), INK, "Anel branco, estrela rosa"),
        bad(m(V["branco"], st="transform:scaleX(-1)"), WHITE, "Espelhar (traços anti-horário)"),
        bad(f'<svg viewBox="5 5 90 90" width="120" height="70" preserveAspectRatio="none">{S.mark("crescente", "branco")}</svg>', WHITE, "Esticar ou achatar"),
        bad(f'<svg viewBox="5 5 90 90" width="80" height="80">{C_ring()}</svg>', WHITE, "Tirar a estrela"),
        bad(f'<div style="display:flex;align-items:center">{sym("branco", 50)}<span style="font:800 40px Gabarito;letter-spacing:-.02em;margin-left:-14px">lozzy</span></div>',
            WHITE, "Fundir o anel com o c"),
        bad(f'<div style="position:absolute;inset:0;background:url({photo(9)}) center/cover"></div><div style="position:relative">{lock("rosa", 34)}</div>',
            INK, "Sobre foto sem contraste"),
    ]
    return page(7, "Usos incorretos", "O que <b>não</b> fazer com a marca",
                f'<div class="grid" style="grid-template-columns:repeat(4,1fr);gap:16px 14px">{"".join(its)}</div>'
                f'<div class="note" style="font-size:10.5px">Também não: girar o símbolo parado (a rotação só existe como animação), trocar a ordem dos traços, '
                f'usar a Giro na assinatura oficial, colocar sombra, contorno ou degradê fora das peças digitais, escrever “Clozzy” em outra fonte.</div>')


def C_ring():
    return P.C.ring(DEEP, DEEP)


def p08():
    alts = [("Só pra quem é close.", "principal · exclusividade + close friends"),
            ("Seu close vale ouro.", "campanha para creators · valor"),
            ("Seu conteúdo. Seu preço.", "manifesto · controle"),
            ("Fica close.", "chamada curta · CTA de assinatura")]
    alt = "".join(f'<div style="display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid rgba(20,9,15,.1);padding:8px 0">'
                  f'<span style="font:800 italic 17px Gabarito">{a}</span><span class="note" style="margin:0">{b}</span></div>' for a, b in alts)
    t1 = '<div>' + slogan(50, WHITE, PINK, br=True) + '<div style="margin-top:16px">' + lock("preto", 28) + '</div></div>'
    t2 = '<div style="text-align:center">' + sym("rosa", 70) + '<div style="margin-top:12px">' + slogan(30, WHITE, WHITE) + '</div></div>'
    t3 = ('<div style="text-align:center">' + lock("branco", 30) + '<div style="margin-top:12px">' + slogan(24, INK, DEEP)
          + '</div><div class="note">' + P.APOIO + '</div></div>')
    return page(8, "Slogan", "Só pra quem é <b>close.</b>",
                f'<div class="grid" style="grid-template-columns:1.2fr 1fr 1fr;gap:14px">'
                f'{T(INK, t1, 236)}{T(PINK, t2, 236)}{T(WHITE, t3, 236)}</div>'
                f'<div class="grid" style="grid-template-columns:1fr 1fr;gap:26px;margin-top:4px"><div style="font-size:11px;line-height:1.55">'
                f'<div class="sub">Por quê</div>Clozzy vende conteúdo exclusivo. “Close” é a palavra que o público já usa para o círculo fechado do '
                f'Instagram; “só pra quem é” deixa claro que tem porta, e que a porta é a assinatura. Para o creator, '
                f'o slogan fala de valor; para o assinante, de pertencer.'
                f'<div class="sub" style="margin-top:12px">Como escrever</div><ul class="rl"><li>Gabarito 800 itálico, “close” na cor do anel (rosa no preto, Deep no claro)</li>'
                f'<li>No rosa e no roxo, tudo branco</li><li>Linha de apoio: <b>{P.APOIO}</b> em Figtree</li></ul></div>'
                f'<div><div class="sub">Alternativas para campanha</div>{alt}</div></div>')


def p09():
    cores = [("Pink Clozzy", PINK, "255 · 0 · 101", "0 100 40 0", "Cor da marca. Anel no preto, superfícies, CTA."),
             ("Pink Deep", DEEP, "224 · 0 · 90", "0 100 45 8", "Símbolo no claro, textos de destaque, impressos."),
             ("Roxo", PURPLE, "124 · 72 · 196", "60 75 0 0", "Superfície secundária, depoimentos, alternância."),
             ("Ink", INK, "20 · 9 · 15", "70 80 60 90", "Fundo principal do app e das peças noturnas."),
             ("Cream", CREAM, "255 · 246 · 240", "0 3 5 0", "Fundo claro quente, documentos, cards."),
             ("Branco", WHITE, "255 · 255 · 255", "0 0 0 0", "Marca sobre rosa, roxo e Deep; textos no preto.")]
    sw = "".join(f'<div><div class="tl{" bd" if c in (WHITE, CREAM) else ""}" style="background:{c};height:150px;align-items:flex-end;justify-content:flex-start;padding:12px">'
                 f'<span style="font:800 italic 15px Gabarito;color:{WHITE if c in (PINK, DEEP, PURPLE, INK) else INK}">{n}</span></div>'
                 f'<div class="note" style="margin-top:7px;font-size:9.5px;opacity:.9"><b style="font:700 10px ui-monospace,monospace">{c}</b><br>RGB {r}<br>CMYK {k}</div>'
                 f'<div class="note">{u}</div></div>' for n, c, r, k, u in cores)
    prop = "".join(f'<div style="flex:{w};background:{c};height:30px;{"border:1px solid rgba(20,9,15,.08);" if c in (WHITE, CREAM) else ""}"></div>'
                   for c, w in ((INK, 40), (PINK, 22), (CREAM, 18), (WHITE, 10), (DEEP, 6), (PURPLE, 4)))
    return page(9, "Cores principais", "Seis cores, <b>só</b> essas",
                f'<div class="grid" style="grid-template-columns:repeat(6,1fr)">{sw}</div>'
                f'<div class="sub" style="margin-top:6px">Proporção numa peça típica</div><div style="display:flex;border-radius:10px;overflow:hidden">{prop}</div>'
                f'<div class="note">Ink 40 · Pink 22 · Cream 18 · Branco 10 · Deep 6 · Roxo 4. Sem outras cores, sem paletas multicoloridas. '
                f'Degradê só Deep → Pink, só no digital.</div>')


def p10():
    combos = "".join(f'<div>{T(v["bg"], sym(v, 62), 92)}<div class="lab" style="font-size:10.5px">{v["name"]}</div></div>' for v in P.C.VARS)
    pares = [(WHITE, INK, "Branco no ink"), (PINK, INK, "Rosa no ink"), (WHITE, DEEP, "Branco no Deep"), (WHITE, PURPLE, "Branco no roxo"),
             (WHITE, PINK, "Branco no rosa"), (INK, CREAM, "Ink no cream"), (DEEP, CREAM, "Deep no cream"), (DEEP, WHITE, "Deep no branco")]
    rows = "".join(f'<tr><td><span style="display:inline-block;width:46px;height:20px;border-radius:5px;background:{b};color:{a};font:800 11px/20px Gabarito;'
                   f'text-align:center;{"border:1px solid rgba(20,9,15,.1)" if b in (WHITE, CREAM) else ""}">Aa</span></td><td>{n}</td>'
                   f'<td style="font-family:ui-monospace,monospace">{P.contrast(a, b):.2f}</td>'
                   f'<td>{"<span class=ok>AA · qualquer texto</span>" if P.contrast(a, b) >= 4.5 else "<span style=color:#B7791F;font-weight:800>só texto ≥ 18 px bold</span>"}</td></tr>'
                   for a, b, n in pares)
    return page(10, "Combinações e contraste", "No preto, anel rosa. No rosa, <b>tudo branco</b>.",
                f'<div class="row" style="gap:22px"><div class="grid" style="grid-template-columns:repeat(4,1fr);gap:10px;flex:1.3">{combos}</div>'
                f'<div class="card" style="flex:1"><div class="sub">Contraste (WCAG)</div><table style="width:100%;font-size:10px;border-collapse:collapse">'
                f'<tr style="opacity:.55;text-align:left"><th></th><th>par</th><th>razão</th><th>uso</th></tr>{rows}</table>'
                f'<div class="note">Rosa e roxo nunca um sobre o outro. Nada preto sobre rosa. Bicolor (traços brancos + linha rosa) só no preto.</div></div></div>')


def p11():
    escala = [("Display", "800 itálico · 56/1,0 · −3%", 44, "800 italic", "Só pra quem é close."),
              ("H1", "800 itálico · 36/1,05", 30, "800 italic", "Seu conteúdo. Seu preço."),
              ("H2", "800 · 24/1,1", 21, "800", "3 passos pra faturar"),
              ("Corpo", "Figtree 500 · 15/1,5", 13, "500", "Fotos, vídeos e stories só para quem assina. Você define o preço."),
              ("Legenda", "Figtree 600 · 11/1,4", 10.5, "600", "1.240 assinantes · R$ 29,90/mês")]
    rows = "".join(f'<div style="display:flex;gap:18px;align-items:baseline;border-top:1px solid rgba(20,9,15,.1);padding:8px 0">'
                   f'<div style="width:70px"><b style="font:800 11px Gabarito">{a}</b><div class="note" style="margin:0">{b}</div></div>'
                   f'<div style="font:{w} {px}px/{1.1 if px > 14 else 1.45} {"Figtree" if a in ("Corpo", "Legenda") else "Gabarito"};letter-spacing:{"-.03em" if px > 20 else "0"}">{t}</div></div>'
                   for a, b, px, w, t in escala)
    return page(11, "Tipografia", "Gabarito para falar alto, <b>Figtree</b> para explicar",
                f'<div class="row" style="gap:26px"><div style="flex:.8"><div style="font:800 140px/0.9 Gabarito;letter-spacing:-.04em">Aa<span style="color:{DEEP}">Gg</span></div>'
                f'<div class="lab">Gabarito · 800 (e itálico sintético nos títulos)</div><div class="note">Títulos, slogan, números, botões. A palavra clozzy é Gabarito 800 com aperto −18.</div>'
                f'<div style="font:500 52px/1 Figtree;margin-top:16px">Aa<span style="color:{DEEP}">Gg</span></div><div class="lab">Figtree · 400–700</div>'
                f'<div class="note">Corpo, legendas, interface. Fallback: system-ui.</div></div><div style="flex:1.3">{rows}'
                f'<ul class="rl" style="margin-top:10px"><li>Uma palavra de destaque por título, na cor do anel</li><li>Sem caixa-alta em frases; caixa-alta só em rótulos curtos com espaçamento +9%</li>'
                f'<li>Nunca escrever “Clozzy” com outra fonte no lugar da assinatura</li></ul></div></div>')


def p12():
    pat_giro = "".join(f'<div style="position:absolute;left:{(i % 6) * 64 - 20 + (32 if (i // 6) % 2 else 0)}px;top:{(i // 6) * 64 - 16}px">{sym("rosa", 44, "giro")}</div>'
                       for i in range(36))
    its = [
        item(T(INK, f'<div>{faixa(PINK, 9, 1.1)}<div style="height:12px"></div>{faixa(WHITE, 9, 1.1)}</div>', 150), "Faixa crescente",
             "O anel desenrolado: divisor, sublinhado de destaque, rodapé de post. Sempre cresce para a direita."),
        item(T(PINK, pat_giro, 150), "Padrão Giro", "Giro repetido em grade alternada, branco a 100% no rosa. Estampas, embalagens, fundos."),
        item(T(PINK, f'<div style="position:absolute;right:-60px;bottom:-60px">{sym("rosa", 220)}</div>'
                     f'<div style="position:absolute;left:18px;top:18px;font:800 italic 26px/1 Gabarito;color:#fff">Símbolo<br>cortado</div>', 150),
             "Símbolo cortado", "A Crescente gigante saindo pela borda, no máximo 40% fora. Capas e posts manifesto."),
        item(T(INK, f'<div style="display:flex;gap:10px;align-items:center">{P.ring_avatar(2, 90, PINK, INK)}{P.ring_avatar(6, 70, WHITE, INK, "giro")}</div>', 150),
             "Anel em foto", "O anel em volta de uma foto redonda = conteúdo novo. Crescente para perfil, Giro para “ao vivo”."),
        item(T(CREAM, f'<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;max-width:220px">'
                      + "".join(btn(t, bg, c, 11) for t, bg, c in (("✦ Exclusivo", PINK, WHITE), ("Novo", INK, WHITE), ("Close", DEEP, WHITE), ("🔒 Assinantes", WHITE, INK)))
                      + '</div>', 150), "Selos e chips", "Pílulas cheias com Gabarito 800. Rosa para exclusivo, ink para novo."),
        item(T(INK, f'<div style="width:220px"><div style="height:10px;border-radius:5px;background:rgba(255,255,255,.12);position:relative;overflow:hidden">'
                    f'<div style="position:absolute;inset:0">{faixa(PINK, 10, 1, (2, 5, 10, 18), 40)}</div></div>'
                    f'<div class="note" style="color:#fff;margin-top:8px">Enviando vídeo… 62%</div></div>', 150),
             "Barra de progresso", "A faixa crescente como progresso de upload e de meta de assinantes."),
    ]
    return page(12, "Elementos gráficos", "O anel <b>desenrola</b> e vira o resto do sistema",
                f'<div class="grid" style="grid-template-columns:repeat(3,1fr);gap:16px 14px">{"".join(its)}</div>')


def p13():
    ph = "".join(f'<div>{T(INK, inner, 196)}<div class="lab" style="font-size:11px">{a}</div><div class="note">{b}</div></div>' for inner, a, b in (
        (f'<div style="position:absolute;inset:0;background:url({photo(1)}) center/cover"></div>', "Original", "Gente real, luz de quarto ou de rua, cor quente."),
        (f'<div style="position:absolute;inset:0;background:url({photo(5)}) center/cover"></div><div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(20,9,15,.9))"></div>'
         f'<div style="position:absolute;left:12px;bottom:12px">{lock("preto", 18)}</div>', "Degradê ink", "Base escura para texto e assinatura."),
        (f'<div style="position:absolute;inset:0;background:url({photo(7)}) center/cover;filter:blur(7px);transform:scale(1.1)"></div>'
         f'<div style="position:relative;width:64px;height:64px;border-radius:50%;background:rgba(20,9,15,.55);display:flex;align-items:center;justify-content:center">{icon("cadeado", WHITE, 32)}</div>',
         "Bloqueado", "Conteúdo de assinante: desfoque 7 px + cadeado."),
        (f'<div style="position:absolute;inset:0;background:url({photo(3)}) center/cover"></div><div style="position:absolute;left:12px;top:12px">{faixa(WHITE, 5, .7)}</div>'
         f'<div style="position:absolute;right:12px;bottom:12px">{sym("mono-branco", 32)}</div>', "Com faixa e selo", "Faixa no topo, símbolo no canto oposto.")))
    ics = "".join(f'<div style="display:flex;flex-direction:column;align-items:center;gap:5px"><div style="width:46px;height:46px;border-radius:14px;'
                  f'background:{INK};display:flex;align-items:center;justify-content:center">{icon(n, PINK, 24)}</div><span class="note" style="margin:0">{n}</span></div>'
                  for n in P.ICONS)
    return page(13, "Fotografia e ícones", "Gente de verdade, <b>perto</b>",
                f'<div class="grid" style="grid-template-columns:repeat(4,1fr)">{ph}</div>'
                f'<div class="row" style="gap:22px;margin-top:4px"><div class="card" style="flex:1"><div class="sub">Ícones · grid 24, linha 2, pontas redondas</div>'
                f'<div style="display:grid;grid-template-columns:repeat(12,1fr);gap:6px">{ics}</div></div>'
                f'<div class="card" style="width:270px"><div class="sub">Fotos</div><ul class="rl"><li>Enquadramento de story: vertical, perto, olhar na câmera</li>'
                f'<li>Nunca foto de banco com cara de corporativo</li><li>Conteúdo sensível sempre desfocado fora da área de assinante</li></ul></div></div>')


def p14():
    pares = [("Seu conteúdo merece assinatura.", "Monetize seus ativos digitais com nossa solução."),
             ("Caiu o Pix ✦ R$ 29,90 da @lua.b", "Transação aprovada com sucesso."),
             ("Esse é só pro close. Assina pra ver.", "Conteúdo restrito. Faça login."),
             ("Bora postar o primeiro?", "Você ainda não possui publicações.")]
    rows = "".join(f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;border-top:1px solid rgba(20,9,15,.1);padding:8px 0;font-size:11px">'
                   f'<div><span class="ok">✓</span> {a}</div><div style="opacity:.6"><span class="no">✕</span> {b}</div></div>' for a, b in pares)
    sl = "".join(f'<div style="margin-top:10px"><div style="display:flex;justify-content:space-between;font:700 9.5px Figtree;opacity:.6"><span>{a}</span><span>{b}</span></div>'
                 f'<div style="height:6px;border-radius:3px;background:rgba(20,9,15,.1);position:relative;margin-top:4px">'
                 f'<div style="position:absolute;left:{p}%;top:-4px;width:14px;height:14px;border-radius:50%;background:{PINK}"></div></div></div>'
                 for a, b, p in (("formal", "casual", 74), ("sério", "brincalhão", 58), ("técnico", "humano", 82), ("discreto", "ousado", 64)))
    return page(14, "Voz e tom", "Fala como a <b>amiga</b> que entende de dinheiro",
                f'<div class="row" style="gap:26px"><div style="flex:.8"><div style="font:800 italic 17px/1.3 Gabarito">Próxima, <span style="color:{DEEP}">não forçada</span><br>'
                f'Direta, <span style="color:{DEEP}">não seca</span><br>Confiante, <span style="color:{DEEP}">não arrogante</span></div>{sl}'
                f'<ul class="rl" style="margin-top:14px"><li>Você, nunca “o usuário”</li><li>Dinheiro com número: “R$ 29,90”, não “valores”</li>'
                f'<li>✦ é o único símbolo decorativo no texto</li><li>Sem duplo sentido sobre o conteúdo; a marca é segura</li></ul></div>'
                f'<div style="flex:1.2"><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px" class="sub"><span>Assim</span><span>Assim não</span></div>{rows}</div></div>')


def p15():
    def frames(kind, n, fn):
        return "".join(f'<div style="text-align:center">{T(INK, fn(i), 92, 92)}<div class="note">{t}</div></div>' for i, t in n)
    pv = V["preto"]

    def build_on(i):
        lens = P.C.LENS
        k = [1, 3, 5, 7, 8][i]
        import math
        w, rm, gap = P.C.W, P.C.RM, P.C.GAP
        cap = math.degrees(w / rm)
        a, out = -90 + gap / 2, []
        for j, L in enumerate(lens):
            if j < k:
                out.append(P.C.arc(PINK, w, rm, a, a + L + cap))
            a += L + cap + gap
        if k == 8:
            out.append(P.C.arc(PINK, w, rm, a, 270 - gap / 2))
        st = P.C.star(WHITE, P.C.STAR_FIT) if i >= 2 else ""
        return f'<svg viewBox="5 5 90 90" width="64" height="64">{"".join(out)}{st}</svg>'

    def rot(i):
        return f'<svg viewBox="5 5 90 90" width="64" height="64"><g transform="rotate({i * 40} 50 50)">{S.giro_ring(PINK)}</g>{P.C.star(WHITE, P.C.STAR_FIT)}</svg>'
    a = frames("c", [(0, "0 ms"), (1, "120"), (2, "240"), (3, "360"), (4, "480 · linha fecha")], build_on)
    b = frames("g", [(0, "0°"), (1, "40°"), (2, "80°"), (3, "120° = volta")], rot)
    tbl = "".join(f'<tr><td style="padding:4px 10px 4px 0"><code style="margin:0">{a}</code></td><td>{b}</td><td style="opacity:.6">{c}</td></tr>' for a, b, c in (
        ("--dur-rapido", "120 ms", "hover, toque, chip"), ("--dur-base", "240 ms", "cards, modais"), ("--dur-crescer", "480 ms", "a Crescente se montando"),
        ("--dur-giro", "1,2 s / 120°", "loader Giro (volta lê em 1/3)"), ("--ease", "cubic-bezier(.2,.8,.2,1)", "tudo que entra")))
    return page(15, "Motion", "Assinatura de movimento: <b>o anel cresce</b>",
                f'<div class="row" style="gap:24px"><div class="card" style="flex:1"><div class="sub">Crescente · entrada da marca (480 ms)</div>'
                f'<div class="row" style="gap:10px">{a}</div><div class="note">Os traços aparecem um a um, do menor ao maior, a linha fecha e a estrela entra com '
                f'escala 0,8 → 1. Usar em splash, abertura de vídeo e fim de story.</div></div>'
                f'<div class="card" style="flex:.8"><div class="sub">Giro · loader</div><div class="row" style="gap:10px">{b}'
                f'<div style="text-align:center">{T(PINK, sym("rosa", 64, "giro", spin=True), 92, 92)}<div class="note">no HTML gira</div></div></div>'
                f'<div class="note">Rotação linear contínua; a estrela fica parada. Por simetria, 120° já é uma volta completa.</div></div></div>'
                f'<div class="card"><div class="sub">Tokens</div><table style="font-size:10px;border-collapse:collapse">{tbl}</table>'
                f'<div class="note">Com “reduzir movimento” ligado: sem giro (Crescente parada) e transições de opacidade apenas.</div></div>')


def p16():
    dark = (f'<div style="background:{INK};border-radius:18px;padding:18px;color:{WHITE};flex:1"><div class="sub" style="color:#fff">No preto (app)</div>'
            f'<div style="display:flex;gap:8px;flex-wrap:wrap">{btn("Assinar · R$ 29,90", PINK, WHITE, 12)}{btn("Seguir", "rgba(255,255,255,.1)", WHITE, 12)}'
            f'{btn("Ver planos", "transparent", WHITE, 12, border="1.5px solid rgba(255,255,255,.3)")}</div>'
            f'<div style="display:flex;gap:6px;margin-top:12px">' + "".join(btn(t, bg, WHITE, 10) for t, bg in (("✦ Exclusivo", PINK), ("Novo", "rgba(255,255,255,.12)"), ("Vídeo", "rgba(255,255,255,.12)"))) +
            f'</div><div style="display:flex;gap:12px;margin-top:14px">'
            f'<div style="width:150px;border-radius:14px;overflow:hidden;background:#241820"><div style="height:150px;background:url({photo(11)}) center/cover;filter:blur(6px)"></div>'
            f'<div style="padding:9px;font-size:10px"><b style="font:800 12px Gabarito">Bastidores do ensaio</b><div style="opacity:.6;margin-top:2px">🔒 só assinantes</div></div></div>'
            f'<div style="flex:1;border-radius:14px;background:#241820;padding:14px"><div style="display:flex;gap:10px;align-items:center">{P.ring_avatar(4, 54, PINK, "#241820")}'
            f'<div><b style="font:800 13px Gabarito">@bia.creator</b><div style="font-size:10px;opacity:.6">1.240 assinantes</div></div></div>'
            f'<div style="margin-top:12px;font:800 26px Gabarito">R$ 37.076<span style="font:500 11px Figtree;opacity:.6"> /mês</span></div>'
            f'<div style="margin-top:8px">{faixa(PINK, 6, .9)}</div><div style="font-size:9.5px;opacity:.6;margin-top:6px">Meta de 1.500 assinantes · 83%</div></div></div></div>')
    light = (f'<div class="card" style="flex:.8;padding:18px"><div class="sub">No claro (site, painel)</div>'
             f'<div style="display:flex;gap:8px;flex-wrap:wrap">{btn("Criar meu Clozzy", PINK, WHITE, 12)}{btn("Falar com a gente", INK, WHITE, 12)}'
             f'{btn("Saiba mais", "transparent", INK, 12, border="1.5px solid rgba(20,9,15,.2)")}</div>'
             f'<div style="margin-top:14px;border:1.5px solid rgba(20,9,15,.15);border-radius:12px;padding:10px 12px;font-size:11px;opacity:.7">seu@email.com</div>'
             f'<div style="margin-top:10px;border:2px solid {DEEP};border-radius:12px;padding:10px 12px;font-size:11px">R$ 29,90 <span style="opacity:.5">/ mês</span></div>'
             f'<div style="display:flex;gap:10px;margin-top:14px">' + "".join(
                 f'<div style="flex:1;background:{MIST};border-radius:12px;padding:10px"><div style="font:800 22px Gabarito">{n}</div><div class="note" style="margin:0">{t}</div></div>'
                 for n, t in (("1.240", "assinantes"), ("312", "posts"), ("98%", "renovam"))) +
             f'</div><div class="note" style="margin-top:12px">Raios: botão 999 px, card 14–18 px, input 12 px. Sombra só em itens flutuantes.</div></div>')
    return page(16, "Interface", "Botões, chips e <b>cards</b>", f'<div class="row" style="gap:16px">{dark}{light}</div>')


def p17():
    thumbs = "".join(f'<div>{P.scaled(fn(), 1080, 1080, 168, 10)}<div class="note" style="font-weight:700;margin-top:5px">{n}</div></div>' for s, n, fn in P.POSTS)
    return page(17, "Redes · feed", "Nove templates de post <b>1080 × 1080</b>",
                f'<div class="row" style="gap:22px"><div class="grid" style="grid-template-columns:repeat(5,1fr);gap:10px 12px;flex:1">{thumbs}</div>'
                f'<div style="width:210px"><div class="sub">Regras do feed</div><ul class="rl"><li>Margem de 90 px; assinatura sempre num canto</li>'
                f'<li>Um título por post, uma palavra na cor do anel</li><li>Alternar ink / rosa / cream / foto: nunca dois rosas seguidos</li>'
                f'<li>Giro só em teaser e “em breve”</li><li>Faixa crescente no rodapé ou como sublinhado</li></ul>'
                f'<div class="note" style="margin-top:10px">PNGs em <code>posts/</code></div></div></div>')


def p18():
    st = "".join(f'<div>{P.scaled(fn(), 1080, 1920, 150, 14)}<div class="note" style="font-weight:700;margin-top:5px">{n}</div></div>' for s, n, fn in P.STORIES)
    zones = (f'<div style="width:150px;height:266px;border-radius:14px;border:1px solid rgba(20,9,15,.15);position:relative;background:{WHITE}">'
             f'<div style="position:absolute;left:0;right:0;top:0;height:35px;background:rgba(224,0,90,.12);font:700 8px Figtree;color:{DEEP};padding:6px">250 px · barras e perfil</div>'
             f'<div style="position:absolute;left:0;right:0;bottom:0;height:35px;background:rgba(224,0,90,.12);font:700 8px Figtree;color:{DEEP};padding:6px">250 px · responder</div>'
             f'<div style="position:absolute;inset:35px 11px;border:1.5px dashed {DEEP};border-radius:8px;display:flex;align-items:center;justify-content:center;font:700 9px Figtree;color:{DEEP}">área segura</div></div>')
    return page(18, "Redes · stories", "Stories <b>1080 × 1920</b>",
                f'<div class="row" style="gap:16px">{st}<div style="margin-left:10px"><div class="sub">Zonas seguras</div>{zones}'
                f'<div class="note" style="max-width:160px">As barras de progresso já desenham a faixa crescente no topo: use isso a favor.</div>'
                f'<div class="note">PNGs em <code>stories/</code></div></div></div>')


def p19():
    grid = "".join(P.scaled(fn(), 1080, 1080, 78, 0, False) for _s, _n, fn in P.POSTS)
    hls = "".join(f'<div style="text-align:center;font:600 9px Figtree;color:{WHITE}"><div style="width:52px;height:52px;border-radius:50%;border:1.5px solid rgba(255,255,255,.25);padding:3px">'
                  f'<div style="width:100%;height:100%;border-radius:50%;background:{bg};display:flex;align-items:center;justify-content:center">{el}</div></div><div style="margin-top:4px">{n}</div></div>'
                  for n, bg, el in (("Novos", PINK, sym("rosa", 26)), ("Pix", INK, icon("pix", PINK, 20)), ("Creators", PURPLE, icon("usuarios", WHITE, 20)),
                                    ("Como", CREAM, sym("cream", 26, "giro")), ("Dúvidas", INK, icon("chat", PINK, 20))))
    prof = (f'<div style="width:250px;background:{INK};border-radius:22px;padding:16px 14px;color:{WHITE}">'
            f'<div style="display:flex;gap:14px;align-items:center"><div style="width:74px;height:74px;border-radius:50%;background:{INK};border:2px solid rgba(255,255,255,.15);'
            f'display:flex;align-items:center;justify-content:center">{sym("preto", 46)}</div>'
            + "".join(f'<div style="text-align:center"><b style="font:800 14px Gabarito">{a}</b><div style="font-size:9px;opacity:.6">{b}</div></div>'
                      for a, b in (("312", "posts"), ("48 mil", "seguidores"), ("27", "seguindo"))) +
            f'</div><div style="margin-top:10px;font:800 12px Gabarito">Clozzy</div><div style="font-size:10px;line-height:1.4;opacity:.8">Só pra quem é close. ✦<br>'
            f'Venda seu conteúdo exclusivo.<br><span style="color:{PINK}">clozzy.com</span></div>'
            f'<div style="display:flex;gap:10px;margin-top:12px">{hls}</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin:12px -14px 0">{grid}</div></div>')
    av = "".join(f'<div style="text-align:center"><div style="width:96px;height:96px;border-radius:50%;background:{V[s]["bg"]};display:flex;align-items:center;justify-content:center;'
                 f'{"border:1px solid rgba(20,9,15,.1)" if s == "cream" else ""}">{sym(s, 56)}</div><div class="note">{V[s]["name"].split(" ·")[0]}</div></div>'
                 for s in ("preto", "rosa", "cream"))
    capa = (f'<div style="width:420px;height:105px;border-radius:12px;background:{PINK};position:relative;overflow:hidden">'
            f'<div style="position:absolute;right:-30px;top:-50px;opacity:.18">{sym("rosa", 210, "giro")}</div>'
            f'<div style="position:absolute;left:18px;top:24px">{lock("rosa", 30)}</div><div style="position:absolute;left:18px;bottom:16px">{slogan(17, WHITE, WHITE)}</div></div>')
    yt = (f'<div style="width:420px;height:70px;border-radius:12px;background:{INK};position:relative;overflow:hidden;display:flex;align-items:center;padding:0 18px;gap:16px">'
          f'{lock("preto", 26)}<div style="flex:1">{faixa(PINK, 6, .9)}</div></div>')
    og = (f'<div style="width:420px;height:150px;border-radius:12px;overflow:hidden;background:{CREAM};border:1px solid rgba(20,9,15,.08);position:relative">'
          f'<div style="position:absolute;left:18px;top:18px">{lock("cream", 22)}</div><div style="position:absolute;left:18px;top:56px">{slogan(30, INK, DEEP, br=True)}</div>'
          f'<div style="position:absolute;right:18px;top:24px;width:80px;height:100px;border-radius:10px;background:url({photo(3)}) center/cover"></div></div>')
    return page(19, "Perfil, destaques e capas", "A marca vive na <b>bandeja</b> de stories",
                f'<div class="row" style="gap:24px">{prof}<div><div class="sub">Foto de perfil · símbolo a 58%</div><div class="row" style="gap:12px">{av}</div>'
                f'<div class="sub" style="margin-top:16px">Capas · LinkedIn / X · YouTube · link (Open Graph)</div>{capa}<div style="height:10px"></div>{yt}'
                f'<div style="height:10px"></div>{og}</div></div>')


def phone(inner, bg, w=176, h=356):
    return (f'<div style="width:{w}px;height:{h}px;border-radius:26px;background:{bg};position:relative;overflow:hidden;'
            f'border:4px solid #1c1218;box-shadow:0 10px 26px rgba(20,9,15,.2);flex-shrink:0">{inner}</div>')


def p20():
    splash = phone(f'<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">{sym("rosa", 100, spin=True)}</div>'
                   f'<div style="position:absolute;left:0;right:0;bottom:40px;display:flex;flex-direction:column;align-items:center;gap:8px">{lock("rosa", 20)}'
                   f'<div style="font:800 italic 11px Gabarito;color:#fff">Só pra quem é close.</div></div>', PINK)
    tray = "".join(f'<div style="text-align:center;font:600 7.5px Figtree;color:#fff">{P.ring_avatar(i, 40, c, INK, k)}<div style="margin-top:2px">{n}</div></div>'
                   for i, c, k, n in ((1, PINK, "crescente", "bia"), (2, PINK, "giro", "ao vivo"), (5, "rgba(255,255,255,.3)", "crescente", "lua.b"), (9, PINK, "crescente", "mari")))
    feed = phone(f'<div style="padding:26px 10px 0">{lock("preto", 16)}<div style="display:flex;gap:7px;margin-top:12px">{tray}</div>'
                 f'<div style="height:170px;border-radius:14px;margin-top:12px;background:url({photo(7)}) center/cover;position:relative;overflow:hidden">'
                 f'<div style="position:absolute;inset:0;backdrop-filter:blur(8px);background:rgba(20,9,15,.3);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px">'
                 f'{icon("cadeado", WHITE, 26)}{btn("Assinar · R$ 29,90", PINK, WHITE, 9)}</div></div>'
                 f'<div style="font:800 11px Gabarito;color:#fff;margin-top:8px">@mari · bastidores</div></div>'
                 f'<div style="position:absolute;left:0;right:0;bottom:0;height:44px;background:#0d0609;display:flex;justify-content:space-around;align-items:center">'
                 f'{icon("estrela", "rgba(255,255,255,.5)", 18)}{icon("olho", "rgba(255,255,255,.5)", 18)}{sym("preto", 26)}{icon("chat", "rgba(255,255,255,.5)", 18)}{icon("carteira", "rgba(255,255,255,.5)", 18)}</div>', INK)
    perfil = phone(f'<div style="height:110px;background:url({photo(11)}) center/cover"></div><div style="position:absolute;left:12px;top:78px">{P.ring_avatar(11, 64, PINK, INK)}</div>'
                   f'<div style="padding:40px 12px 0;color:#fff"><b style="font:800 13px Gabarito">Bia Creator</b><div style="font-size:9px;opacity:.6">@bia.creator · 1.240 assinantes</div>'
                   f'<div style="margin-top:10px">{btn("Assinar · R$ 29,90/mês", PINK, WHITE, 10, "9px 0").replace("inline-block", "block;text-align:center")}</div>'
                   f'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:3px;margin-top:10px">'
                   + "".join(f'<div style="height:52px;border-radius:5px;background:url({photo(i)}) center/cover;filter:blur({0 if j == 0 else 5}px)"></div>'
                             for j, i in enumerate((11, 1, 3, 5, 9, 7))) + '</div></div>', INK)
    notif = phone(f'<div style="text-align:center;color:#fff;margin-top:34px;font:800 46px Gabarito;letter-spacing:-.03em">21:04</div>'
                  f'<div style="text-align:center;color:#fff;font-size:9px;opacity:.7">terça, 11 de novembro</div>'
                  + "".join(f'<div style="margin:{14 if k == 0 else 6}px 8px 0;background:rgba(255,255,255,.14);border-radius:14px;padding:9px;display:flex;gap:8px;align-items:center;color:#fff">'
                            f'<div style="border-radius:7px;overflow:hidden;line-height:0">{tile("rosa", 26)}</div><div style="font-size:8.5px;line-height:1.35"><b style="font:800 9.5px Gabarito">Clozzy</b><br>{t}</div></div>'
                            for k, t in enumerate(("Caiu o Pix ✦ R$ 29,90 de @lua.b", "A Bia postou um conteúdo só pro close", "Você bateu 1.000 assinantes 🎉"))),
                  f"linear-gradient(170deg,{PURPLE},{INK} 70%)")
    icons = "".join(f'<div style="text-align:center">{tile(s, 58)}<div class="note">{s}</div></div>' for s in ("rosa", "preto", "roxo"))
    icons += "".join(f'<div style="text-align:center">{tile(s, 58, "giro")}<div class="note">giro · {s}</div></div>' for s in ("rosa",))
    return page(20, "App", "Splash, feed, perfil e <b>notificação</b>",
                f'<div class="row" style="gap:14px">{splash}{feed}{perfil}{notif}<div><div class="sub">Ícones</div>'
                f'<div class="grid" style="grid-template-columns:1fr 1fr;gap:8px">{icons}</div><div class="note" style="max-width:140px;margin-top:10px">'
                f'Ícone oficial: Crescente no rosa. O Giro aparece como ícone alternativo em datas especiais.</div></div></div>')


# ---------- merch -------------------------------------------------------------------------------------
def g_sym(v, x, y, size, kind="crescente"):
    v = V[v] if isinstance(v, str) else v
    return f'<g transform="translate({f(x)} {f(y)}) scale({size / 90:.4f}) translate(-5 -5)">{S.mark(kind, v)}</g>'


def g_lock(v, x, y, h, kind="crescente", vertical=False):
    v = V[v] if isinstance(v, str) else v
    inner, w, hh = S.lockup(kind, v, vertical)
    return f'<g transform="translate({f(x)} {f(y)}) scale({h / hh:.4f})">{inner}</g>', w * h / hh


def xicara(cup, saucer, art, w=190):
    """Xícara com pires, vista de frente."""
    return (f'<svg viewBox="0 0 200 170" width="{w}" height="{w * .85:.0f}">'
            f'<ellipse cx="96" cy="150" rx="88" ry="13" fill="{saucer}" stroke="rgba(20,9,15,.12)"/>'
            f'<ellipse cx="96" cy="146" rx="60" ry="7" fill="rgba(20,9,15,.08)"/>'
            f'<path d="M150 62 C186 62 186 112 146 112" fill="none" stroke="{cup}" stroke-width="12"/>'
            f'<path d="M150 62 C186 62 186 112 146 112" fill="none" stroke="rgba(20,9,15,.08)" stroke-width="12"/>'
            f'<path d="M30 40 H162 L152 118 C148 136 130 146 96 146 C62 146 44 136 40 118 Z" fill="{cup}" stroke="rgba(20,9,15,.1)"/>'
            f'<ellipse cx="96" cy="40" rx="66" ry="10" fill="{cup}" stroke="rgba(20,9,15,.12)"/>'
            f'<ellipse cx="96" cy="41" rx="58" ry="7" fill="#3a2316"/>{art}</svg>')


def caneca(body, art, w=150):
    return (f'<svg viewBox="0 0 170 160" width="{w}" height="{w * 160 / 170:.0f}"><path d="M120 40 C158 40 158 112 120 112" fill="none" stroke="{body}" stroke-width="13"/>'
            f'<path d="M120 40 C158 40 158 112 120 112" fill="none" stroke="rgba(20,9,15,.1)" stroke-width="13"/>'
            f'<rect x="16" y="18" width="110" height="128" rx="12" fill="{body}" stroke="rgba(20,9,15,.1)"/>'
            f'<rect x="16" y="18" width="18" height="128" rx="9" fill="rgba(255,255,255,.12)"/>{art}</svg>')


def p21():
    its = [
        (xicara(WHITE, WHITE, g_sym("branco", 72, 62, 50)), "Xícara branca", "Porcelana com a Crescente Deep. Café da equipe e kit creator."),
        (xicara(INK, INK, g_sym("preto", 72, 62, 50)), "Xícara preta", "Anel rosa, estrela branca. A principal."),
        (xicara(PINK, WHITE, g_sym("rosa", 72, 62, 50, "giro")), "Xícara rosa · Giro", "Pires branco, xícara rosa, Giro branco."),
        (caneca(INK, g_lock("preto", 32, 72, 18)[0] + f'<g transform="translate(32 104) scale(.45)">{P.C.pattern_row(PINK, 0, 8, 6, (2, 5, 10, 18, 30), 40)[0]}</g>'),
         "Caneca preta", "Assinatura + faixa crescente."),
        (caneca(PURPLE, g_sym("roxo", 40, 50, 62)), "Caneca roxa", "Símbolo branco grande."),
        (caneca(CREAM, f'<text x="71" y="70" text-anchor="middle" font-family="Gabarito" font-weight="800" font-style="italic" font-size="15" fill="{INK}">Só pra quem</text>'
                       f'<text x="71" y="88" text-anchor="middle" font-family="Gabarito" font-weight="800" font-style="italic" font-size="15" fill="{DEEP}">é close.</text>'
                       + g_sym("cream", 60, 104, 22)), "Caneca slogan", "Cream com o slogan, “close” em Deep."),
        (f'<svg viewBox="0 0 120 170" width="104" height="148"><path d="M22 20 H98 L90 160 H30 Z" fill="{PINK}"/><rect x="18" y="10" width="84" height="12" rx="4" fill="#fff" stroke="rgba(20,9,15,.12)"/>'
         f'{g_sym("rosa", 36, 64, 48)}</svg>', "Copo de festa", "Papel rosa, tampa branca."),
        (f'<svg viewBox="0 0 90 190" width="70" height="148"><rect x="30" y="4" width="30" height="20" rx="5" fill="#2a1d24"/><rect x="14" y="22" width="62" height="164" rx="22" fill="{INK}"/>'
         f'{g_sym("preto", 23, 70, 44)}<g transform="translate(22 140) scale(.27)">{P.C.pattern_row(PINK, 0, 8, 6, (2, 5, 10, 18, 30), 40)[0]}</g></svg>', "Garrafa térmica", "Preta, símbolo + faixa."),
    ]
    cells = "".join(f'<div class="card" style="display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:12px">'
                    f'<div style="height:168px;display:flex;align-items:center">{a}</div><div class="lab" style="align-self:flex-start">{b}</div>'
                    f'<div class="note" style="align-self:flex-start">{c}</div></div>' for a, b, c in its)
    return page(21, "Merch · mesa", "Xícara, canecas, <b>copos</b> e garrafa",
                f'<div class="grid" style="grid-template-columns:repeat(4,1fr);gap:12px">{cells}</div>', cls="mist")


def sticker(inner, bg, shape="circle", rot=0, pad=10, w=None):
    rad = "50%" if shape == "circle" else ("999px" if shape == "pill" else "22px")
    ww = f"width:{w}px;" if w else ""
    return (f'<div style="background:{bg};border-radius:{rad};padding:{pad}px;display:inline-flex;align-items:center;justify-content:center;{ww}'
            f'box-shadow:0 0 0 5px #fff,0 6px 16px rgba(20,9,15,.22);transform:rotate({rot}deg)">{inner}</div>')


def p22():
    sheet = [sticker(sym("preto", 92), INK, rot=-8), sticker(sym("rosa", 70, "giro"), PINK, rot=6),
             sticker(lock("rosa", 30), PINK, "pill", -4, 14), sticker(slogan(22, WHITE, PINK, br=True), INK, "rect", 5, 16),
             sticker(sym("roxo", 64), PURPLE, rot=-3), sticker(f'<div style="display:flex;gap:8px;align-items:center;font:800 18px Gabarito;color:#fff">{icon("cadeado", "#fff", 22)}só pro close</div>', DEEP, "pill", 7, 14),
             sticker(sym("cream", 70), CREAM, rot=10), sticker(f'<div style="font:800 italic 26px Gabarito;color:{INK}">caiu o <span style="color:{DEEP}">pix</span> ✦</div>', WHITE, "rect", -6, 14),
             sticker(sym("mono-branco", 56, "giro"), INK, rot=0), sticker(f'<div style="font:800 20px Gabarito;color:#fff">✦ exclusivo</div>', PINK, "pill", -9, 12)]
    grid = "".join(f'<div style="display:flex;align-items:center;justify-content:center;height:150px">{s}</div>' for s in sheet)
    cartela = (f'<div style="background:{WHITE};border-radius:18px;padding:16px;width:250px;box-shadow:0 8px 22px rgba(20,9,15,.12)">'
               f'<div style="display:flex;justify-content:space-between;align-items:center">{lock("branco", 18)}<span class="note" style="margin:0">cartela A6</span></div>'
               f'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px;justify-items:center">'
               + "".join(sticker(sym(s, 42, k), V[s]["bg"], pad=6) for s, k in (("preto", "crescente"), ("rosa", "crescente"), ("roxo", "giro"), ("deep", "crescente"), ("preto", "giro"), ("cream", "crescente")))
               + f'</div><div style="margin-top:16px">{faixa(DEEP, 6, .9)}</div></div>')
    laptop = (f'<div style="width:250px;height:160px;border-radius:12px;background:#c9c3c6;position:relative;margin-top:16px;overflow:hidden">'
              f'<div style="position:absolute;left:30px;top:24px">{sticker(sym("preto", 54), INK, rot=-10, pad=6)}</div>'
              f'<div style="position:absolute;left:120px;top:16px">{sticker(lock("rosa", 18), PINK, "pill", 8, 9)}</div>'
              f'<div style="position:absolute;left:140px;top:84px">{sticker(sym("roxo", 40, "giro"), PURPLE, rot=0, pad=6)}</div>'
              f'<div style="position:absolute;left:40px;top:104px">{sticker(slogan(11, WHITE, PINK), INK, "rect", 4, 7)}</div></div>')
    return page(22, "Adesivos", "Recorte com borda branca, <b>muitos</b> formatos",
                f'<div class="row" style="gap:22px"><div class="grid" style="grid-template-columns:repeat(5,1fr);gap:4px;flex:1">{grid}</div>'
                f'<div>{cartela}{laptop}<div class="note">Notebook do creator: a mistura Crescente + Giro + frases.</div></div></div>'
                f'<div class="note" style="font-size:10.5px">Borda branca de 3 mm; vinil fosco. Combinações de cor seguem a pág. 10: nada preto no rosa, rosa nunca sobre roxo.</div>')


TEE = "M62 14 L30 24 L4 62 L30 80 L42 70 L42 214 L158 214 L158 70 L170 80 L196 62 L170 24 L138 14 C128 32 72 32 62 14 Z"
HOOD = ("M60 20 L26 34 L6 120 L10 206 L36 206 L40 110 L42 214 L158 214 L160 110 L164 206 L190 206 L194 120 L174 34 L140 20 "
        "C138 4 62 4 60 20 Z")


def p23():
    def wear(path, color, art, lab, note):
        edge = "rgba(20,9,15,.15)" if color in (WHITE, CREAM) else "rgba(0,0,0,.3)"
        return (f'<div style="text-align:center"><svg viewBox="0 0 200 220" width="150" height="165"><path d="{path}" fill="{color}" stroke="{edge}" stroke-linejoin="round"/>'
                f'{art}</svg><div class="lab" style="font-size:11.5px">{lab}</div><div class="note">{note}</div></div>')
    lk_c, _ = g_lock("cream", 106, 58, 12)
    lk_r, wr = g_lock("rosa", 0, 0, 62, vertical=True)
    clip = f'<defs><clipPath id="tc"><path d="{TEE}"/></clipPath></defs>'
    pat = clip + '<g clip-path="url(#tc)">' + "".join(g_sym("rosa", 30 + (i % 5) * 30 + (15 if (i // 5) % 2 else 0), 30 + (i // 5) * 30, 20, "giro") for i in range(35)) + "</g>"
    its = [
        wear(TEE, INK, g_sym("preto", 116, 50, 24), "Camiseta preta · peito", "Crescente pequena, 7 cm."),
        wear(TEE, INK, g_sym("preto", 46, 52, 108) + f'<text x="100" y="196" text-anchor="middle" font-family="Gabarito" font-weight="800" font-style="italic" font-size="13" fill="#fff">Só pra quem é <tspan fill="{PINK}">close.</tspan></text>',
             "Camiseta preta · costas", "Crescente grande + slogan."),
        wear(TEE, PINK, f'<g transform="translate({f(100 - wr / 2)} 52)">{lk_r}</g>', "Camiseta rosa", "Empilhada branca."),
        wear(TEE, CREAM, lk_c, "Camiseta cream", "Assinatura no peito."),
        wear(TEE, PINK, pat, "Camiseta Giro", "Padrão Giro branco, estampa corrida."),
        wear(HOOD, INK, g_sym("preto", 70, 56, 60) + f'<g transform="translate(66 132) scale(.5)">{P.C.pattern_row(PINK, 0, 8, 6, (2, 5, 10, 18, 30), 40)[0]}</g>',
             "Moletom preto", "Símbolo + faixa no peito."),
        wear(HOOD, PURPLE, g_sym("roxo", 64, 60, 72, "giro"), "Moletom roxo · Giro", "Giro branco grande."),
        (f'<div style="text-align:center"><svg viewBox="0 0 200 140" width="150" height="105"><path d="M30 96 C30 42 70 16 108 16 C150 16 176 46 176 96 Z" fill="{PINK}"/>'
         f'<path d="M30 96 C70 88 130 88 176 96 C188 100 198 108 196 118 C150 106 70 106 30 108 Z" fill="{DEEP}"/>{g_sym("rosa", 84, 40, 46)}</svg>'
         f'<div class="lab" style="font-size:11.5px">Boné rosa</div><div class="note">Bordado branco.</div></div>'),
    ]
    return page(23, "Merch · vestir", "Camisetas, moletom e <b>boné</b>",
                f'<div class="grid" style="grid-template-columns:repeat(4,1fr);gap:6px 14px">{"".join(its)}</div>', cls="mist")


def p24():
    cf = T(INK, sym("preto", 70), 132, 230)
    cv = (f'<div class="tl bd" style="background:{CREAM};height:132px;width:230px;padding:14px;display:block">{lock("cream", 18)}'
          f'<div style="position:absolute;left:14px;bottom:14px"><div style="font:800 12px Gabarito">Laércio Germano</div><div class="note" style="margin:0">Produto · clozzy.com</div></div>'
          f'<div style="position:absolute;right:14px;bottom:18px">{faixa(DEEP, 4, .5)}</div></div>')
    cracha = (f'<div style="width:130px;height:196px;border-radius:12px;background:{PINK};position:relative;overflow:hidden;box-shadow:0 8px 20px rgba(20,9,15,.15)">'
              f'<div style="position:absolute;left:50%;top:8px;width:30px;height:6px;margin-left:-15px;border-radius:3px;background:rgba(20,9,15,.25)"></div>'
              f'<div style="position:absolute;left:0;right:0;top:28px;display:flex;justify-content:center">{P.ring_avatar(11, 72, WHITE, PINK)}</div>'
              f'<div style="position:absolute;left:0;right:0;top:112px;text-align:center;color:#fff"><b style="font:800 13px Gabarito">Bia Creator</b>'
              f'<div style="font-size:9px;opacity:.85">CREATOR · EVENTO</div></div><div style="position:absolute;left:0;right:0;bottom:12px;display:flex;justify-content:center">{lock("rosa", 16)}</div></div>')
    email = (f'<div class="card" style="width:330px"><div style="font-size:10px;opacity:.6">— </div><div style="display:flex;gap:12px;align-items:center;margin-top:6px">'
             f'{sym("branco", 42)}<div style="border-left:2px solid {PINK};padding-left:12px"><b style="font:800 13px Gabarito">Laércio Germano</b>'
             f'<div style="font-size:10px;opacity:.65">Produto · Clozzy</div><div style="font-size:10px;color:{DEEP}">clozzy.com · @clozzy</div></div></div>'
             f'<div style="margin-top:10px">{faixa(PINK, 4, .6)}</div></div>')
    slide = (f'<div style="width:330px;height:186px;border-radius:12px;background:{INK};position:relative;overflow:hidden;color:#fff">'
             f'<div style="position:absolute;right:-40px;bottom:-50px">{sym("preto", 200)}</div>'
             f'<div style="position:absolute;left:18px;top:18px">{lock("preto", 16)}</div><div style="position:absolute;left:18px;top:60px;font:800 italic 26px/1 Gabarito;letter-spacing:-.03em">'
             f'Resultados<br><span style="color:{PINK}">Q4 2026</span></div><div style="position:absolute;left:18px;bottom:18px">{faixa(PINK, 5, .6)}</div></div>')
    env = (f'<div style="width:300px;height:150px;background:{WHITE};border:1px solid rgba(20,9,15,.1);border-radius:6px;position:relative">'
           f'<div style="position:absolute;left:14px;top:14px">{lock("branco", 16)}</div><div style="position:absolute;right:14px;top:14px">{sym("branco", 26, "giro")}</div>'
           f'<div style="position:absolute;left:120px;top:72px;font-size:10px;line-height:1.5;opacity:.7">Para: Bia Creator<br>Kit de boas-vindas ✦</div>'
           f'<div style="position:absolute;left:0;right:0;bottom:0;height:10px;background:{PINK}"></div></div>')
    return page(24, "Papelaria e institucional", "Cartão, crachá, e-mail e <b>apresentação</b>",
                f'<div class="row" style="gap:18px"><div><div class="sub">Cartão de visita · frente e verso</div><div class="row" style="gap:10px">{cf}{cv}</div>'
                f'<div class="sub" style="margin-top:16px">Envelope do kit creator</div>{env}</div>'
                f'<div><div class="sub">Crachá</div>{cracha}</div><div><div class="sub">Assinatura de e-mail</div>{email}'
                f'<div class="sub" style="margin-top:16px">Capa de apresentação</div>{slide}</div></div>')


def p25():
    bill = (f'<div style="position:relative;width:520px"><div style="height:220px;border-radius:6px;overflow:hidden;position:relative;background:url({photo(1)}) center 30%/cover">'
            f'<div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(20,9,15,.95) 30%,rgba(20,9,15,.1))"></div>'
            f'<div style="position:absolute;left:24px;top:30px">{slogan(46, WHITE, PINK, br=True)}</div>'
            f'<div style="position:absolute;left:24px;bottom:22px;display:flex;gap:16px;align-items:center">{lock("preto", 26)}<span style="font:600 12px Figtree;color:rgba(255,255,255,.7)">{P.APOIO}</span></div></div>'
            f'<div style="display:flex;justify-content:space-around"><div style="width:10px;height:60px;background:#4a3d44"></div><div style="width:10px;height:60px;background:#4a3d44"></div></div></div>')
    mupi = (f'<div style="width:150px;height:280px;border-radius:8px;border:6px solid #3a3035;background:{PINK};position:relative;overflow:hidden">'
            f'<div style="position:absolute;right:-50px;top:-30px;opacity:.25">{sym("rosa", 200, "giro")}</div>'
            f'<div style="position:absolute;left:14px;top:110px;font:800 italic 30px/0.95 Gabarito;color:#fff;letter-spacing:-.03em">Seu close<br>vale ouro.</div>'
            f'<div style="position:absolute;left:14px;bottom:16px">{lock("rosa", 16)}</div></div>')
    backdrop = (f'<div style="width:300px;height:170px;border-radius:6px;background:{INK};display:grid;grid-template-columns:repeat(5,1fr);align-items:center;justify-items:center;padding:8px">'
                + "".join(sym("preto", 34, "giro" if i % 2 else "crescente") if (i // 5) % 2 == 0 else lock("preto", 12) if i % 2 == 0 else "" for i in range(15)) + '</div>')
    tela = (f'<div style="width:300px;height:110px;border-radius:10px;background:{INK};border:5px solid #2b2228;display:flex;align-items:center;justify-content:center;gap:16px">'
            f'{sym("preto", 64, "giro", spin=True)}<div style="color:#fff;font:800 italic 20px/1 Gabarito">Ao vivo<br><span style="color:{PINK}">no close</span></div></div>')
    return page(25, "Rua e eventos", "Outdoor, mupi, <b>backdrop</b> e telão",
                f'<div class="row" style="gap:20px"><div><div class="sub">Outdoor 9 × 3 m</div>{bill}</div><div><div class="sub">Mupi</div>{mupi}</div>'
                f'<div><div class="sub">Backdrop de evento</div>{backdrop}<div class="sub" style="margin-top:14px">Telão / LED</div>{tela}</div></div>', cls="mist")


def p26():
    checks = ["Crescente na assinatura (Giro só em motion/estampa)", "Anel rosa + estrela branca no preto", "Tudo branco no rosa, roxo e Deep",
              "Nada preto no rosa, nada rosa no roxo", "Palavra ao lado ou embaixo, nunca fundida", "Respiro de ¼ do anel",
              "Traços crescendo no sentido horário", "Texto branco no rosa só ≥ 18 px bold", "Conteúdo de assinante desfocado fora do paywall",
              "Animação respeita “reduzir movimento”"]
    ck = "".join(f'<div style="display:flex;gap:10px;align-items:center;border-top:1px solid rgba(20,9,15,.1);padding:6px 0;font-size:11px">'
                 f'<span style="width:14px;height:14px;border-radius:4px;border:2px solid {DEEP}"></span>{c}</div>' for c in checks)
    return (f'<section class="page"><div class="eyebrow">26 · Acessibilidade e checklist</div><h2>Antes de <b>publicar</b></h2>'
            f'<div class="row" style="gap:28px"><div style="flex:1"><ul class="rl"><li>Texto corrido: branco no ink ou ink no cream (AAA)</li>'
            f'<li>Rosa #FF0065 com branco tem 3,9:1: só títulos grandes; botões pequenos usam Deep</li><li>Ícone + texto em toda ação; nunca só cor</li>'
            f'<li>Alt-text em todo post: descreva a pessoa e o texto da arte</li><li>Legendas em todos os vídeos</li>'
            f'<li>Conteúdo +18 nunca aparece fora da área logada</li></ul>'
            f'<div class="card" style="background:{PINK};color:#fff;margin-top:20px;display:flex;gap:18px;align-items:center;padding:20px">{sym("rosa", 90, spin=True)}'
            f'<div>{lock("rosa", 34)}<div style="margin-top:10px">{slogan(22, WHITE, WHITE)}</div><div style="font-size:10px;opacity:.85;margin-top:4px">clozzy.com · @clozzy</div></div></div></div>'
            f'<div style="flex:1"><div class="sub">Checklist</div>{ck}</div></div>{foot(26)}</section>')


# ======================================================================================================
def export_pngs():
    tmp = Path(tempfile.mkdtemp())
    for folder, items, w, h in (("posts", P.POSTS, 1080, 1080), ("stories", P.STORIES, 1080, 1920)):
        out = HERE / folder
        shutil.rmtree(out, ignore_errors=True)
        out.mkdir()
        for slug, _n, fn in items:
            html = tmp / f"{slug}.html"
            html.write_text(f'<!doctype html><html><head><meta charset="utf-8"><style>{P.FONT_CSS}*{{margin:0;padding:0;box-sizing:border-box}}'
                            f'body{{width:{w}px;height:{h}px;overflow:hidden}}</style></head><body>{fn()}</body></html>')
            subprocess.run([CHROME, "--headless", "--disable-gpu", "--hide-scrollbars", f"--window-size={w},{h}",
                            f"--screenshot={out / f'{folder[:-1]}-{slug}.png'}", html.as_uri()], check=True, capture_output=True)
    shutil.rmtree(tmp, ignore_errors=True)


def build():
    pages = [p01(), p02(), p03(), p04(), p05(), p06(), p07(), p08(), p09(), p10(), p11(), p12(), p13(),
             p14(), p15(), p16(), p17(), p18(), p19(), p20(), p21(), p22(), p23(), p24(), p25(), p26()]
    OUT_HTML.write_text(f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy · identidade visual Crescente</title>'
                        f'<style>{CSS}</style></head><body>{"".join(pages)}</body></html>')
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer", f"--print-to-pdf={OUT_PDF}", OUT_HTML.as_uri()],
                   check=True, capture_output=True)
    import fitz
    png = HERE / "png"
    shutil.rmtree(png, ignore_errors=True)
    png.mkdir()
    for i, pg in enumerate(fitz.open(OUT_PDF), 1):
        pg.get_pixmap(dpi=110).save(png / f"pagina-{i:02d}.png")
    if "--sem-png" not in sys.argv:
        export_pngs()
    print("ok", len(pages), "páginas")


if __name__ == "__main__":
    build()

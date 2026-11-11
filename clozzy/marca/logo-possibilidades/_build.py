#!/usr/bin/env python3
"""Clozzy — documento “Possibilidades de logo” (rodada 4: anel tracejado).
Usa marca/refs (prints favoritos), a logo v1 do hml, as rodadas 1–3 e a paleta fechada.
Rodar: python3 _marcas.py && python3 _build.py → HTML + PDF"""
import base64, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import _marcas as M  # noqa: E402

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT_HTML = HERE / "possibilidades-logo-clozzy.html"
OUT_PDF = HERE / "possibilidades-logo-clozzy.pdf"
FONTS = HERE.parent / "identidade-nova" / "fonts"
REFS = HERE.parent / "refs"
V1 = HERE.parent / "referencias-apps" / "logo-atual" / "logo-v1.svg"
PH = HERE.parent / "referencias-apps" / "modelos" / "img"
PINK, DEEP, PURPLE, INK, CREAM, WHITE = M.PINK, M.DEEP, M.PURPLE, M.INK, M.CREAM, M.WHITE


def b64(path, mime):
    return f"data:{mime};base64," + base64.b64encode(Path(path).read_bytes()).decode()


def sv(s):
    return "data:image/svg+xml;base64," + base64.b64encode(s.encode()).decode()


def L(name):
    return b64(HERE / "svg" / f"{name}.svg", "image/svg+xml")


def img(src, w=None, h=None, style=""):
    sz = (f"width:{w}px;" if w else "") + (f"height:{h}px;" if h else "")
    return f'<img src="{src}" style="{sz}display:block;{style}">'


def mark(fn, theme="color", small=False):
    return sv(M.svg(fn(theme, small)))


PRINTS = sorted(REFS.glob("*.png"))
PRINT_NOTES = [
    ("Masters do performer", "Disco rosa com estrela branca; lockup escuro “meuclozzy”. <em>Rosa é a cor do app.</em>"),
    ("Lockup do site", "O mesmo disco em roxo. <em>O roxo entra como acento, não como segundo logo.</em>"),
    ("Disco sobre preto", "Rosa sobre ink, contraste máximo. <em>A versão escura é a principal no app.</em>"),
    ("Sumário do manual", "Formato de 12 páginas com sumário. <em>É o formato deste documento.</em>"),
    ("Círculo próximo", "O C aberto guardando a estrela. <em>Vira a família “C tracejado”.</em>"),
    ("Novo story (+)", "O anel tracejado com +. <em>A ideia central: o anel é tracejado.</em>"),
    ("Novo story pequeno", "O tracejado funciona em ícone pequeno. <em>Base do corte de 16 px.</em>"),
    ("Anel segmentado", "Segmentos do story em várias cores. <em>Aqui em rosa e roxo sólidos, sem gradiente.</em>"),
    ("Lockup Gabarito", "“clozzy” em Gabarito 800 com o C rosa. <em>Wordmark de todas as opções.</em>"),
    ("Pink Clozzy", "“Um rosa só, bem usado.” <em>#FF0065 domina.</em>"),
    ("Pink Deep", "#E0005A para botões com texto branco (4,9:1)."),
    ("Tipografia", "“Seu close, seu preço.”: Gabarito fala alto, Figtree explica."),
]


# ------------------------------------------------------------------ CSS
def css():
    gab = b64(FONTS / "Gabarito-Variable.ttf", "font/ttf")
    fig = b64(FONTS / "Figtree-Variable.ttf", "font/ttf")
    return f"""
@font-face{{font-family:Gabarito;src:url({gab});font-weight:400 900}}
@font-face{{font-family:Figtree;src:url({fig});font-weight:300 900}}
@page{{size:297mm 210mm;margin:0}}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:Figtree,sans-serif;color:{INK};-webkit-print-color-adjust:exact;print-color-adjust:exact}}
.page{{width:297mm;height:210mm;background:{CREAM};position:relative;overflow:hidden;page-break-after:always;padding:14mm 16mm 12mm}}
.page.white{{background:{WHITE}}} .page.ink{{background:{INK};color:{WHITE}}} .page.pink{{background:{PINK};color:{WHITE}}}
.kicker{{font:800 10.5px Figtree;letter-spacing:.16em;text-transform:uppercase;color:rgba(20,9,15,.55);margin-bottom:6px}}
.ink .kicker,.pink .kicker{{color:rgba(255,255,255,.6)}}
h1,h2,h3,b.g{{font-family:Gabarito,sans-serif;letter-spacing:-.02em}}
h1{{font-size:70px;font-weight:800;line-height:.93}} h2{{font-size:31px;font-weight:800;line-height:1.05;margin-bottom:6px}}
h2 em,h1 em{{font-style:normal;color:{PINK}}} .pink h2 em{{color:{INK}}}
.lead{{font-size:13px;line-height:1.5;color:rgba(20,9,15,.68);max-width:800px}} .ink .lead{{color:rgba(255,255,255,.72)}}
.foot{{position:absolute;left:16mm;right:16mm;bottom:7mm;display:flex;justify-content:space-between;font-size:9px;color:rgba(20,9,15,.45)}}
.ink .foot,.pink .foot{{color:rgba(255,255,255,.55)}}
.toc{{display:grid;grid-template-columns:1fr 1fr;column-gap:40px;margin-top:22px}}
.toc div{{display:flex;gap:14px;padding:11px 0;border-bottom:1px solid rgba(20,9,15,.12);font-size:14px;font-weight:600}}
.toc span{{color:{PINK};font-weight:800;width:24px}}
.prints{{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-top:12px}}
.pr .im{{height:118px;border-radius:10px;background:{WHITE};border:1px solid rgba(20,9,15,.08);display:grid;place-items:center;overflow:hidden}}
.pr .im img{{max-width:100%;max-height:100%;object-fit:contain}}
.pr b{{display:block;font:800 12px Gabarito;margin-top:6px}} .pr b i{{font-style:normal;color:{PINK};margin-right:4px}}
.pr p{{font-size:9.8px;line-height:1.35;color:rgba(20,9,15,.7);margin-top:2px}} .pr p em{{font-style:normal;font-weight:700;color:{DEEP}}}
.cols{{display:grid;gap:18px}}
.box{{background:{WHITE};border-radius:18px;padding:16px}} .ink .box{{background:rgba(255,255,255,.06)}}
.box h4{{font:800 14px Gabarito;margin-bottom:6px}} .box p,.box li{{font-size:11px;line-height:1.5}} .box li{{margin-left:15px}}
.sw{{display:flex;gap:8px;margin-top:8px}} .sw i{{flex:1;height:54px;border-radius:12px;display:flex;align-items:flex-end;padding:6px;font:700 8.5px Figtree;font-style:normal}}
.cards{{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:10px}}
.card{{background:{WHITE};border-radius:22px;padding:16px 18px;display:grid;grid-template-columns:170px 1fr;gap:16px}}
.card .hero{{width:170px;height:170px;display:grid;place-items:center}}
.card .num{{font:800 11px Figtree;color:{PINK};letter-spacing:.1em}}
.card h3{{font-size:23px;font-weight:800;line-height:1}} .card .ing{{font-size:10px;color:rgba(20,9,15,.55);margin:3px 0 7px}}
.card p{{font-size:11px;line-height:1.42}} .card .pm{{margin-top:6px;font-size:10.5px;line-height:1.4}}
.card .pm b{{color:{DEEP}}} .card .pm span{{display:block}}
.strip{{grid-column:1/3;display:flex;gap:10px;align-items:center;border-top:1px solid rgba(20,9,15,.08);padding-top:12px}}
.strip .t{{border-radius:12px;display:grid;place-items:center}}
.strip .lk{{margin-left:auto}}
.refs-tag{{display:inline-block;font-size:9px;font-weight:800;color:{WHITE};background:{PURPLE};border-radius:99px;padding:2px 8px;margin-top:8px}}
.matrix{{display:grid;grid-template-columns:120px repeat(6,1fr);margin-top:10px;font-size:10px}}
.matrix>div{{display:flex;align-items:center;justify-content:center;gap:10px;padding:2px 4px;border-bottom:1px solid rgba(20,9,15,.08);min-height:40px}}
.matrix .h{{font-weight:800;color:rgba(20,9,15,.55);font-size:9.5px}} .matrix .n{{justify-content:flex-start;font:800 11.5px Gabarito}}
.matrix .dk{{background:{INK}}}
.thick{{display:flex;justify-content:space-between;align-items:flex-end;margin-top:20px}}
.thick div{{text-align:center;font-size:10.5px}} .thick b{{display:block;font:800 15px Gabarito;margin-top:8px}}
.thick .on b{{color:{PINK}}}
.phone{{width:250px;height:300px;border-radius:36px 36px 0 0;background:{INK};padding:8px 8px 0;overflow:hidden}}
.scr{{width:100%;height:100%;border-radius:28px 28px 0 0;overflow:hidden;position:relative}}
.spring{{display:grid;grid-template-columns:repeat(4,1fr);gap:16px 10px;padding:46px 14px}}
.spring i{{width:46px;height:46px;border-radius:12px;background:rgba(255,255,255,.14);display:block;margin:auto}}
.spring span{{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:8.5px;color:{WHITE}}}
.av{{width:54px;height:54px;border-radius:50%;object-fit:cover;display:block}}
.reco{{display:grid;grid-template-columns:1.25fr 1fr 1fr;gap:16px;margin-top:14px}}
.reco .box{{display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px}}
.reco .box.main{{background:{INK};color:{WHITE}}}
.reco .box b.g{{font-size:20px}} .reco .tag{{font-size:9.5px;font-weight:800;padding:3px 9px;border-radius:99px;background:{PINK};color:{WHITE}}}
"""


def foot(n):
    return f'<div class="foot"><span>Clozzy · Possibilidades de logo · rodada 4 · nov 2026</span><span>{n:02d}</span></div>'


C = {c[0]: c for c in M.CONCEPTS}
MAIN = "01-cinco"


# ------------------------------------------------------------------ páginas
def p_cover():
    fn = C[MAIN][6]
    return f"""<section class="page ink" style="display:grid;grid-template-columns:1.2fr 1fr;align-items:center;gap:30px">
<div><div class="kicker">Clozzy 2028 · Logo · Rodada 4</div>
<h1>Possibilidades<br>de logo: <em>o anel<br>tracejado.</em></h1>
<p class="lead" style="margin-top:18px;max-width:470px">12 caminhos a partir dos prints que você marcou em <code>marca/refs</code>. Partem da v1 (disco + estrela), do Círculo próximo e do anel de story, sempre tracejado e mais grosso. Só usam rosa, roxo, ink, cream e branco.</p></div>
<div style="display:grid;place-items:center">{img(mark(fn, "dark"), 330)}</div>
{foot(1)}</section>"""


def p_toc():
    items = ["O que você marcou", "Contexto e decisões", "Anatomia do anel", "Espessura", "Ponto de partida",
             "Possibilidades 01–02", "Possibilidades 03–04", "Possibilidades 05–06", "Possibilidades 07–08",
             "Possibilidades 09–10", "Wordmark e lockups", "Teste de redução", "Na tela", "Recomendação"]
    rows = "".join(f'<div><span>{i + 3:02d}</span>{t}</div>' for i, t in enumerate(items))
    return f"""<section class="page white">
<div class="kicker">Sumário</div><h2>Logo em <em>{len(items) + 2}</em> páginas</h2>
<div class="toc">{rows}</div>{foot(2)}</section>"""


def p_prints(n):
    cards = ""
    for i, (pth, (t, note)) in enumerate(zip(PRINTS, PRINT_NOTES)):
        cards += f'<div class="pr"><div class="im"><img src="{b64(pth, "image/png")}"></div><b><i>{i + 1}</i>{t}</b><p>{note}</p></div>'
    return f"""<section class="page">
<div class="kicker">03 · Referência</div><h2>O que você <em>marcou</em></h2>
<p class="lead">Os 12 prints de <code>clozzy/marca/refs</code>. Cada possibilidade indica de quais prints ela vem.</p>
<div class="prints">{cards}</div>{foot(n)}</section>"""


def p_context(n):
    v1 = b64(V1, "image/svg+xml")
    sw = "".join(f'<i style="background:{b};color:{t};{"border:1px solid rgba(20,9,15,.1);" if b in (WHITE, CREAM) else ""}">{nm}</i>'
                 for b, t, nm in [(PINK, WHITE, "Pink Clozzy"), (DEEP, WHITE, "Pink Deep"), (PURPLE, WHITE, "Roxo v1"),
                                  (INK, WHITE, "Ink"), (CREAM, INK, "Cream"), (WHITE, INK, "Branco")])
    return f"""<section class="page">
<div class="kicker">04 · Contexto</div><h2>O que já está <em>decidido</em></h2>
<div class="cols" style="grid-template-columns:1fr 1fr 1fr;margin-top:12px">
<div class="box"><h4>Logo atual (v1)</h4>{img(v1, 200)}<p style="margin-top:10px">Disco roxo + estrela + “clozzy” (hml). No app performer o disco é rosa. Todas as possibilidades partem de <b>círculo + estrela</b>.</p></div>
<div class="box"><h4>Paleta fechada</h4><div class="sw">{sw}</div><p style="margin-top:10px">Só estas seis. As paletas multi-cor da rodada 3 foram descartadas. Rosa domina; o roxo é acento; sem gradiente, glow ou neon.</p></div>
<div class="box"><h4>Palavras-chave</h4><p>vídeos · stories · chat · videochat · fechado · privado · <b>close</b> · <b>close friends</b> · <b>estrela</b></p>
<h4 style="margin-top:12px">Decisões de forma</h4><ul><li>O anel é <b>tracejado</b>, como o story (prints 6–8).</li><li>Mais <b>grosso</b> que o Story fino da última rodada: 24/256 em vez de 14.</li><li>A estrela fica menor que a da v1 e arredondada.</li><li>Wordmark Gabarito 800 (print 9).</li></ul></div>
</div>
<div class="box" style="margin-top:16px;display:flex;gap:28px;align-items:center">
<h4 style="width:120px">Rodadas anteriores</h4>
<p style="flex:1"><b>R1</b> Círculo próximo (C + estrela) · <b>R2</b> 8 símbolos (Ingresso, Costura…) · <b>R3</b> 8 símbolos + 8 paletas (descartadas) · <b>Story</b> anel fino + estrela menor. Agora: <b>tracejado e mais grosso</b>.</p>
{img(L("00b-circulo-color"), 44)}{img(sv(M.svg(M.ring(PINK, 119, 14) + M.star(PURPLE, 60))), 44)}<span style="font:800 22px Gabarito;color:{PINK}">→</span>{img(L("01-cinco-color"), 44)}
</div>{foot(n)}</section>"""


def p_anatomy(n):
    w, r, R = M.dims(False)
    import math
    cap = math.degrees((w / 2) / r)
    guide = (f'<circle cx="128" cy="128" r="{r}" fill="none" stroke="rgba(20,9,15,.18)" stroke-width="1" stroke-dasharray="3 3"/>'
             f'<circle cx="128" cy="128" r="126" fill="none" stroke="rgba(20,9,15,.12)" stroke-width="1"/>'
             f'<circle cx="128" cy="131" r="{R}" fill="none" stroke="rgba(20,9,15,.18)" stroke-width="1" stroke-dasharray="3 3"/>'
             + "".join(f'<line x1="128" y1="128" x2="{M.f(M.P(-90 + 72 * k, 130)[0])}" y2="{M.f(M.P(-90 + 72 * k, 130)[1])}" stroke="{PURPLE}" stroke-width="1" stroke-dasharray="4 3"/>' for k in range(5)))
    big = M.svg(M.k_cinco("color") + guide)
    return f"""<section class="page white">
<div class="kicker">05 · Construção</div><h2>Anatomia do <em>anel tracejado</em></h2>
<div style="display:grid;grid-template-columns:400px 1fr;gap:40px;align-items:center;margin-top:8px">
<div>{img(sv(big), 400)}</div>
<div class="cols" style="grid-template-columns:1fr 1fr">
<div class="box" style="background:{CREAM}"><h4>Grid 256</h4><p>Raio externo 126. Traço <b>{w}</b> (9,4% do diâmetro), quase o dobro do Story fino (14). Pontas redondas.</p></div>
<div class="box" style="background:{CREAM}"><h4>Vãos</h4><p>Vão visível de 16°, já descontando as pontas redondas ({cap:.1f}° de cada lado). Cada vão aponta para uma ponta da estrela (linhas roxas).</p></div>
<div class="box" style="background:{CREAM}"><h4>Estrela</h4><p>R {R} (46% do raio), miolo 0,48 e cantos arredondados em 14% do R. Desce 3 px para compensar o peso visual da ponta de cima.</p></div>
<div class="box" style="background:{CREAM}"><h4>Corte pequeno (≤ 24 px)</h4><p>Traço 34, vão 20° e estrela R 66. Abaixo de 24 px, use sempre este arquivo (<code>-16.svg</code>).</p></div>
</div></div>{foot(n)}</section>"""


def p_thickness(n):
    items = [(14, "Story (antes)", "muito fino"), (18, "", ""), (24, "Escolhido", "tracejado + grosso"), (30, "", ""), (36, "", "pesado")]
    cells = ""
    for w, t, s in items:
        body = M.k_cinco("color", w=w)
        on = "on" if w == 24 else ""
        cells += (f'<div class="{on}">{img(sv(M.svg(body)), 180)}<div style="display:flex;gap:8px;justify-content:center;margin-top:10px;align-items:center">'
                  f'{img(sv(M.svg(body)), 32)}{img(sv(M.svg(body)), 20)}<span style="background:{INK};padding:4px;border-radius:5px">{img(sv(M.svg(M.k_cinco("dark", w=w))), 20)}</span></div>'
                  f'<b>{w}/256</b>{t}<br><span style="color:rgba(20,9,15,.55)">{s}</span></div>')
    return f"""<section class="page">
<div class="kicker">06 · Espessura</div><h2>Mais grosso: <em>quanto?</em></h2>
<p class="lead">O mesmo símbolo (5 pontas) com cinco espessuras. Com 14 ele some em 20 px; com 36 os vãos fecham e vira um disco serrilhado. 24 é o ponto em que o tracejado ainda lê como story e aguenta o ícone pequeno.</p>
<div class="thick">{cells}</div>{foot(n)}</section>"""


def card(c):
    slug, name, ing, idea, plus, minus, fn, refs = c
    hero = img(L(f"{slug}-color"), 160)
    strip = (f'<span class="t" style="background:{INK};width:56px;height:56px">{img(L(f"{slug}-dark"), 42)}</span>'
             f'{img(L(f"{slug}-app-pink"), 52)}{img(L(f"{slug}-app-ink"), 52)}'
             f'{img(L(f"{slug}-mono"), 34)}{img(L(f"{slug}-color"), 32)}{img(L(f"{slug}-16"), 16)}'
             f'<span style="background:{INK};padding:4px;border-radius:5px">{img(L(f"{slug}-16-dark"), 16)}</span>'
             f'<span class="lk">{img(L(f"{slug}-lockup"), h=40)}</span>')
    return f"""<div class="card"><div class="hero">{hero}</div>
<div><div class="num">{slug.split("-")[0].upper()}</div><h3>{name}</h3><div class="ing">{ing}</div><p>{idea}</p>
<div class="pm"><span><b>+</b> {plus}</span><span><b>−</b> {minus}</span></div><span class="refs-tag">prints {refs}</span></div>
<div class="strip">{strip}</div></div>"""


def p_cards(n, slugs, kick, title, sub=""):
    return f"""<section class="page">
<div class="kicker">{kick}</div><h2>{title}</h2>{f'<p class="lead">{sub}</p>' if sub else ""}
<div class="cards">{"".join(card(C[s]) for s in slugs)}</div>{foot(n)}</section>"""


def p_wordmark(n):
    fn = C[MAIN][6]
    return f"""<section class="page white">
<div class="kicker">13 · Wordmark</div><h2>“clozzy” em <em>Gabarito</em>, com e sem o símbolo</h2>
<div class="cols" style="grid-template-columns:1fr 1fr;margin-top:14px">
<div class="box" style="background:{CREAM};display:grid;place-items:center;height:150px">{img(L(f"{MAIN}-lockup"), h=72)}</div>
<div class="box" style="background:{INK};display:grid;place-items:center;height:150px">{img(L(f"{MAIN}-lockup-dark"), h=72)}</div>
<div class="box" style="background:{CREAM};display:grid;place-items:center;height:150px">{img(L("13-o-story-wordmark-color"), h=80)}</div>
<div class="box" style="background:{PINK};display:grid;place-items:center;height:150px">{img(L("13-o-story-wordmark-pink"), h=80)}</div>
</div>
<p class="lead" style="margin-top:14px">Em cima: lockup horizontal (a altura do “l” é 52% do símbolo e o respiro é 0,16 da altura). Embaixo: wordmark com o “o” tracejado, para usos sem símbolo (site, assinatura de vídeo, merch). Na versão sobre rosa, tudo branco, como o tile do app performer (print 1).</p>
{foot(n)}</section>"""


def p_matrix(n):
    sizes = [36, 24, 20, 16]
    head = '<div class="h"></div>' + "".join(f'<div class="h">{s} px</div>' for s in sizes) + '<div class="h">16 px ink</div><div class="h">app 30</div>'
    rows = ""
    for slug, name, *_ in M.CONCEPTS:
        rows += f'<div class="n">{name}</div>'
        for s in sizes:
            rows += f'<div>{img(L(f"{slug}-16" if s <= 20 else f"{slug}-color"), s)}</div>'
        rows += f'<div class="dk">{img(L(f"{slug}-16-dark"), 16)}</div><div>{img(L(f"{slug}-app-pink"), 30)}{img(L(f"{slug}-app-ink"), 30)}</div>'
    return f"""<section class="page white">
<div class="kicker">14 · Redução</div><h2>Teste de <em>16 px</em></h2>
<p class="lead">Até 20 px entra o corte pequeno (traço 34). Passam bem: <b>5 pontas</b>, <b>Um rosa só</b>, <b>Vários stories</b> e <b>Disco no story</b>. Sofrem: Selo (o badge vira mancha) e Close aberto.</p>
<div class="matrix">{head}{rows}</div>{foot(n)}</section>"""


def p_in_screen(n):
    picks = [MAIN, "06-rosa", "08-disco-tracejado"]
    cols = ""
    ph = [b64(PH / f"p{i}.jpg", "image/jpeg") for i in (2, 3, 5, 8)]
    for slug in picks:
        name = C[slug][1]
        apps = "".join(f'<span><i></i>app</span>' for _ in range(5))
        spring = (f'<div class="scr" style="background:#3a2a36"><img src="{ph[0]}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.55">'
                  f'<div class="spring" style="position:relative">{apps}<span>{img(L(f"{slug}-app-pink"), 46)}Clozzy</span>{apps[:len(apps)//5*2]}</div></div>')
        avs = "".join(f'<div style="position:relative;width:66px;height:66px;display:grid;place-items:center">'
                      f'<svg viewBox="0 0 256 256" width="66" height="66" style="position:absolute;inset:0">{M.dashed(PINK, 120, 12, 5 + k, 14)}</svg>'
                      f'<img class="av" src="{ph[k + 1 if k < 3 else 0]}" style="width:50px;height:50px"></div>' for k in range(3))
        cols += f"""<div><div class="phone">{spring}</div>
<div class="box" style="margin-top:10px;display:flex;align-items:center;justify-content:space-between">{img(L(f"{slug}-lockup"), h=26)}
<span style="display:flex;gap:6px;align-items:center;background:{CREAM};padding:5px 9px;border-radius:8px;font-size:10px">{img(L(f"{slug}-16"), 16)}clozzy.com</span></div>
<div class="box" style="margin-top:10px;display:flex;gap:8px;align-items:center">{avs}<span style="font-size:10px;margin-left:6px">anel do app = anel do logo</span></div>
<b class="g" style="display:block;margin-top:8px;font-size:16px">{name}</b></div>"""
    return f"""<section class="page">
<div class="kicker">15 · Aplicação</div><h2>Na <em>tela</em>: ícone, header, aba e stories</h2>
<div class="cols" style="grid-template-columns:repeat(3,1fr);margin-top:10px">{cols}</div>{foot(n)}</section>"""


def p_reco(n):
    def b(slug, tag, txt, main=False):
        return (f'<div class="box{" main" if main else ""}"><span class="tag">{tag}</span>'
                f'{img(L(slug + ("-dark" if main else "-color")), 150 if main else 110)}<b class="g">{C[slug][1]}</b><p>{txt}</p>'
                f'<div style="display:flex;gap:8px">{img(L(f"{slug}-app-pink"), 44)}{img(L(f"{slug}-app-ink"), 44)}</div></div>')
    return f"""<section class="page">
<div class="kicker">16 · Recomendação</div><h2>Seguir com <em>5 pontas</em></h2>
<div class="reco">
{b(MAIN, "favorita", "Anel tracejado grosso, com cada vão apontando para uma ponta da estrela. É o story (prints 6–8) com geometria própria do Clozzy: rosa no anel, roxo na estrela, como a v1. Passa no teste de 16 px.", True)}
{b("06-rosa", "alternativa", "Tudo em Pink Clozzy (print 10). É a mais próxima do app performer e a mais simples; perde o roxo.")}
{b("08-disco-tracejado", "continuidade", "A v1 rosa (print 3) dentro do tracejado roxo. Para quem não quer mudar o disco.")}
</div>
<p class="lead" style="margin-top:14px"><b>Próximo passo:</b> escolha um número (ou combinação, por exemplo “01 com estrela rosa”). Depois disso faço o refinamento óptico, o kit completo (cor, mono, invertido, 16 px, ícones, favicon, avatar) e atualizo o manual da identidade nova.</p>
{foot(n)}</section>"""


def build():
    pages = [p_cover(), p_toc(), p_prints(3), p_context(4), p_anatomy(5), p_thickness(6),
             p_cards(7, ["00a-disco-rosa", "00b-circulo"], "07 · Ponto de partida", "De onde <em>partimos</em>",
                     "Os dois favoritos sem tracejado, como referência para comparar as possibilidades."),
             p_cards(8, ["01-cinco", "02-oito"], "08 · Possibilidades", "Segmentos <em>iguais</em>"),
             p_cards(9, ["03-add", "04-novos"], "09 · Possibilidades", "O story <em>em movimento</em>"),
             p_cards(10, ["05-bicolor", "06-rosa"], "10 · Possibilidades", "Rosa e roxo, ou <em>um rosa só</em>"),
             p_cards(11, ["07-c-tracejado", "08-disco-tracejado"], "11 · Possibilidades", "O C e o disco <em>tracejados</em>"),
             p_cards(12, ["09-selo", "10-aberto"], "12 · Possibilidades", "O componente e o <em>gesto</em>"),
             p_wordmark(13), p_matrix(14), p_in_screen(15), p_reco(16)]
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy — Possibilidades de logo</title>'
            f'<style>{css()}</style></head><body>{"".join(pages)}</body></html>')
    OUT_HTML.write_text(html)
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer", f"--print-to-pdf={OUT_PDF}", OUT_HTML.as_uri()],
                   check=True, capture_output=True)
    return len(pages)


if __name__ == "__main__":
    print("pages", build())

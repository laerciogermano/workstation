#!/usr/bin/env python3
"""Clozzy — Manual de identidade visual v2 (2026-11-11).
Junta todo o contexto: visão do produto, logo v1 (hml), prints favoritos (marca/refs), rodadas 1–8 de logo,
paleta fechada, Gabarito + Figtree, referências de apps e telas-modelo.
Rodar: python3 _marca.py && python3 _build.py → identidade-visual-clozzy-v2.{html,pdf} + export/*.png"""
import base64, importlib.util, shutil, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
MARCA = HERE.parent
sys.path.insert(0, str(HERE))
import _marca as MK  # noqa: E402

sys.path.insert(0, str(MARCA / "referencias-apps"))
_spec = importlib.util.spec_from_file_location("ra_build", MARCA / "referencias-apps" / "_build.py")
RA = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(RA)          # telas-modelo e CSS base (não roda o build dele)

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT_HTML = HERE / "identidade-visual-clozzy-v2.html"
OUT_PDF = HERE / "identidade-visual-clozzy-v2.pdf"
PINK, DEEP, PURPLE, INK, CREAM, WHITE = MK.PINK, MK.DEEP, MK.PURPLE, MK.INK, MK.CREAM, MK.WHITE
REFS = MARCA / "refs"
V1 = MARCA / "referencias-apps" / "logo-atual" / "logo-v1.svg"


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(Path(p).read_bytes()).decode()


def sv(s):
    return "data:image/svg+xml;base64," + base64.b64encode(s.encode()).decode()


def L(name):
    return b64(HERE / "logos" / f"{name}.svg", "image/svg+xml")


def img(src, w=None, h=None, style=""):
    sz = (f"width:{w}px;" if w else "") + (f"height:{h}px;" if h else "")
    return f'<img src="{src}" style="{sz}display:block;{style}">'


def sym(rc=DEEP, sc=None, small=False):
    return sv(MK.svg(MK.symbol(rc, sc, small), 100, 100))


def ref_svg(folder, name):
    p = MARCA / folder / "svg" / f"{name}.svg"
    return b64(p, "image/svg+xml") if p.exists() else ""


# telas-modelo com o logo novo
def _wordlogo(kind="x", h=22, dark=False):
    return img(L("lockup-horizontal-" + ("branco" if dark else "deep")), h=h)


def _mark(kind="x", size=28, dark=False):
    return img(L("simbolo-" + ("pink-no-ink" if dark else "deep")), size, size)


RA.wordlogo, RA.mark = _wordlogo, _mark


def foot(n):
    return f'<div class="foot"><span>Clozzy · Identidade visual v2 · nov 2026</span><span>{n:02d}</span></div>'


EXTRA = f"""
h1 em,h2 em{{font-style:normal;color:{DEEP}}} .ink h1 em,.ink h2 em{{color:{PINK}}} .purple h2 em{{color:{WHITE};text-decoration:underline}}
.kicker{{color:{DEEP}}}
.box{{background:{WHITE};border-radius:18px;padding:14px 16px}} .cream .box{{background:{WHITE}}} .white .box{{background:{CREAM}}}
.ink .box{{background:rgba(255,255,255,.06)}}
.box h4{{font:800 14px Gabarito;margin-bottom:5px}} .box p,.box li{{font-size:11px;line-height:1.5}} .box li{{margin-left:15px}}
.cols{{display:grid;gap:14px}}
.toc{{display:grid;grid-template-columns:1fr 1fr;column-gap:40px;margin-top:20px}}
.toc div{{display:flex;gap:14px;padding:10px 0;border-bottom:1px solid rgba(20,9,15,.12);font-size:14px;font-weight:600}}
.toc span{{color:{DEEP};font-weight:800;width:26px}}
.tl{{display:flex;gap:10px;align-items:flex-end;margin-top:14px}}
.tl div{{flex:1;text-align:center;font-size:9.5px;line-height:1.3}} .tl b{{display:block;font:800 11px Gabarito;margin-top:6px}}
.tl .im{{height:96px;display:grid;place-items:center;background:{WHITE};border-radius:14px}}
.tl .on .im{{outline:3px solid {DEEP}}}
.big{{display:grid;place-items:center}}
.grid4{{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:12px}}
.tile{{border-radius:18px;height:150px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;font-size:10px}}
.dont{{position:relative;border-radius:16px;height:140px;display:grid;place-items:center;background:{WHITE};overflow:hidden}}
.dont:after{{content:"";position:absolute;inset:0;background:linear-gradient(to top right,transparent 49.3%,{DEEP} 49.5%,{DEEP} 50.5%,transparent 50.7%)}}
.dont>*:first-child{{margin-bottom:22px}}
.dont span{{position:absolute;bottom:8px;left:10px;right:10px;font-size:9.5px;font-weight:700;text-align:center;z-index:2}}
.sw{{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-top:12px}}
.sw div{{border-radius:16px;height:170px;padding:12px;display:flex;flex-direction:column;justify-content:flex-end;font-size:10px;line-height:1.4}}
.sw b{{font:800 15px Gabarito}}
.bar{{display:flex;height:34px;border-radius:12px;overflow:hidden;margin-top:14px}} .bar i{{display:flex;align-items:center;padding-left:8px;font:700 9.5px Figtree;font-style:normal}}
.pairs{{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}}
.pairs div{{border-radius:12px;padding:10px 12px;font:800 15px Gabarito;display:flex;justify-content:space-between;align-items:center}}
.pairs small{{font:700 10px Figtree}}
.type-a{{font:800 76px/1 Gabarito;letter-spacing:-.03em}} .type-b{{font:400 15px/1.5 Figtree}}
.scale div{{display:flex;align-items:baseline;gap:14px;border-bottom:1px solid rgba(20,9,15,.08);padding:5px 0}}
.scale small{{width:110px;font-size:10px;color:rgba(20,9,15,.6)}}
.dash-row{{display:flex;align-items:center;gap:7px}} .dash-row i{{display:block;height:10px;border-radius:5px}}
.comp{{display:flex;flex-wrap:wrap;gap:12px;align-items:center}}
.btnx{{display:inline-flex;align-items:center;gap:7px;font:800 13px Figtree;padding:12px 18px;border-radius:999px}}
.pillx{{display:inline-flex;align-items:center;gap:5px;font:800 11px Figtree;padding:5px 11px;border-radius:999px}}
.inputx{{border:1.5px solid rgba(20,9,15,.15);border-radius:14px;padding:12px 14px;font-size:13px;color:rgba(20,9,15,.55);width:260px;background:{WHITE}}}
.voice td{{font-size:11px;line-height:1.45;padding:8px 10px;border-bottom:1px solid rgba(20,9,15,.08);vertical-align:top}}
.voice th{{font:800 12px Gabarito;text-align:left;padding:6px 10px}}
.frames{{display:flex;gap:16px;align-items:flex-end;margin-top:10px}} .frames div{{text-align:center;font-size:10px}}
.files td{{font-size:11px;padding:6px 10px;border-bottom:1px solid rgba(20,9,15,.08)}} .files code{{font-size:10.5px}}
"""


# ------------------------------------------------------------------ páginas
def p_cover():
    return f"""<section class="page ink" style="display:grid;grid-template-columns:1.15fr 1fr;align-items:center;gap:30px">
<div>{img(L("lockup-horizontal-branco"), h=44)}
<div class="kicker" style="margin-top:70px;color:{PINK}">Identidade visual · v2 · 2028</div>
<h1 style="font-size:66px">Seu close,<br><em>seu preço.</em></h1>
<p class="lead" style="margin-top:16px;max-width:470px">Manual da marca Clozzy: o C com a estrela e a ponta em <b>·&nbsp;–&nbsp;––</b>, rosa, roxo, preto e branco, Gabarito e Figtree. Junta tudo que decidimos nas rodadas de logo, nas referências e nas telas-modelo.</p></div>
<div class="big">{img(L("simbolo-pink-no-ink"), 360)}</div>{foot(1)}</section>"""


TOC = ["Essência", "De onde viemos", "O símbolo", "Construção", "Lockups", "Respiro e tamanhos", "Versões de cor",
       "Usos incorretos", "Cores", "Tipografia", "Linguagem gráfica", "Ícones e redes", "Componentes de interface",
       "Telas", "Telas no escuro", "Movimento", "Voz", "Arquivos e tokens"]


def p_toc():
    rows = "".join(f'<div><span>{i + 3:02d}</span>{t}</div>' for i, t in enumerate(TOC))
    return f"""<section class="page white"><div class="kicker">Sumário</div><h2>Manual em <em>{len(TOC) + 2}</em> páginas</h2>
<div class="toc">{rows}</div>{foot(2)}</section>"""


def p_essence(n):
    kws = ["vídeos", "stories", "chat", "videochat", "fechado", "privado", "close", "close friends", "estrela"]
    return f"""<section class="page cream"><div class="kicker">{n:02d} · Essência</div><h2>O <em>close friends</em> pago</h2>
<p class="lead">O Clozzy é onde influencers vendem conteúdo exclusivo direto para fãs, e onde o fã compra, acessa e acompanha num só lugar: perfil, oferta, Pix e biblioteca.</p>
<div class="cols" style="grid-template-columns:repeat(3,1fr);margin-top:14px">
<div class="box"><h4>Promessa</h4><p style="font:800 26px/1.05 Gabarito;margin-top:6px">Seu close,<br><span style="color:{DEEP}">seu preço.</span></p><p style="margin-top:8px">O criador decide quem entra e quanto custa. O fã sabe o que comprou e onde abre.</p></div>
<div class="box"><h4>Personalidade</h4><ul><li><b>Próximo</b>: fala como amigo, não como plataforma.</li><li><b>Direto</b>: preço, o que inclui, um botão.</li><li><b>Confiante</b>: o exclusivo é produto, não favor.</li><li><b>Discreto</b>: sensual sem ser explícito.</li></ul></div>
<div class="box"><h4>Para quem</h4><ul><li><b>Criador</b>: monta a vitrine, define o preço e recebe no Pix.</li><li><b>Fã</b>: entra no Close, vê os stories, os vídeos e o chat.</li><li><b>Operação</b>: catálogo, pagamento e acesso sob controle.</li></ul></div>
</div>
<div class="box" style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap;align-items:center"><h4 style="margin:0 10px 0 0">Palavras-chave</h4>{"".join(f'<span class="pillx" style="border:1.5px solid {PURPLE};color:{PURPLE}">{k}</span>' for k in kws)}</div>
{foot(n)}</section>"""


def p_journey(n):
    steps = [(b64(V1, "image/svg+xml"), "v1 atual", "disco roxo + estrela", 150, False),
             (b64(sorted(REFS.glob("*13.25.20*.png"))[0], "image/png"), "R1 · Círculo próximo", "C + estrela (print 5)", 80, False),
             (ref_svg("logo-possibilidades", "03-add-color"), "R4 · anel tracejado", "story “adicionar”", 80, False),
             (ref_svg("logo-circulo-tracejado", "e-espelhado-color"), "R5 · espelhado", "estrela original", 80, False),
             (ref_svg("logo-c-tracos", "t2-sutil-color"), "R7 · · – –– ", "espessura constante", 80, False),
             (L("simbolo-deep"), "R8 · v2", "sutil, vão 5", 84, True)]
    cells = "".join(f'<div class="{"on" if on else ""}"><div class="im">{img(src, w)}</div><b>{t}</b>{s}</div>' for src, t, s, w, on in steps if src)
    return f"""<section class="page white"><div class="kicker">{n:02d} · De onde viemos</div><h2>Da estrela no disco ao <em>C que vira story</em></h2>
<p class="lead">Oito rodadas, sempre a partir dos seus prints em <code>marca/refs</code>. A v2 mantém o que já era Clozzy (estrela, círculo, rosa) e soma o gesto do story: a ponta do C se desfaz em ponto e traços.</p>
<div class="tl">{cells}</div>
<div class="cols" style="grid-template-columns:repeat(4,1fr);margin-top:18px">
<div class="box"><h4>Fica</h4><p>Estrela, círculo, rosa, “clozzy” em caixa baixa.</p></div>
<div class="box"><h4>Muda</h4><p>O disco cheio vira um C aberto. Em vez de 3 marcas diferentes (app, site, Figma), passa a existir um símbolo só.</p></div>
<div class="box"><h4>Entra</h4><p>A ponta · – –– (story, close friends) e o roxo da v1 como acento.</p></div>
<div class="box"><h4>Sai</h4><p>Montserrat/Proxima/Inter, #FE2C55 e outros rosas, gradiente e paletas multicor.</p></div>
</div>{foot(n)}</section>"""


def p_symbol(n):
    return f"""<section class="page cream"><div class="kicker">{n:02d} · O símbolo</div><h2>Um C, uma estrela, <em>um story</em></h2>
<div style="display:grid;grid-template-columns:400px 1fr;gap:36px;align-items:center;margin-top:8px">
<div class="big">{img(L("simbolo-deep"), 380)}</div>
<div class="cols" style="grid-template-columns:1fr">
<div class="box"><h4>C de clozzy · círculo de close</h4><p>O anel é o círculo dos amigos próximos e também o C do nome. A abertura fica onde a ponta da estrela aponta: o exclusivo sai do círculo direto para o fã.</p></div>
<div class="box"><h4>A estrela</h4><p>O favorito, o “close”, o selo de quem está dentro. É a estrela original do Círculo próximo, arredondada e sem ângulo agressivo.</p></div>
<div class="box"><h4>A ponta  ·  –  ––</h4><p>Na ponta de cima, o C vira um ponto, um traço e um traço maior, sempre com a mesma espessura, como o anel de um story novo. É discreto: de longe, um C; de perto, um story.</p></div>
</div></div>{foot(n)}</section>"""


def p_construction(n):
    import math
    w, rm = 10, 40
    g = (f'<circle cx="50" cy="50" r="{rm}" fill="none" stroke="rgba(20,9,15,.22)" stroke-width=".3" stroke-dasharray="1 1"/>'
         f'<circle cx="50" cy="50" r="45" fill="none" stroke="rgba(20,9,15,.12)" stroke-width=".3"/>'
         f'<circle cx="50" cy="50" r="20.5" fill="none" stroke="rgba(20,9,15,.22)" stroke-width=".3" stroke-dasharray="1 1"/>'
         f'<line x1="0" y1="50" x2="100" y2="50" stroke="rgba(20,9,15,.18)" stroke-width=".3" stroke-dasharray="1 1"/>'
         f'<line x1="50" y1="0" x2="50" y2="100" stroke="rgba(20,9,15,.18)" stroke-width=".3" stroke-dasharray="1 1"/>')
    x, y = 50 + 49 * math.cos(math.radians(-18)), 50 + 49 * math.sin(math.radians(-18))
    g += f'<line x1="50" y1="50" x2="{x:.1f}" y2="{y:.1f}" stroke="{PURPLE}" stroke-width=".4"/>'
    return f"""<section class="page white"><div class="kicker">{n:02d} · Construção</div><h2>Grid <em>100</em></h2>
<div style="display:grid;grid-template-columns:420px 1fr;gap:36px;align-items:center;margin-top:6px">
{img(sv(MK.svg(MK.symbol() + g, 100, 100)), 420)}
<div class="cols" style="grid-template-columns:1fr 1fr">
<div class="box"><h4>C</h4><p>Raio externo 45, traço 10 (raio médio 40), pontas redondas. Abertura de 54° centrada em −18° (linha roxa).</p></div>
<div class="box"><h4>Ponta</h4><p>Da ponta para dentro: ponto (≈ 14°), traço de 20°, traço de 30° e o C. Vão de 5 (≈ 7°) entre eles. Mesma espessura em tudo.</p></div>
<div class="box"><h4>Estrela</h4><p>Centro 50/50, raio 20,5, miolo 0,48, cantos arredondados 5. Não muda de tamanho nem de posição.</p></div>
<div class="box"><h4>Corte pequeno</h4><p>Até 24 px: traço 14, só ponto + um traço (<code>simbolo-16-*.svg</code>). Acima de 24 px: master.</p></div>
</div></div>{foot(n)}</section>"""


def p_lockups(n):
    return f"""<section class="page cream"><div class="kicker">{n:02d} · Lockups</div><h2>Símbolo, nome e <em>os dois juntos</em></h2>
<div class="cols" style="grid-template-columns:1.4fr 1fr;margin-top:12px">
<div class="box" style="height:190px;display:grid;place-items:center">{img(L("lockup-horizontal-deep"), h=96)}</div>
<div class="box" style="height:190px;display:grid;place-items:center">{img(L("lockup-vertical-deep"), h=150)}</div>
<div class="box" style="height:150px;display:grid;place-items:center;background:{INK}">{img(L("lockup-horizontal-pink-no-ink"), h=76)}</div>
<div class="cols" style="grid-template-columns:1fr 1fr"><div class="box" style="height:150px;display:grid;place-items:center">{img(L("simbolo-deep"), 110)}</div><div class="box" style="height:150px;display:grid;place-items:center">{img(L("wordmark-ink"), 140)}</div></div>
</div>
<div class="cols" style="grid-template-columns:repeat(4,1fr);margin-top:12px">
<div class="box"><h4>Horizontal</h4><p>Padrão: header, site, documentos. Altura do “l” = 52% do símbolo.</p></div>
<div class="box"><h4>Empilhado</h4><p>Espaços quadrados: splash, capa, merch.</p></div>
<div class="box"><h4>Só símbolo</h4><p>App, avatar, favicon, selo, marca d'água.</p></div>
<div class="box"><h4>Só nome</h4><p>Gabarito 800 em curvas, tracking −18. Só onde o símbolo já aparece por perto.</p></div>
</div>{foot(n)}</section>"""


def p_space(n):
    clear = (f'<rect x="-20" y="-20" width="140" height="140" fill="none" stroke="{PURPLE}" stroke-width=".6" stroke-dasharray="2 1.5"/>'
             f'<rect x="0" y="0" width="100" height="100" fill="none" stroke="rgba(20,9,15,.2)" stroke-width=".4"/>')
    s = MK.svg(f'<g transform="translate(20 20)">{MK.symbol()}{clear}</g>', 140, 140, vb="0 0 140 140")
    sizes = "".join(f'<div style="text-align:center">{img(L("simbolo-16-deep" if px <= 24 else "simbolo-deep"), px, style="margin:0 auto")}<small style="font-size:10px">{px}px</small></div>'
                    for px in (64, 48, 32, 24, 20, 16))
    return f"""<section class="page white"><div class="kicker">{n:02d} · Respiro e tamanhos</div><h2>Espaço em volta e <em>tamanho mínimo</em></h2>
<div style="display:grid;grid-template-columns:330px 1fr;gap:36px;align-items:center;margin-top:10px">
{img(sv(s), 320)}
<div><div class="cols" style="grid-template-columns:1fr 1fr">
<div class="box"><h4>Respiro</h4><p>2× o ponto (20% do símbolo) em todos os lados, linha roxa. Nada entra nessa área: texto, borda ou outra marca.</p></div>
<div class="box"><h4>Mínimos</h4><p>Símbolo: 16 px (corte pequeno até 24 px). Lockup horizontal: 88 px de largura. Empilhado: 56 px. Impressão: símbolo 6 mm.</p></div></div>
<div class="box" style="margin-top:14px;display:flex;gap:26px;align-items:flex-end;justify-content:center">{sizes}</div>
<div class="box" style="margin-top:14px;display:flex;gap:18px;align-items:center;justify-content:center">{img(L("lockup-horizontal-deep"), h=40)}{img(L("lockup-horizontal-deep"), h=26)}{img(L("lockup-horizontal-deep"), h=20)}<small style="font-size:10px">lockup 160 · 104 · 88 px</small></div>
</div></div>{foot(n)}</section>"""


def p_colors_logo(n):
    tiles = [("simbolo-deep", WHITE, "Pink Deep · principal no claro"), ("simbolo-pink", WHITE, "Pink Clozzy"),
             ("simbolo-ink", WHITE, "Preto (uma cor)"), ("simbolo-roxo", WHITE, "Roxo"),
             ("simbolo-rosa-estrela-roxa", CREAM, "Rosa + estrela roxa (v1)"), ("simbolo-pink-no-ink", INK, "Rosa no preto · principal no escuro"),
             ("simbolo-pink-estrela-branca", INK, "Rosa + estrela branca no preto"), ("simbolo-branco", INK, "Branco no preto"),
             ("simbolo-branco", PINK, "Branco no rosa"), ("simbolo-branco", DEEP, "Branco no Pink Deep"),
             ("simbolo-branco", PURPLE, "Branco no roxo"), ("simbolo-ink", PINK, "Preto no rosa")]
    t = "".join(f'<div class="tile" style="background:{bg};{"border:1px solid rgba(20,9,15,.08);" if bg == WHITE else ""}{"color:#fff;" if bg in (INK, PINK, DEEP, PURPLE) else ""}">{img(L(s), 86)}<span>{lab}</span></div>' for s, bg, lab in tiles)
    return f"""<section class="page cream"><div class="kicker">{n:02d} · Versões de cor</div><h2>Rosa, roxo, <em>preto e branco</em></h2>
<div class="grid4">{t}</div>
<p class="lead" style="margin-top:10px">Principal: <b>Pink Deep no claro</b> e <b>Pink Clozzy no escuro</b>. Sobre cor (rosa, Deep ou roxo), o símbolo vai todo branco. Duas cores no símbolo só em peças de marca, nunca em tamanho pequeno.</p>{foot(n)}</section>"""


def p_dont(n):
    s = L("simbolo-deep")
    items = [
        (f'{img(s, 90, style="transform:scaleX(1.4)")}', "Esticar ou achatar"),
        (f'{img(s, 90, style="transform:rotate(90deg)")}', "Girar (a abertura tem lugar fixo)"),
        (f'<div style="width:96px;height:96px;border-radius:50%;background:linear-gradient(135deg,{PINK},{PURPLE});display:grid;place-items:center">{img(L("simbolo-branco"), 70)}</div>', "Gradiente rosa → roxo"),
        (f'{img(s, 90, style="filter:drop-shadow(0 0 10px {PINK}) drop-shadow(0 0 18px {PINK})")}', "Glow, sombra ou neon"),
        (f'<div style="background:{PURPLE};padding:14px;border-radius:12px">{img(L("simbolo-pink"), 70)}</div>', "Rosa sobre roxo (1,5:1)"),
        (f'{img(sym(DEEP, DEEP, False).replace("", ""), 90, style="transform:scaleX(-1)")}', "Espelhar (a ponta vai para a esquerda)"),
        (f'<svg viewBox="0 0 100 100" width="90"><circle cx="50" cy="50" r="40" fill="none" stroke="{DEEP}" stroke-width="10"/><polygon points="{MK._logos.star_points()}" fill="{DEEP}" stroke="{DEEP}" stroke-width="5" stroke-linejoin="round"/></svg>', "Fechar o C ou tirar a ponta"),
        (f'<div style="display:flex;align-items:center;gap:6px">{img(s, 50)}<span style="font:400 22px Georgia,serif">clozzy</span></div>', "Trocar a fonte do nome"),
    ]
    t = "".join(f'<div class="dont">{c}<span>{lab}</span></div>' for c, lab in items)
    return f"""<section class="page white"><div class="kicker">{n:02d} · Usos incorretos</div><h2>O que <em>não fazer</em></h2>
<div class="grid4">{t}</div>
<p class="lead" style="margin-top:12px">Também não pode: recolorir fora da paleta, trocar a estrela por coração ou chama, pôr sobre foto agitada sem placa sólida, usar “meuclozzy” como logo, ou mudar a ordem da ponta (é sempre · – –– da ponta para dentro).</p>{foot(n)}</section>"""


def p_colors(n):
    sw = [(PINK, INK, "Pink Clozzy", "#FF0065", "Símbolo no escuro, anel do Close, destaques, splash. Ink por cima 5,1:1."),
          (DEEP, WHITE, "Pink Deep", "#E0005A", "Botões, links, símbolo no claro. Branco por cima 4,9:1 (AA)."),
          (PURPLE, WHITE, "Roxo", "#7C48C4", "Acento: chat, convite, drop, estrela alternativa. Branco 5,9:1."),
          (INK, WHITE, "Ink (preto)", "#14090F", "Texto e modo escuro. 19,5:1 sobre branco."),
          (CREAM, INK, "Cream", "#FFF6F0", "Fundo quente: chat, caixas, telas de marca. Ink 18,3:1."),
          (WHITE, INK, "Branco", "#FFFFFF", "Fundo base do produto.")]
    s = "".join(f'<div style="background:{b};color:{t};{"border:1px solid rgba(20,9,15,.1);" if b in (WHITE, CREAM) else ""}"><b>{nm}</b>{hx}<br><span style="opacity:.85">{u}</span></div>' for b, t, nm, hx, u in sw)
    bar = "".join(f'<i style="width:{w}%;background:{b};color:{t}">{lab}</i>' for w, b, t, lab in
                  [(44, WHITE, INK, "branco 44"), (18, CREAM, INK, "cream 18"), (22, INK, WHITE, "ink 22"), (10, DEEP, WHITE, "rosa 10"), (6, PURPLE, WHITE, "roxo 6")])
    pairs = "".join(f'<div style="background:{b};color:{t}">Aa<small>{r}</small></div>' for b, t, r in
                    [(WHITE, INK, "19,5:1"), (CREAM, INK, "18,3:1"), (DEEP, WHITE, "4,9:1"), (PURPLE, WHITE, "5,9:1"),
                     (PINK, INK, "5,1:1"), (INK, WHITE, "19,5:1"), (INK, PINK, "5,1:1"), (PINK, WHITE, "3,9:1 · só ≥ 24 bold")])
    return f"""<section class="page white"><div class="kicker">{n:02d} · Cores</div><h2>Seis cores, <em>nenhuma a mais</em></h2>
<div class="sw">{s}</div>
<div class="bar" style="border:1px solid rgba(20,9,15,.08)">{bar}</div>
<div class="pairs">{pairs}</div>
<p class="lead" style="margin-top:10px">Estados (sucesso, erro, aviso) não ganham cor nova: usam ink, ícone e texto claro, e o rosa quando precisam chamar atenção. Nunca texto rosa sobre roxo ou roxo sobre rosa (1,5:1). Sem gradiente, glow ou neon.</p>{foot(n)}</section>"""


def p_type(n):
    scale = "".join(f'<div><small>{lab}</small><span style="font:{wgt} {px}px/{lh} {fam};letter-spacing:{ls}">{txt}</span></div>' for lab, wgt, px, lh, fam, ls, txt in [
        ("Display · Gabarito 800 · 64", 800, 52, 1.0, "Gabarito", "-.03em", "Seu close, seu preço."),
        ("H1 · Gabarito 800 · 44", 800, 36, 1.05, "Gabarito", "-.02em", "Entrar no Close"),
        ("H3 / preço · Gabarito 800 · 22", 800, 22, 1.1, "Gabarito", "-.01em", "R$ 19,90/mês"),
        ("Body · Figtree 400 · 16", 400, 15, 1.5, "Figtree", "0", "Stories, vídeos e chat que só quem está no Close vê."),
        ("Label · Figtree 700 · 12", 700, 12, 1.3, "Figtree", ".12em", "DROP HOJE · 21H")])
    return f"""<section class="page cream"><div class="kicker">{n:02d} · Tipografia</div><h2>Gabarito fala alto, <em>Figtree explica</em></h2>
<div style="display:grid;grid-template-columns:1fr 1.3fr;gap:30px;margin-top:10px">
<div class="box"><div class="type-a">Aa<span style="color:{DEEP}">★</span></div><p style="font:800 16px Gabarito;margin-top:6px">Gabarito · 700–900</p><p>Títulos, preços, números, botões e o nome. Geométrica arredondada, conversa com o C e a estrela.</p>
<div class="type-a" style="font:400 56px/1 Figtree;margin-top:18px">Aa</div><p style="font:700 16px Figtree;margin-top:6px">Figtree · 400–700</p><p>Interface, formulários e texto corrido. Mono do sistema para chave Pix e códigos.</p>
<p style="margin-top:8px;font-size:10.5px">Ambas OFL (Google Fonts). Arquivos em <code>fonts/</code>. Não usar Montserrat, Proxima, Inter ou Roboto como voz da marca.</p></div>
<div class="box scale">{scale}</div></div>{foot(n)}</section>"""


def dashes(color, h=10, seq=(10, 22, 34, 120), gap=7):
    return f'<div class="dash-row" style="gap:{gap}px">' + "".join(f'<i style="width:{w}px;height:{h}px;background:{color}"></i>' for w in seq) + "</div>"


def p_graphic(n):
    ph = [RA.PH[i] for i in (1, 2, 4, 6)]
    def ring_av(src, size=74):
        r = 120
        body = MK.S.c_tracos_shape(PINK, 7, [0, 20, 30], gap=5) if False else ""
        return (f'<div style="position:relative;width:{size}px;height:{size}px;display:grid;place-items:center">'
                f'<svg viewBox="0 0 100 100" width="{size}" height="{size}" style="position:absolute;inset:0">{MK.S.c_tracos_shape(PINK, 6, [0, 20, 30], gap=5).replace("<path", "<path")}</svg>'
                f'<img src="{src}" style="width:{size - 22}px;height:{size - 22}px;border-radius:50%;object-fit:cover"></div>')
    avs = "".join(ring_av(p) for p in ph)
    return f"""<section class="page white"><div class="kicker">{n:02d} · Linguagem gráfica</div><h2>A ponta vira <em>linguagem</em></h2>
<div class="cols" style="grid-template-columns:1fr 1fr;margin-top:10px">
<div class="box"><h4>Traço gradativo</h4><p>O ritmo da ponta (· – –– ————) vira divisor, barra de progresso e borda de seção. Sempre na mesma espessura, e o ponto sempre na ponta.</p>
<div style="margin-top:14px;display:flex;flex-direction:column;gap:12px">{dashes(DEEP)}{dashes(PURPLE, 8, (8, 18, 28, 220), 6)}{dashes(INK, 4, (4, 10, 16, 260), 4)}</div></div>
<div class="box"><h4>Anel do Close no avatar</h4><p>Quem tem story novo no Close ganha o anel com a ponta do logo. Quem já foi visto fica com o anel fino em ink a 12%.</p>
<div style="display:flex;gap:12px;margin-top:12px">{avs}</div></div>
<div class="box"><h4>Selo de estrela</h4><p>A estrela sozinha marca “você está dentro”: badge no avatar, pill “Close” e conteúdo liberado.</p>
<div class="comp" style="margin-top:12px"><span class="pillx" style="background:{PINK};color:{INK}">★ Close</span><span class="pillx" style="background:{PURPLE};color:#fff">★ Exclusivo</span><span class="pillx" style="background:{INK};color:#fff">★ Liberado</span><span class="pillx" style="background:#fff;color:{INK};border:1.5px solid {INK}">★ Drop 21h</span></div></div>
<div class="box"><h4>Conteúdo fechado</h4><p>O preview bloqueado fica borrado com uma placa sólida (cream ou ink) e o cadeado. A promessa aparece, o conteúdo não. Sem blur sobre nudez.</p>
<div style="display:flex;gap:10px;margin-top:12px">{"".join(f'<div style="position:relative;width:90px;height:110px;border-radius:14px;overflow:hidden"><img src="{p}" style="width:100%;height:100%;object-fit:cover;filter:blur(10px);transform:scale(1.2)"><span style="position:absolute;inset:auto 8px 8px 8px;background:{CREAM};border-radius:10px;font:800 10px Figtree;padding:6px;text-align:center">🔒 R$ 9,90</span></div>' for p in ph[:3])}</div></div>
</div>{foot(n)}</section>"""


def p_icons(n):
    apps = "".join(f'<div style="text-align:center">{img(L("app-icon-" + b), 108)}<div style="font-size:10px;margin-top:6px">{t}</div></div>' for b, t in
                   [("rosa", "Rosa (principal)"), ("deep", "Pink Deep"), ("roxo", "Roxo"), ("ink", "Preto"), ("branco", "Branco")])
    return f"""<section class="page cream"><div class="kicker">{n:02d} · Ícones e redes</div><h2>Ícone do app, <em>favicon e avatar</em></h2>
<div style="display:flex;gap:24px;justify-content:center;margin-top:14px">{apps}</div>
<div class="cols" style="grid-template-columns:1fr 1fr 1.3fr;margin-top:18px">
<div class="box" style="display:flex;gap:18px;align-items:center">{img(L("favicon"), 32)}{img(L("favicon"), 16)}<span style="display:flex;gap:8px;align-items:center;background:{CREAM};padding:7px 12px;border-radius:9px;font-size:11px">{img(L("favicon"), 16)}Clozzy · Seu close</span></div>
<div class="box" style="display:flex;gap:18px;align-items:center">{img(L("avatar-social"), 92)}{img(L("avatar-social-ink"), 92)}</div>
<div class="box"><h4>Regras</h4><ul><li>Ícone padrão: tile rosa com o símbolo branco, como o app performer atual.</li><li>Favicon e ≤ 24 px: corte pequeno (traço 14).</li><li>Avatar nas redes: círculo Pink Deep com o símbolo branco. Em perfis escuros, ink com o símbolo rosa.</li></ul></div>
</div>{foot(n)}</section>"""


def p_components(n):
    return f"""<section class="page white"><div class="kicker">{n:02d} · Componentes</div><h2>Interface <em>com a marca</em></h2>
<div class="cols" style="grid-template-columns:1fr 1fr;margin-top:10px">
<div class="box"><h4>Botões</h4><div class="comp" style="margin-top:8px"><span class="btnx" style="background:{DEEP};color:#fff">Entrar no Close · R$ 19,90</span><span class="btnx" style="background:{INK};color:#fff">Me avise</span><span class="btnx" style="border:1.5px solid rgba(20,9,15,.2)">Mensagem</span><span class="btnx" style="background:{PURPLE};color:#fff">Aceitar convite</span></div>
<p style="margin-top:8px">Principal sempre Pink Deep com texto branco. No escuro, Pink Clozzy com texto ink. Um botão principal por tela.</p></div>
<div class="box"><h4>Pills e selos</h4><div class="comp" style="margin-top:8px"><span class="pillx" style="background:{PINK};color:{INK}">★ Close</span><span class="pillx" style="background:#fff;color:{INK};border:1.5px solid rgba(20,9,15,.15)">R$ 19,90/mês</span><span class="pillx" style="background:{PURPLE};color:#fff">Drop 21h</span><span class="pillx" style="background:{INK};color:#fff">✓ Pago no Pix</span></div>
<p style="margin-top:8px">“Pago” e “liberado” em ink com ✓, sem verde.</p></div>
<div class="box"><h4>Campos</h4><div class="comp" style="margin-top:8px"><span class="inputx">E-mail</span><span class="inputx" style="border-color:{INK};color:{INK}">nina@clozzy.com</span></div>
<p style="margin-top:8px">Raio 14, borda ink 15%, foco ink. Erro: texto ink + ícone ! e borda Pink Deep.</p></div>
<div class="box"><h4>Raios e espaço</h4><div class="comp" style="margin-top:8px">{"".join(f'<div style="width:60px;height:60px;border-radius:{r}px;background:{CREAM};border:1px solid rgba(20,9,15,.12);display:grid;place-items:center;font-size:10px">{r}</div>' for r in (10, 18, 28))}<div style="width:110px;height:40px;border-radius:999px;background:{CREAM};border:1px solid rgba(20,9,15,.12);display:grid;place-items:center;font-size:10px">pill</div></div>
<p style="margin-top:8px">10 chips · 18 cards · 28 telas e modais · pill em botões. Grade de 4 px.</p></div>
</div>{foot(n)}</section>"""


def p_screens(n):
    scr = [(RA.s_home("x"), "Home · stories + drop"), (RA.s_perfil(), "Perfil do criador"), (RA.s_checkout(), "Checkout Pix")]
    phones = "".join(f'<div class="pw">{s}<div class="cap"><b>{t}</b></div></div>' for s, t in scr)
    return f"""<section class="page cream"><div class="kicker">{n:02d} · Telas</div><h2>O Clozzy <em>no celular</em></h2>
<div class="phones">{phones}</div>{foot(n)}</section>"""


def p_screens_dark(n):
    scr = [(RA.s_story(), "Story fechado"), (RA.s_chat(), "Chat privado"), (RA.s_painel(), "Painel do criador")]
    phones = "".join(f'<div class="pw">{s}<div class="cap"><b>{t}</b></div></div>' for s, t in scr)
    return f"""<section class="page ink"><div class="kicker">{n:02d} · Telas</div><h2>Stories, chat <em>e painel</em></h2>
<div class="phones">{phones}</div>{foot(n)}</section>"""


def p_motion(n):
    S = MK.S
    frames = ""
    stages = [("0", MK._logos and ""), ("120", ""), ("260", ""), ("400", ""), ("520 ms", "")]
    for k, (t, _) in enumerate(stages):
        if k == 0:
            body = S.star(PINK)
        elif k == 1:
            body = S.line(PINK, 10, -3.4 + 7.2, 120) + S.star(PINK)
        elif k == 2:
            body = S.line(PINK, 10, -3.4 + 7.2, 250) + S.star(PINK)
        elif k == 3:
            import re as _re
            els = _re.findall(r"<(?:circle|path)[^>]*/>", S.c_tracos_shape(PINK, 10, [0, 20, 30], gap=5))
            body = "".join(els[2:]) + S.star(PINK)   # sem o ponto e o traço curto: entram no último quadro
        else:
            body = MK.symbol(PINK)
        frames += f'<div>{img(sv(MK.svg(body, 100, 100)), 96)}<div style="margin-top:6px;opacity:.75">{t}</div></div>'
    return f"""<section class="page ink"><div class="kicker">{n:02d} · Movimento</div><h2>Assinatura: <em>o C se fecha, a ponta acende</em></h2>
<div class="frames">{frames}</div>
<div class="cols" style="grid-template-columns:repeat(3,1fr);margin-top:20px">
<div class="box"><h4>Assinatura · 520 ms</h4><p>A estrela aparece (pop), o C se desenha no sentido horário e por último entram o ponto e os traços, da ponta para dentro. Usar em splash, “acesso liberado” e fim de vídeo.</p></div>
<div class="box"><h4>Micro · 120–220 ms</h4><p>Botões e pills: ease-out. Selo de estrela: ease-pop. O anel do avatar gira 1 volta lenta enquanto carrega o story.</p></div>
<div class="box"><h4>Reduced motion</h4><p>Com <code>prefers-reduced-motion</code>, mostra só o quadro final, sem rotação nem pop.</p></div>
</div>{foot(n)}</section>"""


def p_voice(n):
    rows = [("Entrar no Close", "Assinar plano premium"), ("Seu exclusivo tem preço. Monte a vitrine e mande o link.", "Monetize seu engajamento com soluções digitais"),
            ("Pago no Pix. Liberado na sua biblioteca.", "Transação processada com sucesso"), ("Drop da Nina às 21h. Quer que a gente te avise?", "Novo conteúdo disponível em breve!!! 🔥🔥"),
            ("Você só paga se vender.", "Taxas competitivas para criadores de conteúdo")]
    tr = "".join(f'<tr><td><b style="color:{DEEP}">✓</b> {a}</td><td><b>✗</b> {b}</td></tr>' for a, b in rows)
    return f"""<section class="page cream"><div class="kicker">{n:02d} · Voz</div><h2>Fala como <em>amigo próximo</em></h2>
<div style="display:grid;grid-template-columns:1.4fr 1fr;gap:20px;margin-top:10px">
<div class="box"><table class="voice" style="width:100%;border-collapse:collapse"><tr><th>Assim</th><th>Não assim</th></tr>{tr}</table></div>
<div class="cols" style="grid-template-columns:1fr">
<div class="box"><h4>Tom</h4><ul><li>Casual, mas não infantil.</li><li>Sensual pela sugestão, nunca explícito.</li><li>Frases curtas; o preço sempre visível.</li></ul></div>
<div class="box"><h4>Glossário</h4><p><b>Close</b> (a assinatura) · <b>exclusivo</b> · <b>drop</b> · <b>pack</b> · <b>biblioteca</b> · <b>vitrine</b>. Nunca “+18 hot”, “plataforma de conteúdo adulto” ou emoji de fogo e berinjela como identidade.</p></div>
</div></div>{foot(n)}</section>"""


def p_files(n):
    rows = [("logos/simbolo-*.svg", "Símbolo: deep, pink, ink, roxo, branco, combinações"), ("logos/simbolo-16-*.svg", "Corte ≤ 24 px"),
            ("logos/lockup-horizontal-*.svg · lockup-vertical-*.svg", "Lockups por cor"), ("logos/wordmark-*.svg", "Só o nome"),
            ("logos/app-icon-*.svg · favicon.svg · avatar-social*.svg", "Ícones e redes"), ("export/*.png", "App 1024/512/180 · favicon 32/16 · avatar 800 · lockup 1200"),
            ("tokens.css", "Cores, tipo, raios, motion, dark"), ("BRAND.md", "One-pager"), ("fonts/", "Gabarito + Figtree (OFL)"),
            ("_marca.py · _build.py", "Geradores (python3 _marca.py && python3 _build.py)")]
    tr = "".join(f"<tr><td><code>{a}</code></td><td>{b}</td></tr>" for a, b in rows)
    return f"""<section class="page white"><div class="kicker">{n:02d} · Arquivos</div><h2>Tudo em <em>marca/identidade-v2</em></h2>
<div style="display:grid;grid-template-columns:1.5fr 1fr;gap:24px;margin-top:10px">
<div class="box"><table class="files" style="width:100%;border-collapse:collapse">{tr}</table></div>
<div class="box"><h4>Tokens principais</h4><pre style="font-size:10px;line-height:1.5;white-space:pre-wrap">--cz-pink: #FF0065;
--cz-pink-deep: #E0005A;
--cz-purple: #7C48C4;
--cz-ink: #14090F;
--cz-cream: #FFF6F0;
--cz-white: #FFFFFF;
--cz-font-display: Gabarito;
--cz-font-text: Figtree;
--cz-radius-m: 18px;
--cz-dur-signature: 520ms;</pre></div></div>{foot(n)}</section>"""


def export_png():
    out = HERE / "export"
    out.mkdir(exist_ok=True)
    jobs = [("app-icon-rosa", 1024), ("app-icon-rosa", 512), ("app-icon-rosa", 180), ("favicon", 32), ("favicon", 16),
            ("avatar-social", 800), ("simbolo-deep", 512)]
    made = []
    for name, px in jobs:
        html = HERE / "export" / "_tmp.html"
        html.write_text(f'<html><body style="margin:0;background:transparent"><img src="../logos/{name}.svg" style="width:{px}px;height:{px}px;display:block"></body></html>')
        dst = out / f"{name}-{px}.png"
        subprocess.run([CHROME, "--headless", "--disable-gpu", "--hide-scrollbars", "--default-background-color=00000000",
                        f"--window-size={px},{px}", f"--screenshot={dst}", html.as_uri()], capture_output=True)
        made.append(dst.name)
    html = HERE / "export" / "_tmp.html"
    html.write_text('<html><body style="margin:0;background:transparent"><img src="../logos/lockup-horizontal-deep.svg" style="width:1200px;display:block"></body></html>')
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--hide-scrollbars", "--default-background-color=00000000",
                    "--window-size=1200,348", f"--screenshot={out / 'lockup-horizontal-deep-1200.png'}", html.as_uri()], capture_output=True)
    html.unlink()
    return made


def build():
    fonts = HERE / "fonts"
    fonts.mkdir(exist_ok=True)
    for f in ("Gabarito-Variable.ttf", "Figtree-Variable.ttf"):
        shutil.copy(MARCA / "identidade-nova" / "fonts" / f, fonts / f)
    pages = [p_cover(), p_toc()]
    fns = [p_essence, p_journey, p_symbol, p_construction, p_lockups, p_space, p_colors_logo, p_dont, p_colors, p_type,
           p_graphic, p_icons, p_components, p_screens, p_screens_dark, p_motion, p_voice, p_files]
    for i, fn in enumerate(fns):
        pages.append(fn(i + 3))
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy — Identidade visual v2</title>'
            f'<style>{RA.css()}{EXTRA}</style></head><body>{"".join(pages)}</body></html>')
    OUT_HTML.write_text(html)
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer", f"--print-to-pdf={OUT_PDF}", OUT_HTML.as_uri()],
                   check=True, capture_output=True)
    export_png()
    return len(pages)


if __name__ == "__main__":
    print("pages", build())

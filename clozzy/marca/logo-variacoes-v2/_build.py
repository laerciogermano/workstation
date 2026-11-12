#!/usr/bin/env python3
"""Clozzy — documento da rodada 13 v2 (variações possíveis do logo, a partir do logo final v3).
Rodar: python3 _variacoes.py && python3 _build.py → HTML + PDF"""
import base64, importlib.util, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import _variacoes as A  # noqa: E402
import _usos as U  # noqa: E402

_spec = importlib.util.spec_from_file_location("rodada4_build", HERE.parent / "logo-possibilidades" / "_build.py")
PB = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(PB)   # CSS e helpers do documento da rodada 4

CHROME = PB.CHROME
OUT_HTML = HERE / "variacoes-logo-clozzy-v2.html"
OUT_PDF = HERE / "variacoes-logo-clozzy-v2.pdf"
PINK, DEEP, PURPLE, INK, CREAM, WHITE = A.PINK, A.DEEP, A.PURPLE, A.INK, A.CREAM, A.WHITE
img = PB.img


def L(name):
    return "data:image/svg+xml;base64," + base64.b64encode((HERE / "svg" / f"{name}.svg").read_bytes()).decode()


def foot(n):
    return f'<div class="foot"><span>Clozzy · variações do logo · rodada 13 v2 · nov 2026</span><span>{n:02d}</span></div>'


EXTRA = f"""
.vg{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px 16px;margin-top:16px}}
.vc{{background:{WHITE};border:1px solid rgba(20,9,15,.09);border-radius:16px;padding:12px;display:grid;
grid-template-columns:132px minmax(0,1fr);gap:12px;align-items:start}}
.vc.on{{border-color:{PINK};box-shadow:0 0 0 2px rgba(255,0,101,.14)}}
.vc .hero img{{border-radius:12px}}
.vc .num{{font:800 10px Figtree;color:{PINK};letter-spacing:.1em}}
.vc b{{display:block;font:800 15px Gabarito;margin:1px 0 4px}}
.vc p{{font-size:9.6px;line-height:1.38;color:rgba(20,9,15,.64)}}
.vc .row{{display:flex;gap:6px;align-items:center;margin-top:8px}}
.vc .row img{{border-radius:7px}}
.lk{{display:grid;grid-template-columns:repeat(3,1fr);gap:12px 16px;margin-top:14px}}
.lk div{{text-align:center;font:700 9.5px Figtree;color:rgba(20,9,15,.6)}}
.lk img{{width:100%;border-radius:10px;margin-bottom:5px}}
.ap{{display:grid;grid-template-columns:repeat(6,1fr);gap:14px 14px;margin-top:14px;text-align:center}}
.ap span{{display:block;font:700 9.5px Figtree;margin-top:5px;color:rgba(20,9,15,.6)}}
.sm{{display:grid;grid-template-columns:150px repeat(4,1fr);margin-top:12px;font-size:10px}}
.sm>div{{display:flex;align-items:center;justify-content:center;min-height:37px;border-bottom:1px solid rgba(20,9,15,.08)}}
.sm .n{{justify-content:flex-start;font:800 11.5px Gabarito}} .sm .h{{font-weight:800;color:rgba(20,9,15,.55)}}
.sm .dk{{background:{INK}}}
.pk{{display:flex;gap:22px;justify-content:center}}
.pk div{{text-align:center;font:800 13px Gabarito}}
"""


def p_cover():
    trio = "".join(img(L(f"{s}-preto"), 150, style="border-radius:22px") for s in A.MAIN)
    return f"""<section class="page ink" style="display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:30px">
<div><div class="kicker">Clozzy 2028 · Logo · rodada 13 v2</div>
<h1>Doze jeitos<br>de abrir<br>o <em>close.</em></h1>
<p class="lead" style="margin-top:18px;max-width:470px">Variações possíveis do logo, todas a partir do <b>logo final v3</b>:
o anel de story grosso em C, o tracejado à direita e a estrela no meio. Cada variação mexe numa coisa só, para dar
para comparar lado a lado.</p></div>
<div style="display:flex;gap:16px;justify-content:center">{trio}</div>{foot(1)}</section>"""


def p_base(n):
    fixed = ["Anel grosso: 9,5 no grid 100 (≈ 24/256)", "Forma de C, linha cheia abraçando a esquerda",
             "Tracejado na abertura, sentido do giro do story", "Traços com cantos arredondados, poucos e longos",
             "Estrela original, sem passar do círculo central", "Palavra Gabarito 800, sempre separada do símbolo",
             "Só rosa, Deep, roxo, ink, cream e branco"]
    varies = ["Quantos traços e o ritmo entre eles (02–05)", "Onde fica a abertura (06)",
              "Disco cheio com a estrela vazada (07)", "Contorno em squircle (08)",
              "Estrela em linha ou escapando do anel (09–10)", "Raios no lugar de arcos (11)",
              "Traços numa segunda cor (12)"]
    li = lambda xs: "".join(f"<li>{x}</li>" for x in xs)
    return f"""<section class="page white" style="display:grid;grid-template-columns:300px 1fr;gap:34px;align-items:center">
<div style="display:grid;place-items:center;gap:12px">{img(L("v01-final-preto"), 260, style="border-radius:28px")}
<div style="font:800 13px Gabarito">01 · Final v3 — a referência</div></div>
<div><div class="kicker">{n:02d} · Ponto de partida</div><h2>O que <em>fica</em> e o que <em>muda</em></h2>
<p class="lead">As rodadas 1 a 12 fecharam o DNA da marca. Essas variações não recomeçam do zero: elas testam o que ainda
dá para ajustar sem perder o que já foi aprovado.</p>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px">
<div class="box" style="background:{CREAM}"><h4>Fica em todas</h4><ul>{li(fixed)}</ul></div>
<div class="box" style="background:{CREAM}"><h4>Muda em cada uma</h4><ul>{li(varies)}</ul></div></div></div>{foot(n)}</section>"""


def card(i, slug, name, idea):
    on = " on" if slug in A.MAIN else ""
    row = "".join(img(L(f"{slug}-{fs}"), 34) for fs in ("rosa", "roxo", "cream"))
    row += img(L(f"{slug}-preto"), 24) + img(L(f"{slug}-preto"), 16)
    return (f'<div class="vc{on}"><div class="hero">{img(L(f"{slug}-preto"), 132)}</div>'
            f'<div><div class="num">{i:02d}{" · FAVORITA" if on else ""}</div><b>{name}</b><p>{idea}</p>'
            f'<div class="row">{row}</div></div></div>')


def p_variants(n, part):
    vs = A.VARIANTS[part * 6:(part + 1) * 6]
    cells = "".join(card(part * 6 + k + 1, s, nm, idea) for k, (s, nm, idea, _f) in enumerate(vs))
    title = ("Ritmo e posição <em>do tracejado</em>", "Forma, estrela <em>e cor</em>")[part]
    lead = ("Mesma estrela, mesma espessura. Muda quantos traços, o tamanho de cada um e onde fica a abertura.",
            "Aqui a variação sai do anel: disco, squircle, estrela em linha, faísca, raios e a segunda cor.")[part]
    return f"""<section class="page">
<div class="kicker">{n:02d} · Variações {part * 6 + 1:02d}–{part * 6 + 6:02d}</div><h2>{title}</h2>
<p class="lead">{lead} Cada uma aparece no preto (principal), no rosa, no roxo e no cream, e em 24 e 16 px.</p>
<div class="vg">{cells}</div>{foot(n)}</section>"""


def p_lockups(n, fundo, part):
    vs = A.VARIANTS[part * 6:(part + 1) * 6] if part is not None else A.VARIANTS
    cells = "".join(f'<div>{img(L(f"{s}-lockup-{fundo}"))}{i + 1 + (part or 0) * 6:02d} · {nm}</div>'
                    for i, (s, nm, _i, _f) in enumerate(vs))
    cls = "white" if fundo == "branco" else ""
    return f"""<section class="page {cls}">
<div class="kicker">{n:02d} · Com a palavra · {"preto" if fundo == "preto" else "claro"}</div>
<h2>Lockup horizontal, <em>símbolo ao lado</em></h2>
<p class="lead">O símbolo fica 1,4× a altura do l e separado da palavra, como no logo final. No preto: arco rosa,
estrela e palavra brancas. No claro: símbolo Pink Deep e palavra ink.</p>
<div class="lk">{cells}</div>{foot(n)}</section>"""


def p_apps(n):
    cells = ""
    for s, nm, _i, _f in A.VARIANTS:
        cells += f'<div>{img(L(f"{s}-app-rosa"), 120)}<span>{nm}</span></div>'
    return f"""<section class="page white">
<div class="kicker">{n:02d} · Ícone de app</div><h2>Tile rosa, <em>símbolo branco</em></h2>
<p class="lead">Símbolo a 62% do quadrado, dentro da área segura. Também saem em preto (anel rosa + estrela branca) e
roxo nos arquivos <code>-app-preto</code> e <code>-app-roxo</code>.</p>
<div class="ap">{cells}</div>{foot(n)}</section>"""


def p_small(n):
    rows = '<div class="h n">Variação</div><div class="h">32 px</div><div class="h">24 px</div><div class="h">16 px</div><div class="h">16 px · preto</div>'
    for i, (s, nm, _i, _f) in enumerate(A.VARIANTS):
        rows += (f'<div class="n">{i + 1:02d} · {nm}</div><div>{img(L(s), 32)}</div><div>{img(L(s), 24)}</div>'
                 f'<div>{img(L(s), 16)}</div><div class="dk">{img(L(f"{s}-preto"), 18)}</div>')
    return f"""<section class="page white">
<div class="kicker">{n:02d} · Pequeno</div><h2>Quem <em>aguenta</em> 16 px</h2>
<p class="lead">O teste do favicon e do avatar pequeno. Com traços curtos o vão fecha e o tracejado vira borrão:
dois traços, um traço, disco e squircle seguram melhor; quatro traços, raios e estrela em linha pedem um corte próprio.</p>
<div class="sm">{rows}</div>{foot(n)}</section>"""


def p_reco(n):
    notes = {"v02-dois-tracos": "A evolução mais segura da final: mais calma e a melhor em 16 px.",
             "v07-disco": "A mais “marca de app”: vira botão, selo e avatar sem moldura.",
             "v08-squircle": "A mais diferente: conversa com ícone e destaque sem perder o C."}
    cards = "".join(f'<div style="max-width:180px">{img(L(f"{s}-preto"), 150, style="border-radius:22px;margin:0 auto 8px")}'
                    f'{A.V[s][1]}<p style="font:500 10px/1.4 Figtree;color:rgba(255,255,255,.7);margin-top:4px">{notes[s]}</p></div>'
                    for s in A.MAIN)
    return f"""<section class="page ink">
<div class="kicker">{n:02d} · Para escolher</div><h2 style="font-size:40px">Três <em>caminhos</em> para levar adiante</h2>
<p class="lead" style="margin-top:8px">A final v3 continua a base. Se quiser evoluir, estas são as três que mais
acrescentam sem quebrar a marca. Também vale combinar: dois traços + squircle no ícone de app, por exemplo.</p>
<div class="pk" style="margin-top:26px">{cards}</div>{foot(n)}</section>"""


def build():
    pages = [p_cover(), p_base(2), p_variants(3, 0), p_variants(4, 1), p_lockups(5, "preto", None),
             p_lockups(6, "branco", None), p_apps(7), p_small(8), p_reco(9)]
    pages += U.pages(len(pages) + 1)   # v2: seção de utilizações do 07, 04 e 06
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy — Variações do logo</title>'
            f'<style>{PB.css()}{EXTRA}{U.CSS}</style></head><body>{"".join(pages)}</body></html>')
    OUT_HTML.write_text(html)
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer",
                    f"--print-to-pdf={OUT_PDF}", OUT_HTML.as_uri()], check=True, capture_output=True)
    print("pages", len(pages))


if __name__ == "__main__":
    build()

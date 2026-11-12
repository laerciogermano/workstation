#!/usr/bin/env python3
"""Clozzy — documento da rodada 15 (glifos sólidos no caminho do Tinder).
Rodar: python3 _glifos.py && python3 _build.py → HTML + PDF"""
import base64, importlib.util, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import _glifos as A  # noqa: E402

_spec = importlib.util.spec_from_file_location("rodada4_build", HERE.parent / "logo-possibilidades" / "_build.py")
PB = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(PB)   # CSS e helpers do documento da rodada 4

CHROME = PB.CHROME
OUT_HTML = HERE / "glifos-logo-clozzy.html"
OUT_PDF = HERE / "glifos-logo-clozzy.pdf"
PINK, DEEP, PURPLE, INK, CREAM, WHITE = A.PINK, A.DEEP, A.PURPLE, A.INK, A.CREAM, A.WHITE
img = PB.img


def L(name):
    return "data:image/svg+xml;base64," + base64.b64encode((HERE / "svg" / f"{name}.svg").read_bytes()).decode()


def foot(n):
    return f'<div class="foot"><span>Clozzy · glifos · rodada 15 · nov 2026</span><span>{n:02d}</span></div>'


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
    trio = "".join(img(L(f"{s}-app-rosa"), 150) for s in A.MAIN)
    return f"""<section class="page ink" style="display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:30px">
<div><div class="kicker">Clozzy 2028 · Logo · rodada 15 · experimentos</div>
<h1>Uma forma<br>só, cheia<br>de <em>close.</em></h1>
<p class="lead" style="margin-top:18px;max-width:470px">Experimentos no caminho do Tinder: um <b>glifo sólido</b>,
sem contorno, com curvas e ponta viva, que se reconhece de longe e vive sozinho no ícone. Treze ideias a partir do
que a Clozzy é: estrela de close friends, story, câmera, vídeo e conteúdo exclusivo.</p></div>
<div style="display:flex;gap:16px;justify-content:center">{trio}</div>{foot(1)}</section>"""


def p_base(n):
    take = ["Uma forma cheia, sem anel nem contorno", "Curvas fluidas e cantos macios, com uma ponta viva",
            "Reconhecível em 16 px e de longe", "Ícone = glifo branco num tile de cor chapada",
            "O símbolo carrega a marca sozinho; a palavra é apoio"]
    leave = ["A chama e qualquer forma que lembre o símbolo deles", "O degradê: aqui tudo chapado, como na identidade v2",
             "As cores deles: só rosa, Deep, roxo, ink, cream e branco"]
    themes = ["Estrela de close friends (01, 02, 11)", "Câmera e lente (03, 04, 05)", "Vídeo e story (06, 07)",
              "Conversa íntima (08, 12)", "Conteúdo exclusivo (09, 10, 13)"]
    li = lambda xs: "".join(f"<li>{x}</li>" for x in xs)
    return f"""<section class="page white">
<div class="kicker">{n:02d} · O caminho</div><h2>O que pegar do Tinder <em>e o que não</em></h2>
<p class="lead">O Tinder funciona porque é uma forma só, cheia e com movimento: dá para desenhar de memória. Aqui a
forma vem do universo da Clozzy, e o resto das regras da marca continua igual.</p>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:16px">
<div class="box" style="background:{CREAM}"><h4>Pegamos</h4><ul>{li(take)}</ul></div>
<div class="box" style="background:{CREAM}"><h4>Deixamos de fora</h4><ul>{li(leave)}</ul></div>
<div class="box" style="background:{CREAM}"><h4>Os cinco temas</h4><ul>{li(themes)}</ul></div></div>
<p class="lead" style="margin-top:16px;font-size:12px">Cor: no preto o glifo é rosa e os recortes ficam <b>brancos</b>
(vazar mostraria preto dentro do rosa). No rosa e no roxo tudo branco, e os recortes vazam a cor do fundo. No claro, Pink Deep.</p>{foot(n)}</section>"""


def card(i, slug, name, idea):
    on = " on" if slug in A.MAIN else ""
    row = "".join(img(L(f"{slug}-{fs}"), 34) for fs in ("rosa", "roxo", "branco"))
    row += img(L(f"{slug}-preto"), 24) + img(L(f"{slug}-preto"), 16)
    return (f'<div class="vc{on}"><div class="hero">{img(L(f"{slug}-app-rosa"), 132)}</div>'
            f'<div><div class="num">{i:02d}{" · FAVORITA" if on else ""}</div><b>{name}</b><p>{idea}</p>'
            f'<div class="row">{row}</div></div></div>')


PARTS = [(0, 6, "Estrela e <em>câmera</em>", "Começa pela estrela pura, como o Tinder começa pela chama, e vai para a lente."),
         (6, 13, "Vídeo, conversa <em>e exclusivo</em>", "Play, story, DM e as formas de “só para quem está no close”.")]


def p_variants(n, part):
    a, b, title, lead = PARTS[part]
    cells = "".join(card(a + k + 1, s, nm, idea) for k, (s, nm, idea, _f) in enumerate(A.GLIFOS[a:b]))
    return f"""<section class="page">
<div class="kicker">{n:02d} · Glifos {a + 1:02d}–{b:02d}</div><h2>{title}</h2>
<p class="lead">{lead} Cada um no tile rosa (ícone), em rosa, roxo e branco, e em 24 e 16 px no preto.</p>
<div class="vg">{cells}</div>{foot(n)}</section>"""


def p_tiles(n, fundo, titulo):
    cells = "".join(f'<div>{img(L(f"{s}-app-{fundo}"), 120)}<span>{i + 1:02d} · {nm}</span></div>'
                    for i, (s, nm, _i, _f) in enumerate(A.GLIFOS))
    return f"""<section class="page white">
<div class="kicker">{n:02d} · Ícone de app</div><h2>{titulo}</h2>
<p class="lead">Glifo a 60% do quadrado, dentro da área segura. É aqui que um logo no caminho do Tinder ganha ou perde:
na tela inicial, entre outros ícones.</p>
<div class="ap">{cells}</div>{foot(n)}</section>"""


def p_lockups(n, fundo):
    cells = "".join(f'<div>{img(L(f"{s}-lockup-{fundo}"))}{i + 1:02d} · {nm}</div>'
                    for i, (s, nm, _i, _f) in enumerate(A.GLIFOS))
    cls = "white" if fundo == "branco" else ""
    return f"""<section class="page {cls}">
<div class="kicker">{n:02d} · Com a palavra · {"preto" if fundo == "preto" else "claro"}</div>
<h2>Glifo <em>ao lado</em> do clozzy</h2>
<p class="lead">Mesma régua do logo final: Gabarito 800, símbolo separado da palavra, nunca fundido com o c.</p>
<div class="lk" style="grid-template-columns:repeat(4,1fr)">{cells}</div>{foot(n)}</section>"""


def p_small(n):
    rows = '<div class="h n">Glifo</div><div class="h">32 px</div><div class="h">24 px</div><div class="h">16 px</div><div class="h">16 px · preto</div>'
    for i, (s, nm, _i, _f) in enumerate(A.GLIFOS):
        rows += (f'<div class="n">{i + 1:02d} · {nm}</div><div>{img(L(s), 32)}</div><div>{img(L(s), 24)}</div>'
                 f'<div>{img(L(s), 16)}</div><div class="dk">{img(L(f"{s}-preto"), 18)}</div>')
    return f"""<section class="page white">
<div class="kicker">{n:02d} · Pequeno</div><h2>Quem <em>aguenta</em> 16 px</h2>
<p class="lead">Forma cheia é a grande vantagem desse caminho: quase todos seguram o favicon. Os que têm detalhe
fino (diafragma, cadeado, card de story) perdem o desenho de dentro e precisam de um corte simplificado.</p>
<div class="sm" style="grid-template-rows:none">{rows}</div>{foot(n)}</section>"""


def p_reco(n):
    notes = {"g01-estrela-macia": "A mais Tinder: uma forma só, levemente inclinada, que dá para desenhar de memória. Dona da estrela.",
             "g04-diafragma": "A mais Clozzy: câmera e close friends numa peça só, e com movimento de giro.",
             "g06-play": "A mais direta sobre vídeo e conteúdo; a estrela dentro diz “exclusivo”."}
    cards = "".join(f'<div style="max-width:190px">{img(L(f"{s}-app-rosa"), 150, style="margin:0 auto 8px")}'
                    f'{A.G[s][1]}<p style="font:500 10px/1.4 Figtree;color:rgba(255,255,255,.7);margin-top:4px">{notes[s]}</p></div>'
                    for s in A.MAIN)
    return f"""<section class="page ink">
<div class="kicker">{n:02d} · Para escolher</div><h2 style="font-size:40px">Três <em>caminhos</em> para levar adiante</h2>
<p class="lead" style="margin-top:8px">Também vale misturar: a estrela macia como símbolo e o diafragma como
botão de câmera dentro do app, por exemplo. Me diga qual seguir e eu refino só ele.</p>
<div class="pk" style="margin-top:26px">{cards}</div>{foot(n)}</section>"""


def build():
    pages = [p_cover(), p_base(2), p_variants(3, 0), p_variants(4, 1), p_tiles(5, "rosa", "Tile rosa, <em>glifo branco</em>"),
             p_tiles(6, "preto", "Tile preto, <em>glifo rosa</em>"), p_lockups(7, "preto"), p_lockups(8, "branco"),
             p_small(9), p_reco(10)]
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy — Glifos (rodada 15)</title>'
            f'<style>{PB.css()}{EXTRA}</style></head><body>{"".join(pages)}</body></html>')
    OUT_HTML.write_text(html)
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer",
                    f"--print-to-pdf={OUT_PDF}", OUT_HTML.as_uri()], check=True, capture_output=True)
    print("pages", len(pages))


if __name__ == "__main__":
    build()

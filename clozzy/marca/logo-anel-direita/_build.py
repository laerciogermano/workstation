#!/usr/bin/env python3
"""Clozzy — documento da rodada 12 (anel com os traços à direita).
Rodar: python3 _anel.py && python3 _build.py → HTML + PDF"""
import base64, importlib.util, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import _anel as A  # noqa: E402

_spec = importlib.util.spec_from_file_location("rodada4_build", HERE.parent / "logo-possibilidades" / "_build.py")
PB = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(PB)   # CSS e helpers do documento da rodada 4

CHROME = PB.CHROME
OUT_HTML = HERE / "anel-direita-clozzy.html"
OUT_PDF = HERE / "anel-direita-clozzy.pdf"
REFS = HERE.parent / "refs"
PINK, DEEP, PURPLE, INK, CREAM, WHITE = A.PINK, A.DEEP, A.PURPLE, A.INK, A.CREAM, A.WHITE
img = PB.img
MAIN = A.MAIN
N = len(A.VARIANTS)


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(Path(p).read_bytes()).decode()


def sv(s):
    return "data:image/svg+xml;base64," + base64.b64encode(s.encode()).decode()


def L(name):
    return b64(HERE / "svg" / f"{name}.svg", "image/svg+xml")


def ref(stamp):
    return b64(sorted(REFS.glob(f"*{stamp}*.png"))[0], "image/png")


def foot(n):
    return f'<div class="foot"><span>Clozzy · anel com os traços à direita · rodada 12 · nov 2026</span><span>{n:02d}</span></div>'


EXTRA = f"""
.ex{{display:grid;grid-template-columns:repeat(4,1fr);gap:16px 18px;margin-top:14px}}
.ex .c{{background:{WHITE};border:1px solid rgba(20,9,15,.09);border-radius:14px;padding:12px 12px 11px;text-align:center}}
.ex .c.on{{border-color:{PINK};box-shadow:0 0 0 2px rgba(255,0,101,.14)}}
.ex img{{margin:0 auto}}
.ex b{{display:block;font:800 12.5px Gabarito;margin-top:8px}}
.ex p{{font-size:9.5px;line-height:1.35;color:rgba(20,9,15,.6);margin-top:3px}}
.ex .sm{{display:flex;gap:7px;justify-content:center;align-items:center;margin-top:7px}}
.tiles{{display:grid;grid-template-columns:repeat(4,1fr);gap:14px 18px;margin-top:14px;text-align:center}}
.tiles div span{{display:block;font:700 10px Figtree;margin-top:6px;color:rgba(20,9,15,.6)}}
.srcs{{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:16px}}
.srcs .b{{background:{WHITE};border:1px solid rgba(20,9,15,.09);border-radius:14px;padding:14px;display:flex;
flex-direction:column;align-items:center;gap:10px}}
.srcs img{{max-height:180px;object-fit:contain}}
.srcs b{{font:800 12.5px Gabarito}} .srcs p{{font-size:10px;line-height:1.4;color:rgba(20,9,15,.62);text-align:center}}
.uses{{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:14px}}
.uses div{{border-radius:14px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:9px;font:700 10px Figtree}}
.pair{{display:flex;gap:26px;align-items:center;margin-top:16px}}
"""


def p_cover():
    return f"""<section class="page ink" style="display:grid;grid-template-columns:1.05fr 1fr;align-items:center;gap:30px">
<div><div class="kicker">Clozzy 2028 · Logo · rodada 12</div>
<h1>A linha<br>à esquerda.<br>Os traços<br><em>à direita.</em></h1>
<p class="lead" style="margin-top:18px;max-width:470px">O desenho do print de traço 8: a linha cheia abraça a esquerda e o anel se solta em
traços descendo pela direita, com a estrela original no meio. Oito exemplos da mesma ideia — e o tile de app, que estava
com os traços à esquerda, agora <b>espelhado para a direita</b>.</p></div>
<div style="display:grid;place-items:center">{img(L(MAIN + "-rosa-estrela-branca"), 330)}</div>{foot(1)}</section>"""


def p_sources(n):
    cards = [
        (ref("14.03.10"), "Print · traço 8", "O desenho pedido: anel fino, quatro traços de tamanhos diferentes à direita e a estrela grande."),
        (ref("14.31.06"), "Tile · traços à esquerda", "A versão de app que existia. <b>É a que foi espelhada:</b> os traços passam para a direita."),
        (L(MAIN + "-app-rosa"), "Tile · invertido", "Mesmo tile com a linha cheia na esquerda e os traços na direita, como no anel do story."),
    ]
    body = "".join(f'<div class="b"><img src="{s}" style="max-width:100%"><b>{t}</b><p>{d}</p></div>' for s, t, d in cards)
    return f"""<section class="page white">
<div class="kicker">{n:02d} · De onde vem</div><h2>Dois prints e uma <em>inversão</em></h2>
<p class="lead">O símbolo vem do print de traço 8 da rodada 5. O tile vem do print 14.31.06 — lá o tracejado ficava
à esquerda, e a leitura brigava com o sentido de giro do story. Antes → depois: traços à esquerda → traços à direita.</p>
<div class="srcs">{body}</div>{foot(n)}</section>"""


def p_examples(n):
    cells = ""
    for slug, name, idea, _fn in A.VARIANTS:
        on = " on" if slug == MAIN else ""
        cells += (f'<div class="c{on}">{img(L(slug + "-deep"), 150)}'
                  f'<div class="sm">{img(L(slug + "-deep"), 30)}{img(L(slug + "-16"), 18)}</div>'
                  f'<b>{name}</b><p>{idea}</p></div>')
    return f"""<section class="page">
<div class="kicker">{n:02d} · Exemplos</div><h2>Oito jeitos de <em>soltar o anel</em></h2>
<p class="lead">Todos com a estrela original, Pink Deep e o mesmo diâmetro externo (45 no grid de 100). O que muda é
quantos traços, o tamanho de cada um e a espessura. Ao lado de cada exemplo, o mesmo desenho em 30 px e no corte de 16 px.</p>
<div class="ex">{cells}</div>{foot(n)}</section>"""


def p_tiles(n):
    cells = "".join(f'<div>{img(L(s + "-app-rosa"), 150)}<span>{nm}</span></div>' for s, nm, _i, _f in A.VARIANTS)
    return f"""<section class="page white">
<div class="kicker">{n:02d} · Tile invertido</div><h2>Ícone de app, traços <em>à direita</em></h2>
<p class="lead">Tile rosa com o símbolo branco, símbolo a 66% do quadrado e canto de 22,6 — o mesmo gabarito das rodadas
anteriores. Com os traços à direita, a linha cheia entra pelo lado em que o olho começa a ler.</p>
<div class="tiles">{cells}</div>{foot(n)}</section>"""


def p_color(n):
    uses = [("Pink Deep no branco", WHITE, MAIN + "-deep", INK),
            ("Rosa + estrela branca no preto", INK, MAIN + "-rosa-estrela-branca", WHITE),
            ("Branco no rosa", PINK, MAIN + "-branco", WHITE),
            ("Branco no roxo", PURPLE, MAIN + "-branco", WHITE)]
    cells = "".join(f'<div style="background:{bg};color:{tc};'
                    f'{"border:1px solid rgba(20,9,15,.1);" if bg == WHITE else ""}">{img(L(s), 104)}{t}</div>'
                    for t, bg, s, tc in uses)
    small = "".join(f'<div style="text-align:center">{img(L(s + "-16"), 22)}'
                    f'<div style="font-size:9px;margin-top:5px;color:rgba(20,9,15,.55)">{nm}</div></div>'
                    for s, nm, _i, _f in A.VARIANTS)
    return f"""<section class="page">
<div class="kicker">{n:02d} · Cor e tamanho</div><h2>No preto, anel rosa e <em>estrela branca</em></h2>
<p class="lead">As regras de cor valem como nas rodadas anteriores: nada de preto sobre o rosa, rosa e roxo nunca um
sobre o outro, sobre preto o anel é rosa com a estrela branca, e sobre rosa ou roxo o símbolo é todo branco.</p>
<div class="uses">{cells}</div>
<p class="lead" style="margin-top:18px">No corte de 16–20 px entra um arquivo próprio, com menos traços e o anel mais
grosso — senão o vão fecha e o tracejado some.</p>
<div style="display:flex;gap:22px;margin-top:10px;align-items:flex-end">{small}</div>{foot(n)}</section>"""


def p_next(n):
    picks = ["a-print", "b-tres", "g-grosso"]
    cards = "".join(f'<div style="text-align:center">{img(L(s + "-rosa-estrela-branca"), 122)}'
                    f'<div style="font:800 12px Gabarito;margin-top:6px">{A.V[s][1]}</div></div>' for s in picks)
    return f"""<section class="page ink" style="display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:30px">
<div><div class="kicker">{n:02d} · Decisão</div><h2 style="font-size:40px">Recomendo o <em>como no print</em></h2>
<p class="lead" style="margin-top:10px">Traço 8, quatro traços desiguais à direita e a linha cheia fechando a esquerda —
é o que você apontou e o que melhor separa a estrela do anel.</p>
<ul class="lead" style="margin:14px 0 0 18px">
<li>Mais limpa de longe: <b>três traços</b>. Mais segura no pequeno: <b>traço 10</b>.</li>
<li>O tile de app já sai invertido para a direita em rosa, preto, roxo e branco.</li>
<li>Para fechar: quantos traços e a espessura; a cor segue a regra das rodadas anteriores.</li></ul></div>
<div style="display:flex;gap:18px;justify-content:center">{cards}</div>{foot(n)}</section>"""


def build():
    pages = [p_cover(), p_sources(2), p_examples(3), p_tiles(4), p_color(5), p_next(6)]
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy — Anel com os traços à direita</title>'
            f'<style>{PB.css()}{EXTRA}</style></head><body>{"".join(pages)}</body></html>')
    OUT_HTML.write_text(html)
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer",
                    f"--print-to-pdf={OUT_PDF}", OUT_HTML.as_uri()], check=True, capture_output=True)
    print("pages", len(pages))


if __name__ == "__main__":
    build()

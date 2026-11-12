#!/usr/bin/env python3
"""Clozzy — documento “Story espelhado” (rodada 5b: print 13.43 espelhado + estrela original). Rodar: python3 _circulo.py && python3 _build.py"""
import base64, importlib.util, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parent / "logo-possibilidades"))
import _circulo as C  # noqa: E402
import _marcas as M  # noqa: E402

_spec = importlib.util.spec_from_file_location("rodada4_build", HERE.parent / "logo-possibilidades" / "_build.py")
PB = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(PB)  # CSS e helpers do documento da rodada 4 (não roda o build)

CHROME = PB.CHROME
OUT_HTML = HERE / "story-espelhado-clozzy.html"
OUT_PDF = HERE / "story-espelhado-clozzy.pdf"
REFS = HERE.parent / "refs"
REF5 = sorted(REFS.glob("*13.25.20*.png"))[0]
REF7 = sorted(REFS.glob("*13.43.37*.png"))[0]
PHD = HERE.parent / "referencias-apps" / "modelos" / "img"
PINK, DEEP, PURPLE, INK, CREAM, WHITE = C.PINK, C.DEEP, C.PURPLE, C.INK, C.CREAM, C.WHITE
MAIN = "e-espelhado"
img = PB.img


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(Path(p).read_bytes()).decode()


def sv(s):
    return "data:image/svg+xml;base64," + base64.b64encode(s.encode()).decode()


def L(name):
    return b64(HERE / "svg" / f"{name}.svg", "image/svg+xml")


def foot(n):
    return f'<div class="foot"><span>Clozzy · Círculo próximo tracejado · rodada 5 · nov 2026</span><span>{n:02d}</span></div>'


EXTRA = f"""
h1 em,h2 em{{color:{DEEP}}} .ink h1 em,.ink h2 em{{color:{PINK}}}
.vars{{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:8px}}
.vr{{background:#fff;border-radius:20px;padding:10px 14px;display:flex;flex-direction:column;align-items:center;text-align:center}}
.vr h3{{font-size:16px;font-weight:800;margin-top:4px}} .vr p{{font-size:10.5px;line-height:1.4;color:rgba(20,9,15,.7);margin-top:4px}}
.vr .row{{display:flex;gap:8px;align-items:center;margin-top:6px}}
.vr.on{{outline:3px solid {DEEP}}}
.vr .lbl{{font:800 10px Figtree;letter-spacing:.12em;color:{DEEP}}}
.cmp{{display:grid;grid-template-columns:1fr 1fr 40px 1.2fr;align-items:center;gap:12px;margin-top:6px}}
.cmp .box{{display:flex;flex-direction:column;align-items:center;justify-content:center;height:400px}}
.apps{{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:12px}}
.apps .box{{display:flex;align-items:center;justify-content:center;gap:12px;min-height:148px}}
.thick .on b{{color:{DEEP}}}
"""


def p_cover():
    return f"""<section class="page ink" style="display:grid;grid-template-columns:1.1fr 1fr;align-items:center;gap:30px">
<div><div class="kicker">Clozzy 2028 · Logo · Rodada 5</div>
<h1>Círculo próximo,<br><em>tracejado.</em></h1>
<p class="lead" style="margin-top:18px;max-width:470px">O anel do print 13.43 <b>espelhado para a direita</b>: arco cheio à esquerda e traços subindo pela direita. Dentro, a <b>estrela original</b> do Círculo próximo (print 5). Traço fino, <b>Pink Deep</b> e a estrela em ink ou na mesma cor.</p></div>
<div style="display:grid;grid-template-columns:1fr 1fr;place-items:center;gap:10px">{img(L(MAIN + "-dark"), 240)}{img(L(MAIN + "-dark-pink"), 240)}</div>{foot(1)}</section>"""


def p_compare(n):
    return f"""<section class="page">
<div class="kicker">02 · Dos prints para o novo</div><h2>Estrela do print 5 + <em>anel do print 13.43, espelhado</em></h2>
<div class="cmp">
<div class="box"><img src="{b64(REF5, "image/png")}" style="height:320px;border-radius:12px"><b class="g" style="margin-top:10px">Print 5 · Círculo próximo</b></div>
<div class="box"><img src="{b64(REF7, "image/png")}" style="width:200px;border-radius:12px"><b class="g" style="margin-top:10px">Print 13.43 · espelhar</b></div>
<div style="font:800 40px Gabarito;color:{DEEP};text-align:center">→</div>
<div class="box">{img(L(MAIN + "-color"), 290)}<b class="g" style="margin-top:24px">Espelhado · estrela original · Pink Deep</b></div>
</div>
<div class="cols" style="grid-template-columns:repeat(4,1fr);margin-top:14px">
<div class="box"><h4>Estrela: igual</h4><p>Mesmos R 20,5, miolo 0,48, canto 5 e centro (grid 100) do print 5.</p></div>
<div class="box"><h4>C: mais fino</h4><p>Traço de 16 para <b>10</b>, com o mesmo diâmetro externo. Sobra mais respiro em volta da estrela.</p></div>
<div class="box"><h4>Espelhado</h4><p>O arco cheio passa para a esquerda (de baixo até o topo) e os traços sobem pela direita até a abertura no alto, invertendo o print.</p></div>
<div class="box"><h4>Pink Deep</h4><p>#E0005A no lugar do #FF0065: mais denso, aguenta o traço fino e fica com o mesmo peso da estrela.</p></div>
</div>{foot(n)}</section>"""


def p_variants(n):
    cards = ""
    for k, (v, V) in enumerate(C.VARIANTS.items()):
        on = " on" if v == MAIN else ""
        cards += (f'<div class="vr{on}"><span class="lbl">{"EFABCD"[k]}{" · RECOMENDADA" if on else ""}</span>{img(L(v + "-color"), 96)}<h3>{V["name"]}</h3><p>{V["idea"]}</p>'
                  f'<div class="row"><span style="background:{INK};padding:6px;border-radius:10px">{img(L(v + "-dark"), 34)}</span>'
                  f'{img(L(v + "-ink-star"), 34)}{img(L(v + "-app-deep"), 40)}{img(L(v + "-app-cream"), 40)}'
                  f'{img(L(v + "-color"), 32)}{img(L(v + "-16"), 20)}{img(L(v + "-16"), 16)}'
                  f'<span style="background:{INK};padding:3px;border-radius:4px">{img(L(v + "-16-dark"), 16)}</span></div></div>')
    return f"""<section class="page">
<div class="kicker">03 · Variações</div><h2>Onde e como <em>tracejar</em></h2>
<p class="lead">Mesma estrela, traço 10 e Pink Deep em todas. E e F seguem o print 13.43 espelhado; A–D são as variações anteriores (o C quebrando perto da ponta). Em 16–20 px entra um arquivo próprio com traço 14.</p>
<div class="vars">{cards}</div>{foot(n)}</section>"""


def p_thickness(n):
    cells = ""
    for w, t in [(16, "original"), (12, ""), (10, "escolhido"), (8, "fino demais")]:
        b = C.body(MAIN, w=w)
        on = "on" if w == 10 else ""
        cells += (f'<div class="{on}">{img(sv(C.svg100(b)), 200)}<div style="display:flex;gap:8px;justify-content:center;align-items:center;margin-top:10px">'
                  f'{img(sv(C.svg100(b)), 32)}{img(sv(C.svg100(b)), 20)}</div><b>traço {w}</b>{t}</div>')
    return f"""<section class="page white">
<div class="kicker">04 · Espessura</div><h2>Mais fino: <em>10</em></h2>
<p class="lead">A variação E com quatro espessuras. Com 16, os traços curtos viram bolinhas; com 8, a estrela pesa demais e o C some em 20 px. Com 10, o tracejado lê como story e o C ainda segura a estrela.</p>
<div class="thick">{cells}</div>{foot(n)}</section>"""


def p_construction(n):
    rm = C.OUTER - C.W_MAIN / 2
    g = (f'<circle cx="50" cy="50" r="{rm}" fill="none" stroke="rgba(20,9,15,.25)" stroke-width=".3" stroke-dasharray="1 1"/>'
         f'<circle cx="50" cy="50" r="{C.LG.STAR_R}" fill="none" stroke="rgba(20,9,15,.25)" stroke-width=".3" stroke-dasharray="1 1"/>'
         f'<line x1="0" y1="50" x2="100" y2="50" stroke="rgba(20,9,15,.2)" stroke-width=".3" stroke-dasharray="1 1"/>'
         f'<line x1="50" y1="0" x2="50" y2="100" stroke="rgba(20,9,15,.2)" stroke-width=".3" stroke-dasharray="1 1"/>')
    x, y = C.P(-95, 49)
    g += f'<line x1="50" y1="50" x2="{x:.1f}" y2="{y:.1f}" stroke="{PURPLE}" stroke-width=".4"/>'
    for a, b in C.VARIANTS[MAIN]["main"]:
        for ang in (a, b):
            x0, y0 = C.P(ang, C.OUTER - C.W_MAIN - 2)
            x1, y1 = C.P(ang, C.OUTER + 2)
            g += f'<line x1="{x0:.1f}" y1="{y0:.1f}" x2="{x1:.1f}" y2="{y1:.1f}" stroke="{PURPLE}" stroke-width=".25"/>'
    spans = " · ".join(f"{a:g}°–{b:g}°" for a, b in C.VARIANTS[MAIN]["main"])
    return f"""<section class="page white">
<div class="kicker">05 · Construção</div><h2>Grid 100, <em>a mesma do original</em></h2>
<div style="display:grid;grid-template-columns:420px 1fr;gap:36px;align-items:center;margin-top:6px">
{img(sv(C.svg100(C.body(MAIN) + g)), 420)}
<div class="cols" style="grid-template-columns:1fr 1fr">
<div class="box" style="background:{CREAM}"><h4>C</h4><p>Raio externo 45 (igual ao original), traço 10 e raio médio {rm:g}. Pontas redondas.</p></div>
<div class="box" style="background:{CREAM}"><h4>Abertura</h4><p>No alto, centrada em −95° (linha roxa), logo acima da ponta de cima da estrela: o story “abre” para cima.</p></div>
<div class="box" style="background:{CREAM}"><h4>Trechos visíveis</h4><p>{spans}. Arco cheio de 62° a 250° (esquerda) e 4 traços de 26° (o último, no topo, com 16°), com vãos de 16° e a abertura de 30° no alto.</p></div>
<div class="box" style="background:{CREAM}"><h4>Estrela</h4><p>Intocada: R {C.LG.STAR_R}, miolo {C.LG.STAR_RATIO}, canto {C.LG.STAR_ROUND}, centro 50/50.</p></div>
</div></div>{foot(n)}</section>"""


def p_color(n):
    def bx(name, bg, src, note):
        light = bg in (INK, PINK, DEEP, PURPLE)
        return (f'<div class="box" style="background:{bg};flex-direction:column">{img(src, 120)}'
                f'<span style="font-size:10.5px;{"color:#fff;" if light else ""}"><b>{name}</b> · {note}</span></div>')
    return f"""<section class="page">
<div class="kicker">06 · Cor</div><h2><em>Pink Deep</em> como principal, estrela ink como par</h2>
<div class="apps" style="grid-template-columns:repeat(5,1fr)">
{bx("Pink Deep", WHITE, L(MAIN + "-color"), "principal, uma cor só")}
{bx("Deep + estrela ink", WHITE, L(MAIN + "-ink-star"), "igual ao print 13.43")}
{bx("Clozzy + estrela ink", WHITE, L(MAIN + "-ink-star-pink"), "mesma dupla, rosa claro")}
{bx("Pink Clozzy", WHITE, L(MAIN + "-pink"), "alternativa mais clara")}
{bx("Deep + estrela roxa", WHITE, L(MAIN + "-roxo"), "liga com a v1")}
{bx("Sobre cream", CREAM, L(MAIN + "-ink-star"), "fundo padrão da marca")}
{bx("Uma cor", CREAM, L(MAIN + "-mono"), "carimbo, embalagem, nota fiscal")}
{bx("Sobre ink", INK, L(MAIN + "-dark"), "Deep no escuro (3,9:1)")}
{bx("Sobre ink", INK, L(MAIN + "-dark-pink"), "Pink Clozzy no escuro: mais brilho")}
{bx("Sobre Pink Deep", DEEP, L(MAIN + "-tile"), "tudo branco")}
<div class="box" style="background:{WHITE};flex-direction:column;gap:8px">{img(L(MAIN + "-lockup"), h=30)}{img(L(MAIN + "-lockup-ink-star"), h=30)}{img(L(MAIN + "-lockup-roxo"), h=30)}</div>
<div class="box" style="background:{WHITE};gap:10px">{img(L(MAIN + "-app-deep"), 66)}{img(L(MAIN + "-app-cream"), 66)}{img(L(MAIN + "-app-ink"), 66)}</div>
<div class="box" style="background:{WHITE};flex-direction:column;align-items:flex-start;text-align:left;grid-column:span 3">
<h4>Como escolher</h4><p><b>Estrela ink</b> (print 13.43) no claro quando o logo aparece grande e sozinho — o contraste separa o anel da estrela e o rosa fica mais vivo. <b>Uma cor só</b> (Deep ou branco) em ícone de app, favicon, 16–20 px, bordado e carimbo, onde a estrela ink viraria um buraco. No escuro, Pink Clozzy com a estrela da mesma cor.</p></div>
</div>
{foot(n)}</section>"""


def p_screen(n):
    ph = [b64(PHD / f"p{i}.jpg", "image/jpeg") for i in (2, 3, 5, 6)]
    avs = "".join(f'<div style="position:relative;width:70px;height:70px;display:grid;place-items:center">'
                  f'<svg viewBox="0 0 256 256" width="70" height="70" style="position:absolute;inset:0">{M.dashed(DEEP, 120, 12, 6, 14)}</svg>'
                  f'<img src="{ph[k]}" style="width:54px;height:54px;border-radius:50%;object-fit:cover"></div>' for k in range(4))
    apps = "".join('<span><i></i>app</span>' for _ in range(5))
    return f"""<section class="page">
<div class="kicker">07 · Aplicação</div><h2>Na <em>tela</em></h2>
<div style="display:grid;grid-template-columns:250px 1fr;gap:26px;margin-top:10px">
<div class="phone" style="height:420px"><div class="scr" style="background:#3a2a36"><img src="{ph[1]}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.55">
<div class="spring" style="position:relative">{apps}<span>{img(L(MAIN + "-app-deep"), 46)}Clozzy</span>{apps}{apps[:len(apps) // 5]}</div></div></div>
<div style="display:flex;flex-direction:column;gap:14px">
<div class="box" style="display:flex;justify-content:space-between;align-items:center">{img(L(MAIN + "-lockup"), h=34)}<span style="display:flex;gap:16px;font-size:12px;font-weight:700;align-items:center">Explorar <span>Entrar</span> <span style="background:{DEEP};color:#fff;padding:7px 14px;border-radius:99px">Sou criador</span></span></div>
<div class="box" style="background:{INK};display:flex;justify-content:space-between;align-items:center">{img(L(MAIN + "-lockup-dark"), h=34)}<span style="display:flex;gap:8px;align-items:center;background:rgba(255,255,255,.08);color:#fff;padding:6px 10px;border-radius:8px;font-size:11px">{img(L(MAIN + "-16-dark"), 16)}clozzy.com</span></div>
<div class="box" style="display:flex;gap:14px;align-items:center">{avs}<p style="margin-left:8px">O tracejado do logo conversa com o anel dos stories no app: o fim do C usa o mesmo traço.</p></div>
<div class="box" style="display:flex;gap:14px;align-items:center">{img(L(MAIN + "-app-deep"), 68)}{img(L(MAIN + "-app-cream"), 68)}{img(L(MAIN + "-app-ink"), 68)}{img(L(MAIN + "-color"), 44)}{img(L(MAIN + "-color"), 32)}{img(L(MAIN + "-16"), 20)}{img(L(MAIN + "-16"), 16)}
<p>Ícone Pink Deep (o tile do performer, print 1, mais escuro), ícone cream com a estrela ink e ícone ink. Em 16–20 px, o arquivo com menos traços e uma cor só.</p></div>
<div class="box" style="display:flex;gap:16px;align-items:center">
<div style="position:relative;width:76px;height:76px;display:grid;place-items:center">
<svg viewBox="0 0 100 100" width="76" height="76" style="position:absolute;inset:0">{C.body(MAIN, DEEP, DEEP).split("<polygon")[0]}</svg>
<img src="{ph[0]}" style="width:50px;height:50px;border-radius:50%;object-fit:cover"></div>
<div style="flex:1">
<div style="font:800 15px Gabarito">Lara Veloso</div>
<div style="font-size:11px;color:rgba(20,9,15,.6);margin-bottom:6px">4 novos drops · assinatura R$ 29,90</div>
<span style="background:{DEEP};color:#fff;padding:7px 16px;border-radius:99px;font:700 11px Figtree">Assinar</span>
<span style="margin-left:8px;background:#FFD9E7;padding:7px 12px;border-radius:99px;font:700 11px Figtree;display:inline-flex;gap:6px;align-items:center">{img(L(MAIN + "-16"), 14)}acesso liberado</span></div>
<p style="max-width:230px">Sem a estrela, o anel tracejado vira o contorno do avatar e do selo: o logo e a interface usam o mesmo traço.</p></div>
</div></div>{foot(n)}</section>"""


def p_next(n):
    return f"""<section class="page ink" style="display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:30px">
<div><div class="kicker">08 · Decisão</div><h2 style="font-size:40px">Recomendo a <em>E · story espelhado</em></h2>
<p class="lead" style="margin-top:10px">É o print 13.43 invertido para a direita, com a estrela original do Círculo próximo. O arco cheio à esquerda segura a forma, os traços à direita dizem “story”, e tudo em Pink Deep.</p>
<ul class="lead" style="margin:14px 0 0 18px"><li>Para escolher: E (traços iguais) ou F (variados); traço 10 ou 12; estrela ink (como o print) ou toda em Pink Deep.</li><li>Depois: refinamento óptico, kit completo e atualização do manual da identidade nova.</li></ul></div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;justify-items:center">{"".join(f'<div style="text-align:center">{img(L(v + "-dark"), 110)}<div style="font:800 13px Gabarito;margin-top:6px">{"EFABCD"[k]} · {V["name"]}</div></div>' for k, (v, V) in enumerate(C.VARIANTS.items()))}</div>
{foot(n)}</section>"""


def build():
    pages = [p_cover(), p_compare(2), p_variants(3), p_thickness(4), p_construction(5), p_color(6), p_screen(7), p_next(8)]
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy — Círculo próximo tracejado</title>'
            f'<style>{PB.css()}{EXTRA}</style></head><body>{"".join(pages)}</body></html>')
    OUT_HTML.write_text(html)
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer", f"--print-to-pdf={OUT_PDF}", OUT_HTML.as_uri()],
                   check=True, capture_output=True)
    return len(pages)


if __name__ == "__main__":
    print("pages", build())

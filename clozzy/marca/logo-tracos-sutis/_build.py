#!/usr/bin/env python3
"""Clozzy — documento “Traços sutis · variações” (rodada 8). Rodar: python3 _sutis.py && python3 _build.py
Saída com nome próprio (não sobrescreve as rodadas anteriores): tracos-sutis-variacoes-clozzy.{html,pdf}"""
import base64, importlib.util, math, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import _sutis as G  # noqa: E402

sys.path.insert(0, str(HERE.parent / "logo-possibilidades"))
_spec = importlib.util.spec_from_file_location("rodada4_build_css", HERE.parent / "logo-possibilidades" / "_build.py")
PB = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(PB)

CHROME = PB.CHROME
OUT_HTML = HERE / "tracos-sutis-variacoes-clozzy.html"
OUT_PDF = HERE / "tracos-sutis-variacoes-clozzy.pdf"
R5 = HERE.parent / "logo-circulo-tracejado" / "svg"
REF5 = sorted((HERE.parent / "refs").glob("*13.25.20*.png"))[0]
PHD = HERE.parent / "referencias-apps" / "modelos" / "img"
PINK, DEEP, PURPLE, INK, CREAM, WHITE = G.PINK, G.DEEP, G.PURPLE, G.INK, G.CREAM, G.WHITE
MAIN = "s1-vao-5"
R6 = HERE.parent / "logo-gradativo" / "svg"
R7 = HERE.parent / "logo-c-tracos" / "svg"
C = {c[0]: c for c in G.CONCEPTS}
img = PB.img


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(Path(p).read_bytes()).decode()


def sv(s):
    return "data:image/svg+xml;base64," + base64.b64encode(s.encode()).decode()


def L(name):
    return b64(HERE / "svg" / f"{name}.svg", "image/svg+xml")


def R(name):
    p = R5 / f"{name}.svg"
    return b64(p, "image/svg+xml") if p.exists() else ""


def foot(n):
    return f'<div class="foot"><span>Clozzy · Traços sutis · rodada 8 · nov 2026</span><span>{n:02d}</span></div>'


EXTRA = f"""
h1 em,h2 em{{color:{DEEP}}} .ink h1 em,.ink h2 em{{color:{PINK}}}
.vars{{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:8px}}
.vr{{background:#fff;border-radius:20px;padding:12px 14px;display:flex;flex-direction:column;align-items:center;text-align:center}}
.vr h3{{font-size:16px;font-weight:800;margin-top:4px}} .vr p{{font-size:10px;line-height:1.38;color:rgba(20,9,15,.7);margin-top:3px}}
.vr .row{{display:flex;gap:8px;align-items:center;margin-top:7px}} .vr.on{{outline:3px solid {DEEP}}}
.vr .lbl{{font:800 10px Figtree;letter-spacing:.12em;color:{DEEP}}}
.uses{{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:10px}}
.use{{border-radius:16px;height:122px;display:flex;align-items:center;gap:12px;padding:10px 14px}}
.use span{{font-size:10px;line-height:1.3}} .use b{{display:block;font:800 12px Gabarito}}
.lk{{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px}}
.lk div{{border-radius:18px;height:118px;display:grid;place-items:center}}
.frames{{display:flex;gap:14px;align-items:center;margin-top:8px}}
.frames div{{text-align:center;font-size:10px}}
.thick .on b{{color:{DEEP}}}
"""


def use_tile(slug, u, name, bg, small_note=""):
    light = bg in (INK, PINK, PURPLE)
    return (f'<div class="use" style="background:{bg};{"border:1px solid rgba(20,9,15,.08);" if bg == WHITE else ""}">'
            f'{img(L(f"{slug}-uso-{u}"), 92)}<span style="{"color:#fff;" if light else ""}"><b>{name}</b>{small_note}'
            f'<span style="display:flex;gap:6px;margin-top:6px;align-items:center">{img(L(f"{slug}-uso-{u}"), 24)}{img(L(f"{slug}-uso-{u}-16"), 16)}</span></span></div>')


# ------------------------------------------------------------------ páginas
def p_cover():
    return f"""<section class="page ink" style="display:grid;grid-template-columns:1.1fr 1fr;align-items:center;gap:30px">
<div><div class="kicker">Clozzy 2028 · Logo · Rodada 8</div>
<h1>Traços sutis,<br><em>com mais ar.</em></h1>
<p class="lead" style="margin-top:18px;max-width:470px">A partir do <b>2 · Traços sutis</b> da rodada 7 (ponto, traço, traço maior, C). Os <b>vãos entre os traços ficam maiores</b>: de 3 para 5–7. Oito variações e usos em <b>rosa, preto, branco e roxo</b>.</p></div>
<div style="display:grid;place-items:center">{img(L(MAIN + "-uso-rosa-no-preto"), 340)}</div>{foot(1)}</section>"""


def p_origin(n):
    cells = [(b64(REF5, "image/png"), "Print 5 · Círculo próximo", 250, "png"),
             (b64(R7 / "t2-sutil-color.svg", "image/svg+xml") if (R7 / "t2-sutil-color.svg").exists() else "", "7 · 2 Traços sutis (vão 3)", 170, "svg")]
    row = "".join(f'<div class="box" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:300px">'
                  f'<img src="{src}" style="{"height" if kind == "png" else "width"}:{size}px;border-radius:10px"><b class="g" style="margin-top:10px;font-size:13px">{t}</b></div>'
                  for src, t, size, kind in cells if src)
    return f"""<section class="page">
<div class="kicker">02 · De onde vem</div><h2>Do sutil, <em>com vãos maiores</em></h2>
<div style="display:grid;grid-template-columns:1fr 1fr 40px 1.2fr;gap:12px;align-items:center;margin-top:10px">{row}
<div style="font:800 40px Gabarito;color:{DEEP};text-align:center">→</div>
<div class="box" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:300px">{img(L(MAIN + "-color"), 220)}<b class="g" style="margin-top:12px;font-size:13px">8 · sutil, vão 5</b></div></div>
<div class="cols" style="grid-template-columns:repeat(4,1fr);margin-top:14px">
<div class="box"><h4>Forma de C</h4><p>Volta a abertura do Círculo próximo: 54°, centrada em −18°. Lê como C de clozzy antes de ler como story.</p></div>
<div class="box"><h4>Vãos maiores</h4><p>O espaço entre os traços sobe de 3 para 5 (≈ 7°). Cada elemento fica legível sozinho, e o ponto aparece mesmo em tamanho pequeno.</p></div>
<div class="box"><h4>· – ––</h4><p>Mesma espessura (10) em tudo. O que cresce é o comprimento: ponto, traço de 20°, traço de 30° e o C.</p></div>
<div class="box"><h4>Estrela original</h4><p>R 20,5, miolo 0,48, canto 5 e centro 50/50: a mesma do print 5.</p></div>
</div>{foot(n)}</section>"""


def p_anatomy(n):
    w = G.W_MAIN
    rm = G.OUTER - w / 2
    guide = (f'<circle cx="50" cy="50" r="{rm}" fill="none" stroke="rgba(20,9,15,.22)" stroke-width=".3" stroke-dasharray="1 1"/>'
             f'<line x1="0" y1="50" x2="100" y2="50" stroke="rgba(20,9,15,.18)" stroke-width=".3" stroke-dasharray="1 1"/>'
             f'<line x1="50" y1="0" x2="50" y2="100" stroke="rgba(20,9,15,.18)" stroke-width=".3" stroke-dasharray="1 1"/>')
    for ang in (-90, 180, 90):
        pass
    x, y = G.P(-18, 49)
    guide += f'<line x1="50" y1="50" x2="{x:.1f}" y2="{y:.1f}" stroke="{PURPLE}" stroke-width=".4"/>'
    # marca onde começa o trecho gradativo (a "metade" fica em 162°; o gradativo só começa bem depois)
    for ang, lab in ((162, "metade"),):
        x0, y0 = G.P(ang, rm - 8); x1, y1 = G.P(ang, rm + 8)
        guide += f'<line x1="{x0:.1f}" y1="{y0:.1f}" x2="{x1:.1f}" y2="{y1:.1f}" stroke="{PURPLE}" stroke-width=".35" stroke-dasharray="1 .8"/>'
    big = G.svg100(C[MAIN][3]() + guide)
    return f"""<section class="page white">
<div class="kicker">03 · Construção</div><h2>Anatomia dos <em>traços</em></h2>
<div style="display:grid;grid-template-columns:420px 1fr;gap:36px;align-items:center;margin-top:6px">
{img(sv(big), 420)}
<div class="cols" style="grid-template-columns:1fr 1fr">
<div class="box" style="background:{CREAM}"><h4>C</h4><p>Raio externo 45, traço 10 (o original tinha 16), pontas redondas. Abertura de 54° centrada em −18° (linha roxa), para onde a estrela aponta.</p></div>
<div class="box" style="background:{CREAM}"><h4>Traços</h4><p>Da ponta para dentro: ponto (≈14°) → 20° → 30° → linha. Vão de 5 (≈ 7°). Espessura 10 em tudo, com pontas redondas.</p></div>
<div class="box" style="background:{CREAM}"><h4>Discreto</h4><p>A progressão começa depois da metade do C (tracejado roxo). De longe, um C; de perto, · – –– –––.</p></div>
<div class="box" style="background:{CREAM}"><h4>16–20 px</h4><p>Arquivo próprio (<code>-16.svg</code>): traço 14, ponto + um traço, vão 5,75.</p></div>
</div></div>{foot(n)}</section>"""


def p_variants(n):
    cards = ""
    for k, (slug, name, idea, fn) in enumerate(G.CONCEPTS):
        on = " on" if slug == MAIN else ""
        cards += (f'<div class="vr{on}"><span class="lbl">{k + 1}{" · RECOMENDADA" if on else ""}</span>{img(L(slug + "-color"), 104)}<h3>{name}</h3><p>{idea}</p>'
                  f'<div class="row"><span style="background:{INK};padding:5px;border-radius:9px">{img(L(slug + "-dark"), 26)}</span>'
                  f'{img(L(slug + "-app-rosa"), 34)}{img(L(slug + "-app-roxo"), 34)}'
                  f'{img(L(slug + "-16"), 20)}{img(L(slug + "-16"), 16)}</div></div>')
    return f"""<section class="page">
<div class="kicker">04 · Possibilidades</div><h2>Oito variações do <em>sutil</em></h2>
<div class="vars">{cards}</div>{foot(n)}</section>"""


def p_amount(n):
    cells = ""
    for gap, note in [(3, "rodada 7 (antes)"), (4, ""), (5, "recomendado"), (6, ""), (7, "máximo")]:
        body = G.c_tracos_shape(DEEP, G.W_MAIN, [0, 20, 30], gap=gap) + G.star(DEEP)
        small = G.c_tracos_shape(DEEP, G.W_SMALL, [0, 28], gap=gap * 1.15) + G.star(DEEP)
        on = "on" if gap == 5 else ""
        cells += (f'<div class="{on}">{img(sv(G.svg100(body)), 170)}<div style="display:flex;gap:8px;justify-content:center;margin-top:8px;align-items:center">'
                  f'{img(sv(G.svg100(body)), 32)}{img(sv(G.svg100(small)), 20)}{img(sv(G.svg100(small)), 16)}</div><b>vão {gap}</b>{note}</div>')
    return f"""<section class="page">
<div class="kicker">05 · Quanto vão</div><h2>De 3 para <em>5</em></h2>
<p class="lead">O mesmo sutil (ponto, 20°, 30°) com vão de 3 a 7. Com 3 os traços quase encostam. Com 5, cada um respira e o C continua inteiro. Com 7 a ponta começa a parecer solta.</p>
<div class="thick">{cells}</div>{foot(n)}</section>"""


def p_uses(n, idx, title, sub):
    tiles = "".join(use_tile(MAIN, u, nm, bg) for (u, nm, bg, *_r) in [G.USES[i] for i in idx])
    return f"""<section class="page white">
<div class="kicker">{n:02d} · Usos em cor</div><h2>{title}</h2><p class="lead">{sub}</p>
<div class="uses">{tiles}</div>{foot(n)}</section>"""


def p_apps_lockups(n):
    apps = "".join(f'<div style="text-align:center">{img(L(f"{MAIN}-app-{b}"), 104)}<div style="font-size:10px;margin-top:6px">{t}</div></div>'
                   for b, t in [("rosa", "tile rosa"), ("roxo", "tile roxo"), ("preto", "tile preto"), ("branco", "tile branco")])
    lks = [("deep", WHITE, "rosa/deep + clozzy preto"), ("branco-no-preto", INK, "branco no preto"),
           ("branco-no-rosa", PINK, "branco no rosa"), ("branco-no-roxo", PURPLE, "branco no roxo"),
           ("rosa-estrela-roxa", CREAM, "anel rosa, estrela roxa"), ("rosa-estrela-branca-no-preto", INK, "rosa + estrela branca no preto")]
    lk = "".join(f'<div style="background:{bg};{"border:1px solid rgba(20,9,15,.08);" if bg == WHITE else ""}">{img(L(f"{MAIN}-uso-{u}-lockup"), h=52)}</div>' for u, bg, _t in lks)
    return f"""<section class="page">
<div class="kicker">{n:02d} · Ícones e lockups</div><h2>Rosa, roxo, <em>preto e branco</em></h2>
<div style="display:flex;gap:26px;justify-content:center;margin-top:8px">{apps}</div>
<div class="lk" style="grid-template-columns:1fr 1fr 1fr">{lk}</div>{foot(n)}</section>"""


def p_screen(n):
    ph = [b64(PHD / f"p{i}.jpg", "image/jpeg") for i in (2, 3, 5, 6)]
    apps = "".join('<span><i></i>app</span>' for _ in range(5))
    frames = ""
    for k in range(5):
        npts = [0, 1, 2, 3, 4][k]
        body = (G.c_tracos_shape(PINK, G.W_MAIN, [0, 20, 30], gap=5) if k == 4 else
                (G.line(PINK, G.W_MAIN, G.C_LOW + 7.2, 200 + 30 * k) + "")) + G.star(PINK if k else WHITE)
        frames += f'<div>{img(sv(G.svg100(body)), 64)}<div style="margin-top:4px;color:rgba(255,255,255,.7)">{["0 ms", "120", "240", "360", "520 ms"][k]}</div></div>'
    return f"""<section class="page">
<div class="kicker">{n:02d} · Aplicação</div><h2>Na <em>tela</em> e em <em>movimento</em></h2>
<div style="display:grid;grid-template-columns:250px 1fr;gap:26px;margin-top:10px">
<div class="phone" style="height:420px"><div class="scr" style="background:#3a2a36"><img src="{ph[1]}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.55">
<div class="spring" style="position:relative">{apps}<span>{img(L(MAIN + "-app-rosa"), 46)}Clozzy</span>{apps}{apps[:len(apps) // 5]}</div></div></div>
<div style="display:flex;flex-direction:column;gap:14px">
<div class="box" style="display:flex;justify-content:space-between;align-items:center">{img(L(MAIN + "-uso-deep-lockup"), h=34)}<span style="display:flex;gap:16px;font-size:12px;font-weight:700;align-items:center">Explorar <span>Entrar</span> <span style="background:{DEEP};color:#fff;padding:7px 14px;border-radius:99px">Sou criador</span></span></div>
<div class="box" style="background:{INK};display:flex;justify-content:space-between;align-items:center">{img(L(MAIN + "-uso-branco-estrela-rosa-no-preto-lockup"), h=34)}<span style="display:flex;gap:8px;align-items:center;background:rgba(255,255,255,.08);color:#fff;padding:6px 10px;border-radius:8px;font-size:11px">{img(L(MAIN + "-uso-rosa-no-preto-16"), 16)}clozzy.com</span></div>
<div class="box" style="background:{PURPLE};color:#fff;display:flex;gap:16px;align-items:center">{img(L(MAIN + "-uso-branco-no-roxo"), 60)}<p>Convite do Close em roxo: o símbolo vai todo branco.</p>{img(L(MAIN + "-uso-branco-no-roxo-lockup"), h=30)}</div>
<div class="box" style="background:{INK};color:#fff"><h4>Animação de assinatura (520 ms)</h4><div class="frames">{frames}<p style="margin-left:10px;font-size:10.5px;opacity:.8">O C se desenha, a estrela acende e, por último, a ponta se desfaz em · – ––: “acesso liberado”. Com <code>prefers-reduced-motion</code>, mostra só o quadro final.</p></div></div>
</div></div>{foot(n)}</section>"""


def p_next(n):
    picks = ["s1-vao-5", "s2-vao-6", "s6-vao-abre"]
    return f"""<section class="page ink" style="display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:30px">
<div><div class="kicker">{n:02d} · Decisão</div><h2 style="font-size:40px">Recomendo o <em>1 · sutil, vão 5</em></h2>
<p class="lead" style="margin-top:10px">O sutil que você escolheu, com vão 5: os traços respiram sem se soltar do C. Se quiser mais ar, a 2 (vão 6). A 6 destaca o ponto com um vão maior só na ponta.</p>
<ul class="lead" style="margin:14px 0 0 18px"><li>Mais arejado: <b>2 · vão 6</b> ou <b>3 · vão 7</b>.</li><li>Para escolher: variação (1–8) e combinação de cor (págs. 06–07). Sugestão: Pink Deep no claro, rosa no preto e branco sobre rosa ou roxo.</li><li>Depois: refinamento óptico, kit completo e manual.</li></ul></div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;justify-items:center">{"".join(f'<div style="text-align:center">{img(L(s + "-uso-rosa-no-preto"), 130)}<div style="font:800 12px Gabarito;margin-top:6px">{C[s][1]}</div></div>' for s in picks)}
{"".join(f'<div style="text-align:center">{img(L(MAIN + "-app-" + b), 80)}</div>' for b in ("rosa", "roxo", "branco"))}</div>
{foot(n)}</section>"""


def build():
    light = [0, 1, 2, 3, 4, 5, 6, 7]
    dark = [8, 9, 10, 11, 12, 13, 14, 15]
    pages = [p_cover(), p_origin(2), p_anatomy(3), p_variants(4), p_amount(5),
             p_uses(6, light, "Sobre <em>branco</em>", "Uma cor (Pink Deep, rosa, preto, roxo) e as combinações de duas cores, com o anel numa cor e a estrela na outra. Nunca rosa e roxo como texto lado a lado; no símbolo funciona porque são formas grandes e separadas."),
             p_uses(7, dark, "Sobre <em>rosa, roxo e preto</em>", "Sobre cor ou preto: branco puro, rosa no preto ou uma combinação com a estrela em destaque. No rosa, o preto também funciona (5,2:1)."),
             p_apps_lockups(8), p_screen(9), p_next(10)]
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy — C gradativo</title>'
            f'<style>{PB.css()}{EXTRA}</style></head><body>{"".join(pages)}</body></html>')
    OUT_HTML.write_text(html)
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer", f"--print-to-pdf={OUT_PDF}", OUT_HTML.as_uri()],
                   check=True, capture_output=True)
    return len(pages)


if __name__ == "__main__":
    print("pages", build())

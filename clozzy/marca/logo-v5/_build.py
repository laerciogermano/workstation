#!/usr/bin/env python3
"""Clozzy — documento da v5 (C com ponta de tracejado gradativo, 4 cores).
Rodar: python3 _v5.py && python3 _build.py → logo-v5-clozzy.{html,pdf}"""
import base64, importlib.util, math, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import _v5 as V  # noqa: E402

_spec = importlib.util.spec_from_file_location("r4css", HERE.parent / "logo-possibilidades" / "_build.py")
PB = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(PB)

CHROME = PB.CHROME
OUT_HTML = HERE / "logo-v5-clozzy.html"
OUT_PDF = HERE / "logo-v5-clozzy.pdf"
R5 = HERE.parent / "logo-circulo-tracejado" / "svg"
REF_C = sorted((HERE.parent / "refs").glob("*13.25.20*.png"))[0]
REF_STORY = sorted((HERE.parent / "refs").glob("*13.43.37*.png"))[0]
PHD = HERE.parent / "referencias-apps" / "modelos" / "img"

INK, PINK, WHITE, PURPLE, DEEP, CREAM = V.INK, V.PINK, V.WHITE, V.PURPLE, V.DEEP, V.CREAM
MAIN = V.MAIN
C = V.C
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
    return f'<div class="foot"><span>Clozzy · Logo v5 · ponta gradativa · nov 2026</span><span>{n:02d}</span></div>'


EXTRA = f"""
h1 em,h2 em{{color:{PINK}}} .ink h1 em,.ink h2 em{{color:{PINK}}}
.vars{{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:8px}}
.vr{{background:#fff;border-radius:20px;padding:12px 14px;display:flex;flex-direction:column;align-items:center;text-align:center}}
.vr h3{{font-size:16px;font-weight:800;margin-top:4px}} .vr p{{font-size:10px;line-height:1.38;color:rgba(20,9,15,.7);margin-top:3px}}
.vr .row{{display:flex;gap:8px;align-items:center;margin-top:7px}} .vr.on{{outline:3px solid {PINK}}}
.vr .lbl{{font:800 10px Figtree;letter-spacing:.12em;color:{PINK}}}
.uses{{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:10px}}
.use{{border-radius:16px;height:122px;display:flex;align-items:center;gap:12px;padding:10px 14px}}
.use span{{font-size:10px;line-height:1.3}} .use b{{display:block;font:800 12px Gabarito}}
.lk{{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:12px}}
.lk div{{border-radius:18px;height:112px;display:grid;place-items:center}}
.frames{{display:flex;gap:14px;align-items:center;margin-top:8px}}
.frames div{{text-align:center;font-size:10px}}
.pal{{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:12px}}
.pal .c{{border-radius:20px;overflow:hidden;background:#fff}}
.pal .c .sw{{height:120px;display:grid;place-items:center;margin:0}}
.pal .c .tx{{padding:11px 14px 14px}} .pal .c h4{{font:800 15px Gabarito}}
.pal .c p{{font-size:10px;line-height:1.4;color:rgba(20,9,15,.7);margin-top:3px}}
.pal .c code{{font-size:9.5px;letter-spacing:.04em;color:rgba(20,9,15,.5)}}
.seq{{display:flex;align-items:center;gap:10px;margin-top:10px}}
.seq .s{{background:#fff;border-radius:14px;padding:10px 12px;text-align:center;font-size:10px;flex:1}}
.seq .s b{{display:block;font:800 13px Gabarito;margin-top:5px}}
.seq .ar{{font:800 20px Gabarito;color:{PINK}}}
"""


def arc_strip(length_u, w=10.0, color=PINK):
    """Mostra um traço solto do comprimento pedido, reto, para a página de construção."""
    L_ = max(length_u, w)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {L_ + 2} {w + 2}" width="{(L_ + 2) * 2.1}" height="{(w + 2) * 2.1}">'
            f'<line x1="{1 + w / 2}" y1="{1 + w / 2}" x2="{1 + L_ - w / 2}" y2="{1 + w / 2}" stroke="{color}" '
            f'stroke-width="{w}" stroke-linecap="round"/></svg>')


def use_tile(u, name, bg, rc, sc):
    light = bg in (INK, PINK, PURPLE)
    return (f'<div class="use" style="background:{bg};{"border:1px solid rgba(20,9,15,.1);" if bg == WHITE else ""}">'
            f'{img(L(f"{MAIN}-uso-{u}"), 92)}<span style="{"color:#fff;" if light else ""}"><b>{name}</b>'
            f'<span style="display:flex;gap:6px;margin-top:6px;align-items:center">'
            f'{img(L(f"{MAIN}-uso-{u}"), 24)}{img(L(f"{MAIN}-uso-{u}-16"), 16)}</span></span></div>')


# ------------------------------------------------------------------ páginas
def p_cover():
    return f"""<section class="page ink" style="display:grid;grid-template-columns:1.1fr 1fr;align-items:center;gap:30px">
<div><div class="kicker">Clozzy 2028 · Logo · v5</div>
<h1>O círculo<br>abre num C<br>e a ponta<br><em>se solta.</em></h1>
<p class="lead" style="margin-top:18px;max-width:470px">Mesma espessura do começo ao fim. O que muda é o <b>comprimento</b>: um ponto, um traço, um traço maior — e a linha cheia do C. Quatro cores: <b>preto, rosa, branco e roxo</b>.</p>
<div style="display:flex;gap:9px;align-items:center;margin-top:20px">{"".join(arc_strip(u, 10, PINK) for u in (10, 17, 29))}
<span style="font:800 15px Gabarito;color:rgba(255,255,255,.5)">→ C</span></div></div>
<div style="display:grid;place-items:center">{img(L(MAIN + "-uso-rosa-no-preto"), 340)}</div>{foot(1)}</section>"""


def p_origin(n):
    import _logos as LG
    cells = [(sv(V.svg100(LG.mark_inner(PINK, PINK))), "Círculo próximo (v1)", "svg"),
             (b64(REF_STORY, "image/png"), "Print · anel de story", "png"),
             (R("a-ponta-color"), "v4 · “Só na ponta”", "svg")]
    row = "".join(f'<div class="box" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:286px">'
                  f'<img src="{src}" style="max-width:100%;max-height:210px;object-fit:contain;border-radius:10px">'
                  f'<b class="g" style="margin-top:10px;font-size:12.5px">{t}</b></div>' for src, t, _k in cells if src)
    return f"""<section class="page">
<div class="kicker">02 · De onde vem</div><h2>A ponta que <em>vira story</em></h2>
<p class="lead">O “Só na ponta” da v4 já quebrava o C perto do topo, mas em traços de tamanhos aleatórios. A v5 põe ordem nisso: os traços seguem uma progressão, do ponto até a linha.</p>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr 40px 1.15fr;gap:12px;align-items:center;margin-top:10px">{row}
<div style="font:800 40px Gabarito;color:{PINK};text-align:center">→</div>
<div class="box" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:286px">{img(L(MAIN + "-rosa"), 200)}<b class="g" style="margin-top:12px;font-size:12.5px">v5 · ponta gradativa</b></div></div>
<div class="cols" style="grid-template-columns:repeat(4,1fr);margin-top:14px">
<div class="box"><h4>Espessura fixa</h4><p>Traço 10 em tudo: ponto, traços e linha têm a mesma medida. Nada afina nem engrossa.</p></div>
<div class="box"><h4>Comprimento em progressão</h4><p>Cada traço é 1,7× o anterior. O ponto é o primeiro termo; a linha cheia é o último.</p></div>
<div class="box"><h4>Sem traço solto</h4><p>O último traço emenda direto na volta do C — a ponta não fica picotada no meio do caminho.</p></div>
<div class="box"><h4>Estrela original</h4><p>R 20,5 · miolo 0,48 · canto 5, centrada em 50/50. A mesma do Círculo próximo.</p></div>
</div>{foot(n)}</section>"""


def p_anatomy(n):
    w = V.W_MAIN
    rm = V.OUTER - w / 2
    guide = (f'<circle cx="50" cy="50" r="{rm}" fill="none" stroke="rgba(20,9,15,.2)" stroke-width=".3" stroke-dasharray="1 1"/>'
             f'<line x1="0" y1="50" x2="100" y2="50" stroke="rgba(20,9,15,.15)" stroke-width=".3" stroke-dasharray="1 1"/>'
             f'<line x1="50" y1="0" x2="50" y2="100" stroke="rgba(20,9,15,.15)" stroke-width=".3" stroke-dasharray="1 1"/>')
    x, y = V.P(-18, 49)
    guide += f'<line x1="50" y1="50" x2="{x:.1f}" y2="{y:.1f}" stroke="{PURPLE}" stroke-width=".4"/>'
    x0, y0 = V.P(162, rm - 8)
    x1, y1 = V.P(162, rm + 8)
    guide += f'<line x1="{x0:.1f}" y1="{y0:.1f}" x2="{x1:.1f}" y2="{y1:.1f}" stroke="{PURPLE}" stroke-width=".35" stroke-dasharray="1 .8"/>'
    big = V.svg100(C[MAIN][3](PINK, PINK) + guide)
    ls = V.steps(w, 3)
    total = sum(ls) + 2 * V.GAP
    seq = ""
    for i, u in enumerate(ls):
        seq += (f'<div class="s">{arc_strip(u, w)}<b>{"ponto" if i == 0 else f"traço {i}"}</b>'
                f'{u:.0f} un · {math.degrees(u / rm):.0f}°</div><div class="ar">→</div>')
    seq += f'<div class="s" style="flex:1.6">{arc_strip(52, w, INK)}<b>linha</b>o resto do C</div>'
    sizes = "".join(f'<div style="text-align:center">{img(L(MAIN + ("-16" if px <= 24 else "-rosa")), px)}'
                    f'<div style="font-size:9.5px;margin-top:7px;color:rgba(20,9,15,.6)">{px} px</div></div>'
                    for px in (120, 72, 44, 28, 20, 16))
    return f"""<section class="page white">
<div class="kicker">03 · Construção</div><h2>Ponto, <em>×1,7</em>, <em>×1,7</em>, linha</h2>
<div style="display:grid;grid-template-columns:400px 1fr;gap:34px;align-items:center;margin-top:6px">
{img(sv(big), 400)}
<div><div class="seq">{seq}</div>
<div class="cols" style="grid-template-columns:1fr 1fr;margin-top:14px">
<div class="box" style="background:{CREAM}"><h4>O C</h4><p>Raio externo 45, traço 10, pontas redondas. Abertura de 54° centrada em −18° (linha roxa) — para onde a estrela aponta.</p></div>
<div class="box" style="background:{CREAM}"><h4>A progressão</h4><p>Comprimentos de {ls[0]:.0f}, {ls[1]:.0f} e {ls[2]:.0f} unidades de arco, vãos de {V.GAP:.1f}. Ao todo {total:.0f} un ({math.degrees(total / rm):.0f}°), pouco mais de um quarto do C.</p></div>
<div class="box" style="background:{CREAM}"><h4>Onde começa</h4><p>Depois da metade (tracejado roxo). De longe lê C; de perto, um story carregando.</p></div>
<div class="box" style="background:{CREAM}"><h4>16–20 px</h4><p>Corte próprio (<code>-16.svg</code>): traço 14 e só ponto + um traço, senão a ponta vira sujeira.</p></div>
</div></div></div>
<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-top:22px;padding-top:18px;border-top:1px solid rgba(20,9,15,.1)">
<div style="max-width:300px"><b class="g" style="font-size:14px">Redução</b>
<p style="font-size:11px;line-height:1.45;color:rgba(20,9,15,.7);margin-top:4px">Até 28 px o desenho completo aguenta. De 24 px para baixo entra o corte de dois termos — o ponto continua lá, é ele que carrega a ideia.</p></div>
<div style="display:flex;align-items:flex-end;gap:26px">{sizes}</div></div>{foot(n)}</section>"""


def p_variants(n):
    cards = ""
    for k, (slug, name, idea, _fn) in enumerate(V.CONCEPTS):
        on = " on" if slug == MAIN else ""
        cards += (f'<div class="vr{on}"><span class="lbl">{k + 1}{" · RECOMENDADA" if on else ""}</span>{img(L(slug + "-rosa"), 112)}'
                  f'<h3>{name}</h3><p>{idea}</p>'
                  f'<div class="row"><span style="background:{INK};padding:5px;border-radius:9px">{img(L(slug + "-16-dark"), 34)}</span>'
                  f'{img(L(slug + "-app-rosa"), 38)}{img(L(slug + "-app-roxo"), 38)}{img(L(slug + "-app-preto"), 38)}'
                  f'{img(L(slug + "-preto"), 28)}{img(L(slug + "-16"), 18)}{img(L(slug + "-16"), 16)}</div></div>')
    return f"""<section class="page">
<div class="kicker">04 · Possibilidades</div><h2>Seis jeitos de <em>soltar a ponta</em></h2>
<div class="vars">{cards}</div>{foot(n)}</section>"""


def p_ratio(n):
    rm = V.OUTER - V.W_MAIN / 2
    cells, rulers = "", ""
    for r, lab, note in [(1.3, "1,3", "quase igual"), (1.5, "1,5", "discreto"), (1.7, "1,7", "escolhida"),
                         (2.2, "2,2", "salto visível"), (3.0, "3,0", "traço final domina")]:
        ls = V.steps(V.W_MAIN, 3, r)
        body = V.c_v5(PINK, V.W_MAIN, ls) + V.star(PINK)
        on = "on" if r == V.RATIO else ""
        cells += (f'<div class="{on}">{img(sv(V.svg100(body)), 160)}'
                  f'<div style="display:flex;gap:8px;justify-content:center;margin-top:8px;align-items:center">'
                  f'{img(sv(V.svg100(body)), 30)}{img(sv(V.svg100(body)), 18)}</div><b>razão {lab}</b>{note}</div>')
        bars = "".join(f'<div style="display:flex;align-items:center;gap:7px">'
                       f'{arc_strip(u, V.W_MAIN, INK if r == V.RATIO else "rgba(20,9,15,.35)")}'
                       f'<span style="font-size:9px;color:rgba(20,9,15,.55)">{u:.0f}</span></div>' for u in ls)
        rulers += (f'<div style="flex:1"><div style="font:800 10px Figtree;color:{PINK if r == V.RATIO else "rgba(20,9,15,.45)"};'
                   f'margin-bottom:7px">RAZÃO {lab} · {sum(ls) + 2 * V.GAP:.0f} UN · {math.degrees((sum(ls) + 2 * V.GAP) / rm):.0f}°</div>'
                   f'<div style="display:flex;flex-direction:column;gap:5px">{bars}</div></div>')
    return f"""<section class="page">
<div class="kicker">05 · Quanto crescer</div><h2>A razão <em>1,7</em></h2>
<p class="lead">O mesmo C com três traços e razões diferentes. Abaixo de 1,5 a progressão some — parece tracejado comum. Acima de 2,2 o último traço fica tão longo que a sequência vira só “um ponto e um arco”.</p>
<div class="thick">{cells}</div>
<div style="display:flex;gap:26px;margin-top:24px;padding-top:18px;border-top:1px solid rgba(20,9,15,.1)">{rulers}</div>
<p class="lead" style="margin-top:12px">Os três comprimentos em unidades de arco, na mesma escala. Com 1,7 a ponta ocupa 63 unidades (90°) — depois da metade do C e antes de competir com a estrela.</p>{foot(n)}</section>"""


def p_palette(n):
    cores = [("Preto", INK, "#14090F", "Texto, fundo escuro e a versão de um tom só. É o preto quente da marca, não puro.", INK),
             ("Rosa", PINK, "#FF0065", "A cor do app. Símbolo sobre branco e sobre preto; em traço fino sobre branco, usar o rosa escuro #E0005A.", PINK),
             ("Branco", WHITE, "#FFFFFF", "Símbolo vazado sobre rosa, roxo ou preto. É o que mais aparece no app.", WHITE),
             ("Roxo", PURPLE, "#7C48C4", "Acento: convite, Close, estados especiais. Não é um segundo logo.", PURPLE)]
    cards = ""
    for nome, bg, hexv, txt, mc in cores:
        inner = C[MAIN][3](WHITE if bg != WHITE else PINK, WHITE if bg != WHITE else PINK)
        border = "border:1px solid rgba(20,9,15,.12);" if bg == WHITE else ""
        cards += (f'<div class="c"><div class="sw" style="background:{bg};{border}">{img(sv(V.svg100(inner)), 92)}</div>'
                  f'<div class="tx"><h4>{nome}</h4><code>{hexv}</code><p>{txt}</p></div></div>')
    pairs = [("rosa + preto", PINK, INK), ("rosa + branco", PINK, WHITE), ("roxo + rosa", PURPLE, PINK),
             ("preto + rosa", INK, PINK), ("roxo + branco", PURPLE, WHITE), ("preto + branco", INK, WHITE)]
    duo = "".join(f'<div style="display:flex;align-items:center;gap:8px;font-size:10.5px;font-weight:700">'
                  f'<i style="width:22px;height:22px;border-radius:7px;background:{a}"></i>'
                  f'<i style="width:22px;height:22px;border-radius:7px;background:{b};{"outline:1px solid rgba(20,9,15,.15);" if b == WHITE else ""}"></i>{t}</div>'
                  for t, a, b in pairs)
    return f"""<section class="page white">
<div class="kicker">06 · Paleta</div><h2>Quatro cores, <em>nada mais</em></h2>
<p class="lead">Preto, rosa, branco e roxo. O símbolo usa uma cor só ou duas: anel numa, estrela na outra. Sem gradiente, sem terceira cor dentro da marca.</p>
<div class="pal">{cards}</div>
<div style="display:flex;gap:24px;margin-top:16px;flex-wrap:wrap">{duo}</div>
<p class="lead" style="margin-top:12px">Rosa e roxo juntos só funcionam no símbolo, onde são formas grandes e separadas — nunca como texto rosa sobre fundo roxo.</p>{foot(n)}</section>"""


def p_uses(n, idx, title, sub):
    tiles = "".join(use_tile(u, nm, bg, rc, sc) for (u, nm, bg, rc, sc, _w) in [V.USES[i] for i in idx])
    return f"""<section class="page{" white" if n == 7 else ""}">
<div class="kicker">{n:02d} · Usos em cor</div><h2>{title}</h2><p class="lead">{sub}</p>
<div class="uses">{tiles}</div>{foot(n)}</section>"""


def p_apps_lockups(n):
    apps = "".join(f'<div style="text-align:center">{img(L(f"{MAIN}-app-{b}"), 104)}<div style="font-size:10px;margin-top:6px">{t}</div></div>'
                   for b, t in [("rosa", "tile rosa"), ("roxo", "tile roxo"), ("preto", "tile preto"), ("branco", "tile branco")])
    lks = [("rosa", WHITE), ("branco-no-preto", INK), ("branco-no-rosa", PINK),
           ("branco-no-roxo", PURPLE), ("preto", WHITE), ("rosa-estrela-branca-no-preto", INK)]
    lk = "".join(f'<div style="background:{bg};{"border:1px solid rgba(20,9,15,.1);" if bg == WHITE else ""}">'
                 f'{img(L(f"{MAIN}-uso-{u}-lockup"), h=50)}</div>' for u, bg in lks)
    return f"""<section class="page">
<div class="kicker">{n:02d} · Ícone e lockup</div><h2>Tile e <em>assinatura</em></h2>
<p class="lead">O ícone de app usa o símbolo numa cor só sobre um dos quatro fundos. O lockup leva “clozzy” em Gabarito 800, altura do “l” em 52% do símbolo.</p>
<div style="display:flex;gap:26px;justify-content:center;margin-top:12px">{apps}</div>
<div class="lk">{lk}</div>{foot(n)}</section>"""


def p_screen(n):
    ph = b64(PHD / "p3.jpg", "image/jpeg")
    apps = "".join('<span><i></i>app</span>' for _ in range(5))
    frames = ""
    labels = ["0 ms", "140", "280", "420", "560 ms"]
    for k in range(5):
        if k == 0:
            body = V.star(WHITE)
        elif k == 4:
            body = C[MAIN][3](PINK, PINK)
        else:
            body = V.line(PINK, V.W_MAIN, V.C_LOW + 7.2, 120 + 70 * k) + V.star(PINK)
        frames += (f'<div>{img(sv(V.svg100(body)), 62)}'
                   f'<div style="margin-top:4px;color:rgba(255,255,255,.7)">{labels[k]}</div></div>')
    return f"""<section class="page">
<div class="kicker">{n:02d} · Aplicação</div><h2>Na <em>tela</em> e em <em>movimento</em></h2>
<div style="display:grid;grid-template-columns:250px 1fr;gap:26px;margin-top:10px">
<div class="phone" style="height:420px"><div class="scr" style="background:#3a2a36">
<img src="{ph}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.5">
<div class="spring" style="position:relative">{apps}<span>{img(L(MAIN + "-app-rosa"), 46)}Clozzy</span>{apps}</div></div></div>
<div style="display:flex;flex-direction:column;gap:13px">
<div class="box" style="display:flex;justify-content:space-between;align-items:center">{img(L(MAIN + "-uso-rosa-deep-lockup"), h=34)}
<span style="display:flex;gap:16px;font-size:12px;font-weight:700;align-items:center">Explorar <span>Entrar</span>
<span style="background:{PINK};color:#fff;padding:7px 14px;border-radius:99px">Sou criador</span></span></div>
<div class="box" style="background:{INK};display:flex;justify-content:space-between;align-items:center">{img(L(MAIN + "-uso-branco-estrela-rosa-no-preto-lockup"), h=34)}
<span style="display:flex;gap:8px;align-items:center;background:rgba(255,255,255,.08);color:#fff;padding:6px 10px;border-radius:8px;font-size:11px">{img(L(MAIN + "-uso-rosa-no-preto-16"), 16)}clozzy.com</span></div>
<div class="box" style="background:{PURPLE};color:#fff;display:flex;gap:16px;align-items:center">{img(L(MAIN + "-uso-branco-no-roxo"), 58)}
<p>Convite do Close em roxo: símbolo e palavra vão todos brancos.</p>{img(L(MAIN + "-uso-branco-no-roxo-lockup"), h=28)}</div>
<div class="box" style="background:{INK};color:#fff"><h4>Animação de assinatura (560 ms)</h4><div class="frames">{frames}
<p style="margin-left:10px;font-size:10.5px;opacity:.8">A estrela acende, o C se desenha no sentido horário e a ponta se solta por último — o ponto chega depois do traço. Com <code>prefers-reduced-motion</code>, só o quadro final.</p></div></div>
</div></div>{foot(n)}</section>"""


def p_next(n):
    picks = ["v5a-gradativo", "v5b-sutil", "v5e-vaos"]
    cards = "".join(f'<div style="text-align:center">{img(L(s + "-uso-rosa-no-preto"), 128)}'
                    f'<div style="font:800 12px Gabarito;margin-top:6px">{C[s][1]}</div></div>' for s in picks)
    tiles = "".join(f'<div style="text-align:center">{img(L(MAIN + "-app-" + b), 78)}</div>' for b in ("rosa", "roxo", "branco"))
    return f"""<section class="page ink" style="display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:30px">
<div><div class="kicker">{n:02d} · Decisão</div><h2 style="font-size:40px">Recomendo a <em>1 · ponta gradativa</em></h2>
<p class="lead" style="margin-top:10px">Ponto, traço, traço maior e a linha do C, tudo na mesma espessura. É a leitura mais limpa da ideia e a única que sobrevive em 16 px com o corte reduzido.</p>
<ul class="lead" style="margin:14px 0 0 18px">
<li>Mais discreta: <b>2 · só o ponto</b>. Mais expressiva: <b>5 · vãos que fecham</b>.</li>
<li>Para fechar: a forma (1–6) e a dupla de cores (págs. 06–08). Sugestão: rosa no preto como principal, branco sobre rosa e roxo, preto para uma cor só.</li>
<li>Depois: ajuste óptico das pontas, kit de exportação e manual.</li></ul></div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;justify-items:center">{cards}{tiles}</div>{foot(n)}</section>"""


def build():
    light = [0, 1, 2, 3, 4, 5, 6, 7]
    dark = [8, 9, 10, 11, 12, 13, 14, 15]
    pages = [p_cover(), p_origin(2), p_anatomy(3), p_variants(4), p_ratio(5), p_palette(6),
             p_uses(7, light, "Sobre <em>branco</em>",
                    "Uma cor só (rosa, preto, roxo) e as duplas, com o anel numa cor e a estrela na outra. O rosa escuro #E0005A é o rosa dos tamanhos pequenos sobre branco."),
             p_uses(8, dark, "Sobre <em>rosa, roxo e preto</em>",
                    "Sobre cor ou preto: branco puro, rosa no preto ou uma dupla com a estrela em destaque. No rosa, o preto também passa (5,2:1)."),
             p_apps_lockups(9), p_screen(10), p_next(11)]
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy — Logo v5</title>'
            f'<style>{PB.css()}{EXTRA}</style></head><body>{"".join(pages)}</body></html>')
    OUT_HTML.write_text(html)
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer",
                    f"--print-to-pdf={OUT_PDF}", OUT_HTML.as_uri()], check=True, capture_output=True)
    return len(pages)


if __name__ == "__main__":
    print("pages", build())

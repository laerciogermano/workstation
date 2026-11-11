#!/usr/bin/env python3
"""Clozzy — documento da v6 (C de pontas inteiras com quebra tracejada no canto superior esquerdo).
Rodar: python3 _v6.py && python3 _build.py → logo-v6-clozzy.{html,pdf}"""
import base64, importlib.util, math, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import _v6 as V  # noqa: E402
sys.path.insert(0, str(HERE.parent / "identidade-nova"))
import _logos as LG  # noqa: E402

_spec = importlib.util.spec_from_file_location("r4css", HERE.parent / "logo-possibilidades" / "_build.py")
PB = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(PB)

CHROME = PB.CHROME
OUT_HTML = HERE / "logo-v6-clozzy.html"
OUT_PDF = HERE / "logo-v6-clozzy.pdf"
REFS = HERE.parent / "refs"
V5 = HERE.parent / "logo-v5" / "svg"
PHD = HERE.parent / "referencias-apps" / "modelos" / "img"

INK, PINK, WHITE, PURPLE, DEEP, CREAM = V.INK, V.PINK, V.WHITE, V.PURPLE, V.DEEP, V.CREAM
MAIN = V.MAIN
C = V.C
img = PB.img
RM = V.OUTER - V.W_MAIN / 2


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(Path(p).read_bytes()).decode()


def sv(s):
    return "data:image/svg+xml;base64," + base64.b64encode(s.encode()).decode()


def L(name):
    return b64(HERE / "svg" / f"{name}.svg", "image/svg+xml")


def ref(pat):
    hits = sorted(REFS.glob(f"*{pat}*.png"))
    return b64(hits[0], "image/png") if hits else ""


def deg(u):
    return math.degrees(u / RM)


def foot(n):
    return f'<div class="foot"><span>Clozzy · Logo v6 · quebra no canto · nov 2026</span><span>{n:02d}</span></div>'


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
.lk div{{border-radius:18px;height:110px;display:grid;place-items:center}}
.pal{{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:12px}}
.pal .c{{border-radius:20px;overflow:hidden;background:#fff}}
.pal .c .sw{{height:118px;display:grid;place-items:center;margin:0}}
.pal .c .tx{{padding:11px 14px 14px}} .pal .c h4{{font:800 15px Gabarito}}
.pal .c p{{font-size:10px;line-height:1.4;color:rgba(20,9,15,.7);margin-top:3px}}
.pal .c code{{font-size:9.5px;letter-spacing:.04em;color:rgba(20,9,15,.5)}}
.apl{{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:1fr;gap:13px;margin-top:12px;height:134mm}}
.apl .k{{background:#fff;border-radius:18px;padding:14px 16px;display:flex;flex-direction:column;gap:10px}}
.apl .k b{{font:800 12.5px Gabarito}} .apl .k p{{font-size:9.8px;line-height:1.42;color:rgba(20,9,15,.65)}}
.apl .k .st{{border-radius:13px;padding:12px;display:flex;align-items:center;gap:10px;flex:1}}
.tab{{display:flex;align-items:center;gap:7px;background:#ECE7E4;border-radius:8px 8px 0 0;padding:6px 10px;font-size:9.5px}}
.tab .u{{background:#fff;border-radius:99px;padding:3px 9px;font-size:9px;color:rgba(20,9,15,.6)}}
.mail{{font-size:9.5px;line-height:1.45}} .mail b{{font:800 10.5px Gabarito;display:block}}
.frames{{display:flex;gap:13px;align-items:center;margin-top:8px}}
.frames div{{text-align:center;font-size:10px}}
.thick .on b{{color:{PINK}}}
"""


def use_tile(u, name, bg):
    light = bg in (INK, PINK, PURPLE)
    return (f'<div class="use" style="background:{bg};{"border:1px solid rgba(20,9,15,.1);" if bg == WHITE else ""}">'
            f'{img(L(f"{MAIN}-uso-{u}"), 92)}<span style="{"color:#fff;" if light else ""}"><b>{name}</b>'
            f'<span style="display:flex;gap:6px;margin-top:6px;align-items:center">'
            f'{img(L(f"{MAIN}-uso-{u}"), 24)}{img(L(f"{MAIN}-uso-{u}-16"), 16)}</span></span></div>')


# ------------------------------------------------------------------ páginas
def p_cover():
    return f"""<section class="page ink" style="display:grid;grid-template-columns:1.1fr 1fr;align-items:center;gap:30px">
<div><div class="kicker">Clozzy 2028 · Logo · v6</div>
<h1>As pontas<br>inteiras.<br>A quebra<br><em>no canto.</em></h1>
<p class="lead" style="margin-top:18px;max-width:470px">O C fecha nas duas extremidades e só o <b>canto superior esquerdo</b> se interrompe: três traços de tamanhos diferentes, com vãos largos e também desiguais — o bastante para o tracejado continuar visível em 16 px. Quatro cores: <b>preto, rosa, branco e roxo</b>.</p></div>
<div style="display:grid;place-items:center">{img(L(MAIN + "-uso-rosa-estrela-branca-no-preto"), 340)}</div>{foot(1)}</section>"""


def p_origin(n):
    cells = [(sv(V.svg100(LG.mark_inner(PINK, PINK))), "Círculo próximo (v1)"),
             (ref("13.43.37"), "Print · anel de story"),
             (b64(V5 / "v5a-gradativo-rosa.svg", "image/svg+xml"), "v5 · ponta gradativa")]
    row = "".join(f'<div class="box" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:280px">'
                  f'<img src="{src}" style="max-width:100%;max-height:200px;object-fit:contain;border-radius:10px">'
                  f'<b class="g" style="margin-top:10px;font-size:12.5px">{t}</b></div>' for src, t in cells if src)
    return f"""<section class="page">
<div class="kicker">02 · De onde vem</div><h2>A quebra sai da ponta e <em>vai para o canto</em></h2>
<p class="lead">Nas rodadas anteriores o tracejado terminava o C — a ponta de cima virava traço ou ponto. Aqui as duas pontas voltam a ser linha cheia e a interrupção se muda para o canto superior esquerdo, onde não disputa com a abertura do C nem com a estrela.</p>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr 40px 1.15fr;gap:12px;align-items:center;margin-top:10px">{row}
<div style="font:800 40px Gabarito;color:{PINK};text-align:center">→</div>
<div class="box" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:280px">{img(L(MAIN + "-rosa"), 200)}<b class="g" style="margin-top:12px;font-size:12.5px">v6 · quebra no canto</b></div></div>
<div class="cols" style="grid-template-columns:repeat(4,1fr);margin-top:14px">
<div class="box"><h4>Pontas inteiras</h4><p>O C começa e termina em linha cheia, com as pontas redondas do desenho original. Nada de traço solto nas extremidades.</p></div>
<div class="box"><h4>Só o canto</h4><p>A interrupção fica entre 190° e 260°, o canto superior esquerdo — longe da abertura (−18°) e da ponta de cima.</p></div>
<div class="box"><h4>Nada se repete</h4><p>Traços de 9, 19 e 13; vãos de 6 a 8. Cada parte tem a sua medida — tracejado irregular, não borda pontilhada.</p></div>
<div class="box"><h4>Estrela original</h4><p>R 20,5 · miolo 0,48 · canto 5, centrada em 50/50. A mesma do Círculo próximo.</p></div>
</div>{foot(n)}</section>"""


def p_anatomy(n):
    w = V.W_MAIN
    guide = (f'<circle cx="50" cy="50" r="{RM}" fill="none" stroke="rgba(20,9,15,.2)" stroke-width=".3" stroke-dasharray="1 1"/>'
             f'<line x1="0" y1="50" x2="100" y2="50" stroke="rgba(20,9,15,.15)" stroke-width=".3" stroke-dasharray="1 1"/>'
             f'<line x1="50" y1="0" x2="50" y2="100" stroke="rgba(20,9,15,.15)" stroke-width=".3" stroke-dasharray="1 1"/>')
    x, y = V.P(V.CORNER, 50)
    guide += f'<line x1="50" y1="50" x2="{x:.1f}" y2="{y:.1f}" stroke="{PURPLE}" stroke-width=".45"/>'
    for a in (-3.4, 327.4):
        x0, y0 = V.P(a, RM - 9)
        x1, y1 = V.P(a, RM + 9)
        guide += f'<line x1="{x0:.1f}" y1="{y0:.1f}" x2="{x1:.1f}" y2="{y1:.1f}" stroke="{PURPLE}" stroke-width=".35" stroke-dasharray="1 .8"/>'
    big = V.svg100(C[MAIN][3](PINK, PINK) + guide)
    total = sum(V.DASHES) + sum(V.GAPS)
    medidas = " · ".join(f"{d:.0f}" for d in V.DASHES)
    vaos = " · ".join(f"{g:.1f}".replace(".0", "") for g in V.GAPS)
    sizes = "".join(f'<div style="text-align:center">{img(L(MAIN + ("-16" if px <= 24 else "-rosa")), px)}'
                    f'<div style="font-size:9.5px;margin-top:7px;color:rgba(20,9,15,.6)">{px} px</div></div>'
                    for px in (120, 72, 44, 28, 20, 16))
    return f"""<section class="page white">
<div class="kicker">03 · Construção</div><h2>Onde fica <em>o canto</em></h2>
<div style="display:grid;grid-template-columns:390px 1fr;gap:32px;align-items:center;margin-top:4px">
{img(sv(big), 390)}
<div class="cols" style="grid-template-columns:1fr 1fr">
<div class="box" style="background:{CREAM}"><h4>O C</h4><p>Raio externo 45, traço 10, pontas redondas. Abertura de 54° centrada em −18°; as pontas visíveis (tracejado roxo) ficam em −3,4° e 327,4° e são <b>sempre linha cheia</b>.</p></div>
<div class="box" style="background:{CREAM}"><h4>Nenhuma parte igual</h4><p>Centrado em {V.CORNER:.0f}° (linha roxa). Traços de <b>{medidas}</b> e vãos de <b>{vaos}</b> — cada medida aparece uma vez só. Ao todo {total:.0f} unidades de arco, {deg(total):.0f}°.</p></div>
<div class="box" style="background:{CREAM}"><h4>Vão nas bordas</h4><p>O vão também entra entre o arco cheio e o primeiro traço, dos dois lados. Sem isso a quebra encosta no arco e some.</p></div>
<div class="box" style="background:{CREAM}"><h4>16–20 px</h4><p>Corte próprio (<code>-16.svg</code>): espessura 12, dois traços ({V.DASHES_S[0]:.0f} e {V.DASHES_S[1]:.0f}) e vãos de {V.GAPS_S[0]:.0f} a {max(V.GAPS_S):.1f}.</p></div>
</div></div>
<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-top:20px;padding-top:16px;border-top:1px solid rgba(20,9,15,.1)">
<div style="max-width:300px"><b class="g" style="font-size:14px">Redução</b>
<p style="font-size:11px;line-height:1.45;color:rgba(20,9,15,.7);margin-top:4px">Até 28 px o desenho de três traços aguenta. De 24 px para baixo entra o corte de dois traços com vão maior — é o vão, não o traço, que some primeiro.</p></div>
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
<div class="kicker">04 · Possibilidades</div><h2>Seis jeitos de <em>quebrar o canto</em></h2>
<div class="vars">{cards}</div>{foot(n)}</section>"""


def p_gap(n):
    cells = ""
    for k, lab, note in [(0.5, "metade", "fecha em 20 px"), (0.75, "−25%", "aperta"), (1.0, "da v6", "escolhido"),
                         (1.45, "+45%", "abre o desenho"), (1.9, "+90%", "vira pontilhado")]:
        gaps = [g * k for g in V.GAPS]
        body = V.c_v6(PINK, V.W_MAIN, V.DASHES, gaps) + V.star(PINK)
        small = V.c_v6(PINK, V.W_SMALL, V.DASHES_S, [g * 1.35 * k for g in V.GAPS_S]) + V.star(PINK)
        on = "on" if k == 1.0 else ""
        faixa = f'{min(gaps):.1f}–{max(gaps):.1f}'.replace(".0", "")
        cells += (f'<div class="{on}">{img(sv(V.svg100(body)), 158)}'
                  f'<div style="display:flex;gap:9px;justify-content:center;margin-top:8px;align-items:center">'
                  f'{img(sv(V.svg100(small)), 28)}{img(sv(V.svg100(small)), 20)}{img(sv(V.svg100(small)), 16)}</div>'
                  f'<b>vãos {lab}</b>{faixa} · {note}</div>')
    uneven = ""
    for titulo, ds, gs, nota in [
        ("Tudo igual", [14.0, 14.0, 14.0], [7.0] * 4, "três traços idênticos: o canto vira um tracejado de régua, mecânico"),
        ("Traços desiguais", V.DASHES, [7.0] * 4, "só os traços variam; os vãos iguais ainda marcam um ritmo de máquina"),
        ("Tudo desigual", V.DASHES, V.GAPS, "traço e vão com medidas próprias — é a v6"),
    ]:
        on = titulo == "Tudo desigual"
        body = V.c_v6(PINK if on else INK, V.W_MAIN, ds, gs) + V.star(PINK if on else INK)
        uneven += (f'<div class="box" style="display:flex;gap:14px;align-items:center;{"outline:2px solid " + PINK if on else ""}">'
                   f'{img(sv(V.svg100(body)), 76)}<div><h4>{titulo}</h4><p>{nota}</p></div></div>')
    return f"""<section class="page">
<div class="kicker">05 · Traços e vãos</div><h2>Nenhuma parte <em>do mesmo tamanho</em></h2>
<p class="lead">Traços iguais em vãos iguais produzem um tracejado de régua. Na v6 cada traço e cada vão têm a sua medida — o canto fica irregular como um story que carregou pela metade, não como uma borda pontilhada.</p>
<div class="cols" style="grid-template-columns:repeat(3,1fr);margin-top:6px">{uneven}</div>
<h3 style="font-size:17px;margin-top:20px">E o vão é o que some primeiro</h3>
<p class="lead" style="margin-top:2px">Quando o logo encolhe, o traço continua lá; quem desaparece é o espaço. Por isso os vãos da v6 são maiores do que o desenho grande pediria — na metade deles o canto fecha em 20 px; com +90% os traços soltam e lê como pontilhado.</p>
<div class="thick" style="margin-top:10px">{cells}</div>{foot(n)}</section>"""


def p_palette(n):
    cores = [("Preto", INK, "#14090F", "Texto, fundo escuro e a versão de um tom só. Preto quente, não puro."),
             ("Rosa", PINK, "#FF0065", "A cor do app. Sobre branco em tamanho pequeno, usar o rosa escuro #E0005A."),
             ("Branco", WHITE, "#FFFFFF", "Símbolo vazado sobre rosa, roxo ou preto. É o que mais aparece no produto."),
             ("Roxo", PURPLE, "#7C48C4", "Acento: convite, Close, estados especiais. Não é um segundo logo.")]
    cards = ""
    for nome, bg, hexv, txt in cores:
        inner = C[MAIN][3](WHITE if bg != WHITE else PINK, WHITE if bg != WHITE else PINK)
        border = "border:1px solid rgba(20,9,15,.12);" if bg == WHITE else ""
        cards += (f'<div class="c"><div class="sw" style="background:{bg};{border}">{img(sv(V.svg100(inner)), 90)}</div>'
                  f'<div class="tx"><h4>{nome}</h4><code>{hexv}</code><p>{txt}</p></div></div>')
    pairs = [("rosa + preto", PINK, INK), ("rosa + branco", PINK, WHITE), ("roxo + rosa", PURPLE, PINK),
             ("preto + rosa", INK, PINK), ("roxo + branco", PURPLE, WHITE), ("preto + branco", INK, WHITE)]
    duo = "".join(f'<div style="display:flex;align-items:center;gap:8px;font-size:10.5px;font-weight:700">'
                  f'<i style="width:22px;height:22px;border-radius:7px;background:{a}"></i>'
                  f'<i style="width:22px;height:22px;border-radius:7px;background:{b};{"outline:1px solid rgba(20,9,15,.15);" if b == WHITE else ""}"></i>{t}</div>'
                  for t, a, b in pairs)
    return f"""<section class="page white">
<div class="kicker">06 · Paleta</div><h2>Quatro cores, <em>nada mais</em></h2>
<p class="lead">Preto, rosa, branco e roxo. O símbolo usa uma cor só ou duas — anel numa, estrela na outra. Sem gradiente e sem terceira cor dentro da marca.</p>
<div class="pal">{cards}</div>
<div style="display:flex;gap:24px;margin-top:16px;flex-wrap:wrap">{duo}</div>
<p class="lead" style="margin-top:12px">Rosa e roxo juntos só sobre branco ou preto, nunca um sobre o outro: rosa em fundo roxo some. Sobre rosa, nada de preto — só branco. E sobre preto o símbolo é rosa com a estrela branca.</p>{foot(n)}</section>"""


def p_uses(n, idx, title, sub, white=False):
    tiles = "".join(use_tile(u, nm, bg) for (u, nm, bg, _rc, _sc, _w) in [V.USES[i] for i in idx])
    return f"""<section class="page{" white" if white else ""}">
<div class="kicker">{n:02d} · Usos em cor</div><h2>{title}</h2><p class="lead">{sub}</p>
<div class="uses">{tiles}</div>{foot(n)}</section>"""


def p_apps_lockups(n):
    apps = "".join(f'<div style="text-align:center">{img(L(f"{MAIN}-app-{b}"), 102)}<div style="font-size:10px;margin-top:6px">{t}</div></div>'
                   for b, t in [("rosa", "tile rosa"), ("roxo", "tile roxo"), ("preto", "tile preto"), ("branco", "tile branco")])
    lks = [("rosa", WHITE), ("branco-no-preto", INK), ("branco-no-rosa", PINK),
           ("branco-no-roxo", PURPLE), ("preto", WHITE), ("rosa-estrela-branca-no-preto", INK)]
    lk = "".join(f'<div style="background:{bg};{"border:1px solid rgba(20,9,15,.1);" if bg == WHITE else ""}">'
                 f'{img(L(f"{MAIN}-uso-{u}-lockup"), h=48)}</div>' for u, bg in lks)
    return f"""<section class="page">
<div class="kicker">{n:02d} · Ícone e lockup</div><h2>Tile e <em>assinatura</em></h2>
<p class="lead">O ícone de app usa o símbolo numa cor só sobre um dos quatro fundos; o lockup leva “clozzy” em Gabarito 800, altura do “l” em 52% do símbolo. No tile o canto quebrado fica na diagonal livre, longe do raio do quadrado.</p>
<div style="display:flex;gap:26px;justify-content:center;margin-top:12px">{apps}</div>
<div class="lk">{lk}</div>{foot(n)}</section>"""


def p_utilizacoes(n):
    av = b64(PHD / "p6.jpg", "image/jpeg")
    cards = [
        ("Favicon e aba", f'<div class="st" style="background:#F3EFEC;flex-direction:column;align-items:stretch;gap:0">'
                          f'<div class="tab">{img(L(MAIN + "-uso-rosa-deep-16"), 14)}<span>Clozzy — seu close</span></div>'
                          f'<div class="tab u" style="border-radius:0 0 8px 8px;background:#fff">clozzy.com/marina</div></div>',
         "16 px, corte de dois traços. É o teste mais duro do vão."),
        ("Avatar de rede", f'<div class="st" style="background:{INK};justify-content:center">'
                           f'<div style="width:62px;height:62px;border-radius:50%;background:{PINK};display:grid;place-items:center">'
                           f'{img(L(MAIN + "-uso-branco-no-rosa"), 42)}</div>'
                           f'<div class="mail" style="color:#fff"><b>@clozzy</b>'
                           f'<span style="color:rgba(255,255,255,.65)">perfil oficial</span></div></div>',
         "Círculo cheio rosa com o símbolo branco dentro, nunca o símbolo recortado pela borda."),
        ("Header do site", f'<div class="st" style="background:#fff;border:1px solid rgba(20,9,15,.1);justify-content:space-between">'
                           f'{img(L(MAIN + "-uso-rosa-deep-lockup"), h=24)}'
                           f'<span style="display:flex;gap:9px;align-items:center;font-size:8.5px;font-weight:700">Explorar'
                           f'<span style="background:{PINK};color:#fff;padding:4px 9px;border-radius:99px">Entrar</span></span></div>',
         "Lockup em rosa escuro: sobre branco, o #FF0065 vibra demais em texto pequeno."),
        ("Assinatura de e-mail", f'<div class="st" style="background:#fff;border:1px solid rgba(20,9,15,.1)">'
                                 f'{img(L(MAIN + "-uso-preto"), 48)}<div class="mail"><b>Marina Costa</b>'
                                 f'<span style="color:rgba(20,9,15,.6)">Parcerias · clozzy.com</span></div></div>',
         "Uma cor só, preto. O canto quebrado some num e-mail impresso em cinza — aceitável."),
        ("Story e post", f'<div class="st" style="background:{PURPLE};justify-content:center">'
                         f'<img src="{av}" style="width:54px;height:54px;border-radius:50%;object-fit:cover;outline:2px solid #fff">'
                         f'{img(L(MAIN + "-uso-branco-no-roxo"), 50)}</div>',
         "Em roxo, símbolo e palavra vão brancos. O canto quebrado rima com o anel do story."),
        ("Botão e selo", f'<div class="st" style="background:#fff;border:1px solid rgba(20,9,15,.1);flex-direction:column;align-items:flex-start;justify-content:center;gap:9px">'
                         f'<span style="background:{PINK};color:#fff;padding:6px 12px;border-radius:99px;font-size:9.5px;font-weight:800;display:flex;gap:6px;align-items:center">'
                         f'{img(L(MAIN + "-uso-branco-no-rosa"), 14)} Assinar close</span>'
                         f'<span style="background:{INK};color:#fff;padding:5px 10px;border-radius:7px;font-size:8.5px;display:flex;gap:5px;align-items:center">'
                         f'{img(L(MAIN + "-uso-rosa-estrela-branca-no-preto"), 12)} verificado</span></div>',
         "Dentro de botão, o símbolo entra em 14 px com o corte pequeno."),
        ("Marca d’água", f'<div class="st" style="background:#2b1d26;justify-content:flex-end;align-items:flex-end;position:relative;overflow:hidden">'
                         f'<img src="{av}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.55">'
                         f'<span style="position:relative;opacity:.85">{img(L(MAIN + "-uso-branco-no-preto"), 34)}</span></div>',
         "Branco a 85% no canto inferior do conteúdo, sem caixa nem sombra."),
        ("Impresso e bordado", f'<div class="st" style="background:{CREAM};gap:12px">'
                               f'{img(L(MAIN + "-preto"), 50)}{img(L(MAIN + "-uso-rosa-deep"), 50)}</div>',
         "Uma cor, espessura 10 cheia: em bordado o menor vão (6) é o mínimo para não fechar com a linha."),
    ]
    body = "".join(f'<div class="k"><b>{t}</b>{st}<p>{d}</p></div>' for t, st, d in cards)
    return f"""<section class="page white">
<div class="kicker">{n:02d} · Utilizações</div><h2>Onde a marca <em>aparece</em></h2>
<p class="lead">Oito lugares reais, do favicon de 16 px ao bordado. Em todos, a regra é a mesma: o canto quebrado nunca encosta na borda de um recorte e o vão nunca encolhe para caber.</p>
<div class="apl">{body}</div>{foot(n)}</section>"""


def p_screen(n):
    ph = b64(PHD / "p3.jpg", "image/jpeg")
    apps = "".join('<span><i></i>app</span>' for _ in range(5))
    frames = ""
    labels = ["0 ms", "150", "300", "450", "600 ms"]
    for k in range(5):
        if k == 0:
            body = V.star(WHITE)
        elif k == 4:
            body = C[MAIN][3](PINK, PINK)
        else:
            body = V.line(PINK, V.W_MAIN, V.C_LOW + 7.2, 60 + 100 * k) + V.star(PINK)
        frames += (f'<div>{img(sv(V.svg100(body)), 60)}'
                   f'<div style="margin-top:4px;color:rgba(255,255,255,.7)">{labels[k]}</div></div>')
    return f"""<section class="page">
<div class="kicker">{n:02d} · Tela e movimento</div><h2>No <em>app</em> e em <em>movimento</em></h2>
<div style="display:grid;grid-template-columns:250px 1fr;gap:26px;margin-top:10px">
<div class="phone" style="height:420px"><div class="scr" style="background:#3a2a36">
<img src="{ph}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.5">
<div class="spring" style="position:relative">{apps}<span>{img(L(MAIN + "-app-rosa"), 46)}Clozzy</span>{apps}</div></div></div>
<div style="display:flex;flex-direction:column;gap:13px">
<div class="box" style="display:flex;justify-content:space-between;align-items:center">{img(L(MAIN + "-uso-rosa-deep-lockup"), h=32)}
<span style="display:flex;gap:16px;font-size:12px;font-weight:700;align-items:center">Explorar <span>Entrar</span>
<span style="background:{PINK};color:#fff;padding:7px 14px;border-radius:99px">Sou criador</span></span></div>
<div class="box" style="background:{INK};display:flex;justify-content:space-between;align-items:center">{img(L(MAIN + "-uso-rosa-estrela-branca-no-preto-lockup"), h=32)}
<span style="display:flex;gap:8px;align-items:center;background:rgba(255,255,255,.08);color:#fff;padding:6px 10px;border-radius:8px;font-size:11px">{img(L(MAIN + "-uso-rosa-estrela-branca-no-preto-16"), 16)}clozzy.com</span></div>
<div class="box" style="background:{INK};color:#fff"><h4>Animação de assinatura (600 ms)</h4><div class="frames">{frames}
<p style="margin-left:10px;font-size:10.5px;opacity:.8">A estrela acende e o C se desenha no sentido horário; ao cruzar o canto superior esquerdo o traço pisca nos vãos em vez de parar. Com <code>prefers-reduced-motion</code>, só o quadro final.</p></div></div>
</div></div>{foot(n)}</section>"""


def p_next(n):
    picks = ["v6a-canto", "v6b-dois", "v6d-vao-largo"]
    cards = "".join(f'<div style="text-align:center">{img(L(s + "-uso-rosa-estrela-branca-no-preto"), 126)}'
                    f'<div style="font:800 12px Gabarito;margin-top:6px">{C[s][1]}</div></div>' for s in picks)
    tiles = "".join(f'<div style="text-align:center">{img(L(MAIN + "-app-" + b), 76)}</div>' for b in ("rosa", "roxo", "branco"))
    return f"""<section class="page ink" style="display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:30px">
<div><div class="kicker">{n:02d} · Decisão</div><h2 style="font-size:40px">Recomendo a <em>1 · quebra no canto</em></h2>
<p class="lead" style="margin-top:10px">Pontas inteiras e três traços desiguais (9 · 19 · 13) com vãos de 6 a 8 no canto superior esquerdo. É a versão que continua lendo como círculo fechado de longe e mostra o tracejado em 16 px.</p>
<ul class="lead" style="margin:14px 0 0 18px">
<li>Mais discreta: <b>2 · dois traços</b>. Mais segura no pequeno: <b>4 · vão largo</b>.</li>
<li>Para fechar: a forma (1–6) e a dupla de cores (págs. 06–08). Sugestão: rosa com estrela branca no preto como principal, branco sobre rosa e roxo, preto para uma cor só.</li>
<li>Depois: ajuste óptico dos vãos, kit de exportação e manual.</li></ul></div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;justify-items:center">{cards}{tiles}</div>{foot(n)}</section>"""


def build():
    light = [0, 1, 2, 3, 4, 5, 6, 7]
    dark = [8, 9, 10, 11]
    pages = [p_cover(), p_origin(2), p_anatomy(3), p_variants(4), p_gap(5), p_palette(6),
             p_uses(7, light, "Sobre <em>branco</em>",
                    "Uma cor só (rosa, preto, roxo) e as duplas, com o anel numa cor e a estrela na outra. O rosa escuro #E0005A é o rosa dos tamanhos pequenos sobre branco.", white=True),
             p_uses(8, dark, "Sobre <em>rosa, roxo e preto</em>",
                    "Sobre preto, o anel é rosa e a estrela branca; branco de um tom só fica como alternativa. Sobre rosa e sobre roxo, só branco — preto no rosa fecha a forma e rosa no roxo some."),
             p_apps_lockups(9), p_utilizacoes(10), p_screen(11), p_next(12)]
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy — Logo v6</title>'
            f'<style>{PB.css()}{EXTRA}</style></head><body>{"".join(pages)}</body></html>')
    OUT_HTML.write_text(html)
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer",
                    f"--print-to-pdf={OUT_PDF}", OUT_HTML.as_uri()], check=True, capture_output=True)
    return len(pages)


if __name__ == "__main__":
    print("pages", build())

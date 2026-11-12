#!/usr/bin/env python3
"""Clozzy — documento “C com tracejado no canto” (rodada 9), com utilizações.
Rodar: python3 _canto.py && python3 _build.py → c-tracejado-canto-clozzy.{html,pdf}  (nome e pasta próprios)"""
import base64, importlib.util, math, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
MARCA = HERE.parent
sys.path.insert(0, str(HERE))
import _canto as K  # noqa: E402

sys.path.insert(0, str(MARCA / "referencias-apps"))
_spec = importlib.util.spec_from_file_location("ra_build_k", MARCA / "referencias-apps" / "_build.py")
RA = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(RA)

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT_HTML = HERE / "c-tracejado-canto-clozzy.html"
OUT_PDF = HERE / "c-tracejado-canto-clozzy.pdf"
REFS = MARCA / "refs"
PINK, DEEP, PURPLE, INK, CREAM, WHITE = K.PINK, K.DEEP, K.PURPLE, K.INK, K.CREAM, K.WHITE
MAIN = "k1-dois-tracos"
C = {c[0]: c for c in K.CONCEPTS}
FN = C[MAIN][3]


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(Path(p).read_bytes()).decode()


def sv(s):
    return "data:image/svg+xml;base64," + base64.b64encode(s.encode()).decode()


def L(name):
    return b64(HERE / "svg" / f"{name}.svg", "image/svg+xml")


def img(src, w=None, h=None, style=""):
    sz = (f"width:{w}px;" if w else "") + (f"height:{h}px;" if h else "")
    return f'<img src="{src}" style="{sz}display:block;{style}">'


def sym(rc=DEEP, sc=None, small=False, fn=None):
    return sv(K.svg100((fn or FN)(rc, sc, small)))


def U(u, kind=""):
    return L(f"{MAIN}-uso-{u}{kind}")


def _wordlogo(kind="x", h=22, dark=False):
    return img(U("rosa-no-preto" if dark else "deep", "-lockup"), h=h)


def _mark(kind="x", size=28, dark=False):
    return img(U("rosa-no-preto" if dark else "deep"), size, size)


RA.wordlogo, RA.mark = _wordlogo, _mark
PH = RA.PH


def foot(n):
    return f'<div class="foot"><span>Clozzy · C com tracejado no canto · rodada 9 · nov 2026</span><span>{n:02d}</span></div>'


EXTRA = f"""
h1 em,h2 em{{font-style:normal;color:{DEEP}}} .ink h1 em,.ink h2 em{{color:{PINK}}} .purple h2 em{{color:{WHITE};text-decoration:underline;text-decoration-color:{PINK};text-decoration-thickness:4px}}
.kicker{{color:{DEEP}}} .purple .kicker{{color:{WHITE}}}
.box{{background:{WHITE};border-radius:18px;padding:14px 16px}} .white .box{{background:{CREAM}}} .ink .box{{background:rgba(255,255,255,.06)}}
.purple .box{{background:rgba(255,255,255,.1)}}
.box h4{{font:800 14px Gabarito;margin-bottom:5px}} .box p,.box li{{font-size:11px;line-height:1.5}} .box li{{margin-left:15px}}
.cols{{display:grid;gap:14px}}
.prints{{display:grid;grid-template-columns:repeat(10,1fr);gap:8px;margin-top:10px}}
.prints div{{height:86px;border-radius:9px;background:{WHITE};display:grid;place-items:center;overflow:hidden;border:1px solid rgba(20,9,15,.08);position:relative}}
.prints img{{max-width:100%;max-height:100%;object-fit:contain}} .prints div.on{{outline:2.5px solid {DEEP}}}
.prints span{{position:absolute;left:4px;top:3px;font:800 8.5px Figtree;color:{DEEP}}}
.vars{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:8px}}
.vr{{background:{WHITE};border-radius:20px;padding:12px 14px;display:flex;flex-direction:column;align-items:center;text-align:center}}
.vr h3{{font-size:16px;font-weight:800;margin-top:4px}} .vr p{{font-size:10px;line-height:1.38;color:rgba(20,9,15,.7);margin-top:3px}}
.vr .row{{display:flex;gap:8px;align-items:center;margin-top:7px}} .vr.on{{outline:3px solid {DEEP}}}
.vr .lbl{{font:800 10px Figtree;letter-spacing:.12em;color:{DEEP}}}
.sizes{{display:grid;grid-template-columns:110px repeat(5,1fr);align-items:center;margin-top:10px}}
.sizes>div{{display:flex;align-items:center;justify-content:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(20,9,15,.08)}}
.sizes .h{{font-weight:800;font-size:10px;color:rgba(20,9,15,.6)}} .sizes .n{{justify-content:flex-start;font:800 12px Gabarito}} .sizes .dk{{background:{INK}}}
.uses{{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:10px}}
.use{{border-radius:16px;height:112px;display:flex;align-items:center;gap:12px;padding:10px 14px}}
.use span{{font-size:10px;line-height:1.3}} .use b{{display:block;font:800 12px Gabarito}}
.lkx{{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:10px}} .lkx div{{border-radius:14px;height:86px;display:grid;place-items:center}}
.mock{{border-radius:20px;overflow:hidden;position:relative}}
.tag{{font:800 9.5px Figtree;letter-spacing:.12em;text-transform:uppercase}}
.cap2{{font-size:10px;margin-top:6px;line-height:1.35}} .cap2 b{{font:800 12px Gabarito;display:block}}
"""


def use_tile(u, name, bg):
    light = bg in (INK, PINK, PURPLE)
    return (f'<div class="use" style="background:{bg};{"border:1px solid rgba(20,9,15,.08);" if bg == WHITE else ""}">'
            f'{img(U(u), 84)}<span style="{"color:#fff;" if light else ""}"><b>{name}</b>'
            f'<span style="display:flex;gap:6px;margin-top:6px;align-items:center">{img(U(u), 24)}{img(U(u, "-16"), 16)}</span></span></div>')


# ------------------------------------------------------------------ páginas
def p_cover():
    return f"""<section class="page ink" style="display:grid;grid-template-columns:1.1fr 1fr;align-items:center;gap:30px">
<div>{img(U("rosa-no-preto", "-lockup"), h=40)}
<div class="kicker" style="margin-top:70px;color:{PINK}">Clozzy 2028 · Logo · Rodada 9</div>
<h1>Pontas inteiras,<br><em>canto tracejado.</em></h1>
<p class="lead" style="margin-top:16px;max-width:470px">O C do Círculo próximo com a estrela original e <b>as duas pontas inteiras</b>. O story aparece num tracejado discreto no <b>canto superior esquerdo</b>, com vãos um pouco maiores para continuar visível em tamanho pequeno. Seis variações, muitas combinações de cor (inclusive <b>círculo branco com estrela rosa no preto</b>) e utilizações, com <b>roxo e rosa</b> juntos.</p></div>
<div style="display:grid;place-items:center">{img(U("rosa-no-preto"), 340)}</div>{foot(1)}</section>"""


def p_refs(n):
    files = sorted(REFS.glob("*.png"))
    key = {"13.25.20": "C", "13.25.58": "story", "13.26.05": "story", "14.03.10": "fino", "14.05.50": "fino",
           "14.14.29": "lockups", "13.26.36": "rosa", "13.26.40": "deep", "13.23.34": "v1"}
    cells = ""
    for i, p in enumerate(files):
        k = next((v for kk, v in key.items() if kk in p.name), "")
        cells += f'<div class="{"on" if k else ""}"><span>{i + 1}{" · " + k if k else ""}</span><img src="{b64(p, "image/png")}"></div>'
    return f"""<section class="page cream"><div class="kicker">{n:02d} · Referências</div><h2>O que veio de <em>marca/refs</em></h2>
<p class="lead">Os {len(files)} prints que você marcou. Em destaque, os que guiam esta rodada.</p>
<div class="prints">{cells}</div>
<div class="cols" style="grid-template-columns:repeat(4,1fr);margin-top:14px">
<div class="box"><h4>C · Círculo próximo</h4><p>Forma de C, abertura em −18° e a estrela original, sem mudança.</p></div>
<div class="box"><h4>Story tracejado</h4><p>Do ícone “novo story” vem o tracejado. Aqui ele vai para o canto, e as pontas ficam inteiras.</p></div>
<div class="box"><h4>Traço fino</h4><p>Os prints 14.03 e 14.05 (traço 8) mostram o C fino. Aqui o traço é 9, com corte próprio de 13 para tamanho pequeno.</p></div>
<div class="box"><h4>Lockups em 6 fundos</h4><p>O print 14.14 (branco, preto, rosa, roxo) vira a página de lockups e as utilizações.</p></div>
</div>{foot(n)}</section>"""


def p_idea(n):
    r8 = MARCA / "logo-tracos-sutis" / "svg" / "s1-vao-5-color.svg"
    old = img(b64(r8, "image/svg+xml"), 200) if r8.exists() else ""
    return f"""<section class="page white"><div class="kicker">{n:02d} · A ideia</div><h2>O story sai da ponta e vai <em>para o canto</em></h2>
<div style="display:grid;grid-template-columns:1fr 50px 1.3fr;align-items:center;gap:12px;margin-top:10px">
<div class="box" style="display:flex;flex-direction:column;align-items:center;height:290px;justify-content:center">{old}<b style="font:800 13px Gabarito;margin-top:10px">R8 · tracejado na ponta</b></div>
<div style="font:800 40px Gabarito;color:{DEEP};text-align:center">→</div>
<div class="box" style="display:flex;flex-direction:column;align-items:center;height:290px;justify-content:center">{img(U("deep"), 240)}<b style="font:800 13px Gabarito;margin-top:10px">R9 · pontas inteiras, canto tracejado</b></div></div>
<div class="cols" style="grid-template-columns:repeat(4,1fr);margin-top:14px">
<div class="box"><h4>Pontas inteiras</h4><p>As duas pontas do C são linha cheia com terminal redondo. A abertura fica limpa e o C fica forte.</p></div>
<div class="box"><h4>Canto superior esquerdo</h4><p>O tracejado fica na “concavidade” de cima, longe das pontas, por volta de 228° (entre o lado esquerdo e o topo).</p></div>
<div class="box"><h4>Discreto</h4><p>Só dois traços curtos. De longe é um C; de perto, um story.</p></div>
<div class="box"><h4>Vãos maiores</h4><p>Vãos de 10° no master e de 20° no corte pequeno, para os cortes continuarem visíveis em 16–24 px.</p></div>
</div>{foot(n)}</section>"""


def p_construction(n):
    w = K.W_MAIN
    rm = K.OUTER - w / 2
    g = (f'<circle cx="50" cy="50" r="{rm}" fill="none" stroke="rgba(20,9,15,.22)" stroke-width=".3" stroke-dasharray="1 1"/>'
         f'<circle cx="50" cy="50" r="20.5" fill="none" stroke="rgba(20,9,15,.22)" stroke-width=".3" stroke-dasharray="1 1"/>'
         f'<line x1="0" y1="50" x2="100" y2="50" stroke="rgba(20,9,15,.18)" stroke-width=".3" stroke-dasharray="1 1"/>'
         f'<line x1="50" y1="0" x2="50" y2="100" stroke="rgba(20,9,15,.18)" stroke-width=".3" stroke-dasharray="1 1"/>')
    for ang, col in ((-18, PURPLE), (228, PURPLE)):
        x, y = K.P(ang, 49)
        g += f'<line x1="50" y1="50" x2="{x:.1f}" y2="{y:.1f}" stroke="{col}" stroke-width=".4" stroke-dasharray="{"" if ang < 0 else "1.2 .8"}"/>'
    spans = K.c_with([18, 18], 228, 10, w)
    txt = " · ".join(f"{a:.0f}°–{b:.0f}°" for a, b in spans)
    return f"""<section class="page white"><div class="kicker">{n:02d} · Construção</div><h2>Grid 100, <em>dois cortes no canto</em></h2>
<div style="display:grid;grid-template-columns:420px 1fr;gap:36px;align-items:center;margin-top:6px">
{img(sv(K.svg100(FN() + g)), 420)}
<div class="cols" style="grid-template-columns:1fr 1fr">
<div class="box"><h4>C</h4><p>Raio externo 45, traço 9 (raio médio 40,5), pontas redondas e inteiras. Abertura de 54° centrada em −18° (linha roxa cheia).</p></div>
<div class="box"><h4>Canto</h4><p>Tracejado centrado em 228° (linha roxa tracejada): dois traços de 18° e três vãos de 10°.</p></div>
<div class="box"><h4>Trechos visíveis</h4><p>{txt}.</p></div>
<div class="box"><h4>Corte pequeno</h4><p>Até 24 px: traço 13, um traço de 26° e vãos de 20° (<code>-16.svg</code>). Assim os dois cortes ainda aparecem em 16 px.</p></div>
<div class="box" style="grid-column:1/3"><h4>Estrela</h4><p>A original do Círculo próximo: centro 50/50, R 20,5, miolo 0,48, canto 5.</p></div>
</div></div>{foot(n)}</section>"""


def p_variants(n):
    cards = ""
    for k, (slug, name, idea, fn) in enumerate(K.CONCEPTS):
        on = " on" if slug == MAIN else ""
        cards += (f'<div class="vr{on}"><span class="lbl">{k + 1}{" · RECOMENDADA" if on else ""}</span>{img(L(slug + "-color"), 116)}<h3>{name}</h3><p>{idea}</p>'
                  f'<div class="row"><span style="background:{INK};padding:5px;border-radius:9px">{img(L(slug + "-dark"), 30)}</span>'
                  f'{img(L(slug + "-app-rosa"), 36)}{img(L(slug + "-app-roxo"), 36)}{img(L(slug + "-app-roxo-rosa"), 36)}'
                  f'{img(L(slug + "-color"), 28)}{img(L(slug + "-16"), 20)}{img(L(slug + "-16"), 16)}</div></div>')
    return f"""<section class="page cream"><div class="kicker">{n:02d} · Variações</div><h2>Seis jeitos de <em>tracejar o canto</em></h2>
<div class="vars">{cards}</div>{foot(n)}</section>"""


def p_small(n):
    head = '<div class="h"></div>' + "".join(f'<div class="h">{s}</div>' for s in ("64 px", "32 px", "24 px", "20 px", "16 px"))
    rows = ""
    for gap, sgap, lab in ((6, 12, "vão 6 / 12"), (10, 20, "vão 10 / 20 · escolhido"), (14, 26, "vão 14 / 26")):
        fn = K.make([18, 18], gap, [26], sgap)
        rows += f'<div class="n">{lab}</div>'
        for px in (64, 32, 24, 20, 16):
            rows += f'<div>{img(sv(K.svg100(fn(DEEP, small=px <= 24))), px)}</div>'
        rows += '<div class="n" style="color:#fff;background:#14090F;padding-left:6px">no escuro</div>'
        for px in (64, 32, 24, 20, 16):
            rows += f'<div class="dk">{img(sv(K.svg100(fn(PINK, small=px <= 24))), px)}</div>'
    return f"""<section class="page white"><div class="kicker">{n:02d} · Pequeno</div><h2>Vãos maiores para <em>ver em 16 px</em></h2>
<p class="lead">O mesmo desenho com três tamanhos de vão. Até 24 px entra o corte pequeno (traço mais grosso, um traço só e vão dobrado). Com o vão escolhido, os dois cortes do canto ainda aparecem no favicon.</p>
<div class="sizes">{head}{rows}</div>{foot(n)}</section>"""


def p_thickness(n):
    cells = ""
    for w, note in ((8, "como os prints 14.03/14.05"), (9, "escolhido"), (10, "rodadas 5–8"), (12, "mais pesado")):
        fn = K.make([18, 18], 10, [26], 20, w=w)
        on = "color:" + DEEP if w == 9 else ""
        cells += (f'<div style="text-align:center">{img(sv(K.svg100(fn())), 180, style="margin:0 auto")}<div style="display:flex;gap:8px;justify-content:center;margin-top:8px;align-items:center">'
                  f'{img(sv(K.svg100(fn())), 32)}{img(sv(K.svg100(fn(small=True))), 20)}</div><b style="font:800 15px Gabarito;display:block;margin-top:6px;{on}">traço {w}</b><small style="font-size:10px">{note}</small></div>')
    return f"""<section class="page cream"><div class="kicker">{n:02d} · Espessura</div><h2>Fino, <em>mas não frágil</em></h2>
<p class="lead">Você marcou os prints com traço 8. Com 9 o C fica tão leve quanto e a estrela não pesa demais. Abaixo de 24 px entra o corte de 13.</p>
<div style="display:flex;justify-content:space-around;margin-top:24px">{cells}</div>{foot(n)}</section>"""


def p_colors(n):
    a = "".join(use_tile(u, nm, bg) for (u, nm, bg, *_r) in K.USES[:8])
    b = "".join(use_tile(u, nm, bg) for (u, nm, bg, *_r) in K.USES[8:])
    return f"""<section class="page white"><div class="kicker">{n:02d} · Cores</div><h2>Rosa, roxo, <em>preto e branco</em></h2>
<div class="uses">{a}{b}</div>
<p class="lead" style="margin-top:10px">Principal: Pink Deep no claro e rosa no preto. Rosa no roxo e roxo no rosa só com o símbolo grande (≥ 64 px), nunca em texto.</p>{foot(n)}</section>"""


def p_lockups(n):
    lks = [("deep", WHITE), ("rosa-no-preto", INK), ("branco-no-rosa", PINK), ("branco-no-roxo", PURPLE), ("rosa-estrela-roxa", CREAM), ("branco-no-preto", INK)]
    lk = "".join(f'<div style="background:{bg};{"border:1px solid rgba(20,9,15,.08);" if bg == WHITE else ""}">{img(U(u, "-lockup"), h=44)}</div>' for u, bg in lks)
    vt = "".join(f'<div style="background:{bg};border-radius:14px;height:170px;display:grid;place-items:center;{"border:1px solid rgba(20,9,15,.08);" if bg == WHITE else ""}">{img(U(u, "-vertical"), h=130)}</div>' for u, bg in lks[:4])
    apps = "".join(f'<div style="text-align:center">{img(L(MAIN + "-app-" + b), 78)}<div style="font-size:9.5px;margin-top:4px">{t}</div></div>'
                   for b, t in (("rosa", "rosa"), ("roxo", "roxo"), ("preto", "preto"), ("branco", "branco"), ("roxo-rosa", "roxo + rosa"), ("rosa-roxo", "rosa + roxo")))
    return f"""<section class="page cream"><div class="kicker">{n:02d} · Lockups e ícones</div><h2>Em <em>seis fundos</em></h2>
<div class="lkx">{lk}</div>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:10px">{vt}</div>
<div style="display:flex;gap:22px;justify-content:center;margin-top:12px">{apps}</div>{foot(n)}</section>"""


def p_roxo_rosa(n):
    def card(bg, inner, cap, h=230, extra=""):
        return f'<div><div class="mock" style="background:{bg};height:{h}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;{extra}">{inner}</div><div class="cap2" style="color:#fff">{cap}</div></div>'
    story = (f'{img(U("rosa-no-roxo"), 110)}<div style="font:800 24px/1.05 Gabarito;color:#fff;text-align:center">Entrou<br>no Close ✦</div>'
             f'<span style="background:{PINK};color:{INK};font:800 11px Figtree;padding:7px 14px;border-radius:99px">clozzy.com/nina</span>')
    poster = (f'{img(U("roxo-no-rosa"), 110)}<div style="font:800 26px/1 Gabarito;color:#fff;text-align:center">Seu close,<br>seu preço.</div>')
    split = (f'<div style="position:absolute;inset:0;background:linear-gradient(90deg,{PURPLE} 50%,{PINK} 50%)"></div>'
             f'<div style="position:relative">{img(U("branco-no-rosa"), 120)}</div>')
    hl = "".join(f'<div style="text-align:center"><div style="width:62px;height:62px;border-radius:50%;background:{bg};display:grid;place-items:center;box-shadow:0 0 0 3px {CREAM},0 0 0 5px {ring}">{img(U(u), 40)}</div><div style="font-size:9.5px;margin-top:5px;color:#fff">{t}</div></div>'
                 for bg, u, ring, t in ((PURPLE, "rosa-no-roxo", PINK, "Close"), (PINK, "roxo-no-rosa", PURPLE, "Drops"), (PURPLE, "branco-estrela-rosa-no-roxo", PINK, "Bastidor"), (PINK, "branco-no-rosa", PURPLE, "Chat")))
    return f"""<section class="page purple"><div class="kicker">{n:02d} · Roxo com rosa</div><h2>Quando os dois <em>aparecem juntos</em></h2>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:12px">
{card(PURPLE, story, "<b>Story de divulgação</b>Fundo roxo, símbolo rosa grande, texto sempre branco.", extra="border:2px solid rgba(255,255,255,.25)")}
{card(PINK, poster, "<b>Pôster / capa</b>Fundo rosa, símbolo roxo grande e título branco.")}
{card(PURPLE, split, "<b>Capa dividida</b>Metade roxo, metade rosa (sem gradiente), símbolo branco no meio.", extra="position:relative")}
<div><div class="mock" style="background:rgba(255,255,255,.08);height:230px;display:grid;grid-template-columns:1fr 1fr;place-items:center;padding:14px">{img(L(MAIN + "-app-roxo-rosa"), 88)}{img(L(MAIN + "-app-rosa-roxo"), 88)}{img(U("roxo-estrela-rosa"), 80)}{img(U("rosa-estrela-roxa"), 80)}</div><div class="cap2" style="color:#fff"><b>Ícones e símbolo bicolor</b>Para campanha e merch. No app, o padrão é o tile rosa com o símbolo branco.</div></div>
</div>
<div class="box" style="margin-top:14px;display:flex;gap:22px;align-items:center"><div style="display:flex;gap:16px">{hl}</div>
<p style="color:#fff"><b>Destaques do Instagram</b>, alternando roxo e rosa. O anel de cada um usa a outra cor.<br><b>Regra:</b> rosa e roxo só se encostam em formas grandes. Texto e ícones pequenos vão em branco ou ink.</p></div>
{foot(n)}</section>"""


def p_featured(n):
    u = "branco-estrela-rosa-no-preto"
    apps = "".join(f'<div style="text-align:center">{img(L(MAIN + "-app-" + b), 92)}<div style="font-size:9.5px;margin-top:5px;color:#fff;opacity:.75">{t}</div></div>'
                   for b, t in (("preto-branco-rosa", "tile preto"), ("preto-branco-rosa-16", "corte 16 px")))
    small = "".join(img(U(u, "-16" if px <= 24 else ""), px) for px in (48, 32, 24, 20, 16))
    tee_ = tee(INK, img(U(u), 32))
    return f"""<section class="page ink"><div class="kicker" style="color:{PINK}">{n:02d} · Destaque</div><h2>Círculo branco, <em>estrela rosa</em>, fundo preto</h2>
<div style="display:grid;grid-template-columns:380px 1fr;gap:30px;align-items:center;margin-top:8px">
<div style="display:grid;place-items:center">{img(U(u), 340)}</div>
<div class="cols" style="grid-template-columns:1fr 1fr">
<div class="box" style="display:grid;place-items:center;height:120px">{img(U(u, "-lockup"), h=52)}</div>
<div class="box" style="display:flex;gap:16px;justify-content:center;align-items:center;height:120px">{apps}</div>
<div class="box" style="display:flex;gap:14px;align-items:flex-end;justify-content:center">{small}</div>
<div class="box" style="display:flex;gap:14px;align-items:center"><div style="width:78px;height:78px;border-radius:50%;background:{INK};border:1px solid rgba(255,255,255,.2);display:grid;place-items:center">{img(U(u), 56)}</div><p style="color:#fff">Avatar das redes em perfis escuros, e splash do app.</p></div>
<div class="box" style="display:grid;place-items:center">{img(U(u, "-vertical"), h=120)}</div>
<div class="box" style="display:grid;place-items:center">{tee_}</div>
</div></div>
<p class="lead" style="margin-top:10px">A estrela rosa é o único ponto de cor, e o C branco some no fundo e deixa só o story aparecer. É a versão mais “noite” da marca: vídeo, live, merch preto.</p>{foot(n)}</section>"""


def p_more(n):
    extra = K.USES[16:]
    tiles = "".join(use_tile(u, nm, bg) for (u, nm, bg, *_r) in extra)
    apps = "".join(f'<div style="text-align:center">{img(L(MAIN + "-app-" + b), 70)}<div style="font-size:9px;margin-top:4px">{t}</div></div>'
                   for b, t in (("preto-branco-rosa", "branco + rosa · preto"), ("preto-branco-roxo", "branco + roxo · preto"), ("roxo-branco-rosa", "branco + rosa · roxo"),
                                ("rosa-branco-preto", "branco + preto · rosa"), ("cream-rosa-roxo", "rosa + roxo · cream"), ("preto-rosa-branco", "rosa + branco · preto"),
                                ("roxo-rosa", "rosa · roxo"), ("rosa-roxo", "roxo · rosa")))
    return f"""<section class="page white"><div class="kicker">{n:02d} · Mais variações</div><h2>Anel numa cor, <em>estrela em outra</em></h2>
<div class="uses">{tiles}</div>
<div style="display:flex;gap:16px;justify-content:center;margin-top:14px">{apps}</div>
<p class="lead" style="margin-top:10px">Regra: a estrela pode ter uma cor diferente do anel quando o símbolo aparece grande. Em 16–24 px, uma cor só. Roxo no preto e estrela roxa no preto têm contraste 3,3:1, que serve para símbolo grande e nunca para texto.</p>{foot(n)}</section>"""


def p_use_app(n):
    splash = (f'<div class="phone"><div class="scr" style="background:{INK};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px">'
              f'{img(U("rosa-no-preto"), 120)}{img(U("rosa-no-preto", "-lockup"), h=0, style="display:none")}'
              f'<div style="font:800 26px Gabarito;color:#fff">clozzy</div><div style="font-size:11px;color:rgba(255,255,255,.6)">Seu close, seu preço.</div></div></div>')
    apps = "".join('<span><i></i>app</span>' for _ in range(5))
    home = (f'<div class="phone"><div class="scr" style="background:#3a2a36"><img src="{PH[1]}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.55">'
            f'<div style="position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:18px 8px;padding:60px 14px">{apps.replace("<span><i></i>app</span>", "<span style=display:flex;flex-direction:column;align-items:center;gap:4px;font-size:8.5px;color:#fff><i style=width:46px;height:46px;border-radius:12px;background:rgba(255,255,255,.14);display:block></i>app</span>")}'
            f'<span style="display:flex;flex-direction:column;align-items:center;gap:4px;font-size:8.5px;color:#fff">{img(L(MAIN + "-app-rosa"), 46)}Clozzy</span></div>'
            f'<div style="position:absolute;left:10px;right:10px;top:250px;background:rgba(255,255,255,.88);border-radius:18px;padding:10px 12px;display:flex;gap:10px;align-items:center">'
            f'{img(L(MAIN + "-app-rosa"), 34)}<div style="font-size:10.5px;line-height:1.35"><b>Clozzy</b> · agora<br>A Nina postou 3 stories no Close ✦</div></div></div></div>')
    return f"""<section class="page cream"><div class="kicker">{n:02d} · Utilizações · app</div><h2>Ícone, splash, notificação e <em>home</em></h2>
<div class="phones">{f'<div class="pw">{home}<div class="cap"><b>Ícone + notificação</b></div></div>'}{f'<div class="pw">{splash}<div class="cap"><b>Splash (520 ms)</b></div></div>'}{f'<div class="pw">{RA.s_home("x")}<div class="cap"><b>Header do app</b></div></div>'}</div>
{foot(n)}</section>"""


def p_use_web(n):
    return f"""<section class="page white"><div class="kicker">{n:02d} · Utilizações · web e vídeo</div><h2>Site, aba, e-mail e <em>marca d'água</em></h2>
<div class="cols" style="grid-template-columns:1.3fr 1fr;margin-top:10px">
<div class="box" style="padding:0;overflow:hidden"><div style="display:flex;gap:6px;padding:8px 10px;background:#ece7e9"><span style="display:flex;gap:6px;align-items:center;background:#fff;padding:5px 10px;border-radius:8px 8px 0 0;font-size:10.5px">{img(L(MAIN + "-16"), 14)}Clozzy · Seu close, seu preço</span><span style="font-size:10.5px;padding:5px 10px;color:#888">+</span></div>
<div style="background:{WHITE};padding:14px 18px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(20,9,15,.08)">{img(U("deep", "-lockup"), h=30)}<span style="display:flex;gap:16px;font-size:12px;font-weight:700;align-items:center">Explorar <span>Entrar</span><span style="background:{DEEP};color:#fff;padding:7px 14px;border-radius:99px">Sou criador</span></span></div>
<div style="padding:26px 18px;background:{CREAM};display:flex;gap:20px;align-items:center"><div><div style="font:800 34px/1 Gabarito">Seu close,<br><span style="color:{DEEP}">seu preço.</span></div><p style="font-size:11.5px;margin-top:8px;max-width:280px">Monte a vitrine, defina o preço do seu Close e receba no Pix.</p></div>{img(U("rosa-estrela-roxa"), 130)}</div></div>
<div class="cols" style="grid-template-columns:1fr">
<div class="box" style="background:{INK};display:flex;justify-content:space-between;align-items:center">{img(U("rosa-no-preto", "-lockup"), h=28)}<span style="font-size:11px;color:#fff;opacity:.7">header escuro</span></div>
<div class="box"><h4>Assinatura de e-mail</h4><div style="display:flex;gap:12px;align-items:center;margin-top:6px">{img(U("deep"), 44)}<div style="font-size:11px;line-height:1.4"><b>Nina Rios</b> · Parcerias<br>clozzy.com · @clozzy</div></div></div>
<div class="mock" style="height:150px"><img src="{PH[0]}" style="width:100%;height:100%;object-fit:cover"><div style="position:absolute;right:10px;bottom:10px;opacity:.85">{img(U("branco-no-preto", "-lockup"), h=20)}</div>
<div style="position:absolute;left:10px;top:10px" class="tag"><span style="background:{PINK};color:{INK};padding:4px 8px;border-radius:99px">★ Exclusivo</span></div></div>
<div class="cap2"><b>Marca d'água em vídeo</b>Lockup branco a 85% no canto inferior direito, 20 px de altura em 1080p.</div>
</div></div>{foot(n)}</section>"""


def p_use_social(n):
    hl = "".join(f'<div style="text-align:center"><div style="width:58px;height:58px;border-radius:50%;background:{bg};display:grid;place-items:center;box-shadow:0 0 0 2px {WHITE},0 0 0 3.5px rgba(20,9,15,.15)">{img(U(u), 36)}</div><div style="font-size:9.5px;margin-top:5px">{t}</div></div>'
                 for bg, u, t in ((PINK, "branco-no-rosa", "Close"), (PURPLE, "branco-no-roxo", "Drops"), (INK, "rosa-no-preto", "Como funciona"), (DEEP, "branco-no-rosa", "Pix")))
    grid = "".join(f'<div style="aspect-ratio:1;background:{bg};display:grid;place-items:center">{inner}</div>' for bg, inner in (
        (PINK, img(U("branco-no-rosa"), 60)), (INK, f'<div style="font:800 15px/1.05 Gabarito;color:#fff;text-align:center;padding:8px">Seu close,<br><span style="color:{PINK}">seu preço.</span></div>'),
        (PURPLE, img(U("rosa-no-roxo"), 60)), (CREAM, img(U("deep"), 60)), (DEEP, f'<div style="font:800 13px Gabarito;color:#fff;text-align:center;padding:8px">Você só paga<br>se vender.</div>'), (INK, img(U("branco-estrela-rosa-no-roxo"), 60))))
    profile = (f'<div class="phone"><div class="scr" style="background:{WHITE}">{RA.status()}'
               f'<div style="padding:6px 14px;font:800 14px Figtree">clozzy ✓</div>'
               f'<div style="display:flex;align-items:center;gap:14px;padding:6px 14px">{img(L(MAIN + "-app-rosa").replace("", ""), 74, style="border-radius:50%")}'
               f'<div style="display:flex;gap:14px;font-size:10px;text-align:center"><div><b style="font-size:13px">312</b><br>posts</div><div><b style="font-size:13px">48 mil</b><br>seguidores</div><div><b style="font-size:13px">12</b><br>seguindo</div></div></div>'
               f'<div style="padding:4px 14px;font-size:10.5px;line-height:1.4"><b>Clozzy</b><br>Seu close, seu preço. ✦<br>Venda stories, vídeos e chat pro seu Close.<br><span style="color:{DEEP};font-weight:700">clozzy.com</span></div>'
               f'<div style="display:flex;gap:12px;padding:10px 14px">{hl}</div>'
               f'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin-top:4px">{grid}</div></div></div>')
    story = (f'<div class="phone"><div class="scr" style="background:{PURPLE}"><img src="{PH[3]}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.35">'
             f'<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:20px">{img(U("rosa-no-roxo"), 96)}'
             f'<div style="font:800 26px/1.05 Gabarito;color:#fff;text-align:center">Meu Close<br>abriu ✦</div><div style="background:#fff;color:{INK};font:800 12px Figtree;padding:10px 16px;border-radius:99px">🔗 clozzy.com/nina</div></div>'
             f'<div style="position:absolute;left:12px;top:44px;display:flex;gap:8px;align-items:center">{img(U("branco-no-roxo"), 24)}<b style="color:#fff;font-size:11px">nina.rios</b></div></div></div>')
    return f"""<section class="page cream"><div class="kicker">{n:02d} · Utilizações · redes</div><h2>Perfil, destaques e <em>story</em></h2>
<div class="phones">{f'<div class="pw">{profile}<div class="cap"><b>Perfil no Instagram</b><small>Avatar com o tile rosa, destaques nas 4 cores e grade alternando rosa, roxo, ink e cream.</small></div></div>'}
{f'<div class="pw">{story}<div class="cap"><b>Story do criador</b><small>Template roxo com o símbolo rosa e o link do Close.</small></div></div>'}
<div class="pw"><div class="mock" style="background:{INK};height:540px;border-radius:30px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:20px">{img(U("rosa-no-preto"), 120)}<div style="font:800 30px/1 Gabarito;color:#fff;text-align:center">Novo drop<br><span style="color:{PINK}">às 21h</span></div><div style="display:flex;gap:8px">{"".join(f'<i style="display:block;width:{w}px;height:9px;border-radius:5px;background:{PINK}"></i>' for w in (9, 22, 34, 80))}</div></div><div class="cap"><b>Post / anúncio</b><small>Ink com o símbolo rosa e o traço gradativo como divisor.</small></div></div></div>
{foot(n)}</section>"""


def tee(color, inner):
    path = "M30 10 L50 4 Q60 14 70 4 L90 10 L110 30 L96 42 L88 36 L88 120 L32 120 L32 36 L24 42 L10 30 Z"
    return (f'<svg viewBox="0 0 120 124" width="180"><path d="{path}" fill="{color}" stroke="rgba(20,9,15,.12)" stroke-width=".8"/>'
            f'<foreignObject x="44" y="38" width="32" height="32"><div xmlns="http://www.w3.org/1999/xhtml">{inner}</div></foreignObject></svg>')


def p_use_print(n):
    card_front = f'<div class="mock" style="background:{DEEP};height:110px;display:grid;place-items:center">{img(U("branco-no-rosa", "-lockup"), h=28)}</div>'
    card_back = (f'<div class="mock" style="background:{WHITE};height:110px;padding:12px 14px;border:1px solid rgba(20,9,15,.1);display:flex;flex-direction:column;justify-content:space-between">'
                 f'{img(U("deep"), 26)}<div style="font-size:10px;line-height:1.35"><b style="font:800 13px Gabarito">Nina Rios</b><br>Parcerias · nina@clozzy.com · clozzy.com</div></div>')
    sticker = "".join(f'<div style="width:96px;height:96px;border-radius:50%;background:{bg};display:grid;place-items:center;box-shadow:0 6px 14px rgba(20,9,15,.15)">{img(U(u), 62)}</div>'
                      for bg, u in ((PINK, "branco-no-rosa"), (PURPLE, "rosa-no-roxo"), (INK, "rosa-no-preto")))
    return f"""<section class="page white"><div class="kicker">{n:02d} · Utilizações · impresso</div><h2>Camiseta, cartão, <em>adesivo</em> e embalagem</h2>
<div class="cols" style="grid-template-columns:1fr 1fr 1fr;margin-top:10px">
<div class="box" style="display:flex;justify-content:space-around;align-items:center">{tee(INK, img(U("rosa-no-preto"), 32))}{tee(PINK, img(U("branco-no-rosa"), 32))}</div>
<div class="box"><div style="display:grid;grid-template-columns:1fr;gap:8px">{card_front}{card_back}</div><div class="cap2"><b>Cartão de visita</b>Frente Pink Deep com o lockup branco; verso branco com o símbolo Deep.</div></div>
<div class="box"><div style="display:flex;gap:10px;justify-content:center">{sticker}</div><div class="cap2"><b>Adesivos</b>Rosa, roxo com símbolo rosa, ink com símbolo rosa.</div></div>
<div class="box" style="grid-column:1/3;display:flex;gap:20px;align-items:center">
<div class="mock" style="width:200px;height:150px;background:{PURPLE};display:grid;place-items:center;border-radius:14px">{img(U("branco-estrela-rosa-no-roxo", "-vertical"), h=110)}</div>
<div class="mock" style="width:200px;height:150px;background:{CREAM};display:grid;place-items:center;border-radius:14px;border:1px solid rgba(20,9,15,.08)">{img(U("rosa-estrela-roxa", "-vertical"), h=110)}</div>
<div class="cap2" style="max-width:260px"><b>Embalagem / ecobag</b>Empilhado em roxo com a estrela rosa, ou em cream com o rosa e a estrela roxa: as duas formas de levar o roxo da v1.</div></div>
<div class="box"><h4>Impressão</h4><ul><li>Símbolo mínimo 6 mm (corte pequeno até 10 mm).</li><li>Uma cor: ink ou branco.</li><li>Pink Deep em Pantone próximo, conferido em prova.</li></ul></div>
</div>{foot(n)}</section>"""


def p_next(n):
    picks = ["k1-dois-tracos", "k6-vao-largo", "k3-pontilhado"]
    return f"""<section class="page ink" style="display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:30px">
<div><div class="kicker" style="color:{PINK}">{n:02d} · Decisão</div><h2 style="font-size:40px">Recomendo a <em>1 · dois traços</em></h2>
<p class="lead" style="margin-top:10px">Pontas inteiras, dois traços curtos no canto superior esquerdo e vãos de 10° (20° no corte pequeno). É discreto, lê como C, tem o story de perto e continua visível em 16 px.</p>
<ul class="lead" style="margin:14px 0 0 18px"><li>Se quiser ainda mais legível no pequeno: <b>6 · vãos largos</b>.</li><li>Mais lúdico: <b>3 · três pontos</b> (o “…”).</li><li>Para escolher: variação (1–6), espessura (8–10) e as combinações de cor. Depois, kit completo e atualização da identidade v2.</li></ul></div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;justify-items:center">{"".join(f'<div style="text-align:center">{img(L(s + "-dark"), 130)}<div style="font:800 12px Gabarito;margin-top:6px;color:#fff">{C[s][1]}</div></div>' for s in picks)}
{"".join(f'<div>{img(L(MAIN + "-app-" + b), 80)}</div>' for b in ("rosa", "roxo-rosa", "preto"))}</div>
{foot(n)}</section>"""


def build():
    fns = [p_refs, p_idea, p_construction, p_variants, p_small, p_thickness, p_colors, p_featured, p_more, p_lockups, p_roxo_rosa,
           p_use_app, p_use_web, p_use_social, p_use_print, p_next]
    pages = [p_cover()] + [fn(i + 2) for i, fn in enumerate(fns)]
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy — C com tracejado no canto</title>'
            f'<style>{RA.css()}{EXTRA}</style></head><body>{"".join(pages)}</body></html>')
    OUT_HTML.write_text(html)
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer", f"--print-to-pdf={OUT_PDF}", OUT_HTML.as_uri()],
                   check=True, capture_output=True)
    return len(pages)


if __name__ == "__main__":
    print("pages", build())

#!/usr/bin/env python3
"""Clozzy — documento da rodada 14 (símbolo “Carregando” + cores + aplicações).
Rodar: python3 _carregando.py && python3 _build.py → HTML (com animação) + PDF + png/ (prévias das páginas)"""
import base64, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import _carregando as C  # noqa: E402

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
FONTS = HERE.parent / "logo-final-v3" / "fonts"
OUT_HTML = HERE / "carregando-clozzy.html"
OUT_PDF = HERE / "carregando-clozzy.pdf"
PINK, DEEP, PURPLE, INK, CREAM, WHITE = C.PINK, C.DEEP, C.PURPLE, C.INK, C.CREAM, C.WHITE
V, f = C.V, C.f
TOTAL = 12


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(Path(p).read_bytes()).decode()


# ---------- peças inline --------------------------------------------------------------------------------
def sym(v, px, small=False, spin=False, style=""):
    v = V[v] if isinstance(v, str) else v
    sp = ' class="spin"' if spin else ""
    return (f'<svg{sp} viewBox="5 5 90 90" width="{px}" height="{px}" style="{style}">'
            f'{C.mark(v, small, spin)}</svg>')


def lock(v, h, vertical=False, spin=False, style=""):
    v = V[v] if isinstance(v, str) else v
    inner, w, hh = C.lockup_body(v, vertical, spin)
    sp = ' class="spin"' if spin else ""
    return (f'<svg{sp} viewBox="0 0 {f(w)} {f(hh)}" height="{h}" width="{f(h * w / hh)}" style="{style}">'
            f'{inner}</svg>')


def g_sym(v, x, y, size, small=False):
    """Símbolo dentro de outro SVG: canto superior esquerdo em (x, y), diâmetro `size`."""
    s = size / 90
    return f'<g transform="translate({f(x)} {f(y)}) scale({s:.4f}) translate(-5 -5)">{C.mark(v, small)}</g>'


def g_lock(v, x, y, h, vertical=False):
    inner, w, hh = C.lockup_body(v, vertical)
    s = h / hh
    return f'<g transform="translate({f(x)} {f(y)}) scale({s:.4f})">{inner}</g>', w * s


def tile(v, px, radius=22.37):
    v = V[v] if isinstance(v, str) else v
    return C.tile_svg(v, px, radius).replace('<?xml', '')


def pattern(c, h=8, scale=1.0, lens=(2, 5, 10, 18, 30, 48), tail=120):
    body, w = C.pattern_row(c, 0, h, 6, lens, tail)
    return f'<svg viewBox="0 0 {f(w)} {h}" width="{f(w * scale)}" height="{f(h * scale)}">{body}</svg>'


def foot(n):
    return (f'<div class="foot"><span>Clozzy · símbolo “Carregando” · rodada 14 · nov 2026</span>'
            f'<span>{n:02d} / {TOTAL:02d}</span></div>')


def page(n, title, lead, body, dark=False, extra_cls=""):
    cls = "pg dark" if dark else "pg"
    return (f'<section class="{cls} {extra_cls}"><h2>{title}</h2><p class="lead">{lead}</p>{body}{foot(n)}</section>')


CSS = f"""
@font-face{{font-family:Gabarito;src:url({b64(FONTS / 'Gabarito-Variable.ttf', 'font/ttf')});font-weight:400 900}}
@font-face{{font-family:Figtree;src:url({b64(FONTS / 'Figtree-Variable.ttf', 'font/ttf')});font-weight:300 900}}
@page{{size:297mm 210mm;margin:0}}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:Figtree;color:{INK};background:#d9d4d1}}
svg{{display:block;flex-shrink:0}}
.spin .ring{{transform-origin:50px 50px;animation:spin 2.4s linear infinite}}
@keyframes spin{{to{{transform:rotate(360deg)}}}}
@media print{{.spin .ring{{animation:none}}}}
.pg{{width:297mm;height:210mm;padding:14mm 16mm 13mm;position:relative;overflow:hidden;background:{CREAM};
  page-break-after:always;margin:0 auto 10px}}
@media print{{.pg{{margin:0}}}}
.pg.dark{{background:{INK};color:{WHITE}}}
h1{{font:800 58px/1 Gabarito;letter-spacing:-.025em}}
h2{{font:800 28px/1.05 Gabarito;letter-spacing:-.015em}}
h3{{font:800 13px Gabarito}}
.lead{{font-size:12px;line-height:1.5;max-width:680px;margin-top:7px;opacity:.72}}
.foot{{position:absolute;left:16mm;right:16mm;bottom:7mm;display:flex;justify-content:space-between;font:600 9px Figtree;opacity:.45}}
.lbl{{font:700 9px Figtree;opacity:.55;text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px}}
.cap{{font:600 9.5px/1.35 Figtree;opacity:.62;margin-top:6px;text-align:center}}
.cap b{{display:block;font:800 11px Gabarito;opacity:1;color:inherit}}
.flex{{display:flex;gap:18px;align-items:flex-start}}
.g{{display:grid;gap:12px}}
.box{{border-radius:14px;display:flex;align-items:center;justify-content:center}}
.white{{background:{WHITE};border:1px solid rgba(20,9,15,.08)}}
.card{{border-radius:14px;padding:12px;text-align:center}}
.cv{{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-top:14px}}
.cv .t{{border-radius:12px;height:112px;display:flex;align-items:center;justify-content:center}}
.cv .nm{{font:800 10.5px Gabarito;margin-top:6px}}
.cv .nt{{font-size:8.6px;line-height:1.35;opacity:.6;margin-top:2px}}
.do{{font:800 10px Gabarito;margin-top:6px}}
"""


# ---------- páginas ------------------------------------------------------------------------------------
def p01():
    return (f'<section class="pg dark"><div style="display:flex;justify-content:space-between;height:100%">'
            f'<div style="display:flex;flex-direction:column;justify-content:space-between;padding-bottom:16mm">'
            f'<div><div style="font:700 11px Figtree;color:{PINK};letter-spacing:.14em">RODADA 14 · VERSÃO NOVA</div>'
            f'<h1 style="margin-top:12px">Carregando</h1>'
            f'<p class="lead" style="max-width:420px">O símbolo 05 da rodada de stories virando marca: o anel do story '
            f'carregando, com traços que crescem até virar linha, e a estrela da logo final no meio. Aqui estão as cores e '
            f'as aplicações: camisetas, landing page, app, redes, papelaria e brindes.</p></div>'
            f'{lock("preto", 64)}</div>'
            f'<div style="display:flex;align-items:center;padding-right:6mm">{sym("preto", 360, spin=True)}</div>'
            f'</div>{foot(1)}</section>')


def p02():
    v = V["branco"]
    # construção: o anel com as medidas
    lens = " · ".join(f"{L}°" for L in C.LENS)
    big = sym("branco", 250)
    steps = "".join(
        f'<div style="display:flex;gap:10px;align-items:center;margin-top:10px"><div style="width:22px;height:22px;'
        f'border-radius:50%;background:{PINK};color:#fff;font:800 11px/22px Gabarito;text-align:center">{i}</div>'
        f'<div style="font-size:11px;line-height:1.4;max-width:330px">{t}</div></div>'
        for i, t in enumerate([
            f"Grid de 100. Anel com raio médio {f(C.RM)} e espessura {f(C.W)} (≈ 20/256). Pontas redondas.",
            f"Do topo, no sentido horário, 7 traços que crescem: {lens}, com vão fixo de {f(C.GAP)}°.",
            "Depois do último traço o anel fecha em linha cheia pela esquerda até voltar ao topo.",
            f"Estrela da logo final v3 (5 pontas, canto redondo), inscrita num círculo de raio {f(C.STAR_FIT)}.",
            f"Corte pequeno (≤ 32 px): espessura {f(C.W_SM)} e só 3 traços ({', '.join(str(x) + '°' for x in C.LENS_SM)}), "
            f"para não virar pontilhado sujo.",
        ], 1))
    sizes = "".join(f'<div style="text-align:center">{sym("branco", px, small=px <= 32)}'
                    f'<div class="cap">{px} px</div></div>' for px in (128, 64, 48, 32, 24, 16))
    return page(2, "O símbolo", "A ideia é o story abrindo: o anel ainda carregando, que vira linha cheia quando o conteúdo chega. "
                "Lê como story porque é o mesmo movimento que todo mundo vê no app.",
                f'<div class="flex" style="margin-top:16px;gap:34px"><div class="box white" style="width:300px;height:300px">'
                f'{big}</div><div>{steps}<div class="lbl" style="margin-top:22px">Escala · o corte pequeno entra em 32 px</div>'
                f'<div style="display:flex;gap:22px;align-items:flex-end">{sizes}</div></div></div>')


def p03():
    cells = "".join(
        f'<div><div class="t" style="background:{v["bg"]};{"border:1px solid rgba(20,9,15,.08)" if v["bg"] == WHITE else ""}">'
        f'{sym(v, 78)}</div><div class="nm">{v["name"]}</div><div class="nt">{v["note"]}</div></div>' for v in C.VARS)
    return page(3, "12 variações de cor", "Só as cores da marca. No preto o anel é rosa e a estrela branca; no rosa, no Deep e "
                "no roxo, tudo branco; no claro, Deep (ou rosa vivo nas telas). Nunca preto sobre rosa nem rosa sobre roxo.",
                f'<div class="cv">{cells}</div>')


def p04():
    rows = []
    for s in ("preto", "rosa", "roxo", "deep", "cream", "branco"):
        v = V[s]
        bd = "border:1px solid rgba(20,9,15,.08);" if v["bg"] == WHITE else ""
        rows.append(f'<div class="box" style="background:{v["bg"]};{bd}height:86px">{lock(v, 44)}</div>'
                    f'<div class="box" style="background:{v["bg"]};{bd}height:86px">{lock(v, 68, vertical=True)}</div>')
    return page(4, "Assinaturas", "Horizontal (anel = 1,4 × a altura do l, vão de 0,35 l) e empilhada. A palavra fica sempre ao "
                "lado ou embaixo do símbolo, nunca fundida com ele.",
                f'<div class="g" style="grid-template-columns:2.1fr 1fr 2.1fr 1fr;margin-top:14px">{"".join(rows)}</div>')


TEE = ("M62 14 L30 24 L4 62 L30 80 L42 70 L42 214 L158 214 L158 70 L170 80 L196 62 L170 24 L138 14 "
       "C128 32 72 32 62 14 Z")


def tee(color, art, label, sub):
    edge = "rgba(20,9,15,.14)" if color in (WHITE, CREAM) else "rgba(0,0,0,.25)"
    return (f'<div style="text-align:center"><svg viewBox="0 0 200 220" width="150" height="165">'
            f'<path d="{TEE}" fill="{color}" stroke="{edge}" stroke-width="1.2" stroke-linejoin="round"/>'
            f'<path d="M62 14 C72 32 128 32 138 14" fill="none" stroke="{edge}" stroke-width="5"/>{art}</svg>'
            f'<div class="cap"><b>{label}</b>{sub}</div></div>')


def p05():
    lk_cream, wl = g_lock(V["cream"], 0, 0, 13)
    lk_rosa, wr = g_lock(V["rosa"], 0, 0, 64, vertical=True)
    pat, pw = C.pattern_row(DEEP, 0, 6, 4, (2, 5, 10, 18, 30, 48), 60)
    tees = [
        tee(INK, g_sym(V["preto"], 116, 52, 24), "Preta · peito", "Símbolo pequeno no peito esquerdo"),
        tee(INK, g_sym(V["preto-bicolor"], 52, 56, 96), "Preta · costas", "Bicolor grande nas costas"),
        tee(PINK, f'<g transform="translate({f(100 - wr / 2)} 52)">{lk_rosa}</g>', "Rosa", "Empilhada branca no centro"),
        tee(WHITE, g_sym(V["branco"], 70, 56, 60) + f'<g transform="translate({f(100 - pw * 0.55 / 2)} 140) scale(.55)">{pat}</g>',
            "Branca", "Símbolo Deep + faixa tracejada"),
        tee(PURPLE, g_sym(V["roxo"], 56, 54, 88), "Roxa", "Símbolo branco grande"),
        tee(CREAM, f'<g transform="translate(108 56)">{lk_cream}</g>', "Cream · peito", "Assinatura horizontal pequena"),
    ]
    # camiseta com estampa repetida
    rep = "".join(g_sym(V["preto"], 46 + (i % 4) * 28 + (14 if (i // 4) % 2 else 0), 46 + (i // 4) * 28, 18)
                  for i in range(24))
    clip = f'<clipPath id="teeclip"><path d="{TEE}"/></clipPath>'
    tees.append(tee(INK, f'<defs>{clip}</defs><g clip-path="url(#teeclip)">{rep}</g>', "Preta · estampa", "Símbolo repetido"))
    lk_p, _ = g_lock(V["preto"], 0, 0, 12)
    tees.append(tee(INK, f'<g transform="translate(52 150)">{lk_p}</g>' + g_sym(V["preto"], 76, 58, 48),
                    "Preta · creator", "Símbolo + assinatura na barra"))
    return page(5, "Camisetas", "Preta é a peça principal. Nas cores, a marca vai toda branca (rosa, roxo) ou Deep (branca, cream). "
                "Estampa mínima no peito: 7 cm de diâmetro.",
                f'<div class="g" style="grid-template-columns:repeat(4,1fr);margin-top:12px;row-gap:6px">{"".join(tees)}</div>')


def browser(inner, w, h, bg, dark=True):
    bar = "#2a1f25" if dark else "#efe7e2"
    dots = "".join(f'<span style="width:7px;height:7px;border-radius:50%;background:{c};display:inline-block;margin-right:4px"></span>'
                   for c in ("#ff5f57", "#febc2e", "#28c840"))
    return (f'<div style="width:{w}px;border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(20,9,15,.18)">'
            f'<div style="background:{bar};height:22px;padding:7px 10px;line-height:0">{dots}</div>'
            f'<div style="background:{bg};height:{h}px;position:relative;overflow:hidden">{inner}</div></div>')


def btn(t, bg, c, pad="9px 16px", fs=11):
    return f'<span style="display:inline-block;background:{bg};color:{c};border-radius:999px;padding:{pad};font:800 {fs}px Gabarito">{t}</span>'


def p06():
    nav = (f'<div style="display:flex;justify-content:space-between;align-items:center;padding:16px 26px">{lock("preto", 22)}'
           f'<div style="display:flex;gap:18px;align-items:center;font:600 10px Figtree;color:rgba(255,255,255,.7)">'
           f'<span>Como funciona</span><span>Para creators</span><span>Preços</span>{btn("Entrar", "rgba(255,255,255,.1)", WHITE, "6px 12px", 10)}</div></div>')
    hero = (f'{nav}<div style="display:flex;justify-content:space-between;align-items:center;padding:20px 26px 0 40px">'
            f'<div style="max-width:300px;color:{WHITE}"><div style="font:700 9px Figtree;color:{PINK};letter-spacing:.14em">'
            f'CLOSE FRIENDS QUE PAGAM</div><div style="font:800 34px/1.02 Gabarito;letter-spacing:-.02em;margin-top:8px">'
            f'Seu story só<br>para quem<br>assina.</div><p style="font-size:10.5px;line-height:1.5;opacity:.65;margin-top:10px">'
            f'Poste como no Instagram. Só os seus assinantes veem, e você recebe por Pix todo mês.</p>'
            f'<div style="margin-top:14px;display:flex;gap:8px">{btn("Criar meu Clozzy", PINK, WHITE)}'
            f'{btn("Ver exemplo", "transparent", WHITE)}</div></div>'
            f'<div style="margin-right:24px">{sym("preto", 210, spin=True)}</div></div>'
            f'<div style="position:absolute;left:0;right:0;bottom:16px;display:flex;justify-content:center">{pattern(PINK, 6, 0.9)}</div>')
    # mobile
    mob = (f'<div style="width:170px;height:350px;border-radius:24px;background:{PINK};padding:14px;color:{WHITE};'
           f'position:relative;box-shadow:0 10px 30px rgba(20,9,15,.18)">{lock("rosa", 16)}'
           f'<div style="display:flex;justify-content:center;margin-top:26px">{sym("rosa", 104, spin=True)}</div>'
           f'<div style="font:800 21px/1.03 Gabarito;letter-spacing:-.02em;margin-top:22px;text-align:center">Seu story só para quem assina.</div>'
           f'<div style="position:absolute;left:14px;right:14px;bottom:16px;text-align:center">'
           f'{btn("Criar meu Clozzy", WHITE, PINK, "10px 16px", 11)}</div></div>')
    steps = "".join(
        f'<div style="flex:1;background:{WHITE};border-radius:12px;padding:12px;border:1px solid rgba(20,9,15,.06)">'
        f'{sym("branco", 34)}<div style="font:800 11.5px Gabarito;margin-top:8px">{a}</div>'
        f'<div style="font-size:9px;line-height:1.4;opacity:.6;margin-top:3px">{b}</div></div>'
        for a, b in (("Poste", "Fotos e vídeos como story."), ("Libere", "Só assinantes veem."), ("Receba", "Pix todo mês, direto.")))
    light = (f'<div style="padding:18px 22px"><div style="font:700 8.5px Figtree;color:{DEEP};letter-spacing:.14em">COMO FUNCIONA</div>'
             f'<div style="font:800 20px Gabarito;letter-spacing:-.015em;margin-top:4px">Três passos, um anel.</div>'
             f'<div style="display:flex;gap:10px;margin-top:12px">{steps}</div>'
             f'<div style="margin-top:14px">{pattern(DEEP, 5, 0.8)}</div></div>')
    return page(6, "Landing page", "Hero no preto com o símbolo grande girando (no HTML ele anima de verdade), versão mobile no "
                "rosa e seções claras no cream. O tracejado crescente vira divisor.",
                f'<div class="flex" style="margin-top:12px;gap:20px"><div>{browser(hero, 560, 300, INK)}'
                f'<div style="height:12px"></div>{browser(light, 560, 158, CREAM, dark=False)}</div>{mob}</div>')


def phone(inner, bg, w=150, h=300):
    return (f'<div style="width:{w}px;height:{h}px;border-radius:22px;background:{bg};position:relative;overflow:hidden;'
            f'box-shadow:0 8px 24px rgba(20,9,15,.18);border:3px solid #1c1218">{inner}</div>')


def p07():
    icons = "".join(f'<div style="text-align:center">{tile(s, 66)}<div class="cap">{V[s]["name"].split(" ·")[0]}</div></div>'
                    for s in ("rosa", "preto", "roxo", "deep", "cream"))
    splash = phone(f'<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px">'
                   f'{sym("rosa", 84, spin=True)}</div><div style="position:absolute;bottom:22px;left:0;right:0;display:flex;'
                   f'justify-content:center">{lock("rosa", 16)}</div>', PINK)
    others = "".join(f'<div style="width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,{a})"></div>'
                     for a in (.16, .1, .2, .12, .14, .18, .1, .16, .12, .2, .14))
    home = phone(f'<div style="padding:30px 14px;display:grid;grid-template-columns:repeat(4,28px);gap:12px 8px;justify-content:space-between">'
                 f'{tile("preto", 28, 6)}{others}</div><div style="position:absolute;left:12px;right:12px;bottom:12px;'
                 f'height:44px;border-radius:14px;background:rgba(255,255,255,.12);display:flex;align-items:center;'
                 f'justify-content:space-around">{tile("rosa", 28, 6)}<div style="width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,.2)"></div>'
                 f'<div style="width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,.2)"></div></div>',
                 "linear-gradient(160deg,#2a1622,#14090F)")
    # feed com loader
    tray = "".join(f'<div style="width:30px;height:30px;border-radius:50%;border:2px solid {c};padding:2px">'
                   f'<div style="width:100%;height:100%;border-radius:50%;background:rgba(20,9,15,.08)"></div></div>'
                   for c in (DEEP, "rgba(20,9,15,.15)", DEEP))
    feed = phone(f'<div style="padding:24px 10px 0">{lock("branco", 13)}<div style="display:flex;gap:6px;margin-top:12px;align-items:center">'
                 f'{sym("branco-pink", 34, spin=True)}{tray}</div><div style="height:120px;border-radius:12px;'
                 f'background:rgba(20,9,15,.05);margin-top:12px;display:flex;align-items:center;justify-content:center">'
                 f'{sym("branco-pink", 40, spin=True)}</div><div style="height:8px;width:70%;border-radius:4px;background:rgba(20,9,15,.08);margin-top:10px"></div>'
                 f'<div style="height:8px;width:45%;border-radius:4px;background:rgba(20,9,15,.06);margin-top:6px"></div></div>'
                 f'<div style="position:absolute;left:0;right:0;bottom:0;height:40px;border-top:1px solid rgba(20,9,15,.08);'
                 f'display:flex;justify-content:space-around;align-items:center;background:{WHITE}">'
                 f'<div style="width:14px;height:14px;border-radius:4px;background:rgba(20,9,15,.2)"></div>'
                 f'{sym("branco-pink", 22, small=True)}<div style="width:14px;height:14px;border-radius:50%;background:rgba(20,9,15,.2)"></div></div>',
                 WHITE)
    notif = phone(f'<div style="text-align:center;color:#fff;margin-top:30px;font:800 40px Gabarito;letter-spacing:-.02em">9:41</div>'
                  f'<div style="margin:24px 8px 0;background:rgba(255,255,255,.14);border-radius:14px;padding:9px;display:flex;gap:8px;'
                  f'align-items:center;color:#fff">{tile("rosa", 26, 6)}<div style="font-size:8.5px;line-height:1.35">'
                  f'<b style="font:800 9.5px Gabarito">Clozzy</b><br>A Bia postou um story novo para você ✦</div></div>'
                  f'<div style="margin:6px 8px 0;background:rgba(255,255,255,.1);border-radius:14px;padding:9px;display:flex;gap:8px;'
                  f'align-items:center;color:#fff">{tile("rosa", 26, 6)}<div style="font-size:8.5px;line-height:1.35">'
                  f'<b style="font:800 9.5px Gabarito">Clozzy</b><br>Pix recebido: R$ 29,90 de @lua.b</div></div>',
                  "linear-gradient(170deg,#7C48C4,#14090F)")
    phones = "".join(f'<div style="text-align:center">{p}<div class="cap"><b>{a}</b>{b}</div></div>' for p, a, b in (
        (splash, "Splash", "O símbolo gira enquanto abre"), (home, "Tela inicial", "Ícone preto entre os outros"),
        (feed, "Feed", "Loader e aba central"), (notif, "Notificações", "Ícone rosa no roxo/preto")))
    return page(7, "App", "O símbolo já é um loader: no app ele gira em toda espera (splash, story abrindo, upload). Ícone principal "
                "rosa; preto e roxo como ícones alternativos.",
                f'<div class="flex" style="margin-top:12px;gap:28px"><div><div class="lbl">Ícones</div>'
                f'<div class="g" style="grid-template-columns:repeat(2,66px);gap:10px 14px">{icons}</div></div>'
                f'<div class="flex" style="gap:16px">{phones}</div></div>')


def p08():
    avatars = "".join(f'<div style="text-align:center"><div style="width:96px;height:96px;border-radius:50%;background:{V[s]["bg"]};'
                      f'display:flex;align-items:center;justify-content:center;overflow:hidden">{sym(s, 56)}</div>'
                      f'<div class="cap">{V[s]["name"].split(" ·")[0]}</div></div>' for s in ("preto", "rosa", "roxo"))
    hl_icons = [("Novos", "preto"), ("Pix", "rosa"), ("Creators", "roxo"), ("Dúvidas", "deep"), ("Regras", "preto-bicolor")]
    hls = "".join(f'<div style="text-align:center"><div style="width:58px;height:58px;border-radius:50%;border:1.5px solid rgba(20,9,15,.15);'
                  f'padding:3px"><div style="width:100%;height:100%;border-radius:50%;background:{V[s]["bg"]};display:flex;'
                  f'align-items:center;justify-content:center">{sym(s, 28)}</div></div><div class="cap">{n}</div></div>' for n, s in hl_icons)
    story = (f'<div style="width:150px;height:266px;border-radius:16px;background:{INK};position:relative;overflow:hidden;color:#fff">'
             f'<div style="position:absolute;left:8px;right:8px;top:8px;display:flex;gap:3px">'
             + "".join(f'<span style="flex:1;height:2.5px;border-radius:2px;background:{c}"></span>' for c in ("#fff", "#fff", "rgba(255,255,255,.35)"))
             + f'</div><div style="position:absolute;left:8px;top:17px;display:flex;gap:5px;align-items:center;font:800 9px Gabarito">'
             f'{sym("preto", 18)}clozzy</div><div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;'
             f'justify-content:center;gap:12px">{sym("preto", 80, spin=True)}<div style="font:800 15px/1.05 Gabarito;text-align:center">'
             f'Story novo<br>só para assinantes</div></div></div>')
    post = (f'<div style="width:220px;height:220px;border-radius:6px;background:{PINK};position:relative;overflow:hidden;color:#fff;padding:16px">'
            f'<div style="font:800 24px/1 Gabarito;letter-spacing:-.02em">Seus close<br>friends,<br>agora pagam.</div>'
            f'<div style="position:absolute;right:-30px;bottom:-30px">{sym("rosa", 150)}</div>'
            f'<div style="position:absolute;left:16px;bottom:16px">{lock("rosa", 14)}</div></div>')
    post2 = (f'<div style="width:220px;height:220px;border-radius:6px;background:{CREAM};position:relative;overflow:hidden;padding:16px;'
             f'border:1px solid rgba(20,9,15,.08)"><div style="font:800 11px Gabarito;color:{DEEP}">COMO FUNCIONA · 1/3</div>'
             f'<div style="font:800 22px/1.05 Gabarito;letter-spacing:-.02em;margin-top:8px">Poste como<br>no Instagram.</div>'
             f'<div style="margin-top:22px">{pattern(DEEP, 7, 0.75)}</div><div style="position:absolute;right:16px;bottom:16px">{sym("cream", 34)}</div></div>')
    return page(8, "Redes sociais", "Foto de perfil com o símbolo a 58% do círculo, destaques, story e posts. O símbolo cortado na "
                "borda do post funciona como grafismo.",
                f'<div class="flex" style="margin-top:12px;gap:26px"><div><div class="lbl">Foto de perfil</div>'
                f'<div class="flex" style="gap:12px">{avatars}</div><div class="lbl" style="margin-top:18px">Destaques</div>'
                f'<div class="flex" style="gap:10px">{hls}</div></div><div><div class="lbl">Story</div>{story}</div>'
                f'<div><div class="lbl">Feed</div><div class="flex" style="gap:12px">{post}{post2}</div></div></div>')


def p09():
    bc_front = (f'<div style="width:240px;height:150px;border-radius:8px;background:{INK};display:flex;align-items:center;justify-content:center;'
                f'box-shadow:0 6px 18px rgba(20,9,15,.2)">{sym("preto", 74)}</div>')
    bc_back = (f'<div style="width:240px;height:150px;border-radius:8px;background:{CREAM};padding:16px;position:relative;'
               f'box-shadow:0 6px 18px rgba(20,9,15,.14)">{lock("cream", 20)}<div style="position:absolute;left:16px;bottom:16px">'
               f'<div style="font:800 12px Gabarito">Seu Nome</div><div style="font-size:9px;opacity:.6;margin-top:2px">'
               f'Parcerias · @clozzy · clozzy.com</div></div><div style="position:absolute;right:16px;bottom:18px">{pattern(DEEP, 4, 0.45)}</div></div>')
    stickers = "".join(f'<div style="width:{d}px;height:{d}px;border-radius:50%;background:{V[s]["bg"]};display:flex;align-items:center;'
                       f'justify-content:center;box-shadow:0 0 0 4px #fff,0 4px 12px rgba(20,9,15,.2);transform:rotate({r}deg)">{sym(s, d * 0.7)}</div>'
                       for s, d, r in (("preto", 74, -8), ("rosa", 60, 6), ("roxo", 56, -4), ("branco", 64, 10)))
    sticker_lock = (f'<div style="background:{PINK};border-radius:999px;padding:10px 16px;box-shadow:0 0 0 4px #fff,0 4px 12px rgba(20,9,15,.2);'
                    f'transform:rotate(-4deg)">{lock("rosa", 22)}</div>')
    cap_svg = (f'<svg viewBox="0 0 200 130" width="190" height="124"><path d="M30 92 C30 40 70 14 108 14 C150 14 176 44 176 92 Z" fill="{INK}"/>'
               f'<path d="M30 92 C70 84 130 84 176 92 C186 96 196 104 194 112 C150 102 70 102 30 104 Z" fill="#241720"/>'
               f'<circle cx="108" cy="16" r="5" fill="#241720"/>{g_sym(V["preto"], 86, 40, 44)}</svg>')
    bag = (f'<svg viewBox="0 0 160 190" width="140" height="166"><path d="M50 40 C50 6 110 6 110 40" fill="none" stroke="#d9cfc6" stroke-width="7"/>'
           f'<rect x="14" y="40" width="132" height="146" rx="4" fill="{CREAM}" stroke="rgba(20,9,15,.12)"/>'
           + g_sym(V["cream"], 46, 66, 68) + g_lock(V["cream"], 0, 0, 0)[0][:0] +
           f'<g transform="translate(34 156) scale(.5)">{C.pattern_row(DEEP, 0, 8, 6, (2, 5, 10, 18, 30, 48), 60)[0]}</g></svg>')
    mug = (f'<svg viewBox="0 0 170 150" width="150" height="132"><path d="M118 46 C150 46 150 104 118 104" fill="none" stroke="{PURPLE}" stroke-width="12"/>'
           f'<rect x="20" y="24" width="104" height="116" rx="10" fill="{PURPLE}"/>{g_sym(V["roxo"], 40, 50, 64)}</svg>')
    items = [(f'<div class="flex" style="gap:12px">{bc_front}{bc_back}</div>', "Cartão de visita", "Frente preta · verso cream"),
             (f'<div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;width:270px">{stickers}{sticker_lock}</div>',
              "Adesivos", "Recorte com borda branca"),
             (cap_svg, "Boné", "Bordado: símbolo rosa e branco no preto"),
             (bag, "Ecobag", "Algodão cru, símbolo Deep + faixa"),
             (mug, "Caneca", "Roxo com o símbolo branco")]
    cells = "".join(f'<div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-end">{a}'
                    f'<div class="cap"><b>{b}</b>{c}</div></div>' for a, b, c in items)
    return page(9, "Papelaria e brindes", "Em bordado e silk, a versão bicolor e a degradê saem; use as de cor chapada. "
                "No bordado, espessura mínima de traço de 1,2 mm (símbolo ≥ 4 cm).",
                f'<div class="g" style="grid-template-columns:auto auto;gap:22px 40px;margin-top:14px;justify-content:start">'
                f'{cells}</div>', extra_cls="merch")


def p10():
    bar = (f'<div style="width:300px;height:10px;border-radius:5px;background:rgba(255,255,255,.12);position:relative">'
           f'<div style="position:absolute;inset:0">{pattern(PINK, 10, 1.0, (2, 5, 10, 18), 60)}</div></div>')
    photo = (f'<div style="width:180px;height:220px;border-radius:16px;background:linear-gradient(160deg,#3a2430,#1d1118);position:relative">'
             f'<div style="position:absolute;left:12px;top:12px">{pattern(PINK, 5, 0.55)}</div>'
             f'<div style="position:absolute;right:12px;bottom:12px">{sym("preto", 36)}</div></div>')
    rows = "".join(f'<div style="margin-top:10px">{pattern(c, 8, 1.1)}</div>' for c in (PINK, WHITE))
    return page(10, "Elemento gráfico", "O tracejado crescente sai do anel e vira faixa reta: divisor de seções, barra de progresso, "
                "selo em fotos e estampa. Os traços sempre crescem no sentido da leitura (esquerda → direita).",
                f'<div class="flex" style="margin-top:18px;gap:40px"><div><div class="lbl">Faixa</div>{rows}'
                f'<div class="lbl" style="margin-top:22px">Barra de progresso (upload)</div>{bar}'
                f'<div class="lbl" style="margin-top:22px">Do anel para a faixa</div><div class="flex" style="align-items:center;gap:16px">'
                f'{sym("preto", 70)}<span style="font:800 20px Gabarito;color:{PINK}">→</span>{pattern(PINK, 8, 0.8)}</div></div>'
                f'<div><div class="lbl">Selo em foto</div>{photo}</div></div>', dark=True)


def p11():
    def bad(inner, bg, t):
        return (f'<div><div class="box" style="background:{bg};height:110px;{"border:1px solid rgba(20,9,15,.08)" if bg == WHITE else ""}">{inner}</div>'
                f'<div class="do">✕ {t}</div></div>')

    def good(inner, bg, t):
        return (f'<div><div class="box" style="background:{bg};height:110px;{"border:1px solid rgba(20,9,15,.08)" if bg == WHITE else ""}">{inner}</div>'
                f'<div class="do" style="color:{DEEP}">✓ {t}</div></div>')
    blk_on_pink = dict(V["rosa"], dash=INK, line=INK, star=INK)
    pink_on_purple = dict(V["roxo"], dash=PINK, line=PINK, star=PINK)
    white_star_pink = dict(V["preto"], dash=WHITE, line=WHITE, star=PINK)
    rev = (f'<svg viewBox="5 5 90 90" width="78" height="78" style="transform:scaleX(-1)">{C.mark(V["branco"])}</svg>')
    stretch = f'<svg viewBox="5 5 90 90" width="110" height="64" preserveAspectRatio="none">{C.mark(V["branco"])}</svg>'
    rot = f'<svg viewBox="5 5 90 90" width="78" height="78" style="transform:rotate(90deg)">{C.mark(V["branco"])}</svg>'
    cells = [
        good(sym("preto", 78), INK, "Anel rosa e estrela branca no preto"),
        good(sym("rosa", 78), PINK, "Tudo branco no rosa"),
        good(sym("roxo", 78), PURPLE, "Tudo branco no roxo"),
        good(sym("branco", 78), WHITE, "Deep no claro"),
        bad(sym(blk_on_pink, 78), PINK, "Preto sobre rosa"),
        bad(sym(pink_on_purple, 78), PURPLE, "Rosa sobre roxo"),
        bad(sym(white_star_pink, 78), INK, "Anel branco com estrela rosa"),
        bad(rev, WHITE, "Espelhar (traços crescem no anti-horário)"),
        bad(rot, WHITE, "Girar o símbolo parado"),
        bad(stretch, WHITE, "Esticar ou achatar"),
        bad(sym("branco", 78, small=True) if False else f'<svg viewBox="5 5 90 90" width="78" height="78">{C.ring(DEEP, DEEP)}</svg>',
            WHITE, "Tirar a estrela"),
        bad(f'<div style="display:flex;align-items:center;gap:0">{sym("branco", 50)}<span style="font:800 38px Gabarito;'
            f'letter-spacing:-.02em;margin-left:-14px">lozzy</span></div>', WHITE, "Fundir o anel com o c de clozzy"),
    ]
    return page(11, "Faça e não faça", "As regras de cor de sempre, mais duas novas para este símbolo: os traços crescem sempre "
                "no sentido horário, e a rotação só existe como animação de carregamento.",
                f'<div class="g" style="grid-template-columns:repeat(6,1fr);margin-top:14px;gap:14px 12px">{"".join(cells)}</div>')


def p12():
    files = [("svg/simbolo-*.svg", "Símbolo nas 12 cores (com fundo), 256 px"),
             ("svg/simbolo-pequeno-*.svg", "Corte pequeno (≤ 32 px): 3 traços, anel mais grosso"),
             ("svg/simbolo-*-transparente.svg", "Sem fundo, para usar sobre foto"),
             ("svg/logo-horizontal-*.svg", "Assinatura horizontal nas 12 cores"),
             ("svg/logo-empilhado-*.svg", "Assinatura empilhada nas 12 cores"),
             ("svg/app-icon-*.svg", "Ícone de app 1024 (rosa, preto, roxo, deep, cream)"),
             ("svg/animado-*.svg", "Loader animado (SVG com SMIL), o anel gira e a estrela fica parada"),
             ("carregando-clozzy.html", "Este documento. No navegador, os símbolos giram")]
    rows = "".join(f'<tr><td style="font:700 10.5px ui-monospace,monospace;padding:7px 18px 7px 0;color:{PINK}">{a}</td>'
                   f'<td style="font-size:11px;opacity:.75">{b}</td></tr>' for a, b in files)
    return (f'<section class="pg dark"><h2>Arquivos</h2><p class="lead">Tudo em <b>clozzy/marca/logo-carregando/</b>. '
            f'Para gerar de novo: <span style="font-family:ui-monospace,monospace">python3 _carregando.py && python3 _build.py</span></p>'
            f'<div class="flex" style="margin-top:18px;gap:50px;align-items:center"><table>{rows}</table>'
            f'<div>{sym("preto-bicolor", 200, spin=True)}</div></div>{foot(12)}</section>')


def build():
    pages = [p01(), p02(), p03(), p04(), p05(), p06(), p07(), p08(), p09(), p10(), p11(), p12()]
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy · Carregando · rodada 14</title>'
            f'<style>{CSS}</style></head><body>{"".join(pages)}</body></html>')
    OUT_HTML.write_text(html)
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer",
                    f"--print-to-pdf={OUT_PDF}", OUT_HTML.as_uri()], check=True, capture_output=True)
    try:
        import fitz
        png = HERE / "png"
        png.mkdir(exist_ok=True)
        for i, p in enumerate(fitz.open(OUT_PDF), 1):
            p.get_pixmap(dpi=110).save(png / f"pagina-{i:02d}.png")
    except ImportError:
        pass
    print("ok", OUT_HTML.name, OUT_PDF.name)


if __name__ == "__main__":
    build()

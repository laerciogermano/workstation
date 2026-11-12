#!/usr/bin/env python3
"""Clozzy — manual de USO da marca: os quatro temas (preto, branco, roxo, rosa) e as aplicações.
Base: ../identidade-oficial-v2 (mesmo símbolo, lockup, cores, fontes e a página "Cor nas peças").
Rodar: python3 _build.py  → manual-uso-marca-clozzy.html/.pdf + tokens.css + tokens.json
"""
import json
import random
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "identidade-oficial-v2"))
import _marca as M  # noqa: E402

f = M.K.f
PINK, DEEP, PURPLE, INK, CREAM, WHITE = M.PINK, M.DEEP, M.PURPLE, M.INK, M.CREAM, M.WHITE
LAV, SOFT, MUTED = M.LAVANDA, M.ROSA_SUAVE, M.MUTED
OK, NO = "#0B7A59", "#C4162A"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
FONTS = "../identidade-nova/fonts"
OUT = "manual-uso-marca-clozzy"
DATA = "2026-11-11"


def mix(fg, bg, a):
    """cor sólida de `fg` com opacidade `a` sobre `bg`."""
    p = lambda h: [int(h.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4)]
    return "#" + "".join(f"{round(x * a + y * (1 - a)):02X}" for x, y in zip(p(fg), p(bg)))


def cr(a, b):
    return M.contrast(a, b)


def crs(a, b):
    return f"{cr(a, b):.1f}:1".replace(".", ",")


# ================================================================== TEMAS
# papéis: bg superfície · card superfície 2 · line divisória · tit título · txt texto · apoio texto de apoio
# dest destaque (palavra, preço, ícone ativo) · bb/bf botão primário fundo/texto · sb/sf secundário borda/texto
# link · chb/chf chip · chsb/chsf chip selecionado · badge (fundo, texto, borda) · ring anel de story · foto placeholder
TEMAS = {
    "preto": dict(nome="Preto", bg=INK, card=mix(WHITE, INK, .07), line=mix(WHITE, INK, .16), tit=WHITE, txt=mix(WHITE, INK, .9),
                  apoio=mix(WHITE, INK, .68), dest=PINK, bb=WHITE, bf=INK, sb=mix(WHITE, INK, .55), sf=WHITE, link=PINK,
                  chb=mix(WHITE, INK, .1), chf=WHITE, chsb=WHITE, chsf=INK, badge=("transparent", PINK, PINK), ring=PINK,
                  foto=mix(WHITE, INK, .1), foto2=mix(WHITE, INK, .18), inp=mix(WHITE, INK, .07), inpb=mix(WHITE, INK, .28),
                  logo="preto", dark=True,
                  apoio_n="branco 68%", txt_n="branco 90%", card_n="branco 7% sobre o preto", line_n="branco 16%",
                  uso="Site e app (tema escuro), hero da landing, capas de vídeo, splash, anúncios de drop, rodapé.",
                  evita="Texto rosa em parágrafo (só palavra de destaque e preço). Botão rosa com texto preto.",
                  prop=[(INK, 70, "preto"), (WHITE, 20, "branco"), (PINK, 10, "rosa")]),
    "branco": dict(nome="Branco", bg=WHITE, card=CREAM, line=mix(INK, WHITE, .14), tit=INK, txt=INK, apoio=MUTED, dest=DEEP,
                   bb=DEEP, bf=WHITE, sb=INK, sf=INK, link=DEEP, chb=SOFT, chf=INK, chsb=INK, chsf=WHITE,
                   badge=(DEEP, WHITE, DEEP), ring=DEEP, foto=mix(INK, WHITE, .07), foto2=mix(INK, WHITE, .13),
                   inp=WHITE, inpb=mix(INK, WHITE, .22), logo="branco", dark=False,
                   apoio_n="Muted", txt_n="ink", card_n="Cream", line_n="ink 14%",
                   uso="Leitura longa, checkout, carteira e saque, e-mail, FAQ, termos, app (tema claro), depoimentos.",
                   evita="Rosa vivo (#FF0065) em texto ou botão: no branco o rosa é sempre Pink Deep.",
                   prop=[(WHITE, 70, "branco"), (INK, 22, "ink"), (DEEP, 8, "Pink Deep")]),
    "roxo": dict(nome="Roxo", bg=PURPLE, card=mix(WHITE, PURPLE, .12), line=mix(WHITE, PURPLE, .3), tit=WHITE, txt=WHITE, apoio=LAV,
                 dest=LAV, bb=WHITE, bf=PURPLE, sb=WHITE, sf=WHITE, link=WHITE, chb=mix(WHITE, PURPLE, .16), chf=WHITE,
                 chsb=WHITE, chsf=PURPLE, badge=(WHITE, PURPLE, WHITE), ring=WHITE, foto=mix(WHITE, PURPLE, .14),
                 foto2=mix(WHITE, PURPLE, .24), inp=mix(WHITE, PURPLE, .12), inpb=mix(WHITE, PURPLE, .45), logo="roxo", dark=True,
                 apoio_n="Lavanda", txt_n="branco", card_n="branco 12% sobre o roxo", line_n="branco 30%",
                 uso="Área do criador, planos e preços, onboarding, campanhas, selos e cartões de destaque, enquetes.",
                 evita="Qualquer rosa em cima (texto, botão, logo). Preto sobre o roxo (3,3:1). Encostar no rosa.",
                 prop=[(PURPLE, 70, "roxo"), (WHITE, 22, "branco"), (LAV, 8, "Lavanda")]),
    "rosa": dict(nome="Rosa", bg=PINK, card=DEEP, line=mix(WHITE, PINK, .4), tit=WHITE, txt=WHITE, apoio=WHITE, dest=WHITE,
                 bb=WHITE, bf=DEEP, sb=WHITE, sf=WHITE, link=WHITE, chb=mix(WHITE, PINK, .2), chf=WHITE, chsb=WHITE, chsf=DEEP,
                 badge=(WHITE, DEEP, WHITE), ring=WHITE, foto=DEEP, foto2=mix(WHITE, DEEP, .16),
                 inp=mix(WHITE, PINK, .16), inpb=WHITE, logo="rosa", dark=True,
                 apoio_n="branco (peso 400)", txt_n="branco", card_n="Pink Deep", line_n="branco 40%",
                 uso="Momentos: pagamento aprovado, story, post de impacto, faixa de CTA, splash de campanha, avatar.",
                 evita="Preto em cima. Roxo em cima ou encostado. Texto corrido menor que 20 px (branco no rosa = 3,9:1).",
                 prop=[(PINK, 75, "rosa"), (WHITE, 20, "branco"), (DEEP, 5, "Pink Deep")]),
}
ORDEM = ("preto", "branco", "roxo", "rosa")
PAPEIS = [  # chave, nome, descrição
    ("bg", "Superfície", "fundo da tela ou da peça"),
    ("card", "Superfície 2", "cartão, folha, campo elevado"),
    ("tit", "Título", "Gabarito 800–900"),
    ("txt", "Texto", "Figtree 400–600"),
    ("apoio", "Apoio", "legenda, data, preço riscado"),
    ("dest", "Destaque", "palavra-chave, preço, ícone ativo"),
    ("bb", "Botão · fundo", "a ação principal, uma por tela"),
    ("bf", "Botão · texto", "Gabarito 800"),
    ("sb", "Secundário", "contorno 2 px e texto"),
    ("link", "Link", "texto clicável, sublinhado"),
    ("chb", "Chip", "filtro e etiqueta"),
    ("line", "Linha", "divisória 1 px"),
]


# ================================================================== helpers
def lg(kind, slug, h):
    return M.versao_svg(kind, slug, h=h)


def sym(slug, size, small=False):
    _s, _n, _b, _wc, rc, sc = M.V[slug]
    return f'<svg viewBox="5 5 90 90" width="{size}" height="{size}" style="display:block">{M.SYM(rc, sc, small)}</svg>'


def tile(slug, size, radius=None, scale=.62):
    r = f"border-radius:{radius}px;" if radius is not None else f"border-radius:{size * .2237:.0f}px;"
    return f'<div style="width:{size}px;height:{size}px;{r}overflow:hidden;flex:none">{M.tile_svg(slug, size, radius=0, scale=scale)}</div>'


def page(title, num, body, t="branco", pad=""):
    T = TEMAS[t]
    head = f'<div class="hd"><span>{title}</span><span>{num:02d}</span></div>' if title else ""
    return (f'<section style="background:{T["bg"]};color:{T["tit"]};{pad}">{head}{body}'
            f'<div class="ft">clozzy · uso da marca</div></section>')


def cap(t, color="rgba(20,9,15,.62)", extra=""):
    return f'<div class="lb" style="color:{color};{extra}">{t}</div>'


def capT(t, txt):
    """legenda na cor de apoio do tema da página."""
    return cap(txt, TEMAS[t]["apoio"])


def mark(ok, ring="#fff", size=30):
    return (f'<div style="position:absolute;top:10px;right:12px;width:{size}px;height:{size}px;border-radius:50%;background:{OK if ok else NO};color:#fff;'
            f'font:900 {size * .6:.0f}px/{size}px Gabarito;text-align:center;box-shadow:0 0 0 3px {ring};z-index:3">{"✓" if ok else "✕"}</div>')


ICON = {
    "home": '<path d="M3.5 10.5 12 4l8.5 6.5V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z"/>',
    "search": '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    "lib": '<rect x="4" y="4" width="4.5" height="16" rx="1"/><rect x="10.5" y="4" width="4.5" height="16" rx="1"/><path d="m17 5.5 3.6 1-3.2 13.5-3.6-1"/>',
    "user": '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.2 4-6.2 8-6.2s7 2 8 6.2"/>',
    "lock": '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>',
    "bell": '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.8 1.8H4.2z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    "plus": '<path d="M12 5v14M5 12h14"/>',
    "check": '<path d="m5 12.5 4.5 4.5L19 7"/>',
    "chat": '<path d="M4 5h16v11H9l-5 4z"/>',
    "share": '<path d="M12 3.5v11M7.5 8 12 3.5 16.5 8M5 13.5V20h14v-6.5"/>',
    "heart": '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
    "copy": '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    "back": '<path d="M15 5 8 12l7 7"/>',
    "wallet": '<rect x="3" y="6" width="18" height="14" rx="2.5"/><path d="M16 13h2M3 9h18"/>',
    "link": '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L11.5 6.8"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5"/>',
    "clock": '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    "pix": '<path d="M12 3.5 20.5 12 12 20.5 3.5 12z"/><path d="m8 12 4-4 4 4-4 4z"/>',
}


def ic(name, size=20, color="currentColor", w=2):
    return (f'<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="{color}" stroke-width="{w}" '
            f'stroke-linecap="round" stroke-linejoin="round" style="display:block;flex:none">{ICON[name]}</svg>')


def star(size, color):
    import math
    pts = []
    for i in range(10):
        r = 10 if i % 2 == 0 else 4.6
        a = math.radians(-90 + i * 36)
        pts.append(f"{12 + r * math.cos(a):.2f},{12 + r * math.sin(a):.2f}")
    return (f'<svg viewBox="0 0 24 24" width="{size}" height="{size}" style="display:block;flex:none"><polygon points="{" ".join(pts)}" '
            f'fill="{color}" stroke="{color}" stroke-width="1.6" stroke-linejoin="round"/></svg>')


def btn(T, label, kind="pri", h=52, fs=None, w=None, icon=None, extra=""):
    fs = fs or round(h * .36)
    ws = f"width:{w}px;" if w else ""
    st = {"pri": f"background:{T['bb']};color:{T['bf']};",
          "sec": f"background:transparent;color:{T['sf']};box-shadow:inset 0 0 0 2px {T['sb']};",
          "link": f"background:transparent;color:{T['link']};text-decoration:underline;text-underline-offset:4px;padding:0 4px;",
          "off": f"background:{T['chb']};color:{T['apoio']};"}[kind]
    pad = "" if kind == "link" else f"padding:0 {round(h * .5)}px;"
    i = ic(icon, round(fs * 1.15)) if icon else ""
    return (f'<div style="display:inline-flex;align-items:center;justify-content:center;gap:8px;height:{h}px;{pad}{ws}border-radius:999px;'
            f'font:800 {fs}px/1 Gabarito;white-space:nowrap;{st}{extra}">{i}{label}</div>')


def chip(T, label, sel=False, fs=14):
    bg, fg = (T["chsb"], T["chsf"]) if sel else (T["chb"], T["chf"])
    return (f'<span style="display:inline-flex;align-items:center;height:{fs * 2.2:.0f}px;padding:0 {fs * .95:.0f}px;border-radius:999px;background:{bg};'
            f'color:{fg};font:700 {fs}px/1 Figtree;white-space:nowrap">{label}</span>')


def badge(T, label="exclusivo", fs=12):
    bg, fg, bd = T["badge"]
    return (f'<span style="display:inline-flex;align-items:center;gap:4px;height:{fs * 1.9:.0f}px;padding:0 {fs * .7:.0f}px;border-radius:999px;'
            f'background:{bg};color:{fg};box-shadow:inset 0 0 0 1.5px {bd};font:800 {fs}px/1 Figtree;letter-spacing:.02em;white-space:nowrap">'
            f'{star(fs, fg)}{label}</span>')


def foto(T, w, h, r=14, locked=False, seed=0, label=None):
    """placeholder de foto do criador: silhueta chapada no tom da superfície."""
    w_, h_ = (f"{w}px" if isinstance(w, (int, float)) else w), f"{h}px"
    cx = 50 + (seed % 3 - 1) * 14
    sil = (f'<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMax slice" style="position:absolute;inset:0;width:100%;height:100%">'
           f'<circle cx="{cx}" cy="44" r="17" fill="{T["foto2"]}"/><path d="M{cx - 38} 110 C{cx - 36} 76 {cx - 20} 66 {cx} 66 S{cx + 36} 76 {cx + 38} 110z" fill="{T["foto2"]}"/></svg>')
    lock = ""
    if locked:
        lock = (f'<div style="position:absolute;inset:0;backdrop-filter:blur(0);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;'
                f'background:repeating-linear-gradient(135deg,{T["foto"]} 0 7px,{T["foto2"]} 7px 8px);opacity:.92">'
                f'<div style="width:{min(w if isinstance(w, int) else 200, h) * .2:.0f}px;height:{min(w if isinstance(w, int) else 200, h) * .2:.0f}px;border-radius:50%;'
                f'background:{T["bg"] if T["dark"] else WHITE};display:flex;align-items:center;justify-content:center;color:{T["tit"]}">'
                f'{ic("lock", round(min(w if isinstance(w, int) else 200, h) * .1))}</div>'
                + (f'<div style="font:700 {max(11, round(h * .055))}px Figtree;color:{T["tit"]}">{label}</div>' if label else "") + '</div>')
    return (f'<div style="position:relative;width:{w_};height:{h_};border-radius:{r}px;background:{T["foto"]};overflow:hidden;flex:none">{sil}{lock}</div>')


def avatar(T, size, ring=True, seed=0):
    inner = foto(T, size - (8 if ring else 0), size - (8 if ring else 0), r=999, seed=seed)
    if not ring:
        return inner
    return (f'<div style="width:{size}px;height:{size}px;border-radius:50%;box-shadow:inset 0 0 0 2.5px {T["ring"]};display:flex;'
            f'align-items:center;justify-content:center;flex:none">{inner}</div>')


def h1(t, extra=""):
    return f'<h1 style="{extra}">{t}</h1>'


def lead(t, color=None, extra=""):
    c = f"color:{color};" if color else ""
    return f'<p class="lead" style="{c}{extra}">{t}</p>'


# ================================================================== telefone e telas
def phone(inner, T, w=300, h=620, frame=None):
    fr = frame or (mix(WHITE, INK, .3) if T is None else ("rgba(255,255,255,.28)" if TEMAS_PAGE_DARK[0] else "rgba(20,9,15,.16)"))
    bg = T["bg"] if T else INK
    fg = T["tit"] if T else WHITE
    sb = (f'<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 22px 0;font:700 12px Figtree;color:{fg}">'
          f'<span>9:41</span><span style="width:70px;height:20px;border-radius:12px;background:#000;margin-top:-2px"></span><span>●●● ▮</span></div>')
    return (f'<div style="width:{w}px;height:{h}px;border-radius:40px;background:{bg};box-shadow:0 0 0 7px {fr};position:relative;overflow:hidden;flex:none;color:{fg}">'
            f'{sb}<div style="position:absolute;inset:38px 0 0 0;display:flex;flex-direction:column">{inner}</div></div>')


TEMAS_PAGE_DARK = [False]   # moldura do telefone acompanha a página


def navbar(T, ativo=0):
    its = ["home", "search", "plus", "lib", "user"]
    return (f'<div style="margin-top:auto;height:62px;border-top:1px solid {T["line"]};display:flex;justify-content:space-around;align-items:center;padding-bottom:8px;background:{T["bg"]}">'
            + "".join(f'<div style="color:{T["dest"] if i == ativo else T["apoio"]}">{ic(n, 22, w=2.2 if i == ativo else 1.8)}</div>' for i, n in enumerate(its)) + '</div>')


def s_feed(T):
    nomes = ["você", "lara", "duda", "mel", "bia"]
    stories = "".join(f'<div style="text-align:center;font:600 10px Figtree;color:{T["apoio"]}">{avatar(T, 52, ring=i > 0, seed=i)}<div style="margin-top:4px">{n}</div></div>' for i, n in enumerate(nomes))
    return (f'<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 18px 10px">{lg("horizontal", T["logo"], 22)}'
            f'<div style="display:flex;gap:14px;color:{T["tit"]}">{ic("bell", 21)}{ic("chat", 21)}</div></div>'
            f'<div style="display:flex;gap:9px;padding:4px 16px 12px;border-bottom:1px solid {T["line"]}">{stories}</div>'
            f'<div style="padding:12px 16px 0">'
            f'<div style="display:flex;align-items:center;gap:9px">{avatar(T, 36, ring=False, seed=1)}<div style="flex:1"><div style="font:800 13px Gabarito;color:{T["tit"]}">Lara Mendes</div>'
            f'<div style="font:500 11px Figtree;color:{T["apoio"]}">@laramendes · 2 h</div></div>{badge(T, "exclusivo", 10)}</div>'
            f'<div style="margin-top:10px">{foto(T, 268, 236, 16, locked=True, seed=1, label="12 fotos · 3 vídeos")}</div>'
            f'<div style="display:flex;justify-content:space-between;align-items:center;margin-top:11px"><div><div style="font:800 15px Gabarito;color:{T["tit"]}">Pack Verão</div>'
            f'<div style="font:800 15px Gabarito;color:{T["dest"]}">R$ 29,90</div></div>{btn(T, "Desbloquear", h=38, fs=13)}</div></div>'
            f'{navbar(T, 0)}')


def s_perfil(T):
    grid = "".join(foto(T, 86, 104, 8, locked=i % 2 == 0, seed=i) for i in range(6))
    tabs = "".join(f'<div style="flex:1;text-align:center;padding:9px 0;font:700 12px Figtree;color:{T["tit"] if i == 0 else T["apoio"]};'
                   f'box-shadow:{"inset 0 -2px 0 " + T["dest"] if i == 0 else "none"}">{t}</div>' for i, t in enumerate(("Packs", "Drops", "Canal")))
    return (f'<div style="position:relative">{foto(T, "100%", 104, 0, seed=2)}'
            f'<div style="position:absolute;left:12px;top:8px;width:30px;height:30px;border-radius:50%;background:{T["bg"]};display:flex;align-items:center;justify-content:center;color:{T["tit"]}">{ic("back", 18)}</div></div>'
            f'<div style="padding:0 16px;margin-top:-32px;position:relative"><div style="width:72px;height:72px;border-radius:50%;background:{T["bg"]};padding:4px">{avatar(T, 64, seed=0)}</div>'
            f'<div style="display:flex;align-items:center;gap:6px;margin-top:6px"><span style="font:900 20px Gabarito;color:{T["tit"]};letter-spacing:-.02em">Lara Mendes</span>{star(14, T["dest"])}</div>'
            f'<div style="font:500 12px/1.4 Figtree;color:{T["apoio"]};margin-top:2px">Fotos de verão, bastidor e o que não vai pro feed.</div>'
            f'<div style="display:flex;gap:16px;margin-top:8px;font:500 11px Figtree;color:{T["apoio"]}"><span><b style="color:{T["tit"]};font:800 13px Gabarito">48</b> packs</span>'
            f'<span><b style="color:{T["tit"]};font:800 13px Gabarito">3,2 mil</b> no close</span></div>'
            f'<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">{btn(T, "Entrar no close · R$ 19,90/mês", h=42, fs=13)}{btn(T, "Mandar mensagem", "sec", h=38, fs=12)}</div></div>'
            f'<div style="display:flex;margin:10px 0 0;border-bottom:1px solid {T["line"]}">{tabs}</div>'
            f'<div style="display:grid;grid-template-columns:repeat(3,86px);gap:6px;padding:8px 16px">{grid}</div>')


def qr(size, fg=INK, bg=WHITE, seed=7):
    rnd = random.Random(seed)
    n = 25
    c = size / n
    rects = []
    for y in range(n):
        for x in range(n):
            fz = (x < 7 and y < 7) or (x > n - 8 and y < 7) or (x < 7 and y > n - 8)
            if fz:
                continue
            if rnd.random() < .48:
                rects.append(f'<rect x="{x * c:.2f}" y="{y * c:.2f}" width="{c:.2f}" height="{c:.2f}"/>')
    fd = ""
    for ox, oy in ((0, 0), (n - 7, 0), (0, n - 7)):
        fd += (f'<rect x="{ox * c + c / 2:.2f}" y="{oy * c + c / 2:.2f}" width="{6 * c:.2f}" height="{6 * c:.2f}" rx="{c:.2f}" fill="none" stroke="{fg}" stroke-width="{c:.2f}"/>'
               f'<rect x="{(ox + 2) * c:.2f}" y="{(oy + 2) * c:.2f}" width="{3 * c:.2f}" height="{3 * c:.2f}" rx="{c * .5:.2f}"/>')
    return f'<svg width="{size}" height="{size}" style="display:block;background:{bg}"><g fill="{fg}">{"".join(rects)}{fd}</g></svg>'


def s_checkout(T):
    return (f'<div style="display:flex;align-items:center;gap:10px;padding:8px 16px">{ic("back", 22, T["tit"])}<span style="font:800 16px Gabarito;color:{T["tit"]}">Pagar com Pix</span></div>'
            f'<div style="margin:6px 16px;padding:12px;border-radius:16px;background:{T["card"]};display:flex;gap:12px;align-items:center">{foto(T, 54, 54, 10, seed=1)}'
            f'<div style="flex:1"><div style="font:800 14px Gabarito;color:{T["tit"]}">Pack Verão</div><div style="font:500 11px Figtree;color:{T["apoio"]}">Lara Mendes · 12 fotos · 3 vídeos</div></div>'
            f'<div style="font:900 16px Gabarito;color:{T["dest"]}">R$ 29,90</div></div>'
            f'<div style="margin:12px auto 0;padding:14px;background:{WHITE};border-radius:18px;{"box-shadow:inset 0 0 0 1px " + T["line"] if not T["dark"] else ""}">{qr(150)}</div>'
            f'<div style="display:flex;justify-content:center;margin-top:12px">{chip(T, "⏱ expira em 14:52", fs=11)}</div>'
            f'<div style="padding:14px 16px 0;display:flex;flex-direction:column;gap:9px">{btn(T, "Copiar código Pix", h=46, fs=14, icon="copy")}'
            f'<div style="text-align:center;font:500 12px/1.4 Figtree;color:{T["apoio"]}">Liberado na hora, assim que o Pix cair.<br>Sem cartão, sem cadastro longo.</div></div>'
            f'<div style="margin-top:auto;padding:12px 16px 16px;display:flex;align-items:center;gap:8px;font:600 11px Figtree;color:{T["apoio"]};border-top:1px solid {T["line"]}">'
            f'{ic("lock", 14)}Pagamento protegido · aparece como “clozzy” no extrato</div>')


def s_biblioteca(T):
    itens = [("Pack Verão", "Lara Mendes · comprado hoje", True), ("Drop de sexta", "Duda · 3 vídeos", False), ("Canal da Mel", "assinatura · renova 12/12", False),
             ("Bastidor do ensaio", "Bia · 20 fotos", False)]
    rows = "".join(f'<div style="display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid {T["line"]}">{foto(T, 58, 58, 12, seed=i)}'
                   f'<div style="flex:1"><div style="display:flex;gap:6px;align-items:center"><span style="font:800 14px Gabarito;color:{T["tit"]}">{a}</span>'
                   f'{badge(T, "novo", 9) if nv else ""}</div><div style="font:500 11px Figtree;color:{T["apoio"]};margin-top:2px">{b}</div></div>'
                   f'<div style="color:{T["apoio"]}">{ic("share", 18)}</div></div>' for i, (a, b, nv) in enumerate(itens))
    return (f'<div style="padding:10px 16px 0"><div style="font:900 26px Gabarito;letter-spacing:-.02em;color:{T["tit"]}">Biblioteca</div>'
            f'<div style="font:500 12px Figtree;color:{T["apoio"]};margin-top:2px">Tudo que você comprou, num lugar só.</div>'
            f'<div style="display:flex;gap:6px;margin-top:12px">{chip(T, "Tudo", True, 12)}{chip(T, "Packs", fs=12)}{chip(T, "Drops", fs=12)}{chip(T, "Canais", fs=12)}</div>'
            f'<div style="margin-top:6px">{rows}</div></div>{navbar(T, 3)}')


def s_splash(T):
    return (f'<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px">{lg("empilhado", T["logo"], 130)}'
            f'<div style="font:400 14px Figtree;color:{T["apoio"]}">Seu close, seu preço.</div></div>')


def s_sucesso(T):
    return (f'<div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:0 26px">'
            f'<div style="width:76px;height:76px;border-radius:50%;background:{WHITE};display:flex;align-items:center;justify-content:center">{ic("check", 40, DEEP, 3)}</div>'
            f'<div style="font:900 50px/.98 Gabarito;letter-spacing:-.03em;color:{WHITE};margin-top:22px">Liberado.</div>'
            f'<div style="font:500 19px/1.35 Figtree;color:{WHITE};margin-top:10px">O Pix caiu. O Pack Verão já tá na sua biblioteca.</div></div>'
            f'<div style="padding:0 22px 30px;display:flex;flex-direction:column;gap:10px">{btn(T, "Ver agora", h=50, fs=16)}{btn(T, "Voltar pro perfil", "sec", h=46, fs=14)}</div>')


def campo(T, label, valor, fs=13):
    return (f'<div><div style="font:700 11px Figtree;color:{T["apoio"]};margin-bottom:5px">{label}</div>'
            f'<div style="height:44px;border-radius:12px;background:{T["inp"]};box-shadow:inset 0 0 0 1.5px {T["inpb"]};display:flex;align-items:center;padding:0 14px;'
            f'font:600 {fs}px Figtree;color:{T["txt"]}">{valor}</div></div>')


def s_onboarding(T):
    passos = "".join(f'<div style="flex:1;height:4px;border-radius:4px;background:{WHITE if i < 2 else T["line"]}"></div>' for i in range(4))
    return (f'<div style="padding:12px 22px 0"><div style="display:flex;gap:6px">{passos}</div>'
            f'<div style="font:700 11px Figtree;color:{T["apoio"]};margin-top:16px;letter-spacing:.08em">PASSO 2 DE 4</div>'
            f'<div style="font:900 34px/1 Gabarito;letter-spacing:-.03em;color:{T["tit"]};margin-top:6px">Abra seu close.</div>'
            f'<div style="font:500 13px/1.4 Figtree;color:{T["apoio"]};margin-top:8px">Escolhe o @ e quanto vale entrar. Dá pra mudar depois.</div>'
            f'<div style="display:flex;flex-direction:column;gap:12px;margin-top:18px">{campo(T, "Seu @", "clozzy.com/<b>laramendes</b>")}{campo(T, "Preço do close por mês", "R$ 19,90")}</div>'
            f'<div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap">{chip(T, "R$ 9,90", fs=11)}{chip(T, "R$ 19,90", True, 11)}{chip(T, "R$ 29,90", fs=11)}</div>'
            f'<div style="margin-top:16px;padding:12px;border-radius:14px;background:{T["card"]};font:600 12px/1.4 Figtree;color:{T["txt"]}">Você só paga se vender: taxa só na venda, sem mensalidade.</div></div>'
            f'<div style="margin-top:auto;padding:0 22px 26px">{btn(T, "Continuar", h=50, fs=16, w=256)}</div>')


def s_carteira(T):
    mov = [("Pack Verão", "+ R$ 29,90", "hoje 14:02"), ("Close · Mel", "+ R$ 19,90", "hoje 11:40"), ("Saque Pix", "− R$ 500,00", "ontem")]
    rows = "".join(f'<div style="display:flex;justify-content:space-between;padding:11px 0;border-top:1px solid {T["line"]}"><div><div style="font:700 13px Figtree;color:{T["txt"]}">{a}</div>'
                   f'<div style="font:500 11px Figtree;color:{T["apoio"]}">{c}</div></div><div style="font:800 14px Gabarito;color:{T["dest"] if b.startswith("+") else T["tit"]}">{b}</div></div>' for a, b, c in mov)
    return (f'<div style="padding:10px 18px 0"><div style="font:900 24px Gabarito;color:{T["tit"]}">Carteira</div>'
            f'<div style="margin-top:12px;padding:18px;border-radius:20px;background:{T["card"]}"><div style="font:600 12px Figtree;color:{T["apoio"]}">Disponível pra saque</div>'
            f'<div style="font:900 34px Gabarito;letter-spacing:-.02em;color:{T["tit"]};margin-top:2px">R$ 2.340,00</div>'
            f'<div style="font:500 11px Figtree;color:{T["apoio"]};margin-top:2px">+ R$ 412,00 caindo amanhã</div>'
            f'<div style="margin-top:14px">{btn(T, "Sacar no Pix", h=44, fs=14, w=228, icon="pix")}</div></div>'
            f'<div style="font:800 14px Gabarito;color:{T["tit"]};margin:18px 0 6px">Movimento</div>{rows}</div>{navbar(T, 4)}')


# ================================================================== páginas
def p_capa():
    tiras = "".join(f'<div style="flex:1;background:{TEMAS[s]["bg"]};{"box-shadow:inset 0 0 0 1px rgba(255,255,255,.2);" if s == "preto" else ""}"></div>' for s in ("preto", "branco", "roxo", "preto", "rosa"))
    return (f'<section style="background:#000;color:{WHITE}">'
            f'<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:46px">'
            f'{lg("horizontal", "preto", 150)}'
            f'<div style="font:900 64px/1 Gabarito;letter-spacing:-.03em">Uso da marca</div>'
            f'<div style="font:600 22px Figtree;color:rgba(255,255,255,.72);letter-spacing:.14em">QUATRO TEMAS · CORES POR PAPEL · APLICAÇÕES · {DATA}</div></div>'
            f'<div style="position:absolute;left:0;right:0;bottom:0;height:16px;display:flex">{tiras}</div></section>')


def p_sumario(n):
    secs = [("Sistema", ["Os quatro temas", "Anatomia de um tema", "Preto · Branco · Roxo · Rosa", "Tokens lado a lado", "Contraste e tamanhos", "Proporção e vizinhança"]),
            ("Componentes", ["Botões", "Chips, selos, campos e cartões", "Tipografia em cada tema"]),
            ("Redes", ["Posts do feed", "Formatos de post", "Carrossel", "Stories", "Perfil e destaques"]),
            ("Produto", ["Landing page", "Landing no celular", "App escuro", "App claro", "Momentos de cor"]),
            ("Outros", ["E-mail, push e link", "Anúncios e banners", "Impressos", "Não fazer", "Checklist e tokens"])]
    cols = "".join(f'<div style="flex:1;border-top:3px solid {INK};padding-top:14px"><div style="font:900 30px Gabarito;margin-bottom:14px">{t}</div>'
                   + "".join(f'<div style="font:500 20px/1.3 Figtree;padding:9px 0;border-top:1px solid {TEMAS["branco"]["line"]}">{i}</div>' for i in its) + '</div>' for t, its in secs)
    return page("Sumário", n, h1("Como usar este manual") + lead(
        "A identidade oficial v2 define o logo e as cores. Este documento define <b>como elas trabalham juntas</b>: cada peça escolhe um dos quatro temas, "
        "e cada tema já diz qual cor é do título, do texto de apoio, do destaque e do botão. Escolheu o tema, as cores estão decididas.", extra="margin-bottom:40px")
        + f'<div style="display:flex;gap:36px">{cols}</div>')


def mini_poster(s, w, h, big=56):
    T = TEMAS[s]
    return (f'<div style="width:{w}px;height:{h}px;background:{T["bg"]};border-radius:22px;padding:26px;display:flex;flex-direction:column;justify-content:space-between;'
            f'{"box-shadow:inset 0 0 0 1px " + T["line"] + ";" if s == "branco" else ""}">'
            f'<div style="display:flex;justify-content:space-between;align-items:center">{lg("horizontal", T["logo"], 28)}{badge(T, "exclusivo", 12)}</div>'
            f'<div><div style="font:900 {big}px/.98 Gabarito;letter-spacing:-.035em;color:{T["tit"]}">Seu close,<br><span style="color:{T["dest"]}">seu preço.</span></div>'
            f'<div style="font:400 19px/1.35 Figtree;color:{T["apoio"]};margin-top:12px">Pago no Pix. Liberado na hora.</div>'
            f'<div style="display:flex;gap:10px;align-items:center;margin-top:18px">{btn(T, "Entrar no close", h=48, fs=17)}{btn(T, "Ver packs", "link", h=48, fs=17)}</div></div></div>')


def p_temas(n):
    cols = ""
    for s in ORDEM:
        T = TEMAS[s]
        sw = "".join(f'<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-top:1px solid {TEMAS["branco"]["line"]}">'
                     f'<span style="width:22px;height:22px;border-radius:50%;background:{T[k]};box-shadow:inset 0 0 0 1px rgba(20,9,15,.18);flex:none"></span>'
                     f'<b style="font:800 15px Gabarito;width:86px">{nm}</b><span style="font:500 14px Figtree;color:{MUTED}">{T[k].upper()}</span></div>'
                     for k, nm in (("bg", "Superfície"), ("tit", "Título"), ("apoio", "Apoio"), ("dest", "Destaque"), ("bb", "Botão"), ("bf", "Texto do botão")))
        cols += f'<div style="width:345px">{mini_poster(s, 345, 400, 46)}<div style="font:900 26px Gabarito;margin:14px 0 4px">{T["nome"]}</div>{sw}</div>'
    return page("Os quatro temas", n, h1("Preto, branco, roxo e rosa") + f'<div style="display:flex;gap:26px">{cols}</div>', pad="padding-top:80px")


def p_anatomia(n):
    T = TEMAS["preto"]
    lines = [("1", "Superfície", "o fundo decide o tema; tudo o mais vem dele"), ("2", "Logo", "a versão do tema (aqui: anel rosa, estrela e palavra brancas)"),
             ("3", "Selo", "etiqueta pequena com a estrela; contorno ou chapado"), ("4", "Título", "Gabarito 900, a maior coisa da peça"),
             ("5", "Destaque", "uma palavra, um preço; nunca a frase toda"), ("6", "Apoio", "Figtree 400, explica o título em uma linha"),
             ("7", "Botão", "uma ação principal por peça, sempre pílula"), ("8", "Link / secundário", "a segunda opção, mais quieta que o botão")]
    pins = [(14, 14), (14, 62), (420, 72), (14, 238), (14, 318), (14, 392), (14, 460), (300, 462)]
    pin = lambda i, x, y: (f'<div style="position:absolute;left:{x}px;top:{y}px;width:30px;height:30px;border-radius:50%;background:{PURPLE};color:#fff;'
                           f'font:900 16px/30px Gabarito;text-align:center;box-shadow:0 0 0 3px #fff">{i}</div>')
    demo = (f'<div style="position:relative;width:500px;height:560px;background:{T["bg"]};border-radius:26px;padding:34px;display:flex;flex-direction:column;justify-content:space-between">'
            f'<div style="display:flex;justify-content:space-between;align-items:center;padding-left:28px">{lg("horizontal", "preto", 34)}{badge(T, "exclusivo", 14)}</div>'
            f'<div style="padding-left:28px"><div style="font:900 74px/.96 Gabarito;letter-spacing:-.035em;color:{WHITE}">Chega mais<br><span style="color:{PINK}">perto.</span></div>'
            f'<div style="font:400 21px/1.35 Figtree;color:{T["apoio"]};margin-top:16px">Conteúdo novo toda sexta, só no close.</div>'
            f'<div style="display:flex;gap:16px;align-items:center;margin-top:24px">{btn(T, "Entrar no close", h=54, fs=19)}{btn(T, "Ver packs", "link", h=54, fs=19)}</div></div>'
            + "".join(pin(str(i + 1), x, y) for i, (x, y) in enumerate(pins)) + '</div>')
    lst = "".join(f'<div style="display:flex;gap:16px;align-items:flex-start;padding:11px 0;border-top:1px solid {TEMAS["branco"]["line"]}">'
                  f'<span style="width:28px;height:28px;border-radius:50%;background:{PURPLE};color:#fff;font:900 15px/28px Gabarito;text-align:center;flex:none">{a}</span>'
                  f'<div style="font:500 19px/1.35 Figtree"><b style="font:800 20px Gabarito">{b}</b> · {c}</div></div>' for a, b, c in lines)
    return page("Anatomia de um tema", n, f'<div style="display:flex;gap:80px;align-items:center;height:100%">{demo}'
                f'<div style="flex:1">{h1("Oito papéis, uma cor para cada")}{lead("Toda peça da marca tem estes papéis. O tema escolhe a cor de cada um; ninguém escolhe cor peça por peça.", extra="margin-bottom:18px")}{lst}</div></div>')


def p_tema(s, n):
    T = TEMAS[s]
    TEMAS_PAGE_DARK[0] = T["dark"]
    big = 70
    demo = (f'<div style="width:600px;display:flex;flex-direction:column;gap:22px">'
            f'<div style="display:flex;justify-content:space-between;align-items:center">{lg("horizontal", T["logo"], 40)}{badge(T, "exclusivo", 15)}</div>'
            f'<div style="font:900 {big}px/.96 Gabarito;letter-spacing:-.035em;color:{T["tit"]}">Só quem entra,<br><span style="color:{T["dest"]}">vê.</span></div>'
            f'<div style="font:400 22px/1.4 Figtree;color:{T["apoio"]};max-width:520px">Conteúdo novo toda sexta. Pago no Pix, liberado na hora.</div>'
            f'<div style="padding:18px;border-radius:20px;background:{T["card"]};display:flex;gap:16px;align-items:center">{foto(T, 76, 76, 14, locked=True, seed=1)}'
            f'<div style="flex:1"><div style="font:800 21px Gabarito;color:{T["tit"]}">Pack Verão</div><div style="font:500 17px Figtree;color:{T["apoio"]};margin-top:2px">12 fotos · 3 vídeos</div></div>'
            f'<div style="font:900 26px Gabarito;color:{T["dest"]}">R$ 29,90</div></div>'
            f'<div style="display:flex;gap:8px">{chip(T, "Tudo", True, 16)}{chip(T, "Packs", fs=16)}{chip(T, "Drops", fs=16)}{chip(T, "Canal", fs=16)}</div>'
            f'<div style="display:flex;gap:14px;align-items:center">{btn(T, "Entrar no close", h=56, fs=20)}{btn(T, "Mandar mensagem", "sec", h=56, fs=18)}{btn(T, "Ver tudo", "link", h=56, fs=18)}</div></div>')
    nomes_hex = {"txt": T["txt_n"], "apoio": T["apoio_n"], "card": T["card_n"], "line": T["line_n"]}
    rows = ""
    for k, nm, ds in PAPEIS:
        c = T[k]
        ref = T["bb"] if k == "bf" else (T["card"] if k == "card" else T["bg"])
        ctr = "" if k in ("bg", "card", "line", "chb", "bb") else crs(c, ref)
        rows += (f'<div style="display:flex;align-items:center;gap:14px;padding:6px 0;border-top:1px solid {T["line"]}">'
                 f'<span style="width:30px;height:30px;border-radius:9px;background:{c};box-shadow:inset 0 0 0 1.5px {T["line"]};flex:none"></span>'
                 f'<b style="font:800 19px Gabarito;width:150px">{nm}</b><span style="font:600 17px Figtree;width:118px;color:{T["txt"]}">{c.upper()}</span>'
                 f'<span style="font:600 17px Figtree;flex:1;color:{T["apoio"]}">{nomes_hex.get(k, "")}</span>'
                 f'<span style="font:700 17px Figtree;width:70px;text-align:right;color:{T["txt"]}">{ctr}</span></div>')
    info = (f'<div style="display:flex;gap:24px;margin-top:18px">'
            f'<div style="flex:1;font:500 18px/1.4 Figtree;color:{T["txt"]}"><b style="font:800 20px Gabarito;color:{T["tit"]}">Usar em</b><br>{T["uso"]}</div>'
            f'<div style="flex:1;font:500 18px/1.4 Figtree;color:{T["txt"]}"><b style="font:800 20px Gabarito;color:{T["tit"]}">Evitar</b><br>{T["evita"]}</div></div>')
    body = (f'<div style="display:flex;gap:70px;height:100%;align-items:center">{demo}'
            f'<div style="flex:1"><div style="font:900 50px/1 Gabarito;letter-spacing:-.03em;margin-bottom:6px">Tema {T["nome"].lower()}</div>'
            f'<div style="font:600 17px Figtree;color:{T["apoio"]};margin-bottom:12px;display:flex;justify-content:flex-end;gap:0">contraste com o fundo</div>{rows}{info}</div></div>')
    out = page(f"Tema {T['nome'].lower()}", n, body, s)
    TEMAS_PAGE_DARK[0] = False
    return out


def p_tokens(n):
    cw = 228
    head = (f'<div style="display:flex;gap:10px;margin-left:200px;margin-bottom:8px">' + "".join(
        f'<div style="width:{cw}px;height:56px;border-radius:14px;background:{TEMAS[s]["bg"]};color:{TEMAS[s]["tit"]};display:flex;align-items:center;justify-content:center;'
        f'font:900 22px Gabarito;{"box-shadow:inset 0 0 0 1px " + TEMAS["branco"]["line"] if s == "branco" else ""}">{TEMAS[s]["nome"]}</div>' for s in ORDEM) + '</div>')
    rows = ""
    for k, nm, ds in PAPEIS:
        cells = ""
        for s in ORDEM:
            T = TEMAS[s]
            cells += (f'<div style="width:{cw}px;display:flex;align-items:center;gap:10px;height:44px;padding:0 10px;border-radius:10px;background:{T["bg"]};'
                      f'{"box-shadow:inset 0 0 0 1px " + TEMAS["branco"]["line"] + ";" if s == "branco" else ""}">'
                      f'<span style="width:26px;height:26px;border-radius:50%;background:{T[k]};box-shadow:inset 0 0 0 1.5px {T["line"]};flex:none"></span>'
                      f'<span style="font:700 15px Figtree;color:{T["tit"]}">{T[k].upper()}</span></div>')
        rows += (f'<div style="display:flex;gap:10px;align-items:center;margin-bottom:5px"><div style="width:190px"><div style="font:800 17px/1.1 Gabarito">{nm}</div>'
                 f'<div style="font:500 12px Figtree;color:{MUTED}">{ds}</div></div>{cells}</div>')
    return page("Tokens", n, h1("Os papéis lado a lado", "margin-bottom:12px") + head + rows, pad="padding-top:76px")


def p_contraste(n):
    pares = [("Branco sobre preto", WHITE, INK), ("Rosa sobre preto", PINK, INK), ("Apoio sobre preto", TEMAS["preto"]["apoio"], INK),
             ("Ink sobre branco", INK, WHITE), ("Pink Deep sobre branco", DEEP, WHITE), ("Muted sobre branco", MUTED, WHITE),
             ("Branco sobre roxo", WHITE, PURPLE), ("Lavanda sobre roxo", LAV, PURPLE), ("Roxo no botão branco", PURPLE, WHITE),
             ("Branco sobre rosa", WHITE, PINK), ("Pink Deep no botão branco", DEEP, WHITE), ("Branco sobre Pink Deep", WHITE, DEEP)]
    def nivel(c):
        if c >= 7:
            return "AAA", OK
        if c >= 4.5:
            return "AA", OK
        if c >= 3:
            return "só título", "#B26B00"
        return "não", NO
    cards = ""
    for nm, fg, bg in pares:
        c = cr(fg, bg)
        lv, col = nivel(c)
        cards += (f'<div style="width:325px"><div style="height:110px;border-radius:16px;background:{bg};{"box-shadow:inset 0 0 0 1px " + TEMAS["branco"]["line"] + ";" if bg == WHITE else ""}'
                  f'display:flex;align-items:center;justify-content:space-between;padding:0 20px;color:{fg}"><span style="font:900 40px Gabarito">Aa</span>'
                  f'<span style="font:800 30px Gabarito">{crs(fg, bg)}</span></div>'
                  f'<div style="display:flex;justify-content:space-between;margin-top:7px;font:600 15px Figtree"><span>{nm}</span><b style="color:{col}">{lv}</b></div></div>')
    regras = [("Rosa", "branco no rosa dá 3,9:1. Título a partir de 24 px (ou 19 px em peso 800). Texto de apoio no rosa: 20 px ou mais, nunca legenda miúda."),
              ("Botão no rosa", "fundo branco com texto Pink Deep (4,9:1). Nunca texto rosa vivo no branco pequeno."),
              ("Roxo", "branco e lavanda passam em qualquer tamanho. Preto no roxo não (3,3:1)."),
              ("Mínimos", "texto 14 px · legenda 12 px · botão 44 px de altura no app, 48 px no site.")]
    return page("Contraste", n, h1("Contraste e tamanhos mínimos", "margin-bottom:16px")
                + f'<div style="display:flex;flex-wrap:wrap;gap:16px 20px">{cards}</div>'
                + f'<div style="display:flex;gap:30px;margin-top:22px">' + "".join(
                    f'<div style="flex:1;border-top:3px solid {INK};padding-top:10px"><b style="font:800 19px Gabarito">{a}</b><div style="font:500 15px/1.4 Figtree;margin-top:4px">{b}</div></div>' for a, b in regras) + '</div>',
                pad="padding-top:80px")


def p_proporcao(n):
    barras = ""
    for s in ORDEM:
        T = TEMAS[s]
        seg = "".join(f'<div style="flex:{p};background:{c};display:flex;align-items:flex-end;padding:10px;font:800 15px Gabarito;'
                      f'color:{INK if c in (WHITE, LAV, CREAM) else WHITE};{"box-shadow:inset 0 0 0 1px " + TEMAS["branco"]["line"] + ";" if c == WHITE else ""}">{p}% {nm}</div>' for c, p, nm in T["prop"])
        barras += f'<div style="margin-bottom:14px"><div style="font:800 19px Gabarito;margin-bottom:6px">{T["nome"]}</div><div style="display:flex;height:66px;border-radius:14px;overflow:hidden">{seg}</div></div>'
    def seq(ss, ok, label):
        bl = "".join(f'<div style="width:62px;height:62px;border-radius:12px;background:{TEMAS[s]["bg"]};{"box-shadow:inset 0 0 0 1px " + TEMAS["branco"]["line"] + ";" if s == "branco" else ""}"></div>' for s in ss)
        return (f'<div style="display:flex;align-items:center;gap:14px;padding:10px 0;border-top:1px solid {TEMAS["branco"]["line"]}">'
                f'<div style="display:flex;gap:4px">{bl}</div><span style="width:30px;height:30px;border-radius:50%;background:{OK if ok else NO};color:#fff;'
                f'font:900 18px/30px Gabarito;text-align:center;flex:none">{"✓" if ok else "✕"}</span><span style="font:500 17px/1.35 Figtree">{label}</span></div>')
    vz = (seq(("preto", "rosa", "preto", "roxo", "branco"), True, "Rosa e roxo separados por preto ou branco")
          + seq(("branco", "roxo", "preto", "rosa", "branco"), True, "Neutro, cor, neutro, cor")
          + seq(("preto", "rosa", "roxo", "branco", "preto"), False, "Rosa encostado no roxo: vibra (1,7:1)")
          + seq(("rosa", "rosa", "rosa", "rosa", "rosa"), False, "Só rosa: cansa e apaga o destaque"))
    return page("Proporção e vizinhança", n, f'<div style="display:flex;gap:80px">'
                f'<div style="flex:1">{h1("Quanto de cada cor")}{lead("A superfície ocupa quase tudo; o destaque é pouco de propósito.", extra="margin-bottom:20px")}{barras}</div>'
                f'<div style="flex:1">{h1("Quem fica do lado de quem")}{lead("Vale para seções da landing, telas seguidas, slides de carrossel e a grade do perfil.", extra="margin-bottom:20px")}{vz}'
                f'<div style="font:500 17px/1.45 Figtree;margin-top:16px;color:{MUTED}">Preto e branco são os neutros: podem encostar em tudo. Rosa e roxo nunca um sobre o outro nem um ao lado do outro.</div></div></div>')


def p_botoes(n):
    cols = ""
    for s in ORDEM:
        T = TEMAS[s]
        cols += (f'<div style="flex:1;background:{T["bg"]};border-radius:22px;padding:24px;display:flex;flex-direction:column;gap:16px;color:{T["tit"]};'
                 f'{"box-shadow:inset 0 0 0 1px " + TEMAS["branco"]["line"] + ";" if s == "branco" else ""}">'
                 f'<div style="font:900 24px Gabarito">{T["nome"]}</div>'
                 f'<div>{btn(T, "Entrar no close", h=56, fs=20)}<div style="font:500 13px Figtree;color:{T["apoio"]};margin-top:6px">Primário · 56 · fundo {T["bb"].upper()} · texto {T["bf"].upper()}</div></div>'
                 f'<div>{btn(T, "Mandar mensagem", "sec", h=48, fs=17)}<div style="font:500 13px Figtree;color:{T["apoio"]};margin-top:6px">Secundário · 48 · contorno 2 px</div></div>'
                 f'<div style="display:flex;gap:10px;align-items:center">{btn(T, "Pix", h=44, fs=15, icon="pix")}{btn(T, "Ver tudo", "link", h=44, fs=16)}</div>'
                 f'<div>{btn(T, "Esgotado", "off", h=48, fs=17)}<div style="font:500 13px Figtree;color:{T["apoio"]};margin-top:6px">Desabilitado · cor do chip</div></div>'
                 f'<div style="display:flex;gap:10px">{btn(T, "Seguir", h=36, fs=14)}{btn(T, "Seguindo", "sec", h=36, fs=14)}</div></div>')
    regras = [("Pílula sempre", "raio 999. Altura 56 (hero), 48 (site), 44 (app), 36 (compacto)."),
              ("Um primário por peça", "a segunda ação vira secundário ou link."),
              ("Texto", "Gabarito 800, verbo na frente: Entrar, Desbloquear, Copiar código Pix, Sacar."),
              ("Nunca", "botão rosa com texto preto · botão rosa no roxo · botão roxo no rosa.")]
    return page("Botões", n, h1("O botão de cada superfície", "margin-bottom:16px") + f'<div style="display:flex;gap:18px">{cols}</div>'
                + f'<div style="display:flex;gap:30px;margin-top:22px">' + "".join(
                    f'<div style="flex:1;border-top:3px solid {INK};padding-top:10px"><b style="font:800 19px Gabarito">{a}</b><div style="font:500 15px/1.4 Figtree;margin-top:4px">{b}</div></div>' for a, b in regras) + '</div>',
                pad="padding-top:80px")


def p_componentes(n):
    cols = ""
    for s in ORDEM:
        T = TEMAS[s]
        oferta = (f'<div style="padding:16px;border-radius:18px;background:{T["card"]}"><div style="display:flex;justify-content:space-between;align-items:center">'
                  f'<span style="font:800 18px Gabarito;color:{T["tit"]}">Close mensal</span>{badge(T, "mais pedido", 11)}</div>'
                  f'<div style="font:900 34px Gabarito;color:{T["dest"]};margin-top:6px;letter-spacing:-.02em">R$ 19,90<span style="font:500 15px Figtree;color:{T["apoio"]}"> /mês</span></div>'
                  f'<div style="font:500 14px/1.4 Figtree;color:{T["txt"]};margin-top:4px">Tudo do canal + 1 pack por mês</div>'
                  f'<div style="margin-top:12px">{btn(T, "Assinar", h=42, fs=15, extra="width:100%")}</div></div>')
        cols += (f'<div style="flex:1;min-width:0;background:{T["bg"]};border-radius:22px;padding:22px;display:flex;flex-direction:column;gap:15px;color:{T["tit"]};'
                 f'{"box-shadow:inset 0 0 0 1px " + TEMAS["branco"]["line"] + ";" if s == "branco" else ""}">'
                 f'<div style="font:900 24px Gabarito">{T["nome"]}</div>'
                 f'<div style="display:flex;gap:6px;flex-wrap:wrap">{chip(T, "Tudo", True)}{chip(T, "Packs")}{chip(T, "Drops")}</div>'
                 f'<div style="display:flex;gap:6px;align-items:center">{badge(T, "exclusivo")}{badge(T, "novo")}</div>'
                 f'{campo(T, "E-mail", "voce@email.com", 14)}'
                 f'{oferta}'
                 f'<div style="display:flex;align-items:center;gap:10px">{avatar(T, 50, seed=2)}<div><div style="font:800 15px Gabarito">Duda</div><div style="font:500 13px Figtree;color:{T["apoio"]}">story novo · anel {"rosa" if s == "preto" else ("Pink Deep" if s == "branco" else "branco")}</div></div></div></div>')
    return page("Componentes", n, h1("Chips, selos, campos, cartões e avatar", "margin-bottom:16px") + f'<div style="display:flex;gap:18px">{cols}</div>', pad="padding-top:80px")


def p_tipo(n):
    cols = ""
    for s in ORDEM:
        T = TEMAS[s]
        cols += (f'<div style="flex:1;height:640px;background:{T["bg"]};border-radius:22px;padding:28px;display:flex;flex-direction:column;justify-content:space-between;color:{T["tit"]};'
                 f'{"box-shadow:inset 0 0 0 1px " + TEMAS["branco"]["line"] + ";" if s == "branco" else ""}">'
                 f'<div style="font:700 13px Figtree;letter-spacing:.12em;color:{T["apoio"]}">DROP DE SEXTA · 20H</div>'
                 f'<div><div style="font:900 60px/.95 Gabarito;letter-spacing:-.035em">O resto fica<br><span style="color:{T["dest"]}">entre a gente.</span></div>'
                 f'<div style="font:800 26px/1.15 Gabarito;margin-top:22px">12 fotos e 3 vídeos que não vão pro feed.</div>'
                 f'<div style="font:400 {20 if s == "rosa" else 17}px/1.45 Figtree;color:{T["txt"]};margin-top:12px">Pago no Pix e liberado na hora, direto na sua biblioteca. Dá pra ver quantas vezes quiser.</div>'
                 f'<div style="font:500 {20 if s == "rosa" else 14}px/1.4 Figtree;color:{T["apoio"]};margin-top:12px">Lara Mendes · 3,2 mil no close</div></div>'
                 f'<div style="font:600 13px/1.5 Figtree;color:{T["apoio"]};border-top:1px solid {T["line"]};padding-top:10px">'
                 f'Título 900 · {T["tit"].upper()} — destaque {T["dest"].upper()}<br>Texto {T["txt"].upper()} — apoio {T["apoio"].upper()}</div></div>')
    return page("Tipografia nos temas", n, h1("A mesma hierarquia nos quatro fundos", "margin-bottom:16px") + f'<div style="display:flex;gap:18px">{cols}</div>'
                + cap("Kicker Figtree 700 caixa alta · título Gabarito 900 (aperto −3,5%) · subtítulo Gabarito 800 · texto Figtree 400 · apoio Figtree 500. No rosa, texto e apoio sobem para 20 px.", MUTED, "font-size:16px;margin-top:14px"),
                pad="padding-top:80px")


# ------------------------------------------------------------------ redes
def post(s, w, h, kicker, titulo, apoio, cta=None, extra=None, tsize=None, logo_pos="top"):
    T = TEMAS[s]
    k = w / 1080
    ts = tsize or round(112 * k)
    lgo = lg("horizontal", T["logo"], round(46 * k))
    return (f'<div style="width:{w}px;height:{h}px;background:{T["bg"]};border-radius:{round(26 * k * 1.6)}px;padding:{round(70 * k)}px;display:flex;flex-direction:column;'
            f'justify-content:space-between;overflow:hidden;position:relative;flex:none;{"box-shadow:inset 0 0 0 1px " + TEMAS["branco"]["line"] + ";" if s == "branco" else ""}">'
            f'<div style="display:flex;justify-content:space-between;align-items:center">{lgo}<span style="font:700 {round(26 * k)}px Figtree;letter-spacing:.1em;color:{T["apoio"]}">{kicker}</span></div>'
            f'{extra or ""}'
            f'<div><div style="font:900 {ts}px/.95 Gabarito;letter-spacing:-.035em;color:{T["tit"]}">{titulo}</div>'
            f'<div style="font:400 {max(round(38 * k), 12)}px/1.35 Figtree;color:{T["apoio"]};margin-top:{round(24 * k)}px">{apoio}</div>'
            + (f'<div style="margin-top:{round(36 * k)}px">{btn(T, cta, h=round(96 * k), fs=round(36 * k))}</div>' if cta else "") + '</div></div>')


def p_posts(n):
    W, H = 345, 500
    d = lambda s, w: f'<span style="color:{TEMAS[s]["dest"]}">{w}</span>'
    ps = [("preto", "SEXTA · 20H", f"Chega mais<br>{d('preto', 'perto.')}", "Conteúdo novo toda sexta, só no meu close.", "Link na bio"),
          ("rosa", "CLOZZY", "Seu close,<br>seu preço.", "Pago no Pix. Liberado na hora.", "Criar meu close"),
          ("roxo", "DROP", f"Drop de<br>{d('roxo', 'sexta.')}", "12 fotos · 3 vídeos · R$ 29,90", "Garantir o meu"),
          ("branco", "PARA CRIADORES", f"Você só paga<br>{d('branco', 'se vender.')}", "Sem mensalidade. Taxa só na venda.", "Abrir meu close")]
    cards = "".join(f'<div>{post(s, W, H, k, t, a, c, tsize=46)}{cap("Feed 4:5 · tema " + TEMAS[s]["nome"].lower())}</div>' for s, k, t, a, c in ps)
    return page("Posts do feed", n, h1("Um tema por post", "margin-bottom:6px")
                + lead("Logo no topo, título embaixo, uma ação. A grade do perfil alterna neutro e cor (veja Perfil e destaques).", extra="margin-bottom:20px")
                + f'<div style="display:flex;gap:22px">{cards}</div>', pad="padding-top:80px")


def p_formatos(n):
    S = 330
    T = TEMAS
    preco = post("preto", S, S, "PACK", f'R$ <span style="color:{PINK}">29,90</span>', "Pack Verão · 12 fotos · 3 vídeos", None, tsize=72)
    dep_T = T["branco"]
    depo = (f'<div style="width:{S}px;height:{S}px;background:{WHITE};border-radius:24px;padding:26px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:inset 0 0 0 1px {dep_T["line"]}">'
            f'<div style="font:900 80px/.6 Gabarito;color:{DEEP}">“</div><div style="font:800 25px/1.2 Gabarito;letter-spacing:-.02em;color:{INK}">Mandei o link no story e vendi 40 packs no primeiro dia.</div>'
            f'<div style="display:flex;align-items:center;gap:10px">{avatar(dep_T, 42, seed=3)}<div><div style="font:800 14px Gabarito">Bia Rocha</div><div style="font:500 12px Figtree;color:{MUTED}">criadora desde março</div></div>'
            f'<div style="margin-left:auto">{sym("branco", 30)}</div></div></div>')
    num = post("roxo", S, S, "PARA CRIADORES", "R$ 0", "pra abrir seu close. Taxa só quando vender.", None, tsize=130)
    rec = post("rosa", S, S, "NOVO", "Agora com<br>canal.", "Mande drops e avisos só pra quem tá no close.", None, tsize=64)
    cards = "".join(f'<div>{c}{cap(l)}</div>' for c, l in ((preco, "Preço · preto, valor em rosa"), (depo, "Depoimento · branco, aspas Pink Deep"),
                                                            (num, "Número · roxo, tudo branco"), (rec, "Novidade · rosa, tudo branco")))
    regras = [("Quadrado 1:1", "1080 × 1080 · margem 70 px · logo 46 px de altura."), ("Retrato 4:5", "1080 × 1350 · o padrão do feed."),
              ("Título", "até 6 palavras, 2 linhas. Uma palavra pode ir na cor de destaque."), ("Foto", "se a peça tem foto, o texto vai numa faixa do tema, nunca solto em cima da imagem.")]
    return page("Formatos de post", n, h1("Preço, depoimento, número, novidade", "margin-bottom:18px") + f'<div style="display:flex;gap:28px">{cards}</div>'
                + f'<div style="display:flex;gap:30px;margin-top:26px">' + "".join(
                    f'<div style="flex:1;border-top:3px solid {INK};padding-top:10px"><b style="font:800 19px Gabarito">{a}</b><div style="font:500 15px/1.4 Figtree;margin-top:4px">{b}</div></div>' for a, b in regras) + '</div>',
                pad="padding-top:80px")


def p_carrossel(n):
    S = 272
    sl = [("preto", "1/5", f'Como vender<br>seu pack em<br><span style="color:{PINK}">3 passos.</span>', "arrasta pro lado →"),
          ("rosa", "2/5", "1. Sobe o<br>conteúdo.", "Fotos e vídeos, do celular."),
          ("branco", "3/5", f'2. Define<br>o <span style="color:{DEEP}">preço.</span>', "Você decide quanto vale."),
          ("roxo", "4/5", "3. Manda<br>o link.", "No story, na bio, no direct."),
          ("preto", "5/5", f'Pago no Pix,<br><span style="color:{PINK}">na hora.</span>', "clozzy.com")]
    row = "".join(f'<div>{post(s, S, S, k, t, a, None, tsize=36)}{cap("tema " + TEMAS[s]["nome"].lower())}</div>' for s, k, t, a in sl)
    bad = "".join(f'<div style="width:120px;height:120px;border-radius:16px;background:{TEMAS[s]["bg"]};{"box-shadow:inset 0 0 0 1px " + TEMAS["branco"]["line"] + ";" if s == "branco" else ""}"></div>' for s in ("preto", "rosa", "roxo", "branco", "preto"))
    return page("Carrossel", n, h1("Cinco slides, rosa e roxo nunca colados", "margin-bottom:18px") + f'<div style="display:flex;gap:16px">{row}</div>'
                + f'<div style="display:flex;gap:60px;margin-top:30px;align-items:center"><div style="position:relative;display:flex;gap:6px;padding-right:40px">{bad}{mark(False, WHITE)}</div>'
                f'<div style="flex:1;font:500 19px/1.45 Figtree"><b style="font:800 21px Gabarito">Ritmo:</b> capa e fecho no preto; os passos alternam cor e neutro. '
                f'O logo fica só na capa e no último slide, nos do meio aparece o contador. Rosa → roxo direto (ao lado) é proibido.</div></div>', pad="padding-top:80px")


def story(s, w, h, inner):
    T = TEMAS[s]
    return (f'<div style="width:{w}px;height:{h}px;background:{T["bg"]};border-radius:26px;position:relative;overflow:hidden;flex:none;color:{T["tit"]};'
            f'{"box-shadow:inset 0 0 0 1px " + TEMAS["branco"]["line"] + ";" if s == "branco" else ""}">'
            f'<div style="position:absolute;left:12px;right:12px;top:10px;display:flex;gap:4px">' + "".join(
                f'<div style="flex:1;height:3px;border-radius:3px;background:{T["tit"]};opacity:{1 if i == 0 else .35}"></div>' for i in range(3)) + '</div>'
            f'<div style="position:absolute;inset:26px 22px 26px">{inner}</div></div>')


def p_stories(n):
    W, H = 262, 466
    P, B, R, X = TEMAS["preto"], TEMAS["branco"], TEMAS["roxo"], TEMAS["rosa"]
    cont = "".join(f'<div style="text-align:center"><div style="width:52px;height:58px;border-radius:12px;background:{P["card"]};font:900 32px/58px Gabarito;color:{WHITE}">{v}</div>'
                   f'<div style="font:600 11px Figtree;color:{P["apoio"]};margin-top:4px">{u}</div></div>' for v, u in (("04", "h"), ("12", "min"), ("38", "s")))
    s1 = story("preto", W, H, f'<div style="display:flex;flex-direction:column;justify-content:space-between;height:100%">{lg("horizontal", "preto", 22)}'
               f'<div><div style="font:900 46px/.95 Gabarito;letter-spacing:-.03em">Drop<br>hoje,<br><span style="color:{PINK}">20h.</span></div>'
               f'<div style="display:flex;gap:8px;margin-top:16px">{cont}</div></div>'
               f'<div style="display:flex;justify-content:center">{btn(P, "Me avisa", h=44, fs=15, icon="bell")}</div></div>')
    s2 = story("rosa", W, H, f'<div style="display:flex;flex-direction:column;justify-content:space-between;height:100%">{lg("horizontal", "rosa", 22)}'
               f'<div><div style="font:900 52px/.95 Gabarito;letter-spacing:-.03em">Liberado.</div><div style="font:500 20px/1.3 Figtree;margin-top:10px">Tá na sua biblioteca.</div></div>'
               f'<div style="display:flex;justify-content:center">{btn(X, "Ver agora", h=44, fs=15)}</div></div>')
    opc = "".join(f'<div style="height:44px;border-radius:14px;background:{WHITE if i == 0 else R["card"]};color:{PURPLE if i == 0 else WHITE};display:flex;align-items:center;'
                  f'justify-content:space-between;padding:0 14px;font:800 15px Gabarito"><span>{a}</span><span>{b}</span></div>' for i, (a, b) in enumerate((("Praia", "62%"), ("Bastidor", "38%"))))
    s3 = story("roxo", W, H, f'<div style="display:flex;flex-direction:column;justify-content:space-between;height:100%">{lg("horizontal", "roxo", 22)}'
               f'<div><div style="font:900 38px/.98 Gabarito;letter-spacing:-.03em">Qual o<br>próximo<br>pack?</div>'
               f'<div style="display:flex;flex-direction:column;gap:8px;margin-top:16px">{opc}</div></div>'
               f'<div style="font:500 13px Figtree;color:{LAV};text-align:center">só quem tá no close vota</div></div>')
    sticker = (f'<div style="display:inline-flex;align-items:center;gap:8px;height:42px;padding:0 16px;border-radius:12px;background:{WHITE};box-shadow:0 2px 0 rgba(20,9,15,.12),inset 0 0 0 1.5px {B["line"]};'
               f'font:800 15px Gabarito;color:{DEEP}">{ic("link", 18, DEEP)}clozzy.com/lara</div>')
    s4 = story("branco", W, H, f'<div style="display:flex;flex-direction:column;justify-content:space-between;height:100%">{lg("horizontal", "branco", 22)}'
               f'<div>{foto(B, 218, 170, 18, seed=1)}<div style="font:900 36px/.98 Gabarito;letter-spacing:-.03em;color:{INK};margin-top:16px">Pack novo<br>no <span style="color:{DEEP}">close.</span></div></div>'
               f'<div style="display:flex;justify-content:center">{sticker}</div></div>')
    cards = "".join(f'<div>{c}{cap(l)}</div>' for c, l in ((s1, "Contagem · preto"), (s2, "Confirmação · rosa"), (s3, "Enquete · roxo"), (s4, "Link · branco")))
    regras = [("Zona segura", "1080 × 1920: 250 px livres em cima e embaixo para a interface do story."),
              ("Sticker de link", "sempre branco com texto Pink Deep, em qualquer tema."),
              ("Foto", "fica num cartão com cantos redondos; o texto fica no tema, fora da foto.")]
    return page("Stories", n, f'<div style="display:flex;gap:46px;align-items:flex-start"><div style="display:flex;gap:20px">{cards}</div>'
                f'<div style="flex:1">{h1("Stories 9:16")}' + "".join(
                    f'<div style="border-top:3px solid {INK};padding:10px 0 16px"><b style="font:800 20px Gabarito">{a}</b><div style="font:500 16px/1.4 Figtree;margin-top:4px">{b}</div></div>' for a, b in regras)
                + '</div></div>', pad="padding-top:80px")


def p_perfil(n):
    TEMAS_PAGE_DARK[0] = True
    P = TEMAS["preto"]
    hl = [("rosa", "Packs", "lib"), ("preto", "Drops", "clock"), ("roxo", "Como compra", "pix"), ("branco", "Depoimentos", "chat")]
    hls = "".join(f'<div style="text-align:center;width:58px"><div style="width:56px;height:56px;border-radius:50%;background:{TEMAS[s]["bg"]};box-shadow:0 0 0 2px {INK},0 0 0 3px rgba(255,255,255,.35);'
                  f'display:flex;align-items:center;justify-content:center;color:{TEMAS[s]["dest"] if s in ("preto", "branco") else WHITE}">{ic(i, 24)}</div>'
                  f'<div style="font:500 10px Figtree;color:{WHITE};margin-top:5px;white-space:nowrap">{nm}</div></div>' for s, nm, i in hl)
    grade_s = ["preto", "branco", "rosa", "branco", "preto", "branco", "roxo", "branco", "preto"]
    tits = ["Chega<br>mais perto.", "Você só<br>paga se<br>vender.", "Seu close,<br>seu preço.", "“Vendi 40<br>no 1º dia”", "R$<br>29,90", "Como<br>funciona", "Drop de<br>sexta.", "Sem<br>mensal.", "Pix na<br>hora."]
    grade = "".join(f'<div style="width:89px;height:111px;background:{TEMAS[s]["bg"]};padding:8px;display:flex;flex-direction:column;justify-content:space-between;'
                    f'{"box-shadow:inset 0 0 0 1px " + TEMAS["branco"]["line"] + ";" if s == "branco" else ""}">'
                    f'<div>{sym(TEMAS[s]["logo"], 12)}</div><div style="font:900 12px/1 Gabarito;color:{TEMAS[s]["tit"]}">{t}</div></div>' for s, t in zip(grade_s, tits))
    inner = (f'<div style="padding:6px 16px 0;display:flex;justify-content:space-between;align-items:center;font:800 16px Gabarito">clozzy.app {ic("bell", 20)}</div>'
             f'<div style="display:flex;align-items:center;gap:16px;padding:12px 16px">'
             f'<div style="width:78px;height:78px;border-radius:50%;overflow:hidden;flex:none">{M.tile_svg("rosa", 78, radius=0, scale=.58)}</div>'
             f'<div style="display:flex;gap:18px;font:500 11px Figtree;text-align:center">' + "".join(f'<div><b style="font:800 15px Gabarito;display:block">{a}</b>{b}</div>' for a, b in (("214", "posts"), ("48 mil", "seguidores"), ("12", "seguindo"))) + '</div></div>'
             f'<div style="padding:0 16px;font:500 12px/1.4 Figtree"><b style="font:800 13px Gabarito">clozzy</b><br>Seu close, seu preço. Pago no Pix, liberado na hora.<br><span style="color:{PINK};font-weight:700">clozzy.com</span></div>'
             f'<div style="display:flex;gap:12px;padding:14px 16px 12px">{hls}</div>'
             f'<div style="display:grid;grid-template-columns:repeat(3,89px);gap:2px;padding:0 3px;justify-content:center">{grade}</div>')
    ph = phone(inner, P, 290, 640, frame="rgba(255,255,255,.28)")
    TEMAS_PAGE_DARK[0] = False
    avs = "".join(f'<div style="text-align:center"><div style="width:120px;height:120px;border-radius:50%;overflow:hidden;{"box-shadow:inset 0 0 0 1px rgba(255,255,255,.3);" if s == "preto" else ""}">'
                  f'{M.tile_svg(s, 120, radius=0, scale=.58)}</div>{cap(l, P["apoio"])}</div>' for s, l in (("rosa", "Perfil principal"), ("preto", "Conta de suporte"), ("roxo", "Conta de criadores")))
    regras = [("Avatar", "símbolo a 58% no rosa. Uma cor por conta; não troque com campanha."),
              ("Destaques", "capa chapada do tema com ícone de linha; rosa e roxo nunca vizinhos."),
              ("Grade", "xadrez: post de cor (preto, rosa, roxo) cercado de branco. Rosa e roxo nunca se tocam, nem na diagonal.")]
    return page("Perfil e destaques", n, f'<div style="display:flex;gap:70px;align-items:center;height:100%">{ph}'
                f'<div style="flex:1">{h1("O perfil da marca")}<div style="display:flex;gap:28px;margin:6px 0 24px">{avs}</div>'
                + "".join(f'<div style="border-top:1px solid {P["line"]};padding:12px 0"><b style="font:800 20px Gabarito">{a}</b><div style="font:500 17px/1.4 Figtree;color:{P["txt"]};margin-top:3px">{b}</div></div>' for a, b in regras)
                + '</div></div>', "preto")


# ------------------------------------------------------------------ landing page
def lp_html():
    P, B, R, X = TEMAS["preto"], TEMAS["branco"], TEMAS["roxo"], TEMAS["rosa"]
    TEMAS_PAGE_DARK[0] = True
    hero_phone = phone(s_feed(P), P, 330, 660, frame="rgba(255,255,255,.22)")
    TEMAS_PAGE_DARK[0] = False
    nav = (f'<div style="display:flex;align-items:center;justify-content:space-between;padding:34px 90px">{lg("horizontal", "preto", 40)}'
           f'<div style="display:flex;gap:40px;align-items:center;font:600 20px Figtree;color:{P["txt"]}"><span>Como funciona</span><span>Para criadores</span><span>Preços</span><span>Entrar</span>'
           f'{btn(P, "Criar meu close", h=52, fs=19)}</div></div>')
    hero = (f'<div style="background:{INK};height:760px;overflow:hidden">{nav}<div style="display:flex;padding:40px 90px 0;gap:80px;align-items:flex-start">'
            f'<div style="flex:1;padding-top:40px">{badge(P, "conteúdo exclusivo, direto do criador", 18)}'
            f'<div style="font:900 128px/.92 Gabarito;letter-spacing:-.04em;color:{WHITE};margin-top:26px">Seu close,<br><span style="color:{PINK}">seu preço.</span></div>'
            f'<div style="font:400 28px/1.4 Figtree;color:{P["apoio"]};margin-top:26px;max-width:640px">Venda packs, drops e o seu canal pra quem te segue de perto. Pago no Pix, liberado na hora.</div>'
            f'<div style="display:flex;gap:16px;margin-top:38px">{btn(P, "Criar meu close", h=64, fs=23)}{btn(P, "Sou fã, quero entrar", "sec", h=64, fs=21)}</div></div>'
            f'<div style="padding-top:10px">{hero_phone}</div></div></div>')
    passos = [("1", "Sobe o conteúdo", "Fotos, vídeos e áudio, direto do celular."), ("2", "Define o preço", "Pack avulso, drop ou o close mensal. Você decide."),
              ("3", "Manda o link", "No story, na bio, no direct. O fã paga no Pix e recebe na hora.")]
    como = (f'<div style="background:{WHITE};height:600px;padding:100px 90px"><div style="font:700 18px Figtree;letter-spacing:.14em;color:{DEEP}">COMO FUNCIONA</div>'
            f'<div style="font:900 72px/1 Gabarito;letter-spacing:-.035em;color:{INK};margin-top:12px">Três passos e tá no ar.</div>'
            f'<div style="display:flex;gap:28px;margin-top:50px">' + "".join(
                f'<div style="flex:1;background:{CREAM};border-radius:28px;padding:36px"><div style="font:900 64px/1 Gabarito;color:{DEEP}">{a}</div>'
                f'<div style="font:800 30px Gabarito;color:{INK};margin-top:18px">{b}</div><div style="font:400 21px/1.45 Figtree;color:{MUTED};margin-top:8px">{c}</div></div>' for a, b, c in passos) + '</div></div>')
    faixa = (f'<div style="background:{PINK};height:380px;padding:0 90px;display:flex;align-items:center;justify-content:space-between">'
             f'<div><div style="font:900 96px/.95 Gabarito;letter-spacing:-.04em;color:{WHITE}">Pago no Pix.<br>Liberado na hora.</div></div>'
             f'<div style="display:flex;flex-direction:column;gap:14px;align-items:flex-end">{btn(X, "Criar meu close", h=68, fs=24)}'
             f'<div style="font:500 22px Figtree;color:{WHITE}">sem mensalidade · taxa só na venda</div></div></div>')
    criadoras = "".join(f'<div style="flex:1;background:{P["card"]};border-radius:26px;overflow:hidden">{foto(P, "100%", 250, 0, seed=i)}'
                        f'<div style="padding:22px"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font:800 26px Gabarito;color:{WHITE}">{nm}</span>{badge(P, "exclusivo", 13)}</div>'
                        f'<div style="font:500 18px Figtree;color:{P["apoio"]};margin-top:4px">{d}</div><div style="font:900 26px Gabarito;color:{PINK};margin-top:10px">{pr}</div></div></div>'
                        for i, (nm, d, pr) in enumerate((("Lara", "fotografia · praia", "R$ 19,90/mês"), ("Duda", "bastidor de ensaio", "R$ 14,90/mês"), ("Mel", "áudio e canal", "R$ 9,90/mês"), ("Bia", "packs semanais", "R$ 24,90/mês"))))
    vitrine = (f'<div style="background:{INK};height:640px;padding:100px 90px"><div style="display:flex;justify-content:space-between;align-items:flex-end">'
               f'<div style="font:900 72px/1 Gabarito;letter-spacing:-.035em;color:{WHITE}">Quem já tá<br>no <span style="color:{PINK}">close.</span></div>{btn(P, "Ver todos", "link", h=50, fs=22)}</div>'
               f'<div style="display:flex;gap:24px;margin-top:46px">{criadoras}</div></div>')
    planos = (f'<div style="background:{PURPLE};height:580px;padding:100px 90px;display:flex;gap:80px;align-items:center">'
              f'<div style="flex:1"><div style="font:700 18px Figtree;letter-spacing:.14em;color:{LAV}">PARA CRIADORES</div>'
              f'<div style="font:900 84px/.95 Gabarito;letter-spacing:-.04em;color:{WHITE};margin-top:14px">Você só paga<br>se vender.</div>'
              f'<div style="font:400 24px/1.45 Figtree;color:{LAV};margin-top:20px;max-width:560px">Abrir o close é grátis. A taxa sai só quando entra dinheiro, e o saque cai no seu Pix.</div></div>'
              f'<div style="width:520px;background:{R["card"]};border-radius:30px;padding:40px"><div style="font:800 26px Gabarito;color:{WHITE}">Taxa por venda</div>'
              f'<div style="font:900 110px/1 Gabarito;letter-spacing:-.04em;color:{WHITE};margin-top:6px">10%</div>'
              + "".join(f'<div style="display:flex;gap:12px;align-items:center;font:500 21px Figtree;color:{WHITE};padding:9px 0;border-top:1px solid {R["line"]}">{ic("check", 22, LAV, 2.6)}{t}</div>'
                        for t in ("R$ 0 de mensalidade", "Saque no Pix em 1 dia útil", "Link próprio: clozzy.com/você"))
              + f'<div style="margin-top:24px">{btn(R, "Abrir meu close", h=62, fs=22, w=440)}</div></div></div>')
    faq_q = ["Aparece clozzy no extrato?", "Quanto tempo o Pix demora?", "Dá pra comprar sem conta?", "Posso mudar o preço depois?"]
    faq = (f'<div style="background:{WHITE};height:420px;padding:90px 90px;display:flex;gap:90px">'
           f'<div style="font:900 64px/1 Gabarito;letter-spacing:-.035em;color:{INK};width:420px">Perguntas<br>rápidas</div><div style="flex:1">'
           + "".join(f'<div style="display:flex;justify-content:space-between;padding:20px 0;border-top:1px solid {B["line"]};font:700 25px Figtree;color:{INK}">{q}<span style="color:{DEEP}">+</span></div>' for q in faq_q)
           + '</div></div>')
    foot = (f'<div style="background:{INK};height:300px;padding:70px 90px;display:flex;justify-content:space-between">'
            f'<div>{lg("horizontal", "preto", 44)}<div style="font:500 19px Figtree;color:{P["apoio"]};margin-top:20px">Seu close, seu preço.</div></div>'
            f'<div style="display:flex;gap:80px;font:500 19px/2 Figtree;color:{P["apoio"]}">'
            + "".join(f'<div><b style="font:800 20px Gabarito;color:{WHITE}">{t}</b><br>{"<br>".join(l)}</div>' for t, l in (("Produto", ("Como funciona", "Preços", "Para criadores")), ("Ajuda", ("Central", "Termos", "Privacidade")), ("Redes", ("Instagram", "TikTok", "X"))))
            + '</div></div>')
    secs = [(hero, "preto", 760), (como, "branco", 600), (faixa, "rosa", 380), (vitrine, "preto", 640), (planos, "roxo", 580), (faq, "branco", 420), (foot, "preto", 300)]
    return f'<div style="width:1440px">{"".join(s for s, _, _ in secs)}</div>', secs


def p_landing(n):
    html, secs = lp_html()
    total = sum(h for _, _, h in secs)
    colh = total / 2
    k = 700 / colh
    cols = ""
    for i in range(2):
        cols += (f'<div style="width:{1440 * k:.0f}px;height:{colh * k + 1:.0f}px;overflow:hidden;border-radius:14px;box-shadow:0 0 0 1px rgba(20,9,15,.14);position:relative;flex:none">'
                 f'<div style="width:1440px;transform-origin:0 0;transform:scale({k}) translateY(-{i * colh}px)">{html}</div></div>')
    mapa, y = "", 0
    for _, s, h in secs:
        T = TEMAS[s]
        mapa += (f'<div style="height:{h * .1:.0f}px;border-radius:6px;background:{T["bg"]};{"box-shadow:inset 0 0 0 1px " + TEMAS["branco"]["line"] + ";" if s == "branco" else ""}'
                 f'margin-bottom:3px;display:flex;align-items:center;padding:0 10px;font:700 12px Figtree;color:{T["tit"]}">{T["nome"]}</div>')
        y += h
    nomes = ["Hero · preto", "Como funciona · branco", "Faixa de CTA · rosa", "Vitrine · preto", "Para criadores · roxo", "FAQ · branco", "Rodapé · preto"]
    lista = "".join(f'<div style="font:500 15px/1.35 Figtree;padding:5px 0;border-top:1px solid {TEMAS["branco"]["line"]}">{t}</div>' for t in nomes)
    return page("Landing page", n, f'<div style="display:flex;gap:26px;align-items:flex-start;margin-top:-24px">{cols}'
                f'<div style="flex:1"><div style="font:900 32px/1.05 Gabarito;letter-spacing:-.03em;margin-bottom:12px">Desktop 1440</div>'
                f'<div style="width:90px">{mapa}</div><div style="margin-top:10px">{lista}</div>'
                f'<div style="font:500 14px/1.45 Figtree;color:{MUTED};margin-top:12px">{total} px de altura. Começa e termina no preto; o rosa só numa faixa curta de CTA; o roxo fica na seção do criador, separado do rosa pela vitrine preta.</div></div></div>')


def p_landing_mobile(n):
    TEMAS_PAGE_DARK[0] = True
    P, R, X = TEMAS["preto"], TEMAS["roxo"], TEMAS["rosa"]
    m1 = (f'<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 18px">{lg("horizontal", "preto", 22)}<div style="color:{WHITE};font:900 22px Gabarito">≡</div></div>'
          f'<div style="padding:26px 18px 0">{badge(P, "conteúdo exclusivo", 11)}<div style="font:900 52px/.92 Gabarito;letter-spacing:-.04em;color:{WHITE};margin-top:16px">Seu close,<br><span style="color:{PINK}">seu preço.</span></div>'
          f'<div style="font:400 15px/1.45 Figtree;color:{P["apoio"]};margin-top:14px">Venda packs, drops e o seu canal pra quem te segue de perto.</div>'
          f'<div style="display:flex;flex-direction:column;gap:10px;margin-top:22px">{btn(P, "Criar meu close", h=50, fs=17)}{btn(P, "Sou fã, quero entrar", "sec", h=46, fs=15)}</div>'
          f'<div style="margin-top:22px">{foto(P, 264, 160, 18, locked=True, seed=1, label="Pack Verão · R$ 29,90")}</div></div>')
    m2 = (f'<div style="background:{PINK};padding:30px 20px 26px"><div style="font:900 38px/.95 Gabarito;letter-spacing:-.035em;color:{WHITE}">Pago no Pix.<br>Liberado na hora.</div>'
          f'<div style="margin-top:18px">{btn(X, "Criar meu close", h=48, fs=16, w=220)}</div></div>'
          f'<div style="background:{INK};padding:26px 20px;flex:1"><div style="font:900 30px/1 Gabarito;letter-spacing:-.03em;color:{WHITE}">Quem já tá<br>no <span style="color:{PINK}">close.</span></div>'
          f'<div style="display:flex;gap:10px;margin-top:16px">' + "".join(f'<div style="flex:1;background:{P["card"]};border-radius:16px;overflow:hidden">{foto(P, "100%", 110, 0, seed=i)}'
                                                                       f'<div style="padding:10px;font:800 14px Gabarito;color:{WHITE}">{nm}<div style="font:900 13px Gabarito;color:{PINK};margin-top:2px">{pr}</div></div></div>'
                                                                       for i, (nm, pr) in enumerate((("Lara", "R$ 19,90"), ("Duda", "R$ 14,90")))) + '</div></div>')
    m3 = (f'<div style="background:{PURPLE};padding:26px 20px;flex:1"><div style="font:700 11px Figtree;letter-spacing:.14em;color:{LAV}">PARA CRIADORES</div>'
          f'<div style="font:900 40px/.95 Gabarito;letter-spacing:-.035em;color:{WHITE};margin-top:8px">Você só paga<br>se vender.</div>'
          f'<div style="background:{R["card"]};border-radius:20px;padding:20px;margin-top:20px"><div style="font:800 15px Gabarito;color:{WHITE}">Taxa por venda</div>'
          f'<div style="font:900 60px/1 Gabarito;color:{WHITE}">10%</div>'
          + "".join(f'<div style="display:flex;gap:8px;align-items:center;font:500 13px Figtree;color:{WHITE};padding:6px 0;border-top:1px solid {R["line"]}">{ic("check", 15, LAV, 2.6)}{t}</div>' for t in ("R$ 0 de mensalidade", "Saque no Pix em 1 dia útil"))
          + f'<div style="margin-top:14px">{btn(R, "Abrir meu close", h=46, fs=15, w=224)}</div></div></div>'
          f'<div style="background:{WHITE};padding:20px;height:120px"><div style="font:900 24px Gabarito;color:{INK}">Perguntas rápidas</div>'
          f'<div style="font:700 14px Figtree;color:{INK};padding:10px 0;border-top:1px solid {TEMAS["branco"]["line"]};margin-top:10px;display:flex;justify-content:space-between">Aparece clozzy no extrato?<span style="color:{DEEP}">+</span></div></div>')
    phs = "".join(f'<div>{phone(c, P, 300, 620, frame="rgba(255,255,255,.28)")}{cap(l, P["apoio"])}</div>' for c, l in ((m1, "Hero · preto"), (m2, "CTA rosa → vitrine preta"), (m3, "Criadores roxo → FAQ branco")))
    TEMAS_PAGE_DARK[0] = False
    regras = [("No celular", "mesma ordem do desktop; o hero vira coluna e o botão ocupa a largura."), ("Botão fixo", "a partir da 2ª dobra, barra preta embaixo com o botão branco Criar meu close."),
              ("Ritmo", "nunca duas seções de cor seguidas; preto ou branco entre elas.")]
    return page("Landing no celular", n, f'<div style="display:flex;gap:40px;align-items:center;height:100%"><div style="display:flex;gap:34px">{phs}</div>'
                f'<div style="flex:1">{h1("Landing 390")}' + "".join(
                    f'<div style="border-top:1px solid {P["line"]};padding:12px 0"><b style="font:800 20px Gabarito">{a}</b><div style="font:500 16px/1.4 Figtree;color:{P["txt"]};margin-top:3px">{b}</div></div>' for a, b in regras)
                + '</div></div>', "preto")


# ------------------------------------------------------------------ app
def p_app(n, s, titulo, nota):
    T = TEMAS[s]
    TEMAS_PAGE_DARK[0] = T["dark"]
    telas = [(s_feed(T), "Início"), (s_perfil(T), "Perfil do criador"), (s_checkout(T), "Pix"), (s_biblioteca(T), "Biblioteca")]
    row = "".join(f'<div>{phone(c, T, 300, 640)}{cap(l, T["apoio"])}</div>' for c, l in telas)
    TEMAS_PAGE_DARK[0] = False
    return page(titulo, n, f'<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:22px">{h1(titulo, "margin:0")}'
                f'<div style="font:500 17px/1.4 Figtree;max-width:620px;text-align:right;color:{T["apoio"]}">{nota}</div></div>'
                f'<div style="display:flex;gap:44px;justify-content:center">{row}</div>', s, pad="padding-top:70px")


def p_momentos(n):
    TEMAS_PAGE_DARK[0] = True
    telas = [(s_splash(TEMAS["preto"]), "preto", "Splash · preto"), (s_sucesso(TEMAS["rosa"]), "rosa", "Pagamento aprovado · rosa"),
             (s_onboarding(TEMAS["roxo"]), "roxo", "Abrir o close · roxo"), (s_carteira(TEMAS["branco"]), "branco", "Carteira · branco")]
    row = "".join(f'<div>{phone(c, TEMAS[s], 300, 640, frame="rgba(255,255,255,.28)")}{cap(l, TEMAS["preto"]["apoio"])}</div>' for c, s, l in telas)
    TEMAS_PAGE_DARK[0] = False
    return page("Momentos de cor no app", n, f'<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:22px">{h1("Momentos de cor", "margin:0")}'
                f'<div style="font:500 17px/1.4 Figtree;max-width:640px;text-align:right;color:{TEMAS["preto"]["apoio"]}">O app vive no preto (ou no branco). Rosa e roxo entram em telas inteiras, '
                f'curtas e com propósito: rosa = deu certo; roxo = área do criador; branco = dinheiro e leitura.</div></div>'
                f'<div style="display:flex;gap:44px;justify-content:center">{row}</div>', "preto", pad="padding-top:70px")


# ------------------------------------------------------------------ outros
def p_email(n):
    B, P = TEMAS["branco"], TEMAS["preto"]
    email = (f'<div style="width:520px;border-radius:20px;overflow:hidden;box-shadow:0 0 0 1px {B["line"]};background:{WHITE};flex:none">'
             f'<div style="background:{INK};padding:22px 30px">{lg("horizontal", "preto", 28)}</div>'
             f'<div style="padding:30px"><div style="font:900 40px/1 Gabarito;letter-spacing:-.03em;color:{INK}">Seu Pix caiu.<br><span style="color:{DEEP}">Tá liberado.</span></div>'
             f'<div style="font:400 17px/1.5 Figtree;color:{INK};margin-top:14px">Oi, Rafa! O Pack Verão da Lara já tá na sua biblioteca. É só tocar no botão.</div>'
             f'<div style="margin-top:20px">{btn(B, "Abrir minha biblioteca", h=50, fs=17)}</div>'
             f'<div style="margin-top:24px;background:{CREAM};border-radius:14px;padding:16px 18px">' + "".join(
                 f'<div style="display:flex;justify-content:space-between;font:{"800 16px Gabarito" if i == 2 else "500 15px Figtree"};color:{INK};padding:5px 0">'
                 f'<span>{a}</span><span>{b}</span></div>' for i, (a, b) in enumerate((("Pack Verão · Lara Mendes", "R$ 29,90"), ("Pago no Pix", "11/11 · 14:02"), ("Total", "R$ 29,90"))))
             + f'</div><div style="font:500 13px/1.5 Figtree;color:{MUTED};margin-top:20px">No extrato aparece “clozzy”. Dúvida? Responde este e-mail.</div></div></div>')
    notif = lambda t, b, h: (f'<div style="background:rgba(255,255,255,.14);border-radius:18px;padding:12px;display:flex;gap:10px;align-items:flex-start">'
                             f'{tile("rosa", 34, 8)}<div style="flex:1"><div style="display:flex;justify-content:space-between;font:700 12px Figtree;color:{WHITE}"><span>clozzy</span><span style="opacity:.6">{h}</span></div>'
                             f'<div style="font:700 13px Figtree;color:{WHITE};margin-top:2px">{t}</div><div style="font:400 12px/1.35 Figtree;color:rgba(255,255,255,.85)">{b}</div></div></div>')
    lock = (f'<div style="width:290px;height:560px;border-radius:40px;background:#000;box-shadow:0 0 0 7px rgba(20,9,15,.16);padding:60px 14px;flex:none;color:{WHITE}">'
            f'<div style="text-align:center;font:300 64px/1 Figtree">9:41</div><div style="text-align:center;font:500 14px Figtree;opacity:.8;margin-bottom:26px">terça, 11 de novembro</div>'
            f'<div style="display:flex;flex-direction:column;gap:8px">{notif("Liberado ✓", "Pack Verão tá na sua biblioteca.", "agora")}'
            f'{notif("Drop da Lara em 1 h", "Sexta, 20h. Quem tá no close vê primeiro.", "19:00")}{notif("Você vendeu R$ 29,90", "Pack Verão · cai no Pix amanhã.", "14:02")}</div></div>')
    og = (f'<div style="width:420px;border-radius:18px;overflow:hidden;background:#E9E3DF;flex:none">'
          f'<div style="width:420px;height:220px;background:{INK};padding:26px;display:flex;flex-direction:column;justify-content:space-between">{lg("horizontal", "preto", 24)}'
          f'<div style="font:900 44px/.95 Gabarito;letter-spacing:-.03em;color:{WHITE}">Entra pro<br>meu <span style="color:{PINK}">close.</span></div></div>'
          f'<div style="padding:10px 14px;background:#F2EEEB"><div style="font:700 14px Figtree;color:{INK}">Lara Mendes no clozzy</div><div style="font:500 12px Figtree;color:{MUTED}">clozzy.com/lara</div></div></div>')
    regras = [("E-mail", "corpo branco, cabeçalho preto com o logo; botão Pink Deep; recibo em Cream."), ("Push", "título curto com o fato; o ícone rosa é a única cor."),
              ("Prévia de link", "imagem 1200 × 630 no tema preto, título com uma palavra rosa.")]
    return page("E-mail, push e link", n, f'<div style="display:flex;gap:44px;align-items:flex-start">{email}<div>{lock}{cap("Notificações · tela bloqueada")}</div>'
                f'<div style="flex:1">{og}{cap("Prévia no WhatsApp")}<div style="margin-top:20px">' + "".join(
                    f'<div style="border-top:1px solid {B["line"]};padding:10px 0"><b style="font:800 18px Gabarito">{a}</b><div style="font:500 15px/1.4 Figtree;margin-top:3px">{b}</div></div>' for a, b in regras)
                + '</div></div></div>', pad="padding-top:80px")


def ad(s, w, h, titulo, apoio, cta, ts, logo_h, horizontal=False, pad=None):
    T = TEMAS[s]
    pad = pad or round(min(w, h) * .09)
    bd = "box-shadow:inset 0 0 0 1px " + TEMAS["branco"]["line"] + ";" if s == "branco" else ""
    if horizontal:
        return (f'<div style="width:{w}px;height:{h}px;background:{T["bg"]};border-radius:10px;padding:0 {pad}px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex:none;{bd}">'
                f'{lg("horizontal", T["logo"], logo_h)}<div style="font:900 {ts}px/1 Gabarito;letter-spacing:-.02em;color:{T["tit"]};white-space:nowrap">{titulo}</div>'
                f'{btn(T, cta, h=round(h * .5), fs=round(h * .2))}</div>')
    return (f'<div style="width:{w}px;height:{h}px;background:{T["bg"]};border-radius:14px;padding:{pad}px;display:flex;flex-direction:column;justify-content:space-between;flex:none;{bd}">'
            f'{lg("horizontal", T["logo"], logo_h)}<div><div style="font:900 {ts}px/.95 Gabarito;letter-spacing:-.035em;color:{T["tit"]}">{titulo}</div>'
            + (f'<div style="font:400 {max(13, round(ts * .3))}px/1.35 Figtree;color:{T["apoio"]};margin-top:8px">{apoio}</div>' if apoio else "")
            + f'<div style="margin-top:{round(ts * .35)}px">{btn(T, cta, h=round(ts * .85) + 8, fs=round(ts * .3) + 2)}</div></div></div>')


def p_anuncios(n):
    a1 = ad("preto", 560, 293, f'Seu close,<br><span style="color:{PINK}">seu preço.</span>', "Pago no Pix. Liberado na hora.", "Criar meu close", 52, 26)
    a2 = ad("roxo", 300, 300, "Você só paga<br>se vender.", "Taxa só na venda.", "Abrir meu close", 36, 20)
    a3 = ad("rosa", 300, 250, "Drop de<br>sexta.", "R$ 29,90 · no Pix", "Garantir", 40, 18)
    a4 = ad("branco", 728, 90, f'Você só paga <span style="color:{DEEP}">se vender.</span>', "", "Abrir meu close", 26, 26, horizontal=True)
    a5 = ad("preto", 320, 50, "Seu close, seu preço.", "", "Criar", 15, 15, horizontal=True, pad=12)
    a6 = ad("preto", 160, 600, f'Chega<br>mais<br><span style="color:{PINK}">perto.</span>', "Conteúdo novo toda sexta.", "Entrar", 40, 18)
    return page("Anúncios e banners", n, h1("Mídia paga", "margin-bottom:18px")
                + f'<div style="display:flex;gap:30px;align-items:flex-start"><div>{a6}{cap("160 × 600 · preto")}</div><div style="flex:1">'
                f'<div style="display:flex;gap:24px;align-items:flex-start"><div>{a1}{cap("1200 × 628 (a 47%) · feed e link · preto")}</div><div>{a2}{cap("1080 × 1080 (a 28%) · roxo")}</div><div>{a3}{cap("300 × 250 · rosa")}</div></div>'
                f'<div style="display:flex;gap:24px;align-items:flex-end;margin-top:24px"><div>{a4}{cap("728 × 90 · branco")}</div><div>{a5}{cap("320 × 50 · preto")}</div></div>'
                f'<div style="font:500 16px/1.45 Figtree;margin-top:22px;max-width:1080px;color:{MUTED}">Formato pequeno = menos coisa: abaixo de 100 px de altura só logo, uma frase e o botão. '
                f'Em mídia de terceiros, o preto é o padrão (destaca em feed claro e escuro); rosa e roxo para retargeting e campanha.</div></div></div>', pad="padding-top:80px")


def p_impressos(n):
    cv = lambda s, inner: (f'<div style="width:350px;height:200px;border-radius:14px;background:{TEMAS[s]["bg"]};padding:24px;display:flex;flex-direction:column;justify-content:space-between;flex:none;'
                           f'{"box-shadow:inset 0 0 0 1px " + TEMAS["branco"]["line"] + ";" if s == "branco" else ""}color:{TEMAS[s]["tit"]}">{inner}</div>')
    frente = cv("preto", f'{lg("horizontal", "preto", 34)}<div><div style="font:800 20px Gabarito">Lara Mendes</div><div style="font:500 14px Figtree;color:{TEMAS["preto"]["apoio"]}">clozzy.com/lara</div></div>')
    verso = cv("rosa", f'<div style="flex:1;display:flex;align-items:center;justify-content:center">{lg("empilhado", "rosa", 120)}</div>')
    verso_b = cv("branco", f'{lg("horizontal", "branco", 30)}<div style="display:flex;justify-content:space-between;align-items:flex-end"><div style="font:800 22px/1.05 Gabarito;color:{INK}">Escaneia e<br>entra no <span style="color:{DEEP}">close.</span></div>{qr(78)}</div>')
    adesivos = "".join(f'<div style="width:{w}px;height:{w}px;border-radius:50%;background:{TEMAS[s]["bg"]};display:flex;align-items:center;justify-content:center;flex:none;'
                       f'{"box-shadow:inset 0 0 0 1px " + TEMAS["branco"]["line"] + ";" if s == "branco" else ""}">{sym(s, w * .62)}</div>' for s, w in (("rosa", 150), ("preto", 120), ("roxo", 120), ("branco", 100)))
    sacola = (f'<div style="width:300px;height:360px;position:relative;flex:none"><div style="position:absolute;left:90px;top:0;width:120px;height:90px;border:10px solid {INK};border-bottom:none;border-radius:60px 60px 0 0"></div>'
              f'<div style="position:absolute;left:0;right:0;bottom:0;height:290px;background:{INK};border-radius:8px;display:flex;align-items:center;justify-content:center">{lg("empilhado", "preto", 150)}</div></div>')
    pulseira = (f'<div style="width:520px;height:64px;border-radius:12px;background:{PURPLE};display:flex;align-items:center;justify-content:space-between;padding:0 22px;flex:none">'
                f'{lg("horizontal", "roxo", 26)}<span style="font:800 18px Gabarito;color:{WHITE}">CLOSE NIGHT · VIP</span><span style="font:600 14px Figtree;color:{LAV}">nº 0042</span></div>')
    return page("Impressos", n, h1("Cartão, adesivo, sacola e evento", "margin-bottom:18px")
                + f'<div style="display:flex;gap:50px;align-items:flex-start"><div style="display:flex;flex-direction:column;gap:14px">'
                f'<div style="display:flex;gap:18px"><div>{frente}{cap("Cartão · frente preta")}</div><div>{verso}{cap("Verso rosa: logo todo branco")}</div></div>'
                f'<div style="display:flex;gap:18px;align-items:flex-start"><div>{verso_b}{cap("Cartão de mesa · branco + QR")}</div>'
                f'<div><div style="display:flex;gap:14px;align-items:center;width:350px;flex-wrap:wrap">{adesivos}</div>{cap("Adesivos redondos · símbolo da versão")}</div></div>'
                f'<div>{pulseira}{cap("Pulseira de evento · roxo, tudo branco e lavanda")}</div></div>'
                f'<div>{sacola}{cap("Sacola · preto, logo da versão preta")}'
                f'<div style="font:500 15px/1.45 Figtree;color:{MUTED};margin-top:16px;max-width:300px">Gráfica: rosa Pantone 213 C / CMYK 0 100 45 0 aprox., roxo 2665 C. Sempre prova de cor; em uma cor, use as versões 1 cor da identidade.</div></div></div>',
                pad="padding-top:80px")


def p_erros(n):
    P, B, R, X = TEMAS["preto"], TEMAS["branco"], TEMAS["roxo"], TEMAS["rosa"]
    def t(s, inner, label):
        T = TEMAS[s]
        return (f'<div style="width:335px"><div style="position:relative;height:210px;border-radius:18px;background:{T["bg"]};padding:22px;display:flex;flex-direction:column;justify-content:flex-end;gap:10px;'
                f'{"box-shadow:inset 0 0 0 1px " + TEMAS["branco"]["line"] + ";" if s == "branco" else ""}">{inner}{mark(False, WHITE)}</div>{cap(label)}</div>')
    tl = lambda c, tx, sz=40: f'<div style="font:900 {sz}px/.95 Gabarito;letter-spacing:-.03em;color:{c}">{tx}</div>'
    bt = lambda bg, fg, tx: f'<div style="display:inline-flex;align-self:flex-start;height:44px;padding:0 22px;border-radius:999px;background:{bg};color:{fg};font:800 16px/44px Gabarito">{tx}</div>'
    tiles = [
        t("rosa", tl(INK, "Seu close,<br>seu preço.") + bt(INK, WHITE, "Entrar"), "Preto em cima do rosa"),
        t("roxo", tl(PINK, "Drop de<br>sexta.") + bt(PINK, WHITE, "Garantir"), "Rosa em cima do roxo"),
        t("preto", tl(WHITE, "Chega mais perto.", 34) + bt(PINK, INK, "Entrar no close"), "Botão rosa com texto preto"),
        t("rosa", tl(WHITE, "Liberado.") + f'<div style="font:400 11px/1.3 Figtree;color:{WHITE}">Ao continuar você concorda com os termos de uso, política de privacidade e regras de reembolso da plataforma.</div>', "Texto miúdo no rosa"),
        t("branco", tl(INK, f'Seu close, <span style="color:{PINK}">seu preço.</span>', 34) + bt(PINK, WHITE, "Entrar"), "Rosa vivo no branco (use Pink Deep)"),
        t("preto", tl(PINK, "Venda packs, drops e o seu canal pra quem segue.", 26) + bt(WHITE, INK, "Entrar"), "Frase inteira na cor de destaque"),
        t("branco", f'<div style="display:flex;gap:8px">{bt(DEEP, WHITE, "Comprar")}{bt(INK, WHITE, "Assinar")}{bt(PURPLE, WHITE, "Seguir")}</div>', "Três botões primários"),
        t("preto", f'<div style="display:flex;height:120px;border-radius:12px;overflow:hidden"><div style="flex:1;background:{PINK}"></div><div style="flex:1;background:{PURPLE}"></div></div>', "Rosa colado no roxo"),
    ]
    return page("Não fazer", n, h1("Erros de tema", "margin-bottom:18px") + f'<div style="display:flex;flex-wrap:wrap;gap:22px 20px">{"".join(tiles)}</div>', pad="padding-top:80px")


def css_tokens():
    out = [":root{", "  /* cores de marca */"]
    for nm, c in (("rosa", PINK), ("pink-deep", DEEP), ("roxo", PURPLE), ("ink", INK), ("branco", WHITE), ("cream", CREAM), ("lavanda", LAV), ("rosa-suave", SOFT), ("muted", MUTED)):
        out.append(f"  --cz-{nm}:{c};")
    out.append("}")
    nomes = {"bg": "superficie", "card": "superficie-2", "line": "linha", "tit": "titulo", "txt": "texto", "apoio": "apoio", "dest": "destaque", "bb": "botao",
             "bf": "botao-texto", "sb": "secundario", "link": "link", "chb": "chip", "chf": "chip-texto", "chsb": "chip-ativo", "chsf": "chip-ativo-texto"}
    for s in ORDEM:
        T = TEMAS[s]
        out.append(f'[data-tema="{s}"]{{')
        out += [f"  --{v}:{T[k]};" for k, v in nomes.items()]
        out.append("}")
    return "\n".join(out) + "\n", nomes


def p_checklist(n):
    css, _ = css_tokens()
    trecho = "\n".join(css.splitlines()[12:29])
    itens = ["Escolhi um tema para a peça (preto, branco, roxo ou rosa).", "O logo é a versão do tema.", "Só um botão primário, na cor de botão do tema.",
             "O destaque é uma palavra ou um preço, não a frase.", "Nada preto no rosa; nada rosa no roxo.", "Rosa e roxo não estão encostados (seções, slides, grade).",
             "No branco, o rosa é Pink Deep.", "No rosa, nenhum texto abaixo de 20 px.", "Gabarito nos títulos e botões; Figtree no texto.", "Respiro de ½ anel em volta do logo."]
    lst = "".join(f'<div style="display:flex;gap:14px;align-items:center;padding:9px 0;border-top:1px solid {TEMAS["branco"]["line"]}"><span style="width:24px;height:24px;border-radius:7px;'
                  f'box-shadow:inset 0 0 0 2px {INK};flex:none"></span><span style="font:500 18px/1.3 Figtree">{i}</span></div>' for i in itens)
    code = (f'<pre style="margin:0;background:{INK};color:{WHITE};border-radius:20px;padding:24px 28px;font:500 14.5px/1.55 ui-monospace,Menlo,monospace;white-space:pre">'
            + trecho.replace("<", "&lt;") + "\n…</pre>")
    return page("Checklist e tokens", n, f'<div style="display:flex;gap:70px"><div style="flex:1">{h1("Antes de publicar")}{lst}</div>'
                f'<div style="width:560px">{h1("tokens.css")}{code}<div style="font:500 15px/1.45 Figtree;color:{MUTED};margin-top:12px">Coloque <b>data-tema="preto"</b> (ou branco, roxo, rosa) na seção ou tela; '
                f'os componentes leem só as variáveis de papel. Arquivo completo e tokens.json ao lado deste PDF.</div></div></div>')


def p_arquivos(n):
    files = [("manual-uso-marca-clozzy.pdf · .html", "este documento"), ("tokens.css", "variáveis por tema: data-tema=\"preto | branco | roxo | rosa\""),
             ("tokens.json", "os mesmos papéis em JSON, para o app e o Figma"), ("_build.py", "gerador; os temas estão no dicionário TEMAS"),
             ("../identidade-oficial-v2/", "logo, símbolo, regras de cor e os 53 SVGs (base deste manual)"), ("../identidade-nova/fonts/", "Gabarito e Figtree (OFL)")]
    return page("Arquivos", n, h1("Kit") + "".join(
        f'<div style="display:flex;gap:30px;padding:18px 0;border-top:1px solid {TEMAS["branco"]["line"]}"><b style="width:480px;font:800 24px Gabarito">{a}</b><span style="font:500 21px/1.35 Figtree">{b}</span></div>' for a, b in files))


# ================================================================== build
def build():
    pages = [p_capa()]
    fns = [p_sumario, p_temas, p_anatomia,
           lambda n: p_tema("preto", n), lambda n: p_tema("branco", n), lambda n: p_tema("roxo", n), lambda n: p_tema("rosa", n),
           p_tokens, p_contraste, p_proporcao, p_botoes, p_componentes, p_tipo,
           p_posts, p_formatos, p_carrossel, p_stories, p_perfil,
           p_landing, p_landing_mobile,
           lambda n: p_app(n, "preto", "App · tema escuro", "O padrão do app. Superfície preta, título branco, preço e ícone ativo em rosa, botão branco."),
           lambda n: p_app(n, "branco", "App · tema claro", "Mesmas telas no branco: o rosa vira Pink Deep no preço, no anel e no botão. Cartões em Cream."),
           p_momentos, p_email, p_anuncios, p_impressos, p_erros, p_checklist, p_arquivos]
    for i, fn in enumerate(fns):
        pages.append(fn(i + 1))
    css = (f'@font-face{{font-family:Gabarito;src:url("{FONTS}/Gabarito-Variable.ttf");font-weight:400 900}}'
           f'@font-face{{font-family:Figtree;src:url("{FONTS}/Figtree-Variable.ttf");font-weight:300 900}}'
           """@page{size:1600px 900px;margin:0}
*{box-sizing:border-box}body{margin:0;background:#888;font-family:Figtree}
section{position:relative;width:1600px;height:900px;padding:90px 90px 60px;overflow:hidden;page-break-after:always;margin:0 auto 20px}
.hd{position:absolute;left:90px;right:90px;top:34px;display:flex;justify-content:space-between;font:600 15px Figtree;letter-spacing:.1em;text-transform:uppercase;opacity:.55}
.ft{position:absolute;left:90px;bottom:24px;font:500 13px Figtree;opacity:.45}
h1{font:900 50px/1.05 Gabarito;letter-spacing:-.03em;margin:0 0 20px}
.lead{font:500 22px/1.45 Figtree;margin:0;max-width:1100px;opacity:.85}
.lb{font:500 15px/1.35 Figtree;margin-top:9px}
svg{overflow:visible}
@media print{body{background:none}section{margin:0}}""")
    html = f'<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy — uso da marca</title><style>{css}</style></head><body>{"".join(pages)}</body></html>'
    out = HERE / f"{OUT}.html"
    out.write_text(html)
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files", "--force-device-scale-factor=1",
                    f"--print-to-pdf={HERE / (OUT + '.pdf')}", "--no-pdf-header-footer", "--virtual-time-budget=5000", out.as_uri()],
                   check=True, capture_output=True)
    css_txt, nomes = css_tokens()
    (HERE / "tokens.css").write_text(css_txt)
    (HERE / "tokens.json").write_text(json.dumps({"temas": {s: {v: TEMAS[s][k] for k, v in nomes.items()} for s in ORDEM}}, ensure_ascii=False, indent=2) + "\n")
    return len(pages)


if __name__ == "__main__":
    print("págs.", build())

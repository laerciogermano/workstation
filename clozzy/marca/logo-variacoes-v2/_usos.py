#!/usr/bin/env python3
"""Clozzy — rodada 13 v2: seção de UTILIZAÇÕES do 07 Disco, 04 Crescente e 06 Giro.
Cada símbolo ganha duas páginas: “no app” (tela inicial, splash, notificação, aba e ícones) e
“na rede e na marca” (perfil e destaques, story, um uso próprio da forma, adesivos e ecobag).
Todas as peças são HTML/SVG desenhados aqui; os nomes de pessoas são fictícios (placeholders)."""
import base64
import _variacoes as A

PINK, DEEP, PURPLE, INK, CREAM, WHITE = A.PINK, A.DEEP, A.PURPLE, A.INK, A.CREAM, A.WHITE
f = A.f

SLUGS = ["v07-disco", "v04-crescente", "v06-giro"]
INFO = {
    "v07-disco": ("07", "Disco", "O disco cheio vira botão, selo e adesivo sem precisar de moldura. A estrela branca ficou menor "
                  "(R × 0,74) para sobrar disco em volta e o símbolo não pesar no pequeno."),
    "v04-crescente": ("04", "Crescente", "Os traços que alongam até virar linha contam “o close está chegando”: "
                      "é o anel de story mais natural das três, em volta de foto e em sequência."),
    "v06-giro": ("06", "Giro", "Com a abertura no canto de cima, o anel parece girar. É o símbolo que vira carregamento, "
                 "atualizar e “ao vivo” sem desenho novo."),
}


def uri(svg):
    return "data:image/svg+xml;base64," + base64.b64encode(svg.encode()).decode()


def fn(slug):
    return A.V[slug][3]


def sym(slug, rc, sc, size, bg=None, rot=0, cls=""):
    """Símbolo solto (grid 5..95) como <img>; `rot` gira o desenho (frames do Giro)."""
    body = fn(slug)(rc, sc, bg)
    if rot:
        body = f'<g transform="rotate({rot} 50 50)">{body}</g>'
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="5 5 90 90" width="{size}" height="{size}">{body}</svg>')
    c = f' class="{cls}"' if cls else ""
    return f'<img{c} src="{uri(svg)}" style="width:{size}px;height:{size}px;display:block">'


def ring_only(slug, c):
    """Só o anel (sem estrela), para moldurar foto de perfil e story."""
    if slug == "v04-crescente":
        line, ds = A.weighted(140, (1, 1.6, 2.6), 9)
        return A.c_ring(c, line, ds)
    if slug == "v06-giro":
        line, ds = A.even(110, 3, 0.7, center=-45)
        return A.c_ring(c, line, ds)
    line, ds = A.even(170, 6, 0.6)
    return A.c_ring(c, line, ds, w=7.0)


def tile(slug, bg, rc, sc, size, radius=0.2237):
    return f'<img src="{uri(A.tile_svg(fn(slug), bg, rc, sc, size))}" style="width:{size}px;height:{size}px;display:block">'


def lockup(slug, fundo, kind="horizontal", w=None, h=None):
    s = A.lockup_svg(fn(slug), fundo, kind, bg=False)
    sz = (f"width:{w}px;" if w else "") + (f"height:{h}px;" if h else "")
    return f'<img src="{uri(s)}" style="{sz}display:block">'


def avatar(slug, size, letter, photo, ring=PINK, initial=WHITE):
    inner = size * 0.78
    off = (size - inner) / 2
    rsvg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="5 5 90 90" width="{size}" height="{size}">'
            f'{ring_only(slug, ring)}</svg>')
    return (f'<div style="position:relative;width:{size}px;height:{size}px;flex:none">'
            f'<img src="{uri(rsvg)}" style="position:absolute;inset:0;width:{size}px;height:{size}px">'
            f'<div style="position:absolute;left:{off}px;top:{off}px;width:{inner}px;height:{inner}px;border-radius:50%;'
            f'background:{photo};display:grid;place-items:center;font:800 {inner * 0.42}px Gabarito;color:{initial}">{letter}</div></div>')


CSS = f"""
.uz{{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;margin-top:14px;align-items:start}}
.uz .cap{{font:800 12px Gabarito;margin-top:8px}} .uz .cap span{{display:block;font:500 9.5px/1.35 Figtree;color:rgba(20,9,15,.6);margin-top:2px}}
.ink .uz .cap span{{color:rgba(255,255,255,.6)}}
.ph{{width:226px;height:468px;border-radius:32px;background:{INK};padding:7px;margin:0 auto;box-shadow:0 10px 26px rgba(20,9,15,.18)}}
.ph .sc{{width:100%;height:100%;border-radius:26px;overflow:hidden;position:relative}}
.sb{{display:flex;justify-content:space-between;padding:9px 16px 0;font:700 9px Figtree}}
.home{{display:grid;grid-template-columns:repeat(4,1fr);gap:15px 8px;padding:26px 14px}}
.home span{{display:flex;flex-direction:column;align-items:center;gap:3px;font:500 7.5px Figtree;color:{WHITE}}}
.home i{{width:40px;height:40px;border-radius:9px;background:rgba(255,255,255,.13);display:block}}
.dock{{position:absolute;left:10px;right:10px;bottom:10px;height:52px;border-radius:18px;background:rgba(255,255,255,.12);
display:flex;justify-content:space-around;align-items:center}}
.dock i{{width:36px;height:36px;border-radius:9px;background:rgba(255,255,255,.16);display:block}}
.ntf{{margin:0 9px;background:rgba(255,255,255,.14);border-radius:14px;padding:9px;display:flex;gap:8px;color:{WHITE}}}
.ntf b{{font:800 8px Figtree;letter-spacing:.04em;opacity:.75}} .ntf p{{font:500 9.5px/1.3 Figtree;margin-top:2px}}
.panel{{background:{WHITE};border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:12px;align-items:center;
border:1px solid rgba(20,9,15,.08)}}
.tab{{width:100%;background:{CREAM};border-radius:12px;padding:8px 8px 0}}
.tab div{{background:{WHITE};border-radius:9px 9px 0 0;padding:7px 10px;display:flex;gap:7px;align-items:center;font:600 10px Figtree;width:82%}}
.prof{{background:{WHITE};height:100%;padding:0 12px;color:{INK}}}
.prof .u{{font:800 12px Gabarito;padding:12px 0 10px}}
.prof .st{{display:flex;gap:12px;align-items:center}} .prof .st div{{text-align:center;font:500 7.5px Figtree}}
.prof .st b{{display:block;font:800 11px Gabarito}}
.hl{{display:flex;gap:12px;margin-top:12px}} .hl div{{display:flex;flex-direction:column;align-items:center;gap:3px;font:500 7px Figtree}}
.hl i{{width:38px;height:38px;border-radius:50%;background:{INK};display:grid;place-items:center;border:2px solid {WHITE};
outline:1px solid rgba(20,9,15,.15)}}
.grid9{{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin:12px -12px 0}}
.grid9 i{{aspect-ratio:1;display:grid;place-items:center}}
.bars{{display:flex;gap:3px;padding:10px 10px 0}} .bars i{{flex:1;height:2px;border-radius:2px;background:rgba(255,255,255,.35)}}
.bars i.on{{background:{WHITE}}}
.pill{{display:inline-flex;gap:7px;align-items:center;border-radius:999px;font:800 12px Gabarito;padding:7px 14px 7px 8px}}
.frames{{display:flex;gap:7px}} .frames div{{background:{INK};border-radius:10px;padding:7px}}
@keyframes cz-spin{{to{{transform:rotate(360deg)}}}}
.spin{{animation:cz-spin 1.4s cubic-bezier(.5,.1,.3,1) infinite}}
@media print{{.spin{{animation:none}}}}
.tote{{width:150px;height:168px;background:{CREAM};border-radius:6px 6px 14px 14px;position:relative;display:grid;place-items:center;
box-shadow:inset 0 0 0 1px rgba(20,9,15,.08)}}
.tote:before{{content:"";position:absolute;top:-36px;left:38px;width:74px;height:60px;border:7px solid {CREAM};border-bottom:none;
border-radius:40px 40px 0 0;box-shadow:0 0 0 1px rgba(20,9,15,.06)}}
.stk{{display:flex;gap:10px;align-items:center}}
"""


def statusbar(c):
    return f'<div class="sb" style="color:{c}"><span>9:41</span><span>●●● ▮</span></div>'


def scr_home(slug):
    icons = ["Fotos", "Câmera", "Mapas", "Clima", "Notas", "", "Música", "Banco", "Relógio", "Agenda", "Ajustes", "Saúde"]
    cells = ""
    for i, n in enumerate(icons):
        ic = tile(slug, PINK, WHITE, WHITE, 40) if n == "" else "<i></i>"
        cells += f'<span>{ic}{n or "Clozzy"}</span>'
    return (f'<div class="sc" style="background:{INK}">{statusbar(WHITE)}<div class="home">{cells}</div>'
            f'<div class="dock"><i></i><i></i><i></i><i></i></div></div>')


def scr_splash(slug):
    return (f'<div class="sc" style="background:{PINK};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px">'
            f'{lockup(slug, "rosa", "empilhado", w=104)}'
            f'<div style="font:500 10px Figtree;color:{WHITE}">Seu close, seu preço.</div></div>')


def scr_lock(slug):
    return (f'<div class="sc" style="background:{INK}">{statusbar(WHITE)}'
            f'<div style="text-align:center;color:{WHITE};margin:26px 0 22px"><div style="font:600 10px Figtree;opacity:.7">quarta, 11 de novembro</div>'
            f'<div style="font:800 54px/1 Gabarito;letter-spacing:-.03em">9:41</div></div>'
            f'<div class="ntf">{tile(slug, PINK, WHITE, WHITE, 28)}<div><b>CLOZZY · AGORA</b>'
            f'<p>Marina liberou um close novo pra você.</p></div></div>'
            f'<div class="ntf" style="margin-top:6px">{tile(slug, PINK, WHITE, WHITE, 28)}<div><b>CLOZZY · 2 MIN</b>'
            f'<p>Você recebeu R$ 49,90 no Pix.</p></div></div></div>')


def panel_icons(slug):
    tiles = "".join(tile(slug, b, rc, sc, 54) for b, rc, sc in ((PINK, WHITE, WHITE), (INK, PINK, WHITE), (PURPLE, WHITE, WHITE)))
    small = "".join(f'<div style="text-align:center;font:600 8px Figtree;color:rgba(20,9,15,.55)">{sym(slug, DEEP, DEEP, s)}'
                    f'<div style="margin-top:3px">{s}</div></div>' for s in (32, 24, 16))
    return (f'<div class="panel"><div class="tab"><div>{sym(slug, DEEP, DEEP, 14)}Clozzy — seu close</div></div>'
            f'<div style="display:flex;gap:10px">{tiles}</div>'
            f'<div style="display:flex;gap:16px;align-items:flex-end">{small}</div>'
            f'<div style="background:{INK};border-radius:10px;padding:8px 12px">{lockup(slug, "preto", h=26)}</div></div>')


def scr_profile(slug):
    hl = (f'<div><i>{sym(slug, PINK, WHITE, 26)}</i>Clozzy</div>'
          + "".join(f'<div><i><svg viewBox="0 0 100 100" width="18" height="18">{A.star(PINK, 30)}</svg></i>{n}</div>'
                    for n in ("Novos", "Lives", "Pix")))
    tiles = ""
    for k in range(6):
        bg = (INK, PINK, CREAM, PURPLE, INK, PINK)[k]
        rc, sc = {INK: (PINK, WHITE), PINK: (WHITE, WHITE), CREAM: (DEEP, DEEP), PURPLE: (WHITE, WHITE)}[bg]
        inner = sym(slug, rc, sc, 30) if k in (0, 3) else ""
        tiles += f'<i style="background:{bg}">{inner}</i>'
    return (f'<div class="sc"><div class="prof">{statusbar(INK)}<div class="u">clozzy</div>'
            f'<div class="st"><div style="width:62px;height:62px;border-radius:50%;background:{INK};display:grid;place-items:center">'
            f'{sym(slug, PINK, WHITE, 40)}</div><div><b>128 mil</b>seguidores</div><div><b>312</b>posts</div></div>'
            f'<div style="font:500 8.5px/1.35 Figtree;margin-top:9px"><b style="font-family:Gabarito">Clozzy</b><br>Seu close, seu preço. '
            f'Conteúdo exclusivo dos seus creators.</div><div class="hl">{hl}</div><div class="grid9">{tiles}</div></div></div>')


def scr_story(slug):
    return (f'<div class="sc" style="background:{INK};display:flex;flex-direction:column">'
            f'<div class="bars"><i class="on"></i><i class="on"></i><i></i><i></i></div>'
            f'<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:0 18px">'
            f'{sym(slug, PINK, WHITE, 88)}'
            f'<div style="font:800 24px/1 Gabarito;color:{WHITE};text-align:center;letter-spacing:-.02em">Seu close,<br>seu <span style="color:{PINK}">preço.</span></div>'
            f'<div class="pill" style="background:{PINK};color:{WHITE};padding:8px 16px">Ver close</div></div>'
            f'<div style="padding:0 0 18px;display:grid;place-items:center">{lockup(slug, "preto", h=18)}</div></div>')


def panel_special(slug):
    if slug == "v07-disco":
        body = (f'<div class="pill" style="background:{DEEP};color:{WHITE}">{sym(slug, WHITE, WHITE, 24, bg=DEEP)}Assinar close</div>'
                f'<div class="pill" style="background:{INK};color:{WHITE}">{sym(slug, PINK, WHITE, 24)}Close friends</div>'
                f'<div style="display:flex;gap:6px;align-items:center;font:800 15px Gabarito">marina.reis {sym(slug, DEEP, DEEP, 16, bg=WHITE)}</div>'
                f'<div style="display:flex;gap:10px">{sym(slug, DEEP, DEEP, 56, bg=WHITE)}'
                f'<div style="background:{INK};border-radius:14px;padding:4px">{sym(slug, PINK, WHITE, 48)}</div></div>')
        cap = ("Botão, selo e verificado", "O disco já é um botão: entra em CTA, no selo de close friends e como marca ao lado do nome.")
    elif slug == "v04-crescente":
        people = [("+", INK, "Seu close"), ("M", PURPLE, "marina"), ("J", DEEP, "joão"), ("A", INK, "ana")]
        av = "".join(f'<div style="display:flex;flex-direction:column;align-items:center;gap:4px;font:600 8px Figtree">'
                     f'{avatar(slug, 40, l, bg, ring=(CREAM if i == 3 else PINK))}{n}</div>' for i, (l, bg, n) in enumerate(people))
        body = (f'<div style="display:flex;gap:6px;background:{INK};border-radius:14px;padding:10px 9px;color:{WHITE}">{av}</div>'
                f'<div style="display:flex;gap:12px;align-items:center">{avatar(slug, 92, "M", PURPLE)}'
                f'<div style="font:500 9.5px/1.4 Figtree;color:rgba(20,9,15,.65);max-width:96px"><b style="font:800 12px Gabarito;color:{INK}">Close novo</b><br>'
                f'anel rosa quando tem novidade, cream quando já foi visto.</div></div>')
        cap = ("Anel de story em volta da foto", "O anel sem a estrela vira a moldura do perfil: rosa = close novo, cream = visto.")
    else:
        fr = "".join(f'<div>{sym(slug, PINK, WHITE, 30, rot=r)}</div>' for r in (0, 90, 180, 270))
        body = (f'<div class="frames">{fr}</div>'
                f'<div style="display:flex;gap:12px;align-items:center;background:{INK};border-radius:14px;padding:12px 16px;color:{WHITE};font:600 10px Figtree">'
                f'{sym(slug, PINK, WHITE, 34, cls="spin")}carregando o close…</div>'
                f'<div class="pill" style="background:{PINK};color:{WHITE}">{sym(slug, WHITE, WHITE, 22)}AO VIVO</div>')
        cap = ("Carregar, atualizar e ao vivo", "O mesmo símbolo girando é o loading do app (anima no HTML), o puxar-para-atualizar e o selo de live.")
    return f'<div class="panel" style="min-height:468px;justify-content:center;gap:16px">{body}</div>', cap


def panel_merch(slug):
    stickers = (f'<div style="width:66px;height:66px;border-radius:50%;background:{PINK};display:grid;place-items:center">{sym(slug, WHITE, WHITE, 44, bg=PINK)}</div>'
                f'<div style="width:66px;height:66px;border-radius:50%;background:{INK};display:grid;place-items:center">{sym(slug, PINK, WHITE, 44)}</div>'
                f'<div style="width:66px;height:66px;border-radius:50%;background:{PURPLE};display:grid;place-items:center">{sym(slug, WHITE, WHITE, 44, bg=PURPLE)}</div>')
    return (f'<div class="panel" style="min-height:468px;justify-content:center;gap:26px">'
            f'<div class="tote" style="margin-top:30px">{lockup(slug, "cream", "empilhado", w=82)}</div>'
            f'<div class="stk">{stickers}</div></div>')


def cell(inner, title, sub):
    return f'<div>{inner}<div class="cap">{title}<span>{sub}</span></div></div>'


def foot(n):
    return f'<div class="foot"><span>Clozzy · variações do logo · rodada 13 v2 · utilizações · nov 2026</span><span>{n:02d}</span></div>'


def p_open(n):
    cards = "".join(f'<div style="text-align:center">{A_img(s)}<div style="font:800 15px Gabarito;margin-top:10px">'
                    f'{INFO[s][0]} · {INFO[s][1]}</div><p style="font:500 10px/1.45 Figtree;color:rgba(255,255,255,.68);'
                    f'max-width:220px;margin:6px auto 0">{INFO[s][2]}</p></div>' for s in SLUGS)
    return f"""<section class="page ink">
<div class="kicker">{n:02d} · Seção de utilizações</div><h1 style="font-size:54px">Três símbolos <em>em uso.</em></h1>
<p class="lead" style="margin-top:12px;max-width:640px">O 07 Disco, o 04 Crescente e o 06 Giro saem do papel: no app (ícone,
splash, notificação, aba do navegador) e na rede e na marca (perfil, destaques, story, um uso próprio de cada forma e
adesivos). Mesmas regras de cor de sempre.</p>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:34px">{cards}</div>{foot(n)}</section>"""


def A_img(s):
    return sym(s, PINK, WHITE, 150)


def p_app(n, slug):
    num, name, _ = INFO[slug]
    cells = (cell(f'<div class="ph">{scr_home(slug)}</div>', "Tela inicial", "Tile rosa com o símbolo branco, entre os outros apps.")
             + cell(f'<div class="ph">{scr_splash(slug)}</div>', "Splash", "Rosa com o lockup empilhado todo branco.")
             + cell(f'<div class="ph">{scr_lock(slug)}</div>', "Notificação", "O ícone a 28 px na tela bloqueada.")
             + cell(panel_icons(slug), "Aba, ícones e tamanhos", "Favicon na aba, tiles rosa/preto/roxo, 32–16 px e o lockup."))
    return f"""<section class="page white">
<div class="kicker">{n:02d} · {num} {name} · no app</div><h2>{name}: <em>no app</em></h2>
<div class="uz">{cells}</div>{foot(n)}</section>"""


def p_social(n, slug):
    num, name, _ = INFO[slug]
    sp, (t, s) = panel_special(slug)
    cells = (cell(f'<div class="ph">{scr_profile(slug)}</div>', "Perfil e destaques", "Foto de perfil no preto, capa de destaque e posts.")
             + cell(f'<div class="ph">{scr_story(slug)}</div>', "Story", "Símbolo grande, frase e o lockup assinando embaixo.")
             + cell(sp, t, s)
             + cell(panel_merch(slug), "Ecobag e adesivos", "No cream: símbolo Pink Deep e palavra ink. Adesivos em rosa, preto e roxo."))
    return f"""<section class="page">
<div class="kicker">{n:02d} · {num} {name} · na rede e na marca</div><h2>{name}: <em>na rede e na marca</em></h2>
<div class="uz">{cells}</div>{foot(n)}</section>"""


def pages(start):
    out, n = [p_open(start)], start + 1
    for s in SLUGS:
        out += [p_app(n, s), p_social(n + 1, s)]
        n += 2
    return out

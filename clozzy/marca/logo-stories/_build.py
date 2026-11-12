#!/usr/bin/env python3
"""Clozzy — documento da rodada 13 (logos parecidos com stories).
Rodar: python3 _stories.py && python3 _build.py → HTML + PDF"""
import base64, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import _stories as S  # noqa: E402

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
FONTS = HERE.parent / "logo-final-v3" / "fonts"
OUT_HTML = HERE / "stories-clozzy.html"
OUT_PDF = HERE / "stories-clozzy.pdf"
PINK, DEEP, PURPLE, INK, CREAM, WHITE = S.PINK, S.DEEP, S.PURPLE, S.INK, S.CREAM, S.WHITE


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(Path(p).read_bytes()).decode()


def sym(slug, fundo, px, bg=False, pad=6):
    s = S.sym_svg(slug, fundo, px, bg=bg, pad=pad)
    return f'<img src="data:image/svg+xml;base64,{base64.b64encode(s.encode()).decode()}" width="{px}" height="{px}">'


def tile(slug, fundo, px, radius=22.37):
    s = S.tile_svg(slug, fundo, px, radius=radius)
    return f'<img src="data:image/svg+xml;base64,{base64.b64encode(s.encode()).decode()}" width="{px}" height="{px}">'


def foot(n):
    return f'<div class="foot"><span>Clozzy · logos com cara de stories · rodada 13 · nov 2026</span><span>{n:02d}</span></div>'


CSS = f"""
@font-face{{font-family:Gabarito;src:url({b64(FONTS / 'Gabarito-Variable.ttf', 'font/ttf')});font-weight:400 900}}
@font-face{{font-family:Figtree;src:url({b64(FONTS / 'Figtree-Variable.ttf', 'font/ttf')});font-weight:300 900}}
@page{{size:297mm 210mm;margin:0}}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:Figtree;color:{INK};background:#ddd}}
.pg{{width:297mm;height:210mm;padding:15mm 17mm 13mm;position:relative;overflow:hidden;background:{CREAM};page-break-after:always}}
.pg.dark{{background:{INK};color:{WHITE}}}
h1{{font:800 54px/1 Gabarito;letter-spacing:-.02em}}
h2{{font:800 28px/1.05 Gabarito;letter-spacing:-.015em}}
.lead{{font-size:12.5px;line-height:1.5;max-width:640px;margin-top:8px;opacity:.72}}
.foot{{position:absolute;left:17mm;right:17mm;bottom:8mm;display:flex;justify-content:space-between;font:600 9px Figtree;opacity:.45}}
.grid{{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-top:16px}}
.card{{background:{WHITE};border:1px solid rgba(20,9,15,.09);border-radius:14px;padding:12px 11px 11px;text-align:center}}
.card.on{{border-color:{PINK};box-shadow:0 0 0 2px rgba(255,0,101,.15)}}
.card img{{margin:0 auto;display:block}}
.card b{{display:block;font:800 12.5px Gabarito;margin-top:7px}}
.card b i{{font-style:normal;color:{PINK};margin-right:4px}}
.card p{{font-size:9.2px;line-height:1.35;color:rgba(20,9,15,.6);margin-top:3px;min-height:37px}}
.card .sm{{display:flex;gap:8px;justify-content:center;align-items:center;margin-top:6px}}
table{{border-collapse:separate;border-spacing:5px 4px;margin-top:10px}}
td{{border-radius:8px;text-align:center;vertical-align:middle;padding:2px 6px;width:96px}}
td.n{{font:800 10.5px Gabarito;text-align:left;width:120px;padding-left:2px}}
th{{width:96px;font:700 8.5px Figtree;opacity:.55;text-align:center;padding-bottom:2px}}
.tray{{border-radius:18px;padding:16px 18px 14px;display:flex;gap:16px}}
.tray .u{{display:flex;flex-direction:column;align-items:center;gap:6px;font:600 9.5px Figtree;width:64px}}
.ph{{width:64px;height:64px;border-radius:50%;padding:5px;border:3px solid;}}
.ph div{{width:100%;height:100%;border-radius:50%}}
.row{{display:flex;gap:22px;align-items:flex-start;margin-top:14px}}
.lbl{{font:700 9.5px Figtree;opacity:.55;margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em}}
.phone{{width:150px;height:266px;border-radius:20px;position:relative;overflow:hidden}}
.phone .bars{{position:absolute;left:10px;right:10px;top:10px;display:flex;gap:3px}}
.phone .bars span{{flex:1;height:2.5px;border-radius:2px;background:rgba(255,255,255,.4)}}
.phone .bars span.f{{background:{WHITE}}}
.phone .hd{{position:absolute;left:10px;top:20px;display:flex;align-items:center;gap:6px;font:800 11px Gabarito;color:{WHITE}}}
.rec{{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:18px}}
.rec .b{{background:{WHITE};border-radius:16px;padding:18px;border:1px solid rgba(20,9,15,.09)}}
.rec .b .top{{display:flex;gap:10px;align-items:center}}
.rec b{{font:800 16px Gabarito;display:block;margin-top:12px}}
.rec p{{font-size:10.5px;line-height:1.45;color:rgba(20,9,15,.66);margin-top:5px}}
"""


def p_cover():
    big = "".join(f'<div style="text-align:center">{sym(s, "preto", 150)}'
                  f'<div style="font:700 10px Figtree;opacity:.55;margin-top:8px">{dict((c[0], c[1]) for c in S.CONCEPTS)[s]}</div></div>'
                  for s in S.RECOMMENDED)
    return (f'<section class="pg dark"><div style="font:700 11px Figtree;color:{PINK};letter-spacing:.12em">RODADA 13</div>'
            f'<h1 style="margin-top:10px">Clozzy com<br>cara de stories</h1>'
            f'<p class="lead">10 símbolos que pegam emprestada a linguagem dos stories: o anel em volta da foto, o anel '
            f'partido de quem postou vários, o selo “+”, o anel carregando, as barras de progresso do topo e a tela 9:16. '
            f'A estrela é a da logo final v3, e as cores seguem as regras da marca.</p>'
            f'<div style="display:flex;gap:60px;margin-top:34px">{big}</div>{foot(1)}</section>')


def p_concepts():
    cards = []
    for i, (slug, name, idea, _fn) in enumerate(S.CONCEPTS, 1):
        on = " on" if slug in S.RECOMMENDED else ""
        sm = sym(slug, "branco", 32, pad=2) + sym(slug, "branco", 20, pad=2) + sym(slug, "branco", 16, pad=1)
        cards.append(f'<div class="card{on}">{sym(slug, "branco", 118, pad=3)}<b><i>{i:02d}</i>{name}</b>'
                     f'<p>{idea}</p><div class="sm">{sm}</div></div>')
    return (f'<section class="pg"><h2>Os 10 símbolos</h2><p class="lead">Em Pink Deep no claro, com os cortes de 32, 20 e '
            f'16 px embaixo de cada um. Com contorno rosa estão os três recomendados.</p>'
            f'<div class="grid">{"".join(cards)}</div>{foot(2)}</section>')


def p_colors():
    head = "<tr><th></th>" + "".join(f"<th>{n}</th>" for _s, n, *_ in S.FUNDOS) + "</tr>"
    rows = []
    for i, (slug, name, *_r) in enumerate(S.CONCEPTS, 1):
        cells = "".join(f'<td style="background:{S.FUNDO[fd][2]}">{sym(slug, fd, 46, pad=4)}</td>' for fd, *_ in S.FUNDOS)
        rows.append(f'<tr><td class="n">{i:02d} · {name}</td>{cells}</tr>')
    return (f'<section class="pg"><h2>Cor</h2><p class="lead">No preto: forma rosa e estrela branca. No rosa, no roxo e no '
            f'Deep: tudo branco, com a estrela recortada. No claro: Pink Deep. Nada de preto no rosa nem de rosa sobre roxo.</p>'
            f'<table>{head}{"".join(rows)}</table>{foot(3)}</section>')


def tray(main_slug, dark):
    bg = INK if dark else WHITE
    fg = WHITE if dark else INK
    fundo = "preto" if dark else "branco"
    others = ["ana.luz", "biaxx", "mari", "jessy"]
    # outros perfis: anel na cor da marca (novo) ou fino neutro (visto); foto neutra
    neutral = "rgba(255,255,255,.14)" if dark else "rgba(20,9,15,.08)"
    ring_seen = "rgba(255,255,255,.25)" if dark else "rgba(20,9,15,.18)"
    items = [f'<div class="u">{sym(main_slug, fundo, 64, pad=0)}<span>clozzy</span></div>']
    for j, n in enumerate(others):
        col = (PINK if dark else DEEP) if j in (0, 2) else ring_seen
        bw = 3 if j in (0, 2) else 1.5
        items.append(f'<div class="u"><div class="ph" style="border-color:{col};border-width:{bw}px">'
                     f'<div style="background:{neutral}"></div></div><span>{n}</span></div>')
    return f'<div class="tray" style="background:{bg};color:{fg}">{"".join(items)}</div>'


def phone(slug, bg):
    fundo = {PINK: "rosa", PURPLE: "roxo", INK: "preto"}[bg]
    return (f'<div class="phone" style="background:{bg}"><div class="bars"><span class="f"></span><span class="f"></span>'
            f'<span></span></div><div class="hd">{sym(slug, fundo, 22, pad=0)}clozzy</div>'
            f'<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">'
            f'{sym(slug, fundo, 84, pad=0)}</div></div>')


def p_use():
    a, b, c = S.RECOMMENDED
    return (f'<section class="pg"><h2>Em uso</h2><p class="lead">Na bandeja de stories o símbolo já entra parecendo um story '
            f'novo, ao lado dos perfis de verdade. No ícone de app e na tela cheia, os cards 9:16 fazem o mesmo papel.</p>'
            f'<div class="lbl" style="margin-top:14px">Bandeja de stories · {dict((x[0], x[1]) for x in S.CONCEPTS)[a]}</div>'
            f'<div style="display:flex;gap:14px">{tray(a, False)}{tray(a, True)}</div>'
            f'<div class="lbl" style="margin-top:12px">Bandeja · {dict((x[0], x[1]) for x in S.CONCEPTS)[b]}</div>'
            f'<div style="display:flex;gap:14px">{tray(b, False)}{tray(b, True)}</div>'
            f'<div class="row"><div><div class="lbl">Ícone de app</div><div style="display:grid;grid-template-columns:repeat(3,64px);gap:10px">'
            + "".join(tile(s, fd, 64) for s in (a, b, c) for fd in ("rosa", "preto", "roxo")) +
            f'</div></div><div><div class="lbl">Tela de story</div><div style="display:flex;gap:12px">'
            f'{phone(c, PINK)}{phone(a, INK)}{phone(b, PURPLE)}</div></div></div>{foot(4)}</section>')


def p_rec():
    why = {
        "s02-segmentos": "É o que mais lê como story: o anel partido aparece em todo app e funciona até em 16 px. Fica bem como foto de perfil e na bandeja.",
        "s04-novo": "Conversa com o print do anel “novo” e com a ação principal do produto: postar para os close friends. O selo vira atalho para um botão de “publicar”.",
        "s08-card-cheio": "A tela 9:16 com as barras do topo é o story em si, não só o anel. Em bloco, vira o ícone de app mais forte da rodada.",
    }
    boxes = "".join(
        f'<div class="b"><div class="top">{sym(s, "branco", 96, pad=2)}{sym(s, "preto", 96, bg=True, pad=8)}</div>'
        f'<b>{dict((x[0], x[1]) for x in S.CONCEPTS)[s]}</b><p>{why[s]}</p></div>' for s in S.RECOMMENDED)
    return (f'<section class="pg"><h2>Recomendação</h2><p class="lead">Três caminhos fortes. Dá para combinar: o anel '
            f'(02 ou 04) como símbolo e foto de perfil, e o card (08) como ícone de app e capa de destaque.</p>'
            f'<div class="rec">{boxes}</div>{foot(5)}</section>')


def build():
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy · logos com cara de stories</title>'
            f'<style>{CSS}</style></head><body>{p_cover()}{p_concepts()}{p_colors()}{p_use()}{p_rec()}</body></html>')
    OUT_HTML.write_text(html)
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer",
                    f"--print-to-pdf={OUT_PDF}", OUT_HTML.as_uri()], check=True, capture_output=True)
    print("ok", OUT_HTML.name, OUT_PDF.name)


if __name__ == "__main__":
    build()

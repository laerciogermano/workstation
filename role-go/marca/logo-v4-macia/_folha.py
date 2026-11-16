#!/usr/bin/env python3
"""Folha de escolha: v4 atual × opções A–E do RolêGo macio (PDF A4 paisagem)."""
import os, sys, base64
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "identidade-v4"))
from _gerar import OPCOES
from _common import PURPLE, FONT, pdf, shoot

HERE = os.path.dirname(os.path.abspath(__file__))
V4 = os.path.join(HERE, "..", "logo-v4")
ROWS = [("v4", "Atual", "Quinas retas, como está no manual v4.", V4)] + \
       [(o, n, desc, os.path.join(HERE, f"opcao-{o}")) for o, n, r, rc, desc in OPCOES]


def I(folder, name, h, style=""):
    raw = open(os.path.join(folder, name), "rb").read()
    return f'<img src="data:image/svg+xml;base64,{base64.b64encode(raw).decode()}" style="height:{h}px;{style}">'


CSS = FONT + f"""
@page{{size:297mm 210mm;margin:0}}*{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:Poppins,sans-serif;background:#000;color:#fff}}
.pg{{width:297mm;height:210mm;padding:34px 44px;page-break-after:always;overflow:hidden;position:relative}}
h1{{font:italic 800 34px Poppins;letter-spacing:-.5px}} h1 b{{color:#00E5E5}}
.sub{{color:#9CA3AF;font-size:13px;margin:6px 0 22px}}
.tab{{display:grid;grid-template-columns:150px 1.55fr 1.55fr .62fr .62fr;gap:8px}}
.hd{{font-size:10px;color:#5B6070;text-transform:uppercase;letter-spacing:1.5px;padding-bottom:2px}}
.lb{{display:flex;flex-direction:column;justify-content:center}} .lb .id{{font:italic 800 26px Poppins;line-height:1}}
.lb .id i{{font-style:normal;font-size:12px;font-weight:600;color:#00E5E5;margin-left:6px;vertical-align:middle}}
.lb p{{font-size:9.5px;color:#9CA3AF;line-height:1.35;margin-top:3px}}
.c{{height:76px;border-radius:12px;display:flex;align-items:center;justify-content:center}}
.pu{{background:{PURPLE}}} .bk{{background:#0F0F13;border:1px solid #1E1E25}} .lt{{background:#F4F4F8}}
.cur .lb .id{{color:#5B6070}}
.zg{{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}}
.z{{border-radius:16px;height:205px;position:relative;overflow:hidden}}
.z img{{position:absolute}} .z .t{{position:absolute;left:14px;bottom:10px;font:italic 800 18px Poppins;z-index:2}}
.z .t i{{font-style:normal;font-weight:500;font-size:11px;color:#C9C3F5;margin-left:6px}}
.ug{{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}}
.u{{background:#0F0F13;border:1px solid #1E1E25;border-radius:16px;padding:14px 10px 12px;display:flex;flex-direction:column;align-items:center;gap:12px}}
.u .t{{font:italic 800 16px Poppins}} .u .row{{display:flex;align-items:flex-end;gap:10px}}
.u .lite{{background:#F4F4F8;border-radius:10px;padding:10px;width:100%;display:flex;justify-content:center}}
.nt{{position:absolute;left:44px;bottom:24px;font-size:10.5px;color:#5B6070}}
"""


def page_tabela():
    h = '<div class="hd"></div><div class="hd">Lockup no roxo · principal</div><div class="hd">Lockup no preto</div><div class="hd">Ícone de app</div><div class="hd">Empilhado</div>'
    for oid, nome, desc, f in ROWS:
        cls = "cur" if oid == "v4" else ""
        tag = "" if oid == "v4" else ""
        h += (f'<div class="lb {cls}"><span class="id">{oid if oid != "v4" else "v4"}<i>{nome}</i></span><p>{desc}</p></div>'
              f'<div class="c pu">{I(f, "v4-lockup-purple.svg", 46)}</div>'
              f'<div class="c bk">{I(f, "v4-lockup-dark.svg", 46)}</div>'
              f'<div class="c bk">{I(f, "v4-icon-app.svg", 58)}</div>'
              f'<div class="c pu">{I(f, "v4-stacked-purple.svg", 64)}</div>')
    return (f'<section class="pg"><h1>RolêGo <b>macio</b> · possibilidades</h1>'
            f'<p class="sub">Mesmo desenho do v4, só com as bordas suavizadas, no nome e no símbolo. A primeira linha é o logo de hoje, para comparar.</p>'
            f'<div class="tab">{h}</div></section>')


def page_zoom():
    cards = ""
    for oid, nome, desc, f in ROWS:
        # recorte no “ê” + Go, onde as quinas aparecem mais
        cards += (f'<div class="z pu">{I(f, "v4-lockup-purple.svg", 158, "left:-284px;top:22px")}'
                  f'<span class="t">{oid}<i>{nome}</i></span></div>')
    return (f'<section class="pg"><h1>De perto</h1><p class="sub">Recorte grande do “ê” + Go: é onde se vê a diferença entre as opções.</p>'
            f'<div class="zg">{cards}</div></section>')


def page_uso():
    cards = ""
    for oid, nome, desc, f in ROWS[1:]:
        cards += (f'<div class="u"><span class="t">{oid}</span>'
                  f'<div class="row">{I(f, "v4-icon-app.svg", 64)}{I(f, "v4-icon-avatar.svg", 40)}{I(f, "v4-icon-fav.svg", 24)}{I(f, "v4-icon-fav.svg", 16)}</div>'
                  f'{I(f, "v4-go-dark.svg", 54)}'
                  f'<div class="lite">{I(f, "v4-lockup-light.svg", 26)}</div>'
                  f'{I(f, "v4-lockup-dark.svg", 18)}</div>')
    return (f'<section class="pg"><h1>No tamanho de uso</h1><p class="sub">Ícone, avatar, favicon (24 e 16 px), símbolo, lockup no claro e lockup pequeno. Raios muito grandes começam a pesar no pequeno.</p>'
            f'<div class="ug">{cards}</div>'
            f'<p class="nt">SVGs de cada opção em role-go/marca/logo-v4-macia/opcao-A … opcao-E (mesmos nomes de arquivo do logo-v4). Escolhida a opção, o manual v4 é gerado de novo com ela.</p></section>')


def main():
    html = f"<!doctype html><html lang='pt-BR'><head><meta charset='utf-8'><title>RolêGo macio · possibilidades</title><style>{CSS}</style></head><body>{page_tabela()}{page_zoom()}{page_uso()}</body></html>"
    hp = os.path.join(HERE, "possibilidades-rolego-macio.html")
    open(hp, "w").write(html)
    pdf(hp, os.path.join(HERE, "possibilidades-rolego-macio.pdf"))
    print("ok")


if __name__ == "__main__":
    main()

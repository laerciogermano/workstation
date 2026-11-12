#!/usr/bin/env python3
"""Apresentação do logo v3 (A4 paisagem). Rodar depois de _build_v3.py."""
import os
from _build_v3 import DIR
HERE = os.path.dirname(os.path.abspath(__file__))
I = lambda f, h=None, w=None, cls="": f'<img class="{cls}" src="{f}" style="{f"height:{h}px;" if h else ""}{f"width:{w}px;" if w else ""}">'
pages = []
foot = lambda n: f'<div class="foot"><span>RoleGo · logo v3 · cores do projeto original</span><span>{n}</span></div>'

pages.append(f"""<section class="page dark cover"><div class="eyebrow">Logo v3 · 08/11/2026</div>
<div class="hero">{I("v3a-lockup-color.svg", h=150)}</div>
<h1>Mesma estrutura do L1, <b>cores do RoleGo original</b></h1>
<p class="lead">O desenho é o escolhido no v2 (L1 “ligadura na base”: G e pin numa peça só, ponta na linha de base) — nenhuma curva mudou. Saiu o ciano chapado, que puxava para marca de esporte; entram o magenta, o violeta e o azul/ciano em gradiente dos banners dos épicos e do manual v1.</p>
<div class="ref"><figure><img src="../../assets/epic-e01-cover.png"><figcaption>Referência · banner E01</figcaption></figure>
<figure><img src="../../assets/epic-e05-cover.png"><figcaption>Referência · banner E04</figcaption></figure>
<figure class="old">{I("../logo-v2/ligadura/l1-lockup-color.svg", h=44)}<figcaption>v2 · ciano chapado (sai)</figcaption></figure></div>
{foot(1)}</section>""")

def row(k, suf):
    v = DIR[k]
    rec = '<span class="chip">recomendado</span>' if k == "a" else ""
    icon = I(f"v3{k}-icon-app.svg" if k != "c" else "v3c-icon-app-dark.svg", h=86, cls="ic")
    sw = "".join(f'<i style="background:{c}"></i>' for c in (v["stops"] if suf == "color" else v["light"]))
    return (f'<div class="row"><div class="lab"><b>{k.upper()} · {v["nome"]}</b>{rec}<p>{v["ideia"]}</p><div class="sw">{sw}</div></div>'
            f'<div class="lk">{I(f"v3{k}-lockup-{suf}.svg", h=78)}</div><div class="sy">{I(f"v3{k}-go-{suf}.svg", h=96)}</div>'
            f'<div class="sy">{icon if suf == "color" else I(f"v3{k}-stacked-{suf}.svg", h=86)}</div></div>')

pages.append(f"""<section class="page dark"><div class="eyebrow">2 · No preto (uso principal)</div><h2>Três direções de cor, um só desenho</h2>
{"".join(row(k, "color") for k in DIR)}{foot(2)}</section>""")
pages.append(f"""<section class="page light"><div class="eyebrow">3 · Sobre fundo claro</div><h2>No claro, os mesmos gradientes em tom mais fechado</h2>
{"".join(row(k, "light") for k in DIR)}
<div class="mono"><div style="background:#04050B">{I("v3-lockup-white.svg", h=40)}</div><div>{I("v3-lockup-ink.svg", h=40)}</div><span>Uma cor (impressão, pulseira, carimbo): branco e preto, mesma geometria.</span></div>{foot(3)}</section>""")

apps = "".join('<div class="app"><i></i></div>' for _ in range(5)) + f'<div class="app">{I("v3a-icon-app.svg")}<span>RoleGo</span></div>' + \
       "".join('<div class="app"><i></i></div>' for _ in range(10))
pages.append(f"""<section class="page light"><div class="eyebrow">4 · Usos · direção A</div><h2>No celular, no site e no feed</h2>
<div class="mk"><div class="phone home"><div class="apps">{apps}</div></div>
<div class="phone splash">{I("v3a-stacked-color.svg", w=140)}<p>Bora pro rolê?</p></div>
<div class="col"><div class="brw"><div class="tab">{I("v3a-icon-fav.svg", h=14)} RoleGo — rolês perto de você</div>
<div class="nav">{I("v3a-lockup-color.svg", h=28)}<div class="lk2"><span>Rolês</span><span>Mapa</span><span class="btn">Bora</span></div></div>
<div class="hero2">Os rolês da sua cidade,<br><b>num swipe.</b></div></div>
<div class="two"><div class="ntf">{I("v3a-icon-app.svg", h=34)}<div><b>RoleGo</b> · agora<br>Seu grupo deu match: Samba no Largo, sexta 21h. Bora?</div></div>
<div class="prof">{I("v3a-icon-avatar.svg", h=64)}<div><b>rolego</b><br>Os rolês da sua cidade, num swipe.</div></div></div>
<div class="icons">{I("v3a-icon-app.svg", h=70)}{I("v3b-icon-app.svg", h=70)}{I("v3a-icon-app-dark.svg", h=70)}{I("v3c-icon-app-dark.svg", h=70)}{I("v3a-icon-avatar.svg", h=70)}{I("v3a-icon-fav.svg", h=32)}<span>Ícones: A, B, escuro A, escuro C, avatar, favicon</span></div>
</div></div>{foot(4)}</section>""")

CSS = """@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,600;0,800;1,800&display=swap');
@page{size:297mm 210mm;margin:0}*{box-sizing:border-box;margin:0}body{font-family:Poppins,sans-serif;background:#222}
.page{width:297mm;height:210mm;padding:14mm 16mm;position:relative;overflow:hidden;page-break-after:always;display:flex;flex-direction:column;gap:10px}
.dark{background:#04050B;color:#fff}.light{background:#F4F4F8;color:#05070F}
.eyebrow{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#9CA3AF}
h1{font-size:34px;font-weight:800;font-style:italic;letter-spacing:-.02em;line-height:1.1}h1 b{color:#B76BFF}
h2{font-size:24px;font-weight:800;font-style:italic;letter-spacing:-.02em}.lead{font-size:12.5px;color:#9CA3AF;max-width:760px;line-height:1.5}
.hero{margin:18px 0 6px}.ref{display:flex;gap:14px;align-items:flex-end;margin-top:auto}.ref figure{margin:0}.ref img{height:118px;border-radius:8px;display:block}
.ref figcaption{font-size:9.5px;color:#9CA3AF;margin-top:4px}.ref .old{padding:0 0 0 10px;opacity:.75}
.row{display:grid;grid-template-columns:230px 1fr 130px 130px;gap:18px;align-items:center;padding:12px 0;border-top:1px solid #1E1E25}.light .row{border-color:#DCDDE5}
.lab b{font-size:14px}.lab p{font-size:10px;color:#9CA3AF;line-height:1.4;margin-top:4px}.light .lab p{color:#5B6070}
.chip{font-size:9px;font-weight:700;background:linear-gradient(90deg,#E23DF5,#8749FF);color:#fff;border-radius:99px;padding:2px 8px;margin-left:8px;vertical-align:2px}
.sw{display:flex;gap:4px;margin-top:6px}.sw i{width:22px;height:10px;border-radius:3px;display:block}
.sy{display:flex;justify-content:center}.ic{border-radius:20px}.dark .ic{box-shadow:0 0 0 1px #2A2A35}
.mono{display:flex;gap:12px;align-items:center;margin-top:6px}.mono div{padding:10px 16px;border-radius:10px;border:1px solid #DCDDE5;background:#fff}.mono span{font-size:10px;color:#5B6070}
.foot{position:absolute;left:16mm;right:16mm;bottom:7mm;display:flex;justify-content:space-between;font-size:9px;color:#7C8090}
.mk{display:grid;grid-template-columns:200px 200px 1fr;gap:16px;flex:1;min-height:0}
.phone{width:200px;height:400px;border-radius:30px;border:7px solid #15161C;overflow:hidden;position:relative}
.home{background:linear-gradient(160deg,#2A1650 0%,#0B0E24 55%,#05070F 100%)}
.apps{display:grid;grid-template-columns:repeat(4,1fr);gap:14px 8px;padding:34px 12px}.app{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:7.5px;color:#fff}
.app i{width:36px;height:36px;border-radius:9px;background:rgba(255,255,255,.14);display:block}.app img{width:36px;height:36px}
.splash{background:#04050B;display:flex;flex-direction:column;align-items:center;justify-content:center}.splash p{position:absolute;bottom:26px;color:#9CA3AF;font-size:10px}
.col{display:flex;flex-direction:column;gap:12px;min-width:0}
.brw{border-radius:12px;overflow:hidden;border:1px solid #DCDDE5;background:#fff}.brw .tab{background:#E8E9EF;padding:8px 12px;font-size:10px;font-weight:600;display:flex;gap:7px;align-items:center}
.nav{background:#04050B;display:flex;justify-content:space-between;align-items:center;padding:12px 16px}.lk2{display:flex;gap:16px;color:#9CA3AF;font-size:10px;align-items:center}
.btn{background:linear-gradient(90deg,#00E5E5,#8749FF);color:#fff;font-weight:800;font-style:italic;border-radius:99px;padding:5px 14px}
.hero2{background:#04050B;color:#fff;padding:4px 16px 18px;font-size:20px;font-weight:800;font-style:italic;line-height:1.1}.hero2 b{color:#B76BFF}
.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}.ntf{background:linear-gradient(160deg,#2A1650,#05070F);border-radius:12px;padding:12px;display:flex;gap:9px;color:#fff;font-size:9.5px;line-height:1.4}
.ntf img{border-radius:8px}.prof{background:#fff;border:1px solid #DCDDE5;border-radius:12px;padding:12px;display:flex;gap:12px;align-items:center;font-size:10px}
.icons{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.icons span{font-size:10px;color:#5B6070}"""

html = f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>RoleGo — logo v3</title><style>{CSS}</style></head><body>{"".join(pages)}</body></html>'
open(os.path.join(HERE, "apresentacao-logo-v3.html"), "w").write(html)
print("ok")

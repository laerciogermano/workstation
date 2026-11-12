#!/usr/bin/env python3
"""Apresentação do logo v4 (A4 paisagem). Rodar depois de _build_v4.py."""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
I = lambda f, h=None, w=None, cls="": f'<img class="{cls}" src="{f}" style="{f"height:{h}px;" if h else ""}{f"width:{w}px;" if w else ""}">'
foot = lambda n: f'<div class="foot"><span>RolêGo · logo v4 · roxo + branco</span><span>{n}</span></div>'
pages = []

pages.append(f"""<section class="page purple cover"><div class="eyebrow">Logo v4 · 08/11/2026</div>
<div class="hero">{I("v4-lockup-purple.svg", h=150)}</div>
<h1>Roxo com a marca em branco, <b>Rolê e Go separados</b></h1>
<p class="lead">Mesmo desenho do L1 (G e pin numa peça só). O que muda: acento em <b>Rolê</b>; o Go do nome é sempre o símbolo Go; “Rolê” e “Go” nunca na mesma cor; a superfície roxa do ícone que funcionou vira o estilo principal; no preto não há letra roxa.</p>
<div class="ref"><figure>{I("../logo-v3/v3b-icon-app.svg", h=96, cls="ic")}<figcaption>v3 · ícone B (base do estilo)</figcaption></figure>
<figure class="old">{I("../logo-v3/v3a-lockup-color.svg", h=40)}<figcaption>v3 · nome inteiro numa cor, sem acento (sai)</figcaption></figure></div>
{foot(1)}</section>""")

def panel(cls, title, note, lock, go, stk, icon):
    return (f'<div class="pan {cls}"><div class="pl"><b>{title}</b><p>{note}</p></div>'
            f'<div class="lk">{I(lock, h=70)}</div><div class="sy">{I(go, h=80)}</div><div class="sy">{I(stk, h=96)}</div><div class="sy">{I(icon, h=80, cls="ic")}</div></div>')

pages.append(f"""<section class="page light"><div class="eyebrow">2 · Três fundos</div><h2>Rolê numa cor, Go em outra — sempre</h2>
{panel("purple", "No roxo (principal)", "Rolê branco · Go ciano · símbolo e ícone em branco", "v4-lockup-purple.svg", "v4-go-white.svg", "v4-stacked-purple.svg", "v4-icon-app.svg")}
{panel("dark", "No preto", "Rolê branco · Go ciano → azul · nenhuma letra roxa", "v4-lockup-dark.svg", "v4-go-dark.svg", "v4-stacked-dark.svg", "v4-icon-app-dark.svg")}
{panel("lite", "No claro", "Rolê preto · Go no roxo da marca", "v4-lockup-light.svg", "v4-go-light.svg", "v4-stacked-light.svg", "v4-icon-app.svg")}
<div class="mono"><div style="background:#000">{I("v4-lockup-white.svg", h=36)}</div><div>{I("v4-lockup-ink.svg", h=36)}</div><span>Uma cor (impressão, carimbo): única exceção em que Rolê e Go dividem a cor.</span></div>
{foot(2)}</section>""")

apps = "".join('<div class="app"><i></i></div>' for _ in range(5)) + f'<div class="app">{I("v4-icon-app.svg")}<span>RolêGo</span></div>' + \
       "".join('<div class="app"><i></i></div>' for _ in range(10))
pages.append(f"""<section class="page light"><div class="eyebrow">3 · Usos</div><h2>No celular, no site e no feed</h2>
<div class="mk"><div class="phone home"><div class="apps">{apps}</div></div>
<div class="phone splash">{I("v4-stacked-purple.svg", w=150)}<p>Bora pro rolê?</p></div>
<div class="col"><div class="brw"><div class="tab">{I("v4-icon-fav.svg", h=14)} RolêGo — rolês perto de você</div>
<div class="nav">{I("v4-lockup-purple.svg", h=28)}<div class="lk2"><span>Rolês</span><span>Mapa</span><span class="btn">Bora</span></div></div>
<div class="hero2">Os rolês da sua cidade,<br><b>num swipe.</b></div></div>
<div class="two"><div class="ntf">{I("v4-icon-app.svg", h=34)}<div><b>RolêGo</b> · agora<br>Seu grupo deu match: Samba no Largo, sexta 21h. Bora?</div></div>
<div class="prof">{I("v4-icon-avatar.svg", h=64)}<div><b>rolego</b><br>Os rolês da sua cidade, num swipe.</div></div></div>
<div class="icons">{I("v4-icon-app.svg", h=70)}{I("v4-icon-avatar.svg", h=70)}{I("v4-icon-app-dark.svg", h=70)}{I("v4-icon-avatar-dark.svg", h=70)}{I("v4-icon-fav.svg", h=32)}{I("v4-icon-fav-dark.svg", h=32)}<span>Ícones: roxo (principal), escuro, avatar, favicon</span></div>
</div></div>{foot(3)}</section>""")

exec(open(os.path.join(HERE, "_usos.py")).read())
PURPLE = "linear-gradient(135deg,#9E19E9 0%,#6539CB 50%,#452EFF 100%)"
CSS = """@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,600;0,800;1,800&display=swap');
@page{size:297mm 210mm;margin:0}*{box-sizing:border-box;margin:0}body{font-family:Poppins,sans-serif;background:#222}
.page{width:297mm;height:210mm;padding:14mm 16mm;position:relative;overflow:hidden;page-break-after:always;display:flex;flex-direction:column;gap:10px}
.purple{background:PURPLE;color:#fff}.light{background:#F4F4F8;color:#05070F}
.eyebrow{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#9CA3AF}.purple .eyebrow{color:rgba(255,255,255,.7)}
h1{font-size:34px;font-weight:800;font-style:italic;letter-spacing:-.02em;line-height:1.1}h1 b{color:#00E5E5}
h2{font-size:24px;font-weight:800;font-style:italic;letter-spacing:-.02em}.lead{font-size:12.5px;color:rgba(255,255,255,.82);max-width:780px;line-height:1.5}
.hero{margin:18px 0 6px}.ref{display:flex;gap:22px;align-items:flex-end;margin-top:auto}.ref figure{margin:0}
.ref figcaption{font-size:9.5px;color:rgba(255,255,255,.75);margin-top:6px}.ref .old{opacity:.8}
.ic{border-radius:20px;display:block}
.pan{display:grid;grid-template-columns:200px 1fr 110px 140px 100px;gap:16px;align-items:center;padding:14px 18px;border-radius:16px}
.pan.purple{background:PURPLE}.pan.dark{background:#000;color:#fff}.pan.lite{background:#fff;border:1px solid #DCDDE5}
.pl b{font-size:14px}.pl p{font-size:10px;line-height:1.4;margin-top:4px;opacity:.75}
.sy{display:flex;justify-content:center}
.mono{display:flex;gap:12px;align-items:center;margin-top:4px}.mono div{padding:10px 16px;border-radius:10px;border:1px solid #DCDDE5;background:#fff}.mono span{font-size:10px;color:#5B6070}
.foot{position:absolute;left:16mm;right:16mm;bottom:7mm;display:flex;justify-content:space-between;font-size:9px;color:#7C8090}.purple .foot{color:rgba(255,255,255,.65)}
.mk{display:grid;grid-template-columns:200px 200px 1fr;gap:16px;flex:1;min-height:0}
.phone{width:200px;height:400px;border-radius:30px;border:7px solid #15161C;overflow:hidden;position:relative}
.home{background:linear-gradient(160deg,#1A1A22 0%,#000 100%)}
.apps{display:grid;grid-template-columns:repeat(4,1fr);gap:14px 8px;padding:34px 12px}.app{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:7.5px;color:#fff}
.app i{width:36px;height:36px;border-radius:9px;background:rgba(255,255,255,.14);display:block}.app img{width:36px;height:36px}
.splash{background:PURPLE;display:flex;flex-direction:column;align-items:center;justify-content:center}.splash p{position:absolute;bottom:26px;color:rgba(255,255,255,.8);font-size:10px}
.col{display:flex;flex-direction:column;gap:12px;min-width:0}
.brw{border-radius:12px;overflow:hidden;border:1px solid #DCDDE5;background:#fff}.brw .tab{background:#E8E9EF;padding:8px 12px;font-size:10px;font-weight:600;display:flex;gap:7px;align-items:center}
.nav{background:PURPLE;display:flex;justify-content:space-between;align-items:center;padding:12px 16px}.lk2{display:flex;gap:16px;color:rgba(255,255,255,.85);font-size:10px;align-items:center}
.btn{background:#fff;color:#6539CB;font-weight:800;font-style:italic;border-radius:99px;padding:5px 14px}
.hero2{background:#000;color:#fff;padding:14px 16px 18px;font-size:20px;font-weight:800;font-style:italic;line-height:1.1}.hero2 b{color:#00E5E5}
.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}.ntf{background:#000;border-radius:12px;padding:12px;display:flex;gap:9px;color:#fff;font-size:9.5px;line-height:1.4}
.ntf img{border-radius:8px}.prof{background:#fff;border:1px solid #DCDDE5;border-radius:12px;padding:12px;display:flex;gap:12px;align-items:center;font-size:10px}
.icons{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.icons img{border-radius:16px}.icons span{font-size:10px;color:#5B6070}""".replace("PURPLE", PURPLE)

html = f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>RolêGo — logo v4</title><style>{CSS}{USOS_CSS}</style></head><body>{"".join(pages)}</body></html>'
open(os.path.join(HERE, "apresentacao-logo-v4.html"), "w").write(html)
print("ok")

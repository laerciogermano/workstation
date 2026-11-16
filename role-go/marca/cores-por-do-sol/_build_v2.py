"""RolêGo · variações de cor pôr do sol (dia + noite). 5 paletas x 2 págs (dia / noite) + capa + comparativo.
Logo: paths da gomosa (../identidade-v5-gomosa). Fotos: ../fotos-sunset (dia) e ../fotos-festa (noite), Pexels, uso interno."""
import base64, io, os, re, subprocess
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
V5 = os.path.join(HERE, "..", "identidade-v5-gomosa")
DIRS = [os.path.join(HERE, "..", "fotos-sunset"), os.path.join(HERE, "..", "fotos-festa")]
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

_d = lambda f: re.findall(r' d="([^"]+)"', open(os.path.join(V5, f)).read())
ROLE_D, GOL_D = _d("v4-lockup-white.svg")
GO_D = _d("v4-go-white.svg")[0]
_n = [0]


def paint(c, defs, x2=989, y2=256):
    """c = '#hex' ou lista de stops -> fill."""
    if isinstance(c, str):
        return c
    _n[0] += 1; i = f"g{_n[0]}"
    st = "".join(f'<stop offset="{k/(len(c)-1):.2f}" stop-color="{v}"/>' for k, v in enumerate(c))
    defs.append(f'<linearGradient id="{i}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="{x2}" y2="{y2}">{st}</linearGradient>')
    return f"url(#{i})"


def lockup(rc, gc, h=60):
    defs = []; a = paint(rc, defs); b = paint(gc, defs)
    return (f'<svg viewBox="0 0 989 256" style="height:{h}px;display:block"><defs>{"".join(defs)}</defs>'
            f'<path fill="{a}" fill-rule="evenodd" d="{ROLE_D}"/><path fill="{b}" fill-rule="evenodd" d="{GOL_D}"/></svg>')


def icon(bg, gc, s=70, r=.23):
    defs = []; a = paint(bg, defs, 256, 256); b = paint(gc, defs, 256, 256)
    return (f'<svg viewBox="0 0 256 256" style="width:{s}px;height:{s}px;display:block"><defs>{"".join(defs)}</defs>'
            f'<rect width="256" height="256" rx="{256*r}" fill="{a}"/>'
            f'<path transform="translate(128 128) scale(.86) translate(-128 -128)" fill="{b}" fill-rule="evenodd" d="{GO_D}"/></svg>')


def go(c, s=40):
    defs = []; a = paint(c, defs, 256, 256)
    return f'<svg viewBox="0 0 256 256" style="width:{s}px;height:{s}px;display:block"><defs>{"".join(defs)}</defs><path fill="{a}" fill-rule="evenodd" d="{GO_D}"/></svg>'


_c = {}
def foto(n, w=900):
    if (n, w) not in _c:
        p = next(os.path.join(d, n + ".jpg") for d in DIRS if os.path.exists(os.path.join(d, n + ".jpg")))
        im = Image.open(p).convert("RGB")
        if im.width > w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        b = io.BytesIO(); im.save(b, "JPEG", quality=80, optimize=True)
        _c[(n, w)] = "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()
    return _c[(n, w)]


def lum(h):
    c=[int(h[i:i+2],16)/255 for i in (1,3,5)]
    c=[x/12.92 if x<=.03928 else ((x+.055)/1.055)**2.4 for x in c]
    return .2126*c[0]+.7152*c[1]+.0722*c[2]


def on_sky(p):
    """Cor de destaque sobre o céu: noite se o horizonte é claro, sol se é escuro."""
    return p["gsky"]


def lg(stops, ang=180):
    return f"linear-gradient({ang}deg,{','.join(stops)})"


# ------------------------------------------------------------------ paletas v2: original + 1 cor
# Original aprovada: roxo #9E19E9 -> #6539CB -> #452EFF, ciano #00E5E5, preto, branco. Cada variação soma UMA cor quente.
ORIG = [("Roxo", "#9E19E9"), ("Roxo médio", "#6539CB"), ("Azul", "#452EFF"), ("Ciano", "#00E5E5"), ("Preto", "#000000")]
ROXO = ["#9E19E9", "#6539CB", "#452EFF"]
INK = "#160B33"


def mix(h, t=.86):
    c = [int(h[i:i+2], 16) for i in (1, 3, 5)]
    return "#" + "".join(f"{round(x + (255 - x) * t):02X}" for x in c)


def rgba(h, a):
    return f"rgba({int(h[1:3],16)},{int(h[3:5],16)},{int(h[5:7],16)},{a})"


NOVAS = [
 ("1", "Laranja pôr do sol", "#FF7A2F", "O laranja do sol caindo no mar. É o par mais direto do roxo: juntos eles formam o céu das 18h."),
 ("2", "Coral", "#FF5E57", "Um laranja puxado pro vermelho, de verão. Mais quente e mais vivo que o laranja, sem virar neon."),
 ("3", "Amarelo sol", "#FFC53D", "O sol do meio da tarde. Dá a cara mais diurna e alegre; no roxo, vira luz de festa."),
 ("4", "Pêssego", "#FFA77F", "O céu depois que o sol some. A mais suave e menos pop das dez."),
 ("5", "Dourado", "#F2A93B", "A luz dourada da golden hour. Quente e elegante, combina com rooftop e luau."),
 ("6", "Terracota", "#D9603B", "Areia molhada e tijolo. A mais orgânica e menos tecnológica de todas."),
 ("7", "Areia", "#F2DFC2", "Em vez de cor forte, um fundo de areia no dia. O roxo continua sendo a noite; o dia fica claro e de praia."),
 ("8", "Rosa pôr do sol", "#FF8FA3", "O rosa das nuvens no fim da tarde. Doce, mas sem ser chiclete."),
 ("9", "Tangerina", "#FF8A3D", "Laranja mais aberto e suculento, de fruta e de verão. Fica ótimo em degradê com o roxo."),
 ("10", "Fogueira", "#EE4B2B", "O vermelho-laranja da fogueira do luau. A mais intensa: liga o dia e a noite pelo fogo."),
]

P = []
for k, nome, c, ideia in NOVAS:
    light = lum(c) > .4
    P.append(dict(k=k, nome=nome, tag=f"original + {nome.lower()} {c}", ideia=ideia,
        cores=[(nome, c)] + ORIG,
        sky=["#452EFF", "#9E19E9", c, c], skyn=ROXO,
        day=c if k == "7" else mix(c, .86), ink=INK, night="#000000",
        rd=INK, gd="#6539CB" if light else c, rn="#FFFFFF", gn=c, hr=INK if light else "#FFFFFF", hg="#FFFFFF" if light else INK,
        ov_d=rgba(c, .25), ov_n="linear-gradient(180deg,rgba(101,57,203,.15),rgba(0,0,0,.8))"))

CSS = """@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;0,800;1,700;1,800&display=swap');
@page{size:297mm 210mm;margin:0}*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Poppins,sans-serif;background:#333;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:297mm;height:210mm;padding:11mm 13mm 12mm;position:relative;overflow:hidden;page-break-after:always;display:flex;flex-direction:column;gap:9px}
.hd{display:flex;justify-content:space-between;align-items:flex-end}
.eb{font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;opacity:.65}
h2{font-size:25px;font-weight:800;font-style:italic;letter-spacing:-.03em;line-height:1.05}
.tag{font-size:11px;font-weight:600;opacity:.75;margin-top:2px}
.foot{position:absolute;left:13mm;right:13mm;bottom:5mm;display:flex;justify-content:space-between;font-size:8.5px;opacity:.55}
.ph{position:relative;overflow:hidden;background-size:cover;background-position:center 35%}
.ph .ov{position:absolute;inset:0}
.abs{position:absolute;z-index:3}
.t{font-weight:800;font-style:italic;letter-spacing:-.035em;line-height:.95}
.slo{font-weight:800;font-style:italic;letter-spacing:-.02em}
.sw{display:flex;gap:6px}.sw div{flex:1}.sw i{display:block;height:34px;border-radius:9px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.08)}
.sw b{display:block;font-size:9.5px;margin-top:4px}.sw code{font-family:ui-monospace,Menlo,monospace;font-size:8.5px;opacity:.65}
.grid{flex:1;display:grid;gap:10px;min-height:0}
.lb{font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;opacity:.6;margin-top:4px}
.card{border-radius:14px;overflow:hidden;position:relative}
.phone{border-radius:26px;padding:7px;background:#111;height:100%}
.scr{border-radius:20px;overflow:hidden;height:100%;position:relative;display:flex;flex-direction:column}
.ev{display:flex;gap:8px;align-items:center;padding:7px;border-radius:12px}
.ev .th{width:44px;height:44px;border-radius:9px;background-size:cover;background-position:center;flex-shrink:0}
.ev b{display:block;font-size:10px;line-height:1.2}.ev span{font-size:8.5px;opacity:.7}
.pill{display:inline-block;border-radius:99px;padding:3px 9px;font-size:9px;font-weight:800}
.note{font-size:10px;line-height:1.45;opacity:.85}
.tee{position:relative;width:150px;height:160px;margin:auto}
"""

def tee(col, inner):
    return (f'<div class="tee"><svg viewBox="0 0 150 160" style="position:absolute;inset:0;width:100%;height:100%">'
            f'<path d="M45 8 L20 18 L2 48 L24 60 L32 48 L32 156 L118 156 L118 48 L126 60 L148 48 L130 18 L105 8 Q75 30 45 8Z" fill="{col}" stroke="rgba(0,0,0,.12)"/></svg>'
            f'<div style="position:absolute;left:0;right:0;top:46px;display:flex;justify-content:center">{inner}</div></div>')


def page_day(p, n):
    sky = lg(p["sky"]); ink = p["ink"]; ac = p["gd"]
    sw = "".join(f'<div><i style="background:{h}"></i><b>{nm}</b><code>{h}</code></div>' for nm, h in p["cores"])
    ov = p["ov_d"]
    return f"""<section class="page" style="background:{p['day']};color:{ink}">
<div class="hd"><div><div class="eb">Variação {p['k']} · dia</div><h2>{p['nome']}</h2><div class="tag">{p['tag']}</div></div>
<div style="width:46%"><div class="sw">{sw}</div></div></div>
<div class="grid" style="grid-template-columns:1.25fr .8fr .8fr 1fr;grid-template-rows:1fr 1fr">
 <div class="card" style="grid-row:span 2;background:{sky};display:flex;flex-direction:column;justify-content:space-between;padding:22px">
   <div class="note" style="color:#fff;max-width:260px;opacity:.95">{p['ideia']}</div>
   <div>{lockup(p['hr'], p['hg'], 66)}
   <div class="slo" style="font-size:20px;margin-top:12px"><span style="color:{p['hr']}">Viva o</span> <span style="color:{p['hg']}">rolê.</span></div></div>
 </div>
 <div class="card ph" style="grid-row:span 2;background-image:url({foto('loira-praia',700)});background-position:center 30%">
   <div class="ov" style="background:{ov};mix-blend-mode:soft-light"></div>
   <div class="ov" style="background:linear-gradient(180deg,rgba(0,0,0,0) 45%,rgba(0,0,0,.55))"></div>
   <div class="abs" style="top:12px;left:12px;right:12px;display:flex;gap:3px">{''.join('<i style="flex:1;height:2px;border-radius:2px;background:rgba(255,255,255,%s)"></i>' % o for o in ('1','.45','.45'))}</div>
   <div class="abs" style="top:24px;left:14px">{go('#FFFFFF',26)}</div>
   <div class="abs t" style="left:14px;right:14px;bottom:52px;color:#fff;font-size:30px">Sábado:<br>pôr do sol<br>na praia</div>
   <div class="abs" style="left:14px;bottom:20px"><span class="pill" style="background:{ac};color:#fff">Bora? 4 amigas vão</span></div>
 </div>
 <div class="card ph" style="background-image:url({foto('praia-tres-amigas',600)});background-position:center 60%">
   <div class="ov" style="background:{ov};mix-blend-mode:soft-light"></div>
   <div class="abs" style="left:0;right:0;bottom:0;background:{p['day']};padding:9px 11px;display:flex;justify-content:space-between;align-items:center">
    <div><b style="font-size:11px;display:block">Luau do Posto 9</b><span style="font-size:8.5px;opacity:.7">hoje · 17h30 · 1,2 km</span></div>{go(ac,22)}</div>
 </div>
 <div class="card" style="background:#fff;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;box-shadow:0 1px 0 rgba(0,0,0,.06)">
   {lockup(p['rd'], ac, 34)}
   <div style="display:flex;gap:10px">{icon(p['sky'], '#FFFFFF', 52)}{icon(p['day'], ac, 52)}{icon(ac, '#FFFFFF', 52)}</div>
 </div>
 <div class="card" style="background:{p['cores'][0][1] if p['k']!='7' else '#6539CB'};display:flex;align-items:center;justify-content:center">
   {tee(p['day'], lockup(p['rd'], ac, 22))}
 </div>
 <div class="card" style="background:{ink};display:flex;flex-direction:column;justify-content:center;align-items:center;gap:12px;color:{p['day']}">
   <div style="width:82%;height:46px;border-radius:8px;background:{sky};display:flex;align-items:center;justify-content:space-between;padding:0 12px">
     {lockup('#FFFFFF', INK, 18)}<span class="slo" style="font-size:10px;color:#fff">LUAU · 17H</span></div>
   <div class="lb" style="color:{p['day']}">pulseira do rolê</div>
 </div>
</div>
<div class="foot"><span>RolêGo · original + 1 cor</span><span>{n}</span></div></section>"""


def page_night(p, n):
    nb = p["night"]; tx = p["rn"]; ac = p["gn"]; skyn = lg(p["skyn"]); sky = lg(p["sky"])
    ovn = p["ov_n"]
    return f"""<section class="page" style="background:{nb};color:{tx}">
<div class="hd"><div><div class="eb">Variação {p['k']} · noite</div><h2>{p['nome']} <span style="color:{ac}">à noite</span></h2>
<div class="tag">o preto e o roxo originais seguram a noite; a cor nova vira a luz</div></div>
<div style="display:flex;gap:10px;align-items:center">{icon(nb, ac, 46)}{icon(p['skyn'], ac, 46)}{icon(p['sky'], '#FFFFFF', 46)}</div></div>
<div class="grid" style="grid-template-columns:1fr .78fr 1.05fr .9fr;grid-template-rows:1fr 1fr">
 <div class="card ph" style="grid-row:span 2;background-image:url({foto('brinde-rooftop',800)})">
   <div class="ov" style="background:{p['cores'][0][1]};mix-blend-mode:color;opacity:.35"></div>
   <div class="ov" style="background:{ovn}"></div>
   <div class="abs" style="left:18px;top:18px">{lockup(tx, ac, 26)}</div>
   <div class="abs t" style="left:18px;right:18px;bottom:44px;color:#fff;font-size:36px">Do pôr do sol<br>ao <span style="color:{ac}">after.</span></div>
   <div class="abs slo" style="left:18px;bottom:20px;font-size:12px;color:{tx}">Viva o <span style="color:{ac}">rolê.</span></div>
 </div>
 <div style="grid-row:span 2"><div class="phone"><div class="scr" style="background:{nb};padding:12px 9px;gap:8px;border:1px solid rgba(255,255,255,.06)">
   <div style="display:flex;justify-content:space-between;align-items:center">{lockup(tx, ac, 15)}<span class="pill" style="background:{ac};color:{nb}">hoje</span></div>
   <div class="ph" style="height:118px;border-radius:12px;background-image:url({foto('danca-cabelo',500)})"><div class="ov" style="background:{p['cores'][0][1]};mix-blend-mode:color;opacity:.3"></div><div class="ov" style="background:linear-gradient(180deg,transparent 40%,{nb})"></div>
     <div class="abs" style="left:8px;bottom:6px"><b style="font-size:11px;color:#fff">Sunset Session</b><br><span style="font-size:8.5px;color:#fff;opacity:.8">22h · Rooftop Centro</span></div></div>
   {''.join(f'<div class="ev" style="background:rgba(255,255,255,.06)"><div class="th" style="background-image:url({foto(f,200)})"></div><div><b>{t}</b><span>{s}</span></div></div>' for f,t,s in [('confete-festa','Festa do Confete','23h · 8 amigos vão'),('show-de-costas','Show na Orla','21h · 2,4 km'),('risada-festa','After na Casa Azul','01h · lista aberta')])}
   <div style="margin-top:auto;height:34px;border-radius:12px;background:{sky};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;font-style:italic;color:#fff">Partiu rolê</div>
 </div></div></div>
 <div class="card ph" style="background-image:url({foto('show-de-costas',700)})">
   <div class="ov" style="background:{p['cores'][0][1]};mix-blend-mode:color;opacity:.35"></div><div class="ov" style="background:{ovn}"></div>
   <div class="abs" style="left:14px;bottom:14px;right:14px;display:flex;justify-content:space-between;align-items:flex-end">
     <div class="t" style="color:#fff;font-size:22px">Sexta tem<br><span style="color:{ac}">rolê.</span></div>{go(ac,34)}</div>
 </div>
 <div class="card" style="background:{skyn};display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;border:1px solid rgba(255,255,255,.06)">
   {lockup(tx, ac, 40)}
   <div class="slo" style="font-size:13px">Viva o <span style="color:{ac}">rolê.</span></div>
 </div>
 <div class="card" style="background:#0B0B0D;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px">
   <div style="width:170px;height:86px;border-radius:10px;background:{sky};position:relative;padding:12px;color:#fff;overflow:hidden">
     <div class="abs" style="right:-10px;bottom:-22px;opacity:.22">{go('#FFFFFF',74)}</div>
     <span style="font-size:8px;font-weight:700;letter-spacing:.08em">INGRESSO · VIP</span>
     <div class="t" style="font-size:17px;margin-top:4px">Sunset<br>Session</div>
     <div style="position:absolute;right:12px;top:10px">{lockup('#FFFFFF', nb, 10)}</div></div>
   <div class="lb" style="color:#fff">ingresso no app</div>
 </div>
 <div class="card" style="background:{p['cores'][2][1]};display:flex;align-items:center;justify-content:center">
   {tee(nb, lockup(tx, ac, 22))}
 </div>
</div>
<div class="foot"><span>RolêGo · original + 1 cor</span><span>{n}</span></div></section>"""


def cover():
    strips = "".join(f'<div style="flex:1;border-radius:12px;overflow:hidden;display:flex;flex-direction:column">'
                     f'<div style="flex:1;background:{lg(p["sky"])};padding:10px;display:flex;align-items:flex-end"><b style="color:#fff;font-size:22px;font-style:italic">{p["k"]}</b></div>'
                     f'<div style="height:38px;background:#000;display:flex;align-items:center;justify-content:center">{go(p["gn"],22)}</div>'
                     f'<div style="background:#fff;padding:7px 8px"><b style="font-size:10.5px;font-style:italic;display:block;line-height:1.1">{p["nome"]}</b><code style="font-size:8px;opacity:.6">{p["cores"][0][1]}</code></div></div>' for p in P)
    orig = "".join(f'<div style="display:flex;align-items:center;gap:6px"><i style="width:22px;height:22px;border-radius:6px;background:{h};box-shadow:inset 0 0 0 1px rgba(0,0,0,.1)"></i><span style="font-size:9.5px"><b>{n}</b> {h}</span></div>' for n, h in ORIG + [("Branco", "#FFFFFF")])
    return f"""<section class="page" style="background:#F4F1EC;color:{INK}">
<div class="hd"><div><div class="eb">RolêGo · estudo de cor 2 · 13/11/2026</div><h2 style="font-size:32px">Original + 1 cor</h2>
<div class="note" style="max-width:620px;margin-top:6px">As cores originais continuam (roxo, ciano, preto e branco) e cada variação soma <b>uma</b> cor quente de pôr do sol. O roxo e o preto seguram a noite; a cor nova traz o dia, a praia e o sol. Cada variação tem <b>duas páginas</b>: dia e noite.</div></div>
{icon(ROXO, '#FFFFFF', 74)}</div>
<div style="display:flex;gap:16px;flex-wrap:wrap;margin:2px 0 4px"><span class="eb" style="align-self:center">base original</span>{orig}</div>
<div style="flex:1;display:flex;gap:8px">{strips}</div>
<div class="foot"><span>Fotos: Pexels, só para estudo interno (sem autorização de imagem)</span><span>1</span></div></section>"""


def compare(n):
    rows_data = [dict(k="0", nome="Original (hoje)", tag="roxo + ciano + preto", day="#FFFFFF", rd=INK, gd="#6539CB", sky=ROXO, night="#000000", rn="#FFFFFF", gn="#00E5E5")] + P
    rows = ""
    for p in rows_data:
        skr, skg = ("#FFFFFF", "#00E5E5") if p["k"] == "0" else ("#FFFFFF", INK)
        rows += (f'<div style="display:grid;grid-template-columns:150px 1fr 1fr 1fr 1fr;gap:8px">'
                 f'<div style="display:flex;flex-direction:column;justify-content:center"><b style="font-size:12px;font-style:italic">{p["k"]} · {p["nome"]}</b></div>'
                 f'<div class="card" style="border-radius:9px;background:{p["day"]};display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px rgba(0,0,0,.08)">{lockup(p["rd"], p["gd"], 20)}</div>'
                 f'<div class="card" style="border-radius:9px;background:{lg(p["sky"],100)};display:flex;align-items:center;justify-content:center">{lockup(skr, skg, 20)}</div>'
                 f'<div class="card" style="border-radius:9px;background:{lg(ROXO,135)};display:flex;align-items:center;justify-content:center">{lockup("#FFFFFF", p["gn"], 20)}</div>'
                 f'<div class="card" style="border-radius:9px;background:#000;display:flex;align-items:center;justify-content:center">{lockup(p["rn"], p["gn"], 20)}</div></div>')
    return f"""<section class="page" style="background:#F4F1EC;color:{INK}">
<h2 style="white-space:nowrap">Lado a lado: original e as 10</h2>
<div style="display:grid;grid-template-columns:150px 1fr 1fr 1fr 1fr;gap:8px;font-size:8.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;opacity:.6;text-align:center"><span></span><span>dia</span><span>pôr do sol</span><span>roxo</span><span>noite</span></div>
<div style="flex:1;display:grid;grid-template-rows:repeat(11,1fr);gap:5px">{rows}</div>
<div class="foot"><span>Qual número fica? Dá pra combinar duas (ex.: 1 no dia e 3 nos detalhes).</span><span>{n}</span></div></section>"""


pages = [cover()]; n = 2
for p in P:
    pages.append(page_day(p, n)); pages.append(page_night(p, n + 1)); n += 2
pages.append(compare(n))
html = f'<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>RolêGo · original + 1 cor</title><style>{CSS}</style></head><body>{"".join(pages)}</body></html>'
out = os.path.join(HERE, "original-mais-uma-cor-rolego.html")
open(out, "w").write(html)
subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--virtual-time-budget=15000",
                f"--print-to-pdf={out[:-5]}.pdf", "file://" + out], check=True, capture_output=True)
print("ok", len(pages), "págs")

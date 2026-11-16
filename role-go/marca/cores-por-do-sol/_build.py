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
    return p["night"] if lum(p["sky"][-1]) > .12 else p["gn"]


def lg(stops, ang=180):
    return f"linear-gradient({ang}deg,{','.join(stops)})"


# ------------------------------------------------------------------ paletas
# sky = degradê do céu (topo -> horizonte); day/night = superfícies; rd/gd = Rolê/Go no dia; rn/gn = Rolê/Go na noite
P = [
 dict(k="A", nome="Pôr do sol", tag="laranja queimado + ameixa",
      ideia="O céu às 18h: laranja embaixo, ameixa em cima. Do dia pra noite, mudando só a luz. A ponte mais curta a partir da marca de hoje: o roxo vira ameixa (mais escuro e mais quente) e o neon sai.",
      cores=[("Sol", "#F28C38"), ("Coral", "#E4573D"), ("Ameixa", "#6B2D5C"), ("Noite", "#1E1530"), ("Areia", "#F6E7D4")],
      sky=["#F2A03D", "#E4573D", "#9B3A5E", "#3B2150"], skyn=["#3B2150", "#2A1A3E", "#1E1530"],
      day="#F6E7D4", ink="#2A1A2E", night="#1E1530", rd="#2A1A2E", gd="#E4573D", rn="#F6E7D4", gn="#F28C38",
      ov_d="rgba(242,140,56,.22)", ov_n="linear-gradient(180deg,rgba(107,45,92,.15),rgba(30,21,48,.75))", chip="#F28C38"),
 dict(k="B", nome="Golden hour", tag="âmbar + terracota + azul-petróleo",
      ideia="A luz dourada da praia no dia e o azul-petróleo do mar à noite. Quente e calmo, nada de neon: parece foto de filme, não app de tecnologia.",
      cores=[("Âmbar", "#EBA83A"), ("Terracota", "#C8553D"), ("Petróleo", "#1F4E5F"), ("Noite", "#0F2430"), ("Creme", "#FBF1E1")],
      sky=["#F3C15A", "#EBA83A", "#D97B3A", "#C8553D"], skyn=["#1F4E5F", "#15384A", "#0F2430"],
      day="#FBF1E1", ink="#1B2A30", night="#0F2430", rd="#1B2A30", gd="#C8553D", rn="#FBF1E1", gd2="#EBA83A", gn="#EBA83A",
      ov_d="rgba(235,168,58,.2)", ov_n="linear-gradient(180deg,rgba(31,78,95,.2),rgba(15,36,48,.8))", chip="#EBA83A"),
 dict(k="C", nome="Praia", tag="laranja + turquesa + areia",
      ideia="Mar, areia e sol. A mais solar e diurna das cinco; à noite o turquesa vira um azul profundo de mar escuro e o laranja aparece como luz de fogueira.",
      cores=[("Laranja", "#F47B3A"), ("Mar", "#2A9D9A"), ("Areia", "#F3E2C6"), ("Mar à noite", "#0E2A3B"), ("Espuma", "#FFFFFF")],
      sky=["#F9B36B", "#F47B3A", "#E8603A"], skyn=["#16465A", "#0E2A3B"],
      day="#F3E2C6", ink="#0E2A3B", night="#0E2A3B", rd="#0E2A3B", gd="#F47B3A", rn="#FFFFFF", gn="#F47B3A",
      ov_d="rgba(42,157,154,.14)", ov_n="linear-gradient(180deg,rgba(22,70,90,.2),rgba(14,42,59,.8))", chip="#2A9D9A"),
 dict(k="D", nome="Crepúsculo", tag="pêssego + rosé + vinho",
      ideia="O céu cor-de-rosa depois que o sol some. Mais suave e mais feminina; o vinho segura a noite com elegância, sem cara de balada eletrônica.",
      cores=[("Pêssego", "#F6A27A"), ("Rosé", "#D9637A"), ("Vinho", "#5A1F3A"), ("Noite", "#24121F"), ("Nuvem", "#FBEDE6")],
      sky=["#F8C08F", "#F6A27A", "#D9637A", "#8E3557"], skyn=["#5A1F3A", "#3A1629", "#24121F"],
      day="#FBEDE6", ink="#2E1222", night="#24121F", rd="#2E1222", gd="#D9637A", rn="#FBEDE6", gn="#F6A27A",
      ov_d="rgba(246,162,122,.2)", ov_n="linear-gradient(180deg,rgba(90,31,58,.2),rgba(36,18,31,.8))", chip="#F6A27A"),
 dict(k="E", nome="Do roxo ao sol", tag="mantém o roxo, só que mais fechado, com laranja",
      ideia="Para não perder o que já foi feito: o roxo continua como cor da noite, mas fechado (sem o azul elétrico) e com laranja e amarelo-sol entrando como a cor do dia.",
      cores=[("Sol", "#FFB547"), ("Laranja", "#F26A3D"), ("Roxo", "#5B2C8F"), ("Noite", "#1A1233"), ("Off-white", "#FFF6EC")],
      sky=["#FFB547", "#F26A3D", "#B2406B", "#5B2C8F"], skyn=["#5B2C8F", "#33205E", "#1A1233"],
      day="#FFF6EC", ink="#1A1233", night="#1A1233", rd="#1A1233", gd="#F26A3D", rn="#FFF6EC", gn="#FFB547",
      ov_d="rgba(255,181,71,.18)", ov_n="linear-gradient(180deg,rgba(91,44,143,.2),rgba(26,18,51,.8))", chip="#FFB547"),
]

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
<div class="hd"><div><div class="eb">Opção {p['k']} · dia</div><h2>{p['nome']}</h2><div class="tag">{p['tag']}</div></div>
<div style="width:46%"><div class="sw">{sw}</div></div></div>
<div class="grid" style="grid-template-columns:1.25fr .8fr .8fr 1fr;grid-template-rows:1fr 1fr">
 <div class="card" style="grid-row:span 2;background:{sky};display:flex;flex-direction:column;justify-content:space-between;padding:22px">
   <div class="note" style="color:#fff;max-width:260px;opacity:.95">{p['ideia']}</div>
   <div>{lockup('#FFFFFF', on_sky(p), 66)}
   <div class="slo" style="color:#fff;font-size:20px;margin-top:12px">Viva o <span style="color:{on_sky(p)}">rolê.</span></div></div>
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
 <div class="card" style="background:{p['cores'][1][1] if p['k']=='C' else p['cores'][0][1]};display:flex;align-items:center;justify-content:center">
   {tee(p['day'], lockup(p['rd'], ac, 22))}
 </div>
 <div class="card" style="background:{ink};display:flex;flex-direction:column;justify-content:center;align-items:center;gap:12px;color:{p['day']}">
   <div style="width:82%;height:46px;border-radius:8px;background:{sky};display:flex;align-items:center;justify-content:space-between;padding:0 12px">
     {lockup('#FFFFFF', on_sky(p), 18)}<span class="slo" style="font-size:10px;color:#fff">LUAU · 17H</span></div>
   <div class="lb" style="color:{p['day']}">pulseira do rolê</div>
 </div>
</div>
<div class="foot"><span>RolêGo · estudo de cor pôr do sol</span><span>{n}</span></div></section>"""


def page_night(p, n):
    nb = p["night"]; tx = p["rn"]; ac = p["gn"]; skyn = lg(p["skyn"]); sky = lg(p["sky"])
    ovn = p["ov_n"]
    return f"""<section class="page" style="background:{nb};color:{tx}">
<div class="hd"><div><div class="eb">Opção {p['k']} · noite</div><h2>{p['nome']} <span style="color:{ac}">à noite</span></h2>
<div class="tag">mesmas cores; o fundo escurece e o {p['cores'][0][0].lower()} vira a luz</div></div>
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
 <div class="card" style="background:{p['cores'][2][1] if p['k']!='C' else p['cores'][1][1]};display:flex;align-items:center;justify-content:center">
   {tee(nb, lockup(tx, ac, 22))}
 </div>
</div>
<div class="foot"><span>RolêGo · estudo de cor pôr do sol</span><span>{n}</span></div></section>"""


def cover():
    strips = "".join(f'<div style="flex:1;background:{lg(p["sky"])};border-radius:14px;padding:14px;display:flex;flex-direction:column;justify-content:space-between">'
                     f'<b style="color:#fff;font-size:28px;font-style:italic">{p["k"]}</b><div><div style="height:46px;border-radius:9px;background:{lg(p["skyn"])};margin-bottom:8px"></div>'
                     f'<b style="color:#fff;font-size:14px;font-style:italic;display:block">{p["nome"]}</b><span style="color:#fff;font-size:9px;opacity:.85">{p["tag"]}</span></div></div>' for p in P)
    return f"""<section class="page" style="background:#F6EFE6;color:#1E1530">
<div class="hd"><div><div class="eb">RolêGo · estudo de cor · 13/11/2026</div><h2 style="font-size:34px">Do pôr do sol ao after.</h2>
<div class="note" style="max-width:640px;margin-top:6px">A marca estava muito noite, muito roxa e muito pop (neon e sintético). Aqui são cinco paletas mais quentes e mais naturais, de praia e pôr do sol. Cada uma tem <b>duas páginas</b>: <b>dia</b> (praia, sol, fundo claro) e <b>noite</b> (festa, fundo escuro), com as mesmas cores, para a RolêGo funcionar das 17h às 3h. A logo gomosa não muda, só a cor.</div></div>
{lockup('#1E1530', '#E4573D', 44)}</div>
<div style="flex:1;display:flex;gap:10px;margin-top:6px">{strips}</div>
<div class="foot"><span>Fotos: Pexels, só para estudo interno (sem autorização de imagem)</span><span>1</span></div></section>"""


def compare(n):
    rows = ""
    for p in P:
        rows += (f'<div style="display:grid;grid-template-columns:150px 1fr 1fr 1fr;gap:10px;align-items:stretch">'
                 f'<div style="display:flex;flex-direction:column;justify-content:center"><b style="font-size:15px;font-style:italic">{p["k"]} · {p["nome"]}</b><span style="font-size:9px;opacity:.7">{p["tag"]}</span></div>'
                 f'<div class="card" style="background:{p["day"]};display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px rgba(0,0,0,.08)">{lockup(p["rd"], p["gd"], 26)}</div>'
                 f'<div class="card" style="background:{lg(p["sky"],100)};display:flex;align-items:center;justify-content:center">{lockup("#FFFFFF", p["night"], 26)}</div>'
                 f'<div class="card" style="background:{p["night"]};display:flex;align-items:center;justify-content:center">{lockup(p["rn"], p["gn"], 26)}</div></div>')
    return f"""<section class="page" style="background:#F6EFE6;color:#1E1530">
<div class="hd"><div><div class="eb">Lado a lado</div><h2 style="white-space:nowrap">A mesma logo, das 17h às 3h</h2></div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;width:calc(100% - 160px - 30px);gap:10px;font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;opacity:.6;text-align:center"><span>dia</span><span>pôr do sol</span><span>noite</span></div></div>
<div style="flex:1;display:grid;grid-template-rows:repeat(5,1fr);gap:8px">{rows}</div>
<div class="foot"><span>Qual letra fica? Pode misturar (ex.: o dia da C com a noite da A).</span><span>{n}</span></div></section>"""


pages = [cover()]; n = 2
for p in P:
    pages.append(page_day(p, n)); pages.append(page_night(p, n + 1)); n += 2
pages.append(compare(n))
html = f'<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>RolêGo · cores pôr do sol</title><style>{CSS}</style></head><body>{"".join(pages)}</body></html>'
out = os.path.join(HERE, "cores-por-do-sol-rolego.html")
open(out, "w").write(html)
subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--virtual-time-budget=15000",
                f"--print-to-pdf={out[:-5]}.pdf", "file://" + out], check=True, capture_output=True)
print("ok", len(pages), "págs")

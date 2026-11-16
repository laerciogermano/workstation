"""RolêGo · +50 variações (11–60): cores originais + UMA cor nova. 1 pág. por variação (dia | noite) + índice.
SVG da logo via <symbol>/<use> e fotos via classes CSS, para o HTML não explodir de tamanho."""
import base64, io, os, re, subprocess
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
V5 = os.path.join(HERE, "..", "identidade-v5-gomosa")
DIRS = [os.path.join(HERE, "..", "fotos-sunset"), os.path.join(HERE, "..", "fotos-festa")]
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
_d = lambda f: re.findall(r' d="([^"]+)"', open(os.path.join(V5, f)).read())
ROLE_D, GOL_D = _d("v4-lockup-white.svg"); GO_D = _d("v4-go-white.svg")[0]

ROXO = ["#9E19E9", "#6539CB", "#452EFF"]; INK = "#160B33"; CYAN = "#00E5E5"
ORIG = [("Roxo", "#9E19E9"), ("Roxo médio", "#6539CB"), ("Azul", "#452EFF"), ("Ciano", CYAN), ("Preto", "#000000")]

N = [0]
def paint(c, defs, x2, y2):
    if isinstance(c, str): return c
    N[0] += 1; i = f"g{N[0]}"
    st = "".join(f'<stop offset="{k/(len(c)-1):.2f}" stop-color="{v}"/>' for k, v in enumerate(c))
    defs.append(f'<linearGradient id="{i}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="{x2}" y2="{y2}">{st}</linearGradient>')
    return f"url(#{i})"

def lockup(rc, gc, h):
    return (f'<svg viewBox="0 0 989 256" style="height:{h}px;display:block"><use href="#sR" fill="{rc}"/><use href="#sL" fill="{gc}"/></svg>')

def go(c, s):
    return f'<svg viewBox="0 0 256 256" style="width:{s}px;height:{s}px;display:block"><use href="#sG" fill="{c}"/></svg>'

def icon(bg, gc, s):
    defs = []; a = paint(bg, defs, 256, 256)
    return (f'<svg viewBox="0 0 256 256" style="width:{s}px;height:{s}px;display:block"><defs>{"".join(defs)}</defs>'
            f'<rect width="256" height="256" rx="59" fill="{a}"/><g transform="translate(128 128) scale(.86) translate(-128 -128)"><use href="#sG" fill="{gc}"/></g></svg>')

SYMS = (f'<svg style="position:absolute;width:0;height:0"><symbol id="sR" viewBox="0 0 989 256"><path fill-rule="evenodd" d="{ROLE_D}"/></symbol>'
        f'<symbol id="sL" viewBox="0 0 989 256"><path fill-rule="evenodd" d="{GOL_D}"/></symbol>'
        f'<symbol id="sG" viewBox="0 0 256 256"><path fill-rule="evenodd" d="{GO_D}"/></symbol></svg>')

def foto(n, w):
    p = next(os.path.join(d, n + ".jpg") for d in DIRS if os.path.exists(os.path.join(d, n + ".jpg")))
    im = Image.open(p).convert("RGB")
    if im.width > w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=78, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()

FOTOS = {"f-loira": ("loira-praia", 520), "f-amigas": ("praia-tres-amigas", 520), "f-brinde": ("brinde-rooftop", 560),
         "f-show": ("show-de-costas", 520), "f-danca": ("danca-cabelo", 420)}
FCSS = "".join(f".{k}{{background-image:url({foto(*v)})}}" for k, v in FOTOS.items())

def lum(h):
    c = [int(h[i:i+2], 16)/255 for i in (1, 3, 5)]
    c = [x/12.92 if x <= .03928 else ((x+.055)/1.055)**2.4 for x in c]
    return .2126*c[0] + .7152*c[1] + .0722*c[2]

def mix(h, t):
    c = [int(h[i:i+2], 16) for i in (1, 3, 5)]
    return "#" + "".join(f"{round(x+(255-x)*t):02X}" for x in c)

def lg(stops, ang=180): return f"linear-gradient({ang}deg,{','.join(stops)})"

QUENTES = [("Mandarina", "#FF6F1A"), ("Abóbora", "#F07F2A"), ("Laranja sol", "#FF8A1F"), ("Mango", "#FFB01F"), ("Mel", "#F5B841"),
 ("Maracujá", "#FFD23F"), ("Sol da manhã", "#FFD98A"), ("Damasco", "#FFB38A"), ("Papaya", "#FF9A5A"), ("Pêssego queimado", "#F08A5D"),
 ("Laranja-rosado", "#FF8C69"), ("Salmão", "#FF8A73"), ("Coral queimado", "#F2694A"), ("Caju", "#F2552C"), ("Tomate", "#F04A32"),
 ("Brasa", "#D63A1F"), ("Vermelho pôr do sol", "#E0352B"), ("Goiaba", "#F2647E"), ("Melancia", "#FF4D6A"), ("Flamingo", "#FF7AAE"),
 ("Mostarda", "#E3A81B"), ("Caramelo", "#C9822E"), ("Cobre", "#C0663A"), ("Ferrugem", "#B5482B"), ("Terracota clara", "#E07A52")]
ESTILO = {"A": "dia chapado na cor", "B": "dia em degradê de sol"}


def blend(a, b, t):
    x = [int(a[i:i+2], 16) for i in (1, 3, 5)]; y = [int(b[i:i+2], 16) for i in (1, 3, 5)]
    return "#" + "".join(f"{round(p+(q-p)*t):02X}" for p, q in zip(x, y))


P = []; k = 11
for nome, c in QUENTES:
    for est in "AB":
        L = lum(c)
        v = dict(k=str(k), nome=nome, c=c, est=est); k += 1
        v["daybg"] = c if est == "A" else lg([blend(c, "#FFE08A", .6), c], 180)
        v["sun"] = [blend(c, "#FFE08A", .6), c]
        v["sky"] = ["#452EFF", "#9E19E9", c, c]          # pôr do sol = noite encontrando o dia
        v["night"] = "#000000"; v["gn"] = c
        v["hr"], v["hg"] = (INK, "#6539CB") if L > .45 else ("#FFFFFF", INK)   # logo sobre a cor
        v["gd"] = c if L < .45 else "#6539CB"            # Go sobre branco
        P.append(v)

CSS = """@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,600;0,700;0,800;1,700;1,800&display=swap');
@page{size:297mm 210mm;margin:0}*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Poppins,sans-serif;background:#333;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:297mm;height:210mm;padding:10mm 12mm 11mm;position:relative;overflow:hidden;page-break-after:always;display:flex;flex-direction:column;gap:8px;background:#F4F1EC;color:#160B33}
.eb{font-size:9.5px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;opacity:.6}
h2{font-size:24px;font-weight:800;font-style:italic;letter-spacing:-.03em;line-height:1}
.foot{position:absolute;left:12mm;right:12mm;bottom:4.5mm;display:flex;justify-content:space-between;font-size:8px;opacity:.5}
.hd{display:flex;justify-content:space-between;align-items:flex-end;gap:20px}
.sw{display:flex;gap:5px;width:50%}.sw div{flex:1}.sw i{display:block;height:26px;border-radius:7px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.08)}
.sw b{display:block;font-size:8.5px;margin-top:3px;white-space:nowrap;overflow:hidden}.sw code{font-family:ui-monospace,Menlo,monospace;font-size:8px;opacity:.6}
.sw div:first-child{flex:1.6}
.halves{flex:1;display:grid;grid-template-columns:1fr 1fr;gap:10px;min-height:0}
.half{border-radius:16px;padding:10px;display:grid;gap:8px;min-height:0;position:relative}
.half>.tg{position:absolute;top:-1px;left:50%;transform:translate(-50%,-50%);font-size:8.5px;font-weight:800;letter-spacing:.12em;padding:3px 10px;border-radius:99px;z-index:5}
.cd{border-radius:11px;overflow:hidden;position:relative;min-height:0}
.ph{background-size:cover;background-position:center 35%}.ov{position:absolute;inset:0}
.abs{position:absolute;z-index:3}
.t{font-weight:800;font-style:italic;letter-spacing:-.035em;line-height:.95}
.slo{font-weight:800;font-style:italic;letter-spacing:-.02em}
.pill{display:inline-block;border-radius:99px;padding:3px 8px;font-size:8px;font-weight:800}
.cc{display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px}
.idx{flex:1;display:grid;grid-template-columns:repeat(9,1fr);grid-template-rows:repeat(3,1fr);gap:7px}
.it{border-radius:10px;overflow:hidden;display:flex;flex-direction:column;background:#fff}
.it .s{flex:1;padding:6px;display:flex;align-items:flex-end}.it .n{height:30px;background:#000;display:flex;align-items:center;justify-content:center}
.it .l{padding:5px 6px}.it .l b{display:block;font-size:9px;font-style:italic;line-height:1.1}.it .l code{font-size:7.5px;opacity:.6}
""" + FCSS


def page(v, n):
    c = v["c"]; sky = lg(v["sky"]); nb = v["night"]; gn = v["gn"]
    sw = "".join(f'<div><i style="background:{h}"></i><b>{nm}</b><code>{h}</code></div>' for nm, h in [(v["nome"], c)] + ORIG)
    bl = f'<div class="ov" style="background:{c};mix-blend-mode:color;opacity:.25"></div>'
    tx = v["hr"]
    dayc = f"""<div class="half" style="background:{v['daybg']};grid-template-columns:1.1fr .85fr .95fr">
 <span class="tg" style="background:#fff;color:{INK}">DIA</span>
 <div class="cd" style="padding:8px 6px;display:flex;flex-direction:column;justify-content:space-between">
   <div style="display:flex;gap:6px">{icon('#FFFFFF', c if lum(c)<.45 else '#6539CB', 30)}{icon(INK, c, 30)}</div>
   <div>{lockup(v['hr'], v['hg'], 40)}<div class="slo" style="font-size:12px;margin-top:8px"><span style="color:{v["hr"]}">Viva o</span> <span style="color:{v['hg']}">rolê.</span></div></div></div>
 <div class="cd ph f-loira" style="background-position:center 30%"><div class="ov" style="background:{c};mix-blend-mode:soft-light;opacity:.6"></div>
   <div class="ov" style="background:linear-gradient(180deg,transparent 45%,rgba(0,0,0,.55))"></div>
   <div class="abs" style="top:10px;left:10px">{go('#FFFFFF',18)}</div>
   <div class="abs t" style="left:10px;right:8px;bottom:36px;color:#fff;font-size:19px">Sábado:<br>pôr do sol<br>na praia</div>
   <div class="abs" style="left:10px;bottom:12px"><span class="pill" style="background:{c};color:{'#fff' if lum(c)<.45 else INK}">Bora?</span></div></div>
 <div style="display:grid;grid-template-rows:1fr 1fr;gap:8px;min-height:0">
   <div class="cd cc" style="background:#fff">{lockup(INK, v['gd'], 22)}<div style="display:flex;gap:6px">{icon(v['sun'], v['hg'] if lum(c)>.45 else '#FFFFFF',34)}{icon(v['sky'],'#FFFFFF',34)}{icon(ROXO, c, 34)}</div></div>
   <div class="cd ph f-amigas" style="background-position:center 60%"><div class="abs" style="left:0;right:0;bottom:0;background:#fff;padding:6px 8px;display:flex;justify-content:space-between;align-items:center">
     <div><b style="font-size:9.5px;display:block">Luau do Posto 9</b><span style="font-size:7.5px;opacity:.65">hoje · 17h30</span></div>{go(v['gd'],18)}</div></div>
 </div></div>"""
    nightc = f"""<div class="half" style="background:{nb};color:#fff;grid-template-columns:1.1fr .95fr .85fr">
 <span class="tg" style="background:{gn};color:{'#fff' if lum(gn)<.45 else INK}">NOITE</span>
 <div class="cd ph f-brinde">{bl}<div class="ov" style="background:linear-gradient(180deg,rgba(0,0,0,.05),{nb}E6)"></div>
   <div class="abs" style="left:12px;top:12px">{lockup('#FFFFFF', gn, 17)}</div>
   <div class="abs t" style="left:12px;right:10px;bottom:30px;color:#fff;font-size:22px">Do pôr do sol<br>ao <span style="color:{gn}">after.</span></div>
   <div class="abs slo" style="left:12px;bottom:12px;font-size:9px">Viva o <span style="color:{gn}">rolê.</span></div></div>
 <div style="display:grid;grid-template-rows:1fr 1fr;gap:8px;min-height:0">
   <div class="cd cc" style="background:{lg(ROXO,160)}">{lockup('#FFFFFF', gn, 26)}<div class="slo" style="font-size:9px">Viva o <span style="color:{gn}">rolê.</span></div></div>
   <div class="cd cc" style="background:rgba(255,255,255,.06)"><div style="width:84%;height:58px;border-radius:8px;background:{sky};position:relative;padding:8px;overflow:hidden">
     <span style="font-size:6.5px;font-weight:700;letter-spacing:.08em;color:#fff">INGRESSO · VIP</span><div class="t" style="font-size:12px;margin-top:2px;color:#fff">Sunset<br>Session</div>
     <div class="abs" style="right:8px;top:8px">{lockup('#FFFFFF', INK, 8)}</div></div></div>
 </div>
 <div style="display:grid;grid-template-rows:1.15fr .85fr;gap:8px;min-height:0">
   <div class="cd ph f-show">{bl}<div class="ov" style="background:linear-gradient(180deg,transparent 35%,{nb}E6)"></div>
     <div class="abs t" style="left:9px;bottom:9px;color:#fff;font-size:14px">Sexta tem<br><span style="color:{gn}">rolê.</span></div></div>
   <div class="cd cc" style="background:rgba(255,255,255,.06)"><div style="display:flex;gap:6px">{icon(nb if nb!='#000000' else '#111111', gn, 34)}{icon(ROXO, gn, 34)}</div>
     <div style="height:20px;width:80%;border-radius:7px;background:{sky};display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;font-style:italic">Partiu rolê</div></div>
 </div></div>"""
    return f"""<section class="page"><div class="hd"><div><div class="eb">Variação {v['k']} · {ESTILO[v['est']]} · noite roxo, azul e preto</div>
<h2>{v['k']} · {v['nome']} <span style="font-size:13px;font-style:normal;font-weight:600;opacity:.6;font-family:ui-monospace,Menlo,monospace">original + {c} · {'chapado' if v['est']=='A' else 'degradê'}</span></h2></div>
<div class="sw">{sw}</div></div><div class="halves" style="margin-top:6px">{dayc}{nightc}</div>
<div class="foot"><span>RolêGo · +50 variações · dia quente, noite roxo/azul/preto</span><span>{n}</span></div></section>"""


def index(chunk, n, first):
    its = "".join(f'<div class="it"><div class="s" style="background:{v["daybg"]}"><b style="color:{v["hr"]};font-size:15px;font-style:italic">{v["k"]}</b></div><div style="height:16px;background:{lg(v["sky"],90)}"></div>'
                  f'<div class="n" style="background:{v["night"]}">{lockup("#FFFFFF", v["gn"], 12)}</div>'
                  f'<div class="l"><b>{v["nome"]}</b><code>{v["c"]} · {"chapado" if v["est"]=="A" else "degradê"}</code></div></div>' for v in chunk)
    intro = ('<div class="note" style="font-size:10px;max-width:700px;margin-top:4px;line-height:1.45">Mais 50 variações, numeradas de 11 a 60 (as de 1 a 10 estão no PDF anterior). Todas seguem a regra: <b>cores originais</b> (roxo, ciano, preto e branco) <b>+ uma cor nova</b>. '
             'Cada variação tem uma página com <b>dia</b> à esquerda e <b>noite</b> à direita. A <b>noite</b> é sempre das cores originais (roxo, azul e preto) e o <b>dia</b> é sempre quente. São 25 cores quentes, cada uma em dois jeitos: <b>chapado</b> (número ímpar) e <b>degradê de sol</b> (número par). No índice: em cima o dia, no meio o pôr do sol (roxo encontrando a cor), embaixo a noite.</div>') if first else ""
    return f"""<section class="page"><div class="hd"><div><div class="eb">RolêGo · estudo de cor 3 · 13/11/2026</div><h2 style="font-size:28px">+50 variações{'' if first else ' (cont.)'}</h2>{intro}</div>
{icon(ROXO,'#FFFFFF',56) if first else ''}</div><div class="idx">{its}</div>
<div class="foot"><span>Fotos: Pexels, só para estudo interno</span><span>{n}</span></div></section>"""


pages = [index(P[:27], 1, True), index(P[27:], 2, False)]
for i, v in enumerate(P): pages.append(page(v, i + 3))
html = f'<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>RolêGo · +50 variações de cor</title><style>{CSS}</style></head><body>{SYMS}{"".join(pages)}</body></html>'
out = os.path.join(HERE, "mais-50-variacoes-rolego.html"); open(out, "w").write(html)
subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--virtual-time-budget=20000",
                f"--print-to-pdf={out[:-5]}.pdf", "file://" + out], check=True, capture_output=True)
print("ok", len(pages), "págs", os.path.getsize(out)//1024, "KB")

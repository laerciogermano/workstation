#!/usr/bin/env python3
"""Manual Clozzy identidade as-is (A4 paisagem) → HTML + PDF. Fonte: performer + site. Rodar: python3 _build.py"""
import base64, os, subprocess, tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
LOGOS = HERE / "logos"
REFS = HERE / "refs"
OUT_HTML = HERE / "identidade-visual-clozzy-atual.html"
OUT_PDF = HERE / "identidade-visual-clozzy-atual.pdf"
PINK = "#FF0065"


def b64(path: Path, max_w=None) -> str:
    raw = path.read_bytes()
    mime = "image/svg+xml" if path.suffix == ".svg" else "image/png"
    if path.suffix.lower() in {".png", ".jpg", ".jpeg"} and max_w:
        try:
            from PIL import Image
            from io import BytesIO
            im = Image.open(path).convert("RGBA")
            if im.width > max_w:
                h = int(im.height * max_w / im.width)
                im = im.resize((max_w, h), Image.Resampling.LANCZOS)
            buf = BytesIO()
            im.save(buf, format="PNG", optimize=True)
            raw = buf.getvalue()
            mime = "image/png"
        except Exception:
            pass
    return f"data:{mime};base64,{base64.b64encode(raw).decode()}"


def img(name, folder=LOGOS, h=None, cls="", max_w=900):
    p = folder / name
    if not p.exists():
        return f'<span style="color:#c00">missing {name}</span>'
    st = f' style="height:{h}px"' if h else ""
    c = f' class="{cls}"' if cls else ""
    return f'<img src="{b64(p, max_w=max_w)}"{c}{st} alt="">'


def foot(n):
    return f'<div class="foot"><span>Clozzy · identidade visual as-is · nov/2026 · performer + clozzy.com.br</span><span>{n}</span></div>'


pages = []

CSS = """
@page{size:297mm 210mm;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Montserrat,system-ui,sans-serif;background:#222;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:297mm;height:210mm;padding:13mm 16mm 14mm;position:relative;overflow:hidden;page-break-after:always;display:flex;flex-direction:column;gap:10px}
.pink{background:linear-gradient(135deg,#FF0065,#FE2C78 60%,#C0004A);color:#fff}
.dark{background:#111;color:#fff}
.light{background:#F7F7F9;color:#111}
.mist{background:#F0F1F4;color:#111}
.eyebrow{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#7C8090}
.pink .eyebrow,.dark .eyebrow{color:rgba(255,255,255,.75)}
h2{font-size:26px;font-weight:700;letter-spacing:-.025em;line-height:1.1}
h2 b{color:#FF0065}
.pink h2 b,.dark h2 b{color:#fff}
.lead{font-size:13px;color:rgba(255,255,255,.9);max-width:680px;line-height:1.5}
.foot{position:absolute;left:16mm;right:16mm;bottom:6mm;display:flex;justify-content:space-between;font-size:9px;color:#7C8090}
.pink .foot,.dark .foot{color:rgba(255,255,255,.55)}
.sub{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#5B6070;margin-bottom:8px}
.note{font-size:10px;color:#5B6070;line-height:1.5;margin-top:8px}
.dark .note{color:rgba(255,255,255,.55)}
code{font-family:ui-monospace,Menlo,monospace;font-size:9px;background:rgba(255,0,101,.1);color:#A00040;border-radius:4px;padding:1px 5px}
.dark code{background:rgba(255,255,255,.08);color:#FFB0D0}
.toc{display:grid;grid-template-columns:1fr 1fr;gap:0 40px;margin-top:6px}
.ti{display:flex;gap:16px;align-items:baseline;border-top:1px solid #DCDDE5;padding:7px 0}
.ti span{font-size:12px;font-weight:800;color:#FF0065;width:24px}
.ti b{font-size:14px;font-weight:700}
.files{margin-top:auto;background:#fff;border:1px solid #DCDDE5;border-radius:14px;padding:12px 16px}
.files p{font-size:10px;line-height:2;color:#5B6070}
.ess{display:grid;grid-template-columns:1.1fr 1fr;gap:24px;flex:1}
.kv span{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#FF0065}
.kv p{font-size:12px;line-height:1.5;margin-top:2px}
.per{background:#fff;border:1px solid #DCDDE5;border-radius:14px;padding:12px 14px}
.per b{font-size:16px;font-weight:700}.per i{display:block;font-size:11px;color:#FF0065;font-weight:600;font-style:normal}
.per p{font-size:10.5px;line-height:1.45;color:#5B6070;margin-top:6px}
.lgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.lt b{display:block;font-size:12px;margin-top:8px}.lt p{font-size:9.5px;color:#5B6070;line-height:1.4;margin:2px 0 4px;min-height:28px}
.ltv{height:140px;border-radius:14px;display:flex;align-items:center;justify-content:center;overflow:hidden}
.ltv.lite{background:#fff;border:1px solid #DCDDE5}.ltv.dark{background:#111}.ltv.pk{background:#FF0065}
.ltv img{max-width:88%;max-height:120px;object-fit:contain}
.swg{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
.swc{height:72px;border-radius:12px}.sw code{display:inline-block;margin-top:6px}.sw span{display:block;font-size:9px;color:#5B6070;margin-top:2px}
.ct{border-collapse:collapse;width:100%;font-size:10px}.ct th{text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.05em;color:#7C8090;padding:4px 6px;border-bottom:1px solid #DCDDE5}
.ct td{padding:5px 6px;border-bottom:1px solid #E4E5EC}
.vd{font-size:9px;font-weight:700;border-radius:99px;padding:2px 8px}.vd.ok{background:#DDF6E9;color:#0B7A45}.vd.mid{background:#FFF1D6;color:#8A5A00}.vd.no{background:#FDE1E9;color:#B4194A}
.typ{display:grid;grid-template-columns:1fr 1.2fr;gap:28px}
.aa{font-size:72px;font-weight:800;letter-spacing:-.04em;line-height:.95}.aa b{color:#FF0065}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:18px;flex:1}
.card{background:#fff;border:1px solid #DCDDE5;border-radius:14px;padding:14px}.card b{display:block;font-size:13px;margin-bottom:6px}.card p,.card li{font-size:11px;line-height:1.45;color:#3A3D48}
.card ul{margin-left:16px}.warn{background:#2a1518;color:#F07178;border-radius:10px;padding:10px 12px;font-size:11px;line-height:1.45}
.refs{display:grid;grid-template-columns:1fr 1fr;gap:14px;flex:1}
.rf{border-radius:12px;overflow:hidden;background:#111;border:1px solid #2a2a32}
.rf img{width:100%;height:160px;object-fit:cover;object-position:top}
.rf b{display:block;padding:8px 10px 2px;font-size:11px;color:#fff}.rf span{display:block;padding:0 10px 10px;font-size:9.5px;color:#9CA3AF}
"""

# 1 capa
pages.append(f"""<section class="page pink">
<div class="eyebrow">Identidade visual · as-is · novembro 2026</div>
<div style="margin-top:48px">{img('lockup-white.svg', h=56, max_w=600)}</div>
<p class="lead" style="margin-top:28px;font-size:22px;font-weight:700">Clozzy — marca atual</p>
<p class="lead">Extraída do código <b>performer</b> (GitLab clozzy-app) + site clozzy.com.br / clozzy.link. Formato alinhado ao kit RoleGo v4.</p>
<p class="lead" style="margin-top:auto;opacity:.8">Primary código: #FF0065 · Montserrat · mark geométrico em círculo</p>
{foot(1)}</section>""")

# 2 sumário
toc = [(3,"Essência"),(4,"Logo system (performer)"),(5,"Mark"),(6,"Cores"),(7,"Tipografia"),(8,"UI performer / front"),(9,"Site roxo clozzy.com.br"),(10,"Voz e canais"),(11,"Código e paths"),(12,"Contracapa")]
pages.append(f"""<section class="page light">
<div class="eyebrow">Sumário</div><h2>Manual em <b>12</b> páginas</h2>
<div class="toc">{''.join(f'<div class="ti"><span>{n:02d}</span><b>{t}</b></div>' for n,t in toc)}</div>
<div class="files"><p><b>Arquivos</b><br><code>BRAND.md</code> · <code>tokens.css</code> · <code>logos/</code> · este HTML/PDF<br>
Código: <code>marca/benchmarking-concorrentes/clozzy/performer/</code> (ex-closeapp)</p></div>
{foot(2)}</section>""")

# 3 essência
pers = [
    ("Rosa choque","não roxo SaaS","#FF0065 no performer — ação e mark."),
    ("Close Friends","não feed infinito","Link na bio → assinatura → conteúdo."),
    ("Light UI","não dark-first","Fundo branco / #F4F5F8 no app."),
    ("Dois apps","criador × fã","performer (Montserrat) · front (Proxima)."),
]
pages.append(f"""<section class="page light">
<div class="eyebrow">Essência</div>
<h2>Close Friends pago, <b>num link</b></h2>
<div class="ess"><div style="display:flex;flex-direction:column;gap:12px">
<div class="kv"><span>O que é</span><p>Plataforma BR para vender acesso a Close Friends / conteúdo exclusivo via assinatura.</p></div>
<div class="kv"><span>Código</span><p>GitLab <code>clozzy-app</code> — performer, front, api, robot, schedule.</p></div>
<div class="kv"><span>Site</span><p>clozzy.com.br (canônico no og:url) · clozzy.link · meu.clozzy.com.br</p></div>
<div class="kv"><span>Promessa</span><p>“Compartilhe o link… e ganhe dinheiro com assinaturas.” · “Você só paga se vender.”</p></div>
</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">{''.join(f'<div class="per"><b>{a}</b><i>{b}</i><p>{c}</p></div>' for a,b,c in pers)}</div></div>
{foot(3)}</section>""")

# 4 logo
tiles = [
    ("lite","lockup-clozzy.svg","Lockup app","Mark geométrico rosa + wordmark"),
    ("dark","lockup-white.svg","Lockup escuro","Wordmark branco + mark rosa"),
    ("pk","mark-circle.svg","Mark app","Círculo #FF0065 geométrico"),
    ("lite","lockup-site-purple.svg","Lockup site","Estrela #7651E9 (clozzy.com.br)"),
    ("pk","mark-star-purple.svg","Mark site","Estrela branca no roxo"),
    ("lite","favicon-96x96.png","Favicon PNG","Ainda rosa (família app)"),
]
lg = "".join(
    f'<div class="lt"><div class="ltv {c}">{img(f, h=90 if f.endswith(".png") else 48, max_w=420)}</div><b>{t}</b><p>{d}</p><code>{f}</code></div>'
    for c,f,t,d in tiles
)
pages.append(f"""<section class="page mist">
<div class="eyebrow">Logo · sistema</div>
<h2>Masters do <b>performer</b></h2>
<div class="lgrid">{lg}</div>
<p class="note">Origem: <code>performer/src/assets/icons/</code> — logo-clozzy.svg, logo.svg, landing-logo.svg, logo-circle.svg, icon-*.png</p>
{foot(4)}</section>""")

# 5 mark
pages.append(f"""<section class="page dark">
<div class="eyebrow">Mark</div>
<h2>Círculo rosa + glifo <b>geométrico</b></h2>
<div class="grid2">
<div style="display:flex;align-items:center;justify-content:center;gap:28px">
{img('mark-circle.svg', h=160, max_w=320)}
{img('mark-app-512.png', h=140, max_w=280)}
</div>
<div>
<div class="sub">Anatomia (SVG)</div>
<ul style="font-size:12px;line-height:1.7;color:rgba(255,255,255,.85);margin-left:16px">
<li>Disco <code>#FF0065</code></li>
<li>Glifo branco: triângulos/retângulos (pétala / losango)</li>
<li>Wordmark “clozzy” ao lado no lockup</li>
<li>PNG de app: fundo rosa saturado (amostra ~#C00028–#D80030)</li>
</ul>
<p class="note">O favicon/site às vezes mostra <b>estrela</b> — variante raster; o master SVG do performer é o glifo geométrico.</p>
</div></div>
{foot(5)}</section>""")

# 6 cores
sw = [
    ("#FF0065","--cz-pink","app performer"),
    ("#FE2C55","--cz-pink-front","app front"),
    ("#FE2C78","--cz-pink-landing","SVG landing"),
    ("#222428","--cz-ink","texto"),
    ("#FFFFFF","--cz-paper","paper"),
    ("#7651E9","--cz-site-purple","site primary"),
    ("#1CCE98","--cz-site-green","site secondary"),
    ("#EDEEF1","--cz-site-mist","site mist"),
    ("#F6F7F8","--cz-site-wash","site wash"),
    ("#2DD36F","--cz-success","success app"),
]
sw_html = "".join(
    f'<div class="sw"><div class="swc" style="background:{h};{"border:1px solid #ddd" if h=="#FFFFFF" else ""}"></div><code>{h}</code><span>{t}</span><span>{u}</span></div>'
    for h,t,u in sw
)
pages.append(f"""<section class="page light">
<div class="eyebrow">Cores</div>
<h2>Rosa <b>#FF0065</b> no código</h2>
<div class="swg">{sw_html}</div>
<table class="ct" style="margin-top:12px"><tr><th>Par</th><th>Razão</th><th>Nota</th></tr>
<tr><td>Branco / #FF0065</td><td>≈3.9:1 <span class="vd mid">grande</span></td><td>CTA app</td></tr>
<tr><td>Branco / #7651E9</td><td>≈5.1:1 <span class="vd ok">AA</span></td><td>CTA site</td></tr>
<tr><td>#FF0065 / preto</td><td>≈5.4:1 <span class="vd ok">AA</span></td><td>Mark app</td></tr>
<tr><td>Preto / branco</td><td>21:1 <span class="vd ok">AAA</span></td><td>Corpo</td></tr>
</table>
<p class="note">App: <code>variables.scss</code> → #FF0065. Site: HTML <code>--primary-color:#7651e9</code> + prints em <code>refs/site-*</code>.</p>
{foot(6)}</section>""")

# 7 tipo
pages.append(f"""<section class="page mist">
<div class="eyebrow">Tipografia</div>
<h2>Montserrat no <b>performer</b></h2>
<div class="typ">
<div>
<div class="aa">Aa <b>Mt</b></div>
<p style="font-size:13px;line-height:1.5;margin-top:10px">performer: Google Fonts Montserrat 100–900, <code>!important</code> global.<br>front: Proxima Nova (OTF local).</p>
</div>
<div>
<table class="ct">
<tr><th>App</th><th>Família</th><th>Arquivo</th></tr>
<tr><td>performer</td><td>Montserrat</td><td>global.scss</td></tr>
<tr><td>front</td><td>Proxima Nova</td><td>global.scss + fonts/</td></tr>
<tr><td>Site</td><td>Inter / Montserrat / Roboto</td><td>HTML inline (misto)</td></tr>
</table>
</div></div>
{foot(7)}</section>""")

# 8 UI
pages.append(f"""<section class="page light">
<div class="eyebrow">Interface</div>
<h2>Dois skins no <b>mesmo produto</b></h2>
<div class="grid2">
<div class="card"><b>performer (criador)</b>
<ul>
<li>Ionic · primary #FF0065</li>
<li>Montserrat</li>
<li>theme-color #ffffff</li>
<li>Wallet, stories, highlights, billing</li>
<li>Título PWA: meuclozzy</li>
</ul></div>
<div class="card"><b>front (fã)</b>
<ul>
<li>Ionic · primary #FE2C55</li>
<li>Proxima Nova</li>
<li>Close Friends / assinatura</li>
<li>Tom mais “social”</li>
</ul></div>
</div>
{foot(8)}</section>""")

# 9 site purple refs
def ref_img(name, cap, sub, max_w=720):
    if not (REFS / name).exists():
        return ""
    return f'<div class="rf">{img(name, REFS, max_w=max_w)}<b>{cap}</b><span>{sub}</span></div>'

site_grid = "".join([
    ref_img("site-landing-desktop.png", "Landing desktop", "clozzy.com.br / .link · hero + CTA #7651E9"),
    ref_img("site-landing-mobile.png", "Landing mobile", "390×844"),
    ref_img("site-logo-crop.png", "Lockup site", "estrela roxa + wordmark preto", 480),
    ref_img("site-cta-crop.png", "CTA", "“Criar o meu close friends” · “Você só paga se vender”", 480),
])
pages.append(f"""<section class="page mist">
<div class="eyebrow">Site · clozzy.com.br</div>
<h2>Sistema <b>roxo</b> ao vivo</h2>
<div style="display:grid;grid-template-columns:1.1fr .9fr;gap:16px;flex:1">
<div class="refs" style="grid-template-columns:1fr 1fr">{site_grid}</div>
<div>
<div class="card"><b>Tokens do site</b>
<ul>
<li><code>--primary-color: #7651E9</code></li>
<li><code>--secondary-color: #1CCE98</code></li>
<li>Fundos <code>#EDEEF1</code> / <code>#F6F7F8</code></li>
<li>Mark: círculo roxo + estrela branca</li>
<li>CTA RGB ≈ (118, 81, 233)</li>
</ul>
<div style="margin-top:12px;display:flex;gap:12px;align-items:center">
{img('lockup-site-purple.svg', h=36, max_w=360)}
{img('mark-star-purple.svg', h=48, max_w=120)}
</div>
<p class="note" style="margin-top:10px">Espelho: clozzy.link · <code>og:url</code> = clozzy.com.br. Favicon PNG ainda rosa (família app).</p>
<div class="warn" style="margin-top:10px">Rosa app (#FF0065) ≠ roxo site (#7651E9). Unificar = card identidade nova.</div>
</div>
</div>
</div>
{foot(9)}</section>""")

# 10 voz
pages.append(f"""<section class="page light">
<div class="eyebrow">Voz · canais</div>
<h2>Pitch de <b>Close Friends</b></h2>
<div class="grid2">
<div class="card"><b>Voz</b>
<ul>
<li>Do: assinatura, link, ganhe dinheiro, só paga se vender</li>
<li>Don't: soar OnlyFans genérico sem o ângulo CF</li>
</ul>
<b style="margin-top:10px">Canais</b>
<ul>
<li>clozzy.com.br / .link — marketing</li>
<li>meu.clozzy.com.br — performer</li>
<li>GitLab clozzy-app — código</li>
</ul></div>
<div class="card"><b>IA</b>
<p>Sem suite GenAI no código. Benchmarking Clozzy 2028: oportunidade de disclosure vs ban CloseFans.</p>
</div></div>
{foot(10)}</section>""")

# 11 paths
pages.append(f"""<section class="page mist">
<div class="eyebrow">Código</div>
<h2>Onde está a <b>marca</b></h2>
<table class="ct">
<tr><th>Path</th><th>O quê</th></tr>
<tr><td><code>…/clozzy/performer/src/theme/variables.scss</code></td><td>--color-primary #FF0065</td></tr>
<tr><td><code>…/clozzy/performer/src/global.scss</code></td><td>Montserrat</td></tr>
<tr><td><code>…/clozzy/performer/src/assets/icons/</code></td><td>SVG + PNG logos</td></tr>
<tr><td><code>…/clozzy/front/src/theme/variables.scss</code></td><td>#FE2C55</td></tr>
<tr><td><code>…/clozzy/front/src/global.scss</code></td><td>Proxima Nova</td></tr>
<tr><td><code>marca/identidade-atual/</code></td><td>Este kit</td></tr>
</table>
<p class="note">Pasta de clones: <code>marca/benchmarking-concorrentes/clozzy/</code> (renomeada de <code>closeapp/</code> em 2026-11-11).</p>
{foot(11)}</section>""")

# 12
pages.append(f"""<section class="page pink">
<div class="eyebrow">Clozzy 2028</div>
<h2 style="margin-top:36px;font-size:34px">Identidade as-is</h2>
<p class="lead" style="margin-top:14px">Insumo para o card “Criar identidade visual (nova)” — não substitui o redesign.</p>
<div style="margin-top:auto;display:flex;gap:20px;align-items:center">
{img('mark-circle.svg', h=64, max_w=140)}
<div style="font-size:12px;opacity:.9;line-height:1.6">#FF0065 · Montserrat<br>performer + clozzy.com.br<br>novembro 2026</div>
</div>
{foot(12)}</section>""")

html_doc = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<title>Clozzy — Identidade visual as-is</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>{CSS}</style>
</head>
<body>
{''.join(pages)}
</body>
</html>"""
OUT_HTML.write_text(html_doc, encoding="utf-8")
print("HTML", OUT_HTML, OUT_HTML.stat().st_size)

chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
with tempfile.TemporaryDirectory() as td:
    out_pdf = os.path.join(td, "out.pdf")
    subprocess.run([
        chrome, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
        f"--print-to-pdf={out_pdf}", OUT_HTML.as_uri(),
    ], check=True, capture_output=True)
    Path(out_pdf).replace(OUT_PDF)
print("PDF", OUT_PDF, OUT_PDF.stat().st_size)

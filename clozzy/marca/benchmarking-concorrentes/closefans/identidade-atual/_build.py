#!/usr/bin/env python3
"""Manual CloseFans identidade as-is (A4 paisagem) → HTML + PDF. Rodar: python3 _build.py"""
import base64, os, subprocess, tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
LOGOS = HERE / "logos"
REFS = HERE / "refs"
OUT_HTML = HERE / "identidade-visual-closefans-atual.html"
OUT_PDF = HERE / "identidade-visual-closefans-atual.pdf"

PURPLE = "#890AFF"
DEEP = "#6F00D6"
DARK = "#47008A"
BLACK = "#050506"
SOFT = "#C299FF"
SURF = "#1C1D25"


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


def img(name, folder=LOGOS, h=None, w=None, cls="", max_w=900):
    p = folder / name
    style = []
    if h: style.append(f"height:{h}px")
    if w: style.append(f"width:{w}px")
    st = f' style="{";".join(style)}"' if style else ""
    c = f' class="{cls}"' if cls else ""
    return f'<img src="{b64(p, max_w=max_w)}"{c}{st} alt="">'


def foot(n):
    return f'<div class="foot"><span>CloseFans · identidade visual as-is · nov/2026 · close.fans</span><span>{n}</span></div>'


pages = []


def page(cls, eyebrow, h2, body, n, toc_title=None):
    head = f'<div class="eyebrow">{eyebrow}</div><h2>{h2}</h2>' if h2 else ""
    pages.append((toc_title, f'<section class="page {cls}">{head}{body}{foot(n)}</section>'))


CSS = """
@page{size:297mm 210mm;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Archivo,system-ui,sans-serif;background:#222;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:297mm;height:210mm;padding:13mm 16mm 14mm;position:relative;overflow:hidden;page-break-after:always;display:flex;flex-direction:column;gap:10px}
.purple{background:linear-gradient(135deg,#890aff,#6f00d6 55%,#47008a);color:#fff}
.dark{background:#050506;color:#fff}
.light{background:#F4F1FA;color:#050506}
.mist{background:#ECE6F5;color:#050506}
.eyebrow{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#7C8090}
.purple .eyebrow,.dark .eyebrow{color:rgba(255,255,255,.7)}
h2{font-size:26px;font-weight:700;letter-spacing:-.025em;line-height:1.1}
h2 b{color:#890AFF}
.dark h2 b,.purple h2 b{color:#fff}
.lead{font-size:13px;color:rgba(255,255,255,.85);max-width:640px;line-height:1.5}
.foot{position:absolute;left:16mm;right:16mm;bottom:6mm;display:flex;justify-content:space-between;font-size:9px;color:#7C8090}
.purple .foot,.dark .foot{color:rgba(255,255,255,.55)}
.sub{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#5B6070;margin-bottom:8px}
.dark .sub{color:rgba(255,255,255,.45)}
.note{font-size:10px;color:#5B6070;line-height:1.5;margin-top:8px}
.dark .note{color:rgba(255,255,255,.55)}
code{font-family:ui-monospace,Menlo,monospace;font-size:9px;background:rgba(137,10,255,.1);color:#4B2BA0;border-radius:4px;padding:1px 5px}
.dark code{background:rgba(255,255,255,.08);color:#C299FF}
.toc{display:grid;grid-template-columns:1fr 1fr;gap:0 40px;margin-top:6px}
.ti{display:flex;gap:16px;align-items:baseline;border-top:1px solid #DCDDE5;padding:7px 0}
.ti span{font-size:12px;font-weight:800;color:#890AFF;width:24px}
.ti b{font-size:14px;font-weight:700}
.files{margin-top:auto;background:#fff;border:1px solid #DCDDE5;border-radius:14px;padding:12px 16px}
.files p{font-size:10px;line-height:2;color:#5B6070}
.ess{display:grid;grid-template-columns:1.1fr 1fr;gap:24px;flex:1}
.kv span{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#890AFF}
.kv p{font-size:12px;line-height:1.5;margin-top:2px}
.per{background:#fff;border:1px solid #DCDDE5;border-radius:14px;padding:12px 14px}
.per b{font-size:16px;font-weight:700}.per i{display:block;font-size:11px;color:#890AFF;font-weight:600;font-style:normal}
.per p{font-size:10.5px;line-height:1.45;color:#5B6070;margin-top:6px}
.lgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.lt b{display:block;font-size:12px;margin-top:8px}.lt p{font-size:9.5px;color:#5B6070;line-height:1.4;margin:2px 0 4px;min-height:28px}
.ltv{height:140px;border-radius:14px;display:flex;align-items:center;justify-content:center;overflow:hidden}
.ltv.lite{background:#fff;border:1px solid #DCDDE5}.ltv.dark{background:#050506}.ltv.pur{background:#47008A}
.ltv img{max-width:88%;max-height:120px;object-fit:contain}
.swg{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
.swc{height:72px;border-radius:12px}.sw code{display:inline-block;margin-top:6px}.sw span{display:block;font-size:9px;color:#5B6070;margin-top:2px}
.ct{border-collapse:collapse;width:100%;font-size:10px}.ct th{text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.05em;color:#7C8090;padding:4px 6px;border-bottom:1px solid #DCDDE5}
.ct td{padding:5px 6px;border-bottom:1px solid #E4E5EC}
.vd{font-size:9px;font-weight:700;border-radius:99px;padding:2px 8px}.vd.ok{background:#DDF6E9;color:#0B7A45}.vd.mid{background:#FFF1D6;color:#8A5A00}.vd.no{background:#FDE1E9;color:#B4194A}
.typ{display:grid;grid-template-columns:1fr 1.2fr;gap:28px}
.aa{font-size:96px;font-weight:700;letter-spacing:-.04em;line-height:.9}.aa b{color:#890AFF}
.refs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;flex:1}
.rf{border-radius:12px;overflow:hidden;background:#050506;border:1px solid #2a2a32;display:flex;flex-direction:column}
.rf img{width:100%;height:150px;object-fit:cover;object-position:top}
.rf b{display:block;padding:8px 10px 2px;font-size:11px}.rf span{display:block;padding:0 10px 10px;font-size:9.5px;color:#9CA3AF}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:18px;flex:1}
.card{background:#fff;border:1px solid #DCDDE5;border-radius:14px;padding:14px}.card b{display:block;font-size:13px;margin-bottom:6px}.card p,.card li{font-size:11px;line-height:1.45;color:#3A3D48}
.card ul{margin-left:16px}.warn{background:#2a1518;color:#F07178;border-radius:10px;padding:10px 12px;font-size:11px;line-height:1.45}
"""

# 1 capa
pages.append((None, f"""<section class="page purple cover">
<div class="eyebrow">Identidade visual · as-is · novembro 2026</div>
<div style="margin-top:40px">{img('lockup-stacked-white-on-black.png', h=120, max_w=700)}</div>
<p class="lead" style="margin-top:28px;font-size:22px;font-weight:700;color:#fff">CloseFans — marca atual em produção</p>
<p class="lead">Auditoria visual a partir de close.fans (CSS, logos, favicon, help, blog) + prints do benchmarking Clozzy. Formato alinhado ao kit RoleGo v4.</p>
<p class="lead" style="margin-top:auto;opacity:.75">close.com.br ≠ CloseFans (produtora Uberlândia). Canônico: close.fans</p>
{foot(1)}</section>"""))

# 2 sumário
toc_items = [
    (3, "Essência e posicionamento"),
    (4, "Logo system"),
    (5, "Mark chave C+F"),
    (6, "Cores e contraste AA"),
    (7, "Tipografia"),
    (8, "UI e superfícies"),
    (9, "Voz, canais e IA"),
    (10, "Referências visuais"),
    (11, "Inconsistências e uso no Clozzy"),
    (12, "Contracapa"),
]
toc_html = "".join(f'<div class="ti"><span>{n:02d}</span><b>{t}</b></div>' for n, t in toc_items)
pages.append(("Sumário", f"""<section class="page light">
<div class="eyebrow">Sumário</div><h2>Manual em <b>12</b> páginas</h2>
<div class="toc">{toc_html}</div>
<div class="files"><p><b>Arquivos do kit</b><br>
<code>BRAND.md</code> · <code>tokens.css</code> · <code>logos/</code> · <code>refs/</code> · este HTML/PDF<br>
Fontes: close.fans · ajuda.close.fans · blog.close.fans · prints Clozzy 2026-11-10</p></div>
{foot(2)}</section>"""))

# 3 essência
pers = [
    ("Dark-first", "não pastel", "Fundo #050506, UI noturna, contraste alto."),
    ("Roxo elétrico", "não índigo SaaS genérico", "Theme #890AFF / ação #6F00D6."),
    ("3 em 1", "não só feed", "Site + Telegram bot + integração automática."),
    ("Conversão", "não rede social pura", "Pix, packs, rankings, Black Close."),
]
page("light", "Essência", 'Publique uma vez e esteja em <b>todos os lugares</b>', f"""
<div class="ess"><div style="display:flex;flex-direction:column;gap:12px">
<div class="kv"><span>O que é</span><p>Plataforma BR de conteúdos exclusivos: vitrine web + CloseBot no Telegram + rails de pagamento (Pix).</p></div>
<div class="kv"><span>Para quem</span><p>Criadores que monetizam conteúdo; fãs que assinam e compram packs.</p></div>
<div class="kv"><span>Promessa</span><p>“Conteúdos exclusivos de quem você ama!” · “+ 1 milhão de usuários mensais”.</p></div>
<div class="kv"><span>Nome</span><p><b>Close Fans</b> (legal/marketing) · <b>CloseFans</b> (produto) · <b>Close</b> (curto).</p></div>
</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">{''.join(f'<div class="per"><b>{a}</b><i>{b}</i><p>{c}</p></div>' for a,b,c in pers)}</div></div>
""", 3, "Essência")

# 4 logo system
tiles = [
    ("lite", "lockup-stacked-close-black-fans-purple.png", "Stacked OG", "Close preto + fans roxo · og:image"),
    ("dark", "lockup-stacked-white-on-black.png", "Stacked branco", "Help Crisp · fundo preto"),
    ("dark", "lockup-stacked-purple-on-black.png", "Stacked roxo", "Help “roxo principal”"),
    ("pur", "mark-key-app-512.png", "App icon", "PWA / favicon 512 · mark chave"),
    ("pur", "mark-key-blog-192.png", "Blog", "Favicon Wix do blog"),
    ("dark", "mark-key-favicon-192.png", "Android icon", "Favicon produto 192"),
]
lg = "".join(
    f'<div class="lt"><div class="ltv {c}">{img(f, h=100 if "mark" in f else 70, max_w=480)}</div><b>{t}</b><p>{d}</p><code>{f}</code></div>'
    for c, f, t, d in tiles
)
page("mist", "Logo · sistema", "Duas famílias convivendo: <b>stacked</b> e <b>chave</b>", f"""
<div class="lgrid">{lg}</div>
<p class="note">Wordmark horizontal “closefans” (branco + c-chave) aparece no header do produto, mas não há SVG público — só raster nas telas. Lockup stacked = marketing/help; mark chave = app/favicon.</p>
""", 4, "Logo system")

# 5 mark
page("dark", "Mark", "C + haste de <b>chave</b> = acesso", f"""
<div class="grid2">
<div style="display:flex;align-items:center;justify-content:center;gap:28px">
{img('mark-key-app-512.png', h=180, max_w=360)}
{img('ico-channel-closefans.svg', h=72, max_w=120)}
</div>
<div>
<div class="sub">Anatomia</div>
<ul style="font-size:12px;line-height:1.7;color:rgba(255,255,255,.85);margin-left:16px">
<li><b>C</b> geométrico = Close</li>
<li>Haste com dentes à direita = chave / F / unlock</li>
<li>Fundo do ícone ≈ <code>#47008A</code> (amostra RGB 71,0,138)</li>
<li>Canal SVG usa fill <code>#6F00D6</code></li>
</ul>
<p class="note" style="margin-top:16px">Metáfora alinhada ao produto: conteúdo fechado que se abre com assinatura/compra.</p>
</div></div>
""", 5, "Mark chave")

# 6 cores
swatches = [
    (PURPLE, "--cf-purple", "Theme / CTA"),
    (DEEP, "--cf-purple-deep", "Ação / player"),
    (DARK, "--cf-purple-dark", "Ícone / deep"),
    (SOFT, "--cf-purple-soft", "Link no dark"),
    (BLACK, "--cf-black", "Fundo app"),
    (SURF, "--cf-surface", "Chrome"),
    ("#42455C", "--cf-surface-2", "Secundário"),
    ("#FFFFFF", "--cf-white", "Texto"),
    ("#19D297", "--cf-success", "Online / ok"),
    ("#D84940", "--cf-danger", "Erro"),
]
sw = "".join(
    f'<div class="sw"><div class="swc" style="background:{h};{"border:1px solid #ddd" if h=="#FFFFFF" else ""}"></div><code>{h}</code><span>{t}</span><span>{u}</span></div>'
    for h, t, u in swatches
)
aa = """
<table class="ct"><tr><th>Par</th><th>Razão</th><th>Uso</th></tr>
<tr><td>Branco / #890AFF</td><td>5.9:1 <span class="vd ok">AA</span></td><td>Texto em botão roxo</td></tr>
<tr><td>Branco / #6F00D6</td><td>7.9:1 <span class="vd ok">AA</span></td><td>CTA deep</td></tr>
<tr><td>Branco / #050506</td><td>20.4:1 <span class="vd ok">AAA</span></td><td>Corpo no dark</td></tr>
<tr><td>#C299FF / #050506</td><td>9.0:1 <span class="vd ok">AA</span></td><td>Link</td></tr>
<tr><td>#890AFF / #050506</td><td>3.4:1 <span class="vd mid">só grande</span></td><td>Ícone / título, não corpo</td></tr>
</table>"""
page("light", "Cores", "Roxo elétrico no <b>preto</b>", f"""
<div class="swg">{sw}</div>
<div style="margin-top:10px">{aa}</div>
<p class="note">Fonte: CSS Next.js (<code>#890aff</code> 110×, <code>#1c1d25</code> 111×, <code>#6f00d6</code> nos CTAs) + <code>theme-color</code> / TileColor <code>#890aff</code> + manifest <code>#050506</code>.</p>
""", 6, "Cores")

# 7 tipo
page("mist", "Tipografia", "UI em <b>Archivo</b> · lockup custom", f"""
<div class="typ">
<div>
<div class="aa">Aa <b>Archivo</b></div>
<p style="font-size:13px;line-height:1.5;margin-top:8px">Família principal no app: <b>Archivo</b> (300–700). Alternativa pontual: <b>DM Sans</b>. MUI cai em Roboto.</p>
<p class="note">O lockup stacked de marketing usa display custom (não é Archivo literal) — ink traps e geometria própria.</p>
</div>
<div>
<table class="ct">
<tr><th>Papel</th><th>Spec</th><th>Exemplo</th></tr>
<tr><td>Display UI</td><td>Archivo 700</td><td style="font-size:20px;font-weight:700">Publique uma vez</td></tr>
<tr><td>Corpo</td><td>Archivo 400</td><td>Site exclusivo + Bot Telegram</td></tr>
<tr><td>CTA</td><td>Archivo 500–700</td><td>Entrar · Cadastre-se</td></tr>
<tr><td>Link</td><td>Archivo + #C299FF</td><td style="color:#6F00D6">link underline</td></tr>
</table>
</div></div>
""", 7, "Tipografia")

# 8 UI
page("dark", "Interface", "Dark chrome · pills · underline roxo", f"""
<div class="grid2">
<div class="card" style="background:{SURF};border-color:#2a2a35;color:#fff">
<b style="color:#fff">Padrões observados</b>
<ul style="color:rgba(255,255,255,.8)">
<li>Fundo app <code>#050506</code></li>
<li>CTA pill roxo sólido + ghost com borda roxa</li>
<li>Tabs ativas com underline/glow <code>#890AFF</code></li>
<li>Cards ~12–16px; avatares circulares</li>
<li>Status online em verde <code>#19D297</code></li>
<li>Player: <code>--plyr-color-main:#6f00d6</code></li>
</ul>
</div>
<div class="card" style="background:{SURF};border-color:#2a2a35;color:#fff">
<b style="color:#fff">Superfícies</b>
<ul style="color:rgba(255,255,255,.8)">
<li>Landing: hero dark + mockups + social proof</li>
<li>Feed: 3 colunas, recomendações, Black Friday tags</li>
<li>Login/signup: form no dark, logo branco</li>
<li>PWA standalone, theme meta roxo / manifest preto</li>
</ul>
<p class="note">Raios: --cf-radius-sm 8 · md 12 · lg 16 · pill 999</p>
</div></div>
""", 8, "UI")

# 9 voz / canais / IA
page("light", "Voz · canais · IA", "Pitch de <b>máquina de vendas</b>, não de IA", f"""
<div class="grid2">
<div class="card">
<b>Voz</b>
<ul>
<li>Do: “3 em 1”, “Venda seu conteúdo”, “Seguir grátis”, números de ganhos</li>
<li>Don't: vender GenAI como feature — ban a perfis/imagens IA</li>
<li>Tom: hype de conversão + Telegram-first</li>
</ul>
<b style="margin-top:12px">Canais</b>
<ul>
<li>close.fans — produto</li>
<li>blog.close.fans — conteúdo</li>
<li>ajuda.close.fans — Crisp help</li>
<li>CloseBot — Telegram</li>
</ul>
</div>
<div class="card">
<b>Política de IA (produto)</b>
<p>Help + Termos 5.3.A: proibido criar perfis com imagens GenAI / deepfake. Violação grave → exclusão. CloseBot = cobrança/entrega, não companion GenAI.</p>
<div class="warn" style="margin-top:12px">Para Clozzy: polo oposto possível = humano + tools com disclosure (ver ia.md do benchmarking).</div>
</div></div>
""", 9, "Voz e IA")

# 10 refs
page("mist", "Referências", "Telas reais do <b>produto</b>", f"""
<div class="refs">
<div class="rf">{img('landing.png', REFS, max_w=640)}<b>Landing</b><span>Hero 3 em 1 · CTA roxo · mockups</span></div>
<div class="rf">{img('login.png', REFS, max_w=640)}<b>Login</b><span>Dark form · logo branco</span></div>
<div class="rf">{img('feed.png', REFS, max_w=640)}<b>Feed</b><span>Wordmark · tabs · recomendações</span></div>
</div>
""", 10, "Referências")

# 11 inconsistências
page("light", "Notas", "O que a marca <b>atual</b> deixa solto", f"""
<div class="grid2">
<div class="card">
<b>Inconsistências observadas</b>
<ul>
<li>Dois sistemas de logo (stacked display vs wordmark+chave) sem master SVG público</li>
<li><code>theme-color</code> meta = #890AFF vs manifest background/theme = #050506</li>
<li>Nome: Close Fans / CloseFans / Close misturados</li>
<li>Blog (Wix) e app (Next) com favicons irmãos, não idênticos</li>
</ul>
</div>
<div class="card">
<b>close.com.br</b>
<p>Checado em 2026-11-11: produtora de vídeo em Uberlândia (Almanaque). <b>Não usar</b> como fonte da identidade CloseFans.</p>
<b style="margin-top:12px">Uso no Clozzy</b>
<p>Este kit é <b>insumo de benchmarking</b> — não licença de uso da marca alheia. Clozzy deve ter identidade própria (card “Criar identidade visual”).</p>
</div></div>
""", 11, "Inconsistências")

# 12 contracapa
pages.append((None, f"""<section class="page purple">
<div class="eyebrow">Clozzy · benchmarking</div>
<h2 style="margin-top:40px;font-size:36px">CloseFans · as-is</h2>
<p class="lead" style="margin-top:16px">Kit gerado para Clozzy 2028 a partir do produto vivo. Próximo passo de marca Clozzy: identidade própria (não clone).</p>
<div style="margin-top:auto;display:flex;gap:24px;align-items:center">
{img('mark-key-app-512.png', h=72, max_w=160)}
<div style="font-size:12px;opacity:.85;line-height:1.6">close.fans<br>tokens.css · BRAND.md · logos/<br>novembro 2026</div>
</div>
{foot(12)}</section>"""))

# assemble
toc_titles = [t for t, _ in pages if t]
body = "\n".join(html for _, html in pages)
# fix page numbers already embedded
html_doc = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<title>CloseFans — Identidade visual as-is</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<style>{CSS}</style>
</head>
<body>
{body}
</body>
</html>"""
OUT_HTML.write_text(html_doc, encoding="utf-8")
print("HTML", OUT_HTML, "bytes", OUT_HTML.stat().st_size)

chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if not os.path.exists(chrome):
    chrome = "/Applications/Chromium.app/Contents/MacOS/Chromium"
with tempfile.TemporaryDirectory() as td:
    out_pdf = os.path.join(td, "out.pdf")
    subprocess.run([
        chrome, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
        f"--print-to-pdf={out_pdf}",
        OUT_HTML.as_uri(),
    ], check=True, capture_output=True)
    Path(out_pdf).replace(OUT_PDF)
print("PDF", OUT_PDF, "bytes", OUT_PDF.stat().st_size)

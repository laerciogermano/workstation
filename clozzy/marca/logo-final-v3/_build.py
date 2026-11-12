#!/usr/bin/env python3
"""Clozzy — logo final: PNGs, peças de rede social (HTML editável + PNG) e manual (HTML + PDF).
Rodar: python3 _marca.py && python3 _build.py"""
import shutil, subprocess, sys, tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import _marca as M  # noqa: E402

SB, K, f = M.SB, M.K, M.f
PINK, DEEP, PURPLE, INK, CREAM, WHITE = M.PINK, M.DEEP, M.PURPLE, M.INK, M.CREAM, M.WHITE
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PNG, SOC = HERE / "png", HERE / "social"
REFS = HERE.parent / "refs"

FONTS = """@font-face{font-family:Gabarito;src:url("%s/Gabarito-Variable.ttf");font-weight:400 900}
@font-face{font-family:Figtree;src:url("%s/Figtree-Variable.ttf");font-weight:300 900}"""


def chrome(args):
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
                    "--force-device-scale-factor=1", *args], check=True, capture_output=True)


def shot(html_path, w, h, out, transparent=False):
    extra = ["--default-background-color=00000000"] if transparent else []
    chrome([*extra, f"--screenshot={out}", f"--window-size={w},{h}", "--virtual-time-budget=1500", html_path.as_uri()])


def png_of_svg(svg_file, w, h, out, bg=None):
    with tempfile.TemporaryDirectory() as td:
        p = Path(td) / "x.html"
        b = f"background:{bg};" if bg else ""
        p.write_text(f'<html><body style="margin:0;{b}"><img src="{svg_file.as_uri()}" style="width:{w}px;height:{h}px;display:block"></body></html>')
        shot(p, w, h, out, transparent=bg is None)


def svg_size(svg):
    import re
    m = re.search(r'width="([\d.]+)" height="([\d.]+)"', svg)
    return float(m.group(1)), float(m.group(2))


# ------------------------------------------------------------------ PNG
def build_png():
    shutil.rmtree(PNG, ignore_errors=True)
    PNG.mkdir()
    S = M.OUT
    jobs = []
    for s in ("preto", "rosa", "roxo", "cream", "branco", "mono-branco", "mono-ink"):
        for kind, W in (("horizontal", 2000), ("empilhado", 1200)):
            name = f"logo-{kind}-{s}"
            w, h = svg_size((S / f"{name}.svg").read_text())
            jobs.append((S / f"{name}.svg", W, round(W * h / w), PNG / f"{name}-{W}.png", None))
        jobs.append((S / f"simbolo-{s}.svg", 1024, 1024, PNG / f"simbolo-{s}-1024.png", None))
    for s in ("rosa", "preto"):
        for n in (1024, 512, 180):
            jobs.append((S / f"app-icon-{s}.svg", n, n, PNG / f"app-icon-{s}-{n}.png", None))
    for n in (16, 32, 48):
        jobs.append((S / "favicon.svg", n, n, PNG / f"favicon-{n}.png", None))
    for src, w, h, out, bg in jobs:
        png_of_svg(src, w, h, out, bg)
    return len(jobs)


# ------------------------------------------------------------------ peças sociais
def sv(name):
    return f"../../svg/{name}.svg"


def ring_frame(c, size, w=6.0):
    """Moldura “story” — o anel do símbolo sem a estrela, em volta de uma foto."""
    return (f'<svg viewBox="5 5 90 90" width="{size}" height="{size}" style="position:absolute;inset:0">'
            f'{SB.ring_c(c, w, 3, M.OPEN, M.DUTY)}</svg>')


def avatar_ph(size, ring, photo_bg, initial_c, letter="M"):
    inner = size * 0.80
    off = (size - inner) / 2
    return (f'<div style="position:relative;width:{size}px;height:{size}px">{ring_frame(ring, size)}'
            f'<div style="position:absolute;left:{off}px;top:{off}px;width:{inner}px;height:{inner}px;border-radius:50%;'
            f'background:{photo_bg};display:flex;align-items:center;justify-content:center;font:800 {inner*0.42}px Gabarito;color:{initial_c}">{letter}</div></div>')


def icon(kind, c):
    if kind == "star":
        return SB.star(c, R=30)
    if kind == "play":
        return f'<path d="M38 28 L72 50 L38 72 Z" fill="{c}" stroke="{c}" stroke-width="8" stroke-linejoin="round"/>'
    if kind == "chat":
        return (f'<rect x="24" y="28" width="52" height="38" rx="12" fill="{c}"/>'
                f'<path d="M36 62 L34 76 L50 64 Z" fill="{c}" stroke="{c}" stroke-width="3" stroke-linejoin="round"/>')
    if kind == "pix":
        return f'<text x="50" y="62" text-anchor="middle" font-family="Gabarito" font-weight="900" font-size="34" fill="{c}">Pix</text>'
    if kind == "lock":
        return (f'<rect x="30" y="46" width="40" height="30" rx="7" fill="{c}"/>'
                f'<path d="M38 47 V39 a12 12 0 0 1 24 0 V47" fill="none" stroke="{c}" stroke-width="7"/>')


def H(t, size, c, w=900, lh=1.0, ls=-0.03, extra=""):
    return f'<div style="font:{w} {size}px/{lh} Gabarito;letter-spacing:{ls}em;color:{c};{extra}">{t}</div>'


def P(t, size, c, w=500, extra=""):
    return f'<div style="font:{w} {size}px/1.35 Figtree;color:{c};{extra}">{t}</div>'


def pill(t, bg, c, size=40):
    return (f'<div style="display:inline-block;background:{bg};color:{c};font:800 {size}px Gabarito;'
            f'padding:{size*0.55}px {size*1.1}px;border-radius:999px">{t}</div>')


def big_ring(c, size, x, y, w=9.5, star=None):
    body = SB.ring_c(c, w, 3, M.OPEN, M.DUTY) + (SB.star(star, M.STAR) if star else "")
    return (f'<svg viewBox="5 5 90 90" width="{size}" height="{size}" '
            f'style="position:absolute;left:{x}px;top:{y}px">{body}</svg>')


SOCIAL = []   # slug, grupo, nome, w, h, bg, corpo


def piece(slug, group, name, w, h, bg, body):
    SOCIAL.append((slug, group, name, w, h, bg, body))


def define_social():
    abs_ = "position:absolute;"
    # --- perfil
    for s in ("rosa", "preto"):
        piece(f"avatar-{s}", "perfil", f"Foto de perfil · {s}", 1080, 1080, M.FUNDO[s][2],
              f'<img src="{sv("avatar-" + s)}" style="width:1080px;height:1080px">')
    # destaques (capas de highlights): ícone rosa/branco no preto
    for k, lab in (("star", "Close"), ("play", "Vídeos"), ("chat", "Chat"), ("pix", "Pix"), ("lock", "Exclusivo")):
        c = WHITE if k in ("play", "pix") else PINK
        piece(f"destaque-{k}", "destaques", f"Destaque · {lab}", 1080, 1080, INK,
              f'<svg viewBox="0 0 100 100" width="1080" height="1080"><g transform="translate(25 25) scale(.5)">{icon(k, c)}</g></svg>')
    # --- feed
    piece("post-manifesto", "feed", "Feed 4:5 · manifesto (preto)", 1080, 1350, INK,
          big_ring(PINK, 820, 200, 760, star=None)
          + f'<img src="{sv("logo-horizontal-preto")}" style="{abs_}left:90px;top:90px;height:64px">'
          + f'<div style="{abs_}left:90px;top:300px">' + H("Seu close,<br>seu preço.", 150, WHITE) + "</div>"
          + f'<div style="{abs_}left:90px;top:640px;width:620px">' + P("Stories, vídeos e chat de quem você segue de perto. Pago no Pix.", 38, "rgba(255,255,255,.75)") + "</div>")
    piece("post-como-funciona", "feed", "Feed 1:1 · como funciona (rosa)", 1080, 1080, PINK,
          f'<img src="{sv("logo-horizontal-rosa")}" style="{abs_}left:90px;top:90px;height:60px">'
          + f'<div style="{abs_}left:90px;top:260px">'
          + "".join(f'<div style="display:flex;align-items:center;gap:30px;margin-bottom:34px">{H(n, 90, WHITE, 900)}{H(t, 64, WHITE, 800)}</div>'
                    for n, t in (("1", "Escolhe o close"), ("2", "Paga no Pix"), ("3", "Abre na biblioteca")))
          + "</div>"
          + f'<div style="{abs_}left:90px;bottom:90px">' + P("Liberado na hora. Só você vê.", 36, WHITE, 600) + "</div>")
    piece("post-convite", "feed", "Feed 4:5 · convite (roxo)", 1080, 1350, PURPLE,
          f'<img src="{sv("simbolo-roxo")}" style="{abs_}left:90px;top:90px;width:150px">'
          + f'<div style="{abs_}left:90px;top:420px">' + H("Entra pro<br>meu close.", 140, WHITE) + "</div>"
          + f'<div style="{abs_}left:90px;top:780px">' + P("Conteúdo que não vai pro feed. Link na bio.", 40, WHITE, 500) + "</div>"
          + f'<div style="{abs_}left:90px;bottom:110px">' + pill("Entrar no Close", WHITE, PURPLE, 44) + "</div>"
          + f'<img src="{sv("logo-palavra-roxo")}" style="{abs_}right:90px;bottom:122px;height:52px">')
    piece("post-creator", "feed", "Feed 1:1 · creator com anel (cream)", 1080, 1080, CREAM,
          f'<div style="{abs_}left:340px;top:150px">{avatar_ph(400, DEEP, INK, CREAM)}</div>'
          + f'<div style="{abs_}left:0;right:0;top:600px;text-align:center">' + H("@mari", 76, INK, 800)
          + P("abriu o close dela", 40, "rgba(20,9,15,.7)", 500, "margin-top:10px") + "</div>"
          + f'<div style="{abs_}left:0;right:0;top:790px;text-align:center">' + pill("Entrar no Close", DEEP, WHITE, 40) + "</div>"
          + f'<img src="{sv("logo-horizontal-cream")}" style="{abs_}left:50%;transform:translateX(-50%);bottom:60px;height:44px">')
    # carrossel (3 cartões, preto → cream → rosa)
    piece("carrossel-1", "carrossel", "Carrossel 1/3", 1080, 1350, INK,
          big_ring(PINK, 760, 260, -160, star=WHITE)
          + f'<div style="{abs_}left:90px;bottom:260px">' + H("O close<br>friends<br>que paga.", 130, WHITE) + "</div>"
          + f'<div style="{abs_}left:90px;bottom:110px">' + P("arrasta →", 36, "rgba(255,255,255,.7)", 600) + "</div>")
    piece("carrossel-2", "carrossel", "Carrossel 2/3", 1080, 1350, CREAM,
          f'<div style="{abs_}left:90px;top:120px">' + H("Pra quem cria", 44, DEEP, 800) + "</div>"
          + f'<div style="{abs_}left:90px;top:220px;width:900px">' + H("Você define o preço de cada story, vídeo e chamada.", 92, INK, 900, 1.05) + "</div>"
          + f'<div style="{abs_}left:90px;bottom:110px;width:820px">' + P("O fã paga no Pix e o conteúdo abre na biblioteca dele. Sem print, sem repost.", 38, "rgba(20,9,15,.7)") + "</div>")
    piece("carrossel-3", "carrossel", "Carrossel 3/3", 1080, 1350, PINK,
          f'<div style="{abs_}left:0;right:0;top:330px;display:flex;justify-content:center"><img src="{sv("logo-empilhado-rosa")}" style="height:420px"></div>'
          + f'<div style="{abs_}left:0;right:0;top:880px;text-align:center">' + H("Seu close, seu preço.", 64, WHITE, 800) + "</div>"
          + f'<div style="{abs_}left:0;right:0;bottom:120px;text-align:center">' + P("clozzy.com", 38, WHITE, 600) + "</div>")
    # --- stories
    piece("story-novo", "stories", "Story · novo conteúdo (preto)", 1080, 1920, INK,
          f'<img src="{sv("logo-horizontal-preto")}" style="{abs_}left:50%;transform:translateX(-50%);top:150px;height:56px">'
          + f'<div style="{abs_}left:290px;top:520px">{avatar_ph(500, PINK, CREAM, INK)}</div>'
          + f'<div style="{abs_}left:0;right:0;top:1100px;text-align:center">' + H("Story novo<br>no close.", 120, WHITE) + "</div>"
          + f'<div style="{abs_}left:0;right:0;top:1440px;text-align:center">' + P("R$ 9,90 · libera na hora", 42, "rgba(255,255,255,.75)", 600) + "</div>"
          + f'<div style="{abs_}left:0;right:0;bottom:250px;text-align:center">' + pill("Entrar no Close", PINK, INK, 48) + "</div>")
    piece("story-liberado", "stories", "Story · liberado (rosa)", 1080, 1920, PINK,
          big_ring(WHITE, 760, 160, 380, star=WHITE)
          + f'<div style="{abs_}left:0;right:0;top:1250px;text-align:center">' + H("Liberado.", 150, WHITE) + "</div>"
          + f'<div style="{abs_}left:0;right:0;top:1440px;text-align:center">' + P("Tá na sua biblioteca.", 48, WHITE, 600) + "</div>"
          + f'<img src="{sv("logo-palavra-rosa")}" style="{abs_}left:50%;transform:translateX(-50%);bottom:180px;height:60px">')
    piece("story-assinatura", "stories", "Story · marca d’água em vídeo", 1080, 1920, "#3a2a31",
          f'<div style="{abs_}inset:0;background:linear-gradient(#5b4650,#2a1c22)"></div>'
          + f'<div style="{abs_}left:0;right:0;top:860px;text-align:center">' + P("(vídeo do creator)", 40, "rgba(255,255,255,.45)", 500) + "</div>"
          + f'<div style="{abs_}left:70px;bottom:260px;display:flex;align-items:center;gap:18px;opacity:.9">'
          + f'<img src="{sv("simbolo-mono-branco")}" style="width:72px">' + H("@mari no clozzy", 40, WHITE, 800) + "</div>")
    # --- capas
    piece("capa-youtube", "capas", "YouTube · 2560×1440 (área segura 1546×423 no centro)", 2560, 1440, INK,
          big_ring(PINK, 900, 1560, -470)
          + f'<div style="{abs_}left:507px;top:508px;width:1546px;height:423px;display:flex;align-items:center;justify-content:space-between">'
          + f'<img src="{sv("logo-horizontal-preto")}" style="height:150px">' + H("Seu close,<br>seu preço.", 96, WHITE, 900, 1.0) + "</div>")
    piece("capa-x", "capas", "X / Twitter · 1500×500", 1500, 500, PINK,
          f'<div style="{abs_}left:0;right:0;top:0;bottom:0;display:flex;align-items:center;justify-content:center;gap:70px">'
          + f'<img src="{sv("logo-horizontal-rosa")}" style="height:110px">'
          + f'<div style="width:3px;height:120px;background:rgba(255,255,255,.6)"></div>' + H("Seu close,<br>seu preço.", 64, WHITE, 800) + "</div>")
    piece("capa-linkedin", "capas", "LinkedIn · 1584×396", 1584, 396, CREAM,
          f'<div style="{abs_}left:560px;right:80px;top:0;bottom:0;display:flex;align-items:center;justify-content:space-between">'
          + f'<img src="{sv("logo-horizontal-cream")}" style="height:84px">' + P("O close friends pago.<br>Stories, vídeos e chat no Pix.", 30, INK, 600, "text-align:right") + "</div>")
    piece("og-link", "capas", "Prévia de link (Open Graph) · 1200×630", 1200, 630, INK,
          big_ring(PINK, 520, 640, -130)
          + f'<img src="{sv("logo-horizontal-preto")}" style="{abs_}left:80px;top:80px;height:64px">'
          + f'<div style="{abs_}left:80px;bottom:90px">' + H("Seu close,<br>seu preço.", 96, WHITE) + "</div>")


def build_social():
    shutil.rmtree(SOC, ignore_errors=True)
    (SOC / "html").mkdir(parents=True)
    define_social()
    for slug, g, n, w, h, bg, body in SOCIAL:
        p = SOC / "html" / f"{slug}.html"
        p.write_text(f'<!DOCTYPE html><html><head><meta charset="utf-8"><title>Clozzy — {n}</title><style>{FONTS % ("../../fonts", "../../fonts")}'
                     f'html,body{{margin:0}}.c{{position:relative;width:{w}px;height:{h}px;overflow:hidden;background:{bg}}}</style></head>'
                     f'<body><div class="c">{body}</div></body></html>')
        shot(p, w, h, SOC / f"{slug}.png")
    return len(SOCIAL)


# ------------------------------------------------------------------ manual
def inline(name):
    return (M.OUT / f"{name}.svg").read_text()


def page(title, num, body, bg=WHITE, fg=INK):
    head = (f'<div class="hd" style="color:{fg}"><span>{title}</span><span>{num:02d}</span></div>' if title else "")
    return f'<section style="background:{bg};color:{fg}">{head}{body}</section>'


def card(inner, bg, label="", lc=None, h=220, w=None):
    lc = lc or "rgba(20,9,15,.6)"
    ws = f"width:{w}px;" if w else "flex:1;"
    return (f'<div style="{ws}"><div style="background:{bg};height:{h}px;border-radius:18px;display:flex;align-items:center;'
            f'justify-content:center;overflow:hidden">{inner}</div><div class="lb" style="color:{lc}">{label}</div></div>')


def im(src, h=None, w=None, style=""):
    s = (f"height:{h}px;" if h else "") + (f"width:{w}px;" if w else "")
    return f'<img src="{src}" style="{s}display:block;{style}">'


def construction():
    """Diagrama de construção no grid 100."""
    import math
    g = "".join(f'<line x1="{i}" y1="0" x2="{i}" y2="100" stroke="rgba(20,9,15,.08)" stroke-width=".25"/>'
                f'<line x1="0" y1="{i}" x2="100" y2="{i}" stroke="rgba(20,9,15,.08)" stroke-width=".25"/>' for i in range(0, 101, 5))
    guides = ('<circle cx="50" cy="50" r="45" fill="none" stroke="#7C48C4" stroke-width=".3" stroke-dasharray="1 1"/>'
              f'<circle cx="50" cy="50" r="{45 - M.RING}" fill="none" stroke="#7C48C4" stroke-width=".3" stroke-dasharray="1 1"/>'
              f'<circle cx="50" cy="50" r="{M.CIRCULO}" fill="none" stroke="#7C48C4" stroke-width=".3" stroke-dasharray="1 1"/>')
    for a in (-60, 60):
        x, y = 50 + 48 * math.cos(math.radians(a)), 50 + 48 * math.sin(math.radians(a))
        guides += f'<line x1="50" y1="50" x2="{f(x)}" y2="{f(y)}" stroke="#7C48C4" stroke-width=".3"/>'
    return (f'<svg viewBox="-2 -2 104 104" width="560" height="560">{g}<g opacity=".9">{M.SYM(DEEP, DEEP)}</g>{guides}</svg>')


def clear_space(src_svg, x_ratio, label):
    return (f'<div style="display:inline-block;padding:{x_ratio}px;outline:2px dashed {PURPLE};outline-offset:-2px;'
            f'background:repeating-linear-gradient(45deg,rgba(124,72,196,.08) 0 6px,transparent 6px 12px)">'
            f'<div style="background:{WHITE}">{src_svg}</div></div><div class="lb">{label}</div>')


def wrong(inner, label, bg=WHITE):
    return (f'<div style="flex:1;min-width:300px"><div style="background:{bg};height:170px;border-radius:18px;display:flex;align-items:center;'
            f'justify-content:center;position:relative;overflow:hidden">{inner}'
            f'<div style="position:absolute;top:10px;right:14px;font:900 30px Gabarito;color:{INK if bg != INK else WHITE};opacity:.7">✕</div></div>'
            f'<div class="lb">{label}</div></div>')


def sym_inline(rc, sc, size, small=False, extra=""):
    return f'<svg viewBox="5 5 90 90" width="{size}" height="{size}" style="{extra}">{M.SYM(rc, sc, small)}</svg>'


def lock_inline(fundo, h, extra=""):
    s = M.lockup_svg("horizontal", fundo)
    return f'<img src="data:image/svg+xml;utf8,{s.replace(chr(10), "").replace("#", "%23").replace(chr(34), chr(39))}" style="height:{h}px;{extra}">'


def build_manual():
    pages = []
    n = iter(range(1, 99))
    S = "svg/"
    # 1 capa
    pages.append(page("", 0, f'<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:50px">'
                      f'{im(S + "logo-horizontal-preto.svg", h=170)}'
                      f'<div style="font:600 26px Figtree;color:rgba(255,255,255,.7);letter-spacing:.12em">LOGO FINAL · IDENTIDADE VISUAL · 2026-11-11</div></div>', INK, WHITE))
    # 2 compilado
    refs = [("Captura de Tela 2026-11-11 às 14.03.10.png", "14.03 · C grosso + estrela grande, traços à direita"),
            ("Captura de Tela 2026-11-11 às 14.31.06.png", "14.31 · tile rosa, tudo branco (aqui invertido: traços à direita)"),
            ("Captura de Tela 2026-11-11 às 14.54.44.png", "14.54 · anel de story: metade cheia, metade tracejada"),
            ("Captura de Tela 2026-11-11 às 15.01.35.png", "15.01 · C cheio + tracejado só na abertura")]
    rimg = "".join(f'<div style="flex:1"><div style="height:230px;background:{CREAM};border-radius:18px;display:flex;align-items:center;justify-content:center;overflow:hidden">'
                   f'<img src="{(REFS / a).as_uri()}" style="max-height:200px;max-width:90%"></div><div class="lb">{b}</div></div>' for a, b in refs)
    bullets = [("Forma", "C da v7: linha cheia em 240° e 3 traços só na abertura da direita"),
               ("Traço", "cantos arredondados (v4); poucos e longos, para não virar bolinha"),
               ("Espessura", "anel 9,5 no grid 100 (≈ 24/256): story tracejado e grosso"),
               ("Estrela", "a original, inscrita no círculo central r 21: as pontas tocam a borda e nunca passam"),
               ("Palavra", "Gabarito 800, sempre ao lado ou embaixo do símbolo, nunca fundida"),
               ("Cor", "no preto, arco rosa e estrela branca; no rosa e no roxo, tudo branco")]
    bl = "".join(f'<div style="display:flex;gap:20px;padding:12px 0;border-top:1px solid rgba(20,9,15,.12)"><b style="width:150px;font:800 22px Gabarito">{a}</b><span style="font:500 21px Figtree">{b}</span></div>' for a, b in bullets)
    pages.append(page("O compilado", next(n), f'<h1>O melhor de cada rodada</h1><div class="row" style="gap:24px">{rimg}</div>'
                      f'<div class="row" style="margin-top:34px;gap:60px;align-items:flex-start"><div style="flex:1.4">{bl}</div>'
                      f'<div style="flex:1;display:flex;justify-content:center">{sym_inline(DEEP, DEEP, 300)}</div></div>'))
    # 3 símbolo + construção
    spec = [("Grid", "100 × 100, anel externo r 45"), ("Anel", f"espessura {f(M.RING)}"), ("Linha cheia", "240°, abraça a esquerda"),
            ("Abertura", "120° à direita, centrada em 0°"), ("Traços", "3, cantos com raio de 42% da espessura"),
            ("Estrela", f"inscrita no círculo central r {f(M.CIRCULO)}: pontas tocam, nunca passam"), ("Corte pequeno", "≤ 32 px: anel 13, 2 traços")]
    sp = "".join(f'<div style="display:flex;justify-content:space-between;padding:11px 0;border-top:1px solid rgba(20,9,15,.12);font:500 21px Figtree"><b>{a}</b><span>{b}</span></div>' for a, b in spec)
    pages.append(page("Símbolo · construção", next(n), f'<div class="row" style="gap:80px;height:100%;align-items:center">{construction()}<div style="flex:1"><h1>O símbolo</h1>'
                      f'<p class="lead">Um anel de story que ainda não fechou: o C cheio é o que você já vê, e os três traços são o que só abre no close. A estrela marca quem está dentro.</p>{sp}</div></div>'))
    # 4 versões
    pages.append(page("Versões", next(n), '<h1>Quatro versões, uma família</h1><div class="row" style="gap:24px">'
                      + card(im(S + "logo-horizontal-branco.svg", h=80), CREAM, "Horizontal · principal", h=300, w=560)
                      + card(im(S + "logo-empilhado-branco.svg", h=200), CREAM, "Empilhado · espaço quadrado", h=300)
                      + card(im(S + "simbolo-branco.svg", h=170), CREAM, "Símbolo · avatar, ícone, selo", h=300)
                      + card(im(S + "logo-palavra-branco.svg", h=60), CREAM, "Só a palavra · texto corrido", h=300) + "</div>"
                      '<p class="lead" style="margin-top:40px">Use a horizontal sempre que couber. A empilhada é para espaço quadrado (splash, post 1:1, merch). '
                      'O símbolo sozinho só onde a marca já está apresentada (perfil, app, favicon). A palavra sozinha, quando o símbolo já aparece por perto.</p>'))
    # 5 cor — combinações permitidas
    combos = [("preto", "Preto · principal"), ("rosa", "Rosa · tudo branco"), ("roxo", "Roxo · tudo branco"), ("deep", "Pink Deep · tudo branco"),
              ("cream", "Cream · palavra ink"), ("branco", "Branco · palavra ink"), ("mono-branco", "Uma cor · branco"), ("mono-ink", "Uma cor · ink")]
    cc = "".join(card(im(S + f"logo-horizontal-{s}.svg", h=48), M.FUNDO[s][2], lab, h=130, w=335) for s, lab in combos)
    sw = "".join(f'<div style="flex:1"><div style="height:90px;border-radius:14px;background:{c};border:1px solid rgba(20,9,15,.1)"></div>'
                 f'<div class="lb"><b>{nm}</b> {c}</div></div>' for nm, c in (("Pink", PINK), ("Pink Deep", DEEP), ("Roxo", PURPLE), ("Ink", INK), ("Cream", CREAM), ("Branco", WHITE)))
    pages.append(page("Cor", next(n), f'<h1>Só seis cores</h1><div class="row" style="gap:16px">{sw}</div>'
                      f'<div class="row" style="gap:20px;flex-wrap:wrap;margin-top:30px">{cc}</div>'))
    # 6 área de proteção + tamanho mínimo
    xs = 34   # x = 1/4 do diâmetro do anel (anel 136 px)
    pages.append(page("Área de proteção e tamanho mínimo", next(n),
                      '<div class="row" style="gap:80px;align-items:flex-start"><div style="flex:1.2"><h1>Respiro</h1>'
                      '<p class="lead">Em volta do logo, deixe livre <b>x = ¼ do diâmetro do anel</b> (≈ a largura da estrela). Nenhum texto, borda ou foto entra nessa faixa.</p>'
                      f'<div style="margin-top:30px">{clear_space(lock_inline("branco", 136), xs, "lockup horizontal: x em todos os lados")}</div></div>'
                      '<div style="flex:1"><h1>Mínimos</h1>'
                      + "".join(f'<div style="display:flex;align-items:center;gap:24px;padding:16px 0;border-top:1px solid rgba(20,9,15,.12)">'
                                f'<div style="width:200px;display:flex;align-items:center">{v}</div><div style="font:500 20px Figtree"><b>{a}</b><br>{b}</div></div>'
                                for v, a, b in ((lock_inline("branco", 24), "Horizontal", "96 px de largura · 25 mm"),
                                                (im(S + "logo-empilhado-branco.svg", h=64), "Empilhado", "64 px de altura · 18 mm"),
                                                (sym_inline(DEEP, DEEP, 24), "Símbolo", "24 px · 6 mm"),
                                                (sym_inline(DEEP, DEEP, 16, True), "Corte pequeno", "16–32 px: anel 13, 2 traços")))
                      + "</div></div>"))
    # 7 corte pequeno
    sizes = "".join(f'<div style="text-align:center">{sym_inline(DEEP, DEEP, s, s <= 32)}<div class="lb">{s}px{" · corte pequeno" if s <= 32 else ""}</div></div>' for s in (16, 24, 32, 48, 96, 180))
    fav = "".join(f'<div style="text-align:center">{im(S + "favicon.svg", w=s)}<div class="lb">{s}px</div></div>' for s in (16, 32, 64))
    pages.append(page("Corte pequeno", next(n), f'<h1>Escala</h1><p class="lead">Até 32 px o símbolo troca para o corte pequeno: anel mais grosso e só 2 traços, para o tracejado não sumir.</p>'
                      f'<div class="row" style="gap:60px;align-items:flex-end;margin-top:40px">{sizes}</div>'
                      f'<h2 style="margin-top:60px">Favicon</h2><div class="row" style="gap:50px;align-items:flex-end">{fav}</div>'))
    # 8 usos incorretos
    from _marca import T
    ok_lock = lock_inline("branco", 70)
    wr = [wrong(lock_inline("branco", 70, "transform:scaleX(1.35)"), "Esticar ou achatar"),
          wrong(sym_inline(DEEP, DEEP, 120, extra="transform:scaleX(-1)"), "Espelhar (traços sempre à direita)"),
          wrong(sym_inline(DEEP, DEEP, 120, extra="transform:rotate(90deg)"), "Girar"),
          wrong(f'<svg viewBox="5 5 90 90" width="120" height="120">{SB.make_c(M.RING, 7, M.STAR, 180, .6)(DEEP, DEEP)}</svg>', "Mudar o número de traços"),
          wrong(f'<div style="display:flex;align-items:center">{sym_inline(DEEP, DEEP, 74)}<span style="font:800 80px Gabarito;color:{INK};letter-spacing:-.02em;margin-left:-4px">lozzy</span></div>', "Fundir o C com a palavra"),
          wrong(lock_inline("mono-ink", 70), "Preto sobre o rosa", PINK),
          wrong(f'<svg viewBox="5 5 90 90" width="120" height="120">{M.SYM(PINK, PINK)}</svg>', "Rosa sobre o roxo", PURPLE),
          wrong(f'<svg viewBox="5 5 90 90" width="120" height="120"><defs><linearGradient id="g"><stop offset="0" stop-color="{PURPLE}"/><stop offset="1" stop-color="#FFA000"/></linearGradient></defs>{M.SYM("url(#g)", "url(#g)")}</svg>', "Gradiente, sombra ou brilho"),
          wrong(f'<div style="display:flex;align-items:center;gap:16px">{sym_inline(DEEP, DEEP, 74)}<span style="font:700 64px Georgia;color:{INK}">clozzy</span></div>', "Trocar a fonte"),
          wrong(f'<div style="display:flex;align-items:center;gap:16px">{sym_inline(WHITE, PINK, 90)}</div>', "Branco com estrela rosa no preto", INK)]
    pages.append(page("Usos incorretos", next(n), f'<h1>Não fazer</h1><div class="row" style="gap:18px;flex-wrap:wrap">{"".join(wr)}</div>'))
    # 9 tipografia
    pages.append(page("Tipografia", next(n), '<div class="row" style="gap:80px;align-items:flex-start"><div style="flex:1">'
                      '<div style="font:900 150px/1 Gabarito;letter-spacing:-.03em">Aa</div><h2>Gabarito 700–900</h2>'
                      '<p class="lead">Nome, títulos, preços, números e botões. Aperto −3% nos títulos.</p>'
                      '<div style="font:900 64px/1.02 Gabarito;letter-spacing:-.03em;margin-top:24px">Seu close,<br>seu preço.</div></div>'
                      '<div style="flex:1"><div style="font:500 150px/1 Figtree">Aa</div><h2>Figtree 400–700</h2>'
                      '<p class="lead">Texto, legenda e interface.</p><div style="font:500 26px/1.45 Figtree;margin-top:24px">Pago no Pix. Liberado na sua biblioteca. '
                      'Escala: 64 · 44 · 32 · 22 · 16 · 14 · 12.</div></div></div>'))
    # 10 elemento gráfico
    pages.append(page("Elemento gráfico · anel de story", next(n),
                      '<h1>O anel sai do logo e vira linguagem</h1><p class="lead">O anel do símbolo (sem a estrela) é a moldura de story dos creators, a marca de “conteúdo novo” e o grafismo grande que sangra para fora das peças.</p>'
                      f'<div class="row" style="gap:24px;margin-top:30px">'
                      f'{card(avatar_ph(200, DEEP, INK, CREAM), CREAM, "Moldura de story no claro", h=300)}'
                      f'{card(avatar_ph(200, PINK, CREAM, INK), INK, "No escuro: anel rosa", h=300, lc="rgba(20,9,15,.6)")}'
                      f'{card(f"<div style=position:relative;width:100%;height:100%>{big_ring(WHITE, 260, -70, 20)}</div>", PINK, "Grafismo sangrado: no rosa, branco", h=300)}'
                      f'{card(f"<div style=position:relative;width:100%;height:100%>{big_ring(PINK, 260, -70, 20)}</div>", INK, "No preto, rosa", h=300)}'
                      '</div>'))
    # 11 perfil + destaques
    dz = "".join(card(im(f"social/destaque-{k}.png", w=150, style="border-radius:50%"), CREAM, lab, h=210) for k, lab in
                 (("star", "Close"), ("play", "Vídeos"), ("chat", "Chat"), ("pix", "Pix"), ("lock", "Exclusivo")))
    pages.append(page("Redes · perfil e destaques", next(n),
                      '<div class="row" style="gap:50px;align-items:flex-start"><div><h1>Foto de perfil</h1>'
                      '<p class="lead" style="max-width:520px">Só o símbolo, em fundo de cor cheia. A rede corta em círculo: o símbolo ocupa 58% para não encostar na borda nem no anel de story do Instagram.</p>'
                      '<div class="row" style="gap:30px;margin-top:20px">'
                      + "".join(f'<div style="text-align:center">{im(f"social/avatar-{s}.png", w=200, style="border-radius:50%")}<div class="lb">{lab}</div></div>' for s, lab in (("rosa", "Principal: rosa"), ("preto", "Alternativa: preto")))
                      + f'<div style="text-align:center">{im("social/avatar-rosa.png", w=60, style="border-radius:50%")}<div class="lb">60 px</div></div>'
                      '</div></div>'
                      f'<div style="flex:1"><h1>Destaques</h1><p class="lead">Capas de destaque no preto, ícones rosa e branco, um por tema.</p><div class="row" style="gap:14px;margin-top:20px">{dz}</div></div></div>'))
    # 12 feed
    feed = "".join(f'<div style="flex:1">{im(f"social/{s}.png", w=w, style="border-radius:10px;box-shadow:0 2px 14px rgba(20,9,15,.12)")}<div class="lb">{lab}</div></div>'
                   for s, w, lab in (("post-manifesto", 280, "4:5 · manifesto"), ("post-como-funciona", 350, "1:1 · como funciona"),
                                     ("post-convite", 280, "4:5 · convite"), ("post-creator", 350, "1:1 · creator")))
    pages.append(page("Redes · feed", next(n), f'<h1>Postagens</h1><div class="row" style="gap:24px;align-items:flex-start">{feed}</div>'
                      '<p class="lead" style="margin-top:24px">Um fundo de cor por post. Título em Gabarito 900, apoio em Figtree. Logo no canto superior ou na base, sempre com respiro de 90 px (margem da peça).</p>'))
    # 13 carrossel + stories
    car = "".join(im(f"social/carrossel-{i}.png", w=230, style="border-radius:8px") for i in (1, 2, 3))
    sto = "".join(f'<div>{im(f"social/{s}.png", w=190, style="border-radius:12px")}<div class="lb">{lab}</div></div>'
                  for s, lab in (("story-novo", "Conteúdo novo"), ("story-liberado", "Liberado"), ("story-assinatura", "Marca d’água")))
    pages.append(page("Redes · carrossel e stories", next(n),
                      f'<div class="row" style="gap:60px;align-items:flex-start"><div><h1>Carrossel</h1><div class="row" style="gap:10px">{car}</div>'
                      '<p class="lead" style="max-width:720px;margin-top:20px">Abre no preto com o anel sangrado, explica no cream e fecha no rosa com o logo empilhado.</p></div>'
                      f'<div><h1>Stories</h1><div class="row" style="gap:14px">{sto}</div>'
                      '<p class="lead" style="margin-top:20px">Deixe 250 px livres em cima e embaixo (área da interface).</p></div></div>'))
    # 14 capas
    pages.append(page("Redes · capas", next(n),
                      '<h1>Capas e prévias de link</h1><div class="row" style="gap:24px;align-items:flex-start">'
                      f'<div style="flex:1.2">{im("social/capa-youtube.png", w=640, style="border-radius:8px")}<div class="lb">YouTube 2560×1440 · conteúdo dentro de 1546×423</div>'
                      f'<div style="margin-top:20px">{im("social/og-link.png", w=640, style="border-radius:8px")}</div><div class="lb">Open Graph 1200×630 · WhatsApp, iMessage, X</div></div>'
                      f'<div style="flex:1">{im("social/capa-x.png", w=560, style="border-radius:8px")}<div class="lb">X 1500×500</div>'
                      f'<div style="margin-top:20px">{im("social/capa-linkedin.png", w=560, style="border-radius:8px")}</div><div class="lb">LinkedIn 1584×396 · logo à direita da foto de perfil</div></div></div>'))
    # 15 app
    pages.append(page("App e favicon", next(n), '<h1>Ícone do app</h1><div class="row" style="gap:50px;align-items:flex-end">'
                      + "".join(f'<div style="text-align:center">{im(S + f"app-icon-{s}.svg", w=sz)}<div class="lb">{lab}</div></div>'
                                for s, sz, lab in (("rosa", 240, "Principal · rosa, tudo branco"), ("preto", 240, "Alternativo · preto, arco rosa"), ("rosa", 120, "120"), ("rosa", 60, "60")))
                      + '</div><p class="lead" style="margin-top:40px">Exporte o quadrado sem cantos (a loja aplica a máscara). Símbolo a 62% da largura. No modo escuro do iOS, use a versão preta.</p>'))
    # 16 arquivos
    files = [("svg/", "vetores: símbolo, corte pequeno, horizontal, empilhado, palavra em 8 fundos; app-icon, avatar, favicon"),
             ("png/", "logos 2000 px, empilhados 1200 px, símbolo 1024, app-icon 1024/512/180, favicon 16/32/48"),
             ("social/", "PNGs prontos para postar; social/html/ tem cada peça editável (trocar texto e exportar)"),
             ("fonts/", "Gabarito e Figtree (OFL)"), ("_marca.py · _build.py", "geradores: mudar um número no _marca.py refaz tudo")]
    pages.append(page("Arquivos", next(n), '<h1>Kit</h1>' + "".join(
        f'<div style="display:flex;gap:30px;padding:18px 0;border-top:1px solid rgba(20,9,15,.12)"><b style="width:300px;font:800 26px Gabarito">{a}</b><span style="font:500 22px Figtree">{b}</span></div>' for a, b in files)))

    css = (FONTS % ("fonts", "fonts")) + """
@page{size:1600px 900px;margin:0}
*{box-sizing:border-box}body{margin:0;background:#888}
section{position:relative;width:1600px;height:900px;padding:90px 90px 60px;overflow:hidden;page-break-after:always;margin:0 auto 20px}
.hd{position:absolute;left:90px;right:90px;top:34px;display:flex;justify-content:space-between;font:600 15px Figtree;letter-spacing:.1em;text-transform:uppercase;opacity:.55}
h1{font:900 54px/1.05 Gabarito;letter-spacing:-.03em;margin:0 0 26px}h2{font:800 30px Gabarito;margin:16px 0 16px}
.lead{font:500 22px/1.45 Figtree;margin:0;max-width:1100px;opacity:.85}
.row{display:flex}.lb{font:500 15px/1.35 Figtree;margin-top:10px;color:rgba(20,9,15,.6)}
@media print{body{background:none}section{margin:0}}"""
    html = f'<!DOCTYPE html><html><head><meta charset="utf-8"><title>Clozzy — Logo final</title><style>{css}</style></head><body>{"".join(pages)}</body></html>'
    out = HERE / "logo-final-v3-clozzy.html"
    out.write_text(html)
    chrome([f"--print-to-pdf={HERE / 'logo-final-v3-clozzy.pdf'}", "--no-pdf-header-footer", "--virtual-time-budget=3000", out.as_uri()])
    return len(pages)


if __name__ == "__main__":
    print("svg", M.build())
    print("png", build_png())
    print("social", build_social())
    print("manual", build_manual(), "págs.")

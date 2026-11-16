#!/usr/bin/env python3
"""RolêGo — Manual de uso da marca (A4 paisagem, HTML self-contained → PDF).
Mesmo formato dos manuais de uso do Clozzy (capítulos com abertura, superfícies com papel de cada cor,
tokens.css/json, aplicações), com a identidade da RolêGo: logo gomosa, roxo + ciano + preto, Poppins, fotos de festa.
Páginas de marca, cor, tipo, foto e peças vêm do manual ../identidade-v5-gomosa (exec do build de lá, sem a saída);
as páginas novas estão aqui. Rodar: python3 _build.py"""
import os, sys, json, random

OUT = os.path.dirname(os.path.abspath(__file__))
V5 = os.path.normpath(os.path.join(OUT, "..", "identidade-v5-gomosa"))
sys.path.insert(0, V5)
from _common import *  # noqa: E402,F403  (HERE = pasta do v5: SVGs gomosos e fotos)

OUT_HTML = os.path.join(OUT, "manual-uso-marca-rolego.html")
OUT_PDF = os.path.join(OUT, "manual-uso-marca-rolego.pdf")

# ---------------------------------------------------------------- páginas prontas do v5
_src = open(os.path.join(V5, "_build.py")).read().split("# ---------------------------------------------------------------- numeração e sumário")[0]
NS = {"__name__": "v5", "__file__": os.path.join(V5, "_build.py")}
exec(_src, NS)
V5P = {t: h for t, h in NS["pages"] if t and t != "__TOC__"}
icon = NS["icon"]


def I(f, h=None, w=None, cls="", style=""):
    return img(f, h=h, w=w, cls=cls, style=style)


def F(name, w=900):
    return foto(name, w)


# ---------------------------------------------------------------- superfícies (papéis de cor) → tokens
SURF = {
    "roxo": {"nome": "Roxo", "superficie": PURPLE, "superficie-2": "rgba(255,255,255,.14)", "linha": "rgba(255,255,255,.28)",
             "titulo": "#FFFFFF", "texto": "#FFFFFF", "apoio": "rgba(255,255,255,.78)", "destaque": "#00E5E5",
             "role": "#FFFFFF", "go": "#00E5E5", "botao": "#FFFFFF", "botao-texto": "#6539CB",
             "secundario": "rgba(255,255,255,.7)", "link": "#FFFFFF", "chip": "rgba(255,255,255,.18)",
             "uso": "Principal. Capa, splash, post de marca, telão, merch. No roxo, texto pequeno é sempre branco; ciano só em título grande e no Go."},
    "preto": {"nome": "Preto", "superficie": "#000000", "superficie-2": "#0F0F13", "linha": "#1E1E25",
              "titulo": "#FFFFFF", "texto": "#D7D9E2", "apoio": "#9CA3AF", "destaque": "#00E5E5",
              "role": "#FFFFFF", "go": "linear-gradient(135deg,#00E5E5,#3B82F6)", "botao": PURPLE, "botao-texto": "#FFFFFF",
              "secundario": "#3A3D48", "link": "#00E5E5", "chip": "#1E1E25",
              "uso": "App, noite, stories, festa. Nenhuma letra roxa: o roxo entra como botão e superfície."},
    "branco": {"nome": "Branco", "superficie": "#FFFFFF", "superficie-2": "#F4F4F8", "linha": "#DCDDE5",
               "titulo": "#05070F", "texto": "#2A2D38", "apoio": "#5B6070", "destaque": "#6539CB",
               "role": "#05070F", "go": PURPLE, "botao": PURPLE, "botao-texto": "#FFFFFF",
               "secundario": "#DCDDE5", "link": "#6539CB", "chip": "#ECECF3",
               "uso": "Documento, e-mail, parceiro, institucional. Ciano não entra como texto (contraste baixo)."},
}
ROLES = [("superficie", "Superfície"), ("superficie-2", "Superfície 2"), ("linha", "Linha"), ("titulo", "Título"), ("texto", "Texto"),
         ("apoio", "Apoio"), ("destaque", "Destaque"), ("role", "“Rolê” do logo"), ("go", "“Go” do logo"), ("botao", "Botão"),
         ("botao-texto", "Texto do botão"), ("secundario", "Botão secundário (contorno)"), ("link", "Link"), ("chip", "Chip")]


def write_tokens():
    css = ["/* RolêGo · tokens por superfície (gerado por uso-da-marca/_build.py) */",
           ":root{--rg-roxo-1:#9E19E9;--rg-roxo-2:#6539CB;--rg-roxo-3:#452EFF;--rg-roxo:linear-gradient(135deg,#9E19E9 0%,#6539CB 50%,#452EFF 100%);"
           "--rg-roxo-texto:#6539CB;--rg-ciano:#00E5E5;--rg-azul:#3B82F6;--rg-preto:#000000;--rg-ink:#05070F;--rg-branco:#FFFFFF;--rg-nevoa:#F4F4F8;"
           "--rg-magenta:#FF1F7A;--rg-verde:#00FF00;--rg-amarelo:#FFCC00;"
           "--rg-sol:#FF7A2F;--rg-sol-claro:#FFB547;--rg-sol-degrade:linear-gradient(135deg,#FFB547 0%,#FF7A2F 100%);"
           "--rg-por-do-sol:linear-gradient(180deg,#FFB547 0%,#FF7A2F 26%,#9E19E9 64%,#6539CB 84%,#452EFF 100%);"
           "--t-fonte:Poppins,system-ui,sans-serif;--raio:16px;--raio-pilula:999px}"]
    for k, s in SURF.items():
        css.append(f'[data-tema="{k}"]{{' + ";".join(f"--{r}:{s[r]}" for r, _ in ROLES) + "}")
    css.append("/* detalhe de dia (sol): vale em qualquer superfície; texto laranja só no preto */")
    css.append('[data-dia]{--dia:#FF7A2F;--dia-claro:#FFB547;--dia-chip:#FF7A2F;--dia-chip-texto:#05070F;--dia-icone:#FF7A2F;--dia-sol:linear-gradient(180deg,#FFB547,#FF7A2F)}')
    css.append('[data-tema="por-do-sol"]{--superficie:var(--rg-por-do-sol);--titulo:#FFFFFF;--texto:#FFFFFF;--destaque:#00E5E5;--role:#FFFFFF;--go:#00E5E5;--botao:#FFFFFF;--botao-texto:#6539CB}')
    open(os.path.join(OUT, "tokens.css"), "w").write("\n".join(css) + "\n")
    tj = {k: {r: s[r] for r, _ in ROLES} for k, s in SURF.items()}
    tj["dia"] = {"sol": "#FF7A2F", "sol-claro": "#FFB547", "sol-degrade": "linear-gradient(135deg,#FFB547 0%,#FF7A2F 100%)",
                 "por-do-sol": "linear-gradient(180deg,#FFB547 0%,#FF7A2F 26%,#9E19E9 64%,#6539CB 84%,#452EFF 100%)",
                 "chip": "#FF7A2F", "chip-texto": "#05070F", "icone": "#FF7A2F", "regra": "detalhe < 10% da peça; texto laranja só no preto; nunca no logo"}
    json.dump(tj, open(os.path.join(OUT, "tokens.json"), "w"), ensure_ascii=False, indent=2)


# ---------------------------------------------------------------- helpers visuais
def phone(inner, w=200, h=410, bg="#000", style=""):
    return f'<div class="um-phone" style="width:{w}px;height:{h}px;{style}"><div class="um-scr" style="background:{bg}">{inner}</div></div>'


def qr(n=21, size=70, seed=7, fg="#05070F"):
    r = random.Random(seed); c = size / n; out = []
    finder = lambda x, y: (x < 7 and y < 7) or (x >= n - 7 and y < 7) or (x < 7 and y >= n - 7)
    for y in range(n):
        for x in range(n):
            if finder(x, y):
                fx, fy = x % (n - 7) if x >= n - 7 else x, y % (n - 7) if y >= n - 7 else y
                on = fx in (0, 6) or fy in (0, 6) or (2 <= fx <= 4 and 2 <= fy <= 4)
            else:
                on = r.random() < .48
            if on: out.append(f'<rect x="{x * c:.2f}" y="{y * c:.2f}" width="{c + .2:.2f}" height="{c + .2:.2f}"/>')
    return f'<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" fill="{fg}">{"".join(out)}</svg>'


AV = lambda *ns: "".join(f'<i style="background-image:url({F(n, 200)})"></i>' for n in ns)
GRADB = "linear-gradient(180deg,rgba(0,0,0,0) 35%,rgba(101,57,203,.6) 65%,rgba(69,46,255,.95) 100%)"

UM_CSS = """
.um-cover{background:#000;color:#fff;display:grid!important;grid-template-columns:1fr 1.05fr;gap:30px}
.um-cover h1{font-size:76px;font-weight:800;font-style:italic;letter-spacing:-.045em;line-height:.9}
.um-cover h1 b{color:#00E5E5}
.um-cl{display:flex;flex-direction:column;gap:16px;padding-top:10px}
.um-cr{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;height:430px}
.um-cr div{border-radius:18px;background-size:cover;background-position:center 25%}
.um-cr div:nth-child(2){margin-top:40px}.um-cr div:nth-child(3){margin-top:-10px}
.um-tiles{display:flex;gap:10px;justify-content:flex-end;margin-top:14px}
.um-org{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;flex:1}
.um-oc{border-radius:16px;padding:14px 16px;color:#fff;display:flex;flex-direction:column;gap:3px}
.um-oc .n{font-size:30px;font-weight:800;font-style:italic;line-height:1;letter-spacing:-.03em}
.um-oc.k .n{color:#00E5E5}.um-oc b{font-size:14px;margin-bottom:6px}
.um-oc span{font-size:9.5px;line-height:1.5;opacity:.88}.um-oc span i{font-style:normal;font-weight:700;display:inline-block;width:20px;opacity:.7}
.um-oc.k{background:#000}.um-oc.p{background:PURPLE}.um-oc.l{background:#fff;color:#05070F;border:1px solid #DCDDE5}
.um-op{display:grid!important;grid-template-columns:1.1fr 1fr;gap:30px}
.um-op .num{font-size:150px;font-weight:800;font-style:italic;letter-spacing:-.06em;line-height:.85}
.um-op.dark .num{color:#00E5E5}
.um-op h1{font-size:58px;font-weight:800;font-style:italic;letter-spacing:-.04em;line-height:.95;margin-top:auto}
.um-op .ds{font-size:13px;opacity:.8;margin-top:8px;max-width:440px;line-height:1.45}
.um-op ul{list-style:none;margin-top:16px;font-size:11px;line-height:1.75}.um-op ul i{font-style:normal;font-weight:700;display:inline-block;width:26px;color:#00E5E5}
.um-op.purple ul i{color:#fff;opacity:.7}
.um-opl{display:flex;flex-direction:column;padding-bottom:22px}
.um-opr{display:grid;grid-template-columns:1fr .8fr;gap:12px;align-items:end;padding-bottom:30px}
.um-opr .a{height:440px;border-radius:20px;background-size:cover;background-position:center 25%}
.um-opr .b{height:260px;border-radius:20px;background-size:cover;background-position:center 25%}
.um-opr .s{height:150px;border-radius:20px;display:flex;align-items:center;justify-content:center;margin-top:12px}
.um-lead{font-size:11.5px;color:#5B6070;margin-top:-4px}.dark .um-lead,.purple .um-lead{color:rgba(255,255,255,.75)}
.um-surf{display:grid;grid-template-columns:1.25fr 1fr;gap:20px;flex:1}
.um-tb{width:100%;border-collapse:collapse;font-size:9.5px}
.um-tb th{text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:#7C8090;padding:4px 6px;border-bottom:1px solid #DCDDE5}
.um-tb td{padding:3.2px 6px;border-bottom:1px solid #E6E7EE;white-space:nowrap}.um-tb td:first-child{font-weight:700}
.um-tb i{display:inline-block;width:12px;height:12px;border-radius:3px;vertical-align:-2px;margin-right:6px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.12)}
.um-tb code{font-size:8.5px}
.um-sc{display:flex;flex-direction:column;gap:10px}
.um-card{border-radius:16px;padding:12px 16px;display:flex;flex-direction:column;align-items:flex-start;gap:5px;position:relative}
.um-card .t{font-size:20px;font-weight:800;font-style:italic;letter-spacing:-.03em;line-height:1}
.um-card .x{font-size:10px;line-height:1.4}
.um-card .um-bts{display:flex;flex-direction:row;gap:6px;margin-top:2px}.um-card .um-bts span{font-size:10px;font-weight:700;border-radius:99px;padding:5px 14px}
.um-card .tg{position:absolute;right:14px;top:12px;font-size:9px;font-weight:600;opacity:.7}
.um-pairs{display:grid;grid-template-columns:repeat(9,1fr);gap:8px}
.um-pr{border-radius:12px;height:76px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;font-style:italic;position:relative}
.um-pairs div span{display:block;font-size:9px;color:#5B6070;margin-top:4px;line-height:1.3}.um-pairs div span b{display:block}
.um-prop{display:flex;height:26px;border-radius:8px;overflow:hidden;margin:4px 0 4px;box-shadow:inset 0 0 0 1px #DCDDE5}
.um-lg{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}
.um-lg .bx{border-radius:12px;height:96px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.um-lg span{display:block;font-size:9.5px;color:#5B6070;margin-top:4px;line-height:1.3}
.um-cols{display:grid;gap:18px;flex:1}
.um-box{background:#fff;border:1px solid #DCDDE5;border-radius:14px;padding:12px 14px}
.dark .um-box{background:#0F0F13;border-color:#1E1E25}
.um-cap{font-size:11.5px;line-height:1.5;color:#2A2D38;border-left:3px solid #6539CB;padding:2px 0 2px 10px;margin-bottom:9px}
.um-cap b{display:block;font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:#7C8090;margin-bottom:2px}
.um-mc{width:100%;border-collapse:collapse;font-size:11px}.um-mc td{padding:8px 4px;border-bottom:1px solid #E6E7EE;vertical-align:top}
.um-mc td:first-child{color:#7C8090;font-weight:600;width:96px}.um-mc td b{color:#05070F}
.um-wd{display:flex;flex-wrap:wrap;gap:6px}.um-wd span{font-size:10px;font-weight:700;border-radius:99px;padding:4px 11px}
.um-phone{border-radius:30px;background:#1A1A1F;padding:7px;box-shadow:0 14px 30px rgba(0,0,0,.25),inset 0 0 0 1px #2A2A33;flex-shrink:0}
.um-scr{width:100%;height:100%;border-radius:24px;overflow:hidden;position:relative;color:#fff}
.um-sb{display:flex;justify-content:space-between;font-size:8px;font-weight:700;padding:8px 14px 0}
.um-home{display:grid;grid-template-columns:repeat(4,1fr);gap:12px 8px;padding:16px 12px}
.um-home div{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:7px;color:#fff}
.um-home i{width:36px;height:36px;border-radius:9px;display:block}
.um-push{background:rgba(245,245,250,.86);color:#05070F;border-radius:14px;padding:8px 10px;display:flex;gap:8px;align-items:flex-start;margin:0 8px 6px}
.um-push b{font-size:8.5px;display:block}.um-push span{font-size:8.5px;line-height:1.3;display:block}.um-push small{font-size:7px;color:#7C8090;margin-left:auto}
.um-wa{background:#0B141A;border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:8px}
.um-bub{background:#005C4B;color:#E9EDEF;border-radius:10px;padding:5px;max-width:250px;align-self:flex-end;font-size:10px}
.um-bub.in{background:#202C33;align-self:flex-start}
.um-lp{background:#0A3D33;border-radius:7px;overflow:hidden;margin-bottom:5px}
.um-lp div{height:110px;background-size:cover;background-position:center 30%}
.um-lp p{padding:6px 8px;font-size:9.5px;line-height:1.35}.um-lp p b{display:block;font-size:10.5px}.um-lp p span{color:#8696A0}
.um-ig{padding:10px 12px;font-size:8.5px}
.um-ig .hd{display:flex;align-items:center;gap:12px}.um-ig .hd .st{display:flex;gap:12px;text-align:center}.um-ig .hd .st b{display:block;font-size:10px}
.um-hl{display:flex;gap:9px;margin:10px 0}.um-hl div{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:7px}
.um-hl i{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 1.5px #000,0 0 0 2.5px #3A3D48}
.um-gr{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin:0 -12px}
.um-gr div{aspect-ratio:1/1;background-size:cover;background-position:center 25%}
.um-car{display:flex;gap:10px}
.um-car>div{width:184px;height:184px;border-radius:10px;position:relative;overflow:hidden;flex-shrink:0}
.um-car .t{position:absolute;color:#fff;font-weight:800;font-style:italic;letter-spacing:-.03em;line-height:.95;z-index:2}
.um-car .t b{color:#00E5E5}
.um-car .pg{position:absolute;right:10px;top:10px;font-size:8px;font-weight:700;z-index:2;opacity:.75}
.um-br{border-radius:12px;overflow:hidden;box-shadow:0 12px 30px rgba(5,7,15,.14);background:#fff}
.um-bt{height:24px;background:#ECECF3;display:flex;align-items:center;gap:5px;padding:0 10px}.um-bt i{width:7px;height:7px;border-radius:50%;background:#C9CAD6;display:block}
.um-bt span{margin-left:10px;background:#fff;border-radius:6px;font-size:8px;color:#5B6070;padding:2px 10px;flex:1;max-width:260px}
.um-nav{display:flex;align-items:center;gap:18px;padding:10px 22px;font-size:9px;font-weight:600}
.um-nav .bt{margin-left:auto;background:PURPLE;color:#fff;border-radius:99px;padding:5px 14px}
.um-store{display:inline-flex;align-items:center;gap:6px;background:#fff;color:#05070F;border-radius:9px;padding:6px 11px;font-size:8.5px;font-weight:700}
.um-store.k{background:#000;color:#fff;box-shadow:inset 0 0 0 1px #3A3D48}
.um-mail{background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 10px 26px rgba(5,7,15,.12);font-size:10px;color:#2A2D38}
.um-mail .mh{padding:9px 14px;border-bottom:1px solid #ECECF3;font-size:9px;color:#5B6070}.um-mail .mh b{color:#05070F}
.um-chk{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:14px 22px;font-size:11.5px;align-content:start}
.um-chk li{display:flex;gap:9px;align-items:flex-start;line-height:1.35}.um-chk li:before{content:"✓";flex-shrink:0;width:18px;height:18px;border-radius:50%;background:PURPLE;color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center}
.um-files{font-size:10px;line-height:1.9;color:#D7D9E2}.um-files code{background:#1E1E25;color:#00E5E5}
"""


# ---------------------------------------------------------------- páginas novas
def P(cls, h2, lead, body):
    return f'<section class="page {cls}"><div class="eyebrow">@@E@@</div><h2>{h2}</h2><p class="um-lead">{lead}</p>{body}<div class="foot"><span>@@F@@</span><span>@@N@@</span></div></section>'


def pg_superficies():
    rows = ""
    for r, nome in ROLES:
        rows += f"<tr><td>{nome}</td>" + "".join(
            f'<td><i style="background:{SURF[k][r]}"></i><code>{"degradê roxo" if SURF[k][r] == PURPLE else ("ciano → azul" if "3B82F6" in SURF[k][r] else SURF[k][r])}</code></td>' for k in SURF) + "</tr>"
    cards = ""
    for k, s in SURF.items():
        lk = {"roxo": "v4-lockup-purple.svg", "preto": "v4-lockup-dark.svg", "branco": "v4-lockup-light.svg"}[k]
        bd = "box-shadow:inset 0 0 0 1px #DCDDE5;" if k == "branco" else ""
        cards += (f'<div class="um-card" style="background:{s["superficie"]};color:{s["texto"]};{bd}"><span class="tg">{s["nome"]}</span>{I(lk, h=20)}'
                  f'<div class="t" style="color:{s["titulo"]}">Sexta tem <span style="color:{s["destaque"]}">rolê.</span></div>'
                  f'<div class="x" style="color:{s["apoio"]}">{s["uso"]}</div>'
                  f'<div class="um-bts"><span style="background:{s["botao"]};color:{s["botao-texto"]}">Bora</span><span style="box-shadow:inset 0 0 0 1.5px {s["secundario"]};color:{s["titulo"]}">Ver quem vai</span>'
                  f'<span style="background:{s["chip"]};color:{s["titulo"]};font-weight:600">sex · 22h</span></div></div>')
    return P("light", "Três superfícies", "Cada superfície tem a cor certa para cada papel. É a mesma tabela do <code>tokens.css</code> e do app: troque o <code>data-tema</code> e a peça muda junto.",
             f'<div class="um-surf"><table class="um-tb"><tr><th>Papel</th><th>Roxo</th><th>Preto</th><th>Branco</th></tr>{rows}</table><div class="um-sc">{cards}</div></div>')


def pg_combinacoes():
    pairs = [("#FFFFFF", "#6539CB", "Branco no roxo", True), ("#00E5E5", PURPLE, "Ciano no roxo · só título", None), ("#FFFFFF", "#000000", "Branco no preto", True),
             ("#00E5E5", "#000000", "Ciano no preto", True), ("#6539CB", "#FFFFFF", "Roxo no branco", True), ("#05070F", "#FFFFFF", "Ink no branco", True),
             ("#9E19E9", "#000000", "Roxo no preto", False), ("#00E5E5", "#FFFFFF", "Ciano no branco", False), ("#000000", "#6539CB", "Preto no roxo", False)]
    ph = ""
    for fg, bgc, nome, ok in pairs:
        ratio = contrast(fg, bgc if bgc.startswith("#") else "#6539CB")
        st = {True: '<b class="ok">ok</b>', None: '<b style="color:#B7791F">título ≥ 24 px</b>', False: '<b class="no">não</b>'}[ok]
        bd = "box-shadow:inset 0 0 0 1px #DCDDE5;" if bgc == "#FFFFFF" else ""
        ph += f'<div><div class="um-pr" style="background:{bgc};color:{fg};{bd}">Aa</div><span>{st}{nome} · {ratio:.1f}:1</span></div>'
    logos = [("background:" + PURPLE, I("v4-lockup-purple.svg", h=24), "Roxo: Rolê branco + Go ciano · principal"),
             ("background:#000", I("v4-lockup-dark.svg", h=24), "Preto: Rolê branco + Go ciano → azul"),
             ("background:#fff;box-shadow:inset 0 0 0 1px #DCDDE5", I("v4-lockup-light.svg", h=24), "Branco: Rolê ink + Go roxo"),
             (f"background:url({F('club-luzes-azuis', 500)}) center 30%/cover", f'<div style="position:absolute;inset:0;background:{GRADB}"></div><div style="position:absolute;bottom:12px">{I("v4-lockup-purple.svg", h=20)}</div>', "Foto: sempre sobre o degradê"),
             ("background:" + PURPLE, I("v4-go-white.svg", h=46), "Símbolo branco no roxo (ícone)"),
             ("background:#000", I("v4-go-dark.svg", h=46), "Símbolo ciano → azul no preto")]
    lg = "".join(f'<div><div class="bx" style="{s}">{v}</div><span>{t}</span></div>' for s, v, t in logos)
    prop = f'<div class="um-prop"><i style="width:48%;background:{PURPLE}"></i><i style="width:30%;background:#000"></i><i style="width:16%;background:#fff"></i><i style="width:6%;background:#00E5E5"></i></div>'
    return P("light", "Combinações", "As combinações aprovadas. Em dúvida: roxo com branco, ou preto com branco e um detalhe ciano.",
             f'<div class="sub">Marca em cada fundo</div><div class="um-lg">{lg}</div>'
             f'<div class="sub" style="margin-top:6px">Texto em cada fundo (contraste WCAG)</div><div class="um-pairs">{ph}</div>'
             f'<div class="sub" style="margin-top:6px">Proporção numa peça típica</div>{prop}<p class="note" style="margin-top:0">Roxo 48 · preto 30 · branco 16 · ciano 6. Ciano é tempero: no Go, numa palavra do título, num chip. Magenta, verde e amarelo só como cor de categoria, nunca de marca.</p>')


def pg_microcopy():
    caps = [("Post de sexta", "Sexta tem rolê. 🪩 Abre o app, vê quem vai e chama a galera. Link na bio."),
            ("Evento", "Baile da Laje, sáb 22h, Vila Madalena. 48 pessoas já marcaram. Bora?"),
            ("Repost da galera", "A @bia.lopes tava no rolê ✨ Marca a gente com #VivaORolê que a gente reposta."),
            ("Segurança", "Rolê bom é rolê seguro. Compartilha tua localização com as amigas direto do app.")]
    cp = "".join(f'<div class="um-cap"><b>{t}</b>{x}</div>' for t, x in caps)
    mc = [("Botão principal", "<b>Bora</b> · <b>Tô dentro</b> · <b>Chamar a galera</b>"), ("Botão secundário", "Ver quem vai · Talvez · Agora não"),
          ("Push", "<b>A Bia vai no Baile da Laje.</b> Bora junto?"), ("Lista vazia", "Nenhum rolê por aqui ainda. Que tal criar um?"),
          ("Erro", "Ops, o rolê não carregou. Tenta de novo?"), ("Confirmação", "Fechou! Você tá na lista do Baile da Laje."),
          ("Onboarding", "Os rolês da sua cidade, num swipe."), ("Convite", "Bora comigo no Baile da Laje? Vê quem vai: rolego.com.br/r/laje")]
    mct = "".join(f"<tr><td>{a}</td><td>{b}</td></tr>" for a, b in mc)
    yes = ["rolê", "bora", "a galera", "colar", "fechou", "tô dentro", "chama as amigas", "quem vai?", "partiu"]
    no = ["evento imperdível", "experiência única", "clique aqui", "balada top", "mano/véi forçado", "palavrão", "CAIXA ALTA gritando", "mais de 2 emojis"]
    wd = lambda ws, c, b: "".join(f'<span style="background:{b};color:{c}">{w}</span>' for w in ws)
    return P("light", "Legendas e microcopy", "O mesmo jeito de falar no post, no app e no push: a amiga que sempre sabe onde é o rolê.",
             f'<div class="um-cols" style="grid-template-columns:1fr 1.1fr 0.8fr"><div><div class="sub">Legendas</div>{cp}</div>'
             f'<div><div class="sub">Microcopy do app</div><table class="um-mc">{mct}</table></div>'
             f'<div><div class="sub">Palavras da casa</div><div class="um-wd">{wd(yes, "#fff", PURPLE)}</div>'
             f'<div class="sub" style="margin-top:14px">Fica de fora</div><div class="um-wd">{wd(no, "#5B6070", "#E6E7EE")}</div>'
             f'<p class="note"><b>Regras:</b> frase curta, verbo no começo, plural (“a galera”). Um emoji por frase no máx. Título com no máx. 6 palavras e uma em destaque.</p></div></div>')


def pg_icone():
    tiles = ["#2B2D36", "#3B3F4C", "#22252E", "ICON", "#30333D", "#1F2129", "#454956", "#2A2C35", "#353844", "#262830", "#3E4250", "#2E3039"]
    names = ["Fotos", "Mapas", "Música", "RolêGo", "Notas", "Câmera", "Clima", "Banco", "Uber", "Chat", "Agenda", "Ajustes"]
    hm = "".join(f'<div>{"<i style=background:url(" + uri("v4-icon-app.svg") + ")center/cover></i>" if t == "ICON" else f"<i style=background:{t}></i>"}{n}</div>' for t, n in zip(tiles, names))
    home = phone(f'<div class="um-sb"><span>21:47</span><span>●●● 5G</span></div><div class="um-home">{hm}</div>', bg=f"url({F('neon-hexagono-roxo', 500)}) center/cover")
    pushes = [("A Bia vai no Baile da Laje.", "Bora junto? 12 amigas já vão.", "agora"), ("Sexta tem rolê. 🪩", "5 rolês perto de você hoje.", "18:00"), ("Fechou!", "Seu ingresso do Festival tá no app.", "ontem")]
    ps = "".join(f'<div class="um-push">{I("v4-icon-app.svg", h=24)}<div><b>{a}</b><span>{b}</span></div><small>{c}</small></div>' for a, b, c in pushes)
    lock = phone(f'<div style="text-align:center;padding-top:34px"><div style="font-size:11px;font-weight:600">sexta, 14 de novembro</div><div style="font-size:52px;font-weight:300;letter-spacing:-.03em">21:47</div></div><div style="position:absolute;left:0;right:0;bottom:22px">{ps}</div>', bg=f"linear-gradient(180deg,rgba(0,0,0,.25),rgba(0,0,0,.55)),url({F('club-luzes-azuis', 500)}) center/cover")
    sizes = "".join(f'<div style="display:flex;flex-direction:column;align-items:center;gap:5px">{I(f, h=h)}<span style="font-size:9px;color:#9CA3AF">{t}</span></div>' for f, h, t in
                    (("v4-icon-app.svg", 96, "App Store 1024"), ("v4-icon-app.svg", 64, "iPhone 180"), ("v4-icon-app-dark.svg", 64, "modo escuro"), ("v4-icon-avatar.svg", 44, "avatar"), ("v4-icon-fav.svg", 24, "favicon 32"), ("v4-icon-fav.svg", 16, "16")))
    return P("dark", "Ícone na tela e notificações", "No ícone vai só o Go, branco no roxo. No push, o nome de quem vai primeiro: é isso que faz abrir.",
             f'<div style="display:flex;gap:26px;align-items:flex-start">{home}{lock}<div style="flex:1;display:flex;flex-direction:column;gap:16px">'
             f'<div class="um-box"><div class="sub" style="color:#9CA3AF">Tamanhos</div><div style="display:flex;gap:16px;align-items:flex-end">{sizes}</div></div>'
             f'<div class="um-box"><div class="sub" style="color:#9CA3AF">Push</div><ul class="rl" style="color:#D7D9E2"><li>Título com gente ou com o rolê, nunca com a marca (“A Bia vai…”, não “RolêGo informa”).</li>'
             f'<li>No máx. 1 push por dia; sexta 18h é o horário da marca.</li><li>Um emoji no máx., no fim do título.</li><li>Badge vermelho do sistema, nunca um ponto ciano inventado.</li></ul></div></div></div>')


def pg_link():
    wa = (f'<div class="um-wa"><div class="um-bub in">gente, sábado?? 👀</div>'
          f'<div class="um-bub"><div class="um-lp"><div style="background-image:url({F("show-de-costas", 600)})"></div><p><b>Baile da Laje · sáb 22h</b>Vila Madalena · 48 vão · R$ 40<br><span>rolego.com.br</span></p></div>bora comigo? rolego.com.br/r/laje</div>'
          f'<div class="um-bub in">TÔ DENTRO 🔥</div><div class="um-bub in">chama a Ju também</div></div>')
    story = (f'<div style="width:190px;height:338px;border-radius:16px;position:relative;overflow:hidden;background:url({F("brinde-rooftop", 600)}) center 20%/cover">'
             f'<div style="position:absolute;inset:0;background:{GRADB}"></div>'
             f'<div style="position:absolute;left:14px;right:14px;bottom:16px;background:#fff;border-radius:14px;padding:10px;color:#05070F;transform:rotate(-2deg)">'
             f'<div style="display:flex;justify-content:space-between;align-items:center">{I("v4-lockup-light.svg", h=11)}<span style="font-size:8px;color:#5B6070">sáb 22h</span></div>'
             f'<div style="font-size:16px;font-weight:800;font-style:italic;margin:6px 0 2px">Bora comigo?</div><div style="font-size:9px;color:#5B6070">Baile da Laje · 48 vão</div>'
             f'<div style="margin-top:7px;background:{PURPLE};color:#fff;border-radius:99px;font-size:9px;font-weight:800;text-align:center;padding:5px">Ver o rolê ↑</div></div></div>')
    card = (f'<div style="width:250px;border-radius:16px;overflow:hidden;background:#000;color:#fff"><div style="height:120px;background:url({F("galera-brinde-azul", 600)}) center 40%/cover;position:relative">'
            f'<span style="position:absolute;left:10px;top:10px;background:#00E5E5;color:#000;font-size:9px;font-weight:800;border-radius:99px;padding:3px 9px">SÁB · 22h</span></div>'
            f'<div style="padding:12px 14px;display:flex;gap:12px;align-items:center"><div style="flex:1"><div style="font-size:17px;font-weight:800;font-style:italic">Baile da Laje</div>'
            f'<div style="font-size:9px;color:#9CA3AF;margin-top:2px">Vila Madalena · 1,2 km</div><div class="fx-av" style="position:static;margin-top:8px">{AV("bar-loira", "sorriso-neon", "risada-festa")}48 vão</div></div>'
            f'<div style="background:#fff;border-radius:8px;padding:5px">{qr(size=66)}</div></div>'
            f'<div style="border-top:1px dashed #2A2D38;padding:8px 14px;display:flex;justify-content:space-between;align-items:center">{I("v4-lockup-dark.svg", h=12)}<span style="font-size:8.5px;color:#9CA3AF">rolego.com.br/r/laje</span></div></div>')
    return P("light", "Compartilhar o rolê", "O convite é o motor da marca: cada rolê vira um link, um story e um card com QR. Sempre com foto, data e quem vai.",
             f'<div style="display:flex;gap:26px;align-items:flex-start"><div style="width:300px">{wa}<div class="sub" style="margin-top:8px">Prévia no WhatsApp</div></div>'
             f'<div>{story}<div class="sub" style="margin-top:8px">Sticker de convite</div></div><div>{card}<div class="sub" style="margin-top:8px">Card com QR (impresso e tela)</div></div>'
             f'<div style="flex:1"><ul class="rl"><li>Link curto: <code>rolego.com.br/r/nome-do-rolê</code>.</li><li>Prévia (og:image 1200 × 630): foto do rolê + nome + data. O logo vem pela URL, não em cima da foto.</li>'
             f'<li>Texto do convite começa com “Bora”.</li><li>QR sempre em placa branca, com 4 módulos de respiro.</li><li>Mostrar quem vai (avatares) aumenta a confirmação: nunca esconder.</li></ul></div></div>')


def pg_perfil():
    tiles = [("img", uri("posts/01-sexta-tem-role.png")), ("ph", "neon-hexagono-roxo"), ("img", uri("posts/05-frase.png")), ("ph", "risada-festa"),
             ("img", uri("posts/09-contagem.png")), ("ph", "roda-gigante-ciano"), ("img", uri("posts/03-top5-semana.png")), ("ph", "confete-festa"), ("img", uri("posts/06-feature-match.png"))]
    gr = "".join(f'<div style="background-image:url({v if k == "img" else F(v, 300)})"></div>' for k, v in tiles)
    hls = [("Rolês", "background:" + PURPLE, I("v4-go-white.svg", h=18)), ("Como usar", "background:#000", I("v4-go-dark.svg", h=18)), ("Galera", f"background:url({F('confete-festa', 200)}) center/cover", ""),
           ("Segurança", "background:#000", icon("segurança", 18)), ("Parceiros", "background:#fff", I("v4-go-light.svg", h=18))]
    hl = "".join(f'<div><i style="{s}">{v}</i>{t}</div>' for t, s, v in hls)
    ig = phone(f'<div class="um-sb"><span>21:47</span><span>●●●</span></div><div class="um-ig"><div style="font-weight:700;font-size:10px;margin-bottom:8px">rolego ✓</div>'
               f'<div class="hd">{I("v4-icon-avatar.svg", h=52)}<div class="st"><div><b>214</b>posts</div><div><b>86,4 mil</b>seguidores</div><div><b>312</b>seguindo</div></div></div>'
               f'<div style="margin-top:8px;line-height:1.4"><b>RolêGo</b><br>Os rolês da sua cidade, num swipe. 🪩<br>Viva o rolê. #VivaORolê<br><span style="color:#00E5E5">rolego.com.br</span></div>'
               f'<div class="um-hl">{hl}</div><div class="um-gr">{gr}</div></div>', w=230, h=470)
    av = "".join(f'<div style="display:flex;flex-direction:column;align-items:center;gap:6px">{v}<span style="font-size:9.5px;color:#9CA3AF">{t}</span></div>' for v, t in
                 ((I("v4-icon-avatar.svg", h=80, style="border-radius:50%"), "Avatar · todas as redes"), (f'<div style="width:80px;height:80px;border-radius:50%;background:#000;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px #2A2D38">{I("v4-go-dark.svg", h=40)}</div>', "Avatar alternativo (eventos)")))
    covers = "".join(f'<div style="display:flex;flex-direction:column;align-items:center;gap:5px"><i style="width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;{s}">{v}</i><span style="font-size:9px;color:#9CA3AF">{t}</span></div>' for t, s, v in hls)
    return P("dark", "Perfil e destaques", "Instagram, TikTok e X com o mesmo avatar e a mesma bio. Destaques alternam roxo, preto e foto.",
             f'<div style="display:flex;gap:30px;align-items:flex-start">{ig}<div style="flex:1;display:flex;flex-direction:column;gap:14px">'
             f'<div class="um-box"><div class="sub" style="color:#9CA3AF">Avatar (a rede corta em círculo: Go a 60%)</div><div style="display:flex;gap:28px">{av}</div></div>'
             f'<div class="um-box"><div class="sub" style="color:#9CA3AF">Capas de destaque</div><div style="display:flex;gap:18px">{covers}</div></div>'
             f'<div class="um-box"><div class="sub" style="color:#9CA3AF">Bio (3 linhas)</div><p style="font-size:11px;line-height:1.6;color:#D7D9E2">1 · promessa: <b style="color:#fff">Os rolês da sua cidade, num swipe.</b><br>2 · slogan + hashtag: <b style="color:#fff">Viva o rolê. #VivaORolê</b><br>3 · link: <b style="color:#00E5E5">rolego.com.br</b> (sem encurtador)</p></div>'
             f'<p class="note" style="color:#9CA3AF">Grid: alternar post de marca (roxo/preto) e foto da galera. Nunca duas peças da mesma cor lado a lado.</p></div></div>')


def pg_carrossel():
    roles = [("Baile da Laje", "Vila Madalena · sáb 22h", "show-de-costas"), ("Rooftop Augusta", "Consolação · sex 20h", "brinde-rooftop"), ("Festival Neon", "Barra Funda · sáb 16h", "roda-gigante-ciano")]
    cards = (f'<div style="background:url({F("neon-hexagono-roxo", 500)}) center 20%/cover"><div style="position:absolute;inset:0;background:{GRADB}"></div><span class="pg">1/5</span>'
             f'<div class="t" style="left:14px;bottom:36px;font-size:28px">5 rolês<br>pra esse <b>fds</b></div><div style="position:absolute;left:14px;bottom:14px;z-index:2;font-size:9px;font-weight:700;color:#fff">arrasta →</div></div>')
    for i, (n, d, p) in enumerate(roles, 2):
        cards += (f'<div style="background:#000"><div style="position:absolute;left:0;right:0;top:0;height:58%;background:url({F(p, 500)}) center 35%/cover"></div>'
                  f'<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 30%,#000 62%)"></div><span class="pg">{i}/5</span>'
                  f'<div class="t" style="left:14px;top:12px;font-size:34px;color:#00E5E5">{i - 1}</div><div class="t" style="left:14px;bottom:30px;font-size:19px">{n}</div>'
                  f'<div style="position:absolute;left:14px;bottom:14px;z-index:2;font-size:8.5px;color:#9CA3AF">{d}</div></div>')
    cards += (f'<div style="background:{PURPLE}"><span class="pg">5/5</span><div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;z-index:2">'
              f'{I("v4-go-white.svg", h=44)}<div class="t" style="position:static;font-size:20px;text-align:center">Os outros 2<br>tão no <b>app.</b></div>'
              f'<span style="background:#fff;color:#6539CB;font-size:9px;font-weight:800;border-radius:99px;padding:5px 14px">Link na bio</span></div></div>')
    return P("mist", "Carrossel", "Lista da semana em cinco cards: capa com foto, um rolê por card, fecho no roxo levando pro app.",
             f'<div class="um-car">{cards}</div><div class="um-cols" style="grid-template-columns:1fr 1fr 1fr;margin-top:8px">'
             f'<div><div class="sub">Capa</div><ul class="rl"><li>Foto da galera + degradê roxo.</li><li>Título com número: “5 rolês…”, “3 jeitos…”.</li><li>“arrasta →” no canto de baixo.</li></ul></div>'
             f'<div><div class="sub">Meio</div><ul class="rl"><li>Preto, foto em cima, número grande em ciano.</li><li>Nome do rolê + bairro + dia e hora.</li><li>Um rolê por card, sempre.</li></ul></div>'
             f'<div><div class="sub">Fecho</div><ul class="rl"><li>Roxo com Go branco.</li><li>Uma ação: “link na bio” ou “salva pra sexta”.</li><li>Numeração 1/5 no canto, 60% de opacidade.</li></ul></div></div>')


def pg_landing():
    hero = (f'<div style="background:#000;color:#fff;display:grid;grid-template-columns:1.1fr 1fr;gap:20px;padding:26px 30px 0;height:260px;overflow:hidden">'
            f'<div><span class="fx-chipw" style="position:static;display:inline-block;background:#1E1E25;color:#00E5E5">São Paulo · 214 rolês hoje</span>'
            f'<div style="font-size:40px;font-weight:800;font-style:italic;letter-spacing:-.04em;line-height:.95;margin-top:12px">Os rolês da sua cidade, num <span style="color:#00E5E5">swipe.</span></div>'
            f'<p style="font-size:10.5px;color:#9CA3AF;margin-top:10px;max-width:320px;line-height:1.5">Festas, bares, shows e eventos por perto. Vê quem vai, chama a galera e decide junto.</p>'
            f'<div style="display:flex;gap:8px;margin-top:14px"><span class="um-store">App Store</span><span class="um-store k">Google Play</span></div></div>'
            f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div style="border-radius:14px 14px 0 0;background:url({F("neon-hexagono-roxo", 500)}) center 20%/cover"></div>'
            f'<div style="border-radius:14px 14px 0 0;margin-top:30px;background:url({F("risada-festa", 500)}) center 20%/cover"></div></div></div>')
    how = "".join(f'<div style="flex:1"><div style="font-size:24px;font-weight:800;font-style:italic;color:#6539CB">{n}</div><b style="font-size:12px">{t}</b><p style="font-size:9.5px;color:#5B6070;line-height:1.4">{d}</p></div>'
                  for n, t, d in (("1", "Swipe nos rolês", "O que tem perto, hoje e no fds."), ("2", "Vê quem vai", "Amigas e amigos de amigos."), ("3", "Decide no grupo", "Match de grupo, sem enquete no zap."), ("4", "Compra e vai", "Ingresso e lista no app.")))
    site = (f'<div class="um-br" style="width:700px"><div class="um-bt"><i></i><i></i><i></i><span>rolego.com.br</span></div>'
            f'<div class="um-nav" style="background:#000;color:#fff">{I("v4-lockup-dark.svg", h=16)}<span style="opacity:.7">Como funciona</span><span style="opacity:.7">Pra bares e casas</span><span style="opacity:.7">Segurança</span><span class="bt">Baixar o app</span></div>'
            f'{hero}<div style="padding:16px 30px;display:flex;gap:20px">{how}</div>'
            f'<div style="background:{PURPLE};color:#fff;padding:14px 30px;display:flex;align-items:center;justify-content:space-between"><span style="font-size:20px;font-weight:800;font-style:italic">Viva o <span style="color:#00E5E5">rolê.</span></span><span class="um-store">Baixar grátis</span></div></div>')
    return P("light", "Landing no desktop", "Hero no preto com foto da galera, como funciona no branco, fecho no roxo. Uma ação só: baixar o app.",
             f'<div style="display:flex;gap:24px;align-items:flex-start">{site}<div style="flex:1"><ul class="rl"><li>Hero: promessa + contador vivo (“214 rolês hoje”).</li><li>Foto à direita, cortada embaixo pela dobra.</li>'
             f'<li>Botão de loja: branco no preto, preto com contorno ao lado.</li><li>“Como funciona” em 4 passos numerados em roxo.</li><li>Faixa final roxa com o slogan.</li><li>Página de parceiro (“Pra bares e casas”) no branco.</li></ul></div></div>')


def pg_landing_mobile():
    s1 = phone(f'<div class="um-sb"><span>9:41</span><span>●●●</span></div><div style="padding:10px 14px">{I("v4-lockup-dark.svg", h=14)}</div>'
               f'<div style="height:190px;margin:0 12px;border-radius:14px;background:url({F("roda-gigante-ciano", 500)}) center 20%/cover"></div>'
               f'<div style="padding:12px 14px"><div style="font-size:22px;font-weight:800;font-style:italic;line-height:.95;letter-spacing:-.03em">Os rolês da sua cidade, num <span style="color:#00E5E5">swipe.</span></div>'
               f'<div style="margin-top:12px;background:{PURPLE};border-radius:99px;text-align:center;font-size:10px;font-weight:800;padding:8px">Baixar o app</div></div>')
    steps = "".join(f'<div style="display:flex;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid #ECECF3"><b style="font-size:20px;font-style:italic;color:#6539CB;width:18px">{n}</b><div><b style="font-size:10.5px">{t}</b><div style="font-size:8.5px;color:#5B6070">{d}</div></div></div>'
                    for n, t, d in (("1", "Swipe nos rolês", "O que tem perto, hoje."), ("2", "Vê quem vai", "Amigas e amigos de amigos."), ("3", "Decide no grupo", "Match de grupo."), ("4", "Compra e vai", "Ingresso no app.")))
    s2 = phone(f'<div class="um-sb" style="color:#05070F"><span>9:41</span><span>●●●</span></div><div style="padding:14px;color:#05070F"><div style="font-size:9px;font-weight:700;color:#6539CB;letter-spacing:.06em">COMO FUNCIONA</div>'
               f'<div style="font-size:20px;font-weight:800;font-style:italic;margin:4px 0 6px;letter-spacing:-.03em">Do swipe ao rolê</div>{steps}</div>', bg="#fff")
    s3 = phone(f'<div class="um-sb"><span>9:41</span><span>●●●</span></div><div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:20px;text-align:center">'
               f'{I("v4-stacked-purple.svg", h=110)}<div style="font-size:12px;opacity:.85">Grátis no iPhone e no Android.</div><span class="um-store">App Store</span><span class="um-store k" style="box-shadow:none;background:#05070F">Google Play</span></div>', bg=PURPLE)
    return P("dark", "Landing no celular", "A mesma página em três telas: promessa no preto, como funciona no branco, download no roxo.",
             f'<div style="display:flex;gap:30px;justify-content:center;align-items:flex-start;margin-top:6px">{s1}{s2}{s3}</div>')


def pg_email():
    tr = (f'<div class="um-mail" style="width:330px"><div class="mh"><b>RolêGo</b> &lt;oi@rolego.com.br&gt;<br>Fechou! Seu ingresso do Baile da Laje 🎟️</div>'
          f'<div style="padding:16px 18px">{I("v4-lockup-light.svg", h=16)}<div style="font-size:22px;font-weight:800;font-style:italic;margin:14px 0 4px;color:#05070F;letter-spacing:-.03em">Fechou, Ana!</div>'
          f'<p style="line-height:1.5">Você tá na lista do <b>Baile da Laje</b>. Mostra o QR na entrada.</p>'
          f'<div style="display:flex;gap:12px;align-items:center;margin:12px 0;padding:10px;border:1px solid #ECECF3;border-radius:12px"><div style="background:#fff">{qr(size=74, seed=3)}</div>'
          f'<div style="font-size:9.5px;line-height:1.5"><b style="color:#05070F">Sáb, 15/11 · 22h</b><br>Rua Girassol, 210 · Vila Madalena<br>Pista · R$ 40</div></div>'
          f'<div style="background:{PURPLE};color:#fff;border-radius:99px;text-align:center;font-weight:800;padding:8px">Ver no app</div>'
          f'<p style="font-size:8.5px;color:#7C8090;margin-top:12px">Dúvida? Responde este e-mail. · rolego.com.br</p></div></div>')
    items = "".join(f'<div style="display:flex;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid #ECECF3"><div style="width:52px;height:52px;border-radius:10px;background:url({F(p, 200)}) center 25%/cover;flex-shrink:0"></div>'
                    f'<div><b style="color:#05070F;font-size:10.5px">{n}</b><div style="font-size:9px;color:#5B6070">{d}</div></div><span style="margin-left:auto;font-size:9px;font-weight:700;color:#6539CB">Bora →</span></div>'
                    for n, d, p in (("Baile da Laje", "sáb 22h · Vila Madalena", "show-de-costas"), ("Rooftop Augusta", "sex 20h · Consolação", "brinde-rooftop"), ("Festival Neon", "sáb 16h · Barra Funda", "festival-sorriso")))
    nl = (f'<div class="um-mail" style="width:330px"><div class="mh"><b>RolêGo</b> &lt;oi@rolego.com.br&gt;<br>Sexta tem rolê: os 3 mais pedidos do fds 🪩</div>'
          f'<div style="height:130px;position:relative;background:url({F("neon-rosa-azul", 600)}) center 22%/cover"><div style="position:absolute;inset:0;background:{GRADB}"></div>'
          f'<div style="position:absolute;left:16px;bottom:14px;color:#fff;font-size:24px;font-weight:800;font-style:italic;letter-spacing:-.03em;line-height:.95">Sexta tem<br><span style="color:#00E5E5">rolê.</span></div>'
          f'<div style="position:absolute;right:14px;top:12px">{I("v4-go-white.svg", h=20)}</div></div><div style="padding:8px 18px 14px">{items}</div>'
          f'<div style="background:#000;color:#9CA3AF;font-size:8.5px;padding:10px 18px;display:flex;justify-content:space-between;align-items:center">{I("v4-lockup-dark.svg", h=11)}<span>Sair da lista · rolego.com.br</span></div></div>')
    return P("mist", "E-mail", "Um assunto por e-mail. Transacional no branco; novidade com foto e degradê no topo.",
             f'<div style="display:flex;gap:26px;align-items:flex-start">{tr}{nl}<div style="flex:1"><ul class="rl"><li>Largura 600 px; topo com lockup no branco ou foto + degradê.</li>'
             f'<li>Assunto com no máx. 45 caracteres e um emoji.</li><li>Um botão por e-mail, roxo, em pílula.</li><li>Rodapé preto com lockup do escuro e “sair da lista”.</li><li>QR do ingresso sempre em fundo branco.</li><li>Texto em Poppins (fallback: Arial).</li></ul></div></div>')


def pg_parceiro():
    door = (f'<div style="width:180px;height:180px;border-radius:50%;background:{PURPLE};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;box-shadow:0 10px 24px rgba(69,46,255,.35)">'
            f'{I("v4-go-white.svg", h=50)}<div style="color:#fff;font-size:18px;font-weight:800;font-style:italic;letter-spacing:-.02em">Tem <span style="color:#00E5E5">rolê</span> aqui</div>'
            f'<div style="color:rgba(255,255,255,.8);font-size:8px;font-weight:600">parceiro RolêGo</div></div>')
    stand = (f'<div style="width:170px;height:230px;border-radius:14px;background:#000;color:#fff;padding:16px;display:flex;flex-direction:column;align-items:center;gap:10px;box-shadow:0 10px 24px rgba(0,0,0,.25)">'
             f'{I("v4-lockup-dark.svg", h=16)}<div style="font-size:15px;font-weight:800;font-style:italic;text-align:center;line-height:1">Vê quem tá<br>aqui <span style="color:#00E5E5">hoje.</span></div>'
             f'<div style="background:#fff;border-radius:10px;padding:7px">{qr(size=80, seed=11)}</div><div style="font-size:8px;color:#9CA3AF">aponta a câmera</div></div>')
    menu = (f'<div style="width:190px;height:230px;border-radius:10px;background:#fff;box-shadow:0 0 0 1px #DCDDE5,0 10px 24px rgba(5,7,15,.1);padding:16px;color:#05070F;font-size:9.5px">'
            f'<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:14px;font-style:italic">Bar do Zé</b>{I("v4-go-light.svg", h=16)}</div>'
            f'<div style="height:1px;background:#ECECF3;margin:8px 0"></div>' + "".join(f'<div style="display:flex;justify-content:space-between;padding:4px 0"><span>{a}</span><b>{b}</b></div>' for a, b in (("Chopp", "12"), ("Caipirinha", "22"), ("Porção de fritas", "28"), ("Água", "5"))) +
            f'<div style="margin-top:12px;background:{PURPLE};color:#fff;border-radius:8px;padding:8px;font-size:9px;line-height:1.35"><b>Veio pelo RolêGo?</b><br>Mostra o app e ganha 10% no 1º pedido.</div></div>')
    post = f'<img src="{uri("posts/08-parceiro.png")}" style="width:200px;border-radius:10px;box-shadow:0 10px 24px rgba(5,7,15,.12)">'
    items = [(door, "Adesivo de porta", "Ø 20 cm, vinil. Na entrada, à altura dos olhos."), (stand, "Display de balcão", "A6 em pé, preto. QR leva pro rolê da casa."),
             (menu, "Selo no cardápio", "Caixa roxa no rodapé: oferta para quem vem pelo app."), (post, "Post de boas-vindas", "Template 08: fundo claro, logo do parceiro + Go.")]
    it = "".join(f'<div style="display:flex;flex-direction:column;align-items:center;gap:10px"><div style="height:240px;display:flex;align-items:center">{v}</div><div style="align-self:stretch"><b style="font-size:12px">{t}</b><p style="font-size:9.5px;color:#5B6070;line-height:1.4">{d}</p></div></div>' for v, t, d in items)
    return P("light", "Kit do parceiro", "O que vai para bares, casas e produtores que entram na RolêGo. A marca do parceiro manda; a RolêGo assina.",
             f'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px">{it}</div><p class="note"><b>Regra do parceiro:</b> o nome da casa vem primeiro e maior; a RolêGo entra com o Go ou o lockup pequeno. Nunca misturar o logo do parceiro com o Go numa peça só. Material impresso em roxo + branco, ou preto + branco.</p>')


def pg_checklist():
    chk = ["Rolê e Go em cores diferentes", "Acento no Rolê; o Go é sempre o símbolo, nunca texto", "Logo gomoso (cantos redondos), arquivos desta pasta",
           "Nenhuma letra roxa no preto", "No roxo, texto pequeno branco; ciano só em título e no Go", "Superfície certa e papéis do tokens.css",
           "Poppins; título em itálico ExtraBold", "Uma palavra em destaque, no máx.", "Foto: festa, luz roxa/azul/ciano, nada sensual",
           "De dia: laranja sol só no detalhe (< 10%), nunca no logo", "Degradê pôr do sol termina sempre no roxo",
           "Logo sobre o degradê, nunca sobre o rosto", "Área de proteção e tamanho mínimo", "Contraste AA no texto corrido", "Copy na voz da casa (“bora”, “a galera”)", "Foto de banco só em material interno"]
    files = [("manual-uso-marca-rolego.pdf", "este manual"), ("tokens.css · tokens.json", "cores por superfície (data-tema=roxo | preto | branco)"),
             ("../identidade-v5-gomosa/v4-*.svg", "logo gomoso: lockups, empilhado, símbolo, ícones"), ("../identidade-v5-gomosa/posts · stories", "templates em PNG"),
             ("../identidade-v5-gomosa/identidade-visual-rolego-v5.pdf", "manual de identidade (o porquê da marca)"), ("../fotos-festa/", "20 fotos de festa · Pexels, uso interno"), ("../fotos-sunset/", "fotos de praia e pôr do sol · Pexels, uso interno"),
             ("../identidade-v5-gomosa/motion/logo-reveal.html", "o pin cai (animação do logo)")]
    fl = "".join(f"<div><code>{a}</code> {b}</div>" for a, b in files)
    return P("dark", "Checklist e arquivos", "Antes de publicar qualquer peça, passe por aqui.",
             f'<div style="display:grid;grid-template-columns:1.3fr 1fr;gap:30px;flex:1"><ul class="um-chk">{"".join(f"<li>{c}</li>" for c in chk)}</ul>'
             f'<div style="display:flex;flex-direction:column;gap:16px"><div class="um-box"><div class="sub" style="color:#9CA3AF">Arquivos</div><div class="um-files">{fl}</div></div>'
             f'<div style="border-radius:16px;background:{PURPLE};padding:18px;display:flex;align-items:center;justify-content:space-between">{I("v4-lockup-purple.svg", h=30)}<span class="slo" style="font-size:20px;color:#fff">Viva o <b style="color:#00E5E5">rolê.</b></span></div></div></div>')


# ---------------------------------------------------------------- camada de dia (sol, pôr do sol, praia, bike)
exec(open(os.path.join(OUT, "_dia.py")).read())

# ---------------------------------------------------------------- estrutura (capítulos)
R = lambda t: ("v5", t)
N = lambda t, fn: ("new", t, fn)
CHAPTERS = [
    ("01", "Fundamentos", "Marca, cor, tipo e os elementos que montam todo o resto.", "dark", ("neon-hexagono-roxo", "risada-festa"),
     [R("Logo · sistema"), R("Construção e área de proteção"), R("Cores principais"), N("Cor do dia · o sol", pg_cor_dia), N("Três superfícies", pg_superficies), N("Combinações", pg_combinacoes),
      R("Cores de apoio e contraste"), R("Tipografia"), R("Elementos gráficos"), N("Dia e noite: a mesma RolêGo", pg_dia_noite), R("Slogan")]),
    ("02", "Linguagem", "Como a RolêGo aparece em foto, como fala e como se mexe.", "purple", ("roda-gigante-ciano", "confete-festa"),
     [R("Fotografia · quem aparece"), R("Fotografia · tratamento"), R("Fotografia e ícones"), N("Rolês de dia · ícones e fotos", pg_role_dia), R("Voz e tom"), N("Legendas e microcopy", pg_microcopy), R("Motion")]),
    ("03", "Produto", "O app, o ícone, o push e o convite que sai dele.", "dark", ("neon-rosa-azul", "club-luzes-azuis"),
     [R("Interface"), R("App"), N("App · rolês de dia", pg_app_dia), N("Ícone na tela e notificações", pg_icone), N("Compartilhar o rolê", pg_link)]),
    ("04", "Redes sociais", "Feed, stories (de noite e de dia), carrossel e perfil.", "purple", ("bar-loira", "oculos-coracao"),
     [R("Feed · templates"), R("Feed · posts com foto"), N("Carrossel", pg_carrossel), R("Stories"), R("Stories · com foto"), N("Feed e stories · de dia", pg_redes_dia), N("Perfil e destaques", pg_perfil),
      R("Redes · perfil, anúncio e WhatsApp")]),
    ("05", "Site e marketing", "Landing, campanha e e-mail.", "dark", ("festival-sorriso", "brinde-rooftop"),
     [N("Landing no desktop", pg_landing), N("Landing no celular", pg_landing_mobile), R("Campanha · foto + marca"), N("E-mail", pg_email)]),
    ("06", "Mundo físico", "Roupa, merch, festa, praia, rua e parceiros.", "purple", ("parede-luzes-roxo", "show-de-costas"),
     [R("Look do rolê · roupas"), R("Merch · vestir"), R("Merch · levar"), R("Na festa"), R("No rolê · evento"), N("Rolê de dia · merch e praia", pg_fisico_dia), R("Rua · mídia exterior"), N("Kit do parceiro", pg_parceiro), R("Institucional")]),
    ("07", "Regras", "O que não fazer, acessibilidade e o checklist antes de publicar.", "dark", ("platinada-neon", "sorriso-neon"),
     [R("Usos incorretos"), R("Acessibilidade e IA"), N("Checklist e arquivos", pg_checklist)]),
]

# numeração: 1 capa, 2 organização, depois abertura + páginas de cada capítulo
num, n = {}, 3
for ch in CHAPTERS:
    num[("op", ch[0])] = n; n += 1
    for it in ch[5]:
        num[(ch[0], it[1])] = n; n += 1
TOTAL = n - 1


def opener(ch):
    cid, name, desc, cls, (pa, pb), items = ch
    li = "".join(f'<li><i>{num[(cid, it[1])]:02d}</i>{it[1]}</li>' for it in items)
    sym = (f'<div class="s" style="background:{PURPLE}">{I("v4-go-white.svg", h=70)}</div>' if cls == "dark"
           else f'<div class="s" style="background:#000">{I("v4-go-dark.svg", h=70)}</div>')
    return (f'<section class="page {cls} um-op"><div class="um-opl"><div class="num">{cid}</div><h1>{name}</h1><p class="ds">{desc}</p><ul>{li}</ul></div>'
            f'<div class="um-opr"><div class="a" style="background-image:url({F(pa)})"></div><div><div class="b" style="background-image:url({F(pb)})"></div>{sym}</div></div>'
            f'<div class="foot"><span>RolêGo · manual de uso da marca · {cid} {name}</span><span>{num[("op", cid)]:02d}</span></div></section>')


def cover():
    return (f'<section class="page um-cover"><div class="um-cl"><h1>Manual de<br>uso da<br><b>marca</b></h1>'
            f'<p style="font-size:12px;color:#9CA3AF;max-width:360px;line-height:1.5">Como usar a RolêGo em cada peça: superfícies, combinações, foto, voz e mais de 40 aplicações, da pulseira da festa à canga do pôr do sol.</p>'
            f'<div style="margin-top:auto;padding-bottom:30px">{I("v4-lockup-dark.svg", h=56)}<div class="slo" style="font-size:22px;margin-top:10px;color:#fff">Viva o <b style="color:#00E5E5">rolê.</b></div></div></div>'
            f'<div><div class="um-cr"><div style="background-image:url({F("neon-hexagono-roxo")})"></div><div style="background-image:url({F("risada-festa")})"></div><div style="background-image:url({F("roda-gigante-ciano")})"></div></div>'
            f'<div class="um-tiles">{I("v4-icon-app.svg", h=58)}{I("v4-icon-app-dark.svg", h=58, style="box-shadow:0 0 0 1px #2A2D38;border-radius:22%")}'
            f'<div style="width:58px;height:58px;border-radius:13px;background:#fff;display:flex;align-items:center;justify-content:center">{I("v4-go-light.svg", h=30)}</div>'
            f'<div style="width:58px;height:58px;border-radius:13px;background:{PDS};display:flex;align-items:center;justify-content:center">{I("v4-go-white.svg", h=30)}</div></div></div>'
            f'<div class="foot"><span>RolêGo · manual de uso da marca · nov/2026</span><span>01</span></div></section>')


def organizacao():
    cards = ""
    for i, ch in enumerate(CHAPTERS):
        cid, name, *_ , items = ch
        k = "k" if i % 2 == 0 else "p"
        li = "<br>".join(f"<i>{num[(cid, it[1])]:02d}</i>{it[1]}" for it in items)
        cards += f'<div class="um-oc {k}"><span class="n">{cid}</span><b>{name}</b><span>{li}</span></div>'
    cards += ('<div class="um-oc l"><b style="margin-top:4px">Como usar</b><span style="opacity:1;color:#5B6070;font-size:10px">O capítulo 01 é a régua: marca, superfícies e combinações. '
              'Os outros são exemplos prontos: copie a estrutura, troque a foto e o texto. Toda peça passa pelo checklist do capítulo 07.</span>'
              f'<div style="margin-top:auto">{I("v4-go-light.svg", h=34)}</div></div>')
    return (f'<section class="page light"><h2>Como o manual está organizado</h2><p class="um-lead">Sete capítulos, da régua às peças. Os números ao lado de cada item são as páginas.</p>'
            f'<div class="um-org">{cards}</div><div class="foot"><span>RolêGo · manual de uso da marca · estrutura</span><span>02</span></div></section>')


# ---------------------------------------------------------------- montagem
out = [cover(), organizacao()]
for ch in CHAPTERS:
    cid, name = ch[0], ch[1]
    out.append(opener(ch))
    for it in ch[5]:
        h = V5P[it[1]] if it[0] == "v5" else it[2]()
        nn = num[(cid, it[1])]
        h = (h.replace("RolêGo · identidade visual v5 · nov/2026", f"RolêGo · manual de uso da marca · {cid} {name}")
             .replace("@@F@@", f"RolêGo · manual de uso da marca · {cid} {name}")
             .replace('<div class="eyebrow">@@E@@ · ', f'<div class="eyebrow">{cid} {name} · ')
             .replace('<div class="eyebrow">@@E@@</div>', f'<div class="eyebrow">{cid} {name}</div>')
             .replace("@@N@@", f"{nn:02d}"))
        out.append(h)
body = "".join(out).replace("luz verde, amarela ou laranja dominando", "luz verde, amarela ou laranja dominando à noite (de dia, ver Rolês de dia)")
for ph_ in ("foto-multidao-1.jpg", "foto-multidao-2.jpg"):
    body = body.replace(f"url({ph_})", f"url({uri(ph_)})")

write_tokens()
USOS_CSS = NS["USOS_CSS"]
for ph_ in ("foto-multidao-1.jpg", "foto-multidao-2.jpg"):
    USOS_CSS = USOS_CSS.replace(f"url({ph_})", f"url({uri(ph_)})")
CSS = (open(os.path.join(V5, "_manual.css")).read() + NS["FESTA_CSS"] + UM_CSS + DD_CSS).replace("PURPLE", PURPLE)
html = f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>RolêGo — manual de uso da marca</title><style>{FONT}{USOS_CSS}{CSS}</style></head><body>{body}</body></html>'
open(OUT_HTML, "w").write(html)
print("html ok", TOTAL, "págs", f"{len(html) / 1e6:.1f} MB")
if "--no-pdf" not in sys.argv:
    pdf(OUT_HTML, OUT_PDF)
    print("pdf ok")

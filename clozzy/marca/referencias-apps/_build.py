#!/usr/bin/env python3
"""Clozzy — Referências de apps + modelos de tela + comparação com a logo v1.
Paleta fechada: Pink Clozzy · Pink Deep · Roxo v1 · Ink · Cream · Branco (nada além disso).
Rodar: python3 _fotos.py && python3 _logos_story.py && python3 _build.py  → HTML + PDF + PNGs"""
import base64, json, random, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "logo-2028"))
import _conceitos as R2  # noqa: E402
import _logos_story as LS  # noqa: E402

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT_HTML = HERE / "referencias-e-modelos-clozzy.html"
OUT_PDF = HERE / "referencias-e-modelos-clozzy.pdf"
FONTS = HERE.parent / "identidade-nova" / "fonts"

PINK, DEEP, PURPLE, INK, CREAM, WHITE = "#FF0065", "#E0005A", "#7C48C4", "#14090F", "#FFF6F0", "#FFFFFF"


def b64(path, mime):
    return f"data:{mime};base64," + base64.b64encode(Path(path).read_bytes()).decode()


def img(path):
    return b64(path, "image/jpeg")


def svgdata(s):
    return "data:image/svg+xml;base64," + base64.b64encode(s.encode()).decode()


def logo(name):
    return svgdata((HERE / "logos" / f"{name}.svg").read_text())


PH = [img(HERE / "modelos" / "img" / f"p{i}.jpg") for i in range(1, 13)]


def ref(app, n):
    return img(HERE / "refs" / app / f"{n}.jpg")


def meta(app):
    return json.loads((HERE / "refs" / app / "meta.json").read_text())


# ------------------------------------------------------------------ ícones (24 grid, stroke)
IC = {
    "home": '<path d="M4 11l8-7 8 7v9h-5v-6h-6v6H4z"/>',
    "search": '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    "plus": '<path d="M12 5v14M5 12h14"/>',
    "chat": '<path d="M5 5h14v10H10l-4 4v-4H5z"/>',
    "user": '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.2-4 4-5.5 7.5-5.5s6.3 1.5 7.5 5.5"/>',
    "bell": '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5h4"/>',
    "lock": '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    "heart": '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
    "send": '<path d="M4 12l16-8-6 16-2.5-6.5z"/>',
    "mic": '<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/>',
    "video": '<rect x="3.5" y="6.5" width="12" height="11" rx="2.5"/><path d="M15.5 10.5l5-3v9l-5-3"/>',
    "flip": '<path d="M4 9a8 8 0 0 1 14-3l2 2M20 15a8 8 0 0 1-14 3l-2-2M20 4v4h-4M4 20v-4h4"/>',
    "end": '<path d="M3.5 14c5-5 12-5 17 0l-2.5 2.5-3-1.5v-2.5a10 10 0 0 0-6 0V15l-3 1.5z"/>',
    "back": '<path d="M15 5l-7 7 7 7"/>',
    "more": '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    "share": '<path d="M12 4v11M7.5 8.5L12 4l4.5 4.5M5 13v6.5h14V13"/>',
    "copy": '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
    "arrowup": '<path d="M12 19V5M6 11l6-6 6 6"/>',
    "pix": '<path d="M12 3.5l8.5 8.5-8.5 8.5L3.5 12z"/><path d="M8 12h8"/>',
    "list": '<path d="M8 6h12M8 12h12M8 18h12M4 6h.5M4 12h.5M4 18h.5"/>',
    "tag": '<path d="M4 4h7.5l8.5 8.5-7.5 7.5L4 11.5z"/><circle cx="8.5" cy="8.5" r="1.3"/>',
    "play": '<path d="M8 5l11 7-11 7z"/>',
    "check": '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
}


def ic(name, size=20, color="currentColor", sw=1.9, fill="none"):
    return (f'<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="{fill}" stroke="{color}" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{IC[name]}</svg>')


def star(size=12, color=PINK):
    return f'<svg viewBox="0 0 24 24" width="{size}" height="{size}"><path d="{R2.star(12, 12.6, 11.2, r=1.6)}" fill="{color}"/></svg>'


def mark(kind="story-a", size=28, dark=False):
    name = {"story-a": "story-a", "story-b": "story-b", "v1": "v1-atual-mark", "circulo-b": "circulo-b"}[kind]
    if dark and kind != "v1":
        name += "-dark"
    return f'<img src="{logo(name)}" style="width:{size}px;height:{size}px;display:block">'


def wordlogo(kind="story-a", h=22, dark=False):
    if kind == "v1":
        src = svgdata(LS.v1_lockup(WHITE if dark else INK))
        return f'<img src="{src}" style="height:{h}px;display:block">'
    return f'<img src="{logo(kind + ("-lockup-dark" if dark else "-lockup"))}" style="height:{h}px;display:block">'


def qr(n=25, seed=4):
    rnd = random.Random(seed)
    cells = []
    fin = [(0, 0), (n - 7, 0), (0, n - 7)]
    def in_fin(x, y):
        return any(fx <= x < fx + 7 and fy <= y < fy + 7 for fx, fy in fin)
    for y in range(n):
        for x in range(n):
            if not in_fin(x, y) and rnd.random() < .48:
                cells.append(f'<rect x="{x}" y="{y}" width="1" height="1"/>')
    for fx, fy in fin:
        cells.append(f'<path fill-rule="evenodd" d="M{fx} {fy}h7v7h-7zM{fx+1} {fy+1}v5h5v-5z"/><rect x="{fx+2}" y="{fy+2}" width="3" height="3"/>')
    return f'<svg viewBox="-1 -1 {n+2} {n+2}" width="132" height="132" fill="{INK}" shape-rendering="crispEdges">{"".join(cells)}</svg>'


# ------------------------------------------------------------------ peças de UI
def status(dark=False):
    c = WHITE if dark else INK
    return (f'<div class="sb" style="color:{c}"><b>9:41</b><span class="sbi">'
            f'<i style="background:{c}"></i><i style="background:{c}"></i><i style="background:{c};width:18px;border-radius:3px"></i></span></div>')


def avatar(i, size=44, ring=None, gap=2.5, badge=False, bg=WHITE):
    rs = ""
    if ring:
        rs = f"box-shadow:0 0 0 {gap}px {bg},0 0 0 {gap + 2.2}px {ring};"
    b = (f'<span class="badge" style="background:{PURPLE};border-color:{bg}">{star(size * .2, WHITE)}</span>' if badge else "")
    return (f'<span class="av" style="width:{size}px;height:{size}px;{rs}">'
            f'<img src="{PH[i % 12]}">{b}</span>')


def tabbar(active="home", dark=False):
    c, mu = (WHITE, "rgba(255,255,255,.55)") if dark else (INK, "rgba(20,9,15,.45)")
    items = []
    for k in ["home", "search", "plus", "chat", "user"]:
        if k == "plus":
            items.append(f'<span class="tplus">{ic("plus", 18, WHITE, 2.4)}</span>')
        else:
            items.append(f'<span style="color:{c if k == active else mu}">{ic(k, 21)}</span>')
    bg = INK if dark else WHITE
    bd = "rgba(255,255,255,.08)" if dark else "rgba(20,9,15,.08)"
    return f'<div class="tab" style="background:{bg};border-top:1px solid {bd}">{"".join(items)}</div>'


def phone(inner, dark=False, bg=None):
    bg = bg or (INK if dark else WHITE)
    return f'<div class="phone"><div class="scr" style="background:{bg}">{inner}</div></div>'


# ------------------------------------------------------------------ telas
def s_home(logo_kind="story-a"):
    ring_close, ring_sub = PINK, PURPLE
    stories = [("Seu close", None, None), ("nina.rios", ring_close, 1), ("lua", ring_close, 2),
               ("biamel", ring_sub, 3), ("caio", ring_sub, 4), ("duda", "rgba(20,9,15,.18)", 5)]
    st = ""
    for name, ring, i in stories:
        if ring is None:
            a = (f'<span class="av av-me" style="width:50px;height:50px"><img src="{PH[0]}">'
                 f'<span class="badge add" style="background:{PINK}">{ic("plus", 10, WHITE, 3)}</span></span>')
        else:
            a = avatar(i, 50, ring, badge=(ring == ring_close))
        st += f'<div class="st">{a}<small>{name}</small></div>'
    cards = ""
    for i, (n, p) in enumerate([("Nina Rios", "19,90"), ("Lua Matos", "24,90"), ("Bia Mel", "14,90"), ("Caio V.", "29,90")]):
        cards += (f'<div class="cc"><div class="ccimg"><img src="{PH[(i * 2 + 1) % 12]}">'
                  f'<span class="pill pill-w">{star(9, PINK)} Close</span></div>'
                  f'<b>{n}</b><small>R$ {p}/mês</small></div>')
    return phone(f"""{status()}
<div class="hdr">{wordlogo(logo_kind, 24)}<span class="hi">{ic("bell", 21)}{ic("chat", 21)}</span></div>
<div class="stories">{st}</div>
<div class="drop"><div><small>DROP HOJE · 21H</small><b>Ensaio Verão da Nina</b><span>24 fotos + 3 vídeos · só pro Close</span></div>
<span class="btn-w">Me avise</span></div>
<div class="sec"><b>Para você</b><small>Ver tudo</small></div>
<div class="grid2">{cards}</div>
{tabbar("home")}""")


def s_story():
    return phone(f"""<img class="full blur" src="{PH[4]}">
<div class="shade"></div>
{status(True)}
<div class="prog"><i class="on"></i><i class="on"></i><i></i><i></i><i></i></div>
<div class="sthdr">{avatar(1, 30, PINK, 1.5, bg=INK)}<b>nina.rios</b><span class="pill pill-p">{star(9, WHITE)} Close</span><small>2 h</small></div>
<div class="lockc">
  <span class="lockico">{ic("lock", 26, WHITE, 2)}</span>
  <h3>Story só pro Close</h3>
  <p>Entre no Close da Nina e veja 14 stories, 6 vídeos e fale com ela no chat.</p>
  <span class="btn btn-pink">Entrar no Close · R$ 19,90/mês</span>
  <small>Pix · cancela quando quiser</small>
</div>
<div class="reply"><span>Responder…</span>{ic("heart", 22, WHITE)}{ic("send", 22, WHITE)}</div>""", dark=True)


def s_videos():
    rail = "".join(f'<span>{ic(k, 26, WHITE, 2)}<small>{n}</small></span>' for k, n in
                   [("heart", "8,2 mil"), ("chat", "312"), ("share", "Enviar")])
    return phone(f"""<img class="full" src="{PH[2]}">
<div class="shade2"></div>
{status(True)}
<div class="vtabs"><span>Seguindo</span><span class="on">{star(11, PINK)} Close</span><span>Para você</span></div>
<div class="rail">{avatar(1, 40, WHITE, 0, badge=True, bg=INK)}{rail}
<span class="savestar">{star(26, PINK)}<small>Salvar</small></span></div>
<div class="vcap"><b>nina.rios</b> <span class="pill pill-p">{star(9, WHITE)} Exclusivo</span>
<p>bastidor do ensaio de ontem, versão sem corte 🎬</p>
<div class="vbar"><i style="width:38%"></i></div></div>
{tabbar("home", True)}""", dark=True)


def s_perfil():
    thumbs = ""
    for i in range(6):
        locked = i not in (0, 3)
        inner = (f'<span class="lk">{ic("lock", 16, WHITE, 2.2)}</span>' if locked else
                 f'<span class="dur">{ic("play", 9, WHITE, 0, WHITE)} 0:{24 + i * 7}</span>')
        thumbs += f'<div class="th"><img src="{PH[(i + 3) % 12]}" class="{"blur" if locked else ""}">{inner}</div>'
    return phone(f"""<div class="cover"><img src="{PH[5]}"></div>
<div style="position:absolute;top:0;left:0;right:0">{status(True)}</div>
<div class="pf">{avatar(1, 76, PINK, 3, badge=True)}
<h3>Nina Rios</h3><small>@ninarios · 1,2 mil no Close</small>
<p>Bastidor, vídeo sem corte e chat comigo. Novidade toda sexta ✦</p>
<div class="pfbtn"><span class="btn btn-pink">Entrar no Close · R$ 19,90</span><span class="btn btn-o">{ic("chat", 18)}</span></div>
</div>
<div class="ptabs"><span class="on">Vídeos</span><span>Stories</span><span>Pacotes</span></div>
<div class="grid3">{thumbs}</div>""")


def s_chat():
    return phone(f"""{status()}
<div class="chdr">{ic("back", 22)}{avatar(1, 36, PINK, 1.8)}<div><b>Nina Rios</b><small>{star(10, PURPLE)} Close · responde em ~1 h</small></div><span class="hi">{ic("video", 23)}</span></div>
<div class="msgs">
  <span class="day">Hoje</span>
  <div class="m in">oii! obrigada por entrar no Close 💗</div>
  <div class="m in">te mandei o bastidor que você pediu</div>
  <div class="m media"><img class="blur" src="{PH[8]}"><span class="mlock">{ic("lock", 18, WHITE, 2.2)}<b>Vídeo · 0:42</b></span>
  <span class="btn btn-pink sm">Desbloquear · R$ 9,90</span></div>
  <div class="m out">aaa que demais!! desbloqueei 🙌</div>
  <div class="m out">rola uma call sexta?</div>
  <div class="m in">rola sim! abre a agenda aqui ↓</div>
  <div class="m cardcall">{ic("video", 18, PURPLE)}<div><b>Videochamada · 15 min</b><small>sex, 20h · R$ 59,90</small></div><span class="btn btn-purple sm">Agendar</span></div>
</div>
<div class="inp"><span>Mensagem…</span>{ic("mic", 21)}</div>""", bg=CREAM)


def s_videochat():
    ctl = "".join(f'<span class="cb">{ic(k, 22, WHITE, 2)}</span>' for k in ["mic", "video", "flip"])
    return phone(f"""<img class="full" src="{PH[0]}">
<div class="shade3"></div>
{status(True)}
<div class="vchdr"><span class="pill pill-p">{star(9, WHITE)} Sessão privada</span><b>08:42</b><small>restantes</small></div>
<div class="pip"><img src="{PH[9]}"></div>
<div class="vcname"><b>Nina Rios</b><small>só vocês dois · não é gravado</small></div>
<div class="ctl">{ctl}<span class="cb end">{ic("end", 24, WHITE, 2)}</span></div>""", dark=True)


def s_drop():
    return phone(f"""{status()}
<div class="hdr">{ic("back", 22)}<span class="hi">{ic("share", 21)}</span></div>
<div class="dimg"><img src="{PH[6]}"><span class="pill pill-w big">{star(10, PINK)} Só pro Close</span></div>
<div class="dtxt"><small>DROP · NINA RIOS</small><h3>Ensaio Verão</h3><p>24 fotos + 3 vídeos sem corte. Entra na sua biblioteca na hora.</p></div>
<div class="count"><div><b>02</b><small>h</small></div><i>:</i><div><b>14</b><small>min</small></div><i>:</i><div><b>37</b><small>s</small></div></div>
<span class="btn btn-ink">{ic("bell", 18, WHITE)} Me avise às 21h</span>
<small class="dfoot">312 pessoas na lista</small>""")


def s_checkout():
    return phone(f"""{status()}
<div class="hdr">{ic("back", 22)}<b style="font-size:14px">Entrar no Close</b><span style="width:22px"></span></div>
<div class="ck">{avatar(1, 44, PINK, 2)}<small>Close da Nina Rios</small>
<div class="amount"><sup>R$</sup>19<span>,90</span></div><small>por mês · cancela quando quiser</small></div>
<div class="incl"><span>{ic("check", 15, PURPLE, 2.6)} 14 stories e 6 vídeos agora</span><span>{ic("check", 15, PURPLE, 2.6)} Chat direto com a Nina</span><span>{ic("check", 15, PURPLE, 2.6)} Drops antes de todo mundo</span></div>
<div class="pixbox">{qr()}<div><b>{ic("pix", 15, INK, 2)} Pague com Pix</b><small>Aguardando pagamento<br>expira em <b>14:59</b></small><span class="dots"><i></i><i></i><i></i></span></div></div>
<span class="btn btn-pink" style="margin:0 14px">{ic("copy", 17, WHITE)} Copiar código Pix</span>""")


def s_painel():
    bars = [38, 52, 44, 70, 61, 84, 100]
    b = "".join(f'<i style="height:{h}%;background:{PINK if k == 6 else "rgba(255,255,255,.22)"}"></i>' for k, h in enumerate(bars))
    acts = "".join(f'<span><i>{ic(k, 19, WHITE, 2)}</i><small>{n}</small></span>' for k, n in
                   [("arrowup", "Sacar"), ("pix", "Pix"), ("list", "Extrato"), ("tag", "Ofertas")])
    rows = "".join(f'<div class="row">{avatar(i, 34)}<div><b>{n}</b><small>{t}</small></div><b>+ R$ {v}</b></div>' for i, n, t, v in
                   [(7, "Entrou no Close", "@lucas.m · agora", "19,90"), (9, "Videochamada 15 min", "@ana.b · 12 min", "59,90"),
                    (11, "Pacote Ensaio Verão", "@rafa · 1 h", "39,90")])
    return phone(f"""{status(True)}
<div class="hdr">{wordlogo("story-a", 22, True)}<span class="hi" style="color:{WHITE}">{avatar(1, 30)}</span></div>
<div class="bal"><small>Saldo disponível</small><b>R$ 4.820<span>,50</span></b><em>+ R$ 1.240 esta semana</em></div>
<div class="acts">{acts}</div>
<div class="kpi"><div><small>{star(10, PINK)} Close</small><b>1.284</b><em>+38 na semana</em></div><div class="bars">{b}</div></div>
<div class="rows">{rows}</div>
{tabbar("user", True)}""", dark=True)


def s_convite():
    avs = "".join(f'<span style="margin-left:{-10 if k else 0}px">{avatar(k + 6, 28, PURPLE, 0)}</span>' for k in range(4))
    return phone(f"""{status(True)}
<div class="hdr" style="color:{WHITE}">{ic("back", 22, WHITE)}<span class="hi">{ic("share", 21, WHITE)}</span></div>
<div class="inv"><div class="invimg"><img src="{PH[2]}"><span class="invring">{mark("story-a", 56, True)}</span></div>
<small>CONVITE</small><h3>A Nina te chamou pro Close dela</h3>
<p>48 h grátis para ver os stories, os vídeos e o chat. Depois R$ 19,90/mês.</p>
<div class="who">{avs}<small>+12 amigos seus já estão</small></div></div>
<span class="btn btn-w2">Aceitar convite</span><small class="dfoot" style="color:rgba(255,255,255,.7)">clozzy.com/close/nina</small>""", bg=PURPLE)


# ------------------------------------------------------------------ CSS
def css():
    gab = b64(FONTS / "Gabarito-Variable.ttf", "font/ttf")
    fig = b64(FONTS / "Figtree-Variable.ttf", "font/ttf")
    return f"""
@font-face{{font-family:Gabarito;src:url({gab});font-weight:400 900}}
@font-face{{font-family:Figtree;src:url({fig});font-weight:300 900}}
@page{{size:297mm 210mm;margin:0}}
*{{box-sizing:border-box;margin:0;padding:0}}
:root{{--pink:{PINK};--deep:{DEEP};--purple:{PURPLE};--ink:{INK};--cream:{CREAM};--mu:rgba(20,9,15,.62)}}
body{{font-family:Figtree,sans-serif;color:var(--ink);background:#ddd;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
.page{{width:297mm;height:210mm;background:{WHITE};position:relative;overflow:hidden;page-break-after:always;padding:15mm 16mm 12mm}}
.page.ink{{background:var(--ink);color:{WHITE}}} .page.cream{{background:var(--cream)}} .page.purple{{background:var(--purple);color:{WHITE}}}
h1,h2,h3,.disp{{font-family:Gabarito,sans-serif;letter-spacing:-.02em}}
h1{{font-size:64px;font-weight:800;line-height:.95}} h2{{font-size:30px;font-weight:800;line-height:1.05;margin-bottom:6px}}
.kicker{{font:700 11px Figtree;letter-spacing:.14em;text-transform:uppercase;color:var(--deep);margin-bottom:8px}}
.ink .kicker,.purple .kicker{{color:{PINK}}} .purple .kicker{{color:{WHITE};opacity:.8}}
.lead{{font-size:13.5px;line-height:1.5;color:var(--mu);max-width:760px}} .ink .lead{{color:rgba(255,255,255,.7)}}
.foot{{position:absolute;left:16mm;right:16mm;bottom:7mm;display:flex;justify-content:space-between;font-size:9px;color:rgba(20,9,15,.45)}}
.ink .foot,.purple .foot{{color:rgba(255,255,255,.5)}}
/* refs */
.refs{{display:grid;gap:14px;margin-top:14px}}
.rf img{{width:100%;border-radius:10px;display:block;border:1px solid rgba(20,9,15,.08)}}
.rf b{{display:block;font:800 13px Gabarito;margin-top:7px}} .rf small{{display:block;font-size:10px;color:var(--mu);margin-top:1px}}
.rf p{{font-size:10.5px;line-height:1.38;margin-top:4px}} .rf p em{{font-style:normal;color:var(--deep);font-weight:700}}
.kw{{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}}
.kw span{{font:700 11px Figtree;padding:5px 11px;border-radius:99px;border:1.5px solid currentColor}}
/* phone */
.phones{{display:flex;gap:26px;justify-content:center;align-items:flex-start;margin-top:12px}}
.pw{{width:262px}} .pw .cap{{margin-top:9px}} .pw .cap b{{font:800 14px Gabarito;display:block}}
.pw .cap small{{font-size:10px;color:var(--mu);display:block;line-height:1.4;margin-top:2px}}
.pw .cap small em{{font-style:normal;color:var(--deep);font-weight:700}}
.ink .pw .cap small{{color:rgba(255,255,255,.65)}} .ink .pw .cap small em{{color:{PINK}}}
.phone{{width:262px;height:540px;border-radius:40px;background:#111;padding:7px;box-shadow:0 1px 0 rgba(0,0,0,.04),0 18px 40px rgba(20,9,15,.16)}}
.scr{{width:100%;height:100%;border-radius:34px;overflow:hidden;position:relative;font-size:12px;color:var(--ink)}}
.sb{{display:flex;justify-content:space-between;align-items:center;padding:12px 22px 4px;font-size:12px;position:relative;z-index:3}}
.sbi{{display:flex;gap:4px;align-items:center}} .sbi i{{display:block;width:12px;height:8px;border-radius:2px;opacity:.9}}
.hdr{{display:flex;justify-content:space-between;align-items:center;padding:8px 16px 6px;position:relative;z-index:3}}
.hi{{display:flex;gap:14px;align-items:center}}
.av{{position:relative;display:inline-block;border-radius:50%;flex:none}}
.av img{{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block}}
.badge{{position:absolute;right:-3px;bottom:-3px;width:42%;height:42%;border-radius:50%;border:2px solid;display:grid;place-items:center}}
.badge.add{{border-color:{WHITE};width:18px;height:18px;right:-2px;bottom:-2px}}
.stories{{display:flex;gap:11px;padding:8px 14px 12px;overflow:hidden}}
.st{{display:flex;flex-direction:column;align-items:center;gap:6px;width:52px;flex:none}}
.st small{{font-size:9.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:56px}}
.drop{{margin:0 14px;background:var(--purple);color:{WHITE};border-radius:18px;padding:13px 14px;display:flex;align-items:center;justify-content:space-between;gap:8px}}
.drop small{{font-size:9px;font-weight:800;letter-spacing:.12em;opacity:.85}} .drop b{{display:block;font:800 15px Gabarito;margin:2px 0}}
.drop span{{font-size:10px;opacity:.9}}
.btn-w{{background:{WHITE};color:var(--purple);font-weight:800;font-size:11px;padding:8px 11px;border-radius:99px;white-space:nowrap}}
.sec{{display:flex;justify-content:space-between;align-items:baseline;padding:14px 16px 8px}} .sec b{{font:800 15px Gabarito}} .sec small{{color:var(--deep);font-weight:700;font-size:11px}}
.grid2{{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 14px}}
.cc b{{font:800 12.5px Gabarito;display:block;margin-top:5px}} .cc small{{font-size:10px;color:var(--mu)}}
.ccimg{{position:relative;height:112px;border-radius:14px;overflow:hidden}} .ccimg img{{width:100%;height:100%;object-fit:cover}}
.ccimg .pill{{position:absolute;left:7px;top:7px}}
.pill{{display:inline-flex;align-items:center;gap:4px;font-size:9.5px;font-weight:800;padding:3px 8px;border-radius:99px;white-space:nowrap}}
.pill-w{{background:{WHITE};color:var(--ink)}} .pill-p{{background:var(--pink);color:{WHITE}}} .pill.big{{font-size:11px;padding:5px 10px}}
.tab{{position:absolute;left:0;right:0;bottom:0;height:62px;display:flex;justify-content:space-around;align-items:flex-start;padding-top:12px}}
.tplus{{width:38px;height:28px;border-radius:10px;background:var(--pink);display:grid;place-items:center;margin-top:-3px}}
.full{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}}
.blur{{filter:blur(14px) saturate(1.1);transform:scale(1.15)}}
.shade{{position:absolute;inset:0;background:rgba(20,9,15,.45)}}
.shade2{{position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,9,15,.35),transparent 22%,transparent 55%,rgba(20,9,15,.75))}}
.shade3{{position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,9,15,.5),transparent 25%,transparent 65%,rgba(20,9,15,.7))}}
.prog{{display:flex;gap:3px;padding:4px 10px;position:relative;z-index:3}} .prog i{{flex:1;height:2.5px;border-radius:2px;background:rgba(255,255,255,.35)}} .prog i.on{{background:{WHITE}}}
.sthdr{{display:flex;align-items:center;gap:8px;padding:8px 12px;color:{WHITE};position:relative;z-index:3}} .sthdr b{{font-size:12px}} .sthdr small{{opacity:.7;font-size:10px}}
.lockc{{position:absolute;left:18px;right:18px;top:150px;text-align:center;color:{WHITE};z-index:3}}
.lockico{{width:58px;height:58px;border-radius:50%;border:2px solid {PINK};display:grid;place-items:center;margin:0 auto 14px}}
.lockc h3{{font-size:22px;font-weight:800}} .lockc p{{font-size:12px;line-height:1.45;opacity:.85;margin:8px 0 18px}}
.lockc small{{display:block;margin-top:9px;font-size:10px;opacity:.7}}
.btn{{display:flex;align-items:center;justify-content:center;gap:7px;font-weight:800;font-size:12.5px;padding:13px 14px;border-radius:99px;white-space:nowrap}}
.btn.sm{{font-size:10.5px;padding:7px 11px}}
.btn-pink{{background:var(--deep);color:{WHITE}}} .btn-purple{{background:var(--purple);color:{WHITE}}} .btn-ink{{background:var(--ink);color:{WHITE};margin:0 16px}}
.btn-o{{border:1.5px solid rgba(20,9,15,.2);padding:11px 13px}} .btn-w2{{background:{WHITE};color:var(--purple);margin:0 18px;font-size:13.5px}}
.reply{{position:absolute;left:12px;right:12px;bottom:20px;display:flex;gap:12px;align-items:center;z-index:3}}
.reply span{{flex:1;border:1.5px solid rgba(255,255,255,.5);border-radius:99px;padding:9px 14px;color:rgba(255,255,255,.8);font-size:11px}}
.vtabs{{display:flex;justify-content:center;gap:16px;color:rgba(255,255,255,.65);font-weight:700;font-size:12px;position:relative;z-index:3;padding-top:6px}}
.vtabs .on{{color:{WHITE};display:flex;gap:4px;align-items:center;border-bottom:2px solid {PINK};padding-bottom:3px}}
.rail{{position:absolute;right:10px;bottom:150px;display:flex;flex-direction:column;align-items:center;gap:15px;z-index:3;color:{WHITE}}}
.rail span{{display:flex;flex-direction:column;align-items:center;gap:2px}} .rail small{{font-size:9px;font-weight:700}}
.savestar{{color:{WHITE}}}
.vcap{{position:absolute;left:12px;right:62px;bottom:76px;color:{WHITE};z-index:3}} .vcap b{{font-size:13px}} .vcap p{{font-size:11px;margin-top:6px;line-height:1.4}}
.vbar{{height:2.5px;background:rgba(255,255,255,.3);border-radius:2px;margin-top:10px;margin-right:-50px}} .vbar i{{display:block;height:100%;background:{PINK};border-radius:2px}}
.cover{{height:148px;overflow:hidden}} .cover img{{width:100%;height:100%;object-fit:cover;object-position:center 30%}}
.pf{{padding:0 16px;margin-top:-40px;position:relative}} .pf h3{{font-size:20px;font-weight:800;margin-top:9px}} .pf>small{{color:var(--mu);font-size:10.5px}}
.pf p{{font-size:11px;line-height:1.45;margin:7px 0 11px}} .pfbtn{{display:flex;gap:8px}} .pfbtn .btn-pink{{flex:1}}
.ptabs{{display:flex;justify-content:space-around;margin-top:12px;border-bottom:1px solid rgba(20,9,15,.1);font-weight:700;font-size:11.5px;color:var(--mu)}}
.ptabs span{{padding:8px 4px}} .ptabs .on{{color:var(--ink);border-bottom:2px solid var(--ink)}}
.grid3{{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin-top:2px}}
.th{{position:relative;height:104px;overflow:hidden}} .th img{{width:100%;height:100%;object-fit:cover}}
.lk{{position:absolute;inset:0;display:grid;place-items:center;background:rgba(20,9,15,.25)}}
.dur{{position:absolute;left:6px;bottom:5px;color:{WHITE};font-size:9.5px;font-weight:700;display:flex;gap:3px;align-items:center}}
.chdr{{display:flex;align-items:center;gap:9px;padding:6px 14px 10px;background:{WHITE};border-bottom:1px solid rgba(20,9,15,.07)}}
.chdr b{{font-size:13px;display:block}} .chdr small{{font-size:9.5px;color:var(--mu);display:flex;gap:3px;align-items:center}} .chdr .hi{{margin-left:auto}}
.msgs{{display:flex;flex-direction:column;gap:5px;padding:10px 12px}}
.day{{align-self:center;font-size:9.5px;color:var(--mu);font-weight:700;margin-bottom:3px}}
.m{{max-width:78%;padding:8px 11px;border-radius:17px;font-size:11.5px;line-height:1.35}}
.m.in{{background:{WHITE};align-self:flex-start;border-bottom-left-radius:5px}}
.m.out{{background:var(--purple);color:{WHITE};align-self:flex-end;border-bottom-right-radius:5px}}
.m.media{{position:relative;width:150px;height:118px;padding:0;overflow:hidden;align-self:flex-start}}
.m.media img{{width:100%;height:100%;object-fit:cover}}
.mlock{{position:absolute;top:22px;left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:3px;color:{WHITE};font-size:10.5px}}
.m.media .btn{{position:absolute;left:8px;right:8px;bottom:8px}}
.cardcall{{background:{WHITE};align-self:flex-start;display:flex;gap:8px;align-items:center;max-width:92%;border:1.5px solid var(--purple)}}
.cardcall b{{font-size:11px;display:block}} .cardcall small{{font-size:9.5px;color:var(--mu)}}
.inp{{position:absolute;left:0;right:0;bottom:0;padding:10px 12px 22px;display:flex;gap:10px;align-items:center;background:{WHITE}}}
.inp span{{flex:1;background:var(--cream);border-radius:99px;padding:9px 14px;color:var(--mu);font-size:11px}}
.vchdr{{position:relative;z-index:3;display:flex;flex-direction:column;align-items:center;color:{WHITE};margin-top:8px}}
.vchdr b{{font:800 28px Gabarito;margin-top:8px}} .vchdr small{{font-size:10px;opacity:.75}}
.pip{{position:absolute;right:14px;top:118px;width:78px;height:112px;border-radius:16px;overflow:hidden;border:2px solid {WHITE};z-index:3}} .pip img{{width:100%;height:100%;object-fit:cover}}
.vcname{{position:absolute;left:0;right:0;bottom:104px;text-align:center;color:{WHITE};z-index:3}} .vcname b{{font:800 18px Gabarito;display:block}} .vcname small{{font-size:10px;opacity:.75}}
.ctl{{position:absolute;left:0;right:0;bottom:30px;display:flex;justify-content:center;gap:13px;z-index:3}}
.cb{{width:50px;height:50px;border-radius:50%;background:rgba(255,255,255,.18);display:grid;place-items:center}} .cb.end{{background:var(--deep)}}
.dimg{{margin:2px 14px 0;height:206px;border-radius:20px;overflow:hidden;position:relative}} .dimg img{{width:100%;height:100%;object-fit:cover}} .dimg .pill{{position:absolute;left:10px;top:10px}}
.dtxt{{padding:12px 16px 4px}} .dtxt small{{font-size:9.5px;font-weight:800;letter-spacing:.12em;color:var(--deep)}} .dtxt h3{{font-size:26px;font-weight:800;margin-top:2px}}
.dtxt p{{font-size:11px;color:var(--mu);margin-top:4px;line-height:1.4}}
.count{{display:flex;justify-content:center;align-items:flex-start;gap:6px;margin:10px 0 14px}}
.count div{{text-align:center;width:58px;background:var(--cream);border-radius:12px;padding:7px 0 5px}} .count b{{font:800 28px Gabarito;display:block;line-height:1}}
.count small{{font-size:9px;color:var(--mu);font-weight:700}} .count i{{font:800 24px Gabarito;font-style:normal;padding-top:8px}}
.dfoot{{display:block;text-align:center;margin-top:9px;font-size:10px;color:var(--mu)}}
.ck{{display:flex;flex-direction:column;align-items:center;margin-top:4px}} .ck>small{{font-size:10.5px;color:var(--mu);margin-top:8px}}
.amount{{font:800 52px Gabarito;letter-spacing:-.04em;line-height:1;margin:2px 0 0}} .amount sup{{font-size:20px;vertical-align:28px;margin-right:2px}} .amount span{{font-size:28px}}
.incl{{display:flex;flex-direction:column;gap:4px;margin:9px 22px;font-size:11px}} .incl span{{display:flex;gap:6px;align-items:center}}
.pixbox{{margin:2px 14px 10px;border-radius:18px;background:var(--cream);padding:10px;display:flex;gap:10px;align-items:center}}
.pixbox>svg{{flex:none;background:{WHITE};border-radius:10px;padding:4px;width:108px;height:108px}}
.pixbox b{{font-size:12px;display:flex;gap:5px;align-items:center}} .pixbox small{{display:block;font-size:10px;color:var(--mu);margin-top:4px;line-height:1.4}} .pixbox small b{{display:inline;color:var(--ink)}}
.dots{{display:flex;gap:4px;margin-top:8px}} .dots i{{width:7px;height:7px;border-radius:50%;background:var(--pink)}} .dots i+i{{opacity:.5}} .dots i+i+i{{opacity:.25}}
.bal{{padding:10px 18px 0;color:{WHITE}}} .bal small{{font-size:10.5px;opacity:.7}} .bal b{{display:block;font:800 36px Gabarito;letter-spacing:-.03em;margin-top:2px}} .bal b span{{font-size:20px;opacity:.7}}
.bal em{{font-style:normal;font-size:10.5px;color:{PINK};font-weight:700}}
.acts{{display:flex;justify-content:space-between;padding:14px 18px;color:{WHITE}}} .acts span{{display:flex;flex-direction:column;align-items:center;gap:5px;font-size:9.5px}}
.acts i{{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.1);display:grid;place-items:center}}
.kpi{{margin:0 14px;background:rgba(255,255,255,.07);border-radius:18px;padding:12px 14px;display:flex;justify-content:space-between;align-items:flex-end;color:{WHITE}}}
.kpi small{{font-size:10px;opacity:.8;display:flex;gap:4px;align-items:center}} .kpi b{{font:800 24px Gabarito;display:block}} .kpi em{{font-style:normal;font-size:9.5px;color:{PINK};font-weight:700}}
.bars{{display:flex;gap:5px;align-items:flex-end;height:54px}} .bars i{{width:11px;border-radius:4px}}
.rows{{padding:8px 14px;color:{WHITE}}} .row{{display:flex;align-items:center;gap:9px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.07)}}
.row div{{flex:1}} .row div b{{font-size:11px;display:block}} .row small{{font-size:9.5px;opacity:.6}} .row>b{{font-size:11px}}
.inv{{margin:4px 18px 14px;color:{WHITE}}} .invimg{{height:200px;border-radius:22px;overflow:hidden;position:relative;border:3px solid {WHITE}}}
.invimg>img{{width:100%;height:100%;object-fit:cover}} .invring{{position:absolute;right:10px;bottom:10px;background:{INK};border-radius:50%;padding:4px}}
.inv>small{{display:block;font-size:9.5px;font-weight:800;letter-spacing:.14em;margin-top:14px;opacity:.85}}
.inv h3{{font-size:23px;font-weight:800;line-height:1.08;margin-top:4px}} .inv p{{font-size:11px;line-height:1.45;opacity:.9;margin-top:7px}}
.who{{display:flex;align-items:center;margin-top:12px}} .who small{{font-size:10px;margin-left:8px}}
/* logo compare */
.lc{{display:grid;grid-template-columns:150px repeat(4,1fr);margin-top:14px;border-top:1px solid rgba(20,9,15,.1)}}
.lc>div{{padding:10px 10px;border-bottom:1px solid rgba(20,9,15,.1);display:flex;align-items:center;justify-content:center;min-height:62px}}
.lc .rh{{justify-content:flex-start;font-size:10.5px;font-weight:700;color:var(--mu)}}
.lc .ch{{flex-direction:column;align-items:center;text-align:center;min-height:0}} .lc .ch b{{font:800 15px Gabarito}} .lc .ch small{{font-size:10px;color:var(--mu)}}
.lc .dk{{background:var(--ink)}} .lc .pp{{background:var(--purple)}}
.lc .tag{{font-size:9px;font-weight:800;color:{WHITE};background:var(--deep);border-radius:99px;padding:2px 7px;margin-top:4px}}
.sw{{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-top:16px}}
.sw div{{border-radius:16px;height:150px;padding:12px;display:flex;flex-direction:column;justify-content:flex-end;font-size:10px;line-height:1.4}}
.sw b{{font:800 15px Gabarito}}
.rules{{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:16px;font-size:11px;line-height:1.5}}
.rules h4{{font:800 14px Gabarito;margin-bottom:5px}} .rules li{{margin-left:15px}}
.notes{{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:12px;font-size:10.5px;line-height:1.45}}
.notes b{{font:800 13px Gabarito;display:block;margin-bottom:3px}} .notes em{{font-style:normal;font-weight:700;color:var(--deep)}}
"""


# ------------------------------------------------------------------ páginas
def foot(n):
    return f'<div class="foot"><span>Clozzy · Referências e modelos · nov 2026</span><span>{n}</span></div>'


def page_cover():
    return f"""<section class="page ink" style="display:flex;flex-direction:column;justify-content:space-between">
<div style="display:flex;justify-content:space-between;align-items:center">{wordlogo("story-a", 34, True)}<span class="kicker" style="margin:0">Clozzy 2028</span></div>
<div><div class="kicker">Referências · modelos · logo</div>
<h1>Apps bonitos como<br>referência, telas<br>do Clozzy como resultado.</h1>
<p class="lead" style="margin-top:16px">17 apps baixados da App Store e lidos com as palavras-chave do Clozzy: vídeos, stories, chat, videochat, fechado, privado, close, close friends, estrela.
10 telas-modelo na paleta fechada (rosa, roxo, ink, cream, branco). O conceito de logo “Story” vem comparado com a logo atual (v1).</p></div>
<div style="display:flex;gap:18px;align-items:flex-end">{"".join(f'<div style="width:46px;height:46px;border-radius:50%;background:{c};{"border:1px solid rgba(255,255,255,.25);" if c in (INK,) else ""}"></div>' for c in [PINK, DEEP, PURPLE, INK, CREAM, WHITE])}
<span style="font-size:10px;color:rgba(255,255,255,.5);margin-left:auto">Gerado por _build.py · nada além destas 6 cores</span></div>
</section>"""


def page_brief(n):
    kws = ["vídeos", "stories", "chat", "videochat", "fechado", "privado", "close", "close friends", "estrela"]
    sw = [(PINK, WHITE, "Pink Clozzy", "#FF0065", "Anel do Close · destaques<br>Ink sobre ele 5,2:1"),
          (DEEP, WHITE, "Pink Deep", "#E0005A", "Botões e CTAs<br>Branco sobre ele 4,9:1 (AA)"),
          (PURPLE, WHITE, "Roxo v1", "#7C48C4", "Marca, estrela, bolha do chat<br>Branco sobre ele 5,9:1 (AA)"),
          (INK, WHITE, "Ink", "#14090F", "Texto e modo escuro (vídeo,<br>story, call, painel)"),
          (CREAM, INK, "Cream", "#FFF6F0", "Fundo quente: chat, caixas<br>Ink sobre ele 18:1"),
          (WHITE, INK, "Branco", "#FFFFFF", "Fundo base das telas claras")]
    sws = "".join(f'<div style="background:{b};color:{t};{"border:1px solid rgba(20,9,15,.12);" if b in (WHITE, CREAM) else ""}"><b>{nm}</b>{hx}<br><span style="opacity:.8">{u}</span></div>'
                  for b, t, nm, hx, u in sw)
    return f"""<section class="page">
<div class="kicker">Brief</div><h2>Palavras-chave e paleta fechada</h2>
<p class="lead">O Clozzy é o “close friends pago”: stories, vídeos, chat e videochamada que ficam fechados para quem está no Close. A estrela é o sinal de quem está dentro.</p>
<div class="kw" style="color:var(--purple)">{"".join(f"<span>{k}</span>" for k in kws)}</div>
<div class="sw">{sws}</div>
<div class="rules">
<div><h4>Como as cores se dividem</h4><ul><li><b>Rosa</b> é o status: Close, novo, ao vivo, o anel do story.</li><li><b>Roxo</b> é a marca: estrela, chat, convite, drop.</li><li><b>Ink e cream/branco</b> carregam o resto.</li></ul></div>
<div><h4>Nunca</h4><ul><li>Texto rosa sobre roxo ou roxo sobre rosa (1,5:1, ilegível).</li><li>Gradiente rosa→roxo, glow ou neon.</li><li>Outras cores, nem para status: erro e sucesso usam ink, ícone e texto.</li></ul></div>
<div><h4>Tipografia</h4><ul><li><b style="font-family:Gabarito">Gabarito 800</b> para títulos, preços e números.</li><li>Figtree para interface e texto corrido.</li><li>Números grandes, como no Cash App: preço e saldo são o herói da tela.</li></ul></div>
</div>
{foot(n)}</section>"""


REF_PAGES = [
    ("Referências 1/3", "Stories e vídeo: o anel é o status", "stories · vídeos · close friends · estrela", [
        ("instagram", 4, "Close Friends: o anel do story mostra quem está dentro. <em>No Clozzy, o anel vira o logo e o produto.</em>"),
        ("snapchat", 4, "Stories com Amigos separados de Assinaturas. <em>Separar Close (pago) de quem você só segue.</em>"),
        ("tiktok", 2, "Vídeo em tela cheia com ações no trilho da direita. <em>Feed “Close” com a estrela de salvar.</em>"),
        ("bereal", 5, "A foto borrada é um convite, não um bloqueio. <em>Conteúdo fechado aparece desfocado, com a promessa visível.</em>"),
        ("locket", 2, "Íntimo, só para amigos próximos, sem métricas. <em>Tom de “só entre a gente”.</em>"),
        ("instagram", 1, "Reels emoldurados como objeto. <em>Thumbs grandes e cantos generosos.</em>"),
    ]),
    ("Referências 2/3", "Chat, videochat e privado", "chat · videochat · fechado · privado", [
        ("telegram", 3, "Chat privado com mídia e bolhas limpas. <em>Bolha roxa para você, branca para o criador, fundo cream.</em>"),
        ("discord", 2, "Videochamada com grade e controles grandes. <em>Sessão 1:1 com timer visível.</em>"),
        ("substack", 5, "Chat só para assinantes, numa lista sóbria. <em>O acesso ao chat é parte da assinatura.</em>"),
        ("patreon", 5, "Comunidade e membership no mesmo app. <em>Criador no centro, oferta ao lado.</em>"),
        ("partiful", 4, "O convite é um objeto compartilhável por link. <em>“A Nina te chamou pro Close dela”.</em>"),
        ("luma", 4, "Página de inscrição com hierarquia clara. <em>Quem, quando e quanto, depois um único botão.</em>"),
    ]),
    ("Referências 3/3", "Vitrine, drop e dinheiro", "drop · vitrine · Pix · painel", [
        ("snkrs", 3, "Drop com contagem regressiva e um botão. <em>Lançamento de ensaio com “Me avise”.</em>"),
        ("snkrs", 5, "A notificação é parte do produto. <em>“Drop da Nina em 15 min”.</em>"),
        ("cashapp", 2, "Valor gigante, uma ação por tela. <em>Checkout Pix com o preço como herói.</em>"),
        ("revolut", 2, "Saldo em dark premium com ações redondas. <em>Painel do criador em ink.</em>"),
        ("spotify", 3, "Header de perfil com foto grande. <em>Vitrine do criador com capa.</em>"),
        ("depop", 2, "Grade de produtos densa e fotográfica. <em>Pacotes e itens avulsos em grade.</em>"),
    ]),
]


def page_refs(n, kick, title, kw, items):
    cards = ""
    for app, i, txt in items:
        m = meta(app)
        cards += f'<div class="rf"><img src="{ref(app, i)}"><b>{m["name"].split(":")[0].split(" - ")[0].split(" –")[0]}</b><small>{m["seller"]} · App Store</small><p>{txt}</p></div>'
    return f"""<section class="page cream">
<div class="kicker">{kick}</div><h2>{title}</h2><p class="lead">Palavras-chave: {kw}. Capturas oficiais da App Store, usadas só como referência interna em <code>refs/</code>.</p>
<div class="refs" style="grid-template-columns:repeat({len(items)},1fr)">{cards}</div>
{foot(n)}</section>"""


def page_logo(n):
    cols = [("v1", "v1 atual", "hml.clozzy.com.br", False),
            ("story-a", "Story", "anel fino + estrela menor", True),
            ("story-b", "Story + disco v1", "v1 dentro do anel", False),
            ("circulo-b", "Círculo próximo", "rodada 1", False)]

    def cell(kind, what):
        if what == "lock":
            return wordlogo(kind, 40)
        if what == "lockv1":
            if kind == "v1":
                return wordlogo("v1", 40)
            return f'<img src="{logo(kind + "-lockup-v1word")}" style="height:40px">'
        if what == "dark":
            return wordlogo(kind, 40, True)
        if what == "app":
            if kind == "v1":
                inner = f'<img src="{logo("v1-atual-mark")}" style="width:64px">'
                return f'<div style="width:74px;height:74px;border-radius:18px;background:{WHITE};border:1px solid rgba(20,9,15,.12);display:grid;place-items:center">{inner}</div>'
            return (f'<div style="width:74px;height:74px;border-radius:18px;background:{INK};display:grid;place-items:center">'
                    f'<img src="{logo(kind + "-dark")}" style="width:54px"></div>')
        if what == "small":
            src = logo("v1-atual-mark") if kind == "v1" else logo(kind + ("-16" if kind != "circulo-b" else ""))
            return (f'<div style="display:flex;gap:14px;align-items:center"><img src="{src}" style="width:32px"><img src="{src}" style="width:16px">'
                    f'<span style="background:{INK};padding:5px;border-radius:5px;display:flex"><img src="{logo("v1-atual-mark") if kind == "v1" else logo(kind + "-dark")}" style="width:16px"></span></div>')
        if what == "mono":
            if kind == "v1":
                s = LS.v1_mark().replace(PURPLE.upper(), INK).replace('fill="#7C48C4"', f'fill="{INK}"')
                return f'<img src="{svgdata(s)}" style="width:52px">'
            return f'<img src="{logo(kind + "-mono")}" style="width:52px">'
        if what == "story":
            av = f'<span class="av" style="width:46px;height:46px"><img src="{PH[1]}"></span>'
            m = mark(kind, 22)
            return (f'<div style="display:flex;align-items:center;gap:10px">{avatar(1, 46, PINK, 2.5)}'
                    f'<span style="font-size:10px;color:var(--mu)">→</span>{m}<span style="font-size:10px;color:var(--mu)">no anel do app</span></div>')
    rows = [("Lockup (wordmark próprio)", "lock"), ("Lockup com o “clozzy” da v1", "lockv1"),
            ("Sobre ink", "dark"), ("Ícone do app", "app"), ("32 px · 16 px · 16 px no escuro", "small"),
            ("Uma cor", "mono"), ("Conversa com o story do app", "story")]
    head = '<div class="rh"></div>' + "".join(
        f'<div class="ch"><b>{t}</b><small>{s}</small>{"<span class=tag>novo · pedido</span>" if hl else ""}</div>' for _, t, s, hl in cols)
    body = ""
    for label, what in rows:
        body += f'<div class="rh">{label}</div>'
        for k, *_ in cols:
            cls = "dk" if what == "dark" else ""
            body += f'<div class="{cls}">{cell(k, what)}</div>'
    return f"""<section class="page">
<div class="kicker">Logo · comparação</div><h2>v1 atual × “Story” (anel fino + estrela menor)</h2>
<p class="lead">O “Story” mantém a ideia da v1 (círculo + estrela), mas troca o disco cheio por um anel fino de story do Instagram e reduz a estrela de ~53% para ~46% do raio. O anel em rosa diz “tem novidade no Close”, e a estrela em roxo mantém a cor da v1.</p>
<div class="lc">{head}{body}</div>
{foot(n)}</section>"""


def page_logo_read(n):
    return f"""<section class="page cream">
<div class="kicker">Logo · leitura</div><h2>O que muda da v1 para o Story</h2>
<div class="notes">
<div><b>v1 atual</b>Disco roxo #7C48C4, estrela branca grande e “clozzy” em geométrica fina preta. <em>Forte:</em> simples, já reconhecido. <em>Fraco:</em> a estrela no disco é genérica (favoritos/avaliação) e o disco cheio pesa ao lado dos avatares.</div>
<div><b>Story (pedido)</b>Anel fino rosa com estrela roxa menor solta dentro. <em>Forte:</em> diz “story / close friends” sem palavras, e o app inteiro pode usar o mesmo anel nos avatares. <em>Risco:</em> com 14/256 de espessura, o anel some abaixo de 24 px. Por isso existe um corte para tamanhos pequenos (anel 24, estrela maior), já incluso.</div>
<div><b>Story + disco v1</b>A v1 inteira dentro do anel. <em>Forte:</em> continuidade máxima, porque a v1 só ganha o anel. <em>Fraco:</em> fica pequena e muito detalhada no ícone, com três camadas.</div>
<div><b>Recomendação</b>Seguir com o <em>Story</em> como símbolo e testar dois wordmarks: o da v1, para manter o equity, e o Gabarito 800, que é mais “app”. No app, o anel rosa vira linguagem: avatar com anel = tem story no Close; badge de estrela roxa = você está dentro.</div>
</div>
<div style="display:flex;gap:40px;align-items:center;justify-content:center;margin-top:34px">
<div style="text-align:center"><img src="{logo("v1-atual-mark")}" style="width:150px"><div style="font:800 14px Gabarito;margin-top:10px">v1</div></div>
<div style="font:800 36px Gabarito;color:var(--purple)">→</div>
<div style="text-align:center"><img src="{logo("story-a")}" style="width:150px"><div style="font:800 14px Gabarito;margin-top:10px">Story</div></div>
<div style="width:1px;height:150px;background:rgba(20,9,15,.15)"></div>
<div style="text-align:center">{avatar(1, 132, PINK, 7, badge=True, bg=CREAM)}<div style="font:800 14px Gabarito;margin-top:16px">o mesmo anel no avatar</div></div>
</div>
{foot(n)}</section>"""


def pw(screen, title, ref_txt):
    return f'<div class="pw">{screen}<div class="cap"><b>{title}</b><small>{ref_txt}</small></div></div>'


def page_compare_screens(n):
    return f"""<section class="page cream">
<div class="kicker">Logo na tela</div><h2>A mesma home com a v1, o Story e o Story + disco</h2>
<p class="lead">O header é onde a marca mais aparece. Com o Story, o logo e os anéis dos stories falam a mesma língua.</p>
<div class="phones">{pw(s_home("v1"), "v1 atual", "Disco roxo cheio ao lado dos anéis: duas linguagens diferentes na mesma faixa.")}
{pw(s_home("story-a"), "Story", "<em>O logo é um story.</em> Anel rosa = Close; header e stories alinhados.")}
{pw(s_home("story-b"), "Story + disco v1", "Continuidade com a v1, mas o símbolo fica pesado no tamanho do header.")}</div>
{foot(n)}</section>"""


MODEL_PAGES = [
    ("Modelos 1/4", "Stories e vídeos", "", [
        (s_home, "Home: stories + drop", "Ref. <em>Instagram, Snapchat</em>. Anel rosa = Close (com estrela), anel roxo = assinante, cinza = visto."),
        (s_story, "Story fechado", "Ref. <em>BeReal, Instagram</em>. O borrado mostra que tem coisa ali; a oferta vem com preço e Pix."),
        (s_videos, "Vídeos · aba Close", "Ref. <em>TikTok</em>. Feed vertical com a aba “Close” e a estrela de salvar no trilho."),
    ]),
    ("Modelos 2/4", "Perfil, chat e videochat", "", [
        (s_perfil, "Perfil do criador", "Ref. <em>Spotify, Patreon</em>. Capa grande, avatar com anel e grade com cadeado."),
        (s_chat, "Chat privado", "Ref. <em>Telegram, Substack</em>. Mídia bloqueada dentro da conversa e agendamento de call."),
        (s_videochat, "Videochamada 1:1", "Ref. <em>Discord</em>. Timer da sessão no topo e controles grandes."),
    ]),
    ("Modelos 3/4", "Drop, checkout e painel", "", [
        (s_drop, "Drop com contagem", "Ref. <em>SNKRS</em>. Contagem regressiva, um botão e a lista de espera como prova social."),
        (s_checkout, "Checkout Pix", "Ref. <em>Cash App</em>. O preço é o herói; o QR fica em cream e o status aparece ao vivo."),
        (s_painel, "Painel do criador", "Ref. <em>Revolut</em>. Saldo em ink, ações redondas e a barra de hoje em rosa."),
    ]),
]


def page_models(n, kick, title, items, dark=False):
    phones = "".join(pw(fn(), t, r) for fn, t, r in items)
    return f"""<section class="page {"ink" if dark else ""}">
<div class="kicker">{kick}</div><h2>{title}</h2>
<div class="phones">{phones}</div>
{foot(n)}</section>"""


def page_convite(n):
    return f"""<section class="page purple">
<div style="display:grid;grid-template-columns:1fr 262px;gap:40px;align-items:center;height:100%">
<div><div class="kicker">Modelos 4/4</div><h2 style="font-size:40px">O convite é a porta do Close</h2>
<p class="lead" style="color:rgba(255,255,255,.85);margin-top:10px">Ref. <b>Partiful</b> e <b>Luma</b>: o convite é um objeto bonito, compartilhável por link e com uma única ação. No Clozzy, o criador manda o link do Close nos stories do Instagram, e quem abre cai nesta tela, com o logo Story no canto, igual a um story.</p>
<div class="rules" style="grid-template-columns:1fr 1fr;color:{WHITE}">
<div><h4>Fora do escopo v1</h4>Chat, videochamada e stories estão fora do escopo da v1 em <code>docs/functionalities.md</code>. Como são palavras-chave da marca, entraram aqui como modelo. Precisam de decisão de produto antes de virar tela real.</div>
<div><h4>Próximos passos</h4><ol style="margin-left:16px"><li>Escolher entre Story e Story + disco, e qual wordmark.</li><li>Refinar o logo e montar o kit completo.</li><li>Levar as telas para o Figma como base do protótipo.</li></ol></div>
</div></div>
<div class="pw">{s_convite()}<div class="cap" style="color:{WHITE}"><b>Convite para o Close</b></div></div>
</div>
{foot(n)}</section>"""


def build():
    pages = [page_cover(), page_brief(2)]
    k = 3
    for kick, title, kw, items in REF_PAGES:
        pages.append(page_refs(k, kick, title, kw, items)); k += 1
    pages.append(page_logo(k)); k += 1
    pages.append(page_logo_read(k)); k += 1
    pages.append(page_compare_screens(k)); k += 1
    for i, (kick, title, _, items) in enumerate(MODEL_PAGES):
        pages.append(page_models(k, kick, title, items, dark=(i == 1))); k += 1
    pages.append(page_convite(k))
    html = f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy — Referências e modelos</title><style>{css()}</style></head><body>{"".join(pages)}</body></html>'
    OUT_HTML.write_text(html)
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer", f"--print-to-pdf={OUT_PDF}", OUT_HTML.as_uri()],
                   check=True, capture_output=True)
    return len(pages)


if __name__ == "__main__":
    print("pages", build())

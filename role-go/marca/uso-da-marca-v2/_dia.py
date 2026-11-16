# RolêGo · manual de uso v2 · camada "de dia" com LARANJA CHAPADO (sem degradê).
# Igual ao estudo cores-por-do-sol "1 · Laranja · dia chapado": fundo laranja #FF7A2F, Rolê branco + Go roxo.
# Roda via exec() dentro do _build.py, depois dos helpers (P, I, F, phone, PURPLE, icon...).
# A noite não muda (roxo, ciano, preto). No dia: nada de degradê, o laranja é superfície chapada.
import re as _re

SUNSET_DIR = os.path.normpath(os.path.join(OUT, "..", "fotos-sunset"))
SOL, SOLC, INK, ROXO2 = "#FF7A2F", "#FFB547", "#05070F", "#6539CB"

_d = lambda f: _re.findall(r' d="([^"]+)"', open(os.path.join(V5, f)).read())
_ROLE_D, _GOL_D = _d("v4-lockup-white.svg"); _GO_D = _d("v4-go-white.svg")[0]


def lk(h, role="#FFFFFF", go=ROXO2):
    """Lockup chapado (sem degradê): no laranja = Rolê branco + Go roxo."""
    return (f'<svg viewBox="0 0 989 256" style="height:{h}px;display:block"><path fill-rule="evenodd" fill="{role}" d="{_ROLE_D}"/>'
            f'<path fill-rule="evenodd" fill="{go}" d="{_GOL_D}"/></svg>')


def gs(h, c=ROXO2):
    return f'<svg viewBox="0 0 256 256" style="height:{h}px;width:{h}px;display:block"><path fill-rule="evenodd" fill="{c}" d="{_GO_D}"/></svg>'


def FS(name, w=900):
    return foto(os.path.join(SUNSET_DIR, name + ".jpg"), w)


DIA_ICONS = {
    "praia": '<path d="M12 4a8 8 0 0 1 8 8H4a8 8 0 0 1 8-8z"/><path d="M12 12l3 8M3 20h18"/>',
    "bike": '<circle cx="5.5" cy="16" r="3.5"/><circle cx="18.5" cy="16" r="3.5"/><path d="M5.5 16L9 9h6l3.5 7M9 9l3.5 7h-7M15 9l-1-3h-2"/>',
    "trilha": '<path d="M3 19l6-10 4 6 3-4 5 8z"/><circle cx="17" cy="5.5" r="2"/>',
    "pôr do sol": '<path d="M3 17h18M7 20.5h10"/><path d="M7 17a5 5 0 0 1 10 0"/><path d="M12 5v3M5.2 9.2l2 2M18.8 9.2l-2 2"/>',
    "mar": '<path d="M2 14c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/><path d="M2 19c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/><path d="M8 9c1-3 4-5 8-5"/>',
    "vôlei": '<circle cx="12" cy="12" r="8"/><path d="M12 4c-1 4 0 8 4 11M4.5 9.5c4 0 7.5 1 10 6M8 19c1-4 4-7 11-8"/>',
    "piquenique": '<path d="M4 10h16l-2 9H6z"/><path d="M8 10l3-6M16 10l-3-6M5 14h14"/>',
    "skate": '<path d="M3 11c0 2 1 3 3 3h12c2 0 3-1 3-3"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/>',
    "brunch": '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16M9 3v3M12 3v3"/>',
}


def dicon(k, size=26, color=SOL, sw=2):
    return (f'<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="{color}" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round">{DIA_ICONS[k]}</svg>')


def sun(size=80, color="#FFFFFF", half=False, style=""):
    """O sol, chapado: um círculo de uma cor só (branco no laranja, laranja no preto/roxo)."""
    h = size / 2 if half else size
    return (f'<div style="width:{size}px;height:{h:.0f}px;border-radius:{size}px {size}px {"0 0" if half else f"{size}px {size}px"};'
            f'background:{color};{style}"></div>')


def chip_sol(txt, ic=None, bg=SOL, fg=INK):
    i = dicon(ic, 11, fg, 2.4) if ic else ""
    return f'<span class="dd-chip" style="background:{bg};color:{fg}">{i}{txt}</span>'


DD_CSS = """
.dd-sw{border-radius:16px;padding:14px 16px;display:flex;flex-direction:column;justify-content:flex-end;color:#05070F;position:relative;overflow:hidden}
.dd-sw b{font-size:20px;font-weight:800;font-style:italic;letter-spacing:-.03em;line-height:1}
.dd-sw code{font-size:9px;background:none;padding:0;color:inherit;opacity:.8}.dd-sw span{font-size:9.5px;line-height:1.4;opacity:.85;margin-top:3px}
.dd-chip{display:inline-flex;align-items:center;gap:4px;border-radius:99px;padding:3px 10px;font-size:9px;font-weight:700;white-space:nowrap}
.dd-chip.c{background:#00E5E5;color:#05070F}.dd-chip.k{background:#1E1E25;color:#fff}
.dd-rl{list-style:none;font-size:10.5px;line-height:1.45;display:flex;flex-direction:column;gap:7px}
.dd-rl li{display:flex;gap:8px;align-items:flex-start}.dd-rl li:before{content:"";flex-shrink:0;width:9px;height:9px;border-radius:50%;margin-top:3px;background:#FF7A2F}
.dd-rl.no li:before{background:none;box-shadow:inset 0 0 0 2px #E5484D}
.dd-ct{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}
.dd-ct div span{display:block;font-size:9px;color:#5B6070;margin-top:4px;line-height:1.3}
.dd-ct .bx{height:58px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;font-style:italic}
.dd-post{border-radius:14px;position:relative;overflow:hidden;flex-shrink:0;background-size:cover;background-position:center 35%;color:#fff}
.dd-post .t{position:absolute;left:16px;right:16px;font-weight:800;font-style:italic;letter-spacing:-.035em;line-height:.95;z-index:2}
.dd-post .lg{position:absolute;z-index:2}
.dd-post .sn{position:absolute;z-index:1}
.dd-band{position:absolute;left:0;right:0;bottom:0;background:#FF7A2F;z-index:1}
.dd-ic{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.dd-ic div{border-radius:12px;height:92px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;font-size:8.5px;font-weight:700}
.dd-tr{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.dd-tr>div>div{height:250px;border-radius:14px;background-size:cover;background-position:center 40%;position:relative;overflow:hidden}
.dd-tr b{display:block;font-size:10px;margin-top:5px}.dd-tr span{font-size:9px;color:#5B6070}
.dd-dd{display:grid;grid-template-columns:1fr 1fr;gap:14px;font-size:10px;line-height:1.5}
.dd-dd b{font-size:10px;text-transform:uppercase;letter-spacing:.06em}
.dd-ev{display:flex;gap:8px;background:#0F0F13;border-radius:12px;padding:6px;align-items:center}
.dd-ev i{width:46px;height:46px;border-radius:9px;background-size:cover;background-position:center;flex-shrink:0;display:flex;align-items:center;justify-content:center}
.dd-ev b{font-size:9px;display:block}.dd-ev span{font-size:7.5px;color:#9CA3AF;display:block;margin-top:1px}
.dd-fl{display:flex;gap:5px;padding:0 12px;flex-wrap:wrap}
.dd-cmp{display:grid;grid-template-columns:1fr 1fr 1.05fr;gap:18px;flex:1}
.dd-tag{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;display:flex;align-items:center;gap:6px}
.dd-mi{border-radius:16px;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center}
.dd-mi small{position:absolute;left:10px;bottom:8px;font-size:9px;font-weight:600}
"""


# ---------------------------------------------------------------- 01 · cor do dia
def pg_cor_dia():
    sw = (f'<div class="dd-sw" style="background:{SOL};grid-row:span 2;color:#fff">'
          f'<div style="position:absolute;right:-34px;top:-34px">{sun(150, "#FFFFFF")}</div>'
          f'<div style="position:absolute;left:16px;top:16px">{lk(22)}</div>'
          f'<b style="font-size:34px">Laranja sol</b><code>#FF7A2F · RGB 255 122 47</code><span style="color:{INK};opacity:1">A cor do dia: praia, pôr do sol, bike, fim de tarde. Chapada, sempre. No laranja: Rolê branco + Go roxo.</span></div>'
          f'<div class="dd-sw" style="background:#000;color:#fff"><div style="position:absolute;right:14px;top:14px">{sun(30, SOL)}</div><b>Laranja no preto</b><code>#FF7A2F sobre #000</code><span>ícone, chip, palavra de destaque</span></div>'
          f'<div class="dd-sw" style="background:#fff;box-shadow:inset 0 0 0 1px #DCDDE5"><div style="position:absolute;right:14px;top:14px">{sun(30, SOL)}</div><b>Laranja no branco</b><code>só forma: sol, chip, bloco</code><span>nunca texto laranja no branco</span></div>'
          f'<div class="dd-sw" style="grid-column:span 2;height:96px;padding:0;flex-direction:row;background:none">'
          f'<div style="flex:1;background:{SOL};display:flex;align-items:center;justify-content:center;border-radius:14px 0 0 14px">{lk(22)}</div>'
          f'<div style="flex:1;background:{ROXO2};display:flex;align-items:center;justify-content:center">{lk(22, "#FFFFFF", "#00E5E5")}</div>'
          f'<div style="flex:1;background:#000;display:flex;align-items:center;justify-content:center;border-radius:0 14px 14px 0">{lk(22, "#FFFFFF", "#00E5E5")}</div></div>')
    prop = ('<div class="um-prop" style="height:30px">'
            f'<div style="flex:38;background:{SOL};color:{INK};font-size:9px;font-weight:700;display:flex;align-items:center;padding-left:8px">38 laranja</div>'
            f'<div style="flex:24;background:{ROXO2};color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;padding-left:8px">24 roxo</div>'
            '<div style="flex:20;background:#000;color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;padding-left:8px">20 preto</div>'
            '<div style="flex:12;background:#fff;color:#05070F;font-size:9px;font-weight:700;display:flex;align-items:center;padding-left:6px">12 branco</div>'
            '<div style="flex:6;background:#00E5E5;font-size:9px;font-weight:700;display:flex;align-items:center;padding-left:4px">6</div></div>')
    cts = [("#FFFFFF", SOL, "Branco no laranja", "título ≥ 24 px"), (INK, SOL, "Ink no laranja", "ok"), (ROXO2, SOL, "Roxo no laranja", "só o Go"),
           (SOL, "#000000", "Laranja no preto", "ok"), (SOL, "#FFFFFF", "Laranja no branco", "não"), ("#00E5E5", SOL, "Ciano no laranja", "não")]
    ct = ""
    for fg, bg, nome, st in cts:
        cls = {"ok": "ok", "não": "no"}.get(st, "")
        sty = ' style="color:#B7791F"' if not cls else ""
        bd = "box-shadow:inset 0 0 0 1px #DCDDE5;" if bg == "#FFFFFF" else ""
        ct += f'<div><div class="bx" style="background:{bg};color:{fg};{bd}">Aa</div><span><b class="{cls}"{sty}>{st}</b> {nome} · {contrast(fg, bg):.1f}:1</span></div>'
    sim = ["Fundo laranja chapado em post, story, capa de rolê de dia", "Bloco/faixa laranja sobre a foto, com título branco", "Sol: círculo branco no laranja, laranja no preto",
           "Ícones de dia: ink no laranja, laranja no preto", "Chip “de dia”, “pôr do sol 17:48”: laranja + texto ink", "Uma palavra laranja no título sobre preto ou foto"]
    nao = ["Degradê no laranja (sol, céu, laranja → roxo)", "Laranja nas letras do logo", "Ciano em cima do laranja (no laranja o Go é roxo)",
           "Texto pequeno branco no laranja (use ink)", "Texto laranja no branco ou no roxo", "Laranja em peça de festa à noite"]
    return P("light", "Cor do dia · laranja sol", "A noite continua roxo, ciano e preto. O dia ganha o laranja sol, chapado, sem degradê: vira fundo das peças de dia, faixa sobre a foto, sol e ícone. No laranja, Rolê branco + Go roxo.",
             f'<div style="display:grid;grid-template-columns:1.35fr 1fr;gap:20px;flex:1">'
             f'<div style="display:flex;flex-direction:column;gap:12px"><div style="display:grid;grid-template-columns:1.1fr 1fr;grid-template-rows:110px 110px auto;gap:10px">{sw}</div>'
             f'<div><div class="sub">Proporção numa peça de dia</div>{prop}<p class="note" style="font-size:9.5px;color:#5B6070">De dia o laranja é a cor que mais aparece. Roxo e preto seguram a marca; o ciano fica no Go sobre roxo e preto.</p></div></div>'
             f'<div style="display:flex;flex-direction:column;gap:12px"><div><div class="sub">Contraste</div><div class="dd-ct">{ct}</div></div>'
             f'<div class="dd-dd"><div><b class="ok">Sim</b><ul class="dd-rl" style="margin-top:7px">{"".join(f"<li>{x}</li>" for x in sim)}</ul></div>'
             f'<div><b class="no">Não</b><ul class="dd-rl no" style="margin-top:7px">{"".join(f"<li>{x}</li>" for x in nao)}</ul></div></div></div></div>')


# ---------------------------------------------------------------- 01 · dia e noite
def pg_dia_noite():
    noite = (f'<div class="dd-post" style="width:100%;height:410px;background-image:url({F("risada-festa", 700)})"><div style="position:absolute;inset:0;background:{GRADB}"></div>'
             f'<div class="t" style="bottom:56px;font-size:34px">Sexta tem<br><span style="color:#00E5E5">rolê.</span></div>'
             f'<div class="lg" style="left:16px;bottom:16px">{I("v4-lockup-purple.svg", h=20)}</div></div>')
    dia = (f'<div class="dd-post" style="width:100%;height:410px;background:{SOL}">'
           f'<div style="position:absolute;left:10px;right:10px;top:10px;height:250px;border-radius:10px;background:url({FS("praia-tres-amigas", 700)}) center 40%/cover"></div>'
           f'<div class="sn" style="right:22px;top:22px">{sun(40, SOL)}</div>'
           f'<div class="t" style="bottom:56px;font-size:34px">Domingo tem<br><span style="color:{INK}">pôr do sol.</span></div>'
           f'<div class="lg" style="left:16px;bottom:16px">{lk(20)}</div></div>')
    fica = ["Logo gomoso; Rolê sempre branco no escuro e no laranja", "Poppins, título itálico ExtraBold", "Roxo e preto no app e nas peças de noite", "Ciano no Go sobre roxo e preto", "A mesma galera e a mesma voz"]
    muda = ["Fundo laranja chapado nas peças de dia", "No laranja, Go roxo (nunca ciano)", "Foto com moldura ou faixa laranja, sem degradê", "Sol: círculo de uma cor só", "Ícones e chips de dia"]
    els = (f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
           f'<div class="dd-mi" style="background:#000;height:112px"><div style="position:relative;width:120px;height:80px;display:flex;align-items:center;justify-content:center">{sun(54, SOL, style="position:absolute;left:62px;top:2px")}<div style="position:relative">{I("v4-go-dark.svg", h=58)}</div></div><small style="color:#9CA3AF">sol atrás do pin</small></div>'
           f'<div class="dd-mi" style="background:{SOL};height:112px;align-items:flex-end"><div style="display:flex;flex-direction:column;align-items:center;width:100%">{sun(96, "#FFFFFF", half=True)}<div style="height:3px;width:80%;background:{INK}"></div><div style="height:24px"></div></div><small style="color:{INK}">horizonte</small></div>'
           f'<div class="dd-mi" style="background:{SOL};height:112px">{lk(24)}<small style="color:{INK}">superfície laranja</small></div>'
           f'<div class="dd-mi" style="background:#000;height:112px;flex-direction:column;gap:7px"><div style="display:flex;gap:5px">{chip_sol("pôr do sol 17:48", "pôr do sol")}</div>'
           f'<div style="display:flex;gap:5px"><span class="dd-chip c">hoje à noite</span>{chip_sol("de dia", "bike")}</div><small style="color:#9CA3AF">chips</small></div></div>')
    li = lambda xs: "".join(f'<li style="color:#D7D9E2">{x}</li>' for x in xs)
    return P("dark", "Dia e noite: a mesma RolêGo", "Rolê é festa e também é praia, pedal e pôr do sol. De noite, roxo e ciano. De dia, laranja chapado com o Go roxo. Sem degradê entre os dois: cada peça é de um jeito.",
             f'<div class="dd-cmp"><div><div class="dd-tag" style="color:#00E5E5">● Noite · festa</div>{noite}</div>'
             f'<div><div class="dd-tag" style="color:{SOL}">● Dia · pôr do sol</div>{dia}</div>'
             f'<div style="display:flex;flex-direction:column;gap:12px">{els}'
             f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div><div class="sub" style="color:#9CA3AF">Fica igual</div><ul class="dd-rl">{li(fica)}</ul></div>'
             f'<div><div class="sub" style="color:{SOL}">Entra de dia</div><ul class="dd-rl">{li(muda)}</ul></div></div></div></div>')


# ---------------------------------------------------------------- 02 · rolês de dia
def pg_role_dia():
    ic = "".join(f'<div style="background:{SOL if i % 2 == 0 else "#000"};color:{INK if i % 2 == 0 else "#D7D9E2"}">{dicon(k, 30, INK if i % 2 == 0 else SOL)}<span>{k}</span></div>'
                 for i, k in enumerate(DIA_ICONS))
    tr = [("loira-praia-sorriso", "", "Original", "luz dourada, céu limpo"),
          ("amigas-caminhando-praia", f'<div style="position:absolute;left:0;right:0;bottom:0;height:64px;background:{SOL};display:flex;align-items:center;padding-left:12px">{lk(16)}</div>', "Faixa laranja", "a foto em cima, um bloco chapado embaixo"),
          ("pulando-sunset", "", "Moldura laranja", "a foto dentro do laranja, logo no canto")]
    trh = ""
    for n, o, t, d in tr:
        if t == "Moldura laranja":
            box = (f'<div style="background:{SOL}"><div style="position:absolute;inset:12px 12px 44px 12px;border-radius:8px;background:url({FS(n, 600)}) center 40%/cover"></div>'
                   f'<div style="position:absolute;left:14px;bottom:13px">{lk(16)}</div><div style="position:absolute;right:14px;bottom:12px">{sun(18, "#FFFFFF")}</div></div>')
        else:
            box = f'<div style="background-image:url({FS(n, 600)})">{o}</div>'
        trh += f'<div>{box}<b>{t}</b><span>{d}</span></div>'
    return P("light", "Rolês de dia · ícones e fotos", "Mesma galera, outra hora do dia: praia, pedal no fim de tarde, trilha, vôlei, piquenique. A foto fica limpa e o laranja chega em bloco: faixa ou moldura, nunca em degradê por cima.",
             f'<div style="display:grid;grid-template-columns:1.6fr 1fr;gap:22px;flex:1">'
             f'<div style="display:flex;flex-direction:column;gap:12px"><div class="sub">Fotografia de dia · tratamento</div><div class="dd-tr">{trh}</div>'
             f'<div class="dd-dd"><div><b class="ok">Sim</b><p>Meninas de 18 a 22, as mesmas do casting · praia, orla, ciclovia, mirante, trilha · fim de tarde e golden hour · em movimento: pedalando, pulando, rindo, de costas pro sol.</p></div>'
             f'<div><b class="no">Não</b><p>Degradê ou filtro laranja por cima da foto · sol do meio-dia estourado · foto de academia ou esporte de competição · nada sensual (biquíni em pose, close de corpo) · paisagem sem gente.</p></div></div></div>'
             f'<div style="display:flex;flex-direction:column;gap:10px"><div class="sub">Ícones de dia · grade 24 px, traço 2 px</div><div class="dd-ic">{ic}</div>'
             f'<p class="note" style="font-size:9.5px;color:#5B6070">No laranja o ícone é ink; no preto, laranja. Os ícones de noite seguem com as cores de categoria.</p></div></div>')


# ---------------------------------------------------------------- 03 · app de dia
def pg_app_dia():
    sb = '<div class="um-sb"><span>16:20</span><span>●●● 5G</span></div>'
    evs = [("praia-tres-amigas", "Pôr do sol no Arpoador", "hoje · 17h · 34 vão", "pôr do sol"),
           (None, "Pedal até o pôr do sol", "sáb · 16h · Ibirapuera · 21 vão", "bike"),
           ("amigos-praia-sunset", "Vôlei + mar", "dom · 15h · Posto 9 · 18 vão", "vôlei"),
           (None, "Trilha do Pico", "dom · 7h · 12 vão", "trilha")]
    ev = ""
    for ph, t, s, k in evs:
        cv = f'style="background-image:url({FS(ph, 160)})"' if ph else f'style="background:{SOL}"'
        inner = "" if ph else dicon(k, 22, INK)
        ev += f'<div class="dd-ev"><i {cv}>{inner}</i><div style="flex:1"><b>{t}</b><span>{s}</span></div>{dicon(k, 14, SOL)}</div>'
    a = phone(f'{sb}<div style="padding:10px 12px 6px;display:flex;justify-content:space-between;align-items:center">{I("v4-lockup-dark.svg", h=14)}{sun(16, SOL)}</div>'
              f'<div class="dd-fl"><span class="dd-chip k">hoje à noite</span>{chip_sol("de dia", "pôr do sol")}<span class="dd-chip k">praia</span><span class="dd-chip k">bike</span></div>'
              f'<div style="margin:10px 10px 4px;background:{SOL};border-radius:12px;padding:10px;position:relative;overflow:hidden">'
              f'<div style="position:absolute;right:-14px;top:-14px">{sun(54, "#FFFFFF")}</div>'
              f'<div style="font-size:15px;font-weight:800;font-style:italic;letter-spacing:-.03em;line-height:1;color:#fff;position:relative">Rolês<br>de dia.</div>'
              f'<div style="font-size:7.5px;color:{INK};margin-top:4px;font-weight:600;position:relative">pôr do sol hoje 17:48</div></div>'
              f'<div style="display:flex;flex-direction:column;gap:6px;padding:6px 10px">{ev}</div>', w=225, h=470)
    b = phone(f'<div style="height:220px;background:url({FS("ceu-dramatico-galera", 500)}) center 40%/cover"></div>'
              f'<div style="background:{SOL};padding:12px">{chip_sol("pôr do sol 17:48", "pôr do sol", "#fff", INK)}'
              f'<div style="font-size:18px;font-weight:800;font-style:italic;letter-spacing:-.03em;line-height:1;margin-top:6px;color:#fff">Pôr do sol<br>no Arpoador</div>'
              f'<div style="font-size:8.5px;color:{INK};margin-top:6px;line-height:1.45;font-weight:500">Hoje · 17h · encontro na pedra<br>Leva canga. Depois tem açaí na orla.</div></div>'
              f'<div style="display:flex;align-items:center;gap:6px;padding:10px 12px"><div class="avs" style="display:flex">{AV("risada-festa", "bar-loira", "confete-cabelo")}</div><span style="font-size:8px;color:#9CA3AF">Bia, Lu e +31 vão</span></div>'
              f'<div style="position:absolute;left:12px;right:12px;bottom:16px;display:flex;gap:6px"><span style="flex:1;text-align:center;background:{PURPLE};border-radius:99px;padding:8px;font-size:10px;font-weight:700">Bora</span>'
              f'<span style="flex:1;text-align:center;box-shadow:inset 0 0 0 1.5px #3A3D48;border-radius:99px;padding:8px;font-size:10px;font-weight:700">Ver quem vai</span></div>', w=225, h=470)
    push = (f'<div class="um-push" style="margin:0;background:#F4F4F8"><div style="width:26px;height:26px;border-radius:7px;background:{PURPLE};display:flex;align-items:center;justify-content:center;flex-shrink:0">{I("v4-go-white.svg", h=14)}</div>'
            f'<div><b>Pôr do sol hoje é 17:48 🌅</b><span>A galera tá indo pro Arpoador. Bora?</span></div><small>agora</small></div>')
    regras = ["Aba “de dia” abre com um card laranja chapado no topo", "Rolê de dia sem foto: capa laranja com ícone ink",
              "Detalhe do rolê de dia: foto limpa + bloco laranja com título branco e texto ink", "Botão principal continua roxo; o app continua preto", "Ícone do app e logo não mudam"]
    return P("dark", "App · rolês de dia", "O app ganha uma aba de dia sem virar outro app: mesmo preto, mesmo botão roxo, com blocos laranja chapados marcando o que acontece com sol.",
             f'<div style="display:grid;grid-template-columns:auto auto 1fr;gap:26px;flex:1;align-items:start">{a}{b}'
             f'<div style="display:flex;flex-direction:column;gap:14px"><div><div class="sub" style="color:#9CA3AF">Notificação</div>{push}</div>'
             f'<div><div class="sub" style="color:#9CA3AF">Regras</div><ul class="dd-rl">{"".join(f"<li style=color:#D7D9E2>{x}</li>" for x in regras)}</ul></div>'
             f'<div><div class="sub" style="color:#9CA3AF">Ícones de dia no app</div><div style="display:flex;gap:12px">{"".join(dicon(k, 22) for k in DIA_ICONS)}</div></div></div></div>')


# ---------------------------------------------------------------- 04 · feed e stories de dia
def pg_redes_dia():
    s = 205
    p1 = (f'<div class="dd-post" style="width:{s}px;height:{s}px;background-image:url({FS("amigas-caminhando-praia", 500)})">'
          f'<div class="dd-band" style="height:84px"></div>'
          f'<div class="t" style="bottom:36px;font-size:21px">Domingo tem<br><span style="color:{INK}">rolê de dia.</span></div><div class="lg" style="left:16px;bottom:12px">{lk(13)}</div></div>')
    p2 = (f'<div class="dd-post" style="width:{s}px;height:{s}px;background:{SOL}"><div class="sn" style="left:50%;top:22px;transform:translateX(-50%)">{sun(76, "#FFFFFF")}</div>'
          f'<div class="t" style="bottom:40px;font-size:24px">Pedal até o<br><span style="color:{INK}">pôr do sol.</span></div><div class="lg" style="left:16px;bottom:14px">{lk(14)}</div></div>')
    grid = "".join(f'<div style="display:flex;align-items:center;gap:5px;font-size:9px;font-weight:700;color:{INK}">{dicon(k, 16, INK)}{k}</div>' for k in ("praia", "bike", "trilha", "vôlei", "piquenique", "pôr do sol"))
    p3 = (f'<div class="dd-post" style="width:{s}px;height:{s}px;background:{SOL}"><div class="t" style="top:18px;font-size:22px">Rolê não é<br>só de <span style="color:{INK}">noite.</span></div>'
          f'<div style="position:absolute;left:16px;right:16px;top:92px;display:grid;grid-template-columns:1fr 1fr;gap:8px">{grid}</div><div class="lg" style="left:16px;bottom:14px">{lk(14)}</div></div>')
    w, h = 158, 281
    s1 = (f'<div class="dd-post" style="width:{w}px;height:{h}px;background:{SOL}">'
          f'<div style="position:absolute;left:8px;right:8px;top:8px;height:170px;border-radius:8px;background:url({FS("pulando-sunset", 400)}) center 50%/cover"></div>'
          f'<div style="position:absolute;left:14px;top:14px;z-index:2">{chip_sol("pôr do sol 17:48", "pôr do sol", "#fff", INK)}</div>'
          f'<div class="t" style="left:12px;bottom:46px;font-size:20px">Partiu<br><span style="color:{INK}">praia.</span></div>'
          f'<div style="position:absolute;left:12px;right:12px;bottom:12px;z-index:2;background:#fff;color:{ROXO2};border-radius:99px;text-align:center;font-size:9px;font-weight:700;padding:6px">Ver quem vai</div></div>')
    opts = "".join(f'<div style="display:flex;align-items:center;gap:7px;background:#fff;color:{INK};border-radius:10px;padding:7px 9px;font-size:10px;font-weight:700">{dicon(k, 15, INK)}{t}</div>' for k, t in (("praia", "Praia"), ("bike", "Pedal"), ("trilha", "Trilha")))
    s2 = (f'<div class="dd-post" style="width:{w}px;height:{h}px;background:{SOL}"><div class="sn" style="right:-26px;top:-26px">{sun(90, "#FFFFFF")}</div>'
          f'<div class="t" style="left:12px;top:74px;font-size:19px">Qual o rolê<br>de <span style="color:{INK}">domingo?</span></div>'
          f'<div style="position:absolute;left:12px;right:12px;top:140px;display:flex;flex-direction:column;gap:6px;z-index:2">{opts}</div>'
          f'<div class="lg" style="left:12px;bottom:14px">{lk(12)}</div></div>')
    cap = lambda t: f'<div style="font-size:9px;color:rgba(255,255,255,.75);margin-top:5px">{t}</div>'
    tiles = [("f", "risada-festa"), ("o", None), ("d", "loira-praia"), ("k", None), ("o2", None), ("f", "bar-loira"), ("d", "multidao-golden-hour"), ("p", None), ("o", None)]
    tl = ""
    for t, ph in tiles:
        if t == "f": st, ins = f"background:url({F(ph, 240)}) center 25%/cover", ""
        elif t == "d": st, ins = f"background:url({FS(ph, 240)}) center 35%/cover", f'<div style="position:absolute;left:0;right:0;bottom:0;height:24px;background:{SOL}"></div>'
        elif t == "o": st, ins = f"background:{SOL}", f'<div style="position:absolute;left:50%;top:14px;transform:translateX(-50%)">{sun(34, "#FFFFFF")}</div><div style="position:absolute;left:8px;bottom:8px">{gs(18)}</div>'
        elif t == "o2": st, ins = f"background:{SOL}", f'<div style="position:absolute;left:0;right:0;top:34px;display:flex;justify-content:center">{dicon("bike", 30, INK)}</div>'
        elif t == "p": st, ins = f"background:{PURPLE}", f'<div style="position:absolute;left:8px;bottom:8px">{I("v4-go-white.svg", h=18)}</div>'
        else: st, ins = "background:#000", f'<div style="position:absolute;left:8px;bottom:8px">{I("v4-go-dark.svg", h=18)}</div>'
        tl += f'<div style="height:96px;border-radius:6px;position:relative;overflow:hidden;{st}">{ins}</div>'
    grade = (f'<div style="display:flex;gap:18px;align-items:center;margin-top:16px"><div style="display:grid;grid-template-columns:repeat(9,96px);gap:4px">{tl}</div>'
             f'<div style="font-size:10px;line-height:1.5;color:rgba(255,255,255,.85);max-width:150px"><b style="display:block;font-size:11px;color:#fff">Na grade</b>Na temporada de verão o laranja aparece bastante, sempre chapado, intercalado com roxo, preto e foto.</div></div>')
    return P("purple", "Feed e stories · de dia", "Peças de dia em laranja chapado: fundo laranja, foto com moldura ou faixa laranja, sol branco e título branco com a palavra de destaque em ink. Sem degradê.",
             f'<div style="display:flex;gap:14px;align-items:flex-start">'
             f'<div>{p1}{cap("Foto + faixa laranja")}</div><div>{p2}{cap("Laranja chapado + sol branco")}</div><div>{p3}{cap("Laranja + ícones ink")}</div>'
             f'<div style="width:1px;align-self:stretch;background:rgba(255,255,255,.25);margin:0 4px"></div>'
             f'<div>{s1}{cap("Story · moldura laranja")}</div><div>{s2}{cap("Story de enquete")}</div></div>{grade}')


# ---------------------------------------------------------------- 06 · merch e praia
def pg_fisico_dia():
    canga = (f'<div style="width:180px;height:250px;border-radius:10px;background:{SOL};position:relative;overflow:hidden;box-shadow:0 12px 24px rgba(5,7,15,.2)">'
             f'<div style="position:absolute;left:50%;top:34px;transform:translateX(-50%)">{sun(80, "#FFFFFF")}</div>'
             f'<div style="position:absolute;left:0;right:0;bottom:24px;display:flex;flex-direction:column;align-items:center;gap:6px">{lk(20)}<span class="slo" style="font-size:12px;color:#fff">Viva o <b style="color:{INK}">rolê.</b></span></div>'
             f'<div style="position:absolute;inset:auto 0 0 0;height:8px;background:repeating-linear-gradient(90deg,#fff 0 4px,transparent 4px 9px);opacity:.7"></div></div>')
    garrafa = (f'<div style="display:flex;flex-direction:column;align-items:center"><div style="width:26px;height:18px;border-radius:5px 5px 2px 2px;background:#1A1A1F"></div>'
               f'<div style="width:72px;height:210px;border-radius:22px;background:{SOL};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;box-shadow:0 12px 24px rgba(5,7,15,.2)">'
               f'<div style="transform:rotate(-90deg);margin:28px 0">{lk(18)}</div>{sun(22, "#FFFFFF")}</div></div>')
    bone = (f'<div style="position:relative;width:170px;height:120px"><div style="position:absolute;left:20px;top:10px;width:130px;height:86px;border-radius:70px 70px 10px 10px;background:{SOL};display:flex;align-items:center;justify-content:center">{gs(40)}</div>'
            f'<div style="position:absolute;left:4px;top:86px;width:110px;height:20px;border-radius:0 0 40px 60px;background:#000"></div></div>')
    adesivos = (f'<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">'
                f'<div style="width:86px;height:86px;border-radius:50%;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px">{dicon("bike", 30)}<span style="font-size:8px;font-weight:800;font-style:italic;color:#fff">pedal do rolê</span></div>'
                f'<div style="width:86px;height:86px;border-radius:50%;background:{SOL};display:flex;align-items:center;justify-content:center">{gs(40)}</div>'
                f'<div style="border-radius:99px;background:{SOL};padding:8px 14px;font-size:11px;font-weight:800;font-style:italic;color:{INK}">partiu praia</div></div>')
    flag = (f'<div style="display:flex;align-items:flex-end;gap:2px;height:250px"><div style="width:4px;height:250px;background:#3A3D48;border-radius:2px"></div>'
            f'<div style="width:70px;height:236px;align-self:flex-start;border-radius:0 60px 6px 0;background:{SOL};display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:18px 0 22px">'
            f'{sun(34, "#FFFFFF")}<div style="transform:rotate(-90deg);margin-bottom:60px">{lk(16)}</div></div></div>')
    lab = lambda t, d: f'<div style="font-size:10px;font-weight:700;margin-top:8px">{t}</div><div style="font-size:9px;color:#5B6070;max-width:180px">{d}</div>'
    return P("light", "Rolê de dia · merch e praia", "Coisas pra levar pro rolê de dia, em laranja chapado: Rolê branco, Go roxo, sol branco. Sem degradê.",
             f'<div style="display:flex;gap:30px;align-items:flex-end;flex:1;padding-bottom:6px;zoom:1.2">'
             f'<div>{canga}{lab("Canga", "Laranja inteira, sol branco em cima, logo embaixo.")}</div>'
             f'<div>{flag}{lab("Wind banner", "Pra marcar o ponto de encontro na praia.")}</div>'
             f'<div>{garrafa}{lab("Garrafinha de bike", "Laranja, logo na vertical, sol branco.")}</div>'
             f'<div>{bone}{lab("Boné", "Laranja com Go roxo, aba preta.")}</div>'
             f'<div style="align-self:center">{adesivos}{lab("Adesivos", "Pra bike, prancha, garrafa. Texto ink no laranja.")}</div></div>')

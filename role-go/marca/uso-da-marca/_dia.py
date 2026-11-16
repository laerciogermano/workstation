# RolêGo · manual de uso · camada "de dia" (pôr do sol, praia, bike...).
# Roda via exec() dentro do _build.py, depois dos helpers (P, I, F, phone, PURPLE, icon...).
# A identidade não muda: logo, roxo, ciano, preto, Poppins. O laranja do sol entra só como detalhe.

SUNSET_DIR = os.path.normpath(os.path.join(OUT, "..", "fotos-sunset"))
SOL, SOLC = "#FF7A2F", "#FFB547"
SOLG = f"linear-gradient(135deg,{SOLC} 0%,{SOL} 100%)"
PDS = f"linear-gradient(180deg,{SOLC} 0%,{SOL} 26%,#9E19E9 64%,#6539CB 84%,#452EFF 100%)"
FADE_PDS = "linear-gradient(180deg,rgba(0,0,0,0) 32%,rgba(255,122,47,.32) 52%,rgba(158,25,233,.78) 78%,rgba(101,57,203,.97) 100%)"
FADE_K = "linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(0,0,0,.65) 70%,#000 100%)"


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


_SID = [0]


def sun(size=80, half=False, style=""):
    """O sol: círculo em degradê âmbar → laranja. half=True: sol se pondo na linha do horizonte."""
    _SID[0] += 1; g = f"sg{_SID[0]}"
    h = size / 2 if half else size
    return (f'<svg width="{size}" height="{h:.0f}" viewBox="0 0 100 {50 if half else 100}" style="display:block;{style}">'
            f'<defs><linearGradient id="{g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{SOLC}"/><stop offset="1" stop-color="{SOL}"/></linearGradient></defs>'
            f'<circle cx="50" cy="50" r="50" fill="url(#{g})"/></svg>')


def chip_sol(txt, ic=None):
    i = dicon(ic, 11, "#05070F", 2.4) if ic else ""
    return f'<span class="dd-chip">{i}{txt}</span>'


DD_CSS = """
.dd-sw{border-radius:16px;padding:14px 16px;display:flex;flex-direction:column;justify-content:flex-end;color:#05070F;position:relative;overflow:hidden}
.dd-sw b{font-size:20px;font-weight:800;font-style:italic;letter-spacing:-.03em;line-height:1}
.dd-sw code{font-size:9px;background:none;padding:0;color:inherit;opacity:.8}.dd-sw span{font-size:9.5px;line-height:1.4;opacity:.85;margin-top:3px}
.dd-chip{display:inline-flex;align-items:center;gap:4px;background:#FF7A2F;color:#05070F;border-radius:99px;padding:3px 10px;font-size:9px;font-weight:700;white-space:nowrap}
.dd-chip.c{background:#00E5E5}.dd-chip.k{background:#1E1E25;color:#fff}
.dd-rl{list-style:none;font-size:10.5px;line-height:1.45;display:flex;flex-direction:column;gap:7px}
.dd-rl li{display:flex;gap:8px;align-items:flex-start}.dd-rl li:before{content:"";flex-shrink:0;width:9px;height:9px;border-radius:50%;margin-top:3px;background:#FF7A2F}
.dd-rl.no li:before{background:none;box-shadow:inset 0 0 0 2px #E5484D}
.dd-ct{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.dd-ct div span{display:block;font-size:9px;color:#5B6070;margin-top:4px;line-height:1.3}
.dd-ct .bx{height:58px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;font-style:italic}
.dd-post{border-radius:14px;position:relative;overflow:hidden;flex-shrink:0;background-size:cover;background-position:center 35%;color:#fff}
.dd-post .ov{position:absolute;inset:0}
.dd-post .t{position:absolute;left:16px;right:16px;font-weight:800;font-style:italic;letter-spacing:-.035em;line-height:.95;z-index:2}
.dd-post .lg{position:absolute;z-index:2}
.dd-post .sn{position:absolute;z-index:1}
.dd-ic{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.dd-ic div{background:#000;border-radius:12px;height:92px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;font-size:8.5px;color:#D7D9E2;font-weight:600}
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
.dd-mi small{position:absolute;left:10px;bottom:8px;font-size:9px;font-weight:600;color:#5B6070}
"""


# ---------------------------------------------------------------- 01 · cor do dia
def pg_cor_dia():
    sw = (f'<div class="dd-sw" style="background:{SOLG};grid-row:span 2;color:#05070F">'
          f'<div style="position:absolute;right:-30px;top:-30px">{sun(150)}</div>'
          f'<b style="font-size:30px">Sol</b><code>#FFB547 → #FF7A2F</code><span>A cor do dia. Pôr do sol, praia, bike, fim de tarde. Entra como detalhe, nunca como cor da marca.</span></div>'
          f'<div class="dd-sw" style="background:{SOL}"><b>Laranja sol</b><code>#FF7A2F · RGB 255 122 47</code><span>ícones de dia, chip, destaque no preto</span></div>'
          f'<div class="dd-sw" style="background:{SOLC}"><b>Sol claro</b><code>#FFB547 · RGB 255 181 71</code><span>só no início do degradê e no sol</span></div>'
          f'<div class="dd-sw" style="background:{PDS};grid-column:span 2;height:96px;color:#fff;flex-direction:row;align-items:flex-end;justify-content:space-between">'
          f'<div><b>Pôr do sol</b><br><code>#FFB547 → #FF7A2F → #9E19E9 → #6539CB → #452EFF</code><br><span>o dia virando noite: começa no sol e sempre termina no roxo</span></div>{I("v4-lockup-purple.svg", h=22)}</div>')
    prop = ('<div class="um-prop" style="height:30px">'
            f'<div style="flex:40;background:{PURPLE};color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;padding-left:8px">40 roxo</div>'
            '<div style="flex:32;background:#000;color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;padding-left:8px">32 preto</div>'
            '<div style="flex:12;background:#fff;color:#05070F;font-size:9px;font-weight:700;display:flex;align-items:center;padding-left:6px">12 branco</div>'
            '<div style="flex:9;background:#00E5E5;font-size:9px;font-weight:700;display:flex;align-items:center;padding-left:5px">9</div>'
            f'<div style="flex:7;background:{SOLG};font-size:9px;font-weight:700;display:flex;align-items:center;padding-left:4px">7</div></div>')
    cts = [(SOL, "#000000", "Sol no preto", "ok"), ("#05070F", SOL, "Ink no sol", "ok"), ("#FFFFFF", SOL, "Branco no sol", "título ≥ 24 px"),
           (SOL, "#FFFFFF", "Sol no branco", "não"), (SOL, "#6539CB", "Sol no roxo", "não")]
    ct = ""
    for fg, bg, nome, st in cts:
        cls = {"ok": "ok", "não": "no"}.get(st, "")
        sty = ' style="color:#B7791F"' if not cls else ""
        bd = "box-shadow:inset 0 0 0 1px #DCDDE5;" if bg == "#FFFFFF" else ""
        ct += f'<div><div class="bx" style="background:{bg};color:{fg};{bd}">Aa</div><span><b class="{cls}"{sty}>{st}</b> {nome} · {contrast(fg, bg):.1f}:1</span></div>'
    sim = ["Sol (o círculo) atrás de foto, do pin ou no canto da peça", "Ícones de rolê de dia: praia, bike, trilha, mar…", "Chip/tag “de dia”, “pôr do sol 17:48” com texto ink",
           "Uma palavra de destaque no preto (“de dia.”)", "Degradê pôr do sol em capa de rolê de dia, sempre terminando no roxo"]
    nao = ["Letras do logo (Rolê e Go não mudam)", "Fundo laranja chapado na peça inteira", "Texto laranja no branco ou no roxo",
           "Laranja e ciano na mesma palavra/título", "Laranja em peça de festa à noite"]
    return P("light", "Cor do dia · o sol", "A RolêGo continua roxo, ciano e preto. Pra falar dos rolês de dia (praia, pôr do sol, bike, trilha) entra um detalhe quente: o sol. Menos de 10% da peça.",
             f'<div style="display:grid;grid-template-columns:1.35fr 1fr;gap:20px;flex:1">'
             f'<div style="display:flex;flex-direction:column;gap:12px"><div style="display:grid;grid-template-columns:1.1fr 1fr;grid-template-rows:96px 96px auto;gap:10px">{sw}</div>'
             f'<div><div class="sub">Proporção numa peça de dia</div>{prop}<p class="note" style="font-size:9.5px;color:#5B6070">Roxo e preto continuam mandando. O sol é o tempero: nunca passa do ciano.</p></div></div>'
             f'<div style="display:flex;flex-direction:column;gap:12px"><div><div class="sub">Contraste</div><div class="dd-ct">{ct}</div></div>'
             f'<div class="dd-dd"><div><b class="ok">Onde entra</b><ul class="dd-rl" style="margin-top:7px">{"".join(f"<li>{x}</li>" for x in sim)}</ul></div>'
             f'<div><b class="no">Onde não entra</b><ul class="dd-rl no" style="margin-top:7px">{"".join(f"<li>{x}</li>" for x in nao)}</ul></div></div></div></div>')


# ---------------------------------------------------------------- 01 · dia e noite (híbrido)
def pg_dia_noite():
    noite = (f'<div class="dd-post" style="width:100%;height:410px;background-image:url({F("risada-festa", 700)})"><div class="ov" style="background:{GRADB}"></div>'
             f'<div class="t" style="bottom:56px;font-size:34px">Sexta tem<br><span style="color:#00E5E5">rolê.</span></div>'
             f'<div class="lg" style="left:16px;bottom:16px">{I("v4-lockup-purple.svg", h=20)}</div></div>')
    dia = (f'<div class="dd-post" style="width:100%;height:410px;background-image:url({FS("praia-tres-amigas", 700)})"><div class="ov" style="background:{FADE_PDS}"></div>'
           f'<div class="sn" style="right:18px;top:18px">{sun(46)}</div>'
           f'<div class="t" style="bottom:56px;font-size:34px">Domingo tem<br><span style="color:#00E5E5">pôr do sol.</span></div>'
           f'<div class="lg" style="left:16px;bottom:16px">{I("v4-lockup-purple.svg", h=20)}</div></div>')
    fica = ["Logo gomoso, Rolê branco + Go ciano", "Poppins, título itálico ExtraBold", "Roxo como superfície, preto no app", "Ciano no Go e no título grande", "A mesma galera e a mesma voz"]
    muda = ["Foto de dia: praia, bike, trilha, fim de tarde", "O sol (círculo) como detalhe", "Fade pôr do sol: laranja em cima, roxo embaixo", "Ícones e chips de dia em laranja", "Copy com hora do pôr do sol, ponto de encontro"]
    els = (f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
           f'<div class="dd-mi" style="background:#000;height:112px"><div style="position:relative;width:120px;height:80px;display:flex;align-items:center;justify-content:center">{sun(62, style="position:absolute;left:50%;top:50%;transform:translate(-18%,-78%)")}<div style="position:relative">{I("v4-go-dark.svg", h=58)}</div></div><small style="color:#9CA3AF">o sol atrás do pin</small></div>'
           f'<div class="dd-mi" style="background:{PURPLE};height:112px;align-items:flex-end"><div style="display:flex;flex-direction:column;align-items:center;width:100%">{sun(96, half=True)}<div style="height:2px;width:80%;background:#fff;opacity:.8"></div><div style="height:22px"></div></div><small style="color:rgba(255,255,255,.8)">horizonte</small></div>'
           f'<div class="dd-mi" style="background:{PDS};height:112px">{I("v4-lockup-purple.svg", h=22)}<small style="color:#fff">superfície pôr do sol</small></div>'
           f'<div class="dd-mi" style="background:#000;height:112px;flex-direction:column;gap:7px"><div style="display:flex;gap:5px">{chip_sol("pôr do sol 17:48", "pôr do sol")}</div>'
           f'<div style="display:flex;gap:5px"><span class="dd-chip c">hoje à noite</span>{chip_sol("de dia", "bike")}</div><small style="color:#9CA3AF">chips</small></div></div>')
    li = lambda xs, c: "".join(f'<li style="color:#D7D9E2">{x}</li>' for x in xs)
    return P("dark", "Dia e noite: a mesma RolêGo", "Rolê é festa e também é praia, pedal e pôr do sol. A peça de dia é a peça de noite com o sol entrando: o degradê começa laranja e termina no roxo da marca.",
             f'<div class="dd-cmp"><div><div class="dd-tag" style="color:#00E5E5">● Noite · festa</div>{noite}</div>'
             f'<div><div class="dd-tag" style="color:{SOL}">● Dia · pôr do sol</div>{dia}</div>'
             f'<div style="display:flex;flex-direction:column;gap:12px">{els}'
             f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div><div class="sub" style="color:#9CA3AF">Fica igual</div><ul class="dd-rl" style="--x:0">{li(fica, 0)}</ul></div>'
             f'<div><div class="sub" style="color:{SOL}">Entra de dia</div><ul class="dd-rl">{li(muda, 0)}</ul></div></div></div></div>')


# ---------------------------------------------------------------- 02 · rolês de dia: ícones e fotos
def pg_role_dia():
    ic = "".join(f'<div>{dicon(k, 30)}<span>{k}</span></div>' for k in DIA_ICONS)
    tr = [("loira-praia-sorriso", "", "Original", "luz dourada, céu limpo"), ("amigas-caminhando-praia", f'<div class="ov" style="position:absolute;inset:0;background:{FADE_PDS}"></div>', "Fade pôr do sol", "pra peça de marca, logo embaixo"),
          ("pulando-sunset", f'<div style="position:absolute;inset:0;background:{FADE_K}"></div>', "Fade pro preto", "pra app e stories")]
    lg = I("v4-lockup-purple.svg", h=16)
    trh = "".join(f'<div><div style="background-image:url({FS(n, 600)})">{o}'
                  + ("" if not o else f'<div style="position:absolute;left:12px;bottom:10px">{lg}</div>')
                  + f'</div><b>{t}</b><span>{d}</span></div>' for n, o, t, d in tr)
    return P("light", "Rolês de dia · ícones e fotos", "Mesma galera, mesma energia, outra hora do dia: praia, pedal no fim de tarde, trilha, vôlei, piquenique. Ícones no mesmo desenho dos ícones do app, só que na cor do sol.",
             f'<div style="display:grid;grid-template-columns:1.6fr 1fr;gap:22px;flex:1">'
             f'<div style="display:flex;flex-direction:column;gap:12px"><div class="sub">Fotografia de dia · tratamento</div><div class="dd-tr">{trh}</div>'
             f'<div class="dd-dd"><div><b class="ok">Sim</b><p>Meninas de 18 a 22, as mesmas do casting · praia, orla, ciclovia, mirante, trilha · fim de tarde e golden hour · em movimento: pedalando, pulando, rindo, de costas pro sol.</p></div>'
             f'<div><b class="no">Não</b><p>Sol do meio-dia estourado · foto de academia ou esporte de competição · capacete e roupa técnica como protagonista · nada sensual (biquíni em pose, close de corpo) · paisagem sem gente.</p></div></div></div>'
             f'<div style="display:flex;flex-direction:column;gap:10px"><div class="sub">Ícones de dia · grade 24 px, traço 2 px</div><div class="dd-ic">{ic}</div>'
             f'<p class="note" style="font-size:9.5px;color:#5B6070">No app, ícone de rolê de dia vai em laranja sol sobre preto; os de noite seguem com as cores de categoria. Fora do app, ícones em branco.</p></div></div>')


# ---------------------------------------------------------------- 03 · app de dia
def pg_app_dia():
    sb = '<div class="um-sb"><span>16:20</span><span>●●● 5G</span></div>'
    evs = [("praia-tres-amigas", "Pôr do sol no Arpoador", "hoje · 17h · 34 vão", "pôr do sol"),
           (None, "Pedal até o pôr do sol", "sáb · 16h · Ibirapuera · 21 vão", "bike"),
           ("amigos-praia-sunset", "Vôlei + mar", "dom · 15h · Posto 9 · 18 vão", "vôlei"),
           (None, "Trilha do Pico", "dom · 7h · 12 vão", "trilha")]
    ev = ""
    for ph, t, s, k in evs:
        cv = f'style="background-image:url({FS(ph, 160)})"' if ph else f'style="background:{PURPLE}"'
        inner = "" if ph else dicon(k, 22, SOL)
        ev += f'<div class="dd-ev"><i {cv}>{inner}</i><div style="flex:1"><b>{t}</b><span>{s}</span></div>{dicon(k, 14, SOL)}</div>'
    a = phone(f'{sb}<div style="padding:10px 12px 6px;display:flex;justify-content:space-between;align-items:center">{I("v4-lockup-dark.svg", h=14)}{sun(16)}</div>'
              f'<div class="dd-fl"><span class="dd-chip k">hoje à noite</span>{chip_sol("de dia", "pôr do sol")}<span class="dd-chip k">praia</span><span class="dd-chip k">bike</span></div>'
              f'<div style="padding:10px 12px 4px;font-size:15px;font-weight:800;font-style:italic;letter-spacing:-.03em;line-height:1">Rolês de <span style="color:{SOL}">dia.</span></div>'
              f'<div style="display:flex;flex-direction:column;gap:6px;padding:6px 10px">{ev}</div>', w=225, h=470)
    b = phone(f'<div style="height:225px;background:url({FS("ceu-dramatico-galera", 500)}) center 40%/cover;position:relative"><div style="position:absolute;inset:0;background:{FADE_K}"></div>'
              f'<div style="position:absolute;left:12px;bottom:10px;right:12px"><div style="display:flex;gap:4px;margin-bottom:5px">{chip_sol("pôr do sol 17:48", "pôr do sol")}</div>'
              f'<div style="font-size:17px;font-weight:800;font-style:italic;letter-spacing:-.03em;line-height:1">Pôr do sol<br>no Arpoador</div></div></div>'
              f'<div style="padding:10px 12px;font-size:8.5px;color:#D7D9E2;line-height:1.5">Hoje · 17h · encontro na pedra<br><span style="color:#9CA3AF">Leva canga. Depois tem açaí na orla.</span></div>'
              f'<div style="display:flex;align-items:center;gap:6px;padding:0 12px"><div class="avs" style="display:flex">{AV("risada-festa", "bar-loira", "confete-cabelo")}</div><span style="font-size:8px;color:#9CA3AF">Bia, Lu e +31 vão</span></div>'
              f'<div style="position:absolute;left:12px;right:12px;bottom:16px;display:flex;gap:6px"><span style="flex:1;text-align:center;background:{PURPLE};border-radius:99px;padding:8px;font-size:10px;font-weight:700">Bora</span>'
              f'<span style="flex:1;text-align:center;box-shadow:inset 0 0 0 1.5px #3A3D48;border-radius:99px;padding:8px;font-size:10px;font-weight:700">Ver quem vai</span></div>', w=225, h=470)
    push = (f'<div class="um-push" style="margin:0;background:#F4F4F8"><div style="width:26px;height:26px;border-radius:7px;background:{PURPLE};display:flex;align-items:center;justify-content:center;flex-shrink:0">{I("v4-go-white.svg", h=14)}</div>'
            f'<div><b>Pôr do sol hoje é 17:48 🌅</b><span>A galera tá indo pro Arpoador. Bora?</span></div><small>agora</small></div>')
    regras = ["Filtro “de dia” ao lado de “hoje à noite”: chip laranja com texto ink", "Card de rolê de dia: ícone laranja no canto; botão continua roxo",
              "Hora do pôr do sol vira dado do rolê (chip com o ícone)", "O app continua preto. Nada de modo claro só porque é dia", "Ícone do app e logo não mudam"]
    return P("dark", "App · rolês de dia", "O app ganha uma aba de dia sem virar outro app: mesmo preto, mesmo botão roxo, com o laranja marcando o que acontece com sol.",
             f'<div style="display:grid;grid-template-columns:auto auto 1fr;gap:26px;flex:1;align-items:start">{a}{b}'
             f'<div style="display:flex;flex-direction:column;gap:14px"><div><div class="sub" style="color:#9CA3AF">Notificação</div>{push}</div>'
             f'<div><div class="sub" style="color:#9CA3AF">Regras</div><ul class="dd-rl">{"".join(f"<li style=color:#D7D9E2>{x}</li>" for x in regras)}</ul></div>'
             f'<div><div class="sub" style="color:#9CA3AF">Ícones de dia no app</div><div style="display:flex;gap:12px">{"".join(dicon(k, 22) for k in DIA_ICONS)}</div></div></div></div>')


# ---------------------------------------------------------------- 04 · feed e stories de dia
def pg_redes_dia():
    s = 205
    p1 = (f'<div class="dd-post" style="width:{s}px;height:{s}px;background-image:url({FS("amigas-caminhando-praia", 500)})"><div class="ov" style="background:{FADE_K}"></div>'
          f'<div class="t" style="bottom:40px;font-size:24px">Domingo tem<br>rolê <span style="color:{SOL}">de dia.</span></div><div class="lg" style="left:16px;bottom:14px">{I("v4-lockup-dark.svg", h=14)}</div></div>')
    p2 = (f'<div class="dd-post" style="width:{s}px;height:{s}px;background:{PDS}"><div class="sn" style="left:50%;top:26px;transform:translateX(-50%)">{sun(70)}</div>'
          f'<div class="t" style="bottom:40px;font-size:24px">Pedal até o<br><span style="color:#00E5E5">pôr do sol.</span></div><div class="lg" style="left:16px;bottom:14px">{I("v4-lockup-purple.svg", h=14)}</div></div>')
    grid = "".join(f'<div style="display:flex;align-items:center;gap:5px;font-size:9px;font-weight:600;color:#D7D9E2">{dicon(k, 16)}{k}</div>' for k in ("praia", "bike", "trilha", "vôlei", "piquenique", "pôr do sol"))
    p3 = (f'<div class="dd-post" style="width:{s}px;height:{s}px;background:#000"><div class="t" style="top:18px;font-size:22px">Rolê não é<br>só de <span style="color:#00E5E5">noite.</span></div>'
          f'<div style="position:absolute;left:16px;right:16px;top:92px;display:grid;grid-template-columns:1fr 1fr;gap:8px">{grid}</div><div class="lg" style="left:16px;bottom:14px">{I("v4-lockup-dark.svg", h=14)}</div></div>')
    w, h = 158, 281
    s1 = (f'<div class="dd-post" style="width:{w}px;height:{h}px;background-image:url({FS("pulando-sunset", 400)})"><div class="ov" style="background:{FADE_PDS}"></div>'
          f'<div style="position:absolute;left:12px;top:14px;z-index:2">{chip_sol("pôr do sol 17:48", "pôr do sol")}</div>'
          f'<div class="t" style="left:12px;bottom:52px;font-size:20px">Partiu<br><span style="color:#00E5E5">praia.</span></div>'
          f'<div style="position:absolute;left:12px;right:12px;bottom:14px;z-index:2;background:#fff;color:#6539CB;border-radius:99px;text-align:center;font-size:9px;font-weight:700;padding:6px">Ver quem vai</div></div>')
    opts = "".join(f'<div style="display:flex;align-items:center;gap:7px;background:#1E1E25;border-radius:10px;padding:7px 9px;font-size:10px;font-weight:700">{dicon(k, 15)}{t}</div>' for k, t in (("praia", "Praia"), ("bike", "Pedal"), ("trilha", "Trilha")))
    s2 = (f'<div class="dd-post" style="width:{w}px;height:{h}px;background:#000"><div class="sn" style="right:-26px;top:-26px">{sun(90)}</div>'
          f'<div class="t" style="left:12px;top:74px;font-size:19px">Qual o rolê<br>de <span style="color:#00E5E5">domingo?</span></div>'
          f'<div style="position:absolute;left:12px;right:12px;top:140px;display:flex;flex-direction:column;gap:6px;z-index:2">{opts}</div>'
          f'<div class="lg" style="left:12px;bottom:14px">{I("v4-lockup-dark.svg", h=12)}</div></div>')
    cap = lambda t: f'<div style="font-size:9px;color:rgba(255,255,255,.75);margin-top:5px">{t}</div>'
    tiles = [("f", "risada-festa"), ("p", None), ("d", "loira-praia"), ("k", None), ("f", "bar-loira"), ("s", None), ("f", "confete-cabelo"), ("p", None), ("d", "multidao-golden-hour")]
    tl = ""
    for t, ph in tiles:
        if t == "f": st, ins = f"background:url({F(ph, 240)}) center 25%/cover", f'<div style="position:absolute;inset:0;background:{GRADB}"></div>'
        elif t == "d": st, ins = f"background:url({FS(ph, 240)}) center 35%/cover", f'<div style="position:absolute;inset:0;background:{FADE_PDS}"></div><div style="position:absolute;right:7px;top:7px">{sun(16)}</div>'
        elif t == "p": st, ins = f"background:{PURPLE}", f'<div style="position:absolute;left:8px;bottom:8px">{I("v4-go-white.svg", h=18)}</div>'
        elif t == "s": st, ins = f"background:{PDS}", f'<div style="position:absolute;left:50%;top:14px;transform:translateX(-50%)">{sun(30)}</div>'
        else: st, ins = "background:#000", f'<div style="position:absolute;left:8px;bottom:8px">{I("v4-go-dark.svg", h=18)}</div>'
        tl += f'<div style="height:96px;border-radius:6px;position:relative;overflow:hidden;{st}">{ins}</div>'
    grade = (f'<div style="display:flex;gap:18px;align-items:center;margin-top:16px"><div style="display:grid;grid-template-columns:repeat(9,96px);gap:4px">{tl}</div>'
             f'<div style="font-size:10px;line-height:1.5;color:rgba(255,255,255,.85);max-width:150px"><b style="display:block;font-size:11px;color:#fff">Na grade</b>Noite continua sendo a maioria. O dia entra a cada 3 posts, com o sol marcando.</div></div>')
    return P("purple", "Feed e stories · de dia", "Os mesmos templates com o sol entrando: foto de fim de tarde, fade pôr do sol e o laranja nos detalhes. No feed, no máximo 1 post de dia a cada 3, pra a grade continuar com cara de RolêGo.",
             f'<div style="display:flex;gap:14px;align-items:flex-start">'
             f'<div>{p1}{cap("Foto + fade pro preto · destaque laranja")}</div><div>{p2}{cap("Superfície pôr do sol · sol inteiro")}</div><div>{p3}{cap("Preto + ícones de dia")}</div>'
             f'<div style="width:1px;align-self:stretch;background:rgba(255,255,255,.25);margin:0 4px"></div>'
             f'<div>{s1}{cap("Story com foto · chip do pôr do sol")}</div><div>{s2}{cap("Story de enquete")}</div></div>{grade}')


# ---------------------------------------------------------------- 06 · merch e rua de dia
def pg_fisico_dia():
    canga = (f'<div style="width:180px;height:250px;border-radius:10px;background:{PDS};position:relative;overflow:hidden;box-shadow:0 12px 24px rgba(5,7,15,.2)">'
             f'<div style="position:absolute;left:50%;top:34px;transform:translateX(-50%)">{sun(78)}</div>'
             f'<div style="position:absolute;left:0;right:0;bottom:24px;display:flex;flex-direction:column;align-items:center;gap:6px">{I("v4-lockup-purple.svg", h=20)}<span class="slo" style="font-size:12px;color:#fff">Viva o <b style="color:#00E5E5">rolê.</b></span></div>'
             f'<div style="position:absolute;inset:auto 0 0 0;height:8px;background:repeating-linear-gradient(90deg,#fff 0 4px,transparent 4px 9px);opacity:.6"></div></div>')
    garrafa = (f'<div style="display:flex;flex-direction:column;align-items:center"><div style="width:26px;height:18px;border-radius:5px 5px 2px 2px;background:#1A1A1F"></div>'
               f'<div style="width:72px;height:210px;border-radius:22px;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;box-shadow:0 12px 24px rgba(5,7,15,.2)">'
               f'<div style="transform:rotate(-90deg);margin:28px 0">{I("v4-lockup-dark.svg", h=18)}</div>{sun(22)}</div></div>')
    bone = (f'<div style="position:relative;width:170px;height:120px"><div style="position:absolute;left:20px;top:10px;width:130px;height:86px;border-radius:70px 70px 10px 10px;background:{PURPLE};display:flex;align-items:center;justify-content:center">{I("v4-go-white.svg", h=40)}</div>'
            f'<div style="position:absolute;left:4px;top:86px;width:110px;height:20px;border-radius:0 0 40px 60px;background:#2A1A6E"></div>'
            f'<div style="position:absolute;right:26px;top:56px;width:14px;height:14px;border-radius:50%;background:{SOLG}"></div></div>')
    adesivos = (f'<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">'
                f'<div style="width:86px;height:86px;border-radius:50%;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px">{dicon("bike", 30)}<span style="font-size:8px;font-weight:800;font-style:italic;color:#fff">pedal do rolê</span></div>'
                f'<div style="width:86px;height:86px;border-radius:50%;background:{PDS};display:flex;align-items:center;justify-content:center">{I("v4-go-white.svg", h=40)}</div>'
                f'<div style="border-radius:99px;background:{SOLG};padding:8px 14px;font-size:11px;font-weight:800;font-style:italic;color:#05070F">partiu praia</div></div>')
    flag = (f'<div style="display:flex;align-items:flex-end;gap:2px;height:250px"><div style="width:4px;height:250px;background:#3A3D48;border-radius:2px"></div>'
            f'<div style="width:70px;height:236px;align-self:flex-start;border-radius:0 60px 6px 0;background:{PDS};display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:18px 0 22px">'
            f'{sun(34)}<div style="transform:rotate(-90deg);margin-bottom:60px">{I("v4-lockup-purple.svg", h=16)}</div></div></div>')
    lab = lambda t, d: f'<div style="font-size:10px;font-weight:700;margin-top:8px">{t}</div><div style="font-size:9px;color:#5B6070;max-width:180px">{d}</div>'
    return P("light", "Rolê de dia · merch e praia", "Coisas pra levar pro rolê de dia. O roxo e o preto seguem como base; o sol aparece no detalhe e no degradê pôr do sol.",
             f'<div style="display:flex;gap:30px;align-items:flex-end;flex:1;padding-bottom:6px;zoom:1.2">'
             f'<div>{canga}{lab("Canga", "Pôr do sol inteiro, sol em cima, logo embaixo no roxo.")}</div>'
             f'<div>{flag}{lab("Wind banner", "Pra marcar o ponto de encontro na praia.")}</div>'
             f'<div>{garrafa}{lab("Garrafinha de bike", "Preta, logo na vertical, sol pequeno.")}</div>'
             f'<div>{bone}{lab("Boné", "Roxo com Go branco; o sol é um botão na lateral.")}</div>'
             f'<div style="align-self:center">{adesivos}{lab("Adesivos", "Pra bike, prancha, garrafa. Texto ink no laranja.")}</div></div>')

# Páginas novas do documento final (assinatura noite/dia, cor do dia, dia e noite, rolês de dia, feed de dia,
# capa e contracapa), no layout das referências do card "Identidade visual final". Roda via exec() depois do _dia.py.

FINAL_CSS = """
.um-lead{font-size:11.5px;color:#5B6070;margin-top:-4px;max-width:900px;line-height:1.5}.dark .um-lead,.purple .um-lead{color:rgba(255,255,255,.78)}
.um-prop{display:flex;height:26px;border-radius:8px;overflow:hidden;margin:4px 0;box-shadow:inset 0 0 0 1px #DCDDE5}
.um-phone{border-radius:30px;background:#1A1A1F;padding:7px;box-shadow:0 14px 30px rgba(0,0,0,.25),inset 0 0 0 1px #2A2A33;flex-shrink:0}
.um-scr{width:100%;height:100%;border-radius:24px;overflow:hidden;position:relative;color:#fff}
.um-sb{display:flex;justify-content:space-between;font-size:8px;font-weight:700;padding:8px 14px 0}
.um-push{background:rgba(245,245,250,.86);color:#05070F;border-radius:14px;padding:8px 10px;display:flex;gap:8px;align-items:flex-start;margin:0 8px 6px}
.um-push b{font-size:8.5px;display:block}.um-push span{font-size:8.5px;line-height:1.3;display:block}.um-push small{font-size:7px;color:#7C8090;margin-left:auto}
.avs i{width:18px;height:18px;border-radius:50%;background-size:cover;background-position:center 25%;margin-right:-5px;box-shadow:0 0 0 2px #000;display:block}
/* banner (assinatura) */
.bn{border-radius:26px;position:relative;display:flex;overflow:hidden;color:#fff;flex-shrink:0}
.bn-l{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding-left:6%}
.dd-sw code{display:block;margin-top:4px}
.bn-c{width:37%;margin:14px;border-radius:20px;position:relative;overflow:hidden;background-size:cover}
.bn-c .v{position:absolute;inset:0;background:rgba(0,0,0,.56)}
.bn-c .tx{position:absolute;left:26px;right:16px;bottom:20px}
.bn-t{font-weight:800;font-style:italic;letter-spacing:-.035em;line-height:.98}
.bn-p{display:inline-block;border-radius:99px;background:linear-gradient(90deg,#9E19E9,#6539CB);font-weight:800;line-height:1}
.bn-s{font-weight:800;font-style:italic;letter-spacing:-.025em;line-height:1}
.as-r{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}
.as-r div{border-top:2px solid #05070F;padding-top:7px;font-size:9.5px;line-height:1.45;color:#5B6070}.as-r b{display:block;color:#05070F;font-size:11px}
/* ajustes nas páginas do v5 */
.toc3{display:grid;grid-template-columns:repeat(3,1fr);gap:0 34px;margin-top:2px}
.toc3 h4{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#6539CB;margin:10px 0 2px}
.toc3 h4:first-child{margin-top:0}.toc3 .ti{padding:3.5px 0}.toc3 .ti b{font-size:11.5px}.toc3 .ti span{font-size:11px}
.l5 .lgrid{grid-template-columns:repeat(5,minmax(0,1fr))}.l5 .lt{min-width:0}.l5 .lt code{word-break:break-all;font-size:7.6px;padding:1px 3px}.l5 .ltv img{min-width:0;object-fit:contain;max-width:84%}.l5 .lt p{min-height:40px}
.w5 .wgrid{grid-template-columns:repeat(5,minmax(0,1fr))}.w5 .wt{min-width:0}.w5 .wtv>:not(.xm){transform:scale(.72);flex-shrink:0}
.c10 .grads{grid-template-columns:1fr 1fr 1fr 1.4fr}.c10 .swg{grid-template-columns:repeat(10,1fr);gap:8px}.c10 .bar{height:26px}.c10 .prop .sub{margin-bottom:4px}.c10 .prop .bar+.sub{margin-top:7px}
.s4 .sl3{grid-template-columns:repeat(4,1fr)!important}.s4 .slc{min-width:0}.s4 .slc:not(.ctr) img{height:50px!important}.s4 .slc .slo{font-size:30px!important}.s4 .slc.ctr .slo{font-size:24px!important}.s4 .slc:not(.ctr){align-items:flex-start!important;padding-left:24px!important}.s4 .slc:not(.ctr) .slo{margin:6px 0 0 4px!important}
.slc.mel{background:#FF4D6A;color:#fff}.slc.mel .slo{color:#fff}.slc.mel .slo b{color:#6539CB}
"""


def banner(dia, w, h, photo, pos, title, pill=("Bora?", "4 vão")):
    """Assinatura das referências: marca + slogan à esquerda, card com foto à direita. Roxo = noite, melancia = dia."""
    bg, go = (MEL, ROXO2) if dia else (PURPLE, CY)
    k = h / 300
    return (f'<div class="bn" style="width:{w}px;height:{h}px;background:{bg}"><div class="bn-l">{lk(round(w * .115))}'.replace(f'fill="{ROXO2}"', f'fill="{go}"')
            + f'<div class="bn-s" style="font-size:{30 * k:.0f}px;margin-top:{20 * k:.0f}px">Viva o <span style="color:{go}">rolê.</span></div></div>'
            f'<div class="bn-c" style="background-image:url({photo});background-position:{pos}{";background-size:130% auto" if pos == PRAIA else ""}"><div class="v"></div><div class="tx">'
            f'<div class="bn-t" style="font-size:{38 * k:.0f}px">{title}</div>'
            f'<span class="bn-p" style="font-size:{15 * k:.1f}px;padding:{10 * k:.0f}px {22 * k:.0f}px;margin-top:{14 * k:.0f}px">{pill[0]} <span style="color:{CY}">{pill[1]}</span></span></div></div></div>')


PRAIA = "0% 38%"  # foto em 130% para tirar os pontos da borda direita do original
T_PRAIA = f'Sábado:<br>pôr do sol<br>na <span style="color:{MEL}">praia</span>'
T_FESTA = f'Sexta:<br>samba<br>no <span style="color:{CY}">largo</span>'


def cover():
    return (f'<section class="page light" style="padding-top:9mm;gap:12px">'
            f'<div style="display:flex;justify-content:space-between;align-items:baseline"><h2 style="font-size:30px">Identidade visual <b>final</b></h2>'
            f'<span class="eyebrow">Noite roxo + ciano · dia melancia · novembro 2026</span></div>'
            f'{banner(False, 1002, 306, F("risada-festa", 800), "center 30%", f"Sexta<br>tem<br><span style=color:{CY}>rolê.</span>", ("Bora?", "12 vão"))}'
            f'{banner(True, 1002, 306, FS("loira-praia", 800), PRAIA, T_PRAIA)}'
            f'<div class="foot"><span>RolêGo · identidade visual final · nov/2026</span><span>@@N@@</span></div></section>')


def contracapa():
    side = lambda bg, svg: (f'<div style="flex:1;background:{bg};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px">{svg}</div>')
    slo = lambda c: f'<div class="bn-s" style="font-size:34px;color:#fff">Viva o <span style="color:{c}">rolê.</span></div>'
    return (f'<section class="page" style="padding:0;flex-direction:row;gap:0;color:#fff">'
            f'{side(PURPLE, I("v4-stacked-purple.svg", h=220) + slo(CY))}'
            f'{side(MEL, I(os.path.join(OUT, "logo", "rolego-stacked-melancia.svg"), h=220) + slo(ROXO2))}'
            f'<div style="position:absolute;left:0;right:0;bottom:9mm;text-align:center;font-size:13px;font-weight:600">rolego.com.br · @rolego</div></section>')


# ---------------------------------------------------------------- assinatura noite / dia
def pg_assinatura():
    regras = [("Superfície", "Roxo em degradê de noite. Melancia chapada de dia."), ("Marca", "Rolê branco. Go ciano no roxo, Go roxo na melancia."),
              ("Slogan", "Embaixo do lockup; “rolê.” na cor do Go."), ("Card de foto", "À direita, canto bem redondo, véu preto de 55% por cima da foto."),
              ("Título", "Branco, até 3 linhas, uma palavra em cor: melancia se o rolê é de dia, ciano se é de noite."),
              ("Botão", "Pílula roxa: “Bora?” branco + quantos vão em ciano. Igual de dia e de noite.")]
    return P("light", "Assinatura: noite e dia", "A peça-mãe da marca: logo e slogan de um lado, o rolê do outro. A mesma montagem serve para banner de site, capa de evento, telão e anúncio; só a superfície muda.",
             f'<div class="dd-tag" style="color:#6539CB;margin-bottom:-4px">● Noite · roxo + ciano</div>{banner(False, 1002, 218, F("neon-rosa-azul", 700), "center 25%", T_FESTA, ("Bora?", "32 vão"))}'
             f'<div class="dd-tag" style="color:{MEL};margin-bottom:-4px">● Dia · melancia</div>{banner(True, 1002, 218, FS("loira-praia", 800), PRAIA, T_PRAIA)}'
             f'<div class="as-r" style="margin-top:4px">{"".join(f"<div><b>{a}</b>{b}</div>" for a, b in regras)}</div>')


# ---------------------------------------------------------------- cor do dia
def pg_cor_dia():
    sw = (f'<div class="dd-sw" style="background:{MEL};grid-row:span 2;color:#fff">'
          f'<div style="position:absolute;right:-34px;top:-34px">{sun(150, "#FFFFFF")}</div>'
          f'<div style="position:absolute;left:16px;top:16px">{lk(22)}</div>'
          f'<b style="font-size:34px">Melancia</b><code>#FF4D6A · RGB 255 77 106</code><span style="color:{INK};opacity:1;font-weight:600">A cor do dia: praia, pôr do sol, bike, fim de tarde. Chapada, sempre. Na melancia: Rolê branco + Go roxo.</span></div>'
          f'<div class="dd-sw" style="background:#000;color:#fff"><div style="position:absolute;right:14px;top:14px">{sun(30, MEL)}</div><b>No preto</b><code>#FF4D6A sobre #000</code><span>ícone, chip, palavra de destaque</span></div>'
          f'<div class="dd-sw" style="background:#fff;box-shadow:inset 0 0 0 1px #DCDDE5"><div style="position:absolute;right:14px;top:14px">{sun(30, MEL)}</div><b>No branco</b><code>só forma: sol, chip, bloco</code><span>nunca texto melancia no branco</span></div>'
          f'<div class="dd-sw" style="grid-column:span 2;height:96px;padding:0;flex-direction:row;background:none">'
          f'<div style="flex:1;background:{MEL};display:flex;align-items:center;justify-content:center;border-radius:14px 0 0 14px">{lk(22)}</div>'
          f'<div style="flex:1;background:{ROXO2};display:flex;align-items:center;justify-content:center">{lk(22, "#FFFFFF", CY)}</div>'
          f'<div style="flex:1;background:#000;display:flex;align-items:center;justify-content:center;border-radius:0 14px 14px 0">{lk(22, "#FFFFFF", CY)}</div></div>')
    seg = lambda f, bg, fg, t: f'<div style="flex:{f};background:{bg};color:{fg};font-size:9px;font-weight:700;display:flex;align-items:center;padding-left:7px;white-space:nowrap">{t}</div>'
    prop = ('<div class="um-prop" style="height:30px">' + seg(55, MEL, INK, "55 melancia") + seg(25, "#3A3D48", "#fff", "25 foto")
            + seg(12, "#fff", INK, "12 branco") + seg(8, ROXO2, "#fff", "8 roxo") + "</div>")
    cts = [("#FFFFFF", MEL, "Branco na melancia", "só ≥ 24 px", "mid"), (INK, MEL, "Tinta na melancia", "ok", "ok"), (ROXO2, MEL, "Roxo na melancia", "só logo e slogan", "mid"),
           (MEL, "#000000", "Melancia no preto", "ok", "ok"), (MEL, "#FFFFFF", "Melancia no branco", "não", "no"), (CY, MEL, "Ciano na melancia", "não", "no")]
    ct = ""
    for fg, bg, nome, st, cls in cts:
        sty = ' style="color:#9A6300"' if cls == "mid" else ""
        bd = "box-shadow:inset 0 0 0 1px #DCDDE5;" if bg == "#FFFFFF" else ""
        ct += f'<div><div class="bx" style="background:{bg};color:{fg};{bd}">Aa</div><span><b class="{cls}"{sty}>{st}</b><br>{nome} · {contrast(fg, bg):.1f}:1</span></div>'
    sim = ["Fundo melancia chapado em banner, post, story e capa de rolê de dia", "Bloco ou faixa melancia sobre a foto, com título branco grande", "Sol: círculo branco na melancia, melancia no preto",
           "Ícones de dia: tinta na melancia, melancia no preto", "Chip “de dia”, “pôr do sol 17:48”: melancia + texto tinta", "Uma palavra melancia no título sobre preto ou foto"]
    nao = ["Degradê na melancia (sol, céu, melancia → roxo)", "Melancia nas letras do logo", "Ciano em cima da melancia (nela o Go é roxo)",
           "Texto pequeno branco ou roxo na melancia (use tinta)", "Segunda cor de dia (rosa, areia, laranja)", "Trocar pela magenta de categoria #FF1F7A"]
    return P("light", "Cor do dia · melancia", "A noite continua roxo, ciano e preto. O dia ganha uma cor só, a melancia, chapada: vira fundo das peças de dia, faixa sobre a foto, sol e ícone. Na melancia, Rolê branco + Go roxo.",
             f'<div style="display:grid;grid-template-columns:1.35fr 1fr;gap:20px;flex:1">'
             f'<div style="display:flex;flex-direction:column;gap:12px"><div style="display:grid;grid-template-columns:1.1fr 1fr;grid-template-rows:118px 118px auto;gap:10px">{sw}</div>'
             f'<div><div class="sub">Proporção numa peça de dia</div>{prop}<p class="note">De dia a melancia é a cor que mais aparece. Roxo segura a marca no Go e no botão; o ciano só entra sobre roxo ou preto.</p></div></div>'
             f'<div style="display:flex;flex-direction:column;gap:12px"><div><div class="sub">Contraste (WCAG)</div><div class="dd-ct" style="grid-template-columns:repeat(3,1fr)">{ct}</div></div>'
             f'<div class="dd-dd"><div><b class="ok">Sim</b><ul class="dd-rl" style="margin-top:7px">{"".join(f"<li>{x}</li>" for x in sim)}</ul></div>'
             f'<div><b class="no">Não</b><ul class="dd-rl no" style="margin-top:7px">{"".join(f"<li>{x}</li>" for x in nao)}</ul></div></div></div></div>')


# ---------------------------------------------------------------- dia e noite
def pg_dia_noite():
    noite = (f'<div class="dd-post" style="width:100%;height:420px;background-image:url({F("risada-festa", 700)})"><div style="position:absolute;inset:0;background:{GRADB}"></div>'
             f'<div class="t" style="bottom:58px;font-size:36px">Sexta tem<br><span style="color:{CY}">rolê.</span></div>'
             f'<div class="lg" style="left:16px;bottom:16px">{I("v4-lockup-purple.svg", h=22)}</div></div>')
    dia = (f'<div class="dd-post" style="width:100%;height:420px;background:{MEL}">'
           f'<div style="position:absolute;left:10px;right:10px;top:10px;height:255px;border-radius:10px;background:url({FS("praia-tres-amigas", 700)}) center 40%/cover"></div>'
           f'<div class="sn" style="right:22px;top:22px">{sun(42, MEL)}</div>'
           f'<div class="t" style="bottom:58px;font-size:36px">Domingo tem<br><span style="color:{INK}">pôr do sol.</span></div>'
           f'<div class="lg" style="left:16px;bottom:16px">{lk(22)}</div></div>')
    fica = ["Logo gomoso, com o Rolê branco no roxo, no preto e na melancia", "Poppins, título itálico ExtraBold", "Roxo no ícone, no botão e no app preto", "Slogan “Viva o rolê.”", "A mesma galera e a mesma voz"]
    muda = ["Fundo melancia chapado nas peças de dia", "Na melancia o Go é roxo (nunca ciano)", "Foto com moldura ou faixa melancia", "Sol: círculo de uma cor só", "Ícones e chips de dia"]
    els = (f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
           f'<div class="dd-mi" style="background:#000;height:112px"><div style="position:relative;width:120px;height:80px;display:flex;align-items:center;justify-content:center">{sun(54, MEL, style="position:absolute;left:62px;top:2px")}<div style="position:relative">{I("v4-go-dark.svg", h=58)}</div></div><small style="color:#9CA3AF">sol atrás do pin</small></div>'
           f'<div class="dd-mi" style="background:{MEL};height:112px;align-items:flex-end"><div style="display:flex;flex-direction:column;align-items:center;width:100%">{sun(96, "#FFFFFF", half=True)}<div style="height:3px;width:80%;background:{INK}"></div><div style="height:24px"></div></div><small style="color:{INK}">horizonte</small></div>'
           f'<div class="dd-mi" style="background:{MEL};height:112px">{lk(24)}<small style="color:{INK}">superfície melancia</small></div>'
           f'<div class="dd-mi" style="background:#000;height:112px;flex-direction:column;gap:7px"><div style="display:flex;gap:5px">{chip_sol("pôr do sol 17:48", "pôr do sol")}</div>'
           f'<div style="display:flex;gap:5px"><span class="dd-chip c">hoje à noite</span>{chip_sol("de dia", "bike")}</div><small style="color:#9CA3AF">chips</small></div></div>')
    li = lambda xs: "".join(f'<li style="color:#D7D9E2">{x}</li>' for x in xs)
    return P("dark", "Dia e noite: a mesma RolêGo", "Rolê é festa e também é praia, pedal e pôr do sol. De noite, roxo e ciano. De dia, melancia com o Go roxo. Não há degradê entre os dois: cada peça é de um momento.",
             f'<div class="dd-cmp"><div><div class="dd-tag" style="color:{CY}">● Noite · festa</div>{noite}</div>'
             f'<div><div class="dd-tag" style="color:{MEL}">● Dia · pôr do sol</div>{dia}</div>'
             f'<div style="display:flex;flex-direction:column;gap:12px">{els}'
             f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div><div class="sub" style="color:#9CA3AF">Fica igual</div><ul class="dd-rl">{li(fica)}</ul></div>'
             f'<div><div class="sub" style="color:{MEL}">Entra de dia</div><ul class="dd-rl">{li(muda)}</ul></div></div></div></div>')


# ---------------------------------------------------------------- rolês de dia
def pg_role_dia():
    ic = "".join(f'<div style="background:{MEL if i % 2 == 0 else "#000"};color:{INK if i % 2 == 0 else "#D7D9E2"}">{dicon(k, 30, INK if i % 2 == 0 else MEL)}<span>{k}</span></div>'
                 for i, k in enumerate(DIA_ICONS))
    bg = lambda n: f'url({FS(n, 600)}) center 40%/cover'
    tr = [(f'<div style="background:{bg("loira-praia-sorriso")}"></div>', "Original", "luz dourada, céu limpo"),
          (f'<div style="background:{bg("loira-luz-mar")}"><div style="position:absolute;inset:0;background:{FADEB}"></div>'
           f'<div style="position:absolute;left:10px;bottom:12px;font-size:19px;font-weight:800;font-style:italic;letter-spacing:-.03em;line-height:1;color:#fff">Fim de<br><em style="color:{MEL}">tarde.</em></div></div>',
           "Fade pro preto", "texto branco, destaque melancia"),
          (f'<div style="background:{bg("amigas-caminhando-praia")}"><div style="position:absolute;left:0;right:0;bottom:0;height:64px;background:{MEL};display:flex;align-items:center;padding-left:12px">{lk(16)}</div></div>',
           "Faixa melancia", "foto em cima, bloco embaixo"),
          (f'<div style="background:{MEL}"><div style="position:absolute;inset:12px 12px 44px 12px;border-radius:8px;background:{bg("pulando-sunset")}"></div>'
           f'<div style="position:absolute;left:14px;bottom:13px">{lk(16)}</div><div style="position:absolute;right:14px;bottom:12px">{sun(18, "#FFFFFF")}</div></div>',
           "Moldura melancia", "a foto dentro da cor")]
    trh = "".join(f'<div>{box}<b>{t}</b><span>{d}</span></div>' for box, t, d in tr)
    return P("light", "Rolês de dia · ícones e fotos", "Mesma galera, outra hora do dia: praia, pedal no fim de tarde, trilha, vôlei, piquenique. A foto fica limpa e a melancia chega em bloco (faixa ou moldura), nunca como filtro por cima.",
             f'<div style="display:grid;grid-template-columns:1.9fr 1fr;gap:22px;flex:1">'
             f'<div style="display:flex;flex-direction:column;gap:12px"><div class="sub">Fotografia de dia · tratamento</div><div class="dd-tr">{trh}</div>'
             f'<div class="dd-dd"><div><b class="ok">Sim</b><p>Meninas de 18 a 22, as mesmas do casting · praia, orla, ciclovia, mirante, trilha · fim de tarde e golden hour · em movimento: pedalando, pulando, rindo, de costas pro sol · rosto no enquadramento.</p></div>'
             f'<div><b class="no">Não</b><p>Filtro ou degradê colorido por cima da foto · sol do meio-dia estourado · foto de academia ou esporte de competição · nada sensual (biquíni em pose, recorte de corpo) · paisagem sem gente.</p></div></div></div>'
             f'<div style="display:flex;flex-direction:column;gap:10px"><div class="sub">Ícones de dia · grade 24 px, traço 2 px</div><div class="dd-ic">{ic}</div>'
             f'<p class="note">Na melancia o ícone é tinta; no preto, melancia. Os ícones de noite seguem com as cores de categoria.</p></div></div>')


# ---------------------------------------------------------------- feed e stories de dia
def pg_redes_dia():
    s = 205
    m = lambda t: f'<span style="color:{MEL}">{t}</span>'
    k = lambda t: f'<span style="color:{INK}">{t}</span>'
    p1 = (f'<div class="dd-post" style="width:{s}px;height:{s}px;background-image:url({FS("amigas-caminhando-praia", 500)})"><div style="position:absolute;inset:0;background:{FADEB}"></div>'
          f'<div class="t" style="bottom:36px;font-size:21px">Domingo tem<br>rolê {m("de dia.")}</div><div class="lg" style="left:16px;bottom:12px">{I("v4-lockup-dark.svg", h=13)}</div></div>')
    p2 = (f'<div class="dd-post" style="width:{s}px;height:{s}px;background:{MEL}"><div class="sn" style="left:50%;top:22px;transform:translateX(-50%)">{sun(80, "#FFFFFF")}</div>'
          f'<div class="t" style="bottom:40px;font-size:24px">Pedal até o<br>{k("pôr do sol.")}</div><div class="lg" style="left:16px;bottom:14px">{lk(14)}</div></div>')
    names = ("praia", "bike", "trilha", "vôlei", "piquenique", "pôr do sol")
    grid = "".join(f'<div style="display:flex;align-items:center;gap:5px;font-size:9px;font-weight:700">{dicon(n, 16, MEL)}{n}</div>' for n in names)
    p3 = (f'<div class="dd-post" style="width:{s}px;height:{s}px;background:#000"><div class="t" style="top:18px;font-size:22px">Rolê não é<br>só de {m("noite.")}</div>'
          f'<div style="position:absolute;left:16px;right:16px;top:92px;display:grid;grid-template-columns:1fr 1fr;gap:9px">{grid}</div><div class="lg" style="left:16px;bottom:14px">{I("v4-lockup-dark.svg", h=14)}</div></div>')
    w, h = 158, 281
    s1 = (f'<div class="dd-post" style="width:{w}px;height:{h}px;background-image:url({FS("pulando-sunset", 500)});background-position:center"><div style="position:absolute;inset:0;background:{FADEB}"></div>'
          f'<div style="position:absolute;left:12px;top:12px;z-index:2">{chip_sol("pôr do sol 17:48", "pôr do sol")}</div>'
          f'<div class="t" style="left:12px;bottom:46px;font-size:20px">Partiu<br>{m("praia.")}</div>'
          f'<div style="position:absolute;left:12px;right:12px;bottom:12px;z-index:2;background:#fff;color:{ROXO2};border-radius:99px;text-align:center;font-size:9px;font-weight:700;padding:6px">Ver quem vai</div></div>')
    opts = "".join(f'<div style="display:flex;align-items:center;gap:7px;background:#1E1E25;border-radius:10px;padding:7px 9px;font-size:10px;font-weight:700">{dicon(n, 15, MEL)}{t}</div>' for n, t in (("praia", "Praia"), ("bike", "Pedal"), ("trilha", "Trilha")))
    s2 = (f'<div class="dd-post" style="width:{w}px;height:{h}px;background:#000"><div class="sn" style="right:-26px;top:-26px">{sun(90, MEL)}</div>'
          f'<div class="t" style="left:12px;top:78px;font-size:19px">Qual o rolê<br>de {m("domingo?")}</div>'
          f'<div style="position:absolute;left:12px;right:12px;top:140px;display:flex;flex-direction:column;gap:6px;z-index:2">{opts}</div>'
          f'<div class="lg" style="left:12px;bottom:14px">{I("v4-lockup-dark.svg", h=12)}</div></div>')
    cap = lambda t: f'<div style="font-size:9px;color:rgba(255,255,255,.78);margin-top:5px">{t}</div>'
    tiles = [("f", "risada-festa"), ("p", None), ("d", "loira-praia"), ("k", None), ("f", "bar-loira"), ("o", None), ("f", "confete-cabelo"), ("p", None), ("d", "multidao-golden-hour")]
    tl = ""
    for t, photo in tiles:
        ins = ""
        if t == "f": st, ins = f"background:url({F(photo, 240)}) center 25%/cover", f'<div style="position:absolute;inset:0;background:{GRADB}"></div>'
        elif t == "d": st, ins = f"background:url({FS(photo, 240)}) 0% 35%/{'130% auto' if photo == 'loira-praia' else 'cover'}", f'<div style="position:absolute;right:8px;top:8px">{sun(18, MEL)}</div>'
        elif t == "o": st, ins = f"background:{MEL}", f'<div style="position:absolute;left:50%;top:18px;transform:translateX(-50%)">{sun(36, "#FFFFFF")}</div><div style="position:absolute;left:8px;bottom:8px">{gs(18)}</div>'
        elif t == "p": st, ins = f"background:{PURPLE}", f'<div style="position:absolute;left:8px;bottom:8px">{I("v4-go-white.svg", h=18)}</div>'
        else: st, ins = "background:#000", f'<div style="position:absolute;left:8px;bottom:8px">{I("v4-go-dark.svg", h=18)}</div>'
        tl += f'<div style="height:96px;border-radius:6px;position:relative;overflow:hidden;{st}">{ins}</div>'
    grade = (f'<div style="display:flex;gap:18px;align-items:center;margin-top:20px"><div style="display:grid;grid-template-columns:repeat(9,96px);gap:4px">{tl}</div>'
             f'<div style="font-size:10px;line-height:1.5;color:rgba(255,255,255,.85);max-width:140px"><b style="display:block;font-size:11px;color:#fff">Na grade</b>A noite continua sendo a maioria. O dia entra a cada 3 posts, com o sol ou a melancia marcando.</div></div>')
    return P("purple", "Feed e stories · de dia", "Os mesmos templates com o sol entrando: foto de fim de tarde, melancia no destaque ou como superfície chapada, sol de uma cor só.",
             f'<div style="display:flex;gap:14px;align-items:flex-start;margin-top:6px">'
             f'<div>{p1}{cap("Foto + fade pro preto · destaque melancia")}</div><div>{p2}{cap("Superfície melancia · sol inteiro")}</div><div>{p3}{cap("Preto + ícones de dia")}</div>'
             f'<div style="width:1px;align-self:stretch;background:rgba(255,255,255,.25);margin:0 4px"></div>'
             f'<div>{s1}{cap("Story com foto · chip do pôr do sol")}</div><div>{s2}{cap("Story de enquete")}</div></div>{grade}')

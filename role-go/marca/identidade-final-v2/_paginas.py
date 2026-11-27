# Páginas novas do documento final v2 (capa, assinatura, terceira cor, dia e noite, rolês de dia, feed de dia).
# Roxo e ciano são as principais; melancia só em texto ou detalhe, nunca no fundo. Roda via exec() depois do _dia.py.

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
.bn-c{width:37%;margin:14px;border-radius:20px;position:relative;overflow:hidden;background-size:cover}
.bn-c .v{position:absolute;inset:0;background:rgba(0,0,0,.6)}
.bn-c .tx{position:absolute;left:26px;right:16px;bottom:20px}
.bn-t{font-weight:800;font-style:italic;letter-spacing:-.035em;line-height:.98}
.bn-p{display:inline-block;border-radius:99px;background:linear-gradient(90deg,#9E19E9,#6539CB);font-weight:800;line-height:1}
.bn-s{font-weight:800;font-style:italic;letter-spacing:-.025em;line-height:1}
.as-r{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}
.as-r div{border-top:2px solid #6539CB;padding-top:7px;font-size:9.5px;line-height:1.45;color:#5B6070}.as-r b{display:block;color:#05070F;font-size:11px}
/* terceira cor */
.tc{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.tc>div>div{height:150px;border-radius:14px;position:relative;overflow:hidden;background-size:cover;background-position:center 35%;color:#fff;display:flex;flex-direction:column;justify-content:flex-end;padding:14px}
.tc b.n{display:block;font-size:10px;margin-top:5px}.tc span.d{font-size:9px;color:#5B6070}
.tc .t{position:relative;font-size:24px;font-weight:800;font-style:italic;letter-spacing:-.035em;line-height:.95}
/* ajustes nas páginas do v5 */
.toc3{display:grid;grid-template-columns:repeat(3,1fr);gap:0 34px;margin-top:2px}
.toc3 h4{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#6539CB;margin:10px 0 2px}
.toc3 h4:first-child{margin-top:0}.toc3 .ti{padding:3.5px 0}.toc3 .ti b{font-size:11.5px}.toc3 .ti span{font-size:11px}
.l4 .ltv img{object-fit:contain}
.w5 .wgrid{grid-template-columns:repeat(5,minmax(0,1fr))}.w5 .wt{min-width:0}.w5 .wtv>:not(.xm){transform:scale(.72);flex-shrink:0}
.c10 .swg{grid-template-columns:repeat(10,1fr);gap:8px}
"""


def banner(w, h, photo, pos, title, pill=("Bora?", "4 vão"), preto=False):
    """Assinatura: marca + slogan à esquerda, card com foto à direita. Superfície roxa (principal) ou preta."""
    bg = "#000" if preto else PURPLE
    k = h / 300
    marca = I("v4-lockup-dark.svg", h=round(w * .115)) if preto else lk(round(w * .115))
    return (f'<div class="bn" style="width:{w}px;height:{h}px;background:{bg}"><div class="bn-l">{marca}'
            f'<div class="bn-s" style="font-size:{30 * k:.0f}px;margin-top:{20 * k:.0f}px">Viva o <span style="color:{CY}">rolê.</span></div></div>'
            f'<div class="bn-c" style="background-image:url({photo});background-position:{pos}{";background-size:130% auto" if pos == PRAIA else ""}"><div class="v"></div><div class="tx">'
            f'<div class="bn-t" style="font-size:{38 * k:.0f}px">{title}</div>'
            f'<span class="bn-p" style="font-size:{15 * k:.1f}px;padding:{10 * k:.0f}px {22 * k:.0f}px;margin-top:{14 * k:.0f}px">{pill[0]} <span style="color:{CY}">{pill[1]}</span></span></div></div></div>')


PRAIA = "0% 38%"  # foto em 130% para tirar os pontos da borda direita do original
T_PRAIA = f'Sábado:<br>pôr do sol<br>na <span style="color:{MEL}">praia</span>'


def cover():
    return (f'<section class="page light" style="padding-top:9mm;gap:12px">'
            f'<div style="display:flex;justify-content:space-between;align-items:baseline"><h2 style="font-size:30px">Identidade visual <b>final</b></h2>'
            f'<span class="eyebrow">Roxo + ciano · melancia no detalhe · novembro 2026</span></div>'
            f'{banner(1002, 306, FS("loira-praia", 800), PRAIA, T_PRAIA)}'
            f'{banner(1002, 306, F("risada-festa", 800), "center 30%", f"Sexta<br>tem<br><span style=color:{CY}>rolê.</span>", ("Bora?", "12 vão"), preto=True)}'
            f'<div class="foot"><span>{FOOT}</span><span>@@N@@</span></div></section>')


# ---------------------------------------------------------------- assinatura
def pg_assinatura():
    regras = [("Superfície", "Roxo (principal) ou preto. Nunca melancia."), ("Marca", "Rolê branco. Go ciano no roxo, ciano → azul no preto."),
              ("Slogan", "Embaixo do lockup; “rolê.” em ciano."), ("Card de foto", "À direita, canto bem redondo, véu preto de 60% por cima da foto."),
              ("Título", "Branco, até 3 linhas, uma palavra em cor: ciano é o padrão; melancia quando o rolê é de dia."),
              ("Botão", "Pílula roxa: “Bora?” branco + quantos vão em ciano. Igual de dia e de noite.")]
    noite = banner(1002, 218, F("neon-rosa-azul", 700), "center 25%", f'Sexta:<br>samba<br>no <span style="color:{CY}">largo</span>', ("Bora?", "32 vão"))
    return P("light", "Assinatura: noite e dia", "A peça-mãe da marca: logo e slogan de um lado, o rolê do outro. De dia e de noite a superfície, a marca e o botão são os mesmos; muda a foto e a cor de uma palavra.",
             f'<div class="dd-tag" style="color:#6539CB;margin-bottom:-4px">● Noite · palavra em ciano</div>{noite}'
             f'<div class="dd-tag" style="color:#6539CB;margin-bottom:-4px">● Dia · uma palavra em melancia</div>{banner(1002, 218, FS("loira-praia", 800), PRAIA, T_PRAIA)}'
             f'<div class="as-r" style="margin-top:4px">{"".join(f"<div><b>{a}</b>{b}</div>" for a, b in regras)}</div>')


# ---------------------------------------------------------------- terceira cor
def pg_cor_dia():
    m = lambda t: f'<span style="color:{MEL}">{t}</span>'
    usos = [
        (f'<div style="background:#000"><div class="t">Rolê de<br>{m("dia.")}</div></div>', "Uma palavra no preto", "o uso principal"),
        (f'<div style="background-image:url({FS("amigas-caminhando-praia", 600)})"><i style="position:absolute;inset:0;background:{FADEB}"></i><div class="t">Domingo<br>na {m("praia.")}</div></div>',
         "Uma palavra sobre a foto", "com fade ou véu escuro atrás"),
        (f'<div style="background:#000;justify-content:center;align-items:center;flex-direction:row;gap:18px">{dicon("praia", 34)}{dicon("bike", 34)}{dicon("trilha", 34)}{dicon("pôr do sol", 34)}</div>',
         "Ícone de dia", "traço melancia no preto"),
        (f'<div style="background:{PURPLE}"><i style="position:absolute;right:16px;top:16px">{sun(18)}</i>{lk(24)}</div>', "Ponto de sol no roxo", "pequeno, enfeite; sem texto melancia"),
        (f'<div style="background:#000;justify-content:center;align-items:center;gap:8px">{chip_sol("pôr do sol 17:48", "pôr do sol")}</div>', "Texto curto", "horário, selo de dia"),
        (f'<div style="background:#fff;box-shadow:inset 0 0 0 1px #DCDDE5;color:{INK}"><div class="t">Rolê de<br>{m("domingo.")}</div></div>', "No branco, só título grande", "nunca em texto corrido"),
    ]
    ex = "".join(f'<div>{box}<b class="n">{t}</b><span class="d">{d}</span></div>' for box, t, d in usos)
    seg = lambda f, bg, fg, t: f'<div style="flex:{f};background:{bg};color:{fg};font-size:9px;font-weight:700;display:flex;align-items:center;padding-left:7px;white-space:nowrap">{t}</div>'
    prop = ('<div class="um-prop" style="height:30px">' + seg(45, PURPLE, "#fff", "45 roxo") + seg(30, "#000", "#fff", "30 preto") + seg(15, "#fff", INK, "15 claro")
            + seg(7, CY, INK, "7 ciano") + seg(3, MEL, INK, "") + "</div>")
    cts = [(MEL, "#000000", "Melancia no preto", "ok", "ok"), (MEL, "#FFFFFF", "Melancia no branco", "só ≥ 24 px", "mid"), (MEL, ROXO2, "Melancia no roxo", "sem texto", "no")]
    ct = ""
    for fg, bg, nome, st, cls in cts:
        sty = ' style="color:#9A6300"' if cls == "mid" else ""
        bd = "box-shadow:inset 0 0 0 1px #DCDDE5;" if bg == "#FFFFFF" else ""
        ct += f'<div><div class="bx" style="background:{bg};color:{fg};{bd}">Aa</div><span><b class="{cls}"{sty}>{st}</b><br>{nome} · {contrast(fg, bg):.1f}:1</span></div>'
    sim = ["Terceira cor: aparece em até 3% da peça", "Uma palavra do título ou um texto curto", "Ícone de dia e ponto de sol", "Um detalhe melancia por peça: a palavra, os ícones ou o ponto"]
    nao = ["Fundo melancia ou laranja, em qualquer peça", "Card, faixa, moldura, botão ou chip preenchido", "Produto ou merch nessa cor", "Melancia nas letras do logo ou no Go",
           "Melancia no lugar do roxo ou do ciano", "Texto melancia sobre roxo"]
    return P("light", "Terceira cor · melancia", "Roxo e ciano são as cores principais, de dia e de noite. A melancia #FF4D6A entra como terceira cor, só em texto ou detalhe, para marcar o que é de dia. Nunca vira fundo.",
             f'<div style="display:grid;grid-template-columns:1.55fr 1fr;gap:22px;flex:1">'
             f'<div style="display:flex;flex-direction:column;gap:10px"><div class="sub" style="margin:0">Onde ela entra</div><div class="tc">{ex}</div>'
             f'<div><div class="sub">Proporção numa peça</div>{prop}<p class="note">A fatia fina no fim é a melancia: ela nunca passa disso.</p></div></div>'
             f'<div style="display:flex;flex-direction:column;gap:14px"><div><div class="sub">Contraste (WCAG)</div><div class="dd-ct">{ct}</div></div>'
             f'<div class="dd-dd"><div><b class="ok">Sim</b><ul class="dd-rl" style="margin-top:7px">{"".join(f"<li>{x}</li>" for x in sim)}</ul></div>'
             f'<div><b class="no">Não</b><ul class="dd-rl no" style="margin-top:7px">{"".join(f"<li>{x}</li>" for x in nao)}</ul></div></div></div></div>')


# ---------------------------------------------------------------- dia e noite
def pg_dia_noite():
    noite = (f'<div class="dd-post" style="width:100%;height:420px;background-image:url({F("risada-festa", 700)})"><div style="position:absolute;inset:0;background:{GRADB}"></div>'
             f'<div class="t" style="bottom:58px;font-size:36px">Sexta tem<br><span style="color:{CY}">rolê.</span></div>'
             f'<div class="lg" style="left:16px;bottom:16px">{I("v4-lockup-purple.svg", h=22)}</div></div>')
    dia = (f'<div class="dd-post" style="width:100%;height:420px;background-image:url({FS("praia-tres-amigas", 800)});background-position:center"><div style="position:absolute;inset:0;background:{FADEB}"></div>'
           f'<div class="t" style="bottom:58px;font-size:36px">Domingo tem<br><span style="color:{MEL}">pôr do sol.</span></div>'
           f'<div class="lg" style="left:16px;bottom:16px">{lk(22)}</div></div>')
    fica = ["Roxo e ciano como cores principais", "Logo: Rolê branco, Go ciano", "Poppins, título itálico ExtraBold", "Botão roxo e app preto", "A mesma galera e a mesma voz"]
    muda = ["Foto com luz natural: praia, pedal, trilha", "Uma palavra em melancia sobre preto ou foto escura", "Ponto de sol pequeno", "Ícones de dia em melancia no preto", "Nunca fundo melancia ou laranja"]
    els = (f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
           f'<div class="dd-mi" style="background:#000;height:112px"><div style="position:relative">{I("v4-go-dark.svg", h=58)}<div style="position:absolute;right:-14px;top:-2px">{sun(14)}</div></div><small style="color:#9CA3AF">ponto de sol no pin</small></div>'
           f'<div class="dd-mi" style="background:{PURPLE};height:112px">{lk(24)}<div style="position:absolute;right:14px;top:14px">{sun(12)}</div><small>superfície roxa</small></div>'
           f'<div class="dd-mi" style="background:#0F0F13;height:112px;gap:14px">{"".join(dicon(k, 24) for k in ("praia", "bike", "trilha"))}<small style="color:#9CA3AF">ícones</small></div>'
           f'<div class="dd-mi" style="background:#0F0F13;height:112px;flex-direction:column;gap:7px"><div style="display:flex;gap:5px">{chip_sol("pôr do sol 17:48", "pôr do sol")}</div>'
           f'<div style="display:flex;gap:5px"><span class="dd-chip c">hoje à noite</span><span class="dd-chip" style="background:{ROXO2};color:#fff">de dia</span></div><small style="color:#9CA3AF">chips</small></div></div>')
    li = lambda xs: "".join(f'<li style="color:#D7D9E2">{x}</li>' for x in xs)
    return P("dark", "Dia e noite: a mesma RolêGo", "Rolê é festa e também é praia, pedal e pôr do sol. As cores principais não mudam: roxo e ciano. De dia entra a luz natural na foto e um detalhe melancia.",
             f'<div class="dd-cmp"><div><div class="dd-tag" style="color:{CY}">● Noite · festa</div>{noite}</div>'
             f'<div><div class="dd-tag" style="color:{MEL}">● Dia · pôr do sol</div>{dia}</div>'
             f'<div style="display:flex;flex-direction:column;gap:12px">{els}'
             f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div><div class="sub" style="color:#9CA3AF">Fica igual</div><ul class="dd-rl">{li(fica)}</ul></div>'
             f'<div><div class="sub" style="color:{CY}">Entra de dia</div><ul class="dd-rl">{li(muda)}</ul></div></div></div></div>')


# ---------------------------------------------------------------- rolês de dia
def pg_role_dia():
    ic = "".join(f'<div style="background:{"#000" if i % 2 == 0 else PURPLE};color:#fff">{dicon(k, 30, MEL if i % 2 == 0 else "#FFFFFF")}<span>{k}</span></div>'
                 for i, k in enumerate(DIA_ICONS))
    bg = lambda n: f'url({FS(n, 600)}) center 40%/cover'
    tr = [(f'<div style="background:{bg("loira-praia-sorriso")}"></div>', "Original", "luz natural, céu limpo"),
          (f'<div style="background:{bg("loira-luz-mar")}"><div style="position:absolute;inset:0;background:{FADEB}"></div>'
           f'<div style="position:absolute;left:10px;bottom:12px;font-size:19px;font-weight:800;font-style:italic;letter-spacing:-.03em;line-height:1;color:#fff">Fim de<br><em style="color:{MEL}">tarde.</em></div></div>',
           "Fade pro preto", "uma palavra melancia"),
          (f'<div style="background:{bg("amigas-caminhando-praia")}"><div style="position:absolute;left:0;right:0;bottom:0;height:64px;background:{PURPLE};display:flex;align-items:center;padding-left:12px">{lk(16)}</div></div>',
           "Faixa roxa", "foto em cima, bloco embaixo"),
          (f'<div style="background:{PURPLE}"><div style="position:absolute;inset:12px 12px 44px 12px;border-radius:8px;background:{bg("pulando-sunset")}"></div>'
           f'<div style="position:absolute;left:14px;bottom:13px">{lk(16)}</div><div style="position:absolute;right:16px;bottom:17px">{sun(10)}</div></div>',
           "Moldura roxa", "com o ponto de sol")]
    trh = "".join(f'<div>{box}<b>{t}</b><span>{d}</span></div>' for box, t, d in tr)
    return P("light", "Rolês de dia · ícones e fotos", "Mesma galera, outra hora do dia: praia, pedal no fim de tarde, trilha, vôlei, piquenique. A foto fica limpa, a marca segue roxa e ciano e a melancia entra só no detalhe.",
             f'<div style="display:grid;grid-template-columns:1.9fr 1fr;gap:22px;flex:1">'
             f'<div style="display:flex;flex-direction:column;gap:12px"><div class="sub">Fotografia de dia · tratamento</div><div class="dd-tr">{trh}</div>'
             f'<div class="dd-dd"><div><b class="ok">Sim</b><p>Meninas de 18 a 22, as mesmas do casting · praia, orla, ciclovia, mirante, trilha · fim de tarde · em movimento: pedalando, pulando, rindo, de costas pro sol · rosto no enquadramento.</p></div>'
             f'<div><b class="no">Não</b><p>Filtro ou degradê quente por cima da foto · foto em que o laranja toma o fundo inteiro · sol do meio-dia estourado · nada sensual (biquíni em pose, recorte de corpo) · paisagem sem gente.</p></div></div></div>'
             f'<div style="display:flex;flex-direction:column;gap:10px"><div class="sub">Ícones de dia · grade 24 px, traço 2 px</div><div class="dd-ic">{ic}</div>'
             f'<p class="note">No preto o ícone pode ser melancia; no roxo é branco. Os ícones de noite seguem com as cores de categoria.</p></div></div>')


# ---------------------------------------------------------------- feed e stories de dia
def pg_redes_dia():
    s = 205
    m = lambda t: f'<span style="color:{MEL}">{t}</span>'
    c = lambda t: f'<span style="color:{CY}">{t}</span>'
    p1 = (f'<div class="dd-post" style="width:{s}px;height:{s}px;background-image:url({FS("amigas-caminhando-praia", 500)})"><div style="position:absolute;inset:0;background:{FADEB}"></div>'
          f'<div class="t" style="bottom:36px;font-size:21px">Domingo tem<br>rolê {m("de dia.")}</div><div class="lg" style="left:16px;bottom:12px">{I("v4-lockup-dark.svg", h=13)}</div></div>')
    p2 = (f'<div class="dd-post" style="width:{s}px;height:{s}px;background:{PURPLE}"><div class="sn" style="right:22px;top:22px">{sun(34)}</div>'
          f'<div class="t" style="bottom:40px;font-size:24px">Pedal até o<br>{c("pôr do sol.")}</div><div class="lg" style="left:16px;bottom:14px">{lk(14)}</div></div>')
    names = ("praia", "bike", "trilha", "vôlei", "piquenique", "pôr do sol")
    grid = "".join(f'<div style="display:flex;align-items:center;gap:5px;font-size:9px;font-weight:700">{dicon(n, 16)}{n}</div>' for n in names)
    p3 = (f'<div class="dd-post" style="width:{s}px;height:{s}px;background:#000"><div class="t" style="top:18px;font-size:22px">Rolê não é<br>só de {c("noite.")}</div>'
          f'<div style="position:absolute;left:16px;right:16px;top:92px;display:grid;grid-template-columns:1fr 1fr;gap:9px">{grid}</div><div class="lg" style="left:16px;bottom:14px">{I("v4-lockup-dark.svg", h=14)}</div></div>')
    w, h = 158, 281
    s1 = (f'<div class="dd-post" style="width:{w}px;height:{h}px;background-image:url({FS("pulando-sunset", 500)});background-position:center"><div style="position:absolute;inset:0;background:rgba(0,0,0,.18)"></div><div style="position:absolute;inset:0;background:{FADEB}"></div>'
          f'<div style="position:absolute;left:12px;top:12px;z-index:2">{chip_sol("pôr do sol 17:48", "pôr do sol", "#fff")}</div>'
          f'<div class="t" style="left:12px;bottom:46px;font-size:20px">Partiu<br>{m("praia.")}</div>'
          f'<div style="position:absolute;left:12px;right:12px;bottom:12px;z-index:2;background:#fff;color:{ROXO2};border-radius:99px;text-align:center;font-size:9px;font-weight:700;padding:6px">Ver quem vai</div></div>')
    opts = "".join(f'<div style="display:flex;align-items:center;gap:7px;background:#000;border-radius:10px;padding:7px 9px;font-size:10px;font-weight:700">{dicon(n, 15)}{t}</div>' for n, t in (("praia", "Praia"), ("bike", "Pedal"), ("trilha", "Trilha")))
    s2 = (f'<div class="dd-post" style="width:{w}px;height:{h}px;background:{PURPLE}">'
          f'<div class="t" style="left:12px;top:78px;font-size:19px">Qual o rolê<br>de {c("domingo?")}</div>'
          f'<div style="position:absolute;left:12px;right:12px;top:140px;display:flex;flex-direction:column;gap:6px;z-index:2">{opts}</div>'
          f'<div class="lg" style="left:12px;bottom:14px">{lk(12)}</div></div>')
    cap = lambda t: f'<div style="font-size:9px;color:#5B6070;margin-top:5px">{t}</div>'
    tiles = [("f", "risada-festa"), ("p", None), ("d", "loira-praia"), ("k", None), ("f", "bar-loira"), ("o", None), ("f", "confete-cabelo"), ("p", None), ("d", "praia-tres-amigas")]
    tl = ""
    for t, photo in tiles:
        ins = ""
        if t == "f": st, ins = f"background:url({F(photo, 240)}) center 25%/cover", f'<div style="position:absolute;inset:0;background:{GRADB}"></div>'
        elif t == "d": st, ins = f"background:url({FS(photo, 240)}) 0% 35%/{'130% auto' if photo == 'loira-praia' else 'cover'}", f'<div style="position:absolute;right:8px;top:8px">{sun(12)}</div>'
        elif t == "o": st, ins = f"background:{PURPLE}", f'<div style="position:absolute;right:10px;top:10px">{sun(16)}</div><div style="position:absolute;left:8px;bottom:8px">{gs(18, CY)}</div>'
        elif t == "p": st, ins = f"background:{PURPLE}", f'<div style="position:absolute;left:8px;bottom:8px">{I("v4-go-white.svg", h=18)}</div>'
        else: st, ins = "background:#000", f'<div style="position:absolute;left:8px;bottom:8px">{I("v4-go-dark.svg", h=18)}</div>'
        tl += f'<div style="height:96px;border-radius:6px;position:relative;overflow:hidden;{st}">{ins}</div>'
    grade = (f'<div style="display:flex;gap:18px;align-items:center;margin-top:20px"><div style="display:grid;grid-template-columns:repeat(9,96px);gap:4px">{tl}</div>'
             f'<div style="font-size:10px;line-height:1.5;color:#5B6070;max-width:140px"><b style="display:block;font-size:11px;color:#05070F">Na grade</b>A grade continua roxa, preta e foto. O dia entra a cada 3 posts, marcado pelo ponto de sol.</div></div>')
    return P("light", "Feed e stories · de dia", "Os mesmos templates com o sol entrando: foto de luz natural, superfícies roxa e preta, ciano no destaque e a melancia só em uma palavra, nos ícones ou no ponto de sol.",
             f'<div style="display:flex;gap:14px;align-items:flex-start;margin-top:6px">'
             f'<div>{p1}{cap("Foto + fade · uma palavra melancia")}</div><div>{p2}{cap("Roxo · ciano + ponto de sol")}</div><div>{p3}{cap("Preto + ícones melancia")}</div>'
             f'<div style="width:1px;align-self:stretch;background:#DCDDE5;margin:0 4px"></div>'
             f'<div>{s1}{cap("Story com foto · selo do pôr do sol")}</div><div>{s2}{cap("Story de enquete")}</div></div>{grade}')

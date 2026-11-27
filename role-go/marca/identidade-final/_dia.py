# RolêGo · identidade visual final · camada de dia: MELANCIA #FF4D6A chapada (sem degradê).
# Noite não muda (roxo, ciano, preto). Na melancia: Rolê branco + Go roxo #6539CB.
# Roda via exec() dentro do _build.py, depois dos helpers (P, I, F, FS, phone, AV, PURPLE...).
import re as _re

MEL, INK, ROXO2, CY = "#FF4D6A", "#05070F", "#6539CB", "#00E5E5"
PILL = "linear-gradient(90deg,#9E19E9,#6539CB)"
FADEB = "linear-gradient(180deg,rgba(0,0,0,0) 38%,rgba(0,0,0,.9) 100%)"
GRADB = "linear-gradient(180deg,rgba(0,0,0,0) 35%,rgba(101,57,203,.6) 65%,rgba(69,46,255,.95) 100%)"

_d = lambda f: _re.findall(r' d="([^"]+)"', open(os.path.join(V5, f)).read())
_ROLE_D, _GOL_D = _d("v4-lockup-white.svg"); _GO_D = _d("v4-go-white.svg")[0]


def lk(h, role="#FFFFFF", go=ROXO2):
    """Lockup chapado: na melancia = Rolê branco + Go roxo; no roxo = Rolê branco + Go ciano."""
    return (f'<svg viewBox="0 0 989 256" style="height:{h}px;display:block"><path fill-rule="evenodd" fill="{role}" d="{_ROLE_D}"/>'
            f'<path fill-rule="evenodd" fill="{go}" d="{_GOL_D}"/></svg>')


def gs(h, c=ROXO2):
    return f'<svg viewBox="0 0 256 256" style="height:{h}px;width:{h}px;display:block"><path fill-rule="evenodd" fill="{c}" d="{_GO_D}"/></svg>'


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


def dicon(k, size=26, color=MEL, sw=2):
    return (f'<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="{color}" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round">{DIA_ICONS[k]}</svg>')


def sun(size=80, color="#FFFFFF", half=False, style=""):
    """O sol, chapado: um círculo de uma cor só (branco na melancia, melancia no preto/roxo)."""
    h = size / 2 if half else size
    return (f'<div style="width:{size}px;height:{h:.0f}px;border-radius:{size}px {size}px {"0 0" if half else f"{size}px {size}px"};'
            f'background:{color};{style}"></div>')


def chip_sol(txt, ic=None, bg=MEL, fg=INK):
    i = dicon(ic, 11, fg, 2.4) if ic else ""
    return f'<span class="dd-chip" style="background:{bg};color:{fg}">{i}{txt}</span>'


DD_CSS = """
.dd-sw{border-radius:16px;padding:14px 16px;display:flex;flex-direction:column;justify-content:flex-end;color:#05070F;position:relative;overflow:hidden}
.dd-sw b{font-size:20px;font-weight:800;font-style:italic;letter-spacing:-.03em;line-height:1}
.dd-sw code{font-size:9px;background:none;padding:0;color:inherit;opacity:.8}.dd-sw span{font-size:9.5px;line-height:1.4;opacity:.85;margin-top:3px}
.dd-chip{display:inline-flex;align-items:center;gap:4px;border-radius:99px;padding:3px 10px;font-size:9px;font-weight:700;white-space:nowrap}
.dd-chip.c{background:#00E5E5;color:#05070F}.dd-chip.k{background:#1E1E25;color:#fff}
.dd-rl{list-style:none;font-size:10.5px;line-height:1.45;display:flex;flex-direction:column;gap:7px}
.dd-rl li{display:flex;gap:8px;align-items:flex-start}.dd-rl li:before{content:"";flex-shrink:0;width:9px;height:9px;border-radius:50%;margin-top:3px;background:#FF4D6A}
.dd-rl.no li:before{background:none;box-shadow:inset 0 0 0 2px #E5484D}
.dd-ct{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}
.dd-ct div span{display:block;font-size:9px;color:#5B6070;margin-top:4px;line-height:1.3}
.dd-ct .bx{height:58px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;font-style:italic}
.dd-post{border-radius:14px;position:relative;overflow:hidden;flex-shrink:0;background-size:cover;background-position:center 35%;color:#fff}
.dd-post .t{position:absolute;left:16px;right:16px;font-weight:800;font-style:italic;letter-spacing:-.035em;line-height:.95;z-index:2}
.dd-post .lg{position:absolute;z-index:2}
.dd-post .sn{position:absolute;z-index:1}
.dd-band{position:absolute;left:0;right:0;bottom:0;background:#FF4D6A;z-index:1}
.dd-ic{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.dd-ic div{border-radius:12px;height:92px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;font-size:8.5px;font-weight:700}
.dd-tr{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
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


# ---------------------------------------------------------------- 03 · app de dia
def pg_app_dia():
    sb = '<div class="um-sb"><span>16:20</span><span>●●● 5G</span></div>'
    evs = [("praia-tres-amigas", "Pôr do sol no Arpoador", "hoje · 17h · 34 vão", "pôr do sol"),
           (None, "Pedal até o pôr do sol", "sáb · 16h · Ibirapuera · 21 vão", "bike"),
           ("amigos-praia-sunset", "Vôlei + mar", "dom · 15h · Posto 9 · 18 vão", "vôlei"),
           (None, "Trilha do Pico", "dom · 7h · 12 vão", "trilha")]
    ev = ""
    for ph, t, s, k in evs:
        cv = f'style="background-image:url({FS(ph, 160)})"' if ph else f'style="background:{MEL}"'
        inner = "" if ph else dicon(k, 22, INK)
        ev += f'<div class="dd-ev"><i {cv}>{inner}</i><div style="flex:1"><b>{t}</b><span>{s}</span></div>{dicon(k, 14, MEL)}</div>'
    a = phone(f'{sb}<div style="padding:10px 12px 6px;display:flex;justify-content:space-between;align-items:center">{I("v4-lockup-dark.svg", h=14)}{sun(16, MEL)}</div>'
              f'<div class="dd-fl"><span class="dd-chip k">hoje à noite</span>{chip_sol("de dia", "pôr do sol")}<span class="dd-chip k">praia</span><span class="dd-chip k">bike</span></div>'
              f'<div style="margin:10px 10px 4px;background:{MEL};border-radius:12px;padding:10px;position:relative;overflow:hidden">'
              f'<div style="position:absolute;right:-14px;top:-14px">{sun(54, "#FFFFFF")}</div>'
              f'<div style="font-size:15px;font-weight:800;font-style:italic;letter-spacing:-.03em;line-height:1;color:#fff;position:relative">Rolês<br>de dia.</div>'
              f'<div style="font-size:7.5px;color:{INK};margin-top:4px;font-weight:600;position:relative">pôr do sol hoje 17:48</div></div>'
              f'<div style="display:flex;flex-direction:column;gap:6px;padding:6px 10px">{ev}</div>', w=225, h=470)
    b = phone(f'<div style="height:220px;background:url({FS("ceu-dramatico-galera", 500)}) center 40%/cover"></div>'
              f'<div style="background:{MEL};padding:12px">{chip_sol("pôr do sol 17:48", "pôr do sol", "#fff", INK)}'
              f'<div style="font-size:18px;font-weight:800;font-style:italic;letter-spacing:-.03em;line-height:1;margin-top:6px;color:#fff">Pôr do sol<br>no Arpoador</div>'
              f'<div style="font-size:8.5px;color:{INK};margin-top:6px;line-height:1.45;font-weight:500">Hoje · 17h · encontro na pedra<br>Leva canga. Depois tem açaí na orla.</div></div>'
              f'<div style="display:flex;align-items:center;gap:6px;padding:10px 12px"><div class="avs" style="display:flex">{AV("risada-festa", "bar-loira", "confete-cabelo")}</div><span style="font-size:8px;color:#9CA3AF">Bia, Lu e +31 vão</span></div>'
              f'<div style="position:absolute;left:12px;right:12px;bottom:16px;display:flex;gap:6px"><span style="flex:1;text-align:center;background:{PURPLE};border-radius:99px;padding:8px;font-size:10px;font-weight:700">Bora</span>'
              f'<span style="flex:1;text-align:center;box-shadow:inset 0 0 0 1.5px #3A3D48;border-radius:99px;padding:8px;font-size:10px;font-weight:700">Ver quem vai</span></div>', w=225, h=470)
    push = (f'<div class="um-push" style="margin:0;background:#F4F4F8"><div style="width:26px;height:26px;border-radius:7px;background:{PURPLE};display:flex;align-items:center;justify-content:center;flex-shrink:0">{I("v4-go-white.svg", h=14)}</div>'
            f'<div><b>Pôr do sol hoje é 17:48 🌅</b><span>A galera tá indo pro Arpoador. Bora?</span></div><small>agora</small></div>')
    regras = ["Aba “de dia” abre com um card melancia chapado no topo", "Rolê de dia sem foto: capa melancia com ícone tinta",
              "Detalhe do rolê de dia: foto limpa + bloco melancia com título branco e texto tinta", "Botão principal continua roxo; o app continua preto", "Ícone do app e logo não mudam"]
    return P("dark", "App · rolês de dia", "O app ganha uma aba de dia sem virar outro app: mesmo preto, mesmo botão roxo, com blocos melancia chapados marcando o que acontece com sol.",
             f'<div style="display:grid;grid-template-columns:auto auto 1fr;gap:26px;flex:1;align-items:start">{a}{b}'
             f'<div style="display:flex;flex-direction:column;gap:14px"><div><div class="sub" style="color:#9CA3AF">Notificação</div>{push}</div>'
             f'<div><div class="sub" style="color:#9CA3AF">Regras</div><ul class="dd-rl">{"".join(f"<li style=color:#D7D9E2>{x}</li>" for x in regras)}</ul></div>'
             f'<div><div class="sub" style="color:#9CA3AF">Ícones de dia no app</div><div style="display:flex;gap:12px">{"".join(dicon(k, 22) for k in DIA_ICONS)}</div></div></div></div>')


# ---------------------------------------------------------------- 06 · merch e praia
def pg_fisico_dia():
    canga = (f'<div style="width:180px;height:250px;border-radius:10px;background:{MEL};position:relative;overflow:hidden;box-shadow:0 12px 24px rgba(5,7,15,.2)">'
             f'<div style="position:absolute;left:50%;top:34px;transform:translateX(-50%)">{sun(80, "#FFFFFF")}</div>'
             f'<div style="position:absolute;left:0;right:0;bottom:24px;display:flex;flex-direction:column;align-items:center;gap:6px">{lk(20)}<span class="slo" style="font-size:12px;color:#fff">Viva o <b style="color:{ROXO2}">rolê.</b></span></div>'
             f'<div style="position:absolute;inset:auto 0 0 0;height:8px;background:repeating-linear-gradient(90deg,#fff 0 4px,transparent 4px 9px);opacity:.7"></div></div>')
    garrafa = (f'<div style="display:flex;flex-direction:column;align-items:center"><div style="width:26px;height:18px;border-radius:5px 5px 2px 2px;background:#1A1A1F"></div>'
               f'<div style="width:72px;height:210px;border-radius:22px;background:{MEL};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;box-shadow:0 12px 24px rgba(5,7,15,.2)">'
               f'<div style="transform:rotate(-90deg);margin:28px 0">{lk(18)}</div>{sun(22, "#FFFFFF")}</div></div>')
    bone = (f'<div style="position:relative;width:170px;height:120px"><div style="position:absolute;left:20px;top:10px;width:130px;height:86px;border-radius:70px 70px 10px 10px;background:{MEL};display:flex;align-items:center;justify-content:center">{gs(40)}</div>'
            f'<div style="position:absolute;left:4px;top:86px;width:110px;height:20px;border-radius:0 0 40px 60px;background:#000"></div></div>')
    adesivos = (f'<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">'
                f'<div style="width:86px;height:86px;border-radius:50%;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px">{dicon("bike", 30)}<span style="font-size:8px;font-weight:800;font-style:italic;color:#fff">pedal do rolê</span></div>'
                f'<div style="width:86px;height:86px;border-radius:50%;background:{MEL};display:flex;align-items:center;justify-content:center">{gs(40)}</div>'
                f'<div style="border-radius:99px;background:{MEL};padding:8px 14px;font-size:11px;font-weight:800;font-style:italic;color:{INK}">partiu praia</div></div>')
    flag = (f'<div style="display:flex;align-items:flex-end;gap:2px;height:250px"><div style="width:4px;height:250px;background:#3A3D48;border-radius:2px"></div>'
            f'<div style="width:70px;height:236px;align-self:flex-start;border-radius:0 60px 6px 0;background:{MEL};display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:18px 0 22px">'
            f'{sun(34, "#FFFFFF")}<div style="transform:rotate(-90deg);margin-bottom:60px">{lk(16)}</div></div></div>')
    lab = lambda t, d: f'<div style="font-size:10px;font-weight:700;margin-top:8px">{t}</div><div style="font-size:9px;color:#5B6070;max-width:180px">{d}</div>'
    return P("light", "Rolê de dia · merch e praia", "Coisas pra levar pro rolê de dia, em melancia chapada: Rolê branco, Go roxo, sol branco. Sem degradê.",
             f'<div style="display:flex;gap:30px;align-items:flex-end;justify-content:center;margin:auto 0;zoom:1.2">'
             f'<div>{canga}{lab("Canga", "Melancia inteira, sol branco em cima, logo embaixo.")}</div>'
             f'<div>{flag}{lab("Wind banner", "Pra marcar o ponto de encontro na praia.")}</div>'
             f'<div>{garrafa}{lab("Garrafinha de bike", "Melancia, logo na vertical, sol branco.")}</div>'
             f'<div>{bone}{lab("Boné", "Melancia com Go roxo, aba preta.")}</div>'
             f'<div style="align-self:center">{adesivos}{lab("Adesivos", "Pra bike, prancha, garrafa. Texto tinta na melancia.")}</div></div>')

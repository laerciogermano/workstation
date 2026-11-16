# Páginas de fotografia de festa do manual v5 (logo gomosa).
# Rodado via exec dentro de _build.py: usa page, I, uri, foto, PURPLE, slogan do escopo de lá.
# Fotos: ../fotos-festa (Pexels, uso interno — ver README de lá). Classes com prefixo fx- para não colidir.

GRAD = "linear-gradient(180deg,rgba(158,25,233,0) 35%,rgba(101,57,203,.55) 62%,rgba(69,46,255,.92) 100%)"
FADE = "linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(0,0,0,.92) 100%)"


def bg(name, pos="center 30%", w=900):
    return f"background:url({foto(name, w)}) {pos}/cover"


def ph(name, cls="", pos="center 30%", inner="", style="", w=900):
    return f'<div class="fx-ph {cls}" style="{bg(name, pos, w)};{style}">{inner}</div>'


FESTA_CSS = """
.fx-ph{position:relative;overflow:hidden;border-radius:14px;background-color:#111}
.fx-ph .g{position:absolute;inset:0}
.fx-cap{position:absolute;left:10px;bottom:8px;font-size:9px;font-weight:600;color:#fff;letter-spacing:.04em;text-transform:uppercase;text-shadow:0 1px 4px rgba(0,0,0,.6);z-index:3}
.fx-mos{display:grid;grid-template-columns:repeat(5,1fr);grid-template-rows:repeat(3,166px);gap:8px;flex:1}
.fx-mos .w2{grid-column:span 2}.fx-mos .h2{grid-row:span 2}
.fx-two{display:grid;grid-template-columns:1fr 250px;gap:22px;flex:1;min-height:0}
.fx-rules{display:flex;flex-direction:column;gap:12px}
.fx-rules .kv2 span{display:block;font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#00E5E5;margin-bottom:3px}
.fx-rules .kv2 p{font-size:10.5px;line-height:1.45;color:#D7D9E2}
.fx-sw{display:flex;gap:6px;margin-top:4px}.fx-sw i{width:26px;height:26px;border-radius:8px;display:block}
.fx-tr{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.fx-tr .fx-ph{height:300px}
.fx-tr>div>b{display:block;font-size:12px;margin-top:8px}.fx-tr>div>p{font-size:10px;color:#5B6070;line-height:1.4;margin-top:2px}
.fx-duo{filter:grayscale(1) contrast(1.15) brightness(1.05)}
.fx-duo-ov{position:absolute;inset:0;background:linear-gradient(135deg,#9E19E9,#452EFF 60%,#00E5E5);mix-blend-mode:multiply}
.fx-logo{position:absolute;z-index:3}
.fx-t{position:absolute;z-index:3;color:#fff;font-weight:800;font-style:italic;letter-spacing:-.035em;line-height:.95}
.fx-t b{color:#00E5E5}
.fx-feed{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;align-content:start}
.fx-post{aspect-ratio:1/1;height:auto;border-radius:10px}
.fx-feed .lb{font-size:10px;color:#5B6070;margin-top:5px;font-weight:600}
.fx-chip{position:absolute;z-index:3;background:#00E5E5;color:#000;font-weight:800;font-size:10px;border-radius:99px;padding:4px 10px}
.fx-chipw{position:absolute;z-index:3;background:#fff;color:#05070F;font-weight:700;font-size:10px;border-radius:99px;padding:4px 10px}
.fx-av{position:absolute;z-index:3;display:flex;align-items:center;font-size:9.5px;color:#fff;font-weight:600}
.fx-av i{width:22px;height:22px;border-radius:50%;border:2px solid #fff;margin-right:-7px;background-size:cover;background-position:center 25%}
.fx-av i:last-of-type{margin-right:8px}
.fx-pol{position:absolute;z-index:2;background:#fff;padding:9px 9px 34px;border-radius:4px;box-shadow:0 10px 24px rgba(0,0,0,.35)}
.fx-pol div{width:100%;height:100%;background-size:cover;background-position:center 30%}
.fx-stg{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;align-items:start}.fx-stg>.fx-rules{grid-column:1/-1;display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.fx-st{width:100%;height:372px;border-radius:16px}
.fx-st+span,.fx-stw span{display:block;font-size:10px;color:#9CA3AF;margin-top:6px;font-weight:600}
.fx-poll{position:absolute;z-index:3;left:22px;right:22px;background:#fff;border-radius:12px;padding:9px 10px;transform:rotate(-3deg);color:#05070F;text-align:center}
.fx-poll b{display:block;font-size:12px;font-style:italic;font-weight:800;margin-bottom:6px}
.fx-poll div{display:flex;gap:6px}.fx-poll span{flex:1;border-radius:8px;background:#F0F0F5;font-size:10px;font-weight:700;padding:5px 0}
.fx-poll span:first-child{background:PURPLE;color:#fff}
.fx-bar{position:absolute;left:10px;right:10px;top:9px;height:2px;display:flex;gap:3px;z-index:3}.fx-bar i{flex:1;background:rgba(255,255,255,.4);border-radius:2px}.fx-bar i.on{background:#fff}
.fx-look{display:grid;grid-template-columns:300px 1fr;gap:22px;flex:1;min-height:0}
.fx-look>.fx-ph{height:100%}
.fx-items{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;align-content:start}
.fx-it{background:#fff;border-radius:14px;padding:10px 10px 10px;display:flex;flex-direction:column;align-items:center;box-shadow:0 1px 0 #E2E3EA}
.fx-it .v{height:118px;width:100%;display:flex;align-items:center;justify-content:center;position:relative}
.fx-it b{font-size:11px;align-self:flex-start;margin-top:6px}.fx-it p{font-size:9.5px;color:#5B6070;line-height:1.35;align-self:flex-start}
.fx-gar{position:relative;display:flex;align-items:center;justify-content:center}
.fx-gar .pr{position:absolute;display:flex;flex-direction:column;align-items:center;gap:3px}
.fx-party{display:grid;grid-template-columns:1.35fr 1fr 1fr;grid-template-rows:250px 250px;gap:12px;flex:1}
.fx-party .r2{grid-row:span 2}
.fx-party .fx-ph{height:100%}
.fx-party .lb{position:absolute;left:10px;bottom:8px;z-index:4;font-size:10px;font-weight:700;color:#fff;background:rgba(0,0,0,.55);border-radius:99px;padding:3px 9px}
.fx-led{position:absolute;z-index:2;border-radius:6px;background:PURPLE;display:flex;align-items:center;justify-content:center;box-shadow:0 0 30px rgba(158,25,233,.8),0 0 70px rgba(69,46,255,.5)}
.fx-wb{position:absolute;z-index:3;height:22px;border-radius:5px;display:flex;align-items:center;gap:6px;padding:0 9px;font-size:9px;font-weight:800;font-style:italic;color:#fff}
.fx-camp{display:grid;grid-template-columns:1.6fr 1fr;gap:16px;flex:1}
.fx-bill{position:relative;height:250px;border-radius:6px;overflow:hidden}
.fx-pole{width:14px;height:40px;background:#2A2D38;margin:0 auto}
"""

# ---------------------------------------------------------------- fotografia · quem aparece
mos = [("neon-hexagono-roxo", "h2", "center 20%", "Luz roxa"), ("club-luzes-azuis", "", "center 25%", "Na pista"),
       ("risada-festa", "", "center 20%", "Rindo"), ("roda-gigante-ciano", "h2", "center 25%", "Ciano"),
       ("neon-rosa-azul", "h2", "center 20%", "Rosa + azul"), ("danca-cabelo", "", "center 30%", "Dançando"),
       ("confete-festa", "", "center 25%", "Confete"), ("festival-sorriso", "w2", "center 35%", "Festival"),
       ("show-de-costas", "", "center 30%", "No show"), ("oculos-coracao", "", "center 25%", "Fim de tarde"), ("platinada-neon", "", "center 20%", "Neon")]
mg = "".join(ph(n, c, p, f'<span class="fx-cap">{t}</span>') for n, c, p, t in mos)
page("Fotografia · quem aparece", "dark", "Fotografia · festa", "Elas no rolê: a cara da <b style='color:#00E5E5'>RolêGo</b>", f"""
<div class="fx-two"><div class="fx-mos">{mg}</div>
<div class="fx-rules">
<div class="kv2"><span>Quem</span><p>Meninas de 18 a 22 anos, loiras, pele clara, olhos claros. Sozinhas ou com as amigas: sempre parecendo que estão no meio do rolê, nunca posando pra catálogo.</p></div>
<div class="kv2"><span>Onde</span><p>Pista, show, festival, rooftop, roda-gigante, open bar de aniversário. Noite ou fim de tarde dourado.</p></div>
<div class="kv2"><span>Luz</span><p>A luz da festa é a luz da marca: neon roxo, azul, ciano e um toque de rosa. Se a foto puxa pra verde, amarelo ou laranja, não entra.</p>
<div class="fx-sw"><i style="background:#9E19E9"></i><i style="background:#6539CB"></i><i style="background:#452EFF"></i><i style="background:#00E5E5"></i><i style="background:#FF1F7A"></i></div></div>
<div class="kv2"><span>Clima</span><p>Movimento, cabelo voando, confete, riso aberto, mão pra cima. Nada sensual: o foco é a diversão e as amigas.</p></div>
<div class="kv2"><span>Uso</span><p style="color:#9CA3AF">Fotos de banco (Pexels) só para manual e protótipo. Para campanha publicada, fotografar com contrato de imagem.</p></div>
</div></div>""")

# ---------------------------------------------------------------- fotografia · tratamento
T = "parede-luzes-roxo"
trs = [("Original", ph(T, pos="center 25%"), "Quando a luz já é roxa/azul, a foto entra sem filtro."),
       ("Degradê roxo", ph(T, pos="center 25%", inner=f'<div class="g" style="background:{GRAD}"></div><div class="fx-logo" style="left:16px;bottom:16px">{I("v4-lockup-purple.svg", h=26)}</div>'), "Padrão de post e capa. Logo sempre em cima do degradê."),
       ("Duotone roxo → ciano", f'<div class="fx-ph" style="height:300px"><div class="g fx-duo" style="{bg(T, "center 25%")}"></div><div class="fx-duo-ov"></div><div class="fx-logo" style="left:16px;bottom:16px">{I("v4-go-white.svg", h=40)}</div></div>', "Para foto com luz fora da paleta ou várias fotos juntas."),
       ("Fade pro preto", ph(T, pos="center 25%", inner=f'<div class="g" style="background:{FADE}"></div><div class="fx-t" style="left:16px;bottom:16px;font-size:30px">Viva o<br><b>rolê.</b></div>'), "Stories e app: texto em cima do preto, foto em cima.")]
page("Fotografia · tratamento", "light", "Fotografia · tratamento", "Quatro jeitos de tratar a foto", f"""
<div class="fx-tr">{''.join(f'<div>{v}<b>{t}</b><p>{d}</p></div>' for t, v, d in trs)}</div>
<div class="dd" style="margin-top:6px"><div><b class="ok">Sim</b><p>Degradê do roxo da marca (#9E19E9 → #452EFF) de baixo pra cima · logo no canto, sobre a parte escura · rosto sempre fora do degradê.</p></div>
<div><b class="no">Não</b><p>Logo em cima do rosto · filtro sépia, P&B puro ou vintage · glow neon no logo · recortar a pessoa e colar no roxo · mais de um tratamento na mesma peça.</p></div></div>""")

# ---------------------------------------------------------------- feed com fotos
AV = lambda *ns: "".join(f'<i style="background-image:url({foto(n, 200)})"></i>' for n in ns)
posts = [
    ("Frase sobre foto", ph("neon-hexagono-roxo", "fx-post", "center 18%", f'<div class="g" style="background:{GRAD}"></div><div class="fx-logo" style="left:14px;top:14px">{I("v4-go-white.svg", h=26)}</div><div class="fx-t" style="left:16px;bottom:16px;font-size:40px">Sexta<br>tem <b>rolê.</b></div>')),
    ("Social proof · quem vai", ph("risada-festa", "fx-post", "center 18%", f'<div class="g" style="background:{FADE}"></div><span class="fx-chipw" style="left:14px;top:14px">Ela já marcou presença ✓</span><div class="fx-t" style="left:16px;bottom:44px;font-size:28px">E você,<br><b>vai?</b></div><div class="fx-av" style="left:16px;bottom:16px">{AV("confete-festa", "bar-loira", "sorriso-neon")}+46 vão</div><div class="fx-logo" style="right:14px;bottom:16px">{I("v4-go-dark.svg", h=20)}</div>')),
    ("Duotone · slogan", f'<div class="fx-ph fx-post"><div class="g fx-duo" style="{bg("danca-cabelo", "center 30%")}"></div><div class="fx-duo-ov"></div><div class="fx-t" style="left:0;right:0;top:40%;text-align:center;font-size:42px">Viva o<br><b>rolê.</b></div><div class="fx-logo" style="left:50%;transform:translateX(-50%);bottom:14px">{I("v4-lockup-purple.svg", h=18)}</div></div>'),
    ("Evento", f'<div class="fx-ph fx-post" style="background:#000"><div class="g" style="{bg("show-de-costas", "center 40%")};bottom:42%"></div><div class="g" style="background:linear-gradient(180deg,rgba(0,0,0,0) 30%,#000 58%)"></div><span class="fx-chip" style="left:14px;top:14px">SÁB · 22h</span><div class="fx-t" style="left:16px;bottom:44px;font-size:26px">Baile da<br><b>Laje</b></div><div style="position:absolute;left:16px;bottom:18px;z-index:3;font-size:10px;color:#9CA3AF">Vila Madalena · 1,2 km · R$ 40</div><div class="fx-logo" style="right:14px;bottom:16px">{I("v4-go-dark.svg", h=22)}</div></div>'),
    ("Carrossel · capa", f'<div class="fx-ph fx-post" style="background:{PURPLE}"><div class="g" style="{bg("roda-gigante-ciano", "center 20%")};left:56%;border-radius:0"></div><div class="fx-t" style="left:16px;top:18px;font-size:24px">5 rolês<br>pra esse<br><b>fds</b></div><div style="position:absolute;left:16px;bottom:16px;z-index:3;font-size:10px;font-weight:700;color:#fff">arrasta →</div><div class="fx-logo" style="left:16px;bottom:38px">{I("v4-go-white.svg", h=22)}</div></div>'),
    ("Repost da galera", f'<div class="fx-ph fx-post" style="background:#000;background-image:url({go_pattern(opacity=.10, color="#9E19E9")});background-size:80px"><div class="fx-pol" style="left:22%;top:8%;width:56%;height:66%;transform:rotate(-4deg)"><div style="background-image:url({foto("confete-cabelo", 600)})"></div></div><div class="fx-t" style="left:0;right:0;bottom:16px;text-align:center;font-size:16px">@bia.lopes tava no <b>rolê</b></div></div>'),
]
fg = "".join(f'<div>{v}<div class="lb">{t}</div></div>' for t, v in posts)
page("Feed · posts com foto", "mist", "Redes · feed com foto", "Seis posts com a galera", f"""
<div class="fx-two" style="grid-template-columns:1fr 230px"><div class="fx-feed" style="grid-template-columns:repeat(3,226px);gap:10px 16px">{fg}</div>
<div><div class="sub">Regras</div><ul class="rl">
<li>Um rosto por post, no terço de cima; texto embaixo, no degradê.</li><li>No máximo 6 palavras e uma em destaque ciano.</li>
<li>Logo ou símbolo num canto, nunca sobre o rosto.</li><li>Grid alternando: foto · roxo · preto. Nunca 3 fotos seguidas.</li>
<li>Social proof (“quem vai”) com avatares redondos e borda branca.</li><li>Repost da galera em polaroid branca, girada até 4°, com @ da pessoa (sempre com autorização).</li></ul></div></div>""")

# ---------------------------------------------------------------- stories com foto
bar = lambda on: '<div class="fx-bar">' + "".join(f'<i class="{"on" if i < on else ""}"></i>' for i in range(4)) + "</div>"
stories = [
    ("Enquete", ph("neon-rosa-azul", "fx-st", "center 20%", f'{bar(1)}<div class="g" style="background:{FADE}"></div><div class="fx-t" style="left:20px;top:120px;font-size:38px">Hoje<br>tem <b>rolê.</b></div><div class="fx-poll" style="bottom:60px"><b>Bora?</b><div><span>BORA 🔥</span><span>hoje não</span></div></div><div class="fx-logo" style="left:50%;transform:translateX(-50%);bottom:16px">{I("v4-lockup-dark.svg", h=13)}</div>')),
    ("Contagem", f'<div class="fx-ph fx-st">{bar(2)}<div class="g fx-duo" style="{bg("mao-pra-cima", "center 30%")}"></div><div class="fx-duo-ov"></div><div class="fx-t" style="left:0;right:0;top:110px;text-align:center;font-size:16px;font-style:normal;font-weight:600;letter-spacing:0">faltam</div><div class="fx-t" style="left:0;right:0;top:130px;text-align:center;font-size:100px">2</div><div class="fx-t" style="left:0;right:0;top:236px;text-align:center;font-size:22px">dias pro <b>Festival</b></div><div class="fx-logo" style="left:50%;transform:translateX(-50%);bottom:16px">{I("v4-lockup-purple.svg", h=13)}</div></div>'),
    ("Quem vai", ph("brinde-rooftop", "fx-st", "center 20%", f'{bar(3)}<div class="g" style="background:{GRAD}"></div><span class="fx-chipw" style="left:18px;top:26px">📍 Rooftop Augusta</span><div class="fx-t" style="left:18px;bottom:100px;font-size:30px">Chama as<br><b>amigas.</b></div><div class="fx-av" style="left:18px;bottom:62px">{AV("bar-loira", "sorriso-neon", "festival-sorriso")}12 amigas vão</div><div style="position:absolute;z-index:3;left:18px;right:18px;bottom:22px;background:#fff;color:#05070F;border-radius:99px;font-size:10px;font-weight:800;text-align:center;padding:6px">Ver o rolê ↑</div>')),
    ("Moldura · eu fui", f'<div class="fx-ph fx-st" style="background:{PURPLE}">{bar(4)}<div class="fx-pol" style="left:16px;right:16px;top:40px;height:240px;padding:7px 7px 7px;transform:rotate(2deg)"><div style="background-image:url({foto("platinada-neon", 600)})"></div></div><div class="fx-t" style="left:0;right:0;top:298px;text-align:center;font-size:24px">Eu fui no <b>rolê.</b></div><div class="fx-logo" style="left:50%;transform:translateX(-50%);bottom:12px">{I("v4-go-white.svg", h=16)}</div></div>'),
]
sg2 = "".join(f'<div class="fx-stw">{v}<span>{t}</span></div>' for t, v in stories)
page("Stories · com foto", "dark", "Redes · stories com foto", "Stories que puxam a galera", f"""
<div class="fx-stg">{sg2}<div class="fx-rules">
<div class="kv2"><span>Sequência</span><p>3 a 5 stories: chamada (enquete) → prova (quem vai) → urgência (contagem) → ação (link).</p></div>
<div class="kv2"><span>Zonas</span><p>250 px no topo e 340 px embaixo livres (em 1080 × 1920). Rosto no terço de cima.</p></div>
<div class="kv2"><span>Moldura “Eu fui”</span><p>Template pra galera repostar a própria foto: polaroid no roxo + Go branco. É o UGC da marca.</p></div>
<div class="kv2"><span>Stickers</span><p>Brancos, girados −3° a 3°, cantos de 12 px. Emoji no máx. um por sticker.</p></div></div></div>""")

# ---------------------------------------------------------------- look do rolê (roupas)
CROP = "M30 14 L6 28 L0 60 L22 66 L26 50 L26 120 L134 120 L134 50 L138 66 L160 60 L154 28 L130 14 C120 30 40 30 30 14Z"
TOP = "M44 6 L50 6 C56 22 104 22 110 6 L116 6 L124 40 L132 132 L28 132 L36 40 Z"
BUCKET = "M48 40 C50 16 110 16 112 40 L118 58 L42 58 Z M10 66 C34 52 126 52 150 66 L140 78 C112 68 48 68 20 78 Z"
CAP = "M30 80 C30 18 130 18 130 80 Z M24 78 C60 70 130 70 158 92 C130 102 50 98 24 86 Z"
BAG = "M30 50 H130 a14 14 0 0 1 14 14 V104 a14 14 0 0 1 -14 14 H30 a14 14 0 0 1 -14 -14 V64 a14 14 0 0 1 14 -14Z"
SCR = "M20 60 C20 30 60 22 80 40 C100 22 140 30 140 60 C140 90 100 98 80 80 C60 98 20 90 20 60Z"


def gar(path, fill, inner, vb="0 0 160 140", w=130, top="42%", stroke=""):
    return f'<div class="fx-gar" style="width:{w}px"><svg viewBox="{vb}" width="{w}"><path d="{path}" fill="{fill}" {stroke}/></svg><div class="pr" style="top:{top}">{inner}</div></div>'


looks = [
    (gar(CROP, "#F6F6F9", I("v4-go-light.svg", h=26), stroke='stroke="#DCDDE5" stroke-width="1.5"', top="34%"), "Cropped branca", "Go roxo no peito, 8 cm. Malha canelada."),
    (gar(TOP, "#0A0A0E", '<span class="slo" style="font-size:12px;color:#fff">Viva o <b style="color:#00E5E5">rolê.</b></span>', vb="0 0 160 140", top="44%"), "Regata preta", "Slogan branco + ciano, silk 2 cores."),
    (gar(CROP, "#6539CB", I("v4-lockup-purple.svg", h=15), top="36%"), "Baby look roxa", "Lockup branco/ciano. Tecido roxo #6539CB."),
    (gar(BUCKET, "#0A0A0E", I("v4-go-dark.svg", h=18), vb="0 0 160 80", w=130, top="26%"), "Bucket preto", "Go ciano bordado. Festival e dia."),
    (gar(CAP, "#F6F6F9", I("v4-go-light.svg", h=20), vb="0 0 160 104", w=130, top="22%", stroke='stroke="#DCDDE5" stroke-width="1.5"'), "Boné branco", "Go roxo bordado, 5 cm."),
    (f'<div style="width:130px;height:84px;border-radius:16px;background:url({go_pattern(opacity=.22)}) 0 0/46px,{PURPLE};display:flex;align-items:center;justify-content:center;box-shadow:0 6px 14px rgba(69,46,255,.35)">{I("v4-lockup-purple.svg", h=14)}</div>', "Bolsinha transversal", "Padrão Go no roxo. Cabe celular e batom."),
    (f'<div style="width:132px;height:96px;background:#fff;border-radius:10px;box-shadow:0 0 0 1px #DCDDE5;display:grid;grid-template-columns:1fr 1fr 1fr;align-items:center;justify-items:center;padding:6px;transform:rotate(-3deg)">{I("v4-go-light.svg", h=22)}{I("v4-go-dark.svg", h=18)}{I("v4-go-light.svg", h=14)}{I("v4-go-dark.svg", h=14)}<span class="slo" style="font-size:9px;color:#05070F">rolê.</span>{I("v4-go-light.svg", h=20)}</div>', "Tattoo de festa", "Cartela temporária: Go roxo e ciano, pra rosto e braço."),
    (f'<div style="display:flex;flex-direction:column;gap:8px;align-items:center"><div class="fx-wb" style="position:static;background:#00E5E5;color:#000;width:140px">{I("v4-go-ink.svg", h=12)}ROLÊ ACESSO · VIP</div><div class="fx-wb" style="position:static;background:{PURPLE};width:140px">{I("v4-go-white.svg", h=12)}VIVA O ROLÊ.</div></div>', "Pulseira de tecido", "Acesso do evento que vira acessório."),
]
lk = "".join(f'<div class="fx-it"><div class="v">{v}</div><b>{t}</b><p>{d}</p></div>' for v, t, d in looks)
page("Look do rolê · roupas", "light", "Roupas · look do rolê", "O look do rolê", f"""
<div class="fx-look">{ph("neon-hexagono-roxo", pos="center 25%", inner=f'<div class="g" style="background:{GRAD}"></div><div class="fx-t" style="left:18px;bottom:52px;font-size:34px">O look<br>do <b>rolê.</b></div><div class="fx-logo" style="left:18px;bottom:20px">{I("v4-lockup-purple.svg", h=18)}</div>')}
<div><div class="fx-items">{lk}</div>
<p class="note"><b>Coleção “Viva o rolê”:</b> peças pensadas pra festa, não pra uniforme: corte feminino, cropped, cores da marca (preto, branco, roxo) e o Go como única estampa grande. Silk e bordado em até 2 cores (branco + ciano ou roxo). Degradê só em sublimação.</p></div></div>""")

# ---------------------------------------------------------------- na festa (contexto)
party = [
    ("r2", "show-de-costas", "center 40%", f'<div class="fx-led" style="left:18%;right:18%;top:10%;height:26%">{I("v4-lockup-purple.svg", h=34)}</div>', "Telão do palco"),
    ("", "galera-brinde-azul", "center 40%", f'<div class="fx-wb" style="left:14px;top:14px;background:#00E5E5;color:#000">{I("v4-go-ink.svg", h=12)}ACESSO</div><div class="fx-wb" style="left:14px;top:42px;background:{PURPLE}">{I("v4-go-white.svg", h=12)}VIVA O ROLÊ.</div>', "Pulseira de acesso"),
    ("", "confete-festa", "center 25%", f'<div class="g" style="background:{GRAD}"></div><div class="fx-logo" style="right:12px;top:12px;background:#fff;border-radius:50%;width:48px;height:48px;display:flex;align-items:center;justify-content:center">{I("v4-go-light.svg", h=24)}</div>', "Photo point · selo"),
    ("", None, None, f'<div class="g" style="background:url({go_pattern(opacity=.25)}) 0 0/90px,{PURPLE}"></div><div class="fx-logo" style="left:50%;top:38%;transform:translate(-50%,-50%)">{I("v4-stacked-purple.svg", h=110)}</div><div class="fx-t" style="left:0;right:0;bottom:24px;text-align:center;font-size:20px">#VivaORolê</div>', "Backdrop pra foto"),
    ("", "mao-pra-cima", "center 30%", f'<div class="g" style="background:linear-gradient(0deg,rgba(0,0,0,.8),rgba(0,0,0,0) 50%)"></div><div style="position:absolute;z-index:3;right:16px;bottom:16px;width:62px;height:84px;border-radius:6px 6px 14px 14px;background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,.06));border:1.5px solid rgba(255,255,255,.5);display:flex;align-items:center;justify-content:center">{I("v4-go-white.svg", h=28)}</div>', "Copo do evento"),
]
pt = ""
for cls, n, pos, inner, lb in party:
    if n:
        pt += ph(n, cls, pos, inner + f'<span class="lb">{lb}</span>')
    else:
        pt += f'<div class="fx-ph {cls}">{inner}<span class="lb">{lb}</span></div>'
page("Na festa", "dark", "Contexto · na festa", "A marca no meio da festa", f"""
<div class="fx-party">{pt}</div>
<p class="note" style="color:#9CA3AF"><b style="color:#fff">Regra da festa:</b> a marca aparece onde a galera olha e fotografa: telão, backdrop, pulseira, copo. Nada de banner esticado atrás do DJ cobrindo a luz. No escuro, sempre Rolê branco + Go ciano; o roxo entra como superfície (telão, pulseira, backdrop).</p>""")

# ---------------------------------------------------------------- campanha com foto
page("Campanha · foto + marca", "light", "Campanha", "Foto da galera na rua e no digital", f"""
<div class="fx-camp"><div><div class="fx-bill">{ph("festival-sorriso", pos="center 30%", style="position:absolute;inset:0;border-radius:0", inner=f'<div class="g" style="background:linear-gradient(90deg,rgba(0,0,0,0) 30%,rgba(101,57,203,.85) 62%,#452EFF 100%)"></div><div class="fx-t" style="right:28px;top:40px;font-size:46px;text-align:right">Chega de<br>decidir<br>no <b>grupo.</b></div><div class="fx-logo" style="right:28px;bottom:24px">{I("v4-lockup-purple.svg", h=30)}</div>')}</div><div class="fx-pole"></div>
<div class="sub" style="margin-top:6px">Outdoor 9 × 3 m</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:4px">
<div class="fx-ph" style="height:96px;{bg("club-luzes-azuis", "center 30%")}"><div class="g" style="background:linear-gradient(90deg,rgba(0,0,0,0),#452EFF 75%)"></div><div class="fx-t" style="right:14px;top:16px;font-size:20px;text-align:right">Sexta tem <b>rolê.</b></div><span class="fx-chipw" style="right:14px;bottom:12px">Baixar o app</span></div>
<div class="fx-ph" style="height:96px;background:#000"><div class="g" style="{bg("oculos-neon", "center 30%")};right:60%"></div><div class="fx-t" style="left:46%;top:16px;font-size:18px">Viva o <b>rolê.</b></div><div class="fx-logo" style="left:46%;bottom:14px">{I("v4-lockup-dark.svg", h=16)}</div></div></div>
<div class="sub" style="margin-top:6px">Banners de app e site</div></div>
<div style="display:flex;flex-direction:column;gap:12px">
<div class="fx-ph" style="height:300px;{bg("roda-gigante-ciano", "center 25%")}"><div class="g" style="background:{GRAD}"></div><span class="fx-chip" style="left:14px;top:14px">Patrocinado</span><div class="fx-t" style="left:16px;bottom:66px;font-size:30px">Seu grupo<br>deu <b>match.</b></div><div style="position:absolute;z-index:3;left:16px;right:16px;bottom:16px;background:#fff;color:#05070F;border-radius:10px;font-size:11px;font-weight:800;text-align:center;padding:9px">Baixar a RolêGo</div></div>
<div class="sub">Anúncio 4:5 · Instagram e TikTok</div>
<div style="display:flex;border-radius:12px;overflow:hidden;height:90px;box-shadow:0 4px 12px rgba(0,0,0,.12)"><div style="width:90px;{bg("sorriso-neon", "center 25%", 400)}"></div><div style="flex:1;background:{PURPLE};color:#fff;padding:12px 14px;display:flex;flex-direction:column;justify-content:space-between"><div style="display:flex;justify-content:space-between;align-items:center">{I("v4-lockup-purple.svg", h=12)}<span style="font-size:9px;opacity:.8">SÁB 22h</span></div><b style="font-style:italic;font-size:16px">Baile da Laje</b><span style="font-size:9px;opacity:.85">Ingresso · pista · Ana L.</span></div><div style="width:58px;background:#fff;border-left:2px dashed #C9C9D6;display:flex;align-items:center;justify-content:center">{I("v4-go-light.svg", h=24)}</div></div>
<div class="sub">Ingresso digital com foto do evento</div></div></div>""")

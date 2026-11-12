# Páginas 18–22 da apresentação (família ligadura + usos). Executado dentro de _build_apresentacao.py
# (usa svg, foot, pages, CSS, ccard, json, os, HERE de lá). Rodar _build_ligadura.py antes.
LD = os.path.join(HERE, "ligadura")
LM = json.load(open(os.path.join(LD, "meta.json")))
L = lambda name, h=None, w=None: svg(name, h=h, w=w, d=LD)

CSS += """.eq{display:flex;align-items:center;gap:22px;margin:4px 0 14px}.eq .op{font-size:40px;font-weight:800;color:#7C8090}
.eq figure{margin:0;text-align:center;color:#A6A9B8;font-size:10.5px;font-weight:600}.eq figure svg{margin:0 auto 4px}
/* mockups */
.mk{display:grid;gap:14px;flex:1;min-height:0}.mk1{grid-template-columns:200px 200px 1fr}.mk2{grid-template-columns:1.5fr 190px 1fr}
.cap{font-size:10px;font-weight:700;color:var(--mut);text-transform:uppercase;letter-spacing:.04em;margin-top:6px}
.phone{width:200px;height:400px;border-radius:30px;border:7px solid #15161C;position:relative;overflow:hidden;box-shadow:0 10px 24px rgba(5,7,15,.25)}
.phone .sb{display:flex;justify-content:space-between;padding:8px 16px 0;font-size:9px;font-weight:700;color:#fff}
.home{background:linear-gradient(160deg,#16324A 0%,#0B1424 55%,#05070F 100%)}
.apps{display:grid;grid-template-columns:repeat(4,1fr);gap:12px 8px;padding:20px 12px}
.app{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:7.5px;color:#fff}.app i{width:36px;height:36px;border-radius:9px;background:rgba(255,255,255,.14);display:block}
.app svg{width:36px!important;height:36px!important;border-radius:9px;box-shadow:0 0 0 2px rgba(0,229,229,.0)}
.dock{position:absolute;left:10px;right:10px;bottom:10px;height:56px;border-radius:18px;background:rgba(255,255,255,.12);display:flex;justify-content:space-around;align-items:center}
.dock i{width:36px;height:36px;border-radius:9px;background:rgba(255,255,255,.18)}
.splash{background:#04050B;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px}
.splash p{color:#A6A9B8;font-size:10px;position:absolute;bottom:26px;width:100%;text-align:center}
.rcol{display:flex;flex-direction:column;gap:12px;min-width:0}
.brw{border-radius:12px;overflow:hidden;border:1px solid var(--line);background:#fff;box-shadow:0 6px 18px rgba(5,7,15,.1)}
.brw .tabs{background:#E8E9EF;padding:7px 10px 0;display:flex;gap:6px}.brw .tab{background:#fff;border-radius:8px 8px 0 0;padding:6px 12px;display:flex;align-items:center;gap:7px;font-size:10px;font-weight:600}
.brw .tab.off{background:transparent;color:#7C8090}.brw .url{padding:6px 10px;border-bottom:1px solid var(--line);font-size:10px;color:#5B6070}
.brw .url span{background:#F1F2F6;border-radius:99px;padding:3px 12px;display:inline-block;width:60%}
.brw .nav{background:#04050B;display:flex;align-items:center;justify-content:space-between;padding:10px 16px}
.brw .nav .lk{display:flex;gap:16px;color:#A6A9B8;font-size:10px;align-items:center}
.btn{background:var(--cy);color:#04050B;font-weight:800;font-style:italic;font-size:11px;border-radius:99px;padding:6px 16px;display:inline-flex;align-items:center;gap:6px}
.brw .hero2{background:#04050B;color:#fff;padding:6px 16px 16px;font-size:20px;font-weight:800;font-style:italic;letter-spacing:-.02em;line-height:1.1}
.brw .hero2 b{color:var(--cy)}
.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ntf{background:linear-gradient(160deg,#16324A,#05070F);border-radius:12px;padding:12px}
.ntf .c{background:rgba(255,255,255,.14);backdrop-filter:blur(4px);border-radius:12px;padding:9px 10px;display:flex;gap:9px;color:#fff;font-size:9.5px;line-height:1.35}
.ntf .c svg{flex-shrink:0;border-radius:7px}.ntf .c b{font-size:10px}.ntf .c .t{color:#A6A9B8;float:right;font-weight:400}
.prof{background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px;display:flex;gap:12px;align-items:center}
.prof .n{font-weight:800;font-size:12px}.prof .b{font-size:9.5px;color:var(--mut);line-height:1.35}.prof .st{display:flex;gap:12px;font-size:9px;margin-top:4px}.prof .st b{font-size:11px;display:block}
.map{border-radius:14px;overflow:hidden;position:relative;background:#0E1322;min-height:0}
.map>svg.bg{position:absolute;inset:0;width:100%;height:100%}
.mkr{position:absolute;transform:translate(-50%,-100%)}.mkr svg{display:block}
.evt{position:absolute;background:#fff;border-radius:12px;padding:9px 11px;box-shadow:0 8px 20px rgba(0,0,0,.35);font-size:9.5px;line-height:1.35;width:170px}
.evt b{font-size:11.5px;display:block}.evt .btn{font-size:9.5px;padding:4px 12px;margin-top:6px}
.me{position:absolute;width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:0 0 0 5px rgba(255,255,255,.2)}
.story{background:#04050B;border-radius:16px;padding:18px 16px;display:flex;flex-direction:column;justify-content:space-between;color:#fff;height:340px}
.story h4{font-size:26px;font-weight:800;font-style:italic;letter-spacing:-.03em;line-height:1.02}.story h4 b{color:var(--cy)}
.story p{font-size:9.5px;color:#A6A9B8}
.phys{display:grid;grid-template-rows:auto 1fr;gap:12px;min-width:0}
.band{height:58px;border-radius:10px;background:var(--cy);display:flex;align-items:center;gap:18px;padding:0 16px;overflow:hidden;box-shadow:0 6px 16px rgba(5,7,15,.15)}
.band .info{font-size:9px;font-weight:800;letter-spacing:.06em;color:#04050B;border-left:2px solid #04050B;padding-left:10px;line-height:1.3;white-space:nowrap}
.objs{display:grid;grid-template-columns:1fr 1fr;gap:12px;min-height:0}.phys>div:last-child{min-height:0}.stk,.tote{min-height:0;overflow:hidden}
.stk{display:flex;align-items:center;justify-content:center;background:#E9EAF0;border-radius:12px}
.stk svg{transform:rotate(-9deg);filter:drop-shadow(0 6px 10px rgba(5,7,15,.25));border-radius:50%;border:5px solid #fff}
.tote{display:flex;align-items:flex-end;justify-content:center;background:#E9EAF0;border-radius:12px;padding-bottom:12px}
.tote div{width:130px;height:140px;background:#04050B;border-radius:4px 4px 10px 10px;position:relative;display:flex;align-items:center;justify-content:center}
.tote div:before{content:"";position:absolute;top:-46px;left:32px;width:56px;height:56px;border:6px solid #04050B;border-bottom:0;border-radius:40px 40px 0 0}"""

# 18 — C4 + C6 = L1
fam = "".join(f'<div>{L(f"{k}-go-color.svg")}{k.upper()} · {LM[k]["nome"]}</div>' for k in LM)
CDIR = os.path.join(HERE, "canal")
pages.append(f"""<section class="page cover"><div class="eyebrow"><b>17</b> Preferidos · C4 ligadura + C6 ponta na base</div>
<div class="cv"><div class="eq"><figure>{svg("c4-go-color.svg", h=120, d=CDIR)}C4 · ligadura</figure><span class="op">+</span>
<figure>{svg("c6-go-color.svg", h=120, d=CDIR)}C6 · ponta na base</figure><span class="op">=</span>
<figure>{L("l1-go-color.svg", h=170)}L1 · ligadura na base</figure></div>
<h2 style="color:#fff">G e pin numa peça só, do tamanho das letras.</h2>
<p class="lead">Juntando os dois preferidos: a barra e o terminal do G viram as bordas do canal (C4) e a ponta do pin para na linha de base (C6). A família “ligadura” varia o furo, o encaixe e o canal, e traz o corte pequeno e os ícones.</p>
<div class="fam">{fam}</div></div>{foot(18)}</section>""")

for n, (keys, title, lead) in enumerate([
    (["l1", "l2", "l3", "l4"], "Ligadura: base, furo largo, encaixe raso e fundo",
     "Mesma regra, quatro desenhos do Go: quanto o pin entra no G e quanto a cabeça lê como o “o” do nome."),
    (["l5", "l6", "l7", "l8"], "Ligadura: canal fino, corte pequeno e ícones",
     "O canal fino, o corte fechado para 16–24 px e o L1 vazado no bloco (app) e no círculo (avatar)."),
]):
    cards = "".join(ccard(k, d=LD, meta=LM, chips={"l1": "recomendado"}, rec="l1") for k in keys)
    pages.append(f"""<section class="page mist"><div class="eyebrow"><b>{18+n}</b> Família ligadura · {n+1} de 2</div><h2>{title}</h2>
<p class="lead">{lead}</p><div class="grid gcc">{cards}</div>{foot(19+n)}</section>""")

# 21 — usos digitais
app = L("icon-app.svg")
apps = "".join('<div class="app"><i></i>&nbsp;</div>' for _ in range(5)) + f'<div class="app">{app}RoleGo</div>' + \
       "".join('<div class="app"><i></i>&nbsp;</div>' for _ in range(10))
pages.append(f"""<section class="page"><div class="eyebrow"><b>20</b> Usos · digital</div><h2>No celular, no navegador e no feed</h2>
<p class="lead">L1 no wordmark, L7 (bloco ciano, Go preto) como ícone de app, L8 como avatar e L6 no favicon. Ciano só sobre preto ou como fundo; nunca violeta no preto.</p>
<div class="mk mk1">
<div><div class="phone home"><div class="sb"><span>9:41</span><span>●●● 5G</span></div><div class="apps">{apps}</div>
<div class="dock"><i></i><i></i><i></i><i></i></div></div><div class="cap">Ícone de app · L7</div></div>
<div><div class="phone splash"><div class="sb" style="position:absolute;top:0;left:0;right:0"><span>9:41</span><span>●●● 5G</span></div>
{L("l1-stacked-color.svg", w=130)}<p>Bora pro rolê?</p></div><div class="cap">Splash · lockup empilhado</div></div>
<div class="rcol"><div><div class="brw"><div class="tabs"><div class="tab">{L("icon-fav.svg", h=14)}RoleGo — rolês perto de você</div><div class="tab off">Nova aba</div></div>
<div class="url"><span>rolego.app</span></div>
<div class="nav">{L("l1-lockup-color.svg", h=26)}<div class="lk"><span>Rolês</span><span>Mapa</span><span>Grupos</span><span class="btn">Bora</span></div></div>
<div class="hero2">Os rolês da sua cidade,<br><b>num swipe.</b></div></div><div class="cap">Site · favicon L6 + header L1</div></div>
<div class="two"><div><div class="ntf"><div class="c">{L("icon-app.svg", h=30)}<div><b>RoleGo</b> <span class="t">agora</span><br>Seu grupo deu match: Samba no Largo, sexta 21h. Bora?</div></div></div><div class="cap">Notificação · L7</div></div>
<div><div class="prof">{L("icon-avatar.svg", h=64)}<div><div class="n">rolego</div><div class="b">Os rolês da sua cidade, num swipe.</div>
<div class="st"><span><b>128</b>posts</span><span><b>12 mil</b>seguidores</span></div></div></div><div class="cap">Perfil social · L8</div></div></div></div>
</div>{foot(21)}</section>""")

# 22 — usos no rolê (mapa, story, físico)
marker = lambda h: svg("c8-go-color.svg", h=h, d=CDIR)
roads = "".join(f'<line x1="{a}" y1="{b}" x2="{c}" y2="{d}" stroke="#1F2638" stroke-width="{w}"/>' for a, b, c, d, w in [
    (0, 60, 600, 140, 10), (0, 230, 600, 190, 14), (90, 0, 160, 400, 9), (330, 0, 300, 400, 12), (470, 0, 560, 400, 7),
    (0, 330, 600, 360, 8), (200, 0, 0, 180, 6), (600, 40, 380, 400, 5)])
pages.append(f"""<section class="page mist"><div class="eyebrow"><b>21</b> Usos · no rolê</div><h2>No mapa, no story e no evento</h2>
<p class="lead">O pin com canal (C8) marca os rolês no mapa; o L1 assina story, pulseira de acesso, adesivo e ecobag. Uma cor só já resolve impressão barata.</p>
<div class="mk mk2" style="flex:none;height:350px">
<div style="display:flex;flex-direction:column;min-height:0"><div class="map" style="flex:1"><svg class="bg" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice">
<rect width="600" height="400" fill="#0E1322"/><rect x="380" y="250" width="150" height="90" rx="10" fill="#10241F"/><path d="M0 300 C120 270 200 330 600 290 L600 320 C220 360 120 300 0 330Z" fill="#0F1C2E"/>{roads}</svg>
<div class="mkr" style="left:22%;top:38%">{marker(30)}</div><div class="mkr" style="left:70%;top:24%">{marker(30)}</div>
<div class="mkr" style="left:80%;top:72%">{marker(30)}</div><div class="mkr" style="left:47%;top:52%">{marker(48)}</div>
<div class="me" style="left:38%;top:70%"></div>
<div class="evt" style="left:52%;top:30%"><b>Samba no Largo</b>sex · 21h · a 600 m<br>32 pessoas vão<br><span class="btn">Bora</span></div></div>
<div class="cap">Mapa do app · marcador C8</div></div>
<div><div class="story"><div>{L("l1-go-color.svg", h=56)}</div><div><h4>Sexta<br>tem<br><b>rolê.</b></h4><p style="margin-top:8px">Abra o app, dê match com o grupo e bora.</p></div>
<div>{L("l1-lockup-white.svg", h=22)}</div></div><div class="cap">Story 9:16</div></div>
<div class="phys"><div><div class="band">{L("l1-lockup.svg", h=26)}<div class="info">SEX 14/11<br>ACESSO · PISTA</div>{L("l6-go.svg", h=30)}</div><div class="cap">Pulseira de acesso · uma cor</div></div>
<div class="objs"><div style="display:flex;flex-direction:column"><div class="stk" style="flex:1">{L("icon-avatar.svg", h=110)}</div><div class="cap">Adesivo · L8</div></div>
<div style="display:flex;flex-direction:column"><div class="tote" style="flex:1"><div>{L("l1-stacked-color.svg", w=86)}</div></div><div class="cap">Ecobag · empilhado</div></div></div></div>
</div>{foot(22)}</section>""")

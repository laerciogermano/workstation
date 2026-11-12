# Páginas 4–9: slogan “Viva o rolê.” e aplicações da identidade. Executado por _build_apresentacao.py
# (usa I, foot, pages de lá). Fotos: foto-multidao-{1,2}.jpg = recorte de ../criativos/img/multidao*.png sem o texto queimado.
PH1, PH2 = "foto-multidao-1.jpg", "foto-multidao-2.jpg"
SLO = lambda cls="": f'<div class="slo {cls}">Viva o <b>rolê.</b></div>'
photo = lambda src, size="100% auto", pos="center top": f'style="background-image:url({src});background-size:{size};background-position:{pos}"'

# 4 — slogan
pages.append(f"""<section class="page light"><div class="eyebrow">4 · Slogan</div><h2>Viva o rolê.</h2>
<p class="lead2">O slogan segue a regra do nome: “Viva o” na cor do texto e <b>rolê</b> na cor do Go. Poppins ExtraBold itálico, sempre com ponto final. Fica embaixo do lockup alinhado à esquerda, ou embaixo do empilhado, centralizado.</p>
<div class="sl3">
<div class="slc purple">{I("v4-lockup-purple.svg", h=74)}{SLO("s-lg")}</div>
<div class="slc dark">{I("v4-lockup-dark.svg", h=74)}{SLO("s-lg grad")}</div>
<div class="slc lite">{I("v4-lockup-light.svg", h=74)}{SLO("s-lg ink")}</div>
<div class="slc purple ctr">{I("v4-stacked-purple.svg", h=150)}{SLO("s-md")}</div>
<div class="slc dark ctr">{I("v4-stacked-dark.svg", h=150)}{SLO("s-md grad")}</div>
<div class="slc lite ctr">{I("v4-stacked-light.svg", h=150)}{SLO("s-md ink")}</div>
</div>
<div class="rules"><span><b>Sozinho</b> — o slogan pode virar título de peça (post, outdoor, camiseta) sem o logo, desde que o logo apareça em outro ponto.</span>
<span><b>Não</b> — trocar a fonte, tirar o ponto, escrever em caixa alta com pincel ou deixar “rolê” na mesma cor de “Viva o”.</span></div>
{foot(4)}</section>""")

# 5 — redes sociais
grid = "".join(f'<i class="{c}"></i>' for c in ["purple", "ph1", "dark", "ph2", "purple", "dark", "dark", "purple", "ph1"])
pages.append(f"""<section class="page mist"><div class="eyebrow">5 · Redes sociais</div><h2>Feed, story e perfil</h2>
<div class="soc">
<div><div class="post purple"><div class="pt">{I("v4-go-white.svg", h=34)}</div><div class="big">Sexta<br>tem<br><b>rolê.</b></div><div class="pb">{SLO("s-sm")}<span>@rolego</span></div></div><div class="cap">Post · roxo + frase curta</div></div>
<div><div class="post photo" {photo(PH1, "cover", "center 30%")}><div class="ov"></div><div class="pt">{I("v4-lockup-purple.svg", h=22)}</div><div class="big">Seu grupo<br>deu <b>match.</b></div><div class="pb"><span class="chip">Samba no Largo · sex 21h</span></div></div><div class="cap">Post · foto + degradê roxo</div></div>
<div><div class="post dark"><div class="pt">{I("v4-lockup-dark.svg", h=22)}</div><div class="evc"><span class="tag">HOJE · 22h</span><b>Baile da Laje</b><span>Vila Madalena · a 1,2 km</span><span class="ppl"><i></i><i></i><i></i> 48 vão</span><span class="btn2">Bora</span></div><div class="pb">{SLO("s-sm grad")}</div></div><div class="cap">Post · evento no preto</div></div>
<div><div class="story photo" {photo(PH2, "cover", "center 30%")}><div class="ov2"></div><div class="st-top"><i></i><i class="on"></i><i></i></div>
<div class="st-mid">{SLO("s-xl")}</div><div class="st-bot">{I("v4-lockup-purple.svg", h=24)}<span class="sw">Arrasta pra cima ↑</span></div></div><div class="cap">Story 9:16 · slogan como título</div></div>
<div class="ig"><div class="igh">{I("v4-icon-avatar.svg", h=58)}<div><b>rolego</b><span>Viva o rolê. Os rolês da sua cidade, num swipe. 📍</span><span class="st"><b>128</b> posts · <b>12 mil</b> seguidores</span></div></div>
<div class="hl">{"".join(f'<div><i class="{c}">{I(s, h=20)}</i><span>{t}</span></div>' for c, s, t in [("purple","v4-go-white.svg","Rolês"),("dark","v4-go-dark.svg","Mapa"),("purple","v4-go-white.svg","Grupos"),("dark","v4-go-dark.svg","Dicas")])}</div>
<div class="igg">{grid}</div><div class="cap">Perfil · avatar L8 + destaques</div></div>
</div>
<div class="soc2">
<div><div class="wa"><div class="wah">{I("v4-icon-avatar.svg", h=22)}<b>Rolê de sexta 🔥</b><span>Ana, Bia, Léo, você</span></div>
<div class="msg in">bora sair sexta?</div><div class="msg out"><div class="lp"><div class="lpi photo" {photo(PH1, "cover", "center 30%")}></div><div class="lpt"><b>Samba no Largo · RolêGo</b><span>sex 21h · 32 pessoas vão · Viva o rolê.</span><i>rolego.app</i></div></div>achei esse 👇</div></div><div class="cap">WhatsApp · prévia do link</div></div>
<div><div class="ad"><div class="adh">{I("v4-icon-avatar.svg", h=22)}<div><b>rolego</b><span>Patrocinado</span></div></div><div class="adi photo" {photo(PH2, "cover", "center 30%")}><div class="ov2"></div><div class="adt">{SLO("s-md")}</div></div><div class="adc"><span>Os rolês da sua cidade, num swipe.</span><b>Baixar</b></div></div><div class="cap">Anúncio no feed</div></div>
<div><div class="car">{"".join(f'<div class="cs {c}">{t}</div>' for c, t in [("purple", '<span class="n">1/3</span><b>Sem plano?</b>'), ("dark", '<span class="n">2/3</span><b>Abre o app,<br>dá <i>match</i>.</b>'), ("purple", f'<span class="n">3/3</span>{SLO("s-sm")}')])}</div><div class="cap">Carrossel · 3 cards</div></div>
</div>{foot(5)}</section>""")

# 6 — app
roads = "".join(f'<line x1="{a}" y1="{b}" x2="{c}" y2="{d}" stroke="#1C1C24" stroke-width="{w}"/>' for a, b, c, d, w in [
    (0, 80, 200, 120, 7), (0, 230, 200, 200, 9), (60, 0, 90, 400, 6), (150, 0, 130, 400, 8), (0, 320, 200, 340, 5), (200, 30, 20, 400, 4)])
pages.append(f"""<section class="page light"><div class="eyebrow">6 · No app</div><h2>Splash, mapa, rolê e notificação</h2>
<div class="apps4">
<div><div class="phone splash">{I("v4-stacked-purple.svg", w=140)}{SLO("s-sm")}</div><div class="cap">Splash · empilhado + slogan</div></div>
<div><div class="phone map"><svg class="bg" viewBox="0 0 200 400" preserveAspectRatio="xMidYMid slice"><rect width="200" height="400" fill="#0B0B10"/><path d="M0 270 C60 250 120 300 200 270 L200 290 C120 320 60 270 0 292Z" fill="#14122A"/>{roads}</svg>
<div class="mtop">{I("v4-lockup-dark.svg", h=16)}<span>📍 Pinheiros</span></div>
<div class="mkr" style="left:30%;top:30%">{I("v4-go-dark.svg", h=34)}</div><div class="mkr" style="left:72%;top:22%">{I("v4-go-dark.svg", h=30)}</div>
<div class="mkr big" style="left:55%;top:50%"><div class="pin">{I("v4-go-white.svg", h=30)}</div></div><div class="me" style="left:40%;top:66%"></div>
<div class="sheet"><b>Samba no Largo</b><span>sex · 21h · a 600 m · 32 vão</span><span class="btn2">Bora</span></div></div><div class="cap">Mapa · marcador Go</div></div>
<div><div class="phone evt"><div class="hero3" {photo(PH1, "cover", "center 30%")}><div class="ov"></div><span class="tag">SEX · 21h</span></div>
<div class="eb"><b>Samba no Largo</b><span>Largo da Batata · gratuito</span><div class="ppl"><i></i><i></i><i></i><i></i> <span>32 vão · 3 amigos</span></div>
<div class="match">{I("v4-go-white.svg", h=18)} Seu grupo deu match!</div><span class="btn3">Bora pro rolê</span></div></div><div class="cap">Rolê · CTA no roxo</div></div>
<div><div class="phone lock" {photo(PH2, "cover", "center 30%")}><div class="ov3"></div><div class="clock">21:04<span>sexta-feira, 14 de novembro</span></div>
<div class="nt">{I("v4-icon-app.svg", h=26)}<div><b>RolêGo</b> <span>agora</span><br>Tá rolando! Samba no Largo começou e 3 amigos já chegaram.</div></div>
<div class="nt">{I("v4-icon-app.svg", h=26)}<div><b>RolêGo</b> <span>19:30</span><br>Viva o rolê: 5 rolês perto de você hoje.</div></div></div><div class="cap">Tela de bloqueio · notificações</div></div>
</div>{foot(6)}</section>""")

# 7 — no evento
pages.append(f"""<section class="page mist"><div class="eyebrow">7 · No rolê</div><h2>Pulseira, ingresso, crachá, copo e camiseta</h2>
<div class="evg">
<div><div class="band2">{I("v4-lockup-purple.svg", h=26)}<div class="inf">SEX 14/11<br>ACESSO · PISTA</div>{SLO("s-xs")}<span class="qr"></span></div><div class="cap">Pulseira de acesso</div>
<div class="tix"><div class="tl">{I("v4-lockup-dark.svg", h=24)}<b>Baile da Laje</b><span>sáb 15/11 · 23h · Vila Madalena</span><span>Pista · lote 2 · R$ 40</span>{SLO("s-xs grad")}</div><div class="tr"><span class="qr2"></span><span>#RG-20481</span></div></div><div class="cap">Ingresso no app / impresso</div></div>
<div><div class="badge"><div class="hole"></div>{I("v4-go-white.svg", h=60)}<b>Camila</b><span>STAFF</span><div class="bb">{I("v4-lockup-purple.svg", h=16)}</div></div><div class="cap">Crachá de staff</div></div>
<div><div class="cup"><div class="cupb">{I("v4-go-white.svg", h=50)}{SLO("s-xs")}</div></div><div class="cap">Copo reutilizável</div></div>
<div><div class="tee"><svg viewBox="0 0 200 210"><path d="M60 10 L20 30 L0 80 L35 92 L40 70 L40 205 L160 205 L160 70 L165 92 L200 80 L180 30 L140 10 C130 30 70 30 60 10Z" fill="#0A0A0E"/></svg><div class="tp">{SLO("s-tee grad")}{I("v4-go-dark.svg", h=26)}</div></div><div class="cap">Camiseta · slogan no peito</div></div>
<div><div class="stks"><div class="sk1">{I("v4-icon-avatar.svg", h=86)}</div><div class="sk2">{SLO("s-sm")}</div><div class="sk3">{I("v4-go-light.svg", h=62)}</div></div><div class="cap">Adesivos</div></div>
<div class="sp2"><div class="stage"><div class="truss"></div><div class="bdrop purple">{I("v4-go-white.svg", h=70)}<div>{I("v4-lockup-purple.svg", h=40)}{SLO("s-md")}</div></div><div class="floor"></div></div><div class="cap">Backdrop de palco / photo opp</div></div>
<div><div class="tote2"><div>{I("v4-stacked-purple.svg", w=110)}</div></div><div class="cap">Ecobag</div></div>
</div>{foot(7)}</section>""")

# 8 — mídia exterior
pages.append(f"""<section class="page light"><div class="eyebrow">8 · Rua</div><h2>Outdoor, ponto de ônibus e cartaz</h2>
<div class="outg">
<div><div class="bill"><div class="board photo" {photo(PH1, "cover", "center 30%")}><div class="ovl"></div><div class="bt">{SLO("s-bill")}<span>Os rolês da sua cidade, num swipe.</span></div><div class="bl">{I("v4-stacked-purple.svg", h=96)}<span class="store">Baixe grátis · iOS e Android</span></div></div><div class="legs"><i></i><i></i></div></div><div class="cap">Outdoor 9 × 3 m</div>
<div class="r2b"><div><div class="door"><div class="glass"><div class="seal purple">{I("v4-go-white.svg", h=40)}<b>Tem rolê aqui.</b>{I("v4-lockup-purple.svg", h=14)}</div></div></div><div class="cap">Selo de parceiro na vitrine</div></div>
<div><div class="wind"><div class="flag purple"><div class="vt">{SLO("s-sm")}</div>{I("v4-go-white.svg", h=40)}</div><div class="pole"></div></div><div class="cap">Wind banner</div></div></div></div>
<div class="r2">
<div><div class="mupi"><div class="mp purple">{I("v4-go-white.svg", h=46)}<div class="mt">Sem plano<br>pra sexta?<br><b>Bora.</b></div>{I("v4-lockup-purple.svg", h=20)}{SLO("s-xs")}</div></div><div class="cap">Mupi · ponto de ônibus</div></div>
<div><div class="poster photo" {photo(PH2, "cover", "center 30%")}><div class="ov2"></div><div class="pp">{SLO("s-md")}<span>Festas, bares, shows e churrascos perto de você.</span><div class="pf">{I("v4-lockup-purple.svg", h=18)}<span class="qr3"></span></div></div></div><div class="cap">Cartaz A3 · lambe-lambe</div></div>
</div></div>{foot(8)}</section>""")

# 9 — papelaria e digital institucional
pages.append(f"""<section class="page mist"><div class="eyebrow">9 · Institucional</div><h2>Cartão, assinatura de e-mail, apresentação e capas</h2>
<div class="ing">
<div><div class="cards"><div class="bc purple fr">{I("v4-lockup-purple.svg", h=34)}{SLO("s-sm")}</div><div class="bc dark back"><b>Laércio Germano</b><span>Fundador</span><span>laercio@rolego.app · rolego.app</span>{I("v4-go-dark.svg", h=34)}</div></div><div class="cap">Cartão de visita · frente e verso</div>
<div class="mail"><div class="mh">Para: parceiros@bar.com · Assunto: Parceria RolêGo</div><div class="mb">Abraço,<br><br><div class="sig">{I("v4-icon-app.svg", h=40)}<div><b>Laércio Germano</b><br>Fundador · RolêGo<br><span>rolego.app · @rolego</span></div><div class="sgs">{SLO("s-xs ink")}</div></div></div></div><div class="cap">Assinatura de e-mail</div></div>
<div><div class="slide purple">{I("v4-go-white.svg", h=40)}<div class="sbig">Os rolês da sua cidade,<br><b>num swipe.</b></div><div class="sft">{I("v4-lockup-purple.svg", h=16)}<span>Apresentação para parceiros · 2026</span></div></div><div class="cap">Capa de apresentação 16:9</div>
<div class="slide dark small"><div class="sk">3 · O PROBLEMA</div><div class="sbig2">Decidir onde sair<br>leva mais tempo<br>que o <b>rolê</b>.</div>{I("v4-go-dark.svg", h=22, cls="corner")}</div><div class="cap">Slide interno</div></div>
<div><div class="lcov photo" {photo(PH1, "cover", "center 30%")}><div class="ovl"></div>{SLO("s-md")}<div class="cl">{I("v4-icon-avatar.svg", h=52)}<div><b>RolêGo</b><span>Os rolês da sua cidade, num swipe.</span></div></div></div><div class="cap">Capa LinkedIn / YouTube</div>
<div class="nl"><div class="nlh purple">{I("v4-lockup-purple.svg", h=22)}<span>Rolês da semana · #12</span></div><div class="nlb"><b>Viva o rolê: 5 rolês pra sexta</b>
{"".join(f'<div class="nli"><i class="photo" style="background-image:url({ph});background-size:cover"></i><div><b>{t}</b><span>{d}</span></div></div>' for ph, t, d in [(PH1, "Samba no Largo", "sex 21h · Pinheiros"), (PH2, "Baile da Laje", "sáb 23h · Vila Madalena")])}
<span class="btn2">Ver todos no app</span></div></div><div class="cap">E-mail marketing</div></div>
</div>{foot(9)}</section>""")

USOS_CSS = """
.soc2{display:grid;grid-template-columns:1fr 1fr 1.2fr;gap:14px;margin-top:6px}
.wa{background:#0B141A;border-radius:12px;padding:10px;height:178px;display:flex;flex-direction:column;gap:6px;font-size:9.5px;color:#E9EDEF}.wah{display:flex;gap:7px;align-items:center;font-size:9px}.wah span{color:#8696A0;font-size:8px}
.msg{max-width:85%;padding:6px 8px;border-radius:8px}.msg.in{background:#202C33;align-self:flex-start}.msg.out{background:#005C4B;align-self:flex-end}
.lp{display:flex;background:rgba(0,0,0,.25);border-radius:6px;overflow:hidden;margin-bottom:5px}.lpi{width:62px;flex-shrink:0}.lpt{padding:6px;display:flex;flex-direction:column;gap:1px;font-size:8.5px}.lpt span{color:#AEBAC1}.lpt i{color:#8696A0;font-style:normal}
.ad{background:#fff;border:1px solid #DCDDE5;border-radius:12px;overflow:hidden;height:178px;display:flex;flex-direction:column}.adh{display:flex;gap:7px;align-items:center;padding:6px 10px;font-size:9px;line-height:1.1}.adh span{display:block;color:#5B6070;font-size:7.5px}
.adi{flex:1;display:flex;align-items:flex-end;padding:10px}.adt{position:relative}.adc{display:flex;justify-content:space-between;align-items:center;padding:7px 10px;font-size:9px;border-top:1px solid #DCDDE5}.adc b{background:linear-gradient(135deg,#9E19E9,#452EFF);color:#fff;border-radius:6px;padding:4px 12px}
.car{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;height:178px}.cs{border-radius:8px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;color:#fff}.cs .n{font-size:8px;opacity:.7}.cs b{font-size:19px;font-style:italic;line-height:1.05;letter-spacing:-.02em}.cs b i{color:#00E5E5}
.sp2{grid-column:span 2}.stage{height:220px;background:#0B0B10;border-radius:12px;position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;padding-top:16px}
.truss{position:absolute;top:8px;left:20px;right:20px;height:6px;background:repeating-linear-gradient(90deg,#2A2A33 0 6px,#16161C 6px 12px)}
.bdrop{width:86%;height:150px;border-radius:4px;display:flex;align-items:center;justify-content:center;gap:24px;box-shadow:0 0 40px rgba(158,25,233,.5)}.bdrop>div{display:flex;flex-direction:column;gap:6px}.floor{position:absolute;bottom:0;left:0;right:0;height:40px;background:linear-gradient(180deg,#16161C,#000)}
.tote2{height:220px;background:#fff;border-radius:12px;display:flex;align-items:flex-end;justify-content:center;padding-bottom:14px}.tote2 div{width:150px;height:160px;background:linear-gradient(160deg,#9E19E9,#452EFF);border-radius:4px 4px 10px 10px;position:relative;display:flex;align-items:center;justify-content:center}
.tote2 div:before{content:"";position:absolute;top:-48px;left:40px;width:62px;height:58px;border:7px solid #6539CB;border-bottom:0;border-radius:40px 40px 0 0}
.r2b{display:grid;grid-template-columns:1.4fr 1fr;gap:14px;margin-top:14px}
.door{height:200px;background:#2A2A30;border-radius:8px;padding:10px}.glass{height:100%;border-radius:4px;background:linear-gradient(135deg,#3A4150,#1C2028 60%,#2E3440);display:flex;align-items:center;justify-content:center}
.seal{width:120px;height:120px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;border:4px solid #fff}.seal b{color:#fff;font-size:12px;font-style:italic}
.wind{height:200px;position:relative;display:flex;justify-content:center;background:#fff;border-radius:12px}.flag{position:absolute;top:10px;width:70px;height:180px;border-radius:40px 4px 4px 4px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:14px 0 12px}
.vt{writing-mode:vertical-rl;transform:rotate(180deg)}.pole{position:absolute;top:10px;bottom:6px;left:calc(50% - 38px);width:3px;background:#2A2A30}
.mupi{height:430px!important}.poster{height:446px!important}
.nl{background:#fff;border:1px solid #DCDDE5;border-radius:10px;overflow:hidden;margin-top:12px}.nlh{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;color:#fff;font-size:9px}
.nlb{padding:12px 14px;display:flex;flex-direction:column;gap:8px;font-size:9.5px}.nlb>b{font-size:13px;font-style:italic}.nli{display:flex;gap:10px;align-items:center}.nli i{width:54px;height:40px;border-radius:6px;display:block}.nli b{display:block}.nli span{color:#5B6070}
.apps4 .phone{zoom:1.18}
.mist{background:#ECECF3;color:#05070F}.cap{font-size:9.5px;font-weight:700;color:#5B6070;text-transform:uppercase;letter-spacing:.04em;margin-top:6px}
.lead2{font-size:12px;color:#5B6070;max-width:820px;line-height:1.5}.lead2 b{color:#6539CB}
.slo{font-family:Poppins;font-weight:800;font-style:italic;letter-spacing:-.02em;line-height:1;color:#fff;white-space:nowrap}.slo b{color:#00E5E5}
.slo.grad b{color:#00E5E5}
.slo.ink{color:#05070F}.slo.ink b{color:#7A2CF0}
.s-xs{font-size:12px}.s-sm{font-size:16px}.s-md{font-size:30px}.s-lg{font-size:30px}.s-xl{font-size:54px;white-space:normal}.s-tee{font-size:22px;white-space:normal;text-align:center}.s-bill{font-size:56px}
.sl3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;flex:1;min-height:0}
.slc{border-radius:16px;padding:20px 22px;display:flex;flex-direction:column;justify-content:center;gap:4px}.slc .s-lg{margin-left:30px}
.slc.purple,.purple{background:linear-gradient(135deg,#9E19E9 0%,#6539CB 50%,#452EFF 100%);color:#fff}.slc.dark,.dark{background:#000;color:#fff}.slc.lite{background:#fff;border:1px solid #DCDDE5}
.slc.ctr{align-items:center;gap:10px}
.rules{display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:10.5px;color:#5B6070;line-height:1.45}.rules b{color:#05070F}
.photo{background-color:#120A24;background-repeat:no-repeat;position:relative;overflow:hidden}
.ov,.ov2,.ov3,.ovl{position:absolute;inset:0}.ov{background:linear-gradient(180deg,rgba(101,57,203,.15) 0%,rgba(69,46,255,.55) 55%,rgba(40,10,90,.95) 100%)}
.ov2{background:linear-gradient(180deg,rgba(0,0,0,0) 30%,rgba(0,0,0,.85) 62%,#000 100%)}.ov3{background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.75))}
.ovl{background:linear-gradient(90deg,rgba(60,10,140,.95) 0%,rgba(101,57,203,.75) 45%,rgba(69,46,255,.15) 100%)}
.soc{display:grid;grid-template-columns:200px 200px 200px 190px 1fr;gap:14px;align-items:start}
.post{width:200px;height:200px;border-radius:10px;padding:14px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden}
.post>*{position:relative}.post .big{font-size:30px;font-weight:800;font-style:italic;line-height:1;letter-spacing:-.03em;color:#fff}.post .big b{color:#00E5E5}
.pb{display:flex;justify-content:space-between;align-items:flex-end;font-size:9px;color:rgba(255,255,255,.75)}
.chip{background:#fff;color:#6539CB;font-weight:800;border-radius:99px;padding:4px 10px;font-size:9px}
.evc{display:flex;flex-direction:column;gap:3px;color:#9CA3AF;font-size:9.5px;background:#0F0F13;border:1px solid #1E1E25;border-radius:12px;padding:10px}.evc b{color:#fff;font-size:15px;font-style:italic}
.tag{align-self:flex-start;background:#00E5E5;color:#000;font-weight:800;font-size:8px;border-radius:99px;padding:2px 8px}
.ppl{display:flex;align-items:center;gap:0;font-size:9px;color:#9CA3AF}.ppl i{width:16px;height:16px;border-radius:50%;background:linear-gradient(135deg,#9E19E9,#452EFF);border:2px solid #0F0F13;margin-right:-5px;display:block}.ppl i:last-of-type{margin-right:6px}
.btn2{align-self:flex-start;background:linear-gradient(135deg,#9E19E9,#452EFF);color:#fff;font-weight:800;font-style:italic;font-size:10px;border-radius:99px;padding:4px 14px;margin-top:3px}
.story{width:190px;height:338px;border-radius:14px;padding:12px;display:flex;flex-direction:column;justify-content:space-between}.story>*{position:relative}
.st-top{display:flex;gap:4px}.st-top i{flex:1;height:2px;background:rgba(255,255,255,.4);border-radius:2px}.st-top i.on{background:#fff}
.st-bot{display:flex;flex-direction:column;align-items:center;gap:8px}.sw{font-size:9px;color:#fff;font-weight:600}
.ig{background:#fff;border-radius:12px;padding:12px;border:1px solid #DCDDE5}.igh{display:flex;gap:10px;align-items:center;font-size:9px;line-height:1.35}.igh b{font-size:11px}.igh span{display:block;color:#5B6070}.igh .st{color:#05070F;margin-top:3px}
.hl{display:flex;gap:10px;margin:10px 0}.hl div{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:8px}.hl i{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px #fff,0 0 0 3px #C9C9D6}
.igg{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}.igg i{aspect-ratio:1;display:block}
.igg .ph1{background:url(foto-multidao-1.jpg) center/cover}.igg .ph2{background:url(foto-multidao-2.jpg) center/cover}
.apps4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;justify-items:center}
.phone{width:200px;height:400px;border-radius:30px;border:7px solid #15161C;overflow:hidden;position:relative}
.phone.splash{gap:12px}
.map{background:#0B0B10}.map svg.bg{position:absolute;inset:0;width:100%;height:100%}.mtop{position:absolute;top:14px;left:12px;right:12px;display:flex;justify-content:space-between;align-items:center;font-size:9px;color:#fff;background:rgba(15,15,19,.85);border-radius:99px;padding:6px 10px}
.mkr{position:absolute;transform:translate(-50%,-100%)}.mkr.big .pin{background:linear-gradient(135deg,#9E19E9,#452EFF);border-radius:14px;padding:6px 8px;box-shadow:0 0 0 3px rgba(158,25,233,.35)}
.me{position:absolute;width:12px;height:12px;border-radius:50%;background:#00E5E5;box-shadow:0 0 0 6px rgba(0,229,229,.25)}
.sheet{position:absolute;left:8px;right:8px;bottom:8px;background:#0F0F13;border:1px solid #1E1E25;border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:2px;color:#9CA3AF;font-size:9px}.sheet b{color:#fff;font-size:13px;font-style:italic}
.evt{background:#000}.hero3{height:170px;position:relative;padding:12px;display:flex;align-items:flex-end}.hero3 .tag{position:relative}
.eb{padding:12px;display:flex;flex-direction:column;gap:6px;color:#9CA3AF;font-size:9.5px}.eb b{color:#fff;font-size:17px;font-style:italic;letter-spacing:-.02em}
.match{display:flex;gap:8px;align-items:center;background:#0F0F13;border:1px solid #00E5E5;color:#fff;font-weight:700;border-radius:12px;padding:8px 10px}
.btn3{background:linear-gradient(135deg,#9E19E9,#452EFF);color:#fff;font-weight:800;font-style:italic;font-size:12px;border-radius:99px;padding:10px;text-align:center;margin-top:4px}
.lock{padding:10px;display:flex;flex-direction:column;gap:8px}.lock>*{position:relative}.clock{color:#fff;font-size:44px;font-weight:600;text-align:center;margin:26px 0 30px;line-height:1}.clock span{display:block;font-size:10px;font-weight:400;margin-top:6px}
.nt{background:rgba(40,40,50,.7);backdrop-filter:blur(6px);border-radius:14px;padding:9px;display:flex;gap:8px;color:#fff;font-size:9px;line-height:1.35}.nt img{border-radius:6px;flex-shrink:0}.nt span{color:#9CA3AF;float:right}
.evg{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:14px}
.band2{height:56px;border-radius:10px;background:linear-gradient(90deg,#9E19E9,#6539CB,#452EFF);display:flex;align-items:center;gap:14px;padding:0 14px}.band2 .inf{font-size:8.5px;font-weight:800;color:#fff;border-left:2px solid #fff;padding-left:8px;line-height:1.3}
.qr,.qr2,.qr3{display:block;background:repeating-conic-gradient(#000 0 25%,#fff 0 50%) 0 0/8px 8px;border:3px solid #fff}.qr{width:34px;height:34px;margin-left:auto}
.tix{display:flex;margin-top:14px;border-radius:14px;overflow:hidden;height:150px}.tl{flex:1;background:#000;padding:14px;display:flex;flex-direction:column;gap:4px;color:#9CA3AF;font-size:9.5px}.tl b{color:#fff;font-size:18px;font-style:italic;margin-top:6px}
.tr{width:110px;background:linear-gradient(135deg,#9E19E9,#452EFF);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;border-left:2px dashed #000;color:#fff;font-size:8px;font-weight:700}.qr2{width:64px;height:64px}
.badge{height:200px;border-radius:12px;background:linear-gradient(160deg,#9E19E9,#452EFF);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:#fff;position:relative;overflow:hidden}.badge b{font-size:18px;font-style:italic}.badge>span{background:#00E5E5;color:#000;font-weight:800;font-size:9px;border-radius:99px;padding:2px 10px;letter-spacing:.1em}
.hole{position:absolute;top:10px;width:36px;height:8px;border-radius:9px;background:#ECECF3}.bb{position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,.25);padding:6px;display:flex;justify-content:center}
.cup{height:200px;display:flex;justify-content:center}.cupb{width:110px;height:190px;background:linear-gradient(160deg,#9E19E9,#452EFF);clip-path:polygon(0 0,100% 0,88% 100%,12% 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}
.tee{height:200px;position:relative;display:flex;justify-content:center}.tee svg{height:200px}.tp{position:absolute;top:52px;left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:8px}
.stks{height:200px;background:#fff;border-radius:12px;position:relative;overflow:hidden}.stks>div{position:absolute;filter:drop-shadow(0 4px 6px rgba(0,0,0,.2))}
.sk1{left:12px;top:14px;transform:rotate(-8deg)}.sk1 img{border:4px solid #fff;border-radius:50%}.sk2{right:8px;top:100px;transform:rotate(6deg);background:#000;border:3px solid #fff;border-radius:10px;padding:8px 10px}.sk3{left:30px;bottom:12px;transform:rotate(10deg);background:#fff;border-radius:12px;padding:4px}
.outg{display:grid;grid-template-columns:1.55fr 1fr;gap:18px;align-items:start}
.bill{display:flex;flex-direction:column;align-items:center}.board{width:100%;height:220px;border:6px solid #1A1A20;border-radius:4px;padding:20px 24px;display:flex;justify-content:space-between;align-items:center}
.board>*{position:relative}.bt{display:flex;flex-direction:column;gap:10px}.bt span{color:#fff;font-size:14px;font-weight:600}.bl{display:flex;flex-direction:column;align-items:center;gap:8px}.store{background:#000;color:#fff;font-size:9px;font-weight:700;border-radius:8px;padding:6px 10px}
.legs{display:flex;gap:200px}.legs i{width:12px;height:60px;background:#2A2A30;display:block}
.r2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.mupi{background:#1A1A20;border-radius:8px;padding:8px;height:300px}.mp{height:100%;border-radius:4px;padding:16px 14px;display:flex;flex-direction:column;justify-content:space-between;align-items:flex-start}.mt{color:#fff;font-size:24px;font-weight:800;font-style:italic;line-height:1.02;letter-spacing:-.03em}.mt b{color:#00E5E5}
.poster{height:316px;border-radius:4px;display:flex;align-items:flex-end;box-shadow:0 6px 16px rgba(0,0,0,.2)}.pp{position:relative;padding:14px;display:flex;flex-direction:column;gap:8px;color:#fff;font-size:10px;width:100%}
.pf{display:flex;justify-content:space-between;align-items:center}.qr3{width:30px;height:30px}
.ing{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;align-items:start}
.cards{display:flex;flex-direction:column;gap:10px}.bc{width:250px;height:142px;border-radius:10px;padding:16px;display:flex;flex-direction:column;justify-content:space-between;align-items:flex-start;box-shadow:0 6px 14px rgba(0,0,0,.15)}
.bc.fr{justify-content:center;align-items:center;gap:6px}.bc.back{font-size:9.5px;color:#9CA3AF;gap:2px;justify-content:flex-start;position:relative}.bc.back b{color:#fff;font-size:14px;font-style:italic}.bc.back img{position:absolute;right:14px;bottom:12px}
.mail{background:#fff;border:1px solid #DCDDE5;border-radius:10px;margin-top:12px;font-size:9.5px;overflow:hidden}.mh{background:#F4F4F8;padding:7px 10px;color:#5B6070;border-bottom:1px solid #DCDDE5}.mb{padding:10px}
.sig{display:flex;gap:10px;align-items:center;line-height:1.35;border-top:1px solid #DCDDE5;padding-top:10px}.sig img{border-radius:9px}.sig span{color:#6539CB;font-weight:600}.sgs{margin-left:auto}
.slide{width:100%;aspect-ratio:16/9;border-radius:8px;padding:16px;display:flex;flex-direction:column;justify-content:space-between;position:relative;box-shadow:0 6px 14px rgba(0,0,0,.15)}
.sbig{color:#fff;font-size:22px;font-weight:800;font-style:italic;line-height:1.05;letter-spacing:-.02em}.sbig b{color:#00E5E5}.sft{display:flex;justify-content:space-between;align-items:center;font-size:8px;color:rgba(255,255,255,.75)}
.slide.small{margin-top:12px}.sk{font-size:8px;font-weight:700;color:#9CA3AF;letter-spacing:.08em}.sbig2{color:#fff;font-size:18px;font-weight:800;font-style:italic;line-height:1.05}.sbig2 b{color:#00E5E5}.corner{position:absolute;right:14px;bottom:12px}
.lcov{height:150px;border-radius:8px;padding:18px;display:flex;flex-direction:column;justify-content:space-between}.lcov>*{position:relative}.cl{display:flex;gap:10px;align-items:center;color:#fff;font-size:9.5px}.cl b{display:block;font-size:13px}.cl img{border:3px solid #fff;border-radius:50%}
"""

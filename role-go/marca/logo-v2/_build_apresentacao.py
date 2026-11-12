#!/usr/bin/env python3
"""Monta apresentacao-logo-v2.html a partir dos SVGs em conceitos/ (rodar _build_conceitos.py antes)."""
import os, re

HERE = os.path.dirname(os.path.abspath(__file__))
C = os.path.join(HERE, "conceitos")
TOTAL = 22


def svg(name, h=None, w=None, d=None):
    s = open(os.path.join(d or C, name)).read()
    s = re.sub(r"<title>.*?</title>", "", s)
    style = []
    if h: style.append(f"height:{h}px;width:auto")
    if w: style.append(f"width:{w}px;height:auto")
    return s.replace("<svg ", f'<svg style="display:block;{";".join(style)}" ', 1)


def ladder(k, suf=""):
    small = "a-symbol-16.svg" if k == "a" else f"{k}-symbol{suf}.svg"  # A tem corte próprio p/ 16 px
    return svg(f"{k}-symbol{suf}.svg", h=64) + svg(f"{k}-symbol{suf}.svg", h=32) + svg(small, h=16)


def foot(n):
    return f'<div class="foot"><span>RoleGo · Logo v2 — conceitos</span><span>{n} / {TOTAL}</span></div>'


CONCEPTS = [
    dict(k="a", nome="A — o pin", tipo="Wordmark com letra-símbolo", rec=True,
         q="O último “o” do RoleGo é o pin do rolê.",
         txt="O “o” final da Poppins 800 Itálico ganha uma ponta embaixo e vira o pin de localização; o miolo do “o” é o furo do pin. O nome já diz onde está o rolê, sem desenho extra.",
         bl=["<b>Construção:</b> glifos Poppins 800 Itálico em curvas · pin = o externo r288 com o topo na altura do G + tangentes até a ponta, 83 abaixo da base · furo = miolo r119 · tudo inclinado 10° como o itálico",
             "<b>Por que funciona:</b> identifica (o “o” é do nome) com um detalhe próprio (o pin); continua o que foi aprovado em 26/10, agora como forma e não como efeito",
             "<b>Sistema:</b> o pin-o marca eventos no mapa, vira loading (pin pulsando) e o cursor do swipe",
             "<b>Risco:</b> pin é clichê de app de mapa; o que salva é estar dentro do nome. Em 16 px o furo fecha: usar o corte pequeno (V1, furo maior)"]),
    dict(k="b", nome="B — R ping", tipo="Monograma", rec=False,
         q="O R do RoleGo com o ping de quem está chegando.",
         txt="O R da Poppins 800 Itálico com um ponto redondo no alto, à direita: o ping de localização / notificação do ícone aprovado na v1, agora em uma cor, sem gradiente.",
         bl=["<b>Construção:</b> glifo R em curvas + círculo r95 alinhado à altura das maiúsculas, 40 de respiro",
             "<b>Por que funciona:</b> é o ícone de app aprovado (R + ping) reduzido ao essencial; lê bem em 16 px",
             "<b>Sistema:</b> o ponto vira o badge de notificação e o “ao vivo” dos eventos",
             "<b>Risco:</b> letra + ponto é comum (alerta do pacote 04-logos); no lockup lê “R’ RoleGo”, como apóstrofo"]),
    dict(k="c", nome="C — pin play", tipo="Pictórico", rec=False,
         q="O pin com o play: o rolê começa aqui.",
         txt="Um pin sólido com um triângulo de “play” vazado: o lugar + o “Go”. Inclinado 10°, no mesmo ângulo do itálico do wordmark.",
         bl=["<b>Construção:</b> cabeça r330, ponta 260 abaixo da base, play equilátero de 150 deslocado para o centro óptico",
             "<b>Por que funciona:</b> a ideia mais direta de “ir” (Go); ícone forte e simples, 10 âncoras",
             "<b>Sistema:</b> o play vira o CTA “Bora” e o botão de swipe",
             "<b>Risco:</b> o menos próprio: pin + play lembra mapa + vídeo; o play fecha em 16 px; não conversa com o nome"]),
]

CSS = """:root{--ink:#05070F;--vi:#8749FF;--cy:#00E5E5;--mg:#FF1F7A;--dk:#04050B;--mut:#5B6070;--line:#E2E3EA;--bg:#F4F4F8;--vs:#EFE8FF;
--font:"Poppins",system-ui,"Segoe UI",sans-serif}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#C9CAD4;color:var(--ink);font-family:var(--font);font-size:12.5px;line-height:1.5;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{padding:24px 0}@page{size:297mm 210mm;margin:0}
.page{width:297mm;height:210mm;margin:0 auto 24px;padding:14mm 16mm 11mm;position:relative;overflow:hidden;background:#fff;box-shadow:0 8px 30px rgba(5,7,15,.18);display:flex;flex-direction:column}
.page.mist{background:var(--bg)}
.page.cover{background:var(--dk);color:#fff}.cover .lead{color:#A6A9B8}.cover .foot{border-color:#1E1E25;color:#7C8090}
@media print{html,body{background:none;padding:0}.page{margin:0;box-shadow:none;break-after:page}.no-print{display:none!important}}
.help{max-width:297mm;margin:0 auto 14px;font-size:12px;color:#3A4254}
.eyebrow{font-size:12px;font-weight:700;color:var(--vi);display:flex;align-items:center;gap:10px}
.cover .eyebrow{color:var(--cy)}.cover .eyebrow b{background:var(--cy);color:var(--dk)}
.eyebrow b{display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:22px;padding:0 8px;border-radius:99px;background:var(--vi);color:#fff}
h1{font-size:44px;font-weight:800;font-style:italic;letter-spacing:-.03em;line-height:1.08;max-width:780px;margin:26px 0 14px}
h1 .go{color:var(--cy)}
h2{font-size:27px;font-weight:800;font-style:italic;letter-spacing:-.02em;line-height:1.12;margin:6px 0 12px}
h2 .tipo{font-size:12px;font-weight:600;font-style:normal;color:var(--mut);vertical-align:middle;margin-left:8px;padding:3px 10px;border:1px solid var(--line);border-radius:99px}
h3{font-size:14px;font-weight:800;margin:6px 0 2px}
.lead{font-size:13.5px;color:var(--mut);max-width:700px;margin-bottom:14px}
.cv{margin:auto 0}
.foot{margin-top:auto;padding-top:9px;border-top:1px solid var(--line);display:flex;justify-content:space-between;font-size:10px;color:var(--mut)}
.label{font-size:10.5px;font-weight:700;color:var(--mut);margin-bottom:8px;letter-spacing:.04em;text-transform:uppercase}
.grid{display:grid;gap:14px}.g4{grid-template-columns:repeat(4,1fr)}.g2{grid-template-columns:1.1fr 1fr}.g3{grid-template-columns:repeat(3,1fr)}
.card{border-radius:14px;padding:14px;background:var(--bg);border:1px solid var(--line)}
.mist .card{background:#fff}.card.acc{border-left:4px solid var(--vi)}.card p{color:var(--mut)}
.card.rec{border:2px solid var(--ink)}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{display:inline-flex;align-items:center;height:24px;padding:0 10px;border-radius:99px;font-size:11px;font-weight:600;background:var(--vs);color:#5A2BD1}
.chip.c{background:#DFFBFB;color:#047A7C;vertical-align:middle}
.chip.x{background:#FFE6EF;color:#B3124F;text-decoration:line-through}
.tb{width:100%;border-collapse:collapse}.tb th,.tb td{text-align:left;padding:7px 6px;border-bottom:1px solid var(--line);vertical-align:top}
.tb th{width:96px;font-size:10.5px;color:var(--mut);text-transform:uppercase}
.note{font-size:10.5px;color:var(--mut);margin-top:10px}
.ov .big{display:flex;justify-content:center;padding:4px 0}.ov .lk{padding:10px 0;border-top:1px solid var(--line);display:flex;justify-content:center}
.lad{display:flex;align-items:flex-end;gap:14px}.ov .lad{margin:6px 0}
.mut{color:var(--mut);font-size:11.5px}
.cg{display:grid;grid-template-columns:270px 1fr;gap:28px;align-items:center}
.hero{background:var(--bg);border-radius:16px;display:flex;justify-content:center;align-items:center;padding:10px}
.q{font-size:18px;font-weight:800;font-style:italic;letter-spacing:-.01em;margin-bottom:8px;color:var(--vi)}
.bl{margin:10px 0 0 18px}.bl li{margin-bottom:5px}
.row4{display:grid;grid-template-columns:130px 130px 170px 1fr;gap:12px;margin-top:14px}
.tile{border-radius:12px;padding:10px 12px;border:1px solid var(--line);display:flex;flex-direction:column;justify-content:space-between;min-height:118px}
.tile.dk{background:var(--dk);border-color:var(--dk)}.tile.dk .label{color:rgba(255,255,255,.6)}
.tile.cy{background:var(--cy);border-color:var(--cy)}.tile.cy .label{color:rgba(5,7,15,.65)}
.tile.wide{align-items:flex-start}
.cmp{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;margin-top:6px}
.cmp th{background:var(--dk);color:#fff;text-align:left;padding:9px 12px;font-size:12px}
.cmp td{padding:8px 12px;border-bottom:1px solid var(--line)}.cmp td:first-child{font-weight:700}
.cmp .hi{color:#5A2BD1;font-weight:800}.cmp .lo{color:#C2185B;font-weight:700}
.sw{display:flex;gap:8px;margin-top:8px}.sw span{flex:1;border-radius:10px;height:46px;padding:6px 8px;font-size:10px;font-weight:600;display:flex;align-items:flex-end}
"""

pages = []

# 1 capa
pages.append(f"""<section class="page cover"><div class="eyebrow"><b>v2</b> Apresentação da logo · 08/11/2026</div>
<div class="cv"><div style="margin-bottom:6px">{svg("c1-lockup-color.svg", h=150, d=os.path.join(HERE, "canal"))}</div>
<h1>Conceitos, variações e a estrutura do <span class="go">Go</span> da marca RoleGo</h1>
<p class="lead">Conceitos em preto primeiro, testados em 16 px e em uma cor, seguindo o pacote <b style="color:#fff">04-logos</b>. <b style="color:#fff">Escolhido em 08/11: E5 — canal</b>, com a família de variações nas páginas 15–17.</p></div>{foot(1)}</section>""")

# 2 brief
pages.append(f"""<section class="page"><div class="eyebrow"><b>01</b> Brief</div><h2>O que a logo precisa identificar</h2>
<div class="grid g2"><div><table class="tb">
<tr><th>Nome</th><td>RoleGo — “rolê” + “go”. Slogan “Viva o Rolê” · rolego.com.br · @rolego</td></tr>
<tr><th>O que faz</th><td>Mostra festas, shows e eventos privados por perto (feed, swipe, mapa), quem vai, o match do grupo, o ingresso com QR e o chat do evento</td></tr>
<tr><th>Público</th><td>Explorador e solo de 18–30 anos que quer decidir rápido onde sair; anfitriões, bares e casas de eventos</td></tr>
<tr><th>Adjetivos</th><td>Descolado · noturno · social · rápido · seguro</td></tr>
<tr><th>Restrições</th><td>Poppins 800 Itálico · tema preto com neon (violeta #8749FF, ciano #00E5E5) · aprovados na v1: ícone R + ping e o “o” final como pin de localização</td></tr>
<tr><th>Testes</th><td>16 px · uma cor · fundo preto (principal) e branco · SVG sem texto vivo</td></tr></table>
<p class="note">Brief montado a partir de README.md (visão do produto), identidade-visual.md, marca/ (manual v1), epics.pdf e do pacote core/definir-projeto-moderno/04-logos.</p></div>
<div><div class="label">Clichês da categoria evitados</div><div class="chips">
<span class="chip x">Taça / drink</span><span class="chip x">Nota musical</span><span class="chip x">Globo de espelho</span><span class="chip x">Chama</span><span class="chip x">Coração</span><span class="chip x">Ingresso</span><span class="chip x">Pin solto, sem ideia</span></div>
<div class="card acc" style="margin-top:14px"><h3>Por que revisar a logo da v1</h3><p>O wordmark da v1 é <code>&lt;text&gt;</code> vivo montado por script, com gradiente ciano→violeta→magenta e brilho. O 04-logos pede o contrário: forma que funciona em uma cor e em 16 px, SVG em curvas, sem depender de gradiente ou glow (“purple glow” está na lista de anti-padrões). A ideia aprovada (pin no “o”, R + ping) fica; muda a construção.</p></div>
<div class="card" style="margin-top:12px"><div class="label">Cor proposta para o master (sem gradiente)</div>
<div class="sw"><span style="background:#05070F;color:#fff">Preto #05070F</span><span style="background:#fff;border:1px solid var(--line)">Branco</span><span style="background:#00E5E5">Ciano #00E5E5 · no preto</span><span style="background:#fff;border:1px solid var(--line);color:#8749FF">Violeta #8749FF · só no claro</span></div>
<p class="note" style="margin-top:8px">Sobre preto: “Go” e pin em ciano (sem roxo no preto). O gradiente ciano→violeta continua nos banners e botões, não na logo.</p></div></div></div>{foot(2)}</section>""")

# 3 visão geral
cards = ""
for c in CONCEPTS:
    k = c["k"]
    chip = ' <span class="chip c">recomendado</span>' if c["rec"] else ""
    cards += f"""<div class="card ov{' rec' if c['rec'] else ''}"><div class="big">{svg(f"{k}-symbol.svg", h=150)}</div>
<div class="lk">{svg(f"{k}-lockup.svg", h=52)}</div><div class="lad">{ladder(k)}</div>
<h3>{c['nome']}{chip}</h3><p class="mut">{c['tipo']} · {c['q']}</p></div>"""
pages.append(f"""<section class="page mist"><div class="eyebrow"><b>02</b> Visão geral</div><h2>Três conceitos, três tipos de marca</h2>
<p class="lead">Em preto de propósito: a forma tem que funcionar antes da cor e do neon. O wordmark é o mesmo nos três, Poppins 800 Itálico convertida em curvas.</p>
<div class="grid g3">{cards}</div>{foot(3)}</section>""")

# 4–6 conceitos
for i, c in enumerate(CONCEPTS):
    k = c["k"]
    lis = "".join(f"<li>{b}</li>" for b in c["bl"])
    rec = " · recomendado" if c["rec"] else ""
    pages.append(f"""<section class="page"><div class="eyebrow"><b>0{i+3}</b> Conceito {k.upper()}{rec}</div>
<h2>{c['nome']} <span class="tipo">{c['tipo']}</span></h2>
<div class="cg"><div class="hero">{svg(f"{k}-symbol.svg", h=230)}</div>
<div><p class="q">“{c['q'].rstrip('.')}.”</p><p>{c['txt']}</p><ul class="bl">{lis}</ul></div></div>
<div class="row4"><div class="tile dk"><div class="label">Cor · fundo preto</div>{svg(f"{k}-symbol-color.svg", h=80)}</div>
<div class="tile cy"><div class="label">Uma cor · preto</div>{svg(f"{k}-symbol.svg", h=80)}</div>
<div class="tile"><div class="label">64 · 32 · 16 px</div><div class="lad">{ladder(k)}</div></div>
<div class="tile dk wide"><div class="label">Lockup em cor</div>{svg(f"{k}-lockup-color.svg", h=70)}</div></div>{foot(i+4)}</section>""")

# 7 comparação
pages.append(f"""<section class="page mist"><div class="eyebrow"><b>06</b> Comparação e testes</div><h2>Os três passam no técnico; a diferença é ideia e originalidade</h2>
<table class="cmp"><tr><th>Critério</th><th>A — o pin</th><th>B — R ping</th><th>C — pin play</th></tr>
<tr><td>Audit svg_audit.py (0–100)</td><td>99</td><td>99</td><td>91 (play inclinado 10°, de propósito)</td></tr>
<tr><td>Pontos de ancoragem</td><td>16</td><td>27</td><td>10</td></tr>
<tr><td>Leitura em 16 px</td><td>Boa (silhueta do pin segura a ideia)</td><td>Boa</td><td>Média (play fecha)</td></tr>
<tr><td>Funciona em 1 cor</td><td>Sim</td><td>Sim</td><td>Sim</td></tr>
<tr><td>Ideia clara em 2 s</td><td class="hi">Alta</td><td>Média (R’ como apóstrofo)</td><td>Alta</td></tr>
<tr><td>Originalidade na categoria</td><td class="hi">Alta (pin dentro do nome)</td><td class="lo">Baixa (letra + ponto)</td><td class="lo">Baixa (pin + play)</td></tr>
<tr><td>Continuidade com a v1 aprovada</td><td class="hi">Alta (pin no “o”)</td><td class="hi">Alta (ícone R + ping)</td><td>Baixa</td></tr>
<tr><td>Base para sistema</td><td>Pin no mapa, loading, swipe</td><td>Badge / notificação</td><td>Botão play / CTA</td></tr></table>
<p class="note">Audit e âncoras: medidos pela skill logo-design do 04-logos. Demais linhas: avaliação de design. Pendente: teste de prateleira contra Sympla, Shotgun, Fever e Ingresse, e checagem humana de marca registrada (INPI).</p>{foot(7)}</section>""")

# 8 recomendação
pages.append(f"""<section class="page"><div class="eyebrow"><b>07</b> Recomendação</div><h2>Seguir com A — o pin</h2>
<div class="cg"><div class="hero" style="background:var(--dk)">{svg("a-symbol-color.svg", h=230)}</div><div>
<p class="q">A ideia mais própria, e é a que já foi aprovada: agora como forma, não como efeito.</p>
<p class="mut">Se quiser o R no ícone do app, dá para usar o B só como app icon e o A como logo; o pacote recomenda uma ideia só, então isso fica como opção.</p>
<div class="label" style="margin-top:14px">Próximos passos — kit completo</div><ol class="bl">
<li>Escolher a direção (A, B ou C) ou combinar elementos</li><li>Refinar geometria: ponta do pin, kerning G–o, corte de 16 px</li>
<li>Cor: no preto, “Go” e pin ciano #00E5E5; no claro, violeta #8749FF; sem gradiente no master</li><li>Versões em uma cor (preta, branca) e negativa</li>
<li>Lockups horizontal e empilhado (com “Viva o Rolê”)</li><li>Favicon, ícone de app e PWA (16–512 px)</li>
<li>BRAND.md: respiro, tamanho mínimo, usos proibidos</li><li>Atualizar manual v1, role-go/web e deploy/embreve com o novo SVG</li></ol></div></div>{foot(8)}</section>""")

# 9–11 variações
import json
VD = os.path.join(HERE, "variacoes")
META = json.load(open(os.path.join(VD, "meta.json")))
CSS += """.vc{padding:11px;display:flex;flex-direction:column;gap:6px}.vtop{display:flex;gap:8px;align-items:center}
.vbig{flex:1;display:flex;justify-content:center}.vcol{display:flex;flex-direction:column;gap:6px}
.vsw{border-radius:8px;padding:5px;border:1px solid var(--line);background:#fff}.vsw.dk{background:var(--dk);border-color:var(--dk)}
.vlk{padding:8px 0 2px;border-top:1px solid var(--line)}.vc h3{font-size:13px}.vc .chip{height:20px;font-size:10px;vertical-align:middle}
.vc .mut{font-size:10.5px;line-height:1.4}.risk{font-size:10px;color:#9A1B4B;line-height:1.35}"""


def vcard(k):
    m = META[k]
    lad = "".join(svg(f"{k}-symbol.svg", h=s, d=VD) for s in (48, 32, 16))
    return f"""<div class="card vc"><div class="vtop"><div class="vbig">{svg(f"{k}-symbol.svg", h=104, d=VD)}</div>
<div class="vcol"><div class="vsw">{svg(f"{k}-symbol-light.svg", h=40, d=VD)}</div><div class="vsw dk">{svg(f"{k}-symbol-color.svg", h=40, d=VD)}</div></div></div>
<div class="lad">{lad}</div><div class="vlk">{svg(f"{k}-lockup.svg", h=34, d=VD)}</div>
<h3>{k.upper()} — {m['nome']} <span class="chip">{m['base']}</span></h3><p class="mut">{m['ideia']}</p><p class="risk"><b>Risco:</b> {m['risco']}</p></div>"""


for n, (keys, title, lead) in enumerate([
    (["v1", "v2", "v3", "v4"], "Desdobrando o A: furo aberto, R pin, match, bloco",
     "Variações que cruzam o pin do A com o R do B e o “ir” do C. Preto, cor no claro e no preto, 48/32/16 px e lockup."),
    (["v5", "v6", "v7", "v8"], "Go, pin pousado, balão e ingresso",
     "Mais quatro caminhos: o “Go” sozinho e o pin contando chegada, conversa e entrada no evento."),
]):
    pages.append(f"""<section class="page mist"><div class="eyebrow"><b>0{8+n}</b> Variações · {n+1} de 2</div><h2>{title}</h2>
<p class="lead">{lead}</p><div class="grid g4">{"".join(vcard(k) for k in keys)}</div>{foot(9+n)}</section>""")

pages.append(f"""<section class="page"><div class="eyebrow"><b>10</b> Leitura das variações</div><h2>Caminho mais forte: A no wordmark, V4 no ícone, V1 no favicon</h2>
<div class="cg"><div class="hero" style="background:var(--dk)">{svg("v4-symbol-color.svg", h=230, d=VD)}</div><div>
<p class="q">Uma ideia só, o pin do “o”, em três tamanhos de uso.</p>
<ul class="bl"><li><b>A</b> segue como logo: o pin no lugar do “o”, agora com o topo na altura do G.</li>
<li><b>V4</b> vira ícone de app e avatar (@rolego): bloco ciano no preto, pin vazado.</li>
<li><b>V1</b> é o corte de 16 px (favicon, aba do navegador), com furo maior.</li>
<li><b>V3</b> fica como alternativa se a marca precisar contar o lado social (o match do grupo).</li>
<li><b>V2</b> e <b>V5</b> só se o R ou o “Go” precisarem aparecer sozinhos.</li>
<li>Descartar: <b>V7</b> (lê como balão de chat) e <b>V8</b> (ingresso é clichê de eventos).</li></ul>
<div class="vlk" style="margin-top:16px;border:0">{svg("a-lockup-color.svg", h=60)}</div></div></div>{foot(11)}</section>""")

# 12 animação (storyboard; a animação ao vivo está em animacao/index.html)
AD = os.path.join(HERE, "animacao")
AL = open(os.path.join(AD, "rolego-logo-animado.svg")).read()
AI = open(os.path.join(AD, "rolego-icone-animado.svg")).read()
FR = [0, 300, 500, 700, 900, 1060, 1300, 1900]
CSS += """.ast{display:grid;grid-template-columns:repeat(8,1fr);gap:8px;margin-top:6px}.af{background:var(--dk);border-radius:10px;padding:6px;margin:0}
.af svg{width:100%;height:auto;display:block}.af figcaption{font-size:9.5px;color:#7C8090;margin-top:2px}.af.i{padding:0;background:none}"""
fr = lambda svg, cls: "".join(f'<figure class="af {cls}" data-t="{t}">{svg}<figcaption>{t} ms</figcaption></figure>' for t in FR)
pages.append(f"""<section class="page"><div class="eyebrow"><b>11</b> Animação</div><h2>O G dá a saída, o pin chega</h2>
<p class="lead">O pin nasce dentro do G, faz um arco e pousa no lugar do “o”; ao tocar o chão abre uma onda de localização e a logo fica estática. ~1,7 s, uma vez (splash, site, vídeo). O mesmo gesto no ícone. Ao vivo: <b>animacao/index.html</b>.</p>
<div class="label">Logo</div><div class="ast">{fr(AL, "")}</div>
<div class="label" style="margin-top:12px">Ícone de app (G + pin)</div><div class="ast">{fr(AI, "i")}</div>
<p class="note">Regras do pacote de motion (05-identidade-visual): sem esticar, achatar, girar ou quicar a marca; <i>ease-emphasized</i> no pin; último quadro = logo estática; “reduzir movimento” mostra a logo parada. Loading: só o pin pulando com a onda (rolego-loading.svg).</p>{foot(12)}</section>""")

# 13–14 estrutura do Go
GD = os.path.join(HERE, "go")
GM = json.load(open(os.path.join(GD, "meta.json")))
CSS += """.g5{grid-template-columns:repeat(5,1fr)}.gc{padding:10px;display:flex;flex-direction:column;gap:6px}
.gc .cons svg{width:100%;height:auto;display:block;border-radius:8px;border:1px solid var(--line)}
.gc .dk{background:var(--dk);border-radius:8px;padding:8px}.gc h3{font-size:12.5px}.gc .mut{font-size:10px;line-height:1.4}
.gc .risk{font-size:9.5px}.big2{display:grid;grid-template-columns:1.25fr 1fr;gap:22px;align-items:start}
.big2 .cons svg{width:100%;height:auto;border-radius:12px;border:1px solid var(--line)}
.trio{display:flex;gap:10px;align-items:stretch;margin-top:10px}.trio>div{border-radius:12px;padding:10px;display:flex;align-items:center;justify-content:center}"""
REC_GO = "e5"


def gcard(k):
    m = GM[k]
    chip = ' <span class="chip c">recomendado</span>' if k == REC_GO else ""
    lad = "".join(svg(f"{k}-go.svg", h=h, d=GD) for h in (48, 32, 16))
    return f"""<div class="card gc{' rec' if k == REC_GO else ''}"><div class="cons">{svg(f"{k}-construcao.svg", d=GD)}</div>
<div class="dk">{svg(f"{k}-lockup-color.svg", h=34, d=GD)}</div><div class="lad">{lad}</div>
<h3>{k.upper()} — {m['nome']}{chip}</h3><p class="mut">{m['ideia']}</p><p class="risk"><b>Risco:</b> {m['risco']}</p></div>"""


pages.append(f"""<section class="page mist"><div class="eyebrow"><b>12</b> Estrutura do Go · estudos</div><h2>G e pin desenhados como um conjunto</h2>
<p class="lead">Medindo o G da Poppins 800 Itálico: traço 170, barra em 402, terminal em 473. A boca do G (402–473) cai exatamente na altura do furo do pin. Daí saem cinco formas de amarrar as duas letras.</p>
<div class="grid g5">{"".join(gcard(k) for k in GM)}</div>{foot(13)}</section>""")

pages.append(f"""<section class="page"><div class="eyebrow"><b>13</b> Estrutura do Go · construção</div><h2>E5 — canal: uma rota só, do G até o pin</h2>
<div class="big2"><div class="cons">{svg("e5-construcao.svg", d=GD)}</div><div>
<p class="q">A boca do G vira a rota que entra no pin.</p>
<ul class="bl"><li><b>Eixo:</b> o furo do pin fica no eixo da boca do G (437); a barra (402) e o terminal (473) viram as bordas do canal</li>
<li><b>Peso:</b> anel do pin = traço do G (170); furo r118</li>
<li><b>Encaixe:</b> o pin entra 175 na boca do G; o G abre espaço com respiro constante de 42</li>
<li><b>Canal:</b> 71 de altura, o mesmo vão da boca do G, atravessa o anel até o furo</li>
<li><b>Pequeno:</b> abaixo de 24 px usar o E1 (sem canal nem encaixe)</li>
<li><b>Animação:</b> o pin pode correr pelo canal, saindo da boca do G direto para o lugar</li>
<li><b>Alternativa segura:</b> E2 (encaixe sem canal), que fecha o pin e lê mais como pin de mapa</li></ul></div></div>
<div class="trio"><div style="background:var(--dk);flex:2.2">{svg("e5-lockup-color.svg", h=70, d=GD)}</div>
<div style="background:var(--dk);flex:.8">{svg("e5-go-color.svg", h=90, d=GD)}</div>
<div style="background:#fff;border:1px solid var(--line);flex:2.2">{svg("e5-lockup-light.svg", h=70, d=GD)}</div>
<div style="background:var(--cy);flex:.8">{svg("e5-go.svg", h=90, d=GD)}</div></div>{foot(14)}</section>""")

# 15–17 família canal (E5 escolhido)
CD = os.path.join(HERE, "canal")
CM = json.load(open(os.path.join(CD, "meta.json")))
CSS += """.cc{padding:11px;min-width:0;display:flex;flex-direction:column;gap:7px}.cc .cons svg{width:100%;height:auto;display:block;border-radius:8px;border:1px solid var(--line)}
.cc .row{display:flex;gap:6px}.cc .row>div{border-radius:8px;padding:7px;display:flex;align-items:center;justify-content:center;min-width:0}.cc .row>div:not(.lad) svg{max-width:100%;height:auto!important}
.cc .lad svg{flex-shrink:0}.gcc{grid-template-columns:repeat(4,minmax(0,1fr))}
.cc h3{font-size:13px}.cc .mut{font-size:10.5px;line-height:1.4}.cc .risk{font-size:10px}
.fam{display:grid;grid-template-columns:repeat(8,1fr);gap:8px;margin-top:12px}.fam>div{background:var(--dk);border-radius:10px;padding:8px;text-align:center;color:#A6A9B8;font-size:10px;font-weight:600}
.fam svg{width:100%;height:auto}"""


def ccard(k, d=CD, meta=None, chips=None, rec="c1"):
    m = (meta or CM)[k]
    chips = chips or {"c1": "escolhido", "c4": "preferido", "c6": "preferido"}
    chip = f' <span class="chip c">{chips[k]}</span>' if k in chips else ""
    CD = d
    lad = "".join(svg(f"{k}-go.svg", h=h, d=CD) for h in (32, 16))
    return f"""<div class="card cc{' rec' if k == rec else ''}"><div class="cons">{svg(f"{k}-construcao.svg", d=CD)}</div>
<div class="row"><div style="background:var(--dk);flex:2.4">{svg(f"{k}-lockup-color.svg", h=30, d=CD)}</div>
<div style="background:var(--cy);flex:.8">{svg(f"{k}-go.svg", h=40, d=CD)}</div></div>
<div class="row"><div style="background:#fff;border:1px solid var(--line);flex:2.4">{svg(f"{k}-lockup-light.svg", h=30, d=CD)}</div>
<div style="background:#fff;border:1px solid var(--line);flex:.8;align-items:flex-end;gap:6px" class="lad">{lad}</div></div>
<h3>{k.upper()} — {m['nome']}{chip}</h3><p class="mut">{m['ideia']}</p><p class="risk"><b>Risco:</b> {m['risco']}</p></div>"""


fam = "".join(f'<div>{svg(f"{k}-go-color.svg", d=CD)}{k.upper()} · {CM[k]["nome"]}</div>' for k in CM)
pages.append(f"""<section class="page cover"><div class="eyebrow"><b>14</b> Escolhido · E5 — canal</div>
<div class="cv"><div style="margin-bottom:10px">{svg("c1-lockup-color.svg", h=170, d=CD)}</div>
<h2 style="color:#fff">Uma rota só, do G até o pin. Agora como família.</h2>
<p class="lead">O E5 passa a ser o primeiro caminho. Regra comum das variações: a boca do G (402–473) continua como canal até o furo e o anel tem o traço do G (170). Muda o encaixe, a espessura do canal, o furo, a ponta e a aplicação.</p>
<div class="fam">{fam}</div></div>{foot(15)}</section>""")
for n, (keys, title, lead) in enumerate([
    (["c1", "c2", "c3", "c4"], "Canal: base, fino, furo largo e ligadura",
     "Variações no desenho do Go: quanto o canal abre, quanto o pin lê como “o” e se G e pin viram uma peça só."),
    (["c5", "c6", "c7", "c8"], "Canal: à distância, ponta na base, ícone e pin solto",
     "Variações de proporção e de aplicação: o pin separado do G, o Go compacto, o ícone de app e o símbolo sozinho."),
]):
    pages.append(f"""<section class="page mist"><div class="eyebrow"><b>{15+n}</b> Família canal · {n+1} de 2</div><h2>{title}</h2>
<p class="lead">{lead}</p><div class="grid gcc">{"".join(ccard(k) for k in keys)}</div>{foot(16+n)}</section>""")

exec(open(os.path.join(HERE, "_apresentacao_ligadura.py")).read())

html = f"""<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>RoleGo | Logo v2 — conceitos</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,600;0,700;0,800;1,800&display=swap" rel="stylesheet">
<style>{CSS}</style></head><body>
<p class="help no-print">Apresentação A4 paisagem · imprimir em PDF sem margens · SVGs em <code>conceitos/</code> · gerado por <code>_build_apresentacao.py</code></p>
{"".join(pages)}<script>document.querySelectorAll(".af").forEach(f=>f.querySelector("svg").getAnimations({{subtree:true}}).forEach(a=>{{a.pause();a.currentTime=+f.dataset.t;}}));</script></body></html>"""
open(os.path.join(HERE, "apresentacao-logo-v2.html"), "w").write(html)
print("ok")

# Páginas A4 paisagem do documento. Roda via exec() dentro do _build.py, depois de _posts.py.


def pag(n, secao, titulo, corpo, claro=False, sub=""):
    cls = "page claro" if claro else "page"
    s = f'<p class="lead">{sub}</p>' if sub else ""
    return (f'<section class="{cls}"><header><div>{badge(secao, "roxo" if claro else "azul", 1)}<h2>{titulo}</h2></div>{s}</header>'
            f'{corpo}{rodape(n, secao.lower())}</section>')


def rodape(n, extra):
    return f'<div class="foot"><span>RolêGo · identidade visual · estilo “Viva o rolê” · {extra}</span><span>{n}</span></div>'


def rot(t):
    return f'<div class="sub">{t}</div>'


def rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def cmyk(h):
    r, g, b = (x / 255 for x in rgb(h))
    k = 1 - max(r, g, b)
    if k >= 1:
        return (0, 0, 0, 100)
    return tuple(round(100 * v) for v in ((1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k))


def mix(h, alvo, p):
    return "#" + "".join(f"{round(x + (y - x) * p):02X}" for x, y in zip(rgb(h), rgb(alvo)))


def tinta(bg):
    return NOITE if contrast(bg, NOITE) > contrast(bg, BRANCO) else BRANCO


# ------------------------------------------------------------- 1 capa
def capa(n):
    return (f'<section class="page" style="padding:0">'
            f'<div class="ft" style="left:0;right:0;top:0;height:600px;background:url({foto("multidao-2", 1400)}) center top/cover"></div>{facho(.5)}'
            f'<div class="ft" style="inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 34%,rgba(0,0,0,.82) 62%,#000 76%)"></div>{arco(220)}'
            f'<div style="position:absolute;left:56px;top:44px">{logo(40)}</div>'
            f'<div style="position:absolute;left:56px;bottom:62px">{letras(600)}</div>'
            f'<div style="position:absolute;right:56px;bottom:84px;display:flex;flex-direction:column;align-items:flex-end;gap:12px">'
            f'<div style="display:flex;gap:7px">{badge("Azul", "azul", 1.2)}{badge("Roxo", "roxo", 1.2)}{badge("Amarelo", "amarelo", 1.2)}</div>'
            f'<div style="font:italic 900 25px/1.05 Archivo;font-stretch:90%;text-transform:uppercase;text-align:right">Identidade<br>visual</div>'
            f'{btn("Bora pro rolê", "azul", 1.35, "arrow")}</div>{rodape(n, "capa")}</section>')


# ------------------------------------------------------------- 2 paleta
def paleta(n):
    trio = [("Azul", AZUL, "Ação", "Botões, badges, chips, ícones, links, datas, distância, arco e o Go do logo."),
            ("Roxo", ROXO, "Ambiente", "Superfícies, cartões, botão secundário, luz das fotos e o logo em fundo claro."),
            ("Amarelo", AMARELO, "Grito", "O pincel (“Rolê” e a palavra da peça) e o selo de destaque: grátis, novo, lote aberto.")]
    big = ""
    for nm, h, papel, uso in trio:
        fg = tinta(h)
        big += (f'<div class="big" style="background:{h};color:{fg}"><span class="papel">{papel}</span><div class="nm">{nm}</div><p>{uso}</p>'
                f'<dl><dt>HEX</dt><dd>{h}</dd><dt>RGB</dt><dd>{" · ".join(map(str, rgb(h)))}</dd><dt>CMYK</dt><dd>{" · ".join(map(str, cmyk(h)))}</dd></dl></div>')
    apoio = "".join(f'<div class="ap"><i style="background:{h}"></i><div><b>{nm}</b><code>{h}</code><span>{u}</span></div></div>' for nm, h, u in
                    (("Noite", NOITE, "texto sobre azul e amarelo; cartões no escuro"), ("Preto", PRETO, "fundo principal"), ("Branco", BRANCO, "título e texto no escuro e no roxo"),
                     ("Violeta", VIOLETA, "só no degradê roxo e no fim do risco"), ("Névoa", NEVOA, "fundo claro de documento e app")))
    corpo = f'<div class="trio">{big}</div>{rot("Cores de apoio")}<div class="apoio">{apoio}</div><p class="nota">CMYK calculado a partir do sRGB: fazer prova de cor antes de imprimir. Azul e amarelo vivos perdem brilho no CMYK.</p>'
    return pag(n, "Cores", "A paleta: azul, roxo e amarelo", corpo, sub="Cada cor com um trabalho. O azul agora é a cor de tudo o que se toca ou se lê como dado.")


# ------------------------------------------------------------- 3 escalas e proporção
def escalas(n):
    linhas = ""
    for nm, base in (("Azul", AZUL), ("Roxo", ROXO), ("Amarelo", AMARELO)):
        tons = [("100", mix(base, BRANCO, .85)), ("200", mix(base, BRANCO, .65)), ("300", mix(base, BRANCO, .45)), ("400", mix(base, BRANCO, .22)), ("500", base),
                ("600", mix(base, PRETO, .18)), ("700", mix(base, PRETO, .36)), ("800", mix(base, PRETO, .55)), ("900", mix(base, PRETO, .72))]
        cel = "".join(f'<div style="background:{h};color:{tinta(h)}" class="{"base" if k == "500" else ""}"><b>{k}</b><code>{h}</code></div>' for k, h in tons)
        linhas += f'<div class="esc"><span>{nm}</span>{cel}</div>'
    seg = lambda f, bg, fg, t: f'<div style="flex:{f};background:{bg};color:{fg}">{t}</div>'
    prop = lambda lst: '<div class="prop">' + "".join(seg(*x) for x in lst) + "</div>"
    escura = prop([(45, PRETO, BRANCO, "45 preto e noite"), (25, SUP, BRANCO, "25 roxo"), (15, AZUL, NOITE, "15 azul"), (9, BRANCO, NOITE, "9 branco"), (6, AMARELO, NOITE, "6 amarelo")])
    roxa = prop([(58, SUP, BRANCO, "58 roxo"), (18, AZUL, NOITE, "18 azul"), (16, BRANCO, NOITE, "16 branco"), (8, AMARELO, NOITE, "8 amarelo")])
    clara = prop([(60, NEVOA, NOITE, "60 névoa e branco"), (22, ROXO, BRANCO, "22 roxo"), (14, AZUL, NOITE, "14 azul"), (4, AMARELO, NOITE, "4")])
    degr = "".join(f'<div><i style="background:{g}"></i><b>{nm}</b><span>{u}</span></div>' for nm, g, u in
                   (("Superfície roxa", SUP, "fundo de peça e de cartão"), ("Risco", RISCO, "azul → roxo → violeta; só no traço e na barra de progresso"),
                    ("Noite", f"linear-gradient(165deg,{ROXO},{NOITE} 90%)", "fundo de avaliação, modal e splash")))
    corpo = (f'{linhas}{rot("Proporção · peça escura")}{escura}{rot("Proporção · peça roxa")}{roxa}{rot("Proporção · tela clara")}{clara}'
             f'{rot("Degradês")}<div class="degr">{degr}</div>')
    return pag(n, "Cores", "Tons e proporção", corpo, sub="O 500 é a cor da marca. Os outros tons servem para estados, bordas e fundos suaves.")


# ------------------------------------------------------------- 4 combinações
def combinacoes(n):
    pares = [(PRETO, AZUL), (PRETO, AMARELO), (NOITE, AZUL), (ROXO, BRANCO), (ROXO, AMARELO), (ROXO, AZUL),
             (AZUL, NOITE), (AMARELO, NOITE), (AZUL, ROXO), (BRANCO, ROXO)]
    nomes = {PRETO: "preto", AZUL: "azul", AMARELO: "amarelo", ROXO: "roxo", BRANCO: "branco", NOITE: "noite"}
    cel = ""
    for bg, fg in pares:
        c = contrast(bg, fg)
        selo, tipo = ("Qualquer texto", "azul") if c >= 4.5 else ("Título e botão", "linha")
        cel += (f'<div><div class="cb" style="background:{bg};color:{fg}"><div class="aa">{tit("BORA", 34, fg)}</div><span>{nomes[fg].title()} sobre {nomes[bg]}</span>'
                f'<small>{f"{c:.1f}".replace(".", ",")} : 1</small></div><div class="cbs">{badge(selo, tipo, .9)}</div></div>')
    ruins = [(AZUL, AMARELO), (AMARELO, AZUL), (AZUL, BRANCO), (AMARELO, BRANCO), (BRANCO, AZUL), (BRANCO, AMARELO)]
    nao = "".join(f'<div class="cb nao" style="background:{bg};color:{fg}"><div class="aa">{tit("BORA", 28, fg)}</div><span>{nomes[fg].title()} sobre {nomes[bg]}</span>'
                  f'<small>{f"{contrast(bg, fg):.1f}".replace(".", ",")} : 1</small><u>✕</u></div>' for bg, fg in ruins)
    junto = "".join(f'<div style="background:{bg}">{corpo}</div>' for bg, corpo in (
        (SUP, f'{pinc("ROLÊ", 40)}{btn("Bora", "azul", 1.1, "arrow")}{badge("Grátis", "amarelo", 1.1)}'),
        (PRETO, f'{pinc("ROLÊ", 40)}{btn("Bora", "azul", 1.1, "arrow")}{badge("R$ 40", "roxo", 1.1)}'),
        (NOITE, f'{pinc("ROLÊ", 40)}{btn("Criar rolê", "roxo", 1.1)}{badge("21h", "azul", 1.1, "cal")}')))
    corpo = (f'{rot("Pode usar")}<div class="combos">{cel}</div>{rot("Não usar")}<div class="combos nao6">{nao}</div>'
             f'{rot("As três juntas: o botão é azul, o pincel é amarelo, o ambiente é roxo ou preto")}<div class="junto">{junto}</div>')
    return pag(n, "Cores", "Como combinar", corpo, sub="Azul e amarelo nunca um sobre o outro. Em cima dos dois, o texto é sempre noite.")


# ------------------------------------------------------------- 5 logo
def pg_logo(n):
    vers = [(PRETO, BRANCO, AZUL, "Principal · preto"), (SUP, BRANCO, AZUL, "Principal · roxo"), (AZUL, NOITE, ROXO, "Sobre azul"),
            (AMARELO, NOITE, ROXO, "Sobre amarelo (uso raro)"), (BRANCO, NOITE, ROXO, "Sobre claro"), (f"url({foto('multidao-1', 900)}) center/cover", BRANCO, BRANCO, "Sobre foto · branco")]
    v = "".join(f'<div><div class="lg" style="background:{bg}">{logo(52, r, g)}</div><div class="cap">{t}</div></div>' for bg, r, g, t in vers)
    prot = (f'<div class="lg" style="background:{NOITE};height:150px"><div style="border:1.5px dashed {AZUL};padding:26px">{logo(46)}</div></div>'
            f'<div class="cap">Área de respiro: meia altura do logo em volta. Mínimo: 80 px na tela, 20 mm no impresso.</div>')
    icones = "".join(f'<div class="app" style="background:{bg}">{go(c, 48)}</div>' for bg, c in ((AZUL, NOITE), (SUP, AZUL), (PRETO, AZUL), (AMARELO, NOITE)))
    ic_ = f'<div class="lg" style="background:{PRETO};height:150px;gap:16px">{icones}</div><div class="cap">Ícone do app e avatar. Preferido: azul com o Go noite. Amarelo só em campanha.</div>'
    corpo = f'<div class="g3">{v}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:6px"><div>{prot}</div><div>{ic_}</div></div>'
    return pag(n, "Marca", "Logo nas três cores", corpo, sub="A logo gomosa. No escuro e no roxo, o Go é azul; no azul, amarelo e claro, o Go é roxo.")


# ------------------------------------------------------------- 6 tipografia e grafismos
def tipo_graf(n):
    tipos = [(f'{tit("VIVA O ROLÊ", 46)}', "Título · Archivo 900 itálico", "Caixa alta, largura 90. Branco no escuro e no roxo; azul para a segunda frase; noite sobre azul."),
             (pinc("PINHEIROS", 50), "Pincel · Permanent Marker", "Uma palavra por peça, em amarelo (roxo quando o fundo é azul). “Rolê” é o desenho vetorial."),
             (f'<div style="font-size:19px;font-weight:600;line-height:1.35">Largo da Batata<br>{az("sex, 21h")} · 600 m</div>', "Texto · Poppins", "400 a 800. O dado que decide (hora, distância) em azul.")]
    t = "".join(f'<div class="tp"><div class="ex">{e}</div><b>{a_}</b><span>{b}</span></div>' for e, a_, b in tipos)
    graf = [(f'<div style="position:absolute;inset:0">{arco(210, AZUL, 2.6)}</div>', PRETO, "Arco azul", "Canto superior direito, um por peça."),
            (traco(190), NOITE, "Risco", "Embaixo da palavra em pincel. Azul → roxo."),
            (go(AZUL, 150, "position:absolute;right:-40px;bottom:-40px;opacity:.3"), SUP, "Go gigante", "Marca-d’água cortada, de 10 a 50% de opacidade."),
            (f'<div style="display:flex;flex-direction:column;gap:8px;align-items:center">{badge("SEX · 21h", "azul", 1.5, "cal")}{badge("600 m", "linha", 1.5, "pin")}{badge("Grátis", "amarelo", 1.5)}</div>', PRETO, "Selos", "Pílulas com o dado. No máximo três por peça.")]
    g = "".join(f'<div><div class="gf" style="background:{bg}">{e}</div><b>{a_}</b><span>{b}</span></div>' for e, bg, a_, b in graf)
    fts = "".join(f'<div style="background:url({foto(f, 700)}) {p}/cover">{facho(.4)}</div>' for f, p in
                  (("multidao-2", "center"), ("neon-rosa-azul", "center 20%"), ("galera-brinde-azul", "40% center"), ("mao-pra-cima", "center 30%"), ("sorriso-neon", "62% center")))
    corpo = f'<div class="g3">{t}</div>{rot("Grafismos")}<div class="grafs">{g}</div>{rot("Foto: duotom de noite → roxo → azul, com um feixe azul vindo da esquerda")}<div class="fts">{fts}</div>'
    return pag(n, "Elementos", "Letra, traço e foto", corpo)


# ------------------------------------------------------------- 7 botões
def botoes(n):
    def linha(nome, uso, bg, fg, bd, hover, press):
        def b(f, t, b_, rotulo, extra=""):
            return (f'<div><span class="bt" style="display:inline-flex;background:{f};color:{t};border:2px solid {b_};font-size:12.5px;padding:9px 0;width:118px;{extra}">{rotulo}</span></div>')
        desab = b("#1E1B2B", "#6F6A85", "#1E1B2B", "Bora")
        return (f'<div class="bl"><div class="bn"><b>{nome}</b><span>{uso}</span></div>{b(bg, fg, bd, "Bora")}{b(hover[0], hover[1], hover[2], "Bora")}'
                f'{b(press[0], press[1], press[2], "Bora")}{b(bg, fg, bd, "Bora", f"box-shadow:0 0 0 2px #000,0 0 0 4.5px {BRANCO}")}{desab}</div>')
    cab = '<div class="bl cab"><div></div>' + "".join(f"<div>{x}</div>" for x in ("Normal", "Hover", "Pressionado", "Foco", "Desativado")) + "</div>"
    tab = cab + (linha("Primário · azul", "a ação principal da tela. Um só.", AZUL, NOITE, AZUL, (mix(AZUL, BRANCO, .25), NOITE, mix(AZUL, BRANCO, .25)), (mix(AZUL, PRETO, .18), NOITE, mix(AZUL, PRETO, .18)))
                 + linha("Secundário · contorno azul", "a segunda opção no escuro e no roxo", "transparent", AZUL, AZUL, ("rgba(104,226,227,.14)", AZUL, AZUL), ("rgba(104,226,227,.28)", BRANCO, AZUL))
                 + linha("Apoio · roxo", "primário em fundo claro ou azul", ROXO, BRANCO, ROXO, (mix(ROXO, BRANCO, .15), BRANCO, mix(ROXO, BRANCO, .15)), (mix(ROXO, PRETO, .22), BRANCO, mix(ROXO, PRETO, .22)))
                 + linha("Campanha · amarelo", "só promoção e lançamento", AMARELO, NOITE, AMARELO, (mix(AMARELO, BRANCO, .3), NOITE, mix(AMARELO, BRANCO, .3)), (mix(AMARELO, PRETO, .18), NOITE, mix(AMARELO, PRETO, .18))))
    tam = (f'<div class="box" style="background:{PRETO}">{rot("Tamanhos")}<div class="fl">{btn("Grande · 56", "azul", 1.5, "arrow")}{btn("Médio · 44", "azul", 1.15, "arrow")}{btn("Pequeno · 32", "azul", .85, "arrow")}</div>'
           f'<div style="margin-top:10px">{btn("Largura total no celular", "azul", 1.3, "arrow", bloco=True)}</div></div>')
    red = (f'<div class="box" style="background:{NOITE}">{rot("Ações do swipe e ícones")}<div class="fl" style="justify-content:center;gap:16px">'
           + "".join(f'<div class="rd">{redondo(i, t, d)}<span>{r}</span></div>' for i, t, d, r in
                     (("x", "contorno", 52, "Passo"), ("heart", "azul", 66, "Bora"), ("star", "amarelo", 52, "Super"), ("search", "roxo", 44, "Buscar"), ("bell", "contorno", 44, "Avisos")))
           + "</div></div>")
    sup = "".join(f'<div class="box" style="background:{bg};color:{fg}"><div class="sub" style="color:{fg}">{t}</div><div class="fl">{a_}{b_}</div></div>' for bg, fg, t, a_, b_ in (
        (SUP, BRANCO, "No roxo", btn("Bora", "azul", 1.1, "arrow"), btn("Agora não", "contorno", 1.1)),
        (AZUL, NOITE, "No azul", btn("Bora ver", "roxo", 1.1, "arrow"), btn("Agora não", "contorno", 1.1).replace(AZUL, NOITE)),
        (BRANCO, NOITE, "No claro", btn("Bora", "roxo", 1.1, "arrow"), btn("Ver mapa", "azul", 1.1, "pin"))))
    corpo = f'<div class="btab">{tab}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">{tam}{red}</div><div class="g3">{sup}</div>'
    return pag(n, "Componentes", "Botões", corpo, sub="Azul é o botão. Pílula, texto 800 itálico, verbo curto.")


# ------------------------------------------------------------- 8 badges e controles
def badges(n):
    def caixa(t, corpo, bg=PRETO, cls="fl"):
        return f'<div class="box" style="background:{bg}">{rot(t)}<div class="{cls}">{corpo}</div></div>'
    s = 1.2
    b1 = caixa("Badges de dado · azul", badge("SEX · 21h", "azul", s, "cal") + badge("HOJE", "azul", s) + badge("600 m", "linha", s, "pin") + badge("32 vão", "linha", s, "user") + badge("Verificado", "azul", s, "check") + badge("Ao vivo ●", "noite", s))
    b2 = caixa("Badges de destaque", badge("Grátis", "amarelo", s) + badge("Novo", "amarelo", s) + badge("1º lote", "amarelo", s) + badge("R$ 40", "roxo", s, "ticket") + badge("Lotando", "violeta", s) + badge("18+", "branco", s))
    chips = "".join(badge(t, k, 1.35, i) for t, k, i in (("Todos", "azul", "check"), ("Samba", "azul", "check"), ("Balada", "linha", None), ("Show", "linha", None), ("Bar", "linha", None), ("Ao ar livre", "linha", None), ("Grátis", "linha", None)))
    b3 = caixa("Chips de filtro · marcado é azul cheio", chips, NOITE)
    tog = lambda on: f'<span class="tog" style="background:{AZUL if on else "#3A3157"}"><i style="{"right:3px" if on else "left:3px"};background:{NOITE if on else BRANCO}"></i></span>'
    ctr = (f'<div class="opt"><span>Avisar quando o grupo der match</span>{tog(True)}</div><div class="opt"><span>Mostrar rolês pagos</span>{tog(False)}</div>'
           f'<div class="tabs"><b class="on">Perto de mim</b><b>Hoje</b><b>Fim de semana</b></div>'
           f'<div class="inp">{ic("search", 15, AZUL)}<span>samba em pinheiros<i></i></span></div>'
           f'<div><div class="opt"><span>Quem do grupo votou</span><span style="color:{AZUL};font-weight:700">4 de 5</span></div><div class="prog"><i></i></div></div>')
    b4 = caixa("Interruptor, abas, busca e progresso", ctr, NOITE, "pilha")
    card = (f'<div class="ev"><div class="evf" style="background:url({foto("multidao-2", 700)}) center/cover">{badge("HOJE · 22h", "azul", 1)}</div><div class="evc"><b>Baile da Laje</b>'
            f'<span>Vila Madalena · {az("1,2 km")}</span><div class="fl">{badge("R$ 40", "roxo", .95)}{badge("Funk", "linha", .95)}</div>'
            f'<div class="fl" style="justify-content:space-between;margin-top:3px"><div style="display:flex">{avs(22, NOITE)}</div>{btn("Bora", "azul", .95, "arrow")}</div></div></div>')
    avisos = (f'<div class="toast">{redondo("check", "azul", 30)}<div><b>Presença confirmada</b><span>Samba no Largo, sexta às 21h</span></div></div>'
              f'<div class="toast">{redondo("heart", "roxo", 30)}<div><b>Deu match no grupo</b><span>Ana e Léo também querem ir</span></div><em>3</em></div>'
              f'<div class="toast" style="border-color:{AMARELO}">{redondo("ticket", "amarelo", 30)}<div><b>Último lote</b><span>Restam poucos ingressos</span></div></div>')
    b5 = caixa("Cartão de evento", card, PRETO, "pilha")
    b6 = caixa("Avisos", avisos, PRETO, "pilha")
    corpo = f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">{b1}{b2}</div>{b3}<div style="display:grid;grid-template-columns:1.15fr 1fr 1.1fr;gap:12px">{b4}{b5}{b6}</div>'
    return pag(n, "Componentes", "Badges, chips e controles", corpo, sub="Tudo o que informa ou liga é azul. Amarelo é exceção; roxo é preço e categoria.")


# ------------------------------------------------------------- 9 app
def app(n):
    def fone(corpo, bg=PRETO):
        return f'<div class="fone" style="background:{bg}"><div class="ilha"></div>{corpo}</div>'

    def nav(ativo):
        return '<div class="nav">' + "".join(f'<div style="color:{AZUL if i == ativo else "#7E769B"}">{ic(i, 19, AZUL if i == ativo else "#7E769B")}<span>{t}</span></div>'
                                             for i, t in (("pin", "Perto"), ("heart", "Matches"), ("cal", "Agenda"), ("user", "Eu"))) + "</div>"
    t1 = (f'<div class="tela"><div class="fl" style="justify-content:space-between">{logo(20)}{redondo("bell", "contorno", 28)}</div>'
          f'<div class="fl">{badge("Hoje", "azul", .85)}{badge("Samba", "linha", .85)}{badge("Show", "linha", .85)}{badge("Grátis", "linha", .85)}</div>'
          f'<div class="swipe" style="background:url({foto("neon-hexagono-roxo", 700)}) center/cover"><div class="sombra"></div><div class="swc"><div class="fl">{badge("21h", "azul", .85, "cal")}{badge("Grátis", "amarelo", .85)}</div>'
          f'{tit("SAMBA NO", 25)}<div style="margin-top:-6px">{pinc("LARGO", 38)}</div><span>Largo da Batata · {az("600 m")}</span></div></div>'
          f'<div class="fl" style="justify-content:center;gap:16px">{redondo("x", "contorno", 44)}{redondo("heart", "azul", 54)}{redondo("star", "amarelo", 44)}</div></div>{nav("pin")}')
    t2 = (f'<div class="capaf" style="background:url({foto("show-de-costas", 800)}) 30% center/cover"><div class="sombra"></div><div style="position:absolute;left:16px;bottom:6px">{tit("BAILE DA", 26)}<div style="margin-top:-5px">{pinc("LAJE", 44)}</div></div></div>'
          f'<div class="tela" style="padding-top:8px"><div class="fl">{badge("SÁB · 23h", "azul", .9, "cal")}{badge("R$ 40", "roxo", .9)}{badge("Lotando", "violeta", .9)}</div>'
          f'<div class="inf2">{ic("pin", 17, AZUL)}<div><b>Rua Aspicuelta, 200</b><span>Vila Madalena · 1,2 km</span></div></div>'
          f'<div class="inf2">{ic("user", 17, AZUL)}<div><b>48 pessoas vão</b><span>3 amigos seus</span></div></div>'
          f'<p>Laje aberta, DJ da casa e vista da cidade. Entrada até 1h.</p><span class="lk">Ver no mapa →</span><div style="flex:1"></div>'
          f'{btn("Garantir ingresso", "azul", 1.05, "ticket", bloco=True)}{btn("Chamar a galera", "contorno", 1.05, bloco=True)}</div>')
    t3 = (f'<div class="tela" style="align-items:center;text-align:center;justify-content:center;gap:12px"><div style="width:128px;height:128px;border-radius:50%;border:4px solid {AZUL};background:url({foto("galera-brinde-azul", 700)}) 35% center/cover"></div>'
          f'{badge("SEU GRUPO", "azul", 1)}<div>{tit("DEU", 40)}<div style="margin-top:-4px">{pinc("MATCH!", 56)}</div></div><div style="margin-top:-12px">{traco(110)}</div>'
          f'<div style="display:flex">{avs(34, ROXO)}</div><p style="color:#fff">Baile da Laje · {az("hoje, 22h")}</p><div style="height:10px"></div>'
          f'{btn("Abrir o chat", "azul", 1.05, "arrow", bloco=True)}{btn("Continuar vendo", "contorno", 1.05, bloco=True)}</div>')
    t4 = (f'<div class="tela" style="color:{NOITE}"><div class="fl" style="justify-content:space-between">{logo(20, NOITE, ROXO)}{redondo("search", "roxo", 28)}</div>'
          f'<div style="font:italic 900 22px/1 Archivo;text-transform:uppercase">Sua agenda</div><div class="fl">{badge("Confirmados", "roxo", .85)}{badge("Salvos", "branco", .85)}</div>'
          + "".join(f'<div class="ag"><div class="dt"><small>{d}</small><b>{num}</b></div><div><b>{nm}</b><span>{i}</span>{badge(s_, k, .75)}</div></div>' for d, num, nm, i, s_, k in
                    (("SEX", "27", "Samba no Largo", "21h · Pinheiros", "Grátis", "amarelo"), ("SÁB", "28", "Baile da Laje", "23h · V. Madalena", "R$ 40", "roxo"), ("DOM", "29", "Feira + Jazz", "15h · Centro", "R$ 20", "roxo")))
          + f'<div style="flex:1"></div>{btn("Criar um rolê", "roxo", 1.05, "arrow", bloco=True)}</div>{nav("cal").replace(AZUL, ROXO)}')
    telas = "".join(f'<div>{x}<div class="cap">{t}</div></div>' for x, t in ((fone(t1), "Descobrir · swipe"), (fone(t2), "Detalhe do rolê"), (fone(t3, SUP), "Match do grupo"), (fone(t4, NEVOA), "Agenda · modo claro (ação em roxo)")))
    return pag(n, "Aplicação", "No aplicativo", f'<div class="fones">{telas}</div>', sub="Exemplos de tela. No escuro a ação é azul; no claro o roxo assume o botão e o azul fica nos blocos de data.")


# ------------------------------------------------------------- 10 a 12 posts e stories
def _grade(n, lote, titulo):
    cel = "".join(f'<div><img src="{mini(PORT, nome, 760)}"><span>{t}</span></div>' for nome, t, _ in lote)
    return pag(n, "Redes", titulo, f'<div class="pg">{cel}</div>', claro=True)


def posts_a(n):
    return _grade(n, POSTS[:6], "Posts 1080 × 1080")


def posts_b(n):
    return _grade(n, POSTS[6:], "Mais posts")


def stories(n):
    cel = "".join(f'<div><img src="{mini(STOR, nome, 620)}"><span>{t}</span></div>' for nome, t, _ in STORIES)
    return pag(n, "Redes", "Stories 1080 × 1920", f'<div class="st">{cel}</div>', claro=True)


# ------------------------------------------------------------- 13 peças
def pecas(n):
    cap = lambda box, t: f'<div>{box}<div class="cap">{t}</div></div>'
    banner = (f'<div class="pc" style="width:690px;height:196px"><div class="ft" style="inset:0;background:url({foto("multidao-1", 1400)}) center/cover"></div>'
              f'<div class="ft" style="inset:0;background:linear-gradient(90deg,#000 8%,rgba(0,0,0,.6) 48%,rgba(0,0,0,.05))"></div>{arco(90)}'
              f'<div style="position:absolute;left:24px;top:12px">{letras(215)}</div>'
              f'<div style="position:absolute;right:22px;bottom:18px;display:flex;gap:14px;align-items:center">{logo(24)}{btn("Baixar o app", "azul", 1, "arrow")}</div></div>')
    ing = (f'<div class="pc" style="width:334px;height:196px;background:{ROXO};display:flex">'
           f'<div style="width:240px;padding:14px 16px;position:relative">{logo(16)}<div style="margin-top:12px">{tit("BAILE DA", 27)}<div style="margin-top:-5px">{pinc("LAJE", 46)}</div></div>'
           f'<div style="margin-top:8px;display:flex;gap:5px">{badge("SÁB 28/11", "azul", .85)}{badge("23h", "linha", .85)}</div><div style="font-size:9px;margin-top:8px;font-weight:600">Vila Madalena · R$ 40</div></div>'
           f'<div style="flex:1;background:{AZUL};color:{NOITE};border-left:3px dashed {NOITE};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px">{go(NOITE, 34)}'
           f'<div style="width:58px;height:58px;background:repeating-conic-gradient({NOITE} 0 25%,{AZUL} 0 50%) 0 0/14.5px 14.5px;border:4px solid {NOITE}"></div><b style="font-size:9px">1 ENTRADA</b></div></div>')
    cartaz = (f'<div class="pc" style="width:276px;height:345px;background:{ROXO}"><div class="ft" style="left:0;right:0;top:0;height:230px;background:url({foto("risada-festa", 700)}) center 25%/cover"></div>'
              f'<div class="ft" style="inset:0;background:linear-gradient(180deg,rgba(22,10,51,.75),rgba(109,52,204,0) 24%,rgba(109,52,204,0) 34%,{ROXO} 64%)"></div>{arco(70)}<div style="position:absolute;left:18px;top:14px">{logo(19)}</div>'
              f'<div style="position:absolute;left:18px;right:12px;bottom:16px">{tit("DOMINGO É DE", 27)}<div style="margin-top:-4px">{pinc("PARQUE", 52)}</div>'
              f'<div style="margin:6px 0 10px;display:flex;gap:5px">{badge("DOM · 15h", "azul", .9, "cal")}{badge("Grátis", "amarelo", .9)}</div>{btn("Bora?", "azul", .95, "arrow")}</div></div>')
    pul = "".join(f'<div class="pul" style="background:{bg};color:{fg}">{go(g, 17)}<b>{t}</b><i style="border-color:{fg}">{s_}</i></div>' for bg, fg, g, t, s_ in
                  ((AZUL, NOITE, NOITE, "VIVA O ROLÊ", "PISTA"), (ROXO, BRANCO, AZUL, "VIVA O ROLÊ", "VIP"), (AMARELO, NOITE, ROXO, "VIVA O ROLÊ", "STAFF")))
    cam = lambda bg, corpo: (f'<svg viewBox="0 0 200 190" width="150"><path d="M62 8 20 28 6 70l30 10 8-16v118h112V64l8 16 30-10-14-42-42-20c-6 22-70 22-76 0Z" fill="{bg}" stroke="rgba(255,255,255,.14)"/></svg>{corpo}')
    def camisa(bg, left, top, estampa):
        return f'<div class="cam">{cam(bg, "")}<div style="left:{left}px;top:{top}px">{estampa}</div></div>'
    camisas = camisa(NOITE, 38, 56, letras(76)) + camisa(ROXO, 47, 66, logo(18)) + camisa(AZUL, 55, 54, go(NOITE, 40))
    adesivos = (f'<div class="ades" style="background:{AZUL};color:{NOITE};transform:rotate(-9deg)">{go(NOITE, 38)}<b>BORA?</b></div>'
                f'<div class="ades" style="background:{ROXO};transform:rotate(6deg)">{pinc("ROLÊ", 24)}</div>'
                f'<div class="ades" style="background:{AMARELO};color:{NOITE};transform:rotate(-3deg)"><b style="font-size:17px">EU<br>VOU</b></div>')
    corpo = (f'<div style="display:flex;gap:14px">{cap(banner, "Banner de site e telão")}{cap(ing, "Ingresso")}</div>'
             f'<div style="display:flex;gap:14px">{cap(cartaz, "Cartaz e feed 4:5")}'
             f'<div style="flex:1;display:flex;flex-direction:column;gap:10px">{cap(f"<div class=pulbox>{pul}</div>", "Pulseiras de acesso por cor")}'
             f'<div style="display:grid;grid-template-columns:1.6fr 1fr;gap:14px">{cap(f"<div class=cams>{camisas}</div>", "Camisetas")}{cap(f"<div class=adbox>{adesivos}</div>", "Adesivos")}</div></div></div>')
    return pag(n, "Aplicação", "Peças e materiais", corpo, sub="Exemplos para o site, o evento e a rua.")


# ------------------------------------------------------------- 14 resumo
def resumo(n):
    faca = ["Um botão principal por tela, azul com texto noite.", "Dado que decide (hora, distância, data) em badge azul.", "Amarelo no pincel e em um selo de destaque.",
            "Roxo ou preto como ambiente; roxo para preço e categoria.", "Logo com Go azul no escuro e no roxo.", "Texto noite sobre azul e sobre amarelo."]
    nao = ["Amarelo sobre azul, ou azul sobre amarelo.", "Texto branco sobre azul ou amarelo.", "Dois botões cheios disputando a mesma tela.",
           "Azul como fundo de toda a série: é chamada pontual.", "Mais de uma palavra em pincel na peça.", "Cor nova fora da paleta (sem rosa, laranja ou pêssego)."]
    li = lambda lst, s, cor: "".join(f'<li><i style="background:{cor};color:{NOITE if cor == AZUL else BRANCO}">{s}</i>{x}</li>' for x in lst)
    tokens = (f":root {{\n  --rg-azul: {AZUL};      /* ação */\n  --rg-roxo: {ROXO};      /* ambiente */\n  --rg-amarelo: {AMARELO};   /* destaque */\n  --rg-noite: {NOITE};\n"
              f"  --rg-violeta: {VIOLETA};\n  --rg-preto: {PRETO};\n  --rg-branco: {BRANCO};\n  --rg-nevoa: {NEVOA};\n  --rg-risco: linear-gradient(90deg,\n      var(--rg-azul), #6A86EC 40%,\n      var(--rg-roxo) 70%, var(--rg-violeta));\n}}")
    corpo = (f'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;align-items:stretch"><div class="box" style="background:{NOITE}">{rot("Faça")}<ul>{li(faca, "✓", AZUL)}</ul></div>'
             f'<div class="box" style="background:{PRETO}">{rot("Evite")}<ul>{li(nao, "✕", VIOLETA)}</ul></div><div class="box" style="background:{PRETO}">{rot("Tokens")}<pre>{tokens}</pre></div></div>'
             f'<div class="fim" style="background:{SUP}">{arco(130)}<div>{letras(330)}</div><div style="display:flex;flex-direction:column;gap:12px;align-items:flex-start">{logo(34)}'
             f'<div style="font-size:14px;font-weight:600">Os rolês da sua cidade, num swipe.</div><div class="fl">{btn("Baixar o app", "azul", 1.3, "arrow")}{badge("Grátis", "amarelo", 1.3)}</div></div></div>')
    return pag(n, "Resumo", "Guia de bolso", corpo)


PAGINAS = [capa, paleta, escalas, combinacoes, pg_logo, tipo_graf, botoes, badges, app, posts_a, posts_b, stories, pecas, resumo]

CSS = """@import url('https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@1,90,900&family=Permanent+Marker&family=Poppins:ital,wght@0,400;0,500;0,600;0,700;0,800;1,700;1,800&display=swap');
@page{size:297mm 210mm;margin:0}*{box-sizing:border-box;margin:0;padding:0}body{font-family:Poppins,sans-serif;background:#222;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:297mm;height:210mm;padding:26px 42px 30px;position:relative;overflow:hidden;page-break-after:always;display:flex;flex-direction:column;gap:10px;background:#09070F;color:#fff}
.page.claro{background:#F3F1FA;color:#160A33}
header{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:2px}h2{font:italic 900 28px/1 Archivo,sans-serif;font-stretch:90%;text-transform:uppercase;margin-top:6px}
.lead{font-size:10.5px;line-height:1.45;color:#B7AED6;max-width:390px;text-align:right}
.foot{position:absolute;left:42px;right:42px;bottom:11px;display:flex;justify-content:space-between;font-size:8.5px;color:#7E769B;z-index:5}
.ft{position:absolute}.pc{position:relative;overflow:hidden;border-radius:16px;background-color:#000;flex-shrink:0}
.cap{font-size:9px;color:#9C93BC;margin-top:4px;line-height:1.35}.sub{font-size:9.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9C93BC}
.tt{display:inline-block;font-family:Archivo,sans-serif;font-style:italic;font-weight:900;font-stretch:90%;line-height:.95;text-transform:uppercase;letter-spacing:-.01em;white-space:nowrap}
.pn{display:inline-block;font-family:'Permanent Marker',cursive;line-height:1;transform:rotate(-7deg) skewX(-10deg);white-space:nowrap}
.bt{align-items:center;justify-content:center;border-radius:99px;font-weight:800;font-style:italic;white-space:nowrap;line-height:1.3}
.bd{display:inline-flex;align-items:center;border-radius:99px;font-weight:700;white-space:nowrap;line-height:1.5}
.fl{display:flex;flex-wrap:wrap;gap:7px;align-items:center}.pilha{display:flex;flex-direction:column;gap:9px}.box{border-radius:14px;padding:11px 14px;display:flex;flex-direction:column;gap:9px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.07)}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.nota{font-size:9px;color:#7E769B}
.trio{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.big{border-radius:18px;height:420px;padding:22px;display:flex;flex-direction:column}
.big .papel{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.big .nm{font:italic 900 54px/1 Archivo,sans-serif;font-stretch:90%;text-transform:uppercase;margin-top:auto}
.big p{font-size:11.5px;line-height:1.5;margin:8px 0 14px;min-height:52px;font-weight:500}.big dl{display:grid;grid-template-columns:52px 1fr;row-gap:3px;border-top:1.5px solid currentColor;padding-top:11px;font-size:11px}.big dt{font-weight:700;font-size:9px;align-self:center}.big dd{font-family:ui-monospace,Menlo,monospace}
.apoio{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}.ap{display:flex;gap:9px;align-items:center}.ap i{width:46px;height:46px;border-radius:10px;flex-shrink:0;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}.ap b{display:block;font-size:10px}.ap code{display:block;font:8.5px ui-monospace,Menlo,monospace;color:#B7AED6}.ap span{display:block;font-size:8px;color:#7E769B;line-height:1.3}
.esc{display:grid;grid-template-columns:70px repeat(9,1fr);gap:5px;align-items:center}.esc>span{font-size:11px;font-weight:700}.esc div{height:62px;border-radius:9px;padding:8px;display:flex;flex-direction:column;justify-content:flex-end;box-shadow:inset 0 0 0 1px rgba(255,255,255,.1)}.esc div.base{box-shadow:0 0 0 2.5px #fff}.esc b{font-size:10px}.esc code{font:8px ui-monospace,Menlo,monospace}
.prop{display:flex;height:38px;border-radius:9px;overflow:hidden;box-shadow:inset 0 0 0 1px #2A2340}.prop div{display:flex;align-items:center;padding-left:8px;font-size:9px;font-weight:700;white-space:nowrap}
.degr{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.degr i{display:block;height:56px;border-radius:10px}.degr b{display:block;font-size:10px;margin-top:4px}.degr span{font-size:8.5px;color:#9C93BC}
.combos{display:grid;grid-template-columns:repeat(5,1fr);gap:8px 10px}.cb{position:relative;border-radius:12px;height:96px;padding:9px 12px;display:flex;flex-direction:column;justify-content:flex-end;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}.cb .aa{margin-bottom:auto}.cb span{font-size:9.5px;font-weight:700}.cb small{font-size:8.5px;font-weight:600}.cbs{margin-top:4px}
.nao6{grid-template-columns:repeat(6,1fr)}.cb.nao{height:86px}.cb.nao>span,.cb.nao small{background:#09070F;color:#fff;align-self:flex-start;padding:0 5px}.cb.nao>span{border-radius:4px 4px 0 0;font-size:8.5px}.cb.nao small{border-radius:0 0 4px 4px}.cb u{position:absolute;right:7px;top:7px;width:19px;height:19px;border-radius:50%;background:#AB05EA;color:#fff;text-decoration:none;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center}
.junto{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.junto>div{height:92px;border-radius:12px;display:flex;align-items:center;justify-content:space-around;padding:0 10px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.1)}
.lg{height:150px;border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}.app{width:82px;height:82px;border-radius:21px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.16)}
.tp{background:#000;border-radius:14px;padding:14px 16px}.tp .ex{height:92px;display:flex;align-items:center}.tp b,.grafs b{display:block;font-size:10.5px;margin-top:4px}.tp>span,.grafs span:not(.bd){display:block;font-size:9px;color:#9C93BC;line-height:1.4}
.grafs{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.gf{position:relative;overflow:hidden;height:134px;border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
.fts{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.fts>div{position:relative;overflow:hidden;height:186px;border-radius:12px}
.btab{background:#000;border-radius:14px;padding:8px 14px}.bl{display:grid;grid-template-columns:230px repeat(5,1fr);align-items:center;min-height:52px;border-top:1px solid #1D1830}.bl>div{text-align:center}.bl .bn{text-align:left}.bn b{display:block;font-size:10.5px}.bn span{display:block;font-size:8.5px;color:#9C93BC}.bl.cab{min-height:22px;border:0;font-size:8.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9C93BC}
.rd{display:flex;flex-direction:column;align-items:center;gap:5px;font-size:8.5px;color:#B7AED6}
.opt{display:flex;justify-content:space-between;align-items:center;font-size:9.5px;gap:10px}.tog{position:relative;width:38px;height:21px;border-radius:99px;flex-shrink:0}.tog i{position:absolute;top:3px;width:15px;height:15px;border-radius:50%}
.tabs{display:flex;gap:16px;border-bottom:1px solid #3A3157;font-size:9.5px}.tabs b{padding-bottom:6px;color:#9C93BC}.tabs b.on{color:#68E2E3;border-bottom:3px solid #68E2E3}
.inp{display:flex;gap:8px;align-items:center;border:1.8px solid #68E2E3;border-radius:99px;padding:7px 13px;font-size:10px;box-shadow:0 0 0 3px rgba(104,226,227,.2)}.inp span i{display:inline-block;width:1.5px;height:11px;background:#68E2E3;margin-left:2px;vertical-align:middle}
.prog{height:8px;border-radius:9px;background:#3A3157;margin-top:5px}.prog i{display:block;width:80%;height:100%;border-radius:9px;background:linear-gradient(90deg,#6D34CC,#68E2E3)}
.ev{background:#160A33;border-radius:14px;overflow:hidden}.evf{height:92px;padding:9px}.evc{padding:9px 11px;display:flex;flex-direction:column;gap:5px}.evc b{font-size:13px}.evc>span{font-size:9px;color:#B7AED6}
.toast{display:flex;gap:9px;align-items:center;background:#160A33;border:1.5px solid #68E2E3;border-radius:14px;padding:11px}.toast b{display:block;font-size:10px}.toast span:not([style]){display:block;font-size:8.5px;color:#B7AED6}.toast em{margin-left:auto;font-style:normal;font-size:9px;font-weight:800;background:#68E2E3;color:#160A33;border-radius:99px;padding:1px 7px}
.fones{display:flex;justify-content:space-between;margin-top:6px}.fone{position:relative;width:250px;height:556px;border-radius:38px;border:7px solid #221A3B;overflow:hidden;display:flex;flex-direction:column;padding-top:30px}.ilha{position:absolute;left:50%;top:7px;width:70px;height:18px;margin-left:-35px;border-radius:99px;background:#000;z-index:3}
.tela{flex:1;display:flex;flex-direction:column;gap:9px;padding:4px 13px 12px;min-height:0}.tela .fl{gap:5px}.tela p{font-size:9.5px;line-height:1.45;color:#B7AED6}.lk{font-size:10px;font-weight:700;color:#68E2E3}
.swipe{position:relative;flex:1;border-radius:20px;overflow:hidden}.sombra{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 35%,rgba(0,0,0,.94))}.swc{position:absolute;left:12px;right:8px;bottom:11px;display:flex;flex-direction:column;gap:6px;align-items:flex-start}.swc>span:last-child{font-size:9.5px;font-weight:600}
.nav{display:flex;justify-content:space-around;padding:7px 0 9px;border-top:1px solid rgba(126,118,155,.3)}.nav div{display:flex;flex-direction:column;align-items:center;gap:1px;font-size:7.5px;font-weight:600}
.capaf{position:relative;height:210px;margin-top:-30px;flex-shrink:0}.inf2{display:flex;gap:9px;align-items:center;background:#160A33;border-radius:12px;padding:9px 11px}.inf2 b{display:block;font-size:10px}.inf2 span{display:block;font-size:8.5px;color:#B7AED6}
.ag{display:flex;gap:10px;background:#fff;border-radius:14px;padding:9px;align-items:center}.ag .dt{width:48px;height:52px;border-radius:11px;background:#68E2E3;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0}.dt small{font-size:7.5px;font-weight:700}.dt b{font:italic 900 22px/1 Archivo}.ag>div:last-child>b{display:block;font-size:10.5px}.ag>div:last-child>span:not(.bd){display:block;font-size:8.5px;color:#5E557D;margin-bottom:3px}
.pg{display:grid;grid-template-columns:repeat(3,306px);gap:8px 20px;justify-content:center}.pg img{display:block;width:306px;height:306px;border-radius:14px}.pg span,.st span{display:block;font-size:9px;font-weight:700;color:#5E557D;letter-spacing:.05em;text-transform:uppercase;margin-top:5px}
.st{display:grid;grid-template-columns:repeat(4,246px);gap:18px;justify-content:center;margin-top:40px}.st img{display:block;width:246px;height:437px;border-radius:20px}
.pulbox{display:flex;flex-direction:column;gap:9px;background:#000;border-radius:14px;padding:14px 18px}.pul{display:flex;align-items:center;gap:16px;height:34px;border-radius:8px;padding:0 14px;font-size:11px;font-style:italic}.pul b{letter-spacing:.2em;flex:1}.pul i{font-size:9px;font-weight:700;border:1.5px solid;border-radius:99px;padding:1px 10px;font-style:normal}
.cams{display:flex;justify-content:space-around;align-items:center;height:156px;background:#000;border-radius:14px}.cam{position:relative;width:150px;height:142px}.cam>div{position:absolute}.cam svg{display:block}
.adbox{display:flex;justify-content:space-around;align-items:center;height:156px;background:#000;border-radius:14px}.ades{width:78px;height:78px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font:italic 900 13px/1 Archivo;text-align:center;border:3px solid #fff}
ul{list-style:none;display:flex;flex-direction:column;gap:11px;font-size:10px;line-height:1.4;color:#D9D3EE}li{display:flex;gap:9px;align-items:flex-start}li i{width:17px;height:17px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:9px;font-weight:800}
pre{font:9px/1.7 ui-monospace,Menlo,monospace;color:#68E2E3;white-space:pre-wrap}
.fim{position:relative;overflow:hidden;flex:1;margin-bottom:6px;border-radius:18px;display:flex;align-items:center;justify-content:center;gap:60px}"""

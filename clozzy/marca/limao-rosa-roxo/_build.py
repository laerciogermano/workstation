#!/usr/bin/env python3
"""Clozzy — limão + rosa + roxo + preto + branco (estudo de variações).

Pedido: mais alternativas com verde-limão, rosa, preto, branco e roxo. As cinco cores juntas, mudando o papel de cada
uma e o tom do limão e do roxo:
  A  Limão destaque            · rosa = marca/compra · roxo = criadora · limão = selo, sticker, close
  B  Roxo + limão              · roxo vira a cor dos momentos de marca, com limão em cima; rosa só na compra
  C  Limão protagonista        · anel limão no preto; rosa na compra; roxo na criadora
  D  Lilás + limão             · roxo clareado para lilás (superfície com texto preto) + limão no close
  E  Roxo elétrico + limão ácido · os dois mais saturados, mais “rave”
  F  Roxo é o close            · rosa = marca · limão = criadora · roxo = selo, anel ativo e trancado

Regras que continuam: nada preto no rosa; rosa e roxo nunca um sobre o outro. Novas: limão e cores claras levam texto
preto; branco no limão não lê.
Reaproveita as peças de ../alternativas-roxo (que reaproveita ../identidade-verde-close).
Rodar: python3 _build.py → limao-rosa-roxo.html + .pdf + svg/"""
import importlib.util, re, subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
MARCA = HERE.parent

_spec = importlib.util.spec_from_file_location("alt_roxo", MARCA / "alternativas-roxo" / "_build.py")
A = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(A)
G, V1, V2, M = A.G, A.V1, A.V2, A.M
PINK, BLACK, WHITE, PURPLE = A.PINK, A.BLACK, A.WHITE, V2.PURPLE
G3, G4, L2, L3 = A.G3, A.G4, A.L2, A.L3
TEMAS, mk, ratio, fg_on = A.TEMAS, A.mk, A.ratio, A.fg_on
sym, lock, tile, svg, box = A.sym, A.lock, A.tile, A.svg, A.box
OUT_HTML = HERE / "limao-rosa-roxo.html"
OUT_PDF = HERE / "limao-rosa-roxo.pdf"
SVG_DIR = HERE / "svg"

LIMAO, ACIDO = "#E8FF6B", "#C8FF2E"          # limão claro · limão ácido
LILAS, ROXO2 = "#C9B6FF", "#7B3FF2"          # lilás · roxo elétrico

A.tema_claro("lilas", "Lilás", LILAS)
TEMAS["lilas"].update(cta=BLACK, cta_txt=WHITE)            # rosa não encosta em roxo, nem claro
A.tema_claro("acido", "Limão ácido", ACIDO)
TEMAS["roxolimao"] = dict(nome="Roxo + limão", sup=PURPLE, sup2="#8C5ECB", linha="#A37FD6", titulo=LIMAO, texto=WHITE, apoio="#EBE3FA",
                          destaque=LIMAO, botao=LIMAO, botao_txt=BLACK, cta=LIMAO, cta_txt=BLACK, chip="#9165CD", marca="x", uso="")
TEMAS["roxo2"] = dict(nome="Roxo elétrico", sup=ROXO2, sup2="#8A55F4", linha="#A47CF7", titulo=ACIDO, texto=WHITE, apoio="#E9E0FF",
                      destaque=ACIDO, botao=ACIDO, botao_txt=BLACK, cta=ACIDO, cta_txt=BLACK, chip="#8A55F4", marca="x", uso="")

STD = lambda: [("No preto", mk(BLACK, PINK, WHITE, WHITE, PINK)), ("No branco", mk(WHITE, PINK, PINK, BLACK)), ("No Pink Deep", mk(PINK, WHITE, WHITE, WHITE))]

VARS = [
    dict(cod="A", nome="Limão destaque", ideia="A paleta de hoje com o limão por cima: rosa é a marca e a compra, roxo é a criadora, limão é o que brilha (selo do close, sticker, destaque). A mais fácil de adotar.",
         cores=[("Pink Deep", PINK, "marca, compra"), ("Roxo", PURPLE, "criadora"), ("Limão", LIMAO, "close, selo, sticker"), ("Preto", BLACK, "fundo"), ("Branco", WHITE, "fundo claro")],
         marcas=STD() + [("No limão", mk(LIMAO, BLACK, BLACK, BLACK)), ("No roxo", mk(PURPLE, WHITE, WHITE, WHITE)), ("Close no preto", mk(BLACK, LIMAO, WHITE, WHITE, LIMAO))],
         fa=dict(base="preto", destaque=PINK, cta=PINK, cta_txt=WHITE), close=LIMAO, cri="roxo", capa="limao",
         regras=["Limão sempre com texto preto; nunca branco.", "Rosa e roxo nunca um sobre o outro; limão pode encostar nos dois.", "Limão é peça pequena: selo, sticker, um bloco por peça."]),
    dict(cod="B", nome="Roxo + limão", ideia="O roxo vira a cor dos momentos de marca (capa, anúncio, criadora) e o limão vai em cima dele, no título e no botão. O rosa fica com a compra, no preto e no branco. Par roxo-limão: forte, jovem, de festival.",
         cores=[("Roxo", PURPLE, "momentos de marca, criadora"), ("Limão", LIMAO, "título e botão no roxo"), ("Pink Deep", PINK, "compra, marca no preto"), ("Preto", BLACK, "fundo"), ("Branco", WHITE, "fundo claro")],
         marcas=STD() + [("No limão", mk(LIMAO, BLACK, BLACK, BLACK)), ("No roxo · anel limão", mk(PURPLE, LIMAO, WHITE, WHITE, LIMAO)), ("No branco · roxo", mk(WHITE, PURPLE, PURPLE, BLACK))],
         fa=dict(base="preto", destaque=PINK, cta=PINK, cta_txt=WHITE), close=LIMAO, cri="roxolimao", capa="roxolimao",
         regras=[f"No roxo, título e botão em limão ({ratio(LIMAO, PURPLE):.1f}:1); texto corrido branco.", "Nada rosa no roxo: a compra no roxo é limão.", "Rosa e roxo em peças diferentes, ou com preto entre eles."]),
    dict(cod="C", nome="Limão protagonista", ideia="O limão vira a cor da marca no preto: anel limão, estrela branca. Rosa fica com a compra, roxo com a criadora. A mais diferente do que a Clozzy é hoje, e a que mais chama atenção no feed.",
         cores=[("Limão", LIMAO, "marca, anel, destaque"), ("Pink Deep", PINK, "compra"), ("Roxo", PURPLE, "criadora"), ("Preto", BLACK, "fundo"), ("Branco", WHITE, "fundo claro")],
         marcas=[("No preto", mk(BLACK, LIMAO, WHITE, WHITE, LIMAO)), ("No branco", mk(WHITE, BLACK, PINK, BLACK)), ("No Pink Deep", mk(PINK, WHITE, WHITE, WHITE)),
                 ("No limão", mk(LIMAO, BLACK, BLACK, BLACK)), ("No roxo · anel limão", mk(PURPLE, LIMAO, WHITE, WHITE, LIMAO)), ("Preto bicolor", mk(BLACK, WHITE, LIMAO, WHITE, LIMAO, LIMAO))],
         fa=dict(base="preto", destaque=LIMAO, cta=PINK, cta_txt=WHITE), close=LIMAO, cri="roxo", capa="preto",
         regras=[f"Limão não aparece no branco ({ratio(LIMAO, WHITE):.1f}:1): no branco, a marca é preta com estrela rosa.", "Compra sempre Pink Deep.", "No limão, tudo preto."]),
    dict(cod="D", nome="Lilás + limão", ideia="O roxo clareia para lilás: vira superfície clara com texto preto, como as alternativas do estudo anterior, e o limão marca o close. Mais suave e mais pastel; o rosa fica sozinho como cor forte.",
         cores=[("Pink Deep", PINK, "marca, compra"), ("Lilás", LILAS, "criadora, fundo claro"), ("Limão", LIMAO, "close, selo"), ("Preto", BLACK, "fundo"), ("Branco", WHITE, "fundo claro")],
         marcas=STD() + [("No lilás", mk(LILAS, BLACK, BLACK, BLACK)), ("No limão", mk(LIMAO, BLACK, BLACK, BLACK)), ("Close no preto", mk(BLACK, LIMAO, WHITE, WHITE, LIMAO))],
         fa=dict(base="preto", destaque=PINK, cta=PINK, cta_txt=WHITE), close=LIMAO, cri="lilas", capa="lilas",
         regras=["Lilás e limão levam texto e marca pretos.", "Rosa não vai em cima do lilás (continua da família do roxo).", "Lilás e limão juntos só com branco ou preto entre eles."]),
    dict(cod="E", nome="Roxo elétrico + limão ácido", ideia="Os dois no máximo de saturação: roxo elétrico #7B3FF2 e limão ácido #C8FF2E. Visual de rave, Y2K, capa de playlist. Muito impacto; cansa se usado em tudo.",
         cores=[("Pink Deep", PINK, "marca, compra"), ("Roxo elétrico", ROXO2, "criadora, campanha"), ("Limão ácido", ACIDO, "título no roxo, close"), ("Preto", BLACK, "fundo"), ("Branco", WHITE, "fundo claro")],
         marcas=STD() + [("No limão ácido", mk(ACIDO, BLACK, BLACK, BLACK)), ("No roxo elétrico", mk(ROXO2, ACIDO, WHITE, WHITE, ACIDO)), ("Close no preto", mk(BLACK, ACIDO, WHITE, WHITE, ACIDO))],
         fa=dict(base="preto", destaque=PINK, cta=PINK, cta_txt=WHITE), close=ACIDO, cri="roxo2", capa="acido",
         regras=[f"No roxo elétrico, título e botão em limão ácido ({ratio(ACIDO, ROXO2):.1f}:1).", "Uma cor saturada por peça além do rosa.", "Bom para campanha e lançamento; no dia a dia, prefira A ou D."]),
    dict(cod="F", nome="Roxo é o close", ideia="Troca de papéis: o rosa continua a marca, o limão vira o lado da criadora (claro, com texto preto) e o roxo fica só com o close: selo, anel de close ativo e conteúdo trancado.",
         cores=[("Pink Deep", PINK, "marca, compra"), ("Limão", LIMAO, "criadora"), ("Roxo", PURPLE, "close: selo, anel, trancado"), ("Preto", BLACK, "fundo"), ("Branco", WHITE, "fundo claro")],
         marcas=STD() + [("No limão", mk(LIMAO, BLACK, BLACK, BLACK)), ("No roxo", mk(PURPLE, WHITE, WHITE, WHITE)), ("Close no preto", mk(BLACK, PURPLE, WHITE, WHITE, PURPLE))],
         fa=dict(base="preto", destaque=PINK, cta=PINK, cta_txt=WHITE), close=PURPLE, cri="limao", capa="rosa",
         regras=["Roxo só onde é exclusivo: se não é do close, não é roxo.", "Selo do close roxo com texto branco.", "Rosa e roxo nunca um sobre o outro."]),
]
for v in VARS:
    for j, (_n, m) in enumerate(v["marcas"]):
        m["slug"] = f"lrr{v['cod']}-{j}"
        M.V[m["slug"]] = m
G.VARS = A.VARS = VARS

SEC = G.SEC
page = V1.page


def foot(n, t):
    dark = TEMAS[t]["sup"] != WHITE
    return (f'<div class="foot" style="color:{WHITE if dark else BLACK}"><span>Clozzy · limão + rosa + roxo · estudo de variações · {SEC[0]}</span>'
            f'<span>{n:02d}</span></div>')


V1.foot = foot


def cor_chave(v):
    return v["marcas"][0][1]["dash"] if v["cod"] == "C" else (PURPLE if v["cod"] == "B" else (ROXO2 if v["cod"] == "E" else v["close"]))


def p_capa():
    SEC[0] = "capa"
    cores = [PINK, BLACK, LIMAO, WHITE, PURPLE]
    blocos = "".join(f'<i style="width:62px;height:150px;border-radius:14px;background:{c};border:1px solid {G3}"></i>' for c in cores)
    strip = "".join(f'<div style="text-align:center">{tile(v["marcas"][0][1] if v["cod"] == "C" else v["marcas"][4][1] if v["cod"] in "BE" else v["marcas"][3][1], 74, None)}'
                    f'<div style="font:800 11px Gabarito;color:#fff;margin-top:6px">{v["cod"]}</div><div style="font:600 8.5px Figtree;color:{G4};max-width:96px">{v["nome"]}</div></div>' for v in VARS)
    body = (f'<div style="display:flex;flex-direction:column;justify-content:space-between;height:100%">'
            f'<div style="display:flex;justify-content:space-between;align-items:flex-start"><div><div class="lbl" style="color:{LIMAO};opacity:1">estudo · nov 2026</div>'
            f'<h1 style="color:#fff">Limão, rosa<br>e roxo</h1><p class="lead" style="color:{G4};max-width:420px;margin-top:14px">'
            f'As cinco cores juntas: verde-limão, Pink Deep, roxo, preto e branco. Seis jeitos de dividir os papéis entre elas, com marca, regras e as mesmas dez peças em cada um.</p></div>'
            f'<div style="display:flex;gap:6px">{blocos}</div></div>'
            f'<div style="display:flex;gap:22px;padding-bottom:12mm">{strip}</div></div>')
    page(None, body, "preto")


def p_cores():
    SEC[0] = "cores"
    tons = [("Limão", LIMAO), ("Limão ácido", ACIDO), ("Roxo", PURPLE), ("Roxo elétrico", ROXO2), ("Lilás", LILAS), ("Pink Deep", PINK)]
    sw = "".join(f'<div><div style="height:90px;border-radius:12px;background:{c};border:1px solid {L2}"></div><div style="font:800 11px Gabarito;margin-top:5px">{n}</div>'
                 f'<div class="num" style="font:700 9px Figtree;color:{L3}">{c}</div></div>' for n, c in tons)
    pares = [("Preto no limão", BLACK, LIMAO), ("Branco no limão", WHITE, LIMAO), ("Limão no roxo", LIMAO, PURPLE), ("Branco no roxo", WHITE, PURPLE),
             ("Limão ácido no roxo elétrico", ACIDO, ROXO2), ("Preto no lilás", BLACK, LILAS), ("Limão × Pink Deep", LIMAO, PINK), ("Pink Deep × roxo", PINK, PURPLE)]

    def nota(r, n):
        if "×" in n:
            return "convivem (luminosidade diferente)" if r >= 3 else "vibram: separar com preto ou branco"
        return "AA" if r >= 4.5 else ("só texto grande" if r >= 3 else "não usar para texto")
    tab = "".join(f'<tr><td><span style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:20px;border-radius:5px;background:{b};color:{a};font:900 11px Gabarito;'
                  f'margin-right:8px;vertical-align:middle;border:1px solid {L2}">Aa</span>{n}</td><td class="num"><b>{ratio(a, b):.1f}:1</b></td><td>{nota(ratio(a, b), n)}</td></tr>' for n, a, b in pares)
    page("Os tons e o que eles aguentam", f'<div class="grid" style="grid-template-columns:repeat(6,1fr);gap:12px;margin-top:12px">{sw}</div>'
         f'<div class="row" style="margin-top:18px;gap:30px"><div style="flex:1.2"><table>{tab}</table></div>'
         f'<div style="flex:1;font:500 10.5px/1.6 Figtree;color:{L3}">Limão e roxo são quase opostos em luminosidade, então o par funciona: limão em cima do roxo lê bem. '
         f'Limão e rosa também convivem. O que continua proibido é <b>rosa encostado no roxo</b>, porque os dois têm a mesma luminosidade e a borda vibra. '
         f'Por isso, em todas as variações, quando o fundo é roxo o destaque é limão, nunca rosa.</div></div>', "branco",
         "Dois limões (claro e ácido) e três roxos (o de hoje, elétrico e lilás). Antes das variações, os contrastes.")


def p_panorama():
    SEC[0] = "panorama"
    cols = ""
    for v in VARS:
        faixa = "".join(f'<i class="fx" style="flex:1;background:{c}"></i>' for _n, c, _u in v["cores"])
        m0 = v["marcas"][0][1]
        m1 = v["marcas"][4][1] if v["cod"] in "BE" else v["marcas"][3][1]
        cols += (f'<div><div class="d" style="font-size:36px;color:{cor_chave(v)}">{v["cod"]}</div><h3 style="color:#fff;font-size:13px;margin-top:4px;min-height:30px">{v["nome"]}</h3>'
                 f'<div style="display:flex;gap:3px;height:14px;margin-top:6px">{faixa}</div>'
                 f'<div style="margin-top:10px">{box(m0, sym(m0, 70), 140, 92, "border:1px solid #333")}</div>'
                 f'<div style="margin-top:6px">{box(m1, lock(m1, 18), 140, 40)}</div>'
                 f'<p style="font:500 9px/1.5 Figtree;color:#E6E6E6;margin-top:8px">{v["ideia"]}</p></div>')
    page("As seis variações", f'<div class="grid" style="grid-template-columns:repeat(6,1fr);gap:14px;margin-top:10px">{cols}</div>', "preto",
         "Da mais próxima do que existe (A) à mais diferente (C e E). Em cima, a marca no preto; embaixo, a logo na cor que define a variação.")


def p_comparar():
    SEC[0] = "comparação"
    capas = "".join(f'<div><div class="d" style="font-size:18px;margin-bottom:5px">{v["cod"]}</div>{G.post_capa(v)}</div>' for v in VARS)
    convs = "".join(f'<div>{G.post_convite(v)}</div>' for v in VARS)
    page("Lado a lado · capa e convite de criadora", f'<div style="display:flex;gap:12px;margin-top:8px">{capas}</div>'
         f'<div style="display:flex;gap:12px;margin-top:10px">{convs}</div>', "branco",
         "Em cima, a capa tipográfica na cor que cada variação usa para os momentos de marca. Embaixo, o lado da criadora.")


def p_comparar_app():
    SEC[0] = "comparação"
    phones, icons = "", ""
    for v in VARS:
        phones += f'<div style="text-align:center">{G.post_app(v, 140, 286)}<div class="cap" style="color:#fff">{v["cod"]} · fã</div></div>'
        m = v["marcas"][0][1]
        icons += f'<div style="text-align:center">{tile(m, 52, None)}<div class="cap" style="color:#fff">{v["cod"]}</div></div>'
    page("Lado a lado · app da fã e ícone", f'<div style="display:flex;gap:10px;margin-top:10px">{phones}</div>'
         f'<div style="display:flex;gap:30px;margin-top:12px">{icons}</div>', "preto",
         "O anel e o selo do close mudam de cor; a tabbar segue a cor da marca de cada variação.")


def p_recomendacao():
    SEC[0] = "recomendação"
    itens = [("A · Limão destaque", "Minha escolha para começar. Mantém o que já existe e dá ao close um sinal novo e muito visível. Risco baixo.", LIMAO),
             ("B · Roxo + limão", "A que mais resolve o roxo: com limão em cima ele deixa de parecer “SaaS” e ganha cara de festival. Boa para campanhas e para o lado da criadora.", PURPLE),
             ("D · Lilás + limão", "A mais leve. Se o roxo forte é o que incomoda, o lilás resolve sem tirar a família da paleta.", LILAS),
             ("C, E e F", "C muda a marca inteira; E é ótima para campanha, cansativa no dia a dia; F é interessante, mas roxo como close é menos óbvio que verde ou limão.", G3)]
    cards = "".join(f'<div style="border-top:4px solid {c};padding-top:12px"><h3 style="color:#fff;font-size:16px">{t}</h3><p style="font:500 11px/1.6 Figtree;color:#E6E6E6;margin-top:8px">{d}</p></div>' for t, d, c in itens)
    page("Leitura e próximos passos", f'<div class="grid" style="grid-template-columns:repeat(4,1fr);gap:22px;margin-top:20px">{cards}</div>'
         f'<div style="font:500 11px/1.6 Figtree;color:{G4};margin-top:30px;max-width:780px">Dá para misturar: por exemplo, A no app e E nas campanhas. '
         f'Escolhida a direção, atualizo a identidade, o manual de uso e o design system (tokens, temas e componentes).</div>', "preto", "Minha leitura. A decisão é sua.")


def write_svgs():
    SVG_DIR.mkdir(exist_ok=True)
    for f_ in SVG_DIR.glob("*.svg"):
        f_.unlink()
    tr = str.maketrans("áâãéêíóôõúç", "aaaeeiooouc")
    for v in VARS:
        for n, m in v["marcas"]:
            slug = re.sub(r"[^a-z0-9]+", "-", n.lower().translate(tr)).strip("-")
            (SVG_DIR / f"{v['cod'].lower()}-simbolo-{slug}.svg").write_text(M.sym_svg(m, bg=True))
            (SVG_DIR / f"{v['cod'].lower()}-logo-{slug}.svg").write_text(M.lockup_svg(m))


def build():
    V1.PAGES.clear()
    p_capa()
    p_cores()
    p_panorama()
    for v in VARS:
        G.p_var(v)
        G.p_posts(v)
    p_comparar()
    p_comparar_app()
    p_recomendacao()
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy · limão + rosa + roxo</title>'
            f'<style>{V1.CSS}{V2.PHOTO_CSS}.fx{{border-radius:4px;border:1px solid #2A2A2A}}</style></head><body>{"".join(V1.PAGES)}</body></html>')
    assert "#ff0065" not in html.lower()
    OUT_HTML.write_text(html)
    write_svgs()
    subprocess.run([V1.CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer", "--virtual-time-budget=6000",
                    f"--print-to-pdf={OUT_PDF}", OUT_HTML.as_uri()], check=True, capture_output=True)
    print("pages", len(V1.PAGES))


if __name__ == "__main__":
    build()

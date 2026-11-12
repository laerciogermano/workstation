#!/usr/bin/env python3
"""Clozzy — alternativas para o roxo (estudo de variações).

O usuário não gostou do verde nem do roxo. Aqui o Pink Deep, o preto e o branco ficam, e o roxo sai. Testamos o que entra
no lugar dele (o lado da criadora, convites, painel e o selo do close):
  1  Amarelo-manteiga #FFE45C   · quente, contrasta com o rosa sem vibrar; a recomendação
  2  Limão #E8FF6B              · mais elétrico e mais jovem
  3  Blush #FFD6E6              · tudo na família do rosa, só como fundo claro (o rosa da marca continua um só)
  4  Azul-bebê #A8D8FF          · frio e suave; rosa + azul-bebê é clássico Y2K
  5  Sem terceira cor           · controle: só Pink Deep, preto e branco

Todas as cores novas são claras: texto e marca PRETOS em cima delas (o “nada preto no rosa” continua valendo só para o rosa).
Reaproveita as peças do estudo do verde (../identidade-verde-close/_build.py), trocando cores e textos.
Rodar: python3 _build.py → alternativas-roxo.html + .pdf + svg/"""
import importlib.util, re, subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
MARCA = HERE.parent

_spec = importlib.util.spec_from_file_location("estudo_verde", MARCA / "identidade-verde-close" / "_build.py")
G = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(G)
V1, V2, M = G.V1, G.V2, G.M
PINK, BLACK, WHITE = G.PINK, G.BLACK, G.WHITE
G1, G2, G3, G4, L1, L2, L3 = G.G1, G.G2, G.G3, G.G4, G.L1, G.L2, G.L3
TEMAS, mk, ratio, _lum = G.TEMAS, G.mk, G.ratio, G._lum
sym, lock, tile, svg, box, foto = G.sym, G.lock, G.tile, G.svg, G.box, G.foto
OUT_HTML = HERE / "alternativas-roxo.html"
OUT_PDF = HERE / "alternativas-roxo.pdf"
SVG_DIR = HERE / "svg"

MANTEIGA, LIMAO, BLUSH, AZUL = "#FFE45C", "#E8FF6B", "#FFD6E6", "#A8D8FF"


def fg_on(c):                       # texto em cima de uma cor: preto nas claras, branco no rosa e no preto
    return BLACK if _lum(c) > .4 else WHITE


G.fg_on = fg_on


def tema_claro(key, nome, cor):
    TEMAS[key] = dict(nome=nome, sup=cor, sup2="rgba(0,0,0,.08)", linha="rgba(0,0,0,.18)", titulo=BLACK, texto=BLACK, apoio="rgba(0,0,0,.68)",
                      destaque=BLACK, botao=BLACK, botao_txt=WHITE, cta=PINK, cta_txt=WHITE, chip="rgba(0,0,0,.1)", marca="x", uso="")


for k, n, c in (("manteiga", "Amarelo-manteiga", MANTEIGA), ("limao", "Limão", LIMAO), ("blush", "Blush", BLUSH), ("azul", "Azul-bebê", AZUL)):
    tema_claro(k, n, c)


def variacao(cod, nome, cor, key, ideia, uso, extra_regras):
    return dict(
        cod=cod, nome=nome, ideia=ideia,
        cores=[("Pink Deep", PINK, "marca, compra"), (nome, cor, uso), ("Preto", BLACK, "fundo principal"), ("Branco", WHITE, "fundo claro")],
        marcas=[("No preto", mk(BLACK, PINK, WHITE, WHITE, PINK)), ("No branco", mk(WHITE, PINK, PINK, BLACK)), ("No Pink Deep", mk(PINK, WHITE, WHITE, WHITE)),
                (f"No {nome.lower()} · preto", mk(cor, BLACK, BLACK, BLACK)), (f"No {nome.lower()} · rosa", mk(cor, PINK, PINK, BLACK)),
                ("Close no preto", mk(BLACK, cor, WHITE, WHITE, cor))],
        fa=dict(base="preto", destaque=PINK, cta=PINK, cta_txt=WHITE), close=cor, cri=key, capa=key,
        regras=[f"No {nome.lower()}, marca e texto pretos; o botão de compra continua Pink Deep.",
                f"Rosa sobre {nome.lower()}: só elemento grande (anel, estrela, botão), nunca texto pequeno ({ratio(PINK, cor):.1f}:1)."] + extra_regras)


VARS = [
    variacao("1", "Amarelo-manteiga", MANTEIGA, "manteiga",
             "O contraponto quente do Pink Deep. É bem mais claro que o rosa, então os dois podem encostar sem vibrar. Funciona como marca-texto: sticker, selo, destaque, o lado da criadora.",
             "criadora, selo, destaque", ["Branco no amarelo não lê: nunca texto branco.", "Amarelo de fundo de tela só no lado da criadora; no resto, peça pequena."]),
    variacao("2", "Limão", LIMAO, "limao",
             "A versão elétrica do amarelo. Mais jovem e mais “internet”, chama mais atenção no feed. Pede mais cuidado: perto do rosa, a peça fica barulhenta rápido.",
             "criadora, selo, destaque", ["No máximo um bloco limão por peça.", "Nada de limão em foto com muita cor."]),
    variacao("3", "Blush", BLUSH, "blush",
             "Tudo na família do rosa: o Pink Deep continua o único rosa da marca e o blush é só um fundo claro, mais macio que o branco. É a mais coesa e a mais calma.",
             "fundo claro, criadora", ["Blush é fundo, nunca marca: a estrela no blush é Pink Deep ou preta.", "Não usar blush e branco na mesma peça (parecem a mesma cor errada)."]),
    variacao("4", "Azul-bebê", AZUL, "azul",
             "O frio do lado oposto: rosa e azul-bebê é um par clássico Y2K, leve e divertido. Separa bem a fã (rosa) da criadora (azul) sem ficar pesado como o roxo.",
             "criadora, selo, destaque", ["Azul-bebê sempre claro; nunca escurecer para azul forte (vira o cobalto da rodada 3).", "Texto e marca pretos no azul."]),
    dict(cod="5", nome="Sem terceira cor", ideia="Controle: só Pink Deep, preto e branco. O lado da criadora vira preto com detalhes rosa. Mais simples e mais forte, porém com menos jeito de separar fã e criadora.",
         cores=[("Pink Deep", PINK, "marca, compra, destaque"), ("Preto", BLACK, "fundo, criadora"), ("Branco", WHITE, "fundo claro")],
         marcas=[("No preto", mk(BLACK, PINK, WHITE, WHITE, PINK)), ("No branco", mk(WHITE, PINK, PINK, BLACK)), ("No Pink Deep", mk(PINK, WHITE, WHITE, WHITE)),
                 ("Preto bicolor", mk(BLACK, WHITE, PINK, WHITE, PINK, PINK)), ("Uma cor · preto", mk(WHITE, BLACK, BLACK, BLACK)), ("Uma cor · branco", mk(BLACK, WHITE, WHITE, WHITE))],
         fa=dict(base="preto", destaque=PINK, cta=PINK, cta_txt=WHITE), close=PINK, cri="preto", capa="rosa",
         regras=["Criadora no preto, com o rosa só no destaque.", "Selo do close em Pink Deep.", "Risco: tudo parece a mesma tela; o app perde um sinal de “onde estou”."]),
]
for v in VARS:
    for j, (_n, m) in enumerate(v["marcas"]):
        m["slug"] = f"alt{v['cod']}-{j}"
        M.V[m["slug"]] = m
G.VARS = VARS


# ---------------------------------------------------------------- peças que precisam da estrela na cor certa
def post_trancado(v):
    c = v["close"]
    lk = (f'<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:3">'
          f'<span style="width:44px;height:44px;border-radius:50%;background:{c};display:flex;align-items:center;justify-content:center">{svg(M.macia(fg_on(c), 40), "5 5 90 90", 26)}</span></div>')
    return (f'<div style="position:relative">{foto("make-mesa", G.W1, G.H916, 12, None, True)}{lk}'
            f'<div style="position:absolute;left:0;right:0;bottom:16px;text-align:center;z-index:3">{G.tk("Só pro close.", c, fg_on(c), 14)}</div></div>')


def selo_close_grande(v):
    c = v["close"]
    return (f'<div style="width:{G.W1}px;height:157px;border-radius:12px;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px">'
            f'<span style="width:74px;height:74px;border-radius:50%;background:{c};display:flex;align-items:center;justify-content:center">{svg(M.macia(fg_on(c), 40), "5 5 90 90", 44)}</span>'
            f'{G.selo(c, fg_on(c), "CLOSE ATIVO", 8)}</div>')


def post_convite(v):
    T = TEMAS[v["cri"]]
    bd = f"border:1px solid {G3};" if T["sup"] == BLACK else ""
    return (f'<div style="width:{G.W1}px;height:{G.H916}px;border-radius:12px;overflow:hidden;background:{T["sup"]};{bd}">{foto("vlog-tripe", G.W1, 158, 0)}'
            f'<div style="padding:10px"><div class="d" style="font-size:17px;color:{T["titulo"]}">Abra o<br>seu close.</div>'
            f'<div style="font:600 7.5px/1.4 Figtree;color:{T["apoio"]};margin-top:4px">você define o preço, recebe no Pix</div>'
            f'<div style="margin-top:8px">{G.bt("Quero vender", T["botao"] if T["sup"] != BLACK else PINK, T["botao_txt"] if T["sup"] != BLACK else WHITE)}</div></div></div>')


G.post_trancado, G.selo_close_grande, G.post_convite = post_trancado, selo_close_grande, post_convite

# ---------------------------------------------------------------- páginas próprias
SEC = G.SEC
page = V1.page


def foot(n, t):
    dark = TEMAS[t]["sup"] != WHITE
    return (f'<div class="foot" style="color:{WHITE if dark else BLACK}"><span>Clozzy · alternativas para o roxo · estudo de variações · {SEC[0]}</span>'
            f'<span>{n:02d}</span></div>')


V1.foot = foot
NOVAS = [v for v in VARS if v["cod"] != "5"]


def p_capa():
    SEC[0] = "capa"
    bolas = "".join(f'<span style="width:86px;height:86px;border-radius:50%;background:{v["close"]};display:flex;align-items:center;justify-content:center">'
                    f'{svg(M.macia(fg_on(v["close"]), 40), "5 5 90 90", 46)}</span>' for v in NOVAS)
    strip = "".join(f'<div style="text-align:center">{tile(v["marcas"][3][1] if v["cod"] != "5" else v["marcas"][0][1], 74, None)}'
                    f'<div style="font:800 11px Gabarito;color:#fff;margin-top:6px">{v["cod"]}</div><div style="font:600 8.5px Figtree;color:{G4};max-width:96px">{v["nome"]}</div></div>' for v in VARS)
    body = (f'<div style="display:flex;flex-direction:column;justify-content:space-between;height:100%">'
            f'<div style="display:flex;justify-content:space-between;align-items:flex-start"><div><div class="lbl" style="color:{PINK};opacity:1">estudo · nov 2026</div>'
            f'<h1 style="color:#fff">Alternativas<br>para o roxo</h1><p class="lead" style="color:{G4};max-width:420px;margin-top:14px">'
            f'Pink Deep, preto e branco ficam. Quatro cores candidatas para o lugar do roxo, mais uma versão sem terceira cor, com marca, regras e as mesmas dez peças em cada uma.</p></div>'
            f'<div style="display:flex;gap:10px">{bolas}</div></div>'
            f'<div style="display:flex;gap:22px;padding-bottom:12mm">{strip}</div></div>')
    page(None, body, "preto")


def p_criterio():
    SEC[0] = "critério"
    head = "<tr><th>Cor</th><th>com Pink Deep</th><th>texto preto em cima</th><th>texto branco em cima</th><th>no preto</th><th>leitura</th></tr>"
    leitura = {"1": "contraste quente, sem vibrar", "2": "elétrico, pede pouco uso", "3": "suave, mesma família", "4": "frio e leve, Y2K"}

    def amostra(c):
        return f'<span style="display:inline-block;width:46px;height:26px;border-radius:6px;background:{c};vertical-align:middle;margin-right:8px;border:1px solid {L2}"></span>'
    rows = "".join(f'<tr><td style="font-weight:800">{amostra(v["close"])}{v["nome"]} <span class="num" style="color:{L3};font-weight:600">{v["close"]}</span></td>'
                   f'<td class="num">{ratio(PINK, v["close"]):.1f}:1</td><td class="num"><b>{ratio(BLACK, v["close"]):.1f}:1</b></td>'
                   f'<td class="num" style="color:{L3}">{ratio(WHITE, v["close"]):.1f}:1</td><td class="num">{ratio(v["close"], BLACK):.1f}:1</td><td>{leitura[v["cod"]]}</td></tr>' for v in NOVAS)
    lado = "".join(f'<div style="display:flex;gap:4px;margin-bottom:8px"><i style="width:120px;height:52px;border-radius:10px;background:{PINK}"></i>'
                   f'<i style="width:120px;height:52px;border-radius:10px;background:{v["close"]};border:1px solid {L2}"></i>'
                   f'<i style="width:56px;height:52px;border-radius:10px;background:{BLACK}"></i></div>' for v in NOVAS)
    page("Por que essas quatro", f'<div class="row" style="margin-top:14px;gap:34px"><div style="flex:1.4"><table>{head}{rows}</table>'
         f'<div style="font:500 10.5px/1.6 Figtree;color:{L3};margin-top:14px">O verde falhou porque tinha a mesma luminosidade do Pink Deep (2,2:1): os dois vibravam. '
         f'O roxo é escuro e frio, e briga com o rosa pelo papel de cor principal. As quatro candidatas são <b>claras</b>: ficam longe do rosa em luminosidade, '
         f'não disputam o papel de marca e aceitam texto preto, que lê muito bem em todas. Ficaram de fora laranja, cereja e cobalto (já reprovados na rodada 3 de logos).</div></div>'
         f'<div><div class="lbl">Ao lado do Pink Deep e do preto</div>{lado}</div></div>', "branco",
         "Pink Deep, preto e branco ficam. O que a terceira cor precisa fazer: separar a criadora, marcar o close e destacar, sem disputar com o rosa.")


def p_panorama():
    SEC[0] = "panorama"
    cols = ""
    for v in VARS:
        faixa = "".join(f'<i class="fx" style="flex:1;background:{c}"></i>' for _n, c, _u in v["cores"])
        m0, m1 = v["marcas"][0][1], v["marcas"][3][1]
        cols += (f'<div><div class="d" style="font-size:40px;color:{v["close"] if v["cod"] != "5" else PINK}">{v["cod"]}</div><h3 style="color:#fff;font-size:14px;margin-top:4px">{v["nome"]}</h3>'
                 f'<div style="display:flex;gap:3px;height:16px;margin-top:10px">{faixa}</div>'
                 f'<div style="margin-top:12px">{box(m0, sym(m0, 80), 168, 104, "border:1px solid #333")}</div>'
                 f'<div style="margin-top:8px">{box(m1, lock(m1, 22), 168, 46, "border:1px solid #333" if m1["bg"] == BLACK else "")}</div>'
                 f'<p style="font:500 9.5px/1.5 Figtree;color:#E6E6E6;margin-top:10px">{v["ideia"]}</p></div>')
    page("As cinco variações", f'<div class="grid" style="grid-template-columns:repeat(5,1fr);gap:18px;margin-top:12px">{cols}</div>', "preto",
         "A marca principal (no preto) é a mesma em todas. Muda a cor que acompanha o rosa: aqui, a logo na cor nova.")


def p_comparar_peca():
    SEC[0] = "comparação"
    conv = "".join(f'<div><div class="d" style="font-size:20px;margin-bottom:6px">{v["cod"]}</div>{post_convite(v)}</div>' for v in VARS)
    page("Lado a lado · convite de criadora", f'<div style="display:flex;gap:14px;margin-top:12px">{conv}</div>'
         f'<div style="font:500 10.5px/1.6 Figtree;color:{L3};margin-top:14px;max-width:820px">É a peça que mais mostra a terceira cor: o lado da criadora inteiro. '
         f'Compare com o roxo de hoje: as cores claras deixam a foto respirar e o rosa continua sendo o único “grito” da marca.</div>', "branco",
         "Mesma foto e mesmo texto; muda só a superfície da criadora.")


def p_comparar_app():
    SEC[0] = "comparação"
    phones, icons = "", ""
    for v in VARS:
        T = dict(TEMAS[v["cri"]])
        T["marca"] = v["marcas"][3][1]["slug"] if v["cod"] != "5" else v["marcas"][0][1]["slug"]
        if v["cod"] == "5":
            T.update(cta=PINK, cta_txt=WHITE, destaque=PINK)
        phones += f'<div style="text-align:center">{V1.phone(V1.s_painel(T), T, 150, 306)}<div class="cap" style="color:#fff">{v["cod"]} · {v["nome"]}</div></div>'
        icons += f'<div style="text-align:center">{tile(v["marcas"][3][1] if v["cod"] != "5" else v["marcas"][0][1], 64, None)}<div class="cap" style="color:#fff">{v["cod"]}</div></div>'
    page("Lado a lado · painel da criadora e ícone", f'<div style="display:flex;gap:12px;margin-top:12px">{phones}</div>'
         f'<div style="display:flex;gap:18px;margin-top:14px">{icons}</div>', "preto",
         "A tela que hoje é roxa: o painel da criadora, na cor nova. Embaixo, o ícone de app na versão com a cor nova.")


def p_recomendacao():
    SEC[0] = "recomendação"
    itens = [("1 · Amarelo-manteiga", "Minha escolha. Contrasta com o Pink Deep sem vibrar, aceita texto preto, é jovem sem ser infantil e não disputa o papel de marca.", MANTEIGA),
             ("4 · Azul-bebê", "Segunda opção. Separa bem fã e criadora e é leve. Fica um pouco mais “fofo”; bom se o público pender mais para 18–20.", AZUL),
             ("3 · Blush", "A mais coesa e calma, mas mexe na regra de um rosa só (mesmo sendo só fundo). Boa se a marca quiser ficar mais íntima.", BLUSH),
             ("2 · Limão", "A de mais impacto no feed, a mais difícil de manter. Melhor como cor de campanha do que como cor fixa.", LIMAO)]
    cards = "".join(f'<div style="border-top:4px solid {c};padding-top:12px"><h3 style="color:#fff;font-size:16px">{t}</h3><p style="font:500 11px/1.6 Figtree;color:#E6E6E6;margin-top:8px">{d}</p></div>' for t, d, c in itens)
    page("Leitura e próximos passos", f'<div class="grid" style="grid-template-columns:repeat(4,1fr);gap:22px;margin-top:20px">{cards}</div>'
         f'<div style="font:500 11px/1.6 Figtree;color:{G4};margin-top:30px;max-width:760px">A versão sem terceira cor (5) funciona como reserva: se nenhuma convencer, '
         f'o sistema fica de pé só com Pink Deep, preto e branco. Escolhida a cor, atualizo a identidade, o manual de uso e o design system (tokens, temas e componentes).</div>',
         "preto", "Minha leitura. A decisão é sua.")


def write_svgs():
    SVG_DIR.mkdir(exist_ok=True)
    for f_ in SVG_DIR.glob("*.svg"):
        f_.unlink()
    tr = str.maketrans("áâãéêíóôõúç", "aaaeeiooouc")
    for v in VARS:
        for n, m in v["marcas"]:
            slug = re.sub(r"[^a-z0-9]+", "-", n.lower().translate(tr)).strip("-")
            (SVG_DIR / f"{v['cod']}-simbolo-{slug}.svg").write_text(M.sym_svg(m, bg=True))
            (SVG_DIR / f"{v['cod']}-logo-{slug}.svg").write_text(M.lockup_svg(m))


def build():
    V1.PAGES.clear()
    p_capa()
    p_criterio()
    p_panorama()
    for v in VARS:
        G.p_var(v)
        G.p_posts(v)
    p_comparar_peca()
    p_comparar_app()
    p_recomendacao()
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy · alternativas para o roxo</title>'
            f'<style>{V1.CSS}{V2.PHOTO_CSS}.fx{{border-radius:4px;border:1px solid #2A2A2A}}</style></head><body>{"".join(V1.PAGES)}</body></html>')
    assert "#ff0065" not in html.lower()
    assert "#7c48c4" not in html.lower(), "sobrou roxo"
    OUT_HTML.write_text(html)
    write_svgs()
    subprocess.run([V1.CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer", "--virtual-time-budget=6000",
                    f"--print-to-pdf={OUT_PDF}", OUT_HTML.as_uri()], check=True, capture_output=True)
    print("pages", len(V1.PAGES))


if __name__ == "__main__":
    build()

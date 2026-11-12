#!/usr/bin/env python3
"""Capa v2 de Eternos Mutáveis: opções em preto e branco a partir do rascunho do autor
(inputs/Livro_ O Código.docx, imagem 5: título à mão, peças de quebra-cabeça, retângulo-dominó
branco com bola preta | preto com bola branca, mãos da era adâmica).

Leitura do dominó no rascunho:
  preto + bola branca = sólido, físico, matéria, saída, luz  -> FRENTE (o homem preso na matéria, com a centelha)
  branco + bola preta = abstrato, metafísico, espaço/forma, entrada -> VERSO (a superação adâmica: chegar ao metafísico)
O livro fechado é a peça: abrir pela frente preta e terminar no verso branco.

Gera capa-{a,b,c,d}.html (capa inteira: verso | lombada | frente), e _render.js tira os PNG/PDF."""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
W, H, SP = 1600, 2400, 100          # frente 6x9 pol. ; lombada ~128 págs.
FX = W + SP                          # x inicial da frente na capa inteira
TW = 2 * W + SP

SLOGAN = "A superação adâmica"
BLURB = [
    "Desde o início dos tempos o homem faz as mesmas",
    "perguntas: o que é Deus, o que é o mundo espiritual,",
    "o que existe depois da morte. O autor, ateu e",
    "programador, encontrou a resposta onde menos",
    "esperava: no código. Foi programando sistemas",
    "que entendeu como o real é construído.",
    "",
    "Eternos Mutáveis é uma alfabetização espiritual",
    "para quem ainda está preso no mundo da matéria.",
    "Pela lógica, e não pela fé cega, o livro refaz o",
    "caminho do homem, da era adâmica à gnose,",
    "e mostra que todos somos um.",
]

OPC = {
    "a": dict(nome="Dominó", ideia="A frente é o lado preto da peça, com a bola branca (matéria, luz, a centelha); o verso é o lado branco, com a bola preta (o metafísico). Virar o livro é a superação adâmica.",
              front_bg="#0B0B0B", front_ink="#F4F2EC", back_bg="#F4F2EC", back_ink="#0B0B0B", spine_bg="#0B0B0B", spine_ink="#F4F2EC",
              ball_f="#F4F2EC", ball_b="#0B0B0B", slogan_b="Da era adâmica à superação"),
    "b": dict(nome="Quebra-cabeça", ideia="Frente e verso são duas peças que se encaixam na lombada: a bola branca é o encaixe do verso entrando no preto; a bola preta, o do preto entrando no branco. Todos somos um.",
              front_bg="#0B0B0B", front_ink="#F4F2EC", back_bg="#F4F2EC", back_ink="#0B0B0B", spine_bg=None, spine_ink="#F4F2EC",
              ball_f="#F4F2EC", ball_b="#0B0B0B", slogan_b="A última peça do quebra-cabeça"),
    "c": dict(nome="Vermelho × azul", ideia="Dualidade: a frente vermelha (era adâmica: sangue, terra, desejo, matéria) e o verso azul (céu, espírito, superação). A lombada faz a passagem. A bola segue o dominó: branca na frente, preta no verso.",
              front_bg="url(#redg)", front_ink="#F6E9E4", back_bg="url(#blug)", back_ink="#F2F5FF", spine_bg="url(#spg)", spine_ink="#FFFFFF",
              ball_f="#FBF3EE", ball_b="#0B0B0B", slogan_f="Da era adâmica à superação", slogan_b="Da era adâmica à superação"),
    "d": dict(nome="Dominó em pé", ideia="A frente inteira é uma peça de dominó: metade preta com bola branca, metade branca com bola preta. “Eternos” fica no lado da matéria e “Mutáveis” no lado do espírito; o título atravessa a divisa.",
              front_bg="#0B0B0B", front_ink="#F4F2EC", back_bg="#F4F2EC", back_ink="#0B0B0B", spine_bg="#0B0B0B", spine_ink="#F4F2EC",
              ball_f="#F4F2EC", ball_b="#0B0B0B", slogan_b="Da era adâmica à superação"),
    "e": dict(nome="As mãos", ideia="Do seu rascunho: a mão feminina preta (abstrato, metafísico, entrada) no lado branco e a mão masculina branca (sólido, físico, matéria) no lado preto. Na frente elas ainda não se tocam: a era adâmica, o vão. No verso, esticadas, os dedos se tocam: a superação adâmica.",
              front_bg="#0B0B0B", front_ink="#F4F2EC", back_bg="#F4F2EC", back_ink="#0B0B0B", spine_bg=None, spine_ink="#7A7A7A",
              ball_f="#F4F2EC", ball_b="#0B0B0B", slogan_b="Da era adâmica à superação"),
    "f": dict(nome="As mãos · vertical", ideia="A mesma ideia em pé: o branco em cima com a mão feminina preta descendo, o preto embaixo com a mão masculina branca subindo; afastadas na frente. No verso a peça vira e os dedos se tocam, esticados. O texto inverte de cor sobre cada lado.",
              front_bg="#0B0B0B", front_ink="#F4F2EC", back_bg="#F4F2EC", back_ink="#0B0B0B", spine_bg="#0B0B0B", spine_ink="#F4F2EC",
              ball_f="#F4F2EC", ball_b="#0B0B0B", slogan_b="Da era adâmica à superação"),
}

HK, HFX, HFY = 1.1, 740, 0          # mãos: escala, x do vão no recorte, origem
MW, MH = 1575, 575


def dtext(x, y, s, cls):
    """Texto branco em modo diferença: fica preto sobre o branco e branco sobre o preto."""
    return f'<text x="{x}" y="{y}" text-anchor="middle" class="{cls}" fill="#FFFFFF" style="mix-blend-mode:difference">{s}</text>'


def split_text(cx, y, s, cls, mid, left="#0B0B0B", right="#F4F2EC", side="f"):
    return (f'<text x="{cx}" y="{y}" text-anchor="middle" class="{cls}" fill="{left}" clip-path="url(#cl{side})">{s}</text>'
            f'<text x="{cx}" y="{y}" text-anchor="middle" class="{cls}" fill="{right}" clip-path="url(#cr{side})">{s}</text>')


def hands(mid, cy, gap, touch=False):
    """Frente: afastadas (o vão do afresco de Michelangelo). Verso: esticadas, se tocando, com um brilho no toque."""
    x0 = mid - HFX * HK
    y0 = cy - MH * HK / 2
    fx, fy = x0 - (0 if touch else gap), y0 + 52 * HK
    fem = f'<image href="maos-feminina.png" x="{fx:.0f}" y="{fy:.0f}" width="{732 * HK:.0f}" height="{470 * HK:.0f}"/>'
    if not touch:
        mas = f'<image href="maos-masculina.png" x="{x0 + 740 * HK + gap:.0f}" y="{y0 + 58 * HK:.0f}" width="{807 * HK:.0f}" height="{405 * HK:.0f}"/>'
        return fem + mas
    tx, ty = fx + 730 * HK, fy + 230 * HK                 # ponta do dedo feminino
    mx, my = tx + 4 - 4 * HK, ty - 254 * HK               # ponta do dedo masculino no mesmo ponto
    mas = (f'<image href="maos-masculina.png" x="{mx:.0f}" y="{my:.0f}" width="{807 * HK:.0f}" height="{405 * HK:.0f}" '
           f'transform="rotate(-9 {tx:.0f} {ty:.0f})"/>')
    rays = "".join(f'<line x1="{tx:.0f}" y1="{ty:.0f}" x2="{tx + 260 * __import__("math").cos(a):.0f}" y2="{ty + 260 * __import__("math").sin(a):.0f}" stroke="#fff" stroke-width="{w}" opacity="{o}"/>'
                   for a, w, o in [(i * 0.5236 + 0.26, 2 if i % 2 else 3, .5 if i % 2 else .8) for i in range(12)])
    glow = (f'<g style="mix-blend-mode:difference">'
            f'<circle cx="{tx:.0f}" cy="{ty:.0f}" r="230" fill="url(#spark)"/>{rays}'
            f'<circle cx="{tx:.0f}" cy="{ty:.0f}" r="14" fill="#fff"/></g>')
    return fem + mas


DEFS = """<defs>
<radialGradient id="redg" cx="50%" cy="48%" r="75%"><stop offset="0" stop-color="#9E1F1F"/><stop offset=".6" stop-color="#5E0E0E"/><stop offset="1" stop-color="#2A0505"/></radialGradient>
<radialGradient id="lilg" cx="50%" cy="35%" r="80%"><stop offset="0" stop-color="#E4D3FA"/><stop offset=".7" stop-color="#C6A8EE"/><stop offset="1" stop-color="#A987DE"/></radialGradient>
<radialGradient id="blug" cx="50%" cy="35%" r="80%"><stop offset="0" stop-color="#2F62C8"/><stop offset=".65" stop-color="#1A3F93"/><stop offset="1" stop-color="#0E2560"/></radialGradient>
<linearGradient id="spg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0E2560"/><stop offset="1" stop-color="#5E0E0E"/></linearGradient>
<clipPath id="fa"><rect x="1700" y="0" width="1600" height="2400"/></clipPath><clipPath id="ba"><rect x="0" y="0" width="1600" height="2400"/></clipPath>
<clipPath id="clf"><rect x="1700" y="0" width="800" height="2400"/></clipPath><clipPath id="crf"><rect x="2500" y="0" width="800" height="2400"/></clipPath>
<clipPath id="clb"><rect x="0" y="0" width="800" height="2400"/></clipPath><clipPath id="crb"><rect x="800" y="0" width="800" height="2400"/></clipPath>
<radialGradient id="spark"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset=".18" stop-color="#fff" stop-opacity=".75"/><stop offset=".5" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<linearGradient id="fadew" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4F2EC"/><stop offset=".25" stop-color="#F4F2EC"/><stop offset="1" stop-color="#F4F2EC" stop-opacity="0"/></linearGradient>
<radialGradient id="glow"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".35"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
</defs>"""


def t(x, y, s, cls, fill, anchor="middle", extra=""):
    return f'<text x="{x}" y="{y}" text-anchor="{anchor}" class="{cls}" fill="{fill}" {extra}>{s}</text>'


def front(k, o):
    x0, cx = FX, FX + W / 2
    ink, out = o["front_ink"], []
    if k == "d":
        out.append(f'<rect x="{x0}" y="0" width="{W}" height="{H / 2}" fill="#0B0B0B"/>')
        out.append(f'<rect x="{x0}" y="{H / 2}" width="{W}" height="{H / 2}" fill="#F4F2EC"/>')
        out.append(f'<line x1="{x0 + 160}" y1="{H / 2}" x2="{x0 + W - 160}" y2="{H / 2}" stroke="#7A7A7A" stroke-width="3"/>')
        out.append(f'<circle cx="{cx}" cy="{H / 2}" r="16" fill="#7A7A7A"/>')
        out.append(f'<circle cx="{cx}" cy="560" r="190" fill="#F4F2EC"/>')
        out.append(f'<circle cx="{cx}" cy="1840" r="190" fill="#0B0B0B"/>')
        out.append(t(cx, 160, SLOGAN.upper(), "sl", "#BDBAB2"))
        out.append(t(cx, 1110, "ETERNOS", "tt", "#F4F2EC"))
        out.append(t(cx, 1390, "MUTÁVEIS", "tt", "#0B0B0B"))
        out.append(t(cx, 2290, "LAÉRCIO GERMANO", "au", "#0B0B0B"))
        return "".join(out)
    if k == "f":
        cy, hx = 1110, x0 + 1130
        out.append(f'<rect x="{x0}" y="0" width="{W}" height="{cy}" fill="#F4F2EC"/>')
        out.append(f'<rect x="{x0}" y="{cy}" width="{W}" height="{H - cy}" fill="#0B0B0B"/>')
        out.append(f'<g clip-path="url(#fa)"><g transform="translate({hx} {cy}) rotate(90) scale(1.26) translate({-hx} {-cy})">{hands(hx, cy, 110)}</g></g>')
        lx = x0 + 120
        out.append(f'<text x="{lx}" y="230" class="sl" fill="#6E6B64">{SLOGAN.upper()}</text>')
        out.append(f'<text x="{lx}" y="420" class="tt2" fill="#0B0B0B">ETERNOS</text>')
        out.append(f'<text x="{lx}" y="1420" class="tt2" fill="#F4F2EC">MUTÁVEIS</text>')
        out.append(f'<text x="{lx}" y="2270" class="au" fill="#F4F2EC">LAÉRCIO GERMANO</text>')
        return "".join(out)
    if k == "e":
        out.append(f'<rect x="{x0}" y="0" width="{W / 2}" height="{H}" fill="#F4F2EC"/>')
        out.append(f'<rect x="{cx}" y="0" width="{W / 2}" height="{H}" fill="#0B0B0B"/>')
        out.append(f'<g clip-path="url(#fa)">{hands(cx, 1170, 150)}</g>')
        out.append(split_text(cx, 400, "ETERNOS", "tt", cx))
        out.append(split_text(cx, 560, "MUTÁVEIS", "tt", cx))
        out.append(split_text(cx, 1720, SLOGAN, "sg", cx))
        out.append(split_text(cx, 2240, "LAÉRCIO GERMANO", "au", cx))
        return "".join(out)
    out.append(f'<rect x="{x0}" y="0" width="{W}" height="{H}" fill="{o["front_bg"]}"/>')
    if k == "c":
        out.append(f'<circle cx="{cx}" cy="1190" r="420" fill="url(#glow)"/>')
    if k == "b":
        # encaixe do verso (branco) entrando na frente, e o vão do encaixe preto saindo para o verso
        out.append(f'<rect x="{x0 - SP / 2}" y="{1190 - 70}" width="{150 + SP / 2}" height="140" fill="{o["ball_f"]}"/>')
        out.append(f'<circle cx="{x0 + 300}" cy="1190" r="190" fill="{o["ball_f"]}"/>')
    else:
        out.append(f'<circle cx="{cx}" cy="1190" r="190" fill="{o["ball_f"]}"/>')
    out.append(t(cx, 400, "ETERNOS", "tt", ink))
    out.append(t(cx, 560, "MUTÁVEIS", "tt", ink))
    out.append(t(cx, 1720, o.get("slogan_f", SLOGAN), "sg", ink))
    out.append(f'<line x1="{cx - 40}" y1="2120" x2="{cx + 40}" y2="2120" stroke="{ink}" stroke-width="2" opacity=".6"/>')
    out.append(t(cx, 2240, "LAÉRCIO GERMANO", "au", ink))
    return "".join(out)


def back(k, o):
    cx, ink, out = W / 2, o["back_ink"], []
    if k == "f":
        cy = 1900
        out.append(f'<rect x="0" y="0" width="{W}" height="{cy}" fill="#F4F2EC"/>')
        out.append(f'<rect x="0" y="{cy}" width="{W}" height="{H - cy}" fill="#0B0B0B"/>')
        out.append(f'<g clip-path="url(#ba)"><g transform="translate({cx} {cy}) rotate(90) scale(.68) translate({-cx} {-cy})">{hands(cx, cy, 0, touch=True)}</g></g>')
        out.append(dtext(cx, 300, o["slogan_b"], "sb"))
        yy = 430
        for ln in BLURB:
            if ln:
                out.append(dtext(cx, yy, ln, "bl"))
            yy += 62 if ln else 40
        top = cy - 730 * HK * .68 - 10
        out.append(f'<rect x="0" y="{top:.0f}" width="{W}" height="260" fill="url(#fadew)"/>')
        out.append(dtext(cx, 1260, "ALFABETIZAÇÃO ESPIRITUAL · FILOSOFIA · SOFTWARE", "ct"))
        return "".join(out)
    if k == "e":
        out.append(f'<rect x="0" y="0" width="{W / 2}" height="{H}" fill="#F4F2EC"/>')
        out.append(f'<rect x="{cx}" y="0" width="{W / 2}" height="{H}" fill="#0B0B0B"/>')
        out.append(split_text(cx, 330, o["slogan_b"], "sb", cx, side="b"))
        yy = 470
        for ln in BLURB:
            if ln:
                out.append(split_text(cx, yy, ln, "bl", cx, side="b"))
            yy += 62 if ln else 40
        out.append(f'<g clip-path="url(#ba)">{hands(cx, 1640, 0, touch=True)}</g>')
        out.append(split_text(cx, H - 200, "ALFABETIZAÇÃO ESPIRITUAL · FILOSOFIA · SOFTWARE", "ct", cx, side="b"))
        return "".join(out)
    out.append(f'<rect x="0" y="0" width="{W}" height="{H}" fill="{o["back_bg"]}"/>')
    if k == "d":
        out.append(f'<rect x="0" y="{H - 760}" width="{W}" height="760" fill="#0B0B0B"/>')
        out.append(f'<circle cx="{cx}" cy="{H - 380}" r="150" fill="#F4F2EC"/>')
        out.append(f'<circle cx="{cx}" cy="330" r="110" fill="#0B0B0B"/>')
        y0 = 640
    elif k == "b":
        out.append(f'<rect x="{W - 150}" y="{1760 - 70}" width="{150 + SP / 2}" height="140" fill="{o["ball_b"]}"/>')
        out.append(f'<circle cx="{W - 300}" cy="1760" r="190" fill="{o["ball_b"]}"/>')
        y0 = 360
    else:
        out.append(f'<circle cx="{cx}" cy="420" r="130" fill="{o["ball_b"]}"/>')
        y0 = 760
    out.append(t(cx, y0, o["slogan_b"], "sb", ink))
    yy = y0 + 130
    for ln in BLURB:
        if ln:
            out.append(t(cx, yy, ln, "bl", ink))
        yy += 62 if ln else 40
    if k != "d":
        out.append(t(cx, H - 200, "ALFABETIZAÇÃO ESPIRITUAL · FILOSOFIA · SOFTWARE", "ct", ink, extra='opacity=".65"'))
    return "".join(out)


def spine(k, o):
    out = []
    if o["spine_bg"]:
        out.append(f'<rect x="{W}" y="0" width="{SP}" height="{H}" fill="{o["spine_bg"]}"/>')
    elif k == "e":
        out.append(f'<rect x="{W}" y="0" width="{SP / 2}" height="{H}" fill="#0B0B0B"/>')
        out.append(f'<rect x="{W + SP / 2}" y="0" width="{SP / 2}" height="{H}" fill="#F4F2EC"/>')
    else:   # quebra-cabeça: lombada metade/metade, a divisa do encaixe
        out.append(f'<rect x="{W}" y="0" width="{SP / 2}" height="{H}" fill="{o["back_bg"]}"/>')
        out.append(f'<rect x="{W + SP / 2}" y="0" width="{SP / 2}" height="{H}" fill="{o["front_bg"]}"/>')
    sx = W + SP / 2
    fill = o["spine_ink"] if k not in ("b", "e") else "#7A7A7A"
    out.append(f'<text x="0" y="0" transform="translate({sx + 13} {H / 2}) rotate(90)" text-anchor="middle" class="sp" fill="{fill}">ETERNOS MUTÁVEIS  ·  LAÉRCIO GERMANO</text>')
    return "".join(out)


CSS = """@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Cormorant+SC:wght@500;600&display=swap');
html,body{margin:0;background:#2a2a2a}svg{display:block}
.tt{font-family:'Cormorant SC',serif;font-weight:600;font-size:150px;letter-spacing:20px}
.sg{font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:500;font-size:68px}
.sl{font-family:'Cormorant SC',serif;font-size:40px;letter-spacing:12px}
.au{font-family:'Cormorant SC',serif;font-size:48px;letter-spacing:14px}
.sb{font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:600;font-size:66px}
.bl{font-family:'Cormorant Garamond',serif;font-size:42px}
.ct{font-family:'Cormorant SC',serif;font-size:28px;letter-spacing:6px}
.tt2{font-family:'Cormorant SC',serif;font-weight:600;font-size:132px;letter-spacing:14px}
.sp{font-family:'Cormorant SC',serif;font-size:38px;letter-spacing:10px}"""


def page(k, o):
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {TW} {H}" width="{TW}" height="{H}">{DEFS}'
           f'{back(k, o)}{spine(k, o)}{front(k, o)}</svg>')
    return (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Eternos Mutáveis — capa {k.upper()} · {o["nome"]}</title>'
            f'<style>{CSS}</style></head><body>{svg}</body></html>')


for k, o in OPC.items():
    open(os.path.join(HERE, f"capa-{k}.html"), "w").write(page(k, o))

# painel de comparação (preenchido com os PNG gerados pelo _render.js)
cards = "".join(f'<section><div class="hd"><b>{k.upper()} · {o["nome"]}</b><p>{o["ideia"]}</p></div>'
                f'<div class="im"><img class="fr" src="capa-{k}-frente.png"><img class="wr" src="capa-{k}-inteira.png"></div></section>'
                for k, o in OPC.items())
ov = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Eternos Mutáveis — capas v2</title><style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&display=swap');
@page{{size:297mm 210mm;margin:0}}*{{box-sizing:border-box;margin:0}}body{{font-family:'Cormorant Garamond',serif;background:#E9E7E1;color:#111}}
section,header{{width:297mm;height:210mm;padding:12mm 14mm;page-break-after:always;display:flex;flex-direction:column;gap:6mm}}
header h1{{font-size:44px;font-weight:600}}header p{{font-size:17px;max-width:230mm;line-height:1.45}}header img{{height:110mm;align-self:flex-start;border:1px solid #ccc;background:#fff}}
.hd b{{font-size:26px}}.hd p{{font-size:15px;max-width:240mm;line-height:1.4}}
.im{{display:flex;gap:8mm;align-items:flex-end;flex:1;min-height:0}}.im img{{box-shadow:0 6px 22px rgba(0,0,0,.25)}}.fr{{height:150mm}}.wr{{height:100mm}}
</style></head><body>
<header><h1>Eternos Mutáveis · capas v2 (preto e branco)</h1>
<p>Partem do seu rascunho em <i>Livro: O Código</i>: o retângulo-dominó (branco com bola preta = abstrato, metafísico, entrada; preto com bola branca = sólido, físico, matéria, luz), as peças de quebra-cabeça e a era adâmica. Na frente, o lado preto: o homem na matéria com a centelha. No verso, o lado branco: a superação adâmica. Slogan escolhido: <b>“A superação adâmica”</b>, porque nomeia o arco inteiro do livro (do cap. 1, Era adâmica, ao cap. 7, Superação) e é só desta obra; “alfabetização espiritual” fica no texto do verso e “gnose” no corpo, onde o leitor já tem contexto.</p>
<img src="rascunho-autor.png"></header>{cards}</body></html>"""
open(os.path.join(HERE, "opcoes.html"), "w").write(ov)
print("ok")

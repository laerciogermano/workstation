#!/usr/bin/env python3
"""Clozzy — possibilidades de logo (rodada 4), a partir de marca/refs (prints favoritos do usuário).
Ingredientes: disco + estrela (v1/performer) · C aberto (Círculo próximo) · anel de story (fino, segmentado, tracejado).
Paleta fechada: Pink Clozzy · Pink Deep · Roxo v1 · Ink · Cream · Branco.  Rodar: python3 _marcas.py → svg/"""
import math, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "identidade-nova"))
sys.path.insert(0, str(HERE.parent / "logo-2028"))
import _logos  # noqa: E402
import _conceitos as R2  # noqa: E402

PINK, DEEP, PURPLE, INK, CREAM, WHITE = "#FF0065", "#E0005A", "#7C48C4", "#14090F", "#FFF6F0", "#FFFFFF"
OUT = HERE / "svg"
OUT.mkdir(exist_ok=True)
THEMES = ("color", "dark", "tile", "mono")   # tile = tudo branco sobre o tile rosa
BG = {"color": WHITE, "dark": INK, "tile": PINK, "mono": WHITE}


def f(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def P(a, r, cx=128, cy=128):
    t = math.radians(a)
    return cx + r * math.cos(t), cy + r * math.sin(t)


def star(c, R, cx=128, cy=131, rot=-90):
    return f'<path d="{R2.star(cx, cy, R, ratio=0.48, r=R * 0.14, rot=rot)}" fill="{c}"/>'


def disc(c, r, cx=128, cy=128):
    return f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}" fill="{c}"/>'


def ring(c, r, w):
    return f'<circle cx="128" cy="128" r="{f(r)}" fill="none" stroke="{c}" stroke-width="{f(w)}"/>'


def arc(c, r, a0, a1, w, cap="round"):
    """Arco no sentido horário de a0 até a1 (graus; 0 = direita, 90 = baixo)."""
    span = (a1 - a0) % 360
    (x0, y0), (x1, y1) = P(a0, r), P(a1, r)
    return (f'<path d="M{f(x0)} {f(y0)}A{f(r)} {f(r)} 0 {1 if span > 180 else 0} 1 {f(x1)} {f(y1)}" fill="none" '
            f'stroke="{c}" stroke-width="{f(w)}" stroke-linecap="{cap}"/>')


def cols(t):
    """(anel, acento) por tema."""
    return {"color": (PINK, PURPLE), "dark": (PINK, WHITE), "tile": (WHITE, WHITE), "mono": (INK, INK)}[t]


W_N, W_S = 24, 34            # espessura do anel: normal (grid 256) e corte ≤ 24 px — mais grosso que o Story (14)


def dims(small, w=None):
    w = w or (W_S if small else W_N)
    return w, 126 - w / 2, (66 if small else 58)


def dashed(c, r, w, n, gap, offset=-90, skip=(), colors=None):
    """n segmentos iguais; `gap` = vão VISÍVEL em graus (compensa a ponta redonda); vãos centrados em offset + k·360/n."""
    cap = math.degrees((w / 2) / r)
    step = 360 / n
    out = ""
    for k in range(n):
        if k in skip:
            continue
        a0 = offset + k * step + gap / 2 + cap
        a1 = offset + (k + 1) * step - gap / 2 - cap
        out += arc(colors[k % len(colors)] if colors else c, r, a0, a1, w)
    return out


def dashes_list(c, r, w, spans):
    cap = math.degrees((w / 2) / r)
    return "".join(arc(c, r, a + cap, b - cap, w) for a, b in spans)


# ------------------------------------------------------------------ ponto de partida (prints 1·3 e 5·9)
def k_disco_rosa(t, s=False):
    if t == "tile":
        return star(WHITE, 92)
    return disc({"color": PINK, "dark": PINK, "mono": INK}[t], 126) + star(WHITE, 66)


def k_circulo(t, s=False):
    c = {"color": PINK, "dark": PINK, "tile": WHITE, "mono": INK}[t]
    return f'<g transform="scale(2.56)">{_logos.mark_inner(c, c)}</g>'


# ------------------------------------------------------------------ anel tracejado (pedido: tracejado + mais grosso)
def k_cinco(t, s=False, w=None):
    """5 segmentos; cada vão aponta para uma ponta da estrela."""
    rc, ac = cols(t)
    w, r, R = dims(s, w)
    return dashed(rc, r, w, 5, 16 if not s else 20, offset=-90) + star(ac, R)


def k_oito(t, s=False):
    """8 segmentos iguais: o anel de quem postou vários stories."""
    rc, ac = cols(t)
    w, r, R = dims(s)
    n = 8 if not s else 6
    return dashed(rc, r, w, n, 10 if not s else 16, offset=-90) + star(ac, R)


def k_add(t, s=False):
    """“Adicionar ao Close” (prints 6·7): arco longo + traços curtos, estrela no lugar do +."""
    rc, ac = cols(t)
    w, r, R = dims(s)
    spans = [(-70, 118), (134, 160), (176, 202), (218, 244), (260, 276)] if not s else [(-70, 120), (142, 186), (206, 250), (266, 280)]
    return dashes_list(rc, r, w, spans) + star(ac if t != "color" else INK, R)


def k_novos(t, s=False):
    """Visto × novo (print 8): metade cheia roxa, metade em segmentos rosa."""
    rc, ac = cols(t)
    w, r, R = dims(s)
    full = {"color": PURPLE, "dark": WHITE, "tile": WHITE, "mono": INK}[t]
    body = dashes_list(full, r, w, [(-85, 85)])
    segs = [(95, 127), (137, 169), (179, 211), (221, 253)] if not s else [(95, 145), (159, 209), (223, 265)]
    body += dashes_list(rc, r, w, segs)
    return body + star({"color": PINK, "dark": PINK, "tile": WHITE, "mono": INK}[t], R)


def k_bicolor(t, s=False):
    """Segmentos alternando rosa e roxo — cor sólida, sem gradiente."""
    rc, ac = cols(t)
    w, r, R = dims(s)
    colors = {"color": [PINK, PURPLE], "dark": [PINK, WHITE], "tile": [WHITE], "mono": [INK]}[t]
    star_c = {"color": PINK, "dark": PINK, "tile": WHITE, "mono": INK}[t]
    return dashed(rc, r, w, 6, 12 if not s else 18, offset=-90, colors=colors) + star(star_c, R)


def k_rosa(t, s=False):
    """Um rosa só, bem usado: tracejado e estrela no mesmo Pink Clozzy."""
    rc, _ = cols(t)
    w, r, R = dims(s)
    return dashed(rc, r, w, 5, 16 if not s else 20, offset=-90) + star(rc, R + 4)


def k_c_tracejado(t, s=False):
    """O C do Círculo próximo feito de segmentos de story."""
    rc, ac = cols(t)
    w, r, R = dims(s)
    spans = [(12, 84), (96, 168), (180, 252), (264, 316)] if not s else [(14, 120), (134, 240), (254, 316)]
    return dashes_list(rc, r, w, spans) + star(ac, R + 6, cx=122)


def k_disco_tracejado(t, s=False):
    """O disco rosa da v1 (print 3) dentro do anel tracejado."""
    rc, _ = cols(t)
    w, r, _R = dims(s)
    dr = r - w / 2 - (12 if not s else 14)
    if t == "color":
        rc = PURPLE
    dc, sc = {"color": (PINK, WHITE), "dark": (PINK, WHITE), "tile": (WHITE, PINK), "mono": (INK, WHITE)}[t]
    return dashed(rc, r, w, 5, 18 if not s else 22, offset=-90) + disc(dc, dr) + star(sc, dr * 0.58)


def k_selo(t, s=False):
    """Avatar com selo: anel tracejado + badge de estrela (o componente do app vira o logo)."""
    rc, _ = cols(t)
    w, r, _R = dims(s)
    r = r - 4
    bx, by = P(45, r)
    br = 46 if not s else 54
    dc, sc = {"color": (PURPLE, WHITE), "dark": (PURPLE, WHITE), "tile": (WHITE, PINK), "mono": (INK, WHITE)}[t]
    return (dashed(rc, r, w, 6, 14 if not s else 18, offset=-75, skip=(1,)) + disc(dc, br, bx, by)
            + star(sc, br * 0.62, bx, by + 1.5) + star(rc if t != "color" else PINK, 42 if not s else 52, 118, 121))


def k_aberto(t, s=False):
    """Close aberto: o tracejado se abre e a estrela escapa pela abertura."""
    rc, ac = cols(t)
    w, r, R = dims(s)
    r = 118 - w / 2
    spans = [(-14, 50), (64, 128), (142, 206), (220, 284)] if not s else [(-14, 80), (96, 190), (206, 284)]
    sx, sy = P(-45, r - 4)
    return dashes_list(rc, r, w, spans) + star(ac, 54 if not s else 64, sx + 6, sy - 4, rot=-90 + 12)


CONCEPTS = [
    # slug, nome, ingrediente, ideia, +, −, fn, prints de referência
    ("00a-disco-rosa", "Disco rosa (v1)", "ponto de partida", "O mark do app performer: disco Pink Clozzy e estrela branca.",
     "É o equity atual e o que você marcou nos prints 1 e 3.", "Estrela em disco é genérica (favoritos/avaliação).", k_disco_rosa, "1 · 3"),
    ("00b-circulo", "Círculo próximo (r1)", "ponto de partida", "C aberto de clozzy guardando a estrela.",
     "Próprio e marcado por você (prints 5 e 9).", "Sem o tracejado, não fala de story.", k_circulo, "5 · 9"),
    ("01-cinco", "5 pontas", "5 segmentos", "O anel quebrado em 5 stories, com um vão apontando para cada ponta da estrela.",
     "Geometria amarrada à estrela; lê como story na hora.", "Os vãos precisam de precisão em tamanho pequeno.", k_cinco, "8"),
    ("02-oito", "Vários stories", "8 segmentos", "Segmentos iguais, como o anel de quem postou vários stories.",
     "O mais “Instagram” de todos, por isso o mais fácil de ler.", "O mais genérico: é preciso a estrela para ser Clozzy.", k_oito, "8"),
    ("03-add", "Adicionar ao Close", "arco + traços", "O botão de novo story (prints 6 e 7) com a estrela no lugar do +.",
     "Gesto conhecido: entrar e adicionar.", "Perto do ícone do Instagram; o ritmo dos traços precisa ser próprio.", k_add, "6 · 7"),
    ("04-novos", "Visto × novo", "meio cheio, meio tracejado", "Metade roxa cheia (já viu) e metade rosa em segmentos (tem novidade).",
     "Conta uma história e usa as duas cores sem gradiente.", "Pode ler como “carregando”.", k_novos, "8"),
    ("05-bicolor", "Rosa e roxo", "6 segmentos bicolor", "Segmentos alternando rosa e roxo: a resposta sem gradiente ao anel colorido do print 8.",
     "Rosa + roxo no mesmo símbolo, sem degradê.", "Rosa e roxo lado a lado vibram; não usar com texto.", k_bicolor, "8 · 10"),
    ("06-rosa", "Um rosa só", "tracejado + estrela rosa", "Tracejado e estrela no mesmo Pink Clozzy: “um rosa só, bem usado”.",
     "Máximo de reconhecimento com o rosa do app; simples.", "Perde o roxo da v1.", k_rosa, "10 · 3"),
    ("07-c-tracejado", "C tracejado", "C + segmentos", "O C do Círculo próximo feito de segmentos de story.",
     "Junta os dois favoritos: o C e o story.", "Tracejado e abertura ao mesmo tempo: mais complexo.", k_c_tracejado, "5 · 6"),
    ("08-disco-tracejado", "Disco no story", "v1 + anel tracejado", "O disco rosa da v1 dentro do anel tracejado roxo.",
     "Continuidade direta com o app atual.", "Duas camadas grossas: pesado no ícone.", k_disco_tracejado, "3 · 8"),
    ("09-selo", "Selo do Close", "tracejado + badge", "O avatar com selo: anel tracejado e badge de estrela.",
     "O logo é o próprio componente do app.", "O centro vazio pede contexto.", k_selo, "8"),
    ("10-aberto", "Close aberto", "tracejado + estrela saindo", "O tracejado se abre e a estrela escapa: liberou.",
     "Pronto para animação (assinou, abriu).", "Assimétrico; parece o Cometa da r2.", k_aberto, "5"),
]


def svg(body, w=256, h=256, title="Clozzy"):
    return R2.svg(body, w, h, title)


def app_icon(fn, kind="pink"):
    if kind == "pink":
        return (f'<rect width="256" height="256" rx="58" fill="{PINK}"/>'
                f'<g transform="translate(44 44) scale(.656)">{fn("tile")}</g>')
    return (f'<rect width="256" height="256" rx="58" fill="{INK}"/>'
            f'<g transform="translate(44 44) scale(.656)">{fn("dark")}</g>')


_WM = None


def wordmark():
    global _WM
    if _WM is None:
        _WM = _logos.wordmark_paths()
    return _WM


def lockup(body, word=INK):
    return R2.lockup(lambda _c: body, None, word)


def wordmark_o_story(word=INK, rc=PINK, ac=PURPLE):
    """“clozzy” em Gabarito com o o virando o Story."""
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    font = _logos.load_font()
    gs, cmap, hmtx = font.getGlyphSet(), font.getBestCmap(), font["hmtx"]
    s = 1000 / font["head"].unitsPerEm
    _, _, asc, xh, _ = wordmark()
    x, out = 0.0, ""
    for ch in "clozzy":
        g = cmap[ord(ch)]
        adv = hmtx[g][0] * s
        if ch == "o":
            d = xh * 1.04
            sc = d / 256
            cx, cy = x + adv / 2, asc - xh / 2
            body = dashed(rc, 112, 32, 5, 18) + star(ac, 64)
            out += f'<g transform="translate({f(cx - 128 * sc)} {f(cy - 128 * sc)}) scale({f(sc)})">{body}</g>'
        else:
            pen = SVGPathPen(gs)
            gs[g].draw(TransformPen(pen, (s, 0, 0, -s, x, asc)))
            out += f'<path d="{pen.getCommands()}" fill="{word}"/>'
        x += adv + _logos.TRACK
    return out, x - _logos.TRACK, asc + 190


def build():
    for slug, name, *_r, fn, _ref in CONCEPTS:
        for t in THEMES:
            (OUT / f"{slug}-{t}.svg").write_text(svg(fn(t), title=f"Clozzy — {name}"))
        (OUT / f"{slug}-16.svg").write_text(svg(fn("color", True), title=f"Clozzy — {name} 16px"))
        (OUT / f"{slug}-16-dark.svg").write_text(svg(fn("dark", True), title=f"Clozzy — {name} 16px"))
        (OUT / f"{slug}-app-pink.svg").write_text(svg(app_icon(fn, "pink"), title=f"Clozzy — {name} app"))
        (OUT / f"{slug}-app-ink.svg").write_text(svg(app_icon(fn, "ink"), title=f"Clozzy — {name} app"))
        (OUT / f"{slug}-lockup.svg").write_text(lockup(fn("color"), INK))
        (OUT / f"{slug}-lockup-dark.svg").write_text(lockup(fn("dark"), WHITE))
    for t, (w, rc, ac) in {"color": (INK, PINK, PURPLE), "dark": (WHITE, PINK, WHITE), "pink": (WHITE, WHITE, WHITE)}.items():
        body, ww, hh = wordmark_o_story(w, rc, ac)
        (OUT / f"13-o-story-wordmark-{t}.svg").write_text(R2.svg(body, ww, hh, "clozzy"))


if __name__ == "__main__":
    build()
    print("ok", len(CONCEPTS))

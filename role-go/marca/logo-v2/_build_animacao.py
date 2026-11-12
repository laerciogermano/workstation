#!/usr/bin/env python3
"""Animação da logo RoleGo (animacao/): o pin sai de dentro do G, faz um arco e pousa no lugar do “o”.

Regras (05-identidade-visual · brand-motion): sem squash/stretch nem rotação livre, sem overshoot na
geometria, ease “emphasized”, último quadro = logo estática, prefers-reduced-motion = logo estática.
Saídas: rolego-logo-animado.svg, rolego-icone-animado.svg, rolego-loading.svg
"""
import os, re
import _build_conceitos as B
from _build_conceitos import Shape, glyph, pin_o, path_d, bounds, TAN, O_CY, PIN_CY, O_R

OUT = os.path.join(B.HERE, "animacao")
os.makedirs(OUT, exist_ok=True)
DARK, WHITE, CYAN = B.DARK, B.WHITE, B.CYAN

# tempos (ms) — tokens
EMPH = "cubic-bezier(.2,0,0,1)"      # ease-emphasized / settle
ENTER = "cubic-bezier(0,0,.2,1)"     # ease-decelerate
UP = "cubic-bezier(.2,.6,.35,1)"     # subida do arco (desacelera no topo)
DOWN = "cubic-bezier(.55,0,.75,.4)"  # descida do arco (acelera até pousar)
T_PIN0, T_PIN = 420, 640             # pin: início e duração
T_LAND = T_PIN0 + T_PIN              # 1060 ms: pousa
T_TOTAL = 1700                        # depois disso: logo estática


def word_parts():
    """Role (4 letras), G e pin separados, em unidades da fonte."""
    role, cur = [], 0.0
    for ch in "Role":
        s, w = glyph(ch, cur)
        role.append(s)
        cur += w + B.TRACK
    g, gw = glyph("G", cur)
    gx = cur
    cur += gw + B.TRACK + 70
    cx = cur + 317.5 - O_CY * TAN
    return role, g, gx, pin_o(cx, dot_r=0), cx


def fit(parts, W, H, pad):
    x0, y0, x1, y1 = bounds([(p, "") for p in parts])
    s = min((W - 2 * pad) / (x1 - x0), (H - 2 * pad) / (y1 - y0))
    tx = (W - (x1 - x0) * s) / 2 - x0 * s
    ty = (H - (y1 - y0) * s) / 2 + y1 * s
    return s, tx, ty


def css(pin_from, head, tip, s, loop=False):
    dx, dy = pin_from[0] - head[0], pin_from[1] - head[1]
    peak = -0.55 * s * 288  # quanto o arco sobe acima do ponto final (unidades do SVG)
    hx, hy = head
    rx, ry = tip
    delay_r = T_LAND - 40
    it = "infinite" if loop else "1"
    base = f"""
.ro,.gg{{animation:rise 420ms {ENTER} both}}
.gg{{animation-delay:120ms}}
.px{{animation:px {T_PIN}ms {EMPH} {T_PIN0}ms both}}
.py{{animation:py {T_PIN}ms linear {T_PIN0}ms both}}
.ps{{transform-box:view-box;transform-origin:{hx:.1f}px {hy:.1f}px;animation:ps {T_PIN}ms {EMPH} {T_PIN0}ms both}}
.rp{{transform-box:view-box;transform-origin:{rx:.1f}px {ry:.1f}px;opacity:0;animation:rp 700ms {ENTER} {delay_r}ms both}}
.rp2{{animation-delay:{delay_r + 160}ms}}
@keyframes rise{{from{{opacity:0;transform:translateY(14px)}}to{{opacity:1;transform:none}}}}
@keyframes px{{from{{transform:translateX({dx:.1f}px)}}to{{transform:none}}}}
@keyframes py{{0%{{transform:translateY({dy:.1f}px);animation-timing-function:{UP}}}
55%{{transform:translateY({peak:.1f}px);animation-timing-function:{DOWN}}}100%{{transform:none}}}}
@keyframes ps{{0%{{transform:scale(.18);opacity:0}}18%{{opacity:1}}100%{{transform:none;opacity:1}}}}
@keyframes rp{{0%{{opacity:0;transform:scale(.25)}}8%{{opacity:.9}}100%{{opacity:0;transform:scale(1.5)}}}}
@media (prefers-reduced-motion:reduce){{*{{animation:none!important}}}}"""
    if loop:  # loading: o pin sobe e pousa em loop, com a onda a cada pouso (sem o wordmark)
        base = f"""
.py{{animation:hop 1400ms infinite}}
.rp{{transform-box:view-box;transform-origin:{rx:.1f}px {ry:.1f}px;opacity:0;animation:rp 1400ms {ENTER} infinite}}
.rp2{{animation-delay:180ms}}
@keyframes hop{{0%{{transform:none;animation-timing-function:{UP}}}35%{{transform:translateY({peak*0.6:.1f}px);animation-timing-function:{DOWN}}}60%,100%{{transform:none}}}}
@keyframes rp{{0%,55%{{opacity:0;transform:scale(.25)}}60%{{opacity:.9;transform:scale(.25)}}100%{{opacity:0;transform:scale(1.5)}}}}
@media (prefers-reduced-motion:reduce){{*{{animation:none!important}}.rp{{opacity:0}}}}"""
    return base


TOK = re.compile(r"(?<![\w-])(ro|gg|px|py|ps|rp2|rp|rise|hop)(?![\w-])")


def scope(svg, p):
    """Prefixa classes e keyframes para várias animações conviverem inline na mesma página."""
    st0, st1 = svg.index("<style>"), svg.index("</style>")
    style = TOK.sub(lambda m: f"{p}-{m.group(1)}", svg[st0:st1])
    rest = re.sub(r'class="([^"]+)"', lambda m: 'class="%s"' % " ".join(f"{p}-{c}" for c in m.group(1).split()), svg[st1:])
    return svg[:st0] + style + rest


def build(name, W, H, pad, with_role, tile=None, loop=False, title="RoleGo", p="x"):
    role, g, gx, pin, cx = word_parts()
    parts = (role if with_role else []) + [g, pin]
    if loop:
        parts = [pin]
    s, tx, ty = fit(parts, W, H, pad)
    X = lambda x, y: (x + y * TAN) * s + tx   # unidades desinclinadas -> SVG
    Y = lambda y: -y * s + ty
    head = (X(cx, PIN_CY), Y(PIN_CY))
    tip_u = (cx, PIN_CY - 510)
    tip = (X(*tip_u), Y(tip_u[1]))
    start = ((gx + 650) * s + tx, Y(330))      # ponto da barra do G (já inclinado)
    d = lambda sh: path_d(sh, s, tx, ty)
    rx, ry = 0.8 * O_R * s, 0.2 * O_R * s
    sw = 0.06 * O_R * s
    body = ""
    if tile:
        body += f'<rect width="{W}" height="{H}" rx="{tile}" fill="{DARK}"/>'
    ripple = (f'<ellipse class="rp" cx="{tip[0]:.1f}" cy="{tip[1]:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" fill="none" stroke="{CYAN}" stroke-width="{sw:.1f}"/>'
              f'<ellipse class="rp rp2" cx="{tip[0]:.1f}" cy="{tip[1]:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" fill="none" stroke="{WHITE}" stroke-width="{sw*0.7:.1f}"/>')
    pin_g = f'<g class="px"><g class="py"><g class="ps"><path fill="{CYAN}" fill-rule="evenodd" d="{d(pin)}"/></g></g></g>'
    if loop:
        body += ripple + pin_g
    else:
        # pin desenhado ANTES do G: nasce escondido atrás do G e sai de dentro dele
        body += ripple + pin_g
        if with_role:
            body += f'<g class="ro"><path fill="{WHITE}" d="{" ".join(d(r) for r in role)}"/></g>'
        body += f'<g class="gg"><path fill="{CYAN}" d="{d(g)}"/></g>'
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="{title}">'
           f'<title>{title}</title><style>{css(start, head, tip, s, loop)}</style>{body}</svg>')
    svg = scope(svg, p)
    open(os.path.join(OUT, name), "w").write(svg)
    return svg


def main():
    build("rolego-logo-animado.svg", 900, 300, 40, with_role=True, p="rgl")
    build("rolego-icone-animado.svg", 256, 256, 46, with_role=False, tile=58, p="rgi")
    build("rolego-loading.svg", 256, 256, 70, with_role=False, tile=58, loop=True, title="Carregando", p="rgw")
    print("ok", os.listdir(OUT))


if __name__ == "__main__":
    main()


# ---------- página de demonstração (animacao/index.html) ----------
FRAMES = [0, 250, 500, 700, 900, 1060, 1300, 1900]


def demo():
    L = open(os.path.join(OUT, "rolego-logo-animado.svg")).read()
    I = open(os.path.join(OUT, "rolego-icone-animado.svg")).read()
    W = open(os.path.join(OUT, "rolego-loading.svg")).read()
    fr = lambda svg, kind: "".join(
        f'<figure class="fr {kind}" data-t="{t}">{svg}<figcaption>{t} ms</figcaption></figure>' for t in FRAMES)
    html = f"""<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>RoleGo | Animação da logo</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,600;0,800;1,800&display=swap" rel="stylesheet">
<style>*{{box-sizing:border-box;margin:0}}body{{background:{DARK};color:#fff;font:14px/1.5 Poppins,system-ui,sans-serif;padding:40px}}
h1{{font:italic 800 34px Poppins;letter-spacing:-.02em}}h2{{font:italic 800 20px Poppins;margin:36px 0 12px}}p{{color:#A6A9B8;max-width:760px}}
.live{{display:flex;gap:28px;align-items:center;margin-top:24px;flex-wrap:wrap}}.live .lg svg{{width:620px;height:auto}}.live .ic svg{{width:180px;height:180px}}
button{{font:600 13px Poppins;background:{CYAN};color:{DARK};border:0;border-radius:99px;padding:9px 18px;cursor:pointer}}
.strip{{display:grid;grid-template-columns:repeat(8,1fr);gap:10px}}.fr{{background:#0F0F13;border:1px solid #1E1E25;border-radius:12px;padding:8px;margin:0}}
.fr svg{{width:100%;height:auto;display:block}}figcaption{{font-size:11px;color:#7C8090;margin-top:4px}}
table{{border-collapse:collapse;margin-top:8px}}td,th{{text-align:left;padding:6px 14px 6px 0;border-bottom:1px solid #1E1E25;vertical-align:top}}th{{color:#7C8090;font-weight:600}}
code{{color:{CYAN}}}</style></head><body>
<h1>Role<span style="color:{CYAN}">Go</span> · animação da logo</h1>
<p>O G dá a saída e o pin chega: o pin nasce dentro do G, faz um arco e pousa no lugar do “o”. Ao tocar o chão, uma onda de localização se abre e some. O último quadro é a logo estática.</p>
<div class="live"><div class="lg" id="L">{L}</div><div class="ic" id="I">{I}</div><div class="ic">{W}</div>
<button onclick="replay()">Repetir ▶</button></div>
<h2>Storyboard · logo</h2><div class="strip">{fr(L, "fl")}</div>
<h2>Storyboard · ícone</h2><div class="strip">{fr(I, "fi")}</div>
<h2>Especificação</h2><table>
<tr><th>Duração</th><td>~1,7 s, uma vez (splash, abertura de vídeo, site). Depois disso, estática.</td></tr>
<tr><th>0–540 ms</th><td>“Role” e “G” sobem 14 px e aparecem (<code>ease-decelerate</code>, G 120 ms depois)</td></tr>
<tr><th>420–1060 ms</th><td>Pin: sai da barra do G (escala 0,18 → 1), arco para cima e pousa (<code>ease-emphasized</code>; subida desacelera, descida acelera)</td></tr>
<tr><th>1020–1880 ms</th><td>Duas ondas na ponta do pin (ciano, depois branca), escala 0,25 → 1,5 e somem</td></tr>
<tr><th>Loading</th><td>Só o pin: pula e pousa a cada 1,4 s com a onda (<code>rolego-loading.svg</code>)</td></tr>
<tr><th>Reduzir movimento</th><td><code>prefers-reduced-motion</code> mostra a logo estática</td></tr>
<tr><th>Nunca</th><td>Esticar/achatar a logo, girar, quicar, trocar cor fora da paleta, animar a cada aparição</td></tr></table>
<script>
function seek(root,t){{root.getAnimations({{subtree:true}}).forEach(a=>{{a.pause();a.currentTime=t;}});}}
document.querySelectorAll('.fr').forEach(f=>seek(f.querySelector('svg'),+f.dataset.t));
function replay(){{['L','I'].forEach(id=>document.getElementById(id).getAnimations({{subtree:true}}).forEach(a=>{{a.currentTime=0;a.play();}}));}}
</script></body></html>"""
    open(os.path.join(OUT, "index.html"), "w").write(html)


if __name__ == "__main__":
    demo()

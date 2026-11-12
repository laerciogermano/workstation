#!/usr/bin/env python3
"""Logo v4 — mesma geometria do L1 (logo-v2/ligadura) com três ajustes pedidos em 08/11/2026:
1. circunflexo no “e”: Rolê;
2. o Go do nome é sempre o símbolo Go (no empilhado, o “Go” em texto sai e entra o lockup Rolê + símbolo);
3. sem letras roxas no preto: no escuro “Rolê” branco e Go em ciano → azul;
4. “Rolê” e “Go” sempre em cores separadas;
5. estilo principal = superfície roxa (gradiente do ícone B do v3) com a marca em branco; no roxo, Go em ciano.
Lê os paths do v2 e só acrescenta o acento, recompõe o empilhado e troca cores."""
import os, re

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "logo-v2", "ligadura")
WHITE, INK, BG = "#FFFFFF", "#05070F", "#000000"
GO_DARK = ["#00E5E5", "#3B82F6"]     # ciano → azul, sobre preto
GO_LIGHT = ["#9E19E9", "#6539CB", "#452EFF"]  # roxo do ícone B, sobre claro
PURPLE = ["#9E19E9", "#6539CB", "#452EFF"]    # superfície roxa (ícone B do v3)
CYAN = "#00E5E5"                              # Go sobre o roxo
SLANT = 34.81 / 196.30               # inclinação do itálico, medida na haste do R


def read(name):
    s = open(os.path.join(SRC, name)).read()
    vb = re.search(r'viewBox="([^"]+)"', s).group(1)
    paths = re.findall(r'<path fill="([^"]+)" fill-rule="evenodd" d="([^"]+)"', s)
    rect = re.search(r'<rect [^>]*rx="([^"]+)"', s)
    return vb, paths, (rect.group(1) if rect else None)


def circumflex(cx=538.0, cy=152.0, top=14.0, h=44.0, half=58.0, inner=25.0, th=21.0):
    """Acento circunflexo sobre o “e”, cisalhado no mesmo itálico das letras."""
    pts = [(-half, h), (-15, 0), (15, 0), (half, h), (inner, h), (0, th), (-inner, h)]
    out = []
    for x, y in pts:
        ya = top + y
        out.append(f"{cx + x + SLANT * (cy - ya):.2f} {ya:.2f}")
    return "M" + "L".join(out) + "Z"


def grad(gid, stops, x1, y1, x2, y2):
    st = "".join(f'<stop offset="{i / (len(stops) - 1):.2f}" stop-color="{c}"/>' for i, c in enumerate(stops))
    return f'<linearGradient id="{gid}" gradientUnits="userSpaceOnUse" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">{st}</linearGradient>'


def svg(vb, defs, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="RolêGo"><title>RolêGo</title>'
            f'<defs>{defs}</defs>{body}</svg>')


def path(fill, d):
    return f'<path fill="{fill}" fill-rule="evenodd" d="{d}"/>'


def write(name, s):
    open(os.path.join(HERE, name), "w").write(s)


def main():
    lock_vb, lock, _ = read("l1-lockup-color.svg")
    go_vb, go, _ = read("l1-go-color.svg")
    role_d = [d for f, d in lock if f == "#FFFFFF"][0] + circumflex()
    golock_d = [d for f, d in lock if f != "#FFFFFF"][0]
    go_d = go[0][1]

    # lockup Rolê + Go: bbox ~ x 24..965, y 14..232
    def lockup(role_fill, go_fill, defs=""):
        return svg(lock_vb, defs, path(role_fill, role_d) + path(go_fill, golock_d))

    def go_only(fill, defs=""):
        return svg(go_vb, defs, path(fill, go_d))

    # empilhado: símbolo em cima, lockup embaixo (o Go do nome também é o símbolo)
    def stacked(role_fill, go_fill, stops, sym_fill=None):
        W, pad = 348, 24
        s_go = 200 / 208.0; gx = (W - 200) / 2 - 24 * s_go; gy = pad - 60.9 * s_go
        s_lk = 300 / 941.0; lx = (W - 300) / 2 - 24 * s_lk; ly = pad + 126.1 * s_go + 22 - 14 * s_lk
        H = ly + 232 * s_lk + pad
        defs = grad("gs", stops, 24, 61, 232, 187) + grad("gl", stops, 629, 28, 965, 232) if stops else ""
        gf = sym_fill or ("url(#gs)" if stops else go_fill)
        lf = "url(#gl)" if stops else go_fill
        body = (f'<g transform="translate({gx:.2f} {gy:.2f}) scale({s_go:.4f})">{path(gf, go_d)}</g>'
                f'<g transform="translate({lx:.2f} {ly:.2f}) scale({s_lk:.4f})">{path(role_fill, role_d)}{path(lf, golock_d)}</g>')
        return svg(f"0 0 {W} {H:.0f}", defs, body)

    for suf, stops, role_c in (("dark", GO_DARK, WHITE), ("light", GO_LIGHT, INK)):
        write(f"v4-lockup-{suf}.svg", lockup(role_c, "url(#g)", grad("g", stops, 629, 28, 965, 232)))
        write(f"v4-go-{suf}.svg", go_only("url(#g)", grad("g", stops, 24, 61, 232, 187)))
        write(f"v4-stacked-{suf}.svg", stacked(role_c, None, stops))
    # sobre o roxo: Rolê branco, Go ciano (cores separadas)
    write("v4-lockup-purple.svg", lockup(WHITE, CYAN))
    write("v4-stacked-purple.svg", stacked(WHITE, CYAN, None, sym_fill=WHITE))  # símbolo branco, como no ícone
    for name, c in (("white", WHITE), ("ink", INK)):
        write(f"v4-lockup-{name}.svg", lockup(c, c))
        write(f"v4-go-{name}.svg", go_only(c))

    # ícones: roxo + Go branco (principal); preto + Go ciano → azul (escuro)
    for name, src in (("icon-app", "icon-app.svg"), ("icon-avatar", "icon-avatar.svg"), ("icon-fav", "icon-fav.svg")):
        vb, p, rx = read(src)
        write(f"v4-{name}.svg", svg(vb, grad("i", PURPLE, 0, 0, 256, 256),
                                    f'<rect width="256" height="256" rx="{rx}" fill="url(#i)"/>' + path(WHITE, p[0][1])))
        write(f"v4-{name}-dark.svg", svg(vb, grad("d", GO_DARK, 24, 61, 232, 187),
                                         f'<rect width="256" height="256" rx="{rx}" fill="{BG}"/>' + path("url(#d)", p[0][1])))
    print("ok", len([f for f in os.listdir(HERE) if f.endswith(".svg")]), "svgs")


if __name__ == "__main__":
    main()

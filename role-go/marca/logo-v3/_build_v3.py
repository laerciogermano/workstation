#!/usr/bin/env python3
"""Logo v3 — mesma geometria do L1 “ligadura na base” (logo-v2/ligadura), só com as cores do projeto original
(banners de epics.pdf + identidade-visual.md): gradiente magenta → violeta → azul/ciano, ícone roxo → azul.
Não redesenha nada: lê os paths dos SVGs do v2 e troca só o preenchimento."""
import os, re

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "logo-v2", "ligadura")
OUT = HERE
WHITE, INK, BG = "#FFFFFF", "#05070F", "#04050B"

# Direções de cor (todas do material original)
DIR = {
    "a": dict(nome="Neon do banner", stops=["#E23DF5", "#8749FF", "#00C8FF"],
              light=["#C21FD6", "#6539CB", "#2563EB"],
              ideia="O RoleGo inteiro no gradiente dos banners dos épicos (magenta → violeta → ciano), como no topo de epics.pdf."),
    "b": dict(nome="Roxo → azul", stops=["#A24BFF", "#7A4DFF", "#3B82F6"],
              light=["#8749FF", "#6539CB", "#452EFF"],
              ideia="O gradiente primário do manual (roxo → azul), clareado no preto para não apagar, como no banner do E04."),
    "c": dict(nome="Role branco + Go neon", stops=["#C04BFF", "#8749FF", "#00E5E5"],
              light=["#9E19E9", "#6539CB", "#2563EB"], split=True,
              ideia="“Role” branco e só o Go (G + pin) no gradiente violeta → ciano: o símbolo carrega a cor, o nome fica limpo."),
}


def read(name):
    s = open(os.path.join(SRC, name)).read()
    vb = re.search(r'viewBox="([^"]+)"', s).group(1)
    paths = re.findall(r'<path fill="([^"]+)" fill-rule="evenodd" d="([^"]+)"', s)
    rect = re.search(r'<rect [^>]*rx="([^"]+)"', s)
    return vb, paths, (rect.group(1) if rect else None)


def grad(gid, stops, vb, diag=False):
    _, _, w, h = map(float, vb.split())
    x2, y2 = (w, h) if diag else (w, 0)
    st = "".join(f'<stop offset="{i / (len(stops) - 1):.2f}" stop-color="{c}"/>' for i, c in enumerate(stops))
    return (f'<linearGradient id="{gid}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="{x2:.0f}" y2="{y2:.0f}">{st}</linearGradient>')


def svg(vb, defs, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="RoleGo"><title>RoleGo</title>'
            f'<defs>{defs}</defs>{body}</svg>')


def path(fill, d):
    return f'<path fill="{fill}" fill-rule="evenodd" d="{d}"/>'


def write(name, s):
    open(os.path.join(OUT, name), "w").write(s)


def main():
    lock_vb, lock, _ = read("l1-lockup-color.svg")    # [(#FFF, Role), (#00E5E5, Go)]
    go_vb, go, _ = read("l1-go-color.svg")
    stk_vb, stk, _ = read("l1-stacked-color.svg")      # [(#00E5E5, Go), (#FFF, RoleGo)]
    role_d = [d for f, d in lock if f == "#FFFFFF"][0]
    golock_d = [d for f, d in lock if f != "#FFFFFF"][0]
    stk_go = [d for f, d in stk if f != "#FFFFFF"][0]
    stk_wm = [d for f, d in stk if f == "#FFFFFF"][0]
    for k, v in DIR.items():
        for suf, stops, role_c in (("color", v["stops"], WHITE), ("light", v["light"], INK)):
            gid = f"g{k}{suf}"
            g = f"url(#{gid})"
            # lockup horizontal
            role_fill = role_c if v.get("split") else g
            write(f"v3{k}-lockup-{suf}.svg", svg(lock_vb, grad(gid, stops, lock_vb), path(role_fill, role_d) + path(g, golock_d)))
            # símbolo Go
            write(f"v3{k}-go-{suf}.svg", svg(go_vb, grad(gid, stops, go_vb, diag=True), path(g, go[0][1])))
            # empilhado
            write(f"v3{k}-stacked-{suf}.svg", svg(stk_vb, grad(gid, stops, stk_vb, diag=True),
                                                 path(g, stk_go) + path(role_fill, stk_wm)))
    # versões de uma cor (iguais ao v2: mesma geometria)
    write("v3-lockup-white.svg", svg(lock_vb, "", path(WHITE, role_d) + path(WHITE, golock_d)))
    write("v3-lockup-ink.svg", svg(lock_vb, "", path(INK, role_d) + path(INK, golock_d)))
    write("v3-go-white.svg", svg(go_vb, "", path(WHITE, go[0][1])))

    # ícones: mesma geometria dos ícones do v2, fundo no gradiente roxo → azul e Go branco
    for name, src in (("icon-app", "icon-app.svg"), ("icon-avatar", "icon-avatar.svg"), ("icon-fav", "icon-fav.svg")):
        vb, p, rx = read(src)
        for k, stops in (("a", DIR["a"]["stops"]), ("b", ["#9E19E9", "#6539CB", "#452EFF"])):
            gid = f"i{k}"
            bg = f'<rect width="256" height="256" rx="{rx}" fill="url(#{gid})"/>'
            write(f"v3{k}-{name}.svg", svg(vb, grad(gid, stops, vb, diag=True), bg + path(WHITE, p[0][1])))
    # ícone escuro: fundo preto, Go no gradiente (para app em modo escuro / redes)
    vb, p, rx = read("icon-app-dark.svg")
    for k in ("a", "c"):
        gid = f"d{k}"
        write(f"v3{k}-icon-app-dark.svg", svg(vb, grad(gid, DIR[k]["stops"], vb, diag=True),
                                             f'<rect width="256" height="256" rx="{rx}" fill="{BG}"/>' + path(f"url(#{gid})", p[0][1])))
    print("ok", len([f for f in os.listdir(OUT) if f.endswith(".svg")]), "svgs")


if __name__ == "__main__":
    main()

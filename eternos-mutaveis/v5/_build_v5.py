#!/usr/bin/env python3
"""Eternos Mutáveis — versão 5.0.

v5 = texto da 3.0 (../v3/capitulo-N.md) + acréscimos da 4.0 (../v4/acrescimos.py, SEM as epígrafes do autor)
+ mudanças da 5.0 (mudancas.py): obras de arte existentes no lugar dos banners gerados (../assets/obras-v5/),
trechos que liam os banners reescritos para as obras, e frases dos threads diluídas no texto, sem citação.
Gera v5/capitulo-1..7.md, v5/eternos-mutaveis-v5.html e, com --pdf, o PDF.

Uso: PYTHONPATH=<dir com markdown> python3 v5/_build_v5.py [--pdf]   (depois: python3 livro/_build_livro.py v5)
"""
import os, re, sys, subprocess
V5 = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(V5)
sys.path.insert(0, V5)
from mudancas import OBRAS, OPS as OPS5
from estilo import OPS as OPS_ESTILO
sys.path.insert(0, os.path.join(ROOT, "v4"))
from acrescimos import OPS as OPS4
from _build_v4 import extra as _extra4, CSS4
sys.path.insert(0, os.path.join(ROOT, "v3"))
from _build_v3 import md_to_html, TITLES
import markdown


def apply(txt, n, ops):
    for kind, c, a, b in ops:
        if c != n:
            continue
        if kind == "sub":
            assert txt.count(a) == 1, (n, a[:70], txt.count(a))
            txt = txt.replace(a, b)
        elif kind == "all":
            assert txt.count(a) >= 1, (n, a[:70])
            txt = txt.replace(a, b)
        elif kind in ("after", "line"):
            lines = txt.split("\n")
            idx = [k for k, ln in enumerate(lines) if ln.startswith(a)]
            assert len(idx) == 1, (n, kind, a[:70], len(idx))
            if kind == "after":
                lines[idx[0] + 1:idx[0] + 1] = ["", b]
            else:
                lines[idx[0]] = b
            txt = "\n".join(lines)
        elif kind == "before":
            assert txt.count("\n" + a + "\n") == 1, (n, a)
            txt = txt.replace("\n" + a + "\n", "\n" + b + "\n\n---\n\n" + a + "\n")
    return txt


def build_md(n):
    txt = open(os.path.join(ROOT, "v3", f"capitulo-{n}.md"), encoding="utf-8").read()
    txt = apply(txt, n, OPS4)
    txt = apply(txt, n, OPS5)
    alt, credit = OBRAS[n]
    lines = txt.split("\n")
    i = next(k for k, ln in enumerate(lines) if ln.startswith("![Banner do capítulo"))
    lines[i] = f"![{alt}](../assets/obras-v5/cap-{n}.jpg)\n\n*{credit}*"
    txt = re.sub(r"\n{3,}", "\n\n", "\n".join(lines))
    txt = apply(txt, n, OPS_ESTILO)
    left = [w for w in ("banner", "Banner") if w in txt]
    assert not left, (n, "ainda cita o banner")
    open(os.path.join(V5, f"capitulo-{n}.md"), "w", encoding="utf-8").write(txt)
    return txt


def extra(name):
    return markdown.markdown(open(os.path.join(V5, name), encoding="utf-8").read(), extensions=["extra", "sane_lists", "nl2br", "md_in_html"])


def main():
    secs, toc = [], []
    for n in range(1, 8):
        txt = build_md(n)
        secs.append(f'<section class="cap" id="cap{n}">\n{md_to_html(txt)}\n</section>')
        toc.append(f'<li><a href="#cap{n}">{n}. {TITLES[n]}</a></li>')
    partes = extra("abertura.md").split("<h1>")
    front = f'<section class="extra" id="dedicatoria" data-pos="front">{partes[0]}</section>\n'
    toc_front = []
    for parte in partes[1:]:
        tit = re.sub(r"<[^>]+>", "", parte.split("</h1>", 1)[0]).strip()
        sid = {"Introdução": "introducao", "Nota do autor": "nota"}.get(tit, re.sub(r"\W+", "-", tit.lower()))
        front += f'<section class="extra" id="{sid}" data-pos="front"><h1>{parte}</section>\n'
        toc_front.append(f'<li><a href="#{sid}">{tit}</a></li>')
    back = f'<section class="extra" id="apendices" data-pos="back">{extra("apendices.md")}</section>\n'
    toc = toc_front + toc + ['<li><a href="#apendices">Apêndices</a></li>']
    page = (f'<!DOCTYPE html>\n<html lang="pt-BR"><head><meta charset="utf-8"/><title>Eternos Mutáveis · 5.0</title><style>\n{CSS4}\n</style></head><body>\n'
            f'<div class="capa"><img src="../capa/v2/capa-d2-frente.jpg" alt="Capa: Eternos Mutáveis, de Laércio Germano. Peça de dominó em pé: metade de cima branca com bola preta e a palavra ETERNOS; metade de baixo preta com bola branca e a palavra MUTÁVEIS."/></div>\n'
            f'<div class="rosto"><h1>Eternos Mutáveis</h1><p>A superação adâmica</p><p>Laércio Germano</p><p>Versão 5.0</p></div>\n'
            + front +
            f'<div class="toc"><h2>Sumário</h2><ol>{"".join(toc)}</ol></div>\n' + "\n".join(secs) + "\n" + back + "</body></html>")
    out = os.path.join(V5, "eternos-mutaveis-v5.html")
    open(out, "w", encoding="utf-8").write(page)
    if "--pdf" in sys.argv:
        subprocess.run(["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
                        "--virtual-time-budget=20000", f"--print-to-pdf={os.path.join(V5, 'eternos-mutaveis-v5.pdf')}", "file://" + out],
                       check=True, stderr=subprocess.DEVNULL)
    print("ok", out)


if __name__ == "__main__":
    main()

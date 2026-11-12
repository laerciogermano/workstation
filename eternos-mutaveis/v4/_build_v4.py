#!/usr/bin/env python3
"""Eternos Mutáveis — versão 4.0.

v4 = texto da 3.0 (../v3/capitulo-N.md, que não é alterado) + acréscimos de acrescimos.py
(fora-do-livro.md, obras-a-adicionar.md, threads-instagram-mapa.md) + abertura.md (dedicatória e nota do autor)
+ apendices.md (glossário, Flow, linha do tempo, referências).
Gera v4/capitulo-1..7.md, v4/eternos-mutaveis-v4.html e, com --pdf, o PDF.

Uso: python3 v4/_build_v4.py [--pdf]   (depois: python3 livro/_build_livro.py v4)
"""
import os, re, sys, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import markdown
from acrescimos import EPI, OPS, AUTOR

V4 = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(V4)
V3 = os.path.join(ROOT, "v3")
sys.path.insert(0, V3)
from _build_v3 import md_to_html, CSS, TITLES  # mesmo HTML/CSS da 3.0


def build_md(n):
    txt = open(os.path.join(V3, f"capitulo-{n}.md"), encoding="utf-8").read()
    # epígrafe do autor logo depois da epígrafe da 3.0
    lines = txt.split("\n")
    i = next(k for k, ln in enumerate(lines) if ln.startswith("> —"))
    epi = "\n".join("> " + x for x in EPI[n].split("\n"))
    lines[i + 1:i + 1] = ["", epi, f"> — {AUTOR}"]
    txt = "\n".join(lines)
    for kind, c, a, b in OPS:
        if c != n:
            continue
        if kind == "sub":
            assert txt.count(a) == 1, (n, a[:60], txt.count(a))
            txt = txt.replace(a, b)
        elif kind == "after":
            lines = txt.split("\n")
            idx = [k for k, ln in enumerate(lines) if ln.startswith(a)]
            assert len(idx) == 1, (n, a, len(idx))
            lines[idx[0] + 1:idx[0] + 1] = ["", b]
            txt = "\n".join(lines)
        elif kind == "before":
            assert txt.count("\n" + a + "\n") == 1, (n, a)
            txt = txt.replace("\n" + a + "\n", "\n" + b + "\n\n---\n\n" + a + "\n")
    txt = re.sub(r"\n{3,}", "\n\n", txt)
    open(os.path.join(V4, f"capitulo-{n}.md"), "w", encoding="utf-8").write(txt)
    return txt


def extra(name):
    return markdown.markdown(open(os.path.join(V4, name), encoding="utf-8").read(), extensions=["extra", "sane_lists", "nl2br", "md_in_html"])


CSS4 = CSS + """
.dedic { height: 200mm; display: flex; flex-direction: column; justify-content: center; text-align: center; break-after: page; }
.dedic p { text-align: center; }
section.extra { break-before: page; }
table { border-collapse: collapse; width: 100%; font-size: 9.5pt; margin: 0.8em 0 1.2em; }
th, td { border-bottom: 1px solid #ddd; padding: 4px 6px; text-align: left; vertical-align: top; }
blockquote + blockquote { margin-top: -0.4em; }"""


def main():
    secs, toc = [], []
    for n in range(1, 8):
        txt = build_md(n)
        secs.append(f'<section class="cap" id="cap{n}">\n{md_to_html(txt)}\n</section>')
        toc.append(f'<li><a href="#cap{n}">{n}. {TITLES[n]}</a></li>')
    ab = extra("abertura.md")
    dedic, nota = ab.split("<h1>", 1)
    front = (f'<section class="extra" id="dedicatoria" data-pos="front">{dedic}</section>\n'
             f'<section class="extra" id="nota" data-pos="front"><h1>{nota}</section>\n')
    back = f'<section class="extra" id="apendices" data-pos="back">{extra("apendices.md")}</section>\n'
    toc = ['<li><a href="#nota">Nota do autor</a></li>'] + toc + ['<li><a href="#apendices">Apêndices</a></li>']
    page = (f'<!DOCTYPE html>\n<html lang="pt-BR"><head><meta charset="utf-8"/><title>Eternos Mutáveis · 4.0</title><style>\n{CSS4}\n</style></head><body>\n'
            f'<div class="capa"><img src="../capa/v2/capa-d-frente.jpg" alt="Capa: Eternos Mutáveis, de Laércio Germano. Peça de dominó em pé: metade de cima preta com bola branca e a palavra ETERNOS; metade de baixo branca com bola preta e a palavra MUTÁVEIS."/></div>\n'
            f'<div class="rosto"><h1>Eternos Mutáveis</h1><p>A superação adâmica</p><p>Laércio Germano</p><p>Versão 4.0</p></div>\n'
            + front +
            f'<div class="toc"><h2>Sumário</h2><ol>{"".join(toc)}</ol></div>\n' + "\n".join(secs) + "\n" + back + "</body></html>")
    out = os.path.join(V4, "eternos-mutaveis-v4.html")
    open(out, "w", encoding="utf-8").write(page)
    if "--pdf" in sys.argv:
        subprocess.run(["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
                        "--virtual-time-budget=20000", f"--print-to-pdf={os.path.join(V4, 'eternos-mutaveis-v4.pdf')}", "file://" + out],
                       check=True, stderr=subprocess.DEVNULL)
    print("ok", out)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Eternos Mutáveis — versão 1.0 compilada (só para o site com seletor de versões).

Lê os capítulos 1.0 (../novo-capitulo-N-claude.md, que não são alterados), com os banners coloridos originais
(../assets/banner-cap-N-*.jpg), e gera v1/eternos-mutaveis-v1.html no mesmo formato das outras versões.
Uso: PYTHONPATH=<dir com markdown> python3 v1/_build_v1.py   (depois: python3 livro/_build_livro.py v1)
"""
import os, re, sys
V1 = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(V1)
sys.path.insert(0, os.path.join(ROOT, "v3"))
from _build_v3 import md_to_html, CSS

secs, toc = [], []
for n in range(1, 8):
    txt = open(os.path.join(ROOT, f"novo-capitulo-{n}-claude.md"), encoding="utf-8").read()
    txt = txt.replace("](inputs/", "](../inputs/").replace("](assets/", "](../assets/")
    title = re.match(r"# (.*)", txt).group(1)
    secs.append(f'<section class="cap" id="cap{n}">\n{md_to_html(txt)}\n</section>')
    toc.append(f'<li><a href="#cap{n}">{title}</a></li>')
page = (f'<!DOCTYPE html>\n<html lang="pt-BR"><head><meta charset="utf-8"/><title>Eternos Mutáveis · 1.0</title><style>\n{CSS}\n</style></head><body>\n'
        f'<div class="rosto"><h1>Eternos Mutáveis</h1><p>A superação adâmica</p><p>Laércio Germano</p><p>Versão 1.0</p></div>\n'
        f'<div class="toc"><h2>Sumário</h2><ol>{"".join(toc)}</ol></div>\n' + "\n".join(secs) + "\n</body></html>")
open(os.path.join(V1, "eternos-mutaveis-v1.html"), "w", encoding="utf-8").write(page)
print("ok")

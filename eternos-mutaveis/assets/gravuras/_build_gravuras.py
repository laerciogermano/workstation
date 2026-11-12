#!/usr/bin/env python3
"""Pranchas P&B dos caps. 1–7: gravuras renascentistas reais (domínio público / CC0, Wikimedia Commons),
tratadas na tinta e no papel da capa (#0B0B0B sobre #F4F2EC). originais/ -> cap-N.jpg."""
import os
from PIL import Image, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
INK, PAPER = (11, 11, 11), (244, 242, 236)
# arquivo, recorte em frações (esq, topo, dir, base) para tirar margens, legendas e réguas de cor
G = {
    1: ("cap-1-durer-adao-e-eva.jpg", (.02, .015, .98, .985)),
    2: ("cap-2-durer-sao-jeronimo.jpg", (.02, .015, .98, .985)),
    3: ("cap-3-goltzius-ixion.jpg", (.01, .01, .99, .99)),
    4: ("cap-4-flammarion.jpg", (.0, .0, 1, .905)),
    5: ("cap-5-durer-desenhista.jpg", (.01, .02, .99, .98)),
    6: ("cap-6-khunrath-oratorio-laboratorio.jpg", (0, 0, 1, 1)),
    7: ("cap-7-durer-cavaleiro.jpg", (.02, .015, .98, .985)),
}
for n, (f, (l, t, r, b)) in G.items():
    im = Image.open(os.path.join(HERE, "originais", f)).convert("L")
    w, h = im.size
    im = im.crop((int(l * w), int(t * h), int(r * w), int(b * h)))
    im = ImageOps.autocontrast(im, cutoff=(1.2, 2.5))
    im = im.point(lambda v: int(255 * (v / 255) ** 1.15))
    im = ImageOps.colorize(im, INK, PAPER)
    im.thumbnail((1800, 1800), Image.LANCZOS)
    im.save(os.path.join(HERE, f"cap-{n}.jpg"), quality=88)
    print(n, im.size)

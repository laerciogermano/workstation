#!/usr/bin/env python3
"""Extrai as mãos do rascunho do autor (rascunho-autor.png): mão feminina preta e mão masculina branca (traço).
Gera maos-feminina.png (silhueta preta, alfa) e maos-masculina.png (traço branco, alfa), ampliadas 5x."""
from PIL import Image, ImageFilter
import os
HERE = os.path.dirname(os.path.abspath(__file__))
S = 5
BOX = (190, 775, 505, 890)          # região das mãos no rascunho (1000x1347)
SPLIT = 338 - BOX[0]                 # vão entre os dedos (x no recorte)
im = Image.open(os.path.join(HERE, "rascunho-autor.png")).convert("L").crop(BOX)
w, h = im.size
big = im.resize((w * S, h * S), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.2))
sx = SPLIT * S
fem = Image.new("RGBA", big.size, (0, 0, 0, 0)); mas = Image.new("RGBA", big.size, (255, 255, 255, 0))
pf, pm, pg = fem.load(), mas.load(), big.load()
for y in range(big.size[1]):
    for x in range(big.size[0]):
        g = pg[x, y]
        if x < sx:
            a = max(0, min(255, int((165 - g) * 5)))
            pf[x, y] = (11, 11, 11, a)
        else:
            a = max(0, min(255, int((238 - g) * 2.2)))
            pm[x, y] = (244, 242, 236, a)
fem.crop(fem.getbbox()).save(os.path.join(HERE, "maos-feminina.png"))
mas.crop(mas.getbbox()).save(os.path.join(HERE, "maos-masculina.png"))
print("fem bbox", fem.getbbox(), "mas bbox", mas.getbbox(), "size", big.size, "split", sx)

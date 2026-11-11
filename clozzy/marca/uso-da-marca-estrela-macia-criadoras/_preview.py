#!/usr/bin/env python3
"""Confere o PDF: python3 _preview.py [pagina ...] → PNGs em /tmp/clozzy-criadoras (uma por página pedida; sem args, todas em folhas de 6)."""
import sys
from pathlib import Path
import fitz

HERE = Path(__file__).resolve().parent
OUT = Path("/tmp/clozzy-criadoras")
OUT.mkdir(exist_ok=True)
doc = fitz.open(HERE / "manual-uso-estrela-macia-criadoras.pdf")
args = [int(a) for a in sys.argv[1:]]
if args:
    for n in args:
        doc[n - 1].get_pixmap(dpi=110).save(OUT / f"p{n:02d}.png")
        print(OUT / f"p{n:02d}.png")
else:
    for s in range(0, len(doc), 4):
        pix = []
        for i in range(s, min(s + 4, len(doc))):
            pix.append(doc[i].get_pixmap(dpi=70))
        w, h = pix[0].width, pix[0].height
        sheet = fitz.Pixmap(fitz.csRGB, fitz.IRect(0, 0, w * 2, h * 2), False)
        sheet.clear_with(255)
        for k, p in enumerate(pix):
            p.set_origin((k % 2) * w, (k // 2) * h)
            sheet.copy(p, p.irect)
        sheet.save(OUT / f"folha{s // 4 + 1:02d}.png")
    print(len(doc), "páginas →", OUT)

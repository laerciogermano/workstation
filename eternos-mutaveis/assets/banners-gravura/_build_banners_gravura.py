#!/usr/bin/env python3
"""Banners originais (assets/banner-cap-N-*.jpg) em gravura P&B: hachura de traço fino cuja espessura
segue o tom (luz = papel, sombra = tinta), contra-hachura nas sombras e contorno leve das formas.
Tinta #0B0B0B sobre papel #F4F2EC, como as pranchas e a capa. Saída: cap-N.jpg (1600x900)."""
import glob, os
import numpy as np
from PIL import Image, ImageFilter, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.dirname(HERE)
INK, PAPER = np.array([11, 11, 11.]), np.array([244, 242, 236.])
FILES = {1: "banner-cap-1-era-adamica.jpg", 2: "banner-cap-2-busca-por-respostas.jpg", 3: "banner-cap-3-inferno-ciclico.jpg",
         4: "banner-cap-4-conhecimento-que-liberta.jpg", 5: "banner-cap-5-erro-aristoteles.jpg",
         6: "banner-cap-6-alfabeto-da-dualidade.jpg", 7: "banner-cap-7-superacao-adamica.jpg"}
S = 2.2          # trabalha ampliado e reduz no fim: traço fino e sem serrilhado
PERIOD = 7.0     # distância entre linhas na escala ampliada


def tone(im, lift):
    g = ImageOps.grayscale(im)
    g = ImageOps.autocontrast(g, cutoff=(1, 1))
    L = np.asarray(g, dtype=np.float32) / 255.0
    L = np.clip(L * (1 - lift) + lift, 0, 1) ** 0.85      # noites muito escuras ganham um pouco de luz
    return L


def hatch(L, angle, period, phase=0.0):
    h, w = L.shape
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    a = np.deg2rad(angle)
    p = (x * np.cos(a) + y * np.sin(a)) / period + phase
    tri = np.abs(p - np.floor(p) - 0.5) * 2          # 0 no meio da linha, 1 entre linhas
    return tri


def engrave(path, lift):
    im = Image.open(path).convert("RGB")
    W0, H0 = im.size
    im = im.resize((int(W0 * S), int(H0 * S)), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.2))
    L = tone(im, lift)
    # linhas levemente onduladas, como buril à mão
    h, w = L.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    wob = 0.35 * np.sin(xx / 37.0) + 0.25 * np.sin(yy / 53.0 + xx / 91.0)
    t1 = hatch(L, 30, PERIOD, 0) + 0 * wob
    t1 = np.abs(((xx * np.cos(np.deg2rad(30)) + yy * np.sin(np.deg2rad(30))) / PERIOD + wob) % 1 - 0.5) * 2
    t2 = np.abs(((xx * np.cos(np.deg2rad(-40)) + yy * np.sin(np.deg2rad(-40))) / (PERIOD * 1.1) - wob * .6) % 1 - 0.5) * 2
    t3 = np.abs(((xx * np.cos(np.deg2rad(80)) + yy * np.sin(np.deg2rad(80))) / (PERIOD * 1.25)) % 1 - 0.5) * 2
    soft = 0.12
    ink1 = np.clip((t1 - L) / soft + 0.5, 0, 1)                         # tons médios e escuros: primeira hachura
    ink2 = np.clip((t2 - np.clip(L * 1.9, 0, 1)) / soft + 0.5, 0, 1)    # sombras: contra-hachura
    ink3 = np.clip((t3 - np.clip(L * 3.2, 0, 1)) / soft + 0.5, 0, 1)    # sombras profundas: terceira direção
    ink = np.maximum(np.maximum(ink1, ink2), ink3)
    # contorno das formas
    g = Image.fromarray((L * 255).astype(np.uint8)).filter(ImageFilter.FIND_EDGES).filter(ImageFilter.GaussianBlur(0.8))
    E = np.asarray(g, dtype=np.float32) / 255.0
    ink = np.maximum(ink, np.clip((E - 0.10) * 3.0, 0, 1) * 0.85)
    out = (PAPER[None, None, :] * (1 - ink[..., None]) + INK[None, None, :] * ink[..., None]).astype(np.uint8)
    o = Image.fromarray(out).resize((1600, 900), Image.LANCZOS)
    return o


if __name__ == "__main__":
    import sys
    only = [int(a) for a in sys.argv[1:]] or list(FILES)
    LIFT = {1: 0.0, 2: 0.12, 3: 0.1, 4: 0.08, 5: 0.1, 6: 0.14, 7: 0.1}
    for n in only:
        engrave(os.path.join(SRC, FILES[n]), LIFT[n]).save(os.path.join(HERE, f"cap-{n}.jpg"), quality=90)
        print("ok", n)

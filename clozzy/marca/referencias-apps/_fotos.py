#!/usr/bin/env python3
"""Fotos-placeholder em duotone (só preto · roxo · rosa · branco) para os modelos.
Silhuetas abstratas — não são pessoas reais. Rodar: python3 _fotos.py"""
import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageOps

OUT = Path(__file__).resolve().parent / "modelos" / "img"
OUT.mkdir(parents=True, exist_ok=True)
INK, PURPLE, PINK, WHITE = "#14090F", "#7C48C4", "#FF0065", "#FFFFFF"


def portrait(seed, w=480, h=720):
    rnd = random.Random(seed)
    im = Image.new("L", (w, h), rnd.randint(20, 90))
    d = ImageDraw.Draw(im)
    # luz de fundo
    for _ in range(3):
        x, y, r = rnd.randint(0, w), rnd.randint(0, h // 2), rnd.randint(120, 260)
        d.ellipse([x - r, y - r, x + r, y + r], fill=rnd.randint(110, 230))
    cx = w // 2 + rnd.randint(-70, 70)
    hy = int(h * rnd.uniform(.30, .40))
    hr = int(w * rnd.uniform(.15, .19))
    tone = rnd.randint(140, 215)
    # cabelo / cabeça / ombros
    d.ellipse([cx - hr * 1.35, hy - hr * 1.45, cx + hr * 1.35, hy + hr * 1.6], fill=max(tone - 110, 15))
    d.ellipse([cx - hr, hy - hr * 1.2, cx + hr, hy + hr * 1.2], fill=tone)
    d.rectangle([cx - hr * .42, hy + hr, cx + hr * .42, hy + hr * 1.8], fill=tone - 15)
    d.rounded_rectangle([cx - hr * 2.9, hy + hr * 1.6, cx + hr * 2.9, h + 80], radius=int(hr * 1.6), fill=rnd.randint(40, 200))
    im = im.filter(ImageFilter.GaussianBlur(rnd.uniform(5, 10)))
    # grão
    noise = Image.effect_noise((w, h), 26).convert("L")
    im = Image.blend(im, noise, .07)
    mid = PURPLE if seed % 2 else PINK
    return ImageOps.colorize(im, black=INK, mid=mid, white=WHITE, midpoint=110)


if __name__ == "__main__":
    for i in range(1, 13):
        portrait(i * 7 + 3).save(OUT / f"p{i}.jpg", quality=82)
    print("ok 12")

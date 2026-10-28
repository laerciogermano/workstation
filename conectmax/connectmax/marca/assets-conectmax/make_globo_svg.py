"""Vetoriza o globo/rede wireframe do logo ConectMax (logo-noite.png) em SVG."""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as nd
import potrace

src, out_dir = sys.argv[1], sys.argv[2]
UP = 4  # upscale antes do threshold: contornos mais suaves

a = np.array(Image.open(src).convert('RGBA'))[..., 3]
lab, _ = nd.label(a > 40)
objs = nd.find_objects(lab)
sizes = nd.sum(np.ones_like(lab), lab, range(1, len(objs) + 1))
g = objs[int(np.argmax(sizes))]  # globo = maior componente
x1 = g[1].stop
# globo + fragmentos soltos da malha que terminam antes do fim do globo (exclui letras e tagline)
keep = np.zeros_like(a, bool)
for i, s_ in enumerate(objs):
    if s_[1].stop <= x1 and s_[1].start < x1 - 40:
        keep |= lab == i + 1
crop = np.where(nd.binary_dilation(keep, iterations=2), a, 0).astype(np.float32)[:, :x1]
ys, xs = np.nonzero(crop > 40)
crop = crop[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
h, w = crop.shape

big = np.array(Image.fromarray(crop.astype(np.uint8)).resize((w * UP, h * UP), Image.BICUBIC))
big = nd.gaussian_filter(big.astype(np.float32), 1.2)
bmp = potrace.Bitmap(big <= 127)  # potracer traça os pixels False
path = bmp.trace(turdsize=8, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=1.0, opticurve=True, opttolerance=0.2)

def fmt(v):
    return f'{v / UP:.2f}'.rstrip('0').rstrip('.')

d = []
for curve in path:
    sp = curve.start_point
    d.append(f'M{fmt(sp.x)} {fmt(sp.y)}')
    for seg in curve.segments:
        if seg.is_corner:
            d.append(f'L{fmt(seg.c.x)} {fmt(seg.c.y)}L{fmt(seg.end_point.x)} {fmt(seg.end_point.y)}')
        else:
            d.append(f'C{fmt(seg.c1.x)} {fmt(seg.c1.y)} {fmt(seg.c2.x)} {fmt(seg.c2.y)} {fmt(seg.end_point.x)} {fmt(seg.end_point.y)}')
    d.append('Z')
d = ''.join(d)

variants = {
    'globo-rede-preto.svg': '#181818',
    'globo-rede-branco.svg': '#FFFFFF',
    'globo-rede-azul.svg': '#0070BC',
}
for name, color in variants.items():
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="Globo rede wireframe">'
           f'<title>Globo rede wireframe</title><path fill="{color}" fill-rule="evenodd" d="{d}"/></svg>\n')
    open(f'{out_dir}/{name}', 'w').write(svg)
print('viewBox', w, h, 'curvas', len(path), 'bytes', len(d))

"""Mede a haste do l (largura do traço na altura de 45% do l) relativa à altura do l — comparável entre fontes."""
from fontTools.pens.basePen import BasePen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont


class Flat(BasePen):
    def __init__(self, gs):
        super().__init__(gs)
        self.polys, self.cur = [], []

    def _moveTo(self, p):
        self.cur = [p]

    def _lineTo(self, p):
        self.cur.append(p)

    def _curveToOne(self, a, b, c):
        p0 = self.cur[-1]
        for i in range(1, 13):
            t = i / 12
            u = 1 - t
            self.cur.append((u**3 * p0[0] + 3 * u * u * t * a[0] + 3 * u * t * t * b[0] + t**3 * c[0],
                             u**3 * p0[1] + 3 * u * u * t * a[1] + 3 * u * t * t * b[1] + t**3 * c[1]))

    def _qCurveToOne(self, a, b):
        p0 = self.cur[-1]
        for i in range(1, 9):
            t = i / 8
            u = 1 - t
            self.cur.append((u * u * p0[0] + 2 * u * t * a[0] + t * t * b[0], u * u * p0[1] + 2 * u * t * a[1] + t * t * b[1]))

    def _closePath(self):
        self.polys.append(self.cur)
        self.cur = []


def stem_ratio(ft, ch="l", frac=0.45):
    gs, cm = ft.getGlyphSet(), ft.getBestCmap()
    pen = Flat(gs)
    gs[cm[ord(ch)]].draw(pen)
    ys = [p[1] for poly in pen.polys for p in poly]
    y0, y1 = min(ys), max(ys)
    y = y0 + (y1 - y0) * frac
    xs = []
    for poly in pen.polys:
        for (xa, ya), (xb, yb) in zip(poly, poly[1:] + poly[:1]):
            if (ya <= y < yb) or (yb <= y < ya):
                xs.append(xa + (y - ya) * (xb - xa) / (yb - ya))
    xs.sort()
    w = sum(xs[i + 1] - xs[i] for i in range(0, len(xs) - 1, 2))
    return w / (y1 - y0)


def instance(path, wght):
    return instantiateVariableFont(TTFont(path), {"wght": wght}, inplace=False)

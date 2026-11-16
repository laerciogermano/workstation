"""Arredonda os cantos do “clozzy” (abertura morfológica: encolhe r e expande r com junção redonda).
Mantém o peso da letra; só os cantos viram curva, como as pontas da estrela e do arco."""
import re
from shapely.geometry import Polygon
from shapely.ops import unary_union
from shapely.geometry.polygon import orient


def _subpaths(d, steps=10):
    toks = re.findall(r"[MLHVQZ]|-?\d+(?:\.\d+)?(?:e-?\d+)?", d)
    i, cur, start, out, pts, cmd = 0, (0.0, 0.0), (0.0, 0.0), [], [], None
    num = lambda: float(toks[i])
    while i < len(toks):
        if re.match(r"[MLHVQZ]", toks[i]):
            cmd = toks[i]; i += 1
            if cmd == "Z":
                if len(pts) > 2: out.append(pts)
                pts, cur = [], start
                continue
        if cmd == "M":
            if len(pts) > 2: out.append(pts)
            cur = (float(toks[i]), float(toks[i + 1])); i += 2; start = cur; pts = [cur]; cmd = "L"
        elif cmd == "L":
            cur = (float(toks[i]), float(toks[i + 1])); i += 2; pts.append(cur)
        elif cmd == "H":
            cur = (float(toks[i]), cur[1]); i += 1; pts.append(cur)
        elif cmd == "V":
            cur = (cur[0], float(toks[i])); i += 1; pts.append(cur)
        elif cmd == "Q":
            c = (float(toks[i]), float(toks[i + 1])); e = (float(toks[i + 2]), float(toks[i + 3])); i += 4
            for k in range(1, steps + 1):
                t = k / steps
                pts.append(((1 - t) ** 2 * cur[0] + 2 * (1 - t) * t * c[0] + t * t * e[0],
                            (1 - t) ** 2 * cur[1] + 2 * (1 - t) * t * c[1] + t * t * e[1]))
            cur = e
    if len(pts) > 2: out.append(pts)
    return out


def _area(ring):
    return sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(ring, ring[1:] + ring[:1])) / 2


def _shape(d):
    """regra nonzero da fonte: contornos no sentido da maioria (pela área) somam; os do sentido oposto são furos"""
    rings = _subpaths(d)
    tot = sum(_area(r) for r in rings)
    fora = [Polygon(r).buffer(0) for r in rings if _area(r) * tot > 0]
    furo = [Polygon(r).buffer(0) for r in rings if _area(r) * tot < 0]
    return unary_union(fora).difference(unary_union(furo)) if furo else unary_union(fora)


def _d(geom):
    polys = getattr(geom, "geoms", [geom])
    out = []
    for p in polys:
        p = orient(p, 1)            # contorno anti-horário, furos horários: funciona com a regra nonzero
        for ring in [p.exterior, *p.interiors]:
            c = list(ring.coords)[:-1]
            out.append("M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in c) + "Z")
    return "".join(out)


def arredondar(d, r):
    g = _shape(d)
    g = g.buffer(-r, join_style=1, quad_segs=12).buffer(r, join_style=1, quad_segs=12)
    return _d(g)

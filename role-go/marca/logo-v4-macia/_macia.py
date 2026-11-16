"""Arredonda os cantos do RolêGo (mesma técnica do “clozzy” de letras redondas):
abertura morfológica (encolhe r, expande r com junção redonda) arredonda os cantos de fora;
fechamento opcional (expande rc, encolhe rc) arredonda também os cantos de dentro.
Raio em unidades do lockup (altura do R ≈ 196); em cada path o raio acompanha a escala do desenho."""
import re
from shapely.geometry import Polygon
from shapely.ops import polylabel
from shapely.geometry.polygon import orient


def _subpaths(d, qs=10, cs=16):
    toks = re.findall(r"[MLHVQCZ]|-?\d+(?:\.\d+)?(?:e-?\d+)?", d)
    i, cur, start, out, pts, cmd = 0, (0.0, 0.0), (0.0, 0.0), [], [], None
    f = lambda k: float(toks[i + k])
    while i < len(toks):
        if re.match(r"[MLHVQCZ]", toks[i]):
            cmd = toks[i]; i += 1
            if cmd == "Z":
                if len(pts) > 2: out.append(pts)
                pts, cur = [], start
                continue
        if cmd == "M":
            if len(pts) > 2: out.append(pts)
            cur = (f(0), f(1)); i += 2; start = cur; pts = [cur]; cmd = "L"
        elif cmd == "L":
            cur = (f(0), f(1)); i += 2; pts.append(cur)
        elif cmd == "H":
            cur = (f(0), cur[1]); i += 1; pts.append(cur)
        elif cmd == "V":
            cur = (cur[0], f(0)); i += 1; pts.append(cur)
        elif cmd == "Q":
            c, e = (f(0), f(1)), (f(2), f(3)); i += 4
            for k in range(1, qs + 1):
                t = k / qs
                pts.append(((1-t)**2*cur[0] + 2*(1-t)*t*c[0] + t*t*e[0], (1-t)**2*cur[1] + 2*(1-t)*t*c[1] + t*t*e[1]))
            cur = e
        elif cmd == "C":
            a, b, e = (f(0), f(1)), (f(2), f(3)), (f(4), f(5)); i += 6
            for k in range(1, cs + 1):
                t = k / cs; u = 1 - t
                pts.append((u**3*cur[0] + 3*u*u*t*a[0] + 3*u*t*t*b[0] + t**3*e[0],
                            u**3*cur[1] + 3*u*u*t*a[1] + 3*u*t*t*b[1] + t**3*e[1]))
            cur = e
    if len(pts) > 2: out.append(pts)
    return out


def shape(d):
    """fill-rule evenodd: XOR de todos os contornos"""
    g = None
    for r in _subpaths(d):
        p = Polygon(r).buffer(0)
        g = p if g is None else g.symmetric_difference(p)
    return g


def _d(geom):
    out = []
    for p in getattr(geom, "geoms", [geom]):
        p = orient(p, 1)
        for ring in [p.exterior, *p.interiors]:
            c = list(ring.coords)[:-1]
            out.append("M" + "L".join(f"{x:.2f} {y:.2f}" for x, y in c) + "Z")
    return "".join(out)


def _round_part(p, r, rc):
    # raio limitado pela espessura da peça (o acento é fino: não pode sumir)
    inr = p.boundary.distance(polylabel(p, 0.5))
    re_ = min(r, inr * 0.85)
    if p.bounds[3] < 70:            # acento circunflexo: braço tem ~21 de espessura, raio no máx. 9.5
        re_ = min(r, 9.5)
    g = p.buffer(-re_, join_style=1, quad_segs=16).buffer(re_, join_style=1, quad_segs=16) if re_ > 0 else p
    if rc:
        g = g.buffer(rc, join_style=1, quad_segs=16).buffer(-rc, join_style=1, quad_segs=16)
    return g


def arredondar(d, r, rc=0.0):
    from shapely.ops import unary_union
    g = shape(d)
    parts = [_round_part(p, r, rc) for p in getattr(g, "geoms", [g])]
    return _d(unary_union(parts).simplify(0.08))


# ---------- v2: arredondamento por canto (não come traço fino) ----------
import math
from shapely.geometry import Polygon as _P


def _soft_ring(pts, r, rc, min_dev=28.0, seg=12):
    """Cada quina (desvio > min_dev graus) vira uma curva quadrática com controle no vértice.
    Recuo t = raio / tan(ângulo/2), limitado a 45% da distância até a quina vizinha.
    Anel orientado com o preenchimento à esquerda: virada à esquerda = canto de fora."""
    p = [pts[0]]
    for q in pts[1:]:
        if math.dist(q, p[-1]) > 1e-6: p.append(q)
    if math.dist(p[0], p[-1]) < 1e-6: p.pop()
    n = len(p)
    if n < 3: return pts
    L = [0.0]
    for i in range(n): L.append(L[-1] + math.dist(p[i], p[(i + 1) % n]))
    tot = L[-1]
    corners = []
    for i in range(n):
        a, b, c = p[i - 1], p[i], p[(i + 1) % n]
        ux, uy = a[0] - b[0], a[1] - b[1]; vx, vy = c[0] - b[0], c[1] - b[1]
        lu, lv = math.hypot(ux, uy), math.hypot(vx, vy)
        cosf = max(-1, min(1, (ux * vx + uy * vy) / (lu * lv)))
        phi = math.degrees(math.acos(cosf))           # ângulo interno da quina
        if 180 - phi < min_dev: continue
        cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])
        rad = r if cross > 0 else rc
        if rad <= 0: continue
        corners.append([i, rad / math.tan(math.radians(phi) / 2)])
    if not corners: return p
    m = len(corners)
    for k in range(m):
        i, t = corners[k]
        dp = (L[i] - L[corners[k - 1][0]]) % tot or tot
        dn = (L[corners[(k + 1) % m][0]] - L[i]) % tot or tot
        corners[k][1] = min(t, 0.45 * dp, 0.45 * dn)

    def at(s):
        s %= tot
        j = max(0, min(n - 1, next(j for j in range(n) if L[j + 1] >= s)))
        a, b = p[j], p[(j + 1) % n]; seglen = L[j + 1] - L[j]
        f = 0 if seglen == 0 else (s - L[j]) / seglen
        return (a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f)

    out = []
    for k in range(m):
        i, t = corners[k]
        s0, s1 = L[i] - t, L[i] + t
        A, C, B = at(s0), p[i], at(s1)
        for q in range(seg + 1):
            u = q / seg
            out.append(((1-u)**2*A[0] + 2*(1-u)*u*C[0] + u*u*B[0], (1-u)**2*A[1] + 2*(1-u)*u*C[1] + u*u*B[1]))
        ni, nt = corners[(k + 1) % m]
        e = L[ni] - nt
        j = i + 1
        while True:                                   # vértices originais até a próxima quina
            jj = j % n
            sj = L[jj] if jj > i or (k + 1 < m and jj > i) else L[jj] + tot
            sj = (L[jj] - L[i]) % tot + L[i]
            ee = (e - L[i]) % tot + L[i]
            if sj >= ee or jj == ni: break
            if sj > s1: out.append(p[jj])
            j += 1
    return out


def amaciar(d, r, rc=0.0):
    g = shape(d)
    polys = []
    for poly in getattr(g, "geoms", [g]):
        poly = orient(poly, 1)
        polys.append(_P(_soft_ring(list(poly.exterior.coords)[:-1], r, rc),
                        [_soft_ring(list(h.coords)[:-1], r, rc) for h in poly.interiors]).buffer(0))
    from shapely.ops import unary_union
    return _d(unary_union(polys).simplify(0.05))

"""“ROLÊGO” inteiro em pincel. R, O, L, Ê e o circunflexo são o traçado original de
../estilo-viva-o-role/lettering/role.svg; o G e o segundo O são montados a partir do próprio O dele
(abertura em cerdas + braço), para manter a mesma ponta e o mesmo peso. Coordenadas da arte original."""
import os, re
from shapely.geometry import Polygon
from shapely.ops import unary_union
from shapely import affinity

AQUI = os.path.dirname(os.path.abspath(__file__))
_svg = open(os.path.join(AQUI, "..", "estilo-viva-o-role", "lettering", "role.svg")).read()
ROLE_D, RISCO_D = re.findall(r' d="([^"]+)"', _svg)


def _aneis(d, passos=10):
    """Subpaths (M/C/L/Z absolutos) achatados em listas de pontos."""
    saida, p, cmd, n = [], [], None, []
    for tk in re.findall(r"[A-Za-z]|-?\d+(?:\.\d+)?", d):
        if tk.isalpha():
            cmd = tk
            if tk == "M":
                p, n = [], []
            elif tk == "Z":
                saida.append(p)
            continue
        n.append(float(tk))
        if cmd in "ML" and len(n) == 2:
            p.append((n[0], n[1]))
            n, cmd = [], "L"
        elif cmd == "C" and len(n) == 6:
            a, b, c, e = p[-1], n[0:2], n[2:4], n[4:6]
            for i in range(1, passos + 1):
                t = i / passos
                u = 1 - t
                p.append(tuple(u**3 * a[k] + 3 * u * u * t * b[k] + 3 * u * t * t * c[k] + t**3 * e[k] for k in (0, 1)))
            n = []
    return saida


_A = _aneis(ROLE_D)
_pol = [Polygon(a).buffer(0) for a in _A]


def _achar(x0, y0):
    return min(_pol, key=lambda g: abs(g.bounds[0] - x0) + abs(g.bounds[1] - y0))


R = _achar(102, 467).difference(unary_union([_achar(252, 657), _achar(126, 628), _achar(193, 498)]))
O = _achar(302, 475).difference(_achar(336, 503))
LE = _achar(426, 433)
CIRC = _achar(593, 394)

# ---------------------------------------------------------------- G: o O aberto + braço
_abertura = Polygon([  # borda de cima = ponta do traço superior (cerdas); borda de baixo = vão acima do braço
    (470, 484), (440, 495), (418, 507), (433, 505.5), (421, 511.5), (400, 521),
    (372, 537), (366, 552), (378, 566), (392, 563), (470, 535)])
_braco = Polygon([  # entra pela esquerda em cerdas longas e termina redondo no lado direito do G
    (352, 580), (371, 570), (384, 566.5), (368, 570), (377, 563.5), (398, 553.5), (420, 544.5), (432, 539.5),
    (439, 539), (443.5, 544), (443, 552), (437, 561), (424, 568), (404, 575.5), (385, 583),
    (368, 590), (381, 582), (362, 587)])
_corpo = O.difference(_abertura)
_corpo = unary_union([p for p in getattr(_corpo, "geoms", [_corpo]) if p.area > 150])  # sem lascas do corte
G = unary_union([_corpo, _braco.buffer(.9).buffer(-.9)])
G = G.buffer(1.2, join_style=1).buffer(-1.2, join_style=1)

# segundo O: o mesmo traço, um pouco girado e com um risco de cerda, para não parecer carimbo
_fio = Polygon([(318, 603), (323, 590), (331, 579), (327, 591), (321, 604)])
O2 = affinity.rotate(affinity.scale(O.difference(_fio), 1.03, .96, origin="center"), -5, origin="center")


def _kern(g, anterior, cx_ini, cy, folga):
    """Centra g em cy e aproxima da letra anterior até sobrar `folga`."""
    b = g.bounds
    g = affinity.translate(g, cx_ini - (b[0] + b[2]) / 2, cy - (b[1] + b[3]) / 2)
    while g.distance(anterior) > folga:
        g = affinity.translate(g, -.5, 0)
    while g.distance(anterior) < folga:
        g = affinity.translate(g, .5, 0)
    return g


_Gp = _kern(affinity.scale(G, 1.04, 1.04, origin="center"), unary_union([LE, CIRC]), 800, 509, 7)
_Op = _kern(O2, _Gp, 940, 485, 7)

ROLE = unary_union([R, O, LE, CIRC])
GO = unary_union([_Gp, _Op])
# soltos, para composições próprias
G_SO, O_SO = _Gp, _Op


def d(g):
    """Geometria shapely → atributo d (usar com fill-rule evenodd)."""
    partes = getattr(g, "geoms", [g])
    s = ""
    for p in partes:
        for anel in [p.exterior, *p.interiors]:
            c = list(anel.simplify(.18).coords)[:-1]
            s += "M" + "L".join(f"{x:.2f} {y:.2f}" for x, y in c) + "Z"
    return s

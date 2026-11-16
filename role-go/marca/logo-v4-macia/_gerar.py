#!/usr/bin/env python3
"""Possibilidades do RolêGo macio: arredonda os SVGs masters do logo-v4 em 5 intensidades.
Cada opção vira uma pasta opcao-X/ com os 18 SVGs (mesmos nomes do v4) e a folha de escolha em PDF."""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _macia import amaciar as arredondar, shape

HERE = os.path.dirname(os.path.abspath(__file__))
V4 = os.path.join(HERE, "..", "logo-v4")
GO_H = 199.64  # altura do Go no lockup (31.8 → 231.44)

OPCOES = [  # id, nome, raio fora, raio dentro, descrição
    ("A", "Sutil", 5, 0, "Só tira o fio das quinas. De longe, igual ao v4."),
    ("B", "Macia", 11, 0, "O mesmo raio do clozzy de letras redondas. Quinas viram curva."),
    ("C", "Bem macia", 18, 0, "Pontas bem redondas, ainda com o desenho do v4."),
    ("D", "Macia por inteiro", 12, 10, "Como a B, e os cantos de dentro também arredondam."),
    ("E", "Gomosa", 28, 18, "Raio máximo, fora e dentro. Tudo vira curva, tom de bala de goma."),
]


def scale_of(d):
    g = shape(d)
    minx, miny, maxx, maxy = g.bounds
    if "M496.67" in d or maxx - minx > 500:   # “Rolê”
        return 1.0
    return (maxy - miny) / GO_H


def soften(svg, r, rc):
    def sub(m):
        d = m.group(1); k = scale_of(d)
        return f' d="{arredondar(d, r * k, rc * k)}"'
    return re.sub(r' d="([^"]+)"', sub, svg)


def main():
    files = sorted(f for f in os.listdir(V4) if f.startswith("v4-") and f.endswith(".svg"))
    for oid, nome, r, rc, _ in OPCOES:
        out = os.path.join(HERE, f"opcao-{oid}")
        os.makedirs(out, exist_ok=True)
        for f in files:
            open(os.path.join(out, f), "w").write(soften(open(os.path.join(V4, f)).read(), r, rc))
        print(oid, nome, "ok")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Clozzy — teste de fontes para o nome. Mesmo documento da identidade-oficial, com o nome “clozzy” mais fino
(haste do l = 85% da do Gabarito 800) e em fontes diferentes que combinam (redondas, geométricas).

Calibração: cada fonte recebe o peso cuja haste do l (medida a 45% da altura, relativa à altura do l) é 85% da do
Gabarito 800. Todas são redimensionadas para que o l tenha a mesma altura (681) — o lockup (anel 1,4× o l, vão 0,35 l)
fica idêntico; só muda a palavra. Troca feita em tempo de execução (T.glyph); o código da identidade-oficial não muda.

Rodar: python3 _fontes.py [slug ...] → <slug>/ (HTML, PDF, svg/) e comparativo-fontes.pdf
"""
import shutil
import subprocess
import sys
from functools import lru_cache
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

HERE = Path(__file__).resolve().parent
MARCA = HERE.parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(MARCA / "identidade-oficial"))
import importlib.util  # noqa: E402
import json  # noqa: E402
import _stem as S  # noqa: E402
import _marca as M  # noqa: E402


def _carregar(nome, caminho):
    """Carrega por caminho: outras rodadas também têm um _build.py no sys.path."""
    spec = importlib.util.spec_from_file_location(nome, caminho)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


B = _carregar("identidade_oficial_build", MARCA / "identidade-oficial" / "_build.py")

T = M.T
ALVO = 0.85      # espessura relativa ao Gabarito 800 (“um pouco mais fino”)
L_ALTURA = 681.0

GABARITO = MARCA / "identidade-nova" / "fonts" / "Gabarito-Variable.ttf"
FONTES = [   # slug, nome, arquivo, nota
    ("gabarito", "Gabarito", GABARITO, "A mesma fonte, mais leve: o controle do teste."),
    ("outfit", "Outfit", HERE / "fonts" / "Outfit-Variable.ttf", "Geométrica limpa; o a e o y mais abertos."),
    ("lexend", "Lexend", HERE / "fonts" / "Lexend-Variable.ttf", "Larga e aberta, desenhada para leitura."),
    ("nunito", "Nunito", HERE / "fonts" / "Nunito-Variable.ttf", "Terminais redondos: a mais macia."),
    ("rubik", "Rubik", HERE / "fonts" / "Rubik-Variable.ttf", "Cantos levemente arredondados, mais firme."),
    ("fredoka", "Fredoka", HERE / "fonts" / "Fredoka-Variable.ttf", "Redonda e brincalhona, a mais informal."),
]

_base = S.stem_ratio(S.instance(str(GABARITO), 800))


def peso_alvo(path):
    """Bisseção no eixo wght até a haste do l chegar a ALVO × Gabarito 800."""
    ft = TTFont(str(path))
    ax = [a for a in ft["fvar"].axes if a.axisTag == "wght"][0]
    lo, hi = ax.minValue, ax.maxValue
    for _ in range(14):
        mid = (lo + hi) / 2
        if S.stem_ratio(S.instance(str(path), mid)) / _base < ALVO:
            lo = mid
        else:
            hi = mid
    return round((lo + hi) / 2)


class Face:
    def __init__(self, path, wght):
        self.ft = S.instance(str(path), wght)
        self.gs, self.cm = self.ft.getGlyphSet(), self.ft.getBestCmap()
        bp = BoundsPen(self.gs)
        self.gs[self.cm[ord("l")]].draw(bp)
        self.s = L_ALTURA / (bp.bounds[3] - bp.bounds[1])      # l com 681, como no Gabarito
        self.cache = {}

    def glyph(self, ch):
        if ch not in self.cache:
            g = self.cm[ord(ch)]
            pen = SVGPathPen(self.gs)
            self.gs[g].draw(TransformPen(pen, (self.s, 0, 0, -self.s, 0, 0)))
            bp = BoundsPen(self.gs)
            self.gs[g].draw(bp)
            x0, y0, x1, y1 = bp.bounds
            self.cache[ch] = (pen.getCommands(), self.ft["hmtx"][g][0] * self.s,
                              (x0 * self.s, -y1 * self.s, x1 * self.s, -y0 * self.s))
        return self.cache[ch]


ATUAL = {"face": None}


def _glyph(ch, wght):
    return ATUAL["face"].glyph(ch)


T.glyph = _glyph       # Word.letter resolve glyph() no módulo a cada chamada


def usar(path, wght):
    ATUAL["face"] = Face(path, wght)


PESOS = HERE / "pesos.json"      # cache da calibração (apague para recalcular)


def configurar():
    cache = json.loads(PESOS.read_text()) if PESOS.exists() else {}
    cfg = []
    for slug, nome, path, nota in FONTES:
        if slug not in cache or cache[slug]["alvo"] != ALVO:
            cache[slug] = {"peso": peso_alvo(path), "alvo": ALVO}
        cfg.append((slug, nome, path, int(round(cache[slug]["peso"] / 10) * 10), nota))
    PESOS.write_text(json.dumps(cache, indent=1))
    return cfg


def gerar(slug, nome, path, w, nota):
    usar(path, w)
    out = HERE / slug
    shutil.rmtree(out, ignore_errors=True)
    out.mkdir(parents=True)
    n = M.build(out / "svg")
    B.NOME_FONTE = f"{nome} {w}"
    B.FONTS = "../../identidade-nova/fonts"
    B.OUT_DIR = out
    B.OUT_NAME = f"identidade-clozzy-{slug}"
    B.DOC_TITULO = f"Clozzy — identidade visual · nome em {nome} {w}"
    B.build()
    return n


def comparativo(cfg):
    """Uma página: o nome em cada fonte, nas quatro versões, mais o teste de 24 e 16 px."""
    linhas = ""
    refs = [("gabarito", "Gabarito", GABARITO, 800, "Original: peso 800.")] + [(s, n, p, w, no) for s, n, p, w, no in cfg]
    for slug, nome, path, w, nota in refs:
        usar(path, w)
        cel = ""
        for v in ("preto", "rosa", "roxo", "branco"):
            _s, _n, bg, wc, rc, sc = M.V[v]
            cel += (f'<div style="width:300px;height:78px;border-radius:14px;background:{bg};display:flex;align-items:center;justify-content:center;'
                    f'{"border:1px solid rgba(20,9,15,.14);" if v == "branco" else ""}">{M.versao_svg("horizontal", v, h=44)}</div>')
        pequenos = "".join(f'<div style="display:flex;align-items:center;justify-content:center;width:{x}px">{M.versao_svg("horizontal", "branco", h=h)}</div>'
                           for x, h in ((190, 24), (130, 16)))
        etiqueta = f"{nome} {w}" + (" · original" if w == 800 and slug == "gabarito" else "")
        linhas += (f'<div style="display:flex;gap:14px;align-items:center;padding:6px 0;border-top:1px solid rgba(20,9,15,.14)">'
                   f'<div style="width:200px"><b style="font:800 22px Gabarito">{etiqueta}</b><div style="font:500 14px/1.3 Figtree;opacity:.7;margin-top:2px">{nota}</div></div>'
                   f'{cel}{pequenos}</div>')
    css = (f'@font-face{{font-family:Gabarito;src:url("../identidade-nova/fonts/Gabarito-Variable.ttf");font-weight:400 900}}'
           f'@font-face{{font-family:Figtree;src:url("../identidade-nova/fonts/Figtree-Variable.ttf");font-weight:300 900}}'
           "@page{size:1600px 900px;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Figtree;color:#14090F}"
           "section{width:1600px;height:900px;padding:44px 70px;background:#fff}h1{font:900 40px/1 Gabarito;letter-spacing:-.03em;margin:0 0 6px}"
           ".lead{font:500 18px/1.4 Figtree;opacity:.8;margin:0 0 14px}")
    html = (f'<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy — fontes do nome</title><style>{css}</style></head><body>'
            f'<section><h1>O nome em seis fontes</h1><p class="lead">Haste do l a 85% da do Gabarito 800; o l tem a mesma altura em todas. À direita, o branco em 24 e 16 px de altura.</p>{linhas}</section></body></html>')
    f_html = HERE / "comparativo-fontes.html"
    f_html.write_text(html)
    subprocess.run([B.CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files", "--force-device-scale-factor=1",
                    f"--print-to-pdf={HERE / 'comparativo-fontes.pdf'}", "--no-pdf-header-footer", "--virtual-time-budget=3000", f_html.as_uri()],
                   check=True, capture_output=True)


if __name__ == "__main__":
    quais = sys.argv[1:]
    cfg = configurar()
    for slug, nome, path, w, nota in cfg:
        print(f"{slug:9s} {nome} peso {w}")
    for c in cfg:
        if not quais or c[0] in quais:
            print("gerado", c[0], gerar(*c), "svgs")
    if not quais:
        comparativo(cfg)
        print("comparativo ok")

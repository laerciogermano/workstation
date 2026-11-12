#!/usr/bin/env python3
"""Clozzy — documento “Círculo próximo tracejado” (rodada 5a: tracejado só perto da ponta / do meio pra ponta, A–D).
Reaproveita as páginas de _build.py (rodada 5b, “Story espelhado”) trocando a variação principal, a referência e os textos.
Saída com nome próprio: circulo-tracejado-clozzy.{html,pdf}. Rodar: python3 _circulo.py && python3 _build_ponta.py"""
import importlib.util, subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
_spec = importlib.util.spec_from_file_location("story_espelhado_build", HERE / "_build.py")
B = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(B)

OUT_HTML = HERE / "circulo-tracejado-clozzy.html"
OUT_PDF = HERE / "circulo-tracejado-clozzy.pdf"

B.MAIN = "b-meio"
B.REF7 = sorted(B.REFS.glob("*13.26.05*.png"))[0]
B.C.VARIANTS = {k: v for k, v in B.C.VARIANTS.items() if k[0] in "abcd"}


def _xy(a):
    x, y = B.C.P(a, 49)
    return f'x2="{x:.1f}" y2="{y:.1f}"'


TEXT = [  # (texto da versão espelhada, texto desta versão); trocas que não acharem o trecho são ignoradas
    ("Print 13.43 · espelhar", "Print 7 · novo story"),
    ("Estrela do print 5 + <em>anel do print 13.43, espelhado</em>", "Estrela do print 5 + <em>tracejado do print 7</em>"),
    ("Espelhado · estrela original · Pink Deep", "Do meio pra ponta · Pink Deep"),
    ("<h4>Espelhado</h4><p>O arco cheio passa para a esquerda (de baixo até o topo) e os traços sobem pela direita até a abertura no alto, invertendo o print.</p>",
     "<h4>Tracejado só no fim</h4><p>A parte de baixo do C fica cheia. Os traços aparecem só perto da ponta, ou do meio até ela, e variam de tamanho como no print 7.</p>"),
    ("Mesma estrela, traço 10 e Pink Deep em todas. E e F seguem o print 13.43 espelhado; A–D são as variações anteriores (o C quebrando perto da ponta). Em 16–20 px entra um arquivo próprio com traço 14.",
     "Mesma estrela, traço 10 e Pink Deep em todas. Muda só onde o C quebra e o tamanho dos traços. Em 16–20 px entra um arquivo próprio com traço 14 e menos traços."),
    ("A variação E com quatro espessuras.", "A variação B com quatro espessuras."),
    ("Arco cheio de 62° a 250° (esquerda) e 4 traços de 26° (o último, no topo, com 16°), com vãos de 16° e a abertura de 30° no alto.",
     "Os vãos são de 12°. O traço de 10° vira um ponto e os outros variam entre 31° e 34°: longo, ponto, longo, ponto, ponta."),
    ("No alto, centrada em −95° (linha roxa), logo acima da ponta de cima da estrela: o story “abre” para cima.",
     "Centrada em −18° (linha roxa), na ponta superior-direita da estrela, como no original."),
    (_xy(-95), _xy(-18)),
    ("Recomendo a <em>E · story espelhado</em>", "Recomendo a <em>B · do meio pra ponta</em>"),
    ("É o print 13.43 invertido para a direita, com a estrela original do Círculo próximo. O arco cheio à esquerda segura a forma, os traços à direita dizem “story”, e tudo em Pink Deep.",
     "É a mais parecida com o print 7: metade cheia, metade em traços que variam e vão rareando até a abertura, para onde a estrela aponta. A parte de baixo cheia mantém a leitura de C."),
    ("E (traços iguais) ou F (variados)", "A, B, C ou D"),
    ("igual ao print 13.43", "estrela ink"),
    ("(print 13.43)", ""),
]


LETTER = {"Só na ponta": "A", "Do meio pra ponta": "B", "Do meio, traços largos": "C", "Ponta picotada": "D"}
_P = B.C.P


def _construction(n):
    """Mesma página, com a linha da abertura em −18° (o C desta versão abre como o original)."""
    B.C.P = lambda a, r: _P(-18 if (a == -95 and r == 49) else a, r)
    try:
        return B.p_construction(n)
    finally:
        B.C.P = _P


def build():
    B.OUT_HTML, B.OUT_PDF = OUT_HTML, OUT_PDF
    pages = [B.p_cover(), B.p_compare(2), B.p_variants(3), B.p_thickness(4), _construction(5), B.p_color(6), B.p_screen(7), B.p_next(8)]
    html = "".join(pages)
    import re
    # capa: troca o parágrafo de abertura inteiro
    html = re.sub(r'(<p class="lead" style="margin-top:18px;max-width:470px">).*?(</p>)',
                  r'\1O modelo do print 5 com a <b>mesma estrela</b> e o C <b>mais fino</b>. Do meio até a ponta, o C quebra em traços de '
                  r'<b>tamanhos diferentes</b>, como no “novo story” do print 7. A cor principal é o <b>Pink Deep</b>.\2', html, count=1, flags=re.S)
    html = re.sub(r'"[EF]ABCD"', '"ABCD"', html)
    for a, b in TEXT:
        html = html.replace(a, b)
    # letras A–D pelos nomes (as páginas de origem numeram E, F, A, B…)
    html = re.sub(r'(<span class="lbl">)[A-F]((?:(?!<span class="lbl">).)*?<h3>)([^<]+)(</h3>)',
                  lambda m: m.group(1) + LETTER.get(m.group(3), "?") + m.group(2) + m.group(3) + m.group(4), html, flags=re.S)
    html = re.sub(r'>[A-F] · ([^<]+)</div>', lambda m: f'>{LETTER.get(m.group(1), "?")} · {m.group(1)}</div>' if m.group(1) in LETTER else m.group(0), html)
    doc = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy — Círculo próximo tracejado</title>'
           f'<style>{B.PB.css()}{B.EXTRA}</style></head><body>{html}</body></html>')
    OUT_HTML.write_text(doc)
    subprocess.run([B.CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer", f"--print-to-pdf={OUT_PDF}", OUT_HTML.as_uri()],
                   check=True, capture_output=True)
    return len(pages)


if __name__ == "__main__":
    print("pages", build())

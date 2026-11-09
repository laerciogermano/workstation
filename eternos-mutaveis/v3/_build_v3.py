#!/usr/bin/env python3
"""Eternos Mutáveis — versão 3.0.

v3 = texto original dos capítulos (leituras dos banners como escritas na 1.0) + imagens sem repetição (como na 2.0)
+ os mesmos banners em gravura P&B (assets/banners-gravura/, _build_banners_gravura.py). Títulos com artigo.
Abaixo, a descrição herdada da 2.0 vale só para os itens 1 e 4.

(herdado) Eternos Mutáveis — versão 2.0.

Lê os capítulos 1.0 (../novo-capitulo-N-claude.md, que não são alterados) e gera v2/capitulo-N.md com:
  1. títulos novos (A Era Adâmica · A Busca · O Inferno Cíclico · O Insight · O Erro · A Gnose · A Superação Adâmica);
  2. a gravura renascentista no lugar do banner colorido (assets/gravuras/cap-N.jpg), com crédito;
  3. os trechos que liam o banner antigo reescritos para ler a gravura ("a gravura que abre este capítulo");
  4. sem imagens repetidas: cada obra aparece uma vez; quando o texto volta a ela, remete ao capítulo onde apareceu.
Depois gera v2/eternos-mutaveis-v2.html (capa D + sumário + 7 capítulos) e o PDF.

Uso: PYTHONPATH=<dir com o pacote markdown> python3 v2/_build_v2.py
"""
import os, re, sys, subprocess, html as H
import markdown

V2 = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(V2)

TITLES = {1: "A Era Adâmica", 2: "A Busca", 3: "O Inferno Cíclico", 4: "O Insight", 5: "O Erro", 6: "A Gnose", 7: "A Superação Adâmica"}

PLATES = {
    1: ("Adão e Eva de pé, nus, entre as árvores de uma floresta escura; a serpente, enrolada no tronco, põe um fruto na mão de Eva; Adão estende a mão aberta para ela e, com a outra, segura um ramo; aos pés, um gato espreita um rato; ao fundo, uma cabra-montês no alto de um penhasco",
        "Albrecht Dürer, Adão e Eva, 1504. Gravura a buril. National Gallery of Art, Washington."),
    2: ("São Jerônimo escreve, curvado sobre uma mesa, no fundo de um estúdio iluminado por janelas de vidro redondo; em primeiro plano dormem um leão e um cão; no parapeito, um crânio; na parede, uma ampulheta",
        "Albrecht Dürer, São Jerônimo no estúdio, 1514. Gravura a buril. National Gallery of Art, Washington."),
    3: ("Gravura redonda: Íxion despenca de cabeça entre nuvens e chamas, os braços abertos, a boca aberta; embaixo, água parada e rochas em fogo; uma inscrição em latim corre pela borda do círculo",
        "Hendrick Goltzius, segundo Cornelis van Haarlem, Íxion, da série Os quatro que caíram, 1588. Gravura a buril. National Gallery of Art, Washington."),
    4: ("Um viajante de manto e cajado, de joelhos no fim do mundo, passa a cabeça através da abóbada de estrelas e vê, do outro lado, rodas dentro de rodas e círculos de fogo; atrás dele, árvores, uma cidade, o sol e a lua",
        "Gravura Flammarion, em Camille Flammarion, L'atmosphère: météorologie populaire, Paris, 1888. Xilogravura à maneira antiga."),
    5: ("Uma mulher deitada sobre uma mesa comprida; do outro lado, um homem a desenha olhando por uma haste e por uma grade de fios esticados numa moldura, e passa o que vê para um papel quadriculado; ao fundo, uma janela aberta para o mar",
        "Albrecht Dürer, Desenhista fazendo um desenho em perspectiva de uma mulher deitada, de Instrução sobre a medida (1525), edição de 1538. Xilogravura. Metropolitan Museum of Art, Nova York."),
    6: ("Gravura redonda de uma grande sala em perspectiva, de chão quadriculado: à esquerda, uma tenda onde um homem reza de joelhos diante de uma mesa; à direita, fornos, alambiques e prateleiras de frascos; no centro, uma mesa com instrumentos de música; ao fundo, uma porta aberta",
        "Heinrich Khunrath, Oratório e laboratório, em Anfiteatro da Sabedoria Eterna, 1595. Gravura de Paullus van der Doort segundo Hans Vredeman de Vries."),
    7: ("Um cavaleiro de armadura segue a cavalo por um caminho estreito entre rochas; ao lado, a Morte, coroada de serpentes, ergue uma ampulheta; atrás, o Diabo, de chifres e focinho; um cão corre junto ao cavalo; no alto da colina, ao fundo, uma cidade",
        "Albrecht Dürer, O Cavaleiro, a Morte e o Diabo, 1513. Gravura a buril. National Gallery of Art, Washington."),
}

E = []   # v3: texto original; só as remissões onde a imagem repetida saiu (como na 2.0)
def L(n, start, new): E.append((n, "line", start, new))
def S(n, old, new): E.append((n, "sub", old, new))
L(6, "William Blake abriu o seu livro mais longo com a imagem de um homem atravessando uma porta.", "Volto ao homem de Blake que o capítulo 4 mostrou atravessando uma porta de pedra, com um globo de luz na mão. É Los, a figura que, na mitologia de Blake, representa a imaginação criadora. À frente dele, o interior é escuro. Ele não sabe o que vai encontrar. Mas já está passando.")
S(6, "Em 1913, Wassily Kandinsky pintou uma tela de dois metros por três em que não há nenhum objeto reconhecível.", "Volto à tela que Kandinsky pintou em 1913 e que o capítulo 4 mostrou: dois metros por três sem nenhum objeto reconhecível.")
L(7, "Ghiberti passou vinte e sete anos fundindo", "Volto ao painel de Ghiberti que o capítulo 4 mostrou, nas portas que Michelangelo teria chamado de portas do Paraíso.")
S(7, "Num manuscrito copiado no século XIII, que reúne canções de estudantes e clérigos errantes, há uma página com uma roda.", "Volto à roda da Fortuna do *Carmina Burana*, que apareceu no capítulo 3.")
L(7, "Blake abriu o seu último grande livro com um homem entrando por uma porta.", "Volto uma última vez ao homem de Blake que o capítulo 4 mostrou entrando por uma porta de pedra, na primeira prancha de *Jerusalem*, com um globo de luz na mão.")
S(7, "Leonardo desenhou num caderno, a tinta, um homem nu com dois corpos sobrepostos.", "O Homem Vitruviano, que o capítulo 5 mostrou, tem dois corpos sobrepostos.")
# imagens repetidas: cada obra fica onde aparece primeiro com a leitura mais completa
DROP = {5: ["02-michelangelo-separacao-luz-trevas"], 6: ["10b-blake-albion-frontispiece", "17-kandinsky-composition-vii"],
        7: ["19-ghiberti-porta-do-paraiso", "21b-roda-da-fortuna-completa", "10b-blake-albion-frontispiece", "06-leonardo-homem-vitruviano"]}


def build_md(n):
    src = open(os.path.join(ROOT, f"novo-capitulo-{n}-claude.md"), encoding="utf-8").read()
    lines = src.split("\n")
    lines[0] = f"# {n}. {TITLES[n]}"
    alt, credit = PLATES[n]
    for i, ln in enumerate(lines):
        if ln.startswith("![Banner do capítulo"):
            orig_alt = ln[2:ln.index("](")]
            lines[i] = f"![{orig_alt}](../assets/banners-gravura/cap-{n}.jpg)"
            break
    else:
        raise SystemExit(f"cap {n}: banner não encontrado")
    for (c, kind, a, b) in E:
        if c != n:
            continue
        if kind == "line":
            idx = [i for i, ln in enumerate(lines) if ln.startswith(a)]
            assert len(idx) == 1, (n, a, len(idx))
            lines[idx[0]] = b
        else:
            txt = "\n".join(lines)
            assert txt.count(a) == 1, (n, a[:60], txt.count(a))
            lines = txt.replace(a, b).split("\n")
    out, skip = [], 0
    for i, ln in enumerate(lines):
        if skip:
            skip -= 1
            if ln.strip() == "" or (ln.startswith("*") and ln.rstrip().endswith("*")):
                continue
        if ln.startswith("![") and any(k in ln for k in DROP.get(n, [])):
            skip = 2   # a linha em branco e o crédito em itálico que seguem
            continue
        out.append(ln)
    txt = "\n".join(out).replace("](inputs/", "](../inputs/").replace("](assets/", "](../assets/")
    txt = re.sub(r"\n{3,}", "\n\n", txt)
    open(os.path.join(V2, f"capitulo-{n}.md"), "w", encoding="utf-8").write(txt)
    return txt


def md_to_html(txt):
    h = markdown.markdown(txt, extensions=["extra", "sane_lists", "nl2br"])
    # imagem + crédito em itálico -> <figure> com legenda curta (sem repetir a descrição longa)
    h = re.sub(r'<p><img alt="([^"]*)" src="([^"]*)"\s*/?></p>\s*<p><em>(.*?)</em></p>',
               lambda m: f'<figure><img src="{m.group(2)}" alt="{m.group(1)}"><figcaption>{m.group(3)}</figcaption></figure>', h, flags=re.S)
    h = re.sub(r'<p><img alt="([^"]*)" src="([^"]*)"\s*/?></p>', r'<figure><img src="\2" alt="\1"></figure>', h)
    return h


CSS = """@page { margin: 18mm 16mm; }
@page capa { size: 6in 9in; margin: 0; }
.capa { page: capa; width: 6in; height: 9in; margin: 0 auto; break-after: page; }
.capa img { display: block; width: 6in; height: 9in; max-width: none; max-height: none; }
body { font-family: "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif; font-size: 11.5pt; line-height: 1.55; color: #1a1a1a; max-width: 720px; margin: 0 auto; }
h1 { font-size: 22pt; margin: 0 0 1em; text-align: center; }
h2 { font-size: 14pt; margin: 1.6em 0 0.7em; break-after: avoid; }
p { margin: 0 0 0.85em; text-align: justify; hyphens: auto; }
blockquote { margin: 1em 2em; color: #333; font-style: italic; border-left: 2px solid #bbb; padding-left: 1em; }
figure { margin: 1.2em 0; break-inside: avoid; text-align: center; }
img { max-width: 100%; max-height: 420px; height: auto; }
section.cap > figure:first-of-type img { max-height: 560px; }
figcaption { font-size: 8.5pt; color: #666; margin-top: 0.4em; font-style: italic; }
pre { white-space: pre-wrap; font-size: 9.5pt; background: #f3f1ec; padding: 8px 10px; }
hr { border: none; border-top: 1px solid #ddd; margin: 1.4em 0; }
.rosto { height: 240mm; display: flex; flex-direction: column; justify-content: center; text-align: center; break-after: page; }
.rosto h1 { font-size: 36pt; letter-spacing: 0.04em; margin-bottom: 0.3em; }
.rosto p { text-align: center; color: #555; }
.toc { break-after: page; } .toc h2 { text-align: center; font-size: 18pt; }
.toc ol { list-style: none; margin: 2em 0 0; padding: 0; } .toc li { font-size: 13pt; margin-bottom: 0.7em; }
.toc a { text-decoration: none; color: #1a1a1a; }
section.cap { break-before: page; }"""


def main():
    secs, toc = [], []
    for n in range(1, 8):
        txt = build_md(n)
        secs.append(f'<section class="cap" id="cap{n}">\n{md_to_html(txt)}\n</section>')
        toc.append(f'<li><a href="#cap{n}">{n}. {TITLES[n]}</a></li>')
    page = (f'<!DOCTYPE html>\n<html lang="pt-BR"><head><meta charset="utf-8"/><title>Eternos Mutáveis · 3.0</title><style>\n{CSS}\n</style></head><body>\n'
            f'<div class="capa"><img src="../capa/v2/capa-d-frente.jpg" alt="Capa: Eternos Mutáveis, de Laércio Germano. Peça de dominó em pé: metade de cima preta com bola branca e a palavra ETERNOS; metade de baixo branca com bola preta e a palavra MUTÁVEIS."/></div>\n'
            f'<div class="rosto"><h1>Eternos Mutáveis</h1><p>A superação adâmica</p><p>Laércio Germano</p><p>Versão 3.0</p></div>\n'
            f'<div class="toc"><h2>Sumário</h2><ol>{"".join(toc)}</ol></div>\n' + "\n".join(secs) + "\n</body></html>")
    out = os.path.join(V2, "eternos-mutaveis-v3.html")
    open(out, "w", encoding="utf-8").write(page)
    if "--pdf" in sys.argv:
        subprocess.run(["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
                        "--virtual-time-budget=20000", f"--print-to-pdf={os.path.join(V2, 'eternos-mutaveis-v3.pdf')}", "file://" + out],
                       check=True, stderr=subprocess.DEVNULL)
    print("ok", out)


if __name__ == "__main__":
    main()

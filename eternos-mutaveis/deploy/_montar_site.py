#!/usr/bin/env python3
"""Monta o site do Eternos Mutáveis com TODAS as versões e um seletor para escolher qual ler.

Saída (padrão /tmp/eternos-mutaveis-deploy, ou o 1º argumento):
  index.html  = versão mais recente (5.0)
  v5.html, v4.html, v3.html, v2.html, v1.html = cada versão, no mesmo formato (música, sumário lateral etc.)
  + só os arquivos referenciados (assets/, capa/, inputs/imagens/).
Em cada página entra um seletor "Versão X ▾" no canto superior esquerdo da capa; ele rola junto com a capa e some ao descer.

Uso: python3 deploy/_montar_site.py [DEST]   e depois o rsync de deploy/README.md.
"""
import os, re, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST = sys.argv[1] if len(sys.argv) > 1 else "/tmp/eternos-mutaveis-deploy"

VERSOES = [  # (arquivo no site, fonte, rótulo, descrição curta)
    ("v5.html", "livro-v5.html", "5.0", "obras de arte na abertura, revisão de estilo"),
    ("v4.html", "livro-v4.html", "4.0", "acréscimos, nota do autor e apêndices"),
    ("v3.html", "livro-v3.html", "3.0", "texto original, banners em gravura"),
    ("v2.html", "livro-v2.html", "2.0", "pranchas renascentistas"),
    ("v1.html", "livro-v1.html", "1.0", "primeira versão, banners coloridos"),
]
ATUAL = VERSOES[0][0]


def seletor(atual):
    opts = "".join(f'<option value="{"./" if a == ATUAL else a}"{" selected" if a == atual else ""}>Versão {r}{" · atual" if a == ATUAL else ""} — {d}</option>'
                   for a, _, r, d in VERSOES)
    rot = next(r for a, _, r, _ in VERSOES if a == atual)
    return f'''<div id="versao" title="Escolher a versão do livro"><label for="versao-sel">Versão {rot} <span aria-hidden="true">▾</span></label>
<select id="versao-sel" aria-label="Versão do livro" onchange="location.href=this.value">{opts}</select></div>
<style>#versao{{position:absolute;top:14px;left:14px;z-index:30;font-family:"Cormorant Garamond",Georgia,serif;font-size:15px;letter-spacing:.04em}}
#versao label{{display:block;padding:6px 12px;border-radius:999px;background:rgba(20,20,20,.72);color:#F4F2EC;border:1px solid rgba(244,242,236,.25);pointer-events:none}}
#versao select{{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;font-size:16px}}</style>
'''


def refs(html):
    for m in re.finditer(r'(?:src|href)="([^"#:?]+)"', html):
        p = m.group(1)
        if not p.startswith(("http", "/", "data")) and not p.endswith(".html"):
            yield p
    for m in re.finditer(r'url\((["\']?)([^)"\']+)\1\)', html):
        if not m.group(2).startswith(("http", "data")):
            yield m.group(2)
    for m in re.finditer(r'["\'](assets/[^"\']+\.(?:mp3|jpg|png|ogg))["\']', html):
        yield m.group(1)


def main():
    shutil.rmtree(DEST, ignore_errors=True)
    os.makedirs(DEST)
    arquivos = set()
    for alvo, fonte, _, _ in VERSOES:
        html = open(os.path.join(ROOT, fonte), encoding="utf-8").read()
        html = html.replace("<body>", "<body>\n" + seletor(alvo), 1)
        assert "versao-sel" in html, fonte
        open(os.path.join(DEST, alvo), "w", encoding="utf-8").write(html)
        if alvo == ATUAL:
            open(os.path.join(DEST, "index.html"), "w", encoding="utf-8").write(html)
        arquivos.update(refs(html))
    faltando = []
    for p in sorted(arquivos):
        src = os.path.join(ROOT, p)
        if not os.path.isfile(src):
            faltando.append(p)
            continue
        os.makedirs(os.path.dirname(os.path.join(DEST, p)), exist_ok=True)
        shutil.copy2(src, os.path.join(DEST, p))
    total = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(DEST) for f in fs)
    print(f"ok {DEST}: {len(VERSOES)} versões, {len(arquivos) - len(faltando)} arquivos, {total / 1e6:.0f} MB")
    if faltando:
        print("FALTANDO:", *faltando, sep="\n  ")


if __name__ == "__main__":
    main()

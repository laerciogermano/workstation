#!/usr/bin/env python3
"""RolêGo · amostra do tema “pôr do sol neon” (clima de ../../image copy.png, arte desenhada do zero).
Gera posts/*.png, pecas/*.png, o HTML e o PDF (A4 paisagem: capa, tema, peças e posts).
Precisa de Pillow e do Chrome. Rodar: python3 -B _build.py   (--no-artes reaproveita os PNGs)"""
import io, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _artes import *  # noqa: E402,F403
from _common import pdf  # noqa: E402

NOME = "amostra-sunset-neon-rolego"
for d in ("_src", "artes", "pecas", "posts"):
    os.makedirs(os.path.join(OUT, d), exist_ok=True)

if "--no-artes" not in sys.argv:
    render("capa", 1122, 794, capa(), "artes", 2)
    render("elementos", 1920, 450, elementos(), "artes")
    for nome, _, fn, w, h in PECAS:
        render(nome, w, h, fn(), "pecas")
    for nome, _, fn in POSTS:
        render(nome, 1080, 1080, fn(), "posts")


def im(pasta, nome, largura=None, q=88):
    """PNG → JPEG embutido (o PDF fica leve)."""
    i = Image.open(os.path.join(OUT, pasta, nome + ".png")).convert("RGB")
    if largura and i.width > largura:
        i = i.resize((largura, round(i.height * largura / i.width)), Image.LANCZOS)
    b = io.BytesIO()
    i.save(b, "JPEG", quality=q, optimize=True)
    return dados(b.getvalue(), "image/jpeg")


def pag(n, rot, inner, style=""):
    rodape = f'<div class="foot"><span>RolêGo · tema pôr do sol neon · {rot}</span><span>{n}</span></div>' if n > 1 else ""
    return f'<section class="page" style="{style}">{inner}{rodape}</section>'


def cabeca(olho, titulo):
    return f'<div class="eyebrow">{olho}</div><h2>{titulo}</h2>'


CORES = [("Noite", NOITE, "céu alto e fundo"), ("Uva", UVA, "céu"), ("Roxo neon", ROXO, "céu e prédios"), ("Magenta", MAGENTA, "borda e botão"), ("Rosa neon", ROSA, "luz, faixa, destaque"),
         ("Coral", CORAL, "céu baixo"), ("Pôr do sol", LARANJA, "horizonte"), ("Sol", SOL, "sol, preço, luzes"), ("Ciano", CIANO, "Go do logo e etiqueta"), ("Preto uva", "#07020D", "faixa de título"), ("Branco", "#FFFFFF", "título")]

p_capa = pag(1, "capa", f'<img src="{im("artes", "capa", 2244, 90)}" style="position:absolute;inset:0;width:100%;height:100%">', "padding:0")

sw = "".join(f'<div><i style="background:{h}"></i><b>{n}</b><code>{h}</code><span>{u}</span></div>' for n, h, u in CORES)
tipos = [('<span class="ch" style="font-size:44px">Sexta tem rolê</span>', "Título · Changa One itálico", "Caixa alta, dentro da faixa de pincel ou com brilho rosa."),
         ('<span style="font:38px Damion,cursive;color:#FF3D9A;padding-right:8px">Viva o rolê</span>', "Assinatura · Damion", "Pedestal da peça Go, legenda de foto. Poucas palavras."),
         ('<span style="font-size:19px;font-weight:600">Largo da Batata · 600 m</span>', "Texto · Poppins", "Endereço, horário, apoio. Com sombra sobre o cenário.")]
tp = "".join(f'<div class="tp"><div class="ex">{e}</div><b>{a}</b><span>{b}</span></div>' for e, a, b in tipos)
receita = [("Fundo", "o pôr do sol: céu, cidade, roda-gigante, palmeiras."), ("Chão", "a mesa de madeira segura os objetos."), ("Título", "uma faixa de pincel por peça, com uma palavra em rosa."),
           ("Objeto", "um herói (peça Go, caixa, foto ou celular) e até dois acessórios."), ("Logo", "a gomosa, branca com Go ciano; no branco, tinta com Go magenta.")]
p_tema = pag(2, "cores e elementos", cabeca("O tema", "Pôr do sol neon") + f'<div class="sw">{sw}</div><img src="{im("artes", "elementos")}" style="width:100%;border-radius:12px;margin-top:6px">'
             f'<div style="display:grid;grid-template-columns:1.7fr 1fr;gap:22px;margin-top:4px"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">{tp}</div>'
             f'<ul>{"".join(f"<li><b>{a}:</b> {b}</li>" for a, b in receita)}</ul></div>')


def peca(nome, rot, w):
    return f'<div><img src="{im("pecas", nome, 1500)}" style="width:{w}px"><span>{rot}</span></div>'


rotulos = {p[0]: p[1] for p in PECAS}
p_pecas = pag(3, "peças", cabeca("Peças", "O tema aplicado")
              + f'<div class="pc" style="display:flex;gap:18px;align-items:flex-start">'
              f'<div style="display:flex;flex-direction:column;gap:10px;width:652px"><div style="display:flex;gap:18px">{peca("combo", rotulos["combo"], 406)}{peca("story", rotulos["story"], 228)}</div>{peca("banner", rotulos["banner"], 652)}</div>'
              f'<div style="display:flex;flex-direction:column;gap:10px">{peca("ingresso", rotulos["ingresso"], 368)}{peca("vitrine", rotulos["vitrine"], 368)}</div></div>')

cel = "".join(f'<div><img src="{im("posts", n, 900)}"><span>{t}</span></div>' for n, t, _ in POSTS)
p_posts = pag(4, "feed", cabeca("Redes · feed", "Posts 1080 × 1080") + f'<div class="pg">{cel}</div>')

CSS = TIPOS + """@page{size:297mm 210mm;margin:0}body{background:#222}
.page{width:297mm;height:210mm;padding:26px 42px;position:relative;overflow:hidden;page-break-after:always;display:flex;flex-direction:column;gap:9px;background:#09040F;color:#fff}
.eyebrow{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#FF8AC6}h2{font:italic 32px/1 'Changa One',sans-serif;text-transform:uppercase}
.foot{position:absolute;left:42px;right:42px;bottom:11px;display:flex;justify-content:space-between;font-size:8.5px;color:#8E80A6}
.sw{display:grid;grid-template-columns:repeat(11,1fr);gap:7px;margin-top:4px}.sw i{display:block;height:62px;border-radius:9px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.16)}.sw b{display:block;font-size:9px;margin-top:4px;white-space:nowrap}.sw code{display:block;font:8px ui-monospace,Menlo,monospace;color:#A99BC2}.sw span{display:block;font-size:7.8px;color:#8E80A6;line-height:1.3}
.tp{background:#14062B;border-radius:12px;padding:10px 12px}.tp .ex{height:62px;display:flex;align-items:center;white-space:nowrap;overflow:hidden}.tp b{display:block;font-size:10.5px}.tp>span{display:block;font-size:9px;color:#A99BC2;line-height:1.4}
ul{list-style:none;display:flex;flex-direction:column;gap:6px;font-size:10px;line-height:1.4;color:#D9CDEB}ul b{color:#FF8AC6}
.pc img{display:block;border-radius:13px}.pc span{display:block;font-size:9px;color:#A99BC2;margin-top:4px}
.pg{display:grid;grid-template-columns:repeat(3,306px);gap:8px 18px;justify-content:center}.pg img{display:block;width:306px;height:306px;border-radius:13px}.pg span{display:block;font-size:9px;font-weight:700;color:#A99BC2;letter-spacing:.05em;text-transform:uppercase;margin-top:4px}
"""
html = f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>RolêGo — tema pôr do sol neon</title><style>{CSS}</style></head><body>{p_capa}{p_tema}{p_pecas}{p_posts}</body></html>'
out_html = os.path.join(OUT, NOME + ".html")
open(out_html, "w").write(html)
pdf(out_html, os.path.join(OUT, NOME + ".pdf"))
print("ok 4 págs")

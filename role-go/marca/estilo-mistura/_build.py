#!/usr/bin/env python3
"""RolêGo · amostra da MISTURA entre ../image.png e ../estilo-viva-o-role, com todas as cores juntas.
Gera posts/*.png, o HTML e o PDF (A4 paisagem: capa, mistura, peças e posts). Precisa de Pillow e do Chrome.
Rodar: python3 _build.py"""
from _base import *
import _feed

NOME = "amostra-mistura-rolego"


def pag(n, rot, inner, cls="", style=""):
    return (f'<section class="page {cls}" style="{style}">{inner}<div class="foot"><span>RolêGo · amostra da mistura · {rot}</span><span>{n}</span></div></section>')


def cabeca(olho, titulo):
    return f'<div class="eyebrow">{olho}</div><h2>{titulo}</h2>'


# ---------------------------------------------------------------- 1 capa
def capa():
    inner = (f'<div class="ab" style="left:0;right:0;top:0;height:640px;background:url({multidao(2, 1400, ("y", 1, .5))}) center top/cover"></div>{facho(.65)}{facho(.35, "214,233,5", "100% 52%")}'
             f'{go(760, ESPECTRO, "position:absolute;right:-260px;top:150px;opacity:.55")}{arcos(330)}'
             f'<div class="ab" style="left:54px;top:40px">{logo(44)}</div>'
             f'<div class="ab" style="left:236px;top:50px">{kk("@rolego", 15, LIMA)}</div>'
             f'<div class="ab" style="left:208px;top:150px">{lettering(640)}</div>'
             f'<div class="ab" style="left:54px;bottom:58px">{pp("Os rolês da sua cidade,", 40)}<br>{pp("num " + cor("swipe.", CIANO), 40)}</div>'
             f'<div class="ab" style="right:54px;bottom:66px;display:flex;gap:10px;align-items:center">{kk("Samba", 15, CIANO)}{kk("Baile", 15, MAGENTA, "#fff")}{kk("Festival", 15, LIMA)}{kk("Rooftop", 15, "#fff")}'
             f'<span style="margin-left:10px">{pill("Bora?", 20)}</span></div>')
    return pag(1, "capa", inner, style=f"padding:0;background:{SUP}")


# ---------------------------------------------------------------- 2 a mistura
def mistura():
    sw = "".join(f'<div><i style="background:{h}"></i><b>{n}</b><code>{h}</code><em>{o}</em><span>{u}</span></div>' for n, h, o, u in CORES)
    dos_posts = (f'<div class="ex" style="background:{DEG}">{go(150, "#FFFFFF", "position:absolute;right:-34px;bottom:-38px;opacity:.2")}'
                 f'<div class="ab" style="left:18px;top:22px">{pp("Sexta tem<br>" + cor("rolê.", CIANO), 34)}</div><div class="ab" style="left:18px;bottom:18px">{pill("Bora", 14)}</div></div>')
    do_viva = (f'<div class="ex" style="background:#000"><div class="ab" style="left:0;right:0;top:0;height:230px;background:url({multidao(2, 800, ("y", 1, .45))}) center top/cover"></div>'
               f'<div class="ab" style="left:22px;bottom:30px">{lettering(260)}</div></div>')
    junto = (f'<div class="ex" style="background:{SUP}">{go(190, ESPECTRO, "position:absolute;right:-60px;top:10px;opacity:.6")}{galera(180, 2, .95)}{arcos(100)}'
             f'<div class="ab" style="left:18px;top:20px">{pp("Sexta tem", 32)}</div><div class="ab" style="left:8px;top:58px">{lettering(244, com_viva=False)}</div>'
             f'<div class="ab" style="right:14px;bottom:14px">{kk("SEX · 21h", 12)}</div></div>')
    col = lambda ex, t, itens: f'<div>{ex}<b>{t}</b><p>{itens}</p></div>'
    inner = (cabeca("A mistura", "Todas as cores, os dois conceitos") + f'<div class="sw">{sw}</div>'
             f'<div class="faixa" style="background:{FAIXA}"><span>Degradê da mistura: risco, G gigante e contornos</span></div>'
             f'<div class="mx">{col(dos_posts, "Dos posts", "Degradê violeta → roxo → anil · título Poppins itálico em caixa baixa · ciano no destaque · G gigante · tags e pílulas")}'
             f'<span class="op">+</span>{col(do_viva, "Do Viva o rolê", "Pincel lima · risco em degradê · arcos de canto · multidão com fumaça e luz · caixa alta condensada")}'
             f'<span class="op">=</span>{col(junto, "Juntos", "Poppins abre a frase, o pincel fecha · degradê com luz magenta e ciano · multidão sobe do rodapé · G em espectro · arcos triplos")}</div>')
    return pag(2, "cores e conceitos", inner)


# ---------------------------------------------------------------- 3 peças
def pecas():
    cap = lambda box, t: f'<div>{box}<div class="cap">{t}</div></div>'
    quad = (f'<div class="pc" style="width:392px;height:392px;background:{SUP}"><div class="ab" style="left:0;right:0;top:0;height:300px;background:url({multidao(2, 900, ("y", 1, .5))}) center top/cover"></div>'
            f'{facho()}{go(300, ESPECTRO, "position:absolute;right:-120px;bottom:-60px;opacity:.55")}{arcos(110)}'
            f'<div class="ab" style="left:16px;top:16px">{logo(20)}</div><div class="ab" style="left:36px;top:96px">{lettering(318)}</div>'
            f'<div class="ab" style="left:20px;bottom:18px">{pp("num " + cor("swipe.", CIANO), 22)}</div><div class="ab" style="right:16px;bottom:16px">{pill("Bora?", 12)}</div></div>')
    evento = (f'<div class="pc" style="width:340px;height:425px;background:#000"><div class="ab" style="left:0;right:0;top:0;height:336px;background:url({festa("neon-hexagono-roxo", 800)}) center 20%/cover"></div>{facho()}{facho(.4, "214,233,5", "100% 40%")}'
              f'<div class="ab" style="inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 30%,rgba(69,46,255,.7) 58%,rgba(26,11,85,.97) 75%,#000)"></div>'
              f'{go(210, ESPECTRO, "position:absolute;right:-90px;top:140px;opacity:.55")}{arcos(90)}<div class="ab" style="left:18px;top:16px">{logo(21)}</div>'
              f'<div class="ab" style="left:18px;top:50px;display:flex;gap:6px">{kk("SEX · 21h", 11)}{kk("grátis", 11, LIMA)}</div>'
              f'<div class="ab" style="left:18px;top:206px">{pp("Sexta tem", 38)}</div><div class="ab" style="left:28px;top:244px">{pn("SAMBA", 66)}</div><div class="ab" style="left:150px;top:296px">{risco(120)}</div>'
              f'<div class="ab" style="left:18px;bottom:62px;font-size:10.5px;color:#E4DEF7">Largo da Batata · a {cor("600 m", CIANO)} de você</div>'
              f'<div class="ab" style="left:18px;bottom:20px;display:flex;align-items:center;gap:16px"><div style="display:flex">{avatares(22, "#12082F")}</div></div><div class="ab" style="right:18px;bottom:16px">{pill("Bora? " + cor("32 vão", LIMA), 12)}</div></div>')
    story = (f'<div class="pc" style="width:240px;height:427px;background:{SUP}">{go(260, ESPECTRO, "position:absolute;right:-120px;top:30px;opacity:.55")}{galera(220, 1, .95)}'
             f'<div class="ab" style="left:0;right:0;bottom:0;height:90px;background:linear-gradient(transparent,rgba(5,0,20,.9))"></div>{arcos(80)}'
             f'<div class="ab" style="left:16px;top:16px">{logo(17)}</div><div class="ab" style="left:16px;top:96px">{pp("Qual é<br>o seu", 42)}</div>'
             f'<div class="ab" style="left:6px;top:188px">{lettering(224, [LIMA, LIMA, CIANO], com_viva=False)}</div>'
             f'<div class="ab" style="left:16px;right:16px;bottom:56px;display:flex;justify-content:center;gap:5px">{kk("Samba", 9)}{kk("Baile", 9, MAGENTA, "#fff")}{kk("Bar", 9, LIMA)}</div>'
             f'<div class="ab" style="left:0;right:0;bottom:14px;text-align:center">{pill("Ver rolês perto de mim", 11)}</div></div>')
    banner = (f'<div class="pc" style="width:660px;height:196px;background:{SUP}"><div class="ab" style="left:250px;right:0;top:0;bottom:0;background:url({multidao(1, 1000, ("x", .2, .5))}) center/cover"></div>'
              f'{go(250, ESPECTRO, "position:absolute;left:160px;top:-30px;opacity:.45")}{arcos(80)}'
              f'<div class="ab" style="left:22px;top:22px">{logo(26)}</div><div class="ab" style="left:22px;top:68px">{pp("Chega de sofrer", 25)}<br>{pp("pra decidir " + cor("onde sair.", CIANO), 25)}</div>'
              f'<div class="ab" style="left:22px;bottom:18px">{pill("Baixar o app", 11, LIMA, "#000")}</div><div class="ab" style="right:34px;top:24px">{lettering(210)}</div></div>')
    ingresso = (f'<div class="pc" style="width:340px;height:196px;background:{DEG}"><div class="ab" style="left:0;top:0;bottom:0;width:132px;background:url({festa("show-de-costas", 700)}) 30% center/cover"></div>'
                f'<div class="ab" style="left:128px;top:0;bottom:0;width:7px;background:linear-gradient(180deg,{",".join(ESPECTRO)})"></div>'
                f'{go(170, ESPECTRO, "position:absolute;right:-60px;bottom:-50px;opacity:.55")}{arcos(60)}'
                f'<div class="ab" style="left:150px;top:14px">{logo(15)}</div><div class="ab" style="left:150px;top:40px">{pp("Baile da", 26)}</div><div class="ab" style="left:158px;top:68px">{pn("LAJE", 50)}</div>'
                f'<div class="ab" style="left:150px;top:128px;font-size:9px;font-weight:600">{cor("SÁB 28/11 · 23h", CIANO)} · Vila Madalena</div>'
                f'<div class="ab" style="left:150px;bottom:14px">{pill("R$ 40 · 1 entrada", 10, LIMA, "#000")}</div></div>')
    inner = (cabeca("Peças", "A mistura aplicada")
             + f'<div style="display:flex;gap:15px;align-items:flex-start">{cap(quad, "Peça-mãe · feed 1:1")}{cap(evento, "Evento · feed 4:5")}{cap(story, "Story 9:16")}</div>'
             + f'<div style="display:flex;gap:15px;margin-top:2px">{cap(banner, "Banner de site e telão")}{cap(ingresso, "Ingresso")}</div>')
    return pag(3, "peças", inner)


# ---------------------------------------------------------------- 4 posts
def feed():
    cel = "".join(f'<div><img src="{dados(open(os.path.join(OUT, "posts", n + ".png"), "rb").read(), "image/png")}"><span>{t}</span></div>' for n, t, _ in _feed.POSTS)
    return pag(4, "feed", cabeca("Redes · feed", "Posts 1080 × 1080") + f'<div class="pg">{cel}</div>', "claro")


CSS = TIPOS + """@page{size:297mm 210mm;margin:0}body{background:#222}
.page{width:297mm;height:210mm;padding:30px 42px;position:relative;overflow:hidden;page-break-after:always;display:flex;flex-direction:column;gap:10px;background:#09070F;color:#fff}
.eyebrow{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#9CA3AF}h2{font-size:28px;font-weight:800;font-style:italic;letter-spacing:-.03em;line-height:1}
.foot{position:absolute;left:42px;right:42px;bottom:13px;display:flex;justify-content:space-between;font-size:8.5px;color:#A7A3BC;z-index:5}
.pc{position:relative;overflow:hidden;border-radius:16px;flex-shrink:0}.cap{font-size:9px;color:#9CA3AF;margin-top:4px}
.sw{display:grid;grid-template-columns:repeat(10,1fr);gap:8px;margin-top:4px}.sw i{display:block;height:74px;border-radius:10px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}
.sw b{display:block;font-size:9.5px;margin-top:4px}.sw code{display:block;font:8px ui-monospace,Menlo,monospace;color:#9CA3AF}.sw em{display:block;font-size:6.8px;font-style:normal;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#C9CDD6;margin:3px 0 1px;white-space:nowrap}.sw span{display:block;font-size:7.8px;color:#8B8AA0;line-height:1.3}
.faixa{height:34px;border-radius:99px;display:flex;align-items:center;justify-content:center}.faixa span{font-size:10px;font-weight:800;font-style:italic;color:#fff;background:rgba(0,0,0,.55);border-radius:99px;padding:3px 14px}
.mx{display:grid;grid-template-columns:1fr 26px 1fr 26px 1.15fr;gap:8px;align-items:start;margin-top:6px}.mx .ex{position:relative;overflow:hidden;border-radius:16px;height:340px}.mx b{display:block;font-size:12px;font-style:italic;margin-top:8px}.mx p{font-size:9.5px;line-height:1.5;color:#B9B6CC;margin-top:2px}
.op{font-size:30px;font-weight:800;font-style:italic;align-self:center;text-align:center;margin-top:-50px;color:#D6E905}
.page.claro{background:#F4F4F8;color:#05070F}.claro .eyebrow,.claro .foot{color:#5B6070}
.pg{display:grid;grid-template-columns:repeat(3,304px);gap:8px 20px;justify-content:center}.pg img{display:block;width:304px;height:304px;border-radius:14px}.pg span{display:block;font-size:9px;font-weight:700;color:#5B6070;letter-spacing:.05em;text-transform:uppercase;margin-top:5px}
"""

if "--no-posts" not in sys.argv:
    _feed.gerar()
paginas = [capa(), mistura(), pecas(), feed()]
html = f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>RolêGo — amostra da mistura</title><style>{CSS}</style></head><body>{"".join(paginas)}</body></html>'
out_html = os.path.join(OUT, NOME + ".html")
open(out_html, "w").write(html)
pdf(out_html, os.path.join(OUT, NOME + ".pdf"))
print("ok", len(paginas), "págs")

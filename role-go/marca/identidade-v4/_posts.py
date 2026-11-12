#!/usr/bin/env python3
"""Templates de post (1080×1080) e story (1080×1920) da RolêGo v4.
Gera _src/*.html (self-contained) e exporta PNG em posts/ e stories/ com o Chrome headless."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import *

CSS = FONT + """
*{box-sizing:border-box;margin:0;padding:0}html,body{width:100%;height:100%;overflow:hidden}
body{font-family:Poppins,sans-serif;-webkit-font-smoothing:antialiased}
.cv{position:relative;width:100%;height:100%;overflow:hidden;padding:84px;display:flex;flex-direction:column;justify-content:space-between;color:#fff}
.cv>*{position:relative;z-index:2}
.purple{background:""" + PURPLE + """}.black{background:#000}.mist{background:#F4F4F8;color:#05070F}
h1{font-weight:800;font-style:italic;letter-spacing:-.035em;line-height:.95}
h1 b,.hl{color:#00E5E5}.mist h1 b{color:#6539CB}
.slo{font-weight:800;font-style:italic;letter-spacing:-.02em;white-space:nowrap;line-height:1}.slo b{color:#00E5E5}.mist .slo b{color:#6539CB}
.row{display:flex;justify-content:space-between;align-items:flex-end}.top{display:flex;justify-content:space-between;align-items:center}
.handle{font-size:30px;font-weight:600;opacity:.8}
.tag{display:inline-block;background:#00E5E5;color:#000;font-weight:800;font-size:30px;border-radius:99px;padding:8px 26px;letter-spacing:.02em}
.btn{display:inline-block;background:""" + PURPLE + """;color:#fff;font-weight:800;font-style:italic;border-radius:99px;padding:22px 60px;font-size:40px}
.sg{position:absolute;z-index:1;pointer-events:none}
.photo{position:absolute;left:0;right:0;top:0;background-size:cover;background-position:center 35%;z-index:0}
.fade{position:absolute;inset:0;z-index:1}
.ppl{display:flex;align-items:center;font-size:30px;color:#9CA3AF}.ppl i{width:52px;height:52px;border-radius:50%;border:5px solid #000;margin-right:-16px;display:block}
.ppl i:nth-child(1){background:#9E19E9}.ppl i:nth-child(2){background:#00E5E5}.ppl i:nth-child(3){background:#452EFF}.ppl i:last-of-type{margin-right:22px}
"""

PH1, PH2 = uri("foto-multidao-1.jpg"), uri("foto-multidao-2.jpg")

POSTS = {}

POSTS["01-sexta-tem-role"] = f"""<div class="cv purple">
<img class="sg" src="{uri('v4-go-white.svg')}" style="width:1100px;right:-420px;bottom:-330px;opacity:.10">
<div class="top">{img('v4-go-white.svg', h=110)}<span class="handle">@rolego</span></div>
<h1 style="font-size:230px">Sexta<br>tem<br><b>rolê.</b></h1>
<div class="row">{slogan()}<span class="handle" style="font-size:34px">Os rolês da sua cidade, num swipe.</span></div></div>""".replace('class="slo "', 'class="slo" style="font-size:52px"')

POSTS["02-evento-foto"] = f"""<div class="cv black">
<div class="photo" style="height:640px;background-image:url({PH1})"></div>
<div class="fade" style="background:linear-gradient(180deg,rgba(101,57,203,.25) 0%,rgba(69,46,255,.45) 30%,rgba(0,0,0,.92) 55%,#000 66%)"></div>
<div class="top">{img('v4-lockup-dark.svg', h=62)}<span class="tag">SEX · 21h</span></div>
<div style="display:flex;flex-direction:column;gap:22px">
<h1 style="font-size:132px">Samba<br>no <b>Largo</b></h1>
<div style="font-size:36px;color:#9CA3AF">Largo da Batata · gratuito · a 600 m de você</div>
<div class="row" style="align-items:center"><div class="ppl"><i></i><i></i><i></i>32 vão · 3 amigos seus</div><span class="btn">Bora</span></div></div></div>"""

items = [("Samba no Largo", "21h · grátis", "600 m"), ("Baile da Laje", "23h · R$ 40", "1,2 km"),
         ("Jazz no Porão", "20h · R$ 25", "900 m"), ("Karaokê do Japa", "22h · grátis", "1,5 km"),
         ("Rooftop Pôr do Sol", "17h · R$ 30", "2 km")]
lst = "".join(f'<div style="display:flex;align-items:center;gap:34px;padding:20px 0;border-top:2px solid #1E1E25">'
              f'<span style="font-size:70px;font-weight:800;font-style:italic;color:#00E5E5;width:60px">{i + 1}</span>'
              f'<div style="flex:1"><div style="font-size:44px;font-weight:700">{n}</div><div style="font-size:28px;color:#9CA3AF">{m}</div></div>'
              f'<span style="font-size:30px;color:#9CA3AF">{d}</span></div>' for i, (n, m, d) in enumerate(items))
POSTS["03-top5-semana"] = f"""<div class="cv black" style="padding:76px 84px">
<h1 style="font-size:96px">5 rolês pra sexta<br>em <b>Pinheiros</b></h1>
<div>{lst}</div>
<div class="row" style="align-items:center">{img('v4-lockup-dark.svg', h=54)}<span class="handle">Salva pra não esquecer</span></div></div>"""

opts = [("A", "Samba de roda"), ("B", "Churrasco na laje"), ("C", "Parque com a galera"), ("D", "Sofá (não vale)")]
op = "".join(f'<div style="display:flex;align-items:center;gap:28px;background:rgba(255,255,255,.13);border-radius:28px;padding:24px 30px;font-size:42px;font-weight:600">'
             f'<span style="width:70px;height:70px;border-radius:50%;background:#fff;color:#6539CB;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:34px">{a}</span>{t}</div>' for a, t in opts)
POSTS["04-enquete"] = f"""<div class="cv purple">
<h1 style="font-size:116px">Qual é o seu rolê<br>de <b>domingo?</b></h1>
<div style="display:flex;flex-direction:column;gap:20px">{op}</div>
<div class="row" style="align-items:center"><span style="font-size:38px;font-weight:700;font-style:italic">Comenta a letra ↓</span>{img('v4-go-white.svg', h=80)}</div></div>"""

POSTS["05-frase"] = f"""<div class="cv black">
<img class="sg" src="{uri('v4-go-dark.svg')}" style="width:1000px;right:-470px;top:-220px;opacity:.22">
<div style="font-size:34px;font-weight:600;color:#9CA3AF">Real.</div>
<div><h1 style="font-size:92px;color:#fff">Decidir onde sair<br>levava mais tempo<br>que o próprio rolê.</h1>
<h1 style="font-size:92px;margin-top:40px"><b>Agora é um swipe.</b></h1></div>
<div class="row" style="align-items:center">{img('v4-lockup-dark.svg', h=56)}<span class="handle">rolego.com.br</span></div></div>"""

phone = f"""<div style="position:absolute;right:70px;top:150px;width:430px;height:900px;border-radius:66px;border:14px solid #15161C;background:#000;overflow:hidden;z-index:2">
<div style="height:380px;background:url({PH2}) center 30%/cover;position:relative"><div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,#000)"></div></div>
<div style="padding:0 30px;display:flex;flex-direction:column;gap:20px;margin-top:-30px;position:relative">
<span class="tag" style="align-self:flex-start;font-size:22px">HOJE · 22h</span>
<div style="font-size:46px;font-weight:800;font-style:italic;letter-spacing:-.02em;line-height:1">Baile da Laje</div>
<div style="display:flex;gap:14px;align-items:center;border:3px solid #00E5E5;border-radius:24px;padding:18px;font-size:26px;font-weight:700">{img('v4-go-white.svg', h=40)}Seu grupo deu match!</div>
<div class="ppl" style="font-size:22px"><i></i><i></i><i></i>Ana, Léo e Bia vão</div>
<div style="background:{PURPLE};border-radius:99px;padding:22px;text-align:center;font-size:30px;font-weight:800;font-style:italic">Bora pro rolê</div></div></div>"""
POSTS["06-feature-match"] = f"""<div class="cv purple">{phone}
<div style="width:520px"><h1 style="font-size:124px">Swipe.<br>Match.<br><b>Rolê.</b></h1></div>
<div style="width:500px;font-size:36px;line-height:1.3;font-weight:500">Seu grupo escolhe junto. Sem 200 mensagens no zap.</div>
<div>{img('v4-lockup-purple.svg', h=58)}</div></div>"""

shield = '<svg viewBox="0 0 24 24" width="150" height="150" fill="none" stroke="#00FF00" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>'
POSTS["07-seguranca"] = f"""<div class="cv black">
<div class="top"><span style="border:3px solid #00FF00;color:#00FF00;font-weight:800;font-size:28px;letter-spacing:.08em;border-radius:99px;padding:10px 26px">MODO SEGURANÇA</span>{shield}</div>
<h1 style="font-size:120px">Seus amigos<br>sabem onde<br>você <span style="color:#00FF00">tá.</span></h1>
<div style="font-size:38px;line-height:1.35;color:#C9CDD6;max-width:820px">Localização em tempo real só durante o rolê. Acabou, desligou.</div>
<div class="row" style="align-items:center">{img('v4-lockup-dark.svg', h=56)}<span class="handle">Volta segura também é rolê.</span></div></div>"""

POSTS["08-parceiro"] = f"""<div class="cv mist">
<div class="top">{img('v4-lockup-light.svg', h=60)}<span style="font-size:30px;font-weight:700;color:#6539CB">Novo parceiro</span></div>
<div style="display:flex;align-items:center;gap:60px">
<div style="width:380px;height:380px;flex-shrink:0;border-radius:50%;background:{PURPLE};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;box-shadow:0 0 0 14px #fff,0 0 0 17px #DCDDE5">{img('v4-go-white.svg', h=130)}<span style="color:#fff;font-weight:800;font-style:italic;font-size:42px">Tem rolê aqui.</span></div>
<h1 style="font-size:104px">Bar do Zé<br>agora é<br><b>parceiro.</b></h1></div>
<div class="row" style="align-items:center;font-size:34px"><span><b>10% off</b> pedindo pelo app · Pinheiros</span>{slogan()}</div></div>""".replace('class="slo "', 'class="slo" style="font-size:40px"')

POSTS["09-contagem"] = f"""<div class="cv black">
<div class="top"><span style="font-size:52px;font-weight:800;font-style:italic">Faltam</span><span class="tag">SÁB · 23h</span></div>
<div style="font-size:620px;font-weight:900;font-style:italic;letter-spacing:-.06em;line-height:.78;color:#00E5E5;margin-left:-20px">2</div>
<div class="row"><h1 style="font-size:84px">dias pro<br>Baile da Laje.</h1>{img('v4-go-dark.svg', h=130)}</div></div>"""

STORIES = {}
STORIES["01-slogan"] = f"""<div class="cv purple" style="padding:110px 84px">
<div class="photo" style="height:1060px;background-image:url({PH1})"></div>
<div class="fade" style="background:linear-gradient(180deg,rgba(101,57,203,.15) 0%,rgba(101,57,203,.6) 35%,#6539CB 55%,#452EFF 100%)"></div>
<div style="display:flex;gap:10px">{''.join('<i style="flex:1;height:6px;border-radius:4px;background:%s"></i>' % c for c in ('#fff', 'rgba(255,255,255,.4)', 'rgba(255,255,255,.4)'))}</div>
<h1 style="font-size:250px;margin-top:500px">Viva<br>o <b>rolê.</b></h1>
<div style="display:flex;flex-direction:column;align-items:center;gap:30px">{img('v4-lockup-purple.svg', h=90)}<span style="font-size:36px;font-weight:600">Arrasta pra cima ↑</span></div></div>"""

STORIES["02-evento-enquete"] = f"""<div class="cv purple" style="padding:110px 84px;justify-content:flex-start;gap:60px">
<img class="sg" src="{go_pattern()}" style="inset:0;width:100%;height:100%;object-fit:cover;opacity:1">
<div style="display:flex;gap:10px">{''.join('<i style="flex:1;height:6px;border-radius:4px;background:%s"></i>' % c for c in ('rgba(255,255,255,.4)', '#fff', 'rgba(255,255,255,.4)'))}</div>
<div style="display:flex;align-items:center;gap:22px">{img('v4-icon-avatar.svg', h=90)}<span style="font-size:36px;font-weight:700">rolego</span><span style="font-size:32px;opacity:.7">2 h</span></div>
<div style="background:#000;border-radius:56px;overflow:hidden;margin-top:30px">
<div style="height:560px;background:url({PH2}) center 30%/cover;position:relative"><div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,#000)"></div></div>
<div style="padding:10px 56px 60px;display:flex;flex-direction:column;gap:22px"><span class="tag" style="align-self:flex-start">SÁB · 23h</span>
<h1 style="font-size:120px">Baile da <b>Laje</b></h1><div style="font-size:38px;color:#9CA3AF">Vila Madalena · R$ 40 · 48 vão</div></div></div>
<div style="align-self:center;background:#fff;border-radius:40px;padding:36px;width:760px;box-shadow:0 20px 50px rgba(0,0,0,.3);color:#05070F;display:flex;flex-direction:column;gap:22px;transform:rotate(-3deg);margin-top:20px">
<div style="text-align:center;font-size:46px;font-weight:800;font-style:italic">Você vai?</div>
<div style="display:flex;gap:20px"><span style="flex:1;text-align:center;background:{PURPLE};color:#fff;border-radius:22px;padding:26px;font-size:40px;font-weight:800;font-style:italic">Bora!</span><span style="flex:1;text-align:center;background:#ECECF3;border-radius:22px;padding:26px;font-size:40px;font-weight:700">Hoje não</span></div></div></div>"""

chk = [("Grupo fechado", "Ana, Léo, Bia e você"), ("Ingresso no app", "QR já tá na Wallet"), ("Modo segurança ligado", "Amigos veem até você chegar"), ("Volta combinada", "Carona dividida às 3h")]
cl = "".join(f'<div style="display:flex;gap:34px;align-items:center;padding:34px 0;border-top:2px solid #1E1E25"><span style="width:84px;height:84px;border-radius:50%;background:#00E5E5;display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg viewBox="0 0 24 24" width="50" height="50" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><div><div style="font-size:52px;font-weight:700">{a}</div><div style="font-size:34px;color:#9CA3AF">{b}</div></div></div>' for a, b in chk)
STORIES["03-checklist"] = f"""<div class="cv black" style="padding:110px 84px">
<div style="display:flex;gap:10px">{''.join('<i style="flex:1;height:6px;border-radius:4px;background:%s"></i>' % c for c in ('rgba(255,255,255,.4)', 'rgba(255,255,255,.4)', '#fff'))}</div>
<h1 style="font-size:160px">Checklist<br>do <b>rolê</b></h1>
<div>{cl}</div>
<div style="display:flex;flex-direction:column;align-items:center;gap:26px">{img('v4-lockup-dark.svg', h=80)}<span class="slo" style="font-size:46px">Viva o <b>rolê.</b></span></div></div>"""


def build():
    src = os.path.join(HERE, "_src")
    for group, items, (w, h) in (("posts", POSTS, (1080, 1080)), ("stories", STORIES, (1080, 1920))):
        for name, body in items.items():
            hp = os.path.join(src, f"{group}-{name}.html")
            open(hp, "w").write(f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>{CSS}</style></head><body>{body}</body></html>')
            shoot(hp, os.path.join(HERE, group, f"{name}.png"), w, h)
            print("ok", group, name)


if __name__ == "__main__":
    build()

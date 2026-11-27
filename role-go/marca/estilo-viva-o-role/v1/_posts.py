# Seis posts 1080 × 1080 no estilo, com os mesmos assuntos de ../image.png. Roda via exec() dentro do _build.py,
# depois dos helpers (M, tit, pinc, traco, letras, logo, foto, multidao, facho, ci, dados...).

PCSS = """@import url('https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@1,90,900&family=Permanent+Marker&family=Poppins:ital,wght@0,500;0,600;0,700;1,800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}html,body{width:1080px;height:1080px;overflow:hidden}body{font-family:Poppins,sans-serif;color:#fff;-webkit-font-smoothing:antialiased}
.cv{position:relative;width:1080px;height:1080px;overflow:hidden;background:#000}.a{position:absolute}.ft{position:absolute}
.tt{display:inline-block;font-family:Archivo,sans-serif;font-style:italic;font-weight:900;font-stretch:90%;line-height:.98;text-transform:uppercase;letter-spacing:-.01em;white-space:nowrap}
.pn{display:inline-block;font-family:'Permanent Marker',cursive;line-height:1;transform:rotate(-6deg) skewX(-10deg);white-space:nowrap}
.pill{display:inline-block;border-radius:99px;padding:24px 58px;font-size:40px;font-weight:800;font-style:italic;white-space:nowrap}
.av{display:inline-block;width:56px;height:56px;border-radius:50%;margin-right:-16px;border:5px solid #000}
"""
SUP = f"linear-gradient(150deg,{VIOLETA} 0%,{ROXO} 100%)"  # superfície roxa
PORT = os.path.join(OUT, "posts")


def go(cor, h, extra=""):
    s = svg_text("v4-go-white.svg").replace('fill="#FFFFFF"', f'fill="{cor}"')
    return f'<img src="{dados(s.encode(), "image/svg+xml")}" style="height:{h}px;{extra}">'


def avs(borda="#000"):
    return "".join(f'<i class="av" style="background:{c};border-color:{borda}"></i>' for c in (LIMA, CIANO, MAGENTA))


def canto(w=260):
    return arco(M, w)


def p_frase_curta():
    return (f'<div class="cv" style="background:{SUP}">{go("#FFFFFF", 760, "position:absolute;right:-330px;bottom:-190px;opacity:.10")}{canto()}'
            f'<div class="a" style="left:76px;top:76px">{go("#FFFFFF", 92)}</div><div class="a" style="right:80px;top:92px;font-size:30px;font-weight:600;opacity:.8">@rolego</div>'
            f'<div class="a" style="left:76px;top:224px">{tit("SEXTA", 190)}<br>{tit("TEM", 190)}</div>'
            f'<div class="a" style="left:70px;top:566px">{letras(M, 610, com_viva=False)}</div>'
            f'<div class="a" style="left:76px;bottom:62px;font-size:31px;font-weight:600">Os rolês da sua cidade, num swipe.</div></div>')


def p_evento():
    return (f'<div class="cv"><div class="ft" style="left:0;right:0;top:0;height:760px;background:url({foto(M, "fotos-festa/neon-rosa-azul.jpg", 1100)}) center 22%/cover"></div>{facho(.4)}'
            f'<div class="ft" style="inset:0;background:linear-gradient(180deg,rgba(0,0,0,.28) 0%,rgba(0,0,0,0) 28%,rgba(0,0,0,.9) 62%,#000 72%)"></div>'
            f'<div class="a" style="left:72px;top:64px">{logo(M, 62)}</div>'
            f'<div class="a" style="right:72px;top:68px;background:{CIANO};color:#000;border-radius:99px;padding:12px 30px;font-size:32px;font-weight:700">SEX · 21h</div>'
            f'<div class="a" style="left:72px;top:488px">{tit("SAMBA NO", 118)}</div><div class="a" style="left:96px;top:598px">{pinc(M, "LARGO", 172)}</div>'
            f'<div class="a" style="left:400px;top:748px">{traco(M, 290)}</div>'
            f'<div class="a" style="left:72px;bottom:164px;font-size:34px;color:#D7D9E2">Largo da Batata · gratuito · a {ci("600 m")} de você</div>'
            f'<div class="a" style="left:72px;bottom:70px;display:flex;align-items:center;gap:36px"><div style="display:flex">{avs()}</div><span style="font-size:30px;color:#9CA3AF">32 vão · 3 amigos seus</span></div>'
            f'<div class="a" style="right:72px;bottom:56px">{pill(M, "Bora")}</div></div>')


def p_top5():
    itens = [("Samba no Largo", "21h · grátis", "600 m"), ("Baile da Laje", "23h · R$ 40", "1,2 km"), ("Jazz no Porão", "20h · R$ 25", "900 m"),
             ("Karaokê do Japa", "22h · grátis", "1,5 km"), ("Rooftop Pôr do Sol", "17h · R$ 30", "2 km")]
    lst = "".join(f'<div style="display:flex;align-items:center;gap:30px;height:114px;border-top:2px solid #25202F">'
                  f'<span class="tt" style="font-size:68px;color:{CIANO};width:62px">{i}</span><div style="flex:1"><div style="font-size:40px;font-weight:700;line-height:1.2">{n}</div>'
                  f'<div style="font-size:26px;color:#9CA3AF">{m}</div></div><span style="font-size:28px;color:#9CA3AF">{d}</span></div>' for i, (n, m, d) in enumerate(itens, 1))
    return (f'<div class="cv"><div class="ft" style="inset:0;background:radial-gradient(ellipse 70% 38% at 100% 0%,rgba(171,5,234,.55),rgba(0,0,0,0))"></div>{canto(220)}'
            f'<div class="a" style="left:72px;top:58px">{tit("5 ROLÊS PRA SEXTA", 80)}</div>'
            f'<div class="a" style="left:76px;top:150px;display:flex;align-items:baseline;gap:24px">{tit("EM", 80)}{pinc(M, "PINHEIROS", 100)}</div>'
            f'<div class="a" style="left:640px;top:236px">{traco(M, 200)}</div>'
            f'<div class="a" style="left:72px;right:72px;top:330px">{lst}</div>'
            f'<div class="a" style="left:72px;bottom:52px">{logo(M, 54)}</div><div class="a" style="right:72px;bottom:62px;font-size:28px;font-weight:600;color:#C9CDD6">Salva pra não esquecer</div></div>')


def p_enquete():
    op = "".join(f'<div style="display:flex;align-items:center;gap:28px;background:rgba(0,0,0,.28);border-radius:28px;padding:17px 30px;font-size:40px;font-weight:600">'
                 f'<span style="width:68px;height:68px;border-radius:50%;background:#fff;color:{ROXO};font-weight:700;display:flex;align-items:center;justify-content:center;font-size:32px">{a}</span>{t}</div>'
                 for a, t in (("A", "Samba de roda"), ("B", "Churrasco na laje"), ("C", "Parque com a galera"), ("D", "Sofá (não vale)")))
    return (f'<div class="cv" style="background:{SUP}">{canto(220)}'
            f'<div class="a" style="left:72px;top:62px">{tit("QUAL É O SEU", 90)}<br>{tit("ROLÊ DE", 90)}</div>'
            f'<div class="a" style="left:96px;top:252px">{pinc(M, "DOMINGO?", 130)}</div><div class="a" style="left:540px;top:372px">{traco(M, 270)}</div>'
            f'<div class="a" style="left:72px;right:72px;top:494px;display:flex;flex-direction:column;gap:16px">{op}</div>'
            f'<div class="a" style="left:72px;bottom:46px;font-size:34px;font-weight:800;font-style:italic">Comenta a letra ↓</div><div class="a" style="right:72px;bottom:40px">{go("#FFFFFF", 70)}</div></div>')


def p_frase_preto():
    return (f'<div class="cv">{go(ROXO, 820, "position:absolute;right:-420px;top:-190px;opacity:.5")}'
            f'<div class="ft" style="inset:0;background:radial-gradient(ellipse 80% 40% at 0% 100%,rgba(109,52,204,.45),rgba(0,0,0,0))"></div>'
            f'<div class="a" style="left:72px;top:72px;font-size:32px;font-weight:600;color:#9CA3AF">Real.</div>'
            f'<div class="a" style="left:72px;top:290px">{tit("DECIDIR ONDE SAIR", 90)}<br>{tit("LEVAVA MAIS TEMPO", 90)}<br>{tit("QUE O PRÓPRIO ROLÊ.", 90)}</div>'
            f'<div class="a" style="left:72px;top:640px">{tit("AGORA É UM", 90)}</div><div class="a" style="left:96px;top:722px">{pinc(M, "SWIPE.", 158)}</div>'
            f'<div class="a" style="left:330px;top:858px">{traco(M, 360)}</div>'
            f'<div class="a" style="left:72px;bottom:52px">{logo(M, 54)}</div><div class="a" style="right:72px;bottom:62px;font-size:28px;font-weight:600;color:#C9CDD6">rolego.com.br</div></div>')


def p_feature():
    fone = (f'<div class="a" style="right:64px;top:120px;width:440px;height:920px;border-radius:70px;border:14px solid #15121D;background:#000;overflow:hidden">'
            f'<div class="ft" style="left:0;right:0;top:0;height:430px;background:url({foto(M, "fotos-festa/mao-pra-cima.jpg", 700)}) center 30%/cover"></div>'
            f'<div class="ft" style="left:0;right:0;top:0;height:431px;background:linear-gradient(180deg,rgba(0,0,0,0) 45%,#000)"></div>'
            f'<div class="a" style="left:32px;right:32px;top:370px;display:flex;flex-direction:column;gap:22px">'
            f'<span style="align-self:flex-start;background:{CIANO};color:#000;border-radius:99px;padding:6px 20px;font-size:22px;font-weight:700">HOJE · 22h</span>'
            f'{tit("BAILE DA LAJE", 46)}<div style="display:flex;gap:16px;align-items:center;border:3px solid {CIANO};border-radius:24px;padding:18px;font-size:25px;font-weight:700">{go("#FFFFFF", 38)}Seu grupo deu match!</div>'
            f'<div style="display:flex;align-items:center;gap:30px"><div style="display:flex;zoom:.8">{avs()}</div><span style="font-size:21px;color:#9CA3AF">Ana, Léo e Bia vão</span></div>'
            f'<div style="background:{M["botao"]};border-radius:99px;padding:22px;text-align:center;font-size:30px;font-weight:800;font-style:italic">Bora pro rolê</div></div></div>')
    return (f'<div class="cv" style="background:{SUP}">{fone}'
            f'<div class="a" style="left:72px;top:96px">{tit("SWIPE.", 122)}<br>{tit("MATCH.", 122)}</div>'
            f'<div class="a" style="left:50px;top:380px">{letras(M, 470, com_viva=False)}</div>'
            f'<div class="a" style="left:72px;top:720px;width:430px;font-size:34px;line-height:1.35;font-weight:500">Seu grupo escolhe junto. Sem 200 mensagens no zap.</div>'
            f'<div class="a" style="left:72px;bottom:66px">{logo(M, 58)}</div></div>')


POSTS = [("01-sexta-tem-role", "Frase curta · roxo", p_frase_curta), ("02-evento-foto", "Evento · foto", p_evento), ("03-top5-semana", "Lista · top 5", p_top5),
         ("04-enquete", "Enquete", p_enquete), ("05-frase", "Frase · preto", p_frase_preto), ("06-feature-match", "Feature do app", p_feature)]


def gerar_posts():
    for nome, _, fn in POSTS:
        h = os.path.join(OUT, "_src", f"{nome}.html")
        open(h, "w").write(f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>{PCSS}</style></head><body>{fn()}</body></html>')
        shoot(h, os.path.join(PORT, f"{nome}.png"), 1080, 1080)
        print("ok post", nome)


def pg_posts(n):
    cel = "".join(f'<div><img src="{dados(open(os.path.join(PORT, nome + ".png"), "rb").read(), "image/png")}"><span>{t}</span></div>' for nome, t, _ in POSTS)
    return (f'<section class="page claro"><div class="eyebrow">Redes · feed</div><h2>Posts 1080 × 1080</h2><div class="pg">{cel}</div>{rodape(n, "feed")}</section>')

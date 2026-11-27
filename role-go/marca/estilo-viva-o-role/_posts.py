# Posts 1080 × 1080 e stories 1080 × 1920. Roda via exec() dentro do _build.py, depois dos helpers.

PCSS = """@import url('https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@1,90,900&family=Permanent+Marker&family=Poppins:ital,wght@0,500;0,600;0,700;0,800;1,700;1,800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}html,body{overflow:hidden}body{font-family:Poppins,sans-serif;color:#fff;-webkit-font-smoothing:antialiased}
.cv{position:relative;overflow:hidden;background:#000}.a{position:absolute}.ft{position:absolute}
.tt{display:inline-block;font-family:Archivo,sans-serif;font-style:italic;font-weight:900;font-stretch:90%;line-height:.98;text-transform:uppercase;letter-spacing:-.01em;white-space:nowrap}
.pn{display:inline-block;font-family:'Permanent Marker',cursive;line-height:1;transform:rotate(-6deg) skewX(-10deg);white-space:nowrap}
.bt{align-items:center;justify-content:center;border-radius:99px;font-weight:800;font-style:italic;white-space:nowrap;line-height:1.3}
.bd{display:inline-flex;align-items:center;border-radius:99px;font-weight:700;white-space:nowrap;line-height:1.5}
"""
PORT, STOR = os.path.join(OUT, "posts"), os.path.join(OUT, "stories")


def cv(corpo, fundo=PRETO, h=1080):
    return f'<div class="cv" style="width:1080px;height:{h}px;background:{fundo}">{corpo}</div>'


def a(pos, corpo):
    return f'<div class="a" style="{pos}">{corpo}</div>'


def img_topo(nome, h, pos="center 25%", w=1100):
    return f'<div class="ft" style="left:0;right:0;top:0;height:{h}px;background:url({foto(nome, w)}) {pos}/cover"></div>'


def veu(g):
    return f'<div class="ft" style="inset:0;background:{g}"></div>'


ESCURECE = "linear-gradient(180deg,rgba(0,0,0,.4) 0%,rgba(0,0,0,0) 26%,rgba(0,0,0,.9) 60%,#000 72%)"


# ------------------------------------------------------------- posts
def p01():
    return cv(go(BRANCO, 760, "position:absolute;right:-330px;bottom:-190px;opacity:.09") + arco(260)
              + a("left:76px;top:76px", go(AZUL, 92)) + a("right:80px;top:92px", badge("@rolego", "noite", 3))
              + a("left:76px;top:214px", f'{tit("SEXTA", 190)}<br>{tit("TEM", 190)}')
              + a("left:70px;top:540px", letras(520, com_viva=False))
              + a("left:76px;bottom:166px;font-size:31px;font-weight:600", "Os rolês da sua cidade, num swipe.")
              + a("left:76px;bottom:52px", btn("Ver rolês perto de mim", "azul", 2.8, "arrow")), SUP)


def p02():
    return cv(img_topo("neon-rosa-azul", 760) + facho(.4) + veu(ESCURECE)
              + a("left:72px;top:64px", logo(62))
              + a("right:72px;top:66px", badge("SEX · 21h", "azul", 3.3, "cal"))
              + a("left:72px;top:420px", badge("GRÁTIS", "amarelo", 3))
              + a("left:72px;top:496px", tit("SAMBA NO", 118)) + a("left:96px;top:606px", pinc("LARGO", 172))
              + a("left:420px;top:754px", traco(290))
              + a("left:72px;bottom:164px;display:flex;gap:18px", badge("Largo da Batata", "linha", 2.8, "pin") + badge("600 m", "linha", 2.8))
              + a("left:72px;bottom:68px;display:flex;align-items:center;gap:30px", f'<div style="display:flex">{avs(56)}</div><span style="font-size:30px;color:#C9CDD6">32 vão</span>')
              + a("right:72px;bottom:56px", btn("Bora", "azul", 4, "arrow")))


def p03():
    itens = [("Samba no Largo", "21h · grátis", "600 m"), ("Baile da Laje", "23h · R$ 40", "1,2 km"), ("Jazz no Porão", "20h · R$ 25", "900 m"),
             ("Karaokê do Japa", "22h · grátis", "1,5 km"), ("Rooftop Pôr do Sol", "17h · R$ 30", "2 km")]
    lst = "".join(f'<div style="display:flex;align-items:center;gap:28px;height:106px;background:{NOITE};border-radius:26px;padding:0 26px">'
                  f'<span style="width:64px;height:64px;border-radius:50%;background:{AZUL};color:{NOITE};display:flex;align-items:center;justify-content:center;font:italic 900 38px Archivo">{i}</span>'
                  f'<div style="flex:1"><div style="font-size:37px;font-weight:700;line-height:1.2">{n}</div><div style="font-size:24px;color:#B7AED6">{m}</div></div>{badge(d, "linha", 2.4, "pin")}</div>'
                  for i, (n, m, d) in enumerate(itens, 1))
    return cv(veu("radial-gradient(ellipse 80% 42% at 100% 0%,rgba(109,52,204,.75),rgba(0,0,0,0))") + arco(220)
              + a("left:72px;top:52px", tit("5 ROLÊS PRA SEXTA", 80))
              + a("left:76px;top:142px;display:flex;align-items:baseline;gap:24px", tit("EM", 80) + pinc("PINHEIROS", 100))
              + a("left:660px;top:226px", traco(190))
              + a("left:60px;right:60px;top:308px;display:flex;flex-direction:column;gap:12px", lst)
              + a("left:72px;bottom:46px", logo(54)) + a("right:60px;bottom:34px", btn("Salvar a lista", "azul", 2.7, "heart")))


def p04():
    def op(letra, t, sel=False):
        bg, fg, cb, cf = (AZUL, NOITE, NOITE, AZUL) if sel else ("rgba(22,10,51,.5)", BRANCO, AZUL, NOITE)
        return (f'<div style="display:flex;align-items:center;gap:28px;background:{bg};color:{fg};border-radius:99px;padding:15px 24px;font-size:39px;font-weight:600">'
                f'<span style="width:66px;height:66px;border-radius:50%;background:{cb};color:{cf};font-weight:800;display:flex;align-items:center;justify-content:center;font-size:31px">{letra}</span>'
                f'<span style="flex:1">{t}</span>{ic("check", 50, NOITE, esp=3) if sel else ""}</div>')
    ops = op("A", "Samba de roda", True) + op("B", "Churrasco na laje") + op("C", "Parque com a galera") + op("D", "Sofá (não vale)")
    return cv(arco(220) + a("left:72px;top:62px", f'{tit("QUAL É O SEU", 90)}<br>{tit("ROLÊ DE", 90)}')
              + a("left:96px;top:252px", pinc("DOMINGO?", 130)) + a("left:560px;top:372px", traco(250))
              + a("left:72px;right:72px;top:494px;display:flex;flex-direction:column;gap:16px", ops)
              + a("left:72px;bottom:46px;font-size:34px;font-weight:800;font-style:italic", f'Comenta a letra {az("↓")}') + a("right:72px;bottom:40px", go(AZUL, 70)), SUP)


def p05():
    return cv(go(ROXO, 820, "position:absolute;right:-420px;top:-190px;opacity:.55")
              + veu("radial-gradient(ellipse 80% 44% at 0% 100%,rgba(109,52,204,.6),rgba(0,0,0,0))")
              + a("left:72px;top:72px", badge("Papo reto", "azul", 3))
              + a("left:72px;top:238px", f'{tit("DECIDIR ONDE SAIR", 90)}<br>{tit("LEVAVA MAIS TEMPO", 90)}<br>{tit("QUE O PRÓPRIO ROLÊ.", 90)}')
              + a("left:72px;top:586px", tit("AGORA É UM", 90, AZUL)) + a("left:96px;top:668px", pinc("SWIPE.", 158))
              + a("left:340px;top:806px", traco(340))
              + a("left:72px;bottom:62px", logo(54)) + a("right:72px;bottom:48px", btn("Baixar o app", "azul", 3.1, "arrow")))


def p06():
    tela = (img_topo("mao-pra-cima", 430, "center 30%", 700) + '<div class="ft" style="left:0;right:0;top:0;height:431px;background:linear-gradient(180deg,rgba(0,0,0,0) 45%,#000)"></div>'
            + a("left:30px;right:30px;top:360px;display:flex;flex-direction:column;gap:20px",
                f'<div style="display:flex;gap:12px">{badge("HOJE · 22h", "azul", 2.2)}{badge("R$ 40", "roxo", 2.2)}</div>{tit("BAILE DA LAJE", 46)}'
                f'<div style="display:flex;gap:14px;align-items:center;background:{NOITE};border:3px solid {AZUL};border-radius:24px;padding:18px;font-size:25px;font-weight:700">{go(AZUL, 38)}Seu grupo deu match!</div>'
                f'<div style="display:flex;align-items:center;gap:28px"><div style="display:flex">{avs(44)}</div><span style="font-size:21px;color:#B7AED6">Ana, Léo e Bia vão</span></div>'
                f'<div style="display:flex;gap:26px;justify-content:center;margin-top:4px">{redondo("x", "contorno", 96)}{redondo("heart", "azul", 96)}{redondo("star", "amarelo", 96)}</div>'))
    fone = f'<div class="a" style="right:60px;top:110px;width:440px;height:920px;border-radius:70px;border:14px solid {NOITE};background:#000;overflow:hidden">{tela}</div>'
    return cv(fone + a("left:72px;top:96px", f'{tit("SWIPE.", 122)}<br>{tit("MATCH.", 122, AZUL)}')
              + a("left:50px;top:380px", letras(470, com_viva=False))
              + a("left:72px;top:690px;width:430px;font-size:34px;line-height:1.35;font-weight:500", "Seu grupo escolhe junto. Sem 200 mensagens no zap.")
              + a("left:72px;bottom:66px", logo(58)), SUP)


def p07():
    return cv(go(NOITE, 860, "position:absolute;right:-380px;top:-60px;opacity:.10") + arco(260, ROXO, 2.8)
              + a("left:72px;top:72px", logo(60, NOITE, ROXO))
              + a("left:72px;top:290px", f'{tit("PARTIU", 188, NOITE)}')
              + a("left:96px;top:478px", pinc("HOJE?", 220, ROXO)) + a("left:330px;top:694px", traco(400))
              + a("left:72px;bottom:214px;font-size:37px;font-weight:600;color:#160A33", "Tem 12 rolês começando perto de você.")
              + a("left:72px;bottom:70px", btn("Bora ver", "roxo", 3.4, "arrow")), AZUL)


def p08():
    nums = "".join(f'<div style="flex:1;background:{NOITE};border-radius:34px;padding:22px 0;text-align:center"><div style="font:italic 900 130px/1 Archivo;font-stretch:90%;color:{AZUL}">{v}</div>'
                   f'<div style="font-size:27px;font-weight:700;color:#B7AED6;letter-spacing:.12em">{r}</div></div>' for v, r in (("02", "DIAS"), ("09", "HORAS"), ("45", "MIN")))
    return cv(arco(260) + a("left:72px;top:72px", logo(60)) + a("left:72px;top:236px", tit("FALTA POUCO PRO", 94))
              + a("left:100px;top:340px", pinc("FESTIVAL", 168)) + a("left:560px;top:494px", traco(290))
              + a("left:72px;right:72px;top:640px;display:flex;gap:22px", nums)
              + a("left:72px;bottom:72px;display:flex;gap:18px", badge("SÁB · 14h", "azul", 3, "cal") + badge("Memorial", "linha", 3, "pin"))
              + a("right:72px;bottom:58px", btn("Lembrar", "azul", 3.1, "bell")), SUP)


def p09():
    return cv(img_topo("galera-brinde-azul", 780, "center", 1500) + facho(.3) + veu(ESCURECE)
              + a("left:72px;top:64px", logo(62)) + a("right:72px;top:68px", badge("Rolê em grupo", "azul", 3, "user"))
              + a("left:72px;top:520px", tit("CHAMA A", 130)) + a("left:96px;top:644px", pinc("GALERA", 172)) + a("left:460px;top:790px", traco(300))
              + a("left:72px;bottom:84px;display:flex;align-items:center;gap:30px", f'<div style="display:flex">{avs(64)}</div><span style="font-size:30px;color:#C9CDD6">5 amigos online</span>')
              + a("right:72px;bottom:64px", btn("Convidar", "azul", 3.7, "arrow")))


def p10():
    def dia(d, n, nome, info, selo, tipo):
        return (f'<div style="display:flex;align-items:center;gap:30px;background:{NOITE};border-radius:34px;padding:14px 28px">'
                f'<div style="width:118px;height:118px;border-radius:26px;background:{AZUL};color:{NOITE};text-align:center;padding-top:12px"><div style="font-size:24px;font-weight:700">{d}</div><div style="font:italic 900 62px/1 Archivo">{n}</div></div>'
                f'<div style="flex:1"><div style="font-size:36px;font-weight:700;line-height:1.35">{nome}</div><div style="font-size:23px;color:#B7AED6;line-height:1.4;margin-bottom:4px">{info}</div>{badge(selo, tipo, 1.8)}</div>{redondo("arrow", "contorno", 76)}</div>')
    lst = dia("SEX", "27", "Samba no Largo", "21h · Pinheiros", "Grátis", "amarelo") + dia("SÁB", "28", "Baile da Laje", "23h · Vila Madalena", "Lotando", "violeta") + dia("DOM", "29", "Feira + Jazz", "15h · Centro", "R$ 20", "roxo")
    return cv(veu("radial-gradient(ellipse 80% 40% at 0% 0%,rgba(109,52,204,.8),rgba(0,0,0,0))") + arco(220)
              + a("left:72px;top:56px", tit("SEU FIM DE", 88)) + a("left:90px;top:152px", pinc("SEMANA", 128)) + a("left:560px;top:250px", traco(230))
              + a("left:60px;right:60px;top:340px;display:flex;flex-direction:column;gap:16px", lst)
              + a("left:72px;bottom:52px", logo(54)) + a("right:60px;bottom:38px", btn("Ver agenda", "azul", 2.9, "cal")))


def p11():
    return cv(img_topo("show-de-costas", 720, "30% center", 1500) + veu("linear-gradient(180deg,rgba(22,10,51,.85),rgba(109,52,204,.15) 24%,rgba(109,52,204,.5) 45%,#6D34CC 66%)")
              + arco(240) + a("left:72px;top:64px", logo(62))
              + a("left:72px;top:450px", badge("1º LOTE ABERTO", "amarelo", 3))
              + a("left:72px;top:528px", tit("BAILE DA", 126)) + a("left:96px;top:646px", pinc("LAJE", 180)) + a("left:440px;top:770px", traco(260))
              + a("left:72px;bottom:70px", f'<div style="display:flex;gap:14px;margin-bottom:16px">{badge("SÁB 28/11 · 23h", "azul", 2.7, "cal")}</div><div style="font-size:46px;font-weight:800">R$ 40 <span style="font-size:28px;font-weight:600;opacity:.8">por pessoa</span></div>')
              + a("right:72px;bottom:70px", btn("Garantir ingresso", "azul", 3, "ticket")), ROXO)


def p12():
    est = "".join(redondo("star", "amarelo" if i < 4 else "contorno", 128) for i in range(5))
    tags = "".join(badge(t, k, 3.1) for t, k in (("Música boa", "azul"), ("Galera", "azul"), ("Preço justo", "linha"), ("Fila", "linha")))
    return cv(arco(260) + a("left:72px;top:72px", logo(60)) + a("left:72px;top:238px", tit('COMO FOI O', 112))
              + a("left:100px;top:398px", pinc("ROLÊ?", 190)) + a("left:640px;top:552px", traco(200))
              + a("left:0;right:0;top:628px;display:flex;justify-content:center;gap:34px", est)
              + a("left:0;right:0;top:800px;display:flex;justify-content:center;gap:18px", tags)
              + a("left:72px;right:72px;bottom:38px", btn("Enviar nota", "azul", 3.4, bloco=True)), f"linear-gradient(165deg,{ROXO},{NOITE} 90%)")


POSTS = [("01-sexta-tem-role", "Frase curta · roxo", p01), ("02-evento-foto", "Evento · foto", p02), ("03-top5-semana", "Lista · top 5", p03),
         ("04-enquete", "Enquete", p04), ("05-frase", "Frase · preto", p05), ("06-feature-match", "Feature do app", p06),
         ("07-partiu-hoje", "Chamada · azul (pontual)", p07), ("08-contagem", "Contagem regressiva", p08), ("09-chama-a-galera", "Convite · foto", p09),
         ("10-agenda", "Agenda do fim de semana", p10), ("11-ingresso-aberto", "Ingresso aberto", p11), ("12-nota-do-role", "Avaliação", p12)]


# ------------------------------------------------------------- stories 1080 × 1920
def s01():
    return cv(img_topo("neon-hexagono-roxo", 1400, "center top", 1100) + facho(.35) + veu("linear-gradient(180deg,rgba(0,0,0,.45),rgba(0,0,0,0) 24%,rgba(0,0,0,.92) 62%,#000 70%)")
              + a("left:72px;top:150px", logo(70)) + a("right:72px;top:158px", badge("HOJE", "azul", 3.8))
              + a("left:72px;top:1040px", tit("SEXTA TEM", 146)) + a("left:96px;top:1180px", pinc("SAMBA", 250)) + a("left:420px;top:1400px", traco(360))
              + a("left:72px;top:1540px;display:flex;gap:18px", badge("21h", "azul", 3.6, "cal") + badge("600 m", "linha", 3.6, "pin") + badge("Grátis", "amarelo", 3.6))
              + a("left:72px;right:72px;bottom:130px", btn("Bora pro rolê", "azul", 4.2, "arrow", bloco=True)), h=1920)


def s02():
    def op(t, pct, sel):
        return (f'<div style="position:relative;overflow:hidden;border-radius:44px;background:{NOITE};height:150px">'
                f'<div style="position:absolute;left:0;top:0;bottom:0;width:{pct}%;background:{AZUL if sel else ROXO}"></div>'
                f'<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:space-between;padding:0 46px;font-size:48px;font-weight:700;color:{BRANCO}">'
                f'<span style="color:{NOITE if sel else BRANCO}">{t}</span><span style="color:{AZUL if not sel else BRANCO}">{pct}%</span></div></div>')
    return cv(arco(380) + a("left:72px;top:150px", logo(70)) + a("left:72px;top:420px", f'{tit("ONDE A", 158)}<br>{tit("GENTE VAI", 158)}')
              + a("left:110px;top:760px", pinc("HOJE?", 260)) + a("left:520px;top:990px", traco(380))
              + a("left:72px;right:72px;top:1230px;display:flex;flex-direction:column;gap:28px", op("Samba no Largo", 58, True) + op("Baile da Laje", 42, False))
              + a("left:72px;right:72px;bottom:130px", btn("Votar", "azul", 4.2, bloco=True)), SUP, 1920)


def s03():
    return cv(img_topo("sorriso-neon", 1360, "62% center", 2000) + veu("linear-gradient(180deg,rgba(0,0,0,.4),rgba(0,0,0,0) 22%,rgba(0,0,0,.92) 62%,#000 70%)")
              + a("left:72px;top:150px", logo(70)) + a("left:72px;top:940px;transform:rotate(-4deg)", tit("QUAL O SEU", 138))
              + a("left:90px;top:1070px", letras(700, com_viva=False))
              + a("left:72px;right:72px;bottom:270px", btn("Ver rolês perto de mim", "azul", 4, "pin", bloco=True))
              + a("left:72px;right:72px;bottom:130px", btn("Criar um rolê", "contorno", 4, bloco=True)), h=1920)


def s04():
    foto_r = f'<div style="width:620px;height:620px;border-radius:50%;border:16px solid {AZUL};background:url({foto("galera-brinde-azul", 1400)}) 35% center/cover"></div>'
    return cv(go(BRANCO, 1100, "position:absolute;right:-520px;top:-120px;opacity:.08") + a("left:72px;top:150px", logo(70))
              + a("left:230px;top:300px", foto_r) + a("left:420px;top:870px", badge("SEU GRUPO", "azul", 4))
              + a("left:0;right:0;top:990px;text-align:center", tit("DEU", 170))
              + a("left:0;right:0;top:1130px;text-align:center", pinc("MATCH!", 270)) + a("left:390px;top:1350px", traco(340))
              + a("left:0;right:0;top:1520px;text-align:center;font-size:42px;font-weight:600", f'Baile da Laje · {az("hoje às 22h")}')
              + a("left:72px;right:72px;bottom:130px", btn("Abrir o chat do rolê", "azul", 4.2, "arrow", bloco=True)), SUP, 1920)


STORIES = [("01-evento", "Evento do dia", s01), ("02-votacao", "Votação do grupo", s02), ("03-qual-o-seu-role", "Pergunta", s03), ("04-match", "Match do grupo", s04)]


def gerar_posts():
    for lista, pasta, h, pref in ((POSTS, PORT, 1080, "post"), (STORIES, STOR, 1920, "story")):
        os.makedirs(pasta, exist_ok=True)
        for nome, _, fn in lista:
            fonte = os.path.join(OUT, "_src", f"{pref}-{nome}.html")
            open(fonte, "w").write(f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>{PCSS}</style></head><body>{fn()}</body></html>')
            shoot(fonte, os.path.join(pasta, f"{nome}.png"), 1080, h)
            print("ok", pref, nome, flush=True)


def mini(pasta, nome, w):
    im = Image.open(os.path.join(pasta, nome + ".png")).convert("RGB")
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO()
    im.save(b, "JPEG", quality=88, optimize=True)
    return dados(b.getvalue(), "image/jpeg")

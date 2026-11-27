"""Seis posts 1080 × 1080 com os assuntos de ../image.png, misturando os dois conceitos."""
from _base import *

PCSS = TIPOS + "html,body{width:1080px;height:1080px;overflow:hidden}.cv{position:relative;width:1080px;height:1080px;overflow:hidden;background:#000;color:#fff}"


def at(inner, **pos):
    st = ";".join(f"{k}:{v}px" for k, v in pos.items())
    return f'<div class="ab" style="{st}">{inner}</div>'


def frase_curta():
    return (f'<div class="cv" style="background:{SUP}">{go(900, ESPECTRO, "position:absolute;right:-360px;bottom:-90px;opacity:.55")}{galera(470, 2, .92)}'
            f'<div class="ab" style="left:0;right:0;bottom:0;height:220px;background:linear-gradient(transparent,rgba(5,0,20,.85))"></div>{arcos(330)}'
            + at(go(120), left=62, top=42) + at(kk("@rolego", 28, LIMA), left=206, top=82)
            + at(pp("Sexta", 190) + "<br>" + pp("tem", 190), left=66, top=204)
            + at(lettering(660, com_viva=False), left=44, top=552)
            + at(pp(f'Viva o {cor("rolê.", CIANO)}', 50), left=72, bottom=92)
            + at('<span style="font-size:30px;font-weight:600">Os rolês da sua cidade, num swipe.</span>', left=74, bottom=46) + "</div>")


def evento():
    return (f'<div class="cv"><div class="ab" style="left:0;right:0;top:0;height:820px;background:url({festa("neon-rosa-azul", 1100)}) center 22%/cover"></div>{facho()}{facho(.4, "214,233,5", "100% 38%")}'
            f'<div class="ab" style="inset:0;background:linear-gradient(180deg,rgba(0,0,0,.2) 0%,rgba(0,0,0,0) 30%,rgba(69,46,255,.62) 55%,rgba(26,11,85,.96) 70%,#000 92%)"></div>'
            f'{go(560, ESPECTRO, "position:absolute;right:-230px;top:340px;opacity:.5")}{arcos(300)}'
            + at(logo(66), left=70, top=62)
            + at(kk("SEX · 21h", 32), left=70, top=162) + at(kk("grátis", 32, LIMA), left=290, top=162)
            + at(pp("Samba no", 116), left=70, top=492) + at(pn("LARGO", 184), left=96, top=602) + at(risco(330), left=420, top=742)
            + at(f'<span style="font-size:34px;color:#E4DEF7">Largo da Batata · a {cor("600 m", CIANO)} de você</span>', left=72, bottom=170)
            + at(f'<div style="display:flex;align-items:center;gap:40px"><div style="display:flex">{avatares(58, "#12082F")}</div><span style="font-size:30px;color:#C9C2EA">32 vão · {cor("3 amigos seus", LIMA)}</span></div>', left=72, bottom=70)
            + at(pill("Bora", 44), right=70, bottom=58) + "</div>")


def top5():
    itens = [("Samba no Largo", "21h · grátis", "600 m", LIMA, "galera-brinde-azul"), ("Baile da Laje", "23h · R$ 40", "1,2 km", CIANO, "mao-pra-cima"),
             ("Jazz no Porão", "20h · R$ 25", "900 m", MAGENTA, "club-luzes-azuis"), ("Karaokê do Japa", "22h · grátis", "1,5 km", PESSEGO, "sorriso-neon"),
             ("Rooftop Pôr do Sol", "17h · R$ 30", "2 km", "#9C8CFF", "brinde-rooftop")]
    linhas = ""
    for i, (n, m, d, c, f) in enumerate(itens, 1):
        linhas += (f'<div style="display:flex;align-items:center;gap:26px;height:108px;margin-bottom:12px;border-radius:28px;padding:0 24px 0 28px;background:linear-gradient(90deg,rgba(109,52,204,.62),rgba(69,46,255,.2))">'
                   f'<span class="kk" style="font-size:74px;color:{c};width:52px;padding:0">{i}</span>'
                   f'<i style="width:80px;height:80px;border-radius:22px;border:3px solid {c};background:url({festa(f, 240)}) center 30%/cover;flex-shrink:0"></i>'
                   f'<div style="flex:1"><div class="pp" style="font-size:37px;line-height:1.15">{n}</div><div style="font-size:25px;color:#C9C2EA">{m}</div></div>'
                   f'<span style="font-size:25px;font-weight:700;border:3px solid {c};color:{c};border-radius:99px;padding:5px 18px">{d}</span></div>')
    return (f'<div class="cv"><div class="ab" style="inset:0;background:radial-gradient(ellipse 80% 46% at 100% 0%,rgba(246,12,237,.62),rgba(0,0,0,0)),radial-gradient(ellipse 90% 55% at 0% 100%,rgba(69,46,255,.65),rgba(0,0,0,0))"></div>'
            f'{go(720, ESPECTRO, "position:absolute;right:-300px;top:-180px;opacity:.4")}{arcos(230)}'
            + at(pp("5 rolês pra sexta", 88), left=62, top=50)
            + at(f'<div style="display:flex;align-items:baseline;gap:28px">{pp("em", 88, CIANO)}{pn("PINHEIROS", 104)}</div>', left=64, top=158)
            + at(risco(210), left=620, top=248)
            + at(f'<div style="width:960px">{linhas}</div>', left=60, top=332)
            + at(logo(52), left=64, bottom=44) + at(kk("Salva pra não esquecer", 27, LIMA), right=64, bottom=42) + "</div>")


def enquete():
    ops = [("A", "Samba de roda", LIMA, "galera-brinde-azul"), ("B", "Churrasco na laje", CIANO, "brinde-rooftop"),
           ("C", "Parque com a galera", MAGENTA, "amigas-por-do-sol"), ("D", "Sofá (não vale)", PESSEGO, "oculos-neon")]
    li = "".join(f'<div style="display:flex;align-items:center;gap:26px;height:98px;border-radius:99px;padding:0 14px;background:rgba(8,0,30,.62);border:3px solid {c}">'
                 f'<span class="kk" style="width:68px;height:68px;border-radius:50%;background:{c};color:#000;font-size:38px;padding:0;display:flex;align-items:center;justify-content:center">{a}</span>'
                 f'<span class="pp" style="font-size:40px;flex:1">{t}</span><i style="width:68px;height:68px;border-radius:50%;background:url({festa(f, 200)}) center 30%/cover"></i></div>' for a, t, c, f in ops)
    return (f'<div class="cv" style="background:{SUP}">{go(760, ESPECTRO, "position:absolute;right:-330px;top:-200px;opacity:.5")}{galera(360, 1, .75)}{arcos(250)}'
            + at(pp("Qual é o seu", 96) + "<br>" + pp("rolê de", 96), left=66, top=58)
            + at(pn("DOMINGO?", 146), left=100, top=262) + at(risco(280), left=560, top=370)
            + at(f'<div style="width:948px;display:flex;flex-direction:column;gap:18px">{li}</div>', left=66, top=480)
            + at(pp(f'Comenta a {cor("letra", LIMA)} ↓', 40), left=72, bottom=40) + at(go(96), right=62, bottom=16) + "</div>")


def frase_preto():
    return (f'<div class="cv"><div class="ab" style="inset:0;background:radial-gradient(ellipse 90% 52% at 0% 104%,rgba(69,46,255,.75),rgba(0,0,0,0)),radial-gradient(ellipse 55% 40% at 104% 78%,rgba(246,12,237,.45),rgba(0,0,0,0))"></div>'
            f'{go(1000, ESPECTRO, "position:absolute;right:-366px;top:-352px;opacity:.9")}{go_foto(940, multidao(2, 1400), "position:absolute;right:-336px;top:-322px", LIMA)}'
            f'<div class="ab" style="left:0;right:0;top:250px;height:300px;background:linear-gradient(rgba(0,0,0,0),rgba(0,0,0,.72) 55%,rgba(0,0,0,0))"></div>{arcos(240, "esq")}'
            + at(kk("Real.", 34, LIMA), left=70, top=190)
            + at(pp("Decidir onde sair", 90) + "<br>" + pp("levava mais tempo", 90) + "<br>" + pp("que o próprio rolê.", 90), left=68, top=348)
            + at(pp("Agora é um", 96, CIANO), left=68, top=654) + at(pn("SWIPE.", 160), left=100, top=752) + at(risco(300), left=520, top=830)
            + at(logo(56), left=70, bottom=46) + at(kk("rolego.com.br", 28, DEG, "#fff"), right=66, bottom=46) + "</div>")


def feature():
    cartas = "".join(f'<div class="ab" style="right:{r}px;top:{t}px;width:420px;height:780px;border-radius:64px;background:{bg};transform:rotate({a}deg)"></div>'
                     for r, t, a, bg in ((104, 196, -10, LIMA), (28, 150, 11, CIANO), (80, 160, -5, f"linear-gradient(160deg,{PESSEGO},{ROSA},{MAGENTA})")))
    fone = (f'<div class="ab" style="right:76px;top:130px;width:432px;height:900px;border-radius:70px;border:14px solid #0F0A1C;background:#000;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.45)">'
            f'<div class="ab" style="left:0;right:0;top:0;height:430px;background:url({festa("mao-pra-cima", 700)}) center 30%/cover"></div>{facho(.5)}'
            f'<div class="ab" style="left:0;right:0;top:0;height:431px;background:linear-gradient(180deg,rgba(0,0,0,0) 45%,#000)"></div>'
            f'<div class="ab" style="left:30px;right:30px;top:352px;display:flex;flex-direction:column;align-items:flex-start;gap:20px">{kk("HOJE · 22h", 24)}'
            f'<div>{pp("Baile da", 48)}<div style="margin-left:6px">{pn("LAJE", 76)}</div></div>'
            f'<div style="align-self:stretch;display:flex;gap:14px;align-items:center;border-radius:26px;padding:3px;background:{FAIXA}"><div style="flex:1;display:flex;gap:14px;align-items:center;background:#0B0714;border-radius:23px;padding:12px 16px;font-size:24px;font-weight:700">{go(54, CIANO)}Seu grupo deu match!</div></div>'
            f'<div style="display:flex;align-items:center;gap:34px"><div style="display:flex">{avatares(42)}</div><span style="font-size:20px;color:#9CA3AF">Ana, Léo e Bia vão</span></div>'
            f'<div style="align-self:stretch;text-align:center">{pill("Bora pro rolê", 30).replace("display:inline-block", "")}</div></div></div>')
    return (f'<div class="cv" style="background:{SUP}">{go(820, ESPECTRO, "position:absolute;left:-330px;bottom:-250px;opacity:.5")}{galera(330, 2, .6)}{cartas}{fone}{arcos(250, "esq")}'
            + at(pp("Swipe.", 126) + "<br>" + pp("Match.", 126, CIANO), left=68, top=150)
            + at(lettering(448, com_viva=False), left=36, top=434)
            + at('<span style="display:block;width:430px;font-size:34px;line-height:1.35;font-weight:600">Seu grupo escolhe junto. Sem 200 mensagens no zap.</span>', left=70, top=736)
            + at(logo(60), left=70, bottom=62) + "</div>")


POSTS = [("01-sexta-tem-role", "Frase curta", frase_curta), ("02-evento-foto", "Evento · foto", evento), ("03-top5-semana", "Lista · top 5", top5),
         ("04-enquete", "Enquete", enquete), ("05-frase", "Frase · preto", frase_preto), ("06-feature-match", "Feature do app", feature)]


def gerar():
    for nome, _, fn in POSTS:
        h = os.path.join(OUT, "_src", f"{nome}.html")
        open(h, "w").write(f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>{PCSS}</style></head><body>{fn()}</body></html>')
        shoot(h, os.path.join(OUT, "posts", f"{nome}.png"), 1080, 1080)
        print("ok post", nome)

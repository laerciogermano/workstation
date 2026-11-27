"""Composições do tema: capa, elementos, peças e os seis posts (assuntos de ../image.png)."""
import random, subprocess

from _cena import *
from _common import CHROME


def at(x, y, inner, extra=""):
    return f'<div class="ab" style="left:{x}px;top:{y}px;{extra}">{inner}</div>'


def centro(y, inner, extra=""):
    return f'<div class="ab" style="left:0;right:0;top:{y}px;display:flex;justify-content:center;{extra}">{inner}</div>'


def tag(t, tam, bg=ROSA, fg="#fff"):
    return f'<span class="tag" style="font-size:{tam}px;background:{bg};color:{fg};padding:{tam * .3:.0f}px {tam * .65:.0f}px;box-shadow:0 0 {tam * .6:.0f}px rgba(255,61,154,.55)">{t}</span>'


def botao(t, tam):
    return f'<span class="btn" style="font-size:{tam}px;padding:{tam * .38:.0f}px {tam * 1.2:.0f}px">{t}</span>'


def texto(t, tam, peso=700, cor="#fff"):
    return f'<span style="font-size:{tam}px;font-weight:{peso};color:{cor};text-shadow:0 2px 12px rgba(8,0,20,.95),0 0 4px rgba(8,0,20,.8);line-height:1.3;display:inline-block">{t}</span>'


def sombra(h, op=.9):
    return f'<div class="ab" style="left:0;right:0;bottom:0;height:{h}px;background:linear-gradient(transparent,rgba(8,2,18,{op}))"></div>'


def avatares(d):
    return "".join(f'<i style="display:inline-block;width:{d}px;height:{d}px;border-radius:50%;background:url({foto(n, 160)}) center 25%/cover;border:{d // 14}px solid #fff;margin-right:-{d // 3}px"></i>'
                   for n in ("risada-festa", "bar-loira", "sorriso-neon", "oculos-coracao"))


def qr(tam, seed=11):
    rng, n = random.Random(seed), 21
    c = tam / n
    cel = ""
    for y in range(n):
        for x in range(n):
            canto = (x < 7 and y < 7) or (x > 13 and y < 7) or (x < 7 and y > 13)
            fx, fy = x - 14 if x > 13 else x, y - 14 if y > 13 else y
            if (canto and (fx in (0, 6) or fy in (0, 6) or (2 <= fx <= 4 and 2 <= fy <= 4))) or (not canto and rng.random() < .46):
                cel += f"M{x * c:.2f} {y * c:.2f}h{c:.2f}v{c:.2f}h{-c:.2f}Z"
    return f'<div style="background:#fff;padding:{tam * .08:.0f}px;border-radius:10px"><svg width="{tam}" height="{tam}"><path d="{cel}" fill="#14041F"/></svg></div>'


def celular(w):
    k = w / 420
    return (f'<div style="width:{w}px;height:{w * 1.9:.0f}px;border-radius:{62 * k:.0f}px;border:{13 * k:.0f}px solid #0B0713;background:#0B0713;overflow:hidden;position:relative;box-shadow:0 0 0 {3 * k:.0f}px {ROSA},0 0 {46 * k:.0f}px rgba(255,61,154,.75),0 {26 * k:.0f}px {44 * k:.0f}px rgba(0,0,0,.55)">'
            f'<div style="height:{360 * k:.0f}px;background:url({foto("galera-brinde-azul", 800)}) 30% center/cover"></div><div style="position:absolute;left:0;right:0;top:{200 * k:.0f}px;height:{161 * k:.0f}px;background:linear-gradient(transparent,#0B0713)"></div>'
            f'<div style="position:absolute;left:{20 * k:.0f}px;top:{22 * k:.0f}px">{logo(round(30 * k))}</div>'
            f'<div style="position:absolute;left:{26 * k:.0f}px;right:{26 * k:.0f}px;top:{322 * k:.0f}px;display:flex;flex-direction:column;align-items:flex-start;gap:{18 * k:.0f}px">{tag("HOJE · 22h", 24 * k)}'
            f'<span class="ch" style="font-size:{58 * k:.0f}px;color:#fff">Baile da Laje</span>'
            f'<div style="align-self:stretch;border:{3 * k:.0f}px solid {CIANO};border-radius:{20 * k:.0f}px;padding:{14 * k:.0f}px;font-size:{22 * k:.0f}px;font-weight:700;color:#fff">Seu grupo deu match!</div>'
            f'<div style="display:flex;align-items:center;gap:{26 * k:.0f}px"><div style="display:flex">{avatares(round(46 * k))}</div><span style="font-size:{19 * k:.0f}px;color:#C9BEDD">Ana, Léo e Bia vão</span></div>'
            f'<div style="align-self:stretch;text-align:center">{botao("Bora pro rolê", 28 * k)}</div></div></div>')


def cartao_foto(w, h, nome, legenda, pos="center 25%"):
    return (f'<div style="width:{w}px;background:#fff;padding:14px 14px 0;border-radius:14px;transform:rotate(-4deg);box-shadow:0 0 36px rgba(255,61,154,.7),0 24px 40px rgba(0,0,0,.55)">'
            f'<div style="height:{h}px;border-radius:8px;background:url({foto(nome, 900)}) {pos}/cover"></div>'
            f'<div style="font:44px/78px Damion,cursive;color:#14041F;text-align:center;white-space:nowrap">{legenda}</div></div>')


# ---------------------------------------------------------------- capa
def capa():
    return (cena(1122, 794, seed=8, hz=.62, mesa=.775, helic=(.405, .46), roda=(.62, 1.0), sol=.47)
            + at(251, 8, faixa(620, "VIVA O", "ROLÊ", lw1=700, lw2=520))
            + at(38, 28, logo(40))
            + at(96, 316, caixa(268)) + at(706, 326, boneco(330)) + at(580, 556, taca(112)) + at(300, 668, oculos(226))
            + at(40, 744, texto("Identidade · tema pôr do sol neon", 17)) + at(962, 744, texto("rolego.com.br", 17)))


# ---------------------------------------------------------------- peças
def combo():
    return (cena(1080, 1080, seed=3, hz=.60, mesa=.775, helic=(.60, .425))
            + at(78, 0, faixa(924, "COMBO", "15%", "DE DESCONTO", lw1=780, lw2=800))
            + at(114, 434, caixa(414)) + at(590, 520, boneco(430)) + at(458, 826, taca(132)) + at(56, 962, oculos(272))
            + at(640, 1030, texto("2 ingressos · só nesta sexta · no app", 22)))


def story():
    return (cena(1080, 1920, seed=12, hz=.565, mesa=.715, helic=(.2, .365), roda=(.8, 1.05))
            + sombra(420, .85) + centro(80, logo(86))
            + at(40, 200, faixa(1000, "SEXTA", "ROLÊ", antes="TEM", lw1=720, lw2=660))
            + at(100, 880, caixa(480)) + at(560, 1136, boneco(450)) + at(520, 1030, taca(150)) + at(90, 1498, oculos(330))
            + centro(1700, botao("Ver rolês perto de mim", 52)) + centro(1830, texto("Os rolês da sua cidade, num swipe.", 36, 600)))


def banner():
    return (cena(1920, 640, seed=21, hz=.66, mesa=.82, helic=(.52, .2), roda=(.79, 1.15), sol=.55)
            + at(40, 34, faixa(850, "ONDE SAIR?", "BORA", "DECIDIR JUNTO", lw1=790, lw2=800))
            + at(120, 478, botao("Baixar o app", 42)) + at(520, 500, logo(60))
            + at(1090, 188, caixa(300)) + at(1496, 200, boneco(340)) + at(1415, 372, taca(112)) + at(880, 540, oculos(200)))


def ingresso():
    esq = (cena(1200, 600, seed=17, hz=.74, mesa=None, helic=(.1, .62), roda=(.55, 1.0), sol=.34, folhas=False, letreiros=False)
           + at(26, 24, faixa(720, "BAILE", "LAJE", antes="DA", lw1=660, lw2=520)) + at(44, 500, logo(54)))
    dir_ = (f'<div class="ab" style="right:0;top:0;bottom:0;width:384px;background:linear-gradient(180deg,#2B0A4F,#14041F);border-left:6px dashed {ROSA}"></div>'
            + at(866, 40, tag("SÁB 28/11 · 23h", 34)) + at(870, 118, texto("Vila Madalena<br>1 entrada · R$ 40", 28, 600)) + at(900, 236, qr(220))
            + at(870, 500, '<span class="ch" style="font-size:42px;color:#FFC857">Viva o rolê.</span>'))
    return esq + dir_ + f'<i class="ab" style="left:792px;top:-30px;width:60px;height:60px;border-radius:50%;background:#09040F"></i><i class="ab" style="left:792px;bottom:-30px;width:60px;height:60px;border-radius:50%;background:#09040F"></i>'


def vitrine():
    return (cena(900, 1096, seed=33, hz=.55, mesa=.70, helic=(.14, .34), roda=(.8, 1.0), sol=.5)
            + at(30, 10, faixa(840, "BRINDES", "ROLÊ", antes="DO", lw1=720, lw2=640))
            + at(64, 466, caixa(372)) + at(458, 560, boneco(396)) + at(412, 832, taca(124)) + at(76, 936, oculos(268))
            + at(522, 1038, texto("na festa e no app", 26)))


# ---------------------------------------------------------------- posts
def p_sexta():
    return (cena(1080, 1080, seed=5, hz=.62, mesa=.775, helic=(.86, .43), roda=(.2, 1.1), sol=.52)
            + sombra(190, .85) + at(50, 14, faixa(980, "SEXTA", "ROLÊ", antes="TEM", lw1=720, lw2=660))
            + at(305, 428, boneco(470)) + at(822, 700, taca(150)) + at(40, 808, oculos(250))
            + at(54, 996, logo(46)) + at(436, 1004, texto("Os rolês da sua cidade, num swipe.", 29, 600)))


def p_evento():
    return (cena(1080, 1080, seed=9, hz=.62, mesa=.775, helic=None, roda=(.86, 1.1), sol=.7)
            + sombra(250) + at(50, 8, faixa(980, "SAMBA", "LARGO", antes="NO", lw1=740, lw2=700))
            + at(82, 424, cartao_foto(500, 430, "neon-rosa-azul", "Largo da Batata", "center 22%"))
            + at(648, 470, tag("SEX · 21h", 52)) + at(648, 566, tag("Grátis", 46, CIANO, "#14041F"))
            + at(652, 668, texto("a 600 m de você<br>32 vão · 3 amigos seus", 29)) + at(656, 772, f'<div style="display:flex">{avatares(66)}</div>')
            + at(690, 888, botao("Bora", 60)) + at(54, 996, logo(46)))


def p_top5():
    itens = [("Samba no Largo", "21h · grátis", "600 m", "galera-brinde-azul"), ("Baile da Laje", "23h · R$ 40", "1,2 km", "mao-pra-cima"),
             ("Jazz no Porão", "20h · R$ 25", "900 m", "club-luzes-azuis"), ("Karaokê do Japa", "22h · grátis", "1,5 km", "sorriso-neon"), ("Rooftop Pôr do Sol", "17h · R$ 30", "2 km", "brinde-rooftop")]
    li = "".join(f'<div style="display:flex;align-items:center;gap:24px;height:106px;{"border-top:2px solid rgba(255,61,154,.35)" if i > 1 else ""}">'
                 f'<span class="ch" style="font-size:78px;width:56px;color:{ROSA};-webkit-text-stroke:5px #fff;paint-order:stroke fill">{i}</span>'
                 f'<i style="width:80px;height:80px;border-radius:18px;border:3px solid {ROSA};background:url({foto(f, 240)}) center 30%/cover"></i>'
                 f'<div style="flex:1;color:#fff"><div class="ch" style="font-size:43px">{n}</div><div style="font-size:23px;color:#D9C6EE;margin-top:4px">{m}</div></div>'
                 f'<span class="ch" style="font-size:30px;color:#FFC857">{d}</span></div>' for i, (n, m, d, f) in enumerate(itens, 1))
    return (cena(1080, 1080, seed=14, hz=.80, mesa=None, helic=(.9, .30), roda=(.1, 1.2), sol=.5, folhas=False, letreiros=False)
            + at(100, 2, faixa(880, "TOP 5", "SEXTA", antes="DE", lw1=640, lw2=640))
            + f'<div class="ab" style="left:60px;right:60px;top:384px;height:582px;background:rgba(14,3,30,.84);border:4px solid {ROSA};border-radius:30px;padding:20px 32px;box-shadow:0 0 40px rgba(255,61,154,.7)">{li}</div>'
            + at(60, 996, logo(48)) + at(660, 996, tag("Salva pra não esquecer", 32, CIANO, "#14041F")))


def p_enquete():
    ops = [("A", "Samba de roda", "galera-brinde-azul"), ("B", "Churrasco na laje", "brinde-rooftop"), ("C", "Parque com a galera", "amigas-por-do-sol"), ("D", "Sofá (não vale)", "oculos-neon")]
    cs = "".join(f'<div style="position:relative;height:224px;border-radius:24px;border:5px solid #fff;overflow:hidden;background:url({foto(f, 600)}) center 28%/cover;box-shadow:0 0 30px rgba(255,61,154,.75)">'
                 f'<div style="position:absolute;inset:0;background:linear-gradient(transparent 25%,rgba(14,3,30,.93))"></div>'
                 f'<span class="ch" style="position:absolute;left:14px;top:14px;width:68px;height:68px;border-radius:50%;background:{ROSA};color:#fff;font-size:44px;display:flex;align-items:center;justify-content:center;border:4px solid #fff">{a}</span>'
                 f'<span class="ch" style="position:absolute;left:20px;bottom:20px;font-size:40px;color:#fff">{t}</span></div>' for a, t, f in ops)
    return (cena(1080, 1080, seed=19, hz=.64, mesa=.80, helic=None, roda=(.86, 1.1))
            + sombra(200) + at(50, 0, faixa(980, "QUAL O SEU", "ROLÊ", "DE DOMINGO?", lw1=810, lw2=800))
            + f'<div class="ab" style="left:70px;right:70px;top:442px;display:grid;grid-template-columns:1fr 1fr;gap:24px">{cs}</div>'
            + centro(950, botao("Comenta a letra ↓", 44)) + at(40, 940, oculos(210)) + at(924, 868, taca(112)))


def p_frase():
    linhas = "".join(f'<div class="ch" style="font-size:{tam}px;color:#fff;filter:drop-shadow(0 5px 0 #14041F) drop-shadow(0 0 22px rgba(255,61,154,.95))">{t}</div>'
                     for t, tam in (("Decidir onde sair", 106), ("levava mais tempo", 106), ("que o próprio rolê.", 106)))
    return (cena(1080, 1080, seed=23, hz=.74, mesa=None, noite=True, helic=(.83, .09), roda=(.8, 1.35), sol=.35, folhas=True)
            + at(66, 78, tag("Real.", 40)) + f'<div class="ab" style="left:66px;top:178px;display:flex;flex-direction:column;gap:10px">{linhas}</div>'
            + sombra(330, .8) + at(60, 560, faixa(960, "AGORA É", "SWIPE.", antes="UM", lw1=680, lw2=680))
            + at(60, 992, logo(50)) + at(800, 1000, texto("rolego.com.br", 30)))


def p_feature():
    return (cena(1080, 1080, seed=27, hz=.62, mesa=.80, helic=(.1, .43), roda=(.28, 1.1), sol=.4)
            + sombra(210) + at(630, 404, celular(364), "transform:rotate(4deg)")
            + at(90, 0, faixa(900, "SWIPE. MATCH.", "ROLÊ.", lw1=850, lw2=520))
            + at(122, 448, boneco(372))
            + at(60, 910, texto("Seu grupo escolhe junto.<br>Sem 200 mensagens no zap.", 34)) + at(60, 1016, logo(40)))


POSTS = [("01-sexta-tem-role", "Frase curta", p_sexta), ("02-evento-foto", "Evento · foto", p_evento), ("03-top5-semana", "Lista · top 5", p_top5),
         ("04-enquete", "Enquete", p_enquete), ("05-frase", "Frase · noite", p_frase), ("06-feature-match", "Feature do app", p_feature)]
PECAS = [("combo", "Combo · feed 1:1", combo, 1080, 1080), ("story", "Story 9:16", story, 1080, 1920), ("banner", "Banner de site e telão", banner, 1920, 640), ("ingresso", "Ingresso", ingresso, 1200, 600), ("vitrine", "Vitrine · brindes", vitrine, 900, 1096)]


# ---------------------------------------------------------------- folha de elementos
def elementos():
    rot = lambda x, y, t: at(x, y, f'<span style="font:700 19px Poppins;letter-spacing:.1em;text-transform:uppercase;color:#C9B6E6">{t}</span>')
    quadro = lambda x, y, w, h, inner: f'<div class="ab" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;border-radius:22px;overflow:hidden;background:#14062B">{inner}</div>'
    return (quadro(0, 0, 590, 400, cena(590, 400, seed=31, hz=.78, mesa=None, helic=(.2, .22), roda=(.68, 1.5), sol=.42, folhas=False, letreiros=True)) + rot(0, 414, "Cenário: pôr do sol, cidade, água")
            + quadro(612, 0, 590, 400, at(25, 62, faixa(540, "COMBO", "15%", "OFF", lw1=720, lw2=520))) + rot(612, 414, "Faixa de título em pincel")
            + quadro(1224, 0, 696, 400, at(40, 52, boneco(260)) + at(342, 34, taca(140)) + at(448, 238, oculos(220))) + rot(1224, 414, "Peça Go, taça e óculos"))


def render(nome, w, h, corpo, pasta, escala=1):
    """HTML → PNG com o Chrome headless."""
    src = os.path.join(OUT, "_src", f"{nome}.html")
    open(src, "w").write(f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>{TIPOS}html,body{{width:{w}px;height:{h}px;overflow:hidden;background:#09040F}}</style></head><body>{corpo}</body></html>')
    png = os.path.join(OUT, pasta, f"{nome}.png")
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--force-device-scale-factor={escala}", f"--window-size={w},{h}",
                    "--virtual-time-budget=12000", f"--screenshot={png}", "file://" + src], check=True, capture_output=True)
    print("ok", pasta, nome)
    return png

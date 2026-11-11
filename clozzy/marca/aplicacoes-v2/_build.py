#!/usr/bin/env python3
"""Clozzy — documento de aplicações da marca (v2). Gera aplicacoes-marca-clozzy-v2.html (16:9, 1600x900 por página).
Usa os SVGs de ../identidade-oficial-v2/svg, as fontes de ../identidade-nova/fonts e as fotos de fotos/.
Superfícies claras = #FFFFFF (o creme #FFF6F0 saiu). Rodar: python3 _build.py && node shot.mjs --pdf
"""
import random
from pathlib import Path

HERE = Path(__file__).resolve().parent
R, D, K, P, W = "#FF0065", "#E0005A", "#14090F", "#7C48C4", "#FFFFFF"
RS, LAV, MUTED = "#FFD9E7", "#EBE3FA", "#6B5A62"
SVG = "../identidade-oficial-v2/svg"
F = {"costas": "fotos/costas.jpg", "labios": "fotos/labios.jpg", "cetim": "fotos/cetim.jpg", "homem": "fotos/homem.jpg"}

ICONS = {
    "home": '<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    "search": '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    "lib": '<path d="M5 3h14v18l-7-4-7 4z"/>',
    "user": '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
    "lock": '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    "bell": '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    "back": '<path d="M15 18l-6-6 6-6"/>',
    "dots": '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
    "check": '<path d="M5 12l5 5 9-10"/>',
    "x": '<path d="M6 6l12 12M18 6L6 18"/>',
}


def ic(n, s=20, c="currentColor", sw=2):
    return (f'<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="{c}" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" style="flex:none">{ICONS[n]}</svg>')


def logo(kind, v, h, extra=""):
    return f'<img src="{SVG}/logo-{kind}-{v}.svg" style="height:{h}px;width:auto;display:block;{extra}">'


def ph(name, pos="center", extra=""):
    return f"background:url({F[name]}) {pos}/cover;{extra}"


def av(name, s, ring=R, pos="center"):
    return (f'<div style="width:{s}px;height:{s}px;border-radius:50%;border:{max(2, s//24)}px solid {ring};padding:{max(2, s//22)}px;flex:none">'
            f'<div style="width:100%;height:100%;border-radius:50%;{ph(name, pos)}"></div></div>')


def scaled(inner, cw, ch, w, extra=""):
    s = w / cw
    return (f'<div style="width:{w}px;height:{round(ch*s)}px;position:relative;overflow:hidden;flex:none;{extra}">'
            f'<div style="position:absolute;left:0;top:0;width:{cw}px;height:{ch}px;transform:scale({s});transform-origin:0 0;overflow:hidden">{inner}</div></div>')


def section(bg, fg, hd, num, body, line=None, ft=True):
    line = line or ("rgba(255,255,255,.55)" if fg == W and bg != W else "rgba(20,9,15,.5)")
    return (f'<section style="background:{bg};color:{fg}"><div class="hd" style="color:{line}"><span>{hd}</span><span>{num:02d}</span></div>'
            f'{body}<div class="ft" style="color:{line}">clozzy · aplicações da marca</div></section>')


def cap(t, dark=False):
    return f'<div class="lb" style="color:{"rgba(255,255,255,.6)" if dark else "rgba(20,9,15,.62)"}">{t}</div>'


# ───────────────────────── telefone ─────────────────────────
def phone(inner, bg=K, fg=W, status=True):
    st = (f'<div style="position:absolute;top:12px;left:24px;right:24px;display:flex;justify-content:space-between;font:700 13px Figtree;color:{fg};z-index:5">'
          f'<span>9:41</span><span style="letter-spacing:2px">●●●</span></div>') if status else ""
    return (f'<div style="width:300px;height:620px;border-radius:46px;background:#000;border:1px solid rgba(255,255,255,.22);padding:8px;position:relative;flex:none">'
            f'<div style="position:relative;width:100%;height:100%;border-radius:38px;overflow:hidden;background:{bg};color:{fg}">{st}'
            f'<div style="position:absolute;top:8px;left:50%;margin-left:-44px;width:88px;height:22px;border-radius:12px;background:#000;z-index:6"></div>'
            f'{inner}</div></div>')


def tabbar(active):
    items = [("home", "Início"), ("search", "Buscar"), ("lib", "Biblioteca"), ("user", "Perfil")]
    h = ""
    for k, n in items:
        c = R if k == active else "rgba(255,255,255,.55)"
        h += f'<div style="display:flex;flex-direction:column;align-items:center;gap:3px;color:{c};font:600 10px Figtree">{ic(k, 22, c)}{n}</div>'
    return (f'<div style="position:absolute;left:0;right:0;bottom:0;height:68px;background:rgba(20,9,15,.96);border-top:1px solid rgba(255,255,255,.12);'
            f'display:flex;justify-content:space-around;align-items:flex-start;padding-top:10px;z-index:4">{h}</div>')


def scr_descobrir():
    stories = "".join(
        f'<div style="display:flex;flex-direction:column;align-items:center;gap:4px;font:500 10px Figtree;color:rgba(255,255,255,.75)">{av(n, 54, R, p)}{t}</div>'
        for n, p, t in [("costas", "60% 40%", "marina"), ("labios", "30% 50%", "bia"), ("homem", "50% 40%", "léo"), ("cetim", "50% 50%", "dani"), ("costas", "20% 30%", "téo")])
    body = (f'<div style="position:absolute;inset:0;padding:46px 14px 0">'
            f'<div style="display:flex;align-items:center;gap:10px;height:34px">{logo("simbolo", "preto", 30)}<b style="font:900 24px Gabarito;letter-spacing:-.03em">Descobrir</b><span style="margin-left:auto">{ic("bell", 22)}</span></div>'
            f'<div style="display:flex;justify-content:space-between;margin-top:12px">{stories}</div>'
            f'<div style="margin-top:14px;height:250px;border-radius:22px;position:relative;overflow:hidden;{ph("costas", "50% 30%")}">'
            f'<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,9,15,0) 45%,rgba(20,9,15,.92))"></div>'
            f'<div style="position:absolute;left:12px;top:12px;background:{R};color:#fff;font:800 12px Gabarito;padding:5px 11px;border-radius:999px">novo drop</div>'
            f'<div style="position:absolute;left:14px;right:14px;bottom:12px;display:flex;align-items:flex-end;justify-content:space-between"><div><b style="font:900 22px/1 Gabarito;letter-spacing:-.02em;display:block">Marina Alves</b>'
            f'<span style="font:500 12px Figtree;opacity:.8">Bastidores da turnê · 38 fotos</span></div>'
            f'<span style="background:#fff;color:{K};font:800 14px Gabarito;padding:7px 13px;border-radius:999px">R$ 29</span></div></div>'
            f'<div style="display:flex;gap:10px;margin-top:10px"><div style="flex:1;height:96px;border-radius:16px;position:relative;overflow:hidden;{ph("labios", "30% 55%")}"><div style="position:absolute;left:10px;bottom:8px;font:800 14px Gabarito">Fica mais perto</div></div>'
            f'<div style="flex:1;height:96px;border-radius:16px;position:relative;overflow:hidden;{ph("homem", "50% 55%")}"><div style="position:absolute;left:10px;bottom:8px;font:800 14px Gabarito">Treino de segunda</div></div></div></div>'
            f'{tabbar("home")}')
    return phone(body)


def scr_perfil():
    tiles = "".join(
        f'<div style="flex:1;height:96px;border-radius:14px;position:relative;overflow:hidden;background:#000"><div style="position:absolute;inset:-10px;{ph(n, p)};filter:blur(9px);opacity:.9"></div>'
        f'<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:rgba(20,9,15,.35)">{ic("lock", 20, "#fff")}<span style="font:800 13px Gabarito">{pr}</span></div></div>'
        for n, p, pr in [("cetim", "50% 50%", "R$ 9"), ("labios", "30% 50%", "R$ 15"), ("homem", "50% 50%", "R$ 19")])
    body = (f'<div style="position:absolute;left:0;right:0;top:0;height:330px;{ph("costas", "50% 25%")}"></div>'
            f'<div style="position:absolute;left:0;right:0;top:0;height:330px;background:linear-gradient(180deg,rgba(20,9,15,.45) 0%,rgba(20,9,15,0) 25%,rgba(20,9,15,.7) 70%,{K} 100%)"></div>'
            f'<div style="position:absolute;top:44px;left:14px;right:14px;display:flex;justify-content:space-between">{ic("back", 24)}{ic("dots", 24)}</div>'
            f'<div style="position:absolute;left:16px;right:16px;top:222px">'
            f'<b style="font:900 32px/1 Gabarito;letter-spacing:-.035em;display:block">Marina Alves</b>'
            f'<span style="font:500 13px Figtree;opacity:.8">@marinaalves</span>'
            f'<div style="display:flex;gap:26px;margin:14px 0 14px;font:500 11px Figtree;opacity:.9"><div><b style="font:900 20px Gabarito;display:block">48</b>packs</div><div><b style="font:900 20px Gabarito;display:block">12,4 mil</b>no close</div><div><b style="font:900 20px Gabarito;display:block">4,9</b>nota</div></div>'
            f'<div style="background:{R};color:#fff;font:800 18px Gabarito;text-align:center;padding:13px;border-radius:999px">Entrar no close</div>'
            f'<div style="display:flex;gap:8px;margin-top:14px">{tiles}</div></div>')
    return phone(body)


def scr_biblioteca():
    def t(style, inner, cls=""):
        return f'<div style="height:124px;border-radius:16px;position:relative;overflow:hidden;{style}">{inner}</div>'
    lab = lambda a, b, c=W: f'<div style="position:absolute;left:10px;right:10px;bottom:9px;color:{c}"><b style="font:900 16px/1 Gabarito;letter-spacing:-.02em;display:block">{a}</b><span style="font:500 10px Figtree;opacity:.8">{b}</span></div>'
    scr = '<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,9,15,0) 40%,rgba(20,9,15,.85))"></div>'
    chip = lambda t_, on: f'<span style="font:700 12px Figtree;padding:6px 13px;border-radius:999px;{"background:#fff;color:" + K if on else "border:1px solid rgba(255,255,255,.4)"}">{t_}</span>'
    body = (f'<div style="position:absolute;inset:0;padding:48px 14px 0">'
            f'<b style="font:900 30px Gabarito;letter-spacing:-.035em">Biblioteca</b>'
            f'<div style="display:flex;gap:8px;margin:12px 0 14px">{chip("tudo", 1)}{chip("packs", 0)}{chip("drops", 0)}</div>'
            f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
            f'{t(ph("costas", "55% 40%"), scr + lab("Bastidores da turnê", "Marina Alves"))}'
            f'{t(ph("cetim"), scr + lab("Noite de sexta", "Dani Rocha"))}'
            f'{t("background:" + R, lab("Close de domingo", "Marina Alves"))}'
            f'{t(ph("homem", "50% 60%"), scr + lab("Treino de segunda", "Léo Prado"))}'
            f'{t(ph("labios", "30% 55%"), scr + lab("Fica mais perto", "Bia Campos"))}'
            f'{t("background:#fff;color:" + K, lab("Ensaio de verão", "Bia Campos", K))}'
            f'</div></div>{tabbar("lib")}')
    return phone(body)


def scr_splash():
    body = (f'<div style="position:absolute;inset:0;{ph("cetim")}"></div><div style="position:absolute;inset:0;background:rgba(20,9,15,.82)"></div>'
            f'<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0">{logo("empilhado", "preto", 190)}</div>'
            f'<div style="position:absolute;bottom:46px;left:0;right:0;text-align:center;font:600 13px Figtree;letter-spacing:.14em;color:rgba(255,255,255,.7)">SEU CLOSE, SEU PREÇO.</div>')
    return phone(body)


def qr(n=25, seed=7):
    rnd = random.Random(seed)
    cells = [[rnd.random() < .5 for _ in range(n)] for _ in range(n)]

    def finder(x, y):
        for i in range(-1, 8):
            for j in range(-1, 8):
                xx, yy = x + i, y + j
                if 0 <= xx < n and 0 <= yy < n:
                    edge = i in (0, 6) or j in (0, 6)
                    core = 2 <= i <= 4 and 2 <= j <= 4
                    cells[yy][xx] = (0 <= i <= 6 and 0 <= j <= 6) and (edge or core)
    for fx, fy in [(0, 0), (n - 7, 0), (0, n - 7)]:
        finder(fx, fy)
    s = "".join(f'<rect x="{x}" y="{y}" width="1.02" height="1.02"/>' for y in range(n) for x in range(n) if cells[y][x])
    return f'<svg viewBox="0 0 {n} {n}" width="150" height="150" fill="{K}">{s}</svg>'


def scr_pix():
    body = (f'<div style="position:absolute;inset:0;padding:48px 16px 0">'
            f'<div style="display:flex;align-items:center;gap:8px">{ic("back", 24)}<b style="font:900 24px Gabarito;letter-spacing:-.03em">Pagar</b></div>'
            f'<div style="display:flex;gap:12px;align-items:center;margin:18px 0 16px;padding:12px;border-radius:16px;background:rgba(255,255,255,.07)"><div style="width:54px;height:54px;border-radius:12px;flex:none;{ph("costas", "55% 40%")}"></div>'
            f'<div style="min-width:0"><b style="font:800 16px Gabarito;display:block">Bastidores da turnê</b><span style="font:500 12px Figtree;opacity:.7">Marina Alves · pack</span></div><b style="margin-left:auto;font:900 18px Gabarito;white-space:nowrap;flex:none">R$ 29</b></div>'
            f'<div style="background:#fff;border-radius:22px;padding:18px;display:flex;flex-direction:column;align-items:center;gap:10px">{qr()}'
            f'<span style="font:700 12px Figtree;color:{MUTED}">Pix · expira em 14:52</span></div>'
            f'<div style="margin-top:16px;background:{R};color:#fff;font:800 18px Gabarito;text-align:center;padding:14px;border-radius:999px">Copiar código Pix</div>'
            f'<div style="margin-top:12px;text-align:center;font:500 13px Figtree;opacity:.7">Pagou? Abre na hora.</div></div>')
    return phone(body)


def scr_liberado():
    body = (f'<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:0 24px;text-align:center">'
            f'{logo("simbolo", "rosa", 92)}<div style="font:900 62px/.95 Gabarito;letter-spacing:-.04em;margin-top:14px">Liberado.</div>'
            f'<div style="font:400 19px Figtree">Tá na sua biblioteca.</div>'
            f'<div style="margin-top:16px;background:#fff;color:{D};font:800 20px Gabarito;padding:14px 32px;border-radius:999px">Abrir pack</div></div>')
    return phone(body, bg=R)


def scr_lock():
    def n(t, b, ago="agora"):
        return (f'<div style="background:rgba(20,9,15,.74);border-radius:20px;padding:12px;display:flex;gap:10px;margin-top:8px">'
                f'<img src="{SVG}/app-icon-rosa.svg" style="width:34px;height:34px;border-radius:8px;flex:none">'
                f'<div style="font:500 12px/1.3 Figtree"><div style="display:flex;justify-content:space-between;opacity:.65;font-size:11px"><span>CLOZZY</span><span>{ago}</span></div>'
                f'<b style="font:800 14px Gabarito;display:block">{t}</b>{b}</div></div>')
    body = (f'<div style="position:absolute;inset:0;{ph("cetim", "50% 40%")}"></div><div style="position:absolute;inset:0;background:rgba(20,9,15,.25)"></div>'
            f'<div style="position:absolute;inset:0;padding:70px 14px 0;text-align:center"><div style="font:500 14px Figtree;opacity:.85">terça, 11 de novembro</div>'
            f'<div style="font:300 92px/1 Figtree;letter-spacing:-.03em;margin:2px 0 120px">9:41</div>'
            f'<div style="text-align:left">{n("Pix recebido · R$ 29,00", "Marina Alves: seu pack tá no ar.")}'
            f'{n("Liberado.", "Bastidores da turnê tá na sua biblioteca.", "2 min")}'
            f'{n("Novo drop às 21h", "Léo Prado abriu o close de hoje.", "12 min")}</div></div>')
    return phone(body, bg=K)


# ───────────────────────── navegador ─────────────────────────
def browser(inner, w, h, url="clozzy.com.br", dark=True):
    bar = "#1b0f16" if dark else "#f1eef0"
    fg = "rgba(255,255,255,.6)" if dark else "rgba(20,9,15,.6)"
    pill = "rgba(255,255,255,.1)" if dark else "rgba(20,9,15,.08)"
    dot = "rgba(255,255,255,.28)" if dark else "rgba(20,9,15,.25)"
    return (f'<div style="width:{w}px;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.2);background:#000;flex:none">'
            f'<div style="height:40px;background:{bar};display:flex;align-items:center;gap:8px;padding:0 16px">'
            f'<i style="width:11px;height:11px;border-radius:50%;background:{dot}"></i><i style="width:11px;height:11px;border-radius:50%;background:{dot}"></i><i style="width:11px;height:11px;border-radius:50%;background:{dot}"></i>'
            f'<div style="margin-left:26px;flex:0 0 420px;height:24px;border-radius:12px;background:{pill};color:{fg};font:500 13px/24px Figtree;text-align:center">{url}</div></div>'
            f'<div style="width:{w}px;height:{h}px;position:relative;overflow:hidden">{inner}</div></div>')


def landing_hero():
    nav = (f'<div style="position:absolute;left:56px;right:56px;top:26px;display:flex;align-items:center;justify-content:space-between;z-index:3">{logo("horizontal", "preto", 34)}'
           f'<div style="display:flex;gap:34px;font:600 15px Figtree;color:rgba(255,255,255,.8)"><span>Como funciona</span><span>Criadores</span><span>Biblioteca</span></div>'
           f'<div style="display:flex;gap:10px"><span style="font:800 15px Gabarito;border:2px solid rgba(255,255,255,.7);padding:8px 20px;border-radius:999px">Entrar</span>'
           f'<span style="font:800 15px Gabarito;background:{R};padding:10px 20px;border-radius:999px">Criar meu close</span></div></div>')
    return (f'<div style="position:absolute;inset:0;background:{K};color:#fff">'
            f'<div style="position:absolute;right:0;top:0;bottom:0;width:640px;{ph("costas", "50% 30%")}"></div>'
            f'<div style="position:absolute;right:0;top:0;bottom:0;width:640px;background:linear-gradient(90deg,{K} 0%,rgba(20,9,15,.55) 35%,rgba(20,9,15,0) 70%)"></div>{nav}'
            f'<div style="position:absolute;left:56px;top:170px"><div style="font:900 128px/.9 Gabarito;letter-spacing:-.045em">Seu close,<br>seu preço.</div>'
            f'<div style="font:400 25px Figtree;margin:26px 0 34px;color:rgba(255,255,255,.82)">Pago no Pix. Liberado na hora.</div>'
            f'<div style="display:flex;gap:14px"><span style="font:800 22px Gabarito;background:{R};padding:15px 32px;border-radius:999px">Entrar no close</span>'
            f'<span style="font:800 22px Gabarito;border:2px solid #fff;padding:13px 30px;border-radius:999px">Sou criador</span></div></div>'
            f'<div style="position:absolute;right:56px;bottom:50px;background:#fff;color:{K};border-radius:20px;padding:14px 18px;display:flex;gap:12px;align-items:center">'
            f'<div style="width:40px;height:40px;border-radius:50%;background:{K};display:grid;place-items:center">{logo("simbolo", "preto", 24)}</div>'
            f'<div><b style="font:800 17px/1.1 Gabarito;display:block">Pix recebido</b><span style="font:500 13px Figtree;color:{MUTED}">R$ 29,00 · agora</span></div></div></div>')


def landing_scroll():
    star = f'<svg width="20" height="20" viewBox="0 0 100 100"><polygon fill="{R}" points="50,5 61,38 95,38 67,58 78,92 50,71 22,92 33,58 5,38 39,38"/></svg>'
    words = "".join(f'<span>{w}</span>{star}' for w in ["exclusivo", "oferta", "pack", "drop", "biblioteca", "canal", "exclusivo", "oferta", "pack", "drop"])
    strip = f'<div style="height:60px;background:{K};color:#fff;display:flex;align-items:center;gap:26px;font:800 26px Gabarito;letter-spacing:-.02em;white-space:nowrap;overflow:hidden;padding-left:40px">{words}</div>'
    steps = "".join(
        f'<div style="display:grid;grid-template-columns:84px 1fr;align-items:baseline;border-top:3px solid {K};padding:11px 0"><span style="font:900 40px/1 Gabarito;color:{D};letter-spacing:-.04em">{n}</span>'
        f'<div><b style="font:800 24px Gabarito;letter-spacing:-.02em;display:block">{t}</b><span style="font:400 16px Figtree;color:{MUTED}">{s}</span></div></div>'
        for n, t, s in [("01", "Você monta o seu close.", "Sobe o pack, define o preço, manda o link."), ("02", "O fã paga no Pix.", "Sem cartão, sem cadastro longo. Cai na hora."), ("03", "Liberado na biblioteca.", "Tá lá, no celular dele, pra rever quando quiser.")])
    white = (f'<div style="height:424px;background:#fff;color:{K};padding:30px 56px;display:grid;grid-template-columns:1fr 470px;gap:60px">'
             f'<div><div style="font:900 46px/.98 Gabarito;letter-spacing:-.035em;margin-bottom:14px">Do link ao conteúdo<br>em três passos.</div>{steps}</div>'
             f'<div style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:10px">'
             f'<div style="grid-row:span 2;border-radius:18px;{ph("labios", "30% 55%")}"></div><div style="border-radius:18px;{ph("cetim")}"></div><div style="border-radius:18px;{ph("homem", "50% 55%")}"></div></div></div>')
    cta = (f'<div style="height:218px;background:{R};color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 56px">'
           f'<div style="font:900 72px/.9 Gabarito;letter-spacing:-.04em">Entra pro<br>meu close.</div>'
           f'<div style="text-align:right"><div style="font:400 24px Figtree;margin-bottom:18px">Pago no Pix. Liberado na hora.</div><span style="font:800 22px Gabarito;background:#fff;color:{D};padding:15px 32px;border-radius:999px">Entrar no close</span></div></div>')
    return f'<div style="position:absolute;inset:0">{strip}{white}{cta}</div>'


# ───────────────────────── posts ─────────────────────────
def post_foto(n, pos, title, sub, chip=None):
    c = f'<span style="position:absolute;left:70px;top:190px;background:{R};color:#fff;font:800 40px Gabarito;padding:14px 34px;border-radius:999px">{chip}</span>' if chip else ""
    return (f'<div style="position:absolute;inset:0;{ph(n, pos)}"></div><div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,9,15,.5) 0%,rgba(20,9,15,0) 25%,rgba(20,9,15,.2) 50%,rgba(20,9,15,.92) 100%)"></div>'
            f'<div style="position:absolute;left:70px;top:70px">{logo("horizontal", "preto", 64)}</div>{c}'
            f'<div style="position:absolute;left:70px;right:70px;bottom:80px;color:#fff"><div style="font:900 150px/.92 Gabarito;letter-spacing:-.045em">{title}</div>'
            f'<div style="font:400 44px Figtree;margin-top:26px;opacity:.9">{sub}</div></div>')


def post_rosa():
    return (f'<div style="position:absolute;inset:0;background:{R};color:#fff"><div style="position:absolute;left:70px;top:70px">{logo("horizontal", "rosa", 64)}</div>'
            f'<div style="position:absolute;left:70px;right:70px;top:300px;font:900 190px/.9 Gabarito;letter-spacing:-.045em">Pago<br>no Pix.<br>Liberado<br>na hora.</div>'
            f'<span style="position:absolute;left:70px;bottom:80px;background:#fff;color:{D};font:800 50px Gabarito;padding:22px 52px;border-radius:999px">Entrar no close</span></div>')


def post_roxo():
    return (f'<div style="position:absolute;inset:0;background:{P};color:#fff"><div style="position:absolute;left:70px;top:70px">{logo("horizontal", "roxo", 64)}</div>'
            f'<div style="position:absolute;left:70px;right:70px;top:340px;font:900 200px/.9 Gabarito;letter-spacing:-.045em">Você só<br>paga se<br>vender.</div>'
            f'<div style="position:absolute;left:70px;right:70px;bottom:80px;font:400 48px/1.3 Figtree;color:{LAV}">Vitrine, venda e entrega num lugar só. O que entra, cai no Pix.</div></div>')


def post_branco():
    return (f'<div style="position:absolute;inset:0;background:#fff;color:{K}"><div style="position:absolute;left:70px;top:70px">{logo("horizontal", "branco", 64)}</div>'
            f'<div style="position:absolute;left:70px;top:230px;font:900 190px/.9 Gabarito;letter-spacing:-.045em">Fica<br>mais <span style="color:{D}">perto.</span></div>'
            f'<div style="position:absolute;left:70px;right:70px;bottom:70px;height:470px;border-radius:44px;{ph("labios", "30% 55%")}"></div></div>')


def post_simbolo():
    return (f'<div style="position:absolute;inset:0;background:{K};color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:60px">{logo("simbolo", "preto", 560)}'
            f'<div style="font:600 40px Figtree;letter-spacing:.18em;color:rgba(255,255,255,.7)">SEU CLOSE, SEU PREÇO.</div></div>')


def post_slide(n, num, title, body, bg, fg, sub=None, last=False):
    btn = f'<span style="position:absolute;left:70px;bottom:80px;background:#fff;color:{D};font:800 50px Gabarito;padding:22px 52px;border-radius:999px">Link na bio</span>' if last else ""
    return (f'<div style="position:absolute;inset:0;background:{bg};color:{fg}"><div style="position:absolute;left:70px;top:70px;font:900 150px/1 Gabarito;letter-spacing:-.05em;opacity:.95">{num}</div>'
            f'<div style="position:absolute;left:70px;right:70px;top:480px;font:900 150px/.92 Gabarito;letter-spacing:-.045em">{title}</div>'
            f'<div style="position:absolute;left:70px;right:70px;top:880px;font:400 54px/1.3 Figtree;opacity:.88">{body}</div>{btn}</div>')


# ───────────────────────── stories ─────────────────────────
def story_hd(color="#fff", n=4, act=1):
    bars = "".join(f'<i style="flex:1;height:7px;border-radius:4px;background:{"#fff" if i < act else "rgba(255,255,255,.35)"}"></i>' for i in range(n))
    return (f'<div style="position:absolute;left:50px;right:50px;top:60px;display:flex;gap:10px">{bars}</div>'
            f'<div style="position:absolute;left:50px;top:110px;display:flex;align-items:center;gap:22px;color:{color}"><div style="width:110px;height:110px;border-radius:50%;background:{K};display:grid;place-items:center">{logo("simbolo", "preto", 70)}</div>'
            f'<b style="font:800 44px Gabarito">clozzy</b><span style="font:500 38px Figtree;opacity:.7">agora</span></div>')


def story_rosa():
    return (f'<div style="position:absolute;inset:0;background:{R};color:#fff">{story_hd()}'
            f'<div style="position:absolute;left:70px;right:70px;top:560px;font:900 190px/.9 Gabarito;letter-spacing:-.05em">Liberado.<br>Tá na sua<br>biblioteca.</div>'
            f'<div style="position:absolute;left:0;right:0;bottom:200px;display:flex;justify-content:center"><span style="background:#fff;color:{D};font:800 64px Gabarito;padding:34px 80px;border-radius:999px">Abrir pack</span></div></div>')


def story_homem():
    return (f'<div style="position:absolute;inset:0;{ph("homem", "50% 50%")}"></div><div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,9,15,.55),rgba(20,9,15,0) 30%,rgba(20,9,15,.85))"></div>{story_hd()}'
            f'<div style="position:absolute;left:70px;right:70px;bottom:480px;color:#fff;font:900 230px/.88 Gabarito;letter-spacing:-.05em">Novo<br>drop às<br>21h.</div>'
            f'<div style="position:absolute;left:70px;bottom:230px;background:#fff;color:{K};border-radius:44px;padding:36px 54px;font:900 100px Gabarito;letter-spacing:.02em">03:12:44</div>')


def story_enquete():
    opt = lambda t, on: f'<div style="flex:1;text-align:center;font:800 56px Gabarito;padding:34px 0;border-radius:30px;{"background:" + R + ";color:#fff" if on else "background:" + LAV + ";color:" + K}">{t}</div>'
    return (f'<div style="position:absolute;inset:0;{ph("cetim", "50% 50%")}"></div><div style="position:absolute;inset:0;background:rgba(20,9,15,.55)"></div>{story_hd(act=2)}'
            f'<div style="position:absolute;left:70px;right:70px;top:720px;background:#fff;color:{K};border-radius:56px;padding:60px 56px 56px">'
            f'<div style="font:900 100px/.95 Gabarito;letter-spacing:-.04em;margin-bottom:44px">Qual close<br>você abre hoje?</div><div style="display:flex;gap:24px">{opt("Marina", 1)}{opt("Léo", 0)}</div></div>')


def story_roxo():
    return (f'<div style="position:absolute;inset:0;background:{P};color:#fff">{story_hd(act=4)}'
            f'<div style="position:absolute;left:70px;right:70px;top:520px;font:900 230px/.88 Gabarito;letter-spacing:-.05em">Entra<br>pro meu<br>close.</div>'
            f'<div style="position:absolute;left:70px;right:70px;top:1200px;font:400 66px/1.3 Figtree;color:{LAV}">Pago no Pix. Liberado na hora.</div>'
            f'<div style="position:absolute;left:0;right:0;bottom:200px;display:flex;justify-content:center"><span style="background:#fff;color:{P};font:800 64px Gabarito;padding:34px 80px;border-radius:999px">clozzy.com.br/marina</span></div></div>')


# ───────────────────────── físico ─────────────────────────
def tee():
    return (f'<svg viewBox="0 0 140 140" width="250" height="250"><path d="M42 12 L8 38 L24 60 L36 52 V128 H104 V52 L116 60 L132 38 L98 12 Q70 28 42 12Z" fill="{K}" stroke="rgba(20,9,15,.35)" stroke-width="1"/>'
            f'<g transform="translate(58 50) scale(.24)"><g transform="translate(-5 -5)">{open(HERE.parent / "identidade-oficial-v2/svg/logo-simbolo-preto.svg").read().split("</title>")[1].replace("</svg>", "")}</g></g></svg>')


def tote():
    return (f'<svg viewBox="0 0 140 170" width="190" height="231"><path d="M42 40 Q42 6 70 6 Q98 6 98 40" fill="none" stroke="{D}" stroke-width="7" stroke-linecap="round"/>'
            f'<rect x="14" y="36" width="112" height="128" rx="4" fill="{R}"/>'
            f'<g transform="translate(36 70) scale(.68)">{open(HERE.parent / "identidade-oficial-v2/svg/logo-simbolo-rosa.svg").read().split("</title>")[1].replace("</svg>", "")}</g></svg>')


# ───────────────────────── documento ─────────────────────────
CSS = """
@font-face{font-family:Gabarito;src:url("../identidade-nova/fonts/Gabarito-Variable.ttf");font-weight:400 900}
@font-face{font-family:Figtree;src:url("../identidade-nova/fonts/Figtree-Variable.ttf");font-weight:300 900}
@page{size:1600px 900px;margin:0}
*{box-sizing:border-box}body{margin:0;background:#888;font-family:Figtree;-webkit-font-smoothing:antialiased}
section{position:relative;width:1600px;height:900px;padding:90px 90px 60px;overflow:hidden;page-break-after:always;margin:0 auto 20px}
.hd{position:absolute;left:90px;right:90px;top:34px;display:flex;justify-content:space-between;font:600 15px Figtree;letter-spacing:.1em;text-transform:uppercase}
.ft{position:absolute;left:90px;bottom:24px;font:500 13px Figtree}
h1{font:900 56px/1.02 Gabarito;letter-spacing:-.035em;margin:0 0 20px}
.lead{font:500 22px/1.45 Figtree;margin:0;max-width:1000px;opacity:.85}
.lb{font:500 15px/1.35 Figtree;margin-top:10px}
.row{display:flex;justify-content:space-between;gap:24px;padding:12px 0;border-top:1px solid;font:500 20px/1.35 Figtree}
.row b{font:800 20px Gabarito;width:190px;flex:none}
img{display:block}
@media print{body{background:none}section{margin:0}}
"""


def row(a, b, line):
    return f'<div class="row" style="border-color:{line}"><b>{a}</b><span style="flex:1">{b}</span></div>'


def doc():
    S = []
    LN_D, LN_L = "rgba(255,255,255,.2)", "rgba(20,9,15,.16)"

    # 1 capa
    S.append(f'<section style="background:{K};color:#fff;padding:0"><div style="position:absolute;right:0;top:0;bottom:0;width:640px;{ph("costas", "50% 30%")}"></div>'
             f'<div style="position:absolute;right:0;top:0;bottom:0;width:640px;background:linear-gradient(90deg,{K},rgba(20,9,15,0) 55%)"></div>'
             f'<div style="position:absolute;left:90px;top:80px">{logo("horizontal", "preto", 84)}</div>'
             f'<div style="position:absolute;left:90px;bottom:120px"><div style="font:900 140px/.9 Gabarito;letter-spacing:-.045em">Como a marca<br>aparece.</div>'
             f'<div style="font:600 22px Figtree;letter-spacing:.14em;margin-top:34px;color:rgba(255,255,255,.75)">APLICAÇÕES · LANDING · APP · REDES · 2026-11-11</div></div></section>')

    # 2 direção
    tiles = "".join(f'<div style="border-radius:22px;{ph(n, p)}"></div>' for n, p in [("costas", "50% 30%"), ("labios", "30% 55%"), ("cetim", "50% 50%"), ("homem", "50% 55%")])
    S.append(section(K, W, "Direção", 2,
        f'<div style="display:flex;gap:70px;height:100%"><div style="flex:1.2;display:flex;flex-direction:column;justify-content:center">'
        f'<h1 style="font-size:84px;line-height:.96">Sensual é o que fica fora do quadro.</h1>'
        f'<div style="margin-top:24px;max-width:740px">'
        + row("Luz baixa", "Fundo escuro, rosa entra como luz lateral. Nunca flash de frente.", LN_D)
        + row("Recorte", "Ombro, boca, pescoço, tecido. Sugere, não mostra. Rosto fora ou na sombra.", LN_D)
        + row("Branco, não creme", "Superfície clara é #FFFFFF. O creme #FFF6F0 saiu das peças.", LN_D)
        + row("Rosa com peso", "Fundo, botão, título grande. Estrela branca quando o fundo é rosa.", LN_D)
        + '</div></div>'
        f'<div style="flex:1;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:14px;margin-bottom:10px">{tiles}</div></div>'))

    # 3 fotografia
    fotos = [("costas", "50% 25%", "Costas e ombro", "luz rosa lateral, rosto na sombra"), ("labios", "30% 50%", "Boca", "gloss rosa, fundo preto"),
             ("cetim", "50% 50%", "Tecido", "cetim, dobras, rosa e violeta"), ("homem", "50% 55%", "Pescoço e peito", "corrente, camisa aberta, luz violeta")]
    cols = ""
    for n, p, t_, s_ in fotos:
        cols += (f'<div><div style="width:332px;height:420px;border-radius:20px;{ph(n, p)}"></div>'
                 + cap('<b style="font:800 18px Gabarito;color:' + K + '">' + t_ + '</b><br>' + s_) + '</div>')
    S.append(section(W, K, "Fotografia", 3,
        f'<h1>Quatro tipos de foto</h1><div style="display:flex;gap:30px;margin-top:6px;justify-content:space-between">{cols}</div>'
        f'<div style="display:flex;gap:60px;margin-top:34px;font:500 19px/1.4 Figtree">'
        f'<div style="flex:1;border-top:3px solid {K};padding-top:12px"><b style="font:800 22px Gabarito">Pode</b><br>Pele, tecido, silhueta, mão, boca, pescoço. Grão de filme, sombra funda, luz rosa ou violeta de lado.</div>'
        f'<div style="flex:1;border-top:3px solid {K};padding-top:12px"><b style="font:800 22px Gabarito">Não pode</b><br>Nudez explícita, flash frontal, fundo claro de estúdio, filtro de brilho, emoji de fogo ou berinjela.</div></div>'))

    # 4 landing hero
    S.append(section(K, W, "Landing page · topo", 4,
        f'<div style="display:flex;justify-content:center;margin-top:-6px">{browser(landing_hero(), 1420, 706)}</div>'))

    # 5 landing rolagem
    S.append(section(K, W, "Landing page · rolagem", 5,
        f'<div style="display:flex;justify-content:center;margin-top:-6px">{browser(landing_scroll(), 1420, 702, dark=False)}</div>'))

    # 6 app 1
    S.append(section(K, W, "App · navegação", 6,
        f'<div style="display:flex;justify-content:space-between;align-items:flex-start;height:100%"><div style="width:360px;padding-top:26px"><h1 style="font-size:64px">Escuro por padrão.</h1>'
        f'<p class="lead" style="font-size:20px">Fundo #14090F, foto cheia, rosa só no que é ação: aba ativa, botão, preço.</p></div>'
        f'<div>{scr_descobrir()}{cap("Descobrir", 1)}</div><div>{scr_perfil()}{cap("Perfil do criador · conteúdo travado", 1)}</div><div>{scr_biblioteca()}{cap("Biblioteca", 1)}</div></div>'))

    # 7 app 2
    S.append(section(K, W, "App · entrada e compra", 7,
        f'<div style="display:flex;justify-content:space-between;align-items:flex-start;padding-top:6px">'
        f'<div>{scr_splash()}{cap("Splash · preto", 1)}</div><div>{scr_pix()}{cap("Pagamento Pix", 1)}</div><div>{scr_liberado()}{cap("Liberado · rosa, tudo branco", 1)}</div><div>{scr_lock()}{cap("Notificações na tela de bloqueio", 1)}</div></div>'))

    # 8 grid de feed
    t = lambda inner: scaled(inner, 1080, 1350, 290)
    grid = [t(post_foto("costas", "50% 30%", "Seu close,<br>seu preço.", "")), t(post_rosa()), t(post_foto("homem", "50% 50%", "Novo drop<br>às 21h.", "Léo Prado · 6 vídeos")),
            t(post_roxo()), t(post_branco()), t(post_simbolo())]
    S.append(section(W, K, "Rede social · perfil e grid", 8,
        f'<div style="display:flex;gap:56px;height:100%"><div style="width:450px;padding-top:6px">'
        f'<div style="display:flex;gap:26px;align-items:center"><div style="width:130px;height:130px;border-radius:50%;overflow:hidden;flex:none"><img src="{SVG}/logo-simbolo-preto-placa.svg" style="width:100%;height:100%"></div>'
        f'<div><b style="font:900 40px Gabarito;letter-spacing:-.03em">clozzy</b><div style="font:500 17px Figtree;color:{MUTED};margin-top:2px">@clozzy</div></div></div>'
        f'<div style="display:flex;gap:34px;margin:30px 0 20px"><div><b style="font:900 28px Gabarito;display:block">312</b>posts</div><div><b style="font:900 28px Gabarito;display:block">48,2 mil</b>seguidores</div><div><b style="font:900 28px Gabarito;display:block">1,1 mil</b>criadores</div></div>'
        f'<div style="font:500 20px/1.45 Figtree">Seu close, seu preço.<br>Pago no Pix. Liberado na hora.</div>'
        f'<div style="margin-top:22px;display:inline-block;background:{D};color:#fff;font:800 20px Gabarito;padding:13px 28px;border-radius:999px">Entrar no close</div>'
        f'<div style="margin-top:34px;font:500 15px/1.5 Figtree;color:{MUTED}">Grid: foto escura, rosa cheio, foto, roxo, branco, símbolo. Rosa e roxo nunca lado a lado.</div></div>'
        f'<div style="display:grid;grid-template-columns:repeat(3,290px);gap:10px;align-content:start">{"".join(grid)}</div></div>'))

    # 9 posts
    posts = [(post_foto("costas", "50% 30%", "Seu close,<br>seu preço.", "Pago no Pix. Liberado na hora."), "Foto + título"), (post_rosa(), "Rosa · tudo branco"),
             (post_roxo(), "Roxo · criadores"), (post_branco(), "Branco · foto recortada")]
    S.append(section(W, K, "Rede social · posts 4:5", 9,
        f'<div style="height:100%;display:flex;flex-direction:column;justify-content:center;margin-top:-30px"><h1>Posts</h1><div style="display:flex;gap:26px;margin-top:8px">'
        + "".join(f'<div>{scaled(h, 1080, 1350, 335)}{cap(c)}</div>' for h, c in posts) + '</div>'
        f'<div style="margin-top:24px;font:500 18px/1.45 Figtree;max-width:1000px;color:{MUTED}">1080 × 1350. Logo horizontal no canto, título em Gabarito 900, aperto −4,5%. Foto sempre com ink por baixo do texto.</div></div>'))

    # 10 carrossel
    sl = [(f'<div style="position:absolute;inset:0;{ph("cetim")}"></div><div style="position:absolute;inset:0;background:rgba(20,9,15,.55)"></div><div style="position:absolute;left:70px;top:70px">{logo("horizontal", "preto", 64)}</div>'
           f'<div style="position:absolute;left:70px;right:70px;bottom:80px;color:#fff;font:900 190px/.9 Gabarito;letter-spacing:-.045em">Abre o seu<br>close em<br>três passos.</div>', "Capa"),
          (post_slide("", "01", "Você monta.", "Sobe o pack, define o preço, manda o link.", P, W), "Roxo"),
          (post_slide("", "02", "O fã paga.", "No Pix. Sem cartão, sem cadastro longo.", W, K), "Branco"),
          (post_slide("", "03", "Liberado.", "Tá na biblioteca dele, na hora.", R, W, last=True), "Rosa · CTA")]
    S.append(section(K, W, "Rede social · carrossel", 10,
        f'<div style="height:100%;display:flex;flex-direction:column;justify-content:center;margin-top:-30px"><h1>Carrossel</h1><div style="display:flex;gap:26px;margin-top:8px;align-items:flex-start">'
        + "".join(f'<div>{scaled(h, 1080, 1350, 335, "border:1px solid rgba(255,255,255,.15)")}{cap(c, 1)}</div>' for h, c in sl) + '</div>'
        f'<div style="margin-top:22px;font:500 18px/1.45 Figtree;color:rgba(255,255,255,.7);max-width:1000px">Cor alterna: preto/foto, roxo, branco, rosa. Rosa e roxo nunca em lâminas vizinhas.</div></div>'))

    # 11 stories
    st = [(story_rosa(), "Rosa · aviso de compra"), (story_homem(), "Foto · drop com contagem"), (story_enquete(), "Foto escura · enquete"), (story_roxo(), "Roxo · convite")]
    S.append(section(K, W, "Rede social · stories 9:16", 11,
        f'<div style="height:100%;display:flex;gap:20px;justify-content:space-between;align-items:center;margin-top:-20px">'
        + "".join(f'<div>{scaled(h, 1080, 1920, 340, "border-radius:26px")}{cap(c, 1)}</div>' for h, c in st) + '</div>'))

    # 12 perfis e capas
    avs = [("preto", "Preto"), ("rosa", "Rosa"), ("roxo", "Roxo"), ("branco", "Branco")]
    avh = "".join(f'<div style="text-align:center"><div style="width:130px;height:130px;border-radius:50%;overflow:hidden;{"border:1px solid rgba(20,9,15,.2);" if v == "branco" else ""}"><img src="{SVG}/logo-simbolo-{v}-placa.svg" style="width:100%;height:100%"></div>{cap(n)}</div>' for v, n in avs)
    banner = (f'<div style="position:absolute;inset:0;background:{K}"></div><div style="position:absolute;right:0;top:0;bottom:0;width:760px;{ph("cetim", "50% 40%")}"></div>'
              f'<div style="position:absolute;right:0;top:0;bottom:0;width:760px;background:linear-gradient(90deg,{K},rgba(20,9,15,0) 60%)"></div>'
              f'<div style="position:absolute;left:90px;top:70px">{logo("horizontal", "preto", 80)}</div>'
              f'<div style="position:absolute;left:90px;bottom:80px;color:#fff;font:900 150px/.9 Gabarito;letter-spacing:-.045em">Seu close,<br>seu preço.</div>')
    og = (f'<div style="position:absolute;inset:0;background:{R};color:#fff"><div style="position:absolute;left:70px;top:60px">{logo("horizontal", "rosa", 70)}</div>'
          f'<div style="position:absolute;left:70px;bottom:60px;font:900 140px/.9 Gabarito;letter-spacing:-.045em">Entra pro<br>meu close.</div>'
          f'<div style="position:absolute;right:0;top:0;bottom:0;width:420px;{ph("costas", "50% 25%")}"></div></div>')
    S.append(section(W, K, "Perfis e capas", 12,
        f'<div style="display:flex;gap:60px"><div style="flex:none"><h1 style="font-size:44px">Avatar</h1><div style="display:flex;gap:22px">{avh}</div>'
        f'<div style="margin-top:16px;font:500 16px/1.4 Figtree;color:{MUTED};max-width:600px">Símbolo a 58% do quadrado, para sobrar folga quando a rede corta em círculo.</div></div>'
        f'<div style="flex:1"><h1 style="font-size:44px">Aba do navegador</h1>'
        f'<div style="background:#eceaeb;border-radius:12px 12px 0 0;padding:10px 12px 0;display:flex"><div style="background:#fff;border-radius:10px 10px 0 0;padding:10px 16px;display:flex;gap:10px;align-items:center;font:500 14px Figtree"><img src="{SVG}/favicon.svg" style="width:18px;height:18px">clozzy — seu close, seu preço</div></div></div></div>'
        f'<div style="display:flex;gap:40px;margin-top:50px;align-items:flex-start"><div><b style="font:800 22px Gabarito">Capa · 1500 × 500</b><div style="margin-top:10px">{scaled(banner, 1500, 500, 860, "border-radius:14px")}</div></div>'
        f'<div><b style="font:800 22px Gabarito">Link no chat · 1200 × 630</b><div style="margin-top:10px;border:1px solid rgba(20,9,15,.16);border-radius:14px;overflow:hidden;width:480px">{scaled(og, 1200, 630, 480)}'
        f'<div style="padding:12px 16px;font:500 13px Figtree;color:{MUTED}">clozzy.com.br<b style="display:block;font:800 17px Gabarito;color:{K}">Entra pro meu close.</b></div></div></div></div>'))

    # 13 e-mail e avisos
    email = (f'<div style="width:560px;background:#fff;color:{K};border-radius:20px;overflow:hidden"><div style="padding:30px 40px 0">{logo("horizontal", "branco", 36)}</div>'
             f'<div style="padding:30px 40px 34px"><div style="font:900 50px/.95 Gabarito;letter-spacing:-.04em">Pix recebido.<br>Liberado.</div>'
             f'<div style="font:400 18px/1.45 Figtree;margin:16px 0 22px;color:{MUTED}">Seu pack já tá na biblioteca.</div>'
             f'<div style="display:flex;gap:14px;align-items:center;padding:14px;border-radius:16px;background:#f6f3f4"><div style="width:62px;height:62px;border-radius:12px;flex:none;{ph("costas", "55% 40%")}"></div>'
             f'<div><b style="font:800 18px Gabarito;display:block">Bastidores da turnê</b><span style="font:500 14px Figtree;color:{MUTED}">Marina Alves · pack · 38 fotos</span></div><b style="margin-left:auto;font:900 20px Gabarito">R$ 29,00</b></div>'
             f'<div style="margin-top:22px;display:inline-block;background:{D};color:#fff;font:800 20px Gabarito;padding:14px 30px;border-radius:999px">Abrir na biblioteca</div>'
             f'<div style="margin-top:26px;font:500 13px Figtree;color:{MUTED}">clozzy · seu close, seu preço.</div></div></div>')

    def toast(t, b, dark=True, bg=None, fg=None, icon="rosa"):
        bgc = bg or (K if dark else W)
        fgc = fg or (W if dark else K)
        return (f'<div style="background:{bgc};color:{fgc};border-radius:20px;padding:16px 18px;display:flex;gap:14px;align-items:center;width:560px;{"border:1px solid rgba(255,255,255,.2)" if bgc == K else ""}">'
                f'<img src="{SVG}/app-icon-{icon}.svg" style="width:44px;height:44px;border-radius:10px"><div><b style="font:800 19px Gabarito;display:block">{t}</b><span style="font:400 15px Figtree;opacity:.85">{b}</span></div>'
                f'<span style="margin-left:auto;font:500 13px Figtree;opacity:.6">agora</span></div>')
    S.append(section(K, W, "E-mail e avisos", 13,
        f'<div style="display:flex;gap:90px;align-items:center;height:100%;margin-top:-20px"><div>{email}{cap("E-mail · superfície branca, botão Pink Deep", 1)}</div>'
        f'<div style="display:flex;flex-direction:column;gap:18px"><h1 style="font-size:44px;margin-bottom:6px">Avisos</h1>'
        f'{toast("Pix recebido · R$ 29,00", "Marina Alves: seu pack tá no ar.")}'
        f'{toast("Liberado.", "Bastidores da turnê tá na sua biblioteca.", dark=False)}'
        f'{toast("Novo drop às 21h", "Léo Prado abriu o close de hoje.", bg=P, icon="branco")}'
        f'{toast("Você vendeu 3 packs", "R$ 87,00 caíram no seu Pix.", bg=R, icon="branco")}'
        f'<div style="font:500 16px/1.45 Figtree;color:rgba(255,255,255,.65);max-width:560px;margin-top:6px">Ícone do app rosa; nos avisos rosa e roxo, ícone branco. Título em Gabarito 800, texto em Figtree, no máximo duas linhas.</div></div></div>'))

    # 14 físico
    billboard = (f'<div style="position:absolute;inset:0;background:{R}"></div><div style="position:absolute;right:0;top:0;bottom:0;width:1100px;{ph("costas", "50% 22%")}"></div>'
                 f'<div style="position:absolute;right:0;top:0;bottom:0;width:1104px;margin-right:0;background:linear-gradient(90deg,{R} 0%,rgba(255,0,101,0) 45%)"></div>'
                 f'<div style="position:absolute;left:90px;top:90px">{logo("horizontal", "rosa", 120)}</div>'
                 f'<div style="position:absolute;left:90px;bottom:90px;color:#fff;font:900 330px/.88 Gabarito;letter-spacing:-.05em">Seu close,<br>seu preço.</div>')
    poster = (f'<div style="position:absolute;inset:0;{ph("labios", "30% 55%")}"></div><div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,9,15,.6),rgba(20,9,15,0) 25%,rgba(20,9,15,.92))"></div>'
              f'<div style="position:absolute;left:70px;top:70px">{logo("horizontal", "preto", 70)}</div>'
              f'<div style="position:absolute;left:70px;right:70px;bottom:90px;color:#fff;font:900 230px/.88 Gabarito;letter-spacing:-.05em">Fica<br>mais<br>perto.</div>')
    S.append(section(W, K, "Fora da tela", 14,
        f'<div style="display:flex;gap:40px;align-items:flex-start;margin-top:-8px"><div><div style="width:960px;height:320px;overflow:hidden;border-radius:6px">{scaled(billboard, 3000, 1000, 960)}</div>{cap("Outdoor · 3 × 1")}'
        f'<div style="display:flex;gap:26px;margin-top:20px;align-items:flex-end"><div style="width:270px;height:270px;background:#f1eef0;border-radius:20px;display:grid;place-items:center">{tee()}</div>'
        f'<div style="width:270px;height:270px;background:#f1eef0;border-radius:20px;display:grid;place-items:center">{tote()}</div>'
        f'<div style="font:500 17px/1.45 Figtree;color:{MUTED};max-width:290px"><b style="font:800 19px Gabarito;color:{K}">Camiseta e ecobag</b><br>Preto com símbolo rosa e estrela branca. Rosa com símbolo todo branco.</div></div></div>'
        f'<div>{scaled(poster, 1080, 1620, 400, "border-radius:6px")}{cap("Cartaz de rua · 2 × 3")}</div></div>'))

    # 15 regras
    def col(title, items, line=LN_L):
        li = "".join(f'<div style="display:flex;gap:12px;padding:18px 0;border-top:1px solid {line};font:500 23px/1.35 Figtree"><span style="color:{c}">{ic("check" if ok else "x", 24, c, 3)}</span><span>{t}</span></div>' for ok, t in items for c in [(D if ok else MUTED)])
        return f'<div style="flex:1"><b style="font:900 40px Gabarito;letter-spacing:-.03em">{title}</b><div style="margin-top:16px">{li}</div></div>'
    S.append(section(W, K, "Resumo", 15,
        f'<h1>Regras nas peças</h1><div style="display:flex;gap:60px;margin-top:34px">'
        + col("Imagem", [(1, "Fundo escuro, luz rosa ou violeta de lado"), (1, "Recorte: ombro, boca, pescoço, tecido"), (1, "Ink por baixo de todo texto sobre foto"), (0, "Nudez explícita ou flash frontal"), (0, "Fundo creme ou bege")])
        + col("Cor", [(1, "Rosa: logo e título branco, botão branco com texto Pink Deep"), (1, "Preto: anel rosa, estrela branca"), (1, "Roxo: tudo branco, sem rosa em cima"), (1, "Superfície clara sempre #FFFFFF"), (0, "Rosa e roxo lado a lado")])
        + col("Voz", [(1, "Seu close, seu preço."), (1, "Pago no Pix. Liberado na hora."), (1, "Fica mais perto. Entra pro meu close."), (0, "Plataforma de conteúdo adulto"), (0, "Emoji de fogo ou berinjela")])
        + '</div>'))
    return "".join(S)


html = f'<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy — aplicações da marca</title><style>{CSS}</style></head><body>{doc()}</body></html>'
(HERE / "aplicacoes-marca-clozzy-v2.html").write_text(html, encoding="utf-8")
print("ok", len(html))

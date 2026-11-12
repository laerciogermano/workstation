#!/usr/bin/env python3
"""Clozzy — peças da identidade “Crescente”: helpers inline (símbolo, assinatura, slogan, faixa, ícones, fotos)
e os templates de feed (1080×1080) e stories (1080×1920) em HTML no tamanho real.
Usado por _build.py (manual) e para exportar os PNGs de posts/ e stories/."""
import base64, math
from pathlib import Path

import _simbolos as S

HERE = Path(__file__).resolve().parent
FONTS = HERE.parent / "logo-final-v3" / "fonts"
PINK, DEEP, PURPLE, INK, CREAM, WHITE = S.PINK, S.DEEP, S.PURPLE, S.INK, S.CREAM, S.WHITE
V, f, C = S.V, S.f, S.C

SLOGAN = ("Só pra quem é ", "close", ".")
APOIO = "Venda seu conteúdo exclusivo."


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(Path(p).read_bytes()).decode()


FONT_CSS = (f"@font-face{{font-family:Gabarito;src:url({b64(FONTS / 'Gabarito-Variable.ttf', 'font/ttf')});font-weight:400 900}}"
            f"@font-face{{font-family:Figtree;src:url({b64(FONTS / 'Figtree-Variable.ttf', 'font/ttf')});font-weight:300 900}}")
_PH = {}


def photo(i):
    if i not in _PH:
        _PH[i] = b64(HERE / "img" / f"p{i}.jpg", "image/jpeg")
    return _PH[i]


# ---------- inline -------------------------------------------------------------------------------------
def sym(v, px, kind="crescente", small=None, spin=False, style=""):
    v = V[v] if isinstance(v, str) else v
    small = px <= 32 if small is None else small
    sp = ' class="spin"' if spin else ""
    return (f'<svg{sp} viewBox="5 5 90 90" width="{f(px)}" height="{f(px)}" style="display:block;flex-shrink:0;{style}">'
            f'{S.mark(kind, v, small, spin)}</svg>')


def lock(v, h, kind="crescente", vertical=False, spin=False, style=""):
    v = V[v] if isinstance(v, str) else v
    inner, w, hh = S.lockup(kind, v, vertical, spin)
    sp = ' class="spin"' if spin else ""
    return (f'<svg{sp} viewBox="0 0 {f(w)} {f(hh)}" height="{f(h)}" width="{f(h * w / hh)}" '
            f'style="display:block;flex-shrink:0;{style}">{inner}</svg>')


def faixa(c, h=8, scale=1.0, lens=(2, 5, 10, 18, 30, 48), tail=120, style=""):
    body, w = C.pattern_row(c, 0, h, 6, lens, tail)
    return (f'<svg viewBox="0 0 {f(w)} {h}" width="{f(w * scale)}" height="{f(h * scale)}" '
            f'style="display:block;{style}">{body}</svg>')


def slogan(px, base, accent, italic=True, br=False):
    a, b, c = SLOGAN
    st = "italic" if italic else "normal"
    sep = "<br>" if br else ""
    return (f'<span style="font:800 {st} {px}px/0.98 Gabarito;letter-spacing:-.03em;color:{base}">'
            f'{a}{sep}<span style="color:{accent}">{b}</span>{c}</span>')


def tile(v, px, kind="crescente", radius=22.37):
    return S.svg_tile(kind, V[v] if isinstance(v, str) else v, px, radius)


# ícones: linha 2, pontas redondas, grid 24
ICONS = {
    "estrela": '<path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8L3.6 9.6l5.8-.8z"/>',
    "cadeado": '<rect x="5" y="10.5" width="14" height="10" rx="3"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5M12 14.5v2.5"/>',
    "pix": '<path d="M12 3.5l8.5 8.5-8.5 8.5L3.5 12z"/><path d="M8 12h8"/>',
    "play": '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><path d="M10 8.8v6.4l5-3.2z"/>',
    "chat": '<path d="M4 6.5A3 3 0 0 1 7 3.5h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H10l-4.5 3.5V16.5H7a3 3 0 0 1-3-3z"/>',
    "olho": '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    "coracao": '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
    "camera": '<path d="M3.5 8.5a2 2 0 0 1 2-2h2.3L9.5 4h5l1.7 2.5h2.3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.5"/>',
    "carteira": '<rect x="3.5" y="6" width="17" height="13" rx="3"/><path d="M3.5 9.5h17M15.5 14h2"/>',
    "sino": '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 20.5h4"/>',
    "grafico": '<path d="M4 19.5h16M7 16v-4M11.5 16V8M16 16v-6"/>',
    "usuarios": '<circle cx="9" cy="8.5" r="3.5"/><path d="M3 19.5a6 6 0 0 1 12 0M16 5.5a3.2 3.2 0 0 1 0 6.2M18 19.5a5.5 5.5 0 0 0-2.5-4.6"/>',
}


def icon(name, c, px=24, sw=2):
    return (f'<svg viewBox="0 0 24 24" width="{px}" height="{px}" fill="none" stroke="{c}" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" style="display:block;flex-shrink:0">{ICONS[name]}</svg>')


def btn(t, bg, c, fs=11, pad=None, border=None):
    pad = pad or f"{fs * .8:.0f}px {fs * 1.5:.0f}px"
    bd = f"border:{border};" if border else ""
    return (f'<span style="display:inline-block;background:{bg};color:{c};border-radius:999px;padding:{pad};'
            f'font:800 {fs}px/1 Gabarito;{bd}white-space:nowrap">{t}</span>')


def ring_avatar(img, px, ring_c, gap_c, kind="crescente"):
    """Foto redonda dentro do anel crescente (o avatar com story novo)."""
    v = dict(V["preto"], dash=ring_c, line=ring_c, star=ring_c)
    ring = S.mark(kind, v).split("<polygon")[0]
    inner = px * 0.74
    return (f'<div style="position:relative;width:{f(px)}px;height:{f(px)}px;flex-shrink:0">'
            f'<svg viewBox="5 5 90 90" width="{f(px)}" height="{f(px)}" style="position:absolute;inset:0">{ring}</svg>'
            f'<div style="position:absolute;left:{f((px - inner) / 2)}px;top:{f((px - inner) / 2)}px;width:{f(inner)}px;'
            f'height:{f(inner)}px;border-radius:50%;background:url({photo(img)}) center/cover;box-shadow:0 0 0 {f(px * .02)}px {gap_c}"></div></div>')


# ---------- FEED 1080 ---------------------------------------------------------------------------------
def _box(bg, inner, w=1080, h=1080, extra=""):
    return (f'<div style="width:{w}px;height:{h}px;position:relative;overflow:hidden;background:{bg};'
            f'font-family:Figtree;{extra}">{inner}</div>')


def post_slogan():
    return _box(INK, f'<div style="position:absolute;left:90px;top:90px">{sym("preto", 120)}</div>'
                     f'<div style="position:absolute;left:90px;top:330px">{slogan(150, WHITE, PINK, br=True)}</div>'
                     f'<div style="position:absolute;left:90px;bottom:100px">{faixa(PINK, 18, 1.6)}</div>'
                     f'<div style="position:absolute;right:90px;bottom:84px">{lock("preto", 52)}</div>')


def post_preco():
    return _box(PINK, f'<div style="position:absolute;right:-230px;bottom:-230px">{sym("rosa", 820)}</div>'
                      f'<div style="position:absolute;left:90px;top:96px;font:800 italic 128px/0.95 Gabarito;'
                      f'letter-spacing:-.03em;color:{WHITE}">Seu<br>conteúdo.<br>Seu preço.</div>'
                      f'<div style="position:absolute;left:90px;bottom:96px">{lock("rosa", 50)}</div>')


def post_novo():
    return _box(INK, f'<div style="position:absolute;inset:0;background:url({photo(1)}) center/cover"></div>'
                     f'<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,9,15,0) 35%,rgba(20,9,15,.92))"></div>'
                     f'<div style="position:absolute;left:70px;top:70px;display:flex;gap:16px;align-items:center;'
                     f'background:rgba(20,9,15,.55);border-radius:999px;padding:14px 26px 14px 16px;color:{WHITE};font:800 34px Gabarito">'
                     f'{icon("cadeado", WHITE, 40, 2.4)}Exclusivo</div>'
                     f'<div style="position:absolute;left:80px;bottom:200px;color:{WHITE};font:800 italic 104px/0.95 Gabarito;letter-spacing:-.03em">'
                     f'Conteúdo novo<br><span style="color:{PINK}">no close.</span></div>'
                     f'<div style="position:absolute;left:80px;bottom:90px">{faixa(PINK, 14, 1.3)}</div>'
                     f'<div style="position:absolute;right:80px;bottom:76px">{sym("preto", 74)}</div>')


def post_creator():
    return _box(CREAM, f'<div style="position:absolute;left:90px;top:90px;font:700 30px Figtree;letter-spacing:.14em;color:{DEEP}">PARA CREATORS</div>'
                       f'<div style="position:absolute;left:90px;top:160px;font:800 italic 112px/0.96 Gabarito;letter-spacing:-.03em;color:{INK}">'
                       f'Venda seu<br>conteúdo<br><span style="color:{DEEP}">exclusivo.</span></div>'
                       f'<div style="position:absolute;left:90px;top:580px;font:500 34px/1.4 Figtree;color:rgba(20,9,15,.7);max-width:560px">'
                       f'Fotos, vídeos e stories só para quem assina. Você define o preço e recebe por Pix.</div>'
                       f'<div style="position:absolute;left:90px;bottom:96px">{btn("Criar meu Clozzy", PINK, WHITE, 40)}</div>'
                       f'<div style="position:absolute;right:-60px;top:250px">{sym("cream", 460)}</div>'
                       f'<div style="position:absolute;right:90px;bottom:104px">{lock("cream", 44)}</div>')


def post_passos():
    steps = "".join(
        f'<div style="display:flex;gap:34px;align-items:center;margin-top:{0 if i == 0 else 44}px">'
        f'<div style="width:{86}px;flex-shrink:0">{faixa(PINK, 18, 1, lens=[2, 6, 12][:i + 1], tail=10 + i * 8)}</div>'
        f'<div><div style="font:800 64px/1 Gabarito;color:{WHITE}">{a}</div>'
        f'<div style="font:500 30px/1.35 Figtree;color:rgba(255,255,255,.6);margin-top:6px">{b}</div></div></div>'
        for i, (a, b) in enumerate((("Poste", "Fotos, vídeos e stories, como no Instagram."),
                                    ("Libere", "Só quem assina vê. O resto vê o cadeado."),
                                    ("Receba", "Pix todo mês, direto na sua conta."))))
    return _box(INK, f'<div style="position:absolute;left:90px;top:90px;font:800 italic 96px/0.96 Gabarito;letter-spacing:-.03em;color:{WHITE}">'
                     f'3 passos pra<br><span style="color:{PINK}">faturar.</span></div>'
                     f'<div style="position:absolute;left:90px;top:400px">{steps}</div>'
                     f'<div style="position:absolute;right:90px;top:96px">{sym("preto", 96)}</div>')


def post_giro():
    pat = "".join(f'<div style="position:absolute;left:{x}px;top:{y}px;opacity:{o}">{sym("rosa", s, "giro")}</div>'
                  for x, y, s, o in ((-80, -60, 380, .22), (720, 40, 260, .22), (620, 640, 520, .22), (40, 760, 200, .22)))
    return _box(PINK, pat + f'<div style="position:absolute;left:0;right:0;top:250px;display:flex;justify-content:center">'
                            f'{sym("rosa", 300, "giro")}</div>'
                            f'<div style="position:absolute;left:0;right:0;top:640px;text-align:center;color:{WHITE};'
                            f'font:800 italic 92px/1 Gabarito;letter-spacing:-.03em">Carregando o<br>próximo post…</div>'
                            f'<div style="position:absolute;left:0;right:0;bottom:80px;display:flex;justify-content:center">{lock("rosa", 44)}</div>')


def post_quote():
    return _box(PURPLE, f'<div style="position:absolute;left:90px;top:90px;font:800 260px/0.7 Gabarito;color:rgba(255,255,255,.35)">“</div>'
                        f'<div style="position:absolute;left:90px;top:250px;right:90px;font:800 italic 84px/1.02 Gabarito;'
                        f'letter-spacing:-.025em;color:{WHITE}">Meus close friends viraram assinantes.</div>'
                        f'<div style="position:absolute;left:90px;bottom:100px;display:flex;gap:26px;align-items:center;color:{WHITE}">'
                        f'{ring_avatar(4, 130, WHITE, PURPLE)}<div><div style="font:800 40px Gabarito">@bia.creator</div>'
                        f'<div style="font:500 28px Figtree;opacity:.7;margin-top:4px">1.240 assinantes</div></div></div>'
                        f'<div style="position:absolute;right:90px;bottom:120px">{sym("roxo", 90)}</div>')


def post_pix():
    card = (f'<div style="background:rgba(255,255,255,.1);border-radius:44px;padding:36px 40px;display:flex;gap:30px;align-items:center;'
            f'width:860px">{tile("rosa", 120)}<div style="color:{WHITE}"><div style="font:800 40px Gabarito">Clozzy'
            f'<span style="font:500 28px Figtree;opacity:.5;margin-left:16px">agora</span></div>'
            f'<div style="font:500 34px/1.35 Figtree;opacity:.85;margin-top:6px">Pix recebido: R$ 29,90 de @lua.b<br>Nova assinatura ✦</div></div></div>')
    return _box(INK, f'<div style="position:absolute;left:90px;top:120px;font:800 italic 150px/0.95 Gabarito;letter-spacing:-.03em;color:{WHITE}">'
                     f'Caiu o<br><span style="color:{PINK}">Pix.</span></div>'
                     f'<div style="position:absolute;left:110px;top:560px">{card}</div>'
                     f'<div style="position:absolute;left:110px;top:780px;opacity:.5;transform:scale(.94);transform-origin:left">{card}</div>'
                     f'<div style="position:absolute;left:90px;bottom:80px">{faixa(PINK, 14, 1.3)}</div>'
                     f'<div style="position:absolute;right:90px;bottom:66px">{lock("preto", 44)}</div>')


def post_carrossel():
    st = (f'<div style="position:absolute;right:110px;top:110px;width:440px;height:782px;border-radius:44px;overflow:hidden;'
          f'background:url({photo(3)}) center/cover;box-shadow:0 30px 60px rgba(20,9,15,.25)">'
          f'<div style="position:absolute;left:22px;right:22px;top:22px;display:flex;gap:8px">'
          + "".join(f'<span style="flex:1;height:8px;border-radius:4px;background:{c}"></span>' for c in (WHITE, WHITE, "rgba(255,255,255,.4)"))
          + f'</div><div style="position:absolute;left:22px;top:46px;display:flex;gap:12px;align-items:center;color:{WHITE};font:800 26px Gabarito">'
          f'{sym("preto", 48)}clozzy</div><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">'
          f'<div style="width:150px;height:150px;border-radius:50%;background:rgba(20,9,15,.55);display:flex;align-items:center;justify-content:center">'
          f'{icon("cadeado", WHITE, 74, 2.2)}</div></div></div>')
    return _box(CREAM, st + f'<div style="position:absolute;left:90px;top:96px;font:700 28px Figtree;letter-spacing:.14em;color:{DEEP}">GUIA · 1/5</div>'
                            f'<div style="position:absolute;left:90px;top:160px;font:800 italic 92px/0.98 Gabarito;letter-spacing:-.03em;color:{INK}">'
                            f'Como<br>vender<br>stories<br><span style="color:{DEEP}">exclusivos</span></div>'
                            f'<div style="position:absolute;left:90px;bottom:100px;display:flex;gap:18px;align-items:center;font:700 30px Figtree;color:{INK}">'
                            f'Arrasta {faixa(DEEP, 12, 1, lens=(2, 6, 12), tail=40)}</div>')


POSTS = [("01-slogan", "Slogan", post_slogan), ("02-preco", "Manifesto", post_preco), ("03-conteudo-novo", "Conteúdo novo · foto", post_novo),
         ("04-creators", "Para creators", post_creator), ("05-passos", "Como funciona", post_passos), ("06-giro", "Giro · teaser", post_giro),
         ("07-depoimento", "Depoimento", post_quote), ("08-pix", "Caiu o Pix", post_pix), ("09-carrossel", "Carrossel · capa", post_carrossel)]


# ---------- STORIES 1080×1920 ------------------------------------------------------------------------
def _bars(n=3, on=1, c=WHITE, off="rgba(255,255,255,.35)"):
    return (f'<div style="position:absolute;left:36px;right:36px;top:40px;display:flex;gap:10px">'
            + "".join(f'<span style="flex:1;height:8px;border-radius:4px;background:{c if i < on else off}"></span>' for i in range(n))
            + '</div>')


def _head(v, c=WHITE):
    return (f'<div style="position:absolute;left:36px;top:76px;display:flex;gap:18px;align-items:center;color:{c};font:800 34px Gabarito">'
            f'{sym(v, 70)}clozzy<span style="font:500 30px Figtree;opacity:.6">patrocinado</span></div>')


def story_liberado():
    return _box(INK, f'<div style="position:absolute;inset:0;background:url({photo(5)}) center/cover"></div>'
                     f'<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,9,15,.3),rgba(20,9,15,0) 25%,rgba(20,9,15,0) 45%,rgba(20,9,15,.95) 80%)"></div>'
                     + _bars(3, 1) + _head("preto") +
                     f'<div style="position:absolute;left:80px;right:80px;bottom:420px;color:{WHITE};font:800 italic 130px/0.95 Gabarito;letter-spacing:-.03em">'
                     f'Conteúdo<br>exclusivo<br><span style="color:{PINK}">liberado.</span></div>'
                     f'<div style="position:absolute;left:80px;bottom:300px;font:500 38px Figtree;color:rgba(255,255,255,.7)">Só pra quem assina o close da Bia.</div>'
                     f'<div style="position:absolute;left:80px;right:80px;bottom:150px;text-align:center">{btn("Assinar · R$ 29,90/mês", PINK, WHITE, 46, "34px 0", None).replace("display:inline-block", "display:block")}</div>', 1080, 1920)


def story_giro():
    return _box(PINK, _bars(3, 2) + _head("rosa") +
                f'<div style="position:absolute;left:0;right:0;top:520px;display:flex;justify-content:center">{sym("rosa", 520, "giro", spin=True)}</div>'
                f'<div style="position:absolute;left:0;right:0;top:1150px;text-align:center;color:{WHITE};font:800 italic 120px/0.98 Gabarito;letter-spacing:-.03em">'
                f'Carregando<br>seu close…</div>'
                f'<div style="position:absolute;left:0;right:0;bottom:150px;display:flex;justify-content:center">{lock("rosa", 60)}</div>', 1080, 1920)


def story_porque():
    items = [("cadeado", "Conteúdo só para assinantes"), ("pix", "Pix todo mês, sem burocracia"), ("estrela", "Stories, fotos e vídeos"),
             ("grafico", "Painel com o que vende mais"), ("chat", "Chat direto com quem paga")]
    li = "".join(f'<div style="display:flex;gap:30px;align-items:center;padding:34px 0;border-top:2px solid rgba(255,255,255,.1)">'
                 f'<div style="width:96px;height:96px;border-radius:30px;background:rgba(255,0,101,.16);display:flex;align-items:center;justify-content:center">'
                 f'{icon(a, PINK, 52, 2.2)}</div><div style="font:700 44px Figtree;color:{WHITE}">{b}</div></div>' for a, b in items)
    return _box(INK, _bars(4, 3) + _head("preto") +
                f'<div style="position:absolute;left:80px;top:280px;font:800 italic 120px/0.96 Gabarito;letter-spacing:-.03em;color:{WHITE}">'
                f'Por que<br><span style="color:{PINK}">Clozzy?</span></div>'
                f'<div style="position:absolute;left:80px;right:80px;top:640px">{li}</div>'
                f'<div style="position:absolute;left:80px;bottom:130px">{faixa(PINK, 16, 1.5)}</div>', 1080, 1920)


def story_slogan():
    return _box(CREAM, _bars(3, 3, INK, "rgba(20,9,15,.2)") + _head("cream", INK) +
                f'<div style="position:absolute;left:0;right:0;top:420px;display:flex;justify-content:center">{sym("cream", 420)}</div>'
                f'<div style="position:absolute;left:80px;right:80px;top:960px;text-align:center">{slogan(150, INK, DEEP, br=True)}</div>'
                f'<div style="position:absolute;left:0;right:0;top:1330px;text-align:center;font:500 44px Figtree;color:rgba(20,9,15,.65)">{APOIO}</div>'
                f'<div style="position:absolute;left:0;right:0;bottom:150px;display:flex;justify-content:center">{btn("clozzy.com", INK, WHITE, 42)}</div>',
                1080, 1920)


STORIES = [("01-liberado", "Conteúdo liberado", story_liberado), ("02-giro", "Giro · carregando", story_giro),
           ("03-por-que", "Por que Clozzy", story_porque), ("04-slogan", "Slogan", story_slogan)]


def scaled(html, w, h, target_w, radius=0, shadow=True):
    s = target_w / w
    sh = "box-shadow:0 6px 18px rgba(20,9,15,.14);" if shadow else ""
    return (f'<div style="width:{f(w * s)}px;height:{f(h * s)}px;overflow:hidden;border-radius:{radius}px;{sh}flex-shrink:0">'
            f'<div style="transform:scale({s:.5f});transform-origin:0 0;width:{w}px;height:{h}px">{html}</div></div>')


def contrast(a, b):
    def lum(h):
        r, g, bb = (int(h[i:i + 2], 16) / 255 for i in (1, 3, 5))
        lin = [x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4 for x in (r, g, bb)]
        return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)

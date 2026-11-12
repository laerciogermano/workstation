#!/usr/bin/env python3
"""Clozzy — manual de uso da marca “Estrela macia”.

Base: ../identidade-estrela-macia (ícone = estrela macia com o ponto da câmera; símbolo = estrela no anel do
carregando). Cores: SÓ rosa #FF0065, Pink Deep #E0005A, roxo #7C48C4, preto #000, branco #fff e cinzas neutros.
Nunca creme, nunca quase-preto (ink).
Rodar: python3 _build.py → manual-uso-estrela-macia.html + .pdf + tokens.css + tokens.json"""
import base64, importlib.util, json, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
MARCA = HERE.parent
sys.path.insert(0, str(MARCA / "identidade-estrela-macia"))
import _marca as M  # noqa: E402

_spec = importlib.util.spec_from_file_location("ident_build", MARCA / "identidade-estrela-macia" / "_build.py")
IB = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(IB)        # helpers sym/lock/tile/svg/box da identidade

CHROME = IB.CHROME
FONTS = MARCA / "logo-final-v3" / "fonts"
FOTOS = MARCA / "aplicacoes-v2" / "fotos"
OUT_HTML = HERE / "manual-uso-estrela-macia.html"
OUT_PDF = HERE / "manual-uso-estrela-macia.pdf"
PINK, DEEP, PURPLE, BLACK, WHITE = M.PINK, M.DEEP, M.PURPLE, M.BLACK, M.WHITE
G1, G2, G3, G4 = "#141414", "#222222", "#2A2A2A", "#8C8C8C"     # cinzas do escuro
L1, L2, L3 = "#F2F2F2", "#E6E6E6", "#666666"                     # cinzas do claro
V, f = M.V, M.f
sym, lock, tile, svg = IB.sym, IB.lock, IB.tile, IB.svg

# ------------------------------------------------------------------------------------------------ superfícies
# papel → cor, por superfície. Mesma gramática do protótipo mobile (docs/prototipo-mobile) e da identidade.
TEMAS = {
    "preto": dict(nome="Preto", sup=BLACK, sup2=G1, linha=G3, titulo=WHITE, texto="#E6E6E6", apoio=G4, destaque=PINK,
                  botao=WHITE, botao_txt=BLACK, cta=DEEP, cta_txt=WHITE, chip=G2, marca="preto",
                  uso="Principal. App, vitrine, stories e anúncios."),
    "branco": dict(nome="Branco", sup=WHITE, sup2=L1, linha=L2, titulo=BLACK, texto="#1A1A1A", apoio=L3, destaque=DEEP,
                   botao=DEEP, botao_txt=WHITE, cta=DEEP, cta_txt=WHITE, chip=L1, marca="branco",
                   uso="Conta, ajuda, legal, e-mail e site institucional."),
    "rosa": dict(nome="Rosa", sup=PINK, sup2=DEEP, linha="#FF4D8F", titulo=WHITE, texto=WHITE, apoio="rgba(255,255,255,.85)",
                 destaque=WHITE, botao=WHITE, botao_txt=DEEP, cta=WHITE, cta_txt=DEEP, chip="#FF3384", marca="rosa",
                 uso="Momento de cor: compra aprovada, lançamento, capa. Texto ≥ 20 px."),
    "roxo": dict(nome="Roxo", sup=PURPLE, sup2="#8C5ECB", linha="#A37FD6", titulo=WHITE, texto=WHITE, apoio="#EBE3FA",
                 destaque=WHITE, botao=WHITE, botao_txt=PURPLE, cta=WHITE, cta_txt=PURPLE, chip="#9165CD", marca="roxo",
                 uso="O lado do criador: abrir o close, painel, convites."),
}
ORDER = ["preto", "branco", "rosa", "roxo"]
APP_THEMES = IB.THEMES        # os seis temas do app

PAGES = []


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(Path(p).read_bytes()).decode()


def foot(n, t):
    dark = TEMAS[t]["sup"] != WHITE
    return (f'<div class="foot" style="color:{WHITE if dark else BLACK}"><span>Clozzy · manual de uso da marca · Estrela macia · nov 2026</span>'
            f'<span>{n:02d}</span></div>')


def page(title, body, t="branco", lead=None):
    T = TEMAS[t]
    n = len(PAGES) + 1
    ld = f'<p class="lead" style="color:{T["apoio"] if t != "branco" else L3}">{lead}</p>' if lead else ""
    h = f'<h2 style="color:{T["titulo"]}">{title}</h2>' if title else ""
    PAGES.append(f'<section class="pg" style="background:{T["sup"]};color:{T["texto"]}">{h}{ld}{body}{foot(n, t)}</section>')
    return n


def foto(name, w, h, r=14, pos="50% 40%", locked=False, extra=""):
    lk = (f'<div class="lk"><span>{svg(M.macia(WHITE, 40), "5 5 90 90", 22)}</span></div>' if locked else "")
    return (f'<div class="ft f-{name}{" blur" if locked else ""}" style="width:{w}px;height:{h}px;border-radius:{r}px;'
            f'background-position:{pos};{extra}">{lk}</div>')


def btn(T, label, kind="botao", h=34, fs=12, w=None, extra=""):
    bg, fg = (T["cta"], T["cta_txt"]) if kind == "cta" else (T["botao"], T["botao_txt"])
    if kind == "sec":
        bg, fg = "transparent", T["titulo"]
        extra += f"border:1.5px solid {T['titulo']};"
    ww = f"width:{w}px;" if w else "padding:0 16px;"
    return (f'<span class="bt" style="height:{h}px;font-size:{fs}px;background:{bg};color:{fg};{ww}{extra}">{label}</span>')


def chip(T, label, on=False):
    bg, fg = (T["titulo"], T["sup"]) if on else (T["chip"], T["titulo"])
    return f'<span class="chip" style="background:{bg};color:{fg}">{label}</span>'


def selo(T, label="CLOSE"):
    return (f'<span class="selo" style="background:{T["destaque"]};color:{T["sup"] if T["destaque"] == WHITE else WHITE}">'
            f'{svg(M.macia(T["sup"] if T["destaque"] == WHITE else WHITE, 40, dot=False), "5 5 90 90", 9)}{label}</span>')


def logo_app(T, h=18):
    return lock(V[T["marca"]], h, None)


# ------------------------------------------------------------------------------------------------ CSS
CSS = f"""
@font-face{{font-family:Gabarito;src:url({b64(FONTS / 'Gabarito-Variable.ttf', 'font/ttf')});font-weight:400 900}}
@font-face{{font-family:Figtree;src:url({b64(FONTS / 'Figtree-Variable.ttf', 'font/ttf')});font-weight:300 900}}
{''.join(f'.f-{p.stem}{{background-image:url({b64(p, "image/jpeg")})}}' for p in sorted(FOTOS.glob('*.jpg')))}
@page{{size:297mm 210mm;margin:0}}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:Figtree;background:#D9D9D9}}
svg{{display:block;flex-shrink:0}}
.pg{{width:297mm;height:210mm;padding:14mm 16mm 13mm;position:relative;overflow:hidden;page-break-after:always;margin:0 auto 10px}}
@media print{{.pg{{margin:0}}}}
h1{{font:900 70px/.92 Gabarito;letter-spacing:-.04em}}
h2{{font:900 30px/1.02 Gabarito;letter-spacing:-.03em}}
h3{{font:800 14px/1.1 Gabarito;letter-spacing:-.01em}}
.lead{{font-size:12px;line-height:1.5;max-width:720px;margin-top:7px}}
.foot{{position:absolute;left:16mm;right:16mm;bottom:7mm;display:flex;justify-content:space-between;font:600 9px Figtree;opacity:.5}}
.lbl{{font:700 10px Figtree;opacity:.6;margin-bottom:6px}}
.cap{{font:600 9.5px/1.35 Figtree;opacity:.65;margin-top:6px}}
.cap b{{display:block;font:800 11px Gabarito;opacity:1}}
.row{{display:flex;gap:16px;align-items:flex-start}}
.grid{{display:grid;gap:12px}}
.box{{border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0}}
.ft{{background-size:cover;background-repeat:no-repeat;position:relative;overflow:hidden;flex-shrink:0;background-color:{G2}}}
.ft.blur::before{{content:"";position:absolute;inset:0;backdrop-filter:blur(10px) brightness(.55);-webkit-backdrop-filter:blur(10px) brightness(.55)}}
.lk{{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:2}}
.lk span{{width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center}}
.bt{{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;font-family:Gabarito;font-weight:800;letter-spacing:-.01em;white-space:nowrap}}
.chip{{display:inline-flex;align-items:center;height:22px;padding:0 10px;border-radius:999px;font:700 10px Figtree;white-space:nowrap}}
.selo{{display:inline-flex;align-items:center;gap:3px;height:15px;padding:0 6px;border-radius:999px;font:800 8px Figtree;letter-spacing:.02em}}
.ph{{border-radius:30px;padding:6px;background:{BLACK};border:1.5px solid #3A3A3A;flex-shrink:0}}
.ph.lt{{border-color:#D0D0D0;background:#fff}}
.scr{{border-radius:25px;overflow:hidden;position:relative;height:100%}}
.d{{font-family:Gabarito;font-weight:900;letter-spacing:-.035em;line-height:.95}}
.num{{font-variant-numeric:tabular-nums}}
table{{border-collapse:collapse;width:100%;font-size:10.5px}}
td,th{{padding:7px 8px;text-align:left;border-bottom:1px solid currentColor;border-color:rgba(127,127,127,.25)}}
th{{font:700 10px Figtree;opacity:.6}}
.sw{{display:inline-block;width:12px;height:12px;border-radius:3px;vertical-align:-2px;margin-right:6px;border:1px solid rgba(127,127,127,.35)}}
.bad{{position:relative}}
.bad::after{{content:"";position:absolute;inset:0;border-radius:14px;background:linear-gradient(to top right,transparent 48.5%,{PINK} 49%,{PINK} 51%,transparent 51.5%)}}
.ok{{width:16px;height:16px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font:900 10px Gabarito;margin-right:6px}}
"""


# ------------------------------------------------------------------------------------------------ peças
def phone(inner, T, w=176, h=360):
    lt = " lt" if T["sup"] == WHITE else ""
    return (f'<div class="ph{lt}" style="width:{w}px;height:{h}px"><div class="scr" style="background:{T["sup"]};color:{T["texto"]}">'
            f'<div style="height:22px;display:flex;justify-content:space-between;align-items:center;padding:0 16px;font:700 8px Figtree;color:{T["titulo"]}">'
            f'<span>9:41</span><span>●●● ▮</span></div>{inner}</div></div>')


def tabbar(T, on=0, cri=False):
    items = ["Início", "Explorar", "Biblioteca", "Chat", "Eu"] if not cri else ["Painel", "Conteúdo", "+", "Chat", "Perfil"]
    out = ""
    for i, t in enumerate(items):
        if t == "+":
            out += (f'<span style="width:30px;height:22px;border-radius:8px;background:{T["cta"] if T["sup"] != PINK else WHITE};'
                    f'color:{T["cta_txt"]};display:flex;align-items:center;justify-content:center;font:800 14px Gabarito">+</span>')
        else:
            c = T["destaque"] if i == on else T["apoio"]
            out += f'<span style="font:700 7px Figtree;color:{c};display:flex;flex-direction:column;align-items:center;gap:2px"><i style="width:12px;height:12px;border-radius:4px;border:1.5px solid {c}"></i>{t}</span>'
    return (f'<div style="position:absolute;left:0;right:0;bottom:0;height:40px;background:{T["sup"]};border-top:1px solid {T["linha"]};'
            f'display:flex;justify-content:space-around;align-items:center;padding-bottom:4px">{out}</div>')


def ring_av(T, name, px=34, close=True):
    st = "dashed" if close else "solid"
    return (f'<div style="width:{px}px;height:{px}px;border-radius:50%;border:2px {st} {T["destaque"]};padding:2px;flex-shrink:0">'
            f'<div class="ft f-{name}" style="width:100%;height:100%;border-radius:50%;background-size:260%;background-position:50% 20%"></div></div>')


def s_abertura(T):
    return (f'<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px">'
            f'{sym(V[T["marca"]], 96)}{logo_app(T, 20)}</div>'
            f'<div style="position:absolute;bottom:22px;left:0;right:0;text-align:center;font:600 9px Figtree;color:{T["apoio"]}">Seu close, seu preço.</div>')


def s_inicio(T):
    stories = "".join(f'<div style="text-align:center;font:600 7px Figtree;color:{T["apoio"]}">{ring_av(T, n, 36, c)}<div style="margin-top:3px">{t}</div></div>'
                      for n, t, c in (("costas", "Lara", True), ("labios", "Mel", False), ("cetim", "Duda", True), ("homem", "Theo", False)))
    return (f'<div style="padding:4px 12px 0;display:flex;justify-content:space-between;align-items:center">{logo_app(T, 15)}'
            f'<i style="width:18px;height:18px;border-radius:50%;background:{T["sup2"]}"></i></div>'
            f'<div style="display:flex;gap:8px;padding:10px 12px 0">{stories}</div>'
            f'<div style="display:flex;align-items:center;gap:6px;padding:10px 12px 6px"><div class="ft f-costas" style="width:20px;height:20px;border-radius:50%;background-size:260%"></div>'
            f'<b style="font:800 9px Gabarito;color:{T["titulo"]}">Lara Mendes</b>{selo(T)}</div>'
            f'{foto("costas", 164, 150, 0, "50% 30%")}'
            f'<div style="display:flex;justify-content:space-between;align-items:center;margin:8px 10px;padding:7px 9px;border-radius:10px;background:{T["sup2"]}">'
            f'<span style="font:700 8px Figtree;color:{T["titulo"]}">Close da Duda</span>{btn(T, "Assinar · R$ 14,90", "cta", 20, 8)}</div>'
            f'{tabbar(T, 0)}')


def s_perfil(T):
    grid = "".join(foto(n, 52, 64, 0, p, lk) for n, p, lk in
                   (("costas", "50% 30%", False), ("cetim", "30% 40%", True), ("labios", "60% 50%", False),
                    ("cetim", "80% 70%", True), ("costas", "40% 70%", True), ("labios", "30% 60%", False)))
    return (f'{foto("costas", 164, 70, 0, "50% 35%")}'
            f'<div style="padding:0 12px;margin-top:-22px">{ring_av(T, "costas", 46)}'
            f'<div style="font:900 13px Gabarito;color:{T["titulo"]};margin-top:5px">Lara Mendes</div>'
            f'<div style="font:600 8px Figtree;color:{T["apoio"]}">@laramendes · 3,2 mil no close</div>'
            f'<div style="margin-top:8px;padding:8px;border-radius:10px;border:1.5px solid {T["destaque"]};display:flex;justify-content:space-between;align-items:center">'
            f'<span style="font:800 8.5px Gabarito;color:{T["titulo"]}">Close da Lara</span><b class="num" style="font:900 11px Gabarito;color:{T["destaque"]}">R$ 19,90/mês</b></div></div>'
            f'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin-top:8px">{grid}</div>'
            f'<div style="position:absolute;left:10px;right:10px;bottom:12px">{btn(T, "Entrar no close", "cta", 28, 10, 144)}</div>')


def s_pix(T):
    q = "".join(f'<i style="background:{BLACK if (i * 7 + i // 9) % 3 else "transparent"}"></i>' for i in range(81))
    return (f'<div style="padding:8px 12px;text-align:center"><div style="font:700 8px Figtree;color:{T["apoio"]}">Close da Lara · 1 mês</div>'
            f'<div class="d num" style="font-size:24px;color:{T["destaque"]};margin-top:4px">R$ 19,90</div>'
            f'<div style="width:110px;height:110px;margin:10px auto;background:#fff;border-radius:12px;padding:10px;display:grid;grid-template-columns:repeat(9,1fr)">{q}</div>'
            f'<div style="font:700 8px Figtree;color:{T["titulo"]}">Expira em 14:32</div>'
            f'<div style="margin-top:8px;padding:8px;border-radius:10px;background:{T["sup2"]};font:600 7.5px Figtree;color:{T["apoio"]};text-align:left">'
            f'1. Abra o app do banco<br>2. Pix → Copia e cola<br>3. Volte aqui: libera sozinho</div></div>'
            f'<div style="position:absolute;left:10px;right:10px;bottom:12px">{btn(T, "Copiar código Pix", "botao", 28, 10, 144)}</div>')


def s_aprovado():
    T = TEMAS["rosa"]
    return (f'<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:16px">'
            f'<div style="width:58px;height:58px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;color:{PINK};font:900 26px Gabarito">✓</div>'
            f'<div class="d" style="font-size:22px;color:#fff;margin-top:12px">Você está<br>no close.</div>'
            f'<div style="font:600 8.5px Figtree;color:#fff;margin-top:6px">Pago no Pix. Liberado na hora.</div></div>'
            f'<div style="position:absolute;left:10px;right:10px;bottom:12px">{btn(T, "Ver o conteúdo", "botao", 28, 10, 144)}</div>')


def s_painel(T):
    bars = "".join(f'<i style="flex:1;height:{h}%;border-radius:3px 3px 0 0;background:{T["destaque"] if k == 6 else T["linha"]}"></i>'
                   for k, h in enumerate((30, 45, 38, 60, 52, 80, 96)))
    return (f'<div style="padding:4px 12px 0;display:flex;justify-content:space-between;align-items:center">{logo_app(T, 15)}'
            f'<span style="font:800 7px Figtree;border:1.5px solid {T["titulo"]};color:{T["titulo"]};border-radius:999px;padding:1px 6px">CRIADORA</span></div>'
            f'<div style="padding:10px 12px 0"><div style="font:600 8px Figtree;color:{T["apoio"]}">Novembro</div>'
            f'<div class="d num" style="font-size:24px;color:{T["titulo"]}">R$ 4.812</div>'
            f'<div style="margin-top:8px;padding:8px;border-radius:10px;background:{T["sup2"]}"><div style="display:flex;align-items:flex-end;gap:4px;height:58px">{bars}</div></div>'
            f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px">'
            + "".join(f'<div style="padding:7px;border-radius:10px;background:{T["sup2"]}"><div style="font:600 7px Figtree;color:{T["apoio"]}">{a}</div>'
                      f'<div class="d num" style="font-size:14px;color:{T["titulo"]}">{b}</div></div>' for a, b in (("No close", "3.214"), ("Para sacar", "R$ 2.140")))
            + f'</div></div>{tabbar(T, 0, cri=True)}')


# ------------------------------------------------------------------------------------------------ páginas
def p_capa():
    T = TEMAS["preto"]
    body = (f'<div style="display:flex;justify-content:space-between;height:100%">'
            f'<div style="display:flex;flex-direction:column;justify-content:space-between;padding-bottom:14mm">'
            f'<div><h1 style="color:#fff">Manual de<br>uso da marca</h1>'
            f'<p class="lead" style="color:{G4};max-width:420px;margin-top:16px">Como usar a Estrela macia no app, no site, nas redes, '
            f'nos anúncios e no que a gente imprime. Cores, papéis de cor por superfície, tipografia, voz e exemplos prontos.</p></div>'
            f'{lock("preto", 56)}</div>'
            f'<div style="display:flex;align-items:center;gap:14px">'
            f'{foto("costas", 230, 420, 22, "50% 30%")}<div style="display:flex;flex-direction:column;gap:14px">'
            f'<div class="box" style="width:200px;height:200px;background:{PINK}">{sym("rosa", 150, None)}</div>'
            f'<div class="box" style="width:200px;height:206px;background:{PURPLE}">{sym("roxo", 150)}</div></div></div></div>')
    page(None, body, "preto")


def p_sumario():
    items = ["A marca", "Proteção e tamanhos", "Cores", "Quatro superfícies", "Combinações", "Tipografia", "Elementos gráficos",
             "Fotografia", "Voz", "App · telas", "App · seis temas", "Ícone na tela inicial e push", "Landing no desktop",
             "Landing no celular", "Posts do feed", "Carrossel", "Stories", "Perfil e destaques", "Anúncios", "E-mail",
             "Impressos e brindes", "Não fazer", "Checklist e arquivos"]
    li = "".join(f'<div style="display:flex;gap:14px;padding:7px 0;border-bottom:1px solid {L2};font:700 12.5px Figtree">'
                 f'<span class="num" style="width:26px;color:{DEEP}">{i + 3:02d}</span>{t}</div>' for i, t in enumerate(items))
    page("Sumário", f'<div style="columns:2;column-gap:40px;margin-top:18px;max-width:760px">{li}</div>', "branco")


def p_marca():
    def col(t, txt, ring):
        boxes = "".join(IB.box(s, sym(s, 104, ring), 130, 130) for s in ("preto", "branco", "rosa", "roxo"))
        return (f'<div style="flex:1"><h3 style="font-size:17px">{t}</h3><p class="lead" style="color:{L3}">{txt}</p>'
                f'<div style="display:grid;grid-template-columns:repeat(2,130px);gap:10px;margin-top:12px">{boxes}</div></div>')
    page("A marca", f'<div class="row" style="margin-top:14px;gap:30px">'
         + col("Ícone", "A estrela macia sozinha, com o ponto da câmera. Ícone de app, favicon, botão, selo do close, marca d’água.", None)
         + col("Símbolo", "A estrela no anel do story carregando. Abertura do app, loader, avatar das redes, assinaturas.", M.MAIN_RING)
         + f'<div style="flex:1.1"><h3 style="font-size:17px">Com a palavra</h3><p class="lead" style="color:{L3}">Gabarito 800, sempre ao lado ou embaixo, nunca fundida com o c.</p>'
         + f'<div style="display:grid;gap:10px;margin-top:12px">{IB.box("preto", lock("preto", 42), 300, 76)}{IB.box("branco", lock("branco", 42, None), 300, 76)}'
         + f'<div style="display:flex;gap:10px">{IB.box("rosa", lock("rosa", 92, None, True), 145, 138)}{IB.box("roxo", lock("roxo", 92, vertical=True), 145, 138)}</div></div></div></div>',
         "branco", "Duas formas e a palavra. Use uma forma de cada vez; o ícone resolve 80% dos casos.")


def p_protecao():
    space = (f'<div style="position:relative;width:240px;height:240px;border:1px dashed {DEEP};border-radius:6px;display:flex;align-items:center;justify-content:center">'
             f'{sym("branco", 160)}<span style="position:absolute;top:6px;left:8px;font:700 9px Figtree;color:{DEEP}">¼ do símbolo</span></div>')
    lk = (f'<div style="position:relative;padding:26px;border:1px dashed {DEEP};border-radius:6px;display:inline-block">{lock("branco", 50)}</div>')
    mins = "".join(f'<div style="text-align:center">{x}<div class="cap">{t}</div></div>' for x, t in (
        (sym("branco", 16, None), "Ícone 16 px"), (sym("branco", 32, small=True), "Símbolo 32 px · corte pequeno"),
        (lock("branco", 20, None), "Palavra + ícone 20 px de altura"), (lock("branco", 28), "Palavra + símbolo 28 px")))
    page("Proteção e tamanhos", f'<div class="row" style="margin-top:16px;gap:34px"><div><div class="lbl">Área de proteção</div>{space}</div>'
         f'<div><div class="lbl">No logo com a palavra</div>{lk}<div class="lbl" style="margin-top:26px">Tamanhos mínimos</div>'
         f'<div style="display:flex;gap:30px;align-items:flex-end">{mins}</div></div></div>', "branco",
         "Respiro de ¼ do símbolo em volta, sem texto, foto com detalhe ou borda dentro dele. Abaixo dos mínimos, use só o ícone.")


def p_cores():
    sw = [("Rosa", PINK, "255 0 101", "A cor da marca. Destaque no preto, superfície de momento."),
          ("Pink Deep", DEEP, "224 0 90", "Botão de compra e destaque no branco (texto branco 4,9:1)."),
          ("Roxo", PURPLE, "124 72 196", "O lado do criador. Nunca encosta no rosa."),
          ("Preto", BLACK, "0 0 0", "Preto de verdade. Fundo do app e das peças escuras."),
          ("Branco", WHITE, "255 255 255", "Branco de verdade. Fundo da conta, e-mail e site.")]
    cards = "".join(f'<div><div style="height:150px;border-radius:14px;background:{c};{"border:1px solid #E6E6E6;" if c == WHITE else ""}"></div>'
                    f'<h3 style="margin-top:8px;font-size:15px">{n}</h3><div class="num" style="font:700 10px Figtree;margin-top:2px">{c.upper()} · RGB {r}</div>'
                    f'<div class="cap" style="margin-top:3px">{t}</div></div>' for n, c, r, t in sw)
    greys = "".join(f'<div style="text-align:center"><div style="width:58px;height:34px;border-radius:8px;background:{c};border:1px solid #E6E6E6"></div>'
                    f'<div class="cap num">{c}</div></div>' for c in (G1, G2, G3, G4, L1, L2, L3))
    prop = (f'<div style="display:flex;height:26px;border-radius:8px;overflow:hidden;border:1px solid #E6E6E6;width:520px">'
            f'<i style="flex:55;background:{BLACK}"></i><i style="flex:25;background:{WHITE}"></i><i style="flex:12;background:{PINK}"></i>'
            f'<i style="flex:3;background:{DEEP}"></i><i style="flex:5;background:{PURPLE}"></i></div>'
            f'<div class="cap">Preto 55 · branco 25 · rosa 12 · Pink Deep 3 · roxo 5</div>')
    page("Cores", f'<div class="grid" style="grid-template-columns:repeat(5,1fr);gap:14px;margin-top:16px">{cards}</div>'
         f'<div class="row" style="margin-top:22px;gap:40px"><div><div class="lbl">Proporção numa peça típica</div>{prop}</div>'
         f'<div><div class="lbl">Cinzas neutros (só superfícies, linhas e apoio)</div><div style="display:flex;gap:8px">{greys}</div></div></div>',
         "branco", "Cinco cores e cinzas neutros. Sem creme, sem quase-preto, sem degradê e sem nenhuma outra cor, nem para status.")


def p_superficies():
    roles = [("Superfície", "sup"), ("Superfície 2", "sup2"), ("Linha", "linha"), ("Título", "titulo"), ("Texto", "texto"),
             ("Apoio", "apoio"), ("Destaque", "destaque"), ("Botão", "botao"), ("Texto do botão", "botao_txt"),
             ("Compra (CTA)", "cta"), ("Texto da compra", "cta_txt")]
    head = "<tr><th>Papel</th>" + "".join(f'<th>{TEMAS[t]["nome"]}</th>' for t in ORDER) + "</tr>"
    rows = "".join(f'<tr><td style="font-weight:700">{n}</td>' + "".join(
        f'<td><i class="sw" style="background:{TEMAS[t][k]}"></i><span class="num">{TEMAS[t][k]}</span></td>' for t in ORDER) + "</tr>" for n, k in roles)
    minis = ""
    for t in ORDER:
        T = TEMAS[t]
        bd = "border:1px solid #333;" if t == "preto" else ""
        minis += (f'<div style="background:{T["sup"]};{bd}border-radius:14px;padding:12px;height:150px;position:relative">'
                  f'{logo_app(T, 14)}<div class="d" style="font-size:20px;color:{T["titulo"]};margin-top:12px">Seu close,<br><span style="color:{T["destaque"]}">seu preço.</span></div>'
                  f'<div style="position:absolute;left:12px;bottom:12px;display:flex;gap:6px">{btn(T, "Entrar", "cta", 24, 9)}{btn(T, "Ver", "sec", 24, 9)}</div>'
                  f'<div style="position:absolute;right:12px;top:12px;font:700 8px Figtree;color:{T["apoio"]}">{T["nome"]}</div></div>')
    page("Quatro superfícies", f'<div class="row" style="margin-top:12px;gap:22px"><div style="flex:1.25"><table style="color:#fff">{head}{rows}</table>'
         f'<div class="cap" style="color:{G4};margin-top:10px">' + " · ".join(f'<b style="display:inline;color:#fff">{TEMAS[t]["nome"]}</b> {TEMAS[t]["uso"]}' for t in ORDER) + '</div></div>'
         f'<div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:10px">{minis}</div></div>', "preto",
         "Cada superfície tem a cor certa para cada papel. É a mesma tabela dos tokens (tokens.css) e dos temas do app.")


def p_combinacoes():
    ok = [("preto", "Preto: anel rosa, estrela branca"), ("branco", "Branco: tudo Pink Deep, palavra preta"),
          ("rosa", "Rosa: tudo branco"), ("roxo", "Roxo: tudo branco"), ("deep", "Pink Deep: tudo branco"),
          ("preto-bicolor", "Preto bicolor: traços brancos, linha rosa")]
    oks = "".join(f'<div>{IB.box(s, sym(s, 88), 112, 112)}<div class="cap">{t}</div></div>' for s, t in ok)
    vz = (f'<div style="display:flex;height:70px;border-radius:12px;overflow:hidden;width:330px"><i style="flex:1;background:{PINK}"></i>'
          f'<i style="flex:.25;background:{WHITE}"></i><i style="flex:1;background:{PURPLE}"></i></div>'
          f'<div class="cap">Rosa e roxo só com preto ou branco entre eles.</div>')
    page("Combinações", f'<div class="grid" style="grid-template-columns:repeat(6,112px);gap:14px;margin-top:16px">{oks}</div>'
         f'<div class="row" style="margin-top:22px;gap:34px"><div><div class="lbl">Vizinhança</div>{vz}</div>'
         f'<div style="max-width:420px;font-size:11.5px;line-height:1.6">'
         + "".join(f'<div><span class="ok" style="background:{DEEP};color:#fff">!</span>{t}</div>' for t in (
             "Nada preto sobre o rosa: texto, ícone, linha ou sombra.", "Rosa e roxo nunca um sobre o outro.",
             "No branco, o rosa vira Pink Deep (contraste para texto).", "No rosa, texto só a partir de 20 px; abaixo disso use Pink Deep.",
             "Foto: marca branca ou rosa, sempre sobre área escura e calma da imagem.")) + "</div></div>",
         "branco", "As combinações aprovadas para a marca. Em dúvida, use preto com rosa e branco.")


def p_tipo():
    scale = [("Display", "900 · 64/0,92", 54, 900, "Gabarito", "Seu close."), ("Título", "900 · 30/1,02", 30, 900, "Gabarito", "Entrar no close"),
             ("Subtítulo", "800 · 17", 17, 800, "Gabarito", "Pack Noite de cetim"), ("Texto", "400 · 13/1,5", 13, 400, "Figtree", "Tudo do perfil enquanto o close estiver ativo. Cancela quando quiser."),
             ("Apoio", "600 · 11", 11, 600, "Figtree", "há 12 min · 3,2 mil no close"), ("Preço", "900 · tabular", 22, 900, "Gabarito", "R$ 19,90")]
    rows = "".join(f'<div style="display:flex;gap:20px;align-items:baseline;padding:10px 0;border-bottom:1px solid {L2}">'
                   f'<div style="width:130px;font:700 10px Figtree;color:{L3}">{n}<br>{fam} {spec}</div>'
                   f'<div class="num" style="font:{w} {s}px/{1.1 if fam == "Gabarito" else 1.5} {fam};letter-spacing:{-.035 if fam == "Gabarito" else 0}em;'
                   f'color:{DEEP if n == "Preço" else BLACK}">{t}</div></div>' for n, spec, s, w, fam, t in scale)
    page("Tipografia", f'<div class="row" style="margin-top:12px;gap:34px"><div style="flex:1.4">{rows}</div>'
         f'<div style="flex:1"><div class="d" style="font-size:120px;color:{BLACK}">Aa</div><div class="cap">Gabarito · títulos, preços, botões e a palavra clozzy</div>'
         f'<div style="font:400 64px/1 Figtree;margin-top:18px">Aa</div><div class="cap">Figtree · texto, apoio, rótulos</div>'
         f'<div style="font-size:11px;line-height:1.6;margin-top:16px;color:{L3}">Títulos em caixa normal, nunca tudo maiúsculo. Rótulos sem letras espaçadas. Números de preço e saldo sempre tabulares.</div></div></div>',
         "branco", "Duas famílias. Gabarito fala alto; Figtree explica.")


def p_elementos():
    T = TEMAS["preto"]
    faixa, fw = M.C.pattern_row(PINK, 0, 10, 7)
    faixa_svg = svg(faixa, f"0 0 {f(fw)} 10", 520, 520 * 10 / fw)
    estampa = "".join(f'<div style="display:flex;align-items:center;justify-content:center">{svg(M.macia(PINK if (i + i // 6) % 3 == 0 else G3, 34), "5 5 90 90", 34)}</div>' for i in range(36))
    page("Elementos gráficos", f'<div class="row" style="margin-top:16px;gap:28px">'
         f'<div><div class="lbl" style="color:#fff">Anel carregando</div>{IB.box("preto", svg(M.RING["carregando"][3](PINK, PINK), "5 5 90 90", 180), 220, 220, "border:1px solid #333")}'
         f'<div class="cap">Moldura de avatar, loader, destaque de story.</div></div>'
         f'<div><div class="lbl" style="color:#fff">Tracejado crescente</div><div style="padding:18px 0">{faixa_svg}</div>'
         f'<div style="padding:4px 0">{svg(M.C.pattern_row(WHITE, 0, 10, 7)[0], f"0 0 {f(fw)} 10", 300, 300 * 10 / fw)}</div>'
         f'<div class="cap">Divisor, faixa de capa, rodapé de post. Sempre com a ponta curta à esquerda.</div>'
         f'<div class="lbl" style="color:#fff;margin-top:20px">Selo do close</div><div style="display:flex;gap:8px;zoom:1.8">{selo(T)}{selo(TEMAS["branco"])}{selo(TEMAS["rosa"])}</div></div>'
         f'<div><div class="lbl" style="color:#fff">Estampa de estrelas</div><div style="display:grid;grid-template-columns:repeat(6,34px);gap:6px;'
         f'padding:12px;border-radius:14px;border:1px solid #333">{estampa}</div><div class="cap">Embalagem, fundo de evento, ecobag.</div></div></div>',
         "preto", "Peças que saem da marca e ajudam sem competir com ela. Use um por peça.")


def p_foto():
    cards = "".join(f'<div>{foto(n, 150, 200, 14, p)}<div class="cap"><b>{t}</b>{d}</div></div>' for n, p, t, d in (
        ("costas", "50% 30%", "Pele e sombra", "Luz baixa, recorte, nada explícito na vitrine."),
        ("labios", "60% 50%", "Detalhe", "Close de verdade: boca, mão, tecido."),
        ("cetim", "50% 50%", "Textura", "Tecido e luz como fundo de texto."),
        ("homem", "50% 25%", "Bastidor", "Gente real, sem cara de banco de imagem.")))
    over = (f'<div style="position:relative">{foto("costas", 260, 330, 18, "50% 30%")}'
            f'<div style="position:absolute;left:16px;top:16px">{lock("mono-branco", 18, None)}</div>'
            f'<div class="d" style="position:absolute;left:16px;bottom:56px;font-size:30px;color:#fff">Só pro<br><span style="color:{PINK}">close.</span></div>'
            f'<div style="position:absolute;left:16px;bottom:18px">{btn(TEMAS["preto"], "Entrar no close", "cta", 28, 11)}</div></div>')
    blur = (f'<div style="position:relative">{foto("cetim", 200, 330, 18, "50% 50%", True)}<div class="cap">Conteúdo pago: desfoque + estrela, nunca tarja.</div></div>')
    page("Fotografia", f'<div class="row" style="margin-top:14px;gap:16px">{cards}</div>'
         f'<div class="row" style="margin-top:16px;gap:20px">{over}{blur}<div style="max-width:300px;font-size:11.5px;line-height:1.6;color:#E6E6E6">'
         f'Fotos escuras, com uma luz quente e rosa. A marca entra branca ou rosa, sempre sobre área calma. Na vitrine, o que é '
         f'pago aparece desfocado com a estrela no meio. Sem filtro colorido por cima e sem degradê.</div></div>',
         "preto", "Direção de arte das fotos: íntimo, escuro, quente. A foto conta a história; a marca assina.")


def p_voz():
    pairs = [("Seu close, seu preço.", "Assinatura da marca."), ("Entrar no close", "Botão de assinar."),
             ("Pago no Pix. Liberado na hora.", "Confirmação de compra."), ("Abrir meu close", "Ativar o modo criador."),
             ("Só pro close.", "Conteúdo exclusivo."), ("Você está no close.", "Pagamento aprovado.")]
    do = "".join(f'<div style="padding:10px 0;border-bottom:1px solid {L2}"><div class="d" style="font-size:22px">{a}</div>'
                 f'<div class="cap" style="margin-top:2px">{b}</div></div>' for a, b in pairs)
    dd = [("Fale como quem está perto: curto, direto, com intimidade.", "Desbloqueie conteúdos premium exclusivos agora!"),
          ("Diga o que acontece: “Pago no Pix. Liberado na hora.”", "Sua transação foi processada com sucesso."),
          ("Close, criador, fã, pack.", "Usuário, cliente, produto digital."),
          ("Desejo sem ser explícito na vitrine.", "Palavrão, emoji em excesso, CAPS.")]
    rows = "".join(f'<tr><td><span class="ok" style="background:{DEEP};color:#fff">✓</span>{a}</td><td style="color:{L3}"><span class="ok" style="background:{L2};color:{BLACK}">✕</span>{b}</td></tr>' for a, b in dd)
    page("Voz", f'<div class="row" style="margin-top:12px;gap:36px"><div style="flex:1">{do}</div>'
         f'<div style="flex:1.2"><div class="lbl">Como falar</div><table>{rows}</table></div></div>', "branco",
         "Íntima, curta e segura. A Clozzy fala como alguém do close, não como um banco.")


def p_app():
    T = TEMAS["preto"]
    ph = "".join(f'<div style="text-align:center">{phone(fn(T), T)}<div class="cap" style="color:#fff">{t}</div></div>' for fn, t in (
        (s_abertura, "Abertura · símbolo"), (s_inicio, "Início · ícone + palavra"), (s_perfil, "Perfil · anel do close"), (s_pix, "Pix")))
    ph += f'<div style="text-align:center">{phone(s_aprovado(), TEMAS["rosa"])}<div class="cap" style="color:#fff">Aprovado · momento rosa</div></div>'
    page("App · telas", f'<div class="row" style="margin-top:14px;gap:14px">{ph}</div>', "preto",
         "No app o fundo é preto. O símbolo só na abertura e no loader; no topo das telas, ícone + palavra. O rosa entra inteiro uma vez: no pagamento aprovado.")


def p_app_temas():
    cols = ""
    for th in APP_THEMES:
        _id, nm, bg, sf, vs, (bb, bt), ac = th
        base = "branco" if bg == WHITE else ("rosa" if bg == PINK else ("roxo" if bg == PURPLE else "preto"))
        T = dict(TEMAS[base])
        T.update(cta=bb, cta_txt=bt, destaque=ac, marca=vs)
        cols += f'<div style="text-align:center">{phone(s_inicio(T), T, 150, 306)}<div class="cap" style="color:#fff">{nm}</div></div>'
    page("App · seis temas", f'<div class="row" style="margin-top:14px;gap:12px">{cols}</div>', "preto",
         "Os temas do protótipo mobile (docs/prototipo-mobile). A marca segue o fundo: no preto, rosa e branco; no branco, Pink Deep; no rosa e no roxo, tudo branco.")


def p_homescreen():
    apps = "".join(f'<div style="text-align:center"><div style="width:40px;height:40px;border-radius:11px;background:{c}"></div><div style="font:600 7px Figtree;color:{G4};margin-top:3px">App</div></div>' for c in ("#2A2A2A", "#3A3A3A", "#222", "#333", "#2A2A2A", "#3A3A3A", "#222"))
    home = (f'<div class="ph" style="width:220px;height:440px"><div class="scr" style="background:{BLACK};padding:46px 18px">'
            f'<div style="display:grid;grid-template-columns:repeat(4,40px);gap:14px 0;justify-content:space-between">{apps}'
            f'<div style="text-align:center">{tile("rosa", 40, None)}<div style="font:600 7px Figtree;color:#fff;margin-top:3px">Clozzy</div></div></div></div></div>')
    push = "".join(f'<div style="width:330px;padding:10px 12px;border-radius:16px;background:{G2};display:flex;gap:10px;align-items:center;margin-bottom:8px">'
                   f'{tile("rosa", 30, None, 8)}<div style="flex:1"><div style="display:flex;justify-content:space-between;font:700 9px Figtree;color:{G4}"><span>CLOZZY</span><span>{h}</span></div>'
                   f'<div style="font:800 11px Gabarito;color:#fff;margin-top:2px">{t}</div><div style="font:500 10px Figtree;color:#E6E6E6">{d}</div></div></div>'
                   for t, d, h in (("Lara postou no close", "6 fotos novas. Só pra quem está dentro.", "agora"),
                                   ("Você está no close da Lara", "Pago no Pix. Liberado na hora.", "2 min"),
                                   ("Seu close da Nina vence em 2 dias", "Renova no Pix em um toque.", "1 h")))
    sizes = "".join(f'<div style="text-align:center">{tile(s, 70, None)}<div class="cap" style="color:#fff">{V[s]["name"].split(" · ")[0]}</div></div>' for s in ("rosa", "preto", "roxo"))
    page("Ícone na tela inicial e push", f'<div class="row" style="margin-top:14px;gap:34px">{home}<div><div class="lbl" style="color:#fff">Notificações</div>{push}'
         f'<div class="lbl" style="color:#fff;margin-top:16px">Ícone do app (principal: rosa)</div><div style="display:flex;gap:14px">{sizes}</div></div></div>',
         "preto", "No ícone do app vai só a estrela, branca no rosa: é o que se reconhece entre os outros apps.")


def browser(inner, w, h, bg):
    return (f'<div style="width:{w}px;height:{h}px;border-radius:12px;overflow:hidden;border:1px solid #D0D0D0;background:{bg};flex-shrink:0">'
            f'<div style="height:20px;background:{L1};display:flex;align-items:center;gap:5px;padding:0 9px">'
            + "".join(f'<i style="width:7px;height:7px;border-radius:50%;background:#C8C8C8"></i>' for _ in range(3))
            + f'<span style="margin-left:10px;font:600 8px Figtree;color:{L3}">clozzy.com.br</span></div>{inner}</div>')


def p_landing():
    T = TEMAS["preto"]
    hero = (f'<div style="background:{BLACK};padding:14px 22px 0;height:250px;position:relative;overflow:hidden">'
            f'<div style="display:flex;justify-content:space-between;align-items:center">{logo_app(T, 16)}'
            f'<div style="display:flex;gap:14px;align-items:center;font:600 9px Figtree;color:#E6E6E6"><span>Explorar</span><span>Para criadores</span>{btn(T, "Entrar", "botao", 22, 9)}</div></div>'
            f'<div style="display:flex;justify-content:space-between;margin-top:26px"><div>'
            f'<div class="d" style="font-size:46px;color:#fff">Seu close,<br><span style="color:{PINK}">seu preço.</span></div>'
            f'<div style="font:500 11px/1.5 Figtree;color:{G4};margin-top:10px;max-width:280px">O exclusivo de quem você segue. Assinatura, packs e mensagens. Pago no Pix, liberado na hora.</div>'
            f'<div style="display:flex;gap:8px;margin-top:14px">{btn(T, "Explorar criadores", "cta", 30, 11)}{btn(T, "Sou criador", "sec", 30, 11)}</div></div>'
            f'<div style="display:flex;gap:8px;margin-right:6px">{foto("costas", 120, 200, 14, "50% 30%")}{foto("labios", 120, 200, 14, "60% 50%", True)}</div></div></div>')
    steps = "".join(f'<div style="flex:1"><div class="d num" style="font-size:26px;color:{DEEP}">{i}</div><div style="font:800 12px Gabarito;margin-top:2px">{a}</div>'
                    f'<div style="font:500 9.5px/1.45 Figtree;color:{L3};margin-top:3px">{b}</div></div>'
                    for i, a, b in ((1, "Escolha quem você quer de perto", "Perfis com prévia liberada e preço na vitrine."),
                                    (2, "Pague no Pix", "QR Code ou copia e cola. Sem cartão."),
                                    (3, "Entre no close", "Tudo fica na sua biblioteca.")))
    how = f'<div style="background:#fff;padding:18px 22px;display:flex;gap:24px">{steps}</div>'
    cri = (f'<div style="background:{PURPLE};padding:16px 22px;display:flex;justify-content:space-between;align-items:center">'
           f'<div class="d" style="font-size:22px;color:#fff">Abra o seu close.</div>{btn(TEMAS["roxo"], "Quero vender", "botao", 26, 10)}</div>')
    page("Landing no desktop", f'<div style="margin-top:12px">{browser(hero + how + cri, 860, 420, "#fff")}</div>', "branco",
         "Hero no preto com foto e a frase da marca; como funciona no branco; chamada para criador no roxo. Rosa e roxo separados por branco.")


def p_landing_mobile():
    T = TEMAS["preto"]
    a = (f'<div style="padding:8px 12px;display:flex;justify-content:space-between;align-items:center">{logo_app(T, 13)}{btn(T, "Entrar", "botao", 18, 8)}</div>'
         f'{foto("costas", 164, 170, 0, "50% 30%")}<div style="padding:10px 12px"><div class="d" style="font-size:24px;color:#fff">Seu close,<br><span style="color:{PINK}">seu preço.</span></div>'
         f'<div style="margin-top:10px">{btn(T, "Explorar criadores", "cta", 26, 10, 140)}</div></div>')
    W = TEMAS["branco"]
    b = (f'<div style="padding:12px"><div class="d" style="font-size:18px;color:{BLACK}">Como funciona</div>'
         + "".join(f'<div style="display:flex;gap:8px;margin-top:10px"><b class="d" style="font-size:18px;color:{DEEP}">{i}</b><div style="font:600 9px/1.4 Figtree;color:{BLACK}">{t}</div></div>'
                   for i, t in ((1, "Escolha quem você quer de perto"), (2, "Pague no Pix, sem cartão"), (3, "Entre no close e veja tudo")))
         + f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:14px">'
         + "".join(f'<div>{foto(n, 68, 86, 10, p)}<div style="font:800 8px Gabarito;margin-top:3px;color:{BLACK}">{t}</div><div class="num" style="font:800 8px Gabarito;color:{DEEP}">a partir de {v}</div></div>'
                   for n, p, t, v in (("costas", "50% 30%", "Lara Mendes", "R$ 4,90"), ("cetim", "40% 40%", "Duda Prado", "R$ 7,90")))
         + '</div></div>')
    R = TEMAS["roxo"]
    c = (f'<div style="padding:30px 14px;text-align:center">{sym("roxo", 84)}<div class="d" style="font-size:24px;color:#fff;margin-top:14px">Abra o<br>seu close.</div>'
         f'<div style="font:500 9px/1.45 Figtree;color:#EBE3FA;margin-top:8px">Assinatura, packs e mensagens. Você define o preço e recebe no Pix.</div>'
         f'<div style="margin-top:14px">{btn(R, "Quero vender", "botao", 26, 10, 140)}</div></div>')
    page("Landing no celular", f'<div class="row" style="margin-top:14px;gap:20px">{phone(a, T, 180, 380)}{phone(b, W, 180, 380)}{phone(c, R, 180, 380)}'
         f'<div style="max-width:250px;font-size:11.5px;line-height:1.6;color:{L3}">No celular a página vira três telas: a promessa no preto, o passo a passo no branco e o criador no roxo. '
         f'O botão de compra é Pink Deep no preto e no branco; no roxo, branco com texto roxo.</div></div>', "branco")


def post(kind, w, h):
    """Posts 1:1 e 4:5 para o feed."""
    if kind == "frase":
        return (f'<div style="width:{w}px;height:{h}px;border-radius:10px;background:{BLACK};padding:16px;position:relative;border:1px solid #333">'
                f'{lock("preto", 14, None)}<div class="d" style="position:absolute;left:16px;bottom:40px;font-size:{w * .16}px;color:#fff">Seu close,<br><span style="color:{PINK}">seu preço.</span></div>'
                f'<div style="position:absolute;left:16px;bottom:16px">{svg(M.C.pattern_row(PINK, 0, 6, 4)[0], "0 0 330 6", w * .55, w * .55 * 6 / 330)}</div></div>')
    if kind == "foto":
        return (f'<div style="position:relative">{foto("costas", w, h, 10, "50% 30%")}<div style="position:absolute;left:14px;top:14px">{lock("mono-branco", 13, None)}</div>'
                f'<div class="d" style="position:absolute;left:14px;bottom:16px;font-size:{w * .13}px;color:#fff">Bastidor<br>de quinta.</div></div>')
    if kind == "rosa":
        return (f'<div style="width:{w}px;height:{h}px;border-radius:10px;background:{PINK};padding:16px;position:relative;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center">'
                f'{sym("rosa", w * .38, None)}<div class="d" style="font-size:{w * .12}px;color:#fff;margin-top:12px">Pago no Pix.<br>Liberado na hora.</div></div>')
    if kind == "roxo":
        return (f'<div style="width:{w}px;height:{h}px;border-radius:10px;background:{PURPLE};padding:16px;position:relative">'
                f'{lock("roxo", 14, None)}<div class="d" style="position:absolute;left:16px;bottom:52px;font-size:{w * .14}px;color:#fff">Abra o<br>seu close.</div>'
                f'<div style="position:absolute;left:16px;bottom:16px">{btn(TEMAS["roxo"], "Link na bio", "botao", 22, 9)}</div></div>')
    if kind == "lock":
        return (f'<div style="position:relative">{foto("cetim", w, h, 10, "50% 50%", True)}<div style="position:absolute;left:0;right:0;bottom:14px;text-align:center">'
                f'<div class="d" style="font-size:{w * .1}px;color:#fff">Só pro close.</div></div></div>')
    return (f'<div style="width:{w}px;height:{h}px;border-radius:10px;background:#fff;border:1px solid #E6E6E6;padding:16px;position:relative">'
            f'{lock("branco", 14, None)}<div class="d num" style="position:absolute;left:16px;bottom:44px;font-size:{w * .2}px;color:{DEEP}">3.214</div>'
            f'<div style="position:absolute;left:16px;bottom:22px;font:700 {w * .045}px Figtree;color:{BLACK}">pessoas no close da Lara</div></div>')


def p_posts():
    items = [("frase", "Frase da marca · preto"), ("foto", "Foto + marca branca"), ("rosa", "Momento rosa · tudo branco"),
             ("roxo", "Criador · roxo"), ("lock", "Teaser desfocado"), ("num", "Número · branco")]
    cells = "".join(f'<div>{post(k, 158, 198)}<div class="cap" style="color:#fff">{t}</div></div>' for k, t in items)
    page("Posts do feed", f'<div class="grid" style="grid-template-columns:repeat(6,158px);gap:10px;margin-top:14px">{cells}</div>'
         f'<div class="row" style="margin-top:14px;gap:10px">{post("frase", 180, 180)}{post("rosa", 180, 180)}{post("foto", 180, 180)}'
         f'<div style="max-width:300px;font-size:11.5px;line-height:1.6;color:#E6E6E6">Feed em ritmo: preto, foto, momento de cor. '
         f'A marca fica no canto de cima, pequena (ícone + palavra). Um título curto por post, no máximo duas linhas. 4:5 em cima, 1:1 embaixo.</div></div>',
         "preto", "Seis tipos de post. Alterne para o feed não virar um bloco de uma cor só.")


def p_carrossel():
    W = 150
    cards = [
        f'<div style="width:{W}px;height:190px;border-radius:10px;background:{BLACK};border:1px solid #333;padding:12px;position:relative">{lock("preto", 11, None)}'
        f'<div class="d" style="position:absolute;left:12px;bottom:20px;font-size:24px;color:#fff">Como entrar<br>no <span style="color:{PINK}">close</span></div></div>',
    ] + [f'<div style="width:{W}px;height:190px;border-radius:10px;background:{BLACK};border:1px solid #333;padding:12px;position:relative">'
         f'<div class="d num" style="font-size:40px;color:{PINK}">{i}</div><div class="d" style="font-size:17px;color:#fff;margin-top:8px">{t}</div>'
         f'<div style="font:500 9px/1.45 Figtree;color:{G4};margin-top:6px">{d}</div></div>'
         for i, t, d in ((1, "Escolha quem você quer de perto", "Prévia liberada e preço na vitrine."), (2, "Pague no Pix", "QR Code ou copia e cola."),
                         (3, "Entre no close", "Tudo fica na sua biblioteca."))] + [
        f'<div style="width:{W}px;height:190px;border-radius:10px;background:{PINK};padding:12px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center">'
        f'{sym("rosa", 64)}<div class="d" style="font-size:18px;color:#fff;margin-top:10px">Seu close,<br>seu preço.</div><div style="margin-top:10px">{btn(TEMAS["rosa"], "Link na bio", "botao", 20, 8)}</div></div>']
    strip = "".join(cards)
    page("Carrossel", f'<div style="display:flex;gap:6px;margin-top:16px">{strip}</div>'
         f'<div style="display:flex;gap:6px;margin-top:6px">' + "".join(f'<div style="width:{W}px;height:4px;border-radius:2px;background:{PINK if i == 0 else G3}"></div>' for i in range(5)) + '</div>'
         f'<p class="lead" style="color:{G4};margin-top:16px">Capa com a pergunta, um passo por card com o número em rosa, fechamento no rosa com o símbolo. O tracejado crescente pode ligar os cards no rodapé.</p>',
         "preto", "Carrossel educativo: cinco cards, um assunto.")


def story(inner, bg, w=150, h=266, extra=""):
    return f'<div style="width:{w}px;height:{h}px;border-radius:14px;overflow:hidden;position:relative;background:{bg};flex-shrink:0;{extra}">{inner}</div>'


def p_stories():
    bars = lambda c: (f'<div style="position:absolute;top:8px;left:8px;right:8px;display:flex;gap:3px">'
                      + "".join(f'<i style="flex:1;height:2.5px;border-radius:2px;background:{c};opacity:{1 if k < 2 else .35}"></i>' for k in range(4)) + '</div>')
    a = story(f'{foto("costas", 150, 266, 0, "50% 30%")}{bars("#fff")}<div style="position:absolute;left:10px;top:18px">{lock("mono-branco", 11, None)}</div>'
              f'<div class="d" style="position:absolute;left:10px;bottom:52px;font-size:20px;color:#fff">Saiu pack<br>novo.</div>'
              f'<div style="position:absolute;left:10px;right:10px;bottom:14px">{btn(TEMAS["preto"], "Ver pack", "cta", 24, 9, 130)}</div>', BLACK)
    b = story(f'{foto("cetim", 150, 266, 0, "50% 50%", True)}{bars("#fff")}<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;z-index:3">'
              f'{sym("preto", 70)}<div class="d" style="font-size:18px;color:#fff;margin-top:10px">Só pro<br>close.</div></div>', BLACK)
    c = story(f'{bars("#fff")}<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:12px">'
              f'{sym("rosa", 70, None)}<div class="d" style="font-size:20px;color:#fff;margin-top:12px">Você está<br>no close.</div>'
              f'<div style="font:600 8.5px Figtree;color:#fff;margin-top:6px">Pago no Pix. Liberado na hora.</div></div>', PINK)
    d = story(f'{bars("#fff")}<div style="position:absolute;left:12px;top:22px">{lock("roxo", 11, None)}</div><div style="position:absolute;left:12px;right:12px;bottom:22px">'
              f'<div class="d" style="font-size:22px;color:#fff">Abra o seu<br>close.</div><div style="font:500 8.5px/1.4 Figtree;color:#EBE3FA;margin-top:6px">Você define o preço, recebe no Pix.</div>'
              f'<div style="margin-top:10px">{btn(TEMAS["roxo"], "Quero vender", "botao", 24, 9, 126)}</div></div>', PURPLE)
    e = story(f'{bars(PINK)}<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px">'
              f'{sym("preto", 80)}<div style="font:700 9px Figtree;color:{G4}">carregando o close…</div></div>', BLACK, extra="border:1px solid #333")
    cap = ["Lançamento · foto", "Teaser do close", "Compra aprovada", "Convite para criador", "Loader / transição"]
    cells = "".join(f'<div>{x}<div class="cap" style="color:#fff">{t}</div></div>' for x, t in zip((a, b, c, d, e), cap))
    page("Stories", f'<div class="row" style="margin-top:14px;gap:14px">{cells}</div>', "preto",
         "9:16 com 250 px livres em cima e embaixo (área da interface). Marca pequena no topo, texto e botão no terço de baixo.")


def p_perfil():
    T = TEMAS["preto"]
    hl = "".join(f'<div style="text-align:center;font:600 7px Figtree;color:#E6E6E6"><div style="width:40px;height:40px;border-radius:50%;border:1.5px solid #333;'
                 f'display:flex;align-items:center;justify-content:center;background:{bg}">{svg(M.macia(fg, 40) if t != "Lives" else M.RING["carregando"][3](fg, fg), "5 5 90 90", 22)}</div>'
                 f'<div style="margin-top:3px">{t}</div></div>' for t, bg, fg in (("Close", PINK, WHITE), ("Como funciona", BLACK, PINK), ("Packs", BLACK, WHITE), ("Lives", BLACK, PINK), ("Criadores", PURPLE, WHITE)))
    def gcell(k):
        if k in ("costas", "labios", "cetim"):
            return foto(k, 62, 78, 0, "50% 35%", k == "cetim")
        bg, s = {"rosa": (PINK, "rosa"), "roxo": (PURPLE, "roxo"), "preto": (BLACK, "preto")}[k]
        return f'<div style="height:78px;background:{bg};display:flex;align-items:center;justify-content:center;{"border:1px solid #2A2A2A;" if bg == BLACK else ""}">{sym(s, 34, None if k != "preto" else M.MAIN_RING)}</div>'
    grid = "".join(gcell(k) for k in ("preto", "costas", "rosa", "cetim", "roxo", "labios", "rosa", "costas", "preto"))
    prof = (f'<div style="padding:8px 12px"><div style="display:flex;align-items:center;gap:12px">'
            f'<div style="width:56px;height:56px;border-radius:50%;overflow:hidden;flex-shrink:0">{tile("rosa", 56, None, 0)}</div>'
            f'<div style="display:flex;gap:12px;font:700 8px Figtree;color:#fff;text-align:center">' + "".join(f'<div><b class="num" style="font:900 11px Gabarito;display:block">{a}</b>{b}</div>' for a, b in (("312", "posts"), ("48,2 mil", "seguidores"), ("9", "seguindo"))) + '</div></div>'
            f'<div style="font:800 9px Gabarito;color:#fff;margin-top:6px">Clozzy</div><div style="font:500 8px/1.4 Figtree;color:#E6E6E6">Seu close, seu preço.<br>Pago no Pix. Liberado na hora.<br><span style="color:{PINK}">clozzy.com.br</span></div>'
            f'<div style="display:flex;gap:2px;margin-top:8px;zoom:.86">{hl}</div></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px">{grid}</div>')
    avs = "".join(f'<div style="text-align:center"><div style="width:84px;height:84px;border-radius:50%;overflow:hidden">{tile(s, 84, r, 0)}</div><div class="cap" style="color:#fff">{t}</div></div>'
                  for s, r, t in (("rosa", None, "Avatar principal"), ("preto", M.MAIN_RING, "Avatar com anel"), ("roxo", None, "Conta de criadores")))
    page("Perfil e destaques", f'<div class="row" style="margin-top:14px;gap:30px">{phone(prof, T, 200, 410)}'
         f'<div><div class="lbl" style="color:#fff">Avatar (a rede corta em círculo; marca a 60%)</div><div style="display:flex;gap:16px">{avs}</div>'
         f'<div class="lbl" style="color:#fff;margin-top:20px">Capas de destaque</div><div style="display:flex;gap:10px;zoom:1.5">{hl}</div>'
         f'<p class="lead" style="color:{G4};margin-top:16px;max-width:380px">Bio em três linhas com a frase da marca. Destaques com a estrela ou o anel, uma cor por capa; '
         f'o rosa e o roxo nunca lado a lado sem uma capa preta no meio.</p></div></div>', "preto", "Instagram, TikTok e X: mesma foto de perfil, mesma bio.")


def ad(kind, w, h):
    if kind == "foto":
        return (f'<div style="position:relative">{foto("labios", w, h, 10, "60% 50%")}<div style="position:absolute;left:12px;top:12px">{lock("mono-branco", 12, None)}</div>'
                f'<div style="position:absolute;left:12px;right:12px;bottom:12px"><div class="d" style="font-size:{min(w, h) * .12}px;color:#fff">O exclusivo de<br>quem você segue.</div>'
                f'<div style="margin-top:8px">{btn(TEMAS["preto"], "Entrar no close", "cta", 24, 9)}</div></div></div>')
    if kind == "rosa":
        return (f'<div style="width:{w}px;height:{h}px;border-radius:10px;background:{PINK};display:flex;align-items:center;gap:14px;padding:14px">'
                f'{sym("rosa", h * .62, None)}<div><div class="d" style="font-size:{h * .2}px;color:#fff">Pago no Pix.<br>Liberado na hora.</div>'
                f'<div style="margin-top:8px">{btn(TEMAS["rosa"], "Baixar o app", "botao", 22, 9)}</div></div></div>')
    return (f'<div style="width:{w}px;height:{h}px;border-radius:10px;background:{PURPLE};padding:14px;position:relative">{lock("roxo", 12, None)}'
            f'<div class="d" style="position:absolute;left:14px;bottom:46px;font-size:{w * .1}px;color:#fff">Seu conteúdo.<br>Seu preço.</div>'
            f'<div style="position:absolute;left:14px;bottom:14px">{btn(TEMAS["roxo"], "Abrir meu close", "botao", 22, 9)}</div></div>')


def p_anuncios():
    page("Anúncios", f'<div class="row" style="margin-top:14px;gap:14px;align-items:flex-end">'
         f'<div>{ad("foto", 196, 348)}<div class="cap">Story / Reels 9:16 · fã</div></div>'
         f'<div>{ad("foto", 214, 268)}<div class="cap">Feed 4:5 · fã</div></div>'
         f'<div>{ad("roxo", 214, 214)}<div class="cap">Feed 1:1 · criador</div></div>'
         f'<div style="display:flex;flex-direction:column;gap:10px"><div>{ad("rosa", 300, 100)}<div class="cap">Banner 3:1</div></div>'
         f'<div>{ad("rosa", 300, 76)}<div class="cap">Banner 4:1 · display</div></div></div></div>', "branco",
         "Fã: foto + preto + botão Pink Deep. Criador: roxo + botão branco. Remarketing: rosa com o ícone. A marca sempre no canto de cima ou ao lado do título.")


def p_email():
    W = TEMAS["branco"]
    mail = (f'<div style="width:330px;border-radius:12px;overflow:hidden;border:1px solid #E6E6E6;background:#fff">'
            f'<div style="background:{BLACK};padding:14px 18px">{lock("preto", 14, None)}</div>'
            f'<div style="padding:18px"><div class="d" style="font-size:24px;color:{BLACK}">Você está<br>no <span style="color:{DEEP}">close.</span></div>'
            f'<div style="font:500 10.5px/1.55 Figtree;color:{L3};margin-top:8px">Seu pagamento de <b style="color:{BLACK}">R$ 19,90</b> foi confirmado. O close da Lara já está na sua biblioteca até 11 dez 2026.</div>'
            f'<div style="margin-top:14px">{btn(W, "Ver o conteúdo", "cta", 32, 11)}</div>'
            f'<div style="margin-top:16px;padding:10px;border-radius:10px;background:{L1};display:flex;justify-content:space-between;font:600 9.5px Figtree"><span>Close da Lara · 1 mês</span><b class="num">R$ 19,90</b></div></div>'
            f'<div style="padding:12px 18px;border-top:1px solid #E6E6E6;font:500 8.5px Figtree;color:{L3}">Clozzy · Termos · Privacidade · Ajuda · 18+</div></div>')
    sms = (f'<div style="width:300px;padding:12px;border-radius:14px;background:{L1};font:500 10.5px/1.5 Figtree;color:{BLACK}">'
           f'<b>Clozzy:</b> você está no close da Lara. Pago no Pix, liberado na hora. clozzy.com.br/b/x7k2</div>')
    assin = (f'<div style="display:flex;gap:12px;align-items:center;padding:12px;border:1px solid #E6E6E6;border-radius:12px;width:330px">{sym("branco", 46)}'
             f'<div style="font:500 9.5px/1.45 Figtree;color:{L3}"><b style="color:{BLACK};font:800 11px Gabarito">Ana Souza</b><br>Parcerias · Clozzy<br>ana@clozzy.com.br</div></div>')
    page("E-mail", f'<div class="row" style="margin-top:14px;gap:28px">{mail}<div><div class="lbl">SMS e WhatsApp</div>{sms}'
         f'<div class="lbl" style="margin-top:20px">Assinatura de e-mail</div>{assin}'
         f'<p class="lead" style="color:{L3};margin-top:20px;max-width:330px">E-mail no branco com a faixa preta da marca no topo. Assunto curto, com a frase da ação: “Você está no close da Lara”.</p></div></div>',
         "branco", "Transacional no branco, botão Pink Deep, um assunto por e-mail.")


def p_impressos():
    card_f = (f'<div style="width:240px;height:140px;border-radius:10px;background:{BLACK};display:flex;align-items:center;justify-content:center">{lock("preto", 34)}</div>')
    card_v = (f'<div style="width:240px;height:140px;border-radius:10px;background:#fff;border:1px solid #E6E6E6;padding:16px;position:relative">'
              f'<div style="font:800 13px Gabarito">Ana Souza</div><div style="font:500 9px Figtree;color:{L3}">Parcerias</div>'
              f'<div style="position:absolute;left:16px;bottom:14px;font:500 8.5px/1.5 Figtree;color:{BLACK}">ana@clozzy.com.br<br>clozzy.com.br</div>'
              f'<div style="position:absolute;right:14px;bottom:14px">{sym("branco", 34, None)}</div></div>')
    bag = (f'<div style="width:190px;height:230px;position:relative"><div style="position:absolute;left:55px;top:0;width:80px;height:60px;border:6px solid {BLACK};border-bottom:0;border-radius:40px 40px 0 0"></div>'
           f'<div style="position:absolute;left:0;right:0;top:46px;bottom:0;background:{BLACK};border-radius:8px;display:flex;align-items:center;justify-content:center">{sym("preto", 110)}</div></div>')
    tee = (f'<svg viewBox="0 0 200 220" width="200" height="220"><path d="M62 14 L30 24 L4 62 L30 80 L42 70 L42 214 L158 214 L158 70 L170 80 L196 62 L170 24 L138 14 Q100 40 62 14Z" fill="{PINK}"/>'
           f'<g transform="translate(70 70) scale(.6)">{M.mark(V["rosa"], None)}</g></svg>')
    stick = (f'<div style="display:flex;gap:10px;flex-wrap:wrap;width:200px">'
             + "".join(f'<div style="width:62px;height:62px;border-radius:50%;background:{bg};display:flex;align-items:center;justify-content:center;{"border:1px solid #E6E6E6;" if bg == WHITE else ""}">{sym(s, 44, r)}</div>'
                       for bg, s, r in ((PINK, "rosa", None), (BLACK, "preto", M.MAIN_RING), (PURPLE, "roxo", None), (WHITE, "branco", M.MAIN_RING), (DEEP, "deep", None), (BLACK, "preto", None))) + '</div>')
    page("Impressos e brindes", f'<div class="row" style="margin-top:14px;gap:22px"><div style="display:flex;flex-direction:column;gap:10px">{card_f}{card_v}<div class="cap">Cartão de visita 90×50</div></div>'
         f'<div>{bag}<div class="cap">Ecobag preta</div></div><div>{tee}<div class="cap">Camiseta rosa, estrela branca</div></div>'
         f'<div>{stick}<div class="cap">Adesivos redondos</div></div></div>', "branco",
         "No impresso, Pink Deep rende melhor que o rosa. Tecido escuro: estrela branca ou rosa. Tecido rosa: tudo branco.")


def p_erros():
    bad = [
        (IB.box({"bg": PINK}, svg(M.mark(dict(V["rosa"], dash=BLACK, line=BLACK, star=BLACK)), "5 5 90 90", 76), 104, 104), "Preto sobre o rosa"),
        (IB.box({"bg": PURPLE}, svg(M.mark(dict(V["rosa"], icon=PINK), None), "5 5 90 90", 76), 104, 104), "Rosa sobre o roxo"),
        (IB.box({"bg": "#FFF6F0"}, svg(M.mark(V["branco"], None), "5 5 90 90", 76), 104, 104), "Fundo creme"),
        (IB.box({"bg": "#14090F"}, svg(M.mark(V["preto"]), "5 5 90 90", 76), 104, 104), "Quase-preto"),
        (IB.box({"bg": WHITE}, svg(f'<defs><linearGradient id="gq" x1="0" x2="1"><stop offset="0" stop-color="{PURPLE}"/><stop offset="1" stop-color="{PINK}"/></linearGradient></defs>'
                                   + M.macia("url(#gq)", 40), "5 5 90 90", 76), 104, 104), "Degradê"),
        (IB.box({"bg": WHITE}, svg(f'<g transform="rotate(30 50 50)">{M.macia(DEEP, 40)}</g>', "5 5 90 90", 76), 104, 104), "Girar a estrela"),
        (IB.box({"bg": WHITE}, svg(M.macia(DEEP, 40, dot=False), "5 5 90 90", 76), 104, 104), "Tirar o ponto"),
        (IB.box({"bg": WHITE}, svg(f'<g transform="translate(50 50) scale(1.3 .8) translate(-50 -50)">{M.mark(V["branco"])}</g>', "5 5 90 90", 76), 104, 104), "Distorcer"),
        (IB.box({"bg": WHITE}, lock("branco", 30, None), 104, 104, "overflow:hidden"), "Palavra apertada"),
        (IB.box({"bg": BLACK}, svg(M.mark(V["preto"]) + f'<circle cx="50" cy="50" r="48" fill="none" stroke="{WHITE}" stroke-width="2"/>', "0 0 100 100", 76), 104, 104), "Moldura extra"),
        (IB.box({"bg": WHITE}, f'<span style="display:flex;align-items:center;gap:2px">{svg(M.macia(DEEP, 40), "5 5 90 90", 26)}<b style="font:800 22px Gabarito;margin-left:-6px">lozzy</b></span>', 104, 104), "Estrela no lugar do c"),
        (IB.box({"bg": WHITE}, f'<span style="display:flex;gap:4px">{sym("branco", 40, None)}{sym("branco", 40)}</span>', 104, 104), "Ícone e símbolo juntos"),
    ]
    cells = "".join(f'<div><div class="bad">{b}</div><div class="cap">{t}</div></div>' for b, t in bad)
    page("Não fazer", f'<div class="grid" style="grid-template-columns:repeat(6,104px);gap:14px 22px;margin-top:16px">{cells}</div>', "branco",
         "Os erros mais comuns. Se a peça precisa de um deles para funcionar, a peça está errada, não a marca.")


def p_checklist():
    chk = ["Fundo preto #000 ou branco #fff de verdade (nunca creme, nunca quase-preto)", "Só rosa, Pink Deep, roxo, preto, branco e cinzas neutros",
           "Nada preto sobre rosa; rosa e roxo nunca um sobre o outro", "Ícone OU símbolo, nunca os dois", "Respiro de ¼ do símbolo e tamanho mínimo",
           "Palavra separada do símbolo, nunca no lugar do c", "Botão de compra Pink Deep (ou branco no rosa e no roxo)", "Gabarito nos títulos, Figtree no texto",
           "Frase curta, voz de quem está perto", "Conteúdo pago desfocado com a estrela, nunca tarja"]
    li = "".join(f'<div style="display:flex;gap:10px;padding:7px 0;border-bottom:1px solid #2A2A2A;font-size:11px"><span class="ok" style="background:{PINK};color:#fff">✓</span>{t}</div>' for t in chk)
    files = [("tokens.css", "Variáveis por superfície: data-tema=\"preto|branco|rosa|roxo\""), ("tokens.json", "Os mesmos papéis em JSON"),
             ("../identidade-estrela-macia/svg/", "Ícones, símbolos, lockups, app icons e loaders"), ("../../docs/prototipo-mobile/", "Protótipo com os seis temas"),
             ("_build.py", "Gerador deste manual")]
    fl = "".join(f'<div style="display:flex;gap:12px;font-size:10.5px;padding:6px 0;border-bottom:1px solid #2A2A2A"><code style="width:230px;color:{PINK}">{a}</code><span style="color:#E6E6E6">{b}</span></div>' for a, b in files)
    page("Checklist e arquivos", f'<div class="row" style="margin-top:14px;gap:34px"><div style="flex:1">{li}</div><div style="flex:1">{fl}'
         f'<div style="margin-top:30px">{lock("preto", 48)}</div></div></div>', "preto", "Antes de publicar qualquer peça.")


# ------------------------------------------------------------------------------------------------ tokens
def tokens():
    keys = ["sup", "sup2", "linha", "titulo", "texto", "apoio", "destaque", "botao", "botao_txt", "cta", "cta_txt", "chip"]
    names = {"sup": "superficie", "sup2": "superficie-2", "linha": "linha", "titulo": "titulo", "texto": "texto", "apoio": "apoio",
             "destaque": "destaque", "botao": "botao", "botao_txt": "botao-texto", "cta": "compra", "cta_txt": "compra-texto", "chip": "chip"}
    css = (":root{--cz-rosa:#FF0065;--cz-pink-deep:#E0005A;--cz-roxo:#7C48C4;--cz-preto:#000000;--cz-branco:#FFFFFF;\n"
           f"  --cz-cinza-1:{G1};--cz-cinza-2:{G2};--cz-cinza-3:{G3};--cz-cinza-4:{G4};--cz-claro-1:{L1};--cz-claro-2:{L2};--cz-claro-3:{L3};\n"
           "  --t-display:Gabarito,system-ui,sans-serif;--t-body:Figtree,system-ui,sans-serif}\n")
    for t in ORDER:
        css += f'[data-tema="{t}"]{{' + ";".join(f"--{names[k]}:{TEMAS[t][k]}" for k in keys) + "}\n"
    (HERE / "tokens.css").write_text("/* Clozzy · Estrela macia · tokens por superfície (gerado por _build.py) */\n" + css)
    (HERE / "tokens.json").write_text(json.dumps({"cores": {"rosa": PINK, "pink-deep": DEEP, "roxo": PURPLE, "preto": BLACK, "branco": WHITE},
                                                  "superficies": {t: {names[k]: TEMAS[t][k] for k in keys} for t in ORDER}}, ensure_ascii=False, indent=2))


def build():
    for fn in (p_capa, p_sumario, p_marca, p_protecao, p_cores, p_superficies, p_combinacoes, p_tipo, p_elementos, p_foto, p_voz,
               p_app, p_app_temas, p_homescreen, p_landing, p_landing_mobile, p_posts, p_carrossel, p_stories, p_perfil, p_anuncios,
               p_email, p_impressos, p_erros, p_checklist):
        fn()
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy · manual de uso da marca · Estrela macia</title>'
            f'<style>{CSS}</style></head><body>{"".join(PAGES)}</body></html>')
    OUT_HTML.write_text(html)
    tokens()
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer", "--virtual-time-budget=5000",
                    f"--print-to-pdf={OUT_PDF}", OUT_HTML.as_uri()], check=True, capture_output=True)
    print("pages", len(PAGES))


if __name__ == "__main__":
    build()

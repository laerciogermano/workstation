#!/usr/bin/env python3
"""Clozzy — alternativas de capa da apresentação “O Clozzy chega em breve”, para escolher as melhores cores.
Usa o mesmo gerador da apresentação (_build.py). Página 1 = todas as opções em miniatura; depois, uma por página.
Rodar: python3 _capas.py → capas-alternativas.html + .pdf"""
import importlib.util, subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
_spec = importlib.util.spec_from_file_location("apres", HERE / "_build.py")
A = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(A)

B, M, V1, V2 = A.B, A.M, A.V1, A.V2
PINK, PURPLE, BLACK, WHITE, VERDE = A.PINK, A.PURPLE, A.BLACK, A.WHITE, A.VERDE
G4, L2, L3 = A.G4, A.L2, A.L3
sym, lock, big = A.sym, A.lock, A.big
OUT_HTML = HERE / "capas-alternativas.html"
OUT_PDF = HERE / "capas-alternativas.pdf"


def mk(slug, bg, ring, star, word):
    m = B.mk(bg, ring, star, word, star)
    m["slug"] = slug
    M.V[slug] = m
    return m


# marcas do painel (símbolo grande + nome)
RR = A.BRANCO                                          # branco: arco rosa, estrela rosa, nome preto
RP_ = mk("cap-arco-preto", WHITE, BLACK, PINK, BLACK)  # branco: arco preto, estrela rosa
PP = mk("cap-mono-preto", WHITE, BLACK, BLACK, BLACK)  # branco: tudo preto
RPe = mk("cap-estrela-preta", WHITE, PINK, BLACK, BLACK)  # branco: arco rosa, estrela preta
XX = mk("cap-roxo", WHITE, PURPLE, PURPLE, BLACK)      # branco: arco roxo, estrela roxa
XP = mk("cap-arco-roxo", WHITE, PURPLE, BLACK, BLACK)  # branco: arco roxo, estrela preta
NO_PRETO, NO_ROSA, NO_ROXO = A.PRETO, A.ROSA, A.NO_ROXO
# --- novas: arco e estrela em cores diferentes (o arco continua sempre de uma cor só)
B_RX = mk("cap-b-rosa-roxa", WHITE, PINK, PURPLE, BLACK)
B_XR = mk("cap-b-roxo-rosa", WHITE, PURPLE, PINK, BLACK)
B_PX = mk("cap-b-preto-roxa", WHITE, BLACK, PURPLE, BLACK)
B_RV = mk("cap-b-rosa-verde", WHITE, PINK, VERDE, BLACK)
B_VR = mk("cap-b-verde-rosa", WHITE, VERDE, PINK, BLACK)
B_PV = mk("cap-b-preto-verde", WHITE, BLACK, VERDE, BLACK)
B_VP = mk("cap-b-verde-preta", WHITE, VERDE, BLACK, BLACK)
P_XB = mk("cap-p-roxo-branca", BLACK, PURPLE, WHITE, WHITE)
P_VB = mk("cap-p-verde-branca", BLACK, VERDE, WHITE, WHITE)
P_BV = mk("cap-p-branco-verde", BLACK, WHITE, VERDE, WHITE)

# lado do texto: (tema da página, cor do título, cor do texto, marca pequena, mostra detalhes verdes do close)
LADO = {
    "preto": ("preto", WHITE, G4, NO_PRETO, True),
    "branco": ("branco", BLACK, L3, A.BRANCO, True),
    "rosa": ("rosa", WHITE, "rgba(255,255,255,.88)", NO_ROSA, False),
    "roxo": ("roxo", WHITE, "#EBE3FA", NO_ROXO, False),
}

# (letra, nome, fundo da página, fundo do painel, marca do painel)
OPCOES = [
    ("A", "preto + painel branco · arco e estrela rosa (atual)", "preto", WHITE, RR),
    ("B", "preto + painel branco · arco preto, estrela rosa", "preto", WHITE, RP_),
    ("C", "preto + painel branco · arco rosa, estrela preta", "preto", WHITE, RPe),
    ("D", "preto + painel branco · tudo preto", "preto", WHITE, PP),
    ("E", "preto + painel branco · arco e estrela roxos", "preto", WHITE, XX),
    ("F", "preto + painel branco · arco roxo, estrela preta", "preto", WHITE, XP),
    ("G", "preto + painel rosa · tudo branco", "preto", PINK, NO_ROSA),
    ("H", "preto + painel roxo · tudo branco", "preto", PURPLE, NO_ROXO),
    ("I", "branco + painel preto · arco rosa, estrela branca", "branco", BLACK, NO_PRETO),
    ("J", "branco + painel rosa · tudo branco", "branco", PINK, NO_ROSA),
    ("K", "rosa + painel branco · arco e estrela rosa", "rosa", WHITE, RR),
    ("L", "roxo + painel branco · arco e estrela roxos", "roxo", WHITE, XX),
    # novas: arco e estrela de cores diferentes
    ("M", "preto + painel branco · arco rosa, estrela roxa", "preto", WHITE, B_RX),
    ("N", "preto + painel branco · arco roxo, estrela rosa", "preto", WHITE, B_XR),
    ("O", "preto + painel branco · arco preto, estrela roxa", "preto", WHITE, B_PX),
    ("P", "preto + painel branco · arco rosa, estrela verde", "preto", WHITE, B_RV),
    ("Q", "preto + painel branco · arco verde, estrela rosa", "preto", WHITE, B_VR),
    ("R", "preto + painel branco · arco preto, estrela verde", "preto", WHITE, B_PV),
    ("S", "preto + painel branco · arco verde, estrela preta", "preto", WHITE, B_VP),
    ("T", "branco + painel preto · arco roxo, estrela branca", "branco", BLACK, P_XB),
    ("U", "branco + painel preto · arco verde, estrela branca", "branco", BLACK, P_VB),
    ("V", "branco + painel preto · arco branco, estrela verde", "branco", BLACK, P_BV),
    ("W", "rosa + painel branco · arco preto, estrela rosa", "rosa", WHITE, RP_),
    ("X", "roxo + painel branco · arco preto, estrela roxa", "roxo", WHITE, B_PX),
]


def icones_lado(fundo):
    """no preto, os 4 ícones; no branco, o ícone branco ganha contorno; no rosa e no roxo nenhum ícone de cor
    (rosa e roxo nunca um sobre o outro, e o ícone da mesma cor some), então só o ícone branco"""
    if fundo == "preto":
        return A.icones(lab=False)
    if fundo == "branco":
        temas = [A.BRANCO, A.ROSA, A.NO_ROXO, A.NO_VERDE]
        return '<div style="display:flex;gap:10px">' + "".join(
            f'<span style="display:inline-block;border-radius:{54 * .2237:.1f}px;{"box-shadow:0 0 0 1px " + L2 if m is A.BRANCO else ""}">{A.tile(m, 54, None)}</span>'
            for m in temas) + '</div>'
    return A.tile(A.BRANCO, 54, None)


def capa(letra, nome, fundo, painel, marca):
    tema, ti, tx, mini, dets = LADO[fundo]
    A.SEC[0] = f"opção {letra} · {nome}"
    sep = f"box-shadow:inset 1px 0 0 {L2};" if painel == WHITE and fundo == "branco" else ""
    lado = (f'<div style="position:absolute;top:0;right:0;bottom:0;width:41%;background:{painel};{sep}display:flex;flex-direction:column;'
            f'align-items:center;justify-content:center;gap:28px">{sym(marca, 230)}{lock(marca, 46, None)}</div>')
    body = (f'{lado}<div style="position:relative;display:flex;flex-direction:column;justify-content:space-between;height:100%;width:54%">'
            f'<div><div class="lbl" style="color:{ti};opacity:.7">apresentação · nov 2026</div>'
            f'{big("O Clozzy<br>chega em<br>breve.", ti, 96)}'
            f'<p class="lead" style="color:{tx};max-width:440px;margin-top:20px">A primeira plataforma de close friends pago chega em breve com marca nova, '
            f'app novo e uma certeza: quem cria decide o preço do próprio close.</p>'
            + (f'<div style="margin-top:24px">{A.dets_close()}</div>' if dets else "") + '</div>'
            f'<div style="display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:12mm">{lock(mini, 40)}{icones_lado(fundo)}</div></div>'
            f'<div style="position:absolute;top:12mm;right:12mm;width:34px;height:34px;border-radius:50%;background:{BLACK if painel == WHITE else WHITE};'
            f'color:{WHITE if painel == WHITE else BLACK};display:flex;align-items:center;justify-content:center;font:900 16px Gabarito">{letra}</div>')
    A.page(None, body, tema)


def build():
    V1.PAGES.clear()
    for o in OPCOES:
        capa(*o)
    S = 0.205
    W, H = 1122.5 * S, 793.7 * S
    minis = [
        f'<div><div style="width:{W:.1f}px;height:{H:.1f}px;overflow:hidden;border-radius:6px;box-shadow:0 0 0 1px {L2}">'
        f'<div class="mini" style="transform:scale({S});transform-origin:0 0;width:297mm">{pg}</div></div>'
        f'<div style="font:800 10px Gabarito;margin-top:6px">{l}<span style="font:600 8.5px Figtree;color:{L3};margin-left:6px">{n}</span></div></div>'
        for pg, (l, n, *_) in zip(V1.PAGES, OPCOES)]
    V1.PAGES.clear()
    A.SEC[0] = "alternativas de capa"
    titulos = [("Alternativas de capa", "Mesma capa, combinações de cores diferentes. Escolha as letras das que você mais gosta."),
               ("Arco e estrela em cores diferentes", "Novas opções: o arco continua de uma cor só, a estrela muda de cor.")]
    for k in range(0, len(minis), 12):
        t, ld = titulos[min(k // 12, len(titulos) - 1)]
        A.page(t, f'<div style="display:grid;grid-template-columns:repeat(4,{W:.1f}px);gap:16px 14px;margin-top:14px">{"".join(minis[k:k + 12])}</div>', "branco", ld)
    for o in OPCOES:
        capa(*o)
    css = ".mini .pg{page-break-after:auto;break-after:auto}"
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Clozzy · alternativas de capa</title>'
            f'<style>{V1.CSS}{V2.PHOTO_CSS}{css}</style></head><body>{"".join(V1.PAGES)}</body></html>')
    OUT_HTML.write_text(html)
    subprocess.run([V1.CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer", "--virtual-time-budget=6000",
                    f"--print-to-pdf={OUT_PDF}", OUT_HTML.as_uri()], check=True, capture_output=True)
    print("pages", len(V1.PAGES))


if __name__ == "__main__":
    build()

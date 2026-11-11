#!/usr/bin/env python3
"""Clozzy — logos para comparação: v1 atual (hml) × conceito “Story” (anel fino + estrela menor).
Só rosa #FF0065 · roxo #7C48C4 · preto · branco. Rodar: python3 _logos_story.py → logos/*.svg"""
import re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "identidade-nova"))
sys.path.insert(0, str(HERE.parent / "logo-2028"))
import _logos  # noqa: E402
import _conceitos as R2  # noqa: E402

PINK, PURPLE, INK, WHITE = "#FF0065", "#7C48C4", "#14090F", "#FFFFFF"
OUT = HERE / "logos"
OUT.mkdir(exist_ok=True)

# ---------------------------------------------------------------- v1 atual
V1 = (HERE / "logo-atual" / "logo-v1.svg").read_text()


def v1_lockup(word=INK):
    s = V1.replace('fill="black"', f'fill="{word}"')
    return re.sub(r'width="863" height="222"', '', s, count=1)


def v1_mark():
    s = re.sub(r'width="863" height="222" viewBox="0 0 863 222"', 'viewBox="0 0 222 222"', V1, count=1)
    return s.replace('fill="black"', 'fill="none"')


# ---------------------------------------------------------------- Story (grid 256)
RING_R, RING_W, STAR_R = 116, 14, 60          # anel fino; estrela ~45% do raio externo (v1 ≈ 53%)
RING_W_SMALL, STAR_R_SMALL = 24, 62           # corte ≤ 24px (favicon/tab)


def ring(c, w=RING_W, r=RING_R):
    return f'<circle cx="128" cy="128" r="{r}" fill="none" stroke="{c}" stroke-width="{w}"/>'


def star(c, R=STAR_R):
    return f'<path d="{R2.star(128, 131, R, ratio=0.48, r=R * 0.14)}" fill="{c}"/>'


def story_a(ring_c=PINK, star_c=PURPLE, small=False):
    """Story A: anel fino + estrela menor solta (pedido do usuário)."""
    if small:
        return ring(ring_c, RING_W_SMALL, 128 - RING_W_SMALL / 2) + star(star_c, STAR_R_SMALL)
    return ring(ring_c) + star(star_c)


def story_b(ring_c=PINK, disc_c=PURPLE, star_c=WHITE, small=False):
    """Story B: o disco da v1 (roxo + estrela branca) dentro do anel de story."""
    w = RING_W_SMALL if small else RING_W
    rr = 128 - w / 2
    return (ring(ring_c, w, rr) + f'<circle cx="128" cy="128" r="{rr - w / 2 - (14 if small else 12)}" fill="{disc_c}"/>'
            + star(star_c, 56 if small else 54))


def nova_b(c=PURPLE, star_c=PINK):
    """Rodada 1 (identidade-nova): C aberto + estrela."""
    return f'<g transform="scale(2.56)">{_logos.mark_inner(c, star_c)}</g>'


def v1_word_lockup(mark_body, word=INK):
    """Mesmo wordmark da v1 (hml), trocando só o símbolo."""
    paths = re.findall(r'<path d="[^"]+" fill="black"/>', V1)
    letters = "".join(paths).replace('fill="black"', f'fill="{word}"')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 863 222">'
            f'<g transform="scale({222/256})">{mark_body}</g>{letters}</svg>\n')


def svg(body, w=256, h=256, title="Clozzy"):
    return R2.svg(body, w, h, title)


def lockup(mark_body, word=INK):
    return R2.lockup(lambda _c: mark_body, None, word)


FAMILY = {
    # slug: (nome, fn(dark: bool, small: bool) -> body)
    "story-a": ("Story", lambda dark=False, small=False: story_a(PINK, WHITE if dark else PURPLE, small)),
    "story-b": ("Story + disco v1", lambda dark=False, small=False: story_b(PINK, PURPLE, WHITE, small)),
    "circulo-b": ("Círculo próximo (r1)", lambda dark=False, small=False: nova_b(WHITE if dark else PURPLE, PINK)),
}


def build():
    for slug, (name, fn) in FAMILY.items():
        (OUT / f"{slug}.svg").write_text(svg(fn(), title=f"Clozzy — {name}"))
        (OUT / f"{slug}-dark.svg").write_text(svg(fn(True), title=f"Clozzy — {name}"))
        (OUT / f"{slug}-16.svg").write_text(svg(fn(False, True), title=f"Clozzy — {name} 16px"))
        (OUT / f"{slug}-mono.svg").write_text(svg(
            fn(False).replace(PINK, INK).replace(PURPLE, INK).replace(f'fill="{WHITE}"', 'fill="#FFFFFF"'),
            title=f"Clozzy — {name} mono"))
        (OUT / f"{slug}-lockup.svg").write_text(lockup(fn(), INK))
        (OUT / f"{slug}-lockup-v1word.svg").write_text(v1_word_lockup(fn(), INK))
        (OUT / f"{slug}-lockup-dark.svg").write_text(lockup(fn(True), WHITE))
    (OUT / "v1-atual-lockup.svg").write_text(v1_lockup())
    (OUT / "v1-atual-mark.svg").write_text(v1_mark())


if __name__ == "__main__":
    build()
    print("ok")

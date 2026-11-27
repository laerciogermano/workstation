#!/usr/bin/env python3
"""Gera as capas E12–E17 e o epics.pdf a partir de epics.md.

Uso (em role-go/):  python3 docs/_build_epics.py [--sem-capas]
Requer PyMuPDF, Pillow e o Google Chrome (só para as capas).
"""
import base64, io, re, subprocess, sys, tempfile
from pathlib import Path

import fitz
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'assets'
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

# ---------------------------------------------------------------- capas

DECK = ROOT / 'RoleGo apresentação técnica.pdf'
EXPLORAR = ROOT / 'WhatsApp Image 2026-11-20 at 17.12.41(2).jpeg'
PERFIL = ROOT / 'WhatsApp Image 2026-11-20 at 17.12.41(3).jpeg'
# recortes dos dois celulares de cada slide (imagem de 3840x2160)
BOXES = {'a': (1764, 270, 2628, 1830), 'b': (2710, 270, 3574, 1830)}

# slug: (id, título em linhas, telas, ícones)
COVERS = {
    'perfil-social': ('E12', ['PERFIL SOCIAL', 'E MOMENTOS'], ['s3a', PERFIL, 's3b'], '♡✦☺＋'),
    'verificacao': ('E13', ['VERIFICAÇÃO', 'DE IDENTIDADE'], ['s4a', 's4b', 's5b'], '✓◈★＋'),
    'eventos-privados': ('E14', ['EVENTOS', 'PRIVADOS'], ['s5a', 's5b'], '⌂✦✓＋'),
    'chat': ('E15', ['CHAT EM GRUPO', 'DO EVENTO'], ['s6a', 's6b'], '✉✦♡＋'),
    'seguranca': ('E16', ['SEGURANÇA', 'E MODERAÇÃO'], ['s7a', 's7b', 's3b'], '◉✓⚑＋'),
    'role-junto': ('E17', ['ROLÊ JUNTO'], [EXPLORAR], '♡✦☺＋'),
}


def data_uri(img):
    buf = io.BytesIO()
    img.save(buf, 'PNG')
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()


def screen(ref, deck):
    if isinstance(ref, Path):
        return data_uri(Image.open(ref).convert('RGB'))
    page = int(ref[1:-1]) - 1
    xref = deck[page].get_images()[0][0]
    img = Image.open(io.BytesIO(deck.extract_image(xref)['image'])).convert('RGB')
    return data_uri(img.crop(BOXES[ref[-1]]))


def font_css():
    base = ROOT / 'beta/node_modules/.pnpm'
    css = ''
    for weight, style in ((800, 'italic'), (700, 'normal'), (600, 'normal')):
        hit = next(base.glob(f'@fontsource+poppins@*/node_modules/@fontsource/poppins/files/poppins-latin-{weight}-{style}.woff2'), None)
        if hit is None:
            sys.exit('Poppins não encontrada: rode `pnpm install` em beta/')
        b64 = base64.b64encode(hit.read_bytes()).decode()
        css += f"@font-face{{font-family:P;font-weight:{weight};font-style:{style};src:url(data:font/woff2;base64,{b64})}}"
    return css


def cover_html(code, title, screens, icons, deck, fonts):
    neon = ['#ffcc00', '#2fb8ff', '#b04bff']
    solo = len(screens) == 1
    height = 500 if len(title) > 1 else 566
    if len(screens) == 3:
        pos = [(290, -4, neon[0]), (640, 0, neon[1]), (990, 4, neon[2])]
    elif len(screens) == 2:
        pos = [(475, -3, neon[2]), (805, 3, neon[1])]
    else:
        pos = [(640, 0, neon[1])]
    phones = ''
    for src, (x, rot, color) in zip(screens, pos):
        radius = 34 if isinstance(src, Path) else 38
        phones += (f'<img class="ph" src="{screen(src, deck)}" style="left:{x}px;height:{height}px;'
                   f'transform:translateX(-50%) rotate({rot}deg);border-color:{color};border-radius:{radius}px;'
                   f'box-shadow:0 0 14px {color},0 0 42px {color}66">')
    if solo:
        for text, x, y, color in (('Bora junto', 235, 330, '#b04bff'), ('Vou sozinho(a)', 245, 470, '#00e5e5'),
                                  ('3 amigos vão', 1045, 330, '#ffcc00'), ('Amigos · Perto', 1035, 470, '#ff2fb0')):
            phones += (f'<div class="tag" style="left:{x}px;top:{y}px;border-color:{color};'
                       f'box-shadow:0 0 18px {color},inset 0 0 14px {color}55">{text}</div>')
    marks = ''
    for char, x, y, color, size in zip(icons, (62, 1188, 76, 1176), (260, 250, 520, 540),
                                       ('#ff2fb0', '#2fb8ff', '#ffcc00', '#00e5a0'), (86, 80, 74, 58)):
        marks += f'<span class="ic" style="left:{x}px;top:{y}px;font-size:{size}px;color:{color}">{char}</span>'
    return f'''<!doctype html><meta charset="utf-8"><style>{fonts}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1280px;height:720px;overflow:hidden;font-family:P;position:relative;
 background:radial-gradient(ellipse at 50% 72%,#171a52 0,#0a0c2a 38%,#04050f 75%)}}
.chip{{position:absolute;left:28px;top:26px;width:112px;height:54px;border:2px solid #b04bff;border-radius:16px;
 color:#fff;font:700 30px/50px P;text-align:center;box-shadow:0 0 14px #b04bff88}}
.logo{{position:absolute;right:30px;top:22px;font:700 44px/60px P;
 background:linear-gradient(90deg,#9e19e9,#2f7bff);-webkit-background-clip:text;color:transparent}}
.title{{position:absolute;left:0;right:0;top:34px;display:flex;justify-content:center;align-items:stretch;gap:28px}}
.bar{{width:16px;border-radius:8px;background:linear-gradient(#00e5e5,#8749ff,#ff2fb0)}}
h1{{color:#fff;font:italic 800 {62 if len(title) > 1 else 66}px/1.12 P;text-align:center;white-space:nowrap}}
.ph{{position:absolute;bottom:20px;border:3px solid;background:#000;padding:4px}}
.ic{{position:absolute;transform:translate(-50%,-50%);line-height:1;text-shadow:0 0 16px currentColor,0 0 34px currentColor}}
.tag{{position:absolute;transform:translate(-50%,-50%);border:2px solid;border-radius:40px;padding:14px 30px;
 color:#fff;font:600 28px P;white-space:nowrap}}
</style><div class="chip">{code}</div><div class="logo">RoleGo</div>
<div class="title"><div class="bar"></div><h1>{'<br>'.join(title)}</h1></div>{marks}{phones}'''


def build_covers():
    deck = fitz.open(DECK)
    fonts = font_css()
    with tempfile.TemporaryDirectory() as tmp:
        for slug, (code, title, screens, icons) in COVERS.items():
            page = Path(tmp) / f'{slug}.html'
            page.write_text(cover_html(code, title, screens, icons, deck, fonts), encoding='utf-8')
            out = ASSETS / f'epic-{code.lower()}-{slug}-cover.png'
            subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars',
                            '--force-device-scale-factor=1', '--window-size=1280,720',
                            '--virtual-time-budget=5000', f'--screenshot={out}', page.as_uri()],
                           check=True, capture_output=True, timeout=60)
            print('capa', out.name)


# ---------------------------------------------------------------- PDF

W, H = 842, 595
BG = (5 / 255, 7 / 255, 22 / 255)
PURPLE, CYAN = (0.53, 0.29, 1.0), (0, 0.9, 0.9)
WHITE, GRAY = (1, 1, 1), (0x9c / 255, 0xa3 / 255, 0xb0 / 255)
REG, BOLD = fitz.Font('helv'), fitz.Font('hebo')


def plain(text):
    """Remove marcação markdown e troca o que a Helvetica base não desenha."""
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    text = text.replace('**', '').replace('`', '')
    for old, new in (('→', '->'), ('—', '-'), ('–', '-'), ('“', '"'), ('”', '"')):
        text = text.replace(old, new)
    return text


def wrap(text, size, width, font=REG):
    lines, line = [], ''
    for word in text.split():
        trial = f'{line} {word}'.strip()
        if line and font.text_length(trial, size) > width:
            lines.append(line)
            line = word
        else:
            line = trial
    return lines + [line]


def new_page(doc):
    page = doc.new_page(width=W, height=H)
    page.draw_rect(page.rect, color=None, fill=BG)
    return page


def put(page, x, y, text, size=12, color=GRAY, bold=False):
    page.insert_text((x, y), text, fontsize=size, color=color, fontname='hebo' if bold else 'helv')


def block(page, x, y, text, size, width, color=GRAY, leading=1.45, bold=False):
    for line in wrap(text, size, width, BOLD if bold else REG):
        put(page, x, y, line, size, color, bold)
        y += size * leading
    return y


def heading(page, title):
    page.draw_rect(fitz.Rect(40, 28, 46, 56), color=None, fill=PURPLE)
    put(page, 56, 49, title, 18, WHITE)


def bullets(page, x, y, items, size, width, mark='·'):
    for n, item in enumerate(items, 1):
        label = f'{n}.' if mark == 'num' else mark
        put(page, x, y, label, size, CYAN, True)
        y = block(page, x + 16, y, plain(item), size, width - 16) + size * 0.35
    return y


def parse():
    md = (ROOT / 'epics.md').read_text(encoding='utf-8')
    epics, extra = [], []
    for chunk in re.split(r'^## ', md, flags=re.M)[1:]:
        title, _, body = chunk.partition('\n')
        sections, current = {}, None
        for line in body.splitlines():
            if line.startswith('### '):
                current = line[4:].strip()
                sections[current] = []
            elif line.startswith(('- ', '1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.')):
                sections.setdefault(current, []).append(re.sub(r'^(- |\d+\. )', '', line))
            elif line.strip() and line.strip() != '---' and not line.startswith('!['):
                sections.setdefault(current, []).append('\0' + line.strip())
        match = re.match(r'(E\d\d) — (.+)', title)
        if match:
            cover = re.search(r'!\[[^\]]*\]\(([^)]+)\)', body).group(1)
            intro = next(l[1:] for l in sections.pop(None) if l.startswith('\0'))
            sections.pop(None, None)
            epics.append({'id': match[1], 'name': match[2], 'cover': cover, 'intro': intro, 'sections': sections})
        elif title.strip() != 'Índice':
            extra.append((title.strip(), sections))
    return epics, extra


def items_of(lines):
    return [l for l in lines if not l.startswith('\0')]


def cover_jpeg(path):
    buf = io.BytesIO()
    Image.open(ROOT / path).convert('RGB').save(buf, 'JPEG', quality=90)
    return buf.getvalue()


def scope_page(doc, epic):
    page = new_page(doc)
    heading(page, plain(f"{epic['id']} · {epic['name']} · escopo"))
    sec = epic['sections']
    if 'Escopo' not in sec:  # E01: grupos de escopo em colunas
        groups = list(sec.items())
        columns = [groups[:2], groups[2:]]
        for col, content in enumerate(columns):
            x, y = 40 + col * 400, 96
            for name, lines in content:
                put(page, x, y, plain(name), 13, WHITE, True)
                y = bullets(page, x, y + 22, items_of(lines), 10.5, 365) + 18
            bottom = y
            assert bottom < H, f"{epic['id']} não coube na página"
        return
    y = bullets(page, 40, 96, items_of(sec['Escopo']), 12, 450)
    assert y < H, f"{epic['id']} não coube na página"
    page.draw_line((522, 84), (522, H - 40), color=PURPLE, width=0.8)
    y = 96
    for name in ('Entidades', 'Depende de', 'Fora de escopo deste épico', 'Referência'):
        if name not in sec:
            continue
        put(page, 546, y, name.replace(' deste épico', ''), 12, CYAN, True)
        y += 20
        for item in items_of(sec[name]):
            y = block(page, 546, y, plain(item), 10, 256) + 3
        y += 16
    assert y < H, f"{epic['id']} (lateral) não coube na página"


def build_pdf():
    epics, extra = parse()
    doc = fitz.open()
    last = epics[-1]['id']

    page = new_page(doc)
    put(page, 40, 80, 'RoleGo', 42, PURPLE)
    put(page, 40, 130, 'Épicos do Produto', 28, WHITE)
    put(page, 40, 170, f'E01 a {last} · gerado a partir de epics.md', 12)
    page.draw_rect(fitz.Rect(40, 200, 220, 206), color=None, fill=CYAN)

    page = new_page(doc)
    put(page, 40, 49, 'Índice', 22, WHITE)
    links = []
    for i, epic in enumerate(epics):
        col = 0 if i < 11 else 1
        x = 40 if col == 0 else 440
        y = 90 + (i if col == 0 else i - 11) * 22
        if i == 11:
            put(page, x, y - 22, 'Fechamento do app', 12, CYAN, True)
        if col == 1:
            y += 4
        put(page, x, y, plain(f"{epic['id']}  ·  {epic['name']}"), 12)
        links.append((fitz.Rect(x, y - 13, x + 360, y + 5), epic['id']))

    start = {}
    for epic in epics:
        start[epic['id']] = len(doc)
        page = new_page(doc)
        heading(page, plain(f"{epic['id']} · {epic['name']}"))
        page.insert_image(fitz.Rect(101, 70, 741, 430), stream=cover_jpeg(epic['cover']))
        y = block(page, 40, 446, plain(epic['intro']), 11, 762)
        assert y < H
        if epic['sections']:
            scope_page(doc, epic)

    # dependências dos módulos de fechamento
    page = new_page(doc)
    heading(page, 'Fechamento do app · mapa dos épicos')
    cols = (40, 270, 530)
    for x, label in zip(cols, ('Épico', 'Entidades', 'Depende de')):
        put(page, x, 100, label, 12, CYAN, True)
    y = 112
    for epic in epics:
        if 'Entidades' not in epic['sections']:
            continue
        page.draw_line((40, y), (802, y), color=PURPLE, width=0.5)
        texts = (f"{epic['id']} · {epic['name']}",
                 ', '.join(i.split('(')[0] for i in items_of(epic['sections']['Entidades'])),
                 '; '.join(items_of(epic['sections']['Depende de'])))
        bottom = max(block(page, x, y + 20, plain(t), 10.5, w) for x, t, w in zip(cols, texts, (215, 245, 272)))
        y = bottom + 2
    assert y < H

    for title, sections in extra:
        page = new_page(doc)
        put(page, 40, 49, plain(title), 20, WHITE)
        y = 90
        for name, lines in sections.items():
            if name:
                y += 12
                put(page, 40, y, plain(name), 13, CYAN, True)
                y += 24
            numbered = title.startswith('Notas')
            run = []
            for line in lines + ['\0']:
                if not line.startswith('\0'):
                    run.append(line)
                    continue
                if run:
                    y = bullets(page, 40, y, run, 12, 762, 'num' if numbered else '·') + 6
                    run = []
                if line[1:]:
                    y = block(page, 40, y, plain(line[1:]), 12, 762) + 8
        assert y < H, f'{title} não coube na página'

    for rect, code in links:
        doc[1].insert_link({'kind': fitz.LINK_GOTO, 'from': rect, 'page': start[code]})
    doc.set_toc([[1, plain(f"{e['id']} · {e['name']}"), start[e['id']] + 1] for e in epics])
    doc.set_metadata({'title': 'RoleGo: épicos do produto'})
    doc.save(ROOT / 'epics.pdf', garbage=4, deflate=True)
    print(f'epics.pdf: {len(doc)} páginas, E01 a {last}')


if __name__ == '__main__':
    if '--sem-capas' not in sys.argv:
        build_covers()
    build_pdf()

"""Helpers compartilhados do kit de identidade RolêGo v4 (manual, posts, stories, motion).
Todos os assets saem de ../logo-v4 (SVGs masters + fotos recortadas) e entram como data URI,
para que cada HTML gerado seja self-contained."""
import base64, os, re, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
V4 = os.path.normpath(os.path.join(HERE, "..", "logo-v4"))
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Tokens de cor (fonte: logo-v4/_build_v4.py + identidade-visual.md)
PURPLE_STOPS = ["#9E19E9", "#6539CB", "#452EFF"]
PURPLE = "linear-gradient(135deg,#9E19E9 0%,#6539CB 50%,#452EFF 100%)"
CYAN, BLUE, BLACK, INK, WHITE, MIST = "#00E5E5", "#3B82F6", "#000000", "#05070F", "#FFFFFF", "#F4F4F8"
GREY, GREY_D, LINE, SURF = "#9CA3AF", "#5B6070", "#1E1E25", "#0F0F13"
MAGENTA, GREEN, YELLOW = "#FF1F7A", "#00FF00", "#FFCC00"
PURPLE_TXT = "#6539CB"  # roxo para texto sobre claro

FONT = "@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;0,800;1,700;1,800;1,900&display=swap');"

MIME = {"svg": "image/svg+xml", "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png"}


def path_of(name):
    for base in (HERE, V4):
        p = os.path.join(base, name)
        if os.path.exists(p):
            return p
    raise FileNotFoundError(name)


def data(raw, ext):
    if isinstance(raw, str):
        raw = raw.encode()
    return f"data:{MIME[ext]};base64," + base64.b64encode(raw).decode()


_cache = {}


def uri(name):
    if name not in _cache:
        p = path_of(name)
        _cache[name] = data(open(p, "rb").read(), p.rsplit(".", 1)[1].lower())
    return _cache[name]


def svg_text(name):
    return open(path_of(name)).read()


def recolor(name, mapping):
    """Troca cores de um SVG master (para usos incorretos e variações de demonstração)."""
    s = svg_text(name)
    for a, b in mapping.items():
        s = s.replace(f'fill="{a}"', f'fill="{b}"')
    return data(s, "svg")


def split_lockup(name="v4-lockup-purple.svg"):
    """Separa Rolê e Go do lockup (mesmo viewBox) para o storyboard de motion."""
    s = svg_text(name)
    head = s.split("<path")[0]
    paths = re.findall(r"<path [^>]+/>", s)
    return data(head + paths[0] + "</svg>", "svg"), data(head + paths[1] + "</svg>", "svg")


def go_pattern(color="#FFFFFF", opacity=0.12, tile=360, size=None):
    """Padrão de símbolos Go em grade deslocada (supergrafismo de fundo)."""
    d = re.search(r' d="([^"]+)"', svg_text("v4-go-white.svg")).group(1)
    h = tile // 2
    g = lambda x, y: f'<path transform="translate({x} {y}) scale(.55)" fill="{color}" fill-opacity="{opacity}" fill-rule="evenodd" d="{d}"/>'
    s = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {tile} {tile}">{g(10, 10)}{g(h + 10, h + 10)}</svg>'
    return data(s, "svg")


def img(name, h=None, w=None, cls="", style=""):
    st = (f"height:{h}px;" if h else "") + (f"width:{w}px;" if w else "") + style
    return f'<img class="{cls}" src="{uri(name)}" style="{st}" alt="">'


def slogan(cls=""):
    return f'<span class="slo {cls}">Viva o <b>rolê.</b></span>'


def shoot(html_path, png_path, w, h):
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
                    f"--window-size={w},{h}", "--virtual-time-budget=9000", f"--screenshot={png_path}",
                    "file://" + html_path], check=True, capture_output=True)


def pdf(html_path, pdf_path):
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--virtual-time-budget=15000",
                    f"--print-to-pdf={pdf_path}", "file://" + html_path], check=True, capture_output=True)


# --- contraste WCAG ---
def _lum(hexc):
    c = [int(hexc[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    c = [x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def contrast(a, b):
    la, lb = sorted((_lum(a), _lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)

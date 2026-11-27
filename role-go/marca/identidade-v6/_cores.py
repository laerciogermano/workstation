"""Paleta da v6 (fonte: ../cores-escolhidas/) e a troca das cores antigas pelas novas.

As páginas herdadas do v5 têm cor escrita no HTML, no CSS e dentro dos SVGs. Em vez de copiar o v5, o build
troca tudo aqui: `patch()` ajusta o _common (constantes, SVGs, posts/stories da v6) e `paleta()` converte o HTML final.
Cores sempre chapadas: os degradês antigos viram uma cor só."""
import os, re

ROXO, CIANO, ROSA = "#6D34CC", "#68E2E3", "#EA3D7A"

HEX = {
    # roxos, violeta e anil → roxo
    "9E19E9": ROXO, "8749FF": ROXO, "6539CB": ROXO, "452EFF": ROXO, "5631B0": ROXO, "4E2AA8": ROXO, "4B2BA0": ROXO, "7A2CF0": ROXO,
    # ciano e azul → ciano
    "00E5E5": CIANO, "3B82F6": CIANO,
    # magenta e vermelho de "não" → rosa
    "FF1F7A": ROSA, "E0245E": ROSA, "B4194A": ROSA,
    # neons de categoria: verde → ciano, amarelo → branco
    "00FF00": CIANO, "FFCC00": "#FFFFFF",
    # selos de contraste (verde/âmbar) e fundos claros coloridos → roxo/cinza neutro
    "0E9F5B": ROXO, "0B7A45": ROXO, "DDF6E9": "#ECECF3", "8A5A00": "#5B6070", "FFF1D6": "#ECECF3", "FDE1E9": "#ECECF3",
    # arroxeados escuros → preto
    "120A24": "#000000", "160B33": "#000000", "14122A": "#000000",
}
RGB = {(158, 25, 233), (101, 57, 203), (69, 46, 255), (60, 10, 140), (40, 10, 90), (60, 25, 120)}


def paleta(s):
    """Troca as cores antigas pelas da v6 num trecho de HTML, CSS ou SVG."""
    s = re.sub(r"#([0-9A-Fa-f]{6})(?![0-9A-Fa-f])", lambda m: HEX.get(m.group(1).upper(), m.group(0)), s)

    def rgb(m):
        c = tuple(int(x) for x in m.group(1, 2, 3))
        if c in RGB:
            return "rgba(109,52,204"
        if c == (0, 229, 229):
            return "rgba(104,226,227"
        return m.group(0)

    return re.sub(r"rgba\(\s*(\d+),\s*(\d+),\s*(\d+)", rgb, s)


def svg(s):
    """Recolore um SVG e transforma degradês de uma cor só em preenchimento chapado."""
    s = paleta(s)
    for m in list(re.finditer(r'<linearGradient id="([^"]+)"[^>]*>(.*?)</linearGradient>', s, re.S)):
        cores = set(re.findall(r'stop-color="([^"]+)"', m.group(2)))
        if len(cores) == 1:
            s = s.replace(m.group(0), "").replace(f"url(#{m.group(1)})", cores.pop())
    return s


def patch(C, out):
    """Aplica a paleta ao módulo _common do v5. Chamar antes de `from _common import *`."""
    flat = f"linear-gradient(135deg,{ROXO},{ROXO})"  # chapado, mas válido onde o v5 espera uma imagem
    C.PURPLE, C.PURPLE_STOPS, C.PURPLE_TXT = flat, [ROXO, ROXO], ROXO
    C.CYAN, C.BLUE, C.MAGENTA, C.GREEN, C.YELLOW = CIANO, CIANO, ROSA, CIANO, "#FFFFFF"
    data, path_of = C.data, C.path_of

    def data_v6(raw, ext):
        if ext == "svg":
            raw = svg(raw.decode() if isinstance(raw, bytes) else raw)
        return data(raw, ext)

    def path_of_v6(name):
        p = os.path.join(out, name)  # posts/ e stories/ regerados ficam na pasta da v6
        return p if os.path.exists(p) else path_of(name)

    C.data, C.path_of = data_v6, path_of_v6

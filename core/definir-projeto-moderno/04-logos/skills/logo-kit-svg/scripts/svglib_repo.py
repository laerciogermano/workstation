"""Shared helpers for logo-kit-svg SVG audit and kit scripts."""

from __future__ import annotations

import os
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
LIBRARY_DIR = ROOT / "library"
CATALOG_PATH = LIBRARY_DIR / "catalog.json"
EXAMPLES_CATALOG = ROOT / "examples" / "catalog.json"

SVG_NS = {"svg": "http://www.w3.org/2000/svg"}
RAW_UTF8_IN_TEXT = re.compile(r"[·→✓]")
INVALID_COMMENT = re.compile(r"<!--(?:[^-]|-[^-])*--")
DOUBLE_HYPHEN_IN_COMMENT = re.compile(r"<!--[\s\S]*?--[\s\S]*?-->")

ICON_VIEWBOX = (0.0, 0.0, 512.0, 512.0)
BANNER_VIEWBOX = (0.0, 0.0, 904.0, 256.0)


def load_svg(path: Path) -> tuple[str, ET.Element]:
    raw = path.read_text(encoding="utf-8")
    root = ET.fromstring(raw)
    return raw, root


def parse_viewbox(root: ET.Element) -> tuple[float, float, float, float] | None:
    vb = root.get("viewBox")
    if not vb:
        return None
    parts = [float(p) for p in vb.replace(",", " ").split()]
    if len(parts) != 4:
        return None
    return tuple(parts)


def viewbox_matches(vb: tuple[float, float, float, float], expected: tuple[float, float, float, float], tol: float = 0.5) -> bool:
    return all(abs(a - b) <= tol for a, b in zip(vb, expected))


def element_counts(root: ET.Element) -> dict[str, int]:
    counts: dict[str, int] = {}
    for el in root.iter():
        tag = el.tag.split("}")[-1] if "}" in el.tag else el.tag
        counts[tag] = counts.get(tag, 0) + 1
    return counts


def has_reduced_motion_media(raw: str) -> bool:
    return "prefers-reduced-motion" in raw and "reduce" in raw


def find_raw_utf8_in_text(raw: str) -> list[str]:
    hits = []
    for m in re.finditer(r"<text[^>]*>([^<]*)</text>", raw):
        if RAW_UTF8_IN_TEXT.search(m.group(1)):
            hits.append(m.group(1)[:40])
    return hits


def invalid_xml_comments(raw: str) -> bool:
    for m in re.finditer(r"<!--([\s\S]*?)-->", raw):
        if "--" in m.group(1):
            return True
    return False


def stripe_heuristic(raw: str) -> bool:
    if re.search(r"repeating-linear-gradient|patternUnits", raw, re.I):
        return True
    dashed_lines = re.findall(r"<line\b[^>]*stroke-dasharray", raw, re.I)
    return len(dashed_lines) >= 3


def pill_width_chars(text: str) -> float:
    return len(text) * 7.2 + 32


def embed_href(asset: Path, host_svg: Path) -> str:
    """Path for <image href> relative to the host SVG file (works in browser/file preview)."""
    return os.path.relpath(asset.resolve(), host_svg.resolve().parent).replace("\\", "/")


def _svg_inner_raw(mark: Path) -> str:
    raw = mark.read_text(encoding="utf-8")
    m = re.search(r"<svg\b[^>]*>(.*)</svg>", raw, re.IGNORECASE | re.DOTALL)
    if not m:
        _, root = load_svg(mark)
        return "".join(ET.tostring(child, encoding="unicode") for child in root)
    return m.group(1).strip()


def viewbox_attr(root: ET.Element, fallback: tuple[float, float, float, float] = ICON_VIEWBOX) -> str:
    vb = parse_viewbox(root) or fallback
    return " ".join(str(v) for v in vb)


def viewbox_from_file(mark: Path) -> str:
    _, root = load_svg(mark)
    return viewbox_attr(root)


def nested_mark(mark: Path, x: float, y: float, size: float) -> str:
    """Paste mark into a nested <svg> (self-contained; works in IDE preview)."""
    return (
        f'<svg x="{x}" y="{y}" width="{size}" height="{size}" '
        f'viewBox="{viewbox_from_file(mark)}" overflow="hidden">{_svg_inner_raw(mark)}</svg>'
    )


def symbol_from_mark(mark: Path, symbol_id: str) -> str:
    inner = _svg_inner_raw(mark)
    return f'<symbol id="{symbol_id}" viewBox="{viewbox_from_file(mark)}">{inner}</symbol>'


def use_symbol(symbol_id: str, x: float, y: float, width: float, height: float) -> str:
    return f'<use href="#{symbol_id}" xlink:href="#{symbol_id}" x="{x}" y="{y}" width="{width}" height="{height}"/>'

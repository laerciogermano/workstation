#!/usr/bin/env python3
"""Generate a static HTML preview sheet (medium+ kit)."""

from __future__ import annotations

import argparse
import html
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT = ROOT / "assets" / "kit" / "preview_sheet_lite.html"

_STYLE = """
body{font-family:IBM Plex Sans,system-ui,sans-serif;background:#12181f;color:#eef2f6;padding:28px 20px 40px;max-width:1100px;margin:0 auto}
h1{font-size:1.5rem;margin:0 0 24px}
h2{font-size:1.05rem;color:#9eb3d4;margin:28px 0 12px}
.row{display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap;margin-bottom:12px}
.card{background:#1a2229;border:1px solid #2d3844;border-radius:10px;padding:12px}
.card img{display:block;border-radius:6px;max-width:100%}
.card figcaption{font-size:11px;color:#5c6b7a;margin-top:6px;font-family:ui-monospace,monospace}
.muted{color:#8b99a8;font-size:13px;margin:0 0 12px}
"""


def _rel(path: Path, base: Path) -> str:
    return html.escape(os.path.relpath(path.resolve(), base.resolve()).replace("\\", "/"))


def _figure(base: Path, path: Path, width: str | None = None, label: str | None = None) -> str:
    if not path.is_file():
        return ""
    src = _rel(path, base)
    w = f' width="{width}"' if width else ""
    cap = html.escape(label or path.name)
    return f'<figure class="card"><img src="{src}" alt="{cap}"{w}/><figcaption>{cap}</figcaption></figure>'


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--icon", type=Path, default=ROOT / "assets" / "icon.svg")
    ap.add_argument("--banner", type=Path, default=ROOT / "assets" / "logo.svg")
    ap.add_argument("--kit-dir", type=Path, help="Kit folder (concept sheet, tiles, platform, social)")
    ap.add_argument("-o", "--output", type=Path, default=DEFAULT_OUT)
    args = ap.parse_args()

    for p in (args.icon, args.banner):
        if not p.is_file():
            print(f"preview_sheet_lite: missing {p}", file=sys.stderr)
            raise SystemExit(1)

    out_base = args.output.resolve().parent
    out_base.mkdir(parents=True, exist_ok=True)
    kit = args.kit_dir.resolve() if args.kit_dir else out_base

    parts: list[str] = [
        "<h1>Brand preview</h1>",
        "<h2>README deliverables</h2>",
        '<p class="muted">Icon ladder + banner (static).</p>',
        '<div class="row">',
        _figure(out_base, args.icon, "16", "icon 16"),
        _figure(out_base, args.icon, "32", "icon 32"),
        _figure(out_base, args.icon, "64", "icon 64"),
        _figure(out_base, args.icon, "128", "icon 128"),
        "</div>",
        '<div class="row">',
        _figure(out_base, args.banner, "904", "logo.svg"),
        "</div>",
    ]

    concept_marks = sorted((kit / "concepts").glob("*.svg")) if (kit / "concepts").is_dir() else []
    if concept_marks:
        parts.extend(['<h2>Concept marks</h2>', '<p class="muted">Explore directions (before final pick).</p>', '<div class="row">'])
        for p in concept_marks:
            parts.append(_figure(out_base, p, "128", p.stem))
        parts.append("</div>")

    concepts = [
        ("Concept sheet", kit / "concept-sheet.svg"),
        ("Tiles (directions)", kit / "tiles-board-directions.svg"),
        ("Tiles (final)", kit / "tiles-board.svg"),
        ("Wordmark", kit / "wordmark.svg"),
    ]
    concept_html = "".join(_figure(out_base, p, label=label) for label, p in concepts)
    if concept_html:
        parts.extend(['<h2>Concepts &amp; boards</h2>', '<div class="row">', concept_html, "</div>"])

    platform_rows = [
        ("favicon.ico", kit / "platform" / "web" / "favicon.ico"),
        ("favicon 32", kit / "platform" / "web" / "favicon-32x32.png"),
        ("iOS App Store (1024)", kit / "platform" / "ios" / "AppIcon.appiconset" / "icon-1024.png"),
        ("iOS Home (180)", kit / "platform" / "ios" / "apple-touch-icon.png"),
        ("Android chrome 192", kit / "platform" / "android" / "android-chrome-192x192.png"),
        ("Android adaptive launcher", kit / "platform" / "android" / "mipmap-xxxhdpi" / "ic_launcher.png"),
        ("Shape preview", kit / "platform" / "platform-shape-preview.html"),
    ]
    plat_html = ""
    seen: set[str] = set()
    for label, p in platform_rows:
        if not p.is_file() or str(p) in seen:
            continue
        seen.add(str(p))
        if p.suffix.lower() in (".html", ".ico"):
            plat_html += (
                f'<p class="muted"><a href="{_rel(p, out_base)}" style="color:#9eb3d4">{label}</a></p>'
            )
        else:
            plat_html += _figure(out_base, p, "96", label)
    if plat_html:
        parts.extend(['<h2>Platform (PNG)</h2>', '<div class="row">', plat_html, "</div>"])

    social_svgs = sorted((kit / "social").glob("*.svg")) if (kit / "social").is_dir() else []
    if social_svgs:
        parts.append("<h2>Social cards (SVG + PNG)</h2>")
        parts.append('<div class="row">')
        for svg in social_svgs:
            parts.append(_figure(out_base, svg, "280", svg.stem + ".svg"))
            png = svg.with_suffix(".png")
            if png.is_file():
                parts.append(_figure(out_base, png, "280", png.name))
        parts.append("</div>")

    doc = f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Brand preview (lite sheet)</title><style>{_STYLE}</style></head><body>
{''.join(parts)}
</body></html>"""
    args.output.write_text(doc, encoding="utf-8")
    print(args.output)


if __name__ == "__main__":
    main()

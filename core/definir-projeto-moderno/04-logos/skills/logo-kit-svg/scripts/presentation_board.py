#!/usr/bin/env python3
"""Render a presentation board HTML page from JSON spec (full kit)."""

from __future__ import annotations

import argparse
import html
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

_DEFAULT_STYLE = """
body{font-family:IBM Plex Sans,system-ui,sans-serif;max-width:1040px;margin:0 auto;padding:32px 20px 48px;background:#12181f;color:#eef2f6}
h1{font-size:1.75rem;font-weight:700;margin:0 0 8px}
h2{font-size:1.15rem;font-weight:600;margin:32px 0 8px;color:#9eb3d4}
p{color:#8b99a8;line-height:1.5;margin:0 0 16px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin:16px 0 24px}
figure{margin:0;padding:12px;background:#1a2229;border:1px solid #2d3844;border-radius:12px}
figure img{display:block;width:100%;height:auto;border-radius:8px}
figcaption{font-size:11px;color:#5c6b7a;margin-top:8px;font-family:ui-monospace,monospace}
"""


def _href(spec_dir: Path, out_dir: Path, asset: str) -> str:
    src = (spec_dir / asset).resolve()
    if not src.is_file():
        return html.escape(asset)
    rel = os.path.relpath(src, out_dir.resolve()).replace("\\", "/")
    return html.escape(rel)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("spec", type=Path, nargs="?", default=ROOT / "templates" / "presentation-spec.example.json")
    ap.add_argument("-o", "--output", type=Path, default=ROOT / "assets" / "kit" / "presentation-board.html")
    args = ap.parse_args()

    if not args.spec.is_file():
        print(f"presentation_board: missing {args.spec}", file=sys.stderr)
        raise SystemExit(1)

    spec = json.loads(args.spec.read_text(encoding="utf-8"))
    spec_dir = args.spec.resolve().parent
    out_dir = args.output.resolve().parent
    out_dir.mkdir(parents=True, exist_ok=True)

    title = html.escape(spec.get("title", "Brand presentation"))
    theme_bg = html.escape(spec.get("theme_bg", "#12181f"))
    style = _DEFAULT_STYLE.replace("#12181f", theme_bg)

    blocks: list[str] = []
    for sec in spec.get("sections", []):
        heading = html.escape(sec.get("heading", ""))
        blocks.append(f"<h2>{heading}</h2>")
        if sec.get("body"):
            blocks.append(f"<p>{html.escape(sec['body'])}</p>")
        assets = sec.get("assets", [])
        if assets:
            blocks.append('<div class="grid">')
            for asset in assets:
                path = _href(spec_dir, out_dir, asset)
                label = html.escape(Path(asset).name)
                blocks.append(
                    f'<figure><img src="{path}" alt="{label}"/>'
                    f'<figcaption>{label}</figcaption></figure>'
                )
            blocks.append("</div>")

    doc = f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>{title}</title><style>{style}</style></head><body>
<h1>{title}</h1>
{''.join(blocks)}
</body></html>"""
    args.output.write_text(doc, encoding="utf-8")
    print(args.output)


if __name__ == "__main__":
    main()

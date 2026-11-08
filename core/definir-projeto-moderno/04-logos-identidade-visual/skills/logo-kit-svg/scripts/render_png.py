#!/usr/bin/env python3
"""Rasterize an SVG to PNG (rsvg-convert or ImageMagick)."""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path


def render(src: Path, dest: Path, width: int | None, height: int | None) -> bool:
    if shutil.which("rsvg-convert"):
        cmd = ["rsvg-convert", str(src), "-o", str(dest)]
        if width:
            cmd.extend(["-w", str(width)])
        if height:
            cmd.extend(["-h", str(height)])
        subprocess.run(cmd, check=True)
        return True
    if shutil.which("magick"):
        subprocess.run(["magick", str(src), str(dest)], check=True)
        return True
    return False


_EPILOG = """
Gallery (logo-design-style docs/images):
  python3 scripts/render_png.py assets/kit/concept-sheet.svg -o docs/images/<slug>-concepts.png -w 1200
  python3 scripts/render_png.py assets/kit/tiles-board.svg -o docs/images/<slug>-board.png -w 1200
"""


def main() -> None:
    ap = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=_EPILOG,
    )
    ap.add_argument("svg", type=Path)
    ap.add_argument("-o", "--output", type=Path, required=True)
    ap.add_argument("-w", "--width", type=int)
    ap.add_argument("--height", type=int)
    args = ap.parse_args()

    if not args.svg.is_file():
        print(f"render_png: missing {args.svg}", file=sys.stderr)
        raise SystemExit(1)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    if not render(args.svg, args.output, args.width, args.height):
        print("render_png: install rsvg-convert or magick", file=sys.stderr)
        raise SystemExit(2)
    print(args.output)


if __name__ == "__main__":
    main()

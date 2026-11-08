#!/usr/bin/env python3
"""Compose a tiles board SVG (concept comparison or final mark size ladder)."""

from __future__ import annotations

import argparse
import html
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_SCRIPTS = Path(__file__).resolve().parent
if str(_SCRIPTS) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS))

from svglib_repo import BANNER_VIEWBOX, _svg_inner_raw, load_svg, nested_mark, viewbox_attr  # noqa: E402

DEFAULT_OUT = ROOT / "assets" / "kit" / "tiles-board.svg"


def board_concepts(
    marks: list[Path],
    names: list[str],
    notes: list[str],
    recommend: int,
    title: str,
    output: Path,
) -> str:
    cols = len(marks)
    cell = 220
    width = cols * cell + 48
    height = 320
    lines = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}">',
        f'<rect width="{width}" height="{height}" fill="#12100c"/>',
        f'<text x="24" y="32" fill="#f0e6d2" font-family="system-ui,sans-serif" font-size="16" font-weight="600">{html.escape(title)}</text>',
    ]
    for i, mark in enumerate(marks):
        x = 24 + i * cell
        y = 56
        name = names[i] if i < len(names) else mark.stem
        note = notes[i] if i < len(notes) else ""
        rec = " ★" if (i + 1) == recommend else ""
        lines.append(nested_mark(mark.resolve(), x, y, 180))
        lines.append(
            f'<text x="{x}" y="{y + 200}" fill="#f0e6d2" font-size="12" font-weight="600">{html.escape(name)}{rec}</text>'
        )
        if note:
            lines.append(
                f'<text x="{x}" y="{y + 218}" fill="#a99b83" font-size="10">{html.escape(note[:48])}</text>'
            )
    lines.append("</svg>")
    return "\n".join(lines)


def board_final(icon: Path, banner: Path, title: str, output: Path) -> str:
    width, height = 920, 280
    _, banner_root = load_svg(banner)
    banner_inner = _svg_inner_raw(banner)
    vb_b = viewbox_attr(banner_root, BANNER_VIEWBOX)
    return "\n".join(
        [
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}">',
            f'<rect width="{width}" height="{height}" fill="#12100c"/>',
            f'<text x="24" y="32" fill="#f0e6d2" font-size="16" font-weight="600">{html.escape(title)}</text>',
            nested_mark(icon, 24, 56, 128),
            nested_mark(icon, 168, 88, 64),
            nested_mark(icon, 248, 104, 32),
            nested_mark(icon, 296, 112, 16),
            f'<svg x="340" y="56" width="560" height="158" viewBox="{vb_b}" overflow="hidden" preserveAspectRatio="xMidYMid meet">',
            banner_inner,
            "</svg>",
            "</svg>",
        ]
    )


_EPILOG = """
Modes (pick one):
  Checkpoint 3-up:  --marks concept-a.svg concept-b.svg concept-c.svg --names "A" "B" "C"
  Final ladder:   --icon assets/icon.svg --banner assets/logo.svg
"""


def main() -> None:
    ap = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=_EPILOG,
    )
    ap.add_argument("--title", default="Tiles board")
    ap.add_argument("--marks", nargs="+", type=Path, help="Concept marks for comparison row")
    ap.add_argument("--names", nargs="+", default=[])
    ap.add_argument("--notes", nargs="+", default=[])
    ap.add_argument("--recommend", type=int, default=1)
    ap.add_argument("--icon", type=Path, help="Final icon for size ladder + banner layout")
    ap.add_argument("--banner", type=Path, help="Final banner beside ladder")
    ap.add_argument("-o", "--output", type=Path, default=DEFAULT_OUT)
    args = ap.parse_args()

    args.output = args.output.resolve()

    if args.marks:
        svg = board_concepts(args.marks, args.names, args.notes, args.recommend, args.title, args.output)
    elif args.icon and args.banner:
        if not args.icon.is_file() or not args.banner.is_file():
            print("tiles_board: missing icon or banner", file=sys.stderr)
            raise SystemExit(1)
        svg = board_final(args.icon.resolve(), args.banner.resolve(), args.title, args.output)
    else:
        print("tiles_board: pass --marks … or --icon and --banner", file=sys.stderr)
        raise SystemExit(1)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(svg, encoding="utf-8")
    print(args.output)


if __name__ == "__main__":
    main()

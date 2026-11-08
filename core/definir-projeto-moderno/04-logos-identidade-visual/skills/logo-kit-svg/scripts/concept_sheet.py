#!/usr/bin/env python3
"""Write a self-contained SVG concept board (marks inlined as nested SVG)."""

from __future__ import annotations

import argparse
import html
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_SCRIPTS = Path(__file__).resolve().parent
if str(_SCRIPTS) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS))

from svglib_repo import nested_mark  # noqa: E402

DEFAULT_OUT = ROOT / "assets" / "kit" / "concept-sheet.svg"


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("marks", nargs="+", type=Path, help="Concept mark SVGs")
    ap.add_argument("--names", nargs="+", default=[])
    ap.add_argument("--notes", nargs="+", default=[])
    ap.add_argument("--recommend", type=int, default=1)
    ap.add_argument("-o", "--output", type=Path, default=DEFAULT_OUT)
    args = ap.parse_args()

    output = args.output.resolve()
    marks = [p.resolve() for p in args.marks if p.is_file()]
    if not marks:
        print("concept_sheet: no mark files", file=sys.stderr)
        raise SystemExit(1)

    cols = min(3, len(marks))
    cell = 220
    width = cols * cell + 48
    height = cell + 120
    parts = [
        '<svg xmlns="http://www.w3.org/2000/svg" '
        f'viewBox="0 0 {width} {height}">',
        '<rect width="100%" height="100%" fill="#12100c"/>',
        '<text x="24" y="32" fill="#f0e6d2" font-family="system-ui" font-size="16" font-weight="600">Concept sheet</text>',
    ]
    for i, path in enumerate(marks):
        x = 24 + (i % cols) * cell
        y = 52
        name = args.names[i] if i < len(args.names) else path.stem
        note = args.notes[i] if i < len(args.notes) else ""
        rec = " ★ recommended" if (i + 1) == args.recommend else ""
        parts.append(nested_mark(path, x, y, 180))
        parts.append(
            f'<text x="{x}" y="{y + 196}" fill="#f0e6d2" font-size="11" font-weight="600">{html.escape(name)}{rec}</text>'
        )
        if note:
            parts.append(f'<text x="{x}" y="{y + 214}" fill="#a99b83" font-size="10">{html.escape(note[:56])}</text>')
    parts.append("</svg>")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("\n".join(parts), encoding="utf-8")
    print(output)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Export mono and reversed symbol SVGs from assets/icon.svg."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SRC = ROOT / "assets" / "icon.svg"
OUT_DIR = ROOT / "assets" / "kit"


def invert_fills(svg: str) -> str:
    return re.sub(r'fill="#([0-9a-fA-F]{3,8})"', 'fill="#ffffff"', svg)


def mono_fills(svg: str) -> str:
    return re.sub(r'fill="#([0-9a-fA-F]{3,8})"', 'fill="#000000"', svg)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--src", type=Path, default=DEFAULT_SRC)
    ap.add_argument("--out-dir", type=Path, default=OUT_DIR)
    args = ap.parse_args()

    if not args.src.is_file():
        print(f"export_variants: missing {args.src}", file=sys.stderr)
        raise SystemExit(1)

    raw = args.src.read_text(encoding="utf-8")
    args.out_dir.mkdir(parents=True, exist_ok=True)
    (args.out_dir / "icon-mono.svg").write_text(mono_fills(raw), encoding="utf-8")
    (args.out_dir / "icon-reversed.svg").write_text(invert_fills(raw), encoding="utf-8")
    print(args.out_dir / "icon-mono.svg")
    print(args.out_dir / "icon-reversed.svg")


if __name__ == "__main__":
    main()

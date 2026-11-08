#!/usr/bin/env python3
"""Rasterize icon and banner SVGs for visual QA."""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ICON = ROOT / "assets" / "icon.svg"
DEFAULT_BANNER = ROOT / "assets" / "logo.svg"
OUT_ICON = Path("/tmp/logo-qa-icon.png")
OUT_BANNER = Path("/tmp/logo-qa-banner.png")


def run_rsvg(icon: Path, banner: Path, out_icon: Path, out_banner: Path) -> bool:
    if not shutil.which("rsvg-convert"):
        return False
    subprocess.run(
        ["rsvg-convert", "-w", "1024", "-h", "1024", str(icon), "-o", str(out_icon)],
        check=True,
    )
    subprocess.run(
        ["rsvg-convert", "-w", "1808", "-h", "512", str(banner), "-o", str(out_banner)],
        check=True,
    )
    return True


def run_magick(icon: Path, banner: Path, out_icon: Path, out_banner: Path) -> bool:
    if not shutil.which("magick"):
        return False
    subprocess.run(["magick", str(icon), str(out_icon)], check=True)
    subprocess.run(["magick", str(banner), str(out_banner)], check=True)
    return True


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--icon", type=Path, default=DEFAULT_ICON)
    ap.add_argument("--banner", type=Path, default=DEFAULT_BANNER)
    ap.add_argument("--out-icon", type=Path, default=OUT_ICON)
    ap.add_argument("--out-banner", type=Path, default=OUT_BANNER)
    args = ap.parse_args()

    for p in (args.icon, args.banner):
        if not p.is_file():
            print(f"render_qa: missing {p}", file=sys.stderr)
            raise SystemExit(1)

    if run_rsvg(args.icon, args.banner, args.out_icon, args.out_banner):
        print(args.out_icon)
        print(args.out_banner)
        return
    if run_magick(args.icon, args.banner, args.out_icon, args.out_banner):
        print(args.out_icon)
        print(args.out_banner)
        return

    print("render_qa: skipped (install rsvg-convert or ImageMagick magick)", file=sys.stderr)
    raise SystemExit(0)


if __name__ == "__main__":
    main()

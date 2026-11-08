#!/usr/bin/env python3
"""Optional: copy slugs from a local Simple Icons clone into library/svg/."""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SLUGS = ROOT / "library-slugs.txt"
SVG_DIR = ROOT / "library" / "svg"
DEFAULT_CLONE = Path("/tmp/simple-icons")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--icons-dir", type=Path, help="Path to simple-icons/icons directory")
    ap.add_argument("--clone", action="store_true", help="git clone simple-icons to /tmp if missing")
    args = ap.parse_args()

    icons_dir = args.icons_dir
    if icons_dir is None:
        if args.clone and not (DEFAULT_CLONE / "icons").is_dir():
            subprocess.run(
                ["git", "clone", "--depth", "1", "https://github.com/simple-icons/simple-icons.git", str(DEFAULT_CLONE)],
                check=True,
            )
        icons_dir = DEFAULT_CLONE / "icons"

    if not icons_dir.is_dir():
        print("sync_library: icons directory not found; use --clone or --icons-dir", file=sys.stderr)
        raise SystemExit(1)

    if not SLUGS.is_file():
        print(f"sync_library: missing {SLUGS}", file=sys.stderr)
        raise SystemExit(1)

    SVG_DIR.mkdir(parents=True, exist_ok=True)
    copied = 0
    for line in SLUGS.read_text(encoding="utf-8").splitlines():
        slug = line.strip()
        if not slug or slug.startswith("#"):
            continue
        src = icons_dir / f"{slug}.svg"
        if not src.is_file():
            print(f"sync_library: skip missing slug {slug}", file=sys.stderr)
            continue
        shutil.copy2(src, SVG_DIR / f"{slug}.svg")
        copied += 1

    print(f"sync_library: copied {copied} files")
    build = ROOT / "scripts" / "build_catalog.py"
    if build.is_file():
        subprocess.run([sys.executable, str(build)], check=True)


if __name__ == "__main__":
    main()
